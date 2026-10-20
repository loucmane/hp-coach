// Folio · Repetera — today's misses, set inside Öva (the contents keep Öva
// current). The masthead names the place, the standfirst states the rule,
// and the lead under the heavy rule is the round: how many, how long, and
// the screen's one filled button (↵), which starts it. "Kön per delprov" is
// a contents list whose page numbers are what is ready now, each a round of
// that section only; "Missarna" lists the misses themselves, the ready ones
// first, the rest of today's pile folded behind a quiet disclosure. The
// scheduling rule and the no-penalty note are marginalia.
//
// A miss is said as time — "blir redo senare idag", never "fel" in a list.
//
// Folio+ round 2 (Ljuskägla's calm, fpCalm.css): the round is a finite batch,
// stated before entry as a count and minutes, and said to end; what does
// not fit waits for the next round, never as debt. No overdue or red
// counters. The queue, the misses and the margin sit in the shade.
//
// Round 3 (learning lens #4): a row shows the section and the question only.
// Printing the trap before the retry turned recall into recognition; the
// trap is named in the facit, after the answer.

import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionData,
  PlanItemView,
  RepeteraItemView,
} from '@/components/devbake/redesign/viewModel'
import { GapText, questionStem } from './FolioDrill'
import {
  ContentsEntry,
  capitalised,
  FolioPage,
  inWords,
  Lead,
  MarginBlock,
  Masthead,
  PartHead,
} from './FolioHome'
import './fpCalm.css'

/** A round's time in minutes: the plan's estimate for today's repetition,
 *  scaled when the round is not the one the plan counted; without one,
 *  about a minute a question. Always a number, so the round can be stated
 *  before it starts. */
export function roundMinutes(round: number, items: readonly PlanItemView[]): number {
  const plan = items.find((i) => i.kind === 'repetition')
  if (!plan) return Math.max(1, round)
  const planned = Number.parseInt(plan.detail ?? '', 10)
  if (Number.isNaN(planned) || planned <= 0 || planned === round) return plan.minutes
  return Math.max(1, Math.round((plan.minutes * round) / planned))
}

/** What waits in Repetera, said as what is ready now and how long it takes
 *  ("8 redo · 9 min"), never as the whole pile; null when nothing is ready.
 *  Idag's misses line and the nav's Öva subtitle say the same thing. */
export function readyLine({
  repetera,
  home,
}: Pick<DirectionData, 'repetera' | 'home'>): string | null {
  const ready = repetera.dueNow
  if (ready <= 0) return null
  return `${ready} redo · ${roundMinutes(ready, home.plan.items)} min`
}

export function FolioRepetera({ width, live }: { width: WidthKey; live: boolean }) {
  const { data, actions } = useDirectionData()
  const { repetera, ova } = data
  const due = repetera.items.filter((i) => i.dueNow)
  const later = repetera.items.filter((i) => !i.dueNow)
  const ready = repetera.dueNow
  const round = Math.min(ready, repetera.sessionSize)
  const minutes = roundMinutes(round, data.home.plan.items)
  // The batch ends; what does not fit waits for the next round.
  const rest = ready - round
  const finite = `Sedan är omgången klar.${
    rest > 0 ? ` ${capitalised(inWords(rest))} till väntar på nästa omgång.` : ''
  }`
  const weakest = ova.weakest
  const relearned = repetera.pile === 0 && data.framsteg.totals.mistakesResolved > 0

  const startRound = () => actions.startDrill({ kind: 'repetition' })
  // Nothing ready: the way on is a drill of the suggested section.
  const startDrill = () =>
    actions.startDrill(weakest ? { kind: 'section', section: weakest } : { kind: 'mixed' })
  useKeyMap({ Enter: ready > 0 ? startRound : startDrill }, live)

  // Per section, in the test's order: ready now (the page number) and how
  // many more ripen today.
  const queue = ova.sections
    .map((s) => ({
      section: s.section,
      name: s.name,
      ready: due.filter((i) => i.section === s.section).length,
      later: later.filter((i) => i.section === s.section).length,
    }))
    .filter((s) => s.ready + s.later > 0)

  const empty = !ready
  const emptyLine =
    later.length > 0
      ? `Inget är redo just nu – ${inWords(later.length)} ${later.length === 1 ? 'miss ligger' : 'missar ligger'} i dagens hög och blir redo senare idag.`
      : relearned
        ? 'Kön är tom just nu – allt du missat är återlärt.'
        : 'Inga missar än – när du svarar fel i en övning landar frågan här.'

  const main = (
    <>
      <h1 className="fp-greet">Dina missar</h1>
      <p className="fp-day">De äldsta först, högst {inWords(repetera.sessionSize)} åt gången.</p>

      {empty ? (
        <Lead labelledBy="fp-rep-lead">
          <p className="fp-empty fp-empty--lead" id="fp-rep-lead">
            {emptyLine}
          </p>
          <div className="fp-resume-foot">
            <button type="button" className="fp-btn fp-btn--big" onClick={startDrill}>
              {weakest ? `Börja en övning i ${weakest}` : 'Börja en övning'}
              <kbd className="fp-kbd" aria-hidden>
                ↵
              </kbd>
            </button>
          </div>
        </Lead>
      ) : (
        <Lead labelledBy="fp-rep-lead">
          <div className="fp-resume-top">
            <span className="fp-label">Den här omgången</span>
          </div>
          <h2 className="fp-lead-title" id="fp-rep-lead">
            {ready > round
              ? `${round} av ${ready} missar`
              : `${capitalised(inWords(round))} ${round === 1 ? 'miss' : 'missar'}`}
          </h2>
          <p className="fp-lead-sub">
            ungefär {minutes} {minutes === 1 ? 'minut' : 'minuter'}
          </p>
          <p className="fp-lead-sub">{finite}</p>
          <div className="fp-resume-foot">
            <button
              type="button"
              className="fp-btn fp-btn--big"
              onClick={startRound}
              data-testid="rd-repetera-start"
            >
              Börja repetera
              <kbd className="fp-kbd" aria-hidden>
                ↵
              </kbd>
            </button>
            <span className="fp-hint">Avsluta när du vill – svaren sparas efter varje fråga.</span>
          </div>
        </Lead>
      )}

      {queue.length ? (
        <section className="fp-section" aria-labelledby="fp-rep-queue" data-fp-shade>
          <div className="fp-section-head">
            <h2 className="fp-h2" id="fp-rep-queue">
              Kön per delprov
            </h2>
            <span className="fp-meta">redo nu</span>
          </div>
          <ul aria-labelledby="fp-rep-queue">
            {queue.map((s) => {
              const note =
                s.later > 0
                  ? `${s.ready ? `${inWords(s.later)} till` : capitalised(inWords(s.later))} blir redo senare idag`
                  : undefined
              return (
                <li key={s.section}>
                  <ContentsEntry
                    code={s.section}
                    title={s.name}
                    page={s.ready || '—'}
                    lining
                    note={note}
                    label={
                      s.ready
                        ? `Repetera bara ${s.section}, ${s.name}, ${s.ready} redo nu`
                        : undefined
                    }
                    onClick={
                      s.ready
                        ? () => actions.startDrill({ kind: 'repetition', section: s.section })
                        : undefined
                    }
                  />
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {repetera.items.length ? (
        <section className="fp-section" aria-labelledby="fp-rep-misses" data-fp-shade>
          <div className="fp-section-head">
            <h2 className="fp-h2" id="fp-rep-misses">
              Missarna
            </h2>
            <span className="fp-meta">{repetera.pile} i dagens hög</span>
          </div>
          {due.length ? (
            <div className="fp-part-block">
              <PartHead id="fp-rep-now">Redo nu</PartHead>
              <ol aria-labelledby="fp-rep-now">
                {due.map((item) => (
                  <MissRow key={item.mistakeId} item={item} />
                ))}
              </ol>
            </div>
          ) : null}
          {later.length ? <LaterPart items={later} folded={due.length > 0} /> : null}
        </section>
      ) : null}
    </>
  )

  const aside = (
    <>
      <MarginBlock id="fp-rep-rule-h" title="Så flyttas de fram">
        <p className="fp-margin-note">
          Rätt svar: frågan kommer tillbaka om 1, 2, 4, 8, 16 och 30 dagar – sedan är den klar.
        </p>
        <p className="fp-margin-note">Fel svar: den kommer tillbaka om tio minuter.</p>
      </MarginBlock>
      <MarginBlock id="fp-rep-guess-h" title="Gissa hellre">
        <p className="fp-margin-note">
          Fel svar ger inga poängavdrag på provet – lämna ingen fråga obesvarad.
        </p>
      </MarginBlock>
    </>
  )

  return (
    <FolioPage
      width={width}
      masthead={<Masthead label="Öva · Repetera" />}
      aside={aside}
      asideLabelledBy="fp-rep-rule-h"
      shadeAside
    >
      {main}
    </FolioPage>
  )
}

/** The rest of today's pile: folded behind one quiet disclosure while
 *  there is a round to start, so the page leads with what is ready. With
 *  nothing ready it is the list itself, even if it was folded before. */
function LaterPart({ items, folded }: { items: RepeteraItemView[]; folded: boolean }) {
  const [open, setOpen] = useState(false)
  const shown = !folded || open
  return (
    <div className="fp-part-block">
      <PartHead id="fp-rep-later">Senare idag</PartHead>
      {folded ? (
        <button
          type="button"
          className="fp-more"
          aria-expanded={open}
          aria-controls="fp-rep-later-list"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Dölj dem som blir redo senare' : `Visa de ${items.length} som blir redo senare`}
          <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      {shown ? (
        <ol aria-labelledby="fp-rep-later" id="fp-rep-later-list">
          {items.map((item) => (
            <MissRow key={item.mistakeId} item={item} />
          ))}
        </ol>
      ) : null}
    </div>
  )
}

/** One miss: its section in the margin, the question's stem and — for a
 *  later one — when it is ready. Never the trap: that would answer the
 *  retry before it is tried (the facit names it). Not a button: the round
 *  is the one way in. */
function MissRow({ item }: { item: RepeteraItemView }) {
  const stem = questionStem(item)
  return (
    <li className="fp-miss" data-testid={`rd-repetera-item-${item.n}`}>
      <span className="fp-entry-code">{item.section}</span>
      <div className="fp-miss-body">
        {stem ? (
          <p className="fp-miss-stem" data-word={item.section === 'ORD' ? 'true' : undefined}>
            <GapText text={stem} />
          </p>
        ) : null}
      </div>
      {item.dueNow ? null : <span className="fp-miss-when">{item.dueLabel}</span>}
    </li>
  )
}
