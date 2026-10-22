import { useQueries } from '@tanstack/react-query'
import { useTopTraps } from '@/api/hooks/useTopTraps'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { useViewport } from '@/hooks/useViewport'
import { useFirstContentSignal } from '@/lib/motion'
import { useUiStore } from '@/stores/uiStore'

/** Mounted only inside the lazy Folio screen; framework data shares Idag's cache. */
export function useOvaExtras() {
  const topTraps = useTopTraps()
  const viewport = useViewport()
  const smartDrill = useUiStore((s) => s.smartDrill)
  useFirstContentSignal()
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
  return { topTraps, trapNames, viewport, smartDrill }
}
