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
// facit, spread, colophon and the dialog primitive — and the drill-view
// seam, which the quant and DTK drills (FolioQuant.tsx) are built from.

import {
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
  Fragment,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefCallback,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
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
}

export const ORIGIN_IDAG: Origin = { label: 'Idag', idag: true }

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
    lang: question.passage?.lang ?? (section === 'ELF' ? 'en' : 'sv'),
  }
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
 *  "lucka N" for screen readers. Batch 3 adds the pencilled and graded
 *  states. */
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
            <span className="fo-gap">
              <span className="fo-sr">lucka {i + 1}</span>
            </span>
          ) : null}
        </Fragment>
      ))}
    </>
  )
}

// ── The reading drill (screens 2 and 3) ──────────────────────────────

export function FolioDrill(props: DirectionProps & { origin: Origin }) {
  const { data } = useDirectionData()
  // The core needs a question to stand on; an empty sitting is a page.
  if (data.drills.reading.questions.length === 0) {
    return <EmptyDrill label="LÄS" width={props.width} />
  }
  // One core per sitting: a sitting the host replaces opens at its own
  // start; an update of the same sitting keeps the reader's place.
  return <ReadingDrill key={data.drills.reading.id} {...props} />
}

function ReadingDrill({
  screen,
  width,
  live,
  onScreen,
  origin,
}: DirectionProps & { origin: Origin }) {
  const { data, actions } = useDirectionData()
  const session = data.drills.reading
  // Screen 3 opens the sitting's question already graded with the bake-off's
  // wrong pick (a display state: the controller is not called).
  const [start] = useState<DrillStart>(() => {
    const qid = session.questions[session.start.index ?? 0]?.qid
    return { ...session.start, graded: screen === 3 && qid ? session.wrongPick?.[qid] : undefined }
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
  const { view, refs } = core
  const phase = view.phase

  // Keep in step with the switcher: a click on "Facit" while a question is
  // open grades it with the fixture's wrong pick; "Läsfråga" while graded
  // reopens the same question, and after the last one starts over.
  // biome-ignore lint/correctness/useExhaustiveDependencies: follows the switcher's screen only
  useLayoutEffect(() => {
    if (screen === 3 && phase === 'question') gradeAs((q) => session.wrongPick?.[q.qid])
    else if (screen === 2 && phase === 'feedback') reopen()
    else if (screen === 2 && phase === 'done') reset()
  }, [screen])

  const lock = useCallback(() => {
    if (coreLock()) onScreen(3)
  }, [coreLock, onScreen])
  const next = useCallback(() => {
    if (coreNext() === 'next') onScreen(2)
  }, [coreNext, onScreen])
  // Avsluta: back where the reader came from. Round 1's move to Idag
  // stays when that is where they came from; the controller hears it.
  const exit = useCallback(() => {
    if (origin.idag) onScreen(1)
    coreExit()
  }, [origin.idag, onScreen, coreExit])
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
  }
  return width === 'phone' ? <PhoneDrill {...chrome} /> : <DeskDrill {...chrome} />
}

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
}

/** "Magasinet i Hökaryd: en handbok …" → the title and its subtitle. */
function passageTitle(view: DrillCoreView): [string, string | undefined] {
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
  // the first time, so a deep link lands there).
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on question/phase change only
  useEffect(() => {
    rectoRef.current?.scrollTo?.({ top: 0 })
    const verso = versoRef.current
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
    <span className="fo-label fo-runhead-title">
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
      <div className="fo-drill">
        <header className="fo-runhead fo-runhead--solo">
          {exit}
          {badge}
          <span />
        </header>
        <div className="fo-main fo-done">
          <ReadingColophon {...chrome} />
        </div>
      </div>
    )
  }

  const versoHead = (
    <header className="fo-runhead">
      {exit}
      {badge}
      <button
        type="button"
        className="fo-ghost"
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
    <header className="fo-runhead fo-runhead--recto">
      <span className="fo-runhead-pos">
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
    <div className="fo-drill">
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
            />
          </>
        }
        recto={
          <>
            {rectoHead}
            {/* The action follows the options in the flow; it sticks to the
             *  page foot only once the facit runs longer than the page. */}
            <div className="fo-recto-body">
              <QuestionColumn
                view={view}
                act={act}
                refs={refs}
                seam={seam}
                active={active}
                point={point}
              />
              <ActionBar view={view} act={act} seam={seam} />
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
        className="fo-ghost"
        onClick={onExit}
        aria-label="Avsluta"
        title="Dina svar är sparade"
        data-testid="rd-exit"
      >
        <X size={18} strokeWidth={1.5} aria-hidden />
        <span className="fo-exit-label" aria-hidden>
          Avsluta
        </span>
      </button>
    )
  }
  return (
    <button
      type="button"
      className="fo-ghost"
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
      className="fo-clock"
      onClick={toggle}
      aria-pressed={!shown}
      aria-label={shown ? `Tid ${fmtClock(seconds)}. Dölj klockan` : 'Visa klockan'}
      title={shown ? 'Dölj klockan – en tunn linje visar tiden' : 'Visa klockan'}
    >
      <Clock size={15} strokeWidth={1.5} aria-hidden className="fo-clock-icon" />
      {shown ? <span aria-hidden>{fmtClock(seconds)}</span> : null}
    </button>
  )
}

export function TimeLine({ seconds, pace }: { seconds: number; pace: number }) {
  return (
    <span className="fo-timeline" aria-hidden>
      <i style={{ width: `${Math.min(1, seconds / pace) * 100}%` }} />
    </span>
  )
}

const SPLIT_MIN = 0.4
const SPLIT_MAX = 0.68
const SPLIT_START = 0.56
/** The running head's height (folio.css .fo-runhead). */
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
      className="fo-spread"
      ref={spreadRef}
      style={{ '--fo-split': `${split * 100}%` } as CSSProperties}
    >
      <section className="fo-page fo-page--verso" ref={versoRef} aria-label={versoLabel}>
        {verso}
      </section>
      {/* biome-ignore lint/a11y/useSemanticElements: a focusable, valued separator is the WAI-ARIA splitter pattern; <hr> cannot take focus or a value */}
      <div
        className="fo-gutter"
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
        <span className="fo-gutter-grip" />
      </div>
      <section className="fo-page fo-page--recto" aria-label={rectoLabel} ref={rectoRef}>
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
}: Shared & Pointing & { seam: DrillSeam }) {
  if (view.phase === 'question') {
    return (
      <>
        {view.question.prompt ? (
          <h2 className="fo-prompt">
            <MathText>{view.question.prompt}</MathText>
          </h2>
        ) : null}
        <Options view={view} act={act} />
        <KeyHints letters={view.letters} focus />
      </>
    )
  }
  return (
    <>
      <Verdict view={view} after={view.correct == null ? null : seam.after(view.correct)} />
      {view.question.prompt ? (
        <p className="fo-prompt" data-after="true">
          <MathText>{view.question.prompt}</MathText>
        </p>
      ) : null}
      <GradedOptions view={view} />
      <Facit view={view} act={act} refs={refs} active={active} point={point} />
    </>
  )
}

/** The keys a drill answers to, set as a quiet line under the options. */
export function KeyHints({ letters, focus = false }: { letters: AnswerLetter[]; focus?: boolean }) {
  if (letters.length === 0) return null
  return (
    <p className="fo-keys">
      <span>
        <kbd className="fo-kbd">{letters[0]}</kbd>–
        <kbd className="fo-kbd">{letters[letters.length - 1]}</kbd> väljer
      </span>
      <span>
        <kbd className="fo-kbd">↵</kbd> svarar
      </span>
      <span>
        <kbd className="fo-kbd">⇧</kbd> + bokstav stryker
      </span>
      {focus ? (
        <span>
          <kbd className="fo-kbd">F</kbd> styckefokus
        </span>
      ) : null}
    </p>
  )
}

export function ActionBar({
  view,
  act,
  seam,
}: {
  view: DrillCoreView
  act: Pick<DrillAct, 'lock' | 'next'>
  seam: Pick<DrillSeam, 'unit' | 'next'>
}) {
  const last = view.index + 1 >= view.total
  if (view.phase === 'question') {
    return (
      <div className="fo-actionbar">
        <button
          type="button"
          className="fo-btn"
          disabled={!view.selected}
          onClick={act.lock}
          data-testid="rd-lock"
        >
          Svara
          <kbd className="fo-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
        <span className="fo-echo" aria-live="polite">
          {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
        </span>
      </div>
    )
  }
  return (
    <div className="fo-actionbar">
      {/* "Slutför", not "Avsluta": Avsluta is the way out mid-text. */}
      <button type="button" className="fo-btn" onClick={act.next} data-testid="rd-next">
        {last ? seam.next.last : seam.next.more}
        <kbd className="fo-kbd" aria-hidden>
          ↵
        </kbd>
      </button>
      <span className="fo-echo">
        {last ? seam.next.lastNote : `${seam.unit} ${view.index + 2} av ${view.total} väntar`}
      </span>
    </div>
  )
}

// ── The passage ──────────────────────────────────────────────────────

/** The quotations to underline: every step's, and — after a wrong answer —
 *  the ones that say why the chosen option is wrong. */
function shownMarks(view: DrillCoreView): QuoteMark[] {
  if (view.phase !== 'feedback') return []
  return view.marks.filter(
    (m) => m.source.startsWith('step-') || (!view.correct && m.source === `why-${view.picked}`),
  )
}

/** A paragraph's text with its marks, overlaps dropped (first wins). */
function marked(
  text: string,
  marks: QuoteMark[],
  view: DrillCoreView,
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
        className="fo-ev"
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

function PassageView({
  view,
  act,
  refs,
  note,
  setNote,
  active,
  badge = false,
  badgeText,
  noteText,
}: Shared & {
  note: boolean
  setNote: (open: boolean) => void
  active: string | null
  /** Phone: the badge stands above the passage (desktop: in the head). */
  badge?: boolean
  badgeText: string
  noteText: string
}) {
  const paragraphs = view.passage?.paragraphs ?? []
  const byline = view.passage?.byline ?? null
  const synthetic = view.question.passage?.synthetic ?? false
  const lang = view.question.passage?.lang ?? 'sv'
  const [title, subtitle] = passageTitle(view)
  const graded = view.phase === 'feedback'
  const marks = shownMarks(view)
  return (
    <article
      className="fo-passage"
      aria-labelledby="fo-ptitle"
      lang={lang === 'sv' ? undefined : lang}
    >
      {synthetic ? (
        <>
          <div className="fo-ptools">
            {badge ? (
              <span className="fo-badge" data-testid="rd-badge">
                {badgeText}
              </span>
            ) : null}
            <button
              type="button"
              className="fo-badge-toggle"
              data-testid="rd-note-toggle"
              aria-expanded={note}
              aria-controls="fo-note"
              onClick={() => setNote(!note)}
            >
              <Info size={14} strokeWidth={1.5} aria-hidden />
              {note ? 'Dölj noten' : 'Om texten'}
            </button>
          </div>
          <p className="fo-note" id="fo-note" hidden={!note} data-testid="rd-note">
            {noteText}
          </p>
        </>
      ) : null}
      <h1 className="fo-ptitle" id="fo-ptitle">
        {title || 'Texten'}
        {subtitle ? <span>{subtitle}</span> : null}
      </h1>
      <div
        className="fo-pbody"
        data-focus={String(view.focusPara != null)}
        data-testid="rd-passage"
      >
        {paragraphs.map((p, i) => {
          const n = i + 1
          const own = marks.filter((m) => m.para === n)
          // A ¶ link whose part quotes this paragraph marks the sentence;
          // otherwise the whole paragraph takes the mark.
          const sentence = own.some((m) => m.source === view.flashSource)
          return (
            <p
              key={n}
              ref={refs.para(n)}
              className="fo-para"
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
                className="fo-pnum"
                tabIndex={-1}
                aria-label={`Stycke ${n}${view.focusPara === n ? ', i fokus' : ''}`}
                aria-pressed={view.focusPara === n}
                onClick={() => act.setFocusPara(view.focusPara === n ? null : n)}
              >
                {n}
              </button>
              {own.length ? marked(p, own, view, active) : p}
            </p>
          )
        })}
        {byline ? <p className="fo-byline">{byline}</p> : null}
      </div>
    </article>
  )
}

// ── Options ──────────────────────────────────────────────────────────

/** An option's content: its text (math rendered), or its picture with the
 *  text as the name — the text stands in if the picture fails. A failure
 *  belongs to its source: a new source is tried afresh. */
function OptionContent({ o }: { o: DrillOption }) {
  const [failed, setFailed] = useState<string | null>(null)
  const figure = o.figure
  if (!figure || figure.src === failed) return <MathText>{o.text}</MathText>
  return (
    <img
      key={figure.src}
      className="fo-opt-img"
      src={`/${figure.src}`}
      alt={o.text}
      width={figure.width}
      height={figure.height}
      onError={() => setFailed(figure.src)}
    />
  )
}

/** The options before the answer: choose with the letter, strike with the
 *  quiet control at the row's end (always in view). `testId` names the
 *  option buttons (rd-option-<L>, or rd-quant-option-<L>). */
export function Options({
  view,
  act,
  testId = 'rd-option',
}: {
  view: DrillCoreView
  act: Pick<DrillAct, 'select' | 'toggleEliminate'>
  testId?: string
}) {
  return (
    <ol className="fo-opts" aria-label="Svarsalternativ">
      {(view.question.options ?? []).map((o) => {
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="fo-opt"
            data-state={selected ? 'selected' : out ? 'eliminated' : undefined}
            data-image={o.figure ? 'true' : undefined}
          >
            <button
              type="button"
              className="fo-opt-main"
              data-testid={`${testId}-${o.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(o.letter)}
            >
              <span className="fo-letter" aria-hidden>
                {o.letter}
              </span>
              <span className="fo-opt-text">
                <span className="fo-sr">
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:{' '}
                </span>
                <OptionContent o={o} />
              </span>
            </button>
            <button
              type="button"
              className="fo-opt-x"
              data-testid={`rd-eliminate-${o.letter}`}
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
  return (
    <>
      <ol className="fo-opts" aria-label="Svarsalternativ, rättade">
        {shown.map((o) => {
          const right = o.letter === key
          const mine = o.letter === view.picked
          return (
            <li
              key={o.letter}
              className="fo-opt"
              data-grade={right ? 'right' : mine ? 'wrong' : 'other'}
              data-image={o.figure ? 'true' : undefined}
            >
              <div className="fo-opt-main">
                <span className="fo-letter" aria-hidden>
                  {o.letter}
                </span>
                <span className="fo-opt-text">
                  <span className="fo-sr">Alternativ {o.letter}: </span>
                  <OptionContent o={o} />
                  {right || mine ? (
                    <span className="fo-opt-tag">
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
          className="fo-more fo-more-opts"
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
      className="fo-verdict"
      id="fo-verdict"
      data-correct={String(correct)}
      data-testid="rd-verdict"
      ref={focusRef}
      tabIndex={focusRef ? -1 : undefined}
    >
      <span className="fo-verdict-glyph" aria-hidden>
        {correct ? <Check size={18} strokeWidth={2.25} /> : <X size={18} strokeWidth={2.25} />}
      </span>
      <span>
        <b>{correct ? 'Rätt.' : 'Fel.'}</b>{' '}
        {correct ? `Svaret är ${view.question.answer}.` : `Rätt svar är ${view.question.answer}.`}
        {after ? <span className="fo-verdict-after">{after}</span> : null}
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
  const { data } = useDirectionData()
  const e = view.explanation
  if (!e) {
    return (
      <div className="fo-facit">
        <p className="fo-empty fo-fsec">Förklaring saknas ännu för den här frågan.</p>
      </div>
    )
  }
  const q = view.question
  const optionText = (letter: string) => q.options?.find((o) => o.letter === letter)?.text ?? ''
  const mine = view.correct ? null : e.distractors.find((d) => d.letter === view.picked)
  const others = e.distractors.filter((d) => d.letter !== mine?.letter)
  const framework = entryName(e.framework_id, data.frameworks)
  const steps = e.steps ?? []
  const hover = (source: string) => ({
    onMouseEnter: () => point(source),
    onMouseLeave: () => point(null),
    onFocus: () => point(source),
    onBlur: () => point(null),
  })
  return (
    <div className="fo-facit">
      {mine ? (
        <section
          className="fo-fsec fo-fsec--lure"
          data-testid={`rd-distractor-${mine.letter}`}
          {...hover(`why-${mine.letter}`)}
        >
          {/* Two siblings, so one heading style for both. */}
          <h3 className="fo-h3">Därför lockade {mine.letter}</h3>
          <p className="fo-prose">
            <Rich text={mine.why_tempting} act={act} />
          </p>
          <Cites
            list={view.distractorCites[mine.letter]?.tempting ?? []}
            source={`why-${mine.letter}`}
            act={act}
          />
          <h3 className="fo-h3 fo-h3--next">Varför {mine.letter} är fel</h3>
          <p className="fo-prose">
            <Rich text={mine.why_wrong} act={act} />
          </p>
          <Cites
            list={view.distractorCites[mine.letter]?.wrong ?? []}
            source={`why-${mine.letter}`}
            act={act}
          />
        </section>
      ) : null}

      <section className="fo-fsec fo-notes">
        <h3 className="fo-h3">Att ta med dig</h3>
        {e.pitfall ? (
          <div className="fo-note-item" data-testid="rd-pitfall">
            <span className="fo-sub">Fallgropen</span>
            <p className="fo-prose">
              <MathText>{e.pitfall}</MathText>
            </p>
          </div>
        ) : null}
        <div className="fo-note-item" data-testid="rd-technique">
          <span className="fo-sub">Tekniken</span>
          <p className="fo-prose">
            <MathText>{e.technique}</MathText>
          </p>
        </div>
      </section>

      <section className="fo-fsec">
        <h3 className="fo-h3">Lösningen</h3>
        <p className="fo-prose">
          <MathText>{e.solution_path}</MathText>
        </p>
      </section>

      {steps.length ? (
        <section className="fo-fsec">
          <h3 className="fo-h3">Steg för steg</h3>
          <ol>
            {steps.map((s) => (
              <Step key={s.n} step={s} view={view} act={act} refs={refs} hover={hover} />
            ))}
          </ol>
        </section>
      ) : null}

      {others.length ? (
        <section className="fo-fsec">
          <h3 className="fo-h3">{mine ? 'De andra alternativen' : 'Alternativen'}</h3>
          {others.map((d) => (
            <Distractor
              key={d.letter}
              d={d}
              text={optionText(d.letter)}
              cites={view.distractorCites[d.letter] ?? { tempting: [], wrong: [] }}
              act={act}
              active={active}
            />
          ))}
        </section>
      ) : null}

      {framework ? (
        <p className="fo-framework">
          Ramverk: <b>{framework}</b> · finns att slå upp i Uppslag
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
}: {
  step: ExplanationStep
  view: Pick<FacitView, 'openSteps' | 'stepCites'>
  act: FacitAct
  refs: Pick<DrillCoreRefs, 'step'>
  hover: (source: string) => Record<string, () => void>
}) {
  const detail = step.tier === 'detail'
  const open = !detail || view.openSteps.has(step.n)
  const source = `step-${step.n}`
  return (
    <li
      className="fo-step"
      data-tier={step.tier ?? 'essential'}
      data-testid={`rd-step-${step.n}`}
      ref={refs.step(step.n)}
      {...hover(source)}
    >
      <span className="fo-step-n" aria-hidden>
        {step.n}
      </span>
      <div>
        <div className="fo-step-head">
          <h4 className="fo-step-title">
            <span className="fo-sr">Steg {step.n}: </span>
            {step.title}
          </h4>
          <Cites list={view.stepCites[step.n] ?? []} source={source} act={act} />
        </div>
        {open ? (
          <p className="fo-step-text">
            <Rich text={step.text} act={act} />
          </p>
        ) : null}
        {detail ? (
          <button
            type="button"
            className="fo-more"
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
}: {
  d: DistractorExplanation
  text: string
  cites: { tempting: number[]; wrong: number[] }
  act: FacitAct
  active: string | null
}) {
  const [open, setOpen] = useState(false)
  const bodyId = `fo-dis-${d.letter}`
  return (
    <article
      className="fo-dis"
      data-testid={`rd-distractor-${d.letter}`}
      data-active={String(active === `why-${d.letter}`)}
    >
      <div className="fo-dis-head">
        <span className="fo-letter" aria-hidden>
          {d.letter}
        </span>
        <div>
          <p className="fo-dis-opt">
            <span className="fo-sr">Alternativ {d.letter}: </span>
            <MathText>{text}</MathText>
          </p>
          <button
            type="button"
            className="fo-more"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Dölj' : 'Varför det lockar – och varför det är fel'}
            <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
      {open ? (
        <div className="fo-dis-body" id={bodyId}>
          <span className="fo-sub">Varför det lockar</span>
          <p className="fo-prose">
            <Rich text={d.why_tempting} act={act} />
          </p>
          <Cites list={cites.tempting} source={`why-${d.letter}`} act={act} />
          <span className="fo-sub">Varför det är fel</span>
          <p className="fo-prose">
            <Rich text={d.why_wrong} act={act} />
          </p>
          <Cites list={cites.wrong} source={`why-${d.letter}`} act={act} />
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
    <span className="fo-cites">
      <span className="fo-cites-see" aria-hidden>
        Se
      </span>
      {list.map((n) => (
        <button
          key={n}
          type="button"
          className="fo-cite"
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
            className="fo-stepref"
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
}: {
  title: string
  subtitle?: string
  facts: string
  lines: ReactNode
  next?: { label: string; onClick: () => void }
  back: { label: string; onClick: () => void }
  extra?: ReactNode
}) {
  return (
    <div className="fo-colophon" data-testid="rd-done">
      <div className="fo-colophon-text">
        <span className="fo-colophon-mark" aria-hidden>
          ⁂
        </span>
        <h2>
          {title}
          {subtitle ? <span>{subtitle}</span> : null}
        </h2>
        <p className="fo-colophon-facts">{facts}</p>
        <p>{lines}</p>
      </div>
      {extra}
      {/* The day goes on: the plan's next part is the one action. */}
      <div className="fo-colophon-actions">
        {next ? (
          <button
            type="button"
            className="fo-btn"
            onClick={next.onClick}
            data-testid="rd-done-next"
          >
            {next.label}
            <kbd className="fo-kbd" aria-hidden>
              ↵
            </kbd>
          </button>
        ) : null}
        <button type="button" className="fo-more fo-colophon-home" onClick={back.onClick}>
          {back.label}
        </button>
      </div>
    </div>
  )
}

function ReadingColophon({ view, act, origin, onNext, nextLabel, dateLabel }: DrillChrome) {
  const [title, subtitle] = passageTitle(view)
  const right = view.results.filter((r) => r.correct).length
  const misses = view.total - right
  return (
    <Colophon
      title={title || 'Texten'}
      subtitle={subtitle}
      facts={`${view.total} frågor · ${right} rätt · ${Math.max(1, Math.round(view.elapsed / 60))} min`}
      lines={`Läst och besvarad ${dateLabel.toLowerCase()}. ${
        misses > 0
          ? `${misses === 1 ? 'Missen väntar' : 'Missarna väntar'} i nästa repetition, de äldsta först.`
          : 'Inga missar att repetera.'
      }`}
      next={onNext && nextLabel ? { label: nextLabel, onClick: onNext } : undefined}
      back={{ label: `Till ${origin.label}`, onClick: act.exit }}
    />
  )
}

/** A sitting without questions: a blank page that says so, and the way
 *  back (spec §1.7 "Empty"). */
export function EmptyDrill({ label, width }: { label: string; width: DirectionProps['width'] }) {
  const { actions } = useDirectionData()
  return (
    <div className={width === 'phone' ? 'fo-pdrill' : 'fo-drill'}>
      <header className="fo-runhead fo-runhead--solo">
        <ExitButton onExit={() => actions.drill.exit?.()} />
        <span className="fo-label fo-runhead-title">{label}</span>
        <span />
      </header>
      <div className="fo-main fo-done">
        <div className="fo-colophon">
          <h2>Inga frågor att öva på just nu.</h2>
          <p>När det finns frågor klara för övningen öppnas de här.</p>
          <div className="fo-colophon-actions">
            <button type="button" className="fo-btn" onClick={() => actions.go('ova')}>
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
 * The focus-trap primitive Folio's modal views stand on (Förstora today,
 * batch 2's slips next): a dialog that takes focus when it opens (an
 * element marked data-autofocus, else itself), keeps Tab inside, closes on
 * Esc and gives focus back to whatever had it before. It sits inside the
 * direction's root, so it covers the stage — not the browser window; the
 * caller makes the page under it inert.
 */
export function FolioDialog({
  label,
  onClose,
  className,
  children,
}: {
  label: string
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
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

function PhoneDrill(chrome: DrillChrome) {
  const { view, act, refs, seam, note, setNote, focusOn, toggleFocus, clocked } = chrome
  const { state: sheet, setState: setSheet, toggle, grab } = useSheet(view)
  const { hidden: compact, onScroll: onHeadScroll } = useHideOnScroll()
  const synthetic = view.question.passage?.synthetic ?? false
  // The passage's own badge has scrolled away: the sheet carries it.
  const [badgeGone, setBadgeGone] = useState(false)
  const onScroll = (e: { currentTarget: HTMLElement }) => {
    onHeadScroll(e)
    setBadgeGone(e.currentTarget.scrollTop > 120)
  }

  // A ¶ link folds the sheet to its peek so the cited paragraph shows.
  const cite = (n: number, source?: string) => {
    setSheet('peek')
    act.cite(n, source)
  }
  const sheetAct: DrillAct = { ...act, cite }

  if (view.phase === 'done') {
    return (
      <div className="fo-pdrill">
        <div className="fo-pdrill-scroll fo-done">
          <ReadingColophon {...chrome} />
        </div>
      </div>
    )
  }

  const progress = ((view.index + (view.phase === 'feedback' ? 1 : 0)) / view.total) * 100
  const feedback = view.phase === 'feedback'
  const count = view.question.options?.length ?? 0
  return (
    <div className="fo-pdrill">
      <header className="fo-pdrill-head" data-compact={String(compact)}>
        <ExitButton onExit={act.exit} compact />
        {/* Progress once here — the line along the head's foot; the slip
         *  names the question. */}
        <span />
        <div className="fo-head-right">
          <button
            type="button"
            className="fo-ghost fo-focus-btn"
            aria-pressed={focusOn}
            aria-label="Styckefokus"
            onClick={toggleFocus}
          >
            <Pilcrow size={16} strokeWidth={1.5} aria-hidden />
            <span aria-hidden>Fokus</span>
          </button>
          {clocked ? (
            <span className="fo-clock" role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
              <Clock size={14} strokeWidth={1.5} aria-hidden className="fo-clock-icon" />
              <span aria-hidden>{fmtClock(view.elapsed)}</span>
            </span>
          ) : null}
        </div>
        <span className="fo-head-progress" aria-hidden>
          <i style={{ width: `${progress}%` }} />
        </span>
      </header>
      {/* Under the full-height feedback sheet the passage is out of reach:
       *  inert, so focus never lands on something covered. */}
      <div className="fo-pdrill-scroll" onScroll={onScroll} inert={sheet === 'full'}>
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
        />
        <div style={{ height: sheet === 'peek' ? 260 : 120 }} aria-hidden />
      </div>
      <section
        className="fo-sheet"
        data-state={sheet}
        data-testid="rd-sheet"
        aria-label={`${seam.unit} ${view.index + 1}`}
      >
        {/* The grab is for thumbs and pointers: the keyboard has the same
         *  moves as labelled buttons (the peek's action, "Visa texten"),
         *  so it stays out of the tab order. */}
        <button
          type="button"
          className="fo-sheet-grab"
          tabIndex={-1}
          aria-label={sheet === 'peek' ? 'Visa frågan' : 'Visa texten'}
          aria-expanded={sheet !== 'peek'}
          {...grab}
        />
        <div className="fo-sheet-head">
          <span className="fo-label">
            {seam.unit} {view.index + 1} av {view.total}
            {synthetic && (badgeGone || feedback) ? (
              <span className="fo-sheet-badge"> · {chrome.badge}</span>
            ) : null}
          </span>
          {/* The way back to the text, where the eye looks for it. */}
          {sheet === 'peek' ? null : (
            <button
              type="button"
              className="fo-more fo-sheet-back"
              onClick={() => setSheet('peek')}
            >
              Visa texten
              <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </div>
        <div className="fo-sheet-body">
          {sheet === 'peek' ? (
            <>
              {feedback ? <Verdict view={view} as="p" /> : null}
              {feedback || !view.question.prompt ? null : (
                <h2 className="fo-prompt">
                  <MathText>{view.question.prompt}</MathText>
                </h2>
              )}
              {/* The peek's one action: the screen's filled button. */}
              <button type="button" className="fo-btn fo-peek-btn" onClick={toggle}>
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
              />
              {view.question.prompt ? (
                <p className="fo-prompt" data-after="true">
                  <MathText>{view.question.prompt}</MathText>
                </p>
              ) : null}
              <GradedOptions view={view} />
              <Facit view={view} act={sheetAct} refs={refs} active={null} point={() => {}} />
            </>
          ) : (
            <>
              {view.question.prompt ? (
                <h2 className="fo-prompt">
                  <MathText>{view.question.prompt}</MathText>
                </h2>
              ) : null}
              <Options view={view} act={act} />
            </>
          )}
        </div>
        {sheet === 'peek' ? null : <ActionBar view={view} act={act} seam={seam} />}
      </section>
    </div>
  )
}
