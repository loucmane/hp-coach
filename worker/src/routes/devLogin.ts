// /api/dev/login — issues a Clerk sign-in token for the configured dev
// test user so a headless browser (MCP-driven Playwright, e2e harness)
// can complete authentication without going through Clerk's email-OTP
// or OAuth UI.
//
// Flow:
//   1. SPA hits POST /api/dev/login
//   2. Worker looks up the user by `DEV_LOGIN_EMAIL` env var
//   3. Worker calls Clerk's createSignInToken (Backend SDK), returns
//      the short-lived token (~300s) in the response
//   4. SPA passes the token to clerk.signIn.create({ strategy: 'ticket',
//      ticket }) on the frontend, which exchanges it for a real session
//   5. SPA redirects to '/'
//
// Safety:
//   - Mounted in index.ts but the handler refuses if
//     ENVIRONMENT === 'production' (two layers of guard, same pattern
//     as /api/test-reset)
//   - Requires DEV_LOGIN_EMAIL to be set (no email → 503), so a deploy
//     without the env var simply can't issue tokens even by accident
//   - Sign-in tokens expire in 5 minutes — they're one-shot bootstrap
//     credentials, not long-lived secrets

import { Hono } from 'hono'

import { clerkFor } from '../middleware/auth'
import type { Env, Vars } from '../types'

export const devLoginRoute = new Hono<{ Bindings: Env; Variables: Vars }>().post('/', async (c) => {
  if (c.env.ENVIRONMENT === 'production') {
    return c.json(
      { error: { code: 'forbidden', message: '/dev/login is disabled in production' } },
      403,
    )
  }
  const email = c.env.DEV_LOGIN_EMAIL
  if (!email) {
    return c.json(
      {
        error: {
          code: 'not_configured',
          message: 'DEV_LOGIN_EMAIL is not set on the worker — add it to .dev.vars',
        },
      },
      503,
    )
  }
  const clerk = clerkFor(c.env)
  const users = await clerk.users.getUserList({ emailAddress: [email] })
  if (users.totalCount === 0) {
    return c.json(
      {
        error: {
          code: 'no_such_user',
          message: `No Clerk user with email ${email}. Run the e2e setup to create them.`,
        },
      },
      404,
    )
  }
  const userId = users.data[0].id
  const signInToken = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 300,
  })
  return c.json({ ok: true as const, token: signInToken.token })
})
