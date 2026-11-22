import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NaverFxSnapshot, PriceDataset } from '../types.ts';
import {
  buildRankedRows,
  computeRow,
  formatRate,
  haversineMeters,
  jpyToKrw,
  krwToJpy
} from './calc.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataset: PriceDataset = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/prices.json'), 'utf8')
);
const naverFx: NaverFxSnapshot = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/naver-fx.json'), 'utf8')
);

test('dataset integrity: all 164 Seoul beauty clinics across 12 districts and 4 treatments are valid (zero eyewear)', () => {
  assert.equal(dataset.places.length, 164);
  assert.equal(dataset.menus.length, 4);
  assert.ok(dataset.places.every((p) => p.category === 'beauty'));
  assert.ok(dataset.menus.every((m) => m.category === 'beauty'));

  const ids = new Set(dataset.places.map((p) => p.id));
  assert.equal(ids.size, 164);

  const districtIds = dataset.areas.filter((a) => a.id !== 'all').map((a) => a.id);
  assert.equal(districtIds.length, 12);
  for (const areaId of districtIds) {
    assert.ok(
      dataset.places.some((p) => p.area === areaId),
      `District ${areaId} has no clinics`
    );
  }

  for (const menu of dataset.menus) {
    assert.ok(Array.isArray(menu.jpBenchmarks) && menu.jpBenchmarks.length >= 5, `Menu ${menu.id} needs >=5 JP clinics`);
    const avg = Math.round(
      menu.jpBenchmarks.reduce((sum, item) => sum + item.priceJpy, 0) / menu.jpBenchmarks.length
    );
    assert.equal(menu.jpBenchmarkJpy, avg, `Menu ${menu.id} jpBenchmarkJpy must equal exact JP clinic average (${avg})`);
    for (const clinic of menu.jpBenchmarks) {
      assert.ok(clinic.priceJpy > 0, `Invalid JP benchmark price for ${clinic.nameJa}`);
      assert.ok(clinic.url.startsWith('https://'), `Invalid JP benchmark URL for ${clinic.nameJa}`);
    }
  }

  for (const p of dataset.places) {
    assert.ok(p.lat > 37.45 && p.lat < 37.68, `Invalid lat for ${p.id}: ${p.lat}`);
    assert.ok(p.lng > 126.8 && p.lng < 127.16, `Invalid lng for ${p.id}: ${p.lng}`);
    assert.ok(p.sourceUrl.startsWith('https://'), `Invalid sourceUrl for ${p.id}`);
    assert.equal(typeof p.vatExcluded, 'boolean', `Missing vatExcluded boolean for ${p.id}`);
    assert.ok(typeof p.brandJa === 'string' && p.brandJa.length > 0, `Missing brandJa for ${p.id}`);
    assert.ok(
      p.sourceType === 'official_event' || p.sourceType === 'official_standard',
      `Invalid sourceType for ${p.id}: ${p.sourceType}`
    );
    assert.ok(Object.keys(p.prices).length > 0, `No prices for ${p.id}`);
  }
});

test('Naver daily FX snapshot is valid and parses decimal rates accurately', () => {
  assert.ok(
    Number.isFinite(naverFx.krwPer100Jpy) && naverFx.krwPer100Jpy >= 600 && naverFx.krwPer100Jpy <= 1500,
    `Unexpected Naver FX rate: ${naverFx.krwPer100Jpy}`
  );
  assert.ok(naverFx.sourceUrl.startsWith('https://'));
  assert.ok(/^\d{4}\.\d{2}\.\d{2}$/.test(naverFx.dateLabel), `Invalid dateLabel: ${naverFx.dateLabel}`);
  assert.equal(formatRate(848.99), '848.99');
  assert.equal(formatRate(850), '850');
  assert.equal(krwToJpy(84899, 848.99), 10000);
  assert.equal(jpyToKrw(10000, 848.99), 84899);
});

test('2026 VAT 10% applies automatically to beauty clinics and toggles off cleanly', () => {
  const vands = dataset.places.find((p) => p.id === 'vands-hongdae')!;
  const rejuran = dataset.menus.find((m) => m.id === 'rejuran-2cc')!;
  const rowWithVat = computeRow(vands, rejuran, 848.99, true, 0.1, 37.5559, 126.9369)!;
  const rowNoVat = computeRow(vands, rejuran, 848.99, false, 0.1, 37.5559, 126.9369)!;

  assert.equal(rowWithVat.baseKrw, 149000);
  assert.equal(rowWithVat.vatKrw, 14900);
  assert.equal(rowWithVat.totalKrw, 163900);
  assert.equal(rowWithVat.krTotalJpy, 19305);
  assert.equal(rowWithVat.savingsJpy, rejuran.jpBenchmarkJpy - 19305);
  assert.equal(
    rowWithVat.savingsPct,
    Math.round(((rejuran.jpBenchmarkJpy - 19305) / rejuran.jpBenchmarkJpy) * 100)
  );
  assert.equal(rowNoVat.vatKrw, 0);
  assert.equal(rowNoVat.totalKrw, 149000);
});

test('distance sorting puts Sinchon venue neighbor clinics at rank #1', () => {
  const beautyRows = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'distance', naverFx.krwPer100Jpy, true);
  assert.equal(beautyRows[0].place.id, 'vands-sinchon');
  assert.ok(beautyRows[0].distanceMeters < 150);
  assert.equal(beautyRows[1].place.id, 'muse-sinchon');
  assert.ok(beautyRows[1].distanceMeters < 350);
});

test('bilingual search and japaneseOnly filter work cleanly', () => {
  const byKo = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'savings', naverFx.krwPer100Jpy, true, {
    searchQuery: '밴스'
  });
  assert.equal(byKo.length, 22);

  const byJa = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'savings', naverFx.krwPer100Jpy, true, {
    searchQuery: '江南'
  });
  assert.ok(byJa.length >= 10);

  const jpOnly = buildRankedRows(dataset, 'shrink-300', 'all', 'savings', naverFx.krwPer100Jpy, true, {
    japaneseOnly: true
  });
  assert.ok(jpOnly.length > 0 && jpOnly.every((r) => r.place.japaneseSupport));
});

test('haversine sanity check: Sinchon to Gangnam is ~9-11km', () => {
  const dist = haversineMeters(37.5559, 126.9369, 37.498871, 127.026339);
  assert.ok(dist > 8500 && dist < 11500, `Unexpected distance ${dist}m`);
});
