// useDailyPlan — day-boundary recompute (SF2b).
//
// The scheduler caches the plan keyed by local-date (`today`). Before
// SF2b, `today` was derived once from the default `now = new Date()`
// param at first render and never revisited — an overnight-open tab
// kept serving yesterday's plan until a hard remount. This suite drives
// the real hook (not just the pure helpers) to prove:
//
//   - `today` recomputes on `focus` / `visibilitychange`, NOT on a
//     timer and NOT via naive `now`-in-deps (see the documented
//     infinite-render-loop comment in useDailyPlan.ts ~92-103).
//   - regeneration is suppressed while the user has an active session,
//     so the plan doesn't get yanked out from under an in-progress
//     drill/lesson/repetition on another tab or device.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Section } from '@/data/questions'
import { localDateString } from '@/lib/scheduler'
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

let activeSessions: unknown[] = []

// Reference-stable mock payloads. TanStack Query keeps the same object
// reference across re-renders when the underlying data hasn't changed —
// a mock that returns a fresh literal on every call breaks that
// invariant and can tickle the exact re-render loop useDailyPlan.ts's
// dependency arrays are designed to avoid (see its ~92-103 comment).
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

vi.mock('@/api/hooks/useStats', () => ({
  useStats: () => ({ data: statsData, isLoading: false }),
}))

vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: dueData, isLoading: false }),
}))

vi.mock('@/api/hooks/useTopTraps', () => ({
  useTopTraps: () => topTrapsData,
}))

// Provpass steering (B1): no mock history in this suite's fixtures — the
// scheduler treats that as "never mocked" (baseline case), same as any
// other cold-start-shaped fixture already exercised here.
vi.mock('@/api/hooks/useMockResults', () => ({
  useMockResults: () => ({ data: mockResultsData, isLoading: false }),
}))

vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessions: () => ({ data: activeSessions, isLoading: false }),
}))

// Server plan + read-set hooks. Default to "no server plan, empty read
// set" so this suite exercises the local generate → PUT path; the PUT is a
// no-op spy. The dedicated cross-device suite drives the adopt path.
const putServerPlanMock = vi.fn()
let serverPlanData: unknown = null
// Reference-stable payloads (see the statsData note above): a fresh literal
// per render changes the query `.data` reference every render, which cascades
// through mergedReads → the build effect and can trip the very render loop
// this hook is designed to avoid.
const emptyReads: string[] = []
vi.mock('@/api/hooks/useDailyPlanApi', () => ({
  useDailyPlanQuery: () => ({ data: serverPlanData, isLoading: false }),
  usePutDailyPlan: () => ({ mutate: putServerPlanMock }),
}))

vi.mock('@/api/hooks/useLessonReadsApi', () => ({
  useLessonReadsQuery: () => ({ data: emptyReads, isLoading: false }),
}))

vi.mock('@/data/frameworks', () => ({
  loadFramework: async () => null,
  entryHeadword: () => null,
}))

import { useDailyPlan } from './useDailyPlan'

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useDailyPlan — day-boundary recompute', () => {
  beforeEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    activeSessions = []
    serverPlanData = null
    putServerPlanMock.mockClear()
    vi.setSystemTime(new Date('2026-05-18T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not recompute on a bare timer tick (no setInterval polling)', async () => {
    const { result } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    const dateBefore = result.current.plan?.date

    // Advance FAKE time (not the wall clock) well past midnight WITHOUT
    // firing focus/visibilitychange — a setInterval-based implementation
    // would pick this up as its timer fires; the focus-driven design
    // must not. Fake timers are scoped to just this assertion so the
    // earlier waitFor's real-timer polling isn't affected.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-05-19T00:30:00'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60_000)
    })

    expect(result.current.plan?.date).toBe(dateBefore)
  })

  it('recomputes `today` on a `focus` event after the local day rolls over', async () => {
    const { result } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.date).toBe('2026-05-18')

    vi.setSystemTime(new Date('2026-05-19T08:00:00'))
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    await waitFor(() => expect(result.current.plan?.date).toBe('2026-05-19'))
  })

  it('recomputes on `visibilitychange` becoming visible', async () => {
    const { result } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.plan).not.toBeNull())

    vi.setSystemTime(new Date('2026-05-20T09:00:00'))
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() => expect(result.current.plan?.date).toBe('2026-05-20'))
  })

  it('does NOT regenerate across a day rollover while a session is active', async () => {
    const { result, rerender } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.date).toBe('2026-05-18')

    // Mutate the mocked `useActiveSessions` payload, then rerender so the
    // hook actually observes the new value — mirrors how a real
    // `useQuery` delivers a fresh session-active signal via a re-render
    // before the user could plausibly focus the tab again.
    activeSessions = [{ id: 1, kind: 'drill' }]
    act(() => {
      rerender()
    })

    vi.setSystemTime(new Date('2026-05-19T08:00:00'))
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
      // Flush any pending effects/microtasks triggered by the event.
      await Promise.resolve()
    })

    expect(result.current.plan?.date).toBe('2026-05-18')
  })

  it('does not fire the day-boundary effect on every render (no infinite loop)', async () => {
    const { result, rerender } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    const planRef = result.current.plan

    rerender()
    rerender()
    rerender()

    // Same reference — re-rendering without a focus/visibility event or a
    // real day change must not churn the plan object.
    expect(result.current.plan).toBe(planRef)
  })
})

describe('localDateString sanity (documents the day-boundary semantics)', () => {
  it('uses the browser LOCAL calendar, not UTC', () => {
    // 2026-05-18T23:30 local time is still "2026-05-18" locally even
    // though it may already be UTC 2026-05-19 depending on timezone —
    // the client's notion of "today" is intentionally local-tz.
    const d = new Date(2026, 4, 18, 23, 30)
    expect(localDateString(d)).toBe('2026-05-18')
  })
})
