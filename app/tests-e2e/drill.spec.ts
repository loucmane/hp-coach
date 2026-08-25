// E2E: full drill flow against a real Clerk-signed session.
//
// The critical path that proves the whole stack works together:
//   1. SPA loads /drill, idle screen renders
//   2. Click "Starta övning" → POST /api/sessions, UI flips to Q1
//   3. Loop 10 times: read the question's data-qid → look up answer in
//      window.__HPC_BANK__ → click that letter → click "Nästa"
//   4. Result screen shows 10/10 (no misses)
//
// First test that exercises:
//   - bundled question dataset (var-2026.json)
//   - POST /api/attempts (one row per question)
//   - PATCH /api/sessions/:id (per-question position bumps + final end:true)

import { clearMistakes, expect, test } from './fixtures'

test('Drill ORD — 10 questions, all correct, end-to-end', async ({ page }, testInfo) => {
  // Mobile (iPhone 13 emulation) flakes here: drill-start sometimes
  // lands during a Clerk session refresh and the resulting state
  // transition is dropped — the button stays on "Starta övning".
  // Same pattern as mistakes.spec.ts. Chromium passes consistently and
  // validates the full product flow.
  test.skip(testInfo.project.name === 'mobile', 'mobile-emulation Clerk-refresh flake')
  // Deterministic clean slate: clear deletes any active session from a
  // previous run, so Start begins a fresh drill rather than ADOPTING a
  // leftover one (single-active-per-kind resume — there's no stale-session
  // warning to dismiss anymore).
  await clearMistakes(page)
  await page.goto('/drill')

  const idle = page.getByTestId('drill-idle')
  await expect(idle).toBeVisible({ timeout: 10_000 })

  // Wait for the question bank to be loaded before pressing Start. The
  // drill `begin()` handler awaits loadBank() (one /data/_index.json
  // fetch + 27 parallel exam JSONs); on a cold CI network this can take
  // longer than the 10s `toBeDisabled` timeout below, so the state
  // transition is dropped and drill-next never renders inside the
  // window. Locally the data is cached and the load is ~50ms — no race.
  // Gating on window.__HPC_BANK__ (set in src/main.tsx) converts the
  // implicit race into an explicit ready-check.
  await page.waitForFunction(
    () => {
      const bank = (window as unknown as { __HPC_BANK__?: unknown[] }).__HPC_BANK__
      return Array.isArray(bank) && bank.length > 0
    },
    null,
    { timeout: 20_000 },
  )

  await page.getByTestId('drill-start').click()

  for (let i = 0; i < 10; i++) {
    // Wait for an option button to be present — signals the drill is in
    // the 'answering' phase regardless of which Edition variant rendered
    // (StyleA editorial, StyleB workbook, StyleC cockpit, or the phone
    // DrillQuestion). Each layout renders the buttons; only the post-pick
    // "Nästa" affordance differs between variants and the phone path.
    const optionA = page.getByTestId('option-A')
    await expect(optionA).toBeVisible({ timeout: 10_000 })

    // Resolve the correct letter by the question's STABLE IDENTITY — the
    // data-qid the DrillQuestion root carries — not by its rendered prompt
    // text (hpf-ay8). Prompt matching misses 100% of the time for a
    // promptless ELF cloze (the DOM shows the synthesized "Lucka N"
    // headword while the bank row's prompt is '') and is exposed on NOG,
    // whose stem is only the parsed sub-question. The lookup still couples
    // the test to the runtime contract __HPC_BANK__ (set in src/main.tsx),
    // now through the key the bank is actually indexed by.
    const qid = await page.getByTestId('drill-question').getAttribute('data-qid')
    expect(qid, `question ${i + 1} carries no data-qid`).toBeTruthy()

    const correctLetter = await page.evaluate((id) => {
      const bank = (window as unknown as { __HPC_BANK__: { qid: string; answer: string }[] })
        .__HPC_BANK__
      return bank.find((q) => q.qid === id)?.answer ?? null
    }, qid)
    expect(correctLetter, `could not resolve answer for qid "${qid}" on Q${i + 1}`).not.toBeNull()

    await page.getByTestId(`option-${correctLetter}`).click()
    // drill-next appears post-grade. On the phone path it's the same
    // button rendered disabled-then-enabled; on the StyleA editorial
    // variant it only renders after grading (a different control idiom
    // — clicking-anywhere also advances, but the explicit button is
    // what the test asserts on).
    const nextBtn = page.getByTestId('drill-next')
    await expect(nextBtn).toBeVisible({ timeout: 5_000 })
    // `.hpc-breathe` cycles opacity + transform.scale on the CTA so
    // Playwright's stability check never settles. `force: true` skips it.
    await nextBtn.click({ force: true })
  }

  // Result screen should show the `Klart.` payoff. The composition
  // changed (no more bare "10" score testid) — the Detaljer card's
  // first row carries the correct/total figure now. Assert both the
  // headline and the Detaljer row text so we catch regressions in
  // either band.
  await expect(page.getByTestId('drill-result')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('drill-result-headline')).toHaveText('Klart.')
  await expect(page.getByTestId('drill-result-detaljer')).toContainText('10 av 10')
})

test('Cmd+K palette — open via keyboard, navigate to drill', async ({ page }) => {
  await page.goto('/')
  // Wait for the home shell to fully mount (React listeners attached) before
  // dispatching the keystroke. The compact greeting h1 is rendered as soon as
  // the route hydrates and is the most reliable cross-viewport landmark now
  // that B3.2 removed the "Fortsätt" CTA in favour of the daily-plan card.
  await expect(page.getByTestId('home-greeting')).toBeVisible({
    timeout: 10_000,
  })
  await page.keyboard.press('Control+K')
  const cmdk = page.getByTestId('cmdk')
  await expect(cmdk).toBeVisible({ timeout: 3_000 })

  await page.getByTestId('cmdk-item-drill-ord').click()
  // /drill, optionally followed by `?section=…` (Cmd+K command always
  // passes section explicitly).
  await expect(page).toHaveURL(/\/drill(\?.*)?$/)
  await expect(page.getByTestId('drill-idle')).toBeVisible({ timeout: 5_000 })
})
