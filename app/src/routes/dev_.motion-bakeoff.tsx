// /dev/motion-bakeoff — an app-wide motion language for HP-Coach.
//
// The owner asked for animation that feels "sleek and clean, cutting-
// edge SOTA." Two skill-guided designers worked opposed lenses; each
// concept demos the SAME five moments (page entrance, list stagger,
// drill verdict, nav transition, signature) on real content, every
// board replayable:
//
//   P1 "Anslaget"      — letterpress physics: nothing travels, things
//                         are PRESSED into place; grading = over-stamp;
//                         signature Djuptrycket ("Klart." struck deep).
//   P2 "Bläckets väg"  — flow physics: ink travels the page structure;
//                         rules draw themselves, verdicts pour down the
//                         rail; signature Räkneverket (digit drum).
//   C1 "Trycket"       — orchestrated letterpress: exit-before-enter
//                         choreography, damped mass; signature
//                         Arkvändningen (560ms leaf-turn).
//   C2 "Bläcket"       — sprung handwriting: marks move on a still
//                         page, FLIP ink tick between rows; signature
//                         Siffran följer med (shared-element numeral).
//
// Shared hard constraints: ADHD-safe (motion confirms causality, never
// ambient-distracts; no loops on study surfaces), prefers-reduced-
// motion collapses everything to opacity-or-nothing, transform/opacity
// only (clip-path sparingly), accent law untouched. Dev-gated; kept
// forever per house rule.

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { INKDEMO } from '@/components/devbake/DryingInkDemo'
import { KLART1, KLART2, KLART3, KLARTH } from '@/components/devbake/KlartBakeoff'
import { LOAD1, LOAD2, LOAD3 } from '@/components/devbake/LoadingBakeoff'
import { MOTA2 } from '@/components/devbake/MotionArketFullbordad'
import { MOTA1 } from '@/components/devbake/MotionArketRedigerad'
import { MOTC1, MOTC2 } from '@/components/devbake/MotionBakeoffC'
import { MOTP1, MOTP2 } from '@/components/devbake/MotionBakeoffP'
import { MOTB2 } from '@/components/devbake/MotionBlacket2'
import { MOTF1, MOTF2 } from '@/components/devbake/MotionSpringF'
import { MOTF3, MOTF4 } from '@/components/devbake/MotionSpringG'
import { THEMEDEMO } from '@/components/devbake/ThemeCrossfadeDemo'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/dev_/motion-bakeoff')({
  component: MotionBakeoffPage,
})

const VARIANTS = [
  { key: 'p1', label: 'P1 · Anslaget', C: MOTP1 },
  { key: 'p2', label: 'P2 · Bläckets väg', C: MOTP2 },
  { key: 'c1', label: 'C1 · Trycket', C: MOTC1 },
  { key: 'c2', label: 'C2 · Bläcket', C: MOTC2 },
  // Round 2 — the owner picked Bläcket but judged the CSS-keyframe round
  // "pretty basic". B2 rebuilds the grammar on motion/react: a walkable
  // flow with interruptible springs, layoutId shared elements, and a
  // velocity-thresholded gesture. Judge choreography, not clips.
  { key: 'b2', label: 'B2 · Bläcket 2.0', C: MOTB2 },
  // Round 3 — the owner liked B2 and asked for a spread of spring-based
  // options ("2026 classy and clean"). Two axes, four systems, all the
  // same walkable flow so only the motion language varies:
  { key: 'f1', label: 'F1 · Sättningen', C: MOTF1 },
  { key: 'f2', label: 'F2 · Arket', C: MOTF2 },
  { key: 'f3', label: 'F3 · Partituret', C: MOTF3 },
  { key: 'f4', label: 'F4 · Greppet', C: MOTF4 },
  // Round 4 — owner verdict: Arket as base + Greppet's drag-to-commit,
  // refined against the "powerpoint jank" kill-list (settle-verified).
  // A1 improves by subtraction, A2 by fit-and-finish.
  { key: 'a1', label: 'A1 · Arket, redigerad', C: MOTA1 },
  { key: 'a2', label: 'A2 · Arket, fullbordad', C: MOTA2 },
  // W2 — the Klart. payoff bake-off: Arket stands app-wide, but the
  // owner has earned ONE ritual moment at session end. Three competing
  // emotional theses for that single beat (each may breathe past
  // 400 ms, once): the press, the exhale, the tally.
  { key: 'k1', label: 'K1 · Djuptrycket', C: KLART1 },
  { key: 'k2', label: 'K2 · Andningen', C: KLART2 },
  { key: 'k3', label: 'K3 · Räkenskapen', C: KLART3 },
  // Owner verdict on W2: K1's motion + K3's bottom, composed as one
  // ceremony — the strike's wave IS the counting hand.
  { key: 'kh', label: 'KH · Hybriden', C: KLARTH },
  // D2 — theme crossfade demo (task W3): isolated stage for the real
  // withViewTransition-wrapped ljus/mörk + palette toggles.
  { key: 'd2', label: 'D2 · Temaövergången', C: THEMEDEMO },
  // Wave W1 — the shipped drying-ink data-arrival treatment (skeleton
  // and content as one surface; tork/ut only), replayable on demand.
  { key: 'd1', label: 'D1 · Torkande bläck', C: INKDEMO },
  // W1 round 2 — owner verdict on D1: "i didnt get the drying ink
  // feeling" (it reads as a quieter skeleton). Three competing
  // loading-arrival languages on one shared stage, each replayable at
  // snabb (300 ms) and långsam (2,5 s): the blurred ghost that sharpens
  // into focus, the page that writes itself in, and the blank sheet
  // that arrives in one composed beat.
  { key: 'l1', label: 'L1 · Bläckfläcken', C: LOAD1 },
  { key: 'l2', label: 'L2 · Skriften', C: LOAD2 },
  { key: 'l3', label: 'L3 · Vita arket', C: LOAD3 },
] as const

function MotionBakeoffPage() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]['key']>('p1')

  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        dev-yta — lägg till ?dev=1
      </div>
    )
  }

  const Active = VARIANTS.find((v) => v.key === variant)?.C ?? MOTP1

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', padding: '28px 24px 80px' }}>
      <header style={{ maxWidth: 1100, margin: '0 auto 20px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Bake-off · rörelsespråket · fem ögonblick
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {VARIANTS.map((v) => (
            <button
              type="button"
              key={v.key}
              onClick={() => setVariant(v.key)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.04em',
                padding: '7px 14px',
                borderRadius: 999,
                border: `1px solid ${variant === v.key ? 'var(--ink)' : 'var(--hairline)'}`,
                background: variant === v.key ? 'var(--ink)' : 'transparent',
                color: variant === v.key ? 'var(--bg)' : 'var(--ink-2)',
                cursor: 'pointer',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>
      <Active key={variant} />
    </div>
  )
}
