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
import { test as base, expect } from '@playwright/test'

export const test = base.extend({
  // Override the default `page` fixture: every test starts already signed in.
  page: async ({ page }, use) => {
    const email = process.env.E2E_TEST_EMAIL
    if (!email) {
      throw new Error('Missing E2E_TEST_EMAIL — set it in app/.env.local')
    }
    await setupClerkTestingToken({ page })
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
