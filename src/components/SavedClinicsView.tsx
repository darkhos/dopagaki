import { useEffect, useMemo, useState } from 'react';
import type { GeoPoint, Lang, PlaceItem, PriceDataset } from '@/types.ts';
import {
  formatDistance,
  formatJpy,
  formatKrw,
  haversineMeters,
  isPointInSouthKorea,
  krwToJpy
} from '@/lib/calc.ts';
import {
  computeClinicBundle,
  type ClinicBundleSummary,
  type SavedClinicPlan
} from '@/lib/clinic-helpers.ts';
import { getClinicAiRating } from '@/lib/ai-rating.ts';
import { isNewClinic } from '@/data/brand-reviews.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';

export const SAVED_BUNDLE_MODE = '__saved_bundle__';

export interface SavedClinicsViewProps {
  lang: Lang;
  dataset: PriceDataset;
  savedIds: string[];
  savedPlans: Record<string, SavedClinicPlan>;
  defaultMenuId: string;
  krwPer100Jpy: number;
  includeVat: boolean;
  userLocation: GeoPoint | null;
  onOpenClinic: (
    placeId: string,
    menuIds: string[],
    visits?: number,
    focusBundleEditor?: boolean
  ) => void;
  onRemoveClinic: (place: PlaceItem) => void;
  onClearAll: () => void;
  onGoRanking: () => void;
  onGoRecommend: () => void;
  onHaptic: () => void;
}

interface OfferedPreviewItem {
  menuId: string;
  label: string;
  jpy: number;
  isSelected: boolean;
  inSavedBundle: boolean;
}

interface SavedCardRow {
  place: PlaceItem;
  activePriceJpy: number | null;
  activePriceKrw: number | null;
  activeSavingsPct: number | null;
  activeSavingsJpy: number | null;
  savedMenuIds: string[];
  savedVisits: number;
  savedBundle: ClinicBundleSummary | null;
  isMultiBundle: boolean;
  distanceMeters: number | null;
  aiRating: number;
  offeredPreview: OfferedPreviewItem[];
}

function menuLabelFor(menu: PriceDataset['menus'][number], isJa: boolean, compactJa = false): string {
  if (menu.id === 're2o-5cc') {
    return isJa ? 'ブナジュ' : '리투오';
  }
  if (isJa) {
    return compactJa ? menu.shortJa.replace(/\s+(?:2cc|5cc|300|50U)$/i, '') : menu.shortJa;
  }
  return menu.shortKo;
}

export function SavedClinicsView({
  lang,
  dataset,
  savedIds,
  savedPlans,
  defaultMenuId,
  krwPer100Jpy,
  includeVat,
  userLocation,
  onOpenClinic,
  onRemoveClinic,
  onClearAll,
  onGoRanking,
  onGoRecommend,
  onHaptic
}: SavedClinicsViewProps) {
  const isJa = lang === 'ja';

  const savedPlaces = useMemo(() => {
    const byId = new Map(dataset.places.map((p) => [p.id, p]));
    return savedIds
      .map((id) => byId.get(id))
      .filter((p): p is PlaceItem => Boolean(p));
  }, [dataset.places, savedIds]);

  const hasAnySavedBundle = useMemo(
    () =>
      savedPlaces.some((place) => {
        const plan = savedPlans[place.id];
        if (!plan) return false;
        const validCount = plan.menuIds.filter((id) => Boolean(place.prices[id])).length;
        return validCount >= 2 || (validCount >= 1 && plan.visits > 1);
      }),
    [savedPlaces, savedPlans]
  );

  const [compareMenuId, setCompareMenuId] = useState<string>(() =>
    hasAnySavedBundle ? SAVED_BUNDLE_MODE : defaultMenuId
  );

  useEffect(() => {
    if (!hasAnySavedBundle && compareMenuId === SAVED_BUNDLE_MODE) {
      setCompareMenuId(defaultMenuId);
    }
  }, [hasAnySavedBundle, compareMenuId, defaultMenuId]);

  const isBundleMode = compareMenuId === SAVED_BUNDLE_MODE && hasAnySavedBundle;
  const activeMenu =
    dataset.menus.find((m) => m.id === compareMenuId) ??
    dataset.menus.find((m) => m.id === defaultMenuId) ??
    dataset.menus[0];

  const cards = useMemo<SavedCardRow[]>(() => {
    const rows = savedPlaces.map((place) => {
      const offer = place.prices[activeMenu.id];
      let activePriceKrw: number | null = null;
      let activePriceJpy: number | null = null;
      let activeSavingsPct: number | null = null;
      let activeSavingsJpy: number | null = null;

      if (offer) {
        const applyVat = includeVat && place.vatExcluded && activeMenu.vatAppliesInKorea;
        activePriceKrw =
          offer.krw + (applyVat ? Math.round(offer.krw * dataset.meta.vatRate) : 0);
        activePriceJpy = krwToJpy(activePriceKrw, krwPer100Jpy);
        activeSavingsJpy = activeMenu.jpBenchmarkJpy - activePriceJpy;
        activeSavingsPct =
          activeMenu.jpBenchmarkJpy > 0
            ? Math.round((activeSavingsJpy / activeMenu.jpBenchmarkJpy) * 100)
            : 0;
      }

      const plan = savedPlans[place.id];
      const validSavedMenus = (plan?.menuIds ?? []).filter((id) => Boolean(place.prices[id]));
      const savedVisits = plan?.visits ?? 1;
      const savedBundle =
        validSavedMenus.length > 0
          ? computeClinicBundle(
              place,
              dataset.menus,
              validSavedMenus,
              savedVisits,
              includeVat,
              krwPer100Jpy,
              dataset.meta.vatRate,
              dataset.places
            )
          : null;
      const isMultiBundle = Boolean(
        savedBundle && (savedBundle.items.length >= 2 || savedVisits > 1)
      );
      const savedMenuSet = new Set(validSavedMenus);

      const distanceMeters =
        userLocation && isPointInSouthKorea(userLocation)
          ? haversineMeters(userLocation.lat, userLocation.lng, place.lat, place.lng)
          : null;

      const aiRating = getClinicAiRating(place, dataset.places).overall;

      const offeredPreview: OfferedPreviewItem[] = dataset.menus
        .filter((m) => Boolean(place.prices[m.id]))
        .map((m) => {
          const mOffer = place.prices[m.id]!;
          const applyVat = includeVat && place.vatExcluded && m.vatAppliesInKorea;
          const totalKrw =
            mOffer.krw + (applyVat ? Math.round(mOffer.krw * dataset.meta.vatRate) : 0);
          return {
            menuId: m.id,
            label: menuLabelFor(m, isJa, true),
            jpy: krwToJpy(totalKrw, krwPer100Jpy),
            isSelected: m.id === activeMenu.id,
            inSavedBundle: savedMenuSet.has(m.id)
          };
        });

      return {
        place,
        activePriceJpy,
        activePriceKrw,
        activeSavingsPct,
        activeSavingsJpy,
        savedMenuIds: validSavedMenus,
        savedVisits,
        savedBundle,
        isMultiBundle,
        distanceMeters,
        aiRating,
        offeredPreview
      };
    });

    if (isBundleMode) {
      return rows.sort((a, b) => {
        if (a.isMultiBundle !== b.isMultiBundle) return a.isMultiBundle ? -1 : 1;
        const aTotal = a.savedBundle?.krTotalJpy ?? a.activePriceJpy ?? Number.MAX_SAFE_INTEGER;
        const bTotal = b.savedBundle?.krTotalJpy ?? b.activePriceJpy ?? Number.MAX_SAFE_INTEGER;
        return aTotal - bTotal;
      });
    }

    // Single-treatment comparison: cheapest for the active menu first
    return rows.sort((a, b) => {
      if (a.activePriceJpy !== null && b.activePriceJpy === null) return -1;
      if (a.activePriceJpy === null && b.activePriceJpy !== null) return 1;
      if (a.activePriceJpy !== null && b.activePriceJpy !== null) {
        return a.activePriceJpy - b.activePriceJpy;
      }
      return b.aiRating - a.aiRating;
    });
  }, [
    savedPlaces,
    activeMenu,
    savedPlans,
    includeVat,
    dataset,
    krwPer100Jpy,
    userLocation,
    isJa,
    isBundleMode
  ]);

  const activeMenuLabel = menuLabelFor(activeMenu, isJa, false);

  return (
    <section
      className="sv-view"
      id="saved-clinics-view"
      aria-label={isJa ? '保存したクリニック' : '저장한 병원'}
    >
      <header className="sv-head">
        <div className="sv-head-top">
          <div className="sv-head-title-wrap">
            <h1 className="sv-title">
              {isJa ? '保存したクリニック' : '저장한 병원'}
              <span className="sv-count-num num">{savedPlaces.length}</span>
            </h1>
            <p className="sv-sub">
              {isBundleMode
                ? isJa
                  ? '保存した施術セットの合計を比較 · タップして編集できます'
                  : '저장한 시술 묶음 합계를 비교하고 상세에서 바로 수정해요'
                : isJa
                  ? '施術を選んで保存した院の公式価格を並べて比較'
                  : '시술을 골라 저장한 병원의 공식 가격을 한눈에 비교해요'}
            </p>
          </div>
        </div>

        {savedPlaces.length > 0 && (
          <div className="sv-menu-strip" role="tablist" aria-label={isJa ? '比較する施術' : '비교할 시술'}>
            {hasAnySavedBundle && (
              <button
                type="button"
                role="tab"
                aria-selected={isBundleMode}
                className={`sv-menu-chip is-bundle-tab ${isBundleMode ? 'is-on' : ''}`}
                onClick={() => {
                  onHaptic();
                  setCompareMenuId(SAVED_BUNDLE_MODE);
                }}
              >
                <span>{isJa ? '保存セット合計' : '내 묶음 합계'}</span>
              </button>
            )}
            {dataset.menus.map((m) => {
              const selected = !isBundleMode && m.id === activeMenu.id;
              const label = menuLabelFor(m, isJa, false);
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`sv-menu-chip ${selected ? 'is-on' : ''}`}
                  onClick={() => {
                    onHaptic();
                    setCompareMenuId(m.id);
                  }}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {savedPlaces.length === 0 ? (
        <div className="sv-empty">
          <div className="sv-empty-icon" aria-hidden="true">
            <SvgIcon name="bookmark" />
          </div>
          <h2 className="sv-empty-title">
            {isJa ? 'まだ保存したクリニックがありません' : '아직 저장한 병원이 없어요'}
          </h2>
          <p className="sv-empty-desc">
            {isJa
              ? 'クリニック詳細で施術を選んで保存すると、合計金額ごとここにまとまります。'
              : '병원 상세에서 시술을 골라 저장하면 합계 금액까지 여기에서 한눈에 비교할 수 있어요.'}
          </p>
          <div className="sv-empty-actions">
            <button
              type="button"
              className="sv-cta is-primary"
              onClick={() => {
                onHaptic();
                onGoRanking();
              }}
            >
              {isJa ? 'ランキングを見る' : '시세 순위 보러 가기'}
            </button>
            <button
              type="button"
              className="sv-cta"
              onClick={() => {
                onHaptic();
                onGoRecommend();
              }}
            >
              {isJa ? 'AIカウンセラーに相談' : 'AI 상담실장에게 묻기'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="sv-list">
            {cards.map((item, idx) => {
              const { place } = item;
              const name = isJa ? place.nameJa : place.nameKo;
              const station = isJa ? place.stationJa : place.stationKo;
              const isCheapest =
                !isBundleMode &&
                idx === 0 &&
                item.activePriceJpy !== null &&
                cards.filter((c) => c.activePriceJpy !== null).length >= 2;

              const editMenus =
                item.savedMenuIds.length > 0
                  ? item.savedMenuIds
                  : item.activePriceJpy !== null
                    ? [activeMenu.id]
                    : item.offeredPreview[0]
                      ? [item.offeredPreview[0].menuId]
                      : [activeMenu.id];
              const editVisits = item.savedMenuIds.length > 0 ? item.savedVisits : 1;

              const showSavedHero = Boolean(isBundleMode && item.savedBundle);
              const heroBundle = showSavedHero ? item.savedBundle! : null;

              const gridOffers =
                showSavedHero && item.isMultiBundle
                  ? item.offeredPreview.filter((op) => op.inSavedBundle).slice(0, 6)
                  : item.offeredPreview
                      .filter((op) =>
                        showSavedHero
                          ? op.menuId !== heroBundle?.items[0]?.menu.id
                          : op.menuId !== activeMenu.id
                      )
                      .slice(0, 4);

              const bundleTitleLine = heroBundle
                ? heroBundle.items.map((it) => menuLabelFor(it.menu, isJa, true)).join(' + ')
                : '';

              return (
                <article
                  key={place.id}
                  className={`sv-card ${isCheapest ? 'is-cheapest' : ''} ${
                    showSavedHero && item.isMultiBundle ? 'is-bundle-card' : ''
                  }`}
                >
                  <div className="sv-card-top">
                    <div className="sv-card-head">
                      <div className="sv-meta-row">
                        {isCheapest && (
                          <span className="sv-best-tag">
                            {isJa ? '最安' : '최저가'}
                          </span>
                        )}
                        {showSavedHero && item.isMultiBundle && (
                          <span className="sv-bundle-tag num">
                            {isJa
                              ? `${heroBundle!.items.length}施術セット${
                                  item.savedVisits > 1 ? ` ×${item.savedVisits}回` : ''
                                }`
                              : `${heroBundle!.items.length}개 묶음${
                                  item.savedVisits > 1 ? ` ×${item.savedVisits}회` : ''
                                }`}
                          </span>
                        )}
                        {isNewClinic(place.id) ? (
                          <span className="sv-new-tag">NEW</span>
                        ) : (
                          <span className="sv-meta-rating num">
                            <SvgIcon name="star" />
                            <span>{item.aiRating.toFixed(1)}</span>
                          </span>
                        )}
                        {place.japaneseSupport && (
                          <span className="sv-jp-tag">
                            {isJa ? '日本語OK' : '일본어'}
                          </span>
                        )}
                        {item.distanceMeters !== null && (
                          <span className="sv-meta-dist num">
                            {formatDistance(item.distanceMeters, lang, false)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="sv-card-title-btn"
                        onClick={() => {
                          onHaptic();
                          onOpenClinic(place.id, editMenus, editVisits, false);
                        }}
                      >
                        <h2 className="sv-card-name">{name}</h2>
                      </button>
                      <p className="sv-card-loc">{station}</p>
                    </div>

                    <button
                      type="button"
                      className="sv-remove-btn"
                      aria-label={isJa ? `${name}の保存を解除` : `${name} 저장 해제`}
                      onClick={() => {
                        onHaptic();
                        onRemoveClinic(place);
                      }}
                    >
                      <SvgIcon name="bookmarkFilled" />
                    </button>
                  </div>

                  {heroBundle ? (
                    <div className="sv-price-row">
                      <div className="sv-price-left">
                        <span className="sv-price-menu">
                          {item.isMultiBundle
                            ? isJa
                              ? `選択合計 · ${bundleTitleLine}`
                              : `선택 합계 · ${bundleTitleLine}`
                            : bundleTitleLine}
                        </span>
                        <span className="sv-price-krw num">
                          {formatKrw(heroBundle.totalKrw)}
                          {includeVat ? (isJa ? ' · 税込' : ' · VAT포함') : ''}
                        </span>
                      </div>
                      <div className="sv-price-right">
                        <strong className="sv-price-jpy num">
                          {formatJpy(heroBundle.krTotalJpy)}
                        </strong>
                        {heroBundle.savingsPct > 0 && (
                          <span className="sv-price-off num">-{heroBundle.savingsPct}%</span>
                        )}
                      </div>
                    </div>
                  ) : item.activePriceJpy !== null && item.activePriceKrw !== null ? (
                    <div className="sv-price-row">
                      <div className="sv-price-left">
                        <span className="sv-price-menu">{activeMenuLabel}</span>
                        <span className="sv-price-krw num">
                          {formatKrw(item.activePriceKrw)}
                          {includeVat ? (isJa ? ' · 税込' : ' · VAT포함') : ''}
                        </span>
                      </div>
                      <div className="sv-price-right">
                        <strong className="sv-price-jpy num">
                          {formatJpy(item.activePriceJpy)}
                        </strong>
                        {item.activeSavingsPct !== null && item.activeSavingsPct > 0 && (
                          <span className="sv-price-off num">-{item.activeSavingsPct}%</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="sv-price-empty">
                      {isJa
                        ? `${activeMenuLabel}の掲載なし · 他の${item.offeredPreview.length}施術に対応`
                        : `${activeMenuLabel} 미게시 · 다른 ${item.offeredPreview.length}개 시술 비교 가능`}
                    </div>
                  )}

                  {!showSavedHero && item.isMultiBundle && item.savedBundle && (
                    <button
                      type="button"
                      className="sv-saved-bundle-strip"
                      onClick={() => {
                        onHaptic();
                        onOpenClinic(place.id, editMenus, editVisits, true);
                      }}
                    >
                      <span className="sv-saved-bundle-strip-l">
                        <span className="sv-saved-bundle-dot" aria-hidden="true" />
                        <span>
                          {isJa
                            ? `保存セット(${item.savedBundle.items.length}種)合計`
                            : `저장한 ${item.savedBundle.items.length}개 묶음 합계`}
                        </span>
                      </span>
                      <span className="sv-saved-bundle-strip-r num">
                        <strong>{formatJpy(item.savedBundle.krTotalJpy)}</strong>
                        <span className="sv-saved-bundle-edit-lbl">
                          {isJa ? '編集' : '수정'}
                        </span>
                      </span>
                    </button>
                  )}

                  {gridOffers.length > 0 && (
                    <div
                      className={`sv-other-grid ${showSavedHero && item.isMultiBundle ? 'is-bundle-breakdown' : ''}`}
                      aria-label={
                        showSavedHero && item.isMultiBundle
                          ? isJa
                            ? '選択セット内訳'
                            : '선택 묶음 내역'
                          : isJa
                            ? 'その他の施術価格'
                            : '다른 시술 가격'
                      }
                    >
                      {gridOffers.map((op) => (
                        <button
                          key={op.menuId}
                          type="button"
                          className={`sv-other-item ${
                            showSavedHero && item.isMultiBundle ? 'is-in-bundle' : ''
                          }`}
                          onClick={() => {
                            onHaptic();
                            if (showSavedHero && item.isMultiBundle) {
                              onOpenClinic(place.id, editMenus, editVisits, true);
                            } else {
                              onOpenClinic(place.id, [op.menuId], 1, false);
                            }
                          }}
                        >
                          <span className="sv-other-label">{op.label}</span>
                          <span className="sv-other-price num">{formatJpy(op.jpy)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="sv-card-foot">
                    <button
                      type="button"
                      className="sv-edit-bundle-btn"
                      onClick={() => {
                        onHaptic();
                        onOpenClinic(place.id, editMenus, editVisits, true);
                      }}
                    >
                      {item.isMultiBundle
                        ? isJa
                          ? 'セット編集'
                          : '묶음 수정'
                        : isJa
                          ? 'セット作成'
                          : '묶음 담기'}
                    </button>

                    <button
                      type="button"
                      className="sv-open-btn"
                      onClick={() => {
                        onHaptic();
                        onOpenClinic(place.id, editMenus, editVisits, false);
                      }}
                    >
                      <span>{isJa ? '詳細・公式料金' : '상세 · 공식 가격표'}</span>
                      <SvgIcon name="chevronRight" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {savedPlaces.length >= 2 && (
            <div className="sv-foot">
              <button
                type="button"
                className="sv-clear-btn"
                onClick={() => {
                  onHaptic();
                  onClearAll();
                }}
              >
                {isJa ? '保存リストをすべて空にする' : '저장 목록 모두 비우기'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
