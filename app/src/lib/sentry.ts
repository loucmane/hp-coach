// Sentry error capture for the SPA — shipped INERT.
//
// The whole thing is gated on VITE_SENTRY_DSN. Unset (the default until
// the owner creates a Sentry account and wires the GitHub secret) means
// `initSentry()` never calls `Sentry.init`, so zero Sentry network/init
// code paths run: no DSN, no transport, no beforeSend. The import of
// @sentry/react still tree-shakes into the bundle, but nothing activates.
//
// Posture when live:
//   · errors only — tracesSampleRate 0 (no performance billing surprises)
//   · sendDefaultPii false
//   · beforeSend scrubs request headers/cookies, URL query strings, and
//     breadcrumb data bodies (see scrubEvent) — belt-and-suspenders on
//     top of sendDefaultPii:false.

import type { ErrorEvent, EventHint } from '@sentry/react'
import * as Sentry from '@sentry/react'

// Non-empty DSN → Sentry active. Empty string / unset → fully inert.
export const SENTRY_DSN = (import.meta.env.VITE_SENTRY_DSN as string | undefined) ?? ''

/** True only when a DSN is configured — drives conditional UI copy too. */
export const sentryEnabled = SENTRY_DSN.length > 0

// Release = the deploy commit SHA when the CI build injects it; empty in
// local dev (Sentry simply omits release then).
const RELEASE = (import.meta.env.VITE_GIT_SHA as string | undefined) ?? undefined

/**
 * Resolve the Sentry `environment`. Prefers an explicit VITE_APP_ENV, else
 * derives from the hostname: *.pages.dev previews/staging vs the prod host
 * vs local dev. Kept dependency-free so it's trivially unit-testable.
 */
export function resolveEnvironment(
  appEnv: string | undefined,
  hostname: string | undefined,
): string {
  if (appEnv && appEnv.length > 0) return appEnv
  const host = hostname ?? ''
  if (host === 'localhost' || host === '127.0.0.1' || host === '') return 'development'
  if (host.startsWith('staging') || host.includes('pages.dev')) return 'staging'
  return 'production'
}

/** Strip the query string off a URL, keeping origin + path. Best-effort. */
function stripQuery(url: unknown): unknown {
  if (typeof url !== 'string') return url
  const cut = url.search(/[?#]/)
  return cut === -1 ? url : url.slice(0, cut)
}

/**
 * beforeSend scrubber. Exported for unit tests. Mutates and returns the
 * event with PII-bearing fields removed:
 *   · request headers + cookies dropped entirely
 *   · query strings stripped from the request URL and query_string field
 *   · breadcrumb `data` bodies dropped (and any breadcrumb URL de-queried)
 */
export function scrubEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.request) {
    event.request.headers = undefined
    event.request.cookies = undefined
    event.request.query_string = undefined
    if (event.request.url) event.request.url = stripQuery(event.request.url) as string
  }
  if (event.user) {
    // Defence in depth on top of sendDefaultPii:false — never ship IP/email.
    event.user.ip_address = undefined
    event.user.email = undefined
    event.user.username = undefined
  }
  if (Array.isArray(event.breadcrumbs)) {
    for (const crumb of event.breadcrumbs) {
      if (crumb.data && typeof crumb.data === 'object') {
        const url = (crumb.data as Record<string, unknown>).url
        crumb.data = url === undefined ? undefined : { url: stripQuery(url) }
      }
    }
  }
  return event
}

/**
 * Initialise Sentry — a no-op unless a DSN is configured. Call once,
 * before React mounts.
 */
export function initSentry(): void {
  if (!sentryEnabled) return
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: resolveEnvironment(
      import.meta.env.VITE_APP_ENV as string | undefined,
      typeof window === 'undefined' ? undefined : window.location.hostname,
    ),
    release: RELEASE,
    // Errors only. No tracing spans → no performance-event billing.
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  })
}
