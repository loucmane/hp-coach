// Focused probe: leave a repetition session WHILE SCROLLED (the real
// user path: deep in a long explanation, clicks Öva/Hem) and record the
// RAIL numeral's rect+transform per frame on the destination page —
// hunting a flight-from-displaced-snapshot bounce. Also the reverse:
// enter a session from a SCROLLED Öva hub.
//
// Usage: BASE=... node scripts-bounce/exit-scrolled.mjs --label x [--dest ova|home]

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const LABEL = opt('label', 'exit-scrolled')
const DEST = opt('dest', 'ova')
const OUT = path.resolve('scripts-bounce/out', LABEL)
fs.mkdirSync(OUT, { recursive: true })
const API = 'http://localhost:8787'
const BASE = process.env.BASE ?? 'http://localhost:4173'

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
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
  const r = await tokenFetch(page, `${API}/api/test-reset`, { method: 'POST', body: JSON.stringify(payload) })
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
      return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }
    }
    const step = (t) => {
      if (window.__recStop) return
      const station = document.querySelector('[data-testid="due-station-numeral"]')
      const rail = document.querySelector('[data-testid="rail-due"]')
      window.__rec.push({
        t: Math.round(t),
        station: rectOf(station),
        rail: rectOf(rail),
        railTransform: rail ? getComputedStyle(rail).transform : null,
        stTransform: station ? getComputedStyle(station).transform : null,
        scrollY: Math.round(window.scrollY),
        path: location.pathname,
      })
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

const main = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    storageState: 'tests-e2e/.auth/user.json',
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  })
  const page = await context.newPage()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    try {
      localStorage.setItem('hpc-welcomed', '1')
    } catch {}
  })

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
  for (const q of bank) await testReset(page, 'seed', q.qid, 3)

  await page.goto(`${BASE}/ova`)
  await page.waitForSelector('[data-testid="ova-repetition"]', { timeout: 30000 })
  await page.waitForTimeout(1200)
  await page.click('[data-testid="ova-repetition"]')
  await page.waitForSelector('[data-testid="option-A"]', { timeout: 30000 })
  await page.waitForTimeout(1500)

  // Answer q1 correct, scroll DEEP into the explanation, stay graded.
  const qid = new URL(page.url()).searchParams.get('qid') ?? ''
  const correct = answerOf.get(qid)
  await page.click(`[data-testid="option-${correct}"]`)
  await page.mouse.wheel(0, 900)
  await page.waitForSelector('[data-testid="drill-next"]', { timeout: 15000 })
  await page.waitForTimeout(2000)
  const sy = await page.evaluate(() => window.scrollY)
  console.log('scrolled to', sy, '— leaving to', DEST)

  await startRecorder(page)
  await page.evaluate(() => window.__mark('leave'))
  const href = DEST === 'home' ? '/' : '/ova'
  await page.click(`a[href="${href}"]`)
  await page.waitForSelector(
    DEST === 'home' ? '[data-testid="home-greeting"]' : '[data-testid="ova-repetition"]',
    { timeout: 30000 },
  )
  await page.waitForTimeout(2500)

  const rec = await page.evaluate(() => {
    window.__recStop = true
    return window.__rec
  })
  fs.writeFileSync(`${OUT}/frames.jsonl`, rec.map((x) => JSON.stringify(x)).join('\n'))

  // Analysis: rail numeral movement + transforms after arrival.
  let prev = null
  const events = []
  for (const f of rec) {
    if (f.mark) {
      events.push({ kind: 'MARK', mark: f.mark, t: f.t })
      continue
    }
    if (prev) {
      if (!!prev.rail !== !!f.rail) events.push({ kind: f.rail ? 'RAIL-MOUNT' : 'RAIL-UNMOUNT', t: f.t, rect: f.rail ?? prev.rail, transform: f.railTransform })
      else if (prev.rail && f.rail) {
        const d = Math.max(Math.abs(f.rail.x - prev.rail.x), Math.abs(f.rail.y - prev.rail.y))
        if (d > 0.5) events.push({ kind: 'RAIL-JUMP', t: f.t, d: +d.toFixed(1), from: prev.rail, to: f.rail, transform: f.railTransform })
      }
      if (!!prev.station !== !!f.station) events.push({ kind: f.station ? 'ST-MOUNT' : 'ST-UNMOUNT', t: f.t })
    }
    prev = f
  }
  console.log(`=== ${LABEL}: ${rec.length} frames ===`)
  for (const e of events) console.log(JSON.stringify(e))
  const txs = [...new Set(rec.filter((f) => !f.mark && f.railTransform).map((f) => f.railTransform))]
  console.log('rail transforms seen:', txs.slice(0, 12))

  await context.close()
  await browser.close()
  console.log('video:', fs.readdirSync(OUT).filter((f) => f.endsWith('.webm')).map((v) => path.join(OUT, v)).join(','))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
