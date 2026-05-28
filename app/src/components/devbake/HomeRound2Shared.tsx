// Shared left-column composition for Home round-2 bake-off variants.
//
// Re-renders the shipped Variant B layout (kicker → greeting → score
// → plan card → 240px hairline → demoted traps) so each round-2
// variant can pair it with a different right-column treatment without
// duplicating the left composition four times. The outer border lives
// on the variant container itself, not here.

import type { TopTrap } from '@/api/hooks/useTopTraps'
import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import { Eyebrow, Mono } from '@/components/primitives'
import { Display } from '@/components/Typography'

import { FIXTURE_PLAN, FIXTURE_TOP_TRAPS } from './homeBakeoffFixtures'

export function BLeftColumn() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 720 }}>
      <header style={{ padding: '24px 28px 0' }}>
        <Mono>Torsdag 28 maj · 150 dagar · höstprov 26</Mono>
      </header>

      <div
        style={{
          flex: 1,
          padding: '0 28px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ height: 'clamp(40px, 6vh, 72px)' }} />

        <Display level={2} as="h1" style={{ maxWidth: '24ch', lineHeight: 1.02 }}>
          God dag,
          <br />
          Loucmane.
        </Display>

        <div style={{ height: 24 }} />

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--ink-2)',
            letterSpacing: '0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span style={{ color: 'var(--ink)' }}>0.64</span>
          <span style={{ color: 'var(--muted)' }}> / 2.0</span>
          <span style={{ margin: '0 14px', color: 'var(--muted)' }}>·</span>
          verbal <span style={{ color: 'var(--ink)' }}>0.79</span>
          <span style={{ margin: '0 14px', color: 'var(--muted)' }}>·</span>
          kvant <span style={{ color: 'var(--ink)' }}>0.49</span>
        </div>

        <div style={{ height: 'clamp(40px, 5vh, 64px)' }} />

        <DailyPlanCard plan={FIXTURE_PLAN} allComplete={false} />

        <div style={{ height: 'clamp(48px, 6vh, 80px)' }} />

        <div
          style={{
            width: 240,
            height: 1,
            background: 'var(--ink-2)',
            opacity: 0.5,
            marginBottom: 24,
          }}
        />
        <QuietTraps traps={FIXTURE_TOP_TRAPS} />

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

function QuietTraps({ traps }: { traps: TopTrap[] }) {
  if (traps.length === 0) return null
  return (
    <section>
      <Eyebrow>Återkommande fällor</Eyebrow>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '14px 0 0 0',
        }}
      >
        {traps.map((trap, i) => (
          <li
            key={trap.framework_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 56px',
              gap: 16,
              alignItems: 'baseline',
              padding: '12px 0',
              borderTop: i === 0 ? '1px solid var(--hairline)' : 'none',
              borderBottom: '1px solid var(--hairline)',
            }}
          >
            <Mono>{trap.framework_id}</Mono>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                lineHeight: 1.4,
                color: 'var(--ink-2)',
              }}
            >
              {trap.headline ?? '—'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-2)',
                letterSpacing: '0.06em',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {trap.count} ggr
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
