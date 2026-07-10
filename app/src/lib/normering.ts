// UHR normering — turn a raw provpass score into a normed 0.0–2.0 score
// using the official per-sitting normeringstabell (studera.nu), with a
// linear fallback when no table is available.
//
// WHY A DERIVATION, NOT A DIRECT LOOKUP:
// UHR norms per HALF-TYPE (verbal / kvantitativ) across the WHOLE 80-q
// half (two provpass of 40 questions each). There is no official table
// for a single 40-q pass. HP-Coach's provpass is one 40-q pass, so for
// an authentic pass we DERIVE a normed score by scaling the raw score up
// to the 80-q scale and reading the official 80-q table:
//
//   scaledRaw = correct / presented * 80
//
// When scaledRaw is an integer we read table[scaledRaw] directly; when
// it is fractional we linearly interpolate between the two neighbouring
// table rows (midpoint interpolation). This is an ESTIMATE of the
// official curve, not the official score for a 40-q pass (which doesn't
// exist) — the UI labels it "normerat (härlett)".
//
// Synthetic passes (questions drawn from many sittings) have no single
// sitting table and stay on the linear "indikativ" fallback.
//
// The dense `table` (index = raw 0..80) and the source `bands` are both
// carried in the JSON under app/public/normering/{exam_id}.json; the
// build pipeline (scripts) mirrors the UHR PDFs faithfully.

export type MockHalf = 'verbal' | 'kvant'

export type NormeringBand = { lo: number; hi: number; score: number }

export type NormeringHalf = {
  source_pdf: string
  bands: NormeringBand[]
  /** Dense lookup: index = raw score 0..80, value = normed 0.0..2.0. */
  table: number[]
}

export type NormeringSitting = {
  exam_id: string
  source_url: string
  verbal?: NormeringHalf
  kvant?: NormeringHalf
}

export type NormedResult = {
  /** 0.0–2.0, or null when nothing was presented. */
  score: number | null
  /**
   * How `score` was produced:
   *  - 'official-derived' — read/interpolated from the sitting's official
   *    80-q table (authentic pass; label "normerat (härlett)").
   *  - 'linear'           — no table available; linear correct/presented
   *    → 0.0–2.0 (synthetic passes, or unsourced sittings; label
   *    "indikativ").
   */
  derived: 'official-derived' | 'linear'
}

const MAX_SCORE = 2.0

/** Linear correct-fraction → 0.0–2.0, the honest-but-approximate curve. */
function linear(correct: number, presented: number): number {
  return Math.max(0, Math.min(MAX_SCORE, (correct / presented) * MAX_SCORE))
}

/**
 * Read the official 80-q table at a (possibly fractional) raw score,
 * linearly interpolating between the two neighbouring rows. `raw` is
 * clamped to [0, 80].
 */
function readTable(table: number[], raw: number): number {
  const clamped = Math.max(0, Math.min(80, raw))
  const lo = Math.floor(clamped)
  const hi = Math.ceil(clamped)
  if (lo === hi) return table[lo]
  const frac = clamped - lo
  return table[lo] + (table[hi] - table[lo]) * frac
}

/**
 * Derive a normed 0.0–2.0 score for one 40-q half.
 *
 * @param sitting  the sitting's normering data, or null when unsourced.
 * @param half     which half-type table to use.
 * @param correct  raw correct answers on the pass.
 * @param presented questions actually presented (may be < 40 if a pass
 *                  is short; the ratio still scales to the 80-q axis).
 *
 * Authentic passes with a table → 'official-derived'; everything else
 * (no sitting, no half table, presented 0) → 'linear' (or null score).
 */
export function normedScore(
  sitting: NormeringSitting | null | undefined,
  half: MockHalf,
  correct: number,
  presented: number,
): NormedResult {
  if (presented <= 0) return { score: null, derived: 'linear' }

  const halfTable = sitting?.[half]?.table
  if (!halfTable || halfTable.length !== 81) {
    return { score: linear(correct, presented), derived: 'linear' }
  }

  // Scale the 40-q raw up to the official 80-q axis, then read/interpolate.
  const scaledRaw = (correct / presented) * 80
  const raw = readTable(halfTable, scaledRaw)
  const score = Math.max(0, Math.min(MAX_SCORE, Math.round(raw * 100) / 100))
  return { score, derived: 'official-derived' }
}

// ── Fetch loader (browser) ─────────────────────────────────────────────
// Mirrors src/data/questions.ts: static JSON under /normering/, memoised
// per exam id so repeated result renders share one round-trip. A missing
// sitting resolves to null (caller falls back to linear) rather than
// throwing — a normering gap must never break the result screen.

const cache = new Map<string, Promise<NormeringSitting | null>>()

export function loadNormeringTable(
  examId: string | null | undefined,
): Promise<NormeringSitting | null> {
  if (!examId) return Promise.resolve(null)
  const hit = cache.get(examId)
  if (hit) return hit
  const p = (async () => {
    try {
      const res = await fetch(`/normering/${examId}.json`)
      if (!res.ok) return null
      const data = (await res.json()) as NormeringSitting
      if (!data || typeof data !== 'object' || data.exam_id !== examId) return null
      return data
    } catch {
      return null
    }
  })()
  cache.set(examId, p)
  return p
}

/** Test-only: clear the loader memo between cases. */
export function __resetNormeringCacheForTests(): void {
  cache.clear()
}
