// Per-Clerk-user rate limiter, KV-backed.
//
// Bucket: 60 requests / 60 seconds per user, sliding window approximated
// by minute-aligned keys. Cheap, fast, fail-open if KV errors (we'd
// rather serve a request than 500 the user on infra hiccups).
//
// For unauthenticated requests this middleware is a no-op — those routes
// are public (/health) and don't need rate limiting at this layer; CF's
// network-level WAF + bot management cover them.

import type { MiddlewareHandler } from 'hono'

import type { Env, Vars } from '../types'

const LIMIT = 60
const WINDOW_SECONDS = 60

export const rateLimit: MiddlewareHandler<{ Bindings: Env; Variables: Vars }> = async (c, next) => {
  const userId = c.get('userId')
  if (!userId) {
    await next()
    return
  }
  // /test-reset is only mounted in non-production (the handler 403s
  // otherwise) and is called by e2e tests that legitimately need a
  // burst of clear+expire-all hits inside the 60s window. Counting
  // them against the regular bucket trips CI under retry pressure.
  if (c.req.path === '/api/test-reset') {
    await next()
    return
  }
  // Content GETs (/api/content/*) are exempt from the shared budget. A
  // single SPA boot pulls ~27 exam files plus per-question explanations
  // on demand — counting each against the 60/min per-user bucket would
  // starve the real mutations (attempts, prefs, mistakes) that budget
  // exists to protect. These are cheap read-only R2 reads of static,
  // already-owned bytes; abuse at current scale is covered by the weekly
  // SQL volume review, not per-request throttling here.
  if (c.req.path.startsWith('/api/content/')) {
    await next()
    return
  }
  // The bucket is ONE global 60/min budget per user across ALL routes.
  // The e2e suite runs ~44 tests (plus retries) as a single Clerk user
  // against a local `wrangler dev` worker — it exhausts that shared
  // budget mid-suite and whichever tests land in the exhausted minute
  // eat 429s (confirmed in CI logs 2026-07-10: POST /api/mistakes 429
  // while prefs PATCHes silently died the same way). Rate limiting
  // exists to protect the deployed API, not a throwaway local dev
  // instance, so it's dev-off / staging+production-on.
  if (c.env.ENVIRONMENT === 'dev') {
    await next()
    return
  }
  const window = Math.floor(Date.now() / 1000 / WINDOW_SECONDS)
  const key = `rl:${userId}:${window}`
  try {
    const raw = await c.env.RATE_LIMIT.get(key)
    const count = raw ? Number.parseInt(raw, 10) : 0
    if (count >= LIMIT) {
      return c.json(
        {
          error: {
            code: 'rate_limited',
            message: `Too many requests (>${LIMIT} per ${WINDOW_SECONDS}s)`,
          },
        },
        429,
      )
    }
    // Best-effort increment with TTL. expirationTtl is per-key seconds.
    await c.env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS * 2 })
  } catch {
    // Fail-open: KV outages shouldn't take the API down.
  }
  await next()
}
