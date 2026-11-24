import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import dopagakiMarkUrl from '@/assets/dopagaki-mark.png';
import rawDataset from '@/data/prices.json';
import rawNaverFx from '@/data/naver-fx.json';
import type {
  AreaId,
  ComputedRow,
  GeoPoint,
  Lang,
  NaverFxSnapshot,
  PriceDataset,
  SortId,
  TraitFilterId
} from '@/types.ts';
import {
  buildRankedRows,
  computeSeoulAverage,
  formatKrw,
  isPointInSouthKorea
} from '@/lib/calc.ts';
import { getCopy } from '@/lib/i18n.ts';
import { icons } from '@/lib/icons.ts';
import {
  animateScoreRings,
  renderEffectBulletHtml,
  renderScoreGaugesHtml
} from '@/lib/score-rings.ts';
import { FluidToast, triggerHaptic } from '@/lib/fluid.ts';
import { createBrandDopamineBurst } from '@/components/dopamine-burst.ts';
import {
  TREATMENT_DOWNTIME,
  TREATMENT_EFFECTS,
  buildClinicUrl,
  detectAppBasePath,
  parseRoute,
  type RecommenderAnswers
} from '@/lib/clinic-helpers.ts';
import {
  TRAIT_FILTERS,
  matchesTraitFilters,
  normalizeTraitFilters,
  toggleTraitFilters
} from '@/data/brand-reviews.ts';
import { SvgIcon } from '@/components/SvgIcon.tsx';
import { ClinicPageView } from '@/components/ClinicPageView.tsx';
import { BrandGroupList } from '@/components/BrandGroupList.tsx';
import {
  DetailDrawerModal,
  GuideDrawerModal,
  RecommenderModal,
  ShareQrModal,
  formatCompactKrw
} from '@/components/Modals.tsx';
import BlurText from '@/components/BlurText.tsx';
import Magnet from '@/components/Magnet.tsx';
import { ShimmerButton } from '@/components/ui/shimmer-button.tsx';
import { BorderBeam } from '@/components/ui/border-beam.tsx';
import { BlurFade } from '@/components/ui/blur-fade.tsx';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background.tsx';
import { SlidingNumber } from '@/components/motion-primitives/sliding-number.tsx';
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger
} from '@/components/motion-primitives/disclosure.tsx';

const dataset = rawDataset as unknown as PriceDataset;
const TOTAL_CLINIC_COUNT = dataset.places.length;
const TOTAL_BRAND_COUNT = new Set(dataset.places.map((p) => p.brandJa)).size;
const initialNaverFx = rawNaverFx as unknown as NaverFxSnapshot;

const STORAGE_LANG_KEY = 'seoul_payback_lang';
const SESSION_LOC_KEY = 'dopagaki_user_loc_v1';
const APP_BASE_PATH = detectAppBasePath(window.location.pathname);

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

const VALID_SORTS: SortId[] = ['savings', 'rating', 'price', 'distance'];

function loadCachedUserLocation(): GeoPoint | null {
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
    // ignore
  }
  return null;
}

function saveCachedUserLocation(coords: GeoPoint): void {
  try {
    sessionStorage.setItem(SESSION_LOC_KEY, JSON.stringify(coords));
  } catch {
    // ignore
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

function buildHomeUrl(params: {
  lang: Lang;
  menuId: string;
  area: AreaId;
  sort: SortId;
  traitFilters: TraitFilterId[];
  includeVat: boolean;
  japaneseOnly: boolean;
  searchQuery: string;
}): string {
  const url = new URL(APP_BASE_PATH, window.location.origin);
  const p = new URLSearchParams();
  p.set('lang', params.lang);
  p.set('menu', params.menuId);
  if (params.area !== 'all') p.set('area', params.area);
  if (params.sort !== 'savings') p.set('sort', params.sort);
  if (params.traitFilters.length > 0) p.set('trait', params.traitFilters.join(','));
  if (!params.includeVat) p.set('vat', '0');
  if (params.japaneseOnly) p.set('jp', '1');
  if (params.searchQuery.trim()) p.set('q', params.searchQuery.trim());
  url.search = p.toString();
  return url.toString();
}

function MisregWord({ word }: { word: string }) {
  return (
    <span className="misreg" data-text={word} aria-label={word}>
      {Array.from(word).map((ch, idx) => (
        <span className="dopa-char" aria-hidden="true" key={`${ch}-${idx}`}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export function App() {
  const initialQuery = useMemo(() => parseHomeQuery(window.location.search), []);
  const initialRoute = useMemo(() => parseRoute(window.location.pathname, APP_BASE_PATH), []);
  const initialClinicParams = useMemo(() => new URLSearchParams(window.location.search), []);

  const [naverFx, setNaverFx] = useState<NaverFxSnapshot>(initialNaverFx);
  const [krwPer100Jpy, setKrwPer100Jpy] = useState<number>(
    initialNaverFx.krwPer100Jpy || dataset.meta.defaultKrwPer100Jpy
  );

  const [lang, setLang] = useState<Lang>(() => {
    if (initialQuery.langParam === 'ko' || initialQuery.langParam === 'ja') {
      return initialQuery.langParam;
    }
    try {
      return localStorage.getItem(STORAGE_LANG_KEY) === 'ko' ? 'ko' : 'ja';
    } catch {
      return 'ja';
    }
  });
  const [menuId, setMenuId] = useState<string>(initialQuery.menuId);
  const [area, setArea] = useState<AreaId>(initialQuery.area);
  const [sort, setSort] = useState<SortId>(initialQuery.sort);
  const [traitFilters, setTraitFilters] = useState<TraitFilterId[]>(initialQuery.traitFilters);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery.searchQuery);
  const [japaneseOnly, setJapaneseOnly] = useState<boolean>(initialQuery.japaneseOnly);
  const [includeVat, setIncludeVat] = useState<boolean>(initialQuery.includeVat);
  const [moreAreasOpen, setMoreAreasOpen] = useState<boolean>(
    EXTRA_AREA_IDS.includes(initialQuery.area)
  );
  const [searchOpen, setSearchOpen] = useState<boolean>(
    initialQuery.searchQuery.trim().length > 0
  );
  const [treatGuideOpen, setTreatGuideOpen] = useState<boolean>(false);

  const [detailPlaceId, setDetailPlaceId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [shareLang, setShareLang] = useState<Lang>(lang);
  const [recommenderOpen, setRecommenderOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'list' | 'guide' | 'share'>('list');

  const [userLocation, setUserLocation] = useState<GeoPoint | null>(() => loadCachedUserLocation());
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const locatingRef = useRef(false);

  const [activeClinicId, setActiveClinicId] = useState<string | null>(() => {
    if (initialRoute.view === 'clinic' && initialRoute.clinicId) {
      return dataset.places.some((p) => p.id === initialRoute.clinicId)
        ? initialRoute.clinicId
        : null;
    }
    return null;
  });
  const [clinicSelectedMenus, setClinicSelectedMenus] = useState<string[]>(() => {
    const raw = initialClinicParams.get('menus');
    return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [initialQuery.menuId];
  });
  const [clinicVisits, setClinicVisits] = useState<number>(() => {
    const n = Number(initialClinicParams.get('v') ?? '1');
    return Number.isFinite(n) && n >= 1 ? Math.min(6, Math.round(n)) : 1;
  });

  const [recAnswers, setRecAnswers] = useState<RecommenderAnswers>({
    concerns: [],
    schedule: null,
    preference: null,
    traitFilters: [],
    japaneseOnly: false
  });

  const brandBtnRef = useRef<HTMLButtonElement>(null);
  const rankRef = useRef<HTMLElement>(null);
  const treatGuideCardRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const traitScrollRef = useRef<HTMLDivElement>(null);
  const [traitFade, setTraitFade] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false
  });

  const toastElRef = useRef<HTMLDivElement>(null);
  const toastCtrlRef = useRef<FluidToast | null>(null);
  const savedHomeScrollYRef = useRef<number>(0);

  const dopamineCtrl = useMemo(
    () => createBrandDopamineBurst(() => brandBtnRef.current),
    []
  );

  const showToast = useCallback((message: string, isOk = false) => {
    if (!toastCtrlRef.current && toastElRef.current) {
      toastCtrlRef.current = new FluidToast(toastElRef.current);
    }
    toastCtrlRef.current?.show(
      `${isOk ? icons.check : icons.info}<span>${escapeHtml(message)}</span>`,
      isOk
    );
  }, []);

  useEffect(() => {
    if (toastElRef.current && !toastCtrlRef.current) {
      toastCtrlRef.current = new FluidToast(toastElRef.current);
    }
    const timer = window.setTimeout(() => {
      if (!activeClinicId) dopamineCtrl.fireOnce();
    }, 220);
    return () => {
      window.clearTimeout(timer);
      dopamineCtrl.destroy();
    };
  }, [dopamineCtrl]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.classList.toggle('is-clinic-view', Boolean(activeClinicId));
    if (activeClinicId) {
      const place = dataset.places.find((p) => p.id === activeClinicId);
      if (place) {
        document.title =
          lang === 'ja'
            ? `${place.nameJa} 料金・オーダーシート | ドパガキ美肌相場`
            : `${place.nameKo} 시세·오더시트 | 도파가키 피부시세`;
        return;
      }
    }
    document.title =
      lang === 'ja'
        ? `ドパガキ美肌相場 | ソウル美容皮膚科${TOTAL_CLINIC_COUNT}院 × 日本主要5院平均 3秒比較`
        : `도파가키 피부시세 | 서울 피부과 ${TOTAL_CLINIC_COUNT}곳 × 일본 5개 병원 평균 3초 비교`;
  }, [lang, activeClinicId]);

  const computeCurrentUrl = useCallback(
    (overrideLang?: Lang) => {
      const targetLang = overrideLang ?? lang;
      if (activeClinicId) {
        return buildClinicUrl(window.location.origin, APP_BASE_PATH, activeClinicId, {
          lang: targetLang,
          menuId,
          menus: clinicSelectedMenus,
          visits: clinicVisits,
          includeVat
        });
      }
      return buildHomeUrl({
        lang: targetLang,
        menuId,
        area,
        sort,
        traitFilters,
        includeVat,
        japaneseOnly,
        searchQuery
      });
    },
    [
      lang,
      activeClinicId,
      menuId,
      clinicSelectedMenus,
      clinicVisits,
      includeVat,
      area,
      sort,
      traitFilters,
      japaneseOnly,
      searchQuery
    ]
  );

  useEffect(() => {
    try {
      const nextUrl = computeCurrentUrl();
      window.history.replaceState(
        activeClinicId ? { view: 'clinic', clinicId: activeClinicId } : { view: 'home' },
        '',
        nextUrl
      );
    } catch {
      // ignore history restrictions
    }
  }, [computeCurrentUrl, activeClinicId]);

  const requestUserLocation = useCallback(
    (options: { silent?: boolean } = {}) => {
      const { silent = false } = options;
      if (locatingRef.current) return;
      const copy = getCopy(lang);
      if (!('geolocation' in navigator)) {
        if (!silent) showToast(copy.toastLocateUnsupported);
        return;
      }

      locatingRef.current = true;
      setLocatingUser(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          locatingRef.current = false;
          setLocatingUser(false);
          setUserLocation(coords);
          saveCachedUserLocation(coords);

          const inKorea = isPointInSouthKorea(coords);
          if (!silent) {
            const liveCopy = getCopy(lang);
            if (!inKorea) {
              showToast(
                lang === 'ja'
                  ? '現在海外にいるため距離を非表示にしています（韓国到着後に表示）'
                  : '현재 해외 위치라 거리를 숨겼어요 (한국 도착 후 자동 표시)'
              );
              return;
            }
            const allFromUser = buildRankedRows(
              dataset,
              menuId,
              'all',
              'distance',
              krwPer100Jpy,
              includeVat,
              { origin: coords }
            );
            const closest = allFromUser[0];
            if (closest && closest.distanceMeters <= 30000) {
              const clinicName = lang === 'ja' ? closest.place.nameJa : closest.place.nameKo;
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
          locatingRef.current = false;
          setLocatingUser(false);
          if (!silent) {
            const liveCopy = getCopy(lang);
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
    },
    [lang, menuId, krwPer100Jpy, includeVat, showToast]
  );

  useEffect(() => {
    let cancelled = false;
    const fxUrl = new URL(`${APP_BASE_PATH}naver-fx.json`, window.location.origin);
    fxUrl.searchParams.set('v', String(Date.now()));
    void fetch(fxUrl.toString(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((fresh: Partial<NaverFxSnapshot> | null) => {
        if (
          cancelled ||
          !fresh ||
          typeof fresh.krwPer100Jpy !== 'number' ||
          !Number.isFinite(fresh.krwPer100Jpy) ||
          fresh.krwPer100Jpy < 600 ||
          fresh.krwPer100Jpy > 1500
        ) {
          return;
        }
        setNaverFx((prev) => ({ ...prev, ...fresh }));
        setKrwPer100Jpy(fresh.krwPer100Jpy);
      })
      .catch(() => {
        // Keep bundled Naver FX snapshot
      });

    if (!userLocation && 'geolocation' in navigator) {
      requestUserLocation({ silent: true });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const parsed = parseHomeQuery(window.location.search);
      if (parsed.langParam === 'ja' || parsed.langParam === 'ko') {
        setLang(parsed.langParam);
      }
      setMenuId(parsed.menuId);
      setArea(parsed.area);
      setSort(parsed.sort);
      setTraitFilters(parsed.traitFilters);
      setIncludeVat(parsed.includeVat);
      setSearchQuery(parsed.searchQuery);
      setJapaneseOnly(parsed.japaneseOnly);
      setMoreAreasOpen(EXTRA_AREA_IDS.includes(parsed.area));
      setSearchOpen(parsed.searchQuery.trim().length > 0);

      const route = parseRoute(window.location.pathname, APP_BASE_PATH);
      if (route.view === 'clinic' && route.clinicId) {
        const sp = new URLSearchParams(window.location.search);
        const menusParam = sp.get('menus');
        const menus = menusParam
          ? menusParam.split(',').map((s) => s.trim()).filter(Boolean)
          : [parsed.menuId];
        const vParam = Number(sp.get('v') ?? '1');
        setClinicSelectedMenus(menus);
        setClinicVisits(Number.isFinite(vParam) && vParam >= 1 ? Math.min(6, Math.round(vParam)) : 1);
        setActiveClinicId(route.clinicId);
      } else {
        setActiveClinicId(null);
        setTreatGuideOpen(false);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (recommenderOpen) {
        setRecommenderOpen(false);
      } else if (detailPlaceId) {
        setDetailPlaceId(null);
      } else if (guideOpen) {
        setGuideOpen(false);
        setActiveTab('list');
      } else if (shareOpen) {
        setShareOpen(false);
        setActiveTab('list');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [recommenderOpen, detailPlaceId, guideOpen, shareOpen]);

  const navigateToClinic = (
    placeId: string,
    pushHistory: boolean,
    initialMenus?: string[],
    initialVisits = 1
  ) => {
    const place = dataset.places.find((p) => p.id === placeId);
    if (!place) return;
    if (!activeClinicId) {
      savedHomeScrollYRef.current = window.scrollY;
    }
    setDetailPlaceId(null);
    setGuideOpen(false);
    setShareOpen(false);
    setRecommenderOpen(false);

    const offeredIds = dataset.menus.filter((m) => Boolean(place.prices[m.id])).map((m) => m.id);
    const validInit = (initialMenus ?? []).filter((id) => offeredIds.includes(id));
    const fallbackMenu = offeredIds.includes(menuId) ? menuId : offeredIds[0];
    const nextMenus = validInit.length > 0 ? validInit : fallbackMenu ? [fallbackMenu] : [];
    const nextVisits = Math.max(1, Math.min(6, initialVisits));

    setClinicSelectedMenus(nextMenus);
    setClinicVisits(nextVisits);
    setActiveClinicId(place.id);

    if (pushHistory) {
      try {
        const nextUrl = buildClinicUrl(window.location.origin, APP_BASE_PATH, place.id, {
          lang,
          menuId,
          menus: nextMenus,
          visits: nextVisits,
          includeVat
        });
        window.history.pushState({ view: 'clinic', clinicId: place.id }, '', nextUrl);
      } catch {
        // ignore
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const navigateToHome = (pushHistory: boolean, targetScroll?: 'list') => {
    setActiveClinicId(null);
    setTreatGuideOpen(false);
    if (pushHistory) {
      try {
        const nextUrl = buildHomeUrl({
          lang,
          menuId,
          area,
          sort,
          traitFilters,
          includeVat,
          japaneseOnly,
          searchQuery
        });
        window.history.pushState({ view: 'home' }, '', nextUrl);
      } catch {
        // ignore
      }
    }
    requestAnimationFrame(() => {
      if (targetScroll === 'list') {
        rankRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: savedHomeScrollYRef.current, behavior: 'instant' as ScrollBehavior });
      }
    });
  };

  const switchLanguage = (nextLang: Lang) => {
    if (lang === nextLang) return;
    triggerHaptic(6);
    setLang(nextLang);
    setShareLang(nextLang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, nextLang);
    } catch {
      // ignore
    }
  };

  const goToDefaultHome = () => {
    triggerHaptic(6);
    setDetailPlaceId(null);
    setGuideOpen(false);
    setShareOpen(false);
    setRecommenderOpen(false);

    const wasClinic = Boolean(activeClinicId);
    const defaultMenu = dataset.menus[0].id;
    setMenuId(defaultMenu);
    setArea('all');
    setSort('savings');
    setTraitFilters([]);
    setSearchQuery('');
    setSearchOpen(false);
    setMoreAreasOpen(false);
    setJapaneseOnly(false);
    savedHomeScrollYRef.current = 0;
    setTreatGuideOpen(false);
    setActiveTab('list');

    if (wasClinic) {
      setActiveClinicId(null);
      try {
        const nextUrl = buildHomeUrl({
          lang,
          menuId: defaultMenu,
          area: 'all',
          sort: 'savings',
          traitFilters: [],
          includeVat,
          japaneseOnly: false,
          searchQuery: ''
        });
        window.history.pushState({ view: 'home' }, '', nextUrl);
      } catch {
        // ignore
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const copy = getCopy(lang);
  const isJa = lang === 'ja';
  const activeMenu = dataset.menus.find((m) => m.id === menuId) ?? dataset.menus[0];
  const bank = isJa ? naverFx.bankJa : naverFx.bankKo;
  const jpSource = isJa ? activeMenu.jpSourceName : activeMenu.jpSourceNameKo ?? activeMenu.jpSourceName;
  const fxSub = `${naverFx.dateLabel} ${bank}`;

  const allInMenu = useMemo(
    () =>
      buildRankedRows(dataset, menuId, 'all', sort, krwPer100Jpy, includeVat, {
        searchQuery,
        japaneseOnly,
        origin: userLocation,
        placeFilter:
          traitFilters.length === 0 ? undefined : (place) => matchesTraitFilters(place, traitFilters)
      }),
    [menuId, sort, krwPer100Jpy, includeVat, searchQuery, japaneseOnly, userLocation, traitFilters]
  );

  const countByArea = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of allInMenu) {
      map.set(r.place.area, (map.get(r.place.area) ?? 0) + 1);
    }
    return map;
  }, [allInMenu]);

  const rowsBeforeJpFilter = useMemo(
    () =>
      buildRankedRows(dataset, menuId, area, sort, krwPer100Jpy, includeVat, {
        searchQuery,
        japaneseOnly: false,
        origin: userLocation
      }),
    [menuId, area, sort, krwPer100Jpy, includeVat, searchQuery, userLocation]
  );

  const baseRowsForTraits = useMemo(
    () => (japaneseOnly ? rowsBeforeJpFilter.filter((r) => r.place.japaneseSupport) : rowsBeforeJpFilter),
    [rowsBeforeJpFilter, japaneseOnly]
  );

  const jpAvailableCount = useMemo(
    () =>
      (traitFilters.length === 0
        ? rowsBeforeJpFilter
        : rowsBeforeJpFilter.filter((r) => matchesTraitFilters(r.place, traitFilters))
      ).filter((r) => r.place.japaneseSupport).length,
    [rowsBeforeJpFilter, traitFilters]
  );

  const currentRows: ComputedRow[] = useMemo(
    () =>
      traitFilters.length === 0
        ? baseRowsForTraits
        : baseRowsForTraits.filter((r) => matchesTraitFilters(r.place, traitFilters)),
    [baseRowsForTraits, traitFilters]
  );

  const seoulAvg = useMemo(
    () => computeSeoulAverage(dataset.places, activeMenu, krwPer100Jpy, includeVat, dataset.meta.vatRate),
    [activeMenu, krwPer100Jpy, includeVat]
  );

  const inKoreaLoc = isPointInSouthKorea(userLocation);
  const hasForeignLoc = Boolean(userLocation && !inKoreaLoc);
  const isExtraActive = EXTRA_AREA_IDS.includes(area);

  const activeClinicPlace = useMemo(
    () => (activeClinicId ? dataset.places.find((p) => p.id === activeClinicId) ?? null : null),
    [activeClinicId]
  );

  const detailRow = useMemo(() => {
    if (!detailPlaceId) return null;
    return currentRows.find((r) => r.place.id === detailPlaceId) ?? null;
  }, [detailPlaceId, currentRows]);

  const activeTreatEffect = TREATMENT_EFFECTS[activeMenu.id];
  const activeTreatDowntime = TREATMENT_DOWNTIME[activeMenu.id];

  useEffect(() => {
    if (!treatGuideOpen || !treatGuideCardRef.current) return;
    const timer = window.setTimeout(() => {
      if (treatGuideCardRef.current) {
        animateScoreRings(treatGuideCardRef.current);
      }
    }, 20);
    return () => window.clearTimeout(timer);
  }, [treatGuideOpen, activeMenu.id, lang]);

  const syncTraitScrollFades = useCallback(() => {
    const el = traitScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setTraitFade({
      left: el.scrollLeft > 4,
      right: maxScroll > 6 && el.scrollLeft < maxScroll - 4
    });
  }, []);

  useEffect(() => {
    syncTraitScrollFades();
    window.addEventListener('resize', syncTraitScrollFades);
    return () => window.removeEventListener('resize', syncTraitScrollFades);
  }, [syncTraitScrollFades, lang, currentRows.length]);

  const seoulAvgPrefix = isJa
    ? `ソウル${seoulAvg.sampleCount}院平均 `
    : `서울 ${seoulAvg.sampleCount}곳 평균 `;
  const seoulAvgSuffix = isJa
    ? ` (${formatKrw(seoulAvg.avgTotalKrw)} · ${includeVat ? '税込10%' : '税別'})`
    : ` (${formatCompactKrw(seoulAvg.avgTotalKrw, 'ko')} · ${includeVat ? '부가세 10% 포함' : '부가세 별도'})`;

  return (
    <MotionConfig reducedMotion="user" transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.22 }}>
      <header className="sitehead" id="sitehead">
        <div className="shrow">
          <button
            ref={brandBtnRef}
            type="button"
            className="shleft shleft-btn"
            id="brand-home-btn"
            onClick={() => {
              goToDefaultHome();
              dopamineCtrl.fire();
            }}
          >
            <img
              className="brand-emblem"
              src={dopagakiMarkUrl}
              width={48}
              height={48}
              alt=""
              fetchPriority="high"
            />
            <div className="brand-stack">
              <span className="logo-word" id="brand-word" data-lang={lang}>
                <MisregWord word={isJa ? 'ドパガキ' : '도파가키'} />{' '}
                <BlurText
                  as="span"
                  key={`bt-${lang}`}
                  text={isJa ? '美肌相場' : '피부시세'}
                  trigger="load"
                  animateBy="words"
                  delay={30}
                  stepDuration={0.18}
                  blur={4}
                  distance={6}
                />
              </span>
              <span className="brand-meta" id="brand-meta">
                {isJa
                  ? `ソウル${TOTAL_BRAND_COUNT}ブランド ${TOTAL_CLINIC_COUNT}院 公式料金`
                  : `서울 ${TOTAL_BRAND_COUNT}개 브랜드 ${TOTAL_CLINIC_COUNT}곳 공식가`}
              </span>
            </div>
          </button>

          <div className="shright">
            <Magnet padding={44} magnetStrength={5} maxOffset={5}>
              <button
                type="button"
                className="sh-btn"
                id="head-share-btn"
                onClick={() => {
                  triggerHaptic(6);
                  setShareLang(lang);
                  setShareOpen(true);
                }}
              >
                <SvgIcon name="share" />
                <span id="head-share-label">{copy.shareBtn}</span>
              </button>
            </Magnet>

            <div className="lang-switch has-mp-bg" id="head-lang-switch" role="group" aria-label="Language">
              <AnimatedBackground
                value={lang}
                onValueChange={(nextId) => {
                  if (nextId === 'ja' || nextId === 'ko') {
                    switchLanguage(nextId);
                  }
                }}
                className="mp-ink-pill"
                transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              >
                <button
                  type="button"
                  data-id="ja"
                  className="lang-btn"
                  data-lang="ja"
                  aria-pressed={lang === 'ja'}
                >
                  日本語
                </button>
                <button
                  type="button"
                  data-id="ko"
                  className="lang-btn"
                  data-lang="ko"
                  aria-pressed={lang === 'ko'}
                >
                  한국어
                </button>
              </AnimatedBackground>
            </div>
          </div>
        </div>
      </header>

      <main className="screen" id="screen">
        {!activeClinicPlace ? (
          <div className="home-view" id="home-view">
            <BlurFade delay={0} duration={0.22} offset={5} blur="3px">
              <section
                className="ticker-grid"
                id="ticker"
                aria-label="Exchange Rate and Benchmark"
              >
                <a
                  className="ticker-cell ticker-cell--fx"
                  href={naverFx.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="ticker-kicker">
                    {copy.naverFxLabel} <SvgIcon name="external" />
                  </span>
                  <strong className="ticker-value num inline-flex items-baseline whitespace-nowrap">
                    <span>100¥ = ₩</span>
                    <SlidingNumber
                      value={krwPer100Jpy}
                      decimalPlaces={Number.isInteger(krwPer100Jpy) ? 0 : 2}
                    />
                  </strong>
                  <span className="ticker-sub num">{fxSub}</span>
                </a>

                <button
                  type="button"
                  className="ticker-cell ticker-cell--jp"
                  id="open-jp-avg-btn"
                  onClick={() => {
                    triggerHaptic(6);
                    setGuideOpen(true);
                  }}
                >
                  <span className="ticker-kicker">
                    {copy.jpBenchmarkLabel} <SvgIcon name="info" />
                  </span>
                  <strong className="ticker-value num inline-flex items-baseline whitespace-nowrap" id="ticker-jp-val">
                    <span>¥</span>
                    <SlidingNumber value={activeMenu.jpBenchmarkJpy} useGrouping />
                  </strong>
                  <span className="ticker-sub">{jpSource}</span>
                </button>

                <div className="ticker-cell ticker-cell--vat grained">
                  <span className="ticker-kicker">2026 VAT</span>
                  <div className="ticker-vat-row">
                    <span className="ticker-vat-text">{copy.vatNoticeTitle}</span>
                    <ShimmerButton
                      id="open-guide-btn"
                      shimmerColor="#ffffff"
                      shimmerSize="0.07em"
                      shimmerDuration="2.8s"
                      borderRadius="2px"
                      background="var(--color-accent)"
                      className="shimmer-btn ticker-vat-btn border-[1.5px] border-solid border-[var(--color-accent)] text-[var(--color-accent-ink)] px-3 py-0 shadow-none"
                      onClick={() => {
                        triggerHaptic(6);
                        setGuideOpen(true);
                      }}
                    >
                      {copy.vatNoticeBtn}
                    </ShimmerButton>
                  </div>
                </div>
              </section>
            </BlurFade>

            <BlurFade delay={0.045} duration={0.22} offset={5} blur="3px">
              <section
                className="board-controls"
                id="controls"
                aria-label="Treatment and District"
              >
                <div className="ctrl-assist-bar">
                  <span className="ctrl-assist-hint" id="ctrl-assist-hint">
                    {isJa ? 'どの施術がいいか迷ったら？' : '어떤 시술이 맞을지 모르겠다면?'}
                  </span>
                  <Magnet padding={36} magnetStrength={6} maxOffset={4} wrapperClassName="max-sm:w-full" innerClassName="max-sm:w-full">
                    <ShimmerButton
                      id="open-recommender-btn"
                      shimmerColor="#ffffff"
                      shimmerSize="0.07em"
                      shimmerDuration="2.6s"
                      borderRadius="2px"
                      background="var(--color-accent)"
                      className="shimmer-btn ctrl-assist-btn border-[1.5px] border-solid border-[var(--color-ink)] text-[var(--color-accent-ink)] px-3 py-0 shadow-none"
                      onClick={() => {
                        triggerHaptic(6);
                        if (
                          recAnswers.concerns.length === 0 &&
                          recAnswers.schedule === null &&
                          recAnswers.preference === null
                        ) {
                          setRecAnswers({
                            ...recAnswers,
                            traitFilters: [...traitFilters],
                            japaneseOnly
                          });
                        }
                        setRecommenderOpen(true);
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <SvgIcon name="spark" />
                        <span id="open-recommender-label">
                          {isJa ? 'お悩みから施術を探す →' : '내 고민으로 시술 추천 받기 →'}
                        </span>
                      </span>
                    </ShimmerButton>
                  </Magnet>
                </div>

                <div className="treat-grid has-mp-bg" id="treat-grid" role="group" aria-label="Treatment">
                  <AnimatedBackground
                    value={menuId}
                    onValueChange={(nextMenu) => {
                      if (nextMenu && nextMenu !== menuId) {
                        triggerHaptic(6);
                        setMenuId(nextMenu);
                      }
                    }}
                    className="mp-accent-pill"
                    transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                  >
                    {dataset.menus.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        data-id={m.id}
                        className="treat-cell"
                        data-menu={m.id}
                        aria-pressed={m.id === activeMenu.id}
                      >
                        <span className="treat-label">{isJa ? m.shortJa : m.shortKo}</span>
                      </button>
                    ))}
                  </AnimatedBackground>
                </div>

                <div className="area-grid has-mp-bg" id="area-grid" role="group" aria-label="Seoul District">
                  <AnimatedBackground
                    value={isExtraActive ? 'more' : area}
                    onValueChange={(nextId) => {
                      if (!nextId || nextId === 'more') return;
                      triggerHaptic(6);
                      setArea(nextId as AreaId);
                      setMoreAreasOpen(false);
                    }}
                    className="mp-ink-pill"
                    transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                  >
                    <button
                      type="button"
                      data-id="all"
                      className="area-cell"
                      id="area-all-btn"
                      data-area="all"
                      aria-pressed={area === 'all'}
                    >
                      {isJa ? '全体' : '전체'}
                    </button>
                    {PRIMARY_AREAS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        data-id={a.id}
                        className="area-cell"
                        data-area={a.id}
                        aria-pressed={area === a.id}
                      >
                        {isJa ? a.ja : a.ko}
                      </button>
                    ))}
                    <button
                      type="button"
                      data-id="more"
                      className="area-cell"
                      id="toggle-more-areas"
                      aria-expanded={moreAreasOpen}
                      aria-pressed={isExtraActive}
                      onClick={() => {
                        triggerHaptic(6);
                        setMoreAreasOpen((prev) => !prev);
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <span id="extra-area-label">
                          {isExtraActive
                            ? isJa
                              ? EXTRA_SHORT[area].ja
                              : EXTRA_SHORT[area].ko
                            : isJa
                              ? 'その他'
                              : '그 외'}
                        </span>
                        <span className="area-cell-caret" aria-hidden="true">
                          <SvgIcon name="chevronDown" />
                        </span>
                      </span>
                    </button>
                  </AnimatedBackground>
                </div>

                <div
                  className={`collapse-wrap ${moreAreasOpen ? 'is-open' : ''}`}
                  id="more-areas-collapse"
                  {...(!moreAreasOpen ? { inert: true } : {})}
                >
                  <div className="collapse-inner">
                    <div className="more-areas-wrap">
                      <div className="more-areas-content" id="more-areas-content">
                        {EXTRA_AREA_IDS.map((id) => (
                          <button
                            key={id}
                            type="button"
                            className="more-area-btn"
                            data-area={id}
                            aria-pressed={area === id}
                            onClick={() => {
                              triggerHaptic(6);
                              setArea(id);
                            }}
                          >
                            <span>{isJa ? EXTRA_SHORT[id].ja : EXTRA_SHORT[id].ko}</span>
                            <span className="more-area-count num">{countByArea.get(id) ?? 0}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </BlurFade>

            {activeTreatEffect && (
              <BlurFade delay={0.075} duration={0.22} offset={4} blur="3px">
                <section
                  ref={treatGuideCardRef}
                  className="treat-guide-card"
                  id="treat-guide-card"
                  data-open={treatGuideOpen ? 'true' : 'false'}
                  aria-label="Treatment Effects"
                >
                  <BorderBeam
                    size={90}
                    duration={8}
                    borderWidth={2}
                    colorFrom="var(--color-accent)"
                    colorTo="var(--color-ink)"
                  />
                  <Disclosure
                    open={treatGuideOpen}
                    onOpenChange={(next) => {
                      triggerHaptic(6);
                      setTreatGuideOpen(next);
                    }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="treat-guide-head">
                      <div className="treat-guide-head-main">
                        <span className="tg treat-guide-kicker">
                          {isJa ? activeMenu.shortJa : activeMenu.shortKo}
                        </span>
                        <strong className="treat-guide-title">
                          {isJa ? activeTreatEffect.headlineJa : activeTreatEffect.headlineKo}
                        </strong>
                        {activeTreatDowntime && (
                          <span className="tg tg-jp">
                            {isJa ? activeTreatDowntime.badgeJa : activeTreatDowntime.badgeKo}
                          </span>
                        )}
                      </div>
                      <DisclosureTrigger>
                        <button
                          type="button"
                          className="treat-guide-toggle"
                          id="toggle-treat-guide"
                          aria-expanded={treatGuideOpen}
                          aria-controls="treat-guide-body"
                        >
                          <span>
                            {treatGuideOpen
                              ? isJa
                                ? '閉じる'
                                : '접기'
                              : isJa
                                ? '効果を詳しく見る'
                                : '효과 자세히'}
                          </span>
                          <SvgIcon name="chevronDown" />
                        </button>
                      </DisclosureTrigger>
                    </div>

                    <DisclosureContent id="treat-guide-body">
                      <div className="treat-guide-body">
                        <div className="treat-guide-top">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: renderScoreGaugesHtml(activeTreatEffect, isJa, 'md')
                            }}
                          />
                          <p className="treat-guide-mech">
                            {isJa
                              ? activeTreatEffect.mechanismJa
                              : activeTreatEffect.mechanismKo}
                          </p>
                        </div>
                        <div className="treat-guide-grid">
                          <div className="treat-guide-col">
                            <div className="treat-guide-sub">
                              {isJa ? '主な効果' : '나타날 수 있는 주요 효과'}
                            </div>
                            <ul
                              className="treat-guide-list"
                              dangerouslySetInnerHTML={{
                                __html: (isJa
                                  ? activeTreatEffect.effectsJa
                                  : activeTreatEffect.effectsKo
                                )
                                  .map((line) => renderEffectBulletHtml(line))
                                  .join('')
                              }}
                            />
                          </div>
                          <div className="treat-guide-col treat-guide-facts">
                            <div className="treat-guide-fact-card">
                              <span className="treat-guide-fact-k">
                                <SvgIcon name="spark" />
                                <span>{isJa ? 'おすすめの方' : '추천 대상'}</span>
                              </span>
                              <span className="treat-guide-fact-v">
                                {isJa
                                  ? activeTreatEffect.bestForJa
                                  : activeTreatEffect.bestForKo}
                              </span>
                            </div>
                            <div className="treat-guide-fact-card">
                              <span className="treat-guide-fact-k">
                                <SvgIcon name="clock" />
                                <span>{isJa ? '効果・持続' : '효과 느낌 · 유지 기간'}</span>
                              </span>
                              <span className="treat-guide-fact-v">
                                {isJa ? activeTreatEffect.timingJa : activeTreatEffect.timingKo}
                              </span>
                            </div>
                            <div className="treat-guide-fact-card is-note">
                              <span className="treat-guide-fact-k">
                                <SvgIcon name="info" />
                                <span>{isJa ? '回復・注意点' : '시술 후 회복 · 주의할 점'}</span>
                              </span>
                              <span className="treat-guide-fact-v">
                                {isJa ? activeTreatEffect.noteJa : activeTreatEffect.noteKo}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DisclosureContent>
                  </Disclosure>
                </section>
              </BlurFade>
            )}

            <BlurFade delay={0.1} duration={0.22} offset={4} blur="3px">
              <section
                className="rank"
                id="rank"
                ref={rankRef}
                aria-label="Clinic Price Ledger"
              >
                <div className="rankhead" id="rankhead">
                  <div className="rankhead-left">
                    <button
                      type="button"
                      className="jp-toggle-btn"
                      id="jp-only-btn"
                      aria-pressed={japaneseOnly}
                      onClick={() => {
                        triggerHaptic(6);
                        setJapaneseOnly((prev) => !prev);
                      }}
                    >
                      <span className="jp-toggle-code">JP</span>
                      <span id="jp-only-label">
                        {isJa ? '日本語OKのみ' : '일본어 가능만'}
                      </span>
                      <span className="jp-toggle-cnt num" id="jp-only-cnt">
                        {jpAvailableCount}
                      </span>
                    </button>

                    <label className="chk-label" id="vat-chk-wrap">
                      <input
                        type="checkbox"
                        id="vat-chk"
                        checked={includeVat}
                        onChange={(e) => {
                          triggerHaptic(6);
                          setIncludeVat(e.target.checked);
                        }}
                      />
                      <span id="vat-chk-label">{isJa ? '税込+10%' : '세금+10%'}</span>
                    </label>

                    <button
                      type="button"
                      className="search-toggle-btn"
                      id="search-toggle-btn"
                      aria-expanded={searchOpen}
                      onClick={() => {
                        triggerHaptic(6);
                        setSearchOpen((prev) => {
                          const next = !prev;
                          if (next) {
                            window.setTimeout(() => searchInputRef.current?.focus(), 60);
                          }
                          return next;
                        });
                      }}
                    >
                      <SvgIcon name="search" />
                      <span id="search-toggle-label">
                        {searchQuery.trim() ? searchQuery.trim() : isJa ? '検索' : '검색'}
                      </span>
                    </button>
                  </div>

                  <div className="rankhead-right">
                    <div className="sorts has-mp-bg" id="sorts-switch" role="group" aria-label="Sort">
                      <AnimatedBackground
                        value={sort === 'price' ? 'savings' : sort}
                        onValueChange={(nextSort) => {
                          if (nextSort !== 'savings' && nextSort !== 'rating' && nextSort !== 'distance') {
                            return;
                          }
                          if (sort !== nextSort) {
                            triggerHaptic(6);
                            setSort(nextSort);
                          }
                          if (nextSort === 'distance') {
                            if (!userLocation) {
                              requestUserLocation({ silent: false });
                            } else if (!isPointInSouthKorea(userLocation)) {
                              showToast(
                                isJa
                                  ? '現在海外にいるため距離を非表示にしています（韓国到着後に表示）'
                                  : '현재 해외 위치라 거리를 숨겼어요 (한국 도착 후 자동 표시)'
                              );
                            }
                          }
                        }}
                        className="mp-ink-pill"
                        transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                      >
                        <button
                          type="button"
                          data-id="savings"
                          className="sort-btn"
                          data-sort="savings"
                          aria-pressed={sort !== 'distance' && sort !== 'rating'}
                        >
                          {isJa ? 'おトク順' : '절약순'}
                        </button>
                        <button
                          type="button"
                          data-id="rating"
                          className="sort-btn"
                          data-sort="rating"
                          aria-pressed={sort === 'rating'}
                        >
                          {isJa ? 'AI評価順' : 'AI평점순'}
                        </button>
                        <button
                          type="button"
                          data-id="distance"
                          className="sort-btn"
                          data-sort="distance"
                          aria-pressed={sort === 'distance'}
                        >
                          {isJa ? '近い順' : '거리순'}
                        </button>
                      </AnimatedBackground>
                    </div>
                  </div>
                </div>

                <div
                  className="trait-filter-bar"
                  id="trait-filter-bar"
                  role="group"
                  aria-label={isJa ? 'クリニック特徴フィルター' : '병원 특성 필터'}
                >
                  <span
                    className={`trait-filter-kicker${traitFilters.length > 0 ? ' is-active' : ''}`}
                    id="trait-filter-kicker"
                  >
                    {traitFilters.length > 0
                      ? isJa
                        ? `特徴·${traitFilters.length}`
                        : `특성·${traitFilters.length}`
                      : isJa
                        ? '特徴(複数可)'
                        : '특성(복수)'}
                  </span>
                  <div
                    className={`trait-filter-viewport${traitFade.left ? ' has-left-fade' : ''}${traitFade.right ? ' has-right-fade' : ''}`}
                  >
                    <div
                      className="trait-filter-scroll"
                      id="trait-filter-scroll"
                      ref={traitScrollRef}
                      onScroll={syncTraitScrollFades}
                    >
                      {TRAIT_FILTERS.map((tf) => {
                        const isAll = tf.id === 'all';
                        const pressed = isAll
                          ? traitFilters.length === 0
                          : traitFilters.includes(tf.id);
                        const count = isAll
                          ? baseRowsForTraits.length
                          : baseRowsForTraits.filter((r) =>
                              matchesTraitFilters(
                                r.place,
                                pressed ? traitFilters : [...traitFilters, tf.id]
                              )
                            ).length;
                        return (
                          <button
                            key={tf.id}
                            type="button"
                            className="trait-filter-btn"
                            data-trait-filter={tf.id}
                            aria-pressed={pressed}
                            disabled={!isAll && count === 0 && !pressed}
                            onClick={() => {
                              triggerHaptic(6);
                              setTraitFilters((prev) => toggleTraitFilters(prev, tf.id));
                            }}
                          >
                            {tf.icon && <SvgIcon name={tf.icon} />}
                            <span>{isJa ? tf.labelJa : tf.labelKo}</span>
                            <span className="trait-filter-cnt num">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="seoul-avg-bar num" id="seoul-avg-bar">
                  <span className="inline-flex flex-wrap items-baseline gap-1">
                    <span>{seoulAvgPrefix}</span>
                    <strong className="font-bold text-[var(--color-ink)] inline-flex items-baseline">
                      ¥<SlidingNumber value={seoulAvg.avgTotalJpy} useGrouping />
                    </strong>
                    <span>{seoulAvgSuffix}</span>
                  </span>
                  <button
                    type="button"
                    className={`loc-chip-btn ${inKoreaLoc ? 'is-active' : ''}`}
                    id="rank-locate-btn"
                    disabled={locatingUser}
                    onClick={() => {
                      triggerHaptic(6);
                      requestUserLocation({ silent: false });
                    }}
                  >
                    <SvgIcon name="locate" />
                    <span>
                      {locatingUser
                        ? isJa
                          ? '現在地を確認中…'
                          : '현재 위치 확인 중…'
                        : inKoreaLoc
                          ? isJa
                            ? '現在地から表示中'
                            : '현재 위치 기준'
                          : hasForeignLoc
                            ? isJa
                              ? '韓国到着後に距離表示'
                              : '한국 도착 후 거리 표시'
                            : isJa
                              ? '現在地から距離を見る'
                              : '현재 위치로 거리 보기'}
                    </span>
                  </button>
                </div>

                <div
                  className={`collapse-wrap ${searchOpen ? 'is-open' : ''}`}
                  id="search-collapse"
                  {...(!searchOpen ? { inert: true } : {})}
                >
                  <div className="collapse-inner">
                    <div className="search-strip" id="search-strip">
                      <div className="search-box">
                        <span className="search-icon">
                          <SvgIcon name="search" />
                        </span>
                        <input
                          ref={searchInputRef}
                          type="search"
                          enterKeyHint="search"
                          autoCapitalize="none"
                          autoCorrect="off"
                          className="search-input"
                          id="place-search-input"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={copy.searchPlaceholder}
                          aria-label={copy.searchPlaceholder}
                        />
                        <button
                          type="button"
                          className="search-clear"
                          id="search-clear-btn"
                          aria-label={copy.searchClear}
                          hidden={!searchQuery}
                          onClick={() => {
                            triggerHaptic(6);
                            setSearchQuery('');
                            searchInputRef.current?.focus();
                          }}
                        >
                          <SvgIcon name="close" />
                        </button>
                      </div>
                      <span className="search-count num" id="search-count">
                        {copy.resultsCount(currentRows.length)}
                      </span>
                    </div>
                  </div>
                </div>

                <div id="rows-container">
                  {currentRows.length === 0 ? (
                    <div className="empty-state">
                      <h3>{copy.emptyListTitle}</h3>
                      <p>{copy.emptyListBody}</p>
                      <button
                        type="button"
                        className="reset-btn"
                        id="reset-filters-btn"
                        onClick={() => {
                          triggerHaptic(6);
                          setArea('all');
                          setTraitFilters([]);
                          setSearchQuery('');
                          setJapaneseOnly(false);
                          setMoreAreasOpen(false);
                        }}
                      >
                        {copy.resetAreaBtn}
                      </button>
                    </div>
                  ) : (
                    <BrandGroupList
                      rows={currentRows}
                      lang={lang}
                      inKoreaLoc={inKoreaLoc}
                      jpSupportLabel={copy.jpSupportTag}
                      onHaptic={() => triggerHaptic(6)}
                      onOpenClinic={(placeId) => navigateToClinic(placeId, true)}
                    />
                  )}
                </div>
              </section>
            </BlurFade>
          </div>
        ) : (
          <div className="clinic-view" id="clinic-view">
            <ClinicPageView
              place={activeClinicPlace}
              dataset={dataset}
              naverFx={naverFx}
              lang={lang}
              includeVat={includeVat}
              krwPer100Jpy={krwPer100Jpy}
              selectedMenus={clinicSelectedMenus}
              visits={clinicVisits}
              userLocation={userLocation}
              locatingUser={locatingUser}
              onChangeSelectedMenus={setClinicSelectedMenus}
              onChangeVisits={setClinicVisits}
              onToggleVat={(next) => setIncludeVat(next)}
              onBack={() => navigateToHome(true)}
              onSelectClinic={(cid) => navigateToClinic(cid, true)}
              onOpenShare={() => {
                setShareLang(lang);
                setShareOpen(true);
              }}
              onShowToast={showToast}
              onRequestLocation={() => requestUserLocation({ silent: false })}
            />
          </div>
        )}
      </main>

      <footer className="sitefoot" id="sitefoot">
        <div className="sitefoot-inner">
          <nav className="sitefoot-nav" aria-label="Footer">
            <button
              type="button"
              className="sitefoot-link"
              onClick={() => {
                triggerHaptic(6);
                setGuideOpen(true);
              }}
            >
              {isJa ? '2026 豆知識' : '2026 꿀팁'}
            </button>
            <button
              type="button"
              className="sitefoot-link"
              onClick={() => {
                triggerHaptic(6);
                setShareLang(lang);
                setShareOpen(true);
              }}
            >
              {isJa ? '共有 QR' : '공유 QR'}
            </button>
            <a
              className="sitefoot-link"
              href={naverFx.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {isJa ? 'NAVER為替' : '네이버 환율'}
            </a>
            <button
              type="button"
              className="sitefoot-link"
              onClick={() => switchLanguage(lang === 'ja' ? 'ko' : 'ja')}
            >
              {isJa ? '한국어版' : '日本語版'}
            </button>
          </nav>
          <ul>
            {(isJa
              ? [
                  `ソウル主要${TOTAL_BRAND_COUNT}ブランド${TOTAL_CLINIC_COUNT}院の美容皮膚科公式サイト公開価格のみを集めています。`,
                  '日本側の比較基準は主要5院の税込公式料金の平均値（上部の日本5院平均相場カードから内訳を確認可）です。',
                  `円換算はNAVER金融（${bank} ${naverFx.dateLabel} 売買基準レート 100円=₩${naverFx.krwPer100Jpy.toFixed(2).replace(/\.?0+$/, '')}）を毎日自動反映し、2026年免税終了後の韓国税金10%を加算比較しています。`
                ]
              : [
                  `공식 홈페이지에 가격표를 공개하는 서울 주요 ${TOTAL_BRAND_COUNT}개 피부과 브랜드 ${TOTAL_CLINIC_COUNT}곳의 공개가만 모았습니다.`,
                  '일본 비교 기준가는 일본 주요 5개 대형 병원의 세금포함 공식가 평균이며, 상단 평균 카드에서 병원별 산출 내역을 바로 볼 수 있습니다.',
                  `엔화 환산은 네이버 금융(${bank} ${naverFx.dateLabel} 매매기준율 100엔=₩${naverFx.krwPer100Jpy.toFixed(2).replace(/\.?0+$/, '')})을 매일 자동 반영하고, 2026년 세금 환급 종료 기준 부가세 10%를 합산해 비교합니다.`
                ]
            ).map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="sitefoot-checked">{copy.provenanceChecked(dataset.meta.checkedDate)}</p>
        </div>
      </footer>

      <nav className="apptab" id="apptab" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`apptab-btn ${activeTab === 'list' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic(6);
            setActiveTab('list');
            if (activeClinicId) {
              navigateToHome(true, 'list');
            } else {
              rankRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          <SvgIcon name="list" />
          <span className="apptab-lbl">{isJa ? 'ランキング' : '순위'}</span>
        </button>
        <button
          type="button"
          className={`apptab-btn ${activeTab === 'guide' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic(6);
            setActiveTab('guide');
            setGuideOpen(true);
          }}
        >
          <SvgIcon name="info" />
          <span className="apptab-lbl">{isJa ? '豆知識' : '꿀팁'}</span>
        </button>
        <button
          type="button"
          className={`apptab-btn ${activeTab === 'share' ? 'is-active' : ''}`}
          onClick={() => {
            triggerHaptic(6);
            setActiveTab('share');
            setShareLang(lang);
            setShareOpen(true);
          }}
        >
          <SvgIcon name="share" />
          <span className="apptab-lbl">{isJa ? '共有' : '공유'}</span>
        </button>
      </nav>

      <div
        ref={toastElRef}
        className="toast"
        id="toast"
        role="status"
        aria-live="polite"
        aria-hidden="true"
      />

      <DetailDrawerModal
        open={Boolean(detailPlaceId && detailRow)}
        row={detailRow}
        allPlaces={dataset.places}
        lang={lang}
        naverFx={naverFx}
        krwPer100Jpy={krwPer100Jpy}
        userLocation={userLocation}
        onClose={() => setDetailPlaceId(null)}
        onOpenJpAvg={() => {
          setDetailPlaceId(null);
          setGuideOpen(true);
        }}
      />

      <GuideDrawerModal
        open={guideOpen}
        lang={lang}
        activeMenu={activeMenu}
        onClose={() => {
          setGuideOpen(false);
          setActiveTab('list');
        }}
      />

      <ShareQrModal
        open={shareOpen}
        lang={lang}
        shareLang={shareLang}
        shareUrl={computeCurrentUrl(shareLang)}
        onChangeShareLang={setShareLang}
        onClose={() => {
          setShareOpen(false);
          setActiveTab('list');
        }}
        onCopied={(msg) => showToast(msg, true)}
      />

      <RecommenderModal
        open={recommenderOpen}
        lang={lang}
        includeVat={includeVat}
        krwPer100Jpy={krwPer100Jpy}
        dataset={dataset}
        answers={recAnswers}
        onChangeAnswers={setRecAnswers}
        onResetAnswers={() =>
          setRecAnswers({
            concerns: [],
            schedule: null,
            preference: null,
            traitFilters: [],
            japaneseOnly: false
          })
        }
        onApplyMenu={(selectedMenuId) => {
          triggerHaptic(10);
          setMenuId(selectedMenuId);
          setTraitFilters([...recAnswers.traitFilters]);
          setJapaneseOnly(recAnswers.japaneseOnly);
          setRecommenderOpen(false);
          const picked = dataset.menus.find((m) => m.id === selectedMenuId);
          const mLabel = picked ? (isJa ? picked.shortJa : picked.shortKo) : '';
          showToast(
            isJa
              ? `おすすめ「${mLabel}」と希望条件を一覧に反映しました`
              : `추천 시술 '${mLabel}'과 선택한 병원 조건을 바로 적용했어요`,
            true
          );
        }}
        onOpenClinic={(pid, menus) => {
          triggerHaptic(10);
          if (menus[0]) setMenuId(menus[0]);
          setTraitFilters([...recAnswers.traitFilters]);
          setJapaneseOnly(recAnswers.japaneseOnly);
          setRecommenderOpen(false);
          navigateToClinic(pid, true, menus, 1);
        }}
        onClose={() => setRecommenderOpen(false)}
      />
    </MotionConfig>
  );
}

export default App;
