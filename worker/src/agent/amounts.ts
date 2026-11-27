/**
 * 답변 속 금액을 도구 결과·사용자 메시지와 대조한다 (팀 apps/api/src/api/agent/amounts.py 포팅).
 */
export type Currency = 'JPY' | 'KRW';

export interface Money {
  currency: Currency;
  value: number;
  start: number;
  end: number;
}

const UNITS: Record<string, number> = {
  억: 100_000_000,
  万: 10_000,
  만: 10_000,
  천: 1_000,
  千: 1_000
};

const NUM_SRC = '\\d[\\d,]*(?:\\.\\d+)?';
const AMT_SRC = `${NUM_SRC}(?:\\s?[억万만천千](?:\\s?${NUM_SRC})?)*`;
const JPY_PRE = '[¥￥]|JPY\\s?';
const KRW_PRE = '[₩￦]|KRW\\s?';
const JPY_SUF = '円|엔|yen\\b|JPY\\b';
const KRW_SUF = '원|ウォン|won\\b|KRW\\b';
const RANGE_SRC = '\\s?[~〜～–—-]\\s?';

const MONEY_RE = new RegExp(
  `(?:(?<jpyPre>${JPY_PRE})|(?<krwPre>${KRW_PRE}))(?<preNum>${AMT_SRC})` +
    `|(?<![\\d.,])(?<sufNum>${AMT_SRC})\\s?(?:(?<jpySuf>${JPY_SUF})|(?<krwSuf>${KRW_SUF}))`,
  'gi'
);
const RANGE_START_RE = new RegExp(`(?<![\\d.,])(?<num>${AMT_SRC})${RANGE_SRC}$`);
const RANGE_END_RE = new RegExp(
  `^${RANGE_SRC}(?<num>${AMT_SRC})(?!\\s?(?:${JPY_SUF}|${KRW_SUF}))`,
  'i'
);
const BARE_MAN_RE = new RegExp(`(?<![\\d.,])(${NUM_SRC}\\s?[万만](?:\\s?${NUM_SRC})?)`, 'g');
const TOKEN_RE = new RegExp(`${NUM_SRC}|[억万만천千]`, 'g');
const SENTENCE_RE = /.+?(?:[.!?](?=\s|$)|[。！？]|$)/g;
const PARENS_RE = /\s?[(（][^()（）\n]*[)）]/g;

function normalizeFullwidth(text: string): string {
  return text.replace(/[０-９，．]/g, (ch) => {
    if (ch === '，') return ',';
    if (ch === '．') return '.';
    return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
  });
}

export function parseNumber(text: string): number | null {
  let total = 0;
  let current: number | null = null;
  const cleaned = text.replace(/\s+/g, '');
  const tokens = cleaned.match(TOKEN_RE);
  if (!tokens) return null;
  for (const token of tokens) {
    if (token in UNITS) {
      total += (current !== null ? current : 1) * UNITS[token];
      current = null;
    } else {
      const parsed = Number(token.replace(/,/g, ''));
      if (!Number.isFinite(parsed)) return null;
      current = parsed;
    }
  }
  total += current ?? 0;
  return Math.round(total);
}

function resolveRangeStart(low: number, highText: string, high: number): number {
  let unit = 1;
  for (const ch of highText) {
    if (ch in UNITS) {
      unit = UNITS[ch];
      break;
    }
  }
  return unit > 1 && low * unit <= high ? low * unit : low;
}

function foundOverlaps(found: Money[], pos: number): boolean {
  return found.some((f) => f.start <= pos && pos < f.end);
}

export function findMoney(rawText: string): Money[] {
  const text = normalizeFullwidth(rawText);
  const found: Money[] = [];
  MONEY_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MONEY_RE.exec(text)) !== null) {
    const g = m.groups ?? {};
    const isJpy = Boolean(g.jpyPre || g.jpySuf);
    const currency: Currency = isJpy ? 'JPY' : 'KRW';
    const numText = g.preNum || g.sufNum;
    if (!numText) continue;
    const value = parseNumber(numText);
    if (value === null) continue;
    const matchStart = m.index;
    const matchEnd = matchStart + m[0].length;
    if (g.sufNum) {
      const before = text.slice(0, matchStart);
      const startMatch = RANGE_START_RE.exec(before);
      if (startMatch?.groups?.num && !foundOverlaps(found, startMatch.index)) {
        const low = parseNumber(startMatch.groups.num);
        if (low !== null) {
          found.push({
            currency,
            value: resolveRangeStart(low, numText, value),
            start: startMatch.index,
            end: startMatch.index + startMatch[0].length
          });
        }
      }
    }
    found.push({ currency, value, start: matchStart, end: matchEnd });
    if (g.preNum) {
      const after = text.slice(matchEnd);
      const endMatch = RANGE_END_RE.exec(after);
      const high = endMatch?.groups?.num ? parseNumber(endMatch.groups.num) : null;
      if (endMatch && high !== null && high >= value) {
        const numOffset = endMatch[0].indexOf(endMatch.groups!.num);
        found.push({
          currency,
          value: high,
          start: matchEnd + numOffset,
          end: matchEnd + endMatch[0].length
        });
      }
    }
  }
  return found;
}

export function moneyKey(currency: Currency, value: number): string {
  return `${currency}:${value}`;
}

export function collectArtifactAmounts(value: unknown, key = '', out = new Set<string>()): Set<string> {
  if (value === null || value === undefined) return out;
  if (Array.isArray(value)) {
    for (const item of value) collectArtifactAmounts(item, key, out);
  } else if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      collectArtifactAmounts(v, k, out);
    }
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    if (key.endsWith('Jpy') || key.endsWith('_jpy')) {
      out.add(moneyKey('JPY', Math.abs(Math.round(value))));
    } else if (key.endsWith('Krw') || key.endsWith('_krw')) {
      out.add(moneyKey('KRW', Math.abs(Math.round(value))));
    } else if (key === 'krwPer100Jpy' || key === 'krw_per_100_jpy') {
      out.add(moneyKey('JPY', 100));
      out.add(moneyKey('KRW', Math.round(value)));
      out.add(moneyKey('KRW', Math.trunc(value)));
      out.add(moneyKey('JPY', 1));
      out.add(moneyKey('KRW', Math.round(value / 100)));
    }
  }
  return out;
}

export function addUserAmounts(text: string, known: Set<string>): void {
  for (const m of findMoney(text)) {
    known.add(moneyKey(m.currency, m.value));
  }
  BARE_MAN_RE.lastIndex = 0;
  let bare: RegExpExecArray | null;
  while ((bare = BARE_MAN_RE.exec(normalizeFullwidth(text))) !== null) {
    const val = parseNumber(bare[1]);
    if (val !== null) {
      known.add(moneyKey('JPY', val));
      known.add(moneyKey('KRW', val));
    }
  }
}

export function addToolTextAmounts(text: string, known: Set<string>): void {
  for (const m of findMoney(text)) {
    known.add(moneyKey(m.currency, m.value));
  }
}

function findBadMoney(text: string, known: Set<string>): Money[] {
  return findMoney(text).filter((m) => !known.has(moneyKey(m.currency, m.value)));
}

function dropParentheticals(line: string, known: Set<string>): string {
  return line.replace(PARENS_RE, (whole) => (findBadMoney(whole, known).length > 0 ? '' : whole));
}

export function dropUnknownAmounts(text: string, known: Set<string>): { kept: string; dropped: Money[] } {
  const dropped = findBadMoney(text, known);
  if (dropped.length === 0) return { kept: text, dropped: [] };

  const keptLines: string[] = [];
  for (const rawLine of text.split('\n')) {
    if (findBadMoney(rawLine, known).length === 0) {
      keptLines.push(rawLine);
      continue;
    }
    const line = dropParentheticals(rawLine, known);
    if (findBadMoney(line, known).length === 0) {
      keptLines.push(line);
      continue;
    }
    const stripped = line.trimStart();
    if (
      stripped.startsWith('|') ||
      stripped.startsWith('・') ||
      stripped.startsWith('•') ||
      /^(?:[-*]|\d+[.)])\s/.test(stripped)
    ) {
      continue;
    }
    const sentences = line.match(SENTENCE_RE) ?? [];
    const kept = sentences.filter((s) => findBadMoney(s, known).length === 0).join('').trim();
    if (kept) keptLines.push(kept);
  }

  return {
    kept: keptLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    dropped
  };
}
