// Replay question selection.
//
// Takes the due-mistakes list (already sorted server-side by errorCount
// desc, lastErrorAt desc) and resolves each questionId to a real
// Question from the (lazily-loaded) bank. Mistakes whose questionId no
// longer resolves (parser changed, qid regenerated, etc.) are silently
// skipped — better to hand the user N-k usable questions than crash.

import type { Mistake } from '@/api/hooks/useMistakes'
import { loadBank, type Question } from '@/data/questions'

export const DEFAULT_REPLAY_LENGTH = 10

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
