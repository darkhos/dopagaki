// Audit only. Runs against the local production preview (audit/.dist on :4173), uses the installed Chrome.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /e2e\.spec\.ts$/,
  outputDir: './results/pw-output',
  timeout: 120_000,
  fullyParallel: true,
  workers: 3,
  reporter: [['list'], ['json', { outputFile: './results/e2e-report.json' }]],
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'iPhoneSE-375', use: { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: 'iPhone14-390', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
    { name: 'Desktop-1280', use: { viewport: { width: 1280, height: 800 } } }
  ]
});
