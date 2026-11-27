import type { AgentPriceTag } from '@/lib/agent-types.ts';
import type { PlaceItem, PriceOffer } from '@/types.ts';

const RULES: Array<[AgentPriceTag, RegExp]> = [
  ['first_visit', /첫\s?방문|체험/],
  ['event', /이벤트|특가|프로모션|메가세일/],
  ['day_limited', /요일|평일|주말|화수목|타임\s?특가/],
  ['app_benefit', /앱|카카오|카톡/],
  ['anesthesia', /마취/],
  ['extra_fee', /팁값?(?!\s?포함)[^·()]*?(?:별도|미포함)/]
];

const PRICE_KIND = new Set<AgentPriceTag>(['first_visit', 'event', 'day_limited', 'app_benefit']);
const AMOUNT_RE = /(\d[\d,]*(?:\.\d+)?)\s*(?:(만)\s*원?|원)/g;
const CLAUSE_SPLIT = /[·()]/;

const MENU_WORDS: Record<string, RegExp> = {
  'rejuran-2cc': /리쥬란/,
  'shrink-300': /슈링크/,
  potenza: /포텐자/,
  'jaw-botox': /보톡스|톡신/,
  'juvelook-2cc': /쥬베룩/,
  're2o-5cc': /리투오/,
  'inmode-fx': /인모드/,
  lalapeel: /라라필/,
  aquapeel: /아쿠아필/
};

function classify(text: string): AgentPriceTag[] {
  return RULES.filter(([, re]) => re.test(text)).map(([tag]) => tag);
}

function extractAmounts(text: string): Set<number> {
  const out = new Set<number>();
  AMOUNT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = AMOUNT_RE.exec(text)) !== null) {
    const val = Number(m[1].replace(/,/g, ''));
    if (Number.isFinite(val)) {
      out.add(Math.round(val * (m[2] ? 10000 : 1)));
    }
  }
  return out;
}

function noteTags(note: string, krw: number): Set<AgentPriceTag> {
  const tags = new Set<AgentPriceTag>(classify(note));
  const amounts = extractAmounts(note);
  if (amounts.size < 2 || !amounts.has(krw)) return tags;

  const kept = new Set<AgentPriceTag>();
  for (const clause of note.split(CLAUSE_SPLIT)) {
    const clauseAmounts = extractAmounts(clause);
    if (clauseAmounts.size > 0 && !clauseAmounts.has(krw)) continue;
    for (const tag of classify(clause)) kept.add(tag);
  }
  const result = new Set<AgentPriceTag>();
  for (const t of tags) {
    if (!PRICE_KIND.has(t)) result.add(t);
  }
  for (const t of kept) {
    if (PRICE_KIND.has(t)) result.add(t);
  }
  return result;
}

function caveatTags(caveat: string, menuId: string): Set<AgentPriceTag> {
  const tags = new Set<AgentPriceTag>(classify(caveat));
  const named = Object.entries(MENU_WORDS)
    .filter(([, re]) => re.test(caveat))
    .map(([mid]) => mid);
  if (named.length > 0 && !named.includes(menuId)) {
    for (const t of PRICE_KIND) tags.delete(t);
  }
  return tags;
}

export function classifyPriceTags(place: PlaceItem, menuId: string, offer: PriceOffer): AgentPriceTag[] {
  const found = new Set<AgentPriceTag>([
    ...caveatTags(place.caveatKo ?? '', menuId),
    ...noteTags(offer.noteKo ?? '', offer.krw)
  ]);
  return RULES.map(([tag]) => tag).filter((tag) => found.has(tag));
}
