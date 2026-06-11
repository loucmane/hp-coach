// L12 round 6 — M1 "Trogen" (faithful)
// A 1:1 port of Lab12 ("Dagens Spalt") to the product token system.
// Composition, choreography and copy are kept as-is; every hardcoded
// color and font family is rebound to the live theme variables so the
// design responds to the palette + dark-mode switchers:
//   ivory page        → var(--bg) / var(--panel)
//   cobalt accent     → var(--accent) (+ var(--accent-soft) tints)
//   Fraunces serif    → var(--font-display)
//   Libre Franklin    → var(--font-ui)
//   correct / wrong   → var(--ok)/var(--ok-soft) / var(--bad)/var(--bad-soft)

import { type ReactElement, useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

const KEYS = 'abcde'

const CSS = `
.m1-reset {
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

.m1-root {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  letter-spacing: var(--font-ui-track);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  padding: 0 24px 96px;
}

.m1-col {
  max-width: 660px;
  margin: 0 auto;
}

/* ---------- masthead ---------- */

.m1-masthead {
  padding: 28px 0 0;
  text-align: center;
  animation: m1-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m1-masthead-rule {
  border: none;
  border-top: 1px solid var(--ink);
  margin: 0;
}

.m1-masthead-rule--thin {
  border-top-width: 1px;
  border-color: var(--hairline);
}

.m1-masthead-inner {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 2px;
}

.m1-wordmark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.01em;
}

.m1-date {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.m1-streak {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  white-space: nowrap;
}

/* ---------- home ---------- */

.m1-hero {
  text-align: center;
  padding: 44px 0 36px;
  border-bottom: 1px solid var(--hairline);
  animation: m1-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
}

.m1-greeting {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(30px, 5vw, 40px);
  letter-spacing: var(--font-display-track);
}

.m1-score-line {
  margin-top: 18px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 14px;
}

.m1-score {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(52px, 9vw, 72px);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.m1-score-cap {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 24px;
  color: var(--muted);
}

.m1-delta {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.m1-resume {
  width: 100%;
  margin: 28px 0 0;
  padding: 18px 20px;
  border: 1.5px solid var(--ink);
  background: var(--panel);
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition: background 160ms ease, transform 160ms ease;
  animation: m1-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 140ms both;
}

.m1-resume:hover {
  background: var(--accent-soft);
  transform: translateY(-1px);
}

.m1-resume:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.m1-resume-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}

.m1-resume-detail {
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 500;
}

.m1-resume-meta {
  margin-top: 2px;
  font-size: 13px;
  color: var(--muted);
}

.m1-resume-arrow {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--accent);
  flex-shrink: 0;
}

.m1-section {
  padding: 30px 0 6px;
  animation: m1-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
}

.m1-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1px solid var(--ink);
  padding-bottom: 7px;
}

.m1-section-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.m1-section-note {
  font-size: 13px;
  color: var(--muted);
}

.m1-plan-item {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m1-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m1-plan-n {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 20px;
  color: var(--accent);
  line-height: 1.3;
}

.m1-plan-headline {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 18px;
  line-height: 1.3;
}

.m1-plan-rationale {
  margin-top: 3px;
  font-size: 14px;
  color: var(--muted);
}

.m1-plan-min {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  white-space: nowrap;
  padding-top: 4px;
}

.m1-trap {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 14px;
  align-items: baseline;
  padding: 13px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m1-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m1-trap-section {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--accent);
}

.m1-trap-headline {
  font-size: 15px;
  line-height: 1.45;
}

.m1-trap-count {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 16px;
  color: var(--muted);
}

/* ---------- drill ---------- */

.m1-eyebrow {
  margin-top: 36px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
  animation: m1-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both;
}

.m1-eyebrow em {
  font-style: normal;
  color: var(--ink);
}

.m1-specimen {
  text-align: center;
  padding: 26px 0 8px;
  animation: m1-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both;
}

.m1-headword {
  font-family: var(--font-display);
  font-weight: var(--font-display-w);
  font-size: clamp(46px, 9vw, 76px);
  line-height: 1.05;
  letter-spacing: var(--font-display-track);
}

.m1-headword::after {
  content: '';
  display: block;
  width: 64px;
  height: 3px;
  background: var(--accent);
  margin: 18px auto 0;
  animation: m1-grow 600ms cubic-bezier(0.22, 1, 0.36, 1) 320ms both;
}

.m1-lede {
  margin-top: 14px;
  font-size: 14px;
  color: var(--muted);
}

.m1-tactic {
  margin: 26px 0 0;
  padding: 14px 18px;
  border-left: 3px solid var(--accent);
  background: var(--accent-soft);
  animation: m1-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both;
}

.m1-tactic-handle {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}

.m1-tactic-move {
  margin-top: 4px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  line-height: 1.5;
}

.m1-options {
  margin: 26px 0 0;
  display: grid;
  gap: 10px;
}

.m1-option {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 14px 18px;
  border: 1.5px solid var(--hairline);
  background: var(--panel);
  text-align: left;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
  animation: m1-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m1-option:hover:enabled {
  border-color: var(--ink);
  transform: translateY(-1px);
}

.m1-option:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.m1-option:disabled {
  cursor: default;
}

.m1-key {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--hairline);
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  transition: all 140ms ease;
}

.m1-option-text {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 450;
}

.m1-option--correct {
  border-color: var(--ok);
  background: var(--ok-soft);
}

.m1-option--correct .m1-key {
  background: var(--ok);
  border-color: var(--ok);
  color: var(--bg);
}

.m1-option--wrong {
  border-color: var(--bad);
  background: var(--bad-soft);
}

.m1-option--wrong .m1-key {
  border-color: var(--bad);
  color: var(--bad);
}

.m1-option--wrong .m1-option-text {
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  color: var(--ink-2);
}

.m1-option--dim {
  opacity: 0.45;
}

.m1-verdict {
  text-align: center;
  padding: 30px 0 6px;
}

.m1-verdict-word {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: clamp(38px, 7vw, 54px);
  line-height: 1;
  display: inline-block;
  animation: m1-stamp 520ms cubic-bezier(0.2, 1.2, 0.3, 1) both;
}

.m1-verdict-word--ratt {
  color: var(--ok);
}

.m1-verdict-word--fel {
  color: var(--bad);
}

.m1-verdict-sub {
  margin-top: 12px;
  font-size: 15px;
  color: var(--muted);
  animation: m1-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) 220ms both;
}

.m1-pedagogy {
  margin-top: 8px;
}

.m1-solution {
  margin-top: 18px;
  padding: 18px 20px;
  border-top: 2px solid var(--ink);
  border-bottom: 1px solid var(--hairline);
  font-family: var(--font-display);
  font-size: 19px;
  line-height: 1.55;
  animation: m1-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) 320ms both;
}

.m1-step {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m1-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m1-step-n {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 21px;
  color: var(--accent);
  line-height: 1.25;
}

.m1-step-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
}

.m1-step-text {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink-2);
}

.m1-distractor {
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m1-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m1-distractor-head {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
}

.m1-distractor-head s {
  text-decoration-thickness: 1.5px;
}

.m1-distractor-label {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 8px 0 2px;
}

.m1-distractor-body {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink-2);
}

.m1-next {
  display: block;
  margin: 32px auto 0;
  padding: 14px 40px;
  background: var(--ink);
  color: var(--bg);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: background 140ms ease, transform 140ms ease;
  animation: m1-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) 700ms both;
}

.m1-next:hover {
  background: var(--accent);
  color: var(--accent-ink);
  transform: translateY(-1px);
}

.m1-next:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.m1-hint {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

/* ---------- motion ---------- */

@keyframes m1-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes m1-stamp {
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

@keyframes m1-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m1-root *,
  .m1-root *::after {
    animation: none !important;
    transition: none !important;
  }
}

@media (max-width: 480px) {
  .m1-root {
    padding: 0 16px 72px;
  }
  .m1-masthead-inner {
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 14px;
  }
}
`

function Masthead(): ReactElement {
  return (
    <header className="m1-masthead">
      <hr className="m1-masthead-rule" />
      <div className="m1-masthead-inner">
        <span className="m1-wordmark">HP-Coach</span>
        <span className="m1-date">{HOME.dateLabel}</span>
        <span className="m1-streak">&#9670; {HOME.streakDays} dagar i rad</span>
      </div>
      <hr className="m1-masthead-rule m1-masthead-rule--thin" />
    </header>
  )
}

function Home(): ReactElement {
  return (
    <div className="m1-col">
      <Masthead />

      <section className="m1-hero">
        <h1 className="m1-greeting">{HOME.greeting}.</h1>
        <div className="m1-score-line">
          <span className="m1-score">{HOME.projectedScore.replace('.', ',')}</span>
          <span className="m1-score-cap">/ 2,0 prognos</span>
        </div>
        <p className="m1-delta">{HOME.scoreDelta}</p>
      </section>

      <button type="button" className="m1-reset m1-resume">
        <span>
          <span className="m1-resume-kicker">Fortsätt där du var</span>
          <span className="m1-resume-detail" style={{ display: 'block' }}>
            {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
            {HOME.resume.total}
          </span>
          <span className="m1-resume-meta" style={{ display: 'block' }}>
            Pausad på {HOME.resume.device} kl {HOME.resume.when}
          </span>
        </span>
        <span className="m1-resume-arrow">&rarr;</span>
      </button>

      <section className="m1-section">
        <div className="m1-section-head">
          <h2 className="m1-section-title">Dagens plan</h2>
          <span className="m1-section-note">ca {HOME.estimatedMinutes} min</span>
        </div>
        {HOME.plan.map((item, i) => (
          <div
            key={item.id}
            className="m1-plan-item"
            style={{ animationDelay: `${260 + i * 90}ms` }}
          >
            <span className="m1-plan-n">{i + 1}.</span>
            <span>
              <span className="m1-plan-headline" style={{ display: 'block' }}>
                {item.headline}
              </span>
              <span className="m1-plan-rationale" style={{ display: 'block' }}>
                {item.rationale}
              </span>
            </span>
            <span className="m1-plan-min">{item.minutes} min</span>
          </div>
        ))}
      </section>

      <section className="m1-section" style={{ animationDelay: '320ms' }}>
        <div className="m1-section-head">
          <h2 className="m1-section-title">Dina fällor</h2>
          <span className="m1-section-note">senaste veckan</span>
        </div>
        {HOME.traps.map((trap, i) => (
          <div key={trap.id} className="m1-trap" style={{ animationDelay: `${420 + i * 90}ms` }}>
            <span className="m1-trap-section">{trap.section}</span>
            <span className="m1-trap-headline">{trap.headline}</span>
            <span className="m1-trap-count">&times;{trap.count}</span>
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
    <div className="m1-col">
      <Masthead />

      <p className="m1-eyebrow">
        <em>{QUESTION.section}</em> &middot; {QUESTION.sectionLabel} &middot; Fråga{' '}
        {QUESTION.number} av {QUESTION.total}
      </p>

      <div className="m1-specimen">
        <h1 className="m1-headword">{QUESTION.prompt}</h1>
        <p className="m1-lede">Vilket alternativ ligger närmast i betydelse?</p>
      </div>

      <aside className="m1-tactic">
        <p className="m1-tactic-handle">Taktik &middot; {EXPLANATION.pregradeTactic.handle}</p>
        <p className="m1-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
      </aside>

      <div className="m1-options">
        {QUESTION.options.map((opt, i) => {
          const isCorrect = opt.letter === QUESTION.answer
          const isPicked = opt.letter === picked
          let cls = 'm1-reset m1-option'
          if (graded) {
            if (isCorrect) cls += ' m1-option--correct'
            else if (isPicked) cls += ' m1-option--wrong'
            else cls += ' m1-option--dim'
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
              <span className="m1-key">{opt.letter.toLowerCase()}</span>
              <span className="m1-option-text">{opt.text}</span>
            </button>
          )
        })}
      </div>

      {!graded && <p className="m1-hint">Tryck a&ndash;e för att svara</p>}

      {graded && (
        <>
          <div className="m1-verdict">
            <span
              className={`m1-verdict-word ${correct ? 'm1-verdict-word--ratt' : 'm1-verdict-word--fel'}`}
            >
              {correct ? 'Rätt.' : 'Fel.'}
            </span>
            <p className="m1-verdict-sub">
              {correct
                ? 'Snyggt — taktiken höll hela vägen.'
                : `Rätt svar är ${QUESTION.answer.toLowerCase()}) vilja ha. Häng med i varför.`}
            </p>
          </div>

          <div className="m1-pedagogy">
            <p className="m1-solution">{EXPLANATION.solution}</p>

            {EXPLANATION.steps.map((step, i) => (
              <div
                key={step.n}
                className="m1-step"
                style={{ animationDelay: `${420 + i * 110}ms` }}
              >
                <span className="m1-step-n">{step.n}.</span>
                <div>
                  <h3 className="m1-step-title">{step.title}</h3>
                  <p className="m1-step-text">{step.text}</p>
                </div>
              </div>
            ))}

            <div className="m1-section-head" style={{ marginTop: 28 }}>
              <h2 className="m1-section-title">Varför de andra lockar</h2>
            </div>
            {EXPLANATION.distractors.map((d, i) => (
              <div
                key={d.letter}
                className="m1-distractor"
                style={{ animationDelay: `${560 + i * 110}ms` }}
              >
                <p className="m1-distractor-head">
                  {d.letter.toLowerCase()}) <s>{d.text}</s>
                </p>
                <p className="m1-distractor-label">Varför det lockar</p>
                <p className="m1-distractor-body">{d.whyTempting}</p>
                <p className="m1-distractor-label">Varför det är fel</p>
                <p className="m1-distractor-body">{d.whyWrong}</p>
              </div>
            ))}

            <button type="button" className="m1-reset m1-next" onClick={() => setPicked(null)}>
              Nästa fråga
            </button>
            <p className="m1-hint">eller tryck Enter</p>
          </div>
        </>
      )}
    </div>
  )
}

export function M1({ screen }: { screen: RedesignScreen }): ReactElement {
  return (
    <div className="m1-root">
      <style>{CSS}</style>
      {screen === 'home' ? <Home /> : <Drill />}
    </div>
  )
}
