import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import type {
  ComputedRow,
  Lang,
  MenuItem,
  NaverFxSnapshot,
  PlaceItem,
  PriceDataset,
  TraitFilterId
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
  TRAIT_FILTERS,
  getBrandReview,
  getClinicSafetyAudit,
  toggleTraitFilters,
  type ClinicTrait
} from '@/data/brand-reviews.ts';
import { getClinicAiRating } from '@/lib/ai-rating.ts';
import { renderBookingChannelsHtml } from '@/lib/clinic-trust-ui.ts';
import {
  RECOMMENDER_CONCERNS,
  RECOMMENDER_PREFERENCES,
  RECOMMENDER_SCHEDULES,
  TREATMENT_EFFECTS,
  buildTransitUrl,
  recommendTreatments,
  type RecommenderAnswers,
  type RecommenderConcernId,
  type RecommenderPick,
  type RecommenderPreferenceId,
  type RecommenderScheduleId
} from '@/lib/clinic-helpers.ts';
import { bindSheetSwipeDismiss, closeSheet, openSheet, triggerHaptic } from '@/lib/fluid.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background.tsx';
import { NumFlow, YenFlow } from '@/components/ui/number-flow.tsx';
import { BlurFade } from '@/components/ui/blur-fade.tsx';
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
              {lang === 'ja' ? '日本' : '일본'} <s>{formatJpy(activeRow.jpBenchmarkJpy)}</s>
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
            <span className="dd-facts-loc">
              <SvgIcon name="mapPin" />
              <span>{drawerDist ? `${station} · ${drawerDist}` : station}</span>
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
          <span className={`ai-pill is-${drawerAi.grade} num`}>
            <SvgIcon name="star" />
            <span>AI {drawerAi.formatted} / 5.0</span>
          </span>
          <span className={`char-vibe ${drawerRev.reviewScope === 'branch' ? 'is-branch' : ''}`}>
            {drawerVibe}
          </span>
          {drawerRev.traits.map((t) => (
            <TraitChip key={t.id} trait={t} lang={lang} />
          ))}
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
  onChangeShareLang,
  onClose,
  onCopied
}: {
  open: boolean;
  lang: Lang;
  shareLang: Lang;
  shareUrl: string;
  onChangeShareLang: (next: Lang) => void;
  onClose: () => void;
  onCopied: (msg: string) => void;
}) {
  const copy = getCopy(lang);
  const [qrSvg, setQrSvg] = useState('');
  const [copied, setCopied] = useState(false);

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
          <button
            type="button"
            className={`primary-btn ${copied ? 'is-copied' : ''}`}
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
        </div>
      </div>
    </SwipeSheetFrame>
  );
}

function RecommenderPickCard({
  pick,
  variant,
  lang,
  onApplyMenu,
  onOpenClinic
}: {
  pick: RecommenderPick;
  variant: 'primary' | 'secondary' | 'safe-alt';
  lang: Lang;
  onApplyMenu: (menuId: string) => void;
  onOpenClinic: (placeId: string, menus: string[]) => void;
}) {
  const isJa = lang === 'ja';
  const menuName = isJa ? pick.menu.shortJa : pick.menu.shortKo;
  const roleTag =
    variant === 'primary'
      ? isJa
        ? 'おすすめ 1位'
        : '가장 잘 맞아요 · 추천 1순위'
      : variant === 'safe-alt'
        ? isJa
          ? '予定がある日の代案'
          : '오늘·내일 약속용 대안'
        : isJa
          ? 'あわせて検討 2位'
          : '함께 비교할 2순위';
  const reasons = isJa ? pick.reasonsJa : pick.reasonsKo;
  const caution = isJa ? pick.cautionJa : pick.cautionKo;
  const topName = pick.topClinic ? (isJa ? pick.topClinic.nameJa : pick.topClinic.nameKo) : '';
  const eff = TREATMENT_EFFECTS[pick.menu.id];
  const dtBadge = eff ? (isJa ? eff.recoveryHintJa.split('・')[0] : eff.recoveryHintKo.split(' · ')[0]) : '';

  return (
    <article className={`rec-card is-${variant}`}>
      <div className="rec-card-top">
        <span className="rec-rank-pill">{roleTag}</span>
        {dtBadge && <span className="tg tg-jp">{dtBadge}</span>}
      </div>
      <div className="rec-card-title-row">
        <h4 className="rec-card-title">{menuName}</h4>
        <div className="rec-card-price num">
          <b>
            {isJa ? '最安 ' : '서울 최저 '}<YenFlow value={pick.seoulMinTotalJpy} />
          </b>
          <span>{formatCompactKrw(pick.seoulMinTotalKrw, lang)}</span>
        </div>
      </div>
      {pick.maxSavingsJpy > 0 && (
        <p className="rec-card-sav num">
          {isJa
            ? `日本平均より最大 ${formatJpy(pick.maxSavingsJpy)} おトク`
            : `일본 평균보다 최대 ${formatJpy(pick.maxSavingsJpy)} 절약`}
        </p>
      )}
      <ul className="rec-card-reasons">
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {caution && (
        <div className="rec-caution">
          <SvgIcon name="alert" />
          <span>{caution}</span>
        </div>
      )}
      {pick.usedFilterFallback && (
        <p className="rec-fallback-note">
          {isJa
            ? '※ 条件に合う院が少ないためソウル全体の最安値を表示しています'
            : '※ 고른 병원 조건을 모두 갖춘 곳이 적어 서울 전체 최저가를 함께 보여드려요'}
        </p>
      )}
      <div className="rec-card-actions">
        <button type="button" className="primary-btn rec-apply-btn" onClick={() => onApplyMenu(pick.menu.id)}>
          <span>{isJa ? `${menuName}の順位を見る →` : `${menuName} 순위 보기 →`}</span>
        </button>
        {pick.topClinic && (
          <button
            type="button"
            className="rec-ghost-btn"
            onClick={() => onOpenClinic(pick.topClinic!.id, [pick.menu.id])}
          >
            <span>{isJa ? `${topName}で計算` : `${topName} 바로 계산`}</span>
          </button>
        )}
      </div>
    </article>
  );
}

export function RecommenderModal({
  open,
  lang,
  includeVat,
  krwPer100Jpy,
  dataset,
  answers,
  onChangeAnswers,
  onResetAnswers,
  onApplyMenu,
  onOpenClinic,
  onClose
}: {
  open: boolean;
  lang: Lang;
  includeVat: boolean;
  krwPer100Jpy: number;
  dataset: PriceDataset;
  answers: RecommenderAnswers;
  onChangeAnswers: (next: RecommenderAnswers) => void;
  onResetAnswers: () => void;
  onApplyMenu: (menuId: string) => void;
  onOpenClinic: (placeId: string, menus: string[]) => void;
  onClose: () => void;
}) {
  const copy = getCopy(lang);
  const isJa = lang === 'ja';
  const resultBoxRef = useRef<HTMLElement>(null);

  const summary = recommendTreatments(answers, dataset, {
    includeVat,
    krwPer100Jpy
  });

  const resultSig = summary.hasInput
    ? [
        summary.primary?.menu.id ?? '',
        summary.scheduleSafeAlternative?.menu.id ?? '',
        summary.secondary?.menu.id ?? '',
        summary.combo?.clinic.id ?? ''
      ].join('|')
    : 'empty';

  const selectableTraits = TRAIT_FILTERS.filter(
    (tf) =>
      tf.id === 'low_upsell' ||
      tf.id === 'careful' ||
      tf.id === 'short_wait' ||
      tf.id === 'sunday_night'
  );

  const applyPreset = (preset: 'dry' | 'lift' | 'pore' | 'value') => {
    triggerHaptic(6);
    if (preset === 'dry') {
      onChangeAnswers({ ...answers, concerns: ['dryness'], schedule: 'flexible', preference: null });
    } else if (preset === 'lift') {
      onChangeAnswers({ ...answers, concerns: ['sagging'], schedule: 'urgent', preference: 'no-needle' });
    } else if (preset === 'pore') {
      onChangeAnswers({ ...answers, concerns: ['pores'], schedule: 'flexible', preference: null });
    } else {
      onChangeAnswers({ ...answers, concerns: ['jaw'], schedule: 'urgent', preference: 'low-budget' });
    }
    window.setTimeout(() => {
      resultBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <SwipeSheetFrame
      id="recommender-modal"
      labelledBy="recommender-modal-title"
      panelClassName="rec-drawer-panel"
      open={open}
      onClose={onClose}
    >
      <div className="drawer-drag-zone">
        <div className="drawer-grabber" aria-hidden="true" />
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title" id="recommender-modal-title">
              {isJa ? 'お悩みに合う施術診断' : '내 고민에 맞는 시술 추천'}
            </h2>
            <p className="drawer-sub">
              {isJa
                ? '気になる項目を選ぶと、合う施術と実際の最安クリニックをすぐご案内します'
                : '몇 가지만 고르면 내 피부와 일정에 맞는 시술·최저가 병원을 바로 찾아드려요'}
            </p>
          </div>
          <div className="rec-head-actions">
            <button
              type="button"
              className="rec-reset-btn"
              id="rec-reset-btn"
              onClick={() => {
                triggerHaptic(6);
                onResetAnswers();
              }}
            >
              {isJa ? 'リセット' : '다시 고르기'}
            </button>
            <button type="button" className="drawer-close" onClick={onClose} aria-label={copy.drawerClose}>
              <SvgIcon name="close" />
            </button>
          </div>
        </div>
      </div>

      {summary.hasInput && summary.primary && (
        <div className="rec-jump-bar">
          <span className="rec-jump-label">
            <strong>
              {isJa ? '1位おすすめ:' : '맞춤 1순위:'}{' '}
              {isJa ? summary.primary.menu.shortJa : summary.primary.menu.shortKo}
            </strong>
            {summary.combo && (
              <span className="rec-jump-plus">{isJa ? '＋2つ組み合わせあり' : '+ 2가지 조합'}</span>
            )}
          </span>
          <button
            type="button"
            className="rec-jump-btn"
            id="rec-jump-result-btn"
            onClick={() => {
              triggerHaptic(6);
              resultBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span>{isJa ? '結果を見る ↓' : '추천 결과 보기 ↓'}</span>
          </button>
        </div>
      )}

      <div className="drawer-body">
        <section className="rec-q">
          <div className="rec-q-head">
            <strong>{isJa ? '1. 一番気になるお悩みは？' : '1. 가장 신경 쓰이는 고민은?'}</strong>
            <span>{isJa ? '複数選択OK' : '여러 개 선택 가능'}</span>
          </div>
          <div className="rec-opt-grid">
            {RECOMMENDER_CONCERNS.map((c) => {
              const active = answers.concerns.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className="rec-opt-btn"
                  aria-pressed={active}
                  onClick={() => {
                    triggerHaptic(6);
                    const id: RecommenderConcernId = c.id;
                    onChangeAnswers({
                      ...answers,
                      concerns: active
                        ? answers.concerns.filter((x) => x !== id)
                        : [...answers.concerns, id]
                    });
                  }}
                >
                  <span className="rec-opt-title">{isJa ? c.labelJa : c.labelKo}</span>
                  <span className="rec-opt-sub">{isJa ? c.hintJa : c.hintKo}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rec-q">
          <div className="rec-q-head">
            <strong>{isJa ? '2. 施術後の予定・回復の余裕は？' : '2. 시술 후 일정은 어떤가요?'}</strong>
            <span>{isJa ? '1つ選択' : '1개 선택'}</span>
          </div>
          <div className="rec-opt-grid is-two">
            {RECOMMENDER_SCHEDULES.map((s) => {
              const active = answers.schedule === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className="rec-opt-btn"
                  aria-pressed={active}
                  onClick={() => {
                    triggerHaptic(6);
                    const id: RecommenderScheduleId = s.id;
                    onChangeAnswers({ ...answers, schedule: active ? null : id });
                  }}
                >
                  <span className="rec-opt-title">{isJa ? s.labelJa : s.labelKo}</span>
                  <span className="rec-opt-sub">{isJa ? s.subJa : s.subKo}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rec-q">
          <div className="rec-q-head">
            <strong>{isJa ? '3. 痛み・予算の希望は？' : '3. 방식 · 예산 선호가 있나요?'}</strong>
            <span>{isJa ? '任意' : '선택 사항'}</span>
          </div>
          <div className="rec-opt-grid is-two">
            {RECOMMENDER_PREFERENCES.map((p) => {
              const active = answers.preference === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="rec-opt-btn"
                  aria-pressed={active}
                  onClick={() => {
                    triggerHaptic(6);
                    const id: RecommenderPreferenceId = p.id;
                    onChangeAnswers({ ...answers, preference: active ? null : id });
                  }}
                >
                  <span className="rec-opt-title">{isJa ? p.labelJa : p.labelKo}</span>
                  <span className="rec-opt-sub">{isJa ? p.subJa : p.subKo}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rec-q">
          <div className="rec-q-head">
            <strong>
              {isJa
                ? '4. 好みのクリニック条件（順位に連動）'
                : '4. 원하는 병원 스타일 (순위에 바로 반영)'}
            </strong>
            <span>{isJa ? '任意・複数可' : '선택 · 여러 개 가능'}</span>
          </div>
          <div className="rec-chip-row">
            {selectableTraits.map((tf) => {
              const active = answers.traitFilters.includes(tf.id);
              return (
                <button
                  key={tf.id}
                  type="button"
                  className="rec-chip-btn"
                  aria-pressed={active}
                  onClick={() => {
                    triggerHaptic(6);
                    onChangeAnswers({
                      ...answers,
                      traitFilters: toggleTraitFilters(answers.traitFilters, tf.id as TraitFilterId)
                    });
                  }}
                >
                  {tf.icon && <SvgIcon name={tf.icon} />}
                  <span>{isJa ? tf.labelJa : tf.labelKo}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="rec-chip-btn"
              aria-pressed={answers.japaneseOnly}
              onClick={() => {
                triggerHaptic(6);
                onChangeAnswers({ ...answers, japaneseOnly: !answers.japaneseOnly });
              }}
            >
              <span className="rec-jp-code">JP</span>
              <span>{copy.jpSupportTag}</span>
            </button>
          </div>
        </section>

        {summary.hasInput ? (
          <section className="rec-results" id="rec-result-box" ref={resultBoxRef} aria-live="polite">
            <div className="rec-sec-head">
              <h3>{isJa ? 'あなたに合うおすすめ施術' : '선택하신 조건 맞춤 추천'}</h3>
              <span className="rec-sec-sub">
                {includeVat
                  ? isJa
                    ? '韓国税金+10%込み基準'
                    : '부가세 +10% 포함 기준'
                  : isJa
                    ? '表示価格ベース'
                    : '홈페이지 표시가 기준'}
              </span>
            </div>

            {summary.primary && (
              <BlurFade key={`${resultSig}-p`} delay={0} duration={0.2} offset={6} blur="3px">
                <RecommenderPickCard
                  pick={summary.primary}
                  variant="primary"
                  lang={lang}
                  onApplyMenu={onApplyMenu}
                  onOpenClinic={onOpenClinic}
                />
              </BlurFade>
            )}
            {summary.scheduleSafeAlternative && (
              <BlurFade key={`${resultSig}-alt`} delay={0.04} duration={0.2} offset={5} blur="3px">
                <RecommenderPickCard
                  pick={summary.scheduleSafeAlternative}
                  variant="safe-alt"
                  lang={lang}
                  onApplyMenu={onApplyMenu}
                  onOpenClinic={onOpenClinic}
                />
              </BlurFade>
            )}
            {summary.secondary && (
              <BlurFade key={`${resultSig}-s`} delay={0.075} duration={0.2} offset={4} blur="3px">
                <RecommenderPickCard
                  pick={summary.secondary}
                  variant="secondary"
                  lang={lang}
                  onApplyMenu={onApplyMenu}
                  onOpenClinic={onOpenClinic}
                />
              </BlurFade>
            )}
            {summary.combo && (
              <BlurFade key={`${resultSig}-combo`} delay={0.1} duration={0.2} offset={4} blur="3px">
                <article className="rec-combo-card">
                  <div className="rec-card-top">
                    <span className="rec-combo-pill">
                      {isJa ? '2つ組み合わせ提案' : '함께 받으면 좋은 2가지 조합'}
                    </span>
                    <span className="rec-combo-sav num">
                      {isJa
                        ? `日本平均より ${formatJpy(summary.combo.savingsJpy)}↓`
                        : `일본 평균 대비 ${formatJpy(summary.combo.savingsJpy)}↓`}
                    </span>
                  </div>
                  <h4 className="rec-card-title">
                    {isJa ? summary.combo.titleJa : summary.combo.titleKo}
                  </h4>
                  <p className="rec-combo-reason">
                    {isJa ? summary.combo.reasonJa : summary.combo.reasonKo}
                  </p>
                  <div className="rec-combo-clinic">
                    <div>
                      <strong>{isJa ? summary.combo.clinic.nameJa : summary.combo.clinic.nameKo}</strong>
                      <span>
                        {isJa ? summary.combo.clinic.stationJa : summary.combo.clinic.stationKo}
                      </span>
                    </div>
                    <div className="rec-combo-total num">
                      <b>{formatJpy(summary.combo.krTotalJpy)}</b>
                      <span>{formatKrw(summary.combo.totalKrw)}</span>
                    </div>
                  </div>
                  {summary.combo.usedFilterFallback && (
                    <p className="rec-fallback-note">
                      {isJa
                        ? '※ 2つとも揃う院が少なく、条件を緩めた最安院を表示しています'
                        : '※ 2가지를 함께 하는 곳 중 조건을 넓혀 가장 저렴한 지점을 찾았어요'}
                    </p>
                  )}
                  <button
                    type="button"
                    className="primary-btn rec-combo-btn"
                    onClick={() =>
                      onOpenClinic(
                        summary.combo!.clinic.id,
                        summary.combo!.menus.map((m) => m.id)
                      )
                    }
                  >
                    <span>
                      {isJa
                        ? 'この院で2つの合計を計算する →'
                        : '이 병원에서 2가지 묶음 계산하기 →'}
                    </span>
                  </button>
                </article>
              </BlurFade>
            )}
          </section>
        ) : (
          <section className="rec-empty" id="rec-result-box" ref={resultBoxRef}>
            <p className="rec-empty-title">
              {isJa
                ? '上の項目から1つ以上選んでみてください'
                : '위에서 고민이나 일정을 1개 이상 골라 보세요'}
            </p>
            <p className="rec-empty-sub">
              {isJa
                ? '迷う時はよくあるパターンを1タップで試せます。'
                : '잘 모를 땐 아래에서 가장 비슷한 상황 하나를 바로 눌러 보세요.'}
            </p>
            <div className="rec-presets">
              <button type="button" className="rec-preset-btn" onClick={() => applyPreset('dry')}>
                {isJa ? '乾燥・小じわケア' : '속건조 · 잔주름'}
              </button>
              <button type="button" className="rec-preset-btn" onClick={() => applyPreset('lift')}>
                {isJa ? '跡なし小顔リフト' : '티 없이 턱선 리프팅'}
              </button>
              <button type="button" className="rec-preset-btn" onClick={() => applyPreset('pore')}>
                {isJa ? '毛穴・ニキビ跡' : '모공 · 여드름 흉터'}
              </button>
              <button type="button" className="rec-preset-btn" onClick={() => applyPreset('value')}>
                {isJa ? '数千円台のエラ小顔' : '가볍게 1~5만 원대 턱 정리'}
              </button>
            </div>
          </section>
        )}
      </div>
    </SwipeSheetFrame>
  );
}
