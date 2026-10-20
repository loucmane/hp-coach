// Replay question selection.
//
// Takes the due-mistakes list (already sorted server-side by errorCount
// desc, lastErrorAt desc) and resolves each questionId to a real
// Question from the (lazily-loaded) bank. Mistakes whose questionId no
// longer resolves (parser changed, qid regenerated, etc.) are silently
// skipped — better to hand the user N-k usable questions than crash.
//
// Samma fälla, ny fråga (hpf-bz6f.2). After one facit, replaying the SAME
// LÄS/MEK/ELF/quant question tests memory of the key, not the skill. So a
// miss whose question carries a Layer 1 trap (lib/trapIndex.ts) is
// repeated through a NEW question with that trap: same section, playable,
// not already in the round and not itself a due miss — unseen first, else
// the least recently seen. The item stays linked to the source mistake, so
// the answer moves THAT row (PATCH /api/mistakes/:id/review): the miss
// counts as relearned only through right answers on new questions. ORD,
// untagged questions and traps with nothing left keep the missed question
// itself — word knowledge belongs to the word.

import type { Mistake } from '@/api/hooks/useMistakes'
import type { ExposureMap } from '@/api/hooks/useMockResults'
import { EXCLUDED_QUESTIONS } from '@/data/figureOverrides'
import { findQuestion, loadBank, type Question } from '@/data/questions'
import { EMPTY_TRAP_INDEX, loadTrapIndex, type TrapIndex } from '@/lib/trapIndex'

/** Single source of truth for the per-session repetition queue size.
 *  The replay route plays at most this many missed questions per
 *  session; the scheduler caps its "Repetition · N missar" prescription
 *  to the same number; the /drill banner advertises the same number.
 *  Without this constant, the three surfaces disagreed (50 / 71 / 10),
 *  which was the user's #1 complaint at dogfood pass 2. */
export const REPETITION_SESSION_SIZE = 10
/** @deprecated kept for backwards compatibility — prefer
 *  `REPETITION_SESSION_SIZE`. */
export const DEFAULT_REPLAY_LENGTH = REPETITION_SESSION_SIZE

export type ReplayItem = {
  question: Question
  /** The due mistake this item repeats — the row its answer moves. */
  mistakeId: number
  /** The missed question. Equals `question.qid` unless `sibling`. */
  sourceQid: string
  /** `question` is a new question with the source's trap. */
  sibling: boolean
}

export type ReplayPickOptions = {
  /** Per-question exposure (GET /api/me/exposure). Missing = unseen. */
  exposure?: ExposureMap
  /** The trap index to pick siblings from; loads the static one when
   *  omitted. */
  traps?: TrapIndex
}

export async function pickReplayQuestions(
  due: readonly Mistake[],
  count: number = DEFAULT_REPLAY_LENGTH,
  { exposure = {}, traps }: ReplayPickOptions = {},
): Promise<ReplayItem[]> {
  const [bank, index] = await Promise.all([loadBank(), traps ?? loadTrapsOrNone()])
  const byQid = new Map(bank.map((q) => [q.qid, q]))
  const dueQids = new Set(due.map((m) => m.questionId))
  const inRound = new Set<string>()
  const out: ReplayItem[] = []
  for (const m of due) {
    if (out.length >= count) break
    const source = byQid.get(m.questionId)
    if (!source) continue
    const sibling = pickSibling(source, index, byQid, exposure, inRound, dueQids)
    if (sibling) {
      inRound.add(sibling.qid)
      out.push({ question: sibling, mistakeId: m.id, sourceQid: source.qid, sibling: true })
      continue
    }
    if (source.parsing_status !== 'complete' || !source.options) continue
    inRound.add(source.qid)
    out.push({ question: source, mistakeId: m.id, sourceQid: source.qid, sibling: false })
  }
  return out
}

/** The trap index, or none when it can't load — a failed fetch must never
 *  cost the round; every miss is then replayed as itself. */
function loadTrapsOrNone(): Promise<TrapIndex> {
  return loadTrapIndex().catch(() => EMPTY_TRAP_INDEX)
}

/** A new question with `source`'s trap, or null. Unseen first, else the
 *  least recently seen; ties keep the index's qid order. */
function pickSibling(
  source: Question,
  traps: TrapIndex,
  byQid: ReadonlyMap<string, Question>,
  exposure: ExposureMap,
  inRound: ReadonlySet<string>,
  dueQids: ReadonlySet<string>,
): Question | null {
  // Word knowledge belongs to the word: ORD repeats the item itself.
  if (source.section === 'ORD') return null
  const trap = traps.trapOf(source.qid)
  if (!trap) return null
  let best: Question | null = null
  let bestLast = Number.POSITIVE_INFINITY
  for (const qid of traps.qidsFor(trap)) {
    if (qid === source.qid || inRound.has(qid) || dueQids.has(qid)) continue
    const q = byQid.get(qid)
    if (!q || q.section !== source.section || !playable(q)) continue
    const seen = exposure[qid]
    // Unseen sorts before every seen question (last = -1).
    const last = seen && seen.n > 0 ? Number(seen.last) || 0 : -1
    if (last < bestLast) {
      best = q
      bestLast = last
    }
  }
  return best
}

/** Fully parsed and not withheld by the figure audit — what a drill
 *  would serve (see questionsInSection). */
function playable(q: Question): boolean {
  return q.parsing_status === 'complete' && !!q.options && !EXCLUDED_QUESTIONS.has(q.qid)
}

/** A stored plan entry linked back to the due mistake it repeats. */
export type PlanLink = {
  qid: string
  mistakeId: number
  sourceQid: string
  sibling: boolean
}

/** Ghost-replay guard (residual #290) — prunes an adopted adaptive_review
 *  session's STORED plan down to entries that still repeat a mistake in
 *  the CURRENT due list. Without this, resuming/adopting an active
 *  repetition session replays its plan verbatim, including questions
 *  whose mistakes were since resolved (a correct answer elsewhere) or
 *  rescheduled out (SRS pushed nextReviewAt into the future) — the user
 *  replays a question that's already "done".
 *
 *  Sibling-aware (hpf-bz6f.2): the server session stores only qids, so a
 *  stored new question is re-linked to its source mistake rather than
 *  dropped. An entry that IS a due mistake's question repeats that
 *  mistake; every other entry with a trap repeats the first due mistake
 *  (due order) with the same trap and section that no other entry
 *  repeats. Own-question entries claim their mistakes first. Anything left
 *  unlinked is dropped. With an unchanged due list this rebuilds exactly
 *  the links the picker made, because the picker walks the due list in the
 *  same order; on any device, since it needs no stored mapping.
 *
 *  Pure and synchronous: no bank/network access, so it's trivial to
 *  unit-test and safe to run on every adopt. Preserves the STORED plan's
 *  own order — we only drop entries, never reorder.
 *
 *  Scope: only wired into /repetition's resolvePlan (kind=adaptive_review).
 *  Drill plans aren't mistake-backed, so pruning against the due-mistakes
 *  list would be meaningless there — drill's resolvePlan doesn't call this. */
export function prunePlan(
  qids: readonly string[],
  due: readonly Mistake[],
  traps: TrapIndex = EMPTY_TRAP_INDEX,
): PlanLink[] {
  const dueByQid = new Map(due.map((m) => [m.questionId, m]))
  const claimed = new Set<number>()
  for (const qid of qids) {
    const own = dueByQid.get(qid)
    if (own) claimed.add(own.id)
  }
  const out: PlanLink[] = []
  for (const qid of qids) {
    const own = dueByQid.get(qid)
    if (own) {
      out.push({ qid, mistakeId: own.id, sourceQid: qid, sibling: false })
      continue
    }
    // Same rule as the picker: ORD never repeats through another item.
    const trap = sectionOf(qid) === 'ORD' ? null : traps.trapOf(qid)
    if (!trap) continue
    const source = due.find(
      (m) =>
        !claimed.has(m.id) &&
        traps.trapOf(m.questionId) === trap &&
        sectionOf(m.questionId) === sectionOf(qid),
    )
    if (!source) continue
    claimed.add(source.id)
    out.push({ qid, mistakeId: source.id, sourceQid: source.questionId, sibling: true })
  }
  return out
}

/** prunePlan, resolved to playable items: a stored qid that no longer
 *  resolves in the bank is dropped, never thrown. The /repetition resume
 *  path. */
export async function resolveReplayPlan(
  qids: readonly string[],
  due: readonly Mistake[],
  { traps }: Pick<ReplayPickOptions, 'traps'> = {},
): Promise<ReplayItem[]> {
  const [bank, index] = await Promise.all([loadBank(), traps ?? loadTrapsOrNone()])
  const out: ReplayItem[] = []
  for (const link of prunePlan(qids, due, index)) {
    const question = findQuestion(bank, link.qid)
    if (!question) continue
    out.push({
      question,
      mistakeId: link.mistakeId,
      sourceQid: link.sourceQid,
      sibling: link.sibling,
    })
  }
  return out
}

/** "var-2026-verb1-LÄS-003" → "LÄS": the section is the qid's second-to-
 *  last segment (exam ids carry hyphens of their own). */
function sectionOf(qid: string): string | undefined {
  const parts = qid.split('-')
  return parts[parts.length - 2]
}
