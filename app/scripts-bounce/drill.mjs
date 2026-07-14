// Phase-1 drill-world capture: Öva hub → ORD drill door (a REAL scene
// crossfade: family ova→drill), starting with an EMPTY pile — the
// station is absent until the first WRONG answer mounts it mid-session
// (count 0→1), then more wrong answers roll it up, then leave to Home
// (family drill→home crossfade → ghost window). Full motion, authed.
//
// Usage: BASE=http://localhost:5198 node scripts-bounce/drill.mjs [--label x] [--seed N]

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const LABEL = opt('label', 'drill-run')
const SEED = Number(opt('seed', '0'))
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
      return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }
    }
    const step = (t) => {
      if (window.__recStop) return
      const station = document.querySelector('[data-testid="due-station-numeral"]')
      let ghost = null
      for (const el of document.querySelectorAll('span')) {
        if (el.textContent === 'att repetera' && !el.closest('[data-testid="due-station"]')) {
          const b = el.getBoundingClientRect()
          if (b.width > 0) ghost = { x: +b.x.toFixed(1), y: +b.y.toFixed(1), exiting: !!el.closest('[data-exiting]') }
        }
      }
      window.__rec.push({
        t: Math.round(t),
        station: rectOf(station),
        sttext: station ? station.textContent : null,
        numTransform: station ? getComputedStyle(station).transform : null,
        ghost,
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
  for (const q of bank.slice(0, SEED)) await testReset(page, 'seed', q.qid, 3)

  // ── Öva hub → ORD drill door (family crossfade ova→drill) ────────
  await page.goto(`${BASE}/ova`)
  await page.waitForSelector('[data-testid="ova-section-ORD"]', { timeout: 30000 })
  await page.waitForTimeout(1500)
  await startRecorder(page)
  await page.evaluate(() => window.__mark('click-ord-door'))
  await page.click('[data-testid="ova-section-ORD"]')
  await page.waitForSelector('[data-testid="option-A"]', { timeout: 30000 })
  await page.waitForTimeout(2000)

  // ── Q1: WRONG (count 0→1 with SEED=0: station mounts mid-session) ─
  // ── Q2: WRONG (count →2, rolls) · Q3: CORRECT (drill: count static) ─
  const modes = ['wrong', 'wrong', 'correct']
  for (let i = 0; i < modes.length; i++) {
    const qid = new URL(page.url()).searchParams.get('qid') ?? ''
    const correct = answerOf.get(qid) ?? (await page.evaluate(async (qid) => {
      const idx = await (await fetch('/data/_index.json')).json()
      for (const e of idx.exams) {
        const rows = await (await fetch(`/data/${e.exam_id}.json`)).json()
        const q = rows.find((r) => r.qid === qid)
        if (q) return q.answer.toUpperCase()
      }
      return null
    }, qid))
    if (!correct) throw new Error(`no answer for ${qid}`)
    let pick = correct
    if (modes[i] === 'wrong') {
      for (const l of ['A', 'B', 'C', 'D', 'E']) {
        if (l !== correct && (await page.locator(`[data-testid="option-${l}"]`).count())) {
          pick = l
          break
        }
      }
    }
    await page.evaluate((m) => window.__mark(m), `answer-${i + 1}-${modes[i]}`)
    await page.click(`[data-testid="option-${pick}"]`)
    await page.mouse.wheel(0, 600)
    await page.waitForSelector('[data-testid="drill-next"]', { timeout: 15000 })
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${OUT}/q${i + 1}-${modes[i]}.png` })
    await page.evaluate((n) => window.__mark(`nasta-${n}`), i + 1)
    await page.click('[data-testid="drill-next"]')
    await page.waitForSelector('[data-testid="option-A"]', { timeout: 15000 })
    await page.waitForTimeout(1500)
  }

  // ── Leave to HOME (family drill→home crossfade → ghost window) ────
  await page.evaluate(() => window.__mark('leave-to-home'))
  const homeLink = page.locator('a[href="/"]').first()
  if (await homeLink.count()) await homeLink.click()
  else await page.goto(`${BASE}/`)
  await page.waitForSelector('[data-testid="home-greeting"]', { timeout: 30000 })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/after-exit-home.png` })

  const rec = await page.evaluate(() => {
    window.__recStop = true
    return window.__rec
  })
  fs.writeFileSync(`${OUT}/frames.jsonl`, rec.map((x) => JSON.stringify(x)).join('\n'))

  const events = []
  let prev = null
  for (const f of rec) {
    if (f.mark) {
      events.push({ kind: 'MARK', mark: f.mark, t: f.t })
      continue
    }
    if (prev) {
      if (!!prev.station !== !!f.station) {
        events.push({
          kind: f.station ? 'STATION-MOUNT' : 'STATION-UNMOUNT',
          t: f.t,
          path: f.path,
          scrollY: f.scrollY,
          rect: f.station ?? prev.station,
        })
      } else if (prev.station && f.station) {
        const dx = f.station.x - prev.station.x
        const dy = f.station.y - prev.station.y
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          events.push({ kind: 'STATION-JUMP', t: f.t, dx: +dx.toFixed(1), dy: +dy.toFixed(1), from: prev.station, to: f.station, scrollY: f.scrollY, dScroll: f.scrollY - prev.scrollY, numTransform: f.numTransform })
        }
      }
      if (f.ghost && !prev.ghost) events.push({ kind: 'GHOST-APPEAR', t: f.t, path: f.path, ghost: f.ghost })
      if (!f.ghost && prev.ghost) events.push({ kind: 'GHOST-GONE', t: f.t, path: f.path })
    }
    prev = f
  }
  fs.writeFileSync(`${OUT}/events.json`, JSON.stringify(events, null, 2))
  console.log(`\n=== ${LABEL}: ${rec.length} frames ===`)
  for (const e of events) console.log(JSON.stringify(e))

  await context.close()
  await browser.close()
  const vids = fs.readdirSync(OUT).filter((f) => f.endsWith('.webm'))
  console.log('video:', vids.map((v) => path.join(OUT, v)).join(', '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
