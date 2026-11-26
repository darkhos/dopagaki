import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MotionConfig } from 'motion/react';
import { Toaster, toast } from 'sonner';
import 'sonner/dist/styles.css';
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
  isPointInSouthKorea
} from '@/lib/calc.ts';
import { getCopy } from '@/lib/i18n.ts';
import { triggerHaptic } from '@/lib/fluid.ts';
import { createBrandDopamineBurst } from '@/components/dopamine-burst.ts';
import {
  buildClinicUrl,
  detectAppBasePath,
  loadSavedClinicIds,
  parseRoute,
  saveClinicIds,
  toggleSavedClinicId
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
import { TreatmentInfoView } from '@/components/TreatmentInfoView.tsx';
import { ConciergeView } from '@/components/ConciergeView.tsx';
import { SavedClinicsView } from '@/components/SavedClinicsView.tsx';
import { BargainEmoji, MenuEmoji, PhoneEmoji } from '@/components/emoji.tsx';
import QRCode from 'qrcode';
import { analyticsEnabled, track } from '@/lib/analytics.ts';
import { FilterSheet, countActiveFilters, type FilterChip } from '@/components/FilterSheet.tsx';
import {
  DetailDrawerModal,
  GuideDrawerModal,
  ShareQrModal
} from '@/components/Modals.tsx';
import Magnet from '@/components/Magnet.tsx';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background.tsx';

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
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [asideQr, setAsideQr] = useState<string | null>(null);

  const [detailPlaceId, setDetailPlaceId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [shareLang, setShareLang] = useState<Lang>(lang);
  const [activeTab, setActiveTab] = useState<'list' | 'info' | 'recommend' | 'saved'>('list');
  const [infoMenuId, setInfoMenuId] = useState<string>(initialQuery.menuId);
  const lastMainTabRef = useRef<'list' | 'info' | 'recommend' | 'saved'>('list');
  const [savedClinicIds, setSavedClinicIds] = useState<string[]>(() => loadSavedClinicIds());

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


  const brandBtnRef = useRef<HTMLButtonElement>(null);
  const rankRef = useRef<HTMLElement>(null);

  const savedHomeScrollYRef = useRef<number>(0);

  const dopamineCtrl = useMemo(
    () => createBrandDopamineBurst(() => brandBtnRef.current),
    []
  );

  const showToast = useCallback(
    (
      message: string,
      isOk = false,
      action?: { label: string; onClick: () => void }
    ) => {
      const opts = action
        ? {
            action: {
              label: action.label,
              onClick: () => {
                triggerHaptic(6);
                action.onClick();
              }
            }
          }
        : undefined;
      if (isOk) {
        toast.success(message, opts);
      } else {
        toast(message, opts);
      }
    },
    []
  );

  useEffect(() => {
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
      setFilterOpen(false);
      setGuideOpen(false);
      setShareOpen(false);
      setDetailPlaceId(null);

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
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Desktop side panel: QR of the current page so people can continue on their phone.
  // Debounced past the 320ms number-rolling window so canvas QR encoding & state update
  // never trigger a mid-animation main-thread hiccup.
  useEffect(() => {
    if (!window.matchMedia('(min-width: 960px)').matches) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void QRCode.toDataURL(computeCurrentUrl(lang), {
        margin: 1,
        width: 240,
        color: { dark: '#1f2a6b', light: '#ffffff' }
      }).then((url) => {
        if (!cancelled) setAsideQr(url);
      });
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [computeCurrentUrl, lang, menuId]);

  // Expose the masthead height so the quick bar can stick right under it.
  useEffect(() => {
    const head = document.getElementById('sitehead');
    if (!head) return;
    const sync = () =>
      document.documentElement.style.setProperty('--sitehead-h', `${head.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(head);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (detailPlaceId) {
        setDetailPlaceId(null);
      } else if (guideOpen) {
        setGuideOpen(false);
        setActiveTab(lastMainTabRef.current);
      } else if (shareOpen) {
        setShareOpen(false);
        setActiveTab(lastMainTabRef.current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailPlaceId, guideOpen, shareOpen]);

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

    const wasClinic = Boolean(activeClinicId);
    const defaultMenu = dataset.menus[0].id;
    setMenuId(defaultMenu);
    setArea('all');
    setSort('savings');
    setTraitFilters([]);
    setSearchQuery('');
    setJapaneseOnly(false);
    savedHomeScrollYRef.current = 0;
    setInfoMenuId(defaultMenu);
    lastMainTabRef.current = 'list';
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

  const rowsBeforeJpFilter = useMemo(() => {
    // Reuse `allInMenu` in the common unfiltered default case instead of recomputing all 137 clinics twice.
    if (area === 'all' && !japaneseOnly && traitFilters.length === 0) {
      return allInMenu;
    }
    return buildRankedRows(dataset, menuId, area, sort, krwPer100Jpy, includeVat, {
      searchQuery,
      japaneseOnly: false,
      origin: userLocation
    });
  }, [allInMenu, menuId, area, sort, krwPer100Jpy, includeVat, searchQuery, japaneseOnly, traitFilters.length, userLocation]);

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

  const inKoreaLoc = isPointInSouthKorea(userLocation);

  const activeClinicPlace = useMemo(
    () => (activeClinicId ? dataset.places.find((p) => p.id === activeClinicId) ?? null : null),
    [activeClinicId]
  );

  const detailRow = useMemo(() => {
    if (!detailPlaceId) return null;
    return currentRows.find((r) => r.place.id === detailPlaceId) ?? null;
  }, [detailPlaceId, currentRows]);

  const activeFilterCount = countActiveFilters({
    area,
    japaneseOnly,
    traitCount: traitFilters.length,
    searchQuery
  });

  const areaChips: FilterChip[] = useMemo(
    () => [
      { id: 'all', label: isJa ? '全体' : '전체', count: allInMenu.length, pressed: area === 'all' },
      ...[...PRIMARY_AREAS.map((a) => a.id), ...EXTRA_AREA_IDS].map((id) => {
        const primary = PRIMARY_AREAS.find((a) => a.id === id);
        const label = primary ? (isJa ? primary.ja : primary.ko) : isJa ? EXTRA_SHORT[id].ja : EXTRA_SHORT[id].ko;
        return { id, label, count: countByArea.get(id) ?? 0, pressed: area === id };
      })
    ],
    [isJa, allInMenu.length, area, countByArea]
  );

  const traitChips: FilterChip[] = useMemo(
    () =>
      TRAIT_FILTERS.map((tf) => {
        const isAll = tf.id === 'all';
        const pressed = isAll ? traitFilters.length === 0 : traitFilters.includes(tf.id);
        const count = isAll
          ? baseRowsForTraits.length
          : baseRowsForTraits.filter((r) =>
              matchesTraitFilters(r.place, pressed ? traitFilters : [...traitFilters, tf.id])
            ).length;
        return {
          id: tf.id,
          label: isJa ? tf.labelJa : tf.labelKo,
          count,
          pressed,
          disabled: !isAll && count === 0 && !pressed,
          icon: tf.icon
        };
      }),
    [isJa, traitFilters, baseRowsForTraits]
  );

  const handleLightHaptic = useCallback(() => triggerHaptic(6), []);
  const navigateToClinicRef = useRef(navigateToClinic);
  navigateToClinicRef.current = navigateToClinic;
  const handleOpenHomeClinic = useCallback(
    (placeId: string) => {
      track('detail_open', { place_id: placeId, menu: menuId, lang });
      navigateToClinicRef.current(placeId, true, [menuId], 1);
    },
    [menuId, lang]
  );

  const resetFilters = () => {
    const prev = { area, traitFilters: [...traitFilters], searchQuery, japaneseOnly };
    const hadAny =
      prev.area !== 'all' ||
      prev.traitFilters.length > 0 ||
      prev.searchQuery.trim() !== '' ||
      prev.japaneseOnly;
    setArea('all');
    setTraitFilters([]);
    setSearchQuery('');
    setJapaneseOnly(false);
    if (hadAny) {
      showToast(
        isJa ? 'フィルターをリセットしました' : '필터를 초기화했어요',
        false,
        {
          label: isJa ? '元に戻す' : '되돌리기',
          onClick: () => {
            setArea(prev.area);
            setTraitFilters(prev.traitFilters);
            setSearchQuery(prev.searchQuery);
            setJapaneseOnly(prev.japaneseOnly);
          }
        }
      );
    }
  };

  return (
    <MotionConfig reducedMotion="user" transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.22 }}>
      <div className="app-shell">
      <aside className="app-aside" aria-label={isJa ? 'ドパガキについて' : '도파가키 소개'}>
        <div className="app-aside-card">
          <div className="app-aside-emoji" aria-hidden="true">
            <BargainEmoji size={56} />
            <MenuEmoji menuId="rejuran-2cc" size={56} />
            <MenuEmoji menuId="shrink-300" size={56} />
          </div>
          <p className="app-aside-brand">{isJa ? 'ドパガキ 美肌相場' : '도파가키 피부시세'}</p>
          <p className="app-aside-lead">
            {isJa ? 'ソウルの美容皮膚科、' : '서울 피부과,'}
            <br />
            {isJa ? '日本よりいくら安い？' : '일본보다 얼마나 쌀까?'}
          </p>
        </div>
        {asideQr && (
          <div className="app-aside-qr">
            <div>
              <p className="app-aside-qr-title">
                <PhoneEmoji size={22} />
                <span>{isJa ? 'スマホで開く' : '휴대폰으로 열기'}</span>
              </p>
              <p className="app-aside-qr-sub">
                {isJa ? 'カメラでQRを読み取ってください' : '카메라로 QR을 스캔하세요'}
              </p>
            </div>
            <img src={asideQr} alt={isJa ? 'このページのQRコード' : '이 페이지 QR 코드'} width={120} height={120} />
          </div>
        )}
      </aside>
      <div className="app-col">
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
                <span className="logo-sub">{isJa ? '美肌相場' : '피부시세'}</span>
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
        {activeClinicPlace ? (
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
              onSavedIdsChange={setSavedClinicIds}
              onRequestLocation={() => requestUserLocation({ silent: false })}
            />
          </div>
        ) : activeTab === 'info' ? (
          <TreatmentInfoView
            dataset={dataset}
            lang={lang}
            selectedMenuId={infoMenuId}
            onSelectMenu={(nextId) => setInfoMenuId(nextId)}
            onHaptic={() => triggerHaptic(6)}
          />
        ) : activeTab === 'recommend' ? (
          <ConciergeView
            lang={lang}
            dataset={dataset}
            naverFx={naverFx}
            krwPer100Jpy={krwPer100Jpy}
            includeVat={includeVat}
            onOpenClinic={(pid, menus) => {
              triggerHaptic(10);
              if (menus[0]) setMenuId(menus[0]);
              navigateToClinic(pid, true, menus, 1);
            }}
            onApplyMenu={(selectedMenuId) => {
              triggerHaptic(10);
              setMenuId(selectedMenuId);
              lastMainTabRef.current = 'list';
              setActiveTab('list');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
            onHaptic={() => triggerHaptic(6)}
          />
        ) : activeTab === 'saved' ? (
          <SavedClinicsView
            lang={lang}
            dataset={dataset}
            savedIds={savedClinicIds}
            defaultMenuId={menuId}
            krwPer100Jpy={krwPer100Jpy}
            includeVat={includeVat}
            userLocation={userLocation}
            onOpenClinic={(pid, targetMenuId) => {
              triggerHaptic(8);
              navigateToClinic(pid, true, [targetMenuId], 1);
            }}
            onRemoveClinic={(place) => {
              const res = toggleSavedClinicId(place.id);
              setSavedClinicIds(res.ids);
              const pName = isJa ? place.nameJa : place.nameKo;
              showToast(
                isJa ? `${pName}の保存を解除しました` : `${pName} 저장을 해제했어요`,
                false,
                {
                  label: isJa ? '元に戻す' : '되돌리기',
                  onClick: () => {
                    const reverted = toggleSavedClinicId(place.id);
                    setSavedClinicIds(reverted.ids);
                  }
                }
              );
            }}
            onClearAll={() => {
              const prev = [...savedClinicIds];
              if (prev.length === 0) return;
              saveClinicIds([]);
              setSavedClinicIds([]);
              showToast(
                isJa ? '保存リストを空にしました' : '저장 목록을 모두 비웠어요',
                false,
                {
                  label: isJa ? '元に戻す' : '되돌리기',
                  onClick: () => {
                    const restored = saveClinicIds(prev);
                    setSavedClinicIds(restored);
                  }
                }
              );
            }}
            onGoRanking={() => {
              lastMainTabRef.current = 'list';
              setActiveTab('list');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoRecommend={() => {
              lastMainTabRef.current = 'recommend';
              setActiveTab('recommend');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onHaptic={() => triggerHaptic(6)}
          />
        ) : (
          <div className="home-view" id="home-view">
            <section className="quickbar" id="controls" aria-label={isJa ? '施術と絞り込み' : '시술과 필터'}>
                <div className="treat-grid treat-row" id="treat-grid" role="group" aria-label="Treatment">
                  {dataset.menus.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      data-id={m.id}
                      className="treat-cell"
                      data-menu={m.id}
                      aria-pressed={m.id === activeMenu.id}
                      onClick={() => {
                        if (m.id !== menuId) {
                          triggerHaptic(6);
                          setMenuId(m.id);
                        }
                      }}
                    >
                      <MenuEmoji menuId={m.id} size={16} className="treat-emoji" />
                      {m.id === 're2o-5cc' ? (
                        <span className="treat-label">
                          {isJa ? 'ブナジュ' : '리투오'}
                          <span className="treat-alias">{isJa ? '韓: リトゥオ' : '일: 부나주'}</span>
                        </span>
                      ) : (
                        <span className="treat-label">{isJa ? m.shortJa : m.shortKo}</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="quick-tools">
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
                  <button
                    type="button"
                    className="filter-btn"
                    id="open-filter-btn"
                    aria-haspopup="dialog"
                    onClick={() => {
                      triggerHaptic(6);
                      track('filter_open', { lang, menu: menuId });
                      setFilterOpen(true);
                    }}
                  >
                    <SvgIcon name="sliders" />
                    <span>{isJa ? '絞り込み' : '필터'}</span>
                    {activeFilterCount > 0 && (
                      <span className="filter-badge num">{activeFilterCount}</span>
                    )}
                  </button>
                </div>
              </section>

            <section
              className="rank"
              id="rank"
              ref={rankRef}
              aria-label="Clinic Price Ledger"
            >
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
                      }}
                    >
                      {copy.resetAreaBtn}
                    </button>
                  </div>
                ) : (
                  <BrandGroupList
                    rows={currentRows}
                    sort={sort}
                    lang={lang}
                    inKoreaLoc={inKoreaLoc}
                    jpSupportLabel={copy.jpSupportTag}
                    onHaptic={handleLightHaptic}
                    onOpenClinic={handleOpenHomeClinic}
                  />
                )}
              </div>
            </section>
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
          {analyticsEnabled && (
            <p className="sitefoot-privacy">
              {isJa
                ? '本サイトはサービス改善のため、PostHogで閲覧・操作データ（クリック、画面の動き）を匿名で計測しています。入力内容は記録しません。ブラウザの「トラッキング拒否（Do Not Track）」設定を尊重します。'
                : '서비스 개선을 위해 PostHog로 이용 기록(클릭, 화면 이동)을 익명으로 측정합니다. 입력 내용은 기록하지 않으며, 브라우저의 추적 거부(Do Not Track) 설정을 따릅니다.'}
            </p>
          )}
          <p className="sitefoot-checked">{copy.provenanceChecked(dataset.meta.checkedDate)}</p>
        </div>
      </footer>

      <nav className="apptab" id="apptab" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`apptab-btn ${activeTab === 'list' ? 'is-active' : ''}`}
          aria-current={activeTab === 'list' ? 'page' : undefined}
          onClick={() => {
            triggerHaptic(6);
            const sameTab = activeTab === 'list' && !activeClinicId;
            lastMainTabRef.current = 'list';
            setActiveTab('list');
            if (activeClinicId) {
              navigateToHome(true, 'list');
            } else {
              window.scrollTo({ top: 0, behavior: sameTab ? 'smooth' : ('instant' as ScrollBehavior) });
            }
          }}
        >
          <SvgIcon name="list" />
          <span className="apptab-lbl">{isJa ? 'ランキング' : '순위'}</span>
        </button>
        <button
          type="button"
          className={`apptab-btn ${activeTab === 'info' ? 'is-active' : ''}`}
          aria-current={activeTab === 'info' ? 'page' : undefined}
          onClick={() => {
            triggerHaptic(6);
            const sameTab = activeTab === 'info' && !activeClinicId;
            setInfoMenuId(menuId);
            lastMainTabRef.current = 'info';
            setActiveTab('info');
            if (activeClinicId) {
              navigateToHome(true);
            }
            window.scrollTo({ top: 0, behavior: sameTab ? 'smooth' : ('instant' as ScrollBehavior) });
          }}
        >
          <SvgIcon name="info" />
          <span className="apptab-lbl">{isJa ? '施術情報' : '시술정보'}</span>
        </button>
        <button
          type="button"
          className={`apptab-btn ${activeTab === 'recommend' ? 'is-active' : ''}`}
          aria-current={activeTab === 'recommend' ? 'page' : undefined}
          onClick={() => {
            triggerHaptic(6);
            const sameTab = activeTab === 'recommend' && !activeClinicId;
            lastMainTabRef.current = 'recommend';
            setActiveTab('recommend');
            if (activeClinicId) {
              navigateToHome(true);
            }
            window.scrollTo({ top: 0, behavior: sameTab ? 'smooth' : ('instant' as ScrollBehavior) });
          }}
        >
          <SvgIcon name="spark" />
          <span className="apptab-lbl">{isJa ? 'AI相談' : 'AI 상담'}</span>
        </button>
        <button
          type="button"
          className={`apptab-btn ${activeTab === 'saved' ? 'is-active' : ''}`}
          aria-current={activeTab === 'saved' ? 'page' : undefined}
          onClick={() => {
            triggerHaptic(6);
            const sameTab = activeTab === 'saved' && !activeClinicId;
            lastMainTabRef.current = 'saved';
            setActiveTab('saved');
            if (activeClinicId) {
              navigateToHome(true);
            }
            window.scrollTo({ top: 0, behavior: sameTab ? 'smooth' : ('instant' as ScrollBehavior) });
          }}
        >
          <span className="apptab-icon-wrap">
            <SvgIcon name={activeTab === 'saved' || savedClinicIds.length > 0 ? 'bookmarkFilled' : 'bookmark'} />
            {savedClinicIds.length > 0 && (
              <span className="apptab-badge num" aria-label={isJa ? `${savedClinicIds.length}件保存` : `${savedClinicIds.length}개 저장됨`}>
                {savedClinicIds.length > 99 ? '99+' : savedClinicIds.length}
              </span>
            )}
          </span>
          <span className="apptab-lbl">{isJa ? '保存' : '저장'}</span>
        </button>
      </nav>

      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        lang={lang}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        areaChips={areaChips}
        onAreaSelect={(id) => setArea(id as AreaId)}
        japaneseOnly={japaneseOnly}
        jpCount={jpAvailableCount}
        onToggleJapaneseOnly={() => setJapaneseOnly((prev) => !prev)}
        traitChips={traitChips}
        onToggleTrait={(id) => setTraitFilters((prev) => toggleTraitFilters(prev, id as TraitFilterId))}
        includeVat={includeVat}
        onVatChange={setIncludeVat}
        resultCount={currentRows.length}
        onReset={resetFilters}
        onHaptic={() => triggerHaptic(6)}
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
        onOpenClinicPage={(placeId) => {
          setDetailPlaceId(null);
          navigateToClinic(placeId, true);
        }}
        getShareUrl={(placeId) =>
          buildClinicUrl(window.location.origin, APP_BASE_PATH, placeId, {
            lang,
            menuId,
            includeVat
          })
        }
        onShowToast={(msg) => showToast(msg)}
      />

      <GuideDrawerModal
        open={guideOpen}
        lang={lang}
        activeMenu={
          activeTab === 'info'
            ? (dataset.menus.find((m) => m.id === infoMenuId) ?? activeMenu)
            : activeMenu
        }
        onClose={() => {
          setGuideOpen(false);
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
        }}
        onCopied={(msg) => showToast(msg, true)}
      />

      </div>
      </div>
      {createPortal(
        <Toaster
          position="top-center"
          theme="light"
          richColors
          offset={14}
          mobileOffset={{ top: 14, left: 16, right: 16 }}
          style={{ zIndex: 2147483000 }}
          toastOptions={{
            style: {
              fontFamily: 'var(--font-sans)',
              borderRadius: '16px',
              border: '1px solid var(--pink-5)',
              boxShadow: '0 8px 28px rgba(194, 41, 138, 0.16)'
            }
          }}
        />,
        document.body
      )}
    </MotionConfig>
  );
}

export default App;
