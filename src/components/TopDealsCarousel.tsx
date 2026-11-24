import { useCallback, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { ComputedRow, Lang } from '../types';
import { formatJpy } from '../lib/calc';
import { pickTopDeals } from '../lib/brand-groups';
import { NumFlow, YenFlow } from './ui/number-flow';
import { MedalEmoji, MenuEmoji } from './emoji';
import { track } from '../lib/analytics';

type Props = {
  rows: ComputedRow[];
  lang: Lang;
  onOpen: (placeId: string) => void;
  onHaptic: () => void;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function TopDealsCarousel({ rows, lang, onOpen, onHaptic }: Props) {
  const isJa = lang === 'ja';
  const deals = useMemo(() => pickTopDeals(rows), [rows]);
  const [viewportRef, embla] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    duration: prefersReducedMotion() ? 1 : 24
  });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (embla) setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    // Count only swipes (a drag that ends on a different card), not programmatic resets.
    let startIndex = embla.selectedScrollSnap();
    const onPointerDown = () => {
      startIndex = embla.selectedScrollSnap();
    };
    const onSettle = () => {
      const index = embla.selectedScrollSnap();
      if (index !== startIndex) {
        track('top3_swipe', { index });
        startIndex = index;
      }
    };
    embla.on('select', onSelect).on('reInit', onSelect).on('pointerDown', onPointerDown).on('settle', onSettle);
    return () => {
      embla.off('select', onSelect).off('reInit', onSelect).off('pointerDown', onPointerDown).off('settle', onSettle);
    };
  }, [embla, onSelect]);

  useEffect(() => {
    embla?.reInit();
    embla?.scrollTo(0, true);
  }, [embla, deals]);

  if (deals.length === 0) return null;

  return (
    <section className="td" aria-roledescription="carousel" aria-label={isJa ? '今日の最安 TOP3' : '오늘의 최저가 TOP3'}>
      <div className="td-head">
        <h2 className="td-title">{isJa ? '今日の最安 TOP3' : '오늘의 최저가 TOP3'}</h2>
        <span className="td-sub num">
          {isJa ? '日本平均' : '일본 평균'} <span>{formatJpy(deals[0].jpBenchmarkJpy)}</span>
        </span>
      </div>

      <div className="td-viewport" ref={viewportRef}>
        <ol className="td-track">
          {deals.map((row, i) => {
            const name = isJa ? row.place.nameJa : row.place.nameKo;
            const station = isJa ? row.place.stationJa : row.place.stationKo;
            const save = row.savingsJpy >= 0;
            return (
              <li
                key={row.place.id}
                className={`td-slide ${i === 0 ? 'is-first' : ''}`}
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${deals.length}`}
              >
                <button
                  type="button"
                  className="td-card"
                  onClick={() => {
                    onHaptic();
                    onOpen(row.place.id);
                  }}
                >
                  {i === 0 && <MenuEmoji menuId={row.menu.id} size={48} className="td-illust" />}
                  <span className="td-rank">
                    <MedalEmoji rank={i + 1} size={20} />
                    {isJa ? `最安${i + 1}位` : `최저가 ${i + 1}위`}
                  </span>
                  <span className="td-name">{name}</span>
                  <span className="td-price-row">
                    <b className="td-price num"><YenFlow value={row.krTotalJpy} /></b>
                    {save && (
                      <span className="td-pct num">
                        <NumFlow value={row.savingsPct} prefix="-" suffix="%" />
                      </span>
                    )}
                  </span>
                  <span className="td-save num">
                    {save
                      ? isJa
                        ? `日本比 ${formatJpy(row.savingsJpy)} おトク`
                        : `일본보다 ${formatJpy(row.savingsJpy)} 절약`
                      : isJa
                        ? '日本の方が安い'
                        : '일본이 더 저렴'}
                  </span>
                  <span className="td-foot">
                    {row.place.japaneseSupport && (
                      <span className="tg-jp-badge">
                        <span className="tg-jp-code">JP</span>
                        <span className="tg-jp-lbl">OK</span>
                      </span>
                    )}
                    <span className="td-station">{station}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {deals.length > 1 && (
        <div className="td-dots" role="group" aria-label={isJa ? 'スライド選択' : '슬라이드 선택'}>
          {deals.map((row, i) => (
            <button
              key={row.place.id}
              type="button"
              className="td-dot"
              aria-label={`${i + 1}`}
              aria-current={i === selected ? 'true' : undefined}
              onClick={() => {
                onHaptic();
                embla?.scrollTo(i);
              }}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
