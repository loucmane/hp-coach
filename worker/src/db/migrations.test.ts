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
import { runFit } from '../lib/fit'
import { classifyAttemptSource, isAuthenticQid } from '../lib/provenance'
import { makeTestD1, migrationFiles, type ShimD1 } from '../lib/testD1'
import { getDb } from './client'
import * as schema from './schema'

const DRIZZLE = fileURLToPath(new URL('../../drizzle', import.meta.url))
const BANK_DIR = fileURLToPath(new URL('../../../app/public/data', import.meta.url))
const COLUMN_MIGRATION = '0012_attempt_provenance.sql'
const BACKFILL_MIGRATION = '0013_attempt_provenance_backfill.sql'

type Journal = { entries: Array<{ idx: number; tag: string }> }
type ColumnInfo = { name: string; type: string; notnull: number; dflt_value: string | null }

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

  it('journals every SQL file, the columns and their backfill last', () => {
    const journal = readJson<Journal>(join(DRIZZLE, 'meta/_journal.json'))
    expect(journal.entries.map((e) => `${e.tag}.sql`)).toEqual(migrationFiles())
    expect(migrationFiles().slice(-2)).toEqual([COLUMN_MIGRATION, BACKFILL_MIGRATION])
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
      'SELECT user_id, section, ability, attempts, synthetic_attempts FROM user_ability ORDER BY user_id, section',
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
    expect(after.abilities).toEqual(legacy.abilities.map((a) => ({ ...a, synthetic_attempts: 0 })))
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
