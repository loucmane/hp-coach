// /progress — Framsteg tab.
//
// Wired to /api/me/stats. The screen renders muted placeholders while
// the query is in-flight so the layout doesn't snap on hydration.

import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useFrameworkProgress } from '@/api/hooks/useFrameworkProgress'
import { useStats } from '@/api/hooks/useStats'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { loadFramework } from '@/data/frameworks'
import { SECTION_KEYS } from '@/data/questions'
import { summarizeFrameworkProgress } from '@/lib/frameworkProgress'
import { useFirstContentSignal } from '@/lib/motion'
import { TAB_ROUTE } from '@/lib/nav'
import { ProgressMobile } from '@/screens/ProgressMobile'

export const Route = createFileRoute('/progress')({
  component: ProgressRoute,
})

function ProgressRoute() {
  // Boot-veil content signal (#305 owner verdict) — /progress has no
  // Skrift block; its placeholder-while-loading UI is the route's own
  // primary content, present at mount.
  useFirstContentSignal()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const stats = useStats()
  const progress = useFrameworkProgress()
  const catalogs = useQuery({
    queryKey: ['framework-catalogs'],
    queryFn: () =>
      Promise.all(
        SECTION_KEYS.map(async (section) => {
          const catalog = await loadFramework(section)
          // An absent catalog is not a smaller curriculum. Wait for all eight
          // before displaying a denominator or persisting a high-water mark.
          if (!catalog) throw new Error(`Missing framework catalog: ${section}`)
          return catalog
        }),
      ),
    staleTime: Infinity,
  })
  const summary =
    progress.data && catalogs.data
      ? summarizeFrameworkProgress(progress.data, catalogs.data).overall
      : undefined
  return (
    <MobileFrame tabs activeTab="framsteg" onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}>
      <Page
        runningHead={['HP · COACH', 'Framsteg']}
        status={{
          mode: 'FRAMSTEG',
          context: 'översikt',
          hints: ['esc tillbaka', '⌘k palett'],
        }}
      >
        <ProgressMobile
          userId={userId}
          stats={stats.data}
          loading={stats.isPending}
          error={stats.isError}
          patternsHeld={summary && { mastered: summary.counts.mastered, total: summary.total }}
        />
      </Page>
    </MobileFrame>
  )
}
