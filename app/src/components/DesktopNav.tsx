// DesktopNav — Phase A.7 top nav band for reader / studio.
//
// Replaces Phase A.5's floating BottomTabs pill at desktop. A pill at
// the bottom of a 1440p screen is the wrong UX language — it's a
// phone metaphor masquerading as desktop chrome. Top nav is the right
// answer: it anchors the page, sets the brand language, and doesn't
// collide with content.
//
// Composition:
//
//   ⌜ HP-COACH      Hem · Övning · Coach · Framsteg          STRECK 5d ↘
//   ──────────────────────────────────────────────────────────────────
//
//   - Left:   <BrandMark>
//   - Center: tab links, ink underline on the active one
//   - Right: optional utility — streak chip OR Avancerat link, never
//     both. Mutually exclusive avoids competing for attention.
//
// A single 1px --hairline rule sits below the band, articulating it
// as the page header. The band is `position: sticky, top: 0` so it
// stays visible when the canvas scrolls.
//
// Pure text nav — no icons. Desktop is comfortable with text-only
// navigation; the icons in the BottomTabs phone version aren't
// appropriate at this density.

import type { TabKey } from '@/components/MobileFrame'

import { BrandMark } from './BrandMark'

// NOTE: DesktopNav is no longer mounted (Phase A.8 replaced it with the
// Page shell / NavRail). Kept compiling against the shared door ids so a
// future desktop-band experiment stays type-honest.
const TABS: ReadonlyArray<{ id: TabKey; label: string }> = [
  { id: 'home', label: 'Hem' },
  { id: 'ova', label: 'Öva' },
  { id: 'provpass', label: 'Provpass' },
  { id: 'uppslag', label: 'Uppslag' },
  { id: 'framsteg', label: 'Framsteg' },
]

type Props = {
  /** Which tab to mark as active (ink underline). */
  active?: TabKey
  /** Fired when a tab link is clicked. */
  onTabChange?: (id: TabKey) => void
  /** Trailing utility — exactly one of `streakDays` or
   *  `avanceratLabel` should be set, never both. */
  streakDays?: number
  avanceratLabel?: string
  onAvancerat?: () => void
}

export function DesktopNav({
  active,
  onTabChange,
  streakDays,
  avanceratLabel = 'Avancerat',
  onAvancerat,
}: Props) {
  const hasStreak = streakDays !== undefined && streakDays > 0
  return (
    <nav
      data-testid="desktop-nav"
      aria-label="Huvudnavigering"
      style={{
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'color-mix(in oklch, var(--bg) 92%, transparent)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--canvas-max-w)',
          margin: '0 auto',
          padding: '0 var(--gutter-lg)',
          height: 64,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 'clamp(16px, 2vw, 32px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BrandMark />
        </div>

        <ul
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(20px, 2vw, 36px)',
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {TABS.map((tab) => {
            const isActive = tab.id === active
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => onTabChange?.(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  data-testid={`desktop-nav-${tab.id}`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 0 6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    letterSpacing: 'var(--font-mono-track)',
                    textTransform: 'uppercase',
                    color: isActive ? 'var(--ink)' : 'var(--muted)',
                    cursor: 'pointer',
                    position: 'relative',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 1,
                        background: 'var(--ink)',
                      }}
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {hasStreak ? (
            <span
              data-testid="desktop-nav-streak"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: 'var(--font-mono-track)',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Streck {streakDays}
              {streakDays === 1 ? ' dag' : ' dagar'}
            </span>
          ) : (
            <button
              type="button"
              onClick={onAvancerat}
              data-testid="desktop-nav-avancerat"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: 'var(--font-mono-track)',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {avanceratLabel} <span aria-hidden>↘</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
