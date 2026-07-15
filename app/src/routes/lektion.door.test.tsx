// W4 — the uppslag door's departure station. The picker's section chip
// morphs its code into the reader's header eyebrow (LessonReader — see
// LessonReader.door.test.tsx for the OTHER half of this contract); this
// test pins that the picker wires ONLY wired sections' chips to the
// shared `uppslagDoorLayoutId`, and that a disabled ("kommer snart")
// chip — which has no reader to land in — never claims the id.
//
// Router-free: Link/useNavigate are stubbed (RecentPassesCard.test.tsx
// precedent). `motion/react` is stubbed the same way as the reader test so
// `layoutId` surfaces as a `data-layout-id` DOM attribute.

import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: { children: ReactNode; [k: string]: unknown }) => {
    const { to: _to, search: _search, ...attrs } = rest as Record<string, unknown>
    return <a {...attrs}>{children}</a>
  },
  useNavigate: () => vi.fn(),
  // Module-scope `createFileRoute('/lektion')({...})` call in lektion.tsx
  // needs a callable stand-in; PickerBody (what this test renders) has no
  // dependency on the resulting Route object, only LektionRoute does.
  createFileRoute: () => (opts: unknown) => opts,
}))

vi.mock('motion/react', () => ({
  motion: {
    span: ({
      layoutId,
      children,
      transition: _transition,
      ...rest
    }: {
      layoutId?: string
      children: ReactNode
      transition?: unknown
      [k: string]: unknown
    }) => (
      <span data-layout-id={layoutId} {...rest}>
        {children}
      </span>
    ),
  },
  useReducedMotion: () => false,
}))

vi.mock('@/data/frameworks', () => ({
  wiredSections: () => ['NOG', 'KVA'],
}))

vi.mock('@/api/hooks/useStats', () => ({
  useStats: () => ({ data: undefined }),
}))

vi.mock('@/api/hooks/useMistakes', () => ({
  useDueMistakes: () => ({ data: undefined }),
}))

import { uppslagDoorLayoutId } from '@/lib/motion'
import { PickerBody } from './lektion'

describe('lektion picker — uppslag door departure station', () => {
  it('wires wired sections’ chips to the shared uppslag-door layoutId, skips unwired ones', async () => {
    render(<PickerBody />)

    const nogChip = await screen.findByText('NOG')
    expect(nogChip.closest('[data-layout-id]')).toHaveAttribute(
      'data-layout-id',
      uppslagDoorLayoutId('NOG'),
    )

    // ORD is not in the mocked wired list — its chip renders plain text,
    // no layoutId, no door.
    const ordChip = screen.getByText('ORD')
    expect(ordChip.closest('[data-layout-id]')).toBeNull()
  })
})
