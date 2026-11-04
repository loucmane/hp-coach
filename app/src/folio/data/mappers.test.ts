import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { LessonProgress } from '@/api/hooks/useLessonProgress'
import type { ActiveSession } from '@/api/hooks/useSessions'
import type { Stats } from '@/api/hooks/useStats'
import type { Framework } from '@/data/frameworks'
import type { DailyPlan } from '@/lib/scheduler'

const live = vi.hoisted(() => ({
  plan: null as DailyPlan | null,
  stats: undefined as Stats | undefined,
  due: [] as { id: number }[],
  pile: [] as { id: number }[],
  framework: null as Framework | null,
  lesson: null as LessonProgress | null,
  sessions: [] as ActiveSession[],
  put: vi.fn(),
  get: vi.fn(),
}))
vi.mock('@clerk/clerk-react', () => ({ useUser: () => ({ user: { fullName: 'Ada' } }) }))
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: live.framework }) }))
vi.mock('@/api/hooks/useDailyPlanApi', () => ({
  useDailyPlanQuery: (date: string) => {
    live.get(date)
    return { data: live.plan }
  },
  usePutDailyPlan: () => {
    live.put()
    throw new Error('Shell cannot write plans')
  },
}))
vi.mock('@/api/hooks/useStats', () => ({ useStats: () => ({ data: live.stats }) }))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: live.due }),
  usePileMistakes: () => ({ data: live.pile }),
}))
vi.mock('@/api/hooks/useMockResults', () => ({ useMockResults: () => ({ data: [] }) }))
vi.mock('@/api/hooks/useLessonProgress', () => ({
  useLessonProgress: () => ({ data: live.lesson }),
}))
vi.mock('@/api/hooks/useLessonReadsApi', () => ({ useLessonReadsQuery: () => ({ data: [] }) }))
vi.mock('@/api/hooks/useSessions', () => ({ useActiveSessions: () => ({ data: live.sessions }) }))

import { SECTION_KEYS } from '@/data/questions'
import { localDateString, PLAN_SCHEMA_VERSION } from '@/lib/scheduler'
import type { ShellInput } from '../contract/viewModel'
import { shellSubtitles } from './mappers'
import { useFolioShellData } from './useShellData'

const empty: ShellInput = {
  plan: null,
  resume: null,
  dueNow: 0,
  dueToday: 0,
  provpass: null,
  lesson: null,
  prognosis: null,
}

describe('shellSubtitles', () => {
  it('uses neutral fallbacks for missing data', () => {
    expect(shellSubtitles(empty)).toEqual({
      idag: 'Dagens plan',
      ova: 'Alla delprov',
      repetera: 'Frågor som kommer tillbaka',
      provpass: 'Ett helt pass, 55 minuter',
      uppslag: 'Lektioner och ramverk',
      framsteg: 'Prognos och historik',
      historik: 'Dina pass och svar',
    })
  })
  it('prioritises a resumable session over the plan', () => {
    expect(
      shellSubtitles({ ...empty, resume: { subject: 'LÄS', progress: 'fråga 3 av 10' } }).idag,
    ).toBe('Fortsätt LÄS, fråga 3 av 10')
  })
  it.each([
    ['pågående lektion', 'Fortsätt NOG-lektion'],
    ['Två påståenden', 'Fortsätt NOG-lektion, Två påståenden'],
  ])('only includes specific lesson progress in the subtitle: %s', (progress, expected) => {
    expect(shellSubtitles({ ...empty, resume: { subject: 'NOG-lektion', progress } }).idag).toBe(
      expected,
    )
  })
  it('names the first item and counts completed steps', () => {
    const plan = [
      { title: 'Läs tabellen', completed: false },
      { title: 'Öva KVA', completed: false },
    ]
    expect(shellSubtitles({ ...empty, plan }).idag).toBe('Först: Läs tabellen')
    expect(
      shellSubtitles({ ...empty, plan: [{ ...plan[0], completed: true }, plan[1]] }).idag,
    ).toBe('1 av 2 steg klara')
    expect(
      shellSubtitles({ ...empty, plan: plan.map((item) => ({ ...item, completed: true })) }).idag,
    ).toBe('Allt i dagens plan är gjort')
    expect(shellSubtitles({ ...empty, plan: [] }).idag).toBe('Dagens plan')
  })
  it('distinguishes ready questions from the later pile and scales the estimate', () => {
    expect(shellSubtitles({ ...empty, dueToday: 8 }).repetera).toBe('Kommer tillbaka senare')
    expect(
      shellSubtitles({ ...empty, dueNow: 8, dueToday: 10, repetition: { count: 10, minutes: 11 } })
        .repetera,
    ).toBe('8 redo · ca 9 min')
    expect(shellSubtitles({ ...empty, dueNow: 3 }).repetera).toBe('3 redo')
    expect(
      shellSubtitles({ ...empty, dueNow: 3, repetition: { count: 0, minutes: 9 } }).repetera,
    ).toBe('3 redo')
  })
  it('uses session progress for practice and history without presenting a lesson as practice', () => {
    const resume = { subject: 'KVA', progress: 'fråga 1 av 10', href: '/drill?section=KVA' }
    const lines = shellSubtitles({ ...empty, resume, practicePasses: 12 })
    expect(lines.ova).toBe('Fortsätt KVA, fråga 1 av 10')
    expect(lines.historik).toBe('Pågår: KVA · fråga 1 av 10')
    expect(shellSubtitles({ ...empty, resume: { ...resume, href: '/lektion' } }).ova).toBe(
      'Alla delprov',
    )
    expect(shellSubtitles({ ...empty, practicePasses: 12 }).historik).toBe('12 övningspass')
    expect(shellSubtitles({ ...empty, practicePasses: 0 }).historik).toBe('0 övningspass')
  })
  it('reports due and upcoming mock halves', () => {
    expect(
      shellSubtitles({ ...empty, provpass: { half: 'kvant', due: true, daysUntilNext: 0 } })
        .provpass,
    ).toBe('Dags för ett pass: kvant')
    expect(
      shellSubtitles({ ...empty, provpass: { half: 'verbal', due: false, daysUntilNext: 1 } })
        .provpass,
    ).toBe('Nästa: verbal, om en dag')
    expect(
      shellSubtitles({ ...empty, provpass: { half: 'kvant', due: false, daysUntilNext: 3 } })
        .provpass,
    ).toBe('Nästa: kvant, om tre dagar')
  })
  it('shows the lesson and Swedish prognosis without inventing a missing score', () => {
    const lines = shellSubtitles({
      ...empty,
      lesson: { section: 'NOG', title: 'Två påståenden' },
      prognosis: 1.4,
    })
    expect(lines.uppslag).toBe('NOG · Två påståenden')
    expect(lines.framsteg).toBe('Prognos 1,4 av 2,0')
    expect(shellSubtitles({ ...empty, prognosis: 0 }).framsteg).toBe('Prognos 0,0 av 2,0')
  })
})

describe('read-only shell adapters', () => {
  beforeEach(() => {
    localStorage.clear()
    live.get.mockClear()
    live.put.mockClear()
    live.plan = null
    live.stats = undefined
    live.due = []
    live.pile = []
    live.framework = null
    live.lesson = null
    live.sessions = []
  })

  function stats(): Stats {
    return {
      attempts: { total: 80, today: 0, thisWeek: 80 },
      drills: { total: 8, thisWeek: 8 },
      mistakes: { active: 12, due: 8, resolved: 0 },
      accuracy7d: 0.7,
      streakDays: 0,
      weekly: [],
      bySection: Object.fromEntries(
        SECTION_KEYS.map((section) => [
          section,
          {
            attempts7d: 10,
            correct7d: 7,
            attempts7to14d: 0,
            correct7to14d: 0,
            attempts90d: 10,
            correct90d: 7,
            avgTimeMs: null,
            lastAttemptedAt: null,
            attemptsToday: 0,
            firstTry90d: 10,
            firstTryCorrect90d: 7,
          },
        ]),
      ) as Stats['bySection'],
    }
  }

  it('maps live counts, lesson, identity and first-try prognosis', () => {
    live.stats = stats()
    live.due = Array.from({ length: 8 }, (_, id) => ({ id }))
    live.pile = Array.from({ length: 12 }, (_, id) => ({ id }))
    live.lesson = {
      id: 1,
      userId: 1,
      section: 'NOG',
      frameworkId: 'NOG-TRAP-001',
      updatedAt: new Date().toISOString(),
      device: null,
    }
    live.framework = {
      section: 'NOG',
      family: 'nog_traps',
      version: 1,
      authored_at: '',
      entries: [
        {
          id: 'NOG-TRAP-001',
          pattern_description: 'Två påståenden',
          why_it_occurs: '',
          common_distractor_signature: '',
          countermeasure: '',
          example_questions: [],
        },
      ],
    }
    const { result } = renderHook(() => useFolioShellData())
    expect(result.current.dueCount).toBe(8)
    expect(result.current.subtitles.ova).toBe('Alla delprov')
    expect(result.current.subtitles.repetera).toBe('8 redo')
    expect(result.current.subtitles.historik).toBe('Pågår: NOG-lektion · Två påståenden')
    expect(result.current.subtitles.uppslag).toBe('NOG · Två påståenden')
    expect(result.current.subtitles.idag).toBe('Fortsätt NOG-lektion, Två påståenden')
    expect(result.current.subtitles.idag).not.toMatch(/NOG-TRAP-\d+/)
    expect(result.current.subtitles.framsteg).toBe('Prognos 1,4 av 2,0')
    expect(result.current.identity.name).toBe('Ada')
    expect(live.get).toHaveBeenCalledWith(localDateString(new Date()))
    expect(live.put).not.toHaveBeenCalled()
  })

  it('maps real session position into Idag, Öva and Historik, and drops stale resumptions', () => {
    live.sessions = [
      {
        id: 42,
        userId: 1,
        kind: 'drill',
        sections: 'KVA',
        position: 2,
        currentQuestionId: 'q3',
        plan: ['q1', 'q2', 'q3', 'q4'],
        device: 'phone',
        startedAt: new Date().toISOString(),
        endedAt: null,
      },
    ]
    const { result, rerender } = renderHook(() => useFolioShellData())
    expect(result.current.subtitles.idag).toBe('Fortsätt KVA, fråga 3 av 4')
    expect(result.current.subtitles.ova).toBe('Fortsätt KVA, fråga 3 av 4')
    expect(result.current.subtitles.historik).toBe('Pågår: KVA · fråga 3 av 4')
    live.sessions[0].startedAt = '2000-01-01T00:00:00Z'
    rerender()
    expect(result.current.subtitles.idag).toBe('Dagens plan')
    expect(result.current.subtitles.ova).toBe('Alla delprov')
    expect(result.current.subtitles.historik).toBe('Dina pass och svar')
  })

  it.each([
    'loading',
    'unknown',
  ] as const)('keeps the Idag lesson subtitle neutral when the entry is %s', (state) => {
    live.lesson = {
      id: 1,
      userId: 1,
      section: 'NOG',
      frameworkId: 'NOG-TRAP-999',
      updatedAt: new Date().toISOString(),
      device: null,
    }
    if (state === 'unknown') {
      live.framework = {
        section: 'NOG',
        family: 'nog_traps',
        version: 1,
        authored_at: '',
        entries: [],
      }
    }
    const { result } = renderHook(() => useFolioShellData())
    expect(result.current.subtitles.idag).toBe('Fortsätt NOG-lektion')
    expect(result.current.subtitles.idag).not.toMatch(/NOG-TRAP-\d+/)
  })

  it('derives current completion without modifying or regenerating the server plan', () => {
    live.stats = stats()
    live.due = [{ id: 1 }]
    live.plan = {
      date: localDateString(new Date()),
      version: PLAN_SCHEMA_VERSION,
      estimatedMinutes: 1,
      items: [
        {
          id: 'rep',
          kind: 'repetition',
          section: null,
          headline: 'Repetition · 1 miss',
          rationale: '',
          estimatedMinutes: 1,
          href: '/repetition',
          completed: false,
        },
      ],
    }
    const { result, rerender } = renderHook(() => useFolioShellData())
    expect(result.current.subtitles.idag).toBe('Först: Repetition · 1 miss')
    live.due = []
    rerender()
    expect(result.current.subtitles.idag).toBe('Allt i dagens plan är gjort')
    expect(live.plan.items[0].completed).toBe(false)
    expect(live.put).not.toHaveBeenCalled()
  })

  it('does not fabricate scores, plans or due prescriptions while queries are missing', () => {
    const { result, rerender } = renderHook(() => useFolioShellData())
    expect(result.current.subtitles.framsteg).toBe('Prognos och historik')
    expect(result.current.subtitles.idag).toBe('Dagens plan')
    expect(result.current.subtitles.provpass).toBe('Ett helt pass, 55 minuter')
    expect(result.current.subtitles.historik).toBe('Dina pass och svar')
    live.stats = stats()
    for (const section of SECTION_KEYS) live.stats.bySection[section].firstTry90d = 0
    rerender()
    expect(result.current.subtitles.framsteg).toBe('Prognos och historik')
    expect(result.current.subtitles.historik).toBe('8 övningspass')
    expect(live.put).not.toHaveBeenCalled()
  })
})
