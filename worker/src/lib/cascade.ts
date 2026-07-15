// Cascade-delete every row a single user owns across the D1 schema.
//
// Used by the account-deletion endpoint (DELETE /api/account) to erase a
// user's local footprint once their Clerk identity is gone. Kept as a
// standalone helper because a Clerk WEBHOOK cascade (user.deleted) wants
// the exact same erasure — a webhook and the in-app "Radera konto" button
// are two doors into one destructive operation, so the row-deletion logic
// lives in one place.
//
// Deletion is keyed by the Clerk user id (the JWT `sub`), resolved to the
// local numeric `users.id` here. If no local row exists (a user who never
// hit an authenticated write, or a double-fire), this is a no-op that
// reports `deleted: false` rather than throwing — the operation is
// idempotent by design.
//
// Ordering: every child table is deleted BEFORE the `users` row so the
// foreign keys never dangle even where ON DELETE CASCADE isn't relied on.
// `attempts` and `mock_results` reference `sessions`, so they precede it.
// A single db.batch keeps the whole erasure as close to atomic as D1
// allows (no interactive transactions — batch is the strongest primitive).

import { eq } from 'drizzle-orm'

import type { Db } from '../db/client'
import {
  attempts,
  dailyPlans,
  frameworkProgress,
  lessonProgress,
  lessonReads,
  mastery,
  mistakes,
  mockResults,
  sessions,
  srsState,
  users,
} from '../db/schema'

export type CascadeResult = {
  /** True if a local user row existed and was erased; false if there was
   *  nothing to delete (unknown user / already gone). */
  deleted: boolean
}

export async function cascadeDeleteUser(db: Db, clerkUserId: string): Promise<CascadeResult> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1)

  if (!row) return { deleted: false }
  const userId = row.id

  await db.batch([
    db.delete(mockResults).where(eq(mockResults.userId, userId)),
    db.delete(dailyPlans).where(eq(dailyPlans.userId, userId)),
    db.delete(lessonReads).where(eq(lessonReads.userId, userId)),
    db.delete(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.delete(mistakes).where(eq(mistakes.userId, userId)),
    db.delete(attempts).where(eq(attempts.userId, userId)),
    db.delete(srsState).where(eq(srsState.userId, userId)),
    db.delete(mastery).where(eq(mastery.userId, userId)),
    db.delete(frameworkProgress).where(eq(frameworkProgress.userId, userId)),
    db.delete(sessions).where(eq(sessions.userId, userId)),
    db.delete(users).where(eq(users.id, userId)),
  ])

  return { deleted: true }
}
