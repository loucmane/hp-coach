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
//
// Only a question that repeats a due mistake is graded. A question the round
// has already answered is history: a stale ?qid= never reopens it, and an
// answer on any question without a live mapping records nothing.
//
// The links travel with the round. SessionPlayer stores the session's plan
// as plain qids, so once that session exists the route rewrites each new
// question's entry as "X~A" (PUT /api/mistakes/round/:sessionId), and again
// whenever the session shows up without them. They last once that write
// lands, and only then: nothing keeps them on the device. A resume, here or
// on another device, answers against exactly those sources; one that finds
// them lost plays the round's new questions on as plain questions, grades
// none of them, and never ends the round for want of them.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  type Mistake,
  useDueMistakes,
  useLinkRound,
  useReviewMistake,
} from '@/api/hooks/useMistakes'
import { type ExposureMap, useExposure } from '@/api/hooks/useMockResults'
import { useActiveSessionOfKind } from '@/api/hooks/useSessions'
import { canAdoptActiveSession } from '@/components/session/canAdoptSession'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { useViewport } from '@/hooks/useViewport'
import { endedSessionIdsThisTab } from '@/lib/endedSessions'
import {
  pickReplayQuestions,
  planEntry,
  REPETITION_SESSION_SIZE,
  type ReplayItem,
  resolveReplayPlan,
  resumeQid,
  samePlay,
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
  const sections = section ?? 'alla'
  const due = useDueMistakes(section)
  const exposure = useExposure()
  const reviewMistake = useReviewMistake()
  const { mutate: linkRound } = useLinkRound()
  const roundSession = useActiveSessionOfKind('adaptive_review').data
  const navigate = useNavigate()

  // The round the player is running, by qid: which mistake each question
  // repeats, and whether it is a new question with the missed one's trap.
  // Filled by both ways into a plan — a fresh pick, and a resumed stored
  // plan (resolveReplayPlan reads its stored links back) — and read by the
  // answer handlers and the sibling label. It holds live items only: an
  // answered question, or one whose link was lost, is never in it.
  const [round, setRound] = useState<ReadonlyMap<string, ReplayItem>>(() => new Map())
  const playRound = useCallback((items: readonly ReplayItem[]) => {
    setRound(new Map(items.map((item) => [item.question.qid, item])))
  }, [])
  const current = urlQid ? round.get(urlQid) : undefined

  // The ?qid= the player may open. SessionPlayer prefers it over the round's
  // own cursor when it adopts the open round, and a stale one (an old tab,
  // a history entry, a copied link) can name a question the round has
  // already answered. That question is history: answering it again would
  // grade it twice. So for the round SessionPlayer is about to adopt, the
  // qid is held to the questions still ahead of the cursor, and anything
  // else opens the paused question instead (lib/replay.ts resumeQid).
  // SessionPlayer reads it once it adopts the round; its own URL sync then
  // rewrites the address.
  const seekQid =
    urlQid &&
    roundSession &&
    canAdoptActiveSession(
      roundSession,
      sections,
      false,
      endedSessionIdsThisTab.has(roundSession.id),
    )
      ? resumeQid(urlQid, roundSession.plan, roundSession.position, roundSession.currentQuestionId)
      : (urlQid ?? null)

  // The links of the round this visit picked (lib/replay.ts planEntry);
  // null when the round has none to store, or when this visit resumed a
  // stored round. SessionPlayer creates the session from plain qids right
  // after the pick, so the links are written once that session shows up
  // here, and again whenever it shows up without them: after a failed
  // write, or when a slower response of SessionPlayer's own puts the plain
  // plan back in the cache. Nothing else keeps them. They last once the
  // write lands; a visit that ends first takes them along, and a resume
  // then plays those questions as plain ones (resolvePlan below).
  const linkedPlan = useRef<string[] | null>(null)
  const linking = useRef(false)
  useEffect(() => {
    const plan = linkedPlan.current
    const stored = roundSession?.plan
    if (!plan || !roundSession || !stored || roundSession.endedAt != null) return
    // Only this round's session, and only while it lacks the links.
    if (!samePlay(stored, plan) || stored.every((entry, i) => entry === plan[i])) return
    if (linking.current) return
    linking.current = true
    linkRound(
      { sessionId: roundSession.id, plan },
      {
        onSettled: () => {
          linking.current = false
        },
      },
    )
  }, [roundSession, linkRound])

  // Questions answered on this visit → when, in epoch seconds like the
  // exposure map's `last`.
  const answeredHere = useRef(new Map<string, number>())
  const noteAnswered = (qid: string) => {
    answeredHere.current.set(qid, Math.floor(Date.now() / 1000))
  }

  // Unseen-first sibling picks need an exposure map that includes the last
  // round, and the cached one can predate it (a five-minute staleTime, and
  // nothing invalidates it on an answer). So every fresh pick reads it
  // afresh, and a question answered on this visit counts as just seen even
  // before its attempt reaches the map. A failed read never blocks the
  // round: the rest just count as unseen.
  const exposureNow = async (): Promise<ExposureMap> => {
    const res = await exposure.refetch({ cancelRefetch: false })
    const map: ExposureMap = { ...res.data }
    for (const [qid, at] of answeredHere.current) {
      const seen = map[qid]
      map[qid] = { n: Math.max(seen?.n ?? 0, 1), last: Math.max(seen?.last ?? 0, at) }
    }
    return map
  }

  // A resume decides from the due list what is left to play, so it reads
  // that list afresh: the cache can trail an answer given on another
  // device by minutes.
  const dueNow = async (): Promise<Mistake[]> => {
    const res = await due.refetch({ cancelRefetch: false })
    return res.data ?? []
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
  // the Klart. instead of cold-starting a new repetition pass. A finished
  // round has no links left to write.
  const onComplete = useCallback(
    (sessionId: number) => {
      linkedPlan.current = null
      navigate({ to: '/repetition', search: { done: sessionId }, replace: true })
    },
    [navigate],
  )

  // Only a question that repeats a due mistake is graded: its answer moves
  // THAT mistake by row id, right or wrong — the question may be a new one
  // with the missed one's trap. Anything else has no live mapping and
  // records nothing: an answered question (history before the round's
  // cursor), a new question whose link was lost, or one outside the round.
  // A new question never becomes a mistake of its own.
  const grade = (qid: string, correct: boolean) => {
    noteAnswered(qid)
    const item = round.get(qid)
    if (item) reviewMistake.mutate({ id: item.mistakeId, correct })
  }

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
        sections={sections}
        activeTab="ova"
        urlSyncedQid={{ qid: seekQid, setQid: setUrlQid }}
        completedSessionId={doneSessionId ?? null}
        // Hub-door direct start (?start=1). Gated on the due query having
        // resolved so the replay pick has its rows — begin() reads `due.data`
        // synchronously via pickQuestions. An empty due queue resolves to the
        // recoverable "inget att repetera" idle state, not a hang. A stale
        // ?done means we're viewing a finished pass; reconstruction wins.
        autoStart={!!start && !doneSessionId && due.data !== undefined}
        onComplete={onComplete}
        resolvePlan={async (entries, position) => {
          // Ghost-replay guard (residual #290): an adopted session's stored
          // plan can include qids whose mistakes were since resolved (a
          // correct answer elsewhere) or rescheduled out (SRS pushed
          // nextReviewAt into the future). Read it back against the CURRENT
          // due list before replaying — otherwise the user replays a
          // question that's already "done". Each entry repeats the mistake
          // stored with it, never one re-derived from the due list; the
          // answered questions before the saved cursor stay put as history,
          // so the player still lands on the paused question, but are never
          // graded; and from the cursor on a question whose mistake left the
          // due list is skipped while the round goes on (prunePlan). A stale
          // qid that no longer resolves in the bank is dropped rather than
          // crashing the resume. Scoped to this route because only
          // /repetition's sessions (kind=adaptive_review) are
          // mistake-backed; /drill's resolvePlan doesn't prune.
          //
          // A stored plan whose links never landed (the write failed or is
          // still in flight, or the visit that picked the round is gone) is
          // read as it is: its new questions play on as plain questions and
          // grade nothing, and neither that nor the trap index can end the
          // round. A resumed round has no links of this visit's to write.
          linkedPlan.current = null
          const resumed = await resolveReplayPlan(entries, await dueNow(), position)
          // Nothing left from the saved cursor on: the round is over. Treat
          // the session as complete rather than replaying an answered
          // question. Returning [] reuses the existing "stored plan no
          // longer resolves" path in SessionPlayer: it ends the dangling
          // session and falls through to a fresh pick.
          if (resumed.remaining === 0) return []
          playRound(resumed.items)
          return resumed.questions
        }}
        pickQuestions={async () => {
          // Cross-device resume is handled by SessionPlayer adopting the
          // active server session + its stored plan (resolvePlan above).
          // Here we only build a fresh round from the due queue.
          const dueRows = due.data ?? []
          const items = await pickReplayQuestions(dueRows, REPETITION_SESSION_SIZE, {
            exposure: await exposureNow(),
          })
          playRound(items)
          // Only a new question carries a link; without one, the plain
          // plan SessionPlayer stores is already exact.
          linkedPlan.current = items.some((item) => item.sibling) ? items.map(planEntry) : null
          return items.map((item) => item.question)
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
        onCorrect={(q) => grade(q.qid, true)}
        onWrong={(q) => grade(q.qid, false)}
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
