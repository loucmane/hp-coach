// Playwright globalSetup — runs once before any test worker starts.
//
// Bootstraps Clerk's testing tokens via @clerk/testing/playwright and
// idempotently creates the E2E test user via Clerk's Backend API. After
// this runs, individual tests can call `clerk.signIn()` against that
// user without needing a real email or password.
//
// Reads CLERK_SECRET_KEY + VITE_CLERK_PUBLISHABLE_KEY + E2E_TEST_EMAIL
// from `.env.local` (gitignored) so the test runner can hit Clerk
// without hard-coded secrets.

import { createClerkClient } from '@clerk/backend'
import { clerkSetup } from '@clerk/testing/playwright'
import { config as loadEnv } from 'dotenv'

export default async function globalSetup() {
  loadEnv({ path: '.env.local' })

  const secretKey = process.env.CLERK_SECRET_KEY
  const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY
  const email = process.env.E2E_TEST_EMAIL
  if (!secretKey || !publishableKey || !email) {
    throw new Error(
      'Missing one of CLERK_SECRET_KEY / VITE_CLERK_PUBLISHABLE_KEY / E2E_TEST_EMAIL — set them in app/.env.local',
    )
  }

  // 1. clerkSetup hits Clerk's Backend API once and caches a "testing token"
  //    that bypasses the bot-detection step on subsequent test sign-ins.
  await clerkSetup({ publishableKey, secretKey })

  // 2. Idempotent test-user creation. Clerk treats `+clerk_test@…` as a
  //    test pattern (auto-verifying with code 424242). If the user exists
  //    from a previous run, `createUser` errors with form_identifier_exists
  //    — we swallow that and move on.
  const clerk = createClerkClient({ secretKey })
  try {
    await clerk.users.createUser({
      emailAddress: [email],
      skipPasswordRequirement: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!/already|exists|identifier/i.test(message)) {
      throw err
    }
  }
}
