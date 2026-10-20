// Folio · Kvantfråga (screen 6) and DTK (screen 7).
//
// Kvantfråga, desktop: one page, centred on the paper at the recto's
// measure, set like an exercise in a well-made textbook — the problem's
// number hangs in the margin at the prompt's first baseline, KVA's two
// quantities stand side by side in a ruled table, NOG's statements hang
// like ¶ numbers, and the pre-answer tactic is a printed hint in the right
// margin. On Svara the book opens to its answer key: the problem moves into
// the verso (a FLIP move, instant under reduced motion) with every option
// graded in place, and the facit enters on the recto. Nästa fråga closes it
// back to a single page.
// DTK, desktop: always a spread — the figure page is DTK's passage, a
// plate tipped in on the verso behind a hairline frame with an italic
// caption; it stays put while its questions change on the recto. Förstora
// opens the page full-stage on its own paper (FigureViewer).
// Phone: a quant problem is one scrolling page with its action anchored at
// the foot; on Svara the verdict lands under the head, above the graded
// options. DTK keeps the reading drill's slip, the plate as the page.
//
// Kit v2: the sittings are data.drills.quant and data.drills.dtk, graded by
// actions.drill through useDrillCore. Math renders with MathText (KaTeX),
// never as raw markers.

import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type DrillCoreRefs,
  type DrillCoreView,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import {
  type DirectionProps,
  fmtClock,
  prefersReducedMotion,
  useHideOnScroll,
  useKeyMap,
  useSheet,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DrillFigure,
  DrillQuestion,
  DrillResult,
  DrillSessionView,
  Explanation,
} from '@/components/devbake/redesign/viewModel'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { sectionLongLabel } from '@/lib/sectionRailLabel'
import {
  ActionBar,
  ClockButton,
  Colophon,
  type DrillAct,
  type DrillSeam,
  drillSeam,
  EmptyDrill,
  ExitButton,
  entryName,
  Facit,
  type FacitView,
  FolioDialog,
  GapText,
  GradedOptions,
  KeyHints,
  Options,
  type Origin,
  questionStem,
  Spread,
  showsClock,
  TimeLine,
  Verdict,
} from './FolioDrill'
import { capitalised, Dots, inWords } from './FolioHome'

/** A practice pace for the folded clock's line: two minutes a problem. */
const PACE_PER_QUESTION = 120
/** Option counts in prose ("de fyra alternativen": neuter). */
const OPTION_WORDS = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem']
const ORDINALS = ['Första', 'Andra', 'Tredje', 'Fjärde', 'Femte', 'Sjätte', 'Sjunde', 'Åttonde']
/** Förstora's zoom steps: 100 % is the whole page on the stage. */
const ZOOMS = [1, 1.5, 2, 3, 4, 6]
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

// ── The screen ───────────────────────────────────────────────────────

export function FolioQuant(props: DirectionProps & { origin: Origin }) {
  const { data } = useDirectionData()
  const session = props.screen === 7 ? data.drills.dtk : data.drills.quant
  if (session.questions.length === 0) {
    return <EmptyDrill label={props.screen === 7 ? 'Kvant · DTK' : 'Kvant'} width={props.width} />
  }
  // One core per sitting: a sitting the host replaces opens at its own
  // start; an update of the same sitting keeps the reader's place.
  return <QuantDrill key={session.id} {...props} session={session} />
}

/** The figure page a question stands on, and where it is among the
 *  sitting's questions to the same page (DTK's questions come in a row). */
function pageGroup(questions: readonly DrillQuestion[], q: DrillQuestion) {
  const src = q.figure?.src
  const group = src ? questions.filter((x) => x.figure?.src === src) : [q]
  return { pos: Math.max(0, group.indexOf(q)), count: group.length, group }
}

/** "Andra av tre frågor till figuren" — only when the page has several. */
function groupCue(pos: number, count: number): string | null {
  if (count < 2) return null
  return `${ORDINALS[pos] ?? `Fråga ${pos + 1}`} av ${inWords(count)} frågor till figuren`
}

/** "Hösten 2025 · Provpass 1 · uppgift 29–31": where the page is from, said
 *  from the questions (the view model has no page number). */
function plateCaption(group: DrillQuestion[], q: DrillQuestion): string {
  const numbers = group.map((x) => x.number).sort((a, b) => a - b)
  const first = numbers[0] ?? q.number
  const last = numbers[numbers.length - 1] ?? q.number
  const which = first === last ? `uppgift ${first}` : `uppgifterna ${first}–${last}`
  return `${q.source.label} · ${which}`
}

type ViewerState = { zoom: number; left: number; top: number }

function QuantDrill({
  width,
  live,
  origin,
  session,
}: DirectionProps & { origin: Origin; session: DrillSessionView }) {
  const { data, actions } = useDirectionData()
  const core = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start: session.start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  const { view, refs } = core
  const { lock: coreLock, next: coreNext, exit: coreExit } = core.act
  const q = view.question
  const seam = drillSeam(session, q, 'Slutför övningen')
  const plate = q.figure?.kind === 'raster'

  // Förstora: one viewer, for the question's figure or a reviewed one's;
  // zoom, scroll and rotation are kept per page, so it opens again where
  // it was.
  const [viewing, setViewing] = useState<DrillFigure | null>(null)
  const viewer = viewing != null
  const [rotations, setRotations] = useState<Record<string, number>>({})
  const viewerStates = useRef(new Map<string, ViewerState>())
  const turn = useCallback((src: string | undefined) => {
    if (src) setRotations((r) => ({ ...r, [src]: ((r[src] ?? 0) + 90) % 360 }))
  }, [])
  const rot = q.figure ? (rotations[q.figure.src] ?? 0) : 0
  const rotate = useCallback(() => turn(q.figure?.src), [turn, q.figure?.src])
  const rotateViewing = useCallback(() => turn(viewing?.src), [turn, viewing?.src])

  // The FLIP move: where the problem stood before Svara.
  const colRef = useRef<HTMLDivElement>(null)
  const flipFrom = useRef<number | null>(null)
  const verdictEl = useRef<HTMLElement | null>(null)
  const verdictRef = useCallback((el: HTMLElement | null) => {
    verdictEl.current = el
  }, [])

  const lock = useCallback(() => {
    flipFrom.current = colRef.current?.getBoundingClientRect().left ?? null
    coreLock()
  }, [coreLock])
  const next = useCallback(() => {
    coreNext()
  }, [coreNext])
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
    exit: coreExit,
  }

  // On a verdict: the problem slides from the centre to the verso, and focus
  // moves to the verdict, which is how it is announced.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the phase or question changes
  useLayoutEffect(() => {
    if (view.phase !== 'feedback') {
      flipFrom.current = null
      return
    }
    const col = colRef.current
    const from = flipFrom.current
    flipFrom.current = null
    if (
      live &&
      col &&
      from != null &&
      !prefersReducedMotion() &&
      typeof col.animate === 'function'
    ) {
      const dx = from - col.getBoundingClientRect().left
      if (Math.abs(dx) > 1) {
        col.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], {
          duration: 180,
          easing: EASE,
        })
      }
    }
    if (live) verdictEl.current?.focus({ preventScroll: true })
  }, [view.phase, view.index])

  // The day goes on: the plan's next part is the colophon's one action.
  const nextItem = data.home.plan.items.find((i) => !i.completed)
  const onDoneNext = nextItem ? () => actions.openPlanItem(nextItem.id) : undefined

  const keys: Record<string, () => void> = {
    Enter: () => {
      if (view.phase === 'question') act.lock()
      else if (view.phase === 'feedback') act.next()
      else onDoneNext?.()
    },
    // Space moves on from the facit; it never answers.
    ' ': () => {
      if (view.phase === 'feedback') act.next()
    },
  }
  for (const letter of view.letters) {
    const l = letter.toLowerCase()
    keys[l] = () => act.select(letter)
    keys[`Shift+${l}`] = () => act.toggleEliminate(letter)
  }
  // Keys rest while Förstora is open.
  useKeyMap(keys, live && !viewer)

  const shared: QuantChrome = {
    view,
    act,
    refs,
    seam,
    session,
    clocked: showsClock(session),
    colRef,
    verdictRef,
    rot,
    rotate,
    openViewer: () => setViewing(q.figure ?? null),
    live,
  }

  let page: ReactNode
  if (view.phase === 'done') {
    page = (
      <QuantDone
        width={width}
        view={view}
        session={session}
        seam={seam}
        origin={origin}
        onExit={act.exit}
        next={
          onDoneNext && nextItem
            ? { label: `Nästa: ${nextItem.title} · ${nextItem.minutes} min`, onClick: onDoneNext }
            : undefined
        }
        dateLabel={data.home.today.dateLabel}
        onZoom={setViewing}
      />
    )
  } else if (width === 'phone') {
    page = plate ? <PhoneDtk {...shared} /> : <PhoneQuant {...shared} />
  } else {
    page = plate ? <DeskDtk {...shared} /> : <DeskQuant {...shared} />
  }

  return (
    <>
      <div className="fo-qroot" data-kind={plate ? 'dtk' : 'quant'} inert={viewer || undefined}>
        {page}
      </div>
      {viewing ? (
        <FigureViewer
          figure={viewing}
          rot={rotations[viewing.src] ?? 0}
          rotate={rotateViewing}
          saved={viewerStates.current.get(viewing.src)}
          onClose={(state) => {
            viewerStates.current.set(viewing.src, state)
            setViewing(null)
          }}
        />
      ) : null}
    </>
  )
}

type QuantChrome = {
  view: DrillCoreView
  act: DrillAct
  refs: DrillCoreRefs
  seam: DrillSeam
  session: DrillSessionView
  clocked: boolean
  colRef: RefObject<HTMLDivElement | null>
  verdictRef: (el: HTMLElement | null) => void
  rot: number
  rotate: () => void
  openViewer: () => void
  live: boolean
}

/** The page's heading, visually hidden: "Kvantitativa resonemang, fråga 3
 *  av 10". The running head's label is not a heading. */
function PageHeading({ view, seam }: { view: DrillCoreView; seam: DrillSeam }) {
  return (
    <h1 className="fo-sr">
      {sectionLongLabel(view.question.section)}, {seam.unit.toLowerCase()} {view.index + 1} av{' '}
      {view.total}
    </h1>
  )
}

function RectoHead({ view, seam, clocked }: Pick<QuantChrome, 'view' | 'seam' | 'clocked'>) {
  const [shown, setShown] = useState(true)
  return (
    <header className="fo-runhead fo-runhead--recto">
      <span className="fo-runhead-pos">
        <Dots total={view.total} done={view.index} />
        <span>
          {seam.unit} {view.index + 1} av {view.total}
        </span>
      </span>
      {clocked ? (
        <ClockButton seconds={view.elapsed} shown={shown} toggle={() => setShown((s) => !s)} />
      ) : (
        <span />
      )}
      {clocked && !shown ? (
        <TimeLine seconds={view.elapsed} pace={PACE_PER_QUESTION * view.total} />
      ) : null}
    </header>
  )
}

// ── Desktop: Kvantfråga ──────────────────────────────────────────────

function DeskQuant(c: QuantChrome) {
  const { view, act, refs, seam, clocked, colRef, verdictRef, live } = c
  const [clockShown, setClockShown] = useState(true)
  const rectoRef = useRef<HTMLElement>(null)
  const q = view.question
  const n = view.index + 1
  const figure = q.figure ? <FigureInline figure={q.figure} onZoom={c.openViewer} /> : null

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new verdict starts at the top of the recto
  useEffect(() => {
    rectoRef.current?.scrollTo?.({ top: 0 })
  }, [view.index, view.phase])

  if (view.phase === 'question') {
    return (
      <div className="fo-drill fo-quant">
        <header className="fo-runhead fo-runhead--solo">
          <ExitButton onExit={act.exit} />
          <span className="fo-label fo-runhead-title">{seam.label}</span>
          <span className="fo-runhead-pos">
            <Dots total={view.total} done={view.index} />
            <span>
              {seam.unit} {n} av {view.total}
            </span>
            {clocked ? (
              <ClockButton
                seconds={view.elapsed}
                shown={clockShown}
                toggle={() => setClockShown((s) => !s)}
              />
            ) : null}
            {clocked && !clockShown ? (
              <TimeLine seconds={view.elapsed} pace={PACE_PER_QUESTION * view.total} />
            ) : null}
          </span>
        </header>
        <div className="fo-qscroll">
          <div className={`fo-qsheet${live ? ' fo-enter' : ''}`} key={q.qid}>
            <PageHeading view={view} seam={seam} />
            <div className="fo-qcol" ref={colRef}>
              <QuantProblem q={q} n={n} hang figure={figure} />
              <Options view={view} act={act} testId="rd-quant-option" />
              <KeyHints letters={view.letters} />
              <ActionBar view={view} act={act} seam={seam} />
            </div>
            <TacticNote explanation={view.explanation} variant="margin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fo-drill fo-quant">
      <Spread
        start={0.5}
        rectoRef={rectoRef}
        versoLabel={`Uppgift ${n}`}
        rectoLabel={`Facit till uppgift ${n}`}
        verso={
          <>
            <header className="fo-runhead">
              <ExitButton onExit={act.exit} />
              <span className="fo-label fo-runhead-title">{seam.label}</span>
              <span />
            </header>
            <div className="fo-qverso">
              <PageHeading view={view} seam={seam} />
              <div className="fo-qcol" ref={colRef}>
                <QuantProblem q={q} n={n} hang figure={figure} />
                <GradedOptions view={view} all />
              </div>
            </div>
          </>
        }
        recto={
          <>
            <RectoHead view={view} seam={seam} clocked={clocked} />
            <div className={`fo-recto-body${live ? ' fo-enter' : ''}`}>
              <Verdict
                view={view}
                focusRef={verdictRef}
                after={view.correct == null ? null : seam.after(view.correct)}
              />
              <Facit view={view} act={act} refs={refs} active={null} point={() => {}} />
              <ActionBar view={view} act={act} seam={seam} />
            </div>
          </>
        }
      />
    </div>
  )
}

// ── Desktop: DTK ─────────────────────────────────────────────────────

function DeskDtk(c: QuantChrome) {
  const { view, act, refs, seam, clocked, verdictRef, session, rot, rotate, openViewer, live } = c
  const rectoRef = useRef<HTMLElement>(null)
  const q = view.question
  const figure = q.figure as DrillFigure
  const { pos, count, group } = pageGroup(session.questions, q)
  const landscape = figure.width > figure.height

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new question or verdict starts at the top of the recto
  useEffect(() => {
    rectoRef.current?.scrollTo?.({ top: 0 })
  }, [view.index, view.phase])

  const cue = groupCue(pos, count)
  return (
    <div className="fo-drill fo-dtk">
      <Spread
        key={landscape ? 'wide' : 'tall'}
        start={landscape ? 0.62 : 0.5}
        rectoRef={rectoRef}
        rectoLabel={`${seam.unit} ${view.index + 1}`}
        verso={
          <>
            <header className="fo-runhead">
              <ExitButton onExit={act.exit} />
              <span className="fo-label fo-runhead-title">{seam.label}</span>
              <span className="fo-head-right">
                <button type="button" className="fo-ghost" onClick={openViewer}>
                  <Maximize2 size={15} strokeWidth={1.5} aria-hidden />
                  Förstora
                </button>
                <button
                  type="button"
                  className="fo-ghost"
                  onClick={rotate}
                  aria-label="Rotera figuren 90 grader"
                >
                  <RotateCw size={15} strokeWidth={1.5} aria-hidden />
                  Rotera
                </button>
              </span>
            </header>
            <div className="fo-plate-page">
              <FigurePlate
                key={figure.src}
                figure={figure}
                rot={rot}
                caption={plateCaption(group, q)}
                live={live}
              />
            </div>
          </>
        }
        recto={
          <>
            <RectoHead view={view} seam={seam} clocked={clocked} />
            <div className="fo-recto-body">
              <PageHeading view={view} seam={seam} />
              {view.phase === 'question' ? (
                <>
                  {cue ? <p className="fo-cue">{cue}</p> : null}
                  <QuantProblem q={q} n={view.index + 1} />
                  <TacticNote key={q.qid} explanation={view.explanation} variant="disclosure" />
                  <Options view={view} act={act} testId="rd-quant-option" />
                  <KeyHints letters={view.letters} />
                </>
              ) : (
                <>
                  <Verdict
                    view={view}
                    focusRef={verdictRef}
                    after={view.correct == null ? null : seam.after(view.correct)}
                  />
                  <QuantProblem q={q} n={view.index + 1} after />
                  <GradedOptions view={view} all />
                  <Facit view={view} act={act} refs={refs} active={null} point={() => {}} />
                </>
              )}
              <ActionBar view={view} act={act} seam={seam} />
            </div>
          </>
        }
      />
    </div>
  )
}

// ── Phone: Kvantfråga, one page ──────────────────────────────────────

function PhoneQuant(c: QuantChrome) {
  const { view, act, refs, seam, clocked, verdictRef } = c
  const scrollRef = useRef<HTMLDivElement>(null)
  const verdictBox = useRef<HTMLDivElement>(null)
  const { hidden: compact, onScroll } = useHideOnScroll()
  const q = view.question
  const feedback = view.phase === 'feedback'
  const figure = q.figure ? <FigureInline figure={q.figure} onZoom={c.openViewer} /> : null

  // A new problem starts at the top; a verdict scrolls so it sits under the
  // head, above the graded options.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on question or phase change only
  useLayoutEffect(() => {
    const box = scrollRef.current
    if (!box?.scrollTo) return
    const at = feedback ? (verdictBox.current?.offsetTop ?? 0) - 64 : 0
    box.scrollTo({ top: Math.max(0, at) })
  }, [view.index, view.phase])

  const progress = ((view.index + (feedback ? 1 : 0)) / view.total) * 100
  return (
    <div className="fo-pdrill fo-pquant">
      <header className="fo-pdrill-head" data-compact={String(compact)}>
        <ExitButton onExit={act.exit} compact />
        <span className="fo-pdrill-pos">
          {seam.unit} {view.index + 1} av {view.total}
        </span>
        <div className="fo-head-right">
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
      <div className="fo-pdrill-scroll" ref={scrollRef} onScroll={onScroll}>
        <div className="fo-pquant-page" key={q.qid}>
          <PageHeading view={view} seam={seam} />
          <span className="fo-label">{seam.label}</span>
          <QuantProblem q={q} n={view.index + 1} hang figure={figure} />
          {feedback ? null : (
            <TacticNote key={q.qid} explanation={view.explanation} variant="disclosure" />
          )}
          {feedback ? (
            <div className="fo-pverdict" ref={verdictBox}>
              <Verdict
                view={view}
                focusRef={verdictRef}
                after={view.correct == null ? null : seam.after(view.correct)}
              />
              <button
                type="button"
                className="fo-more fo-more--up"
                onClick={() => scrollRef.current?.scrollTo?.({ top: 0 })}
              >
                Visa uppgiften
                <ChevronUp size={14} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          ) : null}
          {feedback ? (
            <GradedOptions view={view} all />
          ) : (
            <Options view={view} act={act} testId="rd-quant-option" />
          )}
          {feedback ? (
            <Facit view={view} act={act} refs={refs} active={null} point={() => {}} />
          ) : null}
        </div>
      </div>
      <div className="fo-pfoot">
        <ActionBar view={view} act={act} seam={seam} />
      </div>
    </div>
  )
}

// ── Phone: DTK, the plate and the slip ───────────────────────────────

function PhoneDtk(c: QuantChrome) {
  const { view, act, refs, seam, clocked, verdictRef, session, rot, openViewer, live } = c
  const { state: sheet, setState: setSheet, toggle, grab } = useSheet(view)
  const { hidden: compact, onScroll } = useHideOnScroll()
  const q = view.question
  const figure = q.figure as DrillFigure
  const { pos, count, group } = pageGroup(session.questions, q)
  const feedback = view.phase === 'feedback'
  const options = q.options?.length ?? 0
  const progress = ((view.index + (feedback ? 1 : 0)) / view.total) * 100
  return (
    <div className="fo-pdrill fo-pdtk">
      <header className="fo-pdrill-head" data-compact={String(compact)}>
        <ExitButton onExit={act.exit} compact />
        {/* The slip names the question; the head keeps the tools. */}
        <span />
        <div className="fo-head-right">
          {clocked ? (
            <span className="fo-clock" role="timer" aria-label={`Tid ${fmtClock(view.elapsed)}`}>
              <Clock size={14} strokeWidth={1.5} aria-hidden className="fo-clock-icon" />
              <span aria-hidden>{fmtClock(view.elapsed)}</span>
            </span>
          ) : null}
          <button
            type="button"
            className="fo-ghost fo-focus-btn"
            onClick={openViewer}
            aria-label="Förstora figuren"
          >
            <Maximize2 size={15} strokeWidth={1.5} aria-hidden />
            <span aria-hidden>Förstora</span>
          </button>
        </div>
        <span className="fo-head-progress" aria-hidden>
          <i style={{ width: `${progress}%` }} />
        </span>
      </header>
      <div className="fo-pdrill-scroll" onScroll={onScroll} inert={sheet === 'full'}>
        <div className="fo-pdtk-page">
          <span className="fo-label">{seam.label}</span>
          <FigurePlate
            key={figure.src}
            figure={figure}
            rot={rot}
            caption={plateCaption(group, q)}
            onOpen={openViewer}
            live={live}
          />
        </div>
        <div style={{ height: sheet === 'peek' ? 280 : 120 }} aria-hidden />
      </div>
      <section
        className="fo-sheet"
        data-state={sheet}
        data-testid="rd-sheet"
        aria-label={`${seam.unit} ${view.index + 1}`}
      >
        <button
          type="button"
          className="fo-sheet-grab"
          tabIndex={-1}
          aria-label={sheet === 'peek' ? 'Visa frågan' : 'Visa figuren'}
          aria-expanded={sheet !== 'peek'}
          {...grab}
        />
        <div className="fo-sheet-head">
          <span className="fo-label">
            {seam.unit} {view.index + 1} av {view.total}
            {count > 1 ? ` · ${(ORDINALS[pos] ?? '').toLowerCase()} av ${inWords(count)}` : ''}
          </span>
          {sheet === 'peek' ? null : (
            <button
              type="button"
              className="fo-more fo-sheet-back"
              onClick={() => setSheet('peek')}
            >
              Visa figuren
              <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </div>
        <div className="fo-sheet-body">
          {sheet === 'peek' ? (
            <>
              {feedback ? (
                <Verdict view={view} as="p" />
              ) : (
                <QuantProblem q={q} n={view.index + 1} />
              )}
              <button type="button" className="fo-btn fo-peek-btn" onClick={toggle}>
                {feedback
                  ? 'Tillbaka till facit'
                  : `Visa de ${OPTION_WORDS[options] ?? options} alternativen`}
                <ChevronUp size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : feedback ? (
            <>
              <Verdict
                view={view}
                as="p"
                focusRef={verdictRef}
                after={view.correct == null ? null : seam.after(view.correct)}
              />
              <QuantProblem q={q} n={view.index + 1} after />
              <GradedOptions view={view} all />
              <Facit view={view} act={act} refs={refs} active={null} point={() => {}} />
            </>
          ) : (
            <>
              <QuantProblem q={q} n={view.index + 1} />
              <TacticNote key={q.qid} explanation={view.explanation} variant="disclosure" />
              <Options view={view} act={act} testId="rd-quant-option" />
            </>
          )}
        </div>
        {sheet === 'peek' ? null : <ActionBar view={view} act={act} seam={seam} />}
      </section>
    </div>
  )
}

// ── The problem ──────────────────────────────────────────────────────

/** ORD's single words are set at the page-title size, never larger. */
function isWord(q: DrillQuestion): boolean {
  return q.section === 'ORD' && (q.prompt?.trim().length ?? 0) <= 24
}

/**
 * A problem set the textbook way, per section: XYZ's prompt as it comes;
 * KVA's condition as its own line, then the two quantities side by side in
 * a ruled table (stacked on phone, each under its italic label); NOG's
 * question, its statements hanging in the margin and the italic lead-in;
 * ORD's word at the title size; MEK's blanks as gaps. With `hang`, the
 * problem's number hangs in the margin. `after` sets it as the quiet
 * restatement under a verdict. A prompt that does not split falls back to
 * the line as it is.
 */
function QuantProblem({
  q,
  n,
  hang = false,
  after = false,
  figure,
}: {
  q: DrillQuestion
  n: number
  hang?: boolean
  after?: boolean
  figure?: ReactNode
}) {
  const prompt = q.prompt ?? ''
  const kva = q.section === 'KVA' ? splitKvaPrompt(prompt) : null
  const nog = q.section === 'NOG' ? parseNogPrompt(prompt) : null
  const num = hang ? (
    <span className="fo-qnum" aria-hidden>
      {n}
    </span>
  ) : null
  // The prompt is the page's h2; restated under a verdict it is a quiet line.
  const Head = after ? 'p' : 'h2'
  const headClass = 'fo-prompt fo-qprompt'
  return (
    <div
      className="fo-problem"
      data-section={q.section}
      data-after={after ? 'true' : undefined}
      data-testid="rd-quant-prompt"
    >
      {figure}
      {q.passage ? (
        <div className="fo-qpassage" lang={q.passage.lang === 'en' ? 'en' : undefined}>
          {q.passage.paragraphs.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a passage's paragraphs keep their order
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : null}
      {kva ? (
        <>
          <Head className={headClass} data-after={after ? 'true' : undefined}>
            {num}
            {kva.condition ? <MathText>{kva.condition}</MathText> : 'Jämför de två kvantiteterna.'}
          </Head>
          <table className="fo-kva">
            <thead>
              <tr>
                <th scope="col">Kvantitet I</th>
                <th scope="col">Kvantitet II</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <MathText>{kva.kvI}</MathText>
                </td>
                <td>
                  <MathText>{kva.kvII}</MathText>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      ) : nog ? (
        <>
          <Head className={headClass} data-after={after ? 'true' : undefined}>
            {num}
            <MathText>{nog.question}</MathText>
          </Head>
          <ol className="fo-nog" aria-label="Påståenden">
            <li>
              <span className="fo-nog-n" aria-hidden>
                (1)
              </span>
              <span className="fo-sr">Påstående 1: </span>
              <MathText>{nog.statement1}</MathText>
            </li>
            <li>
              <span className="fo-nog-n" aria-hidden>
                (2)
              </span>
              <span className="fo-sr">Påstående 2: </span>
              <MathText>{nog.statement2}</MathText>
            </li>
          </ol>
          <p className="fo-nog-tail">
            {nog.tail ?? 'Tillräcklig information för lösningen erhålls'}
          </p>
        </>
      ) : (
        <Head
          className={headClass}
          data-after={after ? 'true' : undefined}
          data-word={isWord(q) ? 'true' : undefined}
        >
          {num}
          {q.section === 'MEK' ? <GapText text={prompt} /> : <MathText>{prompt}</MathText>}
        </Head>
      )}
    </div>
  )
}

/**
 * The pre-answer tactic (the explanation's pregrade_tactic): a printed hint
 * in the right margin before answering on the desktop quant page, a closed
 * "Taktik" disclosure on the DTK recto and on phone. It goes on answering.
 */
function TacticNote({
  explanation,
  variant,
}: {
  explanation: Explanation | null
  variant: 'margin' | 'disclosure'
}) {
  const [open, setOpen] = useState(false)
  const tactic = explanation?.pregrade_tactic
  if (!tactic) return null
  if (variant === 'margin') {
    return (
      <aside className="fo-tactic" aria-labelledby="fo-tactic-h">
        <h2 className="fo-h3" id="fo-tactic-h">
          Taktik
        </h2>
        <p className="fo-tactic-handle">{tactic.handle}</p>
        <p className="fo-margin-note">
          <MathText>{tactic.move}</MathText>
        </p>
      </aside>
    )
  }
  return (
    <div className="fo-tactic-fold">
      <button
        type="button"
        className="fo-more"
        aria-expanded={open}
        aria-controls="fo-tactic-body"
        onClick={() => setOpen(!open)}
      >
        Taktik
        <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <div className="fo-tactic-body" id="fo-tactic-body">
          <p className="fo-tactic-handle">{tactic.handle}</p>
          <p className="fo-margin-note">
            <MathText>{tactic.move}</MathText>
          </p>
        </div>
      ) : null}
    </div>
  )
}

// ── Figures ──────────────────────────────────────────────────────────

/**
 * The DTK page as a plate tipped into the book: the printed page fitted to
 * the verso, a hairline frame, an italic caption that says where it is
 * from. It stays a white printed page in the dark theme — never inverted or
 * filtered, since inverting a chart changes what it says. While it loads
 * it is a paper box at the page's own proportions; if it fails, an erratum
 * in the frame (Svara stays open: a reader may know the answer or guess).
 * `onOpen` (phone) makes a tap on the plate open Förstora.
 */
function FigurePlate({
  figure,
  rot,
  caption,
  onOpen,
  live,
}: {
  figure: DrillFigure
  rot: number
  caption: string
  onOpen?: () => void
  live: boolean
}) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const turned = rot % 180 !== 0
  const style = {
    '--fo-plate-ratio': String(
      turned ? figure.height / figure.width : figure.width / figure.height,
    ),
    '--fo-img-ratio': String(figure.width / figure.height),
    '--fo-rot': `${rot}deg`,
  } as CSSProperties
  return (
    <figure
      className={`fo-plate${live ? ' fo-enter' : ''}`}
      data-testid="rd-figure"
      data-turned={turned ? 'true' : undefined}
      style={style}
    >
      <div className="fo-plate-frame" data-state={state}>
        {state === 'error' ? (
          <Erratum
            text="Figuren gick inte att visa."
            onRetry={() => {
              setState('loading')
              setAttempt((a) => a + 1)
            }}
          />
        ) : (
          <img
            key={attempt}
            className="fo-plate-img"
            src={`/${figure.src}`}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            decoding="async"
            onLoad={() => setState('ready')}
            onError={() => setState('error')}
          />
        )}
        {onOpen && state !== 'error' ? (
          <button
            type="button"
            className="fo-plate-open"
            onClick={onOpen}
            aria-label="Förstora figuren"
          />
        ) : null}
      </div>
      <figcaption className="fo-plate-caption">{caption}</figcaption>
    </figure>
  )
}

/** An erratum (spec §1.7): plain words behind a 1 px rule, one way to try
 *  again; announced as a status, never a red box. */
function Erratum({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="fo-erratum" role="status">
      <p>{text}</p>
      <button type="button" className="fo-link" onClick={onRetry}>
        Försök igen
      </button>
    </div>
  )
}

const svgCache = new Map<string, Promise<string>>()

/** An SVG figure's markup, fetched once per page load (as the live drill's
 *  QuestionFigure does), so its strokes take currentColor in both themes.
 *  Null fetches nothing. */
function useSvg(src: string | null) {
  const [state, setState] = useState<{ svg: string | null; failed: boolean }>({
    svg: null,
    failed: false,
  })
  const [attempt, setAttempt] = useState(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: a retry refetches
  useEffect(() => {
    if (!src) return
    let alive = true
    setState({ svg: null, failed: false })
    let job = svgCache.get(src)
    if (!job) {
      job = fetch(`/${src}`).then((r) => {
        if (!r.ok) throw new Error(`figure ${r.status}`)
        return r.text()
      })
      svgCache.set(src, job)
    }
    job.then(
      (svg) => alive && setState({ svg, failed: false }),
      () => {
        svgCache.delete(src)
        if (alive) setState({ svg: null, failed: true })
      },
    )
    return () => {
      alive = false
    }
  }, [src, attempt])
  return { ...state, retry: () => setAttempt((a) => a + 1) }
}

/** The bank's SVG, made to fill its box and take the ink's colour. */
function fitSvg(svg: string): string {
  return svg.replace(/<svg([^>]*)>/, '<svg$1 width="100%" height="100%" style="display:block">')
}

/** An XYZ/KVA/NOG figure, set like a book figure above the prompt: centred
 *  on the measure, at most 280 px tall, no frame, its labels named by the
 *  figure's alt; a ghost Förstora under its right edge. */
function FigureInline({ figure, onZoom }: { figure: DrillFigure; onZoom: () => void }) {
  if (figure.kind === 'raster') {
    return (
      <figure className="fo-figure">
        <img
          className="fo-figure-raster"
          src={`/${figure.src}`}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          decoding="async"
        />
        <ZoomButton onZoom={onZoom} />
      </figure>
    )
  }
  return <SvgFigure figure={figure} onZoom={onZoom} />
}

function SvgFigure({ figure, onZoom }: { figure: DrillFigure; onZoom: () => void }) {
  const { svg, failed, retry } = useSvg(figure.src)
  const ratio = figure.width / figure.height
  return (
    <figure className="fo-figure">
      <div
        className="fo-figure-box"
        role="img"
        aria-label={figure.alt}
        style={{ aspectRatio: String(ratio), width: `min(100%, ${Math.round(280 * ratio)}px)` }}
      >
        {failed ? (
          <Erratum text="Figuren gick inte att visa." onRetry={retry} />
        ) : svg ? (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: the bank's own parser-emitted SVG, no user input
          <div className="fo-figure-svg" dangerouslySetInnerHTML={{ __html: fitSvg(svg) }} />
        ) : null}
      </div>
      {failed ? null : <ZoomButton onZoom={onZoom} />}
    </figure>
  )
}

function ZoomButton({ onZoom }: { onZoom: () => void }) {
  return (
    <button type="button" className="fo-ghost fo-figure-zoom" onClick={onZoom}>
      <Maximize2 size={15} strokeWidth={1.5} aria-hidden />
      Förstora
    </button>
  )
}

// ── Förstora ─────────────────────────────────────────────────────────

/** The box a stage-sized element has (no layout in jsdom: zero). */
function useBox(ref: React.RefObject<HTMLElement | null>) {
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return box
}

/**
 * Förstora: the figure full-stage on the page's own paper — not a black
 * lightbox. Fit to the stage, drag to pan, ⌘/Ctrl + wheel to zoom from 100
 * to 600 %, and a toolbar of words; + / − / R / Esc on the keyboard, the
 * arrows pan. The drill's keys rest while it is open; closing gives focus
 * back to Förstora and keeps the zoom and place for next time.
 */
function FigureViewer({
  figure,
  rot,
  rotate,
  saved,
  onClose,
}: {
  figure: DrillFigure
  rot: number
  rotate: () => void
  saved?: ViewerState
  onClose: (state: ViewerState) => void
}) {
  const [zoom, setZoom] = useState(saved?.zoom ?? 1)
  const areaRef = useRef<HTMLDivElement>(null)
  const area = useBox(areaRef)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const anchor = useRef<{ cx: number; cy: number } | null>(null)
  const { svg } = useSvg(figure.kind === 'svg' ? figure.src : null)

  const turned = rot % 180 !== 0
  const ratio = turned ? figure.height / figure.width : figure.width / figure.height
  const pad = 24
  const fitW = Math.max(0, Math.min(area.w - pad * 2, (area.h - pad * 2) * ratio))
  const boxW = fitW * zoom
  const boxH = ratio ? boxW / ratio : 0
  const canvasW = Math.max(boxW + pad * 2, area.w)
  const canvasH = Math.max(boxH + pad * 2, area.h)
  const imgW = turned ? boxH : boxW
  const imgH = turned ? boxW : boxH

  const close = useCallback(() => {
    const el = areaRef.current
    onClose({ zoom, left: el?.scrollLeft ?? 0, top: el?.scrollTop ?? 0 })
  }, [onClose, zoom])

  /** Zoom about the stage's centre, so the place being read stays put. */
  const zoomTo = useCallback((z: number) => {
    const el = areaRef.current
    if (el?.scrollWidth) {
      anchor.current = {
        cx: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        cy: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      }
    }
    setZoom(z)
  }, [])
  const step = useCallback(
    (dir: 1 | -1) => {
      const i = ZOOMS.findIndex((z) => z >= zoom - 0.001)
      const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (i === -1 ? 0 : i) + dir))]
      zoomTo(next)
    },
    [zoom, zoomTo],
  )

  // Restore the place it was left at; keep the centre when zooming.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once the stage has a size
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el || !area.w || !saved) return
    el.scrollLeft = saved.left
    el.scrollTop = saved.top
  }, [area.w > 0])
  // biome-ignore lint/correctness/useExhaustiveDependencies: after a zoom only
  useLayoutEffect(() => {
    const el = areaRef.current
    const a = anchor.current
    anchor.current = null
    if (!el || !a) return
    el.scrollLeft = a.cx * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = a.cy * el.scrollHeight - el.clientHeight / 2
  }, [zoom])

  // Keys while open (Esc is the dialog's): +/− zoom, R turns, the arrows
  // pan. Handled keys never reach the drill or the bake-off's switcher.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = areaRef.current
      const pan: Record<string, [number, number]> = {
        ArrowLeft: [-48, 0],
        ArrowRight: [48, 0],
        ArrowUp: [0, -48],
        ArrowDown: [0, 48],
      }
      if (e.key === '+' || e.key === '=') step(1)
      else if (e.key === '-' || e.key === '−') step(-1)
      else if (e.key === 'r' || e.key === 'R') rotate()
      else if (pan[e.key]) el?.scrollBy?.({ left: pan[e.key][0], top: pan[e.key][1] })
      else return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [step, rotate])

  // ⌘/Ctrl + wheel zooms (a native listener: React's wheel is passive).
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      step(e.deltaY < 0 ? 1 : -1)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [step])

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = areaRef.current
    if (!el || e.button !== 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = areaRef.current
    const d = drag.current
    if (!el || !d) return
    el.scrollLeft = d.left - (e.clientX - d.x)
    el.scrollTop = d.top - (e.clientY - d.y)
  }
  const onUp = () => {
    drag.current = null
  }

  const percent = Math.round(zoom * 100)
  const imageStyle: CSSProperties = {
    width: imgW,
    height: imgH,
    transform: `translate(-50%, -50%) rotate(${rot}deg)`,
  }
  return (
    <FolioDialog label="Förstorad figur" onClose={close} className="fo-viewer">
      <div className="fo-viewer-bar">
        <span className="fo-viewer-title">{figure.alt}</span>
        <div className="fo-viewer-tools">
          <button
            type="button"
            className="fo-ghost"
            onClick={() => step(-1)}
            disabled={zoom <= ZOOMS[0]}
          >
            <Minus size={15} strokeWidth={1.5} aria-hidden />
            Mindre
          </button>
          <span className="fo-viewer-zoom" aria-live="polite">
            {percent}&nbsp;%
          </span>
          <button
            type="button"
            className="fo-ghost"
            onClick={() => step(1)}
            disabled={zoom >= ZOOMS[ZOOMS.length - 1]}
          >
            <Plus size={15} strokeWidth={1.5} aria-hidden />
            Större
          </button>
          <button
            type="button"
            className="fo-ghost"
            onClick={rotate}
            aria-label="Rotera figuren 90 grader"
          >
            <RotateCw size={15} strokeWidth={1.5} aria-hidden />
            Rotera
          </button>
          <button type="button" className="fo-ghost" onClick={() => zoomTo(1)}>
            Hela sidan
          </button>
        </div>
        <button type="button" className="fo-ghost" onClick={close} data-autofocus>
          <X size={16} strokeWidth={1.5} aria-hidden />
          Stäng
          <kbd className="fo-kbd" aria-hidden>
            Esc
          </kbd>
        </button>
      </div>
      {/* A named region: a screen reader reaches it as a landmark, and the
       *  arrows pan it from anywhere in the dialog (the key handler above). */}
      <section
        className="fo-viewer-area"
        ref={areaRef}
        aria-label="Figuren, förstorad – dra för att flytta"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="fo-viewer-canvas" style={{ width: canvasW, height: canvasH }}>
          {figure.kind === 'svg' && svg ? (
            <div
              className="fo-viewer-img fo-viewer-svg"
              role="img"
              aria-label={figure.alt}
              style={imageStyle}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: the bank's own parser-emitted SVG, no user input
              dangerouslySetInnerHTML={{ __html: fitSvg(svg) }}
            />
          ) : (
            <img
              className="fo-viewer-img"
              src={`/${figure.src}`}
              alt={figure.alt}
              draggable={false}
              style={imageStyle}
            />
          )}
        </div>
      </section>
    </FolioDialog>
  )
}

// ── The end of a set: colophon, round list and review ────────────────

function QuantDone({
  width,
  view,
  session,
  seam,
  origin,
  onExit,
  next,
  dateLabel,
  onZoom,
}: {
  width: WidthKey
  view: DrillCoreView
  session: DrillSessionView
  seam: DrillSeam
  origin: Origin
  onExit: () => void
  next?: { label: string; onClick: () => void }
  dateLabel: string
  /** Förstora on a reviewed question's figure. */
  onZoom: (figure: DrillFigure) => void
}) {
  const { data } = useDirectionData()
  const [reviewing, setReviewing] = useState<number | null>(null)
  const right = view.results.filter((r) => r.correct).length
  const wrong = view.results.length - right
  const minutes = Math.max(1, Math.round(view.elapsed / 60))
  const repetition = seam.mode === 'repetition'
  // The trap behind two or more of the round's misses, by its readable name.
  const trapCounts = new Map<string, number>()
  for (const r of view.results) {
    const id = session.explanations[r.qid]?.framework_id
    if (!r.correct && id) trapCounts.set(id, (trapCounts.get(id) ?? 0) + 1)
  }
  const [trapId, trapN] = [...trapCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? []
  const trap = trapN && trapN >= 2 ? entryName(trapId, data.frameworks) : null
  const sections = [...new Set(session.questions.map((x) => x.section))]

  const lines = repetition
    ? `${capitalised(inWords(right))} ${right === 1 ? 'miss flyttas' : 'missar flyttas'} fram och ${inWords(wrong)} kommer tillbaka om tio minuter.${trap ? ` Fällan bakom ${inWords(trapN ?? 0)} av dem: ${trap}.` : ''}`
    : `Besvarad ${dateLabel.toLowerCase()}. ${
        wrong > 0
          ? `${wrong === 1 ? 'Missen väntar' : 'Missarna väntar'} i nästa repetition, de äldsta först.`
          : 'Inga missar att repetera.'
      }${trap ? ` Fällan bakom ${inWords(trapN ?? 0)} av dem: ${trap}.` : ''}`

  const label = repetition ? 'Hela omgången' : 'Hela passet'
  const content =
    reviewing != null && view.results[reviewing] ? (
      <Review
        result={view.results[reviewing]}
        session={session}
        n={reviewing + 1}
        total={view.results.length}
        backLabel={repetition ? 'Tillbaka till omgången' : 'Tillbaka till passet'}
        onBack={() => setReviewing(null)}
        onZoom={onZoom}
      />
    ) : (
      <Colophon
        title={repetition ? 'Repetitionen' : session.title}
        subtitle={sections.length > 1 ? sections.join(' · ') : undefined}
        facts={`${view.total} frågor · ${right} rätt${showsClock(session) ? ` · ${minutes} min` : ''}`}
        lines={lines}
        next={next}
        back={{ label: `Till ${origin.label}`, onClick: onExit }}
        extra={
          <RoundList
            label={label}
            results={view.results}
            questions={session.questions}
            onOpen={setReviewing}
          />
        }
      />
    )

  if (width === 'phone') {
    return (
      <div className="fo-pdrill">
        <div className={`fo-pdrill-scroll${reviewing == null ? ' fo-done' : ''}`}>{content}</div>
      </div>
    )
  }
  return (
    <div className="fo-drill">
      <header className="fo-runhead fo-runhead--solo">
        <ExitButton onExit={onExit} />
        <span className="fo-label fo-runhead-title">{seam.label}</span>
        <span />
      </header>
      <div className={`fo-main${reviewing == null ? ' fo-done' : ''}`}>{content}</div>
    </div>
  )
}

/**
 * The round's questions, behind a quiet disclosure under the colophon: a
 * ruled list, one row per question — its number, section, short stem and
 * the outcome as glyph and word ("rätt", "ditt B · rätt A"). Each row opens
 * that question's facit, graded and read-only. Batch 2's pass review
 * reuses it.
 */
export function RoundList({
  label,
  results,
  questions,
  onOpen,
}: {
  label: string
  results: DrillResult[]
  questions: readonly DrillQuestion[]
  onOpen: (index: number) => void
}) {
  const [open, setOpen] = useState(false)
  if (results.length === 0) return null
  return (
    <div className="fo-roundlist">
      <button
        type="button"
        className="fo-more"
        aria-expanded={open}
        aria-controls="fo-roundlist-rows"
        onClick={() => setOpen(!open)}
      >
        {label}
        <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <ol className="fo-roundlist-rows" id="fo-roundlist-rows">
          {results.map((r, i) => {
            const q = questions.find((x) => x.qid === r.qid)
            if (!q) return null
            const stem = questionStem(q)
            const outcome = r.correct ? 'rätt' : `ditt ${r.pick} · rätt ${q.answer}`
            return (
              <li key={r.qid}>
                <button
                  type="button"
                  className="fo-round-row"
                  onClick={() => onOpen(i)}
                  aria-label={`Fråga ${i + 1}, ${q.section}, ${
                    r.correct ? 'rätt' : `fel: ditt ${r.pick}, rätt ${q.answer}`
                  }. Visa facit`}
                >
                  <span className="fo-round-n" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="fo-entry-code" aria-hidden>
                    {q.section}
                  </span>
                  <span className="fo-round-stem" aria-hidden>
                    {stem ? <GapText text={stem} /> : null}
                  </span>
                  <span className="fo-round-out" data-correct={String(r.correct)} aria-hidden>
                    {r.correct ? (
                      <Check size={14} strokeWidth={2.25} />
                    ) : (
                      <X size={14} strokeWidth={2.25} />
                    )}
                    {outcome}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      ) : null}
    </div>
  )
}

const NO_REF = () => {}

/** One question of a finished set, graded and read-only: the problem with
 *  its figure as it was set, the verdict, every option graded and the
 *  facit, its detail steps on demand. */
function Review({
  result,
  session,
  n,
  total,
  backLabel,
  onBack,
  onZoom,
}: {
  result: DrillResult
  session: DrillSessionView
  n: number
  total: number
  backLabel: string
  onBack: () => void
  onZoom: (figure: DrillFigure) => void
}) {
  const question = session.questions.find((x) => x.qid === result.qid) as DrillQuestion
  const figure = question.figure
  const [openSteps, setOpenSteps] = useState<ReadonlySet<number>>(() => new Set())
  const backRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    backRef.current?.focus({ preventScroll: true })
  }, [])
  const view: FacitView = {
    question,
    explanation: session.explanations[result.qid] ?? null,
    correct: result.correct,
    picked: result.pick,
    openSteps,
    stepCites: {},
    distractorCites: {},
  }
  const toggleStep = (s: number) =>
    setOpenSteps((open) => {
      const next = new Set(open)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  const act = {
    cite: () => {},
    goToStep: (s: number) => setOpenSteps((open) => new Set([...open, s])),
    toggleStep,
  }
  return (
    <article className="fo-review" aria-labelledby="fo-review-h">
      <button type="button" className="fo-link" onClick={onBack} ref={backRef}>
        <ChevronUp size={14} strokeWidth={1.75} aria-hidden className="fo-review-back" />
        {backLabel}
      </button>
      <p className="fo-label" id="fo-review-h">
        Fråga {n} av {total} · {question.section}
      </p>
      {figure?.kind === 'raster' ? (
        <FigurePlate figure={figure} rot={0} caption={question.source.label} live={false} />
      ) : null}
      <QuantProblem
        q={question}
        n={n}
        after
        figure={
          figure?.kind === 'svg' ? (
            <FigureInline figure={figure} onZoom={() => onZoom(figure)} />
          ) : undefined
        }
      />
      <Verdict view={{ correct: result.correct, question }} />
      <GradedOptions view={{ question, picked: result.pick }} all />
      <Facit view={view} act={act} refs={{ step: () => NO_REF }} active={null} point={() => {}} />
    </article>
  )
}
