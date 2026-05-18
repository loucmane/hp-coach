// HomeMobile — tests pin the B3.2 prescriptive composition:
//
//   - Plan is null while resolving → skeleton state
//   - Plan provided → DailyPlanCard rendered with the items
//   - allComplete → "Klart för idag" panel
//   - Streak badge logic preserved (chrome, not part of the plan flow)
//   - markComplete + regenerate callbacks fire from the card

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { DailyPlan } from '@/lib/scheduler'
import { HomeMobile } from './HomeMobile'

function makePlan(overrides: Partial<DailyPlan> = {}): DailyPlan {
  return {
    version: 2,
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
    expect(screen.getByText('Repetition · 3 missar')).toBeInTheDocument()
    expect(screen.getByText('NOG-lektion')).toBeInTheDocument()
    expect(screen.getByText('KVA-drill · 10 frågor')).toBeInTheDocument()
  })

  it('shows the total estimated minutes in the eyebrow', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} />)
    expect(screen.getByText(/idag · 18 min/i)).toBeInTheDocument()
  })

  it('renders the "Klart för idag" complete panel when allComplete is true', () => {
    render(<HomeMobile forceLayout="phone" plan={makePlan()} allComplete />)
    expect(screen.getByTestId('daily-plan-complete')).toBeInTheDocument()
    expect(screen.getByText(/perfect game/i)).toBeInTheDocument()
    expect(screen.queryByTestId('daily-plan-card')).not.toBeInTheDocument()
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

  it('fires onRegenerate when the "Generera om" link is tapped', async () => {
    const onRegenerate = vi.fn()
    render(<HomeMobile forceLayout="phone" plan={makePlan()} onRegenerate={onRegenerate} />)
    await userEvent.click(screen.getByTestId('daily-plan-regenerate'))
    expect(onRegenerate).toHaveBeenCalledTimes(1)
  })

  it('fires onRegenerate from the complete-panel link too', async () => {
    const onRegenerate = vi.fn()
    render(
      <HomeMobile forceLayout="phone" plan={makePlan()} allComplete onRegenerate={onRegenerate} />,
    )
    await userEvent.click(screen.getByTestId('daily-plan-regenerate-complete'))
    expect(onRegenerate).toHaveBeenCalledTimes(1)
  })
})
