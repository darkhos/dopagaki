export type AgentLang = 'ja' | 'ko';

export type AgentAreaId =
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

export type AgentChannelKind =
  | 'kakao'
  | 'line'
  | 'instagram'
  | 'naver_booking'
  | 'direct_reserve';

export type AgentPriceTag =
  | 'first_visit'
  | 'event'
  | 'day_limited'
  | 'app_benefit'
  | 'anesthesia'
  | 'extra_fee';

export type AgentExcludeReason =
  | 'needle'
  | 'downtime'
  | 'area'
  | 'japanese'
  | 'budget';

export interface BookingChannel {
  kind: AgentChannelKind;
  labelJa: string;
  labelKo: string;
  urlJa: string;
  urlKo: string;
}

export interface PriceProof {
  urlJa: string;
  urlKo: string;
  domainJa: string;
  domainKo: string;
  capturedDate: string;
  verified: boolean;
  matchedText: string | null;
}

export interface JpClinicPrice {
  nameJa: string;
  nameKo: string;
  planJa: string;
  planKo: string;
  priceJpy: number;
  sourceUrl: string;
  productNoteJa: string | null;
  productNoteKo: string | null;
}

export interface JpClinicSavings extends JpClinicPrice {
  savingsJpy: number;
  savingsPct: number;
}

export interface RecommendationCard {
  kind: 'recommendation';
  cardId: string;
  placeId: string;
  menuId: string;
  clinicNameJa: string;
  clinicNameKo: string;
  menuNameJa: string;
  menuNameKo: string;
  area: AgentAreaId;
  stationJa: string;
  stationKo: string;
  japaneseSupport: boolean;
  baseKrw: number;
  vatKrw: number;
  totalKrw: number;
  totalJpy: number;
  krwPer100Jpy: number;
  fxDateLabel: string;
  jpAverageJpy: number;
  jpMinJpy: number;
  jpMaxJpy: number;
  jpClinicCount: number;
  savingsJpy: number;
  savingsPct: number;
  jpClinic: JpClinicSavings | null;
  distanceMeters: number | null;
  walkMinutes: number | null;
  priceTags: AgentPriceTag[];
  priceConditionJa: string;
  priceConditionKo: string;
  priceNoteJa: string;
  priceNoteKo: string;
  sourceUrl: string;
  rating: number;
  ratingScope: 'branch' | 'brand';
  ratingTier: 'jp_kr_verified' | 'kr_verified' | 'limited';
  bookingChannels: BookingChannel[];
  centralChannel: boolean;
  proof: PriceProof;
  searchId: string;
  reason: string | null;
}

export interface BundleMenuItem {
  menuId: string;
  menuNameJa: string;
  menuNameKo: string;
  baseKrw: number;
  vatKrw: number;
  totalKrw: number;
  totalJpy: number;
  jpAverageJpy: number;
  savingsJpy: number;
  savingsPct: number;
  priceTags: AgentPriceTag[];
  proof: PriceProof;
}

export interface BundleCard {
  kind: 'bundle';
  cardId: string;
  placeId: string;
  clinicNameJa: string;
  clinicNameKo: string;
  area: AgentAreaId;
  stationJa: string;
  stationKo: string;
  japaneseSupport: boolean;
  items: BundleMenuItem[];
  totalKrw: number;
  totalJpy: number;
  krwPer100Jpy: number;
  fxDateLabel: string;
  jpTotalAverageJpy: number;
  savingsJpy: number;
  savingsPct: number;
  distanceMeters: number | null;
  walkMinutes: number | null;
  rating: number;
  ratingScope: 'branch' | 'brand';
  ratingTier: 'jp_kr_verified' | 'kr_verified' | 'limited';
  bookingChannels: BookingChannel[];
  centralChannel: boolean;
  sourceUrl: string;
  differsFromSingleWinners: boolean;
  singleWinnersNoteJa: string | null;
  singleWinnersNoteKo: string | null;
  searchId: string;
  reason: string | null;
}

export interface LocationCard {
  kind: 'location';
  locationId: string;
  locationType: 'area' | 'station';
  query: string | null;
  nameJa: string;
  nameKo: string;
  lat: number;
  lng: number;
}

export interface JpMatchCard {
  kind: 'jp_match';
  query: string;
  menuId: string;
  menuNameJa: string;
  menuNameKo: string;
  reasonJa: string;
  reasonKo: string;
  unitNoteJa: string;
  unitNoteKo: string;
  jpClinic: JpClinicPrice | null;
}

export interface BookingCard {
  kind: 'booking';
  placeId: string;
  clinicNameJa: string;
  clinicNameKo: string;
  menuIds: string[];
  japaneseSupport: boolean;
  channels: BookingChannel[];
  centralChannel: boolean;
  officialSiteUrl: string;
  inquiryKo: string;
  inquiryJa: string;
  orderSheetKo: string;
  orderSheetJa: string;
  orderTotalKrw: number;
  orderTotalJpy: number;
  krwPer100Jpy: number;
  fxDateLabel: string;
}

export type AgentCard = RecommendationCard | BundleCard | LocationCard | JpMatchCard | BookingCard;

export interface Exclusion {
  menuId: string;
  reason: AgentExcludeReason;
  clinicCount: number;
  searchId: string;
}

export interface Question {
  question: string;
  options: string[];
  multiSelect: boolean;
}

export interface ChatRequest {
  userId: string;
  threadId?: string | null;
  message: string;
  lang: AgentLang;
}

export interface ChatResponse {
  threadId: string;
  fallback: 'error' | 'daily_limit' | null;
  conditionSummary: string;
  answer: string;
  cards: AgentCard[];
  exclusions: Exclusion[];
  questions: Question[];
  suggestions: string[];
  cautions: string[];
  disclaimer: string;
}

export interface AgentSchemas {
  ChatRequest: ChatRequest;
  ChatResponse: ChatResponse;
  BookingCard: BookingCard;
  BookingChannel: BookingChannel;
  BundleCard: BundleCard;
  BundleMenuItem: BundleMenuItem;
  RecommendationCard: RecommendationCard;
  LocationCard: LocationCard;
  JpMatchCard: JpMatchCard;
  JpClinicPrice: JpClinicPrice;
  JpClinicSavings: JpClinicSavings;
  PriceProof: PriceProof;
  Exclusion: Exclusion;
  Question: Question;
}
