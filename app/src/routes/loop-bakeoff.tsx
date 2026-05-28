// /loop-bakeoff — Loop polish variant gallery.
//
// Sibling of /explanation-bake-off. Three categories of candidate
// polish moves rendered side-by-side at production fidelity, so the
// dogfood user picks winners in the browser before any production
// code is touched. After the user reports the winners, one follow-up
// PR per category implements only what won.
//
// Categories:
//   1. End-of-session payoff — three variants of the post-drill
//      screen (today's control / "Klart." prototype / "Klart." +
//      score delta + tomorrow preview).
//   2. Home daily-progress indicator — three variants of the top-
//      right slot (current StreakBadge / quarter-arc sigil /
//      stroke-fill underline).
//   3. Consistency over time — two variants (none / 12-week heat
//      strip).
//
// Self-gated via isDevSurface() so the route is hidden in pure prod
// preview. Mirrors the /explanation-bake-off pattern verbatim:
// 3-column grid at studio width, stacked at reader/phone, no winner-
// picker UI — the user reports the pick in conversation.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { HeatStripA } from '@/components/devbake/HeatStripA'
import { HeatStripB } from '@/components/devbake/HeatStripB'
import { HeatStripC } from '@/components/devbake/HeatStripC'
import { HomeSigilA } from '@/components/devbake/HomeSigilA'
import { HomeSigilB } from '@/components/devbake/HomeSigilB'
import { HomeSigilC } from '@/components/devbake/HomeSigilC'
import { HomeSigilD } from '@/components/devbake/HomeSigilD'
import { PayoffVariantA } from '@/components/devbake/PayoffVariantA'
import { PayoffVariantB } from '@/components/devbake/PayoffVariantB'
import { PayoffVariantC } from '@/components/devbake/PayoffVariantC'
import { PayoffVariantD } from '@/components/devbake/PayoffVariantD'
import { MobileFrame } from '@/components/MobileFrame'
import { Btn, Eyebrow, Hairline, Mono } from '@/components/primitives'
import { useViewport } from '@/hooks/useViewport'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/loop-bakeoff')({
  component: LoopBakeoff,
})

function LoopBakeoff() {
  const navigate = useNavigate()
  const viewport = useViewport()
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
          /loop-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
        </div>
      </MobileFrame>
    )
  }

  const isStudio = viewport === 'studio'

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
        <Category
          eyebrow="Kategori 1 · Slutskärm efter pass"
          title="End-of-session payoff."
          subcopy="Skärmen efter ett klart pass. Variant A är dagens kontroll; B följer den ursprungliga prototypen (`Klart.` + statskort); C lägger på poängdelta + 'imorgon väntar'."
          isStudio={isStudio}
          variants={[
            {
              key: 'A',
              label: 'Dagens DrillResult',
              recipe: 'kontroll · stora siffror · misslista',
              node: <PayoffVariantA />,
            },
            {
              key: 'B',
              label: 'Klart. (prototypen)',
              recipe: '`Klart.` · CoachLine · statskort · Stäng',
              node: <PayoffVariantB />,
            },
            {
              key: 'C',
              label: 'Klart. + delta + imorgon',
              recipe: 'B + poängdelta-animering + imorgon-rad',
              node: <PayoffVariantC />,
            },
            {
              key: 'D',
              label: 'Direktörens C, raffinerat',
              recipe:
                'C + FÄLLA-eyebrow · Hairline-divider · 1100ms delta-tween · reduced-motion · pass-slut som folio · Esc-affordance',
              node: <PayoffVariantD />,
              director: true,
            },
          ]}
        />

        <Hairline />
        <Category
          eyebrow="Kategori 2 · Indikator uppe till höger"
          title="Home progress indicator."
          subcopy="Slot uppe till höger i Home-headern. A är dagens StreakBadge (kontroll); B är en typografisk fjärdedelsbåge som fylls i takt med plan-items; C är ett vågrätt streck under headern som fylls vänster-till-höger."
          isStudio={isStudio}
          variants={[
            {
              key: 'A',
              label: 'StreakBadge (kontroll)',
              recipe: 'mono badge · "14 dagar" · ingen progress-koppling',
              node: <HomeSigilA />,
            },
            {
              key: 'B',
              label: 'Fjärdedelsbåge',
              recipe: 'editorial båge · N segment · "klart"-flourish vid 4/4',
              node: <HomeSigilB />,
            },
            {
              key: 'C',
              label: 'Strecket',
              recipe: 'tunt vågrätt streck · fylls L→R · ingen "stäng"-effekt',
              node: <HomeSigilC />,
            },
            {
              key: 'D',
              label: 'Direktörens streck, raffinerat',
              recipe:
                'C med 1px-regel · italic marginalia · zero-state-prompt · 520ms reading-pace · `klart`-flourish absorberat från B',
              node: <HomeSigilD />,
              director: true,
            },
          ]}
        />

        <Hairline />
        <Category
          eyebrow="Kategori 3 · Långbågesignal på /progress"
          title="Consistency over time."
          subcopy="GitHub-style heatmap eller ingenting alls. Variant A är 'pickas om streak-siffran räcker'. Variant B är ett 12-veckors dotgrid över aktivitetsdagar. B kräver en worker-ändring för dagliga försök-räkningar; bake-off:n renderar med fixtures så du dömer formen först."
          isStudio={isStudio}
          variants={[
            {
              key: 'A',
              label: 'Ingen visualisering',
              recipe: 'sparar UI-yta och worker-arbete · kontroll',
              node: <HeatStripA />,
            },
            {
              key: 'B',
              label: '12-veckors heatmap',
              recipe: '12×7 grid · fyra intensitetsnivåer · single-color',
              node: <HeatStripB />,
            },
            {
              key: 'C',
              label: 'Direktörens B, raffinerat',
              recipe:
                'B med accent-ramp via color-mix · verbal/kvant-staplad · månadseyebrows · "längsta serie"-summering · hover/focus-outline',
              node: <HeatStripC />,
              director: true,
            },
          ]}
        />
      </div>
    </MobileFrame>
  )
}

// ── Header ───────────────────────────────────────────────────────────

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Mono>Phase B · Loop polish bake-off</Mono>
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
        Loop polish bake-off
      </h1>
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.5vw + 14px, 18px)',
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          maxWidth: '60ch',
        }}
      >
        Tre kategorier, varje med 2–3 varianter renderade med riktiga komponenter (inte mockups).
        Läs igenom alla, picka en vinnare per kategori. "A · kontroll" är en giltig pick — då hoppar
        vi implementations-PR:en. Vinnarna kör i en separat PR per kategori.
      </p>
    </div>
  )
}

// ── Category section ─────────────────────────────────────────────────

type CategoryVariant = {
  key: 'A' | 'B' | 'C' | 'D'
  label: string
  recipe: string
  node: React.ReactNode
  /** Optional accent — surfaces "this column is the design-director's
   *  refined read" so it stands out from the original A/B/C trio. */
  director?: boolean
}

function Category({
  eyebrow,
  title,
  subcopy,
  variants,
  isStudio,
}: {
  eyebrow: string
  title: string
  subcopy: string
  variants: CategoryVariant[]
  isStudio: boolean
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
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
          {title}
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
          {subcopy}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isStudio ? `repeat(${variants.length}, 1fr)` : '1fr',
          gap: 'clamp(20px, 2vw, 32px)',
        }}
      >
        {variants.map((v) => (
          <VariantCard key={v.key} variant={v} />
        ))}
      </div>
    </section>
  )
}

function VariantCard({ variant }: { variant: CategoryVariant }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        // Director column gets a subtle paper-grain treatment: an
        // ink-2 hairline along the top edge and a slight padding-top
        // bump, so the "this is the refined read" column stands out
        // from the original A/B/C trio without shouting.
        paddingTop: variant.director ? 14 : 0,
        borderTop: variant.director ? '2px solid var(--ink)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Mono style={{ color: variant.director ? 'var(--ink)' : 'var(--accent)' }}>
          {variant.director
            ? `→ Variant ${variant.key} · ${variant.label}`
            : `Variant ${variant.key} · ${variant.label}`}
        </Mono>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {variant.recipe}
      </div>
      <div style={{ marginTop: 6 }}>{variant.node}</div>
    </div>
  )
}
