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

import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright'
import { type Page, test as base, expect } from '@playwright/test'

const API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

// Hit /api/test-reset to put the authenticated user's mistakes/sessions
// state into a known shape. The endpoint is mounted by the worker only
// when ENVIRONMENT !== 'production' (see worker/src/routes/testReset.ts);
// in CI the staging worker matches that gate.
async function testReset(page: Page, action: 'clear' | 'expire-all'): Promise<void> {
  const result = await page.evaluate(
    async ({ baseUrl, action }) => {
      type ClerkLike = { session?: { getToken: () => Promise<string | null> } | null }
      const clerk = (window as unknown as { Clerk?: ClerkLike }).Clerk
      const token = (await clerk?.session?.getToken()) ?? null
      if (!token) return { ok: false as const, status: 0, body: 'no Clerk token' }
      const res = await fetch(`${baseUrl}/api/test-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      })
      const body = await res.text()
      return { ok: res.ok, status: res.status, body }
    },
    { baseUrl: API_BASE_URL, action },
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

export const test = base.extend({
  // Override the default `page` fixture: every test starts already signed in.
  page: async ({ page }, use) => {
    const email = process.env.E2E_TEST_EMAIL
    if (!email) {
      throw new Error('Missing E2E_TEST_EMAIL — set it in app/.env.local')
    }
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
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'email_code',
        identifier: email,
      },
    })
    // After sign-in, Clerk redirects via the configured fallback URL ('/').
    // Wait for that hop to settle before yielding the page to the test.
    await page.goto('/')
    await use(page)
  },
})

export { expect }
