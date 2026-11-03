// Shared Provpass lifecycle. Views own keyboard handling, focus and confirmations.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSubmitAttempt } from '@/api/hooks/useAttempts'
import { useRecordMistake } from '@/api/hooks/useMistakes'
import {
  type MockHalf,
  type MockMode,
  type MockResultRow,
  useSubmitMockResult,
} from '@/api/hooks/useMockResults'
import { useUpdateSession } from '@/api/hooks/useSessions'
import type { AnswerLetter, Question } from '@/data/questions'
import { useCountdown } from '@/hooks/useCountdown'
import { computeMockSummary } from '@/lib/mock'
import {
  clearMockFlags,
  createMockSheet,
  dwellFor,
  loadMockFlags,
  type MockSheetState,
  mockSheetReducer,
  saveMockFlags,
  toSummarySheet,
} from '@/lib/mockSheet'

export const MOCK_DURATION_MS = 55 * 60_000

export type MockRunnerSession = {
  id: number
  startedAt: Date
  mode: MockMode
  half: MockHalf
  examId?: string | null
  provpass?: string | null
}

export type MockResultExtras = {
  flagged: string[]
  answers: ReadonlyMap<string, string>
}

export type MockPassProps = {
  plan: Question[]
  session: MockRunnerSession
  seenBefore: number
  onSettled: (result: MockResultRow, extras: MockResultExtras) => void
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

/** Mount beneath a key containing account and session identity, as both runners do. */
export function useMockPass(
  {
    plan,
    session,
    seenBefore,
    onSettled,
    onVoid,
    initialSheet,
    initialIndex,
    durationMsOverride,
  }: MockPassProps,
  userId: string | null | undefined,
) {
  const [index, setIndex] = useState(() =>
    initialIndex != null ? Math.min(Math.max(initialIndex, 0), Math.max(plan.length - 1, 0)) : 0,
  )
  const [sheet, setSheet] = useState<MockSheetState>(() => ({
    ...(initialSheet ?? createMockSheet()),
    flagged: loadMockFlags(userId, session.id),
  }))
  const settledRef = useRef(false)

  useEffect(() => {
    // A queued render after hand-in must not recreate the cleared storage key.
    if (!settledRef.current) saveMockFlags(userId, session.id, sheet.flagged)
  }, [userId, session.id, sheet.flagged])

  const updateSession = useUpdateSession()
  const submitAttempt = useSubmitAttempt()
  const recordMistake = useRecordMistake()
  const submitMockResult = useSubmitMockResult()

  const countdown = useCountdown(session.startedAt, durationMsOverride ?? MOCK_DURATION_MS)

  const q = plan[index]

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

  const toggleFlag = useCallback(() => {
    if (!q || settledRef.current) return
    setSheet((s) =>
      mockSheetReducer(s, {
        type: s.flagged.has(q.qid) ? 'unflag' : 'flag',
        qid: q.qid,
      }),
    )
  }, [q])

  const recordFinalMistakes = useCallback(
    (finalSheet: MockSheetState, includeFlaggedCorrect = false) => {
      for (const question of plan) {
        const letter = finalSheet.answers.get(question.qid)?.letter ?? null
        // Hand-in also queues uncertain correct answers. Blanks never enter
        // Repetera; abandon keeps only the existing wrong-answer behavior.
        if (
          letter != null &&
          (letter !== question.answer ||
            (includeFlaggedCorrect && finalSheet.flagged.has(question.qid)))
        ) {
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

    const flagged = [...settled.flagged]
    // Attempt POSTs can still be in flight when the result opens. Capture the
    // same final picks used for grading before either settlement request runs.
    const answers = new Map([...settled.answers].map(([qid, answer]) => [qid, answer.letter]))
    clearMockFlags(userId, session.id)
    recordFinalMistakes(settled, true)
    // SEQUENCED, not concurrent: the worker rejects POST /api/mock-results
    // for a session that isn't ended yet (400 not_ended), so the result POST
    // must wait for the end-session PATCH to commit. Fired concurrently these
    // raced — whenever the POST landed first the submit silently died and the
    // runner sat on 00:00 forever (onSettled only fires on POST success).
    updateSession.mutate(
      { id: session.id, patch: { end: true } },
      {
        onSuccess: () => {
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
            { onSuccess: (row) => onSettled(row, { flagged, answers }) },
          )
        },
      },
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
    userId,
  ])

  const abandon = useCallback(() => {
    if (settledRef.current) return
    settledRef.current = true
    const settled = mockSheetReducer(sheet, { type: 'settle' })
    clearMockFlags(userId, session.id)
    recordFinalMistakes(settled)
    updateSession.mutate({ id: session.id, patch: { end: true } })
    onVoid()
  }, [sheet, recordFinalMistakes, updateSession, session.id, onVoid, userId])

  // Auto-submit exactly once when the countdown expires.
  useEffect(() => {
    if (countdown.expired) settle()
  }, [countdown.expired, settle])

  return { index, sheet, q, countdown, pick, goTo, toggleFlag, settle, abandon }
}
