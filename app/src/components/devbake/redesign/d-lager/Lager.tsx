// D · Lager — spatial depth, glass done right. The direction's root: it
// injects Newsreader + Inter + Fraunces, scopes the token set (lager.css)
// to its own data attribute, paints the ambient FIELD that stays put
// behind every screen, and routes the four bake-off screens:
//   1 Idag        — opaque sheets on a LÄS-tinted field, notes as plain text
//                   on the field, the floating labelled dock (phone: a
//                   floating glass tab bar)
//   2 Läsfråga    — the field drains to grey; the reading sheet and the
//                   question sheet float side by side under glass controls
//   3 Facit       — the explanation stacks on top as a second sheet
//   4 Navigering  — the dock in its compact state (the page scrolled) with
//                   the account panel open (phone: a floating panel above
//                   the tab bar)
//
// Glass rule kept in the markup: a glass element is never placed inside
// another glass element or inside anything that animates its opacity —
// either would become its "backdrop root" and the glass would stop
// blurring the page behind it.

import { BookOpen, ChartLine, ChevronRight, PenLine, Sun, Timer, UserRound } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import './lager.css'
import { OVA_DUE } from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  type ThemeKey,
  useDismiss,
  useWebFonts,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { LagerDrill } from './LagerDrill'
import { LagerHome } from './LagerHome'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,100..900,0..100;1,9..144,100..900,0..100&family=Inter:opsz,wght@14..32,100..900&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap'

const ICONS: Record<Destination, (size: number) => ReactNode> = {
  idag: (size) => <Sun size={size} strokeWidth={1.75} aria-hidden />,
  ova: (size) => <PenLine size={size} strokeWidth={1.75} aria-hidden />,
  provpass: (size) => <Timer size={size} strokeWidth={1.75} aria-hidden />,
  uppslag: (size) => <BookOpen size={size} strokeWidth={1.75} aria-hidden />,
  framsteg: (size) => <ChartLine size={size} strokeWidth={1.75} aria-hidden />,
}

/** How far screen 4 scrolls Idag, so the dock shows its compact state. */
const NAV_SCROLL = 150

export function Lager(props: DirectionProps) {
  useWebFonts('lager', FONTS)
  // The field drains while reading and warms back when the text is done.
  const [doneWarm, setDoneWarm] = useState(false)
  const drill = props.screen === 2 || props.screen === 3
  return (
    <div
      data-rd="lager"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      data-mood={drill && !doneWarm ? 'calm' : 'warm'}
      data-testid="rd-lager"
      lang="sv"
    >
      {/* z1 — the field: one static light, tinted by LÄS on Idag and
       *  drained to a calm grey while reading. */}
      <div className="la-field" aria-hidden>
        <i className="la-field-warm" />
        <i className="la-field-calm" />
        <i className="la-field-grain" />
      </div>
      {drill ? <LagerDrill {...props} onDone={setDoneWarm} /> : <LagerFrame {...props} />}
    </div>
  )
}

type AccountProps = {
  open: boolean
  setOpen: (open: boolean) => void
  close: () => void
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
}

function LagerFrame({ screen, width, theme, live, onScreen, onTheme }: DirectionProps) {
  // Screen 4 shows the chrome's other state: menu open, and on desktop the
  // page scrolled a little, which is what shrinks the dock.
  const [menu, setMenu] = useState(screen === 4)
  const [scrolled, setScrolled] = useState(false)
  const [dest, setDest] = useState<Destination>('idag')
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setMenu(screen === 4)
    setDest('idag')
  }, [screen])
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const y = screen === 4 && width === 'desktop' && dest === 'idag' ? NAV_SCROLL : 0
    el.scrollTop = y
    setScrolled(y > 32)
  }, [screen, width, dest])

  const go = useCallback((d: Destination) => {
    setMenu(false)
    setDest(d)
  }, [])
  const closeMenu = useCallback(() => setMenu(false), [])
  const account: AccountProps = { open: menu, setOpen: setMenu, close: closeMenu, theme, onTheme }
  const phone = width === 'phone'

  const onScroll = (e: { currentTarget: HTMLElement }) =>
    setScrolled(e.currentTarget.scrollTop > 32)

  const corner = phone ? <AccountTrigger {...account} glass /> : null
  const page =
    dest === 'idag' ? (
      <LagerHome
        width={width}
        live={live}
        onResume={() => onScreen(2)}
        onGo={go}
        account={corner}
      />
    ) : (
      <Stub dest={dest} width={width} live={live} account={corner} />
    )

  return (
    <>
      <div className="la-scroll" ref={scrollRef} onScroll={onScroll} key={dest}>
        {page}
      </div>
      {/* The scroll edge exists only once the page has moved: at rest
       *  nothing live is ever blurred. */}
      {scrolled ? <div className="la-edge" aria-hidden /> : null}
      {phone ? (
        <nav className="la-tabbar la-glass" aria-label="Huvudmeny">
          {DESTINATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className="la-tab"
              data-testid={`rd-nav-${d.id}`}
              aria-current={dest === d.id ? 'page' : undefined}
              onClick={() => go(d.id)}
            >
              {ICONS[d.id](22)}
              <span>{d.label}</span>
              {d.id === 'ova' ? <DueBadge /> : null}
            </button>
          ))}
        </nav>
      ) : (
        <Dock dest={dest} go={go} compact={scrolled} account={account} />
      )}
      {phone && menu ? <AccountSheet {...account} /> : null}
    </>
  )
}

function Dock({
  dest,
  go,
  compact,
  account,
}: {
  dest: Destination
  go: (d: Destination) => void
  compact: boolean
  account: AccountProps
}) {
  const anchor = useRef<HTMLDivElement>(null)
  useDismiss(account.open, account.close, anchor)
  return (
    <div className="la-dock-wrap">
      <div className="la-dock-anchor" ref={anchor}>
        {/* Compact while the page is scrolled: lower, never unlabelled,
         *  never reordered. */}
        <nav
          className="la-dock la-glass"
          data-compact={String(compact)}
          aria-label="Huvudmeny"
          data-testid="rd-dock"
        >
          {DESTINATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className="la-dock-item"
              data-testid={`rd-nav-${d.id}`}
              aria-current={dest === d.id ? 'page' : undefined}
              onClick={() => go(d.id)}
            >
              {ICONS[d.id](compact ? 20 : 22)}
              <span>{d.label}</span>
              {d.id === 'ova' ? <DueBadge /> : null}
            </button>
          ))}
          <span className="la-dock-sep" aria-hidden />
          <AccountTrigger {...account} />
        </nav>
        {account.open ? <AccountMenu {...account} /> : null}
      </div>
    </div>
  )
}

function DueBadge() {
  return (
    <span className="la-badge-n">
      {OVA_DUE}
      <span className="la-sr"> att repetera</span>
    </span>
  )
}

function AccountTrigger({ open, setOpen, glass = false }: AccountProps & { glass?: boolean }) {
  return (
    <button
      type="button"
      className={`la-avatar${glass ? ' la-glass' : ''}`}
      data-testid="rd-account"
      aria-label="Konto och inställningar"
      aria-expanded={open}
      aria-controls="la-account-menu"
      onClick={() => setOpen(!open)}
    >
      <UserRound size={19} strokeWidth={1.75} aria-hidden />
    </button>
  )
}

type ThemeChoice = ThemeKey | 'system'

/**
 * The account panel's content, Lager's own: a compact title line (no
 * avatar block), the theme as a three-part segmented control — Ljust ·
 * Mörkt · System, the chosen part a small lit lens in a recessed track —
 * and plain rows with trailing chevrons. A disclosure of buttons, not a
 * menu role: there is no arrow-key model to promise.
 */
function MenuItems({ close, theme, onTheme }: AccountProps) {
  // "System" follows the device; the bake-off itself keeps light/dark.
  const [choice, setChoice] = useState<ThemeChoice>(theme)
  const pick = (c: ThemeChoice) => {
    setChoice(c)
    if (c === 'system') {
      const dark =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      onTheme(dark ? 'dark' : 'light')
    } else onTheme(c)
  }
  return (
    <>
      <p className="la-menu-title">
        <b>Ditt konto</b>
        <span>Gratisplan</span>
      </p>
      <fieldset className="la-seg">
        <legend className="la-sr">Tema</legend>
        <button type="button" aria-pressed={choice === 'light'} onClick={() => pick('light')}>
          Ljust
        </button>
        <button
          type="button"
          aria-pressed={choice === 'dark'}
          onClick={() => pick('dark')}
          data-testid="rd-theme-toggle"
        >
          Mörkt
        </button>
        <button type="button" aria-pressed={choice === 'system'} onClick={() => pick('system')}>
          System
        </button>
      </fieldset>
      <MenuItem label="Konto" onClick={close} />
      <MenuItem label="Inställningar" onClick={close} />
      <MenuItem label="Hjälp" onClick={close} />
      <hr className="la-menu-sep" />
      <MenuItem label="Logga ut" onClick={close} chevron={false} />
    </>
  )
}

/** Desktop: glass is allowed here — the panel is a control and carries
 *  short labels only; the thick, barely saturated material keeps them
 *  ≥ 4.5:1 over any backdrop. */
function AccountMenu(props: AccountProps) {
  return (
    <div
      className="la-menu la-glass la-glass-thick"
      id="la-account-menu"
      data-anchor="dock"
      data-testid="rd-account-menu"
    >
      <MenuItems {...props} />
    </div>
  )
}

/** Phone: a detached glass panel floating just above the tab bar, inset
 *  from the edges and rounded on every corner — a control layer like the
 *  tab bar under it (short labels only; the thick material keeps them
 *  ≥ 4.5:1 over any backdrop, and turns opaque under reduced
 *  transparency). The page dims behind it; the tab bar stays lit. */
function AccountSheet(props: AccountProps) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(true, props.close, ref)
  return (
    <>
      <button
        type="button"
        className="la-scrim"
        aria-label="Stäng menyn"
        tabIndex={-1}
        onClick={props.close}
      />
      <div
        ref={ref}
        className="la-acct la-glass la-glass-thick"
        id="la-account-menu"
        data-testid="rd-account-menu"
      >
        <MenuItems {...props} />
      </div>
    </>
  )
}

function MenuItem({
  label,
  onClick,
  chevron = true,
}: {
  label: string
  onClick: () => void
  chevron?: boolean
}) {
  return (
    <button type="button" className="la-menu-item" onClick={onClick}>
      <span>{label}</span>
      {chevron ? <ChevronRight size={17} strokeWidth={2} aria-hidden /> : null}
    </button>
  )
}

function Stub({
  dest,
  width,
  live,
  account,
}: {
  dest: Destination
  width: WidthKey
  live: boolean
  account: ReactNode
}) {
  const d = DESTINATIONS.find((x) => x.id === dest) ?? DESTINATIONS[0]
  return (
    <div className={width === 'phone' ? 'la-phome' : undefined}>
      {width === 'phone' ? (
        <div className="la-ptop">
          <span className="la-mark-word">
            <i aria-hidden />
            HP-Coach
          </span>
          {account}
        </div>
      ) : null}
      <section
        className={`la-sheet la-stub${live ? ' la-rise' : ''}`}
        data-depth="2"
        aria-labelledby="la-stub-h"
      >
        <span className="la-chip">{d.label}</span>
        <h1 id="la-stub-h">{d.label}</h1>
        <p>{d.blurb}</p>
        <p className="la-stub-note">
          Den här sidan byggs i omgång 2, när en riktning är vald. Dockan och kontot fungerar redan
          härifrån.
        </p>
      </section>
    </div>
  )
}
