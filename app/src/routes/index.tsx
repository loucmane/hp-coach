// `/` — Daily Home (mobile, editorial).
//
// Wired to live stores: coach voice from useCoachStore, days-remaining
// counter from useExamStore. CTA + tabs route through the TanStack
// Router. Hardcoded prototype strings live exactly nowhere now.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { TAB_ROUTE } from '@/lib/nav'
import { HomeMobile } from '@/screens/HomeMobile'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  const navigate = useNavigate()
  return (
    <HomeMobile
      onContinue={() => navigate({ to: '/drill' })}
      onAvancerat={() => navigate({ to: '/avancerat' })}
      onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
    />
  )
}
