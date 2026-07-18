// /dev/landing-bakeoff — the public front door (P2-2.1).
//
// Two skill-guided lenses, four full landing pages, all PHONE-FIRST
// (the audience finds this from a friend's link at 23:00 on a phone):
//
//   E1 "Första lektionen" — editorial, demonstration-led: the hero
//        states the claim ("ett mönsterprov") and the page teaches
//        before it sells (REVIDERA decomposed in 5 seconds).
//   E2 "Kursplanen"       — editorial, transparency-led: the landing
//        as course front matter — the ToC IS the exam's anatomy,
//        villkor as a plain ledger.
//   P1 "Första frågan"    — product-demo, the ambush: an answerable
//        ORD question before any pitch; the brand whispers until
//        the colophon.
//   P2 "Uppslaget"        — product-demo, the session facsimile: the
//        whole sales page typeset as one drill session, demo answers
//        booking real ✓/✗ into a live UTFALL ledger.
//
// Shared laws: original hand-written sample questions ONLY (© UHR
// corpus never touches the public page — labeled on-page), honest-
// machine section (no results promises), accountability line with
// placeholder namn/orgnr, price placeholder (D2 undecided) anchored
// vs the 550 kr exam fee, CTA → /sign-up. Judge at 390px first.
// Dev-gated; kept forever per house rule.

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { LAND_E1, LAND_E2 } from '@/components/devbake/LandingBakeoffE'
import { LAND_P1, LAND_P2 } from '@/components/devbake/LandingBakeoffP'
import { LAND_P1V2, LAND_P2V2 } from '@/components/devbake/LandingBakeoffR2'
import { LAND_P3B, LAND_P3S } from '@/components/devbake/LandingBakeoffR3'
import { LandV4A } from '@/components/devbake/LandingBakeoffR4A'
import { LandV4B } from '@/components/devbake/LandingBakeoffR4B'
import { LandV4C } from '@/components/devbake/LandingBakeoffR4C'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/dev_/landing-bakeoff')({
  component: LandingBakeoffPage,
})

const VARIANTS = [
  { key: 'e1', label: 'E1 · Första lektionen', C: LAND_E1 },
  { key: 'e2', label: 'E2 · Kursplanen', C: LAND_E2 },
  { key: 'p1', label: 'P1 · Första frågan', C: LAND_P1 },
  { key: 'p2', label: 'P2 · Uppslaget', C: LAND_P2 },
  { key: 'p1v2', label: 'P1v2 · Första frågan', C: LAND_P1V2 },
  { key: 'p2v2', label: 'P2v2 · Uppslaget', C: LAND_P2V2 },
  { key: 'p3s', label: 'P3S · Scenen', C: LAND_P3S },
  { key: 'p3b', label: 'P3B · Bläddran', C: LAND_P3B },
  { key: 'v4a', label: 'V4A · Titelsidan', C: LandV4A },
  { key: 'v4b', label: 'V4B · Tryckpressen', C: LandV4B },
  { key: 'v4c', label: 'V4C · Tidslinjen', C: LandV4C },
] as const

function LandingBakeoffPage() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]['key']>('e1')

  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        dev-yta — lägg till ?dev=1
      </div>
    )
  }

  const Active = VARIANTS.find((v) => v.key === variant)?.C ?? LAND_E1

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <header
        style={{
          padding: '16px 16px 12px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.14em',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Bake-off · framsidan · fyra dörrar
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {VARIANTS.map((v) => (
            <button
              type="button"
              key={v.key}
              onClick={() => setVariant(v.key)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.04em',
                padding: '6px 11px',
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
