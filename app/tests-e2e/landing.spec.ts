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

// The dateline reads the shared exam calendar (lib/dates EXAM_SITTINGS:
// Höstprov 26 on Sunday 18 October 2026, Vårprov 27 on Saturday 10 April
// 2027), so the dated tests freeze the browser clock before the page loads.
// Noon UTC is the same calendar day from UTC−11 to UTC+11, so a UTC CI
// runner and a Stockholm laptop agree.
const BEFORE_EXAM = new Date('2026-10-01T12:00:00Z')
const EXAM_DAY = new Date('2026-10-18T12:00:00Z')
const AFTER_EXAM = new Date('2026-10-19T12:00:00Z')

// ── Logged out — the public landing ────────────────────────────────────
test.describe('public landing (logged out)', () => {
  // The chromium/mobile projects apply the signed-in storageState by
  // default; the landing is the signed-OUT experience.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('renders at / with the hero title page', async ({ page }) => {
    await page.clock.setFixedTime(BEFORE_EXAM)
    await page.goto('/')
    await expect(page.getByTestId('public-landing')).toBeVisible({ timeout: 10_000 })
    // No redirect: the landing IS the front door.
    await expect(page).not.toHaveURL(/sign-in/)
    // The poster-scale headword (the hero question).
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('vederhäftig')
    // The dateline: the next sitting's date and the countdown to it.
    await expect(page.locator('.hpl-dateline')).toContainText('söndag 18 oktober')
    await expect(page.getByText(/om \d+ dagar/)).toBeVisible()
    // The struck facit's caption.
    await expect(page.getByText('vilka du hade fel på, aldrig varför')).toBeVisible()
  })

  test('on the exam day the dateline keeps the date and drops the count', async ({ page }) => {
    await page.clock.setFixedTime(EXAM_DAY)
    await page.goto('/')
    await expect(page.getByTestId('public-landing')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.hpl-dateline')).toHaveText('Högskoleprovet · söndag 18 oktober')
    await expect(page.getByText(/om \d+ dagar/)).toHaveCount(0)
  })

  test('after the exam day the dateline counts down to the next sitting', async ({ page }) => {
    await page.clock.setFixedTime(AFTER_EXAM)
    await page.goto('/')
    await expect(page.getByTestId('public-landing')).toBeVisible({ timeout: 10_000 })
    const dateline = page.locator('.hpl-dateline')
    await expect(dateline).toContainText('lördag 10 april')
    await expect(dateline.getByText(/om \d+ dagar/)).toBeVisible()
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
