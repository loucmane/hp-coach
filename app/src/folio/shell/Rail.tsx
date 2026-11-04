import { Link } from '@tanstack/react-router'
import { PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import type { ReactNode } from 'react'

import type { ShellData } from '../contract/viewModel'
import { RAIL_DESTINATIONS, type RailDestination } from '../nav'
import { NavIcon } from './NavIcon'
import { Wordmark } from './Wordmark'

export function Rail({
  collapsed,
  onToggle,
  current,
  data,
  account,
  onSearch,
}: {
  collapsed: boolean
  onToggle: () => void
  current: RailDestination | null
  data: ShellData
  account: ReactNode
  onSearch: () => void
}) {
  return (
    <aside className="fa-side" data-testid="folio-rail">
      <div className="fa-side-head">
        <Link className="fa-brand-link" to="/" aria-label="HP-Coach, Idag">
          {collapsed ? (
            <span className="fa-monogram" role="img" aria-label="HP-Coach">
              HP
            </span>
          ) : (
            <Wordmark />
          )}
        </Link>
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
        {RAIL_DESTINATIONS.map((d) => (
          <Link
            key={d.id}
            className={`fa-nav-item${d.sub ? ' fa-nav-item--sub' : ''}`}
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
          </Link>
        ))}
      </nav>
      <div className="fa-side-foot">
        {account}
        <button
          type="button"
          className="fa-search"
          aria-label="Sök"
          onClick={onSearch}
          title={collapsed ? 'Sök och hoppa · ⌘K / Ctrl+K' : undefined}
        >
          {collapsed ? (
            <Search size={20} aria-hidden />
          ) : (
            <>
              <kbd>⌘K</kbd> sök och hoppa
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
