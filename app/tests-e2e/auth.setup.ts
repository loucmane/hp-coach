// Auth setup project — runs ONCE before the test projects (wired as a
// `dependencies: ['setup']` in playwright.config.ts) and saves the
// signed-in browser state to disk. Every chromium/mobile test then starts
// from that saved `storageState` instead of calling `clerk.signIn()` itself.
//
// Why: the old fixture signed in fresh for every test. Across the full
// suite (16 tests × 2 projects) that's dozens of sign-ins hammering Clerk's
// dev Frontend API, which rate-limits/rotates under the load — the residual
// flake that survived the deterministic-seeding work (#107). Signing in
// once collapses that to a single sign-in for the whole run.
//
// The testing token (clerkSetup, in global-setup.ts) is still injected
// per test in fixtures.ts — it's a route interception, not part of
// storageState — but it reads the env token cached by clerkSetup, so it
// costs no per-test network call.

import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

import { awaitClerkFapiHealthy, installFapiRetryRoute } from './clerk-fapi-hardening'
import { STORAGE_STATE } from './storage-state'

setup('authenticate once and persist storage state', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL
  if (!email) {
    throw new Error('Missing E2E_TEST_EMAIL — set it in app/.env.local')
  }
  // Diagnostic-only, see fixtures.ts for the matching counter/printer.
  if (process.env.HPC_E2E_COUNT_FAPI) {
    let n = 0
    page.on('request', (req) => {
      if (req.url().includes('.clerk.accounts.dev')) n++
    })
    process.on('exit', () => {
      // eslint-disable-next-line no-console
      console.log(`[fapi-count] setup project requests to *.clerk.accounts.dev: ${n}`)
    })
  }
  await setupClerkTestingToken({ page })
  // Register our resilient FAPI retry route AFTER @clerk/testing's so ours
  // runs first and supersedes its 4-attempt budget for the whole run.
  await installFapiRetryRoute(page)
  await page.goto('/')

  // Pre-flight health gate: the shared Clerk dev instance intermittently
  // degrades. Don't attempt sign-in until it answers healthily N times in a
  // row — otherwise the whole suite red-fails on infra, misattributed to
  // code. On budget exhaustion, fail LOUD and unambiguous.
  const health = await awaitClerkFapiHealthy(page, { budgetMs: 90_000, needConsecutive: 3 })
  if (!health.healthy) {
    throw new Error(
      `Clerk FAPI unhealthy — infra, not code. Gate gave up after ${Math.round(
        health.elapsedMs / 1000,
      )}s (${health.consecutive}/3 consecutive OK, lastStatus=${health.lastStatus}, lastError=${
        health.lastError ?? 'none'
      }). The e2e suite is blocked on the shared ${process.env.CLERK_FAPI} dev instance, not on this branch.`,
    )
  }
  // eslint-disable-next-line no-console
  console.log(
    `[fapi-health] Clerk FAPI healthy after ${Math.round(health.elapsedMs / 1000)}s ` +
      `(${health.consecutive} consecutive OK) — proceeding to sign-in`,
  )

  await clerk.signIn({
    page,
    signInParams: { strategy: 'email_code', identifier: email },
  })
  // Land back on the authed app and wait until Clerk has a live session
  // before snapshotting — otherwise the saved cookies/localStorage could
  // capture a half-initialised, sessionless state.
  await page.goto('/')
  await page.waitForFunction(
    () => {
      const c = (window as unknown as { Clerk?: { loaded?: boolean; session?: unknown } }).Clerk
      return Boolean(c?.loaded && c?.session)
    },
    { timeout: 30_000 },
  )

  // Reset the shared test user's theme to a known baseline (light) in D1.
  // Tests run against one Clerk user whose server prefs persist across runs;
  // a stray dark-mode toggle in a prior run would otherwise load every test
  // dark and break the palette/colour assertions. Done once here so the
  // whole suite starts deterministic. The token is read from the live
  // session; the worker base mirrors fixtures.ts.
  const apiBase = process.env.VITE_API_BASE_URL ?? 'http://localhost:8787'
  await page.evaluate(async (baseUrl) => {
    const c = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk
    const token = await c?.session?.getToken()
    if (!token) return
    await fetch(`${baseUrl}/api/me/prefs`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mode: 'light' }),
    })
  }, apiBase)

  await page.context().storageState({ path: STORAGE_STATE })
})
