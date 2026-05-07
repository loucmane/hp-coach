// Clerk JWT verification middleware.
//
// Every authenticated route runs this. It:
//   1. Pulls the bearer token off `Authorization`.
//   2. Verifies it with @clerk/backend (offline JWT verification — no
//      network call to Clerk per request after the first key fetch).
//   3. Sets `c.var.userId` to the Clerk subject ("user_2abc…").
//   4. Rejects with 401 + structured error body on failure.
//
// Routes that don't need auth (e.g. /health) skip this middleware.

import { createClerkClient, verifyToken } from '@clerk/backend'
import type { MiddlewareHandler } from 'hono'

import type { Env, Vars } from '../types'

export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: Vars }> = async (
  c,
  next,
) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'unauthenticated', message: 'Missing bearer token' } }, 401)
  }
  const token = authHeader.slice('Bearer '.length)
  try {
    const claims = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    })
    if (!claims.sub) {
      return c.json({ error: { code: 'unauthenticated', message: 'Token missing sub' } }, 401)
    }
    c.set('userId', claims.sub)
  } catch (err) {
    return c.json(
      {
        error: {
          code: 'unauthenticated',
          message: err instanceof Error ? err.message : 'Invalid token',
        },
      },
      401,
    )
  }
  await next()
}

/** Convenience: a Clerk client built lazily from a request's env. */
export function clerkFor(env: Env) {
  return createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
}
