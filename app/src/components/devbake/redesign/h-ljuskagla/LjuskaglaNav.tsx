import { Moon, PanelLeftClose, PanelLeftOpen, Sun, UserRound, X } from 'lucide-react'
import { useCallback, useId, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  fmtClock,
  useDismiss,
} from '@/components/devbake/redesign/r1Kit'
import { LjuskaglaDestination, LjuskaglaHome } from './LjuskaglaHome'
import { LjuskaglaOva } from './LjuskaglaOva'
import { type FramePage, Mark, NAV_ICONS, type OpenPage } from './LjuskaglaParts'
import { LjuskaglaRepetera } from './LjuskaglaRepetera'

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

/**
 * The focus shell's head: an always-visible Avsluta, the section and the
 * reader's place, the clock (when there is one to show), the account, and a
 * warm line along the bottom for progress.
 */
export function DrillHead({
  section,
  position,
  total,
  elapsed,
  progress,
  onExit,
  theme,
  onTheme,
  onAccountOpenChange,
  inert = false,
}: Pick<DirectionProps, 'theme' | 'onTheme'> & {
  section: string
  position: number
  total: number
  /** Seconds on the clock, or null to leave the clock out. */
  elapsed: number | null
  /** 0–1 */
  progress: number
  onExit: () => void
  onAccountOpenChange: (open: boolean) => void
  /** While a dialog covers the drill. */
  inert?: boolean
}) {
  return (
    <header className="lj-drill-head" inert={inert}>
      <button
        type="button"
        className="lj-text-button lj-exit"
        data-testid="rd-exit"
        onClick={onExit}
      >
        <X size={18} aria-hidden />
        <span>Avsluta</span>
      </button>
      <span className="lj-drill-progress">
        {section}{' '}
        <span>
          · {position} av {total}
        </span>
      </span>
      {elapsed != null && (
        <span className="lj-clock" role="timer" aria-label={`Tid ${fmtClock(elapsed)}`}>
          {fmtClock(elapsed)}
        </span>
      )}
      <Account theme={theme} onTheme={onTheme} onOpenChange={onAccountOpenChange} />
      <span className="lj-progress-line" aria-hidden>
        <i style={{ width: `${progress * 100}%` }} />
      </span>
    </header>
  )
}

/** The door a page belongs to: Repetera is part of Öva. */
const PAGE_DOOR: Record<FramePage, Destination> = {
  idag: 'idag',
  ova: 'ova',
  repetera: 'ova',
  provpass: 'provpass',
  uppslag: 'uppslag',
  framsteg: 'framsteg',
}

/**
 * The normal shell around Idag, Öva and Repetera: the five doors and the
 * account, in a sidebar that gains light on approach (desktop) or a bottom
 * bar (phone). A door asks the host to go there and opens the page here as
 * well, so a host that does not navigate (a bare test mount, the real-app
 * preview) still answers the click the way round 1's doors did. The stage
 * remounts the frame for each screen, so a host's navigation always wins.
 */
export function LjuskaglaFrame({
  page: initialPage,
  ...props
}: DirectionProps & { page: FramePage }) {
  const { data, actions } = useDirectionData()
  const [page, setPage] = useState(initialPage)
  const [collapsed, setCollapsed] = useState(props.screen === 4)
  const phone = props.width === 'phone'
  const open: OpenPage = (next, ask) => {
    ask()
    setPage(next)
  }
  const go = (door: Destination) => open(door, () => actions.go(door))
  const nav = (
    <nav className="lj-nav" aria-label="Huvudmeny">
      {DESTINATIONS.map((d) => {
        const Icon = NAV_ICONS[d.id]
        return (
          <button
            type="button"
            key={d.id}
            data-testid={`rd-nav-${d.id}`}
            aria-current={PAGE_DOOR[page] === d.id ? 'page' : undefined}
            aria-label={d.label}
            title={d.label}
            onClick={() => go(d.id)}
          >
            <Icon size={20} strokeWidth={1.5} aria-hidden />
            <span className="lj-nav-label">{d.label}</span>
            {!phone && d.id === 'ova' && data.home.ovaDue > 0 && (
              <span className="lj-nav-count" title={`${data.home.ovaDue} att repetera`}>
                {data.home.ovaDue}
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
      <main className="lj-home-scroll" key={page}>
        {page === 'idag' ? (
          <LjuskaglaHome onResume={() => props.onScreen(2)} onOpen={open} />
        ) : page === 'ova' ? (
          <LjuskaglaOva />
        ) : page === 'repetera' ? (
          <LjuskaglaRepetera onBack={() => go('ova')} />
        ) : (
          <LjuskaglaDestination destination={page} />
        )}
      </main>
      {phone && nav}
    </div>
  )
}
