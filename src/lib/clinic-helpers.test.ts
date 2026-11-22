import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PriceDataset } from '../types.ts';
import {
  buildClinicUrl,
  buildInquiryMessages,
  buildOrderSheetMessages,
  buildTransitUrl,
  computeClinicBundle,
  detectAppBasePath,
  findNearbyClinics,
  parseRoute
} from './clinic-helpers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataset: PriceDataset = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/prices.json'), 'utf8')
);

test('route detection and parsing works on root and GitHub Pages subpath', () => {
  assert.equal(detectAppBasePath('/'), '/');
  assert.equal(detectAppBasePath('/clinic/vands-sinchon'), '/');
  assert.equal(detectAppBasePath('/seoul-payback/'), '/seoul-payback/');
  assert.equal(detectAppBasePath('/seoul-payback/clinic/vands-sinchon/'), '/seoul-payback/');

  assert.deepEqual(parseRoute('/seoul-payback/', '/seoul-payback/'), {
    view: 'home',
    clinicId: null
  });
  assert.deepEqual(parseRoute('/seoul-payback/clinic/vands-sinchon', '/seoul-payback/'), {
    view: 'clinic',
    clinicId: 'vands-sinchon'
  });
  assert.deepEqual(parseRoute('/clinic/muse-sinchon/', '/'), {
    view: 'clinic',
    clinicId: 'muse-sinchon'
  });

  const built = buildClinicUrl('https://darkhos.github.io', '/seoul-payback/', 'vands-sinchon', {
    lang: 'ja',
    menuId: 'rejuran-2cc',
    menus: ['rejuran-2cc', 'shrink-300'],
    visits: 2,
    includeVat: true
  });
  assert.equal(
    built,
    'https://darkhos.github.io/seoul-payback/clinic/vands-sinchon?lang=ja&menu=rejuran-2cc&menus=rejuran-2cc%2Cshrink-300&v=2'
  );
});

test('multi-treatment clinic bundle calculates exact VAT 10% and Japan 5-clinic savings', () => {
  const sinchon = dataset.places.find((p) => p.id === 'vands-sinchon')!;
  const all4 = computeClinicBundle(
    sinchon,
    dataset.menus,
    ['rejuran-2cc', 'shrink-300', 'potenza', 'jaw-botox'],
    1,
    true,
    848.99,
    0.1
  );

  assert.equal(all4.items.length, 4);
  assert.equal(all4.jpBenchmarkJpy, 164918);
  assert.equal(all4.krTotalJpy, 52603);
  assert.equal(all4.savingsJpy, 164918 - 52603);
  assert.ok(all4.savingsPct >= 65);
});

test('order sheet and inquiry message generators output polite bilingual Korean/Japanese', () => {
  const sinchon = dataset.places.find((p) => p.id === 'vands-sinchon')!;
  const bundle = computeClinicBundle(
    sinchon,
    dataset.menus,
    ['rejuran-2cc'],
    1,
    true,
    848.99,
    0.1
  );

  const order = buildOrderSheetMessages(sinchon, bundle, ['no-upsell', 'total-first'], true);
  assert.ok(order.ko.includes('밴스의원 신촌점'));
  assert.ok(order.ko.includes('추가 시술 권유는 정중히 사양'));
  assert.ok(order.ja.includes('バンス医院 新村店'));

  const inquiry = buildInquiryMessages(sinchon, bundle, {
    date: '2026-12-05',
    timeSlot: 'afternoon',
    people: 2,
    firstVisit: true,
    guestName: 'HANAKO YAMADA'
  });
  assert.ok(inquiry.ko.includes('HANAKO YAMADA'));
  assert.ok(inquiry.ko.includes('2026-12-05'));
  assert.ok(inquiry.ko.includes('2명'));
  assert.ok(inquiry.ja.includes('初診'));
});

test('transit URL builder and nearby clinics helper work without backend', () => {
  const sinchon = dataset.places.find((p) => p.id === 'vands-sinchon')!;
  const url = buildTransitUrl('incheon', sinchon);
  assert.ok(url.startsWith('https://www.google.com/maps/dir/?'));
  assert.ok(url.includes('travelmode=transit'));
  assert.ok(url.includes(String(sinchon.lat)));

  const nearby = findNearbyClinics(dataset, sinchon, 'rejuran-2cc', 3);
  assert.equal(nearby.length, 3);
  assert.equal(nearby[0].place.id, 'muse-sinchon');
  assert.ok(nearby[0].distanceMeters < 400);
});
