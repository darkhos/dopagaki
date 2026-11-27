import useEmblaCarousel from 'embla-carousel-react';
import { ArrowUpRight, CheckCircle2, MapPin, MessageSquareQuote } from 'lucide-react';
import type { Lang, MenuItem, PlaceItem } from '@/types.ts';
import type { ResolvedClinicReview } from '@/data/brand-reviews.ts';
import type { ResolvedExternalReviewPost } from '@/data/external-review-posts.ts';
import { formatJpy, krwToJpy } from '@/lib/calc.ts';
import { triggerHaptic } from '@/lib/fluid.ts';

interface ExternalReviewsCarouselProps {
  posts: ResolvedExternalReviewPost[];
  isJa: boolean;
  brandRev?: ResolvedClinicReview;
}

export function ExternalReviewsCarousel({ posts, isJa, brandRev }: ExternalReviewsCarouselProps) {
  if (posts.length === 0) {
    if (!brandRev) return null;
    return (
      <div className="cp2-rev-section">
        <div className="cp2-rev-head">
          <h3>
            <MessageSquareQuote size={15} strokeWidth={2.3} />
            <span>{isJa ? '店舗の口コミ傾向' : '이 지점 후기 요약'}</span>
          </h3>
          <span className="cp2-rev-count-pill">
            {isJa ? brandRev.scopeLabelJa : brandRev.scopeLabelKo}
          </span>
        </div>
        <div className="cp2-rev-digest">
          <p className="cp2-rev-digest-main">
            {isJa ? brandRev.shortTagJa : brandRev.shortTagKo}
          </p>
          <p className="cp2-rev-digest-src">
            {isJa ? brandRev.sourcesLabelJa : brandRev.sourcesLabelKo}
          </p>
          <p className="cp2-rev-digest-note">
            {isJa
              ? 'この店舗の個別ブログ抜粋は随時追加中です。下の「登録不要リンク」からGoogleマップ・NAVERマップの最新口コミをそのまま読めます。'
              : '이 지점의 개별 블로그 발췌 후기는 순차 추가 중입니다. 아래 무로그인 링크에서 네이버·구글 최신 방문자 리뷰를 바로 확인하세요.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cp2-rev-section">
      <div className="cp2-rev-head">
        <h3>
          <MessageSquareQuote size={15} strokeWidth={2.3} />
          <span>{isJa ? 'この店舗の検証済み実口コミ' : '이 지점 검증 실방문 후기'}</span>
        </h3>
        <span className="cp2-rev-count-pill num">
          {isJa ? `${posts.length}件` : `${posts.length}건`}
        </span>
      </div>
      <div className="cp2-rev-list">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`cp2-rev-card is-${post.platform}`}
          >
            <div className="cp2-rev-slide-top">
              <div className="cp2-rev-meta-left">
                <span className={`cp2-rev-platform is-${post.platform}`}>
                  {isJa ? post.platformLabelJa : post.platformLabelKo}
                </span>
                <span className="cp2-rev-verified-tag">
                  <CheckCircle2 size={11} strokeWidth={2.4} />
                  <span>{isJa ? '実訪問確認' : '실방문 확인'}</span>
                </span>
              </div>
              <span className="cp2-rev-date num">{post.dateLabel}</span>
            </div>
            <p className="cp2-rev-summary">
              {isJa ? post.summaryJa : post.summaryKo}
            </p>
            <span className="cp2-rev-link">
              <span>{isJa ? '元の体験レポを読む' : '원문 후기 읽기'}</span>
              <ArrowUpRight size={13} strokeWidth={2.3} />
            </span>
          </a>
        ))}
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
