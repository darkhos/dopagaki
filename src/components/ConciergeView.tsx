import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { motion } from 'motion/react';
import {
  Check,
  Copy,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import dopagakiMarkUrl from '@/assets/dopagaki-mark.png';
import type { Lang, NaverFxSnapshot, PriceDataset } from '@/types.ts';
import {
  formatJpy,
  formatKrw,
  formatRate,
  jpyToKrw,
  krwToJpy
} from '@/lib/calc.ts';
import {
  buildClinicUrl,
  buildOrderSheetMessages,
  computeClinicBundle,
  detectAppBasePath,
  TREATMENT_DOWNTIME,
  TREATMENT_EFFECTS
} from '@/lib/clinic-helpers.ts';
import { getCopy } from '@/lib/i18n.ts';
import { NumFlow, YenFlow } from '@/components/ui/number-flow.tsx';
import { ShareStoryButton } from '@/components/ShareStoryButton.tsx';
import {
  RESIDENT_AREAS,
  RESIDENT_BUDGETS_KRW,
  TRAVELER_BUDGETS_JPY,
  formatMinutes,
  planConcierge,
  treatmentMinutes,
  type ConciergeAnswers,
  type ConciergeConcernId,
  type ConciergeExcluded,
  type ConciergeOffer,
  type ConciergeTimingId,
  type VisitorType
} from '@/lib/concierge.ts';
import { ConciergeEmoji, MenuEmoji, type ConciergeEmojiName } from '@/components/emoji.tsx';
import { track } from '@/lib/analytics.ts';
import {
  budgetForVisitor,
  mergeParses,
  parseConciergeText,
  type ConciergeParse,
  type ParsedBudget,
  type SafetyFlag
} from '@/lib/concierge-parse.ts';
import { askConciergeAi, conciergeAiEnabled } from '@/lib/concierge-ai.ts';

interface ConciergeViewProps {
  lang: Lang;
  dataset: PriceDataset;
  naverFx: NaverFxSnapshot;
  krwPer100Jpy: number;
  includeVat: boolean;
  onOpenClinic: (placeId: string, menus: string[]) => void;
  onApplyMenu: (menuId: string) => void;
  onShowToast: (message: string, isOk?: boolean) => void;
  onHaptic: () => void;
}

type Step = 'visitor' | 'budget' | 'timing' | 'area' | 'concerns' | 'result';
type AreaKey = (typeof RESIDENT_AREAS)[number];
const STEP_ORDER: Step[] = ['visitor', 'budget', 'timing', 'area', 'concerns', 'result'];

/** Chip emoji per concern, borrowed from the treatment it maps to first. */
const CONCERNS: Array<{ id: ConciergeConcernId; emojiMenu: string; ja: string; ko: string }> = [
  { id: 'pores', emojiMenu: 'potenza', ja: '毛穴', ko: '모공' },
  { id: 'glow', emojiMenu: 'lalapeel', ja: 'ツヤ', ko: '윤기' },
  { id: 'lift', emojiMenu: 'shrink-300', ja: '小顔・たるみ', ko: '턱선·탄력' },
  { id: 'dry', emojiMenu: 'aquapeel', ja: '乾燥・小じわ', ko: '속건조·잔주름' },
  { id: 'jaw', emojiMenu: 'jaw-botox', ja: 'エラ', ko: '사각턱' },
  { id: 'skinbase', emojiMenu: 're2o-5cc', ja: '肌育', ko: '피부 밀도' }
];

const QUICK_PROMPTS: Array<{ ko: string; ja: string }> = [
  { ko: '여행 중, 모공·탄력, 1만 엔, 모레 귀국', ja: '旅行中、毛穴とたるみ、1万円、明後日帰国' },
  { ko: '여행 중, 주사 싫어요! 내일 귀국 윤기 피부', ja: '旅行中、針こわい！明日帰国でツヤ肌' },
  { ko: '신촌 거주 5만원, 내일 약속 모공 관리', ja: '新村在住、月5万ウォン、明日予定あり毛穴ケア' }
];

function areaLabel(dataset: PriceDataset, id: AreaKey, isJa: boolean): string {
  const a = dataset.areas.find((x) => x.id === id);
  if (!a) return id;
  return (isJa ? a.nameJa : a.nameKo).split(' (')[0];
}

function budgetLabel(visitor: VisitorType, value: number | null, isJa: boolean): string {
  if (value === null) return isJa ? '上限なし' : '상관없음';
  if (visitor === 'traveler') {
    const man = value / 10000;
    if (isJa) return man >= 1 ? `〜${man}万円` : `〜${value / 1000}千円`;
    return man >= 1 ? `~${man}만 엔` : `~${value / 1000}천 엔`;
  }
  return isJa ? `〜${formatKrw(value)}` : `${value / 10000}만 원까지`;
}

function timingOptions(visitor: VisitorType, isJa: boolean): Array<{ id: ConciergeTimingId; label: string }> {
  if (visitor === 'traveler') {
    return [
      { id: 'soon', label: isJa ? '今日・明日' : '오늘·내일' },
      { id: 'few', label: isJa ? '2〜3日' : '2~3일' },
      { id: 'free', label: isJa ? '4日以上' : '4일 이상' }
    ];
  }
  return [
    { id: 'soon', label: isJa ? '明日' : '내일' },
    { id: 'few', label: isJa ? '2〜3日後' : '2~3일 뒤' },
    { id: 'free', label: isJa ? 'しばらくない' : '당분간 없음' }
  ];
}

function distanceLabel(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 10) * 10}m` : `${(meters / 1000).toFixed(1)}km`;
}

function CounselorMsg({
  isJa,
  showHeader = true,
  children
}: {
  isJa: boolean;
  showHeader?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      className="cg-bot-row"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
    >
      <img
        src={dopagakiMarkUrl}
        alt=""
        className="cg-bot-avatar"
        width={30}
        height={30}
        aria-hidden="true"
      />
      <div className="cg-bot-col">
        {showHeader && (
          <span className="cg-bot-sender">
            {isJa ? 'AIカウンセラー ドパ' : 'AI 상담실장 도파'}
          </span>
        )}
        <div className="cg-bot">{children}</div>
      </div>
    </motion.div>
  );
}

function Answer({ label, isJa, onEdit }: { label: string; isJa: boolean; onEdit: () => void }) {
  return (
    <button
      type="button"
      className="cg-me"
      onClick={onEdit}
      aria-label={isJa ? `${label}（タップで変更）` : `${label} (눌러서 변경)`}
    >
      <span>{label}</span>
      <span className="cg-me-edit" aria-hidden="true">
        {isJa ? '変更' : '변경'}
      </span>
    </button>
  );
}

function Chip({
  label,
  on,
  onClick,
  emoji,
  menuEmoji,
  big
}: {
  label: string;
  on?: boolean;
  onClick: () => void;
  emoji?: ConciergeEmojiName;
  menuEmoji?: string;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      className={`cg-chip${on ? ' is-on' : ''}${big ? ' is-big' : ''}`}
      aria-pressed={on}
      onClick={onClick}
    >
      {emoji && <ConciergeEmoji name={emoji} size={big ? 28 : 18} />}
      {menuEmoji && <MenuEmoji menuId={menuEmoji} size={18} />}
      <span>{label}</span>
    </button>
  );
}

export function ConciergeView({
  lang,
  dataset,
  naverFx,
  krwPer100Jpy,
  includeVat,
  onOpenClinic,
  onApplyMenu,
  onShowToast,
  onHaptic
}: ConciergeViewProps) {
  const isJa = lang === 'ja';
  const copy = getCopy(lang);
  const appBasePath = detectAppBasePath(window.location.pathname);
  const fxNote = copy.receiptRateNote(
    formatRate(krwPer100Jpy),
    naverFx.dateLabel,
    isJa ? naverFx.bankJa : naverFx.bankKo
  );
  const [visitor, setVisitor] = useState<VisitorType | null>(null);
  const [budget, setBudget] = useState<number | null | undefined>(undefined);
  const [sliderJpy, setSliderJpy] = useState<number>(10000);
  const [sliderKrw, setSliderKrw] = useState<number>(50000);
  const [timing, setTiming] = useState<ConciergeTimingId | null>(null);
  const [areaId, setAreaId] = useState<AreaKey | null>(null);
  const [concerns, setConcerns] = useState<ConciergeConcernId[]>([]);
  const [noNeedle, setNoNeedle] = useState(false);
  const [concernsDone, setConcernsDone] = useState(false);
  const [showYen, setShowYen] = useState(false);
  const [draft, setDraft] = useState('');
  const [exchange, setExchange] = useState<{ me: string; bot: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [pendingBudget, setPendingBudget] = useState<ParsedBudget | null>(null);
  const [safetyStop, setSafetyStop] = useState<SafetyFlag | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const exchangeRef = useRef<HTMLDivElement>(null);

  const step: Step = !visitor
    ? 'visitor'
    : budget === undefined
      ? 'budget'
      : !timing
        ? 'timing'
        : visitor === 'resident' && !areaId
          ? 'area'
          : !concernsDone
            ? 'concerns'
            : 'result';
  const totalSteps = visitor === 'resident' ? 5 : 4;
  const stepIndex = Math.min(
    totalSteps,
    { visitor: 1, budget: 2, timing: 3, area: 4, concerns: totalSteps, result: totalSteps }[step]
  );

  const cheapestByMenu = useMemo(() => {
    const out: Array<{ id: string; minJpy: number; minKrw: number }> = [];
    for (const menu of dataset.menus) {
      let minJpy = Number.POSITIVE_INFINITY;
      let minKrw = Number.POSITIVE_INFINITY;
      for (const place of dataset.places) {
        const offer = place.prices[menu.id];
        if (!offer) continue;
        const applyVat = includeVat && place.vatExcluded && menu.vatAppliesInKorea;
        const totalKrw = offer.krw + (applyVat ? Math.round(offer.krw * dataset.meta.vatRate) : 0);
        const totalJpy = krwToJpy(totalKrw, krwPer100Jpy);
        if (totalJpy < minJpy) minJpy = totalJpy;
        if (totalKrw < minKrw) minKrw = totalKrw;
      }
      if (Number.isFinite(minJpy)) out.push({ id: menu.id, minJpy, minKrw });
    }
    return out;
  }, [dataset, krwPer100Jpy, includeVat]);

  const sliderValue = visitor === 'resident' ? sliderKrw : sliderJpy;
  const affordableMenuCount = useMemo(() => {
    return cheapestByMenu.filter((m) =>
      visitor === 'resident' ? m.minKrw <= sliderKrw : m.minJpy <= sliderJpy
    ).length;
  }, [cheapestByMenu, visitor, sliderKrw, sliderJpy]);

  const result = useMemo(() => {
    if (step !== 'result' || !visitor || budget === undefined || !timing) return null;
    const answers: ConciergeAnswers = { visitor, budget, timing, areaId, concerns, noNeedle };
    return planConcierge(answers, dataset, { krwPer100Jpy, includeVat });
  }, [step, visitor, budget, timing, areaId, concerns, noNeedle, dataset, krwPer100Jpy, includeVat]);

  const resultKey = result ? `${visitor}|${budget}|${timing}|${areaId}|${concerns.join(',')}|${noNeedle}` : '';
  useEffect(() => {
    if (!resultKey || !result || !visitor) return;
    track('concierge_result', { visitor, has_best: Boolean(result.best), has_combo: Boolean(result.combo) });
    const t = window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    return () => window.clearTimeout(t);
    // Only when the answers change, not on language / currency switches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultKey]);

  useEffect(() => {
    if (step === 'visitor' || step === 'result') return;
    const t = window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 70);
    return () => window.clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (!exchange) return;
    const t = window.setTimeout(
      () => exchangeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
      80
    );
    return () => window.clearTimeout(t);
  }, [exchange, thinking]);

  const resetFrom = (from: Step) => {
    onHaptic();
    const i = STEP_ORDER.indexOf(from);
    if (i <= 0) {
      setVisitor(null);
      setExchange(null);
      setPendingBudget(null);
      setSafetyStop(null);
      setConcerns([]);
      setNoNeedle(false);
      setShowYen(false);
    }
    if (i <= 1) setBudget(undefined);
    if (i <= 2) setTiming(null);
    if (i <= 3) setAreaId(null);
    if (i <= 4) setConcernsDone(false);
  };

  const pick = (fn: () => void) => () => {
    onHaptic();
    fn();
  };

  // ── money & copy helpers (visitor-aware) ─────────────────────────────────
  const residentYen = visitor === 'resident' && showYen;
  const yenFirst = visitor === 'traveler' || residentYen;
  const mainPrice = (krw: number, jpy: number) => (yenFirst ? formatJpy(jpy) : formatKrw(krw));
  const subPrice = (krw: number, jpy: number) => (yenFirst ? formatKrw(krw) : `${isJa ? '約' : '약 '}${formatJpy(jpy)}`);
  const taxNote = includeVat ? (isJa ? '税込' : '세금 포함') : isJa ? '税別' : '세금 별도';
  const paren = (text: string) => (isJa ? `（${text}）` : ` (${text})`);
  const menuName = (o: { menu: ConciergeOffer['menu'] }) => (isJa ? o.menu.shortJa : o.menu.shortKo);
  const downtimeBadge = (menuId: string) => {
    const d = TREATMENT_DOWNTIME[menuId];
    return d ? (isJa ? d.badgeJa : d.badgeKo) : '';
  };
  const originName = areaId ? areaLabel(dataset, areaId, isJa) : '';

  const okBadge = (menuId: string) => {
    const text = downtimeBadge(menuId);
    if (visitor === 'traveler') return isJa ? `✓ 帰国前に回復（${text}）` : `✓ 귀국 전 회복 (${text})`;
    if (timing === 'soon') return isJa ? `✓ 明日の予定OK（${text}）` : `✓ 내일 일정 OK (${text})`;
    return isJa ? `✓ 予定に間に合う（${text}）` : `✓ 일정 전 회복 (${text})`;
  };

  const overBy = (o: ConciergeOffer) => {
    if (budget === null || budget === undefined) return '';
    const over = (visitor === 'traveler' ? o.row.krTotalJpy : o.row.totalKrw) - budget;
    return visitor === 'traveler' ? formatJpy(over) : formatKrw(over);
  };

  const excludedReason = (e: ConciergeExcluded) => {
    if (e.reason === 'needle') return isJa ? '針を使う施術' : '바늘을 쓰는 시술';
    if (e.reason === 'nodata') return isJa ? '近くに価格データがない' : '근처에 가격 데이터가 없어요';
    if (e.reason === 'downtime') {
      const text = downtimeBadge(e.menu.id);
      if (visitor === 'traveler') return isJa ? `${text} → 帰国に間に合わない` : `${text} → 귀국 전에 안 가라앉아요`;
      return isJa ? `${text} → 予定に間に合わない` : `${text} → 일정 전에 안 가라앉아요`;
    }
    const price = e.cheapest ? mainPrice(e.cheapest.row.totalKrw, e.cheapest.row.krTotalJpy) : '';
    return isJa ? `いちばん安くても${price} → 予算オーバー` : `제일 싸도 ${price} → 예산 초과`;
  };

  const placeLine = (o: ConciergeOffer, withStation = true) => {
    const name = isJa ? o.row.place.nameJa : o.row.place.nameKo;
    const station = isJa ? o.row.place.stationJa : o.row.place.stationKo;
    if (visitor === 'resident' && originName) {
      const dist = distanceLabel(o.row.distanceMeters);
      const near = isJa ? `${originName}から${dist}` : `${originName}에서 ${dist}`;
      return withStation ? `${name} ・ ${near}${paren(station)}` : `${name} ・ ${near}`;
    }
    return withStation ? `${name} ・ ${station}` : name;
  };

  const minutesOf = (o: { menu: ConciergeOffer['menu'] }) => treatmentMinutes(o.menu);
  const timeBadge = (o: { menu: ConciergeOffer['menu'] }) => {
    const min = minutesOf(o);
    if (min === null) return null;
    return (
      <span className="cg-badge is-time">
        <ConciergeEmoji name="stopwatch" size={14} />
        {isJa ? `施術 ${formatMinutes(min, true)}` : `시술 ${formatMinutes(min, false)}`}
      </span>
    );
  };

  const reasonText = (menuId: string) => {
    const eff = TREATMENT_EFFECTS[menuId];
    return eff ? (isJa ? eff.headlineJa : eff.headlineKo) : '';
  };

  const counselorTipFor = (o: ConciergeOffer) => {
    if (o.row.place.sourceType === 'official_event') {
      return isJa
        ? '室長メモ：イベント価格は初回条件や麻酔代別のことが多いので、受付で総額を先に確認すると安心です。'
        : '실장님 메모: 이벤트가는 첫 방문 조건이나 마취비가 별도일 수 있어, 접수 때 총액을 먼저 확인하면 안심이에요.';
    }
    return isJa
      ? '室長メモ：公式定価ベースなので2回目以降も価格変動が少なく、無理な追加勧誘を避けやすい選択です。'
      : '실장님 메모: 공식 정가 기준이라 추가 옵션 부담이 적고, 처음 방문하셔도 가격 그대로 받기 편한 선택이에요.';
  };

  const copyOrderMemoFor = (placeId: string, menuIds: string[], key: string) => {
    onHaptic();
    const place = dataset.places.find((p) => p.id === placeId);
    if (!place) return;
    const bundle = computeClinicBundle(
      place,
      dataset.menus,
      menuIds,
      1,
      includeVat,
      krwPer100Jpy,
      dataset.meta.vatRate,
      dataset.places
    );
    const memo = buildOrderSheetMessages(place, bundle, ['no-upsell', 'total-first'], includeVat);
    const done = () => {
      setCopiedId(key);
      onShowToast(
        isJa
          ? '受付で見せる韓国語メモをコピーしました'
          : '병원 접수용 한국어 요청 메모를 복사했어요',
        true
      );
      window.setTimeout(() => setCopiedId((prev) => (prev === key ? null : prev)), 1800);
    };
    navigator.clipboard?.writeText(memo.ko).then(done).catch(done);
  };

  const openClinic = (placeId: string, menus: string[], card: string) => {
    onHaptic();
    track('concierge_card_click', { visitor: visitor ?? '', card });
    onOpenClinic(placeId, menus);
  };

  const priceBlock = (o: ConciergeOffer) => (
    <div className="cg-price-row">
      <div className="cg-price-main">
        <span className="cg-price-ref">
          {visitor === 'traveler'
            ? `${isJa ? '日本平均' : '일본 평균'} ${formatJpy(o.row.jpBenchmarkJpy)}`
            : `${isJa ? 'ソウル平均' : '서울 평균'} ${mainPrice(o.row.seoulAvgKrw, o.row.seoulAvgJpy)}`}
        </span>
        <strong className="cg-price num">{mainPrice(o.row.totalKrw, o.row.krTotalJpy)}</strong>
        <span className="cg-price-sub">
          {subPrice(o.row.totalKrw, o.row.krTotalJpy)}
          {paren(taxNote)}
        </span>
      </div>
      {visitor === 'traveler' && o.row.savingsJpy > 0 && (
        <div className="cg-save">
          <span>{isJa ? '日本より' : '일본보다'}</span>
          <strong className="num">
            {formatJpy(o.row.savingsJpy)} {isJa ? 'おトク' : '절약'}
          </strong>
        </div>
      )}
      {visitor === 'resident' && o.row.seoulDiffKrw > 0 && (
        <div className="cg-save">
          <span>{isJa ? 'ソウル平均より' : '서울 평균보다'}</span>
          <strong className="num">
            {mainPrice(o.row.seoulDiffKrw, o.row.seoulDiffJpy)} {isJa ? '安い' : '저렴'}
          </strong>
        </div>
      )}
    </div>
  );

  const eventBadge = (o: ConciergeOffer) =>
    o.row.place.sourceType === 'official_event' ? (
      <span className="cg-badge is-warn">
        {visitor === 'resident'
          ? isJa
            ? '! 初回・イベント価格 → 2回目以降は変わる場合あり'
            : '! 첫 방문·이벤트가 → 두 번째부터 달라질 수 있어요'
          : isJa
            ? '! イベント価格・条件は要確認'
            : '! 이벤트가 · 조건 확인 필요'}
      </span>
    ) : null;

  const concernSummary = [
    ...(concerns.length
      ? CONCERNS.filter((c) => concerns.includes(c.id)).map((c) => (isJa ? c.ja : c.ko))
      : [isJa ? 'おまかせ' : '실장님 추천대로']),
    ...(noNeedle ? [isJa ? '針NG' : '바늘 X'] : [])
  ].join(isJa ? '・' : ' · ');

  // ── free-text box (rules first, Worker AI only for what rules can't read) ──
  const applyPendingBudget = (v: VisitorType) => {
    if (pendingBudget && budget === undefined) setBudget(budgetForVisitor(v, pendingBudget, krwPer100Jpy));
    setPendingBudget(null);
  };

  const summarize = (p: ConciergeParse, v: VisitorType | null): string[] => {
    const parts: string[] = [];
    if (p.visitor) parts.push(p.visitor === 'traveler' ? (isJa ? '旅行中' : '여행 중') : isJa ? 'ソウル在住' : '서울 거주');
    if (p.budget) {
      if (p.budget.amount === null) parts.push(isJa ? '予算は上限なし' : '예산 상관없음');
      else if (v) parts.push(budgetLabel(v, budgetForVisitor(v, p.budget, krwPer100Jpy), isJa));
      else parts.push(isJa ? `予算 ${p.budget.amount.toLocaleString('ja-JP')}` : `예산 ${p.budget.amount.toLocaleString('ko-KR')}`);
    }
    if (p.timing && v) parts.push(timingOptions(v, isJa).find((t) => t.id === p.timing)?.label ?? '');
    else if (p.timing) parts.push(timingOptions('traveler', isJa).find((t) => t.id === p.timing)?.label ?? '');
    if (p.areaId) parts.push(areaLabel(dataset, p.areaId, isJa));
    if (p.concerns) {
      parts.push(
        p.concerns.length
          ? CONCERNS.filter((c) => p.concerns!.includes(c.id))
              .map((c) => (isJa ? c.ja : c.ko))
              .join(isJa ? '・' : '·')
          : isJa
            ? 'おまかせ'
            : '실장님 추천대로'
      );
    }
    if (p.noNeedle) parts.push(isJa ? '針NG' : '바늘 X');
    return parts.filter(Boolean);
  };

  const applyParse = (p: ConciergeParse, me: string) => {
    if (p.safety) {
      setSafetyStop(p.safety);
      setExchange({
        me,
        bot: isJa
          ? '教えてくださりありがとうございます。安全のため今回は施術のご提案を控えますね。まずはクリニックの医師に直接ご相談ください。'
          : '미리 알려주셔서 정말 감사해요. 안전이 최우선이라 이런 경우엔 제가 시술을 추천하지 않을게요. 꼭 병원 전문의와 직접 상담해 주세요.'
      });
      return;
    }
    if (p.fieldCount === 0) {
      setExchange({
        me,
        bot: isJa
          ? 'すみません、条件をうまく読み取れませんでした…下のボタンから選んでいただくと正確にご案内できます！'
          : '죄송해요, 조건을 정확히 못 알아들었어요… 아래 버튼으로 골라주시면 딱 맞게 추천해 드릴게요!'
      });
      return;
    }
    const v = p.visitor ?? visitor;
    if (p.visitor) setVisitor(p.visitor);
    if (p.budget) {
      if (v) {
        const resolvedBudget = budgetForVisitor(v, p.budget, krwPer100Jpy);
        setBudget(resolvedBudget);
        if (typeof resolvedBudget === 'number') {
          if (v === 'traveler') setSliderJpy(Math.max(3000, Math.min(50000, resolvedBudget)));
          else setSliderKrw(Math.max(20000, Math.min(300000, resolvedBudget)));
        }
        setPendingBudget(null);
      } else {
        setPendingBudget(p.budget);
      }
    }
    if (p.timing) setTiming(p.timing);
    if (p.areaId) setAreaId(p.areaId);
    if (p.noNeedle) setNoNeedle(true);
    if (p.concerns) {
      setConcerns(p.concerns);
      setConcernsDone(true);
    }
    const parts = summarize(p, v);
    setExchange({
      me,
      bot: isJa
        ? `承知しました！チェックした条件：${parts.join(' ・ ')}`
        : `확인했어요! 정리한 조건: ${parts.join(' · ')}`
    });
  };

  const processSentence = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || thinking) return;
    onHaptic();
    setDraft('');
    setSafetyStop(null);
    const rules = parseConciergeText(text);
    let parsed = rules;
    let usedAi = false;
    if (!rules.safety && rules.fieldCount < 2 && conciergeAiEnabled && text.length >= 4) {
      setExchange({ me: text, bot: '' });
      setThinking(true);
      const ai = await askConciergeAi(text);
      setThinking(false);
      if (ai) {
        parsed = mergeParses(rules, ai);
        usedAi = true;
      }
    }
    track('concierge_text', { fields: parsed.fieldCount, ai: usedAi, safety: Boolean(parsed.safety) });
    applyParse(parsed, text);
  };

  const submitText = async (e: FormEvent) => {
    e.preventDefault();
    await processSentence(draft);
  };

  const handleBumpBudget = () => {
    if (!visitor || budget === null || budget === undefined) return;
    onHaptic();
    if (visitor === 'traveler') {
      const next = budget + 10000;
      setBudget(next);
      setSliderJpy(Math.min(50000, next));
      setExchange({
        me: isJa ? '予算を+1万円増やしたら？' : '예산 1만 엔 더 늘리면?',
        bot: isJa
          ? `予算を${budgetLabel('traveler', next, true)}に広げて、137院から選び直しました！`
          : `예산을 ${budgetLabel('traveler', next, false)}까지 늘려서 137곳에서 다시 골라봤어요!`
      });
    } else {
      const next = budget + 50000;
      setBudget(next);
      setSliderKrw(Math.min(300000, next));
      setExchange({
        me: isJa ? '予算を+5万ウォン増やしたら？' : '예산 5만 원 더 늘리면?',
        bot: isJa
          ? `予算を${budgetLabel('resident', next, true)}に広げて、近くのお得な院を探し直しました！`
          : `예산을 ${budgetLabel('resident', next, false)}로 늘려서 가까운 병원부터 다시 추려봤어요!`
      });
    }
  };

  const handleAllowNeedle = () => {
    onHaptic();
    setNoNeedle(false);
    setExchange({
      me: isJa ? '針OKにしたらどう変わる？' : '바늘 괜찮으면 뭐가 더 좋아?',
      bot: isJa
        ? '注射系の施術も含めて、今の予算と予定に合う一番お得な候補を出し直しました！'
        : '주사 시술도 포함해서 지금 예산과 일정에 가장 잘 맞는 조합으로 다시 골라봤어요!'
    });
  };

  const shownExcluded = result ? result.excluded.filter((e) => e.menu.id !== result.nextPlan?.menu.id) : [];

  const counselorVerdict = useMemo(() => {
    if (!result || !visitor) return '';
    if (result.best) {
      const bestName = isJa ? result.best.menu.shortJa : result.best.menu.shortKo;
      const exclCount = shownExcluded.length;
      if (isJa) {
        return exclCount > 0
          ? `ソウル137院の公式料金をすべて照合しました！今の条件なら「${bestName}」がいちばん無理なくお得です。赤みや腫れの回復期間や条件に合わない${exclCount}施術はあらかじめ外してあります。`
          : `ソウル137院の公式料金をすべて照合しました！今の条件にぴったり合う一番コスパの良い選択は「${bestName}」です。`;
      }
      return exclCount > 0
        ? `서울 137곳 공식가를 싹 비교해 봤어요! 지금 조건에선 '${bestName}'이 가장 합리적이에요. 회복 기간이나 조건에 안 맞는 ${exclCount}개 시술은 안전하게 빼두었어요.`
        : `서울 137곳 공식가를 싹 비교해 봤어요! 지금 조건에 가장 합리적이고 부담 없는 선택은 '${bestName}'이에요.`;
    }
    return isJa
      ? '条件に合う院を137院すべて探しましたが、今の予算だと少し届きませんでした。下の一番近い候補もチェックしてみてくださいね。'
      : '서울 137곳을 다 찾아봤는데, 지금 예산에서는 살짝 모자라요. 아래 가장 가까운 후보를 확인해 보실래요?';
  }, [result, visitor, shownExcluded.length, isJa]);

  const exchangeBlock = exchange ? (
    <div className="cg-exchange" ref={exchangeRef} aria-live="polite">
      <div className="cg-me is-static">{exchange.me}</div>
      <CounselorMsg isJa={isJa}>
        {thinking ? (
          <span className="cg-typing" aria-label={isJa ? '入力中' : '답변 작성 중'}>
            <span />
            <span />
            <span />
          </span>
        ) : (
          exchange.bot
        )}
      </CounselorMsg>
    </div>
  ) : null;

  return (
    <div className="cg-view cg-counselor-view" id="concierge-view">
      {/* AI Counselor Profile Header */}
      <header className="cg-head cg-counselor-head">
        <div className="cg-avatar-wrap">
          <img
            src={dopagakiMarkUrl}
            alt={isJa ? 'AIカウンセラー ドパ' : 'AI 상담실장 도파'}
            className="cg-head-avatar"
            width={44}
            height={44}
          />
          <span className="cg-online-dot" aria-hidden="true" />
        </div>
        <div className="cg-head-text">
          <div className="cg-head-title-row">
            <h1 className="cg-title">{isJa ? 'AIカウンセラー ドパ' : 'AI 상담실장 도파'}</h1>
            <span className="cg-live-pill">{isJa ? '相談OK' : '상담 가능'}</span>
          </div>
          <p className="cg-sub">
            <ShieldCheck size={12} strokeWidth={2.4} />
            <span>
              {isJa
                ? '押し売り0% · ソウル137院の公式価格だけでご提案'
                : '강매 0% · 서울 137곳 검증 공식가만 보고 추천'}
            </span>
          </p>
        </div>
        <div className="cg-head-right">
          <span className="cg-progress num">
            {step === 'result' ? (isJa ? '完了 ✓' : '처방 ✓') : `${stepIndex}/${totalSteps}`}
          </span>
          {(visitor || exchange) && (
            <button
              type="button"
              className="cg-reset-icon"
              aria-label={isJa ? '最初から相談する' : '새 상담 시작'}
              title={isJa ? '最初から相談する' : '새 상담 시작'}
              onClick={() => resetFrom('visitor')}
            >
              <RotateCcw size={14} strokeWidth={2.3} />
            </button>
          )}
        </div>
      </header>

      {safetyStop ? (
        <div className="cg-chat">
          {exchangeBlock}
          <article className="cg-card is-quiet">
          <div className="cg-kicker">
            <ConciergeEmoji name="warning" size={24} />
            <span>{isJa ? '安全のためご提案を控えます' : '안전을 위해 추천을 멈출게요'}</span>
          </div>
          <p className="cg-reason">
            {safetyStop === 'pregnancy'
              ? isJa
                ? '妊娠中・授乳中は受けられない施術があります。必ずクリニックの医師に相談してください。'
                : '임신·수유 중에는 받으면 안 되는 시술이 있어요. 꼭 병원 전문의와 상담하세요.'
              : isJa
                ? '肌の病気やお薬によっては受けられない施術があります。必ずクリニックの医師に相談してください。'
                : '피부 질환이나 복용 중인 약에 따라 받으면 안 되는 시술이 있어요. 꼭 병원 전문의와 상담하세요.'}
          </p>
          <div className="cg-actions">
            <button type="button" className="cg-btn" onClick={() => resetFrom('visitor')}>
              {isJa ? '最初から相談し直す' : '처음부터 다시 상담하기'}
            </button>
          </div>
        </article>
        </div>
      ) : (
        <>
          <div className="cg-chat">
            <CounselorMsg isJa={isJa}>
              {isJa
                ? 'いらっしゃいませ！押し売りなしで公式価格からぴったりの施術を探すAIカウンセラーのドパです。まずは今、ソウルご旅行中ですか？在住ですか？'
                : '어서 오세요! 강매 없이 서울 137곳 공식가만 보고 딱 맞는 시술을 골라드리는 AI 상담실장 도파예요. 먼저 지금 서울 여행 중이신가요, 거주 중이신가요?'}
            </CounselorMsg>
            {step === 'visitor' && exchangeBlock}

            {step === 'visitor' ? (
              <>
                <div className="cg-grid-2">
                  <Chip
                    big
                    emoji="traveler"
                    label={isJa ? '旅行中' : '여행 중'}
                    onClick={pick(() => {
                      setVisitor('traveler');
                      applyPendingBudget('traveler');
                      track('concierge_start', { visitor: 'traveler' });
                    })}
                  />
                  <Chip
                    big
                    emoji="resident"
                    label={isJa ? 'ソウル在住' : '서울 거주'}
                    onClick={pick(() => {
                      setVisitor('resident');
                      applyPendingBudget('resident');
                      track('concierge_start', { visitor: 'resident' });
                    })}
                  />
                </div>

                {/* 1-Tap Realistic Counselor Quick Prompts */}
                {!exchange && (
                  <div className="cg-quick-prompts">
                    <span className="cg-quick-label">
                      <Sparkles size={12} strokeWidth={2.3} />
                      <span>
                        {isJa ? 'ひとことで相談してみる（タップで入力）' : '이렇게 한 번에 물어보셔도 돼요'}
                      </span>
                    </span>
                    <div className="cg-quick-list">
                      {QUICK_PROMPTS.map((q) => {
                        const txt = isJa ? q.ja : q.ko;
                        return (
                          <button
                            key={txt}
                            type="button"
                            className="cg-quick-btn"
                            onClick={() => void processSentence(txt)}
                          >
                            “{txt}”
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Answer
                isJa={isJa}
                onEdit={() => resetFrom('visitor')}
                label={visitor === 'traveler' ? (isJa ? '旅行中' : '여행 중') : isJa ? 'ソウル在住' : '서울 거주'}
              />
            )}

            {visitor && (
              <>
                {step === 'budget' && exchangeBlock}
                <CounselorMsg isJa={isJa}>
                  {visitor === 'traveler'
                    ? isJa
                      ? 'いいですね！今回の美容ご予算はどのくらいをお考えですか？スライダーでもボタンでもOKです。'
                      : '좋아요! 이번에 생각하신 예산은 어느 정도예요? 슬라이더로 맞추거나 아래 버튼으로 편하게 골라주세요.'
                    : isJa
                      ? 'いいですね！今月の肌管理ご予算はどのくらいですか？無理のない範囲で探しますね。'
                      : '좋아요! 이번 달 피부 관리 예산은 어느 정도예요? 부담 없는 선에서 딱 맞춰드릴게요.'}
                </CounselorMsg>
                {step === 'budget' ? (
                  <div className="cg-budget-wrap">
                    <div className="cg-slider-card">
                      <div className="cg-slider-head">
                        <div className="cg-slider-val-col">
                          <span className="cg-slider-label">
                            {isJa ? 'スライダーで微調整' : '슬라이더로 예산 맞추기'}
                          </span>
                          <div className="cg-slider-amount num">
                            {visitor === 'traveler' ? (
                              <YenFlow value={sliderJpy} durationMs={160} />
                            ) : (
                              <NumFlow value={sliderKrw} prefix="₩" durationMs={160} />
                            )}
                          </div>
                          <span className="cg-slider-sub num">
                            {visitor === 'traveler'
                              ? `${isJa ? '約 ' : '약 '}${formatKrw(jpyToKrw(sliderJpy, krwPer100Jpy))}`
                              : `${isJa ? '約 ' : '약 '}${formatJpy(krwToJpy(sliderKrw, krwPer100Jpy))}`}
                          </span>
                        </div>
                        <span className="cg-slider-count num">
                          {isJa
                            ? `対象 ${affordableMenuCount}/${dataset.menus.length}種`
                            : `가능 시술 ${affordableMenuCount}/${dataset.menus.length}종`}
                        </span>
                      </div>

                      <Slider.Root
                        className="cg-slider-root"
                        value={[sliderValue]}
                        min={visitor === 'traveler' ? 3000 : 20000}
                        max={visitor === 'traveler' ? 50000 : 300000}
                        step={visitor === 'traveler' ? 1000 : 10000}
                        onValueChange={([next]) => {
                          if (visitor === 'traveler') setSliderJpy(next);
                          else setSliderKrw(next);
                        }}
                        onValueCommit={() => onHaptic()}
                      >
                        <Slider.Track className="cg-slider-track">
                          <Slider.Range className="cg-slider-range" />
                        </Slider.Track>
                        <Slider.Thumb
                          className="cg-slider-thumb"
                          aria-label={isJa ? '予算スライダー' : '예산 슬라이더'}
                        />
                      </Slider.Root>

                      <div className="cg-slider-scale num" aria-hidden="true">
                        <span>{visitor === 'traveler' ? '¥3,000' : '₩2만'}</span>
                        <span>{visitor === 'traveler' ? '¥25,000' : '₩15만'}</span>
                        <span>{visitor === 'traveler' ? '¥50,000' : '₩30만'}</span>
                      </div>

                      <button
                        type="button"
                        className="cg-slider-apply"
                        onClick={pick(() => setBudget(sliderValue))}
                      >
                        {visitor === 'traveler'
                          ? isJa
                            ? `${formatJpy(sliderJpy)}までで次へ`
                            : `${formatJpy(sliderJpy)}까지로 다음`
                          : isJa
                            ? `${formatKrw(sliderKrw)}までで次へ`
                            : `${formatKrw(sliderKrw)}까지로 다음`}
                      </button>
                    </div>

                    <div className="cg-chips">
                      {(visitor === 'traveler' ? TRAVELER_BUDGETS_JPY : RESIDENT_BUDGETS_KRW).map((v) => (
                        <Chip
                          key={String(v)}
                          label={budgetLabel(visitor, v, isJa)}
                          onClick={pick(() => {
                            if (typeof v === 'number') {
                              if (visitor === 'traveler') setSliderJpy(v);
                              else setSliderKrw(v);
                            }
                            setBudget(v);
                          })}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <Answer isJa={isJa} onEdit={() => resetFrom('budget')} label={budgetLabel(visitor, budget ?? null, isJa)} />
                )}
              </>
            )}

            {visitor && budget !== undefined && (
              <>
                {step === 'timing' && exchangeBlock}
                <CounselorMsg isJa={isJa}>
                  {visitor === 'traveler'
                    ? isJa
                      ? '赤みや腫れが残らないかチェックしますね！帰国まであと何日ありますか？'
                      : '시술 후 붓기나 붉은기가 남아도 괜찮은지 체크할게요! 귀국까지 며칠 남으셨나요?'
                    : isJa
                      ? '予定に響かないかチェックしますね！顔を見せる予定はいつですか？'
                      : '일정에 지장 없도록 체크할게요! 얼굴 보여야 하는 약속·출근 일정은 언제예요?'}
                  <span className="cg-bot-note">
                    {isJa ? '赤み・腫れが間に合わない施術は自動で外します' : '붉은기·붓기가 남는 시술은 안전하게 빼드릴게요'}
                  </span>
                </CounselorMsg>
                {step === 'timing' ? (
                  <div className="cg-chips">
                    {timingOptions(visitor, isJa).map((t) => (
                      <Chip key={t.id} label={t.label} onClick={pick(() => setTiming(t.id))} />
                    ))}
                  </div>
                ) : (
                  <Answer
                    isJa={isJa}
                    onEdit={() => resetFrom('timing')}
                    label={timingOptions(visitor, isJa).find((t) => t.id === timing)?.label ?? ''}
                  />
                )}
              </>
            )}

            {visitor === 'resident' && timing && (
              <>
                {step === 'area' && exchangeBlock}
                <CounselorMsg isJa={isJa}>
                  {isJa
                    ? '普段よく行くエリアはどこですか？通いやすい近い院から優先してお探ししますね！'
                    : '자주 가시는 동네를 알려주시면, 이동 편하고 가까운 병원 위주로 먼저 추려드릴게요!'}
                </CounselorMsg>
                {step === 'area' ? (
                  <div className="cg-chips">
                    {RESIDENT_AREAS.map((id) => (
                      <Chip key={id} emoji="pin" label={areaLabel(dataset, id, isJa)} onClick={pick(() => setAreaId(id))} />
                    ))}
                  </div>
                ) : (
                  <Answer isJa={isJa} onEdit={() => resetFrom('area')} label={originName} />
                )}
              </>
            )}

            {(step === 'concerns' || step === 'result') && (
              <>
                {step === 'concerns' && exchangeBlock}
                <CounselorMsg isJa={isJa}>
                  {isJa
                    ? '最後です！今いちばん気になるお肌のお悩みを教えてください（複数OK）。注射が苦手ならチェックしてくださいね。'
                    : '거의 다 왔어요! 오늘 제일 신경 쓰이는 피부 고민을 골라주세요 (여러 개 OK). 주사가 무서우시면 꼭 체크해 주세요!'}
                </CounselorMsg>
                {step === 'concerns' ? (
                  <div className="cg-concerns">
                    <div className="cg-chips">
                      {CONCERNS.map((c) => (
                        <Chip
                          key={c.id}
                          menuEmoji={c.emojiMenu}
                          label={isJa ? c.ja : c.ko}
                          on={concerns.includes(c.id)}
                          onClick={pick(() =>
                            setConcerns((prev) => (prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]))
                          )}
                        />
                      ))}
                      <Chip
                        emoji="syringe"
                        label={isJa ? '針はNG' : '바늘은 싫어요'}
                        on={noNeedle}
                        onClick={pick(() => setNoNeedle((v) => !v))}
                      />
                    </div>
                    <button type="button" className="cg-go" onClick={pick(() => setConcernsDone(true))}>
                      <Stethoscope size={18} strokeWidth={2.3} />
                      <span>
                        {concerns.length === 0
                          ? isJa
                            ? '室長におまかせで処方を見る'
                            : '실장님 추천대로 처방 보기'
                          : isJa
                            ? 'この条件でカウンセリング結果を見る'
                            : '이 조건으로 상담 결과 보기'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <Answer isJa={isJa} onEdit={() => resetFrom('concerns')} label={concernSummary} />
                )}
              </>
            )}
            <div ref={bottomRef} className="cg-scroll-anchor" />
          </div>
        </>
      )}

      {/* Counselor Prescription Result Section */}
      {result && visitor && !safetyStop && (
        <section className="cg-result" ref={resultRef} aria-label={isJa ? 'カウンセリング提案' : '상담실장 추천 처방'}>
          {exchangeBlock}
          <CounselorMsg isJa={isJa}>{counselorVerdict}</CounselorMsg>

          <div className="cg-result-head">
            <h2 className="cg-result-title">
              {visitor === 'traveler'
                ? isJa
                  ? 'ドパ室長の提案シート'
                  : '도파 실장님 맞춤 처방'
                : isJa
                  ? '今月の肌管理プラン'
                  : '이번 달 맞춤 관리 플랜'}
            </h2>
            {visitor === 'resident' && (
              <div className="cg-cur" role="group" aria-label={isJa ? '通貨' : '통화'}>
                <button type="button" aria-pressed={!showYen} onClick={pick(() => setShowYen(false))}>
                  ₩
                </button>
                <button type="button" aria-pressed={showYen} onClick={pick(() => setShowYen(true))}>
                  ¥
                </button>
              </div>
            )}
          </div>

          {result.best ? (
            <article className="cg-card is-best">
              <div className="cg-kicker">
                <ConciergeEmoji name={visitor === 'traveler' ? 'medal' : 'pin'} size={24} />
                <span>
                  {visitor === 'traveler'
                    ? isJa
                      ? '室長イチオシ'
                      : '실장님 1순위 추천'
                    : isJa
                      ? '近くて最安イチオシ'
                      : '가깝고 제일 합리적인 1순위'}
                </span>
              </div>
              <div className="cg-card-title">
                <MenuEmoji menuId={result.best.menu.id} size={30} />
                <div>
                  <h3>{menuName(result.best)}</h3>
                  <p className="cg-place">{placeLine(result.best)}</p>
                </div>
              </div>
              {priceBlock(result.best)}
              <div className="cg-badges">
                {timeBadge(result.best)}
                <span className="cg-badge is-ok">{okBadge(result.best.menu.id)}</span>
                {result.best.row.place.japaneseSupport && (
                  <span className="cg-badge is-jp">JP {isJa ? '日本語OK' : '일본어 가능'}</span>
                )}
                {eventBadge(result.best)}
              </div>
              {reasonText(result.best.menu.id) && <p className="cg-reason">{reasonText(result.best.menu.id)}</p>}
              <p className="cg-counselor-tip">{counselorTipFor(result.best)}</p>
              <div className="cg-actions">
                <button
                  type="button"
                  className="cg-btn is-primary"
                  onClick={() => openClinic(result.best!.row.place.id, [result.best!.menu.id], 'best')}
                >
                  {isJa ? 'クリニックを見る' : '병원 상세 보기'}
                </button>
                <button
                  type="button"
                  className="cg-btn"
                  onClick={() =>
                    copyOrderMemoFor(result.best!.row.place.id, [result.best!.menu.id], 'best-memo')
                  }
                >
                  <span className="cg-btn-inline">
                    {copiedId === 'best-memo' ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <Copy size={14} strokeWidth={2.2} />
                    )}
                    <span>
                      {copiedId === 'best-memo'
                        ? isJa
                          ? 'コピー済'
                          : '복사 완료'
                        : isJa
                          ? '韓国語メモコピー'
                          : '접수 멘트 복사'}
                    </span>
                  </span>
                </button>
              </div>
              <div className="cg-sub-actions">
                <button
                  type="button"
                  className="cg-link-btn"
                  onClick={() => {
                    onHaptic();
                    track('concierge_card_click', { visitor, card: 'ranking' });
                    onApplyMenu(result.best!.menu.id);
                  }}
                >
                  {isJa ? 'この施術のランキングで他の院も比べる →' : '이 시술 순위표에서 다른 병원도 비교하기 →'}
                </button>
              </div>
              <ShareStoryButton
                variant="pastel"
                lang={lang}
                shareUrl={buildClinicUrl(window.location.origin, appBasePath, result.best.row.place.id, {
                  lang,
                  menuId: result.best.menu.id,
                  menus: [result.best.menu.id],
                  visits: 1,
                  includeVat
                })}
                fxNote={fxNote}
                row={result.best.row}
                onSuccess={(method) =>
                  onShowToast(
                    isJa
                      ? method === 'share'
                        ? 'ストーリー画像をシェアしました'
                        : '9:16ストーリー画像を保存しました'
                      : method === 'share'
                        ? '스토리 이미지를 공유했어요'
                        : '9:16 스토리 이미지를 저장했어요',
                    true
                  )
                }
                onError={(msg) => onShowToast(msg, false)}
              />
            </article>
          ) : (
            <article className="cg-card">
              <div className="cg-kicker">
                <ConciergeEmoji name="warning" size={24} />
                <span>{isJa ? '予算内の施術が見つかりませんでした' : '예산 안에 맞는 시술이 없어요'}</span>
              </div>
              {result.cheapestOverBudget ? (
                <>
                  <p className="cg-reason">
                    {isJa
                      ? `いちばん近いのは「${menuName(result.cheapestOverBudget)}」です。予算をあと${overBy(result.cheapestOverBudget)}増やすと受けられますよ。`
                      : `가장 가까운 건 '${menuName(result.cheapestOverBudget)}'예요. 예산을 ${overBy(result.cheapestOverBudget)}만 늘리면 바로 받을 수 있어요.`}
                  </p>
                  <p className="cg-place">{placeLine(result.cheapestOverBudget)}</p>
                  {priceBlock(result.cheapestOverBudget)}
                </>
              ) : (
                <p className="cg-reason">
                  {isJa ? '条件を少しゆるめてもう一度ご相談ください。' : '조건을 조금 바꿔서 다시 물어봐 주세요.'}
                </p>
              )}
            </article>
          )}

          {result.combo && (
            <article className="cg-card">
              <div className="cg-kicker">
                <ConciergeEmoji name="basket" size={24} />
                <span>
                  {visitor === 'traveler'
                    ? isJa
                      ? `1回でまとめてセット（同じ院で${result.combo.items.length}つ）`
                      : `한 번에 끝내는 묶음 처방 (같은 병원 ${result.combo.items.length}개)`
                    : isJa
                      ? '今月の組み合わせプラン'
                      : '이번 달 묶음 관리 플랜'}
                </span>
              </div>
              <ul className="cg-lines">
                {result.combo.items.map((o) => (
                  <li key={o.menu.id}>
                    <span className="cg-line-name">
                      {menuName(o)}
                      <small>
                        {[
                          minutesOf(o) !== null ? `${isJa ? '施術' : '시술'} ${formatMinutes(minutesOf(o)!, isJa)}` : '',
                          visitor === 'resident' ? placeLine(o, false) : ''
                        ]
                          .filter(Boolean)
                          .join(' ・ ')}
                      </small>
                    </span>
                    <span className="num">{mainPrice(o.row.totalKrw, o.row.krTotalJpy)}</span>
                  </li>
                ))}
                <li className="cg-total">
                  <span>
                    {isJa ? '合計' : '합계'}
                    {paren(taxNote)}
                  </span>
                  <strong className="num">{mainPrice(result.combo.totalKrw, result.combo.totalJpy)}</strong>
                </li>
              </ul>
              {visitor === 'traveler' && (
                <p className="cg-place">
                  {placeLine(result.combo.items[0], false)} ・{' '}
                  {isJa
                    ? `日本だと合計 ${formatJpy(result.combo.jpTotalJpy)}`
                    : `일본이면 합계 ${formatJpy(result.combo.jpTotalJpy)}`}
                </p>
              )}
              <div className="cg-badges">
                {visitor === 'traveler' ? (
                  <span className="cg-badge is-save">
                    {formatJpy(result.combo.saveJpy)} {isJa ? 'おトク' : '절약'}
                  </span>
                ) : (
                  result.combo.seoulSaveKrw > 0 && (
                    <span className="cg-badge is-save">
                      {isJa ? 'ソウル平均より' : '서울 평균보다'}{' '}
                      {residentYen
                        ? formatJpy(Math.round((result.combo.seoulSaveKrw * 100) / krwPer100Jpy))
                        : formatKrw(result.combo.seoulSaveKrw)}{' '}
                      {isJa ? '安い' : '저렴'}
                    </span>
                  )
                )}
                {result.combo.sameClinic && result.combo.items.every((o) => minutesOf(o) !== null) && (
                  <span className="cg-badge is-time">
                    <ConciergeEmoji name="stopwatch" size={14} />
                    {isJa
                      ? `1回の来院で施術 ${formatMinutes(result.combo.items.reduce((t, o) => t + (minutesOf(o) ?? 0), 0), true)}`
                      : `한 번 방문에 시술 ${formatMinutes(result.combo.items.reduce((t, o) => t + (minutesOf(o) ?? 0), 0), false)}`}
                  </span>
                )}
                {result.combo.remaining !== null && (
                  <span className="cg-badge is-soft">
                    {isJa ? '予算の残り' : '남은 예산'}{' '}
                    {visitor === 'traveler' ? formatJpy(result.combo.remaining) : formatKrw(result.combo.remaining)}
                  </span>
                )}
                <span className="cg-badge is-ok">{isJa ? '✓ どれも予定に間に合う' : '✓ 모두 일정 전 회복'}</span>
              </div>
              {result.combo.sameClinic && (
                <>
                  <div className="cg-actions">
                    <button
                      type="button"
                      className="cg-btn is-primary"
                      onClick={() =>
                        openClinic(
                          result.combo!.items[0].row.place.id,
                          result.combo!.items.map((o) => o.menu.id),
                          'combo'
                        )
                      }
                    >
                      {isJa ? 'このセットで見る' : '이 세트로 보기'}
                    </button>
                    <button
                      type="button"
                      className="cg-btn"
                      onClick={() =>
                        copyOrderMemoFor(
                          result.combo!.items[0].row.place.id,
                          result.combo!.items.map((o) => o.menu.id),
                          'combo-memo'
                        )
                      }
                    >
                      <span className="cg-btn-inline">
                        {copiedId === 'combo-memo' ? (
                          <Check size={14} strokeWidth={2.5} />
                        ) : (
                          <Copy size={14} strokeWidth={2.2} />
                        )}
                        <span>
                          {copiedId === 'combo-memo'
                            ? isJa
                              ? 'コピー済'
                              : '복사 완료'
                            : isJa
                              ? 'セットメモコピー'
                              : '세트 멘트 복사'}
                        </span>
                      </span>
                    </button>
                  </div>
                  <ShareStoryButton
                    variant="pastel"
                    lang={lang}
                    shareUrl={buildClinicUrl(
                      window.location.origin,
                      appBasePath,
                      result.combo.items[0].row.place.id,
                      {
                        lang,
                        menuId: result.combo.items[0].menu.id,
                        menus: result.combo.items.map((o) => o.menu.id),
                        visits: 1,
                        includeVat
                      }
                    )}
                    fxNote={fxNote}
                    story={{
                      fileName: `dopagaki-combo-${result.combo.items[0].row.place.id}.png`,
                      placeName: isJa
                        ? result.combo.items[0].row.place.nameJa
                        : result.combo.items[0].row.place.nameKo,
                      menuTitle: result.combo.items.map((o) => menuName(o)).join(' + '),
                      jpTotalJpy: result.combo.jpTotalJpy,
                      krTotalJpy: result.combo.totalJpy,
                      savingsJpy: result.combo.saveJpy,
                      savingsPct:
                        result.combo.jpTotalJpy > 0
                          ? Math.round((result.combo.saveJpy / result.combo.jpTotalJpy) * 100)
                          : 0,
                      japaneseSupport: result.combo.items[0].row.place.japaneseSupport,
                      shareText: isJa
                        ? `${result.combo.items[0].row.place.nameJa}で${result.combo.items.map((o) => menuName(o)).join('＋')}が日本より${formatJpy(result.combo.saveJpy)}おトク！`
                        : `${result.combo.items[0].row.place.nameKo} ${result.combo.items.map((o) => menuName(o)).join(' + ')} 일본 대비 ${formatJpy(result.combo.saveJpy)} 절약!`,
                      trackProps: {
                        place_id: result.combo.items[0].row.place.id,
                        menu: result.combo.items.map((o) => o.menu.id).join(','),
                        lang,
                        source: 'concierge_combo'
                      }
                    }}
                    onSuccess={(method) =>
                      onShowToast(
                        isJa
                          ? method === 'share'
                            ? 'セット画像をシェアしました'
                            : '9:16セット画像を保存しました'
                          : method === 'share'
                            ? '세트 스토리 이미지를 공유했어요'
                            : '9:16 세트 이미지를 저장했어요',
                        true
                      )
                    }
                    onError={(msg) => onShowToast(msg, false)}
                  />
                </>
              )}
            </article>
          )}

          {result.nextPlan?.cheapest && (
            <article className="cg-card is-quiet">
              <div className="cg-kicker">
                <ConciergeEmoji name="calendar" size={24} />
                <span>
                  {result.nextPlan.reason === 'budget'
                    ? isJa
                      ? '来月のおすすめ候補'
                      : '다음 달 추천 후보'
                    : isJa
                      ? '予定が終わったらおすすめ'
                      : '일정 끝난 뒤 추천 후보'}
                </span>
              </div>
              <div className="cg-card-title">
                <MenuEmoji menuId={result.nextPlan.menu.id} size={26} />
                <div>
                  <h3>{menuName(result.nextPlan)}</h3>
                  <p className="cg-place">{placeLine(result.nextPlan.cheapest, false)}</p>
                </div>
                <strong className="cg-price-side num">
                  {mainPrice(result.nextPlan.cheapest.row.totalKrw, result.nextPlan.cheapest.row.krTotalJpy)}
                </strong>
              </div>
              <div className="cg-badges">
                {result.nextPlan.reason === 'budget' ? (
                  <span className="cg-badge is-soft">
                    {isJa
                      ? `今月の予算を${overBy(result.nextPlan.cheapest)}オーバー`
                      : `이번 달 예산을 ${overBy(result.nextPlan.cheapest)} 초과`}
                  </span>
                ) : (
                  <span className="cg-badge is-warn">
                    {isJa
                      ? `! ${downtimeBadge(result.nextPlan.menu.id)} → 予定のない週に`
                      : `! ${downtimeBadge(result.nextPlan.menu.id)} → 일정 없는 주에`}
                  </span>
                )}
              </div>
            </article>
          )}

          {shownExcluded.length > 0 && (
            <article className="cg-card is-quiet">
              <div className="cg-kicker is-muted">
                <ConciergeEmoji name="warning" size={22} />
                <span>{isJa ? '室長が今回は外した施術' : '실장님이 이번엔 안전하게 뺀 시술'}</span>
              </div>
              <ul className="cg-excluded">
                {shownExcluded.slice(0, 5).map((e) => (
                  <li key={e.menu.id}>
                    <b>{menuName(e)}</b> … {excludedReason(e)}
                  </li>
                ))}
              </ul>
            </article>
          )}

          {/* Counselor Follow-Up Quick Questions */}
          <div className="cg-followups">
            <span className="cg-quick-label">
              <Sparkles size={12} strokeWidth={2.3} />
              <span>{isJa ? '条件を少し変えて再相談' : '실장님에게 바로 이어서 물어보기'}</span>
            </span>
            <div className="cg-chips">
              {budget !== null && (
                <button type="button" className="cg-followup-chip" onClick={handleBumpBudget}>
                  {visitor === 'traveler'
                    ? isJa
                      ? '予算を+1万円増やしたら？'
                      : '예산 1만 엔 더 늘리면?'
                    : isJa
                      ? '予算を+5万ウォン増やしたら？'
                      : '예산 5만 원 더 늘리면?'}
                </button>
              )}
              {noNeedle && (
                <button
                  type="button"
                  className="cg-followup-chip"
                  onClick={handleAllowNeedle}
                >
                  {isJa ? '針OKにしたらどう変わる？' : '바늘 괜찮으면 뭐가 더 좋아?'}
                </button>
              )}
              <button
                type="button"
                className="cg-followup-chip"
                onClick={() => resetFrom('concerns')}
              >
                {isJa ? 'お悩みを変える' : '피부 고민만 바꾸기'}
              </button>
              <button
                type="button"
                className="cg-followup-chip"
                onClick={() => resetFrom('visitor')}
              >
                {isJa ? '最初から新しく相談' : '처음부터 새 상담'}
              </button>
            </div>
          </div>

          <p className="cg-disclaimer">
            {isJa ? '最終判断はクリニックの医師と相談してください' : '최종 판단은 병원 전문의와 상담하세요'}
            <br />
            {isJa
              ? '施術時間は目安です（麻酔・カウンセリング・待ち時間で変わります）'
              : '시술 시간은 대략이에요 (마취·상담·대기 시간에 따라 달라져요)'}
            <br />
            {isJa
              ? `価格は各院の公式掲載価格（${taxNote}・100円=₩${krwPer100Jpy}）`
              : `가격은 각 병원 공식 게시가 (${taxNote} · 100엔=₩${krwPer100Jpy})`}
          </p>
        </section>
      )}

      {/* Sticky Bottom Chat Composer (KakaoTalk / LINE Counselor Chat Feel) */}
      <form className="cg-composer" onSubmit={submitText}>
        <div className="cg-composer-row">
          <input
            id="cg-ask-input"
            type="text"
            value={draft}
            maxLength={300}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              isJa
                ? '例: 毛穴・たるみ、1万円、明後日帰国'
                : '예: 모공·탄력, 1만엔, 모레 귀국'
            }
            autoComplete="off"
            enterKeyHint="send"
            aria-label={isJa ? 'カウンセラーへの相談入力' : '상담실장에게 질문 입력'}
          />
          <button
            type="submit"
            disabled={!draft.trim() || thinking}
            aria-label={isJa ? '送信' : '보내기'}
          >
            <Send size={17} strokeWidth={2.3} />
          </button>
        </div>
        {conciergeAiEnabled && (
          <p className="cg-ask-note">
            {isJa
              ? '自然な文章もAIで読み取ります · 名前や連絡先は書かないでね'
              : '자연스러운 문장도 AI가 읽어요 · 이름·연락처는 적지 마세요'}
          </p>
        )}
      </form>
    </div>
  );
}
