// HomeVariantB — Proposed Home composition.
//
// Implements the design agent's brief: kill the 8-line header band,
// promote the greeting to focal element, drop the ProgressSigil,
// demote TopTraps below the plan with reduced visual weight, and
// constrain the column to ~64ch.
//
// Differences from HomeVariantA:
//   - Header collapses to ONE mono line (date · days · sitting)
//   - examPhase line removed
//   - daysAway / diagnosticMemory blocks removed
//   - StreakBadge pill removed from this position (would move to
//     status line in real implementation)
//   - ProgressSigil removed entirely
//   - Greeting: comma + line break ("God eftermiddag,\nLoucmane.")
//     and stays Display 2
//   - Score line: drops the "just nu ·" prefix, numeric bumped to
//     `--ink` for contrast
//   - DailyPlanCard renders unchanged in role but in its new position
//     as the focal action surface
//   - TopTraps moves BELOW the plan with a hairline divider above,
//     no italic, no heavy left ink rule — a quiet diagnostic strip

import type { TopTrap } from '@/api/hooks/useTopTraps'
import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import { Eyebrow, Mono } from '@/components/primitives'
import { Display } from '@/components/Typography'

import { FIXTURE_PLAN, FIXTURE_TOP_TRAPS } from './homeBakeoffFixtures'

export function HomeVariantB() {
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
      {/* Single mono kicker. One line. */}
      <header style={{ padding: '24px 28px 0' }}>
        <Mono>Onsdag 27 maj · 151 dagar · höstprov 26</Mono>
      </header>

      <div
        style={{
          flex: 1,
          padding: '0 28px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* The big breath between kicker and headline. */}
        <div style={{ height: 'clamp(56px, 8vh, 96px)' }} />

        {/* Greeting on two lines, max-width 24ch so the line break
         *  reads as intended even at studio width. The line break
         *  is hand-placed via <br/> rather than relying on the
         *  natural wrap — composition over chance. */}
        <Display
          level={2}
          as="h1"
          style={{
            maxWidth: '24ch',
            lineHeight: 1.02,
          }}
        >
          God eftermiddag,
          <br />
          Loucmane.
        </Display>

        <div style={{ height: 24 }} />

        {/* Score line. No "just nu" prefix. Numeric in --ink. */}
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

        {/* Plan card — focal action surface. */}
        <DailyPlanCard plan={FIXTURE_PLAN} allComplete={false} />

        <div style={{ height: 'clamp(56px, 7vh, 88px)' }} />

        {/* Demoted traps. 240px ink-2 divider above; rows are quiet
         *  mono-id + ink headline + count. No italic, no heavy left rule. */}
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
          display: 'flex',
          flexDirection: 'column',
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
                fontSize: 15,
                lineHeight: 1.4,
                color: 'var(--ink)',
              }}
            >
              {trap.headline ?? '—'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
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
