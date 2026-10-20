// Folio · Läsfråga and Facit — the drill as a book spread.
//
// Desktop: two facing pages and no app bar. Each page carries its own
// running head, as a book does: the verso's holds the exit, LÄS ·
// ÖVNINGSTEXT and Styckefokus; the recto's the position and the clock.
// The verso carries the passage with ¶ numbers on each first baseline in
// the margin; the recto carries the question, its options set as an
// indented list between hairlines (no boxes). After the answer the recto
// leads with the verdict and the one thing to learn — why the chosen option
// tempted, the pitfall, the technique — and only then the solution and its
// steps. The explanation's verbatim quotations are underlined in the
// passage itself, and a ¶ link marks the exact sentence it points at. The
// fold between the pages is a resizable separator (drag, or ←/→ when
// focused).
// Phone: the passage first, the whole question in a sheet that peeks,
// opens and goes full for the explanation; the head folds to a strip while
// reading, so the exit, the ¶ aid and a thin progress line stay in reach.
//
// Kit v2: the sitting is useDirectionData().data.drills.reading, its state
// is useDrillCore graded by actions.drill; round 1's switcher moves (a lock
// opens Facit, Nästa Läsfråga, Avsluta Idag) ride on DirectionProps.onScreen
// as before. This file also exports the drill's parts — verdict, options,
// facit, spread, passage, colophon, the dialog primitive and the modal slip
// on it — and the drill-view seam, which the quant and DTK drills
// (FolioQuant.tsx) and the running provpass (FolioProvpass.tsx) are built
// from.
//
// ELF (screen 14) is the same spread on data.drills.elf, with no switcher
// moves: only the English content — the passage, the prompt, the options
// and the facit's bodies — carries lang="en"; the chrome around it stays
// Swedish, also inside the English article. A gap text sets its gaps as
// ruled blanks that take the chosen word in pencil, then the right one.
//
// A reading drill answers only a complete question (answerable): its
// passage, its prompt, its options and every picture it carries — its own
// figure and each option's — loaded on the page, with the chosen option one
// of its own. Until then Svara is held, whether clicked, ↵ or space, and the
// page says plainly what is missing.
//
// Keys: only Folio's dialogs carry data-rd-keyscope. The spread's pages and
// the phone drill's scroll only scroll vertically, so the bake-off's
// switcher keeps its digits and ←/→ from anywhere in a drill.

import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleSlash,
  Clock,
  Info,
  Pilcrow,
  Undo2,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  createContext,
  Fragment,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefCallback,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type DrillCoreActions,
  type DrillCoreRefs,
  type DrillCoreView,
  type DrillStart,
  type QuoteMark,
  splitStepRefs,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import {
  type Destination,
  type DirectionProps,
  fmtClock,
  prefersReducedMotion,
  useHideOnScroll,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DrillOption,
  DrillQuestion,
  DrillSessionView,
} from '@/components/devbake/redesign/viewModel'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'
import type { AnswerLetter, Section } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { Dots } from './FolioHome'

/** A pace for the folded clock's line: about four minutes a question. */
const PACE_SECONDS = 15 * 60
/** Option counts in prose ("de fyra alternativen": neuter). */
const WORDS = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem']

// ── The drill-view seam ──────────────────────────────────────────────

/** Where the reader came from: Avsluta and the colophon go back there. */
export type Origin = {
  /** "Idag", "Öva" — the colophon's "Till …". */
  label: string
  /** The reader came from Idag, where round 1's switcher move (onScreen(1))
   *  also leads. */
  idag: boolean
  /** The page the label names, for a way back that goes exactly there. */
  to?: Destination | 'konto'
}

export const ORIGIN_IDAG: Origin = { label: 'Idag', idag: true, to: 'idag' }

export type DrillMode = 'drill' | 'repetition'

/**
 * The drill-view seam (spec, screen 6 "New"): what a drill layout changes
 * between a plain drill and a repetition round — the running head's label,
 * what a position is called, the next button's words, the verdict's second
 * line and the content's language. Every Folio drill layout takes it; batch
 * 2 adds the pass and review modes.
 */
export type DrillSeam = {
  mode: DrillMode
  /** The running head's label: "LÄS", "Kvant · NOG", "Repetition · KVA". */
  label: string
  /** What a position is called: "Fråga", or "Miss" in a repetition. */
  unit: 'Fråga' | 'Miss'
  /** The next button on a middle question, on the last, and the echo
   *  beside it on the last. */
  next: { more: string; last: string; lastNote: string }
  /** The verdict's second line, or null. */
  after: (correct: boolean) => string | null
  /** The content's language: 'en' marks ELF. */
  lang: 'sv' | 'en'
}

const KVANT = new Set(['XYZ', 'KVA', 'NOG', 'DTK'])

/** The seam for a question of a sitting: a repetition round when the
 *  sitting was started as one, a drill otherwise. `finish` names the last
 *  button of a drill ("Slutför texten"). */
export function drillSeam(
  session: Pick<DrillSessionView, 'request'>,
  question: DrillQuestion,
  finish: string,
): DrillSeam {
  const repetition = session.request.kind === 'repetition'
  const section = question.section
  return {
    mode: repetition ? 'repetition' : 'drill',
    label: repetition
      ? `Repetition · ${section}`
      : KVANT.has(section)
        ? `Kvant · ${section}`
        : section,
    unit: repetition ? 'Miss' : 'Fråga',
    next: repetition
      ? { more: 'Nästa miss', last: 'Slutför genomgången', lastNote: 'Sista missen i omgången' }
      : {
          more: 'Nästa fråga',
          last: finish,
          lastNote: question.passage ? 'Sista frågan i texten' : 'Sista frågan',
        },
    // A wrong answer comes back after the ten-minute relearning step; the
    // view model does not say where a right one goes on the ladder.
    after: (correct) => (repetition && !correct ? 'Frågan kommer tillbaka om tio minuter.' : null),
    lang: contentLang(question),
  }
}

/** The language a question's content is in: its passage's, else English
 *  for ELF. The chrome around it is always Swedish. */
export function contentLang(q: Pick<DrillQuestion, 'passage' | 'section'>): 'sv' | 'en' {
  return q.passage?.lang ?? (q.section === 'ELF' ? 'en' : 'sv')
}

/** "en" for an English question's content, else nothing: the root's sv
 *  holds. */
function langOf(q: Pick<DrillQuestion, 'passage' | 'section'>): 'en' | undefined {
  return contentLang(q) === 'en' ? 'en' : undefined
}

/** Content in another language than its container (`lang`), or as it is. */
function InLang({ lang, children }: { lang: 'en' | undefined; children: ReactNode }) {
  return lang ? <span lang={lang}>{children}</span> : children
}

/** The core's actions as the drill's parts use them: lock, next and exit
 *  wrapped by the screen (switcher moves, focus, motion). */
export type DrillAct = Pick<
  DrillCoreActions,
  | 'select'
  | 'toggleEliminate'
  | 'setFocusPara'
  | 'moveFocusPara'
  | 'cite'
  | 'toggleStep'
  | 'goToStep'
> & {
  lock: () => void
  next: () => void
  exit: () => void
}

type Shared = {
  view: DrillCoreView
  act: DrillAct
  refs: DrillCoreRefs
}

/** Which explanation part the reader is pointing at (hover or focus): its
 *  quotations are tinted in the passage. */
type Pointing = { active: string | null; point: (source: string | null) => void }

/** A clock is shown when the sitting knows its time, or starts fresh (then
 *  the time since it opened is the sitting's). A resumed sitting without
 *  its time shows none: the drill clock has no real source yet. */
export function showsClock(session: Pick<DrillSessionView, 'elapsedSeconds' | 'start'>): boolean {
  return session.elapsedSeconds != null || !session.start.results?.length
}

const FAMILY_WORD: Record<string, string> = {
  TRAP: 'fälla',
  TACTIC: 'taktik',
  TYPE: 'frågetyp',
  ROOT: 'ordrot',
  RULE: 'regel',
}

/** A framework's readable name: its headword, else its id said in words
 *  ("XYZ · fälla 17"), never the raw id. */
export function entryName(
  id: string | undefined,
  names: Readonly<Record<string, string>>,
): string | null {
  if (!id) return null
  if (names[id]) return names[id]
  const m = /^([A-Z]+)-([A-Z]+)-0*(\d+)$/.exec(id)
  const word = m ? FAMILY_WORD[m[2]] : undefined
  if (!m || !word) return null
  return `${m[1] === 'LAS' ? 'LÄS' : m[1]} · ${word} ${m[3]}`
}

// ── Question text in lists and gaps ──────────────────────────────────

/** The bank's math markers, U+E000 and U+E001 (built from their codes so
 *  no editor can strip a private-use character from this file). */
const MATH_OPEN = String.fromCharCode(0xe000)
const MATH_CLOSE = String.fromCharCode(0xe001)
const GAP_RE = /_{3,}/g

/** Whether `at` falls inside a math run of `text`. */
function inMath(text: string, at: number): boolean {
  const before = text.slice(0, at)
  return before.split(MATH_OPEN).length > before.split(MATH_CLOSE).length
}

/**
 * A question's stem on one line, for lists (Repetera, a round's list):
 * NOG's question without its statements, KVA's condition and quantities,
 * any other prompt's first sentence when it runs on. Cut at a sentence's
 * end, never mid-word and never with an ellipsis; math stays marked.
 */
export function questionStem(q: { prompt: string | null; section: Section }): string | null {
  const prompt = q.prompt?.trim()
  if (!prompt) return null
  if (q.section === 'NOG') return parseNogPrompt(prompt)?.question ?? prompt
  if (q.section === 'KVA') {
    const kva = splitKvaPrompt(prompt)
    if (!kva) return prompt
    const pair = `I: ${kva.kvI} · II: ${kva.kvII}`
    return kva.condition ? `${kva.condition} · ${pair}` : pair
  }
  for (const m of prompt.matchAll(/[.?!](?=\s)/g)) {
    const at = m.index ?? 0
    if (at >= 24 && at < prompt.length - 24 && !inMath(prompt, at)) return prompt.slice(0, at + 1)
  }
  return prompt
}

/** Text with MEK's blanks (_____) set as ruled gaps in the line, each named
 *  "lucka N" for screen readers. An ELF gap text sets its blanks as
 *  GapMarks instead (below). */
export function GapText({ text }: { text: string }) {
  const parts = text.split(GAP_RE)
  if (parts.length === 1) return <MathText>{text}</MathText>
  return (
    <>
      {parts.map((part, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the gaps keep their order
        <Fragment key={i}>
          <MathText>{part}</MathText>
          {i < parts.length - 1 ? (
            <span className="fp-gap">
              <span className="fp-sr">lucka {i + 1}</span>
            </span>
          ) : null}
        </Fragment>
      ))}
    </>
  )
}

// ── ELF gap texts ────────────────────────────────────────────────────

/** A gap in a P5 gap text, "___(1)___"; a bare "___" counts in order. */
const GAP_MARK_RE = /_{3,}(?:\((\d+)\)_{3,})?/g
/** Where a long gap sentence may be cut: a comma, semicolon, colon or a
 *  spaced dash. */
const CLAUSE_RE = /[,;:]\s+|\s[–—]\s/g

/** What a gap text's blanks show (spec screen 14, "GapMark"). */
export type GapModel = {
  /** The open question's gap. */
  current: number | null
  /** The word pencilled into it: the chosen option, before Svara. */
  chosen: string | null
  /** Answered gaps: the right word, and the reader's when it was wrong. */
  graded: Record<number, { right: string; wrong: string | null }>
}

const NO_GAPS: GapModel = { current: null, chosen: null, graded: {} }

function countGaps(text: string): number {
  return [...text.matchAll(GAP_MARK_RE)].length
}

function hasGaps(paragraphs: readonly string[]): boolean {
  return paragraphs.some((p) => countGaps(p) > 0)
}

/** Each gap question's gap, by qid. "Gap (2)" names it; a gap text's
 *  question without a prompt takes the next one in order. */
export function gapNumbers(questions: readonly DrillQuestion[]): Record<string, number> {
  const out: Record<string, number> = {}
  let order = 0
  for (const q of questions) {
    if (q.section !== 'ELF' || !q.passage || !hasGaps(q.passage.paragraphs)) continue
    order += 1
    const named = /^\s*gap\s*\((\d+)\)\s*$/i.exec(q.prompt ?? '')
    if (named) out[q.qid] = Number(named[1])
    else if (!q.prompt?.trim()) out[q.qid] = order
  }
  return out
}

function samePassage(a: DrillQuestion['passage'], b: DrillQuestion['passage']): boolean {
  if (!a || !b) return false
  if (a.unitId && b.unitId) return a.unitId === b.unitId
  return a.paragraphs[0] === b.paragraphs[0]
}

function optionText(q: DrillQuestion, letter: AnswerLetter | null): string | null {
  return q.options?.find((o) => o.letter === letter)?.text ?? null
}

/** The open question's gap text as its blanks should show it: the open
 *  gap with the chosen word, and every gap of the text answered so far. */
function gapModel(
  view: DrillCoreView,
  questions: readonly DrillQuestion[],
  of: Record<string, number>,
): GapModel | null {
  const passage = view.question.passage
  if (!passage || !hasGaps(passage.paragraphs)) return null
  const graded: GapModel['graded'] = {}
  for (const r of view.results) {
    const q = questions.find((x) => x.qid === r.qid)
    const n = of[r.qid]
    const right = q ? optionText(q, q.answer) : null
    if (!q || n == null || !right || !samePassage(q.passage, passage)) continue
    graded[n] = { right, wrong: r.correct ? null : optionText(q, r.pick) }
  }
  return {
    current: of[view.question.qid] ?? null,
    chosen: view.phase === 'question' ? optionText(view.question, view.selected) : null,
    graded,
  }
}

/**
 * One blank of a gap text (spec screen 14, "GapMark"): a ruled blank with
 * its number; the open one in the accent; the chosen word pencilled in
 * (italic accent ink, the number lifted); once answered, the right word in
 * ink — after a wrong pick struck through, then the right one. Its name is
 * Swedish chrome inside the English text.
 */
function GapMark({ n, model }: { n: number; model: GapModel }) {
  const graded = model.graded[n]
  const current = !graded && model.current === n
  const chosen = current ? model.chosen : null
  const word = graded?.right ?? chosen
  const label = graded
    ? graded.wrong
      ? `lucka ${n}: ditt ord ${graded.wrong}, rätt ord ${graded.right}`
      : `lucka ${n}: ${graded.right}`
    : chosen
      ? `lucka ${n}: ${chosen}`
      : `lucka ${n}, tom`
  return (
    <span
      className="fp-gapmark"
      data-gap={n}
      data-state={graded ? (graded.wrong ? 'wrong' : 'right') : current ? 'current' : 'blank'}
      data-filled={word ? 'true' : undefined}
    >
      <span className="fp-sr" lang="sv">
        {label}
      </span>
      <span className="fp-gapmark-text" aria-hidden>
        {graded?.wrong ? <s className="fp-gapmark-wrong">{graded.wrong}</s> : null}
        {word ? <span className="fp-gapmark-word">{word}</span> : null}
        <span className="fp-gapmark-n">{n}</span>
      </span>
    </span>
  )
}

/** A run of a gap text with its blanks set as GapMarks. `first` counts the
 *  bare blanks before it in the passage (they are numbered in order). */
function GapRun({ text, model, first = 0 }: { text: string; model: GapModel; first?: number }) {
  const out: ReactNode[] = []
  let at = 0
  let bare = first
  for (const m of text.matchAll(GAP_MARK_RE)) {
    const i = m.index ?? 0
    if (i > at) out.push(text.slice(at, i))
    bare += 1
    out.push(<GapMark key={i} n={m[1] ? Number(m[1]) : bare} model={model} />)
    at = i + m[0].length
  }
  if (at < text.length) out.push(text.slice(at))
  return <>{out}</>
}

/** Where gap `n`'s sentence stands in the passage: its paragraph and range,
 *  cut to the gap's clause when it runs long (`lead`/`tail` say where), and
 *  the bare blanks before it. */
function gapSentence(paragraphs: readonly string[], n: number) {
  let bare = 0
  for (const [para, text] of paragraphs.entries()) {
    const before = bare
    for (const m of text.matchAll(GAP_MARK_RE)) {
      bare += 1
      if ((m[1] ? Number(m[1]) : bare) !== n) continue
      const at = m.index ?? 0
      const after = at + m[0].length
      const stops = [...text.slice(0, at).matchAll(/[.!?][”’"')]*\s+/g)]
      const last = stops[stops.length - 1]
      let start = last ? (last.index ?? 0) + last[0].length : 0
      const stop = /[.!?][”’"')]*/.exec(text.slice(after))
      let end = stop ? after + (stop.index ?? 0) + stop[0].length : text.length
      let lead = false
      let tail = false
      if (at - start > 100) {
        const cuts = [...text.slice(start, at).matchAll(CLAUSE_RE)]
        const cut = cuts[cuts.length - 1]
        if (cut) {
          start += (cut.index ?? 0) + cut[0].length
          lead = true
        }
      }
      if (end - after > 80) {
        const cut = [...text.slice(after, end).matchAll(CLAUSE_RE)][0]
        if (cut) {
          end = after + (cut.index ?? 0)
          tail = true
        }
      }
      return { para, start, end, lead, tail, first: before + countGaps(text.slice(0, start)) }
    }
  }
  return null
}

/** The open gap's sentence quoted beside the options (spec screen 14,
 *  "GapContext"), with the chosen word pencilled in, so a word can be tried
 *  in its sentence without looking away. */
function GapQuote({
  paragraphs,
  n,
  model,
}: {
  paragraphs: readonly string[]
  n: number
  model: GapModel
}) {
  const s = gapSentence(paragraphs, n)
  if (!s) return null
  const text = paragraphs[s.para].slice(s.start, s.end)
  return (
    <blockquote className="fp-gapquote" lang="en">
      <p>
        “{s.lead ? '… ' : ''}
        <GapRun text={text} model={model} first={s.first} />
        {s.tail ? ' …' : ''}”
      </p>
    </blockquote>
  )
}

/** The prompt slot: the question (in English for ELF), or for a gap
 *  "Lucka 2" — Swedish chrome, since the head already says which question —
 *  over the gap's sentence quoted from the text. */
function PromptBlock({
  view,
  gap,
  gaps,
  after = false,
  promptRef,
}: {
  view: Pick<DrillCoreView, 'question'>
  gap: number | null
  gaps: GapModel | null
  /** Under the verdict: the quieter restatement. */
  after?: boolean
  promptRef?: RefCallback<HTMLElement>
}) {
  const q = view.question
  const Tag = after ? 'p' : 'h2'
  const focus = after ? {} : { ref: promptRef, tabIndex: promptRef ? -1 : undefined }
  if (gap != null && gaps && q.passage) {
    return (
      <>
        <Tag className="fp-prompt" data-after={after ? 'true' : undefined} {...focus}>
          Lucka {gap}
        </Tag>
        <GapQuote paragraphs={q.passage.paragraphs} n={gap} model={gaps} />
      </>
    )
  }
  if (!q.prompt) return null
  return (
    <Tag className="fp-prompt" data-after={after ? 'true' : undefined} lang={langOf(q)} {...focus}>
      <MathText>{q.prompt}</MathText>
    </Tag>
  )
}

// ── A complete question ──────────────────────────────────────────────

/** Whose picture it is: the question's own figure, or an option's. */
type Part = AnswerLetter | 'figure'

/** One picture on the page: one mounted image, by itself (never "this
 *  source has loaded once, somewhere"). */
type Picture = { part: Part; src: string; state: 'loading' | 'loaded' | 'failed' }
type Pictures = ReadonlyMap<object, Picture>

/** Where a reading drill hears its pictures, and the try they are on (its
 *  "Försök igen" tries every one afresh). Outside a reading drill nobody
 *  listens, and an option's picture is as it always was. */
const PictureGate = createContext<{
  report: (token: object, picture: Picture | null) => void
  attempt: number
} | null>(null)

/** What keeps the open question from being answered. */
type Lack =
  | { kind: 'passage' | 'prompt' | 'options' }
  | { kind: 'wordless'; letter: AnswerLetter }
  | { kind: 'picture'; part: Part; failed: boolean }

/**
 * What the open reading question lacks, or null when it is complete: its
 * passage (a paragraph with words); its prompt, where a gap text's
 * explicitly empty stem counts (the gap is its question; null is no
 * prompt); its options, each with its words (an image option's label);
 * and every picture it carries — its own figure, then each option's —
 * loaded on each of its instances on the page. A picture that is not on
 * the page (a phone slip at its peek) has not loaded.
 */
function lackOf(q: DrillQuestion, pictures: Pictures): Lack | null {
  const passage = q.passage
  if (!passage?.paragraphs.some((p) => p.trim())) return { kind: 'passage' }
  if (q.prompt == null || (!q.prompt.trim() && !hasGaps(passage.paragraphs))) {
    return { kind: 'prompt' }
  }
  const options = q.options ?? []
  if (options.length === 0) return { kind: 'options' }
  const wordless = options.find((o) => !o.text.trim())
  if (wordless) return { kind: 'wordless', letter: wordless.letter }
  const carried: { part: Part; src: string | undefined }[] = [
    { part: 'figure', src: q.figure?.src },
    ...options.map((o) => ({ part: o.letter, src: o.figure?.src })),
  ]
  const drawn = carried.flatMap(({ part, src }) => {
    if (!src) return []
    const shown = [...pictures.values()].filter((p) => p.part === part && p.src === src)
    return [{ part, shown }]
  })
  const failed = drawn.find((d) => d.shown.some((p) => p.state === 'failed'))
  if (failed) return { kind: 'picture', part: failed.part, failed: true }
  const waiting = drawn.find(
    (d) => d.shown.length === 0 || d.shown.some((p) => p.state !== 'loaded'),
  )
  if (waiting) return { kind: 'picture', part: waiting.part, failed: false }
  return null
}

/** Svara's one gate, read by the button and by the lock alike (a click, ↵
 *  or the button's own space): the open question complete, and the chosen
 *  option one of its own. */
function answerable(q: DrillQuestion, chosen: AnswerLetter | null, pictures: Pictures): boolean {
  return (
    chosen != null && (q.options ?? []).some((o) => o.letter === chosen) && !lackOf(q, pictures)
  )
}

/** Svara's echo while it is held: the figure or the pictures still
 *  loading, or a question that cannot be answered yet (the note above says
 *  what is missing). */
function holdOf(lack: Lack | null): string | null {
  if (!lack) return null
  if (lack.kind !== 'picture' || lack.failed) return 'Frågan går inte att besvara än.'
  return lack.part === 'figure' ? 'Figuren laddas …' : 'Bilderna laddas …'
}

/** The plain words for what is missing; a picture still loading has none
 *  (Svara's echo says it). */
function lackText(lack: Lack): string | null {
  switch (lack.kind) {
    case 'passage':
      return 'Texten till frågan saknas.'
    case 'prompt':
      return 'Frågetexten saknas.'
    case 'options':
      return 'Svarsalternativen saknas.'
    case 'wordless':
      return `Alternativ ${lack.letter} saknar sin text.`
    case 'picture':
      if (!lack.failed) return null
      return lack.part === 'figure'
        ? 'Figuren till frågan gick inte att visa.'
        : `Bilden till alternativ ${lack.part} gick inte att visa.`
  }
}

/** A question that cannot be answered says so (spec §1.7 "erratum"):
 *  plain words behind a 1 px rule, announced as a status; a picture that
 *  failed has one way to try again. */
function LackNote({ lack, onRetry }: { lack: Lack | null; onRetry: () => void }) {
  const text = lack ? lackText(lack) : null
  if (!lack || !text) return null
  return (
    <div className="fp-erratum fp-lack" role="status" data-testid="rd-incomplete">
      <p>{text}</p>
      {lack.kind === 'picture' ? (
        <button type="button" className="fp-link" onClick={onRetry}>
          Försök igen
        </button>
      ) : null}
    </div>
  )
}

/**
 * One picture as one mounted image, with a receipt of its own: loading
 * until this very image has loaded or failed. Its parent keys it by source
 * and try, so a new source, a picture that comes back or "Försök igen"
 * mounts a fresh one, and no image inherits another's "loaded". Inside a
 * reading drill it tells the drill how it stands (PictureGate); once it
 * has failed, `fallback` stands in.
 */
function PictureMount({
  part,
  src,
  alt,
  width,
  height,
  className,
  fallback,
}: {
  part: Part
  src: string
  alt: string
  width: number
  height: number
  className: string
  fallback: ReactNode
}) {
  const report = useContext(PictureGate)?.report
  const [state, setState] = useState<Picture['state']>('loading')
  useLayoutEffect(() => {
    if (!report) return
    const token = {}
    report(token, { part, src, state })
    return () => report(token, null)
  }, [report, part, src, state])
  if (state === 'failed') return fallback
  return (
    <img
      className={className}
      src={`/${src}`}
      alt={alt}
      width={width}
      height={height}
      onLoad={() => setState('loaded')}
      onError={() => setState('failed')}
    />
  )
}

/** The question's own figure, set like a book figure above its prompt. A
 *  reading question seldom has one; when it does, the figure is part of
 *  the question, and the drill waits for it as for an option's picture.
 *  It is an image either way, so its load can be watched (a drawn figure
 *  shows as drawn, not in the ink's colour); if it fails, its name stands
 *  in and the note above the prompt says so. */
function QuestionFigure({ q }: { q: Pick<DrillQuestion, 'figure'> }) {
  const attempt = useContext(PictureGate)?.attempt ?? 0
  const figure = q.figure
  if (!figure?.src) return null
  return (
    <figure className="fp-figure" data-testid="rd-qfigure">
      <PictureMount
        key={`${figure.src}#${attempt}`}
        part="figure"
        src={figure.src}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        className="fp-figure-raster"
        fallback={<figcaption className="fp-plate-caption">{figure.alt}</figcaption>}
      />
    </figure>
  )
}

// ── The reading drills (screens 2, 3 and 14) ─────────────────────────

/** A key that changes when a list shrinks: a sitting whose questions the
 *  host cuts down opens again at its start, never past its end. */
function useShrinkKey(length: number): number {
  const seen = useRef(length)
  const epoch = useRef(0)
  if (length < seen.current) epoch.current += 1
  seen.current = length
  return epoch.current
}

export function FolioDrill(props: DirectionProps & { origin: Origin }) {
  const { data } = useDirectionData()
  const elf = props.screen === 14
  const session = elf ? data.drills.elf : data.drills.reading
  const shrunk = useShrinkKey(session.questions.length)
  // The core needs a question to stand on; an empty sitting is a page.
  if (session.questions.length === 0) {
    return <EmptyDrill label={elf ? 'ELF' : 'LÄS'} width={props.width} />
  }
  // One core per sitting: a sitting the host replaces (or cuts short) opens
  // at its own start; an update of the same sitting keeps the reader's
  // place.
  return (
    <ReadingDrill
      key={`${elf ? 'elf' : 'las'}:${session.id}:${shrunk}`}
      {...props}
      session={session}
      switcher={!elf}
    />
  )
}

type FocusAfter = 'verdict' | 'prompt' | 'done'

function ReadingDrill({
  screen,
  width,
  live,
  onScreen,
  origin,
  session,
  switcher,
}: DirectionProps & {
  origin: Origin
  session: DrillSessionView
  /** Round 1's Läsfråga and Facit (2 and 3): the switcher follows the
   *  drill. ELF (14) asks only through actions. */
  switcher: boolean
}) {
  const { data, actions } = useDirectionData()
  // Screen 3 opens the sitting's question already graded with the bake-off's
  // wrong pick (a display state: the controller is not called).
  const [start] = useState<DrillStart>(() => {
    const qid = session.questions[session.start.index ?? 0]?.qid
    return {
      ...session.start,
      graded: switcher && screen === 3 && qid ? session.wrongPick?.[qid] : undefined,
    }
  })
  const core = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  const { gradeAs, reopen, reset, lock: coreLock, next: coreNext, exit: coreExit } = core.act
  const { refs } = core
  const phase = core.view.phase

  // The pictures on the page (the question's figure and the options'),
  // each mounted image by itself, and the try they are on.
  const [pictures, setPictures] = useState<Pictures>(() => new Map())
  const [attempt, setAttempt] = useState(0)
  const report = useCallback((token: object, picture: Picture | null) => {
    setPictures((all) => {
      const next = new Map(all)
      if (picture) next.set(token, picture)
      else next.delete(token)
      return next
    })
  }, [])
  const pictureGate = useMemo(() => ({ report, attempt }), [report, attempt])
  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  // Svara's one gate: the button and the lock read the same answer.
  const ready = answerable(core.view.question, core.view.selected, pictures)
  const readyRef = useRef(ready)
  readyRef.current = ready

  // Keep in step with the switcher: a click on "Facit" while a question is
  // open grades it with the fixture's wrong pick; "Läsfråga" while graded
  // reopens the same question, and after the last one starts over.
  // biome-ignore lint/correctness/useExhaustiveDependencies: follows the switcher's screen only
  useLayoutEffect(() => {
    if (!switcher) return
    if (screen === 3 && phase === 'question') gradeAs((q) => session.wrongPick?.[q.qid])
    else if (screen === 2 && phase === 'feedback') reopen()
    else if (screen === 2 && phase === 'done') reset()
  }, [screen])

  // Focus follows the reader's own moves only (never a mount or a switcher
  // jump): to the verdict on Svara, to the next question's prompt on
  // Nästa, to the colophon at the end.
  const focusAfter = useRef<FocusAfter | null>(null)
  const targets = useRef<Partial<Record<FocusAfter, HTMLElement | null>>>({})
  const verdictRef = useCallback((el: HTMLElement | null) => {
    targets.current.verdict = el
  }, [])
  const promptRef = useCallback((el: HTMLElement | null) => {
    targets.current.prompt = el
  }, [])
  const doneRef = useCallback((el: HTMLElement | null) => {
    targets.current.done = el
  }, [])
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the phase or question changes
  useLayoutEffect(() => {
    const to = focusAfter.current
    focusAfter.current = null
    if (live && to) targets.current[to]?.focus({ preventScroll: true })
  }, [phase, core.view.index])

  const lock = useCallback(() => {
    if (!readyRef.current || !coreLock()) return
    focusAfter.current = 'verdict'
    if (switcher) onScreen(3)
  }, [coreLock, onScreen, switcher])
  const next = useCallback(() => {
    const moved = coreNext()
    if (moved) focusAfter.current = moved === 'next' ? 'prompt' : 'done'
    if (moved === 'next' && switcher) onScreen(2)
  }, [coreNext, onScreen, switcher])
  // Avsluta: back where the reader came from. Round 1's move to Idag
  // stays when that is where they came from; the controller hears it.
  const exit = useCallback(() => {
    if (switcher && origin.idag) onScreen(1)
    coreExit()
  }, [switcher, origin.idag, onScreen, coreExit])

  // A chosen option the host has taken away is no choice: none shows as
  // chosen, and Svara waits for a new one.
  const selected = core.view.selected
  const chosen = selected != null && core.view.letters.includes(selected) ? selected : null
  const current = chosen === selected ? core.view : { ...core.view, selected: chosen }
  // English content: the kit finds ¶ citations and quotations by Swedish
  // rules only, so the ELF facit shows none rather than wrong ones (spec
  // screen 14).
  const english = contentLang(current.question) === 'en'
  const view: DrillCoreView = english
    ? { ...current, stepCites: {}, distractorCites: {}, cited: [], marks: [] }
    : current
  const lack = view.phase === 'question' ? lackOf(view.question, pictures) : null
  const gapOf = gapNumbers(session.questions)
  const gaps = gapModel(view, session.questions, gapOf)
  const act: DrillAct = {
    select: core.act.select,
    toggleEliminate: core.act.toggleEliminate,
    setFocusPara: core.act.setFocusPara,
    moveFocusPara: core.act.moveFocusPara,
    cite: core.act.cite,
    toggleStep: core.act.toggleStep,
    goToStep: core.act.goToStep,
    lock,
    next,
    exit,
  }

  const seam = drillSeam(session, view.question, 'Slutför texten')
  const [note, setNote] = useState(false)
  const focusOn = view.focusPara != null
  const toggleFocus = () => act.setFocusPara(focusOn ? null : 1)
  // The day goes on: the plan's next part is the colophon's one action.
  const nextItem = data.home.plan.items.find((i) => !i.completed)
  const onNext = nextItem ? () => actions.openPlanItem(nextItem.id) : undefined

  const keys: Record<string, () => void> = {
    Enter: () => {
      if (view.phase === 'question') act.lock()
      else if (view.phase === 'feedback') act.next()
      else onNext?.()
    },
    // Space moves on from the facit; it never answers.
    ' ': () => {
      if (view.phase === 'feedback') act.next()
    },
    j: () => act.moveFocusPara(1),
    k: () => act.moveFocusPara(-1),
    f: toggleFocus,
    Escape: () => act.setFocusPara(null),
  }
  for (const o of view.question.options ?? []) {
    const l = o.letter.toLowerCase()
    keys[l] = () => act.select(o.letter)
    keys[`Shift+${l}`] = () => act.toggleEliminate(o.letter)
  }
  useKeyMap(keys, live)

  const chrome: DrillChrome = {
    view,
    act,
    refs,
    seam,
    note,
    setNote,
    focusOn,
    toggleFocus,
    clocked: showsClock(session),
    origin,
    onNext,
    nextLabel: nextItem ? `Nästa: ${nextItem.title} · ${nextItem.minutes} min` : null,
    dateLabel: data.home.today.dateLabel,
    badge: data.copy.ovningstextBadge,
    noteText: data.copy.ovningstextNote,
    gap: gapOf[view.question.qid] ?? null,
    gaps,
    verdictRef,
    promptRef,
    doneRef,
    lack,
    gate: { ready, hold: holdOf(lack) },
    onRetry: retry,
  }
  return (
    <PictureGate.Provider value={pictureGate}>
      {width === 'phone' ? <PhoneDrill {...chrome} /> : <DeskDrill {...chrome} />}
    </PictureGate.Provider>
  )
}

/** Svara's gate as the action bar shows it: open or held, and why. */
type Gate = { ready: boolean; hold: string | null }

type DrillChrome = Shared & {
  seam: DrillSeam
  note: boolean
  setNote: (open: boolean) => void
  focusOn: boolean
  toggleFocus: () => void
  /** The clock is shown (showsClock). */
  clocked: boolean
  origin: Origin
  /** The end of the unit's way on: the plan's next part. */
  onNext?: () => void
  nextLabel: string | null
  dateLabel: string
  badge: string
  noteText: string
  /** The open question's gap in a gap text, and the text's blanks. */
  gap: number | null
  gaps: GapModel | null
  /** Where focus lands after the reader's own moves. */
  verdictRef: RefCallback<HTMLElement>
  promptRef: RefCallback<HTMLElement>
  doneRef: RefCallback<HTMLElement>
  /** What keeps the open question from being answered, or null. */
  lack: Lack | null
  gate: Gate
  /** Tries the pictures afresh. */
  onRetry: () => void
}

/** Scrolls `el` into view inside its own scroll box (`box`), clear of the
 *  sticky head, instantly under reduced motion. */
function scrollInto(box: HTMLElement | null, el: Element | null | undefined, offset: number): void {
  if (!box || !el || typeof box.scrollTo !== 'function') return
  const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
  box.scrollTo({
    top: Math.max(0, top - offset),
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}

/** "Magasinet i Hökaryd: en handbok …" → the title and its subtitle. */
function passageTitle(view: Pick<DrillCoreView, 'question'>): [string, string | undefined] {
  const [title, ...rest] = (view.question.passage?.title ?? '').split(': ')
  return [title, rest.length ? rest.join(': ') : undefined]
}

// ── Desktop ──────────────────────────────────────────────────────────

function DeskDrill(chrome: DrillChrome) {
  const { view, act, refs, seam, note, setNote, focusOn, toggleFocus, clocked } = chrome
  const [clockShown, setClockShown] = useState(true)
  const [active, point] = useState<string | null>(null)
  const rectoRef = useRef<HTMLElement>(null)
  const versoRef = useRef<HTMLElement>(null)
  const firstTurn = useRef(true)
  const synthetic = view.question.passage?.synthetic ?? false

  // A new question or a fresh verdict starts at the top of the recto; a
  // verdict also turns the verso to the evidence its steps cite (instantly
  // the first time, so a deep link lands there). In a gap text a new
  // question turns the verso to its gap.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on question/phase change only
  useEffect(() => {
    rectoRef.current?.scrollTo?.({ top: 0 })
    const verso = versoRef.current
    if (view.phase === 'question' && chrome.gap != null) {
      scrollInto(verso, verso?.querySelector(`[data-gap="${chrome.gap}"]`), RUNHEAD + 120)
      firstTurn.current = false
      return
    }
    const n = view.phase === 'feedback' ? evidencePara(view) : undefined
    const el = n ? verso?.querySelector<HTMLElement>(`[data-n="${n}"]`) : null
    if (verso && el) {
      const smooth = !firstTurn.current && !prefersReducedMotion()
      // Clear of the sticky running head, with a line of air above.
      verso.scrollTo?.({
        top: Math.max(0, el.offsetTop - RUNHEAD - 28),
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
    firstTurn.current = false
  }, [view.index, view.phase])

  const exit = <ExitButton onExit={act.exit} />
  const badge = (
    <span className="fp-label fp-runhead-title">
      {seam.label}
      {synthetic ? (
        <>
          {' · '}
          <span data-testid="rd-badge">{chrome.badge}</span>
        </>
      ) : null}
    </span>
  )

  if (view.phase === 'done') {
    return (
      <div className="fp-drill">
        <header className="fp-runhead fp-runhead--solo">
          {exit}
          {badge}
          <span />
        </header>
        <div className="fp-main fp-done">
          <ReadingColophon {...chrome} />
        </div>
      </div>
    )
  }

  const versoHead = (
    <header className="fp-runhead">
      {exit}
      {badge}
      <button
        type="button"
        className="fp-ghost"
        aria-pressed={focusOn}
        onClick={toggleFocus}
        title="Styckefokus: F slår på, J och K byter stycke"
      >
        <Pilcrow size={16} strokeWidth={1.5} aria-hidden />
        Styckefokus
      </button>
    </header>
  )
  const rectoHead = (
    <header className="fp-runhead fp-runhead--recto">
      <span className="fp-runhead-pos">
        <Dots total={view.total} done={view.index} />
        <span>
          {seam.unit} {view.index + 1} av {view.total}
        </span>
      </span>
      {clocked ? (
        <ClockButton
          seconds={view.elapsed}
          shown={clockShown}
          toggle={() => setClockShown((s) => !s)}
        />
      ) : (
        <span />
      )}
      {clocked && !clockShown ? <TimeLine seconds={view.elapsed} pace={PACE_SECONDS} /> : null}
    </header>
  )
  return (
    <div className="fp-drill">
      <Spread
        versoRef={versoRef}
        rectoRef={rectoRef}
        rectoLabel={`${seam.unit} ${view.index + 1}`}
        verso={
          <>
            {versoHead}
            <PassageView
              view={view}
              act={act}
              refs={refs}
              note={note}
              setNote={setNote}
              active={active}
              badgeText={chrome.badge}
              noteText={chrome.noteText}
              gaps={chrome.gaps}
            />
          </>
        }
        recto={
          <>
            {rectoHead}
            {/* The action follows the options in the flow; it sticks to the
             *  page foot only once the facit runs longer than the page. */}
            <div className="fp-recto-body">
              <QuestionColumn
                view={view}
                act={act}
                refs={refs}
                seam={seam}
                active={active}
                point={point}
                gap={chrome.gap}
                gaps={chrome.gaps}
                verdictRef={chrome.verdictRef}
                promptRef={chrome.promptRef}
                note={<LackNote lack={chrome.lack} onRetry={chrome.onRetry} />}
              />
              <ActionBar view={view} act={act} seam={seam} gate={chrome.gate} />
            </div>
          </>
        }
      />
    </div>
  )
}

/** Avsluta: always visible, the far left of the first running head. */
export function ExitButton({ onExit, compact = false }: { onExit: () => void; compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        className="fp-ghost"
        onClick={onExit}
        aria-label="Avsluta"
        title="Dina svar är sparade"
        data-testid="rd-exit"
      >
        <X size={18} strokeWidth={1.5} aria-hidden />
        <span className="fp-exit-label" aria-hidden>
          Avsluta
        </span>
      </button>
    )
  }
  return (
    <button
      type="button"
      className="fp-ghost"
      onClick={onExit}
      title="Dina svar är sparade"
      data-testid="rd-exit"
    >
      <X size={18} strokeWidth={1.5} aria-hidden />
      Avsluta
    </button>
  )
}

export function ClockButton({
  seconds,
  shown,
  toggle,
}: {
  seconds: number
  shown: boolean
  toggle: () => void
}) {
  return (
    <button
      type="button"
      className="fp-clock"
      onClick={toggle}
      aria-pressed={!shown}
      aria-label={shown ? `Tid ${fmtClock(seconds)}. Dölj klockan` : 'Visa klockan'}
      title={shown ? 'Dölj klockan – en tunn linje visar tiden' : 'Visa klockan'}
    >
      <Clock size={15} strokeWidth={1.5} aria-hidden className="fp-clock-icon" />
      {shown ? <span aria-hidden>{fmtClock(seconds)}</span> : null}
    </button>
  )
}

export function TimeLine({ seconds, pace }: { seconds: number; pace: number }) {
  return (
    <span className="fp-timeline" aria-hidden>
      <i style={{ width: `${Math.min(1, seconds / pace) * 100}%` }} />
    </span>
  )
}

const SPLIT_MIN = 0.4
const SPLIT_MAX = 0.68
const SPLIT_START = 0.56
/** The running head's height (folio.css .fp-runhead). */
const RUNHEAD = 56

/** The first paragraph the essential steps cite — where the evidence is. */
function evidencePara(view: DrillCoreView): number | undefined {
  for (const s of view.explanation?.steps ?? []) {
    const cites = view.stepCites[s.n]
    if (s.tier !== 'detail' && cites?.length) return cites[0]
  }
  return view.cited[0]
}

/**
 * Two facing pages with a resizable spine: drag it, or ←/→ (⇧ for bigger
 * steps), Home and End when it has focus; a double click resets it. `start`
 * is where the spine stands when the spread opens.
 */
export function Spread({
  verso,
  recto,
  start = SPLIT_START,
  versoRef,
  rectoRef,
  rectoLabel,
  versoLabel,
}: {
  verso: ReactNode
  recto: ReactNode
  start?: number
  versoRef?: RefObject<HTMLElement | null>
  rectoRef?: RefObject<HTMLElement | null>
  rectoLabel: string
  /** Names the verso as a region (the quant problem: "Uppgift 3"); without
   *  a name the section is no landmark, as the reading verso is not. */
  versoLabel?: string
}) {
  const [split, setSplit] = useState(start)
  const [dragging, setDragging] = useState(false)
  const spreadRef = useRef<HTMLDivElement>(null)

  const clamp = (v: number) => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, v))
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !spreadRef.current) return
    const r = spreadRef.current.getBoundingClientRect()
    setSplit(clamp((e.clientX - r.left) / r.width))
  }
  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.06 : 0.02
    if (e.key === 'ArrowLeft') setSplit((s) => clamp(s - step))
    else if (e.key === 'ArrowRight') setSplit((s) => clamp(s + step))
    else if (e.key === 'Home') setSplit(SPLIT_MIN)
    else if (e.key === 'End') setSplit(SPLIT_MAX)
    else return
    e.preventDefault()
  }

  return (
    <div
      className="fp-spread"
      ref={spreadRef}
      style={{ '--fp-split': `${split * 100}%` } as CSSProperties}
    >
      {/* Each page is a vertical scroll region. It is no keyscope: ↑/↓ scroll
       *  it natively and the bake-off's switcher keeps its digits and ←/→.
       *  data-fp-region tells a running pass, whose own root is the scope,
       *  that a key on the page itself is not a move to another question. */}
      <section
        className="fp-page fp-page--verso"
        ref={versoRef}
        aria-label={versoLabel}
        data-fp-region
      >
        {verso}
      </section>
      {/* biome-ignore lint/a11y/useSemanticElements: a focusable, valued separator is the WAI-ARIA splitter pattern; <hr> cannot take focus or a value */}
      <div
        className="fp-gutter"
        role="separator"
        aria-orientation="vertical"
        aria-label="Uppslagets rygg – dra för att ändra sidornas bredd"
        aria-valuemin={SPLIT_MIN * 100}
        aria-valuemax={SPLIT_MAX * 100}
        aria-valuenow={Math.round(split * 100)}
        tabIndex={0}
        data-dragging={String(dragging)}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onDoubleClick={() => setSplit(start)}
        onKeyDown={onKey}
      >
        <span className="fp-gutter-grip" />
      </div>
      <section
        className="fp-page fp-page--recto"
        aria-label={rectoLabel}
        ref={rectoRef}
        data-fp-region
      >
        {recto}
      </section>
    </div>
  )
}

/** The recto's content in either phase (the running head above it carries
 *  the position). */
function QuestionColumn({
  view,
  act,
  refs,
  seam,
  active,
  point,
  gap,
  gaps,
  verdictRef,
  promptRef,
  note,
}: Shared &
  Pointing &
  Pick<DrillChrome, 'gap' | 'gaps' | 'verdictRef' | 'promptRef'> & {
    seam: DrillSeam
    /** Above the question: what keeps it from being answered (LackNote). */
    note?: ReactNode
  }) {
  if (view.phase === 'question') {
    return (
      <>
        {note}
        <QuestionFigure q={view.question} />
        <PromptBlock view={view} gap={gap} gaps={gaps} promptRef={promptRef} />
        <Options view={view} act={act} />
        <KeyHints letters={view.letters} focus />
      </>
    )
  }
  return (
    <>
      <Verdict
        view={view}
        after={view.correct == null ? null : seam.after(view.correct)}
        focusRef={verdictRef}
      />
      <QuestionFigure q={view.question} />
      <PromptBlock view={view} gap={gap} gaps={gaps} after />
      <GradedOptions view={view} />
      <Facit view={view} act={act} refs={refs} active={active} point={point} />
    </>
  )
}

/** The keys a drill answers to, set as a quiet line under the options. */
export function KeyHints({ letters, focus = false }: { letters: AnswerLetter[]; focus?: boolean }) {
  if (letters.length === 0) return null
  return (
    <p className="fp-keys">
      <span>
        <kbd className="fp-kbd">{letters[0]}</kbd>–
        <kbd className="fp-kbd">{letters[letters.length - 1]}</kbd> väljer
      </span>
      <span>
        <kbd className="fp-kbd">↵</kbd> svarar
      </span>
      <span>
        <kbd className="fp-kbd">⇧</kbd> + bokstav stryker
      </span>
      {focus ? (
        <span>
          <kbd className="fp-kbd">F</kbd> styckefokus
        </span>
      ) : null}
    </p>
  )
}

export function ActionBar({
  view,
  act,
  seam,
  gate,
}: {
  view: DrillCoreView
  act: Pick<DrillAct, 'lock' | 'next'>
  seam: Pick<DrillSeam, 'unit' | 'next'>
  /** Svara's gate where the drill keeps one (the reading drills): open
   *  only when the question can be answered, and why it is held. Without
   *  one, a choice opens it. */
  gate?: Gate
}) {
  const last = view.index + 1 >= view.total
  if (view.phase === 'question') {
    return (
      <div className="fp-actionbar">
        <button
          type="button"
          className="fp-btn"
          disabled={gate ? !gate.ready : !view.selected}
          onClick={act.lock}
          data-testid="rd-lock"
        >
          Svara
          <kbd className="fp-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
        <span className="fp-echo" aria-live="polite">
          {gate?.hold ?? (view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ')}
        </span>
      </div>
    )
  }
  return (
    <div className="fp-actionbar">
      {/* "Slutför", not "Avsluta": Avsluta is the way out mid-text. */}
      <button type="button" className="fp-btn" onClick={act.next} data-testid="rd-next">
        {last ? seam.next.last : seam.next.more}
        <kbd className="fp-kbd" aria-hidden>
          ↵
        </kbd>
      </button>
      <span className="fp-echo">
        {last ? seam.next.lastNote : `${seam.unit} ${view.index + 2} av ${view.total} väntar`}
      </span>
    </div>
  )
}

// ── The passage ──────────────────────────────────────────────────────

/** What a passage page reads from a drill: the question with its passage,
 *  the phase and the explanation's marks (a running pass hands it the same
 *  shape, never graded). */
export type PassageModel = Pick<
  DrillCoreView,
  | 'question'
  | 'passage'
  | 'phase'
  | 'marks'
  | 'correct'
  | 'picked'
  | 'cited'
  | 'focusPara'
  | 'flashPara'
  | 'flashSource'
>

/** The quotations to underline: every step's, and — after a wrong answer —
 *  the ones that say why the chosen option is wrong. */
function shownMarks(
  view: Pick<DrillCoreView, 'phase' | 'marks' | 'correct' | 'picked'>,
): QuoteMark[] {
  if (view.phase !== 'feedback') return []
  return view.marks.filter(
    (m) => m.source.startsWith('step-') || (!view.correct && m.source === `why-${view.picked}`),
  )
}

/** A paragraph's text with its marks, overlaps dropped (first wins). */
function marked(
  text: string,
  marks: QuoteMark[],
  view: Pick<DrillCoreView, 'flashPara' | 'flashSource'>,
  active: string | null,
): ReactNode[] {
  const sorted = [...marks].sort((a, b) => a.start - b.start || b.end - a.end)
  const out: ReactNode[] = []
  let at = 0
  for (const m of sorted) {
    if (m.start < at) continue
    if (m.start > at) out.push(text.slice(at, m.start))
    out.push(
      <mark
        key={`${m.source}-${m.start}`}
        className="fp-ev"
        data-src={m.source}
        data-kind={m.source.startsWith('why-') ? 'wrong' : 'evidence'}
        data-active={String(active === m.source)}
        data-flash={String(view.flashSource === m.source && view.flashPara === m.para)}
      >
        {text.slice(m.start, m.end)}
      </mark>,
    )
    at = m.end
  }
  if (at < text.length) out.push(text.slice(at))
  return out
}

/** The passage page: the ÖVNINGSTEXT tools and note, the title, the
 *  paragraphs with their ¶ numbers in the margin and, after an answer, the
 *  explanation's quotations underlined. An English (ELF) article keeps its
 *  tools, note and ¶ numbers Swedish; a gap text sets its blanks as
 *  GapMarks (`gaps`, else plain numbered blanks). */
export function PassageView({
  view,
  act,
  refs,
  note,
  setNote,
  active,
  badge = false,
  badgeText,
  noteText,
  gaps,
}: {
  view: PassageModel
  act: Pick<DrillAct, 'setFocusPara'>
  refs: Pick<DrillCoreRefs, 'para'>
  note: boolean
  setNote: (open: boolean) => void
  active: string | null
  /** Phone: the badge stands above the passage (desktop: in the head). */
  badge?: boolean
  badgeText: string
  noteText: string
  gaps?: GapModel | null
}) {
  const paragraphs = view.passage?.paragraphs ?? []
  const byline = view.passage?.byline ?? null
  const synthetic = view.question.passage?.synthetic ?? false
  const english = (view.question.passage?.lang ?? 'sv') === 'en'
  // Chrome inside an English article says so.
  const sv = english ? 'sv' : undefined
  const [title, subtitle] = passageTitle(view)
  const graded = view.phase === 'feedback'
  const gapped = hasGaps(paragraphs)
  const marks = gapped ? [] : shownMarks(view)
  let blanks = 0
  return (
    <article className="fp-passage" aria-labelledby="fp-ptitle" lang={english ? 'en' : undefined}>
      {synthetic ? (
        <>
          <div className="fp-ptools" lang={sv}>
            {badge ? (
              <span className="fp-badge" data-testid="rd-badge">
                {badgeText}
              </span>
            ) : null}
            <button
              type="button"
              className="fp-badge-toggle"
              data-testid="rd-note-toggle"
              aria-expanded={note}
              aria-controls="fp-note"
              onClick={() => setNote(!note)}
            >
              <Info size={14} strokeWidth={1.5} aria-hidden />
              {note ? 'Dölj noten' : 'Om texten'}
            </button>
          </div>
          <p className="fp-note" id="fp-note" hidden={!note} data-testid="rd-note" lang={sv}>
            {noteText}
          </p>
        </>
      ) : null}
      <h1 className="fp-ptitle" id="fp-ptitle">
        {title || (english ? <span lang="sv">Texten</span> : 'Texten')}
        {subtitle ? <span>{subtitle}</span> : null}
      </h1>
      <div
        className="fp-pbody"
        data-focus={String(view.focusPara != null)}
        data-testid={english ? 'rd-elf-passage' : 'rd-passage'}
      >
        {paragraphs.map((p, i) => {
          const n = i + 1
          const own = marks.filter((m) => m.para === n)
          // A ¶ link whose part quotes this paragraph marks the sentence;
          // otherwise the whole paragraph takes the mark.
          const sentence = own.some((m) => m.source === view.flashSource)
          const first = blanks
          if (gapped) blanks += countGaps(p)
          return (
            <p
              key={n}
              ref={refs.para(n)}
              className="fp-para"
              data-testid={`rd-para-${n}`}
              data-n={n}
              data-cited={String(graded && view.cited.includes(n))}
              data-flash={String(view.flashPara === n && !sentence)}
              data-focused={String(view.focusPara === n)}
            >
              {/* Out of the tab order: nine of these must not stand between
               *  the reader and the options; F, J and K drive the same aid. */}
              <button
                type="button"
                className="fp-pnum"
                tabIndex={-1}
                lang={sv}
                aria-label={`Stycke ${n}${view.focusPara === n ? ', i fokus' : ''}`}
                aria-pressed={view.focusPara === n}
                onClick={() => act.setFocusPara(view.focusPara === n ? null : n)}
              >
                {n}
              </button>
              {gapped ? (
                <GapRun text={p} model={gaps ?? NO_GAPS} first={first} />
              ) : own.length ? (
                marked(p, own, view, active)
              ) : (
                p
              )}
            </p>
          )
        })}
        {byline ? <p className="fp-byline">{byline}</p> : null}
      </div>
    </article>
  )
}

// ── Options ──────────────────────────────────────────────────────────

/** An option's content: its text (math rendered), or its picture with the
 *  text as the name — the text stands in if the picture fails. Each source
 *  and try is a picture of its own (PictureMount): a new source, a picture
 *  that comes back, or a reading drill's "Försök igen" is tried afresh.
 *  Inside a reading drill each mounted picture tells the drill how it
 *  stands (PictureGate). */
function OptionContent({ o }: { o: DrillOption }) {
  const attempt = useContext(PictureGate)?.attempt ?? 0
  const text = <MathText>{o.text}</MathText>
  const figure = o.figure
  if (!figure?.src) return text
  return (
    <PictureMount
      key={`${figure.src}#${attempt}`}
      part={o.letter}
      src={figure.src}
      alt={o.text}
      width={figure.width}
      height={figure.height}
      className="fp-opt-img"
      fallback={text}
    />
  )
}

/** The options before the answer: choose with the letter, strike with the
 *  quiet control at the row's end (always in view). `testId` names the
 *  option buttons (rd-option-<L>, rd-quant-option-<L> or, in a running
 *  pass, where the choice is saved and never graded, rd-prov-option-<L>).
 *  An English option's text is lang="en"; its spoken label and the strike
 *  stay Swedish, whatever the container says. */
export function Options({
  view,
  act,
  testId = 'rd-option',
}: {
  view: Pick<DrillCoreView, 'question' | 'selected' | 'eliminated'>
  act: Pick<DrillAct, 'select' | 'toggleEliminate'>
  testId?: string
}) {
  const en = langOf(view.question)
  const sv = en ? 'sv' : undefined
  return (
    <ol className="fp-opts" aria-label="Svarsalternativ">
      {(view.question.options ?? []).map((o) => {
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="fp-opt"
            data-state={selected ? 'selected' : out ? 'eliminated' : undefined}
            data-image={o.figure ? 'true' : undefined}
          >
            <button
              type="button"
              className="fp-opt-main"
              data-testid={`${testId}-${o.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(o.letter)}
            >
              <span className="fp-letter" aria-hidden>
                {o.letter}
              </span>
              <span className="fp-opt-text">
                <span className="fp-sr" lang={sv}>
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:{' '}
                </span>
                <InLang lang={en}>
                  <OptionContent o={o} />
                </InLang>
              </span>
            </button>
            <button
              type="button"
              className="fp-opt-x"
              data-testid={`rd-eliminate-${o.letter}`}
              lang={sv}
              aria-pressed={out}
              aria-label={out ? `Ångra strykningen av ${o.letter}` : `Stryk ${o.letter}`}
              title={out ? 'Ångra' : 'Stryk alternativet (⇧ + bokstav)'}
              onClick={() => act.toggleEliminate(o.letter)}
            >
              {out ? (
                <Undo2 size={16} strokeWidth={1.5} aria-hidden />
              ) : (
                <CircleSlash size={16} strokeWidth={1.5} aria-hidden />
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** After the answer: the chosen option and the right one, in full and at
 *  the same size as before; the rest wait behind one quiet link — or, with
 *  `all` (short quant options), stay in view in ink-2. */
export function GradedOptions({
  view,
  all: allShown = false,
}: {
  view: Pick<DrillCoreView, 'question' | 'picked'>
  all?: boolean
}) {
  const [opened, setOpened] = useState(false)
  const all = allShown || opened
  const key = view.question.answer
  const options = view.question.options ?? []
  const shown = options.filter((o) => all || o.letter === key || o.letter === view.picked)
  const rest = options.length - shown.length
  const en = langOf(view.question)
  const sv = en ? 'sv' : undefined
  return (
    <>
      <ol className="fp-opts" aria-label="Svarsalternativ, rättade">
        {shown.map((o) => {
          const right = o.letter === key
          const mine = o.letter === view.picked
          return (
            <li
              key={o.letter}
              className="fp-opt"
              data-grade={right ? 'right' : mine ? 'wrong' : 'other'}
              data-image={o.figure ? 'true' : undefined}
            >
              <div className="fp-opt-main">
                <span className="fp-letter" aria-hidden>
                  {o.letter}
                </span>
                <span className="fp-opt-text">
                  <span className="fp-sr" lang={sv}>
                    Alternativ {o.letter}:{' '}
                  </span>
                  <InLang lang={en}>
                    <OptionContent o={o} />
                  </InLang>
                  {right || mine ? (
                    <span className="fp-opt-tag" lang={sv}>
                      {right ? (
                        <Check size={14} strokeWidth={2.25} aria-hidden />
                      ) : (
                        <X size={14} strokeWidth={2.25} aria-hidden />
                      )}
                      {right && mine ? 'Ditt svar · rätt' : right ? 'Rätt svar' : 'Ditt svar'}
                    </span>
                  ) : null}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      {!allShown && (rest > 0 || opened) ? (
        <button
          type="button"
          className="fp-more fp-more-opts"
          aria-expanded={opened}
          onClick={() => setOpened(!opened)}
        >
          {opened ? 'Visa bara ditt svar och det rätta' : 'Visa alla alternativ'}
          <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </>
  )
}

// ── The facit ────────────────────────────────────────────────────────

/**
 * The verdict: a glyph in a ring, then the word and the right letter, in
 * ink. `after` is the repetition's one new line ("kommer tillbaka om …"),
 * inside the verdict so it is read with it. `focusRef` makes it a focus
 * target (the quant drills move focus here on Svara).
 */
export function Verdict({
  view,
  as = 'h2',
  after,
  focusRef,
}: {
  view: Pick<DrillCoreView, 'correct' | 'question'>
  as?: 'h2' | 'p'
  after?: string | null
  focusRef?: RefCallback<HTMLElement>
}) {
  const correct = view.correct === true
  const Tag = as
  return (
    <Tag
      className="fp-verdict"
      id="fp-verdict"
      data-correct={String(correct)}
      data-testid="rd-verdict"
      ref={focusRef}
      tabIndex={focusRef ? -1 : undefined}
    >
      <span className="fp-verdict-glyph" aria-hidden>
        {correct ? <Check size={18} strokeWidth={2.25} /> : <X size={18} strokeWidth={2.25} />}
      </span>
      <span>
        <b>{correct ? 'Rätt.' : 'Fel.'}</b>{' '}
        {correct ? `Svaret är ${view.question.answer}.` : `Rätt svar är ${view.question.answer}.`}
        {after ? <span className="fp-verdict-after">{after}</span> : null}
      </span>
    </Tag>
  )
}

/** What the facit needs from a drill (a review builds the same). */
export type FacitView = Pick<
  DrillCoreView,
  'question' | 'explanation' | 'correct' | 'picked' | 'openSteps' | 'stepCites' | 'distractorCites'
>

type FacitAct = Pick<DrillAct, 'cite' | 'goToStep' | 'toggleStep'>

/**
 * The explanation, ordered for learning: why the chosen option tempted
 * (and why it is wrong), what to take away (pitfall, technique), the
 * solution and its steps, and last the other options, folded. Without an
 * explanation yet, a plain line says so; the verdict above still stands.
 * An ELF explanation is English under Swedish heads: each body is
 * lang="en", and a missing body goes with its head. The framework line
 * names the pattern and opens it in Uppslag ("Slå upp").
 */
export function Facit({
  view,
  act,
  refs,
  active,
  point,
}: {
  view: FacitView
  act: FacitAct
  refs: Pick<DrillCoreRefs, 'step'>
} & Pointing) {
  const { data, actions } = useDirectionData()
  const e = view.explanation
  if (!e) {
    return (
      <div className="fp-facit">
        <p className="fp-empty fp-fsec">Förklaring saknas ännu för den här frågan.</p>
      </div>
    )
  }
  const q = view.question
  const en = langOf(q)
  const optionText = (letter: string) => q.options?.find((o) => o.letter === letter)?.text ?? ''
  const mine = view.correct ? null : e.distractors.find((d) => d.letter === view.picked)
  const others = e.distractors.filter((d) => d.letter !== mine?.letter)
  const frameworkId = e.framework_id
  const framework = entryName(frameworkId, data.frameworks)
  const steps = e.steps ?? []
  const hover = (source: string) => ({
    onMouseEnter: () => point(source),
    onMouseLeave: () => point(null),
    onFocus: () => point(source),
    onBlur: () => point(null),
  })
  // Folio records the request on its way to the host (Folio.tsx).
  const lookUp = () => {
    if (frameworkId) actions.openLesson(frameworkId)
  }
  return (
    <div className="fp-facit">
      {mine && (mine.why_tempting || mine.why_wrong) ? (
        <section
          className="fp-fsec fp-fsec--lure"
          data-testid={`rd-distractor-${mine.letter}`}
          {...hover(`why-${mine.letter}`)}
        >
          {/* Two siblings, so one heading style for both. */}
          {mine.why_tempting ? (
            <>
              <h3 className="fp-h3">Därför lockade {mine.letter}</h3>
              <p className="fp-prose" lang={en}>
                <Rich text={mine.why_tempting} act={act} />
              </p>
              <Cites
                list={view.distractorCites[mine.letter]?.tempting ?? []}
                source={`why-${mine.letter}`}
                act={act}
              />
            </>
          ) : null}
          {mine.why_wrong ? (
            <>
              <h3 className={mine.why_tempting ? 'fp-h3 fp-h3--next' : 'fp-h3'}>
                Varför {mine.letter} är fel
              </h3>
              <p className="fp-prose" lang={en}>
                <Rich text={mine.why_wrong} act={act} />
              </p>
              <Cites
                list={view.distractorCites[mine.letter]?.wrong ?? []}
                source={`why-${mine.letter}`}
                act={act}
              />
            </>
          ) : null}
        </section>
      ) : null}

      {e.pitfall || e.technique ? (
        <section className="fp-fsec fp-notes">
          <h3 className="fp-h3">Att ta med dig</h3>
          {e.pitfall ? (
            <div className="fp-note-item" data-testid="rd-pitfall">
              <span className="fp-sub">Fallgropen</span>
              <p className="fp-prose" lang={en}>
                <MathText>{e.pitfall}</MathText>
              </p>
            </div>
          ) : null}
          {e.technique ? (
            <div className="fp-note-item" data-testid="rd-technique">
              <span className="fp-sub">Tekniken</span>
              <p className="fp-prose" lang={en}>
                <MathText>{e.technique}</MathText>
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {e.solution_path ? (
        <section className="fp-fsec">
          <h3 className="fp-h3">Lösningen</h3>
          <p className="fp-prose" lang={en}>
            <MathText>{e.solution_path}</MathText>
          </p>
        </section>
      ) : null}

      {steps.length ? (
        <section className="fp-fsec">
          <h3 className="fp-h3">Steg för steg</h3>
          <ol>
            {steps.map((s) => (
              <Step key={s.n} step={s} view={view} act={act} refs={refs} hover={hover} lang={en} />
            ))}
          </ol>
        </section>
      ) : null}

      {others.length ? (
        <section className="fp-fsec">
          <h3 className="fp-h3">{mine ? 'De andra alternativen' : 'Alternativen'}</h3>
          {others.map((d) => (
            <Distractor
              key={d.letter}
              d={d}
              text={optionText(d.letter)}
              cites={view.distractorCites[d.letter] ?? { tempting: [], wrong: [] }}
              act={act}
              active={active}
              lang={en}
            />
          ))}
        </section>
      ) : null}

      {framework && frameworkId ? (
        <p className="fp-framework">
          Ramverk: <b>{framework}</b> ·{' '}
          <button type="button" className="fp-link" onClick={lookUp}>
            Slå upp
            <ArrowRight size={13} strokeWidth={1.75} aria-hidden />
          </button>
        </p>
      ) : null}
    </div>
  )
}

function Step({
  step,
  view,
  act,
  refs,
  hover,
  lang,
}: {
  step: ExplanationStep
  view: Pick<FacitView, 'openSteps' | 'stepCites'>
  act: FacitAct
  refs: Pick<DrillCoreRefs, 'step'>
  hover: (source: string) => Record<string, () => void>
  /** 'en' for an ELF explanation's title and text. */
  lang?: 'en'
}) {
  const detail = step.tier === 'detail'
  const open = !detail || view.openSteps.has(step.n)
  const source = `step-${step.n}`
  return (
    <li
      className="fp-step"
      data-tier={step.tier ?? 'essential'}
      data-testid={`rd-step-${step.n}`}
      ref={refs.step(step.n)}
      {...hover(source)}
    >
      <span className="fp-step-n" aria-hidden>
        {step.n}
      </span>
      <div>
        <div className="fp-step-head">
          <h4 className="fp-step-title">
            <span className="fp-sr">Steg {step.n}: </span>
            <InLang lang={lang}>{step.title}</InLang>
          </h4>
          <Cites list={view.stepCites[step.n] ?? []} source={source} act={act} />
        </div>
        {open ? (
          <p className="fp-step-text" lang={lang}>
            <Rich text={step.text} act={act} />
          </p>
        ) : null}
        {detail ? (
          <button
            type="button"
            className="fp-more"
            data-testid={`rd-step-toggle-${step.n}`}
            aria-expanded={open}
            onClick={() => act.toggleStep(step.n)}
          >
            {open ? 'Dölj fördjupningen' : 'Fördjupning'}
            <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>
    </li>
  )
}

function Distractor({
  d,
  text,
  cites,
  act,
  active,
  lang,
}: {
  d: DistractorExplanation
  text: string
  cites: { tempting: number[]; wrong: number[] }
  act: FacitAct
  active: string | null
  /** 'en' for an ELF option and its reasons. */
  lang?: 'en'
}) {
  const [open, setOpen] = useState(false)
  const bodyId = `fp-dis-${d.letter}`
  const reasons = Boolean(d.why_tempting || d.why_wrong)
  return (
    <article
      className="fp-dis"
      data-testid={`rd-distractor-${d.letter}`}
      data-active={String(active === `why-${d.letter}`)}
    >
      <div className="fp-dis-head">
        <span className="fp-letter" aria-hidden>
          {d.letter}
        </span>
        <div>
          <p className="fp-dis-opt">
            <span className="fp-sr">Alternativ {d.letter}: </span>
            <InLang lang={lang}>
              <MathText>{text}</MathText>
            </InLang>
          </p>
          {reasons ? (
            <button
              type="button"
              className="fp-more"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => setOpen(!open)}
            >
              {open ? 'Dölj' : 'Varför det lockar – och varför det är fel'}
              <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      {open && reasons ? (
        <div className="fp-dis-body" id={bodyId}>
          {d.why_tempting ? (
            <>
              <span className="fp-sub">Varför det lockar</span>
              <p className="fp-prose" lang={lang}>
                <Rich text={d.why_tempting} act={act} />
              </p>
              <Cites list={cites.tempting} source={`why-${d.letter}`} act={act} />
            </>
          ) : null}
          {d.why_wrong ? (
            <>
              <span className="fp-sub">Varför det är fel</span>
              <p className="fp-prose" lang={lang}>
                <Rich text={d.why_wrong} act={act} />
              </p>
              <Cites list={cites.wrong} source={`why-${d.letter}`} act={act} />
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

/** Citations as a footnote's "see": inline ¶ references, no pills. */
function Cites({
  list,
  source,
  act,
}: {
  list: number[]
  source: string
  act: Pick<DrillAct, 'cite'>
}) {
  if (list.length === 0) return null
  return (
    <span className="fp-cites">
      <span className="fp-cites-see" aria-hidden>
        Se
      </span>
      {list.map((n) => (
        <button
          key={n}
          type="button"
          className="fp-cite"
          data-testid={`rd-cite-${n}`}
          onClick={() => act.cite(n, source)}
          aria-label={`Visa stycke ${n} i texten`}
        >
          ¶{n}
        </button>
      ))}
    </span>
  )
}

/** Explanation text, verbatim (math rendered), with its "(steg 2)"
 *  references made into links to the step. */
function Rich({ text, act }: { text: string; act: Pick<DrillAct, 'goToStep'> }) {
  let at = 0
  return (
    <>
      {splitStepRefs(text).map((seg) => {
        const key = at
        at += seg.text.length
        return seg.kind === 'text' ? (
          <span key={key}>
            <MathText>{seg.text}</MathText>
          </span>
        ) : (
          <button
            key={key}
            type="button"
            className="fp-stepref"
            onClick={() => act.goToStep(seg.steps[0])}
          >
            {seg.text}
          </button>
        )
      })}
    </>
  )
}

// ── End of a unit: a typographic colophon ────────────────────────────

/**
 * The colophon (spec §1.7 "Done"): ⁂, the title, a caps facts row between
 * hairlines, an italic line or two, `extra` (a disclosure such as the
 * round's list), then the filled button — the plan's next part — and a
 * quiet way back to where the reader came from.
 */
export function Colophon({
  title,
  subtitle,
  facts,
  lines,
  next,
  back,
  extra,
  titleLang,
  titleRef,
}: {
  title: string
  subtitle?: string
  facts: string
  lines: ReactNode
  next?: { label: string; onClick: () => void }
  back: { label: string; onClick: () => void }
  extra?: ReactNode
  /** 'en' for an ELF unit's title (the facts and lines stay Swedish). */
  titleLang?: 'en'
  /** Makes the title a focus target: the end of a unit is announced there. */
  titleRef?: RefCallback<HTMLElement>
}) {
  return (
    <div className="fp-colophon" data-testid="rd-done">
      <div className="fp-colophon-text">
        <span className="fp-colophon-mark" aria-hidden>
          ⁂
        </span>
        <h2 ref={titleRef} tabIndex={titleRef ? -1 : undefined} lang={titleLang}>
          {title}
          {subtitle ? <span>{subtitle}</span> : null}
        </h2>
        <p className="fp-colophon-facts">{facts}</p>
        <p>{lines}</p>
      </div>
      {extra}
      {/* The day goes on: the plan's next part is the one action. */}
      <div className="fp-colophon-actions">
        {next ? (
          <button
            type="button"
            className="fp-btn"
            onClick={next.onClick}
            data-testid="rd-done-next"
          >
            {next.label}
            <kbd className="fp-kbd" aria-hidden>
              ↵
            </kbd>
          </button>
        ) : null}
        <button type="button" className="fp-more fp-colophon-home" onClick={back.onClick}>
          {back.label}
        </button>
      </div>
    </div>
  )
}

function ReadingColophon({
  view,
  act,
  origin,
  onNext,
  nextLabel,
  dateLabel,
  doneRef,
}: DrillChrome) {
  const { actions } = useDirectionData()
  const [title, subtitle] = passageTitle(view)
  const right = view.results.filter((r) => r.correct).length
  const misses = view.total - right
  // "Till Öva" goes to Öva: the page its label names, not wherever the
  // drill's exit would lead.
  const to = origin.to
  const back = to === 'konto' ? actions.openKonto : to ? () => actions.go(to) : act.exit
  return (
    <Colophon
      title={title || 'Texten'}
      subtitle={subtitle}
      titleLang={title ? langOf(view.question) : undefined}
      titleRef={doneRef}
      facts={`${view.total} ${view.total === 1 ? 'fråga' : 'frågor'} · ${right} rätt · ${Math.max(1, Math.round(view.elapsed / 60))} min`}
      lines={`Läst och besvarad ${dateLabel.toLowerCase()}. ${
        misses > 0
          ? `${misses === 1 ? 'Missen väntar' : 'Missarna väntar'} i nästa repetition, de äldsta först.`
          : 'Inga missar att repetera.'
      }`}
      next={onNext && nextLabel ? { label: nextLabel, onClick: onNext } : undefined}
      back={{ label: `Till ${origin.label}`, onClick: back }}
    />
  )
}

/** A sitting without questions: a blank page that says so, and the way
 *  back (spec §1.7 "Empty"). */
export function EmptyDrill({ label, width }: { label: string; width: DirectionProps['width'] }) {
  const { actions } = useDirectionData()
  return (
    <div className={width === 'phone' ? 'fp-pdrill' : 'fp-drill'}>
      <header className="fp-runhead fp-runhead--solo">
        <ExitButton onExit={() => actions.drill.exit?.()} />
        <span className="fp-label fp-runhead-title">{label}</span>
        <span />
      </header>
      <div className="fp-main fp-done">
        <div className="fp-colophon">
          <h2>Inga frågor att öva på just nu.</h2>
          <p>När det finns frågor klara för övningen öppnas de här.</p>
          <div className="fp-colophon-actions">
            <button type="button" className="fp-btn" onClick={() => actions.go('ova')}>
              Till Öva
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── A modal slip on the page (FolioDialog) ───────────────────────────

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * The focus-trap primitive Folio's modal views stand on (Förstora and the
 * slips): a dialog that takes focus when it opens (an element marked
 * data-autofocus, else itself), keeps Tab inside, closes on Esc and gives
 * focus back to whatever had it before. It sits inside the direction's
 * root, so it covers the stage — not the browser window; the caller makes
 * the page under it inert. It is not a native dialog, so it carries
 * data-rd-keyscope: keys pressed inside it never reach the bake-off's
 * switcher. A held-down ↵ or space presses its buttons once, never again on
 * the key's repeat.
 */
export function FolioDialog({
  label,
  labelledBy,
  onClose,
  className,
  children,
}: {
  label?: string
  /** The id of the heading that names it (instead of `label`). */
  labelledBy?: string
  onClose: () => void
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useLayoutEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const box = ref.current
    const first = box?.querySelector<HTMLElement>('[data-autofocus]') ?? box
    first?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      closeRef.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      // After the commit: the page under the dialog stops being inert in
      // the same commit that removes the dialog, and an inert opener
      // cannot take focus.
      queueMicrotask(() => opener?.focus({ preventScroll: true }))
    }
  }, [])
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.repeat && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      return
    }
    if (e.key !== 'Tab' || !ref.current) return
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  return (
    <div
      ref={ref}
      className={className}
      role="dialog"
      aria-modal="true"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      data-rd-keyscope
    >
      {children}
    </div>
  )
}

/**
 * A modal slip (spec §1.1 and screen 9 "FolioSlip"): a square-cut sheet of
 * lighter paper over the scrim — centred in the top third on desktop, a
 * bottom slip on phone — its caps heading underlined by the heavy rule,
 * then its content. Built on FolioDialog (focus trap, Esc, focus back); a
 * press outside it closes it too. The caller makes the page under it inert
 * and renders it outside that page, at the stage's level.
 */
export function FolioSlip({
  id,
  title,
  meta,
  onClose,
  children,
}: {
  /** Names the heading the dialog is labelled by. */
  id: string
  /** The caps heading ("Starta provpass"). */
  title: string
  /** One piece of meta at the heading's right ("13 av 40 besvarade"). */
  meta?: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  // A press on the scrim (anywhere outside the slip) closes it; Esc and the
  // slip's own buttons are the keyboard's way out.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest('.fp-slip')) return
      closeRef.current()
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
  }, [])
  return (
    <>
      <div className="fp-scrim fp-slip-scrim" aria-hidden />
      <FolioDialog labelledBy={`${id}-h`} onClose={onClose} className="fp-slip">
        <div className="fp-slip-head">
          <h2 className="fp-label" id={`${id}-h`}>
            {title}
          </h2>
          {meta ? <span className="fp-slip-meta">{meta}</span> : null}
        </div>
        {children}
      </FolioDialog>
    </>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

function PhoneDrill(chrome: DrillChrome) {
  const { view, act, refs, seam, note, setNote, focusOn, toggleFocus, clocked, gap, gaps } = chrome
  const { state: sheet, setState: setSheet, toggle, grab } = useSheet(view)
  const { hidden: compact, onScroll: onHeadScroll } = useHideOnScroll()
  const synthetic = view.question.passage?.synthetic ?? false
  // The passage's own badge has scrolled away: the sheet carries it.
  const [badgeGone, setBadgeGone] = useState(false)
  const onScroll = (e: { currentTarget: HTMLElement }) => {
    onHeadScroll(e)
    setBadgeGone(e.currentTarget.scrollTop > 120)
  }
  const scrollRef = useRef<HTMLDivElement>(null)
  // A gap text keeps the open gap in view, above the slip's top edge.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new question or a sheet move only
  useEffect(() => {
    if (view.phase !== 'question' || gap == null) return
    const box = scrollRef.current
    scrollInto(box, box?.querySelector(`[data-gap="${gap}"]`), 96)
  }, [view.index, sheet])

  // A ¶ link folds the sheet to its peek so the cited paragraph shows.
  const cite = (n: number, source?: string) => {
    setSheet('peek')
    act.cite(n, source)
  }
  const sheetAct: DrillAct = { ...act, cite }

  if (view.phase === 'done') {
    return (
      <div className="fp-pdrill">
        <div className="fp-pdrill-scroll fp-done">
          <ReadingColophon {...chrome} />
        </div>
      </div>
    )
  }

  const progress = ((view.index + (view.phase === 'feedback' ? 1 : 0)) / view.total) * 100
  const feedback = view.phase === 'feedback'
  const count = view.question.options?.length ?? 0
  return (
    <div className="fp-pdrill">
      <header className="fp-pdrill-head" data-compact={String(compact)}>
        <ExitButton onExit={act.exit} compact />
        {/* Progress once here — the line along the head's foot; the slip
         *  names the question. */}
        <span />
        <div className="fp-head-right">
          <button
            type="button"
            className="fp-ghost fp-focus-btn"
            aria-pressed={focusOn}
            aria-label="Styckefokus"
            onClick={toggleFocus}
          >
            <Pilcrow size={16} strokeWidth={1.5} aria-hidden />
            <span aria-hidden>Fokus</span>
          </button>
          {clocked ? (
            <span className="fp-clock" role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
              <Clock size={14} strokeWidth={1.5} aria-hidden className="fp-clock-icon" />
              <span aria-hidden>{fmtClock(view.elapsed)}</span>
            </span>
          ) : null}
        </div>
        <span className="fp-head-progress" aria-hidden>
          <i style={{ width: `${progress}%` }} />
        </span>
      </header>
      {/* Under the full-height feedback sheet the passage is out of reach:
       *  inert, so focus never lands on something covered. It scrolls only
       *  vertically, so it is no keyscope: the switcher keeps its keys. */}
      <div
        className="fp-pdrill-scroll"
        ref={scrollRef}
        onScroll={onScroll}
        inert={sheet === 'full'}
        data-fp-region
      >
        <PassageView
          view={view}
          act={act}
          refs={refs}
          note={note}
          setNote={setNote}
          active={null}
          badge
          badgeText={chrome.badge}
          noteText={chrome.noteText}
          gaps={gaps}
        />
        <div style={{ height: sheet === 'peek' ? 260 : 120 }} aria-hidden />
      </div>
      <section
        className="fp-sheet"
        data-state={sheet}
        data-testid="rd-sheet"
        aria-label={`${seam.unit} ${view.index + 1}`}
      >
        {/* The grab is for thumbs and pointers: the keyboard has the same
         *  moves as labelled buttons (the peek's action, "Visa texten"),
         *  so it stays out of the tab order. */}
        <button
          type="button"
          className="fp-sheet-grab"
          tabIndex={-1}
          aria-label={sheet === 'peek' ? 'Visa frågan' : 'Visa texten'}
          aria-expanded={sheet !== 'peek'}
          {...grab}
        />
        <div className="fp-sheet-head">
          <span className="fp-label">
            {seam.unit} {view.index + 1} av {view.total}
            {synthetic && (badgeGone || feedback) ? (
              <span className="fp-sheet-badge"> · {chrome.badge}</span>
            ) : null}
          </span>
          {/* The way back to the text, where the eye looks for it. */}
          {sheet === 'peek' ? null : (
            <button
              type="button"
              className="fp-more fp-sheet-back"
              onClick={() => setSheet('peek')}
            >
              Visa texten
              <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </div>
        <div className="fp-sheet-body">
          {feedback ? null : <LackNote lack={chrome.lack} onRetry={chrome.onRetry} />}
          {sheet === 'peek' ? (
            <>
              {feedback ? <Verdict view={view} as="p" /> : null}
              {feedback ? null : (
                <PromptBlock view={view} gap={gap} gaps={gaps} promptRef={chrome.promptRef} />
              )}
              {/* The peek's one action: the screen's filled button. */}
              <button type="button" className="fp-btn fp-peek-btn" onClick={toggle}>
                {feedback ? 'Tillbaka till facit' : `Visa de ${WORDS[count] ?? count} alternativen`}
                <ChevronUp size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : feedback ? (
            <>
              <Verdict
                view={view}
                as="p"
                after={view.correct == null ? null : seam.after(view.correct)}
                focusRef={chrome.verdictRef}
              />
              <QuestionFigure q={view.question} />
              <PromptBlock view={view} gap={gap} gaps={gaps} after />
              <GradedOptions view={view} />
              <Facit view={view} act={sheetAct} refs={refs} active={null} point={() => {}} />
            </>
          ) : (
            <>
              <QuestionFigure q={view.question} />
              <PromptBlock view={view} gap={gap} gaps={gaps} />
              <Options view={view} act={act} />
            </>
          )}
        </div>
        {sheet === 'peek' ? null : (
          <ActionBar view={view} act={act} seam={seam} gate={chrome.gate} />
        )}
      </section>
    </div>
  )
}
