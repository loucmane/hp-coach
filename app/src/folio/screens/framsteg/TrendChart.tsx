import { useState } from 'react'
import type { WeeklyBucket } from '@/api/hooks/useStats'
import { buildTrend, scoreLabel } from './framstegView'

export function TrendChart({ weekly, phone }: { weekly: readonly WeeklyBucket[]; phone: boolean }) {
  const [table, setTable] = useState(false)
  const chart = buildTrend(weekly, phone)
  if (!chart.ready) return <p className="fa-empty">Kurvan börjar när du har övat två veckor.</p>
  const { width, height, left, right, bottom, last } = chart
  return (
    <figure className="fa-chart">
      <p className="fa-chart-summary">{chart.summary}</p>
      <svg
        className="fa-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Poäng per vecka. ${chart.summary}`}
      >
        <line
          className="fa-chart-axis"
          x1={left}
          x2={width - right}
          y1={height - bottom}
          y2={height - bottom}
        />
        {chart.ticks.map((tick) => (
          <g key={tick.value}>
            <line className="fa-chart-grid" x1={left} x2={width - right} y1={tick.y} y2={tick.y} />
            <text className="fa-chart-tick" x={left - 8} y={tick.y + 4} textAnchor="end">
              {scoreLabel(tick.value)}
            </text>
          </g>
        ))}
        {chart.bridges.map((d) => (
          <path key={d} className="fa-chart-bridge" d={d} />
        ))}
        {chart.solid.map((points) => (
          <polyline key={points} className="fa-chart-line" points={points} />
        ))}
        {chart.points.map((p) =>
          p.y == null ? null : <circle key={p.i} className="fa-chart-pt" cx={p.x} cy={p.y} r={2} />,
        )}
        {last ? (
          <>
            <circle className="fa-chart-end" cx={last.x} cy={last.y} r={4} />
            <text className="fa-chart-value" x={last.x + 8} y={last.y + 5}>
              {scoreLabel(last.score)}
            </text>
          </>
        ) : null}
        {chart.points
          .filter((p) => (chart.points.length - 1 - p.i) % (phone ? 3 : 2) === 0)
          .map((p) => (
            <text
              key={p.i}
              className="fa-chart-tick"
              x={p.x}
              y={height - bottom + 18}
              textAnchor="middle"
            >
              v.{p.week}
            </text>
          ))}
      </svg>
      <figcaption className="fa-chart-caption">
        Poäng per vecka, de senaste {weekly.length} veckorna.
        {chart.bridges.length ? ' Prickat: veckor utan övning.' : ''}
      </figcaption>
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
          <caption className="fa-sr">Poäng per vecka</caption>
          <thead>
            <tr>
              <th scope="col">Vecka</th>
              <th scope="col">Poäng</th>
            </tr>
          </thead>
          <tbody>
            {chart.points.map((p) => (
              <tr key={p.i}>
                <th scope="row">v.{p.week}</th>
                <td>{p.score == null ? 'ingen övning' : scoreLabel(p.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </figure>
  )
}
