// useSubmitAttempt — stats-invalidation test (SF1, pulled in from SF2).
//
// Drill/mock completion on Home is derived from `useStats`
// (`attempts.total` / per-section `attempts7d`). `useStats` only refetches
// on focus + every 60s, so without a mutation-side invalidation a finished
// drill can read as "not done" for up to 60s. `useSubmitAttempt` must
// invalidate the stats query on success so completion updates promptly.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { STATS_KEY } from './useStats'

// Mock the API client so the mutation resolves without a real network call.
const post = vi.fn(async () => ({
  ok: true,
  json: async () => ({ attempt: { id: 1 } }),
}))
vi.mock('../useApiClient', () => ({
  useApiClient: () => ({ api: { attempts: { $post: post } } }),
}))

import { useSubmitAttempt } from './useAttempts'

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useSubmitAttempt', () => {
  it('invalidates the stats query on a successful attempt write', async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidate = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useSubmitAttempt(), { wrapper: wrapper(qc) })

    result.current.mutate({
      sessionId: 1,
      questionId: 'ORD-1',
      selectedAnswer: 'A',
      correct: true,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: STATS_KEY })
  })
})
