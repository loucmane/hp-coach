// `/` — Daily Home (mobile, editorial).
//
// Wired to live stores: coach voice from useCoachStore, days-remaining
// counter from useExamStore, the SRS queue count from useDueMistakes,
// and the consecutive-days streak from useStats. CTA + tabs route
// through the TanStack Router. Hardcoded prototype strings live
// exactly nowhere now.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useDueMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { TAB_ROUTE } from '@/lib/nav'
import { HomeMobile } from '@/screens/HomeMobile'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  const navigate = useNavigate()
  const due = useDueMistakes()
  const stats = useStats()
  // While the queries are loading we pass undefined → HomeMobile hides
  // the link / streak badge. Better than flashing "0 …" then swapping
  // in real values once the round-trip lands.
  const dueCount = due.data?.length
  const streakDays = stats.data?.streakDays

  return (
    <HomeMobile
      dueCount={dueCount}
      streakDays={streakDays}
      onContinue={() => navigate({ to: '/drill' })}
      onAvancerat={() => navigate({ to: '/avancerat' })}
      onRepetition={() => navigate({ to: '/repetition' })}
      onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
    />
  )
}
