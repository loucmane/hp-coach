import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useDrillCore } from '@/components/devbake/redesign/drillCore'
import { type DirectionProps, useKeyMap, useSheet } from '@/components/devbake/redesign/r1Kit'
import type {
  DrillFigure,
  DrillQuestion,
  DrillSessionView,
} from '@/components/devbake/redesign/viewModel'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { LjuskaglaFeedback } from './LjuskaglaFeedback'
import { DrillHead } from './LjuskaglaNav'
import { AnswerRows } from './LjuskaglaParts'

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 1.25

/** A quant prompt in its parts: KVA's condition and two quantities, NOG's
 *  question, two statements and the line that leads into its options, or
 *  the prompt whole when it does not split (never cut). */
type ProblemParts =
  | { kind: 'kva'; condition: string; first: string; second: string }
  | { kind: 'nog'; question: string; first: string; second: string; lead: string | null }
  | { kind: 'whole'; text: string }

function problemParts(question: DrillQuestion): ProblemParts {
  const prompt = question.prompt ?? ''
  if (question.section === 'KVA') {
    const kva = splitKvaPrompt(prompt)
    if (kva) return { kind: 'kva', condition: kva.condition, first: kva.kvI, second: kva.kvII }
  }
  if (question.section === 'NOG') {
    const nog = parseNogPrompt(prompt)
    if (nog) {
      return {
        kind: 'nog',
        question: nog.question,
        first: nog.statement1,
        second: nog.statement2,
        lead: nog.tail,
      }
    }
  }
  return { kind: 'whole', text: prompt }
}

/** The problem in one pool of light: the quantities, or both statements,
 *  side by side or stacked but always read together. */
function Problem({ parts }: { parts: ProblemParts }) {
  return (
    <div className="lj-problem" data-testid="rd-quant-prompt">
      {parts.kind === 'kva' ? (
        <>
          {parts.condition && (
            <p className="lj-problem-text">
              <MathText>{parts.condition}</MathText>
            </p>
          )}
          <dl className="lj-quantities">
            <div>
              <dt>Kvantitet I</dt>
              <dd>
                <MathText>{parts.first}</MathText>
              </dd>
            </div>
            <div>
              <dt>Kvantitet II</dt>
              <dd>
                <MathText>{parts.second}</MathText>
              </dd>
            </div>
          </dl>
        </>
      ) : parts.kind === 'nog' ? (
        <>
          <p className="lj-problem-text">
            <MathText>{parts.question}</MathText>
          </p>
          <ol className="lj-statements">
            <li>
              <span className="lj-statement-label">(1)</span>
              <span>
                <MathText>{parts.first}</MathText>
              </span>
            </li>
            <li>
              <span className="lj-statement-label">(2)</span>
              <span>
                <MathText>{parts.second}</MathText>
              </span>
            </li>
          </ol>
        </>
      ) : (
        <p className="lj-problem-text">
          <MathText>{parts.text}</MathText>
        </p>
      )}
    </div>
  )
}

/** The figure page at `zoom` × the box's width, upright or in quarter
 *  turns. The box takes the turned page's shape, so nothing is clipped. */
function FigurePage({
  figure,
  rotation,
  zoom = 1,
  alt,
}: {
  figure: DrillFigure
  rotation: number
  zoom?: number
  alt: string
}) {
  const ratio = figure.width / figure.height
  const turned = rotation % 180 !== 0
  return (
    <div
      className="lj-figure-page"
      data-kind={figure.kind}
      style={{ width: `${zoom * 100}%`, aspectRatio: String(turned ? 1 / ratio : ratio) }}
    >
      <img
        src={`/${figure.src}`}
        alt={alt}
        width={figure.width}
        height={figure.height}
        draggable={false}
        style={{
          width: turned ? `${ratio * 100}%` : '100%',
          height: turned ? `${100 / ratio}%` : '100%',
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }}
      />
    </div>
  )
}

type FigureView = { src: string; rotation: number; zoom: number }

/** The figure's turn and zoom. Questions on the same page keep them; a new
 *  page starts upright and fitted. */
function useFigureView(figure: DrillFigure | null | undefined) {
  const [kept, setKept] = useState<FigureView | null>(null)
  const current: FigureView | null = figure
    ? kept?.src === figure.src
      ? kept
      : { src: figure.src, rotation: 0, zoom: 1 }
    : null
  const rotate = () => {
    if (current) setKept({ ...current, rotation: (current.rotation + 90) % 360 })
  }
  const zoomBy = (factor: number) => {
    if (current) {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor))
      setKept({ ...current, zoom: Math.round(zoom * 100) / 100 })
    }
  }
  const fit = () => {
    if (current) setKept({ ...current, zoom: 1 })
  }
  return { view: current, rotate, zoomBy, fit }
}

function FigurePane({
  figure,
  source,
  block,
  rotation,
  onRotate,
  onEnlarge,
  enlargeRef,
}: {
  figure: DrillFigure
  source: string
  block: { n: number; total: number } | null
  rotation: number
  onRotate: () => void
  onEnlarge: () => void
  enlargeRef: RefObject<HTMLButtonElement | null>
}) {
  return (
    <div className="lj-figure" data-testid="rd-figure">
      <div className="lj-figure-head">
        <p className="lj-eyebrow">Underlag · {source}</p>
        {block && (
          <p className="lj-figure-block">
            Samma sida · fråga {block.n} av {block.total}
          </p>
        )}
      </div>
      <section
        className="lj-figure-scroll"
        // Arrows scroll the page here: the bake-off switcher leaves them alone.
        data-rd-keyscope=""
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling page must be reachable to scroll it with the keyboard
        tabIndex={0}
        aria-label="Underlaget. Rulla för att se hela sidan."
      >
        <FigurePage figure={figure} rotation={rotation} alt={figure.alt} />
      </section>
      <div className="lj-figure-tools">
        <button type="button" className="lj-tool" ref={enlargeRef} onClick={onEnlarge}>
          <Maximize2 size={18} aria-hidden />
          <span>Förstora figur</span>
        </button>
        <button
          type="button"
          className="lj-tool"
          aria-label="Rotera figuren 90 grader"
          onClick={onRotate}
        >
          <RotateCw size={18} aria-hidden />
          <span>Rotera</span>
        </button>
      </div>
    </div>
  )
}

/**
 * The enlarged figure, inside the direction (so its theme reaches it) and
 * over the whole drill: a dialog with its own close, zoom and turn. Focus
 * starts on Stäng and stays inside; Escape closes it and never the drill.
 */
function FigureViewer({
  figure,
  source,
  view,
  onZoom,
  onRotate,
  onFit,
  onClose,
}: {
  figure: DrillFigure
  source: string
  view: FigureView
  onZoom: (factor: number) => void
  onRotate: () => void
  onFit: () => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => close.current?.focus(), [])
  const keys = useRef({ onZoom, onRotate, onClose })
  keys.current = { onZoom, onRotate, onClose }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = keys.current
      const handled =
        e.key === 'Escape'
          ? k.onClose
          : e.key === '+' || e.key === '='
            ? () => k.onZoom(ZOOM_STEP)
            : e.key === '-'
              ? () => k.onZoom(1 / ZOOM_STEP)
              : e.key === 'r' || e.key === 'R'
                ? k.onRotate
                : null
      if (!handled) return
      e.preventDefault()
      e.stopImmediatePropagation()
      handled()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  const trap = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || !dialog.current) return
    // One selector over every element keeps document order (a selector list
    // need not, in every engine).
    const stops = [...dialog.current.querySelectorAll<HTMLElement>('*')].filter((el) =>
      el.matches('button:not(:disabled), [tabindex="0"]'),
    )
    const first = stops[0]
    const last = stops[stops.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }
  return (
    <div
      className="lj-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Förstorat underlag"
      data-testid="rd-figure-viewer"
      data-rd-keyscope=""
      ref={dialog}
      onKeyDown={trap}
    >
      <header className="lj-viewer-head">
        <p className="lj-eyebrow">Underlag · {source}</p>
        <button type="button" className="lj-tool" ref={close} onClick={onClose}>
          <X size={18} aria-hidden />
          <span>Stäng</span>
        </button>
      </header>
      <section
        className="lj-viewer-scroll"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling page must be reachable to pan it with the keyboard
        tabIndex={0}
        aria-label="Det förstorade underlaget. Rulla för att panorera."
      >
        <FigurePage
          figure={figure}
          rotation={view.rotation}
          zoom={view.zoom}
          alt={`${figure.alt}, förstorat`}
        />
      </section>
      <fieldset className="lj-viewer-tools" aria-label="Förstoring och vridning">
        <button
          type="button"
          className="lj-tool"
          aria-label="Zooma ut"
          disabled={view.zoom <= MIN_ZOOM}
          onClick={() => onZoom(1 / ZOOM_STEP)}
        >
          <ZoomOut size={18} aria-hidden />
        </button>
        <span className="lj-zoom-level" aria-live="polite">
          {Math.round(view.zoom * 100)} %
        </span>
        <button
          type="button"
          className="lj-tool"
          aria-label="Zooma in"
          disabled={view.zoom >= MAX_ZOOM}
          onClick={() => onZoom(ZOOM_STEP)}
        >
          <ZoomIn size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="lj-tool"
          aria-label="Rotera figuren 90 grader"
          onClick={onRotate}
        >
          <RotateCw size={18} aria-hidden />
          <span>Rotera</span>
        </button>
        <button type="button" className="lj-tool" disabled={view.zoom === 1} onClick={onFit}>
          Hela bredden
        </button>
      </fieldset>
    </div>
  )
}

function minutes(seconds: number): string {
  if (seconds < 60) return 'under en minut'
  const m = Math.round(seconds / 60)
  return `${m} ${m === 1 ? 'minut' : 'minuter'}`
}

/**
 * A quantitative drill in focus mode, any question shape: XYZ with its
 * math, KVA's two quantities, NOG's two statements, or a DTK page. A
 * problem sits in one broad lit field beside a narrower answer column (on a
 * phone: one scroll, the action reserved below it). A figure page takes the
 * wider column with the question beside it (on a phone: the page first and
 * the question in a sheet). Select, then confirm; feedback takes the answer
 * column, and the problem or page stays in view.
 */
export function LjuskaglaQuant({
  session,
  ...props
}: DirectionProps & { session: DrillSessionView }) {
  const { actions } = useDirectionData()
  const { view, act, refs } = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start: session.start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live: props.live,
  })
  const sheet = useSheet(view)
  const [accountOpen, setAccountOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const figureView = useFigureView(view.question.figure)
  const enlargeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const answersRef = useRef<HTMLDivElement>(null)
  const questionId = useId()
  const phone = props.width === 'phone'
  const q = view.question
  const feedback = view.phase === 'feedback'
  const done = view.phase === 'done'
  const figure = q.figure ?? null
  const figureLed = figure?.kind === 'raster'
  const sheetMode = phone && figureLed
  const sheetVisible = !sheetMode || sheet.state !== 'peek'
  const parts = problemParts(q)
  const lead = parts.kind === 'nog' && parts.lead ? parts.lead : 'Välj svar'
  const letters = view.letters
  const range = letters.length ? `${letters[0]}–${letters[letters.length - 1]}` : ''
  const sameFigure = figure ? session.questions.filter((x) => x.figure?.src === figure.src) : []
  const block =
    sameFigure.length > 1 ? { n: sameFigure.indexOf(q) + 1, total: sameFigure.length } : null

  // A new question starts at the top; a verdict on a phone scrolls into view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: index and phase reset the pane
  useEffect(() => {
    const box = scrollRef.current
    if (!box) return
    const anchor = answersRef.current
    box.scrollTop =
      feedback && phone && !figureLed && anchor ? Math.max(0, anchor.offsetTop - 12) : 0
  }, [view.index, view.phase])

  // Closing the enlarged figure hands focus back to Förstora figur.
  useEffect(() => {
    if (viewerOpen || !returnFocus.current) return
    returnFocus.current = false
    enlargeRef.current?.focus()
  }, [viewerOpen])
  const closeViewer = useCallback(() => {
    returnFocus.current = true
    setViewerOpen(false)
  }, [])

  const toOva = () => actions.go('ova')
  const advance = () => {
    if (done) toOva()
    else if (feedback) act.next()
    else if (sheetMode && sheet.state === 'peek') sheet.setState('open')
    else act.lock()
  }
  const keys: Record<string, () => void> = { Enter: advance, ' ': advance }
  if (!feedback && !done) {
    for (const letter of letters) {
      keys[letter.toLowerCase()] = () => {
        if (sheetMode) sheet.setState('open')
        act.select(letter)
      }
      keys[`Shift+${letter.toLowerCase()}`] = () => act.toggleEliminate(letter)
    }
  }
  useKeyMap(keys, props.live && !accountOpen && !viewerOpen)

  const answers =
    q.options == null ? (
      <div className="lj-unavailable">
        <p>Frågan saknar fullständig text.</p>
        <button className="lj-text-button" type="button" onClick={toOva}>
          Till Öva <ArrowRight size={16} aria-hidden />
        </button>
      </div>
    ) : feedback ? (
      <LjuskaglaFeedback view={view} act={act} refs={refs} />
    ) : (
      <>
        {figureLed ? (
          <h2 className="lj-prompt" data-testid="rd-quant-prompt">
            <MathText>{q.prompt}</MathText>
          </h2>
        ) : (
          <p className="lj-answer-lead">{lead}</p>
        )}
        <AnswerRows
          view={view}
          act={act}
          testId="rd-quant-option"
          label={figureLed ? 'Svarsalternativ' : lead}
        />
      </>
    )

  // A question without options cannot be answered: no action to confirm.
  const actionBar = q.options != null && (
    <footer className="lj-action-bar">
      <button
        type="button"
        className="lj-primary"
        data-testid={feedback ? 'rd-next' : 'rd-lock'}
        disabled={!feedback && !view.selected}
        onClick={feedback ? () => act.next() : () => act.lock()}
      >
        <span>
          {feedback ? 'Nästa' : view.selected ? `Svara ${view.selected}` : 'Välj ett svar'}
        </span>
        {feedback ? <ArrowRight size={20} aria-hidden /> : <kbd aria-hidden>↵</kbd>}
      </button>
      {!phone && (
        <p>
          {feedback
            ? 'Ta med dig tekniken till nästa fråga.'
            : `${range} välj · ⇧ + bokstav stryk · Enter svara`}
        </p>
      )}
    </footer>
  )

  const figurePane = figure && figureView.view && (
    <FigurePane
      figure={figure}
      source={q.source.label}
      block={block}
      rotation={figureView.view.rotation}
      onRotate={figureView.rotate}
      onEnlarge={() => setViewerOpen(true)}
      enlargeRef={enlargeRef}
    />
  )
  const eyebrow = (
    <p className="lj-eyebrow">
      Fråga {view.index + 1} av {view.total} · {q.section}
    </p>
  )

  let body: ReactNode
  if (done) {
    body = (
      <div className="lj-done" data-testid="rd-done">
        <Check size={32} strokeWidth={1.5} aria-hidden />
        <p className="lj-eyebrow">Övningen är klar</p>
        <h1>En stund som räknas.</h1>
        <p>
          {view.results.filter((result) => result.correct).length} av {view.total} rätt ·{' '}
          {minutes(view.elapsed)}
        </p>
        <p>{session.title}</p>
        <button className="lj-primary" type="button" data-testid="rd-done-next" onClick={toOva}>
          Till Öva
          <ArrowRight size={20} aria-hidden />
        </button>
      </div>
    )
  } else if (figureLed) {
    body = (
      <div className="lj-reading-layout lj-figure-layout">
        <div className="lj-reading-column" inert={sheetMode && sheet.state === 'full'}>
          {figurePane}
        </div>
        <section
          className="lj-question"
          data-testid={sheetMode ? 'rd-sheet' : 'rd-question'}
          data-state={sheetMode ? sheet.state : 'open'}
          aria-label={feedback ? 'Facit och förklaring' : `Fråga ${view.index + 1}`}
        >
          {sheetMode && (
            <button
              type="button"
              className="lj-sheet-handle"
              {...sheet.grab}
              aria-controls={questionId}
              aria-expanded={sheetVisible}
            >
              <span className="lj-grip" aria-hidden />
              <span>
                {sheetVisible
                  ? 'Visa underlaget'
                  : feedback
                    ? 'Tillbaka till facit'
                    : 'Visa frågan'}
                {sheetVisible ? (
                  <ChevronDown size={16} aria-hidden />
                ) : (
                  <ChevronUp size={16} aria-hidden />
                )}
              </span>
            </button>
          )}
          <div className="lj-question-scroll" id={questionId} ref={scrollRef}>
            {eyebrow}
            {sheetVisible ? (
              answers
            ) : feedback ? (
              <p className="lj-peek-prompt">Rätt svar: {q.answer} · öppna förklaringen</p>
            ) : (
              <p className="lj-peek-prompt" data-testid="rd-quant-prompt">
                <MathText>{q.prompt}</MathText>
              </p>
            )}
          </div>
          {sheetVisible && actionBar}
        </section>
      </div>
    )
  } else if (phone) {
    body = (
      <div className="lj-quant-phone">
        <div className="lj-quant-scroll" ref={scrollRef}>
          {eyebrow}
          <Problem parts={parts} />
          {figurePane}
          <div className="lj-quant-answers" ref={answersRef}>
            {answers}
          </div>
        </div>
        {actionBar}
      </div>
    )
  } else {
    body = (
      <div className="lj-quant-layout">
        <div className="lj-problem-column" key={q.qid}>
          {eyebrow}
          <Problem parts={parts} />
          <p className="lj-problem-source">{q.source.label}</p>
          {figurePane}
        </div>
        <section
          className="lj-question"
          data-testid="rd-question"
          aria-label={feedback ? 'Facit och förklaring' : `Fråga ${view.index + 1}`}
        >
          <div className="lj-question-scroll" ref={scrollRef}>
            {answers}
          </div>
          {actionBar}
        </section>
      </div>
    )
  }

  return (
    <div className="lj-drill" data-shape={figureLed ? 'figure' : 'problem'}>
      <DrillHead
        section={q.section}
        position={done ? view.total : view.index + 1}
        total={view.total}
        elapsed={props.live || view.elapsed > 0 ? view.elapsed : null}
        progress={(view.index + (feedback || done ? 1 : 0)) / view.total}
        onExit={act.exit}
        theme={props.theme}
        onTheme={props.onTheme}
        onAccountOpenChange={setAccountOpen}
        inert={viewerOpen}
      />
      <div className="lj-drill-body" inert={viewerOpen}>
        {body}
      </div>
      {viewerOpen && figure && figureView.view && (
        <FigureViewer
          figure={figure}
          source={q.source.label}
          view={figureView.view}
          onZoom={figureView.zoomBy}
          onRotate={figureView.rotate}
          onFit={figureView.fit}
          onClose={closeViewer}
        />
      )}
    </div>
  )
}
