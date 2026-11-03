import type { ComponentProps, ReactNode } from 'react'

import './ui.css'

export type SegOption<T extends string | number> = {
  value: T
  label: ReactNode
  /** A second, quieter line ("lördag 10 april · 158 dagar"). */
  hint?: ReactNode
  disabled?: boolean
}

type Named =
  | { label: string; 'aria-labelledby'?: undefined }
  | { label?: undefined; 'aria-labelledby': string }

export type SegProps<T extends string | number> = Named &
  Omit<
    ComponentProps<'fieldset'>,
    'onChange' | 'children' | 'role' | 'aria-label' | 'aria-labelledby' | 'disabled'
  > & {
    options: readonly SegOption<T>[]
    value: T
    onChange: (value: T) => void
    /** The options share the row's width (a card's narrow column). */
    stretch?: boolean
  }

/**
 * A segmented choice (session size, half, theme): a named group (a
 * fieldset) of toggle buttons with exactly one pressed, each a 44 px target.
 * Picking the pressed one changes nothing: it is a choice, never a cap.
 */
export function Seg<T extends string | number>({
  label,
  options,
  value,
  onChange,
  stretch,
  className,
  ...rest
}: SegProps<T>) {
  return (
    <fieldset
      {...rest}
      aria-label={label}
      className={className ? `fa-ui-seg ${className}` : 'fa-ui-seg'}
      data-stretch={stretch ? '' : undefined}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="fa-ui-seg-option"
          aria-pressed={option.value === value}
          disabled={option.disabled}
          onClick={() => {
            if (option.value !== value) onChange(option.value)
          }}
        >
          {option.label}
          {option.hint != null ? (
            <>
              {' '}
              <small>{option.hint}</small>
            </>
          ) : null}
        </button>
      ))}
    </fieldset>
  )
}
