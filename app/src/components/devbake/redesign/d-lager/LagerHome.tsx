// Lager · Idag — the three levels made legible.
//   field  the date, a quiet Fraunces greeting and, below the sheets, the
//          notes (traps, recent passes, the week) as plain text on the
//          ambient light — information that does not need a card;
//   sheets the resume sheet, lifted highest, with the page's largest type
//          and a window onto ¶1 of the text it returns to; one side sheet
//          with what comes after ("Sedan") and the prognosis with its
//          caveat;
//   glass  the dock (Lager.tsx).
// Accent appears only on the primary button and the current nav item.

import { ArrowRight, ChevronRight, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'

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
  UNIT,
  WEEK,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  type Destination,
  fmtDelta,
  fmtScore,
  parsePassage,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'

const WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem']

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

/** Monday first; Friday 9 October is today. Four practised days this week. */
const WEEK_DAYS = [
  { d: 'M', name: 'måndag', on: true },
  { d: 'T', name: 'tisdag', on: true },
  { d: 'O', name: 'onsdag', on: false },
  { d: 'T', name: 'torsdag', on: true },
  { d: 'F', name: 'fredag', on: true, today: true },
  { d: 'L', name: 'lördag', on: false },
  { d: 'S', name: 'söndag', on: false },
]

const FIRST_PARAGRAPH = parsePassage(UNIT.context).paragraphs[0]

const capital = (s: string) => s.replace(/^./, (c) => c.toUpperCase())

export function LagerHome({
  width,
  live,
  onResume,
  onGo,
  account,
}: {
  width: WidthKey
  live: boolean
  onResume: () => void
  onGo: (d: Destination) => void
  account: ReactNode
}) {
  useKeyMap({ Enter: onResume }, live)
  const phone = width === 'phone'
  const left = RESUME.total - RESUME.answered
  const primary = PLAN.items.find((i) => i.primary) ?? PLAN.items[0]
  // Sheets rise into place one by one (the field and the glass stay still).
  const rise = live ? ' la-rise' : ''
  const paused = RESUME.pausedAt.replace('Idag · ', 'idag ')

  const hello = (
    <div className="la-hello">
      <p className="la-date">{TODAY.dateLabel}</p>
      <h1 className="la-greet">{TODAY.greeting}.</h1>
      <p className="la-sub">
        Du är mitt i en LÄS-text – {WORDS[left]} frågor kvar. Sedan står{' '}
        {primary.title.toLowerCase()} på tur.
      </p>
    </div>
  )

  const resume = (
    <section
      className={`la-sheet la-resume${rise}`}
      data-depth="2"
      aria-labelledby="la-resume-title"
    >
      <div className="la-resume-top">
        <span className="la-chip la-sec" data-sec="LÄS">
          Påbörjad · {RESUME.kind}
        </span>
        <span className="la-resume-when">
          {/* On the phone, "on the phone" says nothing. */}
          Pausad {paused}
          {phone ? null : ` på ${DEVICE_DEFINITE[RESUME.device] ?? RESUME.device}`}
        </span>
      </div>
      <h2 className="la-resume-title" id="la-resume-title">
        {RESUME.title}
      </h2>
      <p className="la-resume-sub">{RESUME.subtitle}</p>
      {/* A window onto the reading sheet the reader will return to. */}
      <div className="la-peek" aria-hidden>
        <span className="la-pn">1</span>
        {FIRST_PARAGRAPH}
      </div>
      <div className="la-resume-foot">
        <div className="la-progress">
          <Bars total={RESUME.total} done={RESUME.answered} />
          <span>
            Fråga {RESUME.position} av {RESUME.total} · ca {RESUME.minutesLeft} min kvar
          </span>
        </div>
        <button type="button" className="la-btn" onClick={onResume} data-testid="rd-resume">
          Fortsätt läsa
          <kbd className="la-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
      </div>
    </section>
  )

  const side = (
    <div className={`la-sheet la-side${rise}`} data-depth="1">
      <section className="la-side-sec" aria-labelledby="la-plan-h">
        <div className="la-side-head">
          <h2 className="la-h" id="la-plan-h">
            Sedan
          </h2>
          <span className="la-meta">
            {PLAN.items.length} delar · {PLAN.minutes} min
          </span>
        </div>
        <ol>
          {PLAN.items.map((item, i) => (
            <li key={item.id}>
              <button type="button" className="la-row" onClick={() => onGo(PLAN_DEST[item.kind])}>
                <span className="la-row-n" aria-hidden>
                  {i + 1}
                </span>
                <span>
                  <span className="la-row-title">
                    {item.title}
                    <span>{item.detail}</span>
                  </span>
                  <span className="la-row-why">{item.rationale}</span>
                </span>
                <span className="la-row-min">
                  {item.minutes} min
                  <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
      <section className="la-side-sec la-prog" aria-labelledby="la-prog-h">
        <div className="la-prog-row">
          <h2 className="la-h" id="la-prog-h">
            Prognos
          </h2>
          <span className="la-delta">
            <TrendingUp size={15} strokeWidth={2} aria-hidden />
            {fmtDelta(PROGNOSIS.delta)} sedan förra veckan
          </span>
        </div>
        <p className="la-prog-n" aria-describedby="la-caveat" style={{ marginTop: 10 }}>
          {fmtScore(PROGNOSIS.total)}
          <sup aria-hidden>*</sup>
          <small>av 2,0</small>
        </p>
        <Range />
        <p className="la-halves">
          Verbal {fmtScore(PROGNOSIS.verbal)} · Kvant {fmtScore(PROGNOSIS.quant)}
        </p>
        <p className="la-caveat" id="la-caveat">
          <span aria-hidden>*</span>
          <span>{ESTIMATE_CAVEAT}</span>
        </p>
      </section>
    </div>
  )

  const notes = (
    <div className="la-notes">
      <section aria-labelledby="la-traps-h">
        <h2 className="la-note-h" id="la-traps-h">
          Dina fällor just nu
        </h2>
        <ul>
          {TRAPS.map((t) => (
            <li key={t.frameworkId} className="la-trap">
              <span className="la-trap-meta">
                <span className="la-chip la-sec" data-sec={t.section}>
                  {t.section}
                </span>
                <span className="la-trap-n">
                  {t.count}×
                  {t.rising ? (
                    <>
                      <span aria-hidden> ↑</span>
                      <span className="la-sr"> gånger, ökar</span>
                    </>
                  ) : (
                    <span className="la-sr"> gånger</span>
                  )}
                </span>
              </span>
              <span className="la-trap-name">{t.name}</span>
              <span className="la-trap-pattern">{t.pattern}</span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="la-recent-h">
        <h2 className="la-note-h" id="la-recent-h">
          Senaste passen
        </h2>
        <dl>
          {RECENT.map((r) => (
            <div key={r.id} className="la-pass">
              <dt>
                {r.label}
                <span>{r.when}</span>
              </dt>
              <dd>
                {r.correct}/{r.total}
              </dd>
            </div>
          ))}
        </dl>
        <button type="button" className="la-link" onClick={() => onGo('framsteg')}>
          Alla pass i Framsteg
          <ArrowRight size={14} strokeWidth={2} aria-hidden />
        </button>
      </section>
      <section className="la-week" aria-labelledby="la-week-h">
        <h2 className="la-note-h" id="la-week-h">
          Den här veckan
        </h2>
        <div className="la-week-days">
          {WEEK_DAYS.map((day) => (
            <i
              key={day.name}
              data-on={String(day.on)}
              data-today={String(day.today === true)}
              title={`${day.name}${day.on ? ': övat' : ''}`}
            >
              {day.d}
            </i>
          ))}
        </div>
        <p>
          {WEEK.minutesToday} minuter idag. {capital(WORDS[WEEK.daysPractised])} av{' '}
          {WORDS[WEEK.goal]} dagar – en dag till i helgen räcker för veckans mål.
        </p>
      </section>
    </div>
  )

  if (phone) {
    return (
      <div className="la-phome">
        <div className="la-ptop">
          <span className="la-mark-word">
            <i aria-hidden />
            HP-Coach
          </span>
          <p className="la-count">
            <b>{EXAM.daysLeft}</b> dagar kvar
          </p>
          {account}
        </div>
        {hello}
        <div className="la-pstack">
          {resume}
          {side}
          {notes}
        </div>
      </div>
    )
  }

  return (
    <div className="la-home">
      <div className="la-top">
        <span className="la-mark-word">
          <i aria-hidden />
          HP-Coach
        </span>
        <p className="la-count">
          <b>{EXAM.daysLeft}</b> dagar till högskoleprovet · {EXAM.shortDate}
        </p>
      </div>
      {hello}
      <div className="la-grid">
        {resume}
        {side}
        {notes}
      </div>
    </div>
  )
}

export function Bars({ total, done }: { total: number; done: number }) {
  return (
    <span className="la-dots" role="img" aria-label={`${done} av ${total} besvarade`}>
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

/** The 0–2,0 scale: a tick for the estimate, a soft band for its range. */
function Range() {
  const pct = (v: number) => `${(v / PROGNOSIS.target) * 100}%`
  return (
    <div
      className="la-range"
      role="img"
      aria-label={`Trolig nivå ${fmtScore(PROGNOSIS.low)} till ${fmtScore(PROGNOSIS.high)} på skalan 0 till 2,0`}
    >
      <span className="la-range-track" />
      <span
        className="la-range-band"
        style={{ left: pct(PROGNOSIS.low), width: pct(PROGNOSIS.high - PROGNOSIS.low) }}
      />
      <span className="la-range-tick" style={{ left: pct(PROGNOSIS.total) }} />
      {[0, 1, 2].map((v) => (
        <span
          key={v}
          className="la-range-label"
          style={{ left: pct(v), translate: v === 0 ? '0 0' : v === 2 ? '-100% 0' : undefined }}
        >
          {v === 0 ? '0' : fmtScore(v)}
        </span>
      ))}
    </div>
  )
}
