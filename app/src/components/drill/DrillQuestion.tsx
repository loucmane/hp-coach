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
import { KvaPrompt } from '@/components/drill/KvaPrompt'
import { PedagogyPanel } from '@/components/drill/PedagogyPanel'
import { QuestionFigure } from '@/components/drill/QuestionFigure'
import { useExplanation } from '@/components/drill-variants/useExplanation'
import { MathText } from '@/components/MathText'
import { pickTactic } from '@/components/pre-grade/pregrade-tactics'
import type { AnswerLetter, Option, Question } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'
import {
  RAIL_CHOOSE,
  RAIL_OUTCOME,
  RAIL_STATEMENTS,
  railMeta,
  sectionLongLabel,
} from '@/lib/sectionRailLabel'

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
  /** Phone fills a bounded flex container and owns its own scroll
   *  (`height:100%; overflow:auto`). On desktop the question sits in
   *  StudyDesk's sticky column, which already provides the scroll — so
   *  pass `fill={false}` to let the content flow at natural height
   *  instead of creating a nested scroll that clips the options. */
  fill?: boolean
  /** M1 (M3.tsx L881/L1034) — 1-indexed position in the session plan.
   *  When both position and total are present the M3 eyebrow renders
   *  ("ORDFÖRSTÅELSE · FRÅGA 3 AV 10"); when either is missing (legacy
   *  mounts without a session) the eyebrow is omitted entirely. */
  position?: number
  total?: number
}

export function DrillQuestion({
  question,
  picked,
  graded,
  onPick,
  renderExplanation = true,
  fill = true,
  position,
  total,
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

  // M1 tactic aside (M3.tsx L886/L1065) — the pre-grade named-strategy hint.
  // Corpus pregrade_tactic when the explanation carries one, else the
  // section-default hash-rotation catalog (same fallback as PreGradeFill).
  // The loader is cached per exam, so this shares PedagogyPanel's fetch.
  const explanation = useExplanation(question.qid)

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

  // M1 eyebrow (M3.tsx L881/L1034) — only when the caller threads the
  // session plan position through; legacy mounts render no eyebrow.
  const hasEyebrow = position != null && total != null
  // Short-prompt pages (the ORD specimen) fold the eyebrow into the prompt
  // section so the headword sits directly under it in one content column
  // (M3.tsx L873-893); multi-part pages give the eyebrow its own first rail
  // row (M3.tsx L1026-1039) so 'Texten'/'Frågan' labels stay on their rows.
  const mergeEyebrow = hasEyebrow && promptIsShort && !hasContext && !question.figure
  const eyebrowMeta = (
    <>
      <strong>{question.section}</strong>
      {position} / {total}
    </>
  )
  const eyebrowLine = (
    <div className="hpc-m3-eyebrow" data-testid="drill-eyebrow">
      {sectionLongLabel(question.section).toUpperCase()} · FRÅGA {position} AV {total}
    </div>
  )

  const tactic = graded
    ? null
    : (explanation?.pregrade_tactic ?? pickTactic(question.qid, question.section))
  const tacticAside = tactic ? (
    <aside className="hpc-m3-tactic">
      <p className="hpc-m3-tactic-h">Taktik · {tactic.handle}</p>
      <p className="hpc-m3-tactic-t">
        <MathText>{tactic.move}</MathText>
      </p>
    </aside>
  ) : null

  const lastKey = question.options[question.options.length - 1]?.letter.toLowerCase()

  const promptMeta = mergeEyebrow ? (
    eyebrowMeta
  ) : promptIsShort ? (
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
        height: fill ? '100%' : undefined,
        overflowY: fill ? 'auto' : undefined,
        padding: '4px var(--pad-lg) 8px',
        containerType: 'inline-size',
      }}
    >
      {hasEyebrow && !mergeEyebrow && (
        <DrillRailSection meta={eyebrowMeta} delay={nextDelay()}>
          {eyebrowLine}
        </DrillRailSection>
      )}

      {hasContext && (
        <DrillRailSection meta={meta.contextLabel} delay={nextDelay()}>
          {/* data-testid on the passage content, not the rail section — the
           *  section also contains the mono rail label, which would pollute
           *  textContent that e2e reads. */}
          <div className="hpc-m3-passage" data-testid="drill-context">
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

      {/* data-testid on the prompt CONTENT, not the rail section: the section
       *  wraps the mono rail label (e.g. "ORD synonymer") too, and e2e reads
       *  drill-prompt's textContent to resolve the answer — it must be just
       *  the headword/stem. */}
      <DrillRailSection meta={promptMeta} delay={nextDelay()}>
        {mergeEyebrow && eyebrowLine}
        {question.section === 'KVA' && question.prompt ? (
          <div className="hpc-m3-q" data-testid="drill-prompt">
            <KvaPrompt prompt={question.prompt} />
          </div>
        ) : promptIsShort ? (
          <h1 className="hpc-m3-display" data-testid="drill-prompt">
            <MathText>{promptStem}</MathText>
          </h1>
        ) : (
          <p className="hpc-m3-q" data-testid="drill-prompt">
            <MathText>{promptStem}</MathText>
          </p>
        )}
        {tacticAside}
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
        {!graded && lastKey && (
          <div className="hpc-m3-keys">Tangenter a–{lastKey} väljer · klick fungerar också</div>
        )}
      </DrillRailSection>

      {renderExplanation && graded && picked != null && (
        <DrillRailSection meta={RAIL_OUTCOME} delay={nextDelay()}>
          <PedagogyPanel qid={question.qid} graded correct={picked === question.answer} flush />
        </DrillRailSection>
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
