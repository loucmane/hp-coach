// Studio 12 — "Dagens Spalt" (The Daily Column)
// Thesis: the daily puzzle ritual rebuilt as a newspaper word column — ivory page,
// ink typography, one cobalt accent; the headword set as a type specimen the whole
// page serves, the verdict delivered as a typographic stamp, streak as quiet pride.

import { type ReactElement, useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

const KEYS = 'abcde'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Libre+Franklin:ital,wght@0,300..800;1,300..800&display=swap');

.lab12-reset {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  text-align: inherit;
  appearance: none;
  cursor: pointer;
}

.lab12-root {
  --ivory: #faf6ec;
  --ink: #161412;
  --ink-soft: #5c5648;
  --hair: #d8d0bd;
  --accent: #2546d4;
  --accent-soft: #e7ebfb;
  min-height: 100dvh;
  background: var(--ivory);
  color: var(--ink);
  font-family: 'Libre Franklin', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  padding: 0 24px 96px;
}

.lab12-col {
  max-width: 660px;
  margin: 0 auto;
}

/* ---------- masthead ---------- */

.lab12-masthead {
  padding: 28px 0 0;
  text-align: center;
  animation: lab12-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lab12-masthead-rule {
  border: none;
  border-top: 1px solid var(--ink);
  margin: 0;
}

.lab12-masthead-rule--thin {
  border-top-width: 1px;
  border-color: var(--hair);
}

.lab12-masthead-inner {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 2px;
}

.lab12-wordmark {
  font-family: 'Fraunces', serif;
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 0.01em;
}

.lab12-date {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.lab12-streak {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  white-space: nowrap;
}

/* ---------- home ---------- */

.lab12-hero {
  text-align: center;
  padding: 44px 0 36px;
  border-bottom: 1px solid var(--hair);
  animation: lab12-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
}

.lab12-greeting {
  font-family: 'Fraunces', serif;
  font-weight: 350;
  font-size: clamp(30px, 5vw, 40px);
  letter-spacing: -0.01em;
}

.lab12-score-line {
  margin-top: 18px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 14px;
}

.lab12-score {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: clamp(52px, 9vw, 72px);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.lab12-score-cap {
  font-family: 'Fraunces', serif;
  font-weight: 350;
  font-size: 24px;
  color: var(--ink-soft);
}

.lab12-delta {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.lab12-resume {
  display: block;
  width: 100%;
  margin: 28px 0 0;
  padding: 18px 20px;
  border: 1.5px solid var(--ink);
  background: var(--ivory);
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition: background 160ms ease, transform 160ms ease;
  animation: lab12-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 140ms both;
}

.lab12-resume:hover {
  background: var(--accent-soft);
  transform: translateY(-1px);
}

.lab12-resume:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.lab12-resume-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}

.lab12-resume-detail {
  margin-top: 4px;
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 500;
}

.lab12-resume-meta {
  margin-top: 2px;
  font-size: 13px;
  color: var(--ink-soft);
}

.lab12-resume-arrow {
  font-family: 'Fraunces', serif;
  font-size: 26px;
  color: var(--accent);
  flex-shrink: 0;
}

.lab12-section {
  padding: 30px 0 6px;
  animation: lab12-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
}

.lab12-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1px solid var(--ink);
  padding-bottom: 7px;
}

.lab12-section-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.lab12-section-note {
  font-size: 13px;
  color: var(--ink-soft);
}

.lab12-plan-item {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--hair);
  animation: lab12-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lab12-plan-n {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 20px;
  color: var(--accent);
  line-height: 1.3;
}

.lab12-plan-headline {
  font-family: 'Fraunces', serif;
  font-weight: 500;
  font-size: 18px;
  line-height: 1.3;
}

.lab12-plan-rationale {
  margin-top: 3px;
  font-size: 14px;
  color: var(--ink-soft);
}

.lab12-plan-min {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ink-soft);
  white-space: nowrap;
  padding-top: 4px;
}

.lab12-trap {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 14px;
  align-items: baseline;
  padding: 13px 0;
  border-bottom: 1px solid var(--hair);
  animation: lab12-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lab12-trap-section {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--accent);
}

.lab12-trap-headline {
  font-size: 15px;
  line-height: 1.45;
}

.lab12-trap-count {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 16px;
  color: var(--ink-soft);
}

/* ---------- drill ---------- */

.lab12-eyebrow {
  margin-top: 36px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-soft);
  animation: lab12-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both;
}

.lab12-eyebrow em {
  font-style: normal;
  color: var(--ink);
}

.lab12-specimen {
  text-align: center;
  padding: 26px 0 8px;
  animation: lab12-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both;
}

.lab12-headword {
  font-family: 'Fraunces', serif;
  font-weight: 550;
  font-size: clamp(46px, 9vw, 76px);
  line-height: 1.05;
  letter-spacing: -0.015em;
}

.lab12-headword::after {
  content: '';
  display: block;
  width: 64px;
  height: 3px;
  background: var(--accent);
  margin: 18px auto 0;
  animation: lab12-grow 600ms cubic-bezier(0.22, 1, 0.36, 1) 320ms both;
}

.lab12-lede {
  margin-top: 14px;
  font-size: 14px;
  color: var(--ink-soft);
}

.lab12-tactic {
  margin: 26px 0 0;
  padding: 14px 18px;
  border-left: 3px solid var(--accent);
  background: var(--accent-soft);
  animation: lab12-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both;
}

.lab12-tactic-handle {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}

.lab12-tactic-move {
  margin-top: 4px;
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 17px;
  line-height: 1.5;
}

.lab12-options {
  margin: 26px 0 0;
  display: grid;
  gap: 10px;
}

.lab12-option {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 14px 18px;
  border: 1.5px solid var(--hair);
  background: #fffdf7;
  text-align: left;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
  animation: lab12-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lab12-option:hover:enabled {
  border-color: var(--ink);
  transform: translateY(-1px);
}

.lab12-option:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.lab12-option:disabled {
  cursor: default;
}

.lab12-key {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--hair);
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-soft);
  transition: all 140ms ease;
}

.lab12-option-text {
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 450;
}

.lab12-option--correct {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.lab12-option--correct .lab12-key {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--ivory);
}

.lab12-option--wrong {
  border-color: var(--hair);
}

.lab12-option--wrong .lab12-option-text {
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  color: var(--ink-soft);
}

.lab12-option--dim {
  opacity: 0.45;
}

.lab12-verdict {
  text-align: center;
  padding: 30px 0 6px;
}

.lab12-verdict-word {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-weight: 600;
  font-size: clamp(38px, 7vw, 54px);
  line-height: 1;
  display: inline-block;
  animation: lab12-stamp 520ms cubic-bezier(0.2, 1.2, 0.3, 1) both;
}

.lab12-verdict-word--ratt {
  color: var(--accent);
}

.lab12-verdict-sub {
  margin-top: 12px;
  font-size: 15px;
  color: var(--ink-soft);
  animation: lab12-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) 220ms both;
}

.lab12-pedagogy {
  margin-top: 8px;
}

.lab12-solution {
  margin-top: 18px;
  padding: 18px 20px;
  border-top: 2px solid var(--ink);
  border-bottom: 1px solid var(--hair);
  font-family: 'Fraunces', serif;
  font-size: 19px;
  line-height: 1.55;
  animation: lab12-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) 320ms both;
}

.lab12-step {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid var(--hair);
  animation: lab12-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lab12-step-n {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 21px;
  color: var(--accent);
  line-height: 1.25;
}

.lab12-step-title {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 18px;
}

.lab12-step-text {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.65;
  color: #2e2a22;
}

.lab12-distractor {
  padding: 16px 0;
  border-bottom: 1px solid var(--hair);
  animation: lab12-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lab12-distractor-head {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 17px;
}

.lab12-distractor-head s {
  text-decoration-thickness: 1.5px;
}

.lab12-distractor-label {
  font-family: 'Libre Franklin', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 8px 0 2px;
}

.lab12-distractor-body {
  font-size: 14.5px;
  line-height: 1.6;
  color: #2e2a22;
}

.lab12-next {
  display: block;
  margin: 32px auto 0;
  padding: 14px 40px;
  background: var(--ink);
  color: var(--ivory);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: background 140ms ease, transform 140ms ease;
  animation: lab12-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) 700ms both;
}

.lab12-next:hover {
  background: var(--accent);
  transform: translateY(-1px);
}

.lab12-next:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.lab12-hint {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
}

/* ---------- motion ---------- */

@keyframes lab12-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes lab12-stamp {
  0% {
    opacity: 0;
    transform: scale(1.45) rotate(-2deg);
    filter: blur(3px);
  }
  60% {
    opacity: 1;
    transform: scale(0.97) rotate(0.4deg);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes lab12-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lab12-root *,
  .lab12-root *::after {
    animation: none !important;
    transition: none !important;
  }
}

@media (max-width: 480px) {
  .lab12-root {
    padding: 0 16px 72px;
  }
  .lab12-masthead-inner {
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 14px;
  }
}
`

function Masthead(): ReactElement {
  return (
    <header className="lab12-masthead">
      <hr className="lab12-masthead-rule" />
      <div className="lab12-masthead-inner">
        <span className="lab12-wordmark">HP-Coach</span>
        <span className="lab12-date">{HOME.dateLabel}</span>
        <span className="lab12-streak">&#9670; {HOME.streakDays} dagar i rad</span>
      </div>
      <hr className="lab12-masthead-rule lab12-masthead-rule--thin" />
    </header>
  )
}

function Home(): ReactElement {
  return (
    <div className="lab12-col">
      <Masthead />

      <section className="lab12-hero">
        <h1 className="lab12-greeting">{HOME.greeting}.</h1>
        <div className="lab12-score-line">
          <span className="lab12-score">{HOME.projectedScore.replace('.', ',')}</span>
          <span className="lab12-score-cap">/ 2,0 prognos</span>
        </div>
        <p className="lab12-delta">{HOME.scoreDelta}</p>
      </section>

      <button type="button" className="lab12-reset lab12-resume">
        <span>
          <span className="lab12-resume-kicker">Fortsätt där du var</span>
          <span className="lab12-resume-detail" style={{ display: 'block' }}>
            {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
            {HOME.resume.total}
          </span>
          <span className="lab12-resume-meta" style={{ display: 'block' }}>
            Pausad på {HOME.resume.device} kl {HOME.resume.when}
          </span>
        </span>
        <span className="lab12-resume-arrow">&rarr;</span>
      </button>

      <section className="lab12-section">
        <div className="lab12-section-head">
          <h2 className="lab12-section-title">Dagens plan</h2>
          <span className="lab12-section-note">ca {HOME.estimatedMinutes} min</span>
        </div>
        {HOME.plan.map((item, i) => (
          <div
            key={item.id}
            className="lab12-plan-item"
            style={{ animationDelay: `${260 + i * 90}ms` }}
          >
            <span className="lab12-plan-n">{i + 1}.</span>
            <span>
              <span className="lab12-plan-headline" style={{ display: 'block' }}>
                {item.headline}
              </span>
              <span className="lab12-plan-rationale" style={{ display: 'block' }}>
                {item.rationale}
              </span>
            </span>
            <span className="lab12-plan-min">{item.minutes} min</span>
          </div>
        ))}
      </section>

      <section className="lab12-section" style={{ animationDelay: '320ms' }}>
        <div className="lab12-section-head">
          <h2 className="lab12-section-title">Dina fällor</h2>
          <span className="lab12-section-note">senaste veckan</span>
        </div>
        {HOME.traps.map((trap, i) => (
          <div key={trap.id} className="lab12-trap" style={{ animationDelay: `${420 + i * 90}ms` }}>
            <span className="lab12-trap-section">{trap.section}</span>
            <span className="lab12-trap-headline">{trap.headline}</span>
            <span className="lab12-trap-count">&times;{trap.count}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

function Drill(): ReactElement {
  const [picked, setPicked] = useState<string | null>(null)
  const graded = picked !== null
  const correct = picked === QUESTION.answer

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (picked === null) {
        const idx = KEYS.indexOf(key)
        if (idx >= 0 && idx < QUESTION.options.length) {
          setPicked(QUESTION.options[idx].letter)
        }
      } else if (e.key === 'Enter') {
        setPicked(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked])

  return (
    <div className="lab12-col">
      <Masthead />

      <p className="lab12-eyebrow">
        <em>{QUESTION.section}</em> &middot; {QUESTION.sectionLabel} &middot; Fråga{' '}
        {QUESTION.number} av {QUESTION.total}
      </p>

      <div className="lab12-specimen">
        <h1 className="lab12-headword">{QUESTION.prompt}</h1>
        <p className="lab12-lede">Vilket alternativ ligger närmast i betydelse?</p>
      </div>

      <aside className="lab12-tactic">
        <p className="lab12-tactic-handle">Taktik &middot; {EXPLANATION.pregradeTactic.handle}</p>
        <p className="lab12-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
      </aside>

      <div className="lab12-options">
        {QUESTION.options.map((opt, i) => {
          const isCorrect = opt.letter === QUESTION.answer
          const isPicked = opt.letter === picked
          let cls = 'lab12-reset lab12-option'
          if (graded) {
            if (isCorrect) cls += ' lab12-option--correct'
            else if (isPicked) cls += ' lab12-option--wrong'
            else cls += ' lab12-option--dim'
          }
          return (
            <button
              key={opt.letter}
              type="button"
              className={cls}
              disabled={graded}
              onClick={() => setPicked(opt.letter)}
              style={{ animationDelay: `${240 + i * 60}ms` }}
            >
              <span className="lab12-key">{opt.letter.toLowerCase()}</span>
              <span className="lab12-option-text">{opt.text}</span>
            </button>
          )
        })}
      </div>

      {!graded && <p className="lab12-hint">Tryck a&ndash;e för att svara</p>}

      {graded && (
        <>
          <div className="lab12-verdict">
            <span className={`lab12-verdict-word${correct ? ' lab12-verdict-word--ratt' : ''}`}>
              {correct ? 'Rätt.' : 'Fel.'}
            </span>
            <p className="lab12-verdict-sub">
              {correct
                ? 'Snyggt — taktiken höll hela vägen.'
                : `Rätt svar är ${QUESTION.answer.toLowerCase()}) vilja ha. Häng med i varför.`}
            </p>
          </div>

          <div className="lab12-pedagogy">
            <p className="lab12-solution">{EXPLANATION.solution}</p>

            {EXPLANATION.steps.map((step, i) => (
              <div
                key={step.n}
                className="lab12-step"
                style={{ animationDelay: `${420 + i * 110}ms` }}
              >
                <span className="lab12-step-n">{step.n}.</span>
                <div>
                  <h3 className="lab12-step-title">{step.title}</h3>
                  <p className="lab12-step-text">{step.text}</p>
                </div>
              </div>
            ))}

            <div className="lab12-section-head" style={{ marginTop: 28 }}>
              <h2 className="lab12-section-title">Varför de andra lockar</h2>
            </div>
            {EXPLANATION.distractors.map((d, i) => (
              <div
                key={d.letter}
                className="lab12-distractor"
                style={{ animationDelay: `${560 + i * 110}ms` }}
              >
                <p className="lab12-distractor-head">
                  {d.letter.toLowerCase()}) <s>{d.text}</s>
                </p>
                <p className="lab12-distractor-label">Varför det lockar</p>
                <p className="lab12-distractor-body">{d.whyTempting}</p>
                <p className="lab12-distractor-label">Varför det är fel</p>
                <p className="lab12-distractor-body">{d.whyWrong}</p>
              </div>
            ))}

            <button
              type="button"
              className="lab12-reset lab12-next"
              onClick={() => setPicked(null)}
            >
              Nästa fråga
            </button>
            <p className="lab12-hint">eller tryck Enter</p>
          </div>
        </>
      )}
    </div>
  )
}

export function Lab12({ screen }: { screen: RedesignScreen }): ReactElement {
  return (
    <div className="lab12-root">
      <style>{CSS}</style>
      {screen === 'home' ? <Home /> : <Drill />}
    </div>
  )
}
