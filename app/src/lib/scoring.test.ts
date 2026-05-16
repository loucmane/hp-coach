import { describe, expect, it } from 'vitest'

import {
  computeProjected,
  computeSectionScore,
  formatScore,
  formatTrend,
  rankWeakness,
  type SectionStats,
  scoreFromFraction,
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
