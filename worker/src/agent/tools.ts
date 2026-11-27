import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import rawDataset from '@/data/prices.json';
import rawNaverFx from '@/data/naver-fx.json';
import { getClinicChannels } from '@/data/clinic-channels.ts';
import { getOfficialMenuProof } from '@/data/official-proofs.ts';
import { getClinicAiRating } from '@/lib/ai-rating.ts';
import { buildRankedRows, haversineMeters, krwToJpy } from '@/lib/calc.ts';
import { CONCERN_MENUS, DOWNTIME_MAX_DAYS, NEEDLE_MENUS, type ConciergeConcernId } from '@/lib/concierge.ts';
import type {
  AgentAreaId,
  AgentExcludeReason,
  BookingCard,
  BookingChannel,
  BundleCard,
  BundleMenuItem,
  Exclusion,
  JpClinicPrice,
  JpClinicSavings,
  JpMatchCard,
  LocationCard,
  PriceProof,
  RecommendationCard
} from '@/lib/agent-types.ts';
import type { ComputedRow, JpBenchmarkClinic, MenuItem, NaverFxSnapshot, PlaceItem, PriceDataset, SortId } from '@/types.ts';
import {
  DEFAULT_ORDER_REQUESTS,
  inquiryMessages,
  orderSheetMessages,
  type OrderRequestId,
  type TimeSlot
} from './inquiry.ts';
import {
  UNIT_NOTES,
  compareNote,
  findJpClinic,
  matchJpName,
  menusWithJpClinic
} from './jp-names.ts';
import { LocationIndex, areaParts, type LocationEntry } from './locations.ts';
import { classifyPriceTags } from './price-tags.ts';

export const DATASET = rawDataset as unknown as PriceDataset;
export const SNAPSHOT_FX = rawNaverFx as unknown as NaverFxSnapshot;

const MENU_IDS = DATASET.menus.map((m) => m.id);
const AREA_IDS: string[] = DATASET.areas.filter((a) => a.id !== 'all').map((a) => a.id);

let cachedLocations: LocationIndex | null = null;
export function getLocationIndex(): LocationIndex {
  if (!cachedLocations) {
    cachedLocations = new LocationIndex(DATASET);
  }
  return cachedLocations;
}

export interface FxInfo {
  krwPer100Jpy: number;
  dateLabel: string;
  bankKo: string;
}

export interface SearchTarget {
  area: AgentAreaId | null;
  originId: string | null;
  clinicTokens: string[];
  clinicIds: string[];
}

export type RecommendationCardData = Omit<RecommendationCard, 'kind' | 'searchId' | 'reason'>;
export type BundleCardData = Omit<BundleCard, 'kind' | 'searchId' | 'reason'>;
export type ExclusionData = Omit<Exclusion, 'searchId'>;
export type LocationCardData = Omit<LocationCard, 'kind'>;
export type JpMatchCardData = Omit<JpMatchCard, 'kind'>;
export type BookingCardData = Omit<BookingCard, 'kind'>;

export interface SearchClinicsArtifact {
  menuId: string;
  searchId: string;
  target: SearchTarget;
  cards: RecommendationCardData[];
  exclusions: ExclusionData[];
}

export interface SearchBundleArtifact {
  menuIds: string[];
  searchId: string;
  target: SearchTarget;
  cards: BundleCardData[];
  exclusions: ExclusionData[];
}

export interface ResolveLocationArtifact {
  status: 'found' | 'ambiguous' | 'unknown';
  location: LocationCardData | null;
}

export interface MatchJpTreatmentArtifact {
  status: 'found' | 'ambiguous' | 'unknown';
  match: JpMatchCardData | null;
  candidates: string[];
}

export interface GetBookingOptionsArtifact {
  booking: BookingCardData;
}

export interface ToolExecutionResult {
  text: string;
  artifact?: unknown;
  isError?: boolean;
}

const EXCLUDE_LABEL: Record<AgentExcludeReason, string> = {
  needle: 'the treatment uses a needle',
  downtime: 'the recovery period (redness/swelling) is too long',
  area: 'outside the requested area',
  japanese: 'no Japanese support',
  budget: 'over budget'
};

const CHANNEL_NAMES: Record<BookingChannel['kind'], string> = {
  kakao: 'KakaoTalk',
  line: 'LINE',
  instagram: 'Instagram',
  naver_booking: 'Naver Booking',
  direct_reserve: 'official web booking'
};

const CONCERN_GUIDE: Record<ConciergeConcernId, string> = {
  pores: 'acne, breakouts, sebum, pores, blackheads, acne scars (ニキビ, 肌荒れ, 皮脂, 毛穴, 黒ずみ, ニキビ跡 / 여드름, 트러블, 피지, 모공, 블랙헤드, 여드름 흉터)',
  glow: 'dullness, uneven tone, spots, redness, lack of glow (ツヤ, 透明感, くすみ, シミ, 赤み / 윤기, 광채, 칙칙함, 기미, 잡티, 홍조)',
  lift: 'sagging, jawline, double chin, small face (たるみ, 小顔, フェイスライン / 처짐, 탄력, 턱선, 이중턱)',
  dry: 'dryness, fine lines, wrinkles (乾燥, 小じわ / 속건조, 잔주름, 주름)',
  jaw: 'square jaw, teeth clenching (エラ, 食いしばり / 사각턱, 이갈이)',
  skinbase: 'skin density and texture, skin boosters (肌育, ハリ, 肌質改善 / 피부 밀도, 피부결, 스킨부스터)'
};

function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

function getMenu(menuId: string): MenuItem | undefined {
  return DATASET.menus.find((m) => m.id === menuId);
}

function getPlace(placeId: string): PlaceItem | undefined {
  return DATASET.places.find((p) => p.id === placeId);
}

function matchesPlace(place: PlaceItem, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const hay = [
    place.nameKo,
    place.nameJa,
    place.brandJa,
    place.addressKo,
    place.stationKo,
    place.stationJa
  ]
    .join(' ')
    .toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

function targetNarrows(a: SearchTarget, b: SearchTarget): boolean {
  if (b.area && a.area !== b.area) return false;
  if (b.originId && a.originId !== b.originId) return false;
  if (b.clinicTokens.length > 0) {
    if (a.clinicTokens.length === 0) return false;
    const bSet = new Set(b.clinicIds);
    return a.clinicIds.every((id) => bSet.has(id));
  }
  return true;
}

export function searchTargetComparesWith(a: SearchTarget, b: SearchTarget): boolean {
  if (
    (a.clinicTokens.length > 0 && a.clinicIds.length === 0) ||
    (b.clinicTokens.length > 0 && b.clinicIds.length === 0)
  ) {
    return true;
  }
  return !(targetNarrows(a, b) || targetNarrows(b, a));
}

function buildBookingChannels(placeId: string): {
  channels: BookingChannel[];
  centralChannel: boolean;
} {
  const ko = getClinicChannels(placeId, 'ko');
  const ja = getClinicChannels(placeId, 'ja');
  const channels: BookingChannel[] = ko.items.map((item, idx) => ({
    kind: item.kind,
    labelKo: item.labelKo,
    labelJa: item.labelJa,
    urlKo: item.url,
    urlJa: ja.items[idx]?.url ?? item.url
  }));
  return { channels, centralChannel: ko.isCentralChannel };
}

function channelNamesText(channels: BookingChannel[]): string {
  return channels.map((c) => CHANNEL_NAMES[c.kind]).join(', ') || 'none in data';
}

function buildPriceProof(place: PlaceItem, menuId: string): PriceProof {
  const ko = getOfficialMenuProof(place, menuId, 'ko');
  const ja = getOfficialMenuProof(place, menuId, 'ja');
  const verified = Boolean(ko.imageFile);
  return {
    urlJa: ja.priceUrl,
    urlKo: ko.priceUrl,
    domainJa: ja.domainLabel,
    domainKo: ko.domainLabel,
    capturedDate: ko.capturedDate ?? '2026-11-23',
    verified,
    matchedText: verified ? (ko.matchedText ?? null) : null
  };
}

function toJpClinicPrice(b: JpBenchmarkClinic): JpClinicPrice {
  const note = compareNote(b);
  return {
    nameJa: b.nameJa,
    nameKo: b.nameKo,
    planJa: b.planJa,
    planKo: b.planKo,
    priceJpy: b.priceJpy,
    sourceUrl: b.url,
    productNoteJa: note ? note.ja : null,
    productNoteKo: note ? note.ko : null
  };
}

function productNoteLine(b: JpBenchmarkClinic): string {
  const note = compareNote(b);
  if (!note) return '';
  return ` Product difference, tell the user: ${note.ko} / ${note.ja}`;
}

function jpClinicNotFoundLine(menu: MenuItem, name: string): string {
  const listed = (menu.jpBenchmarks ?? []).map((b) => b.nameJa).join(', ');
  let line =
    `No Japanese clinic matching '${name}' is among the clinics with a ${menu.nameKo} price ` +
    `in the data (${listed}), so a direct comparison is not possible. Compare with the Japan ` +
    `average and tell the user. If the user may mean one of these clinics, ask.`;
  const others = menusWithJpClinic(DATASET, name).filter((m) => m.id !== menu.id);
  if (others.length > 0) {
    line += ` A clinic matching '${name}' has prices for: ${others.map((m) => m.nameKo).join(', ')}.`;
  }
  return line;
}

function jpReference(menu: MenuItem, jpClinic: string | null | undefined): {
  benchmark: JpBenchmarkClinic | null;
  note: string;
} {
  if (!jpClinic || !jpClinic.trim()) return { benchmark: null, note: '' };
  const result = findJpClinic(menu, jpClinic);
  if (result.status === 'found') {
    const b = result.benchmarks[0];
    return {
      benchmark: b,
      note:
        `Direct comparison: the user's Japanese clinic ${b.nameJa} / ${b.nameKo}, ` +
        `${b.planJa} ¥${fmtNum(b.priceJpy)} (tax incl.). Each card also shows savings against it. ` +
        `Its unit may differ from ${menu.nameKo}; if so, say so.${productNoteLine(b)}`
    };
  }
  if (result.status === 'ambiguous') {
    const listed = result.benchmarks.map((b) => `${b.nameJa} (${b.planJa})`).join('; ');
    return {
      benchmark: null,
      note:
        `jp_clinic '${jpClinic}' matches several Japanese clinics: ${listed}. No direct ` +
        'comparison; ask which one and compare with the Japan average meanwhile.'
    };
  }
  return { benchmark: null, note: jpClinicNotFoundLine(menu, jpClinic) };
}

function noClinicNote(clinicName: string, tokens: string[], menuId: string): string {
  const found = DATASET.places.filter((p) => matchesPlace(p, tokens));
  if (found.length === 0) {
    return (
      `No clinic in the data matches clinic_name '${clinicName}'. ` +
      'Try fewer words, such as the brand only. Do not search outside the data.'
    );
  }
  const listed = found
    .slice(0, 5)
    .map(
      (p) =>
        `${p.nameKo} / ${p.nameJa}: ` +
        Object.keys(p.prices)
          .map((m) => getMenu(m)?.shortKo ?? m)
          .join(', ')
    )
    .join('; ');
  return (
    `Clinics matching '${clinicName}' have no price for ${menuId} in the data. ` +
    `They list prices for: ${listed}.`
  );
}

function buildRecommendationCard(
  row: ComputedRow,
  showDistance: boolean,
  fx: FxInfo,
  jpClinic: JpBenchmarkClinic | null
): RecommendationCardData {
  const jpPrices = (row.menu.jpBenchmarks ?? []).map((b) => b.priceJpy);
  const rating = getClinicAiRating(row.place, DATASET.places);
  const { channels, centralChannel } = buildBookingChannels(row.place.id);
  let jpClinicSavings: JpClinicSavings | null = null;
  if (jpClinic) {
    const savingsJpy = jpClinic.priceJpy - row.krTotalJpy;
    const savingsPct = jpClinic.priceJpy > 0 ? Math.round((savingsJpy / jpClinic.priceJpy) * 100) : 0;
    jpClinicSavings = {
      ...toJpClinicPrice(jpClinic),
      savingsJpy,
      savingsPct
    };
  }
  return {
    cardId: `${row.place.id}:${row.menu.id}`,
    placeId: row.place.id,
    menuId: row.menu.id,
    clinicNameJa: row.place.nameJa,
    clinicNameKo: row.place.nameKo,
    menuNameJa: row.menu.nameJa,
    menuNameKo: row.menu.nameKo,
    area: row.place.area as AgentAreaId,
    stationJa: row.place.stationJa,
    stationKo: row.place.stationKo,
    japaneseSupport: row.place.japaneseSupport,
    baseKrw: row.baseKrw,
    vatKrw: row.vatKrw,
    totalKrw: row.totalKrw,
    totalJpy: row.krTotalJpy,
    krwPer100Jpy: fx.krwPer100Jpy,
    fxDateLabel: fx.dateLabel,
    jpAverageJpy: row.jpBenchmarkJpy,
    jpMinJpy: jpPrices.length > 0 ? Math.min(...jpPrices) : row.jpBenchmarkJpy,
    jpMaxJpy: jpPrices.length > 0 ? Math.max(...jpPrices) : row.jpBenchmarkJpy,
    jpClinicCount: jpPrices.length,
    savingsJpy: row.savingsJpy,
    savingsPct: row.savingsPct,
    jpClinic: jpClinicSavings,
    distanceMeters: showDistance ? row.distanceMeters : null,
    walkMinutes: showDistance ? row.walkMinutes : null,
    priceTags: classifyPriceTags(row.place, row.menu.id, row.offer),
    priceConditionJa: row.place.caveatJa,
    priceConditionKo: row.place.caveatKo,
    priceNoteJa: row.offer.noteJa,
    priceNoteKo: row.offer.noteKo,
    sourceUrl: row.place.sourceUrl,
    rating: rating.overall,
    ratingScope: rating.reviewScope,
    ratingTier: rating.verificationTier,
    bookingChannels: channels,
    centralChannel,
    proof: buildPriceProof(row.place, row.menu.id)
  };
}

function summaryLine(rank: number, card: RecommendationCardData): string {
  const parts: string[] = [
    `${rank}. card_id=${card.cardId}`,
    `${card.clinicNameKo} / ${card.clinicNameJa} (${card.area})`,
    `₩${fmtNum(card.totalKrw)} incl. VAT ≈ ¥${fmtNum(card.totalJpy)}`,
    `saves ¥${fmtNum(card.savingsJpy)} (${card.savingsPct}%) vs Japan average`,
    `Japanese support: ${card.japaneseSupport ? 'yes' : 'no'}`,
    `rating ${card.rating}${card.ratingTier === 'limited' ? ' (few verified reviews)' : ''}`,
    `booking channels: ${channelNamesText(card.bookingChannels)}`
  ];
  if (card.jpClinic) {
    parts.splice(
      4,
      0,
      `saves ¥${fmtNum(card.jpClinic.savingsJpy)} (${card.jpClinic.savingsPct}%) vs ${card.jpClinic.nameJa}`
    );
  }
  if (card.distanceMeters !== null) {
    parts.push(`${fmtNum(card.distanceMeters)} m (walk ~${card.walkMinutes} min)`);
  }
  if (card.priceTags.length > 0) {
    parts.push(`price tags: ${card.priceTags.join(', ')}`);
  }
  if (card.priceConditionKo) {
    parts.push(`price condition: ${card.priceConditionKo} / ${card.priceConditionJa}`);
  }
  return parts.join(' | ');
}

export function toLocationCard(loc: LocationEntry, query: string | null): LocationCardData {
  return {
    locationId: loc.id,
    locationType: loc.type,
    query,
    nameJa: loc.nameJa,
    nameKo: loc.nameKo,
    lat: loc.lat,
    lng: loc.lng
  };
}

function runSearchClinics(input: Record<string, unknown>, fx: FxInfo): ToolExecutionResult {
  const menuId = String(input.menu_id ?? '');
  const menu = getMenu(menuId);
  if (!menu) {
    return {
      text: `Error: Unknown menu_id '${menuId}'. Choose from: ${MENU_IDS.join(', ')}.`,
      isError: true
    };
  }
  const sort = (['savings', 'distance', 'rating'].includes(String(input.sort ?? ''))
    ? String(input.sort)
    : 'savings') as SortId;
  const budgetObj =
    input.budget && typeof input.budget === 'object'
      ? (input.budget as { amount?: unknown; currency?: unknown })
      : null;
  const budget =
    budgetObj &&
    typeof budgetObj.amount === 'number' &&
    budgetObj.amount > 0 &&
    (budgetObj.currency === 'JPY' || budgetObj.currency === 'KRW')
      ? { amount: budgetObj.amount, currency: budgetObj.currency as 'JPY' | 'KRW' }
      : null;
  const maxDowntimeDays =
    typeof input.max_downtime_days === 'number' && input.max_downtime_days >= 0
      ? Math.floor(input.max_downtime_days)
      : null;
  const avoidNeedle = Boolean(input.avoid_needle);
  const japaneseOnly = Boolean(input.japanese_only);
  const area =
    typeof input.area === 'string' && AREA_IDS.includes(input.area)
      ? (input.area as AgentAreaId)
      : null;
  const originId = typeof input.origin_id === 'string' && input.origin_id.trim() ? input.origin_id.trim() : null;
  const clinicName =
    typeof input.clinic_name === 'string' && input.clinic_name.trim() ? input.clinic_name.trim() : null;
  const jpClinic =
    typeof input.jp_clinic === 'string' && input.jp_clinic.trim() ? input.jp_clinic.trim() : null;
  const limit = Math.max(1, Math.min(10, typeof input.limit === 'number' ? Math.round(input.limit) : 3));

  const locations = getLocationIndex();
  const loc = originId ? locations.get(originId) : null;
  if (originId && !loc) {
    return {
      text:
        `Error: Unknown origin_id '${originId}'. Use the location_id from a resolve_location ` +
        'result as is. If resolve_location did not find the place, search with origin_id=null.',
      isError: true
    };
  }
  const hasOrigin = Boolean(loc);
  const tokens = (clinicName ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const target: SearchTarget = {
    area,
    originId: loc ? loc.id : null,
    clinicTokens: tokens,
    clinicIds:
      tokens.length > 0
        ? DATASET.places
            .filter((p) => matchesPlace(p, tokens))
            .map((p) => p.id)
            .sort()
        : []
  };

  const name = `${menu.nameKo} / ${menu.nameJa}`;
  const downtimeMax = DOWNTIME_MAX_DAYS[menu.id] ?? 0;
  const usesNeedle = NEEDLE_MENUS.has(menu.id);

  const makeArtifact = (cards: RecommendationCardData[], excluded: Map<AgentExcludeReason, number>): SearchClinicsArtifact => ({
    menuId: menu.id,
    searchId: '',
    target,
    cards,
    exclusions: Array.from(excluded.entries())
      .filter(([, count]) => count > 0)
      .map(([reason, clinicCount]) => ({ menuId: menu.id, reason, clinicCount }))
  });

  const placeFilter = tokens.length > 0 ? (p: PlaceItem) => matchesPlace(p, tokens) : undefined;

  const countOffered = (): number =>
    buildRankedRows(DATASET, menu.id, area ?? 'all', 'savings', fx.krwPer100Jpy, true, {
      japaneseOnly,
      placeFilter
    }).length;

  if (avoidNeedle && usesNeedle) {
    const count = countOffered();
    let msg = `${name} uses a needle, so it is excluded. No clinics returned.`;
    if (count === 0 && tokens.length > 0) msg += ` ${noClinicNote(clinicName ?? '', tokens, menu.id)}`;
    return { text: msg, artifact: makeArtifact([], new Map([['needle', count]])) };
  }
  if (maxDowntimeDays !== null && downtimeMax > maxDowntimeDays) {
    const count = countOffered();
    let msg = `${name} can show visible downtime for up to ${downtimeMax} days, more than the allowed ${maxDowntimeDays}. No clinics returned.`;
    if (count === 0 && tokens.length > 0) msg += ` ${noClinicNote(clinicName ?? '', tokens, menu.id)}`;
    return { text: msg, artifact: makeArtifact([], new Map([['downtime', count]])) };
  }
  if (sort === 'distance' && !hasOrigin) {
    return {
      text:
        'Error: sort=distance needs origin_id. Call resolve_location with the place the user ' +
        'gave (hotel, home area or station) and pass its location_id. If the user has not ' +
        'given a place, ask for it once and search with sort=savings meanwhile.',
      isError: true
    };
  }

  const allRows = buildRankedRows(DATASET, menu.id, 'all', sort, fx.krwPer100Jpy, true, {
    japaneseOnly: false,
    placeFilter,
    origin: loc ? { lat: loc.lat, lng: loc.lng } : undefined
  });

  const excluded = new Map<AgentExcludeReason, number>();
  const bump = (r: AgentExcludeReason) => excluded.set(r, (excluded.get(r) ?? 0) + 1);
  const kept: ComputedRow[] = [];

  for (const row of allRows) {
    if (area && row.place.area !== area) bump('area');
    else if (japaneseOnly && !row.place.japaneseSupport) bump('japanese');
    else if (
      budget &&
      budget.amount < (budget.currency === 'JPY' ? row.krTotalJpy : row.totalKrw)
    ) {
      bump('budget');
    } else {
      kept.push(row);
    }
  }

  const top = kept.slice(0, limit);
  const { benchmark: refClinic, note: refNote } = jpReference(menu, jpClinic);
  const cards = top.map((r) => buildRecommendationCard(r, hasOrigin, fx, refClinic));

  const jpPrices = (menu.jpBenchmarks ?? []).map((b) => b.priceJpy);
  let benchmarkLine =
    `Japan benchmark: average of ${jpPrices.length} major Japanese clinics ` +
    `(tax incl.) ¥${fmtNum(menu.jpBenchmarkJpy)} ` +
    `(range ¥${fmtNum(Math.min(...jpPrices))}–¥${fmtNum(Math.max(...jpPrices))}).`;
  if (refNote) benchmarkLine += ` ${refNote}`;

  let matched = `${kept.length} clinics matched`;
  if (excluded.size > 0) {
    matched +=
      '; excluded: ' +
      Array.from(excluded.entries())
        .map(([r, n]) => `${n} ${EXCLUDE_LABEL[r]}`)
        .join(', ');
  }

  const lines: string[] = [
    `search_clinics: ${name}, sort=${sort}` +
      (tokens.length > 0 ? `, clinic_name='${clinicName}'` : '') +
      (loc ? `, distances from ${loc.nameKo} / ${loc.nameJa}` : '') +
      '.',
    benchmarkLine,
    `FX: ₩${fx.krwPer100Jpy} per ¥100 (${fx.bankKo}, ${fx.dateLabel}).`,
    `${matched}.`
  ];
  if (allRows.length === 0 && tokens.length > 0) {
    lines.push(noClinicNote(clinicName ?? '', tokens, menu.id));
  }
  if (top.length === 0) {
    lines.push('No clinics returned.');
  } else {
    lines.push(`Top ${top.length}:`);
    cards.forEach((c, idx) => lines.push(summaryLine(idx + 1, c)));
    lines.push('Search complete. Write the final JSON reply now without repeating this tool.');
  }

  return { text: lines.join('\n'), artifact: makeArtifact(cards, excluded) };
}

function runResolveLocation(input: Record<string, unknown>): ToolExecutionResult {
  const query = String(input.query ?? '').trim();
  if (!query) return { text: 'Error: query is required.', isError: true };
  const result = getLocationIndex().resolve(query);
  const head = `resolve_location: '${query}'`;
  const locLabel = (l: LocationEntry) =>
    `location_id=${l.id} (${l.nameKo} / ${l.nameJa}, ${l.type === 'area' ? 'area center' : 'station'})`;

  if (result.status === 'unknown') {
    const artifact: ResolveLocationArtifact = { status: 'unknown', location: null };
    return {
      text:
        `${head} → unknown. No area or station in the data matches. Do not guess a location. ` +
        'Ask the user once for the nearest subway station or one of the areas in the tool ' +
        'description, and search without origin_id until then.',
      artifact
    };
  }
  if (result.status === 'ambiguous') {
    const artifact: ResolveLocationArtifact = { status: 'ambiguous', location: null };
    const listed = result.locations.map(locLabel).join('; ');
    return {
      text:
        `${head} → ambiguous, it names several places: ${listed}. If the user is comparing them, ` +
        'call resolve_location once per place. Otherwise ask which one is their base.',
      artifact
    };
  }

  const loc = result.locations[0];
  const card = toLocationCard(loc, query);
  const artifact: ResolveLocationArtifact = { status: 'found', location: card };
  return {
    text:
      `${head} → found ${locLabel(loc)}. Pass origin_id='${loc.id}' to search_clinics. ` +
      'Distances will be straight-line distances from this point.',
    artifact
  };
}

function runMatchJpTreatment(input: Record<string, unknown>): ToolExecutionResult {
  const query = String(input.query ?? '').trim();
  const jpClinic =
    typeof input.jp_clinic === 'string' && input.jp_clinic.trim() ? input.jp_clinic.trim() : null;
  if (!query) return { text: 'Error: query is required.', isError: true };

  const result = matchJpName(query);
  const head = `match_jp_treatment: '${query}'`;
  const pendingClinic = jpClinic
    ? `\nThe user's Japanese clinic '${jpClinic}' was not looked up because the treatment is not settled. Pass it again as jp_clinic once the treatment is confirmed.`
    : '';
  const menuLabel = (m: MenuItem) => `menu_id=${m.id} (${m.nameKo} / ${m.nameJa})`;

  if (result.status === 'unknown') {
    const artifact: MatchJpTreatmentArtifact = { status: 'unknown', match: null, candidates: [] };
    return {
      text:
        `${head} → unknown. No Korean treatment in the data matches this name. Do not guess a ` +
        'match or name a similar treatment as if it were the same. Tell the user there is no ' +
        "matching treatment in Dopagaki's price data, and ask whether to recommend treatments by " +
        'their concern instead (recommend_treatments).' +
        pendingClinic,
      artifact
    };
  }

  if (result.status === 'ambiguous') {
    const candidates = result.menuIds
      .map((id) => getMenu(id))
      .filter((m): m is MenuItem => Boolean(m));
    const listed = `Candidates: ${candidates.map(menuLabel).join('; ')}.`;
    const directIds = new Set(
      result.entries.filter((e) => e.kind === 'direct').flatMap((e) => e.menuIds)
    );
    const lines =
      directIds.size > 1
        ? [
            `${head} → ambiguous, it names several different treatments. ${listed}`,
            'Call match_jp_treatment once per treatment name, or ask which one the user wants.'
          ]
        : [
            `${head} → ambiguous. Confirm with the user before searching. Do not call search_clinics for these yet.`,
            listed,
            ...result.entries.map(
              (e) => `Note for ${e.names.slice(0, 2).join(', ')}: ${e.reasonKo} / ${e.reasonJa}`
            ),
            "Ask once, e.g. 'Do you mean <Korean treatment>?', with each candidate as a quick answer option."
          ];
    const artifact: MatchJpTreatmentArtifact = {
      status: 'ambiguous',
      match: null,
      candidates: result.menuIds
    };
    return { text: lines.join('\n') + pendingClinic, artifact };
  }

  const menu = getMenu(result.menuIds[0])!;
  const kindOrder = ['direct', 'part', 'broad'];
  const entry = [...result.entries].sort(
    (a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind)
  )[0];
  const unit = UNIT_NOTES[menu.id] ?? { ko: '', ja: '' };
  const lines: string[] = [
    `${head} → found ${menuLabel(menu)}.`,
    `Why the names differ: ${entry.reasonKo} / ${entry.reasonJa}`,
    `Units: ${unit.ko} / ${unit.ja}`,
    `Next: call search_clinics with menu_id='${menu.id}'.`
  ];

  let clinicCard: JpClinicPrice | null = null;
  if (jpClinic) {
    const clinicRes = findJpClinic(menu, jpClinic);
    if (clinicRes.status === 'found') {
      const b = clinicRes.benchmarks[0];
      clinicCard = toJpClinicPrice(b);
      lines.push(
        `User's Japanese clinic: ${b.nameJa} / ${b.nameKo}: ${b.planJa} ¥${fmtNum(b.priceJpy)} (tax incl.).${productNoteLine(b)}`,
        `Pass jp_clinic='${b.nameJa}' to search_clinics. Each clinic card will then show savings against this clinic, calculated by the app. Do not calculate savings yourself.`,
        `The Japanese plan unit may differ from the Korean menu (${menu.nameKo}). If it does, say so.`
      );
    } else if (clinicRes.status === 'ambiguous') {
      const listed = clinicRes.benchmarks
        .map((b) => `${b.nameJa} / ${b.nameKo}: ${b.planJa} ¥${fmtNum(b.priceJpy)} (tax incl.)`)
        .join('; ');
      lines.push(
        `jp_clinic '${jpClinic}' matches several Japanese clinics with a price for this treatment: ${listed}. Ask which one the user went to. Until then, compare with the Japan average.`
      );
    } else {
      lines.push(jpClinicNotFoundLine(menu, jpClinic));
    }
  }

  const card: JpMatchCardData = {
    query,
    menuId: menu.id,
    menuNameJa: menu.nameJa,
    menuNameKo: menu.nameKo,
    reasonJa: entry.reasonJa,
    reasonKo: entry.reasonKo,
    unitNoteJa: unit.ja,
    unitNoteKo: unit.ko,
    jpClinic: clinicCard
  };
  const artifact: MatchJpTreatmentArtifact = {
    status: 'found',
    match: card,
    candidates: [menu.id]
  };
  return { text: lines.join('\n'), artifact };
}

function runRecommendTreatments(input: Record<string, unknown>): ToolExecutionResult {
  const rawConcerns = Array.isArray(input.concerns)
    ? input.concerns.map((c) => String(c))
    : [];
  if (rawConcerns.length === 0) {
    return { text: 'Error: concerns must be a non-empty array.', isError: true };
  }
  const maxDowntimeDays =
    typeof input.max_downtime_days === 'number' && input.max_downtime_days >= 0
      ? Math.floor(input.max_downtime_days)
      : null;
  const avoidNeedle = Boolean(input.avoid_needle);

  const supported: ConciergeConcernId[] = [];
  const validConcernIds = Object.keys(CONCERN_GUIDE) as ConciergeConcernId[];
  for (const c of rawConcerns) {
    if (c !== 'unsupported' && validConcernIds.includes(c as ConciergeConcernId)) {
      const cid = c as ConciergeConcernId;
      if (!supported.includes(cid)) supported.push(cid);
    }
  }

  const allowed = maxDowntimeDays === null ? 'no limit' : `${maxDowntimeDays} days`;
  const lines: string[] = [
    `recommend_treatments: concerns=${rawConcerns.join(', ')}, allowed downtime=${allowed}, avoid needle=${avoidNeedle ? 'yes' : 'no'}.`
  ];
  if (rawConcerns.includes('unsupported')) {
    lines.push(
      'Some of the user\'s concerns are not supported: Dopagaki has no treatment data for them. ' +
        'Tell the user plainly that the concern is not supported, without suggesting a treatment for it. ' +
        `Supported concerns: ${validConcernIds.join(', ')}.`
    );
  }
  if (supported.length === 0) return { text: lines.join('\n') };

  const lists = supported.map((c) => CONCERN_MENUS[c] ?? []);
  const maxLen = Math.max(0, ...lists.map((l) => l.length));
  const order: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (const ids of lists) {
      if (i < ids.length && !order.includes(ids[i])) order.push(ids[i]);
    }
  }

  const candidates: Array<{ menu: MenuItem; concerns: ConciergeConcernId[] }> = [];
  const excluded: Array<{ menu: MenuItem; reason: 'needle' | 'downtime' }> = [];

  for (const menuId of order) {
    const menu = getMenu(menuId);
    if (!menu) continue;
    const usesNeedle = NEEDLE_MENUS.has(menu.id);
    const downtimeMax = DOWNTIME_MAX_DAYS[menu.id] ?? 0;
    if (avoidNeedle && usesNeedle) {
      excluded.push({ menu, reason: 'needle' });
    } else if (maxDowntimeDays !== null && downtimeMax > maxDowntimeDays) {
      excluded.push({ menu, reason: 'downtime' });
    } else {
      const matched = supported.filter((c, idx) => lists[idx].includes(menuId));
      candidates.push({ menu, concerns: matched });
    }
  }

  const menuLabel = (m: MenuItem) => `${m.id} (${m.nameKo} / ${m.nameJa})`;
  if (candidates.length > 0) {
    lines.push('Candidates, best first (use menu_id with search_clinics):');
    candidates.forEach((c, idx) => {
      lines.push(
        `${idx + 1}. ${menuLabel(c.menu)} | for: ${c.concerns.join(', ')} | ` +
          `visible downtime up to ${DOWNTIME_MAX_DAYS[c.menu.id] ?? 0} days | ` +
          `needle: ${NEEDLE_MENUS.has(c.menu.id) ? 'yes' : 'no'}`
      );
    });
  } else {
    lines.push(
      'No treatment fits these conditions. Tell the user which condition excluded each one ' +
        'and ask whether they can relax it. Do not call search_clinics for an excluded treatment.'
    );
  }
  if (excluded.length > 0) {
    lines.push('Excluded:');
    for (const e of excluded) {
      const why =
        e.reason === 'needle'
          ? 'uses a needle and the user wants to avoid needles'
          : `visible downtime can last up to ${DOWNTIME_MAX_DAYS[e.menu.id] ?? 0} days, more than the allowed ${maxDowntimeDays} days`;
      lines.push(`- ${menuLabel(e.menu)}: ${why}`);
    }
  }
  return { text: lines.join('\n') };
}

function validateMonthDay(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined || raw === '') return null;
  const value = String(raw).trim();
  const parts = value.split('/').map((p) => p.trim());
  if (parts.length !== 2 || !parts.every((p) => /^\d+$/.test(p))) {
    return { error: "preferred_date must be month/day in digits, such as 11/28" };
  }
  const month = Number(parts[0]);
  const day = Number(parts[1]);
  const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month]) {
    return { error: `'${value}' is not a real date` };
  }
  return `${month}/${day}`;
}

function runGetBookingOptions(input: Record<string, unknown>, fx: FxInfo): ToolExecutionResult {
  const rawPlace = String(input.place_id ?? '').trim();
  if (!rawPlace) return { text: 'Error: place_id is required.', isError: true };

  const colonIdx = rawPlace.indexOf(':');
  const placeId = (colonIdx === -1 ? rawPlace : rawPlace.slice(0, colonIdx)).trim();
  const cardMenu = colonIdx === -1 ? '' : rawPlace.slice(colonIdx + 1).trim();

  let menuIds: string[] | null = Array.isArray(input.menu_ids)
    ? input.menu_ids.map((m) => String(m))
    : null;
  if (cardMenu && menuIds === null) {
    if (!MENU_IDS.includes(cardMenu)) {
      return {
        text: `Error: Unknown menu '${cardMenu}' in card_id. Pass place_id only, or a card_id from a search_clinics result as is.`,
        isError: true
      };
    }
    menuIds = [cardMenu];
  }

  const place = getPlace(placeId);
  if (!place) {
    return {
      text: `Error: Unknown place_id '${placeId}'. Use the part before ':' of a card_id from a search_clinics result. If you do not know which clinic the user means, ask.`,
      isError: true
    };
  }

  const dateCheck = validateMonthDay(input.preferred_date);
  if (dateCheck && typeof dateCheck === 'object') {
    return { text: `Error: ${dateCheck.error}`, isError: true };
  }

  const timeSlot = (['any', 'morning', 'afternoon', 'evening'].includes(String(input.time_slot ?? ''))
    ? String(input.time_slot)
    : 'any') as TimeSlot;
  const people = Math.max(1, Math.min(5, typeof input.people === 'number' ? Math.round(input.people) : 1));
  const firstVisit = input.first_visit === undefined ? true : Boolean(input.first_visit);
  const validReqs: OrderRequestId[] = ['no-upsell', 'total-first', 'gentle-numbing', 'one-hour'];
  const orderRequests: OrderRequestId[] = Array.isArray(input.order_requests)
    ? input.order_requests
        .map((r) => String(r) as OrderRequestId)
        .filter((r) => validReqs.includes(r))
    : [...DEFAULT_ORDER_REQUESTS];

  const requested = Array.from(new Set(menuIds ?? []));
  const { ko, ja } = inquiryMessages(place, DATASET.menus, requested, {
    date: dateCheck ?? '',
    timeSlot,
    people,
    firstVisit
  });
  const included = DATASET.menus
    .filter((m) => requested.includes(m.id) && Boolean(place.prices[m.id]))
    .map((m) => m.id);
  const order = orderSheetMessages(place, DATASET.menus, requested, {
    requests: orderRequests,
    krwPer100Jpy: fx.krwPer100Jpy,
    vatRate: DATASET.meta.vatRate
  });
  const { channels, centralChannel } = buildBookingChannels(place.id);

  const card: BookingCardData = {
    placeId: place.id,
    clinicNameJa: place.nameJa,
    clinicNameKo: place.nameKo,
    menuIds: included,
    japaneseSupport: place.japaneseSupport,
    channels,
    centralChannel,
    officialSiteUrl: place.sourceUrl,
    inquiryKo: ko,
    inquiryJa: ja,
    orderSheetKo: order.ko,
    orderSheetJa: order.ja,
    orderTotalKrw: order.totalKrw,
    orderTotalJpy: order.totalJpy,
    krwPer100Jpy: fx.krwPer100Jpy,
    fxDateLabel: fx.dateLabel
  };

  const lines: string[] = [
    `get_booking_options: ${place.nameKo} / ${place.nameJa}.`,
    `Booking channels: ${channelNamesText(channels)}. Their links are on the booking card; do not write URLs.`,
    'The card has two messages, each in Korean and Japanese: an inquiry to send through a channel before the visit, and an order sheet to show at the reception desk on the day. Do not paste them into the answer.',
    place.japaneseSupport
      ? 'Japanese support: yes. The user may send the Korean or the Japanese inquiry.'
      : 'Japanese support: no. Tell the user to send the Korean inquiry.'
  ];
  if (order.totalKrw > 0) {
    lines.push(
      `Order sheet total: ₩${fmtNum(order.totalKrw)} incl. VAT ≈ ¥${fmtNum(order.totalJpy)} (FX ₩${fx.krwPer100Jpy} per ¥100, ${fx.dateLabel}).`
    );
  }
  if (channels.length === 0) {
    lines.push('No booking channel in the data. Point the user to the official site on the card.');
  }
  if (centralChannel) {
    lines.push("The channel is the brand's shared desk; the user must name this branch when booking.");
  }
  const missing = requested.filter((m) => !included.includes(m));
  if (missing.length > 0) {
    lines.push(`This clinic has no price in the data for ${missing.join(', ')}; both messages leave it out.`);
  }
  lines.push('Dopa does not book or pay. The user books directly through the channel.');
  lines.push('Booking card ready. Write the final JSON reply now without calling more tools.');

  const artifact: GetBookingOptionsArtifact = { booking: card };
  return { text: lines.join('\n'), artifact };
}

function runSearchBundleClinics(input: Record<string, unknown>, fx: FxInfo): ToolExecutionResult {
  const rawMenus = Array.isArray(input.menu_ids)
    ? input.menu_ids.map((x) => String(x)).filter(Boolean)
    : [];
  const menuIds = Array.from(new Set(rawMenus));
  if (menuIds.length < 2) {
    return {
      text: 'Error: search_bundle_clinics requires at least 2 distinct menu_ids. Use search_clinics for a single treatment.',
      isError: true
    };
  }
  const menus = menuIds.map((id) => getMenu(id));
  const invalid = menuIds.filter((_, idx) => !menus[idx]);
  if (invalid.length > 0) {
    return { text: `Error: Unknown menu_ids: ${invalid.join(', ')}.`, isError: true };
  }
  const validMenus = menus as MenuItem[];

  const sort = (['savings', 'distance', 'rating'].includes(String(input.sort ?? 'savings'))
    ? String(input.sort ?? 'savings')
    : 'savings') as SortId;
  const area =
    typeof input.area === 'string' && AREA_IDS.includes(input.area)
      ? (input.area as AgentAreaId)
      : null;
  const originId =
    typeof input.origin_id === 'string' && input.origin_id.trim() ? input.origin_id.trim() : null;
  const japaneseOnly = Boolean(input.japanese_only);
  const avoidNeedle = Boolean(input.avoid_needle);
  const maxDowntimeDays =
    typeof input.max_downtime_days === 'number' && Number.isFinite(input.max_downtime_days)
      ? Math.max(0, Math.floor(input.max_downtime_days))
      : null;
  const limit =
    typeof input.limit === 'number' && Number.isFinite(input.limit)
      ? Math.max(1, Math.min(5, Math.floor(input.limit)))
      : 3;

  let budget: { amount: number; currency: 'JPY' | 'KRW' } | null = null;
  if (input.budget && typeof input.budget === 'object') {
    const b = input.budget as Record<string, unknown>;
    const amt = typeof b.amount === 'number' && b.amount >= 1 ? Math.floor(b.amount) : null;
    const cur = b.currency === 'JPY' || b.currency === 'KRW' ? b.currency : null;
    if (amt && cur) budget = { amount: amt, currency: cur };
  }

  const loc = originId ? getLocationIndex().get(originId) : null;
  if (originId && !loc) {
    return {
      text: `Error: Unknown origin_id '${originId}'. Call resolve_location first or pass origin_id=null.`,
      isError: true
    };
  }
  const hasOrigin = Boolean(loc);
  if (sort === 'distance' && !hasOrigin) {
    return {
      text: 'Error: sort=distance needs origin_id from resolve_location.',
      isError: true
    };
  }

  const target: SearchTarget = {
    area,
    originId: loc ? loc.id : null,
    clinicTokens: [],
    clinicIds: []
  };

  const makeArtifact = (
    cards: BundleCardData[],
    excluded: Map<AgentExcludeReason, number>,
    excludedMenuId = menuIds[0]
  ): SearchBundleArtifact => ({
    menuIds,
    searchId: '',
    target,
    cards,
    exclusions: Array.from(excluded.entries())
      .filter(([, count]) => count > 0)
      .map(([reason, clinicCount]) => ({ menuId: excludedMenuId, reason, clinicCount }))
  });

  // Check needle / downtime constraints across all bundled treatments
  if (avoidNeedle) {
    const needleMenu = validMenus.find((m) => NEEDLE_MENUS.has(m.id));
    if (needleMenu) {
      return {
        text: `${needleMenu.nameKo} / ${needleMenu.nameJa} uses a needle, so this bundle is excluded. Suggest a needle-free alternative.`,
        artifact: makeArtifact([], new Map([['needle', 1]]), needleMenu.id)
      };
    }
  }
  if (maxDowntimeDays !== null) {
    const dtMenu = validMenus.find((m) => (DOWNTIME_MAX_DAYS[m.id] ?? 0) > maxDowntimeDays);
    if (dtMenu) {
      const dtDays = DOWNTIME_MAX_DAYS[dtMenu.id] ?? 0;
      return {
        text: `${dtMenu.nameKo} / ${dtMenu.nameJa} can show visible recovery for up to ${dtDays} days, exceeding the ${maxDowntimeDays}-day return limit.`,
        artifact: makeArtifact([], new Map([['downtime', 1]]), dtMenu.id)
      };
    }
  }

  // Standalone single-treatment #1 winners under same area/japanese scope for comparison insight
  const singleWinners = validMenus.map((m) => {
    const rows = buildRankedRows(DATASET, m.id, area ?? 'all', 'savings', fx.krwPer100Jpy, true, {
      japaneseOnly
    });
    return { menu: m, winner: rows[0] ?? null };
  });

  const excluded = new Map<AgentExcludeReason, number>();
  const bump = (r: AgentExcludeReason) => excluded.set(r, (excluded.get(r) ?? 0) + 1);

  const candidates: Array<{
    card: BundleCardData;
    totalKrw: number;
    rating: number;
    distanceMeters: number;
  }> = [];

  for (const place of DATASET.places) {
    if (!validMenus.every((m) => Boolean(place.prices[m.id]))) continue;

    if (area && place.area !== area) {
      bump('area');
      continue;
    }
    if (japaneseOnly && !place.japaneseSupport) {
      bump('japanese');
      continue;
    }

    const items: BundleMenuItem[] = validMenus.map((menu) => {
      const offer = place.prices[menu.id]!;
      const vatKrw =
        place.vatExcluded && menu.vatAppliesInKorea
          ? Math.round(offer.krw * DATASET.meta.vatRate)
          : 0;
      const itemTotalKrw = offer.krw + vatKrw;
      const itemTotalJpy = krwToJpy(itemTotalKrw, fx.krwPer100Jpy);
      const itemSavingsJpy = menu.jpBenchmarkJpy - itemTotalJpy;
      const itemSavingsPct =
        menu.jpBenchmarkJpy > 0 ? Math.round((itemSavingsJpy / menu.jpBenchmarkJpy) * 100) : 0;
      return {
        menuId: menu.id,
        menuNameJa: menu.nameJa,
        menuNameKo: menu.nameKo,
        baseKrw: offer.krw,
        vatKrw,
        totalKrw: itemTotalKrw,
        totalJpy: itemTotalJpy,
        jpAverageJpy: menu.jpBenchmarkJpy,
        savingsJpy: itemSavingsJpy,
        savingsPct: itemSavingsPct,
        priceTags: classifyPriceTags(place, menu.id, offer),
        proof: buildPriceProof(place, menu.id)
      };
    });

    const totalKrw = items.reduce((sum, it) => sum + it.totalKrw, 0);
    const totalJpy = krwToJpy(totalKrw, fx.krwPer100Jpy);
    if (budget && budget.amount < (budget.currency === 'JPY' ? totalJpy : totalKrw)) {
      bump('budget');
      continue;
    }

    const jpTotalAverageJpy = items.reduce((sum, it) => sum + it.jpAverageJpy, 0);
    const savingsJpy = jpTotalAverageJpy - totalJpy;
    const savingsPct =
      jpTotalAverageJpy > 0 ? Math.round((savingsJpy / jpTotalAverageJpy) * 100) : 0;
    const dist = loc ? Math.round(haversineMeters(loc.lat, loc.lng, place.lat, place.lng)) : null;
    const walkMinutes = dist !== null ? Math.max(1, Math.round(dist / 80)) : null;
    const ratingInfo = getClinicAiRating(place, DATASET.places);
    const { channels, centralChannel } = buildBookingChannels(place.id);

    candidates.push({
      totalKrw,
      rating: ratingInfo.overall,
      distanceMeters: dist ?? Number.POSITIVE_INFINITY,
      card: {
        cardId: `${place.id}:bundle:${menuIds.join('+')}`,
        placeId: place.id,
        clinicNameJa: place.nameJa,
        clinicNameKo: place.nameKo,
        area: place.area as AgentAreaId,
        stationJa: place.stationJa,
        stationKo: place.stationKo,
        japaneseSupport: place.japaneseSupport,
        items,
        totalKrw,
        totalJpy,
        krwPer100Jpy: fx.krwPer100Jpy,
        fxDateLabel: fx.dateLabel,
        jpTotalAverageJpy,
        savingsJpy,
        savingsPct,
        distanceMeters: dist,
        walkMinutes,
        rating: ratingInfo.overall,
        ratingScope: ratingInfo.reviewScope,
        ratingTier: ratingInfo.verificationTier,
        bookingChannels: channels,
        centralChannel,
        sourceUrl: place.sourceUrl,
        differsFromSingleWinners: false,
        singleWinnersNoteJa: null,
        singleWinnersNoteKo: null
      }
    });
  }

  candidates.sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating || a.totalKrw - b.totalKrw;
    if (sort === 'distance') return a.distanceMeters - b.distanceMeters || a.totalKrw - b.totalKrw;
    return a.totalKrw - b.totalKrw || b.rating - a.rating;
  });

  const top = candidates.slice(0, limit).map((c) => c.card);

  // Annotate #1 bundle winner if single-treatment #1 clinics differ
  if (top.length > 0 && sort === 'savings') {
    const topPlaceId = top[0].placeId;
    const distinctWinners = singleWinners.filter(
      (sw) => sw.winner && sw.winner.place.id !== topPlaceId
    );
    if (distinctWinners.length > 0) {
      const koList = singleWinners
        .filter((sw) => sw.winner)
        .map((sw) => `${sw.menu.shortKo} 단독 1위 ${sw.winner!.place.nameKo}`)
        .join(' · ');
      const jaList = singleWinners
        .filter((sw) => sw.winner)
        .map((sw) => `${sw.menu.shortJa}単体最安 ${sw.winner!.place.nameJa}`)
        .join('・');
      top[0].differsFromSingleWinners = true;
      top[0].singleWinnersNoteKo = `단독 최저가는 다르지만(${koList}), 한 병원 묶음은 여기가 총액 최저가`;
      top[0].singleWinnersNoteJa = `単体最安は別院ですが(${jaList})、1院まとめならここが総額最安`;
    }
  }

  const bundleTitle = validMenus.map((m) => `${m.shortKo}/${m.shortJa}`).join(' + ');
  const lines: string[] = [
    `search_bundle_clinics: [${bundleTitle}], sort=${sort}` +
      (area ? `, area=${area}` : '') +
      (loc ? `, distances from ${loc.nameKo}/${loc.nameJa}` : '') +
      '.',
    `FX: ₩${fx.krwPer100Jpy} per ¥100 (${fx.bankKo}, ${fx.dateLabel}).`,
    `${candidates.length} clinics offer all ${validMenus.length} treatments together.`
  ];
  if (top.length === 0) {
    lines.push('No single clinic matched all treatments under these constraints.');
  } else {
    if (top[0].differsFromSingleWinners && top[0].singleWinnersNoteKo) {
      lines.push(`Bundle insight: ${top[0].singleWinnersNoteKo}`);
    }
    lines.push(`Top ${top.length} one-stop bundle clinics:`);
    top.forEach((c, idx) => {
      const itemStr = c.items
        .map((it) => `${it.menuNameKo} ₩${fmtNum(it.totalKrw)} (¥${fmtNum(it.totalJpy)})`)
        .join(' + ');
      lines.push(
        `${idx + 1}. card_id=${c.cardId} | ${c.clinicNameKo} / ${c.clinicNameJa} (${c.area}) | ` +
          `Bundle total ₩${fmtNum(c.totalKrw)} incl. VAT ≈ ¥${fmtNum(c.totalJpy)} ` +
          `(saves ¥${fmtNum(c.savingsJpy)} / ${c.savingsPct}% vs JP avg ¥${fmtNum(c.jpTotalAverageJpy)}) | ` +
          `items: ${itemStr} | rating ${c.rating.toFixed(1)}/5 | JP ${c.japaneseSupport ? 'yes' : 'no'}`
      );
    });
    lines.push('Bundle search complete. Write the final JSON reply now without repeating this tool.');
  }

  return { text: lines.join('\n'), artifact: makeArtifact(top, excluded) };
}

export function executeTool(
  name: string,
  input: Record<string, unknown>,
  fx: FxInfo
): ToolExecutionResult {
  try {
    switch (name) {
      case 'search_clinics':
        return runSearchClinics(input, fx);
      case 'search_bundle_clinics':
        return runSearchBundleClinics(input, fx);
      case 'resolve_location':
        return runResolveLocation(input);
      case 'match_jp_treatment':
        return runMatchJpTreatment(input);
      case 'recommend_treatments':
        return runRecommendTreatments(input);
      case 'get_booking_options':
        return runGetBookingOptions(input, fx);
      default:
        return { text: `Error: Unknown tool '${name}'.`, isError: true };
    }
  } catch (err) {
    return {
      text: `Error: ${err instanceof Error ? err.message : 'tool execution failed'}`,
      isError: true
    };
  }
}

const MENU_LINES = DATASET.menus
  .map(
    (m) =>
      `- ${m.id}: ${m.nameKo} / ${m.nameJa} (회복 최대 ${DOWNTIME_MAX_DAYS[m.id] ?? 0}일, 바늘 ${NEEDLE_MENUS.has(m.id) ? '사용' : '없음'})`
  )
  .join('\n');

const AREA_NAMES = DATASET.areas
  .filter((a) => a.id !== 'all')
  .map((a) => `${areaParts(a.nameKo).join('・')} / ${areaParts(a.nameJa).join('・')}`)
  .join('; ');

const CONCERN_LINES = Object.entries(CONCERN_GUIDE)
  .map(([cid, text]) => `- ${cid}: ${text}`)
  .join('\n');

export const ANTHROPIC_TOOLS: Tool[] = [
  {
    name: 'search_clinics',
    description:
      '서울 병원 가격 데이터에서 시술 하나를 받는 병원을 찾아 상위 몇 곳을 돌려준다.\n' +
      '가격·엔화 환산·일본 대비 절약액은 web 순위표와 같은 계산이다. 답변의 금액은 이 결과만 쓴다.\n' +
      '필수 입력: menu_id. 기본값: 절약액 순, 상위 3곳, 예산·회복 기간·지역 제한 없음.\n' +
      '사용자가 숙소·사는 곳·역을 말했으면 먼저 resolve_location을 부르고, 결과의 location_id를 origin_id에 넣는다.\n' +
      '결과의 병원은 모두 카드로 화면에 나간다. card_reasons에 card_id마다 추천 이유 한 줄을 쓴다.\n' +
      '같은 턴에 같은 시술을 범위만 좁히거나 넓혀 다시 부르면 마지막 결과의 카드만 나간다. 지역·기준 위치·지점(clinic_name)이 서로 다른 대상을 부르면 비교로 보고 모두 나간다.\n' +
      '시술명 없이 고민만 말했으면 recommend_treatments를 먼저 부른다. 아래 목록과 다른 일본 시술명(ハイフ, HIFU, ブナジュ, 하이후 등)으로 물었으면 match_jp_treatment를 먼저 부르고, menu_id를 직접 짐작하지 않는다.\n' +
      `시술 목록:\n${MENU_LINES}`,
    input_schema: {
      type: 'object',
      properties: {
        menu_id: { type: 'string', enum: MENU_IDS, description: '시술 ID' },
        sort: {
          type: 'string',
          enum: ['savings', 'distance', 'rating'],
          description: '정렬 기준. 기본 savings. distance는 origin_id 필요'
        },
        budget: {
          type: ['object', 'null'],
          properties: {
            amount: { type: 'integer', minimum: 1 },
            currency: { type: 'string', enum: ['JPY', 'KRW'] }
          },
          required: ['amount', 'currency'],
          additionalProperties: false,
          description: '1회 시술 예산. 제한 없으면 null'
        },
        max_downtime_days: {
          type: ['integer', 'null'],
          minimum: 0,
          description: '허용 회복 기간(일). 말하지 않았으면 null'
        },
        avoid_needle: { type: 'boolean', description: '바늘 시술 기피 시 true' },
        japanese_only: { type: 'boolean', description: '일본어 상담 가능 병원만' },
        area: {
          type: ['string', 'null'],
          enum: [...AREA_IDS, null],
          description: '특정 지역 필터'
        },
        origin_id: {
          type: ['string', 'null'],
          description: 'resolve_location 결과의 location_id (예: area:hongdae, station:홍대입구)'
        },
        clinic_name: {
          type: ['string', 'null'],
          description: "특정 병원·지점 검색어 (예: '밴스 홍대', 'バンス 明洞')"
        },
        jp_clinic: {
          type: ['string', 'null'],
          description: "직접 비교할 일본 병원 이름 (예: '品川', 'SBC')"
        },
        limit: { type: 'integer', minimum: 1, maximum: 10, description: '돌려줄 병원 수 (기본 3)' }
      },
      required: ['menu_id'],
      additionalProperties: false
    }
  },
  {
    name: 'search_bundle_clinics',
    description:
      '서울 137곳 전체에서 2~5개 시술을 같은 병원에서 한 번에 묶어 받을 때 가장 저렴한 병원을 찾는다.\n' +
      '단일 시술 최저가 병원과 묶음 최저가 병원이 다를 수 있으므로, 사용자가 2개 이상 시술을 같이 받으려 하거나 묶음 추천을 원하면 반드시 이 도구를 부른다.\n' +
      '부가세 10% 포함 총액(KRW/JPY)·일본 평균 합계 대비 절약액·단독 1위 병원과의 차이를 정확히 계산해 BundleCard로 보여준다.\n' +
      '시술 ID는 search_clinics의 시술 목록과 동일하다.',
    input_schema: {
      type: 'object',
      properties: {
        menu_ids: {
          type: 'array',
          items: { type: 'string', enum: MENU_IDS },
          minItems: 2,
          maxItems: 5,
          description: '한 병원에서 함께 받을 시술 ID 배열 (2~5개)'
        },
        sort: {
          type: 'string',
          enum: ['savings', 'distance', 'rating'],
          description: '정렬 기준. 기본 savings(묶음 총액 최저가순). distance는 origin_id 필요'
        },
        budget: {
          type: ['object', 'null'],
          properties: {
            amount: { type: 'integer', minimum: 1 },
            currency: { type: 'string', enum: ['JPY', 'KRW'] }
          },
          required: ['amount', 'currency'],
          additionalProperties: false,
          description: '묶음 전체 예산. 제한 없으면 null'
        },
        max_downtime_days: {
          type: ['integer', 'null'],
          minimum: 0,
          description: '허용 회복 기간(일). 귀국 일정이 있으면 입력'
        },
        avoid_needle: { type: 'boolean', description: '바늘·주사 기피 시 true' },
        japanese_only: { type: 'boolean', description: '일본어 상담 가능 병원만' },
        area: {
          type: ['string', 'null'],
          enum: [...AREA_IDS, null],
          description: '특정 지역 필터'
        },
        origin_id: {
          type: ['string', 'null'],
          description: 'resolve_location 결과의 location_id'
        },
        limit: { type: 'integer', minimum: 1, maximum: 5, description: '돌려줄 묶음 병원 수 (기본 3)' }
      },
      required: ['menu_ids'],
      additionalProperties: false
    }
  },
  {
    name: 'resolve_location',
    description:
      '사용자가 말한 위치(숙소, 사는 동네, 역)를 위치 ID로 바꾼다. 아래 서울 지역 12곳과 병원 근처 역만 안다.\n' +
      '필수 입력: query. 사용자가 숙소·기준 위치를 말하면 search_clinics보다 먼저 부르고, 결과의 location_id를 search_clinics의 origin_id에 그대로 넣는다.\n' +
      '못 찾으면(unknown) 위치를 지어내지 말고 가까운 역이나 아래 지역 이름을 한 번 묻는다.\n' +
      '가타카나 읽기(ホンデ, カンナム 등)는 한국어나 한자 이름(홍대, 弘大)으로 바꿔 넣는다.\n' +
      `지역: ${AREA_NAMES}`,
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          minLength: 1,
          maxLength: 50,
          description: "위치 표현 (예: '홍대 숙소', '명동역 근처', '江南駅')"
        }
      },
      required: ['query'],
      additionalProperties: false
    }
  },
  {
    name: 'match_jp_treatment',
    description:
      '일본에서 쓰는 시술 이름(ハイフ·하이후, HIFU, ブナジュ, エラボトックス 등)을 서울 가격 데이터의 한국 시술로 바꾼다.\n' +
      '필수 입력: query(사용자가 말한 일본 시술명 그대로). 사용자가 다니던 일본 병원을 말했으면 jp_clinic에 넣는다.\n' +
      '시술명이 search_clinics 시술 목록의 이름과 다르면 search_clinics보다 먼저 부른다. 대응을 직접 짐작하지 않는다.\n' +
      'found면 한국 이름과 이름이 다른 이유를 먼저 말하고 menu_id로 search_clinics를 부른다. ambiguous면 후보를 버튼으로 한 번 묻는다. unknown이면 대응 시술이 없다고 말하고 고민 기준 추천으로 넘어갈지 묻는다.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          minLength: 1,
          maxLength: 50,
          description: "사용자가 말한 일본 시술명 그대로 (예: 'ハイフ', 'HIFU', 'ブナジュ', '하이후')"
        },
        jp_clinic: {
          type: ['string', 'null'],
          maxLength: 50,
          description: "사용자가 다니던 일본 병원 이름 (예: '品川', 'SBC')"
        }
      },
      required: ['query'],
      additionalProperties: false
    }
  },
  {
    name: 'recommend_treatments',
    description:
      '사용자의 피부 고민을 고민별 시술표로 시술 후보와 제외 이유로 바꾼다. 시술명을 말하지 않고 고민만 말했을 때 쓴다.\n' +
      '필수 입력: concerns. 기본값: 회복 기간 제한 없음, 바늘 상관없음.\n' +
      `고민 분류:\n${CONCERN_LINES}\n` +
      "어느 분류에도 맞지 않는 고민(예: 탈모, 점·문신 제거, 체형)은 'unsupported'로 넣는다.\n" +
      '결과를 받은 뒤 후보를 고른 이유와 제외 이유를 짧게 설명하고, 첫 번째 후보로 search_clinics를 같은 max_downtime_days·avoid_needle로 부른다.',
    input_schema: {
      type: 'object',
      properties: {
        concerns: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['pores', 'glow', 'lift', 'dry', 'jaw', 'skinbase', 'unsupported']
          },
          minItems: 1,
          maxItems: 4,
          description: '고민 분류 배열 (우선순위 순)'
        },
        max_downtime_days: {
          type: ['integer', 'null'],
          minimum: 0,
          description: '허용 회복 기간(일)'
        },
        avoid_needle: { type: 'boolean', description: '바늘·주사 기피 여부' }
      },
      required: ['concerns'],
      additionalProperties: false
    }
  },
  {
    name: 'get_booking_options',
    description:
      '병원 한 곳의 공식 예약·상담 채널(LINE, 카카오톡, 네이버 예약, 인스타그램, 공식 웹 예약)과 한국어·일본어 문의 문장·접수 메모를 만든다.\n' +
      '결과는 화면에 예약 카드로 나간다. 채널 링크와 문장은 카드에만 있으니 답변에 URL이나 문장을 옮겨 적지 않는다.\n' +
      '필수 입력: place_id(search_clinics 결과의 card_id 앞부분 또는 card_id 그대로).\n' +
      '예약과 결제는 앱이 대신하지 않는다. 사용자가 채널에서 직접 문의·예약한다고 안내한다.',
    input_schema: {
      type: 'object',
      properties: {
        place_id: {
          type: 'string',
          minLength: 1,
          maxLength: 60,
          description: "병원 ID 또는 card_id (예: 'vands-hongdae' 또는 'vands-hongdae:shrink-300')"
        },
        menu_ids: {
          type: ['array', 'null'],
          items: { type: 'string', enum: MENU_IDS },
          maxItems: 3,
          description: '문의·접수 메모에 넣을 시술 ID 목록. null이면 card_id의 시술 사용'
        },
        preferred_date: {
          type: ['string', 'null'],
          maxLength: 20,
          description: "희망 날짜 월/일 숫자 (예: '11/28'). 상대 날짜면 null"
        },
        time_slot: {
          type: 'string',
          enum: ['any', 'morning', 'afternoon', 'evening'],
          description: '희망 시간대 (기본 any)'
        },
        people: { type: 'integer', minimum: 1, maximum: 5, description: '방문 인원 (기본 1)' },
        first_visit: { type: 'boolean', description: '초진 여부 (기본 true)' },
        order_requests: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['no-upsell', 'total-first', 'gentle-numbing', 'one-hour']
          },
          maxItems: 4,
          description: '접수 메모 부탁 목록 (기본 no-upsell, total-first)'
        }
      },
      required: ['place_id'],
      additionalProperties: false
    }
  }
];
