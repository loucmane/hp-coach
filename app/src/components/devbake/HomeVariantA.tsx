// HomeVariantA — Current Home composition (control).
//
// Faithful snapshot of what /  renders today, served fixture data so
// the bake-off comparison is apples-to-apples against HomeVariantB.
// Mirrors HomeMobile.tsx lines 160–331 (header band + ProgressSigil
// + TopTraps + greeting + score line + DailyPlanCard) but stripped of
// the screen's store wiring, tabs, MobileFrame, and Page chrome —
// those wrap the whole bake-off in a single shared frame.
//
// The point of this variant is "here's what the user sees today".
// Edits here should track HomeMobile, not innovate.

import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import { ProgressSigil } from '@/components/home/ProgressSigil'
import { TopTrapsCard } from '@/components/home/TopTrapsCard'
import { Mono } from '@/components/primitives'
import { Display } from '@/components/Typography'

import { FIXTURE_PLAN, FIXTURE_TOP_TRAPS } from './homeBakeoffFixtures'

// StreakBadge is defined inline in HomeMobile.tsx — duplicate the
// markup here so the bake-off is portable without exporting it.
function StreakBadge({ value }: { value: number }) {
  return (
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
      {value} {value === 1 ? 'dag' : 'dagar'}
    </div>
  )
}

export function HomeVariantA() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--ink)',
        minHeight: 720,
      }}
    >
      <header
        style={{
          padding: '20px 28px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <Mono>Onsdag · 27 maj</Mono>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--muted)',
              marginTop: 4,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            151 dagar kvar · höstprov 26
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              color: 'var(--muted)',
              marginTop: 2,
              textTransform: 'uppercase',
            }}
          >
            Mittfas · stadig rytm
          </div>
        </div>
        <StreakBadge value={2} />
      </header>

      <div style={{ padding: '0 28px' }}>
        <ProgressSigil plan={FIXTURE_PLAN} todayLabel="27 maj" />
      </div>

      <div
        style={{
          flex: 1,
          padding: '40px 28px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        <Display level={2} as="h1">
          God eftermiddag.
        </Display>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--ink-2)',
            letterSpacing: '0.06em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          just nu · <span style={{ color: 'var(--ink)' }}>0.64 / 2.0</span> · verbal 0.79 · kvant
          0.49
        </div>

        <TopTrapsCard traps={FIXTURE_TOP_TRAPS} />

        <DailyPlanCard plan={FIXTURE_PLAN} allComplete={false} />
      </div>
    </div>
  )
}
