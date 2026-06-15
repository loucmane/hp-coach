// Authenticated test fixture.
//
// Spreads Clerk's signed-in helper across every test that imports `test`
// from this file. Each test gets a fresh page with a real Clerk session
// already established, so assertions can target the post-auth UI directly.
//
// The flow:
//   1. setupClerkTestingToken — injects the bot-bypass token into the page
//   2. Navigate to the SPA
//   3. clerk.signIn — uses Clerk's Frontend API with the +clerk_test@…
//      email pattern, which Clerk's dev instances treat as auto-verifying
//      (OTP code = 424242, no real inbox required)
//
// If the user doesn't exist yet, Clerk's signUp helper creates them
// transparently as part of the same call.

import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { type Page, test as base, expect } from '@playwright/test'

const API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

// Hit /api/test-reset to put the authenticated user's mistakes/sessions
// state into a known shape. The endpoint is mounted by the worker only
// when ENVIRONMENT !== 'production' (see worker/src/routes/testReset.ts);
// `wrangler dev` runs as ENVIRONMENT='dev' so it's available in CI.
//
// The helper is robust against being called immediately after a goto:
// `window.Clerk` only becomes available once the SDK script loads, and
// `Clerk.session.getToken()` can briefly return null while the JWT is
// rotating. We poll for up to 15s for both — the in-flight signal we
// trust is "got a non-null token back".
async function testReset(
  page: Page,
  action: 'clear' | 'expire-all' | 'seed',
  questionId?: string,
): Promise<void> {
  const result = await page.evaluate(
    async ({ baseUrl, action, questionId }) => {
      type ClerkLike = {
        loaded?: boolean
        session?: { getToken: () => Promise<string | null> } | null
      }
      const getWindowClerk = (): ClerkLike | undefined =>
        (window as unknown as { Clerk?: ClerkLike }).Clerk
      const deadline = Date.now() + 15_000
      let token: string | null = null
      while (Date.now() < deadline) {
        const clerk = getWindowClerk()
        if (clerk?.loaded && clerk.session) {
          token = (await clerk.session.getToken()) ?? null
          if (token) break
        }
        await new Promise((r) => setTimeout(r, 100))
      }
      if (!token) return { ok: false as const, status: 0, body: 'no Clerk token after 15s' }
      const res = await fetch(`${baseUrl}/api/test-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(questionId ? { action, questionId } : { action }),
      })
      const body = await res.text()
      return { ok: res.ok, status: res.status, body }
    },
    { baseUrl: API_BASE_URL, action, questionId },
  )
  if (!result.ok) {
    throw new Error(`/api/test-reset ${action} failed: ${result.status} ${result.body}`)
  }
}

export async function clearMistakes(page: Page): Promise<void> {
  await testReset(page, 'clear')
}

export async function expireAllMistakes(page: Page): Promise<void> {
  await testReset(page, 'expire-all')
}

/**
 * Log a single active, immediately-due mistake for `questionId` without
 * drilling a session through the UI. Lets the replay loop establish its
 * precondition deterministically — `questionId` must be a real question in
 * the SPA's bank so the replay queue can render it.
 */
export async function seedMistake(page: Page, questionId: string): Promise<void> {
  await testReset(page, 'seed', questionId)
}

/**
 * Record a mistake through the REAL endpoint /drill's onWrong calls
 * (POST /api/mistakes), rather than /test-reset. Exercises the actual
 * record → SRS contract from a test without driving the Clerk-sensitive
 * /drill session-start. The recorded row lands at nextReviewAt = now+10min
 * (first relearn rung), so callers expire-all before reading /due.
 */
export async function recordMistakeViaApi(page: Page, questionId: string): Promise<void> {
  const result = await page.evaluate(
    async ({ baseUrl, questionId }) => {
      type ClerkLike = {
        loaded?: boolean
        session?: { getToken: () => Promise<string | null> } | null
      }
      const getWindowClerk = (): ClerkLike | undefined =>
        (window as unknown as { Clerk?: ClerkLike }).Clerk
      const deadline = Date.now() + 15_000
      let token: string | null = null
      while (Date.now() < deadline) {
        const clerk = getWindowClerk()
        if (clerk?.loaded && clerk.session) {
          token = (await clerk.session.getToken()) ?? null
          if (token) break
        }
        await new Promise((r) => setTimeout(r, 100))
      }
      if (!token) return { ok: false as const, status: 0, body: 'no Clerk token after 15s' }
      const res = await fetch(`${baseUrl}/api/mistakes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId }),
      })
      return { ok: res.ok, status: res.status, body: await res.text() }
    },
    { baseUrl: API_BASE_URL, questionId },
  )
  if (!result.ok) {
    throw new Error(`POST /api/mistakes failed: ${result.status} ${result.body}`)
  }
}

export const test = base.extend({
  // Override the default `page` fixture: every test starts already signed
  // in via the saved storageState (auth.setup.ts + the `setup` project
  // dependency in playwright.config.ts), so there's NO per-test sign-in —
  // that churn was rate-limiting Clerk's dev FAPI under the full suite.
  page: async ({ page }, use) => {
    // The testing token is a per-context route interception (not carried by
    // storageState), so it's still injected here — but it reads the env
    // token cached by clerkSetup, so no per-test network call.
    await setupClerkTestingToken({ page })
    // Pre-seed the `/welcome` gate's bypass flag so __root.tsx's
    // first-time-visit redirect doesn't trap e2e tests on /welcome.
    // The gate (app/src/lib/welcome.ts) treats hpc-welcomed='1' as
    // "user has clicked through onboarding"; for tests we always
    // want to render as a returning user. Must be added BEFORE the
    // first page.goto so the script runs on every navigation.
    await page.addInitScript(() => {
      try {
        localStorage.setItem('hpc-welcomed', '1')
      } catch {}
    })
    await page.goto('/')
    await use(page)
  },
})

export { expect }
