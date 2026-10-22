import { FramstegMargin, type MasteryProps } from './FramstegMargin'
import { FramstegReport, type NavigateHref } from './FramstegReport'
import { FramstegSections } from './FramstegSections'
import { buildFramstegView, type FramstegInput } from './framstegView'
import { useFramstegExtras } from './useFramstegExtras'
import './framsteg.css'

export type FolioFramstegProps = Pick<FramstegInput, 'stats'> &
  MasteryProps & { navigateHref: NavigateHref }

export default function FolioFramsteg(props: FolioFramstegProps) {
  const extras = useFramstegExtras()
  const view = buildFramstegView({ ...props, ...extras })
  const phone = extras.viewport === 'phone'
  return (
    <div className={`fa-framsteg ${phone ? 'fa-phome' : 'fa-home'}`} data-testid="folio-framsteg">
      <div className="fa-masthead">
        <span className="fa-label">Framsteg</span>
        <span className="fa-count">
          {extras.days} dagar · {extras.sitting.label.toLowerCase()}
        </span>
      </div>
      <div className="fa-page-main">
        <h1 className="fa-greet">Framsteg</h1>
        {view.statusLine ? (
          <p className="fa-status" role="status">
            {view.statusLine}
          </p>
        ) : (
          <>
            <p className="fa-day" data-testid="progress-prose">
              {view.weekSentence}
            </p>
            <FramstegReport view={view} navigateHref={props.navigateHref} />
            <FramstegSections view={view} navigateHref={props.navigateHref} phone={phone} />
          </>
        )}
      </div>
      {view.state === 'ready' ? (
        <FramstegMargin
          view={view}
          navigateHref={props.navigateHref}
          patternsHeld={props.patternsHeld}
          userId={props.userId}
        />
      ) : null}
    </div>
  )
}
