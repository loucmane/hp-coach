// HomeMobile component test — pins the contract that infra-foundation
// hands forward: every voice line shows up, the iconic CTA is the
// taktiker default ("Fortsätt"), the Avancerat link is wired, and
// streak rendering is opt-in.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HomeMobile } from './HomeMobile'

describe('HomeMobile', () => {
  it('renders the taktiker home line and CTA by default', () => {
    render(<HomeMobile forceLayout="phone" />)
    expect(
      screen.getByText(
        /idag · 10 min ord-repetition · 30 min kva-grunder · 5 min på gårdagens fel/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fortsätt' })).toBeInTheDocument()
  })

  it('renders the kompis voice when coach=kompis', () => {
    render(<HomeMobile forceLayout="phone" coach="kompis" />)
    expect(screen.getByRole('button', { name: 'Kör igång' })).toBeInTheDocument()
    expect(screen.getByText(/— coach · kompis/i)).toBeInTheDocument()
  })

  it('hides the streak badge by default and when streakDays is 0', () => {
    const { rerender } = render(<HomeMobile forceLayout="phone" />)
    expect(screen.queryByTestId('home-streak')).not.toBeInTheDocument()
    rerender(<HomeMobile forceLayout="phone" streakDays={0} />)
    expect(screen.queryByTestId('home-streak')).not.toBeInTheDocument()
  })

  it('auto-shows the streak badge with the real day count', () => {
    render(<HomeMobile forceLayout="phone" streakDays={12} />)
    expect(screen.getByTestId('home-streak')).toHaveTextContent('12 dagar')
  })

  it('uses the singular form for a 1-day streak', () => {
    render(<HomeMobile forceLayout="phone" streakDays={1} />)
    expect(screen.getByTestId('home-streak')).toHaveTextContent('1 dag')
  })

  it('respects an explicit showStreak override (force-show at 0)', () => {
    render(<HomeMobile forceLayout="phone" showStreak streakDays={0} />)
    expect(screen.getByTestId('home-streak')).toHaveTextContent('0 dagar')
  })

  it('fires onContinue when the CTA is clicked', async () => {
    const onContinue = vi.fn()
    render(<HomeMobile forceLayout="phone" onContinue={onContinue} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fortsätt' }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('fires onAvancerat when the trailing link is clicked', async () => {
    const onAvancerat = vi.fn()
    render(<HomeMobile forceLayout="phone" onAvancerat={onAvancerat} />)
    await userEvent.click(screen.getByRole('button', { name: 'Avancerat' }))
    expect(onAvancerat).toHaveBeenCalledTimes(1)
  })

  it('hides the repetition link when nothing is due', () => {
    const { rerender } = render(<HomeMobile forceLayout="phone" />)
    expect(screen.queryByTestId('home-repetition-link')).not.toBeInTheDocument()
    rerender(<HomeMobile forceLayout="phone" dueCount={0} />)
    expect(screen.queryByTestId('home-repetition-link')).not.toBeInTheDocument()
  })

  it('renders the singular form when exactly one mistake is due', () => {
    render(<HomeMobile forceLayout="phone" dueCount={1} />)
    const link = screen.getByTestId('home-repetition-link')
    expect(link).toHaveTextContent(/^1 miss att repetera$/)
  })

  it('renders the plural form when multiple mistakes are due', () => {
    render(<HomeMobile forceLayout="phone" dueCount={7} />)
    const link = screen.getByTestId('home-repetition-link')
    expect(link).toHaveTextContent(/^7 missar att repetera$/)
  })

  it('fires onRepetition when the queue link is clicked', async () => {
    const onRepetition = vi.fn()
    render(<HomeMobile forceLayout="phone" dueCount={3} onRepetition={onRepetition} />)
    await userEvent.click(screen.getByTestId('home-repetition-link'))
    expect(onRepetition).toHaveBeenCalledTimes(1)
  })
})
