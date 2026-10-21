import { useEffect, useState } from 'react'

import { formatDrillTime } from '@/lib/timedDrill'

export type DrillClockState = {
  elapsedMs: number | null
  runningSince: number | null
}

/** Display only: going past the guideline never ends or advances a drill. */
export function QuietClock({
  budgetMs,
  elapsedMs,
  runningSince,
}: DrillClockState & { budgetMs: number }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    if (runningSince === null) return
    const interval = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [runningSince])

  const remaining =
    elapsedMs === null
      ? null
      : budgetMs - elapsedMs - (runningSince === null ? 0 : Math.max(0, now - runningSince))
  const time =
    remaining === null
      ? 'Tid saknas'
      : remaining < 0
        ? `+${formatDrillTime(-remaining)}`
        : formatDrillTime(Math.ceil(remaining / 1000) * 1000)

  return (
    <div
      role="timer"
      aria-label="Övningstid"
      aria-live="off"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 6px)',
        right: 12,
        zIndex: 20,
        pointerEvents: 'none',
        background: 'var(--bg)',
        color: 'var(--muted)',
        border: '1px solid var(--hairline)',
        borderRadius: 4,
        padding: '4px 8px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        lineHeight: 1.4,
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
      }}
    >
      <span>{time}</span>
      <span style={{ display: 'block', fontSize: 9 }}>
        {runningSince === null ? 'Paus under återkoppling' : 'Riktmärke'}
      </span>
    </div>
  )
}
