import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getProgress = vi.hoisted(() => vi.fn())
vi.mock('../useApiClient', () => ({
  useApiClient: () => ({ api: { 'framework-progress': { $get: getProgress } } }),
}))

import { FRAMEWORK_PROGRESS_KEY, useFrameworkProgress } from './useFrameworkProgress'

const progress = [{ layer1Id: 'NOG-1', status: 'learning', lastTransitionAt: null }]

beforeEach(() => {
  getProgress.mockReset().mockResolvedValue({ ok: true, json: async () => ({ progress }) })
})

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 300_000 } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe('useFrameworkProgress', () => {
  it('fetches rows and shares the cached response between consumers', async () => {
    const { qc, wrapper } = setup()
    const first = renderHook(() => useFrameworkProgress(), { wrapper })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    expect(first.result.current.data).toEqual(progress)
    expect(qc.getQueryData(FRAMEWORK_PROGRESS_KEY)).toEqual(progress)
    const second = renderHook(() => useFrameworkProgress(), { wrapper })
    expect(second.result.current.data).toEqual(progress)
    expect(getProgress).toHaveBeenCalledTimes(1)
    expect(getProgress).toHaveBeenCalledWith()
  })

  it('returns an empty list for a successful empty response', async () => {
    getProgress.mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) })
    const { wrapper } = setup()
    const { result } = renderHook(() => useFrameworkProgress(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('surfaces failed requests as errors rather than an empty progress history', async () => {
    getProgress.mockResolvedValueOnce({ ok: false, status: 503 })
    const { wrapper } = setup()
    const { result } = renderHook(() => useFrameworkProgress(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('GET /api/framework-progress failed: 503')
    expect(result.current.data).toBeUndefined()
  })
})
