export type MessageLang = 'ko' | 'ja';
export type MessagePurpose = 'inquiry' | 'order';

export interface BilingualLine {
  primary: string;
  gloss: string;
  spacer: boolean;
}

export interface InquiryQuickFill {
  guestName: string;
  dateText: string;
  people: number | null;
}

/**
 * Decides the safest default outbound language for a clinic:
 * - Pre-visit inquiry in JA UI to a Japanese-speaking clinic → send directly in Japanese ('ja').
 * - Pre-visit inquiry to a Korean-only clinic (or KO UI) → send clean Korean ('ko').
 * - Walk-in reception memo → always Korean ('ko') so Seoul desk staff read it immediately.
 */
export function resolveDefaultSendLang(
  uiLang: MessageLang,
  japaneseSupport: boolean,
  purpose: MessagePurpose
): MessageLang {
  if (purpose === 'inquiry' && uiLang === 'ja' && japaneseSupport) {
    return 'ja';
  }
  return 'ko';
}

/**
 * Pairs primary outbound text with its line-aligned translation gloss so travelers
 * can verify every single Korean sentence before copying only the clean outbound text.
 */
export function buildInterlinearLines(primaryText: string, glossText: string): BilingualLine[] {
  const primaryLines = primaryText.split('\n');
  const glossLines = glossText.split('\n');
  const total = Math.max(primaryLines.length, glossLines.length);
  const rows: BilingualLine[] = [];
  for (let i = 0; i < total; i += 1) {
    const primary = (primaryLines[i] ?? '').trimEnd();
    const gloss = (glossLines[i] ?? '').trimEnd();
    if (!primary.trim() && !gloss.trim()) {
      rows.push({ primary: '', gloss: '', spacer: true });
    } else {
      rows.push({ primary, gloss, spacer: false });
    }
  }
  return rows;
}

/**
 * Applies live mini-form overrides (passport name, preferred date/time, party size)
 * to pre-rendered KO + JA inquiry templates without extra network round-trips.
 */
export function applyInquiryQuickFill(
  ko: string,
  ja: string,
  fill: InquiryQuickFill
): { ko: string; ja: string } {
  const name = fill.guestName.trim();
  const date = fill.dateText.trim();
  const people =
    fill.people !== null && Number.isFinite(fill.people)
      ? Math.max(1, Math.min(5, Math.round(fill.people)))
      : null;

  let nextKo = ko;
  let nextJa = ja;

  if (name) {
    nextKo = nextKo.replace(/^(•\s*성함\(여권 영문\)\s*:\s*).*$/m, `$1${name}`);
    nextJa = nextJa.replace(/^(・\s*お名前（パスポート表記）\s*：\s*).*$/m, `$1${name}`);
  }
  if (date) {
    nextKo = nextKo.replace(/^(•\s*희망 일시\s*:\s*).*$/m, `$1${date}`);
    nextJa = nextJa.replace(/^(・\s*ご希望日時\s*：\s*).*$/m, `$1${date}`);
  }
  if (people !== null) {
    nextKo = nextKo.replace(/^(•\s*인원\s*:\s*).*$/m, `$1${people}명`);
    nextJa = nextJa.replace(/^(・\s*人数\s*：\s*).*$/m, `$1${people}名`);
  }

  return { ko: nextKo, ja: nextJa };
}
