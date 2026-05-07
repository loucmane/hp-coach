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
    render(<HomeMobile />)
    expect(
      screen.getByText(
        /idag · 10 min ord-repetition · 30 min kva-grunder · 5 min på gårdagens fel/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fortsätt' })).toBeInTheDocument()
  })

  it('renders the kompis voice when coach=kompis', () => {
    render(<HomeMobile coach="kompis" />)
    expect(screen.getByRole('button', { name: 'Kör igång' })).toBeInTheDocument()
    expect(screen.getByText(/— coach · kompis/i)).toBeInTheDocument()
  })

  it('hides the streak badge by default and shows it when showStreak', () => {
    const { rerender } = render(<HomeMobile />)
    expect(screen.queryByText('14 dagar')).not.toBeInTheDocument()
    rerender(<HomeMobile showStreak />)
    expect(screen.getByText('14 dagar')).toBeInTheDocument()
  })

  it('fires onContinue when the CTA is clicked', async () => {
    const onContinue = vi.fn()
    render(<HomeMobile onContinue={onContinue} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fortsätt' }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('fires onAvancerat when the trailing link is clicked', async () => {
    const onAvancerat = vi.fn()
    render(<HomeMobile onAvancerat={onAvancerat} />)
    await userEvent.click(screen.getByRole('button', { name: 'Avancerat' }))
    expect(onAvancerat).toHaveBeenCalledTimes(1)
  })
})
