// /home-bakeoff — Home redesign bake-off.
//
// Two variants of the whole Home composition rendered side-by-side at
// studio (stacked at phone), so the dogfood user can compare current
// versus proposed before any production code is touched.
//
//   A · Current   — faithful snapshot of HomeMobile today.
//   B · Proposed  — design agent's redesign: one mono kicker, focal
//                   greeting, no sigil, demoted traps below the plan.
//
// Mirrors /loop-bakeoff verbatim: dev-gated via isDevSurface(), real
// React components rendering real output with fixture data, no
// winner-picker UI — the user reports the pick in conversation.
//
// After the user picks, a single follow-up PR ports the winning
// composition into the live HomeMobile + supporting components.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { HomeVariantA } from '@/components/devbake/HomeVariantA'
import { HomeVariantB } from '@/components/devbake/HomeVariantB'
import { HomeVariantC } from '@/components/devbake/HomeVariantC'
import { HomeVariantD } from '@/components/devbake/HomeVariantD'
import { HomeVariantE } from '@/components/devbake/HomeVariantE'
import { MobileFrame } from '@/components/MobileFrame'
import { Btn, Eyebrow, Hairline, Mono } from '@/components/primitives'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/home-bakeoff')({
  component: HomeBakeoff,
})

function HomeBakeoff() {
  const navigate = useNavigate()
  const dev = isDevSurface()

  if (!dev) {
    return (
      <MobileFrame tabs={false}>
        <div
          style={{
            minHeight: '100%',
            padding: '40px 24px',
            color: 'var(--ink)',
            fontFamily: 'var(--font-display)',
            fontSize: 16,
          }}
        >
          /home-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
        </div>
      </MobileFrame>
    )
  }

  return (
    <MobileFrame tabs={false}>
      <div
        style={{
          minHeight: '100%',
          padding: 'clamp(20px, 3vw, 40px) clamp(16px, 3vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          color: 'var(--ink)',
          overflow: 'auto',
        }}
      >
        <Header onClose={() => navigate({ to: '/' })} />

        <Hairline />

        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Eyebrow>Hem · ren och professionell</Eyebrow>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 1.4vw + 14px, 30px)',
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
                color: 'var(--ink)',
              }}
            >
              Home redesign bake-off.
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(14px, 0.4vw + 13px, 16px)',
                lineHeight: 1.5,
                color: 'var(--ink-2)',
                maxWidth: '70ch',
              }}
            >
              Tre varianter av hela Home-kompositionen. A är dagens layout. B följer första
              designanalysen: en mono-rad i toppen, fokal hälsning, ingen sigil, fällor demoterade
              under planen. C följer andra designspecialistens kritik — promoterad hero-poäng (56px
              Newsreader display tabular-nums), day-shape state-rad, 2-kolumns ScoreBlock+Plan,
              samma demoterade fällor. Alla renderas med samma fixturdata.
            </p>
          </div>

          {/* Stacked vertical layout — each variant gets full canvas
           *  width so the composition can be judged at production
           *  fidelity (was a 3-column grid that squeezed each variant
           *  to ~400px; impossible to read whole-screen layouts at
           *  that width). */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(40px, 4vw, 64px)',
            }}
          >
            <VariantCard label="Dagens layout (kontroll)" recipeKey="A">
              <HomeVariantA />
            </VariantCard>
            <VariantCard label="Demoterad metadata + fokal hälsning" recipeKey="B">
              <HomeVariantB />
            </VariantCard>
            <VariantCard label="Hero-poäng + day-shape + 2-kolumn" recipeKey="C">
              <HomeVariantC />
            </VariantCard>
            <VariantCard label="Marginalia-rail + Raycast-prioriterat första objekt" recipeKey="D">
              <HomeVariantD />
            </VariantCard>
            <VariantCard label="Radikal reduktion — Home som verb, inte dashboard" recipeKey="E">
              <HomeVariantE />
            </VariantCard>
          </div>
        </section>
      </div>
    </MobileFrame>
  )
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Mono>Phase B · Home redesign bake-off</Mono>
        <Btn variant="ghost" size="sm" onClick={onClose}>
          Klar
        </Btn>
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 2vw + 20px, 44px)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        Home redesign bake-off
      </h1>
    </div>
  )
}

function VariantCard({
  label,
  recipeKey,
  children,
}: {
  label: string
  recipeKey: 'A' | 'B' | 'C' | 'D' | 'E'
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Mono style={{ color: 'var(--accent)' }}>
          Variant {recipeKey} · {label}
        </Mono>
      </div>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  )
}
