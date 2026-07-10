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
import type { CSSProperties, ReactNode } from 'react'

import {
  Caption,
  StudyBokmarke,
  StudyKallelse,
  StudyStatusStat,
  V4aFinalDesktop,
  V4aFinalPhone,
  VariantOvaHub,
  VariantPlanItem,
  VariantPrescribedConsensus,
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
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
          V4 = 4-specialist panel consensus (ADHD-behavioral / IA / pedagogy / devil's advocate), 2
          rounds.
        </div>
      </header>

      {/* ── V4A FINAL — the leading candidate, first thing the owner sees ── */}
      <section
        style={{
          marginTop: 36,
          paddingBottom: 40,
          borderBottom: '1px solid color-mix(in oklch, var(--ink) 14%, transparent)',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--accent)' }}>★</span>&nbsp; V4A FINAL · Kallelsen färgad
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              marginTop: 6,
              maxWidth: 760,
              lineHeight: 1.5,
            }}
          >
            The synthesis the owner asked for: V4a's DOCUMENT GRAMMAR (the rules-only summons above
            the plan, KALLELSE · PROVPASS eyebrow, serif "Verbal · 55 minuter") carrying V4c's COLOR
            VOICE (the accent-soft band). STARTA is now the day's primary action — the owner found
            V4a's original too quiet.
          </div>
          <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>
            Shipped treatment: accent-soft fill + solid accent STARTA pill (see caption below).
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 44,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            marginTop: 24,
          }}
        >
          <div>
            <div style={{ ...stageLabel, marginBottom: 12 }}>
              <span style={{ color: 'var(--accent)' }}>PHONE</span> · 390px
            </div>
            <V4aFinalPhone treatment="filled" />
            <Caption>
              Provpass-dag: the colored kallelse arrives above the plan as an accent-soft notice
              (letterpress accent top-rule kept), and the plan shrinks to its one remaining item.
              Vanlig dag: no kallelse — the passive PROVPASS status line stands in.
            </Caption>
          </div>

          <div style={{ flex: '1 1 640px', minWidth: 0 }}>
            <div style={{ ...stageLabel, marginBottom: 12 }}>
              <span style={{ color: 'var(--accent)' }}>DESKTOP</span> · 1200px · rail + Boksidan
              margin-rail
            </div>
            <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
              <V4aFinalDesktop />
            </div>
            <Caption>
              The REAL desktop Home: a 224px sticky NavRail (brand, nav with the active cobalt
              left-rule + live signals, cross-device resume band, countdown, ljus ◐ · historik · mer
              →) beside the Boksidan reading column, where every section is a margin-rail grid
              (label | spine | content), not the phone's stacked eyebrow. The colored kallelse gets
              its own KALLELSE rail section above Dagens plan.
            </Caption>
          </div>
        </div>

        <Caption>
          Synthesizes V4a's document grammar (kallelse notice, rules/letterpress top) with V4c's
          color voice (accent-soft fill). Each artboard carries its OWN provpass-dag / vanlig-dag
          toggle so phone and desktop can be judged in either state independently.
        </Caption>
      </section>

      <div style={{ marginTop: 40, marginBottom: 8 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--muted-2)' }}>▽</span>&nbsp; Earlier candidates (for
          reference)
        </div>
      </div>

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

        <Stage
          tag="V4"
          title="Prescribed + passive line + confirm"
          note="Panel consensus: mock is the plan ANCHOR on a provpass-dag, a passive status line keeps the door visible daily, and a confirm sheet protects the start."
        >
          <VariantPrescribedConsensus />
          <Caption>
            Note: V4's Home renders WITHOUT the "6 dagar i rad" streak stat — the panel found the
            streak violates the product's own no-streak-shame rule; the stats row shows prognos +
            min idag only.
          </Caption>
          <Caption>
            The status line is a READOUT, not a CTA (no verb, no arrow-as-CTA); a full-row tap opens
            a detail sheet with history + a quiet start path. Tapping the plan row opens the confirm
            sheet BEFORE any clock — a pre-commitment device; a mis-timed impulsive start voids the
            mock (ADHD-PI impulsivity protection).
          </Caption>
          <Caption>
            Consensus: the plan decides the day, the confirm sheet protects the start, the line
            keeps the door visible — bets everything on scheduler trust.
          </Caption>
        </Stage>
      </div>

      <section style={{ marginTop: 64 }}>
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: 'var(--accent)' }}>◆</span>&nbsp; V4 layout studies
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
            Same mechanics, three compositions — pick by eye. The idiom and the mechanics are fixed;
            only WHERE the provpass anchor lives and HOW loudly it speaks changes.
          </div>
        </div>

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
            tag="V4a"
            title="Kallelsen"
            note="On a provpass-dag the mock is a distinct summons block ABOVE the plan — a printed kallelse notice, rules only, no fill. The plan shrinks behind it."
          >
            <StudyKallelse />
          </Stage>

          <Stage
            tag="V4b"
            title="Status-as-stat"
            note="The status readout becomes a fourth stat (nästa provpass); the anchor row drops the fill for a 2px cobalt margin rule."
          >
            <StudyStatusStat />
          </Stage>

          <Stage
            tag="V4c"
            title="Bokmärket"
            note="One element carries the state: a full-width band at the page's end that inverts on a provpass-dag. The plan stays a normal 3-item plan."
          >
            <StudyBokmarke />
          </Stage>
        </div>
      </section>
    </div>
  )
}

const stageLabel: CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
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
