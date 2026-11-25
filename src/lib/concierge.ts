import type { AreaId, ComputedRow, MenuItem, PriceDataset } from '../types.ts';
import { computeRow, computeSeoulAverage } from './calc.ts';

/**
 * 予算コンシェルジュ: picks treatments that fit a budget and a schedule.
 * Every price comes from computeRow (the same calculation as the ranking list);
 * this module only filters, sorts and combines those rows.
 */

export type VisitorType = 'traveler' | 'resident';
export type ConciergeConcernId = 'pores' | 'glow' | 'lift' | 'dry' | 'jaw' | 'skinbase';
/** traveler: days until the flight home / resident: days until the next event that needs a clean face. */
export type ConciergeTimingId = 'soon' | 'few' | 'free';

export interface ConciergeAnswers {
  visitor: VisitorType;
  /** Traveler budget in JPY, resident budget in KRW; null = no limit. */
  budget: number | null;
  timing: ConciergeTimingId;
  /** Resident base area (ignored for travelers). */
  areaId: Exclude<AreaId, 'all'> | null;
  concerns: ConciergeConcernId[];
  noNeedle: boolean;
}

export interface ConciergeOptions {
  krwPer100Jpy: number;
  includeVat: boolean;
}

/** Worst-case visible downtime in days, read from the TREATMENT_DOWNTIME copy (clinic-helpers.ts). */
export const DOWNTIME_MAX_DAYS: Record<string, number> = {
  'rejuran-2cc': 3,
  'shrink-300': 0,
  potenza: 4,
  'jaw-botox': 0,
  'juvelook-2cc': 2,
  're2o-5cc': 3,
  'inmode-fx': 5,
  lalapeel: 0,
  aquapeel: 0
};

/** Treatments that use a needle or microneedles. */
export const NEEDLE_MENUS = new Set(['rejuran-2cc', 'potenza', 'jaw-botox', 'juvelook-2cc', 're2o-5cc']);

/** Concern chip → treatments, most direct first. */
export const CONCERN_MENUS: Record<ConciergeConcernId, string[]> = {
  pores: ['potenza', 'aquapeel', 'juvelook-2cc'],
  glow: ['lalapeel', 'aquapeel', 'rejuran-2cc'],
  lift: ['shrink-300', 'inmode-fx'],
  dry: ['rejuran-2cc', 'juvelook-2cc', 're2o-5cc'],
  jaw: ['jaw-botox'],
  skinbase: ['re2o-5cc', 'juvelook-2cc', 'rejuran-2cc']
};

export const TRAVELER_BUDGETS_JPY: Array<number | null> = [5000, 10000, 30000, null];
export const RESIDENT_BUDGETS_KRW: Array<number | null> = [30000, 50000, 100000, null];
export const RESIDENT_AREAS: Array<Exclude<AreaId, 'all'>> = [
  'sinchon',
  'hongdae',
  'gangnam',
  'myeongdong',
  'seongsu',
  'yeouido',
  'jamsil',
  'gwanak'
];

/** Treatment time in minutes, read from the menu's own note ("施術約40分…"); null if the note has none. */
export function treatmentMinutes(menu: Pick<MenuItem, 'leadTimeNoteJa'>): number | null {
  const m = /約\s*(\d+)\s*分/.exec(menu.leadTimeNoteJa ?? '');
  return m ? Number(m[1]) : null;
}

export function formatMinutes(minutes: number, isJa: boolean): string {
  return isJa ? `約${minutes}分` : `약 ${minutes}분`;
}

/** Allowed downtime (days) for each timing answer. */
export function allowedDowntimeDays(visitor: VisitorType, timing: ConciergeTimingId): number {
  if (timing === 'soon') return 0;
  if (timing === 'few') return 2;
  return visitor === 'traveler' ? 4 : Number.POSITIVE_INFINITY;
}

const NEAR_RADIUS_M = 3000;
const WIDE_RADIUS_M = 6000;

export interface ConciergeOffer {
  menu: MenuItem;
  row: ComputedRow;
  downtimeDays: number;
}

export type ConciergeExcludeReason = 'downtime' | 'needle' | 'budget' | 'nodata';

export interface ConciergeExcluded {
  menu: MenuItem;
  reason: ConciergeExcludeReason;
  downtimeDays: number;
  cheapest: ConciergeOffer | null;
}

export interface ConciergeCombo {
  items: ConciergeOffer[];
  sameClinic: boolean;
  totalKrw: number;
  totalJpy: number;
  jpTotalJpy: number;
  saveJpy: number;
  seoulSaveKrw: number;
  /** Budget left, in the budget currency; null when there is no limit. */
  remaining: number | null;
}

export interface ConciergeResult {
  best: ConciergeOffer | null;
  combo: ConciergeCombo | null;
  /** Resident only: the most relevant treatment held back by budget or schedule. */
  nextPlan: ConciergeExcluded | null;
  excluded: ConciergeExcluded[];
  /** When nothing fits the budget: the cheapest relevant option. */
  cheapestOverBudget: ConciergeOffer | null;
  candidateMenuIds: string[];
}

function spentIn(visitor: VisitorType, krw: number, jpy: number): number {
  return visitor === 'traveler' ? jpy : krw;
}

function fitsBudget(visitor: VisitorType, budget: number | null, krw: number, jpy: number): boolean {
  return budget === null || spentIn(visitor, krw, jpy) <= budget;
}

function subsets(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let mask = 1; mask < 1 << ids.length; mask += 1) {
    const pick = ids.filter((_, i) => mask & (1 << i));
    if (pick.length >= 2 && pick.length <= 3) out.push(pick);
  }
  return out;
}

export function candidateMenuIds(concerns: ConciergeConcernId[], dataset: PriceDataset): string[] {
  const known = new Set(dataset.menus.map((m) => m.id));
  if (concerns.length === 0) return dataset.menus.map((m) => m.id);
  const lists = concerns.map((c) => CONCERN_MENUS[c] ?? []);
  const longest = Math.max(0, ...lists.map((l) => l.length));
  const out: string[] = [];
  // Interleave so every chosen concern gets its most direct treatment first.
  for (let i = 0; i < longest; i += 1) {
    for (const list of lists) {
      const id = list[i];
      if (id && known.has(id) && !out.includes(id)) out.push(id);
    }
  }
  return out;
}

export function planConcierge(
  answers: ConciergeAnswers,
  dataset: PriceDataset,
  options: ConciergeOptions
): ConciergeResult {
  const { visitor, budget } = answers;
  const vatRate = dataset.meta.vatRate;
  const area =
    visitor === 'resident' && answers.areaId ? dataset.areas.find((a) => a.id === answers.areaId) : undefined;
  const origin = area ?? dataset.meta.venue;
  const maxDowntime = allowedDowntimeDays(visitor, answers.timing);
  const menuIds = candidateMenuIds(answers.concerns, dataset);
  const menus = menuIds
    .map((id) => dataset.menus.find((m) => m.id === id))
    .filter((m): m is MenuItem => Boolean(m));

  const rowsByMenu = new Map<string, ComputedRow[]>();
  for (const menu of menus) {
    const seoulAvg = computeSeoulAverage(dataset.places, menu, options.krwPer100Jpy, options.includeVat, vatRate);
    const rows = dataset.places
      .map((p) =>
        computeRow(p, menu, options.krwPer100Jpy, options.includeVat, vatRate, origin.lat, origin.lng, seoulAvg)
      )
      .filter((r): r is ComputedRow => r !== null);
    rowsByMenu.set(menu.id, rows);
  }

  /** Clinics we would actually send this visitor to, cheapest first. */
  const poolFor = (rows: ComputedRow[]): ComputedRow[] => {
    let pool: ComputedRow[];
    if (visitor === 'resident' && area) {
      pool = rows.filter((r) => r.distanceMeters <= NEAR_RADIUS_M);
      if (pool.length === 0) pool = rows.filter((r) => r.distanceMeters <= WIDE_RADIUS_M);
    } else {
      pool = rows.filter((r) => r.place.japaneseSupport);
      if (pool.length === 0) pool = rows;
    }
    return [...pool].sort((a, b) => a.totalKrw - b.totalKrw || a.distanceMeters - b.distanceMeters);
  };

  const eligible: ConciergeOffer[] = [];
  const excluded: ConciergeExcluded[] = [];
  for (const menu of menus) {
    const downtimeDays = DOWNTIME_MAX_DAYS[menu.id] ?? 0;
    const top = poolFor(rowsByMenu.get(menu.id) ?? [])[0];
    const cheapest: ConciergeOffer | null = top ? { menu, row: top, downtimeDays } : null;
    if (!cheapest) {
      excluded.push({ menu, reason: 'nodata', downtimeDays, cheapest: null });
    } else if (answers.noNeedle && NEEDLE_MENUS.has(menu.id)) {
      excluded.push({ menu, reason: 'needle', downtimeDays, cheapest });
    } else if (downtimeDays > maxDowntime) {
      excluded.push({ menu, reason: 'downtime', downtimeDays, cheapest });
    } else if (!fitsBudget(visitor, budget, cheapest.row.totalKrw, cheapest.row.krTotalJpy)) {
      excluded.push({ menu, reason: 'budget', downtimeDays, cheapest });
    } else {
      eligible.push(cheapest);
    }
  }

  // Best single pick: travelers want the biggest saving vs Japan, residents the cheapest nearby.
  let best: ConciergeOffer | null = null;
  for (const offer of eligible) {
    if (!best) {
      best = offer;
      continue;
    }
    const better =
      visitor === 'traveler'
        ? offer.row.savingsJpy > best.row.savingsJpy
        : offer.row.totalKrw < best.row.totalKrw ||
          (offer.row.totalKrw === best.row.totalKrw && offer.row.distanceMeters < best.row.distanceMeters);
    if (better) best = offer;
  }

  const finishCombo = (items: ConciergeOffer[], sameClinic: boolean): ConciergeCombo => {
    const totalKrw = items.reduce((s, o) => s + o.row.totalKrw, 0);
    const totalJpy = items.reduce((s, o) => s + o.row.krTotalJpy, 0);
    const jpTotalJpy = items.reduce((s, o) => s + o.row.jpBenchmarkJpy, 0);
    const seoulSaveKrw = items.reduce((s, o) => s + o.row.seoulDiffKrw, 0);
    return {
      items,
      sameClinic,
      totalKrw,
      totalJpy,
      jpTotalJpy,
      saveJpy: jpTotalJpy - totalJpy,
      seoulSaveKrw,
      remaining: budget === null ? null : budget - spentIn(visitor, totalKrw, totalJpy)
    };
  };

  const downtimeOf = new Map(eligible.map((o) => [o.menu.id, o.downtimeDays]));
  const eligibleIds = eligible.map((o) => o.menu.id);
  let combo: ConciergeCombo | null = null;

  if (eligibleIds.length >= 2 && visitor === 'traveler') {
    // Travelers: 2–3 treatments in ONE clinic visit, maximising the saving vs Japan.
    for (const jpOnly of [true, false]) {
      for (const place of dataset.places) {
        if (jpOnly && !place.japaneseSupport) continue;
        for (const pick of subsets(eligibleIds)) {
          const items: ConciergeOffer[] = [];
          for (const id of pick) {
            const row = (rowsByMenu.get(id) ?? []).find((r) => r.place.id === place.id);
            if (!row) break;
            items.push({ menu: row.menu, row, downtimeDays: downtimeOf.get(id) ?? 0 });
          }
          if (items.length !== pick.length) continue;
          const c = finishCombo(items, true);
          if (!fitsBudget(visitor, budget, c.totalKrw, c.totalJpy)) continue;
          if (!combo || c.saveJpy > combo.saveJpy || (c.saveJpy === combo.saveJpy && c.totalJpy < combo.totalJpy)) {
            combo = c;
          }
        }
      }
      if (combo) break;
    }
  } else if (eligibleIds.length >= 2) {
    // Residents: each treatment at its cheapest nearby clinic, maximising the saving vs the Seoul average.
    const byId = new Map(eligible.map((o) => [o.menu.id, o]));
    for (const pick of subsets(eligibleIds)) {
      const items = pick.map((id) => byId.get(id)!);
      const c = finishCombo(items, new Set(items.map((o) => o.row.place.id)).size === 1);
      if (!fitsBudget(visitor, budget, c.totalKrw, c.totalJpy)) continue;
      if (
        !combo ||
        c.seoulSaveKrw > combo.seoulSaveKrw ||
        (c.seoulSaveKrw === combo.seoulSaveKrw && c.totalKrw < combo.totalKrw)
      ) {
        combo = c;
      }
    }
  }

  const nextPlan =
    visitor === 'resident'
      ? excluded.find((e) => (e.reason === 'budget' || e.reason === 'downtime') && e.cheapest) ?? null
      : null;

  let cheapestOverBudget: ConciergeOffer | null = null;
  if (!best) {
    for (const e of excluded) {
      if (e.reason !== 'budget' || !e.cheapest) continue;
      if (!cheapestOverBudget || e.cheapest.row.totalKrw < cheapestOverBudget.row.totalKrw) {
        cheapestOverBudget = e.cheapest;
      }
    }
  }

  return { best, combo, nextPlan, excluded, cheapestOverBudget, candidateMenuIds: menuIds };
}
