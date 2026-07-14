// Phase-1 reproduction harness for the "ugly bounce" of the due-numeral
// header station on /repetition. Drives the PRODUCTION preview (4173)
// against the live worker (8787), authed via the saved Clerk storage
// state, with FULL motion (no reduced-motion), and records the numeral's
// bounding box EVERY animation frame while answering consecutive
// questions correctly (each correct answer = pile −1 = the owner's
// real usage). Also scrolls before advancing, like a real reading user.
//
// Usage: node scripts-bounce/repro.mjs [--throttle] [--width 1440] [--scroll 500] [--label name]

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
const SCROLL = Number(opt('scroll', '500'))
const LABEL = opt('label', `w${WIDTH}${THROTTLE ? '-throttled' : ''}${SCROLL ? `-scroll${SCROLL}` : ''}`)
const OUT = path.resolve('scripts-bounce/out', LABEL)
fs.mkdirSync(OUT, { recursive: true })

const API = 'http://localhost:8787'
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

// Start the per-frame recorder inside the page. Records the numeral's
// viewport rect + text + scrollY + station presence each rAF.
async function startRecorder(page) {
  await page.evaluate(() => {
    window.__rec = []
    window.__recStop = false
    const step = (t) => {
      if (window.__recStop) return
      const el = document.querySelector('[data-testid="due-station-numeral"]')
      const st = document.querySelector('[data-testid="due-station"]')
      let r = null
      if (el) {
        const b = el.getBoundingClientRect()
        r = { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) }
      }
      window.__rec.push({
        t: Math.round(t),
        rect: r,
        text: el ? el.textContent : null,
        station: !!st,
        scrollY: Math.round(window.scrollY),
        transform: el ? getComputedStyle(el).transform : null,
      })
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

async function stopRecorder(page) {
  return await page.evaluate(() => {
    window.__recStop = true
    return window.__rec
  })
}

function analyze(rec, label) {
  // The station is position:fixed → its viewport rect must NEVER move.
  // Report every frame-to-frame positional jump > 0.5px, plus
  // unmount/remount events.
  const events = []
  let prev = null
  for (const f of rec) {
    if (prev) {
      if (!!prev.rect !== !!f.rect) {
        events.push({ kind: f.rect ? 'MOUNT' : 'UNMOUNT', t: f.t, text: f.text, scrollY: f.scrollY })
      } else if (prev.rect && f.rect) {
        const dx = f.rect.x - prev.rect.x
        const dy = f.rect.y - prev.rect.y
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          events.push({
            kind: 'JUMP',
            t: f.t,
            dx: +dx.toFixed(1),
            dy: +dy.toFixed(1),
            from: prev.rect,
            to: f.rect,
            text: f.text,
            scrollY: f.scrollY,
            dScroll: f.scrollY - prev.scrollY,
            transform: f.transform,
          })
        }
      }
    }
    prev = f
  }
  console.log(`\n=== ${label}: ${rec.length} frames, ${events.length} events ===`)
  for (const e of events.slice(0, 60)) console.log(JSON.stringify(e))
  return events
}

const bank = []
async function loadBankProbe(page, n = 6) {
  // Resolve n complete ORD questions + answers from the static corpus.
  const rows = await page.evaluate(async (n) => {
    const idx = await (await fetch('/data/_index.json')).json()
    const out = []
    for (const e of idx.exams) {
      const rows = await (await fetch(`/data/${e.exam_id}.json`)).json()
      for (const q of rows) {
        if (q.section === 'ORD' && q.parsing_status === 'complete' && q.options && q.answer) {
          out.push({ qid: q.qid, answer: q.answer.toUpperCase() })
          if (out.length >= n) return out
        }
      }
    }
    return out
  }, n)
  bank.push(...rows)
}

const main = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    storageState: STORAGE,
    viewport: { width: WIDTH, height: 900 },
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

  await page.goto('http://localhost:4173/')
  await page.waitForSelector('[data-testid="home-greeting"]', { timeout: 30000 })

  await loadBankProbe(page, 6)
  if (bank.length < 5) throw new Error('not enough ORD probes')
  const answerOf = new Map(bank.map((q) => [q.qid, q.answer]))

  await testReset(page, 'clear')
  for (const q of bank.slice(0, 5)) await testReset(page, 'seed', q.qid, 3)

  // Enter repetition via the Öva hub lane (the real door).
  await page.goto('http://localhost:4173/ova')
  await page.waitForSelector('[data-testid="ova-repetition"]', { timeout: 30000 })
  await page.click('[data-testid="ova-repetition"]')
  await page.waitForSelector('[data-testid="option-A"]', { timeout: 30000 })
  await page.waitForSelector('[data-testid="due-station-numeral"]', { timeout: 15000 })
  await page.waitForTimeout(1200) // let entry flight settle

  await startRecorder(page)
  const allEvents = []

  for (let i = 0; i < 5; i++) {
    const qid = new URL(page.url()).searchParams.get('qid') ?? ''
    const correct = answerOf.get(qid)
    if (!correct) throw new Error(`no answer for ${qid}`)
    await page.click(`[data-testid="option-${correct}"]`)
    // The REAL user sequence: the pedagogy panel makes the page tall the
    // moment it grades; the reader scrolls INTO the explanation while the
    // pile refetch is still in flight, so the digit roll lands scrolled.
    // (Question 3 stays unscrolled as the control.)
    if (SCROLL && i !== 2) {
      await page.mouse.wheel(0, SCROLL)
    }
    await page.waitForSelector('[data-testid="drill-next"]', { timeout: 15000 })
    await page.waitForTimeout(2500)
    const sy = await page.evaluate(() => window.scrollY)
    console.log(`q${i + 1} graded, scrollY=${sy}`)
    await page.screenshot({ path: `${OUT}/q${i + 1}-graded.png` })
    if (i < 4) {
      // advance while scrolled — QuestionPan resets scroll onExitComplete
      await page.click('[data-testid="drill-next"]')
      await page.waitForSelector('[data-testid="option-A"]', { timeout: 15000 })
      await page.waitForTimeout(1800)
    }
  }

  const rec = await stopRecorder(page)
  fs.writeFileSync(`${OUT}/frames.json`, JSON.stringify(rec))
  const events = analyze(rec, LABEL)
  allEvents.push(...events)
  fs.writeFileSync(`${OUT}/events.json`, JSON.stringify(allEvents, null, 2))
  await page.screenshot({ path: `${OUT}/final.png` })

  await browser.close()
  console.log(`\nwrote ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
