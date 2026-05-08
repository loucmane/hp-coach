// `/` — Daily Home (mobile, editorial).
//
// Wired to live stores: coach voice from useCoachStore, days-remaining
// counter from useExamStore, and the SRS queue count from
// useDueMistakes(). CTA + tabs route through the TanStack Router.
// Hardcoded prototype strings live exactly nowhere now.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useDueMistakes } from '@/api/hooks/useMistakes'
import { TAB_ROUTE } from '@/lib/nav'
import { HomeMobile } from '@/screens/HomeMobile'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  const navigate = useNavigate()
  const due = useDueMistakes()
  // While the query is loading we pass undefined → HomeMobile hides the
  // link. Better than flashing "0 missar att repetera" then swapping.
  const dueCount = due.data?.length

  return (
    <HomeMobile
      dueCount={dueCount}
      onContinue={() => navigate({ to: '/drill' })}
      onAvancerat={() => navigate({ to: '/avancerat' })}
      onRepetition={() => navigate({ to: '/repetition' })}
      onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
    />
  )
}
