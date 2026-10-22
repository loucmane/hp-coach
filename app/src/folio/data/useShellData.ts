import { useUser } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { useDailyPlanQuery } from '@/api/hooks/useDailyPlanApi'
import { useLessonProgress } from '@/api/hooks/useLessonProgress'
import { useLessonReadsQuery } from '@/api/hooks/useLessonReadsApi'
import { useDueMistakes, usePileMistakes } from '@/api/hooks/useMistakes'
import { useMockResults } from '@/api/hooks/useMockResults'
import { useStats } from '@/api/hooks/useStats'
import { useResumptionCandidate } from '@/components/home/useResumptionCandidate'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { deriveCompletion } from '@/hooks/useDailyPlan'
import {
  loadLessonReads,
  localDateString,
  PLAN_SCHEMA_VERSION,
  prescribeMock,
} from '@/lib/scheduler'
import { computeProjected, computeSectionScore, honestSectionScores } from '@/lib/scoring'
import { useDaysRemaining } from '@/stores/examStore'
import { useUiStore } from '@/stores/uiStore'
import type { ShellData } from '../contract/viewModel'
import { shellSubtitles } from './mappers'

/** Read-only queries: mounting navigation must never generate or PUT a plan. */
export function useFolioShellData(): ShellData {
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
  const plan = useDailyPlanQuery(localDateString(now))
  const due = useDueMistakes()
  const pile = usePileMistakes()
  const stats = useStats()
  const mocks = useMockResults()
  const lesson = useLessonProgress()
  const reads = useLessonReadsQuery()
  const candidate = useResumptionCandidate(now)
  const daysToExam = useDaysRemaining()
  const { user } = useUser()
  const palette = useUiStore((s) => s.palette)
  const mode = useUiStore((s) => s.mode)
  const section = lesson.data?.section.toUpperCase()
  const framework = useQuery({
    queryKey: ['folio-lesson', section],
    enabled: !!section && SECTION_KEYS.includes(section as Section),
    queryFn: () => loadFramework(section as Section),
    staleTime: Infinity,
  })
  const entry = framework.data?.entries.find((item) => item.id === lesson.data?.frameworkId)
  const title = entry && framework.data ? entryHeadword(entry, framework.data) : null
  const scores = stats.data
    ? SECTION_KEYS.map((s) => computeSectionScore(s, stats.data.bySection[s], now))
    : []
  const ready = due.data?.length ?? 0
  const baseline = plan.data?.version === PLAN_SCHEMA_VERSION ? plan.data : null
  const livePlan =
    baseline && due.data && stats.data
      ? deriveCompletion(
          baseline,
          ready,
          new Set([...loadLessonReads(), ...(reads.data ?? [])]),
          stats.data.bySection,
          stats.data.attempts.total,
          mocks.data ?? [],
        )
      : baseline
  const repetition = livePlan?.items.find((item) => item.kind === 'repetition')
  // Scheduler headlines specify the actual round size (e.g. "10 av 20 missar").
  const plannedCount = repetition
    ? Number.parseInt(repetition.headline.match(/\d+/)?.[0] ?? '', 10)
    : NaN
  return {
    subtitles: shellSubtitles({
      plan:
        livePlan?.items.map((item) => ({ title: item.headline, completed: item.completed })) ??
        null,
      resume:
        candidate && !candidate.stale
          ? {
              subject: candidate.subject.replace(/-övning$/, ''),
              progress: candidate.progress.replace(/^vid /, ''),
            }
          : null,
      dueNow: ready,
      dueToday: pile.data?.length ?? 0,
      repetition: repetition
        ? {
            count: Number.isFinite(plannedCount) ? plannedCount : 0,
            minutes: repetition.estimatedMinutes,
          }
        : undefined,
      provpass:
        stats.data && mocks.data
          ? prescribeMock({
              now,
              sectionScores: scores,
              dueMistakeCount: ready,
              mockHistory: mocks.data,
              daysToExam,
            })
          : null,
      lesson: title && section ? { section, title } : null,
      prognosis: stats.data
        ? computeProjected(honestSectionScores(stats.data.bySection, now)).total
        : null,
    }),
    dueCount: ready,
    identity: { name: user?.fullName || user?.firstName || 'Ditt konto' },
    prefs: { palette, mode },
  }
}
