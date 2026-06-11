// /redesign-bakeoff — 2026 redesign bake-off.
//
// Round 2 (owner verdict on round 1: "modern, sleek and clean" + "use
// the color themes we have decided on") — three token-bound sleek
// languages, judged under the REAL palette/dark switchers:
//
//   D · Lumen — quiet precision: all-sans, hairline-or-shadow surfaces,
//       accent in exactly three places, 150-220ms instant-clarity motion.
//   E · Mist  — soft modern: two elevation levels + sheet, pill controls,
//       light type, 320-380ms soft-float motion.
//   F · Axis  — sleek with the brand spine: hairline axis grid, serif
//       reserved for greeting + headword, drafting-table motion.
//
// Round 1 (A · EDITION II, B · Instrument, C · Tactile) kept for
// reference — they invented their own palettes and ignore the switcher.
//
// All variants render the same real corpus content (fixtures.ts) on the
// same two canvases (Hem + Övning). Full-viewport with a fixed switcher;
// no winner-picker UI — the pick is reported in conversation.
// Dev-gated via isDevSurface().

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { RedesignScreen } from '@/components/devbake/redesign/fixtures'
import { RedesignA } from '@/components/devbake/redesign/RedesignA'
import { RedesignB } from '@/components/devbake/redesign/RedesignB'
import { RedesignC } from '@/components/devbake/redesign/RedesignC'
import { RedesignD } from '@/components/devbake/redesign/RedesignD'
import { RedesignE } from '@/components/devbake/redesign/RedesignE'
import { RedesignF } from '@/components/devbake/redesign/RedesignF'
import { isDevSurface } from '@/lib/devSurface'
import type { PaletteKey } from '@/lib/tokens'
import { applyThemeToDocument, useUiStore } from '@/stores/uiStore'

export const Route = createFileRoute('/redesign-bakeoff')({
  component: RedesignBakeoff,
})

type VariantKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

const ROUND_2: VariantKey[] = ['D', 'E', 'F']
const ROUND_1: VariantKey[] = ['A', 'B', 'C']
const PALETTES: PaletteKey[] = ['sand', 'sage', 'ink', 'rose']

const VARIANT_LABELS: Record<VariantKey, string> = {
  A: 'EDITION II (runda 1)',
  B: 'Instrument (runda 1)',
  C: 'Tactile (runda 1)',
  D: 'Lumen',
  E: 'Mist',
  F: 'Axis',
}

function initialFromSearch(): { variant: VariantKey; screen: RedesignScreen } {
  const params = new URLSearchParams(window.location.search)
  const v = (params.get('v') ?? 'D').toUpperCase() as VariantKey
  const s = params.get('s') === 'home' ? 'home' : 'drill'
  return { variant: ROUND_1.includes(v) || ROUND_2.includes(v) ? v : 'D', screen: s }
}

function RedesignBakeoff() {
  const navigate = useNavigate()
  const [state, setState] = useState(initialFromSearch)
  const { palette, mode, font, density, useFluid, setPalette, toggleMode } = useUiStore()

  // The bake-off renders full-bleed outside Frame, so apply the live
  // theme here — token-bound variants (D/E/F) must respond to the real
  // palette + dark switch, exactly like production surfaces.
  useEffect(() => {
    applyThemeToDocument(palette, mode, font, density, useFluid)
  }, [palette, mode, font, density, useFluid])

  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        /redesign-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }

  const { variant, screen } = state
  // Remount on any switch so each language replays its entrance
  // choreography — the motion IS part of what is being judged.
  const key = `${variant}-${screen}-${palette}-${mode}`

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <div key={key}>
        {variant === 'A' && <RedesignA screen={screen} />}
        {variant === 'B' && <RedesignB screen={screen} />}
        {variant === 'C' && <RedesignC screen={screen} />}
        {variant === 'D' && <RedesignD screen={screen} />}
        {variant === 'E' && <RedesignE screen={screen} />}
        {variant === 'F' && <RedesignF screen={screen} />}
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
          background: 'rgba(20, 20, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: '0.04em',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        {ROUND_2.map((v) => (
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
        <span style={{ opacity: 0.3 }}>·</span>
        {ROUND_1.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setState((s) => ({ ...s, variant: v }))}
            title={VARIANT_LABELS[v]}
            style={{ ...switcherChip(variant === v), opacity: variant === v ? 1 : 0.45 }}
          >
            {v}
          </button>
        ))}
        <span style={{ opacity: 0.3 }}>·</span>
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
        <span style={{ opacity: 0.3 }}>·</span>
        {PALETTES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPalette(p)}
            title={`Palett: ${p}`}
            style={switcherChip(palette === p)}
          >
            {p.slice(0, 3)}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleMode}
          title="Växla ljust/mörkt"
          style={switcherChip(mode === 'dark')}
        >
          {mode === 'dark' ? 'mörk' : 'ljus'}
        </button>
        <span style={{ opacity: 0.3 }}>·</span>
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
    padding: '4px 7px',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    letterSpacing: 'inherit',
    cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.92)' : 'transparent',
    color: active ? '#14140f' : 'rgba(255,255,255,0.85)',
  }
}
