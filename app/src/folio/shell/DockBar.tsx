import type { FocusDock } from '../host'
import { Go } from '../ui/Go'
import './focus.css'

/** Shell-owned, after main in reading/tab order. No duplicate phone action. */
export function DockBar({ primary, secondary, detail }: FocusDock) {
  return (
    <footer className="fa-dockbar" role="contentinfo" aria-label="Åtgärder i passet">
      <div className="fa-dock-inner">
        {secondary && (
          <div className="fa-dock-left">
            <button
              type="button"
              className="fa-dock-secondary"
              onClick={secondary.onClick}
              disabled={secondary.disabled}
            >
              {secondary.label}
            </button>
          </div>
        )}
        <div className="fa-dock-next">
          {detail != null && <small className="fa-dock-detail">{detail}</small>}
          <Go onClick={primary.onClick} disabled={primary.disabled} kbd={primary.kbd}>
            {primary.label}
          </Go>
        </div>
      </div>
    </footer>
  )
}
