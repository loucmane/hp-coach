// Learned-difficulty reads for the smart drill picker (PL-L.3).
//
//   useItemStats(section) → { [qid]: difficulty } for that section
//   useAbility()          → { [section]: { ability, attempts } } for the user
//
// Both back the adaptive picker in routes/drill.tsx. The underlying Elo fit
// runs NIGHTLY (cron) or via POST /api/fit/run — it never moves mid-session —
// so the queries carry a generous staleTime and DON'T poll: reading a slightly
// stale rating is completely fine, and refetching on every drill-start mount
// would just hammer the API for data that changes once a day.
//
// GRACEFUL BY CONTRACT: callers must treat missing/loading/errored data as
// "no ratings" and fall back to the random picker. Nothing renders-gates on
// these — see routes/drill.tsx, where the pick closure only threads ratings
// through when the data is actually present.

import { useQuery } from '@tanstack/react-query'

import type { Section } from '@/data/questions'

import { useApiClient } from '../useApiClient'

/** qid → learned Elo difficulty. Only rated questions appear. */
export type ItemDifficultyMap = Record<string, number>
/** section → learned Elo ability + how many attempts fed it. */
export type AbilityMap = Record<string, { ability: number; attempts: number }>

export const itemStatsKey = (section: Section) => ['item-stats', section] as const
export const ABILITY_KEY = ['me', 'ability'] as const

// The fit is nightly; 30 min of staleness is immaterial and spares the API a
// refetch on every drill-start.
const RATINGS_STALE_TIME = 30 * 60_000

/** Per-section item difficulties. Feeds the smart picker; absent/errored →
 *  caller falls back to random (never gates rendering on this). */
export function useItemStats(section: Section) {
  const api = useApiClient()
  return useQuery({
    queryKey: itemStatsKey(section),
    queryFn: async (): Promise<ItemDifficultyMap> => {
      const res = await api.api['item-stats'].$get({ query: { section } })
      if (!res.ok) {
        throw new Error(`GET /api/item-stats failed: ${res.status}`)
      }
      const body = await res.json()
      return body.difficulties as ItemDifficultyMap
    },
    staleTime: RATINGS_STALE_TIME,
  })
}

/** The user's learned per-section ability. Same graceful contract. */
export function useAbility() {
  const api = useApiClient()
  return useQuery({
    queryKey: ABILITY_KEY,
    queryFn: async (): Promise<AbilityMap> => {
      const res = await api.api.me.ability.$get()
      if (!res.ok) {
        throw new Error(`GET /api/me/ability failed: ${res.status}`)
      }
      const body = await res.json()
      return body.ability as AbilityMap
    },
    staleTime: RATINGS_STALE_TIME,
  })
}
