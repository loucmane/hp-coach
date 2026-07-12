// NavRail — the product chrome. Rebuilt to the owner-picked nav
// redesign (2026-07-11): B2 "Innehållet" (document-native) expanded, the
// bespoke glyph spine (S2) collapsed. Five identical doors, same set and
// order as the phone bar (DOORS is the shared source):
//
//     Hem · Öva · Provpass · Uppslag · Framsteg
//
// Expanded = the book's table of contents:
//
//   ⌜ HP-Coach              «        brand + collapse (⌘B)
//   INNEHÅLL                          the ToC eyebrow
//   Hem                               small-caps serif rows; the active
//   Öva ¹⁴                              row is set in var(--accent). A
//   Provpass                          raised folio numeral rides right
//   Uppslag ⁸                           after the label (spine-corner
//   Framsteg ⁺⁰,⁰⁴                      grammar) — REAL signals: Öva →
//                                     due queue, Uppslag → wired
//                                     sections, Framsteg → week delta.
//   [ PÅBÖRJAD · Övning · KVA ]       the cross-device resume card
//   Höstprov 26 · 114 dagar           the clock, always present
//   ljus ◐ · historik · mer →         mode toggle + appendix + /mer hub
//
// Collapsed = the closed book's spine: the five engraved glyphs (19px),
// the active one in var(--accent), Öva's due count as the one accent
// numeral. NO bokmärke ribbon anywhere — accent marks the active door
// and nothing else (the accent-active law, owner 2026-07-11).
//
// Collapse: « chevron or ⌘B → a 44px spine (vertical wordmark, »-peek,
// countdown kept as "114 d"). The preference persists per device via
// localStorage; drill surfaces mount collapsed (the focus-mode-bare
// decision survives) but stay expandable.
//
// Desktop-only — phone keeps its bottom tab bar (Page passthrough).

import { Link, useLocation } from '@tanstack/react-router'
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'

import { useDueMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import { useResumptionCandidate } from '@/components/home/useResumptionCandidate'
import { DueNumeral } from '@/components/motion/DueNumeral'
import { wiredSections } from '@/data/frameworks'
import { dueNumeralOwnedByPage } from '@/lib/motion'
import { DOORS, type Door, type DoorId } from '@/lib/nav'
import { computeProjectedDelta, formatDeltaSv } from '@/lib/scoring'
import { useDaysRemaining, useSitting } from '@/stores/examStore'
import { useUiStore } from '@/stores/uiStore'

const RAIL_LS_KEY = 'hpc-rail'

function loadCollapsed(defaultCollapsed: boolean): boolean {
  if (defaultCollapsed) return true
  try {
    return localStorage.getItem(RAIL_LS_KEY) === 'collapsed'
  } catch {
    return false
  }
}

/** Grid shell: rail on the left, page content on the right. Owns the
 *  collapse state + the ⌘B toggle. `defaultCollapsed` is the drill's
 *  focus mode — those surfaces always MOUNT collapsed (not persisted),
 *  but the user can peek the rail back open. */
export function RailShell({
  children,
  defaultCollapsed = false,
}: {
  children: ReactNode
  defaultCollapsed?: boolean
}) {
  const [collapsed, setCollapsed] = useState(() => loadCollapsed(defaultCollapsed))

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c
      // Focus-mode mounts don't write the preference — expanding the
      // rail mid-drill shouldn't force it open on the home page too.
      if (!defaultCollapsed) {
        try {
          localStorage.setItem(RAIL_LS_KEY, next ? 'collapsed' : 'open')
        } catch {
          /* private mode */
        }
      }
      return next
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: collapsed ? '44px 1fr' : '224px 1fr',
        transition: 'grid-template-columns 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        alignItems: 'stretch',
        minHeight: '100dvh',
      }}
    >
      <NavRail collapsed={collapsed} onToggle={toggle} />
      {/* a11y: <main> landmark — the sibling <NavRail> above is an
       *  <aside>, so this is the one-and-only main-content region at
       *  reader/studio viewport (see MobileFrame.tsx for the phone
       *  equivalent, which is mutually exclusive with this one). */}
      <main
        data-testid="page-content"
        style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </main>
    </div>
  )
}

// ── Active-door resolution ─────────────────────────────────────────
//
// A door owns a family of sub-surfaces: the Öva hub also lights up on
// the drill/repetition/diagnostik flows it launches; Uppslag on the
// reader; Provpass on the mock. Home matches only the exact root.

const DOOR_PREFIXES: Record<DoorId, readonly string[]> = {
  home: [],
  ova: ['/ova', '/drill', '/repetition', '/diagnostik'],
  provpass: ['/prov'],
  uppslag: ['/lektion'],
  framsteg: ['/progress'],
}

function isActiveDoor(id: DoorId, pathname: string): boolean {
  if (id === 'home') return pathname === '/'
  return DOOR_PREFIXES[id].some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

const footWord: CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  // WCAG AA color-contrast: --muted passes (~6.2-6.9:1) while staying
  // visually "quiet" per the Boksidan footer-link idiom.
  color: 'var(--muted)',
}

// ── The rail itself ────────────────────────────────────────────────

function NavRail({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation()
  const sitting = useSitting()
  const days = useDaysRemaining()
  const pathname = location.pathname

  // Real folio signals — wired via the live hooks, not fixtures. A door
  // with no honest number simply renders no numeral (signals are real
  // data or nothing).
  const due = useDueMistakes()
  const stats = useStats()
  const dueCount = due.data?.length ?? 0
  const weekDelta = useMemo(() => {
    if (!stats.data) return null
    return computeProjectedDelta(stats.data.bySection)
  }, [stats.data])
  // The living numeral (A2): the Öva due-count. It rolls A2-style on
  // every change (DigitRoll — up on a new mistake, down on a resolve)
  // AND it flies: on the drill/repetition surfaces the page-header
  // station (DueHeaderStation) owns the numeral via the shared layoutId
  // under RouteScene's root LayoutGroup — RouteScene overlaps scenes
  // (popLayout) precisely so this handoff has both stations mounted.
  // While the numeral is away, the rail slot holds an exact-width
  // reserve (genuinely empty, no reflow — A2 fix 3). Under reduced
  // motion the flight is disabled and the rail numeral stays put.
  const dueAway = dueNumeralOwnedByPage(pathname)
  const folios: Partial<Record<DoorId, string>> = {
    ova: dueCount > 0 ? String(dueCount) : undefined,
    uppslag: String(wiredSections().length),
    framsteg: weekDelta != null ? formatDeltaSv(weekDelta) : undefined,
  }

  if (collapsed) {
    return (
      <Spine
        onToggle={onToggle}
        pathname={pathname}
        days={days}
        dueCount={dueCount}
        dueAway={dueAway}
      />
    )
  }

  return (
    <aside
      data-testid="nav-rail"
      data-collapsed="false"
      style={{
        borderRight: '1px solid var(--hairline)',
        position: 'sticky',
        top: 0,
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* brand + collapse */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '20px 18px 22px',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span
            data-testid="brand-mark"
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 17,
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{ color: 'var(--muted)', fontStyle: 'normal', marginRight: 5 }}
              aria-hidden
            >
              ⌜
            </span>
            HP-Coach
          </span>
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Fäll ihop menyn (⌘B)"
          title="Fäll ihop (⌘B)"
          style={{ ...footWord, fontSize: 13 }}
        >
          «
        </button>
      </div>

      {/* the table of contents */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          padding: '0 18px 8px',
          borderBottom: '1px solid var(--hairline-2)',
          marginBottom: 4,
        }}
      >
        Innehåll
      </div>
      <nav
        data-testid="page-nav"
        aria-label="Sektioner"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {DOORS.map((door) => (
          <TocRow
            key={door.id}
            door={door}
            active={isActiveDoor(door.id, pathname)}
            folio={folios[door.id]}
            due={door.id === 'ova' && dueCount > 0 ? { count: dueCount, away: dueAway } : undefined}
          />
        ))}
      </nav>

      {/* the compass: cross-device resume */}
      <RailResume />

      <div style={{ flex: 1 }} />

      {/* grounding + tools */}
      <div
        style={{
          padding: '14px 18px 16px',
          borderTop: '1px solid var(--hairline-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--ink-2)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {sitting.label} · {days} dagar
        </span>
        <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <ModeWord />
          <Link
            to="/historik"
            data-testid="mast-historik"
            style={{ ...footWord, textDecoration: 'none' }}
          >
            historik
          </Link>
          <Link to="/mer" data-testid="mast-mer" style={{ ...footWord, textDecoration: 'none' }}>
            mer →
          </Link>
        </span>
      </div>
    </aside>
  )
}

// ── Expanded — a table-of-contents row ─────────────────────────────

/** One ToC entry: small-caps serif label, optional raised folio numeral
 *  riding right after it (spine-corner grammar). The active row is the
 *  ONE accent object in the expanded rail (accent-active law — no ribbon). */
function TocRow({
  door,
  active,
  folio,
  due,
}: {
  door: Door
  active: boolean
  folio?: string
  /** When set (the Öva due-count), the numeral rolls A2-style on every
   *  change AND is a flight station: `away` yields ownership to the
   *  drill/repetition header (exact-width reserve holds the slot). */
  due?: { count: number; away: boolean }
}) {
  return (
    <Link
      to={door.to}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '11px 18px',
        textDecoration: 'none',
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontVariant: 'all-small-caps',
          letterSpacing: '0.07em',
          fontWeight: active ? 600 : 500,
          color: active ? 'var(--accent)' : 'var(--ink-2)',
          whiteSpace: 'nowrap',
        }}
      >
        {door.label}
      </span>
      {folio ? (
        /* Owner call 2026-07-12: the dot-leader running the full rail
         * width read as a long ugly line. The signal now rides right
         * after the label, slightly raised — the same grammar as the
         * spine glyph's corner numeral and the phone tab's count. */
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.04em',
            color: active ? 'var(--accent)' : 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            position: 'relative',
            top: -5,
          }}
        >
          {due != null ? (
            <DueNumeral
              count={due.count}
              away={due.away}
              size={10.5}
              color={active ? 'var(--accent)' : 'var(--muted)'}
              testid="rail-due"
            />
          ) : (
            folio
          )}
        </span>
      ) : null}
    </Link>
  )
}

// ── Collapsed — the glyph spine ────────────────────────────────────

/** 44px closed-book spine: collapse-toggle peek, vertical wordmark, the
 *  five engraved glyphs as nav links (active = accent), Öva's due count
 *  as the one accent numeral, countdown folio. */
function Spine({
  onToggle,
  pathname,
  days,
  dueCount,
  dueAway,
}: {
  onToggle: () => void
  pathname: string
  days: number
  dueCount: number
  /** The header station owns the numeral (drill/repetition) — the spine
   *  corner stays genuinely empty while it is away. */
  dueAway: boolean
}) {
  return (
    <aside
      data-testid="nav-rail"
      data-collapsed="true"
      style={{
        borderRight: '1px solid var(--hairline)',
        position: 'sticky',
        top: 0,
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label="Visa menyn (⌘B)"
        title="Visa menyn (⌘B)"
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span style={{ color: 'var(--muted)', fontSize: 13 }} aria-hidden>
          »
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--muted)',
            writingMode: 'vertical-rl',
            letterSpacing: '0.04em',
          }}
        >
          HP-Coach
        </span>
      </button>

      <nav
        data-testid="page-nav"
        aria-label="Sektioner"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 9,
          marginTop: 24,
        }}
      >
        {DOORS.map((door) => (
          <SpineSlot
            key={door.id}
            door={door}
            active={isActiveDoor(door.id, pathname)}
            count={door.id === 'ova' && dueCount > 0 ? dueCount : undefined}
            away={dueAway}
          />
        ))}
      </nav>

      <span style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {days} d
      </span>
    </aside>
  )
}

/** One spine slot: the glyph (19px), active in accent; the optional due
 *  count rides the top-right corner as the one accent numeral. */
function SpineSlot({
  door,
  active,
  count,
  away,
}: {
  door: Door
  active: boolean
  count?: number
  away?: boolean
}) {
  return (
    <Link
      to={door.to}
      aria-current={active ? 'page' : undefined}
      aria-label={door.label}
      style={{
        position: 'relative',
        width: 42,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        color: active ? 'var(--accent)' : 'var(--muted)',
      }}
    >
      <door.Glyph s={19} />
      {count != null && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -2,
            right: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: 8.5,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <DueNumeral count={count} away={away} size={8.5} testid="spine-due" />
        </span>
      )}
    </Link>
  )
}

// ── Live compass + mode toggle ─────────────────────────────────────

function RailResume() {
  const now = useMemo(() => new Date(), [])
  const c = useResumptionCandidate(now)
  if (!c || c.stale) return null
  return (
    <div style={{ padding: '18px 18px 0' }}>
      <Link
        to={c.href}
        data-testid="rail-resume"
        style={{
          display: 'block',
          background: 'var(--accent-soft)',
          padding: '12px 14px',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            // WCAG AA: --muted on --accent-soft measures ~4.31:1 — just
            // under threshold; --ink-2 passes on this saturated fill.
            color: 'var(--ink-2)',
          }}
        >
          Påbörjad
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '5px 0 2px',
          }}
        >
          {c.headline}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-2)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {c.progress} · fortsätt →
        </div>
      </Link>
    </div>
  )
}

function ModeWord() {
  const mode = useUiStore((s) => s.mode)
  const synced = useSyncedPrefs()
  return (
    <button
      type="button"
      onClick={() => synced.setMode(mode === 'dark' ? 'light' : 'dark')}
      aria-label={mode === 'dark' ? 'Växla till ljust läge' : 'Växla till mörkt läge'}
      style={footWord}
    >
      {mode === 'dark' ? 'mörk' : 'ljus'} ◐
    </button>
  )
}
