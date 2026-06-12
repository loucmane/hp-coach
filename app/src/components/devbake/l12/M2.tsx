// M2 — "Produktion" (L12 derivative, round 6)
// L12's editorial soul with the expert panel's ergonomic patch list applied:
// resume-first home (single filled button, daily plan above the fold), the
// drill re-set on one left-aligned axis, the verdict entering as quiet ink at
// the picked option row, and everything rebound to the product tokens.

import { type ReactElement, type ReactNode, useEffect, useState } from 'react'
import { MathText } from '@/components/MathText'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'
import { type DrillKey, SECTION_DRILLS } from '../redesign/fixturesSections'

const KEYS = 'abcde'

const CSS = `
.m2-reset {
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

.m2-root {
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

.m2-col {
  max-width: 680px;
  margin: 0 auto;
}

/* ---------- masthead ---------- */

.m2-masthead {
  padding-top: 18px;
  animation: m2-rise 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m2-masthead-rule {
  border: none;
  border-top: 1px solid var(--ink);
  margin: 0;
}

.m2-masthead-rule--thin {
  border-top-color: var(--hairline);
}

.m2-masthead-inner {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 2px;
}

.m2-wordmark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.01em;
}

.m2-date {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.m2-streak {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  white-space: nowrap;
}

/* ---------- home ---------- */

.m2-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 0 18px;
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both;
}

.m2-greeting {
  font-family: var(--font-display);
  font-weight: var(--font-display-w);
  letter-spacing: var(--font-display-track);
  font-size: clamp(24px, 3vw, 30px);
  line-height: 1.1;
}

.m2-score-block {
  text-align: right;
  flex-shrink: 0;
}

.m2-score-line {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 7px;
}

.m2-score {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 32px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.m2-score-cap {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 15px;
  color: var(--muted);
}

.m2-delta {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.m2-resume {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: var(--ink);
  color: var(--bg);
  text-align: left;
  transition: background 160ms ease, transform 160ms ease;
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}

.m2-resume:hover {
  background: var(--accent);
  color: var(--accent-ink);
  transform: translateY(-1px);
}

.m2-resume:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.m2-resume-kicker {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.75;
}

.m2-resume-detail {
  display: block;
  margin-top: 3px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 500;
}

.m2-resume-meta {
  display: block;
  margin-top: 1px;
  font-size: 13px;
  opacity: 0.65;
}

.m2-resume-arrow {
  font-family: var(--font-display);
  font-size: 26px;
  flex-shrink: 0;
}

.m2-section {
  padding: 24px 0 4px;
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 140ms both;
}

.m2-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1px solid var(--ink);
  padding-bottom: 6px;
}

.m2-section-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.m2-section-note {
  font-size: 13px;
  color: var(--muted);
}

.m2-plan-item {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 14px;
  padding: 13px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m2-rise 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m2-plan-n {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 19px;
  color: var(--accent);
  line-height: 1.3;
}

.m2-plan-headline {
  display: block;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 17px;
  line-height: 1.3;
}

.m2-plan-rationale {
  display: block;
  margin-top: 2px;
  font-size: 14px;
  color: var(--muted);
}

.m2-plan-min {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  white-space: nowrap;
  padding-top: 3px;
}

.m2-trap {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 14px;
  align-items: baseline;
  padding: 11px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m2-rise 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m2-trap-section {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--accent);
}

.m2-trap-headline {
  font-size: 15px;
  line-height: 1.45;
}

.m2-trap-count {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 16px;
  color: var(--muted);
}

/* ---------- drill (single left axis) ---------- */

.m2-eyebrow {
  margin-top: 30px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
  animation: m2-rise 360ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both;
}

.m2-eyebrow em {
  font-style: normal;
  color: var(--ink);
}

.m2-specimen {
  padding: 20px 0 6px;
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}

.m2-headword {
  font-family: var(--font-display);
  font-weight: var(--font-display-w);
  letter-spacing: var(--font-display-track);
  font-size: clamp(40px, 6vw, 60px);
  line-height: var(--font-display-lead);
}

.m2-headword::after {
  content: '';
  display: block;
  width: 56px;
  height: 3px;
  background: var(--accent);
  margin-top: 14px;
  transform-origin: left center;
  animation: m2-grow 480ms cubic-bezier(0.22, 1, 0.36, 1) 260ms both;
}

.m2-lede {
  margin-top: 12px;
  font-size: 14px;
  color: var(--muted);
}

.m2-tactic {
  margin-top: 22px;
  padding: 12px 16px;
  border-left: 3px solid var(--accent);
  background: var(--panel);
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 140ms both;
}

.m2-tactic-handle {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}

.m2-tactic-move {
  margin-top: 3px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  line-height: 1.5;
}

.m2-options {
  margin-top: 22px;
  display: grid;
  gap: 10px;
}

.m2-option {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 13px 16px;
  border: 1.5px solid var(--hairline);
  background: var(--panel);
  text-align: left;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
  animation: m2-rise 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m2-option:hover:enabled {
  border-color: var(--ink);
  transform: translateY(-1px);
}

.m2-option:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.m2-option:disabled {
  cursor: default;
}

.m2-key {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--hairline);
  border-radius: 50%;
  font-family: var(--font-mono);
  letter-spacing: var(--font-mono-track);
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.m2-option-text {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 450;
}

.m2-option--correct {
  border-color: var(--ok);
  background: var(--ok-soft);
}

.m2-option--correct .m2-key {
  background: var(--ok);
  border-color: var(--ok);
  color: var(--ok-soft);
}

.m2-option--wrong {
  border-color: var(--bad);
  background: var(--bad-soft);
}

.m2-option--wrong .m2-option-text {
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  color: var(--ink-2);
}

.m2-option--dim {
  opacity: 0.45;
}

/* verdict — quiet ink at the picked row, never a stamp */

.m2-verdict {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 10px 2px 4px 18px;
  animation: m2-settle 280ms ease-out both;
}

.m2-verdict-word {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 26px;
  line-height: 1.1;
  white-space: nowrap;
}

.m2-verdict-word--ratt {
  color: var(--ok);
}

.m2-verdict-word--fel {
  color: var(--bad);
}

.m2-verdict-sub {
  font-size: 14.5px;
  color: var(--ink-2);
}

/* pedagogy */

.m2-pedagogy {
  margin-top: 12px;
}

.m2-solution {
  margin-top: 14px;
  padding: 16px 0;
  border-top: 2px solid var(--ink);
  border-bottom: 1px solid var(--hairline);
  font-family: var(--font-display);
  font-size: 19px;
  line-height: 1.55;
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
}

.m2-step {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m2-step-n {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 20px;
  color: var(--accent);
  line-height: 1.25;
}

.m2-step-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
}

.m2-step-text {
  margin-top: 5px;
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink-2);
}

.m2-distractor {
  padding: 15px 0;
  border-bottom: 1px solid var(--hairline);
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.m2-distractor-head {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
}

.m2-distractor-head s {
  text-decoration-thickness: 1.5px;
}

.m2-distractor-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 8px 0 2px;
}

.m2-distractor-body {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink-2);
}

.m2-next {
  display: inline-block;
  margin-top: 28px;
  padding: 13px 36px;
  background: var(--ink);
  color: var(--bg);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: background 140ms ease, color 140ms ease, transform 140ms ease;
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 480ms both;
}

.m2-next:hover {
  background: var(--accent);
  color: var(--accent-ink);
  transform: translateY(-1px);
}

.m2-next:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.m2-hint {
  margin-top: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

/* ---------- section drills (non-ORD canvases) ---------- */

/* The giant specimen headword is ORD-only; for the other sections the
   question prompt itself is the headline — serif, moderate display size,
   on the same flush-left axis. */

.m2-prompt {
  padding: 20px 0 6px;
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}

.m2-prompt-text {
  font-family: var(--font-display);
  font-weight: var(--font-display-w);
  letter-spacing: var(--font-display-track);
  font-size: clamp(26px, 3.4vw, 32px);
  line-height: 1.25;
}

.m2-prompt-text::after {
  content: '';
  display: block;
  width: 44px;
  height: 3px;
  background: var(--accent);
  margin-top: 12px;
  transform-origin: left center;
  animation: m2-grow 480ms cubic-bezier(0.22, 1, 0.36, 1) 260ms both;
}

/* LÄS — the passage as a typeset article excerpt, not a gray info box */

.m2-passage {
  margin-top: 26px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--hairline);
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
}

.m2-passage-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  line-height: 1.3;
}

.m2-passage-title::after {
  content: '';
  display: block;
  width: 32px;
  height: 2px;
  background: var(--accent);
  margin-top: 8px;
}

.m2-passage-body {
  margin-top: 12px;
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.7;
}

/* NOG — the (1)/(2) statement apparatus on the axis */

.m2-statements {
  margin-top: 22px;
  display: grid;
  gap: 12px;
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
}

.m2-statement {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
}

.m2-statement-n {
  font-family: var(--font-mono);
  letter-spacing: var(--font-mono-track);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  padding-top: 4px;
}

.m2-statement-text {
  font-family: var(--font-display);
  font-size: 17px;
  line-height: 1.55;
}

.m2-coda {
  margin-top: 22px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 16px;
  color: var(--ink-2);
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both;
}

.m2-coda + .m2-options {
  margin-top: 10px;
}

/* DTK — the figure as a quiet plate before the prompt */

.m2-figure {
  margin: 24px 0 0;
  padding: 16px;
  background: var(--panel);
  border: 1px solid var(--hairline);
  display: flex;
  justify-content: center;
  animation: m2-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
}

.m2-figure img {
  display: block;
  max-width: 100%;
  max-height: 420px;
  object-fit: contain;
}

/* missing pedagogy (DTK) — one quiet line, never an alarm */

.m2-noexpl {
  margin-top: 18px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 16px;
  color: var(--muted);
  animation: m2-settle 280ms ease-out 120ms both;
}

/* ---------- motion ---------- */

@keyframes m2-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes m2-settle {
  from {
    opacity: 0;
    filter: blur(1.5px);
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

@keyframes m2-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m2-root *,
  .m2-root *::after {
    animation: none !important;
    transition: none !important;
  }
}

@media (max-width: 560px) {
  .m2-root {
    padding: 0 16px 72px;
  }
  .m2-hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .m2-score-block {
    text-align: left;
  }
  .m2-score-line {
    justify-content: flex-start;
  }
  .m2-verdict {
    flex-direction: column;
    gap: 4px;
  }
}
`

function Masthead(): ReactElement {
  return (
    <header className="m2-masthead">
      <hr className="m2-masthead-rule" />
      <div className="m2-masthead-inner">
        <span className="m2-wordmark">HP-Coach</span>
        <span className="m2-date">{HOME.dateLabel}</span>
        <span className="m2-streak">&#9670; {HOME.streakDays} dagar i rad</span>
      </div>
      <hr className="m2-masthead-rule m2-masthead-rule--thin" />
    </header>
  )
}

function Home(): ReactElement {
  return (
    <div className="m2-col">
      <Masthead />

      <section className="m2-hero">
        <h1 className="m2-greeting">{HOME.greeting}.</h1>
        <div className="m2-score-block">
          <div className="m2-score-line">
            <span className="m2-score">{HOME.projectedScore.replace('.', ',')}</span>
            <span className="m2-score-cap">/ 2,0 prognos</span>
          </div>
          <p className="m2-delta">{HOME.scoreDelta.replace('.', ',')}</p>
        </div>
      </section>

      <button type="button" className="m2-reset m2-resume">
        <span>
          <span className="m2-resume-kicker">Fortsätt där du var</span>
          <span className="m2-resume-detail">
            {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
            {HOME.resume.total}
          </span>
          <span className="m2-resume-meta">
            Pausad på {HOME.resume.device} kl {HOME.resume.when}
          </span>
        </span>
        <span className="m2-resume-arrow">&rarr;</span>
      </button>

      <section className="m2-section">
        <div className="m2-section-head">
          <h2 className="m2-section-title">Dagens plan</h2>
          <span className="m2-section-note">ca {HOME.estimatedMinutes} min</span>
        </div>
        {HOME.plan.map((item, i) => (
          <div
            key={item.id}
            className="m2-plan-item"
            style={{ animationDelay: `${180 + i * 70}ms` }}
          >
            <span className="m2-plan-n">{i + 1}.</span>
            <span>
              <span className="m2-plan-headline">{item.headline}</span>
              <span className="m2-plan-rationale">{item.rationale}</span>
            </span>
            <span className="m2-plan-min">{item.minutes} min</span>
          </div>
        ))}
      </section>

      <section className="m2-section" style={{ animationDelay: '240ms' }}>
        <div className="m2-section-head">
          <h2 className="m2-section-title">Dina fällor</h2>
          <span className="m2-section-note">senaste veckan</span>
        </div>
        {HOME.traps.map((trap, i) => (
          <div key={trap.id} className="m2-trap" style={{ animationDelay: `${300 + i * 70}ms` }}>
            <span className="m2-trap-section">{trap.section}</span>
            <span className="m2-trap-headline">{trap.headline}</span>
            <span className="m2-trap-count">&times;{trap.count}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

// Shared pedagogy renderer — book-page solution, numbered steps, distractor
// autopsies. The ORD path routes text through as-is; the section paths route
// every potentially-mathy string through MathText. Same DOM either way.

type PedagogyExplanation = {
  solution: string
  steps: ReadonlyArray<{ n: number; title: string; text: string }>
  distractors: ReadonlyArray<{
    letter: string
    text: string
    whyTempting: string
    whyWrong: string
  }>
}

function Pedagogy({
  explanation,
  renderText,
  onReset,
}: {
  explanation: PedagogyExplanation
  renderText: (text: string) => ReactNode
  onReset: () => void
}): ReactElement {
  return (
    <div className="m2-pedagogy">
      <p className="m2-solution">{renderText(explanation.solution)}</p>

      {explanation.steps.map((step, i) => (
        <div key={step.n} className="m2-step" style={{ animationDelay: `${220 + i * 100}ms` }}>
          <span className="m2-step-n">{step.n}.</span>
          <div>
            <h3 className="m2-step-title">{renderText(step.title)}</h3>
            <p className="m2-step-text">{renderText(step.text)}</p>
          </div>
        </div>
      ))}

      <div className="m2-section-head" style={{ marginTop: 26 }}>
        <h2 className="m2-section-title">Varför de andra lockar</h2>
      </div>
      {explanation.distractors.map((d, i) => (
        <div
          key={d.letter}
          className="m2-distractor"
          style={{ animationDelay: `${340 + i * 100}ms` }}
        >
          <p className="m2-distractor-head">
            {d.letter.toLowerCase()}) <s>{renderText(d.text)}</s>
          </p>
          <p className="m2-distractor-label">Varför det lockar</p>
          <p className="m2-distractor-body">{renderText(d.whyTempting)}</p>
          <p className="m2-distractor-label">Varför det är fel</p>
          <p className="m2-distractor-body">{renderText(d.whyWrong)}</p>
        </div>
      ))}

      <button type="button" className="m2-reset m2-next" onClick={onReset}>
        Nästa fråga
      </button>
      <p className="m2-hint">eller tryck Enter &mdash; i din egen takt</p>
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
    <div className="m2-col">
      <Masthead />

      <p className="m2-eyebrow">
        <em>{QUESTION.section}</em> &middot; {QUESTION.sectionLabel} &middot; Fråga{' '}
        {QUESTION.number} av {QUESTION.total}
      </p>

      <div className="m2-specimen">
        <h1 className="m2-headword">{QUESTION.prompt}</h1>
        <p className="m2-lede">Vilket alternativ ligger närmast i betydelse?</p>
      </div>

      <aside className="m2-tactic">
        <p className="m2-tactic-handle">Taktik &middot; {EXPLANATION.pregradeTactic.handle}</p>
        <p className="m2-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
      </aside>

      <div className="m2-options">
        {QUESTION.options.map((opt, i) => {
          const isCorrect = opt.letter === QUESTION.answer
          const isPicked = opt.letter === picked
          let cls = 'm2-reset m2-option'
          if (graded) {
            if (isCorrect) cls += ' m2-option--correct'
            else if (isPicked) cls += ' m2-option--wrong'
            else cls += ' m2-option--dim'
          }
          return (
            <div key={opt.letter}>
              <button
                type="button"
                className={cls}
                disabled={graded}
                onClick={() => setPicked(opt.letter)}
                style={{ animationDelay: graded ? '0ms' : `${180 + i * 50}ms` }}
              >
                <span className="m2-key">{opt.letter.toLowerCase()}</span>
                <span className="m2-option-text">{opt.text}</span>
              </button>
              {graded && isPicked && (
                <div className="m2-verdict">
                  <span
                    className={`m2-verdict-word ${correct ? 'm2-verdict-word--ratt' : 'm2-verdict-word--fel'}`}
                  >
                    {correct ? 'Rätt.' : 'Fel.'}
                  </span>
                  <span className="m2-verdict-sub">
                    {correct
                      ? 'Snyggt — taktiken höll hela vägen.'
                      : `Rätt svar är ${QUESTION.answer.toLowerCase()}) vilja ha. Häng med i varför.`}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!graded && <p className="m2-hint">Tryck a&ndash;e för att svara</p>}

      {graded && (
        <Pedagogy
          explanation={EXPLANATION}
          renderText={(text) => text}
          onReset={() => setPicked(null)}
        />
      )}
    </div>
  )
}

function SectionDrill({ drill }: { drill: Exclude<DrillKey, 'ord'> }): ReactElement {
  const { question, explanation } = SECTION_DRILLS[drill]
  const [picked, setPicked] = useState<string | null>(null)
  const graded = picked !== null
  const correct = picked === question.answer
  const correctOption = question.options.find((opt) => opt.letter === question.answer)
  const lastKey = KEYS[question.options.length - 1]

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (picked === null) {
        const idx = KEYS.indexOf(key)
        if (idx >= 0 && idx < question.options.length) {
          setPicked(question.options[idx].letter)
        }
      } else if (e.key === 'Enter') {
        setPicked(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked, question])

  // Every potentially-mathy string goes through MathText uniformly; plain
  // text passes through it unchanged.
  const math = (text: string): ReactNode => <MathText>{text}</MathText>

  return (
    <div className="m2-col">
      <Masthead />

      <p className="m2-eyebrow">
        <em>{question.section}</em> &middot; {question.sectionLabel} &middot; Fråga{' '}
        {question.number} av {question.total}
      </p>

      {question.context !== null && (
        <section className="m2-passage">
          {question.contextTitle !== null && (
            <h2 className="m2-passage-title">{question.contextTitle}</h2>
          )}
          {question.context.split('\n\n').map((para, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static fixture paragraphs, no reordering
            <p key={i} className="m2-passage-body">
              {para}
            </p>
          ))}
        </section>
      )}

      {question.figureSrc !== null && (
        <figure className="m2-figure">
          <img src={question.figureSrc} alt="Diagramunderlag till frågan" />
        </figure>
      )}

      <div className="m2-prompt">
        <h1 className="m2-prompt-text">{math(question.prompt)}</h1>
        {question.lede !== null && <p className="m2-lede">{question.lede}</p>}
      </div>

      {question.statements !== null && (
        <div className="m2-statements">
          {question.statements.map((st) => (
            <div key={st.n} className="m2-statement">
              <span className="m2-statement-n">({st.n})</span>
              <span className="m2-statement-text">{math(st.text)}</span>
            </div>
          ))}
        </div>
      )}

      {explanation !== null && (
        <aside className="m2-tactic">
          <p className="m2-tactic-handle">Taktik &middot; {explanation.pregradeTactic.handle}</p>
          <p className="m2-tactic-move">{math(explanation.pregradeTactic.move)}</p>
        </aside>
      )}

      {question.coda !== null && <p className="m2-coda">{question.coda}</p>}

      <div className="m2-options">
        {question.options.map((opt, i) => {
          const isCorrect = opt.letter === question.answer
          const isPicked = opt.letter === picked
          let cls = 'm2-reset m2-option'
          if (graded) {
            if (isCorrect) cls += ' m2-option--correct'
            else if (isPicked) cls += ' m2-option--wrong'
            else cls += ' m2-option--dim'
          }
          return (
            <div key={opt.letter}>
              <button
                type="button"
                className={cls}
                disabled={graded}
                onClick={() => setPicked(opt.letter)}
                style={{ animationDelay: graded ? '0ms' : `${180 + i * 50}ms` }}
              >
                <span className="m2-key">{opt.letter.toLowerCase()}</span>
                <span className="m2-option-text">{math(opt.text)}</span>
              </button>
              {graded && isPicked && (
                <div className="m2-verdict">
                  <span
                    className={`m2-verdict-word ${correct ? 'm2-verdict-word--ratt' : 'm2-verdict-word--fel'}`}
                  >
                    {correct ? 'Rätt.' : 'Fel.'}
                  </span>
                  <span className="m2-verdict-sub">
                    {correct ? (
                      'Snyggt — taktiken höll hela vägen.'
                    ) : (
                      <>
                        Rätt svar är {question.answer.toLowerCase()}){' '}
                        {correctOption !== undefined && math(correctOption.text)}.
                        {explanation !== null && ' Häng med i varför.'}
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!graded && <p className="m2-hint">Tryck a&ndash;{lastKey} för att svara</p>}

      {graded && explanation !== null && (
        <Pedagogy explanation={explanation} renderText={math} onReset={() => setPicked(null)} />
      )}

      {graded && explanation === null && (
        <div className="m2-pedagogy">
          <p className="m2-noexpl">Förklaring saknas ännu för den här frågan.</p>
          <button type="button" className="m2-reset m2-next" onClick={() => setPicked(null)}>
            Nästa fråga
          </button>
          <p className="m2-hint">eller tryck Enter &mdash; i din egen takt</p>
        </div>
      )}
    </div>
  )
}

export function M2({
  screen,
  drill = 'ord',
}: {
  screen: RedesignScreen
  drill?: DrillKey
}): ReactElement {
  return (
    <div className="m2-root">
      <style>{CSS}</style>
      {screen === 'home' ? <Home /> : drill === 'ord' ? <Drill /> : <SectionDrill drill={drill} />}
    </div>
  )
}
