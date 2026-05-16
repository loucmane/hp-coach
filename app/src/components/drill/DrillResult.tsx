// Result screen for a finished drill.
//
// One bold number (correct out of total), the percentage as a quiet
// kicker, then a list of misses with the correct answer revealed. ADHD-PI
// rationale: don't drown the user in stats — show what they got wrong so
// the next study minute is targeted, then give them a single decisive
// "Öva igen" CTA.

import { MathText } from '@/components/MathText'
import { Btn, Eyebrow, Hairline, Mono } from '@/components/primitives'
import type { AnswerLetter, Question } from '@/data/questions'

export type DrillSummary = {
  questions: Question[]
  picks: (AnswerLetter | null)[]
}

type Props = {
  summary: DrillSummary
  onReplay: () => void
  onHome: () => void
}

export function DrillResult({ summary, onReplay, onHome }: Props) {
  const { questions, picks } = summary
  const total = questions.length
  const correct = picks.reduce<number>((n, p, i) => (p === questions[i].answer ? n + 1 : n), 0)
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100)
  const misses = questions
    .map((q, i) => ({ q, picked: picks[i] }))
    .filter(({ q, picked }) => picked !== q.answer)

  return (
    <div
      data-testid="drill-result"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        // Clear the bottom tabs (~80px) so "Öva igen" stays clickable.
        padding: '36px 22px 100px',
        overflowY: 'auto',
      }}
    >
      <Mono>Resultat</Mono>
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        <span
          data-testid="drill-score"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 64,
            lineHeight: 1,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {correct}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            lineHeight: 1,
            color: 'var(--muted)',
            letterSpacing: '-0.02em',
          }}
        >
          / {total}
        </span>
      </div>
      <Mono style={{ marginTop: 6 }}>{pct} % rätt</Mono>

      <div style={{ marginTop: 28, marginBottom: 16 }}>
        <Hairline />
      </div>

      {misses.length === 0 ? (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            lineHeight: 1.3,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
          }}
        >
          Inga missar. Snyggt jobbat.
        </div>
      ) : (
        <>
          <Eyebrow>Att öva på</Eyebrow>
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {misses.map(({ q, picked }) => (
              <MissRow key={q.qid} q={q} picked={picked} />
            ))}
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginTop: 24,
        }}
      >
        <Btn full size="lg" onClick={onReplay}>
          Öva igen
        </Btn>
        <Btn full size="md" variant="secondary" onClick={onHome}>
          Tillbaka
        </Btn>
      </div>
    </div>
  )
}

function MissRow({ q, picked }: { q: Question; picked: AnswerLetter | null }) {
  const correctOption = q.options?.find((o) => o.letter === q.answer)
  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'var(--panel)',
        border: '1px solid var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          color: 'var(--ink)',
          letterSpacing: '-0.005em',
        }}
      >
        <MathText>{q.prompt ?? ''}</MathText>
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-2)',
        }}
      >
        Rätt:{' '}
        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
          {q.answer}. <MathText>{correctOption?.text ?? '—'}</MathText>
        </span>
        {picked && (
          <>
            {' '}
            <span style={{ color: 'var(--muted)' }}>· du valde {picked}</span>
          </>
        )}
      </div>
    </div>
  )
}
