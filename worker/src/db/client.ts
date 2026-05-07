// Drizzle handle bound to a D1 database from the request context.
// Each Worker invocation gets its own short-lived client — no connection
// pooling needed; D1 is HTTP under the hood.

import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema'

export type Db = ReturnType<typeof getDb>

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema })
}
