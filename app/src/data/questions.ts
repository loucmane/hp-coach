// Question bank type + helpers.
//
// We bundle every parsed exam directly via Vite's import.meta.glob —
// no runtime fetch, no R2 dependency, no loading state. The current
// dataset is ~1.3 MB across 22 exams; once full-section parsing lands
// for all 27 it'll be ~3 MB and we may switch to a lazy fetched
// resource. For dogfood the synchronous bundle keeps everything
// instant.
//
// SOURCE: data/parsed/{exam_id}.json — copy via
// `app/scripts/sync-dataset.sh` after re-running the parser. The TS
// shape MUST stay in lock-step with the parser's emit; we cast at
// module load so the rest of the SPA gets real types instead of `any`.

const examModules = import.meta.glob<{ default: unknown[] }>('./*.json', {
  eager: true,
})

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
  /** Passage / image-context the question refers to.
   *  Used by LÄS, ELF, and DTK; null for ORD/MEK/XYZ/KVA/NOG. */
  context: string | null
  /** "complete" — full prompt + options parsed; "answer_only" — stub. */
  parsing_status: 'complete' | 'answer_only'
}

// Collect every exam JSON into a flat question array. The glob includes
// the parser manifest (_index.json) which we filter out: it has a
// different shape and isn't a question array.
const collected: Question[] = []
for (const [path, mod] of Object.entries(examModules)) {
  if (path.endsWith('/_index.json')) continue
  const rows = mod.default as Question[]
  // Skip anything that doesn't smell like a Question array — defensive
  // in case a non-question JSON gets dropped into src/data.
  if (!Array.isArray(rows) || rows.length === 0 || !('qid' in rows[0])) continue
  collected.push(...rows)
}

/** All questions across all loaded exams. Single concat point. */
export const ALL_QUESTIONS: readonly Question[] = collected

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
