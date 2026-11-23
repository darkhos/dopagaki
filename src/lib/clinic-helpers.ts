import type { GeoPoint, Lang, MenuItem, PlaceItem, PriceDataset } from '../types.ts';
import { computeSeoulAverage, formatJpy, formatKrw, haversineMeters, krwToJpy } from './calc.ts';

export interface RouteMatch {
  view: 'home' | 'clinic';
  clinicId: string | null;
}

export interface TreatmentDowntimeInfo {
  badgeKo: string;
  badgeJa: string;
  summaryKo: string;
  summaryJa: string;
  makeupKo: string;
  makeupJa: string;
}

export const TREATMENT_DOWNTIME: Record<string, TreatmentDowntimeInfo> = {
  'rejuran-2cc': {
    badgeKo: '엠보싱 2~3일',
    badgeJa: 'エンボス 2〜3日',
    summaryKo: '주사 자국·엠보싱 2~3일 지속 → 귀국 당일·일정 막바지 추천',
    summaryJa: '注射跡・エンボスが2〜3日残るため、帰国日や予定の後半がおすすめ',
    makeupKo: '세안·화장 다음날부터 (사우나·음주 1주 주의)',
    makeupJa: '洗顔・メイクは翌日から（サウナ・飲酒は1週間控える）'
  },
  'shrink-300': {
    badgeKo: '다운타임 거의 없음',
    badgeJa: 'ダウンタイムほぼなし',
    summaryKo: '겉티 거의 없음(약간 뻐근함) → 여행 첫날·약속 전에도 부담 적음',
    summaryJa: '見た目の変化が少なく、旅行初日や予定の前でも受けやすい',
    makeupKo: '당일 세안·화장 가능 (고온 사우나 3~5일 주의)',
    makeupJa: '当日から洗顔・メイク可（高温サウナは3〜5日控える）'
  },
  potenza: {
    badgeKo: '붉은기 2~4일',
    badgeJa: '赤み 2〜4日',
    summaryKo: '붉은기·미세 딱지 2~4일 → 다음날 사진 촬영 일정 시 주의',
    summaryJa: '赤み・細かいかさぶたが2〜4日出るため、翌日の写真予定に注意',
    makeupKo: '세안 다음날·화장 24~48시간 후 권장 (자외선 차단 필수)',
    makeupJa: '洗顔は翌日・メイクは24〜48時間後推奨（日焼け止め必須）'
  },
  'jaw-botox': {
    badgeKo: '시술 10분 · 겉티 없음',
    badgeJa: '施術10分・見た目変化なし',
    summaryKo: '당일 겉티 거의 없음 · 시술 후 4시간 눕기 금지',
    summaryJa: '当日の腫れはほぼなし・施術後4時間は横にならないよう注意',
    makeupKo: '당일 화장 가능 (음주·격한 운동·경락 1주 주의)',
    makeupJa: '当日メイク可（飲酒・激しい運動・マッサージは1週間控える）'
  }
};

export interface OrderGuardOption {
  id: 'no-upsell' | 'total-first' | 'gentle-numbing' | 'one-hour';
  labelKo: string;
  labelJa: string;
  staffLineKo: string;
  staffLineJa: string;
}

export const ORDER_GUARD_OPTIONS: OrderGuardOption[] = [
  {
    id: 'no-upsell',
    labelKo: '추가 시술 권유 사양',
    labelJa: '追加施術のおすすめ辞退',
    staffLineKo: '오늘은 미리 정한 시술만 받고 싶습니다. 추가 시술 권유는 정중히 사양하겠습니다.',
    staffLineJa: '本日は事前に決めた施術のみ希望します。追加施術のおすすめは丁重に辞退いたします。'
  },
  {
    id: 'total-first',
    labelKo: '마취·팁·VAT 총액 먼저 확인',
    labelJa: '麻酔・チップ・税込総額を事前確認',
    staffLineKo: '시술 전 마취크림·전용 팁·부가세(10%)가 모두 포함된 최종 결제 금액을 먼저 확인하고 싶습니다.',
    staffLineJa: '施術前に麻酔クリーム・専用チップ・税金(10%)すべて込みの最終金額を先に確認したいです。'
  },
  {
    id: 'gentle-numbing',
    labelKo: '통증 약함 · 마취 충분히',
    labelJa: '痛みに弱い・麻酔しっかり',
    staffLineKo: '통증에 약한 편이라 마취크림을 충분히 도포하고 시간을 넉넉히 두어 주시면 감사하겠습니다.',
    staffLineJa: '痛みに弱いため、麻酔クリームをしっかり塗り十分な時間をおいていただけると助かります。'
  },
  {
    id: 'one-hour',
    labelKo: '1시간 이내 종료 희망',
    labelJa: '1時間以内の終了希望',
    staffLineKo: '다음 일정이 있어 가능하면 1시간 이내로 마칠 수 있는지 먼저 알려주시면 감사하겠습니다.',
    staffLineJa: '次の予定があるため、可能であれば1時間以内に終わるか事前に教えていただけると助かります。'
  }
];

export interface ClinicBundleItem {
  menu: MenuItem;
  baseKrw: number;
  vatKrw: number;
  totalKrw: number;
  krTotalJpy: number;
  jpBenchmarkJpy: number;
  savingsJpy: number;
  seoulAvgKrw: number;
  seoulAvgJpy: number;
  seoulSampleCount: number;
  noteJa: string;
  noteKo: string;
}

export interface ClinicBundleSummary {
  items: ClinicBundleItem[];
  visits: number;
  baseKrw: number;
  vatKrw: number;
  totalKrw: number;
  krTotalJpy: number;
  jpBenchmarkJpy: number;
  savingsJpy: number;
  savingsPct: number;
  seoulAvgKrw: number;
  seoulAvgJpy: number;
  seoulSampleCount: number;
  seoulDiffKrw: number;
  seoulDiffJpy: number;
  seoulDiffPct: number;
}

export function detectAppBasePath(pathname: string): string {
  const normalized = pathname.replace(/\/index\.html$/, '/');
  const idx = normalized.indexOf('/clinic/');
  if (idx >= 0) {
    const prefix = normalized.slice(0, idx + 1);
    return prefix.endsWith('/') ? prefix : `${prefix}/`;
  }
  const stripped = normalized.replace(/\/+$/, '');
  return stripped ? `${stripped}/` : '/';
}

export function parseRoute(pathname: string, basePath: string): RouteMatch {
  const safeBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  let rel = pathname;
  if (rel.startsWith(safeBase)) {
    rel = rel.slice(safeBase.length);
  } else {
    rel = rel.replace(/^\/+/, '');
  }
  rel = rel.replace(/\/index\.html$/, '').replace(/\/+$/, '');
  const m = rel.match(/^clinic\/([^/]+)$/);
  if (m && m[1]) {
    return { view: 'clinic', clinicId: decodeURIComponent(m[1]) };
  }
  return { view: 'home', clinicId: null };
}

export function buildClinicUrl(
  origin: string,
  basePath: string,
  clinicId: string,
  params: {
    lang: Lang;
    menuId: string;
    menus?: string[];
    visits?: number;
    includeVat?: boolean;
  }
): string {
  const safeBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const url = new URL(`${safeBase}clinic/${encodeURIComponent(clinicId)}`, origin);
  const p = new URLSearchParams();
  p.set('lang', params.lang);
  p.set('menu', params.menuId);
  if (params.menus && params.menus.length > 0) {
    const isSingleSame = params.menus.length === 1 && params.menus[0] === params.menuId;
    if (!isSingleSame) {
      p.set('menus', params.menus.join(','));
    }
  }
  if (params.visits && params.visits > 1) {
    p.set('v', String(params.visits));
  }
  if (params.includeVat === false) {
    p.set('vat', '0');
  }
  url.search = p.toString();
  return url.toString();
}

export function computeClinicBundle(
  place: PlaceItem,
  allMenus: MenuItem[],
  selectedMenuIds: string[],
  visits: number,
  includeVat: boolean,
  krwPer100Jpy: number,
  vatRate: number,
  allPlaces?: PlaceItem[]
): ClinicBundleSummary {
  const safeVisits = Math.max(1, Math.min(6, Math.round(visits)));
  const items: ClinicBundleItem[] = [];

  for (const menu of allMenus) {
    if (!selectedMenuIds.includes(menu.id)) continue;
    const offer = place.prices[menu.id];
    if (!offer) continue;

    const applyVat = includeVat && place.vatExcluded && menu.vatAppliesInKorea;
    const baseKrw = offer.krw * safeVisits;
    const vatKrw = applyVat ? Math.round(baseKrw * vatRate) : 0;
    const totalKrw = baseKrw + vatKrw;
    const krTotalJpy = krwToJpy(totalKrw, krwPer100Jpy);
    const jpBenchmarkJpy = menu.jpBenchmarkJpy * safeVisits;
    const savingsJpy = jpBenchmarkJpy - krTotalJpy;

    const avgStats = allPlaces
      ? computeSeoulAverage(allPlaces, menu, krwPer100Jpy, includeVat, vatRate)
      : null;
    const seoulAvgKrw = avgStats ? avgStats.avgTotalKrw * safeVisits : totalKrw;
    const seoulAvgJpy = avgStats ? krwToJpy(seoulAvgKrw, krwPer100Jpy) : krTotalJpy;
    const seoulSampleCount = avgStats ? avgStats.sampleCount : 1;

    items.push({
      menu,
      baseKrw,
      vatKrw,
      totalKrw,
      krTotalJpy,
      jpBenchmarkJpy,
      savingsJpy,
      seoulAvgKrw,
      seoulAvgJpy,
      seoulSampleCount,
      noteJa: offer.noteJa,
      noteKo: offer.noteKo
    });
  }

  const baseKrw = items.reduce((s, it) => s + it.baseKrw, 0);
  const vatKrw = items.reduce((s, it) => s + it.vatKrw, 0);
  const totalKrw = baseKrw + vatKrw;
  const krTotalJpy = items.reduce((s, it) => s + it.krTotalJpy, 0);
  const jpBenchmarkJpy = items.reduce((s, it) => s + it.jpBenchmarkJpy, 0);
  const savingsJpy = jpBenchmarkJpy - krTotalJpy;
  const savingsPct =
    jpBenchmarkJpy > 0 ? Math.round((savingsJpy / jpBenchmarkJpy) * 100) : 0;

  const seoulAvgKrw = items.reduce((s, it) => s + it.seoulAvgKrw, 0);
  const seoulAvgJpy = seoulAvgKrw > 0 ? krwToJpy(seoulAvgKrw, krwPer100Jpy) : 0;
  const seoulSampleCount =
    items.length > 0 ? Math.min(...items.map((it) => it.seoulSampleCount)) : 0;
  const seoulDiffKrw = seoulAvgKrw - totalKrw;
  const seoulDiffJpy = seoulAvgJpy - krTotalJpy;
  const seoulDiffPct =
    seoulAvgKrw > 0 ? Math.round((seoulDiffKrw / seoulAvgKrw) * 100) : 0;

  return {
    items,
    visits: safeVisits,
    baseKrw,
    vatKrw,
    totalKrw,
    krTotalJpy,
    jpBenchmarkJpy,
    savingsJpy,
    savingsPct,
    seoulAvgKrw,
    seoulAvgJpy,
    seoulSampleCount,
    seoulDiffKrw,
    seoulDiffJpy,
    seoulDiffPct
  };
}

export interface OrderSheetOutput {
  ko: string;
  ja: string;
}

export function buildOrderSheetMessages(
  place: PlaceItem,
  bundle: ClinicBundleSummary,
  guardIds: Array<OrderGuardOption['id']>,
  includeVat: boolean
): OrderSheetOutput {
  const menuLinesKo = bundle.items.map(
    (it) =>
      `- ${it.menu.nameKo}${bundle.visits > 1 ? ` × ${bundle.visits}회` : ''} (공식가 ${formatKrw(it.baseKrw)}${it.vatKrw > 0 ? ' + VAT 10%' : ''})`
  );
  const menuLinesJa = bundle.items.map(
    (it) =>
      `・${it.menu.nameJa}${bundle.visits > 1 ? ` × ${bundle.visits}回` : ''}（公式 ${formatKrw(it.baseKrw)}${it.vatKrw > 0 ? ' + 税10%' : ''} / 約${formatJpy(it.krTotalJpy)}）`
  );

  const selectedGuards = ORDER_GUARD_OPTIONS.filter((g) => guardIds.includes(g.id));
  const guardLinesKo = selectedGuards.map((g) => `• ${g.staffLineKo}`);
  const guardLinesJa = selectedGuards.map((g) => `・${g.staffLineJa}`);

  const totalLineKo = `${formatKrw(bundle.totalKrw)} (${includeVat ? '부가세 10% 포함 예상' : '부가세 별도 기준'} / 약 ${formatJpy(bundle.krTotalJpy)})`;
  const totalLineJa = `${formatJpy(bundle.krTotalJpy)}（${formatKrw(bundle.totalKrw)}・${includeVat ? '税込10%目安' : '税別基準'}）`;

  const ko = [
    `안녕하세요. 일본에서 방문한 고객입니다.`,
    `[${place.nameKo}] 공식 홈페이지 가격을 보고 아래 시술을 희망합니다.`,
    '',
    '[희망 시술]',
    ...(menuLinesKo.length > 0 ? menuLinesKo : ['- 상담 시 선택 예정']),
    `예상 합계: ${totalLineKo}`,
    '',
    ...(guardLinesKo.length > 0 ? ['[부탁드리는 사항]', ...guardLinesKo, ''] : []),
    `확인 사항: ${place.caveatKo}`,
    '친절히 안내해 주셔서 감사합니다.'
  ].join('\n');

  const ja = [
    `こんにちは。日本から来院した患者です。`,
    `【${place.nameJa}】の公式料金を見て、以下の施術を希望しています。`,
    '',
    '【希望メニュー】',
    ...(menuLinesJa.length > 0 ? menuLinesJa : ['・カウンセリング時に決定']),
    `目安合計: ${totalLineJa}`,
    '',
    ...(guardLinesJa.length > 0 ? ['【お願いしたいこと】', ...guardLinesJa, ''] : []),
    `事前確認メモ: ${place.caveatJa}`,
    'ご丁寧なご案内をよろしくお願いいたします。'
  ].join('\n');

  return { ko, ja };
}

export interface InquiryFormInput {
  date: string;
  timeSlot: 'any' | 'morning' | 'afternoon' | 'evening';
  people: number;
  firstVisit: boolean;
  guestName: string;
}

const TIME_LABELS: Record<InquiryFormInput['timeSlot'], { ko: string; ja: string }> = {
  any: { ko: '시간 무관', ja: '時間帯おまかせ' },
  morning: { ko: '오전 (10:00~12:00)', ja: '午前（10:00〜12:00）' },
  afternoon: { ko: '오후 (13:00~17:00)', ja: '午後（13:00〜17:00）' },
  evening: { ko: '저녁 (17:00 이후)', ja: '夕方（17:00以降）' }
};

export function buildInquiryMessages(
  place: PlaceItem,
  bundle: ClinicBundleSummary,
  form: InquiryFormInput
): OrderSheetOutput {
  const dateKo = form.date || '(희망 날짜 미입력)';
  const dateJa = form.date || '（希望日未入力）';
  const timeKo = TIME_LABELS[form.timeSlot].ko;
  const timeJa = TIME_LABELS[form.timeSlot].ja;
  const nameKo = form.guestName.trim() || '(여권 영문명 입력)';
  const nameJa = form.guestName.trim() || '（パスポート英字名を入力）';
  const people = Math.max(1, Math.min(5, Math.round(form.people)));
  const menusKo = bundle.items.map((i) => `${i.menu.nameKo}${bundle.visits > 1 ? ` × ${bundle.visits}회` : ''}`).join(', ') || '상담 후 결정';
  const menusJa = bundle.items.map((i) => `${i.menu.nameJa}${bundle.visits > 1 ? ` × ${bundle.visits}回` : ''}`).join('・') || '相談して決定';

  const langReqKo = place.japaneseSupport
    ? '일본어 상담이 가능한 시간대로 배정 부탁드립니다.'
    : '일본어 대응이 어려우시면 번역기나 간단한 영어로 상담 부탁드립니다.';
  const langReqJa = place.japaneseSupport
    ? '日本語対応が可能な時間帯でご案内いただけますと幸いです。'
    : '日本語対応が難しい場合は、翻訳アプリや簡単な英語でのご対応をお願いいたします。';

  const ko = [
    `안녕하세요, ${place.nameKo} 예약 문의드립니다.`,
    `일본에서 방문하는 ${form.firstVisit ? '첫 방문(초진)' : '재방문'} 고객입니다.`,
    '',
    `• 성함(여권 영문): ${nameKo}`,
    `• 희망 일시: ${dateKo} / ${timeKo}`,
    `• 인원: ${people}명`,
    `• 희망 시술: ${menusKo}`,
    '',
    `${langReqKo}`,
    '마취크림·전용 팁·부가세 포함 예상 금액도 함께 알려주시면 감사하겠습니다.'
  ].join('\n');

  const ja = [
    `こんにちは、${place.nameJa}への予約についてお問い合わせです。`,
    `日本から伺う${form.firstVisit ? '初診' : '再診'}の患者です。`,
    '',
    `・お名前（パスポート表記）：${nameJa}`,
    `・ご希望日時：${dateJa} / ${timeJa}`,
    `・人数：${people}名`,
    `・希望施術：${menusJa}`,
    '',
    `${langReqJa}`,
    '麻酔クリーム・専用チップ・税金込みのおおよその総額もあわせて教えていただけますと幸いです。'
  ].join('\n');

  return { ko, ja };
}

export type TransitOriginPreset = 'current' | 'incheon' | 'gimpo' | 'seoul-station' | 'sinchon';

const TRANSIT_PRESET_COORDS: Record<Exclude<TransitOriginPreset, 'current'>, string> = {
  incheon: '37.460191,126.440696',
  gimpo: '37.558654,126.794474',
  'seoul-station': '37.554722,126.970833',
  sinchon: '37.5559,126.9369'
};

export function buildTransitUrl(
  preset: TransitOriginPreset,
  place: PlaceItem,
  userLocation?: GeoPoint | null
): string {
  const dest = `${place.lat},${place.lng}`;
  const params = new URLSearchParams({
    api: '1',
    destination: dest,
    travelmode: 'transit'
  });
  if (preset === 'current') {
    if (userLocation) {
      params.set('origin', `${userLocation.lat},${userLocation.lng}`);
    }
  } else {
    params.set('origin', TRANSIT_PRESET_COORDS[preset]);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function findNearbyClinics(
  dataset: PriceDataset,
  place: PlaceItem,
  menuId: string,
  limit = 3
): Array<{ place: PlaceItem; distanceMeters: number; baseKrw: number }> {
  const candidates: Array<{ place: PlaceItem; distanceMeters: number; baseKrw: number }> = [];
  for (const other of dataset.places) {
    if (other.id === place.id) continue;
    const offer = other.prices[menuId];
    if (!offer) continue;
    const dist = haversineMeters(place.lat, place.lng, other.lat, other.lng);
    candidates.push({ place: other, distanceMeters: dist, baseKrw: offer.krw });
  }
  candidates.sort((a, b) => a.distanceMeters - b.distanceMeters || a.baseKrw - b.baseKrw);
  return candidates.slice(0, limit);
}

const SAVED_STORAGE_KEY = 'dopagaki_saved_clinics_v1';

export function loadSavedClinicIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function toggleSavedClinicId(clinicId: string): { saved: boolean; ids: string[] } {
  const current = new Set(loadSavedClinicIds());
  let saved: boolean;
  if (current.has(clinicId)) {
    current.delete(clinicId);
    saved = false;
  } else {
    current.add(clinicId);
    saved = true;
  }
  const ids = Array.from(current);
  try {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage quota errors
  }
  return { saved, ids };
}
