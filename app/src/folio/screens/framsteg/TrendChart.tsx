import { type CSSProperties, useState } from 'react'
import type { FramstegView } from './framstegView'

export function TrendChart({ chart, phone }: { chart: FramstegView['weekly']; phone: boolean }) {
  const [table, setTable] = useState(false)
  const thin = chart.weeks.filter((w) => w.state === 'thin')
  return (
    <figure className="fa-chart">
      <figcaption className="fa-chart-caption">
        Prognosens intervall varje vecka · tomma veckor fylls när de kommer, ingen gissning framåt
      </figcaption>
      {chart.statusLine ? (
        <p className="fa-chart-status" role="status">
          {chart.statusLine}
        </p>
      ) : null}
      {chart.weeks.length ? (
        <>
          <div
            className="fa-weeks"
            data-phone={phone}
            style={{ '--fa-week-count': chart.weeks.length } as CSSProperties}
            role="img"
            aria-label={`${chart.weeks.map((w) => `Vecka ${w.week}: ${w.label}`).join('. ')}. Mål 2,0.`}
          >
            <span className="fa-week-goal" aria-hidden="true">
              <span>mål 2,0</span>
            </span>
            <span className="fa-week-axis" aria-hidden="true">
              <span>2,0</span>
              <span>1,0</span>
              <span>0</span>
            </span>
            {chart.weeks.map((w) => (
              <span
                className="fa-week"
                data-current={w.current}
                data-state={w.state}
                key={w.iso}
                aria-hidden="true"
              >
                <span className="fa-week-slot">
                  {w.bottom != null && w.height != null ? (
                    <i
                      className="fa-week-band"
                      style={{ bottom: `${w.bottom}%`, height: `${w.height}%` }}
                    />
                  ) : null}
                </span>
                <span className="fa-week-label">v {w.week}</span>
              </span>
            ))}
          </div>
          {thin.length ? (
            <p className="fa-chart-note">
              {thin.map((w) => `v ${w.week}`).join(', ')}: för lite underlag.
            </p>
          ) : null}
          {chart.summary ? <p className="fa-chart-summary">{chart.summary}</p> : null}
          <button
            type="button"
            className="fa-more"
            aria-expanded={table}
            aria-controls="fa-fr-chart-table"
            onClick={() => setTable(!table)}
          >
            {table ? 'Dölj tabellen' : 'Visa som tabell'}
          </button>
          {table ? (
            <table className="fa-table fa-chart-table" id="fa-fr-chart-table">
              <caption className="fa-sr">Prognosens intervall vecka för vecka</caption>
              <thead>
                <tr>
                  <th scope="col">Vecka</th>
                  <th scope="col">Intervall</th>
                </tr>
              </thead>
              <tbody>
                {chart.weeks.map((w) => (
                  <tr key={w.iso}>
                    <th scope="row">{w.iso}</th>
                    <td>{w.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </>
      ) : null}
    </figure>
  )
}
