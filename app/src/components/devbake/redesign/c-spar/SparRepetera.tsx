// Spår · Repetera — the queue of ripe misses, a sub-page of Öva (the rail
// keeps Öva lit; "← Öva" leads back). The misses stand as a vertical stig
// in the order they will play, each stop ringed in its section's hue and
// carrying its code, with the question and the trap behind it; the path
// ends in a goal. Ten play per round; more ripe ones wait under the goal,
// and the rest of today's pile is counted below it, listed on request.
// "Bara ett delprov" narrows the round to one section in place. The one
// green pill starts the round, and stays in reach at the page's foot.

import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { RepeteraItemView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import type { Section } from '@/data/questions'
import {
  count,
  Kbd,
  MIXED_MINUTES,
  minutesFor,
  ScopePicker,
  SparPageHead,
  SparStop,
  sectionMinutes,
  sectionName,
} from './sparParts'

export function SparRepetera({ width, live }: { width: WidthKey; live: boolean }) {
  const { data, actions } = useDirectionData()
  const { repetera, ova, home } = data
  const phone = width === 'phone'
  const [scope, setScope] = useState<Section | null>(null)
  const [restOpen, setRestOpen] = useState(false)

  const due = repetera.items.filter((i) => i.dueNow)
  const scoped = scope ? due.filter((i) => i.section === scope) : due
  const round = scoped.slice(0, repetera.sessionSize)
  const waiting = scoped.length - round.length
  const later = repetera.items.filter((i) => !i.dueNow)
  const fresh = repetera.pile === 0 && ova.sections.every((s) => s.attempts90d === 0)
  // Unscoped, the round is Idag's plan step and takes its time.
  const planMinutes = home.plan.items.find((i) => i.kind === 'repetition')?.minutes
  const minutes =
    !scope && planMinutes != null ? planMinutes : minutesFor(round.map((i) => i.section))

  // One green pill: the round; else the suggested section, a mixed round
  // for a new reader, or back to Öva once the queue is empty.
  const start = () =>
    actions.startDrill(scope ? { kind: 'repetition', section: scope } : { kind: 'repetition' })
  const instead =
    round.length > 0
      ? null
      : fresh
        ? {
            label: `Blandad övning · ca ${MIXED_MINUTES} min`,
            onClick: () => actions.startDrill({ kind: 'mixed' }),
          }
        : repetera.pile > 0 && ova.weakest
          ? {
              label: `Öva ${ova.weakest} · ca ${sectionMinutes(ova.weakest)} min`,
              onClick: () => {
                if (ova.weakest) actions.startDrill({ kind: 'section', section: ova.weakest })
              },
            }
          : { label: 'Till Öva', onClick: () => actions.go('ova') }
  useKeyMap({ Enter: instead ? instead.onClick : start }, live)

  const counts = sectionCounts(due)
  const lede =
    round.length > 0
      ? `Repetera ${round.length} av ${repetera.pile}, de äldsta först. Ungefär ${minutes} ${minutes === 1 ? 'minut' : 'minuter'}.`
      : fresh
        ? 'Här samlas dina missar. Svara fel på en fråga så hamnar den här, och kommer tillbaka när det är dags.'
        : repetera.pile > 0
          ? `Inget är redo just nu. ${count(repetera.pile, 'miss', 'missar')} blir redo om en stund.`
          : 'Inget väntar i kön idag. Det du missar hamnar här och kommer tillbaka när det är dags.'
  const back = phone ? null : (
    <button type="button" className="sp-link sp-back" onClick={() => actions.go('ova')}>
      <ArrowLeft size={17} strokeWidth={2.25} aria-hidden />
      Öva
    </button>
  )

  return (
    <div className="sp-page sp-rq-page" data-phone={String(phone)}>
      <SparPageHead
        phone={phone}
        back={back}
        eyebrow={scope ? `Repetition · bara ${scope}` : 'Repetition'}
        title="Dina missar"
        titleExtra={scope ? `, bara ${sectionName(scope)}` : undefined}
        lede={lede}
      />
      {round.length > 0 ? (
        <ol className="sp-rq" aria-label="Missar i den ordning de kommer">
          {round.map((item) => (
            <QueueItem key={item.mistakeId} item={item} phone={phone} />
          ))}
          <li className="sp-rq-item" data-kind="goal">
            <SparStop state="goal" size={phone ? 36 : 44} />
            <p className="sp-rq-goal">
              <b>Klart.</b> Det du svarar rätt på flyttas fram i schemat.
            </p>
          </li>
        </ol>
      ) : repetera.pile === 0 && !fresh ? (
        <div className="sp-rq-empty" aria-hidden>
          <SparStop state="goal" size={44} />
        </div>
      ) : null}
      {waiting > 0 ? (
        <p className="sp-rq-more">+ {waiting} till väntar i kön och kommer i nästa omgång.</p>
      ) : null}
      {later.length > 0 && round.length > 0 ? (
        <section className="sp-rq-rest" aria-labelledby="sp-rq-rest-h">
          <div className="sp-rq-rest-head">
            <h2 className="sp-h4" id="sp-rq-rest-h">
              {count(later.length, 'miss', 'missar')} till blir redo senare idag
            </h2>
            <p className="sp-rq-rest-mix">
              {sectionCounts(later)
                .map((c) => `${c.section} ${c.n}`)
                .join(' · ')}
            </p>
            <button
              type="button"
              className="sp-show sp-rq-rest-toggle"
              aria-expanded={restOpen}
              aria-controls="sp-rq-rest-list"
              onClick={() => setRestOpen(!restOpen)}
            >
              {restOpen ? 'Dölj dem' : 'Visa dem'}
              <ChevronDown
                size={18}
                strokeWidth={2.25}
                aria-hidden
                style={{ rotate: restOpen ? '180deg' : '0deg' }}
              />
            </button>
          </div>
          {restOpen ? (
            <ol className="sp-rq sp-rq--later" id="sp-rq-rest-list">
              {later.map((item) => (
                <QueueItem key={item.mistakeId} item={item} phone={phone} later />
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}
      <div className="sp-rq-foot">
        {instead ? (
          <button
            type="button"
            className="sp-btn sp-btn--primary sp-btn--lg"
            onClick={instead.onClick}
          >
            {instead.label}
            <Kbd>↵</Kbd>
          </button>
        ) : (
          <button
            type="button"
            className="sp-btn sp-btn--primary sp-btn--lg"
            data-testid="rd-repetera-start"
            onClick={start}
          >
            Starta repetition · {count(round.length, 'fråga', 'frågor')}
            <Kbd>↵</Kbd>
          </button>
        )}
        {round.length > 0 || scope ? (
          <ScopePicker phone={phone} counts={counts} current={scope} all onPick={setScope} />
        ) : null}
      </div>
    </div>
  )
}

/** Ripe misses per section, in the order the sections first appear. */
function sectionCounts(items: readonly RepeteraItemView[]): { section: Section; n: number }[] {
  const out: { section: Section; n: number }[] = []
  for (const i of items) {
    const c = out.find((x) => x.section === i.section)
    if (c) c.n += 1
    else out.push({ section: i.section, n: 1 })
  }
  return out
}

/** A miss on the path: its section stop, the section's name, the question
 *  and the trap behind it; how often it was missed this week when more
 *  than once. A later one says when it will be ready. */
function QueueItem({
  item,
  phone,
  later = false,
}: {
  item: RepeteraItemView
  phone: boolean
  later?: boolean
}) {
  return (
    <li
      className="sp-rq-item"
      data-kind={later ? 'later' : 'due'}
      data-testid={`rd-repetera-item-${item.n}`}
    >
      <SparStop
        state="section"
        size={later ? 30 : phone ? 36 : 44}
        sec={item.section}
        label={item.section}
      />
      <div className="sp-rq-text">
        <p className="sp-rq-name">
          <span>{sectionName(item.section)}</span>
          {later ? (
            <span className="sp-rq-meta"> · {item.dueLabel}</span>
          ) : item.errors > 1 ? (
            <span className="sp-rq-meta"> · {item.errors} fel den här veckan</span>
          ) : null}
        </p>
        {item.prompt ? (
          <p className="sp-rq-q">
            <MathText>{item.prompt}</MathText>
          </p>
        ) : null}
        {item.frameworkName && !later ? (
          <p className="sp-rq-trap">
            <span className="sp-rq-trap-label">Fälla:</span> {item.frameworkName}
          </p>
        ) : null}
      </div>
      {later || phone ? null : (
        <span className="sp-rq-n" aria-hidden>
          {item.n}
        </span>
      )}
    </li>
  )
}
