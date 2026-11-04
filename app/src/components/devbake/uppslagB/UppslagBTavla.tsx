import {
  EntryNavigation,
  ExampleQuestion,
  ExampleSteps,
  ReferenceBody,
  ReferenceIndex,
  RunningHead,
  WorkedHeading,
} from './UppslagBMarginal'
import type { StudyFlow } from './uppslagBFixtures'

export function UppslagBTavla({ flow }: { flow: StudyFlow }) {
  return (
    <div className="ub-tavla">
      <RunningHead worked={flow.sel.s >= 5} />
      <div className="ub-board-body">
        {flow.sel.s === 1 ? (
          <ReferenceIndex flow={flow} />
        ) : flow.sel.s < 5 ? (
          <article className="ub-reference-board">
            <header className="ub-article-head">
              <button type="button" className="ub-link" onClick={flow.contents}>
                Alla råd
              </button>
              <p className="ub-label">Provteknik · {flow.entry.delprov ?? 'Alla delprov'}</p>
              <h2 className="ub-title" tabIndex={-1}>
                {flow.entry.headline}
              </h2>
            </header>
            <div>
              <ReferenceBody entry={flow.entry} />
              <EntryNavigation flow={flow} />
            </div>
          </article>
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
