// Folio numbering — every route is a numbered spread in the
// edition that maps to the user's exam sitting.
//
// Before: the running head read `HP · COACH · LEKTION`. After: every
// page reads `EDITION III · SPREAD 04 · LEKTION`. The chrome counts.
// Spreads are stable per pathname; editions roll with the next
// scheduled sitting (höst-26 = III, vår-27 = IV).
//
// Routes not in the registry (dev surfaces, bake-offs, auth screens)
// fall through to null — Page.tsx skips the spread numbering and
// renders just the residual label, keeping the chrome quiet on
// surfaces that aren't part of the editorial publication.

type Spread = {
  /** Two-digit zero-padded number for the running head. */
  num: number
  /** Display label, uppercase. Appears after `SPREAD {num} ·`. */
  label: string
}

const SPREADS: Record<string, Spread> = {
  '/welcome': { num: 1, label: 'VÄLKOMMEN' },
  '/': { num: 2, label: 'HEM' },
  '/diagnostik': { num: 3, label: 'DIAGNOSTIK' },
  '/lektion': { num: 4, label: 'LEKTION' },
  '/drill': { num: 5, label: 'ÖVNING' },
  '/repetition': { num: 6, label: 'REPETITION' },
  '/progress': { num: 7, label: 'FRAMSTEG' },
  '/coach': { num: 8, label: 'FEEDBACK' },
  '/avancerat': { num: 9, label: 'AVANCERAT' },
}

export function spreadFor(pathname: string): Spread | null {
  // Strip trailing slash for matching, except for the root "/" itself.
  const key = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
  return SPREADS[key] ?? null
}

/** Format a spread number as a two-digit string: 4 → "04". */
export function formatSpreadNum(num: number): string {
  return String(num).padStart(2, '0')
}

/**
 * Edition Roman numeral for the user's target exam sitting. höst-26
 * is the current dogfood target (= III); vår-27 is the follow-up
 * (= IV). When the sitting registry grows we'll bump these — keeping
 * the mapping out-of-band so the UI doesn't have to know exam history.
 */
export function editionFor(sittingId: string | undefined | null): string {
  if (!sittingId) return 'III'
  if (sittingId === 'host-2026') return 'III'
  if (sittingId === 'var-2027') return 'IV'
  // Older sittings backfill — host-25 = II, etc. For unknown IDs we
  // default to III rather than blank so the chrome stays composed.
  return 'III'
}

/**
 * The full folio string for a running head, when both pathname and
 * sitting resolve to a known spread. Returns null if the route isn't
 * in the registry — Page.tsx falls back to the legacy formatting.
 *
 * Output shape: `EDITION III · SPREAD 04 · LEKTION` (no trailing
 * section suffix — Page.tsx appends any residual label from the
 * `runningHead` prop after this string).
 */
export function buildFolioString(
  pathname: string,
  sittingId: string | undefined | null,
): string | null {
  const spread = spreadFor(pathname)
  if (!spread) return null
  const edition = editionFor(sittingId)
  return `EDITION ${edition} · SPREAD ${formatSpreadNum(spread.num)} · ${spread.label}`
}
