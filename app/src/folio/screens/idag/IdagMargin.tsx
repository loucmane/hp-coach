import { fmtScore } from '@/folio/lib/format'
import { RangeBand } from '@/folio/ui/RangeBand'
import { SecChip } from '@/folio/ui/SecChip'
import { IdagLink, type NavigateHref } from './IdagLead'
import { type HomeView, scaleLabel, weekLine } from './idagView'

export function IdagMargin({
  view,
  navigateHref,
  statsLoading,
}: {
  view: HomeView
  navigateHref: NavigateHref
  statsLoading?: boolean
}) {
  const p = view.prognosis
  const week = weekLine(view.week)
  return (
    <aside className="fa-aside" aria-label="Läget">
      <section className="fa-card" aria-labelledby="fa-prog-h">
        <IdagLink className="fa-card-link" href="/progress" navigateHref={navigateHref}>
          <h2 id="fa-prog-h">
            Prognos <span>Framsteg →</span>
          </h2>
          {statsLoading ? (
            <p className="fa-margin-copy" role="status">
              Laddar prognosen…
            </p>
          ) : p.total == null ? (
            <p className="fa-margin-copy">Prognosen visas när du har svarat i båda delarna.</p>
          ) : p.low != null && p.high != null ? (
            <>
              <p className="fa-big">
                <strong className="fa-prog-n">
                  {fmtScore(p.low)}–{fmtScore(p.high)}
                </strong>{' '}
                <small>av 2,0</small>
              </p>
              <RangeBand
                low={p.low}
                high={p.high}
                max={2}
                label={scaleLabel(p)}
                ticks={['0', '0,5', '1,0', '1,5', '2,0']}
              />
              <p className="fa-margin-copy">{p.basis}</p>
            </>
          ) : (
            <p className="fa-margin-copy">
              Prognosintervallet visas när underlaget är tillgängligt.
            </p>
          )}
          {!statsLoading && p.caveat ? <p className="fa-margin-copy">{p.caveat}</p> : null}
        </IdagLink>
      </section>
      <IdagLink className="fa-card" href="/konto" navigateHref={navigateHref}>
        <h2>
          {view.exam.label} <span>{view.exam.fullDateLabel}</span>
        </h2>
        {view.exam.daysLeft >= 0 ? (
          <p className="fa-big">
            <strong>{view.exam.daysLeft}</strong>{' '}
            <small>{view.exam.daysLeft === 1 ? 'dag' : 'dagar'}</small>
          </p>
        ) : (
          <p className="fa-margin-copy">Provet är skrivet.</p>
        )}
        {week ? <p className="fa-margin-copy">{week}. Varje dag räknas för sig.</p> : null}
      </IdagLink>
      {view.mock ? (
        <IdagLink className="fa-card" href={view.mock.href} navigateHref={navigateHref}>
          <h2>
            Nästa provpass <span>förslag</span>
          </h2>
          <p className="fa-margin-copy">
            {view.mock.dateLabel} · {view.mock.half}. Ett riktigt pass var {view.mock.interval}:e
            dag håller tempot ärligt.
          </p>
        </IdagLink>
      ) : null}
      {view.recent.length ? (
        <section className="fa-card fa-sessions" aria-labelledby="fa-recent-h">
          <h2 id="fa-recent-h">
            Senaste passen{' '}
            <IdagLink href="/historik" navigateHref={navigateHref} data-testid="home-recent-all">
              Historik →
            </IdagLink>
          </h2>
          <ul>
            {view.recent.map((row) => (
              <li key={row.id}>
                <IdagLink
                  className="fa-recent"
                  href={row.href}
                  navigateHref={navigateHref}
                  data-testid={`home-recent-pass-${row.id}`}
                >
                  {row.section ? (
                    <SecChip section={row.section} />
                  ) : (
                    <span className="fa-session-label">{row.label}</span>
                  )}{' '}
                  <strong>
                    {row.returning > 0 ? `${row.returning} kommer tillbaka` : 'Alla besvarade rätt'}
                  </strong>{' '}
                  <small>
                    {row.when}
                    {row.section && row.label !== row.section ? ` · ${row.label}` : ''}
                  </small>
                </IdagLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  )
}
