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

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type Destination,
  fmtDelta,
  fmtScore,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'

const WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem']

const DEVICE_DEFINITE: Record<string, string> = {
  telefon: 'telefonen',
  dator: 'datorn',
  surfplatta: 'surfplattan',
}

const capital = (s: string) => s.replace(/^./, (c) => c.toUpperCase())
const word = (n: number) => WORDS[n] ?? String(n)
const score = (n: number | null) => (n == null ? 'Ännu ingen prognos' : fmtScore(n))

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
  const { data, actions } = useDirectionData()
  const {
    today: TODAY,
    exam: EXAM,
    resume: RESUME,
    plan: PLAN,
    prognosis: PROGNOSIS,
    traps: TRAPS,
    recent: RECENT,
    week: WEEK,
  } = data.home
  const firstParagraph =
    data.drills.reading.questions[data.drills.reading.start.index ?? 0]?.passage?.paragraphs[0]
  const today = new Date(`${TODAY.iso.slice(0, 10)}T12:00:00Z`)
  const monday = new Date(today)
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7))
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setUTCDate(monday.getUTCDate() + i)
    const iso = date.toISOString().slice(0, 10)
    return {
      iso,
      d: ['M', 'T', 'O', 'T', 'F', 'L', 'S'][i],
      name: date.toLocaleDateString('sv-SE', { weekday: 'long', timeZone: 'UTC' }),
      on: data.framsteg.days.some((d) => d.date.slice(0, 10) === iso && d.n > 0),
      today: iso === TODAY.iso.slice(0, 10),
    }
  })
  useKeyMap({ Enter: onResume }, live && RESUME != null)
  const phone = width === 'phone'
  const left = RESUME ? RESUME.total - RESUME.answered : 0
  const primary = PLAN.items.find((i) => i.primary) ?? PLAN.items[0]
  // Sheets rise into place one by one (the field and the glass stay still).
  const rise = live ? ' la-rise' : ''
  const paused = RESUME?.pausedAt?.replace('Idag · ', 'idag ')

  const hello = (
    <div className="la-hello">
      <p className="la-date">{TODAY.dateLabel}</p>
      <h1 className="la-greet">{TODAY.greeting}.</h1>
      <p className="la-sub">
        {RESUME
          ? `Du är mitt i ${RESUME.section === 'LÄS' ? 'en LÄS-text' : 'en övning'} – ${word(left)} frågor kvar.`
          : 'Dagens övning väntar.'}
        {primary ? ` Sedan står ${primary.title.toLowerCase()} på tur.` : ''}
      </p>
    </div>
  )

  const resume = RESUME ? (
    <section
      className={`la-sheet la-resume${rise}`}
      data-depth="2"
      aria-labelledby="la-resume-title"
    >
      <div className="la-resume-top">
        <span className="la-chip la-sec" data-sec={RESUME.section}>
          Påbörjad · {RESUME.kind}
        </span>
        {paused ? (
          <span className="la-resume-when">
            {/* On the phone, "on the phone" says nothing. */}
            Pausad {paused}
            {phone || !RESUME.device
              ? null
              : ` på ${DEVICE_DEFINITE[RESUME.device] ?? RESUME.device}`}
          </span>
        ) : null}
      </div>
      <h2 className="la-resume-title" id="la-resume-title">
        {RESUME.title}
      </h2>
      <p className="la-resume-sub">{RESUME.subtitle}</p>
      {/* A window onto the reading sheet the reader will return to. */}
      {RESUME.section === 'LÄS' && firstParagraph ? (
        <div className="la-peek" aria-hidden>
          <span className="la-pn">1</span>
          {firstParagraph}
        </div>
      ) : null}
      <div className="la-resume-foot">
        <div className="la-progress">
          <Bars total={RESUME.total} done={RESUME.answered} />
          <span>
            Fråga {RESUME.position} av {RESUME.total}
            {RESUME.minutesLeft != null ? ` · ca ${RESUME.minutesLeft} min kvar` : ''}
          </span>
        </div>
        <button type="button" className="la-btn" onClick={onResume} data-testid="rd-resume">
          {RESUME.section === 'LÄS' ? 'Fortsätt läsa' : 'Fortsätt öva'}
          <kbd className="la-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
      </div>
    </section>
  ) : (
    <section className={`la-sheet la-resume${rise}`} data-depth="2">
      <h2 className="la-resume-title">En stund för nästa steg.</h2>
      <button type="button" className="la-btn" onClick={() => onGo('ova')}>
        Till Öva
      </button>
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
              <button
                type="button"
                className="la-row"
                onClick={() => actions.openPlanItem(item.id)}
              >
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
          {PROGNOSIS.delta != null ? (
            <span className="la-delta">
              <TrendingUp size={15} strokeWidth={2} aria-hidden />
              {fmtDelta(PROGNOSIS.delta)} sedan förra veckan
            </span>
          ) : null}
        </div>
        <p className="la-prog-n" aria-describedby="la-caveat" style={{ marginTop: 10 }}>
          {score(PROGNOSIS.total)}
          {PROGNOSIS.caveat ? <sup aria-hidden>*</sup> : null}
          {PROGNOSIS.total != null ? <small>av 2,0</small> : null}
        </p>
        <Range />
        <p className="la-halves">
          Verbal {score(PROGNOSIS.verbal)} · Kvant {score(PROGNOSIS.quant)}
        </p>
        {PROGNOSIS.caveat ? (
          <p className="la-caveat" id="la-caveat">
            <span aria-hidden>*</span>
            <span>{PROGNOSIS.caveat}</span>
          </p>
        ) : null}
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
          {weekDays.map((day) => (
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
          {WEEK.minutesToday != null ? `${WEEK.minutesToday} minuter idag. ` : ''}
          {WEEK.daysPractised != null
            ? `${capital(word(WEEK.daysPractised))}${WEEK.goal != null ? ` av ${word(WEEK.goal)}` : ''} dagar övade.`
            : ''}
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
  const { data } = useDirectionData()
  const PROGNOSIS = data.home.prognosis
  if (PROGNOSIS.low == null || PROGNOSIS.high == null || PROGNOSIS.total == null) return null
  const pct = (v: number) => `${(v / 2) * 100}%`
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
