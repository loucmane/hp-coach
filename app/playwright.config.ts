import { defineConfig, devices } from '@playwright/test'

// Playwright is the E2E layer. Vitest covers component logic; Playwright
// covers real-browser flows (router transitions, OPFS persistence later,
// keyboard shortcuts like Cmd+K).
//
// We boot the Vite dev server once per `pnpm test:e2e` run and tear it
// down after. CI uses the production build via `vite preview` for fidelity.
export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
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
