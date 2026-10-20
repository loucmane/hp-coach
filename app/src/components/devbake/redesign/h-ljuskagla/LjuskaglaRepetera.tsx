import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useId, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import type { RepeteraItemView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { SECTION_KEYS, type Section } from '@/data/questions'
import { count } from './LjuskaglaParts'

function Item({ item }: { item: RepeteraItemView }) {
  const meta = [item.frameworkName, item.dueNow ? null : item.dueLabel].filter(Boolean).join(' · ')
  return (
    <li className="lj-rep-item" data-testid={`rd-repetera-item-${item.n}`}>
      <span className="lj-row-code">{item.section}</span>
      <span className="lj-row-main">
        <span className="lj-rep-prompt">
          {item.prompt ? <MathText>{item.prompt}</MathText> : 'Frågetexten finns inte här.'}
        </span>
        {meta && <span>{meta}</span>}
      </span>
    </li>
  )
}

/**
 * Repetera: the next short session in the one pool of light — the due
 * misses, oldest first, capped at a session's size — with the rest of
 * today's pile quiet beside and below it. Nothing that is not due is
 * offered as ready, and nothing is counted as debt.
 */
export function LjuskaglaRepetera({ onBack }: { onBack: () => void }) {
  const { data, actions } = useDirectionData()
  const r = data.repetera
  const [filter, setFilter] = useState<Section | null>(null)
  const dueId = useId()
  const laterId = useId()
  const due = r.items.filter((item) => item.dueNow)
  const later = r.items.filter((item) => !item.dueNow)
  const bySection = SECTION_KEYS.map((section) => ({
    section,
    n: due.filter((item) => item.section === section).length,
  })).filter((s) => s.n > 0)
  const shownDue = filter ? due.filter((item) => item.section === filter) : due
  const shownLater = filter ? later.filter((item) => item.section === filter) : later
  const size = Math.min(shownDue.length, r.sessionSize)
  const start = () =>
    actions.startDrill(filter ? { kind: 'repetition', section: filter } : { kind: 'repetition' })
  return (
    <div className="lj-page lj-repetera">
      <button className="lj-text-button lj-back" type="button" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden /> Till Öva
      </button>
      <header className="lj-page-head">
        <p className="lj-eyebrow">Öva</p>
        <h1>Repetera</h1>
      </header>
      <div className="lj-hub-grid">
        <section className="lj-resume lj-hub-lamp" aria-label="Nästa repetition">
          {due.length === 0 ? (
            <>
              <p className="lj-eyebrow">Repetera</p>
              <h2>{r.pile === 0 ? 'Inga missar än' : 'Inget är redo just nu'}</h2>
              <p className="lj-hub-lamp-meta">
                {r.pile === 0
                  ? 'När du svarar fel hamnar frågan här, så att du möter den igen när det är dags.'
                  : `${count(r.pile, 'fråga', 'frågor')} blir redo senare.`}
              </p>
              <button className="lj-primary" type="button" onClick={onBack}>
                <span>Öva istället</span>
                <ArrowRight size={20} aria-hidden />
              </button>
            </>
          ) : (
            <>
              <p className="lj-eyebrow">Redo nu{filter ? ` · ${filter}` : ''}</p>
              <h2>{count(shownDue.length, 'fråga', 'frågor')} redo nu</h2>
              <p className="lj-hub-lamp-meta">
                De äldsta först.{' '}
                {size < shownDue.length
                  ? `Ett pass tar ${r.sessionSize} åt gången.`
                  : 'Ett kort pass, sedan är du klar för nu.'}
              </p>
              <button
                className="lj-primary"
                type="button"
                data-testid="rd-repetera-start"
                onClick={start}
              >
                <span>
                  Repetera {count(size, 'fråga', 'frågor')}
                  {filter ? ` i ${filter}` : ''}
                </span>
                <ArrowRight size={20} aria-hidden />
              </button>
            </>
          )}
        </section>
        <aside className="lj-hub-door lj-rep-pile lj-shade" aria-label="Dagens hög">
          <p className="lj-eyebrow">I dagens hög</p>
          <p className="lj-door-count">
            <strong>{r.pile}</strong> {r.pile === 1 ? 'fråga' : 'frågor'}
          </p>
          <p>
            {r.pile === 0
              ? 'Högen är tom.'
              : later.length > 0
                ? `${due.length} är redo nu, ${later.length} blir redo senare.`
                : 'Allt i högen är redo nu.'}
          </p>
        </aside>
        {r.items.length > 0 && (
          <section className="lj-hub-rows lj-shade" aria-label="Missarna">
            {bySection.length > 1 && (
              <fieldset className="lj-filters" aria-label="Visa delprov">
                <button
                  type="button"
                  aria-pressed={filter === null}
                  onClick={() => setFilter(null)}
                >
                  Alla <span>{due.length}</span>
                </button>
                {bySection.map((s) => (
                  <button
                    type="button"
                    key={s.section}
                    aria-pressed={filter === s.section}
                    onClick={() => setFilter(filter === s.section ? null : s.section)}
                  >
                    {s.section} <span>{s.n}</span>
                  </button>
                ))}
              </fieldset>
            )}
            {shownDue.length > 0 && (
              <>
                <div className="lj-section-head">
                  <h2 id={dueId}>Redo nu</h2>
                  <span>{count(shownDue.length, 'fråga', 'frågor')}</span>
                </div>
                <ol className="lj-rows lj-rep-list" aria-labelledby={dueId}>
                  {shownDue.map((item) => (
                    <Item key={item.mistakeId} item={item} />
                  ))}
                </ol>
              </>
            )}
            {shownLater.length > 0 && (
              <>
                <div className="lj-section-head lj-rep-later">
                  <h2 id={laterId}>Resten av dagens hög</h2>
                  <span>{count(shownLater.length, 'fråga', 'frågor')}</span>
                </div>
                <ol className="lj-rows lj-rep-list" aria-labelledby={laterId}>
                  {shownLater.map((item) => (
                    <Item key={item.mistakeId} item={item} />
                  ))}
                </ol>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
