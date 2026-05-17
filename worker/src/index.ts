// HP-Coach API entry. Hono on Cloudflare Workers.
//
// Routes:
//   GET  /                 — small JSON descriptor (public)
//   GET  /health           — liveness + D1 round-trip (public)
//   GET  /api/me/prefs     — authenticated; current user's prefs row
//   PATCH /api/me/prefs    — authenticated; partial update of prefs
//
// Middleware order: cors → JSON error formatter → (per-route) requireAuth
// + rateLimit. The Clerk JWT verify is mounted only on routes that need
// it; /health stays public.
//
// **AppType inference requires chained route registration.** We compose
// the entire app as a single chained expression so `typeof routes`
// surfaces every endpoint to the SPA's typed Hono client (hono/client).
// Adding a new endpoint here flows its request/response types into the
// frontend at compile time — no code-gen, no spec drift.

import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { requireAuth } from './middleware/auth'
import { rateLimit } from './middleware/rateLimit'
import { attemptsRoute } from './routes/attempts'
import { devLoginRoute } from './routes/devLogin'
import { healthRoute } from './routes/health'
import { meRoute } from './routes/me'
import { mistakesRoute } from './routes/mistakes'
import { sessionsRoute } from './routes/sessions'
import { testResetRoute } from './routes/testReset'
import type { Env, Vars } from './types'

const app = new Hono<{ Bindings: Env; Variables: Vars }>()

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return undefined
      // Match any localhost port — Vite picks 5174/5175/etc. when 5173
      // is in use, and pinning to a single port broke `Starta övning`
      // mid-session. The dev/preview origin matters for safety; the
      // port doesn't.
      const url = new URL(origin)
      if (url.hostname === 'localhost' && url.protocol === 'http:') return origin
      if (/\.pages\.dev$/.test(url.hostname)) return origin
      return undefined
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
    credentials: false,
    maxAge: 86_400,
  }),
)

app.onError((err, c) => {
  console.error('unhandled', err)
  return c.json(
    {
      error: {
        code: 'internal_error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    },
    500,
  )
})

// Authed sub-app: every /api/* route runs through Clerk verify + rate limit.
// The test-reset route is mounted unconditionally on the type-level so the
// SPA's hono/client surfaces it cleanly, but the handler itself refuses
// in production. Two layers of guard against shipping a destructive
// endpoint to the live API.
const authed = new Hono<{ Bindings: Env; Variables: Vars }>()
  .use('*', requireAuth)
  .use('*', rateLimit)
  .route('/me', meRoute)
  .route('/sessions', sessionsRoute)
  .route('/attempts', attemptsRoute)
  .route('/mistakes', mistakesRoute)
  .route('/test-reset', testResetRoute)

// Chained route registration → preserves route types in `typeof routes`.
// /api/dev/login is mounted OUTSIDE the authed sub-app — its whole job is
// to bootstrap auth, so requiring an existing session would be circular.
// The handler itself refuses in production (two-layer guard).
const routes = app
  .get('/', (c) =>
    c.json({
      name: 'hpc-api',
      environment: c.env.ENVIRONMENT,
      routes: ['/health', '/api/me/prefs', '/api/sessions', '/api/attempts', '/api/mistakes'],
    }),
  )
  .route('/health', healthRoute)
  .route('/api/dev/login', devLoginRoute)
  .route('/api', authed)

export default routes
export type AppType = typeof routes
