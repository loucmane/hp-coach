// Folio · Idag. A front page with one obvious thing to do: the date and
// countdown as a quiet running head, a modest greeting with one sentence
// that sums up the day, then the lead — the text you are in the middle of,
// set as the page's largest headline under a heavy rule with a ribbon
// bookmark, and the screen's only filled button. No box: type, rules and
// space make it the lead. The rest of the day is a contents list with
// leader dots; the prognosis (with its footnoted caveat), the one trap that
// matters now and the recent passes are marginalia behind a column rule.
//
// Kit v2: everything on the page comes from useDirectionData(); a field the
// view model marks optional (the pause time and device, the minutes left,
// the prognosis range, the weekly goal) is left out when it is absent.
//
// This file also holds the page grammar every Folio hub page shares (spec
// §1.4, "FolioPage"): the masthead, the lead, the contents entry, the part
// head and the margin block. The spec's parts.tsx is not in batch 1's
// write set, so they live here, beside the page they were drawn from.

import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type Destination,
  fmtDelta,
  fmtScore,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type {
  HomeView,
  PlanItemView,
  PrognosisView,
  ResumeView,
} from '@/components/devbake/redesign/viewModel'

/** Counts in prose, spelled out up to ten (common gender: "en miss"). */
export const WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio']

/** A count as prose: a word up to ten, digits beyond. */
export function inWords(n: number): string {
  return WORDS[n] ?? String(n)
}

export function capitalised(s: string): string {
  return s.charAt(0).toLocaleUpperCase('sv-SE') + s.slice(1)
}

/** A score, or an em dash where there is none yet. */
export function scoreOrDash(n: number | null | undefined): string {
  return n == null ? '—' : fmtScore(n)
}

/** A section code in a test id or element id: 'LÄS' → 'las' (the shared
 *  contract's sectionSlug; contract.ts itself is test-only). */
export function slug(section: string): string {
  return section.toLocaleLowerCase('sv-SE').replace('ä', 'a')
}

const DEVICE_DEFINITE: Record<string, string> = {
  telefon: 'telefonen',
  dator: 'datorn',
  surfplatta: 'surfplattan',
}

const TEXT_SECTIONS = new Set(['LÄS', 'ELF'])

/** The plan's parts as clauses, in the plan's order (the repetition first,
 *  as round 1 set it). */
function planClauses(items: PlanItemView[]): string[] {
  const parts: string[] = []
  const rep = items.find((i) => i.kind === 'repetition')
  if (rep) {
    const misses = Number.parseInt(rep.detail ?? '', 10)
    parts.push(Number.isNaN(misses) ? 'repetera dina missar' : `repetera ${inWords(misses)} missar`)
  }
  for (const item of items) {
    if (item.kind === 'lesson') parts.push(`gör en kort ${item.title}`)
    if (item.kind === 'drill') parts.push(`en snabb ${item.title}`)
    if (item.kind === 'mock') parts.push('ett provpass')
  }
  return parts
}

/** The day in one sentence, from the plan — not a repeat of the card. */
function daySentence({ plan, resume }: HomeView): string | null {
  const open = plan.items.filter((i) => !i.completed)
  const parts = [
    ...(resume
      ? [TEXT_SECTIONS.has(resume.section) ? 'läs klart texten' : 'gör klart övningen']
      : []),
    ...planClauses(open),
  ]
  if (parts.length === 0) return plan.allComplete ? 'Idag: dagens plan är klar.' : null
  const last = parts.pop()
  const list = parts.length ? `${parts.join(', ')} och ${last}` : last
  if (resume && resume.minutesLeft == null) {
    return `Idag: ${list} – resten av planen tar ungefär ${plan.minutes} minuter.`
  }
  return `Idag: ${list} – ungefär ${plan.minutes + (resume?.minutesLeft ?? 0)} minuter.`
}

/** "Pausad idag 07:52 på telefonen" from what the view model knows. */
function pausedLine(r: ResumeView): string | null {
  if (r.stale) return 'Påbörjad för mer än en vecka sedan'
  const when = r.pausedAt ? ` ${r.pausedAt.replace('Idag · ', 'idag ')}` : ''
  const where = r.device ? ` på ${DEVICE_DEFINITE[r.device] ?? r.device}` : ''
  return when || where ? `Pausad${when}${where}` : null
}

export function FolioHome({
  width,
  live,
  onResume,
  onGo,
}: {
  width: WidthKey
  live: boolean
  /** Home's primary action: back into the paused text. */
  onResume: () => void
  /** A margin link to another destination. */
  onGo: (d: Destination) => void
}) {
  const { data, actions } = useDirectionData()
  const home = data.home
  const { resume, plan, prognosis } = home
  // Without a paused sitting the lead is the plan's first open part.
  const leadItem = resume ? null : (plan.items.find((i) => !i.completed) ?? null)
  const rows = leadItem ? plan.items.filter((i) => i !== leadItem) : plan.items
  const primary = resume ? onResume : leadItem ? () => actions.openPlanItem(leadItem.id) : null
  useKeyMap(primary ? { Enter: primary } : {}, live)
  const trap = home.traps.find((t) => t.rising) ?? home.traps[0]
  const sentence = daySentence(home)
  const daysLeft = home.exam.daysLeft

  const masthead = (
    <Masthead label={home.today.dateLabel}>
      <p className="fo-count">
        <strong>
          {daysLeft}&nbsp;{daysLeft === 1 ? 'dag' : 'dagar'}
        </strong>{' '}
        kvar till högskoleprovet, {/* The day and month never part. */}
        {home.exam.dateLabel.replace(/(\d+) /, '$1 ')}
      </p>
    </Masthead>
  )

  const main = (
    <>
      <h1 className="fo-greet">
        {home.today.greeting}
        {home.today.firstName ? `, ${home.today.firstName}` : ''}.
      </h1>
      {sentence ? <p className="fo-day">{sentence}</p> : null}

      {resume ? (
        <ResumeLead resume={resume} onResume={onResume} />
      ) : leadItem ? (
        <Lead labelledBy="fo-resume-title">
          <div className="fo-resume-top">
            <span className="fo-label">
              Först idag{leadItem.section ? ` · ${leadItem.section}` : ''}
            </span>
          </div>
          <h2 className="fo-resume-title" id="fo-resume-title">
            {leadItem.title}
          </h2>
          {leadItem.detail ? <p className="fo-resume-sub">{leadItem.detail}</p> : null}
          <div className="fo-resume-foot">
            <button
              type="button"
              className="fo-btn fo-btn--big"
              onClick={() => actions.openPlanItem(leadItem.id)}
            >
              Börja · {leadItem.minutes} min
              <kbd className="fo-kbd" aria-hidden>
                ↵
              </kbd>
            </button>
            <span className="fo-hint">{leadItem.rationale}</span>
          </div>
        </Lead>
      ) : (
        <Lead labelledBy="fo-resume-title">
          <h2 className="fo-lead-title" id="fo-resume-title">
            Dagens plan är klar.
          </h2>
          <p className="fo-empty">Öva gärna lite till – eller vila. Allt du gjort är sparat.</p>
          <div className="fo-resume-foot">
            <button type="button" className="fo-btn" onClick={() => onGo('ova')}>
              Till Öva
            </button>
          </div>
        </Lead>
      )}

      {rows.length ? (
        <section className="fo-section" aria-labelledby="fo-plan-h">
          <div className="fo-section-head">
            <h2 className="fo-h2" id="fo-plan-h">
              Sedan
            </h2>
            <span className="fo-meta">
              {plan.items.length} delar · {plan.minutes} min
            </span>
          </div>
          <ol>
            {rows.map((item, i) => (
              <li key={item.id}>
                <ContentsEntry
                  code={i + 1}
                  title={item.title}
                  gloss={item.detail}
                  page={item.completed ? 'klar' : `${item.minutes} min`}
                  why={item.rationale}
                  onClick={() => actions.openPlanItem(item.id)}
                />
              </li>
            ))}
          </ol>
          <WeekLine week={home.week} />
        </section>
      ) : null}
    </>
  )

  const aside = (
    <>
      <MarginBlock id="fo-prog-h" title="Prognos">
        <PrognosisFigure p={prognosis} />
      </MarginBlock>

      {trap ? (
        <MarginBlock id="fo-trap-h" title="Din vanligaste fälla just nu">
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
          {trap.pattern ? <span className="fo-trap-pattern">{trap.pattern}</span> : null}
          <button type="button" className="fo-link" onClick={() => onGo('framsteg')}>
            Alla fällor i Framsteg
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </MarginBlock>
      ) : null}

      {home.recent.length ? (
        <MarginBlock id="fo-recent-h" title="Senaste passen">
          <dl>
            {home.recent.map((r) => (
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
        </MarginBlock>
      ) : null}
    </>
  )

  return (
    <FolioPage width={width} masthead={masthead} aside={aside} asideLabelledBy="fo-prog-h">
      {main}
    </FolioPage>
  )
}

/** The paused text: the page's largest headline under the heavy rule, the
 *  ribbon where the reader stopped, and the screen's one filled button. */
function ResumeLead({ resume, onResume }: { resume: ResumeView; onResume: () => void }) {
  const paused = pausedLine(resume)
  const text = TEXT_SECTIONS.has(resume.section)
  return (
    <Lead labelledBy="fo-resume-title" ribbon>
      <div className="fo-resume-top">
        <span className="fo-label">Påbörjad · {resume.section}</span>
        {paused ? <span className="fo-resume-when">{paused}</span> : null}
      </div>
      <h2 className="fo-resume-title" id="fo-resume-title">
        {resume.title}
      </h2>
      {resume.subtitle ? <p className="fo-resume-sub">{resume.subtitle}</p> : null}
      <div className="fo-resume-progress">
        <Dots total={resume.total} done={resume.answered} />
        <span>
          Fråga {resume.position} av {resume.total}
          {resume.minutesLeft != null ? ` · ca ${resume.minutesLeft} min kvar` : ''}
        </span>
      </div>
      <div className="fo-resume-foot">
        <button
          type="button"
          className="fo-btn fo-btn--big"
          onClick={onResume}
          data-testid="rd-resume"
        >
          {text ? 'Fortsätt läsa' : 'Fortsätt'}
          <kbd className="fo-kbd" aria-hidden>
            ↵
          </kbd>
        </button>
        <span className="fo-hint">
          {text ? 'Texten' : 'Övningen'} öppnas vid fråga {resume.position}.
        </span>
      </div>
    </Lead>
  )
}

function WeekLine({ week }: { week: HomeView['week'] }) {
  const parts: string[] = []
  if (week.minutesToday != null) parts.push(`${week.minutesToday} minuter idag`)
  if (week.daysPractised != null) {
    const days = inWords(week.daysPractised)
    parts.push(
      week.goal != null
        ? `${days} av ${inWords(week.goal)} dagar den här veckan`
        : `${days} ${week.daysPractised === 1 ? 'dag' : 'dagar'} den här veckan`,
    )
  }
  return parts.length ? <p className="fo-week">{parts.join(' · ')}</p> : null
}

/** The projection in the margin: the figure, its footnoted caveat, the
 *  week's change in words and the scale — each only when it is known. */
function PrognosisFigure({ p }: { p: PrognosisView }) {
  if (p.total == null) {
    return (
      <>
        <p className="fo-delta">Prognosen visas när du har svarat i båda delarna.</p>
        {p.caveat ? <p className="fo-footnote fo-footnote--plain">{p.caveat}</p> : null}
      </>
    )
  }
  return (
    <>
      <div className="fo-prog-figure">
        <span className="fo-prog-n" aria-describedby={p.caveat ? 'fo-caveat' : undefined}>
          {fmtScore(p.total)}
          {p.caveat ? <sup aria-hidden>*</sup> : null}
        </span>
        <span className="fo-prog-of">av 2,0</span>
      </div>
      {p.delta != null ? <p className="fo-delta">{fmtDelta(p.delta)} sedan förra veckan</p> : null}
      <p className="fo-halves">
        Verbal {scoreOrDash(p.verbal)} · Kvant {scoreOrDash(p.quant)}
      </p>
      <Scale total={p.total} low={p.low} high={p.high} />
      {p.caveat ? (
        <p className="fo-footnote" id="fo-caveat">
          <b aria-hidden>*</b>
          <span>{p.caveat}</span>
        </p>
      ) : null}
    </>
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

/** HP's 0–2,0 scale: the mark, and the likely range when there is one. */
function Scale({ total, low, high }: { total: number; low?: number; high?: number }) {
  const pct = (v: number) => `${(v / 2) * 100}%`
  const range = low != null && high != null
  return (
    <div
      className="fo-scale"
      role="img"
      aria-label={
        range
          ? `Trolig nivå ${fmtScore(low)} till ${fmtScore(high)} på skalan 0 till 2,0`
          : `Prognos ${fmtScore(total)} på skalan 0 till 2,0`
      }
    >
      <span className="fo-scale-axis" />
      {range ? (
        <span className="fo-scale-range" style={{ left: pct(low), width: pct(high - low) }} />
      ) : null}
      <span className="fo-scale-mark" style={{ left: pct(total) }} />
      {[0, 0.5, 1, 1.5, 2].map((v) => (
        <span key={v} className="fo-scale-tick" style={{ left: pct(v) }}>
          {v === 0 ? '0' : fmtScore(v)}
        </span>
      ))}
    </div>
  )
}

// ── The page grammar (spec §1.4) ─────────────────────────────────────

/**
 * A hub page: the masthead across the top, the main column, and the
 * marginalia behind a column rule (desktop) or after the text under a
 * rule of their own (phone). The margin is an `aside` named by its first
 * head.
 */
export function FolioPage({
  width,
  masthead,
  aside,
  asideLabelledBy,
  children,
}: {
  width: WidthKey
  masthead: ReactNode
  aside?: ReactNode
  /** The id of the margin's first head. */
  asideLabelledBy?: string
  children: ReactNode
}) {
  return (
    <div className={width === 'phone' ? 'fo-phome' : 'fo-home'}>
      {masthead}
      <div className="fo-page-main">{children}</div>
      {aside ? (
        <aside className="fo-aside" aria-labelledby={asideLabelledBy}>
          {aside}
        </aside>
      ) : null}
    </div>
  )
}

/** The running label (caps, at most one per page) and one piece of meta. */
export function Masthead({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="fo-masthead">
      <span className="fo-label">{label}</span>
      {children}
    </div>
  )
}

/** The lead: a heavy rule opens it; the ribbon only marks where you are. */
export function Lead({
  labelledBy,
  ribbon = false,
  children,
}: {
  labelledBy: string
  ribbon?: boolean
  children: ReactNode
}) {
  return (
    <section className="fo-resume" aria-labelledby={labelledBy}>
      {ribbon ? <span className="fo-ribbon" aria-hidden /> : null}
      {children}
    </section>
  )
}

/**
 * One entry of a contents list: a number or a section code in the margin,
 * the title with its gloss, leader dots to the "page number" (minutes, a
 * count or a score), a line of why and an optional italic note. One button;
 * `label` gives it a spoken sentence when the visible parts would read as
 * fragments. Without `onClick` it is a plain row (nothing to open yet).
 */
export function ContentsEntry({
  code,
  title,
  gloss,
  page,
  lining = false,
  why,
  note,
  label,
  testId,
  onClick,
}: {
  /** A number (set as a page's ordinal) or a section code. */
  code: number | string
  title: ReactNode
  gloss?: ReactNode
  page?: ReactNode
  /** The page number is a score or a compared count: lining figures. */
  lining?: boolean
  why?: ReactNode
  note?: ReactNode
  label?: string
  testId?: string
  onClick?: () => void
}) {
  const body = (
    <>
      <span className={typeof code === 'string' ? 'fo-entry-code' : 'fo-plan-n'} aria-hidden>
        {code}
      </span>
      <span className="fo-plan-body">
        <span className="fo-plan-line">
          <span className="fo-plan-title">
            {title}
            {gloss ? <span>{gloss}</span> : null}
          </span>
          <span className="fo-leader" aria-hidden />
          <span className="fo-plan-min" data-lining={lining ? 'true' : undefined}>
            {page}
            {onClick ? <ArrowRight size={15} strokeWidth={1.5} aria-hidden /> : null}
          </span>
        </span>
        {why ? <span className="fo-plan-why">{why}</span> : null}
        {note ? <span className="fo-entry-note">{note}</span> : null}
      </span>
    </>
  )
  if (!onClick) {
    return (
      <div className="fo-plan-row" data-static="true" data-testid={testId}>
        {body}
      </div>
    )
  }
  return (
    <button
      type="button"
      className="fo-plan-row"
      data-testid={testId}
      aria-label={label}
      onClick={onClick}
    >
      {body}
    </button>
  )
}

/** A part of a contents list ("Verbal del"): Literata italic, no caps. */
export function PartHead({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 className="fo-part" id={id}>
      {children}
    </h3>
  )
}

/** A block of marginalia under its italic head. */
export function MarginBlock({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="fo-aside-block" aria-labelledby={id}>
      <h2 className="fo-h3" id={id}>
        {title}
      </h2>
      {children}
    </section>
  )
}
