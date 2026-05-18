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
// B3.2 — selectors updated for the prescriptive daily-plan composition:
//   - "Fortsätt" CTA is gone. The Home hero is now the daily-plan card,
//     and plan items are individual deep-links (no single Fortsätt button).
//   - "Avancerat" trailing link is gone. The escape hatches are the
//     floating tab bar and Cmd+K palette.
//   - The compact "God morgon." greeting + the `daily-plan-card`/
//     `daily-plan-skeleton` testid are the load indicators.

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
authedTest('Daily Home renders the prescriptive plan card', async ({ page }) => {
  // The greeting is rendered immediately; the plan card resolves after
  // stats + due + framework hints settle. Both are valid load indicators.
  await authedExpect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 10_000 })
  // Either the resolved card or the skeleton — both prove the route hydrated.
  const card = page.getByTestId('daily-plan-card')
  const skeleton = page.getByTestId('daily-plan-skeleton')
  await authedExpect(card.or(skeleton)).toBeVisible({ timeout: 10_000 })
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
  // The palette switch fires a PATCH /api/me/prefs and only then runs
  // applyThemeToDocument(). In CI the round-trip can take several
  // hundred ms, so we wait for the data-palette attribute to flip
  // before reading --bg (otherwise we sometimes read the previous
  // palette's value).
  await authedExpect(page.locator('html[data-palette="sage"]')).toHaveCount(1, { timeout: 10_000 })
  const bg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
  )
  authedExpect(bg).toBe('oklch(0.965 0.012 175)')
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
