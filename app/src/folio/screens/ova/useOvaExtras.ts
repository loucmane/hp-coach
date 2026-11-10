import { useQueries } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useLessonProgress } from '@/api/hooks/useLessonProgress'
import { useLessonReadsQuery } from '@/api/hooks/useLessonReadsApi'
import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import { lessonPlace } from '@/components/home/useResumptionCandidate'
import { type Framework, loadFramework } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { useDailyPlan } from '@/hooks/useDailyPlan'
import { useLessonReads } from '@/hooks/useLessonReads'
import { useViewport } from '@/hooks/useViewport'
import { useFirstContentSignal } from '@/lib/motion'
import { useUiStore } from '@/stores/uiStore'

/** All new data stays behind the existing lazy Folio boundary. */
export function useOvaExtras() {
  const daily = useDailyPlan()
  const lesson = useLessonProgress()
  const serverReads = useLessonReadsQuery()
  const { reads } = useLessonReads()
  const viewport = useViewport()
  const smartDrill = useUiStore((s) => s.smartDrill)
  const synced = useSyncedPrefs()
  const [saving, setSaving] = useState(false)
  const [preferenceError, setPreferenceError] = useState(false)
  const saveLock = useRef(false)
  useFirstContentSignal()
  const sections = [
    ...new Set([lesson.data?.section, ...(daily.plan?.items.map((i) => i.section) ?? [])]),
  ].filter((section): section is Section => SECTION_KEYS.includes(section as Section))
  const queries = useQueries({
    queries: sections.map((section) => ({
      queryKey: ['folio-lesson', section],
      queryFn: () => loadFramework(section),
      staleTime: Infinity,
    })),
  })
  const catalogs: Partial<Record<Section, Framework>> = {}
  for (const [i, result] of queries.entries()) {
    const catalog = result.data
    if (!catalog) continue
    // Presentation copy only: never mutate the shared catalog used after answering.
    catalogs[sections[i]] = {
      ...catalog,
      entries: catalog.entries.map((entry) => ({
        ...entry,
        question_title: lessonPlace(entry, catalog) ?? undefined,
      })),
    } as Framework // Only the optional title changes; catalog/entry pairing is preserved.
  }
  async function setSmartDrill(value: boolean) {
    if (saveLock.current) return
    saveLock.current = true
    setSaving(true)
    setPreferenceError(false)
    try {
      await synced.setSmartDrill(value)
    } catch {
      setPreferenceError(true)
    } finally {
      saveLock.current = false
      setSaving(false)
    }
  }
  return {
    viewport,
    smartDrill,
    setSmartDrill,
    saving,
    preferenceError,
    catalogs,
    lesson,
    plan: {
      data: (daily.isLoading || daily.isError) && !daily.plan ? undefined : daily.plan,
      isPending: daily.isLoading,
      isError: daily.isError,
    },
    reads: {
      data: serverReads.data === undefined && reads.size === 0 ? undefined : reads,
      isPending: serverReads.isPending && reads.size === 0,
      isError: serverReads.isError,
    },
  }
}
