// /dev/nav-cta-bakeoff — steering students to Provpass (and important
// actions generally) without burying them in the Mer-menu or ⌘K.
//
// The owner finds the current burial bad UX. This is a visual-character
// decision, so per the standing rule it gets a live /dev bake-off rather
// than a prose pick. Three placements, each rendered as a real 390px
// phone Home built from the M3 idiom; no product code changes.
//
// Dev-gated via isDevSurface().

import { createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import {
  Caption,
  VariantOvaHub,
  VariantPlanItem,
  VariantStandingCard,
} from '@/components/devbake/NavCtaBakeoff'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/dev_/nav-cta-bakeoff')({
  component: NavCtaBakeoffRoute,
})

function NavCtaBakeoffRoute() {
  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
        /dev/nav-cta-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'color-mix(in oklch, var(--bg) 94%, var(--ink))',
        color: 'var(--ink)',
        padding: 'clamp(24px, 4vw, 56px)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <header style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>●</span>&nbsp; How should students be steered to
          Provpass?
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
          Principle under test: viktiga saker ska synas utan ⌘K (house rule).
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, auto))',
          gap: 40,
          justifyContent: 'start',
          marginTop: 28,
        }}
      >
        <Stage
          tag="V1"
          title="Plan-item"
          note="Provpass as a prescribed row in the numbered daily plan (a scheduler citizen)."
        >
          <VariantPlanItem />
          <Caption>
            Trade-off: highest-context steer — it arrives with a rationale on the right day — but a
            student who never opens Home on a provpass-dag can miss the window entirely.
          </Caption>
        </Stage>

        <Stage
          tag="V2"
          title="Standing Home card"
          note="A permanent PROVPASS section below the plan — last result + house CTA. Always visible."
        >
          <VariantStandingCard />
          <Caption>
            Trade-off: Provpass is always one tap from where you land, never hidden — at the cost of
            a fixed block that competes with the plan for attention on every ordinary day.
          </Caption>
        </Stage>

        <Stage
          tag="V3"
          title="Öva hub"
          note="The bottom-nav drill tab becomes 'Öva', opening a hub: Drilla / Provpass / Diagnostik."
        >
          <VariantOvaHub />
          <Caption>
            Trade-off: gives all three practice modes equal, permanent nav real estate — but adds a
            hop (tab → hub → start) and demotes the plan's prescriptive "do this next" steer.
          </Caption>
        </Stage>
      </div>
    </div>
  )
}

function Stage({
  tag,
  title,
  note,
  children,
}: {
  tag: string
  title: string
  note: string
  children: ReactNode
}) {
  return (
    <section>
      <div style={{ padding: '0 2px 14px' }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 3,
          }}
        >
          <span style={{ color: 'var(--accent)' }}>{tag}</span> · {title}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', maxWidth: 390, lineHeight: 1.4 }}>
          {note}
        </div>
      </div>
      {children}
    </section>
  )
}
