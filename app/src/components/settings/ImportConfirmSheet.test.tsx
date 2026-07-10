import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ImportConfirmSheet } from './ImportConfirmSheet'

describe('ImportConfirmSheet', () => {
  it('states the overwrite semantics in Swedish', () => {
    render(<ImportConfirmSheet onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByText('Detta ersätter all din nuvarande data')).toBeInTheDocument()
  })

  it('calls onConfirm when the proceed button is clicked', () => {
    const onConfirm = vi.fn()
    render(<ImportConfirmSheet onConfirm={onConfirm} onCancel={() => {}} />)
    screen.getByTestId('import-confirm-proceed').click()
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when "Avbryt" is clicked — zero-penalty escape', () => {
    const onCancel = vi.fn()
    render(<ImportConfirmSheet onConfirm={() => {}} onCancel={onCancel} />)
    screen.getByTestId('import-confirm-cancel').click()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when the scrim is clicked', () => {
    const onCancel = vi.fn()
    render(<ImportConfirmSheet onConfirm={() => {}} onCancel={onCancel} />)
    screen.getByTestId('import-confirm-scrim').click()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('has a root data-testid for discoverability', () => {
    render(<ImportConfirmSheet onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByTestId('import-confirm-sheet')).toBeInTheDocument()
  })
})
