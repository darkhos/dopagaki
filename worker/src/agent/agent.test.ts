import test from 'node:test';
import assert from 'node:assert/strict';
import { dropUnknownAmounts, findMoney, moneyKey } from './amounts.ts';
import { runAgentTurn } from './engine.ts';
import { findJpClinic, matchJpName } from './jp-names.ts';
import { DATASET, SNAPSHOT_FX, executeTool, getLocationIndex, type FxInfo } from './tools.ts';
import { findTopics, mentionsHealth, stripHealthConditions } from './safety.ts';

const FX: FxInfo = {
  krwPer100Jpy: SNAPSHOT_FX.krwPer100Jpy,
  dateLabel: SNAPSHOT_FX.dateLabel,
  bankKo: SNAPSHOT_FX.bankKo
};

test('safety: detects health topics and ignores false positives', () => {
  assert.deepEqual(findTopics('임신 중인데 리쥬란 받아도 되나요?'), ['pregnancy']);
  assert.deepEqual(findTopics('授乳中です。薬を飲んでいます。'), ['breastfeeding', 'medication']);
  assert.deepEqual(findTopics('미앤미의원 수유점 예약 먹통인가요? 피부가 간질간질해요'), []);
  assert.equal(mentionsHealth('강남 슈링크 3만원'), false);
  assert.equal(
    stripHealthConditions('3万円、弘大、妊娠予定なし'),
    '3万円、弘大'
  );
  assert.equal(
    stripHealthConditions('강남 · 리쥬란 · 당뇨 복용 중'),
    '강남 · 리쥬란'
  );
});

test('amounts: parses money ranges and drops unknown hallucinated amounts', () => {
  const found = findMoney('26,000~66,000円 / ₩99,000 / 28만 4천 원');
  const pairs = found.map((m) => `${m.currency}:${m.value}`);
  assert.ok(pairs.includes('JPY:26000'));
  assert.ok(pairs.includes('JPY:66000'));
  assert.ok(pairs.includes('KRW:99000'));
  assert.ok(pairs.includes('KRW:284000'));

  const known = new Set<string>([moneyKey('JPY', 15000), moneyKey('KRW', 120000)]);
  const { kept, dropped } = dropUnknownAmounts(
    '추천 가격은 ¥15,000 (할인 전 ¥99,999) 입니다.\n- 거짓 병원: ¥88,888\n- 실제 병원: ₩120,000',
    known
  );
  assert.equal(dropped.length, 2);
  assert.ok(kept.includes('¥15,000'));
  assert.ok(kept.includes('₩120,000'));
  assert.ok(!kept.includes('99,999'));
  assert.ok(!kept.includes('88,888'));
});

test('jp-names: matches Japanese treatment names and Japanese clinics accurately', () => {
  assert.equal(matchJpName('ハイフ').status, 'found');
  assert.deepEqual(matchJpName('ハイフ').menuIds, ['shrink-300']);
  assert.equal(matchJpName('ブナジュ').status, 'found');
  assert.deepEqual(matchJpName('ブナジュ').menuIds, ['re2o-5cc']);
  assert.equal(matchJpName('ウルセラ').status, 'ambiguous');
  assert.equal(matchJpName('水光注射（リジュランHB）').status, 'found');
  assert.deepEqual(matchJpName('水光注射（リジュランHB）').menuIds, ['rejuran-2cc']);
  assert.equal(matchJpName('ボツラックス エラ').status, 'found');
  assert.deepEqual(matchJpName('ボツラックス エラ').menuIds, ['jaw-botox']);
  assert.equal(matchJpName('未知の施術XYZ').status, 'unknown');

  const rejuran = DATASET.menus.find((m) => m.id === 'rejuran-2cc')!;
  const sbc = findJpClinic(rejuran, 'SBC');
  assert.equal(sbc.status, 'found');
});

test('locations: resolves stations, districts, ambiguous queries, and unknown places', () => {
  const index = getLocationIndex();
  const hongdaeSt = index.resolve('홍대입구역 근처');
  assert.equal(hongdaeSt.status, 'found');
  assert.equal(hongdaeSt.locations[0].id, 'station:홍대입구');

  const gangnamGu = index.resolve('강남구 숙소');
  assert.equal(gangnamGu.status, 'found');
  assert.equal(gangnamGu.locations[0].id, 'area:gangnam');

  assert.equal(index.resolve('홍대랑 강남').status, 'ambiguous');
  assert.equal(index.resolve('부산 해운대').status, 'unknown');
});

test('tools: all 5 agent tools execute accurately and validate errors cleanly', () => {
  const rec = executeTool(
    'recommend_treatments',
    { concerns: ['pores'], avoid_needle: true, max_downtime_days: 1 },
    FX
  );
  assert.ok(!rec.isError);
  assert.ok(rec.text.includes('Excluded:'));
  assert.ok(rec.text.includes('potenza'));

  const badDist = executeTool(
    'search_clinics',
    { menu_id: 'shrink-300', sort: 'distance' },
    FX
  );
  assert.equal(badDist.isError, true);

  const loc = executeTool('resolve_location', { query: '弘大入口駅' }, FX);
  assert.ok(!loc.isError);
  assert.ok(loc.text.includes("origin_id='station:홍대입구'"));

  const search = executeTool(
    'search_clinics',
    {
      menu_id: 'shrink-300',
      area: 'gangnam',
      origin_id: 'station:홍대입구',
      budget: { amount: 30000, currency: 'JPY' },
      limit: 3
    },
    FX
  );
  assert.ok(!search.isError);
  const searchArtifact = search.artifact as { cards: Array<{ cardId: string; distanceMeters: number | null }> };
  assert.ok(searchArtifact.cards.length >= 1);
  assert.ok(typeof searchArtifact.cards[0].distanceMeters === 'number');

  const firstCardId = searchArtifact.cards[0].cardId;
  const booking = executeTool(
    'get_booking_options',
    { place_id: firstCardId, preferred_date: '11/28', people: 2 },
    FX
  );
  assert.ok(!booking.isError);
  const bookingArtifact = booking.artifact as {
    booking: { inquiryKo: string; orderSheetKo: string; orderTotalKrw: number };
  };
  assert.ok(bookingArtifact.booking.inquiryKo.includes('11/28'));
  assert.ok(bookingArtifact.booking.inquiryKo.includes('2명'));
  assert.ok(bookingArtifact.booking.orderTotalKrw > 0);

  const badDate = executeTool(
    'get_booking_options',
    { place_id: firstCardId, preferred_date: '2/30' },
    FX
  );
  assert.equal(badDate.isError, true);
});

test('engine: full multi-step tool loop, card assembly, amount screening, and safety stop', async () => {
  // Turn 1: match_jp_treatment + resolve_location -> search_clinics -> reply with hallucinated price
  let step = 0;
  const turn1 = await runAgentTurn({
    threadId: '11111111-1111-4111-8111-111111111111',
    message: '홍대입구역 근처에서 일본 하이후 받고 싶어요',
    lang: 'ko',
    state: null,
    fx: FX,
    invokeModel: async () => {
      step += 1;
      if (step === 1) {
        return {
          stopReason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'call_loc',
              name: 'resolve_location',
              input: { query: '홍대입구역' }
            },
            {
              type: 'tool_use',
              id: 'call_jp',
              name: 'match_jp_treatment',
              input: { query: '하이후' }
            }
          ]
        };
      }
      if (step === 2) {
        return {
          stopReason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'call_search',
              name: 'search_clinics',
              input: { menu_id: 'shrink-300', origin_id: 'station:홍대입구', limit: 2 }
            }
          ]
        };
      }
      // Include one hallucinated amount (¥99,999) to verify server-side screening removes it
      return {
        stopReason: 'end_turn',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              condition_summary: '홍대입구역 기준 · 슈링크 300샷',
              answer: '일본 하이후는 한국에서 슈링크로 불러요 (예상 추가비 ¥99,999). 아래 병원을 확인해 주세요.',
              card_reasons: [],
              questions: [],
              suggestions: ['첫 번째 병원 예약 방법 알려줘'],
              cautions: [],
              safety_stop: false
            })
          }
        ]
      };
    }
  });

  assert.equal(turn1.response.fallback, null);
  assert.ok(turn1.response.cards.some((c) => c.kind === 'jp_match'));
  assert.ok(turn1.response.cards.some((c) => c.kind === 'location'));
  assert.ok(turn1.response.cards.filter((c) => c.kind === 'recommendation').length === 2);
  assert.ok(!turn1.response.answer.includes('99,999'));
  assert.ok(turn1.response.cautions.some((c) => c.includes('맞지 않는 금액')));

  // Turn 2: safety_stop strips recommendation cards & health info from conditionSummary/cautions
  const turn2 = await runAgentTurn({
    threadId: '11111111-1111-4111-8111-111111111111',
    message: '사실 임신 중인데 받아도 될까요?',
    lang: 'ko',
    state: turn1.nextState,
    fx: FX,
    invokeModel: async () => ({
      stopReason: 'end_turn',
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            condition_summary: '홍대입구역 · 임신 중',
            answer: '지금은 시술을 미루시는 편을 권해요. 담당 주치의와 먼저 상의해 주세요.',
            card_reasons: [],
            questions: [],
            suggestions: ['임신 중에 가능한 순한 보습 관리가 있나요?'],
            cautions: ['임신 중 시술 주의'],
            safety_stop: true
          })
        }
      ]
    })
  });

  assert.equal(turn2.response.fallback, null);
  assert.equal(turn2.response.conditionSummary, '홍대입구역');
  assert.equal(turn2.response.cautions.length, 0);
  assert.equal(turn2.response.suggestions.length, 1);
  assert.ok(turn2.response.cards.every((c) => c.kind === 'location'));
});

test('engine: retries empty response once and falls back safely on error', async () => {
  let calls = 0;
  const retried = await runAgentTurn({
    threadId: '22222222-2222-4222-8222-222222222222',
    message: '안녕',
    lang: 'ja',
    state: null,
    fx: FX,
    invokeModel: async () => {
      calls += 1;
      if (calls === 1) return { stopReason: 'end_turn', content: [] };
      return {
        stopReason: 'end_turn',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              condition_summary: '',
              answer: 'こんにちは！ご希望の施術やエリアを教えてください。',
              card_reasons: [],
              questions: [],
              suggestions: ['江南のシュリンクの料金'],
              cautions: [],
              safety_stop: false
            })
          }
        ]
      };
    }
  });
  assert.equal(calls, 2);
  assert.equal(retried.response.fallback, null);

  const failed = await runAgentTurn({
    threadId: '33333333-3333-4333-8333-333333333333',
    message: '강남 슈링크',
    lang: 'ko',
    state: null,
    fx: FX,
    invokeModel: async () => {
      throw new Error('simulated upstream error');
    }
  });
  assert.equal(failed.response.fallback, 'error');
  assert.ok(failed.response.answer.includes('시세표'));
});
