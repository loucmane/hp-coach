// /api/mock-results + /api/me/exposure hooks — Provpass (mock exam)
// results list, submit mutation, and the exposure map. Mocks the typed
// client so calls resolve offline, mirroring useDailyPlanApi.test.tsx /
// useLessonReadsApi.test.tsx.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MockBreakdown, MockResultRow } from './useMockResults'

const BREAKDOWN: MockBreakdown = {
  perSection: { XYZ: { presented: 12, correct: 10, timeMs: 500_000 } },
  missedQids: ['var-2024-XYZ-003'],
  version: 1,
}

const RESULT_ROW: MockResultRow = {
  id: 1,
  userId: 1,
  sessionId: 42,
  mode: 'authentic',
  half: 'kvant',
  examId: 'var-2024',
  provpass: 'kvant-1',
  presented: 40,
  answered: 40,
  correct: 30,
  seenBefore: 5,
  durationMs: 3_600_000,
  breakdown: BREAKDOWN,
  createdAt: 1_800_000_000,
}

const getResults = vi.fn(async () => ({ ok: true, json: async () => ({ results: [RESULT_ROW] }) }))
const postResult = vi.fn(async () => ({ ok: true, json: async () => ({ result: RESULT_ROW }) }))
const getExposure = vi.fn(async () => ({
  ok: true,
  json: async () => ({ exposure: { 'var-2024-XYZ-001': { n: 2, last: 1_800_000_000 } } }),
}))

vi.mock('../useApiClient', () => ({
  useApiClient: () => ({
    api: {
      'mock-results': { $get: getResults, $post: postResult },
      me: { exposure: { $get: getExposure } },
    },
  }),
}))

import {
  MOCK_RESULTS_KEY,
  useExposure,
  useMockResults,
  useSubmitMockResult,
} from './useMockResults'

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  getResults.mockClear()
  postResult.mockClear()
  getExposure.mockClear()
})

describe('useMockResults', () => {
  it('GETs the mock-results list', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useMockResults(), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getResults).toHaveBeenCalled()
    expect(result.current.data).toEqual([RESULT_ROW])
  })
})

describe('useSubmitMockResult', () => {
  it('POSTs and invalidates the mock-results list', async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidate = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useSubmitMockResult(), { wrapper: wrapper(qc) })

    result.current.mutate({
      sessionId: 42,
      mode: 'authentic',
      half: 'kvant',
      examId: 'var-2024',
      provpass: 'kvant-1',
      presented: 40,
      answered: 40,
      correct: 30,
      seenBefore: 5,
      durationMs: 3_600_000,
      breakdown: BREAKDOWN,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(postResult).toHaveBeenCalled()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: MOCK_RESULTS_KEY })
  })
})

describe('useExposure', () => {
  it('GETs the exposure map', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useExposure(), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getExposure).toHaveBeenCalled()
    expect(result.current.data).toEqual({ 'var-2024-XYZ-001': { n: 2, last: 1_800_000_000 } })
  })
})
