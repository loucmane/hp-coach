// HP-Coach API entry. Hono on Cloudflare Workers.
//
// Routes:
//   GET  /health           — public liveness + D1 round-trip
//   GET  /api/me/prefs     — authenticated; returns current user's prefs row
//   PATCH /api/me/prefs    — authenticated; partial update of prefs
//
// Middleware order: cors → JSON error formatter → (per-route) requireAuth
// + rateLimit. The Clerk JWT verify is mounted only on routes that need
// it; /health stays public.
//
// `AppType` is exported for the SPA's typed client (hono/client). Adding
// a new route automatically flows the types into the frontend.

import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { requireAuth } from './middleware/auth'
import { rateLimit } from './middleware/rateLimit'
import { healthRoute } from './routes/health'
import { meRoute } from './routes/me'
import type { Env, Vars } from './types'

const app = new Hono<{ Bindings: Env; Variables: Vars }>()

// CORS — the SPA on Pages will live on a different origin from the Worker.
// We allow the configured frontend origin(s) only; Authorization is the
// auth header we need to forward.
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow dev origins (vite dev) + any *.pages.dev for previews.
      if (!origin) return undefined
      if (origin.startsWith('http://localhost:5173')) return origin
      if (origin.startsWith('http://localhost:4173')) return origin
      if (/\.pages\.dev$/.test(new URL(origin).hostname)) return origin
      // Production domain TBD; add it here when DNS is wired.
      return undefined
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
    credentials: false,
    maxAge: 86_400,
  }),
)

// Centralised error → JSON mapper. Hono routes that throw fall through here.
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

// Public routes
app.route('/health', healthRoute)

// Authenticated routes — every route below this line gets requireAuth + rateLimit.
const authed = new Hono<{ Bindings: Env; Variables: Vars }>()
authed.use('*', requireAuth)
authed.use('*', rateLimit)
authed.route('/me', meRoute)

app.route('/api', authed)

// Root: small JSON descriptor so a curl to the bare worker domain returns
// something useful instead of a 404.
app.get('/', (c) =>
  c.json({
    name: 'hpc-api',
    environment: c.env.ENVIRONMENT,
    routes: ['/health', '/api/me/prefs'],
  }),
)

export default app
export type AppType = typeof app
