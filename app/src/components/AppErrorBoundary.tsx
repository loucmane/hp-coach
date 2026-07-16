// Top-level error boundary. Wraps the whole app so an uncaught render
// error shows a plain Swedish house-voice fallback instead of a blank
// white screen.
//
// When a Sentry DSN is live the error is already reported, so we say so
// ("felet är redan rapporterat"). When Sentry is inert (no DSN — the
// default until the owner wires it up) that claim would be a lie, so the
// copy drops to a plain "Ladda om sidan." — conditional on sentryEnabled.

import * as Sentry from '@sentry/react'
import type { ReactNode } from 'react'

import { sentryEnabled } from '@/lib/sentry'

// House-voice copy. Only claim "rapporterat" when a DSN is actually live.
const FALLBACK_MESSAGE = sentryEnabled
  ? 'Något gick sönder. Ladda om sidan — felet är redan rapporterat.'
  : 'Något gick sönder. Ladda om sidan.'

function Fallback() {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--ink)',
      }}
    >
      <p style={{ fontSize: '1.125rem', maxWidth: '32ch' }}>{FALLBACK_MESSAGE}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          fontFamily: 'inherit',
          fontSize: '1rem',
          padding: '0.5rem 1.25rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--ink)',
          background: 'transparent',
          color: 'var(--ink)',
          cursor: 'pointer',
        }}
      >
        Ladda om sidan
      </button>
    </div>
  )
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <Sentry.ErrorBoundary fallback={<Fallback />}>{children}</Sentry.ErrorBoundary>
}
