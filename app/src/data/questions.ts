// Question bank — types + lazy loader.
//
// The dataset (27 exams, ~6 MB of JSON) used to be bundled into the
// main JS chunk via `import.meta.glob({ eager: true })`. That made the
// entry chunk huge, slowed Clerk bootstrap to the point of e2e flake
// on mid-tier hardware, and forced every page that imports a *type*
// from this file to drag the whole dataset along.
//
// Now we ship the JSON as static assets under `app/public/data/` and
// pull them at runtime. `loadBank()` is idempotent — the first call
// kicks off the parallel fetch + concat, every subsequent call shares
// the same Promise. `main.tsx` pre-warms it on app boot, so by the
// time the user clicks "Starta övning" the bank is already in memory.
//
// SOURCE: data/parsed/{exam_id}.json — copy via
// `app/scripts/sync-dataset.sh` after re-running the parser. The TS
// shape MUST stay in lock-step with the parser's emit; we cast at
// fetch time so the rest of the SPA gets real types instead of `any`.

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

// Manifest emitted by parser/build_all.py — { exams: [{ exam_id, ... }, ...] }.
type IndexEntry = { exam_id: string }
type IndexFile = { exams: IndexEntry[] }

let cached: Promise<readonly Question[]> | null = null

/**
 * Load every parsed exam in parallel from `/data/*.json` and concat the
 * questions into a single flat array. Memoised at module scope — the
 * second call returns the same Promise, so two screens kicking off the
 * load simultaneously share one network round-trip.
 *
 * Failures bubble up unwrapped: if `_index.json` 404s we want the screen
 * to know the dataset is broken, not silently render zero questions.
 */
export function loadBank(): Promise<readonly Question[]> {
  if (cached) return cached
  cached = (async () => {
    const idx = (await fetch('/data/_index.json').then(handleJson)) as IndexFile
    const examFiles = await Promise.all(
      idx.exams.map((e) => fetch(`/data/${e.exam_id}.json`).then(handleJson)),
    )
    const out: Question[] = []
    for (const rows of examFiles) {
      if (!Array.isArray(rows) || rows.length === 0 || !('qid' in rows[0])) continue
      out.push(...(rows as Question[]))
    }
    return out
  })()
  return cached
}

async function handleJson(r: Response): Promise<unknown> {
  if (!r.ok) throw new Error(`Dataset fetch failed: ${r.status} ${r.url}`)
  return r.json()
}

/** Reset the memoised bank. Test-only — production never calls this. */
export function __resetBankCache() {
  cached = null
}

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
