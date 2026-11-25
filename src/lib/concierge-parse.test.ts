import test from 'node:test';
import assert from 'node:assert/strict';
import { aiResultToParse, budgetForVisitor, mergeParses, parseConciergeText, type ConciergeParse } from './concierge-parse.ts';

type Expect = Partial<Omit<ConciergeParse, 'fieldCount'>>;

const CASES: Array<[string, Expect]> = [
  // ── Japanese, travelers ──
  [
    '毛穴となんとなくたるみ。予算1万くらい、明後日帰国。針はこわい',
    { visitor: 'traveler', budget: { amount: 10000, currency: null }, timing: 'few', concerns: ['pores', 'lift'], noNeedle: true }
  ],
  ['エラだけ、5千円で', { budget: { amount: 5000, currency: 'JPY' }, concerns: ['jaw'] }],
  ['乾燥と小じわが気になる。3万円まで、あと4日で帰ります', { visitor: 'traveler', budget: { amount: 30000, currency: 'JPY' }, timing: 'free', concerns: ['dry'] }],
  ['明日帰国です。ツヤ肌になりたい！', { visitor: 'traveler', timing: 'soon', concerns: ['glow'] }],
  ['2泊3日の旅行。小顔になりたい、予算は気にしない', { visitor: 'traveler', budget: { amount: null, currency: null }, concerns: ['lift'] }],
  ['リジュラン受けたい！¥20,000以内', { budget: { amount: 20000, currency: 'JPY' }, concerns: ['dry'] }],
  ['なんとなくキレイになりたい', { concerns: [] }],
  ['シュリンク300ショットって痛い？', { concerns: ['lift'] }],
  // ── Japanese, residents ──
  [
    '新村の語学堂に通ってます。月5万ウォン、明日バイト。毛穴が気になる',
    { visitor: 'resident', budget: { amount: 50000, currency: 'KRW' }, timing: 'soon', areaId: 'sinchon', concerns: ['pores'] }
  ],
  ['ワーホリ中で江南に住んでる。ブナジュ1万円で受けたい', { visitor: 'resident', areaId: 'gangnam', budget: { amount: 10000, currency: 'JPY' }, concerns: ['skinbase'] }],
  ['留学生です。来週まで予定なし、注射は苦手', { visitor: 'resident', timing: 'free', noNeedle: true }],
  ['弘大でアクアピール、3万ウォンくらい', { areaId: 'hongdae', budget: { amount: 30000, currency: 'KRW' }, concerns: ['pores'] }],
  // ── Korean ──
  ['여행 중이에요. 모공이랑 탄력, 1만 엔 정도, 모레 귀국', { visitor: 'traveler', budget: { amount: 10000, currency: 'JPY' }, timing: 'few', concerns: ['pores', 'lift'] }],
  ['신촌 어학당 다니는 유학생, 이번 달 5만원, 내일 알바', { visitor: 'resident', areaId: 'sinchon', budget: { amount: 50000, currency: 'KRW' }, timing: 'soon' }],
  ['바늘은 무서워요. 윤기 나는 피부 원해요', { noNeedle: true, concerns: ['glow'] }],
  ['사각턱 보톡스 5천엔으로 가능?', { budget: { amount: 5000, currency: 'JPY' }, concerns: ['jaw'] }],
  ['알아서 추천해줘', { concerns: [] }],
  ['3일 뒤에 비행기 타요. 건조하고 주름이 신경 쓰여요', { visitor: 'traveler', timing: 'few', concerns: ['dry'] }],
  ['예산은 상관없어요, 강남 거주', { visitor: 'resident', budget: { amount: null, currency: null }, areaId: 'gangnam' }],
  ['₩100,000까지, 성수 쪽', { budget: { amount: 100000, currency: 'KRW' }, areaId: 'seongsu' }]
];

for (const [text, expected] of CASES) {
  test(`parse: ${text}`, () => {
    const got = parseConciergeText(text);
    for (const [key, value] of Object.entries(expected)) {
      assert.deepEqual(got[key as keyof ConciergeParse], value, `${key} for "${text}"`);
    }
  });
}

test('parse: numbers that are not money are ignored (cc, shots, days)', () => {
  assert.equal(parseConciergeText('リジュラン2ccとシュリンク300ショット').budget, undefined);
  assert.equal(parseConciergeText('3泊4日です').budget, undefined);
  assert.equal(parseConciergeText('3泊4日です').timing, undefined);
});

test('parse: safety words stop recommendations', () => {
  assert.equal(parseConciergeText('妊娠中だけどツヤ肌になりたい').safety, 'pregnancy');
  assert.equal(parseConciergeText('임신 중인데 모공 관리 가능?').safety, 'pregnancy');
  assert.equal(parseConciergeText('アトピーがあります').safety, 'medical');
  assert.equal(parseConciergeText('毛穴、1万円').safety, undefined);
});

test('parse: empty or unrelated text reads nothing', () => {
  assert.equal(parseConciergeText('').fieldCount, 0);
  assert.equal(parseConciergeText('こんにちは').fieldCount, 0);
  assert.equal(parseConciergeText('彼氏の誕生日までにちょっと綺麗になりたい').fieldCount, 0);
});

test('budgetForVisitor converts to the visitor currency', () => {
  assert.equal(budgetForVisitor('traveler', { amount: 10000, currency: null }, 850), 10000);
  assert.equal(budgetForVisitor('resident', { amount: 50000, currency: null }, 850), 50000);
  assert.equal(budgetForVisitor('traveler', { amount: 85000, currency: 'KRW' }, 850), 10000);
  assert.equal(budgetForVisitor('resident', { amount: 10000, currency: 'JPY' }, 850), 85000);
  assert.equal(budgetForVisitor('traveler', { amount: null, currency: null }, 850), null);
});

test('aiResultToParse keeps only known values', () => {
  const ok = aiResultToParse({
    visitor: 'traveler',
    budget_kind: 'limit',
    budget_amount: 30000,
    budget_currency: 'JPY',
    days_until: 5,
    area: 'unknown',
    concerns_mode: 'anything',
    concerns: [],
    no_needle: false,
    safety: 'none'
  });
  assert.deepEqual(
    { visitor: ok.visitor, budget: ok.budget, timing: ok.timing, concerns: ok.concerns, n: ok.fieldCount },
    { visitor: 'traveler', budget: { amount: 30000, currency: 'JPY' }, timing: 'free', concerns: [], n: 4 }
  );
  assert.equal(ok.areaId, undefined);
  assert.equal(ok.noNeedle, undefined);

  const junk = aiResultToParse({
    visitor: 'alien',
    budget_kind: 'limit',
    budget_amount: -5,
    days_until: 'tomorrow',
    area: '<script>',
    concerns_mode: 'listed',
    concerns: ['pores', 'hack', 'pores'],
    safety: 'pregnancy'
  });
  assert.deepEqual(junk.concerns, ['pores']);
  assert.equal(junk.visitor, undefined);
  assert.equal(junk.budget, undefined);
  assert.equal(junk.timing, undefined);
  assert.equal(junk.areaId, undefined);
  assert.equal(junk.safety, 'pregnancy');
  assert.equal(aiResultToParse(null).fieldCount, 0);
  assert.equal(aiResultToParse('nope').fieldCount, 0);
});

test('mergeParses: rules win, AI fills gaps', () => {
  const rules = parseConciergeText('3万円まで');
  const ai = aiResultToParse({ budget_kind: 'limit', budget_amount: 99999, budget_currency: 'KRW', days_until: 1, concerns_mode: 'listed', concerns: ['glow'] });
  const m = mergeParses(rules, ai);
  assert.deepEqual(m.budget, { amount: 30000, currency: 'JPY' });
  assert.equal(m.timing, 'soon');
  assert.deepEqual(m.concerns, ['glow']);
  assert.equal(m.fieldCount, 3);
});
