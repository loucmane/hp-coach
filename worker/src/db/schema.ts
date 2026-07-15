// HP-Coach D1 schema — Cloudflare D1 (managed SQLite at edge), Drizzle ORM.
//
// Ported 2026-05-07 from the cancelled OPFS schema (task 3) onto the cloud
// path (task 57). The shape is the same — sqliteTable, integer/text/real —
// because D1 IS SQLite. The critical addition is a `user_id` foreign key
// on every per-user table so the API middleware can scope every query
// (`WHERE user_id = currentUser`) and the client cannot bypass authorization.
//
// `users.clerk_user_id` is the link to Clerk's user table; populated lazily
// the first time a signed-in user hits any authenticated route.

import { sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

// Device provenance for resumption surfaces — "pausad på telefon" reads
// as a warm memory anchor for a single phone↔laptop user. Nullable on
// every row (legacy rows + server-side writes have no device).
export const DEVICE_KINDS = ['phone', 'tablet', 'desktop'] as const
export type DeviceKind = (typeof DEVICE_KINDS)[number]

// ── users — one row per Clerk user (single local profile per device) ───
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  // Onboarding answers
  daysToExam: integer('days_to_exam'),
  dailyMinutes: integer('daily_minutes').default(20),
  targetSittingId: text('target_sitting_id'), // 'host-2026' etc.
  // Coach + theme prefs (mirror Zustand stores; DB is the source of truth)
  coach: text('coach', { enum: ['kompis', 'professor', 'taktiker'] }).default('taktiker'),
  palette: text('palette', { enum: ['sand', 'sage', 'ink', 'rose', 'spalt'] }).default('sand'),
  mode: text('mode', { enum: ['light', 'dark'] }).default('light'),
  font: text('font', {
    enum: ['literary', 'geometric', 'editorial', 'hyperlegible'],
  }).default('literary'),
  density: text('density', { enum: ['compact', 'regular', 'comfy'] }).default('regular'),
  showStreak: integer('show_streak', { mode: 'boolean' }).default(false),
  // "Inte idag" Provpass defer — a local YYYY-MM-DD date string. When it
  // equals TODAY (client-local), the scheduler suppresses that day's
  // Provpass anchor (Kallelse) and generates the ordinary Dagens plan
  // instead. Day-scoped: stale values are inert, so no cleanup job is
  // needed. Synced so a defer on the phone holds on the laptop.
  mockDeferredDate: text('mock_deferred_date'),
  // Lifetime activity counters, incremented on each write. They let the
  // all-time stats ("X frågor totalt", "Y pass") be O(1) reads instead of
  // count(*) scans, AND — crucially — they decouple the lifetime totals
  // from the raw attempts/sessions rows, so the retention cron can prune
  // old rows without changing what the user sees. See lib/retention.ts.
  attemptsTotal: integer('attempts_total').notNull().default(0),
  drillsTotal: integer('drills_total').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// ── sessions — drill / mock / lesson / adaptive_review ─────────────────
//
// Mid-session resume contract: while `endedAt` is null, this row IS the
// session. `position` is the index into the session's plan (0-based), so
// a device swap during exercise resumes at the exact step. `currentQuestionId`
// is the precise pointer inside that step (optional — null for lessons,
// set during drill/mock).
//
// Cross-device resume (task: xdevice): `plan` stores the ordered qids so
// device B replays the EXACT same sequence rather than re-rolling a fresh
// random batch. The partial unique index enforces ≤1 active (endedAt
// IS NULL) session per (user, kind) — the race-proof guard behind
// seamless adopt-resume; POST also ends the prior same-kind active row.
export const sessions = sqliteTable(
  'sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startedAt: integer('started_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    endedAt: integer('ended_at', { mode: 'timestamp' }),
    // 'drill' | 'mock' | 'mock_diagnostic' | 'lesson' | 'adaptive_review'
    kind: text('kind').notNull(),
    // Sections involved (CSV: 'ord,kva') — full normalization can come later.
    sections: text('sections'),
    // Resume pointer — index into the session's plan / item list (0-based).
    position: integer('position').notNull().default(0),
    // Resume pointer at finer grain — current question id within the step.
    currentQuestionId: text('current_question_id'),
    // Ordered qids that make up this session's plan. Null for kinds that
    // don't have a fixed plan. JSON-encoded string[].
    plan: text('plan', { mode: 'json' }).$type<string[]>(),
    // Which device this session was last touched on (resumption provenance).
    device: text('device', { enum: DEVICE_KINDS }),
  },
  (t) => ({
    // ≤1 active session per (user, kind). Partial index — only rows with
    // endedAt IS NULL participate, so finished sessions never collide.
    activeByKind: uniqueIndex('idx_sessions_user_kind_active')
      .on(t.userId, t.kind)
      .where(sql`${t.endedAt} is null`),
    // Non-partial (user, kind) index for the all-kinds counts (drills
    // total / this-week) that the partial active-only index can't serve.
    byUserKind: index('idx_sessions_user_kind').on(t.userId, t.kind),
  }),
)

// ── lesson_progress — a per-section reading bookmark ──────────────────
//
// NOT a session: lessons are a read-only reference surface with no
// attempts and no natural "end", so modelling them as sessions left
// zombie active rows. This is a bookmark — one row per (user, section),
// upserted in place as the reader opens entries. `frameworkId` is the
// entry anchor the user last opened (e.g. 'XYZ-TRAP-016'); null means
// "in the lesson, no specific entry". Drives the Home resumption panel's
// "fortsätt läsa" offer cross-device.
export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    section: text('section').notNull(),
    frameworkId: text('framework_id'),
    device: text('device', { enum: DEVICE_KINDS }),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (t) => ({
    userSection: uniqueIndex('idx_lesson_progress_user_section').on(t.userId, t.section),
  }),
)

// ── lesson_reads — a per-(user, entry) READ SET ───────────────────────
//
// Distinct from `lesson_progress` (above), which is a single per-section
// reading BOOKMARK of the last-opened entry. This table records the FULL
// set of framework entries the user has marked read — one row per
// (user, entry). The daily-plan scheduler consumes it two ways:
//   1. lesson-item completion (a lesson item is done once the section's
//      recommended entry is read), and
//   2. the next-unread-entry hint in resolveFrameworkHints.
// Both were device-local (localStorage) before this table; promoting them
// to D1 makes lesson completion + hints converge across the user's
// phone/desktop. localStorage stays as a write-through / offline cache.
//
//   - GET    /   → the full set of read entry ids for this user
//   - PUT    /   → mark { entryId } read (idempotent upsert)
//   - DELETE /:entryId → unmark
export const lessonReads = sqliteTable(
  'lesson_reads',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entryId: text('entry_id').notNull(),
    readAt: integer('read_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (t) => ({
    // One row per (user, entry). Makes PUT an idempotent upsert and the
    // GET a single indexed scan by user.
    userEntry: uniqueIndex('idx_lesson_reads_user_entry').on(t.userId, t.entryId),
  }),
)

// ── daily_plans — the per-day plan baseline, server-authoritative ──────
//
// Promotes the localStorage `hpc-daily-plan-<date>` blob to D1 so both
// devices adopt the SAME generated baseline for a given local date
// (first-generator-wins). Semantics: on Home mount a device GETs today's
// plan BEFORE generating; if a row exists it adopts it verbatim; if not it
// generates locally then PUTs it. localStorage remains the fast-path /
// offline cache, but on divergence the SERVER row wins. "Generera om"
// overwrites via PUT.
//
// `plan` is the exact JSON blob `savePlan` stores today (items +
// attemptsSnapshot + totalAttemptsSnapshot + version), so completion
// derivation is unchanged — only the storage location moves. This
// SUBSUMES any plan_completions concept; completion stays signal-derived
// client-side.
//
//   - GET /:date → today's plan for this user, or null
//   - PUT /:date → upsert (adopt-or-overwrite) the plan for this user+date
export const dailyPlans = sqliteTable(
  'daily_plans',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Local-date the plan is for, ISO 8601 (YYYY-MM-DD). Local, not UTC —
    // matches the client's localDateString keying.
    date: text('date').notNull(),
    // The DailyPlan JSON blob, verbatim from the client's savePlan shape.
    plan: text('plan', { mode: 'json' }).$type<unknown>().notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (t) => ({
    // One plan per (user, local-date) — first-generator-wins upsert target.
    userDate: uniqueIndex('idx_daily_plans_user_date').on(t.userId, t.date),
  }),
)

// ── attempts — one row per question answered ──────────────────────────
export const attempts = sqliteTable(
  'attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: integer('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull(),
    selectedAnswer: text('selected_answer'),
    correct: integer('correct', { mode: 'boolean' }),
    timeTakenMs: integer('time_taken_ms'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (t) => ({
    // Every stats read filters by user and (usually) a created_at window
    // — counts, the 7d accuracy, the rolling-90d section breakdown, the
    // distinct-day streak. Without this they're full table scans that grow
    // with every answered question, across every user.
    byUserCreated: index('idx_attempts_user_created').on(t.userId, t.createdAt),
    // GET /sessions/:id/attempts + the attempt-ownership check on insert.
    bySession: index('idx_attempts_session').on(t.sessionId),
  }),
)

// ── mistakes — keyed by question_id, tagged with Layer 1 IDs ──────────
export const mistakes = sqliteTable(
  'mistakes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull(),
    // JSON array of Layer 1 IDs (e.g. ["KVA-NEG-001"]).
    layer1Ids: text('layer1_ids', { mode: 'json' }).$type<string[]>(),
    // Diagnostic mistakes are gated until section onboarding completes.
    status: text('status').default('active'), // 'active' | 'diagnostic-pending-review' | 'mock-pending-review'
    errorCount7d: integer('error_count_7d').default(1),
    lastErrorAt: integer('last_error_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    nextReviewAt: integer('next_review_at', { mode: 'timestamp' }),
    // SM-2-lite ladder position. 0 means "never reviewed since being
    // logged" (also applies to legacy rows from before this branch) —
    // treated as due-now in the queue. After a wrong answer this resets
    // to RELEARN_MINUTES (10). After each correct it doubles up the
    // ladder, capped at MAX_INTERVAL_MINUTES (30 days). One more correct
    // at the cap flips status='resolved' (graduation). See lib/srs.ts.
    intervalMinutes: integer('interval_minutes').notNull().default(0),
    // FSRS-lite lapse memory (PL-L.2). When a wrong answer knocks the row
    // back to the relearn rung, the height it fell from is stashed here so
    // the next correct answer resumes at half of it instead of restarting
    // at day 1. NULL means "no banked height" (fresh mistake, or already
    // consumed by a correct answer). See lib/srs.ts.
    lapseIntervalMinutes: integer('lapse_interval_minutes'),
  },
  (t) => ({
    // The due-queue read filters by user + status and orders by review
    // time; the per-wrong-answer upsert looks the row up by (user, qid).
    byUserStatus: index('idx_mistakes_user_status').on(t.userId, t.status),
    byUserQuestion: index('idx_mistakes_user_question').on(t.userId, t.questionId),
  }),
)

// ── srs_state — per ORD root / formula / trap pattern ─────────────────
export const srsState = sqliteTable('srs_state', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull(), // ord_root id, formula id, etc.
  itemKind: text('item_kind').notNull(), // 'ord_root' | 'xyz_formula' | 'trap_pattern'
  // Word→meaning is primary for ORD; root→words is secondary.
  direction: text('direction').default('primary'),
  intervalDays: integer('interval_days').default(1),
  ease: real('ease').default(2.5),
  dueAt: integer('due_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastReviewedAt: integer('last_reviewed_at', { mode: 'timestamp' }),
})

// ── mastery — continuous 0–1 score per (section, layer1_id) ───────────
export const mastery = sqliteTable('mastery', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  section: text('section').notNull(),
  layer1Id: text('layer1_id').notNull(),
  score: real('score').default(0),
  lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// ── framework_progress — state machine per Layer 1 cluster ────────────
// Status: untaught → learning → practicing → retaining → mastered.
export const frameworkProgress = sqliteTable('framework_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  layer1Id: text('layer1_id').notNull(),
  status: text('status').notNull().default('untaught'),
  lastTransitionAt: integer('last_transition_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
})

// ── mock_results — one row per completed Provpass (mock exam) ─────────
//
// A mock is scored as a whole pass, distinct from the per-question
// `attempts` rows (which still get written during the mock so mistakes/
// mastery/exposure pipelines are unaffected). This table is the summary
// the results screen and history read from — one row per session.
//
// `seenBefore` is an EXPOSURE SNAPSHOT taken at mock submission time: the
// count of questions in this mock the user had already seen in a prior
// attempt. It is captured once and stored, NOT recomputed later, because
// `attempts` rows are pruned after ~120 days (see lib/retention.ts) — a
// later recompute would silently lose exposure history as old attempts
// age out, making a genuinely-repeated question look fresh. The snapshot
// keeps the historical "you'd seen N of these before" disclosure stable
// for as long as the mock_results row itself lives.
//
// `breakdown` is a JSON blob: { perSection: Record<Section, { presented,
// correct, timeMs }>, missedQids: string[], version: 1 }. Kept opaque
// (like daily_plans.plan) so the summary shape can evolve without a
// migration — bump `version` in the blob when the shape changes.
export const mockResults = sqliteTable(
  'mock_results',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // One result per session — POST is an idempotent upsert on retry.
    sessionId: integer('session_id')
      .notNull()
      .unique()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    mode: text('mode', { enum: ['authentic', 'synthetic'] }).notNull(),
    half: text('half', { enum: ['verbal', 'kvant'] }).notNull(),
    // Which real exam this mock replayed, when mode === 'authentic'
    // (e.g. 'var-2024'). Null for synthetic mocks.
    examId: text('exam_id'),
    // Which authentic provpass within the exam ('verbal-1' etc), when
    // applicable. Null otherwise.
    provpass: text('provpass'),
    presented: integer('presented').notNull(),
    answered: integer('answered').notNull(),
    correct: integer('correct').notNull(),
    seenBefore: integer('seen_before').notNull(),
    durationMs: integer('duration_ms').notNull(),
    breakdown: text('breakdown', { mode: 'json' }).$type<unknown>().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (t) => ({
    // Newest-first per-user history read.
    byUserCreated: index('idx_mock_results_user_created').on(t.userId, t.createdAt),
  }),
)

// Type aliases used by routes + tests
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Attempt = typeof attempts.$inferSelect
export type Mistake = typeof mistakes.$inferSelect
export type LessonProgress = typeof lessonProgress.$inferSelect
export type NewLessonProgress = typeof lessonProgress.$inferInsert
export type LessonRead = typeof lessonReads.$inferSelect
export type NewLessonRead = typeof lessonReads.$inferInsert
export type DailyPlanRow = typeof dailyPlans.$inferSelect
export type NewDailyPlanRow = typeof dailyPlans.$inferInsert
export type MockResultRow = typeof mockResults.$inferSelect
export type NewMockResultRow = typeof mockResults.$inferInsert
