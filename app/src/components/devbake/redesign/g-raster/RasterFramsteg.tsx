import { useId, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtDelta, fmtScore } from '@/components/devbake/redesign/r1Kit'
import type { FramstegView } from '@/components/devbake/redesign/viewModel'
import { rasterSlug } from './RasterParts'

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

function RasterTrend({ weeks }: { weeks: FramstegView['weekly'] }) {
  const titleId = useId()
  const x = (i: number) => 42 + (i / Math.max(1, weeks.length - 1)) * 548
  const y = (score: number) => 180 - (score / 2) * 160
  return (
    <section className="ra-ledger-section">
      <header className="ra-section-heading">
        <h2>Vecka för vecka</h2>
        <span>0–2,0</span>
      </header>
      <p className="ra-history-note">
        Veckans andel rätt, omräknad till 0–2,0. Kurvan visar inte prognosen.
      </p>
      {weeks.some((week) => week.score != null) ? (
        <svg className="ra-trend" viewBox="0 0 620 220" role="img" aria-labelledby={titleId}>
          <title id={titleId}>
            Veckovis resultat. Saknade veckor lämnar luckor; alla värden finns i tabellen.
          </title>
          {[0, 1, 2].map((value) => (
            <g key={value}>
              <line x1="42" x2="590" y1={y(value)} y2={y(value)} className="ra-trend-rule" />
              <text x="0" y={y(value) + 4}>
                {fmtScore(value)}
              </text>
            </g>
          ))}
          {weeks.map((week, i) =>
            week.score == null ? null : (
              <g key={week.weekStart}>
                {i > 0 && weeks[i - 1].score != null ? (
                  <line
                    data-testid="ra-trend-segment"
                    x1={x(i - 1)}
                    x2={x(i)}
                    y1={y(weeks[i - 1].score!)}
                    y2={y(week.score)}
                    className="ra-trend-line"
                  />
                ) : null}
                <circle cx={x(i)} cy={y(week.score)} r="4" />
              </g>
            ),
          )}
          {weeks.length ? (
            <>
              <text x="42" y="210">
                {dateLabel(weeks[0].weekStart)}
              </text>
              <text x="590" y="210" textAnchor="end">
                {dateLabel(weeks[weeks.length - 1].weekStart)}
              </text>
            </>
          ) : null}
        </svg>
      ) : (
        <p className="ra-empty">Inga veckovärden än.</p>
      )}
      <details className="ra-data-details">
        <summary>Visa veckornas värden</summary>
        <table className="ra-result-table">
          <caption>Veckostart och sammanvägt resultat</caption>
          <thead>
            <tr>
              <th scope="col">Vecka från</th>
              <th scope="col">Resultat</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.weekStart}>
                <th scope="row">
                  <time dateTime={week.weekStart}>{dateLabel(week.weekStart)}</time>
                </th>
                <td>{week.score == null ? 'Underlag saknas' : fmtScore(week.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}

export function RasterFramsteg() {
  const { data, actions } = useDirectionData()
  const progress = data.framsteg
  const { prognosis, week } = progress
  const [historyOnly, setHistoryOnly] = useState(false)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const selected = progress.history.find((row) => row.id === openedId)
  const focus = progress.focus.find((section) =>
    progress.sections.some((row) => row.section === section),
  )
  const historyId = useId()
  return (
    <div className="ra-register-page">
      <header className="ra-register-heading">
        <div>
          <p className="ra-label">05 / Framsteg</p>
          <h1>{historyOnly ? 'Tidigare pass.' : 'Se vad som växer.'}</h1>
        </div>
        <nav className="ra-progress-tabs" aria-label="Framstegsvyer">
          <button type="button" aria-pressed={!historyOnly} onClick={() => setHistoryOnly(false)}>
            Översikt
          </button>
          <button type="button" aria-pressed={historyOnly} onClick={() => setHistoryOnly(true)}>
            Historik
          </button>
        </nav>
      </header>
      <div hidden={historyOnly}>
        <section className="ra-result-top" data-testid="rd-framsteg-prognosis">
          <div>
            <p className="ra-label">Prognos · inte provresultat</p>
            {prognosis.total == null ? (
              <h2 className="ra-empty-prognosis">
                Öva några frågor så börjar din prognos ta form.
              </h2>
            ) : (
              <p className="ra-display">
                {fmtScore(prognosis.total)}
                <small>/2,0</small>
              </p>
            )}
            {prognosis.delta != null ? (
              <p>{fmtDelta(prognosis.delta)} jämfört med förra veckan</p>
            ) : null}
            {prognosis.target != null ? <p>Mål {fmtScore(prognosis.target)}</p> : null}
          </div>
          <div className="ra-result-basis">
            <h2>Underlaget bakom siffran</h2>
            <dl className="ra-half-scores">
              <div>
                <dt>Verbal</dt>
                <dd>
                  {prognosis.verbal == null ? 'För lite underlag' : fmtScore(prognosis.verbal)}
                </dd>
              </div>
              <div>
                <dt>Kvantitativ</dt>
                <dd>{prognosis.quant == null ? 'För lite underlag' : fmtScore(prognosis.quant)}</dd>
              </div>
            </dl>
            {prognosis.low != null && prognosis.high != null ? (
              <p>
                Intervall {fmtScore(prognosis.low)}–{fmtScore(prognosis.high)}
              </p>
            ) : null}
            {prognosis.caveat ? <p>{prognosis.caveat}</p> : null}
          </div>
        </section>
        <button
          type="button"
          className="ra-primary ra-register-primary"
          onClick={() =>
            focus ? actions.startDrill({ kind: 'section', section: focus }) : actions.go('ova')
          }
        >
          {focus ? `Öva ${focus}` : 'Börja öva'}
          <span aria-hidden>↗</span>
        </button>
        <div className="ra-register-columns">
          <RasterTrend weeks={progress.weekly} />
          <section className="ra-ledger-section" data-testid="rd-framsteg-week">
            <header className="ra-section-heading">
              <h2>Din rytm</h2>
            </header>
            <p className="ra-rhythm-count">
              {week.attemptsThisWeek}
              <span> svar den här veckan</span>
            </p>
            <dl className="ra-rhythm-list">
              <div>
                <dt>Idag</dt>
                <dd>{week.minutesToday == null ? 'Tid saknas' : `${week.minutesToday} minuter`}</dd>
              </div>
              <div>
                <dt>Rätt senaste sju dagarna</dt>
                <dd>
                  {week.accuracy7d == null
                    ? 'Underlag saknas'
                    : `${Math.round(week.accuracy7d * 100)} %`}
                </dd>
              </div>
              {week.daysPractised != null ? (
                <div>
                  <dt>Dagar med övning</dt>
                  <dd>
                    {week.daysPractised}
                    {week.goal != null ? ` av ${week.goal} planerade` : ''}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Sammanhängande övningsdagar</dt>
                <dd>{week.streakDays}</dd>
              </div>
            </dl>
            <p className="ra-history-note">Varje övning räknas. Fortsätt i din takt.</p>
            {progress.focus.length > 1 ? (
              <details className="ra-data-details">
                <summary>Fler områden att öva</summary>
                {progress.focus
                  .filter((section) => section !== focus)
                  .map((section) => (
                    <button
                      type="button"
                      className="ra-text-door"
                      key={section}
                      onClick={() => actions.startDrill({ kind: 'section', section })}
                    >
                      Öva {section} ↗
                    </button>
                  ))}
              </details>
            ) : null}
          </section>
        </div>
        <section className="ra-ledger-section">
          <header className="ra-section-heading">
            <h2>Sektionsregistret</h2>
            <span>Senaste 90 dagarna</span>
          </header>
          <ul className="ra-section-register">
            {progress.sections.map((section) => (
              <li
                key={section.section}
                data-testid={`rd-framsteg-section-${rasterSlug(section.section)}`}
              >
                <span>
                  <strong>{section.section}</strong>
                  <small>{section.name}</small>
                </span>
                <span className="ra-section-score">
                  {section.score == null ? 'För lite underlag' : fmtScore(section.score)}
                  {section.score != null && section.band != null ? (
                    <small>± {fmtScore(section.band)} · 95 % intervall</small>
                  ) : null}
                </span>
                <span>
                  {section.attempts90d} svar
                  <small>
                    {section.confidence === 'low'
                      ? 'Litet underlag'
                      : section.confidence === 'medium'
                        ? 'Måttligt underlag'
                        : 'Stort underlag'}
                    {section.daysSince == null ? '' : ` · ${section.daysSince} dagar sedan`}
                  </small>
                  {section.trend != null ? (
                    <small>
                      {section.trend > 0 ? '+' : ''}
                      {Math.round(section.trend * 100)} procentenheter rätt jämfört med förra veckan
                    </small>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="ra-ledger-section">
          <header className="ra-section-heading">
            <h2>Dagar med övning</h2>
            <span>{progress.days.length} dagar</span>
          </header>
          <p className="ra-history-note">
            En fylld ruta betyder att du övade. Tomma dagar är inga förluster.
          </p>
          <div className="ra-day-strip" aria-hidden>
            {progress.days.map((day) => (
              <span
                key={day.date}
                data-active={String(day.n > 0)}
                title={`${day.date}: ${day.n} svar`}
              >
                {day.n > 0 ? '·' : ''}
              </span>
            ))}
          </div>
          {progress.days.length ? (
            <p className="ra-day-range">
              {dateLabel(progress.days[0].date)} —{' '}
              {dateLabel(progress.days[progress.days.length - 1].date)}
            </p>
          ) : (
            <p className="ra-empty">Inga övningsdagar registrerade än.</p>
          )}
          <details className="ra-data-details">
            <summary>Visa dagar och antal svar</summary>
            <ul className="ra-day-values">
              {progress.days.map((day) => (
                <li key={day.date}>
                  <time dateTime={day.date}>{day.date}</time>
                  <span>{day.n} svar</span>
                </li>
              ))}
            </ul>
          </details>
        </section>
        <section className="ra-ledger-section">
          <header className="ra-section-heading">
            <h2>Repetition</h2>
          </header>
          <p>
            {progress.totals.mistakesActive} aktiva missar · {progress.totals.mistakesResolved}{' '}
            repeterade.
          </p>
          <button type="button" onClick={actions.openRepetera}>
            Till Repetera ↗
          </button>
        </section>
      </div>
      <section
        className="ra-ledger-section"
        data-testid="rd-framsteg-history"
        aria-labelledby={historyId}
      >
        <header className="ra-section-heading">
          <h2 id={historyId}>Historik</h2>
          {historyOnly ? (
            <button type="button" onClick={() => setHistoryOnly(false)}>
              Till översikten
            </button>
          ) : null}
        </header>
        {progress.history.length ? (
          <ul className="ra-pass-history">
            {progress.history.map((row, i) => (
              <li key={row.id} data-testid={`rd-framsteg-history-item-${i + 1}`}>
                <button
                  type="button"
                  aria-expanded={openedId === row.id}
                  onClick={() => setOpenedId(openedId === row.id ? null : row.id)}
                >
                  <span>
                    <strong>{row.label}</strong>
                    <small>
                      <time dateTime={row.endedAt}>{row.when}</time>
                      {row.section ? ` · ${row.section}` : ''}
                    </small>
                  </span>
                  <span>
                    {row.correct}/{row.total} rätt{' '}
                    <span aria-hidden>{openedId === row.id ? '−' : '＋'}</span>
                  </span>
                </button>
                {openedId === row.id ? (
                  <p className="ra-history-note">
                    Det sparade detaljresultatet är inte tillgängligt här. Den här raden visar det
                    avslutade passet.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="ra-empty">Inga avslutade pass än.</p>
        )}
        {openedId && !selected ? (
          <p role="status">Det valda passet finns inte längre i historiken.</p>
        ) : null}
        {historyOnly && !progress.history.length ? (
          <button type="button" className="ra-primary" onClick={() => actions.go('ova')}>
            Till Öva ↗
          </button>
        ) : null}
        <button type="button" onClick={() => actions.go('provpass')}>
          Provpassresultat finns under Provpass ↗
        </button>
      </section>
    </div>
  )
}
