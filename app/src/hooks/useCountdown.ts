// useCountdown — wall-clock countdown for the Provpass timer.
//
// `remainingMs` is ALWAYS derived from `durationMs - (now - startedAt)`,
// never accumulated from interval ticks — a setInterval(1000) alone
// drifts (and, worse, effectively PAUSES) when a mobile tab is
// throttled in the background. Recomputing from wall clock on every
// tick, AND on `visibilitychange` (the tab waking back up after being
// throttled/backgrounded), is what makes a countdown that survives a
// phone screen lock without silently gifting the user extra time.
//
// `expired` flips to true exactly once when remainingMs hits 0, even if
// the tab was asleep long past the deadline and wakes up with e.g.
// remainingMs = -400_000 — the fire only happens on the transition, not
// on every subsequent recompute.

import { useEffect, useRef, useState } from 'react'

export type CountdownState = {
  remainingMs: number
  expired: boolean
}

function computeRemaining(startedAt: Date, durationMs: number, now: number): number {
  const elapsed = now - startedAt.getTime()
  return Math.max(0, durationMs - elapsed)
}

export function useCountdown(startedAt: Date, durationMs: number): CountdownState {
  const [remainingMs, setRemainingMs] = useState(() =>
    computeRemaining(startedAt, durationMs, Date.now()),
  )
  const [expired, setExpired] = useState(() => remainingMs <= 0)
  // Guards the fire-once contract independently of React's render
  // batching — a ref so a rapid sequence of recomputes (tick +
  // visibilitychange landing in the same macrotask) can't double-set.
  const firedRef = useRef(expired)

  useEffect(() => {
    // Reset when the pass identity changes (new startedAt/durationMs —
    // e.g. adopting a different session). Without this a remount-free
    // prop change would keep the previous pass's fired flag AND its
    // stale `expired: true` state.
    firedRef.current = false
    setExpired(false)
    const tick = () => {
      const next = computeRemaining(startedAt, durationMs, Date.now())
      setRemainingMs(next)
      if (next <= 0 && !firedRef.current) {
        firedRef.current = true
        setExpired(true)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [startedAt, durationMs])

  return { remainingMs, expired }
}
