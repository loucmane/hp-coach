import { fmtScore } from '@/folio/lib/format'
import { RangeBand } from '@/folio/ui/RangeBand'
import { SecChip } from '@/folio/ui/SecChip'
import { type NavigateHref, OvaLink } from './OvaLead'
import type { OvaSection, OvaView } from './ovaView'

const PARTS = [
  { half: 'verbal', title: 'Verbal del' },
  { half: 'kvant', title: 'Kvantitativ del' },
] as const
function SectionEntry({
  section: s,
  navigateHref,
}: {
  section: OvaSection
  navigateHref: NavigateHref
}) {
  return (
    <OvaLink
      className="fa-ova-section-card"
      href={s.href}
      navigateHref={navigateHref}
      data-testid={`ova-section-${s.section}`}
    >
      <div className="fa-ova-card-top">
        <span className="fa-ova-card-title">
          <SecChip section={s.section} />
          <h4>{s.name}</h4>
        </span>
        <span className="fa-ova-arrow">
          Öva <span aria-hidden>→</span>
        </span>
      </div>
      <p className="fa-ova-what">{s.gloss}</p>
      <div className="fa-ova-evidence">
        {s.low != null && s.high != null ? (
          <>
            <p className="fa-ova-level">
              <span>Nivå just nu</span>
              <b>
                {fmtScore(s.low)}–{fmtScore(s.high)}
              </b>
            </p>
            <RangeBand
              low={s.low}
              high={s.high}
              max={2}
              section={s.section}
              size="mini"
              decorative
            />
            <p className="fa-ova-basis">{s.attempts} svar</p>
          </>
        ) : (
          <p className="fa-ova-first">
            {s.attempts > 0
              ? `En första glimt: ${s.attempts} svar`
              : 'Inte provat · tio frågor ger en första bild'}
          </p>
        )}
        {s.gain ? <p className="fa-ova-gain">{s.gain}</p> : null}
      </div>
    </OvaLink>
  )
}
export function OvaContents({ view, navigateHref }: { view: OvaView; navigateHref: NavigateHref }) {
  const { repetition } = view
  const formats = [
    { title: 'Blandat', detail: 'frågor från alla åtta delprov', href: view.mixed.href },
    { title: 'Ordbanken', detail: `${view.words.count} ord du mött`, href: view.words.href },
    ...view.timed.map((f) => ({
      title: f.section === 'ORD' ? 'ORD på tid' : 'En LÄS-text',
      detail:
        f.section === 'ORD'
          ? `${f.count} frågor, ${f.minutes} min, som på provet`
          : `en text och dess frågor, ca ${f.minutes} min`,
      href: f.href,
    })),
  ]
  return (
    <>
      <OvaLink
        className="fa-ova-card fa-ova-repetition"
        href={repetition.href}
        navigateHref={navigateHref}
        data-testid="ova-repetition"
      >
        <span>
          <b>
            Repetera
            {repetition.round > 0
              ? ` · ${repetition.round} frågor, ca ${repetition.minutes} min`
              : ''}
          </b>
          <span className="fa-ova-rep-detail">
            {repetition.dueNow == null
              ? 'Hämtar din kö…'
              : `${repetition.dueNow} är redo att komma tillbaka · de som väntat längst först`}
          </span>
        </span>
        <span className="fa-ova-arrow">
          Repetera <span aria-hidden>→</span>
        </span>
      </OvaLink>
      <section aria-labelledby="fa-ova-parts">
        <div className="fa-ova-section-head">
          <h2 id="fa-ova-parts">Välj själv</h2>
          <small>fortsätt direkt efteråt</small>
        </div>
        {PARTS.map((part) => (
          <div className="fa-ova-half" key={part.half}>
            <h3 id={`fa-ova-${part.half}`}>{part.title}</h3>
            <ul className="fa-ova-rows" aria-labelledby={`fa-ova-${part.half}`}>
              {view.sections
                .filter((s) => s.half === part.half)
                .map((s) => (
                  <li key={s.section}>
                    <SectionEntry section={s} navigateHref={navigateHref} />
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>
      <section aria-labelledby="fa-ova-formats">
        <div className="fa-ova-section-head">
          <h2 id="fa-ova-formats">Andra format</h2>
          <small>alla startar direkt</small>
        </div>
        <ul className="fa-ova-formats">
          {formats.map((f) => (
            <li key={f.href}>
              <OvaLink className="fa-ova-card" href={f.href} navigateHref={navigateHref}>
                <b>{f.title}</b>
                <small>{f.detail}</small>
              </OvaLink>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
