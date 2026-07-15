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
import { useCallback } from 'react'

import {
  useDueMistakes,
  useRecordMistake,
  useResolveMistakeByQuestion,
} from '@/api/hooks/useMistakes'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { findQuestion, loadBank, type Question, SECTION_KEYS, type Section } from '@/data/questions'
import { pickReplayQuestions, prunePlan, REPETITION_SESSION_SIZE } from '@/lib/replay'

type RepetitionSearch = { qid?: string; done?: number; start?: true; section?: Section }

function validateSearch(input: Record<string, unknown>): RepetitionSearch {
  const out: RepetitionSearch = {}
  const qid = input.qid
  if (typeof qid === 'string' && qid.length > 0 && qid.length < 80) {
    out.qid = qid
  }
  // `?done=<sessionId>` — show the completed pass's Klart (refresh-proof /
  // history permalink). Coerce string|number → positive int.
  const done = Number(input.done)
  if (Number.isInteger(done) && done > 0) {
    out.done = done
  }
  // `?start=1` — the Öva hub's repetera-lane door path (owner 2026-07-13):
  // the row is the door, so the session starts immediately instead of
  // stopping on the idle interstitial. Direct /repetition keeps the idle
  // screen.
  if (input.start === '1' || input.start === true) {
    out.start = true
  }
  // `?section=ORD` — section-scoped repetition (owner 2026-07-14): replay
  // only this section's due misses. Same door grammar as the drill lanes.
  if (
    typeof input.section === 'string' &&
    (SECTION_KEYS as readonly string[]).includes(input.section)
  ) {
    out.section = input.section as Section
  }
  return out
}

export const Route = createFileRoute('/repetition')({
  validateSearch,
  component: RepetitionScreen,
})

function RepetitionScreen() {
  const { qid: urlQid, done: doneSessionId, start, section } = Route.useSearch()
  const due = useDueMistakes(section)
  const recordMistake = useRecordMistake()
  const resolveMistake = useResolveMistakeByQuestion()
  const navigate = useNavigate()

  // URL-as-state for the active qid. `replace: true` keeps history
  // clean — a 10-question replay shouldn't add 10 back-button stops.
  // Bare `/repetition` (no qid) is the canonical start; we set the
  // qid only after the player resolves a plan. Setting qid resets the
  // whole search, which also drops any `?done` from a prior pass.
  const setUrlQid = useCallback(
    (next: string | null) => {
      navigate({
        to: '/repetition',
        search: next
          ? section
            ? { qid: next, section }
            : { qid: next }
          : section
            ? { section }
            : {},
        replace: true,
      })
    },
    [navigate, section],
  )

  // On completion, stamp `?done=<sessionId>` so a refresh reconstructs
  // the Klart. instead of cold-starting a new repetition pass.
  const onComplete = useCallback(
    (sessionId: number) => {
      navigate({ to: '/repetition', search: { done: sessionId }, replace: true })
    },
    [navigate],
  )

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
      // The adoption guard compares this against the active session's
      // stored `sections` — a scoped entry (?section=ORD) must not adopt
      // an unscoped session's plan (or vice versa), same rule as the
      // drill's cross-section guard. 'alla' = the unscoped whole-queue
      // pass. (Was a hardcoded "ORD" placeholder, which made every
      // repetition session adopt every other.)
      sections={section ?? 'alla'}
      activeTab="ova"
      urlSyncedQid={{ qid: urlQid ?? null, setQid: setUrlQid }}
      completedSessionId={doneSessionId ?? null}
      // Hub-door direct start (?start=1). Gated on the due query having
      // resolved so the replay pick has its rows — begin() reads `due.data`
      // synchronously via pickQuestions. An empty due queue resolves to the
      // recoverable "inget att repetera" idle state, not a hang. A stale
      // ?done means we're viewing a finished pass; reconstruction wins.
      autoStart={!!start && !doneSessionId && due.data !== undefined}
      onComplete={onComplete}
      resolvePlan={(qids, position) => {
        // Ghost-replay guard (residual #290): an adopted session's stored
        // plan can include qids whose mistakes were since resolved (a
        // correct answer elsewhere) or rescheduled out (SRS pushed
        // nextReviewAt into the future). Prune those against the CURRENT
        // due list before replaying — otherwise the user replays a
        // question that's already "done". Scoped to this route because
        // only /repetition's sessions (kind=adaptive_review) are
        // mistake-backed; /drill's resolvePlan doesn't prune.
        const pruned = prunePlan(qids, due.data ?? [])
        // If the saved cursor now falls at-or-past the pruned plan's end,
        // there's nothing left to play at that position — treat the
        // session as complete rather than silently replaying from 0 (a
        // surprising jump) or the last question. Returning [] reuses the
        // existing "stored plan no longer resolves" path below: it ends
        // the dangling session and falls through to a fresh pick.
        if (position !== undefined && position >= pruned.length) {
          return Promise.resolve([])
        }
        return loadBank().then((b) =>
          // Resolve safely — a stale qid in the stored plan must not crash
          // the resume; SessionPlayer treats an empty resolve as a
          // recoverable "session no longer available" state.
          pruned.map((q) => findQuestion(b, q)).filter((q): q is Question => q !== undefined),
        )
      }}
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
      emptyCopy={
        section
          ? `Inga ${section}-missar att repetera just nu. Hela kön finns under Repetera i Öva.`
          : 'Inga missar att repetera. När du svarar fel i en övning landar frågan här.'
      }
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
        // Server-side lookup by question — immune to the adopted-session
        // plan drifting from the current due list (the old client-side
        // map silently no-oped on a miss and the pile never went down).
        resolveMistake.mutate({ questionId: q.qid })
      }}
      onWrong={(q) => {
        // The upsert keeps errorCount climbing for chronic stumbles.
        recordMistake.mutate({ questionId: q.qid })
      }}
    />
  )
}
