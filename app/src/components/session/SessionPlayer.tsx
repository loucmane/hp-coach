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
// Cross-device resume: useActiveSessionOfKind is consulted so that
// starting (or auto-resuming via a ?qid=) ADOPTS an existing active
// session of this kind — replaying its stored plan and seeking to its
// saved position — instead of starting fresh. Seamless, no warning.

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { useSubmitAttempt } from '@/api/hooks/useAttempts'
import {
  type SessionKind,
  useActiveSessionOfKind,
  useSessionAttempts,
  useStartSession,
  useUpdateSession,
} from '@/api/hooks/useSessions'
import { DrillQuestion } from '@/components/drill/DrillQuestion'
import { DrillResult } from '@/components/drill/DrillResult'
import { BoksidanDesk } from '@/components/drill-variants/BoksidanDesk'
import { DispatchedVariant } from '@/components/drill-variants/DispatchedVariant'
import { MobileFrame } from '@/components/MobileFrame'
import { DueHeaderStation } from '@/components/motion/DueNumeral'
import { QuestionPan } from '@/components/motion/QuestionPan'
import { Page } from '@/components/Page'
import { Btn, Eyebrow, Mono } from '@/components/primitives'
import { type AnswerLetter, loadBank, type Question } from '@/data/questions'
import { useViewport } from '@/hooks/useViewport'
import { currentDevice } from '@/lib/device'
import { useArketMotion } from '@/lib/motion'
import { TAB_ROUTE, type TabKey } from '@/lib/nav'
import { canAdoptActiveSession } from './canAdoptSession'
import { reconstructSummary } from './reconstructSummary'

/**
 * The current DTK question's place in its figure block. The block picker
 * (lib/drill.ts) keeps a page's questions consecutive, so the block is the
 * contiguous run of neighbours sharing `figure.src`. Returns {n,m} (1-indexed
 * position, block size) for DTK questions in a multi-question block; null for
 * non-DTK, figure-less, or singleton questions. Drives the "Fråga N av M ·
 * samma sida" cue in DrillQuestion.
 */
export function dtkBlockPosition(
  plan: readonly Question[],
  index: number,
): { n: number; m: number } | null {
  const cur = plan[index]
  const page = cur?.section === 'DTK' ? cur.figure?.src : undefined
  if (!page) return null
  let start = index
  while (start > 0 && plan[start - 1]?.figure?.src === page) start--
  let end = index
  while (end < plan.length - 1 && plan[end + 1]?.figure?.src === page) end++
  const m = end - start + 1
  return m > 1 ? { n: index - start + 1, m } : null
}

type Phase = 'idle' | 'answering' | 'graded' | 'done'

// Session ids ended in THIS tab, module-scoped so the memory survives a
// SessionPlayer remount. Task #166 Symptom B: the end:true PATCH is fired
// non-awaited and its active-sessions cache eviction only lands on the
// response, so re-drilling the SAME section before it lands can re-adopt the
// just-finished session. A per-instance ref closed the same-instance "öva
// igen" case, but re-drilling by navigating (Home "Starta", a fresh /drill
// visit) REMOUNTS SessionPlayer with an empty ref — the finished id has to
// outlive the component. A module-level set does that within the tab; it is
// intentionally not persisted (a reload refetches a clean /active, which the
// server already filters). Bounded below so a long-lived tab can't leak.
const endedSessionIdsThisTab = new Set<number>()
function markSessionEnded(id: number) {
  endedSessionIdsThisTab.add(id)
  // Cap the set so a marathon tab doesn't grow it without bound. Ended ids
  // only matter for the brief window before /active drops the row, so
  // forgetting the oldest once we're well past that window is safe.
  if (endedSessionIdsThisTab.size > 64) {
    const oldest = endedSessionIdsThisTab.values().next().value
    if (oldest !== undefined) endedSessionIdsThisTab.delete(oldest)
  }
}

/** Build the props payload that DispatchedVariant expects. Centralised
 *  so the legacy /drill-style-{a,b,c} routes and SessionPlayer share
 *  the same dispatch logic. The `onAdvance` callback maps to the
 *  variant's `onReset` slot — which each variant renders as the
 *  "Nästa fråga →" / "✓ Klar" CTA. */
function variantPropsFor(args: {
  question: Question
  picked: AnswerLetter | null
  graded: boolean
  correct: boolean
  onPick: (letter: AnswerLetter) => void
  onAdvance: () => void
  /** 1-indexed position in the plan; threaded through to the pre-grade
   *  apparatus footer in StyleA. Optional so legacy /drill-style-*
   *  routes that mount the variant without a session keep compiling. */
  position?: number
  total?: number
  /** DTK block position — forwarded through BoksidanDesk → StudyDesk →
   *  DrillQuestion so the desktop figure carries the "samma sida" cue,
   *  matching the phone path. Null off the DTK block path. */
  blockPosition?: { n: number; m: number } | null
}) {
  return {
    question: args.question,
    explanation: null /* loaded inside the variant via the existing hook */,
    picked: args.picked,
    graded: args.graded,
    correct: args.correct,
    onPick: args.onPick,
    onReset: args.onAdvance,
    position: args.position,
    total: args.total,
    blockPosition: args.blockPosition,
  }
}

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
  activeTab: TabKey
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
  /** Replacement renderer for the done/result screen. When omitted,
   *  falls back to `DrillResult`. Used by /diagnostik to swap in the
   *  coached "Vad vi tror nu" report. Receives the same summary +
   *  handlers as `DrillResult`. */
  renderDone?: (args: {
    summary: { questions: Question[]; picks: (AnswerLetter | null)[] }
    onReplay: () => void
    onHome: () => void
  }) => ReactNode
  /** Two-way URL sync of the active qid.
   *
   *  When provided: on every plan resolution, if `qid` matches a plan
   *  entry, the player starts at that index instead of 0. On every
   *  advance to a new question, `setQid(nextQid)` is called so the
   *  caller can replaceState the URL. Without this prop the route
   *  holds qid in React state only — refresh loses position and
   *  share-debug has to reverse-engineer the qid from the DOM.
   *
   *  Pattern is identical across /drill, /repetition, /diagnostik;
   *  each route does `navigate({ search: prev => ({...prev, qid}),
   *  replace: true })` from its own validateSearch shape.
   */
  urlSyncedQid?: {
    qid: string | null
    setQid: (qid: string | null) => void
  }
  /** Resolve a stored plan (ordered qids from the server session) back
   *  into Question objects, for cross-device adopt-on-resume. When an
   *  active session of this kind exists, SessionPlayer replays its plan
   *  via this instead of calling pickQuestions (which would re-roll a
   *  fresh batch). Omit for surfaces that never resume (e.g. /diagnostik);
   *  without it, an active session falls through to a fresh pick. */
  resolvePlan?: (qids: string[]) => Promise<Question[]>
  /** Show a COMPLETED pass's Klart, reconstructed from its persisted
   *  attempts, instead of the live drill. Set from the route's `?done=<id>`
   *  search param so the payoff survives a refresh (the done phase is
   *  otherwise in-memory only) and so the history view can permalink any
   *  past pass. Ignored once a live session is in flight this mount. */
  completedSessionId?: number | null
  /** Called at the moment a live pass finishes, with its session id, so
   *  the route can stamp `?done=<id>` into the URL (refresh-proof Klart).
   *  When omitted, completion just clears the qid as before. */
  onComplete?: (sessionId: number) => void
  /** Adaptive-review hot-trap offer (task #16). A render-prop so the
   *  offer's "Inte nu" can start the original drill in ONE tap: it
   *  receives `startOriginal`, which begins this drill immediately (same
   *  path the idle Start button takes). Rendered ONCE on the idle masthead
   *  (before the first question) as a zero-guilt insert above the idle
   *  body, only when a live pass hasn't begun, no auto-resume is in
   *  flight, and we're not resuming an existing session. Return null to
   *  show nothing. Omitted on every surface except a normal /drill. */
  adaptiveOffer?: (args: { startOriginal: () => void }) => ReactNode
  /** Begin the session immediately on mount instead of stopping on the
   *  idle interstitial — the Öva hub's door path (owner 2026-07-12: "the
   *  row is the door"). Uses the exact path the idle Start button takes
   *  (adopt-active-session, empty fallback included); an empty pick
   *  drops back to the recoverable idle state. Waits for the active-
   *  session query so a paused pass is adopted, never duplicated. */
  autoStart?: boolean
  /** The section-door shared element (A2 "the row is the door"): the
   *  code that morphed out of the Öva-hub lane / Home plan row lands on
   *  this surface — on the loading interstitial while the session spins
   *  up, on the idle headline on the direct path — and finally settles
   *  into the first question's eyebrow (DrillQuestion). `layoutId` from
   *  sectionDoorLayoutId(); `code` is the section literal to print. */
  door?: { layoutId: string; code: string }
}

export function SessionPlayer(props: SessionPlayerProps) {
  const navigate = useNavigate()
  const activeOfKind = useActiveSessionOfKind(props.sessionKind)
  const startSession = useStartSession()
  const updateSession = useUpdateSession()
  const submitAttempt = useSubmitAttempt()
  // Phase A.5 — needs to be read at the top of the component before
  // any early returns (idle / done branches below) so React's
  // hook-rule isn't violated when the phase transitions through
  // different render paths.
  const viewport = useViewport()
  const ark = useArketMotion()
  // Phase A.6V — DispatchedVariant reads drillLayout from the store
  // directly when it renders the picked variant, so SessionPlayer no
  // longer needs to thread it through. See docs/edition-strip.md.

  const [phase, setPhase] = useState<Phase>('idle')
  const [plan, setPlan] = useState<Question[]>([])
  const [picks, setPicks] = useState<(AnswerLetter | null)[]>([])
  const [index, setIndex] = useState(0)
  const [questionStartedAt, setQuestionStartedAt] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [emptyAttempted, setEmptyAttempted] = useState(false)
  // Session ids ended this tab live in the module-level `endedSessionIdsThisTab`
  // set (above) so the memory survives a remount — see its comment. begin()
  // and onNext read/write it directly; no per-instance ref.
  // True once a live pass has begun this mount — gates the completed-pass
  // reconstruction so it only fires on a genuine cold mount with `?done`.
  const beganRef = useRef(false)
  // Set when an adopted server session's stored plan no longer resolves
  // to any live question (corpus drift / stale seed rows like `q1`). Drives
  // the recoverable "session no longer available" copy and forces the next
  // Start to take a fresh pick instead of re-adopting the dead session.
  const [staleResume, setStaleResume] = useState(false)
  // Set to the adopted session id when a resume replays an existing
  // server session, so its prior attempts can hydrate picks[] (below).
  const [adoptedSessionId, setAdoptedSessionId] = useState<number | null>(null)
  // Tracks the full "user clicked Start" → "first question rendered"
  // window. startSession.isPending alone misses the pickQuestions phase,
  // which can include the very first dataset fetch (~6 MB) on a cold
  // load — that's long enough for a double-click to fire begin() twice.
  const [starting, setStarting] = useState(false)

  const begin = useCallback(async () => {
    if (starting) return
    setStarting(true)
    // A live pass has begun this mount → the completed-pass reconstruction
    // must never fire (e.g. after 'öva igen', while `?done` is still in the
    // URL for the tick before it clears).
    beganRef.current = true
    try {
      // Adopt path — an active session of this kind already exists (the
      // user paused it, here or on another device). Replay its stored
      // plan and seek to its saved position, reusing the same row, rather
      // than POSTing a duplicate + re-rolling a fresh batch. This is what
      // makes "Fortsätt här" land on the exact paused question on ANY
      // device. Needs resolvePlan to turn the stored qids back into
      // Question objects; without it (or without a stored plan) we fall
      // through to a fresh start.
      // Skip the adopt path once we've already found this session's plan
      // unresolvable (staleResume) — Start should take a fresh pick rather
      // than re-adopting the dead row.
      // Adopt only a session whose SECTION matches what the user asked for —
      // canAdoptActiveSession guards against resuming a stale drill in another
      // section (the "click XYZ, get a leftover ORD question" bug). resolvePlan
      // is the surface-capability check (diagnostik omits it to skip resume).
      const existing = activeOfKind.data
      const locallyEnded = existing?.id != null && endedSessionIdsThisTab.has(existing.id)
      if (
        canAdoptActiveSession(existing, props.sections, staleResume, locallyEnded) &&
        props.resolvePlan
      ) {
        const questions = await props.resolvePlan(existing.plan)
        if (questions.length === 0) {
          // The stored plan no longer resolves to any live question
          // (corpus drift / stale seed rows like `q1`). End the dangling
          // session so it stops resurfacing as a "Fortsätt här" target,
          // then fall to a recoverable state instead of hanging forever on
          // "Laddar …". Ending drops it from the active-sessions cache
          // (useUpdateSession), so the next render offers a fresh start.
          if (existing.id != null) {
            markSessionEnded(existing.id)
            updateSession.mutate({ id: existing.id, patch: { end: true } })
          }
          // Drop the stale qid from the URL. Without this the route stays
          // in `?qid=` direct-link mode (1 specific question), so the
          // recovery CTA's fresh pick would keep resolving the dead qid to
          // [] and never start a real section drill.
          props.urlSyncedQid?.setQid(null)
          setStaleResume(true)
          setEmptyAttempted(true)
          return
        }
        setSessionId(existing.id)
        setPlan(questions)
        setPicks(new Array(questions.length).fill(null))
        // Prefer the URL qid (deep-link), else the server cursor, else
        // the saved position. Clamp into range so a shifted plan can't
        // strand us past the end.
        const seekQid = props.urlSyncedQid?.qid ?? existing.currentQuestionId ?? null
        const seekIdx = seekQid ? questions.findIndex((q) => q.qid === seekQid) : -1
        const startIdx =
          seekIdx >= 0 ? seekIdx : Math.min(Math.max(existing.position, 0), questions.length - 1)
        setIndex(startIdx)
        setPhase('answering')
        setQuestionStartedAt(Date.now())
        setAdoptedSessionId(existing.id)
        const activeQid = questions[startIdx]?.qid ?? null
        props.urlSyncedQid?.setQid(activeQid)
        updateSession.mutate({
          id: existing.id,
          patch: { position: startIdx, currentQuestionId: activeQid, device: currentDevice() },
        })
        return
      }

      // Fresh start — pick a new plan and create the session, storing the
      // ordered plan + device so a later resume (here or elsewhere) is exact.
      const picked = await props.pickQuestions()
      if (picked.length === 0) {
        setEmptyAttempted(true)
        return
      }
      // Fresh batch resolved — clear any prior stale-resume flag so the
      // recovery copy doesn't linger into the new session.
      setStaleResume(false)
      const session = await startSession.mutateAsync({
        kind: props.sessionKind,
        sections: props.sections,
        plan: picked.map((q) => q.qid),
        device: currentDevice(),
      })
      setSessionId(session.id)
      setPlan(picked)
      setPicks(new Array(picked.length).fill(null))
      // Seek-to-URL-qid: when the route already carries `?qid=X` in the
      // URL and that qid appears in this plan, start at that question
      // instead of position 0. Refresh-stability + share-link land
      // here. If the URL qid isn't in the plan (queue changed since
      // last visit), fall through to index 0 and overwrite the URL.
      const urlQid = props.urlSyncedQid?.qid ?? null
      const seekIdx = urlQid ? picked.findIndex((q) => q.qid === urlQid) : -1
      const startIdx = seekIdx >= 0 ? seekIdx : 0
      setIndex(startIdx)
      setPhase('answering')
      setQuestionStartedAt(Date.now())
      // Always reflect the active qid in the URL — covers both the
      // "URL was empty" cold-start and "URL had a stale qid" re-resolve
      // cases. Side effect deferred to a microtask so React state
      // commits first.
      const activeQid = picked[startIdx]?.qid ?? null
      props.urlSyncedQid?.setQid(activeQid)
      updateSession.mutate({
        id: session.id,
        patch: { position: startIdx, currentQuestionId: activeQid },
      })
    } finally {
      setStarting(false)
    }
  }, [starting, props, startSession, updateSession, activeOfKind.data, staleResume])

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
        markSessionEnded(sessionId)
        updateSession.mutate({ id: sessionId, patch: { end: true } })
        // Stamp `?done=<id>` so a refresh reconstructs this Klart instead
        // of cold-starting a new drill. onComplete owns the URL (it drops
        // qid); without it, fall back to the old clear-qid behaviour.
        if (props.onComplete) props.onComplete(sessionId)
        else props.urlSyncedQid?.setQid(null)
      } else {
        props.urlSyncedQid?.setQid(null)
      }
      setPhase('done')
      return
    }
    const nextIndex = index + 1
    setIndex(nextIndex)
    setPhase('answering')
    setQuestionStartedAt(Date.now())
    const nextQid = plan[nextIndex]?.qid ?? null
    // Reflect advance in the URL when the route opts in. Use
    // replaceState (via the caller's setQid implementation) — don't
    // pollute history with 10 entries per session.
    props.urlSyncedQid?.setQid(nextQid)
    if (sessionId !== null) {
      updateSession.mutate({
        id: sessionId,
        patch: {
          position: nextIndex,
          currentQuestionId: nextQid,
        },
      })
    }
  }, [index, plan, sessionId, updateSession, props.urlSyncedQid, props.onComplete])

  const onReplay = useCallback(() => {
    setPhase('idle')
    setPlan([])
    setPicks([])
    setIndex(0)
    setSessionId(null)
    setEmptyAttempted(false)
    // Drop any stale qid from the URL — replay re-picks fresh
    // questions, so the previous run's qid would seek to a no-longer-
    // present plan entry.
    props.urlSyncedQid?.setQid(null)
    void begin()
  }, [begin, props.urlSyncedQid])

  const onHome = useCallback(() => navigate({ to: '/' }), [navigate])

  // Pause persistence is now the server session itself: begin() creates
  // (or adopts) the row, and onNext PATCHes position/currentQuestionId on
  // every advance — so leaving mid-question already leaves the row at the
  // right spot. The Home resumption panel reads that row (cross-device);
  // no localStorage snapshot needed.

  // Summary hydration on adopt. When a resumed drill replays an existing
  // session, the questions answered BEFORE the pause live as server
  // attempts, not in local picks[] — so the "Klart." payoff would
  // undercount (e.g. 8/10 when the user actually did 10/10). Pull those
  // attempts once and backfill picks[] at their plan positions.
  const adoptedAttempts = useSessionAttempts(adoptedSessionId)
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current) return
    if (adoptedSessionId === null) return
    const rows = adoptedAttempts.data
    if (!rows || plan.length === 0) return
    hydratedRef.current = true
    setPicks((prev) => {
      const next = [...prev]
      for (const a of rows) {
        const i = plan.findIndex((q) => q.qid === a.questionId)
        if (i >= 0 && a.selectedAnswer) next[i] = a.selectedAnswer as AnswerLetter
      }
      return next
    })
  }, [adoptedSessionId, adoptedAttempts.data, plan])

  // Completed-pass reconstruction. When the route mounts carrying
  // `?done=<id>` and no live session has started this mount, rebuild the
  // Klart. summary from that session's persisted attempts and jump
  // straight to the done screen — so a refresh (or a history permalink)
  // shows the payoff instead of cold-starting a new drill. Fires once;
  // guarded on phase==='idle' so it never clobbers a live pass.
  const reconstructId = props.completedSessionId ?? null
  const reconstructAttempts = useSessionAttempts(reconstructId)
  const bankQuery = useQuery({
    queryKey: ['question-bank'] as const,
    queryFn: loadBank,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const reconstructedRef = useRef(false)
  useEffect(() => {
    if (reconstructedRef.current || beganRef.current) return
    if (reconstructId === null || phase !== 'idle') return
    const rows = reconstructAttempts.data
    const bank = bankQuery.data
    if (!rows || !bank) return
    const summary = reconstructSummary(rows, bank)
    if (summary.questions.length === 0) return
    reconstructedRef.current = true
    setSessionId(reconstructId)
    setPlan(summary.questions)
    setPicks(summary.picks)
    setIndex(summary.questions.length - 1)
    setPhase('done')
  }, [reconstructId, phase, reconstructAttempts.data, bankQuery.data])

  // Phase A.8 — keyboard handlers (EDITION's "stolen ideas" from
  // ATLAS + TERMINAL):
  //   - a/b/c/d/e: commit the answer directly while in `answering`
  //   - Enter / Space: advance from `graded` to the next question
  // Escape is intentionally NOT bound to "end session" — that gesture
  // was ejecting users out of the drill when they meant to dismiss a
  // modal or the figure zoom overlay. Leaving the session is what the
  // home button (or the bottom-nav Hem tab) is for.
  useEffect(() => {
    if (phase !== 'answering' && phase !== 'graded') return
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      )
        return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (phase === 'answering') {
        const key = e.key.toUpperCase()
        if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
          e.preventDefault()
          onPick(key as AnswerLetter)
        }
      } else if (phase === 'graded') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onNext()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onPick, onNext])

  // Auto-resume. When the route mounts already carrying a `?qid=` —
  // the user tapped "Fortsätt här" on Home, or refreshed mid-session —
  // start the session immediately. begin()'s seek-to-URL-qid then lands
  // on the exact question they paused on. Without this the player sat on
  // the idle masthead (and its "an unfinished pass from another tab or
  // device is here" stale warning, which is misleading when it's the
  // very session you just paused on THIS device) and forced a second
  // click. Fires once per mount; if begin() finds the qid missing it
  // sets emptyAttempted, which drops us back to the normal idle state.
  const autoResumeQid = props.urlSyncedQid?.qid ?? null
  const didAutoResumeRef = useRef(false)
  useEffect(() => {
    if (didAutoResumeRef.current) return
    if (phase !== 'idle') return
    if (!autoResumeQid) return
    if (emptyAttempted) return
    didAutoResumeRef.current = true
    void begin()
  }, [phase, autoResumeQid, emptyAttempted, begin])

  // Hub-door auto-start (`?start=1`). Same begin() path as the idle
  // Start button; gated on the active-sessions query having resolved so
  // an existing paused pass is ADOPTED (seamless resume — the product's
  // standard conflict handling) rather than raced by a duplicate POST.
  // Fires once per mount; an empty pick sets emptyAttempted, which drops
  // us to the normal recoverable idle state.
  const didAutoStartRef = useRef(false)
  useEffect(() => {
    if (didAutoStartRef.current) return
    if (!props.autoStart) return
    if (phase !== 'idle') return
    if (emptyAttempted) return
    if (autoResumeQid) return // qid deep-link path already auto-resumes
    if (activeOfKind.isPending) return
    didAutoStartRef.current = true
    void begin()
  }, [props.autoStart, phase, emptyAttempted, autoResumeQid, activeOfKind.isPending, begin])

  // The due-numeral header station (A2 flight, station 2) lives on the
  // drill/repetition session worlds only — never diagnostik/mock. Null
  // on phone or at 0 due (the component self-gates).
  const dueStation =
    props.sessionKind === 'drill' || props.sessionKind === 'adaptive_review' ? (
      <DueHeaderStation />
    ) : null

  if (phase === 'idle') {
    // Auto-resume in flight: the URL has a qid and we haven't found it
    // missing yet (or the hub door asked for an immediate start). Render
    // a thin loading line rather than the idle masthead + stale warning,
    // so entering reads as a continuation, not a fresh start that
    // flickers the chapter opening first.
    if ((autoResumeQid || props.autoStart) && !emptyAttempted) {
      const { headLabel, statusMode } = chromeLabelsFor(props.sessionKind, props.sections)
      // The hub-door interstitial: the section code that morphed out of
      // the clicked row lands HERE (same door layoutId) while the
      // session spins up, then settles into the first question's eyebrow
      // in the same commit the question mounts — the code never blinks
      // out of existence between stations.
      const loading = (
        <div
          data-testid="drill-resuming"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {props.door && !ark.rm && (
            <motion.span
              layoutId={props.door.layoutId}
              transition={ark.arket}
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 40,
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                color: 'var(--ink)',
              }}
            >
              {props.door.code}
            </motion.span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: 'var(--font-mono-track)',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Laddar …
          </span>
        </div>
      )
      if (viewport === 'phone') {
        return (
          <MobileFrame
            tabs
            activeTab={props.activeTab}
            onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
          >
            {loading}
          </MobileFrame>
        )
      }
      return (
        <MobileFrame tabs={false}>
          <Page
            runningHead={['HP · Coach', headLabel]}
            status={{ mode: statusMode, context: 'redo', hints: ['esc hem', '⌘k palett'] }}
          >
            {dueStation}
            {loading}
          </Page>
        </MobileFrame>
      )
    }

    // No stale-session warning: an active session of this kind is simply
    // adopted on Start (seamless resume), not flagged as a foreign
    // "unfinished pass". The idle CTA continues it; a fresh pick only
    // happens when there's nothing active.
    const isPhone = viewport === 'phone'
    const resuming = !!activeOfKind.data
    // Adaptive-review offer (task #16): only on a genuine cold idle for a
    // fresh drill — never while resuming an existing session (the user is
    // mid-pattern, not starting one) and never once a live pass began.
    const showOffer = !!props.adaptiveOffer && !resuming && !beganRef.current
    const offerNode =
      showOffer && props.adaptiveOffer ? props.adaptiveOffer({ startOriginal: begin }) : null
    const idleBody = (
      <IdleBody
        {...props}
        isPhone={isPhone}
        starting={starting || startSession.isPending}
        onStart={begin}
        resuming={resuming}
        emptyAttempted={emptyAttempted}
        staleResume={staleResume}
        adaptiveOffer={offerNode}
      />
    )
    if (isPhone) {
      return (
        <MobileFrame
          tabs
          activeTab={props.activeTab}
          onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
        >
          {idleBody}
        </MobileFrame>
      )
    }
    // Desktop idle gets the same Page chrome as the active drill phase
    // — running head + status line — so the chapter-opening composition
    // sits inside the editorial frame instead of floating in an
    // unchromed canvas. The section pulled from props.sections (or a
    // sensible fallback) lets the running head identify what the user
    // is about to drill.
    const { headLabel: sectionLabel, statusMode } = chromeLabelsFor(
      props.sessionKind,
      props.sections,
    )
    return (
      <MobileFrame tabs={false}>
        <Page
          runningHead={['HP · Coach', sectionLabel]}
          status={{
            mode: statusMode,
            context: 'redo',
            hints: ['esc hem', '⌘k palett'],
          }}
        >
          {dueStation}
          {idleBody}
        </Page>
      </MobileFrame>
    )
  }

  if (phase === 'done') {
    const isPhone = viewport === 'phone'
    const doneBody = props.renderDone ? (
      props.renderDone({ summary: { questions: plan, picks }, onReplay, onHome })
    ) : (
      <DrillResult summary={{ questions: plan, picks }} onReplay={onReplay} onHome={onHome} />
    )
    if (isPhone) {
      return (
        <MobileFrame
          tabs
          activeTab={props.activeTab}
          onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
        >
          {doneBody}
        </MobileFrame>
      )
    }
    const { headLabel: sectionLabel } = chromeLabelsFor(props.sessionKind, props.sections)
    return (
      <MobileFrame tabs={false}>
        <Page
          runningHead={['HP · Coach', sectionLabel]}
          status={{
            mode: 'Klar',
            context: 'resultat',
            hints: ['esc hem', '⌘k palett'],
          }}
        >
          {dueStation}
          {doneBody}
        </Page>
      </MobileFrame>
    )
  }

  const q = plan[index]
  const picked = picks[index]
  // DTK block position — the picker keeps a figure page's questions
  // consecutive, so the block is the run of neighbours sharing figure.src.
  const blockPosition = dtkBlockPosition(plan, index)
  // Phone keeps the single-column DrillQuestion (mobile-tested
  // prototype baseline). Reader/studio dispatch to the
  // user-selected drill layout via <DispatchedVariant /> below.
  const useStudyDesk = viewport !== 'phone'
  // Phase A.6V — at desktop, the picked drill layout (StyleA/B/C) is
  // a full-bleed experience that owns its own running head, status
  // line, and CTA. Wrapping it in Page.tsx's chrome would double-
  // chrome the page (two running heads, two status lines, two CTAs
  // stacked) and squash the variant inside a constrained canvas. So
  // when useStudyDesk is true we bypass Page entirely and let the
  // variant fill the artboard.
  //
  // Each variant embeds <EditionStrip /> into its OWN running head,
  // so the picker is reachable mid-drill. Switching editions live
  // (editorial → workbook → cockpit) swaps the entire variant under
  // the user; the click happens in the variant's chrome and the next
  // render is the new variant's chrome with the strip in the same
  // slot. Continuous picker presence; no chrome stacking.
  if (useStudyDesk) {
    return (
      <MobileFrame tabs={false}>
        <BoksidanDesk
          dueStation={dueStation}
          {...variantPropsFor({
            question: q,
            picked,
            graded: phase === 'graded',
            correct: picked === q.answer,
            onPick,
            onAdvance: onNext,
            position: index + 1,
            total: plan.length,
            blockPosition,
          })}
        />
      </MobileFrame>
    )
  }

  // Phase A.8 EDITION (phone path): status-line context and folio
  // carry the section + question count, so DrillProgress (the
  // visible eyebrow) can be tight against the headword instead of
  // orphaned at the top of the canvas. The Page's bottom status line
  // shows the running progress bar.
  const drillBody = (
    <div
      style={{
        height: useStudyDesk ? undefined : '100%',
        flex: useStudyDesk ? 1 : undefined,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: useStudyDesk ? 0 : 16,
        paddingBottom: useStudyDesk ? 0 : 22,
      }}
    >
      {/* M1: the M3 eyebrow inside DrillQuestion (position/total below)
       *  carries section + progress on phone — DrillProgress's separate
       *  top-chrome strip is retired (MD decision: bare chrome). */}
      <div style={{ flex: 1, minHeight: 0, marginTop: useStudyDesk ? 0 : 12 }}>
        {useStudyDesk ? (
          <DispatchedVariant
            {...variantPropsFor({
              question: q,
              picked,
              graded: phase === 'graded',
              correct: picked === q.answer,
              onPick,
              onAdvance: onNext,
              position: index + 1,
              total: plan.length,
            })}
          />
        ) : (
          // A2 ribbon camera on the phone path too — the graded sheet
          // exits upward, the next question arrives from below.
          <QuestionPan id={q.qid}>
            <DrillQuestion
              question={q}
              picked={picked}
              graded={phase === 'graded'}
              onPick={onPick}
              position={index + 1}
              total={plan.length}
              blockPosition={blockPosition}
            />
          </QuestionPan>
        )}
      </div>
      <div
        style={{
          // Desktop: a sticky-bottom flex container that does
          // nothing but right-align the floating CTA control. No
          // background, no height, no padding chrome — the Btn
          // itself carries all the visual weight as a frosted-glass
          // artifact, consistent with the running head + status
          // line treatment. Phone: static, full-width.
          position: useStudyDesk ? 'sticky' : 'static',
          bottom: useStudyDesk ? 'clamp(60px, 6vh, 84px)' : undefined,
          zIndex: useStudyDesk ? 5 : undefined,
          padding: useStudyDesk ? '0 clamp(28px, 4vw, 64px)' : '12px var(--pad-lg) 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: useStudyDesk ? 'flex-end' : 'stretch',
          // Bare wrapper ignores pointer events so wheel + clicks
          // pass through the empty left/center area to the
          // pedagogy underneath. Btn opts back in.
          pointerEvents: useStudyDesk ? 'none' : undefined,
        }}
      >
        <Btn
          full={!useStudyDesk}
          size="md"
          onClick={onNext}
          disabled={phase !== 'graded'}
          data-testid="drill-next"
          className="hpc-btn"
          style={
            useStudyDesk
              ? {
                  pointerEvents: 'auto',
                  minWidth: 168,
                  // Frosted-glass control — same vibrancy treatment as
                  // the running head + status line chrome. Text
                  // scrolling behind blurs through the 12% translucent
                  // dark glass instead of being abruptly clipped by a
                  // solid button edge. The button reads as an
                  // intentional editorial control, not an overlay
                  // patched on top of reading content.
                  background: 'color-mix(in oklch, var(--ink) 92%, transparent)',
                  backdropFilter: 'saturate(150%) blur(16px)',
                  WebkitBackdropFilter: 'saturate(150%) blur(16px)',
                  // Soft floating shadow — depth signal without heaviness.
                  boxShadow: '0 18px 40px -16px rgba(0, 0, 0, 0.28)',
                }
              : undefined
          }
        >
          {index === plan.length - 1 ? 'Avsluta' : 'Nästa'} →
        </Btn>
      </div>
    </div>
  )

  const { statusMode: activeStatusMode } = chromeLabelsFor(props.sessionKind, props.sections)
  return (
    <MobileFrame tabs={false}>
      <Page
        runningHead={['HP · Coach', q.section]}
        folio={{ current: index + 1, total: plan.length }}
        status={{
          mode: activeStatusMode,
          context: `${q.section.toLowerCase()} · fråga ${index + 1}`,
          progress: (index + 1) / plan.length,
          hints: ['⌘k palett'],
        }}
      >
        {drillBody}
      </Page>
    </MobileFrame>
  )
}

// ── Idle body ─────────────────────────────────────────────────────────────
// `adaptiveOffer` is Omit'd from the SessionPlayerProps spread because the
// prop is a render-prop there (function) but IdleBody receives an already-
// rendered node (or null) via the resolved `offerNode`.
type IdleBodyProps = Omit<SessionPlayerProps, 'adaptiveOffer'> & {
  starting: boolean
  onStart: () => void
  /** An active session of this kind exists — the CTA continues it. */
  resuming: boolean
  emptyAttempted: boolean
  /** The adopted session's stored plan no longer resolves — show the
   *  recovery copy and force a fresh-start CTA instead of "Fortsätt". */
  staleResume: boolean
  /** Phase A.8.2 — phone keeps the tight artboard composition; desktop
   *  uses the chapter-opening composition (hero headline, marginalia
   *  keyboard hints, bottom-right CTA). */
  isPhone: boolean
  /** Adaptive-review hot-trap offer (task #16). Rendered at the top of the
   *  idle masthead when set; null suppresses it. */
  adaptiveOffer?: ReactNode
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
  resuming,
  emptyAttempted,
  staleResume,
  disableStart,
  disableStartLabel,
  idleSecondaryCta,
  isPhone,
  adaptiveOffer,
  door,
}: IdleBodyProps) {
  const ark = useArketMotion()
  // When the resumed session's plan is gone, override the section's
  // generic empty copy with an explicit recovery line, and treat the
  // primary CTA as a fresh start (not "Fortsätt").
  const shownEmptyCopy = staleResume
    ? 'Övningen är inte längre tillgänglig — starta en ny.'
    : emptyCopy
  return (
    <div
      data-testid="drill-idle"
      style={{
        // Phase A.8.2 — height: 100% was ignored inside a flex column
        // (the parent's flex-basis: auto wins), so the inner flex:1
        // spacer collapsed and the CTA sat ~280px from the top of a
        // 900px viewport with 600px of empty space below. flex:1 here
        // makes the body actually fill the parent column.
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        // Phone keeps the tight pass-and-tabs padding. Desktop opens
        // into a chapter page: comfortable top margin so the eyebrow +
        // headword sit a third of the way down, with the CTA anchored
        // at the bottom of the page.
        padding: isPhone
          ? 'clamp(28px, 3vw + 16px, 56px) var(--pad-lg) var(--frame-tabbar)'
          : 'clamp(48px, 8vh, 96px) clamp(28px, 4vw, 64px) clamp(32px, 5vh, 56px)',
      }}
    >
      {/* Adaptive-review hot-trap offer (task #16) — a zero-guilt insert
       *  ABOVE the chapter opening. It leads because it's the more
       *  targeted use of the next 5 minutes; declining drops straight
       *  into the drill below. */}
      {adaptiveOffer && (
        <div style={{ marginBottom: isPhone ? 24 : 32, maxWidth: isPhone ? undefined : '52ch' }}>
          {adaptiveOffer}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: isPhone ? 'column' : 'row',
          alignItems: isPhone ? 'stretch' : 'flex-start',
          gap: isPhone ? 0 : 'clamp(32px, 4vw, 64px)',
        }}
      >
        {/* ── Headline column ──────────────────────────────────── */}
        <div style={{ flex: isPhone ? undefined : 1, minWidth: 0 }}>
          <Eyebrow>{idleEyebrow}</Eyebrow>
          <div
            style={{
              marginTop: isPhone ? 18 : 22,
              fontFamily: 'var(--font-display)',
              // M5: the idle hero speaks in M3's italic display voice
              // (M3.tsx L136-146 — same register as the home greeting
              // and the ORD headword). Chapter-title scale kept from
              // A.8.2 but capped at 88px — the 112px upright hero read
              // as a different product from the M3 pages around it.
              fontStyle: 'italic',
              fontSize: isPhone ? 'clamp(32px, 3vw + 22px, 44px)' : 'clamp(48px, 5vw + 16px, 88px)',
              lineHeight: 1.05,
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
              fontWeight: 400,
            }}
          >
            {/* Direct-path door station: the section code that morphed
             *  out of a Home plan row lands as this chapter headline,
             *  and flies on into the first question's eyebrow when the
             *  session starts. */}
            {door && !ark.rm && idleHeadline === door.code ? (
              <motion.span
                layoutId={door.layoutId}
                transition={ark.arket}
                style={{ display: 'inline-block' }}
              >
                {idleHeadline}
              </motion.span>
            ) : (
              idleHeadline
            )}
          </div>
          {/* Hairline under the headword — book-chapter cue, sized
           *  to the word above (~2.5em). */}
          {!isPhone && (
            <div
              aria-hidden
              style={{
                marginTop: 18,
                width: '2.5em',
                maxWidth: 80,
                height: 1,
                background: 'var(--ink)',
                opacity: 0.4,
              }}
            />
          )}
          <div
            style={{
              marginTop: isPhone ? 8 : 26,
              maxWidth: isPhone ? undefined : '38ch',
              fontFamily: 'var(--font-display)',
              fontSize: isPhone
                ? 'clamp(16px, 0.875rem + 0.4vw, 20px)'
                : 'clamp(18px, 0.95rem + 0.4vw, 22px)',
              lineHeight: isPhone ? 1.35 : 1.5,
              color: 'var(--ink-2)',
            }}
          >
            {idleSubcopy}
          </div>
          {idleMeta && (
            <Mono style={{ marginTop: isPhone ? 20 : 28, display: 'block' }}>{idleMeta}</Mono>
          )}
          {idleExtra && <div style={{ marginTop: 20 }}>{idleExtra}</div>}
        </div>

        {/* ── Desktop marginalia: keyboard hints + session card ── */}
        {!isPhone && (
          <aside
            data-testid="drill-idle-marginalia"
            style={{
              width: 'clamp(220px, 22vw, 280px)',
              flexShrink: 0,
              borderLeft: '1px solid var(--hairline)',
              paddingLeft: 24,
              marginTop: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            <div>
              <Mono style={{ display: 'block', marginBottom: 10 }}>Tangentbord</Mono>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontFamily: 'var(--font-ui)',
                  fontSize: 13,
                  color: 'var(--ink-2)',
                  lineHeight: 1.45,
                }}
              >
                <li>
                  <kbd style={kbdStyle}>a–e</kbd> svar
                </li>
                <li>
                  <kbd style={kbdStyle}>enter</kbd> nästa fråga
                </li>
                <li>
                  <kbd style={kbdStyle}>esc</kbd> avbryt
                </li>
                <li>
                  <kbd style={kbdStyle}>⌘k</kbd> paletten
                </li>
              </ul>
            </div>
            <div>
              <Mono style={{ display: 'block', marginBottom: 10 }}>Anteckning</Mono>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: 'var(--ink-2)',
                  fontStyle: 'italic',
                }}
              >
                Inga poängavdrag för fel — gissa hellre än att lämna en fråga obesvarad.
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* M5: the empty note was the last card-chrome box on the idle
       *  screens (bg + border + radius — banned since A.8). It reads
       *  as M3's quiet italic missing-line now. */}
      {(emptyAttempted || disableStart) && shownEmptyCopy && (
        <div
          data-testid="drill-empty"
          className="hpc-m3-missing"
          style={{
            marginTop: 24,
            maxWidth: isPhone ? undefined : '52ch',
          }}
        >
          {shownEmptyCopy}
        </div>
      )}

      {/* Pushes the CTA to the bottom of the page. With flex:1 on the
       *  outer container above, the spacer now actually grows. */}
      <div style={{ flex: 1, minHeight: isPhone ? 0 : 48 }} />

      <div
        style={{
          display: 'flex',
          flexDirection: isPhone ? 'column' : 'row',
          alignItems: isPhone ? 'stretch' : 'center',
          justifyContent: isPhone ? 'stretch' : 'flex-end',
          gap: 12,
        }}
      >
        {idleSecondaryCta && (
          <div
            style={isPhone ? { marginBottom: 10 } : { marginRight: 'auto' }}
            data-testid="drill-secondary-cta"
          >
            {idleSecondaryCta}
          </div>
        )}
        <Btn
          full={isPhone}
          size="xl"
          onClick={onStart}
          disabled={starting || !!disableStart}
          data-testid="drill-start"
          style={isPhone ? undefined : { minWidth: 260 }}
        >
          {starting
            ? 'Startar…'
            : disableStart
              ? (disableStartLabel ?? 'Inget att starta')
              : resuming && !staleResume
                ? 'Fortsätt övning →'
                : 'Starta övning →'}
        </Btn>
      </div>
    </div>
  )
}

const kbdStyle: CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  marginRight: 8,
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: 'var(--font-mono-track)',
  background: 'var(--panel-2)',
  border: '1px solid var(--hairline)',
  borderRadius: 4,
  color: 'var(--ink)',
}

// Derive the running-head and status-line labels from the session
// kind. Pre-fix, `runningHead` was always `[brand, sections.toUpperCase()]`
// — which produced `DIAGNOSTIC` (English) on /diagnostik (sections
// was the placeholder string "diagnostic") and `ORD` on /repetition
// (sections="ORD" was hardcoded). Status mode was the literal
// "Övning" regardless of kind, so the footer said `-- ÖVNING --` on
// /repetition and /diagnostik too. Both are dogfood-pass findings
// B3/B4/B5 in audit/_dogfood_2026-05-24.md.
function chromeLabelsFor(
  kind: SessionKind,
  sections: string | undefined,
): { headLabel: string; statusMode: string } {
  switch (kind) {
    case 'mock_diagnostic':
      return { headLabel: 'DIAGNOSTIK', statusMode: 'Diagnostik' }
    case 'adaptive_review':
      return { headLabel: 'REPETITION', statusMode: 'Repetition' }
    case 'mock':
      return { headLabel: 'MOCK', statusMode: 'Mock' }
    case 'lesson':
      return { headLabel: 'LEKTION', statusMode: 'Lektion' }
    default: {
      // 'drill' (the default case) carries a concrete section
      // ("KVA", "NOG", …) in `sections`; fall back to "ÖVNING" for
      // the rare case `sections` is undefined.
      const label = (sections || 'Övning').toString().toUpperCase()
      return { headLabel: label, statusMode: 'Övning' }
    }
  }
}
