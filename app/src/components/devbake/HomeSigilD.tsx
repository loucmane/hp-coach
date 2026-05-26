// Home Sigil Variant D — Director's stroke-fill rule, refined.
//
// Variant C plus every refinement the design critique surfaced, plus
// two synthesis moves:
//
//   - 1px hairline rule (not 2px) over a `--hairline-2` track — reads
//     as a printer's rule, not a UI bar.
//   - No `borderRadius: 1` (it was doing nothing visible).
//   - Italic display marginalia on the right (`2/4`) instead of mono
//     all-caps shouting. Pairs with the existing italic date flourish
//     at 4/4.
//   - At-100% closing flourish: "B absorbed into C" — the em-dash +
//     italic date stamp ("klart · 26 maj") that Variant B used as its
//     close moment renders here too once the bar fills. Single-fire
//     per day.
//   - 520ms fill transition (vs C's 360ms) at reading-pace, gated on
//     prefers-reduced-motion via a CSS @media — the rule is the one
//     thing that breathes on Home so it resolves slow.
//   - Zero-state prompt: at 0/N, instead of a dead empty track, render
//     the first plan item's headline as marginalia ("Börja med: …").
//     Closes the dogfood-user friction loop *I should start, but
//     where?* without becoming a notification.
//   - Redundant `idag · ~X min` dropped at desktop (the day plan
//     repeats it below the fold). Surfaces only at phone width.

import { Mono } from '@/components/primitives'
import { FIXTURE_PLAN } from '@/lib/devbakeFixtures'

const STREAK_DAYS = 14

export function HomeSigilD() {
  const total = FIXTURE_PLAN.items.length
  const completed = FIXTURE_PLAN.items.filter((i) => i.completed).length
  const fraction = total === 0 ? 0 : completed / total
  const allDone = completed === total
  const firstPending = FIXTURE_PLAN.items.find((i) => !i.completed)
  const isZero = completed === 0

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

      {/* The printer's rule. 1px over hairline-2 track. */}
      <div
        style={{
          marginTop: 'clamp(20px, 2vw + 10px, 28px)',
          position: 'relative',
          height: 1,
          background: 'var(--hairline-2)',
          overflow: 'hidden',
        }}
        role="img"
        aria-label={`Dagens framsteg: ${completed} av ${total} klart`}
      >
        <div
          className="hpc-sigil-fill"
          style={{
            position: 'absolute',
            inset: 0,
            width: `${fraction * 100}%`,
            background: 'var(--ink)',
          }}
        />
      </div>

      {/* Marginalia row beneath the rule. Italic display on the right,
       *  not mono. Zero-state shows a prompt instead of a dead `0/N`. */}
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        {isZero && firstPending ? (
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontStyle: 'italic',
              color: 'var(--ink-2)',
            }}
          >
            Börja med: <span style={{ color: 'var(--ink)' }}>{firstPending.headline}</span>
          </span>
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ink-2)',
            }}
          >
            {allDone ? '— klart · 26 maj' : `${completed} av ${total}`}
          </span>
        )}
        {/* `idag · ~X min` only at phone widths — at desktop the day
         *  plan repeats it below the fold. The container-query @media
         *  is approximated here with a JS test on the bake-off
         *  container; in production, a `display: none` at the matching
         *  breakpoint is cleaner. */}
        {!allDone && !isZero && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
            className="hpc-sigil-time"
          >
            ~{FIXTURE_PLAN.estimatedMinutes} min idag
          </span>
        )}
      </div>

      <h1
        style={{
          marginTop: 'clamp(20px, 2vh, 32px)',
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

      <style>{`
        .hpc-sigil-fill {
          transition: width 520ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .hpc-sigil-fill { transition: none; }
        }
        @media (min-width: 768px) {
          .hpc-sigil-time { display: none; }
        }
      `}</style>
    </div>
  )
}
