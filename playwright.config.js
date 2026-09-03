import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/accessibility',
  timeout: 45_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    headless: true,
    reducedMotion: 'reduce',
    actionTimeout: 5_000
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 } }
    },
    {
      name: 'mobile-375',
      use: { viewport: { width: 375, height: 812 } }
    }
  ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
