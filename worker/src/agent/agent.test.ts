import test from 'node:test';
import assert from 'node:assert/strict';
import { dropUnknownAmounts, findMoney, moneyKey } from './amounts.ts';
import {
  applyPromptCacheBreakpoints,
  canonicalToolCallKey,
  runAgentTurn
} from './engine.ts';
import { findJpClinic, matchJpName } from './jp-names.ts';
import { DATASET, SNAPSHOT_FX, executeTool, getLocationIndex, type FxInfo } from './tools.ts';
import { findTopics, mentionsHealth, stripHealthConditions } from './safety.ts';
import { simplifyJargon } from './plain-language.ts';

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

test('engine streaming: emits status, meta, and incremental answer deltas via partial-json', async () => {
  const events: Array<{ type: string; [key: string]: unknown }> = [];
  const fullJson = JSON.stringify({
    condition_summary: '홍대 · 슈링크 300샷',
    answer: '홍대입구역 근처 슈링크 300샷 공식가를 확인했어요. 아래 병원을 비교해 보세요!',
    card_reasons: [],
    questions: [],
    suggestions: ['예약 방법 알려줘'],
    cautions: [],
    safety_stop: false
  });

  let step = 0;
  const turn = await runAgentTurn({
    threadId: '44444444-4444-4444-8444-444444444444',
    message: '홍대 슈링크 알려줘',
    lang: 'ko',
    state: null,
    fx: FX,
    onEvent: (ev) => events.push(ev as { type: string; [key: string]: unknown }),
    invokeModel: async (_messages, onTextDelta) => {
      step += 1;
      if (step === 1) {
        return {
          stopReason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'call_s1',
              name: 'search_clinics',
              input: { menu_id: 'shrink-300', area: 'hongdae', limit: 2 }
            }
          ]
        };
      }
      // Feed the JSON in small chunks to simulate live Anthropic streaming tokens
      for (let i = 0; i < fullJson.length; i += 7) {
        onTextDelta?.(fullJson.slice(i, i + 7));
      }
      return {
        stopReason: 'end_turn',
        content: [{ type: 'text', text: fullJson }]
      };
    }
  });

  assert.equal(turn.response.fallback, null);
  assert.ok(events.some((e) => e.type === 'status' && e.stage === 'thinking'));
  assert.ok(events.some((e) => e.type === 'status' && e.stage === 'tool' && e.tool === 'search_clinics'));
  assert.ok(events.some((e) => e.type === 'meta' && e.conditionSummary === '홍대 · 슈링크 300샷'));
  const deltas = events.filter((e) => e.type === 'delta').map((e) => String(e.text));
  assert.ok(deltas.length >= 3, `expected multiple streamed chunks, got ${deltas.length}`);
  assert.equal(
    deltas.join(''),
    '홍대입구역 근처 슈링크 300샷 공식가를 확인했어요. 아래 병원을 비교해 보세요!'
  );
});

test('bundle tool: finds cheapest one-stop clinic across 137 clinics and compares against single winners', async () => {
  const res = executeTool(
    'search_bundle_clinics',
    { menu_ids: ['rejuran-2cc', 'shrink-300'], limit: 3 },
    FX
  );
  assert.ok(!res.isError, res.text);
  const artifact = res.artifact as {
    cards: Array<{
      placeId: string;
      totalKrw: number;
      totalJpy: number;
      items: Array<{ menuId: string; totalKrw: number }>;
      differsFromSingleWinners: boolean;
    }>;
  };
  assert.ok(artifact.cards.length >= 2);
  const first = artifact.cards[0];
  assert.equal(first.items.length, 2);
  assert.equal(
    first.totalKrw,
    first.items[0].totalKrw + first.items[1].totalKrw
  );
  assert.ok(first.totalKrw <= artifact.cards[1].totalKrw);

  // Verify full engine assembles BundleCard cleanly
  let step = 0;
  const turn = await runAgentTurn({
    threadId: '55555555-5555-4555-8555-555555555555',
    message: '리쥬란 2cc랑 슈링크 300샷 한 병원에서 묶어 받으면 제일 싼 곳 알려줘',
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
              id: 'call_bundle',
              name: 'search_bundle_clinics',
              input: { menu_ids: ['rejuran-2cc', 'shrink-300'], limit: 2 }
            }
          ]
        };
      }
      return {
        stopReason: 'end_turn',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              condition_summary: '리쥬란 2cc + 슈링크 300샷 묶음',
              answer: '한 병원에서 두 시술을 함께 받을 때 가장 저렴한 곳을 찾았어요.',
              card_reasons: [],
              questions: [],
              suggestions: ['1위 병원 묶음 예약 방법'],
              cautions: [],
              safety_stop: false
            })
          }
        ]
      };
    }
  });
  assert.equal(turn.response.fallback, null);
  assert.equal(turn.response.cards.filter((c) => c.kind === 'bundle').length, 2);
});

test('plain-language: replaces hard dermatology jargon in both KO and JA', () => {
  assert.equal(simplifyJargon('다운타임 없는 게 좋아요', 'ko'), '붓기·붉은기 없는 게 좋아요');
  assert.equal(simplifyJargon('다운타임이 짧고 엠보싱이 적어요', 'ko'), '회복 기간이 짧고 오돌토돌한 주사 자국이 적어요');
  assert.equal(simplifyJargon('SMAS층 고주파와 저작근 보톡스', 'ko'), '피부 속 탄력층 열 에너지와 턱 근육 보톡스');
  assert.equal(simplifyJargon('ダウンタイムなしの施術がいい', 'ja'), '当日からすぐ外出OKの施術がいい');
  assert.equal(simplifyJargon('真皮層と咬筋に効く高周波', 'ja'), '肌の内側とエラの筋肉に効く温熱ケア');
});

test('prompt caching: marks up to 2 recent non-initial user turns without mutating input', () => {
  const single = [{ role: 'user' as const, content: [{ type: 'text' as const, text: '강남 슈링크' }] }];
  assert.equal(applyPromptCacheBreakpoints(single), single);

  const multi = [
    { role: 'user' as const, content: [{ type: 'text' as const, text: '홍대 하이후' }] },
    { role: 'assistant' as const, content: [{ type: 'text' as const, text: 'step1' }] },
    {
      role: 'user' as const,
      content: [{ type: 'tool_result' as const, tool_use_id: 't1', content: 'ok1' }]
    },
    { role: 'assistant' as const, content: [{ type: 'text' as const, text: 'step2' }] },
    {
      role: 'user' as const,
      content: [{ type: 'tool_result' as const, tool_use_id: 't2', content: 'ok2' }]
    },
    { role: 'assistant' as const, content: [{ type: 'text' as const, text: 'done' }] },
    { role: 'user' as const, content: [{ type: 'text' as const, text: '예약 방법 알려줘' }] }
  ];
  const cached = applyPromptCacheBreakpoints(multi);
  const markedIndices = cached
    .map((m, idx) => {
      const blocks = Array.isArray(m.content) ? m.content : [];
      const last = blocks[blocks.length - 1] as { cache_control?: { type: string } } | undefined;
      return last?.cache_control?.type === 'ephemeral' ? idx : -1;
    })
    .filter((i) => i >= 0);

  assert.deepEqual(markedIndices, [4, 6]);
  // Original array must remain unmutated
  const origBlock = (multi[4].content as Array<{ cache_control?: unknown }>)[0];
  assert.equal(origBlock.cache_control, undefined);
});

test('cost guard: breaks duplicate tool-call loops immediately and allows zero-result retry', async () => {
  assert.equal(
    canonicalToolCallKey('search_clinics', { area: null, menu_id: 'shrink-300', sort: 'savings' }),
    canonicalToolCallKey('search_clinics', { sort: 'savings', menu_id: 'shrink-300' })
  );

  const allowToolsSeen: boolean[] = [];
  let step = 0;
  const deduped = await runAgentTurn({
    threadId: '66666666-6666-4666-8666-666666666666',
    message: '홍대 슈링크 알려줘',
    lang: 'ko',
    state: null,
    fx: FX,
    invokeModel: async (_messages, _onDelta, allowTools = true) => {
      allowToolsSeen.push(allowTools);
      step += 1;
      if (allowTools && step <= 5) {
        // Simulate runaway model repeatedly calling search_clinics with the same target
        return {
          stopReason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: `dup_${step}`,
              name: 'search_clinics',
              input: { menu_id: 'shrink-300', area: 'hongdae', limit: step === 1 ? 3 : 5 }
            }
          ]
        };
      }
      return {
        stopReason: 'end_turn',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              condition_summary: '홍대 · 슈링크 300샷',
              answer: '홍대 슈링크 300샷 최저가 병원을 찾았어요.',
              card_reasons: [],
              questions: [],
              suggestions: ['예약 문의'],
              cautions: [],
              safety_stop: false
            })
          }
        ]
      };
    }
  });

  // Step 1 executes search, Step 2 triggers duplicate guard -> Step 3 forced allowTools=false
  assert.deepEqual(allowToolsSeen, [true, true, false]);
  assert.equal(deduped.response.fallback, null);
  assert.equal(deduped.response.cards.filter((c) => c.kind === 'recommendation').length, 3);
  assert.equal(deduped.nextState.toolLogs.filter((l) => l.name === 'search_clinics').length, 1);

  // Legitimate retry after 0 results (e.g. overly tight budget -> relaxed budget) MUST still work
  let retryStep = 0;
  const retried = await runAgentTurn({
    threadId: '77777777-7777-4777-8777-777777777777',
    message: '홍대 슈링크 1천원 이하로 찾아줘',
    lang: 'ko',
    state: null,
    fx: FX,
    invokeModel: async (_messages, _onDelta, allowTools = true) => {
      retryStep += 1;
      if (allowTools && retryStep === 1) {
        return {
          stopReason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'tight_1',
              name: 'search_clinics',
              input: { menu_id: 'shrink-300', area: 'hongdae', budget: { amount: 1000, currency: 'KRW' } }
            }
          ]
        };
      }
      if (allowTools && retryStep === 2) {
        return {
          stopReason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'relaxed_2',
              name: 'search_clinics',
              input: { menu_id: 'shrink-300', area: 'hongdae', limit: 2 }
            }
          ]
        };
      }
      return {
        stopReason: 'end_turn',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              condition_summary: '홍대 · 슈링크 300샷',
              answer: '1천 원 이하 병원은 없어 홍대 최저가 병원으로 안내해 드려요.',
              card_reasons: [],
              questions: [],
              suggestions: [],
              cautions: [],
              safety_stop: false
            })
          }
        ]
      };
    }
  });
  assert.equal(retried.response.fallback, null);
  assert.equal(retried.response.cards.filter((c) => c.kind === 'recommendation').length, 2);
});
