// HomeMobile — tests pin the B3.2 prescriptive composition:
//
//   - Plan is null while resolving → skeleton state
//   - Plan provided → DailyPlanCard rendered with the items
//   - allComplete → "Klart för idag" panel
//   - Streak badge logic preserved (chrome, not part of the plan flow)
//   - markComplete + regenerate callbacks fire from the card

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { type DailyPlan, PLAN_SCHEMA_VERSION } from '@/lib/scheduler'
import { HomeMobile } from './HomeMobile'

function makePlan(overrides: Partial<DailyPlan> = {}): DailyPlan {
  return {
    version: PLAN_SCHEMA_VERSION,
    date: '2026-05-18',
    estimatedMinutes: 18,
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

  it('shows the total estimated minutes in the eyebrow with the "uppskattat" qualifier', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} />)
    // "~N min · uppskattat" — the qualifier sets expectation that the
    // total is heuristic, not a measured commitment.
    expect(screen.getByText(/idag · ~18 min · uppskattat/i)).toBeInTheDocument()
  })

  it('renders the "Klart för idag" complete panel when allComplete is true', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} allComplete />)
    expect(screen.getByTestId('daily-plan-complete')).toBeInTheDocument()
    expect(screen.getByText(/perfect game/i)).toBeInTheDocument()
    expect(screen.queryByTestId('daily-plan-card')).not.toBeInTheDocument()
  })
})

describe('HomeMobile — score line', () => {
  it('hides the score line when projected is null (cold-start / loading)', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} projected={null} />)
    expect(screen.queryByTestId('home-score-line')).not.toBeInTheDocument()
  })

  it('hides the score line when both halves are null', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        projected={{ total: null, verbal: null, quant: null }}
      />,
    )
    expect(screen.queryByTestId('home-score-line')).not.toBeInTheDocument()
  })

  it('renders just-nu / verbal / kvant when any half has signal', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        projected={{ total: 0.65, verbal: 0.81, quant: 0.49 }}
      />,
    )
    const line = screen.getByTestId('home-score-line')
    expect(line).toHaveTextContent(/just nu · 0\.65 \/ 2\.0/i)
    expect(line).toHaveTextContent(/verbal 0\.81/i)
    expect(line).toHaveTextContent(/kvant 0\.49/i)
  })

  it('renders em-dash for missing halves but still shows the line', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        projected={{ total: null, verbal: 0.81, quant: null }}
      />,
    )
    const line = screen.getByTestId('home-score-line')
    expect(line).toHaveTextContent('verbal 0.81')
    expect(line).toHaveTextContent('kvant —')
  })
})

describe('HomeMobile — diagnostic memory', () => {
  it('hides the memory line when no diagnostic has run', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} diagnosticMemory={null} />)
    expect(screen.queryByTestId('home-diagnostic-memory')).not.toBeInTheDocument()
  })

  it('renders memory line with elapsed time + baseline when present', () => {
    const now = new Date(2026, 4, 22, 12)
    // 2 days ago
    const lastAt = now.getTime() - 2 * 24 * 60 * 60 * 1000
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        now={now}
        diagnosticMemory={{ version: 1, lastAt, baselineScore: 0.62 }}
      />,
    )
    const line = screen.getByTestId('home-diagnostic-memory')
    expect(line).toHaveTextContent('Diagnostik')
    expect(line).toHaveTextContent('2 dagar sedan')
    expect(line).toHaveTextContent('baseline 0.62')
    expect(line).toHaveTextContent('rebaseline')
  })

  it('omits baseline when score is null but still shows the line', () => {
    render(
      <HomeMobile
        forceLayout="phone"
        plan={makePlan()}
        diagnosticMemory={{ version: 1, lastAt: Date.now(), baselineScore: null }}
      />,
    )
    const line = screen.getByTestId('home-diagnostic-memory')
    expect(line).toHaveTextContent('Diagnostik')
    // "baseline 0.62" should be absent — only the "rebaseline →" CTA remains.
    expect(line).not.toHaveTextContent(/baseline \d/)
  })
})

describe('HomeMobile — top traps', () => {
  it('hides the traps card when no traps qualify', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} topTraps={[]} />)
    expect(screen.queryByTestId('home-top-traps')).not.toBeInTheDocument()
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

describe('HomeMobile — streak badge (chrome, unchanged)', () => {
  it('hides the streak badge by default and when streakDays is 0', () => {
    const { rerender } = render(<HomeMobile forceLayout="phone" />)
    expect(screen.queryByTestId('home-streak')).not.toBeInTheDocument()
    rerender(<HomeMobile forceLayout="phone" streakDays={0} />)
    expect(screen.queryByTestId('home-streak')).not.toBeInTheDocument()
  })

  it('auto-shows the badge with the real day count', () => {
    render(<HomeMobile forceLayout="phone" streakDays={12} />)
    expect(screen.getByTestId('home-streak')).toHaveTextContent('12 dagar')
  })

  it('uses singular form for a 1-day streak', () => {
    render(<HomeMobile forceLayout="phone" streakDays={1} />)
    expect(screen.getByTestId('home-streak')).toHaveTextContent('1 dag')
  })

  it('respects an explicit showStreak override (force-show at 0)', () => {
    render(<HomeMobile forceLayout="phone" showStreak streakDays={0} />)
    expect(screen.getByTestId('home-streak')).toHaveTextContent('0 dagar')
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
