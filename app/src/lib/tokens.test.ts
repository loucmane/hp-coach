// Snapshot test — pins the Sand palette so silent drift fails CI.
// If a value here intentionally changes, update the snapshot AND
// the corresponding OKLCH variable in src/index.css together.

import { describe, expect, it } from 'vitest'

import { DENSITY, FONTS, PALETTE, SAND_DARK, SAND_LIGHT } from './tokens'

describe('design tokens', () => {
  it('Sand light palette is stable', () => {
    expect(SAND_LIGHT).toMatchSnapshot()
  })

  it('Sand dark palette is stable', () => {
    expect(SAND_DARK).toMatchSnapshot()
  })

  it('PALETTE indexes both modes', () => {
    expect(PALETTE.light).toBe(SAND_LIGHT)
    expect(PALETTE.dark).toBe(SAND_DARK)
  })

  it('density tiers expose the four density vars', () => {
    expect(Object.keys(DENSITY.regular).sort()).toEqual(['gap', 'pad', 'padLg', 'radius'])
    expect(Object.keys(DENSITY.compact).sort()).toEqual(['gap', 'pad', 'padLg', 'radius'])
  })

  it('FONTS stack is stable', () => {
    expect(FONTS).toMatchSnapshot()
  })
})
