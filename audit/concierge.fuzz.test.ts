// Audit only: property-based fuzzing of the concierge logic with fast-check.
// Run: node --experimental-strip-types --test audit/concierge.fuzz.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import type { PriceDataset } from '../src/types.ts';
import {
  NEEDLE_MENUS,
  RESIDENT_AREAS,
  allowedDowntimeDays,
  planConcierge,
  type ConciergeAnswers,
  type ConciergeConcernId
} from '../src/lib/concierge.ts';
import { aiResultToParse, budgetForVisitor, parseConciergeText } from '../src/lib/concierge-parse.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataset: PriceDataset = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/data/prices.json'), 'utf8'));
const CONCERNS: ConciergeConcernId[] = ['pores', 'glow', 'lift', 'dry', 'jaw', 'skinbase'];
const RUNS = 1000;

const answersArb = fc.record({
  visitor: fc.constantFrom('traveler' as const, 'resident' as const),
  budget: fc.option(fc.integer({ min: 1, max: 2_000_000 }), { nil: null }),
  timing: fc.constantFrom('soon' as const, 'few' as const, 'free' as const),
  areaId: fc.option(fc.constantFrom(...RESIDENT_AREAS), { nil: null }),
  concerns: fc.uniqueArray(fc.constantFrom(...CONCERNS), { maxLength: 6 }),
  noNeedle: fc.boolean()
});
const rateArb = fc.double({ min: 700, max: 1100, noNaN: true });

test('fuzz planConcierge: never over budget / downtime / needle, sums consistent, no crash', () => {
  fc.assert(
    fc.property(answersArb, rateArb, fc.boolean(), (answers: ConciergeAnswers, rate, includeVat) => {
      const r = planConcierge(answers, dataset, { krwPer100Jpy: rate, includeVat });
      const spent = (krw: number, jpy: number) => (answers.visitor === 'traveler' ? jpy : krw);
      const picks = [r.best, ...(r.combo?.items ?? [])].filter((p) => p !== null);
      for (const p of picks) {
        if (answers.budget !== null) assert.ok(spent(p.row.totalKrw, p.row.krTotalJpy) <= answers.budget, 'pick over budget');
        assert.ok(p.downtimeDays <= allowedDowntimeDays(answers.visitor, answers.timing), 'downtime');
        if (answers.noNeedle) assert.ok(!NEEDLE_MENUS.has(p.menu.id), 'needle');
        assert.ok(Number.isFinite(p.row.totalKrw) && p.row.totalKrw > 0, 'price finite');
      }
      if (r.combo) {
        assert.equal(r.combo.totalKrw, r.combo.items.reduce((s, o) => s + o.row.totalKrw, 0));
        assert.equal(new Set(r.combo.items.map((o) => o.menu.id)).size, r.combo.items.length, 'duplicate menu in set');
        if (answers.budget !== null) {
          assert.ok(spent(r.combo.totalKrw, r.combo.totalJpy) <= answers.budget, 'combo over budget');
          assert.ok((r.combo.remaining ?? 0) >= 0, 'negative remaining');
        }
        if (r.combo.sameClinic) assert.equal(new Set(r.combo.items.map((o) => o.row.place.id)).size, 1);
      }
      if (r.best === null && r.cheapestOverBudget && answers.budget !== null) {
        assert.ok(spent(r.cheapestOverBudget.row.totalKrw, r.cheapestOverBudget.row.krTotalJpy) > answers.budget);
      }
    }),
    { numRuns: RUNS }
  );
});

const TOKENS = [
  '毛穴', 'ツヤ', 'たるみ', 'エラ', '乾燥', '肌育', '針', 'こわい', '注射', '苦手', '1万', '5千円', '3万ウォン', '₩50,000',
  '¥20,000', '明日', '明後日', 'あと4日', '来週', '帰国', '旅行', '留学', 'ワーホリ', '新村', '江南', '弘大', '妊娠',
  '모공', '윤기', '탄력', '사각턱', '바늘', '무서워', '5만원', '1만 엔', '내일', '모레', '3일 뒤', '다음 주', '유학생',
  '신촌', '강남', '임신', '2cc', '300ショット', '3泊4日', '、', '。', ' ', '!', '?', '0', '999999999999', '1.5万'
];
const sentenceArb = fc.oneof(
  fc.array(fc.constantFrom(...TOKENS), { maxLength: 30 }).map((a) => a.join('')),
  fc.string({ unit: 'grapheme', maxLength: 300 }),
  fc.string({ maxLength: 300 })
);

test('fuzz parseConciergeText: valid shapes, no crash, fast on 300-char input', () => {
  fc.assert(
    fc.property(sentenceArb, (text) => {
      const t0 = performance.now();
      const p = parseConciergeText(text);
      const ms = performance.now() - t0;
      assert.ok(ms < 50, `slow parse ${ms.toFixed(1)}ms`);
      assert.ok(p.fieldCount >= 0 && p.fieldCount <= 6);
      if (p.budget && p.budget.amount !== null) assert.ok(Number.isFinite(p.budget.amount) && p.budget.amount > 0, 'bad amount');
      if (p.concerns) for (const c of p.concerns) assert.ok(CONCERNS.includes(c));
      if (p.areaId) assert.ok((RESIDENT_AREAS as readonly string[]).includes(p.areaId));
      if (p.budget) {
        for (const v of ['traveler', 'resident'] as const) {
          const b = budgetForVisitor(v, p.budget, 850);
          assert.ok(b === null || (Number.isFinite(b) && b >= 0), 'converted budget');
        }
      }
    }),
    { numRuns: RUNS * 3 }
  );
});

test('fuzz aiResultToParse: any JSON-ish input never crashes and only yields known values', () => {
  fc.assert(
    fc.property(fc.anything(), (raw) => {
      const p = aiResultToParse(raw);
      assert.ok(p.fieldCount >= 0 && p.fieldCount <= 6);
      if (p.visitor) assert.ok(p.visitor === 'traveler' || p.visitor === 'resident');
      if (p.concerns) for (const c of p.concerns) assert.ok(CONCERNS.includes(c));
    }),
    { numRuns: RUNS * 2 }
  );
});
