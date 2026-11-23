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
  TRAIT_FILTERS,
  buildExternalReviewLinks,
  buildPrimaryReviewUrl,
  getBrandReview,
  matchesTraitFilter,
  pickCompactTraits
} from '../data/brand-reviews.ts';
import { BRANCH_REVIEWS } from '../data/branch-reviews.ts';
import { OFFICIAL_MENU_PROOFS, getOfficialMenuProof, getOfficialProof } from '../data/official-proofs.ts';
import { getClinicAiRating } from './ai-rating.ts';
import { buildRankedRows } from './calc.ts';

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
  assert.equal(all4.krTotalJpy, 30059);
  assert.equal(all4.savingsJpy, 164918 - 30059);
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

test('transit URL builder uses Naver Map directions and nearby clinics helper works', () => {
  const sinchon = dataset.places.find((p) => p.id === 'vands-sinchon')!;
  const incheonUrl = buildTransitUrl('incheon', sinchon);
  assert.ok(incheonUrl.startsWith('https://map.naver.com/p/directions/'));
  assert.ok(incheonUrl.endsWith('/-/transit'));
  assert.ok(incheonUrl.includes(encodeURIComponent('인천국제공항')));
  assert.ok(incheonUrl.includes(encodeURIComponent('밴스의원 신촌점')));

  const seoulUserUrl = buildTransitUrl('current', sinchon, { lat: 37.56, lng: 126.98 });
  assert.ok(seoulUserUrl.startsWith('https://map.naver.com/p/directions/'));
  assert.ok(seoulUserUrl.includes(encodeURIComponent('내 위치')));

  const foreignUserUrl = buildTransitUrl('current', sinchon, { lat: 35.68, lng: 139.76 });
  assert.ok(foreignUserUrl.startsWith('https://map.naver.com/p/directions/-/'));

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
        assert.ok(!l.url.startsWith('https://www.google.com/search'), `Clunky web-search wrapper on ${place.id}`);
      }
    }
    const primaryKo = buildPrimaryReviewUrl(place, 'ko');
    const primaryJa = buildPrimaryReviewUrl(place, 'ja');
    assert.ok(primaryKo.includes('ssc=tab.blog.all'), `Expected Naver Blog direct feed for ko on ${place.id}`);
    assert.ok(primaryJa.includes('hl=ja'), `Expected Japanese Google Maps reviews for ja on ${place.id}`);
  }
  assert.ok(branchScopedCount >= 65, `Expected >=65 branch-scoped reviews, got ${branchScopedCount}`);
});

test('all 164 clinics resolve valid official price proof links and zero-mismatch screenshots', () => {
  const verifiedFiles = new Set<string>();
  const verifiedJaFiles = new Set<string>();
  for (const place of dataset.places) {
    const brandProof = getOfficialProof(place);
    assert.ok(brandProof.priceUrl.startsWith('https://'), `Expected https priceUrl for ${place.id}`);
    const brandProofJa = getOfficialProof(place, 'ja');
    assert.ok(brandProofJa.priceUrl.startsWith('https://'), `Expected https JA priceUrl for ${place.id}`);

    for (const menuId of Object.keys(place.prices)) {
      const offer = place.prices[menuId]!;
      const menuProof = getOfficialMenuProof(place, menuId);
      const menuProofJa = getOfficialMenuProof(place, menuId, 'ja');
      assert.ok(
        menuProof.priceUrl.startsWith('https://'),
        `Expected https menu priceUrl for ${place.id}/${menuId}`
      );
      assert.ok(
        menuProofJa.priceUrl.startsWith('https://'),
        `Expected https JA menu priceUrl for ${place.id}/${menuId}`
      );
      if (menuProof.imageFile !== null) {
        assert.equal(
          menuProof.verifiedKrw,
          offer.krw,
          `Zero-mismatch violated on ${place.id}/${menuId}: proof=${menuProof.verifiedKrw} vs dataset=${offer.krw}`
        );
        const fullPath = path.resolve(__dirname, '../../public/official-proofs', menuProof.imageFile);
        assert.ok(fs.existsSync(fullPath), `Missing proof image on disk: ${menuProof.imageFile}`);
        const size = fs.statSync(fullPath).size;
        assert.ok(size > 5000, `Proof image too small (${size} bytes): ${menuProof.imageFile}`);
        verifiedFiles.add(menuProof.imageFile);

        assert.ok(menuProofJa.imageFileJa, `Missing imageFileJa for ${place.id}/${menuId}`);
        const jaPath = path.resolve(__dirname, '../../public/official-proofs-ja', menuProofJa.imageFileJa);
        assert.ok(fs.existsSync(jaPath), `Missing JA proof image on disk: ${menuProofJa.imageFileJa}`);
        const jaSize = fs.statSync(jaPath).size;
        assert.ok(jaSize > 5000, `JA proof image too small (${jaSize} bytes): ${menuProofJa.imageFileJa}`);
        verifiedJaFiles.add(menuProofJa.imageFileJa);
      }
    }
  }
  assert.ok(
    Object.keys(OFFICIAL_MENU_PROOFS).length >= 80 && verifiedFiles.size >= 80 && verifiedJaFiles.size === verifiedFiles.size,
    `Expected >=80 verified exact-price KO & JA screenshots, got KO=${verifiedFiles.size}, JA=${verifiedJaFiles.size}`
  );

  // Verify JP-supported brands route to Japanese URLs under lang='ja', while KO-only brands fall back cleanly
  const jpSources = [
    'https://abijouonline.com/',
    'https://museclinic.co.kr/',
    'https://beautyloungeclinic.com/',
    'https://gu.clinic/',
    'https://vandsclinics.com/',
    'https://www.toxnfill.com/',
    'https://www.ppeum.com/',
    'https://lienjang.net/'
  ];
  for (const src of jpSources) {
    const place = dataset.places.find((p) => p.sourceUrl === src)!;
    const firstMenu = Object.keys(place.prices)[0]!;
    const ko = getOfficialMenuProof(place, firstMenu, 'ko');
    const ja = getOfficialMenuProof(place, firstMenu, 'ja');
    assert.equal(ja.isJaSite, true, `Expected isJaSite=true for ${place.id}`);
    assert.notEqual(ja.priceUrl, ko.priceUrl, `Expected distinct JP priceUrl for ${place.id}`);
  }
  const koOnlySources = [
    'https://nowon-snow.co.kr/',
    'https://www.shinebeam.co.kr/',
    'https://www.drdclinic.co.kr/',
    'https://www.mipretty.co.kr/',
    'https://daybeauclinic.co.kr/',
    'https://www.tatoa.co.kr/',
    'https://www.k-tox.com/'
  ];
  for (const src of koOnlySources) {
    const place = dataset.places.find((p) => p.sourceUrl === src)!;
    const firstMenu = Object.keys(place.prices)[0]!;
    const ko = getOfficialMenuProof(place, firstMenu, 'ko');
    const ja = getOfficialMenuProof(place, firstMenu, 'ja');
    assert.equal(ja.isJaSite, false, `Expected isJaSite=false fallback for ${place.id}`);
    assert.equal(ja.priceUrl, ko.priceUrl, `Expected KO URL fallback for ${place.id}`);
  }
});

test('all 164 clinics expose truthful structured visual traits and trait filters', () => {
  for (const place of dataset.places) {
    const rev = getBrandReview(place);
    assert.ok(rev.traits.length >= 1, `Expected >=1 trait on ${place.id}`);
    for (const t of rev.traits) {
      assert.ok(t.labelKo.length > 0 && t.labelJa.length > 0);
    }
    const compact = pickCompactTraits(rev.traits, 3);
    assert.ok(compact.length >= 1 && compact.length <= 3);
  }

  const byId = (id: string) => dataset.places.find((p) => p.id === id)!;
  assert.ok(matchesTraitFilter(byId('vands-sinchon'), 'sunday_night'));
  assert.ok(matchesTraitFilter(byId('vands-sinsa'), 'low_upsell'));
  assert.ok(matchesTraitFilter(byId('vands-sinsa'), 'short_wait'));
  assert.ok(getBrandReview(byId('ppeum-gangnam')).traits.some((t) => t.id === 'upsell_warn'));
  const upsellBadge = getBrandReview(byId('ppeum-gangnam')).traits.find((t) => t.id === 'upsell_warn')!;
  assert.equal(upsellBadge.labelKo, '추가 시술 권유 주의');
  for (const place of dataset.places) {
    const rev = getBrandReview(place);
    const ai = getClinicAiRating(place, dataset.places);
    assert.equal(/업셀링|アップセル/.test(ai.summaryKo + ai.summaryJa), false, `Jargon leaked in AI summary for ${place.id}`);
    for (const t of rev.traits) {
      assert.equal(
        /업셀링|アップセル/.test(`${t.labelKo} ${t.labelJa} ${t.detailKo}`),
        false,
        `Jargon leaked in trait ${t.id} for ${place.id}`
      );
    }
  }
  assert.ok(getBrandReview(byId('drpetit-gangnam')).traits.some((t) => t.id === 'rebrand_warn'));
  assert.ok(getBrandReview(byId('snow-nowon')).traits.some((t) => t.id === 'limited_rev'));
  assert.ok(getBrandReview(byId('toxnfill-nowon')).traits.some((t) => t.id === 'brand_ref'));
  assert.equal(matchesTraitFilter(byId('toxnfill-nowon'), 'low_upsell'), false);
  assert.equal(matchesTraitFilter(byId('toxnfill-nowon'), 'sunday_night'), false);

  for (const tf of TRAIT_FILTERS) {
    const matched = dataset.places.filter((p) => matchesTraitFilter(p, tf.id));
    assert.ok(matched.length > 0, `Expected >0 clinics for trait filter ${tf.id}`);
  }
});

test('all 164 clinics have realistic 5.0-scale AI ratings with 4 axes and rating sort works', () => {
  const uniqueScores = new Set<number>();
  for (const place of dataset.places) {
    const ai = getClinicAiRating(place, dataset.places);
    assert.ok(ai.overall >= 2.8 && ai.overall <= 4.9, `Out of range AI score on ${place.id}: ${ai.overall}`);
    assert.equal(ai.axes.length, 4);
    for (const ax of ai.axes) {
      assert.ok(ax.score >= 2.4 && ax.score <= 4.9, `Out of range axis ${ax.id} on ${place.id}: ${ax.score}`);
      assert.ok(ax.labelKo.length > 0 && ax.labelJa.length > 0);
    }
    assert.ok(ai.summaryKo.length > 0 && ai.summaryJa.length > 0);
    uniqueScores.add(ai.overall);
  }
  assert.ok(uniqueScores.size >= 8, `Expected >=8 distinct AI score levels, got ${uniqueScores.size}`);

  const byId = (id: string) => dataset.places.find((p) => p.id === id)!;
  const hongdae = getClinicAiRating(byId('vands-hongdae'), dataset.places);
  const ppeum = getClinicAiRating(byId('ppeum-gangnam'), dataset.places);
  const snow = getClinicAiRating(byId('snow-nowon'), dataset.places);
  assert.ok(hongdae.overall > ppeum.overall, 'Low-upsell VandS Hongdae should outscore high-upsell PPEUM Gangnam');
  assert.ok(hongdae.overall > snow.overall, 'Verified branch should outscore limited-sample Snow Nowon');

  const ratedRows = buildRankedRows(dataset, 'rejuran-2cc', 'all', 'rating', 845.64, true);
  assert.ok(ratedRows.length > 100);
  for (let i = 1; i < ratedRows.length; i++) {
    assert.ok(
      ratedRows[i - 1].aiRating >= ratedRows[i].aiRating,
      `Rating sort violated at index ${i}: ${ratedRows[i - 1].aiRating} < ${ratedRows[i].aiRating}`
    );
  }
});
