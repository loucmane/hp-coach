// C · Spår — an expressive learning path. The direction's root: it injects
// Bricolage Grotesque + Figtree, scopes the token set (spar.css) to its own
// data attribute, keeps the calm-mode switch and routes the screens:
//   1 Idag        — the M3 expandable rail (phone: navigation bar) around
//                   Home, where the day is a vertical path of steps
//   2 Läsfråga    — one reading column; the question in a tray docked below
//   3 Facit       — the tray risen into a feedback sheet over half the page
//   4 Navigering  — the rail expanded into a drawer with the account menu
//                   open (phone: the account sheet open)
//   5 Öva         — the practice hub: the ripe misses as a station, the
//                   eight sections in their two halves
//   6 Kvantfråga  — a short problem on its own card, the tray following it
//   7 DTK         — the printed page on a white mat in the wide column
//   8 Repetera    — Öva's sub-page: the misses as a vertical stig
//
// Guided and colourful, but bounded for a reader who loses focus easily:
// colour tints headers, chips and path nodes only; nothing moves while
// reading; "Lugnt läge" (a visible switch on Home and in the drill) turns
// the springs, most of the colour and the extra numbers off.
//
// Kit v2: every screen reads useDirectionData() and asks the host through
// its actions (a destination, a drill, Repetera, the account); round 1's
// own moves between screens 1–4 keep using onScreen.

import {
  ArrowLeft,
  CircleQuestionMark,
  Leaf,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  Settings,
  UserRound,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import './spar.css'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  type ThemeKey,
  useDismiss,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { type Calm, SparDrill } from './SparDrill'
import { SparHome } from './SparHome'
import { SparOva } from './SparOva'
import { SparQuant } from './SparQuant'
import { SparRepetera } from './SparRepetera'
import { Mark, NAV_ICONS } from './sparParts'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=Figtree:ital,wght@0,300..900;1,300..900&display=swap'

export function Spar(props: DirectionProps) {
  useWebFonts('spar', FONTS)
  // Lugnt läge lasts while the direction is mounted: every screen it
  // routes shares it (the kit has no setting to keep it in yet).
  const [calm, setCalm] = useState(false)
  const reading = props.screen === 2 || props.screen === 3
  const quant = props.screen === 6 || props.screen === 7
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
      {reading ? (
        <SparDrill {...props} calm={calm} setCalm={setCalm} />
      ) : quant ? (
        <SparQuant key={props.screen} {...props} calm={calm} setCalm={setCalm} />
      ) : (
        <SparFrame {...props} calm={calm} setCalm={setCalm} />
      )}
    </div>
  )
}

/** The destination a frame screen belongs to (Repetera lives in Öva). */
function destOf(screen: DirectionProps['screen']): Destination {
  return screen === 5 || screen === 8 ? 'ova' : 'idag'
}

const PAGE_NAMES: Record<string, string> = {
  idag: 'Idag',
  ova: 'Öva',
  repetera: 'Repetition',
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
}: DirectionProps & Calm) {
  const { data, actions } = useDirectionData()
  // Screen 4 shows the frame's other state: the rail expanded, menu open.
  const [expanded, setExpanded] = useState(screen === 4)
  const [menu, setMenu] = useState(screen === 4)
  // The host decides the screen; the frame keeps its own destination too,
  // so a host that does not navigate (a test, a preview) still moves.
  const [dest, setDest] = useState<Destination>(() => destOf(screen))
  useEffect(() => {
    setExpanded(screen === 4)
    setMenu(screen === 4)
    setDest(destOf(screen))
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
      actions.go(d)
    },
    [actions],
  )
  const closeMenu = useCallback(() => setMenu(false), [])

  const pageKey =
    dest === 'idag' ? 'idag' : dest === 'ova' ? (screen === 8 ? 'repetera' : 'ova') : dest
  // A new page puts focus on its title (not on the frame's first mount).
  const scrollRef = useRef<HTMLElement>(null)
  const firstPage = useRef(true)
  // The phone's app bar takes the page's name once its title scrolls away.
  const [titled, setTitled] = useState(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: a page change only
  useEffect(() => {
    setTitled(false)
    if (firstPage.current) {
      firstPage.current = false
      return
    }
    if (!live) return
    const title = scrollRef.current?.querySelector<HTMLElement>('h1')
    if (!title) return
    if (!title.hasAttribute('tabindex')) title.setAttribute('tabindex', '-1')
    title.focus({ preventScroll: true })
  }, [pageKey])

  const page =
    pageKey === 'idag' ? (
      <SparHome
        width={width}
        live={live && !menu}
        calm={calm}
        setCalm={setCalm}
        onResume={() => {
          actions.resume()
          onScreen(2)
        }}
        onGo={go}
      />
    ) : pageKey === 'ova' ? (
      <SparOva width={width} live={live && !menu} />
    ) : pageKey === 'repetera' ? (
      <SparRepetera width={width} live={live && !menu} />
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
  const due = data.home.ovaDue > 0

  if (width === 'phone') {
    return (
      <div className="sp-phone">
        <header className="sp-appbar" data-titled={String(titled)}>
          {pageKey === 'repetera' ? (
            <button type="button" className="sp-link sp-appbar-back" onClick={() => go('ova')}>
              <ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
              Öva
            </button>
          ) : (
            <span className="sp-brand">
              <Mark size={32} />
              <span className="sp-brand-name">HP-Coach</span>
              {PAGE_NAMES[pageKey] ? (
                <span className="sp-appbar-title" aria-hidden>
                  {PAGE_NAMES[pageKey]}
                </span>
              ) : null}
            </span>
          )}
          {account('sheet')}
        </header>
        <div
          className="sp-pscroll"
          key={pageKey}
          ref={(el) => {
            scrollRef.current = el
          }}
          onScroll={(e) => setTitled(e.currentTarget.scrollTop > 88)}
        >
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
                {d.id === 'ova' && due ? <DueDot /> : null}
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
                {d.id === 'ova' && due ? <DueDot /> : null}
              </span>
              <span className="sp-rail-label">{d.label}</span>
            </button>
          ))}
        </div>
        <div className="sp-rail-foot">{account('rail')}</div>
      </nav>
      <main
        className="sp-main"
        key={pageKey}
        ref={(el) => {
          scrollRef.current = el
        }}
      >
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
  const { actions } = useDirectionData()
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, close, ref)
  const then = (action: () => void) => () => {
    close()
    action()
  }
  const items = (
    <>
      <MenuItem
        icon={<UserRound size={20} strokeWidth={2} />}
        label="Konto"
        onClick={then(actions.openKonto)}
      />
      <MenuItem
        icon={<Settings size={20} strokeWidth={2} />}
        label="Inställningar"
        onClick={then(actions.openKonto)}
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
      <MenuItem
        icon={<LogOut size={20} strokeWidth={2} />}
        label="Logga ut"
        onClick={then(actions.signOut)}
      />
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

/** A destination this direction has not built yet. The bake-off shows its
 *  own card for it; this page stands in for a host that does not move. */
function SparStub({ dest }: { dest: Destination }) {
  const d = DESTINATIONS.find((x) => x.id === dest) ?? DESTINATIONS[0]
  return (
    <section className="sp-stub" aria-labelledby="sp-stub-h">
      <span className="sp-stub-blob" aria-hidden>
        {NAV_ICONS[dest](34)}
      </span>
      <h1 className="sp-display" id="sp-stub-h" tabIndex={-1}>
        {d.label}
      </h1>
      <p className="sp-lede">{d.blurb}</p>
      <p className="sp-stub-note">
        Den här sidan är inte byggd än i Spår. Menyn och kontot fungerar redan härifrån.
      </p>
    </section>
  )
}
