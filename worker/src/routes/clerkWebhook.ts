// POST /api/webhooks/clerk — Clerk → Worker sync webhook.
//
// This route is UNAUTHENTICATED by session on purpose: Clerk's servers
// call it directly, there is no Clerk JWT to present. The AUTH IS THE
// SIGNATURE — every request carries a Svix HMAC signature over the exact
// raw body, and we reject anything that doesn't verify. It is mounted
// OUTSIDE the `authed` sub-app (like /api/dev/login), so it never runs
// through requireAuth or the rateLimit middleware — Clerk's delivery must
// not be throttled against a per-user bucket it has no user for.
//
// Verification (manual Svix scheme — NO svix npm dependency):
//   signed_content = `${svix-id}.${svix-timestamp}.${rawBody}`
//   key            = base64-decode(secret after the `whsec_` prefix)
//   expected       = base64( HMAC-SHA256(key, signed_content) )
//   accept iff `expected` constant-time-equals any space-separated
//   `v1,<sig>` candidate in the `svix-signature` header.
// The raw body is read BEFORE any JSON parsing — the HMAC is over the
// exact bytes Clerk signed, so a re-serialized body would never match.
//
// Timestamp tolerance is ±5 minutes; stale/future deliveries outside the
// window are rejected (replay-window bound).
//
// Replay dedupe: the svix-id is recorded in KV (RATE_LIMIT namespace) with
// a 10-minute TTL (≥ the tolerance window). A duplicate delivery of the
// same svix-id is acked 200 without reprocessing — webhook handling is
// idempotent.
//
// Failure mapping (Svix retries on 5xx only):
//   - bad/missing signature or headers, stale timestamp → 4xx (401/400),
//     so a forged or malformed delivery does NOT retry forever.
//   - unexpected server error mid-processing → propagates as 5xx so a
//     transient D1 hiccup DOES get retried.
//   - unknown event type → 200 ack, logged, ignored.
//
// No secrets and no signatures are ever logged; error bodies carry no
// oracle detail (a generic "verification failed", never which check).
//
// OWNER SETUP (deferred — the secret is set later, per environment):
//   1. Clerk dashboard → Webhooks → add endpoint
//      `https://<worker-host>/api/webhooks/clerk`, subscribe to
//      `user.created` and `user.deleted` (staging first, then prod).
//   2. `wrangler secret put CLERK_WEBHOOK_SECRET --env staging` (and
//      `--env production`) with the `whsec_…` signing secret Clerk shows
//      for that endpoint. Local dev reads it from worker/.dev.vars.

import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { getDb } from '../db/client'
import {
  attempts,
  dailyPlans,
  frameworkProgress,
  lessonProgress,
  lessonReads,
  mastery,
  mistakes,
  mockResults,
  sessions,
  srsState,
  users,
} from '../db/schema'
import { ensureUserRow } from '../lib/ensureUser'
import type { Env, Vars } from '../types'

// ±5 minutes, in seconds — the Svix-standard tolerance window.
const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60
// KV TTL for the replay-dedupe key. 10 min ≥ the tolerance window, so a
// duplicate can never outlive its own signature validity window.
const DEDUPE_TTL_SECONDS = 10 * 60
const DEDUPE_PREFIX = 'webhook:svix:'

type VerifyFailure = { ok: false; status: 400 | 401 }
type VerifyOk = { ok: true }

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// Constant-time string comparison. Equal-length strings are compared with
// an XOR accumulator so the loop can't early-exit on the first mismatch
// (which would leak a timing oracle). A length mismatch short-circuits —
// base64 HMAC-SHA256 outputs are fixed-length, so this leaks nothing
// useful, matching Svix's own reference implementation.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

async function hmacBase64(keyBytes: Uint8Array, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return bytesToBase64(new Uint8Array(sig))
}

// Verify the Svix signature + timestamp. Returns a typed pass/fail so the
// handler maps failures to a 4xx WITHOUT branching on which check failed
// in the response body (no oracle detail).
async function verifySignature(params: {
  secret: string
  svixId: string
  svixTimestamp: string
  svixSignature: string
  rawBody: string
  nowSeconds: number
}): Promise<VerifyOk | VerifyFailure> {
  const { secret, svixId, svixTimestamp, svixSignature, rawBody, nowSeconds } = params

  if (!svixId || !svixTimestamp || !svixSignature) return { ok: false, status: 400 }

  // Timestamp must be a finite unix-seconds value inside the tolerance.
  const ts = Number(svixTimestamp)
  if (!Number.isFinite(ts)) return { ok: false, status: 400 }
  if (Math.abs(nowSeconds - ts) > TIMESTAMP_TOLERANCE_SECONDS) return { ok: false, status: 401 }

  // Secret is `whsec_<base64-key>`; the HMAC key is the decoded tail.
  const rawSecret = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret
  let keyBytes: Uint8Array
  try {
    keyBytes = base64ToBytes(rawSecret)
  } catch {
    // Malformed secret is a server-config problem, not a client one —
    // surface as a 401 anyway so we never leak "your secret is broken".
    return { ok: false, status: 401 }
  }

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`
  const expected = await hmacBase64(keyBytes, signedContent)

  // The header is a space-separated list of `version,signature` pairs.
  // Compare against every v1 candidate; accept on the first constant-time
  // match. (Iterating all candidates isn't a timing concern — the count is
  // attacker-independent and tiny.)
  for (const part of svixSignature.split(' ')) {
    const comma = part.indexOf(',')
    if (comma === -1) continue
    const version = part.slice(0, comma)
    const sig = part.slice(comma + 1)
    if (version !== 'v1') continue
    if (timingSafeEqual(expected, sig)) return { ok: true }
  }
  return { ok: false, status: 401 }
}

// Delete every row this user owns across ALL user-scoped tables, then the
// user row itself, in a single db.batch (the strongest atomicity D1
// offers — no interactive transactions). Children are deleted before the
// parent so the wipe holds even where FK cascade is not enforced. Absent
// user → no-op (idempotent: a redelivered user.deleted after the row is
// already gone is harmless).
async function cascadeDeleteUser(db: ReturnType<typeof getDb>, clerkUserId: string): Promise<void> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1)
  if (!row) return
  const uid = row.id
  await db.batch([
    db.delete(mockResults).where(eq(mockResults.userId, uid)),
    db.delete(dailyPlans).where(eq(dailyPlans.userId, uid)),
    db.delete(lessonReads).where(eq(lessonReads.userId, uid)),
    db.delete(lessonProgress).where(eq(lessonProgress.userId, uid)),
    db.delete(frameworkProgress).where(eq(frameworkProgress.userId, uid)),
    db.delete(mastery).where(eq(mastery.userId, uid)),
    db.delete(srsState).where(eq(srsState.userId, uid)),
    db.delete(mistakes).where(eq(mistakes.userId, uid)),
    db.delete(attempts).where(eq(attempts.userId, uid)),
    db.delete(sessions).where(eq(sessions.userId, uid)),
    db.delete(users).where(eq(users.id, uid)),
  ])
}

export const clerkWebhookRoute = new Hono<{ Bindings: Env; Variables: Vars }>().post(
  '/',
  async (c) => {
    // RAW BODY FIRST — the HMAC is over these exact bytes. Never parse
    // before reading + verifying.
    const rawBody = await c.req.text()

    const secret = c.env.CLERK_WEBHOOK_SECRET
    if (!secret) {
      // Unconfigured worker. This is a server-side setup gap (owner has
      // not run `wrangler secret put CLERK_WEBHOOK_SECRET` yet) — surface
      // 500 so Clerk retries once the secret lands, and log without
      // leaking anything.
      console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not configured')
      return c.json({ error: { code: 'not_configured', message: 'Webhook not configured' } }, 500)
    }

    const svixId = c.req.header('svix-id') ?? ''
    const svixTimestamp = c.req.header('svix-timestamp') ?? ''
    const svixSignature = c.req.header('svix-signature') ?? ''

    const verdict = await verifySignature({
      secret,
      svixId,
      svixTimestamp,
      svixSignature,
      rawBody,
      nowSeconds: Math.floor(Date.now() / 1000),
    })
    if (!verdict.ok) {
      // Single generic failure message — no oracle detail on WHICH check
      // failed, no echo of the signature or body.
      console.warn('[clerk-webhook] signature verification failed')
      return c.json(
        { error: { code: 'invalid_signature', message: 'Verification failed' } },
        verdict.status,
      )
    }

    // Replay dedupe — a duplicate delivery of the same svix-id is acked
    // without reprocessing. Best-effort: a KV read error falls through to
    // processing (fail-open) rather than dropping a real event.
    const dedupeKey = `${DEDUPE_PREFIX}${svixId}`
    try {
      if (await c.env.RATE_LIMIT.get(dedupeKey)) {
        return c.json({ ok: true as const, deduped: true as const })
      }
    } catch {
      // Fall through: better to risk a rare double-process (the handlers
      // are idempotent) than to silently drop a first-time event.
    }

    // Body is verified; NOW it is safe to parse.
    let event: { type?: unknown; data?: { id?: unknown } }
    try {
      event = JSON.parse(rawBody)
    } catch {
      return c.json({ error: { code: 'bad_request', message: 'Invalid JSON body' } }, 400)
    }

    const type = typeof event.type === 'string' ? event.type : ''
    const clerkUserId = typeof event.data?.id === 'string' ? event.data.id : ''
    const db = getDb(c.env.DB)

    switch (type) {
      case 'user.created': {
        if (!clerkUserId) {
          return c.json({ error: { code: 'bad_request', message: 'Missing user id' } }, 400)
        }
        await ensureUserRow(db, clerkUserId)
        break
      }
      case 'user.deleted': {
        if (!clerkUserId) {
          return c.json({ error: { code: 'bad_request', message: 'Missing user id' } }, 400)
        }
        await cascadeDeleteUser(db, clerkUserId)
        break
      }
      default:
        // Unknown / unsubscribed event type — ack so Clerk stops
        // retrying, log the TYPE only (never the payload).
        console.log(`[clerk-webhook] ignoring unhandled event type: ${type || '<none>'}`)
        break
    }

    // Record the svix-id AFTER successful processing so a redelivery is a
    // no-op. TTL ≥ tolerance window.
    try {
      await c.env.RATE_LIMIT.put(dedupeKey, '1', { expirationTtl: DEDUPE_TTL_SECONDS })
    } catch {
      // Best-effort: a failed dedupe write only risks a future idempotent
      // reprocess, never data loss.
    }

    return c.json({ ok: true as const, type })
  },
)
