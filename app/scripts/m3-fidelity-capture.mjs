// M6 — cross-surface fidelity sweep capture + measurement harness.
//
// For every cell of the capture matrix (surface-state x {1440,402} x
// {light,dark}) this script:
//   1. screenshots the LIVE surface and its M3 REFERENCE state
//      (palette forced to spalt per the spec — restored afterwards),
//   2. extracts computed styles for the element checklist — the live
//      `.hpc-m3-*` class vs the reference `.m3-*` class — into
//      audit/m3-fidelity/measurements.json.
//
// The per-element grid in docs/m3-fidelity-report.md is generated from
// these measurements: a PASS means the live computed values match the
// reference's at the same viewport/palette/mode. Images land in
// audit/m3-fidelity/ (untracked — regenerate with:
//   cd app && node scripts/m3-fidelity-capture.mjs
// requires pnpm dev on :5173 + worker on :8787 + tests-e2e/.auth).
//
// Graded states are component useState, not URL params — the script
// clicks option a) then waits for the verdict. Motion settles via
// timeouts (animations are `both`-filled, so steady-state is stable).

import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const OUT = new URL('../../audit/m3-fidelity/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const BASE = 'http://localhost:5173'
const REF = '/redesign-l12?dev=1&v=3'

// Style props probed per element. Colors resolve via the same tokens on
// both sides, so straight string equality is a valid comparator.
const PROPS = [
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'textTransform',
  'color',
  'backgroundColor',
  'gridTemplateColumns',
  'columnGap',
  'maxWidth',
  'paddingTop',
  'paddingLeft',
  'borderTopWidth',
  'borderLeftWidth',
  'textDecorationLine',
  'whiteSpace',
]

// element key -> [liveSelector, refSelector]
const PAIRS = {
  frame: ['.hpc-studydesk, .hpc-m3-frame', '.m3-frame'],
  row: ['.hpc-m3-row', '.m3-row'],
  meta: ['.hpc-m3-meta', '.m3-meta'],
  eyebrow: ['.hpc-m3-eyebrow', '.m3-eyebrow'],
  display: ['.hpc-m3-display', '.m3-display'],
  tacticH: ['.hpc-m3-tactic-h', '.m3-tactic-h'],
  tacticT: ['.hpc-m3-tactic-t', '.m3-tactic-t'],
  keys: ['.hpc-m3-keys', '.m3-keys'],
  optK: ['.hpc-m3-opt-k', '.m3-opt-k'],
  optT: ['.hpc-m3-opt-t', '.m3-opt-t'],
  optOk: ['.hpc-m3-opt.is-ok', '.m3-opt.is-ok'],
  optBad: ['.hpc-m3-opt.is-bad', '.m3-opt.is-bad'],
  verdictWord: ['.hpc-m3-verdict-word', '.m3-verdict-word'],
  verdictSub: ['.hpc-m3-verdict-sub', '.m3-verdict-sub'],
  solution: ['.hpc-m3-solution', '.m3-solution'],
  stepN: ['.hpc-m3-step-n', '.m3-step-n'],
  stepH: ['.hpc-m3-step-h', '.m3-step-h'],
  stepTier: ['.hpc-m3-step-tier', '.m3-step-tier'],
  stepT: ['.hpc-m3-step-t', '.m3-step-t'],
  disH: ['.hpc-m3-dis-h', '.m3-dis-h'],
  disStruck: ['.hpc-m3-dis-h s', '.m3-dis-h s'],
  disL: ['.hpc-m3-dis-l', '.m3-dis-l'],
  disP: ['.hpc-m3-dis-p', '.m3-dis-p'],
  statN: ['.hpc-m3-stat-n', '.m3-stat-n'],
  statL: ['.hpc-m3-stat-l', '.m3-stat-l'],
  resume: ['.hpc-m3-resume', '.m3-resume'],
  resumeT: ['.hpc-m3-resume-t', '.m3-resume-t'],
  cta: ['.hpc-m3-cta', '.m3-cta'],
  planN: ['.hpc-m3-plan-n', '.m3-plan-n'],
  planT: ['.hpc-m3-plan-t', '.m3-plan-t'],
  planR: ['.hpc-m3-plan-r', '.m3-plan-r'],
  planMin: ['.hpc-m3-plan-min', '.m3-plan-min'],
  tag: ['.hpc-m3-tag', '.m3-tag'],
  trapT: ['.hpc-m3-trap-t', '.m3-trap-t'],
  trapN: ['.hpc-m3-trap-n', '.m3-trap-n'],
  passageH: ['.hpc-m3-passage-h', '.m3-passage-h'],
  passageP: ['.hpc-m3-passage p', '.m3-passage p'],
  stmtN: ['.hpc-m3-stmt-n', '.m3-stmt-n'],
  stmtT: ['.hpc-m3-stmt-t', '.m3-stmt-t'],
  coda: ['.hpc-m3-coda', '.m3-coda'],
  missing: ['.hpc-m3-missing', '.m3-missing'],
  h: ['.hpc-m3-h', '.m3-h'],
}

// surface-state matrix. `live`/`ref` are async (page) => void setups.
const STATES = [
  { key: 'home', live: '/', ref: `${REF}&s=home` },
  { key: 'ord-idle', live: '/drill?section=ORD', ref: `${REF}&s=drill&q=ord`, startDrill: true },
  {
    key: 'ord-graded',
    live: '/drill?section=ORD',
    ref: `${REF}&s=drill&q=ord`,
    startDrill: true,
    grade: true,
  },
  { key: 'las-idle', live: '/drill?section=L%C3%84S', ref: `${REF}&s=drill&q=las`, startDrill: true },
  { key: 'nog-idle', live: '/drill?section=NOG', ref: `${REF}&s=drill&q=nog`, startDrill: true },
  { key: 'xyz-idle', live: '/drill?section=XYZ', ref: `${REF}&s=drill&q=xyz`, startDrill: true },
  { key: 'dtk-idle', live: '/drill?section=DTK', ref: `${REF}&s=drill&q=dtk`, startDrill: true },
  {
    key: 'xyz-graded',
    live: '/drill?section=XYZ',
    ref: `${REF}&s=drill&q=xyz`,
    startDrill: true,
    grade: true,
  },
  {
    key: 'dtk-graded',
    live: '/drill?section=DTK',
    ref: `${REF}&s=drill&q=dtk`,
    startDrill: true,
    grade: true,
  },
]

const WIDTHS = [1440, 402]
const MODES = ['light', 'dark']

async function measure(page, side) {
  return page.evaluate(
    ({ pairs, props, side }) => {
      const out = {}
      for (const [key, sels] of Object.entries(pairs)) {
        const sel = side === 'live' ? sels[0] : sels[1]
        const el = document.querySelector(sel)
        if (!el) continue
        const cs = getComputedStyle(el)
        const rec = {}
        for (const p of props) rec[p] = cs[p]
        rec._text = (el.textContent ?? '').slice(0, 80)
        out[key] = rec
      }
      // frame width sanity: widest m3 section row
      const frame = document.querySelector(side === 'live' ? '.hpc-studydesk, .hpc-m3-frame' : '.m3-frame')
      if (frame) out._frameWidth = frame.getBoundingClientRect().width
      return out
    },
    { pairs: PAIRS, props: PROPS, side },
  )
}



/** PATCH the server mode via /dev's synced Tema buttons (the strip's
 *  ◐ toggle is local-only — the M6 sweep discovered mode never syncs
 *  cross-device; findings §mode). Verified with a fresh reload. */
async function setServerMode(browser, mode) {
  const ctx = await browser.newContext({
    storageState: 'tests-e2e/.auth/user.json',
    viewport: { width: 1440, height: 900 },
  })
  await ctx.addInitScript(() => localStorage.setItem('hpc-welcomed', '1'))
  const p = await ctx.newPage()
  await p.goto(`${BASE}/dev`)
  await p.waitForTimeout(1500)
  await p.getByRole('button', { name: mode === 'dark' ? 'Mörk' : 'Ljus' }).click({ timeout: 5000 })
  await p.waitForTimeout(1200)
  await p.reload()
  await p.waitForTimeout(1500)
  const dark = await p.evaluate(() => document.documentElement.classList.contains('dark'))
  if (dark !== (mode === 'dark')) console.warn(`SERVER MODE NOT VERIFIED (${mode})`)
  await ctx.close()
}

const browser = await chromium.launch()
const results = {}

const themeCtx = await browser.newContext({
  storageState: 'tests-e2e/.auth/user.json',
  viewport: { width: 1440, height: 900 },
})
await themeCtx.addInitScript(() => localStorage.setItem('hpc-welcomed', '1'))

for (const mode of MODES) {
  await setServerMode(browser, mode)
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({
      storageState: 'tests-e2e/.auth/user.json',
      viewport: { width, height: width === 402 ? 874 : 900 },
      reducedMotion: 'reduce',
    })
    await ctx.addInitScript(() => localStorage.setItem('hpc-welcomed', '1'))
    // Theme via prefs intercept: every page (live AND the M3 reference)
    // hydrates palette/mode from GET /api/me/prefs ({ prefs: {...} }).
    // Rewriting the response is deterministic at any viewport width and
    // never mutates the dogfood user's real prefs. (Server-side note for
    // the report: PATCH mode does not persist — mode is device-local.)
    await ctx.route('**/api/me/prefs', async (route) => {
      try {
        const resp = await route.fetch()
        const json = await resp.json()
        json.prefs = { ...json.prefs, palette: 'spalt' }
        await route.fulfill({ response: resp, json })
      } catch {
        await route.continue().catch(() => {})
      }
    })
    for (const st of STATES) {
      const cell = `${st.key}-${width}-${mode}`
      // ---- LIVE ----
      const lp = await ctx.newPage()
      await lp.goto(BASE + st.live)
      await lp.waitForTimeout(1200)
      if (st.startDrill) {
        await lp
          .getByRole('button', { name: /starta|fortsätt/i })
          .first()
          .click({ timeout: 4000 })
          .catch(() => {})
        await lp.waitForSelector('[data-testid="drill-prompt"]', { timeout: 8000 }).catch(() => {})
        await lp.waitForTimeout(600)
      }
      if (st.grade) {
        await lp.getByTestId('option-A').click({ timeout: 4000 }).catch(() => {})
        await lp.waitForTimeout(900)
        await lp.mouse.wheel(0, 800)
        await lp.waitForTimeout(300)
      }
      await lp.screenshot({ path: `${OUT}live-${cell}.png` })
      const liveM = await measure(lp, 'live')
      await lp.close()

      // ---- REF ----
      const rp = await ctx.newPage()
      await rp.goto(BASE + st.ref)
      await rp.waitForTimeout(1200)
      if (st.grade) {
        await rp.locator('.m3-opt').first().click({ timeout: 4000 }).catch(() => {})
        await rp.waitForTimeout(700)
        await rp.mouse.wheel(0, 800)
        await rp.waitForTimeout(300)
      }
      await rp.screenshot({ path: `${OUT}ref-${cell}.png` })
      const refM = await measure(rp, 'ref')
      await rp.close()

      results[cell] = { live: liveM, ref: refM }
      console.log(`captured ${cell}`)
    }
    await ctx.close()
  }
}

writeFileSync(`${OUT}measurements.json`, JSON.stringify(results, null, 1))
console.log('measurements written')

await setServerMode(browser, 'light')
await browser.close()
