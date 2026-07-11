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

import { getDb } from './db/client'
import { runRetention } from './lib/retention'
import { requireAuth } from './middleware/auth'
import { rateLimit } from './middleware/rateLimit'
import { attemptsRoute } from './routes/attempts'
import { contentRoute } from './routes/content'
import { dailyPlansRoute } from './routes/dailyPlans'
import { devLoginRoute } from './routes/devLogin'
import { exportRoute, importRoute } from './routes/export'
import { healthRoute } from './routes/health'
import { lessonProgressRoute } from './routes/lessonProgress'
import { lessonReadsRoute } from './routes/lessonReads'
import { meRoute } from './routes/me'
import { mistakesRoute } from './routes/mistakes'
import { mockResultsRoute } from './routes/mockResults'
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
    // PUT: /api/daily-plans/:date (the cross-device plan-baseline upsert)
    // is the only PUT route — it was silently CORS-blocked from the SPA
    // origin until PUT was added here (preflight 204'd but disallowed the
    // method, so the browser never sent the request and the plan never
    // reached the server).
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
  .route('/lesson-progress', lessonProgressRoute)
  .route('/lesson-reads', lessonReadsRoute)
  .route('/daily-plans', dailyPlansRoute)
  .route('/attempts', attemptsRoute)
  .route('/mistakes', mistakesRoute)
  .route('/mock-results', mockResultsRoute)
  .route('/me/export', exportRoute)
  .route('/me/import', importRoute)
  // Strict-tier content (question bank + explanations) from R2. requireAuth
  // gates it; rateLimit exempts it (see rateLimit.ts carve-out) so a boot's
  // bulk content pulls don't starve the shared per-user mutation budget.
  .route('/content', contentRoute)
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

// Daily Cron Trigger (see [triggers] in wrangler.toml) — prune
// attempts/sessions past the retention window so the append-only tables
// stay bounded as the user base grows. Lifetime totals live on the user
// counters, so this never changes a displayed number.
const scheduled: ExportedHandlerScheduledHandler<Env> = async (_event, env) => {
  const { cutoff } = await runRetention(getDb(env.DB))
  console.log(`[retention] pruned rows older than ${cutoff.toISOString()}`)
}

// The worker now exports BOTH a fetch and a scheduled handler. AppType is
// still the Hono app type the SPA client infers from — unchanged.
export default { fetch: routes.fetch, scheduled }
export type AppType = typeof routes
