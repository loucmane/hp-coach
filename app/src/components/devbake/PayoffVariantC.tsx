// Payoff Variant C — "Klart." plus score delta + tomorrow's preview.
//
// Stacks two additions on top of Variant B (the prototype payoff):
//
//   1. SCORE DELTA BAND — under the headline, above the CoachLine.
//      "KVA · 1.86 → 1.89" with the new value animated from old to
//      new via `motion`. The single editorial signal that the needle
//      moved.
//
//   2. IMORGON VÄNTAR — between the stats card and the CTA. One row
//      lifted from `useDailyPlan()` (here, the fixture plan's first
//      non-completed item). Mirrors `DiagnosticReport.PlanenBlock`
//      row style: mono kicker + display body.
//
// The rest of Variant B's composition (eyebrow / Klart. / CoachLine /
// stats card / CTA) is preserved verbatim.

import { motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect } from 'react'

import { Btn, CoachLine, Eyebrow, Mono } from '@/components/primitives'
import { FIXTURE_PLAN, FIXTURE_SCORE_DELTA } from '@/lib/devbakeFixtures'
import { VOICE } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'

export function PayoffVariantC() {
  const coach = useCoachStore((s) => s.coach)
  const tomorrowItem = FIXTURE_PLAN.items.find((i) => !i.completed)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 24px 24px',
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius)',
        height: '100%',
      }}
    >
      <Mono>Pass slut · 12 min</Mono>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          fontSize: 64,
          margin: '20px 0 0',
          color: 'var(--ink)',
        }}
      >
        Klart.
      </h1>

      <ScoreDeltaBand />

      <CoachLine coach={coach} as="body" style={{ margin: '14px 0 28px', maxWidth: '32ch' }}>
        {VOICE[coach].sessionEnd}
      </CoachLine>

      <div
        style={{
          padding: 'clamp(14px, 1.2vw + 10px, 22px)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius)',
        }}
      >
        <Eyebrow>Detaljer</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {(
            [
              ['KVA · grunder', '12/15'],
              ['Tid på fel svar', '2:14 medel'],
              ['Nya fällor markerade', '1'],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontFamily: 'var(--font-display)',
                fontSize: 13.5,
                color: 'var(--ink-2)',
              }}
            >
              <span>{label}</span>
              <Mono>{value}</Mono>
            </div>
          ))}
        </div>
      </div>

      {tomorrowItem && (
        <div style={{ marginTop: 'clamp(20px, 2.2vw + 8px, 32px)' }}>
          <Eyebrow>Imorgon väntar</Eyebrow>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(15px, 0.4vw + 13px, 17px)',
              lineHeight: 1.45,
              color: 'var(--ink)',
              margin: '8px 0 0 0',
            }}
          >
            {tomorrowItem.headline}{' '}
            <span style={{ color: 'var(--ink-2)' }}>· {tomorrowItem.rationale}</span>
          </p>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 24 }} />

      <Btn full size="lg" onClick={() => {}}>
        Stäng
      </Btn>
    </div>
  )
}

function ScoreDeltaBand() {
  const { section, before, after } = FIXTURE_SCORE_DELTA
  // Spring-animate from `before` to `after` on mount. The user sees
  // the needle move, not just a static post-state. `motion`'s
  // useMotionValue + useTransform gives us a smooth tween on every
  // hot-reload of the bake-off too.
  const value = useMotionValue(before)
  const display = useTransform(value, (v) => v.toFixed(2))

  // Run-once mount tween. before/after/value are read by closure — only
  // re-arming on remount makes sense, so the dependency list is empty
  // by design.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only intentional
  useEffect(() => {
    const start = performance.now()
    const duration = 900
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // Ease-out cubic
      const eased = 1 - (1 - t) ** 3
      value.set(before + (after - before) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      style={{
        marginTop: 16,
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        fontFamily: 'var(--font-display)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {section}
      </span>
      <span style={{ fontSize: 22, color: 'var(--muted)', letterSpacing: '-0.01em' }}>
        {before.toFixed(2)}
      </span>
      <span style={{ fontSize: 18, color: 'var(--muted)' }}>→</span>
      <motion.span style={{ fontSize: 28, color: 'var(--ink)', letterSpacing: '-0.015em' }}>
        {display}
      </motion.span>
    </div>
  )
}
