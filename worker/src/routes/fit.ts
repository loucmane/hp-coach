// /api/item-stats + /api/fit — the read + trigger surface for the learned
// item-difficulty layer (PL-L.1). The fit MATH lives in lib/fit.ts; this
// file is the HTTP skin.
//
//   GET  /api/item-stats?section=X  → { difficulties: { [qid]: difficulty },
//                                       uncalibrated: qid[] } for that section
//   POST /api/fit/run               → run the fit now (dev/staging convenience)
//
// The per-user ability read lives on /api/me/ability (routes/me.ts) so it
// sits with the rest of the caller's own data.
//
// These feed PL-L.3 (the adaptive drill picker) and Framsteg later — NOT in
// this PR's scope. This PR only lands the fit + its read/trigger endpoints.

import { zValidator } from '@hono/zod-validator'
import { and, gte, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { getDb } from '../db/client'
import { itemStats } from '../db/schema'
import { runFit } from '../lib/fit'
import { ASSESSED_SOURCES } from '../lib/provenance'
import { SECTIONS } from '../lib/section'
import type { Env, Vars } from '../types'

// Cap on how many item difficulties a single read returns. The whole bank
// is ~4320 questions; a per-section slice is at most a few hundred, so 1000
// is comfortable headroom while still bounding a pathological response.
const ITEM_STATS_LIMIT = 1000

const ItemStatsQuery = z
  .object({
    // Section is required — item difficulties are consumed per section by
    // the drill picker. Constrained to the known section codes so a typo
    // returns 400, not a silently empty map.
    section: z.enum(SECTIONS),
  })
  .strict()

export const itemStatsRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // GET /api/item-stats?section=X — fitted difficulty for every question in
  // the section that has absorbed ≥1 attempt. Global (not per-user):
  // difficulty is a property of the item. Shape is a plain object keyed by
  // qid for O(1) client lookup, mirroring /api/me/exposure.
  //
  // Provenance (P5 infold PR 3): authentic and synthetic items are both
  // served; `uncalibrated` lists (sorted) the synthetic ones, whose
  // difficulty is learned from answers but not calibrated against real HP
  // results. A row the backfill marked `unknown` is never served (fail closed).
  .get('/', zValidator('query', ItemStatsQuery), async (c) => {
    const { section } = c.req.valid('query')
    const db = getDb(c.env.DB)
    // questionId format: "var-2026-verb1-ORD-001". Section is the token
    // before the trailing number; LIKE "%-{section}-%" pins it, matching
    // how routes/mistakes.ts filters. `attempts >= 1` excludes any row that
    // somehow exists without a fitted attempt (defensive — the fit only
    // ever writes rows it has moved).
    const rows = await db
      .select({
        questionId: itemStats.questionId,
        difficulty: itemStats.difficulty,
        source: itemStats.source,
      })
      .from(itemStats)
      .where(
        and(
          gte(itemStats.attempts, 1),
          inArray(itemStats.source, ASSESSED_SOURCES),
          sql`${itemStats.questionId} LIKE ${`%-${section}-%`}`,
        ),
      )
      .limit(ITEM_STATS_LIMIT)
    const difficulties: Record<string, number> = {}
    const uncalibrated: string[] = []
    for (const r of rows) {
      difficulties[r.questionId] = r.difficulty
      if (r.source === 'synthetic') uncalibrated.push(r.questionId)
    }
    return c.json({ difficulties, uncalibrated: uncalibrated.sort() })
  })

export const fitRoute = new Hono<{ Bindings: Env; Variables: Vars }>()
  // POST /api/fit/run — run the incremental fit on demand. Auth-gated (any
  // signed-in user may trigger it — a dev/staging convenience so the fit can
  // be exercised without waiting for 03:00). It processes the append-only
  // attempts tail past the watermark, so an ad-hoc run just brings ratings
  // current; it never double-counts. The CRON trigger (see [triggers] in
  // wrangler.toml → the `scheduled` handler in index.ts) is the PRODUCTION
  // path; this endpoint is the manual escape hatch.
  .post('/run', async (c) => {
    const db = getDb(c.env.DB)
    const result = await runFit(db)
    return c.json(result)
  })
