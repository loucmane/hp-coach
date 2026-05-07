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
  // Plain string vars
  ENVIRONMENT: 'dev' | 'staging' | 'production'
  // Secrets (set via `wrangler secret put`)
  CLERK_SECRET_KEY: string
}

// Hono context variables set by middleware. `userId` is populated by the
// Clerk JWT verify middleware once it has authenticated the request; it's
// the Clerk user id (strings like "user_2abc…").
export type Vars = {
  userId: string
}
