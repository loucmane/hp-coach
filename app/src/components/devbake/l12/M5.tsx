// M5 — "Kvällsutgåvan" (the evening edition)
// L12 recomposed dark-first: the daily column reset as an evening paper.
// Ink-dark page built from layered night surfaces (--bg → --panel → --panel-2),
// hairlines kept visible but quiet, serif display set a touch lighter so the
// strokes survive on dark, and the accent used like a single desk lamp —
// a warm pool of light on the tactic, the resume card, and the verdict.
// One set of token-bound CSS; dark is the primary art direction, light stays correct.

import { type ReactElement, useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

const KEYS = 'abcde'

const CSS = `
.m5-reset {
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

.m5-root {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui), system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  padding: 0 24px 96px;
}

.m5-col {
  max-width: 680px;
  margin: 0 auto;
}

/* ---------- masthead: the evening banner ---------- */

.m5-masthead {
  padding: 26px 0 0;
  animation: m5-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m5-masthead-rule {
  border: none;
  border-top: 1px solid var(--ink-2);
  margin: 0;
}

.m5-masthead-rule--thin {
  border-top-color: var(--hairline);
}

.m5-masthead-inner {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 2px;
}

.m5-wordmark {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 600;
  font-size: 17px;
  letter-spacing: 0.01em;
}

.m5-edition {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}

.m5-streak {
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--accent);
  white-space: nowrap;
}

/* ---------- home ---------- */

.m5-hero {
  text-align: center;
  padding: 46px 0 38px;
  border-bottom: 1px solid var(--hairline);
  animation: m5-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
}

.m5-greeting {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 400;
  font-style: italic;
  font-size: clamp(30px, 5vw, 42px);
  letter-spacing: -0.005em;
  color: var(--ink);
}

.m5-score-line {
  margin-top: 20px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 14px;
}

.m5-score {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 500;
  font-size: clamp(54px, 9vw, 74px);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.m5-score-cap {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 400;
  font-size: 23px;
  color: var(--muted);
}

.m5-delta {
  margin-top: 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}

/* The resume card is the lamp on the desk: a raised night surface with a
   faint warm halo derived from the accent — no black drop shadows. */
.m5-resume {
  display: flex;
  width: 100%;
  margin: 30px 0 0;
  padding: 18px 22px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--panel);
  border: 1px solid var(--hairline-2);
  border-radius: 2px;
  box-shadow: 0 0 0 1px color-mix(in oklch, var(--accent) 10%, transparent),
    0 0 28px color-mix(in oklch, var(--accent) 8%, transparent);
  transition: box-shadow 180ms ease, border-color 180ms ease, transform 180ms ease;
  animation: m5-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 140ms both;
}

.m5-resume:hover {
  border-color: color-mix(in oklch, var(--accent) 45%, var(--hairline-2));
  box-shadow: 0 0 0 1px color-mix(in oklch, var(--accent) 22%, transparent),
    0 0 36px color-mix(in oklch, var(--accent) 14%, transparent);
  transform: translateY(-1px);
}

.m5-resume:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.m5-resume-kicker {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}

.m5-resume-detail {
  display: block;
  margin-top: 5px;
  font-family: var(--font-display), Georgia, serif;
  font-size: 18px;
  font-weight: 500;
}

.m5-resume-meta {
  display: block;
  margin-top: 2px;
  font-size: 13px;
  color: var(--muted);
}

.m5-resume-arrow {
  font-family: var(--font-display), Georgia, serif;
  font-size: 26px;
  color: var(--accent);
  flex-shrink: 0;
}

.m5-section {
  padding: 32px 0 6px;
  animation: m5-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
}

.m5-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1px solid var(--ink-2);
  padding-bottom: 7px;
}

.m5-section-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink);
}

.m5-section-note {
  font-size: 13px;
  color: var(--muted);
}

.m5-plan-item {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m5-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m5-plan-n {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 500;
  font-size: 20px;
  color: var(--accent);
  line-height: 1.3;
}

.m5-plan-headline {
  display: block;
  font-family: var(--font-display), Georgia, serif;
  font-weight: 500;
  font-size: 18px;
  line-height: 1.3;
}

.m5-plan-rationale {
  display: block;
  margin-top: 3px;
  font-size: 14px;
  color: var(--muted);
}

.m5-plan-min {
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  white-space: nowrap;
  padding-top: 5px;
}

.m5-trap {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 14px;
  align-items: baseline;
  padding: 13px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m5-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m5-trap-section {
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--accent);
}

.m5-trap-headline {
  font-size: 15px;
  line-height: 1.45;
  color: var(--ink-2);
}

.m5-trap-count {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 500;
  font-size: 16px;
  color: var(--muted);
}

/* ---------- drill ---------- */

.m5-eyebrow {
  margin-top: 36px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
  animation: m5-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both;
}

.m5-eyebrow em {
  font-style: normal;
  color: var(--ink);
}

/* The specimen stays centered: on a dark page the headword reads as the
   pool of light the whole evening session gathers around. */
.m5-specimen {
  text-align: center;
  padding: 28px 0 8px;
  animation: m5-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both;
}

.m5-headword {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 450;
  font-size: clamp(46px, 9vw, 74px);
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.m5-headword::after {
  content: '';
  display: block;
  width: 64px;
  height: 2px;
  background: var(--accent);
  box-shadow: 0 0 14px color-mix(in oklch, var(--accent) 35%, transparent);
  margin: 18px auto 0;
  animation: m5-grow 600ms cubic-bezier(0.22, 1, 0.36, 1) 320ms both;
}

.m5-lede {
  margin-top: 14px;
  font-size: 14px;
  color: var(--muted);
}

/* Tactic block = the desk lamp itself: accent-soft inset on a panel surface. */
.m5-tactic {
  margin: 28px 0 0;
  padding: 15px 20px;
  border-left: 2px solid var(--accent);
  background: var(--accent-soft);
  border-radius: 0 2px 2px 0;
  animation: m5-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both;
}

.m5-tactic-handle {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}

.m5-tactic-move {
  margin-top: 5px;
  font-family: var(--font-display), Georgia, serif;
  font-style: italic;
  font-size: 17px;
  line-height: 1.5;
  color: var(--ink);
}

.m5-options {
  margin: 28px 0 0;
  display: grid;
  gap: 10px;
}

/* Options are raised night surfaces — panel on bg, hairline-edged, no shadow. */
.m5-option {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 14px 18px;
  border: 1px solid var(--hairline-2);
  background: var(--panel);
  border-radius: 2px;
  text-align: left;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
  animation: m5-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m5-option:hover:enabled {
  border-color: var(--ink-2);
  background: var(--panel-2);
  transform: translateY(-1px);
}

.m5-option:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.m5-option:disabled {
  cursor: default;
}

.m5-key {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--hairline-2);
  border-radius: 50%;
  font-family: var(--font-mono), monospace;
  font-size: 13px;
  color: var(--muted);
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.m5-option-text {
  font-family: var(--font-display), Georgia, serif;
  font-size: 19px;
  font-weight: 450;
}

.m5-option--correct {
  border-color: color-mix(in oklch, var(--ok) 55%, var(--hairline-2));
  background: var(--ok-soft);
  box-shadow: 0 0 22px color-mix(in oklch, var(--ok) 10%, transparent);
}

.m5-option--correct .m5-key {
  background: var(--ok);
  border-color: var(--ok);
  color: var(--bg);
}

.m5-option--wrong {
  border-color: color-mix(in oklch, var(--bad) 45%, var(--hairline-2));
  background: var(--bad-soft);
}

.m5-option--wrong .m5-key {
  border-color: color-mix(in oklch, var(--bad) 55%, var(--hairline-2));
  color: var(--bad);
}

.m5-option--wrong .m5-option-text {
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  color: var(--muted);
}

.m5-option--dim {
  opacity: 0.4;
}

/* ---------- verdict: kept calm, typeset, italic ---------- */

.m5-verdict {
  text-align: center;
  padding: 32px 0 6px;
}

.m5-verdict-word {
  font-family: var(--font-display), Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: clamp(38px, 7vw, 52px);
  line-height: 1;
  display: inline-block;
  animation: m5-settle 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m5-verdict-word--ratt {
  color: var(--ok);
  text-shadow: 0 0 32px color-mix(in oklch, var(--ok) 22%, transparent);
}

.m5-verdict-word--fel {
  color: var(--bad);
}

.m5-verdict-sub {
  margin-top: 12px;
  font-size: 15px;
  color: var(--ink-2);
  animation: m5-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
}

/* ---------- pedagogy: the book page ---------- */

.m5-pedagogy {
  margin-top: 10px;
}

.m5-solution {
  margin-top: 18px;
  padding: 18px 22px;
  border-top: 2px solid var(--ink-2);
  border-bottom: 1px solid var(--hairline);
  background: var(--panel);
  font-family: var(--font-display), Georgia, serif;
  font-size: 19px;
  line-height: 1.55;
  animation: m5-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) 300ms both;
}

.m5-step {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m5-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m5-step-n {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 500;
  font-size: 21px;
  color: var(--accent);
  line-height: 1.25;
}

.m5-step-title {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 600;
  font-size: 18px;
  color: var(--ink);
}

.m5-step-text {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink-2);
}

.m5-distractor {
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m5-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m5-distractor-head {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 600;
  font-size: 17px;
  color: var(--ink);
}

.m5-distractor-head s {
  text-decoration-thickness: 1.5px;
  color: var(--ink-2);
}

.m5-distractor-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 8px 0 2px;
}

.m5-distractor-body {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink-2);
}

.m5-next {
  display: block;
  margin: 34px auto 0;
  padding: 14px 42px;
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: 2px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  box-shadow: 0 0 26px color-mix(in oklch, var(--accent) 14%, transparent);
  transition: box-shadow 160ms ease, transform 160ms ease, filter 160ms ease;
  animation: m5-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) 640ms both;
}

.m5-next:hover {
  box-shadow: 0 0 34px color-mix(in oklch, var(--accent) 24%, transparent);
  transform: translateY(-1px);
}

.m5-next:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.m5-hint {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--muted-2);
}

/* ---------- motion ---------- */

@keyframes m5-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes m5-settle {
  from {
    opacity: 0;
    transform: translateY(6px) scale(1.04);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes m5-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m5-root *,
  .m5-root *::after {
    animation: none !important;
    transition: none !important;
  }
}

@media (max-width: 480px) {
  .m5-root {
    padding: 0 16px 72px;
  }
  .m5-masthead-inner {
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 14px;
  }
}
`

function Masthead(): ReactElement {
  return (
    <header className="m5-masthead">
      <hr className="m5-masthead-rule" />
      <div className="m5-masthead-inner">
        <span className="m5-wordmark">HP-Coach</span>
        <span className="m5-edition">Kvällsutgåvan &middot; {HOME.dateLabel}</span>
        <span className="m5-streak">&#9670; {HOME.streakDays} dagar i rad</span>
      </div>
      <hr className="m5-masthead-rule m5-masthead-rule--thin" />
    </header>
  )
}

function Home(): ReactElement {
  return (
    <div className="m5-col">
      <Masthead />

      <section className="m5-hero">
        <h1 className="m5-greeting">God kväll.</h1>
        <div className="m5-score-line">
          <span className="m5-score">{HOME.projectedScore.replace('.', ',')}</span>
          <span className="m5-score-cap">/ 2,0 prognos</span>
        </div>
        <p className="m5-delta">{HOME.scoreDelta}</p>
      </section>

      <button type="button" className="m5-reset m5-resume">
        <span>
          <span className="m5-resume-kicker">Fortsätt där du var</span>
          <span className="m5-resume-detail">
            {HOME.resume.kind} &middot; {HOME.resume.section} &middot; fråga {HOME.resume.position}{' '}
            av {HOME.resume.total}
          </span>
          <span className="m5-resume-meta">
            Pausad på {HOME.resume.device} kl {HOME.resume.when}
          </span>
        </span>
        <span className="m5-resume-arrow">&rarr;</span>
      </button>

      <section className="m5-section">
        <div className="m5-section-head">
          <h2 className="m5-section-title">Kvällens plan</h2>
          <span className="m5-section-note">ca {HOME.estimatedMinutes} min</span>
        </div>
        {HOME.plan.map((item, i) => (
          <div
            key={item.id}
            className="m5-plan-item"
            style={{ animationDelay: `${260 + i * 90}ms` }}
          >
            <span className="m5-plan-n">{i + 1}.</span>
            <span>
              <span className="m5-plan-headline">{item.headline}</span>
              <span className="m5-plan-rationale">{item.rationale}</span>
            </span>
            <span className="m5-plan-min">{item.minutes} min</span>
          </div>
        ))}
      </section>

      <section className="m5-section" style={{ animationDelay: '320ms' }}>
        <div className="m5-section-head">
          <h2 className="m5-section-title">Dina fällor</h2>
          <span className="m5-section-note">senaste veckan</span>
        </div>
        {HOME.traps.map((trap, i) => (
          <div key={trap.id} className="m5-trap" style={{ animationDelay: `${420 + i * 90}ms` }}>
            <span className="m5-trap-section">{trap.section}</span>
            <span className="m5-trap-headline">{trap.headline}</span>
            <span className="m5-trap-count">&times;{trap.count}</span>
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
    <div className="m5-col">
      <Masthead />

      <p className="m5-eyebrow">
        <em>{QUESTION.section}</em> &middot; {QUESTION.sectionLabel} &middot; Fråga{' '}
        {QUESTION.number} av {QUESTION.total}
      </p>

      <div className="m5-specimen">
        <h1 className="m5-headword">{QUESTION.prompt}</h1>
        <p className="m5-lede">Vilket alternativ ligger närmast i betydelse?</p>
      </div>

      <aside className="m5-tactic">
        <p className="m5-tactic-handle">Taktik &middot; {EXPLANATION.pregradeTactic.handle}</p>
        <p className="m5-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
      </aside>

      <div className="m5-options">
        {QUESTION.options.map((opt, i) => {
          const isCorrect = opt.letter === QUESTION.answer
          const isPicked = opt.letter === picked
          let cls = 'm5-reset m5-option'
          if (graded) {
            if (isCorrect) cls += ' m5-option--correct'
            else if (isPicked) cls += ' m5-option--wrong'
            else cls += ' m5-option--dim'
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
              <span className="m5-key">{opt.letter.toLowerCase()}</span>
              <span className="m5-option-text">{opt.text}</span>
            </button>
          )
        })}
      </div>

      {!graded && <p className="m5-hint">Tryck a&ndash;e för att svara</p>}

      {graded && (
        <>
          <div className="m5-verdict">
            <span
              className={`m5-verdict-word ${correct ? 'm5-verdict-word--ratt' : 'm5-verdict-word--fel'}`}
            >
              {correct ? 'Rätt.' : 'Fel.'}
            </span>
            <p className="m5-verdict-sub">
              {correct
                ? 'Snyggt — taktiken höll hela vägen.'
                : `Rätt svar är ${QUESTION.answer.toLowerCase()}) vilja ha. Häng med i varför.`}
            </p>
          </div>

          <div className="m5-pedagogy">
            <p className="m5-solution">{EXPLANATION.solution}</p>

            {EXPLANATION.steps.map((step, i) => (
              <div
                key={step.n}
                className="m5-step"
                style={{ animationDelay: `${400 + i * 110}ms` }}
              >
                <span className="m5-step-n">{step.n}.</span>
                <div>
                  <h3 className="m5-step-title">{step.title}</h3>
                  <p className="m5-step-text">{step.text}</p>
                </div>
              </div>
            ))}

            <div className="m5-section-head" style={{ marginTop: 28 }}>
              <h2 className="m5-section-title">Varför de andra lockar</h2>
            </div>
            {EXPLANATION.distractors.map((d, i) => (
              <div
                key={d.letter}
                className="m5-distractor"
                style={{ animationDelay: `${540 + i * 110}ms` }}
              >
                <p className="m5-distractor-head">
                  {d.letter.toLowerCase()}) <s>{d.text}</s>
                </p>
                <p className="m5-distractor-label">Varför det lockar</p>
                <p className="m5-distractor-body">{d.whyTempting}</p>
                <p className="m5-distractor-label">Varför det är fel</p>
                <p className="m5-distractor-body">{d.whyWrong}</p>
              </div>
            ))}

            <button type="button" className="m5-reset m5-next" onClick={() => setPicked(null)}>
              Nästa fråga
            </button>
            <p className="m5-hint">eller tryck Enter</p>
          </div>
        </>
      )}
    </div>
  )
}

export function M5({ screen }: { screen: RedesignScreen }): ReactElement {
  return (
    <div className="m5-root">
      <style>{CSS}</style>
      {screen === 'home' ? <Home /> : <Drill />}
    </div>
  )
}
