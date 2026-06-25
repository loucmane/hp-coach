// useDailyPlan completion-derivation tests.
//
// The load-bearing F1 behaviour: completion is REPORTED (a finished session
// flags the plan item), not only DERIVED from noisy signals. This is what lets
// section=null items (mastery, cold-start) — which have no per-section attempts
// signal — ever reach `allComplete` for an all-mastered 2.0-seeker.

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

function planWith(items: PlanItem[]): DailyPlan {
  return {
    version: PLAN_SCHEMA_VERSION,
    date: '2026-05-18',
    items,
    estimatedMinutes: items.reduce((s, i) => s + i.estimatedMinutes, 0),
  }
}

describe('isItemComplete — reported-done flag (F1)', () => {
  it('leaves a section=null mastery drill incomplete when nothing reported it (the old bug)', () => {
    const item = masteryItem()
    const plan = planWith([item])
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, new Set())).toBe(false)
  })

  it('completes a section=null mastery drill once its id is reported done', () => {
    const item = masteryItem()
    const plan = planWith([item])
    const done = new Set([item.id])
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, done)).toBe(true)
  })

  it('does not complete the mastery item when a DIFFERENT item id is reported done', () => {
    const item = masteryItem()
    const plan = planWith([item])
    const done = new Set(['rep-2026-05-18'])
    expect(isItemComplete(item, plan, 0, new Set(), EMPTY_BY_SECTION, done)).toBe(false)
  })
})

describe('deriveCompletion — allComplete reachable for an all-mastered plan (F1)', () => {
  it('flips a reported section=null item to completed so allComplete becomes reachable', () => {
    const item = masteryItem()
    const plan = planWith([item])
    const done = new Set([item.id])
    const next = deriveCompletion(plan, 0, new Set(), EMPTY_BY_SECTION, done)
    expect(next.items[0].completed).toBe(true)
    expect(next.items.every((i) => i.completed)).toBe(true)
  })
})
