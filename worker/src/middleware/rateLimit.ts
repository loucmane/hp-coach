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
