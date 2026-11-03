// Migration contract for attempt provenance (P5 infold PR 3,
// docs/p5-infold-design.md Amendment 1 E; review fix hpf-0jyp).
//
//   · drizzle-kit's own differ finds nothing between the newest committed
//     snapshot and src/db/schema.ts: the SQL under drizzle/ came from
//     `pnpm db:generate` on this schema and nothing is pending.
//   · the database those files build has the new columns exactly as the
//     schema declares them, the provenance ones fail-closed, and no table
//     the schema does not declare.
//   · the one-off backfill, drizzle/0013_attempt_provenance_backfill.sql, gives
//     an attempt or item_stats row that predates the column `authentic` exactly
//     when lib/provenance.ts calls its qid authentic — membership in the bank,
//     not a shape (review finding B3) — and `unknown` otherwise. No P5 question
//     was served before the column, so nothing is backfilled `synthetic`. It
//     only ever promotes `unknown` rows.
//   · when the fit from before provenance folded an answer that is now unknown
//     (review finding B4), the backfill resets the fitted state, and the next
//     fit run lands exactly where the provenance fit lands on the same
//     history. Otherwise the fitted state is left exactly as it was.
//     Re-running the backfill is safe.
//   · user_ability.authentic_ability (drizzle/0014, review finding R2-B1) is
//     the user's rating over authentic answers alone, which the fit plays
//     authentic items against. drizzle/0015 resets the state the fit before
//     it left while one of its rows with synthetic answers and no authentic
//     rating is left, and the next run lands exactly where the current fit
//     lands. Authentic-only state is left exactly as it was. Re-running 0015
//     changes nothing the current fit wrote, whoever has deleted the account
//     and whatever retention has pruned since (review finding R3-B1).
//   · drizzle/0016_ljusbord_expand.sql (LJ-10, the Ljusbord rebuild map §2)
//     only adds: nullable or defaulted columns and one new table. Nothing is
//     dropped, renamed or rebuilt, and a database at 0015 keeps every row
//     byte for byte.
//
// Everything here runs against the in-memory node:sqlite shim; no real
// database is touched, and no migration is applied anywhere else.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { is } from 'drizzle-orm'
import { getTableConfig, SQLiteTable } from 'drizzle-orm/sqlite-core'
import { describe, expect, it } from 'vitest'

import authenticSet from '../../data/authentic-qids.json'
import registry from '../../data/p5-qid-registry.json'
import { cascadeDeleteUser } from '../lib/cascade'
import { runFit } from '../lib/fit'
import { classifyAttemptSource, isAuthenticQid } from '../lib/provenance'
import { RETENTION_DAYS, retentionCutoff, runRetention } from '../lib/retention'
import { makeTestD1, migrationFiles, type ShimD1 } from '../lib/testD1'
import { getDb } from './client'
import * as schema from './schema'

const DRIZZLE = fileURLToPath(new URL('../../drizzle', import.meta.url))
const BANK_DIR = fileURLToPath(new URL('../../../app/public/data', import.meta.url))
const COLUMN_MIGRATION = '0012_attempt_provenance.sql'
const BACKFILL_MIGRATION = '0013_attempt_provenance_backfill.sql'
const TRACK_MIGRATION = '0014_user_ability_authentic_track.sql'
const TRACK_RESET_MIGRATION = '0015_pre_r2b1_fit_reset.sql'
const EXPAND_MIGRATION = '0016_ljusbord_expand.sql'

type Journal = { entries: Array<{ idx: number; tag: string }> }
type ColumnInfo = {
  name: string
  type: string
  notnull: number
  dflt_value: string | null
  pk: number
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function bankQids(): string[] {
  const out: string[] = []
  for (const file of readdirSync(BANK_DIR).sort()) {
    if (!file.endsWith('.json') || file.startsWith('_')) continue
    for (const row of readJson<Array<{ qid: string }>>(join(BANK_DIR, file))) out.push(row.qid)
  }
  return out
}

// Bank-shaped qids of sittings the bank holds that name no question of it
// (review finding B3): a shape rule called them authentic.
const FABRICATED_QIDS = [
  'var-2024-verb1-ORD-015', // verb1's ORD questions are 001-010
  'var-2024-verb1-LÄS-001', // its LÄS questions are 011-020
  'var-2024-verb1-LAS-001', // nor in the legacy LAS spelling
  'var-2024-kvant1-KVA-002', // kvant1's KVA questions are 013-022
  'host-2013-kvant1-XYZ-041', // a pass holds 40
]

// Ids that must come out `unknown`, whatever their shape suggests.
const UNKNOWN_QIDS = [
  'q1',
  'not-a-real-qid',
  'var-2024-XYZ-001',
  'var-2099-verb1-ORD-001',
  'var-2024-verb1-XYZ-001',
  'var-2024-kvant1-ORD-001',
  'var-2024-verb1-ORD-01',
  'var-2024-verb1-ORD-0001',
  'var-2024-verb1-ord-001',
  'VAR-2024-verb1-ORD-001',
  ' var-2024-verb1-ORD-001',
  'var-2024-verb1-ORD-001 ',
  // A decomposed Ä: A + COMBINING DIAERESIS (U+0308).
  `var-2024-verb1-LA${String.fromCodePoint(0x0308)}S-011`,
  'var-2024-verb1-ORD-001-verb1-ORD-001',
  'p5-las-b7-002-r1-LÄS-001',
  'p5-elf-b14-002-r1-ELF-001',
  'p5-las-b19-002-r1-LAS-001',
  ...FABRICATED_QIDS,
]

async function columns(d1: ShimD1, table: string): Promise<ColumnInfo[]> {
  const { results } = await d1.prepare(`PRAGMA table_info(${table})`).all<ColumnInfo>()
  return results
}

/** Apply `file` and every migration after it, in order. */
function applyFrom(d1: ShimD1, file: string): void {
  for (const f of migrationFiles()) if (f >= file) d1.applyMigration(f)
}

/** Insert attempts with raw SQL, so the rows can predate the column. */
async function seedAttempts(d1: ShimD1, qids: string[], source?: string): Promise<void> {
  await d1.prepare("INSERT OR IGNORE INTO users (id, clerk_user_id) VALUES (1, 'legacy')").run()
  await d1
    .prepare("INSERT OR IGNORE INTO sessions (id, user_id, kind) VALUES (1, 1, 'drill')")
    .run()
  for (const qid of qids) {
    if (source === undefined) {
      await d1
        .prepare(
          'INSERT INTO attempts (user_id, session_id, question_id, correct) VALUES (1, 1, ?, 1)',
        )
        .bind(qid)
        .run()
    } else {
      await d1
        .prepare(
          'INSERT INTO attempts (user_id, session_id, question_id, correct, source) VALUES (1, 1, ?, 1, ?)',
        )
        .bind(qid, source)
        .run()
    }
  }
}

/** Insert item_stats rows with raw SQL, so the rows can predate the column. */
async function seedItems(d1: ShimD1, qids: string[], source?: string): Promise<void> {
  for (const qid of qids) {
    if (source === undefined) {
      await d1
        .prepare('INSERT INTO item_stats (question_id, difficulty, attempts) VALUES (?, 0, 1)')
        .bind(qid)
        .run()
    } else {
      await d1
        .prepare(
          'INSERT INTO item_stats (question_id, difficulty, attempts, source) VALUES (?, 0, 1, ?)',
        )
        .bind(qid, source)
        .run()
    }
  }
}

async function attemptSources(d1: ShimD1) {
  const { results } = await d1
    .prepare('SELECT question_id, source, item_revision FROM attempts ORDER BY id')
    .all<{ question_id: string; source: string; item_revision: number | null }>()
  return results
}

async function itemSources(d1: ShimD1) {
  const { results } = await d1
    .prepare('SELECT question_id, source FROM item_stats ORDER BY rowid')
    .all<{ question_id: string; source: string }>()
  return results
}

/** The backfill's statements, as drizzle splits them, leading comments off. */
function backfillStatements(): string[] {
  return readFileSync(join(DRIZZLE, BACKFILL_MIGRATION), 'utf8')
    .split('--> statement-breakpoint')
    .map((s) => s.trim().replace(/^(?:--[^\n]*\n)+/, ''))
    .filter(Boolean)
}

describe('provenance migrations — generated and matching the schema', () => {
  it('drizzle-kit finds nothing to generate: the newest snapshot is the schema', async () => {
    const journal = readJson<Journal>(join(DRIZZLE, 'meta/_journal.json'))
    const last = journal.entries[journal.entries.length - 1]
    const snapshot = readJson(
      join(DRIZZLE, 'meta', `${String(last.idx).padStart(4, '0')}_snapshot.json`),
    )
    const current = await generateSQLiteDrizzleJson(schema as unknown as Record<string, unknown>)
    expect(await generateSQLiteMigration(snapshot as never, current)).toEqual([])
  })

  it('journals every SQL file: the columns, their backfill, the authentic rating and its reset, then the Ljusbord expand', () => {
    const journal = readJson<Journal>(join(DRIZZLE, 'meta/_journal.json'))
    expect(journal.entries.map((e) => `${e.tag}.sql`)).toEqual(migrationFiles())
    expect(migrationFiles().slice(-5)).toEqual([
      COLUMN_MIGRATION,
      BACKFILL_MIGRATION,
      TRACK_MIGRATION,
      TRACK_RESET_MIGRATION,
      EXPAND_MIGRATION,
    ])
  })

  it('the authentic-rating migration is exactly the generated DDL', () => {
    const sql = readFileSync(join(DRIZZLE, TRACK_MIGRATION), 'utf8')
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
    expect(sql).toEqual(['ALTER TABLE `user_ability` ADD `authentic_ability` real;'])
  })

  it('the column migration is exactly the generated DDL', () => {
    const sql = readFileSync(join(DRIZZLE, COLUMN_MIGRATION), 'utf8')
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
    expect(sql).toEqual([
      "ALTER TABLE `attempts` ADD `source` text DEFAULT 'unknown' NOT NULL;",
      'ALTER TABLE `attempts` ADD `item_revision` integer;',
      "ALTER TABLE `item_stats` ADD `source` text DEFAULT 'unknown' NOT NULL;",
      'ALTER TABLE `mock_results` ADD `estimate_basis` text;',
      'ALTER TABLE `user_ability` ADD `synthetic_attempts` integer DEFAULT 0 NOT NULL;',
    ])
  })

  it.each([
    ['attempts', schema.attempts],
    ['item_stats', schema.itemStats],
    ['user_ability', schema.userAbility],
    ['mock_results', schema.mockResults],
    // The tables 0016 adds columns to, and the one it creates.
    ['users', schema.users],
    ['sessions', schema.sessions],
    ['mistakes', schema.mistakes],
    ['lesson_progress', schema.lessonProgress],
    ['explanation_feedback', schema.explanationFeedback],
  ] as Array<
    [string, SQLiteTable]
  >)('the migrated %s table has exactly the schema’s columns', async (name, table) => {
    const d1 = makeTestD1()
    const declared = getTableConfig(table).columns.map((c) => c.name)
    expect((await columns(d1, name)).map((c) => c.name).sort()).toEqual([...declared].sort())
  })

  it('builds exactly the schema’s tables: the backfill drops its helper table', async () => {
    const d1 = makeTestD1()
    const { results } = await d1
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all<{ name: string }>()
    const declared = (Object.values(schema) as unknown[])
      .filter((value): value is SQLiteTable => is(value, SQLiteTable))
      .map((table) => getTableConfig(table).name)
    expect(results.map((r) => r.name).sort()).toEqual([...declared].sort())
  })

  it('the provenance columns default fail-closed', async () => {
    const d1 = makeTestD1()
    const pick = async (table: string, column: string) => {
      const found = (await columns(d1, table)).find((c) => c.name === column)
      return found && { ...found, type: found.type.toLowerCase() }
    }
    expect(await pick('attempts', 'source')).toMatchObject({
      type: 'text',
      notnull: 1,
      dflt_value: "'unknown'",
    })
    expect(await pick('attempts', 'item_revision')).toMatchObject({
      type: 'integer',
      notnull: 0,
      dflt_value: null,
    })
    expect(await pick('item_stats', 'source')).toMatchObject({
      type: 'text',
      notnull: 1,
      dflt_value: "'unknown'",
    })
    expect(await pick('user_ability', 'synthetic_attempts')).toMatchObject({
      type: 'integer',
      notnull: 1,
      dflt_value: '0',
    })
    expect(await pick('mock_results', 'estimate_basis')).toMatchObject({
      type: 'text',
      notnull: 0,
      dflt_value: null,
    })
    // Null means "no synthetic answer yet: `ability` is the authentic rating".
    // A row with synthetic answers and a null here fails closed: the fit
    // refuses it, and 0015 resets it.
    expect(await pick('user_ability', 'authentic_ability')).toMatchObject({
      type: 'real',
      notnull: 0,
      dflt_value: null,
    })
  })
})

describe('provenance backfill — authentic is membership in the bank (B3)', () => {
  const authentic = bankQids()
  // The legacy LAS spelling lib/section.ts normalises (a corpus-import quirk).
  const legacyLas = authentic
    .filter((q) => q.includes('-LÄS-'))
    .map((q) => q.replace('-LÄS-', '-LAS-'))
  const p5 = registry.units.flatMap((u) => u.qids)
  const corpus = [...authentic, ...legacyLas, ...p5, ...UNKNOWN_QIDS]

  it('loads exactly the bundled authentic set, in statements D1 accepts', () => {
    // 0013 is rendered from worker/data/authentic-qids.json by
    // pipeline/synthetic/infold/export_authentic_qids.py --backfill-migration.
    // It is frozen once applied: should the bank change after that, this test
    // becomes "0013's set is a subset of the bundled set".
    const statements = backfillStatements()
    const inserted = statements
      .filter((s) => s.startsWith('INSERT OR IGNORE INTO `tmp_0013_authentic_qid`'))
      .flatMap((s) => [...s.matchAll(/^\('([^']*)'\)[,;]$/gm)].map((m) => m[1]))
    expect(inserted).toEqual(authenticSet.qids)
    expect(new Set(inserted).size).toBe(4320)
    for (const statement of statements) {
      expect(new TextEncoder().encode(statement).length).toBeLessThan(100_000)
    }
  })

  it('classifies attempts that predate the column exactly as lib/provenance.ts does', async () => {
    expect(authentic).toHaveLength(4320)
    const d1 = makeTestD1({ before: COLUMN_MIGRATION })
    await seedAttempts(d1, corpus)
    d1.applyMigration(COLUMN_MIGRATION)
    // Until the backfill runs, every pre-existing row fails closed.
    expect(new Set((await attemptSources(d1)).map((r) => r.source))).toEqual(new Set(['unknown']))

    d1.applyMigration(BACKFILL_MIGRATION)
    const rows = await attemptSources(d1)
    expect(rows.map((r) => r.question_id)).toEqual(corpus)
    const mismatches = rows.filter(
      (r) => r.source !== (isAuthenticQid(r.question_id) ? 'authentic' : 'unknown'),
    )
    expect(mismatches).toEqual([])
    expect(rows.filter((r) => r.source === 'authentic')).toHaveLength(
      authentic.length + legacyLas.length,
    )
    // Bank-shaped qids the bank does not hold stay unknown.
    expect(
      rows.filter((r) => FABRICATED_QIDS.includes(r.question_id)).map((r) => r.source),
    ).toEqual(FABRICATED_QIDS.map(() => 'unknown'))
    // Registry qids exist only from this PR on; no stored row predates them.
    expect(rows.filter((r) => r.source === 'synthetic')).toEqual([])
    expect(rows.filter((r) => r.item_revision !== null)).toEqual([])
  })

  it('promotes every item_stats row of a bank question, in either LÄS spelling', async () => {
    const d1 = makeTestD1({ before: COLUMN_MIGRATION })
    await seedItems(d1, [...authentic, ...legacyLas])
    d1.applyMigration(COLUMN_MIGRATION)
    expect(new Set((await itemSources(d1)).map((r) => r.source))).toEqual(new Set(['unknown']))

    d1.applyMigration(BACKFILL_MIGRATION)
    const rows = await itemSources(d1)
    expect(rows.map((r) => r.question_id)).toEqual([...authentic, ...legacyLas])
    expect(rows.filter((r) => r.source !== 'authentic')).toEqual([])
  })

  it.each(
    FABRICATED_QIDS,
  )('never promotes the item_stats row of a fabricated bank-shaped qid: %s', async (qid) => {
    const d1 = makeTestD1({ before: COLUMN_MIGRATION })
    await seedItems(d1, [qid])
    d1.applyMigration(COLUMN_MIGRATION)
    // Run the backfill's promotion only; the fit reset below would delete it.
    const promote = backfillStatements().filter(
      (s) =>
        s.startsWith('CREATE TABLE') ||
        s.startsWith('INSERT') ||
        s.startsWith('UPDATE `item_stats`'),
    )
    for (const statement of promote) await d1.exec(statement)
    expect(await itemSources(d1)).toEqual([{ question_id: qid, source: 'unknown' }])
  })

  it('only promotes unknown rows, so a re-run after the deploy is safe', async () => {
    // Rows as the live tables could hold them between `migrations apply` and
    // the worker deploy: the old worker still inserts without a source, so its
    // rows take the column default.
    const d1 = makeTestD1()
    const p5Qid = registry.units[0].qids[0]
    await seedAttempts(d1, ['var-2024-verb1-ORD-001'], 'unknown')
    await seedAttempts(d1, [p5Qid], 'synthetic')
    await seedAttempts(d1, ['var-2024-kvant1-KVA-013'], 'authentic')
    await seedAttempts(d1, ['q1', 'p5-las-b7-002-r1-LÄS-001', 'var-2024-verb1-ORD-015'], 'unknown')
    await seedItems(d1, ['var-2024-verb1-ORD-001'], 'unknown')
    await seedItems(d1, [p5Qid], 'synthetic')

    d1.applyMigration(BACKFILL_MIGRATION)
    const once = await attemptSources(d1)
    expect(once.map(({ question_id, source }) => ({ question_id, source }))).toEqual([
      { question_id: 'var-2024-verb1-ORD-001', source: 'authentic' },
      { question_id: p5Qid, source: 'synthetic' },
      { question_id: 'var-2024-kvant1-KVA-013', source: 'authentic' },
      { question_id: 'q1', source: 'unknown' },
      { question_id: 'p5-las-b7-002-r1-LÄS-001', source: 'unknown' },
      { question_id: 'var-2024-verb1-ORD-015', source: 'unknown' },
    ])
    for (const row of once) {
      if (row.source !== 'synthetic')
        expect(row.source).toBe(classifyAttemptSource(row.question_id))
    }
    const items = await itemSources(d1)
    expect(items).toEqual([
      { question_id: 'var-2024-verb1-ORD-001', source: 'authentic' },
      { question_id: p5Qid, source: 'synthetic' },
    ])

    d1.applyMigration(BACKFILL_MIGRATION)
    expect(await attemptSources(d1)).toEqual(once)
    expect(await itemSources(d1)).toEqual(items)
  })
})

// ── B4: fitted state that rests on answers that are now unknown ───────────

type Answer = { user: number; kind: string; qid: string; correct: boolean }

const KINDS = ['drill', 'adaptive_review', 'mock', 'lesson'] as const
// Bank questions, one in the legacy LAS spelling.
const BANK = [
  'var-2026-verb1-ORD-001',
  'var-2026-verb1-ORD-002',
  'var-2026-verb1-LÄS-011',
  'var-2024-verb1-LAS-013',
  'host-2025-verb2-MEK-021',
  'var-2026-verb2-ELF-031',
  'var-2026-kvant1-XYZ-001',
  'host-2024-kvant1-KVA-013',
  'host-2025-kvant2-DTK-030',
]
// Now unknown, each with a section, so the fit before provenance folded them.
const NOW_UNKNOWN = ['var-2024-verb1-ORD-015', 'host-2013-kvant1-XYZ-041', 'var-2099-verb2-ELF-031']

/** mulberry32: a small seeded PRNG, so each history is fixed. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function history(seed: number, length: number, qids: readonly string[]): Answer[] {
  const r = rng(seed)
  return Array.from({ length }, () => ({
    user: 1 + Math.floor(r() * 3),
    kind: KINDS[Math.floor(r() * KINDS.length)],
    qid: qids[Math.floor(r() * qids.length)],
    correct: r() < 0.6,
  }))
}

const sessionId = (a: Answer) =>
  (a.user - 1) * KINDS.length + (KINDS as readonly string[]).indexOf(a.kind) + 1

/** The same users, sessions and attempt ids in every database. `source`
 *  undefined leaves the column out (a database from before it). */
async function seedHistory(
  d1: ShimD1,
  answers: readonly Answer[],
  source?: (qid: string) => string,
): Promise<void> {
  for (const user of [1, 2, 3]) {
    await d1
      .prepare('INSERT INTO users (id, clerk_user_id) VALUES (?, ?)')
      .bind(user, `u${user}`)
      .run()
    for (const kind of KINDS) {
      await d1
        .prepare('INSERT INTO sessions (id, user_id, kind) VALUES (?, ?, ?)')
        .bind(sessionId({ user, kind, qid: '', correct: false }), user, kind)
        .run()
    }
  }
  for (const [i, a] of answers.entries()) {
    const values = [i + 1, a.user, sessionId(a), a.qid, a.correct ? 1 : 0]
    if (source === undefined) {
      await d1
        .prepare(
          'INSERT INTO attempts (id, user_id, session_id, question_id, correct) VALUES (?, ?, ?, ?, ?)',
        )
        .bind(...values)
        .run()
    } else {
      await d1
        .prepare(
          'INSERT INTO attempts (id, user_id, session_id, question_id, correct, source) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind(...values, source(a.qid))
        .run()
    }
  }
}

async function ratings(d1: ShimD1) {
  const items = await d1
    .prepare(
      'SELECT question_id, difficulty, attempts, source FROM item_stats ORDER BY question_id',
    )
    .all()
  const abilities = await d1
    .prepare(
      'SELECT user_id, section, ability, attempts, synthetic_attempts, authentic_ability FROM user_ability ORDER BY user_id, section',
    )
    .all()
  return { items: items.results, abilities: abilities.results }
}

async function watermark(d1: ShimD1): Promise<number | null> {
  const row = await d1
    .prepare('SELECT last_attempt_id FROM fit_state WHERE id = 1')
    .first<number>('last_attempt_id')
  return row
}

const refit = (d1: ShimD1) => runFit(getDb(d1 as unknown as D1Database))

/** What the fit from before provenance made of a history: the provenance fit
 *  with every answer authentic (its authentic arithmetic is unchanged, which
 *  the golden test in routes/assessmentGolden.test.ts pins). */
async function legacyFit(answers: readonly Answer[]) {
  const sim = makeTestD1()
  await seedHistory(sim, answers, () => 'authentic')
  await refit(sim)
  const items = await sim
    .prepare('SELECT question_id, difficulty, attempts FROM item_stats ORDER BY question_id')
    .all<{ question_id: string; difficulty: number; attempts: number }>()
  const abilities = await sim
    .prepare(
      'SELECT user_id, section, ability, attempts FROM user_ability ORDER BY user_id, section',
    )
    .all<{ user_id: number; section: string; ability: number; attempts: number }>()
  return { items: items.results, abilities: abilities.results, watermark: await watermark(sim) }
}

/** A database from before provenance holding that history and its fitted
 *  state, then migrated. */
async function migratedLegacy(answers: readonly Answer[]) {
  const legacy = await legacyFit(answers)
  const d1 = makeTestD1({ before: COLUMN_MIGRATION })
  await seedHistory(d1, answers)
  for (const i of legacy.items) {
    await d1
      .prepare('INSERT INTO item_stats (question_id, difficulty, attempts) VALUES (?, ?, ?)')
      .bind(i.question_id, i.difficulty, i.attempts)
      .run()
  }
  for (const a of legacy.abilities) {
    await d1
      .prepare('INSERT INTO user_ability (user_id, section, ability, attempts) VALUES (?, ?, ?, ?)')
      .bind(a.user_id, a.section, a.ability, a.attempts)
      .run()
  }
  await d1
    .prepare('INSERT INTO fit_state (id, last_attempt_id) VALUES (1, ?)')
    .bind(legacy.watermark)
    .run()
  d1.applyMigration(COLUMN_MIGRATION)
  d1.applyMigration(BACKFILL_MIGRATION)
  applyFrom(d1, TRACK_MIGRATION)
  return { d1, legacy }
}

/** What the provenance fit makes of the same history from scratch. */
async function provenanceFit(answers: readonly Answer[]) {
  const d1 = makeTestD1()
  await seedHistory(d1, answers, classifyAttemptSource)
  await refit(d1)
  return ratings(d1)
}

describe('provenance backfill — fitted state that rests on now-unknown answers (B4)', () => {
  for (const seed of [1, 2, 3]) {
    it(`history ${seed}: the fit is reset and refitted without them, labels included`, async () => {
      const answers = history(seed, 90, [...BANK, ...NOW_UNKNOWN])
      expect(answers.some((a) => NOW_UNKNOWN.includes(a.qid) && a.kind !== 'lesson')).toBe(true)
      const { d1, legacy } = await migratedLegacy(answers)
      // The legacy abilities count the now-unknown answers as fitted.
      const legacyFitted = legacy.abilities.reduce((n, a) => n + a.attempts, 0)

      // Right after the migration: no fitted state is left, the watermark is back at 0.
      expect(await ratings(d1)).toEqual({ items: [], abilities: [] })
      expect(await watermark(d1)).toBe(0)

      // The next run refits every attempt, unknown ones skipped, and lands bit
      // for bit where the provenance fit lands.
      const expected = await provenanceFit(answers)
      const res = await refit(d1)
      expect(res.watermark).toBe(answers.length)
      expect(JSON.stringify(await ratings(d1))).toBe(JSON.stringify(expected))

      // Labels reflect real provenance: every fitted answer is authentic, and
      // they are exactly the graded answers on bank questions.
      const { abilities, items } = await ratings(d1)
      const fittedAuthentic = answers.filter((a) => a.kind !== 'lesson' && BANK.includes(a.qid))
      expect(abilities.reduce((n, a) => n + Number(a.attempts), 0)).toBe(fittedAuthentic.length)
      expect(fittedAuthentic.length).toBeLessThan(legacyFitted)
      expect(abilities.every((a) => a.synthetic_attempts === 0)).toBe(true)
      expect(items.every((i) => i.source === 'authentic')).toBe(true)
      expect(items.filter((i) => NOW_UNKNOWN.includes(String(i.question_id)))).toEqual([])

      // Re-running the backfill afterwards changes nothing.
      const refitted = await ratings(d1)
      d1.applyMigration(BACKFILL_MIGRATION)
      expect(await ratings(d1)).toEqual(refitted)
      expect(await watermark(d1)).toBe(answers.length)
      expect(await refit(d1)).toMatchObject({ processed: 0 })
    })
  }

  it('an authentic-only fitted state is left exactly as it was', async () => {
    const answers = history(7, 90, BANK)
    const { d1, legacy } = await migratedLegacy(answers)
    const after = await ratings(d1)
    expect(after.items).toEqual(legacy.items.map((i) => ({ ...i, source: 'authentic' })))
    expect(after.abilities).toEqual(
      legacy.abilities.map((a) => ({ ...a, synthetic_attempts: 0, authentic_ability: null })),
    )
    expect(await watermark(d1)).toBe(legacy.watermark)
    // Nothing is left to fold, and it is where the provenance fit lands too.
    expect(await refit(d1)).toMatchObject({ processed: 0 })
    expect(JSON.stringify(await ratings(d1))).toBe(JSON.stringify(await provenanceFit(answers)))
  })

  it('a now-unknown answer the old fit never folded resets nothing', async () => {
    // A sectionless id in a drill and a fabricated qid only ever answered in a
    // lesson: the fit before provenance skipped both, so no fitted state rests
    // on them.
    const answers = [
      ...history(8, 60, BANK),
      { user: 1, kind: 'drill', qid: 'q1', correct: true },
      { user: 2, kind: 'lesson', qid: 'var-2024-verb1-ORD-015', correct: true },
    ]
    const { d1, legacy } = await migratedLegacy(answers)
    expect((await ratings(d1)).items).toHaveLength(legacy.items.length)
    expect(await watermark(d1)).toBe(legacy.watermark)
  })

  it('a re-run after the deploy catches a now-unknown answer the old worker fitted meanwhile', async () => {
    const answers = history(9, 60, BANK)
    const { d1 } = await migratedLegacy(answers)
    // Between `migrations apply` and the deploy, the old worker takes two more
    // answers (its inserts take the column default) and its nightly fit folds
    // them, leaving item rows with the default source too.
    const gap: Answer[] = [
      { user: 1, kind: 'drill', qid: 'var-2026-verb1-ORD-002', correct: true },
      { user: 2, kind: 'drill', qid: 'var-2024-verb1-ORD-015', correct: true },
    ]
    for (const [i, a] of gap.entries()) {
      await d1
        .prepare(
          'INSERT INTO attempts (id, user_id, session_id, question_id, correct) VALUES (?, ?, ?, ?, ?)',
        )
        .bind(answers.length + i + 1, a.user, sessionId(a), a.qid, 1)
        .run()
    }
    await d1
      .prepare(
        "INSERT INTO item_stats (question_id, difficulty, attempts) VALUES ('var-2024-verb1-ORD-015', -12.8, 1)",
      )
      .run()
    await d1
      .prepare('UPDATE fit_state SET last_attempt_id = ? WHERE id = 1')
      .bind(answers.length + gap.length)
      .run()

    d1.applyMigration(BACKFILL_MIGRATION)
    expect(await ratings(d1)).toEqual({ items: [], abilities: [] })
    expect(await watermark(d1)).toBe(0)
    await refit(d1)
    expect(JSON.stringify(await ratings(d1))).toBe(
      JSON.stringify(await provenanceFit([...answers, ...gap])),
    )
  })
})

// ── R2-B1: fitted state from the fit before the authentic-only rating ─────

// Registry questions of the two sections P5 covers, which the bank questions
// above share.
const P5_QIDS = registry.units.flatMap((u) => u.qids)
const P5_SAMPLE = [
  ...P5_QIDS.filter((q) => q.includes('-LÄS-')).slice(0, 3),
  ...P5_QIDS.filter((q) => q.includes('-ELF-')).slice(0, 2),
]
const MIXED = [...BANK, ...P5_SAMPLE]

describe('authentic-only rating — 0014, and 0015 resets the state the old fit left (R2-B1)', () => {
  /** A database from before 0014 holding a history and fitted state as the
   *  fit before the authentic-only rating left it: synthetic answers counted,
   *  synthetic item rows, and no authentic_ability column. The current fit's
   *  numbers stand in for that fit's. 0015 tests only the evidence, which is
   *  the same, and deletes every number. */
  async function oldFitState(answers: readonly Answer[]) {
    const sim = makeTestD1()
    await seedHistory(sim, answers, classifyAttemptSource)
    await refit(sim)
    const fitted = await ratings(sim)
    const fittedTo = await watermark(sim)
    const d1 = makeTestD1({ before: TRACK_MIGRATION })
    await seedHistory(d1, answers, classifyAttemptSource)
    for (const i of fitted.items) {
      await d1
        .prepare(
          'INSERT INTO item_stats (question_id, difficulty, attempts, source) VALUES (?, ?, ?, ?)',
        )
        .bind(i.question_id, i.difficulty, i.attempts, i.source)
        .run()
    }
    for (const a of fitted.abilities) {
      await d1
        .prepare(
          'INSERT INTO user_ability (user_id, section, ability, attempts, synthetic_attempts) VALUES (?, ?, ?, ?, ?)',
        )
        .bind(a.user_id, a.section, a.ability, a.attempts, a.synthetic_attempts)
        .run()
    }
    await d1
      .prepare('INSERT INTO fit_state (id, last_attempt_id) VALUES (1, ?)')
      .bind(fittedTo)
      .run()
    return { d1, fitted, fittedTo }
  }

  for (const seed of [4, 5, 6]) {
    it(`history ${seed}: state the old fit left with synthetic answers is reset, then refitted exactly`, async () => {
      const answers = history(seed, 90, MIXED)
      const { d1, fitted } = await oldFitState(answers)
      expect(fitted.abilities.some((a) => Number(a.synthetic_attempts) > 0)).toBe(true)

      applyFrom(d1, TRACK_MIGRATION)
      expect(await ratings(d1)).toEqual({ items: [], abilities: [] })
      expect(await watermark(d1)).toBe(0)

      // The next run refits every attempt and lands bit for bit where the
      // current fit lands from scratch, authentic-only ratings included.
      const expected = await provenanceFit(answers)
      expect((await refit(d1)).watermark).toBe(answers.length)
      const refitted = await ratings(d1)
      expect(JSON.stringify(refitted)).toBe(JSON.stringify(expected))
      expect(refitted.abilities.some((a) => a.authentic_ability !== null)).toBe(true)

      // Re-running 0015 afterwards changes nothing.
      d1.applyMigration(TRACK_RESET_MIGRATION)
      expect(await ratings(d1)).toEqual(refitted)
      expect(await watermark(d1)).toBe(answers.length)
    })
  }

  // User 3 answers a P5 question and then the authentic one after it, and
  // deletes the account later. Its rows go with it, but the authentic item
  // user 3 moved, and user 1's answer after it, remain.
  const USER_3_LEAVES: Answer[] = [
    ...history(5, 60, BANK).filter((a) => a.user !== 3),
    { user: 3, kind: 'drill', qid: P5_SAMPLE[0], correct: true },
    { user: 3, kind: 'drill', qid: 'var-2026-verb1-LÄS-011', correct: true },
    { user: 1, kind: 'drill', qid: 'var-2026-verb1-LÄS-011', correct: false },
  ]

  it('still resets while one row of it with synthetic answers is left, whoever deleted the account', async () => {
    // User 1 has answered an ELF P5 question too, and is still here.
    const answers: Answer[] = [
      ...USER_3_LEAVES,
      { user: 1, kind: 'drill', qid: P5_SAMPLE[3], correct: true },
    ]
    const { d1 } = await oldFitState(answers)
    await d1.prepare('DELETE FROM users WHERE id = 3').run()

    applyFrom(d1, TRACK_MIGRATION)
    expect(await ratings(d1)).toEqual({ items: [], abilities: [] })
    expect(await watermark(d1)).toBe(0)
    await refit(d1)
    expect(JSON.stringify(await ratings(d1))).toBe(
      JSON.stringify(await provenanceFit(answers.filter((a) => a.user !== 3))),
    )
  })

  it('leaves it once no row of it with synthetic answers is left: the current fit leaves the same tables (R3-B1)', async () => {
    // A synthetic item row and no authentic rating anywhere is also what the
    // current fit leaves once its last user with synthetic answers deletes
    // the account. A reset on it wiped every other user's ratings (review
    // finding R3-B1), so 0015 no longer looks for it. The fit before the
    // authentic-only rating never ran against staging or production, so this
    // state cannot exist in a real database.
    const { d1, fitted, fittedTo } = await oldFitState(USER_3_LEAVES)
    await d1.prepare('DELETE FROM users WHERE id = 3').run()
    const left = { items: fitted.items, abilities: fitted.abilities.filter((a) => a.user_id !== 3) }
    expect(left.items.some((i) => i.source === 'synthetic')).toBe(true)
    expect(left.abilities.every((a) => a.synthetic_attempts === 0)).toBe(true)

    applyFrom(d1, TRACK_MIGRATION)
    expect(await ratings(d1)).toEqual(left)
    expect(await watermark(d1)).toBe(fittedTo)
    expect(await refit(d1)).toMatchObject({ processed: 0 })
  })

  it('an authentic-only fitted state is left exactly as it was', async () => {
    const answers = history(6, 90, BANK)
    const { d1, fitted, fittedTo } = await oldFitState(answers)
    applyFrom(d1, TRACK_MIGRATION)
    expect(await ratings(d1)).toEqual(fitted)
    expect(fitted.abilities.every((a) => a.authentic_ability === null)).toBe(true)
    expect(await watermark(d1)).toBe(fittedTo)
    expect(await refit(d1)).toMatchObject({ processed: 0 })
  })

  it('without the reset, the fit refuses the state rather than guess an authentic rating', async () => {
    const answers: Answer[] = [
      { user: 1, kind: 'drill', qid: P5_SAMPLE[0], correct: true },
      { user: 1, kind: 'drill', qid: 'var-2026-verb1-LÄS-011', correct: true },
    ]
    const { d1 } = await oldFitState(answers)
    d1.applyMigration(TRACK_MIGRATION)
    const next: Answer = { user: 1, kind: 'drill', qid: 'var-2024-verb1-LAS-013', correct: true }
    await d1
      .prepare(
        'INSERT INTO attempts (id, user_id, session_id, question_id, correct, source) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(answers.length + 1, next.user, sessionId(next), next.qid, 1, 'authentic')
      .run()
    const before = await ratings(d1)
    await expect(refit(d1)).rejects.toThrow(/no authentic_ability/)
    expect(await ratings(d1)).toEqual(before)
    expect(await watermark(d1)).toBe(answers.length)
  })

  it('once the current fit has run, re-running 0015 changes nothing', async () => {
    const answers = history(7, 90, MIXED)
    const d1 = makeTestD1()
    await seedHistory(d1, answers, classifyAttemptSource)
    await refit(d1)
    const fitted = await ratings(d1)
    expect(fitted.abilities.some((a) => Number(a.synthetic_attempts) > 0)).toBe(true)
    d1.applyMigration(TRACK_RESET_MIGRATION)
    expect(await ratings(d1)).toEqual(fitted)
    expect(await watermark(d1)).toBe(answers.length)
  })

  it('one row with synthetic answers and no authentic rating resets everything, whatever the other rows hold', async () => {
    // The current fit's state, authentic-only ratings included, with one row
    // as the fit before them left it.
    const answers = history(9, 90, MIXED)
    const d1 = makeTestD1()
    await seedHistory(d1, answers, classifyAttemptSource)
    await refit(d1)
    const mixedRows = (await ratings(d1)).abilities.filter((a) => a.authentic_ability !== null)
    expect(mixedRows.length).toBeGreaterThan(1)
    await d1
      .prepare('UPDATE user_ability SET authentic_ability = NULL WHERE user_id = ? AND section = ?')
      .bind(mixedRows[0].user_id, mixedRows[0].section)
      .run()

    d1.applyMigration(TRACK_RESET_MIGRATION)
    expect(await ratings(d1)).toEqual({ items: [], abilities: [] })
    expect(await watermark(d1)).toBe(0)
    await refit(d1)
    expect(JSON.stringify(await ratings(d1))).toBe(JSON.stringify(await provenanceFit(answers)))
  })

  it('a reset by 0013 also clears the authentic-only ratings, and the refit lands exactly', async () => {
    // Re-running 0013 after the deploy, once the current fit has run: an
    // answer the old worker fitted before the deploy left an `unknown` item.
    const answers = history(8, 90, MIXED)
    const d1 = makeTestD1()
    await seedHistory(d1, answers, classifyAttemptSource)
    await refit(d1)
    expect((await ratings(d1)).abilities.some((a) => a.authentic_ability !== null)).toBe(true)
    const gap: Answer = { user: 1, kind: 'drill', qid: 'var-2024-verb1-ORD-015', correct: true }
    await d1
      .prepare(
        'INSERT INTO attempts (id, user_id, session_id, question_id, correct) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(answers.length + 1, gap.user, sessionId(gap), gap.qid, 1)
      .run()
    await d1
      .prepare(
        "INSERT INTO item_stats (question_id, difficulty, attempts) VALUES ('var-2024-verb1-ORD-015', -12.8, 1)",
      )
      .run()

    d1.applyMigration(BACKFILL_MIGRATION)
    expect(await ratings(d1)).toEqual({ items: [], abilities: [] })
    expect(await watermark(d1)).toBe(0)
    await refit(d1)
    expect(JSON.stringify(await ratings(d1))).toBe(
      JSON.stringify(await provenanceFit([...answers, gap])),
    )
  })

  it('0015 is statements wrangler splits as drizzle does, and leaves no helper table', () => {
    const raw = readFileSync(join(DRIZZLE, TRACK_RESET_MIGRATION), 'utf8')
    // wrangler splits a migration file on semicolons: no comment may hold one.
    expect(raw.split('\n').filter((line) => line.startsWith('--') && line.includes(';'))).toEqual(
      [],
    )
    const statements = raw
      .split('--> statement-breakpoint')
      .map((s) => s.trim().replace(/^(?:--[^\n]*\n)+/, ''))
      .filter(Boolean)
    for (const statement of statements) expect(statement.indexOf(';')).toBe(statement.length - 1)
    expect(statements[statements.length - 1]).toBe('DROP TABLE IF EXISTS `tmp_0015_refit`;')
  })
})

// ── R3-B1: 0015 never resets state the current fit wrote ─────────────────
//
// 0015 also used to reset on a synthetic item_stats row while no user_ability
// row held an authentic rating. The current fit leaves exactly that once its
// last user with synthetic answers deletes the account. A re-run of 0015 then
// deleted every other user's ratings, and what answers already pruned by
// retention had contributed could never be refitted. The evidence is now only
// a row with synthetic answers and no authentic rating, which the current fit
// never writes.

describe('0015 changes nothing the current fit wrote, whoever left and whatever was pruned (R3-B1)', () => {
  const P5_LAS = 'p5-las-b19-002-r1-LÄS-001'
  const LAS = 'var-2024-verb1-LÄS-011'
  // B's LÄS ability after A's answers: the authentic-only control of the
  // R2-B1 repro in lib/fit.test.ts.
  const CONTROL_B = 12.328643808700775
  const DAY = 24 * 60 * 60
  const NOW = new Date('2026-10-08T03:00:00Z')
  const seconds = (date: Date) => Math.floor(date.getTime() / 1000)

  /** Every column of the fitted state, updated_at included. */
  async function fittedRows(d1: ShimD1) {
    const all = async (sql: string) => (await d1.prepare(sql).all()).results
    return {
      items: await all('SELECT * FROM item_stats ORDER BY question_id'),
      abilities: await all('SELECT * FROM user_ability ORDER BY user_id, section'),
      fit: await all('SELECT * FROM fit_state ORDER BY id'),
    }
  }

  /** The state 0015 used to reset on: a synthetic item row while no ability
   *  row holds an authentic rating. */
  async function lastMixedUserLeft(d1: ShimD1): Promise<boolean> {
    const found = await d1
      .prepare(
        `SELECT EXISTS (SELECT 1 FROM item_stats WHERE source = 'synthetic')
           AND NOT EXISTS (SELECT 1 FROM user_ability WHERE authentic_ability IS NOT NULL) AS found`,
      )
      .first<number>('found')
    return found === 1
  }

  async function helperTables(d1: ShimD1) {
    const { results } = await d1
      .prepare("SELECT name FROM sqlite_master WHERE name = 'tmp_0015_refit'")
      .all()
    return results
  }

  it('the reviewer’s repro: once A has left and B’s answer is pruned, a re-run keeps B, the items and the watermark', async () => {
    const d1 = makeTestD1()
    const db = getDb(d1 as unknown as D1Database)
    // A (user 1) answers a synthetic LÄS question, then an authentic one. B
    // (user 2) answers only the authentic one. The fit runs.
    await seedHistory(
      d1,
      [
        { user: 1, kind: 'drill', qid: P5_LAS, correct: true },
        { user: 1, kind: 'drill', qid: LAS, correct: true },
        { user: 2, kind: 'drill', qid: LAS, correct: true },
      ],
      classifyAttemptSource,
    )
    await refit(d1)
    // A deletes the account. B's answer ages past the retention window, and
    // the nightly prune takes it.
    expect(await cascadeDeleteUser(db, 'u1')).toEqual({ deleted: true })
    await d1
      .prepare('UPDATE attempts SET created_at = ? WHERE user_id = 2')
      .bind(seconds(NOW) - (RETENTION_DAYS + 1) * DAY)
      .run()
    await runRetention(db, NOW)
    expect(await d1.prepare('SELECT COUNT(*) AS n FROM attempts').first('n')).toBe(0)

    // What the re-run meets: a synthetic item row, no authentic rating
    // anywhere, and B's ability, which no refit can rebuild now.
    expect(await lastMixedUserLeft(d1)).toBe(true)
    const kept = await fittedRows(d1)
    expect(kept.abilities).toMatchObject([
      {
        user_id: 2,
        section: 'LÄS',
        ability: CONTROL_B,
        attempts: 1,
        synthetic_attempts: 0,
        authentic_ability: null,
      },
    ])
    expect(kept.items.map((i) => [i.question_id, i.source])).toEqual([
      [P5_LAS, 'synthetic'],
      [LAS, 'authentic'],
    ])
    expect(kept.fit).toMatchObject([{ id: 1, last_attempt_id: 3 }])

    d1.applyMigration(TRACK_RESET_MIGRATION)
    expect(await fittedRows(d1)).toEqual(kept)
    expect(await helperTables(d1)).toEqual([])
    // The next fit has nothing to fold, and B and the items stay as they were.
    const before = await ratings(d1)
    expect(await refit(d1)).toEqual({ processed: 0, watermark: 3 })
    expect(await ratings(d1)).toEqual(before)
    expect(await watermark(d1)).toBe(3)
  })

  it('is a no-op on a fresh database', async () => {
    const d1 = makeTestD1()
    d1.applyMigration(TRACK_RESET_MIGRATION)
    expect(await fittedRows(d1)).toEqual({ items: [], abilities: [], fit: [] })
    expect(await helperTables(d1)).toEqual([])
  })

  // Property-style: the life of the service. Accounts join, some answering
  // authentic and P5 questions, the rest authentic ones only. The fit runs,
  // time passes, retention prunes and accounts are deleted, in a seeded order.
  // At the end a user with authentic answers only joins, every user with P5
  // answers still here leaves, which is the R3-B1 case, and the rest of the
  // history ages out of retention. 0015 runs after every step and must change
  // no row, not even a timestamp.
  type Step =
    | { op: 'join'; user: number }
    | { op: 'answer'; answer: Answer; at: number }
    | { op: 'fit' }
    | { op: 'prune'; at: number }
    | { op: 'delete'; user: number }

  function lifeOfTheService(seed: number): Step[] {
    const r = rng(seed)
    const steps: Step[] = []
    // Each member, and whether they answer P5 questions too.
    const members = new Map<number, boolean>()
    let lastUser = 0
    let clock = seconds(NOW) - 360 * DAY
    const join = (mixed: boolean) => {
      lastUser += 1
      members.set(lastUser, mixed)
      steps.push({ op: 'join', user: lastUser })
    }
    const leave = (user: number) => {
      members.delete(user)
      steps.push({ op: 'delete', user })
    }
    const answer = (user: number) => {
      const pool = members.get(user) ? MIXED : BANK
      clock += Math.floor(r() * 3 * DAY)
      const a: Answer = {
        user,
        kind: KINDS[Math.floor(r() * KINDS.length)],
        qid: pool[Math.floor(r() * pool.length)],
        correct: r() < 0.6,
      }
      steps.push({ op: 'answer', answer: a, at: clock })
    }
    for (const mixed of [true, true, false, false]) join(mixed)
    for (let n = 0; n < 150; n++) {
      const roll = r()
      const users = [...members.keys()]
      if (roll < 0.7 && users.length > 0) answer(users[Math.floor(r() * users.length)])
      else if (roll < 0.82) steps.push({ op: 'fit' })
      else if (roll < 0.9) steps.push({ op: 'prune', at: clock })
      else if (roll < 0.95 && users.length > 0) leave(users[Math.floor(r() * users.length)])
      else join(r() < 0.5)
    }
    join(false)
    for (let n = 0; n < 5; n++) answer(lastUser)
    steps.push({ op: 'fit' })
    for (const [user, mixed] of [...members]) if (mixed) leave(user)
    steps.push({ op: 'fit' })
    clock += (RETENTION_DAYS + 1) * DAY
    steps.push({ op: 'prune', at: clock }, { op: 'fit' })
    return steps
  }

  async function play(d1: ShimD1, step: Step): Promise<void> {
    const db = getDb(d1 as unknown as D1Database)
    if (step.op === 'join') {
      await d1
        .prepare('INSERT INTO users (id, clerk_user_id) VALUES (?, ?)')
        .bind(step.user, `u${step.user}`)
        .run()
      for (const kind of KINDS) {
        await d1
          .prepare('INSERT INTO sessions (id, user_id, kind) VALUES (?, ?, ?)')
          .bind(sessionId({ user: step.user, kind, qid: '', correct: false }), step.user, kind)
          .run()
      }
    } else if (step.op === 'answer') {
      const a = step.answer
      await d1
        .prepare(
          'INSERT INTO attempts (user_id, session_id, question_id, correct, source, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind(a.user, sessionId(a), a.qid, a.correct ? 1 : 0, classifyAttemptSource(a.qid), step.at)
        .run()
    } else if (step.op === 'fit') {
      await refit(d1)
    } else if (step.op === 'prune') {
      await runRetention(db, new Date(step.at * 1000))
    } else {
      await cascadeDeleteUser(db, `u${step.user}`)
    }
  }

  for (const seed of [41, 43, 44, 45]) {
    it(`history ${seed}: re-running 0015 after any step changes nothing`, async () => {
      const d1 = makeTestD1()
      let atStake = 0
      let prunedFitted = 0
      for (const [i, step] of lifeOfTheService(seed).entries()) {
        if (step.op === 'prune') {
          // Answers the fit has folded that this prune takes.
          const cutoff = seconds(retentionCutoff(new Date(step.at * 1000)))
          prunedFitted += Number(
            await d1
              .prepare(
                `SELECT COUNT(*) AS n FROM attempts JOIN sessions ON sessions.id = attempts.session_id
                 WHERE attempts.created_at < ? AND sessions.kind <> 'lesson'
                   AND attempts.id <= (SELECT last_attempt_id FROM fit_state)`,
              )
              .bind(cutoff)
              .first('n'),
          )
        }
        await play(d1, step)
        const before = await fittedRows(d1)
        d1.applyMigration(TRACK_RESET_MIGRATION)
        expect(await fittedRows(d1), `0015 after step ${i} (${step.op})`).toEqual(before)
        if (before.abilities.length > 0 && (await lastMixedUserLeft(d1))) atStake += 1
      }
      // The trial meets the R3-B1 state with other users' ratings at stake,
      // and retention takes answers the fit has folded, which no refit can
      // bring back.
      expect(atStake).toBeGreaterThan(0)
      expect(prunedFitted).toBeGreaterThan(0)
      expect(await helperTables(d1)).toEqual([])
    })
  }
})

// ── LJ-10: the Ljusbord expand, 0016 ──────────────────────────────────────
//
// 0016 is the one expand step of the Ljusbord rebuild (bead hpf-qr0p.51.2,
// rebuild map §2). It adds nullable or defaulted columns and one table, and
// nothing else, so the worker from before it runs unchanged against the
// migrated database. The behaviour on top of the columns comes with later
// beads: 0016 adds storage only.

/** Every column 0016 adds to a table that exists at 0015, as PRAGMA
 *  table_info reports it: [table, column, type, default]. None is NOT NULL. */
const ADDED_COLUMNS: Array<[string, string, string, string | null]> = [
  ['attempts', 'confidence', 'text', null],
  ['lesson_progress', 'step', 'integer', null],
  ['lesson_progress', 'guess', 'text', null],
  ['mistakes', 'reason', 'text', "'wrong'"],
  ['mistakes', 'last_confidence', 'text', null],
  ['mock_results', 'half_run_id', 'text', null],
  ['sessions', 'marks', 'text', null],
  // The 11 Konto prefs.
  ['users', 'answer_confidence', 'integer', 'true'],
  ['users', 'facit_timing', 'text', "'each'"],
  ['users', 'show_my_time', 'integer', 'false'],
  ['users', 'mock_clock_visible', 'integer', 'true'],
  ['users', 'mock_reminder', 'integer', 'true'],
  ['users', 'text_size', 'text', "'normal'"],
  ['users', 'motion', 'text', "'system'"],
  ['users', 'shortcuts', 'integer', 'true'],
  ['users', 'mode_follow_system', 'integer', 'false'],
  ['users', 'target_score', 'integer', null],
  ['users', 'quant_repeat', 'text', "'new'"],
]

/** The Konto prefs of a user who never set them, as the schema reads them. */
const DEFAULT_PREFS = {
  answerConfidence: true,
  facitTiming: 'each',
  showMyTime: false,
  mockClockVisible: true,
  mockReminder: true,
  textSize: 'normal',
  motion: 'system',
  shortcuts: true,
  modeFollowSystem: false,
  targetScore: null,
  quantRepeat: 'new',
}

/** A database at 0015 with rows in every table, in plain SQL the worker
 *  before 0016 could have written: NULLs and defaults, Swedish letters, an
 *  apostrophe, JSON, and reals that need every bit. */
const SEED_0015 = `
INSERT INTO users (id, clerk_user_id, days_to_exam, daily_minutes, target_sitting_id, coach,
  palette, mode, font, density, show_streak, smart_drill, mock_deferred_date, attempts_total,
  drills_total, created_at)
VALUES (1, 'user_ljus_1', 120, 45, 'host-2026', 'kompis', 'spalt', 'dark', 'hyperlegible',
  'comfy', 1, 0, '2026-11-03', 4, 2, 1793700000);
INSERT INTO users (id, clerk_user_id) VALUES (2, 'user_ljus_2');
INSERT INTO sessions (id, user_id, started_at, ended_at, kind, sections, position,
  current_question_id, plan, device)
VALUES
  (1, 1, 1793700000, NULL, 'drill', 'ORD · PÅ TID', 3, 'var-2024-verb1-ORD-004',
    '["var-2024-verb1-ORD-001","var-2024-verb1-ORD-004"]', 'phone'),
  (2, 1, 1793600000, 1793603300, 'mock', 'LÄS,ELF', 40, NULL, '["var-2026-verb1-LÄS-011"]',
    'desktop'),
  (3, 2, 1793500000, NULL, 'lesson', NULL, 0, NULL, NULL, NULL);
INSERT INTO lesson_progress (id, user_id, section, framework_id, device, updated_at)
VALUES (1, 1, 'XYZ', 'XYZ-TRAP-016', 'tablet', 1793700001);
INSERT INTO lesson_reads (id, user_id, entry_id, read_at)
VALUES (1, 1, 'KVA-TRAP-001', 1793700002);
INSERT INTO daily_plans (id, user_id, date, plan, updated_at)
VALUES (1, 1, '2026-11-03',
  '{"items":[{"kind":"drill","label":"Dagens spår: kvantens ''fälla''"}],"version":3}',
  1793700003);
INSERT INTO attempts (id, user_id, session_id, question_id, selected_answer, correct,
  time_taken_ms, created_at, source, item_revision)
VALUES
  (1, 1, 1, 'var-2024-verb1-ORD-001', 'B', 1, 17250, 1793700010, 'authentic', NULL),
  (2, 1, 2, 'p5-las-b19-002-r1-LÄS-001', 'D', 0, 61000, 1793600100, 'synthetic', 1),
  (3, 2, 3, 'q1', NULL, NULL, NULL, NULL, 'unknown', NULL);
INSERT INTO mistakes (id, user_id, question_id, layer1_ids, status, error_count_7d,
  last_error_at, next_review_at, interval_minutes, lapse_interval_minutes)
VALUES
  (1, 1, 'var-2024-verb1-ORD-001', '["ORD-ROOT-012"]', 'active', 2, 1793700010, 1793786410,
    1440, 2880),
  (2, 1, 'p5-las-b19-002-r1-LÄS-001', NULL, 'mock-pending-review', 1, 1793600100, NULL, 0,
    NULL);
INSERT INTO srs_state (id, user_id, item_id, item_kind, direction, interval_days, ease, due_at,
  last_reviewed_at)
VALUES (1, 1, 'ord-root-012', 'ord_root', 'primary', 6, 1.3000000000000003, 1793786410,
  1793700010);
INSERT INTO mastery (id, user_id, section, layer1_id, score, last_updated_at)
VALUES (1, 1, 'ORD', 'ORD-ROOT-012', 0.30000000000000004, 1793700010);
INSERT INTO framework_progress (id, user_id, layer1_id, status, last_transition_at)
VALUES (1, 1, 'KVA-TRAP-001', 'practicing', 1793700010);
INSERT INTO mock_results (id, user_id, session_id, mode, half, exam_id, provpass, presented,
  answered, correct, seen_before, duration_ms, breakdown, created_at, estimate_basis)
VALUES (1, 1, 2, 'authentic', 'verbal', 'var-2026', 'verbal-1', 40, 38, 29, 3, 3300000,
  '{"perSection":{"LÄS":{"presented":10,"correct":7,"timeMs":1320000}},"version":1}',
  1793603300, '{"authentic":40,"synthetic":0,"unknown":0}');
INSERT INTO item_stats (question_id, difficulty, attempts, updated_at, source)
VALUES
  ('var-2024-verb1-ORD-001', -12.8, 31, 1793700020, 'authentic'),
  ('p5-las-b19-002-r1-LÄS-001', 3.0e-7, 1, 1793700020, 'synthetic');
INSERT INTO user_ability (user_id, section, ability, attempts, updated_at, synthetic_attempts,
  authentic_ability)
VALUES
  (1, 'LÄS', 12.328643808700775, 2, 1793700020, 1, -4.5),
  (1, 'ORD', -7.25, 1, 1793700020, 0, NULL);
INSERT INTO fit_state (id, last_attempt_id, updated_at) VALUES (1, 3, 1793700020);
`

/** The tables and indexes, each with the page its b-tree starts on. ADD
 *  COLUMN rewrites only a table's CREATE statement, which is why a table's
 *  SQL is left out; a rebuild copies the rows into a new b-tree, so its root
 *  page would move. */
async function schemaObjects(d1: ShimD1) {
  const { results } = await d1
    .prepare(
      `SELECT type, name, tbl_name, rootpage, CASE type WHEN 'index' THEN sql END AS sql
       FROM sqlite_master WHERE type IN ('table', 'index') ORDER BY name`,
    )
    .all<{ type: string; name: string; tbl_name: string; rootpage: number; sql: string | null }>()
  return results
}

/** Every row of `table` by rowid, each of `cols` as SQLite stores it: its
 *  storage class, its exact literal (quote() writes a real so that it reads
 *  back to the same bits) and its bytes. */
async function storedRows(d1: ShimD1, table: string, cols: readonly string[]) {
  const cells = cols.map(
    (c) => `typeof(\`${c}\`) || ' ' || quote(\`${c}\`) || ' ' || hex(\`${c}\`) AS \`${c}\``,
  )
  const { results } = await d1
    .prepare(`SELECT rowid AS _rowid, ${cells.join(', ')} FROM \`${table}\` ORDER BY rowid`)
    .all()
  return results
}

describe('Ljusbord expand — 0016 adds storage only (LJ-10)', () => {
  it('is exactly the generated DDL: one new table, then added columns; nothing dropped, renamed or rebuilt', () => {
    const statements = readFileSync(join(DRIZZLE, EXPAND_MIGRATION), 'utf8')
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
    expect(statements).toEqual([
      [
        'CREATE TABLE `explanation_feedback` (',
        '\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,',
        '\t`user_id` integer NOT NULL,',
        '\t`qid` text NOT NULL,',
        '\t`verdict` text NOT NULL,',
        '\t`note` text,',
        '\t`model` text,',
        '\t`created_at` integer,',
        '\tFOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade',
        ');',
      ].join('\n'),
      'CREATE UNIQUE INDEX `idx_explanation_feedback_user_qid` ON `explanation_feedback` (`user_id`,`qid`);',
      'ALTER TABLE `attempts` ADD `confidence` text;',
      'ALTER TABLE `lesson_progress` ADD `step` integer;',
      'ALTER TABLE `lesson_progress` ADD `guess` text;',
      "ALTER TABLE `mistakes` ADD `reason` text DEFAULT 'wrong';",
      'ALTER TABLE `mistakes` ADD `last_confidence` text;',
      'ALTER TABLE `mock_results` ADD `half_run_id` text;',
      'ALTER TABLE `sessions` ADD `marks` text;',
      'ALTER TABLE `users` ADD `answer_confidence` integer DEFAULT true;',
      "ALTER TABLE `users` ADD `facit_timing` text DEFAULT 'each';",
      'ALTER TABLE `users` ADD `show_my_time` integer DEFAULT false;',
      'ALTER TABLE `users` ADD `mock_clock_visible` integer DEFAULT true;',
      'ALTER TABLE `users` ADD `mock_reminder` integer DEFAULT true;',
      "ALTER TABLE `users` ADD `text_size` text DEFAULT 'normal';",
      "ALTER TABLE `users` ADD `motion` text DEFAULT 'system';",
      'ALTER TABLE `users` ADD `shortcuts` integer DEFAULT true;',
      'ALTER TABLE `users` ADD `mode_follow_system` integer DEFAULT false;',
      'ALTER TABLE `users` ADD `target_score` integer;',
      "ALTER TABLE `users` ADD `quant_repeat` text DEFAULT 'new';",
    ])
    // The hand check, spelled out: no DROP or RENAME, no `__new_` copy (how
    // drizzle-kit rebuilds a table SQLite cannot ALTER), and every ALTER a
    // plain, nullable ADD.
    expect(statements.join('\n')).not.toMatch(/\b(DROP|RENAME)\b|__new_|PRAGMA/i)
    for (const statement of statements.filter((s) => s.startsWith('ALTER'))) {
      expect(statement).toMatch(/^ALTER TABLE `\w+` ADD `\w+` (text|integer|real)( DEFAULT \S+)?;$/)
    }
  })

  it('adds exactly the §2 columns, each nullable with its default, and keeps every column in place', async () => {
    const d1 = makeTestD1({ before: EXPAND_MIGRATION })
    const tables = (await schemaObjects(d1)).filter((o) => o.type === 'table').map((o) => o.name)
    const before = new Map<string, ColumnInfo[]>()
    for (const table of tables) before.set(table, await columns(d1, table))

    d1.applyMigration(EXPAND_MIGRATION)
    const added: Array<[string, string, string, string | null]> = []
    for (const table of tables) {
      const had = before.get(table) ?? []
      const now = await columns(d1, table)
      // ADD COLUMN appends: every column the table had is still there, as it was.
      expect(now.slice(0, had.length), table).toEqual(had)
      for (const c of now.slice(had.length)) {
        expect(c.notnull, `${table}.${c.name}`).toBe(0)
        added.push([table, c.name, c.type.toLowerCase(), c.dflt_value])
      }
    }
    expect(added).toEqual(ADDED_COLUMNS)
    expect(added.filter(([table]) => table === 'users')).toHaveLength(11)
  })

  it('creates explanation_feedback: one row per (user, question), owned by the user', async () => {
    const d1 = makeTestD1()
    const cols = (await columns(d1, 'explanation_feedback')).map((c) => [
      c.name,
      c.type.toLowerCase(),
      c.notnull,
      c.dflt_value,
      c.pk,
    ])
    expect(cols).toEqual([
      ['id', 'integer', 1, null, 1],
      ['user_id', 'integer', 1, null, 0],
      ['qid', 'text', 1, null, 0],
      ['verdict', 'text', 1, null, 0],
      ['note', 'text', 0, null, 0],
      ['model', 'text', 0, null, 0],
      ['created_at', 'integer', 0, null, 0],
    ])
    const { results: indexes } = await d1
      .prepare('PRAGMA index_list(explanation_feedback)')
      .all<{ name: string; unique: number }>()
    expect(indexes.map((i) => [i.name, i.unique])).toEqual([
      ['idx_explanation_feedback_user_qid', 1],
    ])
    const { results: keyed } = await d1
      .prepare('PRAGMA index_info(idx_explanation_feedback_user_qid)')
      .all<{ name: string }>()
    expect(keyed.map((k) => k.name)).toEqual(['user_id', 'qid'])
    const { results: keys } = await d1
      .prepare('PRAGMA foreign_key_list(explanation_feedback)')
      .all<{ table: string; from: string; to: string; on_delete: string }>()
    expect(keys.map((k) => [k.table, k.from, k.to, k.on_delete])).toEqual([
      ['users', 'user_id', 'id', 'CASCADE'],
    ])
  })

  it('explanation_feedback keeps one answer per (user, question), and goes with the account', async () => {
    const d1 = makeTestD1()
    const db = getDb(d1 as unknown as D1Database)
    await d1.exec("INSERT INTO users (id, clerk_user_id) VALUES (1, 'u1'), (2, 'u2')")
    const qid = 'var-2024-verb1-ORD-001'
    // The upsert a PUT makes: the unique (user_id, qid) index is its target.
    const answer = (userId: number, verdict: string) =>
      db
        .insert(schema.explanationFeedback)
        .values({ userId, qid, verdict })
        .onConflictDoUpdate({
          target: [schema.explanationFeedback.userId, schema.explanationFeedback.qid],
          set: { verdict },
        })
    await answer(1, 'nej')
    await answer(1, 'delvis')
    await answer(2, 'ja')
    const stored = async () =>
      (
        await d1
          .prepare('SELECT user_id, qid, verdict FROM explanation_feedback ORDER BY user_id')
          .all()
      ).results
    expect(await stored()).toEqual([
      { user_id: 1, qid, verdict: 'delvis' },
      { user_id: 2, qid, verdict: 'ja' },
    ])
    // A second row for the same pair is refused.
    await expect(
      d1.exec(
        `INSERT INTO explanation_feedback (user_id, qid, verdict) VALUES (2, '${qid}', 'nej')`,
      ),
    ).rejects.toThrow(/UNIQUE/)
    // cascadeDeleteUser names no explanation_feedback: the user_id foreign key
    // removes the rows with the users row, as it does user_ability's.
    expect(await cascadeDeleteUser(db, 'u1')).toEqual({ deleted: true })
    expect(await stored()).toEqual([{ user_id: 2, qid, verdict: 'ja' }])
  })

  it('a database at 0015 keeps every row byte for byte, and every table and index where it was', async () => {
    const d1 = makeTestD1({ before: EXPAND_MIGRATION })
    await d1.exec(SEED_0015)
    const objectsBefore = await schemaObjects(d1)
    const tables = objectsBefore.filter((o) => o.type === 'table').map((o) => o.name)
    const had = new Map<string, string[]>()
    for (const table of tables) {
      const names = (await columns(d1, table)).map((c) => c.name)
      had.set(table, names)
    }
    const dump = async () => {
      const out: Record<string, unknown[]> = {}
      for (const table of tables) out[table] = await storedRows(d1, table, had.get(table) ?? [])
      return out
    }
    const rowsBefore = await dump()
    // Every table holds rows, so none is compared empty.
    expect(tables.filter((table) => rowsBefore[table].length === 0)).toEqual([])

    d1.applyMigration(EXPAND_MIGRATION)
    expect(await dump()).toEqual(rowsBefore)
    const objectsAfter = await schemaObjects(d1)
    const existed = (o: { name: string }) => objectsBefore.some((b) => b.name === o.name)
    expect(objectsAfter.filter(existed)).toEqual(objectsBefore)
    expect(objectsAfter.filter((o) => !existed(o)).map((o) => [o.type, o.name])).toEqual([
      ['table', 'explanation_feedback'],
      ['index', 'idx_explanation_feedback_user_qid'],
    ])
    expect(await d1.prepare('PRAGMA integrity_check').first('integrity_check')).toBe('ok')
    expect((await d1.prepare('PRAGMA foreign_key_check').all()).results).toEqual([])
  })

  it('rows from before it, and rows the worker before it still writes, read the defaults', async () => {
    const d1 = makeTestD1({ before: EXPAND_MIGRATION })
    await d1.exec(SEED_0015)
    d1.applyMigration(EXPAND_MIGRATION)
    // Between `migrations apply` and the deploy, the old worker's inserts name
    // only the columns it knows.
    await d1.exec(`
      INSERT INTO users (id, clerk_user_id) VALUES (3, 'user_ljus_3');
      INSERT INTO sessions (id, user_id, kind) VALUES (4, 3, 'drill'), (5, 3, 'mock');
      INSERT INTO attempts (user_id, session_id, question_id, correct, source)
        VALUES (3, 4, 'var-2024-verb1-ORD-002', 0, 'authentic');
      INSERT INTO mistakes (user_id, question_id) VALUES (3, 'var-2024-verb1-ORD-002');
      INSERT INTO lesson_progress (user_id, section) VALUES (3, 'KVA');
      INSERT INTO mock_results (user_id, session_id, mode, half, presented, answered, correct,
        seen_before, duration_ms, breakdown)
        VALUES (3, 5, 'synthetic', 'kvant', 0, 0, 0, 0, 0, '{}');
    `)
    // A pref flag's default is stored as SQLite's integer 1 or 0.
    const { results: flags } = await d1
      .prepare(
        `SELECT typeof(answer_confidence) AS stored, answer_confidence, show_my_time,
           mock_clock_visible, mock_reminder, shortcuts, mode_follow_system
         FROM users ORDER BY id`,
      )
      .all()
    const flagDefaults = {
      stored: 'integer',
      answer_confidence: 1,
      show_my_time: 0,
      mock_clock_visible: 1,
      mock_reminder: 1,
      shortcuts: 1,
      mode_follow_system: 0,
    }
    expect(flags).toEqual([flagDefaults, flagDefaults, flagDefaults])

    // Read through the schema, as the worker reads them.
    const db = getDb(d1 as unknown as D1Database)
    expect(await db.select().from(schema.users).orderBy(schema.users.id)).toMatchObject([
      DEFAULT_PREFS,
      DEFAULT_PREFS,
      DEFAULT_PREFS,
    ])
    expect((await db.select().from(schema.attempts)).map((a) => a.confidence)).toEqual([
      null,
      null,
      null,
      null,
    ])
    expect(
      (await db.select().from(schema.mistakes)).map((m) => [m.reason, m.lastConfidence]),
    ).toEqual([
      ['wrong', null],
      ['wrong', null],
      ['wrong', null],
    ])
    expect((await db.select().from(schema.sessions)).map((s) => s.marks)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ])
    expect((await db.select().from(schema.lessonProgress)).map((l) => [l.step, l.guess])).toEqual([
      [null, null],
      [null, null],
    ])
    expect((await db.select().from(schema.mockResults)).map((m) => m.halfRunId)).toEqual([
      null,
      null,
    ])
  })

  it('types confidence as gissar, tror or saker (owner decision) and a reason as one of four', () => {
    // The database keeps plain text: drizzle-kit writes no CHECK for an enum,
    // so the routes that write these columns validate them.
    expect(schema.CONFIDENCE_LEVELS).toEqual(['gissar', 'tror', 'saker'])
    expect(schema.MISTAKE_REASONS).toEqual(['wrong', 'lucky', 'flagged', 'manual'])
    const enumOf = (table: SQLiteTable, column: string) =>
      getTableConfig(table).columns.find((c) => c.name === column)?.enumValues
    expect(enumOf(schema.attempts, 'confidence')).toEqual(schema.CONFIDENCE_LEVELS)
    expect(enumOf(schema.mistakes, 'last_confidence')).toEqual(schema.CONFIDENCE_LEVELS)
    expect(enumOf(schema.mistakes, 'reason')).toEqual(schema.MISTAKE_REASONS)
  })
})
