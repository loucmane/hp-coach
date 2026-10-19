// Samtal · Kvantfråga and DTK — the problem as an attachment in the coach's
// turn; a DTK page as a calm document beside the conversation.
//
// Kvantfråga, desktop: there is no passage, so there is no document pane to
// leave empty. Focus mode keeps the slim strip, and the conversation stands
// in one centred column. The coach's turn carries the problem as an opaque
// attachment, its math set by KaTeX:
//   - XYZ: the whole stem (and any diagram);
//   - KVA: the condition, then Kvantitet I and II side by side;
//   - NOG: the question, then (1), (2) and the sufficiency coda together.
// The options stand below as replies in your lane — only the letters the
// question has (A–D, NOG's A–E) — and Svara in the action bar is the one
// action: select, then send. The answer, the verdict and the coach's notes
// follow as on Facit, the math rendered throughout.
// Phone: one continuous scroll, no tray to hide the condition, and the
// action bar sticks under the options.
// DTK, desktop: the figure page is the document, about three fifths of the
// width. Its head holds zoom, rotate and "Förstora figur", which opens the
// page over the whole drill with the same tools. The page pans by drag, by
// arrow keys or by scrolling. Zoom, rotation and place hold for every
// question on the same page.
// DTK, phone: the page first, full width, and the question in the reply
// tray ("Visa figuren" folds it).
// A question that lacks what it needs — its stem, its options, its DTK page
// or diagram, missing or failed to load — cannot be graded, by Svara or by
// Enter. It says why, offers a real retry where a load failed, and "Till
// Öva" as the way back. A sitting without questions says so, and its one
// way on is Öva.

import { Maximize2, Minus, Plus, RotateCw, X } from 'lucide-react'
import {
  createContext,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { type DrillCoreView, useDrillCore } from '@/components/devbake/redesign/drillCore'
import {
  type DirectionProps,
  fmtClock,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DrillFigure,
  DrillQuestion,
  DrillSessionView,
} from '@/components/devbake/redesign/viewModel'
import { isProseCondition, splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { parseNogPrompt } from '@/lib/nogPrompt'
import {
  Conversation,
  Dock,
  type DrillChrome,
  ExitButton,
  nextPlanItem,
  StripProgress,
  TrayDrill,
  useFolds,
} from './SamtalDrill'
import { Closing, luresFor } from './SamtalFeedback'
import { Coach, Divider, Kbd, Replies } from './SamtalParts'

type FigureStatus = 'loading' | 'ready' | 'error'

/** Load status and retries, per figure source (a DTK page or a diagram):
 *  a failure belongs to its own source and never follows the reader to the
 *  next one. */
type FigureLoads = {
  status: (src: string) => FigureStatus
  attempt: (src: string) => number
  report: (src: string, s: FigureStatus) => void
  retry: (src: string) => void
}

function useFigureLoadState(): FigureLoads {
  const [status, setStatus] = useState<Record<string, FigureStatus>>({})
  const [attempts, setAttempts] = useState<Record<string, number>>({})
  return {
    status: (src) => status[src] ?? 'loading',
    attempt: (src) => attempts[src] ?? 0,
    report: (src, s) => setStatus((m) => (m[src] === s ? m : { ...m, [src]: s })),
    retry: (src) => {
      setStatus((m) => ({ ...m, [src]: 'loading' }))
      setAttempts((m) => ({ ...m, [src]: (m[src] ?? 0) + 1 }))
    },
  }
}

/** The drill's figure loads, for the diagram inside the coach's turn. */
const FigureLoadsContext = createContext<FigureLoads | null>(null)

function useFigureLoads(): FigureLoads {
  const loads = useContext(FigureLoadsContext)
  if (!loads) throw new Error('A quant diagram is drawn inside the quant drill only')
  return loads
}

/** A page's zoom (an index into ZOOMS) and rotation, in degrees. */
type FigureView = { zoom: number; rotation: number }

const FIGURE_START: FigureView = { zoom: 0, rotation: 0 }
/** In place: from the page's width (100 %) to three times it. */
const ZOOMS = [1, 1.25, 1.5, 2, 2.5, 3]
/** Enlarged: from the whole page on screen (100 %) to four times it. */
const INSPECT_ZOOMS = [1, 1.5, 2, 3, 4]
/** How far an arrow key moves a page. */
const PAN_STEP = 48

function pct(zoom: number): string {
  return `${Math.round(zoom * 100)} %`
}

/** Why the answer cannot be sent, or null: no stem, no options, or a figure
 *  the question needs (`figure` is its load status) that is missing or
 *  failed to load — a DTK page or a diagram. */
function blockedReason(q: DrillQuestion, figure: FigureStatus): string | null {
  if (!q.prompt?.trim()) return 'Frågetexten saknas, så frågan kan inte besvaras.'
  if (!q.options?.length) return 'Frågan saknar svarsalternativ och kan inte besvaras här.'
  if (q.section === 'DTK' && !q.figure) return 'Underlaget saknas, så frågan kan inte besvaras.'
  if (figure === 'error') {
    return q.figure?.kind === 'raster'
      ? 'Underlaget gick inte att ladda, så frågan kan inte besvaras.'
      : 'Figuren gick inte att ladda, så frågan kan inte besvaras.'
  }
  return null
}

/** The run of questions on the same page as question `index`: its place in
 *  the run, or null when the page has one question. */
function pageRun(questions: readonly DrillQuestion[], index: number) {
  const src = questions[index]?.figure?.src
  if (!src) return null
  let first = index
  while (first > 0 && questions[first - 1].figure?.src === src) first--
  let last = index
  while (last + 1 < questions.length && questions[last + 1].figure?.src === src) last++
  return last > first ? { at: index - first + 1, of: last - first + 1 } : null
}

export function SamtalQuant(props: DirectionProps) {
  const { data, actions } = useDirectionData()
  const session = props.screen === 7 ? data.drills.dtk : data.drills.quant
  // The drill core needs a question: a sitting without one never reaches it.
  if (!session.questions.length) {
    return (
      <NoQuestions
        title={session.title}
        width={props.width}
        live={props.live}
        onOut={() => actions.go('ova')}
      />
    )
  }
  return <QuantDrill {...props} session={session} />
}

/** A sitting without questions: the coach says so, and the one way on is
 *  Öva — no drill, no fabricated problem (spec §6 States). */
function NoQuestions({
  title,
  width,
  live,
  onOut,
}: {
  title: string
  width: WidthKey
  live: boolean
  onOut: () => void
}) {
  const headingId = useId()
  useKeyMap({ Enter: onOut }, live)
  const turn = (
    <div className="sa-closing">
      <Divider>{title}</Divider>
      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby={headingId}>
          <h1 className="sa-lead-q" id={headingId}>
            Det finns ingen fråga att visa här just nu.
          </h1>
          <p className="sa-say sa-say--quiet">Välj något annat att öva på i Öva.</p>
        </Coach>
        <Replies>
          <button type="button" className="sa-chip sa-chip--primary sa-chip--big" onClick={onOut}>
            Till Öva
            <Kbd>↵</Kbd>
          </button>
        </Replies>
      </div>
    </div>
  )
  return width === 'phone' ? (
    <div className="sa-pdrill" data-phase="done">
      <div className="sa-pdone">{turn}</div>
    </div>
  ) : (
    <div className="sa-drill" data-phase="done">
      <div className="sa-done-scroll">
        <div className="sa-col">{turn}</div>
      </div>
    </div>
  )
}

function QuantDrill({ width, live, session }: DirectionProps & { session: DrillSessionView }) {
  const { data, actions } = useDirectionData()
  const { view, act, refs } = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start: session.start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  const [active, point] = useState<string | null>(null)
  const folds = useFolds(view, act)
  // A new question starts with nothing pointed at.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on a new question only
  useEffect(() => {
    point(null)
  }, [view.index])

  const q = view.question
  const page = q.figure?.kind === 'raster' ? q.figure : null
  // Per page: zoom and rotation. A question on the same page finds it as
  // the last one left it.
  const [views, setViews] = useState<Record<string, FigureView>>({})
  const fig = page ? (views[page.src] ?? FIGURE_START) : FIGURE_START
  const setFig = (patch: Partial<FigureView>) => {
    if (!page) return
    setViews((m) => ({ ...m, [page.src]: { ...(m[page.src] ?? FIGURE_START), ...patch } }))
  }
  // Per source, page or diagram: load status and retries.
  const loads = useFigureLoadState()
  const figureStatus: FigureStatus = q.figure ? loads.status(q.figure.src) : 'ready'

  // "Förstora figur": the page over the whole drill. Esc or "Stäng figur"
  // closes it, and focus goes back to the control that opened it.
  const [inspecting, setInspecting] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const wasInspecting = useRef(false)
  useEffect(() => {
    if (inspecting) {
      wasInspecting.current = true
      return
    }
    if (!wasInspecting.current) return
    wasInspecting.current = false
    opener.current?.focus({ preventScroll: true })
  }, [inspecting])
  const inspect = (from: HTMLElement) => {
    opener.current = from
    setInspecting(true)
  }

  const blocked = blockedReason(q, figureStatus)
  const moved = useRef(false)
  // Nothing is graded while the question cannot be answered: not by Svara,
  // not by Enter.
  const lock = () => {
    if (blocked) return false
    moved.current = true
    return act.lock()
  }
  const next = () => {
    moved.current = true
    return act.next()
  }
  const nextItem = nextPlanItem(data.home.plan.items)
  const out = { label: 'Till Öva', onClick: () => actions.go('ova') }
  const onNext = () => (nextItem ? actions.openPlanItem(nextItem.id) : out.onClick())

  const advance = () => {
    if (view.phase === 'question') lock()
    else if (view.phase === 'feedback') next()
    else onNext()
  }
  const keys: Record<string, () => void> = {
    // Esc lets go of the enlarged page; it never leaves the drill.
    Escape: () => setInspecting(false),
  }
  // While the page is enlarged, the question's keys rest.
  if (!inspecting) {
    keys.Enter = advance
    // Space moves on once answered; before that it scrolls.
    if (view.phase !== 'question') keys[' '] = advance
    for (const letter of view.letters) {
      const l = letter.toLowerCase()
      keys[l] = () => act.select(letter)
      keys[`Shift+${l}`] = () => act.toggleEliminate(letter)
    }
  }
  useKeyMap(keys, live)

  // The set's end takes focus after the reader's own last move.
  const doneRef = useRef<HTMLElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: on the set's end only
  useEffect(() => {
    if (view.phase !== 'done') return
    if (moved.current && live) doneRef.current?.focus({ preventScroll: true })
    moved.current = false
  }, [view.phase])

  const chrome: DrillChrome = {
    view,
    act: { ...act, lock, next },
    refs,
    live,
    folds,
    moved,
    active,
    point,
    lures: luresFor(q.section),
    frameworks: data.frameworks,
    optionId: 'rd-quant-option',
    blocked,
    out,
    focusAid: false,
    lastLabel: 'Slutför övningen',
  }
  const clock = session.elapsedSeconds != null
  const pageProps: PageProps | null = page
    ? {
        figure: page,
        fig,
        status: figureStatus,
        attempt: loads.attempt(page.src),
        run: pageRun(session.questions, view.index),
        onZoom: (dir) => setFig({ zoom: Math.min(ZOOMS.length - 1, Math.max(0, fig.zoom + dir)) }),
        onRotate: () => setFig({ rotation: (fig.rotation + 90) % 360 }),
        onInspect: inspect,
        onStatus: (s) => loads.report(page.src, s),
        onRetry: () => loads.retry(page.src),
      }
    : null

  let body: ReactNode
  if (view.phase === 'done') {
    const repetition = session.request.kind === 'repetition'
    const closing = (
      <Closing
        view={view}
        title={session.title}
        divider={repetition ? 'Omgången är klar' : 'Övningen är klar'}
        repetition={repetition}
        clock={clock}
        out={out}
        next={nextItem}
        onNext={onNext}
        ref={doneRef}
      />
    )
    body =
      width === 'phone' ? (
        <div className="sa-pdrill" data-phase="done">
          <div className="sa-pdone">{closing}</div>
        </div>
      ) : (
        <div className="sa-drill" data-phase="done">
          <div className="sa-done-scroll">
            <div className="sa-col">{closing}</div>
          </div>
        </div>
      )
  } else if (width === 'phone') {
    body = pageProps ? (
      <TrayDrill
        c={chrome}
        Turn={QuantTurn}
        foldLabel="Visa figuren"
        head={<PhoneHead c={chrome} clock={clock} />}
        doc={<FigureDocument {...pageProps} phone />}
      />
    ) : (
      <PhoneQuant c={chrome} clock={clock} />
    )
  } else {
    body = (
      <DeskDrill
        c={chrome}
        clock={clock}
        doc={pageProps ? <FigureDocument {...pageProps} /> : null}
      />
    )
  }

  return (
    <FigureLoadsContext.Provider value={loads}>
      {/* Under the enlarged page the drill is out of reach. */}
      <div className="sa-qroot" inert={inspecting}>
        {body}
      </div>
      {inspecting && page ? (
        <FigureInspector
          figure={page}
          rotation={fig.rotation}
          attempt={loads.attempt(page.src)}
          onRotate={() => setFig({ rotation: (fig.rotation + 90) % 360 })}
          onStatus={(s) => loads.report(page.src, s)}
          onClose={() => setInspecting(false)}
        />
      ) : null}
    </FigureLoadsContext.Provider>
  )
}

// ── The conversation ─────────────────────────────────────────────────

/** After the reader's answer the thread turns to it; a new question starts
 *  at its top. Focus follows the reader's own moves only. */
function useThreadMoves(
  c: DrillChrome,
  scroller: RefObject<HTMLElement | null>,
  turnRef: RefObject<HTMLElement | null>,
) {
  const { view } = c
  // biome-ignore lint/correctness/useExhaustiveDependencies: on question/phase change only
  useEffect(() => {
    const box = scroller.current
    if (view.phase === 'feedback') {
      const mine = box?.querySelector<HTMLElement>('[data-anchor="answer"]')
      box?.scrollTo?.({ top: mine ? Math.max(0, mine.offsetTop - 20) : 0 })
    } else box?.scrollTo?.({ top: 0 })
    if (c.moved.current && c.live) turnRef.current?.focus({ preventScroll: true })
    c.moved.current = false
  }, [view.index, view.phase])
}

/** Desktop: the strip, then the conversation — centred alone for text
 *  quant, beside the page for DTK. */
function DeskDrill({ c, clock, doc }: { c: DrillChrome; clock: boolean; doc: ReactNode }) {
  const { view, act } = c
  const threadRef = useRef<HTMLDivElement>(null)
  const turnRef = useRef<HTMLElement>(null)
  useThreadMoves(c, threadRef, turnRef)
  return (
    <div className="sa-drill">
      <header className="sa-strip">
        <ExitButton act={act} />
        <StripProgress view={view} prefix={view.question.section} clock={clock} />
      </header>
      <div className={doc ? 'sa-dbody sa-dbody--figure' : 'sa-qbody'}>
        {doc}
        <section
          className={doc ? 'sa-talk' : 'sa-talk sa-talk--solo'}
          aria-label={`Samtal om fråga ${view.index + 1}`}
        >
          {/* The action bar follows the thread and sticks to the column's
           *  foot only once the thread runs longer than the column. */}
          <div className="sa-thread sa-thread--drill" ref={threadRef}>
            <Conversation c={c} turnRef={turnRef} Turn={QuantTurn} />
            <Dock c={c} />
          </div>
        </section>
      </div>
    </div>
  )
}

function PhoneHead({ c, clock }: { c: DrillChrome; clock: boolean }) {
  const { view } = c
  const progress = ((view.index + (view.phase === 'feedback' ? 1 : 0)) / view.total) * 100
  return (
    <header className="sa-phead">
      <ExitButton act={c.act} icon />
      <span className="sa-phead-pos">
        {view.question.section} · Fråga {view.index + 1} av {view.total}
      </span>
      <span className="sa-phead-tools">
        {clock ? (
          <span className="sa-clock" role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
            <span aria-hidden>{fmtClock(view.elapsed)}</span>
          </span>
        ) : null}
      </span>
      <span className="sa-phead-line" aria-hidden>
        <i style={{ width: `${progress}%` }} />
      </span>
    </header>
  )
}

/** Phone quant: one scroll with the action bar sticking under the options
 *  — the condition never hides behind a tray. */
function PhoneQuant({ c, clock }: { c: DrillChrome; clock: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const turnRef = useRef<HTMLElement>(null)
  useThreadMoves(c, scrollRef, turnRef)
  return (
    <div className="sa-pquant">
      <PhoneHead c={c} clock={clock} />
      <div className="sa-pquant-scroll" ref={scrollRef}>
        <div className="sa-thread">
          <Conversation c={c} turnRef={turnRef} Turn={QuantTurn} />
        </div>
        <Dock c={c} phone />
      </div>
    </div>
  )
}

/** The coach's turn: the question's place, then the problem as an
 *  attachment (rd-quant-prompt). */
function QuantTurn({ view, ref }: { view: DrillCoreView; ref?: Ref<HTMLElement> }) {
  const headingId = useId()
  const q = view.question
  return (
    <Coach
      as="section"
      kind="sa-turn--q sa-turn--quant"
      aria-labelledby={headingId}
      data-phase={view.phase}
      tabIndex={-1}
      ref={ref}
    >
      <p className="sa-turn-label">
        Fråga {view.index + 1} · {q.section}
      </p>
      <Problem q={q} headingId={headingId} />
    </Coach>
  )
}

/** The problem, each shape kept whole: KVA's condition and quantities, NOG's
 *  statements and coda, everything else as the bank has it. A prompt that
 *  does not split falls back to its full text. */
function Problem({ q, headingId }: { q: DrillQuestion; headingId: string }) {
  const prompt = q.prompt ?? ''
  const kva = q.section === 'KVA' && prompt ? splitKvaPrompt(prompt) : null
  const nog = q.section === 'NOG' && prompt ? parseNogPrompt(prompt) : null
  const diagram = q.figure && q.figure.kind === 'svg' ? <Diagram figure={q.figure} /> : null

  if (kva) {
    const prose = kva.condition ? isProseCondition(kva.condition) : false
    return (
      <div className="sa-qprompt" data-testid="rd-quant-prompt">
        <h2 className="sa-q" id={headingId}>
          Jämför kvantiteterna.
        </h2>
        <div className="sa-problem">
          {kva.condition && prose ? (
            <p className="sa-problem-setup">
              <MathText>{kva.condition}</MathText>
            </p>
          ) : null}
          {kva.condition && !prose ? (
            <p className="sa-problem-cond">
              <span className="sa-problem-label">Villkor</span>
              <span className="sa-problem-math">
                <MathText>{kva.condition}</MathText>
              </span>
            </p>
          ) : null}
          {diagram}
          <dl className="sa-kva">
            <div className="sa-kva-q">
              <dt className="sa-problem-label">Kvantitet I</dt>
              <dd className="sa-problem-math">
                <MathText>{kva.kvI}</MathText>
              </dd>
            </div>
            <div className="sa-kva-q">
              <dt className="sa-problem-label">Kvantitet II</dt>
              <dd className="sa-problem-math">
                <MathText>{kva.kvII}</MathText>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    )
  }

  if (nog) {
    return (
      <div className="sa-qprompt" data-testid="rd-quant-prompt">
        <h2 className="sa-q" id={headingId}>
          <MathText>{nog.question}</MathText>
        </h2>
        <div className="sa-problem">
          {diagram}
          <ol className="sa-nog">
            <li>
              <span className="sa-nog-n" aria-hidden>
                (1)
              </span>
              <span className="sa-problem-math">
                <span className="sa-sr">Påstående 1: </span>
                <MathText>{nog.statement1}</MathText>
              </span>
            </li>
            <li>
              <span className="sa-nog-n" aria-hidden>
                (2)
              </span>
              <span className="sa-problem-math">
                <span className="sa-sr">Påstående 2: </span>
                <MathText>{nog.statement2}</MathText>
              </span>
            </li>
          </ol>
          {nog.tail ? <p className="sa-problem-coda">{nog.tail}</p> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="sa-qprompt" data-testid="rd-quant-prompt">
      <h2 className="sa-q" id={headingId}>
        {prompt ? <MathText>{prompt}</MathText> : 'Frågetexten saknas.'}
      </h2>
      {diagram ? <div className="sa-problem">{diagram}</div> : null}
      {q.section === 'DTK' && !q.figure ? (
        <p className="sa-problem-missing">Underlaget saknas för den här frågan.</p>
      ) : null}
    </div>
  )
}

/** A quant diagram (SVG) on a paper plate in both themes: its lines keep
 *  the colours of the printed page. If it fails, it says so in place with a
 *  real retry, and the answer waits for it (blockedReason). */
function Diagram({ figure }: { figure: DrillFigure }) {
  const loads = useFigureLoads()
  const { src } = figure
  if (loads.status(src) === 'error') {
    return (
      <div className="sa-problem-missing sa-problem-failed" role="alert">
        <p>Figuren gick inte att ladda.</p>
        <button type="button" className="sa-chip" onClick={() => loads.retry(src)}>
          Försök igen
        </button>
      </div>
    )
  }
  return (
    <figure className="sa-problem-fig">
      <img
        // Another source, or a retry, is a new image: nothing carries over.
        key={`${src}#${loads.attempt(src)}`}
        src={`/${src}`}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        onLoad={() => loads.report(src, 'ready')}
        onError={() => loads.report(src, 'error')}
      />
    </figure>
  )
}

// ── The DTK page ─────────────────────────────────────────────────────

type PageProps = {
  figure: DrillFigure
  fig: FigureView
  status: FigureStatus
  attempt: number
  run: { at: number; of: number } | null
  onZoom: (dir: 1 | -1) => void
  onRotate: () => void
  onInspect: (opener: HTMLElement) => void
  onStatus: (s: FigureStatus) => void
  onRetry: () => void
}

/** The page as the drill's document: its head (DTK · Underlag, the tools),
 *  the page itself in a region that pans, and its place among the questions
 *  that share it. Phone: full width in the page's scroll, no zoom in place
 *  — "Förstora figur" is the zoom. */
function FigureDocument({
  figure,
  fig,
  status,
  attempt,
  run,
  onZoom,
  onRotate,
  onInspect,
  onStatus,
  onRetry,
  phone = false,
}: PageProps & { phone?: boolean }) {
  const titleId = useId()
  const zoom = ZOOMS[fig.zoom]
  const page = (
    <FigurePage
      figure={figure}
      rotation={fig.rotation}
      width={phone ? '100%' : `${zoom * 100}%`}
      status={status}
      attempt={attempt}
      onStatus={onStatus}
    />
  )
  return (
    <article className="sa-doc sa-figdoc" aria-labelledby={titleId} data-testid="rd-figure">
      <header className="sa-doc-head">
        <span className="sa-doc-tag">
          <span>DTK</span>
          <span className="sa-doc-name" id={titleId}>
            Underlag
          </span>
        </span>
        <fieldset className="sa-doc-tools" aria-label="Underlagets verktyg">
          {phone ? null : (
            <span className="sa-zoomctl">
              <button
                type="button"
                className="sa-tool sa-tool--icon"
                aria-label="Zooma ut"
                disabled={fig.zoom === 0}
                onClick={() => onZoom(-1)}
              >
                <Minus size={16} strokeWidth={1.75} aria-hidden />
              </button>
              <span className="sa-zoom-n" aria-live="polite">
                {pct(zoom)}
              </span>
              <button
                type="button"
                className="sa-tool sa-tool--icon"
                aria-label="Zooma in"
                disabled={fig.zoom === ZOOMS.length - 1}
                onClick={() => onZoom(1)}
              >
                <Plus size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </span>
          )}
          <button
            type="button"
            className="sa-tool"
            aria-label="Rotera underlaget 90 grader"
            onClick={onRotate}
          >
            <RotateCw size={15} strokeWidth={1.75} aria-hidden />
            Rotera
          </button>
          <button
            type="button"
            className="sa-tool"
            aria-haspopup="dialog"
            onClick={(e) => onInspect(e.currentTarget)}
          >
            <Maximize2 size={15} strokeWidth={1.75} aria-hidden />
            Förstora figur
          </button>
        </fieldset>
      </header>
      {run ? (
        <p className="sa-fig-run">
          Fråga {run.at} av {run.of} till samma underlag
        </p>
      ) : null}
      {phone ? (
        <div className="sa-fig-frame">{page}</div>
      ) : (
        <FigurePan className="sa-fig-scroll" label="Underlaget" onZoomKey={onZoom}>
          {page}
        </FigurePan>
      )}
      {status === 'error' ? (
        <div className="sa-fig-error" role="alert">
          <p>Underlaget gick inte att ladda.</p>
          <button type="button" className="sa-chip" onClick={onRetry}>
            Försök igen
          </button>
        </div>
      ) : null}
    </article>
  )
}

/** The page image in a box of its own proportions, turned in quarter
 *  steps (the box takes the turned page's shape). It keeps its size while
 *  it loads, so nothing around it moves. */
function FigurePage({
  figure,
  rotation,
  width,
  status,
  attempt,
  onStatus,
}: {
  figure: DrillFigure
  rotation: number
  width: string
  status: FigureStatus
  attempt: number
  onStatus: (s: FigureStatus) => void
}) {
  const turned = rotation % 180 !== 0
  const ratio = figure.width / figure.height
  return (
    <div
      className="sa-fig-box"
      data-status={status}
      data-turned={String(turned)}
      aria-busy={status === 'loading'}
      style={{ width, aspectRatio: String(turned ? 1 / ratio : ratio) }}
    >
      <img
        key={attempt}
        className="sa-fig-img"
        src={`/${figure.src}`}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        draggable={false}
        onLoad={() => onStatus('ready')}
        onError={() => onStatus('error')}
        style={{
          width: turned ? `${100 * ratio}%` : '100%',
          height: turned ? `${100 / ratio}%` : '100%',
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }}
      />
      {status === 'loading' ? (
        <span className="sa-fig-wait" aria-hidden>
          Hämtar underlaget …
        </span>
      ) : null}
    </div>
  )
}

/** A region the page pans in: drag with a pointer (touch scrolls as
 *  usual), the arrow keys move it, + and − zoom. The arrows are claimed so
 *  the bake-off's ←/→ leave them alone while the page has focus. */
function FigurePan({
  className,
  label,
  onZoomKey,
  children,
}: {
  className: string
  label: string
  onZoomKey: (dir: 1 | -1) => void
  children: ReactNode
}) {
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [grabbing, setGrabbing] = useState(false)
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.pointerType === 'touch') return
    const el = e.currentTarget
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      // No capture (jsdom): the moves still bubble here.
    }
    setGrabbing(true)
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const el = e.currentTarget
    el.scrollLeft = d.left - (e.clientX - d.x)
    el.scrollTop = d.top - (e.clientY - d.y)
  }
  const end = () => {
    drag.current = null
    setGrabbing(false)
  }
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-PAN_STEP, 0],
      ArrowRight: [PAN_STEP, 0],
      ArrowUp: [0, -PAN_STEP],
      ArrowDown: [0, PAN_STEP],
    }
    const m = moves[e.key]
    if (m) {
      e.preventDefault()
      el.scrollLeft += m[0]
      el.scrollTop += m[1]
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      onZoomKey(1)
    } else if (e.key === '-') {
      e.preventDefault()
      onZoomKey(-1)
    }
  }
  return (
    <section
      className={className}
      data-grabbing={String(grabbing)}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region the keyboard pans
      tabIndex={0}
      aria-label={`${label}. Piltangenterna flyttar, plus och minus zoomar.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
    >
      {children}
    </section>
  )
}

/** "Förstora figur": the page over the whole drill, opaque, with the same
 *  tools and "Stäng figur". It owns the screen until it is closed (Esc or
 *  the button): the drill under it is inert and Tab stays inside. It opens
 *  with the whole page on screen. */
function FigureInspector({
  figure,
  rotation,
  attempt,
  onRotate,
  onStatus,
  onClose,
}: {
  figure: DrillFigure
  rotation: number
  attempt: number
  onRotate: () => void
  onStatus: (s: FigureStatus) => void
  onClose: () => void
}) {
  const titleId = useId()
  const [zoom, setZoom] = useState(0)
  const [room, setRoom] = useState({ w: 0, h: 0 })
  const paneRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    const el = paneRef.current
    if (!el) return
    const measure = () => setRoom({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const watch = new ResizeObserver(measure)
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  const turned = rotation % 180 !== 0
  const ratio = figure.width / figure.height
  const shape = turned ? 1 / ratio : ratio
  // The whole page in the pane (less its 24 px padding), then the zoom.
  const fit = room.w > 0 && room.h > 0 ? Math.min(room.w - 48, (room.h - 48) * shape) : 0
  const width =
    fit > 0
      ? `${Math.round(fit * INSPECT_ZOOMS[zoom])}px`
      : `${Math.round(INSPECT_ZOOMS[zoom] * 100)}%`
  const stepZoom = (dir: 1 | -1) =>
    setZoom((z) => Math.min(INSPECT_ZOOMS.length - 1, Math.max(0, z + dir)))

  // Tab and ⇧Tab go round inside the dialog.
  const keepFocus = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const stops = [
      ...e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
    ]
    const first = stops[0]
    const last = stops[stops.length - 1]
    if (!first || !last) return
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
      className="sa-inspect"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={keepFocus}
    >
      <header className="sa-inspect-head">
        <h2 className="sa-inspect-title" id={titleId}>
          {figure.alt}
        </h2>
        <fieldset className="sa-inspect-tools" aria-label="Förstoring och rotering">
          <button
            type="button"
            className="sa-tool sa-tool--icon"
            aria-label="Zooma ut"
            disabled={zoom === 0}
            onClick={() => stepZoom(-1)}
          >
            <Minus size={16} strokeWidth={1.75} aria-hidden />
          </button>
          <span className="sa-zoom-n" aria-live="polite">
            {pct(INSPECT_ZOOMS[zoom])}
          </span>
          <button
            type="button"
            className="sa-tool sa-tool--icon"
            aria-label="Zooma in"
            disabled={zoom === INSPECT_ZOOMS.length - 1}
            onClick={() => stepZoom(1)}
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className="sa-tool"
            aria-label="Rotera underlaget 90 grader"
            onClick={onRotate}
          >
            <RotateCw size={15} strokeWidth={1.75} aria-hidden />
            Rotera
          </button>
          <button
            type="button"
            className="sa-tool"
            disabled={zoom === 0}
            onClick={() => setZoom(0)}
          >
            Hela sidan
          </button>
        </fieldset>
        <button
          type="button"
          ref={closeRef}
          className="sa-chip sa-chip--primary sa-inspect-close"
          onClick={onClose}
        >
          <X size={17} strokeWidth={2} aria-hidden />
          Stäng figur
        </button>
      </header>
      <div className="sa-inspect-pane" ref={paneRef}>
        <FigurePan className="sa-inspect-scroll" label="Förstorat underlag" onZoomKey={stepZoom}>
          <FigurePage
            figure={figure}
            rotation={rotation}
            width={width}
            status="ready"
            attempt={attempt}
            onStatus={onStatus}
          />
        </FigurePan>
      </div>
    </div>
  )
}
