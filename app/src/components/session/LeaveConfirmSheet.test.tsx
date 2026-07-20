// LeaveConfirmSheet — the quiet back-trap confirm inside an active
// drill/diagnostic session. "Fortsätt öva" is PRIMARY (staying is the
// cheap, encouraged path); "Avsluta" is the quiet secondary that
// performs the real back. Scrim and Escape are zero-penalty stays.

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LeaveConfirmSheet } from './LeaveConfirmSheet'

describe('LeaveConfirmSheet', () => {
  it('states the stakes in Swedish — leaving discards the answers so far', () => {
    render(<LeaveConfirmSheet onContinue={() => {}} onLeave={() => {}} />)
    expect(screen.getByText('Avsluta övningen?')).toBeInTheDocument()
    expect(screen.getByText(/Dina svar hittills sparas inte/)).toBeInTheDocument()
  })

  it('calls onContinue when "Fortsätt öva" (primary) is clicked', () => {
    const onContinue = vi.fn()
    render(<LeaveConfirmSheet onContinue={onContinue} onLeave={() => {}} />)
    screen.getByTestId('session-leave-continue').click()
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('calls onLeave when the quiet "Avsluta" is clicked', () => {
    const onLeave = vi.fn()
    render(<LeaveConfirmSheet onContinue={() => {}} onLeave={onLeave} />)
    screen.getByTestId('session-leave-exit').click()
    expect(onLeave).toHaveBeenCalledTimes(1)
  })

  it('treats the scrim as "stay" — never as the destructive leave', () => {
    const onContinue = vi.fn()
    const onLeave = vi.fn()
    render(<LeaveConfirmSheet onContinue={onContinue} onLeave={onLeave} />)
    screen.getByTestId('session-leave-scrim').click()
    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(onLeave).not.toHaveBeenCalled()
  })

  it('Escape stays in the session', () => {
    const onContinue = vi.fn()
    render(<LeaveConfirmSheet onContinue={onContinue} onLeave={() => {}} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('has a root data-testid for discoverability', () => {
    render(<LeaveConfirmSheet onContinue={() => {}} onLeave={() => {}} />)
    expect(screen.getByTestId('session-leave-sheet')).toBeInTheDocument()
  })
})
