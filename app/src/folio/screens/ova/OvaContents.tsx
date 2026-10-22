import { fmtScore } from '@/folio/lib/format'
import { type NavigateHref, OvaLink } from './OvaLead'
import type { OvaSection, OvaView } from './ovaView'

const PARTS = [
  { half: 'verbal', title: 'Verbal del' },
  { half: 'kvant', title: 'Kvantitativ del' },
] as const
const scoreOrDash = (score: number | null) => (score == null ? '—' : fmtScore(score))

function SectionEntry({
  section: s,
  suggested,
  navigateHref,
}: {
  section: OvaSection
  suggested: boolean
  navigateHref: NavigateHref
}) {
  const waiting =
    s.waiting != null && s.waiting > 0
      ? `${s.waiting} ${s.waiting === 1 ? 'miss' : 'missar'} väntar i Repetera`
      : null
  const basis = s.score != null && s.confidence === 'low' ? `underlag: ${s.attempts} svar` : null
  const level = s.score == null ? 'nivå visas efter några svar' : `nivå ${fmtScore(s.score)}`
  return (
    <OvaLink
      className="fa-plan-row"
      href={s.href}
      navigateHref={navigateHref}
      data-testid={`ova-section-${s.section}`}
      aria-label={[s.section, s.name, level, basis, suggested ? 'föreslagen' : null, waiting]
        .filter(Boolean)
        .join(', ')}
    >
      <span className="fa-entry-code" aria-hidden>
        {s.section}
      </span>
      <span className="fa-plan-body">
        <span className="fa-plan-line">
          <span className="fa-plan-title">{s.name}</span>
          <span
            className="fa-leader"
            data-fa-level={s.score != null ? '' : undefined}
            aria-hidden
          />
          <span className="fa-plan-min" data-fa-level={s.score != null ? '' : undefined}>
            {scoreOrDash(s.score)}
          </span>
          <span className="fa-entry-arrow" aria-hidden>
            →
          </span>
        </span>
        <span className="fa-plan-why">{s.gloss}</span>
        {basis ? <span className="fa-basis">{basis}</span> : null}
        {waiting ? (
          <span className="fa-entry-note" data-testid={`ova-due-${s.section}`}>
            {waiting}
          </span>
        ) : null}
      </span>
    </OvaLink>
  )
}

export function OvaContents({ view, navigateHref }: { view: OvaView; navigateHref: NavigateHref }) {
  return (
    <section className="fa-section" aria-labelledby="fa-ova-parts" data-fa-shade>
      <div className="fa-section-head">
        <h2 className="fa-h2" id="fa-ova-parts">
          Delproven
        </h2>
        <span className="fa-meta">din nivå</span>
      </div>
      {PARTS.map((part) => (
        <div key={part.half} className="fa-part-block">
          <h3 className="fa-part" id={`fa-ova-${part.half}`}>
            {part.title}
          </h3>
          <ul aria-labelledby={`fa-ova-${part.half}`}>
            {view.sections
              .filter((s) => s.half === part.half)
              .map((s) => (
                <li key={s.section}>
                  <SectionEntry
                    section={s}
                    suggested={s.section === view.suggested}
                    navigateHref={navigateHref}
                  />
                </li>
              ))}
          </ul>
        </div>
      ))}
      <div className="fa-part-block fa-part-block--end">
        <OvaLink
          className="fa-plan-row"
          href={view.mixed.href}
          navigateHref={navigateHref}
          data-testid="ova-mixed"
        >
          <span className="fa-plan-body">
            <span className="fa-plan-line">
              <span className="fa-plan-title">Blandat</span>
              <span className="fa-leader" aria-hidden />
              <span className="fa-entry-arrow" aria-hidden>
                →
              </span>
            </span>
            <span className="fa-plan-why">
              {view.mixed.questions} frågor från alla åtta delprov
            </span>
          </span>
        </OvaLink>
      </div>
      {view.scoreless ? (
        <p className="fa-footnote">
          — betyder att nivån visas när du har svarat på några frågor i delprovet.
        </p>
      ) : null}
      <ul className="fa-special" aria-label="Ordbank och övningar på tid">
        {[view.words, ...view.timed].map((link) => (
          <li key={link.href}>
            <OvaLink className="fa-link" href={link.href} navigateHref={navigateHref}>
              {link.label}
            </OvaLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
