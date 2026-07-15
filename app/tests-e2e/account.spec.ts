// Account-menu e2e — real-browser hit-testing for the identity surface.
//
// Exists because of a shipped stacking bug (2026-07-11): the desktop
// card's in-page z-index was capped by an ancestor stacking context and
// the body-portaled scrim ate every click — the menu LOOKED fine and
// every jsdom test passed, because jsdom has no hit-testing. Only a
// real browser can regress-test "the items are actually clickable."

import { expect as authedExpect, test as authedTest } from './fixtures'

authedTest('account menu items are clickable through the scrim', async ({ page }, testInfo) => {
  authedTest.skip(testInfo.project.name === 'mobile', 'desktop card variant')
  await page.goto('/')
  await authedExpect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: /inloggad|konto/i }).first().click()
  const menu = page.getByRole('menu')
  await authedExpect(menu).toBeVisible({ timeout: 3_000 })

  // The load-bearing assertion: a real click on a menu item must reach
  // the item (not the scrim) and navigate.
  await page.getByRole('menuitem', { name: /^Konto/ }).click()
  await authedExpect(page).toHaveURL(/\/konto$/, { timeout: 5_000 })
})

// The deletion control lives DEEP at the bottom of /konto and NOWHERE in a
// menu. This test only exercises the typed-"radera" gating — it NEVER
// clicks through to a real deletion against the worker.
authedTest('deletion is gated behind a typed "radera" confirmation', async ({ page }) => {
  await page.goto('/konto')
  const section = page.getByTestId('konto-delete')
  await authedExpect(section).toBeVisible({ timeout: 10_000 })

  // Owner law: "Radera konto" must NOT appear in the account menu.
  await page.goto('/')
  await authedExpect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /inloggad|konto/i }).first().click()
  await authedExpect(page.getByRole('menu')).toBeVisible({ timeout: 3_000 })
  await authedExpect(page.getByRole('menu').getByText(/radera/i)).toHaveCount(0)
  await page.keyboard.press('Escape')

  await page.goto('/konto')
  const button = page.getByTestId('konto-delete-submit')
  const input = page.getByTestId('konto-delete-confirm')

  // The export-first prompt is present, ABOVE the destructive control.
  await authedExpect(page.getByTestId('konto-delete-export')).toBeVisible()

  // Disabled by default; a near-miss keeps it disabled; the exact word arms it.
  await authedExpect(button).toBeDisabled()
  await input.fill('rader')
  await authedExpect(button).toBeDisabled()
  await input.fill('radera')
  await authedExpect(button).toBeEnabled()
  // Stop here — never click through to a real deletion.
})
