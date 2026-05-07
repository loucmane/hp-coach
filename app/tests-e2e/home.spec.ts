// E2E suite for the SPA + auth gate.
//
// Two import sources matter:
//   - `@playwright/test`  → vanilla page, used for the unauth-redirect test
//   - `./fixtures`        → page is already signed in via Clerk's testing
//                           helpers; used for everything that needs HomeMobile
//
// The signed-in fixture relies on globalSetup running clerkSetup() once at
// the top of the run (see tests-e2e/global-setup.ts).

import { expect, test } from '@playwright/test'
import { expect as authedExpect, test as authedTest } from './fixtures'

// ── Unauthenticated ────────────────────────────────────────────────────
test('unauthenticated visit to / redirects to /sign-in', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/sign-in$/, { timeout: 10_000 })
  await expect(page.getByText(/sign in/i).first()).toBeVisible()
})

// ── Signed-in ──────────────────────────────────────────────────────────
authedTest('Daily Home renders with iconic CTA and tabs', async ({ page }) => {
  const cta = page.getByRole('button', { name: 'Fortsätt' })
  await authedExpect(cta).toBeVisible()
  await authedExpect(page.getByText(/— COACH · TAKTIKER/i)).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Hem' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Övning' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Coach' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Framsteg' })).toBeVisible()
  await cta.focus()
  await authedExpect(cta).toBeFocused()
})

authedTest('Fortsätt routes to /drill', async ({ page }) => {
  await page.getByRole('button', { name: 'Fortsätt' }).click()
  await authedExpect(page).toHaveURL(/\/drill$/)
  // The drill route now mounts the real engine; idle state is the
  // visible landing for an unstarted drill.
  await authedExpect(page.getByTestId('drill-idle')).toBeVisible({ timeout: 10_000 })
})

authedTest(
  'Avancerat link routes to /avancerat (and tabs are hidden there)',
  async ({ page }) => {
    await page.getByRole('button', { name: 'Avancerat' }).click()
    await authedExpect(page).toHaveURL(/\/avancerat$/)
    await authedExpect(page.getByRole('button', { name: 'Hem', exact: true })).toHaveCount(0)
  },
)

authedTest('Bottom tabs route between sections', async ({ page }) => {
  await page.getByRole('button', { name: 'Framsteg', exact: true }).click()
  await authedExpect(page).toHaveURL(/\/progress$/)
  await page.getByRole('button', { name: 'Hem', exact: true }).click()
  await authedExpect(page).toHaveURL(/\/$/)
})

authedTest('/dev exposes coach + palette + font + density switchers', async ({ page }) => {
  await page.goto('/dev')
  await authedExpect(page.getByRole('button', { name: /Kompis/ })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Palett: Sage' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Palett: Ink' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Palett: Rose' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Mörk' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: /Hyperlegible/ })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Comfy', exact: true })).toBeVisible()
})

authedTest('palette swatch click applies the new palette to <html>', async ({ page }) => {
  await page.goto('/dev')
  await page.getByRole('button', { name: 'Palett: Sage' }).click()
  const bg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
  )
  authedExpect(bg).toBe('oklch(0.965 0.012 175)')
  authedExpect(await page.evaluate(() => document.documentElement.dataset.palette)).toBe('sage')
})

authedTest('floating launcher links to /dev and Cmd+K opens the palette', async ({ page }) => {
  await page.goto('/?dev=1')
  await page.getByRole('link', { name: /öppna design-tweaks/i }).click()
  await authedExpect(page).toHaveURL(/\/dev$/)
  // Cmd+K is now owned by <CommandPalette>: opens the palette overlay
  // instead of toggling /dev. Pressing it again closes the overlay.
  await page.keyboard.press('Control+K')
  await authedExpect(page.getByTestId('cmdk')).toBeVisible({ timeout: 3_000 })
  await page.keyboard.press('Control+K')
  await authedExpect(page.getByTestId('cmdk')).toBeHidden({ timeout: 3_000 })
})
