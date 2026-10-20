// /repetition — replay your most-frequent stumbles.
//
// Thin route: pulls the due-mistakes queue, resolves it to a round of
// questions, and hands them to <SessionPlayer> as a kind='adaptive_review'
// session.
//
// Samma fälla, ny fråga (hpf-bz6f.2): a LÄS/MEK/ELF/quant miss is repeated
// through a NEW question with the same trap (lib/replay.ts), so the round
// tests the skill instead of memory of a key the student has already seen;
// ORD keeps same-item repetition. Every planned item stays linked to the
// mistake it repeats, and every answer — on the missed question itself or
// on a new one — moves THAT row via PATCH /api/mistakes/:id/review: right
// climbs the SRS ladder, wrong lapses it. A wrong answer on a new question
// never becomes a mistake of its own.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import {
  useDueMistakes,
  useRecordMistake,
  useResolveMistakeByQuestion,
  useReviewMistake,
} from '@/api/hooks/useMistakes'
import { type ExposureMap, useExposure } from '@/api/hooks/useMockResults'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { useViewport } from '@/hooks/useViewport'
import {
  pickReplayQuestions,
  REPETITION_SESSION_SIZE,
  type ReplayItem,
  resolveReplayPlan,
} from '@/lib/replay'

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
  const exposure = useExposure()
  const recordMistake = useRecordMistake()
  const resolveMistake = useResolveMistakeByQuestion()
  const reviewMistake = useReviewMistake()
  const navigate = useNavigate()

  // The round the player is running, by qid: which mistake each question
  // repeats, and whether it is a new question with the missed one's trap.
  // Filled by both ways into a plan — a fresh pick, and a resumed stored
  // plan (the server session keeps only qids; resolveReplayPlan re-links
  // them) — and read by the answer handlers and the sibling label.
  const [round, setRound] = useState<ReadonlyMap<string, ReplayItem>>(() => new Map())
  const playRound = useCallback((items: readonly ReplayItem[]) => {
    setRound(new Map(items.map((item) => [item.question.qid, item])))
    return items.map((item) => item.question)
  }, [])
  const current = urlQid ? round.get(urlQid) : undefined

  // Unseen-first sibling picks need the exposure map. A quick Start can
  // beat its query, so wait for it then; a failed read must never block
  // the round — every question just counts as unseen.
  const exposureMap = async (): Promise<ExposureMap> => {
    if (exposure.data) return exposure.data
    if (exposure.isError) return {}
    const res = await exposure.refetch({ cancelRefetch: false })
    return res.data ?? {}
  }

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
    <>
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
        resolvePlan={async (qids, position) => {
          // Ghost-replay guard (residual #290): an adopted session's stored
          // plan can include qids whose mistakes were since resolved (a
          // correct answer elsewhere) or rescheduled out (SRS pushed
          // nextReviewAt into the future). Prune those against the CURRENT
          // due list before replaying — otherwise the user replays a
          // question that's already "done". A stored NEW question is kept
          // and re-linked to the due mistake it repeats (prunePlan), and a
          // stale qid that no longer resolves in the bank is dropped rather
          // than crashing the resume. Scoped to this route because only
          // /repetition's sessions (kind=adaptive_review) are mistake-
          // backed; /drill's resolvePlan doesn't prune.
          const items = await resolveReplayPlan(qids, due.data ?? [])
          // If the saved cursor now falls at-or-past the pruned plan's end,
          // there's nothing left to play at that position — treat the
          // session as complete rather than silently replaying from 0 (a
          // surprising jump) or the last question. Returning [] reuses the
          // existing "stored plan no longer resolves" path in SessionPlayer:
          // it ends the dangling session and falls through to a fresh pick.
          if (position !== undefined && position >= items.length) return []
          return playRound(items)
        }}
        pickQuestions={async () => {
          // Cross-device resume is handled by SessionPlayer adopting the
          // active server session + its stored plan (resolvePlan above).
          // Here we only build a fresh round from the due queue.
          const dueRows = due.data ?? []
          const items = await pickReplayQuestions(dueRows, REPETITION_SESSION_SIZE, {
            exposure: await exposureMap(),
          })
          return playRound(items)
        }}
        idleEyebrow="Repetition"
        idleHeadline="Dina missar"
        idleSubcopy={
          dueCount && dueCount > 0
            ? dueCount > REPETITION_SESSION_SIZE
              ? `Repetera ${REPETITION_SESSION_SIZE} av ${dueCount} missar denna session — de äldsta först.`
              : `Repetera ${dueCount} ${dueCount === 1 ? 'fråga' : 'frågor'} du svarat fel på.`
            : // P2.2 empty-state law: ONE line, an invitation — the old
              // pairing ("Du har inga missar…" + the emptyCopy line below
              // it) said the same thing twice on a day-zero screen.
              'Inga missar än — när du svarar fel i en övning landar frågan här.'
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
            : isEmpty
              ? // The unscoped empty idle already says it in idleSubcopy —
                // suppress the duplicate missing-line (P2.2).
                undefined
              : 'Inga missar att repetera. När du svarar fel i en övning landar frågan här.'
        }
        disableStart={startDisabled}
        disableStartLabel={disabledLabel}
        // Empty queue: the dead black "Inget att repetera" button goes; the
        // one live action is the "Öva istället" door below. Loading keeps
        // the disabled "Laddar…" button (honest pre-state, not an empty
        // state).
        hideDisabledStart={isEmpty}
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
          // A planned item reviews the mistake it repeats, by row id — the
          // question answered may be a new one with the missed one's trap.
          const item = round.get(q.qid)
          if (item) reviewMistake.mutate({ id: item.mistakeId, correct: true })
          // Outside the round (not expected): the server finds the
          // question's own active row, as before.
          else resolveMistake.mutate({ questionId: q.qid })
        }}
        onWrong={(q) => {
          // A wrong answer lapses the SOURCE mistake; a new question never
          // becomes a mistake of its own.
          const item = round.get(q.qid)
          if (item) reviewMistake.mutate({ id: item.mistakeId, correct: false })
          else recordMistake.mutate({ questionId: q.qid })
        }}
      />
      {current?.sibling && <SiblingLabel />}
    </>
  )
}

/** The quiet cue on a new question with the missed one's trap. SessionPlayer
 *  owns the question chrome, so the label rides beside it as a fixed caption
 *  in the drill's eyebrow voice: centred at the top of the page — on the due
 *  station's line at desktop, above the question eyebrow on phone. */
function SiblingLabel() {
  const isPhone = useViewport() === 'phone'
  return (
    <div
      data-testid="repetition-sibling-label"
      className="hpc-m3-eyebrow"
      style={{
        position: 'fixed',
        top: isPhone ? 'calc(env(safe-area-inset-top, 0px) + 6px)' : 20,
        left: '50%',
        transform: 'translateX(-50%)',
        // Above the due station's opaque sticky band (zIndex 6).
        zIndex: 7,
        padding: '2px 10px',
        background: 'var(--bg)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      Samma fälla, ny fråga
    </div>
  )
}
