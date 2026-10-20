import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  DESTINATIONS,
  type Destination,
  fmtDelta,
  fmtScore,
  useKeyMap,
} from '@/components/devbake/redesign/r1Kit'
import { IndexNumber } from './RasterParts'

export function RasterHome({
  live,
  onResume,
  onGo,
}: {
  live: boolean
  onResume: () => void
  onGo: (d: Destination) => void
}) {
  const { data, actions } = useDirectionData()
  const {
    today: TODAY,
    exam: EXAM,
    plan: PLAN,
    prognosis: PROGNOSIS,
    recent: RECENT,
    resume: RESUME,
    traps: TRAPS,
    week: WEEK,
  } = data.home
  useKeyMap({ Enter: onResume, ' ': onResume }, live && !!RESUME)
  const trap = TRAPS.find((t) => t.rising) ?? TRAPS[0]
  const upcoming = PLAN.allComplete ? [] : PLAN.items.filter((item) => !item.completed)
  const primary = upcoming.find((item) => item.primary) ?? upcoming[0]
  const planComplete = PLAN.allComplete || (PLAN.items.length > 0 && upcoming.length === 0)
  return (
    <div className="ra-home">
      <div className="ra-greeting">
        <h1>{TODAY.greeting}.</h1>
        <span>{TODAY.dateLabel}</span>
      </div>
      <div className="ra-figures">
        <section className="ra-countdown" aria-label="Dagar till högskoleprovet">
          <h2 className="ra-label">Dagar till provet</h2>
          <p className="ra-display">{String(EXAM.daysLeft).padStart(2, '0')}</p>
          <p className="ra-figure-caption">
            {EXAM.label} / {EXAM.shortDate}
          </p>
        </section>
        <section className="ra-prognosis" aria-label="Prognos">
          <h2 className="ra-label">
            Din prognos{PROGNOSIS.target != null ? ` / av ${fmtScore(PROGNOSIS.target)}` : ''}
          </h2>
          {PROGNOSIS.total != null ? (
            <p className="ra-display">{fmtScore(PROGNOSIS.total)}</p>
          ) : (
            <p>Öva båda halvorna för en prognos.</p>
          )}
          {PROGNOSIS.delta != null ? (
            <p className="ra-figure-caption">{fmtDelta(PROGNOSIS.delta)} sedan förra veckan</p>
          ) : null}
        </section>
        <aside className="ra-calibration">
          <p className="ra-label">En riktning, inte ett facit</p>
          {PROGNOSIS.caveat ? <p>{PROGNOSIS.caveat}</p> : null}
          <dl>
            <div>
              <dt>Verbal</dt>
              <dd>{PROGNOSIS.verbal != null ? fmtScore(PROGNOSIS.verbal) : 'Inte skattad'}</dd>
            </div>
            <div>
              <dt>Kvant</dt>
              <dd>{PROGNOSIS.quant != null ? fmtScore(PROGNOSIS.quant) : 'Inte skattad'}</dd>
            </div>
          </dl>
        </aside>
      </div>
      {RESUME ? (
        <button
          className="ra-resume"
          type="button"
          data-testid="rd-resume"
          onClick={onResume}
          aria-label={`Fortsätt: ${RESUME.section} · fråga ${RESUME.position} av ${RESUME.total}`}
        >
          <span className="ra-resume-position">
            <span className="ra-label">{RESUME.section} / Påbörjat</span>
            <b>
              {String(RESUME.position).padStart(2, '0')}
              <small>/{String(RESUME.total).padStart(2, '0')}</small>
            </b>
          </span>
          <span className="ra-resume-title">
            <strong>
              {RESUME.section === 'LÄS' || RESUME.section === 'ELF'
                ? 'Fortsätt läsa.'
                : 'Fortsätt öva.'}
            </strong>
            <span>{RESUME.title}</span>
            <small>
              Fråga {RESUME.position} av {RESUME.total}
              {RESUME.minutesLeft != null ? ` · ca ${RESUME.minutesLeft} min kvar` : ''}
            </small>
          </span>
          <span className="ra-resume-arrow" aria-hidden>
            ↗
          </span>
        </button>
      ) : (
        <button type="button" className="ra-primary ra-home-start" onClick={() => onGo('ova')}>
          Välj en övning <span aria-hidden>↗</span>
        </button>
      )}
      <div className="ra-lower-grid">
        <section className="ra-plan" aria-labelledby="ra-plan-heading">
          <div className="ra-section-heading">
            <h2 id="ra-plan-heading">
              {planComplete ? 'Dagens plan är klar.' : 'Sedan, i tur och ordning.'}
            </h2>
            <span>{upcoming.reduce((sum, item) => sum + item.minutes, 0)} min</span>
          </div>
          <ol>
            {upcoming.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="ra-plan-row"
                  data-primary={String(item === primary)}
                  onClick={() => actions.openPlanItem(item.id)}
                >
                  <IndexNumber value={i + 1} />
                  <span>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                    <small>{item.rationale}</small>
                  </span>
                  <span className="ra-duration">
                    {item.minutes}
                    <small>min</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="ra-week">
            {WEEK.minutesToday != null ? `${WEEK.minutesToday} minuter idag. ` : ''}
            {WEEK.daysPractised != null
              ? `${WEEK.daysPractised}${WEEK.goal != null ? ` av ${WEEK.goal}` : ''} dagar den här veckan.`
              : ''}
          </p>
        </section>
        <div className="ra-records">
          {trap ? (
            <section aria-labelledby="ra-trap-heading">
              <div className="ra-section-heading">
                <h2 id="ra-trap-heading">Mönstret att bryta</h2>
                <span>{trap.section}</span>
              </div>
              <button type="button" className="ra-trap-row" onClick={() => onGo('framsteg')}>
                <span>
                  <strong>{trap.pattern ?? trap.name}</strong>
                  {trap.pattern ? <small>{trap.name}</small> : null}
                </span>
                <span className="ra-count">
                  {String(trap.count).padStart(2, '0')}
                  <small>gånger</small>
                </span>
              </button>
            </section>
          ) : null}
          <section aria-labelledby="ra-recent-heading">
            <div className="ra-section-heading">
              <h2 id="ra-recent-heading">Senaste passen</h2>
              <button type="button" onClick={() => onGo('framsteg')}>
                Historik ↗
              </button>
            </div>
            <table className="ra-recent">
              <thead className="ra-sr">
                <tr>
                  <th>Pass</th>
                  <th>Rätt av totalt</th>
                  <th>När</th>
                </tr>
              </thead>
              <tbody>
                {RECENT.map((pass) => (
                  <tr key={pass.id}>
                    <th scope="row">{pass.label}</th>
                    <td>
                      {pass.correct}
                      <span>/{pass.total}</span>
                    </td>
                    <td>{pass.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  )
}

export function RasterDestination({ dest, onHome }: { dest: Destination; onHome: () => void }) {
  const index = DESTINATIONS.findIndex((d) => d.id === dest)
  const item = DESTINATIONS[index]
  return (
    <section className="ra-destination">
      <span className="ra-display">
        <IndexNumber value={index + 1} />
      </span>
      <div>
        <h1>{item.label}</h1>
        <p>{item.blurb}</p>
        <p>Den här sidan kommer i nästa omgång. Här kan du prova menyn och kontot.</p>
        <button type="button" className="ra-outline" onClick={onHome}>
          Tillbaka till Idag ↗
        </button>
      </div>
    </section>
  )
}
