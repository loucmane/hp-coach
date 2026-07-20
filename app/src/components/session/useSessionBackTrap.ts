// useSessionBackTrap — trap the browser back gesture inside an ACTIVE
// drill/diagnostic session so a reflexive back-swipe can't silently
// discard ten minutes of answers.
//
// Same trap class as the landing takeover's proven useTakeoverHistory
// (devbake/LandingBakeoffR3.logic.ts) — marker entry + popstate — but
// with a different resolution: instead of closing on pop, the trap
// RE-ARMS and surfaces the product's quiet confirm sheet; only the
// sheet's explicit "Avsluta" performs the real back (via `leave()`).
//
// Contract:
//   active flips true  → pushState (same URL, { hpcSessionTrap: true })
//                        — idempotent: if the marker entry is already
//                        current (StrictMode remount) nothing is pushed
//   browser back       → popstate past the marker → re-push the marker
//                        (a second swipe stays trapped) + onBackAttempt()
//                        (SessionPlayer opens the confirm sheet)
//   confirm "Avsluta"  → leave(): suppress the trap, history.go(-2) —
//                        past the re-armed marker AND the session entry,
//                        landing on wherever the user came from
//   active flips false → (session completed) consume the marker entry
//                        silently so the done screen isn't one back-press
//                        further from home than it should be
//
// TanStack Router patches history.pushState and treats ANY push as a
// navigation; `_ignoreSubscribers` is the escape hatch the router's own
// internals use for state-only writes — see useTakeoverHistory's notes.
// Never call history.back() from an effect CLEANUP: a queued back()
// resolves its target at call time, which poisons StrictMode's
// unmount/remount cycle. All traversal here happens in effect bodies or
// event handlers.

import { useCallback, useEffect, useRef } from 'react'

type TrapState = { hpcSessionTrap?: boolean } | null

function pushMarker(): void {
  const h = window.history as History & { _ignoreSubscribers?: boolean }
  const prev = h._ignoreSubscribers
  h._ignoreSubscribers = true
  try {
    h.pushState({ ...((h.state as object | null) ?? {}), hpcSessionTrap: true }, '')
  } finally {
    h._ignoreSubscribers = prev
  }
}

export function useSessionBackTrap(
  active: boolean,
  onBackAttempt: () => void,
): { leave: () => void } {
  const onBackAttemptRef = useRef(onBackAttempt)
  onBackAttemptRef.current = onBackAttempt
  // True from leave() until the trap unmounts/deactivates — pops during
  // the confirmed exit must not re-arm or re-surface the sheet.
  const leavingRef = useRef(false)
  // One-shot guard for the deactivation consume: the effect body runs
  // twice under StrictMode BEFORE the async back() resolves, and a
  // second back() would traverse past the session entry for real.
  const consumedRef = useRef(false)

  useEffect(() => {
    if (!active) {
      if (
        !leavingRef.current &&
        !consumedRef.current &&
        (window.history.state as TrapState)?.hpcSessionTrap
      ) {
        consumedRef.current = true
        window.history.back()
      }
      return
    }

    leavingRef.current = false
    consumedRef.current = false
    if (!(window.history.state as TrapState)?.hpcSessionTrap) {
      pushMarker()
    }
    const onPop = (e: PopStateEvent) => {
      if (leavingRef.current) return
      // A pop that still lands on a marker entry is bookkeeping
      // (StrictMode double-mount), not the user leaving.
      if ((e.state as TrapState)?.hpcSessionTrap) return
      // The user backed past the marker: re-arm so the NEXT swipe is
      // trapped too, then let the player open the confirm sheet. (The
      // current-state check keeps synthetic popstates — tests — from
      // stacking duplicate markers.)
      if (!(window.history.state as TrapState)?.hpcSessionTrap) {
        pushMarker()
      }
      onBackAttemptRef.current()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [active])

  const leave = useCallback(() => {
    leavingRef.current = true
    // Past the re-armed marker AND the session entry in one traversal.
    // (If the session URL was the very first entry there's nothing to
    // land on and this is a no-op — the SPA edge where a deep link
    // opened the drill directly; acceptable residue.)
    window.history.go(-2)
  }, [])

  return { leave }
}
