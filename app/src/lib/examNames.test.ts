import { describe, expect, it } from 'vitest'

import { formatPass, formatSitting } from './examNames'

describe('formatSitting', () => {
  it('names a plain spring sitting', () => {
    expect(formatSitting('var-2026')).toBe('Våren 2026')
  })

  it('names a plain autumn sitting', () => {
    expect(formatSitting('host-2025')).toBe('Hösten 2025')
  })

  it('appends provtillfälle for a year with multiple sittings', () => {
    expect(formatSitting('var-2022-1')).toBe('Våren 2022 · provtillfälle 1')
    expect(formatSitting('var-2022-2')).toBe('Våren 2022 · provtillfälle 2')
  })

  it('appends version for a year with multiple exam versions', () => {
    expect(formatSitting('host-ver1-2019')).toBe('Hösten 2019 · version 1')
    expect(formatSitting('host-ver2-2019')).toBe('Hösten 2019 · version 2')
  })

  it('keeps the provtillfälle qualifier even when the bank has no sibling sitting', () => {
    // var-2018-1 has no var-2018-2 in the bank, but the `-1` is part of
    // the real exam id — grammar-faithful, documented in examNames.ts.
    expect(formatSitting('var-2018-1')).toBe('Våren 2018 · provtillfälle 1')
  })

  it('falls back to the raw id for an unrecognized shape rather than guessing', () => {
    expect(formatSitting('sommar-2030')).toBe('sommar-2030')
    expect(formatSitting('')).toBe('')
    expect(formatSitting('var-20')).toBe('var-20')
  })
})

describe('formatPass', () => {
  it('names verbal passes', () => {
    expect(formatPass('verb1')).toBe('Provpass 1')
    expect(formatPass('verb2')).toBe('Provpass 2')
  })

  it('names quant passes with the same 1/2 vocabulary', () => {
    expect(formatPass('kvant1')).toBe('Provpass 1')
    expect(formatPass('kvant2')).toBe('Provpass 2')
  })

  it('falls back to the raw code for an unrecognized shape', () => {
    expect(formatPass('verb3')).toBe('verb3')
    expect(formatPass('övning')).toBe('övning')
    expect(formatPass('')).toBe('')
  })
})
