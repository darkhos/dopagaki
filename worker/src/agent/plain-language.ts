import type { AgentLang } from '@/lib/agent-types.ts';

/**
 * Deterministic safety net that converts dermatology/technical jargon into plain,
 * friendly everyday Korean or Japanese if the model ever slips and outputs jargon.
 */
type ReplacementRule = [RegExp, string | ((match: string) => string)];

const KO_REPLACEMENTS: ReplacementRule[] = [
  [/다운타임이\s*없(?:는|어|어요)/g, (match) => match.replace('다운타임이', '붓기·붉은기가')],
  [/다운타임\s*없(?:는|이)/g, (match) => match.replace(/다운타임\s*/, '붓기·붉은기 ')],
  [/다운타임이/g, '회복 기간이'],
  [/다운타임은/g, '회복 기간은'],
  [/다운타임을/g, '회복 기간을'],
  [/다운타임/g, '회복 기간(붓기·붉은기)'],
  [/SMAS\s*층?|근막\s*층?/gi, '피부 속 탄력층'],
  [/동종\s*진피|ECM/gi, '피부 재생 성분'],
  [/진피\s*층?/g, '피부 속층'],
  [/저작근/g, '턱 근육'],
  [/니들\s*RF|마이크로\s*니들\s*RF/gi, '미세 바늘 모공 관리'],
  [/마이크로\s?니들/g, '미세 바늘'],
  [/고주파/g, '열 에너지'],
  [/엠보싱\s*자국|엠보싱/g, '오돌토돌한 주사 자국'],
  [/PDRN|PN\s*성분/gi, '연어 유래 재생 성분'],
  [/비침습(?:적)?/g, '바늘 없는'],
  [/도포\s*마취/g, '바르는 마취크림']
];

const JA_REPLACEMENTS: ReplacementRule[] = [
  [/ダウンタイム(?:が)?(?:ない|無い|なし|ゼロ)/g, '当日からすぐ外出OK'],
  [/ダウンタイム(?:が)?短い/g, '赤みや腫れがすぐ引く'],
  [/ダウンタイム/g, '施術後の赤み・腫れ（回復期間）'],
  [/SMAS層?|筋膜/gi, '肌の奥のハリ層'],
  [/真皮層?/g, '肌の内側'],
  [/咬筋/g, 'エラの筋肉'],
  [/ニードル\s*RF|マイクロニードル\s*RF/gi, '細い針の毛穴ケア'],
  [/マイクロニードル/g, '細い針'],
  [/高周波/g, '温熱ケア'],
  [/エンボス(?:加工|感)?/g, '注射あとのぽこぽこ感'],
  [/非侵襲(?:的)?/g, '針を使わない'],
  [/塗布麻酔/g, '塗る麻酔クリーム']
];

export function simplifyJargon(text: string, lang: AgentLang): string {
  if (!text) return text;
  const rules = lang === 'ja' ? JA_REPLACEMENTS : KO_REPLACEMENTS;
  let out = text;
  for (const [re, rep] of rules) {
    out = typeof rep === 'function' ? out.replace(re, rep) : out.replace(re, rep);
  }
  return out;
}
