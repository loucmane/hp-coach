// /dev/provpass-picker-bakeoff — how should the provpass archive read?
//
// The shipped picker leaks raw exam ids ("host-2025 · kvant1") into
// Swedish UI and presents ~54 undifferentiated rows per half. Four
// skill-guided concepts from two designers, all sharing one naming law
// (formatSitting/formatPass — "Hösten 2025", "Våren 2022 ·
// provtillfälle 1", "Provpass 1"):
//   A1 "Innehållet"          — table of contents: Nästa-pass frontispiece,
//                               years as running heads, dot-leader rows,
//                               exposure seated like a page number.
//   A2 "Utgåvorna"           — edition shelf: 27 sitting-cards instead of
//                               54 rows, year numerals as spines,
//                               ○/◐/● freshness glyphs.
//   B1 "Kallelsen & arkivet" — document-native: the suggestion IS a
//                               Kallelse card (addressee line — the one
//                               surface where Inskriven is literal),
//                               chronological ledger below.
//   B2 "Registret"           — information-dense: sitting × pass matrix,
//                               whole half in a viewport, micro-meters,
//                               pinned MINST SETT strip.
//
// Dev-gated. Round stays live forever per the keep-bake-offs rule.

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PPA1, PPA2 } from '@/components/devbake/ProvpassPickerA'
import { PPB1, PPB2 } from '@/components/devbake/ProvpassPickerB'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/dev_/provpass-picker-bakeoff')({
  component: ProvpassPickerBakeoffPage,
})

const VARIANTS = [
  { key: 'a1', label: 'A1 · Innehållet', C: PPA1 },
  { key: 'a2', label: 'A2 · Utgåvorna', C: PPA2 },
  { key: 'b1', label: 'B1 · Kallelsen & arkivet', C: PPB1 },
  { key: 'b2', label: 'B2 · Registret', C: PPB2 },
] as const

function ProvpassPickerBakeoffPage() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]['key']>('a1')

  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        dev-yta — lägg till ?dev=1
      </div>
    )
  }

  const Active = VARIANTS.find((v) => v.key === variant)?.C ?? PPA1

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', padding: '28px 24px 80px' }}>
      <header style={{ maxWidth: 980, margin: '0 auto 20px' }}>
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
          Bake-off · provpass-väljaren
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
