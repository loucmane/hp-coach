import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { SessionKind } from '@/api/hooks/useSessions'
import type { AnswerLetter, Question } from '@/data/questions'
import { useFolioPrefs } from '@/folio/lib/folioPrefs'
import { useFolioRootAttrs } from '@/folio/lib/useFolioRootAttrs'
import { type ScopedKeyBindings, useScopedKeys } from '@/folio/lib/useScopedKeys'
import { Go } from '@/folio/ui/Go'
import { Lit } from '@/folio/ui/Lit'
import { useViewport } from '@/hooks/useViewport'
import { formatSitting } from '@/lib/examNames'
import { DrillHead, TacticNote, Verdict } from './DrillHead'
import { useDrillCore } from './drillCore'
import { drillSeam } from './drillSeam'
import { Facit } from './Facit'
import { FigureViewer } from './FigureViewer'
import { GradedOptions, Options } from './Options'
import { QuantPage } from './QuantPage'
import { ReadingSpread } from './ReadingSpread'
import { folioBlock } from './seam'
import { toDrillQuestion } from './toDrillQuestion'
import type { DrillFigure } from './types'
import { useDrillContent } from './useDrillContent'
import './drill.css'

export type FolioSessionStageProps = {
  plan: readonly Question[]
  index: number
  picked: AnswerLetter | null
  /** Plan-aligned answers, including attempts restored after a resume. */
  picks?: readonly (AnswerLetter | null)[]
  graded: boolean
  onPick: (letter: AnswerLetter) => void
  onNext: () => void
  sessionKind: SessionKind
  sections?: string
  flagSlot?: ReactNode
  suspended?: boolean
  /** Shell navigation advances the same core as the in-page next action. */
  advanceRef?: RefObject<(() => void) | null>
}

export default function FolioSessionStage(props: FolioSessionStageProps) {
  const { start, end } = folioBlock(props.plan, props.index)
  return (
    <BlockStage
      key={`${start}:${end}:${props.plan[start].qid}`}
      {...props}
      start={start}
      end={end}
    />
  )
}

function BlockStage({
  plan,
  index,
  picked,
  picks,
  graded,
  onPick,
  onNext,
  sessionKind,
  flagSlot,
  suspended = false,
  advanceRef,
  start,
  end,
}: FolioSessionStageProps & { start: number; end: number }) {
  const questions = useMemo(
    () => plan.slice(start, end).map((q) => toDrillQuestion(q)),
    [plan, start, end],
  )
  const { explanations, frameworks } = useDrillContent(questions)
  const priorResults = plan.slice(start, index).flatMap((q, offset) => {
    const pick = picks?.[start + offset]
    return pick ? [{ qid: q.qid, pick, correct: pick === q.answer }] : []
  })
  const {
    view: coreView,
    act,
    refs,
  } = useDrillCore({
    questions,
    explanations,
    live: false,
    start: {
      index: index - start,
      graded: graded && picked ? picked : undefined,
      results: priorResults,
    },
    controller: {
      lock: (q, letter) => {
        onPick(letter)
        return { correct: letter === q.answer }
      },
      next: () => onNext(),
    },
  })
  // Attempts may hydrate after the core mounts. Merge display history without
  // remounting the core or replacing the reader's current selection/feedback.
  const view = {
    ...coreView,
    results: [
      ...priorResults.filter((prior) => !coreView.results.some((r) => r.qid === prior.qid)),
      ...coreView.results,
    ],
  }
  const root = useRef<HTMLDivElement>(null)
  const problem = useRef<HTMLElement>(null)
  const verdict = useRef<HTMLHeadingElement>(null)
  const previousQuestion = useRef<string | null>(null)
  const phone = useViewport() === 'phone'
  const kbd = useFolioPrefs((s) => s.kbd)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerRotation, setViewerRotation] = useState(0)
  const feedback = view.phase === 'feedback'
  const q = view.question
  const reading = ['LÄS', 'ELF', 'DTK'].includes(q.section)
  const seam = drillSeam(sessionKind, q.section)
  const closeViewer = useCallback(() => {
    setViewerOpen(false)
  }, [])
  useEffect(() => {
    if (!advanceRef) return
    advanceRef.current = act.next
    return () => {
      advanceRef.current = null
    }
  }, [advanceRef, act.next])

  // Focus follows the question and verdict; disclosure buttons retain native Enter.
  useEffect(() => {
    const firstInBlock = previousQuestion.current === null
    const newQuestion = previousQuestion.current !== q.qid
    // Record transitions even while suspended so restoring focus cannot reset scroll.
    previousQuestion.current = q.qid
    if (!q.qid || suspended || viewerOpen) return
    if (!feedback && newQuestion && (firstInBlock || !phone || !reading)) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    const target = feedback ? verdict.current : problem.current
    // Question focus preserves the intentional page position; feedback still scrolls.
    target?.focus({ preventScroll: !feedback })
  }, [q.qid, feedback, suspended, viewerOpen, phone, reading])
  const bindings: ScopedKeyBindings = {
    ...(feedback
      ? {}
      : Object.fromEntries(
          view.letters.flatMap((letter) => [
            [letter, () => act.select(letter)],
            [`Shift+${letter}`, () => act.toggleEliminate(letter)],
          ]),
        )),
    Enter: () => (feedback ? act.next() : act.lock()),
  }
  useScopedKeys(root, bindings, { enabled: !suspended && !viewerOpen })

  const PrimaryAction = reading ? Go : 'button'
  const action = (
    <div className="fa-actionbar">
      {flagSlot}
      {feedback ? (
        <PrimaryAction
          type="button"
          className={reading ? undefined : 'fa-btn'}
          data-testid="drill-next"
          onClick={act.next}
        >
          {index === plan.length - 1 ? seam.last : seam.next}
          <span aria-hidden> →</span>
        </PrimaryAction>
      ) : (
        <PrimaryAction
          type="button"
          className={reading ? undefined : 'fa-btn'}
          data-testid="fa-lock"
          disabled={!view.selected}
          onClick={act.lock}
        >
          Svara
        </PrimaryAction>
      )}
    </div>
  )
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: delegates second Enter from a focused radio; the wrapper itself is not a control.
    <div
      className={`fa-drill fa-quant${reading ? ' rd-drill' : ''}`}
      data-testid="drill-question"
      data-qid={q.qid}
      data-phase={view.phase}
      ref={root}
      inert={suspended || undefined}
      onKeyDown={(event) => {
        // Preserve second-Enter commit on a selected radio. The scoped hook
        // deliberately leaves native button activation to the component.
        if (
          event.key !== 'Enter' ||
          event.defaultPrevented ||
          event.repeat ||
          event.nativeEvent.isComposing ||
          event.shiftKey ||
          event.ctrlKey ||
          event.altKey ||
          event.metaKey ||
          suspended ||
          viewerOpen ||
          !kbd
        )
          return
        const target = event.target
        if (
          target instanceof Element &&
          !target.closest('[data-kbd="off"]') &&
          target.closest('[role="radio"][aria-checked="true"]')
        ) {
          event.preventDefault()
          act.lock()
        }
      }}
    >
      <div className="rd-stage-content" inert={viewerOpen || undefined}>
        {!reading && feedback ? <DrillHead seam={seam} index={index} total={plan.length} /> : null}
        {reading ? (
          <ReadingSpread
            view={view}
            act={act}
            refs={refs}
            questions={questions}
            phone={phone}
            index={index}
            total={plan.length}
            frameworks={frameworks}
            action={action}
            problem={problem}
            verdict={verdict}
            onZoom={(rotation) => {
              setViewerRotation(rotation)
              setViewerOpen(true)
            }}
            suspended={suspended || viewerOpen}
          />
        ) : (
          <Lit
            className={feedback ? 'fa-feedback-spread' : 'fa-qsheet'}
            data-figure={q.figure ? 'true' : undefined}
          >
            {!feedback && q.figure ? (
              <div className="fa-figcol">
                <QuestionFigure key={q.figure.src} figure={q.figure} />
                <SourceCaption q={q} />
                <button
                  type="button"
                  className="fa-more fa-zoom"
                  onClick={() => {
                    setViewerRotation(0)
                    setViewerOpen(true)
                  }}
                >
                  Förstora figuren
                </button>
              </div>
            ) : null}
            <section
              className="fa-qcol"
              ref={problem}
              tabIndex={-1}
              aria-label={`Uppgift ${index + 1}`}
            >
              {!feedback ? (
                <DrillHead
                  seam={seam}
                  index={index}
                  total={plan.length}
                  questionSection={q.section}
                />
              ) : null}
              {!feedback && !q.figure ? <SourceCaption q={q} /> : null}
              <QuantPage
                q={q}
                n={index + 1}
                hang={feedback}
                selected={view.selected}
                passageRef={refs.para}
                flashPara={view.flashPara}
                figure={
                  feedback && q.figure ? (
                    <QuestionFigure key={q.figure.src} figure={q.figure} />
                  ) : null
                }
              />
              {feedback ? (
                <GradedOptions key={q.qid} view={view} all />
              ) : (
                <>
                  <Options key={`options:${q.qid}`} view={view} act={act} />
                  <p className="fa-keys fa-ui-keys">
                    A–{view.letters.at(-1) ?? 'E'} välj · pilar flyttar · ⇧ + bokstav stryk · Enter
                    svara · när frågan har fokus
                  </p>
                  {action}
                  <TacticNote key={q.qid} explanation={view.explanation} variant="disclosure" />
                </>
              )}
            </section>
            {feedback ? (
              <section className="fa-recto-body" aria-label="Facit">
                <Verdict
                  view={view}
                  focusRef={(node) => {
                    verdict.current = node
                  }}
                />
                <Facit
                  key={q.qid}
                  view={view}
                  act={act}
                  refs={refs}
                  frameworks={frameworks}
                  active={null}
                  point={() => {}}
                />
                {action}
              </section>
            ) : null}
          </Lit>
        )}
      </div>
      {viewerOpen && q.figure ? (
        <FigureViewer figure={q.figure} initialRotation={viewerRotation} onClose={closeViewer} />
      ) : null}
    </div>
  )
}

function SourceCaption({ q }: { q: ReturnType<typeof toDrillQuestion> }) {
  const pass = q.source.provpass?.replace(/(kvant|verb)([12])$/, '$1 $2')
  return (
    <p className="fa-figcap">
      <span className="fa-source-line">
        {q.source.authentic
          ? `${formatSitting(q.source.examId)}${pass ? ` · ${pass}` : ''} · uppgift ${q.number}`
          : q.source.label}
      </span>
      {q.figure && q.source.authentic ? <span>originalfiguren</span> : null}
    </p>
  )
}

function QuestionFigure({ figure }: { figure: DrillFigure }) {
  const [failed, setFailed] = useState(false)
  const { 'data-theme': theme } = useFolioRootAttrs()
  return (
    <figure className="fa-figure" data-kind={figure.kind} data-theme={theme}>
      {failed ? (
        <p className="fa-prose">Figuren kunde inte laddas.</p>
      ) : (
        <img
          src={`/${figure.src}`}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          onError={() => setFailed(true)}
        />
      )}
    </figure>
  )
}
