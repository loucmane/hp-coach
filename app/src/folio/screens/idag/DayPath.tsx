import { IdagLink, type NavigateHref } from './IdagLead'
import { daySteps, type HomeView, weekLine } from './idagView'

export function DayPath({
  view,
  navigateHref,
  deferMock,
}: {
  view: HomeView
  navigateHref: NavigateHref
  deferMock?: () => void
}) {
  const steps = daySteps(view)
  if (!steps.length || view.state === 'cold') return null
  const done = steps.filter((s) => s.state === 'done').length
  const week = weekLine(view.week)
  return (
    <section className="fa-section fa-day-path" aria-labelledby="fa-plan-h" data-fa-shade>
      <div className="fa-section-head">
        <h2 className="fa-h2" id="fa-plan-h">
          Dagens steg
        </h2>
        <span className="fa-meta">
          {done} av {steps.length} klara
        </span>
      </div>
      <ol className="fa-path" aria-labelledby="fa-plan-h">
        {steps.map((step, i) => (
          <li
            key={step.key}
            className="fa-step"
            data-fa-step={step.state}
            data-testid={step.item ? `daily-plan-item-${step.item.id}` : undefined}
            data-completed={step.state === 'done'}
          >
            <span className="fa-step-mark" aria-hidden>
              {step.state === 'done' ? '✓' : i + 1}
            </span>
            <div>
              <IdagLink
                className="fa-plan-row fa-step-row"
                href={step.href}
                navigateHref={navigateHref}
                data-testid={step.item ? `daily-plan-link-${step.item.id}` : undefined}
                aria-current={step.state === 'now' ? 'step' : undefined}
              >
                <span className="fa-plan-body">
                  <span className="fa-plan-line">
                    <span className="fa-plan-title">
                      {step.state === 'done' ? <span className="fa-sr">Klar: </span> : null}
                      {step.title}
                      {step.gloss ? <span>{step.gloss}</span> : null}
                    </span>
                    <span className="fa-leader" aria-hidden />
                    <span className="fa-plan-min">
                      {step.page} <span aria-hidden>→</span>
                    </span>
                  </span>
                  {step.why ? <span className="fa-plan-why">{step.why}</span> : null}
                </span>
              </IdagLink>
              {step.item?.kind === 'mock' && !step.item.completed && deferMock ? (
                <button className="fa-link fa-defer" type="button" onClick={deferMock}>
                  Inte idag
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {view.repetition.ready > 0 ? (
        <p className="fa-misses">
          <span className="fa-misses-tag">I Repetera</span>: {view.repetition.ready} redo nu
        </p>
      ) : null}
      {week ? <p className="fa-week">{week}</p> : null}
    </section>
  )
}
