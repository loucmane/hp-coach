// `/` — Daily Home.
//
// Composes `useDailyPlan()` (which resolves stats, due reps, framework
// hints, lesson-read state and runs the scheduler) into `HomeMobile`.
// Streak comes from `useStats()` directly so the badge can render
// independently of the plan readiness.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

import { useStats } from '@/api/hooks/useStats'
import { SECTION_KEYS } from '@/data/questions'
import { useDailyPlan } from '@/hooks/useDailyPlan'
import { TAB_ROUTE } from '@/lib/nav'
import { computeProjected, computeSectionScore } from '@/lib/scoring'
import { HomeMobile } from '@/screens/HomeMobile'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  const navigate = useNavigate()
  const stats = useStats()
  const { plan, allComplete, regenerate } = useDailyPlan()

  const streakDays = stats.data?.streakDays

  // Projected total + verbal/quant halves for the Home score line.
  // Pure derivation from stats.data; route owns the computation so
  // HomeMobile stays a presentational component (and its tests don't
  // need a QueryClient wrapper). Returns null while stats are loading
  // so the score line stays hidden during the skeleton state.
  const projected = useMemo(() => {
    if (!stats.data) return null
    const now = new Date()
    const sectionScores = SECTION_KEYS.map((s) =>
      computeSectionScore(s, stats.data.bySection[s], now),
    )
    return computeProjected(sectionScores)
  }, [stats.data])

  // The scheduler emits hrefs as raw URL strings (e.g.
  // `/lektion?section=KVA`). TanStack's `navigate({ to })` treats `to`
  // as the route key, not a URL — it doesn't parse `?query` out of the
  // string. So split the href manually before dispatching.
  const navigateHref = (href: string) => {
    const [path, query] = href.split('?')
    if (!query) {
      navigate({ to: path as never })
      return
    }
    const search: Record<string, string> = {}
    for (const [k, v] of new URLSearchParams(query)) search[k] = v
    navigate({ to: path as never, search: search as never })
  }

  return (
    <HomeMobile
      plan={plan}
      allComplete={allComplete}
      onRegenerate={regenerate}
      projected={projected}
      onPlanItemNavigate={navigateHref}
      streakDays={streakDays}
      onAvancerat={() => navigate({ to: '/avancerat' })}
      onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
    />
  )
}
