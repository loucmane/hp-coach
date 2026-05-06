import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Single-row local user preferences.
export const users = sqliteTable('users', {
  id: integer('id').primaryKey().default(1),
  daysToExam: integer('days_to_exam'),
  dailyMinutes: integer('daily_minutes').default(20),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Drill / mock / lesson sessions.
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('started_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  // 'drill' | 'mock' | 'mock_diagnostic' | 'lesson' | 'adaptive_review'
  kind: text('kind').notNull(),
  // Sections involved (CSV: 'ord,kva') — full normalization can come later.
  sections: text('sections'),
})

// Per-question attempts.
export const attempts = sqliteTable('attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull(),
  questionId: text('question_id').notNull(),
  selectedAnswer: text('selected_answer'),
  correct: integer('correct', { mode: 'boolean' }),
  timeTakenMs: integer('time_taken_ms'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Mistakes queue keyed by question_id, tagged with Layer 1 IDs.
export const mistakes = sqliteTable('mistakes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: text('question_id').notNull(),
  // JSON array of Layer 1 IDs (e.g. ["KVA-NEG-001"]).
  layer1Ids: text('layer1_ids', { mode: 'json' }).$type<string[]>(),
  // Diagnostic mistakes are gated until section onboarding completes.
  status: text('status').default('active'), // 'active' | 'diagnostic-pending-review' | 'mock-pending-review'
  errorCount7d: integer('error_count_7d').default(1),
  lastErrorAt: integer('last_error_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  nextReviewAt: integer('next_review_at', { mode: 'timestamp' }),
})

// SRS state per learnable item (root, formula, trap pattern).
export const srsState = sqliteTable('srs_state', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemId: text('item_id').notNull(), // e.g. ord_root id, formula id
  itemKind: text('item_kind').notNull(), // 'ord_root' | 'xyz_formula' | 'trap_pattern'
  // Card direction: word→meaning is primary for ORD; root→words is secondary.
  direction: text('direction').default('primary'), // 'primary' | 'secondary'
  intervalDays: integer('interval_days').default(1),
  ease: real('ease').default(2.5),
  dueAt: integer('due_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastReviewedAt: integer('last_reviewed_at', { mode: 'timestamp' }),
})

// Mastery score per (section, layer1_id), continuous 0–1.
export const mastery = sqliteTable('mastery', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  section: text('section').notNull(), // 'ord' | 'mek' | 'kva' | ...
  layer1Id: text('layer1_id').notNull(),
  score: real('score').default(0),
  lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// State machine per Layer 1 cluster: untaught → learning → practicing → retaining → mastered.
// Schema design open question (PRD § 5.14): may be derived from mastery.score in v1; storing
// explicit state for auditability per the state-machine variant.
export const frameworkProgress = sqliteTable('framework_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  layer1Id: text('layer1_id').notNull().unique(),
  status: text('status').notNull().default('untaught'),
  lastTransitionAt: integer('last_transition_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
})
