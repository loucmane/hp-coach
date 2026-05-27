// /elevation-bakeoff — Specialist-B vision preview.
//
// Sibling of /loop-bakeoff. Stages the "top-tier shop inherits HP-Coach
// for 4 weeks" elevation plan as live side-by-side previews so the
// dogfood user can envision the direction before committing. Each
// category renders the current production composition next to a
// hand-coded preview of the elevated version. Plus a live page-turn
// demo for the signature interaction.
//
// Categories (top to bottom, biggest visual impact first):
//   1. The Folio Turn — live page-turn demo (the SIGNATURE)
//   2. Running-head edition numbering
//   3. Home masthead block (current 6-element kicker stack → 3 elements)
//   4. /progress chapter-opener numerals
//   5. /lektion TrapCard: drop-cap + hanging-indent masthead
//   6. ConsistencyHeat + paired epigraph
//   7. Klart. CoachLine as editorial pull-quote
//   8. Typography spec sheet (what the system looks like rendered)
//
// Self-gated via isDevSurface(). Mirrors the /loop-bakeoff chrome.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { FolioTurnDemo } from '@/components/devbake/elevation/FolioTurnDemo'
import { HeatmapEpigraph } from '@/components/devbake/elevation/HeatmapEpigraph'
import { KlartPull } from '@/components/devbake/elevation/KlartPull'
import { MastheadHome } from '@/components/devbake/elevation/MastheadHome'
import { RunningHeadEdition } from '@/components/devbake/elevation/RunningHeadEdition'
import { SectionRowsProgress } from '@/components/devbake/elevation/SectionRowsProgress'
import { TrapCardDropCap } from '@/components/devbake/elevation/TrapCardDropCap'
import { TypographySpec } from '@/components/devbake/elevation/TypographySpec'
import { MobileFrame } from '@/components/MobileFrame'
import { Btn, Eyebrow, Hairline, Mono } from '@/components/primitives'
import { useViewport } from '@/hooks/useViewport'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/elevation-bakeoff')({
  component: ElevationBakeoff,
})

function ElevationBakeoff() {
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
          /elevation-bakeoff is dev-only. Append <code>?dev=1</code> to opt in.
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
          gap: 36,
          color: 'var(--ink)',
          overflow: 'auto',
        }}
      >
        <Header onClose={() => navigate({ to: '/' })} />

        <Hairline />
        <Category
          eyebrow="Kategori 1 · The Folio Turn"
          title="Page-turn between routes."
          subcopy="Signaturen. Klicka knappen för att se vad övergången från ett spread till nästa skulle kännas som. 320ms reading-curve, leaving page tappar 8% opacity och rullar 0.5° + 12px höger; arriving page speglar. Inte ett kortflipp, inte en slide — en sida som vänds i en bok."
          isStudio={isStudio}
        >
          <FolioTurnDemo />
        </Category>

        <Hairline />
        <Category
          eyebrow="Kategori 2 · Edition numbering"
          title="The running head counts."
          subcopy="Idag säger top-banden 'HP-COACH · LEKTION'. Elevated: 'EDITION III · SPREAD 04 · LEKTION'. Edition mappar mot ditt provtillfälle (höst-26 = III, vår-27 = IV); spread är sektionens nummer. Banden börjar räkna."
          isStudio={isStudio}
        >
          <RunningHeadEdition />
        </Category>

        <Hairline />
        <Category
          eyebrow="Kategori 3 · Home masthead"
          title="6 element → 3."
          subcopy="Idag staplar headern 5 mono-kickers + sigil + greeting + score-line. Elevated: dateline (date), italic sub-deck (days + phase merged), och roterande marginalia på höger sida (diagnostik+visit). Sigilen får andas. Greeting blir det första ögat landar på."
          isStudio={isStudio}
        >
          <MastheadHome />
        </Category>

        <Hairline />
        <Category
          eyebrow="Kategori 4 · /progress chapter-openers"
          title="01 · XYZ · 02 · KVA."
          subcopy="Section-raderna idag läser som Excel: bokstäver vänster, score höger. Elevated: kapitelnumrerade — '01 · XYZ' i small-caps mono med score som editorial-numret på höger sida. Tabellen blir en innehållsförteckning."
          isStudio={isStudio}
        >
          <SectionRowsProgress />
        </Category>

        <Hairline />
        <Category
          eyebrow="Kategori 5 · /lektion editorial"
          title="Drop-cap + hanging indent."
          subcopy="Trap-korten idag är välkomponerade men SaaS-täta. Elevated: section-bokstäverna på `--type-pull-quote`-skala med subline hängande in i vänstermarginalen (text-indent), plus en riktig drop-cap på första stycket av why_it_occurs (Newsreader 5× line-height). Sidor i en bok om mönster."
          isStudio={isStudio}
        >
          <TrapCardDropCap />
        </Category>

        <Hairline />
        <Category
          eyebrow="Kategori 6 · Heatmap + epigraph"
          title="Datan får en titelsida."
          subcopy="Heatmap-strippen är fin men flyter. Elevated: vid studio-bredd paras den med en handsatt epigraf till höger — en enda mening om vad serien betyder. Apple Fitness-register: stilla, deklarativt, aldrig hype."
          isStudio={isStudio}
        >
          <HeatmapEpigraph />
        </Category>

        <Hairline />
        <Category
          eyebrow="Kategori 7 · Klart. CoachLine"
          title="Citat och attribution."
          subcopy="CoachLine idag visar en mening, kapad vid första punkten. Elevated: två rader — citatet som body, sedan en 11px mono-kicker som attribuerar mönstret som lärdes ('— FÄLLAN · stacked-fraction inversion'). Quote + attribution."
          isStudio={isStudio}
        >
          <KlartPull />
        </Category>

        <Hairline />
        <Category
          eyebrow="Kategori 8 · Typography spec"
          title="Systemet, renderat."
          subcopy="Inte en variant att picka — visar bara vad typsystemet skulle se ut som om vi extraherade rollerna till primitives. Display 1–4, Body Editorial, Marginalia, Folio, Eyebrow. En docs/typography.md-sida som dogfood-användaren skannar på 30 sekunder."
          isStudio={isStudio}
        >
          <TypographySpec />
        </Category>
      </div>
    </MobileFrame>
  )
}

// ── Header ───────────────────────────────────────────────────────────

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Mono>Specialist B · Elevation preview</Mono>
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
        Hur skulle elevation-planen kännas?
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
        Sju surface-jämförelser + ett system-spec, en kategori per signatur-rörelse i Specialist B:s
        plan. Vänster sida av varje preview är dagens produktion; höger sida är den eleverade
        versionen. Klicka Folio Turn-demon för att känna sidvändningen. När du sett allt, säg om vi
        ska bygga det.
      </p>
    </div>
  )
}

// ── Category section ─────────────────────────────────────────────────

function Category({
  eyebrow,
  title,
  subcopy,
  children,
}: {
  eyebrow: string
  title: string
  subcopy: string
  isStudio: boolean
  children: React.ReactNode
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
      <div style={{ marginTop: 8 }}>{children}</div>
    </section>
  )
}
