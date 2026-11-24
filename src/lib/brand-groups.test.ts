import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PriceDataset } from '../types.ts';
import { buildRankedRows } from './calc.ts';
import { groupRowsByBrand, pickTopDeals, splitPlaceName } from './brand-groups.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataset: PriceDataset = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/prices.json'), 'utf8')
);

test('splitPlaceName splits brand and branch on the last space', () => {
  assert.deepEqual(splitPlaceName('밴스의원 홍대점'), { brand: '밴스의원', branch: '홍대점' });
  assert.deepEqual(splitPlaceName('지유의원(GU클리닉) 강남본점'), {
    brand: '지유의원(GU클리닉)',
    branch: '강남본점'
  });
  assert.deepEqual(splitPlaceName('단일명'), { brand: '단일명', branch: '단일명' });
});

test('groupRowsByBrand keeps every row, one group per brand, ranked by best branch', () => {
  const menuId = dataset.menus[0].id;
  const rows = buildRankedRows(dataset, menuId, 'all', 'savings', 843.54, true, {});
  const groups = groupRowsByBrand(rows);

  assert.equal(
    groups.reduce((n, g) => n + g.rows.length, 0),
    rows.length,
    'no row is lost or duplicated'
  );
  assert.equal(new Set(groups.map((g) => g.key)).size, groups.length);
  assert.equal(groups.length, new Set(rows.map((r) => r.place.brandJa)).size);

  // First group holds the overall #1 row; groups follow first-appearance order.
  assert.equal(groups[0].rows[0], rows[0]);
  const firstIndex = groups.map((g) => rows.indexOf(g.rows[0]));
  assert.deepEqual(firstIndex, [...firstIndex].sort((a, b) => a - b));

  for (const g of groups) {
    const prices = g.rows.map((r) => r.krTotalJpy);
    assert.equal(g.minJpy, Math.min(...prices));
    assert.equal(g.maxJpy, Math.max(...prices));
    assert.equal(g.jpCount, g.rows.filter((r) => r.place.japaneseSupport).length);
    assert.ok(g.rows.every((r) => r.place.brandJa === g.key));
  }
});

test('pickTopDeals returns the cheapest branch of distinct brands, cheapest first', () => {
  const menuId = dataset.menus[0].id;
  const rows = buildRankedRows(dataset, menuId, 'all', 'rating', 843.54, true, {});
  const top = pickTopDeals(rows, 3);

  assert.equal(top.length, 3);
  assert.equal(new Set(top.map((r) => r.place.brandJa)).size, 3, 'one card per brand');
  assert.equal(top[0].krTotalJpy, Math.min(...rows.map((r) => r.krTotalJpy)));
  for (let i = 1; i < top.length; i += 1) {
    assert.ok(top[i - 1].krTotalJpy <= top[i].krTotalJpy);
  }
  assert.deepEqual(pickTopDeals([], 3), []);
});
