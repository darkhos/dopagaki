import '@radix-ui/colors/jade.css';
import './styles/app.css';
import QRCode from 'qrcode';
import dopagakiMarkUrl from './assets/dopagaki-mark.png';
import rawDataset from './data/prices.json';
import rawNaverFx from './data/naver-fx.json';
import type {
  AppState,
  AreaId,
  ComputedRow,
  Lang,
  NaverFxSnapshot,
  PriceDataset,
  SortId,
  TraitFilterId
} from './types.ts';
import {
  buildRankedRows,
  computeRow,
  computeSeoulAverage,
  formatDistance,
  formatJpy,
  formatKrw,
  formatRate,
  formatSeoulDiffBadge,
  formatSeoulDiffBanner,
  isPointInSouthKorea,
  jpyToKrw
} from './lib/calc.ts';
import { getCopy } from './lib/i18n.ts';
import { icons } from './lib/icons.ts';
import {
  animateScoreRings,
  renderEffectBulletHtml,
  renderScoreGaugesHtml
} from './lib/score-rings.ts';
import {
  FluidToast,
  bindSheetSwipeDismiss,
  closeSheet,
  openSheet,
  triggerHaptic
} from './lib/fluid.ts';
import { ClinicPageController } from './components/clinic-page.ts';
import { createBrandDopamineBurst } from './components/dopamine-burst.ts';
import {
  RECOMMENDER_CONCERNS,
  RECOMMENDER_PREFERENCES,
  RECOMMENDER_SCHEDULES,
  TREATMENT_DOWNTIME,
  TREATMENT_EFFECTS,
  buildClinicUrl,
  buildTransitUrl,
  detectAppBasePath,
  parseRoute,
  recommendTreatments,
  type RecommenderAnswers,
  type RecommenderConcernId,
  type RecommenderPick,
  type RecommenderPreferenceId,
  type RecommenderScheduleId
} from './lib/clinic-helpers.ts';
import { getOfficialMenuProof } from './data/official-proofs.ts';
import {
  TRAIT_FILTERS,
  getBrandReview,
  getClinicSafetyAudit,
  matchesTraitFilters,
  normalizeTraitFilters,
  pickCompactTraits,
  toggleTraitFilters,
  type ClinicTrait
} from './data/brand-reviews.ts';
import { getClinicAiRating } from './lib/ai-rating.ts';
import { renderBookingChannelsHtml } from './lib/clinic-trust-ui.ts';

const dataset = rawDataset as unknown as PriceDataset;
const TOTAL_CLINIC_COUNT = dataset.places.length;
const TOTAL_BRAND_COUNT = new Set(dataset.places.map((p) => p.brandJa)).size;
let naverFx: NaverFxSnapshot = rawNaverFx as unknown as NaverFxSnapshot;

const STORAGE_LANG_KEY = 'seoul_payback_lang';
const SESSION_LOC_KEY = 'dopagaki_user_loc_v1';
const APP_BASE_PATH = detectAppBasePath(window.location.pathname);

function loadCachedUserLocation(): { lat: number; lng: number } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_LOC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat?: unknown; lng?: unknown };
    if (
      typeof parsed.lat === 'number' &&
      typeof parsed.lng === 'number' &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lng)
    ) {
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function saveCachedUserLocation(coords: { lat: number; lng: number }): void {
  try {
    sessionStorage.setItem(SESSION_LOC_KEY, JSON.stringify(coords));
  } catch {
    // ignore storage errors
  }
}

const PRIMARY_AREAS: Array<{ id: AreaId; ko: string; ja: string }> = [
  { id: 'gangnam', ko: '강남', ja: '江南' },
  { id: 'hongdae', ko: '홍대', ja: '弘大' },
  { id: 'myeongdong', ko: '명동', ja: '明洞' },
  { id: 'sinchon', ko: '신촌', ja: '新村' }
];

const EXTRA_AREA_IDS: AreaId[] = [
  'jamsil',
  'seongsu',
  'yeouido',
  'magok',
  'nowon',
  'cheonho',
  'gwanak',
  'yongsan'
];

const EXTRA_SHORT: Record<string, { ko: string; ja: string }> = {
  jamsil: { ko: '잠실', ja: '蚕室' },
  seongsu: { ko: '성수 건대', ja: '聖水 建大' },
  yeouido: { ko: '여의도 영등포', ja: '汝矣島 永登浦' },
  magok: { ko: '마곡 김포', ja: '麻谷 金浦' },
  nowon: { ko: '노원 강북', ja: '盧原 江北' },
  cheonho: { ko: '천호 강동', ja: '千戸 江東' },
  gwanak: { ko: '신림 서울대', ja: '新林 ソウル大' },
  yongsan: { ko: '용산 공덕', ja: '龍山 孔徳' }
};

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

const VALID_AREAS: AreaId[] = [
  'all',
  'sinchon',
  'hongdae',
  'myeongdong',
  'yongsan',
  'gangnam',
  'jamsil',
  'seongsu',
  'yeouido',
  'magok',
  'nowon',
  'cheonho',
  'gwanak'
];

function renderJpBadge(label: string): string {
  return `<span class="tg-jp-badge"><span class="tg-jp-code">JP</span><span class="tg-jp-lbl">${escapeHtml(label)}</span></span>`;
}

function renderTraitChipsHtml(traits: ClinicTrait[], lang: Lang): string {
  return traits
    .map((t) => {
      const lbl = lang === 'ja' ? t.labelJa : t.labelKo;
      const iconSvg = icons[t.icon];
      return `<span class="trait-chip is-${t.tone}">${iconSvg}<span>${escapeHtml(lbl)}</span></span>`;
    })
    .join('');
}

const VALID_SORTS: SortId[] = ['savings', 'rating', 'price', 'distance'];

function parseHomeQuery(search: string) {
  const params = new URLSearchParams(search);
  const langParam = params.get('lang');
  const menuParam = params.get('menu');
  const menuId = dataset.menus.find((m) => m.id === menuParam)?.id ?? dataset.menus[0].id;
  const areaParam = params.get('area');
  const area: AreaId = VALID_AREAS.includes(areaParam as AreaId) ? (areaParam as AreaId) : 'all';
  const sortParam = params.get('sort');
  const sort: SortId = VALID_SORTS.includes(sortParam as SortId) ? (sortParam as SortId) : 'savings';
  const traitParam = params.get('trait') ?? '';
  const traitFilters = normalizeTraitFilters(
    traitParam
      .split(',')
      .map((s) => s.trim() as TraitFilterId)
      .filter(Boolean)
  );
  const includeVat = params.get('vat') === '0' ? false : true;
  const searchQuery = params.get('q') ?? '';
  const japaneseOnly = params.get('jp') === '1';

  return {
    langParam,
    menuId,
    area,
    sort,
    traitFilters,
    includeVat,
    searchQuery,
    japaneseOnly
  };
}

function loadInitialState(): AppState {
  const parsed = parseHomeQuery(window.location.search);
  let savedLang: string | null = null;
  try {
    savedLang = localStorage.getItem(STORAGE_LANG_KEY);
  } catch {
    savedLang = null;
  }
  const lang: Lang =
    parsed.langParam === 'ko' || parsed.langParam === 'ja'
      ? parsed.langParam
      : savedLang === 'ko'
        ? 'ko'
        : 'ja';

  const krwPer100Jpy = naverFx.krwPer100Jpy || dataset.meta.defaultKrwPer100Jpy;

  return {
    lang,
    menuId: parsed.menuId,
    area: parsed.area,
    sort: parsed.sort,
    traitFilters: parsed.traitFilters,
    searchQuery: parsed.searchQuery,
    japaneseOnly: parsed.japaneseOnly,
    includeVat: parsed.includeVat,
    krwPer100Jpy,
    selectedPlaceId: null,
    hoveredPlaceId: null,
    detailPlaceId: null,
    guideOpen: false,
    shareOpen: false,
    shareLang: lang,
    moreAreasOpen: EXTRA_AREA_IDS.includes(parsed.area),
    searchOpen: parsed.searchQuery.trim().length > 0,
    activeTab: 'list',
    userLocation: loadCachedUserLocation(),
    locatingUser: false
  };
}

function buildHomeUrl(state: AppState, overrideLang?: Lang): string {
  const url = new URL(APP_BASE_PATH, window.location.origin);
  const p = new URLSearchParams();
  p.set('lang', overrideLang ?? state.lang);
  p.set('menu', state.menuId);
  if (state.area !== 'all') p.set('area', state.area);
  if (state.sort !== 'savings') p.set('sort', state.sort);
  if (state.traitFilters.length > 0) p.set('trait', state.traitFilters.join(','));
  if (!state.includeVat) p.set('vat', '0');
  if (state.japaneseOnly) p.set('jp', '1');
  if (state.searchQuery.trim()) p.set('q', state.searchQuery.trim());
  url.search = p.toString();
  return url.toString();
}

function buildShareUrl(
  state: AppState,
  overrideLang?: Lang,
  activeClinic?: { clinicId: string; menus: string[]; visits: number } | null
): string {
  if (activeClinic) {
    return buildClinicUrl(window.location.origin, APP_BASE_PATH, activeClinic.clinicId, {
      lang: overrideLang ?? state.lang,
      menuId: state.menuId,
      menus: activeClinic.menus,
      visits: activeClinic.visits,
      includeVat: state.includeVat
    });
  }
  return buildHomeUrl(state, overrideLang);
}

function syncUrl(
  state: AppState,
  activeClinic?: { clinicId: string; menus: string[]; visits: number } | null
): void {
  try {
    const nextUrl = buildShareUrl(state, undefined, activeClinic);
    window.history.replaceState(null, '', nextUrl);
  } catch {
    // Ignore history restrictions
  }
}

function bootstrap(): void {
  const root = document.getElementById('app');
  if (!root) return;

  const state = loadInitialState();

  root.innerHTML = `
    <header class="sitehead" id="sitehead"></header>
    <main class="screen" id="screen">
      <div class="home-view" id="home-view">
        <section class="ticker-grid" id="ticker" aria-label="Exchange Rate and Benchmark"></section>
        <section class="board-controls" id="controls" aria-label="Treatment and District"></section>
        <section class="treat-guide-card" id="treat-guide-card" aria-label="Treatment Effects"></section>
        <section class="rank" id="rank" aria-label="Clinic Price Ledger"></section>
      </div>
      <div class="clinic-view" id="clinic-view" hidden></div>
    </main>
    <footer class="sitefoot" id="sitefoot"></footer>
    <nav class="apptab" id="apptab" aria-label="Mobile Navigation"></nav>
    <div class="toast" id="toast" role="status" aria-live="polite" aria-hidden="true"></div>
    <div class="drawer-backdrop" id="detail-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="detail-drawer-title"></div>
    <div class="drawer-backdrop" id="guide-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="guide-drawer-title"></div>
    <div class="drawer-backdrop" id="share-modal" hidden role="dialog" aria-modal="true" aria-labelledby="share-modal-title"></div>
    <div class="drawer-backdrop" id="recommender-modal" hidden role="dialog" aria-modal="true" aria-labelledby="recommender-modal-title"></div>
    <div class="drawer-backdrop" id="staff-card-modal" hidden role="dialog" aria-modal="true" aria-labelledby="staff-card-title"></div>
  `;

  const siteheadEl = document.getElementById('sitehead')!;
  const homeViewEl = document.getElementById('home-view')!;
  const clinicViewEl = document.getElementById('clinic-view')!;
  const tickerEl = document.getElementById('ticker')!;
  const controlsEl = document.getElementById('controls')!;
  const treatGuideEl = document.getElementById('treat-guide-card')!;
  const rankEl = document.getElementById('rank')!;
  const sitefootEl = document.getElementById('sitefoot')!;
  const apptabEl = document.getElementById('apptab')!;
  const toastEl = document.getElementById('toast')!;
  const detailDrawerEl = document.getElementById('detail-drawer')!;
  const guideDrawerEl = document.getElementById('guide-drawer')!;
  const shareModalEl = document.getElementById('share-modal')!;
  const recommenderModalEl = document.getElementById('recommender-modal')!;
  const staffCardModalEl = document.getElementById('staff-card-modal')!;

  const toast = new FluidToast(toastEl);
  let currentRows: ComputedRow[] = [];
  let copyResetTimer = 0;
  let activeClinicId: string | null = null;
  let savedHomeScrollY = 0;
  let treatGuideOpen = false;
  let recommenderOpen = false;
  let recAnswers: RecommenderAnswers = {
    concerns: [],
    schedule: null,
    preference: null,
    traitFilters: [],
    japaneseOnly: false
  };

  function showToast(message: string, isOk = false): void {
    toast.show(`${isOk ? icons.check : icons.info}<span>${escapeHtml(message)}</span>`, isOk);
  }

  function isSheetOpen(el: HTMLElement): boolean {
    return !el.hidden && !el.classList.contains('is-closing');
  }

  function setActiveTab(tab: AppState['activeTab']): void {
    state.activeTab = tab;
    apptabEl.querySelectorAll<HTMLButtonElement>('.apptab-btn').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.tab === tab);
    });
  }

  function closeDetailDrawer(): void {
    state.detailPlaceId = null;
    closeSheet(detailDrawerEl, () => {
      if (!state.detailPlaceId) detailDrawerEl.innerHTML = '';
    });
  }

  function closeGuideDrawer(): void {
    state.guideOpen = false;
    if (state.activeTab === 'guide') setActiveTab('list');
    closeSheet(guideDrawerEl, () => {
      if (!state.guideOpen) guideDrawerEl.innerHTML = '';
    });
  }

  function closeShareModal(): void {
    state.shareOpen = false;
    if (state.activeTab === 'share') setActiveTab('list');
    closeSheet(shareModalEl, () => {
      if (!state.shareOpen) shareModalEl.innerHTML = '';
    });
  }

  function closeRecommenderModal(): void {
    recommenderOpen = false;
    closeSheet(recommenderModalEl, () => {
      if (!recommenderOpen) recommenderModalEl.innerHTML = '';
    });
  }

  function getActiveClinicUrlMeta(): { clinicId: string; menus: string[]; visits: number } | null {
    if (!activeClinicId) return null;
    const cs = clinicPage.getState();
    return {
      clinicId: activeClinicId,
      menus: cs?.selectedMenus ?? [state.menuId],
      visits: cs?.visits ?? 1
    };
  }

  function getClinicContext() {
    return {
      dataset,
      naverFx,
      lang: state.lang,
      primaryMenuId: state.menuId,
      includeVat: state.includeVat,
      krwPer100Jpy: state.krwPer100Jpy,
      userLocation: state.userLocation,
      locatingUser: state.locatingUser
    };
  }

  function updateDocumentTitle(): void {
    if (activeClinicId) {
      const place = dataset.places.find((p) => p.id === activeClinicId);
      if (place) {
        document.title =
          state.lang === 'ja'
            ? `${place.nameJa} 料金・オーダーシート | ドパガキ美肌相場`
            : `${place.nameKo} 시세·오더시트 | 도파가키 피부시세`;
        return;
      }
    }
    document.title =
      state.lang === 'ja'
        ? `ドパガキ美肌相場 | ソウル美容皮膚科${TOTAL_CLINIC_COUNT}院 × 日本主要5院平均 3秒比較`
        : `도파가키 피부시세 | 서울 피부과 ${TOTAL_CLINIC_COUNT}곳 × 일본 5개 병원 평균 3초 비교`;
  }

  const clinicPage = new ClinicPageController(clinicViewEl, staffCardModalEl, {
    onBack: () => {
      navigateToHome(true);
    },
    onSelectClinic: (clinicId) => {
      navigateToClinic(clinicId, true);
    },
    onToggleVat: (nextVat) => {
      state.includeVat = nextVat;
      syncUrl(state, getActiveClinicUrlMeta());
      renderControls();
      renderRank(false);
      clinicPage.updateContext(getClinicContext());
    },
    onOpenShare: () => {
      state.shareOpen = true;
      state.shareLang = state.lang;
      void renderShareModal(state.lang);
    },
    onStateChange: () => {
      syncUrl(state, getActiveClinicUrlMeta());
    },
    onShowToast: (msg, isOk) => {
      showToast(msg, isOk);
    },
    onRequestLocation: () => {
      requestUserLocation({ silent: false });
    }
  });

  function navigateToClinic(
    placeId: string,
    pushHistory: boolean,
    initialMenus?: string[],
    initialVisits = 1
  ): void {
    const place = dataset.places.find((p) => p.id === placeId);
    if (!place) {
      navigateToHome(false);
      return;
    }

    if (!activeClinicId) {
      savedHomeScrollY = window.scrollY;
    }
    if (state.detailPlaceId) closeDetailDrawer();
    if (state.guideOpen) closeGuideDrawer();
    if (state.shareOpen) closeShareModal();
    if (recommenderOpen) closeRecommenderModal();

    activeClinicId = place.id;
    state.selectedPlaceId = place.id;
    homeViewEl.hidden = true;
    clinicViewEl.hidden = false;
    document.body.classList.add('is-clinic-view');

    clinicPage.open(place, getClinicContext(), initialMenus, initialVisits);
    updateDocumentTitle();

    const targetUrl = buildShareUrl(state, undefined, getActiveClinicUrlMeta());
    try {
      if (pushHistory) {
        window.history.pushState({ view: 'clinic', clinicId: place.id }, '', targetUrl);
      } else {
        window.history.replaceState({ view: 'clinic', clinicId: place.id }, '', targetUrl);
      }
    } catch {
      // ignore history restrictions
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  function navigateToHome(pushHistory: boolean, targetScroll?: 'list'): void {
    if (clinicPage.isStaffModalOpen()) clinicPage.closeStaffModal();
    activeClinicId = null;
    treatGuideOpen = false;
    clinicViewEl.hidden = true;
    homeViewEl.hidden = false;
    document.body.classList.remove('is-clinic-view');
    renderTreatGuide();
    updateDocumentTitle();
    scheduleHomeEntryBurstOnce();

    const homeUrl = buildHomeUrl(state);
    try {
      if (pushHistory) {
        window.history.pushState({ view: 'home' }, '', homeUrl);
      } else {
        window.history.replaceState({ view: 'home' }, '', homeUrl);
      }
    } catch {
      // ignore history restrictions
    }

    requestAnimationFrame(() => {
      if (targetScroll === 'list') {
        rankEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: savedHomeScrollY, behavior: 'instant' as ScrollBehavior });
      }
    });
  }

  function requestUserLocation(options: { silent?: boolean } = {}): void {
    const { silent = false } = options;
    if (state.locatingUser) return;
    const copy = getCopy(state.lang);
    if (!('geolocation' in navigator)) {
      if (!silent) showToast(copy.toastLocateUnsupported);
      return;
    }

    state.locatingUser = true;
    renderRank(false);
    if (activeClinicId) clinicPage.updateContext(getClinicContext());

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        state.locatingUser = false;
        state.userLocation = coords;
        saveCachedUserLocation(coords);

        const inKorea = isPointInSouthKorea(coords);
        renderRank(false);
        if (state.detailPlaceId) renderDetailDrawer();
        if (activeClinicId) clinicPage.updateContext(getClinicContext());

        if (!silent) {
          const liveCopy = getCopy(state.lang);
          if (!inKorea) {
            showToast(
              state.lang === 'ja'
                ? '現在海外にいるため距離を非表示にしています（韓国到着後に表示）'
                : '현재 해외 위치라 거리를 숨겼어요 (한국 도착 후 자동 표시)'
            );
            return;
          }
          const allFromUser = buildRankedRows(
            dataset,
            state.menuId,
            'all',
            'distance',
            state.krwPer100Jpy,
            state.includeVat,
            { origin: coords }
          );
          const closest = allFromUser[0];
          if (closest && closest.distanceMeters <= 30000) {
            const clinicName =
              state.lang === 'ja' ? closest.place.nameJa : closest.place.nameKo;
            const distText =
              closest.distanceMeters < 1000
                ? `${closest.distanceMeters}m`
                : `${(closest.distanceMeters / 1000).toFixed(1)}km`;
            showToast(liveCopy.toastLocateMoved(clinicName, distText), true);
          } else {
            showToast(liveCopy.toastLocateOutsideSeoul, true);
          }
        }
      },
      (err) => {
        state.locatingUser = false;
        renderRank(false);
        if (activeClinicId) clinicPage.updateContext(getClinicContext());
        if (!silent) {
          const liveCopy = getCopy(state.lang);
          if (err.code === err.PERMISSION_DENIED) {
            showToast(liveCopy.toastLocateDenied);
          } else {
            showToast(liveCopy.toastLocateError);
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  function updateActiveRowDom(placeId: string | null, scrollIntoView: boolean): void {
    const scrollBox = rankEl.querySelector<HTMLElement>('#rows-scroll');
    rankEl.querySelectorAll<HTMLElement>('.row').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.placeId === placeId);
    });
    if (scrollIntoView && placeId && scrollBox) {
      const target = scrollBox.querySelector<HTMLElement>(`.row[data-place-id="${placeId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  async function refreshLiveNaverFx(): Promise<void> {
    try {
      const fxUrl = new URL(`${APP_BASE_PATH}naver-fx.json`, window.location.origin);
      fxUrl.searchParams.set('v', String(Date.now()));
      const res = await fetch(fxUrl.toString(), { cache: 'no-store' });
      if (!res.ok) return;
      const fresh = (await res.json()) as Partial<NaverFxSnapshot>;
      if (
        typeof fresh?.krwPer100Jpy !== 'number' ||
        !Number.isFinite(fresh.krwPer100Jpy) ||
        fresh.krwPer100Jpy < 600 ||
        fresh.krwPer100Jpy > 1500
      ) {
        return;
      }
      const changed =
        fresh.krwPer100Jpy !== naverFx.krwPer100Jpy || fresh.dateLabel !== naverFx.dateLabel;
      naverFx = { ...naverFx, ...fresh };
      if (changed) {
        state.krwPer100Jpy = naverFx.krwPer100Jpy;
        renderTicker();
        renderRank(false);
        renderSiteFoot();
        if (state.detailPlaceId) renderDetailDrawer();
        if (activeClinicId) clinicPage.updateContext(getClinicContext());
      }
    } catch {
      // Keep bundled Naver FX snapshot
    }
  }

  /* =========================================================
     1. Ruled Masthead with Bespoke Dopagaki Print Emblem
     ========================================================= */
  const brandDopamine = createBrandDopamineBurst(() =>
    siteheadEl.querySelector<HTMLElement>('#brand-home-btn')
  );
  let hasScheduledHomeBurst = false;

  function scheduleHomeEntryBurstOnce(): void {
    if (hasScheduledHomeBurst || activeClinicId) return;
    hasScheduledHomeBurst = true;
    const run = (): void => {
      window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          if (!activeClinicId) {
            brandDopamine.fireOnce();
          }
        });
      }, 220);
    };
    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
      void document.fonts.ready.then(run);
    } else {
      run();
    }
  }

  function renderMisregWord(word: string): string {
    const glyphs = Array.from(word)
      .map((ch) => `<span class="dopa-char" aria-hidden="true">${escapeHtml(ch)}</span>`)
      .join('');
    return `<span class="misreg" data-text="${escapeHtml(word)}" aria-label="${escapeHtml(word)}">${glyphs}</span>`;
  }

  function renderSiteHead(): void {
    document.documentElement.lang = state.lang;
    const copy = getCopy(state.lang);
    updateDocumentTitle();

    const totalCount = dataset.places.length;
    const metaText =
      state.lang === 'ja'
        ? `ソウル${TOTAL_BRAND_COUNT}ブランド ${totalCount}院 公式料金`
        : `서울 ${TOTAL_BRAND_COUNT}개 브랜드 ${totalCount}곳 공식가`;
    const brandHtml =
      state.lang === 'ja'
        ? `${renderMisregWord('ドパガキ')}美肌相場`
        : `${renderMisregWord('도파가키')} 피부시세`;

    if (!siteheadEl.querySelector('#brand-word')) {
      siteheadEl.innerHTML = `
        <div class="shrow">
          <button type="button" class="shleft shleft-btn" id="brand-home-btn">
            <img class="brand-emblem" src="${dopagakiMarkUrl}" width="48" height="48" alt="" fetchpriority="high" />
            <div class="brand-stack">
              <span class="logo-word" id="brand-word" data-lang="${state.lang}">${brandHtml}</span>
              <span class="brand-meta" id="brand-meta">${escapeHtml(metaText)}</span>
            </div>
          </button>
          <div class="shright">
            <button type="button" class="sh-btn" id="head-share-btn">
              ${icons.share}
              <span id="head-share-label">${escapeHtml(copy.shareBtn)}</span>
            </button>
            <div class="lang-switch" id="head-lang-switch" role="group" aria-label="Language">
              <button type="button" class="lang-btn" data-lang="ja" aria-pressed="${state.lang === 'ja'}">日本語</button>
              <button type="button" class="lang-btn" data-lang="ko" aria-pressed="${state.lang === 'ko'}">한국어</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const brandEl = siteheadEl.querySelector<HTMLElement>('#brand-word');
    const metaEl = siteheadEl.querySelector<HTMLElement>('#brand-meta');
    const shareLblEl = siteheadEl.querySelector<HTMLElement>('#head-share-label');
    if (brandEl && brandEl.dataset.lang !== state.lang) {
      brandEl.innerHTML = brandHtml;
      brandEl.dataset.lang = state.lang;
    }
    if (metaEl) metaEl.textContent = metaText;
    if (shareLblEl) shareLblEl.textContent = copy.shareBtn;
    siteheadEl.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === state.lang));
    });
  }

  /* =========================================================
     2. 3-Cell Two-Drum Quote Ticker (Naver FX | JP 5-Clinic Avg | 2026 VAT)
     ========================================================= */
  function renderTicker(): void {
    const copy = getCopy(state.lang);
    const activeMenu = dataset.menus.find((m) => m.id === state.menuId) ?? dataset.menus[0];
    const bank = state.lang === 'ja' ? naverFx.bankJa : naverFx.bankKo;
    const rateStr = formatRate(state.krwPer100Jpy);
    const jpSource =
      state.lang === 'ja'
        ? activeMenu.jpSourceName
        : activeMenu.jpSourceNameKo ?? activeMenu.jpSourceName;
    const fxSub = `${naverFx.dateLabel} ${bank}`;

    tickerEl.innerHTML = `
      <a
        class="ticker-cell ticker-cell--fx"
        href="${escapeHtml(naverFx.sourceUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="ticker-kicker">${escapeHtml(copy.naverFxLabel)} ${icons.external}</span>
        <strong class="ticker-value num">100¥ = ₩${escapeHtml(rateStr)}</strong>
        <span class="ticker-sub num">${escapeHtml(fxSub)}</span>
      </a>

      <button
        type="button"
        class="ticker-cell ticker-cell--jp"
        id="open-jp-avg-btn"
      >
        <span class="ticker-kicker">${escapeHtml(copy.jpBenchmarkLabel)} ${icons.info}</span>
        <strong class="ticker-value num">${escapeHtml(formatJpy(activeMenu.jpBenchmarkJpy))}</strong>
        <span class="ticker-sub">${escapeHtml(jpSource)}</span>
      </button>

      <div class="ticker-cell ticker-cell--vat grained">
        <span class="ticker-kicker">2026 VAT</span>
        <div class="ticker-vat-row">
          <span class="ticker-vat-text">${escapeHtml(copy.vatNoticeTitle)}</span>
          <button type="button" class="ticker-vat-btn" id="open-guide-btn">${escapeHtml(copy.vatNoticeBtn)}</button>
        </div>
      </div>
    `;
  }

  /* =========================================================
     3. Ruled Treatment & Seoul District Coded Matrix
     ========================================================= */
  function renderControls(): void {
    const menus = dataset.menus;
    const activeMenu = menus.find((m) => m.id === state.menuId) ?? menus[0];

    const allInMenu = buildRankedRows(
      dataset,
      state.menuId,
      'all',
      state.sort,
      state.krwPer100Jpy,
      state.includeVat,
      {
        searchQuery: state.searchQuery,
        japaneseOnly: state.japaneseOnly,
        origin: state.userLocation,
        placeFilter:
          state.traitFilters.length === 0
            ? undefined
            : (place) => matchesTraitFilters(place, state.traitFilters)
      }
    );
    const countByArea = new Map<string, number>();
    for (const r of allInMenu) {
      countByArea.set(r.place.area, (countByArea.get(r.place.area) ?? 0) + 1);
    }

    const isExtraActive = EXTRA_AREA_IDS.includes(state.area);
    const extraBtnLabel = isExtraActive
      ? state.lang === 'ja'
        ? EXTRA_SHORT[state.area].ja
        : EXTRA_SHORT[state.area].ko
      : state.lang === 'ja'
        ? 'その他'
        : '그 외';
    const allLabel = state.lang === 'ja' ? '全体' : '전체';

    const moreAreasHtml = EXTRA_AREA_IDS.map((id) => {
      const cnt = countByArea.get(id) ?? 0;
      const label = state.lang === 'ja' ? EXTRA_SHORT[id].ja : EXTRA_SHORT[id].ko;
      return `
        <button type="button" class="more-area-btn" data-area="${id}" aria-pressed="${state.area === id}">
          <span>${escapeHtml(label)}</span>
          <span class="more-area-count num">${cnt}</span>
        </button>
      `;
    }).join('');

    const assistHint =
      state.lang === 'ja'
        ? 'どの施術がいいか迷ったら？'
        : '어떤 시술이 맞을지 모르겠다면?';
    const assistBtnLabel =
      state.lang === 'ja'
        ? 'お悩みから施術を探す →'
        : '내 고민으로 시술 추천 받기 →';

    if (!controlsEl.querySelector('#more-areas-collapse')) {
      controlsEl.innerHTML = `
        <div class="ctrl-assist-bar">
          <span class="ctrl-assist-hint" id="ctrl-assist-hint">${escapeHtml(assistHint)}</span>
          <button type="button" class="ctrl-assist-btn" id="open-recommender-btn">
            ${icons.spark}
            <span id="open-recommender-label">${escapeHtml(assistBtnLabel)}</span>
          </button>
        </div>

        <div class="treat-grid" id="treat-grid" role="group" aria-label="Treatment">
          ${menus
            .map((m) => {
              const selected = m.id === activeMenu.id;
              const label = state.lang === 'ja' ? m.shortJa : m.shortKo;
              return `
                <button type="button" class="treat-cell" data-menu="${m.id}" aria-pressed="${selected}">
                  <span class="treat-label">${escapeHtml(label)}</span>
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="area-grid" id="area-grid" role="group" aria-label="Seoul District">
          <button type="button" class="area-cell" id="area-all-btn" data-area="all" aria-pressed="${state.area === 'all'}">${escapeHtml(allLabel)}</button>
          ${PRIMARY_AREAS.map(
            (a) => `
              <button type="button" class="area-cell" data-area="${a.id}" aria-pressed="${state.area === a.id}">
                ${escapeHtml(state.lang === 'ja' ? a.ja : a.ko)}
              </button>
            `
          ).join('')}
          <button
            type="button"
            class="area-cell"
            id="toggle-more-areas"
            aria-expanded="${state.moreAreasOpen}"
            aria-pressed="${isExtraActive}"
          >
            <span id="extra-area-label">${escapeHtml(extraBtnLabel)}</span>
            <span class="area-cell-caret" aria-hidden="true">${icons.chevronDown}</span>
          </button>
        </div>

        <div class="collapse-wrap ${state.moreAreasOpen ? 'is-open' : ''}" id="more-areas-collapse" ${state.moreAreasOpen ? '' : 'inert'}>
          <div class="collapse-inner">
            <div class="more-areas-wrap">
              <div class="more-areas-content" id="more-areas-content">${moreAreasHtml}</div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const assistHintEl = controlsEl.querySelector<HTMLElement>('#ctrl-assist-hint');
    if (assistHintEl) assistHintEl.textContent = assistHint;
    const assistBtnLblEl = controlsEl.querySelector<HTMLElement>('#open-recommender-label');
    if (assistBtnLblEl) assistBtnLblEl.textContent = assistBtnLabel;

    const treatBtns = controlsEl.querySelectorAll<HTMLButtonElement>('.treat-cell');
    menus.forEach((m, i) => {
      const btn = treatBtns[i];
      if (!btn) return;
      btn.dataset.menu = m.id;
      btn.setAttribute('aria-pressed', String(m.id === activeMenu.id));
      const lbl = btn.querySelector('.treat-label');
      if (lbl) lbl.textContent = state.lang === 'ja' ? m.shortJa : m.shortKo;
    });

    const allBtn = controlsEl.querySelector<HTMLButtonElement>('#area-all-btn');
    if (allBtn) {
      allBtn.textContent = allLabel;
      allBtn.setAttribute('aria-pressed', String(state.area === 'all'));
    }

    PRIMARY_AREAS.forEach((a) => {
      const btn = controlsEl.querySelector<HTMLButtonElement>(`.area-cell[data-area="${a.id}"]`);
      if (!btn) return;
      btn.textContent = state.lang === 'ja' ? a.ja : a.ko;
      btn.setAttribute('aria-pressed', String(state.area === a.id));
    });

    const moreToggle = controlsEl.querySelector<HTMLButtonElement>('#toggle-more-areas');
    const extraLbl = controlsEl.querySelector<HTMLElement>('#extra-area-label');
    if (moreToggle) {
      moreToggle.setAttribute('aria-expanded', String(state.moreAreasOpen));
      moreToggle.setAttribute('aria-pressed', String(isExtraActive));
    }
    if (extraLbl) extraLbl.textContent = extraBtnLabel;

    const collapseEl = controlsEl.querySelector<HTMLElement>('#more-areas-collapse');
    const contentEl = controlsEl.querySelector<HTMLElement>('#more-areas-content');
    if (collapseEl) {
      collapseEl.classList.toggle('is-open', state.moreAreasOpen);
      if (state.moreAreasOpen) {
        collapseEl.removeAttribute('inert');
      } else {
        collapseEl.setAttribute('inert', '');
      }
    }
    if (contentEl) contentEl.innerHTML = moreAreasHtml;
  }

  /* =========================================================
     4. Ruled Clinic Price Ledger (.rank)
     ========================================================= */
  function renderRank(_fitMapBounds = false): void {
    const copy = getCopy(state.lang);

    const rowsBeforeJpFilter = buildRankedRows(
      dataset,
      state.menuId,
      state.area,
      state.sort,
      state.krwPer100Jpy,
      state.includeVat,
      {
        searchQuery: state.searchQuery,
        japaneseOnly: false,
        origin: state.userLocation
      }
    );

    const baseRowsForTraits = state.japaneseOnly
      ? rowsBeforeJpFilter.filter((r) => r.place.japaneseSupport)
      : rowsBeforeJpFilter;

    const jpAvailableCount = (
      state.traitFilters.length === 0
        ? rowsBeforeJpFilter
        : rowsBeforeJpFilter.filter((r) => matchesTraitFilters(r.place, state.traitFilters))
    ).filter((r) => r.place.japaneseSupport).length;

    currentRows =
      state.traitFilters.length === 0
        ? baseRowsForTraits
        : baseRowsForTraits.filter((r) => matchesTraitFilters(r.place, state.traitFilters));

    const traitFilterBarLabel =
      state.traitFilters.length > 0
        ? state.lang === 'ja'
          ? `特徴·${state.traitFilters.length}`
          : `특성·${state.traitFilters.length}`
        : state.lang === 'ja'
          ? '特徴(複数可)'
          : '특성(복수)';
    const traitFilterButtonsHtml = TRAIT_FILTERS.map((tf) => {
      const isAll = tf.id === 'all';
      const pressed = isAll
        ? state.traitFilters.length === 0
        : state.traitFilters.includes(tf.id);
      const count = isAll
        ? baseRowsForTraits.length
        : baseRowsForTraits.filter((r) =>
            matchesTraitFilters(
              r.place,
              pressed ? state.traitFilters : [...state.traitFilters, tf.id]
            )
          ).length;
      const lbl = state.lang === 'ja' ? tf.labelJa : tf.labelKo;
      const iconSvg = tf.icon ? icons[tf.icon] : '';
      return `
        <button
          type="button"
          class="trait-filter-btn"
          data-trait-filter="${tf.id}"
          aria-pressed="${pressed}"
          ${!isAll && count === 0 && !pressed ? 'disabled' : ''}
        >
          ${iconSvg}
          <span>${escapeHtml(lbl)}</span>
          <span class="trait-filter-cnt num">${count}</span>
        </button>
      `;
    }).join('');

    if (
      state.selectedPlaceId &&
      !currentRows.some((r) => r.place.id === state.selectedPlaceId)
    ) {
      state.selectedPlaceId = null;
    }

    const searchBtnText = state.searchQuery.trim()
      ? state.searchQuery.trim()
      : state.lang === 'ja'
        ? '検索'
        : '검색';

    const sortSavingsLabel = state.lang === 'ja' ? 'おトク順' : '절약순';
    const sortRatingLabel = state.lang === 'ja' ? 'AI評価順' : 'AI평점순';
    const sortDistanceLabel = state.lang === 'ja' ? '近い順' : '거리순';
    const vatShortLabel = state.lang === 'ja' ? '税込+10%' : '세금+10%';
    const jpShortLabel = state.lang === 'ja' ? '日本語OKのみ' : '일본어 가능만';
    const saveSubLabel = state.lang === 'ja' ? 'おトク' : '아낌';
    const overSubLabel = state.lang === 'ja' ? '日本安' : '일본 저렴';

    const activeMenu = dataset.menus.find((m) => m.id === state.menuId) ?? dataset.menus[0];
    const seoulAvg = computeSeoulAverage(
      dataset.places,
      activeMenu,
      state.krwPer100Jpy,
      state.includeVat,
      dataset.meta.vatRate
    );
    const seoulAvgBarText =
      state.lang === 'ja'
        ? `ソウル${seoulAvg.sampleCount}院平均 ${formatJpy(seoulAvg.avgTotalJpy)} (${formatKrw(seoulAvg.avgTotalKrw)} · ${state.includeVat ? '税込10%' : '税別'})`
        : `서울 ${seoulAvg.sampleCount}곳 평균 ${formatJpy(seoulAvg.avgTotalJpy)} (${formatCompactKrw(seoulAvg.avgTotalKrw, 'ko')} · ${state.includeVat ? '부가세 10% 포함' : '부가세 별도'})`;

    const inKoreaLoc = isPointInSouthKorea(state.userLocation);
    const hasForeignLoc = Boolean(state.userLocation && !inKoreaLoc);

    const locChipText = state.locatingUser
      ? state.lang === 'ja'
        ? '現在地を確認中…'
        : '현재 위치 확인 중…'
      : inKoreaLoc
        ? state.lang === 'ja'
          ? '現在地から表示中'
          : '현재 위치 기준'
        : hasForeignLoc
          ? state.lang === 'ja'
            ? '韓国到着後に距離表示'
            : '한국 도착 후 거리 표시'
          : state.lang === 'ja'
            ? '現在地から距離を見る'
            : '현재 위치로 거리 보기';

    const locChipHtml = `
      <button
        type="button"
        class="loc-chip-btn ${inKoreaLoc ? 'is-active' : ''}"
        id="rank-locate-btn"
        ${state.locatingUser ? 'disabled' : ''}
      >
        ${icons.locate}
        <span>${escapeHtml(locChipText)}</span>
      </button>
    `;

    if (!rankEl.querySelector('#rankhead')) {
      rankEl.innerHTML = `
        <div class="rankhead" id="rankhead">
          <div class="rankhead-left">
            <button type="button" class="jp-toggle-btn" id="jp-only-btn" aria-pressed="${state.japaneseOnly}">
              <span class="jp-toggle-code">JP</span>
              <span id="jp-only-label">${escapeHtml(jpShortLabel)}</span>
              <span class="jp-toggle-cnt num" id="jp-only-cnt">${jpAvailableCount}</span>
            </button>
            <label class="chk-label" id="vat-chk-wrap">
              <input type="checkbox" id="vat-chk" ${state.includeVat ? 'checked' : ''} />
              <span id="vat-chk-label">${escapeHtml(vatShortLabel)}</span>
            </label>
            <button type="button" class="search-toggle-btn" id="search-toggle-btn" aria-expanded="${state.searchOpen}">
              ${icons.search}
              <span id="search-toggle-label">${escapeHtml(searchBtnText)}</span>
            </button>
          </div>

          <div class="rankhead-right">
            <div class="sorts" id="sorts-switch" role="group" aria-label="Sort">
              <button type="button" class="sort-btn" data-sort="savings" aria-pressed="${state.sort !== 'distance' && state.sort !== 'rating'}">${escapeHtml(sortSavingsLabel)}</button>
              <button type="button" class="sort-btn" data-sort="rating" aria-pressed="${state.sort === 'rating'}">${escapeHtml(sortRatingLabel)}</button>
              <button type="button" class="sort-btn" data-sort="distance" aria-pressed="${state.sort === 'distance'}">${escapeHtml(sortDistanceLabel)}</button>
            </div>
          </div>
        </div>

        <div class="trait-filter-bar" id="trait-filter-bar" role="group" aria-label="${escapeHtml(state.lang === 'ja' ? 'クリニック特徴フィルター' : '병원 특성 필터')}">
          <span class="trait-filter-kicker${state.traitFilters.length > 0 ? ' is-active' : ''}" id="trait-filter-kicker">${escapeHtml(traitFilterBarLabel)}</span>
          <div class="trait-filter-scroll" id="trait-filter-scroll">${traitFilterButtonsHtml}</div>
        </div>

        <div class="seoul-avg-bar num" id="seoul-avg-bar">
          <span>${escapeHtml(seoulAvgBarText)}</span>
          ${locChipHtml}
        </div>

        <div class="collapse-wrap ${state.searchOpen ? 'is-open' : ''}" id="search-collapse" ${state.searchOpen ? '' : 'inert'}>
          <div class="collapse-inner">
            <div class="search-strip" id="search-strip">
              <div class="search-box">
                <span class="search-icon">${icons.search}</span>
                <input
                  type="search"
                  enterkeyhint="search"
                  autocapitalize="none"
                  autocorrect="off"
                  class="search-input"
                  id="place-search-input"
                  value="${escapeHtml(state.searchQuery)}"
                  placeholder="${escapeHtml(copy.searchPlaceholder)}"
                  aria-label="${escapeHtml(copy.searchPlaceholder)}"
                />
                <button type="button" class="search-clear" id="search-clear-btn" aria-label="${escapeHtml(copy.searchClear)}" ${state.searchQuery ? '' : 'hidden'}>${icons.close}</button>
              </div>
              <span class="search-count num" id="search-count">${escapeHtml(copy.resultsCount(currentRows.length))}</span>
            </div>
          </div>
        </div>

        <div id="rows-container"></div>
      `;
    } else {
      const jpBtn = rankEl.querySelector<HTMLButtonElement>('#jp-only-btn');
      const jpLbl = rankEl.querySelector<HTMLElement>('#jp-only-label');
      const jpCnt = rankEl.querySelector<HTMLElement>('#jp-only-cnt');
      if (jpBtn) jpBtn.setAttribute('aria-pressed', String(state.japaneseOnly));
      if (jpLbl) jpLbl.textContent = jpShortLabel;
      if (jpCnt) jpCnt.textContent = String(jpAvailableCount);

      const vatChk = rankEl.querySelector<HTMLInputElement>('#vat-chk');
      const vatLbl = rankEl.querySelector<HTMLElement>('#vat-chk-label');
      if (vatChk) vatChk.checked = state.includeVat;
      if (vatLbl) vatLbl.textContent = vatShortLabel;

      const searchToggle = rankEl.querySelector<HTMLButtonElement>('#search-toggle-btn');
      const searchToggleLbl = rankEl.querySelector<HTMLElement>('#search-toggle-label');
      if (searchToggle) searchToggle.setAttribute('aria-expanded', String(state.searchOpen));
      if (searchToggleLbl) searchToggleLbl.textContent = searchBtnText;

      const sortsSwitch = rankEl.querySelector<HTMLElement>('#sorts-switch');
      if (sortsSwitch) {
        const savBtn = sortsSwitch.querySelector<HTMLButtonElement>('[data-sort="savings"]');
        const ratBtn = sortsSwitch.querySelector<HTMLButtonElement>('[data-sort="rating"]');
        const dstBtn = sortsSwitch.querySelector<HTMLButtonElement>('[data-sort="distance"]');
        if (savBtn) {
          savBtn.textContent = sortSavingsLabel;
          savBtn.setAttribute('aria-pressed', String(state.sort !== 'distance' && state.sort !== 'rating'));
        }
        if (ratBtn) {
          ratBtn.textContent = sortRatingLabel;
          ratBtn.setAttribute('aria-pressed', String(state.sort === 'rating'));
        }
        if (dstBtn) {
          dstBtn.textContent = sortDistanceLabel;
          dstBtn.setAttribute('aria-pressed', String(state.sort === 'distance'));
        }
      }

      const traitKicker = rankEl.querySelector<HTMLElement>('#trait-filter-kicker');
      const traitScroll = rankEl.querySelector<HTMLElement>('#trait-filter-scroll');
      if (traitKicker) {
        traitKicker.textContent = traitFilterBarLabel;
        traitKicker.classList.toggle('is-active', state.traitFilters.length > 0);
      }
      if (traitScroll) {
        const prevScrollLeft = traitScroll.scrollLeft;
        traitScroll.innerHTML = traitFilterButtonsHtml;
        traitScroll.scrollLeft = prevScrollLeft;
      }

      const seoulAvgBar = rankEl.querySelector<HTMLElement>('#seoul-avg-bar');
      if (seoulAvgBar) seoulAvgBar.innerHTML = `<span>${escapeHtml(seoulAvgBarText)}</span>${locChipHtml}`;

      const searchCollapse = rankEl.querySelector<HTMLElement>('#search-collapse');
      const searchInput = rankEl.querySelector<HTMLInputElement>('#place-search-input');
      const searchClear = rankEl.querySelector<HTMLButtonElement>('#search-clear-btn');
      const searchCount = rankEl.querySelector<HTMLElement>('#search-count');
      if (searchCollapse) {
        searchCollapse.classList.toggle('is-open', state.searchOpen);
        if (state.searchOpen) {
          searchCollapse.removeAttribute('inert');
        } else {
          searchCollapse.setAttribute('inert', '');
        }
      }
      if (searchInput) {
        searchInput.placeholder = copy.searchPlaceholder;
        searchInput.setAttribute('aria-label', copy.searchPlaceholder);
        if (document.activeElement !== searchInput && searchInput.value !== state.searchQuery) {
          searchInput.value = state.searchQuery;
        }
      }
      if (searchClear) {
        searchClear.hidden = !state.searchQuery;
        searchClear.setAttribute('aria-label', copy.searchClear);
      }
      if (searchCount) {
        searchCount.textContent = copy.resultsCount(currentRows.length);
      }
    }

    const rowsContainer = rankEl.querySelector<HTMLElement>('#rows-container');
    if (rowsContainer) {
      rowsContainer.innerHTML =
        currentRows.length === 0
          ? `
            <div class="empty-state">
              <h3>${escapeHtml(copy.emptyListTitle)}</h3>
              <p>${escapeHtml(copy.emptyListBody)}</p>
              <button type="button" class="reset-btn" id="reset-filters-btn">${escapeHtml(copy.resetAreaBtn)}</button>
            </div>
          `
          : `
            <ol class="rows" id="rows-scroll">
              ${currentRows
                .map((row, idx) => {
                  const name = state.lang === 'ja' ? row.place.nameJa : row.place.nameKo;
                  const station = state.lang === 'ja' ? row.place.stationJa : row.place.stationKo;
                  const dist = formatDistance(row.distanceMeters, state.lang, inKoreaLoc);
                  const isActive = state.selectedPlaceId === row.place.id;
                  const isSavings = row.savingsJpy >= 0;
                  const saveAmount = isSavings
                    ? formatJpy(row.savingsJpy)
                    : `+${formatJpy(Math.abs(row.savingsJpy))}`;
                  const officialTag =
                    state.lang === 'ja'
                      ? row.place.sourceType === 'official_standard'
                        ? '公式定価'
                        : '公式'
                      : row.place.sourceType === 'official_standard'
                        ? '정가'
                        : '공식';
                  const rev = getBrandReview(row.place);
                  const ai = getClinicAiRating(row.place, dataset.places);
                  const aiAria =
                    state.lang === 'ja'
                      ? `AI評価 5点満点中 ${ai.formatted}点`
                      : `AI 평점 5점 만점 중 ${ai.formatted}점`;
                  const compactTraits = pickCompactTraits(rev.traits, 3);
                  const traitsHtml = renderTraitChipsHtml(compactTraits, state.lang);
                  const seoulBadge = formatSeoulDiffBadge(row.seoulDiffPct, state.lang);

                  return `
                    <li class="row ${isActive ? 'is-active' : ''}" data-place-id="${row.place.id}">
                      <button type="button" class="row-main" data-action="focus" data-place-id="${row.place.id}">
                        <span class="rk-cell num">${idx + 1}</span>
                        <span class="who">
                          <span class="nm-wrap">
                            <span class="nm">${escapeHtml(name)}</span>
                            <span class="ai-pill is-${ai.grade} num" title="${escapeHtml(state.lang === 'ja' ? ai.summaryJa : ai.summaryKo)}" aria-label="${escapeHtml(aiAria)}">
                              ${icons.star}
                              <span>AI ${escapeHtml(ai.formatted)}</span>
                            </span>
                          </span>
                          <span class="meta">
                            ${row.place.japaneseSupport ? renderJpBadge(copy.jpSupportTag) : ''}
                            <i class="tg tg-of">${escapeHtml(officialTag)}</i>
                            <i class="tg tg-seoul is-${seoulBadge.tone} num">${escapeHtml(seoulBadge.text)}</i>
                            <span class="meta-loc">${escapeHtml(station)}</span>
                            ${dist ? `<span class="meta-loc meta-dist">${escapeHtml(dist)}</span>` : ''}
                          </span>
                          <span class="row-char">
                            <span class="row-char-tags">
                              ${traitsHtml}
                            </span>
                          </span>
                        </span>
                        <span class="save num ${isSavings ? '' : 'is-over'}">
                          <b>${escapeHtml(saveAmount)}</b>
                          <small>${escapeHtml(isSavings ? saveSubLabel : overSubLabel)}</small>
                        </span>
                        <span class="pr">
                          <b class="num">${escapeHtml(formatJpy(row.krTotalJpy))}</b>
                          <span class="won num">${escapeHtml(formatCompactKrw(row.totalKrw, state.lang))}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        class="row-go"
                        data-action="detail"
                        data-place-id="${row.place.id}"
                        aria-label="${escapeHtml(name)} ${escapeHtml(copy.detailsBtn)}"
                      >${icons.chevronRight}</button>
                    </li>
                  `;
                })
                .join('')}
            </ol>
          `;
    }
  }

  function renderSiteFoot(): void {
    const copy = getCopy(state.lang);
    const links =
      state.lang === 'ja'
        ? { guide: '2026 豆知識', share: '共有 QR', fx: 'NAVER為替', switchLang: '한국어版' }
        : { guide: '2026 꿀팁', share: '공유 QR', fx: '네이버 환율', switchLang: '日本語版' };

    const bank = state.lang === 'ja' ? naverFx.bankJa : naverFx.bankKo;
    const fxStr = formatRate(naverFx.krwPer100Jpy);
    const bullets =
      state.lang === 'ja'
        ? [
            `ソウル主要${TOTAL_BRAND_COUNT}ブランド${TOTAL_CLINIC_COUNT}院の美容皮膚科公式サイト公開価格のみを集めています。`,
            '日本側の比較基準は主要5院の税込公式料金の平均値（上部の日本5院平均相場カードから内訳を確認可）です。',
            `円換算はNAVER金融（${bank} ${naverFx.dateLabel} 売買基準レート 100円=₩${fxStr}）を毎日自動反映し、2026年免税終了後の韓国税金10%を加算比較しています。`
          ]
        : [
            `공식 홈페이지에 가격표를 공개하는 서울 주요 ${TOTAL_BRAND_COUNT}개 피부과 브랜드 ${TOTAL_CLINIC_COUNT}곳의 공개가만 모았습니다.`,
            '일본 비교 기준가는 일본 주요 5개 대형 병원의 세금포함 공식가 평균이며, 상단 평균 카드에서 병원별 산출 내역을 바로 볼 수 있습니다.',
            `엔화 환산은 네이버 금융(${bank} ${naverFx.dateLabel} 매매기준율 100엔=₩${fxStr})을 매일 자동 반영하고, 2026년 세금 환급 종료 기준 부가세 10%를 합산해 비교합니다.`
          ];

    sitefootEl.innerHTML = `
      <div class="sitefoot-inner">
        <nav class="sitefoot-nav" aria-label="Footer">
          <button type="button" class="sitefoot-link" data-foot="guide">${escapeHtml(links.guide)}</button>
          <button type="button" class="sitefoot-link" data-foot="share">${escapeHtml(links.share)}</button>
          <a class="sitefoot-link" href="${escapeHtml(naverFx.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(links.fx)}</a>
          <button type="button" class="sitefoot-link" data-foot="lang">${escapeHtml(links.switchLang)}</button>
        </nav>
        <ul>
          ${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>
        <p class="sitefoot-checked">${escapeHtml(copy.provenanceChecked(dataset.meta.checkedDate))}</p>
      </div>
    `;
  }

  /* =========================================================
     5. Mobile 3-Tab Solid Ruled Bar
     ========================================================= */
  function renderAppTab(): void {
    const labels: Record<AppState['activeTab'], string> =
      state.lang === 'ja'
        ? { list: 'ランキング', guide: '豆知識', share: '共有' }
        : { list: '순위', guide: '꿀팁', share: '공유' };

    if (!apptabEl.querySelector('.apptab-btn')) {
      apptabEl.innerHTML = `
        <button type="button" class="apptab-btn ${state.activeTab === 'list' ? 'is-active' : ''}" data-tab="list">
          ${icons.list}
          <span class="apptab-lbl">${escapeHtml(labels.list)}</span>
        </button>
        <button type="button" class="apptab-btn ${state.activeTab === 'guide' ? 'is-active' : ''}" data-tab="guide">
          ${icons.info}
          <span class="apptab-lbl">${escapeHtml(labels.guide)}</span>
        </button>
        <button type="button" class="apptab-btn ${state.activeTab === 'share' ? 'is-active' : ''}" data-tab="share">
          ${icons.share}
          <span class="apptab-lbl">${escapeHtml(labels.share)}</span>
        </button>
      `;
      return;
    }

    apptabEl.querySelectorAll<HTMLButtonElement>('.apptab-btn').forEach((btn) => {
      const t = btn.dataset.tab as AppState['activeTab'];
      const lbl = btn.querySelector('.apptab-lbl');
      if (lbl && labels[t]) lbl.textContent = labels[t];
    });
    setActiveTab(state.activeTab);
  }

  /* =========================================================
     6. Fluid Ink-Ruled Sheets (Detail, Guide, Share QR)
     ========================================================= */
  function renderDetailDrawer(): void {
    if (!state.detailPlaceId) {
      if (!detailDrawerEl.hidden) closeDetailDrawer();
      return;
    }

    const place = dataset.places.find((p) => p.id === state.detailPlaceId);
    const menu = dataset.menus.find((m) => m.id === state.menuId);
    if (!place || !menu) {
      closeDetailDrawer();
      return;
    }

    const validOrigin = isPointInSouthKorea(state.userLocation) ? state.userLocation : null;
    const originLat = validOrigin?.lat ?? dataset.meta.venue.lat;
    const originLng = validOrigin?.lng ?? dataset.meta.venue.lng;
    const seoulAvg = computeSeoulAverage(
      dataset.places,
      menu,
      state.krwPer100Jpy,
      state.includeVat,
      dataset.meta.vatRate
    );
    const row = computeRow(
      place,
      menu,
      state.krwPer100Jpy,
      state.includeVat,
      dataset.meta.vatRate,
      originLat,
      originLng,
      seoulAvg,
      dataset.places
    );
    if (!row) {
      closeDetailDrawer();
      return;
    }

    const copy = getCopy(state.lang);
    const name = state.lang === 'ja' ? place.nameJa : place.nameKo;
    const subName = state.lang === 'ja' ? place.nameKo : place.nameJa;
    const station = state.lang === 'ja' ? place.stationJa : place.stationKo;
    const caveat = state.lang === 'ja' ? place.caveatJa : place.caveatKo;
    const note = state.lang === 'ja' ? row.offer.noteJa : row.offer.noteKo;
    const leadTime = state.lang === 'ja' ? menu.leadTimeNoteJa : menu.leadTimeNoteKo;
    const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${place.nameKo} ${place.addressKo.split(',')[0]}`)}`;
    const naverDirUrl = buildTransitUrl('current', place, state.userLocation, state.lang);
    const officialPriceUrl = getOfficialMenuProof(place, menu.id, state.lang).priceUrl;
    const jpKrwApprox =
      state.lang === 'ja'
        ? `約${formatKrw(jpyToKrw(row.jpBenchmarkJpy, state.krwPer100Jpy))}`
        : `약 ${formatKrw(jpyToKrw(row.jpBenchmarkJpy, state.krwPer100Jpy))}`;
    const bank = state.lang === 'ja' ? naverFx.bankJa : naverFx.bankKo;
    const rateNote = copy.receiptRateNote(
      formatRate(state.krwPer100Jpy),
      naverFx.dateLabel,
      bank
    );
    const jpBreakdownInline = menu.jpBenchmarks
      .map((c) => `${state.lang === 'ja' ? c.nameJa.split(' ')[0] : c.nameKo.split(' ')[0]} ${formatJpy(c.priceJpy)}`)
      .join(' · ');
    const savingsSummary =
      row.savingsJpy >= 0
        ? `${formatJpy(row.savingsJpy)} (${copy.jpOffPct(row.savingsPct)})`
        : `-${formatJpy(Math.abs(row.savingsJpy))}`;

    const drawerDist = formatDistance(row.distanceMeters, state.lang, isPointInSouthKorea(state.userLocation));
    const drawerRev = getBrandReview(place);
    const drawerSafety = getClinicSafetyAudit(place);
    const drawerAi = getClinicAiRating(place, dataset.places);
    const drawerVibe = state.lang === 'ja' ? drawerRev.vibeJa : drawerRev.vibeKo;
    const drawerTraitsHtml = renderTraitChipsHtml(drawerRev.traits, state.lang);
    const drawerSafetyHtml = drawerSafety.alerts
      .map(
        (al) => `
          <div class="drawer-safety-note">
            <span class="safety-badge-pill">${icons.alert}<span>${escapeHtml(state.lang === 'ja' ? al.badgeJa : al.badgeKo)}</span></span>
            <p>${escapeHtml(state.lang === 'ja' ? al.titleJa : al.titleKo)}</p>
          </div>
        `
      )
      .join('');
    const drawerChannelsHtml = renderBookingChannelsHtml(place.id, state.lang, { compact: true });
    const wasOpen = isSheetOpen(detailDrawerEl);

    detailDrawerEl.innerHTML = `
      <div class="drawer-panel">
        <div class="drawer-drag-zone">
          <div class="drawer-grabber" aria-hidden="true"></div>
          <div class="drawer-header">
            <div>
              <h2 class="drawer-title" id="detail-drawer-title">${escapeHtml(name)}</h2>
              <p class="drawer-sub">${escapeHtml(subName)} / ${escapeHtml(state.lang === 'ja' ? menu.nameJa : menu.nameKo)}</p>
            </div>
            <button type="button" class="drawer-close" data-close="detail" aria-label="${escapeHtml(copy.drawerClose)}">${icons.close}</button>
          </div>
        </div>

        <div class="drawer-body">
          <div class="drawer-traits">
            ${place.japaneseSupport ? renderJpBadge(copy.jpSupportTag) : ''}
            <span class="ai-pill is-${drawerAi.grade} num">${icons.star}<span>AI ${escapeHtml(drawerAi.formatted)} / 5.0</span></span>
            <span class="char-vibe ${drawerRev.reviewScope === 'branch' ? 'is-branch' : ''}">${escapeHtml(drawerVibe)}</span>
            ${drawerTraitsHtml}
          </div>
          ${drawerSafetyHtml}
          <div class="receipt-box">
            <div class="receipt-line">
              <span>${escapeHtml(copy.receiptKrBase)}</span>
              <span class="num">${escapeHtml(formatKrw(row.baseKrw))}</span>
            </div>
            ${
              row.vatKrw > 0
                ? `
                  <div class="receipt-line">
                    <span>${escapeHtml(copy.receiptVat)}</span>
                    <span class="num">+${escapeHtml(formatKrw(row.vatKrw))}</span>
                  </div>
                `
                : ''
            }
            <div class="receipt-line is-strong">
              <span>${escapeHtml(copy.receiptKrTotal)}</span>
              <span class="num">${escapeHtml(formatJpy(row.krTotalJpy))} (${escapeHtml(formatKrw(row.totalKrw))})</span>
            </div>
            <div class="receipt-line">
              <span>${escapeHtml(state.lang === 'ja' ? `ソウル${row.seoulSampleCount}院平均` : `서울 ${row.seoulSampleCount}곳 평균`)}</span>
              <span class="num">${escapeHtml(formatJpy(row.seoulAvgJpy))} (${escapeHtml(formatKrw(row.seoulAvgKrw))})</span>
            </div>
            <div class="receipt-line">
              <span>${escapeHtml(state.lang === 'ja' ? 'ソウル平均との差' : '서울 평균 대비')}</span>
              <span class="num">${escapeHtml(formatSeoulDiffBanner(row.seoulAvgJpy, row.seoulDiffJpy, row.seoulDiffPct, state.lang, row.seoulSampleCount).text)}</span>
            </div>
            <div class="receipt-line">
              <span>${escapeHtml(copy.receiptJpBase)}</span>
              <span class="num">${escapeHtml(formatJpy(row.jpBenchmarkJpy))} (${escapeHtml(jpKrwApprox)})</span>
            </div>
            <div class="receipt-jp-sub num">${escapeHtml(jpBreakdownInline)}</div>
            <div class="receipt-line is-savings">
              <span>${escapeHtml(copy.receiptSavings)}</span>
              <span class="num">${escapeHtml(savingsSummary)}</span>
            </div>
            <div class="receipt-rate-foot num">${escapeHtml(rateNote)}</div>
          </div>

          <a class="primary-btn" href="${escapeHtml(officialPriceUrl)}" target="_blank" rel="noopener noreferrer">
            ${icons.external}
            <span>${escapeHtml(copy.verifyKrOfficial)}</span>
          </a>

          <div class="info-list">
            <div class="info-item">
              <span class="info-item-label">${escapeHtml(copy.stationLabel)}</span>
              <span>${escapeHtml(drawerDist ? `${station} (${drawerDist})` : station)}</span>
            </div>
            <div class="info-item">
              <span class="info-item-label">${escapeHtml(copy.addressLabel)}</span>
              <span>${escapeHtml(place.addressKo)}</span>
            </div>
            <div class="info-item">
              <span class="info-item-label">${escapeHtml(copy.caveatLabel)}</span>
              <span>${escapeHtml(note)} / ${escapeHtml(caveat)}</span>
            </div>
            <div class="info-item">
              <span class="info-item-label">${escapeHtml(copy.leadTimeLabel)}</span>
              <span>${escapeHtml(leadTime)}</span>
            </div>
          </div>

          <div class="secondary-links">
            <button type="button" class="ext-link-btn" data-open-jp-avg="1">
              ${icons.info}<span>${escapeHtml(copy.verifyJpAverage)}</span>
            </button>
            <a class="ext-link-btn" href="${escapeHtml(naverUrl)}" target="_blank" rel="noopener noreferrer">
              ${icons.mapPin}<span>${escapeHtml(copy.openNaverMap)}</span>
            </a>
            <a class="ext-link-btn" href="${escapeHtml(naverDirUrl)}" target="_blank" rel="noopener noreferrer">
              ${icons.navigation}<span>${escapeHtml(state.lang === 'ja' ? 'NAVERマップ経路' : '네이버지도 길찾기')}</span>
            </a>
          </div>
          ${drawerChannelsHtml}
        </div>
      </div>
    `;

    bindSheetSwipeDismiss(detailDrawerEl, () => closeDetailDrawer());
    if (!wasOpen) openSheet(detailDrawerEl);
  }

  function renderGuideDrawer(): void {
    if (!state.guideOpen) {
      if (!guideDrawerEl.hidden) closeGuideDrawer();
      return;
    }

    const copy = getCopy(state.lang);
    const activeMenu = dataset.menus.find((m) => m.id === state.menuId) ?? dataset.menus[0];
    const menuName = state.lang === 'ja' ? activeMenu.nameJa : activeMenu.nameKo;
    const wasOpen = isSheetOpen(guideDrawerEl);

    const jpRowsHtml = activeMenu.jpBenchmarks
      .map((clinic) => {
        const clinicName = state.lang === 'ja' ? clinic.nameJa : clinic.nameKo;
        const plan = state.lang === 'ja' ? clinic.planJa : clinic.planKo;
        return `
          <a class="jp-bench-row" href="${escapeHtml(clinic.url)}" target="_blank" rel="noopener noreferrer">
            <div class="jp-bench-info">
              <span class="jp-bench-name">${escapeHtml(clinicName)} ${icons.external}</span>
              <span class="jp-bench-plan">${escapeHtml(plan)}</span>
            </div>
            <strong class="jp-bench-price num">${escapeHtml(formatJpy(clinic.priceJpy))}</strong>
          </a>
        `;
      })
      .join('');

    guideDrawerEl.innerHTML = `
      <div class="drawer-panel">
        <div class="drawer-drag-zone">
          <div class="drawer-grabber" aria-hidden="true"></div>
          <div class="drawer-header">
            <h2 class="drawer-title" id="guide-drawer-title">${escapeHtml(copy.guideTitle)}</h2>
            <button type="button" class="drawer-close" data-close="guide" aria-label="${escapeHtml(copy.drawerClose)}">${icons.close}</button>
          </div>
        </div>
        <div class="drawer-body">
          <section class="guide-section">
            <h3>${escapeHtml(copy.jpAvgSectionTitle(menuName))}</h3>
            <div class="jp-bench-box">
              ${jpRowsHtml}
              <div class="jp-bench-total">
                <span>${escapeHtml(copy.jpAvgRowLabel)}</span>
                <strong class="num">${escapeHtml(formatJpy(activeMenu.jpBenchmarkJpy))}</strong>
              </div>
            </div>
          </section>
          <section class="guide-section"><h3>${escapeHtml(copy.guideVatTitle)}</h3><p>${escapeHtml(copy.guideVatBody)}</p></section>
          <section class="guide-section"><h3>${escapeHtml(copy.guideExtraTitle)}</h3><p>${escapeHtml(copy.guideExtraBody)}</p></section>
          <section class="guide-section"><h3>${escapeHtml(copy.guideSourceTitle)}</h3><p>${escapeHtml(copy.guideSourceBody)}</p></section>
        </div>
      </div>
    `;

    bindSheetSwipeDismiss(guideDrawerEl, () => closeGuideDrawer());
    if (!wasOpen) openSheet(guideDrawerEl);
  }

  async function renderShareModal(qrLang: Lang = state.shareLang): Promise<void> {
    if (!state.shareOpen) {
      if (!shareModalEl.hidden) closeShareModal();
      return;
    }

    state.shareLang = qrLang;
    const copy = getCopy(state.lang);
    const shareUrl = buildShareUrl(state, qrLang, getActiveClinicUrlMeta());
    let qrSvg = '';
    try {
      qrSvg = await QRCode.toString(shareUrl, { type: 'svg', margin: 1, width: 184 });
    } catch {
      qrSvg = '';
    }
    if (!state.shareOpen) return;

    if (isSheetOpen(shareModalEl) && shareModalEl.querySelector('#qr-frame')) {
      const switchEl = shareModalEl.querySelector<HTMLElement>('#qr-lang-switch');
      const frameEl = shareModalEl.querySelector<HTMLElement>('#qr-frame');
      const urlEl = shareModalEl.querySelector<HTMLElement>('#qr-url');
      const copyBtn = shareModalEl.querySelector<HTMLButtonElement>('#copy-share-url');

      if (switchEl) {
        switchEl.querySelectorAll<HTMLButtonElement>('[data-qr-lang]').forEach((btn) => {
          btn.setAttribute('aria-pressed', String(btn.dataset.qrLang === qrLang));
        });
      }
      if (frameEl) frameEl.innerHTML = qrSvg;
      if (urlEl) urlEl.textContent = shareUrl;
      if (copyBtn) copyBtn.dataset.url = shareUrl;
      return;
    }

    shareModalEl.innerHTML = `
      <div class="drawer-panel">
        <div class="drawer-drag-zone">
          <div class="drawer-grabber" aria-hidden="true"></div>
          <div class="drawer-header">
            <div>
              <h2 class="drawer-title" id="share-modal-title">${escapeHtml(copy.shareTitle)}</h2>
              <p class="drawer-sub">${escapeHtml(copy.shareDesc)}</p>
            </div>
            <button type="button" class="drawer-close" data-close="share" aria-label="${escapeHtml(copy.drawerClose)}">${icons.close}</button>
          </div>
        </div>
        <div class="drawer-body">
          <div class="qr-box">
            <div class="lang-switch" id="qr-lang-switch" role="group">
              <button type="button" class="lang-btn" data-qr-lang="ja" aria-pressed="${qrLang === 'ja'}">${escapeHtml(copy.shareQrLangJa)}</button>
              <button type="button" class="lang-btn" data-qr-lang="ko" aria-pressed="${qrLang === 'ko'}">${escapeHtml(copy.shareQrLangKo)}</button>
            </div>
            <div class="qr-frame" id="qr-frame">${qrSvg}</div>
            <div class="qr-url" id="qr-url">${escapeHtml(shareUrl)}</div>
            <button type="button" class="primary-btn" id="copy-share-url" data-url="${escapeHtml(shareUrl)}">
              ${icons.copy}<span>${escapeHtml(copy.shareCopyLink)}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    bindSheetSwipeDismiss(shareModalEl, () => closeShareModal());
    openSheet(shareModalEl);
  }

  function renderRecommenderModal(): void {
    if (!recommenderOpen) {
      if (!recommenderModalEl.hidden) closeRecommenderModal();
      return;
    }

    const copy = getCopy(state.lang);
    const isJa = state.lang === 'ja';
    const wasOpen = isSheetOpen(recommenderModalEl);
    const prevScrollTop = wasOpen
      ? (recommenderModalEl.querySelector<HTMLElement>('.drawer-body')?.scrollTop ?? 0)
      : 0;

    const summary = recommendTreatments(recAnswers, dataset, {
      includeVat: state.includeVat,
      krwPer100Jpy: state.krwPer100Jpy
    });

    const concernHtml = RECOMMENDER_CONCERNS.map((c) => {
      const active = recAnswers.concerns.includes(c.id);
      return `
        <button type="button" class="rec-opt-btn" data-rec-concern="${c.id}" aria-pressed="${active}">
          <span class="rec-opt-title">${escapeHtml(isJa ? c.labelJa : c.labelKo)}</span>
          <span class="rec-opt-sub">${escapeHtml(isJa ? c.hintJa : c.hintKo)}</span>
        </button>
      `;
    }).join('');

    const scheduleHtml = RECOMMENDER_SCHEDULES.map((s) => {
      const active = recAnswers.schedule === s.id;
      return `
        <button type="button" class="rec-opt-btn" data-rec-schedule="${s.id}" aria-pressed="${active}">
          <span class="rec-opt-title">${escapeHtml(isJa ? s.labelJa : s.labelKo)}</span>
          <span class="rec-opt-sub">${escapeHtml(isJa ? s.subJa : s.subKo)}</span>
        </button>
      `;
    }).join('');

    const prefHtml = RECOMMENDER_PREFERENCES.map((p) => {
      const active = recAnswers.preference === p.id;
      return `
        <button type="button" class="rec-opt-btn" data-rec-pref="${p.id}" aria-pressed="${active}">
          <span class="rec-opt-title">${escapeHtml(isJa ? p.labelJa : p.labelKo)}</span>
          <span class="rec-opt-sub">${escapeHtml(isJa ? p.subJa : p.subKo)}</span>
        </button>
      `;
    }).join('');

    const selectableTraits = TRAIT_FILTERS.filter(
      (tf) =>
        tf.id === 'low_upsell' ||
        tf.id === 'careful' ||
        tf.id === 'short_wait' ||
        tf.id === 'sunday_night'
    );
    const traitChipsHtml = `
      ${selectableTraits
        .map((tf) => {
          const active = recAnswers.traitFilters.includes(tf.id);
          const iconSvg = tf.icon ? icons[tf.icon] : '';
          return `
            <button type="button" class="rec-chip-btn" data-rec-trait="${tf.id}" aria-pressed="${active}">
              ${iconSvg}<span>${escapeHtml(isJa ? tf.labelJa : tf.labelKo)}</span>
            </button>
          `;
        })
        .join('')}
      <button type="button" class="rec-chip-btn" data-rec-jp="1" aria-pressed="${recAnswers.japaneseOnly}">
        <span class="rec-jp-code">JP</span>
        <span>${escapeHtml(copy.jpSupportTag)}</span>
      </button>
    `;

    const renderPickCard = (
      pick: RecommenderPick,
      variant: 'primary' | 'secondary' | 'safe-alt'
    ): string => {
      const menuName = isJa ? pick.menu.shortJa : pick.menu.shortKo;
      const dt = TREATMENT_DOWNTIME[pick.menu.id];
      const dtBadge = dt ? (isJa ? dt.badgeJa : dt.badgeKo) : '';
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

      const reasons = (isJa ? pick.reasonsJa : pick.reasonsKo)
        .map((r) => `<li>${escapeHtml(r)}</li>`)
        .join('');

      const caution = isJa ? pick.cautionJa : pick.cautionKo;
      const topName = pick.topClinic ? (isJa ? pick.topClinic.nameJa : pick.topClinic.nameKo) : '';
      const savText =
        pick.maxSavingsJpy > 0
          ? isJa
            ? `日本平均より最大 ${formatJpy(pick.maxSavingsJpy)} おトク`
            : `일본 평균보다 최대 ${formatJpy(pick.maxSavingsJpy)} 절약`
          : '';
      const filterNotice = pick.usedFilterFallback
        ? isJa
          ? '※ 条件に合う院が少ないためソウル全体の最安値を表示しています'
          : '※ 고른 병원 조건을 모두 갖춘 곳이 적어 서울 전체 최저가를 함께 보여드려요'
        : '';

      return `
        <article class="rec-card is-${variant}">
          <div class="rec-card-top">
            <span class="rec-rank-pill">${escapeHtml(roleTag)}</span>
            ${dtBadge ? `<span class="tg tg-jp">${escapeHtml(dtBadge)}</span>` : ''}
          </div>
          <div class="rec-card-title-row">
            <h4 class="rec-card-title">${escapeHtml(menuName)}</h4>
            <div class="rec-card-price num">
              <b>${escapeHtml(isJa ? '最安 ' : '서울 최저 ')}${escapeHtml(formatJpy(pick.seoulMinTotalJpy))}</b>
              <span>${escapeHtml(formatCompactKrw(pick.seoulMinTotalKrw, state.lang))}</span>
            </div>
          </div>
          ${savText ? `<p class="rec-card-sav num">${escapeHtml(savText)}</p>` : ''}
          <ul class="rec-card-reasons">${reasons}</ul>
          ${
            caution
              ? `<div class="rec-caution">${icons.alert}<span>${escapeHtml(caution)}</span></div>`
              : ''
          }
          ${filterNotice ? `<p class="rec-fallback-note">${escapeHtml(filterNotice)}</p>` : ''}
          <div class="rec-card-actions">
            <button type="button" class="primary-btn rec-apply-btn" data-apply-rec-menu="${pick.menu.id}">
              <span>${escapeHtml(isJa ? `${menuName}の順位を見る →` : `${menuName} 순위 보기 →`)}</span>
            </button>
            ${
              pick.topClinic
                ? `
                  <button
                    type="button"
                    class="rec-ghost-btn"
                    data-open-rec-clinic="${pick.topClinic.id}"
                    data-rec-menus="${pick.menu.id}"
                  >
                    <span>${escapeHtml(isJa ? `${topName}で計算` : `${topName} 바로 계산`)}</span>
                  </button>
                `
                : ''
            }
          </div>
        </article>
      `;
    };

    const comboHtml = summary.combo
      ? `
        <article class="rec-combo-card">
          <div class="rec-card-top">
            <span class="rec-combo-pill">${escapeHtml(isJa ? '2つ組み合わせ提案' : '함께 받으면 좋은 2가지 조합')}</span>
            <span class="rec-combo-sav num">${escapeHtml(isJa ? `日本平均より ${formatJpy(summary.combo.savingsJpy)}↓` : `일본 평균 대비 ${formatJpy(summary.combo.savingsJpy)}↓`)}</span>
          </div>
          <h4 class="rec-card-title">${escapeHtml(isJa ? summary.combo.titleJa : summary.combo.titleKo)}</h4>
          <p class="rec-combo-reason">${escapeHtml(isJa ? summary.combo.reasonJa : summary.combo.reasonKo)}</p>
          <div class="rec-combo-clinic">
            <div>
              <strong>${escapeHtml(isJa ? summary.combo.clinic.nameJa : summary.combo.clinic.nameKo)}</strong>
              <span>${escapeHtml(isJa ? summary.combo.clinic.stationJa : summary.combo.clinic.stationKo)}</span>
            </div>
            <div class="rec-combo-total num">
              <b>${escapeHtml(formatJpy(summary.combo.krTotalJpy))}</b>
              <span>${escapeHtml(formatKrw(summary.combo.totalKrw))}</span>
            </div>
          </div>
          ${
            summary.combo.usedFilterFallback
              ? `<p class="rec-fallback-note">${escapeHtml(
                  isJa
                    ? '※ 2つとも揃う院が少なく、条件を緩めた最安院を表示しています'
                    : '※ 2가지를 함께 하는 곳 중 조건을 넓혀 가장 저렴한 지점을 찾았어요'
                )}</p>`
              : ''
          }
          <button
            type="button"
            class="primary-btn rec-combo-btn"
            data-open-rec-clinic="${summary.combo.clinic.id}"
            data-rec-menus="${summary.combo.menus.map((m) => m.id).join(',')}"
          >
            <span>${escapeHtml(isJa ? 'この院で2つの合計を計算する →' : '이 병원에서 2가지 묶음 계산하기 →')}</span>
          </button>
        </article>
      `
      : '';

    const resultSectionHtml = summary.hasInput
      ? `
        <section class="rec-results" id="rec-result-box" aria-live="polite">
          <div class="rec-sec-head">
            <h3>${escapeHtml(isJa ? 'あなたに合うおすすめ施術' : '선택하신 조건 맞춤 추천')}</h3>
            <span class="rec-sec-sub">${escapeHtml(
              state.includeVat
                ? isJa
                  ? '韓国税金+10%込み基準'
                  : '부가세 +10% 포함 기준'
                : isJa
                  ? '表示価格ベース'
                  : '홈페이지 표시가 기준'
            )}</span>
          </div>
          ${summary.primary ? renderPickCard(summary.primary, 'primary') : ''}
          ${summary.scheduleSafeAlternative ? renderPickCard(summary.scheduleSafeAlternative, 'safe-alt') : ''}
          ${summary.secondary ? renderPickCard(summary.secondary, 'secondary') : ''}
          ${comboHtml}
        </section>
      `
      : `
        <section class="rec-empty" id="rec-result-box">
          <p class="rec-empty-title">${escapeHtml(
            isJa ? '上の項目から1つ以上選んでみてください' : '위에서 고민이나 일정을 1개 이상 골라 보세요'
          )}</p>
          <p class="rec-empty-sub">${escapeHtml(
            isJa
              ? '迷う時はよくあるパターンを1タップで試せます。'
              : '잘 모를 땐 아래에서 가장 비슷한 상황 하나를 바로 눌러 보세요.'
          )}</p>
          <div class="rec-presets">
            <button type="button" class="rec-preset-btn" data-rec-preset="dry">${escapeHtml(
              isJa ? '乾燥・小じわケア' : '속건조 · 잔주름'
            )}</button>
            <button type="button" class="rec-preset-btn" data-rec-preset="lift">${escapeHtml(
              isJa ? '跡なし小顔リフト' : '티 없이 턱선 리프팅'
            )}</button>
            <button type="button" class="rec-preset-btn" data-rec-preset="pore">${escapeHtml(
              isJa ? '毛穴・ニキビ跡' : '모공 · 여드름 흉터'
            )}</button>
            <button type="button" class="rec-preset-btn" data-rec-preset="value">${escapeHtml(
              isJa ? '数千円台のエラ小顔' : '가볍게 1~5만 원대 턱 정리'
            )}</button>
          </div>
        </section>
      `;

    const jumpBarHtml =
      summary.hasInput && summary.primary
        ? `
          <div class="rec-jump-bar">
            <span class="rec-jump-label">
              <strong>${escapeHtml(isJa ? '1位おすすめ:' : '맞춤 1순위:')} ${escapeHtml(isJa ? summary.primary.menu.shortJa : summary.primary.menu.shortKo)}</strong>
              ${summary.combo ? `<span class="rec-jump-plus">${escapeHtml(isJa ? '＋2つ組み合わせあり' : '+ 2가지 조합')}</span>` : ''}
            </span>
            <button type="button" class="rec-jump-btn" id="rec-jump-result-btn">
              <span>${escapeHtml(isJa ? '結果を見る ↓' : '추천 결과 보기 ↓')}</span>
            </button>
          </div>
        `
        : '';

    recommenderModalEl.innerHTML = `
      <div class="drawer-panel rec-drawer-panel">
        <div class="drawer-drag-zone">
          <div class="drawer-grabber" aria-hidden="true"></div>
          <div class="drawer-header">
            <div>
              <h2 class="drawer-title" id="recommender-modal-title">${escapeHtml(
                isJa ? 'お悩みに合う施術診断' : '내 고민에 맞는 시술 추천'
              )}</h2>
              <p class="drawer-sub">${escapeHtml(
                isJa
                  ? '気になる項目を選ぶと、合う施術と実際の最安クリニックをすぐご案内します'
                  : '몇 가지만 고르면 내 피부와 일정에 맞는 시술·최저가 병원을 바로 찾아드려요'
              )}</p>
            </div>
            <div class="rec-head-actions">
              <button type="button" class="rec-reset-btn" id="rec-reset-btn">${escapeHtml(
                isJa ? 'リセット' : '다시 고르기'
              )}</button>
              <button type="button" class="drawer-close" data-close="recommender" aria-label="${escapeHtml(copy.drawerClose)}">${icons.close}</button>
            </div>
          </div>
        </div>
        ${jumpBarHtml}
        <div class="drawer-body">
          <section class="rec-q">
            <div class="rec-q-head">
              <strong>${escapeHtml(isJa ? '1. 一番気になるお悩みは？' : '1. 가장 신경 쓰이는 고민은?')}</strong>
              <span>${escapeHtml(isJa ? '複数選択OK' : '여러 개 선택 가능')}</span>
            </div>
            <div class="rec-opt-grid">${concernHtml}</div>
          </section>

          <section class="rec-q">
            <div class="rec-q-head">
              <strong>${escapeHtml(isJa ? '2. 施術後の予定・回復の余裕は？' : '2. 시술 후 일정은 어떤가요?')}</strong>
              <span>${escapeHtml(isJa ? '1つ選択' : '1개 선택')}</span>
            </div>
            <div class="rec-opt-grid is-two">${scheduleHtml}</div>
          </section>

          <section class="rec-q">
            <div class="rec-q-head">
              <strong>${escapeHtml(isJa ? '3. 痛み・予算の希望は？' : '3. 방식 · 예산 선호가 있나요?')}</strong>
              <span>${escapeHtml(isJa ? '任意' : '선택 사항')}</span>
            </div>
            <div class="rec-opt-grid is-two">${prefHtml}</div>
          </section>

          <section class="rec-q">
            <div class="rec-q-head">
              <strong>${escapeHtml(isJa ? '4. 好みのクリニック条件（順位に連動）' : '4. 원하는 병원 스타일 (순위에 바로 반영)')}</strong>
              <span>${escapeHtml(isJa ? '任意・複数可' : '선택 · 여러 개 가능')}</span>
            </div>
            <div class="rec-chip-row">${traitChipsHtml}</div>
          </section>

          ${resultSectionHtml}
        </div>
      </div>
    `;

    const bodyEl = recommenderModalEl.querySelector<HTMLElement>('.drawer-body');
    if (bodyEl && wasOpen) {
      bodyEl.scrollTop = prevScrollTop;
    }

    bindSheetSwipeDismiss(recommenderModalEl, () => closeRecommenderModal());
    if (!wasOpen) openSheet(recommenderModalEl);
  }

  function renderTreatGuide(): void {
    const isJa = state.lang === 'ja';
    const activeMenu = dataset.menus.find((m) => m.id === state.menuId) ?? dataset.menus[0];
    const eff = TREATMENT_EFFECTS[activeMenu.id];
    const dt = TREATMENT_DOWNTIME[activeMenu.id];
    if (!eff && !dt) {
      treatGuideEl.innerHTML = '';
      treatGuideEl.hidden = true;
      return;
    }
    treatGuideEl.hidden = false;
    const menuName = isJa ? activeMenu.shortJa : activeMenu.shortKo;
    const headline = eff ? (isJa ? eff.headlineJa : eff.headlineKo) : '';
    const dtBadge = dt ? (isJa ? dt.badgeJa : dt.badgeKo) : '';
    const effectsHtml = eff
      ? (isJa ? eff.effectsJa : eff.effectsKo)
          .map((item) => renderEffectBulletHtml(item))
          .join('')
      : '';
    const gaugesHtml = eff ? renderScoreGaugesHtml(eff, isJa, 'md') : '';

    treatGuideEl.innerHTML = `
      <div class="treat-guide-head">
        <div class="treat-guide-head-main">
          <span class="tg treat-guide-kicker">${escapeHtml(menuName)}</span>
          <strong class="treat-guide-title">${escapeHtml(headline)}</strong>
          ${dtBadge ? `<span class="tg tg-jp">${escapeHtml(dtBadge)}</span>` : ''}
        </div>
        <button
          type="button"
          class="treat-guide-toggle"
          id="toggle-treat-guide"
          aria-expanded="${treatGuideOpen}"
          aria-controls="treat-guide-body"
        >
          <span>${escapeHtml(treatGuideOpen ? (isJa ? '閉じる' : '접기') : (isJa ? '効果を詳しく見る' : '효과 자세히'))}</span>
          ${icons.chevronDown}
        </button>
      </div>
      ${
        treatGuideOpen && eff
          ? `
            <div class="treat-guide-body" id="treat-guide-body">
              <div class="treat-guide-top">
                ${gaugesHtml}
                <p class="treat-guide-mech">${escapeHtml(isJa ? eff.mechanismJa : eff.mechanismKo)}</p>
              </div>
              <div class="treat-guide-grid">
                <div class="treat-guide-col">
                  <div class="treat-guide-sub">${escapeHtml(isJa ? '主な効果' : '나타날 수 있는 주요 효과')}</div>
                  <ul class="treat-guide-list">${effectsHtml}</ul>
                </div>
                <div class="treat-guide-col treat-guide-facts">
                  <div class="treat-guide-fact-card">
                    <span class="treat-guide-fact-k">${icons.spark}<span>${escapeHtml(isJa ? 'おすすめの方' : '추천 대상')}</span></span>
                    <span class="treat-guide-fact-v">${escapeHtml(isJa ? eff.bestForJa : eff.bestForKo)}</span>
                  </div>
                  <div class="treat-guide-fact-card">
                    <span class="treat-guide-fact-k">${icons.clock}<span>${escapeHtml(isJa ? '効果・持続' : '효과 느낌 · 유지 기간')}</span></span>
                    <span class="treat-guide-fact-v">${escapeHtml(isJa ? eff.timingJa : eff.timingKo)}</span>
                  </div>
                  <div class="treat-guide-fact-card is-note">
                    <span class="treat-guide-fact-k">${icons.info}<span>${escapeHtml(isJa ? '回復・注意点' : '시술 후 회복 · 주의할 점')}</span></span>
                    <span class="treat-guide-fact-v">${escapeHtml(isJa ? eff.noteJa : eff.noteKo)}</span>
                  </div>
                </div>
              </div>
            </div>
          `
          : ''
      }
    `;

    if (treatGuideOpen && eff) {
      animateScoreRings(treatGuideEl);
    }
  }

  function renderAll(fitMapBounds: boolean): void {
    renderSiteHead();
    renderTicker();
    renderControls();
    renderTreatGuide();
    renderRank(fitMapBounds);
    renderSiteFoot();
    renderAppTab();
    if (activeClinicId) clinicPage.updateContext(getClinicContext());
    if (state.detailPlaceId) renderDetailDrawer();
    if (state.guideOpen) renderGuideDrawer();
    if (state.shareOpen) void renderShareModal(state.shareLang);
    if (recommenderOpen) renderRecommenderModal();
  }

  function switchLanguage(nextLang: Lang): void {
    if (state.lang === nextLang) return;
    triggerHaptic(6);
    state.lang = nextLang;
    state.shareLang = nextLang;
    try {
      localStorage.setItem(STORAGE_LANG_KEY, nextLang);
    } catch {
      // ignore
    }
    syncUrl(state, getActiveClinicUrlMeta());
    renderAll(false);
  }

  function goToDefaultHome(): void {
    triggerHaptic(6);
    if (state.detailPlaceId) closeDetailDrawer();
    if (state.guideOpen) closeGuideDrawer();
    if (state.shareOpen) closeShareModal();
    if (recommenderOpen) closeRecommenderModal();
    if (clinicPage.isStaffModalOpen()) clinicPage.closeStaffModal();

    const wasClinicView = Boolean(activeClinicId);
    const prevUrl = window.location.href;

    // Reset to canonical Home state with default treatment (rejuran-2cc) active
    state.menuId = dataset.menus[0].id;
    state.area = 'all';
    state.sort = 'savings';
    state.traitFilters = [];
    state.searchQuery = '';
    state.searchOpen = false;
    state.moreAreasOpen = false;
    state.japaneseOnly = false;
    state.selectedPlaceId = null;
    savedHomeScrollY = 0;
    treatGuideOpen = false;
    setActiveTab('list');

    if (wasClinicView) {
      navigateToHome(true);
      renderAll(true);
      return;
    }

    renderAll(true);
    const nextUrl = buildHomeUrl(state);
    if (nextUrl !== prevUrl) {
      try {
        window.history.pushState({ view: 'home' }, '', nextUrl);
      } catch {
        // ignore history restrictions
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* =========================================================
     Event Delegation
     ========================================================= */
  siteheadEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#brand-home-btn')) {
      goToDefaultHome();
      brandDopamine.fire();
      return;
    }
    const langBtn = target.closest<HTMLButtonElement>('[data-lang]');
    if (langBtn?.dataset.lang) {
      switchLanguage(langBtn.dataset.lang as Lang);
      return;
    }
    if (target.closest('#head-share-btn')) {
      triggerHaptic(6);
      state.shareOpen = true;
      state.shareLang = state.lang;
      void renderShareModal(state.lang);
    }
  });

  tickerEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#open-guide-btn') || target.closest('#open-jp-avg-btn')) {
      triggerHaptic(6);
      state.guideOpen = true;
      renderGuideDrawer();
    }
  });

  controlsEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#open-recommender-btn')) {
      triggerHaptic(6);
      if (
        recAnswers.concerns.length === 0 &&
        recAnswers.schedule === null &&
        recAnswers.preference === null
      ) {
        recAnswers = {
          ...recAnswers,
          traitFilters: [...state.traitFilters],
          japaneseOnly: state.japaneseOnly
        };
      }
      recommenderOpen = true;
      renderRecommenderModal();
      return;
    }
    const menuBtn = target.closest<HTMLButtonElement>('[data-menu]');
    if (menuBtn?.dataset.menu && menuBtn.dataset.menu !== state.menuId) {
      triggerHaptic(6);
      state.menuId = menuBtn.dataset.menu;
      state.selectedPlaceId = null;
      syncUrl(state);
      renderTicker();
      renderControls();
      renderTreatGuide();
      renderRank(false);
      return;
    }
    if (target.closest('#toggle-more-areas')) {
      triggerHaptic(6);
      state.moreAreasOpen = !state.moreAreasOpen;
      renderControls();
      return;
    }
    const areaBtn = target.closest<HTMLButtonElement>('[data-area]');
    if (areaBtn?.dataset.area) {
      const nextArea = areaBtn.dataset.area as AreaId;
      triggerHaptic(6);
      state.area = nextArea;
      if (!EXTRA_AREA_IDS.includes(nextArea)) {
        state.moreAreasOpen = false;
      }
      state.selectedPlaceId = null;
      syncUrl(state);
      renderControls();
      renderRank(true);
    }
  });

  treatGuideEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#toggle-treat-guide')) {
      triggerHaptic(6);
      treatGuideOpen = !treatGuideOpen;
      renderTreatGuide();
    }
  });

  rankEl.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'vat-chk') {
      triggerHaptic(6);
      state.includeVat = target.checked;
      syncUrl(state);
      renderControls();
      renderRank(false);
      if (state.detailPlaceId) renderDetailDrawer();
    }
  });

  rankEl.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'place-search-input') {
      state.searchQuery = target.value;
      syncUrl(state);
      renderControls();
      renderRank(false);
    }
  });

  rankEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#jp-only-btn')) {
      triggerHaptic(6);
      state.japaneseOnly = !state.japaneseOnly;
      syncUrl(state);
      renderControls();
      renderRank(true);
      return;
    }
    if (target.closest('#search-toggle-btn')) {
      triggerHaptic(6);
      state.searchOpen = !state.searchOpen;
      renderRank(false);
      if (state.searchOpen) {
        window.setTimeout(() => {
          rankEl.querySelector<HTMLInputElement>('#place-search-input')?.focus();
        }, 60);
      }
      return;
    }
    if (target.closest('#search-clear-btn')) {
      triggerHaptic(6);
      state.searchQuery = '';
      syncUrl(state);
      renderControls();
      renderRank(false);
      const input = rankEl.querySelector<HTMLInputElement>('#place-search-input');
      if (input) {
        input.value = '';
        input.focus();
      }
      return;
    }
    if (target.closest('#reset-filters-btn')) {
      triggerHaptic(6);
      state.area = 'all';
      state.traitFilters = [];
      state.searchQuery = '';
      state.japaneseOnly = false;
      state.moreAreasOpen = false;
      syncUrl(state);
      renderControls();
      renderRank(true);
      return;
    }
    const traitBtn = target.closest<HTMLButtonElement>('[data-trait-filter]');
    if (traitBtn?.dataset.traitFilter && !traitBtn.disabled) {
      const clicked = traitBtn.dataset.traitFilter as TraitFilterId;
      triggerHaptic(6);
      state.traitFilters = toggleTraitFilters(state.traitFilters, clicked);
      state.selectedPlaceId = null;
      syncUrl(state);
      renderControls();
      renderRank(true);
      return;
    }
    if (target.closest('#rank-locate-btn')) {
      triggerHaptic(6);
      requestUserLocation({ silent: false });
      return;
    }
    const sortBtn = target.closest<HTMLButtonElement>('[data-sort]');
    if (sortBtn?.dataset.sort) {
      const nextSort = sortBtn.dataset.sort as SortId;
      if (state.sort !== nextSort) {
        triggerHaptic(6);
        state.sort = nextSort;
        syncUrl(state);
        renderRank(false);
      }
      if (nextSort === 'distance') {
        if (!state.userLocation) {
          requestUserLocation({ silent: false });
        } else if (!isPointInSouthKorea(state.userLocation)) {
          showToast(
            state.lang === 'ja'
              ? '現在海外にいるため距離を非表示にしています（韓国到着後に表示）'
              : '현재 해외 위치라 거리를 숨겼어요 (한국 도착 후 자동 표시)'
          );
        }
      }
      return;
    }
    const actionBtn = target.closest<HTMLButtonElement>('[data-action]');
    if (actionBtn?.dataset.placeId) {
      const pid = actionBtn.dataset.placeId;
      const action = actionBtn.dataset.action;
      if (action === 'detail' || action === 'focus') {
        triggerHaptic(6);
        state.selectedPlaceId = pid;
        updateActiveRowDom(pid, false);
        navigateToClinic(pid, true);
        return;
      }
    }
  });

  sitefootEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-foot]');
    if (!btn?.dataset.foot) return;
    const act = btn.dataset.foot;
    if (act === 'guide') {
      triggerHaptic(6);
      state.guideOpen = true;
      renderGuideDrawer();
    } else if (act === 'share') {
      triggerHaptic(6);
      state.shareOpen = true;
      state.shareLang = state.lang;
      void renderShareModal(state.lang);
    } else if (act === 'lang') {
      switchLanguage(state.lang === 'ja' ? 'ko' : 'ja');
    }
  });

  apptabEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
    if (!btn?.dataset.tab) return;
    const tab = btn.dataset.tab as AppState['activeTab'];
    triggerHaptic(6);
    setActiveTab(tab);

    if (tab === 'list') {
      if (activeClinicId) {
        navigateToHome(true, 'list');
      } else {
        rankEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (tab === 'guide') {
      state.guideOpen = true;
      renderGuideDrawer();
    } else if (tab === 'share') {
      state.shareOpen = true;
      state.shareLang = state.lang;
      void renderShareModal(state.lang);
    }
  });

  detailDrawerEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-open-jp-avg]')) {
      triggerHaptic(6);
      closeDetailDrawer();
      state.guideOpen = true;
      renderGuideDrawer();
      return;
    }
    if (target === detailDrawerEl || target.closest('[data-close="detail"]')) {
      closeDetailDrawer();
    }
  });

  guideDrawerEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === guideDrawerEl || target.closest('[data-close="guide"]')) {
      closeGuideDrawer();
    }
  });

  shareModalEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === shareModalEl || target.closest('[data-close="share"]')) {
      closeShareModal();
      return;
    }
    const qrLangBtn = target.closest<HTMLButtonElement>('[data-qr-lang]');
    if (qrLangBtn?.dataset.qrLang) {
      triggerHaptic(6);
      void renderShareModal(qrLangBtn.dataset.qrLang as Lang);
      return;
    }
    const copyBtn = target.closest<HTMLButtonElement>('#copy-share-url');
    if (copyBtn?.dataset.url) {
      const copy = getCopy(state.lang);
      triggerHaptic(10);
      const confirmCopied = () => {
        showToast(copy.toastCopied, true);
        window.clearTimeout(copyResetTimer);
        copyBtn.classList.add('is-copied');
        copyBtn.innerHTML = `${icons.check}<span>${escapeHtml(copy.shareCopied)}</span>`;
        copyResetTimer = window.setTimeout(() => {
          copyBtn.classList.remove('is-copied');
          copyBtn.innerHTML = `${icons.copy}<span>${escapeHtml(copy.shareCopyLink)}</span>`;
        }, 1600);
      };
      navigator.clipboard
        ?.writeText(copyBtn.dataset.url)
        .then(confirmCopied)
        .catch(confirmCopied);
    }
  });

  recommenderModalEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === recommenderModalEl || target.closest('[data-close="recommender"]')) {
      closeRecommenderModal();
      return;
    }
    if (target.closest('#rec-reset-btn')) {
      triggerHaptic(6);
      recAnswers = {
        concerns: [],
        schedule: null,
        preference: null,
        traitFilters: [],
        japaneseOnly: false
      };
      renderRecommenderModal();
      return;
    }
    if (target.closest('#rec-jump-result-btn')) {
      triggerHaptic(6);
      recommenderModalEl.querySelector('#rec-result-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const presetBtn = target.closest<HTMLButtonElement>('[data-rec-preset]');
    if (presetBtn?.dataset.recPreset) {
      triggerHaptic(6);
      const p = presetBtn.dataset.recPreset;
      if (p === 'dry') {
        recAnswers = { ...recAnswers, concerns: ['dryness'], schedule: 'flexible', preference: null };
      } else if (p === 'lift') {
        recAnswers = { ...recAnswers, concerns: ['sagging'], schedule: 'urgent', preference: 'no-needle' };
      } else if (p === 'pore') {
        recAnswers = { ...recAnswers, concerns: ['pores'], schedule: 'flexible', preference: null };
      } else if (p === 'value') {
        recAnswers = { ...recAnswers, concerns: ['jaw'], schedule: 'urgent', preference: 'low-budget' };
      }
      renderRecommenderModal();
      recommenderModalEl.querySelector('#rec-result-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const concernBtn = target.closest<HTMLButtonElement>('[data-rec-concern]');
    if (concernBtn?.dataset.recConcern) {
      const id = concernBtn.dataset.recConcern as RecommenderConcernId;
      triggerHaptic(6);
      const has = recAnswers.concerns.includes(id);
      recAnswers = {
        ...recAnswers,
        concerns: has
          ? recAnswers.concerns.filter((x) => x !== id)
          : [...recAnswers.concerns, id]
      };
      renderRecommenderModal();
      return;
    }
    const schedBtn = target.closest<HTMLButtonElement>('[data-rec-schedule]');
    if (schedBtn?.dataset.recSchedule) {
      const id = schedBtn.dataset.recSchedule as RecommenderScheduleId;
      triggerHaptic(6);
      recAnswers = {
        ...recAnswers,
        schedule: recAnswers.schedule === id ? null : id
      };
      renderRecommenderModal();
      return;
    }
    const prefBtn = target.closest<HTMLButtonElement>('[data-rec-pref]');
    if (prefBtn?.dataset.recPref) {
      const id = prefBtn.dataset.recPref as RecommenderPreferenceId;
      triggerHaptic(6);
      recAnswers = {
        ...recAnswers,
        preference: recAnswers.preference === id ? null : id
      };
      renderRecommenderModal();
      return;
    }
    const traitBtn = target.closest<HTMLButtonElement>('[data-rec-trait]');
    if (traitBtn?.dataset.recTrait) {
      const tid = traitBtn.dataset.recTrait as TraitFilterId;
      triggerHaptic(6);
      recAnswers = {
        ...recAnswers,
        traitFilters: toggleTraitFilters(recAnswers.traitFilters, tid)
      };
      renderRecommenderModal();
      return;
    }
    if (target.closest('[data-rec-jp]')) {
      triggerHaptic(6);
      recAnswers = {
        ...recAnswers,
        japaneseOnly: !recAnswers.japaneseOnly
      };
      renderRecommenderModal();
      return;
    }
    const applyBtn = target.closest<HTMLButtonElement>('[data-apply-rec-menu]');
    if (applyBtn?.dataset.applyRecMenu) {
      const menuId = applyBtn.dataset.applyRecMenu;
      triggerHaptic(10);
      state.menuId = menuId;
      state.traitFilters = [...recAnswers.traitFilters];
      state.japaneseOnly = recAnswers.japaneseOnly;
      state.selectedPlaceId = null;
      syncUrl(state);
      closeRecommenderModal();
      renderAll(true);
      const menu = dataset.menus.find((m) => m.id === menuId);
      const mLabel = menu ? (state.lang === 'ja' ? menu.shortJa : menu.shortKo) : '';
      showToast(
        state.lang === 'ja'
          ? `おすすめ「${mLabel}」と希望条件を一覧に反映しました`
          : `추천 시술 '${mLabel}'과 선택한 병원 조건을 바로 적용했어요`,
        true
      );
      return;
    }
    const openClinicBtn = target.closest<HTMLButtonElement>('[data-open-rec-clinic]');
    if (openClinicBtn?.dataset.openRecClinic) {
      const pid = openClinicBtn.dataset.openRecClinic;
      const menus = (openClinicBtn.dataset.recMenus ?? state.menuId)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      triggerHaptic(10);
      if (menus[0]) state.menuId = menus[0];
      state.traitFilters = [...recAnswers.traitFilters];
      state.japaneseOnly = recAnswers.japaneseOnly;
      closeRecommenderModal();
      renderControls();
      renderTreatGuide();
      renderRank(false);
      navigateToClinic(pid, true, menus, 1);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (clinicPage.isStaffModalOpen()) {
        clinicPage.closeStaffModal();
      } else if (recommenderOpen) {
        closeRecommenderModal();
      } else if (state.detailPlaceId) {
        closeDetailDrawer();
      } else if (state.guideOpen) {
        closeGuideDrawer();
      } else if (state.shareOpen) {
        closeShareModal();
      }
    }
  });

  function applyRouteFromLocation(): void {
    const match = parseRoute(window.location.pathname, APP_BASE_PATH);
    if (match.view === 'clinic' && match.clinicId) {
      const params = new URLSearchParams(window.location.search);
      const menusParam = params.get('menus');
      const initialMenus = menusParam
        ? menusParam.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
      const visitsParam = Number(params.get('v') ?? '1');
      const visits = Number.isFinite(visitsParam) && visitsParam >= 1 ? Math.min(6, Math.round(visitsParam)) : 1;
      navigateToClinic(match.clinicId, false, initialMenus, visits);
    } else if (activeClinicId) {
      navigateToHome(false);
    }
  }

  window.addEventListener('popstate', () => {
    const parsed = parseHomeQuery(window.location.search);
    if ((parsed.langParam === 'ja' || parsed.langParam === 'ko') && parsed.langParam !== state.lang) {
      state.lang = parsed.langParam;
    }
    state.menuId = parsed.menuId;
    state.area = parsed.area;
    state.sort = parsed.sort;
    state.traitFilters = parsed.traitFilters;
    state.includeVat = parsed.includeVat;
    state.searchQuery = parsed.searchQuery;
    state.japaneseOnly = parsed.japaneseOnly;
    state.moreAreasOpen = EXTRA_AREA_IDS.includes(parsed.area);
    state.searchOpen = parsed.searchQuery.trim().length > 0;
    applyRouteFromLocation();
    renderAll(true);
  });

  renderAll(true);
  applyRouteFromLocation();
  scheduleHomeEntryBurstOnce();

  void refreshLiveNaverFx();
  if (!state.userLocation && 'geolocation' in navigator) {
    requestUserLocation({ silent: true });
  }
}

bootstrap();
