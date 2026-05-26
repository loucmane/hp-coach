// Payoff Variant A — current `DrillResult` verbatim.
//
// Renders the production session-end screen exactly as it ships today,
// so the bake-off compares polish against the actual control rather
// than against air. Composition mirrors DrillResult.tsx 1:1 — eyebrow,
// big score, percent kicker, miss list, two CTAs.

import { MathText } from '@/components/MathText'
import { Btn, CoachLine, Eyebrow, Hairline, Mono } from '@/components/primitives'
import type { AnswerLetter, Question } from '@/data/questions'
import { FIXTURE_DRILL_SUMMARY } from '@/lib/devbakeFixtures'
import { VOICE } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'

export function PayoffVariantA() {
  const { questions, picks } = FIXTURE_DRILL_SUMMARY
  const total = questions.length
  const correct = picks.reduce<number>((n, p, i) => (p === questions[i].answer ? n + 1 : n), 0)
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100)
  const coach = useCoachStore((s) => s.coach)
  const misses = questions
    .map((q, i) => ({ q, picked: picks[i] }))
    .filter(({ q, picked }) => picked !== q.answer)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '36px 22px',
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius)',
        height: '100%',
      }}
    >
      <Mono>Resultat</Mono>
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span
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
        <CoachLine coach={coach} as="title">
          {`${VOICE[coach].sessionEnd.split(/\.\s+/)[0]}.`}
        </CoachLine>
      ) : (
        <>
          <Eyebrow>Att öva på</Eyebrow>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {misses.map(({ q, picked }) => (
              <MissRow key={q.qid} q={q} picked={picked} />
            ))}
          </div>
        </>
      )}

      <div style={{ flex: 1, minHeight: 24 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
        <Btn full size="lg" onClick={() => {}}>
          Öva igen
        </Btn>
        <Btn full size="md" variant="secondary" onClick={() => {}}>
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
      <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
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
