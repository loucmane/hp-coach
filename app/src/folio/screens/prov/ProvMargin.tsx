import type { MockResultRow } from '@/api/hooks/useMockResults'
import { ProvLink } from './ProvLead'
import {
  historyLabel,
  type NavigateHref,
  type ResultsState,
  RULES,
  recentResults,
} from './provView'

export function ResultRows({
  rows,
  navigateHref,
}: {
  rows: readonly MockResultRow[]
  navigateHref: NavigateHref
}) {
  return (
    <ol className="fa-results">
      {rows.map((r) => {
        const label = historyLabel(r)
        return (
          <li key={r.id}>
            <ProvLink
              className="fa-result-row"
              href={`/prov?result=${r.id}`}
              navigateHref={navigateHref}
              aria-label={`${label.half}, ${r.correct} av ${r.presented} rätt, ${label.when}. Visa resultatet`}
            >
              <span>{label.half}</span>
              <span>
                {r.correct}/{r.presented}
              </span>
              <span className="fa-meta">{label.when}</span>
            </ProvLink>
          </li>
        )
      })}
    </ol>
  )
}
export function ProvMargin({
  results,
  navigateHref,
}: {
  results: ResultsState
  navigateHref: NavigateHref
}) {
  const rows = recentResults(results.data ?? []).slice(0, 3)
  return (
    <aside className="fa-aside" aria-label="Om provpasset">
      <section>
        <h2 className="fa-h3">Villkoren</h2>
        <p className="fa-margin-note">{RULES.join(' ')}</p>
      </section>
      <section>
        <h2 className="fa-h3">Poängen</h2>
        <p className="fa-margin-note">
          Ett pass ur ett tidigare prov får en härledd poäng från UHR:s normeringstabell när
          tabellen finns. Annars visas en linjär skattning.
        </p>
      </section>
      <section>
        <h2 className="fa-h3">Senaste passen</h2>
        {rows.length ? (
          <ResultRows rows={rows} navigateHref={navigateHref} />
        ) : (
          <p
            className="fa-margin-note"
            role={results.isLoading || results.isError ? 'status' : undefined}
          >
            {results.isLoading
              ? 'Laddar tidigare pass …'
              : results.isError
                ? 'Kunde inte hämta tidigare pass just nu.'
                : 'Inga pass ännu — det första blir din baslinje.'}
          </p>
        )}
      </section>
    </aside>
  )
}
