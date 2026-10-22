import { useQueries } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { TopTrap } from '@/api/hooks/useTopTraps'
import { useResumptionCandidate } from '@/components/home/useResumptionCandidate'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { useViewport } from '@/hooks/useViewport'
import { logMockEvent } from '@/lib/mockEvents'
import { useFirstContentSignal } from '@/lib/motion'
import type { DailyPlan, MockPrescription } from '@/lib/scheduler'
import { useDaysRemaining, useSitting } from '@/stores/examStore'

/** Read-only extras mounted only by the lazy Folio Home screen. */
export function useIdagExtras(traps: readonly TopTrap[]) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const refresh = () => setNow(new Date())
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  const resume = useResumptionCandidate(now)
  const viewport = useViewport()
  const sitting = useSitting(now)
  const daysLeft = useDaysRemaining(now)
  useFirstContentSignal()
  const sections = [...new Set(traps.map((t) => t.section))]
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
  return { now, resume, viewport, examDate: sitting.date, daysLeft, trapNames }
}

/** Same storage keys and UTC day semantics as HomeMobile and Kallelse. */
export function useIdagTelemetry(plan: DailyPlan | null, prescription?: MockPrescription | null) {
  const mockShown = !!plan?.items.some((i) => i.kind === 'mock' && !i.completed)
  useEffect(() => {
    if (!mockShown) return
    try {
      const day = new Date().toISOString().slice(0, 10)
      const key = 'hpc-kallelse-shown-date'
      if (localStorage.getItem(key) === day) return
      localStorage.setItem(key, day)
      logMockEvent('provpassdag_shown')
    } catch {
      /* Storage unavailable: skip rather than double-log. */
    }
  }, [mockShown])
  useEffect(() => {
    if (!prescription?.due || prescription.daysSinceLast == null) return
    const slidDays = prescription.daysSinceLast - prescription.interval
    if (slidDays <= 0) return
    try {
      const day = new Date().toISOString().slice(0, 10)
      const key = 'hpc-window-slid-shown-date'
      if (localStorage.getItem(key) === day) return
      localStorage.setItem(key, day)
      logMockEvent('window_slid', { slidDays })
    } catch {
      /* Same once-per-day policy as classic Home. */
    }
  }, [prescription])
}
