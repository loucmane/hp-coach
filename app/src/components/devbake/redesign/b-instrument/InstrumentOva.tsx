import { ArrowRight, ChevronRight } from 'lucide-react'
import { useDirectionData } from '../directionData'
import { fmtScore } from '../r1Kit'
import { Readout } from './parts'

export function InstrumentOva() {
  const { data, actions } = useDirectionData()
  const { ova, home } = data
  const weakest = ova.sections.find((s) => s.section === ova.weakest)
  const resume = home.resume
  const lead = resume
    ? 'Fortsätt övningen'
    : weakest
      ? `Öva ${weakest.section}`
      : 'Starta blandad övning'
  const start = () =>
    resume
      ? actions.resume()
      : weakest
        ? actions.startDrill({ kind: 'section', section: weakest.section })
        : actions.startDrill({ kind: 'mixed' })
  return (
    <div className="in-hub">
      <header className="in-greet">
        <h1 tabIndex={-1}>Öva</h1>
        <p>Välj ett delprov eller fortsätt där du är.</p>
      </header>
      <section className="in-directory" aria-label="Övningar">
        <div className="in-hub-lead">
          <div>
            <span className="in-pane-label">Nästa övning</span>
            <h2>
              {resume
                ? `${resume.section} · ${resume.title}`
                : weakest
                  ? weakest.name
                  : 'Blanda delproven'}
            </h2>
            <p>
              {resume
                ? `Fråga ${resume.position} av ${resume.total}`
                : weakest
                  ? 'Ditt svagaste delprov just nu.'
                  : 'Ingen övning än. Börja med en blandad övning.'}
            </p>
          </div>
          <button type="button" className="in-btn" onClick={start}>
            {lead}
            <ArrowRight size={16} aria-hidden />
          </button>
        </div>
        <div className="in-section-columns">
          {(['verbal', 'kvant'] as const).map((half) => (
            <section key={half} aria-label={half === 'verbal' ? 'Verbal' : 'Kvantitativ'}>
              <h2 className="in-cell-head">{half === 'verbal' ? 'Verbal' : 'Kvantitativ'}</h2>
              <ul>
                {ova.sections
                  .filter((s) => s.half === half)
                  .map((s) => (
                    <li key={s.section}>
                      <button
                        type="button"
                        className="in-section-row"
                        data-testid={`rd-ova-section-${s.section.toLowerCase().replace('ä', 'a')}`}
                        onClick={() => actions.startDrill({ kind: 'section', section: s.section })}
                      >
                        <span className="in-code">{s.section}</span>
                        <span className="in-section-name">
                          <b>{s.name}</b>
                          {s.section === ova.weakest ? (
                            <span className="in-tag">Svagast</span>
                          ) : null}
                          <span>{s.waiting} väntar</span>
                        </span>
                        <span className="in-section-score">
                          <span className="in-sr">Poäng: </span>
                          {s.score == null ? 'Ej övat' : fmtScore(s.score)}
                        </span>
                        <ChevronRight size={16} aria-hidden />
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
        <button
          type="button"
          className="in-hub-door"
          data-testid="rd-ova-mixed"
          onClick={() => actions.startDrill({ kind: 'mixed' })}
        >
          <b>Blandad övning</b>
          <span>{ova.mixed.questions} frågor</span>
          <ChevronRight size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="in-hub-door in-review-band"
          data-testid="rd-ova-repetera"
          onClick={actions.openRepetera}
        >
          <span>
            <b>Repetera</b>
            <span>
              {ova.repetera.pile === 0
                ? 'Inga missar väntar.'
                : 'Ett avgränsat pass med dina missar.'}
            </span>
          </span>
          <Readout label="Redo nu" value={String(ova.repetera.dueNow)} />
          {ova.repetera.pile !== ova.repetera.dueNow ? (
            <Readout label="Dagens hög" value={String(ova.repetera.pile)} />
          ) : null}
          <ChevronRight size={16} aria-hidden />
        </button>
      </section>
      {ova.weakTraps.length ? (
        <section className="in-trap-directory" aria-label="Vanliga fällor">
          <h2 className="in-cell-head">Vanliga fällor</h2>
          {ova.weakTraps.map((trap) => (
            <button
              type="button"
              className="in-hub-door"
              key={`${trap.section}-${trap.frameworkId}`}
              onClick={() =>
                actions.startDrill({
                  kind: 'framework',
                  section: trap.section,
                  frameworkId: trap.frameworkId,
                })
              }
            >
              <span className="in-code">{trap.section}</span>
              <span>
                <b>{trap.name}</b>
                {trap.pattern ? <span>{trap.pattern}</span> : null}
              </span>
              <span className="in-num">{trap.count} väntar</span>
              <ChevronRight size={16} aria-hidden />
            </button>
          ))}
        </section>
      ) : null}
    </div>
  )
}
