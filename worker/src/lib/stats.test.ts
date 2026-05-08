// Streak math. Pure-function tests; no DB, no clock side effects.

import { describe, expect, it } from 'vitest'

import { currentStreak, formatDayUTC, previousDay } from './stats'

const NOW = new Date('2026-05-08T10:00:00Z')

describe('formatDayUTC', () => {
  it('formats a Date as YYYY-MM-DD in UTC', () => {
    expect(formatDayUTC(NOW)).toBe('2026-05-08')
  })

  it('does not shift to local timezone', () => {
    // Late-evening Stockholm is still the same UTC day until 22:00.
    const stockholm21 = new Date('2026-05-08T21:00:00Z')
    expect(formatDayUTC(stockholm21)).toBe('2026-05-08')
  })

  it('zero-pads single-digit months and days', () => {
    expect(formatDayUTC(new Date('2026-01-05T00:00:00Z'))).toBe('2026-01-05')
  })
})

describe('previousDay', () => {
  it('subtracts one day, staying within a month', () => {
    expect(previousDay('2026-05-08')).toBe('2026-05-07')
  })

  it('crosses a month boundary', () => {
    expect(previousDay('2026-05-01')).toBe('2026-04-30')
  })

  it('crosses a year boundary', () => {
    expect(previousDay('2026-01-01')).toBe('2025-12-31')
  })
})

describe('currentStreak', () => {
  it('returns 0 when there is no activity', () => {
    expect(currentStreak([], NOW)).toBe(0)
  })

  it('returns 0 when the most recent activity is older than yesterday', () => {
    // 3 days ago — streak is broken.
    expect(currentStreak(['2026-05-05'], NOW)).toBe(0)
  })

  it('counts a single-day streak when today is the only active day', () => {
    expect(currentStreak(['2026-05-08'], NOW)).toBe(1)
  })

  it('counts a single-day streak when yesterday is the most recent', () => {
    // User opens the app today before drilling — streak should still
    // be alive from yesterday's session.
    expect(currentStreak(['2026-05-07'], NOW)).toBe(1)
  })

  it('counts consecutive days descending from today', () => {
    expect(currentStreak(['2026-05-08', '2026-05-07', '2026-05-06'], NOW)).toBe(3)
  })

  it('stops at the first gap', () => {
    // Active today, yesterday, then a gap before further history.
    expect(
      currentStreak(['2026-05-08', '2026-05-07', '2026-05-04', '2026-05-03'], NOW),
    ).toBe(2)
  })

  it('handles a long unbroken streak across a month boundary', () => {
    const days: string[] = []
    // 35 days back from 2026-05-08 includes April → March crossover.
    let cursor = '2026-05-08'
    for (let i = 0; i < 35; i++) {
      days.push(cursor)
      cursor = previousDay(cursor)
    }
    expect(currentStreak(days, NOW)).toBe(35)
  })
})
