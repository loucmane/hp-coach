// Mistakes-replay hooks.
//
// Two vocabularies, used consistently across every surface (see the
// queue-sync fix, 2026-07):
//   - DUE   ("mogna nu")  = mistakes whose nextReviewAt has elapsed —
//     what you can replay right now. Drives the /repetition flow, the
//     Öva repetera-lane CTA, and the Home daily-plan prescription.
//   - ACTIVE ("hela kön") = every active mistake regardless of schedule
//     — the whole repetition queue. Drives the living nav numeral and
//     the per-section "N väntar" lane counts, so a fresh mistake makes
//     the number roll UP immediately even though it's scheduled for
//     tomorrow and so is NOT yet due.
//
// useDueMistakes(section?) — the ripe-now queue (scope=due). Used by
//   /repetition (the actual replay flow) and the due-based CTAs/copy.
//
// useActiveMistakes(section?) — the whole active queue (scope=all). Used
//   by the nav numeral stations, the Öva section lanes, and DrillResult's
//   "i repetitionskön" total. Its own query key so the two never collide.
//
// useRecordMistake — POST /api/mistakes (upsert by questionId). Called
//   from /drill on every wrong answer. Invalidates BOTH keys so the
//   numeral (active) rolls up mid-drill and the due count stays honest.
//
// useResolveMistake — PATCH /api/mistakes/:id { resolve: true }. Called
//   from /repetition on every right answer that came from the queue.
//   Also invalidates BOTH keys.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'

const DUE_KEY = ['mistakes', 'due'] as const
const dueKeyForSection = (section?: string) =>
  section ? ([...DUE_KEY, section] as const) : DUE_KEY

const ACTIVE_KEY = ['mistakes', 'active'] as const
const activeKeyForSection = (section?: string) =>
  section ? ([...ACTIVE_KEY, section] as const) : ACTIVE_KEY

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

/** The WHOLE active repetition queue (scope=all) — every active mistake
 *  regardless of nextReviewAt. This is the numeral's source: a fresh
 *  mistake belongs here immediately, so the count rolls up mid-drill
 *  even though the mistake won't be *due* until tomorrow. Same limit
 *  reasoning as useDueMistakes (500 ≈ uncapped at dogfood scale). */
export function useActiveMistakes(section?: string) {
  const api = useApiClient()
  return useQuery({
    queryKey: activeKeyForSection(section),
    queryFn: async () => {
      const res = await api.api.mistakes.due.$get({
        query: { section, limit: '500', scope: 'all' },
      })
      if (!res.ok) {
        throw new Error(`GET /api/mistakes/due?scope=all failed: ${res.status}`)
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
      qc.invalidateQueries({ queryKey: ACTIVE_KEY })
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
      qc.invalidateQueries({ queryKey: ACTIVE_KEY })
    },
  })
}
