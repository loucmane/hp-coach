// Frame — Phase A.5 wide-canvas shell.
//
// Replaces Phase A's 640px artboard-on-desktop with a content-sized
// canvas at reader / studio. Three modes picked by viewport:
//
//   phone   (<768px)   → full-bleed; child rendered at 100×100%
//                        (no surrounding chrome — the device IS the
//                        artboard). Unchanged from Phase A.
//
//   reader  (768–1279) → centered card, max-width var(--canvas-max-w-reader)
//                        (960px). NO min-height — content drives the
//                        canvas height, so screens that don't fill 844px
//                        (auth, idle states) don't strand their content
//                        at the top of a tall empty card. Subtle border
//                        + shadow preserve the editorial card aesthetic.
//
//   studio  (≥1280)    → no card. Canvas is a centered region with
//                        max-width var(--canvas-max-w) — min(1440px,
//                        calc(100vw - 96px)). No shadow, no border, no
//                        min-height. The --panel-2 background gives
//                        the canvas its own visual zone, but the look is
//                        "wide page" not "phone shrunken into a desktop".
//                        Screens use container queries inside this
//                        canvas to render multi-column layouts (see
//                        StudyDesk, HomeMobile dashboard).
//
// The leftRail / rightRail props remain on the type for API
// compatibility but are no longer rendered. The Study Desk pattern
// delivers multi-column content *inside* the canvas via Sidebar /
// Switcher / container queries instead. Removing the rails altogether
// would break existing call-sites; keeping them as a no-op is the
// cheapest migration path.

import type { ReactNode } from 'react'

import { useViewport } from '@/hooks/useViewport'

type FrameProps = {
  children: ReactNode
  /** @deprecated (Phase A.5) — rails are no longer rendered. The Study
   *  Desk layout uses in-canvas multi-column composition instead. The
   *  prop is kept so existing callers don't break. */
  leftRail?: ReactNode
  /** @deprecated (Phase A.5) — see leftRail. */
  rightRail?: ReactNode
}

export function Frame({ children }: FrameProps) {
  const viewport = useViewport()

  if (viewport === 'phone') {
    // Phone is the canonical artboard. CSS class .hpc-frame-phone sets
    // `height: 100vh; height: 100dvh;` so iOS Safari's collapsing URL
    // bar doesn't pull content up (modern browsers use dvh; older
    // browsers fall back to vh).
    return <div className="hpc-frame hpc-frame-phone">{children}</div>
  }

  const isStudio = viewport === 'studio'
  const maxWidth = isStudio ? 'var(--canvas-max-w)' : 'var(--canvas-max-w-reader)'

  // Reader keeps the card aesthetic (border + shadow) at a wider 960px
  // canvas. Studio drops the card and renders a wide page-region.
  // Both share the centered layout + --panel-2 backdrop.
  return (
    <div
      className={`hpc-frame ${isStudio ? 'hpc-frame-studio' : 'hpc-frame-reader'}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(16px, 3vh, 48px) var(--gutter-lg)',
        background: 'var(--panel-2)',
      }}
    >
      <div
        className="hpc-frame-canvas"
        style={{
          width: '100%',
          maxWidth,
          background: 'var(--bg)',
          // Reader keeps the card chrome; studio strips it. Both
          // share content-driven height (no min-height) — that's the
          // Phase A.5 fix for the off-center auth bug.
          borderRadius: isStudio ? 0 : 'calc(var(--radius) * 1.6)',
          border: isStudio ? 'none' : '1px solid var(--hairline)',
          boxShadow: isStudio ? 'none' : '0 30px 60px -20px rgba(0,0,0,0.18)',
          position: 'relative',
          // Allow internal scrolling at the screen level; the canvas
          // itself flexes to its content.
        }}
      >
        {children}
      </div>
    </div>
  )
}
