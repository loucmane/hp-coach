import { defineConfig, devices } from '@playwright/test'
import { STORAGE_STATE } from './tests-e2e/storage-state'

// Playwright is the E2E layer. Vitest covers component logic; Playwright
// covers real-browser flows (router transitions, Clerk-authenticated pages,
// keyboard shortcuts like Cmd+K).
//
// `globalSetup` boots @clerk/testing once per run (clerkSetup + test-user
// creation). The `setup` project then signs in ONCE and saves storageState;
// the chromium/mobile projects depend on it and reuse that state, so no test
// signs in itself — this is what keeps Clerk's dev FAPI from rate-limiting
// under the full suite. Webserver builds + previews the production bundle.
export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30_000,
  // All E2E tests authenticate as the same Clerk test user and write
  // through the live worker → D1 staging. Running them in parallel races
  // on the shared session/attempts/prefs rows. Until we stand up per-test
  // users (or a /test-reset endpoint), serialize.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  globalSetup: './tests-e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Phase A.8 EDITION CTAs use the `.hpc-breathe` animation (opacity
    // + scale micro-cycle). Playwright's element-stability check never
    // settles on an animating bounding box, so clicks time out. The CSS
    // already disables `.hpc-breathe` under prefers-reduced-motion, so
    // just enable that mode in tests. The `.reveal` first-paint stagger
    // also collapses under this preference, which actually speeds tests
    // up — first-paint waits drop a few hundred ms.
    reducedMotion: 'reduce',
  },
  projects: [
    // Runs first (chromium/mobile depend on it): signs in once and writes
    // STORAGE_STATE. See tests-e2e/auth.setup.ts.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    // iPhone 13 emulation runs through the chromium engine — same browser, mobile viewport.
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],
  // Two web servers boot in parallel: the SPA's production preview and
  // the worker's wrangler dev server. The api.spec.ts E2E hits both —
  // worker for /api/me/prefs, SPA for the UI calling the typed client.
  webServer: [
    {
      command: 'pnpm build && pnpm preview --port 4173',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm --dir ../worker dev',
      url: 'http://localhost:8787/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
