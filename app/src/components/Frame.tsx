// Frame — phase A responsive shell orchestrator.
//
// Replaces the hard-coded 390×844 artboard in __root.tsx with a three-
// mode canvas that picks layout based on viewport:
//
//   phone   (<768px)   → full-bleed; child rendered at 100×100%
//                        (no surrounding chrome; the device IS the artboard)
//   reader  (768–1279) → centered card, max-width var(--frame-max-w)
//                        with surrounding background; iOS chrome inside
//                        MobileFrame quietly hides itself (it's
//                        viewport-aware too)
//   studio  (≥1280)    → same centered card + optional left/right rails
//                        gated by uiStore.studioRails (default off, opt-in
//                        via Avancerat). Rails carry low-priority context
//                        (keyboard shortcuts hint, session progress).
//
// Why not just CSS media queries? — three reasons:
//   1. The studio rails carry React content (KeyboardHintsRail,
//      SessionProgressRail) — they're not just style swaps.
//   2. studioRails is a user preference, not a viewport fact. CSS can't
//      read from zustand.
//   3. SSR/hydration: we want the first paint at phone width to be
//      identical to the pre-Frame build (no surprise card chrome flash).
//
// MobileFrame.tsx (the iOS-chrome implementation) is unchanged in API
// — it just learns to hide status bar / home indicator at reader+.
// That keeps every existing `<MobileFrame tabs activeTab=...>` callsite
// working.

import type { ReactNode } from 'react'

import { useViewport } from '@/hooks/useViewport'
import { useUiStore } from '@/stores/uiStore'

type FrameProps = {
  children: ReactNode
  /**
   * Optional content for the left rail. Studio mode only; ignored
   * elsewhere. Default: nothing (rail is hidden even when studioRails
   * is on).
   */
  leftRail?: ReactNode
  /**
   * Optional content for the right rail. Studio mode only; same
   * default behavior as leftRail.
   */
  rightRail?: ReactNode
}

export function Frame({ children, leftRail, rightRail }: FrameProps) {
  const viewport = useViewport()
  const studioRails = useUiStore((s) => s.studioRails)

  if (viewport === 'phone') {
    // The device is the artboard. No surrounding chrome — child fills
    // the viewport. The CSS class hpc-frame-phone sets `height: 100vh;
    // height: 100dvh;` so iOS Safari's collapsing URL bar doesn't pull
    // content up (modern browsers use dvh; older ones fall back to vh).
    return <div className="hpc-frame hpc-frame-phone">{children}</div>
  }

  // reader + studio share the centered-card baseline. Studio adds rails.
  const showRails = viewport === 'studio' && studioRails && (leftRail || rightRail)

  return (
    <div
      className={`hpc-frame ${viewport === 'studio' ? 'hpc-frame-studio' : 'hpc-frame-reader'}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 'var(--frame-rail-gap)',
        padding: 'clamp(16px, 3vh, 48px) clamp(16px, 4vw, 48px)',
        background: 'var(--panel-2)',
      }}
    >
      {showRails && leftRail && (
        <aside
          aria-label="Sidopanel"
          style={{
            width: 'var(--frame-rail-w)',
            flexShrink: 0,
            position: 'sticky',
            top: 'clamp(16px, 3vh, 48px)',
          }}
        >
          {leftRail}
        </aside>
      )}

      <div
        className="hpc-frame-card"
        style={{
          width: '100%',
          maxWidth: 'var(--frame-max-w)',
          minHeight: 'min(844px, calc(100vh - 64px))',
          maxHeight: 'calc(100vh - 64px)',
          background: 'var(--bg)',
          borderRadius: 'calc(var(--radius) * 1.6)',
          overflow: 'hidden',
          border: '1px solid var(--hairline)',
          boxShadow: '0 30px 60px -20px rgba(0,0,0,0.18)',
          position: 'relative',
          flexShrink: 1,
        }}
      >
        {children}
      </div>

      {showRails && rightRail && (
        <aside
          aria-label="Sidopanel"
          style={{
            width: 'var(--frame-rail-w)',
            flexShrink: 0,
            position: 'sticky',
            top: 'clamp(16px, 3vh, 48px)',
          }}
        >
          {rightRail}
        </aside>
      )}
    </div>
  )
}
