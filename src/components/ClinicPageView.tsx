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
  buildPrimaryReviewUrl,
  getBrandReview,
  getClinicSafetyAudit
} from '@/data/brand-reviews.ts';
import { getClinicAiRating } from '@/lib/ai-rating.ts';
import {
  renderBookingChannelsSectionHtml,
  renderCommunityReviewLinksHtml,
  renderFullSafetyAuditBoxHtml
} from '@/lib/clinic-trust-ui.ts';
import { getOfficialMenuProof } from '@/data/official-proofs.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';
import { MenuEmoji } from '@/components/emoji.tsx';
import { TraitChip, formatCompactKrw } from '@/components/Modals.tsx';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background.tsx';
import { YenFlow } from '@/components/ui/number-flow.tsx';
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger
} from '@/components/motion-primitives/disclosure.tsx';
import { ProofLightboxImage } from '@/components/ProofLightboxImage.tsx';
import { ShareStoryButton } from '@/components/ShareStoryButton.tsx';

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
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [aiDetailsOpen, setAiDetailsOpen] = useState(false);

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
    setSafetyOpen(false);
    setReceiptOpen(false);
    setAiDetailsOpen(false);
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

  const brandRev = getBrandReview(place);
  const aiRating = getClinicAiRating(place, dataset.places);
  const bank = isJa ? naverFx.bankJa : naverFx.bankKo;
  const rateNote = copy.receiptRateNote(formatRate(krwPer100Jpy), naverFx.dateLabel, bank);

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

  const extraTransitPresets: Array<{ id: TransitOriginPreset; ko: string; ja: string }> = [
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

  const safetyAudit = getClinicSafetyAudit(place);
  const fullSafetyHtml = renderFullSafetyAuditBoxHtml(place, lang);
  const bookingChannelsHtml = renderBookingChannelsSectionHtml(place.id, lang);
  const communityLinksHtml = renderCommunityReviewLinksHtml(place, lang);

  return (
    <article className="cp-page" id="clinic-detail-page">
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
          <SvgIcon name="arrowLeft" />
          <span>{isJa ? 'ランキングへ戻る' : '순위로 돌아가기'}</span>
        </button>

        <div className="cp-top-actions">
          <button
            type="button"
            className={`cp-icon-btn ${isSaved ? 'is-saved' : ''}`}
            id="clinic-save-btn"
            aria-pressed={isSaved}
            onClick={() => {
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
            }}
          >
            <SvgIcon name={isSaved ? 'bookmarkFilled' : 'bookmark'} />
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
            <SvgIcon name="share" />
            <span>{isJa ? '共有' : '공유'}</span>
          </button>
        </div>
      </div>

      {/* Card 1: Hero Summary & 1-Tap Actions */}
      <header className="cp-card cp-hero">
        <div className="cp-badges">
          <span className="cp-area-pill">{areaLabel}</span>
          <span className={`ai-pill is-${aiRating.grade} num`}>
            <SvgIcon name="star" />
            <span>{aiRating.formatted}</span>
          </span>
          {place.japaneseSupport && (
            <span className="tg-jp-badge">
              <span className="tg-jp-code">JP</span>
              <span className="tg-jp-lbl">{copy.jpSupportTag}</span>
            </span>
          )}
          <span className="cp-tag-muted">{officialTag}</span>
        </div>

        <div className="cp-title-block">
          <h1 className="cp-title">{name}</h1>
          <p className="cp-subname">{subName}</p>
        </div>

        <div className="cp-loc-block">
          {distLabel ? (
            <span className="bg-dist-pill num">
              <SvgIcon name="mapPin" />
              <span>{distLabel}</span>
            </span>
          ) : (
            !hasForeignLoc && (
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
                <SvgIcon name="locate" />
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
            )
          )}

          <div className="cp-station-row">
            <span className="cp-station-text">
              <SvgIcon name="mapPin" />
              <span>{station}</span>
            </span>
            <button
              type="button"
              className="cp-copy-btn"
              id="copy-addr-btn"
              title={place.addressKo}
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
          <p className="cp-address">{place.addressKo}</p>
        </div>

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
                    <SvgIcon name="alert" />
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
                    <SvgIcon name="chevronDown" className={safetyOpen ? 'is-rotated' : ''} />
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

        <div className="cp-cta-row">
          <a
            className="primary-btn cp-cta-primary"
            href={activeProof.priceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SvgIcon name="external" />
            <span>{isJa ? '公式料金表を見る' : '공식 가격표 보기'}</span>
          </a>
          <a
            className="cp-cta-secondary"
            href={buildTransitUrl('current', place, userLocation, lang)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleTransitClick(e, 'current')}
          >
            <SvgIcon name="navigation" />
            <span>{isJa ? 'NAVERマップ経路' : '네이버지도 길찾기'}</span>
          </a>
        </div>

        <div className="cp-transit-chips" aria-label={isJa ? '空港・駅からの経路' : '공항·역 길찾기'}>
          {extraTransitPresets.map((tp) => (
            <a
              key={tp.id}
              className="cp-transit-chip"
              href={buildTransitUrl(tp.id, place, userLocation, lang)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleTransitClick(e, tp.id)}
            >
              <span>{isJa ? tp.ja : tp.ko}</span>
            </a>
          ))}
        </div>
      </header>

      {/* Card 2: Price Calculator & Official Price Proof */}
      <section
        className="cp-card cp-price-card"
        id="clinic-calc"
        aria-label={isJa ? '料金と公式料金表' : '시술 가격 및 공식 가격표'}
      >
        <div className="cp-total-hero">
          <div className="cp-total-row">
            <div>
              <span className="cp-total-kicker">
                {isJa
                  ? `${bundle.items.length}施術 × ${visits}回 合計`
                  : `${bundle.items.length}개 시술 · ${visits}회 합계`}
              </span>
              <div className="cp-total-price-line">
                <strong className="cp-total-jpy num">
                  <YenFlow value={bundle.krTotalJpy} />
                </strong>
                {bundle.savingsJpy >= 0 && (
                  <span className="cp-total-pct num">-{bundle.savingsPct}%</span>
                )}
              </div>
              <span className="cp-total-krw num">
                {isJa
                  ? `${formatKrw(bundle.totalKrw)}${includeVat ? ' · 税金10%込' : ''}`
                  : `${formatCompactKrw(bundle.totalKrw, lang)} (${formatKrw(bundle.totalKrw)})${includeVat ? ' · 부가세 포함' : ''}`}
              </span>
            </div>
          </div>

          <div className="cp-compare-pills">
            <span className="cp-compare-pill num">
              {bundle.savingsJpy >= 0
                ? isJa
                  ? `日本5院平均 ${formatJpy(bundle.jpBenchmarkJpy)} より ${formatJpy(bundle.savingsJpy)} おトク`
                  : `일본 평균 ${formatJpy(bundle.jpBenchmarkJpy)} 대비 ${formatJpy(bundle.savingsJpy)} 절약`
                : isJa
                  ? `日本5院平均 ${formatJpy(bundle.jpBenchmarkJpy)}`
                  : `일본 평균 ${formatJpy(bundle.jpBenchmarkJpy)}`}
            </span>
            <span className={`cp-seoul-pill num is-${seoulBanner.tone}`}>{seoulBanner.text}</span>
          </div>

          <div className="cp-story-row">
            <ShareStoryButton
              variant="pastel"
              lang={lang}
              shareUrl={buildClinicUrl(window.location.origin, appBasePath, place.id, {
                lang,
                menuId: primaryMenu.id,
                menus: bundle.items.map((item) => item.menu.id),
                visits,
                includeVat
              })}
              fxNote={copy.receiptRateNote(formatRate(krwPer100Jpy), naverFx.dateLabel, isJa ? naverFx.bankJa : naverFx.bankKo)}
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
          </div>
        </div>

        <div className="cp-sec-head">
          <h2>{isJa ? 'この院の対応施術' : '이 병원의 취급 시술'}</h2>
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
              </button>
            );
          })}
        </div>

        <div className="cp-opts-bar">
          <div className="cp-stepper-group">
            <span className="cp-opt-lbl">{isJa ? '回数' : '횟수'}</span>
            <div className="cp-stepper">
              <button
                type="button"
                className="cp-step-btn"
                disabled={visits <= 1}
                aria-label={isJa ? '回数を減らす' : '횟수 줄이기'}
                onClick={() => {
                  triggerHaptic(6);
                  onChangeVisits(Math.max(1, visits - 1));
                }}
              >
                −
              </button>
              <span className="cp-step-val num">
                {visits}
                {isJa ? '回' : '회'}
              </span>
              <button
                type="button"
                className="cp-step-btn"
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
          </div>

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
        </div>

        <p className="clinic-stepper-caution cp-caution-line">
          {isJa
            ? '※ 初回体験価格の場合あり（ご注意ください）'
            : '※ 1회 체험가일 수 있으니 주의하세요'}
        </p>

        {/* Official Price Screenshot Proof */}
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
                  <SvgIcon name="check" />
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
                  <SvgIcon name="external" />
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
                <SvgIcon name="external" />
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
              <SvgIcon name="chevronDown" className={receiptOpen ? 'is-rotated' : ''} />
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
                      {isJa ? c.nameJa : c.nameKo} <SvgIcon name="external" />
                    </span>
                    <strong className="num">{formatJpy(c.priceJpy)}</strong>
                  </a>
                ))}
              </div>
            </div>
          </DisclosureContent>
        </Disclosure>
      </section>

      {/* Card 3: AI Score, Vibe & Pros/Watchouts */}
      <section
        className="cp-card cp-review-card"
        id="clinic-reviews"
        aria-label={isJa ? 'AI評価と口コミまとめ' : 'AI 평점 및 후기 요약'}
      >
        <div className="cp-sec-head">
          <h2>{isJa ? 'AI評価・口コミまとめ' : 'AI 평점 · 후기 요약'}</h2>
          <a
            className="cp-mini-link"
            href={primaryReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{isJa ? '実口コミを見る' : '실후기 보기'}</span>
            <SvgIcon name="external" />
          </a>
        </div>

        <div className="cp-ai-summary">
          <div className="cp-ai-score-badge">
            <span className="cp-ai-star">
              <SvgIcon name="star" />
            </span>
            <strong className="cp-ai-score num">{aiRating.formatted}</strong>
            <span className="cp-ai-max num">/ 5.0</span>
          </div>
          <div className="cp-ai-axes">
            {aiRating.axes.map((ax) => {
              const pct = Math.max(0, Math.min(100, Math.round((ax.score / 5) * 100)));
              return (
                <div className="cp-ai-axis" key={ax.id}>
                  <div className="cp-ai-axis-row">
                    <span>{isJa ? ax.labelJa : ax.labelKo}</span>
                    <strong className="num">{ax.score.toFixed(1)}</strong>
                  </div>
                  <div className="cp-ai-bar" aria-hidden="true">
                    <span className="cp-ai-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cp-traits">
          <span className={`char-vibe ${brandRev.reviewScope === 'branch' ? 'is-branch' : ''}`}>
            {isJa ? brandRev.vibeJa : brandRev.vibeKo}
          </span>
          {brandRev.traits.map((t) => (
            <TraitChip key={t.id} trait={t} lang={lang} />
          ))}
        </div>

        <div className="cp-procon">
          <div className="cp-procon-box is-pro">
            <h3>
              <SvgIcon name="check" />
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
              <SvgIcon name="alert" />
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

        <Disclosure
          open={aiDetailsOpen}
          onOpenChange={(next) => {
            triggerHaptic(6);
            setAiDetailsOpen(next);
          }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <DisclosureTrigger>
            <button type="button" className="cp-disclosure-btn" aria-expanded={aiDetailsOpen}>
              <span>
                {isJa
                  ? 'AI採点の根拠5つ・外部口コミアプリを見る'
                  : 'AI 평점 근거 5가지 · 외부 후기 앱 더보기'}
              </span>
              <SvgIcon name="chevronDown" className={aiDetailsOpen ? 'is-rotated' : ''} />
            </button>
          </DisclosureTrigger>
          <DisclosureContent>
            <div className="cp-disclosure-body">
              <ol className="clinic-ai-reasons cp-ai-reasons">
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
              {communityLinksHtml && (
                <div dangerouslySetInnerHTML={{ __html: communityLinksHtml }} />
              )}
              {fullSafetyHtml && <div dangerouslySetInnerHTML={{ __html: fullSafetyHtml }} />}
            </div>
          </DisclosureContent>
        </Disclosure>
      </section>

      {/* Card 4: Booking & Official Channels */}
      {bookingChannelsHtml && (
        <section
          className="cp-card cp-channels-card"
          id="clinic-helper"
          aria-label={isJa ? '公式SNS・予約チャンネル' : '바로 예약 · 공식 채널'}
          dangerouslySetInnerHTML={{ __html: bookingChannelsHtml }}
        />
      )}

      {/* Card 5: Nearby Clinics Comparison */}
      {nearby.length > 0 && (
        <section
          className="cp-card cp-nearby-card"
          aria-label={isJa ? '近くのクリニック比較' : '근처 피부과 비교'}
        >
          <div className="cp-sec-head">
            <h2>
              {isJa
                ? `近くの院と比較 (${primaryMenu.shortJa})`
                : `근처 피부과 비교 (${primaryMenu.shortKo})`}
            </h2>
          </div>
          <div className="cp-nearby-list">
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
                  className="cp-nearby-row"
                  onClick={() => {
                    triggerHaptic(6);
                    onSelectClinic(item.place.id);
                  }}
                >
                  <div className="cp-nearby-info">
                    <strong>{isJa ? item.place.nameJa : item.place.nameKo}</strong>
                    <div className="cp-nearby-meta">
                      {item.place.japaneseSupport && (
                        <span className="tg-jp-badge">
                          <span className="tg-jp-code">JP</span>
                          <span className="tg-jp-lbl">{copy.jpSupportTag}</span>
                        </span>
                      )}
                      <span className="cp-nearby-dist num">{distShort}</span>
                      <span className="cp-nearby-station">
                        {isJa ? item.place.stationJa : item.place.stationKo}
                      </span>
                    </div>
                  </div>
                  <div className="cp-nearby-price num">
                    <b>{formatJpy(totJpy)}</b>
                    <SvgIcon name="chevronRight" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
