import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PriceDataset } from '../types.ts';
import {
  TREATMENT_DOWNTIME,
  TREATMENT_EFFECTS,
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
  matchesTraitFilters,
  normalizeTraitFilters,
  pickCompactTraits,
  toggleTraitFilters
} from '../data/brand-reviews.ts';
import { BRANCH_REVIEWS } from '../data/branch-reviews.ts';
import {
  OFFICIAL_MENU_PROOFS,
  OFFICIAL_PLACE_PRICE_URLS,
  getOfficialMenuProof,
  getOfficialProof
} from '../data/official-proofs.ts';
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
  assert.equal(all4.jpBenchmarkJpy, 164924);
  assert.equal(all4.krTotalJpy, 33415);
  assert.equal(all4.savingsJpy, 164924 - 33415);
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
  assert.equal(nearby[0].place.id, 'lienjang-hongdae');
  assert.ok(nearby[0].distanceMeters < 1500);
});

test('all 137 verified clinics across 24 brands have verified honest reviews, distinct branch profiles, and no-login links', () => {
  assert.equal(Object.keys(BRAND_REVIEWS).length, 24);

  const placeIds = new Set(dataset.places.map((p) => p.id));
  for (const branchId of Object.keys(BRANCH_REVIEWS)) {
    assert.ok(placeIds.has(branchId), `Orphaned BRANCH_REVIEWS key not found in prices.json: ${branchId}`);
  }

  const tierCounts = { jp_kr_verified: 0, kr_verified: 0, limited: 0 };
  for (const profile of Object.values(BRAND_REVIEWS)) {
    tierCounts[profile.verificationTier]++;
  }
  assert.deepEqual(tierCounts, { jp_kr_verified: 18, kr_verified: 5, limited: 1 });

  // Verify ALL 21 remaining VandS branches have individual branch-level reviews with 100% unique tags
  const vandsPlaces = dataset.places.filter((p) => p.brandJa === 'バンス医院 (VandS)');
  assert.equal(vandsPlaces.length, 21);
  const vandsKoTags = new Set<string>();
  const vandsJaTags = new Set<string>();
  for (const vp of vandsPlaces) {
    const vr = getBrandReview(vp);
    assert.equal(vr.reviewScope, 'branch', `VandS branch ${vp.id} must have branch-level review`);
    vandsKoTags.add(vr.shortTagKo);
    vandsJaTags.add(vr.shortTagJa);
  }
  assert.equal(vandsKoTags.size, 21, 'All 21 VandS branches must have unique Korean short tags');
  assert.equal(vandsJaTags.size, 21, 'All 21 VandS branches must have unique Japanese short tags');

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

test('all 137 verified clinics resolve valid official price proof links and zero-mismatch screenshots', () => {
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
    Object.keys(OFFICIAL_MENU_PROOFS).length >= 350 && verifiedFiles.size >= 350 && verifiedJaFiles.size === verifiedFiles.size,
    `Expected >=350 verified exact-price KO & JA screenshots, got KO=${verifiedFiles.size}, JA=${verifiedJaFiles.size}`
  );

  // Verify JP-supported branches route to Japanese URLs under lang='ja', while KO-only brands/branches fall back cleanly
  const jpPlaceIds = [
    'abijou-hongdae',
    'abijou-gangnam',
    'muse-gangnam',
    'muse-myeongdong',
    'beautylounge-hongdae',
    'gu-gangnam',
    'vands-hongdae',
    'vands-gangnam',
    'toxnfill-cheonho',
    'ppeum-hongdae',
    'ppeum-gangnam',
    'lienjang-hongdae',
    'lienjang-gangnam',
    'cellin-gangnam',
    'drevers-hongdae',
    'reverse-hongdae'
  ];
  for (const pid of jpPlaceIds) {
    const place = dataset.places.find((p) => p.id === pid)!;
    assert.ok(place, `Missing expected JP place ${pid}`);
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
  for (const pid of ['drpetit-nowon', 'lienjang-mokdong', 'reverse-nowon', 'cellin-yeonsinnae']) {
    const place = dataset.places.find((p) => p.id === pid)!;
    const firstMenu = Object.keys(place.prices)[0]!;
    const ko = getOfficialMenuProof(place, firstMenu, 'ko');
    const ja = getOfficialMenuProof(place, firstMenu, 'ja');
    assert.equal(ja.isJaSite, false, `Expected branch-level isJaSite=false fallback for ${place.id}`);
    assert.equal(ja.priceUrl, ko.priceUrl, `Expected branch-level KO URL fallback for ${place.id}`);
  }
});

test('zero wrong-branch screenshots, strict branch-URL mapping, zero orphan image files, and clean branch notes', () => {
  const validPlaceIds = new Set(dataset.places.map((p) => p.id));
  const placeById = new Map(dataset.places.map((p) => [p.id, p]));

  // Invariant 1: Every OFFICIAL_PLACE_PRICE_URLS key is valid and every proof with an image is strict branch or Maypure nationwide
  for (const pid of Object.keys(OFFICIAL_PLACE_PRICE_URLS)) {
    assert.ok(validPlaceIds.has(pid), `Unknown placeId in OFFICIAL_PLACE_PRICE_URLS: ${pid}`);
  }
  const referencedKo = new Set<string>();
  const referencedJa = new Set<string>();
  for (const [key, proof] of Object.entries(OFFICIAL_MENU_PROOFS)) {
    if (proof.imageFile) {
      referencedKo.add(proof.imageFile);
      if (proof.imageFileJa) referencedJa.add(proof.imageFileJa);
      if (proof.scope === 'nationwide') {
        assert.equal(
          proof.sourceUrl,
          'https://www.maypureclinic.com/',
          `Only Maypure may use scope="nationwide", got ${key}`
        );
        assert.equal(key, `${proof.sourceUrl}::${proof.menuId}`);
      } else {
        assert.equal(proof.scope, 'branch');
        const prefix = key.split('::')[0];
        assert.ok(validPlaceIds.has(prefix), `Branch proof key must start with placeId, got ${key}`);
      }
    }
  }

  // Invariant 2: No non-nationwide imageFile resolves on more than one clinic
  const ownersByFile = new Map<string, Set<string>>();
  for (const place of dataset.places) {
    for (const menuId of Object.keys(place.prices)) {
      const p = getOfficialMenuProof(place, menuId, 'ko');
      if (!p.imageFile) continue;
      if (p.scope !== 'nationwide') {
        const set = ownersByFile.get(p.imageFile) ?? new Set<string>();
        set.add(place.id);
        ownersByFile.set(p.imageFile, set);
      }
    }
  }
  for (const [file, owners] of ownersByFile.entries()) {
    assert.equal(
      owners.size,
      1,
      `Branch screenshot ${file} reused across multiple clinics: ${[...owners].join(', ')}`
    );
  }

  // Invariant 3: Zero orphan files in public/official-proofs/ and public/official-proofs-ja/
  const koDir = path.resolve(__dirname, '../../public/official-proofs');
  const jaDir = path.resolve(__dirname, '../../public/official-proofs-ja');
  const koDisk = fs.readdirSync(koDir).filter((f) => f.endsWith('.jpg')).sort();
  const jaDisk = fs.readdirSync(jaDir).filter((f) => f.endsWith('.jpg')).sort();
  assert.deepEqual(koDisk, jaDisk, 'KO and JA proof image directories must contain identical filenames');
  assert.ok(koDisk.length >= 350, `Expected >=350 proof image files, got ${koDisk.length}`);
  for (const f of koDisk) {
    assert.ok(referencedKo.has(f), `Orphan KO screenshot file not in OFFICIAL_MENU_PROOFS: ${f}`);
    assert.ok(referencedJa.has(f), `Orphan JA screenshot file not in OFFICIAL_MENU_PROOFS: ${f}`);
  }

  // Invariant 4: Spot-check exact branch URL & screenshot resolution
  const check = (pid: string, menuId: string, lang: 'ko' | 'ja' = 'ko') =>
    getOfficialMenuProof(placeById.get(pid)!, menuId, lang);

  assert.equal(check('vands-mokdong', 'rejuran-2cc').imageFile, 'vands-mokdong-rejuran-2cc.jpg');
  assert.equal(check('vands-mokdong', 'rejuran-2cc').verifiedKrw, 135000);
  assert.ok(check('vands-mokdong', 'rejuran-2cc').priceUrl.includes('mokdong.vandsclinics.com'));
  assert.equal(check('vands-mokdong', 'shrink-300').imageFile, 'vands-mokdong-shrink-300.jpg');
  assert.equal(check('vands-mokdong', 'shrink-300').verifiedKrw, 59000);
  assert.equal(check('vands-mokdong', 'jaw-botox').imageFile, 'vands-mokdong-jaw-botox.jpg');
  assert.equal(check('vands-mokdong', 'jaw-botox').verifiedKrw, 7500);
  assert.equal(placeById.get('vands-mokdong')!.prices.potenza, undefined);

  for (const m of Object.keys(placeById.get('vands-hongdae')!.prices)) {
    assert.equal(check('vands-hongdae', m, 'ko').imageFile, `vands-hongdae-${m}.jpg`);
    assert.ok(check('vands-hongdae', m, 'ko').priceUrl.includes('hongdae.vandsclinics.com'));
    assert.ok(check('vands-hongdae', m, 'ja').priceUrl.includes('hongdaejp.vandsclinics.com'));
  }
  for (const m of Object.keys(placeById.get('vands-gangnam')!.prices)) {
    assert.ok(check('vands-gangnam', m).imageFile?.startsWith('vands-'));
    assert.ok(check('vands-gangnam', m).priceUrl.includes('gangnam.vandsclinics.com'));
  }

  assert.equal(check('abijou-gangnam', 'shrink-300').imageFile, 'abijou-gangnam-shrink-300.jpg');
  assert.equal(check('abijou-gangnam', 'shrink-300').verifiedKrw, 79000);
  assert.ok(check('abijou-gangnam', 'shrink-300').priceUrl.includes('/gangnam-annex/'));
  assert.ok(!check('abijou-gangnam', 'shrink-300').priceUrl.includes('gangnam-main'));
  assert.equal(check('abijou-hongdae', 'shrink-300').imageFile, 'abijou-hongdae-shrink-300.jpg');
  assert.ok(check('abijou-hongdae', 'shrink-300', 'ko').priceUrl.includes('/hongdae/price'));
  assert.ok(check('abijou-hongdae', 'shrink-300', 'ja').priceUrl.includes('/ja/hongdae/price'));
  assert.ok(check('abijou-jamsil', 'rejuran-2cc', 'ja').priceUrl.includes('/jamsil/price'));
  assert.ok(!check('abijou-jamsil', 'rejuran-2cc', 'ja').priceUrl.includes('/ja/jamsil'));
  assert.ok(!check('abijou-jamsil', 'rejuran-2cc', 'ja').priceUrl.includes('gangnam-main'));
  for (const [k, entry] of Object.entries(OFFICIAL_PLACE_PRICE_URLS)) {
    assert.ok(!(entry.priceUrlJa ?? '').includes('/ja/jamsil'), `Broken /ja/jamsil redirect on ${k}`);
  }
  for (const [k, entry] of Object.entries(OFFICIAL_MENU_PROOFS)) {
    assert.ok(!(entry.priceUrlJa ?? '').includes('/ja/jamsil'), `Broken /ja/jamsil redirect on ${k}`);
  }

  assert.equal(check('drevers-hongdae', 'potenza').imageFile, 'drevers-hongdae-potenza.jpg');
  assert.ok(check('drevers-hongdae', 'potenza', 'ko').priceUrl.includes('hongdae.drevers.com'));
  assert.ok(check('drevers-hongdae', 'potenza', 'ja').priceUrl.includes('jp.drevers.com/event-HD-'));
  assert.equal(check('drevers-jamsil', 'potenza').imageFile, 'drevers-jamsil-potenza.jpg');
  assert.ok(check('drevers-jamsil', 'potenza', 'ko').priceUrl.includes('jamsil.drevers.com'));
  assert.ok(check('drevers-jamsil', 'potenza', 'ja').priceUrl.includes('jp.drevers.com/event-JS/'));

  assert.equal(check('mimi-snu', 'rejuran-2cc').imageFile, 'mimi-snu-rejuran-2cc.jpg');
  assert.ok(check('mimi-snu', 'rejuran-2cc').priceUrl.includes('code=39'));
  assert.equal(check('mimi-suyu', 'jaw-botox').imageFile, 'mimi-suyu-jaw-botox.jpg');

  assert.equal(check('cellin-gangnam', 'potenza').imageFile, 'cellin-gangnam-potenza.jpg');
  assert.ok(check('cellin-gangnam', 'potenza', 'ko').priceUrl.includes('gangnam.cellinclinic.com'));
  assert.ok(check('cellin-gangnam', 'potenza', 'ja').priceUrl.includes('/ja/procedures/'));
  assert.equal(check('cellin-hongdae', 'potenza').imageFile, 'cellin-hongdae-potenza.jpg');
  assert.ok(check('cellin-hongdae', 'potenza', 'ko').priceUrl.includes('hongdae.cellinclinic.com'));

  assert.equal(check('maypure-hongdae', 'jaw-botox').imageFile, 'maypure-jaw-botox.jpg');
  assert.equal(check('maypure-hongdae', 'jaw-botox').scope, 'nationwide');
  assert.equal(check('maypure-gangnam', 'shrink-300').imageFile, 'maypure-shrink-300.jpg');
  assert.equal(check('maypure-gangnam', 'shrink-300').scope, 'nationwide');

  assert.ok(check('uni-mokdong', 'jaw-botox').priceUrl.includes('mokuni114.co.kr'));
  assert.ok(check('beautylounge-hongdae', 'jaw-botox').priceUrl.includes('branch=hongdae'));
  for (const branch of ['gangnam', 'daechi', 'myeongdong', 'bangbae', 'yongsan', 'jamsil', 'hongdae'] as const) {
    const pid = `beautylounge-${branch}`;
    for (const menuId of ['rejuran-2cc', 'shrink-300', 'potenza', 'jaw-botox'] as const) {
      const koProof = check(pid, menuId, 'ko');
      const jaProof = check(pid, menuId, 'ja');
      assert.ok(koProof.imageFile, `Missing KO proof imageFile for ${pid}/${menuId}`);
      assert.ok(jaProof.imageFile, `Missing JA proof imageFile for ${pid}/${menuId}`);
      assert.ok(
        koProof.priceUrl.includes(`branch=${branch}`),
        `Expected KO priceUrl to include branch=${branch} for ${pid}/${menuId}, got ${koProof.priceUrl}`
      );
      assert.ok(
        jaProof.priceUrl.includes(`branch=${branch}`),
        `Expected JA priceUrl to include branch=${branch} for ${pid}/${menuId}, got ${jaProof.priceUrl}`
      );
    }
  }
  assert.ok(check('reverse-hongdae', 'jaw-botox', 'ko').priceUrl.includes('hd.reverseclinic.com'));
  assert.ok(check('reverse-hongdae', 'jaw-botox', 'ja').priceUrl.includes('hd-jp.reverseclinic.com'));
  assert.ok(check('toxnfill-mokdong', 'jaw-botox').priceUrl.includes('toxnfill41.com'));
  assert.equal(check('toxnfill-mokdong', 'jaw-botox').imageFile, 'toxnfill-mokdong-jaw-botox.jpg');
  assert.equal(check('toxnfill-cheonho', 'jaw-botox').imageFile, 'toxnfill-jaw-botox.jpg');
  assert.equal(check('toxnfill-cheonho', 'rejuran-2cc').imageFile, 'toxnfill-rejuran-2cc.jpg');
  assert.equal(check('toxnfill-cheonho', 'potenza').imageFile, null);
  assert.equal(check('toxnfill-cheonho', 'shrink-300').imageFile, null);
  assert.equal(check('toxnfill-jamsil', 'potenza').imageFile, 'toxnfill-potenza.jpg');
  assert.equal(check('toxnfill-jamsil', 'shrink-300').imageFile, 'toxnfill-shrink-300.jpg');
  assert.equal(check('toxnfill-jamsil', 'jaw-botox').imageFile, 'toxnfill-jamsil-jaw-botox.jpg');
  assert.equal(check('toxnfill-jamsil', 'rejuran-2cc').imageFile, 'toxnfill-jamsil-rejuran-2cc.jpg');
  assert.equal(check('drpetit-nowon', 'rejuran-2cc').imageFile, 'drpetit-nowon-rejuran-2cc.jpg');
  assert.equal(check('reverse-myeongdong', 'jaw-botox').imageFile, 'reverse-myeongdong-jaw-botox.jpg');
  assert.equal(check('daybeau-balsan', 'rejuran-2cc').imageFile, 'daybeau-balsan-rejuran-2cc.jpg');
  assert.equal(check('ppeum-jamsil', 'jaw-botox').imageFile, 'ppeum-jamsil-jaw-botox.jpg');
  assert.equal(check('forever-myeongdong', 'rejuran-2cc').imageFile, 'forever-myeongdong-rejuran-2cc.jpg');

  // Invariant 5: Zero wrong-branch names in prices.json noteKo/noteJa
  const branchRules: Array<[RegExp, (p: (typeof dataset.places)[number]) => boolean]> = [
    [/강남본점|江南本店/, (p) => p.nameKo.includes('강남본점')],
    [/강남점|江南店/, (p) => p.id.endsWith('-gangnam')],
    [/홍대점|弘大店/, (p) => p.id.endsWith('-hongdae')],
    [/명동점|明洞店/, (p) => p.id.endsWith('-myeongdong')],
    [/노원점|芦原店/, (p) => p.id.endsWith('-nowon')],
    [/송파점|松坡店/, (p) => p.nameKo.includes('송파')],
    [/반포\s*파미에점|盤浦ファミエ店/, () => false],
    [/영등포점|永登浦店/, (p) => p.id.endsWith('-yeongdeungpo')],
    [/목동점|木洞店/, (p) => p.id.endsWith('-mokdong')],
    [/서울대입구점|ソウル大入口店/, (p) => p.id.endsWith('-snu') || p.id === 'toxnfill-gwanak']
  ];
  for (const place of dataset.places) {
    for (const [menuId, offer] of Object.entries(place.prices)) {
      if (!offer) continue;
      for (const [re, allowed] of branchRules) {
        if (offer.noteKo && re.test(offer.noteKo)) {
          assert.ok(allowed(place), `Wrong branch token in noteKo for ${place.id}/${menuId}: ${offer.noteKo}`);
        }
        if (offer.noteJa && re.test(offer.noteJa)) {
          assert.ok(allowed(place), `Wrong branch token in noteJa for ${place.id}/${menuId}: ${offer.noteJa}`);
        }
      }
    }
  }
});

test('all 137 verified clinics expose truthful structured visual traits and trait filters', () => {
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
  assert.ok(getBrandReview(byId('snow-nowon')).traits.some((t) => t.id === 'limited_rev'));
  assert.ok(getBrandReview(byId('toxnfill-nowon')).traits.some((t) => t.id === 'brand_ref'));
  assert.equal(matchesTraitFilter(byId('toxnfill-nowon'), 'low_upsell'), false);
  assert.equal(matchesTraitFilter(byId('toxnfill-nowon'), 'sunday_night'), false);

  for (const tf of TRAIT_FILTERS) {
    const matched = dataset.places.filter((p) => matchesTraitFilter(p, tf.id));
    assert.ok(matched.length > 0, `Expected >0 clinics for trait filter ${tf.id}`);
  }

  assert.deepEqual(toggleTraitFilters([], 'careful'), ['careful']);
  assert.deepEqual(toggleTraitFilters(['careful'], 'low_upsell'), ['low_upsell', 'careful']);
  assert.deepEqual(toggleTraitFilters(['low_upsell', 'careful'], 'low_upsell'), ['careful']);
  assert.deepEqual(toggleTraitFilters(['low_upsell', 'careful'], 'all'), []);
  assert.deepEqual(normalizeTraitFilters(['careful', 'all', 'low_upsell', 'careful']), [
    'low_upsell',
    'careful'
  ]);
  assert.equal(matchesTraitFilters(byId('vands-sinsa'), ['low_upsell', 'short_wait']), true);
  assert.equal(matchesTraitFilters(byId('vands-sinchon'), ['low_upsell', 'short_wait']), false);
  assert.equal(dataset.places.filter((p) => matchesTraitFilters(p, ['low_upsell', 'careful'])).length, 4);
  assert.equal(dataset.places.filter((p) => matchesTraitFilters(p, [])).length, 137);
});

test('all 137 verified clinics have realistic 5.0-scale AI ratings with 4 axes and rating sort works', () => {
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

test('1회 체험가 주의 문구 및 Wave 1-2 보강 공식 스크린샷/가격 100% 정합성 검증', () => {
  const clinicPageSrc = fs.readFileSync(path.resolve(__dirname, '../components/clinic-page.ts'), 'utf8');
  assert.ok(
    clinicPageSrc.includes('clinic-stepper-caution'),
    'Missing .clinic-stepper-caution badge beside visits stepper'
  );
  assert.ok(
    clinicPageSrc.includes('※ 1회 체험가일 수 있으니 주의하세요'),
    'Missing Korean 1-visit trial caution notice beside stepper'
  );
  assert.ok(
    clinicPageSrc.includes('※ 初回体験価格の場合あり（ご注意ください）'),
    'Missing Japanese 1-visit trial caution notice beside stepper'
  );

  const koDir = path.resolve(__dirname, '../../public/official-proofs');
  const jaDir = path.resolve(__dirname, '../../public/official-proofs-ja');
  const completed4of4 = [
    'snow-nowon',
    'drpetit-hongdae',
    'forever-gangnam',
    'forever-myeongdong',
    'xenia-gangnam',
    'toxnfill-jamsil',
    'toxnfill-samsung',
    'daybeau-myeongdong',
    'reverse-gangnam',
    'drevers-snu',
    'drevers-jamsil',
    'drevers-magok',
    'drevers-gongdeok',
    'drevers-nowon',
    'drevers-cheonho',
    'drevers-cheongdam',
    'drevers-myeongdong',
  ];
  const allMenus = ['rejuran-2cc', 'shrink-300', 'potenza', 'jaw-botox'] as const;
  for (const id of completed4of4) {
    const place = dataset.places.find((p) => p.id === id);
    assert.ok(place, `Missing clinic ${id}`);
    for (const m of allMenus) {
      const pr = getOfficialMenuProof(place, m, 'ko');
      assert.ok(pr.imageFile, `${id}::${m} must have verified proof screenshot`);
      const fname = path.basename(pr.imageFile);
      assert.ok(fs.statSync(path.join(koDir, fname)).size > 20000, `${id}::${m} KO image too small`);
      assert.ok(fs.statSync(path.join(jaDir, fname)).size > 20000, `${id}::${m} JA image too small`);
      assert.equal(place.prices[m]?.krw, pr.verifiedKrw, `${id}::${m} price mismatch between prices.json and proof`);
    }
  }

  const extraVerified: Array<[string, (typeof allMenus)[number], number]> = [
    ['uni-wangsimni', 'rejuran-2cc', 390000],
    ['toxnfill-apgujeong', 'jaw-botox', 50000],
    ['reverse-myeongdong', 'shrink-300', 170000],
    ['reverse-nowon', 'potenza', 220000],
    ['reverse-nowon', 'jaw-botox', 20000],
    ['ppeum-snu', 'jaw-botox', 55000],
    ['ppeum-konkuk', 'rejuran-2cc', 209000],
    ['mimi-suyu', 'jaw-botox', 70000],
    ['velyb-mokdong', 'potenza', 99000],
    ['velyb-cheongnyangni', 'potenza', 150000]
  ];
  for (const [id, m, expectedKrw] of extraVerified) {
    const place = dataset.places.find((p) => p.id === id)!;
    const pr = getOfficialMenuProof(place, m, 'ko');
    assert.equal(place.prices[m]?.krw, expectedKrw, `${id}::${m} prices.json KRW mismatch`);
    assert.equal(pr.verifiedKrw, expectedKrw, `${id}::${m} proof verifiedKrw mismatch`);
    assert.ok(pr.imageFile, `${id}::${m} missing proof imageFile`);
  }
});

test('100% of remaining 137 clinics and 441 offered prices have KO+JA screenshots, detailed effects, and plain wording', () => {
  const koDir = path.resolve(__dirname, '../../public/official-proofs');
  const jaDir = path.resolve(__dirname, '../../public/official-proofs-ja');

  let offerCount = 0;
  for (const place of dataset.places) {
    const offered = Object.keys(place.prices);
    assert.ok(offered.length >= 1, `Unpriced clinic should have been excluded: ${place.id}`);
    for (const menuId of offered) {
      offerCount += 1;
      const ko = getOfficialMenuProof(place, menuId, 'ko');
      const ja = getOfficialMenuProof(place, menuId, 'ja');
      assert.ok(ko.imageFile, `Missing KO proof for ${place.id}::${menuId}`);
      assert.ok(ja.imageFileJa, `Missing JA proof for ${place.id}::${menuId}`);
      assert.equal(ko.verifiedKrw, place.prices[menuId]?.krw, `KRW mismatch on ${place.id}::${menuId}`);
      assert.ok(fs.existsSync(path.join(koDir, ko.imageFile)));
      assert.ok(fs.existsSync(path.join(jaDir, ja.imageFileJa)));
    }
  }
  assert.equal(offerCount, 441);

  for (const menu of dataset.menus) {
    const eff = TREATMENT_EFFECTS[menu.id];
    const dt = TREATMENT_DOWNTIME[menu.id];
    assert.ok(eff, `Missing TREATMENT_EFFECTS entry for ${menu.id}`);
    assert.ok(dt, `Missing TREATMENT_DOWNTIME entry for ${menu.id}`);
    assert.ok(eff.headlineKo.length > 5 && eff.headlineJa.length > 5);
    assert.ok(eff.mechanismKo.length > 20 && eff.mechanismJa.length > 20);
    assert.equal(eff.effectsKo.length, 3);
    assert.equal(eff.effectsJa.length, 3);
    assert.ok(eff.timingKo.length > 10 && eff.timingJa.length > 10);
    assert.equal(/엠보싱|エンボス/.test(JSON.stringify({ eff, dt })), false, `Jargon leaked in ${menu.id}`);
  }

  for (const rel of ['clinic-helpers.ts', '../main.ts', '../components/clinic-page.ts', 'i18n.ts']) {
    const content = fs.readFileSync(path.resolve(__dirname, rel), 'utf8');
    assert.equal(/엠보싱|エンボス/.test(content), false, `Jargon leaked in ${rel}`);
  }
});
