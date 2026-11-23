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

const TARGETS = [
  { sourceUrl: 'https://museclinic.co.kr/', slug: 'muse', preferred: 'https://museclinic.co.kr/' },
  { sourceUrl: 'https://www.toxnfill50.com/', slug: 'toxnfill50', preferred: 'https://www.toxnfill50.com/eventList.php' },
  { sourceUrl: 'https://www.toxnfill35.com/', slug: 'toxnfill35', preferred: 'https://www.toxnfill35.com/eventList.php' },
  { sourceUrl: 'https://www.toxnfill1.com/', slug: 'toxnfill1', preferred: 'https://www.toxnfill1.com/eventServiceInfo.php?c=' },
  { sourceUrl: 'https://www.toxnfill.com/', slug: 'toxnfill', preferred: 'https://www.toxnfill.com/brandEvent.php' },
  { sourceUrl: 'https://www.shinebeam.co.kr/', slug: 'shinebeam', preferred: 'https://www.shinebeam.co.kr/' },
  { sourceUrl: 'https://lienjang.net/', slug: 'lienjang', preferred: 'https://intro.lienjang.net/' },
  { sourceUrl: 'https://www.ppeum.com/', slug: 'ppeum', preferred: 'https://sinnonhyeon.ppeum.com/', minScrollY: 680 },
  { sourceUrl: 'https://abijouonline.com/', slug: 'abijou', preferred: 'https://abijouonline.com/gangnam-main/price' },
  { sourceUrl: 'https://www.maypureclinic.com/', slug: 'maypure', preferred: 'https://www.maypureclinic.com/community/events' },
  { sourceUrl: 'https://drevers.com/', slug: 'drevers', preferred: 'https://drevers.com/brand-event/' },
  { sourceUrl: 'https://uni114.co.kr/', slug: 'youni', preferred: 'https://www.uni114.co.kr/event/' },
  { sourceUrl: 'https://velyb.kr/', slug: 'velyb', preferred: 'https://www.velyb.kr/community/community01.php' },
  { sourceUrl: 'https://daybeauclinic.co.kr/', slug: 'daybeau', preferred: 'https://daybeauclinic07.com/' },
  { sourceUrl: 'https://beautyloungeclinic.com/', slug: 'beautylounge', preferred: 'https://www.beautyloungeclinic.com/ko/procedures' },
  { sourceUrl: 'https://www.mipretty.co.kr/', slug: 'mipretty', preferred: 'https://www.mipretty.co.kr/event/event_list_brand.php' },
  { sourceUrl: 'https://www.4-ever.co.kr/', slug: '4ever', preferred: 'https://4-ever.co.kr/ko/treatments' },
  { sourceUrl: 'https://www.reverseclinic.com/', slug: 'reverse', preferred: 'https://www.reverseclinic.com/index.php?idx=_devnull_/c5db932a7bb84a' },
  { sourceUrl: 'https://www.drdclinic.co.kr/', slug: 'drd', preferred: 'https://www.drdclinic.co.kr/' },
  { sourceUrl: 'https://cellinclinic.com/', slug: 'cellin', preferred: 'https://cellinclinic.com/ko/procedures', minScrollY: 420 },
  { sourceUrl: 'https://jfeelclinic.com/', slug: 'jfeel', preferred: 'https://jfeelclinic.com/' },
  { sourceUrl: 'https://xenia.clinic/', slug: 'xenia', preferred: 'https://xenia.clinic/ko/products', waitExtraMs: 1800, noScroll: true },
  { sourceUrl: 'https://gu.clinic/', slug: 'gu', preferred: 'https://gu.clinic/kr/events' },
  { sourceUrl: 'https://www.k-tox.com/', slug: 'ktox', preferred: 'https://www.k-tox.com/index.php/board/list/event/33' },
  { sourceUrl: 'https://www.tatoa.co.kr/', slug: 'tatoa', preferred: 'https://www.tatoa.co.kr/board/event/list.php' },
  { sourceUrl: 'https://nowon-snow.co.kr/', slug: 'snow', preferred: 'https://nowon-snow.co.kr/event', minScrollY: 380 },
  { sourceUrl: 'https://vandsclinics.com/', slug: 'vands', preferred: 'https://vandsclinics.com/', skipCapture: true },
  { sourceUrl: 'https://doctorpetit.kr/', slug: 'drpetit', preferred: 'https://doctorpetit.kr/', skipCapture: true }
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
    const closePattern = /닫기|오늘.*보지|하루.*열지|보지\s*않기|^close$/i;
    const popupRoots = Array.from(
      document.querySelectorAll(
        '[class*="popup" i], [id*="popup" i], [class*="layerpop" i], [id*="layerpop" i], [class*="modal" i]'
      )
    );
    for (const root of popupRoots) {
      if (root.closest('header, nav, aside')) continue;
      const btns = Array.from(root.querySelectorAll('button, a, [role="button"], .btn-close, .close'));
      for (const el of btns) {
        const txt = (el.textContent || el.getAttribute('aria-label') || '').trim();
        if (closePattern.test(txt)) {
          try {
            el.click();
          } catch {
            // ignore
          }
        }
      }
    }
  });
  await page.waitForTimeout(350);

  // Hide obvious fixed marketing popup wrappers covering center without touching headers/nav/drawers
  await page.evaluate(() => {
    const blocks = Array.from(
      document.querySelectorAll(
        '[class*="popup" i], [id*="popup" i], [class*="layerpop" i], [id*="layerpop" i], [class*="modal" i]'
      )
    );
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    for (const el of blocks) {
      if (el.closest('header, nav, aside') || /menu|nav|side|drawer/i.test(el.className || '')) continue;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') continue;
      if (st.position !== 'fixed' && st.position !== 'absolute') continue;
      const r = el.getBoundingClientRect();
      if (r.width >= 180 && r.height >= 180 && r.width < vw * 0.96 && r.top > 20 && r.top < vh * 0.75) {
        el.style.setProperty('display', 'none', 'important');
      }
    }
  });
}

async function tryNavigateAndValidate(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (!msg.includes('interrupted by another navigation')) {
      return { ok: false, reason: msg.slice(0, 100) };
    }
  }
  await page.waitForTimeout(3200);
  try {
    await page.evaluate(() => document.fonts && document.fonts.ready);
  } catch {
    // ignore
  }

  await dismissPromoPopups(page);

  const check = await page.evaluate(() => {
    const body = document.body;
    const text = (body ? body.innerText : '').trim();
    const blocked = /Access Denied|403 Forbidden|Just a moment|Cloudflare|Verify you are human|Checking your browser/i.test(
      text.slice(0, 1200)
    );
    const has404 = /^404\b|Page Not Found|페이지를 찾을 수 없/i.test((document.title || '') + ' ' + text.slice(0, 300));
    return {
      finalUrl: window.location.href,
      textLen: text.length,
      blocked,
      has404
    };
  });

  if (check.blocked) return { ok: false, reason: 'bot_or_access_gate' };
  if (check.has404) return { ok: false, reason: 'not_found_404' };
  if (check.textLen < 80) return { ok: false, reason: `empty_body(${check.textLen})` };
  return { ok: true, finalUrl: check.finalUrl };
}

async function scrollToPriceSection(page, minScrollY = 0, noScroll = false) {
  if (noScroll) return;
  const targetY = await page.evaluate((minY) => {
    if (minY > 0) return minY;
    const kw = /리쥬란|슈링크|포텐자|보톡스|만원|\d{2,3},000원|가격|EVENT/i;
    const els = Array.from(document.querySelectorAll('section, main, div, h1, h2, h3, li, table, a'));
    let bestY = null;
    for (const el of els) {
      const txt = (el.textContent || '').trim();
      if (!txt || txt.length > 600 || !kw.test(txt)) continue;
      const r = el.getBoundingClientRect();
      const absY = r.top + window.scrollY;
      if (r.height > 20 && absY >= 240 && absY <= 1400) {
        if (bestY === null || absY < bestY) bestY = absY;
      }
    }
    return bestY !== null ? Math.max(0, Math.round(bestY - 80)) : 0;
  }, minScrollY);

  if (targetY > 0) {
    await page.evaluate((y) => window.scrollTo(0, y), targetY);
    await page.waitForTimeout(450);
  }
}

async function captureTarget(page, target) {
  if (target.skipCapture) {
    return {
      sourceUrl: target.sourceUrl,
      priceUrl: target.preferred,
      imageFile: null,
      domainLabel: getDomainLabel(target.preferred),
      status: 'skipped'
    };
  }

  let chosenUrl = target.preferred;
  let res = await tryNavigateAndValidate(page, target.preferred);
  if (!res.ok && target.preferred !== target.sourceUrl) {
    console.warn(`  [fallback] ${target.slug}: ${target.preferred} failed (${res.reason}), trying ${target.sourceUrl}`);
    chosenUrl = target.sourceUrl;
    res = await tryNavigateAndValidate(page, target.sourceUrl);
  }

  if (!res.ok) {
    console.warn(`  [omit-image] ${target.slug}: failed (${res.reason}), using fallback card`);
    return {
      sourceUrl: target.sourceUrl,
      priceUrl: chosenUrl,
      imageFile: null,
      domainLabel: getDomainLabel(chosenUrl),
      status: `failed:${res.reason}`
    };
  }

  if (target.waitExtraMs) {
    await page.waitForTimeout(target.waitExtraMs);
  }
  await scrollToPriceSection(page, target.minScrollY ?? 0, Boolean(target.noScroll));

  const imageFile = `${target.slug}.jpg`;
  const outPath = path.join(outImgDir, imageFile);
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 76 });
  const bytes = fs.statSync(outPath).size;

  return {
    sourceUrl: target.sourceUrl,
    priceUrl: res.finalUrl || chosenUrl,
    imageFile,
    domainLabel: getDomainLabel(res.finalUrl || chosenUrl),
    status: `captured(${Math.round(bytes / 1024)}KB)`
  };
}

async function main() {
  fs.mkdirSync(outImgDir, { recursive: true });
  const capturedDate = getLocalDateIso();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1120, height: 680 },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true
  });

  const results = new Array(TARGETS.length);
  let cursor = 0;

  async function worker() {
    const page = await context.newPage();
    while (cursor < TARGETS.length) {
      const i = cursor++;
      const target = TARGETS[i];
      console.log(`[${i + 1}/${TARGETS.length}] Capturing ${target.slug} (${target.preferred})...`);
      try {
        results[i] = await captureTarget(page, target);
      } catch (err) {
        console.warn(`  [error] ${target.slug}:`, err);
        results[i] = {
          sourceUrl: target.sourceUrl,
          priceUrl: target.preferred,
          imageFile: null,
          domainLabel: getDomainLabel(target.preferred),
          status: 'error'
        };
      }
      console.log(`  -> ${target.slug}: ${results[i].status} -> ${results[i].priceUrl}`);
    }
    await page.close();
  }

  await Promise.all([worker(), worker(), worker(), worker()]);
  await context.close();
  await browser.close();

  const entriesCode = results
    .map(
      (r) => `  ${JSON.stringify(r.sourceUrl)}: {
    sourceUrl: ${JSON.stringify(r.sourceUrl)},
    priceUrl: ${JSON.stringify(r.priceUrl)},
    imageFile: ${JSON.stringify(r.imageFile)},
    capturedDate: ${JSON.stringify(capturedDate)},
    domainLabel: ${JSON.stringify(r.domainLabel)}
  }`
    )
    .join(',\n');

  const tsContent = `import type { PlaceItem } from '../types.ts';

export interface OfficialPriceProof {
  sourceUrl: string;
  priceUrl: string;
  imageFile: string | null;
  capturedDate: string;
  domainLabel: string;
}

export const OFFICIAL_PRICE_PROOFS: Record<string, OfficialPriceProof> = {
${entriesCode}
};

export function getOfficialProof(place: Pick<PlaceItem, 'sourceUrl'>): OfficialPriceProof {
  const hit = OFFICIAL_PRICE_PROOFS[place.sourceUrl];
  if (hit) return hit;
  let domainLabel = place.sourceUrl;
  try {
    domainLabel = new URL(place.sourceUrl).hostname.replace(/^www\\./, '');
  } catch {
    // keep raw sourceUrl
  }
  return {
    sourceUrl: place.sourceUrl,
    priceUrl: place.sourceUrl,
    imageFile: null,
    capturedDate: ${JSON.stringify(capturedDate)},
    domainLabel
  };
}
`;

  fs.writeFileSync(outTsPath, tsContent, 'utf8');

  const capturedCount = results.filter((r) => r.imageFile !== null).length;
  const fallbackCount = results.length - capturedCount;
  console.log(`\nDone! Captured ${capturedCount}/${results.length} official screenshots (${fallbackCount} direct-link fallbacks).`);
  console.log(`Wrote ${outTsPath}`);
}

void main();
