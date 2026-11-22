import './styles/app.css';
import QRCode from 'qrcode';
import rawDataset from './data/prices.json';
import rawNaverFx from './data/naver-fx.json';
import type {
  AppState,
  AreaId,
  ComputedRow,
  Lang,
  NaverFxSnapshot,
  PriceDataset,
  SortId
} from './types.ts';
import {
  buildRankedRows,
  computeRow,
  formatDistance,
  formatJpy,
  formatKrw,
  formatRate,
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

const dataset = rawDataset as unknown as PriceDataset;
let naverFx: NaverFxSnapshot = rawNaverFx as unknown as NaverFxSnapshot;

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

function loadInitialState(): AppState {
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

  const menuParam = params.get('menu');
  const menuId = dataset.menus.find((m) => m.id === menuParam)?.id ?? dataset.menus[0].id;

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

  let krwPer100Jpy = naverFx.krwPer100Jpy || dataset.meta.defaultKrwPer100Jpy;
  let customRateOverridden = false;
  const rateParam = Number(params.get('rate'));
  if (params.has('rate') && Number.isFinite(rateParam) && rateParam >= 650 && rateParam <= 1300) {
    krwPer100Jpy = Math.round(rateParam * 100) / 100;
    customRateOverridden = Math.abs(krwPer100Jpy - naverFx.krwPer100Jpy) > 0.005;
  }

  const searchQuery = params.get('q') ?? '';

  return {
    lang,
    menuId,
    area,
    sort,
    searchQuery,
    japaneseOnly: params.get('jp') === '1',
    includeVat,
    krwPer100Jpy,
    customRateOverridden,
    selectedPlaceId: null,
    hoveredPlaceId: null,
    detailPlaceId: null,
    guideOpen: false,
    shareOpen: false,
    shareLang: lang,
    moreAreasOpen: EXTRA_AREA_IDS.includes(area),
    searchOpen: searchQuery.trim().length > 0,
    activeTab: 'list'
  };
}

function buildShareUrl(state: AppState, overrideLang?: Lang): string {
  const url = new URL(window.location.href);
  const p = new URLSearchParams();
  p.set('lang', overrideLang ?? state.lang);
  p.set('menu', state.menuId);
  if (state.area !== 'all') p.set('area', state.area);
  if (state.sort !== 'savings') p.set('sort', state.sort);
  if (!state.includeVat) p.set('vat', '0');
  if (state.customRateOverridden) {
    p.set('rate', formatRate(state.krwPer100Jpy));
  }
  if (state.japaneseOnly) p.set('jp', '1');
  if (state.searchQuery.trim()) p.set('q', state.searchQuery.trim());
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

function bootstrap(): void {
  const root = document.getElementById('app');
  if (!root) return;

  const state = loadInitialState();

  root.innerHTML = `
    <header class="sitehead" id="sitehead"></header>
    <main class="screen" id="screen">
      <section class="ticker-grid" id="ticker" aria-label="Exchange Rate and Benchmark"></section>
      <section class="board-controls" id="controls" aria-label="Treatment and District"></section>
      <section class="rank" id="rank" aria-label="Clinic Price Ledger"></section>
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
    <div class="drawer-backdrop" id="guide-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="guide-drawer-title"></div>
    <div class="drawer-backdrop" id="share-modal" hidden role="dialog" aria-modal="true" aria-labelledby="share-modal-title"></div>
  `;

  const siteheadEl = document.getElementById('sitehead')!;
  const tickerEl = document.getElementById('ticker')!;
  const controlsEl = document.getElementById('controls')!;
  const rankEl = document.getElementById('rank')!;
  const mapwrapEl = document.getElementById('mapwrap')!;
  const mapCanvasEl = document.getElementById('map-canvas')!;
  const mapStatusEl = document.getElementById('map-status')!;
  const mapLegendEl = document.getElementById('map-legend')!;
  const sitefootEl = document.getElementById('sitefoot')!;
  const apptabEl = document.getElementById('apptab')!;
  const toastEl = document.getElementById('toast')!;
  const detailDrawerEl = document.getElementById('detail-drawer')!;
  const guideDrawerEl = document.getElementById('guide-drawer')!;
  const shareModalEl = document.getElementById('share-modal')!;

  const toast = new FluidToast(toastEl);
  let currentRows: ComputedRow[] = [];
  let copyResetTimer = 0;

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

  function updateFxRate(nextRate: number, resetToNaver = false): void {
    const clamped = Math.max(650, Math.min(1300, Math.round(nextRate * 100) / 100));
    state.krwPer100Jpy = resetToNaver ? naverFx.krwPer100Jpy : clamped;
    state.customRateOverridden =
      !resetToNaver && Math.abs(state.krwPer100Jpy - naverFx.krwPer100Jpy) > 0.005;
    syncUrl(state);
    renderTicker();
    renderRank(false);
    if (state.detailPlaceId) renderDetailDrawer();
    if (resetToNaver) {
      const copy = getCopy(state.lang);
      showToast(copy.naverFxToastReset(formatRate(naverFx.krwPer100Jpy), naverFx.dateLabel), true);
    }
  }

  async function refreshLiveNaverFx(): Promise<void> {
    try {
      const fxUrl = new URL('naver-fx.json', window.location.href);
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
      if (!state.customRateOverridden && changed) {
        state.krwPer100Jpy = naverFx.krwPer100Jpy;
        renderTicker();
        renderRank(false);
        renderSiteFoot();
        if (state.detailPlaceId) renderDetailDrawer();
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
    document.title =
      state.lang === 'ja'
        ? 'ドパガキ美肌相場 | ソウル美容皮膚科164院 × 日本公式価格 3秒比較'
        : '도파가키 피부시세 | 서울 피부과 164곳 × 일본 공식가 3초 비교';

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
          <div class="shleft">
            <img class="brand-emblem" src="./dopagaki-mark.png" width="48" height="48" alt="" fetchpriority="high" />
            <div class="brand-stack">
              <h1 class="logo-word" id="brand-word">${brandHtml}</h1>
              <span class="brand-meta" id="brand-meta">${escapeHtml(metaText)}</span>
            </div>
          </div>
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
     2. 3-Cell Bauhaus Quote Ticker (Naver FX | JP Benchmark | 2026 VAT)
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
    const fxSub = state.customRateOverridden
      ? state.lang === 'ja'
        ? `NAVER基準 ${formatRate(naverFx.krwPer100Jpy)}ウォン`
        : `네이버 기준 ${formatRate(naverFx.krwPer100Jpy)}원`
      : `${naverFx.dateLabel} ${bank}`;

    tickerEl.innerHTML = `
      <a
        class="ticker-cell ticker-cell--fx ${state.customRateOverridden ? 'is-custom' : ''}"
        href="${escapeHtml(naverFx.sourceUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="ticker-kicker">${escapeHtml(state.customRateOverridden ? copy.naverFxCustomLabel : copy.naverFxLabel)} ${icons.external}</span>
        <strong class="ticker-value num">100¥ = ₩${escapeHtml(rateStr)}</strong>
        <span class="ticker-sub num">${escapeHtml(fxSub)}</span>
      </a>

      <a
        class="ticker-cell ticker-cell--jp"
        href="${escapeHtml(activeMenu.jpSourceUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="ticker-kicker">${escapeHtml(copy.jpBenchmarkLabel)} ${icons.external}</span>
        <strong class="ticker-value num">${escapeHtml(formatJpy(activeMenu.jpBenchmarkJpy))}</strong>
        <span class="ticker-sub">${escapeHtml(jpSource)}</span>
      </a>

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
      ? state.searchQuery.trim()
      : state.lang === 'ja'
        ? '検索'
        : '검색';

    const sortSavingsLabel = state.lang === 'ja' ? 'おトク順' : '절약순';
    const sortDistanceLabel = state.lang === 'ja' ? '近い順' : '거리순';
    const vatShortLabel = state.lang === 'ja' ? '税込+10%' : '세금+10%';
    const jpShortLabel = state.lang === 'ja' ? '日本語OK' : '일본어 가능만';
    const saveSubLabel = state.lang === 'ja' ? 'おトク' : '아낌';
    const overSubLabel = state.lang === 'ja' ? '日本安' : '일본 저렴';
    const rateLabelText = `100¥=${formatRate(state.krwPer100Jpy)}`;

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
            <div class="fxstep ${state.customRateOverridden ? 'is-custom' : ''}" id="fxstep" role="group" aria-label="Exchange Rate">
              <button type="button" class="fxstep-btn" id="fx-minus-btn" aria-label="-10">−</button>
              <button type="button" class="fxstep-val num" id="fx-reset-btn" title="${escapeHtml(copy.rateReset)}">${escapeHtml(rateLabelText)}</button>
              <button type="button" class="fxstep-btn" id="fx-plus-btn" aria-label="+10">+</button>
            </div>
            <div class="sorts" id="sorts-switch" role="group" aria-label="Sort">
              <button type="button" class="sort-btn" data-sort="savings" aria-pressed="${state.sort !== 'distance'}">${escapeHtml(sortSavingsLabel)}</button>
              <button type="button" class="sort-btn" data-sort="distance" aria-pressed="${state.sort === 'distance'}">${escapeHtml(sortDistanceLabel)}</button>
            </div>
          </div>
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

      const fxStepEl = rankEl.querySelector<HTMLElement>('#fxstep');
      const fxResetBtn = rankEl.querySelector<HTMLButtonElement>('#fx-reset-btn');
      if (fxStepEl) fxStepEl.classList.toggle('is-custom', state.customRateOverridden);
      if (fxResetBtn) {
        fxResetBtn.textContent = rateLabelText;
        fxResetBtn.title = copy.rateReset;
      }

      const sortsSwitch = rankEl.querySelector<HTMLElement>('#sorts-switch');
      if (sortsSwitch) {
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
                  const dist = formatDistance(row.distanceMeters, state.lang);
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
                        <span class="rk-cell num">${idx + 1}</span>
                        <span class="who">
                          <span class="nm">${escapeHtml(name)}</span>
                          <span class="meta">
                            ${row.place.japaneseSupport ? `<i class="tg tg-jp">${escapeHtml(copy.jpSupportTag)}</i>` : ''}
                            <i class="tg tg-of">${escapeHtml(officialTag)}</i>
                            <span class="meta-loc">${escapeHtml(station)}</span>
                            <span class="meta-loc">${escapeHtml(dist)}</span>
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
    renderMapLegend();
  }

  function renderMapLegend(): void {
    const copy = getCopy(state.lang);
    const placeLabel =
      state.lang === 'ja' ? `${currentRows.length}院` : `${currentRows.length}곳 표시`;
    mapLegendEl.innerHTML = `
      <span class="legend-item"><span class="legend-swatch is-venue" aria-hidden="true"></span>${escapeHtml(copy.venueLabel)}</span>
      <span class="legend-item"><span class="legend-swatch is-active" aria-hidden="true"></span>${escapeHtml(placeLabel)}</span>
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
            `円換算はNAVER金融（${bank} ${naverFx.dateLabel} 売買基準レート 100円=₩${fxStr}）を毎日自動反映しています。`,
            '2026年から美容医療の税金還付は終了したため、韓国の皮膚科価格に税金10%を自動加算して日本の税込価格と比べています。'
          ]
        : [
            '공식 홈페이지에 가격표를 공개하는 서울 주요 25개 피부과 브랜드 164곳의 공개가만 모았습니다.',
            `엔화 환산은 매일 자동 업데이트되는 네이버 금융(${bank} ${naverFx.dateLabel} 매매기준율 100엔=₩${fxStr}) 환율을 그대로 적용합니다.`,
            '2026년부터 외국인 피부과 세금 환급이 종료되어 한국 피부과 가격에 세금 10%를 자동 합산해 일본 세금포함가와 비교합니다.'
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
      bank,
      state.customRateOverridden
    );
    const savingsSummary =
      row.savingsJpy >= 0
        ? `${formatJpy(row.savingsJpy)} (${copy.jpOffPct(row.savingsPct)})`
        : `-${formatJpy(Math.abs(row.savingsJpy))}`;

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
              <span>${escapeHtml(station)} (${escapeHtml(formatDistance(row.distanceMeters, state.lang))})</span>
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
    if (!wasOpen) openSheet(detailDrawerEl);
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
    const shareUrl = buildShareUrl(state, qrLang);
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
    syncUrl(state);
    mapController.setLanguage(nextLang);
    renderAll(false);
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

  tickerEl.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('#open-guide-btn')) {
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
      state.searchQuery = '';
      state.japaneseOnly = false;
      state.moreAreasOpen = false;
      syncUrl(state);
      renderControls();
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
      updateFxRate(naverFx.krwPer100Jpy, true);
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
        if (row) mapController.focusPlace(row);
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
      rankEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'map') {
      mapwrapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => mapController.resize(), 180);
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

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.detailPlaceId) {
        closeDetailDrawer();
      } else if (state.guideOpen) {
        closeGuideDrawer();
      } else if (state.shareOpen) {
        closeShareModal();
      }
    }
  });

  mapController.init(dataset.meta.venue, state.lang);
  renderAll(true);
  void refreshLiveNaverFx();
}

bootstrap();
