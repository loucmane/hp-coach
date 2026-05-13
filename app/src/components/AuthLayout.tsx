// AuthLayout — Phase A.5 wrapper for sign-in / sign-up routes.
//
// Phone: single column with the auth form (Clerk's SignIn / SignUp)
// vertically centered inside the iOS artboard. Same UX as today.
//
// Reader / Studio: a two-pane split. The auth form sits on the left
// (~50% column, max 480px); the right pane carries a brand hero —
// just the product name + value-prop kicker for now (Phase C will
// flesh out the real onboarding magic moment). The kicker exists to
// answer the implicit "what is this?" question for a new visitor;
// it's not a marketing push.
//
// Vertical centering inside the wide canvas: we set min-height on
// the inner row so the pane height resolves cleanly and Clerk's card
// can use alignItems:center to land where it should. This is the
// piece that fixes the Phase A off-center bug — the canvas no longer
// fakes an 836px artboard, so we don't have to fake-center inside it.

import type { ReactNode } from 'react'

import { useViewport } from '@/hooks/useViewport'

type Props = {
  children: ReactNode
  /** Heading on the brand pane (reader/studio only). Defaults to the
   *  product name; sign-up may want to override with something more
   *  inviting. */
  brandTitle?: string
  /** Sub-heading (one or two sentences). */
  brandKicker?: string
}

export function AuthLayout({
  children,
  brandTitle = 'HP-Coach',
  brandKicker = 'Coachning för 2.0 — strukturerad pedagogik istället för rena frågebanker.',
}: Props) {
  const viewport = useViewport()
  const isPhone = viewport === 'phone'

  if (isPhone) {
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    )
  }

  // Reader / Studio — two-pane. Use min-height: 80vh so the row is
  // tall enough to feel anchored without slavishly filling the
  // viewport. Auth screens shouldn't compete with the marketing
  // landing page (Phase E) for vertical drama.
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 'clamp(24px, 4vw, 72px)',
        alignItems: 'center',
        minHeight: '80vh',
        padding: 'clamp(24px, 4vh, 80px) clamp(24px, 4vw, 64px)',
      }}
    >
      <div
        data-testid="auth-form-pane"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ width: '100%', maxWidth: 480 }}>{children}</div>
      </div>
      <aside
        data-testid="auth-brand-pane"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          maxWidth: 480,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: 'var(--font-mono-track)',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}
        >
          Välkommen
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 'clamp(36px, 3vw + 24px, 56px)',
            lineHeight: 1.05,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          {brandTitle}
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(16px, 0.9rem + 0.4vw, 20px)',
            lineHeight: 1.45,
            color: 'var(--ink-2)',
            maxWidth: 420,
          }}
        >
          {brandKicker}
        </p>
      </aside>
    </div>
  )
}
