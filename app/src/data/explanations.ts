// Layer 2 explanation bank — types + lazy loader.
//
// Mirrors the shape of questions.ts: explanations live as static JSON
// under `app/public/explanations/`, one file per exam, keyed by qid.
// `loadExplanation(qid)` is the SINGLE call site for fetching an
// explanation; the body of this function is the v1 → v2 migration
// seam (see docs/explanations.md "Migration seams"). When the
// multi-user beta lands, swap the `fetch('/explanations/...')` call
// for `fetch('/api/explanations/:qid', { headers: authHeader })`
// without touching any other file in the SPA.
//
// SOURCE: data/explanations/{exam_id}.json — generated offline by
// pipeline/explanations/generate.py and copied into public/ via
// app/scripts/sync-dataset.sh. The TS shape MUST stay in lock-step
// with the Python schema (pipeline/explanations/schema.py).
//
// Memoisation: per-exam Promise cache. The first lookup for any qid
// in `host-2025` triggers a single fetch of the whole exam file;
// every subsequent qid in the same exam reads the cached result.
// Same pattern as questions.ts but per-exam-grained instead of
// global, because explanations are fetched on-demand (one question
// at a time during drill) rather than bulk-loaded.

/** Per-distractor analysis. One entry per WRONG option (correct
 *  option is skipped — schema invariant enforced by the generator). */
export type DistractorExplanation = {
  letter: string
  why_tempting: string
  why_wrong: string
}

/** A single step in a multi-step solution walkthrough. Phase A.6 adds
 *  this structured representation to Layer 2 content; Phase A.5's
 *  PedagogyPanel renders these as numbered cards when present and
 *  falls back to prose-splitting `solution_path` when absent. */
export type ExplanationStep = {
  /** 1-indexed ordinal. The generator writes steps in order; the
   *  renderer relies on `n` for the display number rather than
   *  array index so we can support sparse / re-ordered arrays
   *  defensively. */
  n: number
  /** Optional micro-heading (e.g., "Sätt upp ekvationen"). Renderer
   *  shows it as an Eyebrow above the step body. */
  title?: string
  /** Step body. Math wrapped in U+E000 / U+E001 like solution_path;
   *  render via <MathText>. */
  text: string
  /** Phase A.6V — Progressive Reveal. 'essential' steps render in
   *  full by default; 'detail' steps render as collapsed-preview
   *  cards (title only) until the user taps to expand. Legacy
   *  explanations without this field default to 'essential' on the
   *  renderer side. */
  tier?: 'essential' | 'detail'
}

/** Generation metadata — surfaced to the SPA so a future QA UI can
 *  show which model wrote each explanation and when. Optional in the
 *  type because v1 generation may have written explanations without
 *  it, and the loader doesn't crash if the field is missing. */
export type ExplanationMeta = {
  model: string
  generated_at: number
}

export type Explanation = {
  /** 2-4 sentences. INSIGHT-FIRST: the first sentence states the
   *  single thing the student needed to know. Math wrapped in
   *  U+E000 / U+E001 markers — render via <MathText>.
   *  KEPT after Phase A.6 as a single-string fallback for callers
   *  that don't want to render step cards (e.g., the phone-mode
   *  ExplanationPanel collapsed view). When `steps[]` is present
   *  this should still be filled with a concise prose summary. */
  solution_path: string
  /** Phase A.6 — structured step-by-step walkthrough. Optional
   *  because (a) Phase A.5 ships before A.6 regen, so much of the
   *  corpus still has only `solution_path`; (b) some sections
   *  (ORD) collapse to a single step and may omit the array entirely.
   *  When present, the Study Desk pedagogy panel renders these as
   *  numbered cards; when absent, falls back to splitting
   *  `solution_path` heuristically. */
  steps?: ExplanationStep[]
  /** One per WRONG option; correct option is skipped. */
  distractors: DistractorExplanation[]
  /** One sentence naming the recurring pattern. */
  technique: string
  /** Optional structural trap distinct from `technique`. Null when
   *  there's no trap orthogonal to the technique itself. The UI hides
   *  the pitfall callout entirely when this is null. */
  pitfall: string | null
  /** Phase A.6 — Layer 1 framework id this question belongs to.
   *  When present, the pedagogy panel surfaces a chip linking to
   *  the framework lesson. Optional so pre-A.6 explanations don't
   *  break. */
  framework_id?: string
  /** Phase A.6V Path 3 — per-question named-strategy hint surfaced in
   *  the SPA's pre-grade right column. Authored offline against the
   *  Variant-C corpus so each question gets a tactic tailored to its
   *  specific shape. Optional: entries without this field fall back
   *  to the section-default hash-rotation catalog in
   *  components/pre-grade/pregrade-tactics.ts. */
  pregrade_tactic?: {
    handle: string
    move: string
  }
  /** Generation provenance; not always present on older entries. */
  _meta?: ExplanationMeta
}

// One JSON file per exam: `{ qid: Explanation }`. The loader caches a
// Promise<map> per exam so concurrent lookups for sibling questions
// share a single fetch.
const examCache = new Map<string, Promise<Record<string, Explanation>>>()

/** Extract the exam_id from a fully-qualified qid.
 *  `host-2025-kvant1-XYZ-002` → `host-2025`
 *  `host-ver1-2019-kvant2-NOG-024` → `host-ver1-2019`
 *  `var-2022-1-kvant1-XYZ-005` → `var-2022-1`
 *
 *  The exam_id is everything BEFORE the provpass (`kvant1`/`kvant2`/
 *  `verb1`/`verb2`). We look for the first occurrence of that token
 *  rather than splitting by hyphens because exam_ids themselves
 *  contain hyphens (`host-ver1-2019`, `var-2022-1`). */
const PROVPASS_TOKENS = ['verb1', 'verb2', 'kvant1', 'kvant2']

function extractExamId(qid: string): string | null {
  for (const token of PROVPASS_TOKENS) {
    const idx = qid.indexOf(`-${token}-`)
    if (idx !== -1) return qid.slice(0, idx)
  }
  return null
}

async function loadExamExplanations(examId: string): Promise<Record<string, Explanation>> {
  let entry = examCache.get(examId)
  if (entry) return entry
  entry = (async () => {
    const res = await fetch(`/explanations/${examId}.json`)
    if (!res.ok) {
      // Missing exam file is the common case for un-backfilled exams.
      // We return empty rather than throwing so the panel just doesn't
      // mount — the drill still works without explanations.
      if (res.status === 404) return {}
      throw new Error(`failed to load explanations for ${examId}: HTTP ${res.status}`)
    }
    return (await res.json()) as Record<string, Explanation>
  })()
  examCache.set(examId, entry)
  return entry
}

/**
 * Load the explanation for a single question.
 *
 * Returns null when no explanation exists yet for this qid (un-
 * backfilled question) — the caller should hide the explanation
 * panel rather than render an error. Throws only on transport
 * errors (network failure, 5xx) to surface real problems.
 *
 * **Migration seam**: this function body is the v1 → v2 transition
 * point. See docs/explanations.md "Migration seams". The function
 * signature and return type are stable across all phases.
 */
export async function loadExplanation(qid: string): Promise<Explanation | null> {
  const examId = extractExamId(qid)
  if (!examId) return null
  const map = await loadExamExplanations(examId)
  return map[qid] ?? null
}

/** Test-only: clear the per-exam cache. Used by Vitest specs that
 *  exercise the loader against a freshly-mocked fetch handler. */
export function __resetExplanationCache(): void {
  examCache.clear()
}
