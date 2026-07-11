// /api/lesson-reads — the cross-device READ SET for framework entries.
//
// Distinct from useLessonProgress (a single per-section last-opened
// bookmark): this is the FULL set of entries the user has marked read.
// The scheduler consumes it for lesson-item completion AND the next-
// unread-entry hint. localStorage stays as an offline / fast-path cache
// (see the `useLessonReads` UI hook); this is the server source of truth,
// reconciled on the next GET.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'

export const LESSON_READS_KEY = ['lesson-reads'] as const

/** GET the full set of read entry ids for the current user. */
export function useLessonReadsQuery() {
  const api = useApiClient()
  return useQuery({
    queryKey: LESSON_READS_KEY,
    queryFn: async (): Promise<string[]> => {
      const res = await api.api['lesson-reads'].$get()
      if (!res.ok) {
        throw new Error(`GET /api/lesson-reads failed: ${res.status}`)
      }
      const body = await res.json()
      return (body.entryIds ?? []) as string[]
    },
    // Cheap, small, and read on Home + the lesson reader. Refetch on focus
    // (default) plus a slow poll so the other device converges without a
    // manual reload.
    refetchInterval: 300_000,
    refetchIntervalInBackground: false,
  })
}

/** PUT (mark read) — idempotent server upsert. */
export function useMarkLessonReadServer() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entryId: string) => {
      const res = await api.api['lesson-reads'].$put({ json: { entryId } })
      if (!res.ok) {
        throw new Error(`PUT /api/lesson-reads failed: ${res.status}`)
      }
      return entryId
    },
    onSuccess: (entryId) => {
      // Optimistic write-through so this device reflects the mark now; the
      // other device converges on focus / poll.
      qc.setQueryData<string[]>(LESSON_READS_KEY, (prev) =>
        prev?.includes(entryId) ? prev : [...(prev ?? []), entryId],
      )
    },
  })
}

/** DELETE (unmark). */
export function useUnmarkLessonReadServer() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entryId: string) => {
      const res = await api.api['lesson-reads'][':entryId'].$delete({ param: { entryId } })
      if (!res.ok) {
        throw new Error(`DELETE /api/lesson-reads failed: ${res.status}`)
      }
      return entryId
    },
    onSuccess: (entryId) => {
      qc.setQueryData<string[]>(LESSON_READS_KEY, (prev) =>
        (prev ?? []).filter((e) => e !== entryId),
      )
    },
  })
}
