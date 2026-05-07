// /drill — the daily-loop hot path.
//
// State machine:
//   idle      → user hasn't started yet (or finished a drill)
//   answering → showing Q[i], waiting for a pick
//   graded    → Q[i] picked, correct answer revealed, "Nästa" enabled
//   done      → all 10 answered, result screen
//
// Session lifecycle:
//   start  → POST /api/sessions { kind:'drill', sections:'ORD' } (sessionId)
//   pick   → POST /api/attempts (per question)
//   advance→ PATCH /api/sessions/:id { position }   (after each grade)
//   finish → PATCH /api/sessions/:id { end: true }
//
// Cross-device note: drill *plan* (the picked qids) is in-memory only.
// The session row tracks position + currentQuestionId, so a future branch
// can persist the plan in a JSON column and pick this up cleanly. For the
// MVP a reload mid-drill loses progress; we offer to end any leftover
// session from the idle state.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import { useSubmitAttempt } from '@/api/hooks/useAttempts'
import { useActiveSession, useStartSession, useUpdateSession } from '@/api/hooks/useSessions'
import { DrillProgress } from '@/components/drill/DrillProgress'
import { DrillQuestion } from '@/components/drill/DrillQuestion'
import { DrillResult } from '@/components/drill/DrillResult'
import { MobileFrame } from '@/components/MobileFrame'
import { Btn, Eyebrow, Mono } from '@/components/primitives'
import type { AnswerLetter, Question } from '@/data/questions'
import { DEFAULT_DRILL_LENGTH, pickDrillQuestions } from '@/lib/drill'
import { TAB_ROUTE } from '@/lib/nav'

export const Route = createFileRoute('/drill')({
  component: DrillScreen,
})

type Phase = 'idle' | 'answering' | 'graded' | 'done'

function DrillScreen() {
  const navigate = useNavigate()
  const activeSession = useActiveSession()
  const startSession = useStartSession()
  const updateSession = useUpdateSession()
  const submitAttempt = useSubmitAttempt()

  const [phase, setPhase] = useState<Phase>('idle')
  const [plan, setPlan] = useState<Question[]>([])
  const [picks, setPicks] = useState<(AnswerLetter | null)[]>([])
  const [index, setIndex] = useState(0)
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(0)
  const [sessionId, setSessionId] = useState<number | null>(null)

  const begin = useCallback(async () => {
    const picked = pickDrillQuestions('ORD', DEFAULT_DRILL_LENGTH)
    if (picked.length === 0) {
      return
    }
    const session = await startSession.mutateAsync({ kind: 'drill', sections: 'ORD' })
    setSessionId(session.id)
    setPlan(picked)
    setPicks(new Array(picked.length).fill(null))
    setIndex(0)
    setPhase('answering')
    setQuestionStartedAt(Date.now())
    // Persist the first qid as the resume pointer.
    updateSession.mutate({
      id: session.id,
      patch: { position: 0, currentQuestionId: picked[0]?.qid ?? null },
    })
  }, [startSession, updateSession])

  const onPick = useCallback(
    (letter: AnswerLetter) => {
      if (phase !== 'answering') return
      const q = plan[index]
      const correct = letter === q.answer
      setPicks((prev) => {
        const next = [...prev]
        next[index] = letter
        return next
      })
      setPhase('graded')
      // Fire-and-forget: graded UX doesn't block on the network.
      if (sessionId !== null) {
        submitAttempt.mutate({
          sessionId,
          questionId: q.qid,
          selectedAnswer: letter,
          correct,
          timeTakenMs: Date.now() - questionStartedAt,
        })
      }
    },
    [phase, plan, index, sessionId, submitAttempt, questionStartedAt],
  )

  const onNext = useCallback(() => {
    const last = index === plan.length - 1
    if (last) {
      if (sessionId !== null) {
        updateSession.mutate({ id: sessionId, patch: { end: true } })
      }
      setPhase('done')
      return
    }
    const nextIndex = index + 1
    setIndex(nextIndex)
    setPhase('answering')
    setQuestionStartedAt(Date.now())
    if (sessionId !== null) {
      updateSession.mutate({
        id: sessionId,
        patch: {
          position: nextIndex,
          currentQuestionId: plan[nextIndex]?.qid ?? null,
        },
      })
    }
  }, [index, plan, sessionId, updateSession])

  const onReplay = useCallback(() => {
    setPhase('idle')
    setPlan([])
    setPicks([])
    setIndex(0)
    setSessionId(null)
    void begin()
  }, [begin])

  const onHome = useCallback(() => {
    navigate({ to: '/' })
  }, [navigate])

  // Idle state: offer to start, surface stale session if any.
  if (phase === 'idle') {
    return (
      <MobileFrame tabs activeTab="drill" onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}>
        <IdleBody
          activeSession={activeSession.data ?? null}
          onStart={begin}
          starting={startSession.isPending}
          onEndStale={() => {
            if (activeSession.data) {
              updateSession.mutate({
                id: activeSession.data.id,
                patch: { end: true },
              })
            }
          }}
        />
      </MobileFrame>
    )
  }

  if (phase === 'done') {
    return (
      <MobileFrame tabs activeTab="drill" onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}>
        <DrillResult summary={{ questions: plan, picks }} onReplay={onReplay} onHome={onHome} />
      </MobileFrame>
    )
  }

  // answering / graded — full-bleed (no bottom tabs while drilling).
  const q = plan[index]
  const picked = picks[index]
  return (
    <MobileFrame tabs={false}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 16,
          paddingBottom: 22,
        }}
      >
        <DrillProgress current={index + 1} total={plan.length} section={q.section} />
        <div style={{ flex: 1, minHeight: 0, marginTop: 12 }}>
          <DrillQuestion question={q} picked={picked} graded={phase === 'graded'} onPick={onPick} />
        </div>
        <div
          style={{
            padding: '12px 22px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <Btn
            full
            size="lg"
            onClick={onNext}
            disabled={phase !== 'graded'}
            data-testid="drill-next"
          >
            {index === plan.length - 1 ? 'Avsluta' : 'Nästa'}
          </Btn>
        </div>
      </div>
    </MobileFrame>
  )
}

// ── Idle body ─────────────────────────────────────────────────────────────
function IdleBody({
  activeSession,
  onStart,
  starting,
  onEndStale,
}: {
  activeSession: { id: number; kind: string; position: number } | null
  onStart: () => void
  starting: boolean
  onEndStale: () => void
}) {
  const hasStale = activeSession?.kind === 'drill'
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 22px 24px',
      }}
      data-testid="drill-idle"
    >
      <Eyebrow>Övning</Eyebrow>
      <div
        style={{
          marginTop: 18,
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          lineHeight: 1.05,
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
        }}
      >
        ORD
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          lineHeight: 1.35,
          color: 'var(--ink-2)',
        }}
      >
        10 synonymfrågor från riktiga prov.
      </div>
      <Mono style={{ marginTop: 20 }}>~ 3 minuter · 1 poäng per rätt</Mono>

      {hasStale && (
        <div
          data-testid="drill-stale-warning"
          style={{
            marginTop: 24,
            padding: '12px 14px',
            background: 'var(--panel-2)',
            border: '1px solid var(--hairline)',
            borderRadius: 'calc(var(--radius) * 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <Mono>Tidigare övning</Mono>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            En oavslutad ORD-drill från en annan flik eller enhet ligger kvar (vid fråga{' '}
            {activeSession.position + 1}).
          </div>
          <Btn size="sm" variant="secondary" onClick={onEndStale}>
            Avsluta tidigare
          </Btn>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <Btn full size="xl" onClick={onStart} disabled={starting} data-testid="drill-start">
        {starting ? 'Startar…' : 'Starta övning'}
      </Btn>
    </div>
  )
}
