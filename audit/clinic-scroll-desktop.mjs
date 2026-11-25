// Audit only: mouse-wheel scroll-up on the clinic page at desktop size, in Chrome and WebKit.
// Needs the production preview on :4173. Run: node audit/clinic-scroll-desktop.mjs [label] [stepPx]
import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const label = process.argv[2] ?? 'run';
const step = Number(process.argv[3] ?? 100);
const out = {};
for (const [name, type, opts] of [['chrome', chromium, { channel: 'chrome' }], ['webkit', webkit, {}]]) {
  const browser = await type.launch(opts);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:4173/?lang=ja');
  await page.waitForSelector('button.row-main', { timeout: 30000 });
  await page.locator('button.row-main').filter({ hasNotText: /\d+院/ }).first().click();
  await page.waitForSelector('.cp2-bento-hero', { timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.mouse.move(870, 450);
  for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(30); }
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const rec = (window.__rec = { frames: [], toggles: [], startY: Math.round(scrollY), heights: new Set(), shifts: [] });
    let last = performance.now();
    const loop = () => { const now = performance.now(); rec.frames.push([Math.round(now - last), Math.round(scrollY)]); rec.heights.add(document.documentElement.scrollHeight); last = now; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    const bar = document.querySelector('.cp2-sticky-bar');
    if (bar) new MutationObserver(() => rec.toggles.push([Math.round(scrollY), bar.classList.contains('is-visible')])).observe(bar, { attributes: true, attributeFilter: ['class'] });
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => rec.shifts.push([+e.value.toFixed(4), Math.round(scrollY), (e.sources || []).map((s) => String(s.node?.className ?? s.node?.nodeName ?? '').split(' ')[0]).slice(0, 3)]))).observe({ type: 'layout-shift' }); } catch {}
  });
  const n = Math.ceil(3000 / step);
  for (let i = 0; i < n; i++) { await page.mouse.wheel(0, -step); await page.waitForTimeout(60); }
  await page.waitForTimeout(1500);
  const rec = await page.evaluate(() => ({ ...window.__rec, heights: [...window.__rec.heights] }));
  const ys = rec.frames.map((f) => f[1]);
  const reversalAt = [];
  for (let i = 2; i < ys.length; i++) if (ys[i] > ys[i - 1] + 2 && ys[i - 1] <= ys[i - 2]) reversalAt.push(`${ys[i - 2]}>${ys[i - 1]}>${ys[i]}`);
  const gaps = rec.frames.map((f) => f[0]);
  out[name] = { startY: rec.startY, endY: ys[ys.length - 1], frames: gaps.length, over34ms: gaps.filter((g) => g > 34).length,
    reversals: reversalAt.length, reversalAt: reversalAt.slice(0, 10), heights: rec.heights, stickyToggles: rec.toggles.slice(0, 12), layoutShifts: rec.shifts.slice(0, 10) };
  await browser.close();
}
fs.writeFileSync(path.join(__dirname, `results/clinic-scroll-desktop-${label}.json`), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
