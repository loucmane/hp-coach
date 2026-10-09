// Spår · Idag — the day as a path. A vertical trail of today's steps:
// the LÄS text already under way is the first, dominant stop (its section
// colour in the header, the screen's one primary pill), the plan's three
// items follow as quieter stops in their own colours, and the trail ends at
// a goal, not a streak. Beside it: the week's goal as earned dots only, the
// prognosis as a plain 0–2,0 bar with its uncertainty and caveat, traps as
// section-marked rows and the last passes as small tiles. "Lugnt läge" is a
// visible switch right here, and hides the dots, the bar and the nav dot.

import { ArrowRight, Check, ChevronRight, Flag, TrendingUp } from 'lucide-react'

import {
  ESTIMATE_CAVEAT,
  EXAM,
  PLAN,
  type PlanItem,
  PROGNOSIS,
  RECENT,
  RESUME,
  TODAY,
  TRAPS,
  WEEK,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  type Destination,
  fmtDelta,
  fmtScore,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { CalmSwitch, Kbd, SECTION_NAMES, secOf } from './sparParts'

const WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex']
const cap = (s: string) => s.charAt(0).toLocaleUpperCase('sv-SE') + s.slice(1)

const PLAN_DEST: Record<PlanItem['kind'], Destination> = {
  repetition: 'ova',
  lektion: 'uppslag',
  övning: 'ova',
}

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
  useKeyMap({ Enter: onResume }, live)
  const phone = width === 'phone'
  const steps = 1 + PLAN.items.length
  const minutes = RESUME.minutesLeft + PLAN.minutes
  const date = TODAY.dateLabel.toLocaleLowerCase('sv-SE')
  return (
    <div className="sp-home" data-phone={String(phone)}>
      <header className="sp-home-head">
        <div className="sp-home-intro">
          <p className="sp-eyebrow">
            {phone ? `${cap(date)} · ${EXAM.daysLeft} dagar kvar` : `${TODAY.greeting} · ${date}`}
          </p>
          <h1 className="sp-display sp-display--xl">Dagens stig</h1>
          <div className="sp-lede-row">
            <p className="sp-lede">
              {cap(WORDS[steps])} steg, ungefär {minutes} minuter.
              {phone ? null : ' Du är mitt i det första.'}
            </p>
            {phone ? <CalmSwitch calm={calm} setCalm={setCalm} testid="sp-calm-home" /> : null}
          </div>
        </div>
        {phone ? null : (
          <div className="sp-home-tools">
            <p className="sp-countdown">
              <span>
                <b>{EXAM.daysLeft} dagar</b> till högskoleprovet
              </span>
              <span className="sp-countdown-date">{EXAM.shortDate}</span>
            </p>
            <CalmSwitch calm={calm} setCalm={setCalm} testid="sp-calm-home" />
          </div>
        )}
      </header>
      <div className="sp-home-grid">
        <Path onResume={onResume} onGo={onGo} />
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

function Path({ onResume, onGo }: { onResume: () => void; onGo: (d: Destination) => void }) {
  return (
    <ol className="sp-path" aria-label="Dagens stig">
      <li className="sp-node" data-kind="now" data-sec="LÄS">
        <span className="sp-node-mark">
          <NodeRing done={RESUME.answered} total={RESUME.total} />
        </span>
        <article className="sp-now" aria-labelledby="sp-now-title">
          <div className="sp-now-band">
            <span className="sp-sec-chip">LÄS</span>
            <span className="sp-now-band-text">{SECTION_NAMES.LÄS}</span>
            <span className="sp-now-state">Påbörjad</span>
          </div>
          <div className="sp-now-body">
            <h2 className="sp-now-title" id="sp-now-title">
              {RESUME.title}
            </h2>
            <p className="sp-now-sub">{RESUME.subtitle}</p>
            <div className="sp-now-progress">
              <QBar done={RESUME.answered} total={RESUME.total} />
              <span>
                <b>
                  Fråga {RESUME.position} av {RESUME.total}
                </b>{' '}
                · ca {RESUME.minutesLeft} min kvar
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
              <span className="sp-now-meta">
                Pausad {RESUME.pausedAt.replace('Idag · ', 'idag ')} på{' '}
                {DEVICE_DEFINITE[RESUME.device] ?? RESUME.device}
              </span>
            </div>
          </div>
        </article>
      </li>
      {PLAN.items.map((item, i) => (
        <li key={item.id} className="sp-node" data-kind="next" data-sec={secOf(item.section)}>
          <span className="sp-node-mark" aria-hidden>
            {i + 2}
          </span>
          <button type="button" className="sp-step" onClick={() => onGo(PLAN_DEST[item.kind])}>
            <span className="sp-step-main">
              <span className="sp-step-title">
                {item.title}
                <span className="sp-step-detail">{item.detail}</span>
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
            Efter fyra steg är dagen klar. Hinner du inte allt flyttas resten till imorgon.
          </span>
        </p>
      </li>
    </ol>
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
        strokeDasharray={`${(done / total) * c} ${c}`}
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
 *  practice never shows as an empty past slot. */
function Week() {
  return (
    <section className="sp-week" aria-labelledby="sp-week-h">
      <div className="sp-side-head">
        <h2 className="sp-h3" id="sp-week-h">
          Veckans mål
        </h2>
        <span className="sp-side-meta">{WEEK.minutesToday} min idag</span>
      </div>
      <div className="sp-goal-row">
        <span
          className="sp-goal-dots"
          role="img"
          aria-label={`${WEEK.daysPractised} av ${WEEK.goal} dagar`}
        >
          {Array.from({ length: WEEK.goal }, (_, i) => (
            <i
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length goal marks
              key={i}
              data-on={String(i < WEEK.daysPractised)}
            >
              {i < WEEK.daysPractised ? <Check size={14} strokeWidth={3} aria-hidden /> : null}
            </i>
          ))}
        </span>
        <p className="sp-goal-text">
          <b>
            {WEEK.daysPractised} av {WEEK.goal}
          </b>{' '}
          dagar
        </p>
      </div>
    </section>
  )
}

function Prognosis() {
  const pct = (v: number) => `${(v / PROGNOSIS.target) * 100}%`
  return (
    <section className="sp-progn" aria-labelledby="sp-prog-h">
      <div className="sp-side-head">
        <h2 className="sp-h3" id="sp-prog-h">
          Prognos
        </h2>
        <span className="sp-delta">
          <TrendingUp size={15} strokeWidth={2.25} aria-hidden />
          {fmtDelta(PROGNOSIS.delta)} sedan förra veckan
        </span>
      </div>
      <div className="sp-progn-row">
        <p className="sp-progn-n" aria-describedby="sp-caveat">
          <span aria-hidden>≈</span>
          <span className="sp-sr">ungefär </span>
          {fmtScore(PROGNOSIS.total)}
          <span className="sp-progn-of">av 2,0</span>
        </p>
        <p className="sp-caveat" id="sp-caveat">
          {ESTIMATE_CAVEAT}
        </p>
      </div>
      <div
        className="sp-scale"
        role="img"
        aria-label={`Prognos ${fmtScore(PROGNOSIS.total)} på skalan 0 till 2,0, osäkerhet ${fmtScore(PROGNOSIS.low)} till ${fmtScore(PROGNOSIS.high)}`}
      >
        <span className="sp-scale-track">
          <span
            className="sp-scale-range"
            style={{ left: pct(PROGNOSIS.low), width: pct(PROGNOSIS.high - PROGNOSIS.low) }}
          />
          <span className="sp-scale-mark" style={{ left: pct(PROGNOSIS.total) }} />
        </span>
        <span
          className="sp-scale-label"
          style={{ left: pct((PROGNOSIS.low + PROGNOSIS.high) / 2) }}
        >
          osäkerhet
        </span>
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <span key={v} className="sp-scale-tick" style={{ left: pct(v) }}>
            {v === 0 ? '0' : fmtScore(v)}
          </span>
        ))}
      </div>
      <p className="sp-halves">
        Verbal {fmtScore(PROGNOSIS.verbal)} · Kvant {fmtScore(PROGNOSIS.quant)}
      </p>
    </section>
  )
}

function Traps() {
  return (
    <section aria-labelledby="sp-traps-h">
      <div className="sp-side-head">
        <h2 className="sp-h3" id="sp-traps-h">
          Dina fällor just nu
        </h2>
      </div>
      <ul className="sp-traps">
        {TRAPS.map((t) => (
          <li key={t.frameworkId} className="sp-trap" data-sec={secOf(t.section)}>
            <span className="sp-sec-chip sp-sec-chip--sm">{t.section}</span>
            <span className="sp-trap-text">
              <b>{t.name}</b>
              <span>{t.pattern}</span>
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
        {RECENT.map((r) => (
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
