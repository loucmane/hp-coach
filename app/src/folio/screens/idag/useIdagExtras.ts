import { useAuth } from '@clerk/clerk-react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { TopTrap } from '@/api/hooks/useTopTraps'
import { useUserPrefs } from '@/api/hooks/useUserPrefs'
import { lessonPlace, useResumptionCandidate } from '@/components/home/useResumptionCandidate'
import { loadExplanation } from '@/data/explanations'
import { type Framework, loadFramework } from '@/data/frameworks'
import { SECTION_KEYS } from '@/data/questions'
import { useViewport } from '@/hooks/useViewport'
import { countsBySection } from '@/lib/dueBySection'
import { logMockEvent } from '@/lib/mockEvents'
import { useFirstContentSignal } from '@/lib/motion'
import { frameworkSignal } from '@/lib/provenance'
import type { DailyPlan, MockPrescription } from '@/lib/scheduler'
import { useDaysRemaining, useSitting } from '@/stores/examStore'
import type { QueueItem } from './idagView'

/** Read-only extras mounted only by the lazy Folio Home screen. */
export function useIdagExtras(
  traps: readonly TopTrap[],
  plan: DailyPlan | null,
  due: readonly QueueItem[] = [],
) {
  const { userId } = useAuth()
  const prefs = useUserPrefs()
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
  const dueSections = countsBySection(due)
  const sections = SECTION_KEYS.filter(
    (s) =>
      traps.some((t) => t.section === s) ||
      plan?.items.some((i) => i.section === s) ||
      resume?.subject.startsWith(s) ||
      dueSections[s] > 0,
  )
  const frameworks = useQueries({
    queries: sections.map((section) => ({
      queryKey: ['folio-lesson', section],
      queryFn: () => loadFramework(section),
      staleTime: Infinity,
    })),
  })
  const qids = [...new Set(due.map((m) => m.questionId))].sort()
  const missFrameworks = useQuery({
    queryKey: ['folio-idag-miss-families', userId, qids],
    enabled: !!userId && qids.length > 0,
    queryFn: async () =>
      Object.fromEntries(
        await Promise.all(
          qids.map(async (qid) => {
            const explanation = await loadExplanation(qid)
            return [qid, frameworkSignal(qid, explanation?.framework_id)] as const
          }),
        ),
      ),
    staleTime: Infinity,
  })
  return {
    now,
    resume,
    viewport,
    examDate: sitting.date,
    daysLeft,
    // These catalogs feed pre-answer titles; preserve the cached source for facit.
    frameworks: frameworks
      .map((r) => r.data)
      .filter((f): f is Framework => !!f)
      .map(
        (f) =>
          ({
            ...f,
            entries: f.entries.map((entry) => ({
              ...entry,
              question_title: lessonPlace(entry, f) ?? undefined,
            })),
            // Mapping only the optional title preserves the catalog/entry pairing.
          }) as Framework,
      ),
    missFrameworks: missFrameworks.data,
    dailyMinutes: prefs.data?.dailyMinutes ?? undefined,
  }
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
