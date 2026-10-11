// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// Playwright config for the website-chat browser suite.
// - webServer: e2e/serve.mjs serves the harness page and the bundle the
//   action emitted (run `node ../scripts/emit-website-chat.mjs` first; CI
//   does). Never reused: a server left running from an earlier build would
//   test stale bytes and pass.
// - Two projects: desktop chromium and a 390x844 phone (the modal becomes a
//   full-bleed sheet at <=860px).
// - No live network: corpora and OpenRouter are answered by routes.
// =============================================================================

import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node e2e/serve.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      // The phone sheet: chromium engine, 390x844 viewport, touch on.
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true },
    },
  ],
});
