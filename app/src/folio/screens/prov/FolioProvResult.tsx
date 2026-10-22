import type { Question } from '@/data/questions'
import { useViewport } from '@/hooks/useViewport'
import { ProvLink, usePrimaryEnter } from './ProvLead'
import { ResultRows } from './ProvMargin'
import {
  buildResultView,
  formatMs,
  HALF_LABEL,
  type NavigateHref,
  type ResultFlags,
  type ResultsState,
  scoreText,
} from './provView'
import { ResultErrata } from './ResultErrata'
import { useProvResultExtras } from './useProvResultExtras'
import './prov.css'

export type FolioProvResultProps = {
  resultId: number
  results: ResultsState
  bank: readonly Question[] | null
  flags: ResultFlags | null
  navigateHref: NavigateHref
}
export default function FolioProvResult(props: FolioProvResultProps) {
  const row = props.results.data?.find((r) => r.id === props.resultId)
  // The route keys this screen by result id, keeping asynchronous extras and
  // expanded facit local to the result being read.
  const extras = useProvResultExtras(row)
  const phone = useViewport() === 'phone'
  const primary = usePrimaryEnter<HTMLAnchorElement>(!!row)
  if (!row)
    return (
      <div className="fa-prov fa-not-found" data-testid="prov-result-not-found">
        <h1 className="fa-greet">
          {props.results.isLoading
            ? 'Laddar resultatet …'
            : props.results.isError
              ? 'Resultatet kunde inte hämtas.'
              : 'Resultatet hittades inte.'}
        </h1>
        <ProvLink className="fa-link" href="/prov" navigateHref={props.navigateHref}>
          Till Provpass
        </ProvLink>
      </div>
    )
  const view = buildResultView({
    row,
    bank: props.bank ?? [],
    ...extras,
    flags: props.flags,
    history: props.results.data,
  })
  const errataProps = {
    bank: props.bank,
    answers: extras.answers,
    attemptsLoading: extras.attemptsLoading,
    attemptsError: extras.attemptsError,
  }
  return (
    <div className={`fa-prov ${phone ? 'fa-phome' : 'fa-home'}`} data-testid="mock-result">
      <div className="fa-masthead">
        <span className="fa-label">Provpass · Resultat</span>
      </div>
      <div className="fa-page-main">
        <span className="fa-result-mark" aria-hidden>
          ⁂
        </span>
        <h1 className="fa-greet">Provpasset klart.</h1>
        <p className="fa-day">
          {HALF_LABEL[row.half]}, {row.mode === 'authentic' ? 'riktigt pass' : 'genererat pass'}. Du
          lämnade in efter {formatMs(row.durationMs)}.
        </p>
        <section className="fa-resume" aria-label="Resultatet">
          <div className="fa-result-figure">
            <span
              className="fa-score"
              data-testid="mock-result-score"
              aria-describedby="fa-prov-footnote"
            >
              {scoreText(view.score)}
              <sup aria-hidden>*</sup>
            </span>
            <span className="fa-score-of">{view.scoreLabel}</span>
          </div>
          <p className="fa-lead-sub" data-testid="mock-result-raw">
            {row.correct} av {row.presented} rätt
          </p>
          {row.presented < 40 ? (
            <p className="fa-kallelse">
              {40 - row.presented} frågor saknas i det här passet, så det rättades på{' '}
              {row.presented}.
            </p>
          ) : null}
          {view.score != null ? (
            <div
              className="fa-scale"
              role="img"
              aria-label={`${scoreText(view.score)} på skalan 0 till 2,0`}
            >
              <div className="fa-scale-track">
                <span className="fa-scale-mark" style={{ left: `${(view.score / 2) * 100}%` }} />
              </div>
              <div className="fa-scale-ticks" aria-hidden>
                <span>0</span>
                <span>1,0</span>
                <span>2,0</span>
              </div>
            </div>
          ) : null}
          <div className="fa-resume-foot">
            <ProvLink
              ref={primary}
              className="fa-btn fa-btn--big"
              href={view.primaryHref}
              navigateHref={props.navigateHref}
            >
              {view.primaryLabel} <kbd aria-hidden>↵</kbd>
            </ProvLink>
          </div>
          {view.missed.length || view.flaggedRight.length ? (
            <p className="fa-hint">
              Missarna och de besvarade markerade frågorna finns nu i Repetera.
            </p>
          ) : null}
        </section>
        {view.pattern ? (
          <section className="fa-section fa-res-pattern" data-testid="prov-res-pattern">
            <h2 className="fa-h2">{view.pattern.title}</h2>
            <p className="fa-pattern-name">{view.pattern.name}</p>
            <ProvLink
              className="fa-link"
              href={view.pattern.href}
              navigateHref={props.navigateHref}
            >
              Öva {view.pattern.section} <span aria-hidden>→</span>
            </ProvLink>
          </section>
        ) : null}
        <section className="fa-section" aria-labelledby="fa-sections-heading">
          <div className="fa-section-head">
            <h2 className="fa-h2" id="fa-sections-heading">
              Per delprov
            </h2>
            <span className="fa-meta">i provets ordning</span>
          </div>
          <table className="fa-table fa-res-table">
            <caption className="fa-sr">Rätt, tid och UHR:s rekommenderade tid per delprov</caption>
            <thead>
              <tr>
                <th scope="col">Delprov</th>
                <th scope="col">Rätt</th>
                <th scope="col">Tid</th>
                <th scope="col">UHR:s tid</th>
                {!phone ? <th scope="col">Tempo</th> : null}
              </tr>
            </thead>
            <tbody>
              {view.sections.map((s) => (
                <tr key={s.section} data-testid={`mock-result-pace-${s.section}`}>
                  <th scope="row">{s.section}</th>
                  <td>
                    {s.correct}/{s.presented}
                  </td>
                  <td>
                    {formatMs(s.timeMs)}
                    {phone ? (
                      <span
                        className="fa-table-sub"
                        data-testid={`mock-result-pace-note-${s.section}`}
                      >
                        {s.note}
                      </span>
                    ) : null}
                  </td>
                  <td>{s.uhrMs == null ? '—' : formatMs(s.uhrMs)}</td>
                  {!phone ? (
                    <td data-testid={`mock-result-pace-note-${s.section}`}>{s.note}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="fa-footnote">
            UHR:s tid är skalad efter antalet frågor när delprovet är kortare än provhäftets.
          </p>
        </section>
        <section className="fa-section" aria-labelledby="fa-misses-heading">
          <div className="fa-section-head">
            <h2 className="fa-h2" id="fa-misses-heading">
              Missarna
            </h2>
            <span className="fa-meta">
              {view.missed.length} av {row.presented}
            </span>
          </div>
          <p className="fa-kallelse">{view.blanks} obesvarade</p>
          {view.missed.length ? (
            <ResultErrata qids={view.missed} {...errataProps} />
          ) : (
            <p className="fa-empty">Inga missar i det här passet.</p>
          )}
        </section>
        {view.flaggedRight.length ? (
          <section
            className="fa-section"
            data-testid="prov-res-flagged"
            aria-labelledby="fa-flags-heading"
          >
            <div className="fa-section-head">
              <h2 className="fa-h2" id="fa-flags-heading">
                Markerade men rätt
              </h2>
              <span className="fa-meta">{view.flaggedRight.length}</span>
            </div>
            <p className="fa-kallelse">Du var osäker – värda en repris.</p>
            <ResultErrata qids={view.flaggedRight} {...errataProps} />
          </section>
        ) : null}
        <p className="fa-footnote" id="fa-prov-footnote">
          * {view.footnote}
        </p>
        {view.caveat ? <p className="fa-footnote">{view.caveat}</p> : null}
      </div>
      <aside className="fa-aside" aria-label="Tidigare resultat">
        <section data-testid="mock-result-history">
          <h2 className="fa-h3">Tidigare pass</h2>
          {view.history.length ? (
            <>
              <ResultRows rows={view.history} navigateHref={props.navigateHref} />
              <p className="fa-footnote">
                Poängen i listan är linjära skattningar, inte normerade.
              </p>
            </>
          ) : (
            <p className="fa-margin-note">Inga tidigare pass av samma sort ännu.</p>
          )}
        </section>
        <section>
          <h2 className="fa-h3">Exponering</h2>
          <p className="fa-margin-note">
            Du hade sett {row.seenBefore} av {row.presented} frågor innan.
          </p>
        </section>
        <ProvLink className="fa-link" href="/prov" navigateHref={props.navigateHref}>
          Välj ett nytt provpass
        </ProvLink>
      </aside>
    </div>
  )
}
