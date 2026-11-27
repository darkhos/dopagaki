import { krwToJpy } from '@/lib/calc.ts';
import type { MenuItem, PlaceItem } from '@/types.ts';

export type TimeSlot = 'any' | 'morning' | 'afternoon' | 'evening';
export type OrderRequestId = 'no-upsell' | 'total-first' | 'gentle-numbing' | 'one-hour';

export const DEFAULT_ORDER_REQUESTS: OrderRequestId[] = ['no-upsell', 'total-first'];

const ORDER_REQUESTS: Record<OrderRequestId, [string, string]> = {
  'no-upsell': [
    '오늘은 미리 정한 시술만 받고 싶습니다. 추가 시술 권유는 정중히 사양하겠습니다.',
    '本日は事前に決めた施術のみ希望します。追加施術のおすすめは丁重に辞退いたします。'
  ],
  'total-first': [
    '마취비·진정관리·전용 팁·부가세(10%) 포함 최종 총액을 시술 전에 먼저 알려주세요.',
    '麻酔代・鎮静ケア・専用チップ・税金(10%)込みの最終総額を施術前に教えてください。'
  ],
  'gentle-numbing': [
    '통증에 약한 편이라 마취크림을 충분히 도포하고 시간을 넉넉히 두어 주시면 감사하겠습니다.',
    '痛みに弱いため、麻酔クリームをしっかり塗り十分な時間をおいていただけると助かります。'
  ],
  'one-hour': [
    '다음 일정이 있어 가능하면 1시간 이내로 마칠 수 있는지 먼저 알려주시면 감사하겠습니다.',
    '次の予定があるため、可能であれば1時間以内に終わるか事前に教えていただけると助かります。'
  ]
};

const TIME_LABELS: Record<TimeSlot, [string, string]> = {
  any: ['시간 무관', '時間帯おまかせ'],
  morning: ['오전 (10:00~12:00)', '午前（10:00〜12:00）'],
  afternoon: ['오후 (13:00~17:00)', '午後（13:00〜17:00）'],
  evening: ['저녁 (17:00 이후)', '夕方（17:00以降）']
};

export function inquiryMessages(
  place: PlaceItem,
  menus: MenuItem[],
  menuIds: string[],
  opts: {
    date?: string;
    timeSlot?: TimeSlot;
    people?: number;
    firstVisit?: boolean;
    guestName?: string;
  } = {}
): { ko: string; ja: string } {
  const date = opts.date ?? '';
  const timeSlot = opts.timeSlot ?? 'any';
  const people = opts.people ?? 1;
  const firstVisit = opts.firstVisit ?? true;
  const guestName = (opts.guestName ?? '').trim();

  const dateKo = date || '(희망 날짜 미입력)';
  const dateJa = date || '（希望日未入力）';
  const [timeKo, timeJa] = TIME_LABELS[timeSlot] ?? TIME_LABELS.any;
  const nameKo = guestName || '(여권 영문명 입력)';
  const nameJa = guestName || '（パスポート英字名を入力）';
  const count = Math.max(1, Math.min(5, Math.round(people)));

  const selected = menus.filter((m) => menuIds.includes(m.id) && place.prices[m.id]);
  const menusKo = selected.map((m) => m.nameKo).join(', ') || '상담 후 결정';
  const menusJa = selected.map((m) => m.nameJa).join('・') || '相談して決定';

  const langKo = place.japaneseSupport
    ? '일본어 상담이 가능한 시간대로 배정 부탁드립니다.'
    : '일본어 대응이 어려우시면 번역기나 간단한 영어로 상담 부탁드립니다.';
  const langJa = place.japaneseSupport
    ? '日本語対応が可能な時間帯でご案内いただけますと幸いです。'
    : '日本語対応が難しい場合は、翻訳アプリや簡単な英語でのご対応をお願いいたします。';

  const ko = [
    `안녕하세요, ${place.nameKo} 예약 문의드립니다.`,
    `일본에서 방문하는 ${firstVisit ? '첫 방문(초진)' : '재방문'} 고객입니다.`,
    '',
    `• 성함(여권 영문): ${nameKo}`,
    `• 희망 일시: ${dateKo} / ${timeKo}`,
    `• 인원: ${count}명`,
    `• 희망 시술: ${menusKo}`,
    '',
    langKo,
    '마취크림·전용 팁·부가세 포함 예상 금액도 함께 알려주시면 감사하겠습니다.'
  ].join('\n');

  const ja = [
    `こんにちは、${place.nameJa}への予約についてお問い合わせです。`,
    `日本から伺う${firstVisit ? '初診' : '再診'}の患者です。`,
    '',
    `・お名前（パスポート表記）：${nameJa}`,
    `・ご希望日時：${dateJa} / ${timeJa}`,
    `・人数：${count}名`,
    `・希望施術：${menusJa}`,
    '',
    langJa,
    '麻酔クリーム・専用チップ・税金込みのおおよその総額もあわせて教えていただけますと幸いです。'
  ].join('\n');

  return { ko, ja };
}

function fmtKrw(n: number): string {
  return `₩${n.toLocaleString('en-US')}`;
}

function fmtJpy(n: number): string {
  return `¥${n.toLocaleString('en-US')}`;
}

export function orderSheetMessages(
  place: PlaceItem,
  menus: MenuItem[],
  menuIds: string[],
  opts: {
    requests: OrderRequestId[];
    krwPer100Jpy: number;
    vatRate: number;
  }
): { ko: string; ja: string; totalKrw: number; totalJpy: number } {
  const items: Array<{ menu: MenuItem; baseKrw: number; vatKrw: number; totalJpy: number }> = [];
  for (const menu of menus) {
    const offer = place.prices[menu.id];
    if (!menuIds.includes(menu.id) || !offer) continue;
    const applyVat = place.vatExcluded && menu.vatAppliesInKorea;
    const vatKrw = applyVat ? Math.round(offer.krw * opts.vatRate) : 0;
    items.push({
      menu,
      baseKrw: offer.krw,
      vatKrw,
      totalJpy: krwToJpy(offer.krw + vatKrw, opts.krwPer100Jpy)
    });
  }

  const totalKrw = items.reduce((sum, i) => sum + i.baseKrw + i.vatKrw, 0);
  const totalJpy = items.reduce((sum, i) => sum + i.totalJpy, 0);

  const linesKo =
    items.length > 0
      ? items.map(
          (i) =>
            `- ${i.menu.nameKo} (공식가 ${fmtKrw(i.baseKrw)}${i.vatKrw > 0 ? ' + VAT 10%' : ''})`
        )
      : ['- 상담 시 선택 예정'];
  const linesJa =
    items.length > 0
      ? items.map(
          (i) =>
            `・${i.menu.nameJa}（公式 ${fmtKrw(i.baseKrw)}${i.vatKrw > 0 ? ' + 税10%' : ''} / 約${fmtJpy(i.totalJpy)}）`
        )
      : ['・カウンセリング時に決定'];

  const chosen = (Object.keys(ORDER_REQUESTS) as OrderRequestId[])
    .filter((k) => opts.requests.includes(k))
    .map((k) => ORDER_REQUESTS[k]);

  const ko: string[] = [
    '안녕하세요. 일본에서 방문한 고객입니다.',
    `[${place.nameKo}] 공식 홈페이지 가격을 보고 아래 시술을 희망합니다.`,
    '',
    '[희망 시술]',
    ...linesKo,
    `예상 합계: ${fmtKrw(totalKrw)} (부가세 10% 포함 예상 / 약 ${fmtJpy(totalJpy)})`,
    ''
  ];
  if (chosen.length > 0) {
    ko.push('[부탁드리는 사항]', ...chosen.map(([k]) => `• ${k}`), '');
  }
  ko.push(`확인 사항: ${place.caveatKo}`, '친절히 안내해 주셔서 감사합니다.');

  const ja: string[] = [
    'こんにちは。日本から来院した患者です。',
    `【${place.nameJa}】の公式料金を見て、以下の施術を希望しています。`,
    '',
    '【希望メニュー】',
    ...linesJa,
    `目安合計: ${fmtJpy(totalJpy)}（${fmtKrw(totalKrw)}・税込10%目安）`,
    ''
  ];
  if (chosen.length > 0) {
    ja.push('【お願いしたいこと】', ...chosen.map(([, j]) => `・${j}`), '');
  }
  ja.push(`事前確認メモ: ${place.caveatJa}`, 'ご丁寧なご案内をよろしくお願いいたします。');

  return { ko: ko.join('\n'), ja: ja.join('\n'), totalKrw, totalJpy };
}
