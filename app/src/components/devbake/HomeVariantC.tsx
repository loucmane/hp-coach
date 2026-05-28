// HomeVariantC — Second specialist's state-of-the-art redesign.
//
// Where Variant B made the page calm by removing density, Variant C
// makes it calm by *organizing* density. Three concrete moves:
//
//   1. ScoreBlock as the second focal element. The score numeral is
//      promoted from 13px mono caption to 56px Newsreader display
//      tabular-nums (Stripe MRR / Vercel deploy-count treatment).
//      The `/ 2.0` denominator drops to 18px --muted, baseline-
//      aligned. Verbal + kvant sit underneath as 11px folio mono
//      with numerals lifted to --ink.
//   2. Day-shape state line between the kicker and the greeting:
//      `4 PUNKTER · 0 KLAR · 16 MIN KVAR`. One line. Tabular nums.
//      The single source of "where am I in the day."
//   3. 2-column composition under the greeting: ScoreBlock (38%) +
//      DailyPlanCard (58%) sharing the eye at the same horizontal.
//      Stacks below 880px viewport (handled at the bake-off level).
//
// Trap row grid reworked to `120px · 1fr · 56px` (mono id / serif
// headline at 14px --ink-2 / mono count). Drops italic, drops the
// heavy ink left rule.
//
// Accent enters in exactly one place — the score delta glyph
// (`+0.04`) next to the numeral when the score moved this week.
// Restraint sells the system.

import type { TopTrap } from '@/api/hooks/useTopTraps'
import { DailyPlanCard } from '@/components/home/DailyPlanCard'
import { Eyebrow, Mono } from '@/components/primitives'
import { Display } from '@/components/Typography'

import { FIXTURE_PLAN, FIXTURE_TOP_TRAPS } from './homeBakeoffFixtures'

export function HomeVariantC() {
  const totalItems = FIXTURE_PLAN.items.length
  const doneItems = FIXTURE_PLAN.items.filter((i) => i.completed).length
  const minutesLeft = FIXTURE_PLAN.estimatedMinutes

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
      {/* Kicker — single mono line. */}
      <header style={{ padding: '24px 28px 0' }}>
        <Mono>Onsdag 27 maj · 151 dagar · höstprov 26</Mono>
      </header>

      {/* Day-shape state line — 11px mono, tabular-nums, the single
       *  source of "where am I in the day." */}
      <div
        style={{
          padding: '6px 28px 0',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span style={{ color: 'var(--ink-2)' }}>{totalItems}</span> punkter
        <span style={{ margin: '0 8px' }}>·</span>
        <span style={{ color: 'var(--ink-2)' }}>{doneItems}</span> klar
        <span style={{ margin: '0 8px' }}>·</span>~
        <span style={{ color: 'var(--ink-2)' }}>{minutesLeft}</span> min kvar
      </div>

      <div
        style={{
          flex: 1,
          padding: '0 28px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Big breath, but smaller than B — chrome+kicker+dayshape
         *  already used ~120px, so the greeting lands earlier on the
         *  page instead of being pushed into the middle third. */}
        <div style={{ height: 'clamp(40px, 6vh, 72px)' }} />

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

        <div style={{ height: 'clamp(28px, 3vh, 40px)' }} />

        {/* 38/58 two-column composition. ScoreBlock left, plan right.
         *  Stripe MRR + activity pairing. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '38fr 58fr',
            gap: 24,
            alignItems: 'start',
          }}
        >
          <ScoreBlock />
          <DailyPlanCard plan={FIXTURE_PLAN} allComplete={false} />
        </div>

        <div style={{ height: 'clamp(48px, 6vh, 80px)' }} />

        {/* 240px ink-2 divider then demoted traps in the new
         *  120px / 1fr / 56px grid. */}
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

// ── ScoreBlock — the hero numeral treatment ────────────────────────

function ScoreBlock() {
  // Fixture values mirror the live composition: 0.64 / 2.0 with a
  // +0.04 weekly delta (the only place --accent appears on Home).
  const score = '0.64'
  const ceiling = '2.0'
  const weeklyDelta = '+0.04'
  const verbal = '0.79'
  const kvant = '0.49'

  return (
    <section
      data-testid="score-block"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <Eyebrow>Just nu</Eyebrow>

      {/* Numeral row — display tabular-nums, slash + denominator in
       *  muted, accent delta glyph baseline-aligned to the slash. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 'clamp(44px, 4vw + 16px, 64px)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: 'var(--ink)',
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 18,
            color: 'var(--muted)',
          }}
        >
          / {ceiling}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--accent)',
            letterSpacing: '0.04em',
            marginLeft: 4,
          }}
        >
          {weeklyDelta}
        </span>
      </div>

      {/* Sublabels — 11px folio mono, labels muted, numerals in
       *  --ink so the values pop. */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.06em',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
          display: 'flex',
          gap: 18,
          textTransform: 'uppercase',
        }}
      >
        <span>
          verbal <span style={{ color: 'var(--ink)' }}>{verbal}</span>
        </span>
        <span>
          kvant <span style={{ color: 'var(--ink)' }}>{kvant}</span>
        </span>
      </div>
    </section>
  )
}

// ── QuietTraps — demoted to a quiet diagnostic strip ──────────────

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
