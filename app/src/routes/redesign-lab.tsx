// /redesign-lab — round 3 "blind" redesign bake-off.
//
// Six independent studios, each given the SAME open brief — modern,
// cutting edge, state of the art, sleek, functional, and unmistakably a
// top-tier study coach — with full product context but NO reference to
// any earlier HP-Coach look (they may read only the shared fixtures).
// Free color this round (owner-approved opening of the color system);
// the winner gets retrofitted to the token palettes afterwards.
//
// Lives on its own route so /redesign-bakeoff stays clean as the
// round-1/2 record. Same judging protocol: full-viewport variants,
// fixed switcher, no winner-picker UI — the pick is reported in
// conversation. Dev-gated via isDevSurface().

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Lab1 } from '@/components/devbake/lab/Lab1'
import { Lab2 } from '@/components/devbake/lab/Lab2'
import { Lab3 } from '@/components/devbake/lab/Lab3'
import { Lab4 } from '@/components/devbake/lab/Lab4'
import { Lab5 } from '@/components/devbake/lab/Lab5'
import { Lab6 } from '@/components/devbake/lab/Lab6'
import type { RedesignScreen } from '@/components/devbake/redesign/fixtures'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/redesign-lab')({
  component: RedesignLab,
})

type LabKey = '1' | '2' | '3' | '4' | '5' | '6'
const LABS: LabKey[] = ['1', '2', '3', '4', '5', '6']

function initialFromSearch(): { variant: LabKey; screen: RedesignScreen } {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('v') ?? '1'
  const s = params.get('s') === 'home' ? 'home' : 'drill'
  return { variant: LABS.includes(v as LabKey) ? (v as LabKey) : '1', screen: s }
}

function RedesignLab() {
  const navigate = useNavigate()
  const [state, setState] = useState(initialFromSearch)

  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        /redesign-lab is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }

  const { variant, screen } = state
  // Remount on switch so each studio's entrance choreography replays.
  const key = `${variant}-${screen}`

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <div key={key}>
        {variant === '1' && <Lab1 screen={screen} />}
        {variant === '2' && <Lab2 screen={screen} />}
        {variant === '3' && <Lab3 screen={screen} />}
        {variant === '4' && <Lab4 screen={screen} />}
        {variant === '5' && <Lab5 screen={screen} />}
        {variant === '6' && <Lab6 screen={screen} />}
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
        {LABS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setState((s) => ({ ...s, variant: v }))}
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
