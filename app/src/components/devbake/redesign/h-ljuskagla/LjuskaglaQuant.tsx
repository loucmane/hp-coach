import { ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useDrillCore } from '@/components/devbake/redesign/drillCore'
import { type DirectionProps, useKeyMap, useSheet } from '@/components/devbake/redesign/r1Kit'
import type { DrillSessionView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { LjuskaglaFeedback } from './LjuskaglaFeedback'
import { DrillHead } from './LjuskaglaNav'
import {
  AnswerRows,
  FigurePane,
  FigureViewer,
  minutesSpent,
  problemParts,
  QuantProblem,
  useFigureGate,
  useFigureView,
} from './LjuskaglaParts'

/**
 * A quantitative drill in focus mode, any question shape: XYZ with its
 * math, KVA's two quantities, NOG's two statements, or a DTK page. A
 * problem sits in one broad lit field beside a narrower answer column (on a
 * phone: one scroll, the action reserved below it). A figure page takes the
 * wider column with the question beside it (on a phone: the page first and
 * the question in a sheet). Select, then confirm; feedback takes the answer
 * column, and the problem or page stays in view.
 *
 * A question waits for the figures it needs — its page or diagram and every
 * image option — before it can be answered: the rows, the letters, Svara and
 * Enter all hold until each image mounted now has loaded (LjuskaglaParts'
 * useFigureGate, as in a running pass). A page shared by consecutive
 * questions stays ready; a new page, an image mounted afresh or a retry
 * starts over. The enlarged viewer has its own image, outside the gate.
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
  const figures = useFigureGate(view.question)
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
  // Only an open question waits: feedback and the receipt answer nothing.
  const waiting = !feedback && !done && figures.blocked

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
    else if (!figures.blocked) act.lock()
  }
  const keys: Record<string, () => void> = { Enter: advance, ' ': advance }
  if (!feedback && !done) {
    for (const letter of letters) {
      keys[letter.toLowerCase()] = () => {
        if (sheetMode) sheet.setState('open')
        if (!figures.blocked) act.select(letter)
      }
      keys[`Shift+${letter.toLowerCase()}`] = () => {
        if (!figures.blocked) act.toggleEliminate(letter)
      }
    }
  }
  useKeyMap(keys, props.live && !accountOpen && !viewerOpen)

  const wait = waiting && (
    <p className="lj-run-wait" role="status">
      {figures.failed
        ? 'En bild som frågan behöver kunde inte visas. Svaren går att välja när den har laddats.'
        : 'Svaren går att välja när underlaget har laddats.'}
    </p>
  )

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
          figures={figures}
          blocked={figures.blocked}
        />
        {wait}
      </>
    )

  // A question without options cannot be answered: no action to confirm.
  const actionBar = q.options != null && (
    <footer className="lj-action-bar">
      <button
        type="button"
        className="lj-primary"
        data-testid={feedback ? 'rd-next' : 'rd-lock'}
        disabled={!feedback && (!view.selected || figures.blocked)}
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
      key={figures.key('figure', figure.src)}
      figure={figure}
      source={q.source.label}
      block={block}
      rotation={figureView.view.rotation}
      onRotate={figureView.rotate}
      onEnlarge={() => setViewerOpen(true)}
      enlargeRef={enlargeRef}
      img={figures.img('figure', figure.src)}
      load={figures.status('figure', figure.src)}
      onRetry={() => figures.retry('figure', figure.src)}
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
          {minutesSpent(view.elapsed)}
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
          <QuantProblem parts={parts} testId="rd-quant-prompt" />
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
          <QuantProblem parts={parts} testId="rd-quant-prompt" />
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
