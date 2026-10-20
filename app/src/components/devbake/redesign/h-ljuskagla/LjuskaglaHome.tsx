import { ArrowRight, CornerDownRight, LampDesk } from 'lucide-react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtDelta, fmtScore } from '@/components/devbake/redesign/r1Kit'
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

/** The one lit card: the paused session, else the plan's first open step,
 *  else — every step done — the plan said to be done. */
function Lamp({
  resume,
  first,
  planDone,
  onResume,
  onPlan,
  onOva,
}: {
  resume: ResumeView | null
  first: PlanItemView | undefined
  planDone: boolean
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
  if (planDone) {
    return (
      <section className="lj-resume">
        <div className="lj-resume-top">
          <span className="lj-eyebrow">Dagens plan</span>
          <LampDesk size={28} strokeWidth={1.3} aria-hidden />
        </div>
        <h2>Dagens plan är klar.</h2>
        <p className="lj-resume-rationale">
          Allt du planerade för idag är gjort. Vill du öva mer finns alla delprov under Öva.
        </p>
        <button className="lj-primary" type="button" data-testid="rd-resume" onClick={onOva}>
          <span>Till Öva</span>
          <ArrowRight size={20} aria-hidden />
        </button>
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
  // Every step done (or the plan says so): nothing is offered as next work.
  const planDone = plan.allComplete || (plan.items.length > 0 && !first)
  // Without a resume the lamp takes the plan's first step; the rows go on from there.
  const rows = resume || planDone ? plan.items : plan.items.filter((item) => item !== first)
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
            planDone={planDone}
            onResume={onResume}
            onPlan={openItem}
            onOva={() => onOpen('ova', () => actions.go('ova'))}
          />
          {rows.length > 0 && (
            <section className="lj-plan lj-shade">
              <div className="lj-section-head">
                <h2>
                  {planDone ? 'Gjort idag' : resume ? 'Sedan, i din takt' : 'Resten av dagen'}
                </h2>
                <span>{plan.minutes} min</span>
              </div>
              <ol>
                {rows.map((item) => {
                  const text = (
                    <>
                      <CornerDownRight size={18} aria-hidden />
                      <span>
                        <strong>
                          {item.title}
                          {item.primary && !item.completed && <small>näst på tur</small>}
                          {item.completed && <small>klar</small>}
                        </strong>
                        {item.detail && <span>{item.detail}</span>}
                      </span>
                      <span>{item.minutes} min</span>
                    </>
                  )
                  // A finished step is a record of the day, never offered as next work.
                  return (
                    <li key={item.id} data-completed={String(item.completed)}>
                      {item.completed ? (
                        <div className="lj-plan-done">{text}</div>
                      ) : (
                        <button type="button" onClick={() => openItem(item)}>
                          {text}
                        </button>
                      )}
                    </li>
                  )
                })}
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
