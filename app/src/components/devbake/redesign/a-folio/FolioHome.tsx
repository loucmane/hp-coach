// Folio · Idag. A front page with one obvious thing to do: the date and
// countdown as a quiet running head, a modest greeting with one sentence
// that sums up the day, then the lead — the text you are in the middle of,
// set as the page's largest headline under a heavy rule with a ribbon
// bookmark, and the screen's only filled button. No box: type, rules and
// space make it the lead. The rest of the day is a contents list with
// leader dots; the prognosis (with its footnoted caveat), the one trap that
// matters now and the recent passes are marginalia behind a column rule.

import { ArrowRight } from 'lucide-react'

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

const WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio']

const DEVICE_DEFINITE: Record<string, string> = {
  telefon: 'telefonen',
  dator: 'datorn',
  surfplatta: 'surfplattan',
}

const PLAN_DEST: Record<PlanItem['kind'], Destination> = {
  repetition: 'ova',
  lektion: 'uppslag',
  övning: 'ova',
}

/** The day in one sentence, from the plan — not a repeat of the card. */
function daySentence(): string {
  const rep = PLAN.items.find((i) => i.kind === 'repetition')
  const misses = rep ? Number.parseInt(rep.detail, 10) : 0
  const parts = ['läs klart texten']
  if (rep) parts.push(`repetera ${WORDS[misses] ?? misses} missar`)
  for (const item of PLAN.items) {
    if (item.kind === 'lektion') parts.push('gör en kort ELF-lektion')
    if (item.kind === 'övning') parts.push(`en snabb ${item.title}`)
  }
  const last = parts.pop()
  const total = PLAN.minutes + RESUME.minutesLeft
  return `Idag: ${parts.join(', ')} och ${last} – ungefär ${total} minuter.`
}

export function FolioHome({
  width,
  live,
  onResume,
  onGo,
}: {
  width: WidthKey
  live: boolean
  onResume: () => void
  onGo: (d: Destination) => void
}) {
  useKeyMap({ Enter: onResume }, live)
  const phone = width === 'phone'
  const trap = TRAPS.find((t) => t.rising) ?? TRAPS[0]

  const masthead = (
    <div className="fo-masthead">
      <span className="fo-label">{TODAY.dateLabel}</span>
      <p className="fo-count">
        <strong>{EXAM.daysLeft}&nbsp;dagar</strong> kvar till högskoleprovet,{' '}
        {/* The day and month never part. */}
        {EXAM.dateLabel.replace(/(\d+) /, '$1 ')}
      </p>
    </div>
  )

  const main = (
    <div>
      <h1 className="fo-greet">{TODAY.greeting}.</h1>
      <p className="fo-day">{daySentence()}</p>

      <section className="fo-resume" aria-labelledby="fo-resume-title">
        <span className="fo-ribbon" aria-hidden />
        <div className="fo-resume-top">
          <span className="fo-label">Påbörjad · {RESUME.section}</span>
          <span className="fo-resume-when">
            Pausad {RESUME.pausedAt.replace('Idag · ', 'idag ')} på{' '}
            {DEVICE_DEFINITE[RESUME.device] ?? RESUME.device}
          </span>
        </div>
        <h2 className="fo-resume-title" id="fo-resume-title">
          {RESUME.title}
        </h2>
        <p className="fo-resume-sub">{RESUME.subtitle}</p>
        <div className="fo-resume-progress">
          <Dots total={RESUME.total} done={RESUME.answered} />
          <span>
            Fråga {RESUME.position} av {RESUME.total} · ca {RESUME.minutesLeft} min kvar
          </span>
        </div>
        <div className="fo-resume-foot">
          <button
            type="button"
            className="fo-btn fo-btn--big"
            onClick={onResume}
            data-testid="rd-resume"
          >
            Fortsätt läsa
            <kbd className="fo-kbd" aria-hidden>
              ↵
            </kbd>
          </button>
          <span className="fo-hint">Texten öppnas vid fråga {RESUME.position}.</span>
        </div>
      </section>

      <section className="fo-section" aria-labelledby="fo-plan-h">
        <div className="fo-section-head">
          <h2 className="fo-h2" id="fo-plan-h">
            Sedan
          </h2>
          <span className="fo-meta">
            {PLAN.items.length} delar · {PLAN.minutes} min
          </span>
        </div>
        <ol>
          {PLAN.items.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                className="fo-plan-row"
                onClick={() => onGo(PLAN_DEST[item.kind])}
              >
                <span className="fo-plan-n" aria-hidden>
                  {i + 1}
                </span>
                <span className="fo-plan-body">
                  <span className="fo-plan-line">
                    <span className="fo-plan-title">
                      {item.title}
                      <span>{item.detail}</span>
                    </span>
                    <span className="fo-leader" aria-hidden />
                    <span className="fo-plan-min">
                      {item.minutes} min
                      <ArrowRight size={15} strokeWidth={1.5} aria-hidden />
                    </span>
                  </span>
                  <span className="fo-plan-why">{item.rationale}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p className="fo-week">
          {WEEK.minutesToday} minuter idag · {WORDS[WEEK.daysPractised]} av {WORDS[WEEK.goal]} dagar
          den här veckan
        </p>
      </section>
    </div>
  )

  const aside = (
    <div className="fo-aside">
      <section className="fo-aside-block" aria-labelledby="fo-prog-h">
        <h2 className="fo-h3" id="fo-prog-h">
          Prognos
        </h2>
        <div className="fo-prog-figure">
          <span className="fo-prog-n" aria-describedby="fo-caveat">
            {fmtScore(PROGNOSIS.total)}
            <sup aria-hidden>*</sup>
          </span>
          <span className="fo-prog-of">av 2,0</span>
        </div>
        <p className="fo-delta">{fmtDelta(PROGNOSIS.delta)} sedan förra veckan</p>
        <p className="fo-halves">
          Verbal {fmtScore(PROGNOSIS.verbal)} · Kvant {fmtScore(PROGNOSIS.quant)}
        </p>
        <Scale />
        <p className="fo-footnote" id="fo-caveat">
          <b aria-hidden>*</b>
          <span>{ESTIMATE_CAVEAT}</span>
        </p>
      </section>

      <section className="fo-aside-block" aria-labelledby="fo-trap-h">
        <h2 className="fo-h3" id="fo-trap-h">
          Din vanligaste fälla just nu
        </h2>
        <p className="fo-trap-meta">
          <b>{trap.section}</b>
          <span>
            {trap.count} gånger
            {trap.rising ? (
              <>
                <span aria-hidden> ↑</span>
                <span className="fo-sr">, ökar</span>
              </>
            ) : null}
          </span>
        </p>
        <span className="fo-trap-name">{trap.name}</span>
        <span className="fo-trap-pattern">{trap.pattern}</span>
        <button type="button" className="fo-link" onClick={() => onGo('framsteg')}>
          Alla fällor i Framsteg
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      </section>

      <section className="fo-aside-block" aria-labelledby="fo-recent-h">
        <h2 className="fo-h3" id="fo-recent-h">
          Senaste passen
        </h2>
        <dl>
          {RECENT.map((r) => (
            <div key={r.id} className="fo-recent">
              <dt>{r.label}</dt>
              <dd className="fo-score">
                {r.correct}/{r.total}
              </dd>
              <dd className="fo-when">{r.when}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="fo-link" onClick={() => onGo('framsteg')}>
          Alla pass i Framsteg
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      </section>
    </div>
  )

  if (phone) {
    return (
      <div className="fo-phome">
        {masthead}
        {main}
        {aside}
      </div>
    )
  }

  return (
    <div className="fo-home">
      {masthead}
      {main}
      {aside}
    </div>
  )
}

export function Dots({ total, done }: { total: number; done: number }) {
  return (
    <span className="fo-dots" role="img" aria-label={`${done} av ${total} besvarade`}>
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

function Scale() {
  const pct = (v: number) => `${(v / PROGNOSIS.target) * 100}%`
  return (
    <div
      className="fo-scale"
      role="img"
      aria-label={`Trolig nivå ${fmtScore(PROGNOSIS.low)} till ${fmtScore(PROGNOSIS.high)} på skalan 0 till 2,0`}
    >
      <span className="fo-scale-axis" />
      <span
        className="fo-scale-range"
        style={{ left: pct(PROGNOSIS.low), width: pct(PROGNOSIS.high - PROGNOSIS.low) }}
      />
      <span className="fo-scale-mark" style={{ left: pct(PROGNOSIS.total) }} />
      {[0, 0.5, 1, 1.5, 2].map((v) => (
        <span key={v} className="fo-scale-tick" style={{ left: pct(v) }}>
          {v === 0 ? '0' : fmtScore(v)}
        </span>
      ))}
    </div>
  )
}
