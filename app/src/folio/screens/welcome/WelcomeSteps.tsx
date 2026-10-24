import { WELCOME_STEPS, type WelcomeSetupStep } from './welcomeView'

export function WelcomeSteps({
  steps,
  current,
  completed,
  disabled,
  onStep,
}: {
  steps: readonly WelcomeSetupStep[]
  current: WelcomeSetupStep
  completed: readonly WelcomeSetupStep[]
  disabled: boolean
  onStep: (step: WelcomeSetupStep) => void
}) {
  return (
    <nav className="fa-welcome-steps" aria-label="Välkomststeg">
      {steps.map((step) => (
        <button
          key={step}
          type="button"
          disabled={disabled}
          aria-current={step === current ? 'step' : undefined}
          aria-label={completed.includes(step) ? `${WELCOME_STEPS[step].label}, klart` : undefined}
          data-complete={String(completed.includes(step))}
          onClick={() => onStep(step)}
        >
          {WELCOME_STEPS[step].label}
        </button>
      ))}
    </nav>
  )
}
