import { Link } from '@tanstack/react-router'
import { DESTINATIONS, type Destination } from '../nav'
import { NavIcon } from './NavIcon'

export function TabBar({
  current,
  dueCount,
  inert,
}: {
  current: Destination | null
  dueCount: number
  inert?: boolean
}) {
  return (
    <nav className="fa-tabs" data-testid="folio-tabs" aria-label="Huvudmeny" inert={inert}>
      {DESTINATIONS.map((d) => (
        <Link
          key={d.id}
          className="fa-tab"
          to={d.to}
          data-testid={`fa-nav-${d.id}`}
          aria-label={d.label}
          aria-current={current === d.id ? 'page' : undefined}
        >
          <span className="fa-tab-icon">
            <NavIcon id={d.id} />
          </span>
          <span className="fa-tab-word">
            {d.label}
            {d.id === 'ova' && dueCount > 0 && (
              <>
                <span className="fa-tab-dot" aria-hidden />
                <span className="fa-sr">, {dueCount} att repetera</span>
              </>
            )}
          </span>
        </Link>
      ))}
    </nav>
  )
}
