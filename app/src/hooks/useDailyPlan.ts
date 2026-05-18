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
//   - `markComplete(id)` flip a plan item's completed flag (and persist)
//   - `regenerate()`    force-rebuild (the "Generera om" button)
//   - `allComplete`     convenience: items.length > 0 && every completed
//
// Auto-completion derivations (no manual tap needed):
//   - Repetition items   complete when `dueMistakeCount === 0`
//   - Lesson items       complete when `lessonReads.has(framework)`
//   - Drill items        manual in v1 — a per-section attempts-snapshot
//                        approach is queued for a follow-up
//
// The plan does NOT auto-regenerate when signals change within a day.
// Stability is intentional — if the user starts the day with NOG-1.2
// and works it up to 1.5 by lunch, we don't want the morning plan to
// disappear under them. New local-date or "Generera om" force a fresh
// generation.

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useDueMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import {
  type DailyPlan,
  type FrameworkHint,
  generateDailyPlan,
  loadLessonReads,
  loadPlan,
  localDateString,
  markItemComplete,
  type PlanItem,
  savePlan,
} from '@/lib/scheduler'
import { computeSectionScore, type SectionScore, type SectionStats } from '@/lib/scoring'

type FrameworkHints = Partial<Record<Section, FrameworkHint>>

export type UseDailyPlan = {
  plan: DailyPlan | null
  isLoading: boolean
  markComplete: (itemId: string) => void
  regenerate: () => void
  allComplete: boolean
}

export function useDailyPlan(now: Date = new Date()): UseDailyPlan {
  const stats = useStats()
  const due = useDueMistakes()
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

  // Build / load the plan when all inputs are ready.
  useEffect(() => {
    if (!stats.data || due.data === undefined || hints === null) return

    const cached = loadPlan(today)
    if (cached) {
      setPlan(autoCompleteDerivations(cached, due.data.length, loadLessonReads()))
      return
    }

    const fresh = buildPlan(now, stats.data.bySection, due.data.length, hints)
    savePlan(fresh)
    setPlan(autoCompleteDerivations(fresh, due.data.length, loadLessonReads()))
  }, [stats.data, due.data, hints, today, now])

  // Re-run auto-completion when due count drops to 0 mid-session (the
  // user just finished /repetition and bounced back here). Lesson
  // reads can also change mid-session but require a re-mount of Home
  // to be picked up — that's fine for v1 since reading a lesson
  // typically navigates away first.
  useEffect(() => {
    if (!plan || due.data === undefined) return
    const next = autoCompleteDerivations(plan, due.data.length, loadLessonReads())
    if (next !== plan) {
      savePlan(next)
      setPlan(next)
    }
  }, [plan, due.data])

  const markComplete = useCallback(
    (itemId: string) => {
      const next = markItemComplete(today, itemId)
      if (next) setPlan(next)
    },
    [today],
  )

  const regenerate = useCallback(() => {
    if (!stats.data || due.data === undefined || hints === null) return
    const fresh = buildPlan(now, stats.data.bySection, due.data.length, hints)
    savePlan(fresh)
    setPlan(autoCompleteDerivations(fresh, due.data.length, loadLessonReads()))
  }, [stats.data, due.data, hints, now])

  const allComplete = !!plan && plan.items.length > 0 && plan.items.every((i) => i.completed)

  return {
    plan,
    isLoading: stats.isLoading || due.isLoading || hints === null,
    markComplete,
    regenerate,
    allComplete,
  }
}

// ---------------------------------------------------------------------------
// Helpers — exported (or testable in isolation) where useful.
// ---------------------------------------------------------------------------

function buildPlan(
  now: Date,
  bySection: Record<Section, SectionStats>,
  dueCount: number,
  hints: FrameworkHints,
): DailyPlan {
  const sectionScores: SectionScore[] = SECTION_KEYS.map((s) =>
    computeSectionScore(s, bySection[s], now),
  )
  return generateDailyPlan({
    now,
    sectionScores,
    dueMistakeCount: dueCount,
    firstUnreadEntry: hints,
  })
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

/** Apply the auto-completion rules to a plan, returning a new plan
 *  object when anything changed (so React equality comparisons work)
 *  or the same reference when nothing did. */
function autoCompleteDerivations(
  plan: DailyPlan,
  dueCount: number,
  lessonReads: Set<string>,
): DailyPlan {
  let changed = false
  const items: PlanItem[] = plan.items.map((item) => {
    if (item.completed) return item
    if (item.kind === 'repetition' && dueCount === 0) {
      changed = true
      return { ...item, completed: true }
    }
    if (item.kind === 'lesson' && item.framework && lessonReads.has(item.framework)) {
      changed = true
      return { ...item, completed: true }
    }
    return item
  })
  if (!changed) return plan
  const estimatedMinutes = items
    .filter((i) => !i.completed)
    .reduce((sum, i) => sum + i.estimatedMinutes, 0)
  return { ...plan, items, estimatedMinutes }
}
