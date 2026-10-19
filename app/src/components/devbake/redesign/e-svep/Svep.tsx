// E · Svep — "Ett kort i taget". The direction's root: it injects
// Schibsted Grotesk + Source Serif 4, scopes the token set (svep.css) to
// its own root class and routes the four bake-off screens:
//   1 Idag        — the frame around a deck of cards on a quiet table that
//                   takes the tint of the card in front (SvepHome)
//   2 Läsfråga    — the drill: the text is a tall card, the question the
//                   next card (SvepDrill)
//   3 Facit       — the question card turned over, the explanation a short
//                   run of cards
//   4 Navigering  — the frame's other state: the five doors folded into a
//                   hand of small cards, and the account card dealt open
// Desktop navigation is a slim top bar of the five doors, laid straight on
// the table; phone has a bottom bar. The drill hides both behind Avsluta.

import {
  BookOpen,
  ChevronRight,
  Layers,
  type LucideIcon,
  PanelTopClose,
  PanelTopOpen,
  Sun,
  Timer,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import './svep.css'
import { OVA_DUE } from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  type ThemeKey,
  useDismiss,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import type { Tint } from './parts'
import { SvepDrill } from './SvepDrill'
import { SvepHome } from './SvepHome'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:ital,wght@0,400..900;1,400..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap'

const DOOR_ICON: Record<Destination, LucideIcon> = {
  idag: Sun,
  ova: Layers,
  provpass: Timer,
  uppslag: BookOpen,
  framsteg: TrendingUp,
}

/** The table under a door that is not built yet. */
const DOOR_TINT: Record<Destination, Tint> = {
  idag: 'las',
  ova: 'rep',
  provpass: 'none',
  uppslag: 'ord',
  framsteg: 'none',
}

type ThemeChoice = ThemeKey | 'system'

export function Svep(props: DirectionProps) {
  useWebFonts('svep', FONTS)
  const drill = props.screen === 2 || props.screen === 3
  // The table's tint follows the card in front (Idag) or the door.
  const [tint, setTint] = useState<Tint>('las')
  // A door asked for at the end of a unit ("Nästa kort: Repetition" opens
  // Öva): the frame opens there instead of on Idag.
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
      className="sv-root"
      data-rd="svep"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      data-tint={drill ? 'las' : tint}
      data-testid="rd-svep"
      lang="sv"
    >
      {drill ? (
        <SvepDrill {...props} onGo={goFromDrill} />
      ) : (
        <SvepFrame {...props} wanted={wanted} clearWanted={clearWanted} onTint={setTint} />
      )}
    </div>
  )
}

function SvepFrame({
  screen,
  width,
  theme,
  live,
  onScreen,
  onTheme,
  wanted,
  clearWanted,
  onTint,
}: DirectionProps & {
  wanted: Destination | null
  clearWanted: () => void
  onTint: (t: Tint) => void
}) {
  // Screen 4 shows the frame's other state; screen 1 the default.
  const [folded, setFolded] = useState(screen === 4)
  const [account, setAccount] = useState(screen === 4)
  const [dest, setDest] = useState<Destination>(wanted ?? 'idag')
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seat the frame when the screen changes only
  useEffect(() => {
    setFolded(screen === 4)
    setAccount(screen === 4)
    setDest(wanted ?? 'idag')
    clearWanted()
  }, [screen])

  useEffect(() => {
    if (dest !== 'idag') onTint(DOOR_TINT[dest])
  }, [dest, onTint])

  // ⌘B / Ctrl+B folds the bar, as ⌘B folds the live app's rail.
  useEffect(() => {
    if (!live || width !== 'desktop') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setFolded((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live, width])

  const go = useCallback((d: Destination) => {
    setAccount(false)
    setDest(d)
  }, [])

  const phone = width === 'phone'
  const page =
    dest === 'idag' ? (
      <SvepHome
        width={width}
        live={live && !account}
        onResume={() => onScreen(2)}
        onGo={go}
        onTint={onTint}
      />
    ) : (
      <SvepStub dest={dest} />
    )

  const doors = (
    <nav className="sv-doors" aria-label="Huvudmeny" data-folded={String(!phone && folded)}>
      {DESTINATIONS.map((d) => {
        const Icon = DOOR_ICON[d.id]
        const due = d.id === 'ova' ? `, ${OVA_DUE} att repetera` : ''
        const tip = !phone && folded
        return (
          <button
            type="button"
            key={d.id}
            className="sv-door"
            data-testid={`rd-nav-${d.id}`}
            data-tip={tip ? d.label : undefined}
            aria-current={dest === d.id ? 'page' : undefined}
            aria-label={tip ? `${d.label}${due}` : undefined}
            onClick={() => go(d.id)}
          >
            <span className="sv-door-card" aria-hidden>
              <Icon size={phone ? 20 : 17} strokeWidth={1.75} />
            </span>
            <span className="sv-door-label">
              {d.label}
              {due ? <span className="sv-sr">{due}</span> : null}
            </span>
            {due ? <span className="sv-door-dot" aria-hidden /> : null}
          </button>
        )
      })}
    </nav>
  )

  const accountEntry = (
    <AccountEntry open={account} setOpen={setAccount} theme={theme} onTheme={onTheme} />
  )

  if (phone) {
    return (
      <div className="sv-pframe">
        <div className="sv-pframe-account">{accountEntry}</div>
        <main className="sv-pmain" key={dest}>
          {page}
        </main>
        {doors}
      </div>
    )
  }

  return (
    <div className="sv-frame" data-folded={String(folded)}>
      <header className="sv-bar">
        <Wordmark folded={folded} />
        {doors}
        <div className="sv-bar-end">
          <button
            type="button"
            className="sv-icon-btn"
            data-testid="rd-collapse"
            data-tip={folded ? 'Fäll ut menyn  ⌘B' : 'Fäll ihop menyn  ⌘B'}
            aria-label={folded ? 'Fäll ut menyn' : 'Fäll ihop menyn'}
            aria-expanded={!folded}
            onClick={() => setFolded((f) => !f)}
          >
            {folded ? (
              <PanelTopOpen size={18} strokeWidth={1.75} aria-hidden />
            ) : (
              <PanelTopClose size={18} strokeWidth={1.75} aria-hidden />
            )}
          </button>
          {accountEntry}
        </div>
      </header>
      <main className="sv-main" key={dest}>
        {page}
      </main>
    </div>
  )
}

/** The mark: three cards fanned, the front one in the accent. The name
 *  stays when the doors fold, so the folded bar still says where you are. */
function Wordmark({ folded }: { folded: boolean }) {
  return (
    <span className="sv-wordmark" role="img" aria-label="HP-Coach" data-folded={String(folded)}>
      <span className="sv-mark" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="sv-wordmark-name" aria-hidden>
        HP-Coach
      </span>
    </span>
  )
}

/** The account entry: a round button that deals the account card. Esc or a
 *  press outside puts the card back. */
function AccountEntry({
  open,
  setOpen,
  theme,
  onTheme,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [setOpen])
  useDismiss(open, close, ref)
  return (
    <div className="sv-acct" ref={ref}>
      <button
        type="button"
        className="sv-avatar"
        data-testid="rd-account"
        aria-label="Konto och inställningar"
        aria-expanded={open}
        aria-controls="sv-account-card"
        onClick={() => setOpen(!open)}
      >
        <UserRound size={19} strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <>
          {/* Phone: the deck dims behind the dealt card, and a tap on it puts
           *  the card back (Esc and the card's Stäng do the same). */}
          <button
            type="button"
            className="sv-ascrim"
            tabIndex={-1}
            aria-label="Stäng kontot"
            onClick={close}
          />
          <AccountCard theme={theme} onTheme={onTheme} close={close} />
        </>
      ) : null}
    </div>
  )
}

/** The account card — a disclosure of plain buttons (no menu role: there
 *  is no arrow-key model to promise), set on the deck's own card stock. */
function AccountCard({
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
    <div className="sv-card sv-acard" id="sv-account-card" data-testid="rd-account-menu">
      <div className="sv-acard-head">
        <span className="sv-avatar sv-avatar--still" aria-hidden>
          <UserRound size={20} strokeWidth={1.75} />
        </span>
        <span className="sv-acard-who">
          <b>Ditt konto</b>
          <span>Inloggad · gratisplan</span>
        </span>
        <button type="button" className="sv-icon-btn" aria-label="Stäng" onClick={close}>
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      <AccountRow label="Konto" hint="Namn, e-post, plan" onClick={close} />
      <AccountRow label="Inställningar" hint="Provdatum och mål" onClick={close} />
      <div className="sv-theme">
        <span className="sv-theme-label" id="sv-theme-label">
          Tema
        </span>
        <fieldset className="sv-seg" aria-labelledby="sv-theme-label">
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
      <AccountRow label="Hjälp" hint="Kortkommandon, frågor" onClick={close} />
      <div className="sv-acard-foot">
        <button type="button" className="sv-btn sv-btn--quiet sv-btn--block" onClick={close}>
          Logga ut
        </button>
      </div>
    </div>
  )
}

function AccountRow({
  label,
  hint,
  onClick,
}: {
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button type="button" className="sv-arow" onClick={onClick}>
      <span className="sv-arow-text">
        <b>{label}</b>
        <span>{hint}</span>
      </span>
      <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
    </button>
  )
}

/** A door that round 2 builds: one card on its own table. */
function SvepStub({ dest }: { dest: Destination }) {
  const d = DESTINATIONS.find((x) => x.id === dest) ?? DESTINATIONS[0]
  const Icon = DOOR_ICON[d.id]
  return (
    <div className="sv-stub-wrap">
      <section className="sv-card sv-stub" aria-labelledby="sv-stub-h">
        <span className="sv-stub-icon" aria-hidden>
          <Icon size={24} strokeWidth={1.75} />
        </span>
        <h1 id="sv-stub-h" className="sv-stub-title">
          {d.label}
        </h1>
        <p className="sv-stub-blurb">{d.blurb}</p>
        <p className="sv-stub-note">
          Den här leken läggs i omgång 2, när en riktning är vald. Menyn och kontot fungerar redan
          härifrån.
        </p>
      </section>
    </div>
  )
}
