// Audit only: counts React re-renders per component during the main flows, using React Scan.
// Needs the dev server on :5181 (component names are minified in production builds).
// Run: node audit/react-scan.mjs
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scanSrc = fs.readFileSync(path.resolve(__dirname, '../node_modules/react-scan/dist/auto.global.js'), 'utf8');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await page.route(/concierge\.mock\.invalid/, (r) =>
  r.request().method() === 'OPTIONS'
    ? r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } })
    : r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":false}' })
);
await page.addInitScript(() => {
  window.__renders = {};
  window.__phase = 'load';
});
await page.addInitScript({ content: scanSrc });
await page.goto('http://localhost:5181/?lang=ja');
await page.waitForSelector('button.row-main', { timeout: 30000 });
await page.evaluate(() => {
  window.reactScan({
    showToolbar: false,
    log: false,
    onRender: (fiber, renders) => {
      const t = fiber.type;
      if (typeof t === 'string') return; // host elements
      const name = (t && (t.displayName || t.name)) || '?';
      const bucket = (window.__renders[window.__phase] ??= {});
      bucket[name] = (bucket[name] ?? 0) + Math.max(1, renders.length);
    }
  });
});

const phase = (name) => page.evaluate((n) => (window.__phase = n), name);

await phase('idle-ranking-5s');
await page.waitForTimeout(5000);

await phase('switch-treatment-x3');
const cells = page.locator('#treat-grid button.treat-cell');
for (const i of [1, 2, 3]) {
  await cells.nth(i).click();
  await page.waitForTimeout(1200);
}

await phase('scroll-ranking');
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(250);
}

await phase('open-filter');
await page.mouse.wheel(0, -5000);
await page.locator('#open-filter-btn').click();
await page.waitForTimeout(800);
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

await phase('concierge-chips');
await page.locator('button.apptab-btn').filter({ hasText: '施術診断' }).click();
await page.waitForTimeout(600);
const chip = (t) => page.locator('button.cg-chip').filter({ hasText: t }).first();
await chip('旅行中').click();
await page.locator('.cg-chips button.cg-chip').nth(1).click();
await page.locator('.cg-chips button.cg-chip').nth(1).click();
await chip('毛穴').click();
await page.locator('button.cg-go').click();
await page.waitForTimeout(1500);

await phase('concierge-typing-20-chars');
await page.locator('#cg-ask-input').click();
await page.keyboard.type('毛穴とたるみ、予算1万くらい、明後日帰国', { delay: 30 });
await page.waitForTimeout(500);

const data = await page.evaluate(() => window.__renders);
const results = {};
for (const [ph, counts] of Object.entries(data)) {
  results[ph] = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
}
fs.writeFileSync(path.resolve(__dirname, 'results/react-scan.json'), JSON.stringify(results, null, 2));
for (const [ph, top] of Object.entries(results)) {
  const total = Object.values(data[ph]).reduce((s, n) => s + n, 0);
  console.log(`\n## ${ph}  (total component renders: ${total})`);
  for (const [n, c] of top) console.log(`  ${String(c).padStart(6)}  ${n}`);
}
await browser.close();
