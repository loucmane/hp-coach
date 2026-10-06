// Auth and rate limiting are applied by the /api sub-app in index.ts.
import { Hono } from 'hono'

import { getDb } from '../db/client'
import { ensureUserRow } from '../lib/ensureUser'
import { readFrameworkProgress } from '../lib/progress'
import type { Env, Vars } from '../types'

export const frameworkProgressRoute = new Hono<{ Bindings: Env; Variables: Vars }>().get(
  '/',
  async (c) => {
    const db = getDb(c.env.DB)
    const userId = await ensureUserRow(db, c.var.userId)
    const progress = await readFrameworkProgress(db, userId)
    return c.json({ progress })
  },
)
