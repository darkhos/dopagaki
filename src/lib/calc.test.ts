import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NaverFxSnapshot, PriceDataset } from '../types.ts';
import {
  buildRankedRows,
  computeRow,
  computeSeoulAverage,
  formatDistance,
  formatRate,
  formatSeoulDiffBadge,
  formatSeoulDiffBanner,
  haversineMeters,
  isPointInSouthKorea,
  jpyToKrw,
  krwToJpy
} from './calc.ts';
import { buildTransitUrl } from './clinic-helpers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataset: PriceDataset = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/prices.json'), 'utf8')
);
const naverFx: NaverFxSnapshot = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/naver-fx.json'), 'utf8')
);

test('dataset integrity: all 137 verified Seoul beauty clinics across 12 districts and 9 treatments are valid (zero eyewear)', () => {
  assert.equal(dataset.places.length, 137);
  assert.equal(dataset.menus.length, 9);
  for (const requiredId of ['rejuran-2cc', 'shrink-300', 'potenza', 'jaw-botox', 'juvelook-2cc', 're2o-5cc', 'inmode-fx', 'lalapeel', 'aquapeel']) {
    assert.ok(dataset.menus.some((m) => m.id === requiredId), `Missing treatment ${requiredId}`);
  }
  const re2oMenu = dataset.menus.find((m) => m.id === 're2o-5cc')!;
  assert.ok(re2oMenu.nameKo.includes('리투오') && re2oMenu.nameKo.includes('부나주'));
  assert.ok(re2oMenu.nameJa.includes('ブナジュ') && re2oMenu.nameJa.includes('リトゥオ'));
  assert.ok(dataset.places.every((p) => p.category === 'beauty'));
  assert.ok(dataset.menus.every((m) => m.category === 'beauty'));

  const ids = new Set(dataset.places.map((p) => p.id));
  assert.equal(ids.size, 137);

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
      assert.ok(
        !/lula-clinic\.com|tkc110\.jp|kyoritsu-biyo\.com|aoki-tsuyoshi\.com/.test(clinic.url),
        `Blocked/broken JP benchmark domain used for ${clinic.nameJa}: ${clinic.url}`
      );
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

  assert.equal(rowWithVat.baseKrw, 135000);
  assert.equal(rowWithVat.vatKrw, 13500);
  assert.equal(rowWithVat.totalKrw, 148500);
  assert.equal(rowWithVat.krTotalJpy, 17491);
  assert.equal(rowWithVat.savingsJpy, rejuran.jpBenchmarkJpy - 17491);
  assert.equal(
    rowWithVat.savingsPct,
    Math.round(((rejuran.jpBenchmarkJpy - 17491) / rejuran.jpBenchmarkJpy) * 100)
  );
  assert.equal(rowNoVat.vatKrw, 0);
  assert.equal(rowNoVat.totalKrw, 135000);
});

test('distance sorting ranks clinics nearest to the given current location origin', () => {
  const sinchonOrigin = { lat: 37.5559, lng: 126.9369 };
  const beautyRows = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'distance', naverFx.krwPer100Jpy, true, {
    origin: sinchonOrigin
  });
  assert.equal(beautyRows[0].place.id, 'vands-sinchon');
  assert.ok(beautyRows[0].distanceMeters < 150);
  assert.equal(beautyRows[1].place.id, 'lienjang-hongdae');
  assert.ok(beautyRows[1].distanceMeters < 1500);
});

test('bilingual search and japaneseOnly filter work cleanly', () => {
  const byKo = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'savings', naverFx.krwPer100Jpy, true, {
    searchQuery: '밴스'
  });
  assert.equal(byKo.length, 21);

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

test('custom user location origin re-ranks nearest clinics and formats user-origin distance', () => {
  const gangnamOrigin = { lat: 37.498871, lng: 127.026339 };
  const rows = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'distance', naverFx.krwPer100Jpy, true, {
    origin: gangnamOrigin
  });
  assert.equal(rows[0].place.area, 'gangnam');
  assert.ok(rows[0].distanceMeters < 300);
  assert.equal(formatDistance(220, 'ko', false), '');
  assert.equal(formatDistance(2400, 'ja', false), '');
  assert.equal(formatDistance(220, 'ko', true), '내 위치 도보 약 3분 (220m)');
  assert.equal(formatDistance(2400, 'ja', true), '現在地から2.4km');
});

test('isPointInSouthKorea accepts Korean cities and rejects foreign locations (Japan, China, US)', () => {
  // South Korea
  assert.equal(isPointInSouthKorea({ lat: 37.5665, lng: 126.978 }), true); // Seoul
  assert.equal(isPointInSouthKorea({ lat: 37.4602, lng: 126.4407 }), true); // Incheon Airport
  assert.equal(isPointInSouthKorea({ lat: 35.1796, lng: 129.0756 }), true); // Busan
  assert.equal(isPointInSouthKorea({ lat: 33.4996, lng: 126.5312 }), true); // Jeju
  assert.equal(isPointInSouthKorea({ lat: 37.4844, lng: 130.9057 }), true); // Ulleungdo

  // Outside South Korea
  assert.equal(isPointInSouthKorea({ lat: 35.6762, lng: 139.6503 }), false); // Tokyo
  assert.equal(isPointInSouthKorea({ lat: 34.6937, lng: 135.5023 }), false); // Osaka
  assert.equal(isPointInSouthKorea({ lat: 33.5902, lng: 130.4017 }), false); // Fukuoka
  assert.equal(isPointInSouthKorea({ lat: 34.4167, lng: 129.3333 }), false); // Tsushima, Japan
  assert.equal(isPointInSouthKorea({ lat: 31.2304, lng: 121.4737 }), false); // Shanghai
  assert.equal(isPointInSouthKorea({ lat: 40.7128, lng: -74.006 }), false); // New York
  assert.equal(isPointInSouthKorea(null), false);

  // Foreign GPS must not bias Seoul distance sorting or inject foreign origin into Naver Map transit URL
  const tokyo = { lat: 35.6762, lng: 139.6503 };
  const myeongdong = { lat: 37.5609, lng: 126.9862 };
  const rowsTokyo = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'distance', naverFx.krwPer100Jpy, true, {
    origin: tokyo
  });
  const rowsDefault = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'distance', naverFx.krwPer100Jpy, true, {
    origin: null
  });
  assert.equal(rowsTokyo[0].place.id, rowsDefault[0].place.id);
  assert.equal(rowsTokyo[0].distanceMeters, rowsDefault[0].distanceMeters);

  const samplePlace = dataset.places[0];
  const foreignTransit = buildTransitUrl('current', samplePlace, tokyo);
  const koreaTransit = buildTransitUrl('current', samplePlace, myeongdong);
  assert.ok(
    foreignTransit.startsWith('https://map.naver.com/p/directions/-/'),
    `Expected blank origin for foreign GPS, got ${foreignTransit}`
  );
  assert.ok(
    koreaTransit.startsWith('https://map.naver.com/p/directions/') &&
      koreaTransit.includes(encodeURIComponent('내 위치')),
    `Expected Korea origin in Naver Map URL, got ${koreaTransit}`
  );
});

test('Seoul average price comparison calculates exact averages and cheaper/same/higher diffs', () => {
  const rejuran = dataset.menus.find((m) => m.id === 'rejuran-2cc')!;
  const avgWithVat = computeSeoulAverage(dataset.places, rejuran, 848.99, true, 0.1);
  const avgNoVat = computeSeoulAverage(dataset.places, rejuran, 848.99, false, 0.1);

  assert.ok(avgWithVat.sampleCount >= 110, `Expected >=110 verified Rejuran clinics, got ${avgWithVat.sampleCount}`);
  assert.ok(avgWithVat.avgTotalKrw > avgNoVat.avgTotalKrw);
  assert.equal(avgWithVat.avgTotalJpy, krwToJpy(avgWithVat.avgTotalKrw, 848.99));

  const rows = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'savings', 848.99, true);
  const cheapest = rows[0];
  const priciest = rows[rows.length - 1];
  assert.equal(cheapest.seoulAvgKrw, avgWithVat.avgTotalKrw);
  assert.ok(cheapest.seoulDiffKrw > 0 && cheapest.seoulDiffPct > 0);
  assert.ok(priciest.seoulDiffKrw < 0 && priciest.seoulDiffPct < 0);

  assert.deepEqual(formatSeoulDiffBadge(22, 'ko'), { text: '서울 평균 -22%', tone: 'cheaper' });
  assert.deepEqual(formatSeoulDiffBadge(-14, 'ja'), { text: 'ソウル平均 +14%', tone: 'higher' });
  assert.deepEqual(formatSeoulDiffBadge(0, 'ko'), { text: '서울 평균 수준', tone: 'same' });

  const banner = formatSeoulDiffBanner(25000, 4000, 16, 'ko', 160);
  assert.equal(banner.tone, 'cheaper');
  assert.ok(banner.text.includes('서울 160곳 평균'));
  assert.ok(banner.text.includes('16%↓'));
});
