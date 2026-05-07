// Lazy user-row provisioning.
//
// The first time a Clerk user hits an authenticated route, we insert a
// row into `users` keyed by their `clerk_user_id` so all per-user FKs
// resolve. Subsequent hits return the cached row id.
//
// This avoids a separate "register" endpoint — anyone Clerk authenticated
// is, by definition, a known user.

import { eq } from 'drizzle-orm'

import type { Db } from '../db/client'
import { users } from '../db/schema'

export async function ensureUserRow(db: Db, clerkUserId: string): Promise<number> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1)
  if (existing[0]) return existing[0].id

  const inserted = await db.insert(users).values({ clerkUserId }).returning({ id: users.id })
  return inserted[0].id
}
