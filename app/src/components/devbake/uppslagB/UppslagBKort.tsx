import {
  ExampleQuestion,
  ExampleSteps,
  ReferenceArticle,
  ReferenceIndex,
  RunningHead,
  WorkedHeading,
} from './UppslagBMarginal'
import type { StudyFlow } from './uppslagBFixtures'

export function UppslagBKort({ flow }: { flow: StudyFlow }) {
  return (
    <div className="ub-kort">
      <RunningHead worked={flow.sel.s >= 5} />
      <div className="ub-card-body">
        {flow.sel.s === 1 ? (
          <ReferenceIndex flow={flow} />
        ) : flow.sel.s < 5 ? (
          <div className="ub-reference-card">
            <ReferenceArticle flow={flow} />
          </div>
        ) : (
          <>
            <WorkedHeading />
            <div className="ub-worked">
              <ExampleQuestion />
              <ExampleSteps flow={flow} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
