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

const PALETTE_KEYS: PaletteKey[] = ['sand', 'sage', 'ink', 'rose']

describe('design tokens', () => {
  it('palettes expose all four families', () => {
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

  it('buildThemeVars(default) emits the full var set', () => {
    const vars = buildThemeVars(
      DEFAULT_THEME.palette,
      DEFAULT_THEME.mode,
      DEFAULT_THEME.font,
      DEFAULT_THEME.density,
    )
    expect(vars).toMatchSnapshot()
  })

  it('buildThemeVars switches by palette', () => {
    const sand = buildThemeVars('sand', 'light', 'literary', 'regular')
    const sage = buildThemeVars('sage', 'light', 'literary', 'regular')
    expect(sand['--bg']).not.toBe(sage['--bg'])
    expect(sand['--accent']).not.toBe(sage['--accent'])
  })

  it('buildThemeVars writes density px values', () => {
    const compact = buildThemeVars('sand', 'light', 'literary', 'compact')
    const comfy = buildThemeVars('sand', 'light', 'literary', 'comfy')
    expect(compact['--pad']).toBe('14px')
    expect(comfy['--pad']).toBe('22px')
  })
})
