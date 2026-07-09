import type { ActiveSession } from '@/api/hooks/useSessions'

/**
 * Decide whether `begin()` may RESUME (adopt) an existing active session of
 * this kind instead of starting a fresh pick.
 *
 * The load-bearing rule is the section guard: a session is adoptable only when
 * its `sections` matches the section the user is asking for. Without it, a
 * leftover active drill in one section is hijacked when the user opens a drill
 * for another — the reported bug where tapping the XYZ daily-plan item resumed
 * a stale ORD session and loaded an ORD question (host-…-verb1-ORD-008) under
 * `?section=XYZ`. Cross-section ⇒ fall through to a fresh start (the server's
 * single-active-per-kind ends the stale row).
 *
 * Same-section resume — pausing a drill on one device and reopening it on
 * another via `/drill?section=X` — still adopts, so cross-device resume is
 * preserved. The stable-section surfaces (repetition `"ORD"`, diagnostik
 * `"diagnostic"`) always match their own session's `sections`, so they are
 * unaffected.
 *
 * `resolvePlan` capability is intentionally NOT checked here — that is a
 * surface concern the caller combines in (diagnostik omits it to opt out of
 * resume entirely).
 *
 * `locallyEnded` closes the SAME-INSTANCE rapid-replay race: `onNext` ends a
 * finished session with a NON-awaited PATCH, and its active-sessions cache
 * eviction only lands on the response. But "öva igen" calls `begin()`
 * synchronously, so `activeOfKind.data` still holds the just-ended session —
 * without this guard `begin` re-adopts the corpse (seeking to its last,
 * already-answered question) instead of picking a fresh batch. The caller
 * passes true when it has already sent `end:true` for this session id.
 *
 * `endedAt` closes the CROSS-MOUNT variant of the same race (task #166,
 * Symptom B). `locallyEnded` is derived from a ref that only remembers ends
 * THIS component instance issued; finishing a drill, navigating away, then
 * re-drilling the SAME section remounts SessionPlayer with an empty ref, so
 * `locallyEnded` is false again. If the just-finished session is still sitting
 * in the active-sessions cache (its `end:true` PATCH's onSuccess eviction
 * raced the refetch, or a stale write-through kept the row around), the
 * section guard passes and `begin()` would adopt the corpse and land the user
 * on its result screen. A row that carries `endedAt` is finished by
 * definition and is NEVER adoptable, regardless of the instance ref — the
 * server's `/active` query already filters these out, so this only bites
 * inside the client cache-eviction window, which is exactly the race.
 */
export function canAdoptActiveSession(
  existing: ActiveSession | null | undefined,
  requestedSections: string | undefined,
  staleResume: boolean,
  locallyEnded = false,
): existing is ActiveSession & { plan: string[] } {
  if (staleResume) return false
  if (locallyEnded) return false
  if (!existing?.plan || existing.plan.length === 0) return false
  // A finished row is a corpse — resuming it drops the user on its result
  // screen instead of a fresh batch. Never adopt one, even cross-mount.
  if (existing.endedAt != null) return false
  return existing.sections === requestedSections
}
