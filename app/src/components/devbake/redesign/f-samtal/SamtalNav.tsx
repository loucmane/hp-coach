// Samtal · the frame around Idag, Öva, Repetera, Provpass, its result and
// Framsteg.
//
// Desktop: the five doors are a list of conversations, as in a messages
// app — each door a round icon, its name and one line about what waits
// there ("23 missar att repetera") — beside one centred conversation
// column (max 680 px). Folded (⌘B, or Navigering), the list becomes a
// rail of round doors with their names as tooltips. The account is the
// list's foot; it opens a card whose theme choice is a row of reply chips.
// Phone: a slim top bar with the account's round button, the page, and a
// bottom bar of the five doors; the account opens as a sheet.
//
// Kit v2: the page follows the screen on stage (1 and 4 Idag, 5 Öva, 8
// Repetera, which lives inside Öva: its door stays current there; 9 the
// Provpass hub, 10 a result, which lives inside Provpass; 11 Framsteg), and
// a door asks for its destination through useDirectionData().actions.go —
// in the bake-off the switcher moves, in the app the route changes. The
// fold survives a move between doors; only Navigering (4) folds the list
// and opens the account, and the way back to Idag (1) unfolds it again.
// Framsteg opens on its overview from its door and on Historik from Idag's
// "Alla pass i Framsteg". A started pass leaves the frame (Samtal.tsx) and
// comes back to it handed in: Provpass then shows the hand-in (PassHanded)
// in place of the hub, and its way back — or, once it has failed, the
// Provpass door — returns to the hub. While a gate stands over the hub,
// the frame under it is inert.

import { PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  fmtScore,
  type ThemeKey,
  useDismiss,
} from '@/components/devbake/redesign/r1Kit'
import type { HomeView } from '@/components/devbake/redesign/viewModel'
import { type FramstegTab, SamtalFramsteg } from './SamtalFramsteg'
import { SamtalHome } from './SamtalHome'
import { SamtalOva } from './SamtalOva'
import { DoorIcon, Mark, words } from './SamtalParts'
import { type HandedPass, PassHanded, SamtalProvpassHub, SamtalResult } from './SamtalProvpass'
import { SamtalRepetera } from './SamtalRepetera'

type Page = 'idag' | 'ova' | 'repetera' | 'provpass' | 'resultat' | 'framsteg'

/** The page a screen shows in the frame. */
function pageOf(screen: DirectionProps['screen']): Page {
  if (screen === 5) return 'ova'
  if (screen === 8) return 'repetera'
  if (screen === 9) return 'provpass'
  if (screen === 10) return 'resultat'
  if (screen === 11) return 'framsteg'
  return 'idag'
}

/** The door that is current on a page. */
const PAGE_DOOR: Record<Page, Destination> = {
  idag: 'idag',
  ova: 'ova',
  repetera: 'ova',
  provpass: 'provpass',
  resultat: 'provpass',
  framsteg: 'framsteg',
}

/** "Nästa: kvant, om en dag", from the Provpass rhythm when there is one. */
function provPreview(home: HomeView): string {
  const p = home.provpass
  if (!p) return 'Ett helt pass, 55 minuter'
  const half = p.half === 'kvant' ? 'kvant' : 'verbal'
  if (p.due || p.daysUntilNext <= 0) return `Dags för ett pass: ${half}`
  return `Nästa: ${half}, om ${words(p.daysUntilNext)} ${p.daysUntilNext === 1 ? 'dag' : 'dagar'}`
}

/** What waits behind each door: the line under its name. */
function previews(home: HomeView): Record<Destination, string> {
  const { resume, plan, ovaDue, prognosis } = home
  const first = plan.items.find((i) => !i.completed)
  return {
    idag: resume
      ? `Fortsätt ${resume.section}, fråga ${resume.position} av ${resume.total}`
      : first
        ? `Dagens plan, ${plan.minutes} min`
        : 'Dagens plan',
    ova:
      ovaDue > 0
        ? `${ovaDue} ${ovaDue === 1 ? 'miss' : 'missar'} att repetera`
        : 'Alla delprov och Repetera',
    provpass: provPreview(home),
    uppslag: 'Lektioner och ramverk',
    framsteg:
      prognosis.total != null
        ? `Prognos ${fmtScore(prognosis.total)} av 2,0`
        : 'Prognos och historik',
  }
}

type ThemeChoice = ThemeKey | 'system'

export function SamtalFrame({
  screen,
  width,
  theme,
  live,
  onScreen,
  onTheme,
  onStartPass,
  passNotice = null,
  passHanded = null,
  onPassBack,
}: DirectionProps & {
  /** A pass was started from the hub: the screen runs it (Samtal.tsx). */
  onStartPass?: (passId: string) => void
  /** Said once on the hub: the last pass was given up. */
  passNotice?: 'void' | null
  /** A pass handed in, waiting for its result or refused: Provpass shows
   *  it in place of the hub. */
  passHanded?: { pass: HandedPass; failed: boolean } | null
  /** From the hand-in back to the hub. */
  onPassBack?: () => void
}) {
  const { data, actions } = useDirectionData()
  const page = pageOf(screen)
  // What the page shows: Provpass shows a handed-in pass in place of its hub.
  const view = page === 'provpass' && passHanded ? 'handed' : page
  const current = PAGE_DOOR[page]
  const preview = previews(data.home)
  const ovaDue = data.home.ovaDue
  // A gate stands over the hub: the frame under it is out of reach.
  const [modal, setModal] = useState(false)
  // Framsteg's view: its door opens the overview, Idag's history link
  // Historik.
  const [framstegTab, setFramstegTab] = useState<FramstegTab>('oversikt')

  // Screen 4 shows the frame's other state; screen 1 the default.
  const [collapsed, setCollapsed] = useState(screen === 4)
  const [menu, setMenu] = useState(screen === 4)
  const shown = useRef(screen)
  useEffect(() => {
    const was = shown.current
    shown.current = screen
    if (was === screen) return
    if (screen === 4) {
      setCollapsed(true)
      setMenu(true)
      return
    }
    setMenu(false)
    if (was === 4 && screen === 1) setCollapsed(false)
  }, [screen])

  // ⌘B / Ctrl+B folds the list, as in the live app.
  useEffect(() => {
    if (!live || width !== 'desktop') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setCollapsed((c) => !c)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live, width])

  // A door the reader chose: the new page's heading takes focus. From a
  // hand-in back to the hub — its way back, or the Provpass door once the
  // hand-in has failed — the hub's question takes it.
  const chosen = useRef(false)
  const toHub = useCallback(() => {
    chosen.current = true
    onPassBack?.()
  }, [onPassBack])
  const go = useCallback(
    (d: Destination) => {
      setMenu(false)
      chosen.current = d !== PAGE_DOOR[page] || page === 'repetera' || page === 'resultat'
      if (d === 'framsteg') setFramstegTab('oversikt')
      if (d === 'provpass' && passHanded?.failed) toHub()
      actions.go(d)
    },
    [actions, page, passHanded, toHub],
  )
  const closeMenu = useCallback(() => setMenu(false), [])
  const pageRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: on a new page or view only
  useEffect(() => {
    if (!chosen.current) return
    chosen.current = false
    // The page's heading on show (Framsteg keeps its other view's hidden).
    const heading = [...(pageRef.current?.querySelectorAll<HTMLElement>('h1') ?? [])].find(
      (h) => h.closest('[hidden]') == null,
    )
    if (live) heading?.focus({ preventScroll: true })
  }, [view])

  const body =
    page === 'ova' ? (
      <SamtalOva width={width} live={live} />
    ) : page === 'repetera' ? (
      <SamtalRepetera width={width} live={live} />
    ) : page === 'provpass' && passHanded ? (
      <PassHanded
        pass={passHanded.pass}
        failed={passHanded.failed}
        width={width}
        live={live}
        onBack={toHub}
      />
    ) : page === 'provpass' ? (
      <SamtalProvpassHub
        width={width}
        live={live}
        onStart={(id) => onStartPass?.(id)}
        onModal={setModal}
        notice={passNotice}
      />
    ) : page === 'resultat' ? (
      <SamtalResult width={width} live={live} />
    ) : page === 'framsteg' ? (
      <SamtalFramsteg width={width} live={live} tab={framstegTab} onTab={setFramstegTab} />
    ) : (
      <SamtalHome
        width={width}
        live={live}
        onResume={() => {
          // Round 1's step to Läsfråga, and the kit's resume.
          onScreen(2)
          actions.resume()
        }}
        onHistory={() => {
          setFramstegTab('historik')
          chosen.current = true
          actions.go('framsteg')
        }}
      />
    )

  if (width === 'phone') {
    return (
      <div className="sa-phone" inert={modal}>
        <header className="sa-ptop">
          <Mark />
          <button
            type="button"
            className="sa-avatar-btn"
            data-testid="rd-account"
            aria-label="Konto och inställningar"
            aria-expanded={menu}
            aria-controls="sa-account-sheet"
            onClick={() => setMenu(!menu)}
          >
            <span className="sa-avatar" aria-hidden>
              <UserRound size={18} strokeWidth={1.75} />
            </span>
          </button>
        </header>
        <div className="sa-pscroll" key={page} inert={menu} ref={pageRef}>
          {body}
        </div>
        <nav className="sa-tabs" aria-label="Huvudmeny" inert={menu}>
          {DESTINATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className="sa-tab"
              data-testid={`rd-nav-${d.id}`}
              aria-current={current === d.id ? 'page' : undefined}
              onClick={() => go(d.id)}
            >
              <span className="sa-tab-icon" aria-hidden>
                <DoorIcon id={d.id} size={20} />
                {d.id === 'ova' && ovaDue > 0 ? <span className="sa-tab-dot" /> : null}
              </span>
              <span className="sa-tab-label">
                {d.label}
                {d.id === 'ova' && ovaDue > 0 ? (
                  <span className="sa-sr">, {ovaDue} att repetera</span>
                ) : null}
              </span>
            </button>
          ))}
        </nav>
        {menu ? <AccountSheet theme={theme} onTheme={onTheme} close={closeMenu} /> : null}
      </div>
    )
  }

  return (
    <div className="sa-app" data-collapsed={String(collapsed)} inert={modal}>
      <aside className="sa-side" aria-label="Meny och konto">
        <div className="sa-side-head">
          <Mark name={!collapsed} />
          <button
            type="button"
            className="sa-icon-btn sa-tip"
            data-testid="rd-collapse"
            data-tip={collapsed ? 'Fäll ut  ⌘B' : 'Fäll ihop  ⌘B'}
            aria-label={collapsed ? 'Fäll ut menyn' : 'Fäll ihop menyn'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} strokeWidth={1.75} aria-hidden />
            ) : (
              <PanelLeftClose size={18} strokeWidth={1.75} aria-hidden />
            )}
          </button>
        </div>
        <nav className="sa-doors" aria-label="Huvudmeny">
          {DESTINATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className={`sa-door${collapsed ? ' sa-tip' : ''}`}
              data-testid={`rd-nav-${d.id}`}
              data-tip={collapsed ? d.label : undefined}
              aria-current={current === d.id ? 'page' : undefined}
              // Folded, the name is the tooltip's; Öva keeps its count.
              aria-label={
                collapsed
                  ? d.id === 'ova' && ovaDue > 0
                    ? `${d.label}, ${ovaDue} att repetera`
                    : d.label
                  : undefined
              }
              onClick={() => go(d.id)}
            >
              <span className="sa-door-icon" aria-hidden>
                <DoorIcon id={d.id} />
              </span>
              {collapsed ? null : (
                <span className="sa-door-text">
                  <span className="sa-door-label">{d.label}</span>
                  <span className="sa-door-preview">{preview[d.id]}</span>
                </span>
              )}
              {d.id === 'ova' && ovaDue > 0 ? <span className="sa-door-dot" aria-hidden /> : null}
            </button>
          ))}
        </nav>
        <div className="sa-side-foot">
          <AccountPopover
            open={menu}
            setOpen={setMenu}
            close={closeMenu}
            theme={theme}
            onTheme={onTheme}
            folded={collapsed}
          />
        </div>
      </aside>
      <main className="sa-main" key={page}>
        <div className="sa-col" ref={pageRef}>
          {body}
        </div>
      </main>
    </div>
  )
}

/** Desktop: the account entry at the foot of the list, and its card. */
function AccountPopover({
  open,
  setOpen,
  close,
  theme,
  onTheme,
  folded,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  close: () => void
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  folded: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, close, ref)
  return (
    <div ref={ref} className="sa-account-wrap">
      <button
        type="button"
        className={`sa-account${folded ? ' sa-tip' : ''}`}
        data-testid="rd-account"
        data-tip={folded ? 'Konto' : undefined}
        aria-label={folded ? 'Konto och inställningar' : undefined}
        aria-expanded={open}
        aria-controls="sa-account-menu"
        onClick={() => setOpen(!open)}
      >
        <span className="sa-avatar" aria-hidden>
          <UserRound size={18} strokeWidth={1.75} />
        </span>
        {folded ? null : (
          <span className="sa-account-text">
            <b>Ditt konto</b>
            <span>Inställningar och tema</span>
          </span>
        )}
      </button>
      {open ? (
        <div className="sa-menu" id="sa-account-menu" data-anchor={folded ? 'rail' : 'side'}>
          <AccountItems theme={theme} onTheme={onTheme} close={close} />
        </div>
      ) : null}
    </div>
  )
}

/** Phone: the account entry opens a sheet over a scrim. */
function AccountSheet({
  theme,
  onTheme,
  close,
}: {
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  close: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(true, close, ref)
  return (
    <>
      <div className="sa-scrim" aria-hidden />
      <div className="sa-menu" id="sa-account-sheet" data-anchor="sheet" ref={ref}>
        <span className="sa-menu-grip" aria-hidden />
        <AccountItems theme={theme} onTheme={onTheme} close={close} />
      </div>
    </>
  )
}

/** The account card: a disclosure of plain buttons (no menu role: there is
 *  no arrow-key model to promise). The theme is chosen the way everything
 *  in Samtal is — with reply chips. Esc or a press outside closes it. */
function AccountItems({
  theme,
  onTheme,
  close,
}: {
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  close: () => void
}) {
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
    <div className="sa-menu-body" data-testid="rd-account-menu">
      <div className="sa-menu-head">
        <span className="sa-avatar sa-avatar--lg" aria-hidden>
          <UserRound size={20} strokeWidth={1.75} />
        </span>
        <span className="sa-menu-who">
          <b>Ditt konto</b>
          <span>Inloggad · gratisplan</span>
        </span>
      </div>
      <MenuItem label="Konto" hint="Namn, e-post och plan" onClick={close} />
      <MenuItem label="Inställningar" hint="Provdatum och mål" onClick={close} />
      <div className="sa-menu-theme">
        <span className="sa-menu-theme-label" id="sa-theme-label">
          Tema
        </span>
        <fieldset className="sa-theme-chips" aria-labelledby="sa-theme-label">
          <button
            type="button"
            className="sa-pick"
            aria-pressed={choice === 'light'}
            onClick={() => pick('light')}
          >
            Ljust
          </button>
          <button
            type="button"
            className="sa-pick"
            aria-pressed={choice === 'dark'}
            onClick={() => pick('dark')}
            data-testid="rd-theme-toggle"
          >
            Mörkt
          </button>
          <button
            type="button"
            className="sa-pick"
            aria-pressed={choice === 'system'}
            onClick={() => pick('system')}
          >
            System
          </button>
        </fieldset>
      </div>
      <MenuItem label="Hjälp" hint="Kortkommandon och frågor" onClick={close} />
      <hr className="sa-menu-sep" />
      <MenuItem label="Logga ut" onClick={close} />
    </div>
  )
}

function MenuItem({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" className="sa-menu-item" onClick={onClick}>
      <span>{label}</span>
      {hint ? <span className="sa-menu-hint">{hint}</span> : null}
    </button>
  )
}
