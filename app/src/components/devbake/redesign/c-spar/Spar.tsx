// C · Spår — an expressive learning path. The direction's root: it injects
// Bricolage Grotesque + Figtree, scopes the token set (spar.css) to its own
// data attribute, keeps the calm-mode switch and routes the four screens:
//   1 Idag        — the M3 expandable rail (phone: navigation bar) around
//                   Home, where the day is a vertical path of steps
//   2 Läsfråga    — one reading column; the question in a tray docked below
//   3 Facit       — the tray risen into a feedback sheet over half the page
//   4 Navigering  — the rail expanded into a drawer with the account menu
//                   open (phone: the account sheet open)
//
// Guided and colourful, but bounded for a reader who loses focus easily:
// colour tints headers, chips and path nodes only; nothing moves while
// reading; "Lugnt läge" (a visible switch on Home and in the drill) turns
// the springs, most of the colour and the extra numbers off.

import {
  CircleQuestionMark,
  Leaf,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  Settings,
  UserRound,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import './spar.css'
import { OVA_DUE } from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  type ThemeKey,
  useDismiss,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { SparDrill } from './SparDrill'
import { SparHome } from './SparHome'
import { Mark, NAV_ICONS } from './sparParts'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=Figtree:ital,wght@0,300..900;1,300..900&display=swap'

type Calm = { calm: boolean; setCalm: (calm: boolean) => void }

export function Spar(props: DirectionProps) {
  useWebFonts('spar', FONTS)
  const [calm, setCalm] = useState(false)
  // The destination lives here so the end of a unit can send the reader
  // straight on (Repetition lives in Öva). A switch made in the bake-off's
  // own switcher lands on Idag.
  const [dest, setDest] = useState<Destination>('idag')
  const pending = useRef<Destination | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on every screen change, by design
  useLayoutEffect(() => {
    setDest(pending.current ?? 'idag')
    pending.current = null
  }, [props.screen])
  const { onScreen } = props
  const goFromDrill = useCallback(
    (d: Destination) => {
      pending.current = d
      onScreen(1)
    },
    [onScreen],
  )

  const drill = props.screen === 2 || props.screen === 3
  return (
    <div
      data-rd="spar"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      data-calm={String(calm)}
      data-testid="rd-spar"
      lang="sv"
    >
      {drill ? (
        <SparDrill {...props} calm={calm} setCalm={setCalm} onGo={goFromDrill} />
      ) : (
        <SparFrame {...props} calm={calm} setCalm={setCalm} dest={dest} setDest={setDest} />
      )}
    </div>
  )
}

function SparFrame({
  screen,
  width,
  theme,
  live,
  onScreen,
  onTheme,
  calm,
  setCalm,
  dest,
  setDest,
}: DirectionProps & Calm & { dest: Destination; setDest: (d: Destination) => void }) {
  // Screen 4 shows the frame's other state: the rail expanded, menu open.
  const [expanded, setExpanded] = useState(screen === 4)
  const [menu, setMenu] = useState(screen === 4)
  useEffect(() => {
    setExpanded(screen === 4)
    setMenu(screen === 4)
  }, [screen])

  // ⌘B / Ctrl+B expands and folds the rail, as in the live app.
  useEffect(() => {
    if (!live || width !== 'desktop') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setExpanded((x) => !x)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live, width])

  const go = useCallback(
    (d: Destination) => {
      setMenu(false)
      setDest(d)
    },
    [setDest],
  )
  const closeMenu = useCallback(() => setMenu(false), [])

  const page =
    dest === 'idag' ? (
      <SparHome
        width={width}
        live={live && !menu}
        calm={calm}
        setCalm={setCalm}
        onResume={() => onScreen(2)}
        onGo={go}
      />
    ) : (
      <SparStub dest={dest} />
    )
  const account = (anchor: 'rail' | 'sheet') => (
    <Account
      open={menu}
      setOpen={setMenu}
      close={closeMenu}
      theme={theme}
      onTheme={onTheme}
      calm={calm}
      setCalm={setCalm}
      anchor={anchor}
      labelled={anchor === 'rail' && expanded}
    />
  )

  if (width === 'phone') {
    return (
      <div className="sp-phone">
        <header className="sp-appbar">
          <span className="sp-brand">
            <Mark size={32} />
            <span className="sp-brand-name">HP-Coach</span>
          </span>
          {account('sheet')}
        </header>
        <div className="sp-pscroll" key={dest}>
          <div className={live ? 'sp-enter' : undefined}>{page}</div>
        </div>
        <nav className="sp-navbar" aria-label="Huvudmeny">
          {DESTINATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className="sp-navbar-item"
              data-testid={`rd-nav-${d.id}`}
              aria-current={dest === d.id ? 'page' : undefined}
              onClick={() => go(d.id)}
            >
              <span className="sp-ind">
                {NAV_ICONS[d.id](22)}
                {d.id === 'ova' ? <DueDot /> : null}
              </span>
              <span className="sp-navbar-label">{d.label}</span>
            </button>
          ))}
        </nav>
      </div>
    )
  }

  return (
    <div className="sp-app" data-expanded={String(expanded)}>
      <nav className="sp-rail" aria-label="Huvudmeny">
        <div className="sp-rail-top">
          <button
            type="button"
            className="sp-icon-btn"
            data-testid="rd-collapse"
            aria-label={expanded ? 'Fäll ihop menyn' : 'Fäll ut menyn'}
            aria-expanded={expanded}
            title={expanded ? 'Fäll ihop (⌘B)' : 'Fäll ut (⌘B)'}
            onClick={() => setExpanded((x) => !x)}
          >
            {expanded ? (
              <PanelLeftClose size={22} strokeWidth={2} aria-hidden />
            ) : (
              <Menu size={22} strokeWidth={2} aria-hidden />
            )}
          </button>
          <span className="sp-brand">
            <Mark size={expanded ? 36 : 40} />
            <span className="sp-brand-name">HP-Coach</span>
          </span>
        </div>
        <div className="sp-rail-items">
          {DESTINATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className="sp-rail-item"
              data-testid={`rd-nav-${d.id}`}
              aria-current={dest === d.id ? 'page' : undefined}
              onClick={() => go(d.id)}
            >
              <span className="sp-ind">
                {NAV_ICONS[d.id](22)}
                {d.id === 'ova' ? <DueDot /> : null}
              </span>
              <span className="sp-rail-label">{d.label}</span>
            </button>
          ))}
        </div>
        <div className="sp-rail-foot">{account('rail')}</div>
      </nav>
      <main className="sp-main" key={dest}>
        <div className={live ? 'sp-enter' : undefined}>{page}</div>
      </main>
    </div>
  )
}

/** Öva has missar waiting: a quiet dot, never a count (the count lives in
 *  Öva itself). Hidden in calm mode. */
function DueDot() {
  return (
    <span className="sp-navdot">
      <span className="sp-sr">, missar att repetera</span>
    </span>
  )
}

function Account({
  open,
  setOpen,
  close,
  theme,
  onTheme,
  calm,
  setCalm,
  anchor,
  labelled,
}: Calm & {
  open: boolean
  setOpen: (open: boolean) => void
  close: () => void
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  /** rail: a popover beside the rail; sheet: a modal bottom sheet (phone). */
  anchor: 'rail' | 'sheet'
  labelled: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, close, ref)
  const items = (
    <>
      <MenuItem icon={<UserRound size={20} strokeWidth={2} />} label="Konto" onClick={close} />
      <MenuItem
        icon={<Settings size={20} strokeWidth={2} />}
        label="Inställningar"
        onClick={close}
      />
      <MenuSwitch
        icon={<Moon size={20} strokeWidth={2} />}
        label="Mörkt läge"
        on={theme === 'dark'}
        testid="rd-theme-toggle"
        onToggle={() => onTheme(theme === 'dark' ? 'light' : 'dark')}
      />
      <MenuSwitch
        icon={<Leaf size={20} strokeWidth={2} />}
        label="Lugnt läge"
        hint="Färre färger och siffror, inga studsar"
        on={calm}
        testid="sp-calm-toggle"
        onToggle={() => setCalm(!calm)}
      />
      <MenuItem
        icon={<CircleQuestionMark size={20} strokeWidth={2} />}
        label="Hjälp"
        onClick={close}
      />
      <hr className="sp-menu-sep" />
      <MenuItem icon={<LogOut size={20} strokeWidth={2} />} label="Logga ut" onClick={close} />
    </>
  )
  const head = (
    <div className="sp-menu-head">
      <span className="sp-avatar sp-avatar--lg" aria-hidden>
        <UserRound size={24} strokeWidth={2} />
      </span>
      <span>
        <b>Ditt konto</b>
        <span>Gratisplan · inloggad</span>
      </span>
    </div>
  )
  return (
    <div ref={ref} className="sp-account-wrap" data-anchor={anchor}>
      <button
        type="button"
        className="sp-account"
        data-testid="rd-account"
        aria-label={labelled ? undefined : 'Konto och inställningar'}
        aria-expanded={open}
        aria-haspopup={anchor === 'sheet' ? 'dialog' : 'menu'}
        onClick={() => setOpen(!open)}
      >
        <span className="sp-avatar" aria-hidden>
          <UserRound size={20} strokeWidth={2} />
        </span>
        {labelled ? (
          <span className="sp-account-text">
            <b>Ditt konto</b>
            <span>Inställningar och tema</span>
          </span>
        ) : null}
      </button>
      {open && anchor === 'rail' ? (
        <div className="sp-menu" role="menu" aria-label="Konto" data-testid="rd-account-menu">
          {head}
          {items}
        </div>
      ) : null}
      {open && anchor === 'sheet' ? (
        <>
          <button
            type="button"
            className="sp-scrim"
            aria-label="Stäng kontomenyn"
            tabIndex={-1}
            onClick={close}
          />
          <div
            className="sp-menu sp-menu--sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Konto"
            data-testid="rd-account-menu"
          >
            <span className="sp-menu-grab" aria-hidden />
            {head}
            <div role="menu" aria-label="Konto och inställningar">
              {items}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" role="menuitem" className="sp-menu-item" onClick={onClick}>
      <span className="sp-menu-icon" aria-hidden>
        {icon}
      </span>
      <span className="sp-menu-label">{label}</span>
    </button>
  )
}

function MenuSwitch({
  icon,
  label,
  hint,
  on,
  testid,
  onToggle,
}: {
  icon: ReactNode
  label: string
  hint?: string
  on: boolean
  testid: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={on}
      className="sp-menu-item"
      data-testid={testid}
      onClick={onToggle}
    >
      <span className="sp-menu-icon" aria-hidden>
        {icon}
      </span>
      <span className="sp-menu-label">
        {label}
        {hint ? <span className="sp-menu-hint">{hint}</span> : null}
      </span>
      <i className="sp-switch" aria-hidden />
    </button>
  )
}

function SparStub({ dest }: { dest: Destination }) {
  const d = DESTINATIONS.find((x) => x.id === dest) ?? DESTINATIONS[0]
  return (
    <section className="sp-stub" aria-labelledby="sp-stub-h">
      <span className="sp-stub-blob" aria-hidden>
        {NAV_ICONS[dest](34)}
      </span>
      <h1 className="sp-display" id="sp-stub-h">
        {d.label}
      </h1>
      <p className="sp-lede">{d.blurb}</p>
      {dest === 'ova' ? (
        <p className="sp-stub-due">
          <b>{OVA_DUE} missar</b> väntar i Repetera, de äldsta först.
        </p>
      ) : null}
      <p className="sp-stub-note">
        Den här sidan byggs i omgång 2, när en riktning är vald. Menyn och kontot fungerar redan
        härifrån.
      </p>
    </section>
  )
}
