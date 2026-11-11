// useDailyPlan completion-derivation tests.
//
// Cross-device completion: section=null items (mastery, cold-start) — which
// have no per-section attempts signal — complete from the SERVER lifetime
// counter `attempts.total` (monotonic, identical on every device), snapshotted
// into the plan at generation. This is what lets an all-mastered 2.0-seeker
// reach `allComplete`, cross-device, without a device-local flag.

import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TopTrap } from '@/api/hooks/useTopTraps'
import type { Framework, TrapEntry } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'
import {
  type DailyPlan,
  loadPlan,
  markLessonRead,
  PLAN_SCHEMA_VERSION,
  type PlanItem,
  savePlan,
} from '@/lib/scheduler'
import type { SectionStats } from '@/lib/scoring'
import { useUiStore } from '@/stores/uiStore'
import { deriveCompletion, isItemComplete, useDailyPlan } from './useDailyPlan'

const now = new Date('2026-05-18T10:00:00')
const empty: never[] = []
const putPlan = vi.fn()
const mutate = vi.fn()
let remotePlan: DailyPlan | null = null
let catalogs: Partial<Record<Section, Framework>> = {}
let topTraps: TopTrap[] = []
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
vi.mock('@/api/hooks/useTopTraps', () => ({ useTopTraps: () => topTraps }))
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

describe.each([false, true])('useDailyPlan — pre-answer text, Folio=%s', (folioPreview) => {
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
        id: `${kind === 'drill' ? 'drill-trap' : 'lesson'}-${trap.id}-2026-05-18`,
        kind,
        section: 'KVA',
        framework: trap.id,
        href: kind === 'drill' ? `/drill?framework=${trap.id}` : `/lektion?section=KVA#${trap.id}`,
        headline:
          kind === 'lesson' ? `KVA-lektion · ${trap.pattern_description}` : `${trap.id} · 5 frågor`,
        rationale:
          kind === 'lesson'
            ? 'Svagaste sektionen — 1.0, börja med lektionen.'
            : `${trap.pattern_description} — 7 missar senaste veckan. Fokuserad drill.`,
      },
    ])
  beforeEach(() => {
    localStorage.clear()
    remotePlan = null
    topTraps = []
    putPlan.mockClear()
    catalogs = {
      KVA: { section: 'KVA', family: 'kva_traps', version: 1, authored_at: '', entries: [trap] },
    }
    useUiStore.setState({ folioPreview })
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
    expect(result.current.plan?.items[0].rationale).toBe(
      'Fälla 7 — 7 missar senaste veckan. Fokuserad drill.',
    )
  })

  it('hides stale cached text when the catalog is unavailable', async () => {
    catalogs = {}
    remotePlan = unsafePlan()
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0].headline).toContain('Fälla 7')
    expect(result.current.plan?.items[0].headline).not.toContain(trap.pattern_description)
  })

  it.each([
    'Grunden först: läs XYZ-regeln som den här KVA-fällan bygger på.',
    'Svagaste sektionen — 1.0, börja med lektionen.',
  ])('keeps the headword-free lesson rationale verbatim: %s', async (rationale) => {
    remotePlan = unsafePlan()
    remotePlan.items[0].rationale = rationale
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0]).toMatchObject({
      headline: 'KVA-lektion · Låser x²\u00a0=\u00a0y² tecknet?',
      rationale,
    })
  })

  it('replaces only the trap name, preserving drill counts and coaching copy', async () => {
    remotePlan = unsafePlan('drill')
    const baseline = JSON.stringify(remotePlan)
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0]).toMatchObject({
      headline: `${trap.id} · 5 frågor`,
      rationale: 'Låser x²\u00a0=\u00a0y² tecknet? — 7 missar senaste veckan. Fokuserad drill.',
    })
    expect(JSON.stringify(remotePlan)).toBe(baseline)
    expect(loadPlan(remotePlan.date)).toEqual(remotePlan)
    expect(putPlan).not.toHaveBeenCalled()
  })

  it.each([
    'generated',
    'local',
    'server',
  ] as const)('replaces a tldr-derived trap name in a %s plan without changing persistence', async (source) => {
    const original = unsafePlan('drill')
    original.items[0].rationale = `${trap.tldr} — 12 missar senaste veckan. Fokuserad drill.`
    const originalJson = JSON.stringify(original)
    if (source === 'generated') {
      markLessonRead(trap.id)
      topTraps = [
        {
          framework_id: trap.id,
          section: 'KVA',
          count: 12,
          headline: trap.tldr ?? null,
          trend: { kind: 'unknown' },
        },
      ]
    }
    if (source === 'local') savePlan(original)
    if (source === 'server') remotePlan = original
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    const item = result.current.plan?.items.find((i) => i.id === original.items[0].id)
    expect(item).toMatchObject({
      headline: `${trap.id} · 5 frågor`,
      rationale: 'Låser x²\u00a0=\u00a0y² tecknet? — 12 missar senaste veckan. Fokuserad drill.',
    })
    const stored = loadPlan(original.date)
    expect(stored?.items.find((i) => i.id === original.items[0].id)?.rationale).toBe(
      original.items[0].rationale,
    )
    expect(JSON.stringify(original)).toBe(originalJson)
    if (source === 'server') expect(putPlan).not.toHaveBeenCalled()
    else expect(putPlan).toHaveBeenCalledWith(stored)
  })

  it('replaces a whole composed taxonomy name, including its internal em dash', async () => {
    catalogs = {
      LÄS: {
        section: 'LÄS',
        family: 'las_taxonomy',
        version: 1,
        authored_at: '',
        entries: [
          {
            id: 'LAS-TYPE-001',
            question_type: 'Direkt detalj',
            question_title: 'Vad står i texten?',
            attack_protocol: ['Leta upp samma formulering.'],
            common_distractors: [],
            example_questions: [],
          },
        ],
      },
    }
    remotePlan = unsafePlan('drill')
    remotePlan.items[0] = {
      ...remotePlan.items[0],
      id: `drill-trap-LAS-TYPE-001-${remotePlan.date}`,
      section: 'LÄS',
      framework: 'LAS-TYPE-001',
      headline: 'LAS-TYPE-001 · 5 frågor',
      href: '/drill?framework=LAS-TYPE-001',
      rationale:
        'Direkt detalj — Leta upp samma formulering. — 3 missar senaste veckan. Fokuserad drill.',
    }
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0].rationale).toBe(
      'Vad står i texten? — 3 missar senaste veckan. Fokuserad drill.',
    )
    expect(loadPlan(remotePlan.date)).toEqual(remotePlan)
  })

  it.each([
    'no title',
    'no catalog',
  ] as const)('keeps the trap-drill count with %s', async (missing) => {
    if (missing === 'no catalog') catalogs = {}
    else
      catalogs.KVA = {
        ...catalogs.KVA!,
        entries: [{ ...trap, question_title: undefined }],
      } as Framework
    remotePlan = unsafePlan('drill')
    remotePlan.items[0].rationale = `${trap.tldr} — 9 missar senaste veckan. Fokuserad drill.`
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0].rationale).toBe(
      'Fälla 7 — 9 missar senaste veckan. Fokuserad drill.',
    )
    expect(loadPlan(remotePlan.date)).toEqual(remotePlan)
  })

  it('leaves a generic drill rationale with no headword byte-identical', async () => {
    remotePlan = unsafePlan('drill')
    remotePlan.items[0].id = `drill-KVA-${remotePlan.date}`
    remotePlan.items[0].rationale = 'Svagast — 1.25, övning skärper formen.'
    const { headline, rationale } = remotePlan.items[0]
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0]).toMatchObject({ headline, rationale })
  })

  it('keeps a cached headline and rationale with no headword byte-identical', async () => {
    remotePlan = unsafePlan()
    remotePlan.items[0].headline = 'Din nästa lektion · 5 min'
    remotePlan.items[0].rationale = 'Ingen aktivitet på 20 dagar — friska upp grunderna.'
    const { headline, rationale } = remotePlan.items[0]
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0]).toMatchObject({ headline, rationale })
  })

  it('replaces the truncated headword in generated lesson headlines, keeping the baseline', async () => {
    const headword = 'Negativa värden kan ge samma kvadrat, men behöver inte vara lika.'
    catalogs.KVA = {
      ...catalogs.KVA!,
      entries: [{ ...trap, pattern_description: headword }],
    } as Framework
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    const baseline = putPlan.mock.calls[0][0] as DailyPlan
    const stored = baseline.items.find((i) => i.framework === trap.id)
    expect(stored?.headline).toBe('KVA-lektion · Negativa värden kan ge samma kvadrat, men…')
    expect(result.current.plan?.items.find((i) => i.framework === trap.id)).toMatchObject({
      headline: 'KVA-lektion · Låser x²\u00a0=\u00a0y² tecknet?',
      rationale: stored?.rationale,
    })
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

  it('keeps both presentations safe without rewriting the stored baseline', async () => {
    useUiStore.setState({ folioPreview: false })
    remotePlan = unsafePlan()
    savePlan(remotePlan)
    const baseline = JSON.stringify(remotePlan)
    const stored = JSON.stringify(localStorage)
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0].headline).toContain('Låser x²\u00a0=\u00a0y² tecknet?')
    act(() => useUiStore.setState({ folioPreview: true }))
    expect(result.current.plan?.items[0].headline).toContain('Låser x²\u00a0=\u00a0y² tecknet?')
    act(() => useUiStore.setState({ folioPreview: false }))
    expect(result.current.plan?.items[0].headline).toContain('Låser x²\u00a0=\u00a0y² tecknet?')
    expect(JSON.stringify(remotePlan)).toBe(baseline)
    expect(JSON.stringify(localStorage)).toBe(stored)
    expect(putPlan).not.toHaveBeenCalled()
  })

  it('preserves the completed first-pass marker as post-answer content', async () => {
    remotePlan = unsafePlan()
    remotePlan.items[0] = {
      ...remotePlan.items[0],
      id: `onboarding-${remotePlan.date}`,
      headline: 'Första passet',
      rationale: 'Vill du fortsätta? Öva en sektion →',
      completed: true,
      estimatedMinutes: 0,
    }
    const { result } = renderHook(() => useDailyPlan(now))
    await waitFor(() => expect(result.current.plan).not.toBeNull())
    expect(result.current.plan?.items[0]).toMatchObject({
      headline: 'Första passet',
      rationale: 'Vill du fortsätta? Öva en sektion →',
      completed: true,
    })
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
