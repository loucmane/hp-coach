// /sign-in-bakeoff — sign-in composition bake-off.
//
// The live /sign-in renders Clerk's <SignIn> inside AuthLayout. The
// gripe: Clerk's default card (drop shadow, rounded box, stock inputs)
// floats inside an otherwise card-less editorial page and reads as a
// bolted-on widget. Per the standing rule, we judge the fix as a live
// /dev bake-off, not in prose.
//
// These are MOCK forms (not real Clerk) so they're stable + fully
// stylable — we're choosing the *treatment*, not wiring auth. The
// winner is ported into clerkAppearance (+ AuthLayout) afterwards:
// clerk exposes `elements`/`variables` that map 1:1 to what these
// mocks express (card chrome, input style, button, divider, social row).
//
//   A · Current (control)   — shadowed rounded card, stock inputs (today)
//   B · Flush editorial      — no card; ruled-line inputs flush in the column
//   C · Centered threshold   — single centered column, compact pull-quote
//   D · Hairline specimen     — thin 1px frame (no shadow), ruled inputs
//
// Dev-gated via isDevSurface(); user reports the pick.

import { createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/sign-in-bakeoff')({
  component: SignInBakeoff,
})

const MONO = 'var(--font-mono)'
const DISPLAY = 'var(--font-display)'
const SAGE = 'var(--accent)'
const TRACK = 'var(--font-mono-track, 0.08em)'

function SignInBakeoff() {
  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: DISPLAY, color: 'var(--ink)' }}>
        /sign-in-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #efeae0)',
        padding: 'clamp(20px,3vw,48px)',
      }}
    >
      <Variant
        label="A · Current (control)"
        note="Clerk's default: a drop-shadowed, rounded card with stock inputs — floats on the editorial page."
      >
        <Split pullquote={<PullQuote />}>
          <CardLabel />
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--hairline)',
              borderRadius: 12,
              boxShadow: '0 18px 40px -12px rgba(0,0,0,0.28)',
              padding: '22px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <BoxedSocial />
            <Divider />
            <BoxedField />
            <PrimaryButton />
          </div>
          <CrossLink />
        </Split>
      </Variant>

      <Variant
        label="B · Flush editorial"
        note="No card chrome — the form sits flush in the column; ruled-line inputs, single Sage CTA. Matches the card-less language."
      >
        <Split pullquote={<PullQuote />}>
          <CardLabel />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 360 }}>
            <FlushSocial />
            <Divider />
            <RuledField />
            <PrimaryButton />
          </div>
          <CrossLink />
        </Split>
      </Variant>

      <Variant
        label="C · Centered threshold"
        note="Drops the split. One centered column — brand, a compact pull-quote, then the flush form. A focused 'enter' moment."
      >
        <div
          style={{
            maxWidth: 460,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            paddingTop: 24,
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 'clamp(34px,4vw,52px)',
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
            }}
          >
            Förstå strukturen.
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 16, color: 'var(--ink-2)' }}>
            Inte bara frågorna.
          </div>
          <div
            aria-hidden
            style={{ height: 1, width: 48, background: 'var(--ink)', opacity: 0.4 }}
          />
          <CardLabel />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <FlushSocial />
            <Divider />
            <RuledField />
            <PrimaryButton />
          </div>
          <CrossLink />
        </div>
      </Variant>

      <Variant
        label="D · Hairline specimen"
        note="A middle ground — a thin 1px hairline frame (no shadow, system radius) holds ruled inputs. Editorial 'specimen', not a Clerk widget."
      >
        <Split pullquote={<PullQuote />}>
          <CardLabel />
          <div
            style={{
              border: '1px solid var(--hairline)',
              borderRadius: 'calc(var(--radius) * 0.5)',
              padding: '22px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              background: 'transparent',
            }}
          >
            <FlushSocial />
            <Divider />
            <RuledField />
            <PrimaryButton />
          </div>
          <CrossLink />
        </Split>
      </Variant>

      <Variant
        label="E · Ruled + Sage left-rail (specialist)"
        note="B's flush form, but a 4px Sage rule runs down the left edge of the form stack — structural emphasis (a margin rule), not a box — and the CTA is Sage-filled so the goal reads. The single accent does the anchoring a card used to."
      >
        <Split pullquote={<PullQuote />}>
          <div
            style={{
              borderLeft: '4px solid var(--accent)',
              paddingLeft: 'clamp(20px, 2vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              maxWidth: 360,
            }}
          >
            <CardLabel />
            <FlushSocial />
            <Divider />
            <RuledField />
            <SagePrimaryButton />
          </div>
          <CrossLink />
        </Split>
      </Variant>
    </div>
  )
}

// ── Artboard ────────────────────────────────────────────────────────

function Variant({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: TRACK,
          textTransform: 'uppercase',
          color: 'var(--ink)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 13,
          color: 'var(--muted)',
          marginBottom: 14,
          maxWidth: 620,
          lineHeight: 1.4,
        }}
      >
        {note}
      </div>
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--hairline)',
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        <BrandBand />
        <div style={{ padding: 'clamp(24px,3vw,48px)' }}>{children}</div>
      </div>
    </div>
  )
}

function BrandBand() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '18px 24px 14px',
        borderBottom: '1px solid var(--hairline)',
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink)',
      }}
    >
      <span>⌜ HP-Coach</span>
      <span style={{ color: SAGE }}>höst-2026 ↘</span>
    </div>
  )
}

function Split({ children, pullquote }: { children: ReactNode; pullquote: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '360px 1fr',
        gap: 'clamp(32px,5vw,80px)',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
      <div>{pullquote}</div>
    </div>
  )
}

function PullQuote() {
  return (
    <div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 'clamp(44px,5vw,84px)',
          lineHeight: 0.98,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
        }}
      >
        FÖRSTÅ
        <br />
        STRUKTUREN.
      </div>
      <div
        aria-hidden
        style={{ height: 1, width: 40, background: 'var(--ink)', opacity: 0.4, margin: '18px 0' }}
      />
      <div style={{ fontFamily: DISPLAY, fontSize: 18, color: 'var(--ink-2)' }}>
        Inte bara frågorna.
      </div>
    </div>
  )
}

function CardLabel() {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
      }}
    >
      Logga in
    </div>
  )
}

function CrossLink() {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: TRACK,
        textTransform: 'uppercase',
        color: 'var(--muted)',
      }}
    >
      Inget konto? <span style={{ color: SAGE }}>→ börja här</span>
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--muted)' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
      <span
        style={{ fontFamily: MONO, fontSize: 10, letterSpacing: TRACK, textTransform: 'uppercase' }}
      >
        eller
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
    </div>
  )
}

// Boxed (Clerk-default-ish) field + social — variant A
function BoxedSocial() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '11px 14px',
        border: '1px solid var(--hairline)',
        borderRadius: 8,
        background: 'var(--bg)',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
        color: 'var(--ink)',
      }}
    >
      <span style={{ fontWeight: 700 }}>G</span> Continue with Google
    </div>
  )
}
function BoxedField() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: 'var(--ink)' }}>
        Email address
      </span>
      <div
        style={{
          padding: '10px 12px',
          border: '1px solid var(--hairline)',
          borderRadius: 8,
          background: 'var(--bg)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          color: 'var(--muted)',
        }}
      >
        Enter your email address
      </div>
    </div>
  )
}

// Flush / ruled field + social — variants B, C, D
function FlushSocial() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '12px 14px',
        border: '1px solid var(--ink)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        background: 'transparent',
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: TRACK,
        textTransform: 'uppercase',
        color: 'var(--ink)',
      }}
    >
      Fortsätt med Google
    </div>
  )
}
function RuledField() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: TRACK,
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        E-postadress
      </span>
      <div
        style={{
          paddingBottom: 8,
          borderBottom: '1px solid var(--ink)',
          fontFamily: DISPLAY,
          fontSize: 17,
          color: 'var(--muted)',
        }}
      >
        din@epost.se
      </div>
    </div>
  )
}

function PrimaryButton() {
  return (
    <div
      style={{
        marginTop: 4,
        padding: '13px 18px',
        background: 'var(--ink)',
        color: 'var(--bg)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        textAlign: 'center',
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: TRACK,
        textTransform: 'uppercase',
      }}
    >
      Fortsätt →
    </div>
  )
}

// Sage-filled CTA — variant E (the form's goal, in the single accent).
function SagePrimaryButton() {
  return (
    <div
      style={{
        marginTop: 4,
        padding: '13px 18px',
        background: SAGE,
        color: 'var(--accent-ink, #fff)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        textAlign: 'center',
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: TRACK,
        textTransform: 'uppercase',
      }}
    >
      Fortsätt →
    </div>
  )
}
