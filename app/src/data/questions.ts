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

/** Figure attached to a quant question.
 *
 *  Two kinds, distinguished by `kind` (defaults to 'svg' for backwards
 *  compatibility with the original parser output):
 *  - **svg**: vector diagram for XYZ/KVA/NOG. Inline-rendered so
 *    `stroke="currentColor"` cascades for dark-mode theming. Parser
 *    writes to `data/figures/{qid}.svg`.
 *  - **raster**: full-page JPEG render of a DTK figure page (diagrams,
 *    tables, maps that can't reasonably vectorize). Parser writes to
 *    `figures/dtk/{exam}-{pass}-p{NN}.jpg`. Lives behind a tap-to-zoom
 *    affordance because the source pages are dense.
 *
 *  `aspect_ratio` (width / height) lets us reserve layout space before
 *  the asset paints, preventing CLS during fetch.
 */
export type QuestionFigureMeta = {
  src: string
  aspect_ratio: number
  kind?: 'svg' | 'raster'
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
  /** Vector diagram (XYZ/KVA/NOG only); null for text-only questions
   *  and for everything in the verbal half. */
  figure?: QuestionFigureMeta | null
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
type DtkIndexEntry = { figure: string; width: number; height: number }
type DtkIndex = Record<string, DtkIndexEntry>

export function loadBank(): Promise<readonly Question[]> {
  if (cached) return cached
  cached = (async () => {
    const idx = (await fetch('/data/_index.json').then(handleJson)) as IndexFile
    const [examFiles, dtkIndex] = await Promise.all([
      Promise.all(idx.exams.map((e) => fetch(`/data/${e.exam_id}.json`).then(handleJson))),
      // DTK figures live in a separate index because they're rendered
      // by a different parser stage (parse_dtk_figures.py). Treat 404
      // as "no DTK figures available" rather than fatal — the verbal
      // half still works without it.
      fetch('/figures/dtk/_index.json')
        .then((r) => (r.ok ? (r.json() as Promise<DtkIndex>) : ({} as DtkIndex)))
        .catch(() => ({}) as DtkIndex),
    ])
    const out: Question[] = []
    for (const rows of examFiles) {
      if (!Array.isArray(rows) || rows.length === 0 || !('qid' in rows[0])) continue
      for (const q of rows as Question[]) {
        // Patch DTK questions with their figure-page metadata so the
        // rest of the pipeline (drill picker, QuestionFigure) treats
        // them like any other figure-bearing quant question.
        const dtk = dtkIndex[q.qid]
        if (dtk) {
          q.figure = {
            src: `figures/dtk/${dtk.figure}`,
            aspect_ratio: dtk.width / dtk.height,
            kind: 'raster',
          }
        }
        out.push(q)
      }
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

/** Non-throwing lookup — returns undefined when the qid is absent.
 *  Use this for plan/cursor resolution where the qid comes from
 *  persisted state (server session plan, deep-link, saved cursor) that
 *  can drift out of sync with the corpus (regen, seed/test rows like
 *  `q1`). A stale qid must degrade to a recoverable empty state, never
 *  throw into render. See resolvePlan in drill.tsx / repetition.tsx. */
export function findQuestionSafe(bank: readonly Question[], qid: string): Question | undefined {
  return bank.find((x) => x.qid === qid)
}
