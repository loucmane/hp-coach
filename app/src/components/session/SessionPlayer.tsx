// Reusable Q-by-Q session player.
//
// Handles the same state machine as the drill MVP shipped earlier
// (idle → answering → graded → done) but parameterised by:
//
//   - pickQuestions:  () => Question[] | Promise<Question[]>
//                     Resolves to the plan when the user clicks "Start".
//                     For /drill this is "10 random ORD"; for /repetition
//                     it's "10 most-frequent stumbles from the queue".
//
//   - sessionKind:    SessionKind passed to POST /api/sessions so the
//                     backend can later analytics-bucket drill vs review.
//
//   - sections:       optional CSV stored on the session row.
//
//   - onCorrect/onWrong:
//                     side-effects fired alongside the per-question
//                     attempt POST. /drill uses onWrong to record
//                     mistakes; /repetition uses onCorrect to resolve them.
//
//   - idleCopy:       hero text on the idle screen (Swedish product copy).
//
//   - emptyCopy:      shown when pickQuestions returns 0 (e.g. "Inga
//                     missar att repetera"). Replaces the start button.
//
// The component owns the session row's full lifecycle:
//   start  → POST /api/sessions
//   pick   → POST /api/attempts (always, regardless of correctness)
//   next   → PATCH /api/sessions/:id { position, currentQuestionId }
//   end    → PATCH /api/sessions/:id { end: true }
//
// Stale-session handling: useActiveSession is consulted on the idle
// screen so we surface "Avsluta tidigare övning" if a session of the
// same kind is still hanging open from another tab/device.

import { useNavigate } from '@tanstack/react-router'
import { type ReactNode, useCallback, useState } from 'react'

import { useSubmitAttempt } from '@/api/hooks/useAttempts'
import {
  type SessionKind,
  useActiveSession,
  useStartSession,
  useUpdateSession,
} from '@/api/hooks/useSessions'
import { DrillProgress } from '@/components/drill/DrillProgress'
import { DrillQuestion } from '@/components/drill/DrillQuestion'
import { DrillResult } from '@/components/drill/DrillResult'
import { MobileFrame } from '@/components/MobileFrame'
import { Btn, Eyebrow, Mono } from '@/components/primitives'
import type { AnswerLetter, Question } from '@/data/questions'
import { TAB_ROUTE } from '@/lib/nav'

type Phase = 'idle' | 'answering' | 'graded' | 'done'

export type SessionPlayerProps = {
  /** Kind to pass to POST /api/sessions. */
  sessionKind: SessionKind
  /** Optional CSV stored on the session row, e.g. "ORD". */
  sections?: string
  /** Resolves to the plan when the user clicks Start. */
  pickQuestions: () => Promise<Question[]> | Question[]
  /** Hero copy on the idle screen — e.g. "10 synonymfrågor från riktiga prov." */
  idleEyebrow: string
  idleHeadline: string
  idleSubcopy: string
  idleMeta?: string
  /** Optional Swedish reassurance shown when pickQuestions returns []. */
  emptyCopy?: string
  /** Side-effects on each grade. Run after the local state flip. */
  onCorrect?: (q: Question) => void
  onWrong?: (q: Question) => void
  /** Active-tab to highlight in the bottom nav while idle/done. */
  activeTab: 'home' | 'drill' | 'coach' | 'progress'
  /** Optional extra content rendered on the idle screen, after the meta
   *  line. Used by /drill to surface a "repetera missar" hint. */
  idleExtra?: ReactNode
  /** Disable the primary "Starta övning" button — used when the consumer
   *  knows there's nothing to start (e.g. /repetition with empty queue). */
  disableStart?: boolean
  /** Replacement label shown on the disabled primary button. */
  disableStartLabel?: string
  /** Secondary CTA rendered just above the primary button. Used to give
   *  the user a way out when the primary action is disabled. */
  idleSecondaryCta?: ReactNode
}

export function SessionPlayer(props: SessionPlayerProps) {
  const navigate = useNavigate()
  const activeSession = useActiveSession()
  const startSession = useStartSession()
  const updateSession = useUpdateSession()
  const submitAttempt = useSubmitAttempt()

  const [phase, setPhase] = useState<Phase>('idle')
  const [plan, setPlan] = useState<Question[]>([])
  const [picks, setPicks] = useState<(AnswerLetter | null)[]>([])
  const [index, setIndex] = useState(0)
  const [questionStartedAt, setQuestionStartedAt] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [emptyAttempted, setEmptyAttempted] = useState(false)

  const begin = useCallback(async () => {
    const picked = await props.pickQuestions()
    if (picked.length === 0) {
      setEmptyAttempted(true)
      return
    }
    const session = await startSession.mutateAsync({
      kind: props.sessionKind,
      sections: props.sections,
    })
    setSessionId(session.id)
    setPlan(picked)
    setPicks(new Array(picked.length).fill(null))
    setIndex(0)
    setPhase('answering')
    setQuestionStartedAt(Date.now())
    updateSession.mutate({
      id: session.id,
      patch: { position: 0, currentQuestionId: picked[0]?.qid ?? null },
    })
  }, [props, startSession, updateSession])

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
      if (sessionId !== null) {
        submitAttempt.mutate({
          sessionId,
          questionId: q.qid,
          selectedAnswer: letter,
          correct,
          timeTakenMs: Date.now() - questionStartedAt,
        })
      }
      if (correct) props.onCorrect?.(q)
      else props.onWrong?.(q)
    },
    [phase, plan, index, sessionId, submitAttempt, questionStartedAt, props],
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
    setEmptyAttempted(false)
    void begin()
  }, [begin])

  const onHome = useCallback(() => navigate({ to: '/' }), [navigate])

  if (phase === 'idle') {
    const stale =
      activeSession.data && activeSession.data.kind === props.sessionKind
        ? activeSession.data
        : null
    return (
      <MobileFrame
        tabs
        activeTab={props.activeTab}
        onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
      >
        <IdleBody
          {...props}
          starting={startSession.isPending}
          onStart={begin}
          stale={stale}
          onEndStale={() => {
            if (stale) updateSession.mutate({ id: stale.id, patch: { end: true } })
          }}
          emptyAttempted={emptyAttempted}
        />
      </MobileFrame>
    )
  }

  if (phase === 'done') {
    return (
      <MobileFrame
        tabs
        activeTab={props.activeTab}
        onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
      >
        <DrillResult summary={{ questions: plan, picks }} onReplay={onReplay} onHome={onHome} />
      </MobileFrame>
    )
  }

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
type IdleBodyProps = SessionPlayerProps & {
  starting: boolean
  onStart: () => void
  stale: { id: number; kind: string; position: number } | null
  onEndStale: () => void
  emptyAttempted: boolean
}

function IdleBody({
  idleEyebrow,
  idleHeadline,
  idleSubcopy,
  idleMeta,
  idleExtra,
  emptyCopy,
  starting,
  onStart,
  stale,
  onEndStale,
  emptyAttempted,
  disableStart,
  disableStartLabel,
  idleSecondaryCta,
}: IdleBodyProps) {
  return (
    <div
      data-testid="drill-idle"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        // 100px clears the absolutely-positioned BottomTabs.
        padding: '40px 22px 100px',
      }}
    >
      <Eyebrow>{idleEyebrow}</Eyebrow>
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
        {idleHeadline}
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
        {idleSubcopy}
      </div>
      {idleMeta && <Mono style={{ marginTop: 20 }}>{idleMeta}</Mono>}

      {idleExtra && <div style={{ marginTop: 20 }}>{idleExtra}</div>}

      {(emptyAttempted || disableStart) && emptyCopy && (
        <div
          data-testid="drill-empty"
          style={{
            marginTop: 24,
            padding: '12px 14px',
            background: 'var(--panel-2)',
            border: '1px solid var(--hairline)',
            borderRadius: 'calc(var(--radius) * 0.5)',
            fontSize: 14,
            color: 'var(--ink-2)',
          }}
        >
          {emptyCopy}
        </div>
      )}

      {stale && (
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
            Ett oavslutat pass från en annan flik eller enhet ligger kvar (vid fråga{' '}
            {stale.position + 1}).
          </div>
          <Btn size="sm" variant="secondary" onClick={onEndStale}>
            Avsluta tidigare
          </Btn>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {idleSecondaryCta && (
        <div style={{ marginBottom: 10 }} data-testid="drill-secondary-cta">
          {idleSecondaryCta}
        </div>
      )}
      <Btn
        full
        size="xl"
        onClick={onStart}
        disabled={starting || !!disableStart}
        data-testid="drill-start"
      >
        {starting
          ? 'Startar…'
          : disableStart
            ? (disableStartLabel ?? 'Inget att starta')
            : 'Starta övning'}
      </Btn>
    </div>
  )
}
