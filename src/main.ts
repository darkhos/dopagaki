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
  FluidToast,
  bindSheetSwipeDismiss,
  closeSheet,
  openSheet,
  triggerHaptic
} from './lib/fluid.ts';
import { SeoulMapController } from './components/map.ts';
import { ClinicPageController } from './components/clinic-page.ts';
import {
  buildClinicUrl,
  detectAppBasePath,
  parseRoute
} from './lib/clinic-helpers.ts';
import {
  TRAIT_FILTERS,
  getBrandReview,
  matchesTraitFilter,
  pickCompactTraits,
  type ClinicTrait
} from './data/brand-reviews.ts';
import { getClinicAiRating } from './lib/ai-rating.ts';

const dataset = rawDataset as unknown as PriceDataset;
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
const VALID_TRAITS: TraitFilterId[] = TRAIT_FILTERS.map((t) => t.id);

function parseHomeQuery(search: string) {
  const params = new URLSearchParams(search);
  const langParam = params.get('lang');
  const menuParam = params.get('menu');
  const menuId = dataset.menus.find((m) => m.id === menuParam)?.id ?? dataset.menus[0].id;
  const areaParam = params.get('area');
  const area: AreaId = VALID_AREAS.includes(areaParam as AreaId) ? (areaParam as AreaId) : 'all';
  const sortParam = params.get('sort');
  const sort: SortId = VALID_SORTS.includes(sortParam as SortId) ? (sortParam as SortId) : 'savings';
  const traitParam = params.get('trait');
  const traitFilter: TraitFilterId = VALID_TRAITS.includes(traitParam as TraitFilterId)
    ? (traitParam as TraitFilterId)
    : 'all';
  const includeVat = params.get('vat') === '0' ? false : true;
  const searchQuery = params.get('q') ?? '';
  const japaneseOnly = params.get('jp') === '1';

  return {
    langParam,
    menuId,
    area,
    sort,
    traitFilter,
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
    traitFilter: parsed.traitFilter,
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
  if (state.traitFilter !== 'all') p.set('trait', state.traitFilter);
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
        <section class="rank" id="rank" aria-label="Clinic Price Ledger"></section>
        <section class="mapwrap" id="mapwrap" aria-label="Seoul Map">
          <div class="map-canvas" id="map-canvas"></div>
          <div class="map-tools" id="map-tools"></div>
          <div class="map-status-overlay" id="map-status"></div>
          <div class="map-legend" id="map-legend"></div>
          <div class="map-card" id="map-card" hidden></div>
        </section>
      </div>
      <div class="clinic-view" id="clinic-view" hidden></div>
    </main>
    <footer class="sitefoot" id="sitefoot"></footer>
    <nav class="apptab" id="apptab" aria-label="Mobile Navigation"></nav>
    <div class="toast" id="toast" role="status" aria-live="polite" aria-hidden="true"></div>
    <div class="drawer-backdrop" id="detail-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="detail-drawer-title"></div>
    <div class="drawer-backdrop" id="guide-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="guide-drawer-title"></div>
    <div class="drawer-backdrop" id="share-modal" hidden role="dialog" aria-modal="true" aria-labelledby="share-modal-title"></div>
    <div class="drawer-backdrop" id="staff-card-modal" hidden role="dialog" aria-modal="true" aria-labelledby="staff-card-title"></div>
  `;

  const siteheadEl = document.getElementById('sitehead')!;
  const homeViewEl = document.getElementById('home-view')!;
  const clinicViewEl = document.getElementById('clinic-view')!;
  const tickerEl = document.getElementById('ticker')!;
  const controlsEl = document.getElementById('controls')!;
  const rankEl = document.getElementById('rank')!;
  const mapwrapEl = document.getElementById('mapwrap')!;
  const mapCanvasEl = document.getElementById('map-canvas')!;
  const mapToolsEl = document.getElementById('map-tools')!;
  const mapStatusEl = document.getElementById('map-status')!;
  const mapLegendEl = document.getElementById('map-legend')!;
  const mapCardEl = document.getElementById('map-card')!;
  const sitefootEl = document.getElementById('sitefoot')!;
  const apptabEl = document.getElementById('apptab')!;
  const toastEl = document.getElementById('toast')!;
  const detailDrawerEl = document.getElementById('detail-drawer')!;
  const guideDrawerEl = document.getElementById('guide-drawer')!;
  const shareModalEl = document.getElementById('share-modal')!;
  const staffCardModalEl = document.getElementById('staff-card-modal')!;

  const toast = new FluidToast(toastEl);
  let currentRows: ComputedRow[] = [];
  let copyResetTimer = 0;
  let mapExpanded = false;
  let activeClinicId: string | null = null;
  let savedHomeScrollY = 0;

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

  const mapController = new SeoulMapController(mapCanvasEl, mapStatusEl, {
    onSelectPlace: (placeId) => {
      state.selectedPlaceId = placeId;
      updateActiveRowDom(placeId, !mapExpanded);
      renderMapCard();
    },
    onOpenDetail: (placeId) => {
      state.selectedPlaceId = placeId;
      navigateToClinic(placeId, true);
    },
    onHoverPlace: (placeId) => {
      state.hoveredPlaceId = placeId;
    }
  });

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
        ? 'ドパガキ美肌相場 | ソウル美容皮膚科164院 × 日本主要5院平均 3秒比較'
        : '도파가키 피부시세 | 서울 피부과 164곳 × 일본 5개 병원 평균 3초 비교';
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
      requestUserLocation({ silent: false, flyToMap: false });
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
    if (mapExpanded) setMapExpanded(false);
    if (state.detailPlaceId) closeDetailDrawer();
    if (state.guideOpen) closeGuideDrawer();
    if (state.shareOpen) closeShareModal();

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

  function navigateToHome(pushHistory: boolean, targetScroll?: 'map' | 'list'): void {
    if (clinicPage.isStaffModalOpen()) clinicPage.closeStaffModal();
    activeClinicId = null;
    clinicViewEl.hidden = true;
    homeViewEl.hidden = false;
    document.body.classList.remove('is-clinic-view');
    updateDocumentTitle();

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
      mapController.resize();
      if (targetScroll === 'map') {
        mapwrapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (targetScroll === 'list') {
        rankEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: savedHomeScrollY, behavior: 'instant' as ScrollBehavior });
      }
    });
    window.setTimeout(() => mapController.resize(), 200);
  }

  function setMapExpanded(next: boolean): void {
    if (mapExpanded === next) return;
    mapExpanded = next;
    mapwrapEl.classList.toggle('is-expanded', mapExpanded);
    document.documentElement.classList.toggle('is-map-expanded', mapExpanded);
    document.body.classList.toggle('is-map-expanded', mapExpanded);
    renderMapTools();
    requestAnimationFrame(() => {
      mapController.resize();
    });
    window.setTimeout(() => {
      mapController.resize();
    }, 160);
  }

  function requestUserLocation(options: { silent?: boolean; flyToMap?: boolean } = {}): void {
    const { silent = false, flyToMap = true } = options;
    if (state.locatingUser) return;
    const copy = getCopy(state.lang);
    if (!('geolocation' in navigator)) {
      if (!silent) showToast(copy.toastLocateUnsupported);
      return;
    }

    state.locatingUser = true;
    renderMapTools();
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
        if (flyToMap) state.selectedPlaceId = null;

        const inKorea = isPointInSouthKorea(coords);
        renderRank(false);
        if (inKorea) {
          mapController.setUserLocation(coords, flyToMap);
        }
        renderMapTools();
        renderMapLegend();
        renderMapCard();
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
        renderMapTools();
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
  function renderSiteHead(): void {
    document.documentElement.lang = state.lang;
    const copy = getCopy(state.lang);
    updateDocumentTitle();

    const totalCount = dataset.places.length;
    const metaText =
      state.lang === 'ja'
        ? `ソウル25ブランド ${totalCount}院 公式料金`
        : `서울 25개 브랜드 ${totalCount}곳 공식가`;
    const brandHtml =
      state.lang === 'ja'
        ? `<span class="misreg" data-text="ドパガキ">ドパガキ</span>美肌相場`
        : `<span class="misreg" data-text="도파가키">도파가키</span> 피부시세`;

    if (!siteheadEl.querySelector('#brand-word')) {
      siteheadEl.innerHTML = `
        <div class="shrow">
          <button type="button" class="shleft shleft-btn" id="brand-home-btn">
            <img class="brand-emblem" src="${dopagakiMarkUrl}" width="48" height="48" alt="" fetchpriority="high" />
            <div class="brand-stack">
              <span class="logo-word" id="brand-word">${brandHtml}</span>
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
    if (brandEl) brandEl.innerHTML = brandHtml;
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
          state.traitFilter === 'all'
            ? undefined
            : (place) => matchesTraitFilter(place, state.traitFilter)
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

    if (!controlsEl.querySelector('#more-areas-collapse')) {
      controlsEl.innerHTML = `
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
  function renderRank(fitMapBounds: boolean): void {
    const copy = getCopy(state.lang);

    const baseRowsForTraits = buildRankedRows(
      dataset,
      state.menuId,
      state.area,
      state.sort,
      state.krwPer100Jpy,
      state.includeVat,
      {
        searchQuery: state.searchQuery,
        japaneseOnly: state.japaneseOnly,
        origin: state.userLocation
      }
    );

    currentRows =
      state.traitFilter === 'all'
        ? baseRowsForTraits
        : baseRowsForTraits.filter((r) => matchesTraitFilter(r.place, state.traitFilter));

    const traitFilterBarLabel = state.lang === 'ja' ? '特徴' : '특성';
    const traitFilterButtonsHtml = TRAIT_FILTERS.map((tf) => {
      const count =
        tf.id === 'all'
          ? baseRowsForTraits.length
          : baseRowsForTraits.filter((r) => matchesTraitFilter(r.place, tf.id)).length;
      const pressed = state.traitFilter === tf.id;
      const lbl = state.lang === 'ja' ? tf.labelJa : tf.labelKo;
      const iconSvg = tf.icon ? icons[tf.icon] : '';
      return `
        <button
          type="button"
          class="trait-filter-btn"
          data-trait-filter="${tf.id}"
          aria-pressed="${pressed}"
          ${count === 0 && !pressed ? 'disabled' : ''}
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
    const jpShortLabel = state.lang === 'ja' ? '日本語OK' : '일본어 가능만';
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
            <label class="chk-label">
              <input type="checkbox" id="jp-only-chk" ${state.japaneseOnly ? 'checked' : ''} />
              <span id="jp-only-label">${escapeHtml(jpShortLabel)}</span>
            </label>
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
          <span class="trait-filter-kicker" id="trait-filter-kicker">${escapeHtml(traitFilterBarLabel)}</span>
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
      const jpChk = rankEl.querySelector<HTMLInputElement>('#jp-only-chk');
      const jpLbl = rankEl.querySelector<HTMLElement>('#jp-only-label');
      if (jpChk) jpChk.checked = state.japaneseOnly;
      if (jpLbl) jpLbl.textContent = jpShortLabel;

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
      if (traitKicker) traitKicker.textContent = traitFilterBarLabel;
      if (traitScroll) traitScroll.innerHTML = traitFilterButtonsHtml;

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
                  const vibeText = state.lang === 'ja' ? rev.vibeJa : rev.vibeKo;
                  const revTag = state.lang === 'ja' ? rev.shortTagJa : rev.shortTagKo;
                  const compactTraits = pickCompactTraits(rev.traits, 3);
                  const traitsHtml = renderTraitChipsHtml(compactTraits, state.lang);
                  const showSnippet = rev.reviewScope === 'branch' && rev.verificationTier !== 'limited';
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
                            ${row.place.japaneseSupport ? `<i class="tg tg-jp">${escapeHtml(copy.jpSupportTag)}</i>` : ''}
                            <i class="tg tg-of">${escapeHtml(officialTag)}</i>
                            <i class="tg tg-seoul is-${seoulBadge.tone} num">${escapeHtml(seoulBadge.text)}</i>
                            <span class="meta-loc">${escapeHtml(station)}</span>
                            ${dist ? `<span class="meta-loc meta-dist">${escapeHtml(dist)}</span>` : ''}
                          </span>
                          <span class="row-char">
                            <span class="row-char-tags">
                              <span class="char-vibe ${rev.reviewScope === 'branch' ? 'is-branch' : ''}">${escapeHtml(vibeText)}</span>
                              ${traitsHtml}
                            </span>
                            ${showSnippet ? `<span class="row-rev">${escapeHtml(revTag)}</span>` : ''}
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

    mapController.updateData(currentRows, dataset.areas, state.selectedPlaceId, fitMapBounds);
    renderMapTools();
    renderMapLegend();
    renderMapCard();
  }

  function renderMapTools(): void {
    const copy = getCopy(state.lang);
    const hasUserLoc = isPointInSouthKorea(state.userLocation);
    const locateLabel = state.locatingUser ? copy.mapLocating : copy.mapLocate;
    mapToolsEl.innerHTML = `
      <button
        type="button"
        class="map-tool-btn map-tool-btn--locate ${hasUserLoc ? 'is-active' : ''} ${state.locatingUser ? 'is-locating' : ''}"
        id="map-locate-btn"
        aria-pressed="${hasUserLoc}"
        ${state.locatingUser ? 'disabled' : ''}
      >
        ${icons.locate}
        <span>${escapeHtml(locateLabel)}</span>
      </button>
      <button type="button" class="map-tool-btn" id="map-reset-btn">
        ${icons.resetView}
        <span class="lbl-full">${escapeHtml(copy.mapResetView)}</span>
        <span class="lbl-short">${escapeHtml(copy.mapResetViewShort)}</span>
      </button>
      <button type="button" class="map-tool-btn ${mapExpanded ? 'is-active' : ''}" id="map-expand-btn" aria-pressed="${mapExpanded}">
        ${mapExpanded ? icons.shrink : icons.expand}
        <span class="lbl-full">${escapeHtml(mapExpanded ? copy.mapCollapse : copy.mapExpand)}</span>
        <span class="lbl-short">${escapeHtml(mapExpanded ? copy.mapCollapseShort : copy.mapExpandShort)}</span>
      </button>
    `;
  }

  function renderMapLegend(): void {
    const copy = getCopy(state.lang);
    const placeLabel =
      state.lang === 'ja' ? `${currentRows.length}院` : `${currentRows.length}곳 표시`;
    const primaryItem = isPointInSouthKorea(state.userLocation)
      ? `<span class="legend-item"><span class="legend-swatch is-user" aria-hidden="true"></span>${escapeHtml(copy.userLocationLabel)}</span>`
      : '';
    mapLegendEl.innerHTML = `
      ${primaryItem}
      <span class="legend-item"><span class="legend-swatch is-active" aria-hidden="true"></span>${escapeHtml(placeLabel)}</span>
    `;
  }

  function renderMapCard(): void {
    const row = state.selectedPlaceId
      ? currentRows.find((r) => r.place.id === state.selectedPlaceId)
      : undefined;
    mapwrapEl.classList.toggle('has-card', Boolean(row));
    if (!row) {
      mapCardEl.hidden = true;
      mapCardEl.innerHTML = '';
      mapLegendEl.hidden = false;
      return;
    }

    const copy = getCopy(state.lang);
    const name = state.lang === 'ja' ? row.place.nameJa : row.place.nameKo;
    const station = state.lang === 'ja' ? row.place.stationJa : row.place.stationKo;
    const dist = formatDistance(row.distanceMeters, state.lang, isPointInSouthKorea(state.userLocation));
    const wonText = formatCompactKrw(row.totalKrw, state.lang);
    const saveText =
      row.savingsJpy >= 0
        ? copy.savingsBadge(formatJpy(row.savingsJpy))
        : copy.moreExpensiveBadge(formatJpy(Math.abs(row.savingsJpy)));

    const rev = getBrandReview(row.place);
    const ai = getClinicAiRating(row.place, dataset.places);
    const vibeText = state.lang === 'ja' ? rev.vibeJa : rev.vibeKo;
    const compactTraits = pickCompactTraits(rev.traits, 3);
    const traitsHtml = renderTraitChipsHtml(compactTraits, state.lang);
    const seoulBadge = formatSeoulDiffBadge(row.seoulDiffPct, state.lang);

    mapLegendEl.hidden = true;
    mapCardEl.hidden = false;
    mapCardEl.innerHTML = `
      <div class="map-card-top">
        <div class="map-card-head">
          <strong class="map-card-title">${escapeHtml(name)}</strong>
          <span class="ai-pill is-${ai.grade} num">${icons.star}<span>AI ${escapeHtml(ai.formatted)}</span></span>
          ${row.place.japaneseSupport ? `<em class="tg tg-jp">${escapeHtml(copy.jpSupportTag)}</em>` : ''}
        </div>
        <button type="button" class="map-card-close" id="map-card-close" aria-label="${escapeHtml(copy.drawerClose)}">${icons.close}</button>
      </div>
      <div class="map-card-sub">${escapeHtml(dist ? `${station} · ${dist}` : station)}</div>
      <div class="map-card-traits">
        <span class="char-vibe ${rev.reviewScope === 'branch' ? 'is-branch' : ''}">${escapeHtml(vibeText)}</span>
        ${traitsHtml}
      </div>
      <div class="map-card-bottom">
        <div class="map-card-pricing">
          <strong class="map-card-price num">${escapeHtml(formatJpy(row.krTotalJpy))}</strong>
          <span class="map-card-won num">${escapeHtml(wonText)}</span>
          <span class="map-card-save num ${row.savingsJpy < 0 ? 'is-over' : ''}">${escapeHtml(saveText)}</span>
          <span class="tg tg-seoul is-${seoulBadge.tone} num">${escapeHtml(seoulBadge.text)}</span>
        </div>
        <button type="button" class="map-card-btn" id="map-card-detail" data-place-id="${row.place.id}">${escapeHtml(copy.mapPopupDetails)}</button>
      </div>
    `;
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
            'ソウル主要25ブランド164院の美容皮膚科公式サイト公開価格のみを集めています。',
            '日本側の比較基準は主要5院の税込公式料金の平均値（上部の日本5院平均相場カードから内訳を確認可）です。',
            `円換算はNAVER金融（${bank} ${naverFx.dateLabel} 売買基準レート 100円=₩${fxStr}）を毎日自動反映し、2026年免税終了後の韓国税金10%を加算比較しています。`
          ]
        : [
            '공식 홈페이지에 가격표를 공개하는 서울 주요 25개 피부과 브랜드 164곳의 공개가만 모았습니다.',
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
     5. Mobile 4-Tab Solid Ruled Bar
     ========================================================= */
  function renderAppTab(): void {
    const labels =
      state.lang === 'ja'
        ? { list: 'ランキング', map: '地図', guide: '豆知識', share: '共有' }
        : { list: '순위', map: '지도', guide: '꿀팁', share: '공유' };

    if (!apptabEl.querySelector('.apptab-btn')) {
      apptabEl.innerHTML = `
        <button type="button" class="apptab-btn ${state.activeTab === 'list' ? 'is-active' : ''}" data-tab="list">
          ${icons.list}
          <span class="apptab-lbl">${escapeHtml(labels.list)}</span>
        </button>
        <button type="button" class="apptab-btn ${state.activeTab === 'map' ? 'is-active' : ''}" data-tab="map">
          ${icons.map}
          <span class="apptab-lbl">${escapeHtml(labels.map)}</span>
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

    const mapLabels: Record<AppState['activeTab'], string> = labels;
    apptabEl.querySelectorAll<HTMLButtonElement>('.apptab-btn').forEach((btn) => {
      const t = btn.dataset.tab as AppState['activeTab'];
      const lbl = btn.querySelector('.apptab-lbl');
      if (lbl && mapLabels[t]) lbl.textContent = mapLabels[t];
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
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.lat},${place.lng}`)}`;
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
    const drawerAi = getClinicAiRating(place, dataset.places);
    const drawerVibe = state.lang === 'ja' ? drawerRev.vibeJa : drawerRev.vibeKo;
    const drawerTraitsHtml = renderTraitChipsHtml(drawerRev.traits, state.lang);
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
            <span class="ai-pill is-${drawerAi.grade} num">${icons.star}<span>AI ${escapeHtml(drawerAi.formatted)} / 5.0</span></span>
            <span class="char-vibe ${drawerRev.reviewScope === 'branch' ? 'is-branch' : ''}">${escapeHtml(drawerVibe)}</span>
            ${drawerTraitsHtml}
          </div>
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

          <a class="primary-btn" href="${escapeHtml(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">
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
            <a class="ext-link-btn" href="${escapeHtml(googleUrl)}" target="_blank" rel="noopener noreferrer">
              ${icons.navigation}<span>${escapeHtml(copy.openGoogleMap)}</span>
            </a>
          </div>
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

  function renderAll(fitMapBounds: boolean): void {
    renderSiteHead();
    renderTicker();
    renderControls();
    renderRank(fitMapBounds);
    renderSiteFoot();
    renderAppTab();
    if (activeClinicId) clinicPage.updateContext(getClinicContext());
    if (state.detailPlaceId) renderDetailDrawer();
    if (state.guideOpen) renderGuideDrawer();
    if (state.shareOpen) void renderShareModal(state.shareLang);
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
    mapController.setLanguage(nextLang);
    renderAll(false);
  }

  function goToDefaultHome(): void {
    triggerHaptic(6);
    if (mapExpanded) setMapExpanded(false);
    if (state.detailPlaceId) closeDetailDrawer();
    if (state.guideOpen) closeGuideDrawer();
    if (state.shareOpen) closeShareModal();
    if (clinicPage.isStaffModalOpen()) clinicPage.closeStaffModal();

    const wasClinicView = Boolean(activeClinicId);
    const prevUrl = window.location.href;

    // Reset to canonical Home state with default treatment (rejuran-2cc) active
    state.menuId = dataset.menus[0].id;
    state.area = 'all';
    state.sort = 'savings';
    state.traitFilter = 'all';
    state.searchQuery = '';
    state.searchOpen = false;
    state.moreAreasOpen = false;
    state.japaneseOnly = false;
    state.selectedPlaceId = null;
    savedHomeScrollY = 0;
    setActiveTab('list');

    if (wasClinicView) {
      navigateToHome(true);
      renderAll(true);
      mapController.clearSelection();
      return;
    }

    renderAll(true);
    mapController.clearSelection();
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
    const menuBtn = target.closest<HTMLButtonElement>('[data-menu]');
    if (menuBtn?.dataset.menu && menuBtn.dataset.menu !== state.menuId) {
      triggerHaptic(6);
      state.menuId = menuBtn.dataset.menu;
      state.selectedPlaceId = null;
      syncUrl(state);
      renderTicker();
      renderControls();
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

  rankEl.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'jp-only-chk') {
      triggerHaptic(6);
      state.japaneseOnly = target.checked;
      syncUrl(state);
      renderControls();
      renderRank(true);
    } else if (target.id === 'vat-chk') {
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
      state.traitFilter = 'all';
      state.searchQuery = '';
      state.japaneseOnly = false;
      state.moreAreasOpen = false;
      syncUrl(state);
      renderControls();
      renderRank(true);
      return;
    }
    const traitBtn = target.closest<HTMLButtonElement>('[data-trait-filter]');
    if (traitBtn?.dataset.traitFilter) {
      const clicked = traitBtn.dataset.traitFilter as TraitFilterId;
      const nextTrait: TraitFilterId =
        clicked !== 'all' && state.traitFilter === clicked ? 'all' : clicked;
      triggerHaptic(6);
      state.traitFilter = nextTrait;
      state.selectedPlaceId = null;
      syncUrl(state);
      renderControls();
      renderRank(true);
      return;
    }
    if (target.closest('#rank-locate-btn')) {
      triggerHaptic(6);
      requestUserLocation({ silent: false, flyToMap: false });
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
          requestUserLocation({ silent: false, flyToMap: false });
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
    } else if (tab === 'map') {
      if (activeClinicId) {
        navigateToHome(true, 'map');
      } else {
        mapwrapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => mapController.resize(), 140);
        window.setTimeout(() => mapController.resize(), 380);
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

  mapwrapEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#map-locate-btn')) {
      triggerHaptic(6);
      requestUserLocation();
      return;
    }
    if (target.closest('#map-reset-btn')) {
      triggerHaptic(6);
      state.selectedPlaceId = null;
      updateActiveRowDom(null, false);
      mapController.clearSelection();
      mapController.fitAll();
      renderMapCard();
      return;
    }
    if (target.closest('#map-expand-btn')) {
      triggerHaptic(6);
      setMapExpanded(!mapExpanded);
      return;
    }
    if (target.closest('#map-card-close')) {
      triggerHaptic(6);
      state.selectedPlaceId = null;
      updateActiveRowDom(null, false);
      mapController.clearSelection();
      renderMapCard();
      return;
    }
    const detailBtn = target.closest<HTMLButtonElement>('#map-card-detail');
    if (detailBtn?.dataset.placeId) {
      triggerHaptic(6);
      navigateToClinic(detailBtn.dataset.placeId, true);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (clinicPage.isStaffModalOpen()) {
        clinicPage.closeStaffModal();
      } else if (state.detailPlaceId) {
        closeDetailDrawer();
      } else if (state.guideOpen) {
        closeGuideDrawer();
      } else if (state.shareOpen) {
        closeShareModal();
      } else if (mapExpanded) {
        setMapExpanded(false);
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
      mapController.setLanguage(parsed.langParam);
    }
    state.menuId = parsed.menuId;
    state.area = parsed.area;
    state.sort = parsed.sort;
    state.traitFilter = parsed.traitFilter;
    state.includeVat = parsed.includeVat;
    state.searchQuery = parsed.searchQuery;
    state.japaneseOnly = parsed.japaneseOnly;
    state.moreAreasOpen = EXTRA_AREA_IDS.includes(parsed.area);
    state.searchOpen = parsed.searchQuery.trim().length > 0;
    applyRouteFromLocation();
    renderAll(true);
  });

  mapController.init(dataset.meta.venue, state.lang);
  if (isPointInSouthKorea(state.userLocation)) {
    mapController.setUserLocation(state.userLocation!, false);
  }
  renderAll(true);
  applyRouteFromLocation();
  void refreshLiveNaverFx();
  if (!state.userLocation && 'geolocation' in navigator) {
    requestUserLocation({ silent: true, flyToMap: false });
  }
}

bootstrap();
