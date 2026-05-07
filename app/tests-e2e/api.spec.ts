// E2E test for the typed API client.
//
// Requires the worker to be running at the URL configured in
// app/.env.local (default http://localhost:8787). The test:
//   1. Signs in via Clerk's testing fixture
//   2. Visits /dev (which mounts the ApiSelfCheck panel)
//   3. Asserts the typed client successfully calls GET /api/me/prefs
//   4. Triggers a PATCH (set coach=kompis) and asserts the row updates
//
// This is the first test that exercises the full SPA → Worker → D1 chain
// against a real Clerk-signed JWT.

import { expect, test } from './fixtures'

test('SPA → Worker /api/me/prefs (GET + PATCH) works under a real Clerk JWT', async ({
  page,
}) => {
  await page.goto('/dev')

  const ok = page.getByTestId('api-ok')
  // First read may take a moment — Clerk getToken() + JWT verify + D1 lookup.
  await expect(ok).toBeVisible({ timeout: 10_000 })
  await expect(ok).toContainText('coach=')
  await expect(ok).toContainText('palette=')

  // PATCH coach=kompis and assert it round-trips.
  await page.getByRole('button', { name: 'set coach=kompis' }).click()
  await expect(page.getByTestId('mut-ok')).toBeVisible({ timeout: 10_000 })
  await expect(ok).toContainText('coach=kompis')

  // Reset to taktiker so other tests aren't affected by leaked state.
  await page.getByRole('button', { name: 'set coach=taktiker' }).click()
  await expect(ok).toContainText('coach=taktiker', { timeout: 10_000 })
})
