import { useQueries } from '@tanstack/react-query'
import { useDueMistakes } from '@/api/hooks/useMistakes'
import { useSessionHistory } from '@/api/hooks/useSessions'
import { useTopTraps } from '@/api/hooks/useTopTraps'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { useViewport } from '@/hooks/useViewport'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

/** Keep Folio-only queries behind the lazy route boundary. */
export function useFramstegExtras() {
  const topTraps = useTopTraps()
  const history = useSessionHistory()
  const due = useDueMistakes()
  const viewport = useViewport()
  const days = useDaysRemaining()
  const sitting = useSitting()
  const sections = [...new Set(topTraps.map((t) => t.section))]
  const frameworks = useQueries({
    queries: sections.map((section) => ({
      queryKey: ['folio-lesson', section],
      queryFn: () => loadFramework(section),
      staleTime: Infinity,
    })),
  })
  const trapNames: Record<string, string> = {}
  for (const result of frameworks) {
    const framework = result.data
    if (framework)
      for (const entry of framework.entries) {
        const name = entryHeadword(entry, framework)
        if (name) trapNames[entry.id] = name
      }
  }
  return { topTraps, trapNames, history, due, viewport, days, sitting }
}
