// Spår · Läsfråga and Facit — one model on every screen. The passage sits
// in a single centred column; its tinted head folds into a 52 px title
// strip once the reader scrolls. The question lives in a tray docked to the
// bottom edge at the column's width: folded to the question and a "Visa
// alternativen" row by default, opened (≤45 % of the height) to the four
// options. Answering raises the tray into a feedback sheet over a little
// more than half the page, so the passage stays in view above it; a ¶ chip
// drops the sheet to below half and centres the cited paragraph there.
//
// Feedback reads in the order all four directions share: verdict and the
// two answer cards → why your pick tempted and why it is wrong → "Att ta
// med dig" (pitfall, technique) → the solution → its steps → the other
// options. Colour fills belong to the two answer cards alone. The top
// bar's progress is a path: a right answer fills its segment, a miss is
// "lagd i Repetera" — never a loss. Nothing moves inside the column.
//
// Kit v2: the session, its copy and the day's plan come from
// useDirectionData(); the drill's state is useDrillCore, graded by the
// host's controller and kept in step with the bake-off's Läsfråga ⇄ Facit.
// The pieces every question screen shares (top bar, stops, options,
// verdict, the explanation, the end of a round) are exported for
// Kvantfråga and DTK (SparQuant).

import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  Clock,
  Flag,
  Focus,
  Info,
  RotateCcw,
  Route,
  TriangleAlert,
  Undo2,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type DrillCoreRefs,
  type DrillCoreView,
  type DrillStart,
  type QuoteSpan,
  splitStepRefs,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import {
  type DirectionProps,
  fmtClock,
  useHideOnScroll,
  useKeyMap,
  useSheet,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DrillOption,
  DrillQuestion,
  DrillSessionView,
  PlanItemView,
} from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import type { DistractorExplanation, ExplanationStep } from '@/data/explanations'
import type { AnswerLetter } from '@/data/questions'
import { CalmSwitch, cap, inWords, Kbd, SECTION_NAMES, SparStop, secOf } from './sparParts'

export type Calm = { calm: boolean; setCalm: (calm: boolean) => void }

/** A drill's moves as its screens use them: the core's, with lock, next
 *  and exit already mapped onto the host. */
export type DrillAct = {
  select: (letter: AnswerLetter) => void
  lock: () => void
  next: () => void
  exit: () => void
  toggleEliminate: (letter: AnswerLetter) => void
  setFocusPara: (n: number | null) => void
  moveFocusPara: (delta: 1 | -1) => void
  cite: (n: number, source?: string) => void
  toggleStep: (n: number) => void
  goToStep: (n: number) => void
}

type Shared = { view: DrillCoreView; act: DrillAct; refs: DrillCoreRefs; ready?: boolean }
type Note = {
  note: boolean
  setNote: (open: boolean) => void
  /** The band's ÖVNINGSTEXT badge, watched so the tray or sheet can carry
   *  it once the passage head is out of view — one badge on screen. */
  badgeRef: RefObject<HTMLSpanElement | null>
  bandRef?: RefObject<HTMLElement | null>
}

/** The plan step a finished round leads on to: the first still open. */
export function nextPlanStep(items: readonly PlanItemView[]): PlanItemView | undefined {
  return items.find((i) => !i.completed)
}

/** What ended: a text (round 1's LÄS unit, the day's first stop when a
 *  resume leads Idag), a drill, or a repetition. */
export type RoundKind = 'text' | 'drill' | 'repetition'

/**
 * Where a finished round leads, for the end's green pill and for Enter
 * alike: the plan's first open step, where a repetition that was a plan
 * step is done with this round (`doneStep`). Without a `next`, both take
 * the way back.
 */
export function roundEnd(
  items: readonly PlanItemView[],
  kind: RoundKind,
): { doneStep?: PlanItemView; next?: PlanItemView } {
  const doneStep = kind === 'repetition' ? items.find((i) => i.kind === 'repetition') : undefined
  return { doneStep, next: nextPlanStep(items.filter((i) => i !== doneStep)) }
}

/** The drill clock is optional in the kit (no real source): it counts up
 *  from a sitting's own seconds, or from zero on a sitting that starts
 *  fresh — never from zero on one already under way. */
export function showsClock(session: DrillSessionView): boolean {
  const fresh = (session.start.index ?? 0) === 0 && (session.start.results ?? []).length === 0
  return session.elapsedSeconds != null || fresh
}

/** A unit's "Title: subtitle" as its two parts. */
function splitTitle(q: DrillQuestion): [string, string | null] {
  const title = q.passage?.title
  if (!title) return [SECTION_NAMES[q.section] ?? q.section, q.source.label || null]
  const cut = title.indexOf(': ')
  return cut === -1 ? [title, null] : [title.slice(0, cut), title.slice(cut + 2)]
}

/** Whether an element is on screen (clipped by its scrollers). True where
 *  IntersectionObserver is missing, so nothing is hidden by accident. */
function useSeen(ref: RefObject<HTMLElement | null>): boolean {
  const [seen, setSeen] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return seen
}

/** The first paragraph the essential steps cite — where the evidence is. */
function evidencePara(view: DrillCoreView): number | undefined {
  for (const s of view.explanation?.steps ?? []) {
    const cites = view.stepCites[s.n]
    if (s.tier !== 'detail' && cites?.length) return cites[0]
  }
  return view.cited[0]
}

/**
 * On a verdict the passage turns to its evidence, so the text left in view
 * above the sheet is the part the explanation is about — instantly the
 * first time (a deep link lands there), smoothly after an answer.
 */
function useTurnToEvidence(
  view: DrillCoreView,
  scrollRef: RefObject<HTMLDivElement | null>,
  offset: number,
  before?: () => void,
) {
  const first = useRef(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies: turn on a new verdict only
  useEffect(() => {
    const wasFirst = first.current
    first.current = false
    if (view.phase !== 'feedback') return
    const box = scrollRef.current
    const n = evidencePara(view)
    const el = n ? box?.querySelector<HTMLElement>(`[data-n="${n}"]`) : null
    if (!box || !el || typeof box.scrollTo !== 'function') return
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    before?.()
    box.scrollTo({
      top: Math.max(0, top - offset),
      behavior: wasFirst || reduce ? 'auto' : 'smooth',
    })
  }, [view.phase, view.index])
}

/** The paragraph nearest the top of a scroller's view — where focus mode
 *  starts, so switching it on never jumps the text. */
function firstVisiblePara(box: HTMLElement | null): number {
  if (!box) return 1
  const top = box.getBoundingClientRect().top + 72
  for (const el of box.querySelectorAll<HTMLElement>('[data-n]')) {
    if (el.getBoundingClientRect().bottom > top) return Number(el.dataset.n)
  }
  return 1
}

// ── The reading drill (screens 2 and 3) ──────────────────────────────

export function SparDrill(props: DirectionProps & Calm) {
  const { data, actions } = useDirectionData()
  const session = props.screen === 14 ? data.drills.elf : data.drills.reading
  if (session.questions.length === 0) {
    return (
      <NoQuestions
        width={props.width}
        text="Det finns ingen text att läsa just nu."
        onExit={() => {
          actions.drill.exit?.()
          props.onScreen(1)
        }}
        action={{ label: 'Till Öva', onClick: () => actions.go('ova') }}
      />
    )
  }
  // The core reads start only on mount and requires a stable deck. A changed
  // identity/order (including a shrinking provider deck) starts a fresh core.
  return (
    <ReadingSession
      key={JSON.stringify([session.id, session.questions.map((q) => q.qid)])}
      {...props}
      session={session}
    />
  )
}

function ReadingSession({
  screen,
  width,
  live,
  onScreen,
  calm,
  setCalm,
  session,
}: DirectionProps & Calm & { session: DrillSessionView }) {
  const { data, actions } = useDirectionData()
  const elf = screen === 14
  // Screen 3 opens the question already graded with the fixture's pick.
  const [start] = useState<DrillStart>(() => {
    const at = Math.min(Math.max(0, session.start.index ?? 0), session.questions.length - 1)
    const qid = session.questions[at].qid
    return {
      ...session.start,
      graded: screen === 3 ? (session.wrongPick?.[qid] ?? session.start.graded) : undefined,
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
  const { refs } = core
  const view = englishCitations(core.view)
  const media = useReadingMedia(view.question)
  const readable = (view.passage?.paragraphs.length ?? 0) > 0
  const short = elf && view.passage?.paragraphs.length === 1
  const moved = useRef(false)
  const c = core.act
  const { gradeAs, reopen, reset } = c
  // Keep in step with the switcher: a click on "Facit" while a question is
  // open grades it with the fixture's wrong pick; "Läsfråga" while graded
  // reopens the same question, and after the last one starts over. Only
  // display moves: the controller is never called for them.
  // biome-ignore lint/correctness/useExhaustiveDependencies: follows the switcher's screen only
  useLayoutEffect(() => {
    if (screen === 3 && view.phase === 'question') gradeAs((q) => session.wrongPick?.[q.qid])
    else if (screen === 2 && view.phase === 'feedback') reopen()
    else if (screen === 2 && view.phase === 'done') reset()
  }, [screen])

  const [note, setNote] = useState(false)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Desktop: the tray folds to its question; the feedback sheet stands tall.
  const [tray, setTray] = useState<'peek' | 'open'>(short ? 'open' : 'peek')
  const [fsheet, setFsheet] = useState<'tall' | 'half'>('tall')
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seat on a new question or verdict only
  useEffect(() => {
    setTray(short ? 'open' : 'peek')
    setFsheet('tall')
  }, [view.index, view.phase])
  // Only a real answer/next action moves focus, never a switcher preview.
  // biome-ignore lint/correctness/useExhaustiveDependencies: follows real phase/question changes
  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    const root = scrollRef.current?.closest('.sp-drill, .sp-pdrill')
    const el = root?.querySelector<HTMLElement>(
      view.phase === 'feedback' ? '.sp-verdict-word' : '.sp-prompt',
    )
    el?.setAttribute('tabindex', '-1')
    el?.focus({ preventScroll: true })
  }, [view.index, view.phase])

  // Choosing an option opens the tray, so the choice is always in view.
  const coreSelect = c.select
  const select = useCallback(
    (letter: AnswerLetter) => {
      coreSelect(letter)
      setTray('open')
    },
    [coreSelect],
  )
  const act: DrillAct = {
    select,
    lock: () => {
      if (!readable || !media.canAnswer()) return
      if (c.lock()) {
        moved.current = true
        if (!elf) onScreen(3)
      }
    },
    next: () => {
      const result = c.next()
      if (result) moved.current = true
      if (result === 'next' && !elf) onScreen(2)
    },
    exit: () => {
      c.exit()
      if (!elf) onScreen(1)
    },
    toggleEliminate: c.toggleEliminate,
    setFocusPara: c.setFocusPara,
    moveFocusPara: c.moveFocusPara,
    cite: c.cite,
    toggleStep: c.toggleStep,
    goToStep: c.goToStep,
  }

  const focusOn = view.focusPara != null
  const toggleFocus = () => c.setFocusPara(focusOn ? null : firstVisiblePara(scrollRef.current))
  const { next: nextStep } = roundEnd(data.home.plan.items, 'text')
  const back = elf
    ? session.request.kind === 'framework'
      ? {
          label: 'Tillbaka till mönstret',
          onClick: () => {
            if (session.request.kind === 'framework')
              actions.openLesson(session.request.frameworkId)
          },
        }
      : { label: 'Till Öva', onClick: () => actions.go('ova') }
    : { label: 'Till Idag', onClick: () => onScreen(1) }
  const onward = () => (nextStep ? actions.openPlanItem(nextStep.id) : back.onClick())
  const advance = () => {
    if (view.phase === 'question') act.lock()
    else if (view.phase === 'feedback') act.next()
    else onward()
  }

  const keys: Record<string, () => void> = {
    Enter: advance,
    j: () => c.moveFocusPara(1),
    k: () => c.moveFocusPara(-1),
    f: toggleFocus,
    Escape: () => c.setFocusPara(null),
  }
  if (gapNumber(view.question) != null) keys.g = () => citeGap(view, c.cite)
  // Space advances too, once there is something to advance — until then
  // it keeps scrolling the passage.
  if (view.phase === 'feedback' || (view.phase === 'question' && view.selected)) {
    keys[' '] = advance
  }
  if (width === 'desktop') {
    keys.t = () =>
      view.phase === 'feedback'
        ? setFsheet((s) => (s === 'tall' ? 'half' : 'tall'))
        : setTray((s) => (s === 'open' ? 'peek' : 'open'))
  }
  for (const l of view.letters) {
    const key = l.toLowerCase()
    keys[key] = () => select(l)
    keys[`Shift+${key}`] = () => c.toggleEliminate(l)
  }
  useKeyMap(keys, live && readable)

  const shared = { view, act, refs, ready: media.ready }
  const clock = showsClock(session)
  const [title] = splitTitle(view.question)
  const done = (
    <Done view={view} questions={session.questions} kind="text" title={title} back={back} />
  )
  const body = !readable ? (
    <NoQuestions
      width={width}
      text="Texten saknas just nu. Välj en ny övning i Öva."
      onExit={act.exit}
      action={{ label: 'Till Öva', onClick: () => actions.go('ova') }}
    />
  ) : width === 'phone' ? (
    <PhoneDrill
      {...shared}
      questions={session.questions}
      clock={clock}
      note={note}
      setNote={setNote}
      badgeRef={badgeRef}
      scrollRef={scrollRef}
      focusOn={focusOn}
      toggleFocus={toggleFocus}
      done={done}
      short={short}
      live={live}
    />
  ) : (
    <div className="sp-drill">
      <TopBar
        onExit={act.exit}
        mid={
          <>
            <span
              className="sp-sec-chip"
              data-sec={view.question.section}
              title={SECTION_NAMES[view.question.section]}
            >
              {view.question.section}
            </span>
            <Progress view={view} questions={session.questions} label="Frågorna i texten" />
            <span className="sp-top-count">
              Fråga {Math.min(view.index + 1, view.total)} av {view.total}
            </span>
          </>
        }
        right={
          <>
            <CalmSwitch calm={calm} setCalm={setCalm} compact testid="sp-calm-drill" />
            <button
              type="button"
              className="sp-btn sp-btn--quiet"
              aria-pressed={focusOn}
              onClick={toggleFocus}
              title="Styckefokus: F slår på, J och K byter stycke"
            >
              <Focus size={18} strokeWidth={2} aria-hidden />
              Fokus
            </button>
            {clock ? <Timer seconds={view.elapsed} /> : null}
          </>
        }
      />
      {view.phase === 'done' ? (
        <div className="sp-body sp-body--done">{done}</div>
      ) : (
        <DeskBody
          {...shared}
          short={short}
          note={note}
          setNote={setNote}
          badgeRef={badgeRef}
          scrollRef={scrollRef}
          tray={tray}
          setTray={setTray}
          fsheet={fsheet}
          setFsheet={setFsheet}
        />
      )}
    </div>
  )
  return (
    <ReadingContext.Provider
      value={{ view, questions: session.questions, report: media.report, calm }}
    >
      {body}
    </ReadingContext.Provider>
  )
}

type ImageReceipt = { element: HTMLImageElement | null; src: string; ready: boolean }
type ImageReporter = (slot: string, receipt: ImageReceipt) => void
const ReadingContext = createContext<{
  view: DrillCoreView
  questions: readonly DrillQuestion[]
  report: ImageReporter
  calm: boolean
} | null>(null)

function useReadingMedia(question: DrillQuestion) {
  const [receipts, setReceipts] = useState<Record<string, ImageReceipt>>({})
  const report: ImageReporter = useCallback((slot, receipt) => {
    setReceipts((old) => {
      const was = old[slot]
      if (
        was?.element === receipt.element &&
        was?.src === receipt.src &&
        was?.ready === receipt.ready
      )
        return old
      return { ...old, [slot]: receipt }
    })
  }, [])
  const required = [
    ...(question.figure ? [{ slot: 'question', src: question.figure.src }] : []),
    ...(question.options ?? []).flatMap((o) =>
      o.figure ? [{ slot: `option-${o.letter}`, src: o.figure.src }] : [],
    ),
  ]
  const canAnswer = () =>
    !!question.options?.length &&
    required.every(({ slot, src }) => {
      const receipt = receipts[slot]
      return receipt?.src === src && receipt.ready && receipt.element?.isConnected
    })
  return { report, canAnswer, ready: canAnswer() }
}

/** Readiness is a receipt from this mounted inline image, never its URL alone. */
function ReadingImage({
  slot,
  figure,
}: {
  slot: string
  figure: NonNullable<DrillOption['figure']>
}) {
  const context = useContext(ReadingContext)
  const report = context?.report
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [attempt, setAttempt] = useState(0)
  const image = useRef<HTMLImageElement | null>(null)
  const src = figure.src
  const attach = useCallback(
    (element: HTMLImageElement | null) => {
      image.current = element
      const ready = !!element?.complete && element.naturalWidth > 0
      if (element) setState(ready ? 'ready' : 'loading')
      report?.(slot, { element, src, ready })
    },
    [report, slot, src],
  )
  return (
    <span className="sp-reading-image">
      <img
        key={attempt}
        ref={attach}
        src={src.startsWith('/') ? src : `/${src}`}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        onLoad={(e) => {
          setState('ready')
          report?.(slot, { element: e.currentTarget, src, ready: true })
        }}
        onError={(e) => {
          setState('failed')
          report?.(slot, { element: e.currentTarget, src, ready: false })
        }}
      />
      {state === 'failed' ? (
        <span className="sp-image-error" role="alert" lang="sv">
          Bilden gick inte att ladda.
          {/* The retry lives beside the image; option callers render this outside their answer button. */}
          <button
            type="button"
            className="sp-link"
            onClick={() => {
              report?.(slot, { element: image.current, src, ready: false })
              setState('loading')
              setAttempt((n) => n + 1)
            }}
          >
            Försök igen
          </button>
        </span>
      ) : state === 'loading' ? (
        <span className="sp-sr" lang="sv">
          Bilden laddas. Vänta med att svara.
        </span>
      ) : null}
    </span>
  )
}

function gapNumber(q: DrillQuestion): number | null {
  if (q.section !== 'ELF') return null
  const n = q.prompt?.match(/^(?:Gap|Lucka)\s*\(?(\d+)\)?$/iu)?.[1]
  if (n) return Number(n)
  if (!q.prompt?.trim() && q.passage?.paragraphs.some((p) => p.includes(`___(${q.number})___`)))
    return q.number
  return null
}

function citeGap(view: DrillCoreView, cite: DrillAct['cite']) {
  const n = gapNumber(view.question)
  const index = view.passage?.paragraphs.findIndex((p) => p.includes(`___(${n})___`)) ?? -1
  if (index >= 0) cite(index + 1)
}

function gapSentence(q: DrillQuestion): string | null {
  const n = gapNumber(q)
  if (n == null) return null
  const token = `___(${n})___`
  const paragraph = q.passage?.paragraphs.find((p) => p.includes(token))
  if (!paragraph) return null
  const at = paragraph.indexOf(token)
  const before = paragraph.slice(0, at)
  const left = Math.max(
    before.lastIndexOf('. '),
    before.lastIndexOf('? '),
    before.lastIndexOf('! '),
  )
  const after = paragraph.slice(at + token.length)
  const right = after.search(/[.!?](?:\s|$)/u)
  return paragraph
    .slice(left < 0 ? 0 : left + 2, right < 0 ? undefined : at + token.length + right + 1)
    .trim()
}

function samePassage(a: DrillQuestion, b: DrillQuestion) {
  return a.passage?.unitId && b.passage?.unitId
    ? a.passage.unitId === b.passage.unitId
    : a.passage?.paragraphs.join('\n') === b.passage?.paragraphs.join('\n')
}

function SparGap({ n }: { n: number }) {
  const context = useContext(ReadingContext)
  if (!context) return <>___({n})___</>
  const { view, questions } = context
  const q = questions.find((item) => samePassage(item, view.question) && gapNumber(item) === n)
  const current = q?.qid === view.question.qid
  const result = view.results.find((r) => r.qid === q?.qid)
  const selected = current ? view.selected : null
  const answer = q?.options?.find((o) => o.letter === (result ? q.answer : selected))?.text
  const word = answer
  const state = result ? (result.correct ? 'right' : 'miss') : current ? 'now' : 'todo'
  const picked = q?.options?.find((o) => o.letter === result?.pick)?.text
  return (
    <span
      className="sp-gapslot"
      data-state={state}
      data-preview={String(!!selected && !result)}
      lang="sv"
    >
      {(q?.options ?? []).map((o) => (
        <span key={o.letter} className="sp-gap-measure" aria-hidden lang="en">
          {o.text}
        </span>
      ))}
      <span aria-hidden className="sp-gap-visible">
        <SparStop size={24} state={state} label={n} />
        <span lang="en">{word ?? '······'}</span>
      </span>
      <span className="sp-sr">
        Lucka {n}
        {result ? ': ' : selected ? ', ditt val: ' : current ? ', aktuell' : ', inte besvarad än'}
        {word ? <span lang="en">{word}</span> : null}
        {result ? (
          result.correct ? (
            ', rätt'
          ) : (
            <>
              , ditt svar var <span lang="en">{picked}</span>, lagd i Repetera
            </>
          )
        ) : null}
      </span>
    </span>
  )
}

function GapText({
  text,
  marks = [],
  replacement,
}: {
  text: string
  marks?: QuoteSpan[]
  replacement?: { n: number; word: string }
}) {
  const out: ReactNode[] = []
  let at = 0
  for (const match of text.matchAll(/___\((\d+)\)___/gu)) {
    const start = match.index ?? 0
    if (start > at)
      out.push(
        <ParaText
          key={`text-${at}`}
          text={text.slice(at, start)}
          marks={marks
            .filter((m) => m.start >= at && m.end <= start)
            .map((m) => ({ ...m, start: m.start - at, end: m.end - at }))}
        />,
      )
    const n = Number(match[1])
    out.push(
      replacement?.n === n ? (
        <strong key={`gap-${start}`} lang="en">
          {replacement.word}
        </strong>
      ) : (
        <SparGap key={`gap-${start}`} n={n} />
      ),
    )
    at = start + match[0].length
  }
  if (at < text.length)
    out.push(
      <ParaText
        key={`text-${at}`}
        text={text.slice(at)}
        marks={marks
          .filter((m) => m.start >= at)
          .map((m) => ({ ...m, start: m.start - at, end: m.end - at }))}
      />,
    )
  return <>{out}</>
}

function ReadingPrompt({ view, act }: Pick<Shared, 'view' | 'act'>) {
  const n = gapNumber(view.question)
  const sentence = gapSentence(view.question)
  if (n == null)
    return (
      <h2 className="sp-prompt" lang={view.question.section === 'ELF' ? 'en' : undefined}>
        <MathText>{view.question.prompt}</MathText>
      </h2>
    )
  return (
    <div className="sp-gap-prompt">
      <div className="sp-gap-label">
        <h2 className="sp-eyebrow">Lucka {n}</h2>
        <button type="button" className="sp-link" onClick={() => citeGap(view, act.cite)}>
          Visa i texten <Kbd>G</Kbd>
        </button>
      </div>
      {sentence ? (
        <p className="sp-prompt" lang="en">
          <GapText text={sentence} />
        </p>
      ) : (
        <p className="sp-prompt">Lucka {n}</p>
      )}
    </div>
  )
}

function ReadingTactic({ view }: { view: DrillCoreView }) {
  const context = useContext(ReadingContext)
  const hint = view.explanation?.pregrade_tactic
  if (context?.calm || !hint) return null
  return (
    <details className="sp-reading-tactic" key={view.question.qid}>
      <summary>Taktik</summary>
      <p lang={view.question.section === 'ELF' ? 'en' : undefined}>
        <b>{hint.handle}</b> · <MathText>{hint.move}</MathText>
      </p>
    </details>
  )
}

/** Extend the shared citations locally: English quotes/ordinals, and
 *  gap-containing quotations. Never rewrite the displayed English text. */
function englishCitations(view: DrillCoreView): DrillCoreView {
  if (view.question.section !== 'ELF' || !view.passage || !view.explanation) return view
  const paragraphs = view.passage.paragraphs
  const ordinals = [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
  ]
  const normal = (text: string) =>
    text
      .toLowerCase()
      .replace(/___(?:\(\d+\))?___|___/gu, ' ')
      .replace(/[“”"‘’]/gu, '')
      .replace(/\s+/gu, ' ')
      .trim()
  const cite = (text: string, source: string) => {
    const nums = new Set<number>()
    const marks: DrillCoreView['marks'] = []
    for (const m of text.matchAll(
      /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)\s+paragraph\b/giu,
    ))
      nums.add(ordinals.indexOf(m[1].toLowerCase()) + 1)
    for (const m of text.matchAll(/\bparagraph\s+(\d+)\b/giu)) nums.add(Number(m[1]))
    for (const m of text.matchAll(/[“"]([^”"]+)[”"]/gu)) {
      const quote = m[1]
      if (quote.length < 8) continue
      paragraphs.forEach((p, i) => {
        if (!normal(p).includes(normal(quote))) return
        nums.add(i + 1)
        const start = p.toLowerCase().indexOf(quote.toLowerCase())
        if (start >= 0) marks.push({ para: i + 1, start, end: start + quote.length, source })
      })
    }
    return { list: [...nums].filter((n) => n > 0 && n <= paragraphs.length), marks }
  }
  const steps = { ...view.stepCites }
  const distractors = { ...view.distractorCites }
  const marks = [...view.marks]
  const cited = new Set(view.cited)
  for (const step of view.explanation.steps ?? []) {
    const extra = cite(step.text, `step-${step.n}`)
    steps[step.n] = [...new Set([...(steps[step.n] ?? []), ...extra.list])].sort((a, b) => a - b)
    for (const n of extra.list) cited.add(n)
    marks.push(...extra.marks)
  }
  for (const d of view.explanation.distractors) {
    const tempting = cite(d.why_tempting, `tempting-${d.letter}`)
    const wrong = cite(d.why_wrong, `why-${d.letter}`)
    distractors[d.letter] = {
      tempting: [...new Set([...(distractors[d.letter]?.tempting ?? []), ...tempting.list])],
      wrong: [...new Set([...(distractors[d.letter]?.wrong ?? []), ...wrong.list])],
    }
    for (const n of [...tempting.list, ...wrong.list]) cited.add(n)
    marks.push(...wrong.marks)
  }
  return {
    ...view,
    stepCites: steps,
    distractorCites: distractors,
    marks,
    cited: [...cited].sort((a, b) => a - b),
  }
}

/** A drill with nothing to play: say so, keep the way out, and offer the
 *  one step that still works as the green pill. */
export function NoQuestions({
  width,
  text,
  onExit,
  action,
}: {
  width: DirectionProps['width']
  text: string
  onExit: () => void
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="sp-drill" data-width-mode={width}>
      <header className="sp-top">
        <div className="sp-top-left">
          <button
            type="button"
            className="sp-btn sp-btn--quiet"
            data-testid="rd-exit"
            onClick={onExit}
          >
            <X size={18} strokeWidth={2.25} aria-hidden />
            Avsluta
          </button>
        </div>
      </header>
      <div className="sp-body sp-body--done">
        <section className="sp-done" aria-labelledby="sp-none-h">
          <h1 className="sp-display" id="sp-none-h">
            Inga frågor här
          </h1>
          <p className="sp-lede">{text}</p>
          {action ? (
            <div className="sp-done-actions">
              <button
                type="button"
                className="sp-btn sp-btn--primary sp-btn--lg"
                onClick={action.onClick}
              >
                {action.label}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

// ── Top bar ──────────────────────────────────────────────────────────

/** The focus frame's bar: the always-visible way out at the left, the
 *  section, the path and the count in the middle, the tools at the right. */
export function TopBar({
  onExit,
  mid,
  right,
}: {
  onExit: () => void
  mid: ReactNode
  right: ReactNode
}) {
  return (
    <header className="sp-top">
      <div className="sp-top-left">
        <button
          type="button"
          className="sp-btn sp-btn--quiet"
          data-testid="rd-exit"
          onClick={onExit}
          title="Dina svar är sparade"
        >
          <X size={18} strokeWidth={2.25} aria-hidden />
          Avsluta
        </button>
      </div>
      <div className="sp-top-mid">{mid}</div>
      <div className="sp-top-right">{right}</div>
    </header>
  )
}

/**
 * The sitting's questions as a short path: answered stops fill, the current
 * one is ringed in ink, a miss shows the repeat glyph. A round across
 * sections rings each open stop in its section's hue; a DTK round groups
 * its stops by the page they share.
 */
export function Progress({
  view,
  questions,
  label,
  compact = false,
  ring = false,
  pages,
}: {
  view: DrillCoreView
  questions: readonly DrillQuestion[]
  label: string
  compact?: boolean
  ring?: boolean
  /** The page each question is on (0-based), for a DTK round. */
  pages?: readonly number[]
}) {
  const stop = (q: DrillQuestion, i: number) => {
    const r = view.results.find((x) => x.qid === q.qid)
    const current = i === view.index && view.phase === 'question'
    const state = current ? 'now' : r ? (r.correct ? 'right' : 'miss') : 'todo'
    const word = current ? 'pågår' : r ? (r.correct ? 'rätt' : 'lagd i Repetera') : 'kvar'
    return (
      <li key={q.qid} data-state={state}>
        <SparStop
          state={state}
          size={compact ? 24 : 32}
          sec={ring && state === 'todo' ? q.section : undefined}
          label={i + 1}
        />
        <span className="sp-sr">
          Fråga {i + 1}: {word}
        </span>
      </li>
    )
  }
  if (!pages) {
    return (
      <ol className="sp-prog" data-compact={String(compact)} aria-label={label}>
        {questions.map(stop)}
      </ol>
    )
  }
  const groups: number[][] = []
  questions.forEach((_, i) => {
    const last = groups[groups.length - 1]
    if (last && pages[last[0]] === pages[i]) last.push(i)
    else groups.push([i])
  })
  return (
    <ol className="sp-prog-pages" data-compact={String(compact)} aria-label={label}>
      {groups.map((g, gi) => (
        <li key={questions[g[0]].qid} className="sp-prog-page">
          <ol className="sp-prog" data-compact={String(compact)}>
            {g.map((i) => stop(questions[i], i))}
          </ol>
          {compact ? null : (
            <span className="sp-prog-label" aria-hidden>
              sida {gi + 1}
            </span>
          )}
          <span className="sp-sr">Sida {gi + 1}</span>
        </li>
      ))}
    </ol>
  )
}

export function Timer({ seconds, compact = false }: { seconds: number; compact?: boolean }) {
  return (
    <span
      className="sp-timer"
      data-compact={String(compact)}
      role="timer"
      aria-label={`Tid ${fmtClock(seconds)}`}
    >
      {compact ? null : <Clock size={16} strokeWidth={2} aria-hidden />}
      <span aria-hidden>{fmtClock(seconds)}</span>
    </span>
  )
}

// ── Desktop body: column, strip, tray / sheet ────────────────────────

/** The feedback sheet's two heights, as a share of the body. */
export const SHEET_PCT = { tall: 58, half: 40 } as const
/** The tray and sheet round their top corners over the column. */
export const CORNER = 28

function DeskBody({
  view,
  act,
  refs,
  short,
  note,
  setNote,
  badgeRef,
  scrollRef,
  tray,
  setTray,
  fsheet,
  setFsheet,
  ready,
}: Shared &
  Note & {
    short: boolean
    scrollRef: RefObject<HTMLDivElement | null>
    tray: 'peek' | 'open'
    setTray: (s: 'peek' | 'open') => void
    fsheet: 'tall' | 'half'
    setFsheet: (s: 'tall' | 'half') => void
  }) {
  const { data } = useDirectionData()
  const bandRef = useRef<HTMLElement>(null)
  // Below the 52 px title strip, with a little air.
  useTurnToEvidence(view, scrollRef, 76)
  const [condensed, setCondensed] = useState(false)
  const onScroll = (e: { currentTarget: HTMLElement }) => {
    const band = bandRef.current
    const fold = band ? band.offsetHeight - 52 : 120
    setCondensed(e.currentTarget.scrollTop > fold)
  }

  // The column ends where the tray begins (it scrolls on behind the tray's
  // rounded corners only): the tray is measured, the sheet's height is set.
  const dockRef = useRef<HTMLElement>(null)
  const [dockH, setDockH] = useState(0)
  // Short texts and their tray share one flow, so the tray cannot cover
  // the end of the passage, even with larger type or the note expanded.
  const follow = short && view.phase === 'question'
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the tray changes shape
  useLayoutEffect(() => {
    const el = dockRef.current
    if (!el || view.phase !== 'question' || follow) return
    const measure = () => setDockH(el.offsetHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [view.phase, view.index, tray, follow])
  const bottom = follow
    ? '0px'
    : view.phase === 'feedback'
      ? `calc(${SHEET_PCT[fsheet]}% - ${CORNER}px)`
      : `${Math.max(0, dockH - CORNER)}px`

  // A ¶ chip drops the sheet to below half and centres its paragraph above.
  const cite = (n: number, source?: string) => {
    setFsheet('half')
    act.cite(n, source)
  }

  const bandSeen = useSeen(badgeRef)
  const synthetic = view.question.passage?.synthetic === true
  const dockBadge = synthetic && (condensed || !bandSeen)
  const [title, subtitle] = splitTitle(view.question)
  const last = view.index + 1 >= view.total
  const questionTray =
    view.phase === 'question' ? (
      <Tray
        view={view}
        act={act}
        state={tray}
        setState={setTray}
        dockRef={dockRef}
        badge={dockBadge}
        ready={ready}
      />
    ) : null

  return (
    <div className="sp-body" data-phase={view.phase}>
      <div className="sp-scroll" ref={scrollRef} onScroll={onScroll} style={{ bottom }}>
        <Reader
          view={view}
          act={act}
          refs={refs}
          note={note}
          setNote={setNote}
          badgeRef={badgeRef}
          bandRef={bandRef}
        />
        <div aria-hidden style={{ height: follow ? 16 : CORNER + 32 }} />
        {follow ? questionTray : null}
      </div>
      <div
        className="sp-strip"
        data-sec={view.question.section}
        data-shown={String(condensed)}
        aria-hidden
      >
        <span className="sp-strip-title">{title}</span>
        {subtitle ? <span className="sp-strip-sub">{subtitle}</span> : null}
      </div>
      {!follow ? questionTray : null}
      {view.phase === 'feedback' ? (
        <FeedbackSheet
          view={view}
          act={act}
          state={fsheet}
          setState={setFsheet}
          nextLabel={last ? 'Klart med texten' : 'Nästa fråga'}
          aside={
            synthetic ? (
              <span
                className="sp-badge-chip sp-badge-chip--sm"
                data-hidden={String(!dockBadge)}
                aria-hidden={!dockBadge}
              >
                {data.copy.ovningstextBadge}
              </span>
            ) : null
          }
        >
          <FeedbackBody view={view} act={{ ...act, cite }} refs={refs} />
        </FeedbackSheet>
      ) : null}
    </div>
  )
}

// ── The reading column ───────────────────────────────────────────────

function Reader({ view, act, refs, note, setNote, badgeRef, bandRef }: Shared & Note) {
  const { data } = useDirectionData()
  const paragraphs = view.passage?.paragraphs ?? []
  const byline = view.passage?.byline ?? null
  const meta = view.question.passage
  const synthetic = meta?.synthetic === true
  const [title, subtitle] = splitTitle(view.question)
  const graded = view.phase === 'feedback'
  const marks = view.flashSource ? view.marks.filter((m) => m.source === view.flashSource) : []
  return (
    <article className="sp-reader" data-sec={view.question.section} aria-labelledby="sp-title">
      <header className="sp-band" ref={bandRef}>
        {synthetic ? (
          <div className="sp-band-row">
            <span className="sp-badge-chip" data-testid="rd-badge" ref={badgeRef}>
              {data.copy.ovningstextBadge}
            </span>
            <button
              type="button"
              className="sp-band-toggle"
              data-testid="rd-note-toggle"
              aria-expanded={note}
              aria-controls="sp-note"
              onClick={() => setNote(!note)}
            >
              <Info size={16} strokeWidth={2} aria-hidden />
              {note ? 'Dölj' : 'Om texten'}
            </button>
          </div>
        ) : null}
        <h1 className="sp-title" id="sp-title" lang={meta?.lang}>
          {title}
        </h1>
        {subtitle ? (
          <p className="sp-subtitle" lang={meta?.lang}>
            {subtitle}
          </p>
        ) : null}
        {synthetic ? (
          <p className="sp-note" id="sp-note" data-testid="rd-note" hidden={!note}>
            {data.copy.ovningstextNote}
          </p>
        ) : null}
      </header>
      <div
        className="sp-passage"
        data-testid={view.question.section === 'ELF' ? 'rd-elf-passage' : 'rd-passage'}
        data-focus={String(view.focusPara != null)}
        lang={meta?.lang === 'en' ? 'en' : undefined}
      >
        {paragraphs.map((p, i) => {
          const n = i + 1
          return (
            <p
              key={n}
              ref={refs.para(n)}
              className="sp-para"
              data-n={n}
              data-testid={`rd-para-${n}`}
              data-cited={String(graded && view.cited.includes(n))}
              data-flash={String(view.flashPara === n)}
              data-focused={String(view.focusPara === n)}
            >
              {/* Out of the tab order: nine of these must not stand between
               *  the reader and the tray; F, J and K drive the same aid. */}
              <button
                type="button"
                className="sp-pnum"
                tabIndex={-1}
                aria-label={`Stycke ${n}${view.focusPara === n ? ', i fokus' : ''}`}
                aria-pressed={view.focusPara === n}
                lang="sv"
                onClick={() => act.setFocusPara(view.focusPara === n ? null : n)}
              >
                {view.question.section === 'ELF' ? `¶${n}` : n}
              </button>
              {view.question.section === 'ELF' ? (
                <GapText text={p} marks={marks.filter((m) => m.para === n)} />
              ) : (
                <ParaText text={p} marks={marks.filter((m) => m.para === n)} />
              )}
            </p>
          )
        })}
        {byline ? <p className="sp-byline">{byline}</p> : null}
      </div>
      {view.question.figure ? (
        <div className="sp-reading-figure">
          <ReadingImage
            key={view.question.figure.src}
            slot="question"
            figure={view.question.figure}
          />
        </div>
      ) : null}
    </article>
  )
}

/** A paragraph's text, verbatim, with the quotations a cited part makes
 *  marked in the one highlight style. */
export function ParaText({ text, marks }: { text: string; marks: QuoteSpan[] }) {
  if (marks.length === 0) return <>{text}</>
  const out: ReactNode[] = []
  let at = 0
  for (const m of [...marks].sort((a, b) => a.start - b.start)) {
    if (m.start < at) continue
    if (m.start > at) out.push(text.slice(at, m.start))
    out.push(
      <mark key={m.start} className="sp-quote">
        {text.slice(m.start, m.end)}
      </mark>,
    )
    at = m.end
  }
  if (at < text.length) out.push(text.slice(at))
  return <>{out}</>
}

// ── The question tray (desktop) ──────────────────────────────────────

function Tray({
  view,
  act,
  state,
  setState,
  dockRef,
  badge,
  ready = true,
}: Pick<Shared, 'view' | 'act' | 'ready'> & {
  state: 'peek' | 'open'
  setState: (s: 'peek' | 'open') => void
  dockRef: RefObject<HTMLElement | null>
  /** Carry ÖVNINGSTEXT here: the passage's own badge is out of view. */
  badge: boolean
}) {
  const { data } = useDirectionData()
  const open = state === 'open'
  return (
    <section
      className="sp-tray"
      data-state={state}
      ref={dockRef}
      aria-label={`Fråga ${view.index + 1}`}
    >
      <div className="sp-tray-head">
        <ReadingPrompt view={view} act={act} />
        {view.question.passage?.synthetic ? (
          <span
            className="sp-badge-chip sp-badge-chip--sm"
            data-hidden={String(!badge)}
            aria-hidden={!badge}
          >
            {data.copy.ovningstextBadge}
          </span>
        ) : null}
        {open ? (
          <button
            type="button"
            className="sp-icon-btn sp-icon-btn--soft"
            aria-expanded
            aria-controls="sp-tray-body"
            aria-label="Dölj alternativen"
            title="Dölj alternativen (T)"
            onClick={() => setState('peek')}
          >
            <ChevronDown size={22} strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}
      </div>
      {open ? null : (
        <button
          type="button"
          className="sp-show"
          aria-expanded={false}
          aria-controls="sp-tray-body"
          onClick={() => setState('open')}
        >
          Visa alternativen ({view.letters.length})
          <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
          <Kbd>T</Kbd>
        </button>
      )}
      <div className="sp-tray-body" id="sp-tray-body" hidden={!open}>
        {view.letters.length === 0 ? <p>Alternativen saknas för den här frågan.</p> : null}
        <ReadingTactic view={view} />
        <Options view={view} act={act} layout={readingOptionsLayout(view.question)} />
        <div className="sp-tray-foot">
          <p className="sp-keys">
            <span>
              <Kbd>T</Kbd> döljer frågan
            </span>
            <span>
              <Kbd>F</Kbd> fokus
            </span>
            <span>
              <Kbd>J</Kbd>/<Kbd>K</Kbd> stycke
            </span>
          </p>
          <span className="sp-echo" aria-live="polite">
            {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
          </span>
          <button
            type="button"
            className="sp-btn sp-btn--primary"
            data-testid="rd-lock"
            disabled={!view.selected || !ready}
            onClick={act.lock}
          >
            Svara
            <Kbd>↵</Kbd>
          </button>
        </div>
      </div>
    </section>
  )
}

export type OptionsLayout = 'column' | 'row' | 'grid' | 'images'

function readingOptionsLayout(q: DrillQuestion): OptionsLayout {
  return q.section === 'ELF' && (q.options ?? []).every((o) => o.text.length <= 14)
    ? 'row'
    : 'column'
}
/**
 * The options: a letter blob that morphs into a tilted ink squircle when
 * chosen, the text (math rendered), and a strike button. `content` gives
 * an option its own body (KVA's relation, NOG's statement glyph, a chart
 * tile); the accessible name is always the words. A running Provpass
 * passes its own question, answer and strikes (no drill core there).
 */
export function Options({
  view,
  act,
  testid = 'rd-option',
  layout = 'column',
  content,
  disabled = false,
}: {
  view: Pick<DrillCoreView, 'question' | 'selected' | 'eliminated'>
  act: Pick<DrillAct, 'select' | 'toggleEliminate'>
  testid?: 'rd-option' | 'rd-quant-option'
  layout?: OptionsLayout
  content?: (o: DrillOption) => ReactNode
  disabled?: boolean
}) {
  const reading = useContext(ReadingContext)
  return (
    <ol className="sp-opts" data-layout={layout} aria-label="Svarsalternativ">
      {(view.question.options ?? []).map((o) => {
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="sp-opt"
            data-state={selected ? 'selected' : out ? 'out' : undefined}
          >
            {reading && o.figure ? (
              <ReadingImage key={o.figure.src} slot={`option-${o.letter}`} figure={o.figure} />
            ) : null}
            <button
              type="button"
              className="sp-opt-main"
              data-testid={`${testid}-${o.letter}`}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => act.select(o.letter)}
            >
              <span className="sp-blob" aria-hidden>
                {o.letter}
              </span>
              <span className="sp-opt-text">
                <span className="sp-sr">
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:
                </span>{' '}
                <span lang={view.question.section === 'ELF' ? 'en' : undefined}>
                  {content ? content(o) : <MathText>{o.text}</MathText>}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="sp-opt-x"
              data-testid={`rd-eliminate-${o.letter}`}
              aria-pressed={out}
              aria-label={out ? `Ångra strykningen av ${o.letter}` : `Stryk ${o.letter}`}
              title={out ? 'Ångra' : 'Stryk alternativet (⇧ + bokstav)'}
              disabled={disabled}
              onClick={() => act.toggleEliminate(o.letter)}
            >
              {out ? (
                <Undo2 size={17} strokeWidth={2} aria-hidden />
              ) : (
                <CircleSlash size={17} strokeWidth={2} aria-hidden />
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// ── The feedback sheet (desktop) ─────────────────────────────────────

/** Facit as a sheet beside the column, never modal: its own grab, the
 *  verdict in its head (plus `aside`), the explanation, and the one green
 *  "Nästa" in its foot, away from the answer cards. */
export function FeedbackSheet({
  view,
  state,
  setState,
  nextLabel,
  aside,
  act,
  children,
  repetition = false,
  above = 'texten',
}: Pick<Shared, 'view' | 'act'> & {
  state: 'tall' | 'half'
  setState: (s: 'tall' | 'half') => void
  nextLabel: string
  aside?: ReactNode
  children: ReactNode
  repetition?: boolean
  /** What the sheet leaves in view above it: "texten", "uppgiften", "sidan". */
  above?: string
}) {
  const tall = state === 'tall'
  const reveal = tall ? `Visa mer av ${above}` : 'Visa mer av facit'
  const bodyRef = useRef<HTMLDivElement>(null)
  // A verdict starts at the top of its explanation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on a new verdict only
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 })
  }, [view.index])
  const toggle = () => setState(tall ? 'half' : 'tall')
  return (
    <section
      className="sp-fsheet"
      data-state={state}
      style={{ height: `${SHEET_PCT[state]}%` }}
      aria-labelledby="sp-verdict"
    >
      <button
        type="button"
        className="sp-grab"
        aria-label={reveal}
        title="T växlar"
        onClick={toggle}
      />
      <div className="sp-fsheet-head">
        <Verdict view={view} repetition={repetition} />
        {aside}
      </div>
      <div className="sp-fsheet-body" ref={bodyRef}>
        {children}
      </div>
      <div className="sp-fsheet-foot">
        <button type="button" className="sp-btn sp-btn--quiet" onClick={toggle}>
          {tall ? (
            <ChevronDown size={18} strokeWidth={2.25} aria-hidden />
          ) : (
            <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
          )}
          {reveal}
          <Kbd>T</Kbd>
        </button>
        <button
          type="button"
          className="sp-btn sp-btn--primary sp-btn--lg"
          data-testid="rd-next"
          onClick={act.next}
        >
          {nextLabel}
          <Kbd>↵</Kbd>
        </button>
      </div>
    </section>
  )
}

export function Verdict({
  view,
  compact = false,
  repetition = false,
}: {
  view: DrillCoreView
  compact?: boolean
  repetition?: boolean
}) {
  const correct = view.correct === true
  return (
    <div
      className="sp-verdict"
      data-testid="rd-verdict"
      data-correct={String(correct)}
      data-compact={String(compact)}
    >
      <span className="sp-verdict-glyph" aria-hidden>
        {correct ? (
          <Check size={compact ? 20 : 28} strokeWidth={3} />
        ) : (
          <X size={compact ? 20 : 28} strokeWidth={3} />
        )}
      </span>
      <div className="sp-verdict-text">
        <h2 className="sp-verdict-word" id="sp-verdict" tabIndex={-1}>
          {correct ? 'Rätt!' : 'Fel'}
        </h2>
        <p className="sp-verdict-sub">
          {correct ? `Svaret är ${view.question.answer}.` : `Rätt svar är ${view.question.answer}.`}
        </p>
      </div>
      {compact ? null : <VerdictChip view={view} repetition={repetition} />}
    </div>
  )
}

/** The real, visible change: a right answer fills its stop in the top
 *  bar's path; a miss goes to Repetera — never framed as a loss. In a
 *  repetition the chip names the schedule instead: a right answer moves
 *  the miss forward, a wrong one brings it back in a while. */
export function VerdictChip({
  view,
  repetition = false,
}: {
  view: DrillCoreView
  repetition?: boolean
}) {
  const correct = view.correct === true
  const label = repetition
    ? correct
      ? 'Den flyttas fram'
      : 'Tillbaka om en stund'
    : correct
      ? `${view.results.length} av ${view.total} klara`
      : 'Lagd i Repetera'
  return (
    <span className="sp-verdict-chip" data-correct={String(correct)}>
      {correct ? (
        <Check size={15} strokeWidth={2.75} aria-hidden />
      ) : (
        <RotateCcw size={15} strokeWidth={2.5} aria-hidden />
      )}
      {label}
    </span>
  )
}

/**
 * The explanation in the order every direction shares. `prompt` is the
 * question as the sheet repeats it; `optionText` an option's words as the
 * answer cards show them (KVA's relation, NOG's statements). Without an
 * explanation the verdict and the cards stand alone.
 */
export function FeedbackBody({
  view,
  act,
  refs,
  chip = false,
  prompt,
  optionText,
  repetition = false,
}: Shared & {
  chip?: boolean
  prompt?: ReactNode
  optionText?: (letter: string) => ReactNode
  repetition?: boolean
}) {
  const { data, actions } = useDirectionData()
  const e = view.explanation
  const q = view.question
  const en = q.section === 'ELF' ? 'en' : undefined
  const sentence = gapSentence(q)
  const gap = gapNumber(q)
  const raw = (l: string) => q.options?.find((o) => o.letter === l)?.text ?? ''
  const text =
    optionText ??
    ((l: string) => (
      <span lang={en}>
        {sentence && gap != null ? (
          <GapText text={sentence} replacement={{ n: gap, word: raw(l) }} />
        ) : (
          <MathText>{raw(l)}</MathText>
        )}
      </span>
    ))
  const recap = (
    <div className="sp-recap">
      {view.picked && view.picked !== q.answer ? (
        <Recap kind="mine" letter={view.picked} text={text(view.picked)} />
      ) : null}
      <Recap kind="right" letter={q.answer} text={text(q.answer)} mine={view.picked === q.answer} />
    </div>
  )
  const head = (
    <>
      {chip ? <VerdictChip view={view} repetition={repetition} /> : null}
      <p className="sp-fb-q" lang={en}>
        {prompt ?? (sentence ? <GapText text={sentence} /> : <MathText>{q.prompt}</MathText>)}
      </p>
      {recap}
    </>
  )
  if (!e) {
    return (
      <div className="sp-fb">
        {head}
        <p className="sp-fb-missing">Förklaring saknas ännu för den här frågan.</p>
      </div>
    )
  }
  const picked = e.distractors.find((d) => d.letter === view.picked)
  const others = e.distractors.filter((d) => d.letter !== view.picked)
  const frameworkId = e.framework_id
  const framework = frameworkId ? data.frameworks[frameworkId] : undefined
  const cites = (l: string) => view.distractorCites[l] ?? { tempting: [], wrong: [] }
  const steps = e.steps ?? []
  return (
    <div className="sp-fb">
      {head}

      {picked ? (
        <section
          className="sp-lure"
          data-testid={`rd-distractor-${picked.letter}`}
          aria-labelledby="sp-lure-h"
        >
          <h3 className="sp-h4" id="sp-lure-h">
            Varför {picked.letter} lockade
          </h3>
          <p className="sp-fb-p" lang={en}>
            <Rich text={picked.why_tempting} act={act} />
            <Cites list={cites(picked.letter).tempting} act={act} />
          </p>
          <h3 className="sp-h4">Varför {picked.letter} är fel</h3>
          <p className="sp-fb-p" lang={en}>
            <Rich text={picked.why_wrong} act={act} />
            <Cites list={cites(picked.letter).wrong} act={act} source={`why-${picked.letter}`} />
          </p>
        </section>
      ) : null}

      <section className="sp-fsec" aria-labelledby="sp-take-h">
        <h3 className="sp-h3" id="sp-take-h">
          Att ta med dig
        </h3>
        <div className="sp-take">
          {e.pitfall ? (
            <div className="sp-take-item" data-kind="pit" data-testid="rd-pitfall">
              <h4 className="sp-take-h">
                <TriangleAlert size={17} strokeWidth={2.25} aria-hidden />
                Fallgrop
              </h4>
              <p className="sp-fb-p" lang={en}>
                <MathText>{e.pitfall}</MathText>
              </p>
            </div>
          ) : null}
          <div className="sp-take-item" data-kind="tech" data-testid="rd-technique">
            <h4 className="sp-take-h">
              <Route size={17} strokeWidth={2.25} aria-hidden />
              Teknik
            </h4>
            <p className="sp-fb-p" lang={en}>
              <MathText>{e.technique}</MathText>
            </p>
          </div>
        </div>
      </section>

      <section className="sp-fsec" aria-labelledby="sp-sol-h">
        <h3 className="sp-h3" id="sp-sol-h">
          Lösningen
        </h3>
        <p className="sp-fb-p" lang={en}>
          <MathText>{e.solution_path}</MathText>
        </p>
      </section>

      {steps.length > 0 ? (
        <section className="sp-fsec" aria-labelledby="sp-steps-h">
          <h3 className="sp-h3" id="sp-steps-h">
            Steg för steg <span className="sp-h3-meta">{steps.length} steg</span>
          </h3>
          <ol className="sp-steps">
            {steps.map((s) => (
              <Step key={s.n} step={s} view={view} act={act} refs={refs} />
            ))}
          </ol>
        </section>
      ) : null}

      {others.length > 0 ? (
        <section className="sp-fsec" aria-labelledby="sp-others-h">
          <h3 className="sp-h3" id="sp-others-h">
            {picked ? 'De andra alternativen' : 'Varför de andra lockar'}
          </h3>
          <div className="sp-others">
            {others.map((d) => (
              <Other
                key={`${q.qid}-${d.letter}`}
                d={d}
                text={text(d.letter)}
                cites={cites(d.letter)}
                act={act}
                lang={en}
              />
            ))}
          </div>
        </section>
      ) : null}

      {frameworkId && framework ? (
        <p className="sp-framework">
          Ramverk: {framework}.{' '}
          <button
            type="button"
            className="sp-link sp-link--inline"
            onClick={() => actions.openLesson(frameworkId)}
          >
            Slå upp i Uppslag
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </button>
        </p>
      ) : null}
    </div>
  )
}

function Recap({
  kind,
  letter,
  text,
  mine = false,
}: {
  kind: 'mine' | 'right'
  letter: string
  text: ReactNode
  mine?: boolean
}) {
  return (
    <div className="sp-recap-tile" data-kind={kind}>
      <span className="sp-recap-icon" aria-hidden>
        {kind === 'right' ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
      </span>
      <span className="sp-recap-text">
        <span className="sp-recap-label">
          {kind === 'mine' ? 'Ditt svar' : mine ? 'Ditt svar · rätt' : 'Rätt svar'} · {letter}
        </span>
        {text}
      </span>
    </div>
  )
}

function Step({ step, view, act, refs }: Shared & { step: ExplanationStep }) {
  const detail = step.tier === 'detail'
  const open = !detail || view.openSteps.has(step.n)
  return (
    <li
      className="sp-step-item"
      data-tier={step.tier ?? 'essential'}
      data-testid={`rd-step-${step.n}`}
      ref={refs.step(step.n)}
    >
      <span className="sp-step-dot" aria-hidden>
        {step.n}
      </span>
      <div className="sp-step-content">
        <div className="sp-step-head">
          <h4 className="sp-step-name">
            <span className="sp-sr">Steg {step.n}: </span>
            <span lang={view.question.section === 'ELF' ? 'en' : undefined}>{step.title}</span>
          </h4>
          {detail ? (
            <button
              type="button"
              className="sp-more"
              data-testid={`rd-step-toggle-${step.n}`}
              aria-expanded={open}
              onClick={() => act.toggleStep(step.n)}
            >
              {open ? 'Dölj fördjupningen' : 'Fördjupning'}
              <ChevronDown
                size={15}
                strokeWidth={2.25}
                aria-hidden
                style={{ rotate: open ? '180deg' : '0deg' }}
              />
            </button>
          ) : null}
        </div>
        {open ? (
          <p
            className="sp-fb-p sp-step-text"
            lang={view.question.section === 'ELF' ? 'en' : undefined}
          >
            <Rich text={step.text} act={act} />
            <Cites list={view.stepCites[step.n] ?? []} act={act} source={`step-${step.n}`} />
          </p>
        ) : null}
      </div>
    </li>
  )
}

function Other({
  d,
  text,
  cites,
  act,
  lang,
}: {
  d: DistractorExplanation
  text: ReactNode
  cites: { tempting: number[]; wrong: number[] }
  act: DrillAct
  lang?: 'en'
}) {
  const [open, setOpen] = useState(false)
  const bodyId = `sp-other-${d.letter}`
  return (
    <article
      className="sp-other"
      data-testid={`rd-distractor-${d.letter}`}
      data-open={String(open)}
    >
      <button
        type="button"
        className="sp-other-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span className="sp-blob sp-blob--sm" aria-hidden>
          {d.letter}
        </span>
        <span className="sp-other-text">
          <span className="sp-sr">Alternativ {d.letter}: </span>
          {text}
        </span>
        <ChevronDown className="sp-chev" size={18} strokeWidth={2.25} aria-hidden />
      </button>
      {open ? (
        <div className="sp-other-body" id={bodyId}>
          <h4 className="sp-h4">Varför det lockar</h4>
          <p className="sp-fb-p" lang={lang}>
            <Rich text={d.why_tempting} act={act} />
            <Cites list={cites.tempting} act={act} />
          </p>
          <h4 className="sp-h4">Varför det är fel</h4>
          <p className="sp-fb-p" lang={lang}>
            <Rich text={d.why_wrong} act={act} />
            <Cites list={cites.wrong} act={act} source={`why-${d.letter}`} />
          </p>
        </div>
      ) : null}
    </article>
  )
}

/** The one citation form: a ¶ chip at the end of the sentence it backs. */
function Cites({ list, act, source }: { list: number[]; act: DrillAct; source?: string }) {
  if (list.length === 0) return null
  return (
    <span className="sp-cites" lang="sv">
      {list.map((n) => (
        <button
          key={n}
          type="button"
          className="sp-cite"
          data-testid={`rd-cite-${n}`}
          onClick={() => act.cite(n, source)}
          aria-label={`Visa stycke ${n} i texten`}
        >
          ¶ {n}
        </button>
      ))}
    </span>
  )
}

/** Explanation text, verbatim (math rendered), with its "(steg 2)"
 *  references made into links to the step. */
function Rich({ text, act }: { text: string; act: DrillAct }) {
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
            className="sp-stepref"
            onClick={() => act.goToStep(seg.steps[0])}
          >
            {seg.text}
          </button>
        )
      })}
    </>
  )
}

// ── End of a round: today's path, one step further ───────────────────

/**
 * The end of a sitting: the chip, the result as a display line, the
 * answers as stops, one sentence about what happens to the misses, the
 * day's path one step further, then the plan's next step (green, as
 * `roundEnd` finds it) and the quiet way back. `kind` says what ended.
 */
export function Done({
  view,
  questions,
  kind,
  title,
  back,
  pages,
}: {
  view: DrillCoreView
  questions: readonly DrillQuestion[]
  kind: RoundKind
  /** "Magasinet i Hökaryd", "Kvantitativ övning". */
  title: string
  back: { label: string; onClick: () => void }
  /** The page each question is on: a DTK round's stops group by page. */
  pages?: readonly number[]
}) {
  const { data, actions } = useDirectionData()
  const { resume, plan } = data.home
  const right = view.results.filter((r) => r.correct).length
  const missed = view.results.length - right
  const dayText = kind === 'text' && resume != null
  const { doneStep, next } = roundEnd(plan.items, kind)
  const chip = dayText
    ? `Dagens stig 1 av ${1 + plan.items.length}`
    : kind === 'repetition'
      ? 'Repetition klar'
      : 'Övningen klar'
  const lede =
    kind === 'repetition'
      ? [
          right > 0
            ? `${cap(inWords(right))} flyttas fram i schemat.`
            : 'Ingen flyttades fram den här gången.',
          missed > 0 ? `${cap(inWords(missed))} kommer tillbaka om en stund.` : null,
        ]
          .filter(Boolean)
          .join(' ')
      : missed === 0
        ? kind === 'text'
          ? 'Hela texten satt.'
          : 'Allt satt.'
        : `${cap(inWords(missed))} ${missed === 1 ? 'fråga ligger' : 'frågor ligger'} nu i Repetera och kommer tillbaka när du är redo.`
  const groupStart = (i: number) => pages != null && i > 0 && pages[i] !== pages[i - 1]
  const qIndex = (qid: string) => questions.findIndex((q) => q.qid === qid)
  const minutes = (item: PlanItemView) =>
    [item.detail, `${item.minutes} min`].filter(Boolean).join(' · ')
  return (
    <section className="sp-done" data-testid="rd-done" aria-labelledby="sp-done-h">
      <span className="sp-done-chip">
        <Check size={16} strokeWidth={2.75} aria-hidden />
        {chip}
      </span>
      <p className="sp-eyebrow">
        <span lang={view.question.section === 'ELF' ? 'en' : undefined}>{title}</span> är klar
      </p>
      <h2 className="sp-display" id="sp-done-h">
        {right} av {view.results.length} {kind === 'repetition' ? 'satt' : 'rätt'}
      </h2>
      <ol className="sp-done-qs" aria-label="Dina svar">
        {view.results.map((r, i) => (
          <li key={r.qid} data-correct={String(r.correct)} data-break={String(groupStart(i))}>
            <span className="sp-done-q-node" aria-hidden>
              {r.correct ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <RotateCcw size={12} strokeWidth={3} />
              )}
            </span>
            <span className="sp-sr">
              Fråga {qIndex(r.qid) + 1}
              {r.correct
                ? ', rätt'
                : kind === 'repetition'
                  ? ', tillbaka om en stund'
                  : ', lagd i Repetera'}
            </span>
          </li>
        ))}
      </ol>
      <p className="sp-lede">{lede}</p>
      {plan.items.length > 0 || dayText ? (
        <ol className="sp-mini" aria-label="Dagens stig">
          {dayText ? (
            <li className="sp-mini-step" data-state="done" data-sec={resume.section}>
              <span className="sp-mini-node" aria-hidden>
                <Check size={16} strokeWidth={3} />
              </span>
              <span className="sp-mini-text">
                <b lang={view.question.section === 'ELF' ? 'en' : undefined}>{title}</b>
                <span>{resume.section} · klar</span>
              </span>
            </li>
          ) : null}
          {plan.items.map((item, i) => {
            const state =
              item === doneStep || item.completed ? 'done' : item === next ? 'next' : 'todo'
            return (
              <li
                key={item.id}
                className="sp-mini-step"
                data-state={state}
                data-sec={secOf(item.section)}
              >
                <span className="sp-mini-node" aria-hidden>
                  {state === 'done' ? <Check size={16} strokeWidth={3} /> : i + (dayText ? 2 : 1)}
                </span>
                <span className="sp-mini-text">
                  <b>{item.title}</b>
                  <span>{state === 'done' ? 'klar' : minutes(item)}</span>
                </span>
                {state === 'next' ? <span className="sp-next-chip">Nästa</span> : null}
              </li>
            )
          })}
          <li className="sp-mini-step" data-state="goal">
            <span className="sp-mini-node" aria-hidden>
              <Flag size={15} strokeWidth={2.25} />
            </span>
            <span className="sp-mini-text">
              <b>Klart för idag</b>
            </span>
          </li>
        </ol>
      ) : null}
      <div className="sp-done-actions">
        {next ? (
          <>
            <button
              type="button"
              className="sp-btn sp-btn--primary sp-btn--lg"
              onClick={() => actions.openPlanItem(next.id)}
            >
              Fortsätt med {next.title} · {next.minutes} min
              <Kbd>↵</Kbd>
            </button>
            <button type="button" className="sp-btn sp-btn--quiet" onClick={back.onClick}>
              {back.label}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="sp-btn sp-btn--primary sp-btn--lg"
            onClick={back.onClick}
          >
            {back.label}
            <Kbd>↵</Kbd>
          </button>
        )}
      </div>
    </section>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

function PhoneDrill({
  view,
  act,
  refs,
  questions,
  clock,
  note,
  setNote,
  badgeRef,
  scrollRef,
  focusOn,
  toggleFocus,
  done,
  ready = true,
  short,
  live,
}: Shared &
  Note & {
    questions: readonly DrillQuestion[]
    clock: boolean
    scrollRef: RefObject<HTMLDivElement | null>
    focusOn: boolean
    toggleFocus: () => void
    done: ReactNode
    short: boolean
    live: boolean
  }) {
  const { data } = useDirectionData()
  const { state, setState, toggle, grab } = useSheet(view)
  useKeyMap({ t: toggle }, live)
  // biome-ignore lint/correctness/useExhaustiveDependencies: seat each new short question under its text
  useEffect(() => {
    if (short && view.phase === 'question') setState('open')
  }, [view.index, view.phase])
  const { hidden, onScroll: hideOnScroll } = useHideOnScroll()
  // The head hides when the reader scrolls, not when the app does.
  const quietUntil = useRef(0)
  const onScroll = (e: { currentTarget: HTMLElement }) => {
    if (Date.now() >= quietUntil.current) hideOnScroll(e)
  }
  const bandSeen = useSeen(badgeRef)
  const feedback = view.phase === 'feedback'
  const synthetic = view.question.passage?.synthetic === true
  // Below the 64 px head, with a little air.
  useTurnToEvidence(view, scrollRef, 80, () => {
    quietUntil.current = Date.now() + 900
  })

  // The sheet's body is reused across phases: a verdict, a new question or
  // an opening sheet starts at its top, not where the options left it.
  const bodyRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on a new question, verdict or opening
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 })
  }, [view.phase, view.index, state === 'peek'])

  // The passage ends where the sheet begins: the peek is measured, the
  // other states have set heights (CSS keys off data-sheet).
  const sheetRef = useRef<HTMLElement>(null)
  const [peekH, setPeekH] = useState(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the sheet changes shape
  useLayoutEffect(() => {
    const el = sheetRef.current
    if (!el || state !== 'peek') return
    const measure = () => setPeekH(el.offsetHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [state, view.phase, view.index])

  // Choosing opens the sheet; a ¶ chip drops it to half over the paragraph.
  const actSelect = act.select
  const select = (letter: AnswerLetter) => {
    actSelect(letter)
    setState('open')
  }
  const cite = (n: number, source?: string) => {
    setState('open')
    act.cite(n, source)
  }
  const sheetAct: DrillAct = { ...act, select, cite }

  if (view.phase === 'done') {
    return (
      <div className="sp-pdrill">
        <div className="sp-pdrill-scroll sp-pdrill-scroll--done">{done}</div>
      </div>
    )
  }

  const last = view.index + 1 >= view.total
  const progress = ((view.index + (feedback ? 1 : 0)) / view.total) * 100
  const scrollStyle: CSSProperties | undefined =
    state === 'peek' ? { bottom: Math.max(0, peekH - 24) } : undefined
  return (
    <div className="sp-pdrill" data-sheet={state} data-phase={view.phase}>
      <div className="sp-thin" data-shown={String(hidden)} aria-hidden>
        <i style={{ width: `${progress}%` }} />
      </div>
      <header className="sp-ptop" data-hidden={String(hidden)}>
        <button
          type="button"
          className="sp-btn sp-btn--quiet sp-btn--sm"
          data-testid="rd-exit"
          onClick={act.exit}
        >
          <X size={17} strokeWidth={2.25} aria-hidden />
          Avsluta
        </button>
        <span className="sp-ptop-mid">
          <span
            className="sp-sec-chip sp-sec-chip--sm"
            data-sec={view.question.section}
            title={SECTION_NAMES[view.question.section]}
          >
            {view.question.section}
          </span>
          <Progress view={view} questions={questions} label="Frågorna i texten" compact />
        </span>
        <button
          type="button"
          className="sp-icon-btn sp-icon-btn--sm"
          aria-pressed={focusOn}
          aria-label="Styckefokus"
          onClick={toggleFocus}
        >
          <Focus size={19} strokeWidth={2} aria-hidden />
        </button>
        {clock ? <Timer seconds={view.elapsed} compact /> : <span aria-hidden />}
      </header>
      {hidden ? (
        <button
          type="button"
          className="sp-pin-exit"
          data-testid="sp-pin-exit"
          aria-label="Avsluta"
          onClick={act.exit}
        >
          <X size={20} strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
      <div className="sp-pdrill-scroll" ref={scrollRef} onScroll={onScroll} style={scrollStyle}>
        <Reader
          view={view}
          act={sheetAct}
          refs={refs}
          note={note}
          setNote={setNote}
          badgeRef={badgeRef}
        />
        <div aria-hidden style={{ height: 32 }} />
      </div>
      <section
        className="sp-psheet"
        ref={sheetRef}
        data-testid="rd-sheet"
        data-state={state}
        data-phase={view.phase}
        aria-label={`Fråga ${view.index + 1}`}
      >
        <div className="sp-psheet-grabrow">
          <button
            type="button"
            className="sp-grab"
            aria-label={state === 'peek' ? 'Visa frågan' : 'Visa texten'}
            aria-expanded={state !== 'peek'}
            {...grab}
          />
          {synthetic ? (
            <span
              className="sp-badge-chip sp-badge-chip--sm"
              data-hidden={String(bandSeen)}
              aria-hidden={bandSeen}
            >
              {data.copy.ovningstextBadge}
            </span>
          ) : null}
        </div>
        {feedback ? (
          <div className="sp-psheet-head">
            <Verdict view={view} compact />
          </div>
        ) : null}
        <div className="sp-psheet-body" ref={bodyRef}>
          {feedback ? (
            state === 'peek' ? (
              <button type="button" className="sp-show" onClick={toggle}>
                Tillbaka till facit
                <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
              </button>
            ) : (
              <FeedbackBody view={view} act={sheetAct} refs={refs} chip />
            )
          ) : (
            <>
              <ReadingPrompt view={view} act={sheetAct} />
              {state === 'peek' ? (
                <button type="button" className="sp-show" onClick={toggle}>
                  Visa alternativen ({view.letters.length})
                  <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
                </button>
              ) : null}
              <div hidden={state === 'peek'}>
                {view.letters.length === 0 ? <p>Alternativen saknas för den här frågan.</p> : null}
                <ReadingTactic view={view} />
                <Options view={view} act={sheetAct} layout={readingOptionsLayout(view.question)} />
              </div>
            </>
          )}
        </div>
        {state === 'peek' ? null : (
          <div className="sp-psheet-foot">
            {feedback ? (
              <>
                <button
                  type="button"
                  className="sp-btn sp-btn--quiet"
                  onClick={() => setState('peek')}
                >
                  <ChevronDown size={18} strokeWidth={2.25} aria-hidden />
                  Visa texten
                </button>
                <button
                  type="button"
                  className="sp-btn sp-btn--primary sp-btn--lg sp-btn--grow"
                  data-testid="rd-next"
                  onClick={act.next}
                >
                  {last ? 'Klart med texten' : 'Nästa fråga'}
                </button>
              </>
            ) : (
              <>
                <span className="sp-echo" aria-live="polite">
                  {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
                </span>
                <button
                  type="button"
                  className="sp-btn sp-btn--primary sp-btn--lg"
                  data-testid="rd-lock"
                  disabled={!view.selected || !ready}
                  onClick={act.lock}
                >
                  Svara
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
