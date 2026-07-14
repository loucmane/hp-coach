// Phase-1 ELEMENT-granularity reproduction harness for the intra-station
// bump: "the number gets bumped by the 'att repetera' when you answer /
// press Nästa, even when the count is static". Prior probes measured the
// numeral wrapper and the station strip; the owner's eye sees the DIGITS
// move relative to the LABEL. So this recorder tracks, per animation
// frame, FOUR things independently:
//   - the station strip rect        [data-testid="due-station"]
//   - the numeral wrapper rect      [data-testid="due-station-numeral"]
//   - the innermost digit GLYPH(s)  (motion.span inside DigitRoll slots)
//   - the "att repetera" label span
// plus each element's computed transform and the numeral-vs-label
// relative offset. Marks are pushed at every user action so frames can
// be attributed to grade / Nästa / scroll.
//
// Usage:
//   node scripts-bounce/element.mjs [--throttle] [--world repetition|drill]
//                                   [--scroll 600] [--label name]

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const THROTTLE = args.includes('--throttle')
const FAST = args.includes('--fast') // owner-speed: no settle waits — Nästa during the verdict morph, answer during the pan
const WORLD = opt('world', 'repetition')
const SCROLL = Number(opt('scroll', '600'))
const LABEL = opt(
  'label',
  `el-${WORLD}${THROTTLE ? '-throttled' : ''}${SCROLL ? `-scroll${SCROLL}` : ''}`,
)
const OUT = path.resolve('scripts-bounce/out', LABEL)
fs.mkdirSync(OUT, { recursive: true })

const API = 'http://localhost:8787'
const BASE = 'http://localhost:4173'
const STORAGE = 'tests-e2e/.auth/user.json'

async function tokenFetch(page, url, init) {
  return await page.evaluate(
    async ({ url, init }) => {
      const deadline = Date.now() + 15000
      let token = null
      while (Date.now() < deadline) {
        const c = window.Clerk
        if (c?.loaded && c.session) {
          token = (await c.session.getToken()) ?? null
          if (token) break
        }
        await new Promise((r) => setTimeout(r, 100))
      }
      if (!token) return { ok: false, status: 0, body: 'no token' }
      const res = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(init?.headers ?? {}),
        },
      })
      return { ok: res.ok, status: res.status, body: await res.text() }
    },
    { url, init },
  )
}

async function testReset(page, action, questionId, lastErrorDaysAgo) {
  const payload = { action }
  if (questionId) payload.questionId = questionId
  if (lastErrorDaysAgo != null) payload.lastErrorDaysAgo = lastErrorDaysAgo
  const r = await tokenFetch(page, `${API}/api/test-reset`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`test-reset ${action} failed: ${r.status} ${r.body}`)
}

async function startRecorder(page) {
  await page.evaluate(() => {
    window.__rec = []
    window.__recStop = false
    window.__mark = (m) => window.__rec.push({ mark: m, t: Math.round(performance.now()) })
    const rectOf = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) }
    }
    const step = (t) => {
      if (window.__recStop) return
      const station = document.querySelector('[data-testid="due-station"]')
      const numeral = document.querySelector('[data-testid="due-station-numeral"]')
      // The innermost digit glyphs: DigitRoll renders slot spans each
      // holding motion glyph span(s). Grab every leaf span under numeral.
      const glyphs = []
      if (numeral) {
        for (const slot of numeral.querySelectorAll(':scope > span > span')) {
          for (const g of slot.querySelectorAll(':scope > span')) {
            glyphs.push({
              text: g.textContent,
              rect: rectOf(g),
              transform: getComputedStyle(g).transform,
              opacity: getComputedStyle(g).opacity,
            })
          }
        }
      }
      let label = null
      if (station) {
        for (const s of station.querySelectorAll('span')) {
          if (s.textContent === 'att repetera') label = s
        }
      }
      window.__rec.push({
        t: Math.round(t),
        station: rectOf(station),
        numeral: rectOf(numeral),
        numText: numeral ? numeral.textContent : null,
        numTransform: numeral ? getComputedStyle(numeral).transform : null,
        glyphs,
        label: rectOf(label),
        scrollY: Math.round(window.scrollY),
      })
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

function fmtRect(r) {
  return r ? `${r.x},${r.y}` : 'null'
}

function analyze(rec, label) {
  const events = []
  let prev = null
  const track = (name, a, b, f, extra) => {
    if (!!a !== !!b) {
      events.push({ kind: `${name}-${b ? 'MOUNT' : 'UNMOUNT'}`, t: f.t, ...extra })
      return
    }
    if (a && b) {
      const dx = b.x - a.x
      const dy = b.y - a.y
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        events.push({
          kind: `${name}-JUMP`,
          t: f.t,
          dx: +dx.toFixed(2),
          dy: +dy.toFixed(2),
          from: fmtRect(a),
          to: fmtRect(b),
          ...extra,
        })
      }
    }
  }
  for (const f of rec) {
    if (f.mark) {
      events.push({ kind: 'MARK', mark: f.mark, t: f.t })
      continue
    }
    if (prev) {
      const extra = {
        scrollY: f.scrollY,
        dScroll: f.scrollY - prev.scrollY,
        numText: f.numText,
        numTransform: f.numTransform,
      }
      track('STATION', prev.station, f.station, f, extra)
      track('NUMERAL', prev.numeral, f.numeral, f, extra)
      track('LABEL', prev.label, f.label, f, extra)
      // glyph 0 (leftmost live glyph)
      const g0 = f.glyphs[0]
      const p0 = prev.glyphs[0]
      track('GLYPH0', p0?.rect, g0?.rect, f, {
        ...extra,
        glyphText: g0?.text,
        glyphTransform: g0?.transform,
        nGlyphs: f.glyphs.length,
      })
      // RELATIVE offset numeral-vs-label (the owner's actual observable)
      if (f.numeral && f.label && prev.numeral && prev.label) {
        const rel = { x: f.numeral.x - f.label.x, y: f.numeral.y - f.label.y }
        const prel = { x: prev.numeral.x - prev.label.x, y: prev.numeral.y - prev.label.y }
        const ddx = rel.x - prel.x
        const ddy = rel.y - prel.y
        if (Math.abs(ddx) > 0.5 || Math.abs(ddy) > 0.5) {
          events.push({ kind: 'REL-SHIFT', t: f.t, ddx: +ddx.toFixed(2), ddy: +ddy.toFixed(2), ...extra })
        }
      }
      // glyph count change (a roll or a spurious re-animation)
      if (f.glyphs.length !== prev.glyphs.length) {
        events.push({
          kind: 'GLYPH-COUNT',
          t: f.t,
          from: prev.glyphs.length,
          to: f.glyphs.length,
          texts: f.glyphs.map((g) => g.text).join('|'),
          transforms: f.glyphs.map((g) => g.transform).join(' ; '),
          ...extra,
        })
      } else {
        // same glyph count: did any glyph transform change (re-animation)?
        for (let i = 0; i < f.glyphs.length; i++) {
          if (f.glyphs[i].transform !== prev.glyphs[i].transform) {
            events.push({
              kind: 'GLYPH-TRANSFORM',
              t: f.t,
              i,
              text: f.glyphs[i].text,
              from: prev.glyphs[i].transform,
              to: f.glyphs[i].transform,
              ...extra,
            })
          }
        }
      }
    }
    prev = f
  }
  console.log(`\n=== ${label}: ${rec.length} frames, ${events.length} events ===`)
  for (const e of events.slice(0, 400)) console.log(JSON.stringify(e))
  return events
}

const main = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    storageState: STORAGE,
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    try {
      localStorage.setItem('hpc-welcomed', '1')
    } catch {}
  })
  if (THROTTLE) {
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 400,
      downloadThroughput: (1.5 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    })
  }

  await page.goto(`${BASE}/`)
  await page.waitForSelector('[data-testid="home-greeting"]', { timeout: 30000 })

  const bank = await page.evaluate(async () => {
    const idx = await (await fetch('/data/_index.json')).json()
    const out = []
    for (const e of idx.exams) {
      const rows = await (await fetch(`/data/${e.exam_id}.json`)).json()
      for (const q of rows) {
        if (q.section === 'ORD' && q.parsing_status === 'complete' && q.options && q.answer) {
          out.push({ qid: q.qid, answer: q.answer.toUpperCase() })
          if (out.length >= 12) return out
        }
      }
    }
    return out
  })
  const answerOf = new Map(bank.map((q) => [q.qid, q.answer]))

  await testReset(page, 'clear')
  // Seed 6 older misses so the station is alive with count 6.
  for (const q of bank.slice(0, 6)) await testReset(page, 'seed', q.qid, 3)

  if (WORLD === 'repetition') {
    await page.goto(`${BASE}/ova`)
    await page.waitForSelector('[data-testid="ova-repetition"]', { timeout: 30000 })
    await page.click('[data-testid="ova-repetition"]')
  } else {
    await page.goto(`${BASE}/ova`)
    await page.waitForSelector('[data-testid="ova-section-ORD"]', { timeout: 30000 })
    await page.click('[data-testid="ova-section-ORD"]')
  }
  await page.waitForSelector('[data-testid="option-A"]', { timeout: 30000 })
  await page.waitForSelector('[data-testid="due-station-numeral"]', { timeout: 15000 })
  await page.waitForTimeout(1500) // let entry flight settle

  await startRecorder(page)

  const answerFor = async () => {
    const qid = new URL(page.url()).searchParams.get('qid') ?? ''
    let a = answerOf.get(qid)
    if (!a) {
      a = await page.evaluate(async (qid) => {
        const idx = await (await fetch('/data/_index.json')).json()
        for (const e of idx.exams) {
          const rows = await (await fetch(`/data/${e.exam_id}.json`)).json()
          const q = rows.find((r) => r.qid === qid)
          if (q) return q.answer.toUpperCase()
        }
        return null
      }, qid)
    }
    return a
  }

  // Scenario matrix within one session:
  //  q1: WRONG (repetition: count static; drill: count may change) no scroll
  //  q2: WRONG, scrolled before Nästa
  //  q3: CORRECT (repetition: count -1) no scroll
  //  q4: CORRECT, scrolled
  const modes = ['wrong', 'wrong', 'correct', 'correct']
  for (let i = 0; i < modes.length; i++) {
    const correct = await answerFor()
    if (!correct) throw new Error('no answer resolved')
    let pick = correct
    if (modes[i] === 'wrong') {
      for (const l of ['A', 'B', 'C', 'D', 'E']) {
        if (l !== correct && (await page.locator(`[data-testid="option-${l}"]`).count())) {
          pick = l
          break
        }
      }
    }
    await page.evaluate((m) => window.__mark(m), `grade-${i + 1}-${modes[i]}`)
    await page.click(`[data-testid="option-${pick}"]`)
    await page.waitForSelector('[data-testid="drill-next"]', { timeout: 15000 })
    if (SCROLL && i % 2 === 1) {
      await page.evaluate((m) => window.__mark(m), `scroll-${i + 1}`)
      await page.mouse.wheel(0, SCROLL)
    }
    if (!FAST) {
      await page.waitForTimeout(2500)
      await page.screenshot({ path: `${OUT}/q${i + 1}-${modes[i]}-graded.png` })
    }
    await page.evaluate((m) => window.__mark(m), `nasta-${i + 1}`)
    await page.click('[data-testid="drill-next"]')
    await page.waitForSelector('[data-testid="option-A"]', { timeout: 15000 })
    if (!FAST) await page.waitForTimeout(2000)
  }

  const rec = await page.evaluate(() => {
    window.__recStop = true
    return window.__rec
  })
  fs.writeFileSync(`${OUT}/frames.jsonl`, rec.map((x) => JSON.stringify(x)).join('\n'))
  const events = analyze(rec, LABEL)
  fs.writeFileSync(`${OUT}/events.json`, JSON.stringify(events, null, 2))
  await page.screenshot({ path: `${OUT}/final.png` })
  await browser.close()
  console.log(`\nwrote ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
