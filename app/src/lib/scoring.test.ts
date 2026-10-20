import { describe, expect, it } from 'vitest'

import {
  computeProjected,
  computeSectionScore,
  formatScore,
  formatTrend,
  minutesPracticedToday,
  projectionBasis,
  rankWeakness,
  type SectionStats,
  scoreFromFraction,
  sectionBasis,
  weeklyBasis,
} from './scoring'

const emptyStats: SectionStats = {
  attempts7d: 0,
  correct7d: 0,
  attempts7to14d: 0,
  correct7to14d: 0,
  attempts90d: 0,
  correct90d: 0,
  avgTimeMs: null,
  lastAttemptedAt: null,
  attemptsToday: 0,
}

const stats = (overrides: Partial<SectionStats>): SectionStats => ({
  ...emptyStats,
  ...overrides,
})

describe('scoreFromFraction', () => {
  it('maps 0% correct to 0.0', () => {
    expect(scoreFromFraction(0)).toBe(0)
  })
  it('maps 100% correct to 2.0', () => {
    expect(scoreFromFraction(1)).toBe(2)
  })
  it('clamps over 100% to 2.0', () => {
    expect(scoreFromFraction(1.2)).toBe(2)
  })
  it('clamps below 0 to 0', () => {
    expect(scoreFromFraction(-0.1)).toBe(0)
  })
  it('is linear for the v1 mapping', () => {
    expect(scoreFromFraction(0.5)).toBe(1)
    expect(scoreFromFraction(0.75)).toBe(1.5)
  })
})

describe('computeSectionScore', () => {
  it('returns null score when no attempts in the 90d window', () => {
    const s = computeSectionScore('KVA', emptyStats)
    expect(s.score).toBeNull()
    expect(s.trend).toBeNull()
    expect(s.confidence).toBe('low')
    expect(s.daysSinceLastAttempt).toBe(Number.POSITIVE_INFINITY)
  })

  it('computes a score from the 90d correct fraction', () => {
    const s = computeSectionScore('NOG', stats({ attempts90d: 40, correct90d: 28 }))
    expect(s.score).toBeCloseTo(1.4, 5) // 28/40 = 0.7 → 1.4
    expect(s.confidence).toBe('high') // 40 attempts > 30 threshold
  })

  it('reports low confidence under 10 attempts', () => {
    const s = computeSectionScore('XYZ', stats({ attempts90d: 5, correct90d: 4 }))
    expect(s.confidence).toBe('low')
  })

  it('reports medium confidence 10–29 attempts', () => {
    const s = computeSectionScore('MEK', stats({ attempts90d: 20, correct90d: 15 }))
    expect(s.confidence).toBe('medium')
  })

  it('returns positive trend when this week beats last week', () => {
    const s = computeSectionScore(
      'KVA',
      stats({
        attempts7d: 10,
        correct7d: 8,
        attempts7to14d: 10,
        correct7to14d: 5,
        attempts90d: 20,
        correct90d: 13,
      }),
    )
    expect(s.trend).toBeCloseTo(0.3, 5) // 0.8 - 0.5
  })

  it('returns null trend when either week has no data', () => {
    const s = computeSectionScore('KVA', stats({ attempts7d: 10, correct7d: 8 }))
    expect(s.trend).toBeNull()
  })

  it('computes days since last attempt against the supplied now', () => {
    const now = new Date('2026-05-16T12:00:00Z')
    const threeDaysAgo = new Date('2026-05-13T12:00:00Z')
    const s = computeSectionScore(
      'ORD',
      stats({ attempts90d: 5, correct90d: 5, lastAttemptedAt: threeDaysAgo.getTime() }),
      now,
    )
    expect(s.daysSinceLastAttempt).toBe(3)
  })
})

describe('computeProjected', () => {
  it('returns null halves when no data', () => {
    const p = computeProjected([])
    expect(p.verbal).toBeNull()
    expect(p.quant).toBeNull()
    expect(p.total).toBeNull()
  })

  it('computes verbal half from ORD/LÄS/MEK/ELF only', () => {
    const scores = [
      mkScore('ORD', 1.5),
      mkScore('LÄS', 1.7),
      mkScore('MEK', 1.3),
      mkScore('ELF', 1.5),
      mkScore('KVA', 0.0), // quant — should not influence verbal
    ]
    const p = computeProjected(scores)
    expect(p.verbal).toBeCloseTo(1.5, 5) // (1.5+1.7+1.3+1.5)/4
  })

  it('total is the mean of the two halves when both populated', () => {
    const scores = [
      mkScore('ORD', 1.8),
      mkScore('LÄS', 1.8),
      mkScore('MEK', 1.8),
      mkScore('ELF', 1.8),
      mkScore('XYZ', 1.4),
      mkScore('KVA', 1.4),
      mkScore('NOG', 1.4),
      mkScore('DTK', 1.4),
    ]
    const p = computeProjected(scores)
    expect(p.verbal).toBeCloseTo(1.8, 5)
    expect(p.quant).toBeCloseTo(1.4, 5)
    expect(p.total).toBeCloseTo(1.6, 5)
  })
})

describe('rankWeakness', () => {
  it('drops sections with null score (no attempts)', () => {
    const scores = [mkScoreWith({ section: 'KVA', score: null }), mkScore('NOG', 1.0)]
    const r = rankWeakness(scores)
    expect(r.map((s) => s.section)).toEqual(['NOG'])
  })

  it('puts lowest-score section first', () => {
    const scores = [mkScore('ORD', 1.8), mkScore('MEK', 0.8), mkScore('KVA', 1.4)]
    const r = rankWeakness(scores)
    expect(r[0].section).toBe('MEK')
    expect(r[r.length - 1].section).toBe('ORD')
  })

  it('boosts urgency for negative trend at similar scores', () => {
    const declining = mkScoreWith({ section: 'NOG', score: 1.4, trend: -0.2 })
    const stable = mkScoreWith({ section: 'KVA', score: 1.4, trend: 0 })
    const r = rankWeakness([stable, declining])
    expect(r[0].section).toBe('NOG')
  })

  it('discounts low-confidence sections from being top weakness', () => {
    const lowConf = mkScoreWith({
      section: 'XYZ',
      score: 0.6,
      confidence: 'low',
    })
    const highConf = mkScoreWith({
      section: 'KVA',
      score: 1.0,
      confidence: 'high',
    })
    const r = rankWeakness([lowConf, highConf])
    // Even though XYZ has a worse raw score, low confidence means we
    // don't tell the user to drill it as a priority — KVA wins.
    expect(r[0].section).toBe('KVA')
  })

  it('drops low-confidence sections entirely when any medium/high exists', () => {
    // The dogfood case from audit: LÄS 0.00 on 3 attempts vs ORD 1.89
    // on 1035 attempts. The 0.6× discount alone produced (2-0)*0.6 = 1.2
    // for LÄS vs (2-1.89)*1.0 = 0.11 for ORD — LÄS ranked 11× higher
    // even though we *know* the LÄS reading is noise. The floor moves
    // LÄS out of the ranking pool entirely so the prescription stops
    // chasing tiny-sample sections.
    const lowConf = mkScoreWith({ section: 'LÄS', score: 0.0, confidence: 'low' })
    const highConf = mkScoreWith({ section: 'ORD', score: 1.89, confidence: 'high' })
    const r = rankWeakness([lowConf, highConf])
    expect(r.map((s) => s.section)).toEqual(['ORD'])
  })

  it('falls back to low-confidence pool when nothing else exists', () => {
    // Edge case: a user with only low-confidence sections (post-diagnostic
    // but pre-drilling). We still rank them so the daily plan has
    // *something* to prescribe — better than empty.
    const onlyLow = [
      mkScoreWith({ section: 'XYZ', score: 0.6, confidence: 'low' }),
      mkScoreWith({ section: 'KVA', score: 1.0, confidence: 'low' }),
    ]
    const r = rankWeakness(onlyLow)
    expect(r.map((s) => s.section)).toEqual(['XYZ', 'KVA']) // lower score first
  })

  it('breaks exact-weight ties deterministically regardless of input order', () => {
    // All sections tied at score 1.7, same confidence, no trend/staleness
    // signal — every section computes the identical weaknessWeight. Array
    // order (Array#sort is stable) then decides ranked[0]/ranked[1], which
    // silently flips the daily-plan prescription depending on caller
    // iteration order. Observed: all-1.7 → LÄS first; reversed input → NOG
    // first. A stable tie-break (fixed section order) must make the
    // result identical no matter how the caller ordered the input.
    const forward = [
      mkScore('ORD', 1.7),
      mkScore('LÄS', 1.7),
      mkScore('MEK', 1.7),
      mkScore('ELF', 1.7),
      mkScore('XYZ', 1.7),
      mkScore('KVA', 1.7),
      mkScore('NOG', 1.7),
      mkScore('DTK', 1.7),
    ]
    const reversed = [...forward].reverse()
    const rForward = rankWeakness(forward)
    const rReversed = rankWeakness(reversed)
    expect(rReversed.map((s) => s.section)).toEqual(rForward.map((s) => s.section))
  })
})

describe('formatScore / formatTrend', () => {
  it('formats score to 2 decimals', () => {
    expect(formatScore(1.62)).toBe('1.62')
    expect(formatScore(2)).toBe('2.00')
  })
  it('em-dashes null score', () => {
    expect(formatScore(null)).toBe('—')
  })
  it('arrow + signed percent for trend', () => {
    expect(formatTrend(0.15)).toBe('↗ +15%')
    expect(formatTrend(-0.2)).toBe('↘ -20%')
    expect(formatTrend(0)).toBe('→ 0%')
  })
  it('em-dashes null trend', () => {
    expect(formatTrend(null)).toBe('—')
  })
})

// ── test helpers ──

function mkScore(section: Parameters<typeof mkScoreWith>[0]['section'], score: number) {
  return mkScoreWith({ section, score })
}

function mkScoreWith(overrides: {
  section: 'ORD' | 'LÄS' | 'MEK' | 'ELF' | 'XYZ' | 'KVA' | 'NOG' | 'DTK'
  score?: number | null
  trend?: number | null
  confidence?: 'low' | 'medium' | 'high'
  daysSinceLastAttempt?: number
  attempts90d?: number
}) {
  return {
    section: overrides.section,
    score: overrides.score === undefined ? 1.0 : overrides.score,
    trend: overrides.trend ?? null,
    confidence: overrides.confidence ?? 'high',
    daysSinceLastAttempt: overrides.daysSinceLastAttempt ?? 1,
    avgTimeMs: null,
    attempts7d: 0,
    attempts90d: overrides.attempts90d ?? 50,
  }
}

// ── M3H home stats (Swedish display + honest week delta) ───────────

import { computeProjectedDelta, formatDeltaSv, formatScoreSv } from './scoring'

function weekStats(over: Partial<SectionStats>): SectionStats {
  return {
    attempts7d: 0,
    correct7d: 0,
    attempts7to14d: 0,
    correct7to14d: 0,
    attempts90d: 0,
    correct90d: 0,
    avgTimeMs: null,
    lastAttemptedAt: null,
    attemptsToday: 0,
    ...over,
  }
}

describe('formatScoreSv', () => {
  it('renders one decimal with a Swedish comma', () => {
    expect(formatScoreSv(1.42)).toBe('1,4')
    expect(formatScoreSv(2)).toBe('2,0')
  })
  it('em-dashes null', () => {
    expect(formatScoreSv(null)).toBe('—')
  })
})

describe('computeProjectedDelta', () => {
  it('pools sections where BOTH weeks clear the attempt floor', () => {
    const delta = computeProjectedDelta({
      ORD: weekStats({ attempts7d: 10, correct7d: 8, attempts7to14d: 10, correct7to14d: 6 }),
    })
    // this week 1.6, last week 1.2 → +0.4
    expect(delta).toBeCloseTo(0.4)
  })
  it('returns null when a week is under the floor (no honest comparison)', () => {
    expect(
      computeProjectedDelta({
        ORD: weekStats({ attempts7d: 10, correct7d: 8, attempts7to14d: 2, correct7to14d: 1 }),
      }),
    ).toBeNull()
  })
  it('excludes sections that only qualify in one week', () => {
    const delta = computeProjectedDelta({
      ORD: weekStats({ attempts7d: 10, correct7d: 8, attempts7to14d: 10, correct7to14d: 8 }),
      KVA: weekStats({ attempts7d: 20, correct7d: 0, attempts7to14d: 0, correct7to14d: 0 }),
    })
    // KVA (this-week only) must not drag the delta — ORD alone is flat.
    expect(delta).toBeCloseTo(0)
  })
})

describe('formatDeltaSv', () => {
  it('signs and comma-formats', () => {
    expect(formatDeltaSv(0.12)).toBe('+0,1')
    expect(formatDeltaSv(-0.2)).toBe('−0,2')
  })
})

describe('minutesPracticedToday — the Home "minuter idag" elapsed counter', () => {
  it('is 0 for a day-zero user (no practice yet — never the plan estimate)', () => {
    expect(minutesPracticedToday({ timeMsToday: 0, bySection: {} })).toBe(0)
    expect(minutesPracticedToday({ bySection: {} })).toBe(0)
  })

  it('prefers the exact worker sum when present', () => {
    expect(minutesPracticedToday({ timeMsToday: 720_000, bySection: {} })).toBe(12)
  })

  it('rounds to whole minutes', () => {
    expect(minutesPracticedToday({ timeMsToday: 89_000, bySection: {} })).toBe(1)
    expect(minutesPracticedToday({ timeMsToday: 95_000, bySection: {} })).toBe(2)
  })

  it('falls back to attemptsToday × avgTimeMs per section while the worker field rolls out', () => {
    expect(
      minutesPracticedToday({
        bySection: {
          ORD: weekStats({ attemptsToday: 10, avgTimeMs: 30_000 }),
          KVA: weekStats({ attemptsToday: 4, avgTimeMs: 60_000 }),
        },
      }),
    ).toBe(9)
  })

  it('fallback skips sections with no time signal (null avgTimeMs) instead of producing NaN', () => {
    expect(
      minutesPracticedToday({
        bySection: { ORD: weekStats({ attemptsToday: 3, avgTimeMs: null }) },
      }),
    ).toBe(0)
  })
})

// P5 infold PR 3 (docs/p5-infold-design.md Amendment 1 E): synthetic answers
// count toward the section scores and the projection like any other, and the
// worker's estimateBasis says which estimates rest on them (uncalibrated).
describe('estimate bases — synthetic answers count, marked uncalibrated', () => {
  const LAS_WITH_P5 = stats({
    attempts90d: 10,
    correct90d: 8,
    estimateBasis: { authentic: 4, synthetic: 6, calibrated: false },
  })
  const ORD_AUTHENTIC = stats({
    attempts90d: 20,
    correct90d: 10,
    estimateBasis: { authentic: 20, synthetic: 0, calibrated: true },
  })

  it('a section score reads every answer the worker counted, synthetic ones included', () => {
    expect(computeSectionScore('LÄS', LAS_WITH_P5).score).toBeCloseTo(1.6, 12)
    expect(sectionBasis(LAS_WITH_P5)).toEqual({ authentic: 4, synthetic: 6, calibrated: false })
  })

  it('a basis-less section (an older worker) rests on authentic answers only', () => {
    expect(sectionBasis(stats({ attempts90d: 7, correct90d: 3 }))).toEqual({
      authentic: 7,
      synthetic: 0,
      calibrated: true,
    })
  })

  it('the projection is uncalibrated exactly where a synthetic answer feeds it', () => {
    const XYZ_AUTHENTIC = stats({ attempts90d: 5, correct90d: 5 })
    // No answers: not part of the projection, so not part of its basis.
    const ELF_EMPTY = stats({ estimateBasis: { authentic: 0, synthetic: 0, calibrated: true } })
    const bySection = { ORD: ORD_AUTHENTIC, LÄS: LAS_WITH_P5, XYZ: XYZ_AUTHENTIC, ELF: ELF_EMPTY }
    // The scores themselves are the plain linear projection of every counted answer.
    const projected = computeProjected([
      computeSectionScore('ORD', ORD_AUTHENTIC),
      computeSectionScore('LÄS', LAS_WITH_P5),
      computeSectionScore('XYZ', XYZ_AUTHENTIC),
      computeSectionScore('ELF', ELF_EMPTY),
    ])
    expect(projected.verbal).toBeCloseTo(1.3, 12) // (1.0 + 1.6) / 2
    expect(projected.quant).toBeCloseTo(2, 12)
    expect(projected.total).toBeCloseTo(1.65, 12)
    expect(projectionBasis(bySection)).toEqual({
      verbal: { authentic: 24, synthetic: 6, calibrated: false },
      quant: { authentic: 5, synthetic: 0, calibrated: true },
      total: { authentic: 29, synthetic: 6, calibrated: false },
    })
    expect(
      projectionBasis({ ORD: ORD_AUTHENTIC, XYZ: stats({ attempts90d: 5, correct90d: 5 }) }),
    ).toEqual({
      verbal: { authentic: 20, synthetic: 0, calibrated: true },
      quant: { authentic: 5, synthetic: 0, calibrated: true },
      total: { authentic: 25, synthetic: 0, calibrated: true },
    })
  })

  it('a weekly trend point carries its bucket basis; an older worker’s bucket is authentic', () => {
    expect(
      weeklyBasis({
        attempts: 9,
        estimateBasis: { authentic: 5, synthetic: 4, calibrated: false },
      }),
    ).toEqual({ authentic: 5, synthetic: 4, calibrated: false })
    expect(weeklyBasis({ attempts: 9 })).toEqual({ authentic: 9, synthetic: 0, calibrated: true })
  })
})

// ── Honest prognosis (hpf-bz6f.4) ──────────────────────────────────
//
// The prognosis counts each question's first try only (the worker's
// firstTry* fields): Repetera retries and changed mock answers no longer
// inflate it. Its total carries a band, and a week-over-week change is
// named only when it clears the noise.

import { computeHonestDelta, computeHonestProjected, firstTryStats, scoreBand } from './scoring'

/** Var(2p̂) = 4·p(1−p)/n — the per-section Wald model scoreBand uses. */
const scoreVar = (p: number, n: number) => (4 * p * (1 - p)) / n

describe('firstTryStats', () => {
  it('reads the first-try fields in place of every attempt', () => {
    const st = stats({
      attempts7d: 12,
      correct7d: 11,
      attempts7to14d: 9,
      correct7to14d: 8,
      attempts90d: 40,
      correct90d: 36,
      firstTry7d: 6,
      firstTryCorrect7d: 4,
      firstTry7to14d: 5,
      firstTryCorrect7to14d: 3,
      firstTry90d: 20,
      firstTryCorrect90d: 13,
      avgTimeMs: 50_000,
      lastAttemptedAt: 1_700_000_000_000,
      attemptsToday: 3,
    })
    expect(firstTryStats(st)).toEqual({
      ...st,
      attempts7d: 6,
      correct7d: 4,
      attempts7to14d: 5,
      correct7to14d: 3,
      attempts90d: 20,
      correct90d: 13,
    })
  })

  it('an older worker sends no first-try fields: every attempt counts, as before', () => {
    const st = stats({ attempts90d: 40, correct90d: 36 })
    expect(firstTryStats(st)).toEqual(st)
  })
})

describe('computeHonestProjected', () => {
  const ORD = stats({ attempts90d: 50, correct90d: 45, firstTry90d: 20, firstTryCorrect90d: 12 })
  const LAS = stats({ attempts90d: 30, correct90d: 27, firstTry90d: 10, firstTryCorrect90d: 8 })
  const KVA = stats({ attempts90d: 40, correct90d: 36, firstTry90d: 25, firstTryCorrect90d: 10 })

  it('projects first tries, not every attempt, section → half → total', () => {
    // Every attempt reads 1,8 in each section; first tries read 1,2 / 1,6 / 0,8.
    const p = computeHonestProjected({ ORD, LÄS: LAS, KVA })
    expect(p.verbal).toBeCloseTo((1.2 + 1.6) / 2, 12)
    expect(p.quant).toBeCloseTo(0.8, 12)
    expect(p.total).toBeCloseTo(1.1, 12)
    expect(
      computeProjected([
        computeSectionScore('ORD', ORD),
        computeSectionScore('LÄS', LAS),
        computeSectionScore('KVA', KVA),
      ]).total,
    ).toBeCloseTo(1.8, 12)
  })

  it('bands the total by pooling the per-section Wald variances', () => {
    const p = computeHonestProjected({ ORD, LÄS: LAS, KVA })
    // A half is the mean of its k sections: Var = ΣVar(sᵢ)/k². The total is
    // the mean of the two halves: Var = (Var(V) + Var(Q))/4.
    const verbal = (scoreVar(0.6, 20) + scoreVar(0.8, 10)) / 4
    const quant = scoreVar(0.4, 25)
    expect(p.band).toBeCloseTo(1.96 * Math.sqrt((verbal + quant) / 4), 12)
    // The per-section term is exactly scoreBand's model.
    expect(1.96 * Math.sqrt(scoreVar(0.6, 20))).toBeCloseTo(scoreBand(1.2, 20) ?? Number.NaN, 12)
  })

  it('floors p like scoreBand, so a perfect section still widens the band', () => {
    const p = computeHonestProjected({
      ORD: stats({ attempts90d: 30, correct90d: 30, firstTry90d: 30, firstTryCorrect90d: 30 }),
      KVA: stats({ attempts90d: 30, correct90d: 0, firstTry90d: 30, firstTryCorrect90d: 0 }),
    })
    const floored = scoreVar(0.05, 30)
    expect(p.band).toBeCloseTo(1.96 * Math.sqrt((floored + floored) / 4), 12)
  })

  it('a section with one first try pools at the worst case, p(1−p) = 1/4', () => {
    const p = computeHonestProjected({
      ORD: stats({ attempts90d: 9, correct90d: 9, firstTry90d: 1, firstTryCorrect90d: 1 }),
      KVA,
    })
    // One answer has no Wald interval of its own…
    expect(scoreBand(2, 1)).toBeNull()
    // …and must not read as the certainty of a lucky 1 of 1.
    expect(p.band).toBeCloseTo(1.96 * Math.sqrt((4 * 0.25 + scoreVar(0.4, 25)) / 4), 12)
  })

  it('no total, no band', () => {
    expect(computeHonestProjected({ ORD })).toEqual({
      verbal: expect.closeTo(1.2, 12),
      quant: null,
      total: null,
      band: null,
    })
    expect(computeHonestProjected({})).toEqual({
      verbal: null,
      quant: null,
      total: null,
      band: null,
    })
  })

  it('a section with retries only has no honest score', () => {
    const p = computeHonestProjected({
      ORD: stats({ attempts90d: 30, correct90d: 30, firstTry90d: 0, firstTryCorrect90d: 0 }),
      LÄS: LAS,
      KVA,
    })
    expect(p.verbal).toBeCloseTo(1.6, 12)
    expect(p.band).toBeCloseTo(1.96 * Math.sqrt((scoreVar(0.8, 10) + scoreVar(0.4, 25)) / 4), 12)
  })

  it('an older worker without first-try fields projects every attempt, as before', () => {
    const p = computeHonestProjected({
      ORD: stats({ attempts90d: 20, correct90d: 12 }),
      KVA: stats({ attempts90d: 25, correct90d: 10 }),
    })
    expect(p.total).toBeCloseTo(1.0, 12)
  })
})

describe('computeHonestDelta — a week-over-week change only beyond the noise', () => {
  it('names a change that clears the combined uncertainty of the two weeks', () => {
    const d = computeHonestDelta({
      ORD: stats({
        firstTry7d: 100,
        firstTryCorrect7d: 80,
        firstTry7to14d: 100,
        firstTryCorrect7to14d: 50,
      }),
    })
    // 2·0,80 − 2·0,50 = +0,6 against 1,96·√(4·0,8·0,2/100 + 4·0,5·0,5/100) ≈ 0,25.
    expect(d).toEqual({
      kind: 'change',
      delta: expect.closeTo(0.6, 12),
      band: expect.closeTo(1.96 * Math.sqrt(scoreVar(0.8, 100) + scoreVar(0.5, 100)), 12),
    })
  })

  it('a drop is a change too', () => {
    const d = computeHonestDelta({
      KVA: stats({
        firstTry7d: 100,
        firstTryCorrect7d: 50,
        firstTry7to14d: 100,
        firstTryCorrect7to14d: 80,
      }),
    })
    expect(d).toMatchObject({ kind: 'change', delta: expect.closeTo(-0.6, 12) })
  })

  it('is stable — no figure at all — when the change is inside the noise', () => {
    // The "+0,1 sedan förra veckan" case: 2·0,75 − 2·0,70 = +0,1 against ≈ 0,55.
    const d = computeHonestDelta({
      ORD: stats({
        firstTry7d: 20,
        firstTryCorrect7d: 15,
        firstTry7to14d: 20,
        firstTryCorrect7to14d: 14,
      }),
    })
    expect(d).toEqual({
      kind: 'stable',
      band: expect.closeTo(1.96 * Math.sqrt(scoreVar(0.75, 20) + scoreVar(0.7, 20)), 12),
    })
    expect(d).not.toHaveProperty('delta')
  })

  it('is stable when only the rounded figure would sit inside the noise', () => {
    // 2·0,57 − 2·0,50 = 0,14 clears a band of ≈ 0,123, but it would show as
    // "+0,1", a figure smaller than the noise.
    const d = computeHonestDelta({
      ORD: stats({
        firstTry7d: 500,
        firstTryCorrect7d: 285,
        firstTry7to14d: 500,
        firstTryCorrect7to14d: 250,
      }),
    })
    const band = 1.96 * Math.sqrt(scoreVar(0.57, 500) + scoreVar(0.5, 500))
    expect(0.14).toBeGreaterThan(band)
    expect(0.1).toBeLessThan(band)
    expect(d).toEqual({ kind: 'stable', band: expect.closeTo(band, 12) })
  })

  it('reads first tries: Repetera retries no longer manufacture a rise', () => {
    const bySection = {
      ORD: stats({
        attempts7d: 100,
        correct7d: 95,
        attempts7to14d: 100,
        correct7to14d: 50,
        firstTry7d: 40,
        firstTryCorrect7d: 24,
        firstTry7to14d: 40,
        firstTryCorrect7to14d: 24,
      }),
    }
    // Counting every attempt, the same week read +0,9.
    expect(computeProjectedDelta(bySection)).toBeCloseTo(0.9, 12)
    expect(computeHonestDelta(bySection)).toMatchObject({ kind: 'stable' })
  })

  it('pools only sections where both weeks clear the floor; none → null', () => {
    expect(
      computeHonestDelta({
        ORD: stats({
          firstTry7d: 10,
          firstTryCorrect7d: 8,
          firstTry7to14d: 2,
          firstTryCorrect7to14d: 1,
        }),
      }),
    ).toBeNull()
    expect(computeHonestDelta({})).toBeNull()
    // KVA (this week only) must not drag the pooled weeks.
    expect(
      computeHonestDelta({
        ORD: stats({
          firstTry7d: 100,
          firstTryCorrect7d: 80,
          firstTry7to14d: 100,
          firstTryCorrect7to14d: 50,
        }),
        KVA: stats({ firstTry7d: 50, firstTryCorrect7d: 0, firstTry7to14d: 0 }),
      }),
    ).toMatchObject({ kind: 'change', delta: expect.closeTo(0.6, 12) })
  })
})
