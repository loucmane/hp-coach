// useDailyPlan — Home's source of truth for "what should I study now".
//
// Wires the pure `generateDailyPlan()` from lib/scheduler.ts to the
// resolved async signals (per-section stats from `useStats`, due count
// from `useDueMistakes`, framework first-entry hints, lesson-read
// flags from localStorage). Caches the plan in localStorage keyed by
// local-date so refreshing Home doesn't churn it. Provides:
//
//   - `plan`            the current day's plan (null while resolving)
//   - `isLoading`       true until stats + due + framework hints settle
//   - `regenerate()`    force-rebuild (the "Generera om" button)
//   - `allComplete`     convenience: items.length > 0 && every completed
//
// Completion is fully derived from signals — there is intentionally
// no manual "mark complete" affordance. The plan reflects what you
// actually did, not what you tell it you did.
//
//   - Repetition items   complete when `dueMistakeCount === 0`
//   - Lesson items       complete when `lessonReads.has(framework)`
//   - Drill items        complete when the section's `attemptsToday`
//                        (same-UTC-day monotonic counter) has grown by
//                        ≥5 since the plan was generated (snapshot
//                        stored in `plan.attemptsSnapshot`). Half a
//                        session is enough signal — the user clearly
//                        engaged the section. attemptsToday replaced
//                        attempts7d here because the rolling 7-day
//                        window can drop overnight, flipping a
//                        finished drill back to incomplete intraday.
//
// The plan does NOT auto-regenerate when signals change within a day.
// Stability is intentional — if the user starts the day with NOG-1.2
// and works it up to 1.5 by lunch, we don't want the morning plan to
// disappear under them. New local-date or "Generera om" force a fresh
// generation.
//
// Day-boundary recompute (SF2b): `today` is also re-evaluated on
// `focus` / `visibilitychange` — an overnight-open tab would otherwise
// keep serving yesterday's plan until a hard remount. This is
// deliberately event-driven, NOT a `setInterval` poll and NOT a naive
// `now`-in-deps — see the comment on the build-effect below for why
// the latter caused an infinite render loop. Regeneration is skipped
// while the user has an active session (any kind) so a day rollover
// can't yank the plan out from under an in-progress drill/lesson.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAdaptiveReview } from '@/api/hooks/useAdaptiveReview'
import { useDailyPlanQuery, usePutDailyPlan } from '@/api/hooks/useDailyPlanApi'
import { useLessonReadsQuery } from '@/api/hooks/useLessonReadsApi'
import { useDueMistakes } from '@/api/hooks/useMistakes'
import { type MockResultRow, useMockResults } from '@/api/hooks/useMockResults'
import { useActiveSessions } from '@/api/hooks/useSessions'
import { useStats } from '@/api/hooks/useStats'
import { type TopTrap, useTopTraps } from '@/api/hooks/useTopTraps'
import { useUpdateUserPrefs, useUserPrefs } from '@/api/hooks/useUserPrefs'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import {
  type DailyPlan,
  type FrameworkHint,
  generateDailyPlan,
  loadLessonReads,
  loadPlan,
  localDateString,
  type MockHistoryEntry,
  type MockPrescription,
  PLAN_SCHEMA_VERSION,
  type PlanItem,
  prescribeMock,
  type SchedulerSignals,
  savePlan,
} from '@/lib/scheduler'
import { computeSectionScore, type SectionScore, type SectionStats } from '@/lib/scoring'
import { useDaysRemaining } from '@/stores/examStore'

type FrameworkHints = Partial<Record<Section, FrameworkHint>>
type BySection = Record<Section, SectionStats>

/** Half a default 10-question drill is enough signal that the user
 *  engaged the section. Lower thresholds (1–3 attempts) risk false
 *  positives from clicking through to preview a question. */
const DRILL_COMPLETE_THRESHOLD = 5

export type UseDailyPlan = {
  plan: DailyPlan | null
  isLoading: boolean
  /** True when the stats or due-mistakes queries the plan depends on have
   *  errored (e.g. worker rate-limit, offline) — surfaced so callers can
   *  render a "couldn't load, retrying" affordance instead of leaving the
   *  plan clipped forever with no explanation (ghost-loading bug: a rapid
   *  refresh trips the rate limiter, the queries error, `plan` never
   *  resolves, and the Skrift ceremony waits on a `ready` that never
   *  flips). Does not affect generation — a cached/adopted plan can still
   *  be present alongside `isError: true` if the error is transient. */
  isError: boolean
  regenerate: () => void
  /** "Inte idag" — quietly defer today's Provpass anchor. Writes the synced
   *  `mockDeferredDate` pref (cross-device) and regenerates today's plan with
   *  the mock item suppressed, so the ordinary Dagens plan takes its place.
   *  No-op until the plan's inputs have resolved. */
  deferMock: () => void
  allComplete: boolean
  /** The scheduler's current Provpass (mock exam) prescription — same
   *  `SchedulerSignals` `buildPlan` resolves for `generateDailyPlan`, fed
   *  to `prescribeMock` in the same call so the two can never drift.
   *  Null while the plan is still resolving, or before the first
   *  build/regenerate has run. */
  mockPrescription: MockPrescription | null
}

export function useDailyPlan(initialNow: Date = new Date()): UseDailyPlan {
  const stats = useStats()
  const due = useDueMistakes()
  // Top recurring traps drive the trap-aware drill rule. We don't
  // gate plan generation on this — when traps haven't resolved yet
  // (cold start, first render), the scheduler falls back to generic
  // section drills.
  const topTraps = useTopTraps()
  // Adaptive-review hot trap (task #16) — when present, its trap-drill item
  // is boosted to plan[0]. Resolved via the same detector the drill offer
  // uses, so plan-anchor and offer agree on what's "hot". Not gated on: a
  // null hot trap simply means no boost.
  const adaptive = useAdaptiveReview()
  const hotTrap = adaptive.hotTrap
  // Mock (Provpass) history drives the Provpass steering rule (Rule 0).
  // Same pattern as topTraps: not gated on — when it hasn't resolved
  // yet, `buildPlan` passes an empty history (== "never mocked" from
  // the scheduler's point of view, which is a safe default: it's
  // strictly MORE eager to prescribe a baseline mock than to miss one,
  // and re-derives on the next resolved render anyway).
  const mockResults = useMockResults()
  // Any in-progress session (drill/lesson/repetition/diagnostic, any
  // device) — gates day-boundary regeneration below. Server-tracked
  // (useActiveSessions), so this is correct even if the rollover
  // happens while a session started on another device is still open.
  const activeSessions = useActiveSessions()

  // Server lesson READ SET — the cross-device source of truth for which
  // framework entries the user has read. Fed into BOTH lesson-item
  // completion and the next-unread-entry hint below, merged with the
  // localStorage cache so an offline mark is honoured before it flushes.
  const serverReads = useLessonReadsQuery()

  // Server plan mutation — used to PUT a freshly-generated plan so the
  // other device adopts the identical baseline (first-generator-wins).
  const putServerPlan = usePutDailyPlan()

  // Synced prefs — the "Inte idag" Provpass defer lives here as
  // `mockDeferredDate` (a local YYYY-MM-DD string). Read to gate today's
  // anchor; written (below, in `deferMock`) via the prefs mutation so the
  // defer holds cross-device. Day-scoped: only a value equal to TODAY
  // suppresses the anchor — stale values are inert, no cleanup needed.
  const userPrefs = useUserPrefs()
  const updatePrefs = useUpdateUserPrefs()

  // `now` lives in state (seeded once from `initialNow`) instead of
  // being recomputed every render, so its reference — and therefore
  // `today` — only changes when we explicitly decide the day rolled
  // over. See the recompute effect below for the event-driven trigger.
  const [now, setNow] = useState(initialNow)
  const today = useMemo(() => localDateString(now), [now])
  // Same exam-date source NavRail renders ("Höstprov 26 · N dagar") —
  // reused, not reinvented, so the scheduler's cadence and the nav
  // clock never disagree about how many days remain.
  const daysToExam = useDaysRemaining(now)

  // "Inte idag" defer, day-scoped: the anchor is suppressed only when the
  // stored defer date equals TODAY (local). A value from a prior day is
  // inert — the pass re-anchors on its own cadence the next suitable day.
  const mockDeferredForToday = userPrefs.data?.mockDeferredDate === today

  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const [hints, setHints] = useState<FrameworkHints | null>(null)
  // Provpass (mock exam) prescription — computed from the SAME
  // SchedulerSignals object buildPlan builds for generateDailyPlan (see
  // buildPlan below). Only updated by the build/regenerate effects, not
  // by deriveCompletion — the prescription isn't part of completion
  // derivation.
  const [prescription, setPrescription] = useState<MockPrescription | null>(null)

  // Server plan for today's local date — GET'd BEFORE we generate so a plan
  // authored on another device is adopted verbatim (first-generator-wins),
  // rather than each device re-rolling its own. Keyed by `today`, so a
  // day-boundary rollover re-queries automatically.
  const serverPlan = useDailyPlanQuery(today)

  // Merged read set: server (cross-device truth) ∪ localStorage (offline /
  // fast-path cache). Both the lesson-completion branch and the framework
  // hint resolution consume this so a read made on either device — or
  // offline before it flushes — is honoured. Memoised on the server data
  // reference so it's stable across renders that don't change reads.
  const mergedReads = useMemo(() => {
    const merged = loadLessonReads()
    for (const id of serverReads.data ?? []) merged.add(id)
    return merged
  }, [serverReads.data])

  // Resolve framework first-unread-entry hints. Re-runs when the merged
  // read set changes (a read on the other device should advance the hint),
  // so the "next unread entry" is cross-device, not device-local. The
  // framework JSON is small (<10KB each, 8 sections); the loader memoises
  // so re-resolves are cheap.
  useEffect(() => {
    let alive = true
    resolveFrameworkHints(mergedReads).then((h) => {
      if (alive) setHints(h)
    })
    return () => {
      alive = false
    }
  }, [mergedReads])

  // Day-boundary recompute: re-check the local date on `focus` and
  // `visibilitychange` (becoming visible) — the two events that fire
  // when the user returns to an overnight-open tab. Deliberately NOT a
  // `setInterval` poll (nothing needs to notice a rollover while the
  // tab is backgrounded and unattended) and NOT a raw `new Date()` in
  // a dep array (see the build-effect comment below for the infinite-
  // loop this caused before). Only commits a new `now` when the local
  // date string actually changed, so a same-day focus event is a
  // no-op — no extra renders, no plan churn. Suppressed entirely while
  // any session is active so a rollover can't regenerate the plan out
  // from under an in-progress drill/lesson.
  const activeSessionsRef = useRef(activeSessions.data)
  activeSessionsRef.current = activeSessions.data
  useEffect(() => {
    const recomputeIfDayChanged = () => {
      const hasActiveSession = (activeSessionsRef.current?.length ?? 0) > 0
      if (hasActiveSession) return
      const fresh = new Date()
      setNow((prev) => (localDateString(fresh) !== localDateString(prev) ? fresh : prev))
    }
    window.addEventListener('focus', recomputeIfDayChanged)
    document.addEventListener('visibilitychange', recomputeIfDayChanged)
    return () => {
      window.removeEventListener('focus', recomputeIfDayChanged)
      document.removeEventListener('visibilitychange', recomputeIfDayChanged)
    }
  }, [])

  // Build / load the plan when all inputs are ready.
  //
  // `now` is intentionally EXCLUDED from the dep array — only `today`
  // (its memoized YYYY-MM-DD string) is a dependency. `now` is state
  // now (seeded once from `initialNow`, updated only by the day-
  // boundary effect above), but the original failure mode this guards
  // against still matters: HomeRoute calls `useDailyPlan()` with no
  // argument, and the default `new Date()` evaluates to a fresh
  // reference on every render of the CALLER — if this effect closed
  // over that raw value in its deps, combined with `loadPlan()`
  // returning a JSON.parse'd fresh object, setPlan would see a new
  // reference every render and React would enter an infinite render
  // loop. `today`, not `now`, is the correct "did the day roll over"
  // signal.
  // Adopt-or-generate, first-generator-wins across devices:
  //   1. If the SERVER has a plan for `today`, adopt it verbatim (server
  //      wins over any local copy — identical baseline on every device) and
  //      mirror it into localStorage as the fast-path cache.
  //   2. Else if localStorage has a cached plan (offline / this device
  //      generated it earlier this session), adopt that.
  //   3. Else GENERATE locally, cache it, and PUT it to the server so the
  //      other device adopts the same baseline.
  //
  // We wait for the server plan query to SETTLE (`!isLoading`) before
  // generating, so we never race-generate a second baseline while the
  // server's first-generated plan is still in flight. If the GET failed
  // (offline), `isLoading` still resolves (to error) and we fall through to
  // the localStorage/generate path — offline-tolerant.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `now` excluded by design; serverPlan.data/status drive re-run
  useEffect(() => {
    if (!stats.data || due.data === undefined || hints === null) return
    if (serverPlan.isLoading) return

    const derive = (p: DailyPlan) =>
      deriveCompletion(
        p,
        due.data.length,
        mergedReads,
        stats.data.bySection,
        stats.data.attempts.total,
        toMockHistory(mockResults.data),
      )

    // The mock prescription isn't part of the adopted-plan payload (server
    // rows and the local cache only ever store the plan, not the scheduler's
    // live cadence read) — so it's always computed fresh from the current
    // signals, even when the PLAN itself is adopted verbatim in branches 1/2
    // below. Same signals object `generateDailyPlan` would build in branch 3,
    // just not threaded through it when we don't actually call it.
    const signals = buildSchedulerSignals(
      now,
      stats.data.bySection,
      due.data.length,
      hints,
      topTraps,
      mockResults.data,
      daysToExam,
      hotTrap,
      mockDeferredForToday,
    )
    setPrescription(prescribeMock(signals))

    // A defer-for-today plan must never carry the Provpass anchor. A plan
    // adopted from the server row or the local cache could have been authored
    // BEFORE the defer (e.g. the defer write raced ahead of its plan PUT, or
    // the other device generated the mock plan earlier today) — so when the
    // defer is active, an adopted plan that still holds a mock item is treated
    // as stale and we fall through to regenerate the ordinary plan instead.
    const staleWhenDeferred = (p: DailyPlan) =>
      mockDeferredForToday && p.items.some((i) => i.kind === 'mock')

    // 1. Server plan present → adopt verbatim (server wins), mirror local.
    const remote = serverPlan.data
    if (
      remote?.version === PLAN_SCHEMA_VERSION &&
      remote.date === today &&
      !staleWhenDeferred(remote)
    ) {
      savePlan(remote)
      setPlan(derive(remote))
      return
    }

    // 2. Local cache present → adopt.
    const cached = loadPlan(today)
    if (cached && !staleWhenDeferred(cached)) {
      setPlan(derive(cached))
      // No server row yet (we're here because remote was null/stale) — push
      // this device's cached plan up so the other device can adopt it.
      putServerPlan.mutate(cached)
      return
    }

    // 3. Generate fresh, cache, and publish as the baseline.
    const fresh = buildPlan(
      now,
      stats.data.bySection,
      due.data.length,
      hints,
      topTraps,
      stats.data.attempts.total,
      mockResults.data,
      daysToExam,
      hotTrap,
      mockDeferredForToday,
    )
    savePlan(fresh.plan)
    putServerPlan.mutate(fresh.plan)
    setPlan(derive(fresh.plan))
  }, [
    stats.data,
    due.data,
    hints,
    today,
    topTraps,
    mergedReads,
    serverPlan.data,
    serverPlan.isLoading,
    mockResults.data,
    daysToExam,
    hotTrap,
    mockDeferredForToday,
  ])

  // Re-run derivation when due count, stats, or the (cross-device) read
  // set change mid-session (user just finished /repetition or a drill and
  // bounced back, or read a lesson entry on the other device). This only
  // recomputes completion flags — it never regenerates the plan, so the
  // baseline stays stable within the day.
  useEffect(() => {
    if (!plan || due.data === undefined || !stats.data) return
    const next = deriveCompletion(
      plan,
      due.data.length,
      mergedReads,
      stats.data.bySection,
      stats.data.attempts.total,
      toMockHistory(mockResults.data),
    )
    if (next !== plan) {
      savePlan(next)
      setPlan(next)
    }
  }, [plan, due.data, stats.data, mergedReads, mockResults.data])

  // "Generera om" — force a fresh baseline. Overwrites both the local
  // cache AND the server row (PUT), so the regenerated plan becomes the
  // new cross-device baseline rather than being clobbered by the old
  // server row on the next adopt.
  // Shared build-and-commit path for the two user-triggered regenerations
  // (`regenerate` and `deferMock`). `suppressMock` is an explicit argument
  // rather than a read of `mockDeferredForToday` so `deferMock` can suppress
  // the anchor in the SAME tick it writes the pref — before the prefs query
  // has round-tripped and flipped the reactive flag.
  const buildAndCommit = useCallback(
    (suppressMock: boolean) => {
      if (!stats.data || due.data === undefined || hints === null) return
      const fresh = buildPlan(
        now,
        stats.data.bySection,
        due.data.length,
        hints,
        topTraps,
        stats.data.attempts.total,
        mockResults.data,
        daysToExam,
        hotTrap,
        suppressMock,
      )
      savePlan(fresh.plan)
      putServerPlan.mutate(fresh.plan)
      setPrescription(fresh.prescription)
      setPlan(
        deriveCompletion(
          fresh.plan,
          due.data.length,
          mergedReads,
          stats.data.bySection,
          stats.data.attempts.total,
          toMockHistory(mockResults.data),
        ),
      )
    },
    [
      stats.data,
      due.data,
      hints,
      now,
      topTraps,
      mergedReads,
      putServerPlan,
      mockResults.data,
      daysToExam,
      hotTrap,
    ],
  )

  // "Generera om" — force a fresh baseline, honouring an active defer.
  const regenerate = useCallback(
    () => buildAndCommit(mockDeferredForToday),
    [buildAndCommit, mockDeferredForToday],
  )

  // "Inte idag" — quietly defer today's Provpass anchor. Write-through the
  // synced pref (mockDeferredDate = today) so the defer holds cross-device,
  // then rebuild today's plan with the mock item suppressed — overwriting the
  // local cache AND the server row (buildAndCommit's PUT) so the other device
  // adopts the ordinary plan too. No confirmation, no reschedule: the pass
  // re-anchors on its own cadence the next suitable day.
  const deferMock = useCallback(() => {
    if (!stats.data || due.data === undefined || hints === null) return
    updatePrefs.mutate({ mockDeferredDate: today })
    buildAndCommit(true)
  }, [updatePrefs, today, buildAndCommit, stats.data, due.data, hints])

  const allComplete = !!plan && plan.items.length > 0 && plan.items.every((i) => i.completed)

  return {
    plan,
    isLoading: stats.isLoading || due.isLoading || hints === null,
    isError: stats.isError || due.isError,
    regenerate,
    deferMock,
    allComplete,
    mockPrescription: prescription,
  }
}

// ---------------------------------------------------------------------------
// Helpers — exported (or testable in isolation) where useful.
// ---------------------------------------------------------------------------

/** Build the ONE `SchedulerSignals` object both `generateDailyPlan` and
 *  `prescribeMock` consume. Single construction site — see `buildPlan`
 *  and `useDailyPlan`'s `mockPrescription` — so the plan's mock item and
 *  the standalone prescription (status line, window_slid detection) can
 *  never drift by being derived from two independently-built signals
 *  objects. */
function buildSchedulerSignals(
  now: Date,
  bySection: BySection,
  dueCount: number,
  hints: FrameworkHints,
  topTraps: TopTrap[],
  mockResults: MockResultRow[] | undefined,
  daysToExam: number,
  hotTrap: { framework_id: string } | null,
  // "Inte idag" defer — when true the scheduler skips Rule 0 (the Provpass
  // anchor) so the ordinary day generates. See SchedulerSignals.suppressMock.
  suppressMock = false,
): SchedulerSignals {
  const sectionScores: SectionScore[] = SECTION_KEYS.map((s) =>
    computeSectionScore(s, bySection[s], now),
  )
  return {
    now,
    sectionScores,
    dueMistakeCount: dueCount,
    firstUnreadEntry: hints,
    topTraps,
    mockHistory: toMockHistory(mockResults),
    daysToExam,
    hotTrap,
    suppressMock,
  }
}

function buildPlan(
  now: Date,
  bySection: BySection,
  dueCount: number,
  hints: FrameworkHints,
  topTraps: TopTrap[],
  totalAttempts: number,
  mockResults: MockResultRow[] | undefined,
  daysToExam: number,
  hotTrap: { framework_id: string } | null,
  suppressMock = false,
): { plan: DailyPlan; prescription: MockPrescription } {
  const signals = buildSchedulerSignals(
    now,
    bySection,
    dueCount,
    hints,
    topTraps,
    mockResults,
    daysToExam,
    hotTrap,
    suppressMock,
  )
  const base = generateDailyPlan(signals)
  const prescription = prescribeMock(signals)
  // Attach the per-section attemptsToday snapshot so drill items can
  // auto-complete later when the section's attemptsToday grows. See
  // isItemComplete for why attemptsToday (same-UTC-day monotonic) replaced
  // attempts7d (rolling window, can drop overnight) as the signal.
  const attemptsSnapshot: Partial<Record<Section, number>> = {}
  for (const s of SECTION_KEYS) {
    attemptsSnapshot[s] = bySection[s].attemptsToday
  }
  // And the lifetime total snapshot so section=null items (mastery,
  // cold-start) complete cross-device when the server total grows.
  const plan = { ...base, attemptsSnapshot, totalAttemptsSnapshot: totalAttempts }
  return { plan, prescription }
}

/** Narrow `MockResultRow[]` (the server shape, useMockResults.ts) down to
 *  the `{ half, createdAt }` the scheduler needs — decouples the pure
 *  `lib/scheduler.ts` from the API hook module. Undefined (not yet
 *  resolved) becomes an empty array — "no history" from the scheduler's
 *  point of view, same as a genuinely fresh user (see the buildPlan
 *  call-site comment for why that's a safe default). */
function toMockHistory(rows: MockResultRow[] | undefined): MockHistoryEntry[] {
  if (!rows) return []
  return rows.map((r) => ({ half: r.half, createdAt: r.createdAt }))
}

/** Resolve the first-unread framework entry for every wired section.
 *  Returns a map suitable for the scheduler's `firstUnreadEntry`
 *  field. Sections whose framework can't be loaded are omitted (the
 *  scheduler treats absent keys as "no hint", same as undefined).
 *
 *  `reads` is the MERGED (server ∪ localStorage) read set so the
 *  "next unread entry" is cross-device — an entry read on the phone
 *  advances the hint on the desktop. */
export async function resolveFrameworkHints(
  reads: Set<string> = loadLessonReads(),
): Promise<FrameworkHints> {
  const out: FrameworkHints = {}
  await Promise.all(
    SECTION_KEYS.map(async (section) => {
      const fw = await loadFramework(section)
      if (!fw || fw.entries.length === 0) return
      const firstUnread = fw.entries.find((e) => !reads.has(e.id))
      if (!firstUnread) {
        out[section] = null // all read
        return
      }
      const headword = entryHeadword(firstUnread, fw)
      if (!headword) return // shouldn't happen, but bail rather than emit a half-hint
      out[section] = { id: firstUnread.id, headword }
    }),
  )
  return out
}

/** Derive completion for every plan item from current signals.
 *  Always recomputes — the persisted flag is treated as a cache, not
 *  the source of truth. This means a stale `completed: true` (e.g.
 *  from a now-removed manual button) flips back to false the next
 *  time signals say it isn't done. Returns a new plan when any item
 *  flipped (React equality), or the same reference when nothing did. */
export function deriveCompletion(
  plan: DailyPlan,
  dueCount: number,
  lessonReads: Set<string>,
  bySection: BySection,
  totalAttempts: number,
  // See isItemComplete's matching param — optional, defaults to "no
  // history" so pre-existing call sites/tests are unaffected.
  mockHistory: MockHistoryEntry[] = [],
): DailyPlan {
  let changed = false
  const items: PlanItem[] = plan.items.map((item) => {
    const derived = isItemComplete(
      item,
      plan,
      dueCount,
      lessonReads,
      bySection,
      totalAttempts,
      mockHistory,
    )
    if (derived === item.completed) return item
    changed = true
    return { ...item, completed: derived }
  })
  if (!changed) return plan
  const estimatedMinutes = items
    .filter((i) => !i.completed)
    .reduce((sum, i) => sum + i.estimatedMinutes, 0)
  return { ...plan, items, estimatedMinutes }
}

/** Extract the `half` query param from a mock item's href
 *  (`/prov?half=verbal&prescribed=1`). Parsing the href rather than
 *  storing `section` (mock items have `section: null` — they're not
 *  section-scoped) keeps PlanItem's shape unchanged for this kind. */
function mockHalfFromHref(href: string): 'verbal' | 'kvant' | null {
  const match = href.match(/[?&]half=(verbal|kvant)\b/)
  return (match?.[1] as 'verbal' | 'kvant' | undefined) ?? null
}

export function isItemComplete(
  item: PlanItem,
  plan: DailyPlan,
  dueCount: number,
  lessonReads: Set<string>,
  bySection: BySection,
  totalAttempts: number,
  // Optional so existing call sites (and the direct isItemComplete unit
  // tests that predate Provpass steering) keep working unchanged. A mock
  // item simply can't auto-complete without history — same "no signal,
  // stays actionable" posture as the lesson branch's missing-framework case.
  mockHistory: MockHistoryEntry[] = [],
): boolean {
  if (item.kind === 'repetition') return dueCount === 0
  if (item.kind === 'lesson') {
    // No framework hint resolved → can't auto-complete (rare edge case
    // where the section has no entries; the item is still actionable).
    return item.framework ? lessonReads.has(item.framework) : false
  }
  if (item.kind === 'mock') {
    // Complete once a mock result exists for this half, created AFTER the
    // plan was generated (plan.date is the local-date the plan is FOR, so
    // any result timestamped that day or later counts — a mock finished
    // earlier the same calendar day the plan was generated for still
    // completes it; there is no separate "generatedAt" instant stored).
    const half = mockHalfFromHref(item.href)
    if (!half) return false
    const planDateMs = new Date(`${plan.date}T00:00:00`).getTime()
    return mockHistory.some((m) => {
      if (m.half !== half) return false
      const ts = m.createdAt == null ? null : new Date(m.createdAt).getTime()
      return ts != null && ts >= planDateMs
    })
  }
  if (item.kind === 'drill' && item.section && plan.attemptsSnapshot) {
    const baseline = plan.attemptsSnapshot[item.section] ?? 0
    // attemptsToday (same-UTC-day monotonic) replaces attempts7d here:
    // attempts7d is a rolling 7-day window that can DROP overnight as old
    // attempts age out, which flips a finished drill back to incomplete
    // intraday. attemptsToday only grows within the day, so it can't slide
    // backward under an active-streak user. See worker/src/lib/stats.ts
    // (startOfUtcDay) for the UTC-day-boundary tradeoff this inherits.
    const current = bySection[item.section].attemptsToday
    return current - baseline >= DRILL_COMPLETE_THRESHOLD
  }
  // Section=null drills (mastery-mixed, cold-start) have no per-section
  // signal. Complete from the server lifetime counter `attempts.total`
  // (monotonic, identical on every device) snapshotted at generation — so
  // an all-mastered plan can reach `allComplete`, cross-device. Loose by
  // design (any practice counts), which is fine: these items are always the
  // sole/fallback item, so there's nothing to mis-attribute against.
  if (item.kind === 'drill' && plan.totalAttemptsSnapshot != null) {
    return totalAttempts - plan.totalAttemptsSnapshot >= DRILL_COMPLETE_THRESHOLD
  }
  return false
}
