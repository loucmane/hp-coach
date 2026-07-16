// Sentry error capture for the Worker — shipped INERT.
//
// Gated on the `SENTRY_DSN` wrangler secret. Until the owner sets it
// (`wrangler secret put SENTRY_DSN --env staging|production` — see
// docs/sentry.md), `env.SENTRY_DSN` is undefined, the options builder
// hands Sentry no DSN, and the SDK stays fully inert: no transport, no
// events. `withSentry` still wraps the handler either way — that's cheap
// and keeps the code path identical live vs inert.
//
// Posture when live: errors only (tracesSampleRate 0), no PII
// (sendDefaultPii false + scrubEvent drops auth headers, cookies, query
// strings, and request bodies), release pinned to the deploy GIT_SHA var.

import type { CloudflareOptions, ErrorEvent, EventHint } from '@sentry/cloudflare'

import type { Env } from '../types'

/** Strip the query string off a URL, keeping origin + path. */
function stripQuery(url: unknown): unknown {
  if (typeof url !== 'string') return url
  const cut = url.search(/[?#]/)
  return cut === -1 ? url : url.slice(0, cut)
}

/**
 * beforeSend scrubber. Exported for unit tests. Removes PII-bearing
 * fields from an outgoing event:
 *   · request headers (Authorization, Cookie, …) dropped entirely
 *   · request cookies + body (`data`) dropped
 *   · query strings stripped from the request URL + query_string
 *   · breadcrumb `data` bodies dropped
 */
export function scrubEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.request) {
    event.request.headers = undefined
    event.request.cookies = undefined
    // Request bodies can carry answers / tokens — never ship them.
    event.request.data = undefined
    event.request.query_string = undefined
    if (event.request.url) event.request.url = stripQuery(event.request.url) as string
  }
  if (event.user) {
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
 * Build the CloudflareOptions passed to `withSentry`. `dsn: env.SENTRY_DSN`
 * — undefined when the secret is unset → the SDK initialises inert.
 */
export function sentryOptions(env: Env): CloudflareOptions {
  return {
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT,
    release: env.GIT_SHA,
    // Errors only — no tracing spans, no performance billing.
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  }
}
