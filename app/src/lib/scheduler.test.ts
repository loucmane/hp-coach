// Scheduler unit tests — one block per rule, one block per storage helper.
//
// Inputs are constructed with `score()` and `signals()` factories so each
// test reads as a sentence: "weakest is KVA at 1.1, ELF is fresh and
// strong → expect [rep, KVA-lesson, ELF skipped, mastery fallback]" etc.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Section } from '@/data/questions'
import {
  __resetSchedulerStorage,
  type DailyPlan,
  generateDailyPlan,
  isAllMastered,
  loadLessonReads,
  loadPlan,
  localDateString,
  markItemComplete,
  markLessonRead,
  type SchedulerSignals,
  savePlan,
} from './scheduler'
import type { SectionScore } from './scoring'

const NOW = new Date(2026, 4, 18) // 2026-05-18 local; month is 0-indexed
const TODAY = '2026-05-18'

function score(section: Section, overrides: Partial<SectionScore> = {}): SectionScore {
  return {
    section,
    score: 1.5,
    trend: 0,
    confidence: 'high',
    daysSinceLastAttempt: 1,
    avgTimeMs: 30_000,
    attempts7d: 10,
    attempts90d: 40,
    ...overrides,
  }
}

function emptyScore(section: Section): SectionScore {
  return {
    section,
    score: null,
    trend: null,
    confidence: 'low',
    daysSinceLastAttempt: Number.POSITIVE_INFINITY,
    avgTimeMs: null,
    attempts7d: 0,
    attempts90d: 0,
  }
}

function signals(overrides: Partial<SchedulerSignals> = {}): SchedulerSignals {
  return {
    now: NOW,
    sectionScores: [],
    dueMistakeCount: 0,
    ...overrides,
  }
}

describe('localDateString', () => {
  it('formats a Date as YYYY-MM-DD using local calendar fields', () => {
    expect(localDateString(new Date(2026, 0, 3))).toBe('2026-01-03')
    expect(localDateString(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('generateDailyPlan — rule 5 (cold start)', () => {
  it('emits a single diagnostic item when no signal exists at all', () => {
    const plan = generateDailyPlan(signals())
    expect(plan.items).toHaveLength(1)
    expect(plan.items[0]).toMatchObject({
      kind: 'drill',
      headline: expect.stringContaining('Diagnos'),
      href: '/diagnostik',
      section: null,
    })
  })

  it('does NOT trigger cold start when reps exist but scores are all null', () => {
    // A returning user with stale reps but no recent attempts still
    // needs to clear the queue — don't reroute them to a diagnostic.
    const plan = generateDailyPlan(
      signals({ dueMistakeCount: 2, sectionScores: [emptyScore('KVA')] }),
    )
    expect(plan.items[0].kind).toBe('repetition')
  })
})

describe('generateDailyPlan — rule 1 (due repetitions)', () => {
  it('puts repetition first when due > 0', () => {
    const plan = generateDailyPlan(
      signals({
        dueMistakeCount: 3,
        sectionScores: [score('NOG', { score: 1.2, daysSinceLastAttempt: 11 })],
      }),
    )
    expect(plan.items[0].kind).toBe('repetition')
    expect(plan.items[0].headline).toBe('Repetition · 3 missar')
    expect(plan.items[0].estimatedMinutes).toBe(3)
  })

  it('uses singular Swedish noun when count is 1', () => {
    const plan = generateDailyPlan(
      signals({
        dueMistakeCount: 1,
        sectionScores: [score('NOG', { score: 1.2 })],
      }),
    )
    expect(plan.items[0].headline).toBe('Repetition · 1 miss')
    expect(plan.items[0].rationale).toContain('1 miss väntar')
  })

  it('clamps estimatedMinutes to ≥1', () => {
    const plan = generateDailyPlan(
      signals({
        dueMistakeCount: 0, // never reached, defensive
        sectionScores: [score('NOG', { score: 1.0 })],
      }),
    )
    // Should fall through past rule 1 — no rep item present.
    expect(plan.items.find((i) => i.kind === 'repetition')).toBeUndefined()
  })
})

describe('generateDailyPlan — rule 2 (weakest needs a lesson)', () => {
  it('emits a lesson when weakest section has score < 1.4', () => {
    const plan = generateDailyPlan(
      signals({
        sectionScores: [
          score('NOG', { score: 1.1, daysSinceLastAttempt: 2 }),
          score('KVA', { score: 1.7 }),
        ],
      }),
    )
    const lesson = plan.items.find((i) => i.kind === 'lesson')
    expect(lesson).toBeDefined()
    expect(lesson?.section).toBe('NOG')
    expect(lesson?.href).toBe('/lektion?section=NOG')
    expect(lesson?.rationale).toContain('1.1')
  })

  it('emits a lesson when weakest is stale (>7d) even if score is fine', () => {
    const plan = generateDailyPlan(
      signals({
        sectionScores: [
          score('NOG', { score: 1.6, daysSinceLastAttempt: 11 }),
          score('KVA', { score: 1.7, daysSinceLastAttempt: 2 }),
        ],
      }),
    )
    const lesson = plan.items.find((i) => i.kind === 'lesson')
    expect(lesson?.section).toBe('NOG')
    expect(lesson?.rationale).toContain('11 dagar')
  })

  it('uses the framework hint headword when provided', () => {
    const plan = generateDailyPlan(
      signals({
        sectionScores: [score('NOG', { score: 1.1 })],
        firstUnreadEntry: { NOG: { id: 'NOG-TRAP-001', headword: '2×2-tabellen' } },
      }),
    )
    const lesson = plan.items.find((i) => i.kind === 'lesson')
    expect(lesson?.headline).toBe('NOG-lektion · 2×2-tabellen')
    expect(lesson?.framework).toBe('NOG-TRAP-001')
  })

  it('skips the lesson item when the framework hint is null (all read)', () => {
    const plan = generateDailyPlan(
      signals({
        sectionScores: [score('NOG', { score: 1.1 }), score('KVA', { score: 1.6 })],
        firstUnreadEntry: { NOG: null },
      }),
    )
    expect(plan.items.find((i) => i.kind === 'lesson')).toBeUndefined()
    // But the KVA drill should still appear from rule 3.
    expect(plan.items.find((i) => i.kind === 'drill')).toBeDefined()
  })

  it('skips lesson when weakest is strong AND recent (rule 2 gate fails)', () => {
    const plan = generateDailyPlan(
      signals({
        sectionScores: [
          score('KVA', { score: 1.6, daysSinceLastAttempt: 3 }),
          score('NOG', { score: 1.7, daysSinceLastAttempt: 2 }),
        ],
      }),
    )
    expect(plan.items.find((i) => i.kind === 'lesson')).toBeUndefined()
  })
})

describe('generateDailyPlan — rule 3 (next-weakest needs a drill)', () => {
  it('emits a drill on the second-weakest section', () => {
    const plan = generateDailyPlan(
      signals({
        sectionScores: [
          score('NOG', { score: 1.1 }),
          score('KVA', { score: 1.4 }),
          score('ORD', { score: 1.9 }),
        ],
      }),
    )
    const drill = plan.items.find((i) => i.kind === 'drill')
    expect(drill?.section).toBe('KVA')
    expect(drill?.href).toBe('/drill?section=KVA')
  })

  it('uses the trend-down rationale when trend < -5%', () => {
    const plan = generateDailyPlan(
      signals({
        sectionScores: [score('NOG', { score: 1.1 }), score('KVA', { score: 1.6, trend: -0.12 })],
      }),
    )
    const drill = plan.items.find((i) => i.kind === 'drill')
    expect(drill?.rationale).toContain('trendat nedåt')
  })

  it('skips the drill when next-weakest is strong, recent, and flat', () => {
    const plan = generateDailyPlan(
      signals({
        sectionScores: [
          score('NOG', { score: 1.1 }), // triggers lesson
          score('KVA', { score: 1.9, daysSinceLastAttempt: 3 }), // skip drill
        ],
      }),
    )
    expect(plan.items.find((i) => i.kind === 'lesson')).toBeDefined()
    expect(plan.items.find((i) => i.kind === 'drill')).toBeUndefined()
  })
})

describe('generateDailyPlan — rule 4 (mastery maintenance)', () => {
  it('emits a mixed drill when all sections are >1.8 and recent', () => {
    const plan = generateDailyPlan(
      signals({
        sectionScores: [
          score('ORD', { score: 1.9 }),
          score('LÄS', { score: 1.95 }),
          score('NOG', { score: 1.85 }),
          score('KVA', { score: 1.9 }),
        ],
      }),
    )
    expect(plan.items).toHaveLength(1)
    expect(plan.items[0].headline).toContain('Blandad')
    expect(plan.items[0].section).toBeNull()
  })

  it('does NOT fire when a repetition already filled the plan', () => {
    const plan = generateDailyPlan(
      signals({
        dueMistakeCount: 2,
        sectionScores: [score('ORD', { score: 1.95 }), score('LÄS', { score: 1.9 })],
      }),
    )
    expect(plan.items).toHaveLength(1)
    expect(plan.items[0].kind).toBe('repetition')
  })
})

describe('generateDailyPlan — long break (14+ days)', () => {
  it('replaces lesson + drill with a single warm-up on strongest section', () => {
    const plan = generateDailyPlan(
      signals({
        sectionScores: [
          score('NOG', { score: 1.1, daysSinceLastAttempt: 20 }),
          score('KVA', { score: 1.4, daysSinceLastAttempt: 18 }),
          score('ORD', { score: 1.9, daysSinceLastAttempt: 17 }),
        ],
      }),
    )
    // Just the warm-up drill — no lesson, no second drill.
    expect(plan.items).toHaveLength(1)
    expect(plan.items[0].kind).toBe('drill')
    expect(plan.items[0].section).toBe('ORD')
    expect(plan.items[0].headline).toContain('uppvärmning')
  })

  it('still emits repetitions when the long-break user has due reps', () => {
    const plan = generateDailyPlan(
      signals({
        dueMistakeCount: 4,
        sectionScores: [
          score('NOG', { score: 1.1, daysSinceLastAttempt: 20 }),
          score('ORD', { score: 1.9, daysSinceLastAttempt: 17 }),
        ],
      }),
    )
    expect(plan.items).toHaveLength(2)
    expect(plan.items[0].kind).toBe('repetition')
    expect(plan.items[1].headline).toContain('uppvärmning')
  })
})

describe('generateDailyPlan — full plan shape + 3-item cap', () => {
  it('caps at 3 items even when more signals exist', () => {
    const plan = generateDailyPlan(
      signals({
        dueMistakeCount: 5,
        sectionScores: [
          score('NOG', { score: 0.9 }),
          score('KVA', { score: 1.2, trend: -0.1 }),
          score('XYZ', { score: 1.3, trend: -0.08 }),
          score('DTK', { score: 1.4, trend: -0.06 }),
        ],
      }),
    )
    expect(plan.items.length).toBeLessThanOrEqual(3)
    expect(plan.items[0].kind).toBe('repetition')
    expect(plan.items[1].kind).toBe('lesson')
    expect(plan.items[2].kind).toBe('drill')
  })

  it('sums estimatedMinutes across not-yet-completed items', () => {
    const plan = generateDailyPlan(
      signals({
        dueMistakeCount: 3, // 3 min
        sectionScores: [
          score('NOG', { score: 1.1 }), // lesson 5 min
          score('KVA', { score: 1.4 }), // drill 6 min
        ],
      }),
    )
    expect(plan.estimatedMinutes).toBe(3 + 5 + 6)
  })

  it('produces stable item ids that include the date', () => {
    const plan = generateDailyPlan(
      signals({
        dueMistakeCount: 2,
        sectionScores: [score('NOG', { score: 1.0 }), score('KVA', { score: 1.5 })],
      }),
    )
    expect(plan.items[0].id).toBe(`rep-${TODAY}`)
    expect(plan.items[1].id).toBe(`lesson-NOG-${TODAY}`)
    expect(plan.items[2].id).toBe(`drill-KVA-${TODAY}`)
  })

  it('stamps the plan with the local-date string', () => {
    const plan = generateDailyPlan(signals({ now: new Date(2026, 0, 7) }))
    expect(plan.date).toBe('2026-01-07')
  })
})

describe('isAllMastered', () => {
  it('returns true when every scored section is ≥1.8', () => {
    expect(isAllMastered([score('ORD', { score: 1.8 }), score('LÄS', { score: 1.95 })])).toBe(true)
  })

  it('returns false when any scored section is below 1.8', () => {
    expect(isAllMastered([score('ORD', { score: 1.8 }), score('NOG', { score: 1.7 })])).toBe(false)
  })

  it('returns false when no section has a score', () => {
    expect(isAllMastered([emptyScore('ORD')])).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Storage tests use a fresh fake Storage per test so they're isolated
// from each other and from any real localStorage in the test runner.
// ---------------------------------------------------------------------------

function fakeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    key(i: number) {
      return Array.from(map.keys())[i] ?? null
    },
    getItem(k: string) {
      return map.get(k) ?? null
    },
    setItem(k: string, v: string) {
      map.set(k, v)
    },
    removeItem(k: string) {
      map.delete(k)
    },
    clear() {
      map.clear()
    },
  }
}

describe('savePlan + loadPlan round-trip', () => {
  it('writes and reads back the same plan', () => {
    const storage = fakeStorage()
    const plan = generateDailyPlan(
      signals({ dueMistakeCount: 2, sectionScores: [score('NOG', { score: 1.0 })] }),
    )
    savePlan(plan, storage)
    expect(loadPlan(plan.date, storage)).toEqual(plan)
  })

  it('returns null when no plan exists for that date', () => {
    expect(loadPlan(TODAY, fakeStorage())).toBeNull()
  })

  it('returns null for a malformed plan blob', () => {
    const storage = fakeStorage()
    storage.setItem(`hpc-daily-plan-${TODAY}`, '{not json')
    expect(loadPlan(TODAY, storage)).toBeNull()
  })
})

describe('savePlan — prune old plans', () => {
  it('removes plan keys older than 30 days when a new plan is written', () => {
    const storage = fakeStorage()
    const today: DailyPlan = { date: TODAY, items: [], estimatedMinutes: 0 }
    const old: DailyPlan = { date: '2026-04-01', items: [], estimatedMinutes: 0 }
    storage.setItem('hpc-daily-plan-2026-04-01', JSON.stringify(old))
    storage.setItem('hpc-daily-plan-2026-05-01', JSON.stringify({ ...old, date: '2026-05-01' }))
    savePlan(today, storage)
    expect(storage.getItem('hpc-daily-plan-2026-04-01')).toBeNull()
    // 17 days back is inside the retention window — kept.
    expect(storage.getItem('hpc-daily-plan-2026-05-01')).not.toBeNull()
    expect(storage.getItem(`hpc-daily-plan-${TODAY}`)).not.toBeNull()
  })
})

describe('markItemComplete', () => {
  it('flips the completed flag and rewrites estimatedMinutes', () => {
    const storage = fakeStorage()
    const plan = generateDailyPlan(
      signals({ dueMistakeCount: 3, sectionScores: [score('NOG', { score: 1.0 })] }),
    )
    savePlan(plan, storage)
    const next = markItemComplete(plan.date, `rep-${plan.date}`, storage)
    expect(next).not.toBeNull()
    const rep = next!.items.find((i) => i.id === `rep-${plan.date}`)!
    expect(rep.completed).toBe(true)
    // 3 min rep is now complete; remaining = lesson 5 min only.
    expect(next!.estimatedMinutes).toBe(5)
  })

  it('returns null when the date has no plan', () => {
    expect(markItemComplete(TODAY, 'rep-anything', fakeStorage())).toBeNull()
  })
})

describe('loadLessonReads + markLessonRead', () => {
  it('returns an empty set when nothing has been read', () => {
    expect(loadLessonReads(fakeStorage()).size).toBe(0)
  })

  it('round-trips entry ids', () => {
    const storage = fakeStorage()
    markLessonRead('NOG-TRAP-001', storage)
    markLessonRead('KVA-TRAP-004', storage)
    const reads = loadLessonReads(storage)
    expect(reads.has('NOG-TRAP-001')).toBe(true)
    expect(reads.has('KVA-TRAP-004')).toBe(true)
    expect(reads.has('NOG-TRAP-002')).toBe(false)
  })
})

describe('__resetSchedulerStorage', () => {
  let storage: Storage
  beforeEach(() => {
    storage = fakeStorage()
    storage.setItem('hpc-daily-plan-2026-05-18', '{}')
    storage.setItem('hpc-lesson-read-NOG-TRAP-001', '1')
    storage.setItem('unrelated-key', 'leave-me-alone')
  })
  afterEach(() => {
    __resetSchedulerStorage(storage)
  })
  it('removes plan + lesson-read keys but leaves unrelated keys alone', () => {
    __resetSchedulerStorage(storage)
    expect(storage.getItem('hpc-daily-plan-2026-05-18')).toBeNull()
    expect(storage.getItem('hpc-lesson-read-NOG-TRAP-001')).toBeNull()
    expect(storage.getItem('unrelated-key')).toBe('leave-me-alone')
  })
})
