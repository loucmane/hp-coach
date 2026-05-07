// Shared Clerk <SignIn> / <SignUp> styling.
//
// Clerk's prebuilt cards default to ~400px wide and have generous
// internal padding designed for desktop. Dropped into our 390px phone
// frame they overflow the right edge and look off-centred. The overrides
// below pull the card back to fit, match the design tokens, and
// suppress Clerk's drop shadow (we already have a hairline border).
//
// Type-cast notes: Clerk's appearance schema accepts plain objects of
// CSS-in-JS, but their TS types declare a few fields as branded
// strings (e.g. `colorPrimary: HexColor`). Casting via `as unknown as
// string` keeps `var(--…)` references working without rewriting the
// theme system around Clerk's expected formats.

import type { SignIn } from '@clerk/clerk-react'
import type { ComponentProps } from 'react'

// Derive the type from the SignIn component's `appearance` prop so we
// don't need to install @clerk/types separately. <SignUp> takes the
// same shape, so one alias serves both routes.
type Appearance = NonNullable<ComponentProps<typeof SignIn>['appearance']>

export const clerkAppearance: Appearance = {
  elements: {
    // Outer wrapper — center the card within the artboard.
    rootBox: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    // The card itself — match palette, keep within the 390px frame.
    card: {
      width: '100%',
      maxWidth: '100%',
      background: 'var(--panel)',
      border: '1px solid var(--hairline)',
      boxShadow: 'none',
      padding: '20px 16px',
    },
    // Header (logo + title) — Clerk's default has a lot of vertical air;
    // tighten so the form is visible above the fold.
    headerTitle: {
      fontFamily: 'var(--font-display)',
      fontSize: 22,
      letterSpacing: '-0.01em',
    },
    headerSubtitle: { fontSize: 13 },
    // Social buttons row (Google etc.) — full width pills.
    socialButtonsBlockButton: { width: '100%' },
    // Form inputs and primary button.
    formFieldInput: { fontSize: 15 },
    formButtonPrimary: {
      width: '100%',
      background: 'var(--ink)',
      color: 'var(--bg)',
      fontWeight: 500,
    },
    // Footer link ("Don't have an account? Sign up")
    footerActionLink: { color: 'var(--ink)' },
    // Drop the Clerk wordmark — minimal aesthetic doesn't need it.
    footer: { display: 'none' },
  },
  variables: {
    colorPrimary: 'var(--ink)' as unknown as string,
    colorBackground: 'var(--panel)' as unknown as string,
    colorText: 'var(--ink)' as unknown as string,
    colorTextSecondary: 'var(--muted)' as unknown as string,
    fontFamily: 'var(--font-ui)' as unknown as string,
    borderRadius: 'calc(var(--radius) * 0.5)' as unknown as string,
  },
}
