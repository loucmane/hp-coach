// Layer 1 progress aggregates — the writers behind `mastery` and
// `framework_progress`.
//
// Both tables shipped with the initial schema and then sat write-dead:
// the only inserts anywhere were in tests, and lib/cascade.ts only ever
// DELETEd them on account deletion. Anything reading them (the curriculum
// scheduler, next) would have read empty rows forever, silently. This
// module is the single place production fills them, shared by the two
// natural producers:
//
//   - `PUT/DELETE /api/lesson-reads`  → markFrameworkTaught / unmark…
//     A lesson-read carries the Layer 1 entry id verbatim (LessonReader
//     passes `entry.id` from the framework JSON), which is precisely
//     `framework_progress.layer1_id`. Reading an entry is the "taught"
//     event the untaught → learning edge was waiting for.
//   - `POST /api/attempts`            → applyMasteryOutcome
//     Grading already funnels every drill / mock / lesson answer through
//     that route. Per-Layer-1 mastery is an aggregate OF those answers,
//     so it belongs on the same write.
//
// ── Why the score is an EWMA seeded at a NEUTRAL prior ───────────────
//
// `mastery` has exactly one numeric column (`score`, real, 0–1). There is
// no exposure/attempt counter, and this pass is explicitly barred from
// adding one. That single number therefore has to encode BOTH "how well
// is this going" and "how much evidence is behind it", or the ladder
// below would promote a user to `mastered` off one lucky correct answer.
//
// An exponentially-weighted moving average seeded at MASTERY_PRIOR (0.5,
// i.e. "no opinion") does that honestly: the score can only approach the
// mastered band after a RUN of correct answers, because each observation
// moves it just MASTERY_ALPHA of the remaining distance. From cold it
// takes four consecutive corrects to cross MASTERED_AT, and a single miss
// drops it well back — which is the behaviour you want from something the
// scheduler will use to decide what to stop showing the user.
//
// Seeding from the outcome instead (score = 1 on a first correct) would
// have been simpler and would have been a lie.

import { and, eq } from 'drizzle-orm'

import type { Db } from '../db/client'
import { frameworkProgress, mastery } from '../db/schema'

/** How far each new observation drags the score toward it. */
export const MASTERY_ALPHA = 0.3
/** "No opinion yet" — where a brand-new item starts. See header. */
export const MASTERY_PRIOR = 0.5
/** Score at or above which a framework counts as retained. */
export const RETAINING_AT = 0.75
/** Score at or above which a framework counts as mastered. */
export const MASTERED_AT = 0.85

/** The state machine documented on the `framework_progress` table. */
export const FRAMEWORK_STATUSES = [
  'untaught',
  'learning',
  'practicing',
  'retaining',
  'mastered',
] as const
export type FrameworkStatus = (typeof FRAMEWORK_STATUSES)[number]

/** Rungs reachable once the user has actually practised the framework. */
export type PractisedStatus = Extract<FrameworkStatus, 'practicing' | 'retaining' | 'mastered'>

/**
 * Next EWMA score after one graded exposure.
 *
 * `prev` is null/undefined for a brand-new item (and for legacy rows that
 * predate this writer), in which case we start from the neutral prior
 * rather than from the observation. Rounded to 4 decimals so a long
 * practice history doesn't accumulate float noise in the column.
 */
export function nextMasteryScore(prev: number | null | undefined, correct: boolean): number {
  const base = prev ?? MASTERY_PRIOR
  const observation = correct ? 1 : 0
  const next = base + MASTERY_ALPHA * (observation - base)
  return Number(Math.min(1, Math.max(0, next)).toFixed(4))
}

/**
 * Band a mastery score into a practised rung.
 *
 * Deliberately a pure function of the score, not a monotonic ratchet:
 * a user who has stopped getting a pattern right is not "mastered" any
 * more, and the scheduler needs to hear that. Demotion can walk back down
 * to `practicing` but never to `learning`/`untaught` — practice is a
 * one-way door, only the QUALITY of it moves both ways.
 */
export function statusForScore(score: number): PractisedStatus {
  if (score >= MASTERED_AT) return 'mastered'
  if (score >= RETAINING_AT) return 'retaining'
  return 'practicing'
}

// ── DB writers ───────────────────────────────────────────────────────
//
// Read-then-write rather than INSERT … ON CONFLICT DO UPDATE, because
// neither table carries a unique index on its natural key ((user_id,
// section, layer1_id) / (user_id, layer1_id)) and adding one is a
// migration this pass is barred from. Same trade-off mistakes.ts already
// makes and documents: one extra round-trip per write, fine at our scale.
// The read+write pair is not atomic, so two SIMULTANEOUS writes for the
// same key could in principle both miss the SELECT and insert twice; at
// dogfood scale (one user, sequential answers) that race isn't reachable.
// The unique indexes are the real fix — see the residue note on this bead.

/** Upsert `framework_progress` for one (user, layer1Id) to `status`. */
async function setFrameworkStatus(
  db: Db,
  userId: number,
  layer1Id: string,
  status: FrameworkStatus,
): Promise<FrameworkStatus> {
  const [existing] = await db
    .select()
    .from(frameworkProgress)
    .where(and(eq(frameworkProgress.userId, userId), eq(frameworkProgress.layer1Id, layer1Id)))
    .limit(1)

  if (!existing) {
    await db
      .insert(frameworkProgress)
      .values({ userId, layer1Id, status, lastTransitionAt: new Date() })
    return status
  }
  // No-op writes shouldn't churn `lastTransitionAt` — the column names a
  // TRANSITION, and a scheduler reading "how long in this state" would be
  // wrong if every re-read reset the clock.
  if (existing.status === status) return status
  await db
    .update(frameworkProgress)
    .set({ status, lastTransitionAt: new Date() })
    .where(eq(frameworkProgress.id, existing.id))
  return status
}

/**
 * The "taught" edge: untaught → learning when the user reads a Layer 1
 * entry. A framework already past `learning` is left alone — re-reading
 * the lektion for a pattern you've mastered must not demote you.
 */
export async function markFrameworkTaught(
  db: Db,
  userId: number,
  layer1Id: string,
): Promise<FrameworkStatus> {
  const [existing] = await db
    .select()
    .from(frameworkProgress)
    .where(and(eq(frameworkProgress.userId, userId), eq(frameworkProgress.layer1Id, layer1Id)))
    .limit(1)
  if (existing && existing.status !== 'untaught') return existing.status as FrameworkStatus
  return setFrameworkStatus(db, userId, layer1Id, 'learning')
}

/**
 * Undo of the above, for un-marking a lesson entry as read. Only reverses
 * the edge it owns: a framework the user has since PRACTISED keeps its
 * earned rung, because un-ticking a reading checkbox is not evidence
 * about their answers.
 */
export async function unmarkFrameworkTaught(
  db: Db,
  userId: number,
  layer1Id: string,
): Promise<FrameworkStatus | null> {
  const [existing] = await db
    .select()
    .from(frameworkProgress)
    .where(and(eq(frameworkProgress.userId, userId), eq(frameworkProgress.layer1Id, layer1Id)))
    .limit(1)
  if (!existing) return null
  if (existing.status !== 'learning') return existing.status as FrameworkStatus
  return setFrameworkStatus(db, userId, layer1Id, 'untaught')
}

/**
 * Fold one graded answer into `mastery` for (section, layer1Id), then
 * re-band `framework_progress` from the resulting score.
 *
 * Practising a framework the user never opened in the lektion is fine and
 * lands them straight on `practicing` — plenty of users learn a pattern
 * by hitting it in a drill, and pretending they're still `untaught`
 * would misinform the scheduler.
 */
export async function applyMasteryOutcome(
  db: Db,
  userId: number,
  section: string,
  layer1Id: string,
  correct: boolean,
): Promise<{ score: number; status: FrameworkStatus }> {
  const [existing] = await db
    .select()
    .from(mastery)
    .where(
      and(eq(mastery.userId, userId), eq(mastery.section, section), eq(mastery.layer1Id, layer1Id)),
    )
    .limit(1)

  const score = nextMasteryScore(existing?.score, correct)
  const now = new Date()
  if (existing) {
    await db.update(mastery).set({ score, lastUpdatedAt: now }).where(eq(mastery.id, existing.id))
  } else {
    await db.insert(mastery).values({ userId, section, layer1Id, score, lastUpdatedAt: now })
  }

  const status = await setFrameworkStatus(db, userId, layer1Id, statusForScore(score))
  return { score, status }
}
