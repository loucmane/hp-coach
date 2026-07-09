// /api/daily-plans hooks — GET (adopt) + PUT (publish baseline) with a
// write-through cache. Mocks the typed client so calls resolve offline,
// mirroring useAttempts.test.tsx.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type DailyPlan, PLAN_SCHEMA_VERSION } from '@/lib/scheduler'

const plan: DailyPlan = {
  version: PLAN_SCHEMA_VERSION,
  date: '2026-05-18',
  items: [],
  estimatedMinutes: 0,
  totalAttemptsSnapshot: 0,
}

const get = vi.fn(async () => ({ ok: true, json: async () => ({ plan }) }))
const put = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, plan }) }))
vi.mock('../useApiClient', () => ({
  useApiClient: () => ({ api: { 'daily-plans': { ':date': { $get: get, $put: put } } } }),
}))

import { dailyPlanKey, useDailyPlanQuery, usePutDailyPlan } from './useDailyPlanApi'

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  get.mockClear()
  put.mockClear()
})

describe('useDailyPlanQuery', () => {
  it('GETs the server plan for a date', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useDailyPlanQuery('2026-05-18'), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(get).toHaveBeenCalledWith({ param: { date: '2026-05-18' } })
    expect(result.current.data).toEqual(plan)
  })

  it('is disabled for an empty date', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useDailyPlanQuery(''), { wrapper: wrapper(qc) })
    expect(result.current.fetchStatus).toBe('idle')
    expect(get).not.toHaveBeenCalled()
  })
})

describe('usePutDailyPlan', () => {
  it('PUTs the plan and write-through caches it under its date key', async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const { result } = renderHook(() => usePutDailyPlan(), { wrapper: wrapper(qc) })

    result.current.mutate(plan)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(put).toHaveBeenCalledWith({
      param: { date: '2026-05-18' },
      json: { plan },
    })
    expect(qc.getQueryData(dailyPlanKey('2026-05-18'))).toEqual(plan)
  })
})
