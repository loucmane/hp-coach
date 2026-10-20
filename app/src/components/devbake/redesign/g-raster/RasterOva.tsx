import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtScore } from '@/components/devbake/redesign/r1Kit'

export function RasterOva() {
  const { data, actions } = useDirectionData()
  const { ova, home } = data
  const recommended = ova.sections.find((s) => s.section === ova.weakest)
  const mixedLeads = !home.resume && !recommended
  return (
    <div className="ra-overview">
      <header className="ra-page-heading">
        <h1>Öva</h1>
        <p>Välj en sektion.</p>
      </header>
      {home.resume ? (
        <button type="button" className="ra-primary ra-practice-lead" onClick={actions.resume}>
          <span>
            Fortsätt: {home.resume.section}
            <small>
              Fråga {home.resume.position} av {home.resume.total}
              {home.resume.minutesLeft != null ? ` · ca ${home.resume.minutesLeft} min kvar` : ''}
            </small>
          </span>
          <span aria-hidden>↗</span>
        </button>
      ) : recommended ? (
        <button
          type="button"
          className="ra-primary ra-practice-lead"
          onClick={() => actions.startDrill({ kind: 'section', section: recommended.section })}
        >
          <span>
            Öva {recommended.section}
            <small>Din svagaste sektion just nu.</small>
          </span>
          <span aria-hidden>↗</span>
        </button>
      ) : (
        <p className="ra-intro">Välj en sektion, eller börja med en blandad övning.</p>
      )}
      {mixedLeads ? <Mixed primary /> : null}
      <div className="ra-overview-grid">
        <section className="ra-section-timetable" aria-label="Sektioner">
          <div className="ra-section-heading">
            <h2>Sektioner</h2>
            <span>Skattning / väntar</span>
          </div>
          {ova.sections.map((section) => (
            <button
              type="button"
              className="ra-section-door"
              key={section.section}
              data-testid={`rd-ova-section-${section.section.toLowerCase().replace('ä', 'a')}`}
              data-recommended={String(section.section === recommended?.section)}
              onClick={() => actions.startDrill({ kind: 'section', section: section.section })}
            >
              <b>{section.section}</b>
              <span>
                {section.name}
                {section.section === recommended?.section ? <small>Svagast just nu</small> : null}
              </span>
              <span className="ra-section-score">
                {section.score != null ? fmtScore(section.score) : 'Inte skattad'}
                <small>{section.waiting} väntar</small>
              </span>
              <span aria-hidden>↗</span>
            </button>
          ))}
          {!mixedLeads ? <Mixed /> : null}
        </section>
        <aside className="ra-practice-aside">
          <div className="ra-section-heading">
            <h2>Repetera</h2>
            <span>I din takt</span>
          </div>
          <p className="ra-display">{String(ova.repetera.dueNow).padStart(2, '0')}</p>
          <p>
            {ova.repetera.dueNow ? 'redo nu' : 'Inget redo just nu'} · {ova.repetera.pile} i dagens
            hög
          </p>
          <button
            type="button"
            className="ra-text-door"
            data-testid="rd-ova-repetera"
            onClick={actions.openRepetera}
          >
            Öppna Repetera · {ova.repetera.dueNow} redo nu <span aria-hidden>↗</span>
          </button>
          {ova.weakTraps.length ? (
            <section className="ra-traps" aria-label="Vanliga fällor">
              <div className="ra-section-heading">
                <h2>Mönster att bryta</h2>
              </div>
              {ova.weakTraps.map((trap) => (
                <button
                  type="button"
                  key={trap.frameworkId}
                  className="ra-text-door"
                  onClick={() =>
                    actions.startDrill({
                      kind: 'framework',
                      section: trap.section,
                      frameworkId: trap.frameworkId,
                    })
                  }
                >
                  <span>
                    <small>
                      {trap.section} · {trap.count} väntar
                    </small>
                    <strong>{trap.name}</strong>
                    {trap.pattern ? <small>{trap.pattern}</small> : null}
                  </span>
                  <span aria-hidden>↗</span>
                </button>
              ))}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function Mixed({ primary = false }: { primary?: boolean }) {
  const { data, actions } = useDirectionData()
  return (
    <button
      type="button"
      className={primary ? 'ra-primary ra-practice-lead' : 'ra-text-door'}
      data-testid="rd-ova-mixed"
      onClick={() => actions.startDrill({ kind: 'mixed' })}
    >
      <span>
        Börja en blandad övning<small>{data.ova.mixed.questions} frågor</small>
      </span>
      <span aria-hidden>↗</span>
    </button>
  )
}
