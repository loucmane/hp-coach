// Learned item-difficulty layer (PL-L.1) — an Elo-style rating fit
// incrementally from the `attempts` table.
//
// The app used to treat every question as equally hard. This routine folds
// every answered attempt, in chronological order, into two poles:
//
//   · item_stats.difficulty   — how hard a question is (global, per qid)
//   · user_ability.ability    — how strong a user is at a section
//
// For each attempt, with the current difficulty d and ability a:
//
//   base     = 1 / (1 + 10^((d − a) / 400))        // raw logistic win prob
//   expected = g + (1 − g) * base                  // GUESS-FLOORED
//   actual   = correct ? 1 : 0
//   a += K_user * (actual − expected)              // user climbs on wins
//   d += K_item * (expected − actual)              // item climbs on upsets
//
// Guess floor (g = GUESS_FLOOR = 0.2): HP questions are 4–5-option MCQ, so
// even a hopeless solver lands ~20–25% by luck. Raw Elo would read those
// lucky hits as evidence the item is easy and drift its difficulty down.
// Flooring the expected score at g absorbs the noise: a weak solver beating
// a hard item now moves both ratings LESS than raw Elo, and a miss on an
// easy item bites harder. We use a flat g = 0.2 rather than 1/optionCount
// because option counts live in the client-side bank — the worker can't see
// them (same reason framework tags stay client-side; see the granularity
// notes on the schema tables).
//
// K decays with how many attempts have already moved THAT entity: 32 for
// the first 30, then 16 — early observations move a fresh rating fast, then
// it settles. The user and item sides each carry their own attempt count,
// so a veteran user meeting a fresh item uses K_user=16, K_item=32. Both
// poles clamp to ±800 so a pathological streak can't run a rating away.
//
// Session-kind weighting (joined from sessions.kind):
//   · Only drill / adaptive_review / mock / mock_diagnostic attempts count
//     (FITTED_KINDS). Any lesson/other-kind attempt is skipped — it isn't
//     graded practice. (mock/mock_diagnostic ARE the most exam-faithful
//     signal, so they're kept at full weight; a future refinement could
//     weight difficulty by kind — noted, not done.)
//   · adaptive_review attempts are RE-exposures of items the user already
//     missed, not independent evidence about the item. So the ITEM's
//     difficulty update is damped to K/4 (REPLAY_ITEM_K_FACTOR), while the
//     USER's ability update stays at full K — their recovery IS real signal.
//
// Provenance (P5 infold PR 3, docs/p5-infold-design.md Amendment 1 E) — each
// attempt carries the source the server classified on insert
// (lib/provenance.ts):
//   · authentic — fitted exactly as above.
//   · synthetic — a P5 answer. It moves the user's section ability, but a P5
//     item has no calibrated difficulty (no UHR normering, no real-HP
//     evidence), so the INTERIM, UNCALIBRATED method plays the user side
//     against the section's ANCHOR: the mean difficulty of the section's
//     authentic items with ≥1 fitted attempt (0, the scale's neutral prior,
//     while there are none). The item side still learns the P5 item's own
//     difficulty against the user's ability — the evidence a later
//     calibration starts from — but keeps it apart: the row is stored with
//     source 'synthetic' and never enters an anchor. user_ability counts the
//     synthetic answers it absorbed (synthetic_attempts), so an ability that
//     rests on any is identifiable as uncalibrated, and the attempt rows keep
//     their source and item revision, so a recalibration can replay them.
//   · unknown — fails closed: consumed (the watermark passes it), folded into
//     nothing. So this fit never writes an `unknown` item_stats row. The fit
//     from before provenance folded every graded answer. Where it folded one
//     that is now unknown, its item row is still `unknown` after the
//     backfill. The backfill migration (drizzle/0013) then deletes every
//     user_ability and item_stats row and rewinds the watermark to 0, and the
//     next run refits every retained attempt under these rules.
// The anchor is read from the current ratings (summed in qid order) and
// recomputed whenever an authentic item of its section moves; it is never
// carried between runs, so a history split across runs still lands on
// exactly the ratings of one run.
//
// Incremental + idempotent: a one-row `fit_state` watermark records the
// last processed attempt id. Each run replays only `attempts.id > watermark`
// (autoincrement id == insertion order == chronological), in id order, then
// advances the watermark. A second run finds nothing new and is a no-op —
// so nightly cron re-runs and manual POST /api/fit/run re-triggers converge
// on identical ratings.
//
// Memory: attempts are read in pages of ATTEMPT_PAGE so a 10k-user history
// never lands in memory at once. The per-entity caches are bounded by the
// number of distinct items (~4k) and (user, section) pairs, not by the
// attempt count, so they stay small even as history grows.

import { and, asc, eq, gt, gte } from 'drizzle-orm'

import type { Db } from '../db/client'
import { attempts, fitState, itemStats, sessions, userAbility } from '../db/schema'
import { extractSection } from './section'

// Elo divisor — a 400-point gap ≈ 10:1 odds, the classic scale.
export const ELO_SCALE = 400
// Rating clamp band. Both poles are pinned to [−CLAMP, +CLAMP].
export const CLAMP = 800
// K-factor schedule: fast while an entity is fresh, slower once settled.
export const K_EARLY = 32
export const K_SETTLED = 16
export const K_DECAY_AFTER = 30
// MCQ guess floor — the win probability even a hopeless solver clears by
// luck on a 4–5-option question. Flooring `expected` at this absorbs lucky
// hits so hard items don't drift easy. Flat 0.2 (~1/5) because per-question
// option counts live client-side; the worker can't read them.
export const GUESS_FLOOR = 0.2
// adaptive_review re-exposures barely inform the ITEM (the user already
// missed it); damp the item-side update to a quarter. The user side stays
// full — their recovery is genuine signal.
export const REPLAY_ITEM_K_FACTOR = 0.25
// Session kinds whose attempts count toward the fit. lesson/other kinds are
// not graded practice and are skipped. mock/mock_diagnostic are the most
// exam-faithful signal and are kept at full weight (a future refinement may
// weight difficulty by kind).
export const FITTED_KINDS: ReadonlySet<string> = new Set([
  'drill',
  'adaptive_review',
  'mock',
  'mock_diagnostic',
])
// Session kind whose attempts are re-exposures (replay) — damped item side.
export const REPLAY_KIND = 'adaptive_review'
// Attempts pulled from D1 per page — bounds peak memory on large histories.
export const ATTEMPT_PAGE = 500
// The single fit_state row lives at this fixed id.
const FIT_STATE_ID = 1

/** Raw logistic win probability for a solver of `ability` facing an item of
 *  `difficulty`, BEFORE the guess floor. Symmetric: swapping the two gives
 *  1 − p, and an equal matchup is exactly 0.5. */
export function expectedScore(difficulty: number, ability: number): number {
  return 1 / (1 + 10 ** ((difficulty - ability) / ELO_SCALE))
}

/** Guess-floored expected score — the value the fit actually updates
 *  against. expected = g + (1 − g) * raw, so it ranges in [g, 1) instead of
 *  (0, 1). A correct answer therefore always earns less surprise than raw
 *  Elo (some of it could be luck), and a miss carries more. */
export function flooredExpectedScore(difficulty: number, ability: number): number {
  return GUESS_FLOOR + (1 - GUESS_FLOOR) * expectedScore(difficulty, ability)
}

/** K-factor for an entity that has already absorbed `priorAttempts`
 *  updates: high while it is still finding its level, lower once settled. */
export function kFactor(priorAttempts: number): number {
  return priorAttempts < K_DECAY_AFTER ? K_EARLY : K_SETTLED
}

/** Clamp a rating into the sane ±CLAMP band. */
export function clampRating(value: number): number {
  return Math.max(-CLAMP, Math.min(CLAMP, value))
}

type EntityState = { rating: number; attempts: number; dirty: boolean }
// An item knows its pole: authentic items form the anchor, synthetic items
// are rated apart (see the provenance notes above).
type ItemState = EntityState & { source: 'authentic' | 'synthetic' }
// An ability knows how many of its fitted answers were synthetic.
type AbilityState = EntityState & { syntheticAttempts: number }

export type FitResult = {
  /** How many attempts this run folded in (0 on an idempotent no-op). */
  processed: number
  /** The watermark after the run — the id of the newest processed attempt. */
  watermark: number
}

/**
 * Fold every attempt newer than the stored watermark into item_stats /
 * user_ability. Streams the attempts table in pages; idempotent across
 * re-runs via the watermark.
 */
export async function runFit(db: Db): Promise<FitResult> {
  // Read (or lazily seed) the watermark row.
  const [state] = await db.select().from(fitState).where(eq(fitState.id, FIT_STATE_ID)).limit(1)
  let watermark = state?.lastAttemptId ?? 0

  // Per-entity caches, seeded lazily from D1 and carried across pages. Keyed
  // by qid (items) and `${userId} ${section}` (abilities). Bounded by
  // the number of distinct entities, not by attempt volume.
  const items = new Map<string, ItemState>()
  const abilities = new Map<string, AbilityState>()

  const abilityKey = (userId: number, section: string) => `${userId} ${section}`

  async function loadItem(qid: string, source: ItemState['source']): Promise<ItemState> {
    const cached = items.get(qid)
    if (cached) return cached
    const [row] = await db.select().from(itemStats).where(eq(itemStats.questionId, qid)).limit(1)
    // The pole comes from the attempt's stored source, so a row the backfill
    // has not reached yet is healed to it on the next flush.
    const state: ItemState = {
      rating: row?.difficulty ?? 0,
      attempts: row?.attempts ?? 0,
      dirty: false,
      source,
    }
    items.set(qid, state)
    return state
  }

  async function loadAbility(userId: number, section: string): Promise<AbilityState> {
    const key = abilityKey(userId, section)
    const cached = abilities.get(key)
    if (cached) return cached
    const [row] = await db
      .select()
      .from(userAbility)
      .where(and(eq(userAbility.userId, userId), eq(userAbility.section, section)))
      .limit(1)
    const state: AbilityState = {
      rating: row?.ability ?? 0,
      attempts: row?.attempts ?? 0,
      dirty: false,
      syntheticAttempts: row?.syntheticAttempts ?? 0,
    }
    abilities.set(key, state)
    return state
  }

  // The synthetic anchor (see the provenance notes above). The pool holds,
  // per section, every authentic item with ≥1 fitted attempt, as the SAME
  // state objects the item cache holds, so it always reads current ratings.
  // It is loaded on the first synthetic attempt a run meets, so an
  // authentic-only run never reads it; anchors are cached per section and
  // dropped whenever an authentic item of that section moves.
  let anchorPool: Map<string, Map<string, ItemState>> | null = null
  const anchors = new Map<string, number>()

  function addToPool(
    pool: Map<string, Map<string, ItemState>>,
    section: string,
    qid: string,
    state: ItemState,
  ): void {
    let members = pool.get(section)
    if (!members) {
      members = new Map()
      pool.set(section, members)
    }
    members.set(qid, state)
  }

  async function loadAnchorPool(): Promise<Map<string, Map<string, ItemState>>> {
    if (anchorPool) return anchorPool
    const pool = new Map<string, Map<string, ItemState>>()
    const rows = await db
      .select()
      .from(itemStats)
      .where(and(eq(itemStats.source, 'authentic'), gte(itemStats.attempts, 1)))
    for (const row of rows) {
      const section = extractSection(row.questionId)
      if (!section) continue
      let state = items.get(row.questionId)
      if (!state) {
        state = {
          rating: row.difficulty,
          attempts: row.attempts,
          dirty: false,
          source: 'authentic',
        }
        items.set(row.questionId, state)
      }
      addToPool(pool, section, row.questionId, state)
    }
    // Authentic items this run has rated that no flush has persisted yet.
    for (const [qid, state] of items) {
      if (state.source !== 'authentic' || state.attempts < 1) continue
      const section = extractSection(qid)
      if (section) addToPool(pool, section, qid, state)
    }
    anchorPool = pool
    return pool
  }

  /** The difficulty a synthetic item of `section` is played at by the user
   *  side: the mean of the section's rated authentic items, 0 without any. */
  async function syntheticAnchor(section: string): Promise<number> {
    const cached = anchors.get(section)
    if (cached !== undefined) return cached
    const members = (await loadAnchorPool()).get(section)
    let anchor = 0
    if (members && members.size > 0) {
      let sum = 0
      for (const qid of [...members.keys()].sort()) sum += (members.get(qid) as ItemState).rating
      anchor = sum / members.size
    }
    anchors.set(section, anchor)
    return anchor
  }

  /** An authentic item moved: it joins (or stays in) its section's pool and
   *  the section's anchor is recomputed when next needed. */
  function authenticItemMoved(section: string, qid: string, state: ItemState): void {
    if (!anchorPool) return // not loaded yet: it reads this item when it loads
    addToPool(anchorPool, section, qid, state)
    anchors.delete(section)
  }

  let processed = 0

  // Page through attempts strictly after the watermark, in id (chronological)
  // order. Empty page → done.
  for (;;) {
    // Join sessions so we can read the attempt's session kind (context +
    // replay weighting). attempts.sessionId is a NOT NULL FK, so an inner
    // join never drops a real attempt.
    const page = await db
      .select({
        id: attempts.id,
        userId: attempts.userId,
        questionId: attempts.questionId,
        correct: attempts.correct,
        source: attempts.source,
        kind: sessions.kind,
      })
      .from(attempts)
      .innerJoin(sessions, eq(attempts.sessionId, sessions.id))
      .where(gt(attempts.id, watermark))
      .orderBy(asc(attempts.id))
      .limit(ATTEMPT_PAGE)

    if (page.length === 0) break

    for (const row of page) {
      // Advance the watermark for EVERY row we consume — even ones we skip
      // (unknown provenance, unresolvable section, null correctness,
      // non-graded kind) — so they're never reconsidered on the next run.
      watermark = row.id
      // Unknown provenance fails closed: no evidence about any item or user.
      const source = row.source
      if (source !== 'authentic' && source !== 'synthetic') continue
      // `correct` is nullable in the schema; an unscored attempt carries no
      // signal, so skip it (watermark still advanced above).
      if (row.correct == null) continue
      // Only graded-practice kinds inform the fit; lesson/other kinds are
      // not evidence about item difficulty or user ability.
      if (!FITTED_KINDS.has(row.kind)) continue
      const section = extractSection(row.questionId)
      if (!section) continue

      // A synthetic answer's user side plays the section's authentic anchor.
      const anchor = source === 'synthetic' ? await syntheticAnchor(section) : null
      const item = await loadItem(row.questionId, source)
      const ability = await loadAbility(row.userId, section)

      // The item side always learns this item's own difficulty; the user side
      // plays an authentic item at that difficulty and a synthetic one at the
      // anchor (uncalibrated).
      const expected = flooredExpectedScore(item.rating, ability.rating)
      const expectedUser = anchor === null ? expected : flooredExpectedScore(anchor, ability.rating)
      const actual = row.correct ? 1 : 0
      const isReplay = row.kind === REPLAY_KIND
      const kUser = kFactor(ability.attempts)
      // Replay re-exposures barely inform the item → damp only the item side.
      const kItem = kFactor(item.attempts) * (isReplay ? REPLAY_ITEM_K_FACTOR : 1)

      ability.rating = clampRating(ability.rating + kUser * (actual - expectedUser))
      item.rating = clampRating(item.rating + kItem * (expected - actual))
      ability.attempts += 1
      item.attempts += 1
      if (source === 'synthetic') ability.syntheticAttempts += 1
      ability.dirty = true
      item.dirty = true
      if (source === 'authentic') authenticItemMoved(section, row.questionId, item)

      processed += 1
    }

    // Flush every entity this run has touched so far, then advance the
    // persisted watermark. Flushing the full touched set (not just this
    // page's) keeps the DB consistent with the caches on each checkpoint;
    // the sets stay small (bounded by distinct entities).
    await flush(db, items, abilities, watermark)

    if (page.length < ATTEMPT_PAGE) break
  }

  // Nothing new: still make sure a fit_state row exists so the watermark is
  // durable and observable.
  if (processed === 0) {
    await persistWatermark(db, watermark)
  }

  return { processed, watermark }
}

async function flush(
  db: Db,
  items: Map<string, ItemState>,
  abilities: Map<string, AbilityState>,
  watermark: number,
): Promise<void> {
  const now = new Date()
  for (const [qid, state] of items) {
    if (!state.dirty) continue
    await db
      .insert(itemStats)
      .values({
        questionId: qid,
        difficulty: state.rating,
        attempts: state.attempts,
        updatedAt: now,
        source: state.source,
      })
      .onConflictDoUpdate({
        target: itemStats.questionId,
        set: {
          difficulty: state.rating,
          attempts: state.attempts,
          updatedAt: now,
          source: state.source,
        },
      })
    state.dirty = false
  }
  for (const [key, state] of abilities) {
    if (!state.dirty) continue
    const sep = key.indexOf(' ')
    const userId = Number(key.slice(0, sep))
    const section = key.slice(sep + 1)
    await db
      .insert(userAbility)
      .values({
        userId,
        section,
        ability: state.rating,
        attempts: state.attempts,
        updatedAt: now,
        syntheticAttempts: state.syntheticAttempts,
      })
      .onConflictDoUpdate({
        target: [userAbility.userId, userAbility.section],
        set: {
          ability: state.rating,
          attempts: state.attempts,
          updatedAt: now,
          syntheticAttempts: state.syntheticAttempts,
        },
      })
    state.dirty = false
  }
  await persistWatermark(db, watermark)
}

async function persistWatermark(db: Db, watermark: number): Promise<void> {
  await db
    .insert(fitState)
    .values({ id: FIT_STATE_ID, lastAttemptId: watermark, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: fitState.id,
      set: { lastAttemptId: watermark, updatedAt: new Date() },
    })
}
