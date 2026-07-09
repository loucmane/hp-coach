// MockRunner — the Provpass (mock exam) pass runner.
//
// Deliberately NOT SessionPlayer: a mock is free-navigation, no
// per-question grading, hard countdown, single settle-at-the-end —
// the opposite shape of SessionPlayer's forward-only answer→graded→
// next state machine. MockRunner reuses SessionPlayer's PIECES
// (DrillQuestion / BoksidanDesk rendered permanently `graded={false}`,
// dtkBlockPosition, the session + attempt + mistake hooks) but owns its
// own render loop and answer sheet (lib/mockSheet.ts).
//
// Route wiring (adopting an active `kind=mock` session on reload, the
// picker screen, PATCH-end plumbing at the /prov route level) is PR 3/4's
// job. This component is self-contained given a resolved `plan` and a
// `session` — see the Props type.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSubmitAttempt } from '@/api/hooks/useAttempts'
import { useRecordMistake } from '@/api/hooks/useMistakes'
import {
  type MockHalf,
  type MockMode,
  type MockResultRow,
  useSubmitMockResult,
} from '@/api/hooks/useMockResults'
import { useUpdateSession } from '@/api/hooks/useSessions'
import { DrillQuestion } from '@/components/drill/DrillQuestion'
import { BoksidanDesk } from '@/components/drill-variants/BoksidanDesk'
import { MobileFrame } from '@/components/MobileFrame'
import { Btn } from '@/components/primitives'
import { dtkBlockPosition } from '@/components/session/SessionPlayer'
import type { AnswerLetter, Question, Section } from '@/data/questions'
import { useCountdown } from '@/hooks/useCountdown'
import { useViewport } from '@/hooks/useViewport'
import { computeMockSummary } from '@/lib/mock'
import {
  createMockSheet,
  dwellFor,
  type MockSheetState,
  mockSheetReducer,
  toSummarySheet,
} from '@/lib/mockSheet'
import { sectionLongLabel } from '@/lib/sectionRailLabel'

export type { MockSheetState } from '@/lib/mockSheet'

export const MOCK_DURATION_MS = 55 * 60_000

export type MockRunnerSession = {
  id: number
  startedAt: Date
  mode: MockMode
  half: MockHalf
  examId?: string | null
  provpass?: string | null
}

type Props = {
  plan: Question[]
  session: MockRunnerSession
  seenBefore: number
  onSettled: (result: MockResultRow) => void
  onVoid: () => void
  /** Reload-adopt: a sheet rebuilt from persisted attempts (lib/mockSheet.ts
   *  sheetFromAttempts), so re-mounting an in-flight mock after a refresh
   *  restores the answer grid instead of starting blank. Omit for a fresh
   *  start (the default createMockSheet() empty state). */
  initialSheet?: MockSheetState
  /** Which question to land on when adopting a reload — mirrors the
   *  session's last-known position. Defaults to 0 (index into `plan`,
   *  clamped). */
  initialIndex?: number
  /** Dev-only override for the pass duration (see /prov's `?devMinutes`
   *  knob, isDevSurface()-gated) — never set in production paths. */
  durationMsOverride?: number
}

function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Section-boundary labels for the grid header — one entry per section
 *  run, e.g. "ORD 1–10". Built from the plan's actual composition (not
 *  a hardcoded quota table) so it degrades gracefully for a thin
 *  authentic pass (33/40, etc). */
function sectionBoundaries(
  plan: Question[],
): Array<{ section: Section; start: number; end: number }> {
  const out: Array<{ section: Section; start: number; end: number }> = []
  for (let i = 0; i < plan.length; i++) {
    const section = plan[i].section
    const last = out[out.length - 1]
    if (last && last.section === section) {
      last.end = i + 1
    } else {
      out.push({ section, start: i + 1, end: i + 1 })
    }
  }
  return out
}

export function MockRunner({
  plan,
  session,
  seenBefore,
  onSettled,
  onVoid,
  initialSheet,
  initialIndex,
  durationMsOverride,
}: Props) {
  const viewport = useViewport()
  const isPhone = viewport === 'phone'

  const [index, setIndex] = useState(() =>
    initialIndex != null ? Math.min(Math.max(initialIndex, 0), Math.max(plan.length - 1, 0)) : 0,
  )
  const [sheet, setSheet] = useState<MockSheetState>(() => initialSheet ?? createMockSheet())
  const settledRef = useRef(false)

  const updateSession = useUpdateSession()
  const submitAttempt = useSubmitAttempt()
  const recordMistake = useRecordMistake()
  const submitMockResult = useSubmitMockResult()

  const countdown = useCountdown(session.startedAt, durationMsOverride ?? MOCK_DURATION_MS)

  const q = plan[index]
  const blockPosition = useMemo(() => dtkBlockPosition(plan, index), [plan, index])

  // Enter the first question on mount; enter(qid) on every index change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only qid identity should re-enter
  useEffect(() => {
    if (!q) return
    setSheet((s) => mockSheetReducer(s, { type: 'enter', qid: q.qid }))
  }, [q?.qid])

  const pick = useCallback(
    (letter: AnswerLetter) => {
      if (!q) return
      setSheet((s) => mockSheetReducer(s, { type: 'pick', qid: q.qid, letter }))
      const correct = letter === q.answer
      submitAttempt.mutate({
        sessionId: session.id,
        questionId: q.qid,
        selectedAnswer: letter,
        correct,
        timeTakenMs: dwellFor(sheet, q.qid, Date.now()),
      })
    },
    [q, session.id, submitAttempt, sheet],
  )

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= plan.length || nextIndex === index) return
      setSheet((s) => mockSheetReducer(s, { type: 'leave' }))
      setIndex(nextIndex)
      const nextQid = plan[nextIndex]?.qid ?? null
      updateSession.mutate({
        id: session.id,
        patch: { position: nextIndex, currentQuestionId: nextQid },
      })
    },
    [index, plan, session.id, updateSession],
  )

  const recordFinalMistakes = useCallback(
    (finalSheet: MockSheetState) => {
      for (const question of plan) {
        const letter = finalSheet.answers.get(question.qid)?.letter ?? null
        // Blanks: no attempt, no mistake. Only finally-wrong ANSWERED
        // questions feed the mistake queue.
        if (letter != null && letter !== question.answer) {
          recordMistake.mutate({ questionId: question.qid })
        }
      }
    },
    [plan, recordMistake],
  )

  const settle = useCallback(() => {
    if (settledRef.current) return
    settledRef.current = true
    const settled = mockSheetReducer(sheet, { type: 'settle' })
    const summaryTimestamp = Date.now()
    const summarySheet = toSummarySheet(settled, summaryTimestamp)
    const summary = computeMockSummary(plan, summarySheet)

    recordFinalMistakes(settled)
    updateSession.mutate({ id: session.id, patch: { end: true } })
    submitMockResult.mutate(
      {
        sessionId: session.id,
        mode: session.mode,
        half: session.half,
        examId: session.examId ?? null,
        provpass: session.provpass ?? null,
        presented: summary.presented,
        answered: summary.answered,
        correct: summary.correct,
        seenBefore,
        durationMs: summaryTimestamp - session.startedAt.getTime(),
        breakdown: summary.breakdown,
      },
      { onSuccess: onSettled },
    )
  }, [
    sheet,
    plan,
    recordFinalMistakes,
    updateSession,
    session,
    seenBefore,
    submitMockResult,
    onSettled,
  ])

  const abandon = useCallback(() => {
    if (settledRef.current) return
    settledRef.current = true
    const settled = mockSheetReducer(sheet, { type: 'settle' })
    recordFinalMistakes(settled)
    updateSession.mutate({ id: session.id, patch: { end: true } })
    onVoid()
  }, [sheet, recordFinalMistakes, updateSession, session.id, onVoid])

  // Auto-submit exactly once when the countdown expires.
  useEffect(() => {
    if (countdown.expired) settle()
  }, [countdown.expired, settle])

  // Keyboard: a–e pick, ←/→ navigate. No graded phase, no Enter-advance.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      )
        return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toUpperCase()
      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        e.preventDefault()
        pick(key as AnswerLetter)
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goTo(index + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goTo(index - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pick, goTo, index])

  const handleSubmitClick = useCallback(() => {
    const unanswered = plan.filter(
      (question) => sheet.answers.get(question.qid)?.letter == null,
    ).length
    const msg =
      unanswered > 0 ? `${unanswered} frågor är obesvarade. Lämna in ändå?` : 'Lämna in provpasset?'
    // House pattern for a confirm-then-act flow (routes/coach.tsx) — no
    // Dialog primitive exists yet for this.
    if (confirm(msg)) settle()
  }, [plan, sheet, settle])

  const handleAbandonClick = useCallback(() => {
    if (confirm('Avbryter du blir provet ogiltigt.')) abandon()
  }, [abandon])

  if (!q) return null

  const boundaries = sectionBoundaries(plan)
  const picked = (sheet.answers.get(q.qid)?.letter as AnswerLetter | undefined) ?? null
  const remaining = countdown.remainingMs
  const underFiveMinutes = remaining < 5 * 60_000

  const header = (
    <MockHeader
      index={index}
      total={plan.length}
      section={q.section}
      remainingMs={remaining}
      urgent={underFiveMinutes}
      onSubmit={handleSubmitClick}
    />
  )

  const grid = (
    <MockGrid
      plan={plan}
      boundaries={boundaries}
      answers={sheet.answers}
      currentIndex={index}
      onJump={goTo}
    />
  )

  const questionBody = isPhone ? (
    <DrillQuestion
      question={q}
      picked={picked}
      graded={false}
      onPick={pick}
      position={index + 1}
      total={plan.length}
      blockPosition={blockPosition}
    />
  ) : (
    <BoksidanDesk
      question={q}
      explanation={null}
      picked={picked}
      graded={false}
      correct={false}
      onPick={pick}
      onReset={() => {}}
      position={index + 1}
      total={plan.length}
      blockPosition={blockPosition}
    />
  )

  return (
    <MobileFrame tabs={false}>
      <div
        data-testid="mock-runner"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {header}
        {grid}
        <div style={{ flex: 1, minHeight: 0, overflowY: isPhone ? undefined : 'auto' }}>
          {questionBody}
        </div>
        <div style={{ padding: 'var(--pad-md)', textAlign: 'center' }}>
          <button
            type="button"
            data-testid="mock-abandon"
            onClick={handleAbandonClick}
            className="hpc-btn"
            style={{
              all: 'unset',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
            }}
          >
            Avbryt provpass
          </button>
        </div>
      </div>
    </MobileFrame>
  )
}

function MockHeader({
  index,
  total,
  section,
  remainingMs,
  urgent,
  onSubmit,
}: {
  index: number
  total: number
  section: Section
  remainingMs: number
  urgent: boolean
  onSubmit: () => void
}) {
  return (
    <div
      data-testid="mock-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--pad-md)',
        padding: 'var(--pad-md)',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)' }}>
        Fråga {index + 1}/{total} · {section}
      </div>
      <div
        data-testid="mock-countdown"
        style={{
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 15,
          fontWeight: urgent ? 700 : 400,
          color: urgent ? 'var(--bad, #c0392b)' : 'var(--muted)',
        }}
      >
        {formatClock(remainingMs)}
      </div>
      <Btn size="sm" variant="secondary" data-testid="mock-submit" onClick={onSubmit}>
        Lämna in
      </Btn>
    </div>
  )
}

function MockGrid({
  plan,
  boundaries,
  answers,
  currentIndex,
  onJump,
}: {
  plan: Question[]
  boundaries: Array<{ section: Section; start: number; end: number }>
  answers: Map<string, { letter: string; lastAt: number }>
  currentIndex: number
  onJump: (index: number) => void
}) {
  return (
    <div
      data-testid="mock-grid"
      style={{ padding: 'var(--pad-sm) var(--pad-md)', borderBottom: '1px solid var(--hairline)' }}
    >
      <div
        style={{
          display: 'flex',
          gap: 4,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--muted)',
          marginBottom: 4,
        }}
      >
        {boundaries.map((b) => (
          <span key={b.section} data-testid={`mock-boundary-${b.section}`}>
            {sectionLongLabel(b.section).slice(0, 3).toUpperCase()} {b.start}–{b.end}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
        {plan.map((question, i) => {
          const answered = answers.get(question.qid)?.letter != null
          const isCurrent = i === currentIndex
          return (
            <button
              key={question.qid}
              type="button"
              data-testid={`mock-cell-${i + 1}`}
              data-answered={answered ? 'true' : 'false'}
              data-current={isCurrent ? 'true' : 'false'}
              onClick={() => onJump(i)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                height: 28,
                borderRadius: 4,
                border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--hairline)',
                background: answered ? 'var(--panel-2)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
