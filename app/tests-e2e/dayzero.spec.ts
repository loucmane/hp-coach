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
//   1. palette → exam sitting → minutes per day
//   2. one ORD root card → three labelled authentic HP questions
//   3. true completion sentence → one completed, clickable first pass on Home
//   4. reload keeps the completed plan; no diagnostic or mock on day zero

import { createClerkClient } from '@clerk/backend'
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

// Fresh browser state — no shared storageState, no shared user.
test.use({ storageState: { cookies: [], origins: [] } })

test('day zero: preferences → ORD root → three real questions → completed first pass', async ({
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

    await expect(page.getByRole('heading', { name: 'Vilket prov siktar du på?' })).toBeVisible()
    await fortsatt.click()
    await expect(page.getByRole('heading', { name: 'Hur mycket tid passar dig?' })).toBeVisible()
    await page.getByRole('button', { name: '20 minuter' }).click()
    await fortsatt.click()
    await expect(page.getByRole('heading', { name: 'Ett litet o- vänder betydelsen' })).toBeVisible()
    await page.getByRole('button', { name: /Prova tre frågor/ }).click()

    const qids = ['host-2016-verb2-ORD-004', 'host-2021-verb2-ORD-003', 'host-2025-verb2-ORD-010']
    for (const qid of qids) {
      await expect(page.getByTestId('drill-question')).toHaveAttribute('data-qid', qid, { timeout: 30_000 })
      await expect(page.getByTestId('first-session-origin')).toHaveText(
        `Högskoleprovet hösten ${qid.split('-')[1]}`,
      )
      const correctLetter = await page.evaluate((id) => {
        const bank = (window as unknown as { __HPC_BANK__: { qid: string; answer: string }[] }).__HPC_BANK__
        return bank.find((q) => q.qid === id)?.answer ?? null
      }, qid)
      expect(correctLetter, `missing authentic answer for ${qid}`).not.toBeNull()
      const saved = page.waitForResponse((response) =>
        response.url().endsWith('/api/attempts') && response.request().method() === 'POST' && response.status() === 201,
      )
      await page.getByTestId(`option-${correctLetter}`).click()
      await saved
      await expect(page.getByTestId('pedagogy-panel')).toBeVisible({ timeout: 10_000 })
      await page.getByTestId('drill-next').click()
    }
    await expect(page.getByRole('heading', {
      name: 'Du klarade 3 av 3 frågor från riktiga högskoleprov',
    })).toBeVisible()
    await page.getByRole('button', { name: 'Till Hem' }).click()
    await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /Första passet/ })).toHaveAttribute(
      'href', '/lektion?section=ORD#ORD-ROOT-010',
    )
    await expect(page.getByTestId('kallelse-start')).toHaveCount(0)
    await expect(page.getByTestId('daily-plan-first-cta')).toHaveCount(0)
    // The completed day-zero plan survives a fresh page load.
    await page.reload()
    await expect(page.getByRole('link', { name: /Första passet/ })).toBeVisible({ timeout: 20_000 })

  } finally {
    await clerkApi.users.deleteUser(user.id).catch(() => {
      // Best-effort cleanup — a leaked +clerk_test user is inert.
    })
  }
})
