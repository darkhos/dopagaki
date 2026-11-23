import type {
  AreaId,
  ComputedRow,
  GeoPoint,
  Lang,
  MenuItem,
  PlaceItem,
  PriceDataset,
  SeoulAverageStats,
  SortId
} from '../types.ts';
import { getClinicAiRating } from './ai-rating.ts';

const EARTH_RADIUS_M = 6371000;

/**
 * Great-circle distance in meters using Haversine formula.
 */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Convert KRW to JPY using the standard "KRW per 100 JPY" rate (supports decimals, e.g. 848.99).
 */
export function krwToJpy(krw: number, krwPer100Jpy: number): number {
  if (!Number.isFinite(krwPer100Jpy) || krwPer100Jpy <= 0) {
    throw new Error('Invalid exchange rate');
  }
  return Math.round((krw * 100) / krwPer100Jpy);
}

/**
 * Convert JPY to KRW using "KRW per 100 JPY".
 */
export function jpyToKrw(jpy: number, krwPer100Jpy: number): number {
  if (!Number.isFinite(krwPer100Jpy) || krwPer100Jpy <= 0) {
    throw new Error('Invalid exchange rate');
  }
  return Math.round((jpy * krwPer100Jpy) / 100);
}

/**
 * Compute exact Seoul-wide average price for a treatment menu across all listed clinics.
 */
export function computeSeoulAverage(
  places: PlaceItem[],
  menu: MenuItem,
  krwPer100Jpy: number,
  includeVat: boolean,
  vatRate: number
): SeoulAverageStats {
  let sumBase = 0;
  let sumTotal = 0;
  let count = 0;

  for (const place of places) {
    if (place.category !== menu.category) continue;
    const offer = place.prices[menu.id];
    if (!offer) continue;

    const applyVat = includeVat && place.vatExcluded && menu.vatAppliesInKorea;
    const vatKrw = applyVat ? Math.round(offer.krw * vatRate) : 0;
    sumBase += offer.krw;
    sumTotal += offer.krw + vatKrw;
    count += 1;
  }

  const avgBaseKrw = count > 0 ? Math.round(sumBase / count) : 0;
  const avgTotalKrw = count > 0 ? Math.round(sumTotal / count) : 0;
  const avgTotalJpy = avgTotalKrw > 0 ? krwToJpy(avgTotalKrw, krwPer100Jpy) : 0;

  return {
    menuId: menu.id,
    avgBaseKrw,
    avgTotalKrw,
    avgTotalJpy,
    sampleCount: count
  };
}

export interface SeoulDiffDisplay {
  text: string;
  tone: 'cheaper' | 'same' | 'higher';
}

export function formatSeoulDiffBadge(diffPct: number, lang: Lang): SeoulDiffDisplay {
  if (diffPct >= 1) {
    return {
      text: lang === 'ja' ? `ソウル平均 -${diffPct}%` : `서울 평균 -${diffPct}%`,
      tone: 'cheaper'
    };
  }
  if (diffPct <= -1) {
    const abs = Math.abs(diffPct);
    return {
      text: lang === 'ja' ? `ソウル平均 +${abs}%` : `서울 평균 +${abs}%`,
      tone: 'higher'
    };
  }
  return {
    text: lang === 'ja' ? 'ソウル平均並み' : '서울 평균 수준',
    tone: 'same'
  };
}

export function formatSeoulDiffBanner(
  seoulAvgJpy: number,
  diffJpy: number,
  diffPct: number,
  lang: Lang,
  sampleCount: number,
  isMultiMenu = false
): SeoulDiffDisplay {
  const baseLabelKo = isMultiMenu
    ? `서울 평균 합계(${formatJpy(seoulAvgJpy)})`
    : `서울 ${sampleCount}곳 평균(${formatJpy(seoulAvgJpy)})`;
  const baseLabelJa = isMultiMenu
    ? `ソウル平均合計(${formatJpy(seoulAvgJpy)})`
    : `ソウル${sampleCount}院平均(${formatJpy(seoulAvgJpy)})`;

  if (diffJpy > 0 && diffPct >= 1) {
    return {
      text:
        lang === 'ja'
          ? `${baseLabelJa}より ${formatJpy(diffJpy)} 安い (${diffPct}%↓)`
          : `${baseLabelKo}보다 ${formatJpy(diffJpy)} 저렴 (${diffPct}%↓)`,
      tone: 'cheaper'
    };
  }
  if (diffJpy < 0 && diffPct <= -1) {
    const absJpy = Math.abs(diffJpy);
    const absPct = Math.abs(diffPct);
    return {
      text:
        lang === 'ja'
          ? `${baseLabelJa}より +${formatJpy(absJpy)} (${absPct}%↑)`
          : `${baseLabelKo}보다 +${formatJpy(absJpy)} (${absPct}%↑)`,
      tone: 'higher'
    };
  }
  return {
    text: lang === 'ja' ? `${baseLabelJa}と同水準` : `${baseLabelKo}과 비슷한 수준`,
    tone: 'same'
  };
}

/**
 * Compute transparent price comparison row for one beauty clinic + one treatment menu.
 */
export function computeRow(
  place: PlaceItem,
  menu: MenuItem,
  krwPer100Jpy: number,
  includeVat: boolean,
  vatRate: number,
  venueLat: number,
  venueLng: number,
  seoulAvg?: SeoulAverageStats,
  allPlaces?: PlaceItem[]
): ComputedRow | null {
  const offer = place.prices[menu.id];
  if (!offer) return null;

  const applyVat = includeVat && place.vatExcluded && menu.vatAppliesInKorea;
  const baseKrw = offer.krw;
  const vatKrw = applyVat ? Math.round(baseKrw * vatRate) : 0;
  const totalKrw = baseKrw + vatKrw;
  const krTotalJpy = krwToJpy(totalKrw, krwPer100Jpy);
  const jpBenchmarkJpy = menu.jpBenchmarkJpy;
  const savingsJpy = jpBenchmarkJpy - krTotalJpy;
  const savingsPct =
    jpBenchmarkJpy > 0 ? Math.round((savingsJpy / jpBenchmarkJpy) * 100) : 0;
  const krRatioOfJp =
    jpBenchmarkJpy > 0 ? Math.round((krTotalJpy / jpBenchmarkJpy) * 100) : 100;

  const seoulAvgKrw = seoulAvg ? seoulAvg.avgTotalKrw : totalKrw;
  const seoulAvgJpy = seoulAvg ? seoulAvg.avgTotalJpy : krTotalJpy;
  const seoulSampleCount = seoulAvg ? seoulAvg.sampleCount : 1;
  const seoulDiffKrw = seoulAvgKrw - totalKrw;
  const seoulDiffJpy = seoulAvgJpy - krTotalJpy;
  const seoulDiffPct =
    seoulAvgKrw > 0 ? Math.round((seoulDiffKrw / seoulAvgKrw) * 100) : 0;

  const distanceMeters = haversineMeters(venueLat, venueLng, place.lat, place.lng);
  const walkMinutes = Math.max(1, Math.round(distanceMeters / 75));

  return {
    place,
    menu,
    offer,
    baseKrw,
    vatKrw,
    totalKrw,
    krTotalJpy,
    jpBenchmarkJpy,
    savingsJpy,
    savingsPct,
    krRatioOfJp,
    seoulAvgKrw,
    seoulAvgJpy,
    seoulSampleCount,
    seoulDiffKrw,
    seoulDiffJpy,
    seoulDiffPct,
    distanceMeters,
    walkMinutes,
    aiRating: getClinicAiRating(place, allPlaces).overall
  };
}

export interface RowFilterOptions {
  searchQuery?: string;
  japaneseOnly?: boolean;
  origin?: GeoPoint | null;
  placeFilter?: (place: PlaceItem) => boolean;
}

const DEFAULT_SEOUL_CENTER: GeoPoint = {
  lat: 37.5665,
  lng: 126.978
};

/**
 * Returns true if the given coordinates are within South Korea (mainland, Jeju, Ulleungdo/Dokdo),
 * excluding neighboring foreign areas such as Japan (Tsushima, Kyushu, Honshu) and China.
 */
export function isPointInSouthKorea(point: GeoPoint | null | undefined): boolean {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    return false;
  }
  const { lat, lng } = point;
  if (lat >= 33.05 && lat <= 33.65 && lng >= 126.05 && lng <= 127.05) {
    return true;
  }
  if (lat >= 37.1 && lat <= 37.65 && lng >= 130.7 && lng <= 132.0) {
    return true;
  }
  if (lat >= 34.05 && lat <= 38.65 && lng >= 124.5 && lng <= 129.65) {
    if (lat < 34.78 && lng > 129.1) return false;
    return true;
  }
  return false;
}

/**
 * Filter and sort visible clinic rows for the active treatment, area, search, and sort order.
 */
export function buildRankedRows(
  dataset: PriceDataset,
  menuId: string,
  area: AreaId,
  sort: SortId,
  krwPer100Jpy: number,
  includeVat: boolean,
  options: RowFilterOptions = {}
): ComputedRow[] {
  const menu = dataset.menus.find((m) => m.id === menuId);
  if (!menu) return [];

  const q = (options.searchQuery ?? '').trim().toLowerCase();
  const japaneseOnly = Boolean(options.japaneseOnly);
  const validOrigin = isPointInSouthKorea(options.origin) ? options.origin : null;
  const originLat = validOrigin?.lat ?? DEFAULT_SEOUL_CENTER.lat;
  const originLng = validOrigin?.lng ?? DEFAULT_SEOUL_CENTER.lng;
  const seoulAvg = computeSeoulAverage(
    dataset.places,
    menu,
    krwPer100Jpy,
    includeVat,
    dataset.meta.vatRate
  );

  const rows: ComputedRow[] = [];
  for (const place of dataset.places) {
    if (place.category !== menu.category) continue;
    if (area !== 'all' && place.area !== area) continue;
    if (japaneseOnly && !place.japaneseSupport) continue;
    if (options.placeFilter && !options.placeFilter(place)) continue;

    if (q) {
      const haystack = [
        place.nameJa,
        place.nameKo,
        place.brandJa,
        place.addressKo,
        place.stationJa,
        place.stationKo
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) continue;
    }

    const row = computeRow(
      place,
      menu,
      krwPer100Jpy,
      includeVat,
      dataset.meta.vatRate,
      originLat,
      originLng,
      seoulAvg,
      dataset.places
    );
    if (row) rows.push(row);
  }

  rows.sort((a, b) => {
    if (sort === 'distance') {
      return a.distanceMeters - b.distanceMeters || a.totalKrw - b.totalKrw;
    }
    if (sort === 'rating') {
      return b.aiRating - a.aiRating || b.savingsJpy - a.savingsJpy || a.distanceMeters - b.distanceMeters;
    }
    if (sort === 'price') {
      return a.totalKrw - b.totalKrw || a.distanceMeters - b.distanceMeters;
    }
    return b.savingsJpy - a.savingsJpy || a.distanceMeters - b.distanceMeters;
  });

  return rows;
}

export function formatRate(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : rate.toFixed(2);
}

export function formatJpy(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}¥${Math.abs(Math.round(amount)).toLocaleString('ja-JP')}`;
}

export function formatKrw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

export function formatDistance(
  meters: number,
  lang: 'ja' | 'ko',
  isUserOrigin = false
): string {
  if (!isUserOrigin) return '';
  if (meters < 1000) {
    const walk = Math.max(1, Math.round(meters / 75));
    return lang === 'ja' ? `現在地徒歩約${walk}分 (${meters}m)` : `내 위치 도보 약 ${walk}분 (${meters}m)`;
  }
  const km = (meters / 1000).toFixed(1);
  return lang === 'ja' ? `現在地から${km}km` : `내 위치에서 ${km}km`;
}
