// Session lifecycle hooks — cross-device continuity.
//
// The server holds the source of truth: ≤1 active session per kind, each
// carrying its ordered `plan` + `device` provenance. `useActiveSessions`
// reads the whole active set (bucketed by kind by consumers); the Home
// resumption panel and SessionPlayer's adopt-on-resume both read it.
//
// Freshness across devices: refetch-on-focus (default) means picking up
// device B and focusing the tab pulls the latest immediately; the 30s
// background interval covers an already-open idle tab. Same-device feels
// instant because the start/update mutations write through to the cache.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { DeviceKind } from '../../lib/device'
import { useApiClient } from '../useApiClient'
import { STATS_KEY } from './useStats'

const ACTIVE_SESSIONS_KEY = ['sessions', 'active'] as const
const SESSION_HISTORY_KEY = ['sessions', 'history'] as const

export type SessionKind = 'drill' | 'mock' | 'mock_diagnostic' | 'lesson' | 'adaptive_review'

/** One completed pass in the drill-history list. */
export type SessionHistoryRow = {
  id: number
  kind: SessionKind
  sections: string | null
  endedAt: string | null
  total: number
  correct: number
}

/**
 * Completed passes, newest first (≤50), each with its total/correct tally.
 * Powers the /historik journal; each row permalinks to `?done=<id>` to
 * reopen that pass's Klart. Refetch-on-focus keeps it fresh after a drill.
 */
export function useSessionHistory() {
  const api = useApiClient()
  return useQuery({
    queryKey: SESSION_HISTORY_KEY,
    queryFn: async (): Promise<SessionHistoryRow[]> => {
      const res = await api.api.sessions.history.$get()
      if (!res.ok) {
        throw new Error(`GET /api/sessions/history failed: ${res.status}`)
      }
      const body = await res.json()
      return body.sessions as SessionHistoryRow[]
    },
  })
}

// Explicit row shape for cache manipulation. Mirrors the worker `sessions`
// row, but with timestamps typed as the strings they serialize to over
// the wire (the AppType inference says Date; JSON makes them strings).
export type ActiveSession = {
  id: number
  userId: number
  kind: SessionKind
  sections: string | null
  position: number
  currentQuestionId: string | null
  plan: string[] | null
  device: DeviceKind | null
  startedAt: string | null
  endedAt: string | null
}

export type SessionStartInput = {
  kind: SessionKind
  sections?: string
  /** Ordered qids — persisted so a resume on another device is exact. */
  plan?: string[]
  device?: DeviceKind
}

export type SessionUpdatePatch = {
  position?: number
  currentQuestionId?: string | null
  device?: DeviceKind
  end?: true
}

/**
 * All in-flight sessions for the user (≤1 per kind). The base query every
 * other session hook derives from.
 */
export function useActiveSessions() {
  const api = useApiClient()
  return useQuery({
    queryKey: ACTIVE_SESSIONS_KEY,
    queryFn: async () => {
      const res = await api.api.sessions.active.$get()
      if (!res.ok) {
        throw new Error(`GET /api/sessions/active failed: ${res.status}`)
      }
      const body = await res.json()
      return (body.sessions ?? []) as ActiveSession[]
    },
    refetchInterval: 180_000,
    refetchIntervalInBackground: false,
  })
}

/**
 * Backward-compatible single-session view: the freshest active session of
 * any kind. Existing consumers (the /dev debug panel, drill's direct-link
 * guard) keep their `.data` / `.isPending` interface unchanged.
 */
export function useActiveSession() {
  const q = useActiveSessions()
  return { ...q, data: q.data?.[0] ?? null }
}

/** The active session of a specific kind, or null. Drives adopt-on-resume. */
export function useActiveSessionOfKind(kind: SessionKind) {
  const q = useActiveSessions()
  return { ...q, data: q.data?.find((s) => s.kind === kind) ?? null }
}

export function useStartSession() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SessionStartInput) => {
      const res = await api.api.sessions.$post({ json: input })
      if (!res.ok) {
        throw new Error(`POST /api/sessions failed: ${res.status}`)
      }
      const body = await res.json()
      return body.session as ActiveSession
    },
    onSuccess: (session) => {
      // The server ended any prior active session of this kind, so drop
      // those from the cache and prepend the new one (freshest first).
      qc.setQueryData<ActiveSession[]>(ACTIVE_SESSIONS_KEY, (old) => [
        session,
        ...(old ?? []).filter((s) => s.kind !== session.kind),
      ])
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
      return body.session as ActiveSession
    },
    onSuccess: (session, vars) => {
      qc.setQueryData<ActiveSession[]>(ACTIVE_SESSIONS_KEY, (old) => {
        const arr = old ?? []
        // Ended → drop it from the active set; otherwise replace in place.
        if (vars.patch.end) return arr.filter((s) => s.id !== vars.id)
        return arr.map((s) => (s.id === session.id ? session : s))
      })
      // On session END, refresh the aggregate stats so the daily-plan card's
      // drill/mastery completion flips immediately instead of waiting for the
      // 60s stats poll. Only on end — invalidating per mid-session patch (qid
      // sync) would refetch ~10x per session. attempts.total / attempts7d are
      // what the plan's completion derives from.
      if (vars.patch.end) {
        qc.invalidateQueries({ queryKey: STATS_KEY })
      }
    },
  })
}

/**
 * The answered questions for a session, oldest first. Used to hydrate the
 * local picks[] when a paused drill is adopted on resume, so the "Klart."
 * summary reflects the true total rather than only post-resume answers.
 * Enabled only when an id is provided.
 */
export function useSessionAttempts(sessionId: number | null) {
  const api = useApiClient()
  return useQuery({
    queryKey: ['sessions', 'attempts', sessionId] as const,
    enabled: sessionId !== null,
    queryFn: async () => {
      const res = await api.api.sessions[':id'].attempts.$get({
        param: { id: String(sessionId) },
      })
      if (!res.ok) {
        throw new Error(`GET /api/sessions/${sessionId}/attempts failed: ${res.status}`)
      }
      const body = await res.json()
      return body.attempts as Array<{
        questionId: string
        selectedAnswer: string | null
        correct: boolean | null
        timeTakenMs: number | null
        createdAt: number | string | null
      }>
    },
  })
}
