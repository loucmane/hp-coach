// The ÖVNINGSTEXT bake-off's design contract (docs/p5-infold-design.md
// §3 B + Amendment 1 row B), checked for all three variants: the badge in
// every unit scene and outside the passage text, no modal, the note at a
// unit's first display only (B keeps it folded behind the tag), the badge
// in feedback and replay, the caveat on every LÄS/ELF-based estimate in
// every scene and the retired notice in history. jsdom has no matchMedia
// breakpoints, so the scenes render their phone layout.

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

/** Every LÄS/ELF-based estimate on the page, found from the M3 markup
 *  rather than from the disclosure parts, so an estimate shown without its
 *  caveat is still found: stat numbers and display headings on the 0–2,0
 *  scale (a decimal comma; counts like "29 av 40" have none) and the LÄS
 *  and ELF rows of a section ledger. Every such stat and heading in the
 *  bake-off is LÄS/ELF-based: a verbal pass, the overall prognosis, a LÄS
 *  pass. */
function estimates(): HTMLElement[] {
  const scaled = [
    ...document.querySelectorAll<HTMLElement>('.hpc-m3-stat-n, .hpc-m3-display'),
  ].filter((el) => /\d,\d/.test(el.textContent ?? ''))
  const ledger = [...document.querySelectorAll<HTMLElement>('.hpc-m3-trap')].filter((row) =>
    ['LÄS', 'ELF'].includes(row.querySelector('.hpc-m3-tag')?.textContent ?? ''),
  )
  return [...scaled, ...ledger]
}

const ESTIMATES_PER_SCENE: Record<SceneKey, number> = {
  '1': 0,
  '2': 0,
  '3': 0,
  '4': 0,
  '5': 0,
  // Provpass result, Home prognosis, Framsteg hero, Framsteg's LÄS and ELF rows.
  '6': 5,
  // The LÄS pass's "detta pass" score in history.
  '7': 1,
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

  it.each(
    Object.keys(ESTIMATES_PER_SCENE) as SceneKey[],
  )('scene %s: every LÄS/ELF-based estimate carries the caveat', (scene) => {
    renderScene(variant, scene)
    const found = estimates()
    expect(found).toHaveLength(ESTIMATES_PER_SCENE[scene])
    for (const estimate of found) {
      // The surface it sits on shows the approved caveat, once.
      const surface = estimate.closest<HTMLElement>('.hpc-m3-page')
      expect(surface).not.toBeNull()
      const caveats = within(surface as HTMLElement).queryAllByTestId('ovn-caveat')
      expect(caveats).toHaveLength(1)
      expect(caveats[0]).toHaveTextContent(ESTIMATE_CAVEAT)
      // A's footnote attaches only where the number is marked and points to it.
      if (variant === 'a') {
        expect(within(estimate).getByTestId('ovn-caveat-marker')).toBeInTheDocument()
        const linked =
          estimate.closest('[aria-describedby]') ?? estimate.querySelector('[aria-describedby]')
        expect(linked?.getAttribute('aria-describedby')?.split(' ')).toContain(caveats[0].id)
      }
    }
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
