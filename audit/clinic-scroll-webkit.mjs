// Audit only: scroll-up on the clinic page in WebKit (Safari's engine), wheel steps like a trackpad/finger.
// Needs the production preview on :4173. Run: node audit/clinic-scroll-webkit.mjs [label]
import { webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const label = process.argv[2] ?? 'run';
const browser = await webkit.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/?lang=ja');
await page.waitForSelector('button.row-main', { timeout: 30000 });
await page.locator('button.row-main').filter({ hasNotText: /\d+院/ }).first().click();
await page.waitForSelector('.cp2-bento-hero', { timeout: 15000 });
await page.waitForTimeout(2500);
await page.evaluate(() => window.scrollTo({ top: 1e6, behavior: 'instant' }));
await page.waitForTimeout(1000);
await page.evaluate(() => {
  const rec = (window.__rec = { frames: [], toggles: [], startY: Math.round(scrollY), heights: new Set() });
  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    rec.frames.push([Math.round(now - last), Math.round(scrollY)]);
    rec.heights.add(document.documentElement.scrollHeight);
    last = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const bar = document.querySelector('.cp2-sticky-bar');
  if (bar) new MutationObserver(() => rec.toggles.push([Math.round(scrollY), bar.classList.contains('is-visible')])).observe(bar, { attributes: true, attributeFilter: ['class'] });
});
await page.mouse.move(195, 500);
for (let i = 0; i < 90; i++) {
  await page.mouse.wheel(0, -30);
  await page.waitForTimeout(16);
}
await page.waitForTimeout(1200);
const rec = await page.evaluate(() => ({ ...window.__rec, heights: [...window.__rec.heights] }));
const ys = rec.frames.map((f) => f[1]);
let reversals = 0;
const reversalAt = [];
for (let i = 2; i < ys.length; i++) if (ys[i] > ys[i - 1] + 2 && ys[i - 1] < ys[i - 2]) { reversals++; if (reversalAt.length < 8) reversalAt.push(`${ys[i - 1]}->${ys[i]}`); }
const gaps = rec.frames.map((f) => f[0]);
const summary = {
  label, engine: 'webkit', startY: rec.startY, endY: ys[ys.length - 1], frames: gaps.length,
  over34ms: gaps.filter((g) => g > 34).length, over50ms: gaps.filter((g) => g > 50).length,
  worstGaps: [...rec.frames].sort((a, b) => b[0] - a[0]).slice(0, 6).map((f) => `${f[0]}ms@y${f[1]}`),
  reversals, reversalAt, heights: rec.heights, stickyToggles: rec.toggles.slice(0, 10)
};
fs.writeFileSync(path.join(__dirname, `results/clinic-scroll-webkit-${label}.json`), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
await browser.close();
