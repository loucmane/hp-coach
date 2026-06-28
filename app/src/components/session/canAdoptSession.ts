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
 */
export function canAdoptActiveSession(
  existing: ActiveSession | null | undefined,
  requestedSections: string | undefined,
  staleResume: boolean,
): existing is ActiveSession & { plan: string[] } {
  if (staleResume) return false
  if (!existing?.plan || existing.plan.length === 0) return false
  return existing.sections === requestedSections
}
