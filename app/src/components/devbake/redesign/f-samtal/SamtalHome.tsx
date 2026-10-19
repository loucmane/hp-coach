// Samtal · Idag. One exchange, then the rest of the day as message cards.
//
// The conversation opens with the date and the countdown on a centred
// line, then the coach's one question — "God eftermiddag. Du var mitt i
// LÄS, fråga 3 av 4. Fortsätta?" — set as the page's largest type, with the
// paused text attached like a document in a message. Two replies wait where
// your answer will go: Fortsätt (the screen's one filled button) and Visa
// dagens plan. Choosing the plan makes it your turn and the coach answers
// with the plan in full; at most three turns ever stand before the replies.
// Below a quiet line, the rest of the day arrives as compact cards: the
// plan, the prognosis with its caveat as a footnote turn, the one trap that
// matters now and the recent passes.

import { ArrowRight, FileText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
import { Coach, Divider, Dots, Kbd, Replies, You } from './SamtalParts'

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

/** The plan's first part: offered once the text is read. */
const FIRST = PLAN.items.find((i) => i.primary) ?? PLAN.items[0]

export function SamtalHome({
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
  // The reader has asked for the plan: it becomes their turn and the
  // coach's answer, and leaves the cards below.
  const [asked, setAsked] = useState(false)
  const planTurn = useRef<HTMLElement>(null)
  useEffect(() => {
    if (asked && live) planTurn.current?.focus({ preventScroll: true })
  }, [asked, live])
  const trap = TRAPS.find((t) => t.rising) ?? TRAPS[0]
  const paused = RESUME.pausedAt.replace('Idag · ', 'idag ')

  return (
    <div className="sa-home" data-width={width}>
      {/* The conversation opens with its date, as a messages thread does;
       *  the coach says the countdown. */}
      <Divider>{TODAY.dateLabel}</Divider>

      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby="sa-lead-q">
          <p className="sa-hello">
            {TODAY.greeting}. <b>{EXAM.daysLeft}&nbsp;dagar</b> kvar till högskoleprovet.
          </p>
          <h1 className="sa-lead-q" id="sa-lead-q">
            {/* "fråga 3 av 4" never breaks. */}
            Du var mitt i {RESUME.section}, fråga&nbsp;{RESUME.position}&nbsp;av&nbsp;
            {RESUME.total}. Fortsätta?
          </h1>
          {/* The paused text, attached to the turn like a document. */}
          <div className="sa-attach">
            <span className="sa-attach-icon" aria-hidden>
              <FileText size={20} strokeWidth={1.6} />
            </span>
            <span className="sa-attach-body">
              <span className="sa-attach-title">
                {RESUME.title}
                <span className="sa-sr">: </span>
                <span className="sa-attach-sub">{RESUME.subtitle}</span>
              </span>
              <span className="sa-attach-meta">
                <Dots total={RESUME.total} done={RESUME.answered} />
                <span>ca {RESUME.minutesLeft}&nbsp;min kvar</span>
              </span>
              <span className="sa-attach-when">
                Pausad {paused} på {DEVICE_DEFINITE[RESUME.device] ?? RESUME.device}
              </span>
            </span>
          </div>
        </Coach>

        {asked ? (
          <>
            <You>
              <p>Visa dagens plan</p>
            </You>
            <Coach as="section" aria-labelledby="sa-plan-said" tabIndex={-1} ref={planTurn}>
              <p className="sa-say" id="sa-plan-said">
                Efter texten väntar {WORDS[PLAN.items.length]} saker, ungefär {PLAN.minutes}
                &nbsp;minuter:
              </p>
              <PlanList detailed onGo={onGo} />
              <p className="sa-week">
                {WEEK.minutesToday} minuter idag · {WORDS[WEEK.daysPractised]} av {WORDS[WEEK.goal]}{' '}
                dagar den här veckan
              </p>
            </Coach>
          </>
        ) : null}

        <Replies>
          <button
            type="button"
            className="sa-chip sa-chip--primary sa-chip--big"
            onClick={onResume}
            data-testid="rd-resume"
          >
            {asked ? 'Fortsätt med texten' : 'Fortsätt'}
            <Kbd>↵</Kbd>
          </button>
          {asked ? (
            <button
              type="button"
              className="sa-chip sa-chip--big"
              onClick={() => onGo(PLAN_DEST[FIRST.kind])}
            >
              Börja med {FIRST.title.toLowerCase()}
            </button>
          ) : (
            <button type="button" className="sa-chip sa-chip--big" onClick={() => setAsked(true)}>
              Visa dagens plan
            </button>
          )}
        </Replies>
      </div>

      <div className="sa-later">
        <Divider quiet>Resten av dagen</Divider>
        <div className="sa-cards">
          {asked ? null : (
            <section className="sa-card sa-card--plan" aria-labelledby="sa-plan-h">
              <header className="sa-card-head">
                <h2 id="sa-plan-h">Dagens plan</h2>
                <span>
                  {PLAN.items.length} delar · {PLAN.minutes}&nbsp;min
                </span>
              </header>
              <PlanList onGo={onGo} />
              <p className="sa-week">
                {WEEK.minutesToday} minuter idag · {WORDS[WEEK.daysPractised]} av {WORDS[WEEK.goal]}{' '}
                dagar den här veckan
              </p>
            </section>
          )}

          <div className="sa-score-wrap">
            <section className="sa-card sa-card--score" aria-labelledby="sa-score-h">
              <header className="sa-card-head">
                <h2 id="sa-score-h">Prognos</h2>
                <span>
                  Verbal {fmtScore(PROGNOSIS.verbal)} · Kvant {fmtScore(PROGNOSIS.quant)}
                </span>
              </header>
              <p className="sa-score">
                <span className="sa-score-n" aria-describedby="sa-caveat">
                  {fmtScore(PROGNOSIS.total)}
                  <sup aria-hidden>*</sup>
                </span>
                <span className="sa-score-of">av 2,0</span>
                <span className="sa-score-delta">
                  {fmtDelta(PROGNOSIS.delta)} sedan förra veckan
                </span>
              </p>
              <Scale />
            </section>
            {/* The caveat is the coach's footnote to the card above. */}
            <p className="sa-footnote" id="sa-caveat">
              <b aria-hidden>*</b>
              <span>{ESTIMATE_CAVEAT}</span>
            </p>
          </div>

          <section className="sa-card sa-card--trap" aria-labelledby="sa-trap-h">
            <header className="sa-card-head">
              <h2 id="sa-trap-h">Fällan just nu</h2>
              <span>
                {trap.section} · {trap.count} gånger
                {trap.rising ? (
                  <>
                    <span aria-hidden> ↑</span>
                    <span className="sa-sr">, ökar</span>
                  </>
                ) : null}
              </span>
            </header>
            <p className="sa-trap-name">{trap.name}</p>
            <p className="sa-trap-pattern">”{trap.pattern}”</p>
            <button type="button" className="sa-link" onClick={() => onGo('framsteg')}>
              Alla fällor i Framsteg
              <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
            </button>
          </section>

          {/* The recent passes are one line the coach says, not a card. */}
          <Coach as="section" kind="sa-turn--line" aria-labelledby="sa-recent-h">
            <h2 className="sa-line-h" id="sa-recent-h">
              Senaste passen
            </h2>
            <ul className="sa-recent">
              {RECENT.map((r) => (
                <li key={r.id}>
                  <b>{r.label}</b>{' '}
                  <span className="sa-recent-score">
                    {r.correct}/{r.total}
                  </span>{' '}
                  <span className="sa-recent-when">{r.when.toLocaleLowerCase('sv-SE')}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="sa-link" onClick={() => onGo('framsteg')}>
              Alla pass i Framsteg
              <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
            </button>
          </Coach>
        </div>
      </div>
    </div>
  )
}

/** The plan's three parts. Compact on the card; in the coach's answer each
 *  part also says why it is there. */
function PlanList({
  detailed = false,
  onGo,
}: {
  detailed?: boolean
  onGo: (d: Destination) => void
}) {
  return (
    <ol className="sa-plan" data-detailed={String(detailed)}>
      {PLAN.items.map((item, i) => (
        <li key={item.id}>
          <button
            type="button"
            className="sa-plan-row"
            data-primary={String(item.primary === true)}
            onClick={() => onGo(PLAN_DEST[item.kind])}
          >
            <span className="sa-plan-n" aria-hidden>
              {i + 1}
            </span>
            <span className="sa-plan-body">
              <span className="sa-plan-title">
                {item.title}
                {item.primary ? <span className="sa-plan-tag">Härnäst</span> : null}
              </span>
              <span className="sa-plan-detail">{item.detail}</span>
              {detailed ? <span className="sa-plan-why">{item.rationale}</span> : null}
            </span>
            <span className="sa-plan-min">{item.minutes}&nbsp;min</span>
          </button>
        </li>
      ))}
    </ol>
  )
}

/** The prognosis on its 0–2,0 scale: the likely range and the point. */
function Scale() {
  const pct = (v: number) => `${(v / PROGNOSIS.target) * 100}%`
  return (
    <div
      className="sa-scale"
      role="img"
      aria-label={`Trolig nivå ${fmtScore(PROGNOSIS.low)} till ${fmtScore(PROGNOSIS.high)} på skalan 0 till 2,0`}
    >
      <span className="sa-scale-track" />
      <span
        className="sa-scale-range"
        style={{ left: pct(PROGNOSIS.low), width: pct(PROGNOSIS.high - PROGNOSIS.low) }}
      />
      <span className="sa-scale-mark" style={{ left: pct(PROGNOSIS.total) }} />
      {[0, 0.5, 1, 1.5, 2].map((v) => (
        <span key={v} className="sa-scale-tick" style={{ left: pct(v) }}>
          {v === 0 ? '0' : fmtScore(v)}
        </span>
      ))}
    </div>
  )
}
