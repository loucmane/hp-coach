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

  return (
    <HomeMobile
      plan={plan}
      allComplete={allComplete}
      onRegenerate={regenerate}
      onPlanItemNavigate={(href) => navigate({ to: href })}
      streakDays={streakDays}
      onAvancerat={() => navigate({ to: '/avancerat' })}
      onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
    />
  )
}
