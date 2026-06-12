// Single drill question, Boksidan (M3) margin-rail chassis.
//
// The question is composed of stacked rail sections — each a cobalt mono
// label in the left margin, a hairline spine, and the content column:
//
//   TEXTEN / UNDERLAGET   the passage or figure (LÄS/ELF/DTK)
//   FRÅGAN / UPPGIFTEN     the prompt (ORD headword, or a sentence/stem)
//   PÅSTÅENDEN            the NOG (1)/(2) sufficiency apparatus
//   VÄLJ SVAR             the options
//
// Two display modes:
//   - "answering": all options live, one click commits the answer
//   - "graded":    the picked option + the correct one are revealed —
//                  green (--ok) on the right answer, red (--bad) on a wrong
//                  pick. Grading is STATE, so it uses the semantic tokens,
//                  never the cobalt accent (which is reserved for structure).
//
// The chassis linearises on phone (rail label stacks above content); the
// same composition holds across phone/reader/studio. See index.css `.hpc-m3-*`
// and docs/design-system-conventions.md.

import { useEffect, useRef } from 'react'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { ExplanationPanel } from '@/components/drill/ExplanationPanel'
import { KvaPrompt } from '@/components/drill/KvaPrompt'
import { QuestionFigure } from '@/components/drill/QuestionFigure'
import { MathText } from '@/components/MathText'
import type { AnswerLetter, Option, Question } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { RAIL_CHOOSE, RAIL_STATEMENTS, railMeta } from '@/lib/sectionRailLabel'

type Props = {
  question: Question
  /** Letter the user picked, or null if they haven't answered yet. */
  picked: AnswerLetter | null
  /** When true, options reveal correct/incorrect state and become readonly. */
  graded: boolean
  onPick: (letter: AnswerLetter) => void
  /** Phase A.5 — when DrillQuestion is rendered inside StudyDesk, the
   *  Study Desk's PedagogyPanel handles the explanation as a side
   *  column. Pass `renderExplanation={false}` to suppress the inline
   *  ExplanationPanel and avoid double-rendering. Defaults to true
   *  for backward compat with phone-mode callers. */
  renderExplanation?: boolean
}

export function DrillQuestion({
  question,
  picked,
  graded,
  onPick,
  renderExplanation = true,
}: Props) {
  // Scroll back to the top whenever a new question loads. Without this
  // a long LÄS passage on Q1 leaves the inner overflow-y region
  // mid-scroll, so Q2 visually starts halfway down the screen.
  // We deliberately key on `qid` (not the whole question prop) so a
  // pick→graded transition on the SAME question doesn't re-scroll.
  const scrollerRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: qid identity is the trigger
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0
  }, [question.qid])

  if (!question.options || question.parsing_status !== 'complete') {
    return (
      <div
        style={{
          padding: 'var(--pad-lg)',
          color: 'var(--muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
      >
        Frågan saknar fullständig text.
      </div>
    )
  }

  const meta = railMeta(question.section)
  const hasContext = !!question.context && meta.contextLabel !== null
  // ORD-style single-word headwords get the large italic display setting;
  // sentence prompts get the tighter `.hpc-m3-q` scale.
  const promptIsShort = !question.prompt || question.prompt.length <= 18
  // NOG: split the flat prompt into stem + (1)/(2) statements + coda. Falls
  // back to rendering the raw prompt when the markers aren't present.
  const nog = meta.hasStatements && question.prompt ? parseNogPrompt(question.prompt) : null
  const promptStem = nog ? nog.question : question.prompt

  // Running entrance stagger so the page reads top-to-bottom.
  let delay = 0
  const nextDelay = () => {
    const d = delay
    delay += 60
    return d
  }

  const promptMeta = promptIsShort ? (
    <>
      <strong>{question.section}</strong>
      {question.section === 'ORD' ? 'synonymer' : null}
    </>
  ) : (
    meta.promptLabel
  )

  return (
    <div
      ref={scrollerRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '4px var(--pad-lg) 8px',
        containerType: 'inline-size',
      }}
    >
      {hasContext && (
        <DrillRailSection meta={meta.contextLabel} delay={nextDelay()} testid="drill-context">
          <div className="hpc-m3-passage">
            {question.context?.split(/\n{2,}/).map((para, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: passage paragraphs are static text
              <p key={i}>{para}</p>
            ))}
          </div>
        </DrillRailSection>
      )}

      {question.figure && (
        <DrillRailSection meta="Underlaget" delay={nextDelay()}>
          <figure className="hpc-m3-fig">
            <QuestionFigure figure={question.figure} />
          </figure>
        </DrillRailSection>
      )}

      <DrillRailSection meta={promptMeta} delay={nextDelay()} testid="drill-prompt">
        {question.section === 'KVA' && question.prompt ? (
          <div className="hpc-m3-q">
            <KvaPrompt prompt={question.prompt} />
          </div>
        ) : promptIsShort ? (
          <h1 className="hpc-m3-display">
            <MathText>{promptStem}</MathText>
          </h1>
        ) : (
          <p className="hpc-m3-q">
            <MathText>{promptStem}</MathText>
          </p>
        )}
      </DrillRailSection>

      {nog && (
        <DrillRailSection meta={RAIL_STATEMENTS} delay={nextDelay()}>
          <div className="hpc-m3-stmt">
            <span className="hpc-m3-stmt-n">(1)</span>
            <p className="hpc-m3-stmt-t">
              <MathText>{nog.statement1}</MathText>
            </p>
          </div>
          <div className="hpc-m3-stmt">
            <span className="hpc-m3-stmt-n">(2)</span>
            <p className="hpc-m3-stmt-t">
              <MathText>{nog.statement2}</MathText>
            </p>
          </div>
        </DrillRailSection>
      )}

      <DrillRailSection meta={RAIL_CHOOSE} delay={nextDelay()}>
        {nog?.tail && <p className="hpc-m3-coda">{nog.tail}</p>}
        <div className={meta.optionsProse ? 'hpc-m3-opts is-prose' : 'hpc-m3-opts'}>
          {question.options.map((opt) => (
            <OptionRow
              key={opt.letter}
              opt={opt}
              state={rowState(opt.letter, picked, question.answer, graded)}
              onClick={() => !graded && onPick(opt.letter)}
              disabled={graded}
            />
          ))}
        </div>
      </DrillRailSection>

      {renderExplanation && graded && picked != null && (
        <ExplanationPanel qid={question.qid} correct={picked === question.answer} />
      )}
    </div>
  )
}

type RowState = 'idle' | 'picked' | 'correct' | 'incorrect'

function rowState(
  letter: AnswerLetter,
  picked: AnswerLetter | null,
  answer: AnswerLetter,
  graded: boolean,
): RowState {
  if (!graded) return picked === letter ? 'picked' : 'idle'
  if (letter === answer) return 'correct'
  if (letter === picked) return 'incorrect'
  return 'idle'
}

// State → chassis class. Grading uses the semantic green/red tokens (is-ok /
// is-bad); a non-picked, non-answer row after grading dims (is-dim). The
// cobalt accent never signals correctness — it only appears on the hover
// indicator (structure / "this is clickable").
function rowClass(state: RowState, graded: boolean): string {
  switch (state) {
    case 'correct':
      return 'hpc-m3-opt is-ok'
    case 'incorrect':
      return 'hpc-m3-opt is-bad'
    case 'picked':
      return 'hpc-m3-opt is-picked'
    default:
      return graded ? 'hpc-m3-opt is-dim' : 'hpc-m3-opt'
  }
}

function OptionRow({
  opt,
  state,
  onClick,
  disabled,
}: {
  opt: Option
  state: RowState
  onClick: () => void
  disabled: boolean
}) {
  // Post-grade caption: the correct row is labelled "Rätt svar"; a wrong
  // pick is labelled "Ditt svar".
  const verdict = state === 'correct' ? 'Rätt svar' : state === 'incorrect' ? 'Ditt svar' : null
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={`option-${opt.letter}`}
      data-state={state}
      className={rowClass(state, disabled)}
    >
      <span aria-hidden className="hpc-m3-ind" />
      <span className="hpc-m3-opt-k">{opt.letter.toLowerCase()}</span>
      <span className="hpc-m3-opt-t">
        <MathText>{opt.text}</MathText>
      </span>
      <span className="hpc-m3-opt-v">{verdict}</span>
    </button>
  )
}
