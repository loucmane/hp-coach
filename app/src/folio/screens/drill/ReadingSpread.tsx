import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { MathText } from '@/components/MathText'
import { TacticNote, Verdict } from './DrillHead'
import { DtkPlate } from './DtkPlate'
import type { DrillCoreActions, DrillCoreRefs, DrillCoreView } from './drillCore'
import { gapModel } from './ElfGaps'
import { Facit } from './Facit'
import { GradedOptions, Options } from './Options'
import { PassageView } from './PassageView'
import { PhoneSheet, type SheetState } from './PhoneSheet'
import type { DrillQuestion } from './types'
import './reading.css'

export function ReadingSpread({
  view,
  act,
  refs,
  questions,
  phone,
  index,
  total,
  frameworks,
  action,
  problem,
  verdict,
  onZoom,
  suspended,
}: {
  view: DrillCoreView
  act: DrillCoreActions
  refs: DrillCoreRefs
  questions: readonly DrillQuestion[]
  phone: boolean
  index: number
  total: number
  frameworks: Readonly<Record<string, string>>
  action: ReactNode
  problem: RefObject<HTMLElement | null>
  verdict: RefObject<HTMLHeadingElement | null>
  onZoom: () => void
  suspended: boolean
}) {
  const feedback = view.phase === 'feedback'
  const q = view.question
  const [sheetChoice, setSheetChoice] = useState<{
    qid: string
    feedback: boolean
    state: SheetState
  } | null>(null)
  const sheet =
    sheetChoice?.qid === q.qid && sheetChoice.feedback === feedback
      ? sheetChoice.state
      : feedback
        ? 'full'
        : 'peek'
  const setSheet = (state: SheetState) => setSheetChoice({ qid: q.qid, feedback, state })
  const documentRef = useRef<HTMLDivElement>(null)
  const previousSheet = useRef(sheet)
  useLayoutEffect(() => {
    if (phone && feedback && previousSheet.current === 'peek' && sheet === 'full' && !suspended)
      verdict.current?.focus()
    previousSheet.current = sheet
  }, [phone, feedback, sheet, suspended, verdict])
  const gaps = gapModel(view, questions)
  const cite = (n: number, source?: string) => {
    if (phone) {
      setSheet('peek')
      window.requestAnimationFrame(() =>
        documentRef.current
          ?.querySelector<HTMLElement>(`[data-n="${n}"]`)
          ?.focus({ preventScroll: true }),
      )
    }
    act.cite(n, source)
  }
  const readingAct = { ...act, cite }
  const prompt = (
    <p
      className="fa-prompt"
      data-testid="drill-prompt"
      data-after={phone && feedback ? 'true' : undefined}
      lang={q.section === 'ELF' ? 'en' : undefined}
    >
      {gaps.current != null ? (
        <span lang="sv">Lucka {gaps.current}</span>
      ) : (
        <MathText>{q.prompt ?? ''}</MathText>
      )}
    </p>
  )
  const verdictHeading = (
    <Verdict
      view={view}
      focusRef={(node) => {
        verdict.current = node
      }}
    />
  )
  const answer = (
    <>
      {phone ? verdictHeading : null}
      {prompt}
      <GradedOptions key={`options:${q.qid}`} view={view} all />
      {!phone ? verdictHeading : null}
      <Facit
        key={`facit:${q.qid}`}
        view={view}
        act={readingAct}
        refs={refs}
        frameworks={frameworks}
        active={null}
        point={() => {}}
      />
    </>
  )
  const question = (
    <section
      className="rd-question"
      ref={problem}
      tabIndex={-1}
      aria-label={`Uppgift ${index + 1}`}
    >
      {feedback ? (
        answer
      ) : (
        <>
          {prompt}
          <TacticNote key={q.qid} explanation={view.explanation} variant="disclosure" />
          <Options view={view} act={act} />
          {!phone ? (
            <p className="fa-keys">
              A–{view.letters.at(-1)} välj · ⇧ + bokstav stryk · Enter svara
            </p>
          ) : null}
        </>
      )}
      {!phone ? action : null}
    </section>
  )
  const passage =
    q.section === 'DTK' ? (
      <DtkPlate
        key={q.figure?.src ?? q.qid}
        questions={questions}
        index={view.index}
        onZoom={() => {
          // Closing the viewer must reveal the verdict even after the reader
          // folded feedback away to inspect the plate.
          if (phone && feedback) setSheet('full')
          onZoom()
        }}
      />
    ) : (
      <PassageView view={view} refs={refs} gaps={gaps} />
    )
  if (!phone)
    return (
      <div className="rd-spread">
        <div className="rd-verso">{passage}</div>
        <div className="rd-recto">{question}</div>
      </div>
    )
  return (
    <div className="rd-phone">
      <div
        className="rd-document"
        data-testid="rd-document"
        ref={documentRef}
        inert={sheet === 'full' || undefined}
      >
        {passage}
        {!feedback ? question : null}
      </div>
      <PhoneSheet
        state={sheet}
        setState={setSheet}
        feedback={feedback}
        position={`Fråga ${index + 1} av ${total}`}
        action={action}
        onQuestion={() => {
          const target = feedback
            ? documentRef.current?.querySelector<HTMLElement>('.rd-passage, .rd-plate')
            : problem.current
          if (feedback && target) target.tabIndex = -1
          window.requestAnimationFrame(() => target?.focus())
        }}
        onReturn={() => setSheet('full')}
      >
        {feedback ? answer : null}
      </PhoneSheet>
    </div>
  )
}
