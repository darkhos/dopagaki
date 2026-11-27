export type ChatLang = 'ko' | 'ja';

const HANGUL_RE = /[\uAC00-\uD7A3\u3131-\u318E]/g;
const KANA_RE = /[\u3040-\u309F\u30A0-\u30FF\uFF66-\uFF9F]/g;
const HIRAGANA_RE = /[\u3040-\u309F]/g;
const CJK_RE = /[\u4E00-\u9FFF]/g;

/**
 * Detects whether a chat message is written in Korean or Japanese so Dopa
 * always answers in the user's message language regardless of UI toggle.
 * Falls back to `fallback` for ASCII/number-only queries (e.g. "HIFU 300").
 */
export function detectMessageLang(text: string, fallback: ChatLang): ChatLang {
  const hangul = (text.match(HANGUL_RE) ?? []).length;
  const kana = (text.match(KANA_RE) ?? []).length;
  const hiragana = (text.match(HIRAGANA_RE) ?? []).length;
  const cjk = (text.match(CJK_RE) ?? []).length;

  if (hangul === 0 && (kana > 0 || cjk > 0)) return 'ja';
  if (hangul > 0 && kana === 0 && cjk === 0) return 'ko';
  if (hangul > 0 && (kana > 0 || cjk > 0)) {
    const jpChars = kana + cjk;
    if (hiragana > 0 && jpChars >= hangul) return 'ja';
    return hangul >= jpChars ? 'ko' : 'ja';
  }
  return fallback;
}
