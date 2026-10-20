import { ArrowRight } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtDelta, fmtScore } from '@/components/devbake/redesign/r1Kit'
import type { FramstegView } from '@/components/devbake/redesign/viewModel'
import { Hub, type HubProps } from './LagerOva'
import { ResultHistory } from './LagerProvpass'

const score = (n: number | null) => (n == null ? 'Inte skattad' : fmtScore(n))
const date = (iso: string) =>
  new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export function LagerFramsteg(props: HubProps) {
  const { data, actions } = useDirectionData()
  const stats = data.framsteg
  const p = stats.prognosis
  const [history, setHistory] = useState(false)
  const tabId = useId()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const focus = stats.focus
    .map((section) => stats.sections.find((s) => s.section === section && s.attempts90d > 0))
    .find(Boolean)
  const hasPrognosis = p.total != null
  return (
    <Hub {...props} title="Framsteg">
      <div
        className="la-seg la-progress-tabs"
        role="tablist"
        aria-label="Visa framsteg"
        data-rd-keyscope
      >
        {['Översikt', 'Historik'].map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            ref={(el) => {
              tabs.current[i] = el
            }}
            id={`${tabId}-tab-${i}`}
            aria-controls={`${tabId}-panel-${i}`}
            aria-selected={Number(history) === i}
            tabIndex={Number(history) === i ? 0 : -1}
            onClick={() => setHistory(i === 1)}
            onKeyDown={(event) => {
              const next =
                event.key === 'ArrowRight' || event.key === 'ArrowLeft'
                  ? 1 - i
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? 1
                      : null
              if (next == null || event.altKey || event.ctrlKey || event.metaKey) return
              event.preventDefault()
              setHistory(next === 1)
              tabs.current[next]?.focus()
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${tabId}-panel-0`}
        aria-labelledby={`${tabId}-tab-0`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: tab panels with leading text need a keyboard entry point
        tabIndex={0}
        hidden={history}
      >
        <div className="la-hub-grid la-progress-top">
          <section
            className="la-sheet la-progress-evidence"
            data-depth="1"
            data-testid="rd-framsteg-prognosis"
          >
            <h2 className="la-h">Din prognos</h2>
            {hasPrognosis ? (
              <p className="la-prog-n">
                {fmtScore(p.total!)}
                <small>av 2,0</small>
              </p>
            ) : (
              <p className="la-progress-empty">
                Ingen prognos än — svara på några frågor så börjar den här sidan leva.
              </p>
            )}
            <p>
              Verbal {score(p.verbal)} · Kvant {score(p.quant)}
            </p>
            {p.low != null && p.high != null ? (
              <p>
                Intervall {fmtScore(p.low)}–{fmtScore(p.high)}
              </p>
            ) : null}
            {p.delta != null ? <p>{fmtDelta(p.delta)} sedan förra veckan</p> : null}
            {p.target != null ? <p>Målnivå {fmtScore(p.target)}</p> : null}
            {p.caveat ? <p className="la-caveat">{p.caveat}</p> : null}
            <WeeklySeries weekly={stats.weekly} />
          </section>
          <section className="la-sheet la-progress-focus" data-depth="2">
            <span className="la-chip">Nästa steg</span>
            <h2 className="la-resume-title">
              {hasPrognosis && focus
                ? `Plats för ${focus.section}.`
                : hasPrognosis
                  ? 'Fortsätt utforska.'
                  : 'Börja med en övning.'}
            </h2>
            <p>
              {hasPrognosis && focus
                ? `${focus.name} är ett föreslaget fokus utifrån din övning. Underlaget omfattar ${focus.attempts90d} svar de senaste 90 dagarna.`
                : 'Välj ett delprov i Öva och bygg vidare i din takt.'}
            </p>
            <button
              type="button"
              className="la-btn"
              onClick={() =>
                hasPrognosis && focus
                  ? actions.startDrill({ kind: 'section', section: focus.section })
                  : actions.go('ova')
              }
            >
              {hasPrognosis && focus ? `Öva ${focus.section}` : 'Till Öva'}
              <ArrowRight size={18} aria-hidden />
            </button>
          </section>
        </div>
        <section className="la-sheet la-progress-ledger" data-depth="1">
          <h2 className="la-h">Delproven</h2>
          <p>Skattningar utifrån de senaste 90 dagarna. Underlaget kan vara olika stort.</p>
          <div className="la-section-ledger">
            {stats.sections.map((s) => (
              <div
                className="la-section-evidence"
                key={s.section}
                data-testid={`rd-framsteg-section-${s.section.toLowerCase().replace('ä', 'a')}`}
              >
                <div>
                  <b className="la-chip la-sec" data-sec={s.section}>
                    {s.section}
                  </b>
                  <span>{s.name}</span>
                </div>
                <div>
                  <strong>{s.score == null ? 'Inte övat än' : fmtScore(s.score)}</strong>
                  {s.score != null && s.band != null ? (
                    <span>± {fmtScore(s.band)} · 95 % intervall</span>
                  ) : null}
                </div>
                <div>
                  <span>{s.attempts90d} svar</span>
                  <span>
                    {s.daysSince == null
                      ? 'Inget tidigare övningstillfälle'
                      : s.daysSince === 0
                        ? 'Övat idag'
                        : `${s.daysSince} dagar sedan`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section
          className="la-sheet la-progress-rhythm"
          data-depth="1"
          data-testid="rd-framsteg-week"
        >
          <h2 className="la-h">Övning i din takt</h2>
          <p>
            {stats.week.attemptsThisWeek} svar den här veckan
            {stats.week.accuracy7d != null
              ? ` · ${Math.round(stats.week.accuracy7d * 100)} % rätt`
              : ''}
            {stats.week.daysPractised != null
              ? ` · ${stats.week.daysPractised} dagar med övning`
              : ''}
          </p>
          {stats.week.minutesToday != null ? (
            <p>
              {stats.week.minutesToday} minuter idag
              {stats.week.goal != null ? ` · veckans mål ${stats.week.goal} minuter` : ''}
            </p>
          ) : null}
          <h3 className="la-eyebrow">Närvaro · senaste tolv veckorna</h3>
          {stats.days.length ? (
            <>
              <div className="la-attendance" aria-hidden>
                {stats.days.map((day) => (
                  <span
                    key={day.date}
                    data-level={day.n === 0 ? 0 : day.n < 10 ? 1 : day.n < 30 ? 2 : 3}
                    title={`${date(day.date)}: ${day.n} svar`}
                  />
                ))}
              </div>
              <p>
                {stats.days.filter((day) => day.n > 0).length} dagar med övning av{' '}
                {stats.days.length} redovisade dagar. Varje tillfälle räknas.
              </p>
              <details>
                <summary>Visa datum och antal svar</summary>
                <ul className="la-attendance-list">
                  {stats.days.map((day) => (
                    <li key={day.date}>
                      <time dateTime={day.date}>{date(day.date)}</time>
                      <span>{day.n} svar</span>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          ) : (
            <p>Närvarouppgifter saknas.</p>
          )}
          <p>
            {stats.totals.attempts} svar totalt · {stats.totals.drills} övningar
          </p>
          <p>
            {stats.totals.mistakesActive} aktiva missar · {stats.totals.mistakesResolved} avklarade
            · {data.repetera.dueNow} redo att repetera nu
          </p>
        </section>
      </div>
      <section
        className="la-sheet la-progress-history"
        data-depth="1"
        data-testid="rd-framsteg-history"
        role="tabpanel"
        id={`${tabId}-panel-1`}
        aria-labelledby={`${tabId}-tab-1`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: tab panels with leading text need a keyboard entry point
        tabIndex={0}
        hidden={!history}
      >
        <h2 className="la-h">Historik</h2>
        <h3 className="la-eyebrow">Övning och repetition</h3>
        {stats.history.length ? (
          <ul>
            {stats.history.map((row, i) => (
              <li
                className="la-history-row"
                data-testid={`rd-framsteg-history-item-${i + 1}`}
                key={row.id}
              >
                <span>
                  <b>{row.label}</b>
                  <time dateTime={row.endedAt}>{row.when}</time>
                </span>
                <span>
                  {row.correct} av {row.total} rätt
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Inga avslutade pass än.</p>
        )}
        <h3 className="la-eyebrow">Provpass</h3>
        <ResultHistory rows={data.provpass.hub.results} />
      </section>
    </Hub>
  )
}

function WeeklySeries({ weekly }: Pick<FramstegView, 'weekly'>) {
  const valid = weekly.filter((week) => week.score != null)
  if (valid.length < 2)
    return <p className="la-caveat">Veckokurvan visas när minst två veckor har en skattning.</p>
  const x = (i: number) => 16 + (i * 288) / Math.max(1, weekly.length - 1)
  const y = (value: number) => 116 - value * 48
  // Each missing week ends the path. It never becomes zero or a connecting segment.
  const path = weekly
    .map((week, i) =>
      week.score == null
        ? ''
        : `${i === 0 || weekly[i - 1].score == null ? 'M' : 'L'}${x(i)},${y(week.score)}`,
    )
    .join(' ')
  return (
    <figure className="la-weekly-series">
      <figcaption>
        Veckovis skattning · {fmtScore(valid[0].score!)} till{' '}
        {fmtScore(valid[valid.length - 1].score!)}. Luckor betyder att underlag saknas.
      </figcaption>
      <svg viewBox="0 0 320 136" aria-hidden="true">
        <path d="M16,20 H304 M16,68 H304 M16,116 H304" className="la-trend-grid" />
        <path d={path} className="la-trend-line" />
        {weekly.map((week, i) =>
          week.score == null ? null : (
            <circle key={week.weekStart} cx={x(i)} cy={y(week.score)} r="3.5" />
          ),
        )}
      </svg>
      <details>
        <summary>Visa veckornas värden</summary>
        <table className="la-ledger">
          <thead>
            <tr>
              <th scope="col">Veckan från</th>
              <th scope="col">Skattning</th>
            </tr>
          </thead>
          <tbody>
            {weekly.map((week) => (
              <tr key={week.weekStart}>
                <th scope="row">
                  <time dateTime={week.weekStart}>{date(week.weekStart)}</time>
                </th>
                <td>{week.score == null ? 'Underlag saknas' : fmtScore(week.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
