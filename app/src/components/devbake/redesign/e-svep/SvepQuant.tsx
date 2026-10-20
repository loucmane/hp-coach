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
// belong to it: they pan it and go no further (not to the facit run, not
// to the bake-off's screen keys). In the viewer they pan the page wherever
// the focus is. Phone: the page fills the screen with the question card
// peeking below, as the reading drill's text does.
//
// A question that needs pictures — its page, its picture options — cannot
// be answered until they have loaded: Svara, Enter and Space all wait. The
// drill keeps each picture's load by src (a page shared by consecutive
// questions stays loaded); a failed one says so and offers another try,
// and a DTK question without its page says that and offers the way back.
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
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type DrillCoreActions,
  type DrillCoreView,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import { isForeignKey, useSheet, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  DrillFigure,
  DrillQuestion,
  DrillSessionView,
} from '@/components/devbake/redesign/viewModel'
import { isProseCondition, splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { cap, Kbd, QuestionCards, SecChip, word } from './parts'
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
  type Pictures,
  QuestionColumn,
  type Run,
  SheetDrill,
  Timer,
  useCardMotion,
  useDrillKeys,
  useFacitRun,
  type Wait,
} from './SvepDrill'

/** The zoom steps: 1 fits the whole page in its card. */
const ZOOMS = [1, 1.5, 2, 3]

/** How far one press of an arrow pans the page (px). */
const PAN_STEP = 48

const PAN: Partial<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

/**
 * An arrow pans the page's region (`box`) one step and is marked used, so
 * neither the drill's run nor the bake-off's screen keys take it and
 * nothing around the page scrolls instead. The step is instant: quick
 * presses add up (a smooth scroll would cut the one before it short).
 * True when it was an arrow.
 */
function panKey(e: ReactKeyboardEvent<Element>, box: HTMLElement | null): boolean {
  const step = PAN[e.key]
  if (!step || e.defaultPrevented || isForeignKey(e.nativeEvent)) return false
  e.preventDefault()
  if (box && typeof box.scrollBy === 'function') {
    box.scrollBy({ left: step[0] * PAN_STEP, top: step[1] * PAN_STEP, behavior: 'auto' })
  }
  return true
}

/** The drill's pictures (Pictures), and another try for the ones failed. */
type DrillPictures = Pictures & { retry: (srcs: readonly string[]) => void }

function usePictures(): DrillPictures {
  const [pics, setPics] = useState<Pick<Pictures, 'state' | 'attempt'>>({
    state: {},
    attempt: {},
  })
  const report = useCallback(
    (src: string, s: 'ready' | 'error') =>
      setPics((p) => (p.state[src] === s ? p : { ...p, state: { ...p.state, [src]: s } })),
    [],
  )
  const retry = useCallback(
    (srcs: readonly string[]) =>
      setPics((p) => {
        const failed = srcs.filter((src) => p.state[src] === 'error')
        if (failed.length === 0) return p
        const state = { ...p.state }
        const attempt = { ...p.attempt }
        for (const src of failed) {
          state[src] = 'loading'
          attempt[src] = (attempt[src] ?? 0) + 1
        }
        return { state, attempt }
      }),
    [],
  )
  return { ...pics, report, retry }
}

/**
 * Whether the open question can be answered, and what Svara's line says
 * while it cannot. A DTK question without its page never can; any other
 * waits until every picture it needs (its page, its picture options) has
 * loaded. A failure is said at once; a picture on its way only once a
 * choice would otherwise be answered, so a quick load says nothing.
 */
function gateFor(
  q: DrillQuestion,
  pictures: DrillPictures,
  missing: boolean,
  chosen: boolean,
): { open: boolean; wait: Wait | null } {
  if (missing) return { open: false, wait: { text: 'Frågan kan inte besvaras utan underlaget.' } }
  const { state } = pictures
  const page = q.figure?.src
  const options = (q.options ?? []).flatMap((o) => (o.figure ? [o.figure.src] : []))
  // A failed page says so on its own card, with its own try again.
  if (page && state[page] === 'error') {
    return { open: false, wait: { text: 'Underlaget behövs för att svara.' } }
  }
  const failed = options.filter((src) => state[src] === 'error').length
  if (failed > 0) {
    const text =
      failed === 1 ? 'En bild kunde inte laddas.' : `${cap(word(failed))} bilder kunde inte laddas.`
    return { open: false, wait: { text, retry: () => pictures.retry(options) } }
  }
  if (page && state[page] !== 'ready') {
    return { open: false, wait: chosen ? { text: 'Väntar på underlaget.' } : null }
  }
  if (options.some((src) => state[src] !== 'ready')) {
    return { open: false, wait: chosen ? { text: 'Väntar på bilderna.' } : null }
  }
  return { open: true, wait: null }
}

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
  const {
    view,
    act: core,
    refs,
  } = useDrillCore({
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
  // A DTK question is read off its page: without one it is never graded.
  const missing = !figure && q.section === 'DTK'
  const pictures = usePictures()
  const gate = gateFor(q, pictures, missing, view.selected != null)
  // Every way to answer — Svara, Enter, Space — goes through the gate.
  const act: DrillCoreActions = { ...core, lock: () => (gate.open ? core.lock() : false) }
  const wait = view.phase === 'question' ? gate.wait : null
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
  // The figure card: the page, or the word that it is missing.
  const reference = figure != null || missing
  useDrillKeys({
    view,
    act,
    run,
    // The viewer owns the keys while it is open.
    live: live && !viewer,
    arrows: !panning,
    onPick:
      reference && phone ? () => sheet.setState((s) => (s === 'peek' ? 'open' : s)) : undefined,
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
  const retryPage = () => {
    if (figure) pictures.retry([figure.src])
  }
  const figureCard = (inert: boolean) =>
    reference ? (
      <FigureCard
        question={q}
        figure={figure}
        lens={lens}
        phone={phone}
        inert={inert}
        openRef={openRef}
        onOpen={() => setViewer(true)}
        onPanFocus={setPanning}
        pictures={pictures}
        onRetry={retryPage}
        onBack={act.exit}
      />
    ) : null
  const face = (still: boolean) => (
    <QuantFace view={view} act={act} still={still} pictures={pictures} wait={wait} />
  )

  let layout: ReactNode
  if (phone && reference) {
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
        pictures={pictures}
        wait={wait}
        finish="Slutför övningen"
        done={done}
      />
    )
  } else if (phone) {
    layout = (
      <PhoneSolo
        view={view}
        act={act}
        run={run}
        motion={motion}
        live={live}
        face={face}
        done={done}
      />
    )
  } else {
    layout = (
      <DeskQuant
        view={view}
        act={act}
        run={run}
        motion={motion}
        live={live}
        label={label}
        face={face}
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
        <FigureViewer
          question={q}
          figure={figure}
          lens={lens}
          pictures={pictures}
          onRetry={retryPage}
          onClose={closeViewer}
        />
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
 *  the options and Svara (which says why it waits, when it does). `still`
 *  is its picture during the turn. */
function QuantFace({
  view,
  act,
  still,
  pictures,
  wait,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  still: boolean
  pictures: Pictures
  wait: Wait | null
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
          <Options
            view={view}
            act={act}
            still={still}
            prefix="rd-quant-option"
            pictures={pictures}
          />
        ) : (
          <p className="sv-qmissing">Frågan saknar svarsalternativ just nu.</p>
        )}
      </div>
      {q.options ? (
        <LockBar view={view} act={act} still={still} wait={wait} />
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
  face,
  reference,
  done,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  run: Run
  motion: Motion
  live: boolean
  label: string
  /** The question card's face (QuantFace). */
  face: (still: boolean) => ReactNode
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
      face={face}
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
  face,
  done,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  run: Run
  motion: Motion
  live: boolean
  /** The question card's face (QuantFace). */
  face: (still: boolean) => ReactNode
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
          front={face}
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
 * with it, so the region keeps the whole page in view. Its load is the
 * drill's (`pictures`): a page that fails says so and offers another try.
 */
function FigureSheet({
  figure,
  lens,
  label,
  pictures,
  onRetry,
  onPanFocus,
  boxRef,
}: {
  figure: DrillFigure
  lens: Lens
  label: string
  pictures: Pictures
  onRetry: () => void
  onPanFocus?: (focused: boolean) => void
  boxRef?: { current: HTMLElement | null }
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
  const { report } = pictures
  const failed = pictures.state[figure.src] === 'error'
  // Each try mounts a fresh image.
  const attempt = pictures.attempt[figure.src] ?? 0
  const img = useRef<HTMLImageElement>(null)
  // A page the browser already holds may have loaded before anyone
  // listened: it counts at once.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a retry mounts a fresh image
  useLayoutEffect(() => {
    const el = img.current
    if (el?.complete && el.naturalWidth > 0) report(figure.src, 'ready')
  }, [attempt, figure.src, report])
  return (
    <section
      ref={boxRef}
      className="sv-fig-scroll"
      aria-label={label}
      data-zoom={lens.zoom === 1 ? 'fit' : 'in'}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must take the keyboard (WCAG 2.1.1)
      tabIndex={0}
      onFocus={() => onPanFocus?.(true)}
      onBlur={() => onPanFocus?.(false)}
      onKeyDown={(e) => panKey(e, e.currentTarget)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {failed ? (
        <div className="sv-fig-failed" role="alert">
          <p>Underlaget kunde inte laddas.</p>
          <button type="button" className="sv-btn sv-btn--tonal" onClick={onRetry}>
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
            ref={img}
            src={`/${figure.src}`}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            draggable={false}
            onLoad={() => report(figure.src, 'ready')}
            onError={() => report(figure.src, 'error')}
          />
        </div>
      )}
    </section>
  )
}

/** A DTK question without its page: said plainly, with the way back —
 *  there is nothing to answer it from. */
function MissingPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="sv-fig-scroll" data-zoom="fit">
      <div className="sv-fig-failed">
        <p>Underlaget saknas just nu.</p>
        <button type="button" className="sv-btn sv-btn--tonal" onClick={onBack}>
          Tillbaka
        </button>
      </div>
    </div>
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
  pictures,
  onRetry,
  onBack,
}: {
  question: DrillQuestion
  /** Null: a DTK question without its page (no lens, the way back). */
  figure: DrillFigure | null
  lens: Lens
  phone: boolean
  inert: boolean
  openRef: { current: HTMLButtonElement | null }
  onOpen: () => void
  onPanFocus: (focused: boolean) => void
  pictures: Pictures
  onRetry: () => void
  onBack: () => void
}) {
  return (
    <div className="sv-card sv-fcard" data-testid="rd-figure" inert={inert}>
      <div className="sv-fcard-head">
        <SecChip section={question.section} />
        <h2 className="sv-fcard-title">Underlag</h2>
        {phone ? null : <span className="sv-fcard-src">{question.source.label}</span>}
        {phone && figure ? (
          <LensTools lens={lens} onOpen={onOpen} openRef={openRef} compact />
        ) : null}
      </div>
      {figure ? (
        <FigureSheet
          figure={figure}
          lens={lens}
          label={`Underlaget till uppgift ${question.number}`}
          pictures={pictures}
          onRetry={onRetry}
          onPanFocus={onPanFocus}
        />
      ) : (
        <MissingPage onBack={onBack} />
      )}
      {phone || !figure ? null : (
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
 * The arrows pan the page wherever the focus is in it, and go no further.
 */
function FigureViewer({
  question,
  figure,
  lens,
  pictures,
  onRetry,
  onClose,
}: {
  question: DrillQuestion
  figure: DrillFigure
  lens: Lens
  pictures: Pictures
  onRetry: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
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
    // An arrow anywhere in the viewer pans the page (one pressed on the
    // page itself, the page has taken already).
    if (panKey(e, sheetRef.current)) return
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
          pictures={pictures}
          onRetry={onRetry}
          boxRef={sheetRef}
        />
      </div>
    </div>
  )
}
