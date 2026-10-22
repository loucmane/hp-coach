import { fmtScore } from '@/folio/lib/format'
import { IdagLink, type NavigateHref } from './IdagLead'
import { type HomeView, scaleLabel } from './idagView'

const score = (n: number | null) => (n == null ? '—' : fmtScore(n))

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
  const trap = view.traps.find((t) => t.rising) ?? view.traps[0]
  return (
    <aside className="fa-aside" aria-label="Översikt" data-fa-shade>
      <section className="fa-aside-block" aria-labelledby="fa-prog-h">
        <h2 className="fa-h3" id="fa-prog-h">
          <IdagLink className="fa-head-link" href="/progress" navigateHref={navigateHref}>
            Prognos <span aria-hidden>→</span>
          </IdagLink>
        </h2>
        {statsLoading ? null : p.total == null ? (
          <p className="fa-delta">Prognosen visas när du har svarat i båda delarna.</p>
        ) : (
          <>
            <div className="fa-prog-figure">
              <span className="fa-prog-n" aria-describedby={p.caveat ? 'fa-caveat' : undefined}>
                {fmtScore(p.total)}
                {p.caveat ? <sup aria-hidden>*</sup> : null}
              </span>
              <span className="fa-prog-of">av 2,0</span>
            </div>
            {p.deltaLabel ? <p className="fa-delta">{p.deltaLabel}</p> : null}
            <p className="fa-halves">
              Verbal {score(p.verbal)} · Kvant {score(p.quant)}
            </p>
            <div className="fa-scale" role="img" aria-label={scaleLabel(p)}>
              <span className="fa-scale-axis" />
              {p.low != null && p.high != null ? (
                <span
                  className="fa-scale-range"
                  style={{ left: `${p.low * 50}%`, width: `${(p.high - p.low) * 50}%` }}
                />
              ) : null}
              <span
                className="fa-scale-mark"
                style={{ left: `${Math.max(0, Math.min(2, p.total)) * 50}%` }}
              />
              {[0, 0.5, 1, 1.5, 2].map((value) => (
                <span key={value} className="fa-scale-tick" style={{ left: `${value * 50}%` }}>
                  {value === 0 ? '0' : fmtScore(value)}
                </span>
              ))}
            </div>
          </>
        )}
        {!statsLoading && p.caveat ? (
          <p className="fa-footnote" id="fa-caveat">
            <b aria-hidden>*</b>
            <span>{p.caveat}</span>
          </p>
        ) : null}
      </section>
      {trap ? (
        <section className="fa-aside-block" aria-labelledby="fa-trap-h">
          <h2 className="fa-h3" id="fa-trap-h">
            Din vanligaste fälla just nu
          </h2>
          <p className="fa-trap-meta">
            <b>{trap.section}</b>
            <span>
              {trap.count} {trap.count === 1 ? 'gång' : 'gånger'}
              {trap.rising ? <span> · ökar ↑</span> : null}
            </span>
          </p>
          <IdagLink
            className="fa-trap-name"
            href={trap.href}
            navigateHref={navigateHref}
            data-testid="top-trap-link"
          >
            {trap.name}
          </IdagLink>
          {trap.pattern ? <span className="fa-trap-pattern">{trap.pattern}</span> : null}
        </section>
      ) : null}
      {view.recent.length > 0 ? (
        <section className="fa-aside-block" aria-labelledby="fa-recent-h">
          <h2 className="fa-h3" id="fa-recent-h">
            Senaste passen
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
                  <span>{row.label}</span>
                  <span className="fa-score">
                    {row.correct}/{row.total}
                    <span className="fa-sr"> rätt</span>
                  </span>
                  <span className="fa-when">{row.when}</span>
                </IdagLink>
              </li>
            ))}
          </ul>
          <IdagLink
            className="fa-link"
            href="/historik"
            navigateHref={navigateHref}
            data-testid="home-recent-all"
          >
            Alla pass →
          </IdagLink>
        </section>
      ) : null}
    </aside>
  )
}
