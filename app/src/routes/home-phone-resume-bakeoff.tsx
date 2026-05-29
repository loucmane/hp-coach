// /home-phone-resume-bakeoff — phone resumption-surface bake-off.
//
// Cross-device resume now works (xdevice #119/#120), but the Home
// resumption panel renders at studio width only — a phone user has no
// "Fortsätt här" surface. This is the one visual-character decision in
// the feature, so per the standing rule it gets a live /dev bake-off
// rather than a prose pick.
//
// Three in-situ treatments of a paused-drill resumption on the phone
// Home, each rendered inside a 390px artboard with the real masthead
// (mono kicker + greeting) and a stub plan card so the placement reads:
//
//   A · Warm block   (UX)     — full editorial block (eyebrow + display
//                               headline + marginalia + Sage CTA) above
//                               the daily plan. Frames resume as primary.
//   B · Chrome line  (Design) — one mono line under the kicker, framed by
//                               hairlines. Pure chrome, no block; quietest.
//   C · Compact hybrid        — a two-line Sage-led line between greeting
//                               and plan. Present, but lighter than A.
//
// Dev-gated via isDevSurface(). Real components + fixture data; no
// winner-picker UI — the user reports the pick. After the pick, a
// follow-up PR ports the winner into HomeMobile's phone branch.

import { createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/home-phone-resume-bakeoff')({
  component: PhoneResumeBakeoff,
})

// ── Fixture: a drill paused yesterday on a tablet, at Q3 of 10 ──────
const MOCK = {
  eyebrowTime: 'Igår · 19:42',
  device: 'surfplatta',
  headline: 'ORD-övning · pausad',
  progress: 'vid fråga 3 av 10',
  href: '/drill?section=ORD&qid=mock',
}

const SAGE = 'var(--accent)'
const MONO_TRACK = 'var(--font-mono-track, 0.08em)'

function PhoneResumeBakeoff() {
  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
        /home-phone-resume-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #efeae0)',
        padding: 'clamp(24px, 4vw, 56px)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <Variant
        label="A · Warm block (UX)"
        note="Full editorial block above the plan — resume as the primary morning action."
      >
        <Masthead />
        <Greeting />
        <WarmBlock />
        <StubPlan />
      </Variant>

      <Variant
        label="B · Chrome line (Design)"
        note="One mono line under the kicker, framed by hairlines. Quietest — pure chrome, no block."
      >
        <Masthead chromeLine />
        <Greeting />
        <StubPlan />
      </Variant>

      <Variant
        label="C · Compact hybrid"
        note="A two-line Sage-led line between greeting and plan. More present than B, lighter than A."
      >
        <Masthead />
        <Greeting />
        <CompactHybrid />
        <StubPlan />
      </Variant>
    </div>
  )
}

// ── Artboard + shared scaffold ──────────────────────────────────────

function Variant({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <div style={{ width: 390 }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: MONO_TRACK,
          textTransform: 'uppercase',
          color: 'var(--ink)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          color: 'var(--muted)',
          marginBottom: 14,
          maxWidth: 360,
          lineHeight: 1.4,
        }}
      >
        {note}
      </div>
      <div
        style={{
          width: 390,
          minHeight: 720,
          background: 'var(--panel, #f6f2e9)',
          border: '1px solid var(--hairline)',
          borderRadius: 28,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Masthead({ chromeLine = false }: { chromeLine?: boolean }) {
  return (
    <header style={{ padding: '24px 22px 0' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        Fredag · 149 dagar · höstprov 26
      </div>
      {chromeLine && <ChromeLine />}
    </header>
  )
}

function Greeting() {
  return (
    <div style={{ padding: '28px 22px 0' }}>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 38,
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
        }}
      >
        God dag.
      </div>
    </div>
  )
}

function StubPlan() {
  return (
    <div style={{ padding: '28px 22px 28px' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 12,
        }}
      >
        Drill · ORD
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          color: 'var(--ink)',
          marginBottom: 6,
        }}
      >
        ORD-drill · 10 frågor
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--ink-2)' }}>
        ORD-resultat har trendat nedåt senaste veckan.
      </div>
    </div>
  )
}

// ── Variant A — warm editorial block ────────────────────────────────

function WarmBlock() {
  return (
    <a
      href={MOCK.href}
      style={{
        display: 'block',
        textDecoration: 'none',
        padding: '28px 22px 4px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: MONO_TRACK,
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {MOCK.eyebrowTime} · {MOCK.device}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          color: 'var(--ink)',
          margin: '12px 0 0',
        }}
      >
        {MOCK.headline}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--ink-2)',
          margin: '6px 0 0',
        }}
      >
        {MOCK.progress}
      </div>
      <div
        style={{
          marginTop: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: MONO_TRACK,
          textTransform: 'uppercase',
          color: SAGE,
        }}
      >
        Fortsätt här →
      </div>
    </a>
  )
}

// ── Variant B — quiet chrome line under the kicker ──────────────────

function ChromeLine() {
  return (
    <a
      href={MOCK.href}
      style={{
        display: 'block',
        textDecoration: 'none',
        marginTop: 14,
        paddingTop: 12,
        paddingBottom: 12,
        borderTop: '1px solid var(--hairline)',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        <span>{MOCK.device} · ORD-övning pausad · fråga 3/10</span>
        <span style={{ color: SAGE }}>→</span>
      </div>
    </a>
  )
}

// ── Variant C — compact hybrid between greeting and plan ────────────

function CompactHybrid() {
  return (
    <a
      href={MOCK.href}
      style={{ display: 'block', textDecoration: 'none', padding: '22px 22px 4px' }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: MONO_TRACK,
          textTransform: 'uppercase',
          color: SAGE,
        }}
      >
        Fortsätt · {MOCK.eyebrowTime} · {MOCK.device}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          margin: '8px 0 0',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            color: 'var(--ink)',
          }}
        >
          ORD-övning · {MOCK.progress}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: SAGE }}>→</span>
      </div>
    </a>
  )
}
