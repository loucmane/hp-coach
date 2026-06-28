// Diagnostic + regression: the SVG zoom modal must render LARGER than the
// inline figure and as a FULL-VIEWPORT overlay. Bug (fixed): FigureModal
// rendered inline (no portal) and was trapped by .hpc-m3-content's residual
// transform on the desktop StudyDesk, so position:fixed resolved against the
// ~300px column → the "zoom" shrank the figure. Opt-in via FIGDIAG=1.
import { expect, test } from './fixtures'

test.describe('figure zoom modal', () => {
  test.skip(!process.env.FIGDIAG, 'opt-in — set FIGDIAG=1')

  test('zoom modal is full-viewport and larger than inline (desktop StudyDesk)', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'desktop only')
    // Wide viewport forces the 2-col StudyDesk path where the bug lived.
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/drill?section=XYZ&qid=host-2014-kvant1-XYZ-006')

    const inline = page.getByTestId('question-figure')
    await expect(inline).toBeVisible({ timeout: 15_000 })
    const inlineSvg = await inline.locator('svg').boundingBox()

    await inline.click()
    const dialog = page.getByRole('dialog', { name: 'Förstorad figur' })
    await expect(dialog).toBeVisible({ timeout: 4_000 })
    const dialogBox = await dialog.boundingBox()
    const modalSvg = await dialog.locator('svg').boundingBox()
    await page.screenshot({ path: 'test-results/figzoom-fixed-modal.png' })

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        viewport: { w: 1920, h: 1080 },
        inlineSvg: inlineSvg && { w: Math.round(inlineSvg.width), h: Math.round(inlineSvg.height) },
        dialogBackdrop: dialogBox && { w: Math.round(dialogBox.width), h: Math.round(dialogBox.height) },
        modalSvg: modalSvg && { w: Math.round(modalSvg.width), h: Math.round(modalSvg.height) },
      }),
    )

    // The backdrop must cover (close to) the full viewport — not the ~300px
    // content column it was trapped in before the portal fix.
    expect(dialogBox!.width, 'backdrop should span the viewport width').toBeGreaterThan(1700)
    // The zoomed figure must be clearly LARGER than the inline preview.
    expect(modalSvg!.width, 'modal figure must be larger than inline').toBeGreaterThan(
      inlineSvg!.width,
    )
  })
})
