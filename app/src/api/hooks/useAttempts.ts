// POST /api/attempts — record one answered question.
//
// Drill / mock / lesson all share this hook. The mutation is fire-and-
// forget from the user's POV: the SPA grades locally (it knows the
// answer key from the bundled bank) and the network write happens
// alongside. If the write fails we surface a toast but don't block the
// user from advancing — losing one row of telemetry is acceptable; a
// frozen drill is not.

import { useMutation } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'

export type AttemptInput = {
  sessionId: number
  questionId: string
  selectedAnswer: string
  correct: boolean
  timeTakenMs?: number
}

export function useSubmitAttempt() {
  const api = useApiClient()
  return useMutation({
    mutationFn: async (input: AttemptInput) => {
      const res = await api.api.attempts.$post({ json: input })
      if (!res.ok) {
        throw new Error(`POST /api/attempts failed: ${res.status}`)
      }
      const body = await res.json()
      return body.attempt
    },
  })
}
