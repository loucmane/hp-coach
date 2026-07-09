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

import { useDueMistakes } from '@/api/hooks/useMistakes'
import { useActiveSessions } from '@/api/hooks/useSessions'
import { useStats } from '@/api/hooks/useStats'
import { type TopTrap, useTopTraps } from '@/api/hooks/useTopTraps'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import {
  type DailyPlan,
  type FrameworkHint,
  generateDailyPlan,
  loadLessonReads,
  loadPlan,
  localDateString,
  type PlanItem,
  savePlan,
} from '@/lib/scheduler'
import { computeSectionScore, type SectionScore, type SectionStats } from '@/lib/scoring'

type FrameworkHints = Partial<Record<Section, FrameworkHint>>
type BySection = Record<Section, SectionStats>

/** Half a default 10-question drill is enough signal that the user
 *  engaged the section. Lower thresholds (1–3 attempts) risk false
 *  positives from clicking through to preview a question. */
const DRILL_COMPLETE_THRESHOLD = 5

export type UseDailyPlan = {
  plan: DailyPlan | null
  isLoading: boolean
  regenerate: () => void
  allComplete: boolean
}

export function useDailyPlan(initialNow: Date = new Date()): UseDailyPlan {
  const stats = useStats()
  const due = useDueMistakes()
  // Top recurring traps drive the trap-aware drill rule. We don't
  // gate plan generation on this — when traps haven't resolved yet
  // (cold start, first render), the scheduler falls back to generic
  // section drills.
  const topTraps = useTopTraps()
  // Any in-progress session (drill/lesson/repetition/diagnostic, any
  // device) — gates day-boundary regeneration below. Server-tracked
  // (useActiveSessions), so this is correct even if the rollover
  // happens while a session started on another device is still open.
  const activeSessions = useActiveSessions()

  // `now` lives in state (seeded once from `initialNow`) instead of
  // being recomputed every render, so its reference — and therefore
  // `today` — only changes when we explicitly decide the day rolled
  // over. See the recompute effect below for the event-driven trigger.
  const [now, setNow] = useState(initialNow)
  const today = useMemo(() => localDateString(now), [now])

  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const [hints, setHints] = useState<FrameworkHints | null>(null)

  // Resolve framework first-unread-entry hints once per session. The
  // framework JSON is small (<10KB each, 8 sections); a parallel fetch
  // is ~80KB total and the loader memoises so re-mounts are free.
  useEffect(() => {
    let alive = true
    resolveFrameworkHints().then((h) => {
      if (alive) setHints(h)
    })
    return () => {
      alive = false
    }
  }, [])

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
  // biome-ignore lint/correctness/useExhaustiveDependencies: `now` excluded by design
  useEffect(() => {
    if (!stats.data || due.data === undefined || hints === null) return

    const cached = loadPlan(today)
    if (cached) {
      setPlan(
        deriveCompletion(
          cached,
          due.data.length,
          loadLessonReads(),
          stats.data.bySection,
          stats.data.attempts.total,
        ),
      )
      return
    }

    const fresh = buildPlan(
      now,
      stats.data.bySection,
      due.data.length,
      hints,
      topTraps,
      stats.data.attempts.total,
    )
    savePlan(fresh)
    setPlan(
      deriveCompletion(
        fresh,
        due.data.length,
        loadLessonReads(),
        stats.data.bySection,
        stats.data.attempts.total,
      ),
    )
  }, [stats.data, due.data, hints, today, topTraps])

  // Re-run derivation when due count or stats change mid-session
  // (user just finished /repetition or a drill and bounced back).
  // Lesson reads also change mid-session but require a re-mount of
  // Home to be picked up — that's fine for v1.
  useEffect(() => {
    if (!plan || due.data === undefined || !stats.data) return
    const next = deriveCompletion(
      plan,
      due.data.length,
      loadLessonReads(),
      stats.data.bySection,
      stats.data.attempts.total,
    )
    if (next !== plan) {
      savePlan(next)
      setPlan(next)
    }
  }, [plan, due.data, stats.data])

  const regenerate = useCallback(() => {
    if (!stats.data || due.data === undefined || hints === null) return
    const fresh = buildPlan(
      now,
      stats.data.bySection,
      due.data.length,
      hints,
      topTraps,
      stats.data.attempts.total,
    )
    savePlan(fresh)
    setPlan(
      deriveCompletion(
        fresh,
        due.data.length,
        loadLessonReads(),
        stats.data.bySection,
        stats.data.attempts.total,
      ),
    )
  }, [stats.data, due.data, hints, now, topTraps])

  const allComplete = !!plan && plan.items.length > 0 && plan.items.every((i) => i.completed)

  return {
    plan,
    isLoading: stats.isLoading || due.isLoading || hints === null,
    regenerate,
    allComplete,
  }
}

// ---------------------------------------------------------------------------
// Helpers — exported (or testable in isolation) where useful.
// ---------------------------------------------------------------------------

function buildPlan(
  now: Date,
  bySection: BySection,
  dueCount: number,
  hints: FrameworkHints,
  topTraps: TopTrap[],
  totalAttempts: number,
): DailyPlan {
  const sectionScores: SectionScore[] = SECTION_KEYS.map((s) =>
    computeSectionScore(s, bySection[s], now),
  )
  const base = generateDailyPlan({
    now,
    sectionScores,
    dueMistakeCount: dueCount,
    firstUnreadEntry: hints,
    topTraps,
  })
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
  return { ...base, attemptsSnapshot, totalAttemptsSnapshot: totalAttempts }
}

/** Resolve the first-unread framework entry for every wired section.
 *  Returns a map suitable for the scheduler's `firstUnreadEntry`
 *  field. Sections whose framework can't be loaded are omitted (the
 *  scheduler treats absent keys as "no hint", same as undefined). */
async function resolveFrameworkHints(): Promise<FrameworkHints> {
  const reads = loadLessonReads()
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
): DailyPlan {
  let changed = false
  const items: PlanItem[] = plan.items.map((item) => {
    const derived = isItemComplete(item, plan, dueCount, lessonReads, bySection, totalAttempts)
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

export function isItemComplete(
  item: PlanItem,
  plan: DailyPlan,
  dueCount: number,
  lessonReads: Set<string>,
  bySection: BySection,
  totalAttempts: number,
): boolean {
  if (item.kind === 'repetition') return dueCount === 0
  if (item.kind === 'lesson') {
    // No framework hint resolved → can't auto-complete (rare edge case
    // where the section has no entries; the item is still actionable).
    return item.framework ? lessonReads.has(item.framework) : false
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
