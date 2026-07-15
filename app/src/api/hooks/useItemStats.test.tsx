// useItemStats / useAbility — the learned-difficulty reads behind the smart
// drill picker (PL-L.3). Mocks the typed client so calls resolve offline,
// mirroring useMockResults.test.tsx. The load-bearing case is GRACEFUL
// FAILURE: a non-ok response must surface as query error (isError) so the
// drill route falls back to the random picker rather than gating.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getItemStats = vi.fn(async () => ({
  ok: true,
  json: async () => ({ difficulties: { 'var-2024-ORD-001': 120, 'var-2024-ORD-002': -80 } }),
}))
const getAbility = vi.fn(async () => ({
  ok: true,
  json: async () => ({ ability: { ORD: { ability: 60, attempts: 12 } } }),
}))

vi.mock('../useApiClient', () => ({
  useApiClient: () => ({
    api: {
      'item-stats': { $get: getItemStats },
      me: { ability: { $get: getAbility } },
    },
  }),
}))

import { useAbility, useItemStats } from './useItemStats'

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  getItemStats.mockClear()
  getAbility.mockClear()
})

describe('useItemStats', () => {
  it('GETs the per-section difficulty map with the section query param', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useItemStats('ORD'), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getItemStats).toHaveBeenCalledWith({ query: { section: 'ORD' } })
    expect(result.current.data).toEqual({ 'var-2024-ORD-001': 120, 'var-2024-ORD-002': -80 })
  })

  it('surfaces a non-ok response as an error (caller falls back to random)', async () => {
    getItemStats.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as never)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useItemStats('ORD'), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})

describe('useAbility', () => {
  it('GETs the per-section ability map', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useAbility(), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getAbility).toHaveBeenCalled()
    expect(result.current.data).toEqual({ ORD: { ability: 60, attempts: 12 } })
  })

  it('surfaces a non-ok response as an error', async () => {
    getAbility.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as never)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useAbility(), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})
