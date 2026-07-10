import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlanItemWithMock } from '@/lib/mockContract'
import { __resetMockEvents, loadMockEvents } from '@/lib/mockEvents'
import { Kallelse } from './Kallelse'

function mockItem(overrides: Partial<PlanItemWithMock> = {}): PlanItemWithMock {
  return {
    id: 'mock-2026-07-08',
    kind: 'mock',
    section: null,
    headline: 'Provpass · Verbal',
    rationale: '12 dagar sedan senaste — dags att mäta.',
    estimatedMinutes: 55,
    href: '/prov',
    completed: false,
    ...overrides,
  }
}

describe('Kallelse', () => {
  beforeEach(() => {
    __resetMockEvents()
    window.localStorage.clear()
  })

  it('renders null for a non-mock plan item', () => {
    const { container } = render(
      <Kallelse item={mockItem({ kind: 'drill' })} onStart={() => {}} forceLayout="phone" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the eyebrow, heading, rationale, and CTA for a mock item', () => {
    render(<Kallelse item={mockItem()} onStart={() => {}} forceLayout="phone" />)
    expect(screen.getByText('Kallelse · Provpass')).toBeInTheDocument()
    expect(screen.getByText(/Verbal · 55 minuter/)).toBeInTheDocument()
    expect(screen.getByText(/12 dagar sedan senaste/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /starta/i })).toBeInTheDocument()
  })

  it('derives the heading half from the item, not a hardcoded Verbal', () => {
    render(
      <Kallelse
        item={mockItem({ headline: 'Provpass · Kvant', rationale: 'Redo för nästa.' })}
        onStart={() => {}}
        forceLayout="phone"
      />,
    )
    expect(screen.getByText(/Kvant · 55 minuter/)).toBeInTheDocument()
    expect(screen.queryByText(/Verbal · 55 minuter/)).not.toBeInTheDocument()
  })

  it('calls onStart when the CTA is clicked', async () => {
    const onStart = vi.fn()
    render(<Kallelse item={mockItem()} onStart={onStart} forceLayout="phone" />)
    screen.getByRole('button', { name: /starta/i }).click()
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('logs provpassdag_shown once on render', () => {
    render(<Kallelse item={mockItem()} onStart={() => {}} forceLayout="phone" />)
    const events = loadMockEvents().filter((e) => e.type === 'provpassdag_shown')
    expect(events).toHaveLength(1)
  })

  it('does not double-log provpassdag_shown on rerender the same day', () => {
    const { rerender } = render(
      <Kallelse item={mockItem()} onStart={() => {}} forceLayout="phone" />,
    )
    rerender(<Kallelse item={mockItem()} onStart={() => {}} forceLayout="phone" />)
    const events = loadMockEvents().filter((e) => e.type === 'provpassdag_shown')
    expect(events).toHaveLength(1)
  })

  it('renders the desktop composition wrapped in a KALLELSE rail section', () => {
    render(<Kallelse item={mockItem()} onStart={() => {}} forceLayout="studio" />)
    expect(screen.getByText('Kallelse')).toBeInTheDocument()
    expect(screen.getByText(/Verbal · 55 minuter/)).toBeInTheDocument()
  })
})
