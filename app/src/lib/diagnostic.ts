// Diagnostic question selection.
//
// B4 onboarding flow: a fresh user opens the app, taps the cold-start
// "Diagnos · några frågor" item, and gets a 10-question sample spread
// across all 8 sections. Results record like any other session (POST
// /api/attempts via SessionPlayer), seeding the score model so the
// next plan generation has real per-section signal.
//
// Distribution:
//   - 1 question per section guarantees coverage of all 8 (floor)
//   - 2 extra slots get one each to randomly-picked sections
//   - Total: 10 fully-parsed questions
//
// Falls back gracefully when a section has zero parsed questions —
// just skips that section's slot (10 → 9). The corpus has dozens of
// parsed questions per section in practice, so the empty case is only
// hit by the test harness or a wholly broken dataset.

import { loadBank, type Question, questionsInSection, SECTION_KEYS } from '@/data/questions'

export const DIAGNOSTIC_LENGTH = 10

/** Build the diagnostic question plan. `rng` is injectable for
 *  deterministic tests; production callers use the default `Math.random`. */
export async function pickDiagnosticQuestions(
  count: number = DIAGNOSTIC_LENGTH,
  rng: () => number = Math.random,
): Promise<Question[]> {
  const bank = await loadBank()
  const perSection = bank.length === 0 ? 0 : 1
  if (perSection === 0) return []

  // 1 per section, capped at SECTION_KEYS.length. Extras get sprinkled
  // round-robin into a randomized order so the distribution is balanced
  // but not deterministic across sessions.
  const baseQuota = Math.floor(count / SECTION_KEYS.length)
  const extras = count - baseQuota * SECTION_KEYS.length
  const sectionOrder = shuffle([...SECTION_KEYS], rng)
  const quotaBySection = new Map(sectionOrder.map((s, i) => [s, baseQuota + (i < extras ? 1 : 0)]))

  const out: Question[] = []
  for (const section of SECTION_KEYS) {
    const want = quotaBySection.get(section) ?? 0
    if (want === 0) continue
    const pool = questionsInSection(bank, section)
    if (pool.length === 0) continue
    const shuffled = shuffle([...pool], rng)
    out.push(...shuffled.slice(0, Math.min(want, shuffled.length)))
  }

  // Shuffle the final order so the user doesn't see all 4 verbal then
  // all 4 quant; alternating keeps the diagnostic feeling balanced.
  return shuffle(out, rng)
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
