import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outImgDir = path.join(rootDir, 'public', 'official-proofs');
const outTsPath = path.join(rootDir, 'src', 'data', 'official-proofs.ts');
const pricesJsonPath = path.join(rootDir, 'src', 'data', 'prices.json');

const MENU_RULES = {
  'rejuran-2cc': {
    minKrw: 90000,
    maxKrw: 450000,
    preferKeywords: ['리쥬란힐러', '리쥬란 힐러', '2cc']
  },
  'shrink-300': {
    minKrw: 50000,
    maxKrw: 300000,
    preferKeywords: ['슈링크', '300샷']
  },
  potenza: {
    minKrw: 70000,
    maxKrw: 400000,
    preferKeywords: ['포텐자']
  },
  'jaw-botox': {
    minKrw: 9000,
    maxKrw: 100000,
    preferKeywords: ['사각턱', '턱보톡스', '턱 톡신', '에라보톡스']
  }
};

/**
 * Per-sourceUrl official routes discovered from each clinic website's own navigation.
 * Blocked/login-gated domains (VandS, Dr. Petit, PPEUM reservation) are never bypassed.
 */
const BRAND_ADAPTERS = [
  {
    sourceUrl: 'https://abijouonline.com/',
    slug: 'abijou',
    defaultPriceUrl: 'https://abijouonline.com/gangnam-main/price',
    candidates: {
      'shrink-300': [{ url: 'https://abijouonline.com/gangnam-main/price/laser-lifting-treatments/shurink-universe' }],
      'rejuran-2cc': [
        { url: 'https://abijouonline.com/gangnam-main/price', clickVisible: ['스킨부스터', '리쥬란'] }
      ],
      potenza: [
        { url: 'https://abijouonline.com/gangnam-main/price', clickVisible: ['색소·모공·여드름', '포텐자'] }
      ],
      'jaw-botox': [
        { url: 'https://abijouonline.com/gangnam-main/price', clickVisible: ['톡신·윤곽', '사각턱'] }
      ]
    }
  },
  {
    sourceUrl: 'https://museclinic.co.kr/',
    slug: 'muse',
    defaultPriceUrl: 'https://gangnam.museclinic.co.kr/ko/treatments',
    candidates: {
      'shrink-300': [
        { url: 'https://gangnam.museclinic.co.kr/ko' },
        { url: 'https://gangnam.museclinic.co.kr/ko/treatments?category=c1' }
      ],
      'rejuran-2cc': [{ url: 'https://gangnam.museclinic.co.kr/ko/treatments', clickVisible: ['스킨부스터', '리쥬란'] }],
      potenza: [{ url: 'https://gangnam.museclinic.co.kr/ko/treatments', clickVisible: ['레이저', '포텐자'] }],
      'jaw-botox': [{ url: 'https://gangnam.museclinic.co.kr/ko/treatments', clickVisible: ['보톡스', '사각턱'] }]
    }
  },
  {
    sourceUrl: 'https://www.reverseclinic.com/',
    slug: 'reverse',
    defaultPriceUrl: 'https://www.reverseclinic.com/index.php?idx=_devnull_/c5db932a7bb84a',
    candidates: {
      'shrink-300': [{ url: 'https://www.reverseclinic.com/?idx=_devnull_/c5e05b24495a91/c5e0b0ee1e4c07' }],
      'jaw-botox': [{ url: 'https://www.reverseclinic.com/?idx=_devnull_/c5e05b24495a91/c5e0b0ee2e4c09' }],
      potenza: [
        { url: 'https://www.reverseclinic.com/?idx=c5db92aa9f4b1f/c5de0c19241d4a' },
        { url: 'https://www.reverseclinic.com/index.php?idx=_devnull_/c5db932a7bb84a' }
      ],
      'rejuran-2cc': [{ url: 'https://www.reverseclinic.com/?idx=_devnull_/c5e05b24495a91/c5e0b0ee1e4c05' }]
    }
  },
  {
    sourceUrl: 'https://nowon-snow.co.kr/',
    slug: 'snow',
    defaultPriceUrl: 'https://nowon-snow.co.kr/event',
    candidates: {
      'shrink-300': [{ url: 'https://nowon-snow.co.kr/event' }],
      'jaw-botox': [{ url: 'https://nowon-snow.co.kr/event' }],
      'rejuran-2cc': [{ url: 'https://nowon-snow.co.kr/event' }]
    }
  },
  {
    sourceUrl: 'https://www.toxnfill50.com/',
    slug: 'toxnfill50',
    defaultPriceUrl: 'https://www.toxnfill50.com/serviceInfo.php?c=',
    candidates: {
      'jaw-botox': [{ url: 'https://www.toxnfill50.com/serviceInfo.php?c=4725' }],
      'shrink-300': [{ url: 'https://www.toxnfill50.com/serviceInfo.php?c=4724' }],
      'rejuran-2cc': [{ url: 'https://www.toxnfill50.com/serviceInfo.php?c=4729' }],
      potenza: [{ url: 'https://www.toxnfill50.com/serviceInfo.php?c=4727' }]
    }
  },
  {
    sourceUrl: 'https://www.toxnfill35.com/',
    slug: 'toxnfill35',
    defaultPriceUrl: 'https://www.toxnfill35.com/serviceInfo.php?c=',
    candidates: {
      'jaw-botox': [{ url: 'https://www.toxnfill35.com/serviceInfo.php?c=' }, { url: 'https://www.toxnfill35.com/eventList.php' }],
      'shrink-300': [{ url: 'https://www.toxnfill35.com/serviceInfo.php?c=' }, { url: 'https://www.toxnfill35.com/eventList.php' }],
      'rejuran-2cc': [{ url: 'https://www.toxnfill35.com/serviceInfo.php?c=' }, { url: 'https://www.toxnfill35.com/eventList.php' }],
      potenza: [{ url: 'https://www.toxnfill35.com/serviceInfo.php?c=' }, { url: 'https://www.toxnfill35.com/eventList.php' }]
    }
  },
  {
    sourceUrl: 'https://www.toxnfill1.com/',
    slug: 'toxnfill1',
    defaultPriceUrl: 'https://www.toxnfill1.com/serviceInfo.php?c=',
    candidates: {
      'jaw-botox': [{ url: 'https://www.toxnfill1.com/serviceInfo.php?c=' }],
      'shrink-300': [{ url: 'https://www.toxnfill1.com/serviceInfo.php?c=' }],
      'rejuran-2cc': [{ url: 'https://www.toxnfill1.com/serviceInfo.php?c=' }],
      potenza: [{ url: 'https://www.toxnfill1.com/serviceInfo.php?c=' }]
    }
  },
  {
    sourceUrl: 'https://www.toxnfill.com/',
    slug: 'toxnfill',
    defaultPriceUrl: 'https://www.toxnfill.com/brandEvent.php',
    candidates: {
      'jaw-botox': [{ url: 'https://www.toxnfill.com/brandEvent.php' }],
      'shrink-300': [{ url: 'https://www.toxnfill.com/brandEvent.php' }],
      'rejuran-2cc': [{ url: 'https://www.toxnfill.com/brandEvent.php' }],
      potenza: [{ url: 'https://www.toxnfill.com/brandEvent.php' }]
    }
  },
  {
    sourceUrl: 'https://uni114.co.kr/',
    slug: 'youni',
    defaultPriceUrl: 'https://www.uni114.co.kr/event/',
    candidates: {
      'jaw-botox': [{ url: 'https://www.uni114.co.kr/event/' }],
      'shrink-300': [{ url: 'https://www.uni114.co.kr/event/' }],
      'rejuran-2cc': [{ url: 'https://www.uni114.co.kr/event/' }],
      potenza: [{ url: 'https://www.uni114.co.kr/event/' }]
    }
  },
  {
    sourceUrl: 'https://velyb.kr/',
    slug: 'velyb',
    defaultPriceUrl: 'https://www.velyb.kr/community/community01.php',
    candidates: {
      'rejuran-2cc': [{ url: 'https://www.velyb.kr/community/community01.php' }],
      'shrink-300': [{ url: 'https://www.velyb.kr/community/community01.php' }],
      'jaw-botox': [{ url: 'https://www.velyb.kr/community/community01.php' }],
      potenza: [{ url: 'https://www.velyb.kr/community/community01.php' }]
    }
  },
  {
    sourceUrl: 'https://gu.clinic/',
    slug: 'gu',
    defaultPriceUrl: 'https://gu.clinic/kr/treatment-reservation',
    candidates: {
      'rejuran-2cc': [{ url: 'https://gu.clinic/kr/treatment-reservation?categoryId=64094b472967084b5da28381' }],
      'shrink-300': [{ url: 'https://gu.clinic/kr/treatment-reservation', clickVisible: ['리프팅'] }],
      potenza: [{ url: 'https://gu.clinic/kr/treatment-reservation?categoryId=64094b472967084b5da28385' }],
      'jaw-botox': [{ url: 'https://gu.clinic/kr/treatment-reservation?categoryId=64094b472967084b5da2837f' }]
    }
  },
  {
    sourceUrl: 'https://www.maypureclinic.com/',
    slug: 'maypure',
    defaultPriceUrl: 'https://www.maypureclinic.com/community/events',
    candidates: {
      'rejuran-2cc': [{ url: 'https://www.maypureclinic.com/community/events' }],
      'shrink-300': [{ url: 'https://www.maypureclinic.com/community/events' }],
      potenza: [{ url: 'https://www.maypureclinic.com/community/events' }],
      'jaw-botox': [{ url: 'https://www.maypureclinic.com/community/events' }]
    }
  },
  {
    sourceUrl: 'https://drevers.com/',
    slug: 'drevers',
    defaultPriceUrl: 'https://drevers.com/brand-event/',
    candidates: {
      'rejuran-2cc': [{ url: 'https://drevers.com/brand-event/' }],
      'shrink-300': [{ url: 'https://drevers.com/brand-event/' }],
      potenza: [{ url: 'https://drevers.com/brand-event/' }],
      'jaw-botox': [{ url: 'https://drevers.com/brand-event/' }]
    }
  },
  {
    sourceUrl: 'https://www.tatoa.co.kr/',
    slug: 'tatoa',
    defaultPriceUrl: 'https://www.tatoa.co.kr/board/event/list.php',
    candidates: {
      'rejuran-2cc': [{ url: 'https://www.tatoa.co.kr/board/event/list.php' }],
      'shrink-300': [{ url: 'https://www.tatoa.co.kr/board/event/list.php' }],
      potenza: [{ url: 'https://www.tatoa.co.kr/board/event/list.php' }],
      'jaw-botox': [{ url: 'https://www.tatoa.co.kr/board/event/list.php' }]
    }
  },
  {
    sourceUrl: 'https://www.k-tox.com/',
    slug: 'ktox',
    defaultPriceUrl: 'https://www.k-tox.com/index.php/board/list/event/33',
    candidates: {
      'rejuran-2cc': [{ url: 'https://www.k-tox.com/index.php/board/list/event/33' }],
      'jaw-botox': [{ url: 'https://www.k-tox.com/index.php/board/list/event/33' }]
    }
  },
  {
    sourceUrl: 'https://www.mipretty.co.kr/',
    slug: 'mipretty',
    defaultPriceUrl: 'https://www.mipretty.co.kr/event/event_list_brand.php',
    candidates: {
      'rejuran-2cc': [{ url: 'https://www.mipretty.co.kr/event/event_list_brand.php' }],
      'shrink-300': [{ url: 'https://www.mipretty.co.kr/event/event_list_brand.php' }],
      'jaw-botox': [{ url: 'https://www.mipretty.co.kr/event/event_list_brand.php' }]
    }
  },
  {
    sourceUrl: 'https://www.4-ever.co.kr/',
    slug: '4ever',
    defaultPriceUrl: 'https://4-ever.co.kr/ko/treatments',
    candidates: {
      'rejuran-2cc': [{ url: 'https://4-ever.co.kr/ko/treatments' }],
      'shrink-300': [{ url: 'https://4-ever.co.kr/ko/treatments' }],
      'jaw-botox': [{ url: 'https://4-ever.co.kr/ko/treatments' }]
    }
  },
  {
    sourceUrl: 'https://xenia.clinic/',
    slug: 'xenia',
    defaultPriceUrl: 'https://xenia.clinic/ko/products',
    candidates: {
      'shrink-300': [{ url: 'https://xenia.clinic/ko/products?category=2121f806-571e-4b4f-afff-a7e3cf768679' }],
      potenza: [{ url: 'https://xenia.clinic/ko/products?category=9f3ef81f-0578-479d-98ea-818298db986e' }],
      'jaw-botox': [{ url: 'https://xenia.clinic/ko/products?category=50e03a35-4947-4dc9-a9cb-3bcb2034d5f2' }]
    }
  },
  {
    sourceUrl: 'https://beautyloungeclinic.com/',
    slug: 'beautylounge',
    defaultPriceUrl: 'https://www.beautyloungeclinic.com/ko/procedures',
    candidates: {
      'shrink-300': [{ url: 'https://www.beautyloungeclinic.com/ko/events' }],
      'rejuran-2cc': [{ url: 'https://www.beautyloungeclinic.com/ko/events' }],
      potenza: [{ url: 'https://www.beautyloungeclinic.com/ko/events' }],
      'jaw-botox': [{ url: 'https://www.beautyloungeclinic.com/ko/events' }]
    }
  },
  // Direct link fallback-only brands (blocked/login-walled/no static single-treatment table)
  { sourceUrl: 'https://vandsclinics.com/', slug: 'vands', defaultPriceUrl: 'https://vandsclinics.com/', candidates: {} },
  { sourceUrl: 'https://doctorpetit.kr/', slug: 'drpetit', defaultPriceUrl: 'https://doctorpetit.kr/', candidates: {} },
  { sourceUrl: 'https://www.ppeum.com/', slug: 'ppeum', defaultPriceUrl: 'https://sinnonhyeon.ppeum.com/', candidates: {} },
  { sourceUrl: 'https://www.shinebeam.co.kr/', slug: 'shinebeam', defaultPriceUrl: 'https://www.shinebeam.co.kr/', candidates: {} },
  { sourceUrl: 'https://lienjang.net/', slug: 'lienjang', defaultPriceUrl: 'https://intro.lienjang.net/', candidates: {} },
  { sourceUrl: 'https://daybeauclinic.co.kr/', slug: 'daybeau', defaultPriceUrl: 'https://daybeauclinic.co.kr/', candidates: {} },
  { sourceUrl: 'https://www.drdclinic.co.kr/', slug: 'drd', defaultPriceUrl: 'https://www.drdclinic.co.kr/', candidates: {} },
  { sourceUrl: 'https://cellinclinic.com/', slug: 'cellin', defaultPriceUrl: 'https://cellinclinic.com/ko/procedures', candidates: {} },
  { sourceUrl: 'https://jfeelclinic.com/', slug: 'jfeel', defaultPriceUrl: 'https://jfeelclinic.com/', candidates: {} }
];

function getDomainLabel(urlStr) {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

function getLocalDateIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function dismissPromoPopups(page) {
  await page.evaluate(() => {
    const strictClosePattern = /^(?:닫기|1일간\s*보지\s*않기|오늘\s*하루\s*보지\s*않기|오늘.*보지\s*않기|다시\s*보지\s*않기|close)$/i;
    const popupRoots = Array.from(
      document.querySelectorAll(
        '[role="dialog"], [aria-modal="true"], [class*="popup" i], [id*="popup" i], [class*="layerpop" i], [id*="layerpop" i], [class*="modal" i]'
      )
    );
    for (const root of popupRoots) {
      if (root.closest('header, nav, aside')) continue;
      const btns = Array.from(root.querySelectorAll('button, a, [role="button"], .btn-close, .close'));
      for (const el of btns) {
        if (el.offsetParent === null) continue;
        const txt = (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        if (strictClosePattern.test(txt)) {
          try {
            el.click();
          } catch {
            // ignore
          }
        }
      }
    }
  });
  await page.waitForTimeout(450);

  await page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const blocks = Array.from(
      document.querySelectorAll(
        '[role="dialog"], [aria-modal="true"], [class*="popup" i], [id*="popup" i], [class*="layerpop" i], [id*="layerpop" i], [class*="modal" i], [class*="backdrop" i], [class*="dim" i]'
      )
    );
    for (const el of blocks) {
      if (el.closest('header, nav, aside') || /menu|nav|side|drawer/i.test(el.className || '')) continue;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') continue;
      if (st.position !== 'fixed' && st.position !== 'absolute') continue;
      const r = el.getBoundingClientRect();
      if (
        (r.width >= 180 && r.height >= 180 && r.width < vw * 0.96 && r.top > 20 && r.top < vh * 0.75) ||
        (r.width >= vw * 0.85 && r.height >= vh * 0.85)
      ) {
        el.style.setProperty('display', 'none', 'important');
      }
    }
  });
}

async function navigateSafe(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 14000 });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (!msg.includes('interrupted by another navigation')) {
      return false;
    }
  }
  await page.waitForTimeout(2600);
  try {
    await page.evaluate(() => document.fonts && document.fonts.ready);
  } catch {
    // ignore
  }
  await dismissPromoPopups(page);
  return true;
}

/**
 * Finds the tightest visible card/row DOM element matching BOTH exact treatment semantics
 * and a valid KRW price inside sanity bounds, scrolls it cleanly into viewport center,
 * and confirms it is completely visible & unclipped by sticky headers.
 */
async function findAndFocusExactPriceCard(page, menuId, targetKrw) {
  const rule = MENU_RULES[menuId];
  const candidateIdx = await page.evaluate(
    ({ menuId: mId, targetKrw: expectedKrw, minKrw, maxKrw }) => {
      function parsePricesFromNode(node) {
        const prices = [];
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let tNode;
        while ((tNode = walker.nextNode())) {
          const raw = (tNode.nodeValue || '').trim();
          if (!raw) continue;
          const parentEl = tNode.parentElement;
          const isStrike = parentEl
            ? Boolean(parentEl.closest('s, del, strike')) ||
              /line-through/.test(getComputedStyle(parentEl).textDecorationLine || '')
            : false;

          // Match e.g. "189,000원", "₩89,000", "18.9만원", "12만원"
          const rx = /(?:₩\s*([\d,]{4,7})|([\d,]{4,7})\s*원?|(\d+(?:\.\d+)?)\s*만\s*원)/g;
          let m;
          while ((m = rx.exec(raw)) !== null) {
            let val = null;
            if (m[1]) val = Number(m[1].replace(/,/g, ''));
            else if (m[2]) val = Number(m[2].replace(/,/g, ''));
            else if (m[3]) val = Math.round(Number(m[3]) * 10000);
            if (val && Number.isFinite(val) && val >= minKrw && val <= maxKrw) {
              prices.push({ val, raw: m[0].trim(), isStrike });
            }
          }
        }
        return prices;
      }

      function matchesMenuStrictly(text, id) {
        const norm = text.replace(/\s+/g, ' ').trim();
        if (id === 'rejuran-2cc') {
          if (!/리쥬란/.test(norm) || !/2\s*cc/i.test(norm)) return false;
          if (/리쥬란\s*hb|리쥬란hb|수면|\+|올리지오|인모드|슈링크|울쎄라|리투오|써마지|온다|쥬베룩|엑소좀|릴리이드|물광|아이\s*리쥬란/i.test(norm)) {
            return false;
          }
          return true;
        }
        if (id === 'shrink-300') {
          if (!/슈링크/.test(norm) || !/300\s*샷/.test(norm)) return false;
          if (/\+|인모드|온다|울쎄라|보톡스|윤곽|볼뉴머|리쥬란|써마지|올리지오|바디|패키지|부스터|브이/.test(norm)) {
            return false;
          }
          return true;
        }
        if (id === 'potenza') {
          if (!/포텐자/.test(norm)) return false;
          if (/\+|쥬베룩|엑소좀|리쥬란|스킨부스터|미라젯|골드ppt|패키지|5회|3회/.test(norm)) {
            return false;
          }
          return true;
        }
        if (id === 'jaw-botox') {
          if (!/(사각턱\s*보톡스|턱\s*보톡스|턱\s*톡신|에라보톡스)/.test(norm)) return false;
          if (/\+|주름|침샘|승모근|종아리|바디|스킨보톡스|윤곽주사|다한증|눈가|이마|미간/.test(norm)) {
            return false;
          }
          return true;
        }
        return false;
      }

      const candidates = Array.from(
        document.querySelectorAll('tr, li, article, section, a, div')
      );
      const scored = [];

      candidates.forEach((el, domIdx) => {
        if (el.offsetParent === null) return;
        if (el.closest('header, nav, footer')) return;
        if (parseFloat(getComputedStyle(el).opacity || '1') < 0.8) return;
        const r = el.getBoundingClientRect();
        if (r.width < 150 || r.width > 1090 || r.height < 26 || r.height > 460) return;

        const txt = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (txt.length < 8 || txt.length > 360) return;
        if (!matchesMenuStrictly(txt, mId)) return;

        const prices = parsePricesFromNode(el);
        const nonStrike = prices.filter((p) => !p.isStrike);
        if (nonStrike.length === 0) return;

        // Pick non-strikethrough price: exact expectedKrw first, otherwise lowest valid price on single item
        const exactHit = nonStrike.find((p) => p.val === expectedKrw);
        const picked = exactHit || [...nonStrike].sort((a, b) => a.val - b.val)[0];

        // Clear any prior marker
        el.removeAttribute('data-proof-candidate');
        el.setAttribute('data-proof-candidate', String(domIdx));

        scored.push({
          domIdx,
          area: r.width * r.height,
          isExactMatch: Boolean(exactHit),
          textLen: txt.length,
          verifiedKrw: picked.val,
          priceText: picked.raw,
          matchedText: txt.slice(0, 140)
        });
      });

      if (scored.length === 0) return null;
      scored.sort((a, b) => {
        if (a.isExactMatch !== b.isExactMatch) return a.isExactMatch ? -1 : 1;
        return a.area - b.area || a.textLen - b.textLen;
      });
      return scored[0];
    },
    { menuId, targetKrw: targetKrw ?? -1, minKrw: rule.minKrw, maxKrw: rule.maxKrw }
  );

  if (!candidateIdx) return null;

  // Highlight + center candidate cleanly below any sticky header
  const visibleCheck = await page.evaluate((domIdx) => {
    const el = document.querySelector(`[data-proof-candidate="${domIdx}"]`);
    if (!el) return null;

    el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });

    // Compute sticky header bottom offset so header does not overlap our proof card
    let headerBottom = 0;
    for (const fixedEl of Array.from(document.querySelectorAll('header, nav, div'))) {
      const st = getComputedStyle(fixedEl);
      if (st.position !== 'fixed' && st.position !== 'sticky') continue;
      const hr = fixedEl.getBoundingClientRect();
      if (hr.top <= 16 && hr.height >= 36 && hr.height <= 180 && hr.width > window.innerWidth * 0.5) {
        headerBottom = Math.max(headerBottom, hr.bottom);
      }
    }

    let r = el.getBoundingClientRect();
    if (r.top < headerBottom + 12) {
      window.scrollBy(0, r.top - (headerBottom + 24));
      r = el.getBoundingClientRect();
    }

    // Subtle crisp callout border so viewer immediately spots the exact row if small
    el.style.setProperty('outline', '2px solid #ff1e84', 'important');
    el.style.setProperty('outline-offset', '2px', 'important');

    return {
      inViewport:
        r.height >= 24 &&
        r.top >= Math.max(0, headerBottom - 4) &&
        r.bottom <= window.innerHeight &&
        r.left >= 0 &&
        r.right <= window.innerWidth,
      rect: {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        width: Math.round(r.width),
        height: Math.round(r.height)
      }
    };
  }, candidateIdx.domIdx);

  if (!visibleCheck || !visibleCheck.inViewport) {
    return null;
  }

  // Wait for scroll-reveal / fade-in transitions (e.g., GU Clinic opacity 0 -> 1)
  await page.waitForTimeout(800);
  const opaqueAfterScroll = await page.evaluate((domIdx) => {
    const el = document.querySelector(`[data-proof-candidate="${domIdx}"]`);
    if (!el) return false;
    for (let cur = el; cur && cur !== document.body; cur = cur.parentElement) {
      if (parseFloat(getComputedStyle(cur).opacity || '1') < 0.85) return false;
    }
    return true;
  }, candidateIdx.domIdx);

  if (!opaqueAfterScroll) {
    return null;
  }

  return candidateIdx;
}

async function main() {
  fs.mkdirSync(outImgDir, { recursive: true });
  const dataset = JSON.parse(fs.readFileSync(pricesJsonPath, 'utf8'));
  const capturedDate = getLocalDateIso();

  // Build map: sourceUrl -> current price per menuId
  const sourceMenuPrices = new Map();
  for (const place of dataset.places) {
    if (!sourceMenuPrices.has(place.sourceUrl)) sourceMenuPrices.set(place.sourceUrl, {});
    const obj = sourceMenuPrices.get(place.sourceUrl);
    for (const [mId, offer] of Object.entries(place.prices)) {
      if (!(mId in obj)) obj[mId] = offer.krw;
    }
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1120, height: 680 },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true
  });

  const proofRecords = [];
  const brandUrls = {};
  const syncedChanges = [];

  for (const adapter of BRAND_ADAPTERS) {
    brandUrls[adapter.sourceUrl] = {
      priceUrl: adapter.defaultPriceUrl,
      domainLabel: getDomainLabel(adapter.defaultPriceUrl)
    };

    const menuEntries = Object.entries(adapter.candidates);
    if (menuEntries.length === 0) continue;

    const page = await context.newPage();
    const currentPrices = sourceMenuPrices.get(adapter.sourceUrl) || {};

    for (const [menuId, steps] of menuEntries) {
      if (!(menuId in currentPrices)) continue;
      let capturedForMenu = false;

      for (const step of steps) {
        const ok = await navigateSafe(page, step.url);
        if (!ok) continue;

        if (Array.isArray(step.clickVisible)) {
          for (const label of step.clickVisible) {
            await page.evaluate((kw) => {
              const els = Array.from(document.querySelectorAll('a, button, li, span, div'));
              const match = els.find((el) => {
                if (el.offsetParent === null) return false;
                const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
                return t === kw || (t.length <= 20 && t.includes(kw));
              });
              if (match) match.click();
            }, label);
            await page.waitForTimeout(1300);
          }
          await dismissPromoPopups(page);
        }

        const hit = await findAndFocusExactPriceCard(page, menuId, currentPrices[menuId]);
        if (!hit) continue;

        const finalUrl = page.url();
        const imageFile = `${adapter.slug}-${menuId}.jpg`;
        const outPath = path.join(outImgDir, imageFile);
        await page.screenshot({ path: outPath, type: 'jpeg', quality: 78 });
        const kb = Math.round(fs.statSync(outPath).size / 1024);

        // Sync dataset places matching this sourceUrl & menuId if live official price changed
        if (hit.verifiedKrw !== currentPrices[menuId]) {
          syncedChanges.push({
            sourceUrl: adapter.sourceUrl,
            slug: adapter.slug,
            menuId,
            oldKrw: currentPrices[menuId],
            newKrw: hit.verifiedKrw,
            matchedText: hit.matchedText
          });
          currentPrices[menuId] = hit.verifiedKrw;
          for (const place of dataset.places) {
            if (place.sourceUrl === adapter.sourceUrl && place.prices[menuId]) {
              place.prices[menuId].krw = hit.verifiedKrw;
            }
          }
        }

        proofRecords.push({
          key: `${adapter.sourceUrl}::${menuId}`,
          sourceUrl: adapter.sourceUrl,
          menuId,
          priceUrl: finalUrl,
          imageFile,
          verifiedKrw: hit.verifiedKrw,
          matchedText: hit.matchedText,
          capturedDate,
          domainLabel: getDomainLabel(finalUrl)
        });

        console.log(
          `[CAPTURED] ${adapter.slug} / ${menuId} -> ${hit.verifiedKrw} (${hit.priceText}) [${kb}KB] | ${hit.matchedText.slice(0, 70)}`
        );
        capturedForMenu = true;
        break;
      }

      if (!capturedForMenu) {
        console.log(`[FALLBACK] ${adapter.slug} / ${menuId}: no exact single-item HTML price matched`);
      }
    }

    await page.close();
  }

  await context.close();
  await browser.close();

  if (syncedChanges.length > 0) {
    dataset.meta.checkedDate = capturedDate;
    fs.writeFileSync(pricesJsonPath, JSON.stringify(dataset, null, 2) + '\n', 'utf8');
    console.log(`\nSynced ${syncedChanges.length} prices in src/data/prices.json to match live official screenshots:`);
    for (const sc of syncedChanges) {
      console.log(`  [SYNC] ${sc.slug} (${sc.menuId}): ${sc.oldKrw} -> ${sc.newKrw}`);
    }
  }

  const brandUrlsCode = Object.entries(brandUrls)
    .map(
      ([src, info]) => `  ${JSON.stringify(src)}: {
    priceUrl: ${JSON.stringify(info.priceUrl)},
    domainLabel: ${JSON.stringify(info.domainLabel)},
    capturedDate: ${JSON.stringify(capturedDate)}
  }`
    )
    .join(',\n');

  const menuProofsCode = proofRecords
    .map(
      (r) => `  ${JSON.stringify(r.key)}: {
    sourceUrl: ${JSON.stringify(r.sourceUrl)},
    menuId: ${JSON.stringify(r.menuId)},
    priceUrl: ${JSON.stringify(r.priceUrl)},
    imageFile: ${JSON.stringify(r.imageFile)},
    verifiedKrw: ${r.verifiedKrw},
    matchedText: ${JSON.stringify(r.matchedText)},
    capturedDate: ${JSON.stringify(r.capturedDate)},
    domainLabel: ${JSON.stringify(r.domainLabel)}
  }`
    )
    .join(',\n');

  const tsContent = `import type { PlaceItem } from '../types.ts';

export interface OfficialBrandProofLink {
  priceUrl: string;
  domainLabel: string;
  capturedDate: string;
}

export interface OfficialMenuProof {
  sourceUrl: string;
  menuId: string;
  priceUrl: string;
  imageFile: string | null;
  verifiedKrw: number | null;
  matchedText: string | null;
  capturedDate: string;
  domainLabel: string;
}

export const OFFICIAL_BRAND_PRICE_URLS: Record<string, OfficialBrandProofLink> = {
${brandUrlsCode}
};

export const OFFICIAL_MENU_PROOFS: Record<string, OfficialMenuProof> = {
${menuProofsCode}
};

export function getOfficialProof(place: Pick<PlaceItem, 'sourceUrl'>): OfficialBrandProofLink {
  const hit = OFFICIAL_BRAND_PRICE_URLS[place.sourceUrl];
  if (hit) return hit;
  let domainLabel = place.sourceUrl;
  try {
    domainLabel = new URL(place.sourceUrl).hostname.replace(/^www\\./, '');
  } catch {
    // keep raw sourceUrl
  }
  return {
    priceUrl: place.sourceUrl,
    domainLabel,
    capturedDate: ${JSON.stringify(capturedDate)}
  };
}

export function getOfficialMenuProof(
  place: Pick<PlaceItem, 'sourceUrl' | 'prices'>,
  menuId: string
): OfficialMenuProof {
  const brandLink = getOfficialProof(place);
  const key = \`\${place.sourceUrl}::\${menuId}\`;
  const hit = OFFICIAL_MENU_PROOFS[key];
  const listedKrw = place.prices[menuId]?.krw ?? null;

  // Strict Zero-Mismatch Guard: show screenshot ONLY when verifiedKrw equals displayed krw
  if (hit && hit.imageFile && listedKrw !== null && hit.verifiedKrw === listedKrw) {
    return hit;
  }

  return {
    sourceUrl: place.sourceUrl,
    menuId,
    priceUrl: hit?.priceUrl ?? brandLink.priceUrl,
    imageFile: null,
    verifiedKrw: listedKrw,
    matchedText: null,
    capturedDate: brandLink.capturedDate,
    domainLabel: brandLink.domainLabel
  };
}
`;

  fs.writeFileSync(outTsPath, tsContent, 'utf8');
  console.log(`\nDone! Captured ${proofRecords.length} exact-price per-treatment screenshots.`);
  console.log(`Wrote ${outTsPath}`);
}

void main();
