import { useQuery } from '@tanstack/react-query'

import type { FrameworkProgressRow } from '@/lib/frameworkProgress'

import { useApiClient } from '../useApiClient'

export const FRAMEWORK_PROGRESS_KEY = ['framework-progress'] as const

/** Read the current user's progress; errors remain query errors, not no data. */
export function useFrameworkProgress() {
  const api = useApiClient()
  return useQuery({
    queryKey: FRAMEWORK_PROGRESS_KEY,
    queryFn: async (): Promise<FrameworkProgressRow[]> => {
      const res = await api.api['framework-progress'].$get()
      if (!res.ok) {
        throw new Error(`GET /api/framework-progress failed: ${res.status}`)
      }
      const body = await res.json()
      return body.progress
    },
    // Match sibling progress reads: shared cache defaults, focus refresh,
    // and foreground polling for changes made on another device.
    refetchInterval: 300_000,
    refetchIntervalInBackground: false,
  })
}
