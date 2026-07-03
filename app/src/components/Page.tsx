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

import type { CSSProperties, ReactNode } from 'react'

import { RailShell } from '@/components/NavRail'
import { useViewport } from '@/hooks/useViewport'

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
  // MobileFrame); the rail is desktop/reader chrome only.
  if (viewport === 'phone') return <>{children}</>

  // B+ (2026-07-03): the minimal mast was replaced by the NavRail —
  // the owner found the quiet band signifier-weak; the rail is the
  // compass treatment picked from /nav-bakeoff.
  return (
    <div
      data-testid="page-shell"
      style={{ flex: 1, display: 'flex', color: 'var(--ink)', ...style }}
    >
      <RailShell>{children}</RailShell>
    </div>
  )
}
