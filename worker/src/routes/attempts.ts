// /api/attempts — one row per question answered.
//
// Drill / mock / lesson all funnel here. The session row is the parent
// (sessions.id FK), so an attempt without a session is rejected. We
// validate that the session belongs to this user before insert — that
// way a forged sessionId from another user surfaces as 404, not as a
// silent cross-user write.
//
// Mistakes table writes are deliberately NOT in this route. They depend
// on Layer 1 framework tagging (task 38) and SRS scheduling (task 17),
// which are separate branches. Once those land, mistake-on-wrong logic
// hooks in here.
//
// MASTERY, on the other hand, IS written here. Per-Layer-1 mastery is an
// aggregate of exactly these graded answers, so the write that records an
// answer is the honest place to fold it in — see lib/progress.ts for the
// scoring model and why `framework_progress` moves along with it.
//
// The Layer 1 tags come from the CLIENT (`layer1Ids`), the same contract
// /api/mistakes already uses. The worker can't derive them: the qid →
// framework_id map lives in the Layer 2 explanation corpus, which is R2
// content the SPA loads and the API only proxies. Untagged attempts are
// still recorded in full — they just don't move any aggregate.

import { zValidator } from '@hono/zod-validator'
import { and, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { attempts, sessions, users } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import { applyMasteryOutcome } from '../lib/progress'
import { extractSection } from '../lib/section'
import type { Env, Vars } from '../types'

const AttemptBody = z
  .object({
    sessionId: z.number().int().positive(),
    questionId: z.string().min(1).max(60),
    selectedAnswer: z.string().min(1).max(8),
    correct: z.boolean(),
    timeTakenMs: z
      .number()
      .int()
      .min(0)
      .max(60 * 60 * 1000)
      .optional(),
    // Optional Layer 1 tags for this question — mirrors the `layer1Ids`
    // field /api/mistakes takes. Absent/empty means "untagged": the
    // attempt lands, the mastery aggregate simply isn't moved.
    layer1Ids: z.array(z.string().min(1).max(40)).max(8).optional(),
  })
  .strict()

export const attemptsRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // POST /api/attempts — record one answered question.
  .post('/', zValidator('json', AttemptBody), async (c) => {
    const body = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)

    // Verify the session belongs to this user. Cheap query; prevents the
    // SPA from accidentally posting against a stale id from another login.
    const [session] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.id, body.sessionId), eq(sessions.userId, userId)))
      .limit(1)
    if (!session) {
      return c.json({ error: { code: 'not_found', message: 'Session not found' } }, 404)
    }

    // Insert the attempt AND bump the user's lifetime counter atomically
    // (one D1 transaction), so the all-time total stays correct even after
    // the retention cron prunes old attempts rows.
    const [inserted] = await db.batch([
      db
        .insert(attempts)
        .values({
          userId,
          sessionId: body.sessionId,
          questionId: body.questionId,
          selectedAnswer: body.selectedAnswer,
          correct: body.correct,
          timeTakenMs: body.timeTakenMs ?? null,
        })
        .returning(),
      db
        .update(users)
        .set({ attemptsTotal: sql`${users.attemptsTotal} + 1` })
        .where(eq(users.id, userId)),
    ])

    // Fold the graded answer into the Layer 1 aggregates. Both inputs are
    // required and neither is guessable: `section` comes off the qid, and
    // `mastery.section` / `mastery.layer1_id` are both NOT NULL, so an
    // attempt missing either one is recorded WITHOUT touching mastery
    // rather than written under a fabricated key.
    //
    // Awaited, not fire-and-forget: it's 2–4 extra statements against the
    // same D1 and the caller invalidates stats off this response, so a
    // detached write could lose the race with the client's refetch.
    const section = extractSection(body.questionId)
    if (section && body.layer1Ids?.length) {
      for (const layer1Id of body.layer1Ids) {
        await applyMasteryOutcome(db, userId, section, layer1Id, body.correct)
      }
    }

    return c.json({ attempt: inserted[0] }, 201)
  })
