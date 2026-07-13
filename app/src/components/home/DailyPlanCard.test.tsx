// DailyPlanCard — the repetition row's count/copy/minutes are LIVE, not
// frozen at plan-generation time, and the margin estimate reflects only the
// VISIBLE numbered rows (the mock renders as the Kallelse above, not here).
//
// Prop-driven, no providers needed (the live due count arrives via
// `dueMistakeCount`, sourced upstream from useDueMistakes in HomeRoute).

import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { type DailyPlan, PLAN_SCHEMA_VERSION, type PlanItem } from '@/lib/scheduler'
import { DailyPlanCard } from './DailyPlanCard'

function makePlan(items: PlanItem[], estimatedMinutes: number): DailyPlan {
  return { version: PLAN_SCHEMA_VERSION, date: '2026-07-13', items, estimatedMinutes }
}

const drillItem: PlanItem = {
  id: 'drill-KVA-2026-07-13',
  kind: 'drill',
  section: 'KVA',
  headline: 'KVA-drill · 10 frågor',
  rationale: 'KVA-resultat har trendat nedåt.',
  estimatedMinutes: 6,
  href: '/drill?section=KVA',
  completed: false,
}

// A plan cached before the queue-semantics deploy: stale count AND pre-#283
// copy frozen into the row.
const staleRepItem: PlanItem = {
  id: 'rep-2026-07-13',
  kind: 'repetition',
  section: null,
  headline: 'Repetition · 4 missar',
  rationale: 'Gör dem först.',
  estimatedMinutes: 3,
  href: '/repetition',
  completed: false,
}

describe('DailyPlanCard — live repetition override', () => {
  it('overrides a stale cached repetition row with the current due count', () => {
    const plan = makePlan([staleRepItem, drillItem], 9)
    render(<DailyPlanCard plan={plan} allComplete={false} dueMistakeCount={23} />)

    const row = screen.getByTestId('daily-plan-item-rep-2026-07-13')
    // New copy (mogna missar, capped playable/total), not "4 missar".
    expect(within(row).getByText(/Repetition · 10 av 23 mogna missar/)).toBeInTheDocument()
    expect(screen.queryByText('Repetition · 4 missar')).not.toBeInTheDocument()
    // Live minutes: ceil(min(23,10) * 0.75) = 8.
    expect(within(row).getByText('~8 min')).toBeInTheDocument()
  })

  it('renders the repetition row completed-style when the queue is empty now', () => {
    const plan = makePlan([staleRepItem, drillItem], 9)
    render(<DailyPlanCard plan={plan} allComplete={false} dueMistakeCount={0} />)

    const row = screen.getByTestId('daily-plan-item-rep-2026-07-13')
    expect(row).toHaveAttribute('data-completed', 'true')
    expect(within(row).getByText(/Kön är tom just nu/)).toBeInTheDocument()
    // No false "0 missar" prescription.
    expect(screen.queryByText(/0 .*missar/)).not.toBeInTheDocument()
  })

  it('falls back to the cached strings when the live count is unresolved', () => {
    const plan = makePlan([staleRepItem, drillItem], 9)
    render(<DailyPlanCard plan={plan} allComplete={false} />)

    const row = screen.getByTestId('daily-plan-item-rep-2026-07-13')
    expect(within(row).getByText('Repetition · 4 missar')).toBeInTheDocument()
  })
})

describe('DailyPlanCard — margin estimate', () => {
  it('sums only the visible rows, using the live repetition minutes', () => {
    const plan = makePlan([staleRepItem, drillItem], 9)
    const { container } = render(
      <DailyPlanCard plan={plan} allComplete={false} dueMistakeCount={23} />,
    )
    // 8 (live rep) + 6 (drill) = 14, not the cached 9.
    expect(container.textContent).toContain('~14 min · uppskattat')
  })

  it('names the provpass instead of hiding its minutes on a mock-anchor day', () => {
    const mockItem: PlanItem = {
      id: 'mock-verbal-2026-07-13',
      kind: 'mock',
      section: null,
      headline: 'Provpass · Verbal',
      rationale: 'Dags att mäta.',
      estimatedMinutes: 55,
      href: '/prov?half=verbal&prescribed=1',
      completed: false,
    }
    // plan.estimatedMinutes counts the mock (3 + 55 = 58) — the old margin
    // showed "~58 min" over a 3-min visible list.
    const plan = makePlan([mockItem, staleRepItem], 58)
    const { container } = render(
      <DailyPlanCard plan={plan} allComplete={false} dueMistakeCount={4} />,
    )
    // Visible = the repetition row only; live count 4 → ceil(4*0.75)=3 min.
    expect(container.textContent).toContain('~3 min + provpass · uppskattat')
    expect(container.textContent).not.toContain('~58 min')
    // The mock is NOT rendered as a numbered row here.
    expect(screen.queryByTestId('daily-plan-item-mock-verbal-2026-07-13')).not.toBeInTheDocument()
  })
})
