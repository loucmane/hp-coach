// User-prefs hooks: read + partial update.
//
// `useUserPrefs` returns a TanStack Query result wrapping the row from
// /api/me/prefs. `useUpdateUserPrefs` is a typed mutation that PATCHes
// a partial prefs object and invalidates the cache on success so any
// other component reading prefs re-renders.
//
// Type ergonomics: we infer the prefs row shape from the worker's typed
// response, so adding a new column flows here without any spec sync.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'

const PREFS_KEY = ['me', 'prefs'] as const

export type UserPrefsPatch = {
  daysToExam?: number | null
  dailyMinutes?: number
  targetSittingId?: string | null
  coach?: 'kompis' | 'professor' | 'taktiker'
  palette?: 'sand' | 'sage' | 'ink' | 'rose'
  mode?: 'light' | 'dark'
  font?: 'literary' | 'geometric' | 'editorial' | 'hyperlegible'
  density?: 'compact' | 'regular' | 'comfy'
  showStreak?: boolean
}

export function useUserPrefs() {
  const api = useApiClient()
  return useQuery({
    queryKey: PREFS_KEY,
    queryFn: async () => {
      const res = await api.api.me.prefs.$get()
      if (!res.ok) {
        throw new Error(`GET /api/me/prefs failed: ${res.status}`)
      }
      const body = await res.json()
      return body.prefs
    },
  })
}

export function useUpdateUserPrefs() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: UserPrefsPatch) => {
      const res = await api.api.me.prefs.$patch({ json: patch })
      if (!res.ok) {
        throw new Error(`PATCH /api/me/prefs failed: ${res.status}`)
      }
      const body = await res.json()
      return body.prefs
    },
    onSuccess: (data) => {
      // Optimistically replace the query cache so consumers re-render
      // without a refetch round-trip.
      qc.setQueryData(PREFS_KEY, data)
    },
  })
}
