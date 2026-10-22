import { useState } from 'react'
import { formatPass, formatSitting } from '@/lib/examNames'
import type { PassOption } from '@/lib/mock'
import { type HubView, passKey, passName } from './provView'

export function ProvRegister({
  view,
  phone,
  onPick,
}: {
  view: HubView
  phone: boolean
  onPick: (key: string) => void
}) {
  const [all, setAll] = useState(false)
  const cell = (p: PassOption | undefined) =>
    p ? (
      <button
        type="button"
        className="fa-cell"
        data-testid={`prov-pass-${p.examId}-${p.provpass}`}
        aria-pressed={view.chosen === p}
        aria-label={`${passName(p)}, sett ${p.totalExposure} gånger${view.suggested === p ? ', minst sett' : ''}`}
        onClick={() => onPick(passKey(p))}
      >
        {phone ? <span>{formatPass(p.provpass)}</span> : null}
        <span>sett {p.totalExposure} gånger</span>
        {p.presented < 40 ? <span className="fa-meta">{p.presented}/40 frågor</span> : null}
      </button>
    ) : (
      <span className="fa-meta">
        —<span className="fa-sr"> inget pass</span>
      </span>
    )
  return (
    <section className="fa-section" aria-labelledby="fa-register-heading">
      <div className="fa-section-head">
        <h2 className="fa-h2" id="fa-register-heading">
          Alla pass
        </h2>
        <span className="fa-meta">{view.sittings.length} provtillfällen</span>
      </div>
      {phone ? (
        <div className="fa-register-phone">
          {view.sittings
            .filter((s, i) => all || i < 3 || s.examId === view.chosen?.examId)
            .map((s) => (
              <section key={s.examId} aria-labelledby={`fa-register-${s.examId}`}>
                <h3 className="fa-part" id={`fa-register-${s.examId}`}>
                  {formatSitting(s.examId)}
                </h3>
                <ul>
                  {s.passes.map((p, i) => (
                    <li key={i === 0 ? 'first' : 'second'}>{cell(p)}</li>
                  ))}
                </ul>
              </section>
            ))}
          {view.sittings.length > 3 ? (
            <button
              type="button"
              className="fa-link"
              aria-expanded={all}
              onClick={() => setAll(!all)}
            >
              {all
                ? 'Visa bara de senaste provtillfällena'
                : `Visa alla ${view.sittings.length} provtillfällen`}
            </button>
          ) : null}
        </div>
      ) : (
        <table className="fa-table fa-register">
          <caption className="fa-sr">Alla provtillfällen och pass, med tidigare exponering</caption>
          <thead>
            <tr>
              <th scope="col">Provtillfälle</th>
              <th scope="col">Provpass 1</th>
              <th scope="col">Provpass 2</th>
            </tr>
          </thead>
          <tbody>
            {view.sittings.map((s) => (
              <tr key={s.examId}>
                <th scope="row">
                  <span className="fa-th-line">
                    <span>{formatSitting(s.examId)}</span>
                    <span className="fa-leader" aria-hidden />
                  </span>
                </th>
                <td>{cell(s.passes[0])}</td>
                <td>{cell(s.passes[1])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
