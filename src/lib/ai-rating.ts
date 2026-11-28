import type { PlaceItem } from '../types.ts';
import {
  getBrandReview,
  getClinicOpenedDate,
  getClinicSafetyAudit,
  type ReviewScope,
  type ReviewVerificationTier
} from '../data/brand-reviews.ts';
import { getExternalReviewPosts } from '../data/external-review-posts.ts';

export interface AiRatingAxis {
  id: 'transparency' | 'care' | 'comfort' | 'readiness';
  labelKo: string;
  labelJa: string;
  score: number;
}

export interface AiRatingReason {
  key: 'basis' | 'transparency' | 'care' | 'comfort' | 'readiness';
  titleKo: string;
  titleJa: string;
  bodyKo: string;
  bodyJa: string;
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
  /** True when clinic opened very recently and visitor reviews are still pending */
  isNewClinic: boolean;
  /** Verified opening date (YYYY.MM.DD) when isNewClinic is true */
  openedDate: string | null;
  /** 4 transparent sub-scores out of 5.0 */
  axes: [AiRatingAxis, AiRatingAxis, AiRatingAxis, AiRatingAxis];
  /** Detailed 5-line explanation grounded in real platform reviews and verified prices */
  reasons: [
    AiRatingReason,
    AiRatingReason,
    AiRatingReason,
    AiRatingReason,
    AiRatingReason
  ];
  /** Concise 1-line explanation for compact table tooltips */
  summaryKo: string;
  summaryJa: string;
}

interface PriceValueStats {
  delta: number;
  avgDiscountPct: number;
  menuCount: number;
  offeredKeys: string[];
}

const MENU_ORDER = [
  'rejuran-2cc',
  'shrink-300',
  'potenza',
  'jaw-botox',
  're2o-5cc',
  'juvelook-2cc',
  'inmode-fx',
  'lalapeel',
  'aquapeel'
] as const;

const MENU_SHORT_KO: Record<string, string> = {
  'rejuran-2cc': '리쥬란',
  'shrink-300': '슈링크',
  potenza: '포텐자',
  'jaw-botox': '보톡스',
  're2o-5cc': '리투오',
  'juvelook-2cc': '쥬베룩',
  'inmode-fx': '인모드',
  lalapeel: '라라필',
  aquapeel: '아쿠아필'
};

const MENU_SHORT_JA: Record<string, string> = {
  'rejuran-2cc': 'リジュラン',
  'shrink-300': 'シュリンク',
  potenza: 'ポテンツァ',
  'jaw-botox': 'ボトックス',
  're2o-5cc': 'ブナジュ',
  'juvelook-2cc': 'ジュベルック',
  'inmode-fx': 'インモード',
  lalapeel: 'ララピール',
  aquapeel: 'アクアピール'
};

interface ExternalPostSignals {
  postCount: number;
  careNegRatio: number;
  feeNegRatio: number;
  waitNegRatio: number;
}

const POST_CARE_NEG_RE =
  /크게\s*실망|재방문\s*의사\s*없음|모델링팩\s*방치|정품\s*기기\s*아님|마취크림\s*누락|신경마취\s*부위\s*트러블|강압\s*응대|성의\s*없이|불친절|반존댓말|호명\s*누락|못\s*받고\s*귀가|태도.*아쉽|응대·서비스\s*면에서\s*불만족|마취\s*대기.*짧게|마취크림\s*도포\s*시간이\s*짧/;
const POST_FEE_NEG_RE =
  /추가금.*달라|오락가락\s*산정|오안내|돈\s*더\s*받|추가금\s*안내|강매|과한\s*권유/;
const POST_WAIT_NEG_RE =
  /1시간.*대기|1시간을\s*기다|40분\s*대기|예약\s*취소|20분\s*이상\s*지연|방치\(체감\s*30분\)/;

function analyzeExternalPosts(place: PlaceItem): ExternalPostSignals {
  const posts = getExternalReviewPosts(place, 'ko');
  if (posts.length === 0) {
    return { postCount: 0, careNegRatio: 0, feeNegRatio: 0, waitNegRatio: 0 };
  }
  let careNeg = 0;
  let feeNeg = 0;
  let waitNeg = 0;
  for (const post of posts) {
    if (POST_CARE_NEG_RE.test(post.summaryKo)) careNeg += 1;
    if (POST_FEE_NEG_RE.test(post.summaryKo)) feeNeg += 1;
    if (POST_WAIT_NEG_RE.test(post.summaryKo)) waitNeg += 1;
  }
  return {
    postCount: posts.length,
    careNegRatio: careNeg / posts.length,
    feeNegRatio: feeNeg / posts.length,
    waitNegRatio: waitNeg / posts.length
  };
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

function computePriceValueStats(place: PlaceItem, allPlaces?: PlaceItem[]): PriceValueStats {
  const menuIds = MENU_ORDER.filter((k) => Boolean(place.prices[k]));
  if (!allPlaces || allPlaces.length === 0 || menuIds.length === 0) {
    return { delta: 0, avgDiscountPct: 0, menuCount: menuIds.length, offeredKeys: menuIds };
  }

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
      const clampedDiff = Math.max(-0.65, Math.min(0.65, (avg - own) / avg));
      pctSum += clampedDiff;
      counted += 1;
    }
  }
  if (counted === 0) {
    return { delta: 0, avgDiscountPct: 0, menuCount: menuIds.length, offeredKeys: menuIds };
  }
  const avgDiscount = pctSum / counted; // e.g. +0.25 means 25% cheaper than Seoul avg
  return {
    delta: Math.max(-0.35, Math.min(0.45, avgDiscount * 1.4)),
    avgDiscountPct: Math.round(avgDiscount * 100),
    menuCount: counted,
    offeredKeys: menuIds
  };
}

function buildBasisReason(
  place: PlaceItem,
  rev: ReturnType<typeof getBrandReview>,
  overall: number,
  axes: [AiRatingAxis, AiRatingAxis, AiRatingAxis, AiRatingAxis],
  hasHeavyUpsell: boolean,
  hasAnyUpsellWarn: boolean
): AiRatingReason {
  const sortedHigh = [...axes].sort((a, b) => b.score - a.score);
  const sortedLow = [...axes].sort((a, b) => a.score - b.score);
  const best = sortedHigh[0];
  const second = sortedHigh[1];
  const weakest = sortedLow.find((a) => a.id !== best.id && a.id !== second.id) ?? sortedLow[0];

  let verdictKo: string;
  let verdictJa: string;

  if (place.id === 'drpetit-gangnam') {
    verdictKo = '시술·시설 후기는 안정적이나 2026.03.31 UH CELL 상호 변경 확인 이슈를 신뢰 항목에 보수적으로 감점 반영했습니다.';
    verdictJa = '施術・空間の評価は安定していますが、2026年3月31日のUH CELL名称変更確認事項を信頼スコアへ保守的に減点反映しました。';
  } else if (getClinicOpenedDate(place.id)) {
    const opened = getClinicOpenedDate(place.id)!;
    verdictKo = `${opened} 신규 개원한 지점으로 실제 방문자 리뷰가 아직 쌓이기 전이라 AI 평점은 집계 중(NEW)으로 안내하며, 정렬용 내부 기준치만 보수적으로 반영했습니다.`;
    verdictJa = `${opened}新規開院の店舗で訪問者口コミがまだ蓄積前のためAI評価は集計中（NEW）と表示し、並び替え用の基準値のみ控えめに設定しています。`;
  } else if (hasHeavyUpsell) {
    verdictKo = `${best.labelKo}(${best.score.toFixed(1)})은 우수하지만, 실후기에서 추가 시술·패키지 권유 주의가 반복 지적돼 가격·강매(${axes[0].score.toFixed(1)}) 감점이 총점을 낮췄습니다.`;
    verdictJa = `${best.labelJa}(${best.score.toFixed(1)})は強みですが、実口コミで追加施術・コース勧誘への注意が繰り返し挙がり、価格・勧誘(${axes[0].score.toFixed(1)})の減点が総合点を押し下げました。`;
  } else if (hasAnyUpsellWarn && axes[0].score <= 3.7) {
    verdictKo = `${best.labelKo}(${best.score.toFixed(1)}) 강점에도 불구하고 상담 시 추가 제안·옵션 조건 확인 필요 후기가 반영돼 가격·강매(${axes[0].score.toFixed(1)})가 중하위권으로 조정됐습니다.`;
    verdictJa = `${best.labelJa}(${best.score.toFixed(1)})が強みな一方、相談時の追加提案やオプション条件確認に関する口コミが価格・勧誘(${axes[0].score.toFixed(1)})に反映されています。`;
  } else if (weakest.id === 'comfort' && weakest.score <= 3.7) {
    verdictKo = `${best.labelKo}(${best.score.toFixed(1)})·${second.labelKo}(${second.score.toFixed(1)}) 평가는 양호하나 주말·피크 시간대 대기·동선 피드백(${weakest.score.toFixed(1)})을 현실적으로 감점 반영했습니다.`;
    verdictJa = `${best.labelJa}(${best.score.toFixed(1)})・${second.labelJa}(${second.score.toFixed(1)})は良好ですが、混雑時間帯の待ち時間や回転重視の動線評価(${weakest.score.toFixed(1)})を減点反映しました。`;
  } else if (overall >= 4.4) {
    verdictKo = `4대 항목 전반이 균형 있게 높으며 특히 ${best.labelKo}(${best.score.toFixed(1)})·${second.labelKo}(${second.score.toFixed(1)}) 실방문 후기가 총점을 끌어올렸습니다.`;
    verdictJa = `4項目全体が高水準で安定しており、特に${best.labelJa}(${best.score.toFixed(1)})・${second.labelJa}(${second.score.toFixed(1)})の実体験評価が総合点を牽引しています。`;
  } else if (sortedLow[0].score >= 4.0) {
    verdictKo = `4개 항목 모두 4.0점 이상으로 고르게 안정적이며, 특히 ${best.labelKo}(${best.score.toFixed(1)}) 평가가 돋보입니다.`;
    verdictJa = `4項目すべて4.0点以上でバランスが安定しており、特に${best.labelJa}(${best.score.toFixed(1)})の評価が際立っています。`;
  } else {
    verdictKo = `${best.labelKo}(${best.score.toFixed(1)})·${second.labelKo}(${second.score.toFixed(1)})은 양호하나, ${sortedLow[0].labelKo}(${sortedLow[0].score.toFixed(1)})의 실방문 주의 포인트를 함께 반영한 점수입니다.`;
    verdictJa = `${best.labelJa}(${best.score.toFixed(1)})・${second.labelJa}(${second.score.toFixed(1)})は良好な水準で、${sortedLow[0].labelJa}(${sortedLow[0].score.toFixed(1)})の来院前確認ポイントを合わせて算出しています。`;
  }

  return {
    key: 'basis',
    titleKo: `종합 산정 (${overall.toFixed(1)}점)`,
    titleJa: `総合算出 (${overall.toFixed(1)}点)`,
    bodyKo: `${place.nameKo} 공개 리뷰(${rev.sourcesLabelKo})를 4대 지표(가격·강매 30% + 시술 30% + 대기·시설 20% + 방한·신뢰 20%)로 합산한 점수입니다. ${verdictKo}`,
    bodyJa: `${place.nameJa}の公開口コミ（${rev.sourcesLabelJa}）を4基準（価格・勧誘30%＋施術30%＋待ち・空間20%＋訪韓信頼20%）で加重算出。${verdictJa}`
  };
}

function buildTransparencyReason(
  place: PlaceItem,
  fullText: string,
  posText: string,
  warnText: string,
  traitIds: Set<string>,
  priceStats: PriceValueStats,
  score: number,
  hasHeavyUpsell: boolean,
  hasFtcPrepaid: boolean,
  hasPostFeeNeg: boolean
): AiRatingReason {
  const { avgDiscountPct, menuCount } = priceStats;
  let pricePosKo: string;
  let pricePosJa: string;

  if (menuCount > 0 && avgDiscountPct >= 6) {
    pricePosKo = `검증된 ${menuCount}개 공식가는 서울 평균 대비 약 ${avgDiscountPct}% 저렴한 편`;
    pricePosJa = `検証済み${menuCount}施術の公式価格はソウル平均より約${avgDiscountPct}%割安`;
  } else if (menuCount > 0 && avgDiscountPct <= -6) {
    const stdSuffixKo =
      place.sourceType === 'official_standard' && avgDiscountPct <= -15
        ? ' (1회 체험가 미적용 표준 정가 기준)'
        : '';
    const stdSuffixJa =
      place.sourceType === 'official_standard' && avgDiscountPct <= -15
        ? '（初回体験特価ではない通常定価基準）'
        : '';
    pricePosKo = `검증된 ${menuCount}개 공식가는 서울 평균 대비 약 ${Math.abs(avgDiscountPct)}% 높은 편${stdSuffixKo}`;
    pricePosJa = `検証済み${menuCount}施術の公式価格はソウル平均より約${Math.abs(avgDiscountPct)}%高め${stdSuffixJa}`;
  } else if (menuCount > 0) {
    pricePosKo = `검증된 ${menuCount}개 공식가는 서울 평균과 비슷한 수준`;
    pricePosJa = `検証済み${menuCount}施術の公式価格はソウル平均並み`;
  } else {
    pricePosKo = '공식 가격표 검증 완료 시술 기준';
    pricePosJa = '公式価格検証済みメニュー基準';
  }

  const priceSourceNoteKo =
    place.sourceType === 'official_standard'
      ? '(홈페이지 정찰·표준가 공개로 가산)'
      : '(공식 이벤트 스크린샷 교차 검증)';
  const priceSourceNoteJa =
    place.sourceType === 'official_standard'
      ? '（公式サイトの標準定価公開で加点）'
      : '（公式イベント画面を照合済み）';

  const openedDate = getClinicOpenedDate(place.id);
  let upsellKo: string;
  let upsellJa: string;

  if (openedDate) {
    upsellKo = `${openedDate} 신규 개원 직후라 실제 방문자의 강매·옵션 후기는 아직 집계 전이며, 공식 홈페이지 가격표 기준으로 안내합니다.`;
    upsellJa = `${openedDate}新規開院直後のため訪問者の勧誘・追加料金レポはまだ集計前であり、公式価格表ベースでご案内しています。`;
  } else if (hasHeavyUpsell) {
    upsellKo = '다만 다수의 공개 후기에서 상담 시 고가 코스·추가 시술 권유 주의가 반복 지적돼 강매 항목에서 대폭 감점됐습니다.';
    upsellJa = 'ただし多くの公開レポで高額コースや追加施術の強い勧誘が指摘されており、勧誘評価で大幅減点しています。';
  } else if (traitIds.has('upsell_warn')) {
    upsellKo = '실후기 중 상담실·담당자별 추가 시술이나 패키지 권유 사례가 언급돼 해당 감점을 반영했습니다.';
    upsellJa = '実口コミに相談時の追加施術・パッケージ提案への注意例があるため、減点要素として織り込んでいます。';
  } else if (/예산\s*고정|추가\s*권유|패키지/.test(warnText)) {
    upsellKo = '일부 후기에서 상태별 추가 제안이나 옵션 안내가 언급돼 예산을 미리 정하는 조건으로 소폭 조정했습니다.';
    upsellJa = '一部レポで肌状態別の追加提案やオプション説明に触れられており、事前予算固定前提で小幅調整しています。';
  } else if (traitIds.has('low_upsell')) {
    upsellKo = '실방문자 후기에서 "강매·불필요한 패키지 권유가 적고 원하는 시술 위주로 진행한다"는 신뢰 평가가 뚜렷해 가산점을 반영했습니다.';
    upsellJa = '「無理な勧誘・不要なコース営業が少なく希望メニュー中心で明朗」との実体験が多く、高い透明性加点となっています。';
  } else {
    upsellKo = '공식 안내가 기반 투명성은 양호하나, 지점 상담 시 세부 옵션 적용 조건을 먼저 확인하는 편이 좋습니다.';
    upsellJa = '公式価格の透明性は良好ですが、相談時に細かいオプション適用条件を事前確認するのが確実です。';
  }

  const extraFlagsKo: string[] = [];
  const extraFlagsJa: string[] = [];
  if (!openedDate && /금액\s*선제시|명랑회계|웹\s*장바구니|정찰/.test(posText)) {
    extraFlagsKo.push('사전 금액 제시·투명 정산 평가');
    extraFlagsJa.push('事前総額提示・明朗会計評価');
  }
  if (/체험가|첫\s*방문|첫방문/.test(fullText)) {
    extraFlagsKo.push('1회 체험가·재방문가 차이 유의');
    extraFlagsJa.push('初回体験価格と通常価格の差に注意');
  }
  if (/부가세|VAT|옵션/.test(fullText)) {
    extraFlagsKo.push('VAT·옵션 추가 여부 사전 확인');
    extraFlagsJa.push('VAT・オプション加算有無の事前確認要');
  }

  if (hasFtcPrepaid) {
    extraFlagsKo.push('공정위 선결제 환불 시정 이력 · 1회 결제 권장');
    extraFlagsJa.push('公取委の先払い返金是正履歴あり・都度払い推奨');
  }
  if (hasPostFeeNeg) {
    extraFlagsKo.push('외부 후기상 추가금·옵션 안내 편차 지적 반영');
    extraFlagsJa.push('外部口コミの追加料金・案内差の指摘を反映');
  }

  const extraKo = extraFlagsKo.length > 0 ? ` (${extraFlagsKo.join(', ')})` : '';
  const extraJa = extraFlagsJa.length > 0 ? `（${extraFlagsJa.join('／')}）` : '';

  return {
    key: 'transparency',
    titleKo: `가격·강매 (${score.toFixed(1)})`,
    titleJa: `価格・勧誘 (${score.toFixed(1)})`,
    bodyKo: `${pricePosKo}${priceSourceNoteKo}입니다. ${upsellKo}${extraKo}`,
    bodyJa: `${pricePosJa}${priceSourceNoteJa}。${upsellJa}${extraJa}`
  };
}

function buildCareReason(
  place: PlaceItem,
  rev: ReturnType<typeof getBrandReview>,
  posText: string,
  warnText: string,
  traitIds: Set<string>,
  priceStats: PriceValueStats,
  score: number,
  hasPostCareNeg: boolean
): AiRatingReason {
  const offeredKo =
    priceStats.offeredKeys
      .slice(0, 4)
      .map((k) => MENU_SHORT_KO[k] ?? k)
      .join('·') || '주요 쁘띠/리프팅';
  const offeredJa =
    priceStats.offeredKeys
      .slice(0, 4)
      .map((k) => MENU_SHORT_JA[k] ?? k)
      .join('・') || '定番プチ/リフティング';

  const openedDate = getClinicOpenedDate(place.id);
  if (openedDate) {
    return {
      key: 'care',
      titleKo: `시술·상담 (${score.toFixed(1)})`,
      titleJa: `施術・対応 (${score.toFixed(1)})`,
      bodyKo: `${offeredKo} 공시가 검증 지점으로, ${openedDate} 신규 개원 직후라 실제 방문자의 시술·상담 후기가 쌓이기 전입니다. 리뷰 축적 전까지는 보수적 기준치를 적용합니다.`,
      bodyJa: `${offeredJa}の価格検証店ですが、${openedDate}新規開院直後のため訪問者の施術・対応口コミはまだ蓄積前です。口コミ蓄積までは控えめな基準値を適用しています。`
    };
  }

  const posDetailsKo: string[] = [];
  const posDetailsJa: string[] = [];
  if (/피부과\s*전문의|전문의\s*비율/.test(posText)) {
    posDetailsKo.push('전문의 연계 진료');
    posDetailsJa.push('専門医連携診療');
  } else if (/1:1\s*정밀|대표원장/.test(posText)) {
    posDetailsKo.push('1:1 맞춤 진단·원장 직접 진료');
    posDetailsJa.push('1対1精密診断・院長直接診療');
  } else if (traitIds.has('careful')) {
    posDetailsKo.push('원장·스태프 꼼꼼 시술');
    posDetailsJa.push('院長・スタッフの丁寧施術');
  }
  if (/혈관|멍/.test(posText)) {
    posDetailsKo.push('주사 통증·혈관·멍 세심 배려');
    posDetailsJa.push('注射の痛み・血管・内出血への細かな配慮');
  } else if (/통증/.test(posText)) {
    posDetailsKo.push('시술 중 통증 세심 체크');
    posDetailsJa.push('施術中の痛みへの細かな声かけ');
  }
  if (/여성\s*원장/.test(posText)) {
    posDetailsKo.push('여성 원장 섬세 진료');
    posDetailsJa.push('女性院長によるきめ細かな診療');
  }
  if (/마크뷰|정품\s*(개봉|팁|신뢰|정량)|정품정량|인바디/.test(posText)) {
    posDetailsKo.push('정품·정량/피부진단 확인');
    posDetailsJa.push('正規品・定量提示／肌診断');
  }
  if (/진정\s*(케어|관리|팩)|클렌징/.test(posText)) {
    posDetailsKo.push('시술 전후 클렌징·진정 케어');
    posDetailsJa.push('施術前後の洗顔・鎮静ケア');
  }
  if (/디자인\s*상담|자연스러운|과하지\s*않/.test(posText)) {
    posDetailsKo.push('자연스러운 디자인 상담');
    posDetailsJa.push('自然なバランスデザイン');
  }

  const warnDetailsKo: string[] = [];
  const warnDetailsJa: string[] = [];
  if (/공장형|기계적|흐름\s*빠름|회전\s*매우\s*빠름/.test(warnText)) {
    warnDetailsKo.push('빠른 공장형 분업 진행');
    warnDetailsJa.push('回転重視の分業進行');
  }
  if (/원장\s*랜덤/.test(warnText)) {
    warnDetailsKo.push('원장 랜덤 배정');
    warnDetailsJa.push('担当医ランダム制');
  }
  if (/상담실장|상담\s*짧|시술\s*시간\s*짧|담당자\s*편차|상담자.*편차/.test(warnText)) {
    warnDetailsKo.push('상담 시간·담당자 편차');
    warnDetailsJa.push('相談時間や担当者による差');
  }
  if (hasPostCareNeg) {
    warnDetailsKo.push('외부 후기상 시술·응대 아쉬움');
    warnDetailsJa.push('外部口コミでの対応・施術面の不満');
  }

  const craftLeadKo =
    posDetailsKo.length > 0
      ? `${posDetailsKo.join(', ')} 평가가 실후기에서 강점으로 꼽혔습니다.`
      : `${rev.vibeKo} 중심의 표준 시술 만족도가 확인됐습니다.`;
  const craftLeadJa =
    posDetailsJa.length > 0
      ? `実口コミでは${posDetailsJa.join('・')}が強みとして挙がっています。`
      : `${rev.vibeJa}中心の標準的な施術満足度が確認されています。`;

  const craftCaveatKo =
    warnDetailsKo.length > 0
      ? ` 반면 ${warnDetailsKo.join('·')} 지적을 감안해 시술 점수를 조정했습니다.`
      : ' 시술 퀄리티 편차 불만이 비교적 적은 편입니다.';
  const craftCaveatJa =
    warnDetailsJa.length > 0
      ? `一方、${warnDetailsJa.join('・')}の声を踏まえて施術点を調整しています。`
      : '施術クオリティ面の大きな不満は少なめです。';

  return {
    key: 'care',
    titleKo: `시술·상담 (${score.toFixed(1)})`,
    titleJa: `施術・対応 (${score.toFixed(1)})`,
    bodyKo: `${offeredKo} 공시가 검증 지점으로, ${craftLeadKo}${craftCaveatKo}`,
    bodyJa: `${offeredJa}の価格検証店として、${craftLeadJa}${craftCaveatJa}`
  };
}

function buildComfortReason(
  place: PlaceItem,
  posText: string,
  warnText: string,
  traitIds: Set<string>,
  score: number,
  hasPostWaitNeg: boolean
): AiRatingReason {
  const openedDate = getClinicOpenedDate(place.id);
  if (openedDate) {
    return {
      key: 'comfort',
      titleKo: `대기·시설 (${score.toFixed(1)})`,
      titleJa: `待ち・空間 (${score.toFixed(1)})`,
      bodyKo: `${place.stationKo} 인접 입지의 ${openedDate} 신규 개원 지점으로, 실제 대기·혼잡 후기는 아직 집계 전입니다. 방문 전 공식 채널에서 예약 현황을 확인하는 편이 안전합니다.`,
      bodyJa: `${place.stationJa}近くに位置する${openedDate}新規開院の店舗で、実際の待ち時間・混雑口コミはまだ集計前です。来院前に公式チャンネルで予約状況をご確認ください。`
    };
  }
  const spaceNotesKo: string[] = [];
  const spaceNotesJa: string[] = [];

  if (/1인실|1인\s*관리실|프라이빗|완전\s*개인실/.test(posText)) {
    spaceNotesKo.push('1인 관리실·프라이빗 공간 호평');
    spaceNotesJa.push('完全個室・プライベート空間好評');
  } else if (traitIds.has('clean_space')) {
    spaceNotesKo.push('깔끔·쾌적한 원내 시설');
    spaceNotesJa.push('清潔で快適な院内環境');
  }
  if (/확장|신설|파우더룸/.test(posText)) {
    spaceNotesKo.push('신설·파우더룸 정돈 우수');
    spaceNotesJa.push('新設・パウダールーム充実');
  }
  if (/셀프\s*세안/.test(warnText)) {
    spaceNotesKo.push('셀프 세안 동선');
    spaceNotesJa.push('セルフ洗顔導線');
  }
  if (/커튼\s*구획|복층|엘리베이터/.test(warnText)) {
    spaceNotesKo.push('커튼 구획·층간 이동 유의');
    spaceNotesJa.push('カーテン仕切り・フロア移動に注意');
  }
  if (traitIds.has('sunday_night') || /일요일.*야간|야간.*일요일/.test(posText)) {
    spaceNotesKo.push('일요일·야간 진료 지원');
    spaceNotesJa.push('日曜・平日夜間診療対応');
  } else if (/일요일/.test(posText)) {
    spaceNotesKo.push('일요일 진료 가능');
    spaceNotesJa.push('日曜診療対応');
  } else if (/20:30|20시|야간|저녁\s*진료/.test(posText)) {
    spaceNotesKo.push('평일 저녁 방문 가능');
    spaceNotesJa.push('平日夜間来院に対応');
  }

  let waitKo: string;
  let waitJa: string;
  if (hasPostWaitNeg) {
    waitKo = '외부 방문 후기에서 긴 대기·지연 사례가 확인돼 대기·편의 항목에서 감점 반영했습니다.';
    waitJa = '外部訪問口コミで長時間の待ち・遅延事例が確認され、待ち・快適項目で減点反映しています。';
  } else if (traitIds.has('short_wait')) {
    waitKo = '실방문자 후기상 회전이 빠르고 대기 시간이 비교적 짧아 가산점을 받았습니다.';
    waitJa = '口コミ上でも回転が速く待ち時間が比較的短いと評価され加点しています。';
  } else if (traitIds.has('wait_warn') || /대형점\s*대기|주말\s*혼잡/.test(warnText)) {
    waitKo = '다만 주말·오후 피크 시간대 대기 발생 후기가 다수 확인돼 대기·편의 항목에서 감점됐습니다.';
    waitJa = 'ただし週末や夕方ピーク時の待ち時間発生レポが多く、待ち・快適項目で減点しています。';
  } else {
    waitKo = '인기 시간대에는 소폭 대기가 생길 수 있어 사전 예약 방문이 무난합니다.';
    waitJa = '人気時間帯は多少の待機が生じ得るため事前予約での来院が安心です。';
  }

  const spaceSummaryKo =
    spaceNotesKo.length > 0 ? spaceNotesKo.join(' · ') : '무난한 역세권 원내 동선';
  const spaceSummaryJa =
    spaceNotesJa.length > 0 ? spaceNotesJa.join('・') : '駅チカの標準的な院内導線';

  return {
    key: 'comfort',
    titleKo: `대기·시설 (${score.toFixed(1)})`,
    titleJa: `待ち・空間 (${score.toFixed(1)})`,
    bodyKo: `${place.stationKo} 인접 입지이며 ${spaceSummaryKo} 특성이 반영됐습니다. ${waitKo}`,
    bodyJa: `${place.stationJa}近くに位置し、${spaceSummaryJa}の傾向を反映。${waitJa}`
  };
}

function buildReadinessReason(
  place: PlaceItem,
  rev: ReturnType<typeof getBrandReview>,
  warnText: string,
  traitIds: Set<string>,
  score: number
): AiRatingReason {
  const langKo = place.japaneseSupport
    ? traitIds.has('jp_line')
      ? '일본어 LINE·상주 통역이 확인돼 외국인 방한 편의가 높습니다.'
      : '일본어 안내 대응이 확인된 지점입니다.'
    : '일본어 상주 직원이 확인되지 않은 한국 로컬 지점이라 아래 한국어 오더시트·번역기 준비가 필요합니다.';
  const langJa = place.japaneseSupport
    ? traitIds.has('jp_line')
      ? '日本語LINE予約と通訳対応が確認されており、訪韓時の安心度が高いです。'
      : '日本語での案内対応が確認されている店舗です。'
    : '日本語スタッフ常駐未確認の韓国ローカル店舗のため、下の韓国語オーダーシート提示が必須です。';

  const openedDate = getClinicOpenedDate(place.id);
  const tierKo = openedDate
    ? `${openedDate} 신규 개원 직후라 실제 방문자 후기는 아직 집계 중입니다.`
    : rev.verificationTier === 'limited'
      ? '공개 독립 후기 표본이 적은 편이라 보수적으로 반영했습니다.'
      : rev.verificationTier === 'jp_kr_verified'
        ? '한·일 양국 플랫폼 실후기가 교차 검증됐습니다.'
        : '국내 플랫폼(캐시닥·모두닥·여신티켓 등) 실후기 중심입니다.';
  const tierJa = openedDate
    ? `${openedDate}新規開院直後のため訪問者口コミは現在集計中です。`
    : rev.verificationTier === 'limited'
      ? '公開口コミ標本が少ないため保守的に反映しています。'
      : rev.verificationTier === 'jp_kr_verified'
        ? '日韓双方のプラットフォーム口コミを交差確認済みです。'
        : '韓国国内アプリ（Cashdoc・Modoodoc・Yeoshin等）の実レポ中心です。';

  const tipsKo: string[] = [];
  const tipsJa: string[] = [];
  if (place.id === 'drpetit-gangnam') {
    tipsKo.push('2026.03.31 UH CELL 상호 변경 여부 예약 재확인 필수');
    tipsJa.push('2026年3月31日のUH CELL名称変更状況を予約時に要確認');
  }
  if (/시간대별\s*통역|통역\s*부재|번역기/.test(warnText)) {
    tipsKo.push('시간대별 통역 시프트 확인 권장');
    tipsJa.push('時間帯による通訳シフト確認推奨');
  }
  if (place.vatExcluded) {
    tipsKo.push('표기가 VAT 10% 별도 기준 · 결제 시 10% 추가 (2026년부터 외국인 환급 없음)');
    tipsJa.push('表記価格はVAT10%別途基準・会計時に10%加算（2026年から還付なし）');
  } else {
    tipsKo.push('결제 전 부가세·옵션 포함 최종 견적 재확인 권장');
    tipsJa.push('会計前に税込・オプション込みの最終見積り確認推奨');
  }

  return {
    key: 'readiness',
    titleKo: `방한·주의 (${score.toFixed(1)})`,
    titleJa: `訪韓・注意 (${score.toFixed(1)})`,
    bodyKo: `${langKo} ${tierKo} ${tipsKo.join(' · ')}.`,
    bodyJa: `${langJa} ${tierJa} ${tipsJa.join('／')}。`
  };
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
  const priceStats = computePriceValueStats(place, allPlaces);
  const postSignals = analyzeExternalPosts(place);
  const hasFtcPrepaid = getClinicSafetyAudit(place).alerts.some((a) => a.id === 'ftc_prepaid');
  const hasHeavyUpsell = /업셀링\s*최주의|업셀링\s*주의\s*후기\s*최다|추가\s*시술\s*권유\s*최주의|추가\s*시술\s*권유\s*주의\s*후기\s*최다/.test(
    fullText
  );

  // Axis 1: Price Transparency & Low-Upsell (30% weight)
  let transparency = 4.0 + priceStats.delta;
  if (place.sourceType === 'official_standard') transparency += 0.25;
  if (traitIds.has('low_upsell')) transparency += 0.65;
  if (/최저가|1\+1|가성비|정찰|금액\s*선제시|웹\s*장바구니/.test(posText)) transparency += 0.2;
  if (hasHeavyUpsell) {
    transparency -= 1.35;
  } else if (traitIds.has('upsell_warn')) {
    transparency -= 0.75;
  } else if (/예산\s*고정|추가\s*권유|패키지/.test(warnText)) {
    transparency -= 0.35;
  }
  if (hasFtcPrepaid) transparency -= 0.25;
  if (postSignals.feeNegRatio > 0) {
    transparency -= postSignals.feeNegRatio >= 0.5 ? 0.35 : 0.2;
  }
  if (rev.verificationTier === 'limited') transparency -= 0.45;
  transparency = clampScore(transparency, 2.5, hasFtcPrepaid ? 4.5 : 4.9);

  // Axis 2: Treatment Care & Craft (30% weight)
  let care = 4.0;
  if (/피부과\s*전문의|전문의\s*비율|1:1\s*정밀|대표원장/.test(posText)) care += 0.65;
  if (traitIds.has('careful')) care += 0.45;
  if (/마크뷰|정품\s*(개봉|팁|신뢰)|인바디|진정\s*케어|진정케어|디자인\s*상담/.test(posText)) care += 0.2;
  if (/공장형|기계적|흐름\s*빠름|회전\s*매우\s*빠름/.test(warnText)) care -= 0.4;
  if (/상담\s*짧|시술\s*시간\s*짧|담당자\s*편차|응대\s*편차/.test(warnText)) care -= 0.25;
  if (/소통\s*마찰/.test(warnText)) care -= 0.35;
  if (postSignals.careNegRatio > 0) {
    care -= postSignals.careNegRatio >= 0.5 ? 0.55 : 0.3;
  }
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
  if (postSignals.waitNegRatio > 0 && !traitIds.has('wait_warn')) {
    comfort -= postSignals.waitNegRatio >= 0.5 ? 0.35 : 0.2;
  }
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

  const openedDate = getClinicOpenedDate(place.id);
  const newClinic = Boolean(openedDate);
  let summaryKo: string;
  let summaryJa: string;

  if (place.id === 'drpetit-gangnam') {
    summaryKo = '시술·시설 후기는 양호하나 2026.03.31 UH CELL 상호변경 확인 필요로 보수적 산정';
    summaryJa = '施術・空間評価は良好だが2026年3月のUH CELL名称変更確認要のため控えめに算出';
  } else if (newClinic) {
    summaryKo = `${openedDate} 신규 개원 · 방문자 후기가 쌓이기 전이라 AI 평점 집계 중`;
    summaryJa = `${openedDate}新規開院・訪問者口コミ集計前のためAI評価は集計中`;
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

  const reasons: [
    AiRatingReason,
    AiRatingReason,
    AiRatingReason,
    AiRatingReason,
    AiRatingReason
  ] = [
    buildBasisReason(place, rev, overall, axes, hasHeavyUpsell, traitIds.has('upsell_warn')),
    buildTransparencyReason(
      place,
      fullText,
      posText,
      warnText,
      traitIds,
      priceStats,
      transparency,
      hasHeavyUpsell,
      hasFtcPrepaid,
      postSignals.feeNegRatio > 0
    ),
    buildCareReason(
      place,
      rev,
      posText,
      warnText,
      traitIds,
      priceStats,
      care,
      postSignals.careNegRatio > 0
    ),
    buildComfortReason(
      place,
      posText,
      warnText,
      traitIds,
      comfort,
      postSignals.waitNegRatio > 0 && !traitIds.has('wait_warn')
    ),
    buildReadinessReason(place, rev, warnText, traitIds, readiness)
  ];

  const result: ClinicAiRating = {
    overall,
    formatted: overall.toFixed(1),
    grade,
    reviewScope: rev.reviewScope,
    verificationTier: rev.verificationTier,
    isNewClinic: newClinic,
    openedDate,
    axes,
    reasons,
    summaryKo,
    summaryJa
  };

  ratingCache.set(cacheKey, result);
  return result;
}
