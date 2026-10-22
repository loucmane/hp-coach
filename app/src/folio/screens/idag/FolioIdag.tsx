import type { MockPrescription } from '@/lib/scheduler'
import { DayPath } from './DayPath'
import { IdagLead, IdagLink, type NavigateHref } from './IdagLead'
import { IdagMargin } from './IdagMargin'
import { buildIdagView, daySentence, type IdagInput, shortItem, weekLine } from './idagView'
import { ReturnLink } from './ReturnLink'
import { useIdagExtras, useIdagTelemetry } from './useIdagExtras'
import './idag.css'

export type FolioIdagProps = Omit<
  IdagInput,
  'now' | 'examDate' | 'daysLeft' | 'resume' | 'trapNames'
> & {
  navigateHref: NavigateHref
  deferMock?: () => void
  mockPrescription?: MockPrescription | null
}

export default function FolioIdag(props: FolioIdagProps) {
  const extras = useIdagExtras(props.topTraps ?? [])
  useIdagTelemetry(props.plan, props.mockPrescription)
  const view = buildIdagView({ ...props, ...extras })
  const sentence = daySentence(view)
  const short = shortItem(view)
  const { navigateHref } = props
  const days = view.exam.daysLeft
  return (
    <div
      className={`fa-idag ${extras.viewport === 'phone' ? 'fa-phome' : 'fa-home'}`}
      data-testid="folio-idag"
    >
      <div className="fa-masthead">
        <span className="fa-label">{view.today.dateLabel}</span>
        <p className="fa-count">
          {days >= 0 ? (
            <>
              <strong>{days === 0 ? 'Idag' : `${days} ${days === 1 ? 'dag' : 'dagar'}`}</strong>
              {days > 0 ? ' kvar till högskoleprovet' : ' är det högskoleprov'},{' '}
              {view.exam.dateLabel.replace(/(\d+) /, '$1 ')}
            </>
          ) : (
            'Provet är skrivet.'
          )}
        </p>
      </div>
      <div className="fa-page-main">
        <h1 className="fa-greet" id="home-greeting" data-testid="home-greeting">
          {view.today.greeting}
          {view.today.firstName ? `, ${view.today.firstName}` : ''}.
        </h1>
        {sentence ? <p className="fa-day">{sentence}</p> : null}
        <div data-testid="daily-plan-card">
          <IdagLead view={view} navigateHref={navigateHref} />
          {view.plan.allComplete && props.plan && !view.resume ? (
            <ReturnLink plan={props.plan} history={props.history ?? []} />
          ) : null}
          {short ? (
            <p className="fa-short" data-fa-shade>
              <IdagLink
                className="fa-link fa-short-link"
                href={short.href}
                navigateHref={navigateHref}
              >
                <span>Kort om tid? 5 minuter</span>
                <span className="fa-short-what">
                  – {short.what} · {short.minutes} min
                </span>
                <span aria-hidden>→</span>
              </IdagLink>
            </p>
          ) : null}
          <DayPath view={view} navigateHref={navigateHref} deferMock={props.deferMock} />
          {view.state === 'cold' && weekLine(view.week) ? (
            <p className="fa-week">{weekLine(view.week)}</p>
          ) : null}
        </div>
      </div>
      <IdagMargin view={view} navigateHref={navigateHref} />
    </div>
  )
}
