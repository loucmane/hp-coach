// /api/explanations/feedback — "Hjälpte förklaringen?" per (user, question).
//
// The server side of the app/src/api/feedback.ts seam (LJ-16). The facit asks
// whether its explanation helped. The answer used to live only in the
// browser's localStorage, so it never reached us and did not follow the
// student to another device. The app still keeps that local copy for its
// reads, and also PUTs each answer here.
//
//   PUT /:qid  { verdict, note?, model? }: this user's answer for the question.
//              One row per (user, qid), so a later answer replaces the earlier
//              one whole: a note or model it leaves out is cleared, and
//              created_at becomes the time of the later answer.
//   GET /      this user's answers, newest first (for Konto). There is one row
//              per question, so the question bank bounds the list.
//
// `verdict` is the student's Ja, Delvis or Nej, stored as 'ja', 'delvis' or
// 'nej'. `model` names the model that wrote the explanation, so the feedback
// can be traced to the text it is about. The rows go with the account: the
// user_id foreign key cascades (see schema.ts).
//
// Authorization: every query is scoped by the user id the auth middleware
// set. No field in the path, body or query picks another owner.

import { zValidator } from '@hono/zod-validator'
import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { explanationFeedback } from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

const VERDICTS = ['ja', 'delvis', 'nej'] as const

// A question id: the sitting or P5 unit as lower-case tokens, then the
// section and a three-digit number. This is the pattern routes/sessions.ts
// checks a Provpass mark with (LJ-12). It is module-local there, so it is
// repeated here, and the route tests send the same ids to both routes.
const QID = /^[a-z0-9]+(?:-[a-z0-9]+)*-(?:ORD|L[ÄA]S|MEK|ELF|XYZ|KVA|NOG|DTK)-[0-9]{3}$/

const QidParam = z.object({ qid: z.string().max(80).regex(QID) })

const PutBody = z
  .object({
    verdict: z.enum(VERDICTS),
    note: z.string().max(500).optional(),
    model: z.string().min(1).max(100).optional(),
  })
  .strict()

/** What a client sees of a row: never its owner or its row id. */
const SHOWN = {
  qid: explanationFeedback.qid,
  verdict: explanationFeedback.verdict,
  note: explanationFeedback.note,
  model: explanationFeedback.model,
  createdAt: explanationFeedback.createdAt,
}

export const explanationFeedbackRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // PUT /api/explanations/feedback/:qid — upsert on the unique (user, qid)
  // index, the way PUT /api/daily-plans/:date upserts on (user, date).
  .put('/:qid', zValidator('param', QidParam), zValidator('json', PutBody), async (c) => {
    const { qid } = c.req.valid('param')
    const { verdict, note, model } = c.req.valid('json')
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const answer = { verdict, note: note ?? null, model: model ?? null, createdAt: new Date() }
    const [row] = await db
      .insert(explanationFeedback)
      .values({ userId, qid, ...answer })
      .onConflictDoUpdate({
        target: [explanationFeedback.userId, explanationFeedback.qid],
        set: answer,
      })
      .returning(SHOWN)
    return c.json({ feedback: row })
  })

  // GET /api/explanations/feedback — newest answer first. created_at is
  // stored in whole seconds, so the row id breaks a tie within one second.
  .get('/', async (c) => {
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const rows = await db
      .select(SHOWN)
      .from(explanationFeedback)
      .where(eq(explanationFeedback.userId, userId))
      .orderBy(desc(explanationFeedback.createdAt), desc(explanationFeedback.id))
    return c.json({ feedback: rows })
  })
