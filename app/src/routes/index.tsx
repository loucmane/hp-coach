// `/` — Daily Home.
//
// Composes `useDailyPlan()` (which resolves stats, due reps, framework
// hints, lesson-read state and runs the scheduler) into `HomeMobile`.
// Streak comes from `useStats()` directly so the badge can render
// independently of the plan readiness.

import { useUser } from '@clerk/clerk-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { lazy, Suspense, useContext, useEffect, useMemo, useState } from 'react'
import { useDueMistakes, usePileMistakes } from '@/api/hooks/useMistakes'
import { useMockResults } from '@/api/hooks/useMockResults'
import { useSessionHistory } from '@/api/hooks/useSessions'
import { useStats } from '@/api/hooks/useStats'
import { useTopTraps } from '@/api/hooks/useTopTraps'
import { AccountMenu } from '@/components/account/AccountMenu'
import { FolioHostContext } from '@/folio/host'
import { useDailyPlan } from '@/hooks/useDailyPlan'
import { type DiagnosticMemory, loadDiagnosticMemory } from '@/lib/diagnosticMemory'
import { TAB_ROUTE } from '@/lib/nav'
import { computeHonestDelta, computeHonestProjected, minutesPracticedToday } from '@/lib/scoring'
import { daysSinceVisit, loadPreviousVisit, markVisit } from '@/lib/visitMemory'
import { HomeMobile } from '@/screens/HomeMobile'

const FolioIdag = lazy(() => import('@/folio/screens/idag/FolioIdag'))

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  const inFolio = useContext(FolioHostContext)
  const navigate = useNavigate()
  const stats = useStats()
  const { plan, allComplete, mockPrescription, deferMock, isError: planError } = useDailyPlan()
  // Newest-first (server contract, useMockResults.ts) — [0] is the most
  // recent Provpass result, feeding ProvpassStatusLine's "senast X N/M"
  // countdown copy.
  const mockResults = useMockResults()
  const lastMockResult = mockResults.data?.[0] ?? null
  // First name powers the personalized greeting on HomeMobile.
  // `user?.firstName` is the canonical Clerk field; falls back to
  // the name half of `fullName` if firstName isn't set on the
  // account. Null while Clerk is still loading — HomeMobile renders
  // the anonymous "God morgon." in that window.
  const { user } = useUser()
  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? null

  const streakDays = stats.data?.streakDays
  // The phone tab bar's Öva numeral (threaded through as ovaDueCount) shows
  // TODAY'S PILE (usePileMistakes) so it matches the desktop rail/header
  // numeral exactly — rolls up on a fresh miss, down on a correct
  // repetition.
  const pileMistakes = usePileMistakes()
  const pileCount = pileMistakes.data?.length
  const ovaDueCount = pileCount ?? 0
  // LIVE ripe-now ("redo nu") count — the actionable slice the daily-plan
  // repetition row plays. Threaded into HomeMobile → DailyPlanCard as the
  // playable N; the pile above is the context total M ("N av M"). Same
  // query keys useDailyPlan already reads, so React Query dedupes.
  const dueMistakes = useDueMistakes()
  const dueMistakeCount = dueMistakes.data?.length
  const topTraps = useTopTraps()
  const recentPasses = useSessionHistory()

  // Projected total + verbal/quant halves for the Home score line — the
  // honest prognosis, over each question's first try (hpf-bz6f.4).
  // Pure derivation from stats.data; route owns the computation so
  // HomeMobile stays a presentational component (and its tests don't
  // need a QueryClient wrapper). Returns null while stats are loading
  // so the score line stays hidden during the skeleton state.
  const projected = useMemo(
    () => (stats.data ? computeHonestProjected(stats.data.bySection) : null),
    [stats.data],
  )

  // Week-over-week change for the stats row: a figure only when it clears
  // the noise, else "stable"; null (blank) when the two weeks aren't
  // comparable. See computeHonestDelta.
  const projectedDelta = useMemo(
    () => (stats.data ? computeHonestDelta(stats.data.bySection) : null),
    [stats.data],
  )

  // "minuter idag" — ELAPSED practice, not the plan estimate. Null while
  // stats resolve (Skrift ghost); statsError lets the line settle into an
  // honest em dash if the query fails outright.
  const minutesToday = stats.data ? minutesPracticedToday(stats.data) : null

  // Diagnostic memory — read once on mount so the localStorage hit
  // doesn't run on every render. Lives client-side per
  // diagnosticMemory.ts; an effect resyncs when the user returns to
  // Home after running the diagnostic.
  const [diagnosticMemory, setDiagnosticMemory] = useState<DiagnosticMemory | null>(() =>
    loadDiagnosticMemory(),
  )
  useEffect(() => {
    // Refresh on focus — covers the "ran /diagnostik, came back to /"
    // path without remounting the route.
    const refresh = () => setDiagnosticMemory(loadDiagnosticMemory())
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  // Visit memory — gap between previous Home visit and now. Captured
  // ONCE on mount: read the previous timestamp BEFORE writing the
  // current one, so the gap reflects "how long it had been before I
  // opened the app this time", not "0 days because I just touched
  // localStorage". Computed in days (rounded down) — same-day re-
  // visits return 0 and the kicker stays hidden.
  const [daysAwaySnapshot] = useState<number | null>(() => {
    const previous = loadPreviousVisit()
    markVisit()
    return daysSinceVisit(previous)
  })

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

  if (inFolio) {
    return (
      <Suspense fallback={<p role="status">Laddar …</p>}>
        <FolioIdag
          plan={plan}
          planError={planError}
          allComplete={allComplete}
          mockPrescription={mockPrescription}
          deferMock={deferMock}
          minutesToday={minutesToday}
          statsLoading={stats.isPending}
          projected={projected}
          projectedDelta={projectedDelta}
          bySection={stats.data?.bySection}
          attemptsDaily={stats.data?.attemptsDaily}
          topTraps={topTraps}
          history={recentPasses.data ?? []}
          firstName={firstName}
          dueCount={dueMistakeCount}
          pileCount={pileCount}
          dueMistakes={dueMistakes.data}
          pileMistakes={pileMistakes.data}
          navigateHref={(href) => {
            // Resume lessons retain their entry anchor as well as the section.
            const url = new URL(href, window.location.origin)
            navigate({
              to: url.pathname as never,
              search: Object.fromEntries(url.searchParams) as never,
              hash: url.hash.slice(1),
            })
          }}
        />
      </Suspense>
    )
  }

  return (
    <HomeMobile
      plan={plan}
      planError={planError}
      allComplete={allComplete}
      minutesToday={minutesToday}
      statsError={stats.isError}
      projected={projected}
      projectedDelta={projectedDelta}
      diagnosticMemory={diagnosticMemory}
      daysAway={daysAwaySnapshot}
      topTraps={topTraps}
      recentPasses={recentPasses.data ?? []}
      onPlanItemNavigate={navigateHref}
      onDeferMock={deferMock}
      streakDays={streakDays}
      firstName={firstName}
      onAvancerat={() => navigate({ to: '/avancerat' })}
      onTabChange={(id) => navigate({ to: TAB_ROUTE[id] })}
      ovaDueCount={ovaDueCount}
      dueMistakeCount={dueMistakeCount}
      pileMistakeCount={pileCount}
      mockPrescription={mockPrescription}
      lastMockResult={lastMockResult}
      accountMenu={<AccountMenu />}
    />
  )
}
