// Mobile chrome — iOS status bar + home indicator + (optional) bottom tabs.
// Ported from the design prototype's <Phone /> wrapper + <BottomTabs />.
// Encapsulates the artboard scaffolding so screen components only own the
// content area and don't re-implement the iOS shell.

import type { CSSProperties, ReactNode } from 'react'

import { Chart, Home, Pencil, User } from './icons'

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
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
          <rect x="0" y="7" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
        </svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" aria-hidden>
          <path d="M7.5 11l2.2-2.7a3 3 0 00-4.4 0L7.5 11zM3 6.4a7 7 0 019 0l1.5-1.6a9 9 0 00-12 0L3 6.4zM.5 3.4a11 11 0 0114 0L15.7 2A13 13 0 00-.7 2L.5 3.4z" />
        </svg>
        {/* battery */}
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden>
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="11"
            rx="3"
            stroke="currentColor"
            opacity="0.5"
          />
          <rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor" />
          <rect
            x="23.5"
            y="3.5"
            width="2"
            height="5"
            rx="1"
            fill="currentColor"
            opacity="0.5"
          />
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
export type TabKey = 'home' | 'drill' | 'coach' | 'progress'

const TABS: ReadonlyArray<{
  id: TabKey
  label: string
  Icon: (p: { s?: number }) => ReactNode
}> = [
  { id: 'home', label: 'Hem', Icon: Home },
  { id: 'drill', label: 'Övning', Icon: Pencil },
  { id: 'coach', label: 'Coach', Icon: User },
  { id: 'progress', label: 'Framsteg', Icon: Chart },
]

function BottomTabs({
  active = 'home',
  onChange,
}: {
  active?: TabKey
  onChange?: (id: TabKey) => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 28,
        background: 'var(--panel)',
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 4px' }}>
        {TABS.map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button
              key={id}
              onClick={() => onChange?.(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 12px',
                color: on ? 'var(--ink)' : 'var(--muted-2)',
                fontFamily: 'inherit',
              }}
            >
              <Icon s={20} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
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
  /** Render the bottom tab bar; pass false for full-bleed flows (onboarding, drill). */
  tabs?: boolean
  activeTab?: TabKey
  onTabChange?: (id: TabKey) => void
  style?: CSSProperties
}

export function MobileFrame({
  children,
  tabs = true,
  activeTab = 'home',
  onTabChange,
  style,
}: MobileFrameProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <StatusBar />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
      {tabs && <BottomTabs active={activeTab} onChange={onTabChange} />}
      <HomeIndicator />
    </div>
  )
}
