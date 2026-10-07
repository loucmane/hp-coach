// useStats — P5 infold PR 3 (docs/p5-infold-design.md §E): the worker now
// reports P5 practice accuracy apart, in `practiceSynthetic`. The field is
// optional, so the hook reads a worker that does not send it yet exactly as
// before. Mocks the typed client, as useItemStats.test.tsx does.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const BASE = {
  attempts: { total: 12, today: 3, thisWeek: 9 },
  drills: { total: 4, thisWeek: 2 },
  mistakes: { active: 1, due: 0, resolved: 2 },
  accuracy7d: 0.5,
  streakDays: 2,
  timeMsToday: 90_000,
  bySection: {},
  weekly: [],
}
const getStats = vi.fn(async () => ({ ok: true, json: async () => ({ stats: BASE as unknown }) }))

vi.mock('../useApiClient', () => ({
  useApiClient: () => ({ api: { me: { stats: { $get: getStats } } } }),
}))

import { useStats } from './useStats'

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  getStats.mockClear()
})

describe('useStats — practiceSynthetic', () => {
  it('passes P5 practice accuracy through when the worker reports it', async () => {
    const practiceSynthetic = { attempts90d: 7, correct90d: 4, attempts7d: 3, correct7d: 2 }
    getStats.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stats: { ...BASE, practiceSynthetic } }),
    })
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useStats(), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.practiceSynthetic).toEqual(practiceSynthetic)
    // Authentic accuracy is a separate number, never merged with P5.
    expect(result.current.data?.accuracy7d).toBe(0.5)
  })

  it('reads a worker without the field exactly as before', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useStats(), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(BASE)
    expect(result.current.data?.practiceSynthetic).toBeUndefined()
  })
})
