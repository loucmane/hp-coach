// /redesign-bakeoff — 2026 redesign bake-off.
//
// Three complete design LANGUAGES (not layout tweaks) rendered with the
// same real corpus content on the same two canvases (Hem + Övning), each
// with its own motion system, so the dogfood user can judge them as
// products rather than screenshots:
//
//   A · EDITION II  — the editorial incumbent pushed to print-grade,
//                     plus the 'ink settles' motion system it never had.
//   B · Instrument  — Swiss precision: exposed 12-col grid, mono data
//                     voice, live status bar, mechanical 120-180ms motion.
//   C · Tactile     — warm-modern 2026: layered material, Fraunces,
//                     spring physics, grading as physical response.
//
// Deviates from the stacked-card bake-off pattern deliberately: each
// variant owns the full viewport (own background + fixed chrome + motion
// choreography), so they cannot share a canvas. A small fixed switcher
// (top-right) flips variant and screen; no winner-picker UI — the user
// reports the pick in conversation, per house convention.
//
// Dev-gated via isDevSurface(). Fixture-driven (devbake/redesign/fixtures
// — one real var-2026 ORD question + full Layer-2 explanation + Home
// plan data); no network, no auth dependencies inside the variants.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { RedesignScreen } from '@/components/devbake/redesign/fixtures'
import { RedesignA } from '@/components/devbake/redesign/RedesignA'
import { RedesignB } from '@/components/devbake/redesign/RedesignB'
import { RedesignC } from '@/components/devbake/redesign/RedesignC'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/redesign-bakeoff')({
  component: RedesignBakeoff,
})

type VariantKey = 'A' | 'B' | 'C'

const VARIANT_LABELS: Record<VariantKey, string> = {
  A: 'EDITION II',
  B: 'Instrument',
  C: 'Tactile',
}

function initialFromSearch(): { variant: VariantKey; screen: RedesignScreen } {
  const params = new URLSearchParams(window.location.search)
  const v = (params.get('v') ?? 'A').toUpperCase()
  const s = params.get('s') === 'home' ? 'home' : 'drill'
  return { variant: v === 'B' || v === 'C' ? v : 'A', screen: s }
}

function RedesignBakeoff() {
  const navigate = useNavigate()
  const [state, setState] = useState(initialFromSearch)

  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        /redesign-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }

  const { variant, screen } = state
  // Remount on variant/screen change so each language replays its
  // entrance choreography — the motion IS part of what is being judged.
  const key = `${variant}-${screen}`

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <div key={key}>
        {variant === 'A' && <RedesignA screen={screen} />}
        {variant === 'B' && <RedesignB screen={screen} />}
        {variant === 'C' && <RedesignC screen={screen} />}
      </div>

      <div
        style={{
          position: 'fixed',
          top: 10,
          right: 12,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 8px',
          borderRadius: 8,
          background: 'rgba(20, 20, 18, 0.82)',
          backdropFilter: 'blur(8px)',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: '0.04em',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        {(['A', 'B', 'C'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setState((s) => ({ ...s, variant: v }))}
            title={VARIANT_LABELS[v]}
            style={switcherChip(variant === v)}
          >
            {v}
          </button>
        ))}
        <span style={{ opacity: 0.35 }}>·</span>
        {(['home', 'drill'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState((st) => ({ ...st, screen: s }))}
            style={switcherChip(screen === s)}
          >
            {s === 'home' ? 'Hem' : 'Övning'}
          </button>
        ))}
        <span style={{ opacity: 0.35 }}>·</span>
        <button type="button" onClick={() => navigate({ to: '/' })} style={switcherChip(false)}>
          Klar
        </button>
      </div>
    </div>
  )
}

function switcherChip(active: boolean): React.CSSProperties {
  return {
    appearance: 'none',
    border: 'none',
    borderRadius: 5,
    padding: '4px 8px',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    letterSpacing: 'inherit',
    cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.92)' : 'transparent',
    color: active ? '#14140f' : 'rgba(255,255,255,0.85)',
  }
}
