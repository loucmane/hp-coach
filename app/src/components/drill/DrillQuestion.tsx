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

import { type CSSProperties, useEffect, useRef } from 'react'
import { ExplanationPanel } from '@/components/drill/ExplanationPanel'
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
}

export function DrillQuestion({ question, picked, graded, onPick }: Props) {
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
      <div
        data-testid="drill-prompt"
        style={{
          padding: hasContext
            ? '18px var(--pad-lg) 14px'
            : 'clamp(28px, 3vw + 16px, 48px) var(--pad-lg) clamp(20px, 2vw + 12px, 32px)',
          textAlign: hasContext ? 'left' : 'center',
          fontFamily: 'var(--font-display)',
          // Three regimes, each clamp()ed so the prompt scales smoothly
          // across phone → studio without per-breakpoint rewrites:
          //   - context (LÄS/ELF/DTK): 18→20px (small, paragraph-density)
          //   - short headword (ORD): 32→44px (the bold single word)
          //   - long stem (MEK, KVA): 24→30px (the middle ground)
          fontSize: hasContext
            ? 'clamp(16px, 0.875rem + 0.4vw, 20px)'
            : promptIsShort
              ? 'clamp(28px, 4vw + 16px, 44px)'
              : 'clamp(22px, 1rem + 1.2vw, 30px)',
          lineHeight: hasContext ? 1.3 : 1.18,
          color: 'var(--ink)',
          letterSpacing: '-0.01em',
          fontWeight: hasContext ? 500 : 400,
        }}
      >
        <MathText>{question.prompt}</MathText>
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
      {graded && picked != null && (
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        // Padding + min-height keep the tap target ≥44px (WCAG 2.5.5)
        // on phone and grow into a comfortable 64px on tablet+. Fluid
        // formula stays well above the 44px floor at every viewport.
        padding: 'clamp(12px, 1vh, 16px) clamp(14px, 1vw + 12px, 20px)',
        minHeight: 'clamp(56px, 9vh, 64px)',
        textAlign: 'left',
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: 'calc(var(--radius) * 0.6)',
        color: styles.color,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        fontSize: 'clamp(14px, 0.875rem + 0.2vw, 17px)',
        lineHeight: 1.35,
        transition: 'background 200ms, border-color 200ms, color 200ms',
        opacity: state === 'idle' && disabled ? 0.55 : 1,
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 'var(--font-mono-track)',
          background: styles.letterBg,
          color: styles.letterColor,
          border: `1px solid ${styles.letterBorder}`,
        }}
      >
        {opt.letter}
      </span>
      <span style={{ flex: 1 }}>
        <MathText>{opt.text}</MathText>
      </span>
      {state === 'correct' && <Badge kind="check" />}
      {state === 'incorrect' && <Badge kind="cross" />}
    </button>
  )
}

function optionStyles(state: RowState): {
  bg: CSSProperties['background']
  border: string
  color: string
  letterBg: string
  letterColor: string
  letterBorder: string
} {
  switch (state) {
    case 'picked':
      return {
        bg: 'var(--panel)',
        border: 'var(--ink)',
        color: 'var(--ink)',
        letterBg: 'var(--ink)',
        letterColor: 'var(--bg)',
        letterBorder: 'var(--ink)',
      }
    case 'correct':
      return {
        bg: 'color-mix(in oklch, var(--accent) 18%, var(--panel))',
        border: 'var(--accent)',
        color: 'var(--ink)',
        letterBg: 'var(--accent)',
        letterColor: 'var(--accent-ink)',
        letterBorder: 'var(--accent)',
      }
    case 'incorrect':
      return {
        bg: 'color-mix(in oklch, oklch(0.55 0.16 25) 14%, var(--panel))',
        border: 'oklch(0.55 0.16 25)',
        color: 'var(--ink)',
        letterBg: 'oklch(0.55 0.16 25)',
        letterColor: 'var(--bg)',
        letterBorder: 'oklch(0.55 0.16 25)',
      }
    default:
      return {
        bg: 'var(--panel)',
        border: 'var(--hairline)',
        color: 'var(--ink)',
        letterBg: 'transparent',
        letterColor: 'var(--ink-2)',
        letterBorder: 'var(--hairline)',
      }
  }
}

function Badge({ kind }: { kind: 'check' | 'cross' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      role="img"
      aria-label={kind === 'check' ? 'Rätt' : 'Fel'}
    >
      <title>{kind === 'check' ? 'Rätt' : 'Fel'}</title>
      {kind === 'check' ? (
        <path
          d="M3.5 9.5l3.5 3.5 7.5-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <path d="M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
