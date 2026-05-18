// Responsive shell E2E — covers Frame, MobileFrame, and Page (EDITION).
//
// Three viewport sizes that anchor the Frame component's behaviour:
//   - 390×844    → phone     (.hpc-frame-phone, iOS chrome visible,
//                              BottomTabs anchored in the artboard)
//   - 1024×768   → reader    (.hpc-frame-reader, ~960px canvas)
//   - 1440×900   → studio    (.hpc-frame-studio, ~1344px canvas)
//
// B3.2 updates:
//   - "Fortsätt" CTA is gone; load indicator is now `home-greeting` testid.
//   - Plan marginalia (`home-plan-marginalia`) is gone; the daily-plan
//     card (`daily-plan-card` / `daily-plan-skeleton`) takes its place.
//   - The compact greeting h1 clamps to 28–48px (was 100+px). The
//     old "typographic event" masthead test is dropped in favour of
//     a plan-card visibility check.
//
// Phase A.8 EDITION baseline still applies:
//   - DesktopNav removed. The <Page> shell (running head + folio +
//     status line) provides editorial chrome at reader/studio.
//   - BottomTabs render ONLY at phone — desktop tests can't depend on
//     Hem/Övning/Coach/Framsteg buttons existing.
//   - AuthLayout testids `auth-form-pane` / `auth-brand-pane` stay; the
//     brand pane is hidden at phone.

import { expect, test } from './fixtures'

const VIEWPORTS = [
  {
    name: 'phone',
    width: 390,
    height: 844,
    expectedFrameClass: 'hpc-frame-phone',
    expectedIosChrome: true,
  },
  {
    name: 'reader',
    width: 1024,
    height: 768,
    expectedFrameClass: 'hpc-frame-reader',
    expectedIosChrome: false,
    // Reader canvas caps at 960px max-width.
    canvasMaxWidth: 960,
  },
  {
    name: 'studio',
    width: 1440,
    height: 900,
    expectedFrameClass: 'hpc-frame-studio',
    expectedIosChrome: false,
    // Studio canvas = min(1440, viewport - 96gutter) — at 1440vw the
    // canvas should be 1344px (1440 - 96), capped further by the
    // 1440 ceiling.
    canvasMaxWidth: 1344,
  },
] as const

for (const v of VIEWPORTS) {
  test(`Frame picks ${v.name} mode at ${v.width}×${v.height}`, async ({ page }) => {
    await page.setViewportSize({ width: v.width, height: v.height })
    await page.goto('/')

    // Wait for the daily-home greeting — confirms the page hydrated.
    // Available at every viewport, doesn't depend on stats/due fetch.
    await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 10_000 })

    // The Frame orchestrator slaps its branch class onto its root div.
    const frame = page.locator(`.${v.expectedFrameClass}`)
    await expect(frame).toHaveCount(1)

    // iOS-decorative chrome: status bar shows "09:41" on phone only.
    if (v.expectedIosChrome) {
      await expect(page.getByText('09:41', { exact: true })).toBeVisible()
    } else {
      await expect(page.getByText('09:41', { exact: true })).toHaveCount(0)
    }

    // BottomTabs are phone-only since Phase A.7. The desktop nav is the
    // <Page> shell (running head + status line) — see the dedicated
    // test below.
    if (v.name === 'phone') {
      await expect(page.getByRole('button', { name: 'Hem', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Övning', exact: true })).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: 'Hem', exact: true })).toHaveCount(0)
    }

    // Canvas width matches the mode. On phone the canvas == viewport;
    // on reader/studio it's bounded by the canvas-max-w tokens.
    if (v.name !== 'phone') {
      const canvas = page.locator('.hpc-frame-canvas')
      const box = await canvas.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        // Canvas should be at the documented max for its mode (+/- 1px
        // for sub-pixel rounding) and never narrower than 600px.
        expect(box.width).toBeGreaterThan(600)
        expect(box.width).toBeLessThanOrEqual(v.canvasMaxWidth + 2)
      }
    }
  })

  test(`Cmd+K opens at ${v.name} (${v.width}×${v.height})`, async ({ page }) => {
    await page.setViewportSize({ width: v.width, height: v.height })
    await page.goto('/')
    await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 10_000 })

    await page.keyboard.press('Control+K')
    const palette = page.getByTestId('cmdk')
    await expect(palette).toBeVisible({ timeout: 3_000 })

    // Verify the modal width respects the viewport — never wider
    // than 560px and never narrower than (viewport - 32px) at narrow
    // viewports (where the modal otherwise caps short of 560).
    const card = palette.locator('> div:nth-child(2)')
    const box = await card.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.width).toBeLessThanOrEqual(560)
      expect(box.width).toBeGreaterThanOrEqual(Math.min(560, v.width - 32))
    }

    await page.keyboard.press('Escape')
    await expect(palette).toBeHidden({ timeout: 2_000 })
  })
}

// ── Phase A.8 EDITION shell contracts ──────────────────────────────
//
// The Page shell replaces DesktopNav: running head + folio + status
// line provide editorial chrome at desktop. BottomTabs are phone-only.

test('Page shell renders at desktop, BottomTabs at phone', async ({ page }) => {
  // Studio
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 10_000 })
  // Editorial running-head band + status line are the Page shell's contract.
  await expect(page.getByTestId('page-shell')).toBeVisible()
  await expect(page.getByTestId('running-head')).toContainText(/HP\s*·\s*Coach/i)
  await expect(page.getByTestId('status-line')).toBeVisible()

  // Phone — no Page chrome (Page is a passthrough at phone). Phone tabs
  // visible.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('page-shell')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Hem', exact: true })).toBeVisible()
})

test('Daily Home renders the prescriptive plan card at studio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 10_000 })

  // The plan card (or its skeleton during the stats round-trip) is the
  // hero. Either is a valid prove-it-rendered signal.
  const card = page.getByTestId('daily-plan-card')
  const skeleton = page.getByTestId('daily-plan-skeleton')
  await expect(card.or(skeleton)).toBeVisible({ timeout: 10_000 })

  // The compact greeting h1 clamps to 28–48px at studio — far smaller
  // than the old hero masthead (which was 100+px). The plan items below
  // are the typographic event now, not the greeting.
  const h1 = page.locator('h1').first()
  await expect(h1).toBeVisible()
  const fontSize = await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  expect(fontSize).toBeGreaterThanOrEqual(28)
  expect(fontSize).toBeLessThanOrEqual(56)
})

test('Auth brand pane visible at studio, hidden at phone', async ({ page: rawPage }) => {
  // This test deliberately uses an unauthenticated page — the brand
  // pane is part of the sign-in route. fixtures.ts overrides `page`
  // with an auto-signed-in instance AND the same browser context
  // carries the Clerk session cookies. A fresh tab on that context
  // would also be signed in (redirects /sign-in → /), so open a
  // *separate* context without auth cookies.
  const browser = rawPage.context().browser()
  if (!browser) throw new Error('Browser not available — required for fresh context')
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  await page.goto('/sign-in')
  await expect(page.getByTestId('auth-form-pane')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('auth-brand-pane')).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  // On phone the AuthLayout renders just the form; no brand pane.
  await expect(page.getByTestId('auth-brand-pane')).toHaveCount(0)

  await ctx.close()
})
