import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetMockEvents, loadMockEvents } from '@/lib/mockEvents'
import { ConfirmSheet } from './ConfirmSheet'

describe('ConfirmSheet', () => {
  beforeEach(() => {
    __resetMockEvents()
  })

  it('renders the eyebrow, heading with the Swedish half label, and the full 6-rule list', () => {
    render(<ConfirmSheet half="verbal" onConfirm={() => {}} onDismiss={() => {}} />)
    expect(screen.getByText('Provpass')).toBeInTheDocument()
    expect(screen.getByText(/Provpass · Verbal/)).toBeInTheDocument()
    const rules = [
      '40 frågor',
      '55 minuter',
      'ingen paus',
      'du kan ändra svar tills tiden går ut',
      'avbryter du blir provet ogiltigt',
      'lämna ingen fråga obesvarad — fel ger inga avdrag',
    ]
    for (const rule of rules) {
      expect(screen.getByText(rule)).toBeInTheDocument()
    }
  })

  it('renders Kvant heading for the kvant half', () => {
    render(<ConfirmSheet half="kvant" onConfirm={() => {}} onDismiss={() => {}} />)
    expect(screen.getByText(/Provpass · Kvant/)).toBeInTheDocument()
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
