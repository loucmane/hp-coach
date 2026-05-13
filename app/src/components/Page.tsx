// Page — Phase A.8 EDITION shell.
//
// Replaces DesktopNav with the editorial chrome the design direction
// actually calls for:
//
//   ┌──────────────────────────────────────────────────────────┐
//   │ HP · COACH · ORD                            pp. 12 / 80  │  ← running head + folio
//   │ ──────────                                                │  ← single hairline articulator
//   │                                                           │
//   │                  [page content]                           │
//   │                                                           │
//   │ -- ÖVNING -- ord · q12 · ▉▉▉▉▉▉▉░░░ · esc · ⌘k           │  ← status line
//   └──────────────────────────────────────────────────────────┘
//
// Two stolen ideas from other directions in the Phase A.7 design
// strategist pitch:
//
//   - Bottom status line (Terminal): "-- ÖVNING -- ord · q12 · …"
//     mode indicator + context + progress bar (eighth-block at
//     sub-character resolution) + keyboard hints. This is the
//     persistent "where am I" affordance — the page's compass.
//     Editorial-curious but rooted in vim/Bloomberg DNA.
//
//   - Esc-to-parent (Atlas): the status line shows "esc tillbaka"
//     so the gesture is discoverable. Implementation lives in the
//     consuming screens — Page just shows the affordance.
//
// API: pages declare their masthead (running head + folio + status)
// and let the children be pure content. No nav UI inside Page —
// the page's chrome IS the navigation context.
//
// Phone behaviour: at <768px the running head + folio collapse to a
// single thin band at the top of the artboard (the iOS chrome is
// still rendered by MobileFrame). Status line at the bottom is
// kept but compressed (no progress bar, just mode + esc/⌘k hints).

import type { CSSProperties, ReactNode } from 'react'

import { useViewport } from '@/hooks/useViewport'

type FolioLite = {
  /** 1-based; rendered as `pp. 12 / 80` with leading zeros not
   *  padded (real folio convention). */
  current: number
  total: number
}

type StatusLineProps = {
  /** Vim-style mode indicator. Goes between dashes: `-- ÖVNING --`. */
  mode: string
  /** Inline context after the mode (e.g., "ord · q12"). */
  context?: string
  /** Progress fraction 0–1; renders as eighth-block characters at
   *  sub-character resolution (▏▎▍▌▋▊▉█) — 1/8 sub-pixel feel. */
  progress?: number
  /** Right-side keyboard hints (e.g., ["esc tillbaka", "⌘k palett"]). */
  hints?: string[]
}

type Props = {
  /** Running head displayed top-left. Pass an array for the dot-
   *  separated style: `['HP · COACH', 'ORD']` → "HP · COACH · ORD". */
  runningHead: string | string[]
  /** Folio top-right; omit if the page has no page-count metaphor
   *  (e.g., Home). Renders as `pp. 12 / 80`. */
  folio?: FolioLite
  /** Status line displayed bottom-sticky. */
  status: StatusLineProps
  children: ReactNode
  style?: CSSProperties
}

export function Page({ runningHead, folio, status, children, style }: Props) {
  const viewport = useViewport()
  // Phone keeps its iOS-artboard chrome (status bar + BottomTabs from
  // MobileFrame). Adding EDITION's running head + status line on top
  // would be three competing bars at the same screen edges. Pragmatic
  // choice: EDITION chrome is desktop-only; phone composition stays
  // as Phase A.5/A.7 left it.
  if (viewport === 'phone') return <>{children}</>

  const headText = Array.isArray(runningHead) ? runningHead.join(' · ') : runningHead

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
      <RunningHeadBand runningHead={headText} folio={folio} isPhone={false} />
      <div
        data-testid="page-content"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
      <StatusLine status={status} isPhone={false} />
    </div>
  )
}

// ── Running head + folio ──────────────────────────────────────────

function RunningHeadBand({
  runningHead,
  folio,
  isPhone,
}: {
  runningHead: string
  folio?: FolioLite
  isPhone: boolean
}) {
  return (
    <header
      style={{
        padding: isPhone
          ? '12px var(--pad-lg) 10px'
          : 'clamp(20px, 2vh, 32px) clamp(28px, 4vw, 64px) 0',
        borderBottom: '1px solid var(--hairline)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 16,
      }}
    >
      <span
        data-testid="running-head"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: isPhone ? 12 : 13,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          // Subtle pre-content baseline gap so the hairline rule
          // beneath the band reads as the page band's bottom edge,
          // not as a hugging line under the text.
          paddingBottom: isPhone ? 8 : 14,
        }}
      >
        {runningHead}
      </span>
      {folio && <Folio current={folio.current} total={folio.total} />}
    </header>
  )
}

function Folio({ current, total }: FolioLite) {
  // Editorial folio: "pp. 12 / 80" set in mono, with a 1px hairline
  // beneath that's exactly as wide as the digits. This is the
  // EDITION signature element per the design strategist's pitch.
  const totalWidth = `${String(total).length * 0.6 + 0.4}em`
  return (
    <span
      data-testid="folio"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: 'var(--font-mono-track)',
        color: 'var(--muted)',
        fontVariantNumeric: 'tabular-nums',
        paddingBottom: 14,
      }}
    >
      <span>
        pp. {current} / {total}
      </span>
      <span
        aria-hidden
        style={{
          width: totalWidth,
          height: 1,
          background: 'var(--muted)',
          opacity: 0.6,
        }}
      />
    </span>
  )
}

// ── Status line ───────────────────────────────────────────────────

function StatusLine({ status, isPhone }: { status: StatusLineProps; isPhone: boolean }) {
  return (
    <footer
      data-testid="status-line"
      style={{
        // Sticky-bottom: the vim-mode bar is navigation context;
        // losing it on scroll loses the affordance the bar exists for.
        // Sticky (not fixed) so it stays within the canvas's max-width
        // bounds instead of going full-bleed; backdrop blur + 88% bg
        // tint creates the editorial "content slides under frosted
        // bar" effect rather than a hard-edged opaque footer.
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        padding: isPhone ? '8px var(--pad-lg)' : '10px clamp(28px, 4vw, 64px)',
        borderTop: '1px solid var(--hairline)',
        background: 'color-mix(in oklch, var(--bg) 88%, transparent)',
        backdropFilter: 'saturate(140%) blur(10px)',
        WebkitBackdropFilter: 'saturate(140%) blur(10px)',
        // Faint upward shadow articulates the bar as a layer above
        // content sliding underneath. Editorial detail — barely
        // perceptible at rest, comes alive on motion.
        boxShadow: '0 -8px 24px -16px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: 'var(--font-mono-track)',
        color: 'var(--muted)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <span style={{ color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>
          -- {status.mode} --
        </span>
        {status.context && !isPhone && (
          <span style={{ color: 'var(--ink-2)' }}>{status.context}</span>
        )}
        {status.progress !== undefined && !isPhone && <ProgressGlyph value={status.progress} />}
      </span>
      <span
        style={{
          display: 'inline-flex',
          gap: 14,
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {status.hints?.map((hint) => (
          <span key={hint} style={{ color: 'var(--muted)' }}>
            {hint}
          </span>
        ))}
      </span>
    </footer>
  )
}

// ── Eighth-block progress bar ─────────────────────────────────────
//
// Renders a 0–1 progress value as a 10-cell eighth-block string,
// where each cell can be filled to one of 9 levels (empty,
// 1/8, 2/8, …, 8/8 = full). This gives 1/8th sub-character
// resolution in pure text — same trick ledger.cli uses, and it
// makes the status line feel "real" rather than ornamental.

const BLOCKS = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'] as const
const TOTAL_CELLS = 10

function ProgressGlyph({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value))
  const totalEighths = clamped * TOTAL_CELLS * 8
  const filledCells = Math.floor(totalEighths / 8)
  const partialEighths = Math.round(totalEighths - filledCells * 8)
  const cells: string[] = []
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (i < filledCells) cells.push(BLOCKS[8])
    else if (i === filledCells) cells.push(BLOCKS[partialEighths])
    else cells.push(BLOCKS[0])
  }
  return (
    <span
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Övningens framsteg"
      style={{
        color: 'var(--ink)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: 0,
      }}
    >
      {cells.join('')}
    </span>
  )
}
