import { useEffect, useMemo, useRef, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  LocateFixed,
  MapPin,
  MessageSquareText,
  Navigation,
  Share2,
  ShieldAlert,
  Sparkles,
  Star,
  Tag
} from 'lucide-react';
import type { GeoPoint, Lang, NaverFxSnapshot, PlaceItem, PriceDataset } from '@/types.ts';
import {
  formatDistance,
  formatJpy,
  formatKrw,
  formatRate,
  formatSeoulDiffBanner,
  haversineMeters,
  isPointInSouthKorea,
  jpyToKrw,
  krwToJpy
} from '@/lib/calc.ts';
import {
  buildClinicUrl,
  buildNaverMapAppUrl,
  buildTransitUrl,
  computeClinicBundle,
  detectAppBasePath,
  findNearbyClinics,
  loadSavedClinicIds,
  toggleSavedClinicId,
  type TransitOriginPreset
} from '@/lib/clinic-helpers.ts';
import { getCopy } from '@/lib/i18n.ts';
import { triggerHaptic } from '@/lib/fluid.ts';
import { animateTransitionPanel } from '@/lib/motion-primitives.ts';
import {
  buildCommunityReviewLinks,
  buildPrimaryReviewUrl,
  getBrandReview,
  getClinicSafetyAudit
} from '@/data/brand-reviews.ts';
import { getClinicChannels, type ResolvedClinicChannel } from '@/data/clinic-channels.ts';
import { getExternalReviewPosts } from '@/data/external-review-posts.ts';
import { getClinicAiRating } from '@/lib/ai-rating.ts';
import { renderFullSafetyAuditBoxHtml } from '@/lib/clinic-trust-ui.ts';
import { getOfficialMenuProof } from '@/data/official-proofs.ts';
import { MenuEmoji } from '@/components/emoji.tsx';
import { TraitChip, formatCompactKrw } from '@/components/Modals.tsx';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background.tsx';
import { PctFlow, YenFlow } from '@/components/ui/number-flow.tsx';
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger
} from '@/components/motion-primitives/disclosure.tsx';
import { ProofLightboxImage } from '@/components/ProofLightboxImage.tsx';
import { ShareStoryButton } from '@/components/ShareStoryButton.tsx';
import {
  AiRadarChart,
  InfoPopover,
  PricePositionBar
} from '@/components/ClinicVisuals.tsx';
import {
  ExternalReviewsCarousel,
  NearbyClinicsCarousel
} from '@/components/ClinicCarousels.tsx';
import { ClinicBookingSheet } from '@/components/ClinicBookingSheet.tsx';
import { FeeTransparencyBox } from '@/components/FeeTransparencyBox.tsx';
import { FluidStepper } from '@/components/ui/fluid-stepper.tsx';

export interface ClinicPageViewProps {
  place: PlaceItem;
  dataset: PriceDataset;
  naverFx: NaverFxSnapshot;
  lang: Lang;
  includeVat: boolean;
  krwPer100Jpy: number;
  selectedMenus: string[];
  visits: number;
  userLocation: GeoPoint | null;
  locatingUser: boolean;
  onChangeSelectedMenus: (menus: string[]) => void;
  onChangeVisits: (visits: number) => void;
  onToggleVat: (nextVat: boolean) => void;
  onBack: () => void;
  onSelectClinic: (clinicId: string) => void;
  onOpenShare: () => void;
  onShowToast: (
    message: string,
    isOk?: boolean,
    action?: { label: string; onClick: () => void }
  ) => void;
  onSavedIdsChange?: (ids: string[]) => void;
  onRequestLocation: () => void;
}

type DetailTabId = 'price' | 'reviews' | 'visit';

function channelBadgeText(kind: ResolvedClinicChannel['kind'], isJa: boolean): string {
  switch (kind) {
    case 'kakao':
      return isJa ? 'KAKAO' : '카톡';
    case 'line':
      return 'LINE';
    case 'instagram':
      return 'IG';
    case 'naver_booking':
      return 'NAVER';
    case 'direct_reserve':
      return 'WEB';
  }
}

export function ClinicPageView({
  place,
  dataset,
  naverFx,
  lang,
  includeVat,
  krwPer100Jpy,
  selectedMenus,
  visits,
  userLocation,
  locatingUser,
  onChangeSelectedMenus,
  onChangeVisits,
  onToggleVat,
  onBack,
  onSelectClinic,
  onOpenShare,
  onShowToast,
  onSavedIdsChange,
  onRequestLocation
}: ClinicPageViewProps) {
  const proofStageRef = useRef<HTMLDivElement>(null);
  const tabsSectionRef = useRef<HTMLDivElement>(null);
  const { ref: heroInViewRef, inView: heroInView } = useInView({
    threshold: 0,
    rootMargin: '-64px 0px 0px 0px',
    initialInView: true
  });

  const offeredMenus = dataset.menus.filter((m) => Boolean(place.prices[m.id]));
  const offeredMenuIds = offeredMenus.map((m) => m.id);

  const [activeTab, setActiveTab] = useState<DetailTabId>('price');
  const [activeProofMenuId, setActiveProofMenuId] = useState<string>(
    () =>
      selectedMenus.find((id) => getOfficialMenuProof(place, id, lang).imageFile !== null) ??
      selectedMenus[0] ??
      offeredMenuIds[0] ??
      dataset.menus[0].id
  );
  const [savedIds, setSavedIds] = useState<string[]>(() => loadSavedClinicIds());
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  const prevProofRef = useRef<{ clinicId: string; menuId: string; idx: number }>({
    clinicId: place.id,
    menuId: activeProofMenuId,
    idx: -1
  });

  useEffect(() => {
    const preferred =
      selectedMenus.find((id) => getOfficialMenuProof(place, id, lang).imageFile !== null) ??
      selectedMenus[0] ??
      offeredMenuIds[0] ??
      dataset.menus[0].id;
    setActiveProofMenuId(preferred);
    setActiveTab('price');
    setSafetyOpen(false);
    setReceiptOpen(false);
    setBookingOpen(false);
  }, [place.id]);

  const copy = getCopy(lang);
  const isJa = lang === 'ja';
  const name = isJa ? place.nameJa : place.nameKo;
  const subName = isJa ? place.nameKo : place.nameJa;
  const station = isJa ? place.stationJa : place.stationKo;
  const caveat = isJa ? place.caveatJa : place.caveatKo;
  const areaObj = dataset.areas.find((a) => a.id === place.area);
  const areaLabel = areaObj
    ? (isJa ? areaObj.nameJa : areaObj.nameKo).split(/[ （(・]/)[0]
    : place.area;

  const inKoreaLoc = isPointInSouthKorea(userLocation);
  const hasForeignLoc = Boolean(userLocation && !inKoreaLoc);
  const distanceMeters = inKoreaLoc
    ? haversineMeters(userLocation!.lat, userLocation!.lng, place.lat, place.lng)
    : 0;
  const distLabel = inKoreaLoc ? formatDistance(distanceMeters, lang, true) : '';

  const bundle = useMemo(
    () =>
      computeClinicBundle(
        place,
        dataset.menus,
        selectedMenus,
        visits,
        includeVat,
        krwPer100Jpy,
        dataset.meta.vatRate,
        dataset.places
      ),
    [place, dataset.menus, selectedMenus, visits, includeVat, krwPer100Jpy, dataset.meta.vatRate, dataset.places]
  );

  const isSaved = savedIds.includes(place.id);
  const allSelected =
    offeredMenus.length > 1 && offeredMenus.every((m) => selectedMenus.includes(m.id));
  const officialTag = isJa
    ? place.sourceType === 'official_standard'
      ? '公式定価'
      : '公式イベント'
    : place.sourceType === 'official_standard'
      ? '공식 정가'
      : '공식 이벤트';

  const primaryMenuId = selectedMenus[0] ?? offeredMenus[0]?.id ?? dataset.menus[0].id;
  const primaryMenu = dataset.menus.find((m) => m.id === primaryMenuId) ?? dataset.menus[0];
  const resolvedProofMenuId = offeredMenuIds.includes(activeProofMenuId)
    ? activeProofMenuId
    : primaryMenu.id;
  const proofMenu = dataset.menus.find((m) => m.id === resolvedProofMenuId) ?? primaryMenu;
  const activeProof = getOfficialMenuProof(place, proofMenu.id, lang);
  const activeListedKrw = place.prices[proofMenu.id]?.krw ?? null;
  const proofMenuLabel = isJa ? proofMenu.shortJa : proofMenu.shortKo;
  const nearby = useMemo(
    () => findNearbyClinics(dataset, place, primaryMenu.id, 4),
    [dataset, place, primaryMenu.id]
  );
  const primaryReviewUrl = buildPrimaryReviewUrl(place, lang);
  const appBasePath = detectAppBasePath(window.location.pathname);

  const brandRev = useMemo(() => getBrandReview(place), [place]);
  const aiRating = useMemo(
    () => getClinicAiRating(place, dataset.places),
    [place, dataset.places]
  );
  const externalPosts = useMemo(() => getExternalReviewPosts(place, lang), [place, lang]);
  const communityLinks = useMemo(() => buildCommunityReviewLinks(place, lang), [place, lang]);
  const bookingChannels = useMemo(() => getClinicChannels(place.id, lang), [place.id, lang]);
  const bank = isJa ? naverFx.bankJa : naverFx.bankKo;
  const rateNote = copy.receiptRateNote(formatRate(krwPer100Jpy), naverFx.dateLabel, bank);

  // Compute Seoul min price for the active bundle so PricePositionBar is exact
  const seoulMinJpy = useMemo(() => {
    let totalMinJpy = 0;
    for (const item of bundle.items) {
      let menuMinJpy = Number.POSITIVE_INFINITY;
      for (const p of dataset.places) {
        const off = p.prices[item.menu.id];
        if (!off) continue;
        const applyVat = includeVat && p.vatExcluded && item.menu.vatAppliesInKorea;
        const krw = off.krw + (applyVat ? Math.round(off.krw * dataset.meta.vatRate) : 0);
        const jpy = krwToJpy(krw, krwPer100Jpy);
        if (jpy < menuMinJpy) menuMinJpy = jpy;
      }
      if (Number.isFinite(menuMinJpy)) {
        totalMinJpy += menuMinJpy * visits;
      }
    }
    return totalMinJpy > 0 ? totalMinJpy : bundle.krTotalJpy;
  }, [bundle.items, dataset.places, dataset.meta.vatRate, includeVat, krwPer100Jpy, visits, bundle.krTotalJpy]);

  const primaryUnitJpy = useMemo(() => {
    const off = place.prices[primaryMenu.id];
    if (!off) return bundle.krTotalJpy;
    const applyVat = includeVat && place.vatExcluded && primaryMenu.vatAppliesInKorea;
    const krw = off.krw + (applyVat ? Math.round(off.krw * dataset.meta.vatRate) : 0);
    return krwToJpy(krw, krwPer100Jpy);
  }, [place, primaryMenu, includeVat, dataset.meta.vatRate, krwPer100Jpy, bundle.krTotalJpy]);

  const seoulBanner = formatSeoulDiffBanner(
    bundle.seoulAvgJpy,
    bundle.seoulDiffJpy,
    bundle.seoulDiffPct,
    lang,
    bundle.seoulSampleCount,
    bundle.items.length > 1
  );

  useEffect(() => {
    const idx = offeredMenus.findIndex((m) => m.id === proofMenu.id);
    const prev = prevProofRef.current;
    const switched =
      prev.clinicId === place.id && prev.menuId !== '' && prev.menuId !== proofMenu.id;
    if (switched && proofStageRef.current) {
      const dir: -1 | 1 = idx >= prev.idx ? 1 : -1;
      animateTransitionPanel(proofStageRef.current, {
        axis: 'x',
        direction: dir,
        distance: 8,
        blurPx: 2,
        durationSec: 0.18
      });
    }
    prevProofRef.current = { clinicId: place.id, menuId: proofMenu.id, idx };
  }, [place.id, proofMenu.id]);

  const handleTransitClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    presetId: TransitOriginPreset
  ) => {
    if (!isJa) return;
    const nmapUrl = buildNaverMapAppUrl(presetId, place, userLocation, lang);
    const webUrl = buildTransitUrl(presetId, place, userLocation, lang);
    const isMobile =
      typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile || !nmapUrl) return;

    e.preventDefault();
    triggerHaptic(6);
    let appOpened = false;
    const cleanup = () => {
      appOpened = true;
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', cleanup);
    };
    const onVis = () => {
      if (document.hidden) cleanup();
    };
    document.addEventListener('visibilitychange', onVis, { once: true });
    window.addEventListener('pagehide', cleanup, { once: true });
    window.setTimeout(() => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', cleanup);
      if (!appOpened && !document.hidden) {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }
    }, 1100);
    window.location.href = nmapUrl;
  };

  const handleToggleSave = () => {
    triggerHaptic(8);
    const res = toggleSavedClinicId(place.id);
    setSavedIds(res.ids);
    onSavedIdsChange?.(res.ids);
    onShowToast(
      isJa
        ? res.saved
          ? 'このクリニックを保存しました'
          : '保存を解除しました'
        : res.saved
          ? '이 병원을 저장했어요'
          : '저장을 해제했어요',
      res.saved,
      {
        label: isJa ? '元に戻す' : '되돌리기',
        onClick: () => {
          const reverted = toggleSavedClinicId(place.id);
          setSavedIds(reverted.ids);
          onSavedIdsChange?.(reverted.ids);
        }
      }
    );
  };

  const jumpToTab = (tab: DetailTabId) => {
    triggerHaptic(6);
    setActiveTab(tab);
    window.requestAnimationFrame(() => {
      tabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const safetyAudit = useMemo(() => getClinicSafetyAudit(place), [place]);
  const fullSafetyHtml = useMemo(() => renderFullSafetyAuditBoxHtml(place, lang), [place, lang]);
  const topTrait = brandRev.traits[0];

  const shareUrl = buildClinicUrl(window.location.origin, appBasePath, place.id, {
    lang,
    menuId: primaryMenu.id,
    menus: bundle.items.map((item) => item.menu.id),
    visits,
    includeVat
  });

  const detailTabs: Array<{ id: DetailTabId; ko: string; ja: string; badge?: string }> = [
    { id: 'price', ko: '가격 · 캡처', ja: '料金・スクショ' },
    {
      id: 'reviews',
      ko: '평점 · 후기',
      ja: '評価・口コミ',
      badge: `★${aiRating.formatted}`
    },
    { id: 'visit', ko: '위치 · 예약', ja: '場所・予約' }
  ];

  return (
    <article className="cp-page cp2-page" id="clinic-detail-page">
      {/* ScrollSpy Sticky Compact Bar (0px layout footprint — zero scroll-up oscillation) */}
      <div className="cp2-sticky-anchor" aria-hidden={heroInView}>
        <div className={`cp2-sticky-bar ${!heroInView ? 'is-visible' : ''}`}>
          <button
            type="button"
            className="cp2-sticky-back"
            tabIndex={heroInView ? -1 : 0}
            onClick={() => {
              triggerHaptic(6);
              onBack();
            }}
            aria-label={isJa ? '戻る' : '돌아가기'}
          >
            <ArrowLeft size={16} strokeWidth={2.4} />
          </button>
          <div className="cp2-sticky-info">
            <strong className="cp2-sticky-name">{name}</strong>
            <span className="cp2-sticky-price num">
              {formatJpy(bundle.krTotalJpy)}
              {bundle.savingsJpy > 0 ? ` (-${bundle.savingsPct}%)` : ''}
            </span>
          </div>
          <button
            type="button"
            className="cp2-sticky-book"
            tabIndex={heroInView ? -1 : 0}
            onClick={() => {
              triggerHaptic(8);
              setBookingOpen(true);
            }}
          >
            {isJa ? '予約' : '예약'}
          </button>
        </div>
      </div>

      {/* Top Navigation Row */}
      <div className="cp-topbar">
        <button
          type="button"
          className="cp-back-btn"
          id="clinic-back-btn"
          onClick={() => {
            triggerHaptic(6);
            onBack();
          }}
        >
          <ArrowLeft size={15} strokeWidth={2.3} />
          <span>{isJa ? 'ランキングへ戻る' : '순위로 돌아가기'}</span>
        </button>

        <div className="cp-top-actions">
          <button
            type="button"
            className={`cp-icon-btn ${isSaved ? 'is-saved' : ''}`}
            id="clinic-save-btn"
            aria-pressed={isSaved}
            onClick={handleToggleSave}
          >
            <Bookmark size={14} strokeWidth={2.2} fill={isSaved ? 'currentColor' : 'none'} />
            <span>{isJa ? (isSaved ? '保存済' : '保存') : isSaved ? '저장됨' : '저장'}</span>
          </button>

          <button
            type="button"
            className="cp-icon-btn"
            id="clinic-share-btn"
            onClick={() => {
              triggerHaptic(6);
              onOpenShare();
            }}
          >
            <Share2 size={14} strokeWidth={2.2} />
            <span>{isJa ? '共有' : '공유'}</span>
          </button>
        </div>
      </div>

      {/* 3-Second Bento Hero Card */}
      <header ref={heroInViewRef} className="cp-card cp2-bento-hero">
        <div className="cp-badges">
          <span className="cp-area-pill">{areaLabel}</span>
          {place.japaneseSupport && (
            <span className="tg-jp-badge">
              <span className="tg-jp-code">JP</span>
              <span className="tg-jp-lbl">{copy.jpSupportTag}</span>
            </span>
          )}
          <span className="cp-tag-muted">{officialTag}</span>
        </div>

        <div className="cp2-hero-titles">
          <h1 className="cp-title">{name}</h1>
          <p className="cp-subname">{subName}</p>
          <p className="cp2-hero-vibe">
            <Sparkles size={13} strokeWidth={2.2} />
            <span>{isJa ? brandRev.vibeJa : brandRev.vibeKo}</span>
          </p>
        </div>

        {/* 3-Tile Bento KPI Grid */}
        <div className="cp2-bento-grid">
          {/* Tile 1: Hero Price & Savings (Full Width) */}
          <div className="cp2-tile is-price">
            <div className="cp2-tile-head">
              <span className="cp2-tile-kicker">
                <Tag size={12} strokeWidth={2.3} />
                <span>
                  {bundle.items
                    .map((it) => (isJa ? it.menu.shortJa : it.menu.shortKo))
                    .join(' + ')}
                  {visits > 1 ? (isJa ? ` ×${visits}回` : ` ×${visits}회`) : ''}
                </span>
              </span>
              <InfoPopover label={isJa ? '料金の注意点' : '가격 주의 안내'}>
                <p>
                  <strong>{isJa ? '料金ガイド' : '가격 확인 안내'}</strong>
                  <br />
                  {isJa
                    ? '初回体験価格が含まれる場合があります。2026年は免税終了のため韓国税金10%込み目安で計算しています。'
                    : '1회 체험가 조건일 수 있어요. 2026년 세금 환급 종료 기준 부가세 10%를 반영해 계산했습니다.'}
                </p>
              </InfoPopover>
            </div>

            <div className="cp2-price-line">
              <strong className="cp2-price-jpy num">
                <YenFlow value={bundle.krTotalJpy} />
              </strong>
              {bundle.savingsJpy > 0 && (
                <span className="cp2-price-off num">
                  <PctFlow pct={bundle.savingsPct} />
                </span>
              )}
            </div>

            <div className="cp2-price-sub num">
              <span className="cp2-local-krw-pill">
                {isJa
                  ? `現地決済額 ${formatKrw(bundle.totalKrw)}${includeVat ? '（税込10%）' : '（税別）'}`
                  : `실결제 예상 ${formatKrw(bundle.totalKrw)} (${formatCompactKrw(bundle.totalKrw, lang)}${includeVat ? ' · 부가세 포함' : ' · 별도'})`}
              </span>
              {bundle.savingsJpy > 0 && (
                <strong className="cp2-save-accent">
                  {isJa
                    ? `日本より ${formatJpy(bundle.savingsJpy)} おトク`
                    : `일본보다 ${formatJpy(bundle.savingsJpy)} 절약`}
                </strong>
              )}
            </div>
          </div>

          {/* Tile 2: AI Rating KPI */}
          <button
            type="button"
            className="cp2-tile is-kpi"
            onClick={() => jumpToTab('reviews')}
          >
            <span className="cp2-tile-kicker">
              <Star size={12} strokeWidth={2.4} fill="currentColor" />
              <span>{isJa ? 'AI総合評価' : 'AI 평점'}</span>
            </span>
            <strong className="cp2-kpi-val num">
              {aiRating.formatted}
              <small>/5.0</small>
            </strong>
            <span className="cp2-kpi-sub">
              {topTrait
                ? isJa
                  ? topTrait.labelJa
                  : topTrait.labelKo
                : isJa
                  ? '口コミを見る →'
                  : '후기 보기 →'}
            </span>
          </button>

          {/* Tile 3: Location / Distance KPI */}
          <button
            type="button"
            className="cp2-tile is-kpi"
            onClick={() => {
              if (!inKoreaLoc && !hasForeignLoc) {
                triggerHaptic(6);
                onRequestLocation();
              } else {
                jumpToTab('visit');
              }
            }}
          >
            <span className="cp2-tile-kicker">
              <MapPin size={12} strokeWidth={2.4} />
              <span>{distLabel || (isJa ? '最寄り駅' : '위치 · 역')}</span>
            </span>
            <strong className="cp2-kpi-station">{station}</strong>
            <span className="cp2-kpi-sub">
              {!inKoreaLoc && !hasForeignLoc
                ? locatingUser
                  ? isJa
                    ? '現在地を確認中…'
                    : '위치 확인 중…'
                  : isJa
                    ? '現在地からの距離を見る'
                    : '내 위치 거리 확인 →'
                : isJa
                  ? '行き方・予約を見る →'
                  : '길찾기 · 예약 보기 →'}
            </span>
          </button>
        </div>

        {/* Inline Safety Alert Disclosure (only when present) */}
        {safetyAudit.alerts.length > 0 && (
          <div className="cp-safety-box" id="clinic-safety-banner">
            <Disclosure
              open={safetyOpen}
              onOpenChange={(next) => {
                triggerHaptic(6);
                setSafetyOpen(next);
              }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <DisclosureTrigger>
                <button
                  type="button"
                  className="cp-safety-trigger"
                  aria-expanded={safetyOpen}
                  aria-controls="cp-safety-panel"
                >
                  <span className="cp-safety-icon">
                    <AlertTriangle size={15} strokeWidth={2.3} />
                  </span>
                  <span className="cp-safety-summary">
                    <strong>{isJa ? '事前確認あり' : '사전 확인 안내'}</strong>
                    <span className="cp-safety-pills">
                      {safetyAudit.alerts.map((al) => (
                        <span className="safety-badge-pill" key={al.id}>
                          {isJa ? al.badgeJa : al.badgeKo}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="cp-safety-chevron">
                    <span>{safetyOpen ? (isJa ? '閉じる' : '접기') : isJa ? '詳細' : '내용'}</span>
                    <ChevronDown
                      size={14}
                      strokeWidth={2.3}
                      className={safetyOpen ? 'is-rotated' : ''}
                    />
                  </span>
                </button>
              </DisclosureTrigger>
              <DisclosureContent id="cp-safety-panel">
                <div className="cp-safety-body">
                  {safetyAudit.alerts.map((al) => (
                    <div className={`cp-safety-item is-${al.severity}`} key={al.id}>
                      <div className="cp-safety-item-top">
                        <strong>{isJa ? al.titleJa : al.titleKo}</strong>
                        <span className="cp-safety-src">{isJa ? al.sourceJa : al.sourceKo}</span>
                      </div>
                      <ul>
                        {al.bullets.map((b) => (
                          <li key={b.labelKo}>
                            <strong>{isJa ? b.labelJa : b.labelKo}</strong>{' '}
                            {isJa ? b.bodyJa : b.bodyKo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <p className="cp-safety-baseline">
                    <strong>{isJa ? '事故・移転確認: ' : '의료사고·이전 이력: '}</strong>
                    {isJa ? safetyAudit.baselineStatusJa : safetyAudit.baselineStatusKo}
                  </p>
                </div>
              </DisclosureContent>
            </Disclosure>
          </div>
        )}

        {/* Quick Action Strip: Story Share + 1-Tap Naver Map */}
        <div className="cp2-quick-strip">
          <ShareStoryButton
            variant="pastel"
            className="cp2-story-btn"
            lang={lang}
            shareUrl={shareUrl}
            fxNote={rateNote}
            label={isJa ? 'ストーリー画像' : '스토리 카드'}
            story={{
              fileName: `dopagaki-${place.id}-${bundle.items.map((item) => item.menu.id).join('-')}.png`,
              placeName: name,
              menuTitle:
                bundle.items
                  .map((item) => (isJa ? item.menu.shortJa : item.menu.shortKo))
                  .join(' + ') + (visits > 1 ? ` ×${visits}` : ''),
              jpTotalJpy: bundle.jpBenchmarkJpy,
              krTotalJpy: bundle.krTotalJpy,
              savingsJpy: bundle.savingsJpy,
              savingsPct: bundle.savingsPct,
              japaneseSupport: place.japaneseSupport,
              shareText: isJa
                ? `${name}で${bundle.items.map((item) => item.menu.shortJa).join('＋')}が日本より${formatJpy(bundle.savingsJpy)}おトク（${bundle.savingsPct}%OFF）`
                : `${name} ${bundle.items.map((item) => item.menu.shortKo).join(' + ')} 일본 대비 ${formatJpy(bundle.savingsJpy)} 절약 (${bundle.savingsPct}% OFF)`,
              trackProps: { place_id: place.id, menu: primaryMenu.id, lang, source: 'clinic_page' }
            }}
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

          <a
            className="cp2-map-quick-btn"
            href={buildTransitUrl('current', place, userLocation, lang)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleTransitClick(e, 'current')}
          >
            <Navigation size={15} strokeWidth={2.2} />
            <span>{isJa ? 'NAVER経路' : '네이버 길찾기'}</span>
          </a>
        </div>
      </header>

      {/* 3-Tab App Section Switcher (@radix-ui/react-tabs + motion spring indicator) */}
      <div ref={tabsSectionRef} className="cp2-tabs-anchor">
        <Tabs.Root
          value={activeTab}
          onValueChange={(v) => {
            triggerHaptic(6);
            setActiveTab(v as DetailTabId);
          }}
        >
          <Tabs.List
            className="cp2-tablist"
            aria-label={isJa ? 'クリニック詳細セクション' : '병원 상세 탭'}
          >
            {detailTabs.map((t) => {
              const selected = activeTab === t.id;
              return (
                <Tabs.Trigger
                  key={t.id}
                  value={t.id}
                  className={`cp2-tab ${selected ? 'is-active' : ''}`}
                >
                  {selected && (
                    <motion.span
                      layoutId="cp2-tab-pill"
                      className="cp2-tab-bg"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="cp2-tab-text">
                    <span>{isJa ? t.ja : t.ko}</span>
                    {t.badge && <small className="cp2-tab-badge num">{t.badge}</small>}
                  </span>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          {/* TAB 1: Price Calculator, Price Position Bar & Official Proof Zoom */}
          <Tabs.Content value="price" className="cp2-tabpanel">
            <section className="cp-card cp2-sec-card" id="clinic-calc">
              <PricePositionBar
                clinicJpy={bundle.krTotalJpy}
                seoulMinJpy={seoulMinJpy}
                seoulAvgJpy={bundle.seoulAvgJpy}
                jpAvgJpy={bundle.jpBenchmarkJpy}
                isJa={isJa}
              />

              <div className="cp2-compare-banner">
                <span className={`cp-seoul-pill num is-${seoulBanner.tone}`}>
                  {seoulBanner.text}
                </span>
              </div>

              <div className="cp-sec-head">
                <h2>{isJa ? '施術を組み合わせ計算' : '시술 골라서 합계 계산'}</h2>
                {offeredMenus.length > 1 && (
                  <button
                    type="button"
                    className="cp-mini-btn"
                    id="clinic-select-all"
                    aria-pressed={allSelected}
                    onClick={() => {
                      triggerHaptic(6);
                      const nextMenus = allSelected ? [offeredMenuIds[0]] : offeredMenuIds;
                      onChangeSelectedMenus(nextMenus);
                      if (!offeredMenuIds.includes(activeProofMenuId)) {
                        setActiveProofMenuId(
                          offeredMenuIds.find(
                            (m) => getOfficialMenuProof(place, m, lang).imageFile !== null
                          ) ?? offeredMenuIds[0]
                        );
                      }
                    }}
                  >
                    {isJa
                      ? allSelected
                        ? '1施術に戻す'
                        : `全${offeredMenus.length}種選択`
                      : allSelected
                        ? '1개만 보기'
                        : `${offeredMenus.length}종 모두 담기`}
                  </button>
                )}
              </div>

              <div className="cp-menu-grid" role="group" aria-label={isJa ? '施術選択' : '시술 선택'}>
                {offeredMenus.map((m) => {
                  const offer = place.prices[m.id]!;
                  const applyVat = includeVat && place.vatExcluded && m.vatAppliesInKorea;
                  const unitTotalKrw =
                    offer.krw + (applyVat ? Math.round(offer.krw * dataset.meta.vatRate) : 0);
                  const unitJpy = krwToJpy(unitTotalKrw, krwPer100Jpy);
                  const active = selectedMenus.includes(m.id);
                  const label =
                    m.id === 're2o-5cc'
                      ? isJa
                        ? 'ブナジュ'
                        : '리투오 (부나주)'
                      : isJa
                        ? m.shortJa
                        : m.shortKo;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className="cp-menu-chip"
                      data-clinic-menu={m.id}
                      aria-pressed={active}
                      onClick={() => {
                        triggerHaptic(6);
                        if (active) {
                          if (selectedMenus.length > 1) {
                            onChangeSelectedMenus(selectedMenus.filter((x) => x !== m.id));
                          }
                        } else {
                          const nextMenus = [...selectedMenus, m.id];
                          onChangeSelectedMenus(nextMenus);
                          setActiveProofMenuId(m.id);
                        }
                      }}
                    >
                      <span className="cp-menu-top">
                        <MenuEmoji menuId={m.id} size={16} />
                        <span className="cp-menu-nm">{label}</span>
                      </span>
                      <strong className="cp-menu-pr num">{formatJpy(unitJpy)}</strong>
                      <span className="cp-menu-krw num">
                        {isJa ? formatKrw(unitTotalKrw) : formatCompactKrw(unitTotalKrw, lang)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="cp-opts-bar">
                <div className="cp-stepper-group">
                  <span className="cp-opt-lbl">{isJa ? '回数' : '횟수'}</span>
                  <FluidStepper
                    value={visits}
                    min={1}
                    max={6}
                    suffix={isJa ? '回' : '회'}
                    label={isJa ? '施術回数' : '시술 횟수'}
                    decLabel={isJa ? '回数を減らす' : '횟수 줄이기'}
                    incLabel={isJa ? '回数を増やす' : '횟수 늘리기'}
                    onChange={onChangeVisits}
                    onHaptic={() => triggerHaptic(6)}
                  />
                </div>

                <div className="cp2-vat-wrap">
                  <label className="cp-vat-toggle">
                    <input
                      type="checkbox"
                      id="clinic-vat-chk"
                      checked={includeVat}
                      onChange={(e) => {
                        triggerHaptic(6);
                        onToggleVat(e.target.checked);
                      }}
                    />
                    <span>{isJa ? '税金+10%込' : '부가세 +10%'}</span>
                  </label>
                  <InfoPopover label={isJa ? '税金・初回価格の説明' : '부가세 및 체험가 설명'}>
                    <p>
                      <strong>{isJa ? '2026年 税金+10%' : '2026년 부가세 +10%'}</strong>
                      <br />
                      {isJa
                        ? '韓国の美容皮膚科タックスリファンド終了に伴い、VAT別表記の院は10%加算して比較しています。初回体験価格の場合もあるため予約時にご確認ください。'
                        : '2026년 피부과 세금 환급 종료 기준으로 부가세 별도 지점은 10%를 합산해 비교합니다. 1회 체험가 조건일 수 있으니 예약 전 확인해 주세요.'}
                    </p>
                  </InfoPopover>
                </div>
              </div>

              <p className="clinic-stepper-caution cp-caution-line">
                {isJa
                  ? '※ 初回体験価格の場合あり（ご注意ください）'
                  : '※ 1회 체험가일 수 있으니 주의하세요'}
              </p>

              {/* 3-Line Cost Transparency Check (VAT / Anesthesia / Aftercare) */}
              <FeeTransparencyBox includeVat={includeVat} lang={lang} />

              {/* Official Price Screenshot Proof (with PhotoSwipe Zoom) */}
              <div className="cp-proof-section" id="clinic-official-proof">
                <div className="cp-sec-head">
                  <h3>{isJa ? '公式サイト 料金表スクショ' : '공식 홈페이지 가격표 캡처'}</h3>
                  <span className="cp-proof-date num">
                    {isJa ? `${activeProof.capturedDate} 確認` : `${activeProof.capturedDate} 확인`}
                  </span>
                </div>

                {offeredMenus.length > 1 && (
                  <div
                    className="cp-proof-tabs has-mp-bg"
                    role="tablist"
                    aria-label={isJa ? '施術別公式スクショ' : '시술별 공식 캡처'}
                  >
                    <AnimatedBackground
                      value={proofMenu.id}
                      onValueChange={(id) => {
                        if (id) {
                          triggerHaptic(6);
                          setActiveProofMenuId(id);
                        }
                      }}
                      className="mp-accent-pill"
                      transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                    >
                      {offeredMenus.map((menu) => (
                        <button
                          key={menu.id}
                          type="button"
                          role="tab"
                          data-id={menu.id}
                          className="cp-proof-tab"
                          aria-selected={menu.id === proofMenu.id}
                        >
                          <span>{isJa ? menu.shortJa : menu.shortKo}</span>
                        </button>
                      ))}
                    </AnimatedBackground>
                  </div>
                )}

                {activeProof.imageFile && activeProof.verifiedKrw !== null ? (
                  <div ref={proofStageRef} className="cp-proof-shot">
                    <div className="cp-proof-bar">
                      <span className="cp-proof-ok">
                        <CheckCircle2 size={14} strokeWidth={2.4} />
                        <span>
                          {isJa
                            ? `${proofMenuLabel} · 公式 ${formatKrw(activeProof.verifiedKrw)}`
                            : `${proofMenuLabel} · 공식 ${formatKrw(activeProof.verifiedKrw)}`}
                        </span>
                      </span>
                      <a
                        className="cp-proof-ext-link"
                        href={activeProof.priceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>{isJa ? '公式サイト' : '공식 원문'}</span>
                        <ExternalLink size={12} strokeWidth={2.3} />
                      </a>
                    </div>
                    <div className="cp-proof-frame">
                      <ProofLightboxImage
                        src={`${appBasePath}${isJa && activeProof.imageFileJa ? 'official-proofs-ja' : 'official-proofs'}/${isJa && activeProof.imageFileJa ? activeProof.imageFileJa : activeProof.imageFile}`}
                        alt={
                          isJa
                            ? `${name} ${proofMenuLabel} 公式料金表 ${formatKrw(activeProof.verifiedKrw)}`
                            : `${name} ${proofMenuLabel} 공식가 ${formatKrw(activeProof.verifiedKrw)} 캡처`
                        }
                        captionTitle={
                          isJa
                            ? `${name} · ${proofMenuLabel} 公式 ${formatKrw(activeProof.verifiedKrw)}`
                            : `${name} · ${proofMenuLabel} 공식 ${formatKrw(activeProof.verifiedKrw)}`
                        }
                        officialUrl={activeProof.priceUrl}
                        isJa={isJa}
                      />
                    </div>
                  </div>
                ) : (
                  <div ref={proofStageRef}>
                    <a
                      className="cp-proof-fallback"
                      href={activeProof.priceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>
                        {isJa
                          ? `${proofMenuLabel}（${activeListedKrw !== null ? formatKrw(activeListedKrw) : ''}）公式サイトを開く`
                          : `${proofMenuLabel} (${activeListedKrw !== null ? formatKrw(activeListedKrw) : ''}) 공식 가격표 열기`}
                      </span>
                      <ExternalLink size={14} strokeWidth={2.2} />
                    </a>
                  </div>
                )}
              </div>

              {/* Collapsible Receipt & Japan 5-Clinic Breakdown */}
              <Disclosure
                open={receiptOpen}
                onOpenChange={(next) => {
                  triggerHaptic(6);
                  setReceiptOpen(next);
                }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                <DisclosureTrigger>
                  <button type="button" className="cp-disclosure-btn" aria-expanded={receiptOpen}>
                    <span>
                      {isJa
                        ? '料金内訳・日本5院平均の根拠を見る'
                        : '상세 요금 내역 · 일본 5곳 평균 근거 보기'}
                    </span>
                    <ChevronDown
                      size={15}
                      strokeWidth={2.3}
                      className={receiptOpen ? 'is-rotated' : ''}
                    />
                  </button>
                </DisclosureTrigger>
                <DisclosureContent>
                  <div className="cp-disclosure-body">
                    <div className="cp-receipt">
                      {bundle.items.map((it) => (
                        <div className="cp-receipt-row" key={it.menu.id}>
                          <span>
                            {isJa ? it.menu.nameJa : it.menu.nameKo}
                            {bundle.visits > 1 ? ` ×${bundle.visits}` : ''}
                          </span>
                          <span className="num">
                            {formatJpy(it.krTotalJpy)} ({formatKrw(it.totalKrw)})
                          </span>
                        </div>
                      ))}
                      {bundle.vatKrw > 0 && (
                        <div className="cp-receipt-row">
                          <span>{copy.receiptVat}</span>
                          <span className="num">+{formatKrw(bundle.vatKrw)}</span>
                        </div>
                      )}
                      <div className="cp-receipt-row">
                        <span>
                          {bundle.items.length > 1
                            ? isJa
                              ? 'ソウル平均合計'
                              : '서울 평균 합계'
                            : isJa
                              ? `ソウル${bundle.seoulSampleCount}院平均`
                              : `서울 ${bundle.seoulSampleCount}곳 평균`}
                        </span>
                        <span className="num">
                          {formatJpy(bundle.seoulAvgJpy)} ({formatKrw(bundle.seoulAvgKrw)})
                        </span>
                      </div>
                      <div className="cp-receipt-row is-strong">
                        <span>{copy.receiptJpBase}</span>
                        <span className="num">
                          {formatJpy(bundle.jpBenchmarkJpy)} ({isJa ? '約' : '약 '}
                          {formatKrw(jpyToKrw(bundle.jpBenchmarkJpy, krwPer100Jpy))})
                        </span>
                      </div>
                      <p className="cp-rate-foot num">{rateNote}</p>
                    </div>

                    <div className="cp-jp-bench">
                      <p className="cp-jp-bench-title">
                        {copy.jpAvgSectionTitle(isJa ? primaryMenu.nameJa : primaryMenu.nameKo)}
                      </p>
                      {primaryMenu.jpBenchmarks.map((c) => (
                        <a
                          key={`${c.nameJa}-${c.url}`}
                          className="cp-jp-bench-row"
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>
                            {isJa ? c.nameJa : c.nameKo}{' '}
                            <ExternalLink size={12} strokeWidth={2.2} />
                          </span>
                          <strong className="num">{formatJpy(c.priceJpy)}</strong>
                        </a>
                      ))}
                    </div>
                  </div>
                </DisclosureContent>
              </Disclosure>
            </section>
          </Tabs.Content>

          {/* TAB 2: AI Radar Chart, Pros/Watchouts & Horizontal Swipe External Reviews */}
          <Tabs.Content value="reviews" className="cp2-tabpanel">
            <section className="cp-card cp2-sec-card" id="clinic-reviews">
              <div className="cp-sec-head">
                <div className="cp2-head-with-info">
                  <h2>{isJa ? 'AI評価バランス' : 'AI 4축 평점 분석'}</h2>
                  <InfoPopover side="bottom" label={isJa ? 'AI採点の根拠5つ' : 'AI 평점 근거 5가지'}>
                    <div className="cp2-popover-reasons">
                      <strong>{isJa ? 'AI採点の根拠 5つ' : 'AI 평점 근거 5가지'}</strong>
                      <ol className="clinic-ai-reasons cp2-popover-list">
                        {aiRating.reasons.map((r) => {
                          const title = (isJa ? r.titleJa : r.titleKo).trim();
                          const body = (isJa ? r.bodyJa : r.bodyKo).trim();
                          return (
                            <li key={r.key}>
                              {title ? (
                                <>
                                  <b>{title}</b>: {body}
                                </>
                              ) : (
                                body
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </InfoPopover>
                </div>
                <a
                  className="cp-mini-link"
                  href={primaryReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{isJa ? '実口コミを見る' : '실후기 검색'}</span>
                  <ExternalLink size={12} strokeWidth={2.3} />
                </a>
              </div>

              <div className="cp2-score-hero-row">
                <div className="cp-ai-score-badge">
                  <Star size={16} strokeWidth={2.2} fill="currentColor" className="cp-ai-star" />
                  <strong className="cp-ai-score num">{aiRating.formatted}</strong>
                  <span className="cp-ai-max num">/ 5.0</span>
                </div>
                <div className="cp2-traits-inline">
                  {brandRev.traits.map((t) => (
                    <TraitChip key={t.id} trait={t} lang={lang} />
                  ))}
                </div>
              </div>

              <AiRadarChart
                axes={aiRating.axes}
                overall={aiRating.formatted}
                isJa={isJa}
              />

              <div className="cp-procon">
                <div className="cp-procon-box is-pro">
                  <h3>
                    <CheckCircle2 size={15} strokeWidth={2.3} />
                    <span>{isJa ? 'よくある良い点' : '자주 꼽는 장점'}</span>
                  </h3>
                  <ul>
                    {(isJa ? brandRev.prosJa : brandRev.prosKo).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>

                <div className="cp-procon-box is-warn">
                  <h3>
                    <AlertTriangle size={15} strokeWidth={2.3} />
                    <span>{isJa ? '来院前の注意点' : '방문 전 참고할 점'}</span>
                  </h3>
                  <ul>
                    {(isJa ? brandRev.watchoutsJa : brandRev.watchoutsKo).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                    {caveat && <li>{caveat}</li>}
                  </ul>
                </div>
              </div>

              {/* Verified Exact-Branch External Reviews (Embla Horizontal Carousel) */}
              <ExternalReviewsCarousel posts={externalPosts} isJa={isJa} />

              {/* External Community Review App Shortcuts */}
              {communityLinks.length > 0 && (
                <div className="cp2-comm-apps">
                  <h3>{isJa ? '外部アプリで最新口コミを検索' : '외부 앱에서 최신 후기 바로 조회'}</h3>
                  <div className="cp2-comm-grid">
                    {communityLinks.map((cl) => (
                      <a
                        key={cl.id}
                        href={cl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cp2-comm-card"
                      >
                        <div className="cp2-comm-top">
                          <strong>{isJa ? cl.labelJa : cl.labelKo}</strong>
                          <ExternalLink size={12} strokeWidth={2.3} />
                        </div>
                        <span>{isJa ? cl.noteJa : cl.noteKo}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </Tabs.Content>

          {/* TAB 3: Location, Direct Booking Channels, Order Sheet & Nearby Comparison Carousel */}
          <Tabs.Content value="visit" className="cp2-tabpanel">
            <section className="cp-card cp2-sec-card" id="clinic-helper">
              <div className="cp-sec-head">
                <h2>{isJa ? 'アクセス・NAVERマップ経路' : '위치 · 네이버지도 길찾기'}</h2>
                <button
                  type="button"
                  className="cp-copy-btn"
                  id="copy-addr-btn"
                  onClick={() => {
                    triggerHaptic(8);
                    const done = () =>
                      onShowToast(
                        isJa ? '韓国語住所をコピーしました' : '한국어 주소를 복사했어요',
                        true
                      );
                    navigator.clipboard?.writeText(place.addressKo).then(done).catch(done);
                  }}
                >
                  <Copy size={13} strokeWidth={2.2} />
                  <span>{isJa ? '住所コピー' : '주소 복사'}</span>
                </button>
              </div>

              <div className="cp2-addr-box">
                <div className="cp2-addr-main">
                  <MapPin size={15} strokeWidth={2.3} />
                  <div>
                    <strong>{station}</strong>
                    <p>{place.addressKo}</p>
                  </div>
                </div>
                {!inKoreaLoc && !hasForeignLoc && (
                  <button
                    type="button"
                    className="cp-loc-btn"
                    id="clinic-locate-btn"
                    disabled={locatingUser}
                    onClick={() => {
                      triggerHaptic(6);
                      onRequestLocation();
                    }}
                  >
                    <LocateFixed size={14} strokeWidth={2.2} />
                    <span>
                      {locatingUser
                        ? isJa
                          ? '現在地を確認中…'
                          : '내 위치 확인 중…'
                        : isJa
                          ? '現在地からの距離を見る'
                          : '내 위치에서 거리 보기'}
                    </span>
                  </button>
                )}
              </div>

              <a
                className="cp-action-btn is-primary cp2-nav-full"
                href={buildTransitUrl('current', place, userLocation, lang)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleTransitClick(e, 'current')}
              >
                <Navigation size={15} strokeWidth={2.2} />
                <span>{isJa ? '現在地からNAVERマップ経路' : '현재 위치에서 네이버지도 길찾기'}</span>
              </a>

              {/* Official Booking Channels */}
              {bookingChannels.items.length > 0 && (
                <div className="cp2-booking-block">
                  <div className="cp-sec-head">
                    <h3>{isJa ? '公式SNS・今すぐ予約チャンネル' : '바로 예약 · 공식 SNS 채널'}</h3>
                  </div>
                  <div className="clinic-channels-grid">
                    {bookingChannels.items.map((ch) => (
                      <a
                        key={`${ch.kind}-${ch.url}`}
                        className={`channel-btn is-${ch.kind}`}
                        href={ch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="channel-tag">{channelBadgeText(ch.kind, isJa)}</span>
                        <span className="channel-lbl">
                          {isJa ? ch.labelJa : ch.labelKo}
                          {ch.handleText ? <em> {ch.handleText}</em> : null}
                        </span>
                        <ExternalLink size={13} strokeWidth={2.2} />
                      </a>
                    ))}
                  </div>
                  {bookingChannels.isCentralChannel && (
                    <p className="clinic-channel-note">
                      {isJa
                        ? '※ 公式共通窓口から希望の店舗を指定して予約できます'
                        : '※ 공식 통합 예약 채널에서 원하시는 지점을 선택해 바로 예약할 수 있어요'}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                className="cp2-ordersheet-launch"
                onClick={() => {
                  triggerHaptic(8);
                  setBookingOpen(true);
                }}
              >
                <MessageSquareText size={16} strokeWidth={2.2} />
                <span>
                  {isJa
                    ? '受付で見せる韓国語オーダーシートを開く'
                    : '병원 접수용 한국어 오더시트 열기'}
                </span>
              </button>

              {/* Nearby Clinics Horizontal Swipe Carousel */}
              <NearbyClinicsCarousel
                items={nearby}
                currentUnitJpy={primaryUnitJpy}
                primaryMenu={primaryMenu}
                includeVat={includeVat}
                vatRate={dataset.meta.vatRate}
                krwPer100Jpy={krwPer100Jpy}
                lang={lang}
                onSelectClinic={onSelectClinic}
              />

              {/* Full Safety Audit Box */}
              {fullSafetyHtml && (
                <div className="cp2-safety-full">
                  <div className="cp2-safety-full-head">
                    <ShieldAlert size={15} strokeWidth={2.2} />
                    <span>{isJa ? '安全性・規約チェック' : '사전 확인 · 약관 투명성'}</span>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: fullSafetyHtml }} />
                </div>
              )}
            </section>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Floating Sticky Bottom Action Bar */}
      <div className="cp2-bottom-cta" role="region" aria-label={isJa ? '予約アクション' : '예약 바로가기'}>
        <button
          type="button"
          className={`cp2-cta-save ${isSaved ? 'is-saved' : ''}`}
          aria-pressed={isSaved}
          aria-label={isJa ? (isSaved ? '保存済み' : '保存する') : isSaved ? '저장됨' : '저장하기'}
          onClick={handleToggleSave}
        >
          <Bookmark size={18} strokeWidth={2.3} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          className="cp2-cta-book"
          id="clinic-booking-cta"
          onClick={() => {
            triggerHaptic(8);
            setBookingOpen(true);
          }}
        >
          <CalendarCheck size={17} strokeWidth={2.3} />
          <span className="num">
            {isJa
              ? `${formatJpy(bundle.krTotalJpy)} · 今すぐ予約・韓国語メモ`
              : `${formatJpy(bundle.krTotalJpy)} · 바로 예약 · 오더시트`}
          </span>
        </button>
      </div>

      {/* Vaul Booking & Korean Order Sheet Drawer */}
      <ClinicBookingSheet
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        place={place}
        bundle={bundle}
        lang={lang}
        includeVat={includeVat}
        userLocation={userLocation}
        onTransitClick={(e) => handleTransitClick(e, 'current')}
        onShowToast={(msg, ok) => onShowToast(msg, ok)}
      />
    </article>
  );
}
