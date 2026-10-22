import { useEffect, useState } from 'react'
import { readPatternsHeld, rememberPatternsHeld } from '@/lib/patternsHeld'
import { FramstegLink, type NavigateHref } from './FramstegReport'
import type { FramstegView } from './framstegView'

export type MasteryProps = {
  patternsHeld?: { mastered: number; total: number }
  userId?: string | null
}

function PatternsHeldLine({
  mastered,
  total,
  userId,
}: {
  mastered: number
  total: number
  userId?: string | null
}) {
  const [peak, setPeak] = useState(() => readPatternsHeld(userId))
  const highWater = userId ? Math.max(mastered, peak) : mastered
  useEffect(() => {
    if (userId) setPeak(rememberPatternsHeld(highWater, userId))
  }, [highWater, userId])
  return (
    <p className="fa-margin-note">
      Mönster som sitter: {Math.min(highWater, total)} av {total}
    </p>
  )
}

function PracticeDays({ days }: { days: FramstegView['heat'] }) {
  const [open, setOpen] = useState(false)
  const weeks = days ? Array.from({ length: 12 }, (_, i) => days.slice(i * 7, i * 7 + 7)) : []
  return (
    <section
      className="fa-aside-block"
      aria-labelledby="fa-fr-days-h"
      data-testid="folio-framsteg-week"
    >
      <h2 className="fa-h3" id="fa-fr-days-h">
        Övningsdagar
      </h2>
      <p className="fa-margin-note">Senaste 12 veckorna</p>
      {days ? (
        <>
          <div
            className="fa-heat"
            role="img"
            aria-label="Övningsdagar de senaste 12 veckorna. Öppna alla veckor för antal svar per dag."
          >
            {weeks.map((week) => (
              <span className="fa-heat-week" key={week[0].date}>
                {week.map((day) => (
                  <span key={day.date} data-heat={day.level} title={`${day.date}: ${day.n} svar`} />
                ))}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="fa-more"
            data-testid="progress-heat-toggle"
            aria-expanded={open}
            aria-controls="fa-fr-heat-detail"
            onClick={() => setOpen(!open)}
          >
            {open ? 'Visa färre veckor' : 'Visa alla veckor'}
          </button>
          {open ? (
            <div className="fa-heat-detail" id="fa-fr-heat-detail">
              <table className="fa-table">
                <caption>Svar per dag</caption>
                <thead>
                  <tr>
                    <th scope="col">Från</th>
                    {weeks[0].map((day) => (
                      <th scope="col" key={day.date}>
                        {new Date(`${day.date}T12:00:00Z`).toLocaleDateString('sv-SE', {
                          weekday: 'short',
                          timeZone: 'UTC',
                        })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week) => (
                    <tr key={week[0].date}>
                      <th scope="row">
                        <time dateTime={week[0].date}>
                          {Number(week[0].date.slice(8))}/{Number(week[0].date.slice(5, 7))}
                        </time>
                      </th>
                      {week.map((day) => (
                        <td
                          key={day.date}
                          title={`${day.date}: ${day.n} svar · ${day.verbal} verbal / ${day.quant} kvant`}
                        >
                          <span aria-hidden>{day.n}</span>
                          <span className="fa-sr">
                            {day.date}: {day.n} svar · {day.verbal} verbal / {day.quant} kvant
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : (
        <p className="fa-margin-note">Övningsdagarna visas när underlaget har kommit in.</p>
      )}
      <p className="fa-margin-note">En dag utan övning tar inte bort något du har byggt upp.</p>
    </section>
  )
}

export function FramstegMargin({
  view,
  navigateHref,
  patternsHeld,
  userId,
}: { view: FramstegView; navigateHref: NavigateHref } & MasteryProps) {
  return (
    <aside className="fa-aside" aria-label="Översikt" data-fa-shade>
      {view.traps.length ? (
        <section className="fa-aside-block" aria-labelledby="fa-fr-traps-h">
          <h2 className="fa-h3" id="fa-fr-traps-h">
            Fällor
          </h2>
          <ul className="fa-trap-list">
            {view.traps.map((trap) => (
              <li key={trap.id}>
                <p className="fa-trap-meta">
                  <b>{trap.section}</b>
                  <span>
                    {trap.countLabel}
                    {trap.rising ? ' · ökar ↑' : ''}
                  </span>
                </p>
                <FramstegLink className="fa-trap-name" href={trap.href} navigateHref={navigateHref}>
                  {trap.name}
                </FramstegLink>
                {trap.pattern ? <p className="fa-trap-pattern">{trap.pattern}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {view.repetition ? (
        <section className="fa-aside-block" aria-labelledby="fa-fr-rep-h">
          <h2 className="fa-h3" id="fa-fr-rep-h">
            Repetitionen
          </h2>
          <FramstegLink className="fa-link" href="/repetition" navigateHref={navigateHref}>
            {view.repetition.due > 0 ? `${view.repetition.due} att repetera nu` : 'Öppna Repetera'}{' '}
            →
          </FramstegLink>
          <p className="fa-margin-note">
            {view.repetition.active} i kön · {view.repetition.resolved} återlärda
          </p>
          {patternsHeld ? (
            <PatternsHeldLine key={userId ?? ''} {...patternsHeld} userId={userId} />
          ) : null}
        </section>
      ) : null}
      <PracticeDays days={view.heat} />
      <p className="fa-lifetime">{view.lifetime}</p>
    </aside>
  )
}
