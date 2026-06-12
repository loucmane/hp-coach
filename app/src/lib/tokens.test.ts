// Snapshot tests — pin every theme dimension so silent drift fails CI.
//
// 4 palettes × 2 modes = 8 color sets, 4 font pairings, 3 density tiers,
// plus the buildThemeVars output for the default theme. If you change a
// value intentionally, update the snapshot AND the corresponding fallback
// in src/index.css (Sand-light only) together.

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
})
