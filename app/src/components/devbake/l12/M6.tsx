// Round 6 / M6 — "Söndagsbilagan" (the Sunday supplement)
// L12 derivative: escalate the TYPOGRAPHY, never the props.
// Escalations chosen: true drop cap on the solution; pull-quote setting for the
// pregrade tactic; hanging serif numerals in the margin for steps; old-style
// figures for every statistic; two-column distractor analyses with a hairline
// column rule; a discreet running head/folio line; optical-size contrast
// (large light Newsreader display vs dense text serif); richer italics.
// The verdict stays L12's typeset italic "Rätt." — its entrance is ink settling
// on the page: a quiet fade-and-settle plus a hairline rule drawing beneath it.

import { type ReactElement, useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

const KEYS = 'abcde'

const CSS = `
.m6-reset {
  margin: 0;
  padding: 0;
  border: none;
  min-inline-size: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: inherit;
  appearance: none;
  cursor: pointer;
}

.m6-root {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-size: 17px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  padding: 0 32px 120px;
}

.m6-page {
  max-width: 680px;
  margin: 0 auto;
}

.m6-osf {
  font-variant-numeric: oldstyle-nums proportional-nums;
}

/* ---------- running head / folio ---------- */

.m6-runninghead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 0 10px;
  border-bottom: 1px solid var(--ink);
  animation: m6-settle 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m6-runninghead-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.01em;
}

.m6-runninghead-mid {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}

.m6-runninghead-folio {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--ink-2);
  white-space: nowrap;
}

.m6-runninghead-folio em {
  font-style: italic;
  color: var(--accent);
}

/* ---------- home ---------- */

.m6-hero {
  text-align: center;
  padding: 52px 0 40px;
  border-bottom: 1px solid var(--hairline);
  animation: m6-settle 560ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
}

.m6-greeting {
  font-family: var(--font-display);
  font-weight: 300;
  font-size: clamp(34px, 5.5vw, 46px);
  line-height: 1.12;
  letter-spacing: -0.012em;
}

.m6-greeting em {
  font-style: italic;
  font-weight: 400;
}

.m6-score-line {
  margin-top: 22px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 14px;
}

.m6-score {
  font-family: var(--font-display);
  font-weight: 300;
  font-size: clamp(60px, 10vw, 84px);
  line-height: 1;
  letter-spacing: -0.02em;
}

.m6-score-cap {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: 19px;
  color: var(--muted);
}

.m6-delta {
  margin-top: 12px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 16px;
  color: var(--accent);
}

.m6-resume {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  margin-top: 36px;
  padding: 18px 2px;
  border-top: 2px solid var(--ink);
  border-bottom: 1px solid var(--hairline);
  transition: color 150ms ease;
  animation: m6-settle 560ms cubic-bezier(0.22, 1, 0.36, 1) 140ms both;
}

.m6-resume:hover .m6-resume-detail {
  color: var(--accent);
}

.m6-resume:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.m6-resume-kicker {
  display: block;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

.m6-resume-detail {
  display: block;
  margin-top: 6px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 20px;
  line-height: 1.3;
  transition: color 150ms ease;
}

.m6-resume-meta {
  display: block;
  margin-top: 3px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 15px;
  color: var(--muted);
}

.m6-resume-arrow {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--accent);
  flex-shrink: 0;
  align-self: center;
}

.m6-dept {
  padding-top: 40px;
  animation: m6-settle 560ms cubic-bezier(0.22, 1, 0.36, 1) 220ms both;
}

.m6-dept-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--ink);
  padding-bottom: 8px;
}

.m6-dept-title {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.m6-dept-note {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 15px;
  color: var(--muted);
}

/* hanging numerals also carry the plan list */
.m6-hang-list {
  padding-left: 56px;
}

.m6-plan-item {
  position: relative;
  padding: 20px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m6-settle 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m6-hang-n {
  position: absolute;
  left: -56px;
  top: 16px;
  width: 40px;
  text-align: right;
  font-family: var(--font-display);
  font-weight: 300;
  font-size: 30px;
  line-height: 1.1;
  color: var(--accent);
  font-variant-numeric: oldstyle-nums;
}

.m6-plan-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.m6-plan-headline {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 19px;
  line-height: 1.35;
}

.m6-plan-min {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 15px;
  color: var(--muted);
  white-space: nowrap;
}

.m6-plan-rationale {
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 15.5px;
  line-height: 1.55;
  color: var(--ink-2);
}

.m6-trap {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 16px;
  align-items: baseline;
  padding: 14px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m6-settle 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m6-trap-section {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.m6-trap-headline {
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.5;
}

.m6-trap-count {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 16px;
  color: var(--muted);
  font-variant-numeric: oldstyle-nums;
}

/* ---------- drill ---------- */

.m6-eyebrow {
  margin-top: 40px;
  text-align: center;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
  animation: m6-settle 500ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both;
}

.m6-eyebrow strong {
  font-weight: 700;
  color: var(--ink);
}

.m6-specimen {
  text-align: center;
  padding: 30px 0 6px;
  animation: m6-settle 560ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both;
}

.m6-headword {
  font-family: var(--font-display);
  font-weight: 300;
  font-size: clamp(52px, 9.5vw, 84px);
  line-height: 1.04;
  letter-spacing: -0.018em;
}

.m6-lede {
  margin-top: 14px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  color: var(--ink-2);
}

/* pull quote: the pregrade tactic set as the page's epigraph */
.m6-pullquote {
  margin: 34px auto 0;
  max-width: 34em;
  text-align: center;
  padding: 22px 0 20px;
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  animation: m6-settle 560ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both;
}

.m6-pullquote-move {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(19px, 2.6vw, 23px);
  line-height: 1.45;
  letter-spacing: 0.002em;
}

.m6-pullquote-move::before {
  content: '”';
  display: block;
  font-style: normal;
  font-weight: 300;
  font-size: 44px;
  line-height: 0.5;
  margin-bottom: 12px;
  color: var(--accent);
}

.m6-pullquote-handle {
  margin-top: 12px;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

/* options as a ruled dictionary list — no boxes, only rules */
.m6-options {
  margin-top: 30px;
  border-top: 2px solid var(--ink);
}

.m6-option {
  display: flex;
  align-items: baseline;
  gap: 20px;
  width: 100%;
  padding: 15px 4px;
  border-bottom: 1px solid var(--hairline);
  transition: color 150ms ease, opacity 220ms ease;
  animation: m6-settle 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m6-option:hover:enabled .m6-option-text {
  color: var(--accent);
}

.m6-option:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.m6-option:disabled {
  cursor: default;
}

.m6-key {
  flex-shrink: 0;
  width: 26px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  color: var(--muted);
  transition: color 150ms ease;
}

.m6-option-text {
  font-family: var(--font-display);
  font-weight: 450;
  font-size: 21px;
  letter-spacing: -0.004em;
  transition: color 150ms ease;
}

.m6-option--correct .m6-key {
  color: var(--accent);
  font-style: normal;
  font-weight: 600;
}

.m6-option--correct .m6-option-text {
  color: var(--accent);
  font-weight: 550;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 6px;
  text-decoration-color: var(--accent);
}

.m6-option--wrong .m6-option-text {
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  color: var(--muted);
}

.m6-option--dim {
  opacity: 0.42;
}

.m6-keyhint {
  margin-top: 14px;
  text-align: center;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 14px;
  color: var(--muted-2);
}

/* ---------- verdict: ink settling on the page ---------- */

.m6-verdict {
  text-align: center;
  padding: 38px 0 8px;
}

.m6-verdict-word {
  display: inline-block;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(44px, 8vw, 62px);
  line-height: 1;
  letter-spacing: -0.01em;
  animation: m6-ink 640ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m6-verdict-word--ratt {
  color: var(--accent);
}

.m6-verdict-word--fel {
  color: var(--bad);
}

.m6-verdict-rule {
  width: 72px;
  height: 1px;
  background: var(--ink);
  border: none;
  margin: 18px auto 0;
  transform-origin: center;
  animation: m6-rule 520ms cubic-bezier(0.22, 1, 0.36, 1) 260ms both;
}

.m6-verdict-sub {
  margin-top: 14px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  color: var(--ink-2);
  animation: m6-settle 480ms cubic-bezier(0.22, 1, 0.36, 1) 340ms both;
}

/* ---------- pedagogy: the article body ---------- */

.m6-article {
  margin-top: 26px;
}

/* drop cap solution — the article's opening paragraph */
.m6-solution {
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 1.62;
  max-width: 32em;
  margin: 0 auto;
  padding-top: 26px;
  border-top: 2px solid var(--ink);
  animation: m6-settle 520ms cubic-bezier(0.22, 1, 0.36, 1) 380ms both;
}

.m6-solution::first-letter {
  float: left;
  font-family: var(--font-display);
  font-weight: 300;
  font-size: 64px;
  line-height: 0.82;
  padding: 6px 12px 0 0;
  color: var(--accent);
}

/* steps with hanging numerals in the margin */
.m6-steps {
  margin: 34px auto 0;
  max-width: 34em;
  padding-left: 56px;
}

.m6-step {
  position: relative;
  padding: 20px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m6-settle 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m6-step:first-child {
  border-top: 1px solid var(--hairline);
}

.m6-step-title {
  font-family: var(--font-display);
  font-weight: 550;
  font-size: 19px;
  line-height: 1.35;
}

.m6-step-text {
  margin-top: 7px;
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.66;
  color: var(--ink-2);
}

.m6-step-aside {
  margin-top: 6px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 13.5px;
  color: var(--muted-2);
}

/* distractor analyses in two columns with a hairline column rule */
.m6-crosshead {
  margin: 42px auto 0;
  text-align: center;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  animation: m6-settle 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m6-crosshead::after {
  content: '';
  display: block;
  width: 40px;
  height: 1px;
  background: var(--ink);
  margin: 10px auto 0;
}

.m6-columns {
  margin-top: 24px;
  column-count: 2;
  column-gap: 44px;
  column-rule: 1px solid var(--hairline);
  animation: m6-settle 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m6-distractor {
  break-inside: avoid;
  padding-bottom: 22px;
}

.m6-distractor-head {
  font-family: var(--font-display);
  font-weight: 550;
  font-size: 17px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--hairline);
}

.m6-distractor-head s {
  text-decoration-thickness: 1.2px;
  color: var(--ink-2);
}

.m6-distractor-head .m6-key-letter {
  font-style: italic;
  font-weight: 400;
  color: var(--muted);
  margin-right: 4px;
}

.m6-distractor-label {
  margin-top: 10px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 14px;
  color: var(--accent);
}

.m6-distractor-body {
  margin-top: 3px;
  font-family: var(--font-display);
  font-size: 14.5px;
  line-height: 1.62;
  color: var(--ink-2);
}

/* next */
.m6-next {
  display: block;
  margin: 40px auto 0;
  padding: 14px 44px;
  background: var(--ink);
  color: var(--bg);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  transition: background 150ms ease;
  animation: m6-settle 520ms cubic-bezier(0.22, 1, 0.36, 1) 760ms both;
}

.m6-next:hover {
  background: var(--accent);
  color: var(--accent-ink);
}

.m6-next:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* ---------- motion ---------- */

@keyframes m6-settle {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes m6-ink {
  from {
    opacity: 0;
    transform: translateY(4px);
    letter-spacing: 0.05em;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    letter-spacing: -0.01em;
  }
}

@keyframes m6-rule {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m6-root *,
  .m6-root *::before,
  .m6-root *::after {
    animation: none !important;
    transition: none !important;
  }
}

@media (max-width: 960px) {
  .m6-root {
    padding: 0 24px 96px;
  }
}

@media (max-width: 640px) {
  .m6-columns {
    column-count: 1;
    column-rule: none;
  }
  .m6-steps,
  .m6-hang-list {
    padding-left: 44px;
  }
  .m6-hang-n {
    left: -44px;
    width: 32px;
    font-size: 26px;
  }
  .m6-runninghead {
    flex-wrap: wrap;
    gap: 4px 16px;
  }
}
`

function RunningHead({ folio }: { folio: ReactElement }): ReactElement {
  return (
    <header className="m6-runninghead">
      <span className="m6-runninghead-title">Söndagsbilagan</span>
      <span className="m6-runninghead-mid">HP-Coach · {HOME.dateLabel}</span>
      <span className="m6-runninghead-folio m6-osf">{folio}</span>
    </header>
  )
}

function Home(): ReactElement {
  return (
    <div className="m6-page">
      <RunningHead folio={<em>{HOME.streakDays} dagar i rad</em>} />

      <section className="m6-hero">
        <h1 className="m6-greeting">
          <em>{HOME.greeting}.</em>
        </h1>
        <div className="m6-score-line">
          <span className="m6-score m6-osf">{HOME.projectedScore.replace('.', ',')}</span>
          <span className="m6-score-cap m6-osf">av 2,0 i prognos</span>
        </div>
        <p className="m6-delta m6-osf">{HOME.scoreDelta.replace('.', ',')}</p>
      </section>

      <button type="button" className="m6-reset m6-resume">
        <span>
          <span className="m6-resume-kicker">Fortsätt där du var</span>
          <span className="m6-resume-detail">
            {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
            {HOME.resume.total}
          </span>
          <span className="m6-resume-meta m6-osf">
            Pausad på {HOME.resume.device} kl {HOME.resume.when}
          </span>
        </span>
        <span className="m6-resume-arrow">&rarr;</span>
      </button>

      <section className="m6-dept">
        <div className="m6-dept-head">
          <h2 className="m6-dept-title">Dagens plan</h2>
          <span className="m6-dept-note m6-osf">omkring {HOME.estimatedMinutes} minuter</span>
        </div>
        <div className="m6-hang-list">
          {HOME.plan.map((item, i) => (
            <article
              key={item.id}
              className="m6-plan-item"
              style={{ animationDelay: `${280 + i * 90}ms` }}
            >
              <span className="m6-hang-n" aria-hidden="true">
                {i + 1}
              </span>
              <div className="m6-plan-row">
                <h3 className="m6-plan-headline m6-osf">{item.headline}</h3>
                <span className="m6-plan-min m6-osf">{item.minutes} min</span>
              </div>
              <p className="m6-plan-rationale m6-osf">{item.rationale}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="m6-dept" style={{ animationDelay: '340ms' }}>
        <div className="m6-dept-head">
          <h2 className="m6-dept-title">Dina fällor</h2>
          <span className="m6-dept-note">senaste veckan</span>
        </div>
        {HOME.traps.map((trap, i) => (
          <div key={trap.id} className="m6-trap" style={{ animationDelay: `${440 + i * 90}ms` }}>
            <span className="m6-trap-section">{trap.section}</span>
            <span className="m6-trap-headline">{trap.headline}</span>
            <span className="m6-trap-count">&times;{trap.count}</span>
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
    <div className="m6-page">
      <RunningHead
        folio={
          <>
            sid <em>{QUESTION.number}</em> av {QUESTION.total}
          </>
        }
      />

      <p className="m6-eyebrow">
        <strong>{QUESTION.section}</strong> · {QUESTION.sectionLabel} · Fråga {QUESTION.number} av{' '}
        {QUESTION.total}
      </p>

      <div className="m6-specimen">
        <h1 className="m6-headword">{QUESTION.prompt}</h1>
        <p className="m6-lede">Vilket alternativ ligger närmast i betydelse?</p>
      </div>

      <aside className="m6-pullquote">
        <p className="m6-pullquote-move">{EXPLANATION.pregradeTactic.move}</p>
        <p className="m6-pullquote-handle">Taktik · {EXPLANATION.pregradeTactic.handle}</p>
      </aside>

      <fieldset className="m6-reset m6-options" aria-label="Svarsalternativ">
        {QUESTION.options.map((opt, i) => {
          const isCorrect = opt.letter === QUESTION.answer
          const isPicked = opt.letter === picked
          let cls = 'm6-reset m6-option'
          if (graded) {
            if (isCorrect) cls += ' m6-option--correct'
            else if (isPicked) cls += ' m6-option--wrong'
            else cls += ' m6-option--dim'
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
              <span className="m6-key">{opt.letter.toLowerCase()})</span>
              <span className="m6-option-text">{opt.text}</span>
            </button>
          )
        })}
      </fieldset>

      {!graded && <p className="m6-keyhint">Tryck a–e för att svara</p>}

      {graded && (
        <>
          <div className="m6-verdict" role="status">
            <span
              className={`m6-verdict-word ${correct ? 'm6-verdict-word--ratt' : 'm6-verdict-word--fel'}`}
            >
              {correct ? 'Rätt.' : 'Fel.'}
            </span>
            <hr className="m6-verdict-rule" />
            <p className="m6-verdict-sub">
              {correct
                ? 'Snyggt — taktiken höll hela vägen.'
                : `Rätt svar är ${QUESTION.answer.toLowerCase()}) vilja ha. Häng med i varför.`}
            </p>
          </div>

          <article className="m6-article">
            <p className="m6-solution">{EXPLANATION.solution}</p>

            <div className="m6-steps">
              {EXPLANATION.steps.map((step, i) => (
                <section
                  key={step.n}
                  className="m6-step"
                  style={{ animationDelay: `${460 + i * 110}ms` }}
                >
                  <span className="m6-hang-n" aria-hidden="true">
                    {step.n}
                  </span>
                  <h3 className="m6-step-title">{step.title}</h3>
                  <p className="m6-step-text">{step.text}</p>
                  {step.tier === 'detail' && (
                    <p className="m6-step-aside">Fördjupning — läs när du har tid.</p>
                  )}
                </section>
              ))}
            </div>

            <h2 className="m6-crosshead" style={{ animationDelay: '700ms' }}>
              Varför de andra lockar
            </h2>
            <div className="m6-columns" style={{ animationDelay: '780ms' }}>
              {EXPLANATION.distractors.map((d) => (
                <section key={d.letter} className="m6-distractor">
                  <p className="m6-distractor-head">
                    <span className="m6-key-letter">{d.letter.toLowerCase()})</span> <s>{d.text}</s>
                  </p>
                  <p className="m6-distractor-label">Varför det lockar</p>
                  <p className="m6-distractor-body">{d.whyTempting}</p>
                  <p className="m6-distractor-label">Varför det är fel</p>
                  <p className="m6-distractor-body">{d.whyWrong}</p>
                </section>
              ))}
            </div>

            <button type="button" className="m6-reset m6-next" onClick={() => setPicked(null)}>
              Nästa fråga
            </button>
            <p className="m6-keyhint">eller tryck Enter</p>
          </article>
        </>
      )}
    </div>
  )
}

export function M6({ screen }: { screen: RedesignScreen }): ReactElement {
  return (
    <div className="m6-root">
      <style>{CSS}</style>
      {screen === 'home' ? <Home /> : <Drill />}
    </div>
  )
}
