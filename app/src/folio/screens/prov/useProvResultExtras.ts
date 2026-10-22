import { useEffect, useMemo, useState } from 'react'
import type { MockResultRow } from '@/api/hooks/useMockResults'
import { useSessionAttempts } from '@/api/hooks/useSessions'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { sheetFromAttempts } from '@/lib/mockSheet'
import { loadNormeringTable, type NormeringSitting } from '@/lib/normering'
import { useTrapCluster } from '@/lib/trapCluster'

const NO_MISSES: string[] = []
export function useProvResultExtras(row: MockResultRow | undefined) {
  const attempts = useSessionAttempts(row?.sessionId ?? null)
  const { refetch } = attempts
  useEffect(() => {
    // A resumed run can leave a fresh but partial answer list in the shared
    // five-minute cache. Completed results need the final persisted picks.
    if (row?.sessionId != null) void refetch()
  }, [row?.sessionId, refetch])
  const answers = useMemo(() => sheetFromAttempts(attempts.data ?? []).answers, [attempts.data])
  const examId = row?.mode === 'authentic' ? row.examId : null
  const [loaded, setLoaded] = useState<{ examId: string; table: NormeringSitting | null } | null>(
    null,
  )
  useEffect(() => {
    if (!examId) return
    let live = true
    loadNormeringTable(examId).then((table) => {
      if (live) setLoaded({ examId, table })
    })
    return () => {
      live = false
    }
  }, [examId])
  const cluster = useTrapCluster(row?.breakdown.missedQids ?? NO_MISSES)
  const [name, setName] = useState<{ id: string; value: string } | null>(null)
  useEffect(() => {
    if (!cluster) return
    let live = true
    loadFramework(cluster.section)
      .then((framework) => {
        const entry = framework?.entries.find((e) => e.id === cluster.framework_id)
        const value = entry && framework ? entryHeadword(entry, framework) : null
        if (live && entry && value) setName({ id: entry.id, value })
      })
      .catch(() => {
        /* The cluster headline remains available. */
      })
    return () => {
      live = false
    }
  }, [cluster])
  return {
    answers,
    attemptsLoading: attempts.isLoading || attempts.isFetching,
    attemptsError: attempts.isError,
    table: loaded?.examId === examId ? loaded?.table : null,
    cluster,
    frameworkName: name?.id === cluster?.framework_id ? name?.value : null,
  }
}
