// Svep · Repetera. Today's misses as a finite hand. The ones ready now are
// the batch — in the server's order, the longest-waiting first, at most a
// sitting's size — and the rest of today's pile waits under them, quieter:
// a later review is not something to do now. One card holds the batch (how
// many are ready, the hand of its cards with their sections, one start);
// the register beside it names each card: its section, its question and
// its trap. A section chip narrows the batch to one section, and "Alla"
// widens it again; nothing here counts down or scolds.
//
// Desktop: the page and the chips to the left, the batch card with the
// pile's edges behind it in the middle, the register to the right. Phone:
// one column — the chips, the batch card, then the register.
//
// Kit v2: the queue is the view model's (useDirectionData().data.repetera)
// and the start is a request (actions.startDrill({ kind: 'repetition' }),
// with the section when narrowed).

import { ArrowLeft, ChevronDown } from 'lucide-react'
import { type CSSProperties, useId, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { DrillRequest, RepeteraItemView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { cap, frameworkKind, Kbd, SecChip, word } from './parts'
import type { FrameNav } from './Svep'

export function SvepRepetera({
  width,
  live,
  nav,
}: {
  width: WidthKey
  live: boolean
  nav: FrameNav
}) {
  const { data, actions } = useDirectionData()
  const r = data.repetera
  const [scope, setScope] = useState<Section | null>(null)
  const due = r.items.filter((i) => i.dueNow)
  const later = r.items.filter((i) => !i.dueNow)
  const scoped = scope ? due.filter((i) => i.section === scope) : due
  const batch = scoped.slice(0, r.sessionSize)
  const waitingNext = scoped.slice(r.sessionSize)
  // The sections with something ready, in the exam's order.
  const sections = SECTION_KEYS.filter((s) => due.some((i) => i.section === s))
  const request: DrillRequest = scope
    ? { kind: 'repetition', section: scope }
    : { kind: 'repetition' }
  const start = () => actions.startDrill(request)
  const phone = width === 'phone'

  // Enter starts the batch, as it takes the card in front on Idag.
  useKeyMap(batch.length ? { Enter: start } : {}, live)

  const summary =
    r.pile === 0
      ? 'Inga missar än. Missar du en fråga läggs den här, redo att repeteras.'
      : r.dueNow === 0
        ? `Inget är redo just nu. ${r.pile} ligger i dagens hög och blir redo senare.`
        : `${cap(word(r.dueNow))} är redo nu${r.pile > r.dueNow ? `, ${r.pile} ligger i dagens hög` : ''}.`

  const chips =
    sections.length > 1 ? (
      <fieldset className="sv-scope">
        <legend className="sv-scope-label">Omgången</legend>
        <div className="sv-scope-row">
          <button type="button" aria-pressed={scope == null} onClick={() => setScope(null)}>
            Alla <span>{due.length}</span>
          </button>
          {sections.map((s) => (
            <button
              type="button"
              key={s}
              aria-pressed={scope === s}
              onClick={() => setScope(scope === s ? null : s)}
            >
              {s} <span>{due.filter((i) => i.section === s).length}</span>
            </button>
          ))}
        </div>
      </fieldset>
    ) : null

  const card = (
    <BatchCard
      batch={batch}
      pile={r.pile}
      ready={r.dueNow}
      scope={scope}
      sessionSize={r.sessionSize}
      onStart={start}
      onOva={() => nav.go('ova')}
    />
  )
  const register = (
    <Register batch={batch} next={waitingNext} later={scope ? [] : later} scope={scope} />
  )

  if (phone) {
    return (
      <div className="sv-prep">
        <header className="sv-prep-head">
          <h1 className="sv-greet">Repetera</h1>
          <p className="sv-day">{summary}</p>
        </header>
        {chips}
        {card}
        {register}
      </div>
    )
  }

  return (
    <div className="sv-rep">
      <aside className="sv-rep-side" aria-label="Repetera">
        <h1 className="sv-greet">Repetera</h1>
        <p className="sv-day">{summary}</p>
        {chips}
        <button type="button" className="sv-link sv-rep-back" onClick={() => nav.go('ova')}>
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          Till Öva
        </button>
      </aside>
      <div className="sv-rep-center">{card}</div>
      <div className="sv-rep-end">{register}</div>
    </div>
  )
}

/** The batch: one card, the rest of the pile as edges behind it. */
function BatchCard({
  batch,
  pile,
  ready,
  scope,
  sessionSize,
  onStart,
  onOva,
}: {
  batch: RepeteraItemView[]
  pile: number
  ready: number
  scope: Section | null
  sessionSize: number
  onStart: () => void
  onOva: () => void
}) {
  const titleId = useId()
  const empty = batch.length === 0
  return (
    <div className="sv-rep-slot" data-edges={pile > batch.length ? 'true' : undefined}>
      {pile > batch.length ? (
        <>
          <span className="sv-qedge" data-n="1" aria-hidden />
          <span className="sv-qedge" data-n="2" aria-hidden />
        </>
      ) : null}
      <section className="sv-card sv-rep-card" aria-labelledby={titleId}>
        <div className="sv-hc-top">
          <SecChip section={null} label="Repetition" />
          <span className="sv-hc-eyebrow">{scope ? `Omgången · ${scope}` : 'Omgången'}</span>
          {pile > 0 ? <span className="sv-hc-meta">{pile}&nbsp;i dagens hög</span> : null}
        </div>
        <div className="sv-hc-body">
          {empty ? (
            <h2 className="sv-hc-title" id={titleId}>
              {pile === 0 ? 'Inga missar än' : 'Inget redo just nu'}
            </h2>
          ) : (
            <h2 className="sv-rep-count" id={titleId}>
              <span className="sv-rep-n">{batch.length}</span>
              <span className="sv-rep-n-label">
                {batch.length === 1 ? 'fråga' : 'frågor'} redo nu
                {scope ? ` i ${scope}` : ''}
              </span>
            </h2>
          )}
          {empty ? null : <Hand batch={batch} />}
          <p className="sv-hc-detail">
            {empty
              ? pile === 0
                ? 'Missar du en fråga läggs den här.'
                : 'Resten av dagens hög blir redo senare.'
              : 'De som väntat längst först.'}
          </p>
        </div>
        {empty ? null : (
          <p className="sv-hc-why">
            {ready > sessionSize && !scope
              ? `Högst ${sessionSize} frågor i en omgång; resten tar du nästa gång.`
              : `Högst ${sessionSize} frågor i en omgång. Facit efter varje svar.`}
          </p>
        )}
        <div className="sv-hc-foot">
          {empty ? (
            <button type="button" className="sv-btn sv-btn--tonal sv-btn--block" onClick={onOva}>
              Till Öva
            </button>
          ) : (
            <button
              type="button"
              className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
              data-testid="rd-repetera-start"
              onClick={onStart}
            >
              Repetera {batch.length}
              <Kbd>↵</Kbd>
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

/** The batch as a hand of cards, face up, each with its section. A picture:
 *  the register names every card in words. */
function Hand({ batch }: { batch: RepeteraItemView[] }) {
  const n = batch.length
  return (
    <span
      className="sv-rep-hand"
      role="img"
      aria-label={`${n} kort: ${batch.map((i) => i.section).join(', ')}`}
    >
      {batch.map((item, i) => (
        <i
          key={item.mistakeId}
          data-sec={item.section}
          style={{ '--i': i - (n - 1) / 2 } as CSSProperties}
        >
          {item.section}
        </i>
      ))}
    </span>
  )
}

/** The register: each card of the batch with its section, question and
 *  trap; then any ready ones past a sitting; then, folded, today's later
 *  pile. */
function Register({
  batch,
  next,
  later,
  scope,
}: {
  batch: RepeteraItemView[]
  next: RepeteraItemView[]
  later: RepeteraItemView[]
  scope: Section | null
}) {
  const headId = useId()
  const laterId = useId()
  const [open, setOpen] = useState(false)
  return (
    <section className="sv-rep-register" aria-labelledby={headId}>
      <h2 className="sv-index-head" id={headId}>
        {scope ? `Omgången i ${scope}` : 'Omgången'}{' '}
        <span>
          · {batch.length}&nbsp;{batch.length === 1 ? 'fråga' : 'frågor'}
        </span>
      </h2>
      {batch.length ? (
        <ol className="sv-rep-list">
          {batch.map((item) => (
            <Item key={item.mistakeId} item={item} />
          ))}
        </ol>
      ) : null}
      {next.length ? (
        <>
          <p className="sv-index-group">Nästa omgång</p>
          <ol className="sv-rep-list">
            {next.map((item) => (
              <Item key={item.mistakeId} item={item} />
            ))}
          </ol>
        </>
      ) : null}
      {later.length ? (
        <div className="sv-rep-later">
          <button
            type="button"
            className="sv-link"
            aria-expanded={open}
            aria-controls={laterId}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Dölj resten av dagens hög' : `${later.length} till blir redo senare`}
            <ChevronDown size={15} strokeWidth={2} aria-hidden />
          </button>
          {open ? (
            <ol className="sv-rep-list sv-rep-list--later" id={laterId}>
              {later.map((item) => (
                <Item key={item.mistakeId} item={item} />
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function Item({ item }: { item: RepeteraItemView }) {
  return (
    <li
      className="sv-rep-item"
      data-testid={`rd-repetera-item-${item.n}`}
      data-due={String(item.dueNow)}
    >
      <span className="sv-rep-item-n" aria-hidden>
        {item.n}
      </span>
      <div className="sv-rep-item-body">
        <p className="sv-rep-item-top">
          <SecChip section={item.section} />
          {item.dueNow ? null : <span className="sv-rep-item-when">{item.dueLabel}</span>}
        </p>
        {item.prompt ? (
          <p className="sv-rep-item-q" lang={item.section === 'ELF' ? 'en' : undefined}>
            <MathText>{item.prompt}</MathText>
          </p>
        ) : null}
        {item.frameworkName && item.frameworkId ? (
          // One line; the whole name on hover, and always to a screen reader.
          <p
            className="sv-rep-item-trap"
            title={`${frameworkKind(item.frameworkId)}: ${item.frameworkName}`}
          >
            <span>{frameworkKind(item.frameworkId)}:</span> {item.frameworkName}
          </p>
        ) : null}
      </div>
    </li>
  )
}
