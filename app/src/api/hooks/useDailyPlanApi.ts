// /api/daily-plans — the server plan baseline (first-generator-wins).
//
// The localStorage `hpc-daily-plan-<date>` blob is the fast-path / offline
// cache; this endpoint is the cross-device baseline so both devices adopt
// the SAME generated plan for a local date. useDailyPlan GETs today's plan
// BEFORE generating (adopt if present) and PUTs after a local generation
// or "Generera om".
//
// The plan blob is opaque here — it's the client's DailyPlan JSON shape,
// versioned under PLAN_SCHEMA_VERSION on the client. We type it as
// DailyPlan on the way in/out but the server never inspects it.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { DailyPlan } from '@/lib/scheduler'
import { useApiClient } from '../useApiClient'

export const dailyPlanKey = (date: string) => ['daily-plan', date] as const

/** GET this user's server plan for a local date, or null when none exists.
 *  `date` empty → the query is disabled (we only fetch once we know the
 *  local date). */
export function useDailyPlanQuery(date: string) {
  const api = useApiClient()
  return useQuery({
    queryKey: dailyPlanKey(date),
    enabled: date.length > 0,
    queryFn: async (): Promise<DailyPlan | null> => {
      const res = await api.api['daily-plans'][':date'].$get({ param: { date } })
      if (!res.ok) {
        throw new Error(`GET /api/daily-plans failed: ${res.status}`)
      }
      const body = await res.json()
      return (body.plan ?? null) as DailyPlan | null
    },
    // The baseline for a given date rarely changes after first generation;
    // a slow poll lets the other device's first-write surface here.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}

/** PUT (upsert) the plan for a local date. First-generator-wins is enforced
 *  server-side by the (user, date) unique index; the caller decides when to
 *  PUT (fresh generation / "Generera om"). */
export function usePutDailyPlan() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (plan: DailyPlan): Promise<DailyPlan> => {
      const res = await api.api['daily-plans'][':date'].$put({
        param: { date: plan.date },
        // The client blob is a structured DailyPlan; the route accepts any
        // JSON object and stores it verbatim.
        json: { plan: plan as unknown as Record<string, unknown> },
      })
      if (!res.ok) {
        throw new Error(`PUT /api/daily-plans failed: ${res.status}`)
      }
      return plan
    },
    onSuccess: (plan) => {
      // Write-through so a subsequent GET for the same date sees our plan
      // without a round-trip.
      qc.setQueryData(dailyPlanKey(plan.date), plan)
    },
  })
}
