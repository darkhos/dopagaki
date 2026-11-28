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
  any: ['시간 상관없어요', '時間はいつでも大丈夫です'],
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

  const dateKo = date || '(희망 날짜 선택)';
  const dateJa = date || '（希望日を選択）';
  const [timeKo, timeJa] = TIME_LABELS[timeSlot] ?? TIME_LABELS.any;
  const nameKo = guestName || '(여권 영문명 입력)';
  const nameJa = guestName || '（パスポート英字名を入力）';
  const count = Math.max(1, Math.min(5, Math.round(people)));

  const selected = menus.filter((m) => menuIds.includes(m.id) && place.prices[m.id]);
  const menusKo = selected.map((m) => m.nameKo).join(', ') || '상담 후 결정';
  const menusJa = selected.map((m) => m.nameJa).join('・') || '相談して決定';

  const langKo = place.japaneseSupport
    ? '가능하시면 일본어 상담되는 시간대로 잡아주시면 감사하겠습니다 :)'
    : '제가 한국어가 서툴러서 번역 앱으로 대화하고 있어요. 짧은 한국어나 숫자로 답장해 주시면 정말 감사하겠습니다 :)';
  const langJa = place.japaneseSupport
    ? 'できれば日本語で相談できる時間帯にしていただけるとうれしいです！'
    : '韓国語が不慣れで翻訳アプリを使っています。短い韓国語や数字でお返事いただけると助かります！';

  const ko = [
    `안녕하세요! ${place.nameKo} 예약하고 싶어서 연락드렸어요.`,
    firstVisit
      ? '일본에서 여행 가는 길에 처음 방문할 예정이에요.'
      : '전에 방문했었고 이번에 다시 예약하려고 해요.',
    '',
    `이름(여권 영문): ${nameKo}`,
    `희망 일시: ${dateKo} · ${timeKo}`,
    `인원: ${count}명`,
    `받고 싶은 시술: ${menusKo}`,
    '',
    '혹시 이 날짜에 예약 가능할까요? 마취크림·전용 팁·부가세까지 포함해서 대략 총 얼마 정도 나올지도 같이 알려주시면 감사해요!',
    langKo
  ].join('\n');

  const ja = [
    `こんにちは！${place.nameJa}を予約したくてご連絡しました。`,
    firstVisit
      ? '日本から旅行で伺う予定で、初診です。'
      : '以前伺ったことがあり、再診で予約したいです。',
    '',
    `名前（パスポート英字）：${nameJa}`,
    `希望日時：${dateJa}・${timeJa}`,
    `人数：${count}名`,
    `希望の施術：${menusJa}`,
    '',
    'こちらの日程で予約できますでしょうか？麻酔クリーム・専用チップ・税金込みで大体いくらくらいになるかも教えていただけるとうれしいです！',
    langJa
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
