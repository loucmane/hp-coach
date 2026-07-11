// Mistakes-replay hooks.
//
// useDueMistakes(section?) — TanStack Query for the replay queue. Used
//   by /repetition (the actual replay flow) and by /drill's idle banner
//   (just the count). 30s background refetch when focused so a fresh
//   wrong-answer recorded on another tab shows up here within the window.
//
// useRecordMistake — POST /api/mistakes (upsert by questionId). Called
//   from /drill on every wrong answer.
//
// useResolveMistake — PATCH /api/mistakes/:id { resolve: true }. Called
//   from /repetition on every right answer that came from the queue.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'

const DUE_KEY = ['mistakes', 'due'] as const
const dueKeyForSection = (section?: string) =>
  section ? ([...DUE_KEY, section] as const) : DUE_KEY

export type Mistake = {
  id: number
  userId: number
  questionId: string
  layer1Ids: string[] | null
  status: string | null
  errorCount7d: number | null
  lastErrorAt: string | number | null
  nextReviewAt: string | number | null
}

export function useDueMistakes(section?: string) {
  const api = useApiClient()
  return useQuery({
    queryKey: dueKeyForSection(section),
    queryFn: async () => {
      // Limit 500: the playable session is capped at REPETITION_SESSION_SIZE
      // (10) but the *displayed* total ("10 av 71 missar") needs the full
      // count, so the hook must return at least as many rows as the worker
      // would count(). Real users won't accumulate 500+ active missar —
      // and the SRS spacing keeps the active set bounded — so this is
      // effectively uncapped at dogfood scale.
      const res = await api.api.mistakes.due.$get({
        query: { section, limit: '500' },
      })
      if (!res.ok) {
        throw new Error(`GET /api/mistakes/due failed: ${res.status}`)
      }
      const body = await res.json()
      return body.mistakes as Mistake[]
    },
    refetchInterval: 180_000,
    refetchIntervalInBackground: false,
  })
}

export function useRecordMistake() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { questionId: string; layer1Ids?: string[] }) => {
      const res = await api.api.mistakes.$post({ json: input })
      if (!res.ok) {
        throw new Error(`POST /api/mistakes failed: ${res.status}`)
      }
      const body = await res.json()
      return body.mistake as Mistake
    },
    onSuccess: () => {
      // The new/updated mistake belongs in the due queue — invalidate so
      // the idle banner count + replay list both reflect it next render.
      qc.invalidateQueries({ queryKey: DUE_KEY })
    },
  })
}

export function useResolveMistake() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: number }) => {
      const res = await api.api.mistakes[':id'].$patch({
        param: { id: String(input.id) },
        json: { resolve: true },
      })
      if (!res.ok) {
        throw new Error(`PATCH /api/mistakes/${input.id} failed: ${res.status}`)
      }
      const body = await res.json()
      return body.mistake as Mistake
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DUE_KEY })
    },
  })
}
