import { ArrowRight, CornerDownRight, LampDesk } from 'lucide-react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  DESTINATIONS,
  type Destination,
  fmtDelta,
  fmtScore,
} from '@/components/devbake/redesign/r1Kit'
import type {
  PlanItemKind,
  PlanItemView,
  PrognosisView,
  RecentPassView,
  ResumeView,
  WeekView,
} from '@/components/devbake/redesign/viewModel'
import { countWord, type FramePage, type OpenPage } from './LjuskaglaParts'

/** Where a plan row opens in the frame when the host does not navigate. */
const PLAN_PAGE: Record<PlanItemKind, FramePage> = {
  repetition: 'repetera',
  lesson: 'uppslag',
  mock: 'provpass',
  drill: 'ova',
}

function Prognosis({ prognosis: p }: { prognosis: PrognosisView }) {
  const facts = [
    p.delta != null ? `${fmtDelta(p.delta)} sedan förra veckan` : null,
    p.target != null ? `mål ${fmtScore(p.target)}` : null,
  ].filter(Boolean)
  return (
    <section className="lj-prognosis lj-shade">
      <h2>Din riktning</h2>
      {p.total == null ? (
        <p>Prognosen visas när du har svarat på frågor i båda provhalvorna.</p>
      ) : (
        <>
          <p className="lj-score">
            <strong>{fmtScore(p.total)}</strong>
            <span>
              av 2,0
              <br />
              uppskattat HP-resultat
            </span>
          </p>
          <div className="lj-score-track" aria-hidden>
            <i style={{ width: `${(p.total / 2) * 100}%` }} />
          </div>
        </>
      )}
      {facts.length > 0 && <p>{facts.join(' · ')}</p>}
      {p.caveat && <p className="lj-caveat">{p.caveat}</p>}
    </section>
  )
}

function Recent({ recent }: { recent: RecentPassView[] }) {
  if (!recent.length) return null
  return (
    <section className="lj-recent lj-shade">
      <h2>Senaste passen</h2>
      <ul>
        {recent.map((pass) => (
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

/** The bookmark under the resume: what is behind you and, when known, ahead. */
function bookmarkLines(resume: ResumeView): string[] {
  const reading = resume.section === 'LÄS' || resume.section === 'ELF'
  const lines: string[] = []
  if (resume.answered > 0) {
    lines.push(
      `${countWord(resume.answered)} ${resume.answered === 1 ? 'fråga' : 'frågor'} bakom dig.`,
    )
  }
  if (resume.minutesLeft != null) {
    lines.push(`Ungefär ${resume.minutesLeft} minuter kvar i ${reading ? 'texten' : 'övningen'}.`)
  }
  return lines
}

/** "Pausat idag · 07:52 · på din telefon", from whatever the session knows. */
function pausedLine(resume: ResumeView): string | null {
  const parts: string[] = []
  if (resume.pausedAt) parts.push(`Pausat ${resume.pausedAt.toLowerCase()}`)
  if (resume.device)
    parts.push(parts.length ? `på din ${resume.device}` : `Pausat på din ${resume.device}`)
  return parts.length ? parts.join(' · ') : null
}

function weekLine(week: WeekView): string | null {
  const parts: string[] = []
  if (week.minutesToday != null) parts.push(`${week.minutesToday} minuter idag`)
  if (week.daysPractised != null) {
    parts.push(
      week.goal != null
        ? `${week.daysPractised} av ${week.goal} planerade dagar den här veckan`
        : `${week.daysPractised} ${week.daysPractised === 1 ? 'dag' : 'dagar'} med övning den här veckan`,
    )
  }
  return parts.length ? parts.join(' · ') : null
}

/** The one lit card: the paused session, else the plan's first step. */
function Lamp({
  resume,
  first,
  onResume,
  onPlan,
  onOva,
}: {
  resume: ResumeView | null
  first: PlanItemView | undefined
  onResume: () => void
  onPlan: (item: PlanItemView) => void
  onOva: () => void
}) {
  if (resume) {
    const lines = bookmarkLines(resume)
    const paused = pausedLine(resume)
    const reading = resume.section === 'LÄS' || resume.section === 'ELF'
    return (
      <section className="lj-resume">
        <div className="lj-resume-top">
          <span className="lj-eyebrow">
            {reading ? 'Din läsplats finns kvar' : 'Din övning finns kvar'}
          </span>
          <LampDesk size={28} strokeWidth={1.3} aria-hidden />
        </div>
        <h2>{resume.title}</h2>
        {resume.subtitle && <p className="lj-resume-subtitle">{resume.subtitle}</p>}
        {lines.length > 0 && (
          <div className="lj-bookmark">
            <span aria-hidden>¶</span>
            <p>
              {lines.map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          </div>
        )}
        <button className="lj-primary" type="button" data-testid="rd-resume" onClick={onResume}>
          <span>
            Fortsätt: {resume.section} · fråga {resume.position} av {resume.total}
          </span>
          <ArrowRight size={20} aria-hidden />
        </button>
        {paused && <p className="lj-resume-foot">{paused}</p>}
      </section>
    )
  }
  return (
    <section className="lj-resume">
      <div className="lj-resume-top">
        <span className="lj-eyebrow">Dagens första steg</span>
        <LampDesk size={28} strokeWidth={1.3} aria-hidden />
      </div>
      <h2>{first ? first.title : 'Välj en övning'}</h2>
      {first?.detail && <p className="lj-resume-subtitle">{first.detail}</p>}
      <p className="lj-resume-rationale">
        {first ? first.rationale : 'Alla delprov finns under Öva.'}
      </p>
      <button
        className="lj-primary"
        type="button"
        data-testid="rd-resume"
        onClick={() => (first ? onPlan(first) : onOva())}
      >
        <span>{first ? `Börja: ${first.title}` : 'Till Öva'}</span>
        <ArrowRight size={20} aria-hidden />
      </button>
    </section>
  )
}

export function LjuskaglaHome({ onResume, onOpen }: { onResume: () => void; onOpen: OpenPage }) {
  const { data, actions } = useDirectionData()
  const { today, exam, resume, plan, prognosis, traps, recent, week } = data.home
  const openItem = (item: PlanItemView) =>
    onOpen(PLAN_PAGE[item.kind], () => actions.openPlanItem(item.id))
  const first = plan.items.find((item) => !item.completed)
  // Without a resume the lamp takes the plan's first step; the rows go on from there.
  const rows = resume ? plan.items : plan.items.filter((item) => item !== first)
  const trap = traps[0]
  const footer = weekLine(week)
  return (
    <div className="lj-home">
      <header className="lj-greeting">
        <div>
          <p className="lj-eyebrow">{today.dateLabel}</p>
          <h1>{today.greeting}.</h1>
        </div>
        <p className="lj-countdown">
          <strong>{exam.daysLeft}</strong>
          <span>
            dagar till provet
            <br />
            {exam.shortDate}
          </span>
        </p>
      </header>
      <div className="lj-home-grid">
        <div className="lj-home-main">
          <Lamp
            resume={resume}
            first={first}
            onResume={onResume}
            onPlan={openItem}
            onOva={() => onOpen('ova', () => actions.go('ova'))}
          />
          {rows.length > 0 && (
            <section className="lj-plan lj-shade">
              <div className="lj-section-head">
                <h2>{resume ? 'Sedan, i din takt' : 'Resten av dagen'}</h2>
                <span>{plan.minutes} min</span>
              </div>
              <ol>
                {rows.map((item) => (
                  <li key={item.id} data-completed={String(item.completed)}>
                    <button type="button" onClick={() => openItem(item)}>
                      <CornerDownRight size={18} aria-hidden />
                      <span>
                        <strong>
                          {item.title}
                          {item.primary && <small>näst på tur</small>}
                          {item.completed && <small>klar</small>}
                        </strong>
                        {item.detail && <span>{item.detail}</span>}
                      </span>
                      <span>{item.minutes} min</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
        <aside className="lj-home-aside">
          <Prognosis prognosis={prognosis} />
          {trap && (
            <section className="lj-trap lj-shade">
              <span className="lj-eyebrow">Ett mönster att se</span>
              <h2>{trap.pattern ?? trap.name}</h2>
              <p>
                {trap.section} · {trap.name}
                <br />
                {trap.count} missar av samma slag.
              </p>
              <button
                className="lj-text-button"
                type="button"
                onClick={() => onOpen('uppslag', () => actions.openLesson(trap.frameworkId))}
              >
                Läs om frågetypen <ArrowRight size={16} aria-hidden />
              </button>
            </section>
          )}
          <Recent recent={recent} />
        </aside>
      </div>
      {footer && <footer className="lj-home-foot">{footer}</footer>}
    </div>
  )
}

/**
 * The doors this direction has not built yet, as round 1 left them: a host
 * that navigates opens its own screen instead, so these show only where a
 * door cannot leave the frame (a bare test mount, the real-app preview).
 */
export function LjuskaglaDestination({
  destination,
}: {
  destination: Exclude<Destination, 'idag' | 'ova'>
}) {
  const { data } = useDirectionData()
  const { exam, prognosis, recent } = data.home
  const d = DESTINATIONS.find((item) => item.id === destination) ?? DESTINATIONS[0]
  const lesson = data.uppslag.open
  const catalog = data.uppslag.sections.find((s) => s.section === lesson.section)
  return (
    <div className="lj-home lj-destination">
      <p className="lj-eyebrow">HP-Coach</p>
      <h1>{d.label}</h1>
      <p>{d.blurb}</p>
      {destination === 'framsteg' && (
        <>
          <Prognosis prognosis={prognosis} />
          <Recent recent={recent} />
        </>
      )}
      {destination === 'uppslag' && catalog && (
        <section className="lj-shade">
          <h2>Frågetyper att känna igen</h2>
          {catalog.entries.map((entry) => (
            <details key={entry.id}>
              <summary>{entry.title}</summary>
              <p>{entry.summary ?? 'Leta efter stöd i texten och jämför varje del av svaret.'}</p>
            </details>
          ))}
        </section>
      )}
      {destination === 'provpass' && (
        <section className="lj-shade">
          <h2>Inför {exam.label}</h2>
          <p>
            {exam.name} · {exam.dateLabel}
          </p>
          <p>
            Ett provpass ger en sammanhängande stund med tidtagning. Här ser du dina senaste pass.
          </p>
          <Recent recent={recent} />
        </section>
      )}
    </div>
  )
}
