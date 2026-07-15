// Drill question selection.
//
// Two modes, one code path:
//   · RANDOM (default / no ratings): a uniform Fisher–Yates shuffle of the
//     section's playable pool, sliced to `count`.
//   · SMART (PL-L.3): when the caller passes learned `ratings` (the Elo fit
//     from lib/fit.ts, surfaced via /api/item-stats + /api/me/ability), the
//     picker biases toward questions predicted to land in the 0.70–0.85
//     LEARNING band — hard enough to teach, not so hard they're noise. It
//     stays a pure re-ordering of the SAME shuffled pool: the random shuffle
//     is the tiebreak, so variety survives and ratings-absent is byte-for-
//     byte identical to the old behavior.
//
// The band targets learning, NOT comfort — an in-band question is one you get
// right ~70–85% of the time, i.e. the productive-struggle zone; we do not skew
// easier. Unrated questions (no fitted difficulty yet) get a neutral in-band
// score so fresh content keeps circulating instead of being starved.
//
// Async because the underlying bank is now fetched lazily on first
// call (see data/questions.ts). After the first load it's cached at
// module scope, so subsequent picks resolve in microseconds.

import {
  loadBank,
  type Question,
  questionsInSection,
  SECTION_KEYS,
  type Section,
} from '@/data/questions'

export const DEFAULT_DRILL_LENGTH = 10

export type DrillPlan = {
  section: Section
  questions: Question[]
}

// ── Learning-band targeting (PL-L.3) ──────────────────────────────────────
//
// Mirrors worker/src/lib/fit.ts EXACTLY so client-side scoring matches the
// server fit: guess-floored logistic. P(correct) = g + (1−g)·raw, where
// raw = 1 / (1 + 10^((difficulty − ability) / 400)). g = 0.2 is the MCQ guess
// floor (a 4–5-option question is cleared ~20% by luck). Keep these constants
// in sync with lib/fit.ts if the server formula ever changes.
export const ELO_SCALE = 400
export const GUESS_FLOOR = 0.2
// The learning band: prefer questions the solver gets right this often.
export const BAND_LOW = 0.7
export const BAND_HIGH = 0.85
// Center of the band — the "neutral" score handed to unrated questions so new
// content circulates alongside the best-targeted rated ones.
const BAND_MID = (BAND_LOW + BAND_HIGH) / 2

/** Per-question learned ratings the smart picker consumes. `difficulty` is a
 *  qid→Elo map (only rated questions appear); `ability` is the user's Elo for
 *  the section being drilled. */
export type DrillRatings = {
  difficulty: Record<string, number>
  ability: number
}

/** Guess-floored P(correct) — the same value the server fit updates against
 *  (lib/fit.ts flooredExpectedScore). */
export function predictedPCorrect(difficulty: number, ability: number): number {
  const raw = 1 / (1 + 10 ** ((difficulty - ability) / ELO_SCALE))
  return GUESS_FLOOR + (1 - GUESS_FLOOR) * raw
}

/** Distance from the [BAND_LOW, BAND_HIGH] learning band. 0 inside the band;
 *  grows with how far outside `p` falls. Lower sorts first (more preferred). */
export function bandDistance(p: number): number {
  if (p >= BAND_LOW && p <= BAND_HIGH) return 0
  return p < BAND_LOW ? BAND_LOW - p : p - BAND_HIGH
}

/** Band score for one question: its distance-to-band, or the neutral mid-band
 *  score (0) when the question has no fitted difficulty yet. */
export function questionBandScore(qid: string, ratings: DrillRatings): number {
  const d = ratings.difficulty[qid]
  if (d === undefined) return bandDistance(BAND_MID) // === 0
  return bandDistance(predictedPCorrect(d, ratings.ability))
}

/** Band score for a DTK block, scored AS A WHOLE (blocks are atomic): the
 *  band-distance of the block's MEAN predicted-P over its rated members. A
 *  block with no rated members gets the neutral mid-band score. */
export function blockBandScore(block: readonly Question[], ratings: DrillRatings): number {
  let sum = 0
  let rated = 0
  for (const q of block) {
    const d = ratings.difficulty[q.qid]
    if (d === undefined) continue
    sum += predictedPCorrect(d, ratings.ability)
    rated += 1
  }
  if (rated === 0) return bandDistance(BAND_MID) // === 0, neutral
  return bandDistance(sum / rated)
}

/**
 * Pick `count` distinct questions from `section`. Uses Math.random by
 * default; tests pass a seeded RNG to make selection deterministic.
 *
 * When `ratings` is supplied, the shuffled pool is re-ordered to prefer the
 * 0.70–0.85 learning band (stable sort → the shuffle stays the tiebreak).
 * When omitted, behavior is IDENTICAL to the pre-PL-L.3 random picker.
 */
export async function pickDrillQuestions(
  section: Section,
  count: number = DEFAULT_DRILL_LENGTH,
  rng: () => number = Math.random,
  ratings?: DrillRatings,
): Promise<Question[]> {
  const bank = await loadBank()
  const pool = questionsInSection(bank, section)
  if (pool.length === 0) return []
  // DTK is drilled as BLOCKS: a figure page + its ~3-4 questions form one
  // unit (block = shared figure.src). Keep block-mates whole + consecutive
  // so you orient to a dense page ONCE, not 4× scattered — the real exam
  // rhythm, and the executive tax the ADHD-PI dogfooder handles worst.
  // (Panel decision 2026-07-05.) Every other section stays per-question.
  if (section === 'DTK') return pickDtkBlocks(pool, count, rng, ratings)
  // Fisher–Yates over a copy, then slice.
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  // SMART re-order: stable-sort the already-shuffled pool by band distance so
  // in-band (and unrated-neutral) questions come first, with the shuffle as
  // the tiebreak. Array.prototype.sort is stable, so equal-distance questions
  // keep their shuffled order — variety survives. No ratings → skip entirely,
  // preserving the exact random ordering.
  if (ratings) {
    shuffled.sort((a, b) => questionBandScore(a.qid, ratings) - questionBandScore(b.qid, ratings))
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/**
 * DTK block picker. Groups the pool by shared figure page, shuffles the
 * BLOCKS (not the questions), and appends whole blocks until the session
 * reaches `count`. Within a block, questions keep their natural number
 * order (1→4 against the page). A block is atomic — sessions land at
 * 8-13 questions for a target of 10, which is fine (whole clusters beat
 * an exact count for DTK). A question with no shared page (shouldn't
 * happen post-figure-pipeline) becomes its own singleton block, so the
 * function degrades to a plain shuffle rather than crashing.
 */
export function pickDtkBlocks(
  pool: readonly Question[],
  count: number,
  rng: () => number,
  ratings?: DrillRatings,
): Question[] {
  const groups = new Map<string, Question[]>()
  for (const q of pool) {
    const key = q.figure?.src ?? q.qid
    const g = groups.get(key)
    if (g) g.push(q)
    else groups.set(key, [q])
  }
  const blocks = [...groups.values()].map((b) => [...b].sort((a, z) => a.number - z.number))
  // Fisher–Yates over the blocks.
  for (let i = blocks.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
  }
  // SMART re-order: stable-sort whole BLOCKS by their mean-band distance so
  // in-band pages come first, shuffle as tiebreak. Blocks stay atomic — we
  // only reorder them, never split. No ratings → unchanged random block order.
  if (ratings) {
    blocks.sort((a, b) => blockBandScore(a, ratings) - blockBandScore(b, ratings))
  }
  const out: Question[] = []
  for (const block of blocks) {
    if (out.length >= count) break
    out.push(...block)
  }
  return out
}

/**
 * Pick `count` questions INTERLEAVED across all 8 sections — the genuine
 * "Blandad övning · alla sektioner" mastery-maintenance drill. Draws
 * round-robin (one section at a time, in rotation) from per-section shuffled
 * pools, so a 10-question set is spread across sections rather than clustered
 * in one. Replaces the old bug where the mastery item's bare `/drill` fell
 * through to an ORD-only section drill. Only fully-parsed (playable) questions
 * are eligible, via `questionsInSection`.
 */
export async function pickMixedDrillQuestions(
  count: number = DEFAULT_DRILL_LENGTH,
  rng: () => number = Math.random,
): Promise<Question[]> {
  const bank = await loadBank()
  // One shuffled pool per section (already filtered to playable questions).
  const pools = SECTION_KEYS.map((section) => {
    const pool = questionsInSection(bank, section)
    const shuffled = [...pool]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  })
  // Round-robin across sections until we have `count` or every pool is dry.
  const out: Question[] = []
  let drewThisRound = true
  while (out.length < count && drewThisRound) {
    drewThisRound = false
    for (const pool of pools) {
      if (out.length >= count) break
      const q = pool.pop()
      if (q) {
        out.push(q)
        drewThisRound = true
      }
    }
  }
  return out
}

/** Tiny seeded LCG — only used by tests; production goes through Math.random. */
export function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (1103515245 * s + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}
