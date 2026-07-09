// Provpass (mock exam) composition — pure functions, no I/O.
//
// Three question sources feed a 40-question pass:
//   - listAuthenticPasses / resolveAuthentic: a REAL exam half exactly as
//     printed (original `number` order), scored as the honest scoreboard.
//   - pickSynthetic: a quota-matched, least-seen composite pass across the
//     whole corpus — the pacing gym, labelled "indikativ" by the UI.
//
// Exposure (how many times / how recently the user has seen a question)
// drives both: authentic passes are surfaced least-exposed-first so the
// picker nudges toward fresh material, and synthetic composition always
// prefers the least-seen pool.
//
// GROUP ATOMICITY: DTK (shares a figure page) and LÄS/ELF (share a
// passage/context) must never split a group across "answered" and
// "left out" — you either get the whole figure/passage's questions or
// none of them, same rule pickDtkBlocks (lib/drill.ts) uses for regular
// drills. See pickSynthetic for the group-then-greedy-then-swap algorithm.

import type { ExposureMap, MockBreakdown, MockHalf } from '@/api/hooks/useMockResults'
import type { Provpass, Question, Section } from '@/data/questions'

export type PassOption = {
  examId: string
  provpass: Provpass
  half: MockHalf
  /** Fully-parsed questions available for this pass (out of the nominal 40). */
  presented: number
  /** Of `presented`, how many the user has at least one attempt on. */
  seenBefore: number
  /** Sum of exposure counts across `presented` questions (0 if unseen). */
  totalExposure: number
}

const VERBAL_SECTIONS: readonly Section[] = ['ORD', 'LÄS', 'MEK', 'ELF']

/** Section → quota for a synthetic pass. Order matters — it's the order
 *  sections appear in the composed plan. */
const SYNTHETIC_QUOTAS: Record<MockHalf, ReadonlyArray<[Section, number]>> = {
  verbal: [
    ['ORD', 10],
    ['LÄS', 10],
    ['MEK', 10],
    ['ELF', 10],
  ],
  kvant: [
    ['XYZ', 12],
    ['KVA', 10],
    ['NOG', 6],
    ['DTK', 12],
  ],
}

/** Sections whose questions must be picked/dropped as whole groups
 *  (shared figure page for DTK, shared passage `context` for LÄS/ELF). */
const GROUP_ATOMIC_SECTIONS = new Set<Section>(['DTK', 'LÄS', 'ELF'])

function halfOf(section: Section): MockHalf {
  return VERBAL_SECTIONS.includes(section) ? 'verbal' : 'kvant'
}

function exposureOf(exposure: ExposureMap, qid: string): number {
  return exposure[qid]?.n ?? 0
}

/**
 * One entry per (examId, provpass) pair present in the bank, sorted
 * least-exposed-first (by totalExposure, ties broken by presented desc
 * so more-complete passes surface first).
 */
export function listAuthenticPasses(bank: Question[], exposure: ExposureMap): PassOption[] {
  const groups = new Map<string, { examId: string; provpass: Provpass; questions: Question[] }>()
  for (const q of bank) {
    const key = `${q.exam_id}::${q.provpass}`
    let g = groups.get(key)
    if (!g) {
      g = { examId: q.exam_id, provpass: q.provpass, questions: [] }
      groups.set(key, g)
    }
    g.questions.push(q)
  }

  const out: PassOption[] = []
  for (const g of groups.values()) {
    const complete = g.questions.filter((q) => q.parsing_status === 'complete' && q.options)
    if (complete.length === 0) continue
    let seenBefore = 0
    let totalExposure = 0
    for (const q of complete) {
      const n = exposureOf(exposure, q.qid)
      totalExposure += n
      if (n > 0) seenBefore++
    }
    // A pass is verbal/kvant uniformly — infer from the first question's
    // section (all questions in one exam+provpass share a half by
    // construction: verb1/verb2 hold only verbal sections, kvant1/kvant2
    // only kvant sections).
    const half = halfOf(complete[0].section)
    out.push({
      examId: g.examId,
      provpass: g.provpass,
      half,
      presented: complete.length,
      seenBefore,
      totalExposure,
    })
  }

  out.sort((a, z) => {
    if (a.totalExposure !== z.totalExposure) return a.totalExposure - z.totalExposure
    return z.presented - a.presented
  })
  return out
}

/** The exact question set for one authentic pass, in printed order
 *  (`number` ascending), complete-only. */
export function resolveAuthentic(bank: Question[], examId: string, provpass: string): Question[] {
  return bank
    .filter(
      (q) =>
        q.exam_id === examId &&
        q.provpass === provpass &&
        q.parsing_status === 'complete' &&
        q.options,
    )
    .sort((a, z) => a.number - z.number)
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Group key for group-atomic sections: DTK by figure.src, LÄS/ELF by
 *  identical context. Falls back to the qid (singleton group) when the
 *  question has neither — degrades to a plain per-question pick rather
 *  than crashing. */
function groupKey(q: Question): string {
  if (q.section === 'DTK') return q.figure?.src ?? q.qid
  if (q.section === 'LÄS' || q.section === 'ELF') return q.context ?? q.qid
  return q.qid
}

function meanExposure(group: Question[], exposure: ExposureMap): number {
  const sum = group.reduce((acc, q) => acc + exposureOf(exposure, q.qid), 0)
  return sum / group.length
}

/**
 * Pick `quota` questions from one section's pool.
 *
 * Group-atomic sections (DTK/LÄS/ELF): group by groupKey, rank groups by
 * mean exposure ascending (rng tie-break on equal mean), then:
 *   1. greedily add whole groups while the running total stays <= quota
 *   2. if the running total is short, try a "best-fit swap" — find an
 *      untaken group that fills (or nearly fills) the remaining gap
 *      without overshoot, preferring an exact fit, else the largest
 *      fitting group, least-exposed first
 *   3. only as a LAST RESORT (still short after step 2), trim a partial
 *      group down to the remaining slots, keeping `number` order
 *
 * Singleton sections: plain exposure-ascending pick (rng tie-break),
 * take the first `quota`.
 */
function pickSectionQuota(
  pool: Question[],
  quota: number,
  exposure: ExposureMap,
  rng: () => number,
  atomic: boolean,
): Question[] {
  if (pool.length === 0 || quota <= 0) return []

  if (!atomic) {
    const ranked = shuffle(pool, rng).sort(
      (a, z) => exposureOf(exposure, a.qid) - exposureOf(exposure, z.qid),
    )
    return ranked.slice(0, Math.min(quota, ranked.length))
  }

  const groupsMap = new Map<string, Question[]>()
  for (const q of pool) {
    const key = groupKey(q)
    const g = groupsMap.get(key)
    if (g) g.push(q)
    else groupsMap.set(key, [q])
  }
  const groups = [...groupsMap.values()].map((g) => [...g].sort((a, z) => a.number - z.number))
  // Rank groups by mean exposure ascending; shuffle first so ties break
  // by rng rather than input order (stable sort preserves shuffle order
  // among equal means).
  const ranked = shuffle(groups, rng).sort(
    (a, z) => meanExposure(a, exposure) - meanExposure(z, exposure),
  )

  // 1. Greedy whole-group add while we don't overshoot.
  const taken: Question[][] = []
  let total = 0
  for (const g of ranked) {
    if (total + g.length <= quota) {
      taken.push(g)
      total += g.length
    }
  }

  if (total === quota) return taken.flat()

  // 2. Best-fit swap: look for an untaken group that fills the gap
  //    exactly, else the largest group that fits without overshoot.
  let left = ranked.filter((g) => !taken.includes(g))
  let remaining = quota - total
  while (remaining > 0 && left.length > 0) {
    const exact = left
      .filter((g) => g.length === remaining)
      .sort((a, z) => meanExposure(a, exposure) - meanExposure(z, exposure))
    const pick =
      exact[0] ??
      left
        .filter((g) => g.length > 0 && g.length <= remaining)
        .sort(
          (a, z) => z.length - a.length || meanExposure(a, exposure) - meanExposure(z, exposure),
        )[0]
    if (!pick) break
    taken.push(pick)
    total += pick.length
    left = left.filter((g) => g !== pick)
    remaining = quota - total
  }

  if (total === quota) return taken.flat()

  // 3. Last resort: trim the least-exposed remaining group down to the
  //    remaining slots (already sorted by `number` within the group).
  if (remaining > 0 && left.length > 0) {
    const partial = left.sort((a, z) => meanExposure(a, exposure) - meanExposure(z, exposure))[0]
    taken.push(partial.slice(0, remaining))
  }

  return taken.flat().slice(0, quota)
}

/**
 * Compose a synthetic (quota-matched, least-seen) pass for one half.
 * Sections stay grouped and appear in quota-declaration order (verbal:
 * ORD, LÄS, MEK, ELF; kvant: XYZ, KVA, NOG, DTK); within a section,
 * group-atomic picks preserve `number` order inside each group but
 * groups themselves are exposure-ranked, not necessarily contiguous by
 * number across the whole section.
 */
export function pickSynthetic(
  bank: Question[],
  exposure: ExposureMap,
  half: MockHalf,
  rng: () => number,
): Question[] {
  const quotas = SYNTHETIC_QUOTAS[half]
  const out: Question[] = []
  for (const [section, quota] of quotas) {
    const pool = bank.filter(
      (q) => q.section === section && q.parsing_status === 'complete' && q.options,
    )
    const atomic = GROUP_ATOMIC_SECTIONS.has(section)
    out.push(...pickSectionQuota(pool, quota, exposure, rng, atomic))
  }
  return out
}

export type MockSheetEntry = {
  letter: string | null
  timeMs: number
}

export type MockSheetLike = Map<string, MockSheetEntry>

export type MockSummary = {
  presented: number
  answered: number
  correct: number
  breakdown: MockBreakdown
}

/**
 * Reduce a finished (or abandoned) pass into the POST /api/mock-results
 * payload shape. Blanks (no sheet entry, or a null letter) are NOT
 * counted as answered. `correct` compares the sheet's letter against
 * `q.answer`. `missedQids` is answered-and-wrong only (blanks are
 * excluded — you can't "miss" a question you never touched).
 */
export function computeMockSummary(plan: Question[], sheet: MockSheetLike): MockSummary {
  const perSection: MockBreakdown['perSection'] = {}
  let answered = 0
  let correct = 0
  const missedQids: string[] = []

  for (const q of plan) {
    const entry = sheet.get(q.qid)
    const timeMs = entry?.timeMs ?? 0
    const bucket = perSection[q.section] ?? { presented: 0, correct: 0, timeMs: 0 }
    bucket.presented += 1
    bucket.timeMs += timeMs

    const letter = entry?.letter ?? null
    if (letter != null) {
      answered += 1
      if (letter === q.answer) {
        correct += 1
        bucket.correct += 1
      } else {
        missedQids.push(q.qid)
      }
    }
    perSection[q.section] = bucket
  }

  return {
    presented: plan.length,
    answered,
    correct,
    breakdown: { perSection, missedQids, version: 1 },
  }
}
