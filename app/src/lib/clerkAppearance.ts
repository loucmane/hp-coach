// Shared Clerk <SignIn> / <SignUp> styling — EDITION "flush form" (the
// sign-in bake-off winner, variant E).
//
// The product is card-less: surfaces sit flush on the page like a printed
// workbook (Phase A.8). Clerk's prebuilt card — drop shadow, rounded box,
// stock sans inputs — read as a bolted-on widget. So we dissolve the card
// entirely and re-cast every part in the editorial vocabulary:
//   - no card: transparent, no border, no shadow, no padding (the outer
//     `cardBox` shadow is killed too — the inner `card` override alone
//     left Clerk's shadow leaking through)
//   - inputs as ruled underlines (bottom border only), display serif
//   - labels in small-caps mono above the line
//   - social button as a hairline-bordered mono pill (no fill)
//   - primary button in `--ink` (the single Sage accent is spent on the
//     left-rail rule AuthLayout draws down the form stack, so the button
//     stays ink to keep Sage sparing)
//   - "eller" divider as a thin hairline
//
// Type-cast notes: Clerk's appearance schema accepts CSS-in-JS objects but
// types a few fields as branded strings; `as unknown as string` keeps
// `var(--…)` references working without adopting Clerk's expected formats.

import type { SignIn } from '@clerk/clerk-react'
import type { ComponentProps } from 'react'

type Appearance = NonNullable<ComponentProps<typeof SignIn>['appearance']>

const MONO = 'var(--font-mono)' as unknown as string
const DISPLAY = 'var(--font-display)' as unknown as string
const TRACK = 'var(--font-mono-track)' as unknown as string

export const clerkAppearance: Appearance = {
  elements: {
    rootBox: { width: '100%', display: 'flex', justifyContent: 'center' },
    // Kill ALL card chrome — both the inner card and Clerk's outer cardBox
    // (the latter carries the shadow the previous override missed).
    cardBox: { boxShadow: 'none', border: 'none', background: 'transparent' },
    card: {
      width: '100%',
      maxWidth: '100%',
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      padding: '0',
    },
    header: { display: 'none' },

    // Social button — hairline-bordered mono pill, no fill.
    socialButtonsBlockButton: {
      width: '100%',
      background: 'transparent',
      border: '1px solid var(--ink)',
      borderRadius: 'calc(var(--radius) * 0.5)',
      color: 'var(--ink)',
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: TRACK,
      textTransform: 'uppercase',
      fontWeight: 500,
      padding: '12px 14px',
    },

    // Inputs as ruled underlines — no box, no radius, serif text.
    formFieldInput: {
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid var(--ink)',
      borderRadius: 0,
      padding: '0 0 8px 0',
      fontSize: 16,
      fontFamily: DISPLAY,
      color: 'var(--ink)',
    },
    formFieldLabel: {
      fontFamily: MONO,
      fontSize: 10,
      letterSpacing: TRACK,
      textTransform: 'uppercase',
      color: 'var(--muted)',
      marginBottom: 8,
    },

    // Primary button — ink (the Sage accent lives on the left-rail).
    formButtonPrimary: {
      width: '100%',
      background: 'var(--ink)',
      color: 'var(--bg)',
      fontFamily: MONO,
      fontSize: 12,
      letterSpacing: TRACK,
      textTransform: 'uppercase',
      fontWeight: 500,
      borderRadius: 'calc(var(--radius) * 0.5)',
      padding: '13px 18px',
      border: 'none',
      boxShadow: 'none',
    },

    // "eller" divider — thin hairline + muted mono label.
    dividerLine: { background: 'var(--hairline)', height: 1 },
    dividerText: {
      fontFamily: MONO,
      fontSize: 10,
      letterSpacing: TRACK,
      textTransform: 'uppercase',
      color: 'var(--muted)',
    },

    footerActionLink: { color: 'var(--ink)' },
    // Drop the Clerk wordmark — minimal aesthetic doesn't need it.
    footer: { display: 'none' },
  },
  variables: {
    colorPrimary: 'var(--ink)' as unknown as string,
    colorBackground: 'transparent' as unknown as string,
    colorText: 'var(--ink)' as unknown as string,
    colorTextSecondary: 'var(--muted)' as unknown as string,
    fontFamily: 'var(--font-ui)' as unknown as string,
    borderRadius: 'calc(var(--radius) * 0.5)' as unknown as string,
  },
}
