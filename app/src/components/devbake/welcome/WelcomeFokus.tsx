import { StepActions, StepBody, StepLinks, StepTitle } from './WelcomeBrev'
import type { WelcomeFlow } from './welcomeFixtures'

export function WelcomeFokus({ flow }: { flow: WelcomeFlow }) {
  return (
    <div className="wb-fokus">
      <header className="wb-focus-bar">
        <span className="wb-wordmark">
          HP<span>·</span>
          <em>Coach</em>
        </span>
        <button type="button" className="wb-link" onClick={flow.goToday}>
          Hoppa över
        </button>
      </header>
      <StepLinks flow={flow} />
      <div className="wb-focus-body">
        <StepTitle flow={flow} />
        <StepBody flow={flow} swatches />
        <StepActions flow={flow} skip={false} />
      </div>
    </div>
  )
}
