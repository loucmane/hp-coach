// A minimal in-memory D1Database shim over node:sqlite, for route tests.
//
// The worker has no miniflare/vitest-pool-workers harness — its existing
// tests are pure-function lib tests. Rather than pull in a heavy Workers
// test runtime, this shim implements just enough of the D1 prepared-
// statement surface that drizzle-orm/d1 calls (prepare → bind → all / run /
// raw / values, plus batch/exec) against an in-memory SQLite built from the
// generated migration SQL. That gives route handlers a REAL database — real
// SQL, real unique-index upserts, real user scoping — without a network or
// a Workers runtime.
//
// Scope note: this is a test double, not a production D1. It covers the
// query shapes our routes emit; it is not a general-purpose D1 emulator.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const MIGRATIONS_DIR = fileURLToPath(new URL('../../drizzle', import.meta.url))

type Row = Record<string, unknown>

// Convert a bigint (node:sqlite returns INTEGER PKs as bigint by default in
// some builds) to number so JSON/Drizzle comparisons behave like real D1,
// which surfaces integers as JS numbers.
function normalize(row: Row | undefined): Row | null {
  if (!row) return null
  const out: Row = {}
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === 'bigint' ? Number(v) : v
  }
  return out
}

class ShimPreparedStatement {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...values: unknown[]): ShimPreparedStatement {
    return new ShimPreparedStatement(this.db, this.sql, values)
  }

  private stmt() {
    return this.db.prepare(this.sql)
  }

  async all<T = Row>(): Promise<{ results: T[]; success: true; meta: Record<string, unknown> }> {
    const rows = this.stmt().all(...(this.params as [])) as Row[]
    return { results: rows.map((r) => normalize(r)) as T[], success: true, meta: {} }
  }

  async run(): Promise<{ success: true; meta: Record<string, unknown> }> {
    const info = this.stmt().run(...(this.params as []))
    return {
      success: true,
      meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) },
    }
  }

  async first<T = Row>(colName?: string): Promise<T | null> {
    const row = normalize(this.stmt().get(...(this.params as [])) as Row | undefined)
    if (!row) return null
    if (colName) return (row[colName] ?? null) as T
    return row as T
  }

  // drizzle's d1 driver uses .raw() (array-of-arrays) for RETURNING reads.
  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[]> {
    const stmt = this.stmt()
    const rows = stmt.all(...(this.params as [])) as Row[]
    const cols = rows.length > 0 ? Object.keys(rows[0]) : columnsFor(stmt)
    const asArrays = rows.map((r) =>
      cols.map((c) => {
        const v = (r as Row)[c]
        return typeof v === 'bigint' ? Number(v) : v
      }),
    )
    if (options?.columnNames) return [cols, ...asArrays] as T[]
    return asArrays as T[]
  }
}

function columnsFor(stmt: ReturnType<DatabaseSync['prepare']>): string[] {
  try {
    return (stmt.columns() as Array<{ name: string }>).map((c) => c.name)
  } catch {
    return []
  }
}

export type ShimD1 = {
  prepare: (sql: string) => ShimPreparedStatement
  batch: <T = unknown>(stmts: ShimPreparedStatement[]) => Promise<T[]>
  exec: (sql: string) => Promise<{ count: number; duration: number }>
  dump: () => Promise<ArrayBuffer>
}

/** Build a fresh in-memory D1-shaped database with every generated
 *  migration applied. Each call is an isolated DB — tests never share
 *  state. */
export function makeTestD1(): ShimD1 {
  const db = new DatabaseSync(':memory:')
  // Foreign keys on, matching D1's default behaviour for cascades.
  db.exec('PRAGMA foreign_keys = ON')

  // Apply every migration in order. drizzle emits statements separated by
  // the `--> statement-breakpoint` sentinel; split on it and run each.
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const file of files) {
    const raw = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    for (const stmt of raw.split('--> statement-breakpoint')) {
      const trimmed = stmt.trim()
      if (trimmed) db.exec(trimmed)
    }
  }

  return {
    prepare: (sql: string) => new ShimPreparedStatement(db, sql),
    batch: async (stmts) => {
      const out: unknown[] = []
      for (const s of stmts) out.push(await s.run())
      return out as never
    },
    exec: async (sql: string) => {
      db.exec(sql)
      return { count: 0, duration: 0 }
    },
    dump: async () => new ArrayBuffer(0),
  }
}
