// Unit tests for the mastery EWMA + framework-progress ladder.
//
// These are the pure halves of lib/progress.ts. The db-touching halves
// (applyMasteryOutcome / markFrameworkTaught) are proved end-to-end in
// routes/attempts.test.ts and routes/lessonReads.test.ts against the real
// in-memory D1 shim.

import { describe, expect, it } from 'vitest'

import {
  MASTERED_AT,
  MASTERY_ALPHA,
  MASTERY_PRIOR,
  nextMasteryScore,
  RETAINING_AT,
  statusForScore,
} from './progress'

describe('nextMasteryScore', () => {
  it('seeds a brand-new item from the neutral prior, not from the outcome', () => {
    // A first correct answer must NOT read as certainty — with no
    // exposure-count column on `mastery`, the neutral prior is the only
    // thing keeping one lucky hit from looking like mastery.
    expect(nextMasteryScore(null, true)).toBe(MASTERY_PRIOR + MASTERY_ALPHA * (1 - MASTERY_PRIOR))
    expect(nextMasteryScore(null, false)).toBe(MASTERY_PRIOR + MASTERY_ALPHA * (0 - MASTERY_PRIOR))
  })

  it('treats a missing/legacy score as the neutral prior too', () => {
    expect(nextMasteryScore(undefined, true)).toBe(nextMasteryScore(null, true))
  })

  it('moves toward 1 on correct and toward 0 on wrong', () => {
    expect(nextMasteryScore(0.5, true)).toBeGreaterThan(0.5)
    expect(nextMasteryScore(0.5, false)).toBeLessThan(0.5)
  })

  it('stays inside [0, 1] however lopsided the streak', () => {
    let s = nextMasteryScore(null, true)
    for (let i = 0; i < 50; i++) s = nextMasteryScore(s, true)
    expect(s).toBeLessThanOrEqual(1)
    for (let i = 0; i < 100; i++) s = nextMasteryScore(s, false)
    expect(s).toBeGreaterThanOrEqual(0)
  })

  it('rounds to 4 decimals so repeated writes do not accumulate float noise', () => {
    const s = nextMasteryScore(0.8285, true)
    expect(s).toBe(Number(s.toFixed(4)))
  })

  it('needs FOUR consecutive corrects from cold to reach the mastered band', () => {
    let s = nextMasteryScore(null, true)
    expect(statusForScore(s)).toBe('practicing')
    s = nextMasteryScore(s, true)
    expect(statusForScore(s)).toBe('retaining')
    s = nextMasteryScore(s, true)
    expect(statusForScore(s)).toBe('retaining')
    s = nextMasteryScore(s, true)
    expect(statusForScore(s)).toBe('mastered')
  })
})

describe('statusForScore', () => {
  it('bands the score into the practiced rungs of the ladder', () => {
    expect(statusForScore(0)).toBe('practicing')
    expect(statusForScore(RETAINING_AT - 0.0001)).toBe('practicing')
    expect(statusForScore(RETAINING_AT)).toBe('retaining')
    expect(statusForScore(MASTERED_AT - 0.0001)).toBe('retaining')
    expect(statusForScore(MASTERED_AT)).toBe('mastered')
    expect(statusForScore(1)).toBe('mastered')
  })

  it('never returns an unpractised rung — practice is a one-way door', () => {
    for (const score of [0, 0.2, 0.5, 0.9, 1]) {
      expect(['practicing', 'retaining', 'mastered']).toContain(statusForScore(score))
    }
  })
})
