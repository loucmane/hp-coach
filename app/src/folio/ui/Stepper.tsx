import type { MouseEvent } from 'react'

import { ChipRow } from './ChipRow'
import './ui.css'

type StepBase = { id: string; label: string; done?: boolean }

/** A step is a link to its place, or a button when it is an action. */
export type StepperStep = StepBase &
  (
    | { href: string; onSelect?: (event: MouseEvent<HTMLAnchorElement>) => void }
    | { href?: undefined; onSelect: (event: MouseEvent<HTMLButtonElement>) => void }
  )

export type StepperProps = {
  /** The list's name ("Stegen i fällan"). */
  label: string
  steps: readonly StepperStep[]
  /** The id of the step the student is on. */
  current?: string
  className?: string
}

/**
 * A linked step list. Every step is a real link or button: numbered, ticked
 * when done, the current one marked `aria-current="step"` and lit by the
 * halo. It wraps on wide screens and scrolls as a chip row on a phone,
 * keeping the current step in view.
 */
export function Stepper({ label, steps, current, className }: StepperProps) {
  return (
    <nav aria-label={label} className={className ? `fa-ui-stepper ${className}` : 'fa-ui-stepper'}>
      <ChipRow as="ol" wrap>
        {steps.map((step, i) => {
          const marks = {
            className: 'fa-ui-step',
            'aria-current': step.id === current ? ('step' as const) : undefined,
            'data-done': step.done ? '' : undefined,
          }
          const inner = (
            <>
              <span className="fa-ui-step-n" aria-hidden="true">
                {step.done ? '✓' : i + 1}
              </span>
              <span className="fa-ui-step-label">{step.label}</span>
              <span className="fa-ui-sr">{`, steg ${i + 1} av ${steps.length}${step.done ? ', klart' : ''}`}</span>
            </>
          )
          return (
            <li key={step.id}>
              {step.href !== undefined ? (
                <a href={step.href} onClick={step.onSelect} {...marks}>
                  {inner}
                </a>
              ) : (
                <button type="button" onClick={step.onSelect} {...marks}>
                  {inner}
                </button>
              )}
            </li>
          )
        })}
      </ChipRow>
    </nav>
  )
}
