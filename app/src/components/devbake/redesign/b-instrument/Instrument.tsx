// B · Instrument — precision pro tool. The direction's root: it injects
// Geist, Geist Mono and Atkinson Hyperlegible Next, scopes its token set
// (instrument.css) to its own data attribute and routes the four screens:
//   1 Idag        — the chassis: a grey frame (sidebar, readout strip, status
//                   bar) holding the page in one inset panel; a sparse Home
//   2 Läsfråga    — the drill: a dimmed rail, breadcrumb, passage and
//                   question as two panels with a resizable gap
//                   (InstrumentDrill)
//   3 Facit       — the answer panel with the explanation in place
//   4 Navigering  — the frame's other state: sidebar folded to an icon rail
//                   with the account menu open (phone: avatar menu open)
// Keyboard-native throughout: G then I/Ö/P/U/F jumps between the five
// destinations, Ctrl/⌘ K opens a small command menu (an accelerator —
// every command is also a visible control), Ctrl/⌘ B folds the sidebar,
// ⇧ Ctrl/⌘ L switches light/dark, ? lists the commands and their keys.

import {
  Check,
  ChevronsUpDown,
  CircleQuestionMark,
  CornerDownLeft,
  LogOut,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import './instrument.css'
import { EXAM, OVA_DUE, RESUME, TODAY, WEEK } from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  type ThemeKey,
  useDismiss,
  useKeyMap,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { InstrumentDrill } from './InstrumentDrill'
import { InstrumentHome } from './InstrumentHome'
import { DEST_ICONS, G_KEYS, Kc, Mark, MOD, Readout } from './parts'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,200..800;1,200..800&family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap'

/** Light, dark, or whatever the system says (resolved to light/dark). */
type Theming = {
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  followSystem: boolean
  setFollowSystem: (on: boolean) => void
}

function systemTheme(): ThemeKey | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function Instrument(props: DirectionProps) {
  useWebFonts('instrument', FONTS)
  // The destination lives at the root so the drill's rail and its end-of-
  // unit screen can send the reader straight to one.
  const [dest, setDest] = useState<Destination>('idag')
  const [followSystem, setFollowSystem] = useState(false)
  const { onTheme, theme } = props

  // "Följ systemet": resolve now and on every system change.
  useEffect(() => {
    if (!followSystem) return
    const now = systemTheme()
    if (now && now !== theme) onTheme(now)
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => onTheme(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [followSystem, onTheme, theme])

  const theming: Theming = {
    theme,
    onTheme: (t) => {
      setFollowSystem(false)
      onTheme(t)
    },
    followSystem,
    setFollowSystem,
  }
  const drill = props.screen === 2 || props.screen === 3
  return (
    <div
      data-rd="instrument"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      data-testid="rd-instrument"
      lang="sv"
    >
      {drill ? (
        <InstrumentDrill
          {...props}
          onGo={(d) => {
            setDest(d)
            props.onScreen(1)
          }}
        />
      ) : (
        <InstrumentFrame {...props} theming={theming} dest={dest} setDest={setDest} />
      )}
    </div>
  )
}

function InstrumentFrame({
  screen,
  width,
  live,
  onScreen,
  theming,
  dest,
  setDest,
}: DirectionProps & {
  theming: Theming
  dest: Destination
  setDest: (d: Destination) => void
}) {
  // Screen 4 shows the frame's other state, screen 1 the default. A switch
  // made in the bake-off's own switcher also returns to Idag.
  const [collapsed, setCollapsed] = useState(screen === 4)
  const [menu, setMenu] = useState(screen === 4)
  const [palette, setPalette] = useState(false)
  const mounted = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when the switcher changes screen
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    setCollapsed(screen === 4)
    setMenu(screen === 4)
    setDest('idag')
  }, [screen])

  const go = useCallback(
    (d: Destination) => {
      setMenu(false)
      setDest(d)
    },
    [setDest],
  )
  const closeMenu = useCallback(() => setMenu(false), [])
  const openPalette = useCallback(() => {
    setMenu(false)
    setPalette(true)
  }, [])
  const { theme } = theming
  const flipTheme = () => theming.onTheme(theme === 'dark' ? 'light' : 'dark')
  const flipRef = useRef(flipTheme)
  flipRef.current = flipTheme

  // Ctrl/⌘ K opens the command menu, Ctrl/⌘ B folds the sidebar, ⇧ Ctrl/⌘ L
  // switches the theme. Captured first so the app's own palette does not
  // open underneath the bake-off.
  useEffect(() => {
    if (!live) return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const k = e.key.toLowerCase()
      if (k === 'k') {
        e.preventDefault()
        e.stopPropagation()
        setPalette((p) => !p)
      } else if (k === 'b' && width === 'desktop') {
        e.preventDefault()
        e.stopPropagation()
        setCollapsed((c) => !c)
      } else if (k === 'l' && e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        flipRef.current()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live, width])

  // G then I/Ö/P/U/F — the Linear-style jump between destinations; ? lists
  // every command with its keys.
  const gArmed = useRef(0)
  const keys: Record<string, () => void> = {
    g: () => {
      gArmed.current = Date.now()
    },
    '?': openPalette,
    'Shift+?': openPalette,
  }
  for (const d of DESTINATIONS) {
    keys[G_KEYS[d.id]] = () => {
      if (Date.now() - gArmed.current < 1200) go(d.id)
      gArmed.current = 0
    }
  }
  // Keyboards without Ö reach Öva with G then O.
  keys.o = keys[G_KEYS.ova]
  useKeyMap(keys, live && !palette)

  const commands: Command[] = [
    {
      id: 'resume',
      label: `Fortsätt: ${RESUME.section} · ${RESUME.title}`,
      hint: '↵',
      icon: <CornerDownLeft size={15} strokeWidth={1.5} aria-hidden />,
      run: () => onScreen(2),
    },
    ...DESTINATIONS.map((d) => ({
      id: `go-${d.id}`,
      label: `Gå till ${d.label}`,
      hint: `G ${G_KEYS[d.id].toUpperCase()}`,
      icon: DEST_ICONS[d.id](15),
      run: () => go(d.id),
    })),
    {
      id: 'theme',
      label: theme === 'dark' ? 'Byt till ljust läge' : 'Byt till mörkt läge',
      hint: `⇧ ${MOD} L`,
      icon:
        theme === 'dark' ? (
          <Sun size={15} strokeWidth={1.5} aria-hidden />
        ) : (
          <Moon size={15} strokeWidth={1.5} aria-hidden />
        ),
      run: flipTheme,
    },
  ]

  const page =
    dest === 'idag' ? (
      <InstrumentHome
        width={width}
        live={live && !palette}
        onResume={() => onScreen(2)}
        onGo={go}
      />
    ) : (
      <InstrumentStub dest={dest} />
    )

  const account = (anchor: 'side' | 'top', compact: boolean, tip: boolean) => (
    <AccountTrigger
      open={menu}
      setOpen={setMenu}
      close={closeMenu}
      onPalette={openPalette}
      theming={theming}
      anchor={anchor}
      compact={compact}
      tip={tip}
    />
  )

  if (width === 'phone') {
    const d = DESTINATIONS.find((x) => x.id === dest) ?? DESTINATIONS[0]
    return (
      <div className="in-phone">
        <header className="in-ptop">
          <Mark />
          {/* On Idag the page has its own greeting: the bar carries the
           *  countdown instead of a second "Idag". */}
          {d.id === 'idag' ? (
            <Readout
              label="Provet om"
              value={`${EXAM.daysLeft}`}
              unit={`dagar · ${EXAM.shortDate}`}
            />
          ) : (
            <span className="in-ptop-title">{d.label}</span>
          )}
          {account('top', true, false)}
        </header>
        <div className="in-pscroll" key={dest}>
          <div className={live ? 'in-enter' : undefined}>{page}</div>
        </div>
        <nav className="in-tabs" aria-label="Huvudmeny">
          {DESTINATIONS.map((x) => (
            <button
              type="button"
              key={x.id}
              className="in-tab"
              data-testid={`rd-nav-${x.id}`}
              aria-current={dest === x.id ? 'page' : undefined}
              onClick={() => go(x.id)}
            >
              {DEST_ICONS[x.id](20)}
              <span>{x.label}</span>
              {x.id === 'ova' ? (
                <span className="in-count">
                  {OVA_DUE}
                  <span className="in-sr"> att repetera</span>
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>
    )
  }

  const current = DESTINATIONS.find((x) => x.id === dest) ?? DESTINATIONS[0]
  return (
    <div className="in-app" data-collapsed={String(collapsed)}>
      <aside className="in-side" aria-label="Huvudmeny">
        <div className="in-ws">
          <Mark />
          <span className="in-ws-name">HP-Coach</span>
          <button
            type="button"
            className="in-icon-btn in-tip"
            data-tip={collapsed ? `Fäll ut  ${MOD} B` : `Fäll ihop  ${MOD} B`}
            data-testid="rd-collapse"
            aria-label={collapsed ? 'Fäll ut menyn' : 'Fäll ihop menyn'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} strokeWidth={1.5} aria-hidden />
            ) : (
              <PanelLeftClose size={16} strokeWidth={1.5} aria-hidden />
            )}
          </button>
        </div>
        <nav className="in-nav">
          {DESTINATIONS.map((x) => (
            <button
              type="button"
              key={x.id}
              className={`in-nav-item${collapsed ? ' in-tip' : ''}`}
              data-tip={collapsed ? `${x.label}  G ${G_KEYS[x.id].toUpperCase()}` : undefined}
              data-testid={`rd-nav-${x.id}`}
              aria-current={dest === x.id ? 'page' : undefined}
              aria-label={collapsed ? x.label : undefined}
              onClick={() => go(x.id)}
            >
              {DEST_ICONS[x.id](16)}
              <span className="in-nav-name">{x.label}</span>
              <span className="in-nav-hint">
                <Kc>G</Kc>
                <Kc>{G_KEYS[x.id].toUpperCase()}</Kc>
              </span>
              {x.id === 'ova' ? (
                <>
                  <span className="in-count">
                    {OVA_DUE}
                    <span className="in-sr"> att repetera</span>
                  </span>
                  <span className="in-dot" aria-hidden />
                </>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="in-side-foot">{account('side', false, collapsed)}</div>
      </aside>
      <div className="in-main">
        <header className="in-bar in-strip">
          <button
            type="button"
            className="in-search"
            aria-haspopup="dialog"
            onClick={() => setPalette(true)}
          >
            <Search size={15} strokeWidth={1.5} aria-hidden />
            <span>Sök eller hoppa…</span>
            <span className="in-kc-row">
              <Kc>{MOD}</Kc>
              <Kc>K</Kc>
            </span>
          </button>
          <span className="in-spacer" />
          <div className="in-ros">
            <Readout
              label="Provet om"
              value={`${EXAM.daysLeft}`}
              unit={`dagar · ${EXAM.dateLabel}`}
              title={`${EXAM.name}, ${EXAM.dateLabel}`}
            />
            <Readout label="Veckan" value={`${WEEK.daysPractised}/${WEEK.goal}`} unit="dagar" />
            <Readout label="Idag" value={`${WEEK.minutesToday}`} unit="min" />
          </div>
        </header>
        <main className="in-panel">
          <div className="in-panel-head">
            <div className="in-crumbs">
              {DEST_ICONS[current.id](15)}
              <b>{current.label}</b>
              {current.id === 'idag' ? (
                <>
                  <i aria-hidden>/</i>
                  <span>{TODAY.dateLabel.toLowerCase()}</span>
                </>
              ) : null}
            </div>
            <span className="in-spacer" />
            {current.id === 'idag' ? (
              <span className="in-hint in-legend">
                <Kc>↑</Kc>
                <Kc>↓</Kc> välj <Kc>↵</Kc> öppna
              </span>
            ) : null}
          </div>
          <div className="in-scroll" key={dest}>
            <div className={live ? 'in-enter' : undefined}>{page}</div>
          </div>
        </main>
        <footer className="in-statusbar">
          <span className="in-hint">
            <Kc>G</Kc> + bokstav gå till
          </span>
          <span className="in-hint">
            <Kc>{MOD}</Kc>
            <Kc>K</Kc> kommandon
          </span>
          <span className="in-hint">
            <Kc>{MOD}</Kc>
            <Kc>B</Kc> meny
          </span>
          <span className="in-hint">
            <Kc>?</Kc> alla tangenter
          </span>
          <span className="in-spacer" />
          <span>
            <Check size={14} strokeWidth={1.75} aria-hidden /> Allt sparat
          </span>
        </footer>
      </div>
      {palette ? (
        <Palette commands={commands} onClose={() => setPalette(false)} live={live} />
      ) : null}
    </div>
  )
}

// ── Account menu ─────────────────────────────────────────────────────

function AccountTrigger({
  open,
  setOpen,
  close,
  onPalette,
  theming,
  anchor,
  compact,
  tip,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  close: () => void
  onPalette: () => void
  theming: Theming
  anchor: 'side' | 'top'
  compact: boolean
  tip: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, close, ref)
  const { theme, onTheme, followSystem, setFollowSystem } = theming
  const avatar = (
    <span className="in-avatar" aria-hidden>
      <UserRound size={14} strokeWidth={1.75} />
    </span>
  )
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {compact ? (
        <button
          type="button"
          className="in-avatar-btn"
          data-testid="rd-account"
          aria-label="Konto och inställningar"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen(!open)}
        >
          {avatar}
        </button>
      ) : (
        <button
          type="button"
          className={`in-acc${tip ? ' in-tip' : ''}`}
          data-tip={tip ? 'Konto och inställningar' : undefined}
          data-testid="rd-account"
          aria-label={tip ? 'Konto och inställningar' : undefined}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen(!open)}
        >
          {avatar}
          <span className="in-acc-text">
            <b>Konto</b>
            <span>Inställningar · tema</span>
          </span>
          <ChevronsUpDown size={14} strokeWidth={1.5} aria-hidden className="in-acc-chev" />
        </button>
      )}
      {open ? (
        <div
          className="in-menu"
          data-anchor={anchor}
          data-testid="rd-account-menu"
          role="menu"
          aria-label="Konto"
        >
          <div className="in-menu-head">
            {avatar}
            <div>
              <b>Ditt konto</b>
              <span>Gratisplan</span>
            </div>
          </div>
          <p className="in-menu-label" aria-hidden>
            Konto
          </p>
          <MenuItem
            icon={<UserRound size={15} strokeWidth={1.5} />}
            label="Konto"
            onClick={close}
          />
          <MenuItem
            icon={<Settings size={15} strokeWidth={1.5} />}
            label="Inställningar"
            onClick={close}
          />
          <p className="in-menu-label" aria-hidden>
            Utseende
          </p>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={theme === 'dark'}
            className="in-menu-item"
            data-testid="rd-theme-toggle"
            onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Moon size={15} strokeWidth={1.5} aria-hidden />
            <span>
              Mörkt läge
              {followSystem ? <small>Följer systemet just nu</small> : null}
            </span>
            <span className="in-kc-row">
              <Kc>⇧</Kc>
              <Kc>{MOD}</Kc>
              <Kc>L</Kc>
            </span>
            <i className="in-switch" aria-hidden />
          </button>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={followSystem}
            className="in-menu-item"
            onClick={() => setFollowSystem(!followSystem)}
          >
            <Monitor size={15} strokeWidth={1.5} aria-hidden />
            <span>Följ systemet</span>
            <i className="in-switch" aria-hidden />
          </button>
          <hr className="in-menu-sep" />
          <MenuItem
            icon={<CircleQuestionMark size={15} strokeWidth={1.5} />}
            label="Kortkommandon"
            keys={['?']}
            onClick={onPalette}
          />
          <MenuItem
            icon={<LogOut size={15} strokeWidth={1.5} />}
            label="Logga ut"
            onClick={close}
          />
        </div>
      ) : null}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  keys,
  onClick,
}: {
  icon: ReactNode
  label: string
  keys?: string[]
  onClick: () => void
}) {
  return (
    <button type="button" role="menuitem" className="in-menu-item" onClick={onClick}>
      <span aria-hidden style={{ display: 'inline-flex', flex: 'none' }}>
        {icon}
      </span>
      <span>{label}</span>
      {keys ? (
        <span className="in-kc-row">
          {keys.map((k) => (
            <Kc key={k}>{k}</Kc>
          ))}
        </span>
      ) : null}
    </button>
  )
}

// ── Command menu (Ctrl/⌘ K) ──────────────────────────────────────────

type Command = {
  id: string
  label: string
  hint?: string
  icon: ReactNode
  run: () => void
}

/** A small command menu: type to filter, ↑/↓ moves the highlight while the
 *  caret stays in the field (aria-activedescendant), ↵ runs, Esc closes.
 *  It only accelerates — each command is also a visible control. */
function Palette({
  commands,
  onClose,
  live,
}: {
  commands: Command[]
  onClose: () => void
  live: boolean
}) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  useDismiss(true, onClose, ref)
  useEffect(() => {
    if (live) inputRef.current?.focus()
  }, [live])
  const needle = q.trim().toLocaleLowerCase('sv-SE')
  const list = commands.filter((c) => c.label.toLocaleLowerCase('sv-SE').includes(needle))
  const at = Math.min(active, Math.max(0, list.length - 1))
  const run = (c: Command) => {
    onClose()
    c.run()
  }
  const onKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((list.length + at + step) % Math.max(1, list.length))
    } else if (e.key === 'Enter' && list[at]) {
      e.preventDefault()
      run(list[at])
    }
  }
  const optionId = (c: Command) => `${listId}-${c.id}`
  return (
    <div className="in-pal-scrim">
      <div
        className="in-pal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Kommandon"
        data-testid="in-palette"
      >
        <div className="in-pal-input">
          <Search size={16} strokeWidth={1.5} aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKey}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={list[at] ? optionId(list[at]) : undefined}
            aria-autocomplete="list"
            placeholder="Skriv ett kommando eller ett mål…"
            aria-label="Sök kommando"
          />
          <Kc>Esc</Kc>
        </div>
        <div className="in-pal-list" id={listId} role="listbox" aria-label="Kommandon">
          {list.map((c, i) => (
            // The highlight follows the pointer; the caret stays in the field.
            // biome-ignore lint/a11y/useKeyWithClickEvents: keys are handled on the combobox (aria-activedescendant)
            <div
              key={c.id}
              id={optionId(c)}
              role="option"
              tabIndex={-1}
              aria-selected={i === at}
              className="in-pal-item"
              onMouseMove={() => setActive(i)}
              onClick={() => run(c)}
            >
              <span aria-hidden className="in-pal-icon">
                {c.icon}
              </span>
              <span>{c.label}</span>
              {c.hint ? (
                <span className="in-kc-row">
                  {c.hint.split(' ').map((k) => (
                    <Kc key={k}>{k}</Kc>
                  ))}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        {list.length === 0 ? (
          <p className="in-pal-empty" role="status">
            Inget kommando matchar ”{q}”.
          </p>
        ) : null}
      </div>
    </div>
  )
}

// ── Destinations built in round 2 ────────────────────────────────────

function InstrumentStub({ dest }: { dest: Destination }) {
  const d = DESTINATIONS.find((x) => x.id === dest) ?? DESTINATIONS[0]
  return (
    <section className="in-stub" aria-labelledby="in-stub-h">
      <span className="in-code">Omgång 2</span>
      <h1 id="in-stub-h">{d.label}</h1>
      <p>{d.blurb}</p>
      <p>
        Den här vyn byggs när en riktning är vald. Menyn, tangenterna (G och en bokstav) och kontot
        fungerar redan härifrån.
      </p>
      <div className="in-stub-grid" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </section>
  )
}
