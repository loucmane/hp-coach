// SF1 verification — "Daily-loop closer".
//
// OPT-IN ONLY. Gated on process.env.SF1VERIFY so it never runs in CI
// (multi-drill back-to-back is sensitive to the #166 session race and
// the diagnostic flow lands on a different result screen). Run with:
//
//   SF1VERIFY=1 pnpm exec playwright test sf1-loop.spec --project=chromium --reporter=line
//
// What SF1 fixed: daily-plan items with section=null (mastery "Blandad
// övning · alla sektioner" + cold-start "Diagnos") had NO completion
// branch in deriveCompletion/isItemComplete, so they never flipped to
// "klar ✓" even after the work was done. SF1 added a section=null branch
// keyed on plan.totalAttemptsSnapshot (the server attempts.total monotonic
// counter): the item completes when totalAttempts - snapshot >= 5.
//
// This spec drives the REAL authenticated app and asserts the flip.

import { clearMistakes, expect, test } from './fixtures'

const API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

type ItemInfo = { id: string; href: string | null; completed: string | null }

// End every in-flight session via the API WITHOUT touching the attempts
// counters. This kills the "adopt a stale, already-finished session" path
// (SessionPlayer.begin adopts an active session of the same kind, replaying
// it at its saved position — which lands on the result screen for a session
// that was completed in a prior step). Unlike clearMistakes/action:'clear',
// this leaves attemptsTotal + attempts7d intact, so the section= drill plan
// item survives and its completion signal still grows on the next drill.
async function endActiveSessions(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(async (baseUrl) => {
    type ClerkLike = {
      loaded?: boolean
      session?: { getToken: () => Promise<string | null> } | null
    }
    const getClerk = () => (window as unknown as { Clerk?: ClerkLike }).Clerk
    const deadline = Date.now() + 15_000
    let token: string | null = null
    while (Date.now() < deadline) {
      const clerk = getClerk()
      if (clerk?.loaded && clerk.session) {
        token = (await clerk.session.getToken()) ?? null
        if (token) break
      }
      await new Promise((r) => setTimeout(r, 100))
    }
    if (!token) throw new Error('no Clerk token after 15s')
    const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    const res = await fetch(`${baseUrl}/api/sessions/active`, { headers: auth })
    const { sessions } = (await res.json()) as { sessions: Array<{ id: number }> }
    for (const s of sessions) {
      await fetch(`${baseUrl}/api/sessions/${s.id}`, {
        method: 'PATCH',
        headers: auth,
        body: JSON.stringify({ end: true }),
      })
    }
    return sessions.length
  }, API_BASE_URL)
}

// Enumerate every daily-plan-item-* row: id, its link href, completion attr.
async function enumeratePlan(page: import('@playwright/test').Page): Promise<ItemInfo[]> {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid^="daily-plan-item-"]'))
    return rows.map((row) => {
      const tid = row.getAttribute('data-testid') ?? ''
      const id = tid.replace('daily-plan-item-', '')
      const link = row.querySelector('[data-testid^="daily-plan-link-"]') as HTMLAnchorElement | null
      return {
        id,
        href: link?.getAttribute('href') ?? null,
        completed: row.getAttribute('data-completed'),
      }
    })
  })
}

// Wait for either the plan card or the all-complete panel to settle.
// The skeleton ("Laddar dagens plan …") shows until useStats + useDueMistakes
// resolve; after a just-completed drill that refetch can take a while, so we
// give it a generous window and, if the skeleton is still up, reload once.
async function waitForPlan(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 20_000 })
  const card = page.getByTestId('daily-plan-card').or(page.getByTestId('daily-plan-complete'))
  try {
    await expect(card).toBeVisible({ timeout: 25_000 })
  } catch {
    // Skeleton stuck — bounce the page once to force a fresh stats fetch.
    await page.reload()
    await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 20_000 })
    await expect(card).toBeVisible({ timeout: 25_000 })
  }
}

// Drive one SessionPlayer drill to completion: answer all questions
// correctly via window.__HPC_BANK__, then wait for the result screen.
// `length` defaults to 10. `expectDrillResult` true → assert the
// drill-result headline; false (diagnostic) → just wait for the option
// loop to drain (the diagnostic lands on a different report screen).
async function completeSession(
  page: import('@playwright/test').Page,
  length: number,
  expectDrillResult: boolean,
): Promise<void> {
  const idle = page.getByTestId('drill-idle')
  await expect(idle).toBeVisible({ timeout: 15_000 })
  await page.waitForFunction(
    () => {
      const bank = (window as unknown as { __HPC_BANK__?: unknown[] }).__HPC_BANK__
      return Array.isArray(bank) && bank.length > 0
    },
    null,
    { timeout: 20_000 },
  )
  await page.getByTestId('drill-start').click()

  for (let i = 0; i < length; i++) {
    const optionA = page.getByTestId('option-A')
    await expect(optionA).toBeVisible({ timeout: 15_000 })
    const prompt = (await page.getByTestId('drill-prompt').textContent())?.trim()
    const correctLetter = await page.evaluate((p) => {
      const bank = (
        window as unknown as { __HPC_BANK__: { prompt: string | null; answer: string }[] }
      ).__HPC_BANK__
      return bank.find((q) => q.prompt === p)?.answer ?? null
    }, prompt)
    // Fallback: if we can't resolve the answer (e.g. a non-text prompt),
    // just pick A — we only need the attempt POSTed, not a perfect score.
    const letter = correctLetter ?? 'A'
    await page.getByTestId(`option-${letter}`).click()
    const nextBtn = page.getByTestId('drill-next')
    await expect(nextBtn).toBeVisible({ timeout: 8_000 })
    await expect(nextBtn).toBeEnabled({ timeout: 8_000 })
    await nextBtn.click({ force: true })
  }

  if (expectDrillResult) {
    await expect(page.getByTestId('drill-result')).toBeVisible({ timeout: 15_000 })
  }
}

test.describe('SF1 daily-loop closer', () => {
  test.skip(!process.env.SF1VERIFY, 'opt-in SF1 verification (set SF1VERIFY=1)')

  test('section=null cold-start item flips to klar after diagnostic', async ({ page }, testInfo) => {
    // Clean slate: clear() also zeroes the server attemptsTotal counter, so
    // a fresh plan snapshots totalAttemptsSnapshot=0. With no per-section
    // signal the scheduler returns the cold-start item (section=null, kind
    // drill, href /diagnostik) — which exercises the EXACT SF1 branch.
    await clearMistakes(page)
    // Drop any cached plan so the hook regenerates against the just-reset
    // (attempts.total=0) server state rather than adopting a stale snapshot.
    await page.evaluate(() => {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k?.startsWith('hpc-daily-plan-')) localStorage.removeItem(k)
      }
    })
    await page.goto('/')
    await waitForPlan(page)
    await page.screenshot({ path: testInfo.outputPath('sf1-coldstart-home-before.png'), fullPage: true })

    const before = await enumeratePlan(page)
    console.log('PLAN (cold-start) BEFORE:', JSON.stringify(before, null, 2))
    // Persist for the report.
    await testInfo.attach('plan-before', { body: JSON.stringify(before, null, 2), contentType: 'application/json' })

    // Find the section=null item. After a clear it should be the cold-start
    // /diagnostik item; we tolerate either /diagnostik or /drill?mixed=1.
    const target = before.find(
      (i) => i.href?.includes('/diagnostik') || i.href?.includes('mixed=1'),
    )
    expect(target, 'expected a section=null item (cold-start /diagnostik or mixed) in the plan').toBeTruthy()
    if (!target) return
    expect(target.completed, `target ${target.id} should start incomplete`).toBe('false')

    const isDiagnostic = !!target.href?.includes('/diagnostik')
    console.log(`Target item: id=${target.id} href=${target.href} (diagnostic=${isDiagnostic})`)

    await page.getByTestId(`daily-plan-link-${target.id}`).click()
    // Diagnostic = 10 across sections, lands on DiagnosticReport (no
    // drill-result). Mixed = 10, lands on DrillResult.
    await completeSession(page, 10, !isDiagnostic)

    // Back to Home; re-read the target row's data-completed.
    await page.goto('/')
    await waitForPlan(page)
    await page.screenshot({ path: testInfo.outputPath('sf1-coldstart-home-after.png'), fullPage: true })

    const allCompletePanel = await page.getByTestId('daily-plan-complete').count()
    const after = await enumeratePlan(page)
    console.log('PLAN (cold-start) AFTER:', JSON.stringify(after, null, 2))
    console.log('daily-plan-complete present:', allCompletePanel > 0)
    await testInfo.attach('plan-after', { body: JSON.stringify(after, null, 2), contentType: 'application/json' })

    // CORE SF1 ASSERTION: the section=null item flipped to completed.
    // When it was the sole item, the card flips entirely to the
    // daily-plan-complete panel (so the row disappears). Accept EITHER
    // the row reading data-completed="true" OR the all-complete panel
    // having replaced the card — both prove the item derived complete.
    const afterTarget = after.find((i) => i.id === target.id)
    const flipped = afterTarget?.completed === 'true' || allCompletePanel > 0
    expect(
      flipped,
      `SF1: section=null item ${target.id} did not flip — after row=${JSON.stringify(afterTarget)}, completePanel=${allCompletePanel}`,
    ).toBe(true)
  })

  test('section= drill item flips to klar after completing that section drill', async ({
    page,
  }, testInfo) => {
    // What the REAL scheduler prescribes for this user is volatile run-to-run
    // (each drill shifts the section scores, so the plan flips between a KVA
    // lesson, a NOG drill, etc.) and on a fully-warmed user often contains NO
    // section= drill at all. To verify the per-section completion branch
    // deterministically we drive a REAL drill against REAL server attempts,
    // and seed a minimal cached plan whose ORD drill snapshot is 0 — so the
    // 10 attempts the drill records satisfy the >=5 growth threshold.

    // 1. Clean slate: zeroes attemptsTotal AND clears sessions, so the ORD
    //    drill below starts from a known attempts7d[ORD] baseline of 0.
    await clearMistakes(page)
    await endActiveSessions(page)

    // 2. Drive a genuine ORD section drill through the real SessionPlayer.
    //    This POSTs 10 attempts (attempts7d[ORD] 0 -> 10) and ends the
    //    session on the result screen.
    await page.goto('/drill?section=ORD')
    await completeSession(page, 10, true)

    // 3. Seed a minimal, schema-valid cached plan for TODAY holding a single
    //    ORD drill item with attemptsSnapshot.ORD = 0. On the next Home mount
    //    deriveCompletion compares live attempts7d[ORD] (now 10) against this
    //    snapshot (0): 10 - 0 >= 5 -> the item must derive complete. This is
    //    the exact per-section branch in isItemComplete, exercised end-to-end
    //    against real recorded attempts.
    const itemId = await page.evaluate(() => {
      const d = new Date()
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`
      const id = `drill-ORD-${date}`
      const plan = {
        version: 6, // PLAN_SCHEMA_VERSION
        date,
        items: [
          {
            id,
            kind: 'drill',
            section: 'ORD',
            headline: 'ORD-drill · 10 frågor',
            rationale: 'SF1 verification — per-section completion.',
            estimatedMinutes: 10,
            href: '/drill?section=ORD',
            completed: false,
          },
        ],
        estimatedMinutes: 10,
        attemptsSnapshot: { ORD: 0 },
        totalAttemptsSnapshot: 0,
      }
      localStorage.setItem(`hpc-daily-plan-${date}`, JSON.stringify(plan))
      return id
    })
    console.log(`Seeded cached plan with item ${itemId} (attemptsSnapshot.ORD=0).`)

    // 4. Mount Home; the cached plan loads and completion derives from live
    //    stats. The single ORD drill item should flip to completed, which —
    //    being the sole item — flips the whole card to daily-plan-complete.
    await page.goto('/')
    await waitForPlan(page)
    await page.screenshot({
      path: testInfo.outputPath('sf1-drill-home-after.png'),
      fullPage: true,
    })

    const after = await enumeratePlan(page)
    const allCompletePanel = await page.getByTestId('daily-plan-complete').count()
    console.log('PLAN (seeded ORD drill) AFTER:', JSON.stringify(after, null, 2))
    console.log('daily-plan-complete present:', allCompletePanel > 0)
    await testInfo.attach('seeded-plan-after', {
      body: JSON.stringify({ after, allCompletePanel }, null, 2),
      contentType: 'application/json',
    })

    const afterTarget = after.find((i) => i.id === itemId)
    // Accept either the row reading data-completed="true" OR the all-complete
    // panel having replaced the card (sole item completed -> card flips).
    const flipped = afterTarget?.completed === 'true' || allCompletePanel > 0
    expect(
      flipped,
      `SF1 per-section: ORD drill item ${itemId} did not flip — row=${JSON.stringify(
        afterTarget,
      )}, completePanel=${allCompletePanel}`,
    ).toBe(true)
  })

  test('mixed drill route plays a genuinely interleaved cross-section set', async ({
    page,
  }, testInfo) => {
    // The mastery "Blandad övning · alla sektioner" plan item deep-links to
    // /drill?mixed=1, which SF1 wired to pickMixedDrillQuestions (round-robin
    // across all 8 sections). Drive that route directly and confirm it plays a
    // real 10-question drill that spans more than one section — proving the
    // mixed picker, not the old ORD-only fallback that was the original bug.
    await clearMistakes(page)
    await endActiveSessions(page)
    await page.goto('/drill?mixed=1')

    const idle = page.getByTestId('drill-idle')
    await expect(idle).toBeVisible({ timeout: 15_000 })
    // Idle copy should say "Blandad övning", not a single section.
    await expect(page.getByText('Blandad övning')).toBeVisible({ timeout: 5_000 })
    await page.screenshot({
      path: testInfo.outputPath('sf1-mixed-idle.png'),
      fullPage: true,
    })

    await page.waitForFunction(
      () => {
        const bank = (window as unknown as { __HPC_BANK__?: unknown[] }).__HPC_BANK__
        return Array.isArray(bank) && bank.length > 0
      },
      null,
      { timeout: 20_000 },
    )
    await page.getByTestId('drill-start').click()

    // Collect the section of each served question via __HPC_BANK__ lookup on
    // the prompt, then complete the drill.
    const sectionsSeen = new Set<string>()
    for (let i = 0; i < 10; i++) {
      const optionA = page.getByTestId('option-A')
      await expect(optionA).toBeVisible({ timeout: 15_000 })
      const prompt = (await page.getByTestId('drill-prompt').textContent())?.trim()
      const info = await page.evaluate((p) => {
        const bank = (
          window as unknown as {
            __HPC_BANK__: { prompt: string | null; answer: string; section?: string }[]
          }
        ).__HPC_BANK__
        const q = bank.find((x) => x.prompt === p)
        return { answer: q?.answer ?? null, section: q?.section ?? null }
      }, prompt)
      if (info.section) sectionsSeen.add(info.section)
      const letter = info.answer ?? 'A'
      await page.getByTestId(`option-${letter}`).click()
      const nextBtn = page.getByTestId('drill-next')
      await expect(nextBtn).toBeVisible({ timeout: 8_000 })
      await expect(nextBtn).toBeEnabled({ timeout: 8_000 })
      await nextBtn.click({ force: true })
    }

    await expect(page.getByTestId('drill-result')).toBeVisible({ timeout: 15_000 })
    console.log('Mixed drill sections seen:', JSON.stringify([...sectionsSeen]))
    await testInfo.attach('mixed-sections', {
      body: JSON.stringify([...sectionsSeen], null, 2),
      contentType: 'application/json',
    })
    // Interleaved means more than one section in a 10-question set. (The old
    // bug served all-ORD; round-robin across 8 sections yields >=2.)
    expect(
      sectionsSeen.size,
      `mixed drill should span multiple sections, saw: ${[...sectionsSeen]}`,
    ).toBeGreaterThan(1)
  })
})
