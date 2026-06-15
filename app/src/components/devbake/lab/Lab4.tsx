// Studio 4 — "BLÄCKPROTOKOLLET" (The Ink Protocol)
//
// Thesis: the calm authority of an exam-hall paper protocol — warm archival paper,
// ruled baselines, serif headwords set like dictionary entries, and grading delivered
// as a physical ink stamp. Zero dashboard chrome; every number reads like an entry
// in a training ledger kept by a serious coach.

import { type CSSProperties, useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

const LETTERS = ['a', 'b', 'c', 'd', 'e'] as const

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Instrument+Sans:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap');

.lab4-root {
  --paper: #f3eee3;
  --paper-deep: #eae3d3;
  --paper-card: #faf7ef;
  --ink: #21201c;
  --ink-soft: #565248;
  --ink-faint: #8b8576;
  --rule: rgba(33, 32, 28, 0.14);
  --rule-soft: rgba(33, 32, 28, 0.08);
  --vermilion: #b23a1e;
  --vermilion-deep: #8e2c14;
  --stamp-green: #1e6b48;
  --stamp-red: #b02814;
  --gold: #9a7b2d;
  min-height: 100dvh;
  background:
    repeating-linear-gradient(0deg, transparent 0 31px, var(--rule-soft) 31px 32px),
    radial-gradient(1200px 600px at 75% -10%, #f8f4ea 0%, transparent 60%),
    var(--paper);
  color: var(--ink);
  font-family: 'Instrument Sans', sans-serif;
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.lab4-reset {
  appearance: none;
  background: none;
  border: none;
  margin: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: inherit;
  cursor: pointer;
}
.lab4-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 56px 48px 96px;
}
@media (max-width: 980px) {
  .lab4-shell { padding: 40px 28px 72px; }
}

/* ---------- typography helpers ---------- */
.lab4-serif { font-family: 'Fraunces', serif; }
.lab4-mono {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-faint);
}
.lab4-mono-strong { color: var(--ink-soft); font-weight: 600; }

/* ---------- entrance choreography ---------- */
@keyframes lab4-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
.lab4-rise {
  opacity: 0;
  animation: lab4-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--d, 0s);
}
@keyframes lab4-rule-draw {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
.lab4-rule-line {
  height: 1px;
  background: var(--ink);
  transform-origin: left;
  animation: lab4-rule-draw 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--d, 0s);
  transform: scaleX(0);
}

/* ---------- masthead ---------- */
.lab4-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 14px;
}
.lab4-wordmark {
  font-family: 'Fraunces', serif;
  font-weight: 700;
  font-size: 19px;
  letter-spacing: 0.01em;
}
.lab4-wordmark em {
  font-style: italic;
  color: var(--vermilion);
}

/* ---------- HOME ---------- */
.lab4-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 40px;
  padding: 44px 0 36px;
  flex-wrap: wrap;
}
.lab4-greeting {
  font-family: 'Fraunces', serif;
  font-size: clamp(40px, 4.6vw, 58px);
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: -0.015em;
  max-width: 560px;
}
.lab4-greeting em {
  font-style: italic;
  font-weight: 400;
  color: var(--vermilion);
}
.lab4-hero-meta { margin-bottom: 14px; }
.lab4-scoreblock {
  display: flex;
  align-items: flex-end;
  gap: 36px;
}
.lab4-score-figure {
  font-family: 'Fraunces', serif;
  font-size: 96px;
  font-weight: 600;
  line-height: 0.86;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.lab4-score-scale {
  font-family: 'Fraunces', serif;
  font-size: 26px;
  font-weight: 400;
  color: var(--ink-faint);
}
.lab4-score-col { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
.lab4-delta {
  display: inline-block;
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--stamp-green);
  border-bottom: 2px solid var(--stamp-green);
  padding-bottom: 2px;
}
.lab4-streak-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 32px;
  border-left: 1px solid var(--rule);
}
.lab4-streak-figure {
  font-family: 'Fraunces', serif;
  font-size: 44px;
  font-weight: 600;
  line-height: 0.9;
}
.lab4-streak-ticks { display: flex; gap: 4px; }
.lab4-tick {
  width: 5px;
  height: 16px;
  background: var(--ink);
  opacity: 0;
  animation: lab4-rise 0.35s ease forwards;
  animation-delay: var(--d, 0s);
}
.lab4-tick--accent { background: var(--vermilion); }

.lab4-grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 56px;
  padding-top: 40px;
}
@media (max-width: 980px) {
  .lab4-grid { grid-template-columns: 1fr; gap: 44px; }
  .lab4-score-figure { font-size: 72px; }
}

.lab4-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

/* resume */
.lab4-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  background: var(--ink);
  color: var(--paper);
  padding: 24px 28px;
  margin-bottom: 36px;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease;
  box-shadow: 6px 6px 0 rgba(33, 32, 28, 0.16);
}
.lab4-resume:hover {
  transform: translate(-2px, -2px);
  box-shadow: 9px 9px 0 rgba(33, 32, 28, 0.2);
}
.lab4-resume-kicker {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #cfc8b6;
  margin-bottom: 8px;
}
.lab4-resume-title {
  font-family: 'Fraunces', serif;
  font-size: 23px;
  font-weight: 600;
  line-height: 1.2;
}
.lab4-resume-sub {
  font-size: 13.5px;
  color: #b9b2a0;
  margin-top: 6px;
}
.lab4-resume-arrow {
  font-family: 'Fraunces', serif;
  font-size: 34px;
  font-weight: 400;
  color: var(--paper);
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.lab4-resume:hover .lab4-resume-arrow { transform: translateX(6px); }

/* plan ledger */
.lab4-plan-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 20px;
  align-items: start;
  width: 100%;
  padding: 22px 4px;
  border-bottom: 1px solid var(--rule);
  transition: background 0.2s ease;
}
.lab4-plan-item:first-of-type { border-top: 1px solid var(--ink); }
.lab4-plan-item:hover { background: var(--paper-card); }
.lab4-plan-index {
  font-family: 'Fraunces', serif;
  font-size: 26px;
  font-weight: 500;
  font-style: italic;
  color: var(--vermilion);
  line-height: 1.1;
}
.lab4-plan-headline {
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 600;
  line-height: 1.25;
}
.lab4-plan-rationale {
  font-size: 14px;
  color: var(--ink-soft);
  margin-top: 5px;
  max-width: 46ch;
}
.lab4-plan-min {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  padding-top: 5px;
}
.lab4-plan-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
}
.lab4-start {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--paper);
  background: var(--vermilion);
  padding: 13px 26px;
  transition: background 0.2s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.lab4-start:hover { background: var(--vermilion-deep); transform: translateY(-2px); }

/* traps */
.lab4-trap {
  position: relative;
  padding: 20px 0 20px 26px;
  border-bottom: 1px solid var(--rule);
}
.lab4-trap:first-of-type { border-top: 1px solid var(--ink); }
.lab4-trap::before {
  content: '';
  position: absolute;
  left: 0;
  top: 24px;
  width: 10px;
  height: 10px;
  background: var(--vermilion);
  transform: rotate(45deg);
}
.lab4-trap-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}
.lab4-trap-count {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--vermilion);
}
.lab4-trap-headline {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.45;
  color: var(--ink);
}

/* ---------- DRILL ---------- */
.lab4-drill {
  max-width: 780px;
  margin: 0 auto;
}
.lab4-drill-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 36px 0 12px;
}
.lab4-progress {
  display: flex;
  gap: 5px;
  align-items: center;
}
.lab4-progress-cell {
  width: 18px;
  height: 4px;
  background: var(--rule);
}
.lab4-progress-cell--done { background: var(--ink); }
.lab4-progress-cell--now { background: var(--vermilion); }

.lab4-tactic {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  align-items: start;
  background: var(--paper-card);
  border: 1px solid var(--rule);
  border-left: 3px solid var(--gold);
  padding: 20px 24px;
  margin: 22px 0 8px;
}
.lab4-tactic-glyph {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 30px;
  font-weight: 500;
  color: var(--gold);
  line-height: 1;
}
.lab4-tactic-handle {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 6px;
}
.lab4-tactic-move {
  font-size: 15px;
  line-height: 1.55;
  color: var(--ink-soft);
}

.lab4-headword-row {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 24px;
  flex-wrap: wrap;
  padding: 36px 0 28px;
}
.lab4-headword {
  font-family: 'Fraunces', serif;
  font-size: clamp(52px, 6.4vw, 78px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
}
.lab4-headword-gloss {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 17px;
  color: var(--ink-faint);
}

/* options */
.lab4-options { display: flex; flex-direction: column; }
.lab4-option {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  width: 100%;
  padding: 17px 6px;
  border-bottom: 1px solid var(--rule);
  transition: background 0.18s ease, opacity 0.35s ease;
}
.lab4-option:first-of-type { border-top: 1px solid var(--ink); }
.lab4-option--idle:hover { background: var(--paper-card); }
.lab4-option--idle:hover .lab4-option-letter {
  background: var(--ink);
  color: var(--paper);
}
.lab4-option-letter {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid var(--ink);
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.lab4-option-text {
  font-family: 'Fraunces', serif;
  font-size: 21px;
  font-weight: 500;
}
.lab4-option-verdict {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.lab4-option--correct { background: rgba(30, 107, 72, 0.07); }
.lab4-option--correct .lab4-option-letter {
  background: var(--stamp-green);
  border-color: var(--stamp-green);
  color: var(--paper);
}
.lab4-option--correct .lab4-option-verdict { color: var(--stamp-green); }
.lab4-option--missed { background: rgba(176, 40, 20, 0.06); }
.lab4-option--missed .lab4-option-letter {
  background: var(--stamp-red);
  border-color: var(--stamp-red);
  color: var(--paper);
}
.lab4-option--missed .lab4-option-text { text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: var(--stamp-red); }
.lab4-option--missed .lab4-option-verdict { color: var(--stamp-red); }
.lab4-option--dim { opacity: 0.42; }
.lab4-option--graded { cursor: default; }

@keyframes lab4-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  55% { transform: translateX(4px); }
  80% { transform: translateX(-2px); }
}
.lab4-option--shake { animation: lab4-shake 0.4s ease; }

/* the stamp — grading signature */
@keyframes lab4-stamp {
  0% { opacity: 0; transform: rotate(-8deg) scale(2.1); filter: blur(3px); }
  55% { opacity: 1; transform: rotate(-8deg) scale(0.94); filter: blur(0); }
  75% { transform: rotate(-8deg) scale(1.04); }
  100% { opacity: 1; transform: rotate(-8deg) scale(1); }
}
.lab4-stamp {
  position: absolute;
  right: 0;
  top: 26px;
  font-family: 'Spline Sans Mono', monospace;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.3em;
  padding: 10px 18px 10px 24px;
  border: 3px double currentColor;
  transform: rotate(-8deg);
  animation: lab4-stamp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  pointer-events: none;
}
.lab4-stamp--ratt { color: var(--stamp-green); }
.lab4-stamp--fel { color: var(--stamp-red); }

/* pedagogy */
.lab4-pedagogy { padding-top: 44px; }
.lab4-solution {
  font-family: 'Fraunces', serif;
  font-size: 23px;
  font-weight: 500;
  line-height: 1.45;
  border-left: 3px solid var(--ink);
  padding-left: 24px;
  margin: 18px 0 44px;
  max-width: 60ch;
}
.lab4-step {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 22px;
  padding: 26px 0;
  border-bottom: 1px solid var(--rule);
}
.lab4-step:first-of-type { border-top: 1px solid var(--ink); }
.lab4-step-n {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 34px;
  font-weight: 500;
  color: var(--vermilion);
  line-height: 1;
}
.lab4-step-tier {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-faint);
  display: block;
  margin-top: 8px;
}
.lab4-step-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}
.lab4-step-text {
  font-size: 15.5px;
  line-height: 1.65;
  color: var(--ink-soft);
  max-width: 64ch;
}
.lab4-distractors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--rule);
  border: 1px solid var(--rule);
  margin-top: 18px;
}
@media (max-width: 980px) {
  .lab4-distractors { grid-template-columns: 1fr; }
}
.lab4-distractor {
  background: var(--paper-card);
  padding: 24px 26px;
}
.lab4-distractor-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}
.lab4-distractor-letter {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--stamp-red);
}
.lab4-distractor-word {
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 600;
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  text-decoration-color: rgba(176, 40, 20, 0.55);
}
.lab4-why-label {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
}
.lab4-why-label--tempt { color: var(--gold); }
.lab4-why-label--wrong { color: var(--stamp-red); }
.lab4-why {
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-soft);
}
.lab4-why + .lab4-why-label { margin-top: 14px; }

.lab4-next-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 44px 0 8px;
}
.lab4-next {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--paper);
  background: var(--ink);
  padding: 15px 30px;
  transition: background 0.2s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.lab4-next:hover { background: var(--vermilion); transform: translateY(-2px); }
.lab4-kbd-hint { font-size: 13px; color: var(--ink-faint); }
.lab4-kbd {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  border: 1px solid var(--rule);
  background: var(--paper-card);
  padding: 2px 7px;
  margin: 0 2px;
}

@media (prefers-reduced-motion: reduce) {
  .lab4-root .lab4-rise,
  .lab4-root .lab4-rule-line,
  .lab4-root .lab4-tick,
  .lab4-root .lab4-stamp,
  .lab4-root .lab4-option--shake {
    animation: none;
    opacity: 1;
    transform: rotate(0) scaleX(1);
  }
  .lab4-root .lab4-stamp { transform: rotate(-8deg); }
  .lab4-root * { transition: none !important; }
}
`

function Masthead({ note }: { note: string }) {
  return (
    <header className="lab4-masthead lab4-rise" style={{ '--d': '0s' } as CSSProperties}>
      <div className="lab4-wordmark">
        HP-Coach <em>· protokoll</em>
      </div>
      <div className="lab4-mono">{note}</div>
    </header>
  )
}

function HomeScreen() {
  const ticks = Array.from({ length: HOME.streakDays }, (_, i) => i)
  return (
    <div className="lab4-shell">
      <Masthead note={HOME.dateLabel} />
      <div className="lab4-rule-line" style={{ '--d': '0.05s' } as CSSProperties} />

      <section className="lab4-hero">
        <div className="lab4-rise" style={{ '--d': '0.1s' } as CSSProperties}>
          <h1 className="lab4-greeting">
            {HOME.greeting}.<br />
            Dagens pass: <em>{HOME.estimatedMinutes} minuter</em>.
          </h1>
        </div>
        <div className="lab4-scoreblock lab4-rise" style={{ '--d': '0.2s' } as CSSProperties}>
          <div className="lab4-score-col">
            <div className="lab4-mono lab4-mono-strong">Prognos</div>
            <div className="lab4-score-figure">
              {HOME.projectedScore}
              <span className="lab4-score-scale"> / 2.0</span>
            </div>
            <div className="lab4-delta">{HOME.scoreDelta}</div>
          </div>
          <div className="lab4-streak-col">
            <div className="lab4-mono lab4-mono-strong">Svit</div>
            <div className="lab4-streak-figure">{HOME.streakDays} dagar</div>
            <div className="lab4-streak-ticks" aria-hidden="true">
              {ticks.map((i) => (
                <span
                  key={i}
                  className={`lab4-tick${i === HOME.streakDays - 1 ? ' lab4-tick--accent' : ''}`}
                  style={{ '--d': `${0.3 + i * 0.04}s` } as CSSProperties}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="lab4-rule-line" style={{ '--d': '0.25s' } as CSSProperties} />

      <div className="lab4-grid">
        <section>
          <button
            type="button"
            className="lab4-reset lab4-resume lab4-rise"
            style={{ '--d': '0.3s' } as CSSProperties}
          >
            <span>
              <span className="lab4-resume-kicker">Fortsätt där du var</span>
              <span className="lab4-resume-title">
                {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
                {HOME.resume.total}
              </span>
              <span className="lab4-resume-sub">
                Pausad på {HOME.resume.device} kl {HOME.resume.when}
              </span>
            </span>
            <span className="lab4-resume-arrow" aria-hidden="true">
              {'→'}
            </span>
          </button>

          <div className="lab4-section-head lab4-rise" style={{ '--d': '0.38s' } as CSSProperties}>
            <div className="lab4-mono lab4-mono-strong">Dagens ordination</div>
            <div className="lab4-mono">{HOME.estimatedMinutes} min totalt</div>
          </div>
          {HOME.plan.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="lab4-reset lab4-plan-item lab4-rise"
              style={{ '--d': `${0.44 + i * 0.08}s` } as CSSProperties}
            >
              <span className="lab4-plan-index">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <span className="lab4-plan-headline">{item.headline}</span>
                <span className="lab4-plan-rationale" style={{ display: 'block' }}>
                  {item.rationale}
                </span>
              </span>
              <span className="lab4-plan-min">{item.minutes} min</span>
            </button>
          ))}
          <div className="lab4-plan-foot lab4-rise" style={{ '--d': '0.7s' } as CSSProperties}>
            <span className="lab4-mono">3 moment · äldsta missarna först</span>
            <button type="button" className="lab4-reset lab4-start">
              Starta passet
            </button>
          </div>
        </section>

        <section>
          <div className="lab4-section-head lab4-rise" style={{ '--d': '0.5s' } as CSSProperties}>
            <div className="lab4-mono lab4-mono-strong">Dina fällor just nu</div>
            <div className="lab4-mono">Senaste 14 dagarna</div>
          </div>
          {HOME.traps.map((trap, i) => (
            <article
              key={trap.id}
              className="lab4-trap lab4-rise"
              style={{ '--d': `${0.56 + i * 0.08}s` } as CSSProperties}
            >
              <div className="lab4-trap-meta">
                <span className="lab4-mono lab4-mono-strong">{trap.section}</span>
                <span className="lab4-trap-count">{trap.count} ggr</span>
              </div>
              <p className="lab4-trap-headline">{trap.headline}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}

function DrillScreen() {
  const [picked, setPicked] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const graded = picked !== null
  const wasCorrect = picked === QUESTION.answer

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (picked === null) {
        const idx = LETTERS.indexOf(e.key.toLowerCase() as (typeof LETTERS)[number])
        if (idx >= 0) setPicked(QUESTION.options[idx].letter)
      } else if (e.key === 'Enter') {
        setPicked(null)
        setRound((r) => r + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked])

  return (
    <div className="lab4-shell" key={round}>
      <Masthead note={`${QUESTION.sectionLabel} · ${QUESTION.qid}`} />
      <div className="lab4-rule-line" style={{ '--d': '0.05s' } as CSSProperties} />

      <div className="lab4-drill">
        <div className="lab4-drill-head lab4-rise" style={{ '--d': '0.1s' } as CSSProperties}>
          <div className="lab4-mono lab4-mono-strong">
            {QUESTION.section} · Fråga {QUESTION.number} av {QUESTION.total}
          </div>
          <div className="lab4-progress" aria-hidden="true">
            {Array.from({ length: QUESTION.total }, (_, i) => i).map((pos) => (
              <span
                key={pos}
                className={`lab4-progress-cell${
                  pos < QUESTION.number - 1
                    ? ' lab4-progress-cell--done'
                    : pos === QUESTION.number - 1
                      ? ' lab4-progress-cell--now'
                      : ''
                }`}
              />
            ))}
          </div>
        </div>

        <aside className="lab4-tactic lab4-rise" style={{ '--d': '0.18s' } as CSSProperties}>
          <div className="lab4-tactic-glyph" aria-hidden="true">
            {'§'}
          </div>
          <div>
            <div className="lab4-tactic-handle">Taktik · {EXPLANATION.pregradeTactic.handle}</div>
            <p className="lab4-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
          </div>
        </aside>

        <div className="lab4-headword-row lab4-rise" style={{ '--d': '0.26s' } as CSSProperties}>
          <h1 className="lab4-headword">{QUESTION.prompt}</h1>
          <span className="lab4-headword-gloss">Vilket ord ligger närmast i betydelse?</span>
          {graded && (
            <span
              className={`lab4-stamp ${wasCorrect ? 'lab4-stamp--ratt' : 'lab4-stamp--fel'}`}
              role="status"
            >
              {wasCorrect ? 'RÄTT' : 'FEL'}
            </span>
          )}
        </div>

        <div className="lab4-options">
          {QUESTION.options.map((opt, i) => {
            const isAnswer = opt.letter === QUESTION.answer
            const isPicked = opt.letter === picked
            const cls = [
              'lab4-reset',
              'lab4-option',
              'lab4-rise',
              graded ? 'lab4-option--graded' : 'lab4-option--idle',
              graded && isAnswer ? 'lab4-option--correct' : '',
              graded && isPicked && !isAnswer ? 'lab4-option--missed lab4-option--shake' : '',
              graded && !isAnswer && !isPicked ? 'lab4-option--dim' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <button
                key={opt.letter}
                type="button"
                className={cls}
                style={{ '--d': `${0.32 + i * 0.06}s` } as CSSProperties}
                onClick={() => {
                  if (!graded) setPicked(opt.letter)
                }}
                disabled={graded}
                aria-pressed={isPicked}
              >
                <span className="lab4-option-letter">{opt.letter}</span>
                <span className="lab4-option-text">{opt.text}</span>
                <span className="lab4-option-verdict">
                  {graded && isAnswer ? 'Rätt svar' : graded && isPicked ? 'Ditt val' : ''}
                </span>
              </button>
            )
          })}
        </div>

        {graded && (
          <section className="lab4-pedagogy">
            <div className="lab4-rise" style={{ '--d': '0.35s' } as CSSProperties}>
              <div className="lab4-mono lab4-mono-strong">Lösningen</div>
              <p className="lab4-solution">{EXPLANATION.solution}</p>
            </div>

            <div className="lab4-rise" style={{ '--d': '0.5s' } as CSSProperties}>
              <div className="lab4-section-head">
                <div className="lab4-mono lab4-mono-strong">Så tänker du</div>
                <div className="lab4-mono">3 steg</div>
              </div>
            </div>
            {EXPLANATION.steps.map((step, i) => (
              <article
                key={step.n}
                className="lab4-step lab4-rise"
                style={{ '--d': `${0.58 + i * 0.12}s` } as CSSProperties}
              >
                <div>
                  <div className="lab4-step-n">{step.n}</div>
                  <span className="lab4-step-tier">
                    {step.tier === 'essential' ? 'Kärna' : 'Fördjupning'}
                  </span>
                </div>
                <div>
                  <h3 className="lab4-step-title">{step.title}</h3>
                  <p className="lab4-step-text">{step.text}</p>
                </div>
              </article>
            ))}

            <div className="lab4-rise" style={{ '--d': '0.95s' } as CSSProperties}>
              <div className="lab4-section-head" style={{ marginTop: 44 }}>
                <div className="lab4-mono lab4-mono-strong">Varför de andra lockar</div>
                <div className="lab4-mono">4 fällor</div>
              </div>
              <div className="lab4-distractors">
                {EXPLANATION.distractors.map((d) => (
                  <article key={d.letter} className="lab4-distractor">
                    <div className="lab4-distractor-head">
                      <span className="lab4-distractor-letter">{d.letter}</span>
                      <span className="lab4-distractor-word">{d.text}</span>
                    </div>
                    <span className="lab4-why-label lab4-why-label--tempt">Därför lockar det</span>
                    <p className="lab4-why">{d.whyTempting}</p>
                    <span className="lab4-why-label lab4-why-label--wrong">Därför är det fel</span>
                    <p className="lab4-why">{d.whyWrong}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="lab4-next-row lab4-rise" style={{ '--d': '1.1s' } as CSSProperties}>
              <span className="lab4-kbd-hint">
                <span className="lab4-kbd">Enter</span> för nästa fråga
              </span>
              <button
                type="button"
                className="lab4-reset lab4-next"
                onClick={() => {
                  setPicked(null)
                  setRound((r) => r + 1)
                }}
              >
                Nästa fråga {'→'}
              </button>
            </div>
          </section>
        )}

        {!graded && (
          <div className="lab4-next-row lab4-rise" style={{ '--d': '0.65s' } as CSSProperties}>
            <span className="lab4-kbd-hint">
              Svara med <span className="lab4-kbd">A</span>–<span className="lab4-kbd">E</span>{' '}
              eller klicka
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function Lab4({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab4-root">
      <style>{css}</style>
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}
