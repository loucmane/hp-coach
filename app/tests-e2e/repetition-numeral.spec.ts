// E2E + frame-capture verification for the Repetition-surface fixes
// (owner 2026-07-13). Runs authenticated against the branch worker.
//
//   Fix A — pile numeral semantics: a CORRECT repetition (older miss)
//           drops the "att repetera" numeral by 1; a WRONG repetition
//           leaves it dead static.
//   Fix B — numeral stillness: the header numeral's position does NOT
//           bounce across a grade or a "Nästa" advance (rect delta ≈ 0);
//           only its VALUE rolls, and only when the count actually changes.
//   Fix D — no "mogna/mogen" anywhere on the surface.
//
// The screenshots are written to ../screenshots-repetition/ for the human
// pass.

import { clearMistakes, expect, seedMistake, test } from './fixtures'

const SHOTS = '../screenshots-repetition'

type Box = { x: number; y: number; w: number; h: number }

async function numeral(page: import('@playwright/test').Page): Promise<{ text: string; box: Box }> {
  const el = page.getByTestId('due-station-numeral')
  await expect(el).toBeVisible({ timeout: 10_000 })
  const text = (await el.textContent())?.trim() ?? ''
  const bb = await el.boundingBox()
  if (!bb) throw new Error('numeral has no bounding box')
  return { text, box: { x: bb.x, y: bb.y, w: bb.width, h: bb.height } }
}

/** Position delta between two numeral captures — the bounce metric. */
function posDelta(a: Box, b: Box): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}

test('repetition numeral: correct → −1, wrong → static, no positional bounce', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the header numeral station is a desktop surface')

  // A known-good set of drillable ORD questions, resolved from the live
  // static corpus (same /data/* files loadBank reads) so we know each
  // correct answer.
  type BankQ = {
    qid: string
    section: string
    parsing_status: string
    options?: { letter: string }[] | null
    answer: string
  }
  const ords = (await page.evaluate(async () => {
    const idx = (await (await fetch('/data/_index.json')).json()) as {
      exams: { exam_id: string }[]
    }
    const out: Array<{
      qid: string
      section: string
      parsing_status: string
      options?: { letter: string }[] | null
      answer: string
    }> = []
    for (const e of idx.exams) {
      const rows = (await (await fetch(`/data/${e.exam_id}.json`)).json()) as typeof out
      for (const q of rows) {
        if (q.section === 'ORD' && q.parsing_status === 'complete' && q.options && q.answer) {
          out.push(q)
          if (out.length >= 3) return out
        }
      }
    }
    return out
  })) as BankQ[]
  expect(ords.length).toBe(3)
  const answerOf = new Map(ords.map((q) => [q.qid, q.answer.toUpperCase()]))

  await clearMistakes(page)
  // Seed three OLDER misses (last errored 3 days ago): due now, but NOT
  // touched today — so a correct answer reschedules them OUT of today's pile.
  for (const q of ords) await seedMistake(page, q.qid, 3)

  // Fix C path exercised too: the repetera lane is the door.
  await page.goto('/ova')
  await page.getByTestId('ova-repetition').click()
  await expect(page.getByTestId('option-A')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('drill-idle')).toHaveCount(0)

  // ── Frame 0: session start, pile = 3 ──────────────────────────────
  const f0 = await numeral(page)
  expect(f0.text).toBe('3')
  await page.screenshot({ path: `${SHOTS}/01-start-3.png` })

  // ── Answer item 1 CORRECTLY → pile rolls 3 → 2, position still ────
  const qid1 = new URL(page.url()).searchParams.get('qid') ?? ''
  const correct1 = answerOf.get(qid1)
  expect(correct1, `answer for ${qid1}`).toBeTruthy()
  await page.getByTestId(`option-${correct1}`).click()
  // Wait for the resolve → pile invalidation → refetch to land.
  await expect(page.getByTestId('due-station-numeral')).toHaveText('2', { timeout: 10_000 })
  const f1 = await numeral(page)
  expect(f1.text).toBe('2')
  // The numeral ROLLED (value) but did not MOVE (position) — Fix B.
  expect(posDelta(f0.box, f1.box)).toBeLessThan(1.5)
  await page.screenshot({ path: `${SHOTS}/02-correct-rolled-to-2.png` })

  // ── "Nästa" advance: count UNCHANGED, position dead still ─────────
  await page.getByTestId('drill-next').click()
  await expect(page.getByTestId('option-A')).toBeVisible({ timeout: 15_000 })
  const f2 = await numeral(page)
  expect(f2.text).toBe('2') // no change across a plain advance
  expect(posDelta(f1.box, f2.box)).toBeLessThan(1.5)
  await page.screenshot({ path: `${SHOTS}/03-nasta-still-2.png` })

  // ── Answer item 2 WRONG → pile stays 2 (static), position still ───
  const qid2 = new URL(page.url()).searchParams.get('qid') ?? ''
  const correct2 = answerOf.get(qid2)
  // Pick a concrete wrong option that is actually present.
  let picked = ''
  for (const l of ['A', 'B', 'C', 'D', 'E']) {
    if (l === correct2) continue
    if (await page.getByTestId(`option-${l}`).count()) {
      picked = l
      break
    }
  }
  expect(picked, `a wrong option for ${qid2}`).toBeTruthy()
  await page.getByTestId(`option-${picked}`).click()
  // Give the (no-op for the count) record-mistake mutation time to settle.
  await page.waitForTimeout(1500)
  const f3 = await numeral(page)
  expect(f3.text).toBe('2') // WRONG repetition must NOT change the count
  expect(posDelta(f2.box, f3.box)).toBeLessThan(1.5)
  await page.screenshot({ path: `${SHOTS}/04-wrong-static-2.png` })

  // ── Fix D: no "mogna/mogen" anywhere on this surface ──────────────
  await expect(page.getByText(/mogn/i)).toHaveCount(0)
})
