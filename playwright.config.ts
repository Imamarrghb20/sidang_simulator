import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 60_000,
  // Playwright membersihkan outputDir; pisahkan dari direktori database uji.
  outputDir: './playwright-report/artifacts',
  use: {
    baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure',
    launchOptions: process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {},
  },
  projects: [
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'node tests/serve-e2e.mjs', url: 'http://127.0.0.1:3100/api/profiles', reuseExistingServer: false, timeout: 60_000 },
});
