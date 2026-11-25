import useEmblaCarousel from 'embla-carousel-react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { Lang, MenuItem, PlaceItem } from '@/types.ts';
import type { ResolvedExternalReviewPost } from '@/data/external-review-posts.ts';
import { formatJpy, krwToJpy } from '@/lib/calc.ts';
import { triggerHaptic } from '@/lib/fluid.ts';

interface ExternalReviewsCarouselProps {
  posts: ResolvedExternalReviewPost[];
  isJa: boolean;
}

export function ExternalReviewsCarousel({ posts, isJa }: ExternalReviewsCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  if (posts.length === 0) return null;

  const isSingle = posts.length === 1;

  return (
    <div className="cp2-carousel-block">
      <div className="cp2-carousel-head">
        <h3>{isJa ? '店舗検証済みの外部実口コミ' : '이 지점 검증 외부 실후기'}</h3>
        {!isSingle && (
          <span className="cp2-swipe-hint">
            {isJa ? 'スワイプ →' : '옆으로 밀기 →'}
          </span>
        )}
      </div>
      <div className="cp2-embla" ref={emblaRef}>
        <div className="cp2-embla-track">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`cp2-rev-slide is-${post.platform} ${isSingle ? 'is-single' : ''}`}
            >
              <div className="cp2-rev-slide-top">
                <span className="cp2-rev-platform">
                  {isJa ? post.platformLabelJa : post.platformLabelKo}
                </span>
                <span className="cp2-rev-date num">{post.dateLabel}</span>
              </div>
              <p className="cp2-rev-summary">
                {isJa ? post.summaryJa : post.summaryKo}
              </p>
              <span className="cp2-rev-link">
                <span>{isJa ? '元の投稿を読む' : '원문 보기'}</span>
                <ArrowUpRight size={13} strokeWidth={2.2} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface NearbyCarouselItem {
  place: PlaceItem;
  baseKrw: number;
  distanceMeters: number;
}

interface NearbyClinicsCarouselProps {
  items: NearbyCarouselItem[];
  currentUnitJpy: number;
  primaryMenu: MenuItem;
  includeVat: boolean;
  vatRate: number;
  krwPer100Jpy: number;
  lang: Lang;
  onSelectClinic: (clinicId: string) => void;
}

export function NearbyClinicsCarousel({
  items,
  currentUnitJpy,
  primaryMenu,
  includeVat,
  vatRate,
  krwPer100Jpy,
  lang,
  onSelectClinic
}: NearbyClinicsCarouselProps) {
  const isJa = lang === 'ja';
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  if (items.length === 0) return null;

  const menuShort =
    primaryMenu.id === 're2o-5cc'
      ? isJa
        ? 'ブナジュ'
        : '리투오'
      : isJa
        ? primaryMenu.shortJa
        : primaryMenu.shortKo;

  return (
    <div className="cp2-carousel-block">
      <div className="cp2-carousel-head">
        <h3>
          {isJa
            ? `近くのクリニックと比較 (${menuShort})`
            : `근처 피부과 비교 (${menuShort})`}
        </h3>
        <span className="cp2-swipe-hint">
          {isJa ? 'スワイプ →' : '옆으로 밀기 →'}
        </span>
      </div>
      <div className="cp2-embla" ref={emblaRef}>
        <div className="cp2-embla-track">
          {items.map((item) => {
            const applyVat = includeVat && item.place.vatExcluded && primaryMenu.vatAppliesInKorea;
            const totKrw = item.baseKrw + (applyVat ? Math.round(item.baseKrw * vatRate) : 0);
            const totJpy = krwToJpy(totKrw, krwPer100Jpy);
            const diffJpy = totJpy - currentUnitJpy;
            const distShort =
              item.distanceMeters < 1000
                ? `${item.distanceMeters}m`
                : `${(item.distanceMeters / 1000).toFixed(1)}km`;

            return (
              <button
                key={item.place.id}
                type="button"
                className="cp2-nearby-slide"
                onClick={() => {
                  triggerHaptic(6);
                  onSelectClinic(item.place.id);
                }}
              >
                <div className="cp2-nearby-top">
                  <span className="cp2-nearby-dist num">
                    <MapPin size={11} strokeWidth={2.4} />
                    <span>{distShort}</span>
                  </span>
                  {item.place.japaneseSupport && (
                    <span className="cp2-nearby-jp">JP</span>
                  )}
                </div>
                <strong className="cp2-nearby-name">
                  {isJa ? item.place.nameJa : item.place.nameKo}
                </strong>
                <span className="cp2-nearby-station">
                  {isJa ? item.place.stationJa : item.place.stationKo}
                </span>
                <div className="cp2-nearby-price-row">
                  <strong className="cp2-nearby-jpy num">{formatJpy(totJpy)}</strong>
                  {Math.abs(diffJpy) >= 100 && (
                    <span className={`cp2-nearby-diff num ${diffJpy < 0 ? 'is-cheaper' : 'is-higher'}`}>
                      {diffJpy < 0
                        ? `-${formatJpy(Math.abs(diffJpy))}`
                        : `+${formatJpy(diffJpy)}`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
