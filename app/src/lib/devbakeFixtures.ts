// Mock data for /loop-bakeoff — the loop-polish variant gallery.
//
// Each variant component imports from here so the bake-off renders at
// production fidelity without needing the live `/api/me/stats` round-
// trip or a real drill in progress. Numbers are deliberately realistic
// (not "lorem 12/15"): the dogfood user judges typography + composition
// AT REAL DATA SHAPES.
//
// Lives in app/src/lib/ instead of devbake/ so individual variant
// components share one import, and so tree-shaking in production builds
// can drop the whole module if no production code imports it (only the
// dev-gated route does).

import type { AnswerLetter, Question, Section } from '@/data/questions'
import { type DailyPlan, PLAN_SCHEMA_VERSION, type PlanItem } from '@/lib/scheduler'

// ── DrillSummary fixture ────────────────────────────────────────────
//
// 15-question KVA drill with 3 misses (12/15 — mirrors the original
// prototype's '12/15' stats card row). Each Question is a minimal stub
// — the variants only render q.prompt, q.answer, q.options on the miss
// list, so we don't need the full Question shape filled out.

function stubQuestion(
  qid: string,
  section: Section,
  number: number,
  prompt: string,
  answer: AnswerLetter,
  optionTexts: string[],
): Question {
  return {
    qid,
    exam_id: 'host-2024',
    provpass: 'kvant2',
    section,
    number,
    prompt,
    options: optionTexts.map((text, i) => ({
      letter: (['A', 'B', 'C', 'D', 'E'] as AnswerLetter[])[i],
      text,
    })),
    answer,
    context: null,
    parsing_status: 'complete',
  }
}

const KVA_MISS_1 = stubQuestion(
  'host-2024-kvant2-KVA-008',
  'KVA',
  8,
  'a > 0   ·   Kvantitet I:  (a + 1)²   ·   Kvantitet II:  a² + 1',
  'A',
  ['I är större än II', 'II är större än I', 'I är lika med II', 'informationen är otillräcklig'],
)

const KVA_MISS_2 = stubQuestion(
  'host-2024-kvant2-KVA-011',
  'KVA',
  11,
  'x² = 9   ·   Kvantitet I:  x   ·   Kvantitet II:  3',
  'D',
  ['I är större än II', 'II är större än I', 'I är lika med II', 'informationen är otillräcklig'],
)

const KVA_MISS_3 = stubQuestion(
  'host-2024-kvant2-KVA-014',
  'KVA',
  14,
  '0 < a < b   ·   Kvantitet I:  b/a   ·   Kvantitet II:  (b−a)/a + 1',
  'C',
  ['I är större än II', 'II är större än I', 'I är lika med II', 'informationen är otillräcklig'],
)

const KVA_HITS = Array.from({ length: 12 }, (_, i) =>
  stubQuestion(
    `host-2024-kvant2-KVA-${String(i + 1).padStart(3, '0')}-hit`,
    'KVA',
    i + 1,
    'placeholder',
    'A',
    ['I', 'II', 'lika', 'otillräcklig'],
  ),
)

const ALL_QUESTIONS = [...KVA_HITS, KVA_MISS_1, KVA_MISS_2, KVA_MISS_3]
const ALL_PICKS: (AnswerLetter | null)[] = [
  ...Array.from({ length: 12 }, () => 'A' as AnswerLetter), // 12 correct
  'B', // miss 1 — chose B, correct was A
  'A', // miss 2 — chose A, correct was D
  'B', // miss 3 — chose B, correct was C
]

export const FIXTURE_DRILL_SUMMARY = {
  questions: ALL_QUESTIONS,
  picks: ALL_PICKS,
}

// ── DailyPlan fixture ───────────────────────────────────────────────
//
// 4-item plan: 2 completed, 2 pending. Mid-day shape — the user has
// done morning rep + the day's lesson, has a drill + a second drill
// queued. This lets Sigil variants render with a meaningful "halfway"
// state, not 0/4 or 4/4.

const FIXTURE_DATE = '2026-05-26'

const FIXTURE_PLAN_ITEMS: PlanItem[] = [
  {
    id: `rep-${FIXTURE_DATE}`,
    kind: 'repetition',
    section: null,
    headline: 'Repetition · 8 missar',
    rationale: '8 missar denna session — de äldsta först.',
    estimatedMinutes: 6,
    href: '/repetition',
    completed: true,
  },
  {
    id: `lesson-XYZ-${FIXTURE_DATE}`,
    kind: 'lesson',
    section: 'XYZ',
    headline: 'XYZ-lektion · Distribuera ett minustecken',
    rationale: 'Svagast section — 0.84, börja med lektionen.',
    estimatedMinutes: 5,
    href: '/lektion?section=XYZ',
    completed: true,
  },
  {
    id: `drill-XYZ-${FIXTURE_DATE}`,
    kind: 'drill',
    section: 'XYZ',
    headline: 'XYZ-drill · 10 frågor',
    rationale: 'Drilla mönstret du just läste.',
    estimatedMinutes: 8,
    href: '/drill?section=XYZ',
    completed: false,
  },
  {
    id: `drill-ORD-${FIXTURE_DATE}`,
    kind: 'drill',
    section: 'ORD',
    headline: 'ORD-drill · 10 frågor',
    rationale: 'ORD-resultat har trendat nedåt.',
    estimatedMinutes: 3,
    href: '/drill?section=ORD',
    completed: false,
  },
]

export const FIXTURE_PLAN: DailyPlan = {
  version: PLAN_SCHEMA_VERSION,
  date: FIXTURE_DATE,
  estimatedMinutes: FIXTURE_PLAN_ITEMS.reduce((n, i) => n + i.estimatedMinutes, 0),
  items: FIXTURE_PLAN_ITEMS,
}

// Also expose an all-complete variant so HomeSigil variants can show
// their "closed" flourish state.
export const FIXTURE_PLAN_ALL_COMPLETE: DailyPlan = {
  ...FIXTURE_PLAN,
  items: FIXTURE_PLAN_ITEMS.map((i) => ({ ...i, completed: true })),
}

// ── Score delta fixture (for Payoff Variant C) ─────────────────────

export const FIXTURE_SCORE_DELTA = {
  section: 'KVA' as Section,
  before: 1.86,
  after: 1.89,
}

// ── Heat-strip fixture ─────────────────────────────────────────────
//
// 84 days of daily attempt counts. The shape mimics the dogfood user's
// real pattern from this session: a long ORD-heavy streak with one
// 3-day gap (a weekend trip), recovery, then a steady recent week.
// Tomorrow = today + 0, yesterday = today - 1, etc.

export type HeatDay = { date: string; n: number }

function dailyFixture(): HeatDay[] {
  const out: HeatDay[] = []
  const now = new Date(2026, 4, 26) // 26 May 2026
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    // Pattern: dense recent (last 14d), 3-day gap around day 30, then
    // medium-density before that.
    let n = 0
    if (i <= 14)
      n = 8 + Math.floor((i * 7) % 13) // recent dense, varies 8–20
    else if (i >= 28 && i <= 30)
      n = 0 // gap (weekend trip)
    else if (i <= 35)
      n = 12 + (i % 5) // strong before the gap
    else if (i <= 60)
      n = 5 + (i % 6) // medium
    else n = (i * 3) % 8 // sparser farther back, some zero days
    // Drop ~15% to zero so the heatmap shows real gaps
    if ((i * 7) % 13 === 0 && i > 14) n = 0
    out.push({ date: iso, n })
  }
  return out
}

export const FIXTURE_HEAT_DAYS = dailyFixture()

// ── Section-display name for the payoff delta band ─────────────────

export const SECTION_DISPLAY_NAMES: Record<Section, string> = {
  ORD: 'ORD · ordförståelse',
  LÄS: 'LÄS · läsförståelse',
  MEK: 'MEK · meningskomplettering',
  ELF: 'ELF · english reading',
  XYZ: 'XYZ · matematisk problemlösning',
  KVA: 'KVA · kvantitativa jämförelser',
  NOG: 'NOG · datasufficiens',
  DTK: 'DTK · diagram, tabeller, kartor',
}
