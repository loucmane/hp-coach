import { useActiveMistakes, useDueMistakes } from '@/api/hooks/useMistakes'
import { type MockHalf, useMockResults } from '@/api/hooks/useMockResults'
import { useSessionAttempts } from '@/api/hooks/useSessions'
import { useViewport } from '@/hooks/useViewport'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

/** Folio-only queries stay behind the lazy boundary. No dot is inferred from an aggregate. */
export function useFramstegExtras() {
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
