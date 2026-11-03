import { useMockResults } from '@/api/hooks/useMockResults'
import type { SessionHistoryRow } from '@/api/hooks/useSessions'
import { FramstegLink, type NavigateHref } from './FramstegReport'
import { buildHistorikView, type HistorikRow } from './historikView'
import './historik.css'

type HistoryQuery = {
  data?: SessionHistoryRow[]
  isPending?: boolean
  isError?: boolean
  refetch: () => unknown
}

export default function FolioHistorik({
  history,
  navigateHref,
}: {
  history: HistoryQuery
  navigateHref: NavigateHref
}) {
  const results = useMockResults()
  const view = buildHistorikView(history.data ?? [], results.data ?? [])
  return (
    <div className="fa-historik" data-testid="folio-historik">
      <div className="fa-masthead">
        <FramstegLink className="fa-link" href="/progress" navigateHref={navigateHref}>
          Framsteg
        </FramstegLink>
        <span aria-hidden>·</span>
        <span>Historik</span>
      </div>
      <h1 className="fa-greet">Tidigare pass.</h1>
      <p className="fa-day">Öppna ett pass för att se dina svar och förklaringar igen.</p>
      <section className="fa-section" aria-labelledby="fa-historik-practice">
        <h2 className="fa-h2" id="fa-historik-practice">
          Övningspass
        </h2>
        <QueryStatus query={history} kind="övningspass" />
        {view.weeks.map((week) => (
          <div className="fa-week" key={week.key}>
            <h3 className="fa-week-heading">{week.label}</h3>
            <HistoryRows rows={week.rows} prefix="historik-pass" navigateHref={navigateHref} />
          </div>
        ))}
        {!history.isPending && !history.isError && view.weeks.length === 0 ? (
          <div className="fa-empty">
            <p>Dina avslutade övningspass visas här.</p>
            <FramstegLink
              className="fa-link"
              href="/ova"
              navigateHref={navigateHref}
              data-testid="historik-empty-cta"
            >
              Öva →
            </FramstegLink>
          </div>
        ) : null}
      </section>
      {view.provpass.length > 0 || results.isPending || results.isError ? (
        <section className="fa-section" aria-labelledby="fa-historik-mocks">
          <h2 className="fa-h2" id="fa-historik-mocks">
            Provpass
          </h2>
          <QueryStatus query={results} kind="provpass" />
          <HistoryRows
            rows={view.provpass}
            prefix="historik-provpass"
            navigateHref={navigateHref}
          />
        </section>
      ) : null}
    </div>
  )
}

function QueryStatus({
  query,
  kind,
}: {
  query: Pick<HistoryQuery, 'isPending' | 'isError' | 'refetch'>
  kind: 'övningspass' | 'provpass'
}) {
  if (query.isError)
    return (
      <div className="fa-status">
        <p role="status">Kunde inte uppdatera {kind}en.</p>
        <button
          type="button"
          className="fa-link"
          onClick={() => {
            void query.refetch()
          }}
        >
          Försök igen
        </button>
      </div>
    )
  if (query.isPending)
    return (
      <p className="fa-status" role="status">
        Laddar {kind} …
      </p>
    )
  return null
}

function HistoryRows({
  rows,
  prefix,
  navigateHref,
}: {
  rows: HistorikRow[]
  prefix: string
  navigateHref: NavigateHref
}) {
  if (!rows.length) return null
  return (
    <ul className="fa-history-list">
      {rows.map((row) => (
        <li key={row.id}>
          <FramstegLink
            className="fa-history-row"
            href={row.href}
            navigateHref={navigateHref}
            data-testid={`${prefix}-${row.id}`}
          >
            <span className="fa-history-date">{row.date}</span>
            <span className="fa-history-label">{row.label}</span>
            <span className="fa-history-score">
              {row.score}
              <span className="fa-sr"> rätt</span>
            </span>
          </FramstegLink>
        </li>
      ))}
    </ul>
  )
}
