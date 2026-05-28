// Fixtures for the Home bake-off variants.
//
// Mirrors the data shape the live Home consumes (DailyPlan + TopTrap[])
// so the bake-off renders at production fidelity without needing the
// live worker, stats round-trip, or scheduler-generation step.

import type { TopTrap } from '@/api/hooks/useTopTraps'
import { type DailyPlan, PLAN_SCHEMA_VERSION } from '@/lib/scheduler'

export const FIXTURE_TODAY = new Date('2026-05-27T15:00:00')

export const FIXTURE_PLAN: DailyPlan = {
  version: PLAN_SCHEMA_VERSION,
  date: '2026-05-27',
  estimatedMinutes: 16,
  items: [
    {
      id: 'rep-2026-05-27',
      kind: 'repetition',
      section: null,
      headline: 'Repetition · 10 av 100 missar',
      rationale: '10 av 100 missar denna session — de äldsta först.',
      estimatedMinutes: 8,
      href: '/repetition',
      completed: false,
    },
    {
      id: 'lesson-XYZ-2026-05-27',
      kind: 'lesson',
      section: 'XYZ',
      framework: 'XYZ-TRAP-016',
      headline: 'XYZ-lektion',
      rationale: 'Distribuera ett minustecken över ett uttryck inom parentes.',
      estimatedMinutes: 5,
      href: '/lektion/XYZ#XYZ-TRAP-016',
      completed: false,
    },
    {
      id: 'drill-ORD-2026-05-27',
      kind: 'drill',
      section: 'ORD',
      headline: 'ORD-drill · 10 frågor',
      rationale: 'Snabb runda för att hålla synonymflödet uppe.',
      estimatedMinutes: 3,
      href: '/drill?section=ORD',
      completed: false,
    },
  ],
}

export const FIXTURE_TOP_TRAPS: TopTrap[] = [
  {
    framework_id: 'XYZ-TRAP-016',
    section: 'XYZ',
    count: 3,
    headline: 'Bråkaddition kräver gemensam nämnare innan täljarna får adderas.',
    trend: { kind: 'delta', delta: 1, daysAgo: 7 },
  },
  {
    framework_id: 'ELF-TYPE-002',
    section: 'ELF',
    count: 2,
    headline: 'Slutsatsdragning / implikation — vad följer av texten?',
    trend: { kind: 'delta', delta: 0, daysAgo: 7 },
  },
  {
    framework_id: 'LAS-TYPE-001',
    section: 'LÄS',
    count: 2,
    headline: 'Direkt detalj — notera triggerfrasen, leta bara där.',
    trend: { kind: 'unknown' },
  },
]
