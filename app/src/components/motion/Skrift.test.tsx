// Skrift — the handwriting data-arrival grammar (L2 "Skriften").
//
//   - not ready → the real content is in flow (clipped, honest
//     dimensions) and a faint baseline RULE marks the waiting line.
//   - ready at first render (cached query) → content is written, no rule
//     ever mounts, the ceremony is skipped.
//   - a rule is a static hairline, never an animation.

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetFirstContentSignalForTests } from '@/lib/motion'
import { Skrift, SkriftLine, SkriftRule } from './Skrift'

/** The baseline rule is the aria-hidden hairline SkriftLine draws while
 *  waiting — count the bordered spans under the slot. */
function ruleCount(root: HTMLElement): number {
  return [...root.querySelectorAll('[aria-hidden]')].filter((el) =>
    (el as HTMLElement).style.borderBottom?.includes('1px'),
  ).length
}

describe('SkriftLine', () => {
  it('keeps the real content in flow while waiting, under a baseline rule', () => {
    render(
      <Skrift ready={false} lines={1}>
        <SkriftLine line={0} testid="slot">
          <span data-testid="ink">3 väntar</span>
        </SkriftLine>
      </Skrift>,
    )
    // Skriften writes real content IN — it is present (clipped), not
    // swapped out (this is the change from InkSlot's impression swap).
    expect(screen.getByTestId('ink')).toBeInTheDocument()
    expect(ruleCount(screen.getByTestId('slot'))).toBe(1)
  })

  it('skips the ceremony when ready on first render — content written, no rule', () => {
    render(
      <Skrift ready lines={1}>
        <SkriftLine line={0} testid="slot">
          <span data-testid="ink">3 väntar</span>
        </SkriftLine>
      </Skrift>,
    )
    expect(screen.getByTestId('ink')).toBeInTheDocument()
    expect(ruleCount(screen.getByTestId('slot'))).toBe(0)
  })

  it('writes the content in when ready flips true (still present, rule lifts)', () => {
    const { rerender } = render(
      <Skrift ready={false} lines={1}>
        <SkriftLine line={0} testid="slot">
          <span data-testid="ink">1,41</span>
        </SkriftLine>
      </Skrift>,
    )
    expect(ruleCount(screen.getByTestId('slot'))).toBe(1)
    rerender(
      <Skrift ready lines={1}>
        <SkriftLine line={0} testid="slot">
          <span data-testid="ink">1,41</span>
        </SkriftLine>
      </Skrift>,
    )
    // Content stays present; the rule element remains mounted (it fades
    // to opacity 0 as the line writes) — the write-in did not remove it.
    expect(screen.getByTestId('ink')).toBeInTheDocument()
  })
})

describe('SkriftRule', () => {
  it('is aria-hidden, sized, and carries no animation', () => {
    render(
      <p>
        <SkriftRule w={12} />
      </p>,
    )
    const bar = document.querySelector('[aria-hidden]') as HTMLElement
    expect(bar).not.toBeNull()
    expect(bar.style.animation).toBe('')
    expect(bar.style.width).toBe('12ch')
  })
})

describe('Skrift — boot-veil first-content dispatch (#305)', () => {
  // Earlier `<Skrift ready>` renders in this file (SkriftLine tests above)
  // already latch the app-wide one-shot flag — reset it BEFORE each test
  // here too, not just after, so the first test in this block doesn't
  // inherit that residue.
  beforeEach(() => {
    __resetFirstContentSignalForTests()
  })

  it('dispatches hpc:first-content when it first renders with ready=true', () => {
    const onSignal = vi.fn()
    window.addEventListener('hpc:first-content', onSignal)

    render(
      <Skrift ready lines={1}>
        <SkriftLine line={0}>
          <span>klar</span>
        </SkriftLine>
      </Skrift>,
    )

    window.removeEventListener('hpc:first-content', onSignal)
    expect(onSignal).toHaveBeenCalledTimes(1)
  })

  it('does not dispatch while ready=false, but fires once ready flips true', () => {
    const onSignal = vi.fn()
    window.addEventListener('hpc:first-content', onSignal)

    const { rerender } = render(
      <Skrift ready={false} lines={1}>
        <SkriftLine line={0}>
          <span>väntar</span>
        </SkriftLine>
      </Skrift>,
    )
    expect(onSignal).not.toHaveBeenCalled()

    rerender(
      <Skrift ready lines={1}>
        <SkriftLine line={0}>
          <span>klar</span>
        </SkriftLine>
      </Skrift>,
    )
    expect(onSignal).toHaveBeenCalledTimes(1)

    window.removeEventListener('hpc:first-content', onSignal)
  })

  it('does not re-dispatch on later re-renders once already fired (ready stays true)', () => {
    const onSignal = vi.fn()
    window.addEventListener('hpc:first-content', onSignal)

    const { rerender } = render(
      <Skrift ready lines={1}>
        <SkriftLine line={0}>
          <span>klar</span>
        </SkriftLine>
      </Skrift>,
    )
    expect(onSignal).toHaveBeenCalledTimes(1)

    rerender(
      <Skrift ready lines={1}>
        <SkriftLine line={0}>
          <span>klar, uppdaterad</span>
        </SkriftLine>
      </Skrift>,
    )
    rerender(
      <Skrift ready lines={1}>
        <SkriftLine line={0}>
          <span>klar, igen</span>
        </SkriftLine>
      </Skrift>,
    )

    window.removeEventListener('hpc:first-content', onSignal)
    expect(onSignal).toHaveBeenCalledTimes(1)
  })
})
