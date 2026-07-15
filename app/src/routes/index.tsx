// `/` — Daily Home.
//
// Composes `useDailyPlan()` (which resolves stats, due reps, framework
// hints, lesson-read state and runs the scheduler) into `HomeMobile`.
// Streak comes from `useStats()` directly so the badge can render
// independently of the plan readiness.

import { useUser } from '@clerk/clerk-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useDueMistakes, usePileMistakes } from '@/api/hooks/useMistakes'
import { useMockResults } from '@/api/hooks/useMockResults'
import { useSessionHistory } from '@/api/hooks/useSessions'
import { useStats } from '@/api/hooks/useStats'
import { useTopTraps } from '@/api/hooks/useTopTraps'
import { AccountMenu } from '@/components/account/AccountMenu'
import { SECTION_KEYS } from '@/data/questions'
import { useDailyPlan } from '@/hooks/useDailyPlan'
import { type DiagnosticMemory, loadDiagnosticMemory } from '@/lib/diagnosticMemory'
import { TAB_ROUTE } from '@/lib/nav'
import { computeProjected, computeProjectedDelta, computeSectionScore } from '@/lib/scoring'
import { daysSinceVisit, loadPreviousVisit, markVisit } from '@/lib/visitMemory'
import { HomeMobile } from '@/screens/HomeMobile'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
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
  const pileCount = usePileMistakes().data?.length
  const ovaDueCount = pileCount ?? 0
  // LIVE ripe-now ("redo nu") count — the actionable slice the daily-plan
  // repetition row plays. Threaded into HomeMobile → DailyPlanCard as the
  // playable N; the pile above is the context total M ("N av M"). Same
  // query keys useDailyPlan already reads, so React Query dedupes.
  const dueMistakeCount = useDueMistakes().data?.length
  const topTraps = useTopTraps()
  const recentPasses = useSessionHistory()

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

  // Honest week-over-week delta for the stats row — null (blank) when
  // the two weeks aren't comparable. See computeProjectedDelta.
  const projectedDelta = useMemo(
    () => (stats.data ? computeProjectedDelta(stats.data.bySection) : null),
    [stats.data],
  )

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

  return (
    <HomeMobile
      plan={plan}
      planError={planError}
      allComplete={allComplete}
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
