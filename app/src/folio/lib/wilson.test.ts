import { describe, expect, it } from 'vitest'

import { wilson } from './wilson'

describe('wilson: the 95 % Wilson interval', () => {
  it('gives about 55–95 % for 10 right of 12', () => {
    const { low, high } = wilson(10, 12)
    expect(low).toBeCloseTo(0.552, 3)
    expect(high).toBeCloseTo(0.953, 3)
    expect(Math.round(low * 100)).toBe(55)
    expect(Math.round(high * 100)).toBe(95)
  })

  it('claims nothing without answers: n = 0 is the whole range', () => {
    expect(wilson(0, 0)).toEqual({ low: 0, high: 1 })
  })

  it('starts exactly at 0 when none are right', () => {
    const { low, high } = wilson(0, 12)
    expect(low).toBe(0)
    expect(high).toBeCloseTo(0.2425, 3)
  })

  it('ends exactly at 1 when all are right', () => {
    const { low, high } = wilson(12, 12)
    expect(high).toBe(1)
    expect(low).toBeCloseTo(0.7575, 3)
  })

  it('stays inside 0–1, brackets the observed rate and mirrors k ↔ n − k', () => {
    for (let n = 1; n <= 40; n++) {
      for (let k = 0; k <= n; k++) {
        const { low, high } = wilson(k, n)
        expect(low).toBeGreaterThanOrEqual(0)
        expect(high).toBeLessThanOrEqual(1)
        expect(low).toBeLessThanOrEqual(k / n)
        expect(high).toBeGreaterThanOrEqual(k / n)
        expect(low).toBeCloseTo(1 - wilson(n - k, n).high, 12)
      }
    }
  })

  it('narrows as the evidence grows', () => {
    const width = ({ low, high }: { low: number; high: number }) => high - low
    expect(width(wilson(80, 100))).toBeLessThan(width(wilson(8, 10)))
    expect(width(wilson(800, 1000))).toBeLessThan(width(wilson(80, 100)))
  })

  it('reads impossible counts honestly instead of throwing', () => {
    expect(wilson(13, 12)).toEqual(wilson(12, 12))
    expect(wilson(-1, 12)).toEqual(wilson(0, 12))
    expect(wilson(Number.NaN, 12)).toEqual({ low: 0, high: 1 })
    expect(wilson(3, -1)).toEqual({ low: 0, high: 1 })
    expect(wilson(3, Number.POSITIVE_INFINITY)).toEqual({ low: 0, high: 1 })
  })
})
