// /api/lesson-reads hooks — query + mark/unmark mutations with optimistic
// write-through into the React Query cache. Mocks the typed client so the
// mutations resolve without a real network call, mirroring
// useAttempts.test.tsx.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn(async () => ({ ok: true, json: async () => ({ entryIds: ['A', 'B'] }) }))
const put = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }))
const del = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }))
vi.mock('../useApiClient', () => ({
  useApiClient: () => ({
    api: { 'lesson-reads': { $get: get, $put: put, ':entryId': { $delete: del } } },
  }),
}))

import {
  LESSON_READS_KEY,
  useLessonReadsQuery,
  useMarkLessonReadServer,
  useUnmarkLessonReadServer,
} from './useLessonReadsApi'

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  get.mockClear()
  put.mockClear()
  del.mockClear()
})

describe('useLessonReadsQuery', () => {
  it('returns the server entry-id set', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useLessonReadsQuery(), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['A', 'B'])
  })
})

describe('useMarkLessonReadServer', () => {
  it('PUTs and optimistically appends to the cached set', async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    qc.setQueryData(LESSON_READS_KEY, ['A'])
    const { result } = renderHook(() => useMarkLessonReadServer(), { wrapper: wrapper(qc) })

    result.current.mutate('C')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(put).toHaveBeenCalledWith({ json: { entryId: 'C' } })
    expect(qc.getQueryData(LESSON_READS_KEY)).toEqual(['A', 'C'])
  })
})

describe('useUnmarkLessonReadServer', () => {
  it('DELETEs and optimistically removes from the cached set', async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    qc.setQueryData(LESSON_READS_KEY, ['A', 'B'])
    const { result } = renderHook(() => useUnmarkLessonReadServer(), { wrapper: wrapper(qc) })

    result.current.mutate('A')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(del).toHaveBeenCalledWith({ param: { entryId: 'A' } })
    expect(qc.getQueryData(LESSON_READS_KEY)).toEqual(['B'])
  })
})
