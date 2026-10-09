// The ÖVNINGSTEXT bake-off's design contract (docs/p5-infold-design.md
// §3 B + Amendment 1 row B), checked for all three variants: the badge in
// every unit scene and outside the passage text, no modal, the note at a
// unit's first display only (B keeps it folded behind the tag), the badge
// in feedback and replay, the caveat on every estimate surface and the
// retired notice in history. jsdom has no matchMedia breakpoints, so the
// scenes render their phone layout.

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OvningstextBakeoff, type SceneKey } from '@/components/devbake/OvningstextBakeoff'
import type { VariantKey } from '@/components/devbake/OvningstextKit'
import {
  ESTIMATE_CAVEAT,
  LAS_UNIT,
  OVNINGSTEXT_NOTE,
  RETIRED_NOTICE,
} from '@/components/devbake/ovningstextFixtures'

const VARIANTS: VariantKey[] = ['a', 'b', 'c']

function renderScene(variant: VariantKey, scene: SceneKey) {
  return render(<OvningstextBakeoff variant={variant} scene={scene} frame onSelect={() => {}} />)
}

/** The variant's passage badge: A's eyebrow, B's tag toggle, C's band. */
function passageBadge(variant: VariantKey): HTMLElement {
  if (variant === 'a') return screen.getByTestId('ovn-badge')
  if (variant === 'b') return screen.getByTestId('ovn-tag-toggle')
  return screen.getByTestId('ovn-band')
}

/** The note as a reader would see it (B's folded note is `hidden`). */
function visibleNote(): HTMLElement | null {
  const note = screen.queryByTestId('ovn-note')
  return note && !note.hidden ? note : null
}

describe.each(VARIANTS)('ÖVNINGSTEXT bake-off — variant %s', (variant) => {
  it.each([
    '1',
    '2',
    '3',
    '5',
  ] as SceneKey[])('scene %s shows the badge outside the passage, with no modal', (scene) => {
    renderScene(variant, scene)
    const badge = passageBadge(variant)
    expect(badge).toHaveTextContent(/övningstext/i)
    expect(screen.getByTestId('ovn-passage')).not.toContainElement(badge)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the note at the unit’s first display', () => {
    renderScene(variant, '1')
    expect(visibleNote()).toHaveTextContent(OVNINGSTEXT_NOTE)
  })

  it.each([
    '2',
    '3',
    '5',
  ] as SceneKey[])('hides the note on a later display (scene %s)', (scene) => {
    renderScene(variant, scene)
    expect(visibleNote()).toBeNull()
  })

  it('drops the note once the reader moves to the unit’s next question', () => {
    renderScene(variant, '1')
    fireEvent.click(screen.getByTestId(`ovn-option-${LAS_UNIT.questions[0].answer}`))
    fireEvent.click(screen.getByTestId('ovn-next'))
    expect(screen.getByText(LAS_UNIT.questions[1].prompt)).toBeInTheDocument()
    expect(visibleNote()).toBeNull()
    expect(passageBadge(variant)).toBeInTheDocument()
  })

  it('carries the badge into the feedback', () => {
    renderScene(variant, '4')
    const outcome = screen.getByTestId('ovn-outcome')
    if (variant === 'a') expect(within(outcome).getByTestId('ovn-rail-badge')).toBeInTheDocument()
    if (variant === 'b') expect(within(outcome).getByTestId('ovn-tag')).toBeInTheDocument()
    // C: the unit's band is sticky over the whole page, feedback included.
    if (variant === 'c') expect(screen.getByTestId('ovn-band').style.position).toBe('sticky')
  })

  it('puts the caveat on each estimate surface: Provpass, Home and Framsteg', () => {
    renderScene(variant, '6')
    expect(screen.getAllByText(ESTIMATE_CAVEAT)).toHaveLength(3)
  })

  it('keeps a retired unit’s answers and shows the notice in place of its text', () => {
    renderScene(variant, '7')
    expect(screen.getAllByTestId('ovn-retired-row')).toHaveLength(4)
    expect(screen.getAllByText(RETIRED_NOTICE)).toHaveLength(variant === 'c' ? 1 : 4)
    for (const row of screen.getAllByTestId('ovn-retired-row')) {
      expect(within(row).queryByRole('button')).toBeNull()
    }
  })
})

describe('variant B — the tag folds and re-opens the note', () => {
  it('opens the note at first display and folds it on request', () => {
    renderScene('b', '1')
    const toggle = screen.getByTestId('ovn-tag-toggle')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(visibleNote()).toBeNull()
  })

  it('keeps the note one click away on a later display', () => {
    renderScene('b', '2')
    const toggle = screen.getByTestId('ovn-tag-toggle')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(visibleNote()).toHaveTextContent(OVNINGSTEXT_NOTE)
  })
})
