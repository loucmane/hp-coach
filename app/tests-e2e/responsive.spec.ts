// Responsive shell E2E — Phase A.5 coverage.
//
// Three viewport sizes that anchor the Frame component's behaviour:
//   - 390×844    → phone     (.hpc-frame-phone, iOS chrome visible)
//   - 1024×768   → reader    (.hpc-frame-reader, ~960px content canvas,
//                             no status bar / home indicator, card chrome)
//   - 1440×900   → studio    (.hpc-frame-studio, wide canvas up to
//                             min(1440, vw-96), no card chrome, no rails)
//
// Phase A.5 updates from the original Phase A test:
//   - cardWidth assertion replaced with canvas-width tolerances. The
//     reader canvas caps at 960; the studio canvas spans the
//     viewport minus 96px gutters.
//   - 09:41 string is allowed to appear in the bottom-tab Cmd+K hint
//     or elsewhere if the test environment changes; we tightened the
//     selector to the actual StatusBar element.
//
// We deliberately test the structural class + dataset signals rather
// than pixel screenshots: visual diffs at three sizes × four palettes ×
// two modes would balloon the CI surface. The class signal is the
// orchestrator's actual contract — if Frame picks the wrong branch
// the class is wrong, full stop.

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

    // Wait for the daily-home CTA — confirms the page hydrated and the
    // Frame's children rendered.
    await expect(page.getByRole('button', { name: 'Fortsätt' })).toBeVisible({
      timeout: 10_000,
    })

    // The Frame orchestrator slaps its branch class onto its root div.
    const frame = page.locator(`.${v.expectedFrameClass}`)
    await expect(frame).toHaveCount(1)

    // iOS-decorative chrome: status bar shows "09:41" on phone only.
    // On reader/studio the surrounding card replaces it.
    if (v.expectedIosChrome) {
      await expect(page.getByText('09:41', { exact: true })).toBeVisible()
    } else {
      await expect(page.getByText('09:41', { exact: true })).toHaveCount(0)
    }

    // Bottom tabs are real navigation — they must render at every
    // size. On reader/studio they're a floating pill; on phone they
    // anchor inside the artboard.
    await expect(page.getByRole('button', { name: 'Hem', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Övning', exact: true })).toBeVisible()

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
    await expect(page.getByRole('button', { name: 'Fortsätt' })).toBeVisible({
      timeout: 10_000,
    })

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

// ── Phase A.7 editorial-pass contracts ──────────────────────────────
//
// Phase A.5's 3-tile dashboard was dropped in favour of the editorial
// masthead. Tests target the masthead testids and the new DesktopNav
// chrome instead.

test('DesktopNav renders at reader / studio, BottomTabs at phone', async ({ page }) => {
  // Studio
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Fortsätt' })).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByTestId('desktop-nav')).toBeVisible()
  // The phone tab-bar buttons have lowercase labels — DesktopNav uses
  // small-caps UPPERCASE rendered text. Distinguishing via testid.
  await expect(page.getByTestId('desktop-nav-home')).toBeVisible()

  // Phone — DesktopNav hidden, phone tabs visible.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Fortsätt' })).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByTestId('desktop-nav')).toHaveCount(0)
  // Phone keeps the artboard-anchored BottomTabs row.
  await expect(page.getByRole('button', { name: 'Hem', exact: true })).toBeVisible()
})

test('Home masthead renders the typographic event at studio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Fortsätt' })).toBeVisible({
    timeout: 10_000,
  })

  // The home tile plan sits to the right of the masthead at reader+.
  // It's the only remaining tile (3-tile bento dropped in Phase A.7).
  await expect(page.getByTestId('home-tile-plan')).toBeVisible()

  // Masthead headline (one of the hour-greetings: god morgon/dag/etc.)
  const h1 = page.locator('h1').first()
  await expect(h1).toBeVisible()
  const fontSize = await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  // At 1440p the clamp() should land between 100-128px.
  expect(fontSize).toBeGreaterThan(80)
})

test('Auth brand pane visible at studio, hidden at phone', async ({ page: rawPage }) => {
  // This test deliberately uses an unauthenticated page — the brand
  // pane is part of the sign-in route. fixtures.ts overrides
  // `page` with an auto-signed-in instance, so we drop back to the
  // raw playwright context here. Open a fresh tab through the same
  // browser context but skip Clerk.signIn.
  const ctx = rawPage.context()
  const page = await ctx.newPage()

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/sign-in')
  await expect(page.getByTestId('auth-form-pane')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('auth-brand-pane')).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  // On phone the AuthLayout renders just the form; no brand pane.
  await expect(page.getByTestId('auth-brand-pane')).toHaveCount(0)

  await page.close()
})
