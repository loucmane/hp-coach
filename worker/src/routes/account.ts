// DELETE /api/account — permanent, irreversible account deletion.
//
// CLERK-FIRST ORDERING. The Clerk identity is deleted BEFORE any local
// data is touched. This is the safety-critical invariant: a user must
// never end up erased locally but still alive in Clerk (a ghost login
// with no data). So:
//
//   1. Call Clerk's Backend API to delete the user.
//   2. Only on Clerk success (2xx) — OR a 404, meaning the user is
//      already gone, so local cleanup should still proceed — do we
//      cascade-delete every D1 row the user owns.
//   3. Any other Clerk outcome (5xx, network failure, unexpected status)
//      → 502, and NOTHING is deleted locally. The client keeps its data
//      and can retry.
//
// No grace period, no soft-delete, no email confirmation — the product
// decision is a direct, immediate erase (the typed-"radera" confirmation
// and the export-first prompt live on the client, in /konto).

import { Hono } from 'hono'

import { getDb } from '../db/client'
import { cascadeDeleteUser } from '../lib/cascade'
import type { Env, Vars } from '../types'

const CLERK_API_BASE = 'https://api.clerk.com/v1'

export const accountRoute = new Hono<{ Bindings: Env; Variables: Vars }>().delete(
  '/',
  async (c) => {
    const clerkUserId = c.var.userId

    // Step 1: delete the Clerk identity first. Treat 2xx as success; treat
    // 404 as "already gone" and fall through to local cleanup (idempotent).
    let clerkGone = false
    try {
      const res = await fetch(`${CLERK_API_BASE}/users/${encodeURIComponent(clerkUserId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${c.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      clerkGone = res.ok || res.status === 404
    } catch {
      clerkGone = false
    }

    if (!clerkGone) {
      // Clerk deletion failed → local data stays intact. The user is still
      // fully alive; nothing was erased.
      return c.json(
        {
          error: {
            code: 'clerk_delete_failed',
            message: 'Kunde inte radera kontot hos inloggningsleverantören. Inget raderades.',
          },
        },
        502,
      )
    }

    // Step 2: Clerk is gone (or was already gone) → erase every local row.
    const db = getDb(c.env.DB)
    const { deleted } = await cascadeDeleteUser(db, clerkUserId)

    return c.json({ ok: true as const, deleted })
  },
)
