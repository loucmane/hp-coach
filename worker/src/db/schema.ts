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

import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
  palette: text('palette', { enum: ['sand', 'sage', 'ink', 'rose'] }).default('sand'),
  mode: text('mode', { enum: ['light', 'dark'] }).default('light'),
  font: text('font', {
    enum: ['literary', 'geometric', 'editorial', 'hyperlegible'],
  }).default('literary'),
  density: text('density', { enum: ['compact', 'regular', 'comfy'] }).default('regular'),
  showStreak: integer('show_streak', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// ── sessions — drill / mock / lesson / adaptive_review ─────────────────
//
// Mid-session resume contract: while `endedAt` is null, this row IS the
// session. `position` is the index into the session's plan (0-based), so
// a device swap during exercise resumes at the exact step. `currentQuestionId`
// is the precise pointer inside that step (optional — null for lessons,
// set during drill/mock).
export const sessions = sqliteTable('sessions', {
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
})

// ── attempts — one row per question answered ──────────────────────────
export const attempts = sqliteTable('attempts', {
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
})

// ── mistakes — keyed by question_id, tagged with Layer 1 IDs ──────────
export const mistakes = sqliteTable('mistakes', {
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
})

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

// Type aliases used by routes + tests
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Attempt = typeof attempts.$inferSelect
export type Mistake = typeof mistakes.$inferSelect
