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
//
// Kit v2: everything comes from useDirectionData().data.home. What the real
// app cannot fill (the pause time, minutes left and device of the paused
// sitting, the prognosis range, the weekly goal, the plan's lead marker) is
// simply left out when absent, never shown as a placeholder. Without a
// paused sitting the coach offers the plan instead. "Alla pass i Framsteg"
// opens Framsteg on its Historik, where the finished passes are.

import { ArrowRight, FileText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { PlanItemView, ResumeView, WeekView } from '@/components/devbake/redesign/viewModel'
import { Coach, count, Divider, Dots, Kbd, Replies, ScoreCard, words, You } from './SamtalParts'

const DEVICE_DEFINITE: Record<string, string> = {
  telefon: 'telefonen',
  dator: 'datorn',
  surfplatta: 'surfplattan',
}

export function SamtalHome({
  width,
  live,
  onResume,
  onHistory,
}: {
  width: WidthKey
  live: boolean
  onResume: () => void
  /** Framsteg's Historik (the frame opens it); Framsteg's door without. */
  onHistory?: () => void
}) {
  const { data, actions } = useDirectionData()
  const { today, exam, resume, plan, prognosis, traps, recent, week } = data.home
  /** The plan's first part still to do (the lead marker's, unless it is
   *  done): offered once the text is read. None once the plan is done. */
  const first = plan.allComplete
    ? null
    : (plan.items.find((i) => i.primary && !i.completed) ??
      plan.items.find((i) => !i.completed) ??
      null)
  const startFirst = () => (first ? actions.openPlanItem(first.id) : actions.go('ova'))
  useKeyMap({ Enter: resume ? onResume : startFirst }, live)
  // The reader has asked for the plan: it becomes their turn and the
  // coach's answer, and leaves the cards below.
  const [asked, setAsked] = useState(false)
  const planTurn = useRef<HTMLElement>(null)
  useEffect(() => {
    if (asked && live) planTurn.current?.focus({ preventScroll: true })
  }, [asked, live])
  const trap = traps.find((t) => t.rising) ?? traps[0] ?? null
  const weekLine = weekSentence(week)
  const things = plan.items.length === 1 ? 'en sak' : `${words(plan.items.length)} saker`
  // "Fortsätt med texten" for a reading text, "med övningen" otherwise.
  const what =
    resume && (resume.section === 'LÄS' || resume.section === 'ELF') ? 'texten' : 'övningen'

  return (
    <div className="sa-home" data-width={width}>
      {/* The conversation opens with its date, as a messages thread does;
       *  the coach says the countdown. */}
      <Divider>{today.dateLabel}</Divider>

      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby="sa-lead-q">
          <p className="sa-hello">
            {today.greeting}. <b>{count(exam.daysLeft, 'dag', 'dagar')}</b> kvar till
            högskoleprovet.
          </p>
          {resume ? (
            <>
              <h1 className="sa-lead-q" id="sa-lead-q" tabIndex={-1}>
                {/* "fråga 3 av 4" never breaks. */}
                Du var mitt i {resume.section}, fråga&nbsp;{resume.position}&nbsp;av&nbsp;
                {resume.total}. Fortsätta?
              </h1>
              <ResumeAttachment resume={resume} />
            </>
          ) : (
            <h1 className="sa-lead-q" id="sa-lead-q" tabIndex={-1}>
              {plan.allComplete
                ? 'Dagens plan är klar. Vill du öva mer?'
                : first
                  ? `Idag väntar ${things}, ungefär ${plan.minutes} minuter. Ska vi börja?`
                  : 'Vad vill du öva idag?'}
            </h1>
          )}
        </Coach>

        {asked ? (
          <>
            <You>
              <p>Visa dagens plan</p>
            </You>
            <Coach as="section" aria-labelledby="sa-plan-said" tabIndex={-1} ref={planTurn}>
              <p className="sa-say" id="sa-plan-said">
                {resume ? 'Efter texten väntar' : 'Idag väntar'} {things}, ungefär {plan.minutes}
                &nbsp;minuter:
              </p>
              <PlanList items={plan.items} detailed onOpen={actions.openPlanItem} />
              {weekLine ? <p className="sa-week">{weekLine}</p> : null}
            </Coach>
          </>
        ) : null}

        <Replies>
          {resume ? (
            <button
              type="button"
              className="sa-chip sa-chip--primary sa-chip--big"
              onClick={onResume}
              data-testid="rd-resume"
            >
              {asked ? `Fortsätt med ${what}` : 'Fortsätt'}
              <Kbd>↵</Kbd>
            </button>
          ) : (
            <button
              type="button"
              className="sa-chip sa-chip--primary sa-chip--big"
              onClick={startFirst}
            >
              {first && !plan.allComplete ? `Börja med ${first.title.toLowerCase()}` : 'Till Öva'}
              <Kbd>↵</Kbd>
            </button>
          )}
          {asked ? (
            resume && first ? (
              <button type="button" className="sa-chip sa-chip--big" onClick={startFirst}>
                Börja med {first.title.toLowerCase()}
              </button>
            ) : null
          ) : plan.items.length ? (
            <button type="button" className="sa-chip sa-chip--big" onClick={() => setAsked(true)}>
              Visa dagens plan
            </button>
          ) : null}
        </Replies>
      </div>

      <div className="sa-later">
        <Divider quiet>Resten av dagen</Divider>
        <div className="sa-cards">
          {asked || !plan.items.length ? null : (
            <section className="sa-card sa-card--plan" aria-labelledby="sa-plan-h">
              <header className="sa-card-head">
                <h2 id="sa-plan-h">Dagens plan</h2>
                <span>
                  {plan.items.length} delar · {plan.minutes}&nbsp;min
                </span>
              </header>
              <PlanList items={plan.items} onOpen={actions.openPlanItem} />
              {weekLine ? <p className="sa-week">{weekLine}</p> : null}
            </section>
          )}

          <ScoreCard p={prognosis} />

          {trap ? (
            <section className="sa-card sa-card--trap" aria-labelledby="sa-trap-h">
              <header className="sa-card-head">
                <h2 id="sa-trap-h">Fällan just nu</h2>
                <span>
                  {trap.section} · {trap.count} {trap.count === 1 ? 'gång' : 'gånger'}
                  {trap.rising ? (
                    <>
                      <span aria-hidden> ↑</span>
                      <span className="sa-sr">, ökar</span>
                    </>
                  ) : null}
                </span>
              </header>
              <p className="sa-trap-name">{trap.name}</p>
              {trap.pattern ? <p className="sa-trap-pattern">”{trap.pattern}”</p> : null}
              <button type="button" className="sa-link" onClick={() => actions.go('framsteg')}>
                Alla fällor i Framsteg
                <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
              </button>
            </section>
          ) : null}

          {/* The recent passes are one line the coach says, not a card. */}
          {recent.length ? (
            <Coach as="section" kind="sa-turn--line" aria-labelledby="sa-recent-h">
              <h2 className="sa-line-h" id="sa-recent-h">
                Senaste passen
              </h2>
              <ul className="sa-recent">
                {recent.map((r) => (
                  <li key={r.id}>
                    <b>{r.label}</b>{' '}
                    <span className="sa-recent-score">
                      {r.correct}/{r.total}
                    </span>{' '}
                    <span className="sa-recent-when">{r.when.toLocaleLowerCase('sv-SE')}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="sa-link"
                onClick={onHistory ?? (() => actions.go('framsteg'))}
              >
                Alla pass i Framsteg
                <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
              </button>
            </Coach>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** The paused text, attached to the turn like a document. Its pause time,
 *  device and minutes left are said only when known. */
function ResumeAttachment({ resume }: { resume: ResumeView }) {
  const when = pausedLine(resume)
  return (
    <div className="sa-attach">
      <span className="sa-attach-icon" aria-hidden>
        <FileText size={20} strokeWidth={1.6} />
      </span>
      <span className="sa-attach-body">
        <span className="sa-attach-title">
          {resume.title}
          {resume.subtitle ? (
            <>
              <span className="sa-sr">: </span>
              <span className="sa-attach-sub">{resume.subtitle}</span>
            </>
          ) : null}
        </span>
        <span className="sa-attach-meta">
          <Dots total={resume.total} done={resume.answered} />
          {resume.minutesLeft != null ? <span>ca {resume.minutesLeft}&nbsp;min kvar</span> : null}
        </span>
        {when ? <span className="sa-attach-when">{when}</span> : null}
      </span>
    </div>
  )
}

/** "Pausad idag 07:52 på telefonen", from what is known. */
function pausedLine(r: ResumeView): string | null {
  const at = r.pausedAt ? r.pausedAt.replace('Idag · ', 'idag ') : null
  const device = r.device ? (DEVICE_DEFINITE[r.device] ?? r.device) : null
  if (at && device) return `Pausad ${at} på ${device}`
  if (at) return `Pausad ${at}`
  if (device) return `Pausad på ${device}`
  return r.stale ? 'Pausad för mer än en vecka sedan' : null
}

/** "14 minuter idag · fyra av fem dagar den här veckan", from what is
 *  known: no goal, no "av fem". */
function weekSentence(w: WeekView): string | null {
  const parts: string[] = []
  if (w.minutesToday != null) {
    parts.push(`${w.minutesToday} ${w.minutesToday === 1 ? 'minut' : 'minuter'} idag`)
  }
  if (w.daysPractised != null) {
    parts.push(
      w.goal != null
        ? `${words(w.daysPractised)} av ${words(w.goal)} dagar den här veckan`
        : `${words(w.daysPractised)} ${w.daysPractised === 1 ? 'dag' : 'dagar'} den här veckan`,
    )
  }
  return parts.length ? parts.join(' · ') : null
}

/** The plan's parts. Compact on the card; in the coach's answer each part
 *  also says why it is there. */
function PlanList({
  items,
  detailed = false,
  onOpen,
}: {
  items: PlanItemView[]
  detailed?: boolean
  onOpen: (id: string) => void
}) {
  return (
    <ol className="sa-plan" data-detailed={String(detailed)}>
      {items.map((item, i) => {
        // A part already done is never "Härnäst".
        const lead = item.primary === true && !item.completed
        return (
          <li key={item.id}>
            <button
              type="button"
              className="sa-plan-row"
              data-primary={String(lead)}
              onClick={() => onOpen(item.id)}
            >
              <span className="sa-plan-n" aria-hidden>
                {i + 1}
              </span>
              <span className="sa-plan-body">
                <span className="sa-plan-title">
                  {item.title}
                  {lead ? <span className="sa-plan-tag">Härnäst</span> : null}
                </span>
                {item.detail ? <span className="sa-plan-detail">{item.detail}</span> : null}
                {detailed ? <span className="sa-plan-why">{item.rationale}</span> : null}
              </span>
              <span className="sa-plan-min">{item.minutes}&nbsp;min</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
