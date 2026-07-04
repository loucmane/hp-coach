// Frame — the phone and desktop branches must render the SAME element
// tree shape. When the shapes differ, crossing the 768px breakpoint
// (e.g. narrowing the window mid-session) remounts the entire route
// subtree and component state dies with it — the dogfood find was the
// Klart. result screen vanishing back to the idle hero on resize.

import { act, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Frame } from './Frame'

let mockViewport: 'phone' | 'reader' | 'studio' = 'reader'
vi.mock('@/hooks/useViewport', () => ({
  useViewport: () => mockViewport,
}))

function Stateful() {
  const [n, setN] = useState(0)
  return (
    <button type="button" data-testid="stateful" onClick={() => setN((v) => v + 1)}>
      {n}
    </button>
  )
}

describe('Frame — breakpoint crossing keeps children mounted', () => {
  it('preserves child state across reader → phone → reader', () => {
    mockViewport = 'reader'
    const { rerender } = render(
      <Frame>
        <Stateful />
      </Frame>,
    )
    act(() => {
      screen.getByTestId('stateful').click()
      screen.getByTestId('stateful').click()
    })
    expect(screen.getByTestId('stateful')).toHaveTextContent('2')

    mockViewport = 'phone'
    rerender(
      <Frame>
        <Stateful />
      </Frame>,
    )
    expect(screen.getByTestId('stateful')).toHaveTextContent('2')

    mockViewport = 'reader'
    rerender(
      <Frame>
        <Stateful />
      </Frame>,
    )
    expect(screen.getByTestId('stateful')).toHaveTextContent('2')
  })
})
