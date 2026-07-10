import { describe, expect, it } from 'vitest'

import {
  type DeclineRecord,
  decodeTreatedMarker,
  detectHotTrap,
  encodeTreatedMarker,
  recordDecline,
  sectionFromFrameworkId,
  type TrapMistake,
  type TreatedTrap,
} from './adaptiveReview'

const NOW = new Date('2026-07-10T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000

/** N mistakes on one framework, each `daysAgo` before NOW. */
function mistakes(framework_id: string, count: number, daysAgo: number): TrapMistake[] {
  return Array.from({ length: count }, () => ({
    framework_id,
    at: NOW.getTime() - daysAgo * DAY,
  }))
}

describe('detectHotTrap — threshold', () => {
  it('fires at exactly 3 in-window mistakes', () => {
    const hot = detectHotTrap({ now: NOW, mistakes: mistakes('DTK-TACTIC-004', 3, 1) })
    expect(hot).toEqual({ framework_id: 'DTK-TACTIC-004', count: 3 })
  })

  it('does NOT fire at 2 mistakes', () => {
    const hot = detectHotTrap({ now: NOW, mistakes: mistakes('DTK-TACTIC-004', 2, 1) })
    expect(hot).toBeNull()
  })

  it('returns null when there are no mistakes', () => {
    expect(detectHotTrap({ now: NOW, mistakes: [] })).toBeNull()
  })

  it('picks the framework with the most in-window mistakes', () => {
    const hot = detectHotTrap({
      now: NOW,
      mistakes: [...mistakes('KVA-TRAP-001', 3, 1), ...mistakes('NOG-TRAP-002', 4, 2)],
    })
    expect(hot?.framework_id).toBe('NOG-TRAP-002')
    expect(hot?.count).toBe(4)
  })

  it('breaks count ties deterministically by framework_id', () => {
    const hot = detectHotTrap({
      now: NOW,
      mistakes: [...mistakes('XYZ-B-002', 3, 1), ...mistakes('KVA-A-001', 3, 1)],
    })
    expect(hot?.framework_id).toBe('KVA-A-001')
  })
})

describe('detectHotTrap — 7-day window edge', () => {
  it('counts a mistake just inside the 7-day window', () => {
    // 6d 23h ago — inside.
    const at = NOW.getTime() - (7 * DAY - 60 * 60 * 1000)
    const ms: TrapMistake[] = [{ framework_id: 'DTK-X', at }, ...mistakes('DTK-X', 2, 1)]
    expect(detectHotTrap({ now: NOW, mistakes: ms })?.count).toBe(3)
  })

  it('excludes a mistake just outside the 7-day window', () => {
    // 7d 1h ago — outside; leaves only 2 in-window → no hot trap.
    const at = NOW.getTime() - (7 * DAY + 60 * 60 * 1000)
    const ms: TrapMistake[] = [{ framework_id: 'DTK-X', at }, ...mistakes('DTK-X', 2, 1)]
    expect(detectHotTrap({ now: NOW, mistakes: ms })).toBeNull()
  })

  it('ignores future-dated mistakes (clock skew guard)', () => {
    const ms: TrapMistake[] = [
      { framework_id: 'DTK-X', at: NOW.getTime() + DAY },
      ...mistakes('DTK-X', 2, 1),
    ]
    expect(detectHotTrap({ now: NOW, mistakes: ms })).toBeNull()
  })
})

describe('detectHotTrap — treated exclusion', () => {
  it('suppresses a trap treated within the last 7 days', () => {
    const treated: TreatedTrap[] = [{ framework_id: 'DTK-TACTIC-004', at: NOW.getTime() - 2 * DAY }]
    const hot = detectHotTrap({
      now: NOW,
      mistakes: mistakes('DTK-TACTIC-004', 3, 1),
      treated,
    })
    expect(hot).toBeNull()
  })

  it('re-offers once the treatment falls outside the 7-day window', () => {
    const treated: TreatedTrap[] = [{ framework_id: 'DTK-TACTIC-004', at: NOW.getTime() - 8 * DAY }]
    const hot = detectHotTrap({
      now: NOW,
      mistakes: mistakes('DTK-TACTIC-004', 3, 1),
      treated,
    })
    expect(hot?.framework_id).toBe('DTK-TACTIC-004')
  })

  it('only suppresses the treated framework, not a different hot one', () => {
    const treated: TreatedTrap[] = [{ framework_id: 'DTK-A', at: NOW.getTime() - DAY }]
    const hot = detectHotTrap({
      now: NOW,
      mistakes: [...mistakes('DTK-A', 3, 1), ...mistakes('KVA-B', 3, 1)],
      treated,
    })
    expect(hot?.framework_id).toBe('KVA-B')
  })
})

describe('detectHotTrap — decline suppression', () => {
  it('suppresses after 2 declines with no newer mistake', () => {
    const declines: Record<string, DeclineRecord> = {
      'DTK-A': { count: 2, lastDeclineAt: NOW.getTime() - 1 * DAY },
    }
    // Mistakes are all 2 days ago — OLDER than the last decline.
    const hot = detectHotTrap({
      now: NOW,
      mistakes: mistakes('DTK-A', 3, 2),
      declines,
    })
    expect(hot).toBeNull()
  })

  it('does NOT suppress after only 1 decline', () => {
    const declines: Record<string, DeclineRecord> = {
      'DTK-A': { count: 1, lastDeclineAt: NOW.getTime() - 1 * DAY },
    }
    const hot = detectHotTrap({ now: NOW, mistakes: mistakes('DTK-A', 3, 2), declines })
    expect(hot?.framework_id).toBe('DTK-A')
  })

  it('re-arms when a NEW mistake lands after the second decline', () => {
    const lastDeclineAt = NOW.getTime() - 2 * DAY
    const declines: Record<string, DeclineRecord> = {
      'DTK-A': { count: 2, lastDeclineAt },
    }
    // Two old mistakes + one fresh (1 day ago, AFTER the decline).
    const ms: TrapMistake[] = [
      ...mistakes('DTK-A', 2, 3),
      { framework_id: 'DTK-A', at: NOW.getTime() - 1 * DAY },
    ]
    const hot = detectHotTrap({ now: NOW, mistakes: ms, declines })
    expect(hot?.framework_id).toBe('DTK-A')
  })
})

describe('recordDecline', () => {
  it('increments the count and stamps lastDeclineAt', () => {
    const next = recordDecline({}, 'DTK-A', NOW)
    expect(next['DTK-A']).toEqual({ count: 1, lastDeclineAt: NOW.getTime() })
  })

  it('accumulates across declines without mutating the input', () => {
    const first = recordDecline({}, 'DTK-A', NOW)
    const later = new Date(NOW.getTime() + DAY)
    const second = recordDecline(first, 'DTK-A', later)
    expect(second['DTK-A'].count).toBe(2)
    expect(second['DTK-A'].lastDeclineAt).toBe(later.getTime())
    // input untouched
    expect(first['DTK-A'].count).toBe(1)
  })
})

describe('treated-trap session marker', () => {
  it('round-trips through encode/decode', () => {
    const marker = encodeTreatedMarker('DTK', 'DTK-TACTIC-004')
    expect(marker).toBe('ar:DTK:DTK-TACTIC-004')
    expect(decodeTreatedMarker(marker)).toEqual({
      section: 'DTK',
      framework_id: 'DTK-TACTIC-004',
    })
  })

  it('returns null for a plain drill section code', () => {
    expect(decodeTreatedMarker('DTK')).toBeNull()
  })

  it('returns null for a mock 4-field marker', () => {
    expect(decodeTreatedMarker('authentic:verbal::')).toBeNull()
  })

  it('returns null for null / empty', () => {
    expect(decodeTreatedMarker(null)).toBeNull()
    expect(decodeTreatedMarker('')).toBeNull()
  })
})

describe('sectionFromFrameworkId', () => {
  it('maps quant/DTK prefixes 1:1', () => {
    expect(sectionFromFrameworkId('DTK-TACTIC-004')).toBe('DTK')
    expect(sectionFromFrameworkId('KVA-TRAP-001')).toBe('KVA')
  })

  it('remaps the LAS ASCII prefix to LÄS', () => {
    expect(sectionFromFrameworkId('LAS-TYPE-001')).toBe('LÄS')
  })
})
