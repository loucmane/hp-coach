import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { MathText } from '@/components/MathText'
import { Hub, type HubProps } from './LagerOva'

export function LagerRepetera(props: HubProps) {
  const { data, actions } = useDirectionData()
  const queue = data.repetera
  const size = Math.min(10, queue.sessionSize, queue.dueNow)
  const groups = [
    { title: 'Redo nu', items: queue.items.filter((i) => i.dueNow) },
    { title: 'Senare i dagens hög', items: queue.items.filter((i) => !i.dueNow) },
  ]
  return (
    <Hub {...props} title="Repetera">
      <button type="button" className="la-link la-back" onClick={() => actions.go('ova')}>
        <ArrowLeft size={16} aria-hidden />
        Till Öva
      </button>
      <div className="la-hub-grid">
        <section
          className={`la-sheet la-practice-start${props.live ? ' la-rise' : ''}`}
          data-depth="2"
          aria-labelledby="la-repeat-h"
        >
          <span className="la-chip">Öva · repetition</span>
          <h2 className="la-resume-title" id="la-repeat-h">
            {size ? `${size} frågor, en stund i taget.` : 'Inget att repetera just nu.'}
          </h2>
          <p>
            {queue.dueNow} redo nu · {queue.pile} i dagens hög
          </p>
          {size ? (
            <>
              <p>En avgränsad övning med det som är redo att återvända till.</p>
              <button
                type="button"
                className="la-btn"
                data-testid="rd-repetera-start"
                onClick={() => actions.startDrill({ kind: 'repetition' })}
              >
                Repetera {size}
                <ArrowRight size={18} aria-hidden />
              </button>
            </>
          ) : (
            <>
              {queue.pile > 0 ? <p>Resten av dagens hög blir redo senare.</p> : null}
              <button type="button" className="la-btn" onClick={() => actions.go('ova')}>
                Öva istället
              </button>
            </>
          )}
        </section>
        <section className="la-sheet la-directory" data-depth="1" aria-labelledby="la-ready-h">
          <h2 className="la-h" id="la-ready-h">
            Redo per delprov
          </h2>
          <dl className="la-queue-counts">
            {data.ova.sections.map((s) => (
              <div key={s.section}>
                <dt>
                  {s.section} · {s.name}
                </dt>
                <dd>{queue.items.filter((i) => i.dueNow && i.section === s.section).length}</dd>
              </div>
            ))}
          </dl>
          <p>Det som blir redo senare ligger kvar här.</p>
        </section>
        <div className="la-queue-list">
          {groups
            .filter((g) => g.items.length)
            .map((g) => (
              <section
                className="la-sheet la-directory"
                data-depth="1"
                key={g.title}
                aria-label={g.title}
              >
                <h2 className="la-h">{g.title}</h2>
                <ol>
                  {g.items.map((item) => (
                    <li
                      className="la-queue-item"
                      key={item.mistakeId}
                      data-testid={`rd-repetera-item-${item.n}`}
                    >
                      <div className="la-queue-meta">
                        <span className="la-chip la-sec" data-sec={item.section}>
                          {item.section}
                        </span>
                        <span>{item.dueLabel}</span>
                      </div>
                      <p>
                        <MathText>{item.prompt ?? 'Frågetexten är inte tillgänglig.'}</MathText>
                      </p>
                      {item.frameworkName ||
                      (item.frameworkId && data.frameworks[item.frameworkId]) ? (
                        <p className="la-queue-trap">
                          Fallgrop · {item.frameworkName ?? data.frameworks[item.frameworkId ?? '']}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
        </div>
      </div>
    </Hub>
  )
}
