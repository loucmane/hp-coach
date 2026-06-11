// /redesign-l12 — round 6 of the redesign bake-off: the L12 round.
//
// The owner picked L12 ("Dagens spalt", NYT Games-seeded) as their
// favorite of all 18 round-2–4 candidates. Round 6 fans out six
// studios, each building a different interpretation of L12's soul
// (typeset italic "Rätt." verdict, book-page pedagogy, one-accent
// restraint) — ALL token-bound this time, judged under the real
// palette + dark switchers:
//
//   M1 · Trogen        — L12 ported to tokens as faithfully as possible
//   M2 · Produktion    — the jury's full ergonomic patch list applied
//   M3 · Boksidan      — F's hairline-axis chassis carrying L12's type
//   M4 · Kvittot       — D's chassis + L13's drawn-check grading,
//                        wearing L12's verdict register
//   M5 · Kvällsutgåvan — dark-first evening edition
//   M6 · Söndagsbilagan— typography escalated further (ornament probe)
//
// Same judging protocol as every round: full-viewport variants, fixed
// switcher, no winner-picker UI — the pick is reported in conversation.
// Dev-gated via isDevSurface().

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { M1 } from '@/components/devbake/l12/M1'
import { M2 } from '@/components/devbake/l12/M2'
import { M3 } from '@/components/devbake/l12/M3'
import { M4 } from '@/components/devbake/l12/M4'
import { M5 } from '@/components/devbake/l12/M5'
import { M6 } from '@/components/devbake/l12/M6'
import type { RedesignScreen } from '@/components/devbake/redesign/fixtures'
import { isDevSurface } from '@/lib/devSurface'
import type { PaletteKey } from '@/lib/tokens'
import { applyThemeToDocument, useUiStore } from '@/stores/uiStore'

export const Route = createFileRoute('/redesign-l12')({
  component: RedesignL12,
})

type MKey = '1' | '2' | '3' | '4' | '5' | '6'
const VARIANTS: MKey[] = ['1', '2', '3', '4', '5', '6']
const PALETTES: PaletteKey[] = ['sand', 'sage', 'ink', 'rose']

const VARIANT_LABELS: Record<MKey, string> = {
  '1': 'Trogen',
  '2': 'Produktion',
  '3': 'Boksidan',
  '4': 'Kvittot',
  '5': 'Kvällsutgåvan',
  '6': 'Söndagsbilagan',
}

function initialFromSearch(): { variant: MKey; screen: RedesignScreen } {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('v') ?? '1'
  const s = params.get('s') === 'home' ? 'home' : 'drill'
  return { variant: VARIANTS.includes(v as MKey) ? (v as MKey) : '1', screen: s }
}

function RedesignL12() {
  const navigate = useNavigate()
  const [state, setState] = useState(initialFromSearch)
  const { palette, mode, font, density, useFluid, setPalette, toggleMode } = useUiStore()

  // Full-bleed outside Frame, so apply the live theme here — every
  // variant in this round is token-bound and must respond to the real
  // palette + dark switch, exactly like production surfaces.
  useEffect(() => {
    applyThemeToDocument(palette, mode, font, density, useFluid)
  }, [palette, mode, font, density, useFluid])

  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        /redesign-l12 is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }

  const { variant, screen } = state
  // Remount on any switch so each variant replays its entrance
  // choreography — the motion IS part of what is being judged.
  const key = `${variant}-${screen}-${palette}-${mode}`

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <div key={key}>
        {variant === '1' && <M1 screen={screen} />}
        {variant === '2' && <M2 screen={screen} />}
        {variant === '3' && <M3 screen={screen} />}
        {variant === '4' && <M4 screen={screen} />}
        {variant === '5' && <M5 screen={screen} />}
        {variant === '6' && <M6 screen={screen} />}
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
        {VARIANTS.map((v) => (
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
