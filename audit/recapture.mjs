// Recaptures official price screenshots for proofs whose image did not show the listed price.
// For each item: open the official price page, find the element that shows BOTH the treatment keyword
// and the listed KRW price, outline it, screenshot 1280x900, and save to a staging folder.
// Images are only promoted after OCR confirms the price inside the box.
// Run: node --experimental-strip-types audit/recapture.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { OFFICIAL_MENU_PROOFS } from '../src/data/official-proofs.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const stage = path.join(here, 'recapture');
fs.mkdirSync(path.join(stage, 'ko'), { recursive: true });
fs.mkdirSync(path.join(stage, 'ja'), { recursive: true });
const dataset = JSON.parse(fs.readFileSync(path.join(root, 'src/data/prices.json'), 'utf8'));
const cls = JSON.parse(fs.readFileSync(path.join(here, 'ocr/nf-classes.json'), 'utf8'));
const skip = (process.env.SKIP_PREFIX || '').split(',').filter(Boolean);
const items = [...cls.errorPage, ...cls.noBox, ...cls.boxOtherPrice].filter((x) => !skip.some((p) => x.place.startsWith(p)));
if (process.env.ITEMS_FILE) items.splice(0, items.length, ...JSON.parse(fs.readFileSync(process.env.ITEMS_FILE, 'utf8')));

const KEYWORDS = {
  'rejuran-2cc': ['리쥬란', 'リジュラン', 'Rejuran'],
  'shrink-300': ['슈링크', 'シュリンク', 'Shrink'],
  potenza: ['포텐자', 'ポテンツァ', 'Potenza'],
  'jaw-botox': ['사각턱', '턱보톡스', '턱 보톡스', '턱톡신', 'エラ'],
  'juvelook-2cc': ['쥬베룩', 'ジュベルック', 'Juvelook'],
  're2o-5cc': ['리투오', '리투S', 'Re2O', 'リトゥオ', 'ブナジュ', '엘라비에'],
  'inmode-fx': ['인모드', 'インモード', 'InMode', 'Inmode'],
  lalapeel: ['라라필', 'ララピール', 'LaLa', 'Lala'],
  aquapeel: ['아쿠아필', 'アクアピール', 'Aqua']
};

function proofFor(placeId, menuId) {
  const place = dataset.places.find((p) => p.id === placeId);
  const key = OFFICIAL_MENU_PROOFS[`${placeId}::${menuId}`] ? `${placeId}::${menuId}` : `${place.sourceUrl}::${menuId}`;
  return { key, proof: OFFICIAL_MENU_PROOFS[key] };
}

async function captureOne(page, url, menuId, krw, outFile) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  } catch (e) {
    // sites that redirect right away (e.g. language or event pages) interrupt the first navigation
    if (!/interrupted by another navigation/.test(String(e.message))) throw e;
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  }
  await page.waitForTimeout(3500);
  const status = await page.evaluate(() => document.title + ' ' + document.body.innerText.slice(0, 200));
  if (/Too Many Requests|Access Denied|Forbidden|Just a moment/i.test(status)) return { ok: false, why: 'blocked' };
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(350);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  const found = await page.evaluate(
    ({ keys, krw }) => {
      const fmt = krw.toLocaleString('en-US');
      const man = krw % 10000 === 0 ? `${krw / 10000}만` : null;
      const norm = (s) => (s || '').replace(/\s+/g, '');
      const priceRe = new RegExp(`(^|[^0-9,.])${fmt.replace(/,/g, '[,.]?')}(?![0-9])`);
      const hasPrice = (t) => {
        const n = norm(t);
        return priceRe.test(n) || Boolean(man && n.includes(man + '원'));
      };
      const hasKey = (t) => keys.some((k) => (t || '').includes(k));
      let best = null;
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const t = el.innerText;
        if (!t || t.length > 600) continue;
        if (hasKey(t) && hasPrice(t) && (!best || t.length < best.innerText.length)) best = el;
      }
      if (!best) return null;
      best.scrollIntoView({ block: 'center' });
      best.style.setProperty('outline', '2px solid #ff1e84', 'important');
      best.style.setProperty('outline-offset', '2px', 'important');
      return best.innerText.replace(/\s+/g, ' ').slice(0, 160);
    },
    { keys: KEYWORDS[menuId], krw }
  );
  if (!found) return { ok: false, why: 'not-found-on-page' };
  await page.waitForTimeout(600);
  await page.screenshot({ path: outFile, type: 'jpeg', quality: 82 });
  return { ok: true, text: found };
}

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'ko-KR',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
});
const page = await ctx.newPage();
const results = [];
const lastHit = new Map();
for (const it of items) {
  const { key, proof } = proofFor(it.place, it.menu);
  const res = { place: it.place, menu: it.menu, krw: it.krw, key, image: proof.imageFile, imageJa: proof.imageFileJa ?? null };
  for (const [lang, url, file] of [
    ['ko', proof.priceUrl, proof.imageFile],
    ['ja', proof.priceUrlJa, proof.imageFileJa]
  ]) {
    if (!url || !file) continue;
    const host = new URL(url).host;
    const wait = 4000 - (Date.now() - (lastHit.get(host) ?? 0));
    if (wait > 0) await page.waitForTimeout(wait);
    lastHit.set(host, Date.now());
    try {
      res[lang] = await captureOne(page, url, it.menu, it.krw, path.join(stage, lang, file));
    } catch (e) {
      res[lang] = { ok: false, why: 'error ' + String(e.message).slice(0, 80) };
    }
  }
  results.push(res);
  console.error(`${it.place}/${it.menu} ko:${res.ko?.ok ? 'OK' : res.ko?.why} ja:${res.ja ? (res.ja.ok ? 'OK' : res.ja.why) : '-'}`);
  fs.writeFileSync(path.join(stage, process.env.RESULTS_NAME || 'results.json'), JSON.stringify(results, null, 1));
}
await browser.close();
