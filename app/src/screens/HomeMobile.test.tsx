// HomeMobile — tests pin the B3.2 prescriptive composition:
//
//   - Plan is null while resolving → skeleton state
//   - Plan provided → DailyPlanCard rendered with the items
//   - allComplete → "Klart för idag" panel
//   - Streak badge logic preserved (chrome, not part of the plan flow)
//   - No regenerate affordance (the daily plan is authoritative)

import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetMockEvents, loadMockEvents } from '@/lib/mockEvents'
import { type DailyPlan, type MockPrescription, PLAN_SCHEMA_VERSION } from '@/lib/scheduler'
import { HomeMobile } from './HomeMobile'

// HomeMobile is prop-driven in these tests (no QueryClient / Clerk
// providers). The resumption surfaces read server state via this hook,
// so stub it to "nothing resumable" — resumption rendering is covered by
// the cross-device Playwright drive, not here.
vi.mock('@/components/home/useResumptionCandidate', () => ({
  useResumptionCandidate: () => null,
  pickCandidate: () => null,
}))

function makePlan(overrides: Partial<DailyPlan> = {}): DailyPlan {
  return {
    version: PLAN_SCHEMA_VERSION,
    date: '2026-05-18',
    // Sum of the not-completed items below (3 + 5 + 6). The plan card's
    // margin recomputes from the visible rows rather than echoing this
    // field (so a mock item's minutes never leak into a list that renders
    // it as the Kallelse), so keep the fixture internally consistent.
    estimatedMinutes: 14,
    items: [
      {
        id: 'rep-2026-05-18',
        kind: 'repetition',
        section: null,
        headline: 'Repetition · 3 missar',
        rationale: 'Gör dem först — de förlorar effekt om de väntar.',
        estimatedMinutes: 3,
        href: '/repetition',
        completed: false,
      },
      {
        id: 'lesson-NOG-2026-05-18',
        kind: 'lesson',
        section: 'NOG',
        headline: 'NOG-lektion',
        rationale: 'Svagast section — 1.2, börja med lektionen.',
        estimatedMinutes: 5,
        href: '/lektion/NOG',
        completed: false,
      },
      {
        id: 'drill-KVA-2026-05-18',
        kind: 'drill',
        section: 'KVA',
        headline: 'KVA-drill · 10 frågor',
        rationale: 'KVA-resultat har trendat nedåt.',
        estimatedMinutes: 6,
        href: '/drill?section=KVA',
        completed: false,
      },
    ],
    ...overrides,
  }
}

describe('HomeMobile — plan rendering', () => {
  it('renders the skeleton state when no plan is provided', () => {
    render(<HomeMobile forceLayout="phone" />)
    expect(screen.getByTestId('daily-plan-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('daily-plan-card')).not.toBeInTheDocument()
  })

  it('renders the DailyPlanCard with each plan item when a plan is provided', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} />)
    expect(screen.getByTestId('daily-plan-card')).toBeInTheDocument()
    // The ProgressSigil's zero-state marginalia also renders the first
    // pending item's headline ("Börja med: Repetition · 3 missar"), so
    // scope the plan-row assertion to the DailyPlanCard instead of a
    // bare getByText — otherwise "Repetition · 3 missar" matches twice.
    const planCard = screen.getByTestId('daily-plan-card')
    expect(within(planCard).getByText('Repetition · 3 missar')).toBeInTheDocument()
    expect(within(planCard).getByText('NOG-lektion')).toBeInTheDocument()
    expect(within(planCard).getByText('KVA-drill · 10 frågor')).toBeInTheDocument()
  })

  it('shows the total estimated minutes in the plan rail with the "uppskattat" qualifier', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} />)
    // M3H: the plan section's margin rail carries "Idag" + "~N min ·
    // uppskattat" — the qualifier sets expectation that the total is
    // heuristic, not a measured commitment. The value is the sum of the
    // visible numbered rows (3 + 5 + 6).
    expect(screen.getByText(/~14 min · uppskattat/i)).toBeInTheDocument()
  })

  it('renders the "Klart för idag" complete panel when allComplete is true', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} allComplete />)
    expect(screen.getByTestId('daily-plan-complete')).toBeInTheDocument()
    expect(screen.getByText(/perfect game/i)).toBeInTheDocument()
    expect(screen.queryByTestId('daily-plan-card')).not.toBeInTheDocument()
  })

  it('hides "Dagens plan" entirely on a mock-only day (the Kallelse IS the plan)', () => {
    // A pure provpass-dag: the plan's only item is the mock, which renders
    // as the Kallelse summons above — filtering it out of the card's rows
    // would otherwise leave a bare "Dagens plan" heading over an empty list.
    render(<HomeMobile forceLayout="phone" plan={mockPlan()} />)
    expect(screen.getByTestId('kallelse-start')).toBeInTheDocument()
    expect(screen.queryByTestId('daily-plan-card')).not.toBeInTheDocument()
  })

  it('hides the Kallelse once the mock item is completed (pass done — no re-summons)', () => {
    // After the user finishes the prescribed pass, the plan's mock item
    // auto-completes (isItemComplete, mockHistory-derived). A completed
    // summons must not keep shouting STARTA on the same Home.
    const plan = mockPlan()
    plan.items = plan.items.map((i) => ({ ...i, completed: true }))
    render(<HomeMobile forceLayout="phone" plan={plan} />)
    expect(screen.queryByTestId('kallelse-start')).not.toBeInTheDocument()
  })
})

describe('HomeMobile — stats row (M3H)', () => {
  // The old mono score line is replaced by M3's stats row: a big
  // Swedish-comma prognosis ("1,4 / prognos av 2,0"), the honest
  // week-over-week delta when it exists, streak, and today's minutes.
  // `home-score-line` now identifies the prognosis stat; the null-gate
  // is preserved (no signal → no faked number).
  it('hides the prognosis stat when projected is null (cold-start / loading)', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} projected={null} />)
    expect(screen.queryByTestId('home-score-line')).not.toBeInTheDocument()
  })

  it('hides the prognosis stat when both halves are null', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        projected={{ total: null, verbal: null, quant: null }}
      />,
    )
    expect(screen.queryByTestId('home-score-line')).not.toBeInTheDocument()
  })

  it('renders the Swedish-comma prognosis when there is signal', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        projected={{ total: 0.65, verbal: 0.81, quant: 0.49 }}
      />,
    )
    const stat = screen.getByTestId('home-score-line')
    expect(stat).toHaveTextContent('0,7')
    expect(stat).toHaveTextContent(/prognos av 2,0/i)
  })

  it('renders the honest week delta only when provided, labeled sedan förra veckan', () => {
    const { rerender } = render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        projected={{ total: 0.65, verbal: 0.81, quant: 0.49 }}
        projectedDelta={0.12}
      />,
    )
    expect(screen.getByText(/\+0,1 sedan förra veckan/)).toBeInTheDocument()
    rerender(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        projected={{ total: 0.65, verbal: 0.81, quant: 0.49 }}
        projectedDelta={null}
      />,
    )
    expect(screen.queryByText(/sedan förra veckan/)).not.toBeInTheDocument()
  })

  it('renders prognos and minutes stats, no streak — even when streakDays is passed', () => {
    // V4A FINAL ships exactly 2 stats (prognos + min idag); the streak
    // stat is removed for good (no-streak-shame product rule — see
    // dev/nav-cta-bakeoff's V4 caption). streakDays is still accepted as
    // a prop (MobileFrame chrome may consume it independently), but it
    // must never resurrect the inline "dagar i rad" stat.
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        projected={{ total: 0.65, verbal: 0.81, quant: 0.49 }}
        streakDays={12}
      />,
    )
    expect(screen.queryByText('dagar i rad')).not.toBeInTheDocument()
    expect(screen.getByText('min idag')).toBeInTheDocument()
    expect(screen.getByTestId('home-score-line')).toBeInTheDocument()
  })
})

// Diagnostic-memory in-Home block removed by home-bakeoff B pick —
// the affordance now lives on /diagnostik itself. Tests pinning the
// in-Home memory line are deleted; the prop is still accepted by the
// HomeMobile signature for caller compatibility but the render is a
// no-op until the affordance returns somewhere.

describe('HomeMobile — top traps', () => {
  it('shows the quiet single-line invitation (not the boxed card) when no traps qualify', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} topTraps={[]} />)
    expect(screen.queryByTestId('home-top-traps')).not.toBeInTheDocument()
    expect(screen.getByTestId('home-top-traps-empty')).toBeInTheDocument()
  })

  it('renders trap rows with id, headline, and miss count when present', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        topTraps={[
          {
            framework_id: 'NOG-TRAP-007',
            section: 'NOG',
            count: 4,
            headline: 'Statement (2) ger ingen ny information.',
            trend: { kind: 'unknown' },
          },
          {
            framework_id: 'KVA-TRAP-001',
            section: 'KVA',
            count: 2,
            headline: 'Kvadratlikhet låser inte tecknet — x² = y² öppnar både x = y och x = −y.',
            trend: { kind: 'unknown' },
          },
        ]}
      />,
    )
    const card = screen.getByTestId('home-top-traps')
    expect(card).toHaveTextContent('NOG-TRAP-007')
    expect(card).toHaveTextContent('4 ggr')
    expect(card).toHaveTextContent('Statement (2) ger ingen ny information.')
    expect(card).toHaveTextContent('KVA-TRAP-001')
    expect(card).toHaveTextContent('2 ggr')
  })

  it('falls back to "Öva detta mönster" copy when headline is null', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        topTraps={[
          {
            framework_id: 'XYZ-TRAP-040',
            section: 'XYZ',
            count: 3,
            headline: null,
            trend: { kind: 'unknown' },
          },
        ]}
      />,
    )
    expect(screen.getByTestId('home-top-traps')).toHaveTextContent('Öva detta mönster')
  })

  it('renders trend arrow when delta is present', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        topTraps={[
          {
            framework_id: 'NOG-TRAP-007',
            section: 'NOG',
            count: 2,
            headline: 'x',
            trend: { kind: 'delta', delta: -2, daysAgo: 7 },
          },
        ]}
      />,
    )
    const chip = screen.getByTestId('trap-trend')
    expect(chip.getAttribute('data-trend')).toBe('down')
    expect(chip.textContent).toContain('↓')
    expect(chip.textContent).toContain('2')
  })

  it('renders "ny" when the trap is new this week', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        topTraps={[
          {
            framework_id: 'KVA-TRAP-024',
            section: 'KVA',
            count: 3,
            headline: 'x',
            trend: { kind: 'new' },
          },
        ]}
      />,
    )
    expect(screen.getByTestId('trap-trend')).toHaveTextContent('ny')
  })

  it('hides the trend chip when no history is available', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        topTraps={[
          {
            framework_id: 'NOG-TRAP-007',
            section: 'NOG',
            count: 4,
            headline: 'x',
            trend: { kind: 'unknown' },
          },
        ]}
      />,
    )
    expect(screen.queryByTestId('trap-trend')).not.toBeInTheDocument()
  })

  it('row link points to the framework-drill deep-link', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        topTraps={[
          {
            framework_id: 'NOG-TRAP-007',
            section: 'NOG',
            count: 4,
            headline: 'x',
            trend: { kind: 'unknown' },
          },
        ]}
      />,
    )
    const link = screen.getByTestId('top-trap-link') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/drill?framework=NOG-TRAP-007')
  })
})

describe('HomeMobile — greeting', () => {
  it('renders the time-of-day greeting', () => {
    // 09:00 local → "God morgon."
    render(<HomeMobile forceLayout="phone" plan={makePlan()} now={new Date(2026, 4, 18, 9)} />)
    expect(screen.getByTestId('home-greeting')).toHaveTextContent(/god morgon/i)
  })

  it('flips greeting after 14:00 to god eftermiddag', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} now={new Date(2026, 4, 18, 15)} />)
    expect(screen.getByTestId('home-greeting')).toHaveTextContent(/god eftermiddag/i)
  })
})

describe('HomeMobile — streak (chrome surface)', () => {
  // In-Home StreakBadge was removed by the home-bakeoff B pick; the
  // streak now surfaces only via MobileFrame's chrome (iOS-style
  // status bar). HomeMobile still threads `streakDays` through to
  // MobileFrame, so the prop wiring is preserved but the in-Home pill
  // tests are gone — they belonged to a deleted DOM node.
  it('does not render an inline streak pill on Home itself', () => {
    render(<HomeMobile forceLayout="phone" streakDays={12} />)
    expect(screen.queryByTestId('home-streak')).not.toBeInTheDocument()
  })
})

describe('HomeMobile — callbacks', () => {
  it('does NOT render a manual "Klar" button — completion is derived from signals', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} />)
    expect(screen.queryByTestId('daily-plan-mark-rep-2026-05-18')).not.toBeInTheDocument()
    expect(screen.queryByTestId('daily-plan-mark-lesson-NOG-2026-05-18')).not.toBeInTheDocument()
    expect(screen.queryByTestId('daily-plan-mark-drill-KVA-2026-05-18')).not.toBeInTheDocument()
  })

  // "Byt plan" / "Generera om" CTA removed — the plan is authoritative.
  // The useDailyPlan hook still exports a `regenerate` function for tests
  // and potential future use, but no user-facing button surfaces it.
  it('does not render a regenerate affordance', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} />)
    expect(screen.queryByTestId('daily-plan-regenerate')).not.toBeInTheDocument()
  })

  it('does not render a regenerate affordance in the complete state', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} allComplete />)
    expect(screen.queryByTestId('daily-plan-regenerate-complete')).not.toBeInTheDocument()
  })
})

// window_slid — fired once per day when the mock item is due AND it was
// already overdue more than one cadence interval ago (i.e. it silently
// slid past being due on an earlier day without a completed mock).
// Derived from mockPrescription.daysSinceLast vs .interval — see
// prescribeMock's cadence rules in @/lib/scheduler.
function mockPlan(): DailyPlan {
  return {
    version: PLAN_SCHEMA_VERSION,
    date: '2026-05-18',
    estimatedMinutes: 55,
    items: [
      {
        id: 'mock-2026-05-18',
        kind: 'mock',
        section: null,
        headline: 'Provpass · Verbal',
        rationale: '30 dagar sedan senaste — dags att mäta.',
        estimatedMinutes: 55,
        href: '/prov?half=verbal&prescribed=1',
        completed: false,
      },
    ],
  }
}

function prescription(overrides: Partial<MockPrescription> = {}): MockPrescription {
  return {
    due: true,
    half: 'verbal',
    daysSinceLast: 30,
    daysUntilNext: 0,
    interval: 14,
    ...overrides,
  }
}

describe('HomeMobile — window_slid instrumentation', () => {
  beforeEach(() => {
    __resetMockEvents()
    window.localStorage.clear()
  })

  it('logs window_slid when due and daysSinceLast > interval (genuinely slid)', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={mockPlan()}
        mockPrescription={prescription({ due: true, daysSinceLast: 30, interval: 14 })}
      />,
    )
    const events = loadMockEvents().filter((e) => e.type === 'window_slid')
    expect(events).toHaveLength(1)
    expect(events[0].meta).toEqual({ slidDays: 16 })
  })

  it('does NOT log window_slid when daysSinceLast is null (baseline, never mocked)', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={mockPlan()}
        mockPrescription={prescription({ due: true, daysSinceLast: null })}
      />,
    )
    expect(loadMockEvents().filter((e) => e.type === 'window_slid')).toHaveLength(0)
  })

  it('does NOT log window_slid when daysSinceLast <= interval (not stale beyond one window)', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={mockPlan()}
        mockPrescription={prescription({ due: true, daysSinceLast: 14, interval: 14 })}
      />,
    )
    expect(loadMockEvents().filter((e) => e.type === 'window_slid')).toHaveLength(0)
  })

  it('does NOT log window_slid when not due', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={mockPlan()}
        mockPrescription={prescription({ due: false, daysSinceLast: 30, interval: 14 })}
      />,
    )
    expect(loadMockEvents().filter((e) => e.type === 'window_slid')).toHaveLength(0)
  })

  it('does not double-log window_slid on rerender the same day', () => {
    const { rerender } = render(
      <HomeMobile
        forceLayout="phone"
        plan={mockPlan()}
        mockPrescription={prescription({ due: true, daysSinceLast: 30, interval: 14 })}
      />,
    )
    rerender(
      <HomeMobile
        forceLayout="phone"
        plan={mockPlan()}
        mockPrescription={prescription({ due: true, daysSinceLast: 30, interval: 14 })}
      />,
    )
    expect(loadMockEvents().filter((e) => e.type === 'window_slid')).toHaveLength(1)
  })
})
