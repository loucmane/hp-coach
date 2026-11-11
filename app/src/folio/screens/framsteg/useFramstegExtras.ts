import { useQuery } from '@tanstack/react-query'
import { useActiveMistakes, useDueMistakes } from '@/api/hooks/useMistakes'
import { type MockHalf, useMockResults } from '@/api/hooks/useMockResults'
import { useSessionAttempts } from '@/api/hooks/useSessions'
import { useApiClient } from '@/api/useApiClient'
import { useViewport } from '@/hooks/useViewport'
import { useDaysRemaining, useSitting } from '@/stores/examStore'
import type { PrognosisWeek } from './framstegView'

/** Folio-only queries stay behind the lazy boundary. No dot is inferred from an aggregate. */
export function useFramstegExtras() {
  const api = useApiClient()
  const weekly = useQuery({
    queryKey: ['me', 'insights', 'prognosis-weekly', 12],
    queryFn: async (): Promise<PrognosisWeek[]> => {
      const res = await api.api.me.insights['prognosis-weekly'].$get({ query: { weeks: '12' } })
      if (!res.ok) throw new Error(`GET /api/me/insights/prognosis-weekly failed: ${res.status}`)
      return (await res.json()).weeks
    },
    refetchInterval: 300_000,
    refetchIntervalInBackground: false,
  })
  const results = useMockResults()
  const recent = (half: MockHalf) =>
    results.data?.find(
      (row) =>
        row.half === half &&
        row.createdAt != null &&
        new Date(row.createdAt).getTime() >= Date.now() - 90 * 86400000,
    )?.sessionId ?? null
  const verbalId = recent('verbal')
  const quantId = recent('kvant')
  const verbal = useSessionAttempts(verbalId)
  const quant = useSessionAttempts(quantId)
  const active = useActiveMistakes()
  const due = useDueMistakes()
  const viewport = useViewport()
  const days = useDaysRemaining()
  const sitting = useSitting()
  return {
    weekly,
    active,
    due,
    viewport,
    days,
    sitting,
    sample: {
      data: [
        ...(verbalId != null ? (verbal.data ?? []) : []),
        ...(quantId != null ? (quant.data ?? []) : []),
      ],
    },
  }
}
