// Live frame-capture for the motion-winners wave (evidence, not a gate):
//
//   • the KH "Hybriden" ceremony on the REAL DrillResult — a clean run
//     and a missed run, captured through strike → counted wave → settle;
//   • the Skriften write-in on the shipped surfaces (Home / Öva /
//     Framsteg) under a throttled cold query, plus a cached pass that
//     proves the ceremony is SKIPPED when data is present at mount.
//
// Frames land in ../screenshots-motion-winners/. Full motion is forced
// (the config default is reducedMotion:'reduce'); the drill is driven
// through the real UI so DrillResult mounts exactly as it does in life.

import type { Page } from '@playwright/test'

import { clearMistakes, expect, test } from './fixtures'

const SHOTS = '../screenshots-motion-winners'

type BankQ = {
  qid: string
  section: string
  parsing_status: string
  options?: { letter: string }[] | null
  answer: string
}

async function ordBank(page: Page): Promise<Map<string, BankQ>> {
  const rows = (await page.evaluate(() => {
    const bank = (window as unknown as { __HPC_BANK__?: BankQ[] }).__HPC_BANK__ ?? []
    return bank.filter((b) => b.section === 'ORD' && b.parsing_status === 'complete' && !!b.options)
  })) as BankQ[]
  return new Map(rows.map((q) => [q.qid, q]))
}

// Drive a real ORD drill to completion. `missNumbers` are the 1-based
// question positions to answer WRONG (empty = a clean run). Returns once
// the final "Avsluta" has been clicked and DrillResult is mounting.
async function driveDrill(page: Page, missNumbers: Set<number>): Promise<void> {
  await page.goto('/drill?section=ORD&start=true')
  await page.waitForFunction(
    () => {
      const bank = (window as unknown as { __HPC_BANK__?: unknown[] }).__HPC_BANK__
      return Array.isArray(bank) && bank.length > 0
    },
    null,
    { timeout: 20_000 },
  )
  await expect(page.getByTestId('option-A')).toBeVisible({ timeout: 15_000 })
  const bank = await ordBank(page)

  for (let n = 1; n <= 40; n++) {
    const qid = new URL(page.url()).searchParams.get('qid') ?? ''
    const answer = (bank.get(qid)?.answer ?? 'A').toUpperCase()
    let pick = answer
    if (missNumbers.has(n)) {
      for (const l of ['A', 'B', 'C', 'D', 'E']) {
        if (l !== answer && (await page.getByTestId(`option-${l}`).count())) {
          pick = l
          break
        }
      }
    }
    await page.getByTestId(`option-${pick}`).click({ force: true })
    const next = page.getByTestId('drill-next')
    await expect(next).toBeVisible({ timeout: 10_000 })
    await next.click()
    // The click either advances to the next question or completes the
    // session — return the moment DrillResult begins mounting so the burst
    // catches the strike; otherwise wait for the next question.
    await page.waitForFunction(
      () =>
        !!document.querySelector('[data-testid="drill-result"]') ||
        !!document.querySelector('[data-testid="option-A"]'),
      null,
      { timeout: 10_000 },
    )
    if (await page.getByTestId('drill-result').count()) return
  }
}

// Rapid frame burst — `count` shots `stepMs` apart, tolerant of the odd
// slow frame so the ceremony's whole arc is captured.
async function burst(page: Page, prefix: string, count: number, stepMs: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page
      .screenshot({ path: `${SHOTS}/${prefix}-${String(i).padStart(2, '0')}.png` })
      .catch(() => {})
    await page.waitForTimeout(stepMs)
  }
}

test('KH ceremony on the real DrillResult — clean + missed runs', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the desktop drill chassis is the capture target')
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  // Missed run first (the more illustrative — ✗ rows struck + counted).
  await clearMistakes(page)
  await driveDrill(page, new Set([2, 4, 6]))
  await burst(page, 'kh-missed', 22, 110)
  await expect(page.getByTestId('drill-result')).toBeVisible()
  await expect(page.getByTestId('drill-result-headline')).toHaveText('Klart.')
  // Scroll to the facit foot (viewport shot, NOT fullPage — a fullPage
  // resize remounts the motion tree and re-arms the ceremony) to show the
  // settled summa + bookkeeper's rule + the coda seated on KLART_SATS.
  await page.getByTestId('drill-result-summa').scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOTS}/kh-missed-bottom.png` })

  // Clean run.
  await clearMistakes(page)
  await driveDrill(page, new Set())
  await burst(page, 'kh-clean', 22, 110)
  await expect(page.getByTestId('drill-result-headline')).toHaveText('Klart.')
  await page.getByTestId('drill-result-summa').scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOTS}/kh-clean-bottom.png` })
})

test('Skriften write-in on the shipped surfaces — cold vs cached', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop Skriften surfaces')
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await clearMistakes(page)

  // Delay only the DATA endpoints (not the route chunks or Clerk auth), so
  // the route renders instantly with baseline rules and the write-in fires
  // exactly when the slow query lands — the honest arrival, not an app-shell
  // "LADDAR…". A module-level flag lets the same route toggle to instant for
  // the cached pass.
  let slow = true
  await page.route(/\/api\/(me\/(plan|stats)|mistakes)/, async (route) => {
    if (slow) await new Promise((r) => setTimeout(r, 1300))
    await route.continue()
  })

  const surfaces: { name: string; path: string }[] = [
    { name: 'home', path: '/' },
    { name: 'ova', path: '/ova' },
    { name: 'progress', path: '/progress' },
  ]

  // COLD: the data lands slow → baseline rules, then each line writes in.
  for (const s of surfaces) {
    await page.goto('/mer')
    await page.goto(s.path)
    await burst(page, `skrift-${s.name}-cold`, 16, 120)
  }

  // CACHED: instant data + already-warm query cache → Skriften skips the
  // write-in entirely (content just there, no baseline rule).
  slow = false
  for (const s of surfaces) {
    await page.goto('/mer')
    await page.goto(s.path)
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${SHOTS}/skrift-${s.name}-cached.png` }).catch(() => {})
  }
})
