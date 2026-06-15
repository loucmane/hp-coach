// /redesign-lab — rounds 3 + 4 of the redesign bake-off.
//
// Round 3 (labs 1–6): blind — six studios, the SAME open brief, full
// product context but no reference to any earlier HP-Coach look.
// Finding: 4 of 6 converged on the same warm-print family.
//
// Round 4 (labs 7–14): seeded — eight studios, each anchored to a named
// top-tier service register and asked to translate that service's design
// PHILOSOPHY to HP-Coach (never its trade dress):
//   7 Strava · 8 Apple Fitness+ · 9 Whoop/Oura · 10 Headspace ·
//   11 Linear · 12 NYT Games · 13 Things 3 · 14 Stripe.
//
// Free color in both rounds (owner-approved opening of the color
// system); the winner gets retrofitted to the token palettes afterwards.
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
import { Lab7 } from '@/components/devbake/lab/Lab7'
import { Lab8 } from '@/components/devbake/lab/Lab8'
import { Lab9 } from '@/components/devbake/lab/Lab9'
import { Lab10 } from '@/components/devbake/lab/Lab10'
import { Lab11 } from '@/components/devbake/lab/Lab11'
import { Lab12 } from '@/components/devbake/lab/Lab12'
import { Lab13 } from '@/components/devbake/lab/Lab13'
import { Lab14 } from '@/components/devbake/lab/Lab14'
import type { RedesignScreen } from '@/components/devbake/redesign/fixtures'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/redesign-lab')({
  component: RedesignLab,
})

type LabKey = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14'
const ROUND_4: LabKey[] = ['7', '8', '9', '10', '11', '12', '13', '14']
const ROUND_3: LabKey[] = ['1', '2', '3', '4', '5', '6']
const LABS: LabKey[] = [...ROUND_4, ...ROUND_3]

function initialFromSearch(): { variant: LabKey; screen: RedesignScreen } {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('v') ?? '7'
  const s = params.get('s') === 'home' ? 'home' : 'drill'
  return { variant: LABS.includes(v as LabKey) ? (v as LabKey) : '7', screen: s }
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
        {variant === '7' && <Lab7 screen={screen} />}
        {variant === '8' && <Lab8 screen={screen} />}
        {variant === '9' && <Lab9 screen={screen} />}
        {variant === '10' && <Lab10 screen={screen} />}
        {variant === '11' && <Lab11 screen={screen} />}
        {variant === '12' && <Lab12 screen={screen} />}
        {variant === '13' && <Lab13 screen={screen} />}
        {variant === '14' && <Lab14 screen={screen} />}
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
        {ROUND_4.map((v) => (
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
        {ROUND_3.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setState((s) => ({ ...s, variant: v }))}
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
