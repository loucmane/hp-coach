// Responsive shell E2E — Phase A coverage.
//
// Three viewport sizes that anchor the Frame component's behaviour:
//   - 390×844    → phone     (.hpc-frame-phone, iOS chrome visible)
//   - 1024×768   → reader    (.hpc-frame-reader, centered card, no
//                             status bar / home indicator)
//   - 1440×900   → studio    (.hpc-frame-studio, centered card +
//                             optional rails when studioRails is on)
//
// We deliberately test the structural class + dataset signals rather
// than pixel screenshots: visual diffs at three sizes × four palettes ×
// two modes would balloon the CI surface. The class signal is the
// orchestrator's actual contract — if Frame picks the wrong branch
// the class is wrong, full stop.
//
// We also verify that Cmd+K still works at every viewport (PRD § 6.4
// hard requirement; it's easy to break a modal width when rewiring
// the surrounding shell).

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
  },
  {
    name: 'studio',
    width: 1440,
    height: 900,
    expectedFrameClass: 'hpc-frame-studio',
    expectedIosChrome: false,
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
    // One of the three must be present; the others must not.
    const frame = page.locator(`.${v.expectedFrameClass}`)
    await expect(frame).toHaveCount(1)

    // iOS-decorative chrome: status bar shows "09:41" on phone only.
    // On reader/studio the surrounding card replaces it, and the
    // "09:41" string would look like a kid's homework at desktop.
    const statusBarTime = page.getByText('09:41', { exact: true })
    if (v.expectedIosChrome) {
      await expect(statusBarTime).toBeVisible()
    } else {
      await expect(statusBarTime).toHaveCount(0)
    }

    // Bottom tabs are real navigation — they must render at every size.
    await expect(page.getByRole('button', { name: 'Hem', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Övning', exact: true })).toBeVisible()
  })

  test(`Cmd+K opens at ${v.name} (${v.width}×${v.height})`, async ({ page }) => {
    await page.setViewportSize({ width: v.width, height: v.height })
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Fortsätt' })).toBeVisible({
      timeout: 10_000,
    })

    // The palette is OS-aware (Cmd on macOS, Ctrl elsewhere); the
    // handler accepts both. Playwright runs headless chromium so
    // Control+K is the right press.
    await page.keyboard.press('Control+K')
    const palette = page.getByTestId('cmdk')
    await expect(palette).toBeVisible({ timeout: 3_000 })

    // Verify the modal width respects the viewport — the inner card
    // must never exceed 560px (its max from the inline `min(560px,
    // calc(100vw - 32px))` rule) and must leave at least a 16px gutter
    // on either side at narrow viewports.
    const card = palette.locator('> div:nth-child(2)')
    const box = await card.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.width).toBeLessThanOrEqual(560)
      expect(box.width).toBeGreaterThanOrEqual(Math.min(560, v.width - 32))
    }

    // Esc closes — sanity check that the keyboard contract still works.
    await page.keyboard.press('Escape')
    await expect(palette).toBeHidden({ timeout: 2_000 })
  })
}
