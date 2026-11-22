import type {
  AreaId,
  ComputedRow,
  MenuItem,
  PlaceItem,
  PriceDataset,
  SortId
} from '../types.ts';

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
 * Compute transparent price comparison row for one beauty clinic + one treatment menu.
 */
export function computeRow(
  place: PlaceItem,
  menu: MenuItem,
  krwPer100Jpy: number,
  includeVat: boolean,
  vatRate: number,
  venueLat: number,
  venueLng: number
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
    distanceMeters,
    walkMinutes
  };
}

export interface RowFilterOptions {
  searchQuery?: string;
  japaneseOnly?: boolean;
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

  const rows: ComputedRow[] = [];
  for (const place of dataset.places) {
    if (place.category !== menu.category) continue;
    if (area !== 'all' && place.area !== area) continue;
    if (japaneseOnly && !place.japaneseSupport) continue;

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
      dataset.meta.venue.lat,
      dataset.meta.venue.lng
    );
    if (row) rows.push(row);
  }

  rows.sort((a, b) => {
    if (sort === 'distance') {
      return a.distanceMeters - b.distanceMeters || a.totalKrw - b.totalKrw;
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

export function formatDistance(meters: number, lang: 'ja' | 'ko'): string {
  if (meters < 1000) {
    const walk = Math.max(1, Math.round(meters / 75));
    return lang === 'ja' ? `会場徒歩約${walk}分 (${meters}m)` : `행사장 도보 약 ${walk}분 (${meters}m)`;
  }
  const km = (meters / 1000).toFixed(1);
  return lang === 'ja' ? `新村会場から${km}km` : `신촌 행사장에서 ${km}km`;
}
