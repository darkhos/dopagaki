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
import { SeoulMapController } from './components/map.ts';

const dataset = rawDataset as unknown as PriceDataset;

const STORAGE_RATE_KEY = 'seoul_payback_krw_per_100';
const STORAGE_PLAN_KEY = 'seoul_payback_plan_v1';
const STORAGE_LANG_KEY = 'seoul_payback_lang';
const FX_PRESETS = [800, 849, 900, 950];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    langParam === 'ko' || langParam === 'ja'
      ? langParam
      : savedLang === 'ko'
        ? 'ko'
        : 'ja';

  const catParam = params.get('cat');
  const category: CategoryId = catParam === 'eyewear' ? 'eyewear' : 'beauty';

  const catMenus = dataset.menus.filter((m) => m.category === category);
  const menuParam = params.get('menu');
  const menuId =
    catMenus.find((m) => m.id === menuParam)?.id ?? catMenus[0].id;

  const areaParam = params.get('area');
  const validAreas: AreaId[] = ['all', 'sinchon', 'hongdae', 'myeongdong', 'gangnam', 'seongsu'];
  const area: AreaId = validAreas.includes(areaParam as AreaId)
    ? (areaParam as AreaId)
    : 'all';

  const sortParam = params.get('sort');
  const validSorts: SortId[] = ['savings', 'price', 'distance'];
  const sort: SortId = validSorts.includes(sortParam as SortId)
    ? (sortParam as SortId)
    : 'savings';

  const vatParam = params.get('vat');
  const includeVat = vatParam === '0' ? false : true;

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

  return {
    lang,
    category,
    menuId,
    area,
    sort,
    searchQuery: params.get('q') ?? '',
    japaneseOnly: params.get('jp') === '1',
    krwPer100Jpy,
    fxPanelOpen: false,
    includeVat,
    flightTargetJpy,
    selectedPlaceId: null,
    hoveredPlaceId: null,
    detailPlaceId: null,
    guideOpen: false,
    shareOpen: false,
    shareLang: lang,
    planOpen: urlPlan.length > 0,
    mobileView: 'list',
    plan
  };
}

function buildShareUrl(state: AppState, overrideLang?: Lang): string {
  const params = new URLSearchParams();
  params.set('cat', state.category);
  params.set('menu', state.menuId);
  const targetLang = overrideLang ?? state.lang;
  params.set('lang', targetLang);
  if (state.area !== 'all') params.set('area', state.area);
  if (state.sort !== 'savings') params.set('sort', state.sort);
  if (!state.includeVat) params.set('vat', '0');
  if (state.japaneseOnly) params.set('jp', '1');
  if (state.searchQuery.trim()) params.set('q', state.searchQuery.trim());
  if (state.krwPer100Jpy !== dataset.meta.defaultKrwPer100Jpy) {
    params.set('rate', String(state.krwPer100Jpy));
  }
  if (state.flightTargetJpy !== dataset.meta.defaultFlightJpy) {
    params.set('flight', String(state.flightTargetJpy));
  }
  if (state.plan.length > 0) {
    params.set('plan', serializePlanParam(state.plan));
  }
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function syncUrl(state: AppState): void {
  const url = buildShareUrl(state);
  const parsed = new URL(url);
  window.history.replaceState(null, '', `${parsed.pathname}${parsed.search}`);
}

function savePlan(plan: PlanEntry[]): void {
  try {
    localStorage.setItem(STORAGE_PLAN_KEY, JSON.stringify(plan));
  } catch {
    // Ignore storage quota errors
  }
}

function bootstrap(): void {
  const root = document.getElementById('app');
  if (!root) return;

  const state = loadInitialState();

  root.innerHTML = `
    <div class="shell">
      <header class="topbar" id="topbar"></header>
      <div class="fx-drawer-bar" id="fx-drawer-bar" hidden></div>
      <section class="payback-bar" id="payback-bar" aria-live="polite"></section>
      <div class="mobile-switch" id="mobile-switch"></div>
      <main class="workbench" id="workbench" data-mobile-view="list">
        <section class="list-pane" id="list-pane"></section>
        <section class="map-pane" id="map-pane" aria-label="Seoul Map">
          <div class="map-sticky">
            <div class="map-canvas" id="map-canvas"></div>
            <div class="map-status-overlay" id="map-status"></div>
            <div class="map-legend" id="map-legend"></div>
            <div class="map-peek-card" id="map-peek-card" hidden></div>
          </div>
        </section>
      </main>
      <div class="mobile-dock" id="mobile-dock"></div>
      <div class="toast" id="toast" hidden role="status" aria-live="polite"></div>
      <div class="drawer-backdrop" id="detail-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="detail-drawer-title"></div>
      <div class="drawer-backdrop" id="guide-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="guide-drawer-title"></div>
      <div class="drawer-backdrop is-modal" id="share-modal" hidden role="dialog" aria-modal="true" aria-labelledby="share-modal-title"></div>
    </div>
  `;

  const topbarEl = document.getElementById('topbar')!;
  const fxDrawerEl = document.getElementById('fx-drawer-bar')!;
  const paybackEl = document.getElementById('payback-bar')!;
  const mobileSwitchEl = document.getElementById('mobile-switch')!;
  const workbenchEl = document.getElementById('workbench')!;
  const listPaneEl = document.getElementById('list-pane')!;
  const mapCanvasEl = document.getElementById('map-canvas')!;
  const mapStatusEl = document.getElementById('map-status')!;
  const mapLegendEl = document.getElementById('map-legend')!;
  const mapPeekEl = document.getElementById('map-peek-card')!;
  const mobileDockEl = document.getElementById('mobile-dock')!;
  const toastEl = document.getElementById('toast')!;
  const detailDrawerEl = document.getElementById('detail-drawer')!;
  const guideDrawerEl = document.getElementById('guide-drawer')!;
  const shareModalEl = document.getElementById('share-modal')!;

  let currentRows: ComputedRow[] = [];
  let toastTimer = 0;

  function showToast(message: string, isOk = false): void {
    window.clearTimeout(toastTimer);
    toastEl.hidden = false;
    toastEl.className = isOk ? 'toast is-ok' : 'toast';
    toastEl.innerHTML = `${isOk ? icons.check : icons.info}<span>${escapeHtml(message)}</span>`;
    toastTimer = window.setTimeout(() => {
      toastEl.hidden = true;
    }, 2800);
  }

  const mapController = new SeoulMapController(mapCanvasEl, mapStatusEl, {
    onSelectPlace: (placeId) => {
      state.selectedPlaceId = placeId;
      updateActiveRowDom(placeId, true);
      renderMobilePeekCard();
    },
    onOpenDetail: (placeId) => {
      state.selectedPlaceId = placeId;
      state.detailPlaceId = placeId;
      renderDetailDrawer();
    },
    onHoverPlace: (placeId) => {
      state.hoveredPlaceId = placeId;
      listPaneEl.querySelectorAll<HTMLElement>('.rank-row').forEach((el) => {
        el.classList.toggle('is-hover', el.dataset.placeId === placeId);
      });
    }
  });

  function updateActiveRowDom(placeId: string | null, scrollIntoView: boolean): void {
    const scrollBox = listPaneEl.querySelector<HTMLElement>('#rows-scroll');
    const rowEls = listPaneEl.querySelectorAll<HTMLElement>('.rank-row');
    rowEls.forEach((el) => {
      el.classList.toggle('is-active', el.dataset.placeId === placeId);
    });
    if (scrollIntoView && placeId && scrollBox) {
      const target = scrollBox.querySelector<HTMLElement>(`.rank-row[data-place-id="${placeId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      showToast(copy.toastPaybackReached(formatJpy(nextSummary.totalSavingsJpy)), true);
    } else if (!exists) {
      showToast(copy.toastAdded(placeName), false);
    } else {
      showToast(copy.toastRemoved(placeName), false);
    }

    renderPaybackBar();
    renderMobileDock();
    renderListPane(false, true);
    renderMobilePeekCard();
    if (state.detailPlaceId) renderDetailDrawer();
  }

  function applyRateChange(nextRate: number): void {
    state.krwPer100Jpy = Math.round(nextRate);
    try {
      localStorage.setItem(STORAGE_RATE_KEY, String(state.krwPer100Jpy));
    } catch {
      // ignore
    }
    syncUrl(state);

    const fxInput = topbarEl.querySelector<HTMLInputElement>('#fx-input');
    if (fxInput && Number(fxInput.value) !== state.krwPer100Jpy) {
      fxInput.value = String(state.krwPer100Jpy);
    }
    const fxSlider = fxDrawerEl.querySelector<HTMLInputElement>('#fx-range-slider');
    if (fxSlider && Number(fxSlider.value) !== state.krwPer100Jpy) {
      fxSlider.value = String(state.krwPer100Jpy);
    }
    fxDrawerEl.querySelectorAll<HTMLButtonElement>('.fx-preset-btn').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(Number(btn.dataset.rate) === state.krwPer100Jpy));
    });

    renderPaybackBar();
    renderMobileDock();
    renderListPane(false, true);
    renderMobilePeekCard();
    if (state.detailPlaceId) renderDetailDrawer();
  }

  function renderTopbar(): void {
    const copy = getCopy(state.lang);
    const beautyCount = dataset.places.filter((p) => p.category === 'beauty').length;
    const eyewearCount = dataset.places.filter((p) => p.category === 'eyewear').length;

    document.documentElement.lang = state.lang;
    document.title =
      state.lang === 'ja'
        ? 'ソウル元取れマップ | 韓国公式価格 vs 日本公式価格 差額比較'
        : '서울 본전 맵 | 한국 공식가 vs 일본 공식가 차익 비교';

    topbarEl.innerHTML = `
      <div class="brand-group">
        <h1 class="brand-title">${escapeHtml(copy.appName)}</h1>
        <span class="public-badge">${icons.shield}${escapeHtml(copy.publicOnlyBadge)}</span>
      </div>

      <div class="cat-tabs" role="tablist" aria-label="Category">
        <button
          type="button"
          class="cat-tab"
          role="tab"
          aria-selected="${state.category === 'beauty'}"
          data-cat="beauty"
        >
          ${icons.clinic}
          <span>${escapeHtml(copy.tabBeauty)}</span>
          <span class="cat-count">${beautyCount}</span>
        </button>
        <button
          type="button"
          class="cat-tab"
          role="tab"
          aria-selected="${state.category === 'eyewear'}"
          data-cat="eyewear"
        >
          ${icons.glasses}
          <span>${escapeHtml(copy.tabEyewear)}</span>
          <span class="cat-count">${eyewearCount}</span>
        </button>
      </div>

      <div class="topbar-tools">
        <div class="fx-box">
          <span class="fx-label">${escapeHtml(copy.rateLabel)}</span>
          <input
            type="number"
            class="fx-input"
            id="fx-input"
            min="700"
            max="1200"
            step="1"
            value="${state.krwPer100Jpy}"
            aria-label="${escapeHtml(copy.rateLabel)}"
          />
          <span class="fx-label">${escapeHtml(copy.rateUnit)}</span>
          <button
            type="button"
            class="fx-slider-toggle"
            id="fx-slider-toggle"
            aria-expanded="${state.fxPanelOpen}"
            aria-label="FX Slider"
          >
            ${icons.sliders}
          </button>
        </div>
        <button type="button" class="ghost-btn" id="open-share-btn">
          ${icons.share}
          <span>${escapeHtml(copy.shareBtn)}</span>
        </button>
        <button type="button" class="ghost-btn" id="open-guide-btn">
          ${icons.info}
          <span>${escapeHtml(copy.guideBtn)}</span>
        </button>
        <div class="lang-switch" role="group" aria-label="Language">
          <button type="button" class="lang-btn" aria-pressed="${state.lang === 'ja'}" data-lang="ja">日本語</button>
          <button type="button" class="lang-btn" aria-pressed="${state.lang === 'ko'}" data-lang="ko">한국어</button>
        </div>
      </div>
    `;

    topbarEl.querySelectorAll<HTMLButtonElement>('.cat-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextCat = btn.dataset.cat as CategoryId;
        if (nextCat === state.category) return;
        state.category = nextCat;
        const firstMenu = dataset.menus.find((m) => m.category === nextCat);
        if (firstMenu) state.menuId = firstMenu.id;
        if (state.category === 'beauty' && state.area === 'seongsu') {
          state.area = 'all';
        }
        state.selectedPlaceId = null;
        syncUrl(state);
        renderAll(true);
      });
    });

    const fxInput = topbarEl.querySelector<HTMLInputElement>('#fx-input');
    fxInput?.addEventListener('input', () => {
      const val = Number(fxInput.value);
      if (!Number.isFinite(val) || val < 700 || val > 1200) return;
      applyRateChange(val);
    });

    topbarEl.querySelector('#fx-slider-toggle')?.addEventListener('click', () => {
      state.fxPanelOpen = !state.fxPanelOpen;
      renderTopbar();
      renderFxDrawerBar();
    });

    topbarEl.querySelector('#open-share-btn')?.addEventListener('click', () => {
      state.shareLang = state.lang;
      state.shareOpen = true;
      renderShareModal();
    });

    topbarEl.querySelector('#open-guide-btn')?.addEventListener('click', () => {
      state.guideOpen = true;
      renderGuideDrawer();
    });

    topbarEl.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextLang = btn.dataset.lang as Lang;
        if (nextLang === state.lang) return;
        state.lang = nextLang;
        try {
          localStorage.setItem(STORAGE_LANG_KEY, state.lang);
        } catch {
          // ignore
        }
        syncUrl(state);
        mapController.setLanguage(state.lang);
        renderAll(false);
      });
    });
  }

  function renderFxDrawerBar(): void {
    const copy = getCopy(state.lang);
    fxDrawerEl.hidden = !state.fxPanelOpen;
    if (!state.fxPanelOpen) {
      fxDrawerEl.innerHTML = '';
      return;
    }

    const presetsHtml = FX_PRESETS.map(
      (r) =>
        `<button type="button" class="fx-preset-btn" aria-pressed="${state.krwPer100Jpy === r}" data-rate="${r}">${r}${escapeHtml(copy.rateUnit)}</button>`
    ).join('');

    fxDrawerEl.innerHTML = `
      <div class="fx-slider-group">
        <span class="num" style="font-size:0.82rem;">750</span>
        <input
          type="range"
          class="range-slider"
          id="fx-range-slider"
          min="750"
          max="1050"
          step="1"
          value="${Math.min(1050, Math.max(750, state.krwPer100Jpy))}"
          aria-label="${escapeHtml(copy.rateLabel)}"
        />
        <span class="num" style="font-size:0.82rem;">1050</span>
      </div>
      <div class="fx-presets">
        ${presetsHtml}
        <button type="button" class="fx-reset" id="fx-drawer-reset">${icons.reset}${escapeHtml(copy.rateReset)}</button>
      </div>
      <p class="fx-hint">${escapeHtml(copy.rateSliderHint)}</p>
    `;

    fxDrawerEl.querySelector<HTMLInputElement>('#fx-range-slider')?.addEventListener('input', (ev) => {
      applyRateChange(Number((ev.target as HTMLInputElement).value));
    });

    fxDrawerEl.querySelectorAll<HTMLButtonElement>('.fx-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyRateChange(Number(btn.dataset.rate));
      });
    });

    fxDrawerEl.querySelector('#fx-drawer-reset')?.addEventListener('click', () => {
      applyRateChange(dataset.meta.defaultKrwPer100Jpy);
    });
  }

  function renderPaybackBar(): void {
    const copy = getCopy(state.lang);
    const summary = summarizePlan(
      dataset,
      state.plan,
      state.krwPer100Jpy,
      state.includeVat,
      state.flightTargetJpy
    );
    const scaleX = Math.min(1, Math.max(0, summary.paybackPct / 100));
    const remainingJpy = Math.max(0, summary.flightTargetJpy - summary.totalSavingsJpy);

    const statusHtml =
      summary.items.length === 0
        ? ''
        : summary.paybackReached
          ? `<span class="payback-status is-reached">${icons.check}${escapeHtml(copy.paybackReached)}</span>`
          : `<span class="payback-status">${escapeHtml(copy.paybackRemaining(formatJpy(remainingJpy)))}</span>`;

    const presetHtml = dataset.meta.flightPresets
      .map((preset) => {
        const label = state.lang === 'ja' ? preset.labelJa : preset.labelKo;
        const pressed = state.flightTargetJpy === preset.jpy;
        return `<button type="button" class="flight-chip" aria-pressed="${pressed}" data-flight="${preset.jpy}">${escapeHtml(label)}</button>`;
      })
      .join('');

    const ledgerHtml =
      state.planOpen && summary.items.length > 0
        ? `
          <div class="plan-ledger">
            ${summary.items
              .map((row) => {
                const placeName = state.lang === 'ja' ? row.place.nameJa : row.place.nameKo;
                const menuName = state.lang === 'ja' ? row.menu.shortJa : row.menu.shortKo;
                const key = `${row.place.id}::${row.menu.id}`;
                return `
                  <div class="plan-item">
                    <div class="plan-item-info">
                      <span class="plan-item-name">${escapeHtml(placeName)}</span>
                      <span class="plan-item-menu">${escapeHtml(menuName)}</span>
                    </div>
                    <div class="plan-item-right">
                      <span class="num">${escapeHtml(formatJpy(row.krTotalJpy))}</span>
                      <span class="savings-pill ${row.savingsJpy < 0 ? 'is-negative' : ''}">${escapeHtml(
                        row.savingsJpy >= 0
                          ? copy.savingsBadge(formatJpy(row.savingsJpy))
                          : copy.moreExpensiveBadge(formatJpy(Math.abs(row.savingsJpy)))
                      )}</span>
                      <button type="button" class="plan-remove" data-remove-key="${escapeHtml(key)}" aria-label="${escapeHtml(copy.removeLabel)}">
                        ${icons.close}
                      </button>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        `
        : '';

    paybackEl.innerHTML = `
      <div class="payback-top">
        <div class="payback-main">
          <div class="payback-headline">
            <div class="payback-title-wrap">
              ${icons.plane}
              <span class="payback-label">${escapeHtml(copy.paybackHeading)}</span>
              ${statusHtml}
            </div>
            <span class="payback-pct ${summary.paybackReached ? 'is-reached' : ''}">
              ${summary.paybackPct}%
            </span>
          </div>
          <div class="payback-track" role="progressbar" aria-valuenow="${summary.paybackPct}" aria-valuemin="0" aria-valuemax="100">
            <div class="payback-fill ${summary.paybackReached ? 'is-reached' : ''}" style="transform: scaleX(${scaleX});"></div>
          </div>
          ${
            summary.items.length === 0
              ? `
                <div class="payback-empty-row">
                  <p class="payback-hint">${escapeHtml(copy.paybackEmptyHint)}</p>
                  <button type="button" class="demo-cta" id="load-demo-plan">
                    ${icons.plus}${escapeHtml(copy.loadDemoPlan)}
                  </button>
                </div>
              `
              : `
                <div class="plan-stats">
                  <span class="stat-pair">
                    <span class="stat-k">${escapeHtml(copy.totalSavingsLabel)}</span>
                    <span class="stat-v num ${summary.paybackReached ? 'is-ok' : 'is-savings'}">${escapeHtml(
                      state.lang === 'ko'
                        ? `${formatJpy(summary.totalSavingsJpy)} (약 ${formatKrw(jpyToKrw(summary.totalSavingsJpy, state.krwPer100Jpy))})`
                        : formatJpy(summary.totalSavingsJpy)
                    )}</span>
                  </span>
                  <span class="stat-pair">
                    <span class="stat-k">${escapeHtml(copy.krTotalLabel)}</span>
                    <span class="stat-v num">${escapeHtml(formatJpy(summary.totalKrJpy))} (${escapeHtml(formatKrw(summary.totalKrKrw))})</span>
                  </span>
                  <span class="stat-pair">
                    <span class="stat-k">${escapeHtml(copy.jpBenchmarkLabel)}</span>
                    <span class="stat-v num">${escapeHtml(formatJpy(summary.totalJpJpy))}</span>
                  </span>
                  <span class="customs-pill ${summary.customsExceeded ? 'is-warn' : ''}">
                    ${escapeHtml(
                      summary.customsExceeded
                        ? copy.customsWarn
                        : copy.customsOk(summary.customsRatioPct)
                    )}
                  </span>
                </div>
              `
          }
        </div>

        <div class="payback-controls">
          <div class="payback-controls-row">
            <div class="flight-presets" role="group" aria-label="${escapeHtml(copy.flightTargetLabel)}">
              ${presetHtml}
            </div>
            ${
              summary.items.length > 0
                ? `
                  <button type="button" class="ghost-btn" id="toggle-plan-btn">
                    <span>${escapeHtml(copy.planItemsCount(summary.items.length))}</span>
                    <span>${escapeHtml(state.planOpen ? copy.planToggleHide : copy.planToggleShow)}</span>
                  </button>
                  <button type="button" class="ghost-btn" id="clear-plan-btn">
                    ${escapeHtml(copy.clearPlan)}
                  </button>
                `
                : ''
            }
          </div>
          <label class="flight-slider-wrap">
            <span>${escapeHtml(copy.flightSliderLabel)}</span>
            <input
              type="range"
              class="range-slider"
              id="flight-range-slider"
              min="15000"
              max="80000"
              step="1000"
              value="${state.flightTargetJpy}"
              aria-label="${escapeHtml(copy.flightSliderLabel)}"
            />
            <span class="num">${escapeHtml(formatJpy(state.flightTargetJpy))}</span>
          </label>
        </div>
      </div>
      ${ledgerHtml}
    `;

    paybackEl.querySelectorAll<HTMLButtonElement>('.flight-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.flightTargetJpy = Number(btn.dataset.flight) || dataset.meta.defaultFlightJpy;
        syncUrl(state);
        renderPaybackBar();
        renderMobileDock();
        if (state.detailPlaceId) renderDetailDrawer();
      });
    });

    paybackEl.querySelector<HTMLInputElement>('#flight-range-slider')?.addEventListener('input', (ev) => {
      state.flightTargetJpy = Number((ev.target as HTMLInputElement).value);
      syncUrl(state);
      renderPaybackBar();
      renderMobileDock();
      if (state.detailPlaceId) renderDetailDrawer();
    });

    paybackEl.querySelector('#load-demo-plan')?.addEventListener('click', () => {
      state.plan = [
        { key: 'top50-sinchon::lens-174-bl', placeId: 'top50-sinchon', menuId: 'lens-174-bl' },
        { key: 'vands-hongdae::rejuran-2cc', placeId: 'vands-hongdae', menuId: 'rejuran-2cc' }
      ];
      state.planOpen = true;
      savePlan(state.plan);
      syncUrl(state);
      showToast(copy.toastDemoLoaded, true);
      renderPaybackBar();
      renderMobileDock();
      renderListPane(false, true);
    });

    paybackEl.querySelector('#toggle-plan-btn')?.addEventListener('click', () => {
      state.planOpen = !state.planOpen;
      renderPaybackBar();
    });

    paybackEl.querySelector('#clear-plan-btn')?.addEventListener('click', () => {
      state.plan = [];
      state.planOpen = false;
      savePlan(state.plan);
      syncUrl(state);
      renderPaybackBar();
      renderMobileDock();
      renderListPane(false, true);
      renderMobilePeekCard();
      if (state.detailPlaceId) renderDetailDrawer();
    });

    paybackEl.querySelectorAll<HTMLButtonElement>('[data-remove-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.removeKey;
        state.plan = state.plan.filter((item) => item.key !== key);
        if (state.plan.length === 0) state.planOpen = false;
        savePlan(state.plan);
        syncUrl(state);
        renderPaybackBar();
        renderMobileDock();
        renderListPane(false, true);
        renderMobilePeekCard();
        if (state.detailPlaceId) renderDetailDrawer();
      });
    });
  }

  function renderMobileDock(): void {
    const copy = getCopy(state.lang);
    const summary = summarizePlan(
      dataset,
      state.plan,
      state.krwPer100Jpy,
      state.includeVat,
      state.flightTargetJpy
    );
    const scaleX = Math.min(1, Math.max(0, summary.paybackPct / 100));

    mobileDockEl.innerHTML = `
      <div class="mobile-dock-inner">
        <div class="mobile-dock-meta">
          <div class="mobile-dock-line">
            <span style="font-weight:700;">${escapeHtml(
              summary.paybackReached ? copy.paybackReached : copy.paybackHeading
            )}</span>
            <span class="num ${summary.paybackReached ? 'stat-v is-ok' : 'stat-v is-savings'}">
              ${summary.paybackPct}% (${escapeHtml(formatJpy(summary.totalSavingsJpy))})
            </span>
          </div>
          <div class="payback-track">
            <div class="payback-fill ${summary.paybackReached ? 'is-reached' : ''}" style="transform: scaleX(${scaleX});"></div>
          </div>
        </div>
        <button type="button" class="ghost-btn" id="dock-share-btn">
          ${icons.share}
        </button>
        <button type="button" class="ghost-btn" id="dock-map-btn">
          ${state.mobileView === 'list' ? icons.map : icons.list}
          <span>${escapeHtml(state.mobileView === 'list' ? copy.mobileMap : copy.mobileList)}</span>
        </button>
      </div>
    `;

    mobileDockEl.querySelector('#dock-share-btn')?.addEventListener('click', () => {
      state.shareLang = state.lang;
      state.shareOpen = true;
      renderShareModal();
    });

    mobileDockEl.querySelector('#dock-map-btn')?.addEventListener('click', () => {
      state.mobileView = state.mobileView === 'list' ? 'map' : 'list';
      renderMobileSwitch();
      renderMobileDock();
      if (state.mobileView === 'map') {
        requestAnimationFrame(() => mapController.resize());
      }
    });
  }

  function renderMobileSwitch(): void {
    const copy = getCopy(state.lang);
    workbenchEl.dataset.mobileView = state.mobileView;
    mobileSwitchEl.innerHTML = `
      <div class="mobile-seg" role="group">
        <button type="button" class="mobile-seg-btn" aria-pressed="${state.mobileView === 'list'}" data-mview="list">
          ${icons.list}<span>${escapeHtml(copy.mobileList)}</span>
        </button>
        <button type="button" class="mobile-seg-btn" aria-pressed="${state.mobileView === 'map'}" data-mview="map">
          ${icons.map}<span>${escapeHtml(copy.mobileMap)}</span>
        </button>
      </div>
    `;
    mobileSwitchEl.querySelectorAll<HTMLButtonElement>('[data-mview]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.mobileView = btn.dataset.mview as 'list' | 'map';
        renderMobileSwitch();
        renderMobileDock();
        if (state.mobileView === 'map') {
          requestAnimationFrame(() => mapController.resize());
        }
      });
    });
  }

  function renderMobilePeekCard(): void {
    if (!state.selectedPlaceId) {
      mapPeekEl.hidden = true;
      mapPeekEl.innerHTML = '';
      return;
    }

    const row = currentRows.find((r) => r.place.id === state.selectedPlaceId);
    if (!row) {
      mapPeekEl.hidden = true;
      return;
    }

    const copy = getCopy(state.lang);
    const name = state.lang === 'ja' ? row.place.nameJa : row.place.nameKo;
    const station = state.lang === 'ja' ? row.place.stationJa : row.place.stationKo;
    const inPlan = isInPlan(row.place.id, row.menu.id);
    const savingsLabel =
      row.savingsJpy >= 0
        ? copy.savingsBadge(formatJpy(row.savingsJpy))
        : copy.moreExpensiveBadge(formatJpy(Math.abs(row.savingsJpy)));

    mapPeekEl.hidden = false;
    mapPeekEl.innerHTML = `
      <div class="map-peek-top">
        <div style="min-width:0;">
          <div style="font-weight:700;font-size:0.94rem;">${escapeHtml(name)}</div>
          <div style="font-size:0.78rem;color:var(--ink-secondary);">${escapeHtml(station)}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div class="price-jpy">${escapeHtml(formatJpy(row.krTotalJpy))}</div>
          <span class="savings-pill ${row.savingsJpy < 0 ? 'is-negative' : ''}">${escapeHtml(savingsLabel)}</span>
        </div>
      </div>
      <div class="map-peek-actions">
        <button type="button" class="plan-btn" aria-pressed="${inPlan}" id="peek-plan-btn" style="flex:1;justify-content:center;">
          ${inPlan ? icons.check : icons.plus}
          <span>${escapeHtml(inPlan ? copy.addedToPlan : copy.addToPlan)}</span>
        </button>
        <button type="button" class="detail-btn" id="peek-detail-btn" style="flex:1;">
          ${escapeHtml(copy.detailsBtn)}
        </button>
        <button type="button" class="plan-remove" id="peek-close-btn" aria-label="${escapeHtml(copy.drawerClose)}">
          ${icons.close}
        </button>
      </div>
    `;

    mapPeekEl.querySelector('#peek-plan-btn')?.addEventListener('click', () => {
      togglePlanItem(row.place.id, row.menu.id);
    });
    mapPeekEl.querySelector('#peek-detail-btn')?.addEventListener('click', () => {
      state.detailPlaceId = row.place.id;
      renderDetailDrawer();
    });
    mapPeekEl.querySelector('#peek-close-btn')?.addEventListener('click', () => {
      state.selectedPlaceId = null;
      renderMobilePeekCard();
    });
  }

  function renderMapLegend(): void {
    const copy = getCopy(state.lang);
    mapLegendEl.innerHTML = `
      <span class="legend-item">
        <span class="legend-swatch is-venue"></span>
        <span>${escapeHtml(copy.venueLabel)}</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch"></span>
        <span>${escapeHtml(state.lang === 'ja' ? '店舗(円換算)' : '지점(엔화환산)')}</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch is-active"></span>
        <span>${escapeHtml(state.lang === 'ja' ? 'エリア集約 / 選択中' : '권역 묶음 / 선택됨')}</span>
      </span>
    `;
  }

  function renderRowsOnly(): void {
    const copy = getCopy(state.lang);
    const scrollBox = listPaneEl.querySelector<HTMLElement>('#rows-scroll');
    const countEl = listPaneEl.querySelector<HTMLElement>('#result-count');
    if (!scrollBox || !countEl) return;

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

    countEl.textContent = copy.resultsCount(currentRows.length);

    if (currentRows.length === 0) {
      scrollBox.innerHTML = `
        <div class="empty-state">
          <h3>${escapeHtml(copy.emptyListTitle)}</h3>
          <p>${escapeHtml(copy.emptyListBody)}</p>
          <button type="button" class="ghost-btn" id="reset-filters-btn">${escapeHtml(copy.resetAreaBtn)}</button>
        </div>
      `;
      scrollBox.querySelector('#reset-filters-btn')?.addEventListener('click', () => {
        state.area = 'all';
        state.searchQuery = '';
        state.japaneseOnly = false;
        syncUrl(state);
        renderListPane(true, false);
      });
      mapController.updateData(currentRows, dataset.areas, state.selectedPlaceId, false);
      return;
    }

    scrollBox.innerHTML = currentRows
      .map((row, idx) => {
        const name = state.lang === 'ja' ? row.place.nameJa : row.place.nameKo;
        const subName = state.lang === 'ja' ? row.place.nameKo : row.place.nameJa;
        const station = state.lang === 'ja' ? row.place.stationJa : row.place.stationKo;
        const distLabel = formatDistance(row.distanceMeters, state.lang);
        const caveat = state.lang === 'ja' ? row.place.caveatJa : row.place.caveatKo;
        const inPlan = isInPlan(row.place.id, row.menu.id);
        const isActive = row.place.id === state.selectedPlaceId;
        const savingsLabel =
          row.savingsJpy >= 0
            ? copy.savingsBadge(formatJpy(row.savingsJpy))
            : copy.moreExpensiveBadge(formatJpy(Math.abs(row.savingsJpy)));

        const sourceBadge =
          row.place.sourceType === 'official_event'
            ? copy.officialEventTag
            : copy.officialStandardTag;

        const vatTag =
          row.place.category === 'beauty'
            ? `<span class="tag">${escapeHtml(state.includeVat ? copy.vatIncludedShort : copy.vatExcludedShort)}</span>`
            : '';

        const ratioScale = Math.min(1, Math.max(0.08, row.krRatioOfJp / 100));

        return `
          <article
            class="rank-row ${idx < 3 ? 'is-top' : ''} ${isActive ? 'is-active' : ''}"
            data-place-id="${row.place.id}"
          >
            <div class="rank-num">#${idx + 1}</div>
            <div class="row-body">
              <div class="row-title-line">
                <h2 class="row-name">${escapeHtml(name)}</h2>
                <span class="row-subname">${escapeHtml(subName)}</span>
              </div>
              <div class="row-loc">
                <span>${escapeHtml(station)}</span>
                <span>${escapeHtml(distLabel)}</span>
              </div>
              <div class="ratio-meter" aria-label="${escapeHtml(copy.ratioLabel(row.krRatioOfJp))}">
                <div class="ratio-track">
                  <div class="ratio-fill ${row.krRatioOfJp >= 85 ? 'is-high' : ''}" style="transform: scaleX(${ratioScale});"></div>
                </div>
                <span class="ratio-text">${escapeHtml(copy.ratioLabel(row.krRatioOfJp))}</span>
              </div>
              <div class="row-tags">
                <span class="tag">${escapeHtml(sourceBadge)}</span>
                ${vatTag}
                ${row.place.japaneseSupport ? `<span class="tag is-jp">${escapeHtml(copy.jpSupportTag)}</span>` : ''}
                <span class="tag is-warn">${escapeHtml(caveat)}</span>
              </div>
            </div>
            <div class="row-price-col">
              <div>
                <div class="price-jpy">${escapeHtml(formatJpy(row.krTotalJpy))}</div>
                <div class="price-krw">${escapeHtml(formatKrw(row.totalKrw))}</div>
              </div>
              <span class="savings-pill ${row.savingsJpy < 0 ? 'is-negative' : ''}">
                ${escapeHtml(savingsLabel)}
              </span>
              <div class="row-actions">
                <button
                  type="button"
                  class="plan-btn"
                  aria-pressed="${inPlan}"
                  data-plan-place="${row.place.id}"
                >
                  ${inPlan ? icons.check : icons.plus}
                  <span>${escapeHtml(inPlan ? copy.addedToPlan : copy.addToPlan)}</span>
                </button>
                <button
                  type="button"
                  class="detail-btn"
                  data-detail-place="${row.place.id}"
                >
                  ${escapeHtml(copy.detailsBtn)}
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    scrollBox.querySelectorAll<HTMLElement>('.rank-row').forEach((rowEl) => {
      const placeId = rowEl.dataset.placeId!;
      rowEl.addEventListener('pointerenter', () => {
        mapController.setHoveredPlace(placeId);
      });
      rowEl.addEventListener('pointerleave', () => {
        mapController.setHoveredPlace(null);
      });
      rowEl.addEventListener('click', (ev) => {
        const target = ev.target as HTMLElement;
        if (target.closest('button')) return;
        const matched = currentRows.find((r) => r.place.id === placeId);
        if (!matched) return;
        state.selectedPlaceId = placeId;
        updateActiveRowDom(placeId, false);
        mapController.focusPlace(matched);
        renderMobilePeekCard();
      });
    });

    scrollBox.querySelectorAll<HTMLButtonElement>('[data-plan-place]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        togglePlanItem(btn.dataset.planPlace!, state.menuId);
      });
    });

    scrollBox.querySelectorAll<HTMLButtonElement>('[data-detail-place]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const placeId = btn.dataset.detailPlace!;
        const matched = currentRows.find((r) => r.place.id === placeId);
        state.selectedPlaceId = placeId;
        state.detailPlaceId = placeId;
        updateActiveRowDom(placeId, false);
        if (matched) mapController.focusPlace(matched);
        renderDetailDrawer();
      });
    });
  }

  function renderListPane(fitMap: boolean, preserveSearchFocus = false): void {
    const activeSearch =
      preserveSearchFocus && document.activeElement?.id === 'place-search-input';
    if (activeSearch) {
      renderRowsOnly();
      mapController.updateData(currentRows, dataset.areas, state.selectedPlaceId, fitMap);
      return;
    }

    const copy = getCopy(state.lang);
    const activeMenu = dataset.menus.find((m) => m.id === state.menuId)!;
    const catMenus = dataset.menus.filter((m) => m.category === state.category);
    const visibleAreas = dataset.areas.filter(
      (a) => a.id === 'all' || dataset.places.some((p) => p.category === state.category && p.area === a.id)
    );

    const menuChipsHtml = catMenus
      .map((menu) => {
        const label = state.lang === 'ja' ? menu.shortJa : menu.shortKo;
        return `<button type="button" class="chip is-menu" aria-pressed="${menu.id === state.menuId}" data-menu="${menu.id}">${escapeHtml(label)}</button>`;
      })
      .join('');

    const areaChipsHtml = visibleAreas
      .map((area) => {
        const label = state.lang === 'ja' ? area.nameJa : area.nameKo;
        return `<button type="button" class="chip" aria-pressed="${area.id === state.area}" data-area="${area.id}">${escapeHtml(label)}</button>`;
      })
      .join('');

    const policyHtml =
      state.category === 'beauty'
        ? `
          <div class="policy-row">
            <div>
              <label class="vat-toggle">
                <input type="checkbox" id="vat-checkbox" ${state.includeVat ? 'checked' : ''} />
                <span>${escapeHtml(copy.vatToggleLabel)}</span>
              </label>
              <p class="policy-desc">${escapeHtml(state.includeVat ? copy.vatNoteOn : copy.vatNoteOff)}</p>
            </div>
          </div>
        `
        : `
          <div class="policy-row is-eyewear">
            <p class="policy-desc" style="margin:0;">${escapeHtml(copy.eyewearTaxNote)}</p>
          </div>
        `;

    const jpDetail = state.lang === 'ja' ? activeMenu.jpSourceDetailJa : activeMenu.jpSourceDetailKo;
    const jpSourceLabel =
      state.lang === 'ja'
        ? activeMenu.jpSourceName
        : (activeMenu.jpSourceNameKo ?? activeMenu.jpSourceName);
    const jpBenchmarkDisplay =
      state.lang === 'ko'
        ? `${formatJpy(activeMenu.jpBenchmarkJpy)} (약 ${formatKrw(jpyToKrw(activeMenu.jpBenchmarkJpy, state.krwPer100Jpy))})`
        : formatJpy(activeMenu.jpBenchmarkJpy);

    listPaneEl.innerHTML = `
      <div class="controls-block">
        <div class="chip-row" role="group" aria-label="Menu">${menuChipsHtml}</div>
        <div class="chip-row" role="group" aria-label="Area">${areaChipsHtml}</div>
        <div class="search-row">
          <div class="search-box">
            <span class="search-icon">${icons.search}</span>
            <input
              type="search"
              class="search-input"
              id="place-search-input"
              value="${escapeHtml(state.searchQuery)}"
              placeholder="${escapeHtml(copy.searchPlaceholder)}"
              aria-label="${escapeHtml(copy.searchPlaceholder)}"
            />
            ${
              state.searchQuery
                ? `<button type="button" class="search-clear" id="search-clear-btn" aria-label="${escapeHtml(copy.searchClear)}">${icons.close}</button>`
                : ''
            }
          </div>
          <button type="button" class="jp-filter-btn" id="jp-only-btn" aria-pressed="${state.japaneseOnly}">
            ${escapeHtml(copy.jpOnlyFilter)}
          </button>
        </div>
        ${policyHtml}
      </div>

      <div class="benchmark-strip">
        <div class="benchmark-text">
          <div class="benchmark-head">
            <span class="benchmark-label">${escapeHtml(copy.benchmarkPrefix)} (${escapeHtml(jpSourceLabel)})</span>
            <span class="benchmark-price">${escapeHtml(jpBenchmarkDisplay)}</span>
          </div>
          <p class="benchmark-detail">${escapeHtml(jpDetail)}</p>
        </div>
        <a
          class="benchmark-link"
          href="${escapeHtml(activeMenu.jpSourceUrl)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>${escapeHtml(copy.benchmarkSource)}</span>
          ${icons.external}
        </a>
      </div>

      <div class="toolbar-meta">
        <span class="result-count" id="result-count"></span>
        <div class="sort-tabs" role="group" aria-label="Sort">
          <button type="button" class="sort-btn" aria-pressed="${state.sort === 'savings'}" data-sort="savings">${escapeHtml(copy.sortSavings)}</button>
          <button type="button" class="sort-btn" aria-pressed="${state.sort === 'price'}" data-sort="price">${escapeHtml(copy.sortPrice)}</button>
          <button type="button" class="sort-btn" aria-pressed="${state.sort === 'distance'}" data-sort="distance">${escapeHtml(copy.sortDistance)}</button>
        </div>
      </div>

      <div class="rows-scroll" id="rows-scroll"></div>
    `;

    renderRowsOnly();

    listPaneEl.querySelectorAll<HTMLButtonElement>('[data-menu]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.menuId = btn.dataset.menu!;
        state.selectedPlaceId = null;
        syncUrl(state);
        renderListPane(true, false);
        renderMobilePeekCard();
      });
    });

    listPaneEl.querySelectorAll<HTMLButtonElement>('[data-area]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.area = btn.dataset.area as AreaId;
        state.selectedPlaceId = null;
        syncUrl(state);
        renderListPane(true, false);
        renderMobilePeekCard();
      });
    });

    const searchInput = listPaneEl.querySelector<HTMLInputElement>('#place-search-input');
    searchInput?.addEventListener('input', () => {
      state.searchQuery = searchInput.value;
      syncUrl(state);
      renderRowsOnly();
      mapController.updateData(currentRows, dataset.areas, state.selectedPlaceId, true);
      const existingClear = listPaneEl.querySelector('#search-clear-btn');
      if (state.searchQuery && !existingClear) {
        const box = listPaneEl.querySelector('.search-box');
        if (box) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'search-clear';
          btn.id = 'search-clear-btn';
          btn.setAttribute('aria-label', copy.searchClear);
          btn.innerHTML = icons.close;
          btn.addEventListener('click', clearSearch);
          box.appendChild(btn);
        }
      } else if (!state.searchQuery && existingClear) {
        existingClear.remove();
      }
    });

    const clearSearch = () => {
      state.searchQuery = '';
      syncUrl(state);
      renderListPane(true, false);
    };
    listPaneEl.querySelector('#search-clear-btn')?.addEventListener('click', clearSearch);

    listPaneEl.querySelector('#jp-only-btn')?.addEventListener('click', () => {
      state.japaneseOnly = !state.japaneseOnly;
      syncUrl(state);
      renderListPane(true, false);
    });

    listPaneEl.querySelector('#vat-checkbox')?.addEventListener('change', (ev) => {
      state.includeVat = (ev.target as HTMLInputElement).checked;
      syncUrl(state);
      renderPaybackBar();
      renderMobileDock();
      renderListPane(false, false);
      renderMobilePeekCard();
      if (state.detailPlaceId) renderDetailDrawer();
    });

    listPaneEl.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.sort = btn.dataset.sort as SortId;
        syncUrl(state);
        renderListPane(false, false);
      });
    });

    mapController.updateData(currentRows, dataset.areas, state.selectedPlaceId, fitMap);
  }

  function renderDetailDrawer(): void {
    if (!state.detailPlaceId) {
      detailDrawerEl.hidden = true;
      detailDrawerEl.innerHTML = '';
      return;
    }

    const place = dataset.places.find((p) => p.id === state.detailPlaceId);
    const menu = dataset.menus.find((m) => m.id === state.menuId);
    if (!place || !menu) {
      detailDrawerEl.hidden = true;
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
      detailDrawerEl.hidden = true;
      return;
    }

    const copy = getCopy(state.lang);
    const title = state.lang === 'ja' ? place.nameJa : place.nameKo;
    const subTitle = state.lang === 'ja' ? place.nameKo : place.nameJa;
    const menuTitle = state.lang === 'ja' ? menu.nameJa : menu.nameKo;
    const station = state.lang === 'ja' ? place.stationJa : place.stationKo;
    const offerNote = state.lang === 'ja' ? row.offer.noteJa : row.offer.noteKo;
    const caveat = state.lang === 'ja' ? place.caveatJa : place.caveatKo;
    const leadTime = state.lang === 'ja' ? menu.leadTimeNoteJa : menu.leadTimeNoteKo;
    const jpDetail = state.lang === 'ja' ? menu.jpSourceDetailJa : menu.jpSourceDetailKo;
    const flightSharePct = Math.round((row.savingsJpy / state.flightTargetJpy) * 100);
    const inPlan = isInPlan(place.id, menu.id);
    const ratioScale = Math.min(1, Math.max(0.08, row.krRatioOfJp / 100));

    const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(place.nameKo)}`;
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${place.lat},${place.lng}`
    )}`;

    detailDrawerEl.hidden = false;
    detailDrawerEl.innerHTML = `
      <div class="drawer-panel">
        <div class="drawer-header">
          <h2 class="drawer-title" id="detail-drawer-title">${escapeHtml(copy.drawerTitle)}</h2>
          <button type="button" class="drawer-close" id="close-detail-btn" aria-label="${escapeHtml(copy.drawerClose)}">
            ${icons.close}
          </button>
        </div>

        <div class="drawer-body">
          <div>
            <h3 class="drawer-place-name">${escapeHtml(title)}</h3>
            <p class="drawer-place-sub">${escapeHtml(subTitle)} / ${escapeHtml(menuTitle)}</p>
            <div class="ratio-meter" style="margin-top:12px;">
              <div class="ratio-track" style="max-width:none;">
                <div class="ratio-fill ${row.krRatioOfJp >= 85 ? 'is-high' : ''}" style="transform: scaleX(${ratioScale});"></div>
              </div>
              <span class="ratio-text">${escapeHtml(copy.ratioLabel(row.krRatioOfJp))}</span>
            </div>
          </div>

          <table class="receipt-table">
            <tbody>
              <tr>
                <th>${escapeHtml(copy.receiptKrBase)}</th>
                <td>${escapeHtml(formatKrw(row.baseKrw))}</td>
              </tr>
              ${
                place.category === 'beauty'
                  ? `
                    <tr>
                      <th>${escapeHtml(copy.receiptVat)}</th>
                      <td>${row.vatKrw > 0 ? `+${escapeHtml(formatKrw(row.vatKrw))}` : escapeHtml(formatKrw(0))}</td>
                    </tr>
                  `
                  : ''
              }
              <tr class="is-total">
                <th>${escapeHtml(copy.receiptKrTotal)}</th>
                <td>${escapeHtml(formatJpy(row.krTotalJpy))} (${escapeHtml(formatKrw(row.totalKrw))})</td>
              </tr>
              <tr>
                <th>${escapeHtml(copy.receiptJpBase)}</th>
                <td>${escapeHtml(formatJpy(row.jpBenchmarkJpy))}</td>
              </tr>
              <tr class="is-savings">
                <th>${escapeHtml(copy.receiptSavings)}</th>
                <td>${escapeHtml(
                  state.lang === 'ko'
                    ? `${formatJpy(row.savingsJpy)} (약 ${formatKrw(jpyToKrw(row.savingsJpy, state.krwPer100Jpy))} / ${row.savingsPct}%)`
                    : `${formatJpy(row.savingsJpy)} (${row.savingsPct}%)`
                )}</td>
              </tr>
              <tr>
                <th>${escapeHtml(copy.receiptFlightShare)}</th>
                <td>${flightSharePct}%</td>
              </tr>
            </tbody>
          </table>

          <div class="action-stack">
            <button type="button" class="primary-btn ${inPlan ? 'is-added' : ''}" id="drawer-plan-btn">
              ${inPlan ? icons.check : icons.plus}
              <span>${escapeHtml(inPlan ? copy.addedToPlan : copy.addToPlan)}</span>
            </button>

            <div class="secondary-links">
              <a class="ext-link-btn" href="${escapeHtml(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">
                <span>${escapeHtml(copy.verifyKrOfficial)}</span>
                ${icons.external}
              </a>
              <a class="ext-link-btn" href="${escapeHtml(menu.jpSourceUrl)}" target="_blank" rel="noopener noreferrer">
                <span>${escapeHtml(copy.verifyJpOfficial)}</span>
                ${icons.external}
              </a>
            </div>
          </div>

          <dl class="info-list">
            <div class="info-row">
              <dt>${escapeHtml(copy.caveatLabel)}</dt>
              <dd>${escapeHtml(offerNote)} / ${escapeHtml(caveat)}</dd>
            </div>
            <div class="info-row">
              <dt>${escapeHtml(copy.leadTimeLabel)}</dt>
              <dd>${escapeHtml(leadTime)}</dd>
            </div>
            <div class="info-row">
              <dt>${escapeHtml(copy.stationLabel)}</dt>
              <dd>${escapeHtml(station)} (${escapeHtml(formatDistance(row.distanceMeters, state.lang))})</dd>
            </div>
            <div class="info-row">
              <dt>${escapeHtml(copy.addressLabel)}</dt>
              <dd>${escapeHtml(place.addressKo)}</dd>
            </div>
            <div class="info-row">
              <dt>${escapeHtml(copy.benchmarkPrefix)}</dt>
              <dd>${escapeHtml(jpDetail)}</dd>
            </div>
          </dl>

          <div class="secondary-links">
            <a class="ext-link-btn" href="${escapeHtml(naverUrl)}" target="_blank" rel="noopener noreferrer">
              ${icons.navigation}
              <span>${escapeHtml(copy.openNaverMap)}</span>
            </a>
            <a class="ext-link-btn" href="${escapeHtml(googleUrl)}" target="_blank" rel="noopener noreferrer">
              ${icons.mapPin}
              <span>${escapeHtml(copy.openGoogleMap)}</span>
            </a>
          </div>

          <div class="provenance-box">
            <div class="provenance-head">
              ${icons.shield}
              <span>${escapeHtml(copy.provenanceChecked(dataset.meta.checkedDate))}</span>
            </div>
            <p class="provenance-text">${escapeHtml(copy.provenanceNoFieldwork)}</p>
          </div>
        </div>
      </div>
    `;

    const close = () => {
      state.detailPlaceId = null;
      renderDetailDrawer();
    };

    detailDrawerEl.querySelector('#close-detail-btn')?.addEventListener('click', close);
    detailDrawerEl.onclick = (ev) => {
      if (ev.target === detailDrawerEl) close();
    };
    detailDrawerEl.querySelector('#drawer-plan-btn')?.addEventListener('click', () => {
      togglePlanItem(place.id, menu.id);
    });
  }

  function renderGuideDrawer(): void {
    if (!state.guideOpen) {
      guideDrawerEl.hidden = true;
      guideDrawerEl.innerHTML = '';
      return;
    }

    const copy = getCopy(state.lang);
    guideDrawerEl.hidden = false;
    guideDrawerEl.innerHTML = `
      <div class="drawer-panel">
        <div class="drawer-header">
          <h2 class="drawer-title" id="guide-drawer-title">${escapeHtml(copy.guideTitle)}</h2>
          <button type="button" class="drawer-close" id="close-guide-btn" aria-label="${escapeHtml(copy.drawerClose)}">
            ${icons.close}
          </button>
        </div>
        <div class="drawer-body">
          <section class="guide-section">
            <h3>${escapeHtml(copy.guideVatTitle)}</h3>
            <p>${escapeHtml(copy.guideVatBody)}</p>
          </section>
          <section class="guide-section">
            <h3>${escapeHtml(copy.guideEyewearTitle)}</h3>
            <p>${escapeHtml(copy.guideEyewearBody)}</p>
          </section>
          <section class="guide-section">
            <h3>${escapeHtml(copy.guideCustomsTitle)}</h3>
            <p>${escapeHtml(copy.guideCustomsBody)}</p>
          </section>
          <section class="guide-section">
            <h3>${escapeHtml(copy.guideSourceTitle)}</h3>
            <p>${escapeHtml(copy.guideSourceBody)}</p>
          </section>
        </div>
      </div>
    `;

    const close = () => {
      state.guideOpen = false;
      renderGuideDrawer();
    };

    guideDrawerEl.querySelector('#close-guide-btn')?.addEventListener('click', close);
    guideDrawerEl.onclick = (ev) => {
      if (ev.target === guideDrawerEl) close();
    };
  }

  function renderShareModal(): void {
    if (!state.shareOpen) {
      shareModalEl.hidden = true;
      shareModalEl.innerHTML = '';
      return;
    }

    const copy = getCopy(state.lang);
    const shareUrl = buildShareUrl(state, state.shareLang);

    shareModalEl.hidden = false;
    shareModalEl.innerHTML = `
      <div class="modal-panel">
        <div class="drawer-header">
          <h2 class="drawer-title" id="share-modal-title">${escapeHtml(copy.shareTitle)}</h2>
          <button type="button" class="drawer-close" id="close-share-btn" aria-label="${escapeHtml(copy.drawerClose)}">
            ${icons.close}
          </button>
        </div>
        <div class="drawer-body">
          <div class="lang-switch" role="group" aria-label="QR Language" style="align-self:center;">
            <button type="button" class="lang-btn" aria-pressed="${state.shareLang === 'ja'}" data-share-lang="ja">${escapeHtml(copy.shareQrLangJa)}</button>
            <button type="button" class="lang-btn" aria-pressed="${state.shareLang === 'ko'}" data-share-lang="ko">${escapeHtml(copy.shareQrLangKo)}</button>
          </div>
          <div class="qr-frame" id="qr-container"></div>
          <p class="provenance-text">${escapeHtml(copy.shareDesc)}</p>
          ${
            state.plan.length > 0
              ? `<span class="tag is-jp" style="align-self:flex-start;">${escapeHtml(copy.sharePlanIncluded(state.plan.length))}</span>`
              : ''
          }
          <input type="text" class="share-url-input" id="share-url-input" readonly value="${escapeHtml(shareUrl)}" aria-label="Share URL" />
          <button type="button" class="primary-btn" id="copy-share-btn">
            ${icons.copy}
            <span>${escapeHtml(copy.shareCopyLink)}</span>
          </button>
        </div>
      </div>
    `;

    const qrContainer = shareModalEl.querySelector<HTMLElement>('#qr-container');
    if (qrContainer) {
      QRCode.toString(shareUrl, {
        type: 'svg',
        margin: 1,
        color: { dark: '#181715', light: '#f7f5f0' }
      })
        .then((svg) => {
          qrContainer.innerHTML = svg;
        })
        .catch(() => {
          qrContainer.textContent = shareUrl;
        });
    }

    const close = () => {
      state.shareOpen = false;
      renderShareModal();
    };

    shareModalEl.querySelector('#close-share-btn')?.addEventListener('click', close);
    shareModalEl.onclick = (ev) => {
      if (ev.target === shareModalEl) close();
    };

    shareModalEl.querySelectorAll<HTMLButtonElement>('[data-share-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.shareLang = btn.dataset.shareLang as Lang;
        renderShareModal();
      });
    });

    shareModalEl.querySelector('#copy-share-btn')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        const input = shareModalEl.querySelector<HTMLInputElement>('#share-url-input');
        input?.select();
        document.execCommand('copy');
      }
      showToast(copy.toastCopied, true);
    });
  }

  function renderAll(fitMap: boolean): void {
    renderTopbar();
    renderFxDrawerBar();
    renderPaybackBar();
    renderMobileSwitch();
    renderMobileDock();
    renderMapLegend();
    renderListPane(fitMap, false);
    renderMobilePeekCard();
    renderDetailDrawer();
    renderGuideDrawer();
    renderShareModal();
  }

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (state.shareOpen) {
        state.shareOpen = false;
        renderShareModal();
      } else if (state.detailPlaceId) {
        state.detailPlaceId = null;
        renderDetailDrawer();
      } else if (state.guideOpen) {
        state.guideOpen = false;
        renderGuideDrawer();
      }
    } else if (
      ev.key === '/' &&
      !(document.activeElement instanceof HTMLInputElement) &&
      !(document.activeElement instanceof HTMLTextAreaElement)
    ) {
      ev.preventDefault();
      listPaneEl.querySelector<HTMLInputElement>('#place-search-input')?.focus();
    }
  });

  // Initial render + map init
  renderTopbar();
  renderFxDrawerBar();
  renderPaybackBar();
  renderMobileSwitch();
  renderMobileDock();
  renderMapLegend();
  mapController.init(dataset.meta.venue, state.lang);
  renderListPane(true, false);
  renderMobilePeekCard();
}

bootstrap();
