import { Moon, PanelLeftClose, PanelLeftOpen, Sun, UserRound, X } from 'lucide-react'
import { useCallback, useId, useRef, useState } from 'react'
import { OVA_DUE } from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  useDismiss,
} from '@/components/devbake/redesign/r1Kit'
import { LjuskaglaDestination, LjuskaglaHome } from './LjuskaglaHome'
import { Mark, NAV_ICONS } from './LjuskaglaParts'

export function Account({
  theme,
  onTheme,
  initiallyOpen = false,
  onOpenChange,
}: Pick<DirectionProps, 'theme' | 'onTheme'> & {
  initiallyOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(initiallyOpen)
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const close = useCallback(() => {
    if (ref.current?.contains(document.activeElement)) trigger.current?.focus()
    setOpen(false)
    onOpenChange?.(false)
  }, [onOpenChange])
  useDismiss(open, close, ref)
  return (
    <div className="lj-account" ref={ref}>
      <button
        ref={trigger}
        className="lj-account-trigger"
        type="button"
        data-testid="rd-account"
        aria-label="Konto och inställningar"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen(!open)
          onOpenChange?.(!open)
        }}
      >
        <UserRound size={19} strokeWidth={1.5} aria-hidden />
        <span className="lj-account-label">Ditt konto</span>
      </button>
      {open && (
        <section
          className="lj-account-menu"
          id={id}
          data-testid="rd-account-menu"
          aria-label="Konto och inställningar"
        >
          <div className="lj-menu-heading">
            <h2>Ditt läsrum</h2>
            <button
              type="button"
              aria-label="Stäng kontomenyn"
              onClick={() => {
                close()
                trigger.current?.focus()
              }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
          <p>Konto · Gratisplan</p>
          <h3>Inställningar</h3>
          <button
            type="button"
            className="lj-theme"
            data-testid="rd-theme-toggle"
            onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
            <span>{theme === 'dark' ? 'Byt till ljust läge' : 'Byt till mörkt läge'}</span>
          </button>
          <details>
            <summary>Hjälp med läsningen</summary>
            <p>
              J/K eller ↑/↓ flyttar styckeljuset. A–E väljer svar. Enter bekräftar. Stäng av ljuset
              om du vill läsa hela texten jämnt belyst.
            </p>
          </details>
        </section>
      )}
    </div>
  )
}

export function LjuskaglaFrame({
  destination,
  onGo,
  ...props
}: DirectionProps & { destination: Destination; onGo: (d: Destination) => void }) {
  const [collapsed, setCollapsed] = useState(props.screen === 4)
  const phone = props.width === 'phone'
  const nav = (
    <nav className="lj-nav" aria-label="Huvudmeny">
      {DESTINATIONS.map((d) => {
        const Icon = NAV_ICONS[d.id]
        return (
          <button
            type="button"
            key={d.id}
            data-testid={`rd-nav-${d.id}`}
            aria-current={destination === d.id ? 'page' : undefined}
            aria-label={d.label}
            title={d.label}
            onClick={() => onGo(d.id)}
          >
            <Icon size={20} strokeWidth={1.5} aria-hidden />
            <span className="lj-nav-label">{d.label}</span>
            {!phone && d.id === 'ova' && (
              <span className="lj-nav-count" title={`${OVA_DUE} att repetera`}>
                {OVA_DUE}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
  const account = <Account {...props} initiallyOpen={props.screen === 4} />
  return (
    <div className="lj-frame" data-collapsed={String(collapsed)}>
      {phone ? (
        <header className="lj-phone-head">
          <Mark />
          {account}
        </header>
      ) : (
        <aside className="lj-sidebar">
          <Mark compact={collapsed} />
          <button
            className="lj-collapse"
            type="button"
            data-testid="rd-collapse"
            aria-label={collapsed ? 'Fäll ut menyn' : 'Fäll ihop menyn'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={19} aria-hidden />
            ) : (
              <PanelLeftClose size={19} aria-hidden />
            )}
          </button>
          {nav}
          <div className="lj-sidebar-foot">{account}</div>
        </aside>
      )}
      <main className="lj-home-scroll" key={destination}>
        {destination === 'idag' ? (
          <LjuskaglaHome onResume={() => props.onScreen(2)} onGo={onGo} />
        ) : (
          <LjuskaglaDestination destination={destination} onResume={() => props.onScreen(2)} />
        )}
      </main>
      {phone && nav}
    </div>
  )
}
