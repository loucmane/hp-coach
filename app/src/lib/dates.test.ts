import { afterEach, describe, expect, it, vi } from 'vitest'

import { daysUntil, EXAM_SITTINGS, formatSwedishHeader, nextSitting, resolveSitting } from './dates'

afterEach(() => {
  vi.useRealTimers()
})

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
  it('returns 165 for 6 May 2026 → 18 Oct 2026 (höstprov 26)', () => {
    const from = new Date(2026, 4, 6)
    const target = new Date(2026, 9, 18)
    expect(daysUntil(target, from)).toBe(165)
  })

  it('returns 0 the day of the exam', () => {
    const target = new Date(2026, 9, 18, 23, 59, 59)
    const from = new Date(2026, 9, 18, 0, 0, 0)
    expect(daysUntil(target, from)).toBe(0)
  })

  it('returns 1 the day before', () => {
    expect(daysUntil(new Date(2026, 9, 18), new Date(2026, 9, 17))).toBe(1)
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
  it('exposes höstprov 26, vårprov 27 and höstprov 27 with stable ids', () => {
    expect(EXAM_SITTINGS.map((s) => s.id)).toEqual(['host-2026', 'var-2027', 'host-2027'])
    expect(EXAM_SITTINGS.map((s) => s.label)).toEqual(['Höstprov 26', 'Vårprov 27', 'Höstprov 27'])
  })

  it('carries the official dates at local midnight', () => {
    const [autumn, spring, nextAutumn] = EXAM_SITTINGS
    // Höstprov 26: Sunday 18 October 2026. Vårprov 27: Saturday 10 April 2027.
    expect(autumn.date).toEqual(new Date(2026, 9, 18))
    expect(autumn.date.getDay()).toBe(0)
    expect(spring.date).toEqual(new Date(2027, 3, 10))
    expect(spring.date.getDay()).toBe(6)
    expect(nextAutumn.date).toEqual(new Date(2027, 9, 24))
    expect(nextAutumn.date.getDay()).toBe(0)
  })

  it('is listed in chronological order', () => {
    const times = EXAM_SITTINGS.map((s) => s.date.getTime())
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })
})

// Pin exam-day retention and the midnight rollovers between sittings,
// including the end of the configured calendar.
const BEFORE = new Date(2026, 9, 1, 12, 0)
const EXAM_MORNING = new Date(2026, 9, 18, 9, 0)
const EXAM_EVENING = new Date(2026, 9, 18, 23, 30)
const AFTER = new Date(2026, 9, 19, 0, 30)
const SPRING_EVENING = new Date(2027, 3, 10, 23, 59, 59)
const AFTER_SPRING = new Date(2027, 3, 11)
const LAST_EVENING = new Date(2027, 9, 24, 23, 59, 59)
const AFTER_LAST = new Date(2027, 9, 25)

describe('nextSitting', () => {
  it('is höstprov 26 before its exam day', () => {
    expect(nextSitting(BEFORE)?.id).toBe('host-2026')
  })

  it('stays höstprov 26 through the whole exam day', () => {
    expect(nextSitting(EXAM_MORNING)?.id).toBe('host-2026')
    expect(nextSitting(EXAM_EVENING)?.id).toBe('host-2026')
  })

  it('rolls to vårprov 27 from the local midnight after the exam day', () => {
    expect(nextSitting(AFTER)?.id).toBe('var-2027')
  })

  it('keeps vårprov 27 through exam day, then rolls to höstprov 27 at midnight', () => {
    expect(nextSitting(SPRING_EVENING)?.id).toBe('var-2027')
    expect(nextSitting(AFTER_SPRING)?.id).toBe('host-2027')
  })

  it('is null once every configured sitting is over', () => {
    expect(nextSitting(LAST_EVENING)?.id).toBe('host-2027')
    expect(nextSitting(AFTER_LAST)).toBeNull()
  })

  it('reads the system clock when no instant is passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(EXAM_EVENING)
    expect(nextSitting()?.id).toBe('host-2026')
    vi.setSystemTime(AFTER)
    expect(nextSitting()?.id).toBe('var-2027')
  })
})

describe('resolveSitting', () => {
  it('keeps a saved target that is not over', () => {
    expect(resolveSitting('host-2026', BEFORE)?.id).toBe('host-2026')
    expect(resolveSitting('host-2026', EXAM_EVENING)?.id).toBe('host-2026')
    // A later target stays put even while an earlier sitting is still ahead.
    expect(resolveSitting('var-2027', BEFORE)?.id).toBe('var-2027')
    expect(resolveSitting('host-2027', BEFORE)?.id).toBe('host-2027')
    expect(resolveSitting('var-2027', SPRING_EVENING)?.id).toBe('var-2027')
    expect(resolveSitting('host-2027', LAST_EVENING)?.id).toBe('host-2027')
  })

  it('rolls a saved höstprov 26 target forward to vårprov 27 on 19 October', () => {
    expect(resolveSitting('host-2026', AFTER)?.id).toBe('var-2027')
  })

  it.each([
    'host-2026',
    'var-2027',
    'unknown',
    null,
    undefined,
  ])('rolls an expired, missing or unknown target (%s) to höstprov 27 after spring', (id) => {
    expect(resolveSitting(id, AFTER_SPRING)?.id).toBe('host-2027')
  })

  it('resolves a missing or unknown id to the next sitting not yet over', () => {
    expect(resolveSitting(null, BEFORE)?.id).toBe('host-2026')
    expect(resolveSitting(undefined, EXAM_MORNING)?.id).toBe('host-2026')
    expect(resolveSitting(null, AFTER)?.id).toBe('var-2027')
    expect(resolveSitting('host-9999', AFTER)?.id).toBe('var-2027')
  })

  it('is null once every configured sitting is over', () => {
    expect(resolveSitting('host-2026', AFTER_LAST)).toBeNull()
    expect(resolveSitting('var-2027', AFTER_LAST)).toBeNull()
    expect(resolveSitting('host-2027', AFTER_LAST)).toBeNull()
    expect(resolveSitting(null, AFTER_LAST)).toBeNull()
  })

  it('reads the system clock when no instant is passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(AFTER)
    expect(resolveSitting('host-2026')?.id).toBe('var-2027')
  })
})
