import { useQueries, useQuery } from '@tanstack/react-query'
import { useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { type LessonProgress, usePutLessonProgress } from '@/api/hooks/useLessonProgress'
import { useLessonReadsQuery } from '@/api/hooks/useLessonReadsApi'
import { useDueMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { useTopTraps } from '@/api/hooks/useTopTraps'
import { useApiClient } from '@/api/useApiClient'
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
  // Observe the same cached request; useLessonReads folds its result into the
  // local read set in an effect. Release entry selection on the following render
  // so it sees that union, including when the server data was already cached.
  const serverReads = useLessonReadsQuery()
  const [readsReady, setReadsReady] = useState(false)
  useEffect(() => {
    if (!serverReads.isPending) setReadsReady(true)
  }, [serverReads.isPending])
  const api = useApiClient()
  // Share the bookmark cache and write-through mutation with the classic reader,
  // but fall back immediately on a failed GET in this screen.
  const bookmark = useQuery({
    queryKey: ['lesson-progress'],
    queryFn: async () => {
      const res = await api.api['lesson-progress'].$get()
      if (!res.ok) throw new Error(`GET /api/lesson-progress failed: ${res.status}`)
      const body = await res.json()
      return (body.progress ?? null) as LessonProgress | null
    },
    retry: false,
    refetchInterval: 180_000,
    refetchIntervalInBackground: false,
  })
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
    readsReady,
    bookmark,
    putProgress: putProgress.mutate,
    catalogs,
    bySection: stats.data?.bySection,
    dueCount: due.data?.length,
    trapSections: traps.map((t) => t.section),
  }
}
