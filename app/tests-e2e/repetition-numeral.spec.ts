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

  // FULL MOTION — the config's global reducedMotion:'reduce' disables the
  // layoutId projection and collapses every spring to 0, a world where the
  // bounce class this spec exists for CANNOT occur (that is exactly how
  // three shipped "fixes" passed verification while the owner kept seeing
  // the bounce). Stillness must be proven with the animations ON.
  await page.emulateMedia({ reducedMotion: 'no-preference' })

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

// The 2026-07-14 root-cause regression pack (post-#286 findings):
//
//   1. COLUMN GEOMETRY — the station belongs to the reading column's
//      top-right (M3 "Boksidan"), not the viewport edge (#286 glued it
//      to the viewport; owner: "offset way to the right").
//   2. SCROLLED STILLNESS UNDER THROTTLED REFETCH — the pile refetch
//      after a correct answer lands while the reader is scrolled deep in
//      the explanation on a slow network. The numeral must roll its
//      VALUE in place: zero positional movement, zero unmount/remount
//      (an unmount would teleport/fly the numeral — the bounce class).
//      Verified with a per-animation-frame in-page recorder, full motion.
//   3. NO DETACHED GHOST — leaving the session across a scene-family
//      boundary (drill/repetition → Hem) clones the old page as exit
//      ink; the station must ride INSIDE that clone (old-page pixels),
//      never float detached over the incoming page, and must be gone
//      when the crossfade ends.
test('due station: column-aligned, still through throttled refetch, no detached ghost', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the header numeral station is a desktop surface')
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })

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
    const out: Array<{ qid: string; section: string; parsing_status: string; answer: string; options?: unknown[] | null }> = []
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
  const answerOf = new Map(ords.map((q) => [q.qid, q.answer.toUpperCase()]))

  await clearMistakes(page)
  for (const q of ords) await seedMistake(page, q.qid, 3)

  await page.goto('/ova')
  await page.getByTestId('ova-repetition').click()
  await expect(page.getByTestId('option-A')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('due-station-numeral')).toBeVisible({ timeout: 10_000 })

  // ── 1. Column geometry: station right edge sits 24px inside the 880px
  //       reading column (the .hpc-studydesk frame), NOT at the viewport
  //       edge. Tolerance 1.5px.
  const geo = await page.evaluate(() => {
    const st = document.querySelector('[data-testid="due-station"]')?.getBoundingClientRect()
    const col = document.querySelector('.hpc-studydesk')?.getBoundingClientRect()
    return st && col
      ? { stRight: st.right, colRight: col.right, viewport: window.innerWidth }
      : null
  })
  if (!geo) throw new Error('station or column frame missing')
  expect(
    Math.abs(geo.stRight - (geo.colRight - 24)),
    `station right ${geo.stRight} vs column right-inset ${geo.colRight - 24}`,
  ).toBeLessThanOrEqual(1.5)
  // And demonstrably NOT viewport-glued (the #286 regression put it
  // within ~50px of the right viewport edge).
  expect(geo.viewport - geo.stRight).toBeGreaterThan(100)

  // ── 2. Scrolled stillness under a throttled refetch ───────────────
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 400,
    downloadThroughput: (1.5 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  })

  // Per-animation-frame recorder on the numeral: rect + presence.
  await page.evaluate(() => {
    const w = window as unknown as {
      __rec: Array<{ x: number; y: number } | null>
      __recStop: boolean
    }
    w.__rec = []
    w.__recStop = false
    const step = () => {
      if (w.__recStop) return
      const el = document.querySelector('[data-testid="due-station-numeral"]')
      if (el) {
        const b = el.getBoundingClientRect()
        w.__rec.push({ x: +b.x.toFixed(1), y: +b.y.toFixed(1) })
      } else {
        w.__rec.push(null)
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })

  const qid1 = new URL(page.url()).searchParams.get('qid') ?? ''
  const correct1 = answerOf.get(qid1)
  expect(correct1, `answer for ${qid1}`).toBeTruthy()
  await page.getByTestId(`option-${correct1}`).click()
  // Reader scrolls into the explanation while the (throttled) pile
  // refetch is still in flight — the roll lands scrolled.
  await page.mouse.wheel(0, 600)
  // Wait out the throttled resolve → invalidate → refetch → roll.
  await expect(page.getByTestId('due-station-numeral')).toHaveText('2', { timeout: 15_000 })
  await page.waitForTimeout(1200) // let any (illegal) spring play out

  const rec = await page.evaluate(() => {
    const w = window as unknown as {
      __rec: Array<{ x: number; y: number } | null>
      __recStop: boolean
    }
    w.__recStop = true
    return w.__rec
  })
  expect(rec.length).toBeGreaterThan(30)
  const gaps = rec.filter((f) => f === null).length
  expect(gaps, 'numeral unmounted mid-refetch (would teleport/fly the numeral)').toBe(0)
  const xs = new Set(rec.map((f) => f && f.x))
  const ys = new Set(rec.map((f) => f && f.y))
  const spanOf = (s: Set<number | null>) => {
    const v = [...s].filter((n): n is number => n != null)
    return Math.max(...v) - Math.min(...v)
  }
  expect(spanOf(xs), 'numeral x drifted across the roll').toBeLessThanOrEqual(1)
  expect(spanOf(ys), 'numeral y drifted across the roll').toBeLessThanOrEqual(1)

  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  })

  // ── 3. No detached ghost on a cross-family exit ────────────────────
  // Leave to Hem (family ova→home): during the crossfade any visible
  // "att repetera" must live INSIDE the exiting clone ([data-exiting]);
  // after it, none at all.
  await page.locator('a[href="/"]').first().click()
  await expect(page.getByTestId('home-greeting')).toBeVisible({ timeout: 30_000 })
  const detached = await page.evaluate(() => {
    // A ghost is DETACHED when it is visible and either lives outside the
    // exiting clone entirely, or is re-pinned to the viewport by a
    // position:fixed ancestor INSIDE the clone (the #286 failure: the
    // clone kept the fixed station, DOM-inside but visually floating over
    // the incoming page — a DOM-only closest() check misses it).
    let found = 0
    for (const el of document.querySelectorAll('span')) {
      if (el.textContent !== 'att repetera') continue
      const b = el.getBoundingClientRect()
      if (b.width === 0 || getComputedStyle(el).visibility === 'hidden') continue
      const clone = el.closest('[data-exiting]')
      if (!clone) {
        found++
        continue
      }
      let n: HTMLElement | null = el as HTMLElement
      while (n && n !== clone) {
        const cs = getComputedStyle(n)
        if (cs.position === 'fixed' || cs.visibility === 'hidden') break
        n = n.parentElement
      }
      if (n && n !== clone && getComputedStyle(n).position === 'fixed') found++
    }
    return found
  })
  expect(detached, 'a due-station ghost floats detached over Home during the exit').toBe(0)
  await page.waitForTimeout(1500)
  await expect(page.locator('[data-exiting]')).toHaveCount(0)
  const lingering = await page.evaluate(() => {
    let found = 0
    for (const el of document.querySelectorAll('span')) {
      if (el.textContent === 'att repetera' && el.getBoundingClientRect().width > 0) found++
    }
    return found
  })
  expect(lingering, 'due-station ink lingers on Home after the crossfade').toBe(0)
})

// The 2026-07-14 INTRA-station regression pack (the owner's remaining
// report: "the number still gets bumped by the 'att repetera' when you
// answer … and when you press next as well"). Two contracts, proven at
// ELEMENT granularity with full motion on a throttled network:
//
//   1. STATIC-COUNT STILLNESS — through a WRONG grade (count unchanged
//      in repetition) and a Nästa advance, the digit glyphs, the numeral
//      wrapper, the "att repetera" label, and the station strip must
//      each hold their absolute rect ≤0.5px AND the digit-vs-label
//      relative offset must hold ≤0.5px. Per-animation-frame recorder;
//      no glyph may re-animate (transform must stay identity).
//
//   2. ROLL COHERENCE — when the count DOES change, the exiting and
//      entering glyphs must travel the SAME direction. The shipped bug:
//      `exit` was a literal object, so AnimatePresence never re-resolved
//      it with the fresh `custom` dir — every static re-render (each
//      pile refetch) reset the captured dir to +1, and the next decrease
//      criss-crossed: the new digit fell from above while the old flew
//      up THROUGH it, a mid-cell collision the owner read as a bump.
//      Under real-world latency the refetch (and thus the collision)
//      landed right after answering or right after pressing Nästa —
//      both reported triggers, one mechanism. Fixed by making the
//      enter/exit variants (DigitRoll fix 6).
test('due station: intra-station stillness on static count, coherent roll on change', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the header numeral station is a desktop surface')
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  type BankQ = { qid: string; answer: string }
  const ords = (await page.evaluate(async () => {
    const idx = (await (await fetch('/data/_index.json')).json()) as {
      exams: { exam_id: string }[]
    }
    const out: Array<{ qid: string; answer: string }> = []
    for (const e of idx.exams) {
      const rows = (await (await fetch(`/data/${e.exam_id}.json`)).json()) as Array<{
        qid: string
        section: string
        parsing_status: string
        options?: unknown[] | null
        answer: string
      }>
      for (const q of rows) {
        if (q.section === 'ORD' && q.parsing_status === 'complete' && q.options && q.answer) {
          out.push({ qid: q.qid, answer: q.answer })
          if (out.length >= 3) return out
        }
      }
    }
    return out
  })) as BankQ[]
  expect(ords.length).toBe(3)
  const answerOf = new Map(ords.map((q) => [q.qid, q.answer.toUpperCase()]))

  await clearMistakes(page)
  for (const q of ords) await seedMistake(page, q.qid, 3)

  await page.goto('/ova')
  await page.getByTestId('ova-repetition').click()
  await expect(page.getByTestId('option-A')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('due-station-numeral')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(1200) // let the entry flight settle

  // Real-world latency: the pile refetch lands well after the grade —
  // in the field it is exactly this delay that parked the (broken) roll
  // on the answer or the Nästa press.
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 400,
    downloadThroughput: (1.5 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  })

  type Frame = {
    station: { x: number; y: number } | null
    numeral: { x: number; y: number } | null
    label: { x: number; y: number } | null
    glyphs: Array<{ text: string | null; ty: number }>
  }
  const startRecorder = () =>
    page.evaluate(() => {
      const w = window as unknown as { __rec: unknown[]; __recStop: boolean }
      w.__rec = []
      w.__recStop = false
      const pos = (el: Element | null) => {
        if (!el) return null
        const b = el.getBoundingClientRect()
        return { x: +b.x.toFixed(2), y: +b.y.toFixed(2) }
      }
      const step = () => {
        if (w.__recStop) return
        const station = document.querySelector('[data-testid="due-station"]')
        const numeral = document.querySelector('[data-testid="due-station-numeral"]')
        let label: Element | null = null
        if (station)
          for (const s of station.querySelectorAll('span'))
            if (s.textContent === 'att repetera') label = s
        const glyphs: Array<{ text: string | null; ty: number }> = []
        if (numeral)
          for (const slot of numeral.querySelectorAll(':scope > span > span'))
            for (const g of slot.querySelectorAll(':scope > span')) {
              const m = getComputedStyle(g).transform
              const ty = m.startsWith('matrix(') ? +(m.slice(7, -1).split(',')[5] ?? 0) : 0
              glyphs.push({ text: g.textContent, ty: +ty.toFixed(2) })
            }
        w.__rec.push({ station: pos(station), numeral: pos(numeral), label: pos(label), glyphs })
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  const stopRecorder = () =>
    page.evaluate(() => {
      const w = window as unknown as { __rec: Frame[]; __recStop: boolean }
      w.__recStop = true
      return w.__rec
    }) as Promise<Frame[]>

  const spanOf = (vals: number[]) => (vals.length ? Math.max(...vals) - Math.min(...vals) : 0)
  const assertStill = (rec: Frame[], phase: string) => {
    expect(rec.length, `${phase}: recorder captured frames`).toBeGreaterThan(20)
    for (const key of ['station', 'numeral', 'label'] as const) {
      const pts = rec.map((f) => f[key])
      expect(
        pts.filter((p) => p === null).length,
        `${phase}: ${key} unmounted mid-window`,
      ).toBe(0)
      const defined = pts.filter((p): p is { x: number; y: number } => p !== null)
      expect(spanOf(defined.map((p) => p.x)), `${phase}: ${key} x drifted`).toBeLessThanOrEqual(0.5)
      expect(spanOf(defined.map((p) => p.y)), `${phase}: ${key} y drifted`).toBeLessThanOrEqual(0.5)
    }
    // The owner's observable: the digits relative to the label.
    const rel = rec
      .filter((f) => f.numeral && f.label)
      .map((f) => ({
        x: (f.numeral as { x: number }).x - (f.label as { x: number }).x,
        y: (f.numeral as { y: number }).y - (f.label as { y: number }).y,
      }))
    expect(spanOf(rel.map((r) => r.x)), `${phase}: digit-vs-label x offset shifted`).toBeLessThanOrEqual(0.5)
    expect(spanOf(rel.map((r) => r.y)), `${phase}: digit-vs-label y offset shifted`).toBeLessThanOrEqual(0.5)
    // No glyph may re-animate on a static count.
    for (const f of rec)
      for (const g of f.glyphs)
        expect(Math.abs(g.ty), `${phase}: glyph "${g.text}" re-animated (y=${g.ty})`).toBeLessThanOrEqual(0.5)
  }

  // ── 1a. WRONG grade: count static, everything dead still ───────────
  const qid1 = new URL(page.url()).searchParams.get('qid') ?? ''
  const correct1 = answerOf.get(qid1)
  expect(correct1, `answer for ${qid1}`).toBeTruthy()
  let wrong = ''
  for (const l of ['A', 'B', 'C', 'D', 'E']) {
    if (l === correct1) continue
    if (await page.getByTestId(`option-${l}`).count()) {
      wrong = l
      break
    }
  }
  await startRecorder()
  await page.getByTestId(`option-${wrong}`).click()
  await expect(page.getByTestId('drill-next')).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(2000) // let the throttled refetch land inside the window
  assertStill(await stopRecorder(), 'wrong grade')
  await expect(page.getByTestId('due-station-numeral')).toHaveText('3')
  await page.screenshot({ path: `${SHOTS}/05-intra-wrong-still.png` })

  // ── 1b. Nästa advance: count static, everything dead still ─────────
  await startRecorder()
  await page.getByTestId('drill-next').click()
  await expect(page.getByTestId('option-A')).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(1500)
  assertStill(await stopRecorder(), 'nästa advance')
  await expect(page.getByTestId('due-station-numeral')).toHaveText('3')
  await page.screenshot({ path: `${SHOTS}/06-intra-nasta-still.png` })

  // ── 2. CORRECT grade: count 3 → 2 must roll COHERENTLY ─────────────
  const qid2 = new URL(page.url()).searchParams.get('qid') ?? ''
  const correct2 = answerOf.get(qid2)
  expect(correct2, `answer for ${qid2}`).toBeTruthy()
  await startRecorder()
  await page.getByTestId(`option-${correct2}`).click()
  await expect(page.getByTestId('due-station-numeral')).toHaveText('2', { timeout: 15_000 })
  await page.waitForTimeout(1200) // let the roll finish inside the window
  const roll = await stopRecorder()
  // Wrapper + label stay pinned even while the digits roll.
  for (const key of ['numeral', 'label'] as const) {
    const pts = roll
      .map((f) => f[key])
      .filter((p): p is { x: number; y: number } => p !== null)
    expect(spanOf(pts.map((p) => p.x)), `roll: ${key} x drifted`).toBeLessThanOrEqual(0.5)
    expect(spanOf(pts.map((p) => p.y)), `roll: ${key} y drifted`).toBeLessThanOrEqual(0.5)
  }
  // Coherence: on this DECREASE the exiting "3" must travel DOWN and
  // ONLY down (the stale-dir bug sent it UP through the incoming "2").
  const exitYs = roll
    .flatMap((f) => f.glyphs)
    .filter((g) => g.text === '3')
    .map((g) => g.ty)
  const enterYs = roll
    .flatMap((f) => f.glyphs)
    .filter((g) => g.text === '2')
    .map((g) => g.ty)
  expect(Math.min(...exitYs), 'exiting digit moved UP on a decrease (criss-cross)').toBeGreaterThanOrEqual(-0.5)
  expect(Math.max(...exitYs), 'exiting digit never left downward').toBeGreaterThan(5)
  expect(Math.min(...enterYs), 'entering digit rolled in from above').toBeLessThan(-5)
  expect(Math.max(...enterYs), 'entering digit overshot below its seat').toBeLessThanOrEqual(0.5)
  await page.screenshot({ path: `${SHOTS}/07-intra-roll-coherent.png` })
})
