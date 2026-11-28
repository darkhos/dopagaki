import { useMemo, useState } from 'react';
import type { GeoPoint, Lang, PlaceItem, PriceDataset } from '@/types.ts';
import {
  formatDistance,
  formatJpy,
  formatKrw,
  haversineMeters,
  isPointInSouthKorea,
  krwToJpy
} from '@/lib/calc.ts';
import { getClinicAiRating } from '@/lib/ai-rating.ts';
import { isNewClinic } from '@/data/brand-reviews.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';

export interface SavedClinicsViewProps {
  lang: Lang;
  dataset: PriceDataset;
  savedIds: string[];
  defaultMenuId: string;
  krwPer100Jpy: number;
  includeVat: boolean;
  userLocation: GeoPoint | null;
  onOpenClinic: (placeId: string, menuId: string) => void;
  onRemoveClinic: (place: PlaceItem) => void;
  onClearAll: () => void;
  onGoRanking: () => void;
  onGoRecommend: () => void;
  onHaptic: () => void;
}

interface SavedCardRow {
  place: PlaceItem;
  activePriceJpy: number | null;
  activePriceKrw: number | null;
  activeSavingsPct: number | null;
  activeSavingsJpy: number | null;
  distanceMeters: number | null;
  aiRating: number;
  offeredPreview: Array<{
    menuId: string;
    label: string;
    jpy: number;
    isSelected: boolean;
  }>;
}

export function SavedClinicsView({
  lang,
  dataset,
  savedIds,
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
  const [compareMenuId, setCompareMenuId] = useState<string>(defaultMenuId);
  const activeMenu =
    dataset.menus.find((m) => m.id === compareMenuId) ?? dataset.menus[0];

  const savedPlaces = useMemo(() => {
    const byId = new Map(dataset.places.map((p) => [p.id, p]));
    return savedIds
      .map((id) => byId.get(id))
      .filter((p): p is PlaceItem => Boolean(p));
  }, [dataset.places, savedIds]);

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

      const distanceMeters =
        userLocation && isPointInSouthKorea(userLocation)
          ? haversineMeters(userLocation.lat, userLocation.lng, place.lat, place.lng)
          : null;

      const aiRating = getClinicAiRating(place, dataset.places).overall;

      const offeredPreview = dataset.menus
        .filter((m) => Boolean(place.prices[m.id]))
        .map((m) => {
          const mOffer = place.prices[m.id]!;
          const applyVat = includeVat && place.vatExcluded && m.vatAppliesInKorea;
          const totalKrw =
            mOffer.krw + (applyVat ? Math.round(mOffer.krw * dataset.meta.vatRate) : 0);
          const label =
            m.id === 're2o-5cc'
              ? isJa
                ? 'ブナジュ'
                : '리투오'
              : isJa
                ? m.shortJa.replace(/\s+(?:2cc|5cc|300|50U)$/i, '')
                : m.shortKo;
          return {
            menuId: m.id,
            label,
            jpy: krwToJpy(totalKrw, krwPer100Jpy),
            isSelected: m.id === activeMenu.id
          };
        });

      return {
        place,
        activePriceJpy,
        activePriceKrw,
        activeSavingsPct,
        activeSavingsJpy,
        distanceMeters,
        aiRating,
        offeredPreview
      };
    });

    // Put clinics that offer the active comparison menu first, cheapest first
    return rows.sort((a, b) => {
      if (a.activePriceJpy !== null && b.activePriceJpy === null) return -1;
      if (a.activePriceJpy === null && b.activePriceJpy !== null) return 1;
      if (a.activePriceJpy !== null && b.activePriceJpy !== null) {
        return a.activePriceJpy - b.activePriceJpy;
      }
      return b.aiRating - a.aiRating;
    });
  }, [savedPlaces, activeMenu, includeVat, dataset, krwPer100Jpy, userLocation, isJa]);

  const activeMenuLabel =
    activeMenu.id === 're2o-5cc'
      ? isJa
        ? 'ブナジュ'
        : '리투오'
      : isJa
        ? activeMenu.shortJa
        : activeMenu.shortKo;

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
              {isJa
                ? '施術を選んで保存した院の公式価格を並べて比較'
                : '시술을 골라 저장한 병원의 공식 가격을 한눈에 비교해요'}
            </p>
          </div>
        </div>

        {savedPlaces.length > 0 && (
          <div className="sv-menu-strip" role="tablist" aria-label={isJa ? '比較する施術' : '비교할 시술'}>
            {dataset.menus.map((m) => {
              const selected = m.id === activeMenu.id;
              const label =
                m.id === 're2o-5cc'
                  ? isJa
                    ? 'ブナジュ'
                    : '리투오'
                  : isJa
                    ? m.shortJa
                    : m.shortKo;
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
              ? 'クリニック詳細ページの右上にある「保存」ボタンを押すと、ここに一覧でまとまります。'
              : '병원 상세페이지 오른쪽 위 「저장」 버튼을 누르면 여기에서 한눈에 비교할 수 있어요.'}
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
                idx === 0 &&
                item.activePriceJpy !== null &&
                cards.filter((c) => c.activePriceJpy !== null).length >= 2;
              const targetMenuId =
                item.activePriceJpy !== null
                  ? activeMenu.id
                  : item.offeredPreview[0]?.menuId ?? activeMenu.id;
              const otherOffers = item.offeredPreview
                .filter((op) => op.menuId !== activeMenu.id)
                .slice(0, 4);
              const extraOfferCount = Math.max(
                0,
                item.offeredPreview.filter((op) => op.menuId !== activeMenu.id).length - otherOffers.length
              );

              return (
                <article
                  key={place.id}
                  className={`sv-card ${isCheapest ? 'is-cheapest' : ''}`}
                >
                  <div className="sv-card-top">
                    <div className="sv-card-head">
                      <div className="sv-meta-row">
                        {isCheapest && (
                          <span className="sv-best-tag">
                            {isJa ? '最安' : '최저가'}
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
                          onOpenClinic(place.id, targetMenuId);
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

                  {item.activePriceJpy !== null && item.activePriceKrw !== null ? (
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

                  {otherOffers.length > 0 && (
                    <div className="sv-other-grid" aria-label={isJa ? 'その他の施術価格' : '다른 시술 가격'}>
                      {otherOffers.map((op) => (
                        <button
                          key={op.menuId}
                          type="button"
                          className="sv-other-item"
                          onClick={() => {
                            onHaptic();
                            onOpenClinic(place.id, op.menuId);
                          }}
                        >
                          <span className="sv-other-label">{op.label}</span>
                          <span className="sv-other-price num">{formatJpy(op.jpy)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="sv-open-btn"
                    onClick={() => {
                      onHaptic();
                      onOpenClinic(place.id, targetMenuId);
                    }}
                  >
                    <span>
                      {extraOfferCount > 0
                        ? isJa
                          ? `公式料金表・他${extraOfferCount}件を見る`
                          : `상세 정보 · 다른 ${extraOfferCount}개 시술 더 보기`
                        : isJa
                          ? '詳細・公式料金表を見る'
                          : '상세 정보 · 공식 가격표 보기'}
                    </span>
                    <SvgIcon name="chevronRight" />
                  </button>
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
