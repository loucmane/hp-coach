// useDailyPlan × framework prerequisite gate (hpf-0026.2).
//
// Runs the real hint resolution and the real hook against the SHIPPED graph
// and catalogs (read from app/public/frameworks on disk), so the acceptance
// cases exercise the data the app serves:
//
//   - KVA-TRAP-014 is not introduced while XYZ-TRAP-005 is untaught; the KVA
//     lesson slot pulls forward the deepest untaught prerequisite instead.
//   - Taught = a framework_progress status past untaught OR a lesson read, so
//     a fresh local read counts before the server status catches up.
//   - Introduction only; soft edges only reorder; an invalid or missing graph
//     fails open; a prerequisite whose catalog fails to load falls back.
//
// Fixture: KVA is the only scored section (1.0, so Rule 2 wants a lesson) and
// KVA-TRAP-001…013 are read, which makes KVA-TRAP-014 the KVA candidate. Both
// Provpass halves ran yesterday, so no mock anchor takes the day.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Section } from '@/data/questions'
import type { FrameworkProgressRow } from '@/lib/frameworkProgress'
import { markLessonRead } from '@/lib/scheduler'
import type { SectionStats } from '@/lib/scoring'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SERVED_DIR = path.resolve(HERE, '..', '..', 'public', 'frameworks')
const FILES: Record<Section, string> = {
  ORD: 'ord_roots.json',
  LÄS: 'las_taxonomy.json',
  MEK: 'mek_protocol.json',
  ELF: 'elf_taxonomy.json',
  XYZ: 'xyz_traps.json',
  KVA: 'kva_traps.json',
  NOG: 'nog_traps.json',
  DTK: 'dtk_tactics.json',
}
const readServed = (file: string): unknown =>
  JSON.parse(readFileSync(path.join(SERVED_DIR, file), 'utf8'))

// Per-test knobs. `graph: undefined` serves the shipped graph; a `catalogs`
// entry replaces one section's file (null = not wired, 'throw' = HTTP error).
const knobs = vi.hoisted(() => ({
  graph: undefined as unknown,
  catalogs: {} as Record<string, unknown>,
  progress: { data: [], isLoading: false, isError: false } as {
    data: unknown[] | undefined
    isLoading: boolean
    isError: boolean
  },
  serverReads: [] as string[],
}))

vi.mock('@/data/frameworks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/frameworks')>()
  return {
    ...actual,
    loadFramework: async (section: Section) => {
      const override = knobs.catalogs[section]
      if (override === 'throw') throw new Error(`failed to load framework ${section}: HTTP 500`)
      return override !== undefined ? override : readServed(FILES[section])
    },
    loadPrereqGraph: async () =>
      knobs.graph === undefined ? readServed('framework_prereqs.json') : knobs.graph,
  }
})

const empty: SectionStats = {
  attempts7d: 0,
  correct7d: 0,
  attempts7to14d: 0,
  correct7to14d: 0,
  attempts90d: 0,
  correct90d: 0,
  avgTimeMs: null,
  lastAttemptedAt: null,
  attemptsToday: 0,
}
const SECTIONS: Section[] = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK']
// Reference-stable payloads — see the note in useDailyPlan.hook.test.tsx.
const statsData = {
  attempts: { total: 30, today: 0, thisWeek: 10 },
  drills: { total: 3, thisWeek: 1 },
  mistakes: { active: 0, due: 0, resolved: 0 },
  accuracy7d: null,
  streakDays: 0,
  bySection: {
    ...(Object.fromEntries(SECTIONS.map((s) => [s, empty])) as Record<Section, SectionStats>),
    KVA: {
      attempts7d: 10,
      correct7d: 5,
      attempts7to14d: 10,
      correct7to14d: 5,
      attempts90d: 30,
      correct90d: 15,
      avgTimeMs: 30_000,
      lastAttemptedAt: new Date('2026-05-17T10:00:00').getTime(),
      attemptsToday: 0,
    } satisfies SectionStats,
  },
  weekly: [],
}
const dueData: unknown[] = []
const topTrapsData: unknown[] = []
const mockResultsData = [
  { half: 'verbal', createdAt: new Date('2026-05-17T09:00:00').getTime() },
  { half: 'kvant', createdAt: new Date('2026-05-17T09:30:00').getTime() },
]

vi.mock('@/api/hooks/useStats', () => ({
  useStats: () => ({ data: statsData, isLoading: false, isError: false }),
}))
vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: dueData, isLoading: false, isError: false }),
}))
vi.mock('@/api/hooks/useTopTraps', () => ({ useTopTraps: () => topTrapsData }))
vi.mock('@/api/hooks/useMockResults', () => ({
  useMockResults: () => ({ data: mockResultsData, isLoading: false }),
}))
vi.mock('@/api/hooks/useSessions', () => ({
  useActiveSessions: () => ({ data: [], isLoading: false }),
}))
vi.mock('@/api/hooks/useAdaptiveReview', () => ({
  useAdaptiveReview: () => ({
    hotTrap: null,
    section: null,
    trapName: null,
    detourHref: null,
    lektionHref: null,
    decline: () => {},
  }),
}))
vi.mock('@/api/hooks/useDailyPlanApi', () => ({
  useDailyPlanQuery: () => ({ data: null, isLoading: false }),
  usePutDailyPlan: () => ({ mutate: () => {} }),
}))
vi.mock('@/api/hooks/useLessonReadsApi', () => ({
  useLessonReadsQuery: () => ({ data: knobs.serverReads, isLoading: false }),
}))
vi.mock('@/api/hooks/useUserPrefs', () => ({
  useUserPrefs: () => ({ data: {} }),
  useUpdateUserPrefs: () => ({ mutate: () => {} }),
}))
vi.mock('@/api/hooks/useFrameworkProgress', () => ({
  useFrameworkProgress: () => knobs.progress,
}))

import { resolveFrameworkHints, useDailyPlan } from './useDailyPlan'

const KVA_BEFORE_014 = Array.from(
  { length: 13 },
  (_, i) => `KVA-TRAP-${String(i + 1).padStart(3, '0')}`,
)
const GRUNDEN_FORST = 'Grunden först: läs XYZ-regeln som den här KVA-fällan bygger på.'

function row(layer1Id: string, status: FrameworkProgressRow['status']): FrameworkProgressRow {
  return { layer1Id, status, lastTransitionAt: '2026-05-17T10:00:00.000Z' }
}

function patternOf(file: string, id: string): string {
  const catalog = readServed(file) as {
    entries: Array<{ id: string; pattern_description: string }>
  }
  const entry = catalog.entries.find((e) => e.id === id)
  if (!entry) throw new Error(`no ${id} in ${file}`)
  return entry.pattern_description
}

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

async function planLesson() {
  const { result } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
  await waitFor(() => expect(result.current.plan).not.toBeNull())
  return result.current.plan?.items.find((i) => i.kind === 'lesson')
}

const readsBefore014 = () => new Set(KVA_BEFORE_014)

beforeEach(() => {
  localStorage.clear()
  knobs.graph = undefined
  knobs.catalogs = {}
  knobs.progress = { data: [], isLoading: false, isError: false }
  knobs.serverReads = KVA_BEFORE_014
  vi.setSystemTime(new Date('2026-05-18T10:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('resolveFrameworkHints — hard prerequisites (shipped graph)', () => {
  it('does not offer KVA-TRAP-014 while XYZ-TRAP-005 is untaught; pulls the deepest prerequisite forward', async () => {
    const hints = await resolveFrameworkHints(readsBefore014(), [])
    expect(hints.KVA).toEqual({
      id: 'XYZ-TRAP-002',
      headword: patternOf('xyz_traps.json', 'XYZ-TRAP-002'),
      pulledForward: { section: 'XYZ', blockedId: 'KVA-TRAP-014' },
    })
  })

  it('pulls XYZ-TRAP-005 itself forward once XYZ-TRAP-002 is taught', async () => {
    const hints = await resolveFrameworkHints(readsBefore014(), [row('XYZ-TRAP-002', 'practicing')])
    expect(hints.KVA).toMatchObject({
      id: 'XYZ-TRAP-005',
      pulledForward: { section: 'XYZ', blockedId: 'KVA-TRAP-014' },
    })
  })

  it('offers KVA-TRAP-014 normally once XYZ-TRAP-005 and XYZ-TRAP-002 are taught', async () => {
    const hints = await resolveFrameworkHints(readsBefore014(), [
      row('XYZ-TRAP-002', 'mastered'),
      row('XYZ-TRAP-005', 'learning'),
    ])
    expect(hints.KVA).toEqual({
      id: 'KVA-TRAP-014',
      headword: patternOf('kva_traps.json', 'KVA-TRAP-014'),
    })
  })

  it('introduction only: KVA-TRAP-014 already learning or practicing is never re-blocked', async () => {
    // XYZ-TRAP-005 went back to untaught (e.g. its read was undone).
    for (const status of ['learning', 'practicing'] as const) {
      const hints = await resolveFrameworkHints(readsBefore014(), [
        row('KVA-TRAP-014', status),
        row('XYZ-TRAP-005', 'untaught'),
      ])
      expect(hints.KVA).toEqual({
        id: 'KVA-TRAP-014',
        headword: patternOf('kva_traps.json', 'KVA-TRAP-014'),
      })
    }
  })

  it('counts a lesson read as taught even when the server row still says untaught', async () => {
    const reads = new Set([...KVA_BEFORE_014, 'XYZ-TRAP-002'])
    const hints = await resolveFrameworkHints(reads, [row('XYZ-TRAP-002', 'untaught')])
    expect(hints.KVA).toMatchObject({ id: 'XYZ-TRAP-005' })
  })

  it('leaves sections without a blocked candidate on their first unread entry', async () => {
    const hints = await resolveFrameworkHints(readsBefore014(), [])
    expect(hints.XYZ).toEqual({
      id: 'XYZ-TRAP-001',
      headword: patternOf('xyz_traps.json', 'XYZ-TRAP-001'),
    })
    expect(hints.NOG).toMatchObject({ id: 'NOG-TRAP-001' })
    expect(hints.ORD).toMatchObject({ id: 'ORD-ROOT-001' })
  })
})

describe('resolveFrameworkHints — soft prerequisites (synthetic fixture)', () => {
  // Catalog order N-1, N-2, N-3, but N-3 is a soft prerequisite of N-1. No
  // shipped edge runs against catalog order, so this needs a synthetic one.
  const nog = {
    section: 'NOG',
    family: 'nog_traps',
    version: 1,
    authored_at: '2026-10-18',
    entries: ['NOG-SYN-001', 'NOG-SYN-002', 'NOG-SYN-003'].map((id) => ({
      id,
      pattern_description: `mönster ${id}`,
      why_it_occurs: '',
      common_distractor_signature: '',
      countermeasure: '',
      example_questions: [],
    })),
  }
  const soft = (from: string, to: string) => ({ from, to, reason: 'test', strength: 'soft' })

  it('prefers entries whose soft prerequisites are taught', async () => {
    knobs.catalogs = { NOG: nog }
    knobs.graph = { version: 1, edges: [soft('NOG-SYN-003', 'NOG-SYN-001')] }
    const before = await resolveFrameworkHints(new Set(), [])
    expect(before.NOG).toEqual({ id: 'NOG-SYN-002', headword: 'mönster NOG-SYN-002' })
    const after = await resolveFrameworkHints(new Set(['NOG-SYN-003']), [])
    expect(after.NOG).toEqual({ id: 'NOG-SYN-001', headword: 'mönster NOG-SYN-001' })
  })

  it('never blocks: an entry whose soft prerequisite is untaught is still offered', async () => {
    knobs.catalogs = { NOG: nog }
    knobs.graph = { version: 1, edges: [soft('XYZ-TRAP-001', 'NOG-SYN-001')] }
    const hints = await resolveFrameworkHints(new Set(['NOG-SYN-002', 'NOG-SYN-003']), [])
    expect(hints.NOG).toEqual({ id: 'NOG-SYN-001', headword: 'mönster NOG-SYN-001' })
  })
})

describe('resolveFrameworkHints — fail open and fallbacks', () => {
  const ungatedKva = () => ({
    id: 'KVA-TRAP-014',
    headword: patternOf('kva_traps.json', 'KVA-TRAP-014'),
  })

  it('fails open with a console warning when the graph is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const shipped = readServed('framework_prereqs.json') as { edges: unknown[] }
    knobs.graph = {
      ...shipped,
      edges: [
        ...shipped.edges,
        { from: 'KVA-TRAP-014', to: 'XYZ-TRAP-002', reason: 'x', strength: 'soft' },
      ],
    }
    const hints = await resolveFrameworkHints(readsBefore014(), [])
    expect(hints.KVA).toEqual(ungatedKva())
    expect(warn).toHaveBeenCalled()
    expect(String(warn.mock.calls[0][0])).toMatch(/cycle/)
  })

  it('fails open with a console warning when the graph is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    knobs.graph = null
    const hints = await resolveFrameworkHints(readsBefore014(), [])
    expect(hints.KVA).toEqual(ungatedKva())
    expect(warn).toHaveBeenCalled()
  })

  it("falls back to the next eligible KVA entry when the prerequisite's catalog is not served", async () => {
    knobs.catalogs = { XYZ: null }
    const hints = await resolveFrameworkHints(readsBefore014(), [])
    expect(hints.KVA).toEqual({
      id: 'KVA-TRAP-015',
      headword: patternOf('kva_traps.json', 'KVA-TRAP-015'),
    })
  })

  it("falls back the same way when the prerequisite's catalog fails with an error", async () => {
    knobs.catalogs = { XYZ: 'throw' }
    const hints = await resolveFrameworkHints(readsBefore014(), [])
    expect(hints.KVA).toMatchObject({ id: 'KVA-TRAP-015' })
    expect(hints.XYZ).toBeUndefined()
  })

  it('offers no lesson when nothing eligible is left in the section', async () => {
    knobs.catalogs = { XYZ: null }
    const allButKva014 = new Set(
      Array.from({ length: 54 }, (_, i) => `KVA-TRAP-${String(i + 1).padStart(3, '0')}`).filter(
        (id) => id !== 'KVA-TRAP-014',
      ),
    )
    const hints = await resolveFrameworkHints(allButKva014, [])
    expect(hints.KVA).toBeNull()
  })
})

describe('useDailyPlan — prerequisite gate wiring', () => {
  it('fills the KVA lesson slot with XYZ-TRAP-002 and the exact Grunden först line', async () => {
    const lesson = await planLesson()
    expect(lesson).toMatchObject({
      section: 'XYZ',
      framework: 'XYZ-TRAP-002',
      href: '/lektion?section=XYZ#XYZ-TRAP-002',
      rationale: GRUNDEN_FORST,
    })
    expect(lesson?.headline.startsWith('XYZ-lektion · ')).toBe(true)
  })

  it('introduces KVA-TRAP-014 once the server reports both prerequisites taught', async () => {
    knobs.progress = {
      data: [row('XYZ-TRAP-002', 'practicing'), row('XYZ-TRAP-005', 'learning')],
      isLoading: false,
      isError: false,
    }
    const lesson = await planLesson()
    expect(lesson).toMatchObject({
      section: 'KVA',
      framework: 'KVA-TRAP-014',
      href: '/lektion?section=KVA#KVA-TRAP-014',
      rationale: 'Svagaste sektionen — 1.0, börja med lektionen.',
    })
  })

  it('counts a fresh local read of the prerequisite before the server status updates', async () => {
    // Read on this device a moment ago: the localStorage flag exists, the
    // server read set and framework_progress have not caught up.
    markLessonRead('XYZ-TRAP-002')
    knobs.progress = { data: [row('XYZ-TRAP-002', 'untaught')], isLoading: false, isError: false }
    expect((await planLesson())?.framework).toBe('XYZ-TRAP-005')
  })

  it('introduces KVA-TRAP-014 from fresh local reads of both prerequisites', async () => {
    markLessonRead('XYZ-TRAP-002')
    markLessonRead('XYZ-TRAP-005')
    const lesson = await planLesson()
    expect(lesson).toMatchObject({ section: 'KVA', framework: 'KVA-TRAP-014' })
  })

  it('waits for the framework-progress query before generating the plan', async () => {
    knobs.progress = { data: undefined, isLoading: true, isError: false }
    const { result, rerender } = renderHook(() => useDailyPlan(), { wrapper: wrapper() })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(result.current.plan).toBeNull()
    expect(result.current.isLoading).toBe(true)

    knobs.progress = { data: [], isLoading: false, isError: false }
    act(() => rerender())
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items.find((i) => i.kind === 'lesson')?.framework).toBe(
      'XYZ-TRAP-002',
    )
  })

  it('falls back to the read set alone when the framework-progress query errors', async () => {
    knobs.progress = { data: undefined, isLoading: false, isError: true }
    markLessonRead('XYZ-TRAP-002')
    expect((await planLesson())?.framework).toBe('XYZ-TRAP-005')
  })
})
