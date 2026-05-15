// Lazy user-row provisioning.
//
// The first time a Clerk user hits an authenticated route, we insert a
// row into `users` keyed by their `clerk_user_id` so all per-user FKs
// resolve. Subsequent hits return the cached row id.
//
// This avoids a separate "register" endpoint — anyone Clerk authenticated
// is, by definition, a known user.
//
// **Race-safe.** A SELECT-then-INSERT pattern was the original implementation
// but races under parallel requests on a fresh DB: two concurrent calls both
// miss the SELECT, both try INSERT, one wins the UNIQUE(clerk_user_id)
// constraint and the rest throw SQLITE_CONSTRAINT. Visible in CI on cold-D1
// runs where the e2e fixture's first authenticated nav fires multiple
// parallel API calls (api.spec, drill.spec, etc.) all at once.
//
// Fix: do a single INSERT ... ON CONFLICT DO UPDATE that always returns
// the row's id atomically — winner inserts, losers update a column to its
// own value (a no-op semantically) and RETURNING gives them the same id.

import { sql } from 'drizzle-orm'

import type { Db } from '../db/client'
import { users } from '../db/schema'

export async function ensureUserRow(db: Db, clerkUserId: string): Promise<number> {
  // Upsert by clerk_user_id, returning the row's id regardless of which side
  // (insert vs. conflict-update) won. The "update" is a no-op write to the
  // same column — SQLite still treats it as a successful UPSERT and emits
  // the RETURNING row, so callers always get a stable id.
  const result = await db
    .insert(users)
    .values({ clerkUserId })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { clerkUserId: sql`excluded.clerk_user_id` },
    })
    .returning({ id: users.id })
  return result[0].id
}
