// Phase-1 journey capture: /ova → repetition (entry flight) → answers →
// back to /ova (exit flight + ghost check) — with video + per-frame
// rects of EVERY due-numeral surface, full motion, authed, production
// preview. Detects: positional jumps of the header numeral, station
// unmount/remounts, and "ghost" stations (fixed-position 'att repetera'
// overlays present on a surface that should not have one).
//
// Usage: node scripts-bounce/journey.mjs [--throttle] [--width 1440] [--label name]

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const THROTTLE = args.includes('--throttle')
const WIDTH = Number(opt('width', '1440'))
const LABEL = opt('label', `journey-w${WIDTH}${THROTTLE ? '-throttled' : ''}`)
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
      const rail = document.querySelector('[data-testid="rail-due"]')
      // Ghost hunt: any element whose text is exactly 'att repetera'
      // whose nearest positioned ancestor chain includes position:fixed,
      // but which is NOT inside the live station (testid present).
      let ghost = null
      for (const el of document.querySelectorAll('span')) {
        if (el.textContent === 'att repetera' && !el.closest('[data-testid="due-station"]')) {
          const b = el.getBoundingClientRect()
          if (b.width > 0) {
            const exiting = !!el.closest('[data-exiting]')
            ghost = { ...{ x: +b.x.toFixed(1), y: +b.y.toFixed(1) }, exiting }
          }
        }
      }
      window.__rec.push({
        t: Math.round(t),
        station: rectOf(station),
        sttext: station ? station.textContent : null,
        stTransform: station ? getComputedStyle(station.parentElement).transform : null,
        numTransform: station ? getComputedStyle(station).transform : null,
        rail: rectOf(rail),
        ghost,
        scrollY: Math.round(window.scrollY),
        path: location.pathname,
      })
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

async function dumpRecorder(page, file) {
  const rec = await page.evaluate(() => {
    const r = window.__rec
    window.__rec = []
    return r
  })
  fs.appendFileSync(file, rec.map((x) => JSON.stringify(x)).join('\n') + '\n')
  return rec
}

const main = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    storageState: 'tests-e2e/.auth/user.json',
    viewport: { width: WIDTH, height: 900 },
    recordVideo: { dir: OUT, size: { width: WIDTH, height: 900 } },
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
  for (const q of bank) await testReset(page, 'seed', q.qid, 3) // 12 due → 2-digit count

  const framesFile = `${OUT}/frames.jsonl`
  fs.writeFileSync(framesFile, '')

  // ── Leg 1: /ova, recorder on BEFORE entering the session ─────────
  await page.goto(`${BASE}/ova`)
  await page.waitForSelector('[data-testid="ova-repetition"]', { timeout: 30000 })
  await page.waitForTimeout(1500)
  await startRecorder(page)
  await page.evaluate(() => window.__mark('click-repetera-lane'))
  await page.click('[data-testid="ova-repetition"]')
  await page.waitForSelector('[data-testid="option-A"]', { timeout: 30000 })
  await page.waitForTimeout(2000) // entry flight settles

  // ── Leg 2: two correct answers with post-grade scroll ────────────
  for (let i = 0; i < 2; i++) {
    const qid = new URL(page.url()).searchParams.get('qid') ?? ''
    const correct = answerOf.get(qid)
    if (!correct) throw new Error(`no answer for ${qid}`)
    await page.evaluate((n) => window.__mark(`answer-${n}`), i + 1)
    await page.click(`[data-testid="option-${correct}"]`)
    await page.mouse.wheel(0, 600)
    await page.waitForSelector('[data-testid="drill-next"]', { timeout: 15000 })
    await page.waitForTimeout(2500)
    await page.evaluate((n) => window.__mark(`nasta-${n}`), i + 1)
    await page.click('[data-testid="drill-next"]')
    await page.waitForSelector('[data-testid="option-A"]', { timeout: 15000 })
    await page.waitForTimeout(1500)
  }

  // ── Leg 3: leave to /ova via client-side nav (rail link) ─────────
  // The drill rail is collapsed; use the spine's Öva glyph if present,
  // else navigate via history push (client-side).
  await page.evaluate(() => window.__mark('leave-to-ova'))
  const ovaLink = page.locator('a[href="/ova"]').first()
  if (await ovaLink.count()) {
    await ovaLink.click()
  } else {
    await page.evaluate(() => window.history.pushState({}, '', '/ova'))
  }
  await page.waitForSelector('[data-testid="ova-repetition"]', { timeout: 30000 })
  await page.waitForTimeout(2500) // exit crossfade + flight back + ghost window

  const rec = await dumpRecorder(page, framesFile)
  await page.screenshot({ path: `${OUT}/after-exit-ova.png` })

  // ── Analysis ──────────────────────────────────────────────────────
  const events = []
  let prev = null
  for (const f of rec) {
    if (f.mark) {
      events.push({ kind: 'MARK', mark: f.mark, t: f.t })
      continue
    }
    if (prev) {
      if (!!prev.station !== !!f.station) {
        events.push({ kind: f.station ? 'STATION-MOUNT' : 'STATION-UNMOUNT', t: f.t, path: f.path, scrollY: f.scrollY })
      } else if (prev.station && f.station) {
        const dx = f.station.x - prev.station.x
        const dy = f.station.y - prev.station.y
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          events.push({ kind: 'STATION-JUMP', t: f.t, dx: +dx.toFixed(1), dy: +dy.toFixed(1), from: prev.station, to: f.station, scrollY: f.scrollY, dScroll: f.scrollY - prev.scrollY, numTransform: f.numTransform })
        }
      }
      if (f.ghost && !prev.ghost) events.push({ kind: 'GHOST-APPEAR', t: f.t, path: f.path, ghost: f.ghost })
      if (!f.ghost && prev.ghost) events.push({ kind: 'GHOST-GONE', t: f.t, path: f.path })
      if (prev.rail && f.rail) {
        const dx = f.rail.x - prev.rail.x
        const dy = f.rail.y - prev.rail.y
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          events.push({ kind: 'RAIL-JUMP', t: f.t, dx: +dx.toFixed(1), dy: +dy.toFixed(1), path: f.path })
        }
      }
    }
    prev = f
  }
  fs.writeFileSync(`${OUT}/events.json`, JSON.stringify(events, null, 2))
  console.log(`\n=== ${LABEL}: ${rec.length} frames ===`)
  for (const e of events) console.log(JSON.stringify(e))

  await context.close() // flush video
  await browser.close()
  const vids = fs.readdirSync(OUT).filter((f) => f.endsWith('.webm'))
  console.log('video:', vids.map((v) => path.join(OUT, v)).join(', '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
