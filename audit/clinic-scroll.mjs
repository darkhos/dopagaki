// Audit only: real touch-scroll gestures on the clinic page (CPU 4x slower, iPhone size),
// recording frame gaps, scroll position, long tasks, layout shifts and sticky-bar toggles.
// Needs the production preview on :4173. Run: node audit/clinic-scroll.mjs [label]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const label = process.argv[2] ?? 'run';
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

await page.goto('http://localhost:4173/?lang=ja');
await page.waitForSelector('button.row-main', { timeout: 30000 });
await page.locator('button.row-main').filter({ hasNotText: /\d+院/ }).first().click();
await page.waitForSelector('.cp2-bento-hero', { timeout: 15000 });
await page.waitForTimeout(2500);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

await page.evaluate(() => {
  const rec = (window.__rec = { frames: [], longTasks: [], shifts: [], toggles: [] });
  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    rec.frames.push([Math.round(now - last), Math.round(scrollY), document.documentElement.scrollHeight]);
    last = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  new PerformanceObserver((l) => l.getEntries().forEach((e) => rec.longTasks.push([Math.round(e.duration), Math.round(scrollY)]))).observe({ type: 'longtask' });
  new PerformanceObserver((l) =>
    l.getEntries().forEach((e) =>
      rec.shifts.push([+e.value.toFixed(4), Math.round(scrollY), (e.sources || []).map((s) => String(s.node?.className ?? s.node?.nodeName ?? '').split(' ')[0]).slice(0, 3)])
    )
  ).observe({ type: 'layout-shift' });
  const bar = document.querySelector('.cp2-sticky-bar');
  if (bar) new MutationObserver(() => rec.toggles.push([Math.round(scrollY), bar.classList.contains('is-visible')])).observe(bar, { attributes: true, attributeFilter: ['class'] });
});

const gesture = (yDistance, speed = 1200) =>
  cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 500, yDistance, speed, gestureSourceType: 'touch', repeatCount: 1 });

// down to the bottom in a few flicks, then back up the same way
for (let i = 0; i < 6; i++) await gesture(-600);
await page.waitForTimeout(800);
await page.evaluate(() => {
  const r = window.__rec;
  r.frames.length = 0; r.longTasks.length = 0; r.shifts.length = 0; r.toggles.length = 0;
  r.startY = Math.round(scrollY);
});
for (let i = 0; i < 8; i++) await gesture(400, 900);
await page.waitForTimeout(800);

const rec = await page.evaluate(() => window.__rec);
const gaps = rec.frames.map((f) => f[0]);
const ys = rec.frames.map((f) => f[1]);
let reversals = 0; // scrolling up but y goes down again
for (let i = 2; i < ys.length; i++) if (ys[i] > ys[i - 1] + 2 && ys[i - 1] < ys[i - 2]) reversals++;
const summary = {
  label,
  startY: rec.startY,
  endY: ys[ys.length - 1],
  frames: gaps.length,
  over34ms: gaps.filter((g) => g > 34).length,
  over50ms: gaps.filter((g) => g > 50).length,
  worstGaps: [...rec.frames].sort((a, b) => b[0] - a[0]).slice(0, 6).map((f) => `${f[0]}ms@y${f[1]}`),
  reversals,
  heightChanges: [...new Set(rec.frames.map((f) => f[2]))],
  longTasks: rec.longTasks.slice(0, 10),
  layoutShifts: rec.shifts.slice(0, 10),
  stickyToggles: rec.toggles.slice(0, 10)
};
fs.writeFileSync(path.join(__dirname, `results/clinic-scroll-${label}.json`), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
await browser.close();
