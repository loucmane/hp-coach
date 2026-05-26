// Home Sigil Variant A — current StreakBadge (control).
//
// The production today: a small mono badge top-right of the Home
// header. Matches the StreakBadge composition inside HomeMobile.tsx
// (lines 298–315 at time of writing — kept inline here to avoid
// importing a non-exported helper).

import { Mono } from '@/components/primitives'
import { FIXTURE_PLAN } from '@/lib/devbakeFixtures'

const STREAK_DAYS = 14

export function HomeSigilA() {
  const completed = FIXTURE_PLAN.items.filter((i) => i.completed).length
  return (
    <HomeHeroPreview>
      <div
        style={{
          padding: '4px 8px',
          border: '1px solid var(--hairline)',
          borderRadius: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--ink-2)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {STREAK_DAYS} dagar
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {completed} / {FIXTURE_PLAN.items.length} klart · finns inte i UI
      </div>
    </HomeHeroPreview>
  )
}

// Shared mini Home-header preview shell. Renders the same chrome as
// HomeMobile.tsx's header — date / day-count / phase / greeting — so
// the three sigil variants can be compared at production fidelity.
// Exported for the other two HomeSigil variants.
export function HomeHeroPreview({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius)',
        padding: 'clamp(16px, 1.2vw + 12px, 24px)',
        minHeight: 280,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Mono>Tisdag · 26 maj</Mono>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--muted)',
              marginTop: 4,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            152 dagar kvar · höstprov 26
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginTop: 2,
            }}
          >
            mittfas · stadig rytm
          </div>
        </div>
        {/* Top-right slot — variant-specific indicator goes here */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {children}
        </div>
      </div>
      <h1
        style={{
          marginTop: 'clamp(24px, 3vh, 36px)',
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 'clamp(28px, 2vw + 16px, 40px)',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
        }}
      >
        God eftermiddag, Loucmane.
      </h1>
    </div>
  )
}
