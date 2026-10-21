// provdatum — the landing's dated strings, derived from the shared exam
// calendar (lib/dates EXAM_SITTINGS). Every test injects or freezes `now`.

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getProvdatum } from './provdatum'

afterEach(() => {
  vi.useRealTimers()
})

describe('getProvdatum', () => {
  it('counts down to höstprov 26 before its exam day', () => {
    const p = getProvdatum(new Date(2026, 9, 1, 12, 0))
    expect(p?.date).toEqual(new Date(2026, 9, 18))
    expect(p?.days).toBe(17)
    // 2026-10-18 is a Sunday; the strings below are the landing's
    // approved registers.
    expect(p?.label).toBe('söndag 18 oktober')
    expect(p?.dayMonth).toBe('18 oktober')
    expect(p?.short).toBe('18 okt')
  })

  it('counts calendar days: the evening before reads 1', () => {
    expect(getProvdatum(new Date(2026, 9, 17, 23, 30))?.days).toBe(1)
  })

  it('keeps the date with days = 0 through the whole exam day', () => {
    for (const now of [new Date(2026, 9, 18, 9, 0), new Date(2026, 9, 18, 23, 30)]) {
      const p = getProvdatum(now)
      expect(p?.label).toBe('söndag 18 oktober')
      expect(p?.days).toBe(0)
    }
  })

  it('rolls to vårprov 27 from the midnight after the exam day', () => {
    const p = getProvdatum(new Date(2026, 9, 19, 0, 30))
    expect(p?.date).toEqual(new Date(2027, 3, 10))
    expect(p?.days).toBe(173)
    // 2027-04-10 is a Saturday.
    expect(p?.label).toBe('lördag 10 april')
    expect(p?.dayMonth).toBe('10 april')
    expect(p?.short).toBe('10 apr')
  })

  it('returns null only once every configured sitting is over', () => {
    expect(getProvdatum(new Date(2027, 3, 10, 23, 30))?.days).toBe(0)
    expect(getProvdatum(new Date(2027, 9, 24, 23, 30))?.days).toBe(0)
    expect(getProvdatum(new Date(2027, 9, 25, 0, 30))).toBeNull()
  })

  it('reads the system clock when no instant is passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 18, 9, 0))
    expect(getProvdatum()?.label).toBe('söndag 18 oktober')
    vi.setSystemTime(new Date(2026, 9, 19, 0, 30))
    expect(getProvdatum()?.label).toBe('lördag 10 april')
  })
})
