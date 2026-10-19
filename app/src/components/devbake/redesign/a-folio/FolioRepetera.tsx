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

import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { RepeteraItemView } from '@/components/devbake/redesign/viewModel'
import { entryName, GapText, questionStem } from './FolioDrill'
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

export function FolioRepetera({ width, live }: { width: WidthKey; live: boolean }) {
  const { data, actions } = useDirectionData()
  const { repetera, ova } = data
  const due = repetera.items.filter((i) => i.dueNow)
  const later = repetera.items.filter((i) => !i.dueNow)
  const ready = repetera.dueNow
  const round = Math.min(ready, repetera.sessionSize)
  const minutes = data.home.plan.items.find((i) => i.kind === 'repetition')?.minutes
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
      <h1 className="fo-greet">Dina missar</h1>
      <p className="fo-day">De äldsta först, högst {inWords(repetera.sessionSize)} åt gången.</p>

      {empty ? (
        <Lead labelledBy="fo-rep-lead">
          <p className="fo-empty fo-empty--lead" id="fo-rep-lead">
            {emptyLine}
          </p>
          <div className="fo-resume-foot">
            <button type="button" className="fo-btn fo-btn--big" onClick={startDrill}>
              {weakest ? `Börja en övning i ${weakest}` : 'Börja en övning'}
              <kbd className="fo-kbd" aria-hidden>
                ↵
              </kbd>
            </button>
          </div>
        </Lead>
      ) : (
        <Lead labelledBy="fo-rep-lead">
          <div className="fo-resume-top">
            <span className="fo-label">Den här omgången</span>
          </div>
          <h2 className="fo-lead-title" id="fo-rep-lead">
            {ready > round
              ? `${round} av ${ready} missar`
              : `${capitalised(inWords(round))} ${round === 1 ? 'miss' : 'missar'}`}
          </h2>
          {minutes != null ? <p className="fo-lead-sub">ungefär {minutes} minuter</p> : null}
          <div className="fo-resume-foot">
            <button
              type="button"
              className="fo-btn fo-btn--big"
              onClick={startRound}
              data-testid="rd-repetera-start"
            >
              Börja repetera
              <kbd className="fo-kbd" aria-hidden>
                ↵
              </kbd>
            </button>
            <span className="fo-hint">Avsluta när du vill – svaren sparas efter varje fråga.</span>
          </div>
        </Lead>
      )}

      {queue.length ? (
        <section className="fo-section" aria-labelledby="fo-rep-queue">
          <div className="fo-section-head">
            <h2 className="fo-h2" id="fo-rep-queue">
              Kön per delprov
            </h2>
            <span className="fo-meta">redo nu</span>
          </div>
          <ul aria-labelledby="fo-rep-queue">
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
        <section className="fo-section" aria-labelledby="fo-rep-misses">
          <div className="fo-section-head">
            <h2 className="fo-h2" id="fo-rep-misses">
              Missarna
            </h2>
            <span className="fo-meta">{repetera.pile} i dagens hög</span>
          </div>
          {due.length ? (
            <div className="fo-part-block">
              <PartHead id="fo-rep-now">Redo nu</PartHead>
              <ol aria-labelledby="fo-rep-now">
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
      <MarginBlock id="fo-rep-rule-h" title="Så flyttas de fram">
        <p className="fo-margin-note">
          Rätt svar: frågan kommer tillbaka om 1, 2, 4, 8, 16 och 30 dagar – sedan är den klar.
        </p>
        <p className="fo-margin-note">Fel svar: den kommer tillbaka om tio minuter.</p>
      </MarginBlock>
      <MarginBlock id="fo-rep-guess-h" title="Gissa hellre">
        <p className="fo-margin-note">
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
      asideLabelledBy="fo-rep-rule-h"
    >
      {main}
    </FolioPage>
  )
}

/** The rest of today's pile: folded behind one quiet disclosure while
 *  there is a round to start, so the page leads with what is ready. */
function LaterPart({ items, folded }: { items: RepeteraItemView[]; folded: boolean }) {
  const [open, setOpen] = useState(!folded)
  return (
    <div className="fo-part-block">
      <PartHead id="fo-rep-later">Senare idag</PartHead>
      {folded ? (
        <button
          type="button"
          className="fo-more"
          aria-expanded={open}
          aria-controls="fo-rep-later-list"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Dölj dem som blir redo senare' : `Visa de ${items.length} som blir redo senare`}
          <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      {open ? (
        <ol aria-labelledby="fo-rep-later" id="fo-rep-later-list">
          {items.map((item) => (
            <MissRow key={item.mistakeId} item={item} />
          ))}
        </ol>
      ) : null}
    </div>
  )
}

/** One miss: its section in the margin, the question's stem, the trap
 *  behind it, and — for a later one — when it is ready. Not a button: the
 *  round is the one way in. */
function MissRow({ item }: { item: RepeteraItemView }) {
  const { data } = useDirectionData()
  const stem = questionStem(item)
  const trap = item.frameworkName ?? entryName(item.frameworkId ?? undefined, data.frameworks)
  return (
    <li className="fo-miss" data-testid={`rd-repetera-item-${item.n}`}>
      <span className="fo-entry-code">{item.section}</span>
      <div className="fo-miss-body">
        {stem ? (
          <p className="fo-miss-stem" data-word={item.section === 'ORD' ? 'true' : undefined}>
            <GapText text={stem} />
          </p>
        ) : null}
        {trap ? <p className="fo-miss-trap">Fälla: {trap}</p> : null}
      </div>
      {item.dueNow ? null : <span className="fo-miss-when">{item.dueLabel}</span>}
    </li>
  )
}
