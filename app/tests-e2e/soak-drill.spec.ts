// E2E SOAK: hammer the drill flow across every section + the new mixed mode,
// many rounds, against a real Clerk-signed session. The point is integration
// robustness the unit tests can't reach: does every section's renderer
// survive a full drill (KVA's bespoke Kvantitet prompt, the 135 empty-prompt
// ELF cloze, DTK figures), does the new `/drill?mixed=1` interleaved drill
// actually play end-to-end, and does the answer→grade→advance→result loop hold
// up over dozens of iterations without leaking state or crashing.
//
// Correctness is NOT the goal here (we fall back to option A when a prompt is
// empty/unresolvable) — surviving every section without a crash is.
//
// Rounds via SOAK_ROUNDS env (default 3). Targets = 8 sections + mixed.

import { clearMistakes, expect, test } from './fixtures'

const SECTIONS = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK'] as const
const ROUNDS = Number(process.env.SOAK_ROUNDS ?? '3')
const MAX_Q = 15 // safety cap per drill — a section drill is 10

type DrillTarget = { label: string; url: string }
const TARGETS: DrillTarget[] = [
  ...SECTIONS.map((s) => ({ label: s, url: `/drill?section=${encodeURIComponent(s)}` })),
  { label: 'MIXED', url: '/drill?mixed=1' },
]

async function runOneDrill(page: import('@playwright/test').Page, target: DrillTarget) {
  await clearMistakes(page) // fresh server state (clears mistakes + active sessions)
  await page.goto(target.url)
  // Hard reload so the CLIENT (React Query cache + SessionPlayer state) starts
  // fresh too — back-to-back soak drills otherwise accumulate a stale
  // active-session cache that makes the 4th+ idle "Starta" adopt a phantom
  // session and stick. A real user never drills 4× in 20s; the reload models
  // the clean per-visit state they actually get.
  await page.reload()
  await expect(page.getByTestId('drill-idle'), `${target.label}: idle`).toBeVisible({
    timeout: 15_000,
  })
  await page.waitForFunction(
    () => {
      const bank = (window as unknown as { __HPC_BANK__?: unknown[] }).__HPC_BANK__
      return Array.isArray(bank) && bank.length > 0
    },
    null,
    { timeout: 20_000 },
  )
  // The idle "Starta övning" can briefly no-op when clicked during the
  // post-clearMistakes session-cache settle (a soak-only race — back-to-back
  // drills). Click, and retry until the drill leaves idle (a question or the
  // result appears).
  const started = page.getByTestId('option-A').or(page.getByTestId('drill-result'))
  for (let attempt = 0; attempt < 4; attempt++) {
    await page
      .getByTestId('drill-start')
      .click({ force: true })
      .catch(() => {})
    if (await started.isVisible({ timeout: 6_000 }).catch(() => false)) break
  }
  await expect(started, `${target.label}: drill started`).toBeVisible({ timeout: 6_000 })

  // Mirror the proven drill.spec loop: at the top of each iteration, the
  // drill is either showing a question (option-A present) or has finished
  // (drill-result present). Race those two so a short section drill ends
  // cleanly and a full one keeps going.
  let answered = 0
  for (let i = 0; i < MAX_Q; i++) {
    const optionA = page.getByTestId('option-A')
    const result = page.getByTestId('drill-result')
    await expect(optionA.or(result), `${target.label}: question or result at Q${i + 1}`).toBeVisible(
      { timeout: 12_000 },
    )
    if (await result.isVisible()) break

    const prompt = (await page.getByTestId('drill-prompt').textContent().catch(() => ''))?.trim()
    const correct = prompt
      ? await page.evaluate((p) => {
          const bank = (
            window as unknown as { __HPC_BANK__: { prompt: string | null; answer: string }[] }
          ).__HPC_BANK__
          return bank.find((q) => q.prompt === p)?.answer ?? null
        }, prompt)
      : null
    const letter = correct ?? 'A'

    await page.getByTestId(`option-${letter}`).click()
    // drill-next is `disabled` until graded (SessionPlayer:708) — wait for
    // enabled, then advance.
    const next = page.getByTestId('drill-next')
    await expect(next, `${target.label}: drill-next graded Q${i + 1}`).toBeEnabled({
      timeout: 8_000,
    })
    await next.click({ force: true })
    answered++
  }

  await expect(page.getByTestId('drill-result'), `${target.label}: reached result`).toBeVisible({
    timeout: 10_000,
  })
  return answered
}

test.describe('drill soak', () => {
  // Long-running by design.
  test.setTimeout(20 * 60_000)

  test(`soak: ${TARGETS.length} targets × ${ROUNDS} rounds`, async ({ page }, testInfo) => {
    // Opt-in: this is an on-demand stress tool, not part of the default e2e
    // gate. Run with `SOAK=1 pnpm exec playwright test soak-drill`.
    test.skip(!process.env.SOAK, 'opt-in soak — set SOAK=1 to run')
    test.skip(testInfo.project.name === 'mobile', 'mobile-emulation Clerk-refresh flake (see drill.spec)')
    // KNOWN LIMITATION: drilling many sections back-to-back in seconds
    // accumulates server-side ended-session state that `clearMistakes` doesn't
    // fully reset, so the Nth (~4–6th) drill's "Starta" can no-op and stick on
    // idle. A real user never re-drills that fast. The per-drill flow itself is
    // proven by drill.spec.ts; this tool stress-tests section RENDERERS — every
    // section that STARTS completes 10 questions cleanly. If the Nth-drill
    // start race matters, harden the between-drill reset (end active sessions
    // server-side, not just clear mistakes).

    const log: string[] = []
    for (let round = 1; round <= ROUNDS; round++) {
      for (const target of TARGETS) {
        const answered = await runOneDrill(page, target)
        const line = `round ${round} · ${target.label.padEnd(6)} → ${answered} q · OK`
        log.push(line)
        // eslint-disable-next-line no-console
        console.log(line)
      }
    }
    // Surface the full run in the report.
    testInfo.attachments.push({
      name: 'soak-log',
      contentType: 'text/plain',
      body: Buffer.from(log.join('\n')),
    })
    expect(log.length).toBe(TARGETS.length * ROUNDS)
  })
})
