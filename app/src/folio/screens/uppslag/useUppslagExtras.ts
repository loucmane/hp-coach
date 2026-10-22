import { useQueries } from '@tanstack/react-query'
import { useLocation } from '@tanstack/react-router'
import { useLessonProgress, usePutLessonProgress } from '@/api/hooks/useLessonProgress'
import { useDueMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { useTopTraps } from '@/api/hooks/useTopTraps'
import { loadFramework } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { useLessonReads } from '@/hooks/useLessonReads'
import { useViewport } from '@/hooks/useViewport'
import type { CatalogState } from './uppslagView'

/** Everything that can fetch or observe the router lives behind the lazy branch. */
export function useUppslagExtras() {
  const hash = useLocation({ select: (location) => location.hash })
  const viewport = useViewport()
  const reads = useLessonReads()
  const bookmark = useLessonProgress()
  const putProgress = usePutLessonProgress()
  const stats = useStats()
  const due = useDueMistakes()
  const traps = useTopTraps({ limit: Number.MAX_SAFE_INTEGER })
  const queries = useQueries({
    queries: SECTION_KEYS.map((section) => ({
      queryKey: ['folio-lesson', section],
      queryFn: () => loadFramework(section),
      staleTime: Infinity,
    })),
  })
  const catalogs: Partial<Record<Section, CatalogState>> = {}
  queries.forEach((query, i) => {
    catalogs[SECTION_KEYS[i]] = query
  })
  return {
    hash,
    viewport,
    ...reads,
    bookmark,
    putProgress: putProgress.mutate,
    catalogs,
    bySection: stats.data?.bySection,
    dueCount: due.data?.length,
    trapSections: traps.map((t) => t.section),
  }
}
