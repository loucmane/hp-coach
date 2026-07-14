// Phase-1 PIXEL-granularity probe. DOM geometry (rects/transforms) shows
// the station dead still on static-count grades and Nästa — but the
// owner's eye sees a bump. The eye watches PIXELS, not rects: subpixel
// text snapping, layer promotion/demotion, and paint shifts are invisible
// to getBoundingClientRect. This probe screencasts the page via CDP
// through a grade and a Nästa with a static count, crops each frame to
// the station strip, and reports per-frame pixel deltas in that crop.
//
// Usage: node scripts-bounce/pixel.mjs [--dpr 2] [--world repetition|drill]
//        [--zoom 1.25] [--label name]

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const DPR = Number(opt('dpr', '1'))
const ZOOM = Number(opt('zoom', '1'))
const WORLD = opt('world', 'repetition')
const LABEL = opt('label', `px-${WORLD}-dpr${DPR}${ZOOM !== 1 ? `-zoom${ZOOM}` : ''}`)
const OUT = path.resolve('scripts-bounce/out', LABEL)
fs.mkdirSync(OUT, { recursive: true })

const API = 'http://localhost:8787'
const BASE = 'http://localhost:4173'

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

// Minimal PNG decode (8-bit RGBA, as produced by CDP screencast png).
function decodePng(buf) {
  let pos = 8
  let w = 0
  let h = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0)
      h = data.readUInt32BE(4)
      const bitDepth = data[8]
      const colorType = data[9]
      if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2))
        throw new Error(`unsupported png bd=${bitDepth} ct=${colorType}`)
      decodePng.channels = colorType === 6 ? 4 : 3
    } else if (type === 'IDAT') idat.push(data)
    pos += 12 + len
  }
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const ch = decodePng.channels
  const stride = w * ch
  const out = Buffer.alloc(w * h * ch)
  let prevRow = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const cur = Buffer.alloc(stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0
      const b = prevRow[x]
      const c = x >= ch ? prevRow[x - ch] : 0
      let v = row[x]
      if (f === 1) v = (v + a) & 0xff
      else if (f === 2) v = (v + b) & 0xff
      else if (f === 3) v = (v + ((a + b) >> 1)) & 0xff
      else if (f === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff
      }
      cur[x] = v
    }
    cur.copy(out, y * stride)
    prevRow = cur
  }
  return { w, h, ch, data: out }
}

function cropDiff(a, b, rect) {
  // Sum abs channel differences within rect {x,y,w,h} in image pixels.
  let sum = 0
  let maxPix = 0
  let changed = 0
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      const i = (y * a.w + x) * a.ch
      let d = 0
      for (let c = 0; c < 3; c++) d += Math.abs(a.data[i + c] - b.data[i + c])
      sum += d
      if (d > 30) changed++
      if (d > maxPix) maxPix = d
    }
  }
  return { sum, changed, maxPix }
}

const main = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    storageState: 'tests-e2e/.auth/user.json',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: DPR,
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
  if (ZOOM !== 1) {
    const cdpz = await context.newCDPSession(page)
    await cdpz.send('Emulation.setPageScaleFactor', { pageScaleFactor: ZOOM })
  }

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
  await page.waitForTimeout(1500)

  // Station rect in CSS px → device px for the crop (pad generously).
  const st = await page.evaluate(() => {
    const b = document.querySelector('[data-testid="due-station"]').getBoundingClientRect()
    return { x: b.x, y: b.y, w: b.width, h: b.height }
  })
  // CDP screencast frames come back at CSS resolution (1440x900) no
  // matter the deviceScaleFactor — crop in CSS px, clamped to the frame.
  const pad = 10
  const crop = {
    x: Math.max(0, Math.floor((st.x - pad) * ZOOM)),
    y: Math.max(0, Math.floor((st.y - pad) * ZOOM)),
    w: Math.min(Math.ceil((st.w + pad * 2) * ZOOM), 1440 - Math.floor((st.x - pad) * ZOOM)),
    h: Math.ceil((st.h + pad * 2) * ZOOM),
  }
  console.log('station rect css:', st, 'crop dev px:', crop)

  // Screencast
  const cdp = await context.newCDPSession(page)
  const frames = []
  const marks = []
  cdp.on('Page.screencastFrame', async (ev) => {
    frames.push({ t: ev.metadata.timestamp, data: Buffer.from(ev.data, 'base64') })
    try {
      await cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId })
    } catch {}
  })
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 })
  const mark = (m) => marks.push({ m, t: Date.now() / 1000 })

  // --mode correct films the count ROLL (6→5); default films the
  // static-count wrong grade + Nästa.
  const MODE = opt('mode', 'wrong')
  const qid = new URL(page.url()).searchParams.get('qid') ?? ''
  const correct = answerOf.get(qid)
  let pick = correct ?? 'A'
  if (MODE !== 'correct') {
    for (const l of ['A', 'B', 'C', 'D', 'E']) {
      if (l !== correct && (await page.locator(`[data-testid="option-${l}"]`).count())) {
        pick = l
        break
      }
    }
  }
  mark(`grade-${MODE}`)
  await page.click(`[data-testid="option-${pick}"]`)
  await page.waitForSelector('[data-testid="drill-next"]', { timeout: 15000 })
  await page.waitForTimeout(2500)
  if (MODE !== 'correct') {
    mark('nasta')
    await page.click('[data-testid="drill-next"]')
    await page.waitForSelector('[data-testid="option-A"]', { timeout: 15000 })
    await page.waitForTimeout(2000)
  }
  await cdp.send('Page.stopScreencast')

  console.log(`captured ${frames.length} frames`)
  let prev = null
  let idx = 0
  const report = []
  for (const f of frames) {
    let img
    try {
      img = decodePng(f.data)
    } catch (e) {
      console.log('decode fail', e.message)
      continue
    }
    if (prev && prev.w === img.w) {
      const d = cropDiff(prev, img, crop)
      if (d.changed > 0) {
        report.push({ i: idx, t: f.t, ...d })
        // save the diffing frames for eyeballing
        if (report.length < 40) {
          fs.writeFileSync(`${OUT}/f${String(idx).padStart(3, '0')}.png`, f.data)
        }
      }
    }
    prev = img
    idx++
  }
  // Attribute marks to timestamps
  console.log('marks:', JSON.stringify(marks))
  console.log(`\n=== station-crop pixel diffs (${report.length} frames with change) ===`)
  for (const r of report) console.log(JSON.stringify(r))
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify({ marks, report }, null, 2))
  await browser.close()
  console.log(`wrote ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
