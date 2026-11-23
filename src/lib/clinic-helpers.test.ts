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
import {
  BRAND_REVIEWS,
  buildExternalReviewLinks,
  getBrandReview
} from '../data/brand-reviews.ts';
import { BRANCH_REVIEWS } from '../data/branch-reviews.ts';

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
    0.1,
    dataset.places
  );

  assert.equal(all4.items.length, 4);
  assert.equal(all4.jpBenchmarkJpy, 164918);
  assert.equal(all4.krTotalJpy, 52603);
  assert.equal(all4.savingsJpy, 164918 - 52603);
  assert.ok(all4.savingsPct >= 65);
  assert.ok(all4.seoulAvgKrw > 0 && all4.seoulAvgJpy > 0);
  assert.equal(all4.seoulDiffKrw, all4.seoulAvgKrw - all4.totalKrw);
  assert.ok(all4.seoulDiffPct > 0, `Expected VandS Sinchon to be cheaper than Seoul avg, got ${all4.seoulDiffPct}%`);
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

test('all 164 clinics across 25 brands have verified honest reviews, distinct branch profiles, and no-login links', () => {
  assert.equal(Object.keys(BRAND_REVIEWS).length, 25);

  const placeIds = new Set(dataset.places.map((p) => p.id));
  for (const branchId of Object.keys(BRANCH_REVIEWS)) {
    assert.ok(placeIds.has(branchId), `Orphaned BRANCH_REVIEWS key not found in prices.json: ${branchId}`);
  }

  const tierCounts = { jp_kr_verified: 0, kr_verified: 0, limited: 0 };
  for (const profile of Object.values(BRAND_REVIEWS)) {
    tierCounts[profile.verificationTier]++;
  }
  assert.deepEqual(tierCounts, { jp_kr_verified: 18, kr_verified: 6, limited: 1 });

  // Verify ALL 22 VandS branches have individual branch-level reviews with 100% unique tags
  const vandsPlaces = dataset.places.filter((p) => p.brandJa === 'バンス医院 (VandS)');
  assert.equal(vandsPlaces.length, 22);
  const vandsKoTags = new Set<string>();
  const vandsJaTags = new Set<string>();
  for (const vp of vandsPlaces) {
    const vr = getBrandReview(vp);
    assert.equal(vr.reviewScope, 'branch', `VandS branch ${vp.id} must have branch-level review`);
    vandsKoTags.add(vr.shortTagKo);
    vandsJaTags.add(vr.shortTagJa);
  }
  assert.equal(vandsKoTags.size, 22, 'All 22 VandS branches must have unique Korean short tags');
  assert.equal(vandsJaTags.size, 22, 'All 22 VandS branches must have unique Japanese short tags');

  let branchScopedCount = 0;
  for (const place of dataset.places) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(BRAND_REVIEWS, place.brandJa),
      `Missing BRAND_REVIEWS entry for ${place.id} (${place.brandJa})`
    );
    const rev = getBrandReview(place);
    if (rev.reviewScope === 'branch') branchScopedCount++;
    assert.ok(rev.vibeJa.length > 0 && rev.vibeKo.length > 0);
    assert.ok(rev.scopeLabelJa.length > 0 && rev.scopeLabelKo.length > 0);
    assert.ok(rev.tierLabelJa.length > 0 && rev.tierLabelKo.length > 0);
    assert.ok(rev.shortTagJa.length > 0 && rev.shortTagKo.length > 0);
    assert.equal(rev.prosJa.length, 2);
    assert.equal(rev.prosKo.length, 2);
    assert.equal(rev.watchoutsJa.length, 2);
    assert.equal(rev.watchoutsKo.length, 2);

    // Non-JP local branches must never display Japanese-interpreter/LINE-JP praise in pros or shortTag
    if (!place.japaneseSupport) {
      const combinedPros = [...rev.prosJa, ...rev.prosKo, rev.shortTagJa, rev.shortTagKo].join(' ');
      assert.ok(
        !/日本語スタッフ|日本語通訳|日本語コーディネーター|LINE日本語|일본어 통역|일본어 응대|일본어 코디네이터|LINE 일본어/.test(
          combinedPros
        ),
        `Non-JP branch ${place.id} leaked JP-support praise: ${combinedPros}`
      );
      if (rev.verificationTier !== 'limited') {
        assert.ok(rev.branchNoticeKo && rev.branchNoticeJa, `Missing local branch notice for ${place.id}`);
      }
    }

    // Verified real-world rebrand & limited-sample guardrails
    if (place.id === 'drpetit-gangnam') {
      assert.ok(rev.branchNoticeKo?.includes('UH CELL'));
      assert.ok(rev.branchNoticeJa?.includes('UH CELL'));
    }
    if (place.id === 'snow-nowon') {
      assert.equal(rev.verificationTier, 'limited');
    }

    for (const lang of ['ja', 'ko'] as const) {
      const links = buildExternalReviewLinks(place, lang);
      assert.equal(links.length, 4);
      for (const l of links) {
        assert.ok(l.url.startsWith('https://'), `Invalid review URL for ${place.id}: ${l.url}`);
        assert.ok(!l.url.startsWith('https://x.com/search'), `Login-walled X search link on ${place.id}`);
      }
    }
  }
  assert.ok(branchScopedCount >= 65, `Expected >=65 branch-scoped reviews, got ${branchScopedCount}`);
});
