// Public landing E2E — the logged-out front door at `/`.
//
// The landing is the productionized bake-off winner (V5A "Frågan under
// datumet"): dateline countdown → struck facit → poster-scale hero
// question; below, dated timeline stations with genomgångar that
// collapse to receipts, and a four-station CTA system → /sign-up.
//
// Runs under the suite-wide `reducedMotion: 'reduce'` (playwright
// config), which also exercises the landing's reduced-motion contract:
// everything must be settled/interactive on first paint.

import { expect, test } from '@playwright/test'

import { STORAGE_STATE } from './storage-state'

// ── Logged out — the public landing ────────────────────────────────────
test.describe('public landing (logged out)', () => {
  // The chromium/mobile projects apply the signed-in storageState by
  // default; the landing is the signed-OUT experience.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('renders at / with the hero title page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('public-landing')).toBeVisible({ timeout: 10_000 })
    // No redirect: the landing IS the front door.
    await expect(page).not.toHaveURL(/sign-in/)
    // The poster-scale headword (the hero question).
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('vederhäftig')
    // The dateline countdown (config-driven; PROV_DATE is set).
    await expect(page.getByText(/om \d+ dagar/)).toBeVisible()
    // The struck facit's caption.
    await expect(page.getByText('vilka du hade fel på, aldrig varför')).toBeVisible()
  })

  test('answering the hero plays the genomgång and collapses to a receipt', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('section[aria-label*="Prova en uppgift"]')
    await expect(hero.locator('.hpc-m3-opt').first()).toBeVisible({ timeout: 10_000 })

    // Answer the demo question.
    await hero.locator('.hpc-m3-opt').first().click()

    // The genomgång stage opens and plays beat by beat.
    const stage = page.getByTestId('genomgang-stage-ord-1')
    await expect(stage).toBeVisible()
    await expect(stage.getByText(/Genomgång · 1 av \d+/)).toBeVisible()
    await stage.getByRole('button', { name: 'Nästa →' }).click()
    await expect(stage.getByText(/Genomgång · 2 av \d+/)).toBeVisible()

    // Skip to the end: the stage collapses to a numbered, replayable receipt.
    await stage.getByRole('button', { name: 'hoppa över' }).click()
    const receipt = page.getByTestId('genomgang-receipt-ord-1')
    await expect(receipt).toBeVisible()
    await expect(stage).toHaveCount(0)
    await expect(receipt.getByRole('button', { name: 'spela upp igen' })).toBeVisible()

    // The graded answer is booked into the schema ledger.
    await expect(page.getByRole('status', { name: 'Din repetitionskö' })).toContainText(
      'vederhäftig',
    )
  })

  test('every CTA points at /sign-up', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('public-landing')).toBeVisible({ timeout: 10_000 })
    // The early quiet door under the fold.
    const quiet = page.locator('a.hpl-quiet-cta').first()
    await expect(quiet).toHaveAttribute('href', '/sign-up')
    // The final price-block button.
    const finalCta = page.locator('a.hpl-cta')
    await expect(finalCta).toHaveAttribute('href', '/sign-up')
    // The sticky bar's link (hidden until mid-scroll, but wired).
    await expect(page.locator('a.hpl-sticky-link')).toHaveAttribute('href', '/sign-up')
  })
})

// ── Signed in — the Daily Home is unchanged ────────────────────────────
test.describe('signed-in home unchanged', () => {
  test.use({ storageState: STORAGE_STATE })

  test('/ still renders the Daily Home, not the landing', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('public-landing')).toHaveCount(0)
  })
})
