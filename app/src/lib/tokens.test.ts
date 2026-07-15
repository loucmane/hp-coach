// Snapshot tests — pin every theme dimension so silent drift fails CI.
//
// 4 palettes × 2 modes = 8 color sets, 4 font pairings, 3 density tiers,
// plus the buildThemeVars output for the default theme. If you change a
// value intentionally, update the snapshot AND the corresponding fallback
// in src/index.css (Sand-light only) together.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  buildThemeVars,
  DEFAULT_THEME,
  DENSITIES,
  FONTS,
  PALETTES,
  type PaletteKey,
} from './tokens'

const PALETTE_KEYS: PaletteKey[] = ['sand', 'sage', 'ink', 'rose', 'spalt']

describe('design tokens', () => {
  it('palettes expose all five families', () => {
    expect(PALETTE_KEYS).toEqual(Object.keys(PALETTES))
  })

  for (const k of PALETTE_KEYS) {
    it(`palette ${k} is stable (light + dark)`, () => {
      expect(PALETTES[k]).toMatchSnapshot()
    })
  }

  it('font pairings are stable', () => {
    expect(FONTS).toMatchSnapshot()
  })

  it('density tiers are stable', () => {
    expect(DENSITIES).toMatchSnapshot()
  })

  it('buildThemeVars(default, stepwise) emits the full var set', () => {
    // Snapshot the stepwise (useFluid=false) version — fluid output
    // varies with the clamp formula and isn't a stable enough snapshot
    // target. The fluid behavior is tested separately below.
    const vars = buildThemeVars(
      DEFAULT_THEME.palette,
      DEFAULT_THEME.mode,
      DEFAULT_THEME.font,
      DEFAULT_THEME.density,
      false,
    )
    expect(vars).toMatchSnapshot()
  })

  it('buildThemeVars switches by palette', () => {
    const sand = buildThemeVars('sand', 'light', 'literary', 'regular')
    const sage = buildThemeVars('sage', 'light', 'literary', 'regular')
    expect(sand['--bg']).not.toBe(sage['--bg'])
    expect(sand['--accent']).not.toBe(sage['--accent'])
  })

  it('buildThemeVars writes density px values when useFluid=false', () => {
    const compact = buildThemeVars('sand', 'light', 'literary', 'compact', false)
    const comfy = buildThemeVars('sand', 'light', 'literary', 'comfy', false)
    expect(compact['--pad']).toBe('14px')
    expect(comfy['--pad']).toBe('22px')
    expect(compact['--fluid']).toBe('0')
    expect(comfy['--fluid']).toBe('0')
  })

  it('buildThemeVars emits clamp() density when useFluid=true (default)', () => {
    const regular = buildThemeVars('sand', 'light', 'literary', 'regular')
    expect(regular['--pad'].startsWith('clamp(')).toBe(true)
    expect(regular['--pad']).toContain('18px') // baseline value still present as floor
    expect(regular['--fluid']).toBe('1')
  })

  // The boot script in index.html inlines a palette→[lightBg, darkBg] map so
  // first paint is already in the user's --bg (kills the reload theme flash).
  // That map is a hand-copy of these palette bg values; this guard fails CI if
  // the two ever drift apart. If you change a palette's bg in tokens.ts, update
  // the BG map in index.html to match (and vice versa).
  it('index.html boot BG map matches every palette bg (no drift)', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    const mapBlock = html.match(/var BG = \{([\s\S]*?)\}/)?.[1]
    expect(mapBlock, 'BG map not found in index.html boot script').toBeTruthy()
    for (const k of PALETTE_KEYS) {
      const row = mapBlock?.match(new RegExp(`${k}:\\s*\\['([^']+)',\\s*'([^']+)'\\]`))
      expect(row, `BG map missing palette ${k}`).toBeTruthy()
      expect(row?.[1], `${k} light bg drift`).toBe(PALETTES[k].light.bg)
      expect(row?.[2], `${k} dark bg drift`).toBe(PALETTES[k].dark.bg)
    }
  })
})
