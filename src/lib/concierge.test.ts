import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ComputedRow, PriceDataset } from '../types.ts';
import { computeRow } from './calc.ts';
import {
  DOWNTIME_MAX_DAYS,
  NEEDLE_MENUS,
  allowedDowntimeDays,
  candidateMenuIds,
  treatmentMinutes,
  planConcierge,
  type ConciergeAnswers
} from './concierge.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataset: PriceDataset = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/prices.json'), 'utf8')
);
const options = { krwPer100Jpy: dataset.meta.defaultKrwPer100Jpy, includeVat: true };

const traveler: ConciergeAnswers = {
  visitor: 'traveler',
  budget: 10000,
  timing: 'few',
  areaId: null,
  concerns: ['pores', 'lift'],
  noNeedle: true
};

const resident: ConciergeAnswers = {
  visitor: 'resident',
  budget: 50000,
  timing: 'soon',
  areaId: 'sinchon',
  concerns: ['pores', 'glow'],
  noNeedle: false
};

function assertPriceMatchesRanking(row: ComputedRow) {
  const again = computeRow(row.place, row.menu, options.krwPer100Jpy, options.includeVat, dataset.meta.vatRate, 0, 0);
  assert.ok(again);
  assert.equal(row.totalKrw, again.totalKrw);
  assert.equal(row.krTotalJpy, again.krTotalJpy);
}

test('concierge: every downtime and needle entry refers to a real treatment', () => {
  const ids = new Set(dataset.menus.map((m) => m.id));
  for (const id of Object.keys(DOWNTIME_MAX_DAYS)) assert.ok(ids.has(id), id);
  for (const id of NEEDLE_MENUS) assert.ok(ids.has(id), id);
  assert.equal(Object.keys(DOWNTIME_MAX_DAYS).length, dataset.menus.length);
  assert.equal(candidateMenuIds([], dataset).length, dataset.menus.length);
});

test('concierge traveler: ¥10,000, flight in 2 days, no needles → Shrink, one-visit Shrink + Aqua Peel set', () => {
  const r = planConcierge(traveler, dataset, options);
  assert.equal(r.best?.menu.id, 'shrink-300');
  assert.ok(r.best!.row.place.japaneseSupport);
  assertPriceMatchesRanking(r.best!.row);

  assert.ok(r.combo);
  assert.ok(r.combo.sameClinic);
  assert.deepEqual(r.combo.items.map((o) => o.menu.id).sort(), ['aquapeel', 'shrink-300']);
  assert.ok(r.combo.totalJpy <= 10000);
  assert.equal(r.combo.remaining, 10000 - r.combo.totalJpy);
  assert.equal(r.combo.saveJpy, r.combo.jpTotalJpy - r.combo.totalJpy);
  for (const o of r.combo.items) assertPriceMatchesRanking(o.row);

  const reasons = Object.fromEntries(r.excluded.map((e) => [e.menu.id, e.reason]));
  assert.equal(reasons['inmode-fx'], 'downtime');
  assert.equal(reasons.potenza, 'needle');
  assert.equal(reasons['juvelook-2cc'], 'needle');
});

test('concierge never recommends over budget, too much downtime, or needles when refused', () => {
  for (const budget of [5000, 10000, 30000, null]) {
    for (const timing of ['soon', 'few', 'free'] as const) {
      for (const noNeedle of [true, false]) {
        const r = planConcierge({ ...traveler, budget, timing, noNeedle, concerns: [] }, dataset, options);
        const picks = [r.best, ...(r.combo?.items ?? [])].filter((p) => p !== null);
        for (const p of picks) {
          if (budget !== null) assert.ok(p.row.krTotalJpy <= budget, `${p.menu.id} over budget`);
          assert.ok(p.downtimeDays <= allowedDowntimeDays('traveler', timing));
          if (noNeedle) assert.ok(!NEEDLE_MENUS.has(p.menu.id));
        }
        if (budget !== null && r.combo) assert.ok(r.combo.totalJpy <= budget);
      }
    }
  }
});

test('concierge resident: ₩50,000, Sinchon, event tomorrow → Aqua Peel nearby, Aqua + Lala Peel plan, Potenza later', () => {
  const r = planConcierge(resident, dataset, options);
  assert.equal(r.best?.menu.id, 'aquapeel');
  assert.ok(r.best!.row.distanceMeters <= 3000);
  assert.equal(r.best!.row.totalKrw, 3850);

  assert.ok(r.combo);
  assert.deepEqual(r.combo.items.map((o) => o.menu.id).sort(), ['aquapeel', 'lalapeel']);
  assert.equal(r.combo.totalKrw, 35750);
  assert.equal(r.combo.remaining, 50000 - 35750);
  for (const o of r.combo.items) assert.ok(o.row.distanceMeters <= 3000);

  assert.equal(r.nextPlan?.menu.id, 'potenza');
  assert.equal(r.nextPlan?.reason, 'downtime');
});

test('concierge: when nothing fits the budget it says so and shows the cheapest option', () => {
  const r = planConcierge(
    { ...traveler, budget: 5000, timing: 'free', noNeedle: false, concerns: ['skinbase'] },
    dataset,
    options
  );
  assert.equal(r.best, null);
  assert.equal(r.combo, null);
  assert.ok(r.cheapestOverBudget);
  assert.ok(r.cheapestOverBudget.row.krTotalJpy > 5000);
  assert.ok(r.excluded.every((e) => e.reason === 'budget'));
});

test('concierge: every treatment has a treatment time from its own note', () => {
  for (const menu of dataset.menus) {
    const min = treatmentMinutes(menu);
    assert.ok(min !== null && min > 0 && min <= 120, `${menu.id}: ${menu.leadTimeNoteJa}`);
    assert.ok(menu.leadTimeNoteKo.includes(String(min)), `${menu.id} JA/KO minutes differ`);
  }
  assert.equal(treatmentMinutes({ leadTimeNoteJa: '施術約40分・当日帰国可' }), 40);
});

test('hidden proof screenshots: every key is a real offer and its screenshot is not shown', async () => {
  const { HIDDEN_PROOF_OFFERS } = await import('../data/proof-hidden.ts');
  const { getOfficialMenuProof } = await import('../data/official-proofs.ts');
  assert.ok(HIDDEN_PROOF_OFFERS.size > 0);
  for (const key of HIDDEN_PROOF_OFFERS) {
    const [placeId, menuId] = key.split('::');
    const place = dataset.places.find((p) => p.id === placeId);
    assert.ok(place && place.prices[menuId], `unknown offer ${key}`);
    const proof = getOfficialMenuProof(place, menuId, 'ko');
    assert.equal(proof.imageFile, null, `screenshot still shown for ${key}`);
    assert.ok(proof.priceUrl.startsWith('http'), `official link missing for ${key}`);
  }
});
