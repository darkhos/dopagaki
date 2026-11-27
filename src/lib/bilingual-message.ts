export type MessageLang = 'ko' | 'ja';
export type MessagePurpose = 'inquiry' | 'order';

export interface BilingualLine {
  primary: string;
  gloss: string;
  spacer: boolean;
}

export interface InquiryQuickFill {
  guestName: string;
  dateKo: string;
  dateJa: string;
  timeSlot: 'any' | 'morning' | 'afternoon' | 'evening';
  people: number | null;
}

const SLOT_TEXT: Record<InquiryQuickFill['timeSlot'], { ko: string; ja: string }> = {
  any: { ko: '시간 무관', ja: '時間帯おまかせ' },
  morning: { ko: '오전 (10:00~12:00)', ja: '午前（10:00〜12:00）' },
  afternoon: { ko: '오후 (13:00~17:00)', ja: '午後（13:00〜17:00）' },
  evening: { ko: '저녁 (17:00 이후)', ja: '夕方（17:00以降）' }
};

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
  const dateKo = fill.dateKo.trim();
  const dateJa = fill.dateJa.trim();
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
  if (dateKo || dateJa || fill.timeSlot !== 'any') {
    const slot = SLOT_TEXT[fill.timeSlot];
    const dKo = dateKo || '(희망 날짜 미입력)';
    const dJa = dateJa || '（希望日未入力）';
    nextKo = nextKo.replace(/^(•\s*희망 일시\s*:\s*).*$/m, `$1${dKo} / ${slot.ko}`);
    nextJa = nextJa.replace(/^(・\s*ご希望日時\s*：\s*).*$/m, `$1${dJa} / ${slot.ja}`);
  }
  if (people !== null) {
    nextKo = nextKo.replace(/^(•\s*인원\s*:\s*).*$/m, `$1${people}명`);
    nextJa = nextJa.replace(/^(・\s*人数\s*：\s*).*$/m, `$1${people}名`);
  }

  return { ko: nextKo, ja: nextJa };
}
