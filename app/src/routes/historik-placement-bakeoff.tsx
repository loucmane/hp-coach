// /historik-placement-bakeoff — where should "Tidigare pass" (drill
// history) live? Owner: "it might be a bit hidden if it's in Mer."
//
// Four candidates for the ENTRY POINT, each mocked on the surface it
// would live on. The tools Diagnostik/Avancerat/Feedback stay in Mer
// (they're utilities); this is only about the history journal, which is
// progress-reflection, not a setting.
//
//   A · FRAMSTEG-SEKTION  a "Tidigare pass" rail section ON /progress,
//                         recent passes listed inline (not a link out).
//   B · HEM-REMSA         a compact "senaste passen" strip on Home, where
//                         you land — surfaces it without a click.
//   C · RÄLS-LÄNK         a quiet "historik →" link under Framsteg in the
//                         nav rail (one tap from anywhere, low weight).
//   D · MER (nuvarande)   baseline — the buried tools-list entry.
//
// Dev-gated.

import { createFileRoute } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/historik-placement-bakeoff')({
  component: PlacementBakeoff,
})

const PASSES = [
  { tag: 'ORD', score: '8/10', when: 'idag' },
  { tag: 'KVA', score: '6/10', when: 'idag' },
  { tag: 'Repetition', score: '5/8', when: 'igår' },
  { tag: 'XYZ', score: '9/10', when: '3 jul' },
]

function PlacementBakeoff() {
  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        Dev-only. Append <code>?dev=1</code>.
      </div>
    )
  }
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'color-mix(in oklch, var(--bg) 94%, var(--ink))',
        color: 'var(--ink)',
        padding: '20px clamp(16px, 3vw, 40px) 80px',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <header style={{ ...eyebrow, marginBottom: 20 }}>
        <strong>
          <span style={{ color: 'var(--accent)' }}>●</span>&nbsp; Var ska "Tidigare pass" bo?
        </strong>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
        }}
      >
        <Stage tag="A" title="Framsteg-sektion" note="Inne i /progress, passen listade direkt">
          <FramstegMock />
        </Stage>
        <Stage tag="B" title="Hem-remsa" note="Där du landar — syns utan klick">
          <HomeMock />
        </Stage>
        <Stage tag="C" title="Räls-länk" note="Under Framsteg i navigeringen">
          <RailMock />
        </Stage>
        <Stage tag="D" title="Mer (nuvarande)" note="Baslinjen — dagens gömda plats">
          <MerMock />
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
      <div style={{ padding: '0 2px 10px' }}>
        <div style={{ ...eyebrow, marginBottom: 3 }}>
          <span style={{ color: 'var(--accent)' }}>{tag}</span> · {title}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{note}</div>
      </div>
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--hairline)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 12px 32px -18px rgba(0,0,0,0.25)',
          height: 460,
        }}
      >
        {children}
      </div>
    </section>
  )
}

// ── shared bits ────────────────────────────────────────────────────

const eyebrow: CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

function PassRow({ tag, score, when }: { tag: string; score: string; when: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        padding: '11px 0',
        borderBottom: '1px solid var(--hairline-2)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="hpc-m3-tag">{tag}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500 }}>
          {score}
        </span>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>rätt</span>
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>
        {when} →
      </span>
    </div>
  )
}

function ScreenTitle({ eyebrow: eb, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <div style={{ ...eyebrow, color: 'var(--muted)', fontSize: 10 }}>{eb}</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 30,
          marginTop: 4,
        }}
      >
        {title}
      </div>
    </>
  )
}

const railSection: CSSProperties = {
  borderTop: '1px solid var(--hairline)',
  paddingTop: 14,
  marginTop: 20,
}
const railMeta: CSSProperties = {
  ...eyebrow,
  fontSize: 9.5,
  color: 'var(--muted)',
  marginBottom: 8,
}

// ── A · Framsteg with a Tidigare-pass section ──────────────────────

function FramstegMock() {
  return (
    <div style={{ padding: '22px 20px', height: '100%', overflow: 'hidden' }}>
      <ScreenTitle eyebrow="Framsteg" title="1,41 av 2,0" />
      <div style={railSection}>
        <div style={railMeta}>Sektioner</div>
        <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>ORD 1,52 · KVA 1,47 · …</div>
      </div>
      <div style={{ ...railSection, borderColor: 'var(--accent)' }}>
        <div style={{ ...railMeta, color: 'var(--accent)' }}>Tidigare pass ★</div>
        {PASSES.slice(0, 3).map((p) => (
          <PassRow key={p.tag + p.when} {...p} />
        ))}
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>alla pass →</div>
      </div>
    </div>
  )
}

// ── B · Home strip ─────────────────────────────────────────────────

function HomeMock() {
  return (
    <div style={{ padding: '22px 20px', height: '100%', overflow: 'hidden' }}>
      <ScreenTitle eyebrow="Hem" title="God morgon." />
      <div style={railSection}>
        <div style={railMeta}>Dagens plan</div>
        <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>1. ORD-övning · 2. Repetition</div>
      </div>
      <div style={{ ...railSection, borderColor: 'var(--accent)' }}>
        <div style={{ ...railMeta, color: 'var(--accent)' }}>Senaste passen ★</div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'hidden' }}>
          {PASSES.slice(0, 3).map((p) => (
            <div
              key={p.tag + p.when}
              style={{
                flex: '0 0 auto',
                border: '1px solid var(--hairline)',
                borderRadius: 8,
                padding: '10px 12px',
                minWidth: 84,
              }}
            >
              <div className="hpc-m3-tag">{p.tag}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginTop: 4 }}>
                {p.score}
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>{p.when}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── C · Nav-rail link ──────────────────────────────────────────────

function RailMock() {
  const links = ['Hem', 'Övning', 'Lektion', 'Framsteg']
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div
        style={{
          width: 150,
          borderRight: '1px solid var(--hairline)',
          padding: '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15 }}>
          ⌜ HP-Coach
        </div>
        {links.map((l) => (
          <div
            key={l}
            style={{
              ...eyebrow,
              fontSize: 11,
              color: l === 'Framsteg' ? 'var(--ink)' : 'var(--muted-2)',
            }}
          >
            {l}
          </div>
        ))}
        {/* the candidate: a quiet sub-link under Framsteg */}
        <div
          style={{
            ...eyebrow,
            fontSize: 10,
            color: 'var(--accent)',
            paddingLeft: 12,
            marginTop: -6,
          }}
        >
          historik → ★
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ ...eyebrow, fontSize: 10, color: 'var(--muted)' }}>ljus ◐ · mer →</div>
      </div>
      <div style={{ flex: 1, padding: '22px 18px' }}>
        <ScreenTitle eyebrow="Framsteg" title="1,41" />
      </div>
    </div>
  )
}

// ── D · Mer (current baseline) ─────────────────────────────────────

function MerMock() {
  const tools = ['Tidigare pass', 'Diagnostik', 'Avancerat', 'Feedback']
  return (
    <div style={{ padding: '22px 20px', height: '100%', overflow: 'hidden' }}>
      <ScreenTitle eyebrow="Mer" title="Inställningar." />
      <div style={railSection}>
        <div style={railMeta}>Inställningar</div>
        <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>Palett · Läge · Coach</div>
      </div>
      <div style={railSection}>
        <div style={railMeta}>Verktyg</div>
        {tools.map((t, i) => (
          <div
            key={t}
            style={{
              display: 'flex',
              gap: 10,
              padding: '9px 0',
              borderBottom: '1px solid var(--hairline-2)',
              color: t === 'Tidigare pass' ? 'var(--accent)' : 'var(--ink-2)',
              fontSize: 13,
            }}
          >
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>{i + 1}.</span>
            {t}
            {t === 'Tidigare pass' && <span> ★</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
