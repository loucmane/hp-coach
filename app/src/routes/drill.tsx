// /drill — random ORD drill, 10 questions per session.
//
// Thin route: composes <SessionPlayer> with a random picker and a
// "record-mistake on wrong" side effect. The state machine, lifecycle,
// and UI live in <SessionPlayer>; this file is just config.

import { createFileRoute, Link } from '@tanstack/react-router'

import { useDueMistakes, useRecordMistake } from '@/api/hooks/useMistakes'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { DEFAULT_DRILL_LENGTH, pickDrillQuestions } from '@/lib/drill'

export const Route = createFileRoute('/drill')({
  component: DrillScreen,
})

function DrillScreen() {
  const recordMistake = useRecordMistake()
  const due = useDueMistakes()
  const dueCount = due.data?.length ?? 0

  return (
    <SessionPlayer
      sessionKind="drill"
      sections="ORD"
      activeTab="drill"
      pickQuestions={() => pickDrillQuestions('ORD', DEFAULT_DRILL_LENGTH)}
      idleEyebrow="Övning"
      idleHeadline="ORD"
      idleSubcopy="10 synonymfrågor från riktiga prov."
      idleMeta="~ 3 minuter · 1 poäng per rätt"
      emptyCopy="Inga ORD-frågor klara att öva på just nu."
      idleExtra={dueCount > 0 ? <RepetitionHint count={dueCount} /> : null}
      onWrong={(q) => {
        // Fire-and-forget: a failed mistake-write doesn't block the UX,
        // and the user can keep drilling. The local-grading is the
        // source of truth for the result screen.
        recordMistake.mutate({ questionId: q.qid })
      }}
    />
  )
}

function RepetitionHint({ count }: { count: number }) {
  return (
    <Link
      to="/repetition"
      data-testid="drill-repetition-hint"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        background: 'var(--panel-2)',
        border: '1px solid var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        textDecoration: 'none',
        color: 'var(--ink)',
      }}
    >
      <span style={{ fontSize: 14 }}>
        Du har <strong>{count}</strong> {count === 1 ? 'miss' : 'missar'} att repetera
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track)',
          color: 'var(--ink-2)',
        }}
      >
        →
      </span>
    </Link>
  )
}
