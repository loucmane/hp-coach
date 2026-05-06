import { drizzle } from 'drizzle-orm/sqlite-proxy'
import { SQLocalDrizzle } from 'sqlocal/drizzle'
import * as schema from './schema'

// SQLite-WASM persisted to OPFS. Survives reloads, single-tab safe.
const { driver, batchDriver } = new SQLocalDrizzle({
  databasePath: 'hp-coach.db',
})

export const db = drizzle(driver, batchDriver, { schema })
export type DB = typeof db
export { schema }
