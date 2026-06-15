// Studio 5 — design thesis: "LÄSESALEN" (The Reading Room)
//
// A national-library print register instead of a screen register: warm archival
// paper, ink-black serif display, oxblood + bottle-green ledger accents, hairline
// rules and marginalia numerals. Grading lands as a physical ink stamp — the calm
// authority of a fine exam booklet, not a dashboard.

import { type CSSProperties, useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const
type Letter = (typeof LETTERS)[number]

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Instrument+Sans:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap');

.lab5-root {
  --paper: #f3eee3;
  --paper-deep: #ebe4d4;
  --card: #f8f4ea;
  --ink: #1d1812;
  --ink-soft: #5c5446;
  --ink-faint: #8a8071;
  --line: rgba(29, 24, 18, 0.16);
  --line-strong: rgba(29, 24, 18, 0.32);
  --oxblood: #8a1f2b;
  --green: #1f4d38;
  --gold: #9a6b1f;
  --serif: 'Fraunces', 'Georgia', serif;
  --sans: 'Instrument Sans', system-ui, sans-serif;
  --mono: 'Spline Sans Mono', ui-monospace, monospace;
  min-height: 100dvh;
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(154, 107, 31, 0.07), transparent 60%),
    linear-gradient(180deg, var(--paper) 0%, var(--paper-deep) 100%);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.lab5-reset {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.lab5-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 40px 48px 88px;
}
@media (max-width: 1000px) {
  .lab5-shell { padding: 28px 24px 64px; }
}

/* ---------- entrance choreography ---------- */
.lab5-rise {
  animation: lab5-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--d, 0ms);
}
@keyframes lab5-rise {
  from { opacity: 0; transform: translateY(14px); filter: blur(3px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
.lab5-rule-grow {
  transform-origin: left center;
  animation: lab5-rule 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--d, 0ms);
}
@keyframes lab5-rule {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* ---------- masthead ---------- */
.lab5-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 18px;
}
.lab5-wordmark {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 19px;
  letter-spacing: 0.01em;
}
.lab5-wordmark em {
  font-style: italic;
  font-weight: 400;
  color: var(--oxblood);
}
.lab5-mast-meta {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-soft);
}
.lab5-rule {
  height: 1px;
  background: var(--line-strong);
  border: 0;
  margin: 0;
}
.lab5-rule--hair { background: var(--line); }

/* ---------- home ---------- */
.lab5-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) 1px minmax(0, 1.6fr);
  gap: 0 40px;
  padding: 36px 0 32px;
}
@media (max-width: 1000px) {
  .lab5-hero { grid-template-columns: 1fr; gap: 28px; }
  .lab5-hero-divider { display: none; }
}
.lab5-hero-divider { background: var(--line); }
.lab5-greeting {
  font-family: var(--serif);
  font-size: 34px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.01em;
}
.lab5-date {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--ink-soft);
  margin-bottom: 10px;
}
.lab5-score-row {
  display: flex;
  align-items: baseline;
  gap: 18px;
  margin-top: 26px;
}
.lab5-score {
  font-family: var(--serif);
  font-size: 96px;
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-variant-numeric: lining-nums;
}
.lab5-score-of {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--ink-faint);
  letter-spacing: 0.06em;
}
.lab5-score-caption {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--ink-soft);
  margin-top: 18px;
}
.lab5-delta {
  display: inline-block;
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  border-bottom: 1px solid rgba(31, 77, 56, 0.35);
  padding-bottom: 2px;
}
.lab5-streak {
  margin-top: 22px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--ink-soft);
}
.lab5-streak-ticks {
  display: flex;
  gap: 4px;
}
.lab5-tick {
  width: 5px;
  height: 16px;
  background: var(--ink);
  opacity: 0.85;
  animation: lab5-tick 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(360ms + var(--i) * 45ms);
}
@keyframes lab5-tick {
  from { transform: scaleY(0); opacity: 0; }
  to { transform: scaleY(1); opacity: 0.85; }
}
.lab5-streak strong {
  font-family: var(--serif);
  font-size: 17px;
  color: var(--ink);
}

/* resume slip */
.lab5-resume {
  display: block;
  width: 100%;
  margin-top: 30px;
  background: var(--ink);
  color: var(--paper);
  padding: 18px 20px;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease;
  box-shadow: 0 1px 0 rgba(29, 24, 18, 0.4), 0 10px 24px -14px rgba(29, 24, 18, 0.5);
}
.lab5-resume:hover { transform: translateY(-2px); box-shadow: 0 1px 0 rgba(29,24,18,0.4), 0 16px 30px -14px rgba(29,24,18,0.55); }
.lab5-resume:focus-visible { outline: 2px solid var(--oxblood); outline-offset: 3px; }
.lab5-resume-kicker {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(243, 238, 227, 0.66);
}
.lab5-resume-line {
  margin-top: 7px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.lab5-resume-main {
  font-family: var(--serif);
  font-size: 19px;
  font-weight: 500;
}
.lab5-resume-arrow {
  font-family: var(--mono);
  font-size: 15px;
  color: rgba(243, 238, 227, 0.8);
  transition: transform 0.25s ease;
}
.lab5-resume:hover .lab5-resume-arrow { transform: translateX(4px); }
.lab5-resume-sub {
  margin-top: 5px;
  font-size: 13px;
  color: rgba(243, 238, 227, 0.62);
}

/* plan ledger */
.lab5-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 4px;
}
.lab5-section-title {
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.005em;
}
.lab5-section-note {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-soft);
}
.lab5-plan { list-style: none; margin: 0; padding: 0; }
.lab5-plan-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 18px;
  align-items: baseline;
  padding: 18px 4px;
  border-bottom: 1px solid var(--line);
  transition: background 0.2s ease;
}
.lab5-plan-item:hover { background: rgba(29, 24, 18, 0.035); }
.lab5-plan-n {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--ink-faint);
}
.lab5-plan-headline {
  font-family: var(--serif);
  font-size: 18px;
  font-weight: 500;
}
.lab5-plan-rationale {
  margin-top: 3px;
  font-size: 13.5px;
  color: var(--ink-soft);
}
.lab5-plan-min {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--ink);
  white-space: nowrap;
}
.lab5-plan-min em { font-style: normal; color: var(--ink-faint); }
.lab5-start {
  margin-top: 22px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--oxblood);
  border-bottom: 1px solid rgba(138, 31, 43, 0.4);
  padding: 2px 0 6px;
  transition: gap 0.25s ease, border-color 0.25s ease;
}
.lab5-start:hover { gap: 18px; border-color: var(--oxblood); }
.lab5-start:focus-visible { outline: 2px solid var(--oxblood); outline-offset: 4px; }

/* traps */
.lab5-traps-block { margin-top: 44px; }
.lab5-traps {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 1000px) {
  .lab5-traps { grid-template-columns: 1fr; }
}
.lab5-trap {
  background: var(--card);
  border: 1px solid var(--line);
  border-top: 3px solid var(--oxblood);
  border-radius: 3px;
  padding: 16px 18px 18px;
}
.lab5-trap-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-soft);
}
.lab5-trap-count {
  color: var(--oxblood);
  font-size: 12px;
}
.lab5-trap-headline {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink);
}

/* ---------- drill ---------- */
.lab5-drill-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 26px 0 8px;
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--ink-soft);
}
.lab5-progress {
  display: flex;
  gap: 5px;
  align-items: center;
}
.lab5-pip {
  width: 14px;
  height: 3px;
  background: var(--line-strong);
}
.lab5-pip--done { background: var(--ink); }
.lab5-pip--now { background: var(--oxblood); }

.lab5-drill-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  gap: 48px;
  padding-top: 26px;
}
@media (max-width: 1000px) {
  .lab5-drill-grid { grid-template-columns: 1fr; gap: 32px; }
}

.lab5-headword-label {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--ink-soft);
}
.lab5-headword {
  font-family: var(--serif);
  font-size: 64px;
  font-weight: 500;
  font-style: italic;
  letter-spacing: -0.015em;
  line-height: 1.05;
  margin: 8px 0 6px;
}
.lab5-headword-sub {
  font-size: 14px;
  color: var(--ink-soft);
  margin-bottom: 26px;
}

.lab5-options { display: flex; flex-direction: column; gap: 10px; }
.lab5-option {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 3px;
  font-size: 16px;
  transition: border-color 0.2s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease;
}
.lab5-option:hover:enabled { border-color: var(--ink); transform: translateX(4px); }
.lab5-option:focus-visible { outline: 2px solid var(--oxblood); outline-offset: 2px; }
.lab5-option:disabled { cursor: default; }
.lab5-key {
  font-family: var(--mono);
  font-size: 12px;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-strong);
  border-radius: 2px;
  color: var(--ink-soft);
}
.lab5-option-text { font-family: var(--serif); font-size: 17px; }
.lab5-verdict-mark {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.1em;
}
.lab5-option--correct {
  border-color: var(--green);
  background: rgba(31, 77, 56, 0.07);
  box-shadow: inset 3px 0 0 var(--green);
}
.lab5-option--correct .lab5-verdict-mark { color: var(--green); }
.lab5-option--wrongpick {
  border-color: var(--oxblood);
  background: rgba(138, 31, 43, 0.06);
  box-shadow: inset 3px 0 0 var(--oxblood);
  animation: lab5-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes lab5-shake {
  10%, 90% { transform: translateX(-1px); }
  30%, 70% { transform: translateX(3px); }
  50% { transform: translateX(-3px); }
}
.lab5-option--correct .lab5-key { border-color: var(--green); color: var(--green); }
.lab5-option--wrongpick .lab5-key { border-color: var(--oxblood); color: var(--oxblood); }
.lab5-option--dim { opacity: 0.45; }

/* tactic card */
.lab5-tactic {
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 3px solid var(--gold);
  border-radius: 3px;
  padding: 18px 20px;
}
.lab5-tactic-kicker {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--gold);
}
.lab5-tactic-handle {
  font-family: var(--serif);
  font-size: 20px;
  font-weight: 600;
  margin-top: 8px;
}
.lab5-tactic-move {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-soft);
}

/* stamp */
.lab5-stamp-zone {
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
}
.lab5-stamp {
  font-family: var(--mono);
  font-size: 26px;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  padding: 14px 28px;
  border: 3px double currentColor;
  border-radius: 4px;
  transform: rotate(-4deg);
  animation: lab5-stamp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.lab5-stamp--ratt { color: var(--green); }
.lab5-stamp--fel { color: var(--oxblood); }
@keyframes lab5-stamp {
  0% { opacity: 0; transform: rotate(-4deg) scale(1.7); filter: blur(2px); }
  60% { opacity: 1; transform: rotate(-4deg) scale(0.96); filter: blur(0); }
  100% { opacity: 1; transform: rotate(-4deg) scale(1); }
}

/* pedagogy */
.lab5-pedagogy { margin-top: 8px; }
.lab5-solution {
  font-family: var(--serif);
  font-size: 19px;
  line-height: 1.55;
  border-left: 3px solid var(--green);
  padding-left: 18px;
}
.lab5-ped-kicker {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--ink-soft);
  margin: 34px 0 14px;
}
.lab5-step {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid var(--line);
}
.lab5-step-n {
  font-family: var(--serif);
  font-style: italic;
  font-size: 22px;
  color: var(--ink-faint);
  line-height: 1.1;
}
.lab5-step-title {
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 600;
}
.lab5-step-tier {
  display: inline-block;
  margin-left: 10px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-faint);
  border: 1px solid var(--line);
  border-radius: 2px;
  padding: 1px 6px;
  vertical-align: 2px;
}
.lab5-step-text { margin-top: 6px; font-size: 14px; line-height: 1.65; color: var(--ink-soft); }

.lab5-distractor {
  border-top: 1px solid var(--line);
  padding: 16px 0;
}
.lab5-distractor-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.lab5-distractor-letter {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--oxblood);
}
.lab5-distractor-word {
  font-family: var(--serif);
  font-size: 16px;
  font-weight: 600;
}
.lab5-lure { margin-top: 8px; font-size: 13.5px; line-height: 1.6; }
.lab5-lure strong {
  font-family: var(--mono);
  font-weight: 500;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-right: 8px;
}
.lab5-lure--tempting { color: var(--ink-soft); }
.lab5-lure--tempting strong { color: var(--gold); }
.lab5-lure--wrong { color: var(--ink); margin-top: 6px; }
.lab5-lure--wrong strong { color: var(--green); }

.lab5-next {
  margin-top: 36px;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  padding: 14px 26px;
  border-radius: 3px;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
  box-shadow: 0 10px 22px -14px rgba(29, 24, 18, 0.6);
}
.lab5-next:hover { transform: translateY(-2px); }
.lab5-next:focus-visible { outline: 2px solid var(--oxblood); outline-offset: 3px; }
.lab5-next em { font-style: normal; color: rgba(243, 238, 227, 0.55); }

@media (prefers-reduced-motion: reduce) {
  .lab5-root *, .lab5-root *::before, .lab5-root *::after {
    animation-duration: 0.001s !important;
    animation-delay: 0s !important;
    transition-duration: 0.001s !important;
  }
}
`

function Masthead({ meta }: { meta: string }) {
  return (
    <header>
      <div className="lab5-masthead lab5-rise" style={{ '--d': '0ms' } as CSSProperties}>
        <div className="lab5-wordmark">
          HP-Coach <em>Läsesalen</em>
        </div>
        <div className="lab5-mast-meta">{meta}</div>
      </div>
      <hr className="lab5-rule lab5-rule-grow" style={{ '--d': '80ms' } as CSSProperties} />
    </header>
  )
}

function HomeScreen() {
  const ticks = Array.from({ length: HOME.streakDays }, (_, i) => i)
  return (
    <div className="lab5-shell">
      <Masthead meta={HOME.dateLabel} />
      <section className="lab5-hero">
        <div className="lab5-rise" style={{ '--d': '120ms' } as CSSProperties}>
          <p className="lab5-date">{HOME.dateLabel}</p>
          <h1 className="lab5-greeting">{HOME.greeting}.</h1>
          <div className="lab5-score-row">
            <span className="lab5-score">{HOME.projectedScore}</span>
            <span className="lab5-score-of">/ 2.0</span>
          </div>
          <p className="lab5-score-caption">Prognos · normerad poäng</p>
          <span className="lab5-delta">{HOME.scoreDelta}</span>
          <div className="lab5-streak">
            <span className="lab5-streak-ticks" aria-hidden="true">
              {ticks.map((i) => (
                <span key={i} className="lab5-tick" style={{ '--i': i } as CSSProperties} />
              ))}
            </span>
            <span>
              <strong>{HOME.streakDays} dagar</strong> i följd
            </span>
          </div>
          <button type="button" className="lab5-reset lab5-resume">
            <span className="lab5-resume-kicker">Återuppta där du var</span>
            <span className="lab5-resume-line">
              <span className="lab5-resume-main">
                {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
                {HOME.resume.total}
              </span>
              <span className="lab5-resume-arrow" aria-hidden="true">
                →
              </span>
            </span>
            <span className="lab5-resume-sub">
              Pausad på {HOME.resume.device} kl. {HOME.resume.when}
            </span>
          </button>
        </div>
        <div className="lab5-hero-divider" aria-hidden="true" />
        <div className="lab5-rise" style={{ '--d': '200ms' } as CSSProperties}>
          <div className="lab5-section-head">
            <h2 className="lab5-section-title">Dagens ordination</h2>
            <span className="lab5-section-note">≈ {HOME.estimatedMinutes} min totalt</span>
          </div>
          <ol className="lab5-plan">
            {HOME.plan.map((item, i) => (
              <li
                key={item.id}
                className="lab5-plan-item lab5-rise"
                style={{ '--d': `${260 + i * 80}ms` } as CSSProperties}
              >
                <span className="lab5-plan-n">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="lab5-plan-headline">{item.headline}</span>
                  <p className="lab5-plan-rationale">{item.rationale}</p>
                </span>
                <span className="lab5-plan-min">
                  {item.minutes} <em>min</em>
                </span>
              </li>
            ))}
          </ol>
          <button type="button" className="lab5-reset lab5-start">
            Börja dagens pass <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
      <section className="lab5-traps-block lab5-rise" style={{ '--d': '420ms' } as CSSProperties}>
        <div className="lab5-section-head">
          <h2 className="lab5-section-title">Dina fällor just nu</h2>
          <span className="lab5-section-note">återkommande misstag</span>
        </div>
        <ul className="lab5-traps">
          {HOME.traps.map((trap, i) => (
            <li
              key={trap.id}
              className="lab5-trap lab5-rise"
              style={{ '--d': `${480 + i * 80}ms` } as CSSProperties}
            >
              <div className="lab5-trap-meta">
                <span>{trap.section}</span>
                <span className="lab5-trap-count">×{trap.count}</span>
              </div>
              <p className="lab5-trap-headline">{trap.headline}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function DrillScreen() {
  const [picked, setPicked] = useState<Letter | null>(null)
  const [round, setRound] = useState(0)
  const graded = picked !== null
  const wasCorrect = picked === QUESTION.answer

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (picked === null) {
        const idx = 'abcde'.indexOf(e.key.toLowerCase())
        if (idx >= 0 && idx < LETTERS.length) {
          setPicked(LETTERS[idx])
        }
      } else if (e.key === 'Enter') {
        setPicked(null)
        setRound((r) => r + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked])

  const pips = Array.from({ length: QUESTION.total }, (_, i) => i + 1)

  return (
    <div className="lab5-shell" key={round}>
      <Masthead meta={`${QUESTION.sectionLabel} · ${QUESTION.section}`} />
      <div className="lab5-drill-meta lab5-rise" style={{ '--d': '100ms' } as CSSProperties}>
        <span>
          Fråga {QUESTION.number} av {QUESTION.total}
        </span>
        <span className="lab5-progress" aria-hidden="true">
          {pips.map((n) => (
            <span
              key={n}
              className={`lab5-pip${n < QUESTION.number ? ' lab5-pip--done' : n === QUESTION.number ? ' lab5-pip--now' : ''}`}
            />
          ))}
        </span>
      </div>
      <div className="lab5-drill-grid">
        <div>
          <div className="lab5-rise" style={{ '--d': '160ms' } as CSSProperties}>
            <p className="lab5-headword-label">Vilket ord ligger närmast i betydelse?</p>
            <h1 className="lab5-headword">{QUESTION.prompt}</h1>
            <p className="lab5-headword-sub">Välj med klick eller tangenterna a–e.</p>
          </div>
          <div className="lab5-options">
            {QUESTION.options.map((opt, i) => {
              const isAnswer = opt.letter === QUESTION.answer
              const isPick = opt.letter === picked
              let cls = 'lab5-reset lab5-option lab5-rise'
              if (graded) {
                if (isAnswer) cls += ' lab5-option--correct'
                else if (isPick) cls += ' lab5-option--wrongpick'
                else cls += ' lab5-option--dim'
              }
              return (
                <button
                  key={opt.letter}
                  type="button"
                  className={cls}
                  style={{ '--d': `${220 + i * 60}ms` } as CSSProperties}
                  disabled={graded}
                  onClick={() => setPicked(opt.letter)}
                >
                  <span className="lab5-key">{opt.letter.toLowerCase()}</span>
                  <span className="lab5-option-text">{opt.text}</span>
                  <span className="lab5-verdict-mark">
                    {graded && isAnswer ? 'RÄTT SVAR' : graded && isPick ? 'DITT VAL' : ''}
                  </span>
                </button>
              )
            })}
          </div>
          {graded && (
            <div className="lab5-stamp-zone" role="status">
              <span className={`lab5-stamp ${wasCorrect ? 'lab5-stamp--ratt' : 'lab5-stamp--fel'}`}>
                {wasCorrect ? 'RÄTT' : 'FEL'}
              </span>
            </div>
          )}
          {graded && (
            <button
              type="button"
              className="lab5-reset lab5-next lab5-rise"
              style={{ '--d': '500ms' } as CSSProperties}
              onClick={() => {
                setPicked(null)
                setRound((r) => r + 1)
              }}
            >
              Nästa fråga <em>Enter ↵</em>
            </button>
          )}
        </div>
        <div>
          <aside className="lab5-tactic lab5-rise" style={{ '--d': '300ms' } as CSSProperties}>
            <p className="lab5-tactic-kicker">Taktik före svar</p>
            <h2 className="lab5-tactic-handle">{EXPLANATION.pregradeTactic.handle}</h2>
            <p className="lab5-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
          </aside>
          {graded && (
            <div className="lab5-pedagogy">
              <p className="lab5-ped-kicker lab5-rise" style={{ '--d': '250ms' } as CSSProperties}>
                Lösningen
              </p>
              <p className="lab5-solution lab5-rise" style={{ '--d': '320ms' } as CSSProperties}>
                {EXPLANATION.solution}
              </p>
              <p className="lab5-ped-kicker lab5-rise" style={{ '--d': '420ms' } as CSSProperties}>
                Så tänker du
              </p>
              {EXPLANATION.steps.map((step, i) => (
                <div
                  key={step.n}
                  className="lab5-step lab5-rise"
                  style={{ '--d': `${480 + i * 110}ms` } as CSSProperties}
                >
                  <span className="lab5-step-n">{step.n}</span>
                  <div>
                    <h3 className="lab5-step-title">
                      {step.title}
                      <span className="lab5-step-tier">
                        {step.tier === 'essential' ? 'kärna' : 'fördjupning'}
                      </span>
                    </h3>
                    <p className="lab5-step-text">{step.text}</p>
                  </div>
                </div>
              ))}
              <p className="lab5-ped-kicker lab5-rise" style={{ '--d': '840ms' } as CSSProperties}>
                Därför lockar de fel alternativen
              </p>
              {EXPLANATION.distractors.map((d, i) => (
                <div
                  key={d.letter}
                  className="lab5-distractor lab5-rise"
                  style={{ '--d': `${900 + i * 110}ms` } as CSSProperties}
                >
                  <div className="lab5-distractor-head">
                    <span className="lab5-distractor-letter">{d.letter}</span>
                    <span className="lab5-distractor-word">{d.text}</span>
                  </div>
                  <p className="lab5-lure lab5-lure--tempting">
                    <strong>Lockar</strong>
                    {d.whyTempting}
                  </p>
                  <p className="lab5-lure lab5-lure--wrong">
                    <strong>Men</strong>
                    {d.whyWrong}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Lab5({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab5-root">
      <style>{css}</style>
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}
