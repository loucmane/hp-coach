// Migration contract for attempts.source (P5 infold PR 3,
// docs/p5-infold-design.md §E).
//
//   · drizzle-kit's own differ finds nothing between the newest committed
//     snapshot and src/db/schema.ts: the SQL under drizzle/ came from
//     `pnpm db:generate` on this schema and nothing is pending.
//   · the database those files build has attempts.source exactly as the
//     schema declares it.
//   · the one-off backfill, drizzle/0013_attempt_source_backfill.sql, gives a
//     row that predates the column `authentic` when lib/provenance.ts calls
//     its qid authentic and `unknown` otherwise — no P5 attempt can predate
//     the column, so nothing is backfilled `synthetic`. It only ever promotes
//     `unknown` rows, so re-running it is safe.
//
// Everything here runs against the in-memory node:sqlite shim; no real
// database is touched.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { getTableConfig } from 'drizzle-orm/sqlite-core'
import { describe, expect, it } from 'vitest'

import registry from '../../data/p5-qid-registry.json'
import { classifyAttemptSource, isAuthenticQid } from '../lib/provenance'
import { makeTestD1, migrationFiles, type ShimD1 } from '../lib/testD1'
import * as schema from './schema'

const DRIZZLE = fileURLToPath(new URL('../../drizzle', import.meta.url))
const BANK_DIR = fileURLToPath(new URL('../../../app/public/data', import.meta.url))
const COLUMN_MIGRATION = '0012_attempt_source.sql'
const BACKFILL_MIGRATION = '0013_attempt_source_backfill.sql'

type Journal = { entries: Array<{ idx: number; tag: string }> }

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
]

/** Insert attempts with raw SQL, so the rows can predate the column. */
async function seedRaw(d1: ShimD1, qids: string[], source?: string): Promise<void> {
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

async function sources(d1: ShimD1): Promise<Array<{ question_id: string; source: string }>> {
  const { results } = await d1
    .prepare('SELECT question_id, source FROM attempts ORDER BY id')
    .all<{ question_id: string; source: string }>()
  return results
}

describe('attempts.source migrations — generated and matching the schema', () => {
  it('drizzle-kit finds nothing to generate: the newest snapshot is the schema', async () => {
    const journal = readJson<Journal>(join(DRIZZLE, 'meta/_journal.json'))
    const last = journal.entries[journal.entries.length - 1]
    const snapshot = readJson(
      join(DRIZZLE, 'meta', `${String(last.idx).padStart(4, '0')}_snapshot.json`),
    )
    const current = await generateSQLiteDrizzleJson(schema as unknown as Record<string, unknown>)
    expect(await generateSQLiteMigration(snapshot as never, current)).toEqual([])
  })

  it('journals every SQL file, the column and its backfill last', () => {
    const journal = readJson<Journal>(join(DRIZZLE, 'meta/_journal.json'))
    expect(journal.entries.map((e) => `${e.tag}.sql`)).toEqual(migrationFiles())
    expect(migrationFiles().slice(-2)).toEqual([COLUMN_MIGRATION, BACKFILL_MIGRATION])
  })

  it('the column migration is exactly the generated DDL', () => {
    const sql = readFileSync(join(DRIZZLE, COLUMN_MIGRATION), 'utf8').trim()
    expect(sql).toBe("ALTER TABLE `attempts` ADD `source` text DEFAULT 'unknown' NOT NULL;")
  })

  it('the migrated attempts table has exactly the schema’s columns, source fail-closed', async () => {
    const d1 = makeTestD1()
    const { results } = await d1.prepare('PRAGMA table_info(attempts)').all<{
      name: string
      type: string
      notnull: number
      dflt_value: string | null
    }>()
    const declared = getTableConfig(schema.attempts).columns.map((c) => c.name)
    expect(results.map((c) => c.name).sort()).toEqual([...declared].sort())
    const source = results.find((c) => c.name === 'source')
    expect(source?.type.toLowerCase()).toBe('text')
    expect(source).toMatchObject({ notnull: 1, dflt_value: "'unknown'" })
  })
})

describe('attempts.source backfill (one-off, idempotent)', () => {
  it('classifies rows that predate the column as lib/provenance.ts classifies an authentic qid', async () => {
    const authentic = bankQids()
    expect(authentic).toHaveLength(4320)
    // The legacy LAS spelling lib/section.ts normalises (a corpus-import quirk).
    const legacyLas = authentic
      .filter((q) => q.includes('-LÄS-'))
      .slice(0, 20)
      .map((q) => q.replace('-LÄS-', '-LAS-'))
    const p5 = registry.units.flatMap((u) => u.qids)
    const corpus = [...authentic, ...legacyLas, ...p5, ...UNKNOWN_QIDS]

    const d1 = makeTestD1({ before: COLUMN_MIGRATION })
    await seedRaw(d1, corpus)
    d1.applyMigration(COLUMN_MIGRATION)
    // Until the backfill runs, every pre-existing row fails closed.
    expect(new Set((await sources(d1)).map((r) => r.source))).toEqual(new Set(['unknown']))

    d1.applyMigration(BACKFILL_MIGRATION)
    const rows = await sources(d1)
    expect(rows.map((r) => r.question_id)).toEqual(corpus)
    const mismatches = rows.filter(
      (r) => r.source !== (isAuthenticQid(r.question_id) ? 'authentic' : 'unknown'),
    )
    expect(mismatches).toEqual([])
    expect(rows.filter((r) => r.source === 'authentic')).toHaveLength(
      authentic.length + legacyLas.length,
    )
    // Registry qids exist only from this PR on; no stored row predates them.
    expect(rows.filter((r) => r.source === 'synthetic')).toEqual([])
  })

  it('only promotes unknown rows, so a re-run after the deploy is safe', async () => {
    // Rows as the live table could hold them between `migrations apply` and
    // the worker deploy: the old worker still inserts without a source, so its
    // rows take the column default.
    const d1 = makeTestD1()
    const p5 = registry.units[0].qids[0]
    await seedRaw(d1, ['var-2024-verb1-ORD-001'], 'unknown')
    await seedRaw(d1, [p5], 'synthetic')
    await seedRaw(d1, ['var-2024-kvant1-KVA-013'], 'authentic')
    await seedRaw(d1, ['q1', 'p5-las-b7-002-r1-LÄS-001'], 'unknown')

    d1.applyMigration(BACKFILL_MIGRATION)
    const once = await sources(d1)
    expect(once).toEqual([
      { question_id: 'var-2024-verb1-ORD-001', source: 'authentic' },
      { question_id: p5, source: 'synthetic' },
      { question_id: 'var-2024-kvant1-KVA-013', source: 'authentic' },
      { question_id: 'q1', source: 'unknown' },
      { question_id: 'p5-las-b7-002-r1-LÄS-001', source: 'unknown' },
    ])
    for (const row of once) {
      if (row.source !== 'synthetic') {
        expect(row.source).toBe(classifyAttemptSource(row.question_id))
      }
    }

    d1.applyMigration(BACKFILL_MIGRATION)
    expect(await sources(d1)).toEqual(once)
  })
})
