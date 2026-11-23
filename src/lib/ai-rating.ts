import type { PlaceItem } from '../types.ts';
import { getBrandReview, type ReviewScope, type ReviewVerificationTier } from '../data/brand-reviews.ts';

export interface AiRatingAxis {
  id: 'transparency' | 'care' | 'comfort' | 'readiness';
  labelKo: string;
  labelJa: string;
  score: number;
}

export interface ClinicAiRating {
  /** Overall AI rating on a 5.0 scale, rounded to 1 decimal place (e.g. 4.6) */
  overall: number;
  /** Formatted string like "4.6" */
  formatted: string;
  /** Visual tier for subtle emphasis */
  grade: 'top' | 'good' | 'caution';
  /** Whether score is backed by branch-specific review text vs brand reference */
  reviewScope: ReviewScope;
  verificationTier: ReviewVerificationTier;
  /** 4 transparent sub-scores out of 5.0 */
  axes: [AiRatingAxis, AiRatingAxis, AiRatingAxis, AiRatingAxis];
  /** Concise 1-line explanation of why this clinic received its score */
  summaryKo: string;
  summaryJa: string;
}

function clampScore(v: number, min = 2.4, max = 4.9): number {
  return Math.max(min, Math.min(max, Math.round(v * 10) / 10));
}

/**
 * Computes a deterministic, auditable 5.0-scale AI review score for each clinic
 * by analyzing its verified branch/brand review signals, upsell/wait watchouts,
 * care/facility strengths, price transparency & Seoul-relative value, and visitor readiness.
 *
 * Results are cached per place.id for instant list rendering and sorting.
 */
const ratingCache = new Map<string, ClinicAiRating>();

function computePriceValueDelta(place: PlaceItem, allPlaces?: PlaceItem[]): number {
  if (!allPlaces || allPlaces.length === 0) return 0;
  const menuIds = Object.keys(place.prices).filter((k) => Boolean(place.prices[k]));
  if (menuIds.length === 0) return 0;

  let pctSum = 0;
  let counted = 0;
  for (const mId of menuIds) {
    const own = place.prices[mId]?.krw;
    if (!own) continue;
    let sum = 0;
    let n = 0;
    for (const p of allPlaces) {
      const k = p.prices[mId]?.krw;
      if (k) {
        sum += k;
        n += 1;
      }
    }
    if (n > 0) {
      const avg = sum / n;
      pctSum += (avg - own) / avg;
      counted += 1;
    }
  }
  if (counted === 0) return 0;
  const avgDiscount = pctSum / counted; // e.g. +0.25 means 25% cheaper than Seoul avg
  return Math.max(-0.35, Math.min(0.45, avgDiscount * 1.4));
}

export function getClinicAiRating(place: PlaceItem, allPlaces?: PlaceItem[]): ClinicAiRating {
  const cacheKey = `${place.id}:${allPlaces ? allPlaces.length : 0}`;
  const cached = ratingCache.get(cacheKey);
  if (cached) return cached;

  const rev = getBrandReview(place);
  const posText = `${rev.vibeKo} ${rev.shortTagKo} ${rev.prosKo.join(' ')}`;
  const warnText = `${rev.vibeKo} ${rev.shortTagKo} ${rev.watchoutsKo.join(' ')}`;
  const fullText = `${posText} ${warnText}`;
  const traitIds = new Set(rev.traits.map((t) => t.id));
  const priceDelta = computePriceValueDelta(place, allPlaces);

  // Axis 1: Price Transparency & Low-Upsell (30% weight)
  let transparency = 4.0 + priceDelta;
  if (place.sourceType === 'official_standard') transparency += 0.25;
  if (traitIds.has('low_upsell')) transparency += 0.65;
  if (/최저가|1\+1|가성비|정찰|금액\s*선제시|웹\s*장바구니/.test(posText)) transparency += 0.2;
  if (/업셀링\s*최주의|업셀링\s*주의\s*후기\s*최다|추가\s*시술\s*권유\s*최주의|추가\s*시술\s*권유\s*주의\s*후기\s*최다/.test(fullText)) {
    transparency -= 1.35;
  } else if (traitIds.has('upsell_warn')) {
    transparency -= 0.75;
  } else if (/예산\s*고정|추가\s*권유|패키지/.test(warnText)) {
    transparency -= 0.35;
  }
  if (rev.verificationTier === 'limited') transparency -= 0.45;
  transparency = clampScore(transparency, 2.5, 4.9);

  // Axis 2: Treatment Care & Craft (30% weight)
  let care = 4.0;
  if (/피부과\s*전문의|전문의\s*비율|1:1\s*정밀|대표원장/.test(posText)) care += 0.65;
  if (traitIds.has('careful')) care += 0.45;
  if (/마크뷰|정품\s*(개봉|팁|신뢰)|인바디|진정\s*케어|진정케어|디자인\s*상담/.test(posText)) care += 0.2;
  if (/공장형|기계적|흐름\s*빠름|회전\s*매우\s*빠름/.test(warnText)) care -= 0.4;
  if (/상담\s*짧|시술\s*시간\s*짧|담당자\s*편차|응대\s*편차/.test(warnText)) care -= 0.25;
  if (/소통\s*마찰/.test(warnText)) care -= 0.35;
  if (rev.reviewScope === 'brand') care -= 0.15;
  if (rev.verificationTier === 'limited') care -= 0.55;
  care = clampScore(care, 2.8, 4.9);

  // Axis 3: Wait Time, Space & Convenience (20% weight)
  let comfort = 3.9;
  if (traitIds.has('short_wait')) comfort += 0.6;
  if (traitIds.has('clean_space')) comfort += 0.45;
  if (traitIds.has('sunday_night')) comfort += 0.4;
  if (/초근접|초역세권|도보\s*1분|도보\s*2분/.test(`${place.stationKo} ${posText}`)) comfort += 0.15;
  if (traitIds.has('wait_warn')) comfort -= 0.55;
  if (/대형점\s*대기|초대형|관광객\s*피크|주말\s*혼잡/.test(warnText)) comfort -= 0.2;
  if (/커튼\s*구획|분주|공장형/.test(warnText)) comfort -= 0.2;
  if (rev.verificationTier === 'limited') comfort -= 0.35;
  comfort = clampScore(comfort, 2.7, 4.9);

  // Axis 4: Visitor Readiness & Review Confidence (20% weight)
  let readiness = 3.7;
  if (place.japaneseSupport) readiness += 0.6;
  if (traitIds.has('jp_line')) readiness += 0.35;
  if (rev.verificationTier === 'jp_kr_verified') readiness += 0.35;
  else if (rev.verificationTier === 'kr_verified') readiness += 0.1;
  else readiness -= 0.7;
  if (rev.reviewScope === 'branch') readiness += 0.2;
  else readiness -= 0.25;
  if (place.id === 'drpetit-gangnam') readiness -= 0.75; // Active rebrand to UH CELL requires confirmation
  readiness = clampScore(readiness, 2.5, 4.9);

  const weighted =
    transparency * 0.3 +
    care * 0.3 +
    comfort * 0.2 +
    readiness * 0.2;
  const overall = clampScore(weighted, 2.8, 4.8);

  const grade: ClinicAiRating['grade'] =
    overall >= 4.4 ? 'top' : overall >= 3.9 ? 'good' : 'caution';

  const axes: [AiRatingAxis, AiRatingAxis, AiRatingAxis, AiRatingAxis] = [
    {
      id: 'transparency',
      labelKo: '가격 투명 · 강매 적음',
      labelJa: '価格透明・勧誘少',
      score: transparency
    },
    {
      id: 'care',
      labelKo: '시술 꼼꼼함 · 전문성',
      labelJa: '施術の丁寧さ・専門性',
      score: care
    },
    {
      id: 'comfort',
      labelKo: '대기 · 시설 · 편의성',
      labelJa: '待ち時間・空間・利便性',
      score: comfort
    },
    {
      id: 'readiness',
      labelKo: '외국인 대응 · 리뷰 신뢰',
      labelJa: '訪韓対応・口コミ信頼度',
      score: readiness
    }
  ];

  // Build concise, factual 1-line AI rationale reflecting top strength & main deduction
  const sortedByHigh = [...axes].sort((a, b) => b.score - a.score);
  const sortedByLow = [...axes].sort((a, b) => a.score - b.score);
  const best = sortedByHigh[0];
  const weakest = sortedByLow[0];

  let summaryKo: string;
  let summaryJa: string;

  if (place.id === 'drpetit-gangnam') {
    summaryKo = '시술·시설 후기는 양호하나 2026.03.31 UH CELL 상호변경 확인 필요로 보수적 산정';
    summaryJa = '施術・空間評価は良好だが2026年3月のUH CELL名称変更確認要のため控えめに算出';
  } else if (rev.verificationTier === 'limited') {
    summaryKo = '공개 독립 후기 표본이 적어 보수적으로 산정 · 방문 전 외부 실후기 확인 권장';
    summaryJa = '公開口コミ標本が少ないため控えめに算出・来院前に外部レポ確認推奨';
  } else if (rev.reviewScope === 'brand') {
    summaryKo = `브랜드 공개 후기·공식가 기반 추정 (${best.labelKo} 강점 · 지점 실후기 확인 권장)`;
    summaryJa = `ブランド口コミ・公式価格から推定（${best.labelJa}が強み・店舗別レポ確認推奨）`;
  } else if (traitIds.has('upsell_warn')) {
    summaryKo = `${best.labelKo}(${best.score.toFixed(1)}) 강점 · 다만 추가 시술 권유 주의 후기로 감점 반영`;
    summaryJa = `${best.labelJa}(${best.score.toFixed(1)})が強み・追加勧誘注意の口コミで減点`;
  } else if (weakest.score <= 3.6) {
    summaryKo = `${best.labelKo}(${best.score.toFixed(1)}) 강점 · ${weakest.labelKo}(${weakest.score.toFixed(1)}) 항목은 방문 전 체크 권장`;
    summaryJa = `${best.labelJa}(${best.score.toFixed(1)})が強み・${weakest.labelJa}(${weakest.score.toFixed(1)})は事前確認推奨`;
  } else {
    summaryKo = `${best.labelKo}(${best.score.toFixed(1)})·${sortedByHigh[1].labelKo}(${sortedByHigh[1].score.toFixed(1)}) 중심 균형 잡힌 지점 실후기`;
    summaryJa = `${best.labelJa}(${best.score.toFixed(1)})・${sortedByHigh[1].labelJa}(${sortedByHigh[1].score.toFixed(1)})を中心に高バランスな店舗評価`;
  }

  const result: ClinicAiRating = {
    overall,
    formatted: overall.toFixed(1),
    grade,
    reviewScope: rev.reviewScope,
    verificationTier: rev.verificationTier,
    axes,
    summaryKo,
    summaryJa
  };

  ratingCache.set(cacheKey, result);
  return result;
}
