import { DAILY_MINUTES, firstSessionOrigin } from '@/lib/firstSession'
import { FIRST_NAME, PALETTES, QUESTIONS, ROOT, STEPS, type WelcomeFlow } from './welcomeFixtures'

export function WelcomeBrev({ flow }: { flow: WelcomeFlow }) {
  return (
    <div className="wb-brev">
      <div className="wb-sheet">
        <StepTitle flow={flow} />
        <StepBody flow={flow} />
        <StepActions flow={flow} />
      </div>
    </div>
  )
}

export function StepTitle({ flow }: { flow: WelcomeFlow }) {
  const step = flow.sel.s
  const titles = [
    `${FIRST_NAME}, gör den till din.`,
    'Vilket prov siktar du på?',
    'Hur mycket tid passar dig?',
    'Ett litet o- vänder betydelsen',
    'Tre ord att prova.',
    flow.doneLine,
  ]
  const copy = [
    'Börja med färgerna. Du kan ändra dem under Konto när som helst.',
    'Välj det provtillfälle du vill sikta mot.',
    'Välj 10, 20, 30 eller 45 minuter. Ditt val sparas och går att ändra under Konto.',
    'Tänk på skillnaden mellan betydlig och obetydlig. Ett litet prefix kan göra stor skillnad.',
    'Välj det alternativ som bäst motsvarar ordets betydelse.',
    '',
  ]
  return (
    <header className="wb-intro">
      <p className="wb-eyebrow">
        {step === 6 ? 'Din start' : step >= 4 ? 'Första passet' : 'Välkommen till HP·Coach'}
      </p>
      <h2 className="wb-title" tabIndex={-1}>
        {titles[step - 1]}
      </h2>
      {copy[step - 1] ? <p className="wb-standfirst">{copy[step - 1]}</p> : null}
    </header>
  )
}

export function ThemeChoices({
  flow,
  swatches = false,
}: {
  flow: WelcomeFlow
  swatches?: boolean
}) {
  return (
    <div className="wb-preferences">
      <fieldset className="wb-choice">
        <legend>Tema</legend>
        <div className="wb-words">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={flow.sel.t === t}
              onClick={() => flow.select({ t })}
            >
              {t === 'light' ? 'Ljust' : 'Mörkt'}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="wb-choice">
        <legend>Färg</legend>
        <div className="wb-words">
          {PALETTES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={flow.sel.p === key}
              onClick={() => flow.select({ p: key })}
            >
              {swatches ? (
                <span
                  className="wb-swatch"
                  data-folio=""
                  data-palette={key}
                  data-theme={flow.sel.t}
                  aria-hidden="true"
                >
                  <i />
                </span>
              ) : null}
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

export function RootArticle() {
  return (
    <article className="wb-root" aria-label="Ordmönster">
      <h3>{ROOT.root}</h3>
      <p className="wb-root-origin">germanskt ursprung</p>
      <p className="wb-root-meaning">{ROOT.meaning}</p>
      <h4 className="wb-eyebrow">Exempel</h4>
      <p className="wb-root-words">{ROOT.example_words.slice(0, 3).join(' · ')}</p>
    </article>
  )
}

export function DrillQuestion({ flow }: { flow: WelcomeFlow }) {
  const q = QUESTIONS[flow.question]
  return (
    <section className="wb-drill" aria-label="ORD-fråga" data-qid={q.qid}>
      <div className="wb-runhead">
        <span>ORD</span>
        <span>Fråga {flow.question + 1} av 3</span>
      </div>
      <h3 className="wb-word">{q.prompt}</h3>
      <ol className="wb-options" aria-label="Svarsalternativ">
        {q.options?.map((option) => (
          <li key={option.letter}>
            <button
              type="button"
              aria-pressed={flow.picks[flow.question] === option.letter}
              disabled={flow.revealed}
              data-right={flow.revealed && q.answer === option.letter ? 'true' : undefined}
              onClick={() => flow.pick(option.letter)}
            >
              <span className="wb-letter">{option.letter}</span> {option.text}
              {flow.revealed && q.answer === option.letter ? <small>Rätt svar</small> : null}
            </button>
          </li>
        ))}
      </ol>
      {flow.revealed ? (
        <p className="wb-answer" role="status">
          Rätt svar: {q.answer} · {q.options?.find((o) => o.letter === q.answer)?.text}.
        </p>
      ) : null}
    </section>
  )
}

export function StepBody({
  flow,
  swatches = false,
  spread = false,
}: {
  flow: WelcomeFlow
  swatches?: boolean
  spread?: boolean
}) {
  switch (flow.sel.s) {
    case 1:
      return <ThemeChoices flow={flow} swatches={swatches} />
    case 2:
      return flow.sittings.length ? (
        <fieldset className="wb-choice">
          <legend>Provtillfälle</legend>
          <div className="wb-sittings">
            {flow.sittings.map((sitting) => (
              <button
                key={sitting.id}
                type="button"
                aria-pressed={flow.sitting?.id === sitting.id}
                onClick={() => flow.setSitting(sitting.id)}
              >
                <span>{sitting.label}</span>
                <small>
                  {sitting.date.toLocaleDateString('sv-SE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </small>
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <p>Nästa provdatum är inte publicerat här än. Du kan välja det under Konto senare.</p>
      )
    case 3:
      return (
        <fieldset className="wb-choice">
          <legend>Tid per dag</legend>
          <div className="wb-words wb-minutes">
            {DAILY_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                aria-pressed={flow.minutes === minutes}
                onClick={() => flow.setMinutes(minutes)}
              >
                {minutes} minuter
              </button>
            ))}
          </div>
        </fieldset>
      )
    case 4:
      return (
        <>
          {spread ? null : <RootArticle />}
          <p className="wb-note">
            Det här första passet är till för att prova. Det påverkar inte din prognos.
          </p>
        </>
      )
    case 5:
      return spread ? (
        <p className="wb-note">Läs ordet och välj ett svar i uppslaget.</p>
      ) : (
        <DrillQuestion flow={flow} />
      )
    case 6: {
      const origins = QUESTIONS.map((q) =>
        firstSessionOrigin(q.qid)?.replace('Högskoleprovet ', ''),
      )
      return (
        <div className="wb-done-copy">
          <p>
            Frågorna kom från högskoleprovet {origins[0]}, {origins[1]} och {origins[2]}.
          </p>
          <p>Imorgon väntar en kort diagnos.</p>
          <p className="wb-note">Dina val går att ändra när som helst.</p>
        </div>
      )
    }
  }
}

export function StepActions({
  flow,
  skip = true,
  drill = true,
}: {
  flow: WelcomeFlow
  skip?: boolean
  drill?: boolean
}) {
  const step = flow.sel.s
  return (
    <footer className="wb-actions">
      {step === 6 ? (
        <>
          <button className="wb-primary" type="button" onClick={flow.goToday}>
            Till Idag
          </button>
          <button className="wb-link" type="button" onClick={flow.practice}>
            Fortsätt öva →
          </button>
        </>
      ) : step === 5 ? (
        drill ? (
          <button
            className="wb-primary"
            type="button"
            disabled={!flow.picks[flow.question]}
            onClick={flow.revealed ? flow.nextQuestion : flow.reveal}
          >
            {flow.revealed
              ? flow.question === 2
                ? 'Se din start →'
                : 'Nästa fråga →'
              : 'Visa svar'}
          </button>
        ) : null
      ) : (
        <button
          className="wb-primary"
          type="button"
          onClick={() => flow.select({ s: (step + 1) as WelcomeFlow['sel']['s'] })}
        >
          {step === 4 ? 'Prova tre frågor →' : 'Fortsätt →'}
        </button>
      )}
      {step > 1 && step < 6 ? (
        <button
          type="button"
          className="wb-link"
          onClick={() => flow.select({ s: (step - 1) as WelcomeFlow['sel']['s'] })}
        >
          ← Tillbaka
        </button>
      ) : null}
      {skip && step < 6 ? (
        <button className="wb-link wb-skip" type="button" onClick={flow.goToday}>
          Hoppa över
        </button>
      ) : null}
    </footer>
  )
}

export function StepLinks({ flow }: { flow: WelcomeFlow }) {
  return (
    <nav className="wb-step-links" aria-label="Välkomststeg">
      {STEPS.map((step) => (
        <button
          key={step.key}
          type="button"
          aria-current={flow.sel.s === step.key ? 'step' : undefined}
          onClick={() => flow.select({ s: step.key })}
        >
          {step.label}
        </button>
      ))}
    </nav>
  )
}

export function TodayPreview({ flow }: { flow: WelcomeFlow }) {
  return (
    <section className="wb-today" aria-label="Idag">
      <div className="wb-runhead">
        <span>Idag</span>
        <span>Din start</span>
      </div>
      <h3>Välkommen, {FIRST_NAME}.</h3>
      <p>En fråga i taget.</p>
      <div className="wb-today-lead">
        <p className="wb-eyebrow">ORD · första passet</p>
        <h4>Ett litet o- vänder betydelsen.</h4>
        <p>Upptäck ordmönstret och prova tre frågor från riktiga högskoleprov.</p>
        <button type="button" className="wb-link" onClick={() => flow.select({ s: 4 })}>
          Till ordmönstret →
        </button>
      </div>
    </section>
  )
}
