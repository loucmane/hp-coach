// `/` — Daily Home.
//
// Composes `useDailyPlan()` (which resolves stats, due reps, framework
// hints, lesson-read state and runs the scheduler) into `HomeMobile`.
// Streak comes from `useStats()` directly so the badge can render
// independently of the plan readiness.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useStats } from '@/api/hooks/useStats'
import { useDailyPlan } from '@/hooks/useDailyPlan'
import { TAB_ROUTE } from '@/lib/nav'
import { HomeMobile } from '@/screens/HomeMobile'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  const navigate = useNavigate()
  const stats = useStats()
  const { plan, allComplete, regenerate } = useDailyPlan()

  const streakDays = stats.data?.streakDays

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
      onPlanItemNavigate={navigateHref}
      streakDays={streakDays}
      onAvancerat={() => navigate({ to: '/avancerat' })}
      onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
    />
  )
}
