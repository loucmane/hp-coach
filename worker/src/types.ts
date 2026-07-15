// Worker runtime bindings. Matches wrangler.toml.
//
// Hono's `Bindings` generic flows through every route handler, so any
// `c.env.DB` access type-checks against this shape. Updating bindings
// in wrangler.toml requires a corresponding edit here.

export type Env = {
  // D1 SQLite database (per env: hpc-staging or hpc-prod)
  DB: D1Database
  // KV namespace for rate-limit counters and ephemeral cache
  RATE_LIMIT: KVNamespace
  // R2 bucket holding the strict-tier corpus (question bank data/*.json
  // + Layer 2 explanations/*.json). Served auth-gated via /api/content.
  CONTENT: R2Bucket
  // Plain string vars
  ENVIRONMENT: 'dev' | 'staging' | 'production'
  // Deploy commit SHA, set by the deploy workflow; absent in local dev.
  GIT_SHA?: string
  // Secrets (set via `wrangler secret put`)
  CLERK_SECRET_KEY: string
  // Svix signing secret for the Clerk sync webhook (whsec_…). Set per env
  // via `wrangler secret put CLERK_WEBHOOK_SECRET --env staging|production`
  // once the owner creates the webhook endpoint in the Clerk dashboard.
  // Absent until then — the route 500s (Clerk-retryable) while unset.
  CLERK_WEBHOOK_SECRET: string
  // Optional. When set in dev/staging, /api/dev/login issues a sign-in
  // token for this user — lets MCP-driven browsers bypass Clerk's email
  // OTP flow for visual verification. Refused in production regardless.
  DEV_LOGIN_EMAIL?: string
}

// Hono context variables set by middleware. `userId` is populated by the
// Clerk JWT verify middleware once it has authenticated the request; it's
// the Clerk user id (strings like "user_2abc…").
export type Vars = {
  userId: string
}
