// trapHistory — snapshot persistence + week-over-week trend computation.

import { afterEach, describe, expect, it } from 'vitest'

import { __resetTrapHistory, computeTrapTrend, recordTrapSnapshot } from './trapHistory'

const NOW = new Date(2026, 4, 22, 12) // 2026-05-22 12:00

afterEach(() => {
  __resetTrapHistory()
})

describe('recordTrapSnapshot', () => {
  it("writes today's snapshot and trims to MAX_SNAPSHOTS", () => {
    const out = recordTrapSnapshot(NOW, [{ framework_id: 'KVA-TRAP-024', count: 4 }])
    expect(out.snapshots).toHaveLength(1)
    expect(out.snapshots[0].date).toBe('2026-05-22')
    expect(out.snapshots[0].traps).toEqual([{ framework_id: 'KVA-TRAP-024', count: 4 }])
  })

  it('replaces same-date snapshots (idempotent within a day)', () => {
    recordTrapSnapshot(NOW, [{ framework_id: 'KVA-TRAP-024', count: 3 }])
    const out = recordTrapSnapshot(NOW, [{ framework_id: 'KVA-TRAP-024', count: 4 }])
    expect(out.snapshots).toHaveLength(1)
    expect(out.snapshots[0].traps[0].count).toBe(4)
  })

  it('keeps the newest snapshot at index 0', () => {
    recordTrapSnapshot(new Date(2026, 4, 20), [{ framework_id: 'A', count: 1 }])
    recordTrapSnapshot(new Date(2026, 4, 21), [{ framework_id: 'A', count: 2 }])
    const out = recordTrapSnapshot(NOW, [{ framework_id: 'A', count: 3 }])
    expect(out.snapshots.map((s) => s.date)).toEqual(['2026-05-22', '2026-05-21', '2026-05-20'])
  })
})

describe('computeTrapTrend', () => {
  it('returns unknown when no history exists', () => {
    expect(computeTrapTrend(NOW, 'KVA-TRAP-024', 4)).toEqual({ kind: 'unknown' })
  })

  it('returns delta when a 7-day-ago snapshot has the trap', () => {
    const sevenDaysAgo = new Date(2026, 4, 15) // 2026-05-15 = 7 days before NOW
    recordTrapSnapshot(sevenDaysAgo, [{ framework_id: 'KVA-TRAP-024', count: 6 }])
    const trend = computeTrapTrend(NOW, 'KVA-TRAP-024', 4)
    expect(trend).toEqual({ kind: 'delta', delta: -2, daysAgo: 7 })
  })

  it('reports kind:new when the trap is missing from the past snapshot', () => {
    const sevenDaysAgo = new Date(2026, 4, 15)
    recordTrapSnapshot(sevenDaysAgo, [{ framework_id: 'OTHER', count: 2 }])
    expect(computeTrapTrend(NOW, 'KVA-TRAP-024', 3)).toEqual({ kind: 'new' })
  })

  it('returns unknown when only too-recent snapshots exist (<5 days old)', () => {
    const yesterday = new Date(2026, 4, 21)
    recordTrapSnapshot(yesterday, [{ framework_id: 'KVA-TRAP-024', count: 6 }])
    // 1 day ago < MIN_DAYS (5) — no comparable history yet.
    expect(computeTrapTrend(NOW, 'KVA-TRAP-024', 4)).toEqual({ kind: 'unknown' })
  })

  it('falls back to a 5–10 day window when 7 days is missing', () => {
    const sixDaysAgo = new Date(2026, 4, 16) // 6 days before NOW
    recordTrapSnapshot(sixDaysAgo, [{ framework_id: 'KVA-TRAP-024', count: 5 }])
    const trend = computeTrapTrend(NOW, 'KVA-TRAP-024', 3)
    expect(trend).toEqual({ kind: 'delta', delta: -2, daysAgo: 6 })
  })

  it('picks the snapshot closest to the 7-day target when multiple are in window', () => {
    recordTrapSnapshot(new Date(2026, 4, 13), [{ framework_id: 'A', count: 8 }]) // 9 days ago
    recordTrapSnapshot(new Date(2026, 4, 15), [{ framework_id: 'A', count: 5 }]) // 7 days ago ← preferred
    recordTrapSnapshot(new Date(2026, 4, 17), [{ framework_id: 'A', count: 3 }]) // 5 days ago
    const trend = computeTrapTrend(NOW, 'A', 4)
    expect(trend).toEqual({ kind: 'delta', delta: -1, daysAgo: 7 })
  })
})
