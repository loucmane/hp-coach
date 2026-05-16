// Mobile chrome — iOS status bar + home indicator + (optional) bottom tabs.
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

import { Book, Chart, Home, Pencil, User } from './icons'

// ── Status bar (iOS-style: time left, signal/wifi/battery right) ─────
function StatusBar({ time = '09:41' }: { time?: string }) {
  return (
    <div
      style={{
        height: 44,
        padding: '0 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink)',
        flexShrink: 0,
      }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.85 }}>
        <svg
          width="17"
          height="11"
          viewBox="0 0 17 11"
          fill="currentColor"
          role="img"
          aria-label="Signal"
        >
          <title>Signal</title>
          <rect x="0" y="7" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
        </svg>
        <svg
          width="15"
          height="11"
          viewBox="0 0 15 11"
          fill="currentColor"
          role="img"
          aria-label="Wi-Fi"
        >
          <title>Wi-Fi</title>
          <path d="M7.5 11l2.2-2.7a3 3 0 00-4.4 0L7.5 11zM3 6.4a7 7 0 019 0l1.5-1.6a9 9 0 00-12 0L3 6.4zM.5 3.4a11 11 0 0114 0L15.7 2A13 13 0 00-.7 2L.5 3.4z" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none" role="img" aria-label="Batteri">
          <title>Batteri</title>
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" opacity="0.5" />
          <rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor" />
          <rect x="23.5" y="3.5" width="2" height="5" rx="1" fill="currentColor" opacity="0.5" />
        </svg>
      </div>
    </div>
  )
}

// ── Home indicator (iOS pill) ────────────────────────────────────────
function HomeIndicator() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 134,
          height: 5,
          background: 'var(--ink)',
          borderRadius: 3,
          opacity: 0.85,
        }}
      />
    </div>
  )
}

// ── Bottom tabs ──────────────────────────────────────────────────────
export type TabKey = 'home' | 'drill' | 'lektion' | 'coach' | 'progress'

const TABS: ReadonlyArray<{
  id: TabKey
  label: string
  Icon: (p: { s?: number }) => ReactNode
}> = [
  { id: 'home', label: 'Hem', Icon: Home },
  { id: 'drill', label: 'Övning', Icon: Pencil },
  { id: 'lektion', label: 'Lektion', Icon: Book },
  { id: 'coach', label: 'Coach', Icon: User },
  { id: 'progress', label: 'Framsteg', Icon: Chart },
]

function BottomTabs({
  active = 'home',
  onChange,
  floating = false,
}: {
  active?: TabKey
  onChange?: (id: TabKey) => void
  /** When true (reader/studio), render as a viewport-anchored floating
   *  pill. When false (phone), render absolute-bottom inside the
   *  device artboard. */
  floating?: boolean
}) {
  const positionStyle: CSSProperties = floating
    ? {
        position: 'fixed',
        bottom: 'clamp(16px, 2vh, 32px)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--panel)',
        border: '1px solid var(--hairline)',
        borderRadius: 999,
        boxShadow: '0 10px 30px -8px rgba(0,0,0,0.25)',
        zIndex: 30,
      }
    : {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 28,
        background: 'var(--panel)',
        borderTop: '1px solid var(--hairline)',
      }
  return (
    <div style={positionStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: floating ? 'center' : 'space-around',
          gap: floating ? 4 : 0,
          padding: floating ? '6px 10px' : '8px 0 4px',
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange?.(id)}
              aria-current={on ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: floating ? 'row' : 'column',
                alignItems: 'center',
                gap: floating ? 6 : 4,
                background: on && floating ? 'var(--panel-2)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: floating ? '8px 14px' : '6px 12px',
                borderRadius: floating ? 999 : 0,
                color: on ? 'var(--ink)' : 'var(--muted-2)',
                fontFamily: 'inherit',
              }}
            >
              <Icon s={floating ? 16 : 20} />
              <span style={{ fontSize: floating ? 12 : 10, fontWeight: 500 }}>{label}</span>
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
      {showIosChrome && <StatusBar />}
      {/* Phase A.8 — DesktopNav removed; the <Page> shell each screen
       *  wraps in provides the editorial running-head + status-line
       *  chrome at reader/studio. Phone keeps its bottom-tab nav
       *  (touch needs a visible nav target). */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: isPhone ? 'hidden' : 'visible',
          ...(isPhone ? {} : { display: 'flex', flexDirection: 'column' }),
        }}
      >
        {children}
      </div>
      {tabs && isPhone && <BottomTabs active={activeTab} onChange={onTabChange} floating={false} />}
      {showIosChrome && <HomeIndicator />}
    </div>
  )
}
