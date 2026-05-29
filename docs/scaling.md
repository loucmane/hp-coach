# Scaling — how HP-Coach holds up as the user base grows

Written 2026-05-29, when the product is one dogfood user with a stated
plan of **~200 users near-term and many more later**. This doc records
what's already built for scale, what the real ceilings are, and the
concrete **triggers** for the work we deliberately deferred — so future-us
acts on signal, not guesswork.

## The shape of the system

- **Frontend:** Vite + React SPA on Cloudflare Pages.
- **API:** Hono on Cloudflare Workers — stateless, edge-distributed,
  scales horizontally for free.
- **Data:** Cloudflare D1 (managed SQLite at the edge), one database,
  via Drizzle. **Every per-user table carries a `user_id` FK and every
  query is scoped `WHERE user_id = …`** — so the system is multi-tenant
  *by construction*. Adding users adds rows, not contention.

The load characteristics are gentle: a study app has low concurrency
(people study ~20 min), writes are bursty-low (~1 answered question per
10–30 s per active user), and reads are per-user.

## What's already built for scale (done)

| Concern | Mitigation | PR |
|---|---|---|
| Multi-tenant correctness / authz | `user_id` scoping on every query (forged ids → 404, not another user's data) | pre-existing |
| Multi-device write race | `POST /sessions` runs end-prior + insert in one `db.batch()` transaction; partial unique index `(user_id, kind) WHERE ended_at IS NULL` is the backstop | #123 |
| Per-user read perf as rows grow | Covering indexes: `attempts(user_id, created_at)` + `(session_id)`, `mistakes(user_id, status)` + `(user_id, question_id)`, `sessions(user_id, kind)` — stats reads are `SEARCH … USING INDEX`, not full scans | #124 |
| All-time stats scanning | `users.attemptsTotal` / `drillsTotal` lifetime counters, incremented in the write transaction → O(1) reads | #125 |
| Unbounded `attempts` storage | Daily retention cron prunes attempts + ended sessions older than `RETENTION_DAYS` (120); lifetime totals live on the counters, so pruning changes nothing the user sees | #125 |
| Cross-device resume | sessions hold the ordered `plan` + `device`; `/sessions/active` returns the active set; the SPA adopts on resume | #119/#120/#122 |

Migrations `0003`–`0005` cover the schema for all of the above.

## Rough capacity (why the above is enough for the near-term)

Assume a heavy user ≈ 30 answered questions/week.

- **Reads:** indexed and per-user — sub-millisecond at any realistic size.
- **Writes:** ~a few writes/second even with hundreds of users active at
  once. D1's single primary handles that comfortably.
- **Storage:** ~100 bytes/attempt. With 120-day retention the table is
  bounded to roughly *active-users × 90-ish days* of rows, regardless of
  how long the product has run. At 200 users that's well under a GB.

**Verdict: the current design is a genuinely scalable solution from 200
into the low thousands of users, with headroom.**

## The next ceiling — DEFERRED on purpose

D1 has two hard limits we don't hit yet but eventually would:

1. **Single-writer throughput.** D1 serializes writes on one primary.
   At a large *concurrent* write volume this bottlenecks.
2. **10 GB per database.** Even with retention, enough simultaneous
   active users push storage up.

We did **not** build for these, because the right fix depends on real
load patterns we don't have, and building blind risks the wrong design +
operational complexity for zero current benefit (premature).

### Triggers — act when ONE of these is true

- D1 database size crosses **~5 GB** (half the cap) — check via the
  Cloudflare dashboard / `wrangler d1 info`.
- Sustained **>~50 writes/sec** to D1, or write latency (p95) climbs.
- **Daily-active users cross ~5–10k.**
- `/api/me/stats` p95 latency degrades despite the indexes.

### Mitigations, cheapest-first (pick by the signal)

1. **Enable D1 read replication** (config / Sessions API). Cheapest lever
   — offloads the read side globally. Do this first if reads are the
   pressure.
2. **Tighten retention** (lower `RETENTION_DAYS`) and/or **rollup**: write
   per-(section, layer1) aggregates into the existing `mastery` table on a
   cron, then prune harder. Buys storage without losing analytics.
3. **Offload the hot append** — move `attempts` writes to **Cloudflare
   Analytics Engine** (or a queue + batch). Removes the biggest write +
   storage source from D1 entirely; the relational tables stay small.
4. **Shard D1 by user** — last resort; real operational complexity
   (routing, cross-shard reporting). Only if 1–3 don't suffice.

Realtime cross-device (instant vs. the current ≤30 s focus-refetch) is a
separate axis — needs WebSockets/SSE via Durable Objects, and is a UX
choice, not a load fix. Not planned.

## Deploy note

Worker code + migrations `0003`–`0005` are applied to **local + staging**.
Production needs, when shipping to real users:

```
cd worker
pnpm db:apply:prod      # migrations 0003–0005 (additive; 0003/0005 self-backfill)
pnpm deploy             # worker code incl. the retention Cron Trigger
```

Migration discipline (per CLAUDE.md): generate → review SQL in PR → apply
staging → smoke → apply prod. Never hand-edit an applied migration.

## Out of scope for scale, but the real gate for "many more users"

Onboarding users beyond the dogfood phase is blocked on the **unresolved
copyright question** (PRD §9.2): HP material is UHR-copyrighted, allakando
publishes with permission, and whether a third party may run a commercial
service on it is open. Resolve that before investing further in scale —
infra for users we can't legally serve is premature.
