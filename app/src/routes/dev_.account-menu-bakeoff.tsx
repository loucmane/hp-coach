// /dev/account-menu-bakeoff — WHERE does the account/identity surface live?
//
// The product has no logout button and no identity surface at all. The
// PROFILE MENU (account actions) vs Mer/Inställningar (product prefs) split
// is already settled; this bake-off decides the two open axes — WHERE the
// avatar lives, and HOW the menu feels — as a live /dev route on the real
// signed-in Clerk user, per the standing house rule (visual-character
// decisions get a live bake-off, not a prose pick).
//
// Dev-gated via isDevSurface(). No product code changes.

import { createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'

import {
  Caption,
  useAccountIdentity,
  VariantByline,
  VariantErsatterMer,
  VariantKontoRad,
} from '@/components/devbake/AccountMenuBakeoff'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/dev_/account-menu-bakeoff')({
  component: AccountMenuBakeoffRoute,
})

function AccountMenuBakeoffRoute() {
  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
        /dev/account-menu-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }
  return <BakeoffBody />
}

function BakeoffBody() {
  const identity = useAccountIdentity()
  // Whether menus render open (for judging + screenshots) or closed (to
  // judge the trigger's resting footprint in the chrome).
  const [open, setOpen] = useState(true)

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
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--accent)' }}>●</span>&nbsp; Where should the account /
          identity surface live?
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            marginTop: 6,
            maxWidth: 780,
            lineHeight: 1.5,
          }}
        >
          Settled: PROFILE MENU carries account/identity actions (Logga ut · Konto · Exportera min
          data · Radera konto); Mer/Inställningar keeps product prefs (palett / läge / coach /
          verktyg). This bake-off decides the two open axes — WHERE the avatar lives, and HOW the
          menu feels.
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            marginTop: 6,
            maxWidth: 780,
            lineHeight: 1.5,
          }}
        >
          Medallion, not photo: an initials monogram in a hairline ring reads as an embossed mark on
          a printed page — the Boksidan idiom — where a glossy circular photo would fight it. "Logga
          ut" is quiet (routine, not danger-red); "Radera konto" (P1) is shown disabled with a
          "kommer" note. The menu renders the{' '}
          {identity.real ? (
            <span style={{ color: 'var(--accent)' }}>REAL signed-in user</span>
          ) : (
            <span style={{ color: 'var(--muted-2)' }}>
              SAMPLE identity (signed out — sign in to see the real user)
            </span>
          )}
          . "Logga ut" calls the real signOut().
        </div>
      </header>

      {/* toggle chips — menu open vs closed */}
      <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
        {[
          { key: 'open', label: 'Meny öppen' },
          { key: 'closed', label: 'Meny stängd (bara triggern)' },
        ].map((o) => {
          const on = (o.key === 'open') === open
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => setOpen(o.key === 'open')}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '6px 12px',
                borderRadius: 999,
                cursor: 'pointer',
                border: `1px solid ${on ? 'var(--accent)' : 'var(--hairline)'}`,
                background: on ? 'var(--accent-soft)' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--muted-2)',
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>

      <Stage
        tag="V1"
        title="Byline"
        note="A small initials medallion top-right of the phone masthead and the desktop content mast. Tap → a compact account menu; the Mer entry is UNCHANGED."
      >
        {/* key remounts the variant when the open toggle flips, so defaultOpen re-applies */}
        <VariantByline key={`v1-${open}`} defaultOpen={open} />
        <Caption>
          Least disruptive: account gets a corner of its own and Mer keeps every product pref. The
          menu closes account/identity into one glance and links out to Inställningar → quietly.
          Trade-off: a second top-right affordance to learn, distinct from the Mer word.
        </Caption>
      </Stage>

      <Stage
        tag="V2"
        title="Ersätter Mer"
        note="The medallion REPLACES the Mer entry (desktop rail foot; phone masthead corner). Its menu carries BOTH account actions AND an Inställningar entry — the owner's original instinct."
      >
        <VariantErsatterMer key={`v2-${open}`} defaultOpen={open} />
        <Caption>
          One identity surface to rule them all: fewer affordances, but the menu now mixes routine
          account actions with an Inställningar door, and the settled account-vs-prefs split blurs
          back into a single control. Tests the owner's original instinct.
        </Caption>
      </Stage>

      <Stage
        tag="V3"
        title="Konto-rad"
        note="No floating avatar. A person-icon 'Konto' word joins the desktop rail foot next to 'mer →'; on the phone an identity block sits at the TOP of /mer."
      >
        <VariantKontoRad key={`v3-${open}`} defaultOpen={open} />
        <Caption>
          Least chrome: account lives where settings already live, but clearly fenced as an identity
          block. Nothing new floats over Home. Trade-off: Logga ut is two hops away (open /mer, then
          act) — fine for a rare action, slower than a corner tap.
        </Caption>
      </Stage>
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
    <section
      style={{
        marginTop: 52,
        paddingTop: 32,
        borderTop: '1px solid color-mix(in oklch, var(--ink) 14%, transparent)',
      }}
    >
      <div style={{ padding: '0 2px 20px' }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          <span style={{ color: 'var(--accent)' }}>{tag}</span> · {title}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', maxWidth: 720, lineHeight: 1.5 }}>
          {note}
        </div>
      </div>
      {children}
    </section>
  )
}
