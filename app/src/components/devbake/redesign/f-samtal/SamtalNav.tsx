// Samtal · the frame around Idag and the other doors.
//
// Desktop: the five doors are a list of conversations, as in a messages
// app — each door a round icon, its name and one line about what waits
// there ("23 missar att repetera") — beside one centred conversation
// column (max 680 px). Folded (⌘B, or Navigering), the list becomes a
// rail of round doors with their names as tooltips. The account is the
// list's foot; it opens a card whose theme choice is a row of reply chips.
// Phone: a slim top bar with the account's round button, the page, and a
// bottom bar of the five doors; the account opens as a sheet.

import { PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { OVA_DUE, PROGNOSIS, RESUME, TODAY } from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  fmtScore,
  type ThemeKey,
  useDismiss,
} from '@/components/devbake/redesign/r1Kit'
import { SamtalHome } from './SamtalHome'
import { Coach, Divider, DoorIcon, Mark, Replies } from './SamtalParts'

/** What waits behind each door: the line under its name. */
const PREVIEW: Record<Destination, string> = {
  idag: `Fortsätt ${RESUME.section}, fråga ${RESUME.position} av ${RESUME.total}`,
  ova: `${OVA_DUE} missar att repetera`,
  provpass: 'Ett helt pass, 55 minuter',
  uppslag: 'Lektioner och ramverk',
  framsteg: `Prognos ${fmtScore(PROGNOSIS.total)} av 2,0`,
}

type ThemeChoice = ThemeKey | 'system'

export function SamtalFrame({
  screen,
  width,
  theme,
  live,
  onScreen,
  onTheme,
  wanted,
  clearWanted,
}: DirectionProps & { wanted: Destination | null; clearWanted: () => void }) {
  // Screen 4 shows the frame's other state; screen 1 the default.
  const [collapsed, setCollapsed] = useState(screen === 4)
  const [menu, setMenu] = useState(screen === 4)
  const [dest, setDest] = useState<Destination>(wanted ?? 'idag')
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seat the frame when the screen changes only
  useEffect(() => {
    setCollapsed(screen === 4)
    setMenu(screen === 4)
    setDest(wanted ?? 'idag')
    clearWanted()
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

  const go = useCallback((d: Destination) => {
    setMenu(false)
    setDest(d)
  }, [])
  const closeMenu = useCallback(() => setMenu(false), [])

  const page =
    dest === 'idag' ? (
      <SamtalHome width={width} live={live} onResume={() => onScreen(2)} onGo={go} />
    ) : (
      <SamtalStub dest={dest} onGo={go} />
    )

  if (width === 'phone') {
    return (
      <div className="sa-phone">
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
        <div className="sa-pscroll" key={dest} inert={menu}>
          {page}
        </div>
        <nav className="sa-tabs" aria-label="Huvudmeny" inert={menu}>
          {DESTINATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className="sa-tab"
              data-testid={`rd-nav-${d.id}`}
              aria-current={dest === d.id ? 'page' : undefined}
              onClick={() => go(d.id)}
            >
              <span className="sa-tab-icon" aria-hidden>
                <DoorIcon id={d.id} size={20} />
                {d.id === 'ova' ? <span className="sa-tab-dot" /> : null}
              </span>
              <span className="sa-tab-label">
                {d.label}
                {d.id === 'ova' ? <span className="sa-sr">, {OVA_DUE} att repetera</span> : null}
              </span>
            </button>
          ))}
        </nav>
        {menu ? <AccountSheet theme={theme} onTheme={onTheme} close={closeMenu} /> : null}
      </div>
    )
  }

  return (
    <div className="sa-app" data-collapsed={String(collapsed)}>
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
              aria-current={dest === d.id ? 'page' : undefined}
              // Folded, the name is the tooltip's; Öva keeps its count.
              aria-label={
                collapsed
                  ? d.id === 'ova'
                    ? `${d.label}, ${OVA_DUE} att repetera`
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
                  <span className="sa-door-preview">{PREVIEW[d.id]}</span>
                </span>
              )}
              {d.id === 'ova' ? <span className="sa-door-dot" aria-hidden /> : null}
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
      <main className="sa-main" key={dest}>
        <div className="sa-col">{page}</div>
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

/** A door that round 2 builds: the coach says so, and offers the way back. */
function SamtalStub({ dest, onGo }: { dest: Destination; onGo: (d: Destination) => void }) {
  const d = DESTINATIONS.find((x) => x.id === dest) ?? DESTINATIONS[0]
  return (
    <div className="sa-stub">
      <Divider>{TODAY.dateLabel}</Divider>
      <div className="sa-thread">
        <Coach as="section" aria-labelledby="sa-stub-h">
          <h1 className="sa-stub-h" id="sa-stub-h">
            {d.label}
          </h1>
          <p className="sa-say">{d.blurb}</p>
          <p className="sa-say sa-say--quiet">
            Den här sidan byggs i omgång 2, när en riktning är vald. Menyn och kontot fungerar redan
            härifrån.
          </p>
        </Coach>
        <Replies>
          <button type="button" className="sa-chip" onClick={() => onGo('idag')}>
            Tillbaka till Idag
          </button>
        </Replies>
      </div>
    </div>
  )
}
