import { useState } from 'react'
import type { DrillCount } from '@/lib/drill'
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
  const [count, setCount] = useState<DrillCount>(10)
  const view = buildOvaView({ ...props, ...extras, count })
  return (
    <div
      className={`fa-ova ${extras.viewport === 'phone' ? 'fa-ova-phone' : ''}`}
      data-testid="folio-ova"
    >
      <div className="fa-ova-topline">
        <span className="fa-ova-label">Öva</span>
        <span>Ingen klocka · inga avdrag · svaren sparas</span>
      </div>
      <div className="fa-ova-grid">
        <div className="fa-ova-main">
          <h1>Vad tränar vi?</h1>
          <p className="fa-ova-lede">{view.standfirst}</p>
          {view.statusLine ? (
            <p className="fa-ova-status" role="status">
              {view.statusLine}
            </p>
          ) : null}
          <OvaLead
            view={view}
            navigateHref={props.navigateHref}
            phone={extras.viewport === 'phone'}
            onCount={setCount}
          />
          <OvaContents view={view} navigateHref={props.navigateHref} />
        </div>
        <OvaMargin
          smartDrill={extras.smartDrill}
          setSmartDrill={extras.setSmartDrill}
          saving={extras.saving}
          preferenceError={extras.preferenceError}
        />
      </div>
    </div>
  )
}
