// Mistakes-replay hooks.
//
// Vocabularies, used consistently across every surface:
//   - DUE   ("redo nu") = mistakes whose nextReviewAt has elapsed — what
//     you can replay right now. Drives the /repetition replay flow and the
//     Home daily-plan's actionable "N att repetera" prescription.
//   - PILE  ("att repetera", owner 2026-07-13) = TODAY'S PILE: active
//     mistakes that are due now OR were touched today. This is the single
//     number shown on every numeral station (nav rail, spine, phone tab,
//     drill/repetition header), the Öva hub lanes, and DrillResult. It
//     rolls UP the instant a wrong answer is logged (touched today) and
//     DOWN the instant a correct repetition reschedules an older miss out
//     — the intuitive "things to deal with today" count. Replaces the old
//     "ACTIVE / hela kön" number that never went down on a correct answer.
//   - ACTIVE ("hela kön", scope=all) = every active mistake regardless of
//     schedule. Kept for any consumer that wants the unbounded queue.
//
// useDueMistakes(section?)   — ripe-now queue (scope=due).
// usePileMistakes(section?)  — today's pile (scope=pile). The numeral hook.
// useActiveMistakes(section?)— whole active queue (scope=all).
// Each has its own query key so they never collide.
//
// useRecordMistake — POST /api/mistakes (upsert by questionId). Called
//   from /drill AND /repetition on every wrong answer. Invalidates ALL
//   keys so the pile numeral rolls and the due count stays honest.
// useResolveMistake — PATCH /api/mistakes/:id { resolve: true }. Called
//   from /repetition on every right answer. Also invalidates ALL keys so
//   a correct repetition drops the pile numeral live.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'

const DUE_KEY = ['mistakes', 'due'] as const
const dueKeyForSection = (section?: string) =>
  section ? ([...DUE_KEY, section] as const) : DUE_KEY

const ACTIVE_KEY = ['mistakes', 'active'] as const
const activeKeyForSection = (section?: string) =>
  section ? ([...ACTIVE_KEY, section] as const) : ACTIVE_KEY

const PILE_KEY = ['mistakes', 'pile'] as const
const pileKeyForSection = (section?: string) =>
  section ? ([...PILE_KEY, section] as const) : PILE_KEY

/** The client's local-midnight epoch (ms) — the "start of today" the
 *  worker's scope=pile filter compares lastErrorAt against. The worker has
 *  no user timezone, so the client owns this boundary. */
function localDayStartEpoch(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

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

/** TODAY'S PILE (scope=pile) — the single "att repetera" number every
 *  numeral station shows. Active mistakes that are due now OR touched
 *  today. Rolls up on a fresh wrong answer, down on a correct repetition;
 *  a WRONG repetition leaves it dead static (the item was touched today,
 *  so it stays). Same 500 limit reasoning as the others. */
export function usePileMistakes(section?: string) {
  const api = useApiClient()
  return useQuery({
    queryKey: pileKeyForSection(section),
    queryFn: async () => {
      const res = await api.api.mistakes.due.$get({
        query: {
          section,
          limit: '500',
          scope: 'pile',
          dayStart: String(localDayStartEpoch()),
        },
      })
      if (!res.ok) {
        throw new Error(`GET /api/mistakes/due?scope=pile failed: ${res.status}`)
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
      qc.invalidateQueries({ queryKey: PILE_KEY })
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
      qc.invalidateQueries({ queryKey: PILE_KEY })
    },
  })
}
