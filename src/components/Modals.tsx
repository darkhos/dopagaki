import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import type {
  ComputedRow,
  Lang,
  MenuItem,
  NaverFxSnapshot,
  PlaceItem
} from '@/types.ts';
import {
  formatDistance,
  formatJpy,
  formatKrw,
  formatRate,
  formatSeoulDiffBanner,
  isPointInSouthKorea,
  jpyToKrw
} from '@/lib/calc.ts';
import { getCopy } from '@/lib/i18n.ts';
import { getOfficialMenuProof } from '@/data/official-proofs.ts';
import {
  buildPrimaryReviewUrl,
  getBrandReview,
  getClinicSafetyAudit,
  type ClinicTrait
} from '@/data/brand-reviews.ts';
import { getExternalReviewPosts } from '@/data/external-review-posts.ts';
import { getClinicAiRating } from '@/lib/ai-rating.ts';
import { renderBookingChannelsHtml } from '@/lib/clinic-trust-ui.ts';
import { buildTransitUrl } from '@/lib/clinic-helpers.ts';
import { bindSheetSwipeDismiss, closeSheet, openSheet, triggerHaptic } from '@/lib/fluid.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background.tsx';
import { NumFlow, YenFlow } from '@/components/ui/number-flow.tsx';
import { SheetTitle, VaulSheet } from '@/components/ui/vaul-sheet.tsx';
import { ShareStoryButton } from '@/components/ShareStoryButton.tsx';

export function formatCompactKrw(krw: number, lang: Lang): string {
  if (lang === 'ko' && krw >= 10000) {
    const man = Math.round(krw / 1000) / 10;
    return `약 ${Number.isInteger(man) ? man : man.toFixed(1)}만원`;
  }
  return formatKrw(krw);
}

export function TraitChip({ trait, lang }: { trait: ClinicTrait; lang: Lang }) {
  const lbl = lang === 'ja' ? trait.labelJa : trait.labelKo;
  return (
    <span className={`trait-chip is-${trait.tone}`}>
      <SvgIcon name={trait.icon} />
      <span>{lbl}</span>
    </span>
  );
}

interface SwipeSheetFrameProps {
  id: string;
  labelledBy: string;
  open: boolean;
  onClose: () => void;
  panelClassName?: string;
  children: ReactNode;
}

export function SwipeSheetFrame({
  id,
  labelledBy,
  open,
  onClose,
  panelClassName = '',
  children
}: SwipeSheetFrameProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    const el = backdropRef.current;
    if (open) {
      if (!mounted) {
        setMounted(true);
        return;
      }
      if (el) {
        bindSheetSwipeDismiss(el, (vel) => {
          closeSheet(
            el,
            () => {
              setMounted(false);
              onCloseRef.current();
            },
            vel ?? 0
          );
        });
        openSheet(el);
      }
    } else if (mounted && el) {
      closeSheet(el, () => setMounted(false), 0);
    } else if (mounted) {
      setMounted(false);
    }
  }, [open, mounted]);

  if (!mounted && !open) {
    return (
      <div
        className="drawer-backdrop"
        id={id}
        hidden
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      />
    );
  }

  return (
    <div
      ref={backdropRef}
      className="drawer-backdrop"
      id={id}
      hidden={!mounted && !open}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className={`drawer-panel ${panelClassName}`}>{children}</div>
    </div>
  );
}

interface DetailDrawerModalProps {
  open: boolean;
  row: ComputedRow | null;
  allPlaces: PlaceItem[];
  lang: Lang;
  naverFx: NaverFxSnapshot;
  krwPer100Jpy: number;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onOpenJpAvg: () => void;
  onOpenClinicPage: (placeId: string) => void;
  getShareUrl: (placeId: string) => string;
  onShowToast: (message: string) => void;
}

/** Detail sheet opens at 55% (the savings summary), drag or tap 詳しく見る for the rest. */
const DETAIL_PEEK = 0.55;

export function DetailDrawerModal({
  open,
  row,
  allPlaces,
  lang,
  naverFx,
  krwPer100Jpy,
  userLocation,
  onClose,
  onOpenJpAvg,
  onOpenClinicPage,
  getShareUrl,
  onShowToast
}: DetailDrawerModalProps) {
  const copy = getCopy(lang);
  const lastRowRef = useRef<ComputedRow | null>(null);
  if (row) lastRowRef.current = row;
  const activeRow = row ?? lastRowRef.current;
  const [snap, setSnap] = useState<number | string | null>(DETAIL_PEEK);
  const [showMore, setShowMore] = useState(false);
  useEffect(() => {
    if (open) {
      setSnap(DETAIL_PEEK);
      setShowMore(false);
    }
  }, [open, row?.place.id]);

  if (!activeRow) {
    return (
      <VaulSheet open={false} onOpenChange={(next) => !next && onClose()}>
        {null}
      </VaulSheet>
    );
  }

  const { place, menu } = activeRow;
  const name = lang === 'ja' ? place.nameJa : place.nameKo;
  const subName = lang === 'ja' ? place.nameKo : place.nameJa;
  const station = lang === 'ja' ? place.stationJa : place.stationKo;
  const caveat = lang === 'ja' ? place.caveatJa : place.caveatKo;
  const note = lang === 'ja' ? activeRow.offer.noteJa : activeRow.offer.noteKo;
  const leadTime = lang === 'ja' ? menu.leadTimeNoteJa : menu.leadTimeNoteKo;
  const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${place.nameKo} ${place.addressKo.split(',')[0]}`)}`;
  const naverDirUrl = buildTransitUrl('current', place, userLocation, lang);
  const officialPriceUrl = getOfficialMenuProof(place, menu.id, lang).priceUrl;
  const jpKrwApprox =
    lang === 'ja'
      ? `約${formatKrw(jpyToKrw(activeRow.jpBenchmarkJpy, krwPer100Jpy))}`
      : `약 ${formatKrw(jpyToKrw(activeRow.jpBenchmarkJpy, krwPer100Jpy))}`;
  const bank = lang === 'ja' ? naverFx.bankJa : naverFx.bankKo;
  const rateNote = copy.receiptRateNote(formatRate(krwPer100Jpy), naverFx.dateLabel, bank);
  const jpBreakdownInline = menu.jpBenchmarks
    .map((c) => `${lang === 'ja' ? c.nameJa.split(' ')[0] : c.nameKo.split(' ')[0]} ${formatJpy(c.priceJpy)}`)
    .join(' · ');
  const savingsSummary =
    activeRow.savingsJpy >= 0
      ? `${formatJpy(activeRow.savingsJpy)} (${copy.jpOffPct(activeRow.savingsPct)})`
      : `-${formatJpy(Math.abs(activeRow.savingsJpy))}`;
  const drawerDist = formatDistance(activeRow.distanceMeters, lang, isPointInSouthKorea(userLocation));
  const drawerRev = getBrandReview(place);
  const drawerPosts = getExternalReviewPosts(place, lang);
  const drawerPrimaryReviewUrl = buildPrimaryReviewUrl(place, lang);
  const drawerSafety = getClinicSafetyAudit(place);
  const drawerAi = getClinicAiRating(place, allPlaces);
  const drawerVibe = lang === 'ja' ? drawerRev.vibeJa : drawerRev.vibeKo;
  const drawerChannelsHtml = renderBookingChannelsHtml(place.id, lang, { compact: true });
  const seoulBanner = formatSeoulDiffBanner(
    activeRow.seoulAvgJpy,
    activeRow.seoulDiffJpy,
    activeRow.seoulDiffPct,
    lang,
    activeRow.seoulSampleCount
  );

  return (
    <VaulSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      className={`dd-panel ${snap === 1 ? 'is-full' : ''}`}
      snapPoints={[DETAIL_PEEK, 1]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <div className="vs-headzone">
        <div className="drawer-header">
          <div>
            <SheetTitle className="drawer-title" id="detail-drawer-title">
              {name}
            </SheetTitle>
            <p className="drawer-sub">
              {subName} / {lang === 'ja' ? menu.nameJa : menu.nameKo}
            </p>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label={copy.drawerClose}>
            <SvgIcon name="close" />
          </button>
        </div>
      </div>

      <div className="drawer-body">
        <div className="dd-hero">
          <div className="dd-hero-compare num">
            <span className="dd-hero-jp">
              {lang === 'ja' ? '日本' : '일본'} <span>{formatJpy(activeRow.jpBenchmarkJpy)}</span>
            </span>
            <span className="dd-hero-arrow" aria-hidden="true">→</span>
            <span className="dd-hero-kr">
              {lang === 'ja' ? 'ソウル' : '서울'} <b>{formatJpy(activeRow.krTotalJpy)}</b>
            </span>
          </div>
          {activeRow.savingsJpy >= 0 ? (
            <div className="dd-hero-save">
              <b className="num"><YenFlow value={activeRow.savingsJpy} /></b>
              <span>{lang === 'ja' ? 'おトク' : '절약'}</span>
              <span className="dd-hero-pct num"><NumFlow value={activeRow.savingsPct} prefix="-" suffix="%" /></span>
            </div>
          ) : (
            <div className="dd-hero-save is-over">
              <span>{lang === 'ja' ? '日本の方が安い' : '일본이 더 저렴'}</span>
            </div>
          )}
          <div className="dd-facts">
            {place.japaneseSupport && (
              <span className="tg-jp-badge">
                <span className="tg-jp-code">JP</span>
                <span className="tg-jp-lbl">{copy.jpSupportTag}</span>
              </span>
            )}
            {drawerDist && (
              <span className="bg-dist-pill num">
                <SvgIcon name="mapPin" />
                <span>{drawerDist}</span>
              </span>
            )}
            <span className="dd-facts-loc">
              <SvgIcon name="mapPin" />
              <span>{station}</span>
            </span>
          </div>
          {activeRow.savingsJpy > 0 && (
            <ShareStoryButton
              row={activeRow}
              lang={lang}
              shareUrl={getShareUrl(place.id)}
              fxNote={rateNote}
              onError={onShowToast}
            />
          )}
        </div>

        <button
          type="button"
          className="dd-more-btn"
          aria-expanded={showMore}
          aria-controls="dd-more"
          onClick={() => {
            triggerHaptic(6);
            const next = !showMore;
            setShowMore(next);
            if (next) setSnap(1);
          }}
        >
          <span>
            {showMore
              ? lang === 'ja'
                ? '閉じる'
                : '접기'
              : lang === 'ja'
                ? '詳しく見る（料金内訳・注意点・住所）'
                : '자세히 보기 (요금 내역·주의사항·주소)'}
          </span>
          <SvgIcon name="chevronDown" />
        </button>

        {showMore && (
        <div className="dd-more" id="dd-more">
        <button
          type="button"
          className="dd-page-btn"
          onClick={() => {
            triggerHaptic(6);
            onOpenClinicPage(place.id);
          }}
        >
          <span>{lang === 'ja' ? 'クリニック詳細ページを見る' : '병원 상세 페이지 보기'}</span>
          <SvgIcon name="chevronRight" />
        </button>

        <div className="drawer-traits">
          {place.japaneseSupport && (
            <span className="tg-jp-badge">
              <span className="tg-jp-code">JP</span>
              <span className="tg-jp-lbl">{copy.jpSupportTag}</span>
            </span>
          )}
          {drawerAi.isNewClinic ? (
            <span className="ai-pill is-new">
              <span>NEW · {lang === 'ja' ? '新規開院' : '신규 개원'}</span>
            </span>
          ) : (
            <span className={`ai-pill is-${drawerAi.grade} num`}>
              <SvgIcon name="star" />
              <span>AI {drawerAi.formatted} / 5.0</span>
            </span>
          )}
          <span className={`char-vibe ${drawerRev.reviewScope === 'branch' ? 'is-branch' : ''}`}>
            {drawerVibe}
          </span>
          {drawerRev.traits.map((t) => (
            <TraitChip key={t.id} trait={t} lang={lang} />
          ))}
        </div>

        <div className="dd-rev-box">
          <div className="dd-rev-top">
            <span className="dd-rev-badge">
              {drawerPosts.length > 0
                ? lang === 'ja'
                  ? `外部口コミ抜粋 ${drawerPosts.length}件`
                  : `외부 후기 요약 ${drawerPosts.length}건`
                : lang === 'ja'
                  ? drawerRev.scopeLabelJa
                  : drawerRev.scopeLabelKo}
            </span>
            <a
              className="dd-rev-ext"
              href={drawerPrimaryReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{lang === 'ja' ? 'Google口コミ(登録不要)' : '네이버 실후기(무로그인)'}</span>
              <SvgIcon name="external" />
            </a>
          </div>
          <p className="dd-rev-text">
            {drawerPosts.length > 0
              ? lang === 'ja'
                ? drawerPosts[0].summaryJa
                : drawerPosts[0].summaryKo
              : lang === 'ja'
                ? drawerRev.shortTagJa
                : drawerRev.shortTagKo}
          </p>
        </div>

        {drawerSafety.alerts.map((al) => (
          <div className="drawer-safety-note" key={al.id}>
            <span className="safety-badge-pill">
              <SvgIcon name="alert" />
              <span>{lang === 'ja' ? al.badgeJa : al.badgeKo}</span>
            </span>
            <p>{lang === 'ja' ? al.titleJa : al.titleKo}</p>
          </div>
        ))}

        <div className="receipt-box">
          <div className="receipt-line">
            <span>{copy.receiptKrBase}</span>
            <span className="num">{formatKrw(activeRow.baseKrw)}</span>
          </div>
          {activeRow.vatKrw > 0 && (
            <div className="receipt-line">
              <span>{copy.receiptVat}</span>
              <span className="num">+{formatKrw(activeRow.vatKrw)}</span>
            </div>
          )}
          <div className="receipt-line is-strong">
            <span>{copy.receiptKrTotal}</span>
            <span className="num">
              {formatJpy(activeRow.krTotalJpy)} ({formatKrw(activeRow.totalKrw)})
            </span>
          </div>
          <div className="receipt-line">
            <span>
              {lang === 'ja'
                ? `ソウル${activeRow.seoulSampleCount}院平均`
                : `서울 ${activeRow.seoulSampleCount}곳 평균`}
            </span>
            <span className="num">
              {formatJpy(activeRow.seoulAvgJpy)} ({formatKrw(activeRow.seoulAvgKrw)})
            </span>
          </div>
          <div className="receipt-line">
            <span>{lang === 'ja' ? 'ソウル平均との差' : '서울 평균 대비'}</span>
            <span className="num">{seoulBanner.text}</span>
          </div>
          <div className="receipt-line">
            <span>{copy.receiptJpBase}</span>
            <span className="num">
              {formatJpy(activeRow.jpBenchmarkJpy)} ({jpKrwApprox})
            </span>
          </div>
          <div className="receipt-jp-sub num">{jpBreakdownInline}</div>
          <div className="receipt-line is-savings">
            <span>{copy.receiptSavings}</span>
            <span className="num">{savingsSummary}</span>
          </div>
          <div className="receipt-rate-foot num">{rateNote}</div>
        </div>

        <a className="primary-btn" href={officialPriceUrl} target="_blank" rel="noopener noreferrer">
          <SvgIcon name="external" />
          <span>{copy.verifyKrOfficial}</span>
        </a>

        <div className="info-list">
          <div className="info-item">
            <span className="info-item-label">{copy.stationLabel}</span>
            <span>{drawerDist ? `${station} (${drawerDist})` : station}</span>
          </div>
          <div className="info-item">
            <span className="info-item-label">{copy.addressLabel}</span>
            <span>{place.addressKo}</span>
          </div>
          <div className="info-item">
            <span className="info-item-label">{copy.caveatLabel}</span>
            <span>
              {note} / {caveat}
            </span>
          </div>
          <div className="info-item">
            <span className="info-item-label">{copy.leadTimeLabel}</span>
            <span>{leadTime}</span>
          </div>
        </div>

        <div className="secondary-links">
          <button
            type="button"
            className="ext-link-btn"
            onClick={() => {
              triggerHaptic(6);
              onOpenJpAvg();
            }}
          >
            <SvgIcon name="info" />
            <span>{copy.verifyJpAverage}</span>
          </button>
          <a className="ext-link-btn" href={naverUrl} target="_blank" rel="noopener noreferrer">
            <SvgIcon name="mapPin" />
            <span>{copy.openNaverMap}</span>
          </a>
          <a className="ext-link-btn" href={naverDirUrl} target="_blank" rel="noopener noreferrer">
            <SvgIcon name="navigation" />
            <span>{lang === 'ja' ? 'NAVERマップ経路' : '네이버지도 길찾기'}</span>
          </a>
        </div>

        {drawerChannelsHtml && <div dangerouslySetInnerHTML={{ __html: drawerChannelsHtml }} />}
        </div>
        )}
      </div>
    </VaulSheet>
  );
}

export function GuideDrawerModal({
  open,
  lang,
  activeMenu,
  onClose
}: {
  open: boolean;
  lang: Lang;
  activeMenu: MenuItem;
  onClose: () => void;
}) {
  const copy = getCopy(lang);
  const menuName = lang === 'ja' ? activeMenu.nameJa : activeMenu.nameKo;

  return (
    <SwipeSheetFrame id="guide-drawer" labelledBy="guide-drawer-title" open={open} onClose={onClose}>
      <div className="drawer-drag-zone">
        <div className="drawer-grabber" aria-hidden="true" />
        <div className="drawer-header">
          <h2 className="drawer-title" id="guide-drawer-title">
            {copy.guideTitle}
          </h2>
          <button type="button" className="drawer-close" onClick={onClose} aria-label={copy.drawerClose}>
            <SvgIcon name="close" />
          </button>
        </div>
      </div>
      <div className="drawer-body">
        <section className="guide-section">
          <h3>{copy.jpAvgSectionTitle(menuName)}</h3>
          <div className="jp-bench-box">
            {activeMenu.jpBenchmarks.map((clinic) => (
              <a
                key={`${clinic.nameJa}-${clinic.url}`}
                className="jp-bench-row"
                href={clinic.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="jp-bench-info">
                  <span className="jp-bench-name">
                    {lang === 'ja' ? clinic.nameJa : clinic.nameKo} <SvgIcon name="external" />
                  </span>
                  <span className="jp-bench-plan">{lang === 'ja' ? clinic.planJa : clinic.planKo}</span>
                </div>
                <strong className="jp-bench-price num">{formatJpy(clinic.priceJpy)}</strong>
              </a>
            ))}
            <div className="jp-bench-total">
              <span>{copy.jpAvgRowLabel}</span>
              <strong className="num">{formatJpy(activeMenu.jpBenchmarkJpy)}</strong>
            </div>
          </div>
        </section>
        <section className="guide-section">
          <h3>{copy.guideVatTitle}</h3>
          <p>{copy.guideVatBody}</p>
        </section>
        <section className="guide-section">
          <h3>{copy.guideExtraTitle}</h3>
          <p>{copy.guideExtraBody}</p>
        </section>
        <section className="guide-section">
          <h3>{copy.guideSourceTitle}</h3>
          <p>{copy.guideSourceBody}</p>
        </section>
      </div>
    </SwipeSheetFrame>
  );
}

export function ShareQrModal({
  open,
  lang,
  shareLang,
  shareUrl,
  shareSummary,
  onChangeShareLang,
  onClose,
  onCopied
}: {
  open: boolean;
  lang: Lang;
  shareLang: Lang;
  shareUrl: string;
  shareSummary?: string;
  onChangeShareLang: (next: Lang) => void;
  onClose: () => void;
  onCopied: (msg: string) => void;
}) {
  const copy = getCopy(lang);
  const isJa = lang === 'ja';
  const [qrSvg, setQrSvg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleNativeShare = async () => {
    triggerHaptic(10);
    const text = shareSummary ? `${shareSummary}\n${shareUrl}` : shareUrl;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: isJa ? 'ドパガキ 美肌相場' : '도파가키 피부시세',
          text: shareSummary ?? copy.shareDesc,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    const finish = () => {
      setCopied(true);
      onCopied(isJa ? '要約とリンクをコピーしました' : '요약 문구와 링크를 복사했어요');
    };
    navigator.clipboard?.writeText(text).then(finish).catch(finish);
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void QRCode.toString(shareUrl, { type: 'svg', margin: 1, width: 184 })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch(() => {
        if (!cancelled) setQrSvg('');
      });
    return () => {
      cancelled = true;
    };
  }, [open, shareUrl]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  return (
    <SwipeSheetFrame id="share-modal" labelledBy="share-modal-title" open={open} onClose={onClose}>
      <div className="drawer-drag-zone">
        <div className="drawer-grabber" aria-hidden="true" />
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title" id="share-modal-title">
              {copy.shareTitle}
            </h2>
            <p className="drawer-sub">{copy.shareDesc}</p>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label={copy.drawerClose}>
            <SvgIcon name="close" />
          </button>
        </div>
      </div>
      <div className="drawer-body">
        <div className="qr-box">
          {shareSummary && (
            <div className="share-summary-card">
              <span className="share-summary-kicker">
                {isJa ? '一緒に送られるひとこと要約' : '함께 공유되는 한 줄 요약'}
              </span>
              <p className="share-summary-text">{shareSummary}</p>
            </div>
          )}
          <div className="lang-switch has-mp-bg" id="qr-lang-switch" role="group">
            <AnimatedBackground
              value={shareLang}
              onValueChange={(id) => {
                if (id === 'ja' || id === 'ko') {
                  triggerHaptic(6);
                  onChangeShareLang(id);
                }
              }}
              className="mp-ink-pill"
              transition={{ type: 'spring', bounce: 0, duration: 0.22 }}
            >
              <button
                type="button"
                data-id="ja"
                className="lang-btn"
                data-qr-lang="ja"
                aria-pressed={shareLang === 'ja'}
              >
                {copy.shareQrLangJa}
              </button>
              <button
                type="button"
                data-id="ko"
                className="lang-btn"
                data-qr-lang="ko"
                aria-pressed={shareLang === 'ko'}
              >
                {copy.shareQrLangKo}
              </button>
            </AnimatedBackground>
          </div>

          <div
            className="qr-frame"
            id="qr-frame"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="qr-url" id="qr-url">
            {shareUrl}
          </div>
          <div className="share-actions-row">
            <button
              type="button"
              className={`share-copy-sec ${copied ? 'is-copied' : ''}`}
              id="copy-share-url"
              onClick={() => {
                triggerHaptic(10);
                const finish = () => {
                  setCopied(true);
                  onCopied(copy.toastCopied);
                };
                navigator.clipboard?.writeText(shareUrl).then(finish).catch(finish);
              }}
            >
              <SvgIcon name={copied ? 'check' : 'copy'} />
              <span>{copied ? copy.shareCopied : copy.shareCopyLink}</span>
            </button>
            <button
              type="button"
              className="primary-btn share-native-btn"
              id="native-share-btn"
              onClick={() => {
                void handleNativeShare();
              }}
            >
              <SvgIcon name="share" />
              <span>{isJa ? 'LINE・SNS共有' : '카톡 · 바로 공유'}</span>
            </button>
          </div>
        </div>
      </div>
    </SwipeSheetFrame>
  );
}
