// POST /api/attempts — record one answered question.
//
// Drill / mock / lesson all share this hook. The mutation is fire-and-
// forget from the user's POV: the SPA grades locally (it knows the
// answer key from the bundled bank) and the network write happens
// alongside. If the write fails we surface a toast but don't block the
// user from advancing — losing one row of telemetry is acceptable; a
// frozen drill is not.

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'
import { STATS_KEY } from './useStats'

export type AttemptInput = {
  sessionId: number
  questionId: string
  selectedAnswer: string
  correct: boolean
  timeTakenMs?: number
}

export function useSubmitAttempt() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AttemptInput) => {
      const res = await api.api.attempts.$post({ json: input })
      if (!res.ok) {
        throw new Error(`POST /api/attempts failed: ${res.status}`)
      }
      const body = await res.json()
      return body.attempt
    },
    // Invalidate the stats query so Home's daily-plan completion (derived from
    // `attempts.total` / per-section `attempts7d` in `useStats`) updates
    // promptly. Without this, `useStats` only refetches on focus + every 60s,
    // so a finished drill can read as incomplete for up to a minute — which
    // reads as broken and masks whether SF1 completion even works.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STATS_KEY })
    },
  })
}
