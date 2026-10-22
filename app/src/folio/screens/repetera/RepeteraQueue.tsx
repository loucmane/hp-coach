import { ChevronRight } from 'lucide-react'
import type { ComponentProps } from 'react'
import type { QueueSection } from './repeteraView'

export type NavigateHref = (href: string) => void

/** Keep native anchors and modified clicks, routing ordinary clicks in-app. */
export function RepeteraLink({
  href,
  navigateHref,
  onClick,
  ...props
}: ComponentProps<'a'> & {
  href: string
  navigateHref: NavigateHref
}) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return
        event.preventDefault()
        navigateHref(href)
      }}
    />
  )
}

export function RepeteraQueue({
  queue,
  navigateHref,
}: {
  queue: QueueSection[]
  navigateHref: NavigateHref
}) {
  if (!queue.length) return null
  return (
    <section className="fa-section" aria-labelledby="fa-rep-queue" data-fa-shade>
      <div className="fa-section-head">
        <h2 className="fa-h2" id="fa-rep-queue">
          Kön per delprov
        </h2>
        <span className="fa-meta">redo nu</span>
      </div>
      <ul>
        {queue.map((s) => (
          <li key={s.section}>
            <RepeteraLink
              className="fa-plan-row"
              href={s.href}
              navigateHref={navigateHref}
              aria-label={
                s.ready
                  ? `Repetera bara ${s.section}, ${s.name}, ${s.ready} redo nu`
                  : `Visa kön för ${s.section}, ${s.name}`
              }
            >
              <span className="fa-entry-code">{s.section}</span>
              <span className="fa-plan-body">
                <span className="fa-plan-line">
                  <span className="fa-plan-title">{s.name}</span>
                  <span className="fa-leader" aria-hidden />
                  <span className="fa-plan-min">
                    {s.ready || '—'}
                    <ChevronRight size={14} strokeWidth={1.5} aria-hidden />
                  </span>
                </span>
                {s.laterToday > 0 ? (
                  <span className="fa-entry-note">
                    {s.laterToday}
                    {s.ready ? ' till' : ''} blir redo senare idag
                  </span>
                ) : null}
                {s.laterDays > 0 ? (
                  <span className="fa-entry-note">{s.laterDays} väntar på nästa repetition</span>
                ) : null}
              </span>
            </RepeteraLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
