export type CategoryId = 'beauty';
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
export type SortId = 'savings' | 'rating' | 'price' | 'distance';
export type Lang = 'ja' | 'ko';
export type TraitFilterId =
  | 'all'
  | 'low_upsell'
  | 'short_wait'
  | 'careful'
  | 'sunday_night'
  | 'clean_space'
  | 'branch_verified';

export interface GeoPoint {
  lat: number;
  lng: number;
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
  vatRate: number;
  venue: VenueMeta;
}

export interface NaverFxSnapshot {
  krwPer100Jpy: number;
  localTradedAt: string;
  dateLabel: string;
  degreeCount: number;
  fluctuations: number;
  fluctuationsRatio: number;
  direction: 'RISING' | 'FALLING' | 'UNCHANGED';
  bankKo: string;
  bankJa: string;
  sourceUrl: string;
  fetchedAt: string;
}

export interface AreaItem {
  id: AreaId;
  nameJa: string;
  nameKo: string;
  lat: number;
  lng: number;
}

export interface JpBenchmarkClinic {
  nameJa: string;
  nameKo: string;
  planJa: string;
  planKo: string;
  priceJpy: number;
  url: string;
}

export interface MenuItem {
  id: string;
  category: CategoryId;
  nameJa: string;
  nameKo: string;
  shortJa: string;
  shortKo: string;
  jpBenchmarkJpy: number;
  jpBenchmarks: JpBenchmarkClinic[];
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

export interface SeoulAverageStats {
  menuId: string;
  avgBaseKrw: number;
  avgTotalKrw: number;
  avgTotalJpy: number;
  sampleCount: number;
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
  seoulAvgKrw: number;
  seoulAvgJpy: number;
  seoulSampleCount: number;
  seoulDiffKrw: number;
  seoulDiffJpy: number;
  seoulDiffPct: number;
  distanceMeters: number;
  walkMinutes: number;
  aiRating: number;
}

export interface AppState {
  lang: Lang;
  menuId: string;
  area: AreaId;
  sort: SortId;
  traitFilters: TraitFilterId[];
  searchQuery: string;
  japaneseOnly: boolean;
  krwPer100Jpy: number;
  includeVat: boolean;
  selectedPlaceId: string | null;
  hoveredPlaceId: string | null;
  detailPlaceId: string | null;
  guideOpen: boolean;
  shareOpen: boolean;
  shareLang: Lang;
  moreAreasOpen: boolean;
  searchOpen: boolean;
  activeTab: 'list' | 'guide' | 'share';
  userLocation: GeoPoint | null;
  locatingUser: boolean;
}
