import { useClerk } from '@clerk/clerk-react'
import { Link } from '@tanstack/react-router'
import { UserRound } from 'lucide-react'
import { useRef } from 'react'

import { useUiStore } from '@/stores/uiStore'
import { useDismiss } from '../lib/useDismiss'
import { ACCOUNT_ROUTES } from '../nav'
import { ThemePicker } from './ThemePicker'

export function AccountMenu({
  phone,
  collapsed,
  name,
  open,
  onToggle,
  close,
}: {
  phone: boolean
  collapsed?: boolean
  name: string
  open: boolean
  onToggle: () => void
  close: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const { signOut } = useClerk()
  useDismiss(open, close, root, trigger, phone)
  return (
    <div className="fa-account-wrap">
      <button
        ref={trigger}
        type="button"
        className={phone ? 'fa-avatar-btn' : 'fa-account'}
        data-testid="fa-account"
        aria-label="Konto och inställningar"
        aria-expanded={open}
        aria-controls="fa-account-menu"
        onClick={onToggle}
      >
        {phone ? (
          <span className="fa-avatar">
            <UserRound size={17} strokeWidth={1.6} aria-hidden />
          </span>
        ) : (
          <>
            <b>Konto</b>
            {!collapsed && <span>Inställningar och tema</span>}
          </>
        )}
      </button>
      {open && (
        <>
          {phone && <div className="fa-scrim" aria-hidden />}
          <div
            ref={root}
            className="fa-menu"
            id="fa-account-menu"
            data-testid="fa-account-menu"
            data-anchor={phone ? 'sheet' : 'side'}
            role="dialog"
            aria-modal={phone ? true : undefined}
            aria-label="Konto och inställningar"
          >
            <div className="fa-menu-head">
              <b>Ditt konto</b>
              <span>{name}</span>
            </div>
            <Link className="fa-menu-item" to={ACCOUNT_ROUTES.konto} onClick={close}>
              Konto<span className="fa-menu-hint">Namn och e-post</span>
            </Link>
            <Link className="fa-menu-item" to={ACCOUNT_ROUTES.settings} onClick={close}>
              Inställningar<span className="fa-menu-hint">Frågeurval, coach och tema</span>
            </Link>
            <ThemePicker />
            <Link className="fa-menu-item" to="/hjalp" onClick={close}>
              Hjälp
            </Link>
            <button
              type="button"
              className="fa-menu-item"
              onClick={() => useUiStore.getState().setFolioPreview(false)}
            >
              Tillbaka till klassisk design
            </button>
            <hr className="fa-menu-sep" />
            <button
              type="button"
              className="fa-menu-item"
              onClick={() => {
                close()
                void signOut({ redirectUrl: '/' })
              }}
            >
              Logga ut
            </button>
            {phone && (
              <button type="button" className="fa-menu-item" onClick={close}>
                Stäng
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
