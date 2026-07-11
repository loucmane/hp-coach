// Mobile chrome — safe-area padding + (optional) bottom tabs.
// Ported from the design prototype's <Phone /> wrapper + <BottomTabs />.
// Encapsulates the artboard scaffolding so screen components only own the
// content area and don't re-implement the iOS shell.
//
// Phase A responsive: when the viewport is reader/studio (≥768px), the
// iOS-specific decorative chrome (status bar showing 09:41, home
// indicator pill) is hidden — they don't make sense at tablet/desktop
// where the device IS the desktop, not a previewed phone.
//
// Phase A.5 wide-canvas update: the BottomTabs nav bar used to be
// absolute-positioned to the bottom of the (then-fixed-height) artboard.
// With A.5's content-driven canvas, the artboard no longer has a
// reliable bottom anchor. At reader/studio we render the tabs as a
// `position: fixed` floating pill centered at the bottom of the
// viewport. Phase B replaces this with a proper top nav.

import type { CSSProperties, ReactNode } from 'react'

import { useViewport } from '@/hooks/useViewport'
import { DOORS, type TabKey } from '@/lib/nav'

export type { TabKey }

// ── Bottom tabs — B2 "löpande foten" (running footer) ────────────────
//
// Owner-picked nav redesign (2026-07-11): the phone bar is text-only —
// five small-caps serif words under a hairline rule, the SAME five doors
// as the desktop rail (DOORS is the shared source). No icons: five short
// Swedish words distinguish faster than five abstract glyphs at 10px,
// and the bar finally speaks the same language as every surface above
// it. "Feedback" left the bar (its dogfood exporter lives under /mer ·
// Verktyg). Active door = accent label (the accent-active law); the one
// due-count numeral rides Öva's word. No bokmärke ribbon anywhere.

function BottomTabs({
  active = 'home',
  onChange,
  ovaDueCount,
}: {
  active?: TabKey
  onChange?: (id: TabKey) => void
  /** Öva's spaced-repetition queue size, shown as the one accent numeral
   *  on the bar. Threaded from routes that already load it (Home); omit
   *  elsewhere — a missing count simply shows no numeral (never a fake
   *  zero). */
  ovaDueCount?: number
}) {
  return (
    <div
      data-testid="bottom-tabs"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 26,
        background: 'var(--panel)',
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '13px 22px 6px',
        }}
      >
        {DOORS.map(({ id, label }) => {
          const on = active === id
          const count = id === 'ova' && ovaDueCount && ovaDueCount > 0 ? ovaDueCount : null
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange?.(id)}
              aria-current={on ? 'page' : undefined}
              style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px 6px',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontVariant: 'all-small-caps',
                letterSpacing: '0.07em',
                fontWeight: on ? 600 : 500,
                // Accent-active law: the active door is the ONE place
                // accent touches a nav label. Inactive stays muted.
                color: on ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {label}
              {count != null && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -8,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8.5,
                    color: 'var(--accent)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Frame ────────────────────────────────────────────────────────────
type MobileFrameProps = {
  children: ReactNode
  /** Render the navigation chrome; pass false for full-bleed flows
   *  (onboarding, drill). On phone this becomes BottomTabs; on
   *  reader/studio this becomes a top DesktopNav. */
  tabs?: boolean
  activeTab?: TabKey
  onTabChange?: (id: TabKey) => void
  /** Streak count to display in the desktop nav's trailing slot.
   *  Ignored on phone (the artboard tab bar has no streak slot —
   *  the home screen renders its own streak badge instead). */
  streakDays?: number
  /** Avancerat link in the desktop nav's trailing slot (only when
   *  streakDays is 0/undefined — they're mutually exclusive). */
  onAvancerat?: () => void
  /** Test-only — override viewport detection so the wrapping screen
   *  and MobileFrame agree on which nav chrome to render. Production
   *  callers omit this and rely on useViewport(). */
  forceLayout?: 'phone' | 'reader' | 'studio'
  /** Öva's spaced-repetition queue size — the one accent numeral on the
   *  phone bar (see BottomTabs). Omit where unavailable. */
  ovaDueCount?: number
  style?: CSSProperties
}

export function MobileFrame({
  children,
  tabs = true,
  activeTab = 'home',
  onTabChange,
  streakDays: _streakDays, // Phase A.8 unused (Page handles status-line streak)
  onAvancerat: _onAvancerat, // Phase A.8 unused (status-line + screen own this)
  forceLayout,
  ovaDueCount,
  style,
}: MobileFrameProps) {
  // Phase A.7 — viewport drives nav chrome AND iOS decorations:
  //   phone:           iOS chrome + BottomTabs (anchored in artboard)
  //   reader/studio:   DesktopNav at top, no iOS chrome, no
  //                    floating bottom pill (the Phase A.5 pill
  //                    was the wrong UX language at desktop)
  const detectedViewport = useViewport()
  const viewport = forceLayout ?? detectedViewport
  const isPhone = viewport === 'phone'
  const showIosChrome = isPhone
  return (
    <div
      style={{
        width: '100%',
        // Phone: explicit 100% (artboard owns its own height).
        // Reader/Studio: flex grow as a child of Frame's canvas, so
        // long children (AuthLayout's two-pane row) can vertically
        // fill the available space and center their content inside it.
        ...(isPhone ? { height: '100%' } : { flex: 1 }),
        background: 'var(--bg)',
        position: 'relative',
        overflow: isPhone ? 'hidden' : 'visible',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* Real devices own their status bar — the decorative 09:41 bar
       * (a prototype-era artboard prop) is gone. What remains is honest
       * safe-area padding so an installed PWA doesn't slide content
       * under the actual status bar; in a normal browser tab the inset
       * is 0 and this renders nothing. */}
      {showIosChrome && (
        <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)', flexShrink: 0 }} />
      )}
      {/* Phase A.8 — DesktopNav removed; the <Page> shell each screen
       *  wraps in provides the editorial running-head + status-line
       *  chrome at reader/studio. Phone keeps its bottom-tab nav
       *  (touch needs a visible nav target).
       *
       * a11y: rendered as <main> only on phone (isPhone) — at
       * reader/studio, <Page>'s RailShell already owns the <main>
       * landmark (see NavRail.tsx's page-content div) since <Page> is a
       * passthrough on phone and MobileFrame nests it. Two <main>s in
       * the same document would themselves be a landmark violation, so
       * this element is one or the other, never both. */}
      {(() => {
        const Content = isPhone ? 'main' : 'div'
        return (
          <Content
            style={{
              flex: 1,
              position: 'relative',
              // Phone: vertical scroll so content taller than the artboard
              // (Home with 3 traps + a 4-item plan; Lektion with all 25
              // entries; Drill miss-list with 10+ rows) reaches its end
              // instead of clipping under the floating tab bar. The
              // children pad their own bottom by var(--frame-tabbar) so
              // the last row clears the BottomTabs strip.
              overflowY: isPhone ? 'auto' : 'visible',
              overflowX: isPhone ? 'hidden' : 'visible',
              ...(isPhone ? {} : { display: 'flex', flexDirection: 'column' }),
            }}
          >
            {children}
          </Content>
        )
      })()}
      {tabs && isPhone && (
        <BottomTabs active={activeTab} onChange={onTabChange} ovaDueCount={ovaDueCount} />
      )}
      {showIosChrome && (
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', flexShrink: 0 }} />
      )}
    </div>
  )
}
