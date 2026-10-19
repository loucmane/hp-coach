import { useId, useState } from 'react'
import { useDirectionData } from '../directionData'
import { fmtDelta, fmtScore } from '../r1Kit'
import type { FramstegView } from '../viewModel'
import { RelatedPasses } from './InstrumentProvpass'
import { Readout } from './parts'

const confidence = { low: 'Litet underlag', medium: 'Växande underlag', high: 'Stort underlag' }
const slug = (section: string) => section.toLowerCase().replace('ä', 'a')

export function InstrumentFramsteg({ initialHistory = false }: { initialHistory?: boolean }) {
  const { data, actions } = useDirectionData()
  const progress = data.framsteg
  const { prognosis, week } = progress
  const [view, setView] = useState<'overview' | 'history'>(initialHistory ? 'history' : 'overview')
  const [category, setCategory] = useState<'practice' | 'mock'>('practice')
  const [selected, setSelected] = useState<string | null>(null)
  const measured = progress.sections.filter(
    (section) => section.score != null && section.attempts90d > 0,
  )
  const focus =
    measured.length > 1
      ? progress.focus.find((section) => measured.some((row) => row.section === section))
      : undefined
  const history = progress.history.filter(
    (row) => row.kind === 'drill' || row.kind === 'adaptive_review',
  )
  const record = history.find((row) => row.id === selected)
  return (
    <div className="in-hub in-progress">
      <header className="in-greet">
        <h1 tabIndex={-1}>Framsteg</h1>
        <p>Avläs underlaget. Välj nästa övning.</p>
      </header>
      <fieldset className="in-pass-controls in-view-switch" aria-label="Visa framsteg">
        <button
          type="button"
          className="in-btn2"
          aria-pressed={view === 'overview'}
          onClick={() => setView('overview')}
        >
          Översikt
        </button>
        <button
          type="button"
          className="in-btn2"
          aria-pressed={view === 'history'}
          onClick={() => setView('history')}
        >
          Historik
        </button>
      </fieldset>
      <div hidden={view !== 'overview'}>
        <section className="in-directory" aria-label="Prognos och delprov">
          <div className="in-hub-lead in-progress-readout" data-testid="rd-framsteg-prognosis">
            <div className="in-queue-readouts">
              <Readout
                label="Prognos"
                value={prognosis.total == null ? '—' : fmtScore(prognosis.total)}
                unit="av 2,0"
              />
              <Readout
                label="Verbal"
                value={prognosis.verbal == null ? '—' : fmtScore(prognosis.verbal)}
              />
              <Readout
                label="Kvantitativ"
                value={prognosis.quant == null ? '—' : fmtScore(prognosis.quant)}
              />
            </div>
            {prognosis.total == null ? <p>Ingen prognos än — börja med en övning.</p> : null}
            {prognosis.low != null && prognosis.high != null ? (
              <p>
                Intervall {fmtScore(prognosis.low)}–{fmtScore(prognosis.high)}
              </p>
            ) : null}
            {prognosis.target != null ? <p>Ditt mål: {fmtScore(prognosis.target)}</p> : null}
            {prognosis.delta != null ? (
              <p>
                Förändring sedan förra veckan:{' '}
                <span className="in-num">{fmtDelta(prognosis.delta)}</span>
              </p>
            ) : null}
            {prognosis.caveat ? <p className="in-pass-caveat">{prognosis.caveat}</p> : null}
            <button
              type="button"
              className="in-btn"
              onClick={() =>
                focus ? actions.startDrill({ kind: 'section', section: focus }) : actions.go('ova')
              }
            >
              {focus ? `Öva ${focus}` : 'Till Öva'}
            </button>
          </div>
          <WeeklyTrend weekly={progress.weekly} />
          <table className="in-evidence-table in-progress-table">
            <caption>Delproven · senaste 90 dagarna</caption>
            <thead>
              <tr>
                <th scope="col">Delprov</th>
                <th scope="col">Poäng</th>
                <th scope="col">Underlag</th>
                <th scope="col">Veckoförändring</th>
                <th scope="col">Öva</th>
              </tr>
            </thead>
            <tbody>
              {progress.sections.map((section) => {
                const lesson = data.uppslag.sections.find(
                  (catalog) => catalog.section === section.section,
                )?.entries[0]
                return (
                  <tr
                    key={section.section}
                    data-testid={`rd-framsteg-section-${slug(section.section)}`}
                  >
                    <th scope="row">
                      {lesson ? (
                        <button
                          type="button"
                          className="in-link"
                          aria-label={`Läs om ${section.section}`}
                          onClick={() => actions.openLesson(lesson.id)}
                        >
                          {section.section} ↗
                        </button>
                      ) : (
                        section.section
                      )}
                      <span className="in-table-detail">{section.name}</span>
                    </th>
                    <td data-label="Poäng">
                      <span className="in-num">
                        {section.score == null ? '—' : fmtScore(section.score)}
                      </span>
                      {section.score != null && section.band != null ? (
                        <span className="in-table-detail">
                          ±{fmtScore(section.band)} · 95 % intervall
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Underlag">
                      {section.attempts90d} svar
                      <span className="in-table-detail">
                        {section.attempts90d ? confidence[section.confidence] : 'Ej övat'}
                      </span>
                    </td>
                    <td data-label="Veckoförändring">
                      {section.trend == null
                        ? 'Ej jämförbart'
                        : `${Math.round(section.trend * 100) > 0 ? '+' : ''}${Math.round(section.trend * 100)} procentenheter`}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="in-btn2"
                        aria-label={`Öva ${section.section}`}
                        onClick={() =>
                          actions.startDrill({ kind: 'section', section: section.section })
                        }
                      >
                        Öva →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
        <section
          className="in-pass-section"
          data-testid="rd-framsteg-week"
          aria-label="Veckans rytm"
        >
          <h2 className="in-cell-head">Veckans rytm</h2>
          <div className="in-pass-band in-progress-week">
            <Readout label="Svar den här veckan" value={`${week.attemptsThisWeek}`} />
            {week.accuracy7d != null ? (
              <Readout
                label="Rätt, senaste 7 dagarna"
                value={`${Math.round(week.accuracy7d * 100)} %`}
              />
            ) : null}
            {week.daysPractised != null ? (
              <Readout label="Övade dagar den här veckan" value={`${week.daysPractised}`} />
            ) : null}
            {week.minutesToday != null ? (
              <Readout label="Idag" value={`${week.minutesToday}`} unit="min" />
            ) : null}
          </div>
          <p className="in-pass-note">
            {week.streakDays > 0 ? `${week.streakDays} dagar i följd. ` : ''}Varje övning räknas. Du
            kan börja igen när det passar.
          </p>
          {week.goal != null && week.daysPractised != null ? (
            <p className="in-pass-note">
              {week.daysPractised} av {week.goal} planerade dagar.
            </p>
          ) : null}
          <Activity days={progress.days} />
        </section>
        <section className="in-pass-section" aria-label="Repetition">
          <h2 className="in-cell-head">Repetition</h2>
          <div className="in-pass-band in-progress-week">
            <Readout label="Redo nu" value={`${data.repetera.dueNow}`} />
            <Readout label="Aktiva missar" value={`${progress.totals.mistakesActive}`} />
            <Readout label="Återlärda" value={`${progress.totals.mistakesResolved}`} />
          </div>
          <button type="button" className="in-hub-door" onClick={actions.openRepetera}>
            Till Repetera →
          </button>
        </section>
      </div>
      <section
        hidden={view !== 'history'}
        data-testid="rd-framsteg-history"
        className="in-directory in-history"
        aria-label="Historik"
      >
        <h2 className="in-cell-head">Avslutade pass</h2>
        {data.provpass.hub.results.length ? (
          <fieldset className="in-pass-controls in-pass-band" aria-label="Typ av historik">
            <button
              type="button"
              className="in-btn2"
              aria-pressed={category === 'practice'}
              onClick={() => setCategory('practice')}
            >
              Övningar
            </button>
            <button
              type="button"
              className="in-btn2"
              aria-pressed={category === 'mock'}
              onClick={() => setCategory('mock')}
            >
              Provpass
            </button>
          </fieldset>
        ) : null}
        <div hidden={category !== 'practice'}>
          {history.length ? (
            <ul>
              {history.map((row, index) => (
                <li key={row.id} data-testid={`rd-framsteg-history-item-${index + 1}`}>
                  <button
                    type="button"
                    className="in-hub-door"
                    aria-expanded={selected === row.id}
                    onClick={() => setSelected((id) => (id === row.id ? null : row.id))}
                  >
                    <span>
                      <b>{row.label}</b>
                      <time dateTime={row.endedAt}>{row.when}</time>
                    </span>
                    <span className="in-num">
                      {row.correct}/{row.total} rätt
                    </span>
                    <span>Visa sammanfattning {selected === row.id ? '−' : '+'}</span>
                  </button>
                  {record?.id === row.id ? (
                    <div className="in-pass-band">
                      <h3>
                        {record.label} · {record.when}
                      </h3>
                      <p>
                        {record.correct} av {record.total} rätt. {record.section ?? 'Flera delprov'}
                        .
                      </p>
                      <p>Svaren för det här passet är inte tillgängliga här.</p>
                      <button type="button" className="in-btn2" onClick={() => setSelected(null)}>
                        Stäng sammanfattning
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="in-pass-band">
              <p>Inga avslutade pass än.</p>
              <button type="button" className="in-btn" onClick={() => actions.go('ova')}>
                Till Öva
              </button>
            </div>
          )}
        </div>
        {category === 'mock' ? (
          <RelatedPasses rows={data.provpass.hub.results} title="Avslutade provpass" />
        ) : null}
      </section>
    </div>
  )
}

function WeeklyTrend({ weekly }: { weekly: FramstegView['weekly'] }) {
  const title = useId()
  const description = useId()
  const measured = weekly.filter((point) => point.score != null)
  const x = (index: number) => 32 + (index / Math.max(1, weekly.length - 1)) * 520
  const y = (score: number) => 136 - (Math.max(0, Math.min(2, score)) / 2) * 112
  return (
    <section className="in-weekly" aria-label="Veckoutfall">
      <h2 className="in-cell-head">Veckoutfall · {weekly.length} veckor</h2>
      <p>Rättandelen per vecka × 2. Skala 0–2,0; detta är inte en normerad prognos.</p>
      {measured.length >= 2 ? (
        <svg viewBox="0 0 584 168" role="img" aria-labelledby={`${title} ${description}`}>
          <title id={title}>Veckoutfall på fast skala från 0 till 2,0</title>
          <desc id={description}>
            Luckor betyder att veckan saknar svar. Alla värden finns under Visa veckovärden.
          </desc>
          {[0, 1, 2].map((score) => (
            <g key={score}>
              <line x1="32" x2="552" y1={y(score)} y2={y(score)} className="in-trend-rule" />
              <text x="0" y={y(score) + 4}>
                {fmtScore(score)}
              </text>
            </g>
          ))}
          {weekly.map((point, index) =>
            point.score == null ? null : (
              <g key={point.weekStart}>
                {index > 0 && weekly[index - 1].score != null ? (
                  <line
                    x1={x(index - 1)}
                    y1={y(weekly[index - 1].score!)}
                    x2={x(index)}
                    y2={y(point.score)}
                    className="in-trend-line"
                  />
                ) : null}
                <circle cx={x(index)} cy={y(point.score)} r="3" />
              </g>
            ),
          )}
          <text x="32" y="162">
            {weekly[0]?.weekStart}
          </text>
          <text x="552" y="162" textAnchor="end">
            {weekly.at(-1)?.weekStart}
          </text>
        </svg>
      ) : (
        <p className="in-pass-note">Minst två veckor med svar behövs för en kurva.</p>
      )}
      <details className="in-pass-disclosure">
        <summary>Visa veckovärden</summary>
        <table className="in-week-table">
          <thead>
            <tr>
              <th scope="col">Vecka från</th>
              <th scope="col">Rättandel × 2</th>
            </tr>
          </thead>
          <tbody>
            {weekly.map((point) => (
              <tr key={point.weekStart}>
                <th scope="row">{point.weekStart}</th>
                <td>{point.score == null ? 'Inga svar' : fmtScore(point.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}

function Activity({ days }: { days: FramstegView['days'] }) {
  return (
    <div className="in-activity">
      <h3>Närvaro · {days.length} dagar</h3>
      <div className="in-activity-cells" aria-hidden>
        {days.map((day) => (
          <span key={day.date} data-level={day.n === 0 ? 0 : day.n < 10 ? 1 : day.n < 30 ? 2 : 3} />
        ))}
      </div>
      <p>Ljus till mörk: inga svar · 1–9 · 10–29 · 30 eller fler. Datum och antal finns nedan.</p>
      <details className="in-pass-disclosure">
        <summary>Visa dagar</summary>
        <ul className="in-activity-days">
          {days.map((day) => (
            <li key={day.date}>
              <time dateTime={day.date}>{day.date}</time>
              <span>{day.n} svar</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
