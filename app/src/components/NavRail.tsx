// NavRail — the product chrome (owner-picked B+ from /nav-bakeoff,
// 2026-07-03). A Linear-class persistent left rail speaking the
// product's own margin-rail language, replacing the MC minimal mast.
//
// Not a link list — a compass:
//
//   ⌜ HP-Coach              «        brand + collapse (⌘B)
//   HEM / ÖVNING / LEKTION /         nav with LIVE SIGNALS — Övning
//   FRAMSTEG                          carries the due-rep count,
//                                     Framsteg the honest week delta
//   [ PÅBÖRJAD · Övning · KVA ]      the cross-device resume card —
//                                     "where was I" from ANY page
//   Höstprov 26 · 114 dagar          the clock, always present
//   ljus ◐ · mer →                   quick mode toggle + the /mer hub
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
      <div
        data-testid="page-content"
        style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </div>
    </div>
  )
}

// ── The rail itself ────────────────────────────────────────────────

const NAV = [
  { to: '/', label: 'Hem' },
  { to: '/drill', label: 'Övning' },
  { to: '/lektion', label: 'Lektion' },
  { to: '/progress', label: 'Framsteg' },
] as const

const footWord: CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted-2)',
}

function NavRail({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation()
  const sitting = useSitting()
  const days = useDaysRemaining()

  if (collapsed) {
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
            padding: '20px 0',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ color: 'var(--muted-2)', fontSize: 13 }}>»</span>
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
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--muted-2)',
              writingMode: 'vertical-rl',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {days} d
          </span>
        </button>
      </aside>
    )
  }

  const pathname = location.pathname
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

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
            <span style={{ color: 'var(--muted-2)', fontStyle: 'normal', marginRight: 5 }}>⌜</span>
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

      {/* nav with live signals */}
      <nav
        data-testid="page-nav"
        aria-label="Sektioner"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {NAV.map(({ to, label }) => {
          const active = isActive(to)
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: active ? 'var(--accent)' : 'var(--ink-2)',
                fontWeight: active ? 600 : 400,
                padding: '11px 18px',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                textDecoration: 'none',
                minWidth: 0,
              }}
            >
              {label}
              <NavSignal label={label} />
            </Link>
          )
        })}
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
          <Link to="/mer" data-testid="mast-mer" style={{ ...footWord, textDecoration: 'none' }}>
            mer →
          </Link>
        </span>
      </div>
    </aside>
  )
}

// ── Live signals ───────────────────────────────────────────────────

/** Övning carries the due-rep count; Framsteg the honest week delta
 *  (computeProjectedDelta — blank when the weeks aren't comparable).
 *  Both from cached queries; render nothing while loading. */
function NavSignal({ label }: { label: string }) {
  const due = useDueMistakes()
  const stats = useStats()

  let text: string | null = null
  if (label === 'Övning') {
    const n = due.data?.length ?? 0
    if (n > 0) text = `${n} att repetera`
  } else if (label === 'Framsteg' && stats.data) {
    const delta = computeProjectedDelta(stats.data.bySection)
    if (delta != null) text = `${formatDeltaSv(delta)} denna vecka`
  }
  if (!text) return null
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.04em',
        textTransform: 'none',
        color: 'var(--muted-2)',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {text}
    </span>
  )
}

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
            color: 'var(--muted)',
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
            color: 'var(--muted)',
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
