// E2E: A2 "Arket" motion settle regression — the anti-jank contract.
//
// A2's law: "every settle lands exactly on static layout." The bake-off
// proved it by walking the flow twice — once animated, once in a
// reduced-motion context (which renders the same states with zero
// animation, i.e. true static layout) — and diffing every probe's
// getBoundingClientRect. Tolerance 1px.
//
// Here the same idea against the PRODUCT drill, using page.emulateMedia
// to toggle reduced motion on one authenticated page (same session, same
// deterministic question via ?qid, so content is identical across passes
// and only the MOTION differs):
//
//   pass A — reduced motion: navigate + answer, record static probe rects
//   pass B — full motion:    navigate + answer, wait for the springs to
//            settle (rects stable for 10 frames), record settled rects
//   diff every shared probe · tolerance 1px
//
// Probes are MODE-INVARIANT elements only — the scene container, the
// drill prompt, and the option rows. The verdict WORD is deliberately
// excluded: under reduced motion it renders the calm "Rätt./Fel."
// fallback, while full motion morphs the picked option word in — so its
// box differs by DESIGN, not by jank. What must match is the layout the
// animation lands on: prompt + option rows + the reading window.
//
// The animated pass also drops key frames into screenshots-motion-prod/
// for the human review the task asks for.

import type { Page } from '@playwright/test'

import { clearMistakes, expect, test } from './fixtures'

type Rect = { x: number; y: number; width: number; height: number }

const SHOT_DIR = 'screenshots-motion-prod'

// Read a probe's bounding rect, or null when it isn't present/visible.
async function rectOf(page: Page, selector: string): Promise<Rect | null> {
  const el = page.locator(selector).first()
  if ((await el.count()) === 0) return null
  const box = await el.boundingBox()
  return box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null
}

// Poll a set of selectors until every present rect is stable for
// `frames` consecutive reads — the reference's "10 stable frames" settle
// gate. Mouse is parked so no hover nudge pollutes the record.
async function waitSettled(
  page: Page,
  selectors: string[],
  frames = 10,
): Promise<void> {
  await page.mouse.move(5, 5)
  let prev = '' as string
  let stable = 0
  const deadline = Date.now() + 6000
  while (Date.now() < deadline) {
    const rects = await Promise.all(selectors.map((s) => rectOf(page, s)))
    const snap = JSON.stringify(
      rects.map((r) => (r ? [Math.round(r.x * 100), Math.round(r.y * 100), Math.round(r.width * 100), Math.round(r.height * 100)] : null)),
    )
    if (snap === prev) {
      stable += 1
      if (stable >= frames) return
    } else {
      stable = 0
      prev = snap
    }
    await page.waitForTimeout(16)
  }
}

// Resolve a deterministic ORD text question + its correct letter, so both
// passes drill the exact same content and the click always grades.
async function pickOrdProbe(
  page: Page,
): Promise<{ qid: string; answer: string }> {
  return await page.evaluate(() => {
    const bank = (
      window as unknown as {
        __HPC_BANK__: {
          qid: string
          section: string
          answer: string
          parsing_status?: string
          options?: unknown[] | null
        }[]
      }
    ).__HPC_BANK__
    const q = bank.find(
      (b) => b.section === 'ORD' && b.parsing_status === 'complete' && !!b.options,
    )
    if (!q) throw new Error('no complete ORD question in bank')
    return { qid: q.qid, answer: q.answer }
  })
}

// Walk one pass (home → drill(?qid) → answer) and return probe rects at
// each checkpoint. `animated` gates the settle wait + the screenshots.
async function walk(
  page: Page,
  probe: { qid: string; answer: string },
  animated: boolean,
): Promise<Record<string, Rect | null>> {
  const out: Record<string, Rect | null> = {}

  // CP1 — home. The scene container + greeting. Both passes settle (and
  // wait out home's async dashboard data) so we compare fully-laid-out
  // layout, not one pass caught mid-load against the other.
  await page.goto('/')
  await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  const homeProbes = ['[data-scene]', '[data-testid="home-greeting"]']
  await waitSettled(page, homeProbes)
  out['home/scene'] = await rectOf(page, '[data-scene]')
  out['home/greeting'] = await rectOf(page, '[data-testid="home-greeting"]')
  if (animated) await page.screenshot({ path: `${SHOT_DIR}/01-home.png` })

  // CP2 — drill, answering. Deterministic single question via ?qid.
  await page.goto(`/drill?section=ORD&qid=${encodeURIComponent(probe.qid)}`)
  await page.waitForFunction(
    () => {
      const bank = (window as unknown as { __HPC_BANK__?: unknown[] }).__HPC_BANK__
      return Array.isArray(bank) && bank.length > 0
    },
    null,
    { timeout: 20_000 },
  )
  // Direct-link auto-resumes into the answering phase.
  await expect(page.getByTestId('option-A')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('drill-prompt')).toBeVisible()
  const answerProbes = [
    '[data-testid="drill-prompt"]',
    '[data-testid="option-A"]',
    '[data-testid="option-B"]',
    '[data-testid="option-C"]',
  ]
  await waitSettled(page, answerProbes)
  for (const s of answerProbes) out[`answer/${s}`] = await rectOf(page, s)
  if (animated) await page.screenshot({ path: `${SHOT_DIR}/02-drill-answering.png` })

  // CP3 — graded. Click the correct letter → verdict morph + pedagogy.
  await page.getByTestId(`option-${probe.answer}`).click({ force: true })
  await expect(page.getByTestId('pedagogy-panel')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('drill-next')).toBeVisible({ timeout: 10_000 })
  // Graded option rows keep their box (the picked word's slot is a
  // width-holding placeholder), so these stay mode-invariant probes.
  const gradedProbes = [
    '[data-testid="drill-prompt"]',
    '[data-testid="option-A"]',
    '[data-testid="option-B"]',
  ]
  await waitSettled(page, gradedProbes)
  for (const s of gradedProbes) out[`graded/${s}`] = await rectOf(page, s)
  if (animated) await page.screenshot({ path: `${SHOT_DIR}/03-drill-verdict.png`, fullPage: true })

  return out
}

test('A2 motion settles on static layout — animated rects match reduced-motion within 1px', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'settle probe is the desktop drill chassis')
  await clearMistakes(page)
  const probe = await pickOrdProbe(page)

  // Pass A — reduced motion (true static layout).
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const staticRects = await walk(page, probe, false)

  // Reset session state so pass B re-enters the drill fresh at the same qid.
  await clearMistakes(page)

  // Pass B — full motion. Record settled rects + the review screenshots.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const animatedRects = await walk(page, probe, true)

  // Diff every shared probe. Tolerance 1px — the anti-jank contract.
  const drifts: string[] = []
  for (const key of Object.keys(staticRects)) {
    const a = staticRects[key]
    const b = animatedRects[key]
    if (!a || !b) continue // probe absent in one pass — skip (never present-vs-missing here)
    const dx = Math.abs(a.x - b.x)
    const dy = Math.abs(a.y - b.y)
    const dw = Math.abs(a.width - b.width)
    const dh = Math.abs(a.height - b.height)
    const worst = Math.max(dx, dy, dw, dh)
    if (worst > 1) {
      drifts.push(`${key}: Δx=${dx.toFixed(2)} Δy=${dy.toFixed(2)} Δw=${dw.toFixed(2)} Δh=${dh.toFixed(2)}`)
    }
  }
  expect(
    drifts,
    `probes drifted >1px between animated-settled and reduced-static:\n${drifts.join('\n')}`,
  ).toEqual([])
})

// The drag-to-commit gesture (F4 "Greppet"): pull an option strip past
// the detent and release — it commits through the SAME onPick path a
// click takes, and grades. Runs under full motion (drag is disabled under
// reduced motion by design). Captures the armed frame + the verdict.
test('drag-to-commit — pulling an option past the detent grades like a click', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'drag probe is the desktop drill chassis')
  await clearMistakes(page)
  const probe = await pickOrdProbe(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  await page.goto(`/drill?section=ORD&qid=${encodeURIComponent(probe.qid)}`)
  await page.waitForFunction(
    () => {
      const bank = (window as unknown as { __HPC_BANK__?: unknown[] }).__HPC_BANK__
      return Array.isArray(bank) && bank.length > 0
    },
    null,
    { timeout: 20_000 },
  )
  const target = page.getByTestId(`option-${probe.answer}`)
  await expect(target).toBeVisible({ timeout: 15_000 })
  await waitSettled(page, [`[data-testid="option-${probe.answer}"]`])

  const box = await target.boundingBox()
  if (!box) throw new Error('option box not measured')
  const startX = box.x + 60
  const y = box.y + box.height / 2
  // Pull the strip past the 72px detent in steps so the groove/tick +
  // finger-lift shadow materialise (f(drag)) and the row arms.
  await page.mouse.move(startX, y)
  await page.mouse.down()
  for (let dx = 10; dx <= 80; dx += 10) {
    await page.mouse.move(startX + dx, y)
    await page.waitForTimeout(12)
  }
  await page.screenshot({ path: `${SHOT_DIR}/04-drag-armed.png` })
  // Release past the detent → commit with velocity inherited into the
  // verdict morph.
  await page.mouse.up()

  await expect(page.getByTestId('pedagogy-panel')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('drill-next')).toBeVisible({ timeout: 10_000 })
  await waitSettled(page, ['[data-testid="pedagogy-panel"]', '[data-testid="drill-next"]'])
  await page.screenshot({ path: `${SHOT_DIR}/05-drag-verdict.png`, fullPage: true })
})
