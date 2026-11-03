import { useState } from 'react'
import type { Question } from '@/data/questions'
import { paceAt } from './passPace'

export function PassHead({
  plan,
  index,
  remainingMs,
  durationMs,
  onOverview,
  onSubmit,
}: {
  plan: readonly Question[]
  index: number
  remainingMs: number
  durationMs: number
  onOverview: () => void
  onSubmit: () => void
}) {
  const [clockVisible, setClockVisible] = useState(true)
  const seconds = Math.ceil(remainingMs / 1000)
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const pace = paceAt(plan, durationMs - remainingMs)
  return (
    <header className="fa-pass-head">
      <div className="fa-pass-heading">
        <h1 className="fa-pass-title">Provpass</h1>
        <span>
          Fråga {index + 1} av {plan.length} · {plan[index]?.section}
        </span>
      </div>
      <div className="fa-pass-tools">
        <button
          type="button"
          className="fa-pass-button"
          onClick={onOverview}
          aria-haspopup="dialog"
        >
          Översikt
        </button>
        <button
          type="button"
          className="fa-pass-button"
          data-testid="mock-submit"
          onClick={onSubmit}
          aria-haspopup="dialog"
        >
          Lämna in
        </button>
      </div>
      <div className="fa-pass-clock-row">
        {clockVisible ? (
          <span
            role="timer"
            aria-label="Tid kvar"
            data-testid="mock-countdown"
            className="fa-pass-clock"
          >
            {clock}
          </span>
        ) : null}
        <button
          type="button"
          className="fa-pass-quiet"
          aria-expanded={clockVisible}
          onClick={() => setClockVisible((value) => !value)}
        >
          {clockVisible ? 'Dölj klockan' : 'Visa klockan'}
        </button>
        {clockVisible ? (
          <div className="fa-pass-pace" title="UHR:s rekommenderade tid" aria-hidden="true">
            <span
              className="fa-pass-tick"
              data-testid="prov-pace-tick"
              style={{ left: `${plan.length ? (pace / plan.length) * 100 : 0}%` }}
            />
          </div>
        ) : null}
      </div>
    </header>
  )
}
