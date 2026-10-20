// Samtal · Repetera — a bounded return to the questions you missed.
//
// The coach opens with the count that matters, what is ready now, and
// proposes one round of it: "8 frågor är redo nu. Tar vi dem?" When more is
// ready than a round holds: "Vi tar 10 i taget, de äldsta först." Attached
// to the turn, like a document in a message: what is ready, section by
// section, and how much of today's pile comes later.
// Two replies:
//   - "Välj sektion": it becomes your turn, and the coach answers with the
//     sections that have something ready;
//   - the one action, "Repetera 8".
// Below a quiet line, the queue as one card: the ready ones first, each
// with its section, its question and the trap or question type behind it
// (its framework). The rest of today's pile
// folds under its count, so the screen leads with one finite round.
// With nothing ready, or an empty pile, the coach says so and the one way
// on is back to Öva — no dead start button.

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { RepeteraItemView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { SECTION_KEYS } from '@/data/questions'
import { Coach, count, Divider, Kbd, Replies, You } from './SamtalParts'

export function SamtalRepetera({ width, live }: { width: WidthKey; live: boolean }) {
  const { data, actions } = useDirectionData()
  const r = data.repetera
  const ready = r.items.filter((i) => i.dueNow)
  const later = r.items.filter((i) => !i.dueNow)
  const round = Math.min(r.dueNow, r.sessionSize)
  // What is ready, by section, in the exam's order.
  const bySection = SECTION_KEYS.map((section) => ({
    section,
    n: ready.filter((i) => i.section === section).length,
  })).filter((x) => x.n > 0)
  const [asked, setAsked] = useState(false)
  const [showLater, setShowLater] = useState(false)

  const start = () => actions.startDrill({ kind: 'repetition' })
  const toOva = () => actions.go('ova')
  useKeyMap({ Enter: r.dueNow > 0 ? start : toOva }, live)

  return (
    <div className="sa-rep" data-width={width}>
      <Divider>{data.home.today.dateLabel}</Divider>

      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby="sa-rep-q">
          <p className="sa-hello">
            <b>Repetera</b>
            {r.pile > 0 ? ` · ${r.pile} i dagens hög` : null}
          </p>
          <h1 className="sa-lead-q" id="sa-rep-q" tabIndex={-1}>
            {r.dueNow === 0
              ? r.pile > 0
                ? 'Inget är redo just nu.'
                : 'Inga missar att repetera.'
              : r.dueNow > r.sessionSize
                ? `${r.dueNow} frågor är redo nu. Vi tar ${r.sessionSize} i taget.`
                : r.dueNow === 1
                  ? 'En fråga är redo nu. Tar vi den?'
                  : `${r.dueNow} frågor är redo nu. Tar vi dem?`}
          </h1>
          {r.dueNow > 0 ? (
            <div className="sa-attach sa-attach--rep">
              <ul className="sa-rep-sections" aria-label="Redo nu, per delprov">
                {bySection.map((x) => (
                  <li key={x.section}>
                    <b>{x.section}</b> {x.n}
                  </li>
                ))}
              </ul>
              <p className="sa-rep-attach-note">
                {r.dueNow > r.sessionSize ? 'De äldsta först. ' : null}
                {later.length
                  ? `${count(later.length, 'fråga', 'frågor')} till blir redo senare idag.`
                  : 'Inget mer väntar idag.'}
              </p>
            </div>
          ) : (
            <p className="sa-say sa-say--quiet">
              {r.pile > 0
                ? 'Missarna i högen blir redo senare idag, var och en när det är dags.'
                : 'Missar du en fråga lägger jag den här, så tar vi den igen när det är dags.'}
            </p>
          )}
        </Coach>

        {asked ? (
          <>
            <You>
              <p>Välj sektion</p>
            </You>
            <Coach>
              <p className="sa-say">Vilken av dem?</p>
              <Replies className="sa-replies--ask">
                {bySection.map((x) => (
                  <button
                    key={x.section}
                    type="button"
                    className="sa-chip"
                    onClick={() => actions.startDrill({ kind: 'repetition', section: x.section })}
                  >
                    Bara {x.section} · {x.n}
                  </button>
                ))}
              </Replies>
            </Coach>
          </>
        ) : null}

        <Replies>
          {r.dueNow > 0 && !asked && bySection.length > 1 ? (
            <button type="button" className="sa-chip sa-chip--big" onClick={() => setAsked(true)}>
              Välj sektion
            </button>
          ) : null}
          {r.dueNow > 0 ? (
            <button
              type="button"
              className="sa-chip sa-chip--primary sa-chip--big"
              data-testid="rd-repetera-start"
              onClick={start}
            >
              Repetera {round}
              <Kbd>↵</Kbd>
            </button>
          ) : (
            <button type="button" className="sa-chip sa-chip--primary sa-chip--big" onClick={toOva}>
              Till Öva
              <Kbd>↵</Kbd>
            </button>
          )}
        </Replies>
      </div>

      {r.items.length ? (
        <div className="sa-later">
          <Divider quiet>Kön</Divider>
          <section className="sa-card sa-card--queue" aria-labelledby="sa-rep-queue-h">
            <header className="sa-card-head">
              <h2 id="sa-rep-queue-h">Redo nu</h2>
              <span>{count(ready.length, 'fråga', 'frågor')}</span>
            </header>
            {ready.length ? (
              <ol className="sa-queue">
                {ready.map((item) => (
                  <QueueRow key={item.mistakeId} item={item} />
                ))}
              </ol>
            ) : (
              <p className="sa-queue-none">Inget är redo just nu.</p>
            )}
            {later.length ? (
              <div className="sa-queue-later">
                <button
                  type="button"
                  className="sa-queue-fold"
                  aria-expanded={showLater}
                  aria-controls="sa-rep-later"
                  onClick={() => setShowLater((v) => !v)}
                >
                  <span>Senare idag</span>
                  <span className="sa-queue-fold-n">{later.length}</span>
                  {showLater ? (
                    <ChevronUp size={16} strokeWidth={1.75} aria-hidden />
                  ) : (
                    <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
                  )}
                </button>
                {showLater ? (
                  <ol className="sa-queue" id="sa-rep-later">
                    {later.map((item) => (
                      <QueueRow key={item.mistakeId} item={item} />
                    ))}
                  </ol>
                ) : null}
              </div>
            ) : null}
          </section>
          {r.dueNow > 0 ? (
            <button type="button" className="sa-link sa-rep-back" onClick={toOva}>
              Tillbaka till Öva
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** One miss in the queue: its section, its question (math rendered), the
 *  framework behind it, and when it is ready. */
function QueueRow({ item }: { item: RepeteraItemView }) {
  return (
    <li className="sa-qrow" data-testid={`rd-repetera-item-${item.n}`}>
      <span className="sa-qrow-sec">{item.section}</span>
      <span className="sa-qrow-body">
        <span className="sa-qrow-q">
          {item.prompt == null ? (
            <span className="sa-qrow-none">Frågan visas när du repeterar</span>
          ) : item.prompt === '' ? (
            <span className="sa-qrow-none">En lucka i texten</span>
          ) : (
            <MathText>{item.prompt}</MathText>
          )}
        </span>
        {item.frameworkName || item.errors > 1 ? (
          <span className="sa-qrow-meta">
            {item.frameworkName ? <span>Ramverk: {item.frameworkName}</span> : null}
            {item.frameworkName && item.errors > 1 ? ' ' : null}
            {item.errors > 1 ? <span>{item.errors} fel den senaste veckan</span> : null}
          </span>
        ) : null}
      </span>
      <span className="sa-qrow-when">{item.dueNow ? 'nu' : item.dueLabel}</span>
    </li>
  )
}
