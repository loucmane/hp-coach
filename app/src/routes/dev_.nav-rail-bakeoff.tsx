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
import { BookOpen, House, PencilLine, Timer, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import { NAVA1, NAVA2 } from '@/components/devbake/NavBakeoffA'
import { NAVB1, NAVB2 } from '@/components/devbake/NavBakeoffB'
import {
  GlyphFramsteg,
  GlyphHem,
  GlyphOva,
  GlyphProvpass,
  GlyphUppslag,
  SPINE1,
  SPINE2,
  SPINEM,
} from '@/components/devbake/NavSpineIcons'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/dev_/nav-rail-bakeoff')({
  component: NavRailBakeoffPage,
})

const VARIANTS = [
  { key: 'a1', label: 'A1 · Marginalen', C: NAVA1 },
  { key: 'a2', label: 'A2 · Fem dörrar', C: NAVA2 },
  { key: 'b1', label: 'B1 · Slingan', C: NAVB1 },
  { key: 'b2', label: 'B2 · Innehållet', C: NAVB2 },
  // Round 2 — the owner picked B2 but rejected the dots-only collapsed
  // spine. S1/S2 = bespoke glyph study (mute / one-signal spines); L =
  // the Lucide fair fight (lucide-react is already a dependency; the
  // decision is pixel-vs-pixel, not ideology).
  { key: 's1', label: 'S1 · Spine — stum', C: SPINE1 },
  { key: 's2', label: 'S2 · Spine — en signal', C: SPINE2 },
  { key: 'sm', label: 'SM · Markörstudien', C: SPINEM },
  { key: 'l', label: 'L · Lucide-jämförelsen', C: LucideComparison },
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

// ── The Lucide fair fight ─────────────────────────────────────────────
// Bespoke glyphs (house 1.6-stroke grid) against the five closest Lucide
// equivalents at identical sizes and stroke. Judge the SYSTEM: which row
// reads faster at 16-20px, and which belongs in the book.

const LUCIDE = [
  { name: 'Hem', L: House, B: GlyphHem },
  { name: 'Öva', L: PencilLine, B: GlyphOva },
  { name: 'Provpass', L: Timer, B: GlyphProvpass },
  { name: 'Uppslag', L: BookOpen, B: GlyphUppslag },
  { name: 'Framsteg', L: TrendingUp, B: GlyphFramsteg },
] as const

function LucideComparison() {
  const sizes = [28, 20, 16] as const
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', color: 'var(--ink)' }}>
      {(['Bespoke — huset', 'Lucide — hyllvara'] as const).map((row, ri) => (
        <section key={row} style={{ marginBottom: 36 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              borderBottom: '1px solid var(--hairline)',
              paddingBottom: 8,
              marginBottom: 18,
            }}
          >
            {row}
          </div>
          {sizes.map((size) => (
            <div
              key={size}
              style={{ display: 'flex', alignItems: 'center', gap: 36, marginBottom: 16 }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--muted-2)',
                  width: 34,
                }}
              >
                {size}px
              </span>
              {LUCIDE.map(({ name, L, B }) => (
                <span
                  key={name}
                  title={name}
                  style={{ display: 'inline-flex', width: 34, justifyContent: 'center' }}
                >
                  {ri === 0 ? (
                    <B s={size} />
                  ) : (
                    <L size={size} strokeWidth={1.6} absoluteStrokeWidth />
                  )}
                </span>
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 36, marginLeft: 70 }}>
            {LUCIDE.map(({ name }) => (
              <span
                key={name}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  color: 'var(--muted)',
                  width: 34,
                  textAlign: 'center',
                }}
              >
                {name.slice(0, 4)}
              </span>
            ))}
          </div>
        </section>
      ))}
      <p
        style={{
          fontFamily: 'var(--font-serif, Georgia, serif)',
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          maxWidth: '52ch',
        }}
      >
        Samma storlekar, samma linjetjocklek (1,6). Husets glyfer står på en gemensam marklinje och
        äger en huvudmassa per tecken; Lucide är hyllvaran hela ekosystemet använder. Välj den rad
        som läses snabbast vid 16–20&nbsp;px — inte den med bäst ideologi.
      </p>
    </div>
  )
}
