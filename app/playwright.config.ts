import { defineConfig, devices } from '@playwright/test'

// Playwright is the E2E layer. Vitest covers component logic; Playwright
// covers real-browser flows (router transitions, Clerk-authenticated pages,
// keyboard shortcuts like Cmd+K).
//
// `globalSetup` boots @clerk/testing once per run so signed-in fixtures
// can hit Clerk's Frontend API with a pre-issued testing token. Webserver
// command builds + previews so we exercise the production bundle.
export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  globalSetup: './tests-e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // iPhone 13 emulation runs through the chromium engine — same browser, mobile viewport.
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
