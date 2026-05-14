// Phase A.6V — first-time welcome gate.
//
// localStorage key that records whether the user has clicked through
// the /welcome onboarding picker. Absent → show /welcome on first
// authenticated visit. Present → skip; the user has made their pick
// (or explicitly bypassed) and the Edition Strip in every running
// head is the ongoing surface for changes.
//
// Kept in a tiny standalone module so the route component and the
// __root.tsx gate share the exact same key without coupling to
// uiStore (which uses its own 'hpc-ui' key for theme state).

export const WELCOMED_KEY = 'hpc-welcomed'

/** Synchronous read of the welcomed flag. Safe to call during
 *  render — touches localStorage but cheap and SSR-guarded.
 *
 *  Two-track welcomed check:
 *  1. Explicit flag `hpc-welcomed: '1'` — set when the user clicks
 *     "Fortsätt" on /welcome.
 *  2. Implicit: any existing `hpc-ui` persisted state implies the
 *     user is mid-stream (dogfood users with weeks of theme settings
 *     already saved). They've already self-served preferences via
 *     /dev or the Edition Strip; showing them an onboarding gate
 *     now would be a regression. */
export function isWelcomed(): boolean {
  if (typeof localStorage === 'undefined') return true /* assume welcomed on SSR */
  try {
    if (localStorage.getItem(WELCOMED_KEY) === '1') return true
    if (localStorage.getItem('hpc-ui') !== null) return true
    return false
  } catch (_) {
    return true /* storage failure → don't trap the user on /welcome */
  }
}
