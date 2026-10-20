import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { MathText } from '@/components/MathText'

export function RasterRepetera() {
  const { data, actions } = useDirectionData()
  const queue = data.repetera
  const count = Math.min(queue.dueNow, queue.sessionSize)
  const due = queue.items.filter((item) => item.dueNow)
  const later = queue.items.filter((item) => !item.dueNow)
  return (
    <div className="ra-overview">
      <button type="button" className="ra-back" onClick={() => actions.go('ova')}>
        ← Till Öva
      </button>
      <header className="ra-page-heading">
        <h1>Repetera</h1>
        <p>Ett kort pass, sedan klart.</p>
      </header>
      <div className="ra-overview-grid ra-queue-summary">
        <section aria-label="Redo nu">
          <p className="ra-display">{String(queue.dueNow).padStart(2, '0')}</p>
          <p>{queue.dueNow ? 'redo nu' : 'Inget redo just nu'}</p>
          {count > 0 ? (
            <button
              type="button"
              className="ra-primary ra-practice-lead"
              data-testid="rd-repetera-start"
              onClick={() => actions.startDrill({ kind: 'repetition' })}
            >
              Repetera {count} frågor <span aria-hidden>↗</span>
            </button>
          ) : (
            <>
              <p className="ra-intro">
                {queue.pile
                  ? 'Frågorna i högen blir redo senare.'
                  : 'När du svarar fel i en övning hittar du frågan här.'}
              </p>
              <button
                type="button"
                className="ra-primary ra-practice-lead"
                onClick={() => actions.go('ova')}
              >
                Öva istället <span aria-hidden>↗</span>
              </button>
            </>
          )}
        </section>
        <aside>
          <div className="ra-section-heading">
            <h2>I dagens hög</h2>
            <span>{queue.pile} frågor</span>
          </div>
          <p className="ra-intro">
            {queue.pile > queue.dueNow
              ? `${queue.pile - queue.dueNow} blir redo senare.`
              : 'De frågor som är redo kan du öva nu.'}
          </p>
          {[...new Set(due.map((item) => item.section))].map((section) => (
            <button
              type="button"
              className="ra-text-door"
              key={section}
              onClick={() => actions.startDrill({ kind: 'repetition', section })}
            >
              Repetera {section}
              <span>{due.filter((item) => item.section === section).length} redo nu ↗</span>
            </button>
          ))}
        </aside>
      </div>
      {[
        { title: 'Redo nu', items: due },
        { title: 'Senare', items: later },
      ]
        .filter((group) => group.items.length)
        .map((group) => (
          <section className="ra-queue" key={group.title} aria-label={group.title}>
            <div className="ra-section-heading">
              <h2>{group.title}</h2>
              <span>{group.items.length} frågor</span>
            </div>
            <ol>
              {group.items.map((item) => (
                <li
                  className="ra-queue-row"
                  key={item.mistakeId}
                  data-testid={`rd-repetera-item-${item.n}`}
                >
                  <b>{item.section}</b>
                  <div>
                    <p>
                      <MathText>
                        {item.prompt ?? 'Frågetexten visas när övningen startar.'}
                      </MathText>
                    </p>
                    {item.frameworkName ? <small>{item.frameworkName}</small> : null}
                  </div>
                  <span>{item.dueLabel}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
    </div>
  )
}
