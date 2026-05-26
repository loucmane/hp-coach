// Home Sigil Variant C — Stroke-fill underline.
//
// A thin horizontal stroke under the running-head band (here, the
// hero's top section) that fills left-to-right as plan items complete.
// Reads as an editorial underline / hand-drawn rule rather than a
// dashboard indicator. Loses the "close a shape" moment that the
// quarter-arc variant has — there's no flourish, just a complete
// line.

import { Mono } from '@/components/primitives'
import { FIXTURE_PLAN } from '@/lib/devbakeFixtures'

const STREAK_DAYS = 14

export function HomeSigilC() {
  const total = FIXTURE_PLAN.items.length
  const completed = FIXTURE_PLAN.items.filter((i) => i.completed).length
  const fraction = total === 0 ? 0 : completed / total

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
      </div>

      {/* The fill bar — sits as a typographic rule under the header
       *  band. Two layers: hairline background for the unfilled
       *  portion, ink overlay for the completed fraction. */}
      <div
        style={{
          marginTop: 'clamp(16px, 1.6vw + 8px, 24px)',
          position: 'relative',
          height: 2,
          background: 'var(--hairline)',
          borderRadius: 1,
          overflow: 'hidden',
        }}
        role="img"
        aria-label={`Dagens framsteg: ${completed} av ${total} klart`}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${fraction * 100}%`,
            background: 'var(--ink)',
            transition: 'width 360ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span>
          {completed} / {total} klart
        </span>
        <span>idag · ~{FIXTURE_PLAN.estimatedMinutes} min</span>
      </div>

      <h1
        style={{
          marginTop: 'clamp(16px, 2vh, 24px)',
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
