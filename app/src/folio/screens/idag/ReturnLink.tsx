import { useAuth } from '@clerk/clerk-react'
import { useEffect, useRef, useState } from 'react'
import {
  buildReturnCalendar,
  canShowReturnPrompt,
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

/** Calendar invitation port: same daily claim/gates, Folio presentation. */
export function ReturnLink({
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
  )
    return null
  return (
    <DailyReturnLink
      key={`${userId}:${day}`}
      userId={userId}
      now={today}
      event={{ start, summary: returnSummary(plan.items) }}
    />
  )
}

function DailyReturnLink({
  userId,
  now,
  event,
}: {
  userId: string
  now: Date
  event: ReturnEvent
}) {
  const [stage, setStage] = useState<'hidden' | 'collapsed' | 'ask' | 'chosen'>(() =>
    canShowReturnPrompt(userId, now) ? 'collapsed' : 'hidden',
  )
  const choiceRef = useRef<HTMLButtonElement>(null)
  const downloadRef = useRef<HTMLAnchorElement>(null)
  const [offer] = useState(() => ({ event, createdAt: now }))
  const [download, setDownload] = useState<string | null>(null)
  useEffect(() => {
    if (stage === 'ask') choiceRef.current?.focus()
    if (stage === 'chosen' && download) downloadRef.current?.focus()
  }, [stage, download])
  useEffect(() => {
    if (stage !== 'chosen') return
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
    <div className="fa-return" data-testid="return-prompt" data-fa-shade>
      {stage === 'collapsed' ? (
        <button className="fa-link" type="button" onClick={() => setStage('ask')}>
          Lägg morgondagens pass i kalendern →
        </button>
      ) : stage === 'ask' ? (
        <>
          <button
            ref={choiceRef}
            className="fa-link"
            type="button"
            onClick={() => setStage(claimReturnPrompt(userId, now) ? 'chosen' : 'hidden')}
          >
            I morgon {time} (som idag)
          </button>
          <button
            className="fa-link"
            type="button"
            onClick={() => {
              claimReturnPrompt(userId, now)
              setStage('hidden')
            }}
          >
            Inte nu
          </button>
        </>
      ) : (
        <>
          {download ? (
            <a className="fa-link" ref={downloadRef} href={download} download="hp-coach.ics">
              Lägg i kalendern (.ics)
            </a>
          ) : null}
          <a
            className="fa-link"
            href={googleCalendarUrl(offer.event, Intl.DateTimeFormat().resolvedOptions().timeZone)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Kalender
          </a>
        </>
      )}
    </div>
  )
}
