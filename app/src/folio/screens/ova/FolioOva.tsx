import { OvaContents } from './OvaContents'
import { type NavigateHref, OvaLead } from './OvaLead'
import { OvaMargin } from './OvaMargin'
import { buildOvaView, type OvaInput } from './ovaView'
import { useOvaExtras } from './useOvaExtras'
import './ova.css'

export type FolioOvaProps = Pick<OvaInput, 'stats' | 'pile' | 'due'> & {
  navigateHref: NavigateHref
}

export default function FolioOva(props: FolioOvaProps) {
  const extras = useOvaExtras()
  const view = buildOvaView({ ...props, ...extras })
  return (
    <div
      className={`fa-ova ${extras.viewport === 'phone' ? 'fa-phome' : 'fa-home'}`}
      data-testid="folio-ova"
    >
      <div className="fa-masthead">
        <span className="fa-label">Öva</span>
      </div>
      <div className="fa-page-main">
        <h1 className="fa-greet">Vad tränar vi?</h1>
        <p className="fa-day">{view.standfirst}</p>
        {view.statusLine ? (
          <p className="fa-status" role="status">
            {view.statusLine}
          </p>
        ) : null}
        <OvaLead view={view} navigateHref={props.navigateHref} />
        <OvaContents view={view} navigateHref={props.navigateHref} />
      </div>
      <OvaMargin view={view} navigateHref={props.navigateHref} />
    </div>
  )
}
