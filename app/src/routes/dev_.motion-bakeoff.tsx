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

import { MOTC1, MOTC2 } from '@/components/devbake/MotionBakeoffC'
import { MOTP1, MOTP2 } from '@/components/devbake/MotionBakeoffP'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/dev_/motion-bakeoff')({
  component: MotionBakeoffPage,
})

const VARIANTS = [
  { key: 'p1', label: 'P1 · Anslaget', C: MOTP1 },
  { key: 'p2', label: 'P2 · Bläckets väg', C: MOTP2 },
  { key: 'c1', label: 'C1 · Trycket', C: MOTC1 },
  { key: 'c2', label: 'C2 · Bläcket', C: MOTC2 },
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
