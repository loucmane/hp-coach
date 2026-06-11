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

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'

import { useDueMistakes, useRecordMistake, useResolveMistake } from '@/api/hooks/useMistakes'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { findQuestion, loadBank, type Question } from '@/data/questions'
import { pickReplayQuestions, REPETITION_SESSION_SIZE } from '@/lib/replay'

type RepetitionSearch = { qid?: string }

function validateSearch(input: Record<string, unknown>): RepetitionSearch {
  const qid = input.qid
  if (typeof qid === 'string' && qid.length > 0 && qid.length < 80) {
    return { qid }
  }
  return {}
}

export const Route = createFileRoute('/repetition')({
  validateSearch,
  component: RepetitionScreen,
})

function RepetitionScreen() {
  const due = useDueMistakes()
  const recordMistake = useRecordMistake()
  const resolveMistake = useResolveMistake()
  const navigate = useNavigate()
  const { qid: urlQid } = Route.useSearch()

  // URL-as-state for the active qid. `replace: true` keeps history
  // clean — a 10-question replay shouldn't add 10 back-button stops.
  // Bare `/repetition` (no qid) is the canonical start; we set the
  // qid only after the player resolves a plan.
  const setUrlQid = useCallback(
    (next: string | null) => {
      navigate({
        to: '/repetition',
        search: next ? { qid: next } : {},
        replace: true,
      })
    },
    [navigate],
  )

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

  // Three button states. We gate on "do we actually have data yet?"
  // rather than `isPending` alone — the latter goes false on error
  // (e.g. a transient 401 during Clerk JWT refresh) which would let
  // the user click an enabled-looking button with `due.data===undefined`,
  // landing them in pickReplayQuestions with an empty list.
  //
  //   - data missing (loading or errored) → "Laddar…", disabled.
  //   - 0 rows                            → "Inget att repetera", disabled.
  //   - N>0 rows                          → "Starta övning" enabled.
  const dueCount = due.data?.length
  const noData = !due.data
  const isEmpty = dueCount === 0
  const startDisabled = noData || isEmpty
  const disabledLabel = noData ? 'Laddar…' : 'Inget att repetera'

  return (
    <SessionPlayer
      sessionKind="adaptive_review"
      sections="ORD"
      activeTab="drill"
      urlSyncedQid={{ qid: urlQid ?? null, setQid: setUrlQid }}
      resolvePlan={(qids) =>
        loadBank().then((b) =>
          // Resolve safely — a stale qid in the stored plan must not crash
          // the resume; SessionPlayer treats an empty resolve as a
          // recoverable "session no longer available" state.
          qids.map((q) => findQuestion(b, q)).filter((q): q is Question => q !== undefined),
        )
      }
      pickQuestions={async () => {
        // Cross-device resume is handled by SessionPlayer adopting the
        // active server session + its stored plan (resolvePlan above).
        // Here we only build a fresh replay batch from the due queue.
        const dueRows = due.data ?? []
        const items = await pickReplayQuestions(dueRows, REPETITION_SESSION_SIZE)
        return items.map((r) => r.question)
      }}
      idleEyebrow="Repetition"
      idleHeadline="Dina missar"
      idleSubcopy={
        dueCount && dueCount > 0
          ? dueCount > REPETITION_SESSION_SIZE
            ? `Repetera ${REPETITION_SESSION_SIZE} av ${dueCount} missar denna session — de äldsta först.`
            : `Repetera ${dueCount} ${dueCount === 1 ? 'fråga' : 'frågor'} du svarat fel på.`
          : 'Du har inga missar att repetera just nu.'
      }
      idleMeta={
        dueCount && dueCount > 0
          ? dueCount > REPETITION_SESSION_SIZE
            ? `${REPETITION_SESSION_SIZE} AV ${dueCount} I KÖN`
            : `${dueCount} ATT REPETERA NU`
          : undefined
      }
      emptyCopy="Inga missar att repetera. När du svarar fel i en övning landar frågan här."
      disableStart={startDisabled}
      disableStartLabel={disabledLabel}
      idleSecondaryCta={
        isEmpty ? (
          <Link
            to="/drill"
            data-testid="repetition-fallback-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'var(--panel)',
              border: '1px solid var(--hairline)',
              borderRadius: 'calc(var(--radius) * 0.6)',
              textDecoration: 'none',
              color: 'var(--ink)',
              fontSize: 15,
            }}
          >
            <span>Öva istället</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: 'var(--font-mono-track)',
                color: 'var(--ink-2)',
              }}
            >
              ORD →
            </span>
          </Link>
        ) : null
      }
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
