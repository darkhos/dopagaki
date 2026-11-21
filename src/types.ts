export type CategoryId = 'beauty' | 'eyewear';
export type AreaId =
  | 'all'
  | 'sinchon'
  | 'hongdae'
  | 'myeongdong'
  | 'yongsan'
  | 'gangnam'
  | 'jamsil'
  | 'seongsu'
  | 'yeouido'
  | 'magok'
  | 'nowon'
  | 'cheonho'
  | 'gwanak';
export type SortId = 'savings' | 'price' | 'distance';
export type Lang = 'ja' | 'ko';

export interface FlightPreset {
  id: string;
  jpy: number;
  labelJa: string;
  labelKo: string;
}

export interface VenueMeta {
  nameJa: string;
  nameKo: string;
  lat: number;
  lng: number;
}

export interface DatasetMeta {
  checkedDate: string;
  defaultKrwPer100Jpy: number;
  defaultFlightJpy: number;
  japanCustomsLimitJpy: number;
  vatRate: number;
  venue: VenueMeta;
  flightPresets: FlightPreset[];
}

export interface AreaItem {
  id: AreaId;
  nameJa: string;
  nameKo: string;
  lat: number;
  lng: number;
}

export interface MenuItem {
  id: string;
  category: CategoryId;
  nameJa: string;
  nameKo: string;
  shortJa: string;
  shortKo: string;
  jpBenchmarkJpy: number;
  jpSourceName: string;
  jpSourceNameKo?: string;
  jpSourceDetailJa: string;
  jpSourceDetailKo: string;
  jpSourceUrl: string;
  jpSecondaryUrl?: string;
  vatAppliesInKorea: boolean;
  leadTimeNoteJa: string;
  leadTimeNoteKo: string;
}

export interface PriceOffer {
  krw: number;
  noteJa: string;
  noteKo: string;
}

export interface PlaceItem {
  id: string;
  category: CategoryId;
  area: Exclude<AreaId, 'all'>;
  nameJa: string;
  nameKo: string;
  brandJa: string;
  addressKo: string;
  stationJa: string;
  stationKo: string;
  lat: number;
  lng: number;
  sourceUrl: string;
  sourceType: 'official_event' | 'official_standard';
  vatExcluded: boolean;
  japaneseSupport: boolean;
  caveatJa: string;
  caveatKo: string;
  prices: Partial<Record<string, PriceOffer>>;
}

export interface PriceDataset {
  meta: DatasetMeta;
  areas: AreaItem[];
  menus: MenuItem[];
  places: PlaceItem[];
}

export interface ComputedRow {
  place: PlaceItem;
  menu: MenuItem;
  offer: PriceOffer;
  baseKrw: number;
  vatKrw: number;
  totalKrw: number;
  krTotalJpy: number;
  jpBenchmarkJpy: number;
  savingsJpy: number;
  savingsPct: number;
  krRatioOfJp: number;
  distanceMeters: number;
  walkMinutes: number;
}

export interface PlanEntry {
  key: string; // `${placeId}::${menuId}`
  placeId: string;
  menuId: string;
}

export interface PlanSummary {
  items: ComputedRow[];
  totalKrKrw: number;
  totalKrJpy: number;
  totalJpJpy: number;
  totalSavingsJpy: number;
  flightTargetJpy: number;
  paybackPct: number;
  paybackReached: boolean;
  customsExceeded: boolean;
  customsRatioPct: number;
}

export interface AppState {
  lang: Lang;
  category: CategoryId;
  menuId: string;
  area: AreaId;
  sort: SortId;
  searchQuery: string;
  japaneseOnly: boolean;
  krwPer100Jpy: number;
  fxPanelOpen: boolean;
  includeVat: boolean;
  flightTargetJpy: number;
  selectedPlaceId: string | null;
  hoveredPlaceId: string | null;
  detailPlaceId: string | null;
  guideOpen: boolean;
  shareOpen: boolean;
  shareLang: Lang;
  planOpen: boolean;
  mobileView: 'list' | 'map';
  plan: PlanEntry[];
}
