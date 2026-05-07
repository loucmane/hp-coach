// Session lifecycle hooks for mid-exercise device-swap continuity.
//
// useActiveSession: live-ish read of the user's in-progress session.
// Refetches on window focus + every 30s while focused, so a phone-to-laptop
// swap reflects within ~30 seconds without polling cost during idle.
//
// useStartSession / useUpdateSession / useEndSession: typed mutations
// that invalidate the active-session query so UI re-renders immediately.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'

const ACTIVE_SESSION_KEY = ['sessions', 'active'] as const

export type SessionKind = 'drill' | 'mock' | 'mock_diagnostic' | 'lesson' | 'adaptive_review'

export type SessionUpdatePatch = {
  position?: number
  currentQuestionId?: string | null
  end?: true
}

export function useActiveSession() {
  const api = useApiClient()
  return useQuery({
    queryKey: ACTIVE_SESSION_KEY,
    queryFn: async () => {
      const res = await api.api.sessions.active.$get()
      if (!res.ok) {
        throw new Error(`GET /api/sessions/active failed: ${res.status}`)
      }
      const body = await res.json()
      return body.session
    },
    // 30s background refetch while the tab is focused — that's the
    // "swap devices and see fresh state" window. Idle tabs don't poll.
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function useStartSession() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { kind: SessionKind; sections?: string }) => {
      const res = await api.api.sessions.$post({ json: input })
      if (!res.ok) {
        throw new Error(`POST /api/sessions failed: ${res.status}`)
      }
      const body = await res.json()
      return body.session
    },
    onSuccess: (session) => {
      // Seed cache so UI flips to the new active session immediately.
      qc.setQueryData(ACTIVE_SESSION_KEY, session)
    },
  })
}

export function useUpdateSession() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: SessionUpdatePatch }) => {
      const res = await api.api.sessions[':id'].$patch({
        param: { id: String(id) },
        json: patch,
      })
      if (!res.ok) {
        throw new Error(`PATCH /api/sessions/${id} failed: ${res.status}`)
      }
      const body = await res.json()
      return body.session
    },
    onSuccess: (session, vars) => {
      // If the mutation ended the session, the active-session query goes
      // back to null. Otherwise it's the updated row.
      if (vars.patch.end) {
        qc.setQueryData(ACTIVE_SESSION_KEY, null)
      } else {
        qc.setQueryData(ACTIVE_SESSION_KEY, session)
      }
    },
  })
}
