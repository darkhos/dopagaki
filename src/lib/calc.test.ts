import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PriceDataset } from '../types.ts';
import {
  buildRankedRows,
  computeRow,
  haversineMeters,
  jpyToKrw,
  krwToJpy,
  parsePlanParam,
  serializePlanParam,
  summarizePlan
} from './calc.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataset: PriceDataset = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/prices.json'), 'utf8')
);

test('dataset integrity: all 194 Seoul-wide places across 12 districts have valid coordinates and official URLs', () => {
  assert.equal(dataset.places.length, 194);
  assert.equal(dataset.places.filter((p) => p.category === 'beauty').length, 164);
  assert.equal(dataset.places.filter((p) => p.category === 'eyewear').length, 30);
  const ids = new Set(dataset.places.map((p) => p.id));
  assert.equal(ids.size, 194);
  const districtIds = dataset.areas.filter((a) => a.id !== 'all').map((a) => a.id);
  assert.equal(districtIds.length, 12);
  for (const areaId of districtIds) {
    assert.ok(
      dataset.places.some((p) => p.area === areaId),
      `District ${areaId} has no places`
    );
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

test('krwToJpy and jpyToKrw convert accurately at 100 JPY = 849 KRW', () => {
  assert.equal(krwToJpy(84900, 849), 10000);
  assert.equal(krwToJpy(163900, 849), 19305);
  assert.equal(krwToJpy(60000, 849), 7067);
  assert.equal(jpyToKrw(10000, 849), 84900);
});

test('2026 VAT 10% applies automatically to beauty clinics but NOT VAT-included eyewear', () => {
  const vands = dataset.places.find((p) => p.id === 'vands-hongdae')!;
  const rejuran = dataset.menus.find((m) => m.id === 'rejuran-2cc')!;
  const rowWithVat = computeRow(vands, rejuran, 849, true, 0.1, 37.5559, 126.9369)!;
  const rowNoVat = computeRow(vands, rejuran, 849, false, 0.1, 37.5559, 126.9369)!;

  assert.equal(rowWithVat.baseKrw, 149000);
  assert.equal(rowWithVat.vatKrw, 14900);
  assert.equal(rowWithVat.totalKrw, 163900);
  assert.equal(rowWithVat.savingsJpy, 55600 - 19305);
  assert.equal(rowWithVat.krRatioOfJp, 35);
  assert.equal(rowNoVat.vatKrw, 0);
  assert.equal(rowNoVat.totalKrw, 149000);

  const top50 = dataset.places.find((p) => p.id === 'top50-sinchon')!;
  const lens174 = dataset.menus.find((m) => m.id === 'lens-174-bl')!;
  const eyeRow = computeRow(top50, lens174, 849, true, 0.1, 37.5559, 126.9369)!;
  assert.equal(eyeRow.vatKrw, 0);
  assert.equal(eyeRow.totalKrw, 60000);
  assert.equal(eyeRow.savingsJpy, 19800 - 7067);
});

test('distance sorting puts Sinchon venue neighbors at rank #1', () => {
  const eyeRows = buildRankedRows(dataset, 'lens-174-bl', 'all', 'distance', 849, true);
  assert.equal(eyeRows[0].place.id, 'top50-sinchon');
  assert.ok(eyeRows[0].distanceMeters < 150);

  const beautyRows = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'distance', 849, true);
  assert.equal(beautyRows[0].place.id, 'vands-sinchon');
  assert.ok(beautyRows[0].distanceMeters < 150);
  assert.equal(beautyRows[1].place.id, 'muse-sinchon');
  assert.ok(beautyRows[1].distanceMeters < 350);
});

test('bilingual search and japaneseOnly filter work cleanly', () => {
  const byKo = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'savings', 849, true, {
    searchQuery: '밴스'
  });
  assert.equal(byKo.length, 22);

  const byJa = buildRankedRows(dataset, 'lens-174-bl', 'all', 'savings', 849, true, {
    searchQuery: '新村'
  });
  assert.equal(byJa.length, 3);

  const jpOnlyEye = buildRankedRows(dataset, 'lens-174-bl', 'all', 'savings', 849, true, {
    japaneseOnly: true
  });
  assert.ok(jpOnlyEye.length > 0 && jpOnlyEye.every((r) => r.place.japaneseSupport));
});

test('plan URL serialization round-trips and ignores invalid entries', () => {
  const initial = [
    { key: 'top50-sinchon::lens-174-bl', placeId: 'top50-sinchon', menuId: 'lens-174-bl' },
    { key: 'vands-hongdae::rejuran-2cc', placeId: 'vands-hongdae', menuId: 'rejuran-2cc' }
  ];
  const encoded = serializePlanParam(initial);
  const decoded = parsePlanParam(`${encoded},invalid:nope,top50-sinchon:lens-174-bl`, dataset);
  assert.equal(decoded.length, 2);
  assert.equal(decoded[0].key, 'top50-sinchon::lens-174-bl');
  assert.equal(decoded[1].key, 'vands-hongdae::rejuran-2cc');
});

test('flight payback ledger reaches >= 100% with Sinchon 1.74 eyewear + Hongdae Rejuran', () => {
  const summary = summarizePlan(
    dataset,
    [
      { key: 'top50-sinchon::lens-174-bl', placeId: 'top50-sinchon', menuId: 'lens-174-bl' },
      { key: 'vands-hongdae::rejuran-2cc', placeId: 'vands-hongdae', menuId: 'rejuran-2cc' }
    ],
    849,
    true,
    30000
  );
  assert.equal(summary.items.length, 2);
  assert.equal(summary.totalSavingsJpy, 12733 + 36295);
  assert.equal(summary.paybackReached, true);
  assert.equal(summary.paybackPct, 163);
  assert.equal(summary.customsExceeded, false);
});

test('haversine sanity check: Sinchon to Gangnam is ~9-11km', () => {
  const dist = haversineMeters(37.5559, 126.9369, 37.498871, 127.026339);
  assert.ok(dist > 8500 && dist < 11500, `Unexpected distance ${dist}m`);
});
