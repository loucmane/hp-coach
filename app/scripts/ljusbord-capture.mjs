// LJ-03: the Ljusbord capture harness. Shoots any list of app routes in the
// 4 Ljusbord modes (dator 1440×900 and telefon 390×844, each light and
// dark), optionally once per palette, for the visual gate. Modelled on
// m3-fidelity-capture.mjs, but it signs in through /dev-login instead of
// reading a saved tests-e2e/.auth state.
//
// Needs the local stack: `pnpm -C app dev` on :5173 and `pnpm -C worker dev`
// on :8787, with DEV_LOGIN_EMAIL set in worker/.dev.vars. On this WSL host
// Chromium needs software GL, so run it from the repo root with this prefix:
//
//   env -u WAYLAND_DISPLAY -u DISPLAY LIBGL_ALWAYS_SOFTWARE=1 GALLIUM_DRIVER=llvmpipe \
//     MESA_LOADER_DRIVER_OVERRIDE=llvmpipe node app/scripts/ljusbord-capture.mjs \
//     --out ~/scratch/<bead>/shots --routes '/,/ova,/drill?section=KVA&start=true' \
//     [--palettes spalt,sand] [--dark-only]
//
// Quote --routes: `?` and `&` are shell syntax. `--help` lists every option.
//
// Per run it:
// - signs in once through /dev-login, waits until the app has left that page
//   with a live Clerk session, and reuses the session for every mode;
// - seeds localStorage before the app boots: hpc-welcomed=1, and the
//   persisted hpc-ui store's folioPreview: true, mode and palette;
// - shoots dark with colorScheme 'dark' (the system path) and light with
//   'light'. The app re-applies the server's theme whenever prefs load, so
//   the same mode (and the palette, with --palettes) is also seeded and
//   rewritten into GET /api/me/prefs in flight. Nothing is written to the
//   account's stored prefs;
// - uses reducedMotion 'reduce', sv-SE in Europe/Stockholm, and blocks
//   service workers so every request passes the routes below;
// - aborts DELETE /api/account at the network level: the account is never
//   deleted;
// - grows the viewport to the document height before each full-page shot,
//   so fixed and sticky bars sit where they belong, not mid-page. (The Folio
//   shell scrolls the document; a screen that scrolled inside a container
//   instead would be shot at its first screenful.)
// - writes <out>/<slug>-<dator|telefon>-<light|dark>[-<palette>].jpg (JPEG
//   q72) and <out>/report.json, with one entry per route and mode: the final
//   URL, page errors, elements wider than the viewport (scrollWidth >
//   innerWidth, innermost only, since a parent inherits a child's width) and
//   red text (computed colour with r > 150, g < 90, b < 90), plus warnings
//   when the shot rendered another route, theme or palette than asked.
//
// Exit code: 0 when every shot was taken (findings live in the report),
// 1 when a shot failed, 2 when the run could not start.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import {
  ACCOUNT_PATH,
  captureModes,
  fitHeight,
  isAccountDelete,
  JPEG_QUALITY,
  MAX_SHOT_HEIGHT,
  PREFS_PATH,
  parseArgs,
  redText,
  replayHeaders,
  rewritePrefs,
  seedStorage,
  shotFileName,
  shotWarnings,
  slugRoutes,
  storageSeed,
  USAGE,
} from './ljusbord-capture.helpers.mjs'

const SETTLE_MS = 1200
const RESIZE_SETTLE_MS = 250
const LOGIN_TIMEOUT_MS = 60_000
const SESSION_TIMEOUT_MS = 30_000
const GOTO_TIMEOUT_MS = 45_000
const IDLE_TIMEOUT_MS = 10_000
const PREFLIGHT_TIMEOUT_MS = 5_000
// Caps the element and console lists in report.json; the counts stay exact.
const LIST_LIMIT = 25
const LOGIN_MODE = {
  device: 'dator',
  viewport: { width: 1440, height: 900 },
  scheme: 'light',
  palette: null,
}

let args
try {
  args = parseArgs(process.argv.slice(2))
} catch (err) {
  console.error(`ljusbord-capture: ${err.message}\n\n${USAGE}`)
  process.exit(2)
}
if (args.help) {
  console.log(USAGE)
  process.exit(0)
}

const out = resolve(args.out)
const routes = slugRoutes(args.routes)
const modes = captureModes(args)
const report = {
  tool: 'app/scripts/ljusbord-capture.mjs',
  startedAt: new Date().toISOString(),
  finishedAt: null,
  app: args.app,
  routes,
  palettes: args.palettes,
  darkOnly: args.darkOnly,
  error: null,
  summary: null,
  shots: [],
}

await preflight('app', args.app)
await preflight('worker', `${args.worker}/health`)

const { chromium } = await import('@playwright/test')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
try {
  let storageState = null
  try {
    storageState = await signIn()
  } catch (err) {
    report.error = `sign-in through /dev-login failed: ${clip(err.message)}`
    writeReport()
    console.error(`ljusbord-capture: ${report.error}`)
    process.exitCode = 2
  }
  if (storageState) await captureAll(storageState)
} finally {
  await browser.close()
}

async function preflight(name, url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(PREFLIGHT_TIMEOUT_MS) })
    await response.body?.cancel()
  } catch (err) {
    console.error(
      `ljusbord-capture: the ${name} does not answer at ${url} (${err.cause?.code ?? err.name}); start the local stack first`,
    )
    process.exit(2)
  }
}

/** Signs in once and returns the signed-in storage state (kept in memory only). */
async function signIn() {
  const context = await openContext(LOGIN_MODE, null, [])
  try {
    const page = await context.newPage()
    await page.goto(new URL('/dev-login', args.app).href, { timeout: GOTO_TIMEOUT_MS })
    const deadline = Date.now() + LOGIN_TIMEOUT_MS
    while (new URL(page.url()).pathname === '/dev-login') {
      const lines = await page
        .evaluate(() => (document.body ? document.body.innerText.split('\n') : []))
        .catch(() => [])
      const failure = lines.map((line) => line.trim()).find((line) => line.startsWith('Fel:'))
      if (failure) throw new Error(`/dev-login says "${failure}"`)
      if (Date.now() > deadline) {
        throw new Error(
          `still on /dev-login after ${LOGIN_TIMEOUT_MS / 1000} s: "${clip(lines.join(' '), 200)}"`,
        )
      }
      await page.waitForTimeout(250)
    }
    const landed = new URL(page.url()).pathname
    await page
      .waitForFunction(() => Boolean(window.Clerk?.session), null, { timeout: SESSION_TIMEOUT_MS })
      .catch(() => {
        throw new Error(`left /dev-login for ${landed}, but no Clerk session came up`)
      })
    await settle(page)
    console.log(`signed in through /dev-login (it went on to ${landed})`)
    return await context.storageState()
  } finally {
    await context.close()
  }
}

/** One browser context per mode, with the seed, the prefs rewrite and the account guard. */
async function openContext(mode, storageState, blocked) {
  const context = await browser.newContext({
    viewport: mode.viewport,
    deviceScaleFactor: 1,
    colorScheme: mode.scheme,
    reducedMotion: 'reduce',
    locale: 'sv-SE',
    timezoneId: 'Europe/Stockholm',
    serviceWorkers: 'block',
    storageState: storageState ?? undefined,
  })
  await context.addInitScript(seedStorage, storageSeed(mode))
  await context.route(
    (url) => url.pathname === ACCOUNT_PATH || url.pathname.startsWith(`${ACCOUNT_PATH}/`),
    quietly(async (route) => {
      const request = route.request()
      if (!isAccountDelete(request.method(), request.url())) return route.fallback()
      blocked.push(`${request.method()} ${new URL(request.url()).pathname}`)
      return route.abort('blockedbyclient')
    }),
  )
  await context.route(
    (url) => url.pathname === PREFS_PATH,
    quietly(async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      let response
      try {
        response = await route.fetch()
      } catch {
        return route.abort()
      }
      let body
      try {
        body = await response.json()
      } catch {
        return route.fulfill({ response })
      }
      return route.fulfill({
        status: response.status(),
        headers: replayHeaders(response.headers()),
        json: rewritePrefs(body, mode),
      })
    }),
  )
  return context
}

/** A route handler whose request may outlive its page at teardown. */
function quietly(handler) {
  return async (route) => {
    try {
      await handler(route)
    } catch {
      // The page or context closed while the request was in flight.
    }
  }
}

async function captureAll(storageState) {
  console.log(`shooting ${routes.length} route(s) in ${modes.length} mode(s) into ${out}`)
  for (const mode of modes) {
    const blocked = []
    const context = await openContext(mode, storageState, blocked)
    try {
      for (const { route, slug } of routes) {
        const shot = await shoot(context, mode, route, slug, blocked)
        report.shots.push(shot)
        writeReport()
        printShot(shot)
      }
    } finally {
      await context.close()
    }
  }
  report.finishedAt = new Date().toISOString()
  writeReport()
  const s = report.summary
  console.log(
    `\n${s.shots} shot(s), ${s.failed} failed. Side scroll in ${s.sideScroll}, wide elements in ${s.wideElements}, red text in ${s.redText}, page errors in ${s.pageErrors}, warnings in ${s.warnings}.`,
  )
  console.log(`report: ${join(out, 'report.json')}`)
  if (s.failed > 0) process.exitCode = 1
}

async function shoot(context, mode, route, slug, blocked) {
  const file = shotFileName({ slug, device: mode.device, scheme: mode.scheme, palette: mode.palette })
  const shot = {
    file,
    route,
    device: mode.device,
    viewport: mode.viewport,
    scheme: mode.scheme,
    palette: mode.palette,
    finalUrl: null,
    shotHeight: null,
    theme: null,
    warnings: [],
    pageErrors: [],
    consoleErrors: [],
    consoleErrorCount: 0,
    blockedRequests: [],
    overflow: null,
    redText: [],
    error: null,
  }
  const page = await context.newPage()
  page.on('pageerror', (err) => shot.pageErrors.push(clip(err.message)))
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    shot.consoleErrorCount += 1
    if (shot.consoleErrors.length < LIST_LIMIT) shot.consoleErrors.push(clip(message.text()))
  })
  try {
    await page.goto(new URL(route, args.app).href, { timeout: GOTO_TIMEOUT_MS })
    await settle(page)
    shot.shotHeight = await fitViewport(page, mode.viewport)
    const facts = await page.evaluate(inspectPage, LIST_LIMIT)
    shot.finalUrl = page.url()
    shot.theme = facts.theme
    shot.warnings = shotWarnings({
      route,
      finalUrl: shot.finalUrl,
      theme: facts.theme,
      scheme: mode.scheme,
      palette: mode.palette,
    })
    if (shot.shotHeight >= MAX_SHOT_HEIGHT) {
      shot.warnings.push(`the page is taller than ${MAX_SHOT_HEIGHT} px; fixed bars may sit mid-page`)
    }
    shot.overflow = facts.overflow
    shot.redText = redText(facts.colors)
    await page.screenshot({
      path: join(out, file),
      type: 'jpeg',
      quality: JPEG_QUALITY,
      fullPage: true,
      animations: 'disabled',
    })
  } catch (err) {
    shot.error = clip(err.message)
    shot.finalUrl = page.url()
  } finally {
    shot.blockedRequests = blocked.splice(0)
    await page.close().catch(() => {})
  }
  return shot
}

/** Boot veil gone, network quiet, fonts and images in, then a beat for motion to rest. */
async function settle(page) {
  await page
    .waitForFunction(() => !document.getElementById('boot-veil'), null, {
      timeout: IDLE_TIMEOUT_MS,
    })
    .catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: IDLE_TIMEOUT_MS }).catch(() => {})
  await waitForImages(page)
  await page.evaluate(() => document.fonts.ready.then(() => undefined)).catch(() => {})
  await page.waitForTimeout(SETTLE_MS)
}

async function waitForImages(page) {
  await page
    .waitForFunction(() => [...document.images].every((image) => image.complete), null, {
      timeout: IDLE_TIMEOUT_MS,
    })
    .catch(() => {})
}

/** Grows the viewport until it holds the whole document; returns the height used. */
async function fitViewport(page, viewport) {
  let height = viewport.height
  for (let pass = 0; pass < 4; pass += 1) {
    const needed = fitHeight(await page.evaluate(documentHeight), viewport.height)
    if (needed <= height) break
    height = needed
    await page.setViewportSize({ width: viewport.width, height })
    await page.waitForTimeout(RESIZE_SETTLE_MS)
    // Lazy images below the first screen start loading once they are in view.
    await waitForImages(page)
  }
  return height
}

// Runs in the page.
function documentHeight() {
  return Math.max(
    document.documentElement.scrollHeight,
    document.body ? document.body.scrollHeight : 0,
  )
}

// Runs in the page; Playwright serialises it, so it uses nothing from this
// module. Returns the theme the shell rendered with, the overflow facts and
// every text colour in use (Node keeps the red ones).
function inspectPage(limit) {
  const describe = (el) => {
    const parts = []
    for (
      let node = el;
      node && node !== document.body && parts.length < 4;
      node = node.parentElement
    ) {
      const id = node.id ? `#${node.id}` : ''
      const classes = (node.getAttribute('class') || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((name) => `.${name}`)
        .join('')
      parts.unshift(`${node.tagName.toLowerCase()}${id}${classes}`)
    }
    return parts.join(' > ')
  }
  const textOf = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
  const root = document.documentElement
  const viewport = window.innerWidth
  const all = document.body ? [...document.body.querySelectorAll('*')] : []

  const shell = document.querySelector('[data-folio]')
  const theme = {
    folio: Boolean(shell),
    dataTheme: shell ? shell.getAttribute('data-theme') : null,
    dataPalette: shell ? shell.getAttribute('data-palette') : null,
    htmlDark: root.classList.contains('dark'),
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  }

  // Wider than the viewport. A parent's scrollWidth includes an overflowing
  // child's, so only the innermost offenders are listed. `contained` means a
  // scrolling or clipping ancestor below <body> holds it, or the element
  // scrolls or clips its own content while its box stays on screen.
  const wide = all.filter((el) => el.scrollWidth > viewport)
  const wideParents = new Set()
  for (const el of wide) {
    for (let up = el.parentElement; up && !wideParents.has(up); up = up.parentElement) {
      wideParents.add(up)
    }
  }
  const innermost = wide.filter((el) => !wideParents.has(el))
  const clipsX = (el) => getComputedStyle(el).overflowX !== 'visible'
  const contained = (el, box) => {
    for (let up = el.parentElement; up && up !== document.body; up = up.parentElement) {
      if (clipsX(up)) return true
    }
    return clipsX(el) && box.left >= -0.5 && box.right <= viewport + 0.5
  }
  const elements = innermost.slice(0, limit).map((el) => {
    const box = el.getBoundingClientRect()
    return {
      selector: describe(el),
      text: textOf(el),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      left: Math.round(box.left),
      right: Math.round(box.right),
      contained: contained(el, box),
    }
  })

  // Text colours as sRGB rgba(). Computed colours in other spaces (oklch,
  // lab, color-mix results) are drawn on a 1×1 canvas and read back.
  let ctx
  const toRgba = (value) => {
    if (/^rgba?\(/.test(value)) return value
    if (ctx === undefined) {
      ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    }
    if (!ctx) return value
    ctx.fillStyle = '#010203'
    ctx.fillStyle = value
    if (ctx.fillStyle === '#010203') return value
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 100) / 100})`
  }
  const colors = new Map()
  const note = (raw, el, where, text) => {
    if (!raw) return
    const color = toRgba(raw)
    const entry = colors.get(color) || { color, count: 0, samples: [] }
    entry.count += 1
    if (entry.samples.length < 3) entry.samples.push({ selector: describe(el) + where, text })
    colors.set(color, entry)
  }
  for (const el of all) {
    if (el.getClientRects().length === 0) continue
    const style = getComputedStyle(el)
    if (style.visibility !== 'visible') continue
    const ownText = [...el.childNodes].some(
      (node) => node.nodeType === 3 && (node.textContent || '').trim() !== '',
    )
    // A filled text field shows text too; its value never goes in the report.
    const filled =
      el.matches(
        'textarea, select, input:is(:not([type]), [type=text], [type=search], [type=email], [type=number], [type=tel], [type=url])',
      ) && Boolean(el.value)
    if (ownText || filled) {
      note(el instanceof SVGElement ? style.fill : style.color, el, '', ownText ? textOf(el) : '')
    }
    for (const where of ['::before', '::after']) {
      const pseudo = getComputedStyle(el, where)
      const content = pseudo.content
      if (content && content !== 'none' && content !== 'normal' && content !== '""') {
        note(pseudo.color, el, where, content.slice(0, 60))
      }
    }
  }

  return {
    theme,
    overflow: {
      innerWidth: viewport,
      documentScrollWidth: root.scrollWidth,
      horizontalScroll: root.scrollWidth > viewport,
      wideCount: innermost.length,
      elements,
    },
    colors: [...colors.values()].sort((a, b) => b.count - a.count),
  }
}

function printShot(shot) {
  if (shot.error) {
    console.log(`FAIL ${shot.file}  ${shot.error}`)
    return
  }
  const { overflow } = shot
  console.log(
    [
      `ok   ${shot.file}`,
      `h ${shot.shotHeight}`,
      overflow.horizontalScroll
        ? `SIDE SCROLL ${overflow.documentScrollWidth} > ${overflow.innerWidth}`
        : 'no side scroll',
      `wide ${overflow.wideCount}`,
      `red ${shot.redText.length}`,
      `page errors ${shot.pageErrors.length}`,
    ].join('  '),
  )
  for (const warning of shot.warnings) console.log(`     warning: ${warning}`)
  if (shot.blockedRequests.length > 0) {
    console.log(`     blocked: ${shot.blockedRequests.join(', ')}`)
  }
}

function summarize(shots) {
  const count = (test) => shots.filter(test).length
  return {
    shots: shots.length,
    failed: count((s) => s.error !== null),
    sideScroll: count((s) => s.overflow?.horizontalScroll === true),
    wideElements: count((s) => (s.overflow?.wideCount ?? 0) > 0),
    redText: count((s) => s.redText.length > 0),
    pageErrors: count((s) => s.pageErrors.length > 0),
    warnings: count((s) => s.warnings.length > 0),
    blockedRequests: count((s) => s.blockedRequests.length > 0),
  }
}

function writeReport() {
  report.summary = summarize(report.shots)
  writeFileSync(join(out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
}

function clip(text, max = 300) {
  const line = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}
