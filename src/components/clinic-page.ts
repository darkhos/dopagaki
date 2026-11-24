import type { GeoPoint, Lang, NaverFxSnapshot, PlaceItem, PriceDataset } from '../types.ts';
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
} from '../lib/calc.ts';
import {
  TREATMENT_DOWNTIME,
  TREATMENT_EFFECTS,
  buildNaverMapAppUrl,
  buildTransitUrl,
  computeClinicBundle,
  detectAppBasePath,
  findNearbyClinics,
  loadSavedClinicIds,
  toggleSavedClinicId,
  type TransitOriginPreset
} from '../lib/clinic-helpers.ts';
import { getCopy } from '../lib/i18n.ts';
import { icons } from '../lib/icons.ts';
import {
  animateScoreRings,
  renderEffectBulletHtml,
  renderScoreGaugesHtml
} from '../lib/score-rings.ts';
import { triggerHaptic } from '../lib/fluid.ts';
import {
  buildPrimaryReviewUrl,
  getBrandReview
} from '../data/brand-reviews.ts';
import { getClinicAiRating } from '../lib/ai-rating.ts';
import {
  renderBookingChannelsSectionHtml,
  renderCommunityReviewLinksHtml,
  renderFullSafetyAuditBoxHtml,
  renderHeroSafetyBannerHtml
} from '../lib/clinic-trust-ui.ts';
import { getOfficialMenuProof } from '../data/official-proofs.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCompactKrw(krw: number, lang: Lang): string {
  if (lang === 'ko') {
    if (krw >= 10000) {
      const man = Math.round(krw / 1000) / 10;
      return `약 ${Number.isInteger(man) ? man : man.toFixed(1)}만원`;
    }
    return formatKrw(krw);
  }
  return formatKrw(krw);
}

export interface ClinicPageState {
  clinicId: string;
  selectedMenus: string[];
  activeProofMenuId: string | null;
  visits: number;
}

export interface ClinicPageCallbacks {
  onBack: () => void;
  onSelectClinic: (clinicId: string) => void;
  onToggleVat: (nextVat: boolean) => void;
  onOpenShare: () => void;
  onStateChange: (clinicState: ClinicPageState) => void;
  onShowToast: (message: string, isOk?: boolean) => void;
  onRequestLocation: () => void;
}

export interface ClinicPageContext {
  dataset: PriceDataset;
  naverFx: NaverFxSnapshot;
  lang: Lang;
  primaryMenuId: string;
  includeVat: boolean;
  krwPer100Jpy: number;
  userLocation: GeoPoint | null;
  locatingUser: boolean;
}

export class ClinicPageController {
  private container: HTMLElement;
  private callbacks: ClinicPageCallbacks;
  private clinicState: ClinicPageState | null = null;
  private ctx: ClinicPageContext | null = null;

  constructor(
    container: HTMLElement,
    _staffModalEl: HTMLElement,
    callbacks: ClinicPageCallbacks
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.bindEvents();
  }

  public getState(): ClinicPageState | null {
    return this.clinicState;
  }

  public open(
    place: PlaceItem,
    ctx: ClinicPageContext,
    initialMenus?: string[],
    initialVisits = 1
  ): void {
    const offeredMenuIds = ctx.dataset.menus
      .filter((m) => Boolean(place.prices[m.id]))
      .map((m) => m.id);

    const validInitial = (initialMenus ?? []).filter((id) => offeredMenuIds.includes(id));
    const fallbackMenu = offeredMenuIds.includes(ctx.primaryMenuId)
      ? ctx.primaryMenuId
      : offeredMenuIds[0];

    const keepSameClinic = this.clinicState?.clinicId === place.id;

    const selectedMenus =
      validInitial.length > 0
        ? validInitial
        : keepSameClinic && this.clinicState!.selectedMenus.length > 0
          ? this.clinicState!.selectedMenus.filter((id) => offeredMenuIds.includes(id))
          : fallbackMenu
            ? [fallbackMenu]
            : [];

    const keepProofId =
      keepSameClinic &&
      this.clinicState?.activeProofMenuId &&
      offeredMenuIds.includes(this.clinicState.activeProofMenuId)
        ? this.clinicState.activeProofMenuId
        : (selectedMenus.find((id) => getOfficialMenuProof(place, id, this.ctx?.lang ?? 'ko').imageFile !== null) ??
            selectedMenus[0] ??
            offeredMenuIds[0] ??
            null);

    this.ctx = ctx;
    this.clinicState = {
      clinicId: place.id,
      selectedMenus,
      activeProofMenuId: keepProofId,
      visits: Math.max(1, Math.min(6, initialVisits || (keepSameClinic ? this.clinicState!.visits : 1)))
    };

    this.render();
  }

  public updateContext(ctx: ClinicPageContext): void {
    this.ctx = ctx;
    if (!this.clinicState) return;
    this.render();
  }

  public closeStaffModal(): void {
    // No-op: staff order-sheet modal removed in favor of direct official booking/SNS channels
  }

  public isStaffModalOpen(): boolean {
    return false;
  }

  private getCurrentPlace(): PlaceItem | null {
    if (!this.ctx || !this.clinicState) return null;
    return this.ctx.dataset.places.find((p) => p.id === this.clinicState!.clinicId) ?? null;
  }

  private render(): void {
    const ctx = this.ctx;
    const st = this.clinicState;
    const place = this.getCurrentPlace();
    if (!ctx || !st || !place) return;

    const { lang, dataset, naverFx, includeVat, krwPer100Jpy, userLocation, locatingUser } = ctx;
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

    const offeredMenus = dataset.menus.filter((m) => Boolean(place.prices[m.id]));
    const bundle = computeClinicBundle(
      place,
      dataset.menus,
      st.selectedMenus,
      st.visits,
      includeVat,
      krwPer100Jpy,
      dataset.meta.vatRate,
      dataset.places
    );

    const isSaved = loadSavedClinicIds().includes(place.id);
    const allSelected =
      offeredMenus.length > 1 &&
      offeredMenus.every((m) => st.selectedMenus.includes(m.id));

    const officialTag = isJa
      ? place.sourceType === 'official_standard'
        ? '公式定価'
        : '公式イベント'
      : place.sourceType === 'official_standard'
        ? '공식 정가'
        : '공식 이벤트';

    const offeredMenuIds = offeredMenus.map((m) => m.id);
    const primaryMenuId = st.selectedMenus[0] ?? offeredMenus[0]?.id ?? dataset.menus[0].id;
    const primaryMenu = dataset.menus.find((m) => m.id === primaryMenuId) ?? dataset.menus[0];
    const proofMenuId =
      st.activeProofMenuId && offeredMenuIds.includes(st.activeProofMenuId)
        ? st.activeProofMenuId
        : primaryMenu.id;
    const proofMenu = dataset.menus.find((m) => m.id === proofMenuId) ?? primaryMenu;
    const activeProof = getOfficialMenuProof(place, proofMenu.id, this.ctx?.lang ?? 'ko');
    const activeListedKrw = place.prices[proofMenu.id]?.krw ?? null;
    const proofMenuLabel = isJa ? proofMenu.shortJa : proofMenu.shortKo;
    const nearby = findNearbyClinics(dataset, place, primaryMenu.id, 3);

    const primaryReviewUrl = buildPrimaryReviewUrl(place, lang);
    const appBasePath = detectAppBasePath(window.location.pathname);
    const hasAnyBranchShot = offeredMenus.some(
      (m) => getOfficialMenuProof(place, m.id, lang).imageFile !== null
    );

    const proofTabsHtml =
      offeredMenus.length > 1
        ? `
          <div class="clinic-proof-tabs" role="tablist" aria-label="${escapeHtml(isJa ? '施術別公式スクショ' : '시술별 공식 캡처')}">
            ${offeredMenus
              .map((menu) => {
                const p = getOfficialMenuProof(place, menu.id, this.ctx?.lang ?? 'ko');
                const selected = menu.id === proofMenu.id;
                const lbl = isJa ? menu.shortJa : menu.shortKo;
                return `
                  <button
                    type="button"
                    role="tab"
                    class="clinic-proof-tab"
                    data-proof-menu="${menu.id}"
                    aria-selected="${selected}"
                  >
                    <span>${escapeHtml(lbl)}</span>
                    ${p.imageFile ? icons.check : ''}
                  </button>
                `;
              })
              .join('')}
          </div>
        `
        : '';
    const brandRev = getBrandReview(place);
    const aiRating = getClinicAiRating(place, dataset.places);
    const aiAxesHtml = aiRating.axes
      .map((ax) => {
        const pct = Math.max(0, Math.min(100, Math.round((ax.score / 5) * 100)));
        return `
          <div class="clinic-ai-axis">
            <div class="clinic-ai-axis-row">
              <span class="clinic-ai-axis-lbl">${escapeHtml(isJa ? ax.labelJa : ax.labelKo)}</span>
              <strong class="clinic-ai-axis-val num">${escapeHtml(ax.score.toFixed(1))}</strong>
            </div>
            <div class="clinic-ai-bar" aria-hidden="true">
              <span class="clinic-ai-bar-fill" style="width:${pct}%"></span>
            </div>
          </div>
        `;
      })
      .join('');
    const heroTraitsHtml = brandRev.traits
      .map((t) => {
        const lbl = isJa ? t.labelJa : t.labelKo;
        return `<span class="trait-chip is-${t.tone}">${icons[t.icon]}<span>${escapeHtml(lbl)}</span></span>`;
      })
      .join('');
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

    const downtimeRowsHtml = bundle.items
      .map((it) => {
        const dt = TREATMENT_DOWNTIME[it.menu.id];
        const eff = TREATMENT_EFFECTS[it.menu.id];
        if (!dt && !eff) return '';
        const effBullets = eff
          ? (isJa ? eff.effectsJa : eff.effectsKo)
              .map((line) => renderEffectBulletHtml(line))
              .join('')
          : '';
        const gaugesHtml = eff ? renderScoreGaugesHtml(eff, isJa, 'sm') : '';
        return `
          <div class="clinic-dt-row">
            <div class="clinic-dt-head">
              <strong>${escapeHtml(isJa ? it.menu.shortJa : it.menu.shortKo)}</strong>
              ${dt ? `<span class="tg tg-jp">${escapeHtml(isJa ? dt.badgeJa : dt.badgeKo)}</span>` : ''}
            </div>
            ${
              eff
                ? `
                  ${gaugesHtml}
                  <p class="clinic-eff-headline">${escapeHtml(isJa ? eff.headlineJa : eff.headlineKo)}</p>
                  <ul class="clinic-eff-list">${effBullets}</ul>
                  <div class="clinic-eff-meta">
                    <p class="clinic-eff-timing"><strong>${escapeHtml(isJa ? '効果・持続' : '효과·유지')}</strong> · ${escapeHtml(isJa ? eff.timingJa : eff.timingKo)}</p>
                  </div>
                `
                : ''
            }
            ${
              dt
                ? `
                  <p class="clinic-dt-desc">${escapeHtml(isJa ? dt.summaryJa : dt.summaryKo)}</p>
                  <p class="clinic-dt-makeup">${escapeHtml(isJa ? dt.makeupJa : dt.makeupKo)}</p>
                `
                : ''
            }
          </div>
        `;
      })
      .join('');

    const menuChipsHtml = offeredMenus
      .map((m) => {
        const offer = place.prices[m.id]!;
        const applyVat = includeVat && place.vatExcluded && m.vatAppliesInKorea;
        const unitTotalKrw = offer.krw + (applyVat ? Math.round(offer.krw * dataset.meta.vatRate) : 0);
        const unitJpy = krwToJpy(unitTotalKrw, krwPer100Jpy);
        const active = st.selectedMenus.includes(m.id);
        return `
          <button
            type="button"
            class="clinic-menu-chip"
            data-clinic-menu="${m.id}"
            aria-pressed="${active}"
          >
            <span class="clinic-menu-name">${escapeHtml(isJa ? m.shortJa : m.shortKo)}</span>
            <strong class="clinic-menu-price num">${escapeHtml(formatJpy(unitJpy))}</strong>
          </button>
        `;
      })
      .join('');

    const itemizedHtml = bundle.items
      .map(
        (it) => `
          <div class="receipt-line">
            <span>${escapeHtml(isJa ? it.menu.nameJa : it.menu.nameKo)}${bundle.visits > 1 ? ` ×${bundle.visits}` : ''}</span>
            <span class="num">${escapeHtml(formatJpy(it.krTotalJpy))} (${escapeHtml(formatKrw(it.totalKrw))})</span>
          </div>
        `
      )
      .join('');

    const nearbyHtml = nearby
      .map((item) => {
        const applyVat = includeVat && item.place.vatExcluded && primaryMenu.vatAppliesInKorea;
        const totKrw = item.baseKrw + (applyVat ? Math.round(item.baseKrw * dataset.meta.vatRate) : 0);
        const totJpy = krwToJpy(totKrw, krwPer100Jpy);
        const distShort =
          item.distanceMeters < 1000
            ? `${item.distanceMeters}m`
            : `${(item.distanceMeters / 1000).toFixed(1)}km`;
        return `
          <button type="button" class="clinic-nearby-item" data-goto-clinic="${item.place.id}">
            <div class="clinic-nearby-main">
              <strong>${escapeHtml(isJa ? item.place.nameJa : item.place.nameKo)}</strong>
              <span class="clinic-nearby-meta">
                ${
                  item.place.japaneseSupport
                    ? `<span class="tg-jp-badge"><span class="tg-jp-code">JP</span><span class="tg-jp-lbl">${escapeHtml(copy.jpSupportTag)}</span></span>`
                    : ''
                }
                <span>${escapeHtml(isJa ? item.place.stationJa : item.place.stationKo)} · ${escapeHtml(distShort)}</span>
              </span>
            </div>
            <div class="clinic-nearby-price num">
              <b>${escapeHtml(formatJpy(totJpy))}</b>
              ${icons.chevronRight}
            </div>
          </button>
        `;
      })
      .join('');

    const jpRowsHtml = primaryMenu.jpBenchmarks
      .map(
        (c) => `
          <a class="jp-bench-row" href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">
            <div class="jp-bench-info">
              <span class="jp-bench-name">${escapeHtml(isJa ? c.nameJa : c.nameKo)} ${icons.external}</span>
              <span class="jp-bench-plan">${escapeHtml(isJa ? c.planJa : c.planKo)}</span>
            </div>
            <strong class="jp-bench-price num">${escapeHtml(formatJpy(c.priceJpy))}</strong>
          </a>
        `
      )
      .join('');

    const transitPresets: Array<{ id: TransitOriginPreset; ko: string; ja: string }> = [
      { id: 'current', ko: '지금 내 위치에서', ja: '現在地から' },
      { id: 'incheon', ko: '인천공항에서', ja: '仁川空港から' },
      { id: 'gimpo', ko: '김포공항에서', ja: '金浦空港から' },
      { id: 'seoul-station', ko: '서울역에서', ja: 'ソウル駅から' }
    ];

    this.container.innerHTML = `
      <article class="clinic-page">
        <div class="clinic-topbar">
          <button type="button" class="clinic-back-btn" id="clinic-back-btn">
            ${icons.arrowLeft}
            <span>${escapeHtml(isJa ? '相場一覧へ戻る' : '시세판으로 돌아가기')}</span>
          </button>
          <div class="clinic-top-actions">
            <button
              type="button"
              class="clinic-save-btn ${isSaved ? 'is-saved' : ''}"
              id="clinic-save-btn"
              aria-pressed="${isSaved}"
            >
              ${isSaved ? icons.bookmarkFilled : icons.bookmark}
              <span>${escapeHtml(isJa ? (isSaved ? '保存済み' : '保存') : (isSaved ? '저장됨' : '저장'))}</span>
            </button>
            <button type="button" class="clinic-share-btn" id="clinic-share-btn">
              ${icons.share}
              <span>${escapeHtml(copy.shareBtn)}</span>
            </button>
          </div>
        </div>

        <header class="clinic-hero">
          <div class="clinic-hero-top">
            <div class="clinic-hero-main">
              <div class="clinic-badges">
                <span class="clinic-area-pill">${escapeHtml(areaLabel)}</span>
                <span class="ai-pill is-${aiRating.grade} num">${icons.star}<span>${escapeHtml(isJa ? `AI評価 ${aiRating.formatted} / 5.0` : `AI 평점 ${aiRating.formatted} / 5.0`)}</span></span>
                ${
                  place.japaneseSupport
                    ? `<span class="tg-jp-badge"><span class="tg-jp-code">JP</span><span class="tg-jp-lbl">${escapeHtml(copy.jpSupportTag)}</span></span>`
                    : ''
                }
                <span class="tg tg-of">${escapeHtml(officialTag)}</span>
              </div>
              <div class="clinic-title-row">
                <h1 class="clinic-title">${escapeHtml(name)}</h1>
                <button
                  type="button"
                  class="clinic-copy-addr-mini"
                  id="copy-addr-btn"
                  title="${escapeHtml(place.addressKo)}"
                  aria-label="${escapeHtml(isJa ? `韓国語住所をコピー (${place.addressKo})` : `주소 복사 (${place.addressKo})`)}"
                >
                  ${icons.copy}
                  <span>${escapeHtml(isJa ? '住所コピー' : '주소 복사')}</span>
                </button>
              </div>
              <p class="clinic-sub">
                ${escapeHtml(distLabel ? `${subName} · ${station} (${distLabel})` : `${subName} · ${station}`)}
                ${
                  !distLabel && !hasForeignLoc
                    ? ` <button type="button" class="loc-chip-btn" id="clinic-locate-btn" ${locatingUser ? 'disabled' : ''}>${icons.locate}<span>${escapeHtml(
                        locatingUser
                          ? isJa
                            ? '現在地を確認中…'
                            : '현재 위치 확인 중…'
                          : isJa
                            ? '現在地からの距離を見る'
                            : '현재 위치에서 거리 보기'
                      )}</span></button>`
                    : ''
                }
              </p>
            </div>
            <div class="clinic-hero-transit" aria-label="${escapeHtml(isJa ? 'NAVERマップ乗換案内' : '네이버지도 대중교통 길찾기')}">
              <span class="clinic-hero-transit-title">
                ${icons.navigation}
                <span>${escapeHtml(isJa ? '行き方 · NAVERマップ' : '찾아가기 · 네이버지도')}</span>
              </span>
              <div class="clinic-hero-transit-grid">
                ${transitPresets
                  .map(
                    (tp) => `
                      <a
                        class="clinic-hero-transit-btn"
                        href="${escapeHtml(buildTransitUrl(tp.id, place, userLocation, lang))}"
                        data-nmap-url="${escapeHtml(buildNaverMapAppUrl(tp.id, place, userLocation, lang))}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>${escapeHtml(isJa ? tp.ja : tp.ko)}</span>
                      </a>
                    `
                  )
                  .join('')}
              </div>
              ${
                isJa
                  ? '<p class="clinic-hero-transit-note">※ スマホ版NAVERマップアプリ（日本語設定）で開くと日本語で案内されます</p>'
                  : ''
              }
            </div>
          </div>
          ${renderHeroSafetyBannerHtml(place, lang)}
          <div class="clinic-hero-char">
            <div class="clinic-hero-char-head">
              <span class="char-vibe ${brandRev.reviewScope === 'branch' ? 'is-branch' : ''}">${escapeHtml(isJa ? brandRev.vibeJa : brandRev.vibeKo)}</span>
              <div class="clinic-hero-char-actions">
                <button type="button" class="clinic-jump-rev-btn" id="clinic-jump-reviews">
                  <span>${escapeHtml(isJa ? 'AI評価 ↓' : 'AI 분석 ↓')}</span>
                </button>
                <a class="clinic-direct-rev-btn" href="${escapeHtml(primaryReviewUrl)}" target="_blank" rel="noopener noreferrer">
                  ${icons.external}
                  <span>${escapeHtml(isJa ? '実口コミをすぐ見る' : '실후기 바로 보기')}</span>
                </a>
              </div>
            </div>
            <div class="clinic-hero-traits">${heroTraitsHtml}</div>
            ${
              brandRev.reviewScope === 'branch' && brandRev.verificationTier !== 'limited'
                ? `<p class="clinic-hero-summary">${escapeHtml(isJa ? brandRev.shortTagJa : brandRev.shortTagKo)}</p>`
                : ''
            }
          </div>
        </header>

        <section class="clinic-card clinic-calc" id="clinic-calc" aria-label="${escapeHtml(isJa ? '料金シミュレーション' : '시술 조합 가격 계산기')}">
          <div class="clinic-sec-head">
            <h2>${escapeHtml(isJa ? '施術を選んで合計を計算' : '시술 골라 합계 계산')}</h2>
            ${
              offeredMenus.length > 1
                ? `<button type="button" class="clinic-all-btn" id="clinic-select-all" aria-pressed="${allSelected}">
                    ${escapeHtml(
                      isJa
                        ? allSelected
                          ? '1施術に戻す'
                          : `全${offeredMenus.length}施術まとめて`
                        : allSelected
                          ? '1개만 보기'
                          : `${offeredMenus.length}종 전부 선택`
                    )}
                  </button>`
                : ''
            }
          </div>

          <div class="clinic-menu-grid" role="group" aria-label="${escapeHtml(isJa ? '施術選択' : '시술 선택')}">
            ${menuChipsHtml}
          </div>

          <div class="clinic-calc-opts">
            <div class="clinic-stepper">
              <span class="clinic-opt-label">${escapeHtml(isJa ? '回数' : '횟수')}</span>
              <div class="stepper-box">
                <button type="button" class="stepper-btn" data-visit-delta="-1" aria-label="${escapeHtml(isJa ? '回数を減らす' : '횟수 줄이기')}" ${st.visits <= 1 ? 'disabled' : ''}>−</button>
                <span class="stepper-val num">${st.visits}${isJa ? '回' : '회'}</span>
                <button type="button" class="stepper-btn" data-visit-delta="1" aria-label="${escapeHtml(isJa ? '回数を増やす' : '횟수 늘리기')}" ${st.visits >= 6 ? 'disabled' : ''}>+</button>
              </div>
              <span class="clinic-stepper-caution">${escapeHtml(isJa ? '※ 初回体験価格の場合あり（ご注意ください）' : '※ 1회 체험가일 수 있으니 주의하세요')}</span>
            </div>
            <label class="chk-label">
              <input type="checkbox" id="clinic-vat-chk" ${includeVat ? 'checked' : ''} />
              <span>${escapeHtml(isJa ? '2026年 税金+10%込み' : '2026 부가세 +10% 포함')}</span>
            </label>
          </div>

          <div class="clinic-total-panel">
            <div class="clinic-total-main">
              <strong class="clinic-total-jpy num">${escapeHtml(formatJpy(bundle.krTotalJpy))}</strong>
              <span class="clinic-total-krw num">${escapeHtml(isJa ? `${formatKrw(bundle.totalKrw)}${includeVat ? ' (税込10%)' : ''}` : `${formatCompactKrw(bundle.totalKrw, lang)} · ${formatKrw(bundle.totalKrw)}`)}</span>
            </div>
            <div class="clinic-savings-strip num ${bundle.savingsJpy < 0 ? 'is-over' : ''}">
              ${escapeHtml(savingsBannerText)}
            </div>
            <div class="clinic-seoul-strip num is-${seoulBanner.tone}">
              ${escapeHtml(seoulBanner.text)}
            </div>
          </div>

          <div class="receipt-box">
            ${itemizedHtml}
            ${
              bundle.vatKrw > 0
                ? `<div class="receipt-line"><span>${escapeHtml(copy.receiptVat)}</span><span class="num">+${escapeHtml(formatKrw(bundle.vatKrw))}</span></div>`
                : ''
            }
            <div class="receipt-line">
              <span>${escapeHtml(
                bundle.items.length > 1
                  ? isJa
                    ? 'ソウル平均合計'
                    : '서울 평균 합계'
                  : isJa
                    ? `ソウル${bundle.seoulSampleCount}院平均`
                    : `서울 ${bundle.seoulSampleCount}곳 평균`
              )}</span>
              <span class="num">${escapeHtml(formatJpy(bundle.seoulAvgJpy))} (${escapeHtml(formatKrw(bundle.seoulAvgKrw))})</span>
            </div>
            <div class="receipt-line is-strong">
              <span>${escapeHtml(copy.receiptJpBase)}</span>
              <span class="num">${escapeHtml(formatJpy(bundle.jpBenchmarkJpy))} (${isJa ? '約' : '약 '}${escapeHtml(formatKrw(jpyToKrw(bundle.jpBenchmarkJpy, krwPer100Jpy)))})</span>
            </div>
            <div class="receipt-rate-foot num">${escapeHtml(rateNote)}</div>
          </div>

          ${
            downtimeRowsHtml
              ? `
                <div class="clinic-dt-box">
                  <div class="clinic-dt-title">${escapeHtml(isJa ? '選んだ施術の効果・回復の目安・メイク案内' : '선택한 시술의 효과 · 회복 기간 · 화장 안내')}</div>
                  ${downtimeRowsHtml}
                </div>
              `
              : ''
          }
        </section>

        <section class="clinic-card clinic-proof" id="clinic-official-proof" aria-label="${escapeHtml(isJa ? '公式ホームページの実際料金表スクリーンショット' : '공식 홈페이지 실제 가격표 스크린샷')}">
          <div class="clinic-sec-head">
            <h2>${escapeHtml(
              hasAnyBranchShot
                ? isJa
                  ? '公式サイトの実際料金表スクショ'
                  : '공식 홈페이지 실제 가격표 캡처'
                : isJa
                  ? '公式サイトで院別料金を確認'
                  : '공식 홈페이지 지점 가격표 확인'
            )}</h2>
            <span class="clinic-proof-date num">${escapeHtml(isJa ? `${activeProof.capturedDate} 確認` : `${activeProof.capturedDate} 확인`)}</span>
          </div>
          ${proofTabsHtml}
          <p class="clinic-proof-lead">
            ${escapeHtml(
              activeProof.imageFile && activeProof.verifiedKrw !== null
                ? isJa
                  ? `${proofMenuLabel}の公式掲載価格（${formatKrw(activeProof.verifiedKrw)}・${place.vatExcluded ? '税込前の基本料金' : '税込表示の基本料金'}）部分を日本語に翻訳したスクリーンショットです。画像をタップすると${activeProof.isJaSite ? '日本語公式サイト' : '公式サイト'}へ直接移動します。`
                  : `우리 사이트에 표시된 ${proofMenuLabel} 공식가(${formatKrw(activeProof.verifiedKrw)} · ${place.vatExcluded ? '부가세 별도 기준' : '부가세 포함 기준'})가 실제로 적힌 공식 홈페이지 화면입니다. 사진을 클릭하면 해당 페이지로 바로 이동해요.`
                : isJa
                  ? `${proofMenuLabel}（公式 ${activeListedKrw !== null ? formatKrw(activeListedKrw) : ''}）の${activeProof.isJaSite ? '日本語公式サイト' : '公式サイト'}へ直接つながるリンクです。クリックして実際の料金表をご確認ください。`
                  : `현재 선택한 ${proofMenuLabel}${activeListedKrw !== null ? ` 공식가(${formatKrw(activeListedKrw)})` : ''}를 공식 홈페이지에서 직접 확인하실 수 있도록 직결 링크를 제공합니다.`
            )}
          </p>
          ${
            activeProof.imageFile && activeProof.verifiedKrw !== null
              ? `
                <a class="clinic-proof-shot" href="${escapeHtml(activeProof.priceUrl)}" target="_blank" rel="noopener noreferrer">
                  <span class="clinic-proof-bar">
                    <span class="clinic-proof-badge">${icons.check}<span>${escapeHtml(isJa ? `${proofMenuLabel} · 公式 ${formatKrw(activeProof.verifiedKrw)} 一致` : `${proofMenuLabel} · 공식가 ${formatKrw(activeProof.verifiedKrw)} 일치`)}</span></span>
                    <span class="clinic-proof-domain">${escapeHtml(activeProof.domainLabel)}</span>
                  </span>
                  <span class="clinic-proof-frame">
                    <img
                      class="clinic-proof-img"
                      src="${escapeHtml(`${appBasePath}${isJa && activeProof.imageFileJa ? 'official-proofs-ja' : 'official-proofs'}/${isJa && activeProof.imageFileJa ? activeProof.imageFileJa : activeProof.imageFile}`)}"
                      alt="${escapeHtml(isJa ? `${name} ${proofMenuLabel} 日本語翻訳 公式サイト料金表 ${formatKrw(activeProof.verifiedKrw)} スクリーンショット` : `${name} ${proofMenuLabel} 공식가 ${formatKrw(activeProof.verifiedKrw)} 실제 홈페이지 스크린샷`)}"
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span class="clinic-proof-cta">
                    ${icons.external}
                    <span>${escapeHtml(
                      isJa
                        ? activeProof.isJaSite
                          ? `タップして日本語公式サイト（公式 ${formatKrw(activeProof.verifiedKrw)}）を開く`
                          : `タップして公式 ${formatKrw(activeProof.verifiedKrw)} の掲載ページを開く`
                        : `사진 클릭 시 ${formatKrw(activeProof.verifiedKrw)} 공식 가격 페이지 바로 열기`
                    )}</span>
                  </span>
                </a>
              `
              : `
                <a class="clinic-proof-fallback" href="${escapeHtml(activeProof.priceUrl)}" target="_blank" rel="noopener noreferrer">
                  <div class="clinic-proof-bar">
                    <span class="clinic-proof-badge">${icons.check}<span>${escapeHtml(isJa ? `${proofMenuLabel} · 公式直接リンク` : `${proofMenuLabel} · 공식가 직결`)}</span></span>
                    <span class="clinic-proof-domain">${escapeHtml(activeProof.domainLabel)}</span>
                  </div>
                  <p class="clinic-proof-fallback-note">
                    ${escapeHtml(
                      isJa
                        ? `他院のスクショは一切流用せず、${name}公式ページで100%一致確認済みの料金表のみ掲載しています。${proofMenuLabel}の最新公式料金は下の公式ページで直接ご確認いただけます。`
                        : `다른 지점 화면은 절대 혼용하지 않고, ${name} 공식 페이지에서 100% 일치 확인된 가격표만 캡처로 제공합니다. ${proofMenuLabel} 최신 공식 가격은 아래 지점 공식 홈페이지에서 바로 확인하세요.`
                    )}
                  </p>
                  <span class="clinic-proof-cta">
                    ${icons.external}
                    <span>${escapeHtml(isJa ? (activeProof.isJaSite ? '日本語公式サイトを直接開く' : '公式料金ページを直接開く') : '공식 홈페이지 가격표 바로 열기')}</span>
                  </span>
                </a>
              `
          }
        </section>

        <section class="clinic-card clinic-checks" aria-label="${escapeHtml(isJa ? 'クリニックの特徴と注意点' : '병원 특징 및 주의사항')}">
          <h2>${escapeHtml(isJa ? '来院前チェック' : '방문 전 체크리스트')}</h2>
          <ul class="clinic-check-list">
            <li>
              <span class="clinic-check-mark ${place.japaneseSupport ? 'is-yes' : 'is-warn'}">${place.japaneseSupport ? icons.check : icons.info}</span>
              <div>
                <strong>${escapeHtml(isJa ? (place.japaneseSupport ? '日本語対応あり' : '韓国語基本（下の提示シートを活用）') : (place.japaneseSupport ? '일본어 상담 가능' : '한국어 기본 (아래 오더시트 활용 추천)'))}</strong>
                <p>${escapeHtml(isJa ? (place.japaneseSupport ? '公式サイト・予約窓口で日本語サポートを確認済み' : '下の「韓国語オーダーシート」をそのまま受付で見せられます') : (place.japaneseSupport ? '공식 홈페이지·창구 기준 일본어 지원 지점' : '아래 한국어 오더시트를 화면 그대로 보여주면 편해요'))}</p>
              </div>
            </li>
            <li>
              <span class="clinic-check-mark is-yes">${icons.check}</span>
              <div>
                <strong>${escapeHtml(isJa ? `公式ホームページ公開価格（${officialTag}）` : `공식 홈페이지 공개가 (${officialTag})`)}</strong>
                <p>${escapeHtml(bundle.items[0] ? (isJa ? bundle.items[0].noteJa : bundle.items[0].noteKo) : caveat)}</p>
              </div>
            </li>
            <li>
              <span class="clinic-check-mark is-yes">${icons.check}</span>
              <div>
                <strong>${escapeHtml(isJa ? '2026年タックスリファンド終了対応' : '2026년 세금 환급 종료 반영')}</strong>
                <p>${escapeHtml(isJa ? '表示の韓国価格に最初から税金10%を加算して日本5院平均と比較しています' : '홈페이지 표시가에 부가세 10%를 미리 더해 일본 5곳 평균과 비교했어요')}</p>
              </div>
            </li>
            <li>
              <span class="clinic-check-mark is-yes">${icons.check}</span>
              <div>
                <strong>${escapeHtml(station)}</strong>
                <p>${escapeHtml(distLabel ? `${distLabel} · ${place.addressKo}` : place.addressKo)}</p>
              </div>
            </li>
          </ul>
          <div class="clinic-caveat-note">
            <strong>${escapeHtml(copy.caveatLabel)}:</strong> ${escapeHtml(caveat)}
          </div>
          ${renderFullSafetyAuditBoxHtml(place, lang)}
        </section>

        <section class="clinic-card clinic-reviews" id="clinic-reviews" aria-label="${escapeHtml(isJa ? '公開口コミ傾向と店舗別リアルレポ' : '공개 리뷰 경향 및 지점 실후기')}">
          <div class="clinic-sec-head">
            <h2>${escapeHtml(isJa ? '公開口コミ傾向 & 店舗別レポ' : '공개 리뷰 경향 & 지점 실후기')}</h2>
            <div class="clinic-rev-badges">
              <span class="tg ${brandRev.reviewScope === 'branch' && brandRev.verificationTier !== 'limited' ? 'tg-jp' : 'tg-of'}">${escapeHtml(isJa ? brandRev.scopeLabelJa : brandRev.scopeLabelKo)}</span>
              <span class="tg ${brandRev.verificationTier === 'jp_kr_verified' ? 'tg-jp' : 'tg-of'}">${escapeHtml(isJa ? brandRev.tierLabelJa : brandRev.tierLabelKo)}</span>
              <span class="tg tg-of">${escapeHtml(isJa ? brandRev.vibeJa : brandRev.vibeKo)}</span>
            </div>
          </div>

          ${
            (isJa ? brandRev.branchNoticeJa : brandRev.branchNoticeKo)
              ? `<p class="clinic-rev-notice">${escapeHtml((isJa ? brandRev.branchNoticeJa : brandRev.branchNoticeKo) ?? '')}</p>`
              : ''
          }

          <div class="clinic-ai-box" id="clinic-ai-box">
            <div class="clinic-ai-top">
              <div class="clinic-ai-score-col">
                <span class="clinic-ai-kicker">${escapeHtml(isJa ? 'AI口コミ分析スコア' : 'AI 리뷰 분석 평점')}</span>
                <div class="clinic-ai-score-line num">
                  <span class="clinic-ai-star">${icons.star}</span>
                  <strong class="clinic-ai-num">${escapeHtml(aiRating.formatted)}</strong>
                  <span class="clinic-ai-max">/ 5.0</span>
                </div>
                <span class="clinic-ai-scope">
                  ${escapeHtml(
                    aiRating.verificationTier === 'limited'
                      ? isJa
                        ? '標本少数・参考値'
                        : '표본 적음 · 참고용'
                      : aiRating.reviewScope === 'branch'
                        ? isJa
                          ? '店舗別レポ分析'
                          : '지점 실후기 분석'
                        : isJa
                          ? 'ブランド傾向推定'
                          : '브랜드 리뷰 추정'
                  )}
                </span>
              </div>
              <div class="clinic-ai-axes">
                ${aiAxesHtml}
              </div>
            </div>
            <div class="clinic-ai-reasons-wrap">
              <p class="clinic-ai-reasons-kicker">
                ${escapeHtml(
                  isJa
                    ? 'AIスコア算出の詳細根拠（公開口コミ・公式価格分析）'
                    : '이 평점으로 산정한 실제 후기 · 공식가 근거 5가지'
                )}
              </p>
              <ol class="clinic-ai-reasons">
                ${aiRating.reasons
                  .map(
                    (reason) => `
                      <li class="clinic-ai-reason-item is-${escapeHtml(reason.key)}">
                        <span class="clinic-ai-reason-tag">${escapeHtml(isJa ? reason.titleJa : reason.titleKo)}</span>
                        <span class="clinic-ai-reason-text">${escapeHtml(isJa ? reason.bodyJa : reason.bodyKo)}</span>
                      </li>
                    `
                  )
                  .join('')}
              </ol>
            </div>
          </div>

          <div class="clinic-rev-grid">
            <div class="clinic-rev-col">
              <h3 class="clinic-rev-heading">
                <span class="clinic-rev-icon is-pro">${icons.check}</span>
                <span>${escapeHtml(
                  brandRev.verificationTier === 'limited'
                    ? isJa
                      ? '公式案内・確認済みメモ'
                      : '공식 안내 기준 확인 사항'
                    : isJa
                      ? '公開口コミで多い評価'
                      : '공개 후기에서 자주 꼽는 장점'
                )}</span>
              </h3>
              <ul class="clinic-rev-list">
                ${(isJa ? brandRev.prosJa : brandRev.prosKo)
                  .map((line) => `<li>${escapeHtml(line)}</li>`)
                  .join('')}
              </ul>
            </div>
            <div class="clinic-rev-col clinic-rev-col--warn">
              <h3 class="clinic-rev-heading">
                <span class="clinic-rev-icon is-warn">${icons.alert}</span>
                <span>${escapeHtml(
                  brandRev.verificationTier === 'limited'
                    ? isJa
                      ? '来院前に直接確認すべき点'
                      : '방문 전 직접 확인할 점'
                    : isJa
                      ? '来院前のリアルな注意点'
                      : '방문 전 참고할 솔직한 주의점'
                )}</span>
              </h3>
              <ul class="clinic-rev-list">
                ${(isJa ? brandRev.watchoutsJa : brandRev.watchoutsKo)
                  .map((line) => `<li>${escapeHtml(line)}</li>`)
                  .join('')}
              </ul>
            </div>
          </div>

          <div class="clinic-rev-ext">
            ${renderCommunityReviewLinksHtml(place, lang)}
            <p class="clinic-rev-source">
              ${escapeHtml(
                brandRev.verificationTier === 'limited'
                  ? `※ ${isJa ? brandRev.sourcesLabelJa : brandRev.sourcesLabelKo}`
                  : brandRev.reviewScope === 'branch'
                    ? isJa
                      ? `※ ${brandRev.sourcesLabelJa}（${name}の店舗別公開口コミ傾向を反映。最新原文は上の口コミアプリ・外部レビューでご確認ください）`
                      : `※ ${brandRev.sourcesLabelKo} (${name} 지점별 공개 후기를 반영했으며, 최신 원문 리뷰는 위 후기 앱 · 외부 후기에서 바로 확인하세요)`
                    : isJa
                      ? `※ ${brandRev.sourcesLabelJa}（この店舗はブランド傾向参考表示です。店舗ごとの最新原文は上の口コミアプリ・外部レビューでご確認ください）`
                      : `※ ${brandRev.sourcesLabelKo} (이 지점은 브랜드 경향 참고 표시이며, 지점별 실제 원문 리뷰는 위 후기 앱 · 외부 후기에서 바로 확인하세요)`
              )}
            </p>
          </div>
        </section>

        <section class="clinic-card clinic-helper clinic-channels-card" id="clinic-helper" aria-label="${escapeHtml(isJa ? '公式SNS・今すぐ予約チャンネル' : '바로 예약 · 공식 SNS 채널')}">
          ${renderBookingChannelsSectionHtml(place.id, lang)}
        </section>

        ${
          nearby.length > 0
            ? `
              <section class="clinic-card clinic-nearby" aria-label="${escapeHtml(isJa ? '近くのクリニック比較' : '주변 피부과 비교')}">
                <h2>${escapeHtml(isJa ? `この近くで比べる（${primaryMenu.shortJa}）` : `근처 피부과 바로 비교 (${primaryMenu.shortKo})`)}</h2>
                <div class="clinic-nearby-list">${nearbyHtml}</div>
              </section>
            `
            : ''
        }

        <section class="clinic-card clinic-more">
          <details>
            <summary class="clinic-more-summary">
              <span>${escapeHtml(isJa ? '公式ソース・日本5院平均の根拠を見る' : '공식 출처 · 일본 5개 병원 평균 근거 보기')}</span>
              ${icons.chevronDown}
            </summary>
            <div class="clinic-more-body">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-item-label">${escapeHtml(isJa ? '韓国公式サイト' : '한국 공식 홈페이지')}</span>
                  <a href="${escapeHtml(activeProof.priceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(activeProof.priceUrl)}</a>
                </div>
                <div class="info-item">
                  <span class="info-item-label">${escapeHtml(isJa ? '確認日' : '확인일')}</span>
                  <span>${escapeHtml(copy.provenanceChecked(dataset.meta.checkedDate))}</span>
                </div>
              </div>
              <h3 class="clinic-more-sub">${escapeHtml(copy.jpAvgSectionTitle(isJa ? primaryMenu.nameJa : primaryMenu.nameKo))}</h3>
              <div class="jp-bench-box">
                ${jpRowsHtml}
                <div class="jp-bench-total">
                  <span>${escapeHtml(copy.jpAvgRowLabel)}</span>
                  <strong class="num">${escapeHtml(formatJpy(primaryMenu.jpBenchmarkJpy))}</strong>
                </div>
              </div>
            </div>
          </details>
        </section>

        <nav class="clinic-actbar" aria-label="${escapeHtml(isJa ? 'クイックアクション' : '빠른 실행')}">
          <div class="clinic-actbar-inner">
            <button type="button" class="clinic-act-sub" id="actbar-helper-btn">
              ${icons.message}
              <span>${escapeHtml(isJa ? '予約・SNS' : '바로 예약·SNS')}</span>
            </button>
            <a class="clinic-act-main" href="${escapeHtml(activeProof.priceUrl)}" target="_blank" rel="noopener noreferrer">
              ${icons.external}
              <span>${escapeHtml(copy.verifyKrOfficial)}</span>
            </a>
          </div>
        </nav>
      </article>
    `;

    animateScoreRings(this.container);
  }

  private copyText(text: string, toastKo: string, toastJa: string): void {
    const isJa = this.ctx?.lang === 'ja';
    const done = () => this.callbacks.onShowToast(isJa ? toastJa : toastKo, true);
    navigator.clipboard?.writeText(text).then(done).catch(done);
  }

  private bindEvents(): void {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const st = this.clinicState;
      const ctx = this.ctx;
      const place = this.getCurrentPlace();
      if (!st || !ctx || !place) return;

      if (target.closest('#clinic-back-btn')) {
        triggerHaptic(6);
        this.callbacks.onBack();
        return;
      }

      if (target.closest('#clinic-save-btn')) {
        triggerHaptic(8);
        const res = toggleSavedClinicId(place.id);
        this.render();
        this.callbacks.onShowToast(
          ctx.lang === 'ja'
            ? res.saved
              ? 'このクリニックを保存しました'
              : '保存を解除しました'
            : res.saved
              ? '이 병원을 저장했어요'
              : '저장을 해제했어요',
          true
        );
        return;
      }

      if (target.closest('#clinic-share-btn')) {
        triggerHaptic(6);
        this.callbacks.onOpenShare();
        return;
      }

      if (target.closest('#clinic-locate-btn')) {
        triggerHaptic(6);
        this.callbacks.onRequestLocation();
        return;
      }

      if (target.closest('#clinic-jump-reviews')) {
        triggerHaptic(6);
        this.container.querySelector('#clinic-reviews')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        return;
      }

      const menuBtn = target.closest<HTMLButtonElement>('[data-clinic-menu]');
      if (menuBtn?.dataset.clinicMenu) {
        triggerHaptic(6);
        const id = menuBtn.dataset.clinicMenu;
        const exists = st.selectedMenus.includes(id);
        if (exists) {
          if (st.selectedMenus.length > 1) {
            st.selectedMenus = st.selectedMenus.filter((m) => m !== id);
          }
        } else {
          st.selectedMenus = [...st.selectedMenus, id];
          if (
            !st.activeProofMenuId ||
            (getOfficialMenuProof(place, id, ctx.lang).imageFile !== null &&
              getOfficialMenuProof(place, st.activeProofMenuId, ctx.lang).imageFile === null)
          ) {
            st.activeProofMenuId = id;
          }
        }
        this.callbacks.onStateChange(st);
        this.render();
        return;
      }

      if (target.closest('#clinic-select-all')) {
        triggerHaptic(6);
        const offered = ctx.dataset.menus.filter((m) => Boolean(place.prices[m.id])).map((m) => m.id);
        const allSelected = offered.every((id) => st.selectedMenus.includes(id));
        st.selectedMenus = allSelected ? [offered[0]] : offered;
        if (!st.activeProofMenuId || !offered.includes(st.activeProofMenuId)) {
          st.activeProofMenuId =
            offered.find((m) => getOfficialMenuProof(place, m, ctx.lang).imageFile !== null) ??
            offered[0] ??
            null;
        }
        this.callbacks.onStateChange(st);
        this.render();
        return;
      }

      const proofTabBtn = target.closest<HTMLButtonElement>('[data-proof-menu]');
      if (proofTabBtn?.dataset.proofMenu) {
        triggerHaptic(6);
        st.activeProofMenuId = proofTabBtn.dataset.proofMenu;
        this.render();
        return;
      }

      const visitBtn = target.closest<HTMLButtonElement>('[data-visit-delta]');
      if (visitBtn?.dataset.visitDelta) {
        triggerHaptic(6);
        const delta = Number(visitBtn.dataset.visitDelta);
        st.visits = Math.max(1, Math.min(6, st.visits + delta));
        this.callbacks.onStateChange(st);
        this.render();
        return;
      }

      if (target.closest('#copy-addr-btn')) {
        triggerHaptic(8);
        this.copyText(place.addressKo, '한국어 주소를 복사했어요', '韓国語住所をコピーしました');
        return;
      }

      if (target.closest('#actbar-helper-btn')) {
        triggerHaptic(6);
        this.container.querySelector('#clinic-helper')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        return;
      }

      const transitLink = target.closest<HTMLAnchorElement>('.clinic-hero-transit-btn[data-nmap-url]');
      if (transitLink && ctx.lang === 'ja') {
        const nmapUrl = transitLink.dataset.nmapUrl;
        const webUrl = transitLink.getAttribute('href');
        const isMobile =
          typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile && nmapUrl && webUrl) {
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
          return;
        }
      }

      const gotoBtn = target.closest<HTMLButtonElement>('[data-goto-clinic]');
      if (gotoBtn?.dataset.gotoClinic) {
        triggerHaptic(6);
        this.callbacks.onSelectClinic(gotoBtn.dataset.gotoClinic);
      }
    });

    this.container.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const st = this.clinicState;
      if (!st) return;

      if (target.id === 'clinic-vat-chk') {
        triggerHaptic(6);
        this.callbacks.onToggleVat(target.checked);
      }
    });
  }
}
