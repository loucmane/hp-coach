// /dev/ovningstext-bakeoff — the bundle boundary. The route module itself is
// in the entry bundle (routeTree.gen imports it eagerly; autoCodeSplitting
// splits off `component` only), so it reaches the page, its scenes and the
// P5 fixture through import() alone. Two guards:
//   1. KEYS — validateSearch's inline keys match the page's variants and
//      scenes, the price of not importing them.
//   2. SOURCE — the module has no static import from components/devbake
//      (`import type` is fine: it is erased at build time).

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { SCENES } from '@/components/devbake/OvningstextBakeoff'
import { VARIANTS } from '@/components/devbake/OvningstextKit'
import { SCENE_KEYS, VARIANT_KEYS, validateSearch } from './dev_.ovningstext-bakeoff'

const HERE = path.dirname(fileURLToPath(import.meta.url))

// A static import declaration's module specifier. `[^'"]` keeps a match
// inside one statement; `import type` and import() never match.
const STATIC_IMPORT_RE = /^import\s+(?!type\s)(?:[^'"]*?\sfrom\s+)?'([^']+)'/gm

describe('/dev/ovningstext-bakeoff route', () => {
  it('accepts exactly the page’s variants and scenes', () => {
    expect([...VARIANT_KEYS]).toEqual(VARIANTS.map((v) => v.key))
    expect([...SCENE_KEYS]).toEqual(SCENES.map((s) => s.key))
  })

  it('reads the selection from the URL and drops anything else', () => {
    expect(validateSearch({ v: 'b', s: '7', frame: '1' })).toEqual({ v: 'b', s: 7, frame: true })
    expect(validateSearch({ v: 'c', s: 3 })).toEqual({ v: 'c', s: 3 })
    expect(validateSearch({ v: 'd', s: '8', frame: '0' })).toEqual({})
  })

  it('reaches the page only through import()', () => {
    const source = readFileSync(path.join(HERE, 'dev_.ovningstext-bakeoff.tsx'), 'utf8')
    const specifiers = [...source.matchAll(STATIC_IMPORT_RE)].map((m) => m[1])
    // The pattern sees the module's real imports…
    expect(specifiers).toContain('@tanstack/react-router')
    // …and none of them is a bake-off module.
    expect(specifiers.filter((s) => s.includes('/devbake/'))).toEqual([])
    expect(source).toMatch(/import\(\s*'@\/components\/devbake\/OvningstextBakeoff'\s*\)/)
  })
})
