import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetMockEvents, loadMockEvents } from '@/lib/mockEvents'
import { ConfirmSheet } from './ConfirmSheet'

describe('ConfirmSheet', () => {
  beforeEach(() => {
    __resetMockEvents()
  })

  it('renders the eyebrow, half-only heading (no target), and the full rule list', () => {
    render(<ConfirmSheet half="verbal" onConfirm={() => {}} onDismiss={() => {}} />)
    expect(screen.getByText('Starta provpass')).toBeInTheDocument()
    expect(screen.getByTestId('mock-confirm-heading')).toHaveTextContent('Provpass · Verbal')
    // '40 frågor'/'55 minuter' moved into the subline (H picker header);
    // the rule list carries only the conduct rules now.
    const rules = [
      'ingen paus',
      'du kan ändra svar tills tiden går ut',
      'avbryter du blir provet ogiltigt',
      'lämna ingen fråga obesvarad — fel ger inga avdrag',
    ]
    for (const rule of rules) {
      expect(screen.getByText(rule)).toBeInTheDocument()
    }
  })

  it('renders Kvant heading for the kvant half (no target)', () => {
    render(<ConfirmSheet half="kvant" onConfirm={() => {}} onDismiss={() => {}} />)
    expect(screen.getByTestId('mock-confirm-heading')).toHaveTextContent('Provpass · Kvant')
  })

  it('names the exact authentic pass from its target (sitting + provpass + count)', () => {
    render(
      <ConfirmSheet
        half="verbal"
        target={{ mode: 'authentic', examId: 'host-2025', provpass: 'verb2', presented: 40 }}
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    )
    expect(screen.getByTestId('mock-confirm-heading')).toHaveTextContent('Hösten 2025')
    expect(screen.getByTestId('mock-confirm-subline')).toHaveTextContent(
      'Provpass 2 · 40 frågor · 55 minuter',
    )
    // The full contract still rides along (one gate, not two).
    expect(screen.getByText('avbryter du blir provet ogiltigt')).toBeInTheDocument()
  })

  it('names a synthetic pass by mode + half from its target', () => {
    render(
      <ConfirmSheet
        half="kvant"
        target={{ mode: 'synthetic' }}
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    )
    expect(screen.getByTestId('mock-confirm-heading')).toHaveTextContent('Genererat pass')
    expect(screen.getByTestId('mock-confirm-subline')).toHaveTextContent(
      'Kvant · 40 frågor · 55 minuter',
    )
  })

  it('calls onConfirm and logs confirm_started when the primary button is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmSheet half="verbal" onConfirm={onConfirm} onDismiss={() => {}} />)
    screen.getByTestId('mock-confirm-start').click()
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(loadMockEvents().some((e) => e.type === 'confirm_started')).toBe(true)
  })

  it('calls onDismiss and logs confirm_backed_out when "Inte nu" is clicked', () => {
    const onDismiss = vi.fn()
    render(<ConfirmSheet half="verbal" onConfirm={() => {}} onDismiss={onDismiss} />)
    screen.getByTestId('mock-confirm-dismiss').click()
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(loadMockEvents().some((e) => e.type === 'confirm_backed_out')).toBe(true)
  })

  it('calls onDismiss when the scrim is clicked', () => {
    const onDismiss = vi.fn()
    render(<ConfirmSheet half="verbal" onConfirm={() => {}} onDismiss={onDismiss} />)
    screen.getByTestId('mock-confirm-scrim').click()
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('logs confirm_shown on mount', () => {
    render(<ConfirmSheet half="verbal" onConfirm={() => {}} onDismiss={() => {}} />)
    expect(loadMockEvents().some((e) => e.type === 'confirm_shown')).toBe(true)
  })

  it('has a root data-testid for discoverability', () => {
    render(<ConfirmSheet half="verbal" onConfirm={() => {}} onDismiss={() => {}} />)
    expect(screen.getByTestId('mock-confirm-sheet')).toBeInTheDocument()
  })
})
