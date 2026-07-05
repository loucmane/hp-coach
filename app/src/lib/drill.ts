// Drill question selection.
//
// MVP: random pick of N fully-parsed questions in a single section.
// Adaptive selection (mistake replay, weakest L1 cluster, SRS-due) lands
// in later branches once we have the data to drive it.
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

/**
 * Pick `count` distinct questions from `section`. Uses Math.random by
 * default; tests pass a seeded RNG to make selection deterministic.
 */
export async function pickDrillQuestions(
  section: Section,
  count: number = DEFAULT_DRILL_LENGTH,
  rng: () => number = Math.random,
): Promise<Question[]> {
  const bank = await loadBank()
  const pool = questionsInSection(bank, section)
  if (pool.length === 0) return []
  // DTK is drilled as BLOCKS: a figure page + its ~3-4 questions form one
  // unit (block = shared figure.src). Keep block-mates whole + consecutive
  // so you orient to a dense page ONCE, not 4× scattered — the real exam
  // rhythm, and the executive tax the ADHD-PI dogfooder handles worst.
  // (Panel decision 2026-07-05.) Every other section stays per-question.
  if (section === 'DTK') return pickDtkBlocks(pool, count, rng)
  // Fisher–Yates over a copy, then slice.
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
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
