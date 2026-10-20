// A · Folio — editorial paper, next generation. The direction's root: it
// injects Literata + Inter, scopes the token set (folio.css) to its own
// data attribute and routes the screens it has built:
//   1 Idag        — the app frame (one sheet of paper: a typeset contents
//                   list beside the page, no panel) around Home
//   2 Läsfråga    — the drill as a book spread (FolioDrill)
//   3 Facit       — the same spread, graded, the facit leading with the trap
//   4 Navigering  — the frame in its other state: the contents folded to a
//                   thumb index (the letter tabs on a dictionary's edge) and
//                   the account slip open (phone: the account sheet)
//   5 Öva         — the frame around the practice hub, a book's contents
//   6 Kvantfråga  — a problem set like a textbook exercise, its page opening
//                   to a spread on Svara (FolioQuant)
//   7 DTK         — the figure page as a plate tipped in beside its
//                   questions (FolioQuant)
//   8 Repetera    — the frame, Öva current, around today's misses
//   9 Provpass    — the frame around the exam notice (FolioProvpass); a
//                   started pass leaves the frame for focus mode, set in
//                   each question's drill layout and never graded; once
//                   its one hand-in is tried, the frame is back (around
//                   the pass's closing page, if the host stays on 9)
//  10 Resultat    — the frame, Provpass current, around the handed-in pass
//  11 Framsteg    — the frame around the report, with Historik and Fällor
//                   as its back matter (FolioFramsteg)
//  12 Uppslag     — the frame, its contents folded to the thumb index,
//                   around the lesson spread: the book's contents on the
//                   verso, the open entry on the recto (FolioUppslag)
//  13 Konto       — the frame around the imprint page of settings; no
//                   destination is current there (FolioKonto)
//  14 ELF         — the reading spread in English, the chrome in Swedish
//                   (FolioDrill)
//
// Kit v2: every screen reads useDirectionData(); the contents ask the host
// for a destination (actions.go). A modal slip on a frame page (the pass's
// conditions) is set at the stage's level, over the whole frame, which goes
// inert under it. The account slip's rows open Konto at their own places.
// Folio hands its screens the host's actions with one change: a lesson
// asked for anywhere is recorded on its way to the host (Folio, below).

import { PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import './folioPlus.css'
import './fpShell.css'
import './fpPalette.css'
import {
  DirectionDataProvider,
  useDirectionData,
} from '@/components/devbake/redesign/directionData'
import {
  type AppScreenKey,
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  fmtScore,
  type ScreenKey,
  type ThemeKey,
  useDismiss,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionActions,
  DirectionData,
  PlanItemView,
  ProvHubView,
} from '@/components/devbake/redesign/viewModel'
import { FolioDrill, ORIGIN_IDAG, type Origin } from './FolioDrill'
import { FolioFramsteg, type FramstegSub } from './FolioFramsteg'
import { FolioHome, inWords } from './FolioHome'
import { FolioKonto, type KontoJump, type KontoPlace } from './FolioKonto'
import { FolioOva } from './FolioOva'
import {
  ConditionsSlip,
  FolioPassEnded,
  FolioPassRun,
  FolioProvpass,
  FolioProvResult,
  type PassEnd,
  type ProvNote,
} from './FolioProvpass'
import { FolioQuant } from './FolioQuant'
import { FolioRepetera, readyLine } from './FolioRepetera'
import { FolioUppslag, type UppslagBack } from './FolioUppslag'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&display=swap'

/** Folio+: the destinations' line icons (Folio's 1.5 stroke on a 24
 *  grid), for the phone's tabs and the folded rail — where Folio set bare
 *  initials (I Ö P U F) that told a new reader nothing. The full word stays
 *  the accessible name and the rail's pulled tab. */
const ICON_PATHS: Record<Destination, string[]> = {
  // A day on the calendar.
  idag: ['M4 6.5h16v13H4z', 'M4 10.5h16', 'M8.5 4v4', 'M15.5 4v4', 'M11 15h2'],
  // A pencil at work.
  ova: ['M5 19l1-4L16 5l3 3L9 18z', 'M14 7l3 3', 'M5 19l4-1'],
  // A stopwatch: the timed pass.
  provpass: ['M12 20.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M12 13.5V10', 'M10 3.5h4', 'M12 3.5v3'],
  // An open book.
  uppslag: [
    'M12 7c-2.5-1.8-5.5-2.2-8.5-1.5v13c3-.7 6-.3 8.5 1.5',
    'M12 7c2.5-1.8 5.5-2.2 8.5-1.5v13c-3-.7-6-.3-8.5 1.5',
    'M12 7v13',
  ],
  // A rising line over its axis.
  framsteg: ['M4 19.5h16', 'M5 15.5l4.5-4.5 3.5 3 6-6.5', 'M15 7.5h4v4'],
}

function NavIcon({ id }: { id: Destination }) {
  return (
    <svg
      className="fp-nav-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[id].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/** "Nästa: kvant, om en dag", from the Provpass rhythm when there is one. */
function provLine(home: DirectionData['home']): string {
  const p = home.provpass
  if (!p) return 'Ett helt pass, 55 minuter'
  const half = p.half === 'kvant' ? 'kvant' : 'verbal'
  if (p.due || p.daysUntilNext <= 0) return `Dags för ett pass: ${half}`
  return `Nästa: ${half}, om ${inWords(p.daysUntilNext)} ${p.daysUntilNext === 1 ? 'dag' : 'dagar'}`
}

/** Folio+ (Samtal's nav subtitles): one live line under each desktop
 *  entry, from the data, about what waits there. Öva's count is today's
 *  repetition pile, said as today's: Framsteg counts the whole queue. */
function subtitles(data: DirectionData): Record<Destination, string> {
  const { home, uppslag } = data
  const { resume, plan, ovaDue, prognosis } = home
  const done = plan.items.filter((i) => i.completed).length
  const steps = plan.items.length + (resume ? 1 : 0)
  const first = plan.items.find((i) => !i.completed)
  return {
    idag: resume
      ? `Fortsätt ${resume.section}, fråga ${resume.position} av ${resume.total}`
      : first
        ? done > 0
          ? `${done} av ${steps} steg klara`
          : `Först: ${first.title}`
        : 'Klart för idag',
    // What is ready now, never the growing pile (round 3, ADHD R10).
    ova:
      readyLine(data) ??
      (ovaDue > 0 ? 'Missar blir redo senare idag' : 'Alla delprov och Repetera'),
    provpass: provLine(home),
    uppslag: uppslag.open.title
      ? `${uppslag.open.section} · ${uppslag.open.title}`
      : 'Lektioner och ramverk',
    framsteg:
      prognosis.total != null
        ? `Prognos ${fmtScore(prognosis.total)} av 2,0`
        : 'Prognos och historik',
  }
}

/** Focus screens: drills, with Avsluta instead of the frame. (A running
 *  pass is focus mode too, on screen 9: the frame steps aside for it.) */
const FOCUS: readonly AppScreenKey[] = [2, 3, 6, 7, 14]

/** A page of the frame. Repetera lives inside Öva and the result inside
 *  Provpass: Öva and Provpass stay current. Konto is no destination. */
type Page = 'idag' | 'ova' | 'repetera' | 'provpass' | 'resultat' | 'framsteg' | 'uppslag' | 'konto'

function pageOf(screen: AppScreenKey): Page {
  switch (screen) {
    case 5:
      return 'ova'
    case 8:
      return 'repetera'
    case 9:
      return 'provpass'
    case 10:
      return 'resultat'
    case 11:
      return 'framsteg'
    case 12:
      return 'uppslag'
    case 13:
      return 'konto'
    default:
      return 'idag'
  }
}

const ORIGINS: Record<Page, Origin> = {
  idag: ORIGIN_IDAG,
  ova: { label: 'Öva', idag: false, to: 'ova' },
  repetera: { label: 'Öva', idag: false, to: 'ova' },
  provpass: { label: 'Provpass', idag: false, to: 'provpass' },
  resultat: { label: 'Provpass', idag: false, to: 'provpass' },
  framsteg: { label: 'Framsteg', idag: false, to: 'framsteg' },
  uppslag: { label: 'Uppslag', idag: false, to: 'uppslag' },
  konto: { label: 'Konto', idag: false, to: 'konto' },
}

/** The destination each page belongs to in the contents (none for Konto). */
const CURRENT: Record<Page, Destination | null> = {
  idag: 'idag',
  ova: 'ova',
  repetera: 'ova',
  provpass: 'provpass',
  resultat: 'provpass',
  framsteg: 'framsteg',
  uppslag: 'uppslag',
  konto: null,
}

/** The pass the hub summons for its half: the least seen one. */
function summonsOf(hub: ProvHubView): string | null {
  const passes = hub.passes.filter((p) => p.half === hub.half)
  return (passes.find((p) => p.suggested) ?? passes[0])?.id ?? null
}

/** Screen 9's states: the hub (with what the last pass's end left to say),
 *  a pass the reader has started, or one whose hand-in was tried while the
 *  host stayed on screen 9. */
type ProvState =
  | { kind: 'hub'; note: ProvNote }
  | { kind: 'run'; passId: string }
  | { kind: 'ended'; end: PassEnd }

export function FolioPlus(props: DirectionProps) {
  useWebFonts('folio', FONTS)
  const { data, actions } = useDirectionData()
  // Where a drill was opened from: the last frame page shown. The stage
  // keeps Folio mounted across the screens it builds, so this carries.
  const origin = useRef<Origin>(ORIGIN_IDAG)
  // A reading drill's facit that opened a lesson: Uppslag offers the way
  // back to that feedback (Folio+), and the drill reopens where it was
  // parked. Any other frame page forgets it.
  const lessonFrom = useRef<ScreenKey | null>(null)
  const returning = useRef(false)
  const screenRef = useRef(props.screen)
  screenRef.current = props.screen
  if (!FOCUS.includes(props.screen) && props.screen !== 12) lessonFrom.current = null
  // A lesson visit is a detour: Avsluta keeps the drill's own origin.
  if (!FOCUS.includes(props.screen) && !(props.screen === 12 && lessonFrom.current != null))
    origin.current = ORIGINS[pageOf(props.screen)]
  // The lesson last asked for, carried to Uppslag (across the switch from
  // focus mode to the frame too), so that it can say which lesson was asked
  // for while the open one stays.
  const asked = useRef<string | null>(null)
  // Folio's action boundary: every screen below asks for a lesson through
  // these actions — a facit's Slå upp, Fällor, a result's recurring trap,
  // Uppslag's own contents — so each request is recorded, then sent to the
  // host. A plan row's lesson goes as openPlanItem: the frame records it.
  const recording = useMemo<DirectionActions>(
    () => ({
      ...actions,
      openLesson: (id) => {
        asked.current = id
        const from = screenRef.current
        // LÄS only: the host's onScreen reaches 1–4, so ELF (14) has no way back.
        if (from === 2 || from === 3) lessonFrom.current = 3
        else if (from !== 12) lessonFrom.current = null
        actions.openLesson(id)
      },
    }),
    [actions],
  )
  const { screen, onScreen } = props
  // The returning flag is read once, when the drill mounts.
  useEffect(() => {
    if (FOCUS.includes(screen)) returning.current = false
  }, [screen])
  // biome-ignore lint/correctness/useExhaustiveDependencies: lessonFrom is a ref, re-read per screen
  const back = useMemo<UppslagBack | null>(
    () =>
      lessonFrom.current == null
        ? null
        : {
            onBack: () => {
              const to = lessonFrom.current
              if (to == null) return
              lessonFrom.current = null
              returning.current = true
              onScreen(to)
            },
          },
    [onScreen, screen],
  )
  return (
    <div
      data-rd="folio-plus"
      data-theme={props.theme}
      data-palette={data.konto.prefs.palette}
      data-width={props.width}
      data-live={String(props.live)}
      data-testid="rd-folio-plus"
      lang="sv"
    >
      <DirectionDataProvider data={data} actions={recording}>
        {screen === 6 || screen === 7 ? (
          <FolioQuant key={screen} {...props} origin={origin.current} />
        ) : screen === 2 || screen === 3 || screen === 14 ? (
          <FolioDrill
            key={screen === 14 ? 'elf' : 'las'}
            {...props}
            origin={origin.current}
            returning={returning.current}
          />
        ) : (
          <FolioFrame {...props} asked={asked} back={back} />
        )}
      </DirectionDataProvider>
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
  asked,
  back,
}: DirectionProps & { asked: { current: string | null }; back: UppslagBack | null }) {
  const { data, actions } = useDirectionData()
  // Screen 4 shows the frame's other state; screen 1 the default. The other
  // pages keep whatever fold the reader chose.
  const [collapsed, setCollapsed] = useState(screen === 4)
  // Uppslag folds the contents to the thumb index for its spread, apart
  // from the reader's own fold: ⌘B there unfolds it for the visit.
  const [unfolded, setUnfolded] = useState(false)
  const [menu, setMenu] = useState(screen === 4)
  const [page, setPage] = useState<Page>(pageOf(screen))
  // Framsteg's own pages: the report, Historik, Fällor.
  const [sub, setSub] = useState<FramstegSub>('overview')
  const [prov, setProv] = useState<ProvState>({ kind: 'hub', note: null })
  // The pass whose conditions slip is open over the hub.
  const [conditions, setConditions] = useState<string | null>(null)
  // A place on Konto an account-slip row asked for.
  const [kontoJump, setKontoJump] = useState<KontoJump | null>(null)
  const jumps = useRef(0)
  // The last page before Konto: Esc there goes back to it.
  const before = useRef<Page>('idag')
  if (page !== 'konto') before.current = page
  // A plan item that suggests a pass: its conditions open on arrival.
  const summons = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: follows the host's screen only
  useEffect(() => {
    setMenu(screen === 4)
    setPage(pageOf(screen))
    if (screen === 4) setCollapsed(true)
    else if (screen === 1) setCollapsed(false)
    if (screen === 12) setUnfolded(false)
    if (screen !== 11) setSub('overview')
    // A Konto place belongs to the visit it was asked for.
    if (screen !== 13) setKontoJump(null)
    // Leaving screen 9 ends what it was showing: a pass handed in opens the
    // result, and the hub opens fresh next time.
    if (screen !== 9) {
      setProv({ kind: 'hub', note: null })
      setConditions(null)
    }
    const summoned = summons.current
    summons.current = false
    if (screen === 9 && summoned) setConditions(summonsOf(data.provpass.hub))
  }, [screen])

  // Uppslag has read the lesson it was asked for: the request is spent. One
  // asked for on Uppslag itself is Uppslag's own, so leaving forgets it.
  useEffect(() => {
    if (page !== 'uppslag') return
    asked.current = null
    return () => {
      asked.current = null
    }
  }, [page, asked])

  const pageRef = useRef(page)
  pageRef.current = page
  const toggleRail = useCallback(() => {
    if (pageRef.current === 'uppslag') setUnfolded((u) => !u)
    else setCollapsed((c) => !c)
  }, [])
  // ⌘B / Ctrl+B folds the sidebar, as in the live app.
  useEffect(() => {
    if (!live || width !== 'desktop') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleRail()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [live, width, toggleRail])

  // A destination is the host's to open; Folio's pages turn at once
  // (Framsteg on the page asked for).
  const go = useCallback(
    (d: Destination, to: FramstegSub = 'overview') => {
      setMenu(false)
      setPage(d)
      if (d === 'framsteg') setSub(to)
      if (d === 'uppslag') setUnfolded(false)
      // Provpass from the contents opens the hub, past an ended pass's page.
      if (d === 'provpass') setProv((p) => (p.kind === 'ended' ? { kind: 'hub', note: null } : p))
      actions.go(d)
    },
    [actions],
  )
  const closeMenu = useCallback(() => setMenu(false), [])
  // Konto from the account slip, at the place its row names.
  const openKonto = useCallback(
    (to: KontoPlace) => {
      setMenu(false)
      setPage('konto')
      jumps.current += 1
      setKontoJump({ to, n: jumps.current })
      actions.openKonto()
    },
    [actions],
  )
  const leaveKonto = useCallback(() => go(CURRENT[before.current] ?? 'idag'), [go])
  const resume = useCallback(() => {
    actions.resume()
    onScreen(2)
  }, [actions, onScreen])
  const openItem = useCallback(
    (item: PlanItemView) => {
      if (item.kind === 'mock') summons.current = true
      // A lesson row asks for its own entry: Uppslag says so until it opens.
      if (item.kind === 'lesson' && item.framework) asked.current = item.framework
      actions.openPlanItem(item.id)
    },
    [actions, asked],
  )
  const startPass = useCallback(
    (passId: string) => {
      actions.startProvpass(passId)
      setConditions(null)
      setProv({ kind: 'run', passId })
    },
    [actions],
  )
  const leavePass = useCallback((note: ProvNote) => setProv({ kind: 'hub', note }), [])
  // The hand-in was tried: the pass is over. A host that opens the result
  // moves on (and the hub opens fresh next time); one that stays on screen 9
  // shows the pass's closing page in the frame.
  const endPass = useCallback(
    (end: PassEnd) => setProv((p) => (p.kind === 'run' ? { kind: 'ended', end } : p)),
    [],
  )
  const toHub = useCallback(() => setProv({ kind: 'hub', note: null }), [])
  const toHistorik = useCallback(() => go('framsteg', 'historik'), [go])
  const current = CURRENT[page]
  const due = data.home.ovaDue
  const subs = subtitles(data)
  // Konto's visible way back names the destination it returns to.
  const backTo =
    DESTINATIONS.find((d) => d.id === (CURRENT[before.current] ?? 'idag'))?.label ?? 'Idag'

  // A started pass is focus mode: once the host's running view is that pass
  // it takes the whole stage, with no frame.
  if (page === 'provpass' && prov.kind === 'run' && data.provpass.running.passId === prov.passId) {
    return (
      <FolioPassRun
        key={prov.passId}
        width={width}
        live={live}
        onLeave={leavePass}
        onEnd={endPass}
      />
    )
  }
  const slipPass =
    page === 'provpass' &&
    conditions != null &&
    data.provpass.hub.passes.some((p) => p.id === conditions)
      ? conditions
      : null
  // A page's keys rest while the account slip or a modal slip is open.
  const keys = live && !menu && slipPass == null

  const content =
    page === 'ova' ? (
      <FolioOva width={width} live={keys} />
    ) : page === 'repetera' ? (
      <FolioRepetera width={width} live={keys} />
    ) : page === 'provpass' ? (
      prov.kind === 'ended' ? (
        <FolioPassEnded width={width} live={keys} end={prov.end} onHub={toHub} />
      ) : (
        <FolioProvpass
          width={width}
          live={keys}
          note={prov.kind === 'hub' ? prov.note : null}
          pending={prov.kind === 'run' ? prov.passId : null}
          onAsk={setConditions}
          onCancel={toHub}
          onHistorik={toHistorik}
        />
      )
    ) : page === 'resultat' ? (
      <FolioProvResult
        width={width}
        live={keys}
        onNewPass={() => go('provpass')}
        onHistorik={toHistorik}
      />
    ) : page === 'framsteg' ? (
      <FolioFramsteg width={width} live={keys} sub={sub} onSub={setSub} onGo={go} />
    ) : page === 'uppslag' ? (
      <FolioUppslag width={width} live={keys} asked={asked.current} back={back} />
    ) : page === 'konto' ? (
      <FolioKonto
        width={width}
        live={keys}
        jump={kontoJump}
        onBack={leaveKonto}
        backLabel={backTo}
      />
    ) : (
      <FolioHome
        width={width}
        live={keys}
        onResume={resume}
        onGo={go}
        onFramsteg={(to) => go('framsteg', to)}
        onOpenItem={openItem}
      />
    )
  const slip = slipPass ? (
    <ConditionsSlip passId={slipPass} onStart={startPass} onClose={() => setConditions(null)} />
  ) : null

  if (width === 'phone') {
    return (
      <>
        <div className="fp-phone" inert={slip ? true : undefined}>
          <header className="fp-ptop">
            <Wordmark />
            <button
              type="button"
              className="fp-avatar-btn"
              data-testid="rd-account"
              aria-label="Konto och inställningar"
              aria-expanded={menu}
              aria-controls="fp-account-sheet"
              onClick={() => setMenu(!menu)}
            >
              <span className="fp-avatar" aria-hidden>
                <UserRound size={17} strokeWidth={1.6} />
              </span>
            </button>
          </header>
          <main className="fp-pscroll" key={page} data-page={page}>
            <div className={live ? 'fp-enter' : undefined}>{content}</div>
          </main>
          {/* Folio+: each tab's word under its line icon, the word still
           *  the tab's name. */}
          <nav className="fp-tabs" aria-label="Huvudmeny">
            {DESTINATIONS.map((d) => (
              <button
                type="button"
                key={d.id}
                className="fp-tab"
                data-testid={`rd-nav-${d.id}`}
                aria-current={current === d.id ? 'page' : undefined}
                onClick={() => go(d.id)}
              >
                <span className="fp-tab-icon" aria-hidden>
                  <NavIcon id={d.id} />
                </span>
                <span className="fp-tab-word">
                  {d.label}
                  {d.id === 'ova' && due > 0 ? (
                    <>
                      <span className="fp-tab-dot" aria-hidden />
                      <span className="fp-sr">, {due} att repetera</span>
                    </>
                  ) : null}
                </span>
              </button>
            ))}
          </nav>
          {menu ? (
            <AccountSheet theme={theme} onTheme={onTheme} close={closeMenu} onKonto={openKonto} />
          ) : null}
        </div>
        {slip}
      </>
    )
  }

  // The rail's fold: Uppslag's own (folded for the spread unless the reader
  // opened it there), elsewhere the reader's.
  const folded = page === 'uppslag' ? !unfolded : collapsed
  return (
    <>
      <div className="fp-app" data-collapsed={String(folded)} inert={slip ? true : undefined}>
        <aside className="fp-side" aria-label="Huvudmeny">
          <div className="fp-side-head">
            {folded ? (
              <span className="fp-monogram" role="img" aria-label="HP-Coach">
                HP
              </span>
            ) : (
              <Wordmark />
            )}
            <button
              type="button"
              className="fp-icon-btn fp-tip"
              data-testid="rd-collapse"
              data-tip={folded ? 'Fäll ut  ⌘B' : 'Fäll ihop  ⌘B'}
              aria-label={folded ? 'Fäll ut menyn' : 'Fäll ihop menyn'}
              aria-expanded={!folded}
              onClick={toggleRail}
            >
              {folded ? (
                <PanelLeftOpen size={18} strokeWidth={1.5} aria-hidden />
              ) : (
                <PanelLeftClose size={18} strokeWidth={1.5} aria-hidden />
              )}
            </button>
          </div>
          <nav className="fp-nav">
            {DESTINATIONS.map((d) => (
              <button
                type="button"
                key={d.id}
                className={`fp-nav-item${folded ? ' fp-tip' : ''}`}
                data-testid={`rd-nav-${d.id}`}
                data-tip={folded ? d.label : undefined}
                aria-current={current === d.id ? 'page' : undefined}
                aria-label={d.label}
                aria-describedby={`fp-nav-sub-${d.id}`}
                onClick={() => go(d.id)}
              >
                {folded ? (
                  <>
                    <span className="fp-thumb" aria-hidden>
                      <NavIcon id={d.id} />
                    </span>
                    <span className="fp-nav-label">{d.label}</span>
                    {/* Folded, the live line is still read with the entry. */}
                    <span className="fp-sr" id={`fp-nav-sub-${d.id}`}>
                      {subs[d.id]}
                    </span>
                  </>
                ) : (
                  <span className="fp-nav-text">
                    <span className="fp-nav-label">{d.label}</span>
                    <span className="fp-nav-sub" id={`fp-nav-sub-${d.id}`} data-fp-sub>
                      {subs[d.id]}
                    </span>
                  </span>
                )}
                {d.id === 'ova' && due > 0 ? <span className="fp-nav-dot" aria-hidden /> : null}
              </button>
            ))}
          </nav>
          <div className="fp-side-foot">
            <AccountPopover
              open={menu}
              setOpen={setMenu}
              close={closeMenu}
              theme={theme}
              onTheme={onTheme}
              onKonto={openKonto}
              tip={folded}
            />
          </div>
        </aside>
        <main className="fp-main" key={page} data-page={page}>
          <div className={live ? 'fp-enter' : undefined}>{content}</div>
        </main>
      </div>
      {slip}
    </>
  )
}

function Wordmark() {
  return (
    <span className="fp-wordmark" role="img" aria-label="HP-Coach">
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
  onKonto,
  tip,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  close: () => void
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  onKonto: (to: KontoPlace) => void
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
        className="fp-account"
        data-testid="rd-account"
        aria-label={tip ? 'Konto och inställningar' : undefined}
        aria-expanded={open}
        aria-controls="fp-account-menu"
        onClick={() => setOpen(!open)}
      >
        <b>Konto</b>
        {tip ? null : <span>Inställningar och tema</span>}
      </button>
      {open ? (
        <div className="fp-menu" id="fp-account-menu" data-anchor="side">
          <AccountItems theme={theme} onTheme={onTheme} close={close} onKonto={onKonto} />
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
  onKonto,
}: {
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  close: () => void
  onKonto: (to: KontoPlace) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(true, close, ref)
  return (
    <>
      <div className="fp-scrim" aria-hidden />
      <div className="fp-menu" id="fp-account-sheet" data-anchor="sheet" ref={ref}>
        <AccountItems theme={theme} onTheme={onTheme} close={close} onKonto={onKonto} />
      </div>
    </>
  )
}

/** The account slip's content — a disclosure of plain buttons (no menu
 *  role: there is no arrow-key model to promise), set as words between
 *  hairlines like the contents list. Esc or a press outside closes it.
 *  Konto, Inställningar and Hjälp each open the Konto page at their own
 *  place; Tema is the two words production saves (light, dark). */
function AccountItems({
  theme,
  onTheme,
  close,
  onKonto,
}: {
  theme: ThemeKey
  onTheme: (t: ThemeKey) => void
  close: () => void
  onKonto: (to: KontoPlace) => void
}) {
  const { data, actions } = useDirectionData()
  const identity = data.konto.identity
  return (
    <div data-testid="rd-account-menu">
      <div className="fp-menu-head">
        <b>Ditt konto</b>
        <span>
          {identity.plan ? `Inloggad · ${identity.plan}` : `Inloggad som ${identity.name}`}
        </span>
      </div>
      <MenuItem label="Konto" hint="Namn och e-post" onClick={() => onKonto('top')} />
      <MenuItem
        label="Inställningar"
        hint="Frågeurval, coach och tema"
        onClick={() => onKonto('ovningen')}
      />
      <div className="fp-theme">
        <span className="fp-theme-label" id="fp-theme-label">
          Tema
        </span>
        <fieldset className="fp-seg" aria-labelledby="fp-theme-label">
          <button type="button" aria-pressed={theme === 'light'} onClick={() => onTheme('light')}>
            Ljust
          </button>
          <button
            type="button"
            aria-pressed={theme === 'dark'}
            onClick={() => onTheme('dark')}
            data-testid="rd-theme-toggle"
          >
            Mörkt
          </button>
        </fieldset>
      </div>
      <MenuItem
        label="Hjälp"
        hint="Kortkommandon och länkar"
        onClick={() => onKonto('kortkommandon')}
      />
      <hr className="fp-menu-sep" />
      <MenuItem
        label="Logga ut"
        onClick={() => {
          close()
          actions.signOut()
        }}
      />
    </div>
  )
}

function MenuItem({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" className="fp-menu-item" onClick={onClick}>
      <span>{label}</span>
      {hint ? <span className="fp-menu-hint">{hint}</span> : null}
    </button>
  )
}
