import { useAuth } from '@clerk/clerk-react'
import { type CSSProperties, useEffect, useRef, useState } from 'react'

import { DrillRailSection } from '@/components/drill/DrillRailSection'
import {
  buildReturnCalendar,
  claimReturnPrompt,
  googleCalendarUrl,
  hasEarlierPractice,
  type ReturnEvent,
  type ReturnHistory,
  returnPromptDay,
  returnSummary,
  suggestReturnTime,
} from '@/lib/returnPrompt'
import type { DailyPlan } from '@/lib/scheduler'

const word: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  letterSpacing: 'var(--font-mono-track, 0.04em)',
  color: 'var(--muted)',
  background: 'none',
  border: 'none',
  padding: '8px 0',
  cursor: 'pointer',
}

/** Mounted only beneath Home's all-complete panel; never in a pass result.
 * Identity stays in this small connected leaf rather than Home's props. */
export function ReturnPrompt({
  plan,
  history,
  now,
}: {
  plan: DailyPlan
  history: ReturnHistory
  now?: Date
}) {
  const { userId } = useAuth()
  const [clock, setClock] = useState(() => new Date())
  const today = now ?? clock
  const day = returnPromptDay(today)

  // A Home left open at midnight must not offer yesterday's "I morgon".
  useEffect(() => {
    if (now) return
    const refresh = () => setClock(new Date())
    const nextDay = new Date(clock.getFullYear(), clock.getMonth(), clock.getDate() + 1)
    const timer = window.setTimeout(refresh, Math.max(0, nextDay.getTime() - Date.now()) + 50)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [now, clock])

  const start = suggestReturnTime(history, today)
  if (
    !userId ||
    !start ||
    plan.date !== day ||
    plan.items.length === 0 ||
    plan.items.some((item) => item.id.startsWith('cold-')) ||
    !hasEarlierPractice(history, today)
  ) {
    return null
  }

  return (
    <DailyReturnPrompt
      key={`${userId}:${day}`}
      userId={userId}
      now={today}
      event={{ start, summary: returnSummary(plan.items) }}
    />
  )
}

function DailyReturnPrompt({
  userId,
  now,
  event,
}: {
  userId: string
  now: Date
  event: ReturnEvent
}) {
  const attempted = useRef(false)
  const [stage, setStage] = useState<'hidden' | 'ask' | 'chosen'>('hidden')
  // Freeze the offered time/content across background query refreshes.
  const [offer] = useState(() => ({ event, createdAt: now }))
  const [download, setDownload] = useState<string | null>(null)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true
    if (claimReturnPrompt(userId, now)) setStage('ask')
  }, [userId, now])

  useEffect(() => {
    if (stage !== 'chosen') return
    // Only the explicit time choice creates an export. No alarm, request,
    // automatic download or navigation is triggered by displaying Home.
    const blob = new Blob([buildReturnCalendar(offer.event, offer.createdAt)], {
      type: 'text/calendar;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    setDownload(url)
    return () => URL.revokeObjectURL(url)
  }, [stage, offer])

  if (stage === 'hidden') return null
  const time = `${String(offer.event.start.getHours()).padStart(2, '0')}:${String(offer.event.start.getMinutes()).padStart(2, '0')}`

  return (
    <DrillRailSection meta={null} testid="return-prompt">
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
        {stage === 'ask' ? (
          <>
            <p style={{ margin: '0 0 4px' }}>När kör du nästa gång?</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
              <button type="button" style={word} onClick={() => setStage('chosen')}>
                I morgon {time} (som idag)
              </button>
              <button type="button" style={word} onClick={() => setStage('hidden')}>
                Inte nu
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
            {download && (
              <a href={download} download="hp-coach.ics" style={word}>
                Lägg i kalendern (.ics)
              </a>
            )}
            <a
              href={googleCalendarUrl(
                offer.event,
                Intl.DateTimeFormat().resolvedOptions().timeZone,
              )}
              target="_blank"
              rel="noopener noreferrer"
              style={word}
            >
              Google Kalender
            </a>
          </div>
        )}
      </div>
    </DrillRailSection>
  )
}
