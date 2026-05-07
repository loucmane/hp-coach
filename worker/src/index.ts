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
import { healthRoute } from './routes/health'
import { meRoute } from './routes/me'
import type { Env, Vars } from './types'

const app = new Hono<{ Bindings: Env; Variables: Vars }>()

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return undefined
      if (origin.startsWith('http://localhost:5173')) return origin
      if (origin.startsWith('http://localhost:4173')) return origin
      if (/\.pages\.dev$/.test(new URL(origin).hostname)) return origin
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
const authed = new Hono<{ Bindings: Env; Variables: Vars }>()
  .use('*', requireAuth)
  .use('*', rateLimit)
  .route('/me', meRoute)

// Chained route registration → preserves route types in `typeof routes`.
const routes = app
  .get('/', (c) =>
    c.json({
      name: 'hpc-api',
      environment: c.env.ENVIRONMENT,
      routes: ['/health', '/api/me/prefs'],
    }),
  )
  .route('/health', healthRoute)
  .route('/api', authed)

export default routes
export type AppType = typeof routes
