import { type ReactNode, type RefObject, useRef, useState } from 'react'
import { MathText } from '@/components/MathText'
import { Lit } from '@/folio/ui/Lit'
import { TacticNote, Verdict } from './DrillHead'
import { DtkPlate } from './DtkPlate'
import type { DrillCoreActions, DrillCoreRefs, DrillCoreView } from './drillCore'
import { gapModel } from './ElfGaps'
import { Facit } from './Facit'
import { GradedOptions, Options } from './Options'
import { PassageView } from './PassageView'
import { PhoneSheet, type ReadingTab } from './PhoneSheet'
import type { DrillQuestion } from './types'
import './reading.css'

export function ReadingSpread({
  view,
  act,
  refs,
  questions,
  phone,
  index,
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
  onZoom: (rotation: number) => void
  suspended: boolean
}) {
  const feedback = view.phase === 'feedback'
  const q = view.question
  const [tabChoice, setTabChoice] = useState<{
    qid: string
    feedback: boolean
    tab: ReadingTab
  } | null>(null)
  const currentChoice = tabChoice?.qid === q.qid && tabChoice.feedback === feedback
  // Commit the new key too: revisiting an earlier pass question must not revive
  // a stale Texten choice and leave the host focusing a hidden question.
  if (!currentChoice) setTabChoice({ qid: q.qid, feedback, tab: 'question' })
  const tab = currentChoice ? tabChoice.tab : 'question'
  const setTab = (tab: ReadingTab) => setTabChoice({ qid: q.qid, feedback, tab })
  const documentRef = useRef<HTMLDivElement>(null)
  const gaps = gapModel(view, questions)
  const cite = (n: number, source?: string) => {
    if (phone) {
      setTab('text')
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
        onZoom={(rotation) => {
          // The host restores question/verdict focus when the viewer closes.
          if (phone) setTab('question')
          onZoom(rotation)
        }}
      />
    ) : (
      <PassageView view={view} refs={refs} gaps={gaps} />
    )
  if (!phone)
    return (
      <div className="rd-spread">
        <div className="rd-verso">{passage}</div>
        <Lit as="div" className="rd-recto">
          {question}
        </Lit>
      </div>
    )
  return (
    <div className="rd-phone">
      <PhoneSheet
        tab={tab}
        setTab={setTab}
        questionKey={q.qid}
        passage={<div ref={documentRef}>{passage}</div>}
        action={action}
        suspended={suspended}
      >
        {question}
      </PhoneSheet>
    </div>
  )
}
