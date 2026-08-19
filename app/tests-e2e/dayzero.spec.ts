// Day-zero funnel e2e (P2.2 onboarding hardening).
//
// Unlike every other spec, this one does NOT reuse the shared signed-in
// storageState — the whole point is a BRAND-NEW account with zero
// attempts, zero mistakes, zero mock history and a fresh localStorage.
// A unique `+clerk_test` user is created via Clerk's Backend API per
// run (auto-verifying, no inbox), signed in fresh, and deleted again in
// the finally block so the dev instance doesn't accumulate residue.
//
// The flow under test — the first signed-in minute as one thread:
//   1. fresh sign-in → the /welcome picker (one soft gate, one button)
//   2. Fortsätt → Daily Home shows ONE obvious first action
//      ("Börja här", the FirstDayPanel) — and NOT the 55-min Provpass
//      summons that anchored day zero before P2.2
//   3. tap → lands IN the first question (?start=1 direct start, no
//      idle interstitial)
//   4. answer → the genomgång (PedagogyPanel) renders — the idiom the
//      landing taught, delivered for real.

import { createClerkClient } from '@clerk/backend'
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

// Fresh browser state — no shared storageState, no shared user.
test.use({ storageState: { cookies: [], origins: [] } })

test('day zero: fresh account → one first action → first question → genomgång', async ({
  page,
}, testInfo) => {
  // Same mobile-emulation Clerk-refresh flake as drill.spec.ts — the
  // fresh sign-in + session-start path is the sensitive part. Chromium
  // validates the full product flow.
  test.skip(testInfo.project.name === 'mobile', 'mobile-emulation Clerk-refresh flake')
  // Fresh sign-in + full first-session walk — roomier than the 30s default.
  test.setTimeout(120_000)

  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) throw new Error('Missing CLERK_SECRET_KEY — set it in app/.env.local')
  const clerkApi = createClerkClient({ secretKey })
  const email = `hpc-dayzero-${Date.now()}+clerk_test@example.com`
  const user = await clerkApi.users.createUser({
    emailAddress: [email],
    skipPasswordRequirement: true,
  })

  try {
    await setupClerkTestingToken({ page })
    await page.goto('/')
    await clerk.signIn({ page, signInParams: { strategy: 'email_code', identifier: email } })
    await page.goto('/')

    // ── 1 · the welcome picker gates the first visit ────────────────
    const fortsatt = page.getByRole('button', { name: /Fortsätt/ })
    await expect(fortsatt).toBeVisible({ timeout: 20_000 })
    await fortsatt.click()

    // ── 2 · Daily Home: one door, no Provpass summons ───────────────
    await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 15_000 })
    const firstCta = page.getByTestId('daily-plan-first-cta')
    await expect(firstCta).toBeVisible({ timeout: 20_000 })
    await expect(firstCta).toHaveText(/Starta första övningen/)
    // The pre-P2.2 day-zero bug: the Kallelse summoned a 55-minute mock
    // as the stranger's first action. It must NOT render on day zero.
    await expect(page.getByTestId('kallelse-start')).toHaveCount(0)

    // ── 3 · the door lands IN the first question ────────────────────
    await firstCta.click()
    await expect(page).toHaveURL(/\/diagnostik/, { timeout: 10_000 })
    // Direct start (?start=1): the first option renders without any
    // "Starta övning" tap. Cold bank load can take a while on CI.
    const optionA = page.getByTestId('option-A')
    await expect(optionA).toBeVisible({ timeout: 30_000 })

    // ── 4 · answer → the genomgång renders ──────────────────────────
    // Resolve the correct letter by the question's STABLE IDENTITY, not
    // by its rendered prompt text (hpf-ay8). The old recipe matched
    // drill-prompt's textContent against the bank, which misses 100% of
    // the time for a promptless ELF cloze — the DOM shows the synthesized
    // 'Lucka N' headword while the bank row's prompt is '' — and is
    // exposed on NOG, whose stem is only the parsed sub-question. Day
    // zero's first question is chosen by the adaptive plan and is NOT
    // pinned, so that class was sampled at random and the failure read as
    // flakiness. The determinism belongs here, in the resolver.
    const qid = await page.getByTestId('drill-question').getAttribute('data-qid')
    expect(qid, 'first diagnostic question carries no data-qid').toBeTruthy()
    const correctLetter = await page.evaluate((id) => {
      const bank = (window as unknown as { __HPC_BANK__: { qid: string; answer: string }[] })
        .__HPC_BANK__
      return bank.find((q) => q.qid === id)?.answer ?? null
    }, qid)
    expect(correctLetter, `could not resolve answer for qid "${qid}"`).not.toBeNull()
    await page.getByTestId(`option-${correctLetter}`).click()

    await expect(page.getByTestId('pedagogy-panel')).toBeVisible({ timeout: 10_000 })
  } finally {
    await clerkApi.users.deleteUser(user.id).catch(() => {
      // Best-effort cleanup — a leaked +clerk_test user is inert.
    })
  }
})
