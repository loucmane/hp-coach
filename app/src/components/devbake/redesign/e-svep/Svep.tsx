// E · Svep — "Ett kort i taget". The direction's root: it injects
// Schibsted Grotesk + Source Serif 4, scopes the token set (svep.css) to
// its own root class and routes the screens it has built:
//   1 Idag        — the frame around a deck of cards on a quiet table that
//                   takes the tint of the card in front (SvepHome)
//   2 Läsfråga    — the drill: the text is a tall card, the question the
//                   next card (SvepDrill)
//   3 Facit       — the question card turned over, the explanation a short
//                   run of cards
//   4 Navigering  — the frame's other state: the five doors folded into a
//                   hand of small cards, and the account card dealt open
//   5 Öva         — three task cards (a suggestion, mixed practice,
//                   Repetera) beside every section as a small door card
//                   (SvepOva)
//   6 Kvantfråga  — one substantial problem card that turns into the facit
//                   run (SvepQuant)
//   7 DTK         — the figure page as the tall reference card beside the
//                   question card (SvepQuant)
//   8 Repetera    — today's misses as a finite hand and its register
//                   (SvepRepetera)
//   9 Provpass    — the passes of a half as a dealt deck beside the two
//                   halves; a confirmation card before the clock, then the
//                   running pass in focus mode with its register
//                   (SvepProvpass)
//  10 Provpassresultat — the handed-in pass turned over: one evidence card
//                   at a time (SvepProvpass)
//  11 Framsteg    — progress as a small indexed deck, Historik its last
//                   card (SvepFramsteg)
//  12 Uppslag     — every section as a small door, the open lesson as one
//                   tall reference card with the next entries' edges behind
//                   it, the section's contents as its register (SvepUppslag)
//  13 Konto       — the account card dealt open: a small deck of Konto,
//                   Inställningar and Hjälp, its register, and the account's
//                   details farther down the table, deletion last
//                   (SvepKonto)
//  14 ELF-läsfråga — the reading pair on the ELF table, the English text
//                   and question marked as English (SvepDrill's SvepElf)
// Desktop navigation is a slim top bar of the five doors, laid straight on
// the table; phone has a bottom bar. The drills and a running pass hide
// both behind Avsluta.
//
// Kit v2: every screen reads the view model and asks for what it does
// through useDirectionData(); round 1's switcher moves (Fortsätt, the
// drill's lock, Nästa and Avsluta) stay on onScreen. A door also opens its
// page in the frame at once, so the frame keeps working where nothing
// follows the request (a stage mounted without a provider). A started pass
// runs here, on screen 9, until it is handed in (the host then shows the
// result) or voided (back to the hub, which says so). A hand-in that fails,
// or that the host does not follow with the result, ends the run too: the
// frame comes back and Provpass shows what was handed in, read-only.
//
// The account card's rows each open Konto at their own card (Konto,
// Inställningar, Hjälp) and remember where they were asked from, so Konto's
// way back names that page. A lesson asked for by name (a plan's lesson)
// travels to Uppslag with its id, so Uppslag can say when the text on
// screen is still the one open before.

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
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import './svep.css'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type AppScreenKey,
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  type ThemeKey,
  useDismiss,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import type {
  Half,
  IdentityView,
  PlanItemKind,
  PlanItemView,
} from '@/components/devbake/redesign/viewModel'
import { sectionTint, type Tint } from './parts'
import { SvepDrill, SvepElf } from './SvepDrill'
import { type FramstegCardId, SvepFramsteg } from './SvepFramsteg'
import { SvepHome } from './SvepHome'
import { type KontoCardId, SvepKonto } from './SvepKonto'
import { SvepOva } from './SvepOva'
import { type Handed, SvepPassHanded, SvepPassRun, SvepProvpass, SvepResult } from './SvepProvpass'
import { SvepQuant } from './SvepQuant'
import { SvepRepetera } from './SvepRepetera'
import { SvepUppslag } from './SvepUppslag'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:ital,wght@0,400..900;1,400..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap'

const DOOR_ICON: Record<Destination, LucideIcon> = {
  idag: Sun,
  ova: Layers,
  provpass: Timer,
  uppslag: BookOpen,
  framsteg: TrendingUp,
}

/** What the frame shows: a destination, Repetera inside Öva, a pass's
 *  result inside Provpass, or the account's own page. */
type Page = Destination | 'repetera' | 'resultat' | 'konto'

/** The frame's page on each screen it is shown on. */
const SCREEN_PAGE: Partial<Record<AppScreenKey, Page>> = {
  1: 'idag',
  4: 'idag',
  5: 'ova',
  8: 'repetera',
  9: 'provpass',
  10: 'resultat',
  11: 'framsteg',
  12: 'uppslag',
  13: 'konto',
}

/** Where a plan item leads in the frame while its request travels. */
const PLAN_PAGE: Record<PlanItemKind, Page> = {
  repetition: 'repetera',
  lesson: 'uppslag',
  mock: 'provpass',
  drill: 'ova',
}

/** The table under a page without a deck that tints it (Idag, Öva and
 *  Uppslag tint it after the card or the lesson in front). */
const PAGE_TINT: Record<Exclude<Page, 'idag' | 'ova' | 'uppslag'>, Tint> = {
  repetera: 'rep',
  provpass: 'none',
  resultat: 'none',
  framsteg: 'none',
  konto: 'none',
}

/** The table a screen opens on, before its page says otherwise. */
const SCREEN_TINT: Partial<Record<AppScreenKey, Tint>> = {
  5: 'none',
  8: 'rep',
  9: 'none',
  10: 'none',
  11: 'none',
  13: 'none',
}

/** A page's name in a way back to it ("Tillbaka till Öva"). */
const PAGE_NAME: Record<Exclude<Page, 'konto'>, string> = {
  idag: 'Idag',
  ova: 'Öva',
  repetera: 'Repetera',
  provpass: 'Provpass',
  resultat: 'resultatet',
  uppslag: 'Uppslag',
  framsteg: 'Framsteg',
}

type ThemeChoice = ThemeKey | 'system'

/** The frame's navigation, as its pages ask for it. */
export type FrameNav = {
  go: (d: Destination) => void
  openPlanItem: (item: PlanItemView) => void
  /** A handed-in pass's result. */
  openResult: (id: string) => void
  /** Framsteg, opened at one of its cards (Idag's estimate and passes). */
  framsteg: (card: FramstegCardId) => void
}

/** Konto's way back: the page it was opened from, by name. */
export type KontoReturn = { label: string; go: () => void }

/** A request for Konto from the account card: the card to open at, and a
 *  count, so asking twice for the same card still moves the focus. */
export type KontoAsk = { card: KontoCardId; n: number }

/** A lesson asked for by id (a plan's lesson), with a count, so asking
 *  again for the same one still says so. */
export type LessonAsk = { id: string; n: number }

/** The Provpass screen's state: the pass running on it, the half of the
 *  pass just voided (the hub says so), or a hand-in that did not reach its
 *  result (Provpass shows what was handed in). */
type ProvState = { run: boolean; voided: Half | null; handed: Handed | null }

const PROV_IDLE: ProvState = { run: false, voided: null, handed: null }

export function Svep(props: DirectionProps) {
  useWebFonts('svep', FONTS)
  const { data } = useDirectionData()
  const { screen } = props
  // The table's tint follows the card in front (Idag, Öva), the open
  // lesson (Uppslag) or the page.
  const [tint, setTint] = useState<Tint>(
    () =>
      SCREEN_TINT[screen] ??
      (screen === 12 ? sectionTint(data.uppslag.open.section) : undefined) ??
      'las',
  )
  // A pass runs on screen 9 until it is handed in or voided; the switcher
  // moving on ends it.
  const [prov, setProv] = useState<ProvState>(PROV_IDLE)
  const [provSeat, setProvSeat] = useState(screen)
  if (provSeat !== screen) {
    setProvSeat(screen)
    setProv(PROV_IDLE)
  }
  // Away from what a hand-in left: the way back to the hub, or any door.
  const leaveHanded = useCallback(() => setProv((p) => (p.handed ? { ...p, handed: null } : p)), [])
  const provHub = useMemo(
    () => ({
      voided: prov.voided,
      handed: prov.handed,
      dismiss: () => setProv((p) => ({ ...p, voided: null })),
      start: () => setProv({ run: true, voided: null, handed: null }),
      leave: leaveHanded,
    }),
    [prov.voided, prov.handed, leaveHanded],
  )
  let stage: ReactNode
  let table: Tint = tint
  if (screen === 9 && prov.run) {
    // A new sitting starts the run afresh.
    stage = (
      <SvepPassRun
        key={data.provpass.running.passId}
        width={props.width}
        live={props.live}
        onAbandon={() => setProv({ run: false, voided: data.provpass.running.half, handed: null })}
        onHanded={(handed) => setProv({ run: false, voided: null, handed })}
      />
    )
    table = 'none'
  } else if (screen === 2 || screen === 3) {
    // A new sitting starts the drill afresh (Läsfråga and Facit share one).
    const reading = data.drills.reading
    stage = (
      <SvepDrill
        key={`${reading.id}:${reading.questions.map((q) => q.qid).join(',')}`}
        {...props}
      />
    )
    table = sectionTint(reading.questions[0]?.section)
  } else if (screen === 14) {
    // A new sitting (its id or its questions) starts the drill afresh.
    const elf = data.drills.elf
    stage = (
      <SvepElf
        key={`${elf.id}:${elf.questions.map((q) => q.qid).join(',')}`}
        width={props.width}
        live={props.live}
      />
    )
    table = sectionTint(elf.questions[0]?.section ?? 'ELF')
  } else if (screen === 6 || screen === 7) {
    // One sitting per screen: the key keeps the two drills' states apart.
    stage = (
      <SvepQuant
        key={screen}
        kind={screen === 6 ? 'quant' : 'dtk'}
        width={props.width}
        live={props.live}
      />
    )
    table = 'none'
  } else {
    stage = <SvepFrame {...props} onTint={setTint} prov={provHub} />
  }
  return (
    <div
      className="sv-root"
      data-rd="svep"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      data-tint={table}
      data-testid="rd-svep"
      lang="sv"
    >
      {stage}
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
  onTint,
  prov,
}: DirectionProps & {
  onTint: (t: Tint) => void
  /** The Provpass hub's link to the stage: a voided pass, a start, and a
   *  hand-in that did not reach its result, with the way away from it. */
  prov: {
    voided: Half | null
    handed: Handed | null
    dismiss: () => void
    start: () => void
    leave: () => void
  }
}) {
  const { data, actions } = useDirectionData()
  // Screen 4 shows the frame's other state; the others the default.
  const [folded, setFolded] = useState(screen === 4)
  const [account, setAccount] = useState(screen === 4)
  const [page, setPage] = useState<Page>(SCREEN_PAGE[screen] ?? 'idag')
  // The card Framsteg opens at, when a link asked for one.
  const [framstegCard, setFramstegCard] = useState<FramstegCardId | undefined>(undefined)
  // Konto asked for from the account card: the card to open at and the page
  // it was asked from. Konto reached any other way (the switcher, a link)
  // has neither: it opens at its first card and offers the way to Idag.
  const [konto, setKonto] = useState<{ ask: KontoAsk; from: Page | null } | null>(null)
  // A lesson asked for by id, so Uppslag can say when the text it shows is
  // still the one open before.
  const [lesson, setLesson] = useState<LessonAsk | null>(null)
  // Re-seat the frame when the switcher moves, before it paints, so the old
  // page never shows for a frame.
  const [seated, setSeated] = useState(screen)
  if (seated !== screen) {
    setSeated(screen)
    setFolded(screen === 4)
    setAccount(screen === 4)
    setPage(SCREEN_PAGE[screen] ?? 'idag')
    // A request's own screen keeps it (the host following it there); any
    // other screen lets it go.
    if (screen !== 13) setKonto(null)
    if (screen !== 12) setLesson(null)
  }

  // The pages with a deck of their own tint report it; the rest are fixed.
  useLayoutEffect(() => {
    if (page !== 'idag' && page !== 'ova' && page !== 'uppslag') onTint(PAGE_TINT[page])
  }, [page, onTint])

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

  const leaveHanded = prov.leave
  const nav = useMemo<FrameNav>(
    () => ({
      go: (d) => {
        // A door, or Till Provpass, leaves what a hand-in left behind.
        leaveHanded()
        setAccount(false)
        setFramstegCard(undefined)
        setPage(d)
        actions.go(d)
      },
      openPlanItem: (item) => {
        setPage(PLAN_PAGE[item.kind])
        // A lesson names its entry: Uppslag hears which one was asked for.
        const asked = item.kind === 'lesson' ? item.framework : undefined
        if (asked) setLesson((l) => ({ id: asked, n: (l?.n ?? 0) + 1 }))
        actions.openPlanItem(item.id)
      },
      openResult: (id) => {
        setPage('resultat')
        actions.openProvResult(id)
      },
      framsteg: (card) => {
        setAccount(false)
        setFramstegCard(card)
        setPage('framsteg')
        actions.go('framsteg')
      },
    }),
    [actions, leaveHanded],
  )

  // The account card's rows: Konto at the asked-for card, remembering the
  // page it was asked from (asked again from Konto itself, the first page
  // stays the way back).
  const openKonto = (card: KontoCardId) => {
    setAccount(false)
    setKonto((k) => ({
      ask: { card, n: (k?.ask.n ?? 0) + 1 },
      from: page === 'konto' ? (k?.from ?? null) : page,
    }))
    setPage('konto')
    actions.openKonto()
  }
  const from = konto?.from ?? null
  let kontoBack: KontoReturn
  if (from === null || from === 'konto') {
    kontoBack = { label: 'Till Idag', go: () => nav.go('idag') }
  } else if (from === 'repetera') {
    kontoBack = {
      label: `Tillbaka till ${PAGE_NAME.repetera}`,
      go: () => {
        setPage('repetera')
        actions.openRepetera()
      },
    }
  } else if (from === 'resultat') {
    kontoBack = {
      label: `Tillbaka till ${PAGE_NAME.resultat}`,
      go: () => nav.openResult(data.provpass.result.id),
    }
  } else {
    kontoBack = { label: `Tillbaka till ${PAGE_NAME[from]}`, go: () => nav.go(from) }
  }

  const phone = width === 'phone'
  // Repetera lives inside Öva and a result inside Provpass: their door
  // stays the current one. Konto is none of the five.
  const current: Destination | null =
    page === 'repetera' ? 'ova' : page === 'resultat' ? 'provpass' : page === 'konto' ? null : page
  const pageLive = live && !account
  let body: ReactNode
  if (page === 'idag') {
    body = (
      <SvepHome
        width={width}
        live={pageLive}
        onResume={() => onScreen(2)}
        nav={nav}
        onTint={onTint}
      />
    )
  } else if (page === 'ova') {
    body = <SvepOva width={width} live={pageLive} onTint={onTint} />
  } else if (page === 'repetera') {
    body = <SvepRepetera width={width} live={pageLive} nav={nav} />
  } else if (page === 'provpass') {
    body = prov.handed ? (
      <SvepPassHanded width={width} live={pageLive} handed={prov.handed} nav={nav} />
    ) : (
      <SvepProvpass
        width={width}
        live={pageLive}
        nav={nav}
        voided={prov.voided}
        onDismissVoid={prov.dismiss}
        onStart={prov.start}
      />
    )
  } else if (page === 'resultat') {
    body = <SvepResult width={width} live={pageLive} nav={nav} />
  } else if (page === 'framsteg') {
    body = <SvepFramsteg width={width} live={pageLive} nav={nav} card={framstegCard} />
  } else if (page === 'uppslag') {
    body = <SvepUppslag width={width} onTint={onTint} ask={lesson} />
  } else {
    body = <SvepKonto width={width} live={pageLive} ask={konto?.ask ?? null} back={kontoBack} />
  }

  const doors = (
    <nav className="sv-doors" aria-label="Huvudmeny" data-folded={String(!phone && folded)}>
      {DESTINATIONS.map((d) => {
        const Icon = DOOR_ICON[d.id]
        const due = d.id === 'ova' ? `, ${data.home.ovaDue} att repetera` : ''
        const tip = !phone && folded
        return (
          <button
            type="button"
            key={d.id}
            className="sv-door"
            data-testid={`rd-nav-${d.id}`}
            data-tip={tip ? d.label : undefined}
            aria-current={current === d.id ? 'page' : undefined}
            aria-label={tip ? `${d.label}${due}` : undefined}
            onClick={() => nav.go(d.id)}
          >
            <span className="sv-door-card" aria-hidden>
              <Icon size={phone ? 20 : 17} strokeWidth={1.75} />
            </span>
            <span className="sv-door-label">
              {d.label}
              {due ? <span className="sv-sr">{due}</span> : null}
            </span>
            {due && data.home.ovaDue > 0 ? <span className="sv-door-dot" aria-hidden /> : null}
          </button>
        )
      })}
    </nav>
  )

  const accountEntry = (
    <AccountEntry
      open={account}
      setOpen={setAccount}
      theme={theme}
      onTheme={onTheme}
      identity={data.konto.identity}
      onKonto={openKonto}
      onSignOut={actions.signOut}
    />
  )

  if (phone) {
    return (
      <div className="sv-pframe">
        <div className="sv-pframe-account">{accountEntry}</div>
        <main className="sv-pmain" key={page}>
          {body}
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
      <main className="sv-main" key={page}>
        {body}
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
  identity,
  onKonto,
  onSignOut,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  identity: IdentityView
  /** Konto, opened at one of its cards. */
  onKonto: (card: KontoCardId) => void
  onSignOut: () => void
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
          <AccountCard
            theme={theme}
            onTheme={onTheme}
            close={close}
            identity={identity}
            onKonto={onKonto}
            onSignOut={onSignOut}
          />
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
  identity,
  onKonto,
  onSignOut,
}: {
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  close: () => void
  identity: IdentityView
  onKonto: (card: KontoCardId) => void
  onSignOut: () => void
}) {
  // "System" follows the device once; the app's mode itself stays light or
  // dark (there is no saved System mode).
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
  // Each row opens its own card of Konto; the card here closes first, so
  // one account panel is ever on the table.
  const toKonto = (card: KontoCardId) => {
    close()
    onKonto(card)
  }
  return (
    <div className="sv-card sv-acard" id="sv-account-card" data-testid="rd-account-menu">
      <div className="sv-acard-head">
        <span className="sv-avatar sv-avatar--still" aria-hidden>
          <UserRound size={20} strokeWidth={1.75} />
        </span>
        <span className="sv-acard-who">
          <b>{identity.name}</b>
          <span>{identity.plan ? `Inloggad · ${identity.plan}` : identity.email}</span>
        </span>
        <button type="button" className="sv-icon-btn" aria-label="Stäng" onClick={close}>
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      <AccountRow
        label="Konto"
        hint="Namn, e-post och inloggning"
        onClick={() => toKonto('konto')}
      />
      <AccountRow
        label="Inställningar"
        hint="Palett, typsnitt och coach"
        onClick={() => toKonto('installningar')}
      />
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
      <AccountRow label="Hjälp" hint="Kortkommandon och support" onClick={() => toKonto('hjalp')} />
      <div className="sv-acard-foot">
        <button
          type="button"
          className="sv-btn sv-btn--quiet sv-btn--block"
          onClick={() => {
            close()
            onSignOut()
          }}
        >
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
