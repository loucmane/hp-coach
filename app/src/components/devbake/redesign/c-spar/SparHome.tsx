// Spår · Idag — the day as a path. A vertical trail of today's steps:
// the text already under way is the first, dominant stop (its section
// colour in the header, the screen's one primary pill), the plan's items
// follow as quieter stops in their own colours, and the trail ends at a
// goal, not a streak. Beside it: the week's goal as earned dots only, the
// prognosis as a plain 0–2,0 bar with its uncertainty and caveat, traps as
// section-marked rows and the last passes as small tiles. "Lugnt läge" is a
// visible switch right here, and hides the dots, the bar and the nav dot.
//
// Kit v2: everything comes from useDirectionData().data.home. A field the
// real app cannot fill yet (the pause time, minutes left, the weekly goal,
// the prognosis range) is left out when absent; without a sitting to
// resume, the plan's first step becomes the dominant stop.

import { ArrowRight, Check, ChevronRight, Flag, TrendingDown, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type Destination,
  fmtDelta,
  fmtScore,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type { PlanItemView, ResumeView } from '@/components/devbake/redesign/viewModel'
import { nextPlanStep } from './SparDrill'
import { CalmSwitch, cap, inWords, Kbd, SECTION_NAMES, secOf } from './sparParts'

/** HP's scale tops out at 2,0: the bar's end, whatever the goal. */
const SCALE_MAX = 2

const DEVICE_DEFINITE: Record<string, string> = {
  telefon: 'telefonen',
  dator: 'datorn',
  surfplatta: 'surfplattan',
}

export function SparHome({
  width,
  live,
  calm,
  setCalm,
  onResume,
  onGo,
}: {
  width: WidthKey
  live: boolean
  calm: boolean
  setCalm: (calm: boolean) => void
  onResume: () => void
  onGo: (d: Destination) => void
}) {
  const { data, actions } = useDirectionData()
  const { today, exam, plan, resume } = data.home
  // Without a sitting to resume, the plan's first open step leads.
  const lead = resume ? null : (nextPlanStep(plan.items) ?? null)
  const primary = resume ? onResume : lead ? () => actions.openPlanItem(lead.id) : null
  useKeyMap(primary ? { Enter: primary } : {}, live)
  const phone = width === 'phone'
  const steps = (resume ? 1 : 0) + plan.items.length
  const date = today.dateLabel.toLocaleLowerCase('sv-SE')
  // Kept as round 1 wrote it (the same text pieces render the same).
  const lede =
    resume && resume.minutesLeft == null ? (
      <>
        {cap(inWords(steps))} steg. Planen tar ungefär {plan.minutes} minuter.
      </>
    ) : (
      <>
        {cap(inWords(steps))} steg, ungefär {(resume?.minutesLeft ?? 0) + plan.minutes} minuter.
      </>
    )
  return (
    <div className="sp-home" data-phone={String(phone)}>
      <header className="sp-home-head">
        <div className="sp-home-intro">
          <p className="sp-eyebrow">
            {phone ? `${cap(date)} · ${exam.daysLeft} dagar kvar` : `${today.greeting} · ${date}`}
          </p>
          <h1 className="sp-display sp-display--xl">Dagens stig</h1>
          <div className="sp-lede-row">
            <p className="sp-lede">
              {lede}
              {phone || !resume ? null : ' Du är mitt i det första.'}
            </p>
            {phone ? <CalmSwitch calm={calm} setCalm={setCalm} testid="sp-calm-home" /> : null}
          </div>
        </div>
        {phone ? null : (
          <div className="sp-home-tools">
            <p className="sp-countdown">
              <span>
                <b>{exam.daysLeft} dagar</b> till högskoleprovet
              </span>
              <span className="sp-countdown-date">{exam.shortDate}</span>
            </p>
            <CalmSwitch calm={calm} setCalm={setCalm} testid="sp-calm-home" />
          </div>
        )}
      </header>
      <div className="sp-home-grid">
        <Path resume={resume} lead={lead} steps={steps} onResume={onResume} />
        <aside className="sp-side" aria-label="Läget just nu">
          <Week />
          <Prognosis />
          <Traps />
          <Recent onGo={onGo} />
        </aside>
      </div>
    </div>
  )
}

function Path({
  resume,
  lead,
  steps,
  onResume,
}: {
  resume: ResumeView | null
  lead: PlanItemView | null
  steps: number
  onResume: () => void
}) {
  const { data, actions } = useDirectionData()
  const rest = data.home.plan.items.filter((item) => item !== lead)
  const offset = resume || lead ? 2 : 1
  return (
    <ol className="sp-path" aria-label="Dagens stig">
      {resume ? <ResumeNode resume={resume} onResume={onResume} /> : null}
      {lead ? <LeadNode item={lead} /> : null}
      {rest.map((item, i) => (
        <li key={item.id} className="sp-node" data-kind="next" data-sec={secOf(item.section)}>
          <span className="sp-node-mark" aria-hidden>
            {i + offset}
          </span>
          <button type="button" className="sp-step" onClick={() => actions.openPlanItem(item.id)}>
            <span className="sp-step-main">
              <span className="sp-step-title">
                {item.title}
                {item.detail ? <span className="sp-step-detail">{item.detail}</span> : null}
              </span>
              <span className="sp-step-why">{item.rationale}</span>
            </span>
            <span className="sp-step-side">
              {item.primary ? <span className="sp-next-chip">Nästa</span> : null}
              <span className="sp-step-min">{item.minutes} min</span>
              <ChevronRight size={18} strokeWidth={2} aria-hidden />
            </span>
          </button>
        </li>
      ))}
      <li className="sp-node" data-kind="goal">
        <span className="sp-node-mark" aria-hidden>
          <Flag size={18} strokeWidth={2} />
        </span>
        <p className="sp-goal">
          <b>Klart för idag</b>
          <span>
            {`Efter ${inWords(steps)} steg är dagen klar. Hinner du inte allt flyttas resten till imorgon.`}
          </span>
        </p>
      </li>
    </ol>
  )
}

/** Where the paused sitting was left, in words, when the data says so
 *  (in round 1's own text pieces, so it renders as it did). */
function pausedLine(resume: ResumeView): ReactNode {
  const where = resume.device ? (DEVICE_DEFINITE[resume.device] ?? resume.device) : null
  if (resume.pausedAt) {
    return (
      <>
        Pausad {resume.pausedAt.replace('Idag · ', 'idag ')}
        {where ? (
          <>
            {' på'} {where}
          </>
        ) : null}
      </>
    )
  }
  if (resume.stale) return 'Påbörjad för mer än en vecka sedan'
  return where ? `Påbörjad på ${where}` : null
}

function ResumeNode({ resume, onResume }: { resume: ResumeView; onResume: () => void }) {
  const paused = pausedLine(resume)
  return (
    <li className="sp-node" data-kind="now" data-sec={resume.section}>
      <span className="sp-node-mark">
        <NodeRing done={resume.answered} total={resume.total} />
      </span>
      <article className="sp-now" aria-labelledby="sp-now-title">
        <div className="sp-now-band">
          <span className="sp-sec-chip">{resume.section}</span>
          <span className="sp-now-band-text">{SECTION_NAMES[resume.section]}</span>
          <span className="sp-now-state">Påbörjad</span>
        </div>
        <div className="sp-now-body">
          <h2 className="sp-now-title" id="sp-now-title">
            {resume.title}
          </h2>
          {resume.subtitle ? <p className="sp-now-sub">{resume.subtitle}</p> : null}
          <div className="sp-now-progress">
            <QBar done={resume.answered} total={resume.total} />
            <span>
              <b>
                Fråga {resume.position} av {resume.total}
              </b>
              {resume.minutesLeft != null ? <> · ca {resume.minutesLeft} min kvar</> : null}
            </span>
          </div>
          <div className="sp-now-foot">
            <button
              type="button"
              className="sp-btn sp-btn--primary sp-btn--lg"
              data-testid="rd-resume"
              onClick={onResume}
            >
              Fortsätt
              <Kbd>↵</Kbd>
            </button>
            {paused ? <span className="sp-now-meta">{paused}</span> : null}
          </div>
        </div>
      </article>
    </li>
  )
}

/** No sitting to resume: the plan's first step is the dominant stop. */
function LeadNode({ item }: { item: PlanItemView }) {
  const { actions } = useDirectionData()
  const sec = secOf(item.section)
  return (
    <li className="sp-node" data-kind="now" data-sec={sec}>
      <span className="sp-node-mark">
        <NodeRing done={0} total={1} />
      </span>
      <article className="sp-now" aria-labelledby="sp-now-title">
        <div className="sp-now-band">
          {item.section ? <span className="sp-sec-chip">{item.section}</span> : null}
          <span className="sp-now-band-text">
            {item.section ? SECTION_NAMES[item.section] : item.title}
          </span>
          <span className="sp-now-state">Nästa</span>
        </div>
        <div className="sp-now-body">
          <h2 className="sp-now-title" id="sp-now-title">
            {item.title}
          </h2>
          {item.detail ? <p className="sp-now-sub">{item.detail}</p> : null}
          <p className="sp-now-why">{item.rationale}</p>
          <div className="sp-now-foot">
            <button
              type="button"
              className="sp-btn sp-btn--primary sp-btn--lg"
              onClick={() => actions.openPlanItem(item.id)}
            >
              Börja · {item.minutes} min
              <Kbd>↵</Kbd>
            </button>
          </div>
        </div>
      </article>
    </li>
  )
}

/** The current stop: a ring that is as full as the text is answered. */
function NodeRing({ done, total }: { done: number; total: number }) {
  const r = 25
  const c = 2 * Math.PI * r
  return (
    <svg className="sp-ring" viewBox="0 0 64 64" aria-hidden="true">
      <circle className="sp-ring-face" cx="32" cy="32" r="31" />
      <circle className="sp-ring-track" cx="32" cy="32" r={r} />
      <circle
        className="sp-ring-value"
        cx="32"
        cy="32"
        r={r}
        strokeDasharray={`${(total > 0 ? done / total : 0) * c} ${c}`}
        transform="rotate(-90 32 32)"
      />
      <text className="sp-ring-n" x="32" y="33" textAnchor="middle" dominantBaseline="middle">
        1
      </text>
    </svg>
  )
}

function QBar({ done, total }: { done: number; total: number }) {
  return (
    <span className="sp-qbar" role="img" aria-label={`${done} av ${total} frågor besvarade`}>
      {Array.from({ length: total }, (_, i) => (
        <i
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length progress marks
          key={i}
          data-state={i < done ? 'done' : i === done ? 'now' : 'todo'}
        />
      ))}
    </span>
  )
}

/** The week's goal as earned dots only — no weekdays, so a day without
 *  practice never shows as an empty past slot. Without a goal (no real
 *  source yet) the days stand in words alone. */
function Week() {
  const { data } = useDirectionData()
  const { minutesToday, daysPractised, goal } = data.home.week
  if (minutesToday == null && daysPractised == null) return null
  return (
    <section className="sp-week" aria-labelledby="sp-week-h">
      <div className="sp-side-head">
        <h2 className="sp-h3" id="sp-week-h">
          {goal != null ? 'Veckans mål' : 'Veckan'}
        </h2>
        {minutesToday != null ? (
          <span className="sp-side-meta">{minutesToday} min idag</span>
        ) : null}
      </div>
      {daysPractised != null ? (
        <div className="sp-goal-row">
          {goal != null ? (
            <span
              className="sp-goal-dots"
              role="img"
              aria-label={`${daysPractised} av ${goal} dagar`}
            >
              {Array.from({ length: goal }, (_, i) => (
                <i
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length goal marks
                  key={i}
                  data-on={String(i < daysPractised)}
                >
                  {i < daysPractised ? <Check size={14} strokeWidth={3} aria-hidden /> : null}
                </i>
              ))}
            </span>
          ) : null}
          <p className="sp-goal-text">
            {goal != null ? (
              <>
                <b>
                  {daysPractised} av {goal}
                </b>{' '}
                dagar
              </>
            ) : (
              <>
                <b>{daysPractised}</b> {daysPractised === 1 ? 'dag' : 'dagar'} den här veckan
              </>
            )}
          </p>
        </div>
      ) : null}
    </section>
  )
}

function Prognosis() {
  const { data } = useDirectionData()
  const p = data.home.prognosis
  const pct = (v: number) => `${(v / SCALE_MAX) * 100}%`
  const range = p.low != null && p.high != null ? { low: p.low, high: p.high } : null
  const halves = [
    p.verbal != null ? `Verbal ${fmtScore(p.verbal)}` : null,
    p.quant != null ? `Kvant ${fmtScore(p.quant)}` : null,
  ].filter(Boolean)
  return (
    <section className="sp-progn" aria-labelledby="sp-prog-h">
      <div className="sp-side-head">
        <h2 className="sp-h3" id="sp-prog-h">
          Prognos
        </h2>
        {p.total != null && p.delta != null && p.delta !== 0 ? (
          <span className="sp-delta" data-sign={p.delta > 0 ? 'up' : 'down'}>
            {p.delta > 0 ? (
              <TrendingUp size={15} strokeWidth={2.25} aria-hidden />
            ) : (
              <TrendingDown size={15} strokeWidth={2.25} aria-hidden />
            )}
            {fmtDelta(p.delta)} sedan förra veckan
          </span>
        ) : null}
      </div>
      {p.total == null ? (
        <p className="sp-caveat">
          Prognosen visas när du har svarat i både den verbala och den kvantitativa delen.
        </p>
      ) : (
        <>
          <div className="sp-progn-row">
            <p className="sp-progn-n" aria-describedby={p.caveat ? 'sp-caveat' : undefined}>
              <span aria-hidden>≈</span>
              <span className="sp-sr">ungefär </span>
              {fmtScore(p.total)}
              <span className="sp-progn-of">av 2,0</span>
            </p>
            {p.caveat ? (
              <p className="sp-caveat" id="sp-caveat">
                {p.caveat}
              </p>
            ) : null}
          </div>
          <div
            className="sp-scale"
            role="img"
            aria-label={`Prognos ${fmtScore(p.total)} på skalan 0 till 2,0${range ? `, osäkerhet ${fmtScore(range.low)} till ${fmtScore(range.high)}` : ''}`}
          >
            <span className="sp-scale-track">
              {range ? (
                <span
                  className="sp-scale-range"
                  style={{ left: pct(range.low), width: pct(range.high - range.low) }}
                />
              ) : null}
              <span className="sp-scale-mark" style={{ left: pct(p.total) }} />
            </span>
            {range ? (
              <span className="sp-scale-label" style={{ left: pct((range.low + range.high) / 2) }}>
                osäkerhet
              </span>
            ) : null}
            {[0, 0.5, 1, 1.5, 2].map((v) => (
              <span key={v} className="sp-scale-tick" style={{ left: pct(v) }}>
                {v === 0 ? '0' : fmtScore(v)}
              </span>
            ))}
          </div>
          {halves.length > 0 ? <p className="sp-halves">{halves.join(' · ')}</p> : null}
        </>
      )}
    </section>
  )
}

function Traps() {
  const { data } = useDirectionData()
  const traps = data.home.traps
  if (traps.length === 0) return null
  return (
    <section aria-labelledby="sp-traps-h">
      <div className="sp-side-head">
        <h2 className="sp-h3" id="sp-traps-h">
          Dina fällor just nu
        </h2>
      </div>
      <ul className="sp-traps">
        {traps.map((t) => (
          <li key={t.frameworkId} className="sp-trap" data-sec={secOf(t.section)}>
            <span className="sp-sec-chip sp-sec-chip--sm">{t.section}</span>
            <span className="sp-trap-text">
              <b>{t.name}</b>
              {t.pattern ? <span>{t.pattern}</span> : null}
            </span>
            <span className="sp-trap-count">
              {t.count}×
              {t.rising ? (
                <>
                  <span aria-hidden> ↑</span>
                  <span className="sp-sr">, ökar</span>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Recent({ onGo }: { onGo: (d: Destination) => void }) {
  const { data } = useDirectionData()
  const recent = data.home.recent
  if (recent.length === 0) return null
  return (
    <section aria-labelledby="sp-recent-h">
      <div className="sp-side-head">
        <h2 className="sp-h3" id="sp-recent-h">
          Senaste passen
        </h2>
        <button type="button" className="sp-link" onClick={() => onGo('framsteg')}>
          Alla pass
          <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>
      <ul className="sp-tiles">
        {recent.map((r) => (
          <li key={r.id} className="sp-tile" data-sec={secOf(r.label)}>
            <span className="sp-tile-label">{r.label === 'Repetition' ? 'Rep' : r.label}</span>
            <b className="sp-tile-score">
              {r.correct}
              <span>/{r.total}</span>
            </b>
            <span className="sp-tile-when">{r.when}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
