// /dev/nav-rail-bakeoff — the primary navigation, redesigned on audited
// ground.
//
// An IA audit established the truths: "Övning" opens half of practice
// while its badge advertises the other half; "Lektion" oversells a
// framework reader; Provpass (a flagship flow) has no persistent door;
// phone and desktop don't even list the same items (Feedback — a
// dogfood exporter — held a phone top-5 slot). Owner decisions: five
// identical doors on both chromes (Hem · practice · Provpass ·
// reference · Framsteg), Feedback demoted, Diagnostik stays in Mer,
// reference door renamed (candidates rendered live).
//
// Four skill-guided concepts:
//   A1 "Marginalen"  — signal-rich: live state as margin annotations
//                       left of a full-height spine; labels Träna +
//                       RAMVERK; text-only mono phone tabs.
//   A2 "Fem dörrar"  — signal-quiet: serif reading-size ToC, active =
//                       italic + tick, zero badges anywhere; Teori.
//   B1 "Slingan"     — journey-ordered: a hairline path threads the
//                       loop doors, Teori set beside it in serif
//                       italic; Öva weighted heaviest.
//   B2 "Innehållet"  — document-native: dot leaders to real counts,
//                       bokmärke ribbon marks the active door, phone
//                       bar = five small-caps serif words (no icons).
//
// All four include the practice-hub landing (öva/repetera lanes,
// unconditional). Dev-gated; kept forever per house rule.

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { NAVA1, NAVA2 } from '@/components/devbake/NavBakeoffA'
import { NAVB1, NAVB2 } from '@/components/devbake/NavBakeoffB'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/dev_/nav-rail-bakeoff')({
  component: NavRailBakeoffPage,
})

const VARIANTS = [
  { key: 'a1', label: 'A1 · Marginalen', C: NAVA1 },
  { key: 'a2', label: 'A2 · Fem dörrar', C: NAVA2 },
  { key: 'b1', label: 'B1 · Slingan', C: NAVB1 },
  { key: 'b2', label: 'B2 · Innehållet', C: NAVB2 },
] as const

function NavRailBakeoffPage() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]['key']>('a1')

  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        dev-yta — lägg till ?dev=1
      </div>
    )
  }

  const Active = VARIANTS.find((v) => v.key === variant)?.C ?? NAVA1

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
          Bake-off · navigationen · fem dörrar
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
