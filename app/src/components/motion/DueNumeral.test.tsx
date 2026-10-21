import { render, screen } from '@testing-library/react'
import { useReducedMotion } from 'motion/react'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePileMistakes } from '@/api/hooks/useMistakes'
import { DUE_NUMERAL_LAYOUT_ID } from '@/lib/motion'
import { DueHeaderStation, DueNumeral } from './DueNumeral'

// Expose the projection prop that Motion normally consumes before DOM render.
vi.mock('motion/react', () => ({
  motion: {
    span: ({
      layoutId,
      layoutDependency: _layoutDependency,
      transition: _transition,
      ...props
    }: ComponentProps<'span'> & {
      layoutId?: string
      layoutDependency?: unknown
      transition?: unknown
    }) => <span data-layout-id={layoutId} {...props} />,
  },
  useReducedMotion: vi.fn(() => false),
}))

vi.mock('@/api/hooks/useMistakes', () => ({
  usePileMistakes: vi.fn(() => ({ data: Array.from({ length: 3 }) })),
}))

vi.mock('@/hooks/useViewport', () => ({ useViewport: () => 'reader' }))

vi.mock('./DigitRoll', () => ({
  DigitRoll: ({ value }: { value: number }) => <span>{value}</span>,
}))

describe('DueNumeral projection ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useReducedMotion).mockReturnValue(false)
  })

  it.each([false, true])('keeps the sticky header out of projection (reduced motion: %s)', (rm) => {
    vi.mocked(useReducedMotion).mockReturnValue(rm)
    const { rerender } = render(<DueHeaderStation />)

    expect(screen.getByTestId('due-station-numeral')).not.toHaveAttribute('data-layout-id')
    expect(screen.getByTestId('due-station-numeral')).toHaveTextContent('3')

    vi.mocked(usePileMistakes).mockReturnValueOnce({
      data: Array.from({ length: 2 }),
    } as ReturnType<typeof usePileMistakes>)
    rerender(<DueHeaderStation />)

    expect(screen.getByTestId('due-station-numeral')).not.toHaveAttribute('data-layout-id')
    expect(screen.getByTestId('due-station-numeral')).toHaveTextContent('2')
  })

  it('preserves shared projection for other full-motion stations', () => {
    render(<DueNumeral count={3} size={15} testid="rail-numeral" />)

    expect(screen.getByTestId('rail-numeral')).toHaveAttribute(
      'data-layout-id',
      DUE_NUMERAL_LAYOUT_ID,
    )
  })

  it('preserves the exact-width away reserve in the rail', () => {
    render(<DueNumeral count={12} size={15} away testid="rail-numeral" />)

    expect(screen.queryByTestId('rail-numeral')).not.toBeInTheDocument()
    expect(screen.getByTestId('rail-numeral-reserve')).toHaveStyle({ width: '2ch' })
  })

  it('keeps the reduced-motion rail numeral visible without projection when away', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    render(<DueNumeral count={12} size={15} away testid="rail-numeral" />)

    expect(screen.queryByTestId('rail-numeral-reserve')).not.toBeInTheDocument()
    expect(screen.getByTestId('rail-numeral')).not.toHaveAttribute('data-layout-id')
    expect(screen.getByTestId('rail-numeral')).toHaveTextContent('12')
  })
})
