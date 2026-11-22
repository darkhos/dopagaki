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
export type SortId = 'savings' | 'price' | 'distance';
export type Lang = 'ja' | 'ko';

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

export interface AppState {
  lang: Lang;
  menuId: string;
  area: AreaId;
  sort: SortId;
  searchQuery: string;
  japaneseOnly: boolean;
  krwPer100Jpy: number;
  customRateOverridden: boolean;
  includeVat: boolean;
  selectedPlaceId: string | null;
  hoveredPlaceId: string | null;
  detailPlaceId: string | null;
  guideOpen: boolean;
  shareOpen: boolean;
  shareLang: Lang;
  moreAreasOpen: boolean;
  searchOpen: boolean;
  activeTab: 'list' | 'map' | 'guide' | 'share';
}
