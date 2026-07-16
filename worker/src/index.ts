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

import * as Sentry from '@sentry/cloudflare'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { getDb } from './db/client'
import { runFit } from './lib/fit'
import { runRetention } from './lib/retention'
import { sentryOptions } from './lib/sentry'
import { requireAuth } from './middleware/auth'
import { rateLimit } from './middleware/rateLimit'
import { accountRoute } from './routes/account'
import { attemptsRoute } from './routes/attempts'
import { clerkWebhookRoute } from './routes/clerkWebhook'
import { contentRoute } from './routes/content'
import { dailyPlansRoute } from './routes/dailyPlans'
import { devLoginRoute } from './routes/devLogin'
import { exportRoute, importRoute } from './routes/export'
import { fitRoute, itemStatsRoute } from './routes/fit'
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
  // Explicit capture in the top-level handler. No-op unless a DSN is set
  // (withSentry initialises inert without one). withSentry also catches
  // truly-unhandled throws; this covers errors Hono routes into onError.
  Sentry.captureException(err)
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
  // Learned item-difficulty layer (PL-L.1): read fitted difficulties and
  // trigger the fit on demand. The nightly cron is the production path.
  .route('/item-stats', itemStatsRoute)
  .route('/fit', fitRoute)
  .route('/me/export', exportRoute)
  .route('/me/import', importRoute)
  // DELETE /api/account — Clerk-first permanent account deletion.
  .route('/account', accountRoute)
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
  // Clerk sync webhook — mounted OUTSIDE `authed`, so it bypasses
  // requireAuth AND rateLimit by construction (Clerk has no session token
  // and no per-user rate-limit bucket). Auth is the Svix signature the
  // route verifies itself. See routes/clerkWebhook.ts.
  .route('/api/webhooks/clerk', clerkWebhookRoute)
  .route('/api', authed)

// Cron Triggers (see [triggers] in wrangler.toml). Two schedules share this
// one handler, discriminated by `event.cron`:
//
//   · "0 3 * * *" — fit the learned item-difficulty layer (PL-L.1): fold
//     new attempts past the watermark into item_stats / user_ability. This
//     is the PRODUCTION path for the fit; POST /api/fit/run is the manual
//     escape hatch. Idempotent, so a missed night self-heals next run.
//   · "0 4 * * *" — prune attempts/sessions past the retention window so
//     the append-only tables stay bounded. Lifetime totals live on the user
//     counters, so this never changes a displayed number.
//
// Logs carry only counts / ids / a cutoff timestamp — never PII.
const scheduled: ExportedHandlerScheduledHandler<Env> = async (event, env) => {
  if (event.cron === '0 3 * * *') {
    const { processed, watermark } = await runFit(getDb(env.DB))
    console.log(`[fit] folded ${processed} attempts; watermark now at id ${watermark}`)
    return
  }
  const { cutoff } = await runRetention(getDb(env.DB))
  console.log(`[retention] pruned rows older than ${cutoff.toISOString()}`)
}

// The worker exports BOTH a fetch and a scheduled handler, wrapped by
// `withSentry` for unhandled-exception capture. `sentryOptions(env)` hands
// the SDK `dsn: env.SENTRY_DSN` — undefined until the owner sets the
// secret, so this is fully inert by default (zero behaviour change). See
// worker/src/lib/sentry.ts + docs/sentry.md. AppType is unchanged.
export default Sentry.withSentry(sentryOptions, {
  fetch: routes.fetch,
  scheduled,
})
export type AppType = typeof routes
