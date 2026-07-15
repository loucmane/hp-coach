// InkDry — the drying-ink data-arrival slot.
//
//   - !ready → the pre-impression renders (aria-hidden, static), the
//     real content does not.
//   - ready on first render (cached query) → content renders
//     immediately, no impression ever mounts.
//   - !ready → ready → the content mounts (drying in); the impression
//     is aria-hidden dead material on its way out (or already gone).

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Impress, InkSlot } from './InkDry'

describe('InkSlot', () => {
  it('renders the impression, not the content, while not ready', () => {
    render(
      <InkSlot ready={false} testid="slot">
        <span data-testid="ink">3 väntar</span>
      </InkSlot>,
    )
    expect(screen.queryByTestId('ink')).not.toBeInTheDocument()
    const slot = screen.getByTestId('slot')
    expect(slot.querySelector('[aria-hidden]')).not.toBeNull()
  })

  it('renders content immediately when ready on first render', () => {
    render(
      <InkSlot ready testid="slot">
        <span data-testid="ink">3 väntar</span>
      </InkSlot>,
    )
    expect(screen.getByTestId('ink')).toBeInTheDocument()
    expect(screen.getByTestId('slot').querySelector('[aria-hidden]')).toBeNull()
  })

  it('dries the content in when ready flips true', () => {
    const { rerender } = render(
      <InkSlot ready={false} testid="slot">
        <span data-testid="ink">1,41</span>
      </InkSlot>,
    )
    rerender(
      <InkSlot ready testid="slot">
        <span data-testid="ink">1,41</span>
      </InkSlot>,
    )
    expect(screen.getByTestId('ink')).toBeInTheDocument()
  })

  it('renders a custom impression node', () => {
    render(
      <InkSlot ready={false} impression={<span data-testid="ghost-rows" />}>
        <span>content</span>
      </InkSlot>,
    )
    expect(screen.getByTestId('ghost-rows')).toBeInTheDocument()
  })
})

describe('Impress', () => {
  it('is aria-hidden and never carries an animation', () => {
    render(
      <p>
        <Impress w={12} />
      </p>,
    )
    const bar = document.querySelector('[aria-hidden]') as HTMLElement
    expect(bar).not.toBeNull()
    expect(bar.style.animation).toBe('')
    expect(bar.style.width).toBe('12ch')
  })
})
