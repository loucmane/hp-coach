import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import type { PassOption } from '@/lib/mock'
import { HALF_LABEL, type HubView, type MatrixTerm, passKey, passName } from './provView'

export function ProvRegister({
  view,
  half,
  mode,
  ready,
  onHalfChange,
  onPick,
  onAuthentic,
}: {
  view: HubView
  half: MockHalf
  mode: MockMode
  ready: boolean
  onHalfChange: (half: MockHalf) => void
  onPick: (key: string) => void
  onAuthentic: () => void
}) {
  const cell = (pass: PassOption | undefined, number: number) =>
    pass ? (
      <button
        type="button"
        className="fa-prov-cell"
        data-testid={`prov-pass-${pass.examId}-${pass.provpass}`}
        aria-pressed={mode === 'authentic' && view.chosen === pass}
        aria-label={`${passName(pass)}, sett ${pass.seenBefore} av ${pass.presented}${view.suggested === pass ? ', föreslaget' : ''}`}
        disabled={!ready}
        onClick={() => onPick(passKey(pass))}
      >
        <span>P{number}</span>
        {pass.seenBefore > 0 ? (
          <span className="fa-prov-seen">
            <meter min={0} max={pass.presented} value={pass.seenBefore} aria-hidden="true" />
            {pass.seenBefore}/{pass.presented}
          </span>
        ) : view.suggested === pass && mode === 'authentic' ? (
          <span className="fa-prov-seen">förslag</span>
        ) : null}
        {pass.presented < 40 ? <small>{pass.presented} frågor</small> : null}
      </button>
    ) : (
      <span className="fa-prov-none">
        saknas<span className="fa-sr"> · P{number}</span>
      </span>
    )
  const term = (value: MatrixTerm) =>
    value.status === 'available' ? (
      <>
        <td>{cell(value.passes[0], 1)}</td>
        <td>{cell(value.passes[1], 2)}</td>
      </>
    ) : (
      <td colSpan={2}>
        <span className="fa-prov-none">
          {value.status === 'cancelled'
            ? 'inget vårprov · inställt'
            : value.status === 'counterpart'
              ? '—'
              : 'inte i frågebanken'}
        </span>
      </td>
    )
  return (
    <section className="fa-prov-register" aria-labelledby="fa-register-heading">
      <div className="fa-prov-register-head">
        <h2 id="fa-register-heading" tabIndex={-1}>
          Alla provtillfällen
        </h2>
        <fieldset className="fa-choices">
          <legend className="fa-sr">Halva</legend>
          {(['verbal', 'kvant'] as const).map((h) => (
            <button
              key={h}
              type="button"
              data-testid={`prov-half-${h}`}
              aria-pressed={half === h}
              onClick={() => onHalfChange(h)}
            >
              {HALF_LABEL[h]}
            </button>
          ))}
        </fieldset>
      </div>
      {mode === 'synthetic' ? (
        <button
          className="fa-link"
          type="button"
          data-testid="prov-mode-authentic"
          onClick={onAuthentic}
        >
          Visa föreslaget riktigt pass
        </button>
      ) : null}
      {!ready ? (
        <p className="fa-status" role="status">
          Laddar provpassen …
        </p>
      ) : view.matrix.length ? (
        <>
          <table className="fa-prov-matrix">
            <caption className="fa-sr">
              Alla provtillfällen · {HALF_LABEL[half]} halva · tidigare exponering
            </caption>
            <colgroup>
              <col className="fa-prov-year-col" />
              <col />
              <col />
              <col className="fa-prov-gap-col" />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">
                  <span className="fa-sr">År</span>
                </th>
                <th scope="colgroup" colSpan={2}>
                  Våren
                </th>
                <td />
                <th scope="colgroup" colSpan={2}>
                  Hösten
                </th>
              </tr>
            </thead>
            <tbody>
              {view.matrix.map((row) => (
                <tr key={row.key}>
                  <th scope="row">
                    {row.year}
                    {row.detail ? <small>{row.detail}</small> : null}
                  </th>
                  {term(row.spring)}
                  <td className="fa-prov-gap" />
                  {term(row.autumn)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="fa-prov-legend">
            {view.sittings.length} provtillfällen. En siffra visas bara där du sett frågor; en ruta
            utan siffra är ett pass du inte öppnat.
            {view.matrix.some((r) => r.spring.status === 'cancelled')
              ? ' Inställda prov är märkta i tabellen.'
              : ''}
          </p>
        </>
      ) : (
        <p className="fa-status">Inga riktiga pass tillgängliga just nu.</p>
      )}
    </section>
  )
}
