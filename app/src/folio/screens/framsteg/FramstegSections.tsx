import { FramstegLink, type NavigateHref } from './FramstegReport'
import { FIRST_TRY_NOTE, type FramstegView, RETRY_LINE } from './framstegView'
import { TrendChart } from './TrendChart'

export function FramstegSections({
  view,
  navigateHref,
  phone,
}: {
  view: FramstegView
  navigateHref: NavigateHref
  phone: boolean
}) {
  return (
    <>
      <section className="fa-section" aria-labelledby="fa-fr-up-h" data-fa-shade>
        <div className="fa-section-head">
          <h2 className="fa-h2" id="fa-fr-up-h">
            Nästa steg uppåt
          </h2>
          <span className="fa-meta">ett steg per delprov</span>
        </div>
        <ol className="fa-up">
          {view.sections.map((s) => (
            <li key={s.section}>
              <FramstegLink
                className="fa-up-item"
                href={s.up.href}
                navigateHref={navigateHref}
                data-testid={`framsteg-up-${s.section}`}
              >
                <span className="fa-up-head">
                  <span className="fa-up-code">
                    <i className="fa-sec-mark" aria-hidden />
                    {s.section}
                    <span className="fa-sr">, {s.name}</span>
                  </span>
                  {s.up.level ? <span className="fa-up-level">{s.up.level}</span> : null}
                </span>
                <span className="fa-up-text">{s.up.text}</span>
                <span className="fa-link">
                  {s.up.label} <span aria-hidden>→</span>
                </span>
              </FramstegLink>
            </li>
          ))}
        </ol>
        <FramstegLink className="fa-link" href={view.mixedHref} navigateHref={navigateHref}>
          Blandad övning · alla åtta delprov →
        </FramstegLink>
      </section>
      <section className="fa-section" aria-labelledby="fa-fr-chart-h" data-fa-shade>
        <h2 className="fa-h2" id="fa-fr-chart-h">
          Poäng per vecka
        </h2>
        <TrendChart weekly={view.weekly} phone={phone} />
      </section>
      <section className="fa-section" aria-labelledby="fa-fr-sections-h" data-fa-shade>
        <div className="fa-section-head">
          <h2 className="fa-h2" id="fa-fr-sections-h">
            Delproven
          </h2>
          <span className="fa-meta">underlag: 90 dagar</span>
        </div>
        <div className="fa-section-ledger">
          <div className="fa-ledger-head" aria-hidden>
            <span>Delprov</span>
            <span>Prognos · ±</span>
            <span>Trend</span>
            <span>Underlag</span>
          </div>
          <ul>
            {view.sections.map((s) => (
              <li key={s.section}>
                <FramstegLink
                  className="fa-section-row"
                  href={s.href}
                  navigateHref={navigateHref}
                  data-testid={`progress-section-${s.section}`}
                  aria-describedby={s.marked ? 'fa-fr-caveat' : undefined}
                >
                  <span className="fa-section-code">
                    <i className="fa-sec-mark" aria-hidden />
                    {s.section}
                    <span className="fa-sr">, {s.name}</span>
                  </span>
                  <span className="fa-section-score">
                    {s.scoreLabel}
                    {s.marked && s.score != null ? <sup aria-hidden>*</sup> : null}
                    {s.bandLabel ? (
                      <span className="fa-band" data-testid={`progress-band-${s.section}`}>
                        {s.bandLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="fa-section-trend">
                    <span className="fa-sr">Trend: </span>
                    {s.trend}
                  </span>
                  <span className="fa-section-basis">
                    underlag: {s.attempts} svar
                    {s.staleLabel ? <span className="fa-table-sub">{s.staleLabel}</span> : null}
                  </span>
                </FramstegLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {view.focus.length > 1 ? (
        <section className="fa-section" aria-labelledby="fa-fr-next-h" data-fa-shade>
          <h2 className="fa-h2" id="fa-fr-next-h">
            Sedan
          </h2>
          <ol className="fa-following" start={2}>
            {view.focus.slice(1).map((s) => (
              <li key={s.section}>
                <FramstegLink
                  className="fa-contents-entry"
                  href={s.href}
                  navigateHref={navigateHref}
                >
                  <span>{s.section}</span>
                  <span className="fa-contents-reason">{s.reason}</span>
                  <span>Öva {s.section} →</span>
                </FramstegLink>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <section className="fa-section" aria-labelledby="fa-fr-history-h" data-fa-shade>
        <div className="fa-section-head">
          <h2 className="fa-h2" id="fa-fr-history-h">
            Historik
          </h2>
          <FramstegLink
            className="fa-link"
            href="/historik"
            navigateHref={navigateHref}
            data-testid="progress-historik"
          >
            Alla pass →
          </FramstegLink>
        </div>
        {view.historyState !== 'ready' ? (
          <p className="fa-empty" role="status">
            {view.historyState === 'error' ? RETRY_LINE : 'Laddar dina pass…'}
          </p>
        ) : view.history.length ? (
          <ol className="fa-history">
            {view.history.map((row) => (
              <li key={row.id}>
                <FramstegLink
                  className="fa-history-row"
                  href={row.href}
                  navigateHref={navigateHref}
                  data-testid={`framsteg-history-${row.id}`}
                >
                  <span className="fa-history-day">{row.when}</span>
                  <span className="fa-history-kind">{row.label}</span>
                  <span className="fa-history-score">
                    {row.correct}/{row.total}
                    <span className="fa-sr"> rätt</span>
                  </span>
                </FramstegLink>
              </li>
            ))}
          </ol>
        ) : (
          <p className="fa-empty">Inga avslutade pass än. Din nästa övning landar här.</p>
        )}
      </section>
      <div className="fa-footnotes">
        {view.prognosis.caveat ? (
          <p className="fa-footnote" id="fa-fr-caveat">
            <b aria-hidden>*</b>
            <span>{view.prognosis.caveat}</span>
          </p>
        ) : null}
        <p className="fa-footnote" data-testid="progress-first-try-note">
          {FIRST_TRY_NOTE}
        </p>
      </div>
    </>
  )
}
