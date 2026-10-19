import { ArrowRight, CornerDownRight, LampDesk } from 'lucide-react'
import {
  ESTIMATE_CAVEAT,
  EXAM,
  FRAMEWORK_NAMES,
  PLAN,
  PROGNOSIS,
  RECENT,
  RESUME,
  TODAY,
  TRAPS,
  WEEK,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  DESTINATIONS,
  type Destination,
  fmtDelta,
  fmtScore,
} from '@/components/devbake/redesign/r1Kit'

function Prognosis() {
  return (
    <section className="lj-prognosis lj-shade">
      <h2>Din riktning</h2>
      <p className="lj-score">
        <strong>{fmtScore(PROGNOSIS.total)}</strong>
        <span>
          av 2,0
          <br />
          uppskattat HP-resultat
        </span>
      </p>
      <div className="lj-score-track" aria-hidden>
        <i style={{ width: `${(PROGNOSIS.total / 2) * 100}%` }} />
      </div>
      <p>
        {fmtDelta(PROGNOSIS.delta)} sedan förra veckan · mål {fmtScore(PROGNOSIS.target)}
      </p>
      <p className="lj-caveat">{ESTIMATE_CAVEAT}</p>
    </section>
  )
}

function Recent() {
  return (
    <section className="lj-recent lj-shade">
      <h2>Senaste passen</h2>
      <ul>
        {RECENT.map((pass) => (
          <li key={pass.id}>
            <span>{pass.label}</span>
            <b>
              {pass.correct} / {pass.total}
            </b>
            <span>{pass.when}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function LjuskaglaHome({
  onResume,
  onGo,
}: {
  onResume: () => void
  onGo: (d: Destination) => void
}) {
  return (
    <div className="lj-home">
      <header className="lj-greeting">
        <div>
          <p className="lj-eyebrow">{TODAY.dateLabel}</p>
          <h1>{TODAY.greeting}.</h1>
        </div>
        <p className="lj-countdown">
          <strong>{EXAM.daysLeft}</strong>
          <span>
            dagar till provet
            <br />
            {EXAM.shortDate}
          </span>
        </p>
      </header>
      <div className="lj-home-grid">
        <div className="lj-home-main">
          <section className="lj-resume">
            <div className="lj-resume-top">
              <span className="lj-eyebrow">Din läsplats finns kvar</span>
              <LampDesk size={28} strokeWidth={1.3} aria-hidden />
            </div>
            <h2>{RESUME.title}</h2>
            <p className="lj-resume-subtitle">{RESUME.subtitle}</p>
            <div className="lj-bookmark">
              <span aria-hidden>¶</span>
              <p>
                Två frågor bakom dig.
                <br />
                Ungefär {RESUME.minutesLeft} minuter kvar i texten.
              </p>
            </div>
            <button className="lj-primary" type="button" data-testid="rd-resume" onClick={onResume}>
              <span>
                Fortsätt: {RESUME.section} · fråga {RESUME.position} av {RESUME.total}
              </span>
              <ArrowRight size={20} aria-hidden />
            </button>
            <p className="lj-resume-foot">
              Pausat {RESUME.pausedAt.toLowerCase()} · på din {RESUME.device}
            </p>
          </section>
          <section className="lj-plan lj-shade">
            <div className="lj-section-head">
              <h2>Sedan, i din takt</h2>
              <span>{PLAN.minutes} min</span>
            </div>
            <ol>
              {PLAN.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onGo(item.kind === 'lektion' ? 'uppslag' : 'ova')}
                  >
                    <CornerDownRight size={18} aria-hidden />
                    <span>
                      <strong>
                        {item.title}
                        {item.primary && <small>näst på tur</small>}
                      </strong>
                      <span>{item.detail}</span>
                    </span>
                    <span>{item.minutes} min</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="lj-home-aside">
          <Prognosis />
          <section className="lj-trap lj-shade">
            <span className="lj-eyebrow">Ett mönster att se</span>
            <h2>{TRAPS[0].pattern}</h2>
            <p>
              {TRAPS[0].section} · {TRAPS[0].name}
              <br />
              {TRAPS[0].count} missar av samma slag.
            </p>
            <button className="lj-text-button" type="button" onClick={() => onGo('uppslag')}>
              Läs om frågetypen <ArrowRight size={16} aria-hidden />
            </button>
          </section>
          <Recent />
        </aside>
      </div>
      <footer className="lj-home-foot">
        {WEEK.minutesToday} minuter idag · {WEEK.daysPractised} av {WEEK.goal} planerade dagar den
        här veckan
      </footer>
    </div>
  )
}

/** The five doors keep working locally without navigating out of the bake-off. */
export function LjuskaglaDestination({
  destination,
  onResume,
}: {
  destination: Destination
  onResume: () => void
}) {
  const d = DESTINATIONS.find((item) => item.id === destination) ?? DESTINATIONS[0]
  return (
    <div className="lj-home lj-destination">
      <p className="lj-eyebrow">HP-Coach</p>
      <h1>{d.label}</h1>
      <p>{d.blurb}</p>
      {destination === 'ova' && (
        <section className="lj-resume">
          <h2>En text i taget.</h2>
          <p>{RESUME.title} · LÄS</p>
          <button className="lj-primary" type="button" onClick={onResume}>
            Fortsätt din läsövning <ArrowRight size={20} aria-hidden />
          </button>
          <h3>Repetera</h3>
          <p>
            {PLAN.items[0].detail} · {PLAN.items[0].rationale}
          </p>
        </section>
      )}
      {destination === 'framsteg' && (
        <>
          <Prognosis />
          <Recent />
        </>
      )}
      {destination === 'uppslag' && (
        <section className="lj-shade">
          <h2>Frågetyper att känna igen</h2>
          {Object.entries(FRAMEWORK_NAMES).map(([key, name]) => (
            <details key={key}>
              <summary>{name}</summary>
              <p>
                {TRAPS.find((trap) => trap.frameworkId === key)?.pattern ??
                  'Leta efter stöd i texten och jämför varje del av svaret.'}
              </p>
            </details>
          ))}
        </section>
      )}
      {destination === 'provpass' && (
        <section className="lj-shade">
          <h2>Inför {EXAM.label}</h2>
          <p>
            {EXAM.name} · {EXAM.dateLabel}
          </p>
          <p>
            Ett provpass ger en sammanhängande stund med tidtagning. Här ser du dina senaste pass.
          </p>
          <Recent />
        </section>
      )}
    </div>
  )
}
