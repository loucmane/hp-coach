import { ArrowRight, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtScore, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import { Bars } from './LagerHome'

export type HubProps = { width: WidthKey; live: boolean; account: ReactNode }

/** The frame owns the glass; the hub owns only opaque sheets and field notes. */
export function Hub({
  title,
  width,
  account,
  children,
}: HubProps & { title: string; children: ReactNode }) {
  return (
    <div className={`la-hub ${width === 'phone' ? 'la-phome' : 'la-home'}`}>
      <div className={width === 'phone' ? 'la-ptop' : 'la-top'}>
        <span className="la-mark-word">
          <i aria-hidden />
          HP-Coach
        </span>
        {account}
      </div>
      <header className="la-hello">
        <h1 className="la-greet" tabIndex={-1}>
          {title}
        </h1>
      </header>
      {children}
    </div>
  )
}

export function LagerOva(props: HubProps) {
  const { data, actions } = useDirectionData()
  const { ova } = data
  const resume = data.home.resume
  const weakest = ova.sections.find((s) => s.section === ova.weakest)
  const start = () =>
    resume
      ? actions.resume()
      : weakest
        ? actions.startDrill({ kind: 'weak', section: weakest.section })
        : actions.startDrill({ kind: 'mixed' })
  return (
    <Hub {...props} title="Öva">
      <div className="la-hub-grid">
        <div className="la-hub-lead">
          <section
            className={`la-sheet la-practice-start${props.live ? ' la-rise' : ''}`}
            data-depth="2"
            aria-labelledby="la-practice-h"
          >
            <span className="la-chip la-sec" data-sec={resume?.section ?? weakest?.section}>
              {resume ? 'Påbörjad' : weakest ? 'Nästa steg' : 'Börja här'}
            </span>
            <h2 className="la-resume-title" id="la-practice-h">
              {resume
                ? 'Fortsätt där du var.'
                : weakest
                  ? `Lite mer plats för ${weakest.section}.`
                  : 'En blandad övning.'}
            </h2>
            {resume ? (
              <>
                <p>
                  {resume.kind} · fråga {resume.position} av {resume.total}
                </p>
                <Bars total={resume.total} done={resume.answered} />
              </>
            ) : (
              <p>
                {weakest
                  ? `${weakest.name} har din lägsta skattade nivå just nu.`
                  : 'Välj ett delprov eller börja med en blandad övning.'}
              </p>
            )}
            <button
              type="button"
              className="la-btn"
              onClick={start}
              data-testid={!resume && !weakest ? 'rd-ova-mixed' : undefined}
            >
              {resume ? 'Fortsätt öva' : weakest ? `Öva ${weakest.section}` : 'Blandad övning'}
              <ArrowRight size={18} aria-hidden />
            </button>
          </section>
          <button
            type="button"
            className="la-repetition-door"
            data-testid="rd-ova-repetera"
            onClick={actions.openRepetera}
          >
            <span>
              <b>Repetera</b>
              <span>
                {ova.repetera.dueNow > 0
                  ? `${ova.repetera.dueNow} redo nu`
                  : 'Inget att repetera just nu'}{' '}
                · {ova.repetera.pile} i dagens hög
              </span>
            </span>
            <ChevronRight size={20} aria-hidden />
          </button>
          {resume || weakest ? (
            <button
              type="button"
              className="la-link la-mixed"
              data-testid="rd-ova-mixed"
              onClick={() => actions.startDrill({ kind: 'mixed' })}
            >
              Blandad övning · {ova.mixed.questions} frågor
              <ArrowRight size={16} aria-hidden />
            </button>
          ) : null}
        </div>
        <section className="la-sheet la-directory" data-depth="1" aria-labelledby="la-sections-h">
          <h2 className="la-h" id="la-sections-h">
            Välj delprov
          </h2>
          {(['verbal', 'kvant'] as const).map((half) => (
            <section
              key={half}
              className="la-section-group"
              aria-label={half === 'verbal' ? 'Verbal' : 'Kvantitativ'}
            >
              <h3 className="la-eyebrow">{half === 'verbal' ? 'Verbal' : 'Kvantitativ'}</h3>
              <ul>
                {ova.sections
                  .filter((s) => s.half === half)
                  .map((s) => (
                    <li key={s.section}>
                      <button
                        type="button"
                        className="la-section-door"
                        data-testid={`rd-ova-section-${s.section.toLowerCase().replace('ä', 'a')}`}
                        onClick={() => actions.startDrill({ kind: 'section', section: s.section })}
                      >
                        <span className="la-chip la-sec" data-sec={s.section}>
                          {s.section}
                        </span>
                        <span className="la-section-name">
                          <b>{s.name}</b>
                          <span>
                            {s.waiting} väntar
                            {s.section === ova.weakest ? ' · svagast just nu' : ''}
                          </span>
                        </span>
                        <span className="la-section-score">
                          {s.score == null ? 'Ej skattad' : fmtScore(s.score)}
                        </span>
                        <ChevronRight size={16} aria-hidden />
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </section>
        {ova.weakTraps.length ? (
          <section
            className="la-sheet la-hub-traps"
            data-depth="1"
            aria-labelledby="la-ova-traps-h"
          >
            <h2 className="la-h" id="la-ova-traps-h">
              Vanliga fällor
            </h2>
            <ul>
              {ova.weakTraps.map((t) => (
                <li key={t.frameworkId}>
                  <button
                    type="button"
                    className="la-trap-door"
                    onClick={() =>
                      actions.startDrill({
                        kind: 'framework',
                        frameworkId: t.frameworkId,
                        section: t.section,
                      })
                    }
                  >
                    <span className="la-chip la-sec" data-sec={t.section}>
                      {t.section}
                    </span>
                    <span>
                      <b>{t.name}</b>
                      {t.pattern ? <span>{t.pattern}</span> : null}
                    </span>
                    <span>{t.count} väntar</span>
                    <ChevronRight size={16} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Hub>
  )
}
