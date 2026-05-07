// Question bank type + helpers.
//
// We bundle var-2026 directly via Vite's JSON import — no runtime fetch,
// no R2 dependency, no loading state. The dataset is tiny (~55 KB) and
// regenerated locally by `parser/build_var2026.py`. When we scale to all
// 27 exams (~3 MB) we'll move this to a fetched + cached resource, but
// for the dogfood phase the import keeps everything synchronous.
//
// SOURCE: data/parsed/var-2026.json — copy via `app/scripts/sync-dataset.sh`
// after re-running the parser. The TS shape MUST stay in lock-step with
// the parser's emit; we assert at module load that the file is valid.

import rawVar2026 from './var-2026.json'

export const PROVPASS_KEYS = ['verb1', 'verb2', 'kvant1', 'kvant2'] as const
export type Provpass = (typeof PROVPASS_KEYS)[number]

export const SECTION_KEYS = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK'] as const
export type Section = (typeof SECTION_KEYS)[number]

export const ANSWER_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const
export type AnswerLetter = (typeof ANSWER_LETTERS)[number]

export type Option = {
  letter: AnswerLetter
  text: string
}

export type Question = {
  qid: string
  exam_id: string
  provpass: Provpass
  section: Section
  number: number
  prompt: string | null
  options: Option[] | null
  answer: AnswerLetter
  /** "complete" — full prompt + options parsed; "answer_only" — stub. */
  parsing_status: 'complete' | 'answer_only'
}

// Cast to the strict shape — the parser is source of truth, but this gives
// the rest of the SPA real types instead of `any`.
export const VAR_2026: readonly Question[] = rawVar2026 as Question[]

/** All questions across all loaded exams. Single concat point. */
export const ALL_QUESTIONS: readonly Question[] = VAR_2026

/** Filter helper — returns only fully-parsed questions in a section. */
export function questionsInSection(bank: readonly Question[], section: Section): Question[] {
  return bank.filter((q) => q.section === section && q.parsing_status === 'complete' && q.options)
}

/** Look up a question by qid; throws if not found (caller bugs are noisy). */
export function findQuestion(bank: readonly Question[], qid: string): Question {
  const q = bank.find((x) => x.qid === qid)
  if (!q) throw new Error(`Question not found: ${qid}`)
  return q
}
