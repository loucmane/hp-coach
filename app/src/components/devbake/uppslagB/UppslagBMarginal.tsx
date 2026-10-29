import { useLayoutEffect, useRef } from 'react'
import { MathText } from '@/components/MathText'
import type { ProvteknikEntry } from '@/data/frameworks'
import { QuantPage } from '@/folio/screens/drill/QuantPage'
import { toDrillQuestion } from '@/folio/screens/drill/toDrillQuestion'
import { UHR_DELPROV, UHR_ORDER, uhrTimeMs } from '@/lib/uhrPacing'
import { ENTRIES, ESSENTIAL, QUESTION, STEPS, type StudyFlow } from './uppslagBFixtures'

const question = toDrillQuestion(QUESTION)
const passMinutes = UHR_ORDER.slice(0, 4).reduce(
  (sum, section) => sum + UHR_DELPROV[section].minutes,
  0,
)

export function UppslagBMarginal({ flow }: { flow: StudyFlow }) {
  return (
    <div className="ub-marginal">
      <aside className="ub-margin">
        <p className="ub-label">Uppslag</p>
        <h2 className="ub-margin-title">Kapitlen</h2>
        <button
          type="button"
          className="ub-chapter"
          onClick={flow.contents}
          aria-current={flow.sel.s < 5 ? 'page' : undefined}
        >
          <span>Före kapitlen</span>Provteknik
        </button>
        <p className="ub-chapter-context">
          <span>Kapitel 1</span>Ord & orddelar
        </p>
        <div className="ub-margin-note">
          <p className="ub-label">Att ha till hands</p>
          <p>
            {flow.sel.s < 5
              ? 'Råd för hela provet. Slå upp det du behöver.'
              : 'Låt frågan ligga kvar. Följ resonemanget en rad i taget.'}
          </p>
        </div>
      </aside>
      <div className="ub-reading">
        <RunningHead worked={flow.sel.s >= 5} />
        {flow.sel.s === 1 ? (
          <ReferenceIndex flow={flow} />
        ) : flow.sel.s < 5 ? (
          <ReferenceArticle flow={flow} />
        ) : (
          <>
            <WorkedHeading />
            <div className="ub-worked">
              <ExampleQuestion />
              <ExampleSteps flow={flow} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function RunningHead({ worked }: { worked: boolean }) {
  return (
    <div className="ub-runhead">
      <span>Uppslag · {worked ? 'KVA' : 'Alla delprov'}</span>
      <span>{worked ? 'Ett exempel' : 'Provteknik'}</span>
    </div>
  )
}

export function ReferenceIndex({ flow }: { flow: StudyFlow }) {
  return (
    <div className="ub-index">
      <header className="ub-index-intro">
        <p className="ub-label">Före kapitlen</p>
        <h2 className="ub-title" tabIndex={-1}>
          Provteknik
        </h2>
        <p className="ub-standfirst">
          Fördela tiden, gå vidare när du fastnar och svara på varje fråga.
        </p>
      </header>
      <ul className="ub-index-list">
        {ENTRIES.map((entry, index) => (
          <li key={entry.id}>
            <button type="button" aria-label={entry.headline} onClick={() => flow.openEntry(index)}>
              <span className="ub-label">{entry.delprov ?? 'Alla delprov'}</span>
              <span className="ub-index-title">{entry.headline}</span>
              <span className="ub-arrow" aria-hidden>
                ↗
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ReferenceArticle({ flow }: { flow: StudyFlow }) {
  return (
    <article className="ub-article">
      <button type="button" className="ub-link" onClick={flow.contents}>
        Alla råd
      </button>
      <header className="ub-article-head">
        <p className="ub-label">Provteknik · {flow.entry.delprov ?? 'Alla delprov'}</p>
        <h2 className="ub-title" tabIndex={-1}>
          {flow.entry.headline}
        </h2>
      </header>
      <ReferenceBody entry={flow.entry} />
      <EntryNavigation flow={flow} />
    </article>
  )
}

export function ReferenceBody({ entry }: { entry: ProvteknikEntry }) {
  return (
    <div className="ub-prose">
      <p>
        <MathText>{entry.body}</MathText>
      </p>
      {entry.id === 'PROV-001' && (
        <p className="ub-pass-time">Ett vanligt provpass är {passMinutes} minuter.</p>
      )}
      {entry.steps && (
        <ol className="ub-reference-steps">
          {entry.steps.map((step) => (
            <li key={step}>
              <MathText>{step}</MathText>
            </li>
          ))}
        </ol>
      )}
      {entry.id === 'PROV-002' && <PacingTable />}
      {entry.table && (
        <table className="ub-table">
          <caption>
            {entry.delprov === 'NOG'
              ? 'Tillräcklig information för lösningen erhålls'
              : entry.headline}
          </caption>
          <thead>
            <tr>
              <th scope="col">Svar</th>
              <th scope="col">Information</th>
            </tr>
          </thead>
          <tbody>
            {entry.table.map(([label, meaning]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function PacingTable() {
  return (
    <table className="ub-table ub-pacing">
      <caption>UHR:s rekommenderade tider</caption>
      <thead>
        <tr>
          {['Delprov', 'Frågor', 'Tid', 'Snitt per fråga'].map((label) => (
            <th scope="col" key={label}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {UHR_ORDER.map((section) => {
          const seconds = Math.round((uhrTimeMs(section, 1) ?? 0) / 1000)
          const average =
            seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`
          return (
            <tr key={section}>
              <th scope="row">{section}</th>
              <td>{UHR_DELPROV[section].questions}</td>
              <td>{UHR_DELPROV[section].minutes} min</td>
              <td>{average}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function EntryNavigation({ flow }: { flow: StudyFlow }) {
  return (
    <nav className="ub-entry-navigation" aria-label="Bläddra bland råd">
      <button
        type="button"
        className="ub-link"
        disabled={flow.entryIndex === 0}
        onClick={() => flow.openEntry(flow.entryIndex - 1)}
      >
        Föregående
      </button>
      <span>
        {flow.entryIndex + 1} av {ENTRIES.length} råd
      </span>
      <button
        type="button"
        className="ub-link"
        disabled={flow.entryIndex === ENTRIES.length - 1}
        onClick={() => flow.openEntry(flow.entryIndex + 1)}
      >
        Nästa
      </button>
    </nav>
  )
}

export function WorkedHeading() {
  return (
    <header className="ub-worked-heading">
      <p className="ub-label">Kvantitativa jämförelser</p>
      <h2 className="ub-title" tabIndex={-1}>
        Ett exempel, steg för steg
      </h2>
    </header>
  )
}

export function ExampleQuestion() {
  return (
    <section className="ub-question" aria-label="Exempelfrågan">
      <p className="ub-label">
        {question.source.label} · fråga {QUESTION.number}
      </p>
      <QuantPage q={question} n={QUESTION.number} bare />
      <ul className="ub-options" aria-label="Svarsalternativ">
        {QUESTION.options?.map((option) => (
          <li key={option.letter}>
            <span>{option.letter}</span>
            <MathText>{option.text}</MathText>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ExampleSteps({ flow }: { flow: StudyFlow }) {
  const done = flow.revealed === ESSENTIAL.length
  const independent = !done && flow.revealed >= Math.max(2, ESSENTIAL.length - 2)
  const answer = useRef<HTMLParagraphElement>(null)
  const focusAnswer = useRef(false)
  useLayoutEffect(() => {
    if (done && focusAnswer.current) {
      answer.current?.focus()
      focusAnswer.current = false
    }
  }, [done])
  return (
    <section className="ub-working" aria-label="Lösning steg för steg">
      <div className="ub-step-head">
        <h3>Resonemanget</h3>
        <p role="status">
          Steg {flow.revealed} av {ESSENTIAL.length}
        </p>
      </div>
      <ol className="ub-steps" aria-live="polite" aria-relevant="additions">
        {ESSENTIAL.slice(0, flow.revealed).map((step, index) => (
          <li key={step.n} data-testid="worked-step">
            <details open>
              <summary>
                <span className="ub-step-number" aria-hidden>
                  {index + 1}
                </span>
                <span>
                  <MathText>{step.title ?? `Steg ${index + 1}`}</MathText>
                </span>
                <span className="ub-fold" aria-hidden />
              </summary>
              <p>
                <MathText>{step.text}</MathText>
              </p>
            </details>
          </li>
        ))}
      </ol>
      <div aria-live="polite" aria-relevant="additions">
        {independent && (
          <div className="ub-faded">
            <span className="ub-step-number" aria-hidden>
              {flow.revealed + 1}
            </span>
            <p>Försök själv först.</p>
          </div>
        )}
        {done && (
          <p className="ub-answer" tabIndex={-1} ref={answer}>
            Svar: {QUESTION.answer}
          </p>
        )}
      </div>
      <div className="ub-actions">
        {!done && (
          <button
            type="button"
            className="ub-primary"
            onClick={() => {
              focusAnswer.current = flow.revealed === ESSENTIAL.length - 1
              flow.next()
            }}
          >
            Nästa steg
          </button>
        )}
        <button type="button" className="ub-link" onClick={flow.restart}>
          Från början
        </button>
      </div>
      {done && (
        <div className="ub-details">
          {STEPS.filter((step) => step.tier === 'detail').map((step) => (
            <details key={step.n}>
              <summary>{step.title ?? 'Fördjupning'}</summary>
              <p>
                <MathText>{step.text}</MathText>
              </p>
            </details>
          ))}
        </div>
      )}
    </section>
  )
}
