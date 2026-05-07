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

import type { CSSProperties } from 'react'

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
  if (!question.options || question.parsing_status !== 'complete') {
    return (
      <div
        style={{
          padding: 22,
          color: 'var(--muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
      >
        Frågan saknar fullständig text.
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        data-testid="drill-prompt"
        style={{
          padding: '32px 22px 24px',
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: question.prompt && question.prompt.length > 18 ? 24 : 32,
          lineHeight: 1.18,
          color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}
      >
        {question.prompt}
      </div>
      <div
        style={{
          flex: 1,
          padding: '0 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflowY: 'auto',
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
        padding: '14px 16px',
        minHeight: 60,
        textAlign: 'left',
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: 'calc(var(--radius) * 0.6)',
        color: styles.color,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        fontSize: 15,
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
      <span style={{ flex: 1 }}>{opt.text}</span>
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
