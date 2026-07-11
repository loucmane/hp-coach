// /api/me/export + /api/me/import — full-account JSON backup / restore.
//
// Lock-in mitigation (task #28): the user's only durable copy of their
// data today is whatever is in D1. This gives them a portable JSON
// snapshot they control — a personal backup, and an exit ramp if they
// ever want to leave the platform.
//
// Envelope: { schemaVersion, exportedAt, user, tables: { ... } }. Every
// user-scoped table with a LIVE route is included: sessions, attempts,
// mistakes, lessonProgress, lessonReads, dailyPlans, mockResults, plus
// the `users` row itself (prefs). Tables with no route wired up yet
// (srsState, mastery, frameworkProgress) hold no live data path and are
// intentionally excluded — nothing currently writes them.
//
// Import is OVERWRITE mode, scoped to the CURRENT authenticated user:
//   1. Validate the envelope shape + schemaVersion + a size cap.
//   2. Within a single db.batch (D1 has no interactive transactions —
//      batch is the closest thing to atomic multi-statement execution),
//      delete every existing row owned by this user across all exported
//      tables, then re-insert the payload's rows.
//   3. Every inserted row's userId is REMAPPED to the current user's id
//      — ids inside the payload (including `user.id` and any FK-shaped
//      fields) are NEVER trusted to address rows across users. Session
//      ids are ALSO remapped: sessions insert first (outside the batch,
//      one at a time) so we can capture the fresh autoincrement id D1
//      assigns; attempts/mockResults then reference that fresh id, never
//      the payload's original session id — reusing payload ids verbatim
//      would collide with unrelated rows already occupying that id on
//      the shared table. This is what makes "upload someone else's
//      export" a no-op against your own account rather than a cross-user
//      write, and makes re-importing your own export idempotent.
//
// The `users` row itself is handled specially: only the prefs-shaped
// columns are restored (coach/palette/mode/font/density/etc + onboarding
// answers) — clerkUserId and the lifetime counters (attemptsTotal,
// drillsTotal) stay derived from the live account, not the snapshot, so
// import can't be used to forge activity counters or hijack another
// Clerk identity.

import { eq } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import {
  attempts,
  dailyPlans,
  lessonProgress,
  lessonReads,
  mistakes,
  mockResults,
  sessions,
  users,
} from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

export const SCHEMA_VERSION = 1 as const

// Generous but bounded — a single dogfood user's full history (hundreds
// to low thousands of rows across all tables) sits comfortably under 1
// MB of JSON; 5 MB leaves headroom for years of use while still refusing
// a pathological/malicious payload before it reaches D1.
const MAX_IMPORT_BYTES = 5 * 1024 * 1024

// ── Per-table row-count caps ─────────────────────────────────────────────
// The byte cap alone (MAX_IMPORT_BYTES) is not enough: a 5 MB payload can
// still contain tens of thousands of TINY rows, and the insert phase used
// to run one `await` per row. Enough rows there blows Workers' wall-clock
// budget or D1's per-request limits — AFTER the wipe phase has already
// deleted the user's existing data. That's the wipe-then-fail bug this
// cap + the chunked batching below (see insertChunked) close.
//
// Budget arithmetic: pick a total-statement ceiling comfortably inside any
// plausible Workers/D1 execution budget, then split it across tables.
// 20,000 total insert statements, executed in db.batch() chunks of 100
// (INSERT_CHUNK_SIZE below), is at most 200 sequential batch round trips
// for the WORST case payload — each round trip is a single D1 call, not a
// per-row fetch, so 200 of them finishes in low single-digit seconds even
// on a slow edge, nowhere near the ~30s wall-clock ceiling. The per-table
// split below sums to exactly that 20,000 budget:
//
//   sessions        2,000
//   attempts       12,000   (heaviest table — many attempts per session)
//   mistakes        2,000
//   lessonProgress  1,000
//   lessonReads     1,000
//   dailyPlans        500
//   mockResults     1,500
//   ────────────────────
//   total          20,000
//
// Each cap is still generous against a real single-user export: per the
// comment above, a heavy dogfood account sits at hundreds-to-low-thousands
// of rows TOTAL across every table, under 1 MB of JSON — these per-table
// numbers are 1–2 orders of magnitude above that.
export const TABLE_ROW_CAPS = {
  sessions: 2_000,
  attempts: 12_000,
  mistakes: 2_000,
  lessonProgress: 1_000,
  lessonReads: 1_000,
  dailyPlans: 500,
  mockResults: 1_500,
} as const

// Statements per db.batch() call. D1 batches are atomic per chunk (not
// across chunks), and keeping each chunk in the tens avoids oversized
// single requests while still cutting round trips by ~100x versus one
// await per row.
const INSERT_CHUNK_SIZE = 100

// ── Per-table row shapes accepted on import ─────────────────────────────
// Deliberately permissive on optional/nullable fields (mirrors the
// column nullability in schema.ts) but strict on unknown keys — an
// export from a newer schema with extra fields should fail loudly
// (schemaVersion mismatch), not silently truncate.

const SessionShape = z
  .object({
    id: z.number().int(),
    startedAt: z.union([z.number(), z.string(), z.null()]).optional(),
    endedAt: z.union([z.number(), z.string(), z.null()]).optional(),
    kind: z.string(),
    sections: z.string().nullable().optional(),
    position: z.number().int().optional(),
    currentQuestionId: z.string().nullable().optional(),
    plan: z.array(z.string()).nullable().optional(),
    device: z.enum(['phone', 'tablet', 'desktop']).nullable().optional(),
  })
  .passthrough()

const AttemptShape = z
  .object({
    id: z.number().int(),
    sessionId: z.number().int(),
    questionId: z.string(),
    selectedAnswer: z.string().nullable().optional(),
    correct: z.boolean().nullable().optional(),
    timeTakenMs: z.number().int().nullable().optional(),
    createdAt: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough()

const MistakeShape = z
  .object({
    id: z.number().int(),
    questionId: z.string(),
    layer1Ids: z.array(z.string()).nullable().optional(),
    status: z.string().nullable().optional(),
    errorCount7d: z.number().int().nullable().optional(),
    lastErrorAt: z.union([z.number(), z.string(), z.null()]).optional(),
    nextReviewAt: z.union([z.number(), z.string(), z.null()]).optional(),
    intervalMinutes: z.number().int().optional(),
  })
  .passthrough()

const LessonProgressShape = z
  .object({
    id: z.number().int(),
    section: z.string(),
    frameworkId: z.string().nullable().optional(),
    device: z.enum(['phone', 'tablet', 'desktop']).nullable().optional(),
    updatedAt: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough()

const LessonReadShape = z
  .object({
    id: z.number().int(),
    entryId: z.string(),
    readAt: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough()

const DailyPlanShape = z
  .object({
    id: z.number().int(),
    date: z.string(),
    plan: z.unknown(),
    updatedAt: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough()

const MockResultShape = z
  .object({
    id: z.number().int(),
    sessionId: z.number().int(),
    mode: z.enum(['authentic', 'synthetic']),
    half: z.enum(['verbal', 'kvant']),
    examId: z.string().nullable().optional(),
    provpass: z.string().nullable().optional(),
    presented: z.number().int(),
    answered: z.number().int(),
    correct: z.number().int(),
    seenBefore: z.number().int(),
    durationMs: z.number().int(),
    breakdown: z.unknown(),
    createdAt: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough()

const UserPrefsShape = z
  .object({
    daysToExam: z.number().int().nullable().optional(),
    dailyMinutes: z.number().int().nullable().optional(),
    targetSittingId: z.string().nullable().optional(),
    coach: z.enum(['kompis', 'professor', 'taktiker']).nullable().optional(),
    palette: z.enum(['sand', 'sage', 'ink', 'rose', 'spalt']).nullable().optional(),
    mode: z.enum(['light', 'dark']).nullable().optional(),
    font: z.enum(['literary', 'geometric', 'editorial', 'hyperlegible']).nullable().optional(),
    density: z.enum(['compact', 'regular', 'comfy']).nullable().optional(),
    showStreak: z.boolean().nullable().optional(),
  })
  .passthrough()

const ImportBody = z
  .object({
    schemaVersion: z.number().int(),
    exportedAt: z.union([z.number(), z.string()]),
    user: UserPrefsShape,
    tables: z
      .object({
        sessions: z.array(SessionShape),
        attempts: z.array(AttemptShape),
        mistakes: z.array(MistakeShape),
        lessonProgress: z.array(LessonProgressShape),
        lessonReads: z.array(LessonReadShape),
        dailyPlans: z.array(DailyPlanShape),
        mockResults: z.array(MockResultShape),
      })
      .strict(),
  })
  .strict()

function toDateOrNull(v: number | string | null | undefined): Date | null {
  if (v == null) return null
  const d = typeof v === 'number' ? new Date(v) : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}
function toDateOrUndefined(v: number | string | null | undefined): Date | undefined {
  const d = toDateOrNull(v)
  return d ?? undefined
}

function chunksOf<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

// db.batch()'s type wants a statically non-empty tuple ([U, ...U[]]) so it
// can't be called directly on a dynamically-built array — this helper
// contains the one cast that bridges that gap, guarded by the emptiness
// check so it's never applied to an actually-empty array.
async function batchNonEmpty(
  db: ReturnType<typeof getDb>,
  stmts: BatchItem<'sqlite'>[],
): Promise<unknown[]> {
  if (stmts.length === 0) return []
  return db.batch(stmts as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])
}

// Insert every row in `items` via chunked db.batch() calls (INSERT_CHUNK_SIZE
// per chunk) instead of one `await` per row — this is what keeps a
// tens-of-thousands-of-rows import from blowing Workers' wall-clock budget
// with sequential round trips (see TABLE_ROW_CAPS comment for the budget
// arithmetic this depends on).
async function insertChunked<T>(
  db: ReturnType<typeof getDb>,
  items: T[],
  toStmt: (item: T) => BatchItem<'sqlite'>,
): Promise<void> {
  for (const chunk of chunksOf(items, INSERT_CHUNK_SIZE)) {
    await batchNonEmpty(db, chunk.map(toStmt))
  }
}

// GET /api/me/export — everything this user owns, one JSON document.
export const exportRoute = new Hono<{ Bindings: Env; Variables: Vars }>().get('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = await ensureUserRow(db, c.var.userId)

  const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  const [
    sessionRows,
    attemptRows,
    mistakeRows,
    lessonProgressRows,
    lessonReadRows,
    dailyPlanRows,
    mockResultRows,
  ] = await Promise.all([
    db.select().from(sessions).where(eq(sessions.userId, userId)),
    db.select().from(attempts).where(eq(attempts.userId, userId)),
    db.select().from(mistakes).where(eq(mistakes.userId, userId)),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.select().from(lessonReads).where(eq(lessonReads.userId, userId)),
    db.select().from(dailyPlans).where(eq(dailyPlans.userId, userId)),
    db.select().from(mockResults).where(eq(mockResults.userId, userId)),
  ])

  return c.json({
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    user: userRow ?? null,
    tables: {
      sessions: sessionRows,
      attempts: attemptRows,
      mistakes: mistakeRows,
      lessonProgress: lessonProgressRows,
      lessonReads: lessonReadRows,
      dailyPlans: dailyPlanRows,
      mockResults: mockResultRows,
    },
  })
})

// POST /api/me/import — overwrite this user's data with the payload.
export const importRoute = new Hono<{ Bindings: Env; Variables: Vars }>().post('/', async (c) => {
  const rawBody = await c.req.text()
  const byteLength = new TextEncoder().encode(rawBody).length
  if (byteLength > MAX_IMPORT_BYTES) {
    return c.json(
      {
        error: {
          code: 'payload_too_large',
          message: `Import payload exceeds the ${MAX_IMPORT_BYTES / (1024 * 1024)} MB limit`,
        },
      },
      413,
    )
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return c.json({ error: { code: 'bad_request', message: 'Invalid JSON' } }, 400)
  }

  // Check schemaVersion BEFORE full validation so a stale/future export
  // gets a clear, specific error rather than a generic shape-mismatch
  // wall of zod issues.
  const versionCheck = z.object({ schemaVersion: z.number().int() }).safeParse(json)
  if (!versionCheck.success || versionCheck.data.schemaVersion !== SCHEMA_VERSION) {
    return c.json(
      {
        error: {
          code: 'unsupported_schema_version',
          message: `Expected schemaVersion ${SCHEMA_VERSION}, got ${
            versionCheck.success ? versionCheck.data.schemaVersion : 'missing/invalid'
          }`,
        },
      },
      400,
    )
  }

  const parsed = ImportBody.safeParse(json)
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: 'invalid_payload',
          message: 'Import payload failed validation',
          issues: parsed.error.issues.slice(0, 20),
        },
      },
      400,
    )
  }
  const body = parsed.data

  // Row-count caps, validated BEFORE anything touches the database. This
  // must run before the delete phase below — the whole point is that an
  // over-cap payload leaves existing data untouched (see TABLE_ROW_CAPS
  // comment for the budget arithmetic).
  for (const [table, cap] of Object.entries(TABLE_ROW_CAPS) as Array<
    [keyof typeof TABLE_ROW_CAPS, number]
  >) {
    const rowCount = body.tables[table].length
    if (rowCount > cap) {
      return c.json(
        {
          error: {
            code: 'table_row_cap_exceeded',
            message: `Table "${table}" has ${rowCount} rows, exceeding the cap of ${cap}`,
          },
        },
        413,
      )
    }
  }

  const db = getDb(c.env.DB)
  const userId = await ensureUserRow(db, c.var.userId)

  // Delete everything this user currently owns first. A single db.batch
  // keeps the wipe as close to atomic as D1 allows — no interactive
  // transactions, so this is the strongest consistency primitive
  // available (see testD1.ts / drizzle-orm/d1 batch docs).
  await db.batch([
    db.delete(mockResults).where(eq(mockResults.userId, userId)),
    db.delete(dailyPlans).where(eq(dailyPlans.userId, userId)),
    db.delete(lessonReads).where(eq(lessonReads.userId, userId)),
    db.delete(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.delete(mistakes).where(eq(mistakes.userId, userId)),
    db.delete(attempts).where(eq(attempts.userId, userId)),
    db.delete(sessions).where(eq(sessions.userId, userId)),
  ])

  // Sessions are inserted FIRST, in chunked db.batch() calls, so we can
  // capture the fresh autoincrement id D1 assigns each row (never the
  // payload's id — that id may already belong to another user's row on
  // this shared table). `attempts` and `mockResults` reference sessions
  // by id, so this mapping (payload session id → freshly-inserted session
  // id) is threaded through when inserting them below. Rows whose
  // sessionId isn't in the map (a malformed export) are skipped rather
  // than thrown, so one bad row can't sink the whole import.
  //
  // The map MUST be fully built — every chunk's results merged in — before
  // any dependent-table insert reads from it, since a referenced session
  // can land in any chunk (including the last one).
  const sessionIdMap = new Map<number, number>()
  for (const chunk of chunksOf(body.tables.sessions, INSERT_CHUNK_SIZE)) {
    const stmts = chunk.map((s) =>
      db
        .insert(sessions)
        .values({
          userId,
          startedAt: toDateOrUndefined(s.startedAt),
          endedAt: toDateOrNull(s.endedAt),
          kind: s.kind,
          sections: s.sections ?? null,
          position: s.position ?? 0,
          currentQuestionId: s.currentQuestionId ?? null,
          plan: s.plan ?? null,
          device: s.device ?? null,
        })
        .returning({ id: sessions.id }),
    )
    const results = await batchNonEmpty(db, stmts)
    results.forEach((rows, i) => {
      const [row] = rows as Array<{ id: number }>
      sessionIdMap.set(chunk[i].id, row.id)
    })
  }

  const attemptsToInsert = body.tables.attempts.filter((a) => sessionIdMap.has(a.sessionId))
  const mockResultsToInsert = body.tables.mockResults.filter((mr) => sessionIdMap.has(mr.sessionId))

  await insertChunked(db, attemptsToInsert, (a) =>
    db.insert(attempts).values({
      userId,
      sessionId: sessionIdMap.get(a.sessionId) as number,
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer ?? null,
      correct: a.correct ?? null,
      timeTakenMs: a.timeTakenMs ?? null,
      createdAt: toDateOrUndefined(a.createdAt),
    }),
  )
  await insertChunked(db, body.tables.mistakes, (m) =>
    db.insert(mistakes).values({
      userId,
      questionId: m.questionId,
      layer1Ids: m.layer1Ids ?? null,
      status: m.status ?? 'active',
      errorCount7d: m.errorCount7d ?? 1,
      lastErrorAt: toDateOrUndefined(m.lastErrorAt),
      nextReviewAt: toDateOrNull(m.nextReviewAt),
      intervalMinutes: m.intervalMinutes ?? 0,
    }),
  )
  await insertChunked(db, body.tables.lessonProgress, (lp) =>
    db.insert(lessonProgress).values({
      userId,
      section: lp.section,
      frameworkId: lp.frameworkId ?? null,
      device: lp.device ?? null,
      updatedAt: toDateOrUndefined(lp.updatedAt),
    }),
  )
  await insertChunked(db, body.tables.lessonReads, (lr) =>
    db.insert(lessonReads).values({
      userId,
      entryId: lr.entryId,
      readAt: toDateOrUndefined(lr.readAt),
    }),
  )
  await insertChunked(db, body.tables.dailyPlans, (dp) =>
    db.insert(dailyPlans).values({
      userId,
      date: dp.date,
      plan: dp.plan,
      updatedAt: toDateOrUndefined(dp.updatedAt),
    }),
  )
  await insertChunked(db, mockResultsToInsert, (mr) =>
    db.insert(mockResults).values({
      userId,
      sessionId: sessionIdMap.get(mr.sessionId) as number,
      mode: mr.mode,
      half: mr.half,
      examId: mr.examId ?? null,
      provpass: mr.provpass ?? null,
      presented: mr.presented,
      answered: mr.answered,
      correct: mr.correct,
      seenBefore: mr.seenBefore,
      durationMs: mr.durationMs,
      breakdown: mr.breakdown,
      createdAt: toDateOrUndefined(mr.createdAt),
    }),
  )

  // Restore prefs onto the (already-provisioned) user row. clerkUserId
  // and the lifetime counters are NEVER taken from the payload — they
  // stay derived from the live account, not the snapshot.
  await db
    .update(users)
    .set({
      daysToExam: body.user.daysToExam ?? null,
      dailyMinutes: body.user.dailyMinutes ?? undefined,
      targetSittingId: body.user.targetSittingId ?? null,
      coach: body.user.coach ?? undefined,
      palette: body.user.palette ?? undefined,
      mode: body.user.mode ?? undefined,
      font: body.user.font ?? undefined,
      density: body.user.density ?? undefined,
      showStreak: body.user.showStreak ?? undefined,
    })
    .where(eq(users.id, userId))

  return c.json({
    ok: true as const,
    restored: {
      sessions: body.tables.sessions.length,
      attempts: body.tables.attempts.length,
      mistakes: body.tables.mistakes.length,
      lessonProgress: body.tables.lessonProgress.length,
      lessonReads: body.tables.lessonReads.length,
      dailyPlans: body.tables.dailyPlans.length,
      mockResults: body.tables.mockResults.length,
    },
  })
})
