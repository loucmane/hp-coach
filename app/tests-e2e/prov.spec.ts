// E2E: the Provpass picker's single-gate start flow against a real
// Clerk-signed session.
//
// Proves the winning picker (PPH · "Kallelsen & registret") wires into
// the live route: tapping a pass opens the confirm sheet naming exactly
// what was picked, and Avbryt is a zero-penalty back-out — no 55-minute
// session is ever started (we never click "Starta nu"), so this is safe
// to run in CI without leaving an active mock session behind.
//
// Breakpoint-agnostic: on the mobile project the tap target is a SITTING
// row (`prov-sitting-*`, meters-only, no pass menu); on Desktop Chrome
// (studio width) it's an explicit per-pass matrix cell (`prov-pass-*`).
// Both routes land on the SAME confirm sheet — the one gate.

import { clearMistakes, expect, test } from './fixtures'

test('Provpass picker — tap a pass, confirm sheet names it, Avbryt returns to the picker', async ({
  page,
}) => {
  // Clean slate: 'clear' deletes any active mock session from a previous
  // run so /prov renders the PICKER rather than reload-adopting a leftover
  // session straight into MockRunner.
  await clearMistakes(page)
  await page.goto('/prov')

  const picker = page.getByTestId('prov-picker')
  await expect(picker).toBeVisible({ timeout: 10_000 })

  // The authentic pass list is derived from the loaded question bank +
  // the exposure snapshot — gate on the bank being ready (set in
  // src/main.tsx) so the register has rendered its tap targets before we
  // reach for one, same idiom as drill.spec.ts.
  await page.waitForFunction(
    () => {
      const bank = (window as unknown as { __HPC_BANK__?: unknown[] }).__HPC_BANK__
      return Array.isArray(bank) && bank.length > 0
    },
    null,
    { timeout: 20_000 },
  )

  // A pass tap target: a SITTING row on phone, a per-pass matrix cell on
  // desktop. Either opens the confirm sheet. Take the first one present.
  // Scope to <button> so decorative testids can never satisfy the
  // selector (prov-pass-exposure once did — clicked a label, no sheet).
  const tapTarget = page
    .locator('button[data-testid^="prov-sitting-"], button[data-testid^="prov-pass-"]')
    .first()
  await expect(tapTarget).toBeVisible({ timeout: 10_000 })
  await tapTarget.click()

  // The single gate: the confirm sheet, naming what was auto-picked. It
  // carries both the pass name (heading) and the full contract (the
  // "avbryter du blir provet ogiltigt" rule proves the interstitial was
  // absorbed into this one sheet).
  const sheet = page.getByTestId('mock-confirm-sheet')
  await expect(sheet).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('mock-confirm-heading')).not.toBeEmpty()
  await expect(sheet).toContainText('avbryter du blir provet ogiltigt')

  // Avbryt ("Inte nu") — zero-penalty dismiss. Back to the picker, no
  // session started (we never touched "Starta nu").
  await page.getByTestId('mock-confirm-dismiss').click()
  await expect(sheet).toBeHidden()
  await expect(picker).toBeVisible()
})
