// Single drill question. Two display modes:
//
//   - "answering": all 5 options live, one click commits the answer
//   - "graded":    the picked option + the correct one are revealed; if
//                  they don't match, both are tagged (red on the pick,
//                  green on the right answer)
//
// The headword owns the composition — large display font, centered, with
// generous breathing room above. Options are full-width pills so the touch
// targets are forgiving even on small screens.

import { useEffect, useRef } from 'react'
import { ExplanationPanel } from '@/components/drill/ExplanationPanel'
import { KvaPrompt } from '@/components/drill/KvaPrompt'
import { QuestionFigure } from '@/components/drill/QuestionFigure'
import { MathText } from '@/components/MathText'
import type { AnswerLetter, Option, Question } from '@/data/questions'

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
  // LÄS/ELF/DTK questions carry a `context` (passage). The whole
  // question scrolls as a single column — passage flows into prompt,
  // prompt flows into options. This keeps the entire reading task
  // visible as you scroll instead of trapping you in a tiny passage
  // box at the top with the options in their own micro-scroll below
  // (the original layout — caught by user feedback).
  //
  // ORD/MEK have no context and keep the original centered display
  // layout because their prompts are single-word headwords.
  const hasContext = !!question.context
  const promptIsShort = !question.prompt || question.prompt.length <= 18

  // Container-type on the scroller lets descendants respond to its
  // width — important on reader/studio where the card width changes
  // independently of the viewport. The clamp() formulas below quietly
  // scale prompt + option sizes across phone (390) → studio (1440+).
  return (
    <div
      ref={scrollerRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        // Faint divider on the bottom so the passage doesn't visually
        // touch the Nästa button when scrolled to the end.
        paddingBottom: 8,
        containerType: 'inline-size',
      }}
    >
      {hasContext && (
        <div
          data-testid="drill-context"
          style={{
            margin: '14px var(--pad-lg) 4px',
            padding: '16px 18px',
            background: 'var(--panel-2)',
            border: '1px solid var(--hairline)',
            borderRadius: 'calc(var(--radius) * 0.5)',
            fontFamily: 'var(--font-body, var(--font-display))',
            fontSize: 'clamp(14px, 0.8125rem + 0.3vw, 16px)',
            lineHeight: 1.55,
            color: 'var(--ink)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {question.context}
        </div>
      )}
      {/* Phase A.8 EDITION: section eyebrow sits 8–16px ABOVE the
       *  headword as one typographic unit. Replaces the 200px-orphan
       *  DrillProgress band that Phase A.7 had floating at the top
       *  of the canvas. The status line at the bottom of the page
       *  already carries the running progress bar; the eyebrow just
       *  identifies the section + word type. */}
      {!hasContext && promptIsShort && (
        <div
          data-testid="drill-section-eyebrow"
          style={{
            padding: 'clamp(28px, 4vh, 56px) var(--pad-lg) 6px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: 'var(--font-mono-track)',
            textTransform: 'uppercase',
            display: 'flex',
            gap: 6,
            alignItems: 'baseline',
          }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{question.section}</span>
          <span style={{ color: 'var(--muted)' }}>·</span>
          <span style={{ color: 'var(--muted)' }}>synonymer</span>
        </div>
      )}
      <div
        data-testid="drill-prompt"
        style={{
          padding: hasContext
            ? '18px var(--pad-lg) 14px'
            : promptIsShort
              ? '0 var(--pad-lg) clamp(20px, 2vw + 12px, 32px)'
              : 'clamp(28px, 3vw + 16px, 48px) var(--pad-lg) clamp(20px, 2vw + 12px, 32px)',
          // EDITION rule: flush-left composition. No more center-axis
          // headword floating in space.
          textAlign: 'left',
          fontFamily: 'var(--font-display)',
          fontSize: hasContext
            ? 'clamp(16px, 0.875rem + 0.4vw, 20px)'
            : promptIsShort
              ? 'var(--type-headword)'
              : 'clamp(24px, 1.25rem + 1vw, 36px)',
          lineHeight: hasContext ? 1.3 : promptIsShort ? 1 : 1.2,
          color: 'var(--ink)',
          letterSpacing: promptIsShort ? '-0.025em' : '-0.01em',
          fontWeight: hasContext ? 500 : promptIsShort ? 500 : 400,
        }}
      >
        {question.section === 'KVA' && question.prompt ? (
          <KvaPrompt prompt={question.prompt} />
        ) : (
          <MathText>{question.prompt}</MathText>
        )}
      </div>
      {question.figure && <QuestionFigure figure={question.figure} />}
      <div
        style={{
          padding: '0 var(--pad-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
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
  const styles = optionStyles(state)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={`option-${opt.letter}`}
      data-state={state}
      className="hpc-option"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 'clamp(18px, 1.5vw, 28px)',
        // Phase A.8 refinement: options ARE the action surface — they
        // need to feel selectable without becoming pill-chromed cards.
        // Move:
        //   - Sans-serif body (Inter Tight) for option text, not the
        //     hero serif. Creates typographic contrast between the
        //     headword (display serif) and the action affordance,
        //     and fixes "options look like regular text" feedback.
        //   - 1px hairline rule between rows; left edge ink-accent
        //     marker on hover/picked that shifts in 200ms.
        //   - Hover bg tint at 5% --ink as a quiet "this is clickable"
        //     cue. Removed when graded (no longer interactive).
        padding:
          'clamp(14px, 1.4vh, 18px) clamp(12px, 1vw, 16px) clamp(14px, 1.4vh, 18px) clamp(18px, 1.4vw, 24px)',
        minHeight: 52,
        textAlign: 'left',
        background: styles.bg,
        border: 'none',
        borderTop: '1px solid var(--hairline-2)',
        borderRadius: 0,
        color: styles.textColor,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font-ui)',
        fontSize: 'clamp(15px, 0.875rem + 0.3vw, 18px)',
        lineHeight: 1.4,
        letterSpacing: 'var(--font-ui-track)',
        fontWeight: state === 'picked' || state === 'correct' ? 500 : 400,
        position: 'relative',
        transition: 'color 200ms, background-color 150ms, font-weight 0ms',
        opacity: state === 'idle' && disabled ? 0.45 : 1,
        width: '100%',
      }}
    >
      {/* Leading ink-accent rail — invisible at idle, ink at picked,
       *  accent at correct, bad at incorrect. Provides a visible
       *  selection cue without resorting to pill chrome. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: '15%',
          bottom: '15%',
          width: 3,
          background: styles.rail,
          transition: 'background 200ms',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 'var(--font-mono-track)',
          color: styles.letterColor,
          textTransform: 'lowercase',
          minWidth: '1.6em',
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {opt.letter.toLowerCase()}.
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <MathText>{opt.text}</MathText>
      </span>
      {state === 'correct' && (
        <span
          style={{
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: 'var(--font-mono-track)',
            textTransform: 'uppercase',
          }}
        >
          rätt
        </span>
      )}
      {state === 'incorrect' && (
        <span
          style={{
            color: 'var(--bad)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: 'var(--font-mono-track)',
            textTransform: 'uppercase',
          }}
        >
          fel
        </span>
      )}
    </button>
  )
}

function optionStyles(state: RowState): {
  textColor: string
  letterColor: string
  bg: string
  rail: string
} {
  switch (state) {
    case 'picked':
      return {
        textColor: 'var(--ink)',
        letterColor: 'var(--ink)',
        bg: 'color-mix(in oklch, var(--ink) 4%, transparent)',
        rail: 'var(--ink)',
      }
    case 'correct':
      return {
        textColor: 'var(--ink)',
        letterColor: 'var(--accent)',
        bg: 'color-mix(in oklch, var(--accent) 8%, transparent)',
        rail: 'var(--accent)',
      }
    case 'incorrect':
      return {
        textColor: 'var(--muted)',
        letterColor: 'var(--bad)',
        bg: 'transparent',
        rail: 'var(--bad)',
      }
    default:
      return {
        textColor: 'var(--ink)',
        letterColor: 'var(--muted)',
        bg: 'transparent',
        rail: 'transparent',
      }
  }
}

// Phase A.8 dropped the SVG check/cross Badge in favour of text labels
// ("rätt" / "fel" in mono small-caps) on the OptionRow itself. The
// editorial register avoids decorative iconography.
