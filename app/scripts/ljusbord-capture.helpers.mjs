// Pure helpers for scripts/ljusbord-capture.mjs (LJ-03). Nothing here loads
// Playwright or touches files or the network, so the unit test
// (src/test/ljusbordCapture.test.ts) can import it. `seedStorage` is the one
// function that runs in the page: Playwright serialises it, so it must only
// use its argument and browser globals.

export const APP_URL = 'http://localhost:5173'
export const WORKER_URL = 'http://localhost:8787'

// The 4 Ljusbord modes are 2 devices × 2 colour schemes, at the sizes the
// approved r6/A shots were taken with (r6/A/_src/capture.mjs).
export const DEVICES = [
  { name: 'dator', width: 1440, height: 900 },
  { name: 'telefon', width: 390, height: 844 },
]
export const SCHEMES = ['light', 'dark']

// PaletteKey in src/lib/tokens.ts: Spalt, Sand, Salvia, Bläck and Ros.
export const PALETTES = ['spalt', 'sand', 'sage', 'ink', 'rose']

export const JPEG_QUALITY = 72
// Well above the tallest r6/A shot (about 6,000 px), and a height Chromium
// still captures in one piece.
export const MAX_SHOT_HEIGHT = 16000

export const WELCOMED_KEY = 'hpc-welcomed'
export const UI_KEY = 'hpc-ui'
export const PREFS_PATH = '/api/me/prefs'
export const ACCOUNT_PATH = '/api/account'

export const USAGE = `usage: node app/scripts/ljusbord-capture.mjs --out <dir> --routes <route,route,...>
         [--palettes ${PALETTES.join(',')}] [--dark-only]
         [--app ${APP_URL}] [--worker ${WORKER_URL}]

  --out        directory for the JPEGs and report.json (created if missing)
  --routes     app routes, each starting with /, joined by commas; quote the list
               in the shell. A comma splits only where a new route begins, so
               /drill?sections=ORD,KVA stays one route. Bare /routes count too.
  --palettes   shoot every mode once per palette, with a -<palette> file suffix
  --dark-only  shoot only the 2 dark modes
  --app        where the Vite app runs (default ${APP_URL})
  --worker     the worker checked before the run (default ${WORKER_URL}); the
               app itself calls its own VITE_API_BASE_URL`

/** Read the command line. Throws an Error that says what is wrong. */
export function parseArgs(argv) {
  const args = {
    help: false,
    out: null,
    routes: [],
    palettes: [],
    darkOnly: false,
    app: APP_URL,
    worker: WORKER_URL,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') {
      args.help = true
      continue
    }
    if (!arg.startsWith('--')) {
      if (!arg.startsWith('/')) throw new Error(`unexpected argument: ${arg}`)
      args.routes.push(...splitRoutes(arg))
      continue
    }
    const eq = arg.indexOf('=')
    const flag = eq === -1 ? arg : arg.slice(0, eq)
    const inline = eq === -1 ? null : arg.slice(eq + 1)
    const value = () => {
      const next = inline ?? argv[i + 1]
      if (next === undefined || next === '' || (inline === null && next.startsWith('--'))) {
        throw new Error(`${flag} needs a value`)
      }
      if (inline === null) i += 1
      return next
    }
    if (flag === '--out') args.out = value()
    else if (flag === '--routes') args.routes.push(...splitRoutes(value()))
    else if (flag === '--palettes') args.palettes.push(...splitList(value()))
    else if (flag === '--app') args.app = origin(flag, value())
    else if (flag === '--worker') args.worker = origin(flag, value())
    else if (flag === '--dark-only') {
      if (inline !== null) throw new Error('--dark-only takes no value')
      args.darkOnly = true
    } else throw new Error(`unknown option ${flag}`)
  }
  if (args.help) return args
  if (!args.out) throw new Error('--out <dir> is required')
  args.routes = [...new Set(args.routes)]
  if (args.routes.length === 0) throw new Error('--routes needs at least one route, such as /,/ova')
  const route = args.routes.find((r) => !r.startsWith('/'))
  if (route) throw new Error(`a route must start with /: ${route}`)
  args.palettes = [...new Set(args.palettes)]
  const palette = args.palettes.find((p) => !PALETTES.includes(p))
  if (palette) {
    throw new Error(
      `unknown palette "${palette}"; use ${PALETTES.slice(0, -1).join(', ')} or ${PALETTES.at(-1)}`,
    )
  }
  return args
}

function splitRoutes(text) {
  return text
    .split(/,\s*(?=\/)/)
    .map((route) => route.trim())
    .filter(Boolean)
}

function splitList(text) {
  return text
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function origin(flag, text) {
  let url = null
  try {
    url = new URL(text)
  } catch {
    // Reported below.
  }
  if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    throw new Error(`${flag} must be an http(s) URL: ${text}`)
  }
  return url.origin
}

/**
 * File-name slug for a route. `/` is Idag, as in the r6/A shot names. The
 * query stays in, so each drill state gets its own files:
 * `/drill?section=KVA&start=true` → `drill-section-kva-start-true`.
 */
export function routeSlug(route) {
  let text = String(route)
  try {
    text = decodeURIComponent(text)
  } catch {
    // A broken escape stays as typed.
  }
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
  return slug || 'idag'
}

/** Slugs for a route list; a collision gets -2, -3, … so no shot overwrites another. */
export function slugRoutes(routes) {
  const used = new Set()
  return routes.map((route) => {
    const base = routeSlug(route)
    let slug = base
    for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`
    used.add(slug)
    return { route, slug }
  })
}

/** One entry per browser context: palette (or none) × scheme × device. */
export function captureModes({ palettes = [], darkOnly = false } = {}) {
  const schemes = darkOnly ? ['dark'] : SCHEMES
  const modes = []
  for (const palette of palettes.length > 0 ? palettes : [null]) {
    for (const scheme of schemes) {
      for (const device of DEVICES) {
        modes.push({
          device: device.name,
          viewport: { width: device.width, height: device.height },
          scheme,
          palette,
        })
      }
    }
  }
  return modes
}

/** `<slug>-<dator|telefon>-<light|dark>[-<palette>].jpg` */
export function shotFileName({ slug, device, scheme, palette }) {
  return `${slug}-${device}-${scheme}${palette ? `-${palette}` : ''}.jpg`
}

/**
 * sRGB channels (0–255) and alpha of a computed CSS colour, or null for a
 * form this does not read. The page converts other forms (oklch, lab, …)
 * to rgba() before they get here.
 */
export function parseColor(value) {
  const text = String(value ?? '')
    .trim()
    .toLowerCase()
  const num = (part, scale) =>
    part.endsWith('%') ? (Number.parseFloat(part) / 100) * scale : Number.parseFloat(part)
  let m = text.match(
    /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/,
  )
  if (m) {
    return {
      r: num(m[1], 255),
      g: num(m[2], 255),
      b: num(m[3], 255),
      a: m[4] === undefined ? 1 : num(m[4], 1),
    }
  }
  m = text.match(/^color\(\s*srgb\s+([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/)
  if (m) {
    return {
      r: num(m[1], 1) * 255,
      g: num(m[2], 1) * 255,
      b: num(m[3], 1) * 255,
      a: m[4] === undefined ? 1 : num(m[4], 1),
    }
  }
  m = text.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/)
  if (m) {
    const hex = m[1].length <= 4 ? [...m[1]].map((c) => c + c).join('') : m[1]
    const byte = (at) => Number.parseInt(hex.slice(at, at + 2), 16)
    return { r: byte(0), g: byte(2), b: byte(4), a: hex.length === 8 ? byte(6) / 255 : 1 }
  }
  return null
}

/** The owner's "no red anywhere" test: r > 150, g < 90 and b < 90. */
export function isRed(color) {
  return Boolean(color) && color.r > 150 && color.g < 90 && color.b < 90
}

/** The text colours of a page (with where they are used) that fail the red test. */
export function redText(colors) {
  return colors.filter((entry) => isRed(parseColor(entry.color)))
}

/** The argument `seedStorage` gets for one mode. */
export const FOLIO_PREFS_KEY = 'hpc-folio-prefs'

export function storageSeed({ scheme, palette = null }) {
  const ui = { folioPreview: true, mode: scheme }
  if (palette) ui.palette = palette
  // The Ljusbord root reads the Folio prefs (LJ-05): theme 'system' follows
  // the context's colorScheme, and the palette must be seeded there too.
  const folio = { theme: 'system' }
  if (palette) folio.palette = palette
  return { welcomedKey: WELCOMED_KEY, uiKey: UI_KEY, ui, folioKey: FOLIO_PREFS_KEY, folio }
}

/**
 * Init script: runs in the page before the app on every navigation. Marks
 * the user as welcomed and merges the Folio preview, mode and palette into
 * the persisted `hpc-ui` store (zustand's { state, version } shape), keeping
 * everything else already saved there.
 */
export function seedStorage({ welcomedKey, uiKey, ui, folioKey, folio }) {
  try {
    localStorage.setItem(welcomedKey, '1')
    const merge = (key, patch, fallbackVersion) => {
      let saved = null
      try {
        saved = JSON.parse(localStorage.getItem(key) || 'null')
      } catch {
        saved = null
      }
      const state = saved && typeof saved.state === 'object' && saved.state ? saved.state : {}
      const version = saved && typeof saved.version === 'number' ? saved.version : fallbackVersion
      localStorage.setItem(key, JSON.stringify({ state: { ...state, ...patch }, version }))
    }
    merge(uiKey, ui, 0)
    if (folioKey && folio) merge(folioKey, folio, 1)
  } catch {
    // No storage on this page (an error page, say); the report shows the result.
  }
}

/**
 * The GET /api/me/prefs body with the mode, and the palette when one is
 * asked for, replaced. The app re-applies server prefs whenever they load,
 * so this keeps the shot's theme. Nothing is ever written to the account.
 */
export function rewritePrefs(body, { scheme, palette = null }) {
  if (!body || typeof body !== 'object' || !body.prefs || typeof body.prefs !== 'object') {
    return body
  }
  const prefs = { ...body.prefs, mode: scheme }
  if (palette) prefs.palette = palette
  return { ...body, prefs }
}

/**
 * Headers to send with a rewritten body: the original ones (CORS included)
 * minus the length and encoding, which described the original bytes.
 */
export function replayHeaders(headers) {
  const out = {}
  for (const [name, value] of Object.entries(headers)) {
    const key = name.toLowerCase()
    if (key === 'content-length' || key === 'content-encoding' || key === 'transfer-encoding') {
      continue
    }
    out[key] = value
  }
  return out
}

/** True for the request that would delete the account: DELETE /api/account[/…]. */
export function isAccountDelete(method, url) {
  if (String(method).toUpperCase() !== 'DELETE') return false
  let pathname = ''
  try {
    pathname = new URL(url).pathname
  } catch {
    return false
  }
  return pathname === ACCOUNT_PATH || pathname.startsWith(`${ACCOUNT_PATH}/`)
}

/** Viewport height for a full-page shot: the document's, never below the device's. */
export function fitHeight(needed, base) {
  const height = Number.isFinite(needed) ? Math.ceil(needed) : base
  return Math.min(Math.max(height, base), MAX_SHOT_HEIGHT)
}

/** What a shot rendered differently from what was asked. */
export function shotWarnings({ route, finalUrl, theme, scheme, palette }) {
  const warnings = []
  const wanted = new URL(route, APP_URL).pathname
  const landed = finalUrl ? new URL(finalUrl).pathname : null
  if (landed !== null && landed !== wanted) warnings.push(`landed on ${landed}, not ${wanted}`)
  if (!theme || !theme.folio) {
    warnings.push('no [data-folio] shell: the Folio preview is not on for this page')
    return warnings
  }
  if (theme.dataTheme !== scheme) {
    warnings.push(`data-theme is ${theme.dataTheme}, expected ${scheme}`)
  }
  if (palette && theme.dataPalette !== palette) {
    warnings.push(`data-palette is ${theme.dataPalette}, expected ${palette}`)
  }
  return warnings
}
