// Page — the minimal-mast chrome (MC of the M3 "Boksidan" rebuild).
//
// The EDITION shell (frosted running head + section echo + folio +
// vim-style bottom status line) is demolished. The M3 reference renders
// NO chrome at all; the owner-ratified product chrome is ONE quiet band
// (reference: devbake/LayoutBakeoff.tsx MinimalMasthead — the approved
// bake-off mock):
//
//   ⌜ HP-Coach        HEM · ÖVNING · LEKTION · FRAMSTEG   ljus ◐ · spalt
//   ────────────────────────────────────────────────────────────────────
//
//   - one hairline, transparent bg — no frosted backdrop, no shadow
//   - brand as a designed mark (display italic + corner bracket)
//   - 4 nav links ONLY (Feedback stays reachable via ⌘K + phone tabs)
//   - a quiet picker corner (mode + palette words, muted-2 mono) —
//     interim home until the real Settings surface (task #160); wired
//     through useSyncedPrefs so both PERSIST cross-device (task #174:
//     the old EditionStrip ◐ was local-only)
//   - NO section echo (the drill rail owns "ORD · 1/10"), NO folio,
//     NO status line, NO exam-tag
//
// Phone behaviour is unchanged: at <768px Page is a passthrough — the
// bottom tab bar (MobileFrame) is the phone's navigation.
//
// API compat: consumers still pass runningHead/folio/status from the
// EDITION era. They are accepted and IGNORED so the eight call sites
// didn't need to churn in the same PR; drop them opportunistically.

import { Link, useLocation } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'

import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import { useViewport } from '@/hooks/useViewport'
import { useUiStore } from '@/stores/uiStore'

type StatusLineProps = {
  mode: string
  context?: string
  progress?: number
  hints?: string[]
}

type Props = {
  /** @deprecated EDITION-era. Accepted for caller compat; not rendered
   *  (the mast shows no section echo — the drill rail owns it). */
  runningHead?: string | string[]
  /** @deprecated EDITION-era folio. Not rendered. */
  folio?: { current: number; total: number }
  /** @deprecated EDITION-era status line. Not rendered. */
  status?: StatusLineProps
  children: ReactNode
  style?: CSSProperties
}

export function Page({ children, style }: Props) {
  const viewport = useViewport()

  // Phone keeps its iOS-artboard chrome (status bar + BottomTabs from
  // MobileFrame); the mast is desktop/reader chrome only.
  if (viewport === 'phone') return <>{children}</>

  return (
    <div
      data-testid="page-shell"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--ink)',
        ...style,
      }}
    >
      <MinimalMast />
      <div
        data-testid="page-content"
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </div>
    </div>
  )
}

// ── The mast ───────────────────────────────────────────────────────

/** The one shared top band. Exported so full-bleed surfaces that bypass
 *  Page (BoksidanDesk's drill) mount the SAME chrome — no second mast
 *  fork. Values copied from the approved mock (LayoutBakeoff.tsx
 *  MinimalMasthead, L157-215). */
export function MinimalMast() {
  return (
    <header
      data-testid="running-head"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '14px clamp(24px, 5vw, 64px) 11px',
        borderBottom: '1px solid var(--hairline)',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      {/* Brand as a designed mark — display italic + the corner-bracket
       *  signature (mock L186-198). */}
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, flexWrap: 'wrap' }}>
        <NavLinks />
        <span aria-hidden style={{ color: 'var(--hairline)' }}>
          ·
        </span>
        <PickerCorner />
      </div>
    </header>
  )
}

// Top-level routes in the mast. FOUR links only (MC checklist): the
// Feedback exporter stays reachable via ⌘K and the phone tab bar.
const NAV_LINKS = [
  { to: '/', label: 'Hem' },
  { to: '/drill', label: 'Övning' },
  { to: '/lektion', label: 'Lektion' },
  { to: '/progress', label: 'Framsteg' },
] as const

export function NavLinks() {
  const location = useLocation()
  const pathname = location.pathname
  // Active route = exact path match for '/', prefix match otherwise so
  // /lektion?section=NOG keeps 'Lektion' lit.
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))
  return (
    <nav
      data-testid="page-nav"
      aria-label="Sektioner"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 22,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      {NAV_LINKS.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          aria-current={isActive(to) ? 'page' : undefined}
          className="hpc-nav-link"
          style={{ color: isActive(to) ? 'var(--ink)' : 'var(--muted)' }}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

// ── Picker corner ──────────────────────────────────────────────────
//
// `ljus ◐ · mer` in muted-2 mono (mock L206-214 shape). The mode word
// stays as the one quick toggle (through useSyncedPrefs — persists
// cross-device, M6 finding #174); everything else lives on /mer, the
// M-settings hub (#160) — the owner-ratified home for the ⌘K long tail.

function PickerCorner() {
  const mode = useUiStore((s) => s.mode)
  const synced = useSyncedPrefs()

  const word: CSSProperties = {
    all: 'unset',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--muted-2)',
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
      <button
        type="button"
        onClick={() => synced.setMode(mode === 'dark' ? 'light' : 'dark')}
        aria-label={mode === 'dark' ? 'Växla till ljust läge' : 'Växla till mörkt läge'}
        style={word}
      >
        {mode === 'dark' ? 'mörk' : 'ljus'} ◐
      </button>
      <span aria-hidden style={{ color: 'var(--hairline)', fontSize: 11 }}>
        ·
      </span>
      <Link to="/mer" data-testid="mast-mer" style={{ ...word, textDecoration: 'none' }}>
        mer
      </Link>
    </span>
  )
}
