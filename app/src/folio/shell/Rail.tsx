import { Link } from '@tanstack/react-router'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { ReactNode } from 'react'

import type { ShellData } from '../contract/viewModel'
import { DESTINATIONS, type Destination } from '../nav'
import { NavIcon } from './NavIcon'
import { Wordmark } from './Wordmark'

export function Rail({
  collapsed,
  onToggle,
  current,
  data,
  account,
}: {
  collapsed: boolean
  onToggle: () => void
  current: Destination | null
  data: ShellData
  account: ReactNode
}) {
  return (
    <aside className="fa-side" data-testid="folio-rail">
      <div className="fa-side-head">
        {collapsed ? (
          <span className="fa-monogram" role="img" aria-label="HP-Coach">
            HP
          </span>
        ) : (
          <Wordmark />
        )}
        <button
          type="button"
          className="fa-icon-btn"
          data-testid="fa-collapse"
          aria-label={collapsed ? 'Fäll ut menyn' : 'Fäll ihop menyn'}
          aria-expanded={!collapsed}
          title="⌘B / Ctrl+B"
          onClick={onToggle}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.5} aria-hidden />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.5} aria-hidden />
          )}
        </button>
      </div>
      <nav className="fa-nav" aria-label="Huvudmeny">
        {DESTINATIONS.map((d) => (
          <Link
            key={d.id}
            className="fa-nav-item"
            data-testid={`fa-nav-${d.id}`}
            to={d.to}
            aria-current={current === d.id ? 'page' : undefined}
            aria-label={d.label}
            aria-describedby={`fa-nav-sub-${d.id}`}
            title={collapsed ? d.label : undefined}
          >
            {collapsed && (
              <span className="fa-thumb">
                <NavIcon id={d.id} />
              </span>
            )}
            <span className={collapsed ? 'fa-sr' : 'fa-nav-text'}>
              <span className="fa-nav-label">{d.label}</span>
              <span className="fa-nav-sub" id={`fa-nav-sub-${d.id}`}>
                {data.subtitles[d.id]}
              </span>
            </span>
            {d.id === 'ova' && data.dueCount > 0 && <span className="fa-nav-dot" aria-hidden />}
          </Link>
        ))}
      </nav>
      <div className="fa-side-foot">{account}</div>
    </aside>
  )
}
