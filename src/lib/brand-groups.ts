import type { ComputedRow, Lang, PlaceItem } from '../types.ts';
import { isNewClinic } from '../data/brand-reviews.ts';

export interface BrandGroup {
  key: string;
  labelKo: string;
  labelJa: string;
  /** Branch rows in the incoming (already sorted) order. */
  rows: ComputedRow[];
  minJpy: number;
  maxJpy: number;
  /** Savings % vs. the Japan benchmark at the cheapest branch. */
  bestSavingsPct: number;
  jpCount: number;
  avgAiRating: number;
}

/** "밴스의원 홍대점" → { brand: "밴스의원", branch: "홍대점" } */
export function splitPlaceName(name: string): { brand: string; branch: string } {
  const trimmed = name.trim();
  const i = trimmed.lastIndexOf(' ');
  if (i <= 0) return { brand: trimmed, branch: trimmed };
  return { brand: trimmed.slice(0, i), branch: trimmed.slice(i + 1) };
}

export function branchLabel(place: PlaceItem, lang: Lang): string {
  return splitPlaceName(lang === 'ja' ? place.nameJa : place.nameKo).branch;
}

/**
 * Groups ranked rows by brand. Group order follows the first appearance of
 * each brand in `rows`, so whatever sort the rows already have (savings,
 * AI rating, distance) ranks the brands by their best branch.
 */
export function groupRowsByBrand(rows: ComputedRow[]): BrandGroup[] {
  const byKey = new Map<string, BrandGroup>();
  const order: BrandGroup[] = [];

  for (const row of rows) {
    const key = row.place.brandJa;
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        labelKo: splitPlaceName(row.place.nameKo).brand,
        labelJa: splitPlaceName(row.place.nameJa).brand,
        rows: [],
        minJpy: Infinity,
        maxJpy: -Infinity,
        bestSavingsPct: 0,
        jpCount: 0,
        avgAiRating: 0
      };
      byKey.set(key, group);
      order.push(group);
    }
    group.rows.push(row);
    if (row.krTotalJpy < group.minJpy) {
      group.minJpy = row.krTotalJpy;
      group.bestSavingsPct = row.savingsPct;
    }
    if (row.krTotalJpy > group.maxJpy) group.maxJpy = row.krTotalJpy;
    if (row.place.japaneseSupport) group.jpCount += 1;
  }

  for (const group of order) {
    const rated = group.rows.filter((r) => !isNewClinic(r.place.id));
    const pool = rated.length > 0 ? rated : group.rows;
    const sum = pool.reduce((acc, r) => acc + r.aiRating, 0);
    group.avgAiRating = Math.round((sum / pool.length) * 10) / 10;
  }

  return order;
}

/** Cheapest branch of each brand, lowest first: one card per brand so a TOP list isn't one chain repeated. */
export function pickTopDeals(rows: ComputedRow[], n = 3): ComputedRow[] {
  return groupRowsByBrand(rows)
    .map((g) => g.rows.reduce((a, r) => (r.krTotalJpy < a.krTotalJpy ? r : a)))
    .sort((a, b) => a.krTotalJpy - b.krTotalJpy)
    .slice(0, n);
}
