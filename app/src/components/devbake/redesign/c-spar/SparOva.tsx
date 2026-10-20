// Spår · Öva — the practice hub, with one obvious next step. The ripe
// misses are its dominant card: Idag's station shape on a near-neutral
// REP band (repetition is no section, never green), the next misses as a
// path of stops ringed in their sections' hues ending in a goal, and the
// screen's one green pill. Below, the eight sections in their two halves
// (Verbal del, Kvantitativ del), each a tile with its section stop that
// starts a round on one press, rounding out on the spring. A mixed round is
// a quiet full-width row, never a ninth tile; a recurring trap gets a quiet
// note beside the station. When nothing is ripe the green pill moves to the
// suggested section, and for a new reader to a mixed round.

import { ArrowRight, ChevronRight, RotateCcw, Shuffle } from 'lucide-react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { OvaSectionView } from '@/components/devbake/redesign/viewModel'
import {
  cap,
  count,
  inWords,
  Kbd,
  MIXED_MINUTES,
  minutesFor,
  ScopePicker,
  SparPageHead,
  SparStop,
  sectionMinutes,
  sectionName,
  sectionSlug,
} from './sparParts'

/** The ripe misses drawn on the station's path (phone: fewer, then +n). */
const PATH_MAX = { desktop: 10, phone: 7 } as const

export function SparOva({ width, live }: { width: WidthKey; live: boolean }) {
  const { data, actions } = useDirectionData()
  const { ova, repetera, home } = data
  const phone = width === 'phone'
  const { dueNow, pile } = ova.repetera
  const ripe = dueNow > 0
  const fresh = pile === 0 && ova.sections.every((s) => s.attempts90d === 0)
  const round = Math.min(dueNow, repetera.sessionSize)
  const next = repetera.items.filter((i) => i.dueNow).slice(0, round)
  // The same round as Idag's plan step takes the same time.
  const repMinutes =
    home.plan.items.find((i) => i.kind === 'repetition')?.minutes ??
    minutesFor(next.map((i) => i.section))
  // The one green action: ripe misses first, then the suggested section,
  // then (a new reader) a mixed round that tastes all eight.
  const primary = ripe ? 'repetera' : ova.weakest ? 'section' : 'mixed'
  const start = {
    repetera: () => actions.startDrill({ kind: 'repetition' }),
    section: () => {
      if (ova.weakest) actions.startDrill({ kind: 'section', section: ova.weakest })
    },
    mixed: () => actions.startDrill({ kind: 'mixed' }),
  }
  useKeyMap({ Enter: start[primary] }, live)
  const trap = ova.weakTraps.find((t) => t.count >= 3) ?? null
  const halves = [
    {
      title: 'Verbal del',
      id: 'sp-ova-verbal',
      list: ova.sections.filter((s) => s.half === 'verbal'),
    },
    {
      title: 'Kvantitativ del',
      id: 'sp-ova-kvant',
      list: ova.sections.filter((s) => s.half === 'kvant'),
    },
  ]
  const mixed = (
    <MixedRow primary={primary === 'mixed'} questions={ova.mixed.questions} onStart={start.mixed} />
  )
  const trapNote = trap ? (
    <aside className="sp-ova-aside" aria-labelledby="sp-trapnote-h">
      <h2 className="sp-h3" id="sp-trapnote-h">
        Återkommande fälla
      </h2>
      <div className="sp-trapnote" data-sec={trap.section}>
        <span className="sp-sec-chip sp-sec-chip--sm">{trap.section}</span>
        <p className="sp-trapnote-name">{trap.name}</p>
        <p className="sp-trapnote-text">
          {cap(inWords(trap.count))} av dina missar hör till samma fälla
          {trap.pattern ? `: ${trap.pattern.replace(/\.$/, '').toLocaleLowerCase('sv-SE')}.` : '.'}
        </p>
        <button
          type="button"
          className="sp-link"
          onClick={() =>
            actions.startDrill({
              kind: 'framework',
              frameworkId: trap.frameworkId,
              section: trap.section,
            })
          }
        >
          Riktad repetition · 5 min
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </aside>
  ) : null

  return (
    <div className="sp-page" data-phone={String(phone)}>
      <SparPageHead
        phone={phone}
        eyebrow="Öva"
        title="Alla delprov"
        lede={
          ripe
            ? phone
              ? 'Repetera först, eller välj ett delprov.'
              : 'Repetera dina missar först, eller välj ett delprov. Ett varv är tio frågor.'
            : 'Välj ett delprov. Ett varv är tio frågor.'
        }
      />
      <div className="sp-ova-top">
        <article className="sp-now sp-station" data-sec="REP" aria-labelledby="sp-station-h">
          <div className="sp-now-band">
            <span className="sp-station-glyph" aria-hidden>
              <RotateCcw size={18} strokeWidth={2.5} />
            </span>
            <span className="sp-now-band-text">Repetera</span>
            {pile > 0 ? (
              <span className="sp-now-state">
                <span className="sp-num">{pile}</span>&nbsp;i dagens hög
              </span>
            ) : null}
          </div>
          <div className="sp-now-body">
            <h2 className="sp-station-h" id="sp-station-h">
              <button
                type="button"
                className="sp-station-open"
                data-testid="rd-ova-repetera"
                onClick={actions.openRepetera}
              >
                <span>
                  {ripe
                    ? `${count(dueNow, 'miss', 'missar')} är redo nu`
                    : fresh
                      ? 'Här samlas dina missar'
                      : pile > 0
                        ? 'Inget är redo just nu'
                        : 'Inget väntar i kön idag'}
                </span>
                <ChevronRight size={26} strokeWidth={2.5} aria-hidden />
                <span className="sp-sr">, visa kön</span>
              </button>
            </h2>
            <p className="sp-station-sub">
              {ripe
                ? 'de äldsta först'
                : fresh
                  ? 'Svara fel på en fråga så hamnar den här, och kommer tillbaka när det är dags.'
                  : pile > 0
                    ? `${count(pile, 'miss', 'missar')} ligger i dagens hög och blir redo snart.`
                    : 'Det du missar hamnar här och kommer tillbaka när det är dags.'}
            </p>
            {ripe ? (
              <StationPath sections={next.map((i) => i.section)} max={PATH_MAX[width]} />
            ) : !fresh && pile === 0 ? (
              <div className="sp-trail" aria-hidden>
                <SparStop state="goal" size={phone ? 30 : 36} />
              </div>
            ) : null}
            {ripe ? (
              <div className="sp-now-foot sp-station-foot">
                <button
                  type="button"
                  className="sp-btn sp-btn--primary sp-btn--lg"
                  onClick={start.repetera}
                >
                  {dueNow > round ? `Repetera ${round} av ${dueNow}` : `Repetera ${round}`} · ca{' '}
                  {repMinutes} min
                  <Kbd>↵</Kbd>
                </button>
                <ScopePicker
                  phone={phone}
                  counts={ova.sections
                    .filter((s) => s.dueNow > 0)
                    .map((s) => ({ section: s.section, n: s.dueNow }))}
                  onPick={(section) =>
                    actions.startDrill(
                      section ? { kind: 'repetition', section } : { kind: 'repetition' },
                    )
                  }
                />
              </div>
            ) : null}
          </div>
        </article>
        {phone ? null : trapNote}
      </div>

      <div className="sp-ova-groups">
        {halves.map((h) => (
          <section key={h.id} className="sp-ova-group" aria-labelledby={h.id}>
            <h2 className="sp-h3" id={h.id}>
              {h.title}
            </h2>
            <ul className="sp-ova-tiles">
              {h.list.map((s) => (
                <SectionTile
                  key={s.section}
                  s={s}
                  questions={ova.mixed.questions}
                  phone={phone}
                  suggested={ova.weakest === s.section}
                  primary={primary === 'section' && ova.weakest === s.section}
                  onStart={() => actions.startDrill({ kind: 'section', section: s.section })}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {mixed}
      {phone ? trapNote : null}
    </div>
  )
}

/** The next ripe misses in the order they play, each stop ringed in its
 *  section's hue, ending in the goal. A picture: the sentence above says
 *  it, and its name lists the sections. */
function StationPath({ sections, max }: { sections: string[]; max: number }) {
  const shown = sections.length > max ? sections.slice(0, max - 1) : sections
  const more = sections.length - shown.length
  return (
    <div
      className="sp-trail sp-station-path"
      role="img"
      aria-label={`Nästa missar: ${sections.join(', ')}`}
    >
      {shown.map((s, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the queue's fixed order
        <SparStop key={i} state="section" size={36} sec={s} label={s} />
      ))}
      {more > 0 ? <SparStop state="todo" size={36} label={`+${more}`} /> : null}
      <SparStop state="goal" size={36} />
    </div>
  )
}

/** A section: its stop (the code in a ring of its hue), its official name,
 *  the round's size and rough length, and the misses it has waiting. The
 *  whole tile starts the round at once; the suggestion is marked, and
 *  carries the green pill when nothing is ripe. */
function SectionTile({
  s,
  questions,
  phone,
  suggested,
  primary,
  onStart,
}: {
  s: OvaSectionView
  questions: number
  phone: boolean
  suggested: boolean
  primary: boolean
  onStart: () => void
}) {
  const minutes = sectionMinutes(s.section)
  // A DTK round takes whole pages: 10–13 questions.
  const size = s.section === 'DTK' ? `${questions}–${questions + 3}` : String(questions)
  const name = sectionName(s.section)
  const label = [
    name,
    `${size} frågor`,
    `cirka ${minutes} minuter`,
    s.waiting > 0 ? `${s.waiting} väntar` : null,
    suggested ? 'föreslås' : null,
  ]
    .filter(Boolean)
    .join(', ')
  return (
    <li>
      <button
        type="button"
        className="sp-sectile"
        data-sec={s.section}
        data-primary={String(primary)}
        data-testid={`rd-ova-section-${sectionSlug(s.section)}`}
        aria-label={label}
        onClick={onStart}
      >
        <SparStop state="section" size={phone ? 36 : 44} sec={s.section} label={s.section} />
        <span className="sp-sectile-text">
          <span className="sp-sectile-name">{name}</span>
          {phone ? null : (
            <span className="sp-sectile-facts">
              {size} frågor · ca {minutes} min
            </span>
          )}
          {s.waiting > 0 ? (
            <span className="sp-sectile-wait">
              <span className="sp-num">{s.waiting}</span> väntar
            </span>
          ) : null}
          {suggested && !primary ? <span className="sp-next-chip">Föreslås</span> : null}
          {primary ? (
            <span className="sp-btn sp-btn--primary sp-sectile-go" aria-hidden>
              Öva {s.section} · ca {minutes} min
              <Kbd>↵</Kbd>
            </span>
          ) : null}
        </span>
        {phone ? (
          <span className="sp-sectile-side" aria-hidden>
            <span className="sp-num">{minutes} min</span>
            <ChevronRight size={18} strokeWidth={2} />
          </span>
        ) : null}
      </button>
    </li>
  )
}

/** A mixed round: a quiet full-width row with the trail glyph — or, for a
 *  reader with nothing else to go on, the screen's green pill. */
function MixedRow({
  primary,
  questions,
  onStart,
}: {
  primary: boolean
  questions: number
  onStart: () => void
}) {
  if (primary) {
    return (
      <div className="sp-ova-mixed-go">
        <button
          type="button"
          className="sp-btn sp-btn--primary sp-btn--lg"
          data-testid="rd-ova-mixed"
          onClick={onStart}
        >
          Blandad övning · ca {MIXED_MINUTES} min
          <Kbd>↵</Kbd>
        </button>
        <p className="sp-ova-mixed-why">
          {questions} frågor från alla åtta delprov — ett första smakprov som visar var du står.
        </p>
      </div>
    )
  }
  return (
    <button type="button" className="sp-ova-mixed" data-testid="rd-ova-mixed" onClick={onStart}>
      <span className="sp-ova-mixed-glyph" aria-hidden>
        <Shuffle size={20} strokeWidth={2.25} />
      </span>
      <span className="sp-ova-mixed-text">
        <b>Blandad övning</b>
        <span>
          {questions} frågor från alla åtta delprov · ca {MIXED_MINUTES} min
        </span>
      </span>
      <ArrowRight className="sp-ova-mixed-go-icon" size={20} strokeWidth={2.25} aria-hidden />
    </button>
  )
}
