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
import { MenuEmoji } from '@/components/emoji.tsx';

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
                ? m.shortJa
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
            <span className="sv-head-icon" aria-hidden="true">
              <SvgIcon name="bookmarkFilled" />
            </span>
            <div>
              <h1 className="sv-title">
                {isJa ? '保存したクリニック' : '저장한 병원'}
              </h1>
              <p className="sv-sub">
                {isJa
                  ? '気になる院をまとめて施術ごとに比較できます'
                  : '관심 있는 병원을 모아 시술별로 한눈에 비교해요'}
              </p>
            </div>
          </div>
          <span className="sv-count-pill num">
            {isJa ? `${savedPlaces.length}院` : `${savedPlaces.length}곳`}
          </span>
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
                  <MenuEmoji menuId={m.id} size={14} />
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
              const isCheapest = idx === 0 && item.activePriceJpy !== null && cards.filter((c) => c.activePriceJpy !== null).length >= 2;
              const targetMenuId =
                item.activePriceJpy !== null
                  ? activeMenu.id
                  : item.offeredPreview[0]?.menuId ?? activeMenu.id;

              return (
                <article
                  key={place.id}
                  className={`sv-card ${isCheapest ? 'is-cheapest' : ''}`}
                >
                  <div className="sv-card-top">
                    <div className="sv-card-head">
                      <div className="sv-card-badges">
                        {isCheapest && (
                          <span className="sv-best-pill">
                            {isJa ? '保存内で最安' : '저장 중 최저가'}
                          </span>
                        )}
                        {isNewClinic(place.id) ? (
                          <span className="ai-pill is-new">
                            <span>NEW</span>
                          </span>
                        ) : (
                          <span className="sv-rating-pill num">
                            <SvgIcon name="star" />
                            <span>{item.aiRating.toFixed(1)}</span>
                          </span>
                        )}
                        {place.japaneseSupport && (
                          <span className="tg-jp-badge">
                            <span className="tg-jp-code">JP</span>
                            <span className="tg-jp-lbl">{isJa ? '日本語OK' : '일본어 가능'}</span>
                          </span>
                        )}
                        {item.distanceMeters !== null && (
                          <span className="bg-dist-pill num">
                            {formatDistance(item.distanceMeters, lang, true)}
                          </span>
                        )}
                      </div>
                      <h2 className="sv-card-name">{name}</h2>
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
                    <div className="sv-price-box">
                      <div className="sv-price-left">
                        <span className="sv-price-menu">
                          <MenuEmoji menuId={activeMenu.id} size={15} />
                          <span>{activeMenuLabel}</span>
                        </span>
                        <span className="sv-price-krw num">
                          {formatKrw(item.activePriceKrw)}
                          {includeVat ? (isJa ? ' · 税込' : ' · 부가세 포함') : ''}
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
                        ? `${activeMenuLabel}の掲載なし（他の${item.offeredPreview.length}施術に対応）`
                        : `${activeMenuLabel} 가격 미게시 (다른 ${item.offeredPreview.length}개 시술 취급)`}
                    </div>
                  )}

                  {item.offeredPreview.length > 0 && (
                    <div className="sv-offer-chips">
                      {item.offeredPreview.slice(0, 5).map((op) => (
                        <button
                          key={op.menuId}
                          type="button"
                          className={`sv-offer-chip num ${op.isSelected ? 'is-on' : ''}`}
                          onClick={() => {
                            onHaptic();
                            onOpenClinic(place.id, op.menuId);
                          }}
                        >
                          <span>{op.label}</span>
                          <b>{formatJpy(op.jpy)}</b>
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
                    <span>{isJa ? '詳細・公式料金表を見る' : '상세 정보 · 공식 가격표 보기'}</span>
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
