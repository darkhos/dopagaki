import './styles/tokens.css';
import './styles/app.css';
import QRCode from 'qrcode';
import rawDataset from './data/prices.json';
import type {
  AppState,
  AreaId,
  CategoryId,
  ComputedRow,
  Lang,
  PlanEntry,
  PriceDataset,
  SortId
} from './types.ts';
import {
  buildRankedRows,
  computeRow,
  formatDistance,
  formatJpy,
  formatKrw,
  jpyToKrw,
  parsePlanParam,
  serializePlanParam,
  summarizePlan
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

const dataset = rawDataset as unknown as PriceDataset;

const STORAGE_RATE_KEY = 'seoul_payback_krw_per_100';
const STORAGE_PLAN_KEY = 'seoul_payback_plan_v1';
const STORAGE_LANG_KEY = 'seoul_payback_lang';

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
  seongsu: { ko: '성수·건대', ja: '聖水·建大' },
  yeouido: { ko: '여의도·영등포', ja: '汝矣島·永登浦' },
  magok: { ko: '마곡·김포', ja: '麻谷·金浦' },
  nowon: { ko: '노원·강북', ja: '盧原·江北' },
  cheonho: { ko: '천호·강동', ja: '千戸·江東' },
  gwanak: { ko: '신림·서울대', ja: '新林·ソウル大' },
  yongsan: { ko: '용산·공덕', ja: '龍山·孔徳' }
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

function loadSavedPlan(): PlanEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_PLAN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PlanEntry =>
        typeof item?.key === 'string' &&
        typeof item?.placeId === 'string' &&
        typeof item?.menuId === 'string'
    );
  } catch {
    return [];
  }
}

function loadInitialState(): AppState & { moreAreasOpen: boolean; searchOpen: boolean } {
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get('lang');
  let savedLang: string | null = null;
  try {
    savedLang = localStorage.getItem(STORAGE_LANG_KEY);
  } catch {
    savedLang = null;
  }
  const lang: Lang =
    langParam === 'ko' || langParam === 'ja' ? langParam : savedLang === 'ko' ? 'ko' : 'ja';

  const catParam = params.get('cat');
  const category: CategoryId = catParam === 'eyewear' ? 'eyewear' : 'beauty';

  const catMenus = dataset.menus.filter((m) => m.category === category);
  const menuParam = params.get('menu');
  const menuId = catMenus.find((m) => m.id === menuParam)?.id ?? catMenus[0].id;

  const areaParam = params.get('area');
  const validAreas: AreaId[] = [
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
  const area: AreaId = validAreas.includes(areaParam as AreaId) ? (areaParam as AreaId) : 'all';

  const sortParam = params.get('sort');
  const validSorts: SortId[] = ['savings', 'price', 'distance'];
  const sort: SortId = validSorts.includes(sortParam as SortId) ? (sortParam as SortId) : 'savings';

  const includeVat = params.get('vat') === '0' ? false : true;

  let krwPer100Jpy = dataset.meta.defaultKrwPer100Jpy;
  const rateParam = Number(params.get('rate'));
  const savedRate = Number(localStorage.getItem(STORAGE_RATE_KEY));
  if (Number.isFinite(rateParam) && rateParam >= 700 && rateParam <= 1200) {
    krwPer100Jpy = Math.round(rateParam);
  } else if (Number.isFinite(savedRate) && savedRate >= 700 && savedRate <= 1200) {
    krwPer100Jpy = Math.round(savedRate);
  }

  const flightParam = Number(params.get('flight'));
  const flightTargetJpy =
    Number.isFinite(flightParam) && flightParam >= 15000 && flightParam <= 80000
      ? Math.round(flightParam / 1000) * 1000
      : dataset.meta.defaultFlightJpy;

  const urlPlan = parsePlanParam(params.get('plan'), dataset);
  const plan = urlPlan.length > 0 ? urlPlan : loadSavedPlan();
  const searchQuery = params.get('q') ?? '';

  return {
    lang,
    category,
    menuId,
    area,
    sort,
    searchQuery,
    japaneseOnly: params.get('jp') === '1',
    includeVat,
    krwPer100Jpy,
    flightTargetJpy,
    plan,
    selectedPlaceId: null,
    hoveredPlaceId: null,
    detailPlaceId: null,
    guideOpen: false,
    shareOpen: false,
    shareLang: lang,
    fxPanelOpen: false,
    planOpen: false,
    mobileView: 'list',
    moreAreasOpen: EXTRA_AREA_IDS.includes(area),
    searchOpen: searchQuery.trim().length > 0
  };
}

function buildShareUrl(state: AppState, overrideLang?: Lang): string {
  const url = new URL(window.location.href);
  const p = new URLSearchParams();
  p.set('lang', overrideLang ?? state.lang);
  p.set('cat', state.category);
  p.set('menu', state.menuId);
  if (state.area !== 'all') p.set('area', state.area);
  if (state.sort !== 'savings') p.set('sort', state.sort);
  if (!state.includeVat) p.set('vat', '0');
  if (state.krwPer100Jpy !== dataset.meta.defaultKrwPer100Jpy) {
    p.set('rate', String(state.krwPer100Jpy));
  }
  if (state.flightTargetJpy !== dataset.meta.defaultFlightJpy) {
    p.set('flight', String(state.flightTargetJpy));
  }
  if (state.japaneseOnly) p.set('jp', '1');
  if (state.searchQuery.trim()) p.set('q', state.searchQuery.trim());
  const planStr = serializePlanParam(state.plan);
  if (planStr) p.set('plan', planStr);
  url.search = p.toString();
  return url.toString();
}

function syncUrl(state: AppState): void {
  try {
    const nextUrl = buildShareUrl(state);
    window.history.replaceState(null, '', nextUrl);
  } catch {
    // Ignore history restrictions
  }
}

function savePlan(plan: PlanEntry[]): void {
  try {
    localStorage.setItem(STORAGE_PLAN_KEY, JSON.stringify(plan));
  } catch {
    // Ignore quota errors
  }
}

function bootstrap(): void {
  const root = document.getElementById('app');
  if (!root) return;

  const state = loadInitialState();

  root.innerHTML = `
    <header class="sitehead" id="sitehead"></header>
    <main class="screen" id="screen">
      <div class="hotline" id="hotline"></div>
      <section class="pick menupick" id="menupick"></section>
      <section class="pick areapick" id="areapick"></section>
      <section class="rank" id="rank"></section>
      <section class="mapwrap" id="mapwrap" aria-label="Seoul Map">
        <div class="map-canvas" id="map-canvas"></div>
        <div class="map-status-overlay" id="map-status"></div>
        <div class="map-legend" id="map-legend"></div>
      </section>
    </main>
    <footer class="sitefoot" id="sitefoot"></footer>
    <nav class="apptab" id="apptab" aria-label="Mobile Navigation"></nav>
    <div class="toast" id="toast" role="status" aria-live="polite" aria-hidden="true"></div>
    <div class="drawer-backdrop" id="detail-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="detail-drawer-title"></div>
    <div class="drawer-backdrop" id="plan-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="plan-drawer-title"></div>
    <div class="drawer-backdrop" id="guide-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="guide-drawer-title"></div>
    <div class="drawer-backdrop" id="share-modal" hidden role="dialog" aria-modal="true" aria-labelledby="share-modal-title"></div>
  `;

  const siteheadEl = document.getElementById('sitehead')!;
  const hotlineEl = document.getElementById('hotline')!;
  const menupickEl = document.getElementById('menupick')!;
  const areapickEl = document.getElementById('areapick')!;
  const rankEl = document.getElementById('rank')!;
  const mapwrapEl = document.getElementById('mapwrap')!;
  const mapCanvasEl = document.getElementById('map-canvas')!;
  const mapStatusEl = document.getElementById('map-status')!;
  const mapLegendEl = document.getElementById('map-legend')!;
  const sitefootEl = document.getElementById('sitefoot')!;
  const apptabEl = document.getElementById('apptab')!;
  const toastEl = document.getElementById('toast')!;
  const detailDrawerEl = document.getElementById('detail-drawer')!;
  const planDrawerEl = document.getElementById('plan-drawer')!;
  const guideDrawerEl = document.getElementById('guide-drawer')!;
  const shareModalEl = document.getElementById('share-modal')!;

  const toast = new FluidToast(toastEl);
  let currentRows: ComputedRow[] = [];

  function showToast(message: string, isOk = false): void {
    toast.show(`${isOk ? icons.check : icons.info}<span>${escapeHtml(message)}</span>`, isOk);
  }

  function isSheetOpen(el: HTMLElement): boolean {
    return !el.hidden && !el.classList.contains('is-closing');
  }

  function closeDetailDrawer(): void {
    state.detailPlaceId = null;
    closeSheet(detailDrawerEl, () => {
      if (!state.detailPlaceId) {
        detailDrawerEl.innerHTML = '';
      }
    });
  }

  function closePlanDrawer(): void {
    state.planOpen = false;
    closeSheet(planDrawerEl, () => {
      if (!state.planOpen) {
        planDrawerEl.innerHTML = '';
      }
    });
  }

  function closeGuideDrawer(): void {
    state.guideOpen = false;
    closeSheet(guideDrawerEl, () => {
      if (!state.guideOpen) {
        guideDrawerEl.innerHTML = '';
      }
    });
  }

  function closeShareModal(): void {
    state.shareOpen = false;
    closeSheet(shareModalEl, () => {
      if (!state.shareOpen) {
        shareModalEl.innerHTML = '';
      }
    });
  }

  const mapController = new SeoulMapController(mapCanvasEl, mapStatusEl, {
    onSelectPlace: (placeId) => {
      state.selectedPlaceId = placeId;
      updateActiveRowDom(placeId, true);
    },
    onOpenDetail: (placeId) => {
      state.selectedPlaceId = placeId;
      state.detailPlaceId = placeId;
      renderDetailDrawer();
    },
    onHoverPlace: (placeId) => {
      state.hoveredPlaceId = placeId;
    }
  });

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

  function isInPlan(placeId: string, menuId: string): boolean {
    const key = `${placeId}::${menuId}`;
    return state.plan.some((p) => p.key === key);
  }

  function togglePlanItem(placeId: string, menuId: string): void {
    const copy = getCopy(state.lang);
    const place = dataset.places.find((p) => p.id === placeId);
    const placeName = place ? (state.lang === 'ja' ? place.nameJa : place.nameKo) : '';

    const prevSummary = summarizePlan(
      dataset,
      state.plan,
      state.krwPer100Jpy,
      state.includeVat,
      state.flightTargetJpy
    );

    const key = `${placeId}::${menuId}`;
    const exists = state.plan.some((p) => p.key === key);
    if (exists) {
      state.plan = state.plan.filter((p) => p.key !== key);
    } else {
      state.plan = [...state.plan, { key, placeId, menuId }];
    }
    savePlan(state.plan);
    syncUrl(state);

    const nextSummary = summarizePlan(
      dataset,
      state.plan,
      state.krwPer100Jpy,
      state.includeVat,
      state.flightTargetJpy
    );

    if (!exists && !prevSummary.paybackReached && nextSummary.paybackReached) {
      triggerHaptic([12, 40, 18]);
      showToast(copy.toastPaybackReached(formatJpy(nextSummary.totalSavingsJpy)), true);
    } else if (!exists) {
      triggerHaptic(10);
      showToast(copy.toastAdded(placeName), false);
    } else {
      triggerHaptic(8);
      showToast(copy.toastRemoved(placeName), false);
    }

    renderAreaPick();
    renderRank(false);
    renderAppTab();
    if (state.detailPlaceId) renderDetailDrawer();
    if (state.planOpen) renderPlanDrawer();
  }

  function updateFxRate(nextRate: number): void {
    const clamped = Math.max(700, Math.min(1200, Math.round(nextRate)));
    state.krwPer100Jpy = clamped;
    try {
      localStorage.setItem(STORAGE_RATE_KEY, String(clamped));
    } catch {
      // ignore
    }
    syncUrl(state);
    renderAreaPick();
    renderRank(false);
    renderAppTab();
    if (state.detailPlaceId) renderDetailDrawer();
    if (state.planOpen) renderPlanDrawer();
  }

  /* =========================================================
     1. Top Translucent Header (In-Place Sliding Lang Thumb)
     ========================================================= */
  function renderSiteHead(): void {
    document.documentElement.lang = state.lang;
    document.title =
      state.lang === 'ja'
        ? '実質タダ渡韓マップ | 韓国で美容・メガネしたら航空券がタダ同然!?'
        : '비행기값 뽕뽑기 | 서울 피부과·안경 일본보다 얼마나 쌀까?';

    const brandHtml =
      state.lang === 'ja'
        ? `実質タダ<em>渡韓マップ</em>`
        : `비행기값 <em>뽕뽑기</em>`;
    const totalCount = dataset.places.length;
    const pillText =
      state.lang === 'ja'
        ? `ソウル全域 ${totalCount}店舗 · 公式サイト価格`
        : `서울 전역 ${totalCount}곳 · 공식가 기준`;
    const shareLabel = getCopy(state.lang).shareBtn;
    const segIdx = state.lang === 'ja' ? '0' : '1';

    if (!siteheadEl.querySelector('#head-lang-switch')) {
      siteheadEl.innerHTML = `
        <div class="shrow">
          <div class="shleft">
            <span class="logo-mark" aria-hidden="true">${icons.plane}</span>
            <h1 class="logo-word" id="brand-word">${brandHtml}</h1>
            <span class="shpill">
              <span class="shpill-dot" aria-hidden="true"></span>
              <span id="shpill-text">${escapeHtml(pillText)}</span>
            </span>
          </div>
          <div class="shright">
            <button type="button" class="sh-icon-btn" id="head-share-btn">
              ${icons.share}
              <span id="head-share-label">${escapeHtml(shareLabel)}</span>
            </button>
            <div class="lang-switch" id="head-lang-switch" role="group" aria-label="Language" style="--seg-idx:${segIdx}">
              <span class="lang-thumb" aria-hidden="true"></span>
              <button type="button" class="lang-btn" data-lang="ja" aria-pressed="${state.lang === 'ja'}">日本語</button>
              <button type="button" class="lang-btn" data-lang="ko" aria-pressed="${state.lang === 'ko'}">한국어</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const brandEl = siteheadEl.querySelector<HTMLElement>('#brand-word');
    const pillEl = siteheadEl.querySelector<HTMLElement>('#shpill-text');
    const shareLblEl = siteheadEl.querySelector<HTMLElement>('#head-share-label');
    const langSwitchEl = siteheadEl.querySelector<HTMLElement>('#head-lang-switch');

    if (brandEl) brandEl.innerHTML = brandHtml;
    if (pillEl) pillEl.textContent = pillText;
    if (shareLblEl) shareLblEl.textContent = shareLabel;
    if (langSwitchEl) {
      langSwitchEl.style.setProperty('--seg-idx', segIdx);
      langSwitchEl.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.dataset.lang === state.lang));
      });
    }
  }

  /* =========================================================
     2. 1-Line Notice Strip
     ========================================================= */
  function renderHotline(): void {
    const isBeauty = state.category === 'beauty';
    const tag = state.lang === 'ja' ? '2026 案内' : '2026 안내';
    const msg = isBeauty
      ? state.lang === 'ja'
        ? '2026年から韓国皮膚科は免税終了 · 税金10%込みで日本公式価格と比較中'
        : '2026년부터 피부과 세금 환급 종료 · 세금 10% 미리 더해 일본 공식가와 비교해요'
      : state.lang === 'ja'
        ? '韓国メガネは税込定価 · 持込レンズ交換は加工費₩5,000込みで比較中'
        : '한국 안경원은 세금 포함 정가 · 렌즈 교체는 가공비 5,000원까지 포함해 비교해요';
    const btn = state.lang === 'ja' ? '豆知識 ›' : '꿀팁 ›';

    hotlineEl.innerHTML = `
      <span class="hotline-tag">${escapeHtml(tag)}</span>
      <span class="hotline-text">${escapeHtml(msg)}</span>
      <button type="button" class="hotline-btn" id="open-guide-btn">${escapeHtml(btn)}</button>
    `;
  }

  /* =========================================================
     3. Category Segmented Control + Continuous Gliding Dial
     ========================================================= */
  function renderMenuPick(): void {
    const copy = getCopy(state.lang);
    const beautyCount = dataset.places.filter((p) => p.category === 'beauty').length;
    const eyewearCount = dataset.places.filter((p) => p.category === 'eyewear').length;
    const menus = dataset.menus.filter((m) => m.category === state.category);
    const activeIdx = Math.max(
      0,
      menus.findIndex((m) => m.id === state.menuId)
    );
    const activeMenu = menus[activeIdx] ?? menus[0];
    const progress = menus.length > 1 ? activeIdx / (menus.length - 1) : 0;
    const catIdx = state.category === 'eyewear' ? '1' : '0';

    const jpSource =
      state.lang === 'ja'
        ? activeMenu.jpSourceName
        : activeMenu.jpSourceNameKo ?? activeMenu.jpSourceName;
    const jpRefLabel =
      state.lang === 'ja'
        ? `日本公式(${jpSource}) <strong>${formatJpy(activeMenu.jpBenchmarkJpy)}</strong>`
        : `일본 공식(${jpSource}) <strong>${formatJpy(activeMenu.jpBenchmarkJpy)}</strong>`;

    if (!menupickEl.querySelector('#dial-glider')) {
      menupickEl.innerHTML = `
        <div class="menupick-top">
          <div class="cat-pills" id="cat-pills" role="tablist" aria-label="Category" style="--seg-idx:${catIdx}">
            <span class="cat-thumb" aria-hidden="true"></span>
            <button type="button" class="cat-pill" role="tab" data-cat="beauty" aria-selected="${state.category === 'beauty'}">
              ${icons.clinic}
              <span class="cat-pill-label">${escapeHtml(copy.tabBeauty)}</span>
              <span class="cat-pill-count">${beautyCount}</span>
            </button>
            <button type="button" class="cat-pill" role="tab" data-cat="eyewear" aria-selected="${state.category === 'eyewear'}">
              ${icons.glasses}
              <span class="cat-pill-label">${escapeHtml(copy.tabEyewear)}</span>
              <span class="cat-pill-count">${eyewearCount}</span>
            </button>
          </div>
          <a class="jp-ref-link" id="jp-ref-link" href="${escapeHtml(activeMenu.jpSourceUrl)}" target="_blank" rel="noopener noreferrer">
            <span id="jp-ref-text">${jpRefLabel}</span>
            ${icons.external}
          </a>
        </div>

        <div class="dial-wrap" role="group" aria-label="Menu">
          <div class="dial-track" aria-hidden="true">
            <div class="dial-track-fill" id="dial-track-fill" style="--dial-progress:${progress}"></div>
          </div>
          <div class="dial-glider-rail" aria-hidden="true">
            <div class="dial-glider" id="dial-glider" style="--dial-idx:${activeIdx}">
              <span class="dial-badge">${icons.plane}</span>
            </div>
          </div>
          <div class="dial-stops" id="dial-stops">
            ${menus
              .map((m) => {
                const selected = m.id === activeMenu.id;
                const label = state.lang === 'ja' ? m.shortJa : m.shortKo;
                return `
                  <button type="button" class="dial-stop" data-menu="${m.id}" aria-pressed="${selected}">
                    <span class="dial-dot" aria-hidden="true"></span>
                    <span class="dial-label">${escapeHtml(label)}</span>
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>
      `;
      return;
    }

    // In-place update so .cat-thumb, .dial-glider, and .dial-track-fill glide smoothly
    const catPillsEl = menupickEl.querySelector<HTMLElement>('#cat-pills');
    if (catPillsEl) {
      catPillsEl.style.setProperty('--seg-idx', catIdx);
      const beautyBtn = catPillsEl.querySelector<HTMLButtonElement>('[data-cat="beauty"]');
      const eyewearBtn = catPillsEl.querySelector<HTMLButtonElement>('[data-cat="eyewear"]');
      if (beautyBtn) {
        beautyBtn.setAttribute('aria-selected', String(state.category === 'beauty'));
        const lbl = beautyBtn.querySelector('.cat-pill-label');
        const cnt = beautyBtn.querySelector('.cat-pill-count');
        if (lbl) lbl.textContent = copy.tabBeauty;
        if (cnt) cnt.textContent = String(beautyCount);
      }
      if (eyewearBtn) {
        eyewearBtn.setAttribute('aria-selected', String(state.category === 'eyewear'));
        const lbl = eyewearBtn.querySelector('.cat-pill-label');
        const cnt = eyewearBtn.querySelector('.cat-pill-count');
        if (lbl) lbl.textContent = copy.tabEyewear;
        if (cnt) cnt.textContent = String(eyewearCount);
      }
    }

    const refLinkEl = menupickEl.querySelector<HTMLAnchorElement>('#jp-ref-link');
    const refTextEl = menupickEl.querySelector<HTMLElement>('#jp-ref-text');
    if (refLinkEl) refLinkEl.href = activeMenu.jpSourceUrl;
    if (refTextEl) refTextEl.innerHTML = jpRefLabel;

    const gliderEl = menupickEl.querySelector<HTMLElement>('#dial-glider');
    const trackFillEl = menupickEl.querySelector<HTMLElement>('#dial-track-fill');
    if (gliderEl) gliderEl.style.setProperty('--dial-idx', String(activeIdx));
    if (trackFillEl) trackFillEl.style.setProperty('--dial-progress', String(progress));

    const stopsWrap = menupickEl.querySelector<HTMLElement>('#dial-stops');
    if (stopsWrap) {
      const buttons = stopsWrap.querySelectorAll<HTMLButtonElement>('.dial-stop');
      if (buttons.length === menus.length) {
        menus.forEach((m, i) => {
          const btn = buttons[i];
          const selected = m.id === activeMenu.id;
          const label = state.lang === 'ja' ? m.shortJa : m.shortKo;
          btn.dataset.menu = m.id;
          btn.setAttribute('aria-pressed', String(selected));
          const lbl = btn.querySelector('.dial-label');
          if (lbl) lbl.textContent = label;
        });
      } else {
        stopsWrap.innerHTML = menus
          .map((m) => {
            const selected = m.id === activeMenu.id;
            const label = state.lang === 'ja' ? m.shortJa : m.shortKo;
            return `
              <button type="button" class="dial-stop" data-menu="${m.id}" aria-pressed="${selected}">
                <span class="dial-dot" aria-hidden="true"></span>
                <span class="dial-label">${escapeHtml(label)}</span>
              </button>
            `;
          })
          .join('');
      }
    }
  }

  /* =========================================================
     4. District Tile Grid + Smooth Payback Banner Strip
     ========================================================= */
  function renderAreaPick(): void {
    const summary = summarizePlan(
      dataset,
      state.plan,
      state.krwPer100Jpy,
      state.includeVat,
      state.flightTargetJpy
    );

    const allInMenu = buildRankedRows(
      dataset,
      state.menuId,
      'all',
      state.sort,
      state.krwPer100Jpy,
      state.includeVat,
      { searchQuery: state.searchQuery, japaneseOnly: state.japaneseOnly }
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
        ? 'その他 ▾'
        : '그 외 ▾';

    const allLabel = state.lang === 'ja' ? '全体' : '전체';

    const remainingJpy = Math.max(0, summary.flightTargetJpy - summary.totalSavingsJpy);
    const bannerText =
      summary.items.length === 0
        ? state.lang === 'ja'
          ? '航空券タダ化メーター · 気になるお店を追加して元取れ計算'
          : '비행기값 뽕뽑기 게이지 · 가고 싶은 곳 담고 본전 계산하기'
        : summary.paybackReached
          ? state.lang === 'ja'
            ? `航空券、実質タダ達成！ (${formatJpy(summary.totalSavingsJpy)} おトク · ${summary.items.length}件)`
            : `비행기값 본전 뽑았다! (${formatJpy(summary.totalSavingsJpy)} 아낌 · ${summary.items.length}곳)`
          : state.lang === 'ja'
            ? `実質タダまであと ${formatJpy(remainingJpy)} (${summary.items.length}件選択中)`
            : `비행기값 본전까지 ${formatJpy(remainingJpy)} 남음 (${summary.items.length}곳)`;

    const bannerRight =
      summary.items.length === 0
        ? state.lang === 'ja'
          ? 'お試し ›'
          : '예시 보기 ›'
        : `${summary.paybackPct}% ›`;

    const barScale = Math.min(1, summary.paybackPct / 100);

    const moreAreasHtml = EXTRA_AREA_IDS.map((id) => {
      const cnt = countByArea.get(id) ?? 0;
      const label = state.lang === 'ja' ? EXTRA_SHORT[id].ja : EXTRA_SHORT[id].ko;
      return `
        <button type="button" class="more-area-pill" data-area="${id}" aria-pressed="${state.area === id}">
          <span>${escapeHtml(label)}</span>
          <span class="more-area-count">${cnt}</span>
        </button>
      `;
    }).join('');

    if (!areapickEl.querySelector('#open-plan-btn')) {
      areapickEl.innerHTML = `
        <div class="areapick-row">
          <button type="button" class="area-all-btn" id="area-all-btn" data-area="all" aria-pressed="${state.area === 'all'}">
            <span class="area-all-check" aria-hidden="true">${icons.check}</span>
            <span id="area-all-label">${escapeHtml(allLabel)}</span>
          </button>
          <div class="area-tiles" id="area-tiles" role="group" aria-label="Seoul District">
            ${PRIMARY_AREAS.map((a) => {
              const active = state.area === a.id;
              const dimmed = state.area !== 'all' && !active;
              return `
                <button
                  type="button"
                  class="area-tile ${dimmed ? 'is-dimmed' : ''}"
                  data-area="${a.id}"
                  aria-pressed="${active}"
                >${escapeHtml(state.lang === 'ja' ? a.ja : a.ko)}</button>
              `;
            }).join('')}
            <button
              type="button"
              class="area-tile ${state.area !== 'all' && !isExtraActive ? 'is-dimmed' : ''}"
              id="toggle-more-areas"
              aria-expanded="${state.moreAreasOpen}"
              aria-pressed="${isExtraActive}"
            >${escapeHtml(extraBtnLabel)}</button>
          </div>
        </div>

        <div class="more-areas" id="more-areas" ${state.moreAreasOpen ? '' : 'hidden'}>
          ${moreAreasHtml}
        </div>

        <button type="button" class="payback-banner ${summary.paybackReached ? 'is-reached' : ''}" id="open-plan-btn">
          <span class="payback-banner-left">
            ${icons.plane}
            <span class="payback-banner-text" id="payback-banner-text">${escapeHtml(bannerText)}</span>
          </span>
          <span class="payback-banner-right num" id="payback-banner-right">${escapeHtml(bannerRight)}</span>
          <span class="payback-banner-bar" id="payback-banner-bar" style="transform:scaleX(${barScale})"></span>
        </button>
      `;
      return;
    }

    // In-place updates preserve smooth .payback-banner-bar scaleX transition and @starting-style on #more-areas
    const allBtn = areapickEl.querySelector<HTMLButtonElement>('#area-all-btn');
    const allLblEl = areapickEl.querySelector<HTMLElement>('#area-all-label');
    if (allBtn) allBtn.setAttribute('aria-pressed', String(state.area === 'all'));
    if (allLblEl) allLblEl.textContent = allLabel;

    PRIMARY_AREAS.forEach((a) => {
      const tile = areapickEl.querySelector<HTMLButtonElement>(`.area-tile[data-area="${a.id}"]`);
      if (!tile) return;
      const active = state.area === a.id;
      const dimmed = state.area !== 'all' && !active;
      tile.textContent = state.lang === 'ja' ? a.ja : a.ko;
      tile.setAttribute('aria-pressed', String(active));
      tile.classList.toggle('is-dimmed', dimmed);
    });

    const moreToggle = areapickEl.querySelector<HTMLButtonElement>('#toggle-more-areas');
    if (moreToggle) {
      moreToggle.textContent = extraBtnLabel;
      moreToggle.setAttribute('aria-expanded', String(state.moreAreasOpen));
      moreToggle.setAttribute('aria-pressed', String(isExtraActive));
      moreToggle.classList.toggle('is-dimmed', state.area !== 'all' && !isExtraActive);
    }

    const moreAreasEl = areapickEl.querySelector<HTMLElement>('#more-areas');
    if (moreAreasEl) {
      moreAreasEl.hidden = !state.moreAreasOpen;
      moreAreasEl.innerHTML = moreAreasHtml;
    }

    const planBtn = areapickEl.querySelector<HTMLButtonElement>('#open-plan-btn');
    const bannerTextEl = areapickEl.querySelector<HTMLElement>('#payback-banner-text');
    const bannerRightEl = areapickEl.querySelector<HTMLElement>('#payback-banner-right');
    const bannerBarEl = areapickEl.querySelector<HTMLElement>('#payback-banner-bar');
    if (planBtn) planBtn.classList.toggle('is-reached', summary.paybackReached);
    if (bannerTextEl) bannerTextEl.textContent = bannerText;
    if (bannerRightEl) bannerRightEl.textContent = bannerRight;
    if (bannerBarEl) bannerBarEl.style.transform = `scaleX(${barScale})`;
  }

  /* =========================================================
     5. Ranked List Card (Persistent Header + Sliding Sort Thumb)
     ========================================================= */
  function renderRank(fitMapBounds: boolean): void {
    const copy = getCopy(state.lang);
    const activeMenu = dataset.menus.find((m) => m.id === state.menuId)!;

    currentRows = buildRankedRows(
      dataset,
      state.menuId,
      state.area,
      state.sort,
      state.krwPer100Jpy,
      state.includeVat,
      {
        searchQuery: state.searchQuery,
        japaneseOnly: state.japaneseOnly
      }
    );

    if (
      state.selectedPlaceId &&
      !currentRows.some((r) => r.place.id === state.selectedPlaceId)
    ) {
      state.selectedPlaceId = null;
    }

    const searchBtnText = state.searchQuery.trim()
      ? `"${state.searchQuery.trim()}"`
      : state.lang === 'ja'
        ? '検索'
        : '검색';

    const sortSavingsLabel = state.lang === 'ja' ? 'おトク順' : '절약순';
    const sortDistanceLabel = state.lang === 'ja' ? '近い順' : '거리순';
    const vatShortLabel = state.lang === 'ja' ? '税込+10%' : '세금+10%';
    const jpShortLabel = state.lang === 'ja' ? '日本語OK' : '일본어 가능만';
    const saveSubLabel = state.lang === 'ja' ? 'おトク' : '아낌';
    const overSubLabel = state.lang === 'ja' ? '日本安' : '일본 저렴';
    const sortIdx = state.sort === 'distance' ? '1' : '0';

    if (!rankEl.querySelector('#rankhead')) {
      rankEl.innerHTML = `
        <div class="rankhead" id="rankhead">
          <div class="rankhead-left">
            <label class="chk-label">
              <input type="checkbox" id="jp-only-chk" ${state.japaneseOnly ? 'checked' : ''} />
              <span id="jp-only-label">${escapeHtml(jpShortLabel)}</span>
            </label>
            <label class="chk-label" id="vat-chk-wrap" ${activeMenu.vatAppliesInKorea ? '' : 'hidden'}>
              <input type="checkbox" id="vat-chk" ${state.includeVat ? 'checked' : ''} />
              <span id="vat-chk-label">${escapeHtml(vatShortLabel)}</span>
            </label>
            <button type="button" class="search-toggle-btn" id="search-toggle-btn" aria-expanded="${state.searchOpen}">
              ${icons.search}
              <span id="search-toggle-label">${escapeHtml(searchBtnText)}</span>
            </button>
          </div>

          <div class="rankhead-right">
            <div class="fxstep" role="group" aria-label="Exchange Rate">
              <button type="button" class="fxstep-btn" id="fx-minus-btn" aria-label="-10">−</button>
              <button type="button" class="fxstep-val num" id="fx-reset-btn" title="${escapeHtml(copy.rateReset)}">100¥=${state.krwPer100Jpy}</button>
              <button type="button" class="fxstep-btn" id="fx-plus-btn" aria-label="+10">+</button>
            </div>
            <div class="sorts" id="sorts-switch" role="group" aria-label="Sort" style="--seg-idx:${sortIdx}">
              <span class="sorts-thumb" aria-hidden="true"></span>
              <button type="button" class="sort-btn" data-sort="savings" aria-pressed="${state.sort !== 'distance'}">${escapeHtml(sortSavingsLabel)}</button>
              <button type="button" class="sort-btn" data-sort="distance" aria-pressed="${state.sort === 'distance'}">${escapeHtml(sortDistanceLabel)}</button>
            </div>
          </div>
        </div>

        <div class="search-strip" id="search-strip" ${state.searchOpen ? '' : 'hidden'}>
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
          <span class="search-count" id="search-count">${escapeHtml(copy.resultsCount(currentRows.length))}</span>
        </div>

        <div id="rows-container"></div>
      `;
    } else {
      // Update persistent controls in-place so .sorts-thumb glides and search IME never resets
      const jpChk = rankEl.querySelector<HTMLInputElement>('#jp-only-chk');
      const jpLbl = rankEl.querySelector<HTMLElement>('#jp-only-label');
      if (jpChk) jpChk.checked = state.japaneseOnly;
      if (jpLbl) jpLbl.textContent = jpShortLabel;

      const vatWrap = rankEl.querySelector<HTMLElement>('#vat-chk-wrap');
      const vatChk = rankEl.querySelector<HTMLInputElement>('#vat-chk');
      const vatLbl = rankEl.querySelector<HTMLElement>('#vat-chk-label');
      if (vatWrap) vatWrap.hidden = !activeMenu.vatAppliesInKorea;
      if (vatChk) vatChk.checked = state.includeVat;
      if (vatLbl) vatLbl.textContent = vatShortLabel;

      const searchToggle = rankEl.querySelector<HTMLButtonElement>('#search-toggle-btn');
      const searchToggleLbl = rankEl.querySelector<HTMLElement>('#search-toggle-label');
      if (searchToggle) searchToggle.setAttribute('aria-expanded', String(state.searchOpen));
      if (searchToggleLbl) searchToggleLbl.textContent = searchBtnText;

      const fxResetBtn = rankEl.querySelector<HTMLButtonElement>('#fx-reset-btn');
      if (fxResetBtn) {
        fxResetBtn.textContent = `100¥=${state.krwPer100Jpy}`;
        fxResetBtn.title = copy.rateReset;
      }

      const sortsSwitch = rankEl.querySelector<HTMLElement>('#sorts-switch');
      if (sortsSwitch) {
        sortsSwitch.style.setProperty('--seg-idx', sortIdx);
        const savBtn = sortsSwitch.querySelector<HTMLButtonElement>('[data-sort="savings"]');
        const dstBtn = sortsSwitch.querySelector<HTMLButtonElement>('[data-sort="distance"]');
        if (savBtn) {
          savBtn.textContent = sortSavingsLabel;
          savBtn.setAttribute('aria-pressed', String(state.sort !== 'distance'));
        }
        if (dstBtn) {
          dstBtn.textContent = sortDistanceLabel;
          dstBtn.setAttribute('aria-pressed', String(state.sort === 'distance'));
        }
      }

      const searchStrip = rankEl.querySelector<HTMLElement>('#search-strip');
      const searchInput = rankEl.querySelector<HTMLInputElement>('#place-search-input');
      const searchClear = rankEl.querySelector<HTMLButtonElement>('#search-clear-btn');
      const searchCount = rankEl.querySelector<HTMLElement>('#search-count');
      if (searchStrip) searchStrip.hidden = !state.searchOpen;
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
              <button type="button" class="hotline-btn" id="reset-filters-btn">${escapeHtml(copy.resetAreaBtn)}</button>
            </div>
          `
          : `
            <ol class="rows" id="rows-scroll">
              ${currentRows
                .map((row, idx) => {
                  const name = state.lang === 'ja' ? row.place.nameJa : row.place.nameKo;
                  const station = state.lang === 'ja' ? row.place.stationJa : row.place.stationKo;
                  const dist = formatDistance(row.distanceMeters, state.lang);
                  const inPlan = isInPlan(row.place.id, row.menu.id);
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

                  return `
                    <li class="row ${isActive ? 'is-active' : ''}" data-place-id="${row.place.id}">
                      <button type="button" class="row-main" data-action="focus" data-place-id="${row.place.id}">
                        <span class="who">
                          <span class="nm-line">
                            <span class="rk-pill">${idx + 1}</span>
                            <span class="nm">${escapeHtml(name)}</span>
                          </span>
                          <span class="meta">
                            ${inPlan ? `<i class="tg tg-plan">${escapeHtml(copy.addedToPlan)} ✓</i>` : ''}
                            ${row.place.japaneseSupport ? `<i class="tg tg-jp">${escapeHtml(copy.jpSupportTag)}</i>` : ''}
                            <i class="tg tg-of">${escapeHtml(officialTag)}</i>
                            <span>${escapeHtml(station)} · ${escapeHtml(dist)}</span>
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
                      >›</button>
                    </li>
                  `;
                })
                .join('')}
            </ol>
          `;
    }

    mapController.updateData(currentRows, dataset.areas, state.selectedPlaceId, fitMapBounds);
    renderMapLegend();
  }

  function renderMapLegend(): void {
    const copy = getCopy(state.lang);
    const placeLabel =
      state.lang === 'ja'
        ? `${currentRows.length}店舗`
        : `${currentRows.length}곳 표시`;
    mapLegendEl.innerHTML = `
      <span class="legend-item"><span class="legend-dot is-venue"></span>${escapeHtml(copy.venueLabel)}</span>
      <span class="legend-item"><span class="legend-dot is-active"></span>${escapeHtml(placeLabel)}</span>
    `;
  }

  function renderSiteFoot(): void {
    const copy = getCopy(state.lang);
    const links =
      state.lang === 'ja'
        ? { plan: '航空券メーター', guide: '2026 豆知識', share: '共有・QR', switchLang: '한국어版' }
        : { plan: '비행기값 게이지', guide: '2026 꿀팁', share: '공유·QR', switchLang: '日本語版' };

    const bullets =
      state.lang === 'ja'
        ? [
            'ソウル主要25ブランド164院の美容皮膚科とメガネ30店（計194店舗）の公式サイト公開価格のみを集めています。',
            '2026年から美容医療の税金還付は終了したため、韓国の皮膚科価格に税金10%を自動加算して日本の税込価格と比べています。',
            '月替わりイベントや麻酔クリーム・ポテンツァチップ代は変動するため、予約前に各店舗の公式ページでご確認ください。'
          ]
        : [
            '공식 홈페이지에 가격표를 공개하는 서울 주요 25개 피부과 브랜드(164곳)와 안경원(30곳), 총 194곳의 공개가만 모았습니다.',
            '2026년부터 외국인 피부과 세금 환급이 종료되어 한국 피부과 가격에 세금 10%를 자동 합산해 일본 세금포함가와 비교합니다.',
            '월별 이벤트나 마취크림·포텐자 개인 팁 비용은 바뀔 수 있으므로 예약 전 각 지점 공식 홈페이지에서 최신 가격을 확인하세요.'
          ];

    sitefootEl.innerHTML = `
      <nav class="sitefoot-nav" aria-label="Footer">
        <button type="button" class="sitefoot-link" data-foot="plan">${escapeHtml(links.plan)}</button>
        <button type="button" class="sitefoot-link" data-foot="guide">${escapeHtml(links.guide)}</button>
        <button type="button" class="sitefoot-link" data-foot="share">${escapeHtml(links.share)}</button>
        <button type="button" class="sitefoot-link" data-foot="lang">${escapeHtml(links.switchLang)}</button>
      </nav>
      <ul>
        ${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
      <p class="sitefoot-checked">${escapeHtml(copy.provenanceChecked(dataset.meta.checkedDate))}</p>
    `;
  }

  function renderAppTab(): void {
    const summary = summarizePlan(
      dataset,
      state.plan,
      state.krwPer100Jpy,
      state.includeVat,
      state.flightTargetJpy
    );
    const labels =
      state.lang === 'ja'
        ? { list: 'ランキング', map: '地図', plan: 'プラン', guide: '豆知識', share: '共有' }
        : { list: '순위', map: '지도', plan: '플랜', guide: '꿀팁', share: '공유' };

    apptabEl.innerHTML = `
      <button type="button" class="apptab-btn is-active" data-tab="list">
        ${icons.list}
        <span>${escapeHtml(labels.list)}</span>
      </button>
      <button type="button" class="apptab-btn" data-tab="map">
        ${icons.map}
        <span>${escapeHtml(labels.map)}</span>
      </button>
      <button type="button" class="apptab-btn is-fab" data-tab="plan">
        <span class="apptab-fab-circle ${summary.paybackReached ? 'is-reached' : ''}">
          ${icons.plane}
          ${summary.items.length > 0 ? `<span class="apptab-fab-badge">${summary.items.length}</span>` : ''}
        </span>
        <span>${escapeHtml(labels.plan)}</span>
      </button>
      <button type="button" class="apptab-btn" data-tab="guide">
        ${icons.info}
        <span>${escapeHtml(labels.guide)}</span>
      </button>
      <button type="button" class="apptab-btn" data-tab="share">
        ${icons.share}
        <span>${escapeHtml(labels.share)}</span>
      </button>
    `;
  }

  /* =========================================================
     6. Fluid Sheets (Apple Grabber + 1:1 Swipe-to-Dismiss)
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

    const row = computeRow(
      place,
      menu,
      state.krwPer100Jpy,
      state.includeVat,
      dataset.meta.vatRate,
      dataset.meta.venue.lat,
      dataset.meta.venue.lng
    );
    if (!row) {
      closeDetailDrawer();
      return;
    }

    const copy = getCopy(state.lang);
    const inPlan = isInPlan(place.id, menu.id);
    const name = state.lang === 'ja' ? place.nameJa : place.nameKo;
    const subName = state.lang === 'ja' ? place.nameKo : place.nameJa;
    const station = state.lang === 'ja' ? place.stationJa : place.stationKo;
    const caveat = state.lang === 'ja' ? place.caveatJa : place.caveatKo;
    const note = state.lang === 'ja' ? row.offer.noteJa : row.offer.noteKo;
    const leadTime = state.lang === 'ja' ? menu.leadTimeNoteJa : menu.leadTimeNoteKo;
    const flightPct = Math.round((Math.max(0, row.savingsJpy) / state.flightTargetJpy) * 100);
    const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${place.nameKo} ${place.addressKo.split(',')[0]}`)}`;
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.lat},${place.lng}`)}`;
    const jpKrwApprox =
      state.lang === 'ja'
        ? `約${formatKrw(jpyToKrw(row.jpBenchmarkJpy, state.krwPer100Jpy))}`
        : `약 ${formatKrw(jpyToKrw(row.jpBenchmarkJpy, state.krwPer100Jpy))}`;

    const wasOpen = isSheetOpen(detailDrawerEl);

    detailDrawerEl.innerHTML = `
      <div class="drawer-panel">
        <div class="drawer-drag-zone">
          <div class="drawer-grabber" aria-hidden="true"></div>
          <div class="drawer-header">
            <div>
              <h2 class="drawer-title" id="detail-drawer-title">${escapeHtml(name)}</h2>
              <p class="drawer-sub">${escapeHtml(subName)} · ${escapeHtml(state.lang === 'ja' ? menu.nameJa : menu.nameKo)}</p>
            </div>
            <button type="button" class="drawer-close" data-close="detail" aria-label="${escapeHtml(copy.drawerClose)}">${icons.close}</button>
          </div>
        </div>

        <div class="drawer-body">
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
              <span>${escapeHtml(copy.receiptJpBase)}</span>
              <span class="num">${escapeHtml(formatJpy(row.jpBenchmarkJpy))} (${escapeHtml(jpKrwApprox)})</span>
            </div>
            <div class="receipt-line is-savings">
              <span>${escapeHtml(copy.receiptSavings)}</span>
              <span class="num">${row.savingsJpy >= 0 ? formatJpy(row.savingsJpy) : `-${formatJpy(Math.abs(row.savingsJpy))}`} (${flightPct}%)</span>
            </div>
          </div>

          <button type="button" class="primary-btn ${inPlan ? 'is-added' : ''}" id="detail-toggle-plan" data-place-id="${place.id}" data-menu-id="${menu.id}">
            ${inPlan ? icons.check : icons.plus}
            <span>${escapeHtml(inPlan ? copy.addedToPlan : copy.addToPlan)}</span>
          </button>

          <div class="info-list">
            <div class="info-item">
              <span class="info-item-label">${escapeHtml(copy.stationLabel)}</span>
              <span>${escapeHtml(station)} (${escapeHtml(formatDistance(row.distanceMeters, state.lang))})</span>
            </div>
            <div class="info-item">
              <span class="info-item-label">${escapeHtml(copy.addressLabel)}</span>
              <span>${escapeHtml(place.addressKo)}</span>
            </div>
            <div class="info-item">
              <span class="info-item-label">${escapeHtml(copy.caveatLabel)}</span>
              <span>${escapeHtml(note)} · ${escapeHtml(caveat)}</span>
            </div>
            <div class="info-item">
              <span class="info-item-label">${escapeHtml(copy.leadTimeLabel)}</span>
              <span>${escapeHtml(leadTime)}</span>
            </div>
          </div>

          <div class="secondary-links">
            <a class="ext-link-btn" href="${escapeHtml(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">
              ${icons.external}<span>${escapeHtml(copy.verifyKrOfficial)}</span>
            </a>
            <a class="ext-link-btn" href="${escapeHtml(menu.jpSourceUrl)}" target="_blank" rel="noopener noreferrer">
              ${icons.external}<span>${escapeHtml(copy.verifyJpOfficial)}</span>
            </a>
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
    if (!wasOpen) {
      openSheet(detailDrawerEl);
    }
  }

  function buildPlanItemsSlotHtml(): string {
    const copy = getCopy(state.lang);
    const summary = summarizePlan(
      dataset,
      state.plan,
      state.krwPer100Jpy,
      state.includeVat,
      state.flightTargetJpy
    );

    if (summary.items.length === 0) {
      return `
        <p class="plan-empty-hint">${escapeHtml(copy.paybackEmptyHint)}</p>
        <button type="button" class="demo-btn" id="load-demo-plan-btn">
          ${icons.plus}<span>${escapeHtml(copy.loadDemoPlan)}</span>
        </button>
      `;
    }

    return `
      <div class="plan-item-list">
        ${summary.items
          .map((item) => {
            const pName = state.lang === 'ja' ? item.place.nameJa : item.place.nameKo;
            const mName = state.lang === 'ja' ? item.menu.shortJa : item.menu.shortKo;
            return `
              <div class="plan-item-row">
                <div class="plan-item-meta">
                  <strong>${escapeHtml(pName)} · ${escapeHtml(mName)}</strong>
                  <span class="num">${escapeHtml(formatJpy(item.krTotalJpy))} (${escapeHtml(copy.savingsBadge(formatJpy(item.savingsJpy)))})</span>
                </div>
                <button type="button" class="plan-remove-btn" data-remove-key="${escapeHtml(`${item.place.id}::${item.menu.id}`)}">
                  ${escapeHtml(copy.removeLabel)}
                </button>
              </div>
            `;
          })
          .join('')}
      </div>
      <div class="customs-pill ${summary.customsExceeded ? 'is-warn' : ''}">
        ${escapeHtml(summary.customsExceeded ? copy.customsWarn : copy.customsOk(summary.customsRatioPct))}
      </div>
      <div class="secondary-links">
        <button type="button" class="ext-link-btn" id="plan-share-btn">${icons.share}<span>${escapeHtml(copy.shareBtn)}</span></button>
        <button type="button" class="ext-link-btn" id="plan-clear-btn">${icons.reset}<span>${escapeHtml(copy.clearPlan)}</span></button>
      </div>
    `;
  }

  function renderPlanDrawer(): void {
    if (!state.planOpen) {
      if (!planDrawerEl.hidden) closePlanDrawer();
      return;
    }

    const copy = getCopy(state.lang);
    const summary = summarizePlan(
      dataset,
      state.plan,
      state.krwPer100Jpy,
      state.includeVat,
      state.flightTargetJpy
    );
    const remainingJpy = Math.max(0, summary.flightTargetJpy - summary.totalSavingsJpy);
    const subText = summary.paybackReached
      ? copy.paybackReached
      : copy.paybackRemaining(formatJpy(remainingJpy));
    const meterScale = Math.min(1, summary.paybackPct / 100);
    const itemsHtml = buildPlanItemsSlotHtml();

    // If already open & mounted, update in-place so sliders never lose drag focus and .meter-fill glides
    if (isSheetOpen(planDrawerEl) && planDrawerEl.querySelector('#plan-flight-slider')) {
      const titleEl = planDrawerEl.querySelector<HTMLElement>('#plan-drawer-title');
      const subEl = planDrawerEl.querySelector<HTMLElement>('#plan-drawer-sub');
      const heroEl = planDrawerEl.querySelector<HTMLElement>('#plan-hero');
      const savEl = planDrawerEl.querySelector<HTMLElement>('#plan-savings-val');
      const savLblEl = planDrawerEl.querySelector<HTMLElement>('#plan-savings-label');
      const pctEl = planDrawerEl.querySelector<HTMLElement>('#plan-hero-pct');
      const meterEl = planDrawerEl.querySelector<HTMLElement>('#plan-meter-fill');
      const krTotalEl = planDrawerEl.querySelector<HTMLElement>('#plan-kr-total');
      const jpTotalEl = planDrawerEl.querySelector<HTMLElement>('#plan-jp-total');
      const flightLblEl = planDrawerEl.querySelector<HTMLElement>('#plan-flight-label');
      const flightSlider = planDrawerEl.querySelector<HTMLInputElement>('#plan-flight-slider');
      const flightValEl = planDrawerEl.querySelector<HTMLElement>('#plan-flight-val');
      const fxSlider = planDrawerEl.querySelector<HTMLInputElement>('#plan-fx-slider');
      const fxValEl = planDrawerEl.querySelector<HTMLElement>('#plan-fx-val');
      const itemsSlot = planDrawerEl.querySelector<HTMLElement>('#plan-items-slot');

      if (titleEl) titleEl.textContent = copy.paybackHeading;
      if (subEl) subEl.textContent = subText;
      if (heroEl) heroEl.classList.toggle('is-reached', summary.paybackReached);
      if (savLblEl) savLblEl.textContent = `${copy.totalSavingsLabel}: `;
      if (savEl) savEl.textContent = formatJpy(summary.totalSavingsJpy);
      if (pctEl) pctEl.textContent = `${summary.paybackPct}%`;
      if (meterEl) meterEl.style.transform = `scaleX(${meterScale})`;
      if (krTotalEl) {
        krTotalEl.innerHTML = `${escapeHtml(copy.krTotalLabel)}: <strong class="num">${escapeHtml(formatJpy(summary.totalKrJpy))}</strong>`;
      }
      if (jpTotalEl) {
        jpTotalEl.innerHTML = `${escapeHtml(copy.jpBenchmarkLabel)}: <strong class="num">${escapeHtml(formatJpy(summary.totalJpJpy))}</strong>`;
      }
      planDrawerEl.querySelectorAll<HTMLButtonElement>('[data-flight]').forEach((btn) => {
        const jpy = Number(btn.dataset.flight);
        btn.setAttribute('aria-pressed', String(state.flightTargetJpy === jpy));
        const preset = dataset.meta.flightPresets.find((p) => p.jpy === jpy);
        if (preset) btn.textContent = state.lang === 'ja' ? preset.labelJa : preset.labelKo;
      });
      if (flightLblEl) flightLblEl.textContent = copy.flightSliderLabel;
      if (flightSlider && document.activeElement !== flightSlider) {
        flightSlider.value = String(state.flightTargetJpy);
      }
      if (flightValEl) flightValEl.textContent = formatJpy(state.flightTargetJpy);
      if (fxSlider && document.activeElement !== fxSlider) {
        fxSlider.value = String(state.krwPer100Jpy);
      }
      if (fxValEl) fxValEl.textContent = `${state.krwPer100Jpy}${copy.rateUnit}`;
      if (itemsSlot) itemsSlot.innerHTML = itemsHtml;
      return;
    }

    planDrawerEl.innerHTML = `
      <div class="drawer-panel">
        <div class="drawer-drag-zone">
          <div class="drawer-grabber" aria-hidden="true"></div>
          <div class="drawer-header">
            <div>
              <h2 class="drawer-title" id="plan-drawer-title">${escapeHtml(copy.paybackHeading)}</h2>
              <p class="drawer-sub" id="plan-drawer-sub">${escapeHtml(subText)}</p>
            </div>
            <button type="button" class="drawer-close" data-close="plan" aria-label="${escapeHtml(copy.drawerClose)}">${icons.close}</button>
          </div>
        </div>

        <div class="drawer-body">
          <div class="plan-hero ${summary.paybackReached ? 'is-reached' : ''}" id="plan-hero">
            <div class="plan-hero-head">
              <strong><span id="plan-savings-label">${escapeHtml(copy.totalSavingsLabel)}: </span><span class="num" id="plan-savings-val">${escapeHtml(formatJpy(summary.totalSavingsJpy))}</span></strong>
              <span class="plan-hero-pct num" id="plan-hero-pct">${summary.paybackPct}%</span>
            </div>
            <div class="meter-track">
              <div class="meter-fill" id="plan-meter-fill" style="transform:scaleX(${meterScale})"></div>
            </div>
            <div class="receipt-line">
              <span id="plan-kr-total">${escapeHtml(copy.krTotalLabel)}: <strong class="num">${escapeHtml(formatJpy(summary.totalKrJpy))}</strong></span>
              <span id="plan-jp-total">${escapeHtml(copy.jpBenchmarkLabel)}: <strong class="num">${escapeHtml(formatJpy(summary.totalJpJpy))}</strong></span>
            </div>
          </div>

          <div class="preset-grid" role="group" aria-label="${escapeHtml(copy.flightTargetLabel)}">
            ${dataset.meta.flightPresets
              .map(
                (p) => `
                  <button type="button" class="preset-btn" data-flight="${p.jpy}" aria-pressed="${state.flightTargetJpy === p.jpy}">
                    ${escapeHtml(state.lang === 'ja' ? p.labelJa : p.labelKo)}
                  </button>
                `
              )
              .join('')}
          </div>

          <div class="slider-row">
            <span id="plan-flight-label">${escapeHtml(copy.flightSliderLabel)}</span>
            <input type="range" id="plan-flight-slider" min="15000" max="70000" step="1000" value="${state.flightTargetJpy}" />
            <strong class="num" id="plan-flight-val">${escapeHtml(formatJpy(state.flightTargetJpy))}</strong>
          </div>

          <div class="slider-row">
            <span>100¥ =</span>
            <input type="range" id="plan-fx-slider" min="750" max="1050" step="1" value="${state.krwPer100Jpy}" />
            <strong class="num" id="plan-fx-val">${state.krwPer100Jpy}${escapeHtml(copy.rateUnit)}</strong>
          </div>

          <div id="plan-items-slot" style="display:flex;flex-direction:column;gap:12px;">
            ${itemsHtml}
          </div>
        </div>
      </div>
    `;

    bindSheetSwipeDismiss(planDrawerEl, () => closePlanDrawer());
    openSheet(planDrawerEl);
  }

  function renderGuideDrawer(): void {
    if (!state.guideOpen) {
      if (!guideDrawerEl.hidden) closeGuideDrawer();
      return;
    }

    const copy = getCopy(state.lang);
    const wasOpen = isSheetOpen(guideDrawerEl);

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
          <section class="guide-section"><h3>${escapeHtml(copy.guideVatTitle)}</h3><p>${escapeHtml(copy.guideVatBody)}</p></section>
          <section class="guide-section"><h3>${escapeHtml(copy.guideEyewearTitle)}</h3><p>${escapeHtml(copy.guideEyewearBody)}</p></section>
          <section class="guide-section"><h3>${escapeHtml(copy.guideCustomsTitle)}</h3><p>${escapeHtml(copy.guideCustomsBody)}</p></section>
          <section class="guide-section"><h3>${escapeHtml(copy.guideSourceTitle)}</h3><p>${escapeHtml(copy.guideSourceBody)}</p></section>
        </div>
      </div>
    `;

    bindSheetSwipeDismiss(guideDrawerEl, () => closeGuideDrawer());
    if (!wasOpen) {
      openSheet(guideDrawerEl);
    }
  }

  async function renderShareModal(qrLang: Lang = state.shareLang): Promise<void> {
    if (!state.shareOpen) {
      if (!shareModalEl.hidden) closeShareModal();
      return;
    }

    state.shareLang = qrLang;
    const copy = getCopy(state.lang);
    const shareUrl = buildShareUrl(state, qrLang);
    let qrSvg = '';
    try {
      qrSvg = await QRCode.toString(shareUrl, { type: 'svg', margin: 1, width: 184 });
    } catch {
      qrSvg = '';
    }
    if (!state.shareOpen) return;

    const qrSegIdx = qrLang === 'ja' ? '0' : '1';

    // Update QR & sliding lang pill in-place if share sheet is already open
    if (isSheetOpen(shareModalEl) && shareModalEl.querySelector('#qr-lang-switch')) {
      const switchEl = shareModalEl.querySelector<HTMLElement>('#qr-lang-switch');
      const frameEl = shareModalEl.querySelector<HTMLElement>('#qr-frame');
      const urlEl = shareModalEl.querySelector<HTMLElement>('#qr-url');
      const copyBtn = shareModalEl.querySelector<HTMLButtonElement>('#copy-share-url');

      if (switchEl) {
        switchEl.style.setProperty('--seg-idx', qrSegIdx);
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
            <div class="lang-switch" id="qr-lang-switch" role="group" style="--seg-idx:${qrSegIdx}">
              <span class="lang-thumb" aria-hidden="true"></span>
              <button type="button" class="lang-btn" data-qr-lang="ja" aria-pressed="${qrLang === 'ja'}">${escapeHtml(copy.shareQrLangJa)}</button>
              <button type="button" class="lang-btn" data-qr-lang="ko" aria-pressed="${qrLang === 'ko'}">${escapeHtml(copy.shareQrLangKo)}</button>
            </div>
            <div class="qr-frame" id="qr-frame">${qrSvg}</div>
            ${state.plan.length > 0 ? `<span class="hotline-tag">${escapeHtml(copy.sharePlanIncluded(state.plan.length))}</span>` : ''}
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
    renderHotline();
    renderMenuPick();
    renderAreaPick();
    renderRank(fitMapBounds);
    renderSiteFoot();
    renderAppTab();
    if (state.detailPlaceId) renderDetailDrawer();
    if (state.planOpen) renderPlanDrawer();
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
    syncUrl(state);
    mapController.setLanguage(nextLang);
    renderAll(false);
  }

  function loadDemoCombo(): void {
    const copy = getCopy(state.lang);
    triggerHaptic([12, 40, 18]);
    state.plan = [
      { key: 'top50-sinchon::lens-174-bl', placeId: 'top50-sinchon', menuId: 'lens-174-bl' },
      { key: 'vands-hongdae::rejuran-2cc', placeId: 'vands-hongdae', menuId: 'rejuran-2cc' }
    ];
    savePlan(state.plan);
    syncUrl(state);
    renderAreaPick();
    renderRank(false);
    renderAppTab();
    if (state.planOpen) renderPlanDrawer();
    showToast(copy.toastDemoLoaded, true);
  }

  /* =========================================================
     Event Delegation
     ========================================================= */
  siteheadEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
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

  hotlineEl.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('#open-guide-btn')) {
      triggerHaptic(6);
      state.guideOpen = true;
      renderGuideDrawer();
    }
  });

  menupickEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const catBtn = target.closest<HTMLButtonElement>('[data-cat]');
    if (catBtn?.dataset.cat) {
      const nextCat = catBtn.dataset.cat as CategoryId;
      if (state.category !== nextCat) {
        triggerHaptic(6);
        state.category = nextCat;
        const firstMenu = dataset.menus.find((m) => m.category === nextCat)!;
        state.menuId = firstMenu.id;
        state.selectedPlaceId = null;
        syncUrl(state);
        renderHotline();
        renderMenuPick();
        renderAreaPick();
        renderRank(true);
      }
      return;
    }

    const menuBtn = target.closest<HTMLButtonElement>('[data-menu]');
    if (menuBtn?.dataset.menu && menuBtn.dataset.menu !== state.menuId) {
      triggerHaptic(6);
      state.menuId = menuBtn.dataset.menu;
      state.selectedPlaceId = null;
      syncUrl(state);
      renderMenuPick();
      renderAreaPick();
      renderRank(false);
    }
  });

  areapickEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#toggle-more-areas')) {
      triggerHaptic(6);
      state.moreAreasOpen = !state.moreAreasOpen;
      renderAreaPick();
      return;
    }
    if (target.closest('#open-plan-btn')) {
      triggerHaptic(6);
      state.planOpen = true;
      renderPlanDrawer();
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
      renderAreaPick();
      renderRank(true);
    }
  });

  rankEl.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'jp-only-chk') {
      triggerHaptic(6);
      state.japaneseOnly = target.checked;
      syncUrl(state);
      renderAreaPick();
      renderRank(true);
    } else if (target.id === 'vat-chk') {
      triggerHaptic(6);
      state.includeVat = target.checked;
      syncUrl(state);
      renderAreaPick();
      renderRank(false);
      if (state.detailPlaceId) renderDetailDrawer();
    }
  });

  rankEl.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'place-search-input') {
      state.searchQuery = target.value;
      syncUrl(state);
      renderAreaPick();
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
        rankEl.querySelector<HTMLInputElement>('#place-search-input')?.focus();
      }
      return;
    }
    if (target.closest('#search-clear-btn')) {
      triggerHaptic(6);
      state.searchQuery = '';
      syncUrl(state);
      renderAreaPick();
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
      state.searchQuery = '';
      state.japaneseOnly = false;
      state.moreAreasOpen = false;
      syncUrl(state);
      renderAreaPick();
      renderRank(true);
      return;
    }
    if (target.closest('#fx-minus-btn')) {
      triggerHaptic(6);
      updateFxRate(state.krwPer100Jpy - 10);
      return;
    }
    if (target.closest('#fx-plus-btn')) {
      triggerHaptic(6);
      updateFxRate(state.krwPer100Jpy + 10);
      return;
    }
    if (target.closest('#fx-reset-btn')) {
      triggerHaptic(6);
      updateFxRate(dataset.meta.defaultKrwPer100Jpy);
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
      return;
    }
    const actionBtn = target.closest<HTMLButtonElement>('[data-action]');
    if (actionBtn?.dataset.placeId) {
      const pid = actionBtn.dataset.placeId;
      const action = actionBtn.dataset.action;
      if (action === 'detail') {
        triggerHaptic(6);
        state.selectedPlaceId = pid;
        state.detailPlaceId = pid;
        updateActiveRowDom(pid, false);
        renderDetailDrawer();
        return;
      }
      if (action === 'focus') {
        const alreadyActive = state.selectedPlaceId === pid;
        triggerHaptic(6);
        state.selectedPlaceId = pid;
        updateActiveRowDom(pid, false);
        const row = currentRows.find((r) => r.place.id === pid);
        if (row) {
          mapController.focusPlace(row);
        }
        if (alreadyActive) {
          state.detailPlaceId = pid;
          renderDetailDrawer();
        }
      }
    }
  });

  sitefootEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-foot]');
    if (!btn?.dataset.foot) return;
    const act = btn.dataset.foot;
    if (act === 'plan') {
      triggerHaptic(6);
      state.planOpen = true;
      renderPlanDrawer();
    } else if (act === 'guide') {
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
    const tab = btn.dataset.tab;
    triggerHaptic(6);
    apptabEl.querySelectorAll('.apptab-btn').forEach((el) => {
      el.classList.toggle('is-active', el === btn && tab !== 'plan');
    });
    if (tab === 'list') {
      rankEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'map') {
      mapwrapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => mapController.resize(), 180);
    } else if (tab === 'plan') {
      state.planOpen = true;
      renderPlanDrawer();
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
    if (target === detailDrawerEl || target.closest('[data-close="detail"]')) {
      closeDetailDrawer();
      return;
    }
    const planBtn = target.closest<HTMLButtonElement>('#detail-toggle-plan');
    if (planBtn?.dataset.placeId && planBtn.dataset.menuId) {
      togglePlanItem(planBtn.dataset.placeId, planBtn.dataset.menuId);
    }
  });

  planDrawerEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === planDrawerEl || target.closest('[data-close="plan"]')) {
      closePlanDrawer();
      return;
    }
    const presetBtn = target.closest<HTMLButtonElement>('[data-flight]');
    if (presetBtn?.dataset.flight) {
      triggerHaptic(6);
      state.flightTargetJpy = Number(presetBtn.dataset.flight);
      syncUrl(state);
      renderAreaPick();
      renderPlanDrawer();
      renderAppTab();
      return;
    }
    if (target.closest('#load-demo-plan-btn')) {
      loadDemoCombo();
      return;
    }
    const removeBtn = target.closest<HTMLButtonElement>('[data-remove-key]');
    if (removeBtn?.dataset.removeKey) {
      triggerHaptic(8);
      state.plan = state.plan.filter((p) => p.key !== removeBtn.dataset.removeKey);
      savePlan(state.plan);
      syncUrl(state);
      renderAreaPick();
      renderRank(false);
      renderAppTab();
      renderPlanDrawer();
      return;
    }
    if (target.closest('#plan-clear-btn')) {
      triggerHaptic(8);
      state.plan = [];
      savePlan([]);
      syncUrl(state);
      renderAreaPick();
      renderRank(false);
      renderAppTab();
      renderPlanDrawer();
      return;
    }
    if (target.closest('#plan-share-btn')) {
      triggerHaptic(6);
      closePlanDrawer();
      state.shareOpen = true;
      state.shareLang = state.lang;
      void renderShareModal(state.lang);
    }
  });

  planDrawerEl.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'plan-flight-slider') {
      state.flightTargetJpy = Number(target.value);
      syncUrl(state);
      renderAreaPick();
      renderPlanDrawer();
      renderAppTab();
    } else if (target.id === 'plan-fx-slider') {
      updateFxRate(Number(target.value));
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
      navigator.clipboard
        ?.writeText(copyBtn.dataset.url)
        .then(() => showToast(copy.toastCopied, true))
        .catch(() => showToast(copy.toastCopied, true));
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.detailPlaceId) {
        closeDetailDrawer();
      } else if (state.planOpen) {
        closePlanDrawer();
      } else if (state.guideOpen) {
        closeGuideDrawer();
      } else if (state.shareOpen) {
        closeShareModal();
      }
    }
  });

  mapController.init(dataset.meta.venue, state.lang);
  renderAll(true);
}

bootstrap();
