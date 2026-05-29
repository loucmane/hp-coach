// Lesson reading bookmark — cross-device "fortsätt läsa".
//
// A lesson isn't a session (read-only, no attempts, no end), so its
// resume state is a per-section bookmark on the server. The reader PUTs
// the open entry as the user browses; the Home resumption panel reads
// the freshest bookmark alongside the active sessions.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { DeviceKind } from '../../lib/device'
import { useApiClient } from '../useApiClient'

const LESSON_PROGRESS_KEY = ['lesson-progress'] as const

export type LessonProgress = {
  id: number
  userId: number
  section: string
  frameworkId: string | null
  device: DeviceKind | null
  updatedAt: string | null
}

export function useLessonProgress() {
  const api = useApiClient()
  return useQuery({
    queryKey: LESSON_PROGRESS_KEY,
    queryFn: async () => {
      const res = await api.api['lesson-progress'].$get()
      if (!res.ok) {
        throw new Error(`GET /api/lesson-progress failed: ${res.status}`)
      }
      const body = await res.json()
      return (body.progress ?? null) as LessonProgress | null
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function usePutLessonProgress() {
  const api = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      section: string
      frameworkId?: string | null
      device?: DeviceKind
    }) => {
      const res = await api.api['lesson-progress'].$put({ json: input })
      if (!res.ok) {
        throw new Error(`PUT /api/lesson-progress failed: ${res.status}`)
      }
      const body = await res.json()
      return body.progress as LessonProgress
    },
    onSuccess: (progress) => {
      // Write-through so the Home panel reflects the new bookmark on this
      // device immediately; other devices converge on focus / 30s.
      qc.setQueryData(LESSON_PROGRESS_KEY, progress)
    },
  })
}
