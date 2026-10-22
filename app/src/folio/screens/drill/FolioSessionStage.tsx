import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import type { SessionKind } from '@/api/hooks/useSessions'
import type { AnswerLetter, Question } from '@/data/questions'
import { DrillHead, TacticNote, Verdict } from './DrillHead'
import { useDrillCore } from './drillCore'
import { drillSeam } from './drillSeam'
import { Facit } from './Facit'
import { GradedOptions, Options } from './Options'
import { QuantPage } from './QuantPage'
import { folioBlock } from './seam'
import { toDrillQuestion } from './toDrillQuestion'
import type { DrillFigure } from './types'
import { useDrillContent } from './useDrillContent'
import './drill.css'

export type FolioSessionStageProps = {
  plan: readonly Question[]
  index: number
  picked: AnswerLetter | null
  graded: boolean
  onPick: (letter: AnswerLetter) => void
  onNext: () => void
  sessionKind: SessionKind
  sections?: string
  flagSlot?: ReactNode
  suspended?: boolean
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
  graded,
  onPick,
  onNext,
  sessionKind,
  flagSlot,
  suspended = false,
  start,
  end,
}: FolioSessionStageProps & { start: number; end: number }) {
  const questions = useMemo(
    () => plan.slice(start, end).map((q) => toDrillQuestion(q)),
    [plan, start, end],
  )
  const { explanations, frameworks } = useDrillContent(questions)
  const { view, act, refs } = useDrillCore({
    questions,
    explanations,
    live: false,
    start: { index: index - start, graded: graded && picked ? picked : undefined },
    controller: {
      lock: (q, letter) => {
        onPick(letter)
        return { correct: letter === q.answer }
      },
      next: () => onNext(),
    },
  })
  const root = useRef<HTMLDivElement>(null)
  const problem = useRef<HTMLElement>(null)
  const verdict = useRef<HTMLHeadingElement>(null)
  const feedback = view.phase === 'feedback'
  const q = view.question
  const seam = drillSeam(sessionKind, q.section)

  // Focus follows the question and verdict; disclosure buttons retain native Enter.
  useEffect(() => {
    if (!q.qid || suspended) return
    const target = feedback ? verdict.current : problem.current
    // The phone feedback follows the question in document flow. Reveal the
    // focused verdict instead of leaving keyboard users above it off-screen.
    target?.focus()
  }, [q.qid, feedback, suspended])
  useEffect(() => {
    if (suspended) return
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey)
        return
      const target = event.target
      if (target instanceof HTMLElement) {
        if (target.closest('input, textarea, select, [contenteditable], [role="dialog"], [inert]'))
          return
        if (target !== document.body && !root.current?.contains(target)) return
        if (event.key === 'Enter' && target.closest('button, a, summary, [role="button"]')) return
      }
      const letter = event.key.toUpperCase() as AnswerLetter
      if (view.phase === 'question' && view.letters.includes(letter)) {
        event.preventDefault()
        if (event.shiftKey) act.toggleEliminate(letter)
        else act.select(letter)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (view.phase === 'question') act.lock()
        else if (view.phase === 'feedback') act.next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [act, view.phase, view.letters, suspended])

  const action = (
    <div className="fa-actionbar">
      {flagSlot}
      {feedback ? (
        <button type="button" className="fa-btn" data-testid="drill-next" onClick={act.next}>
          {index === plan.length - 1 ? seam.last : seam.next}
          <span aria-hidden> →</span>
        </button>
      ) : (
        <button
          type="button"
          className="fa-btn"
          data-testid="fa-lock"
          disabled={!view.selected}
          onClick={act.lock}
        >
          Svara
        </button>
      )}
    </div>
  )
  return (
    <div
      className="fa-drill fa-quant"
      data-testid="drill-question"
      data-qid={q.qid}
      data-phase={view.phase}
      ref={root}
      inert={suspended || undefined}
    >
      <DrillHead seam={seam} index={index} total={plan.length} />
      <div className={feedback ? 'fa-feedback-spread' : 'fa-qsheet'}>
        <section
          className="fa-qcol"
          ref={problem}
          tabIndex={-1}
          aria-label={`Uppgift ${index + 1}`}
        >
          <QuantPage
            q={q}
            n={index + 1}
            hang
            passageRef={refs.para}
            flashPara={view.flashPara}
            figure={q.figure ? <QuestionFigure key={q.figure.src} figure={q.figure} /> : null}
          />
          {feedback ? (
            <GradedOptions key={q.qid} view={view} all />
          ) : (
            <>
              <Options view={view} act={act} />
              <p className="fa-keys">
                A–{view.letters.at(-1) ?? 'E'} välj · ⇧ + bokstav stryk · Enter svara
              </p>
              {action}
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
        ) : (
          <TacticNote key={q.qid} explanation={view.explanation} variant="margin" />
        )}
      </div>
    </div>
  )
}

function QuestionFigure({ figure }: { figure: DrillFigure }) {
  const [failed, setFailed] = useState(false)
  return (
    <figure className="fa-figure">
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
