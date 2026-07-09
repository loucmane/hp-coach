// /api/mock-results + /api/me/exposure — Provpass (mock exam) results.
//
// A mock is graded as a whole pass server-side (worker/src/routes/
// mockResults.ts): POST once after the session is ended, GET the user's
// history newest-first. `useExposure` is a separate, cheap read of the
// per-question exposure map (worker/src/routes/me.ts GET /exposure) that
// a mock's "seenBefore" is snapshotted FROM at submit time — see the
// mock_results.seenBefore column comment in the worker schema for why the
// snapshot, not a live recompute, is stored.
//
// These types are the CONTRACT for two parallel follow-up PRs (Provpass
// UI + Provpass scoring) — keep the names exactly as exported here.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'

export type MockMode = 'authentic' | 'synthetic'
export type MockHalf = 'verbal' | 'kvant'

export type MockBreakdown = {
  perSection: Record<string, { presented: number; correct: number; timeMs: number }>
  missedQids: string[]
  version: 1
}

export type MockResultRow = {
  id: number
  userId: number
  sessionId: number
  mode: MockMode
  half: MockHalf
  examId: string | null
  provpass: string | null
  presented: number
  answered: number
  correct: number
  seenBefore: number
  durationMs: number
  breakdown: MockBreakdown
  createdAt: number | string | null
}

export type ExposureMap = Record<string, { n: number; last: number }>

export type SubmitMockResultInput = {
  sessionId: number
  mode: MockMode
  half: MockHalf
  examId?: string | null
  provpass?: string | null
  presented: number
  answered: number
  correct: number
  seenBefore: number
  durationMs: number
  breakdown: MockBreakdown
}

export const MOCK_RESULTS_KEY = ['mock-results'] as const
export const EXPOSURE_KEY = ['exposure'] as const

/** GET this user's mock results, newest-first (server caps at 50). */
export function useMockResults() {
  const api = useApiClient()
  return useQuery({
    queryKey: MOCK_RESULTS_KEY,
    queryFn: async (): Promise<MockResultRow[]> => {
      const res = await api.api['mock-results'].$get()
      if (!res.ok) {
        throw new Error(`GET /api/mock-results failed: ${res.status}`)
      }
      const body = await res.json()
      return body.results as MockResultRow[]
    },
  })
}

/** POST a finished mock's summary. Invalidates the list so the results
 *  screen / history picks it up without a manual refetch. */
export function useSubmitMockResult() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SubmitMockResultInput): Promise<MockResultRow> => {
      const res = await api.api['mock-results'].$post({ json: input })
      if (!res.ok) {
        throw new Error(`POST /api/mock-results failed: ${res.status}`)
      }
      const body = await res.json()
      return body.result as MockResultRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MOCK_RESULTS_KEY })
    },
  })
}

/** GET the per-question exposure map. Exposure changes slowly (one
 *  question at a time, spread across drills/mocks), so a generous
 *  staleTime avoids refetching this on every mount — a mock-start screen
 *  and a drill-start screen can both read it without hammering the API. */
export function useExposure() {
  const api = useApiClient()
  return useQuery({
    queryKey: EXPOSURE_KEY,
    queryFn: async (): Promise<ExposureMap> => {
      const res = await api.api.me.exposure.$get()
      if (!res.ok) {
        throw new Error(`GET /api/me/exposure failed: ${res.status}`)
      }
      const body = await res.json()
      return body.exposure as ExposureMap
    },
    staleTime: 5 * 60_000,
  })
}
