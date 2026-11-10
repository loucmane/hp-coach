// useDailyPlan completion-derivation tests.
//
// Cross-device completion: section=null items (mastery, cold-start) — which
// have no per-section attempts signal — complete from the SERVER lifetime
// counter `attempts.total` (monotonic, identical on every device), snapshotted
// into the plan at generation. This is what lets an all-mastered 2.0-seeker
// reach `allComplete`, cross-device, without a device-local flag.

import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Framework, TrapEntry } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { type DailyPlan, PLAN_SCHEMA_VERSION, type PlanItem, savePlan } from '@/lib/scheduler'
import type { SectionStats } from '@/lib/scoring'
import { useUiStore } from '@/stores/uiStore'
import { deriveCompletion, isItemComplete, useDailyPlan } from './useDailyPlan'

const now = new Date('2026-05-18T10:00:00')
const empty: never[] = []
const putPlan = vi.fn()
const mutate = vi.fn()
let remotePlan: DailyPlan | null = null
let catalogs: Partial<Record<Section, Framework>> = {}
const statsData = {
  attempts: { total: 20 },
  bySection: Object.fromEntries(
    SECTION_KEYS.map((section) => [
      section,
      {
        attempts90d: section === 'KVA' ? 20 : 0,
        correct90d: 0,
        attempts7d: 0,
        correct7d: 0,
        attempts7to14d: 0,
        correct7to14d: 0,
        attemptsToday: 0,
        avgTimeMs: null,
        lastAttemptedAt: section === 'KVA' ? now.getTime() : null,
      },
    ]),
  ),
}
const prefs = { mockDeferredDate: '2026-05-18' }
vi.mock('@/api/hooks/useStats', () => ({ useStats: () => ({ data: statsData }) }))
vi.mock('@/api/hooks/useMistakes', () => ({ useDueMistakes: () => ({ data: empty }) }))
vi.mock('@/api/hooks/useTopTraps', () => ({ useTopTraps: () => empty }))
vi.mock('@/api/hooks/useAdaptiveReview', () => ({ useAdaptiveReview: () => ({ hotTrap: null }) }))
vi.mock('@/api/hooks/useMockResults', () => ({ useMockResults: () => ({ data: empty }) }))
vi.mock('@/api/hooks/useSessions', () => ({ useActiveSessions: () => ({ data: empty }) }))
vi.mock('@/api/hooks/useLessonReadsApi', () => ({ useLessonReadsQuery: () => ({ data: empty }) }))
vi.mock('@/api/hooks/useFrameworkProgress', () => ({
  useFrameworkProgress: () => ({ data: empty }),
}))
vi.mock('@/api/hooks/useDailyPlanApi', () => ({
  useDailyPlanQuery: () => ({ data: remotePlan }),
  usePutDailyPlan: () => ({ mutate: putPlan }),
}))
vi.mock('@/api/hooks/useUserPrefs', () => ({
  useUserPrefs: () => ({ data: prefs }),
  useUpdateUserPrefs: () => ({ mutate }),
}))
vi.mock('@/data/frameworks', async (original) => ({
  ...(await original<typeof import('@/data/frameworks')>()),
  loadFramework: async (section: Section) => catalogs[section] ?? null,
  loadPrereqGraph: async () => ({ version: 1, edges: [] }),
}))
vi.mock('@/data/leverage', () => ({ loadFrameworkLeverage: async () => null }))

describe('useDailyPlan — pre-answer Folio text', () => {
  const trap: TrapEntry = {
    id: 'KVA-TRAP-007',
    question_title: 'Låser x² = y² tecknet?',
    pattern_description: 'Negativa värden kan ge samma kvadrat.',
    tldr: 'Kvadrering döljer tecknet.',
    recognition_cue: 'Pröva ett negativt värde.',
    why_it_occurs: '',
    countermeasure: '',
    common_distractor_signature: '',
    example_questions: [],
  }
  const unsafePlan = (kind: 'lesson' | 'drill' = 'lesson') =>
    planWith([
      {
        ...masteryItem(),
        kind,
        section: 'KVA',
        framework: trap.id,
        href: `/lektion?section=KVA#${trap.id}`,
        headline: `KVA-lektion · ${trap.pattern_description}`,
        rationale: `${trap.tldr} ${trap.recognition_cue}`,
      },
    ])
  beforeEach(() => {
    localStorage.clear()
    remotePlan = null
    putPlan.mockClear()
    catalogs = {
      KVA: { section: 'KVA', family: 'kva_traps', version: 1, authored_at: '', entries: [trap] },
    }
    useUiStore.setState({ folioPreview: true })
  })
  afterEach(() => {
    cleanup()
    useUiStore.setState({ folioPreview: false })
    localStorage.clear()
  })

  it.each([
    'generated',
    'local',
    'server',
  ] as const)('shows safe question titles in a %s plan', async (source) => {
    if (source === 'local') savePlan(unsafePlan())
    if (source === 'server') remotePlan = unsafePlan()
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    const item = result.current.plan?.items.find((i) => i.framework === trap.id)
    expect(item).toBeDefined()
    expect(item?.headline).toContain('Låser x²\u00a0=\u00a0y² tecknet?')
    const text = `${item?.headline} ${item?.rationale}`
    for (const answer of [trap.pattern_description, trap.tldr, trap.recognition_cue])
      expect(text).not.toContain(answer)
  })

  it.each([undefined, '', '   '])('uses Fälla 7 for title %s', async (title) => {
    catalogs.KVA = { ...catalogs.KVA!, entries: [{ ...trap, question_title: title }] } as Framework
    remotePlan = unsafePlan('drill')
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0].headline).toContain('Fälla 7')
    expect(result.current.plan?.items[0].rationale).not.toContain(trap.tldr)
  })

  it('hides stale cached text when the catalog is unavailable', async () => {
    catalogs = {}
    remotePlan = unsafePlan()
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0].headline).toContain('Fälla 7')
    expect(result.current.plan?.items[0].rationale).not.toContain(trap.tldr)
  })

  it('looks up the cached target even when the current lesson hint points elsewhere', async () => {
    catalogs.KVA = {
      section: 'KVA',
      family: 'kva_traps',
      version: 1,
      authored_at: '',
      entries: [{ ...trap, id: 'KVA-TRAP-001', question_title: 'Vilket värde?' }, trap],
    }
    remotePlan = unsafePlan()
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0].headline).toContain('Låser x²\u00a0=\u00a0y² tecknet?')
    expect(result.current.plan?.items[0].headline).not.toContain('Vilket värde?')
  })

  it('uses a neutral label for a non-trap entry with no question title', async () => {
    const entry = {
      id: 'DTK-TACTIC-008',
      tactic: 'Svaret är dubbelt.',
      when_to_apply: '',
      example_questions: [],
    }
    catalogs = {
      DTK: { section: 'DTK', family: 'dtk_tactics', version: 1, authored_at: '', entries: [entry] },
    }
    remotePlan = unsafePlan()
    remotePlan.items[0] = {
      ...remotePlan.items[0],
      section: 'DTK',
      framework: entry.id,
      headline: entry.tactic,
      rationale: entry.tactic,
    }
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0].headline).toContain('Lektion 8')
    expect(result.current.plan?.items[0].rationale).not.toContain(entry.tactic)
  })

  it('preserves the classic baseline and switches presentation without rewriting it', async () => {
    useUiStore.setState({ folioPreview: false })
    remotePlan = unsafePlan()
    const baseline = JSON.stringify(remotePlan)
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(JSON.stringify(result.current.plan)).toBe(baseline)
    act(() => useUiStore.setState({ folioPreview: true }))
    expect(result.current.plan?.items[0].headline).toContain('Låser x²\u00a0=\u00a0y² tecknet?')
    act(() => useUiStore.setState({ folioPreview: false }))
    expect(JSON.stringify(result.current.plan)).toBe(baseline)
    expect(JSON.stringify(remotePlan)).toBe(baseline)
    expect(putPlan).not.toHaveBeenCalled()
  })
})

const EMPTY_BY_SECTION = {} as Record<Section, SectionStats>

function masteryItem(): PlanItem {
  return {
    id: 'drill-2026-05-18',
    kind: 'drill',
    section: null,
    headline: 'Blandad övning · alla sektioner',
    rationale: 'Du är ifatt — sikta mot 2.0 med blandad övning.',
    estimatedMinutes: 10,
    href: '/drill?mixed=1',
    completed: false,
  }
}

function planWith(items: PlanItem[], totalAttemptsSnapshot = 100): DailyPlan {
  return {
    version: PLAN_SCHEMA_VERSION,
    date: '2026-05-18',
    items,
    estimatedMinutes: items.reduce((s, i) => s + i.estimatedMinutes, 0),
    totalAttemptsSnapshot,
  }
}

describe('isItemComplete — section=null via server attempts.total (F1)', () => {
  it('leaves a mastery drill incomplete until total attempts grow >= threshold', () => {
    const item = masteryItem()
    const plan = planWith([item], 100)
    // Only 4 fresh attempts since the plan was generated — not enough.
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, 104)).toBe(false)
  })

  it('completes the mastery drill once total attempts grew >= 5 since generation', () => {
    const item = masteryItem()
    const plan = planWith([item], 100)
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, 105)).toBe(true)
  })

  it('uses a MONOTONIC counter — a higher current total than baseline always counts', () => {
    // attempts.total never decrements (unlike the rolling attempts7d window),
    // so a same-day burst always satisfies the gate cross-device.
    const item = masteryItem()
    const plan = planWith([item], 0)
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, 6)).toBe(true)
  })

  it('stays incomplete when the plan has no total snapshot (defensive)', () => {
    const item = masteryItem()
    const plan: DailyPlan = {
      version: PLAN_SCHEMA_VERSION,
      date: '2026-05-18',
      items: [item],
      estimatedMinutes: 10,
    }
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, 999)).toBe(false)
  })
})

describe('isItemComplete — mastery drill routed to a section completes per-section', () => {
  // After the mixed-drill routing fix, the mastery-maintenance item carries a
  // real `section` (least-recently-attempted) + `?section=X` href, so it
  // completes via the same per-section attemptsToday snapshot path as any
  // other section drill — not the loose total-diff fallback.
  function sectionMasteryItem(section: Section): PlanItem {
    return {
      id: `mastery-2026-05-18`,
      kind: 'drill',
      section,
      headline: `Blandad övning · börja med ${section}`,
      rationale: 'Du är ifatt — sikta mot 2.0. Börja med sektionen du rört minst.',
      estimatedMinutes: 12,
      href: `/drill?section=${section}`,
      completed: false,
    }
  }

  function planWithSnapshot(items: PlanItem[], attemptsSnapshot: Partial<Record<Section, number>>) {
    return {
      version: PLAN_SCHEMA_VERSION,
      date: '2026-05-18',
      items,
      estimatedMinutes: items.reduce((s, i) => s + i.estimatedMinutes, 0),
      attemptsSnapshot,
      // A generous total snapshot proves completion comes from the per-section
      // path, not the total-diff fallback.
      totalAttemptsSnapshot: 100_000,
    } as DailyPlan
  }

  it('stays incomplete until the section attemptsToday grew >= threshold', () => {
    const item = sectionMasteryItem('NOG')
    const plan = planWithSnapshot([item], { NOG: 10 })
    const bySection = { NOG: { attemptsToday: 13 } } as unknown as Record<Section, SectionStats>
    expect(isItemComplete(item, plan, 0, new Set(), bySection, 100_000)).toBe(false)
  })

  it('completes once the section attemptsToday grew >= threshold', () => {
    const item = sectionMasteryItem('NOG')
    const plan = planWithSnapshot([item], { NOG: 10 })
    const bySection = { NOG: { attemptsToday: 15 } } as unknown as Record<Section, SectionStats>
    expect(isItemComplete(item, plan, 0, new Set(), bySection, 100_000)).toBe(true)
  })

  it('SF2b: stays complete across an overnight attempts7d window-slide', () => {
    // The bug this replaces: attempts7d is a rolling 7-day window that can
    // DROP overnight as old attempts age out of the window, flipping a
    // finished drill back to incomplete intraday. attemptsToday is a
    // same-UTC-day monotonic counter — it never decrements within the day,
    // so a completed drill stays completed even if attempts7d would have
    // slid backward under the old signal.
    const item = sectionMasteryItem('NOG')
    const plan = planWithSnapshot([item], { NOG: 10 })
    const bySection = {
      NOG: { attemptsToday: 15, attempts7d: 4 }, // attempts7d dropped below baseline+threshold
    } as unknown as Record<Section, SectionStats>
    expect(isItemComplete(item, plan, 0, new Set(), bySection, 100_000)).toBe(true)
  })
})

describe('deriveCompletion — allComplete reachable for an all-mastered plan (F1)', () => {
  it('flips the section=null item to completed once total grew, so allComplete is reachable', () => {
    const item = masteryItem()
    const plan = planWith([item], 100)
    const next = deriveCompletion(plan, 0, new Set(), EMPTY_BY_SECTION, 106)
    expect(next.items[0].completed).toBe(true)
    expect(next.items.every((i) => i.completed)).toBe(true)
  })
})

describe('isItemComplete — kind "mock" via mock history (Provpass steering)', () => {
  function mockPlanItem(half: 'verbal' | 'kvant', date = '2026-05-18'): PlanItem {
    return {
      id: `mock-${half}-${date}`,
      kind: 'mock',
      section: null,
      headline: `Provpass · ${half === 'verbal' ? 'Verbal' : 'Kvantitativ'}`,
      rationale: 'Dags för ditt första provpass — vi behöver en baslinje.',
      estimatedMinutes: 55,
      href: `/prov?half=${half}&prescribed=1`,
      completed: false,
    }
  }

  it('stays incomplete with no mock history at all', () => {
    const item = mockPlanItem('verbal')
    const plan = planWith([item])
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, 0, [])).toBe(false)
  })

  it('stays incomplete when history only has the OTHER half', () => {
    const item = mockPlanItem('verbal')
    const plan = planWith([item])
    const history = [
      { half: 'kvant' as const, createdAt: new Date('2026-05-18T12:00:00').getTime() },
    ]
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, 0, history)).toBe(false)
  })

  it('completes once a matching-half result lands on/after the plan date', () => {
    const item = mockPlanItem('verbal', '2026-05-18')
    const plan = planWith([item])
    const history = [
      { half: 'verbal' as const, createdAt: new Date('2026-05-18T15:00:00').getTime() },
    ]
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, 0, history)).toBe(true)
  })

  it('ignores a matching-half result from BEFORE the plan date (stale history)', () => {
    const item = mockPlanItem('verbal', '2026-05-18')
    const plan = planWith([item])
    const history = [
      { half: 'verbal' as const, createdAt: new Date('2026-05-10T15:00:00').getTime() },
    ]
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, 0, history)).toBe(false)
  })

  it('defaults to incomplete when mockHistory is omitted (backward-compat)', () => {
    const item = mockPlanItem('verbal')
    const plan = planWith([item])
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, 0)).toBe(false)
  })
})
