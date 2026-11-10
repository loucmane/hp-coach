import type { MockResultRow } from '@/api/hooks/useMockResults'
import { ProvLink } from './ProvLead'
import { historyLabel, type NavigateHref, type ResultsState, recentResults } from './provView'

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
  const last = recentResults(results.data ?? [])[0]
  const label = last ? historyLabel(last) : null
  return (
    <aside className="fa-prov-side" aria-label="Om provpasset">
      {last && label ? (
        <ProvLink
          className="fa-prov-card"
          href={`/prov?result=${last.id}`}
          navigateHref={navigateHref}
        >
          <h2>
            Senaste provpasset <span>Resultat →</span>
          </h2>
          <div className="fa-prov-past">
            <span>
              {label.half} · {last.mode === 'synthetic' ? 'genererat pass' : 'riktigt pass'}
            </span>
            <b>
              {last.correct} av {last.presented}
            </b>
            <small>
              {label.when} · {last.presented} frågor
            </small>
            {last.mode === 'synthetic' ? <small>Ingen poäng</small> : null}
          </div>
        </ProvLink>
      ) : (
        <section className="fa-prov-card">
          <h2>Senaste provpasset</h2>
          <p role={results.isLoading || results.isError ? 'status' : undefined}>
            {results.isLoading
              ? 'Laddar tidigare pass …'
              : results.isError
                ? 'Kunde inte hämta tidigare pass just nu.'
                : 'Inga pass ännu — det första blir din baslinje.'}
          </p>
        </section>
      )}
      <section className="fa-prov-card">
        <h2 className="fa-h3">Poängen</h2>
        <p className="fa-margin-note">
          Bara en hel halva, två riktiga pass med paus som på provdagen, får en poäng ur UHR:s
          normeringstabell, och den visas som ett spann. Ett enskilt pass visar hur många rätt och
          ett träffintervall.
        </p>
      </section>
      <section className="fa-prov-card">
        <h2 className="fa-h3">Klockan</h2>
        <p className="fa-margin-note">
          Du kan dölja klockan under passet. Fem minuter före slutet får du en lugn påminnelse om
          vilka frågor som är obesvarade. Båda går att ändra i Konto.
        </p>
      </section>
    </aside>
  )
}
