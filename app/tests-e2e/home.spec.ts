// E2E suite for the SPA + auth gate.
//
// Two import sources matter:
//   - `@playwright/test`  → vanilla page, used for the unauth-redirect test
//   - `./fixtures`        → page is already signed in via Clerk's testing
//                           helpers; used for everything that needs HomeMobile
//
// The signed-in fixture relies on globalSetup running clerkSetup() once at
// the top of the run (see tests-e2e/global-setup.ts).
//
// Phase A.8.3 — selectors updated for the EDITION composition:
//   - Custom Swedish card label "Logga in" replaces Clerk's default
//     "Sign in to hp-coach" (Clerk title is hidden via clerkAppearance).
//   - Home dropped the CoachLine "— coach · taktiker" attribution.
//   - DesktopBody dropped the bottom Hem/Övning/Coach/Framsteg tabs;
//     they live in PhoneBody only. Tests that depend on them are
//     restricted to the `mobile` project via `test.skip(viewport)`.
//   - CTA buttons run `.hpc-breathe` (opacity + scale cycle) which makes
//     Playwright's stability check time out. We pass `{ force: true }`
//     to clicks on those buttons — the user perceives them as clickable;
//     the bounding box is stable enough in practice.

import { expect, test } from '@playwright/test'
import { expect as authedExpect, test as authedTest } from './fixtures'

// ── Unauthenticated ────────────────────────────────────────────────────
test('unauthenticated visit to / redirects to /sign-in', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/sign-in$/, { timeout: 10_000 })
  // The Clerk default header "Sign in to hp-coach" is suppressed via
  // clerkAppearance. Our AuthLayout shows "Logga in" as the card label.
  await expect(page.getByText(/logga in/i).first()).toBeVisible()
})

// ── Signed-in ──────────────────────────────────────────────────────────
authedTest('Daily Home renders with iconic CTA', async ({ page }) => {
  const cta = page.getByRole('button', { name: 'Fortsätt' })
  await authedExpect(cta).toBeVisible()
  await cta.focus()
  await authedExpect(cta).toBeFocused()
})

authedTest('Bottom tabs visible on phone (Hem/Övning/Coach/Framsteg)', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile',
    'BottomTabs render only at phone viewport (EDITION dropped them on desktop)',
  )
  await authedExpect(page.getByRole('button', { name: 'Hem' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Övning' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Coach' })).toBeVisible()
  await authedExpect(page.getByRole('button', { name: 'Framsteg' })).toBeVisible()
})

authedTest('Fortsätt routes to /drill', async ({ page }) => {
  // `.hpc-breathe` animation makes the button never "stable" by
  // Playwright's default check. `force: true` skips that check.
  await page.getByRole('button', { name: 'Fortsätt' }).click({ force: true })
  await authedExpect(page).toHaveURL(/\/drill$/)
  // The drill route now mounts the real engine; idle state is the
  // visible landing for an unstarted drill.
  await authedExpect(page.getByTestId('drill-idle')).toBeVisible({ timeout: 10_000 })
})

authedTest(
  'Avancerat link routes to /avancerat (and tabs are hidden there)',
  async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Avancerat link lives in PhoneBody trailing row; DesktopBody dropped it (Phase A.8 EDITION)',
    )
    await page.getByRole('button', { name: 'Avancerat' }).click({ force: true })
    await authedExpect(page).toHaveURL(/\/avancerat$/)
    await authedExpect(page.getByRole('button', { name: 'Hem', exact: true })).toHaveCount(0)
  },
)

authedTest('Bottom tabs route between sections', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile',
    'BottomTabs render only at phone viewport (EDITION dropped them on desktop)',
  )
  // BottomTabs share aria-current="page" with the active tab and there
  // are multiple Hem renders during a route transition (the active tab
  // briefly overlaps the new route's chrome). Filter the locator down
  // to the tab that's NOT currently the page so the click always
  // targets the intended bar.
  await page
    .getByRole('button', { name: 'Framsteg', exact: true })
    .filter({ hasNot: page.locator('[aria-current="page"]') })
    .click({ force: true })
  await authedExpect(page).toHaveURL(/\/progress$/)
  await page
    .getByRole('button', { name: 'Hem', exact: true })
    .filter({ hasNot: page.locator('[aria-current="page"]') })
    .click({ force: true })
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
