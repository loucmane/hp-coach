import { ArrowLeft, ArrowRight } from 'lucide-react'
import { MathText } from '@/components/MathText'
import { useDirectionData } from '../directionData'
import { Readout } from './parts'

export function InstrumentRepetera() {
  const { data, actions } = useDirectionData()
  const queue = data.repetera
  const batch = Math.min(10, queue.sessionSize, queue.dueNow)
  const ready = queue.items.filter((item) => item.dueNow)
  const later = queue.items.filter((item) => !item.dueNow)
  return (
    <div className="in-hub">
      <button type="button" className="in-link" onClick={() => actions.go('ova')}>
        <ArrowLeft size={16} aria-hidden />
        Till Öva
      </button>
      <header className="in-greet">
        <h1 tabIndex={-1}>Repetera</h1>
        <p>
          {queue.pile === 0
            ? 'Inga missar än — när du svarar fel i en övning landar frågan här.'
            : batch > 0
              ? 'Ett avgränsat pass. De äldsta missarna först.'
              : 'Inget är redo just nu. Resten blir redo senare.'}
        </p>
      </header>
      <section className="in-directory" aria-label="Repetitionskö">
        <div className="in-hub-lead">
          <div className="in-queue-readouts">
            <Readout label="Redo nu" value={String(queue.dueNow)} />
            <Readout label="Dagens hög" value={String(queue.pile)} />
          </div>
          {batch > 0 ? (
            <button
              type="button"
              className="in-btn"
              data-testid="rd-repetera-start"
              onClick={() => actions.startDrill({ kind: 'repetition' })}
            >
              Repetera {batch}
              <ArrowRight size={16} aria-hidden />
            </button>
          ) : (
            <button type="button" className="in-btn" onClick={() => actions.go('ova')}>
              Öva istället
              <ArrowRight size={16} aria-hidden />
            </button>
          )}
        </div>
        {batch > 0 ? (
          <p className="in-queue-note">
            {batch} frågor i nästa pass
            {queue.dueNow > batch ? ` · ${queue.dueNow - batch} redo därefter` : ''}.
          </p>
        ) : null}
        {[
          { title: 'Redo nu', items: ready },
          { title: 'Resten av dagens hög', items: later },
        ].map(({ title, items }) =>
          items.length ? (
            <section key={title}>
              <h2 className="in-cell-head">{title}</h2>
              <ol className="in-queue">
                {items.map((item) => (
                  <li key={item.mistakeId} data-testid={`rd-repetera-item-${item.n}`}>
                    <span className="in-code">{item.section}</span>
                    <div>
                      <p className="in-queue-prompt">
                        <MathText>{item.prompt ?? 'Frågetexten är inte tillgänglig.'}</MathText>
                      </p>
                      {item.frameworkName ? (
                        <p className="in-sub">Fälla: {item.frameworkName}</p>
                      ) : null}
                    </div>
                    <span className="in-queue-due">{item.dueNow ? 'Redo nu' : item.dueLabel}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null,
        )}
      </section>
    </div>
  )
}
