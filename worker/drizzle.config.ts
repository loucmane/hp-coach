import { defineConfig } from 'drizzle-kit'

// drizzle-kit emits SQL into ./drizzle/. Wrangler picks them up via the
// migrations_dir setting in wrangler.toml and applies them with
// `wrangler d1 migrations apply hpc-staging --env staging --remote` (and
// the analogous prod command). For local dev, `wrangler d1 migrations
// apply hpc-staging --local` runs them against the on-disk SQLite that
// `wrangler dev` uses behind the scenes.
//
// dbCredentials is unused for codegen — only for `drizzle-kit studio`
// against a real connection (we don't run studio against D1; if needed
// we'd open a tunnel to the remote).
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
})
