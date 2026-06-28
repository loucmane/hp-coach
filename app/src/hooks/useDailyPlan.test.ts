// useDailyPlan completion-derivation tests.
//
// Cross-device completion: section=null items (mastery, cold-start) — which
// have no per-section attempts signal — complete from the SERVER lifetime
// counter `attempts.total` (monotonic, identical on every device), snapshotted
// into the plan at generation. This is what lets an all-mastered 2.0-seeker
// reach `allComplete`, cross-device, without a device-local flag.

import { describe, expect, it } from 'vitest'

import type { Section } from '@/data/questions'
import { type DailyPlan, PLAN_SCHEMA_VERSION, type PlanItem } from '@/lib/scheduler'
import type { SectionStats } from '@/lib/scoring'
import { deriveCompletion, isItemComplete } from './useDailyPlan'

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

describe('deriveCompletion — allComplete reachable for an all-mastered plan (F1)', () => {
  it('flips the section=null item to completed once total grew, so allComplete is reachable', () => {
    const item = masteryItem()
    const plan = planWith([item], 100)
    const next = deriveCompletion(plan, 0, new Set(), EMPTY_BY_SECTION, 106)
    expect(next.items[0].completed).toBe(true)
    expect(next.items.every((i) => i.completed)).toBe(true)
  })
})
