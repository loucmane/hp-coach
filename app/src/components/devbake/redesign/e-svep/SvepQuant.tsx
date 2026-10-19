// Svep · Kvantfråga and DTK — the quant drill as one substantial problem
// card on the neutral table, and the DTK drill as a pair: the figure page
// is the tall reference card, the question the smaller card beside it.
//
// Kvantfråga (6) keeps the whole problem on one card while you think:
// XYZ's prompt with its math rendered, KVA's condition with Kvantitet I and
// II side by side and the four fixed comparisons under them, NOG's stem
// with statements (1) and (2), the coda and the five choices. Answering
// turns the card over into the same facit run as the reading drill, with
// the problem set again above the solution (there is no passage beside it
// to look back at). Phone keeps the card alone on the table.
//
// DTK (7) lays the page on a bounded light sheet — never inverted, its
// colours its own in dark mode — inside a scrollable region that zooms
// (fit, 150, 200, 300 %), turns a quarter at a time and opens enlarged in
// a viewer; arrows and drag pan it, and while it has the focus the arrows
// belong to it. Phone: the page fills the screen with the question card
// peeking below, as the reading drill's text does.
//
// Both run on useDrillCore with the context's controller (actions.drill):
// Avsluta and the end card's Stäng leave through the controller's exit.

import { Maximize2, Minimize2, Minus, Plus, RotateCw, X } from 'lucide-react'
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type DrillCoreActions,
  type DrillCoreView,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import { useSheet, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  DrillFigure,
  DrillQuestion,
  DrillSessionView,
} from '@/components/devbake/redesign/viewModel'
import { isProseCondition, splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { Kbd, QuestionCards, SecChip } from './parts'
import {
  DoneCard,
  ExitButton,
  Faces,
  LockBar,
  letterSpan,
  type Motion,
  Options,
  PhoneFacit,
  PhonePosition,
  QuestionColumn,
  type Run,
  SheetDrill,
  Timer,
  useCardMotion,
  useDrillKeys,
  useFacitRun,
} from './SvepDrill'

/** The zoom steps: 1 fits the whole page in its card. */
const ZOOMS = [1, 1.5, 2, 3]

export function SvepQuant({
  kind,
  width,
  live,
}: {
  kind: 'quant' | 'dtk'
  width: WidthKey
  live: boolean
}) {
  const { data, actions } = useDirectionData()
  const session = kind === 'quant' ? data.drills.quant : data.drills.dtk
  const { view, act, refs } = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start: session.start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  const phone = width === 'phone'
  const q = view.question
  const figure = q.figure ?? null
  const sheet = useSheet(view)
  const lens = useLens(figure?.src)
  const [viewer, setViewer] = useState(false)
  const [panning, setPanning] = useState(false)
  const openRef = useRef<HTMLButtonElement>(null)
  const closeViewer = useCallback(() => {
    setViewer(false)
    // Back to the button that opened it (a frame later, once it is live again).
    window.requestAnimationFrame(() => openRef.current?.focus({ preventScroll: true }))
  }, [])

  const run = useFacitRun(view, act, refs, {
    frameworks: data.frameworks,
    problem: <QuantPrompt question={q} />,
  })
  const motion = useCardMotion(view, live)
  useDrillKeys({
    view,
    act,
    run,
    // The viewer owns the keys while it is open.
    live: live && !viewer,
    arrows: !panning,
    onPick: figure && phone ? () => sheet.setState((s) => (s === 'peek' ? 'open' : s)) : undefined,
    onDone: act.exit,
  })

  const label = sessionLabel(session)
  const done = (
    <DoneCard
      view={view}
      live={live}
      eyebrow={`${label} · klart`}
      about={figure ? q.source.label : null}
      primary={{ label: 'Stäng', onClick: act.exit, testId: 'rd-done-close' }}
      secondary={{ label: 'Öva igen', onClick: act.restart }}
    />
  )
  const figureCard = (inert: boolean) =>
    figure ? (
      <FigureCard
        question={q}
        figure={figure}
        lens={lens}
        phone={phone}
        inert={inert}
        openRef={openRef}
        onOpen={() => setViewer(true)}
        onPanFocus={setPanning}
      />
    ) : null

  let layout: ReactNode
  if (phone && figure) {
    layout = (
      <SheetDrill
        view={view}
        act={act}
        run={run}
        motion={motion}
        live={live}
        sheet={sheet}
        reference={figureCard}
        refLabel="Till figuren"
        toReference={() => sheet.setState('peek')}
        prompt={<QuantPrompt question={q} testId="rd-quant-prompt" peek />}
        prefix="rd-quant-option"
        finish="Slutför övningen"
        done={done}
      />
    )
  } else if (phone) {
    layout = <PhoneSolo view={view} act={act} run={run} motion={motion} live={live} done={done} />
  } else {
    layout = (
      <DeskQuant
        view={view}
        act={act}
        run={run}
        motion={motion}
        live={live}
        label={label}
        reference={figureCard(false)}
        done={done}
      />
    )
  }

  return (
    <>
      <div className="sv-qroot" inert={viewer}>
        {layout}
      </div>
      {viewer && figure ? (
        <FigureViewer question={q} figure={figure} lens={lens} onClose={closeViewer} />
      ) : null}
    </>
  )
}

/** "Kvantitativ övning"; a repetition says so, so the reader knows why the
 *  question came back. */
function sessionLabel(session: DrillSessionView): string {
  return session.request.kind === 'repetition' ? 'Repetition' : session.title
}

// ── The problem ──────────────────────────────────────────────────────

/**
 * The prompt as its section sets it, verbatim with its math rendered: KVA's
 * condition above Kvantitet I and II side by side (splitKvaPrompt), NOG's
 * stem, its two statements and the coda (parseNogPrompt), anything else as
 * one prompt. A prompt that does not split is shown whole.
 */
function QuantPrompt({
  question,
  testId,
  peek,
}: {
  question: DrillQuestion
  testId?: string
  /** The phone peek's one line of room: the plain prompt sizes down. */
  peek?: boolean
}) {
  const prompt = question.prompt ?? ''
  if (question.section === 'KVA') {
    const split = splitKvaPrompt(prompt)
    if (split) {
      return (
        <div className="sv-qprompt sv-kva" data-testid={testId}>
          {split.condition ? (
            <p className="sv-kva-cond" data-prose={String(isProseCondition(split.condition))}>
              <MathText>{split.condition}</MathText>
            </p>
          ) : null}
          <div className="sv-kva-pair">
            <p className="sv-kva-q">
              <span className="sv-kva-label">Kvantitet I</span>
              <span className="sv-kva-expr">
                <MathText>{split.kvI}</MathText>
              </span>
            </p>
            <p className="sv-kva-q">
              <span className="sv-kva-label">Kvantitet II</span>
              <span className="sv-kva-expr">
                <MathText>{split.kvII}</MathText>
              </span>
            </p>
          </div>
        </div>
      )
    }
  }
  if (question.section === 'NOG') {
    const parts = parseNogPrompt(prompt)
    if (parts) {
      return (
        <div className="sv-qprompt sv-nog" data-testid={testId}>
          <p className="sv-prompt">
            <MathText>{parts.question}</MathText>
          </p>
          <ol className="sv-nog-list">
            <li className="sv-nog-st">
              <span className="sv-nog-n" aria-hidden>
                (1)
              </span>
              <span className="sv-sr">Påstående 1: </span>
              <span className="sv-nog-text">
                <MathText>{parts.statement1}</MathText>
              </span>
            </li>
            <li className="sv-nog-st">
              <span className="sv-nog-n" aria-hidden>
                (2)
              </span>
              <span className="sv-sr">Påstående 2: </span>
              <span className="sv-nog-text">
                <MathText>{parts.statement2}</MathText>
              </span>
            </li>
          </ol>
          {parts.tail ? <p className="sv-nog-tail">{parts.tail}</p> : null}
        </div>
      )
    }
  }
  return (
    <div className="sv-qprompt" data-testid={testId} data-peek={peek ? 'true' : undefined}>
      <p className="sv-prompt">
        <MathText>{prompt}</MathText>
      </p>
    </div>
  )
}

/** The question card's face: the section and the position, the problem,
 *  the options and Svara. `still` is its picture during the turn. */
function QuantFace({
  view,
  act,
  still,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  still: boolean
}) {
  const q = view.question
  return (
    <div className="sv-card sv-qcard" data-quant={q.section}>
      <div className="sv-qcard-scroll">
        <div className="sv-qhead">
          <SecChip section={q.section} />
          <h2 className="sv-qlabel">
            Fråga {view.index + 1} <span>av {view.total}</span>
          </h2>
        </div>
        <QuantPrompt question={q} testId={still ? undefined : 'rd-quant-prompt'} />
        {q.options ? (
          <Options view={view} act={act} still={still} prefix="rd-quant-option" />
        ) : (
          <p className="sv-qmissing">Frågan saknar svarsalternativ just nu.</p>
        )}
      </div>
      {q.options ? (
        <LockBar view={view} act={act} still={still} />
      ) : (
        <div className="sv-lockbar">
          <button type="button" className="sv-btn sv-btn--tonal" onClick={act.exit}>
            Tillbaka
          </button>
        </div>
      )}
    </div>
  )
}

// ── Desktop ──────────────────────────────────────────────────────────

function DeskQuant({
  view,
  act,
  run,
  motion,
  live,
  label,
  reference,
  done,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  run: Run
  motion: Motion
  live: boolean
  label: string
  /** The figure card (DTK), or nothing: the problem card alone. */
  reference: ReactNode
  done: ReactNode
}) {
  const feedback = view.phase === 'feedback'
  const top = (
    <div className="sv-drill-top">
      <ExitButton act={act} />
      <h1 className="sv-drill-title">{label}</h1>
      {view.phase === 'done' ? (
        <span className="sv-drill-status" />
      ) : (
        <div className="sv-drill-status">
          <QuestionCards
            total={view.total}
            answered={view.results.length}
            current={feedback ? null : view.index}
          />
          <Timer seconds={view.elapsed} />
        </div>
      )}
    </div>
  )
  if (view.phase === 'done') {
    return (
      <div className="sv-drill sv-drill--done">
        {top}
        <div className="sv-done-wrap">{done}</div>
      </div>
    )
  }
  const column = (
    <QuestionColumn
      view={view}
      act={act}
      run={run}
      motion={motion}
      live={live}
      face={(still) => <QuantFace view={view} act={act} still={still} />}
      finish="Slutför övningen"
      keys={
        <p className="sv-keys">
          {letterSpan(view)}
          <span>
            <Kbd>⇧</Kbd> + bokstav stryker
          </span>
          <span>
            <Kbd>↵</Kbd> svarar
          </span>
        </p>
      }
    />
  )
  return (
    <div className="sv-drill">
      {top}
      {reference ? (
        <div className="sv-pair sv-pair--figure">
          {reference}
          {column}
        </div>
      ) : (
        <div className="sv-solo">{column}</div>
      )}
    </div>
  )
}

// ── Phone, alone on the table ────────────────────────────────────────

function PhoneSolo({
  view,
  act,
  run,
  motion,
  live,
  done,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  run: Run
  motion: Motion
  live: boolean
  done: ReactNode
}) {
  if (view.phase === 'done') {
    return (
      <div className="sv-pdrill sv-pdrill--done">
        <header className="sv-pdhead">
          <ExitButton act={act} />
        </header>
        <div className="sv-done-wrap">{done}</div>
      </div>
    )
  }
  const feedback = view.phase === 'feedback'
  // The questions still to come show as card edges under the open one.
  const waiting = feedback ? 0 : Math.min(2, view.total - view.index - 1)
  return (
    <div className="sv-pdrill sv-pdrill--solo">
      <header className="sv-pdhead">
        <ExitButton act={act} />
        <PhonePosition view={view} />
        <Timer seconds={view.elapsed} />
      </header>
      <section
        className="sv-psolo"
        data-waiting={waiting}
        aria-label={feedback ? 'Facit' : `Fråga ${view.index + 1}`}
      >
        <Faces
          feedback={feedback}
          motion={motion}
          front={(still) => <QuantFace view={view} act={act} still={still} />}
          back={() => (
            <PhoneFacit
              view={view}
              act={act}
              run={run}
              live={live}
              state="full"
              finish="Slutför övningen"
            />
          )}
        />
      </section>
    </div>
  )
}

// ── The figure ───────────────────────────────────────────────────────

type Lens = {
  zoom: number
  /** Quarter turns clockwise, 0–3. */
  turn: number
  zoomIn: () => void
  zoomOut: () => void
  rotate: () => void
  /** Back to the whole page, upright. */
  fit: () => void
}

/** How the page is shown. A question on the same page keeps the lens; a
 *  new page starts fitted and upright. */
function useLens(src: string | undefined): Lens {
  const [lens, setLens] = useState({ src, zoom: 1, turn: 0 })
  if (lens.src !== src) setLens({ src, zoom: 1, turn: 0 })
  const step = (d: 1 | -1) =>
    setLens((l) => {
      const at = Math.max(0, ZOOMS.indexOf(l.zoom))
      return { ...l, zoom: ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, at + d))] }
    })
  return {
    zoom: lens.zoom,
    turn: lens.turn,
    zoomIn: () => step(1),
    zoomOut: () => step(-1),
    rotate: () => setLens((l) => ({ ...l, turn: (l.turn + 1) % 4 })),
    fit: () => setLens((l) => ({ ...l, zoom: 1, turn: 0 })),
  }
}

/**
 * The page on its light sheet, inside a scrollable region: at 1 it fits
 * the region whole, above 1 it scrolls (arrows when focused, a drag with
 * the mouse, the wheel or a finger). Turned a quarter, the page's box turns
 * with it, so the region keeps the whole page in view.
 */
function FigureSheet({
  figure,
  lens,
  label,
  onPanFocus,
}: {
  figure: DrillFigure
  lens: Lens
  label: string
  onPanFocus?: (focused: boolean) => void
}) {
  const ratio = figure.width / figure.height
  const turned = lens.turn % 2 === 1
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || lens.zoom === 1) return
    const box = e.currentTarget
    drag.current = { x: e.clientX, y: e.clientY, left: box.scrollLeft, top: box.scrollTop }
    box.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    e.currentTarget.scrollLeft = d.left - (e.clientX - d.x)
    e.currentTarget.scrollTop = d.top - (e.clientY - d.y)
  }
  const end = () => {
    drag.current = null
  }
  // A page that fails to load says so and offers another try; a new page
  // (another src) starts afresh.
  const [failed, setFailed] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  return (
    <section
      className="sv-fig-scroll"
      aria-label={label}
      data-zoom={lens.zoom === 1 ? 'fit' : 'in'}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must take the keyboard (WCAG 2.1.1)
      tabIndex={0}
      onFocus={() => onPanFocus?.(true)}
      onBlur={() => onPanFocus?.(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {failed === figure.src ? (
        <div className="sv-fig-failed" role="alert">
          <p>Underlaget kunde inte laddas.</p>
          <button
            type="button"
            className="sv-btn sv-btn--tonal"
            onClick={() => {
              setFailed(null)
              setAttempt((a) => a + 1)
            }}
          >
            Försök igen
          </button>
        </div>
      ) : (
        <div
          className="sv-fig-page"
          data-turned={String(turned)}
          style={
            {
              '--sv-fig-r': turned ? 1 / ratio : ratio,
              '--sv-fig-ratio': ratio,
              '--sv-fig-zoom': lens.zoom,
              '--sv-fig-rot': `${lens.turn * 90}deg`,
            } as CSSProperties
          }
        >
          <img
            key={attempt}
            src={`/${figure.src}`}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            draggable={false}
            onError={() => setFailed(figure.src)}
          />
        </div>
      )}
    </section>
  )
}

/** The lens's controls: quiet, beside the page, never a filled action. */
function LensTools({
  lens,
  onOpen,
  openRef,
  compact,
}: {
  lens: Lens
  /** The viewer's way in (absent inside the viewer). */
  onOpen?: () => void
  openRef?: { current: HTMLButtonElement | null }
  compact?: boolean
}) {
  const changed = lens.zoom !== 1 || lens.turn !== 0
  return (
    <div className="sv-lens">
      <button
        type="button"
        className="sv-lens-btn"
        aria-label="Zooma ut"
        disabled={lens.zoom === ZOOMS[0]}
        onClick={lens.zoomOut}
      >
        <Minus size={17} strokeWidth={2} aria-hidden />
      </button>
      <output className="sv-lens-zoom" aria-live="polite">
        {lens.zoom === 1 ? 'Hela sidan' : `${Math.round(lens.zoom * 100)} %`}
      </output>
      <button
        type="button"
        className="sv-lens-btn"
        aria-label="Zooma in"
        disabled={lens.zoom === ZOOMS[ZOOMS.length - 1]}
        onClick={lens.zoomIn}
      >
        <Plus size={17} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className="sv-lens-btn"
        aria-label="Vrid ett kvarts varv"
        title="Vrid ett kvarts varv"
        onClick={lens.rotate}
      >
        <RotateCw size={17} strokeWidth={2} aria-hidden />
        {compact ? null : <span>Vrid</span>}
      </button>
      {changed ? (
        <button
          type="button"
          className="sv-lens-btn"
          aria-label={compact ? 'Anpassa: hela sidan, rak' : undefined}
          title="Anpassa: hela sidan, rak"
          onClick={lens.fit}
        >
          {compact ? <Minimize2 size={16} strokeWidth={2} aria-hidden /> : <span>Anpassa</span>}
        </button>
      ) : null}
      {onOpen ? (
        <button
          type="button"
          className="sv-lens-btn sv-lens-btn--open"
          ref={openRef}
          aria-label={compact ? 'Förstora underlaget' : undefined}
          onClick={onOpen}
        >
          <Maximize2 size={16} strokeWidth={2} aria-hidden />
          {compact ? null : <span>Förstora</span>}
        </button>
      ) : null}
    </div>
  )
}

function FigureCard({
  question,
  figure,
  lens,
  phone,
  inert,
  openRef,
  onOpen,
  onPanFocus,
}: {
  question: DrillQuestion
  figure: DrillFigure
  lens: Lens
  phone: boolean
  inert: boolean
  openRef: { current: HTMLButtonElement | null }
  onOpen: () => void
  onPanFocus: (focused: boolean) => void
}) {
  return (
    <div className="sv-card sv-fcard" data-testid="rd-figure" inert={inert}>
      <div className="sv-fcard-head">
        <SecChip section={question.section} />
        <h2 className="sv-fcard-title">Underlag</h2>
        {phone ? null : <span className="sv-fcard-src">{question.source.label}</span>}
        {phone ? <LensTools lens={lens} onOpen={onOpen} openRef={openRef} compact /> : null}
      </div>
      <FigureSheet
        figure={figure}
        lens={lens}
        label={`Underlaget till uppgift ${question.number}`}
        onPanFocus={onPanFocus}
      />
      {phone ? null : (
        <div className="sv-fcard-foot">
          <LensTools lens={lens} onOpen={onOpen} openRef={openRef} />
        </div>
      )}
    </div>
  )
}

/**
 * The page enlarged over the whole stage: a labelled dialog that keeps the
 * focus inside, with the lens's controls and Stäng. Esc closes it (a local
 * aid — it never leaves the drill) and the focus goes back to Förstora.
 */
function FigureViewer({
  question,
  figure,
  lens,
  onClose,
}: {
  question: DrillQuestion
  figure: DrillFigure
  lens: Lens
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !ref.current) return
    const stops = [
      ...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
    ]
    if (stops.length === 0) return
    const first = stops[0]
    const last = stops[stops.length - 1]
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
      className="sv-viewer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={ref}
      onKeyDown={onKeyDown}
    >
      <div className="sv-card sv-viewer-card">
        <div className="sv-viewer-bar">
          <h2 className="sv-viewer-title" id={titleId}>
            Underlaget <span>· uppgift {question.number}</span>
          </h2>
          <LensTools lens={lens} />
          <button
            type="button"
            className="sv-icon-btn sv-viewer-close"
            ref={closeRef}
            aria-label="Stäng förstoringen"
            onClick={onClose}
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <FigureSheet
          figure={figure}
          lens={lens}
          label={`Underlaget förstorat, uppgift ${question.number}`}
        />
      </div>
    </div>
  )
}
