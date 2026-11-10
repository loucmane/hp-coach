import { SEC_KEY, SecChip } from '@/folio/ui/SecChip'
import { FramstegBand, FramstegLink, type NavigateHref } from './FramstegReport'
import type { FramstegView } from './framstegView'
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
      <section className="fa-section" aria-labelledby="fa-fr-sections-h">
        <div className="fa-section-head">
          <h2 className="fa-h2" id="fa-fr-sections-h">
            Delproven
          </h2>
          <span className="fa-meta">
            intervall på skalan 0–2,0 · mjuka kanter där underlaget tunnar ut
          </span>
        </div>
        <ul className="fa-section-rows">
          {view.sections.map((s) => (
            <li key={s.section}>
              <FramstegLink
                className="fa-section-row"
                href={s.href}
                navigateHref={navigateHref}
                data-testid={`progress-section-${s.section}`}
                aria-describedby={s.marked && view.prognosis.caveat ? 'fa-fr-caveat' : undefined}
              >
                <span className="fa-section-name">
                  <SecChip section={s.section} />
                  {s.name}
                </span>
                {s.low != null && s.high != null ? (
                  <FramstegBand low={s.low} high={s.high} section={s.section} />
                ) : (
                  <span className="fa-glimpse" data-sec={SEC_KEY[s.section]}>
                    {s.dots.length ? (
                      <span
                        className="fa-dots"
                        role="img"
                        aria-label={
                          s.dots.length
                            ? `Senaste provpasset: ${s.dots.map((dot, i) => `svar ${i + 1}: ${dot.correct ? 'rätt' : 'inte rätt'}${dot.returning ? ', kommer tillbaka' : dot.returning == null ? ', repetitionskö inte hämtad' : ''}`).join('; ')}`
                            : undefined
                        }
                      >
                        {s.dots.map((dot) => (
                          <i
                            key={dot.questionId}
                            data-answer={dot.correct ? 'correct' : 'incorrect'}
                            data-returning={dot.returning}
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                    ) : null}
                  </span>
                )}
                <span className="fa-section-value">
                  {s.rangeLabel ? (
                    <>
                      <b>{s.rangeLabel}</b> · {s.attempts} svar
                    </>
                  ) : s.tier === 'glimpse' ? (
                    `${s.correct} av ${s.attempts} · första glimt`
                  ) : (
                    'inte provat'
                  )}
                </span>
              </FramstegLink>
            </li>
          ))}
        </ul>
        <div className="fa-axis-row" aria-hidden="true">
          <span />
          <span>
            {['0', '0,5', '1,0', '1,5', '2,0'].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
          <span />
        </div>
        <p className="fa-meta fa-dot-note">
          Prickar = enskilda svar från senaste provpasset (ring = kommer tillbaka). Ett intervall
          visas först vid tio svar.
        </p>
      </section>
      <section className="fa-section fa-weekly-card" aria-labelledby="fa-fr-chart-h" data-fa-shade>
        <h2 className="fa-h3" id="fa-fr-chart-h">
          Vecka för vecka
        </h2>
        <TrendChart chart={view.weekly} phone={phone} />
      </section>
    </>
  )
}
