// Drill question selection.
//
// MVP: random pick of N fully-parsed questions in a single section.
// Adaptive selection (mistake replay, weakest L1 cluster, SRS-due) lands
// in later branches once we have the data to drive it.
//
// Async because the underlying bank is now fetched lazily on first
// call (see data/questions.ts). After the first load it's cached at
// module scope, so subsequent picks resolve in microseconds.

import { loadBank, type Question, questionsInSection, type Section } from '@/data/questions'

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
  // Fisher–Yates over a copy, then slice.
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/** Tiny seeded LCG — only used by tests; production goes through Math.random. */
export function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (1103515245 * s + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}
