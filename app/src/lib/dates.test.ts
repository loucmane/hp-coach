import { describe, expect, it } from 'vitest'

import { daysUntil, EXAM_SITTINGS, formatSwedishHeader } from './dates'

describe('formatSwedishHeader', () => {
  it('matches the prototype format "Onsdag · 6 maj"', () => {
    // 6 May 2026 is a Wednesday (Onsdag).
    expect(formatSwedishHeader(new Date(2026, 4, 6))).toBe('Onsdag · 6 maj')
  })

  it('uses lowercase month abbreviations', () => {
    expect(formatSwedishHeader(new Date(2026, 0, 1))).toBe('Torsdag · 1 jan')
    expect(formatSwedishHeader(new Date(2026, 11, 31))).toBe('Torsdag · 31 dec')
  })
})

describe('daysUntil', () => {
  it('returns 172 for 6 May 2026 → 25 Oct 2026 (höstprov 26)', () => {
    const from = new Date(2026, 4, 6)
    const target = new Date(2026, 9, 25)
    expect(daysUntil(target, from)).toBe(172)
  })

  it('returns 0 the day of the exam', () => {
    const target = new Date(2026, 9, 25, 23, 59, 59)
    const from = new Date(2026, 9, 25, 0, 0, 0)
    expect(daysUntil(target, from)).toBe(0)
  })

  it('returns 1 the day before', () => {
    expect(daysUntil(new Date(2026, 9, 25), new Date(2026, 9, 24))).toBe(1)
  })

  it('returns negative when the target has passed', () => {
    expect(daysUntil(new Date(2026, 4, 1), new Date(2026, 4, 6))).toBe(-5)
  })

  it('handles a DST-spanning interval correctly', () => {
    // Mar 28 → Apr 4 spans the EU spring DST switch (last Sunday of March).
    expect(daysUntil(new Date(2027, 3, 4), new Date(2027, 2, 28))).toBe(7)
  })
})

describe('EXAM_SITTINGS', () => {
  it('exposes höstprov 26 and vårprov 27 with stable ids', () => {
    expect(EXAM_SITTINGS.map((s) => s.id)).toEqual(['host-2026', 'var-2027'])
  })
})
