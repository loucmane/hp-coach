// Replay question selection.
//
// Takes the due-mistakes list (already sorted server-side by errorCount
// desc, lastErrorAt desc) and resolves each questionId to a real
// Question from the (lazily-loaded) bank. Mistakes whose questionId no
// longer resolves (parser changed, qid regenerated, etc.) are silently
// skipped — better to hand the user N-k usable questions than crash.

import type { Mistake } from '@/api/hooks/useMistakes'
import { loadBank, type Question } from '@/data/questions'

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
  mistakeId: number
}

export async function pickReplayQuestions(
  due: readonly Mistake[],
  count: number = DEFAULT_REPLAY_LENGTH,
): Promise<ReplayItem[]> {
  const bank = await loadBank()
  const out: ReplayItem[] = []
  for (const m of due) {
    if (out.length >= count) break
    const q = bank.find((x) => x.qid === m.questionId)
    if (!q) continue
    if (q.parsing_status !== 'complete' || !q.options) continue
    out.push({ question: q, mistakeId: m.id })
  }
  return out
}

/** Ghost-replay guard (residual #290) — prunes an adopted adaptive_review
 *  session's STORED plan down to qids that still correspond to a mistake
 *  in the CURRENT due list. Without this, resuming/adopting an active
 *  repetition session replays its plan verbatim, including questions
 *  whose mistakes were since resolved (a correct answer elsewhere) or
 *  rescheduled out (SRS pushed nextReviewAt into the future) — the user
 *  replays a question that's already "done".
 *
 *  Pure and synchronous: no bank/network access, just a set-membership
 *  filter over questionIds, so it's trivial to unit-test and safe to run
 *  on every adopt. Preserves the STORED plan's own order — that order is
 *  already meaningful (server-sorted errorCount desc, lastErrorAt desc at
 *  session-creation time) — we only drop entries, never reorder.
 *
 *  Scope: only wired into /repetition's resolvePlan (kind=adaptive_review).
 *  Drill plans aren't mistake-backed, so pruning against the due-mistakes
 *  list would be meaningless there — drill's resolvePlan doesn't call this. */
export function prunePlan(qids: readonly string[], due: readonly Mistake[]): string[] {
  const dueIds = new Set(due.map((m) => m.questionId))
  return qids.filter((qid) => dueIds.has(qid))
}
