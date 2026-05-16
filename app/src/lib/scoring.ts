// Score model — pure functions that turn raw per-section attempt
// stats into HP-Coach grades (0.0–2.0 per section, projected total),
// trend deltas, and weakness rankings for deliberate-practice
// recommendations.
//
// v1 approach: linear mapping `score = 2 * correctFraction`, gated by
// a confidence band based on sample size. HP's real raw→normalised
// curve is non-linear (75/80 correct ≈ 1.9, not 1.88) and section-
// weighted (DTK harder than ORD), but we don't have enough corpus
// metadata to calibrate that yet — the linear approximation is honest
// for a coaching surface that says "directionally where you are".
//
// All inputs come straight from /api/me/stats `bySection` — see the
// type `Stats['bySection']` in app/src/api/hooks/useStats.ts.

import type { Section } from '@/data/questions'

export const VERBAL_SECTIONS: ReadonlyArray<Section> = ['ORD', 'LÄS', 'MEK', 'ELF']
export const QUANT_SECTIONS: ReadonlyArray<Section> = ['XYZ', 'KVA', 'NOG', 'DTK']

/** Raw per-section aggregates from the worker. */
export type SectionStats = {
  attempts7d: number
  correct7d: number
  attempts7to14d: number
  correct7to14d: number
  attempts90d: number
  correct90d: number
  avgTimeMs: number | null
  lastAttemptedAt: number | null
}

export type Confidence = 'low' | 'medium' | 'high'

/** Computed per-section grade and signals. */
export type SectionScore = {
  section: Section
  /** Current grade 0.0–2.0; null when no attempts in the window. */
  score: number | null
  /** Delta this-week vs previous-week (correct fraction). null when
   *  either window is empty. Positive = improving. */
  trend: number | null
  /** How much to trust the score: low = under 10 attempts, medium =
   *  10–30, high = 30+. */
  confidence: Confidence
  /** Days since the most recent attempt. Infinity when never attempted. */
  daysSinceLastAttempt: number
  /** Mean answer time over the 90d window, or null. */
  avgTimeMs: number | null
  /** Pass through so the UI can render "X attempts" without us
   *  exposing the whole raw shape. */
  attempts7d: number
  attempts90d: number
}

/** Confidence threshold mirrors the dogfood user's intuition that 10
 *  attempts is "I've seen enough to mean something" and 30+ is "this
 *  is statistically real". Tuned in feedback. */
function confidenceFor(n: number): Confidence {
  if (n < 10) return 'low'
  if (n < 30) return 'medium'
  return 'high'
}

/** Linear correct-fraction → 0.0–2.0. Document the simplification in
 *  the UI so the user knows this isn't the official scoring curve. */
export function scoreFromFraction(fraction: number): number {
  return Math.max(0, Math.min(2, fraction * 2))
}

const MS_PER_DAY = 24 * 60 * 60_000

export function computeSectionScore(
  section: Section,
  stats: SectionStats,
  now: Date = new Date(),
): SectionScore {
  // Score uses the 90d window so the number doesn't whipsaw on a
  // single bad day. Trend compares week-over-week so recent
  // improvement / regression surfaces clearly.
  const score90d =
    stats.attempts90d > 0 ? scoreFromFraction(stats.correct90d / stats.attempts90d) : null

  const frac7d = stats.attempts7d > 0 ? stats.correct7d / stats.attempts7d : null
  const fracPrev = stats.attempts7to14d > 0 ? stats.correct7to14d / stats.attempts7to14d : null
  const trend = frac7d != null && fracPrev != null ? frac7d - fracPrev : null

  const daysSince =
    stats.lastAttemptedAt == null
      ? Number.POSITIVE_INFINITY
      : Math.floor((now.getTime() - stats.lastAttemptedAt) / MS_PER_DAY)

  return {
    section,
    score: score90d,
    trend,
    confidence: confidenceFor(stats.attempts90d),
    daysSinceLastAttempt: daysSince,
    avgTimeMs: stats.avgTimeMs,
    attempts7d: stats.attempts7d,
    attempts90d: stats.attempts90d,
  }
}

/** Per-half + total projection. Returns null for halves where no
 *  section has any attempts (don't fake a number out of nothing). */
export type ProjectedTotal = {
  verbal: number | null
  quant: number | null
  total: number | null
}

export function computeProjected(scores: SectionScore[]): ProjectedTotal {
  const byKey = new Map(scores.map((s) => [s.section, s.score]))
  const verbal = meanIgnoringNull(VERBAL_SECTIONS.map((s) => byKey.get(s) ?? null))
  const quant = meanIgnoringNull(QUANT_SECTIONS.map((s) => byKey.get(s) ?? null))
  const total = verbal != null && quant != null ? (verbal + quant) / 2 : null
  return { verbal, quant, total }
}

function meanIgnoringNull(values: (number | null)[]): number | null {
  const real = values.filter((v): v is number => v != null)
  if (real.length === 0) return null
  return real.reduce((a, b) => a + b, 0) / real.length
}

/** Rank sections by "needs deliberate practice next". The signal blends:
 *   - score: lower = more weakness
 *   - trend: negative = warning
 *   - daysSince: stale sections percolate up
 *   - confidence: low-confidence sections aren't recommended yet (we
 *     don't have enough data to know they need work)
 *
 *  Returns sections ordered most-to-least-urgent, clamped to those
 *  with at least one attempt — we don't recommend drilling something
 *  we have no signal on yet. */
export function rankWeakness(scores: SectionScore[]): SectionScore[] {
  return [...scores]
    .filter((s) => s.score != null)
    .map((s) => ({ s, w: weaknessWeight(s) }))
    .sort((a, b) => b.w - a.w)
    .map((x) => x.s)
}

function weaknessWeight(s: SectionScore): number {
  if (s.score == null) return -1
  // Lower score = more urgent. Inverted so higher weight = more urgent.
  const scorePart = 2 - s.score
  // Negative trend adds urgency; positive trend reduces it. Bounded
  // to avoid a single-week swing dominating the ranking.
  const trendPart = s.trend != null ? Math.max(-0.5, Math.min(0.5, -s.trend)) : 0
  // Stale section bumps. Every 7 days past 7d-since adds 0.1, capped.
  const stalePart = Math.min(0.5, Math.max(0, (s.daysSinceLastAttempt - 7) / 70))
  // Low confidence gets a discount — we don't recommend drilling
  // a section we've barely seen as "weak" because we don't yet know.
  const confidenceDiscount = s.confidence === 'low' ? 0.6 : s.confidence === 'medium' ? 0.85 : 1.0
  return (scorePart + trendPart + stalePart) * confidenceDiscount
}

/** Format a score as `1.62` — display string for the UI. Returns the
 *  em-dash when score is null so React can render `{formatScore(s)}`. */
export function formatScore(score: number | null): string {
  return score == null ? '—' : score.toFixed(2)
}

export function formatTrend(trend: number | null): string {
  if (trend == null) return '—'
  const arrow = trend > 0.05 ? '↗' : trend < -0.05 ? '↘' : '→'
  const sign = trend > 0 ? '+' : ''
  return `${arrow} ${sign}${(trend * 100).toFixed(0)}%`
}
