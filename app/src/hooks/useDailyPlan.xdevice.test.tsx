// useDailyPlan — cross-device server-baseline adopt/generate/PUT flow.
//
// The plan baseline was localStorage-only; #165 promotes it to a D1
// `daily_plans` table with first-generator-wins semantics. This suite
// drives the REAL hook to prove:
//
//   - ADOPT: when the server already has a plan for today, the hook adopts
//     it verbatim (server wins) and does NOT generate/PUT a second one.
//   - GENERATE + PUBLISH: when the server has none, the hook generates
//     locally and PUTs the fresh plan so the other device adopts it.
//   - REGENERATE overwrites the server row via PUT.
//   - The adopted plan is mirrored into localStorage (fast-path cache).

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Section } from '@/data/questions'
import { type DailyPlan, loadPlan, PLAN_SCHEMA_VERSION } from '@/lib/scheduler'
import type { SectionStats } from '@/lib/scoring'

const emptySectionStats: SectionStats = {
  attempts7d: 0,
  correct7d: 0,
  attempts7to14d: 0,
  correct7to14d: 0,
  attempts90d: 0,
  correct90d: 0,
  avgTimeMs: null,
  lastAttemptedAt: null,
  attemptsToday: 0,
}
const SECTIONS: Section[] = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK']
const bySection = Object.fromEntries(SECTIONS.map((s) => [s, emptySectionStats])) as Record<
  Section,
  SectionStats
>

const statsData = {
  attempts: { total: 0, today: 0, thisWeek: 0 },
  drills: { total: 0, thisWeek: 0 },
  mistakes: { active: 0, due: 0, resolved: 0 },
  accuracy7d: null,
  streakDays: 0,
  bySection,
  weekly: [],
}
const dueData: unknown[] = []
const mockResultsData: unknown[] = []
const topTrapsData: unknown[] = []
const emptyReads: string[] = []

vi.mock('@/api/hooks/useStats', () => ({ useStats: () => ({ data: statsData, isLoading: false }) }))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: dueData, isLoading: false }),
}))
vi.mock('@/api/hooks/useTopTraps', () => ({ useTopTraps: () => topTrapsData }))

// Provpass steering (B1): no mock history in this suite's fixtures — see
// the same-named mock in useDailyPlan.hook.test.tsx for rationale.
vi.mock('@/api/hooks/useMockResults', () => ({
  useMockResults: () => ({ data: mockResultsData, isLoading: false }),
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessions: () => ({ data: [], isLoading: false }),
}))
// Stub the adaptive-review detector (task #16) — this suite exercises the
// cross-device adopt path, not hot-trap boosting.
vi.mock('@/api/hooks/useAdaptiveReview', () => ({
  useAdaptiveReview: () => ({
    hotTrap: null,
    section: null,
    trapName: null,
    detourHref: null,
    lektionHref: null,
    decline: () => {},
  }),
}))
vi.mock('@/data/frameworks', () => ({ loadFramework: async () => null, entryHeadword: () => null }))
vi.mock('@/api/hooks/useLessonReadsApi', () => ({
  useLessonReadsQuery: () => ({ data: emptyReads, isLoading: false }),
}))

const putMock = vi.fn()
let serverPlanData: DailyPlan | null = null
let serverPlanLoading = false
vi.mock('@/api/hooks/useDailyPlanApi', () => ({
  useDailyPlanQuery: () => ({ data: serverPlanData, isLoading: serverPlanLoading }),
  usePutDailyPlan: () => ({ mutate: putMock }),
}))

import { useDailyPlan } from './useDailyPlan'

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

function serverPlan(): DailyPlan {
  return {
    version: PLAN_SCHEMA_VERSION,
    date: '2026-05-18',
    items: [
      {
        id: 'drill-from-phone',
        kind: 'drill',
        section: 'NOG',
        headline: 'NOG · genererad på telefonen',
        rationale: 'baseline från andra enheten',
        estimatedMinutes: 12,
        href: '/drill?section=NOG',
        completed: false,
      },
    ],
    estimatedMinutes: 12,
    attemptsSnapshot: { NOG: 0 } as never,
    totalAttemptsSnapshot: 0,
  }
}

beforeEach(() => {
  localStorage.clear()
  putMock.mockClear()
  serverPlanData = null
  serverPlanLoading = false
  vi.setSystemTime(new Date('2026-05-18T10:00:00'))
})

describe('useDailyPlan — server baseline (first-generator-wins)', () => {
  it('adopts the server plan verbatim when one exists (server wins)', async () => {
    serverPlanData = serverPlan()
    const { result } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.plan).not.toBeNull())

    // Adopted the exact server item — not a freshly generated one.
    expect(result.current.plan?.items[0].id).toBe('drill-from-phone')
    // Did NOT publish a second baseline.
    expect(putMock).not.toHaveBeenCalled()
    // Mirrored into localStorage as the fast-path cache.
    expect(loadPlan('2026-05-18')?.items[0].id).toBe('drill-from-phone')
  })

  it('generates locally and PUTs the fresh plan when the server has none', async () => {
    serverPlanData = null
    const { result } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.plan).not.toBeNull())

    expect(putMock).toHaveBeenCalledTimes(1)
    const published = putMock.mock.calls[0][0] as DailyPlan
    expect(published.date).toBe('2026-05-18')
    expect(published.version).toBe(PLAN_SCHEMA_VERSION)
    // Same object the hook is serving locally.
    expect(published.items).toEqual(result.current.plan?.items)
  })

  it('waits for the server query to settle before generating', async () => {
    serverPlanLoading = true
    const { result, rerender } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
    // Still loading server plan → no local generation yet.
    await Promise.resolve()
    expect(result.current.plan).toBeNull()
    expect(putMock).not.toHaveBeenCalled()

    // Server settles with no row → now generate + publish.
    serverPlanLoading = false
    act(() => rerender())
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(putMock).toHaveBeenCalledTimes(1)
  })

  it('regenerate overwrites the server row via PUT', async () => {
    serverPlanData = null
    const { result } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    putMock.mockClear()

    act(() => result.current.regenerate())
    expect(putMock).toHaveBeenCalledTimes(1)
    const published = putMock.mock.calls[0][0] as DailyPlan
    expect(published.date).toBe('2026-05-18')
  })
})
