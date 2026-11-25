import type { ConciergeConcernId, ConciergeTimingId, VisitorType } from './concierge.ts';
import { RESIDENT_AREAS } from './concierge.ts';

/**
 * Rule-based reader for the concierge text box (JA / KO), runs in the browser.
 * It only fills the same answers the chips fill; anything it can't read stays
 * undefined so the chat asks for it. No network, no storage.
 */

export type AreaKey = (typeof RESIDENT_AREAS)[number];
export type BudgetCurrency = 'JPY' | 'KRW';
/** amount null = "no limit"; currency null = number without a unit (resolved by visitor type). */
export interface ParsedBudget {
  amount: number | null;
  currency: BudgetCurrency | null;
}
export type SafetyFlag = 'pregnancy' | 'medical';

export interface ConciergeParse {
  visitor?: VisitorType;
  budget?: ParsedBudget;
  timing?: ConciergeTimingId;
  areaId?: AreaKey;
  /** undefined = not mentioned, [] = "anything / you choose". */
  concerns?: ConciergeConcernId[];
  noNeedle?: boolean;
  safety?: SafetyFlag;
  /** How many answer fields were read (safety not counted). */
  fieldCount: number;
}

const RESIDENT_RE =
  /在住|住んで|留学|ワーホリ|ワーキングホリデー|語学堂|語学院|語学学校|駐在|在韓|거주|살고\s*있|사는|유학|워홀|워킹\s*홀리데이|어학당|교환\s*학생/;
const RESIDENT_WEAK_RE = /バイト|授業|大学|学校|알바|수업|학교|대학/;
const TRAVELER_RE = /旅行|観光|帰国|帰[るり]|フライト|飛行機|弾丸|여행|관광|귀국|비행기/;

const AREA_RULES: Array<[AreaKey, RegExp]> = [
  ['sinchon', /新村|シンチョン|신촌|延世|ヨンセ|연세|西江|ソガン|서강|梨花|イファ|이화/],
  ['hongdae', /弘大|ホンデ|홍대|合井|ハプチョン|합정|延南|ヨンナム|연남/],
  ['gangnam', /江南|カンナム|강남|新沙|シンサ|신사|狎鴎亭|アックジョン|압구정|清潭|チョンダム|청담/],
  ['myeongdong', /明洞|ミョンドン|명동|鐘路|チョンノ|종로|東大門|トンデムン|동대문|乙支路|을지로/],
  ['seongsu', /聖水|ソンス|성수|建大|コンデ|건대/],
  ['yeouido', /汝矣島|ヨイド|여의도|永登浦|ヨンドンポ|영등포/],
  ['jamsil', /蚕室|チャムシル|잠실|松坡|ソンパ|송파/],
  ['gwanak', /ソウル大|서울대|新林|シンリム|신림|舎堂|サダン|사당|冠岳|クァナク|관악/]
];

const CONCERN_RULES: Array<[ConciergeConcernId, RegExp]> = [
  ['pores', /毛穴|黒ずみ|角栓|いちご鼻|ニキビ跡|ニキビ痕|クレーター|ポテンツァ|アクアピール|모공|블랙헤드|피지|여드름\s*(흉터|자국)|포텐자|아쿠아필/],
  ['glow', /ツヤ|艶|透明感|くすみ|水光|ララピール|윤기|광채|칙칙|물광|라라필|맑은\s*피부/],
  ['lift', /たるみ|小顔|リフト|フェイスライン|二重あご|二重顎|もたつき|シュリンク|インモード|탄력|리프팅|턱선|이중턱|처짐|처진|브이\s*라인|슈링크|인모드/],
  ['dry', /乾燥|小じわ|しわ|シワ|カサカサ|リジュラン|건조|주름|푸석|리쥬란/],
  ['jaw', /エラ(?!ー)|食いしばり|歯ぎしり|ボトックス|사각턱|이갈이|턱\s*근육|보톡스/],
  ['skinbase', /肌育|ハリ(?!ウッド)|肌質改善|ブナジュ|リトゥオ|ジュベルック|스킨\s*부스터|피부결|피부\s*밀도|부나주|리투오|쥬베룩/]
];

const OMAKASE_RE = /なんとなく|おまかせ|お任せ|何でも|なんでも|わからない|分からない|알아서|아무거나|잘\s*모르/;

const NEEDLE_RE =
  /(針|注射|바늘|주사)[^。.!！?？\n]{0,8}?(こわ|怖|苦手|無理|むり|ムリ|嫌|いや|イヤ|NG|ng|ダメ|だめ|なし|無し|避け|무서|무섭|싫|못|안\s*돼|없는|X|x)|痛いの(は|が)?(苦手|無理|ダメ|嫌)|痛みに弱|아픈\s*(거|건|것)\s*(싫|못)|통증에\s*약/;

const PREGNANCY_RE = /妊娠|妊婦|授乳|임신|임산부|수유/;
const MEDICAL_RE =
  /服用|薬を飲|持病|アトピー|皮膚炎|ケロイド|ヘルペス|약을?\s*먹|복용|지병|아토피|피부염|켈로이드|헤르페스/;

const NO_LIMIT_RE =
  /上限(は)?(なし|ない)|予算(は)?(なし|気にしない|関係ない|いくらでも)|いくらでも|예산(은|는)?\s*(상관\s*없|무제한|신경\s*안)|돈은?\s*상관\s*없|상관\s*없어/;

/** Units that mean "not money" right after a number. */
const NON_MONEY_AFTER = /^\s*(日|일|泊|박|分|분|回|회|cc|CC|u|U|ショット|샷|歳|살|km|m|時|시|%|％|代|대|人|명|本|병|部位|부위)/;

function readBudget(text: string): ParsedBudget | undefined {
  if (NO_LIMIT_RE.test(text)) return { amount: null, currency: null };
  const t = text.replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
  const re = /(¥|₩)?\s*(\d+(?:\.\d+)?)\s*(万|만|千|천|k|K)?\s*(円|えん|엔|yen|ウォン|원|won)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const [whole, prefix, num, mult, cur] = m;
    if (!whole.trim()) {
      re.lastIndex += 1;
      continue;
    }
    const after = t.slice(m.index + whole.length);
    if (!mult && !cur && !prefix) {
      // Bare number: money only when large and not followed by a unit like 日 / cc.
      if (Number(num) < 1000 || NON_MONEY_AFTER.test(after)) continue;
    } else if (!cur && !prefix && NON_MONEY_AFTER.test(after)) {
      continue;
    }
    let amount = Number(num);
    if (mult === '万' || mult === '만') amount *= 10000;
    else if (mult === '千' || mult === '천' || mult === 'k' || mult === 'K') amount *= 1000;
    let currency: BudgetCurrency | null = null;
    if (prefix === '¥' || /円|えん|엔|yen/.test(cur ?? '')) currency = 'JPY';
    if (prefix === '₩' || /ウォン|원|won/.test(cur ?? '')) currency = 'KRW';
    if (!(amount > 0) || !Number.isFinite(amount)) continue;
    return { amount: Math.round(amount), currency };
  }
  return undefined;
}

function daysToTiming(days: number): ConciergeTimingId {
  if (days <= 1) return 'soon';
  if (days <= 3) return 'few';
  return 'free';
}

function readTiming(text: string): ConciergeTimingId | undefined {
  const t = text.replace(/\d+\s*泊\s*\d+\s*日|\d+\s*박\s*\d+\s*일/g, ' ');
  if (/明後日|あさって|しあさって|모레|글피/.test(t)) return 'few';
  if (/今日|きょう|明日|あした|あす|오늘|내일/.test(t)) return 'soon';
  const n = /あと\s*(\d+)\s*日|(\d+)\s*日\s*(後|ご|で帰|に帰|しか)|(\d+)\s*일\s*(뒤|후|남|밖에)/.exec(t);
  if (n) {
    const days = Number(n[1] ?? n[2] ?? n[4]);
    if (Number.isFinite(days)) return daysToTiming(days);
  }
  if (/来週|再来週|来月|しばらく|予定(は)?(ない|なし)|特に予定|다음\s*주|다음\s*달|당분간|일정\s*(은|이)?\s*(없|X)/.test(t)) {
    return 'free';
  }
  return undefined;
}

export function parseConciergeText(input: string): ConciergeParse {
  const text = (input ?? '').normalize('NFKC').slice(0, 300);
  const out: ConciergeParse = { fieldCount: 0 };
  if (!text.trim()) return out;

  if (PREGNANCY_RE.test(text)) out.safety = 'pregnancy';
  else if (MEDICAL_RE.test(text)) out.safety = 'medical';

  if (RESIDENT_RE.test(text)) out.visitor = 'resident';
  else if (TRAVELER_RE.test(text)) out.visitor = 'traveler';
  else if (RESIDENT_WEAK_RE.test(text)) out.visitor = 'resident';

  const budget = readBudget(text);
  if (budget) out.budget = budget;

  const timing = readTiming(text);
  if (timing) out.timing = timing;

  for (const [id, re] of AREA_RULES) {
    if (re.test(text)) {
      out.areaId = id;
      break;
    }
  }

  const concerns = CONCERN_RULES.filter(([, re]) => re.test(text)).map(([id]) => id);
  if (concerns.length > 0) out.concerns = concerns;
  else if (OMAKASE_RE.test(text)) out.concerns = [];

  if (NEEDLE_RE.test(text)) out.noNeedle = true;

  out.fieldCount = [out.visitor, out.budget, out.timing, out.areaId, out.concerns, out.noNeedle].filter(
    (v) => v !== undefined
  ).length;
  return out;
}

/** Budget in the visitor's own currency (traveler JPY, resident KRW); null = no limit. */
export function budgetForVisitor(visitor: VisitorType, b: ParsedBudget, krwPer100Jpy: number): number | null {
  if (b.amount === null) return null;
  const currency = b.currency ?? (visitor === 'traveler' ? 'JPY' : 'KRW');
  if (visitor === 'traveler') {
    return currency === 'JPY' ? b.amount : Math.round((b.amount * 100) / krwPer100Jpy);
  }
  return currency === 'KRW' ? b.amount : Math.round((b.amount * krwPer100Jpy) / 100);
}

const AI_CONCERNS = new Set<ConciergeConcernId>(['pores', 'glow', 'lift', 'dry', 'jaw', 'skinbase']);

/**
 * Turns the Worker's JSON into a ConciergeParse, keeping only known values.
 * Anything malformed is dropped, so a bad model answer can only mean "not understood".
 */
export function aiResultToParse(raw: unknown): ConciergeParse {
  const out: ConciergeParse = { fieldCount: 0 };
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;

  if (r.visitor === 'traveler' || r.visitor === 'resident') out.visitor = r.visitor;

  if (r.budget_kind === 'unlimited') {
    out.budget = { amount: null, currency: null };
  } else if (r.budget_kind === 'limit' && typeof r.budget_amount === 'number' && r.budget_amount > 0) {
    const currency = r.budget_currency === 'JPY' || r.budget_currency === 'KRW' ? r.budget_currency : null;
    out.budget = { amount: Math.round(Math.min(r.budget_amount, 100_000_000)), currency };
  }

  if (typeof r.days_until === 'number' && r.days_until >= 0 && Number.isFinite(r.days_until)) {
    out.timing = daysToTiming(r.days_until);
  }

  if (typeof r.area === 'string' && (RESIDENT_AREAS as readonly string[]).includes(r.area)) {
    out.areaId = r.area as AreaKey;
  }

  if (r.concerns_mode === 'listed' && Array.isArray(r.concerns)) {
    const list = r.concerns.filter((c): c is ConciergeConcernId => AI_CONCERNS.has(c as ConciergeConcernId));
    if (list.length > 0) out.concerns = [...new Set(list)];
  } else if (r.concerns_mode === 'anything') {
    out.concerns = [];
  }

  if (r.no_needle === true) out.noNeedle = true;
  if (r.safety === 'pregnancy' || r.safety === 'medical') out.safety = r.safety;

  out.fieldCount = [out.visitor, out.budget, out.timing, out.areaId, out.concerns, out.noNeedle].filter(
    (v) => v !== undefined
  ).length;
  return out;
}

/** Rule fields win; AI only fills what the rules left empty. Safety from either side sticks. */
export function mergeParses(rules: ConciergeParse, ai: ConciergeParse): ConciergeParse {
  const merged: ConciergeParse = {
    visitor: rules.visitor ?? ai.visitor,
    budget: rules.budget ?? ai.budget,
    timing: rules.timing ?? ai.timing,
    areaId: rules.areaId ?? ai.areaId,
    concerns: rules.concerns ?? ai.concerns,
    noNeedle: rules.noNeedle ?? ai.noNeedle,
    safety: rules.safety ?? ai.safety,
    fieldCount: 0
  };
  for (const k of Object.keys(merged) as Array<keyof ConciergeParse>) {
    if (merged[k] === undefined) delete merged[k];
  }
  merged.fieldCount = [merged.visitor, merged.budget, merged.timing, merged.areaId, merged.concerns, merged.noNeedle].filter(
    (v) => v !== undefined
  ).length;
  return merged;
}
