import { useId } from 'react'
import type { WelcomeOption } from './welcomeView'

export function WelcomeChoice({
  label,
  options,
  value,
  disabled,
  onChange,
  stacked = false,
}: {
  label: string
  options: readonly WelcomeOption[]
  value: string
  disabled: boolean
  onChange: (value: string) => void
  stacked?: boolean
}) {
  const name = useId()
  return (
    <fieldset className="fa-welcome-choice" disabled={disabled}>
      <legend>{label}</legend>
      <div className="fa-welcome-options" data-stacked={String(stacked)}>
        {options.map((option) => (
          <label
            key={option.value}
            className="fa-welcome-option"
            data-selected={String(option.value === value)}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <span className="fa-welcome-option-name">{option.label}</span>
              {option.detail && <span className="fa-welcome-option-detail">{option.detail}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
