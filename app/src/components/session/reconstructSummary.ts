// Rebuild a DrillResult summary from a completed session's persisted
// attempts. Used to make the "Klart." payoff survive a refresh (the
// done phase is otherwise in-memory only) and to render any past pass
// from the drill-history view — both just need { questions, picks }.
//
// Attempts arrive oldest-first (GET /sessions/:id/attempts). We resolve
// each qid against the loaded bank and keep questions + picks aligned;
// a qid that no longer resolves (corpus drift) is dropped from BOTH so
// the facit never renders a pick against a missing question.

import type { DrillSummary } from '@/components/drill/DrillResult'
import type { AnswerLetter } from '@/data/questions'
import { findQuestion, type Question } from '@/data/questions'

export type SessionAttempt = {
  questionId: string
  selectedAnswer: string | null
  correct?: boolean | null
}

export function reconstructSummary(
  attempts: readonly SessionAttempt[],
  bank: readonly Question[],
): DrillSummary {
  const questions: Question[] = []
  const picks: (AnswerLetter | null)[] = []
  for (const a of attempts) {
    const q = findQuestion(bank, a.questionId)
    if (!q) continue
    questions.push(q)
    picks.push((a.selectedAnswer as AnswerLetter | null) ?? null)
  }
  return { questions, picks }
}
