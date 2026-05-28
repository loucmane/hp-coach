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

import { Link, useLocation } from '@tanstack/react-router'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'

import { BrandMark } from '@/components/BrandMark'
import { EditionStrip } from '@/components/EditionStrip'
import { useViewport } from '@/hooks/useViewport'

// Apple-style "headroom" pattern — hide the running-head nav on
// scroll-down (reader wants the page), reveal on scroll-up (reader
// wants to navigate). Threshold: only hide once you're more than
// 96px past the top, so quick taps near the masthead don't trigger.
function useHeadroom(disabled: boolean): boolean {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const ticking = useRef(false)
  useEffect(() => {
    if (disabled) {
      setHidden(false)
      return
    }
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY.current
        if (y < 96) setHidden(false)
        else if (delta > 4) setHidden(true)
        else if (delta < -4) setHidden(false)
        lastY.current = y
        ticking.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [disabled])
  return hidden
}

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

  // Desktop chrome lives in its own component so the router + sitting
  // hooks only mount when we actually need them. Test renders pin
  // innerWidth to phone width → early return above → the router-
  // requiring hooks never run, so screen tests don't need a router
  // provider.
  return (
    <PageDesktop runningHead={runningHead} folio={folio} status={status} style={style}>
      {children}
    </PageDesktop>
  )
}

function PageDesktop({ runningHead, folio, status, children, style }: Props) {
  // Strip the "HP · Coach" prefix every caller passes — we render the
  // brand via the BrandMark component now, with the ⌜ corner-bracket
  // signature. Whatever remains (the page-name token, e.g. "Hem" /
  // "Lektion · KVA") becomes the inline section label rendered to the
  // right of the wordmark.
  const rawText = Array.isArray(runningHead) ? runningHead.join(' · ') : runningHead
  const headText = rawText.replace(/^HP\s*·\s*Coach\s*·?\s*/i, '').trim()

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
      <RunningHeadBand runningHead={headText} folio={null} isPhone={false} />
      <div
        data-testid="page-content"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          // Reserve ~48px at the bottom so the sticky StatusLine
          // doesn't visually overlap the last row of content as the
          // user scrolls down. The footer is sticky-bottom and lives
          // in the same flex column as page-content, so without this
          // padding it floats over (frosted but still occluding) the
          // last list row — visible on /progress where the SEKTIONER
          // table ran into the floating `-- FRAMSTEG --` bar
          // (dogfood B8).
          paddingBottom: 48,
        }}
      >
        {children}
      </div>
      <StatusLine status={status} folio={folio} isPhone={false} />
    </div>
  )
}

// ── Running head + folio ──────────────────────────────────────────

// Top-level routes that surface in the inline running-head nav. Mirrors
// the bottom tab bar at phone (Hem · Övning · Lektion · Coach · Framsteg)
// but rendered as an editorial masthead row instead of a tab pill —
// magazine masthead language, not SaaS chrome.
const NAV_LINKS = [
  { to: '/', label: 'Hem' },
  { to: '/drill', label: 'Övning' },
  { to: '/lektion', label: 'Lektion' },
  // /coach is the dogfood feedback exporter, not coaching. The product
  // is named HP-Coach, so a tab labeled "Coach" pointing to a feedback
  // tool was self-contradictory (audit rec #5). Route + TabKey stay
  // 'coach' to avoid churning testids.
  { to: '/coach', label: 'Feedback' },
  { to: '/progress', label: 'Framsteg' },
] as const

export function NavLinks() {
  const location = useLocation()
  const pathname = location.pathname
  // Active route = exact path match for '/', prefix match otherwise so
  // /lektion?section=NOG keeps '• Lektion' lit.
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))
  return (
    <nav
      data-testid="page-nav"
      aria-label="Sektioner"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 'clamp(14px, 1.5vw, 22px)',
        paddingBottom: 14,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {NAV_LINKS.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          aria-current={isActive(to) ? 'page' : undefined}
          className="hpc-nav-link"
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

function RunningHeadBand({
  runningHead,
  folio: _folio,
  isPhone,
}: {
  runningHead: string
  /** Deprecated — was the spread numbering string. Kept on the type
   *  for now so callers don't need to change. */
  folio: string | null
  isPhone: boolean
}) {
  const hidden = useHeadroom(isPhone)
  return (
    <header
      style={{
        // Headroom: nav hides on scroll-down, reveals on scroll-up
        // (Apple-style). Phone gets no headroom — its iOS chrome owns
        // the top edge and disappearing chrome would feel wrong inside
        // an artboard. Negative translate goes ABOVE the viewport top
        // so the hairline rule below also slides away.
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        // Sticky-top mirror of the sticky status line at the bottom.
        // Together they form the editorial "chrome envelope":
        //   ┌───── running head (frosted) ─────┐
        //   │     content scrolls in middle    │
        //   └───── status line (frosted) ──────┘
        // Without this, scrolling lifts the question column UP from
        // its natural position (running-head + grid padding ≈ 96px)
        // toward the sticky top (32px) — visible as "the left column
        // moves a little". Pinning the running head removes that
        // gap; the question now lands exactly under the chrome and
        // stays there.
        position: isPhone ? 'static' : 'sticky',
        top: 0,
        zIndex: 10,
        padding: isPhone
          ? '12px var(--pad-lg) 10px'
          : 'clamp(20px, 2vh, 32px) clamp(28px, 4vw, 64px) 0',
        borderBottom: '1px solid var(--hairline)',
        // Frosted glass — pedagogy text blurs through as it scrolls
        // underneath, matching the bottom status line's treatment.
        background: isPhone ? 'transparent' : 'color-mix(in oklch, var(--bg) 88%, transparent)',
        backdropFilter: isPhone ? undefined : 'saturate(140%) blur(10px)',
        WebkitBackdropFilter: isPhone ? undefined : 'saturate(140%) blur(10px)',
        // Downward shadow — mirrors the status line's upward shadow.
        // Articulates the chrome as a layer above the scrolling body.
        boxShadow: isPhone ? undefined : '0 8px 24px -16px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 'clamp(20px, 3vw, 48px)',
        // Wrap when the row gets tight — running head + 5 nav links
        // + the EditionStrip collide around 1300px on studio-width
        // tabs, with the strip visually bleeding into Feedback/Framsteg.
        // Wrapping lets EditionStrip drop to its own line; the header
        // grows ~28px taller at that breakpoint instead of overlapping.
        flexWrap: 'wrap',
        rowGap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'clamp(20px, 3vw, 40px)',
          minWidth: 0,
          // Let the left group claim the whole row when EditionStrip
          // has wrapped underneath — keeps the brand+nav anchored left
          // instead of compressing into the corner.
          flex: '1 1 auto',
        }}
      >
        {/* Editorial brand wordmark: `⌜ HP-Coach` in display type with
         *  the corner-bracket signature. Replaces the previous text
         *  prefix `HP · COACH ·` that ran ahead of each page name —
         *  the brand now reads as a designed mark on every signed-in
         *  surface, mirroring what AuthLayout shows on the sign-in /
         *  sign-up screens. Surfaces dogfood-finding "BrandMark hidden
         *  post-login" (synthesis Tier 1 #3). */}
        <BrandMark style={{ paddingBottom: isPhone ? 8 : 14 }} />
        {runningHead && (
          <span
            data-testid="running-head"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: isPhone ? 12 : 13,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-2)',
              paddingBottom: isPhone ? 8 : 14,
              whiteSpace: 'nowrap',
            }}
          >
            · {runningHead}
          </span>
        )}
        {/* Editorial inline nav — visible signposts to top-level routes.
         *  Phase B nav addition. Phone keeps its bottom tab bar; desktop
         *  gets the magazine masthead pattern instead. */}
        {!isPhone && <NavLinks />}
      </div>
      {/* Phase A.6V Edition Strip — picker for mode + palette + edition.
       *  Replaces the old Folio in the running head; folio moves down to
       *  the status line where page-count metadata fits the vim-mode
       *  bar register. paddingBottom: 14 to align with the wordmark's
       *  matching paddingBottom so the band's hairline reads cleanly
       *  below both. Variants with tighter chrome render the strip
       *  with paddingBottom: 0 (the default). See docs/edition-strip.md. */}
      {!isPhone && <EditionStrip paddingBottom={14} />}
    </header>
  )
}

// Phase A.6V — the editorial Folio component used to live here and
// render in the top-right of the running head with a hairline-under-
// digits signature. It moved INTO the StatusLine below as a compact
// inline `pp. X / Y` so the running head could host the EditionStrip
// picker. The under-rule signature now belongs to the picker's
// active-word indicator (mirrors the same trick on a different
// typographic surface).

// ── Status line ───────────────────────────────────────────────────

function StatusLine({
  status,
  folio,
  isPhone,
}: {
  status: StatusLineProps
  folio?: FolioLite
  isPhone: boolean
}) {
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
        {/* Folio relocated here from the running head (Phase A.6V).
         *  Page-count metadata fits the vim-mode register better than
         *  the chrome up top, and the running head is now the picker's
         *  domain. Compact inline form — no under-rule — since the
         *  status line already establishes a single typographic
         *  baseline for everything in it. */}
        {folio && !isPhone && (
          <span data-testid="folio" style={{ color: 'var(--muted)' }}>
            pp. {folio.current} / {folio.total}
          </span>
        )}
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
