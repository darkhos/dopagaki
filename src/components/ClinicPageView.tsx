import { useEffect, useRef, useState } from 'react';
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
  TREATMENT_EFFECTS,
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
import {
  animateScoreRings,
  renderEffectBulletHtml,
  renderScoreGaugesHtml
} from '@/lib/score-rings.ts';
import { triggerHaptic } from '@/lib/fluid.ts';
import { animateTransitionPanel } from '@/lib/motion-primitives.ts';
import { buildPrimaryReviewUrl, getBrandReview } from '@/data/brand-reviews.ts';
import { getClinicAiRating } from '@/lib/ai-rating.ts';
import {
  renderBookingChannelsSectionHtml,
  renderCommunityReviewLinksHtml,
  renderFullSafetyAuditBoxHtml,
  renderHeroSafetyBannerHtml
} from '@/lib/clinic-trust-ui.ts';
import { getOfficialMenuProof } from '@/data/official-proofs.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';
import { TraitChip, formatCompactKrw } from '@/components/Modals.tsx';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background.tsx';
import { YenFlow } from '@/components/ui/number-flow.tsx';
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger
} from '@/components/motion-primitives/disclosure.tsx';
import { BorderBeam } from '@/components/ui/border-beam.tsx';
import Magnet from '@/components/Magnet.tsx';

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
  onShowToast: (message: string, isOk?: boolean) => void;
  onRequestLocation: () => void;
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
  onRequestLocation
}: ClinicPageViewProps) {
  const containerRef = useRef<HTMLElement>(null);
  const reviewsRef = useRef<HTMLElement>(null);
  const helperRef = useRef<HTMLElement>(null);
  const proofStageRef = useRef<HTMLAnchorElement>(null);

  const offeredMenus = dataset.menus.filter((m) => Boolean(place.prices[m.id]));
  const offeredMenuIds = offeredMenus.map((m) => m.id);

  const [activeProofMenuId, setActiveProofMenuId] = useState<string>(
    () =>
      selectedMenus.find((id) => getOfficialMenuProof(place, id, lang).imageFile !== null) ??
      selectedMenus[0] ??
      offeredMenuIds[0] ??
      dataset.menus[0].id
  );
  const [savedIds, setSavedIds] = useState<string[]>(() => loadSavedClinicIds());
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const lastScoreRingKeyRef = useRef('');
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
    setSourcesOpen(false);
    lastScoreRingKeyRef.current = '';
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

  const bundle = computeClinicBundle(
    place,
    dataset.menus,
    selectedMenus,
    visits,
    includeVat,
    krwPer100Jpy,
    dataset.meta.vatRate,
    dataset.places
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
  const nearby = findNearbyClinics(dataset, place, primaryMenu.id, 3);
  const primaryReviewUrl = buildPrimaryReviewUrl(place, lang);
  const appBasePath = detectAppBasePath(window.location.pathname);
  const hasAnyBranchShot = offeredMenus.some(
    (m) => getOfficialMenuProof(place, m.id, lang).imageFile !== null
  );

  const brandRev = getBrandReview(place);
  const aiRating = getClinicAiRating(place, dataset.places);
  const bank = isJa ? naverFx.bankJa : naverFx.bankKo;
  const rateNote = copy.receiptRateNote(formatRate(krwPer100Jpy), naverFx.dateLabel, bank);
  const savingsBannerText =
    bundle.savingsJpy >= 0
      ? isJa
        ? `日本5院平均(${formatJpy(bundle.jpBenchmarkJpy)})より ${formatJpy(bundle.savingsJpy)} おトク (${bundle.savingsPct}% OFF)`
        : `일본 5곳 평균(${formatJpy(bundle.jpBenchmarkJpy)}) 대비 ${formatJpy(bundle.savingsJpy)} 절약 (${bundle.savingsPct}% 저렴)`
      : isJa
        ? `日本5院平均より +${formatJpy(Math.abs(bundle.savingsJpy))}`
        : `일본 5곳 평균보다 +${formatJpy(Math.abs(bundle.savingsJpy))}`;

  const seoulBanner = formatSeoulDiffBanner(
    bundle.seoulAvgJpy,
    bundle.seoulDiffJpy,
    bundle.seoulDiffPct,
    lang,
    bundle.seoulSampleCount,
    bundle.items.length > 1
  );

  const scoreRingKey = `${place.id}|${selectedMenus.join(',')}|${lang}`;
  const shouldAnimateRings = scoreRingKey !== lastScoreRingKeyRef.current;

  useEffect(() => {
    if (!containerRef.current) return;
    lastScoreRingKeyRef.current = scoreRingKey;
    animateScoreRings(containerRef.current, { skipAnimation: !shouldAnimateRings });
  }, [scoreRingKey, shouldAnimateRings]);

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

  const transitPresets: Array<{ id: TransitOriginPreset; ko: string; ja: string }> = [
    { id: 'current', ko: '지금 내 위치에서', ja: '現在地から' },
    { id: 'incheon', ko: '인천공항에서', ja: '仁川空港から' },
    { id: 'gimpo', ko: '김포공항에서', ja: '金浦空港から' },
    { id: 'seoul-station', ko: '서울역에서', ja: 'ソウル駅から' }
  ];

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

  const heroSafetyHtml = renderHeroSafetyBannerHtml(place, lang);
  const fullSafetyHtml = renderFullSafetyAuditBoxHtml(place, lang);
  const bookingChannelsHtml = renderBookingChannelsSectionHtml(place.id, lang);
  const communityLinksHtml = renderCommunityReviewLinksHtml(place, lang);

  return (
    <article className="clinic-page" ref={containerRef}>
      <div className="clinic-topbar">
        <button
          type="button"
          className="clinic-back-btn"
          id="clinic-back-btn"
          onClick={() => {
            triggerHaptic(6);
            onBack();
          }}
        >
          <SvgIcon name="arrowLeft" />
          <span>{isJa ? '相場一覧へ戻る' : '시세판으로 돌아가기'}</span>
        </button>

        <div className="clinic-top-actions">
          <button
            type="button"
            className={`clinic-save-btn ${isSaved ? 'is-saved' : ''}`}
            id="clinic-save-btn"
            aria-pressed={isSaved}
            onClick={() => {
              triggerHaptic(8);
              const res = toggleSavedClinicId(place.id);
              setSavedIds(loadSavedClinicIds());
              onShowToast(
                isJa
                  ? res.saved
                    ? 'このクリニックを保存しました'
                    : '保存を解除しました'
                  : res.saved
                    ? '이 병원을 저장했어요'
                    : '저장을 해제했어요',
                true
              );
            }}
          >
            <SvgIcon name={isSaved ? 'bookmarkFilled' : 'bookmark'} />
            <span>
              {isJa ? (isSaved ? '保存済み' : '保存') : isSaved ? '저장됨' : '저장'}
            </span>
          </button>

          <Magnet padding={40} magnetStrength={5} maxOffset={4}>
            <button
              type="button"
              className="clinic-share-btn"
              id="clinic-share-btn"
              onClick={() => {
                triggerHaptic(6);
                onOpenShare();
              }}
            >
              <SvgIcon name="share" />
              <span>{copy.shareBtn}</span>
            </button>
          </Magnet>
        </div>
      </div>

      <header className="clinic-hero">
        <div className="clinic-hero-top">
          <div className="clinic-hero-main">
            <div className="clinic-badges">
              <span className="clinic-area-pill">{areaLabel}</span>
              <span className={`ai-pill is-${aiRating.grade} num`}>
                <SvgIcon name="star" />
                <span>
                  {isJa
                    ? `AI評価 ${aiRating.formatted} / 5.0`
                    : `AI 평점 ${aiRating.formatted} / 5.0`}
                </span>
              </span>
              {place.japaneseSupport && (
                <span className="tg-jp-badge">
                  <span className="tg-jp-code">JP</span>
                  <span className="tg-jp-lbl">{copy.jpSupportTag}</span>
                </span>
              )}
              <span className="tg tg-of">{officialTag}</span>
            </div>

            <div className="clinic-title-row">
              <h1 className="clinic-title">{name}</h1>
              <button
                type="button"
                className="clinic-copy-addr-mini"
                id="copy-addr-btn"
                title={place.addressKo}
                aria-label={
                  isJa
                    ? `韓国語住所をコピー (${place.addressKo})`
                    : `주소 복사 (${place.addressKo})`
                }
                onClick={() => {
                  triggerHaptic(8);
                  const done = () =>
                    onShowToast(isJa ? '韓国語住所をコピーしました' : '한국어 주소를 복사했어요', true);
                  navigator.clipboard?.writeText(place.addressKo).then(done).catch(done);
                }}
              >
                <SvgIcon name="copy" />
                <span>{isJa ? '住所コピー' : '주소 복사'}</span>
              </button>
            </div>

            <p className="clinic-sub">
              {distLabel ? `${subName} · ${station} (${distLabel})` : `${subName} · ${station}`}
              {!distLabel && !hasForeignLoc && (
                <>
                  {' '}
                  <button
                    type="button"
                    className="loc-chip-btn"
                    id="clinic-locate-btn"
                    disabled={locatingUser}
                    onClick={() => {
                      triggerHaptic(6);
                      onRequestLocation();
                    }}
                  >
                    <SvgIcon name="locate" />
                    <span>
                      {locatingUser
                        ? isJa
                          ? '現在地を確認中…'
                          : '현재 위치 확인 중…'
                        : isJa
                          ? '現在地からの距離を見る'
                          : '현재 위치에서 거리 보기'}
                    </span>
                  </button>
                </>
              )}
            </p>
          </div>

          <div
            className="clinic-hero-transit"
            aria-label={isJa ? 'NAVERマップ乗換案内' : '네이버지도 대중교통 길찾기'}
          >
            <span className="clinic-hero-transit-title">
              <SvgIcon name="navigation" />
              <span>{isJa ? '行き方 · NAVERマップ' : '찾아가기 · 네이버지도'}</span>
            </span>
            <div className="clinic-hero-transit-grid">
              {transitPresets.map((tp) => (
                <a
                  key={tp.id}
                  className="clinic-hero-transit-btn"
                  href={buildTransitUrl(tp.id, place, userLocation, lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleTransitClick(e, tp.id)}
                >
                  <span>{isJa ? tp.ja : tp.ko}</span>
                </a>
              ))}
            </div>
            {isJa && (
              <p className="clinic-hero-transit-note">
                ※ スマホ版NAVERマップアプリ（日本語設定）で開くと日本語で案内されます
              </p>
            )}
          </div>
        </div>

        {heroSafetyHtml && <div dangerouslySetInnerHTML={{ __html: heroSafetyHtml }} />}

        <div className="clinic-hero-char">
          <div className="clinic-hero-char-head">
            <span className={`char-vibe ${brandRev.reviewScope === 'branch' ? 'is-branch' : ''}`}>
              {isJa ? brandRev.vibeJa : brandRev.vibeKo}
            </span>
            <div className="clinic-hero-char-actions">
              <button
                type="button"
                className="clinic-jump-rev-btn"
                id="clinic-jump-reviews"
                onClick={() => {
                  triggerHaptic(6);
                  reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <span>{isJa ? 'AI評価 ↓' : 'AI 분석 ↓'}</span>
              </button>
              <a
                className="clinic-direct-rev-btn"
                href={primaryReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SvgIcon name="external" />
                <span>{isJa ? '実口コミをすぐ見る' : '실후기 바로 보기'}</span>
              </a>
            </div>
          </div>

          <div className="clinic-hero-traits">
            {brandRev.traits.map((t) => (
              <TraitChip key={t.id} trait={t} lang={lang} />
            ))}
          </div>
          {brandRev.reviewScope === 'branch' && brandRev.verificationTier !== 'limited' && (
            <p className="clinic-hero-summary">
              {isJa ? brandRev.shortTagJa : brandRev.shortTagKo}
            </p>
          )}
        </div>
      </header>

      <section
        className="clinic-card clinic-calc"
        id="clinic-calc"
        aria-label={isJa ? '料金シミュレーション' : '시술 조합 가격 계산기'}
      >
        <div className="clinic-sec-head">
          <h2>{isJa ? '施術を選んで合計を計算' : '시술 골라 합계 계산'}</h2>
          {offeredMenus.length > 1 && (
            <button
              type="button"
              className="clinic-all-btn"
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
                  : `全${offeredMenus.length}施術まとめて`
                : allSelected
                  ? '1개만 보기'
                  : `${offeredMenus.length}종 전부 선택`}
            </button>
          )}
        </div>

        <div className="clinic-menu-grid" role="group" aria-label={isJa ? '施術選択' : '시술 선택'}>
          {offeredMenus.map((m) => {
            const offer = place.prices[m.id]!;
            const applyVat = includeVat && place.vatExcluded && m.vatAppliesInKorea;
            const unitTotalKrw =
              offer.krw + (applyVat ? Math.round(offer.krw * dataset.meta.vatRate) : 0);
            const unitJpy = krwToJpy(unitTotalKrw, krwPer100Jpy);
            const active = selectedMenus.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                className="clinic-menu-chip"
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
                    if (
                      getOfficialMenuProof(place, m.id, lang).imageFile !== null &&
                      getOfficialMenuProof(place, resolvedProofMenuId, lang).imageFile === null
                    ) {
                      setActiveProofMenuId(m.id);
                    }
                  }
                }}
              >
                <span className="clinic-menu-name">{isJa ? m.shortJa : m.shortKo}</span>
                <strong className="clinic-menu-price num">{formatJpy(unitJpy)}</strong>
              </button>
            );
          })}
        </div>

        <div className="clinic-calc-opts">
          <div className="clinic-stepper">
            <span className="clinic-opt-label">{isJa ? '回数' : '횟수'}</span>
            <div className="stepper-box">
              <button
                type="button"
                className="stepper-btn"
                disabled={visits <= 1}
                aria-label={isJa ? '回数を減らす' : '횟수 줄이기'}
                onClick={() => {
                  triggerHaptic(6);
                  onChangeVisits(Math.max(1, visits - 1));
                }}
              >
                −
              </button>
              <span className="stepper-val num">
                {visits}
                {isJa ? '回' : '회'}
              </span>
              <button
                type="button"
                className="stepper-btn"
                disabled={visits >= 6}
                aria-label={isJa ? '回数を増やす' : '횟수 늘리기'}
                onClick={() => {
                  triggerHaptic(6);
                  onChangeVisits(Math.min(6, visits + 1));
                }}
              >
                +
              </button>
            </div>
            <span className="clinic-stepper-caution">
              {isJa
                ? '※ 初回体験価格の場合あり（ご注意ください）'
                : '※ 1회 체험가일 수 있으니 주의하세요'}
            </span>
          </div>

          <label className="chk-label">
            <input
              type="checkbox"
              id="clinic-vat-chk"
              checked={includeVat}
              onChange={(e) => {
                triggerHaptic(6);
                onToggleVat(e.target.checked);
              }}
            />
            <span>{isJa ? '2026年 税金+10%込み' : '2026 부가세 +10% 포함'}</span>
          </label>
        </div>

        <div className="clinic-total-panel">
          <div className="clinic-total-main">
            <strong className="clinic-total-jpy num">
              <YenFlow value={bundle.krTotalJpy} />
            </strong>
            <span className="clinic-total-krw num">
              {isJa
                ? `${formatKrw(bundle.totalKrw)}${includeVat ? ' (税込10%)' : ''}`
                : `${formatCompactKrw(bundle.totalKrw, lang)} · ${formatKrw(bundle.totalKrw)}`}
            </span>
          </div>
          <div className={`clinic-savings-strip num ${bundle.savingsJpy < 0 ? 'is-over' : ''}`}>
            {savingsBannerText}
          </div>
          <div className={`clinic-seoul-strip num is-${seoulBanner.tone}`}>{seoulBanner.text}</div>
        </div>

        <div className="receipt-box">
          {bundle.items.map((it) => (
            <div className="receipt-line" key={it.menu.id}>
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
            <div className="receipt-line">
              <span>{copy.receiptVat}</span>
              <span className="num">+{formatKrw(bundle.vatKrw)}</span>
            </div>
          )}
          <div className="receipt-line">
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
          <div className="receipt-line is-strong">
            <span>{copy.receiptJpBase}</span>
            <span className="num">
              {formatJpy(bundle.jpBenchmarkJpy)} ({isJa ? '約' : '약 '}
              {formatKrw(jpyToKrw(bundle.jpBenchmarkJpy, krwPer100Jpy))})
            </span>
          </div>
          <div className="receipt-rate-foot num">{rateNote}</div>
        </div>

        {bundle.items.some((it) => TREATMENT_EFFECTS[it.menu.id]) && (
          <div className="clinic-dt-box">
            <div className="clinic-dt-title">
              {isJa
                ? '選んだ施術の効果・回復の目安・メイク案内'
                : '선택한 시술의 효과 · 회복 기간 · 화장 안내'}
            </div>
            {bundle.items.map((it) => {
              const eff = TREATMENT_EFFECTS[it.menu.id];
              if (!eff) return null;
              const effBullets = (isJa ? eff.effectsJa : eff.effectsKo)
                .map((line) => renderEffectBulletHtml(line))
                .join('');
              const gaugesHtml = renderScoreGaugesHtml(eff, isJa, 'sm', !shouldAnimateRings);
              const badgeShort = isJa
                ? eff.recoveryHintJa.split('・')[0]
                : eff.recoveryHintKo.split(' · ')[0];
              return (
                <div className="clinic-dt-row" key={it.menu.id}>
                  <div className="clinic-dt-head">
                    <strong>{isJa ? it.menu.shortJa : it.menu.shortKo}</strong>
                    <span className="tg tg-jp">{badgeShort}</span>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: gaugesHtml }} />
                  <p className="clinic-eff-headline">{isJa ? eff.headlineJa : eff.headlineKo}</p>
                  <ul className="clinic-eff-list" dangerouslySetInnerHTML={{ __html: effBullets }} />
                  <div className="clinic-eff-meta">
                    <p className="clinic-eff-timing">
                      <strong>{isJa ? '効果・持続' : '효과·유지'}</strong> ·{' '}
                      {isJa ? eff.timingJa : eff.timingKo}
                    </p>
                  </div>
                  <p className="clinic-dt-desc">{isJa ? eff.noteJa : eff.noteKo}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section
        className="clinic-card clinic-proof relative overflow-hidden"
        id="clinic-official-proof"
        aria-label={
          isJa
            ? '公式ホームページの実際料金表スクリーンショット'
            : '공식 홈페이지 실제 가격표 스크린샷'
        }
      >
        <BorderBeam
          size={120}
          duration={10}
          borderWidth={2}
          colorFrom="var(--color-accent)"
          colorTo="var(--color-ink)"
        />
        <div className="clinic-sec-head">
          <h2>
            {hasAnyBranchShot
              ? isJa
                ? '公式サイトの実際料金表スクショ'
                : '공식 홈페이지 실제 가격표 캡처'
              : isJa
                ? '公式サイトで院別料金を確認'
                : '공식 홈페이지 지점 가격표 확인'}
          </h2>
          <span className="clinic-proof-date num">
            {isJa ? `${activeProof.capturedDate} 確認` : `${activeProof.capturedDate} 확인`}
          </span>
        </div>

        {offeredMenus.length > 1 && (
          <div
            className="clinic-proof-tabs has-mp-bg"
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
              className="mp-ink-pill rounded-[2px]"
              transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
            >
              {offeredMenus.map((menu) => {
                const p = getOfficialMenuProof(place, menu.id, lang);
                const selected = menu.id === proofMenu.id;
                return (
                  <button
                    key={menu.id}
                    type="button"
                    role="tab"
                    data-id={menu.id}
                    className="clinic-proof-tab"
                    aria-selected={selected}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span>{isJa ? menu.shortJa : menu.shortKo}</span>
                      {p.imageFile && <SvgIcon name="check" />}
                    </span>
                  </button>
                );
              })}
            </AnimatedBackground>
          </div>
        )}

        <p className="clinic-proof-lead">
          {activeProof.imageFile && activeProof.verifiedKrw !== null
            ? isJa
              ? `${proofMenuLabel}の公式掲載価格（${formatKrw(activeProof.verifiedKrw)}・${place.vatExcluded ? '税込前の基本料金' : '税込表示の基本料金'}）部分を日本語に翻訳したスクリーンショットです。画像をタップすると${activeProof.isJaSite ? '日本語公式サイト' : '公式サイト'}へ直接移動します。`
              : `우리 사이트에 표시된 ${proofMenuLabel} 공식가(${formatKrw(activeProof.verifiedKrw)} · ${place.vatExcluded ? '부가세 별도 기준' : '부가세 포함 기준'})가 실제로 적힌 공식 홈페이지 화면입니다. 사진을 클릭하면 해당 페이지로 바로 이동해요.`
            : isJa
              ? `${proofMenuLabel}（公式 ${activeListedKrw !== null ? formatKrw(activeListedKrw) : ''}）の${activeProof.isJaSite ? '日本語公式サイト' : '公式サイト'}へ直接つながるリンクです。クリックして実際の料金表をご確認ください。`
              : `현재 선택한 ${proofMenuLabel}${activeListedKrw !== null ? ` 공식가(${formatKrw(activeListedKrw)})` : ''}를 공식 홈페이지에서 직접 확인하실 수 있도록 직결 링크를 제공합니다.`}
        </p>

        {activeProof.imageFile && activeProof.verifiedKrw !== null ? (
          <a
            ref={proofStageRef}
            className="clinic-proof-shot"
            href={activeProof.priceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="clinic-proof-bar">
              <span className="clinic-proof-badge">
                <SvgIcon name="check" />
                <span>
                  {isJa
                    ? `${proofMenuLabel} · 公式 ${formatKrw(activeProof.verifiedKrw)} 一致`
                    : `${proofMenuLabel} · 공식가 ${formatKrw(activeProof.verifiedKrw)} 일치`}
                </span>
              </span>
              <span className="clinic-proof-domain">{activeProof.domainLabel}</span>
            </span>
            <span className="clinic-proof-frame">
              <img
                className="clinic-proof-img"
                src={`${appBasePath}${isJa && activeProof.imageFileJa ? 'official-proofs-ja' : 'official-proofs'}/${isJa && activeProof.imageFileJa ? activeProof.imageFileJa : activeProof.imageFile}`}
                alt={
                  isJa
                    ? `${name} ${proofMenuLabel} 日本語翻訳 公式サイト料金表 ${formatKrw(activeProof.verifiedKrw)} スクリーンショット`
                    : `${name} ${proofMenuLabel} 공식가 ${formatKrw(activeProof.verifiedKrw)} 실제 홈페이지 스크린샷`
                }
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="clinic-proof-cta">
              <SvgIcon name="external" />
              <span>
                {isJa
                  ? activeProof.isJaSite
                    ? `タップして日本語公式サイト（公式 ${formatKrw(activeProof.verifiedKrw)}）を開く`
                    : `タップして公式 ${formatKrw(activeProof.verifiedKrw)} の掲載ページを開く`
                  : `사진 클릭 시 ${formatKrw(activeProof.verifiedKrw)} 공식 가격 페이지 바로 열기`}
              </span>
            </span>
          </a>
        ) : (
          <a
            ref={proofStageRef}
            className="clinic-proof-fallback"
            href={activeProof.priceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="clinic-proof-bar">
              <span className="clinic-proof-badge">
                <SvgIcon name="check" />
                <span>
                  {isJa ? `${proofMenuLabel} · 公式直接リンク` : `${proofMenuLabel} · 공식가 직결`}
                </span>
              </span>
              <span className="clinic-proof-domain">{activeProof.domainLabel}</span>
            </div>
            <p className="clinic-proof-fallback-note">
              {isJa
                ? `他院のスクショは一切流用せず、${name}公式ページで100%一致確認済みの料金表のみ掲載しています。${proofMenuLabel}の最新公式料金は下の公式ページで直接ご確認いただけます。`
                : `다른 지점 화면은 절대 혼용하지 않고, ${name} 공식 페이지에서 100% 일치 확인된 가격표만 캡처로 제공합니다. ${proofMenuLabel} 최신 공식 가격은 아래 지점 공식 홈페이지에서 바로 확인하세요.`}
            </p>
            <span className="clinic-proof-cta">
              <SvgIcon name="external" />
              <span>
                {isJa
                  ? activeProof.isJaSite
                    ? '日本語公式サイトを直接開く'
                    : '公式料金ページを直接開く'
                  : '공식 홈페이지 가격표 바로 열기'}
              </span>
            </span>
          </a>
        )}
      </section>

      <section
        className="clinic-card clinic-checks"
        aria-label={isJa ? 'クリニックの特徴と注意点' : '병원 특징 및 주의사항'}
      >
        <h2>{isJa ? '来院前チェック' : '방문 전 체크리스트'}</h2>
        <ul className="clinic-check-list">
          <li>
            <span className={`clinic-check-mark ${place.japaneseSupport ? 'is-yes' : 'is-warn'}`}>
              <SvgIcon name={place.japaneseSupport ? 'check' : 'info'} />
            </span>
            <div>
              <strong>
                {isJa
                  ? place.japaneseSupport
                    ? '日本語対応あり'
                    : '韓国語基本（公式予約チャンネルを確認）'
                  : place.japaneseSupport
                    ? '일본어 상담 가능'
                    : '한국어 기본 (아래 공식 채널에서 미리 확인 추천)'}
              </strong>
              <p>
                {isJa
                  ? place.japaneseSupport
                    ? '公式サイト・予約窓口で日本語サポートを確認済み'
                    : '下の公式LINE・カカオ・予約リンクから相談できます'
                  : place.japaneseSupport
                    ? '공식 홈페이지·창구 기준 일본어 지원 지점'
                    : '아래 공식 카카오톡·네이버 예약 링크로 미리 문의하면 편해요'}
              </p>
            </div>
          </li>
          <li>
            <span className="clinic-check-mark is-yes">
              <SvgIcon name="check" />
            </span>
            <div>
              <strong>
                {isJa
                  ? `公式ホームページ公開価格（${officialTag}）`
                  : `공식 홈페이지 공개가 (${officialTag})`}
              </strong>
              <p>{bundle.items[0] ? (isJa ? bundle.items[0].noteJa : bundle.items[0].noteKo) : caveat}</p>
            </div>
          </li>
          <li>
            <span className="clinic-check-mark is-yes">
              <SvgIcon name="check" />
            </span>
            <div>
              <strong>
                {isJa ? '2026年タックスリファンド終了対応' : '2026년 세금 환급 종료 반영'}
              </strong>
              <p>
                {isJa
                  ? '表示の韓国価格に最初から税金10%を加算して日本5院平均と比較しています'
                  : '홈페이지 표시가에 부가세 10%를 미리 더해 일본 5곳 평균과 비교했어요'}
              </p>
            </div>
          </li>
          <li>
            <span className="clinic-check-mark is-yes">
              <SvgIcon name="check" />
            </span>
            <div>
              <strong>{station}</strong>
              <p>{distLabel ? `${distLabel} · ${place.addressKo}` : place.addressKo}</p>
            </div>
          </li>
        </ul>

        <div className="clinic-caveat-note">
          <strong>{copy.caveatLabel}:</strong> {caveat}
        </div>
        <div dangerouslySetInnerHTML={{ __html: fullSafetyHtml }} />
      </section>

      <section
        className="clinic-card clinic-reviews"
        id="clinic-reviews"
        ref={reviewsRef}
        aria-label={isJa ? '公開口コミ傾向と店舗別リアルレポ' : '공개 리뷰 경향 및 지점 실후기'}
      >
        <div className="clinic-sec-head">
          <h2>{isJa ? '公開口コミ傾向 & 店舗別レポ' : '공개 리뷰 경향 & 지점 실후기'}</h2>
          <div className="clinic-rev-badges">
            <span
              className={`tg ${brandRev.reviewScope === 'branch' && brandRev.verificationTier !== 'limited' ? 'tg-jp' : 'tg-of'}`}
            >
              {isJa ? brandRev.scopeLabelJa : brandRev.scopeLabelKo}
            </span>
            <span
              className={`tg ${brandRev.verificationTier === 'jp_kr_verified' ? 'tg-jp' : 'tg-of'}`}
            >
              {isJa ? brandRev.tierLabelJa : brandRev.tierLabelKo}
            </span>
            <span className="tg tg-of">{isJa ? brandRev.vibeJa : brandRev.vibeKo}</span>
          </div>
        </div>

        {(isJa ? brandRev.branchNoticeJa : brandRev.branchNoticeKo) && (
          <p className="clinic-rev-notice">
            {isJa ? brandRev.branchNoticeJa : brandRev.branchNoticeKo}
          </p>
        )}

        <div className="clinic-ai-box" id="clinic-ai-box">
          <div className="clinic-ai-top">
            <div className="clinic-ai-score-col">
              <span className="clinic-ai-kicker">
                {isJa ? 'AI口コミ分析スコア' : 'AI 리뷰 분석 평점'}
              </span>
              <div className="clinic-ai-score-line num">
                <span className="clinic-ai-star">
                  <SvgIcon name="star" />
                </span>
                <strong className="clinic-ai-num">{aiRating.formatted}</strong>
                <span className="clinic-ai-max">/ 5.0</span>
              </div>
              <span className="clinic-ai-scope">
                {aiRating.verificationTier === 'limited'
                  ? isJa
                    ? '標本少数・参考値'
                    : '표본 적음 · 참고용'
                  : aiRating.reviewScope === 'branch'
                    ? isJa
                      ? '店舗別レポ分析'
                      : '지점 실후기 분석'
                    : isJa
                      ? 'ブランド傾向推定'
                      : '브랜드 리뷰 추정'}
              </span>
            </div>

            <div className="clinic-ai-axes">
              {aiRating.axes.map((ax) => {
                const pct = Math.max(0, Math.min(100, Math.round((ax.score / 5) * 100)));
                return (
                  <div className="clinic-ai-axis" key={ax.id}>
                    <div className="clinic-ai-axis-row">
                      <span className="clinic-ai-axis-lbl">
                        {isJa ? ax.labelJa : ax.labelKo}
                      </span>
                      <strong className="clinic-ai-axis-val num">{ax.score.toFixed(1)}</strong>
                    </div>
                    <div className="clinic-ai-bar" aria-hidden="true">
                      <span className="clinic-ai-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="clinic-ai-reasons-wrap">
            <p className="clinic-ai-reasons-kicker">
              {isJa
                ? 'AIスコア算出の詳細根拠（公開口コミ・公式価格分析）'
                : '이 평점으로 산정한 실제 후기 · 공식가 근거 5가지'}
            </p>
            <ol className="clinic-ai-reasons">
              {aiRating.reasons.map((reason) => (
                <li className={`clinic-ai-reason-item is-${reason.key}`} key={reason.key}>
                  <span className="clinic-ai-reason-tag">
                    {isJa ? reason.titleJa : reason.titleKo}
                  </span>
                  <span className="clinic-ai-reason-text">
                    {isJa ? reason.bodyJa : reason.bodyKo}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="clinic-rev-grid">
          <div className="clinic-rev-col">
            <h3 className="clinic-rev-heading">
              <span className="clinic-rev-icon is-pro">
                <SvgIcon name="check" />
              </span>
              <span>
                {brandRev.verificationTier === 'limited'
                  ? isJa
                    ? '公式案内・確認済みメモ'
                    : '공식 안내 기준 확인 사항'
                  : isJa
                    ? '公開口コミで多い評価'
                    : '공개 후기에서 자주 꼽는 장점'}
              </span>
            </h3>
            <ul className="clinic-rev-list">
              {(isJa ? brandRev.prosJa : brandRev.prosKo).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="clinic-rev-col clinic-rev-col--warn">
            <h3 className="clinic-rev-heading">
              <span className="clinic-rev-icon is-warn">
                <SvgIcon name="alert" />
              </span>
              <span>
                {brandRev.verificationTier === 'limited'
                  ? isJa
                    ? '来院前に直接確認すべき点'
                    : '방문 전 직접 확인할 점'
                  : isJa
                    ? '来院前のリアルな注意点'
                    : '방문 전 참고할 솔직한 주의점'}
              </span>
            </h3>
            <ul className="clinic-rev-list">
              {(isJa ? brandRev.watchoutsJa : brandRev.watchoutsKo).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="clinic-rev-ext">
          <div dangerouslySetInnerHTML={{ __html: communityLinksHtml }} />
          <p className="clinic-rev-source">
            {brandRev.verificationTier === 'limited'
              ? `※ ${isJa ? brandRev.sourcesLabelJa : brandRev.sourcesLabelKo}`
              : brandRev.reviewScope === 'branch'
                ? isJa
                  ? `※ ${brandRev.sourcesLabelJa}（${name}の店舗別公開口コミ傾向を反映。最新原文は上の口コミアプリ・外部レビューでご確認ください）`
                  : `※ ${brandRev.sourcesLabelKo} (${name} 지점별 공개 후기를 반영했으며, 최신 원문 리뷰는 위 후기 앱 · 외부 후기에서 바로 확인하세요)`
                : isJa
                  ? `※ ${brandRev.sourcesLabelJa}（この店舗はブランド傾向参考表示です。店舗ごとの最新原文は上の口コミアプリ・外部レビューでご確認ください）`
                  : `※ ${brandRev.sourcesLabelKo} (이 지점은 브랜드 경향 참고 표시이며, 지점별 실제 원문 리뷰는 위 후기 앱 · 외부 후기에서 바로 확인하세요)`}
          </p>
        </div>
      </section>

      <section
        className="clinic-card clinic-helper clinic-channels-card"
        id="clinic-helper"
        ref={helperRef}
        aria-label={isJa ? '公式SNS・今すぐ予約チャンネル' : '바로 예약 · 공식 SNS 채널'}
        dangerouslySetInnerHTML={{ __html: bookingChannelsHtml }}
      />

      {nearby.length > 0 && (
        <section
          className="clinic-card clinic-nearby"
          aria-label={isJa ? '近くのクリニック比較' : '주변 피부과 비교'}
        >
          <h2>
            {isJa
              ? `この近くで比べる（${primaryMenu.shortJa}）`
              : `근처 피부과 바로 비교 (${primaryMenu.shortKo})`}
          </h2>
          <div className="clinic-nearby-list">
            {nearby.map((item) => {
              const applyVat = includeVat && item.place.vatExcluded && primaryMenu.vatAppliesInKorea;
              const totKrw =
                item.baseKrw + (applyVat ? Math.round(item.baseKrw * dataset.meta.vatRate) : 0);
              const totJpy = krwToJpy(totKrw, krwPer100Jpy);
              const distShort =
                item.distanceMeters < 1000
                  ? `${item.distanceMeters}m`
                  : `${(item.distanceMeters / 1000).toFixed(1)}km`;
              return (
                <button
                  key={item.place.id}
                  type="button"
                  className="clinic-nearby-item"
                  onClick={() => {
                    triggerHaptic(6);
                    onSelectClinic(item.place.id);
                  }}
                >
                  <div className="clinic-nearby-main">
                    <strong>{isJa ? item.place.nameJa : item.place.nameKo}</strong>
                    <span className="clinic-nearby-meta">
                      {item.place.japaneseSupport && (
                        <span className="tg-jp-badge">
                          <span className="tg-jp-code">JP</span>
                          <span className="tg-jp-lbl">{copy.jpSupportTag}</span>
                        </span>
                      )}
                      <span>
                        {isJa ? item.place.stationJa : item.place.stationKo} · {distShort}
                      </span>
                    </span>
                  </div>
                  <div className="clinic-nearby-price num">
                    <b>{formatJpy(totJpy)}</b>
                    <SvgIcon name="chevronRight" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="clinic-card clinic-more">
        <Disclosure
          open={sourcesOpen}
          onOpenChange={(next) => {
            triggerHaptic(6);
            setSourcesOpen(next);
          }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        >
          <DisclosureTrigger>
            <button type="button" className="clinic-more-summary w-full border-0 bg-transparent p-0">
              <span>
                {isJa
                  ? '公式ソース・日本5院平均の根拠を見る'
                  : '공식 출처 · 일본 5개 병원 평균 근거 보기'}
              </span>
              <span
                className="inline-flex transition-transform duration-200"
                style={{ transform: sourcesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <SvgIcon name="chevronDown" />
              </span>
            </button>
          </DisclosureTrigger>
          <DisclosureContent>
            <div className="clinic-more-body">
              <div className="info-list">
                <div className="info-item">
                  <span className="info-item-label">
                    {isJa ? '韓国公式サイト' : '한국 공식 홈페이지'}
                  </span>
                  <a href={activeProof.priceUrl} target="_blank" rel="noopener noreferrer">
                    {activeProof.priceUrl}
                  </a>
                </div>
                <div className="info-item">
                  <span className="info-item-label">{isJa ? '確認日' : '확인일'}</span>
                  <span>{copy.provenanceChecked(dataset.meta.checkedDate)}</span>
                </div>
              </div>
              <h3 className="clinic-more-sub">
                {copy.jpAvgSectionTitle(isJa ? primaryMenu.nameJa : primaryMenu.nameKo)}
              </h3>
              <div className="jp-bench-box">
                {primaryMenu.jpBenchmarks.map((c) => (
                  <a
                    key={`${c.nameJa}-${c.url}`}
                    className="jp-bench-row"
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="jp-bench-info">
                      <span className="jp-bench-name">
                        {isJa ? c.nameJa : c.nameKo} <SvgIcon name="external" />
                      </span>
                      <span className="jp-bench-plan">{isJa ? c.planJa : c.planKo}</span>
                    </div>
                    <strong className="jp-bench-price num">{formatJpy(c.priceJpy)}</strong>
                  </a>
                ))}
                <div className="jp-bench-total">
                  <span>{copy.jpAvgRowLabel}</span>
                  <strong className="num">{formatJpy(primaryMenu.jpBenchmarkJpy)}</strong>
                </div>
              </div>
            </div>
          </DisclosureContent>
        </Disclosure>
      </section>

      <nav className="clinic-actbar" aria-label={isJa ? 'クイックアクション' : '빠른 실행'}>
        <div className="clinic-actbar-inner">
          <button
            type="button"
            className="clinic-act-sub"
            id="actbar-helper-btn"
            onClick={() => {
              triggerHaptic(6);
              helperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <SvgIcon name="message" />
            <span>{isJa ? '予約・SNS' : '바로 예약·SNS'}</span>
          </button>
          <a
            className="clinic-act-main"
            href={activeProof.priceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SvgIcon name="external" />
            <span>{copy.verifyKrOfficial}</span>
          </a>
        </div>
      </nav>
    </article>
  );
}
