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
 *  we have no signal on yet.
 *
 *  CONFIDENCE FLOOR: low-confidence sections are excluded entirely
 *  unless ALL eligible sections are low-confidence (cold-start corner
 *  case). The 0.6× discount in `weaknessWeight` proved insufficient on
 *  its own — a 0.00-on-3-attempts section can still outweigh a
 *  1.89-on-1035-attempts section ~11×. The dogfood user landed on
 *  `LÄS 0.00 (3 försök · liten provstorlek) — lägsta sektionen just nu`
 *  which is "noise, not coaching". Surfaced in audit/_homescreen_audit.md. */
export function rankWeakness(scores: SectionScore[]): SectionScore[] {
  const scored = scores.filter((s) => s.score != null)
  // Prefer medium/high-confidence sections; only fall back to low when
  // nothing else qualifies. This stops the daily plan from prescribing
  // work on a section we've seen 3-5 times.
  const confident = scored.filter((s) => s.confidence !== 'low')
  const pool = confident.length > 0 ? confident : scored
  return [...pool]
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

/** M3H home stats — Swedish display form `1,4`. One decimal: the home
 *  prognosis is a coarse morning compass; /progress keeps the
 *  2-decimal dot form via `formatScore`. */
export function formatScoreSv(score: number | null): string {
  return score == null ? '—' : score.toFixed(1).replace('.', ',')
}

/** Honest week-over-week projected delta for the home stats row (M3H).
 *
 *  Pools ONLY sections where BOTH weeks clear `minAttempts`, so the
 *  comparison is like-with-like — a section drilled heavily this week
 *  but untouched last week can't manufacture a swing. Returns null
 *  (render blank) when no section qualifies; a fake delta is worse
 *  than none. Computed from the raw week windows, not SectionScore
 *  (whose `score` is the 90d blend). */
export function computeProjectedDelta(
  bySection: Partial<Record<Section, SectionStats>>,
  minAttempts = 5,
): number | null {
  let a7 = 0
  let c7 = 0
  let a14 = 0
  let c14 = 0
  for (const section of [...VERBAL_SECTIONS, ...QUANT_SECTIONS]) {
    const st = bySection[section]
    if (!st) continue
    if (st.attempts7d >= minAttempts && st.attempts7to14d >= minAttempts) {
      a7 += st.attempts7d
      c7 += st.correct7d
      a14 += st.attempts7to14d
      c14 += st.correct7to14d
    }
  }
  if (a7 === 0 || a14 === 0) return null
  return scoreFromFraction(c7 / a7) - scoreFromFraction(c14 / a14)
}

/** `+0,1` / `−0,2` / `±0,0` — the stats-row delta, Swedish comma. */
export function formatDeltaSv(delta: number): string {
  const rounded = Math.round(delta * 10) / 10
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '±'
  return `${sign}${Math.abs(rounded).toFixed(1).replace('.', ',')}`
}

/** Half-width of a 95% Wald confidence interval on the score, scaled to
 *  the 0-2 grade range. The number to read as "± this much".
 *
 *  Math: score = 2 × fraction; SE(fraction) = sqrt(p(1-p)/n); 95% CI
 *  half-width on fraction = 1.96 × SE; scaled to score, multiply by 2.
 *
 *  Returns null when:
 *    - score is null (no attempts)
 *    - attempts < 2 (a 1-attempt sample has no defined Wald interval)
 *
 *  Wald collapses to 0 at p=0 or p=1; that's mathematically true but
 *  reads as misleading certainty ("0.00 ±0.00 from 3 attempts"). We
 *  floor p to [0.05, 0.95] so the displayed band still acknowledges
 *  uncertainty even on perfect or zero streaks until the sample grows. */
export function scoreBand(score: number | null, attempts: number): number | null {
  if (score == null || attempts < 2) return null
  const rawP = score / 2
  const p = Math.max(0.05, Math.min(0.95, rawP))
  const se = Math.sqrt((p * (1 - p)) / attempts)
  return 1.96 * 2 * se
}

/** Format the band as `±0.31`. Returns the em-dash when band is null. */
export function formatBand(band: number | null): string {
  return band == null ? '—' : `±${band.toFixed(2)}`
}

export function formatTrend(trend: number | null): string {
  if (trend == null) return '—'
  const arrow = trend > 0.05 ? '↗' : trend < -0.05 ? '↘' : '→'
  const sign = trend > 0 ? '+' : ''
  return `${arrow} ${sign}${(trend * 100).toFixed(0)}%`
}

/** ISO 8601 week number. Matches what calendars print in Sweden
 *  ("Vecka 19" === ISO week 19 of the current year). */
export function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

/** Swedish short-month form: "12 maj". Tabular-numeric friendly. */
export function formatSwedishDateShort(d: Date): string {
  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'maj',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'dec',
  ]
  return `${d.getDate()} ${months[d.getMonth()]}`
}

/** Score for a weekly bucket — null when no attempts (don't pretend
 *  a flat line; chart breaks the polyline). */
export function weeklyScore(bucket: { attempts: number; correct: number }): number | null {
  if (bucket.attempts === 0) return null
  return scoreFromFraction(bucket.correct / bucket.attempts)
}
