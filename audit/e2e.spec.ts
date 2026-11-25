// Audit only: walks the main user flows and records problems instead of stopping at the first one.
// Problems are written to audit/results/e2e-<project>-<lang>-<flow>.json and summarised by audit/summarize.mjs.
import { test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS = path.join(__dirname, 'results');
const SLOW_MS = 1000;

type Issue = { kind: string; where: string; detail: string };

class Recorder {
  issues: Issue[] = [];
  timings: Array<{ step: string; ms: number }> = [];
  step = 'load';
  constructor(private page: Page) {
    page.on('console', (m) => {
      if (m.type() === 'error') this.add('console-error', m.text().slice(0, 300));
    });
    page.on('pageerror', (e) => this.add('page-error', `${e.name}: ${e.message}`.slice(0, 300)));
    page.on('requestfailed', (r) => {
      const u = r.url();
      if (u.includes('concierge.mock.invalid')) return;
      this.add('request-failed', `${r.failure()?.errorText ?? ''} ${u.slice(0, 160)}`);
    });
    page.on('response', (r) => {
      if (r.status() >= 400 && !r.url().includes('concierge.mock.invalid')) this.add('http-error', `${r.status()} ${r.url().slice(0, 160)}`);
    });
  }
  add(kind: string, detail: string) {
    this.issues.push({ kind, where: this.step, detail });
  }
  async timed(step: string, action: () => Promise<unknown>, done: () => Promise<unknown>) {
    this.step = step;
    const t0 = Date.now();
    try {
      await action();
      await done();
    } catch (e) {
      this.add('step-failed', `${(e as Error).message.split('\n')[0].slice(0, 200)}`);
      return;
    }
    const ms = Date.now() - t0;
    this.timings.push({ step, ms });
    if (ms > SLOW_MS) this.add('slow', `${ms}ms`);
  }
  async overflow() {
    const bad = await this.page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const out: string[] = [];
      const doc = document.documentElement.scrollWidth;
      if (doc > vw + 1) out.push(`page scrollWidth ${doc} > ${vw}`);
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' && r.left >= vw) continue;
        if (r.right > vw + 2 && r.left < vw) {
          // ignore children of horizontal scrollers (carousels)
          let p = el.parentElement;
          let inScroller = false;
          while (p) {
            const ps = getComputedStyle(p);
            if (/(auto|scroll|hidden|clip)/.test(ps.overflowX)) {
              inScroller = true;
              break;
            }
            p = p.parentElement;
          }
          if (inScroller) continue;
          const cls = typeof el.className === 'string' ? el.className.split(' ').slice(0, 2).join('.') : '';
          out.push(`${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} right=${Math.round(r.right)} vw=${vw}`);
        }
        if (out.length > 5) break;
      }
      return out;
    });
    for (const b of bad) this.add('overflow', b);
  }
  save(info: TestInfo, lang: string, flow: string) {
    fs.mkdirSync(RESULTS, { recursive: true });
    fs.writeFileSync(
      path.join(RESULTS, `e2e-${info.project.name}-${lang}-${flow}.json`),
      JSON.stringify({ project: info.project.name, lang, flow, issues: this.issues, timings: this.timings }, null, 2)
    );
  }
}

async function open(page: Page, lang: string, rec: Recorder) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  await page.route(/concierge\.mock\.invalid/, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: cors,
      body: JSON.stringify({
        ok: true,
        result: {
          visitor: 'unknown', budget_kind: 'unknown', budget_amount: 0, budget_currency: 'unknown', days_until: 7,
          area: 'unknown', concerns_mode: 'anything', concerns: [], no_needle: false, safety: 'none'
        }
      })
    });
  });
  await rec.timed(
    'first-load',
    () => page.goto(`/?lang=${lang}`),
    () => page.locator('button.row-main').first().waitFor({ state: 'visible', timeout: 15000 })
  );
}

const tab = (page: Page, re: RegExp) => page.locator('button.apptab-btn').filter({ hasText: re });

for (const lang of ['ja', 'ko'] as const) {
  test.describe(`${lang}`, () => {
    test(`ranking flow ${lang}`, async ({ page }, info) => {
      const rec = new Recorder(page);
      await open(page, lang, rec);
      await rec.overflow();
      const cells = page.locator('#treat-grid button.treat-cell');
      const n = await cells.count();
      for (let i = 0; i < n; i++) {
        await rec.timed(`treatment-${i}`, () => cells.nth(i).click(), () => page.locator('button.row-main').first().waitFor());
      }
      const sorts = page.locator('button.sort-btn');
      for (let i = 0; i < (await sorts.count()); i++) {
        await rec.timed(`sort-${i}`, () => sorts.nth(i).click(), () => page.locator('button.row-main').first().waitFor());
      }
      await rec.timed(
        'filter-open',
        () => page.locator('#open-filter-btn').click(),
        () => page.locator('.vs-panel').first().waitFor({ state: 'visible' })
      );
      await rec.overflow();
      await rec.timed('filter-close', () => page.keyboard.press('Escape'), () => page.locator('.vs-panel').first().waitFor({ state: 'hidden' }));
      // single-branch rows open the clinic page directly
      const single = page.locator('button.row-main').filter({ hasNotText: /院\s*JP|\d+院|\d+곳/ }).first();
      await rec.timed('clinic-open', () => single.click(), () => page.waitForURL(/\/clinic\//, { timeout: 5000 }));
      await page.waitForTimeout(800);
      await rec.overflow();
      rec.step = 'clinic-scroll';
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(600);
      await rec.overflow();
      await rec.timed('clinic-back', () => page.goBack(), () => page.locator('button.row-main').first().waitFor());
      // multi-branch row expands branches
      const multi = page.locator('button.row-main').first();
      await rec.timed('brand-expand', () => multi.click({ noWaitAfter: true }), () => page.locator('.bg-branch-list').first().waitFor({ state: 'visible' }));
      await rec.timed('brand-expand-again', async () => { await multi.click(); await multi.click({ noWaitAfter: true }); }, () => page.locator('.bg-branch-list').first().waitFor({ state: 'visible' }));
      await rec.overflow();
      rec.step = 'logo-spam';
      for (let i = 0; i < 10; i++) await page.locator('#brand-home-btn').click({ force: true });
      await page.waitForTimeout(1500);
      rec.save(info, lang, 'ranking');
    });

    test(`info flow ${lang}`, async ({ page }, info) => {
      const rec = new Recorder(page);
      await open(page, lang, rec);
      await rec.timed('tab-info', () => tab(page, /施術情報|시술정보/).click(), () => page.locator('#treatment-info-view').waitFor());
      const cells = page.locator('.ti-picker-card button.treat-cell');
      for (let i = 0; i < (await cells.count()); i++) {
        await rec.timed(`info-${i}`, () => cells.nth(i).click(), () => page.locator('.ti-detail-name').waitFor());
        if (i % 3 === 0) await rec.overflow();
      }
      rec.save(info, lang, 'info');
    });

    test(`concierge chips ${lang}`, async ({ page }, info) => {
      const rec = new Recorder(page);
      await open(page, lang, rec);
      await rec.timed('tab-concierge', () => tab(page, /施術診断|시술추천/).click(), () => page.locator('#concierge-view').waitFor());
      const chip = (re: RegExp) => page.locator('button.cg-chip').filter({ hasText: re }).first();
      const go = page.locator('button.cg-go');
      // traveler
      await rec.timed('traveler', () => chip(/旅行中|여행 중/).click(), () => page.locator('button.cg-chip').nth(1).waitFor());
      await rec.timed('budget', () => page.locator('.cg-chips button.cg-chip').nth(1).click(), () => page.waitForTimeout(100));
      await rec.timed('timing', () => page.locator('.cg-chips button.cg-chip').nth(1).click(), () => go.waitFor());
      await chip(/毛穴|모공/).click();
      await chip(/小顔|턱선/).click();
      await chip(/針|바늘/).click();
      await rec.timed('traveler-result', () => go.click(), () => page.locator('.cg-result .cg-card').first().waitFor());
      await rec.overflow();
      // edit back
      await rec.timed('edit-budget', () => page.locator('button.cg-me').nth(1).click(), () => page.locator('.cg-chips').first().waitFor());
      // resident
      await rec.timed('restart', () => page.locator('button.cg-me').first().click(), () => chip(/在住|거주/).waitFor());
      await chip(/在住|거주/).click();
      await page.locator('.cg-chips button.cg-chip').nth(1).click();
      await page.locator('.cg-chips button.cg-chip').nth(0).click();
      await rec.timed('area', () => chip(/新村|신촌/).click(), () => go.waitFor());
      await chip(/毛穴|모공/).click();
      await chip(/ツヤ|윤기/).click();
      await rec.timed('resident-result', () => go.click(), () => page.locator('.cg-result .cg-card').first().waitFor());
      await rec.overflow();
      const yen = page.locator('.cg-cur button').nth(1);
      if (await yen.count()) await rec.timed('currency', () => yen.click(), () => page.waitForTimeout(100));
      rec.save(info, lang, 'concierge');
    });

    test(`concierge text ${lang}`, async ({ page }, info) => {
      const rec = new Recorder(page);
      await open(page, lang, rec);
      await tab(page, /施術診断|시술추천/).click();
      const input = page.locator('#cg-ask-input');
      await input.waitFor();
      const sentences = [
        '毛穴となんとなくたるみ。予算1万くらい、明後日帰国。針はこわい',
        'エラだけ、5千円で',
        '新村の語学堂に通ってます。月5万ウォン、明日バイト。毛穴が気になる',
        '乾燥と小じわ。3万円まで、あと4日で帰ります',
        '彼氏の誕生日までにちょっと綺麗になりたい',
        '여행 중이에요. 모공이랑 탄력, 1만 엔 정도, 모레 귀국',
        '신촌 어학당 다니는 유학생, 이번 달 5만원, 내일 알바',
        '바늘은 무서워요. 윤기 나는 피부 원해요',
        '알아서 추천해줘',
        '임신 중인데 모공 관리 가능?',
        '',
        'あ'.repeat(300)
      ];
      for (const [i, s] of sentences.entries()) {
        await input.fill(s);
        await rec.timed(`text-${i}`, () => input.press('Enter'), () => (s.trim() ? page.locator('.cg-exchange .cg-bot').first().waitFor() : page.waitForTimeout(50)));
        await page.waitForTimeout(150);
        if (i % 4 === 0) await rec.overflow();
        const restart = page.locator('button.cg-btn').filter({ hasText: /最初から|처음부터/ }).first();
        if (await restart.isVisible().catch(() => false)) await restart.click();
      }
      rec.save(info, lang, 'text');
    });
  });
}
