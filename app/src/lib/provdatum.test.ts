// provdatum — the landing's single dated-config source.

import { describe, expect, it } from 'vitest'

import { getProvdatum, PROV_DATE } from './provdatum'

describe('getProvdatum', () => {
  it('derives Swedish display strings from the configured date', () => {
    if (!PROV_DATE) return // config allows null between cycles
    const p = getProvdatum(new Date(PROV_DATE.getFullYear(), 0, 1))
    expect(p).not.toBeNull()
    // 2026-10-18 is a Sunday; the strings below are the landing's
    // approved registers.
    expect(p?.label).toBe('söndag 18 oktober')
    expect(p?.dayMonth).toBe('18 oktober')
    expect(p?.short).toBe('18 okt')
  })

  it('counts whole days and never goes negative', () => {
    if (!PROV_DATE) return
    const tenDaysBefore = new Date(PROV_DATE.getTime() - 10 * 86_400_000)
    expect(getProvdatum(tenDaysBefore)?.days).toBe(10)
    // On exam day itself (afternoon) the date still stands, days = 0.
    const examAfternoon = new Date(PROV_DATE.getTime() + 14 * 3_600_000)
    expect(getProvdatum(examAfternoon)?.days).toBe(0)
  })

  it('returns null once the exam day is fully past (stale config)', () => {
    if (!PROV_DATE) return
    const dayAfter = new Date(PROV_DATE.getTime() + 2 * 86_400_000)
    expect(getProvdatum(dayAfter)).toBeNull()
  })
})
