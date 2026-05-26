// Payoff Variant D — Director's read.
//
// Variant C plus every refinement the design-director critique
// surfaced. Same composition, more careful execution:
//
//   - `Pass slut · 12 min` demoted to a bottom folio (it was
//     competing with `Klart.` for the first read).
//   - 180ms fade-and-rise on `Klart.` so the screen marks a
//     threshold rather than materialising flat ("the room goes
//     quiet for a second").
//   - FÄLLA · trap-name eyebrow above the score-delta band —
//     causation surfaced: the score moved because of THIS trap.
//   - ScoreDeltaBand: 1100ms tween, 250ms delay so the headline
//     lands first; useReducedMotion() snaps to `after` directly.
//     `→` glyph replaced with a hairline em-rule.
//   - `Hairline` divider between CoachLine and the Detaljer card
//     so the screen reads as one editorial page, not a stack.
//   - "Imorgon väntar" copy de-stuttered: rationale moves out of
//     the inline dot-separator into its own --ink-2 sub-line.
//   - `Esc · stäng` folio hint in the bottom-right (keyboard exit
//     pattern from EDITION task #98).

import { motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect } from 'react'

import { Btn, CoachLine, Eyebrow, Hairline, Mono } from '@/components/primitives'
import { FIXTURE_PLAN, FIXTURE_SCORE_DELTA } from '@/lib/devbakeFixtures'
import { VOICE } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'

const TRAP_NAME = 'Stacked-fraction inversion'

export function PayoffVariantD() {
  const coach = useCoachStore((s) => s.coach)
  const tomorrowItem = FIXTURE_PLAN.items.find((i) => !i.completed)
  const reduced = useReducedMotion()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 24px 18px',
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius)',
        height: '100%',
        animation: reduced ? undefined : 'hpc-reveal 320ms cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <motion.h1
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          fontSize: 64,
          margin: '6px 0 0',
          color: 'var(--ink)',
        }}
      >
        Klart.
      </motion.h1>

      <Eyebrow style={{ marginTop: 18, color: 'var(--accent)' }}>Fälla · {TRAP_NAME}</Eyebrow>
      <ScoreDeltaBand reducedMotion={Boolean(reduced)} />

      <CoachLine coach={coach} as="body" style={{ margin: '14px 0 20px', maxWidth: '32ch' }}>
        {VOICE[coach].sessionEnd}
      </CoachLine>

      <Hairline style={{ marginBottom: 18 }} />

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
              fontSize: 'clamp(16px, 0.4vw + 14px, 18px)',
              lineHeight: 1.4,
              color: 'var(--ink)',
              margin: '8px 0 4px 0',
            }}
          >
            {tomorrowItem.headline}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(13px, 0.3vw + 12px, 15px)',
              lineHeight: 1.5,
              color: 'var(--ink-2)',
              margin: 0,
            }}
          >
            {tomorrowItem.rationale}
          </p>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 24 }} />

      <Btn full size="lg" onClick={() => {}}>
        Stäng
      </Btn>

      {/* Bottom folio — provenance demoted from headline-competing
       *  position. Also surfaces the keyboard exit affordance the
       *  director called for. */}
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        <span>Pass slut · 12 min</span>
        <span>Esc · stäng</span>
      </div>
    </div>
  )
}

function ScoreDeltaBand({ reducedMotion }: { reducedMotion: boolean }) {
  const { section, before, after } = FIXTURE_SCORE_DELTA
  const value = useMotionValue(reducedMotion ? after : before)
  const display = useTransform(value, (v) => v.toFixed(2))

  // 250ms delay so the Klart. headline lands FIRST, then the needle
  // moves. 1100ms total — reading-pace, not UI-pace. Skipped entirely
  // under prefers-reduced-motion: the band just shows the final value.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only intentional
  useEffect(() => {
    if (reducedMotion) return
    const delay = 250
    const duration = 1100
    const start = performance.now() + delay
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - start
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const t = Math.min(1, elapsed / duration)
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
        marginTop: 8,
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        fontFamily: 'var(--font-display)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span style={{ fontSize: 22, color: 'var(--muted)', letterSpacing: '-0.01em' }}>
        {section} · {before.toFixed(2)}
      </span>
      {/* Hairline em-rule replaces the weak → at 18px */}
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 18,
          height: 1,
          background: 'var(--muted-2)',
          alignSelf: 'center',
        }}
      />
      <motion.span style={{ fontSize: 28, color: 'var(--ink)', letterSpacing: '-0.015em' }}>
        {display}
      </motion.span>
    </div>
  )
}
