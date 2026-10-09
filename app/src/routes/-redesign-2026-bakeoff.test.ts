// /dev/redesign-2026-bakeoff — the bundle boundary. The route module is in
// the entry bundle (routeTree.gen imports it eagerly; autoCodeSplitting
// splits off `component` only), so it reaches the page, the four directions,
// their fixtures and fonts through import() alone. Three guards:
//   1. KEYS — validateSearch's inline keys match the page's metadata, the
//      price of not importing it.
//   2. SEARCH — the selection round-trips from the URL and junk is dropped.
//   3. SOURCE — the module has no static import from components/devbake
//      (`import type` is fine: it is erased at build time).

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { DIRECTIONS, SCREENS, THEMES, WIDTHS } from '@/components/devbake/redesign/r1Kit'
import {
  DIRECTION_KEYS,
  SCREEN_KEYS,
  THEME_KEYS,
  validateSearch,
  WIDTH_KEYS,
} from './dev_.redesign-2026-bakeoff'

const HERE = path.dirname(fileURLToPath(import.meta.url))

// A static import declaration's module specifier. `[^'"]` keeps a match
// inside one statement; `import type` and import() never match.
const STATIC_IMPORT_RE = /^import\s+(?!type\s)(?:[^'"]*?\sfrom\s+)?'([^']+)'/gm

describe('/dev/redesign-2026-bakeoff route', () => {
  it('accepts exactly the page’s directions, screens, widths and themes', () => {
    expect([...DIRECTION_KEYS]).toEqual(DIRECTIONS.map((d) => d.key))
    expect([...SCREEN_KEYS]).toEqual(SCREENS.map((s) => s.key))
    expect([...WIDTH_KEYS]).toEqual(WIDTHS.map((w) => w.key))
    expect([...THEME_KEYS]).toEqual(THEMES.map((t) => t.key))
  })

  it('reads the selection from the URL and drops anything else', () => {
    expect(validateSearch({ d: 'b', s: '2', w: 'phone', t: 'dark' })).toEqual({
      d: 'b',
      s: 2,
      w: 'phone',
      t: 'dark',
    })
    expect(validateSearch({ d: 'd', s: 4, sbs: '1', bare: 'true' })).toEqual({
      d: 'd',
      s: 4,
      sbs: true,
      bare: true,
    })
    expect(validateSearch({ d: 'e', s: '5', w: 'tablet', t: 'sepia', sbs: '0' })).toEqual({})
  })

  it('reaches the page only through import()', () => {
    const source = readFileSync(path.join(HERE, 'dev_.redesign-2026-bakeoff.tsx'), 'utf8')
    const specifiers = [...source.matchAll(STATIC_IMPORT_RE)].map((m) => m[1])
    // The pattern sees the module's real imports…
    expect(specifiers).toContain('@tanstack/react-router')
    // …and none of them is a bake-off module.
    expect(specifiers.filter((s) => s.includes('/devbake/'))).toEqual([])
    expect(source).toMatch(
      /import\(\s*'@\/components\/devbake\/redesign\/Redesign2026Bakeoff'\s*\)/,
    )
  })
})
