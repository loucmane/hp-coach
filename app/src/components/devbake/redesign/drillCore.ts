// The redesign kit's drill core (kit v2, bead hpf-qr0p.7; docs/redesign/kit-v2.md):
// the interaction state of a practice drill for any question the bank
// holds — a LÄS/ELF passage with A–D, a quant prompt with math and A–E,
// a DTK figure, or a stub without options — and nothing about how it
// looks or where its questions come from.
//
//   - passage parsing and the ¶ citations explanations point at (derived
//     from the explanation's own words, never rewritten)
//   - useDrillCore: select → lock → feedback → next → done, striking
//     options out, the session clock, the paragraph focus aid, cited
//     paragraphs and quotations, and the explanation's opened steps
//   - DrillController: who grades a locked answer and hears the moves. The
//     bake-off's LOCAL_CONTROLLER grades against the question's own answer;
//     the real app will pass one that wraps SessionPlayer's onPick (record
//     the attempt) and onNext (advance the session).
//
// r1Kit's useDrill is this core fed with the round-1 unit and kept in step
// with the bake-off's switcher. Round-2 screens call useDrillCore with a
// session from useDirectionData() (directionData.tsx).

import { type RefCallback, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { DrillQuestion } from '@/components/devbake/redesign/viewModel'
import type { Explanation } from '@/data/explanations'
import type { AnswerLetter } from '@/data/questions'

// ── Passage ──────────────────────────────────────────────────────────

export type Passage = { paragraphs: string[]; byline: string | null }

/** Splits an exported P5 context into paragraphs and the trailing byline
 *  ("– Name, role" on its own line after the last paragraph). */
export function parsePassage(context: string): Passage {
  const paragraphs = context.split(/\n\n+/)
  let byline: string | null = null
  const last = paragraphs[paragraphs.length - 1]
  const cut = last.lastIndexOf('\n')
  if (cut !== -1 && /^[–-]\s/.test(last.slice(cut + 1))) {
    byline = last.slice(cut + 1)
    paragraphs[paragraphs.length - 1] = last.slice(0, cut)
  }
  return { paragraphs, byline }
}

const ORDINALS: Record<string, number> = {
  första: 1,
  andra: 2,
  tredje: 3,
  fjärde: 4,
  femte: 5,
  sjätte: 6,
  sjunde: 7,
  åttonde: 8,
  nionde: 9,
  tionde: 10,
}

const ORDINAL_RE = new RegExp(`(${Object.keys(ORDINALS).join('|')})\\s+stycket`, 'giu')

/** The quotations in a text. Swedish typography opens and closes with the
 *  same ”, so quotes are the odd-numbered pieces between them — a regex
 *  would happily take the gap between two quotations for a third. Only
 *  quotes of 12+ characters count (single words are too ambiguous). */
function quotations(text: string): string[] {
  return text
    .split('”')
    .filter((_, i, all) => i % 2 === 1 && i < all.length - 1)
    .filter((q) => q.trim().length >= 12)
}
// Years and proper names: kept only when exactly one paragraph has them.
const RARE_RE = /\b(1[5-9]\d\d)\b|(?<=[\p{Ll},;:]\s)(\p{Lu}\p{Ll}{4,})/gu

function normalise(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/[.,;:…]+$/u, '')
    .trim()
    .toLocaleLowerCase('sv-SE')
}

/**
 * The paragraph numbers (1-based) an explanation sentence points at:
 * "sjätte stycket", a quotation that occurs in the passage, or a year or
 * name that occurs in exactly one paragraph. The text itself is never
 * changed — the numbers become ¶ links beside it.
 */
export function citeParagraphs(text: string, paragraphs: string[]): number[] {
  const hay = paragraphs.map(normalise)
  const found = new Set<number>()
  for (const m of text.matchAll(ORDINAL_RE)) {
    const n = ORDINALS[m[1].toLocaleLowerCase('sv-SE')]
    if (n && n <= paragraphs.length) found.add(n)
  }
  for (const q of quotations(text)) {
    const needle = normalise(q)
    hay.forEach((p, i) => {
      if (p.includes(needle)) found.add(i + 1)
    })
  }
  for (const m of text.matchAll(RARE_RE)) {
    const token = (m[1] ?? m[2]).toLocaleLowerCase('sv-SE')
    // A genitive ("Grimlunds") counts as its name: the name must be rare.
    const stem = m[2] && token.endsWith('s') ? token.slice(0, -1) : token
    const hits = hay.flatMap((p, i) => (p.includes(stem) ? [i + 1] : []))
    if (hits.length === 1) found.add(hits[0])
  }
  return [...found].sort((a, b) => a - b)
}

/** A verbatim quotation from the passage, located: paragraph number and
 *  the character range inside that paragraph's text. */
export type QuoteSpan = { para: number; start: number; end: number }

/** A quotation an explanation part makes, for sentence-level evidence marks.
 *  `source` names the part: "step-2", or "why-A" for a distractor's why_wrong. */
export type QuoteMark = QuoteSpan & { source: string }

/**
 * Where a piece of explanation quotes the passage verbatim (”…” of 12+
 * characters): each match's paragraph and character range. A quote's own
 * closing punctuation may or may not be in the passage; case may differ at
 * the start. Nothing is rewritten — callers mark the ranges.
 */
export function findQuotes(text: string, paragraphs: string[]): QuoteSpan[] {
  const out: QuoteSpan[] = []
  const lower = paragraphs.map((p) => p.toLocaleLowerCase('sv-SE'))
  for (const q of quotations(text)) {
    const quote = q.replace(/\s+/g, ' ').trim()
    for (const needle of [quote, quote.replace(/[.,;:…]+$/u, '')]) {
      const n = needle.toLocaleLowerCase('sv-SE')
      const hits = lower.flatMap((p, i) => {
        const at = p.indexOf(n)
        return at === -1 ? [] : [{ para: i + 1, start: at, end: at + needle.length }]
      })
      if (hits.length) {
        out.push(...hits)
        break
      }
    }
  }
  return out
}

export type StepRefSegment =
  | { kind: 'text'; text: string }
  | { kind: 'ref'; text: string; steps: number[] }

const STEP_REF_RE = /\((?:steg|steps?)\s+(\d+)(?:\s*(?:–|-|och|and)\s*(\d+))?\)/gu

/** Splits text around its "(steg 2)" / "(steg 2–3)" / "(steps 2 and 3)"
 *  references so a renderer can make them jump to the step. Verbatim. */
export function splitStepRefs(text: string): StepRefSegment[] {
  const out: StepRefSegment[] = []
  let last = 0
  for (const m of text.matchAll(STEP_REF_RE)) {
    const at = m.index ?? 0
    if (at > last) out.push({ kind: 'text', text: text.slice(last, at) })
    const from = Number(m[1])
    const to = m[2] ? Number(m[2]) : from
    const steps: number[] = []
    for (let n = from; n <= to; n++) steps.push(n)
    out.push({ kind: 'ref', text: m[0], steps })
    last = at + m[0].length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

/** Where an explanation points into its passage: ¶ citations per step
 *  number and per distractor letter, every cited paragraph (for margin
 *  marks), and the verbatim quotations its steps ("step-N") and each
 *  distractor's why_wrong ("why-L") make. Empty without a passage. */
export type ExplanationCites = {
  stepCites: Record<number, number[]>
  distractorCites: Record<string, { tempting: number[]; wrong: number[] }>
  cited: number[]
  marks: QuoteMark[]
}

export function explanationCites(
  e: Explanation | null,
  paragraphs: string[] | null,
): ExplanationCites {
  const stepCites: Record<number, number[]> = {}
  const distractorCites: Record<string, { tempting: number[]; wrong: number[] }> = {}
  const marks: QuoteMark[] = []
  if (!e) return { stepCites, distractorCites, cited: [], marks }
  const paras = paragraphs ?? []
  const cite = (text: string) => (paras.length ? citeParagraphs(text, paras) : [])
  for (const s of e.steps ?? []) stepCites[s.n] = cite(s.text)
  for (const d of e.distractors) {
    distractorCites[d.letter] = { tempting: cite(d.why_tempting), wrong: cite(d.why_wrong) }
  }
  if (paras.length) {
    for (const s of e.steps ?? []) {
      for (const q of findQuotes(s.text, paras)) marks.push({ ...q, source: `step-${s.n}` })
    }
    for (const d of e.distractors) {
      for (const q of findQuotes(d.why_wrong, paras))
        marks.push({ ...q, source: `why-${d.letter}` })
    }
  }
  const all = new Set<number>()
  for (const list of Object.values(stepCites)) for (const n of list) all.add(n)
  for (const c of Object.values(distractorCites))
    for (const n of [...c.tempting, ...c.wrong]) all.add(n)
  return { stepCites, distractorCites, cited: [...all].sort((a, b) => a - b), marks }
}

// ── Motion and scrolling ─────────────────────────────────────────────

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** The nearest ancestor that scrolls vertically (overflow auto/scroll). */
function scroller(el: HTMLElement): HTMLElement | null {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const y = getComputedStyle(n).overflowY
    if (y === 'auto' || y === 'scroll') return n
  }
  return null
}

/**
 * Scrolls an element into view inside its own scroller only — never the
 * clipping ancestors around it (scrollIntoView would shift an overflow:
 * hidden stage or frame too). `center` centres it; `nearest` scrolls the
 * least; `start` puts it a little below the scroller's top. Instant under
 * reduced motion; a no-op without layout (jsdom).
 */
function reveal(el: HTMLElement | undefined, block: 'center' | 'nearest' | 'start'): void {
  if (!el) return
  const box = scroller(el)
  if (!box || typeof box.scrollTo !== 'function') return
  const b = box.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const top = r.top - b.top + box.scrollTop
  let target = box.scrollTop
  if (block === 'center') target = top - (b.height - Math.min(r.height, b.height)) / 2
  else if (block === 'start') target = top - 56
  else if (r.top < b.top + 16) target = top - 16
  else if (r.bottom > b.bottom - 16) target = top + r.height - b.height + 16
  box.scrollTo({ top: Math.max(0, target), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

// ── Controller ───────────────────────────────────────────────────────

export type DrillPhase = 'question' | 'feedback' | 'done'

export type DrillResult = { qid: string; pick: AnswerLetter; correct: boolean }

export type DrillGrade = { correct: boolean }

/**
 * Who grades a locked answer and hears the drill's moves. Only `lock` is
 * required. The core calls it once per locked answer and shows its verdict;
 * the other hooks are notifications. The real app's controller wraps
 * SessionPlayer: lock ⇄ onPick (grade, then record the attempt with
 * useSubmitAttempt), next ⇄ onNext (advance or end the session), exit ⇄
 * leaving the route.
 */
export type DrillController = {
  /** The reader highlighted an option (nothing is graded or recorded). */
  pick?: (question: DrillQuestion, letter: AnswerLetter) => void
  /** The reader locked `letter`: grade it. */
  lock: (question: DrillQuestion, letter: AnswerLetter) => DrillGrade
  /** The reader moved on from feedback: to question `index`, or null when
   *  the set is done. */
  next?: (index: number | null) => void
  /** The reader asked to leave the drill ("Avsluta"). */
  exit?: () => void
}

/** The bake-off's controller: grades against the question's own answer
 *  and records nothing. */
export const LOCAL_CONTROLLER: DrillController = {
  lock: (question, letter) => ({ correct: letter === question.answer }),
}

// ── Drill state ──────────────────────────────────────────────────────

/** Where a drill opens. */
export type DrillStart = {
  /** Index into `questions` of the question on screen (default 0). */
  index?: number
  /** Answers already given in this sitting — progress, never re-graded. */
  results?: DrillResult[]
  /** Open the question already graded with this pick (a Facit view). A
   *  display state: it is graded against the question's answer and the
   *  controller is not called. */
  graded?: AnswerLetter
}

export type DrillCoreOptions = {
  questions: readonly DrillQuestion[]
  /** By qid. A missing or null entry is the real loader's "no explanation
   *  yet": the feedback shows the verdict without one. */
  explanations: Readonly<Record<string, Explanation | null | undefined>>
  /** Default LOCAL_CONTROLLER. */
  controller?: DrillController
  /** Read on mount only. */
  start?: DrillStart
  /** Seconds on the clock at the start (default 0). */
  elapsed?: number
  /** False in the side-by-side stills: the clock stands still. */
  live: boolean
}

export type DrillCoreView = {
  index: number
  total: number
  question: DrillQuestion
  /** Null when the question has no explanation yet. */
  explanation: Explanation | null
  phase: DrillPhase
  /** The question's option letters in order (A–D, A–E, or none). */
  letters: AnswerLetter[]
  /** Highlighted before the answer is locked. */
  selected: AnswerLetter | null
  /** The locked answer (feedback). */
  picked: AnswerLetter | null
  /** The verdict on `picked`, or null before a lock. */
  correct: boolean | null
  eliminated: ReadonlySet<AnswerLetter>
  /** Answers given in this sitting, the current one included once locked. */
  results: DrillResult[]
  elapsed: number
  /** The question's passage, or null (quant, DTK). */
  passage: Passage | null
  /** The paragraph focus aid (1-based), or null when off. */
  focusPara: number | null
  /** A cited paragraph, briefly marked after a ¶ link is followed. */
  flashPara: number | null
  /** The explanation part (QuoteMark.source) whose quotations are briefly
   *  marked after its ¶ link is followed, or null. */
  flashSource: string | null
  /** Detail-tier steps the reader has opened. */
  openSteps: ReadonlySet<number>
} & ExplanationCites

export type DrillCoreActions = {
  select: (letter: AnswerLetter) => void
  /** Locks the selected option; true when an answer was locked. */
  lock: () => boolean
  toggleEliminate: (letter: AnswerLetter) => void
  /** From feedback to the next question ('next') or the end ('done');
   *  null when there was no feedback to move on from. */
  next: () => 'next' | 'done' | null
  exit: () => void
  setFocusPara: (n: number | null) => void
  moveFocusPara: (delta: 1 | -1) => void
  /** Scrolls the passage to paragraph n and marks it for a moment; with a
   *  `source`, that part's quotations are marked too (flashSource). */
  cite: (n: number, source?: string) => void
  toggleStep: (n: number) => void
  /** Opens (if detail) and scrolls to step n of the explanation. */
  goToStep: (n: number) => void
  /** Back to the start, unanswered, with the clock reset. */
  restart: () => void
  // The bake-off switcher's display moves — a real screen never needs them.
  /** Grades the open question without the controller: the selected
   *  option, else `fallback(question)`, else its first option. */
  gradeAs: (fallback?: (question: DrillQuestion) => AnswerLetter | undefined) => void
  /** Feedback back to the same question, unanswered. */
  reopen: () => void
  /** Back to the start, unanswered; the clock and the opened steps stay. */
  reset: () => void
}

export type DrillCoreRefs = {
  /** Attach to each paragraph element (1-based number). */
  para: (n: number) => RefCallback<HTMLElement>
  /** Attach to each explanation step element. */
  step: (n: number) => RefCallback<HTMLElement>
}

type CoreState = {
  index: number
  phase: DrillPhase
  selected: AnswerLetter | null
  picked: AnswerLetter | null
  correct: boolean | null
  eliminated: AnswerLetter[]
  results: DrillResult[]
}

function lettersOf(q: DrillQuestion | undefined): AnswerLetter[] {
  return q?.options?.map((o) => o.letter) ?? []
}

function initialState(
  questions: readonly DrillQuestion[],
  start: DrillStart | undefined,
  withGraded: boolean,
): CoreState {
  const index = Math.min(Math.max(0, start?.index ?? 0), Math.max(0, questions.length - 1))
  const results = start?.results ?? []
  const q = questions[index]
  const pick = withGraded ? start?.graded : undefined
  if (q && pick) {
    const correct = pick === q.answer
    return {
      index,
      phase: 'feedback',
      selected: pick,
      picked: pick,
      correct,
      eliminated: [],
      results: [...results, { qid: q.qid, pick, correct }],
    }
  }
  return {
    index,
    phase: 'question',
    selected: null,
    picked: null,
    correct: null,
    eliminated: [],
    results,
  }
}

/**
 * The drill's interaction state for any question shape. Owns the position
 * within `questions` (at least one, kept stable for the sitting); a real
 * controller mirrors the moves it hears (lock → record, next → advance).
 * Nothing here knows the bake-off's screens: r1Kit's useDrill maps the
 * moves onto the switcher.
 */
export function useDrillCore(options: DrillCoreOptions): {
  view: DrillCoreView
  act: DrillCoreActions
  refs: DrillCoreRefs
} {
  const { questions, explanations, live } = options
  const startRef = useRef(options.start)
  const elapsedStart = options.elapsed ?? 0
  const elapsedStartRef = useRef(elapsedStart)
  // The latest props for handlers that must not change identity.
  const questionsRef = useRef(questions)
  questionsRef.current = questions
  const controllerRef = useRef(options.controller ?? LOCAL_CONTROLLER)
  controllerRef.current = options.controller ?? LOCAL_CONTROLLER

  const [state, setState] = useState<CoreState>(() => initialState(questions, options.start, true))
  // The latest state for handlers that must decide synchronously (lock and
  // next report what they did).
  const stateRef = useRef(state)
  stateRef.current = state
  const [elapsed, setElapsed] = useState(elapsedStart)
  const [focusPara, setFocusPara] = useState<number | null>(null)
  const focusRef = useRef(focusPara)
  focusRef.current = focusPara
  const [flashPara, setFlashPara] = useState<number | null>(null)
  const [flashSource, setFlashSource] = useState<string | null>(null)
  const [openSteps, setOpenSteps] = useState<number[]>([])
  const paraEls = useRef(new Map<number, HTMLElement>())
  const stepEls = useRef(new Map<number, HTMLElement>())
  const flashTimer = useRef<number | undefined>(undefined)

  // The session clock: ticks while live and not finished.
  const ticking = live && state.phase !== 'done'
  useEffect(() => {
    if (!ticking) return
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [ticking])

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  const clearFlash = useCallback(() => {
    window.clearTimeout(flashTimer.current)
    setFlashPara(null)
    setFlashSource(null)
  }, [])

  const question = questions[state.index]
  const explanation = explanations[question.qid] ?? null
  const passage = question.passage ?? null
  const paragraphs = passage?.paragraphs ?? null
  const cites = useMemo(() => explanationCites(explanation, paragraphs), [explanation, paragraphs])

  const select = useCallback((letter: AnswerLetter) => {
    const c = stateRef.current
    const q = questionsRef.current[c.index]
    if (c.phase !== 'question' || !lettersOf(q).includes(letter)) return
    setState((s) =>
      s.phase === 'question'
        ? { ...s, selected: letter, eliminated: s.eliminated.filter((l) => l !== letter) }
        : s,
    )
    controllerRef.current.pick?.(q, letter)
  }, [])

  const lock = useCallback(() => {
    const c = stateRef.current
    if (c.phase !== 'question' || !c.selected) return false
    const q = questionsRef.current[c.index]
    const { correct } = controllerRef.current.lock(q, c.selected)
    const next: CoreState = {
      ...c,
      phase: 'feedback',
      picked: c.selected,
      correct,
      results: [...c.results, { qid: q.qid, pick: c.selected, correct }],
    }
    stateRef.current = next
    setState(next)
    setOpenSteps([])
    clearFlash()
    return true
  }, [clearFlash])

  const toggleEliminate = useCallback((letter: AnswerLetter) => {
    setState((c) => {
      if (c.phase !== 'question' || !lettersOf(questionsRef.current[c.index]).includes(letter)) {
        return c
      }
      const on = c.eliminated.includes(letter)
      return {
        ...c,
        eliminated: on ? c.eliminated.filter((l) => l !== letter) : [...c.eliminated, letter],
        selected: !on && c.selected === letter ? null : c.selected,
      }
    })
  }, [])

  const next = useCallback((): 'next' | 'done' | null => {
    const c = stateRef.current
    if (c.phase !== 'feedback') return null
    const more = c.index + 1 < questionsRef.current.length
    const following: CoreState = more
      ? {
          ...c,
          index: c.index + 1,
          phase: 'question',
          selected: null,
          picked: null,
          correct: null,
          eliminated: [],
        }
      : { ...c, phase: 'done' }
    stateRef.current = following
    setState(following)
    setOpenSteps([])
    setFocusPara(null)
    // A mark from this question's explanation must not hint at the next.
    clearFlash()
    controllerRef.current.next?.(more ? c.index + 1 : null)
    return more ? 'next' : 'done'
  }, [clearFlash])

  const exit = useCallback(() => controllerRef.current.exit?.(), [])

  const reset = useCallback(() => {
    const fresh = initialState(questionsRef.current, startRef.current, false)
    stateRef.current = fresh
    setState(fresh)
  }, [])

  const restart = useCallback(() => {
    reset()
    setElapsed(elapsedStartRef.current)
    setOpenSteps([])
  }, [reset])

  const gradeAs = useCallback((fallback?: (q: DrillQuestion) => AnswerLetter | undefined) => {
    setState((c) => {
      if (c.phase !== 'question') return c
      const q = questionsRef.current[c.index]
      const pick = c.selected ?? fallback?.(q) ?? q.options?.[0]?.letter
      if (!pick) return c
      const correct = pick === q.answer
      return {
        ...c,
        phase: 'feedback',
        selected: pick,
        picked: pick,
        correct,
        results: [...c.results, { qid: q.qid, pick, correct }],
      }
    })
  }, [])

  const reopen = useCallback(() => {
    setState((c) => {
      if (c.phase !== 'feedback') return c
      const q = questionsRef.current[c.index]
      return {
        ...c,
        phase: 'question',
        selected: null,
        picked: null,
        correct: null,
        eliminated: [],
        results: c.results.filter((r) => r.qid !== q.qid),
      }
    })
  }, [])

  const moveFocusPara = useCallback((delta: 1 | -1) => {
    const count = questionsRef.current[stateRef.current.index]?.passage?.paragraphs.length ?? 0
    if (!count) return
    const n = focusRef.current
    const nextN = n == null ? (delta > 0 ? 1 : count) : Math.min(count, Math.max(1, n + delta))
    setFocusPara(nextN)
    reveal(paraEls.current.get(nextN), 'center')
  }, [])

  const cite = useCallback((n: number, source?: string) => {
    // A frame later, so a phone sheet can fold away before the scroll.
    window.requestAnimationFrame(() => reveal(paraEls.current.get(n), 'center'))
    setFlashPara(n)
    setFlashSource(source ?? null)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => {
      setFlashPara(null)
      setFlashSource(null)
    }, 2400)
  }, [])

  const toggleStep = useCallback((n: number) => {
    setOpenSteps((open) => (open.includes(n) ? open.filter((x) => x !== n) : [...open, n]))
  }, [])

  const goToStep = useCallback((n: number) => {
    setOpenSteps((open) => (open.includes(n) ? open : [...open, n]))
    // Let the step expand before scrolling to it.
    window.requestAnimationFrame(() => reveal(stepEls.current.get(n), 'nearest'))
  }, [])

  const paraRef = useCallback(
    (n: number): RefCallback<HTMLElement> =>
      (el) => {
        if (el) paraEls.current.set(n, el)
        else paraEls.current.delete(n)
      },
    [],
  )
  const stepRef = useCallback(
    (n: number): RefCallback<HTMLElement> =>
      (el) => {
        if (el) stepEls.current.set(n, el)
        else stepEls.current.delete(n)
      },
    [],
  )

  const view: DrillCoreView = {
    index: state.index,
    total: questions.length,
    question,
    explanation,
    phase: state.phase,
    letters: lettersOf(question),
    selected: state.selected,
    picked: state.picked,
    correct: state.correct,
    eliminated: new Set(state.eliminated),
    results: state.results,
    elapsed,
    passage,
    focusPara,
    flashPara,
    flashSource,
    openSteps: new Set(openSteps),
    ...cites,
  }

  return {
    view,
    act: {
      select,
      lock,
      toggleEliminate,
      next,
      exit,
      setFocusPara,
      moveFocusPara,
      cite,
      toggleStep,
      goToStep,
      restart,
      gradeAs,
      reopen,
      reset,
    },
    refs: { para: paraRef, step: stepRef },
  }
}
