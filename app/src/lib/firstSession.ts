import type { AnswerLetter, Question } from '@/data/questions'

export const FIRST_SESSION_ROOT = 'ORD-ROOT-010'
export const FIRST_SESSION_QIDS = [
  'host-2016-verb2-ORD-004',
  'host-2021-verb2-ORD-003',
  'host-2025-verb2-ORD-010',
] as const
export const FIRST_SESSION_FALLBACK = 'host-2013-verb2-ORD-007'
export const DAILY_MINUTES = [10, 20, 30, 45] as const

/** Fixed authentic examples, with one known example as the only fallback.
 * Never shorten a pass whose payoff promises three real questions. */
export function pickFirstSessionQuestions(bank: readonly Question[]): Question[] {
  const ids: readonly string[] = [...FIRST_SESSION_QIDS, FIRST_SESSION_FALLBACK]
  const questions = ids
    .flatMap((qid) => {
      const q = bank.find((item) => item.qid === qid)
      return q?.section === 'ORD' && q.parsing_status === 'complete' && q.options?.length ? [q] : []
    })
    .slice(0, 3)
  return questions.length === 3 ? questions : []
}

export function firstSessionOrigin(qid: string): string | null {
  if (!([...FIRST_SESSION_QIDS, FIRST_SESSION_FALLBACK] as readonly string[]).includes(qid))
    return null
  return `Högskoleprovet hösten ${qid.split('-')[1]}`
}

export function firstSessionDoneLine(
  questions: readonly Question[],
  picks: readonly (AnswerLetter | null)[],
): string | null {
  if (questions.length !== 3 || picks.length !== 3 || picks.some((pick) => !pick)) return null
  return questions.every((q, i) => q.answer === picks[i])
    ? 'Du klarade 3 av 3 frågor från riktiga högskoleprov'
    : 'Du har gjort dina första 3 frågor från riktiga högskoleprov'
}
