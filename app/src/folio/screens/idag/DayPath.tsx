import { SecChip } from '@/folio/ui/SecChip'
import { IdagLink, type NavigateHref } from './IdagLead'
import { daySteps, type HomeView } from './idagView'

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
  return (
    <section className="fa-day-path" aria-labelledby="fa-plan-h">
      <div className="fa-section-head">
        <h2 id="fa-plan-h">Dagens spår</h2>
        <p className="fa-meta">
          {steps.length} {steps.length === 1 ? 'station' : 'stationer'}
          {view.plan.minutes > 0
            ? ` · ${view.resume && view.resume.minutes == null ? 'resten ' : ''}ca ${view.plan.minutes} min`
            : ''}
          {view.plan.budget != null ? ` · din plan är ca ${view.plan.budget} min` : ''}
          {' · '}
          <IdagLink className="fa-link" href="/mer" navigateHref={navigateHref}>
            Ändra
          </IdagLink>
        </p>
      </div>
      <ol className="fa-track" aria-labelledby="fa-plan-h">
        {steps.map((step, i) => (
          <li
            key={step.key}
            className="fa-stop"
            data-fa-step={step.state}
            data-testid={step.item ? `daily-plan-item-${step.item.id}` : undefined}
            data-completed={step.state === 'done'}
          >
            <IdagLink
              className="fa-plan-row"
              href={step.href}
              navigateHref={navigateHref}
              data-testid={step.item ? `daily-plan-link-${step.item.id}` : undefined}
              aria-current={step.state === 'now' ? 'step' : undefined}
            >
              <span className="fa-dot" aria-hidden>
                {step.state === 'done' ? '✓' : i + 1}
              </span>
              <span className="fa-plan-body">
                <span className="fa-plan-title">
                  {step.state === 'done' ? (
                    <>
                      <span className="fa-sr">Klar:</span>{' '}
                    </>
                  ) : null}
                  {step.title}
                  {step.section ? (
                    <>
                      {' '}
                      <SecChip
                        section={step.section}
                        aria-hidden={step.title.includes(step.section) || undefined}
                      />
                    </>
                  ) : null}
                </span>{' '}
                <span className="fa-plan-detail">
                  {step.gloss}
                  {step.gloss && step.why ? ' · ' : ''}
                  {step.why}
                </span>
              </span>{' '}
              <span className="fa-plan-min">{step.page}</span>
            </IdagLink>
            {step.item?.kind === 'mock' && !step.item.completed && deferMock ? (
              <button className="fa-link fa-defer" type="button" onClick={deferMock}>
                Inte idag
              </button>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="fa-after">
        Efter spåret:{' '}
        <IdagLink className="fa-link" href="/ova" navigateHref={navigateHref}>
          blandad övning
        </IdagLink>
        ,{' '}
        <IdagLink className="fa-link" href="/prov" navigateHref={navigateHref}>
          ett provpass
        </IdagLink>{' '}
        eller{' '}
        <IdagLink className="fa-link" href="/uppslag" navigateHref={navigateHref}>
          Uppslag
        </IdagLink>
        . Det finns alltid mer att ta.
      </p>
    </section>
  )
}
