// GET /api/content/:file — authenticated strict-tier content delivery.
//
// The question bank (data/*.json — includes third-party-copyrighted
// LÄS/ELF passages + every answer key) and the Layer 2 explanation
// corpus (explanations/*.json — the product's proprietary IP) used to
// ship as unauthenticated static JSON in the Pages bundle. This route
// moves them behind Clerk auth: bytes live in the CONTENT R2 bucket and
// are served only to a signed-in session.
//
// Mounted UNDER the authed sub-app in index.ts, so requireAuth runs in
// front (401 for anonymous callers). It is exempted from the shared
// per-user rate-limit bucket in middleware/rateLimit.ts — a single boot
// pulls ~27 exam files plus explanations on demand, which would starve
// the 60/min budget real mutations need. See that carve-out's comment.
//
// Public/own content (frameworks/, normering/, figures/) is deliberately
// NOT served here — it stays on the Pages CDN as static assets.

import { Hono } from 'hono'

import type { Env, Vars } from '../types'

// Whitelist: exactly one path segment under `data/` or `explanations/`,
// filename limited to word chars / dash, `.json` only. The character
// class makes `..` and nested `/` structurally impossible to match, so
// path traversal cannot pass validation regardless of URL encoding
// (Hono has already percent-decoded the path by the time we see it).
const CONTENT_PATH = /^(data|explanations)\/[A-Za-z0-9_-]+\.json$/

/** True only for a safe, whitelisted content key. Exported for tests. */
export function isValidContentPath(file: string): boolean {
  return CONTENT_PATH.test(file)
}

export const contentRoute = new Hono<{ Bindings: Env; Variables: Vars }>().get('/*', async (c) => {
  // Everything after `/api/content/`. Wildcard (not `:file`) because the
  // key contains a slash (`data/var-2024.json`) and `:file` won't span one.
  const file = c.req.path.replace(/^\/api\/content\//, '')
  if (!isValidContentPath(file)) {
    return c.json({ error: { code: 'bad_request', message: 'Invalid content path' } }, 400)
  }
  const obj = await c.env.CONTENT.get(file)
  if (!obj) {
    return c.json({ error: { code: 'not_found', message: 'Content not found' } }, 404)
  }
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Browser may cache per-user for an hour; shared/CDN caches must
      // not, since the payload is auth-gated. `private` enforces that.
      'Cache-Control': 'private, max-age=3600',
    },
  })
})
