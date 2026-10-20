import { ArrowRight, Repeat } from 'lucide-react'
import { useId } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtScore } from '@/components/devbake/redesign/r1Kit'
import type { OvaSectionView } from '@/components/devbake/redesign/viewModel'
import { count, sectionId } from './LjuskaglaParts'

function recency(days: number | null): string | null {
  if (days == null) return null
  if (days === 0) return 'övat idag'
  if (days === 1) return 'övat igår'
  return `övat för ${days} dagar sedan`
}

/** A row's quiet second line: why it stands out, else how recent it is. */
function rowNote(s: OvaSectionView, weakest: boolean): string {
  const parts = [
    weakest ? 'svagast just nu' : null,
    s.score == null ? 'inte övat än' : s.confidence === 'low' ? 'för lite underlag än' : null,
    s.score == null ? null : recency(s.daysSince),
  ].filter(Boolean) as string[]
  const text = parts.join(' · ')
  return text.charAt(0).toLocaleUpperCase('sv-SE') + text.slice(1)
}

/** The door to Repetera: always there, saying plainly what is ready. */
function RepetitionDoor({
  dueNow,
  pile,
  onOpen,
}: {
  dueNow: number
  pile: number
  onOpen: () => void
}) {
  return (
    <button type="button" className="lj-door" data-testid="rd-ova-repetera" onClick={onOpen}>
      <span className="lj-door-top">
        <span className="lj-eyebrow">Repetera</span>
        <Repeat size={20} strokeWidth={1.5} aria-hidden />
      </span>
      <span className="lj-door-count">
        {pile === 0 ? (
          'Inga missar än'
        ) : dueNow === 0 ? (
          'Inget är redo just nu'
        ) : (
          <>
            <strong>{dueNow}</strong> redo nu
          </>
        )}
      </span>
      {pile > 0 && <span className="lj-door-pile">{pile} i dagens hög</span>}
      <span className="lj-door-link">
        Öppna Repetera <ArrowRight size={16} aria-hidden />
      </span>
    </button>
  )
}

/**
 * Öva: one lit choice at the head — the paused session, else the weakest
 * section, else a mixed drill — above the eight sections in their fixed
 * order, unboxed in the shade. Repetera keeps its own door near the top,
 * even at zero. A section row starts that section's drill directly.
 */
export function LjuskaglaOva() {
  const { data, actions } = useDirectionData()
  const allId = useId()
  const { ova } = data
  const resume = data.home.resume
  const weakest = ova.weakest ? (ova.sections.find((s) => s.section === ova.weakest) ?? null) : null
  const lamp = resume ? 'resume' : weakest ? 'weakest' : 'mixed'
  const mixed = () => actions.startDrill({ kind: 'mixed' })
  return (
    <div className="lj-page lj-ova">
      <header className="lj-page-head">
        <p className="lj-eyebrow">Öva</p>
        <h1>Välj din övning.</h1>
      </header>
      <div className="lj-hub-grid">
        <section className="lj-resume lj-hub-lamp" aria-label="Förslag">
          {resume ? (
            <>
              <p className="lj-eyebrow">Påbörjad övning</p>
              <h2>{resume.title}</h2>
              <p className="lj-hub-lamp-meta">
                {resume.section} · fråga {resume.position} av {resume.total}
              </p>
              <button className="lj-primary" type="button" onClick={() => actions.resume()}>
                <span>Fortsätt övningen</span>
                <ArrowRight size={20} aria-hidden />
              </button>
            </>
          ) : weakest ? (
            <>
              <p className="lj-eyebrow">Förslag för idag</p>
              <h2>{weakest.name}</h2>
              {weakest.score != null && (
                <p className="lj-hub-lamp-meta">
                  Ditt svagaste delprov just nu, uppskattat {fmtScore(weakest.score)} av 2,0.
                </p>
              )}
              <button
                className="lj-primary"
                type="button"
                onClick={() => actions.startDrill({ kind: 'section', section: weakest.section })}
              >
                <span>Öva {weakest.section}</span>
                <ArrowRight size={20} aria-hidden />
              </button>
            </>
          ) : (
            <>
              <p className="lj-eyebrow">Ett lugnt sätt att börja</p>
              <h2>Blandad övning</h2>
              <p className="lj-hub-lamp-meta">
                {count(ova.mixed.questions, 'fråga', 'frågor')} från alla delprov.
              </p>
              <button
                className="lj-primary"
                type="button"
                data-testid="rd-ova-mixed"
                onClick={mixed}
              >
                <span>Starta blandad övning</span>
                <ArrowRight size={20} aria-hidden />
              </button>
            </>
          )}
        </section>
        <div className="lj-hub-door">
          <RepetitionDoor
            dueNow={ova.repetera.dueNow}
            pile={ova.repetera.pile}
            onOpen={() => actions.openRepetera()}
          />
        </div>
        <section className="lj-hub-rows lj-shade" aria-labelledby={allId}>
          <div className="lj-section-head">
            <h2 id={allId}>Alla delprov</h2>
            <span>Välj ett för att börja</span>
          </div>
          <ol className="lj-rows">
            {ova.sections.map((s) => {
              const isWeakest = s.section === weakest?.section
              const note = rowNote(s, isWeakest)
              const score = s.score == null ? null : fmtScore(s.score)
              return (
                <li key={s.section} data-weakest={String(isWeakest)}>
                  <button
                    type="button"
                    className="lj-row"
                    data-testid={`rd-ova-section-${sectionId(s.section)}`}
                    aria-label={[
                      `Öva ${s.section}, ${s.name}`,
                      note.toLocaleLowerCase('sv-SE'),
                      score ? `uppskattat ${score} av 2,0` : null,
                      s.waiting > 0 ? `${s.waiting} väntar i repetitionen` : null,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                    onClick={() => actions.startDrill({ kind: 'section', section: s.section })}
                  >
                    <span className="lj-row-code">{s.section}</span>
                    <span className="lj-row-main">
                      <strong>{s.name}</strong>
                      {note && <span>{note}</span>}
                    </span>
                    <span className="lj-row-score">{score}</span>
                    <span className="lj-row-count">
                      {s.waiting > 0 ? `${s.waiting} väntar` : null}
                    </span>
                    <ArrowRight className="lj-row-arrow" size={18} aria-hidden />
                  </button>
                </li>
              )
            })}
          </ol>
          {lamp !== 'mixed' && (
            <button
              className="lj-text-button lj-hub-mixed"
              type="button"
              data-testid="rd-ova-mixed"
              onClick={mixed}
            >
              Blandad övning · {count(ova.mixed.questions, 'fråga', 'frågor')} från alla delprov
              <ArrowRight size={16} aria-hidden />
            </button>
          )}
        </section>
        <aside className="lj-hub-aside lj-shade">
          <p className="lj-hub-note">
            ”Väntar” är missar i dagens hög. ”Redo nu” är de som är mogna att repeteras just nu.
          </p>
          {ova.weakTraps.length > 0 && (
            <section className="lj-hub-traps">
              <h2>Vanliga fällor</h2>
              <ul>
                {ova.weakTraps.map((t) => (
                  <li key={t.frameworkId}>
                    <button
                      type="button"
                      className="lj-trap-row"
                      onClick={() => actions.openLesson(t.frameworkId)}
                    >
                      <span className="lj-trap-pattern">{t.pattern ?? t.name}</span>
                      <span>
                        {t.section}
                        {t.pattern ? ` · ${t.name}` : ''} · {count(t.count, 'miss', 'missar')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
