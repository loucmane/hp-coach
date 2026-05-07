// /repetition — replay your most-frequent stumbles.
//
// Thin route: pulls the due-mistakes queue, resolves to questions,
// and hands them to <SessionPlayer> as a kind='adaptive_review'
// session. On every CORRECT answer we resolve the corresponding
// mistake server-side so it falls out of the queue.
//
// Wrong answers in replay are recorded as new mistakes (just like in
// /drill). Today that's a no-op for already-active mistakes (the
// upsert just bumps errorCount), but once we add SRS spacing the
// counter will drive the next-review-at calculation.

import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'

import { useDueMistakes, useRecordMistake, useResolveMistake } from '@/api/hooks/useMistakes'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { DEFAULT_REPLAY_LENGTH, pickReplayQuestions } from '@/lib/replay'

export const Route = createFileRoute('/repetition')({
  component: RepetitionScreen,
})

function RepetitionScreen() {
  const due = useDueMistakes()
  const recordMistake = useRecordMistake()
  const resolveMistake = useResolveMistake()

  // Build the qid → mistakeId map once per query result so onCorrect
  // can find the mistake row to resolve in O(1) without re-running
  // the picker. The map covers the *entire* due queue, not just the
  // 10 we play, so resolves are correct even if the SessionPlayer
  // grabbed a different subset (it doesn't, but defensive).
  const qidToMistakeId = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of due.data ?? []) m.set(row.questionId, row.id)
    return m
  }, [due.data])

  return (
    <SessionPlayer
      sessionKind="adaptive_review"
      sections="ORD"
      activeTab="drill"
      pickQuestions={() => {
        const dueRows = due.data ?? []
        return pickReplayQuestions(dueRows, DEFAULT_REPLAY_LENGTH).map((r) => r.question)
      }}
      idleEyebrow="Repetition"
      idleHeadline="Dina missar"
      idleSubcopy={
        due.data && due.data.length > 0
          ? `Repetera ${Math.min(due.data.length, DEFAULT_REPLAY_LENGTH)} frågor du svarat fel på.`
          : 'Du har inga missar att repetera just nu.'
      }
      idleMeta={
        due.data && due.data.length > 0 ? `${due.data.length} aktiva missar i kön` : undefined
      }
      emptyCopy="Inga missar att repetera. När du svarar fel i en övning landar frågan här."
      onCorrect={(q) => {
        const id = qidToMistakeId.get(q.qid)
        if (id !== undefined) resolveMistake.mutate({ id })
      }}
      onWrong={(q) => {
        // The upsert keeps errorCount climbing for chronic stumbles.
        recordMistake.mutate({ questionId: q.qid })
      }}
    />
  )
}
