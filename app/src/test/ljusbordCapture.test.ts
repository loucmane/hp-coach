// Pure helpers behind scripts/ljusbord-capture.mjs (LJ-03). The browser
// run itself needs the local stack, so the coordinator does that end to end.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { beforeEach, describe, expect, it } from 'vitest'

import { PALETTES as APP_PALETTES } from '@/lib/tokens'

// scripts/ is plain Node ESM outside tsconfig.app (no allowJs), so the
// module has no types; `Helpers` below types the part this test uses.
// @ts-expect-error -- untyped .mjs module
import * as untyped from '../../scripts/ljusbord-capture.helpers.mjs'

type Scheme = 'light' | 'dark'
type Device = 'dator' | 'telefon'
type CaptureArgs = {
  help: boolean
  out: string | null
  routes: string[]
  palettes: string[]
  darkOnly: boolean
  app: string
  worker: string
}
type CaptureMode = {
  device: Device
  viewport: { width: number; height: number }
  scheme: Scheme
  palette: string | null
}
type Rgba = { r: number; g: number; b: number; a: number }
type ColorUse = { color: string; count: number; samples: { selector: string; text: string }[] }
type Seed = { welcomedKey: string; uiKey: string; ui: Record<string, unknown> }
type Theme = { folio: boolean; dataTheme: string | null; dataPalette: string | null }
type Helpers = {
  MAX_SHOT_HEIGHT: number
  PALETTES: string[]
  parseArgs: (argv: string[]) => CaptureArgs
  routeSlug: (route: string) => string
  slugRoutes: (routes: string[]) => { route: string; slug: string }[]
  captureModes: (options: { palettes: string[]; darkOnly: boolean }) => CaptureMode[]
  shotFileName: (shot: {
    slug: string
    device: Device
    scheme: Scheme
    palette: string | null
  }) => string
  parseColor: (value: string) => Rgba | null
  isRed: (color: Rgba | null) => boolean
  redText: (colors: ColorUse[]) => ColorUse[]
  storageSeed: (options: { scheme: Scheme; palette?: string | null }) => Seed
  seedStorage: (seed: Seed) => void
  rewritePrefs: (body: unknown, options: { scheme: Scheme; palette?: string | null }) => unknown
  replayHeaders: (headers: Record<string, string>) => Record<string, string>
  isAccountDelete: (method: string, url: string) => boolean
  fitHeight: (needed: number, base: number) => number
  shotWarnings: (shot: {
    route: string
    finalUrl: string | null
    theme: Theme | null
    scheme: Scheme
    palette: string | null
  }) => string[]
}

const {
  MAX_SHOT_HEIGHT,
  PALETTES,
  parseArgs,
  routeSlug,
  slugRoutes,
  captureModes,
  shotFileName,
  parseColor,
  isRed,
  redText,
  storageSeed,
  seedStorage,
  rewritePrefs,
  replayHeaders,
  isAccountDelete,
  fitHeight,
  shotWarnings,
} = untyped as Helpers

const rgb = (r: number, g: number, b: number): Rgba => ({ r, g, b, a: 1 })

describe('routeSlug', () => {
  it('names the root Idag, like the r6/A shots', () => {
    expect(routeSlug('/')).toBe('idag')
    expect(routeSlug('/ova')).toBe('ova')
  })

  it('keeps the query, lower-cased, so drill states get their own files', () => {
    expect(routeSlug('/drill?section=KVA&start=true')).toBe('drill-section-kva-start-true')
  })

  it('decodes percent escapes and folds Swedish letters', () => {
    expect(routeSlug('/drill?section=L%C3%84S')).toBe('drill-section-las')
    expect(routeSlug('/lektion/Övning')).toBe('lektion-ovning')
  })

  it('survives a broken escape and caps the length without a trailing dash', () => {
    expect(routeSlug('/x%E0%A4%A')).toBe('x-e0-a4-a')
    const long = routeSlug(`/${'abc-'.repeat(40)}`)
    expect(long.length).toBeLessThanOrEqual(80)
    expect(long.endsWith('-')).toBe(false)
  })

  it('numbers routes whose slugs collide, so no shot overwrites another', () => {
    expect(slugRoutes(['/drill?section=KVA', '/drill?section=kva', '/drill-section-kva'])).toEqual([
      { route: '/drill?section=KVA', slug: 'drill-section-kva' },
      { route: '/drill?section=kva', slug: 'drill-section-kva-2' },
      { route: '/drill-section-kva', slug: 'drill-section-kva-3' },
    ])
  })
})

describe('parseArgs', () => {
  it('reads the documented command line', () => {
    expect(
      parseArgs([
        '--out',
        'shots/lj03',
        '--routes',
        '/,/ova,/drill?section=KVA&start=true',
        '--palettes',
        'spalt,sand',
        '--dark-only',
      ]),
    ).toEqual({
      help: false,
      out: 'shots/lj03',
      routes: ['/', '/ova', '/drill?section=KVA&start=true'],
      palettes: ['spalt', 'sand'],
      darkOnly: true,
      app: 'http://localhost:5173',
      worker: 'http://localhost:8787',
    })
  })

  it('splits routes only where a new route starts, and drops repeats', () => {
    const args = parseArgs([
      '--out=x',
      '--routes=/drill?sections=ORD,KVA, /ova',
      '/prov',
      '--routes',
      '/ova',
      '--app',
      'http://localhost:5174/',
    ])
    expect(args.routes).toEqual(['/drill?sections=ORD,KVA', '/ova', '/prov'])
    expect(args.palettes).toEqual([])
    expect(args.darkOnly).toBe(false)
    expect(args.app).toBe('http://localhost:5174')
  })

  it('rejects incomplete or unknown input with a reason', () => {
    expect(() => parseArgs([])).toThrow(/--out/)
    expect(() => parseArgs(['--out', 'x'])).toThrow(/--routes/)
    expect(() => parseArgs(['--out', 'x', '--routes', 'ova'])).toThrow(/start with \//)
    expect(() => parseArgs(['--out', 'x', '--routes', '/', '--palettes', 'slate'])).toThrow(
      /unknown palette "slate"/,
    )
    expect(() => parseArgs(['--out', 'x', '--routes', '/', '--zoom', '2'])).toThrow(
      /unknown option --zoom/,
    )
    expect(() => parseArgs(['--out', '--routes', '/'])).toThrow(/--out needs a value/)
    expect(() => parseArgs(['--out', 'x', '--routes', '/', '--app', 'localhost:5173'])).toThrow(
      /--app/,
    )
  })

  it('answers --help without other options', () => {
    expect(parseArgs(['--help']).help).toBe(true)
  })
})

describe('capture modes and file names', () => {
  it('shoots the 4 Ljusbord modes at the r6/A sizes, or only the 2 dark ones', () => {
    const modes = captureModes({ palettes: [], darkOnly: false })
    expect(modes.map((m) => `${m.device}-${m.scheme}`)).toEqual([
      'dator-light',
      'telefon-light',
      'dator-dark',
      'telefon-dark',
    ])
    expect(modes[0].viewport).toEqual({ width: 1440, height: 900 })
    expect(modes[1].viewport).toEqual({ width: 390, height: 844 })
    expect(modes.every((m) => m.palette === null)).toBe(true)
    expect(
      captureModes({ palettes: [], darkOnly: true }).map((m) => `${m.device}-${m.scheme}`),
    ).toEqual(['dator-dark', 'telefon-dark'])
  })

  it('repeats the modes once per requested palette', () => {
    const modes = captureModes({ palettes: ['spalt', 'sand'], darkOnly: false })
    expect(modes).toHaveLength(8)
    expect(modes.map((m) => m.palette)).toEqual([
      ...Array(4).fill('spalt'),
      ...Array(4).fill('sand'),
    ])
  })

  it('names shots <slug>-<dator|telefon>-<light|dark>[-<palette>].jpg', () => {
    expect(shotFileName({ slug: 'idag', device: 'dator', scheme: 'light', palette: null })).toBe(
      'idag-dator-light.jpg',
    )
    expect(shotFileName({ slug: 'ova', device: 'telefon', scheme: 'dark', palette: 'sand' })).toBe(
      'ova-telefon-dark-sand.jpg',
    )
  })

  it('knows exactly the palettes the app has', () => {
    expect([...PALETTES].sort()).toEqual(Object.keys(APP_PALETTES).sort())
  })
})

describe('the red test', () => {
  it('parses the colour forms a computed style can take', () => {
    expect(parseColor('rgb(21, 24, 27)')).toEqual(rgb(21, 24, 27))
    expect(parseColor('rgba(220, 38, 38, 0.5)')).toEqual({ r: 220, g: 38, b: 38, a: 0.5 })
    expect(parseColor('rgb(220 38 38 / 50%)')).toEqual({ r: 220, g: 38, b: 38, a: 0.5 })
    expect(parseColor('color(srgb 1 0 0)')).toEqual(rgb(255, 0, 0))
    expect(parseColor('#9A6300')).toEqual(rgb(154, 99, 0))
    expect(parseColor('#c00')).toEqual(rgb(204, 0, 0))
    expect(parseColor('oklch(0.6 0.2 25)')).toBeNull()
    expect(parseColor('red')).toBeNull()
  })

  it('flags r > 150, g < 90 and b < 90, and nothing on the edges', () => {
    expect(isRed(rgb(151, 89, 89))).toBe(true)
    expect(isRed(rgb(150, 0, 0))).toBe(false)
    expect(isRed(rgb(255, 90, 0))).toBe(false)
    expect(isRed(rgb(255, 0, 90))).toBe(false)
    expect(isRed(null)).toBe(false)
  })

  it('passes the Ljusbord ink and section colours and catches an error red', () => {
    for (const hex of ['#15181B', '#9A6300', '#8E4594', '#E8A93A', '#D990DF']) {
      expect(isRed(parseColor(hex)), hex).toBe(false)
    }
    expect(isRed(parseColor('#DC2626'))).toBe(true)
  })

  it('keeps only the red text colours of a page', () => {
    const red = {
      color: 'rgb(220, 38, 38)',
      count: 2,
      samples: [{ selector: 'p.fel', text: 'Fel' }],
    }
    expect(redText([{ color: 'rgb(21, 24, 27)', count: 40, samples: [] }, red])).toEqual([red])
  })
})

describe('page setup', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seeds the welcome flag, the Folio preview, the mode and the palette', () => {
    seedStorage(storageSeed({ scheme: 'dark', palette: 'sand' }))
    expect(localStorage.getItem('hpc-welcomed')).toBe('1')
    expect(JSON.parse(localStorage.getItem('hpc-ui') ?? 'null')).toEqual({
      state: { folioPreview: true, mode: 'dark', palette: 'sand' },
      version: 0,
    })
  })

  it('keeps the rest of a saved ui state, and replaces a corrupt one', () => {
    localStorage.setItem(
      'hpc-ui',
      JSON.stringify({ state: { font: 'editorial', mode: 'dark', palette: 'ink' }, version: 0 }),
    )
    seedStorage(storageSeed({ scheme: 'light' }))
    expect(JSON.parse(localStorage.getItem('hpc-ui') ?? 'null')).toEqual({
      state: { font: 'editorial', mode: 'light', palette: 'ink', folioPreview: true },
      version: 0,
    })
    localStorage.setItem('hpc-ui', 'not json')
    seedStorage(storageSeed({ scheme: 'dark' }))
    expect(JSON.parse(localStorage.getItem('hpc-ui') ?? 'null')).toEqual({
      state: { folioPreview: true, mode: 'dark' },
      version: 0,
    })
  })

  it('still works rebuilt from its source, as addInitScript runs it', () => {
    const rebuilt = new Function('seed', `(${seedStorage.toString()})(seed)`)
    rebuilt(storageSeed({ scheme: 'light' }))
    expect(JSON.parse(localStorage.getItem('hpc-ui') ?? 'null')).toEqual({
      state: { folioPreview: true, mode: 'light' },
      version: 0,
    })
  })

  it('rewrites only the mode and palette of a prefs read, without mutating it', () => {
    const body = { prefs: { palette: 'spalt', mode: 'light', font: 'editorial', dailyMinutes: 20 } }
    expect(rewritePrefs(body, { scheme: 'dark', palette: 'sand' })).toEqual({
      prefs: { palette: 'sand', mode: 'dark', font: 'editorial', dailyMinutes: 20 },
    })
    expect(rewritePrefs(body, { scheme: 'dark' })).toEqual({
      prefs: { palette: 'spalt', mode: 'dark', font: 'editorial', dailyMinutes: 20 },
    })
    expect(body.prefs.mode).toBe('light')
    expect(rewritePrefs({ error: { message: 'x' } }, { scheme: 'dark' })).toEqual({
      error: { message: 'x' },
    })
  })

  it('replays the prefs headers, CORS included, without the old length or encoding', () => {
    expect(
      replayHeaders({
        'Content-Length': '120',
        'content-encoding': 'gzip',
        'Access-Control-Allow-Origin': 'http://localhost:5173',
        'content-type': 'application/json',
      }),
    ).toEqual({
      'access-control-allow-origin': 'http://localhost:5173',
      'content-type': 'application/json',
    })
  })

  it('blocks DELETE on the account route and nothing else', () => {
    expect(isAccountDelete('DELETE', 'http://localhost:8787/api/account')).toBe(true)
    expect(isAccountDelete('delete', 'http://localhost:8787/api/account/')).toBe(true)
    expect(isAccountDelete('GET', 'http://localhost:8787/api/account')).toBe(false)
    expect(isAccountDelete('DELETE', 'http://localhost:8787/api/accounts')).toBe(false)
    expect(isAccountDelete('DELETE', 'http://localhost:8787/api/mistakes/7')).toBe(false)
  })

  it('grows the viewport to the document, within bounds', () => {
    expect(fitHeight(2413.2, 844)).toBe(2414)
    expect(fitHeight(500, 844)).toBe(844)
    expect(fitHeight(Number.NaN, 900)).toBe(900)
    expect(fitHeight(10 ** 6, 900)).toBe(MAX_SHOT_HEIGHT)
  })
})

describe('shotWarnings', () => {
  const folio: Theme = { folio: true, dataTheme: 'dark', dataPalette: 'sand' }

  it('is quiet when the shot rendered what was asked', () => {
    expect(
      shotWarnings({
        route: '/drill?section=KVA&start=true',
        finalUrl: 'http://localhost:5173/drill?section=KVA&start=true&qid=x',
        theme: folio,
        scheme: 'dark',
        palette: 'sand',
      }),
    ).toEqual([])
  })

  it('names a redirect, a missing Folio shell, and a wrong theme or palette', () => {
    expect(
      shotWarnings({
        route: '/ova',
        finalUrl: 'http://localhost:5173/sign-in',
        theme: { folio: false, dataTheme: null, dataPalette: null },
        scheme: 'light',
        palette: null,
      }),
    ).toEqual([
      'landed on /sign-in, not /ova',
      'no [data-folio] shell: the Folio preview is not on for this page',
    ])
    expect(
      shotWarnings({
        route: '/ova',
        finalUrl: 'http://localhost:5173/ova',
        theme: folio,
        scheme: 'light',
        palette: 'spalt',
      }),
    ).toEqual(['data-theme is dark, expected light', 'data-palette is sand, expected spalt'])
  })
})

// tsc and biome only cover src/, so these static checks are what stands
// between a typo in the script and a failed coordinator run.
describe('the capture script', () => {
  // A variable path, as in the guard tests: Vite rewrites a literal
  // new URL('…', import.meta.url) into a served asset URL.
  const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
  const source = read('../../scripts/ljusbord-capture.mjs')

  it('parses as a module', () => {
    const { diagnostics = [] } = ts.transpileModule(source, {
      fileName: 'ljusbord-capture.mjs',
      reportDiagnostics: true,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    })
    expect(diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([])
  })

  it('imports only names the helpers export', () => {
    const ast = ts.createSourceFile(
      'ljusbord-capture.mjs',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    )
    const names = ast.statements
      .filter(ts.isImportDeclaration)
      .filter((s) => s.moduleSpecifier.getText(ast) === "'./ljusbord-capture.helpers.mjs'")
      .flatMap((s) => {
        const bindings = s.importClause?.namedBindings
        return bindings && ts.isNamedImports(bindings)
          ? bindings.elements.map((e) => (e.propertyName ?? e.name).text)
          : []
      })
    expect(names.length).toBeGreaterThan(0)
    expect(names.filter((name) => !(name in untyped))).toEqual([])
  })

  it('documents the WSL host prefix it runs with', () => {
    expect(source).toContain(
      'env -u WAYLAND_DISPLAY -u DISPLAY LIBGL_ALWAYS_SOFTWARE=1 GALLIUM_DRIVER=llvmpipe',
    )
    expect(source).toContain('MESA_LOADER_DRIVER_OVERRIDE=llvmpipe')
  })
})
