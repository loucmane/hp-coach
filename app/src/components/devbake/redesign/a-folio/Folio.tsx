// A · Folio — editorial paper, next generation. The direction's root: it
// injects Literata + Inter, scopes the token set (folio.css) to its own
// data attribute and routes the four bake-off screens:
//   1 Idag        — the app frame (one sheet of paper: a typeset contents
//                   list beside the page, no panel) around Home
//   2 Läsfråga    — the drill as a book spread (FolioDrill)
//   3 Facit       — the same spread, graded, the facit leading with the trap
//   4 Navigering  — the frame in its other state: the contents folded to a
//                   thumb index (the letter tabs on a dictionary's edge) and
//                   the account slip open (phone: the account sheet)

import { PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import './folio.css'
import { OVA_DUE } from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  type ThemeKey,
  useDismiss,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { FolioDrill } from './FolioDrill'
import { FolioHome } from './FolioHome'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&display=swap'

/** The folded rail is a thumb index: each destination's initial, set in
 *  Literata like the tabs cut into a reference book's edge. Hover or focus
 *  pulls the tab out to its full word. */
const THUMB: Record<Destination, string> = {
  idag: 'I',
  ova: 'Ö',
  provpass: 'P',
  uppslag: 'U',
  framsteg: 'F',
}

type ThemeChoice = ThemeKey | 'system'

export function Folio(props: DirectionProps) {
  useWebFonts('folio', FONTS)
  const drill = props.screen === 2 || props.screen === 3
  // A destination asked for at the end of a unit ("Nästa: Repetition"
  // opens Öva): the frame opens there instead of on Idag.
  const [wanted, setWanted] = useState<Destination | null>(null)
  const { onScreen } = props
  const goFromDrill = useCallback(
    (d: Destination) => {
      setWanted(d)
      onScreen(1)
    },
    [onScreen],
  )
  const clearWanted = useCallback(() => setWanted(null), [])
  return (
    <div
      data-rd="folio"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      data-testid="rd-folio"
      lang="sv"
    >
      {drill ? (
        <FolioDrill {...props} onGo={goFromDrill} />
      ) : (
        <FolioFrame {...props} wanted={wanted} clearWanted={clearWanted} />
      )}
    </div>
  )
}

function FolioFrame({
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

  // ⌘B / Ctrl+B folds the sidebar, as in the live app.
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
      <FolioHome width={width} live={live} onResume={() => onScreen(2)} onGo={go} />
    ) : (
      <FolioStub dest={dest} />
    )

  if (width === 'phone') {
    return (
      <div className="fo-phone">
        <header className="fo-ptop">
          <Wordmark />
          <button
            type="button"
            className="fo-avatar-btn"
            data-testid="rd-account"
            aria-label="Konto och inställningar"
            aria-expanded={menu}
            aria-controls="fo-account-sheet"
            onClick={() => setMenu(!menu)}
          >
            <span className="fo-avatar" aria-hidden>
              <UserRound size={17} strokeWidth={1.6} />
            </span>
          </button>
        </header>
        <div className="fo-pscroll" key={dest}>
          <div className={live ? 'fo-enter' : undefined}>{page}</div>
        </div>
        {/* The tabs are words, as on the desktop contents list: a
         *  magazine's section bar, not a row of stock pictograms. */}
        <nav className="fo-tabs" aria-label="Huvudmeny">
          {DESTINATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className="fo-tab"
              data-testid={`rd-nav-${d.id}`}
              aria-current={dest === d.id ? 'page' : undefined}
              onClick={() => go(d.id)}
            >
              <span className="fo-tab-word">
                {d.label}
                {d.id === 'ova' ? (
                  <>
                    <span className="fo-tab-dot" aria-hidden />
                    <span className="fo-sr">, {OVA_DUE} att repetera</span>
                  </>
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
    <div className="fo-app" data-collapsed={String(collapsed)}>
      <aside className="fo-side" aria-label="Huvudmeny">
        <div className="fo-side-head">
          {collapsed ? (
            <span className="fo-monogram" role="img" aria-label="HP-Coach">
              HP
            </span>
          ) : (
            <Wordmark />
          )}
          <button
            type="button"
            className="fo-icon-btn fo-tip"
            data-testid="rd-collapse"
            data-tip={collapsed ? 'Fäll ut  ⌘B' : 'Fäll ihop  ⌘B'}
            aria-label={collapsed ? 'Fäll ut menyn' : 'Fäll ihop menyn'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} strokeWidth={1.5} aria-hidden />
            ) : (
              <PanelLeftClose size={18} strokeWidth={1.5} aria-hidden />
            )}
          </button>
        </div>
        <nav className="fo-nav">
          {DESTINATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className={`fo-nav-item${collapsed ? ' fo-tip' : ''}`}
              data-testid={`rd-nav-${d.id}`}
              data-tip={collapsed ? d.label : undefined}
              aria-current={dest === d.id ? 'page' : undefined}
              aria-label={collapsed ? d.label : undefined}
              onClick={() => go(d.id)}
            >
              {collapsed ? (
                <span className="fo-thumb" aria-hidden>
                  {THUMB[d.id]}
                </span>
              ) : null}
              <span className="fo-nav-label">{d.label}</span>
              {d.id === 'ova' ? (
                <>
                  <span className="fo-nav-count">
                    {OVA_DUE}
                    <span className="fo-sr"> att repetera</span>
                  </span>
                  <span className="fo-nav-dot" aria-hidden />
                </>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="fo-side-foot">
          <AccountPopover
            open={menu}
            setOpen={setMenu}
            close={closeMenu}
            theme={theme}
            onTheme={onTheme}
            tip={collapsed}
          />
        </div>
      </aside>
      <main className="fo-main" key={dest}>
        <div className={live ? 'fo-enter' : undefined}>{page}</div>
      </main>
    </div>
  )
}

function Wordmark() {
  return (
    <span className="fo-wordmark" role="img" aria-label="HP-Coach">
      HP<b aria-hidden>·</b>
      <em>Coach</em>
    </span>
  )
}

/** Desktop: the account entry in the sidebar foot and its popover. */
function AccountPopover({
  open,
  setOpen,
  close,
  theme,
  onTheme,
  tip,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  close: () => void
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  tip: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, close, ref)
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* The last entry of the contents, set like the others: a word and
       *  its gloss — no avatar block, no chevrons. */}
      <button
        type="button"
        className="fo-account"
        data-testid="rd-account"
        aria-label={tip ? 'Konto och inställningar' : undefined}
        aria-expanded={open}
        aria-controls="fo-account-menu"
        onClick={() => setOpen(!open)}
      >
        <b>Konto</b>
        {tip ? null : <span>Inställningar och tema</span>}
      </button>
      {open ? (
        <div className="fo-menu" id="fo-account-menu" data-anchor="side">
          <AccountItems theme={theme} onTheme={onTheme} close={close} />
        </div>
      ) : null}
    </div>
  )
}

/** Phone: the account entry opens a bottom sheet over a scrim. */
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
      <div className="fo-scrim" aria-hidden />
      <div className="fo-menu" id="fo-account-sheet" data-anchor="sheet" ref={ref}>
        <AccountItems theme={theme} onTheme={onTheme} close={close} />
      </div>
    </>
  )
}

/** The account slip's content — a disclosure of plain buttons (no menu
 *  role: there is no arrow-key model to promise), set as words between
 *  hairlines like the contents list. Esc or a press outside closes it. */
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
    <div data-testid="rd-account-menu">
      <div className="fo-menu-head">
        <b>Ditt konto</b>
        <span>Inloggad · gratisplan</span>
      </div>
      <MenuItem label="Konto" hint="Namn, e-post, plan" onClick={close} />
      <MenuItem label="Inställningar" hint="Provdatum och mål" onClick={close} />
      <div className="fo-theme">
        <span className="fo-theme-label" id="fo-theme-label">
          Tema
        </span>
        <fieldset className="fo-seg" aria-labelledby="fo-theme-label">
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
      </div>
      <MenuItem label="Hjälp" hint="Kortkommandon, frågor" onClick={close} />
      <hr className="fo-menu-sep" />
      <MenuItem label="Logga ut" onClick={close} />
    </div>
  )
}

function MenuItem({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" className="fo-menu-item" onClick={onClick}>
      <span>{label}</span>
      {hint ? <span className="fo-menu-hint">{hint}</span> : null}
    </button>
  )
}

function FolioStub({ dest }: { dest: Destination }) {
  const d = DESTINATIONS.find((x) => x.id === dest) ?? DESTINATIONS[0]
  return (
    <section className="fo-stub" aria-labelledby="fo-stub-h">
      <span className="fo-label">Kapitel · {d.label}</span>
      <h1 id="fo-stub-h">{d.label}</h1>
      <p>{d.blurb}</p>
      <p className="fo-stub-note">
        Den här sidan sätts i omgång 2, när en riktning är vald. Menyn och kontot fungerar redan
        härifrån.
      </p>
    </section>
  )
}
