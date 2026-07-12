// E2E: the Öva hub's doors (A2 macro continuity, owner 2026-07-12).
//
//   1. "The row is the door": clicking a section lane starts that
//      section's drill IMMEDIATELY — question 1, no idle interstitial.
//      (Direct /drill navigation keeps the idle screen; drill.spec.ts
//      still covers that path.)
//   2. Each lane shows its LIVE per-section due-repetition count
//      ("N väntar"), derived from the real due-mistakes queue — a
//      section with zero due shows no number.

import { clearMistakes, expect, seedMistake, test } from './fixtures'

// A real, complete ORD question (same seed the mistakes spec uses).
const SEED_QID = 'var-2026-verb1-ORD-003'

test('Öva hub — a section lane opens straight into question 1 (no idle stop)', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop drill chassis probe')
  await clearMistakes(page)

  await page.goto('/ova')
  await expect(page.getByTestId('ova-lane-drill')).toBeVisible({ timeout: 15_000 })

  await page.getByTestId('ova-section-ORD').click()

  // The door leads into the room: the first question renders without the
  // idle chapter-opening ever taking the stage.
  await expect(page.getByTestId('option-A')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('drill-idle')).toHaveCount(0)
  expect(page.url()).toContain('section=ORD')
  expect(page.url()).toContain('start=')

  // The session is a REAL session (the eyebrow carries plan position).
  await expect(page.getByTestId('drill-eyebrow')).toContainText('FRÅGA 1 AV')
})

test('Öva hub — section lanes carry live per-section due counts', async ({ page }) => {
  await clearMistakes(page)
  await seedMistake(page, SEED_QID)

  await page.goto('/ova')
  await expect(page.getByTestId('ova-lane-drill')).toBeVisible({ timeout: 15_000 })

  // The seeded ORD mistake is due → the ORD lane shows "1 väntar".
  await expect(page.getByTestId('ova-due-ORD')).toHaveText('1 väntar', { timeout: 15_000 })
  // Real data or nothing: sections with zero due show no number.
  await expect(page.getByTestId('ova-due-XYZ')).toHaveCount(0)
  await expect(page.getByTestId('ova-due-DTK')).toHaveCount(0)
})
