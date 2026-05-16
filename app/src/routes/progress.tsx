// /progress — Framsteg tab.
//
// Wired to /api/me/stats. The screen renders muted placeholders while
// the query is in-flight so the layout doesn't snap on hydration.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useStats } from '@/api/hooks/useStats'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { TAB_ROUTE } from '@/lib/nav'
import { ProgressMobile } from '@/screens/ProgressMobile'

export const Route = createFileRoute('/progress')({
  component: ProgressRoute,
})

function ProgressRoute() {
  const navigate = useNavigate()
  const stats = useStats()
  return (
    <MobileFrame tabs activeTab="progress" onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}>
      <Page
        runningHead={['HP · COACH', 'Framsteg']}
        status={{
          mode: 'FRAMSTEG',
          context: 'översikt',
          hints: ['esc tillbaka', '⌘k palett'],
        }}
      >
        <ProgressMobile stats={stats.data} loading={stats.isPending} />
      </Page>
    </MobileFrame>
  )
}
