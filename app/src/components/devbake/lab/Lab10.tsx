// Lab10 — Studio 10 entry for the seeded design bake-off.
//
// THESIS — "ANDRUM" (breathing room as pedagogy):
// Focus is the product: one warm cream field, one deep slate-blue voice, one
// sunshine accent; large soft circles anchor each section so the eye lands,
// settles, and the daily 16 minutes reads as a ritual — never as a dashboard.

import { type JSX, useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

type DrillPhase = 'idle' | 'graded' | 'pedagogy'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

.lab10-root {
  --cream: #faf4e8;
  --cream-deep: #f3ead8;
  --ink: #2b3450;
  --ink-soft: #5c6480;
  --ink-faint: #8b91a8;
  --sun: #f0b03c;
  --sun-deep: #c98a1b;
  --sun-wash: rgba(240, 176, 60, 0.16);
  --calm-green: #3e7c5b;
  --calm-green-wash: #e3efe6;
  --clay: #b9573f;
  --clay-wash: #f6e4dd;
  --card: #fffdf8;
  --line: rgba(43, 52, 80, 0.12);
  --shadow: 0 18px 40px -24px rgba(43, 52, 80, 0.28);
  --ease-inhale: cubic-bezier(0.32, 0, 0.18, 1);
  --ease-settle: cubic-bezier(0.22, 1.1, 0.36, 1);
  min-height: 100dvh;
  background: var(--cream);
  color: var(--ink);
  font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.55;
  position: relative;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.lab10-reset {
  background: none;
  border: none;
  margin: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

/* ---- large soft anchors ---------------------------------------- */

.lab10-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: lab10-bloom 1100ms var(--ease-settle) both;
}
.lab10-orb-sun {
  width: 520px;
  height: 520px;
  background: var(--sun-wash);
  top: -180px;
  right: -150px;
}
.lab10-orb-ink {
  width: 680px;
  height: 680px;
  background: rgba(43, 52, 80, 0.05);
  bottom: -340px;
  left: -260px;
  animation-delay: 120ms;
}
.lab10-orb-half {
  width: 360px;
  height: 360px;
  background: var(--cream-deep);
  top: 38%;
  left: -200px;
  animation-delay: 220ms;
}

.lab10-shell {
  position: relative;
  max-width: 880px;
  margin: 0 auto;
  padding: 40px 28px 88px;
}

/* ---- shared chrome ---------------------------------------------- */

.lab10-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 40px;
  animation: lab10-rise 700ms var(--ease-settle) both;
}
.lab10-date {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.lab10-streak {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  box-shadow: var(--shadow);
}
.lab10-streak-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--sun);
  animation: lab10-pulse 4s var(--ease-inhale) infinite;
}

.lab10-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--sun-deep);
  margin: 0 0 10px;
}

.lab10-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 28px;
  box-shadow: var(--shadow);
}

/* ---- home: hero -------------------------------------------------- */

.lab10-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 36px;
  margin-bottom: 48px;
  animation: lab10-rise 700ms 80ms var(--ease-settle) both;
}
.lab10-greeting {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.12;
  margin: 0 0 12px;
}
.lab10-hero-sub {
  font-size: 17px;
  color: var(--ink-soft);
  max-width: 380px;
  margin: 0;
}
.lab10-scorewell {
  position: relative;
  width: 218px;
  height: 218px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
}
.lab10-scorewell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}
.lab10-scorewell::after {
  content: '';
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  border: 2px solid var(--sun-wash);
  animation: lab10-breathe 6s var(--ease-inhale) infinite;
}
.lab10-score-body {
  position: relative;
  text-align: center;
}
.lab10-score-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin: 0 0 4px;
}
.lab10-score-num {
  font-size: 56px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  margin: 0;
}
.lab10-score-den {
  font-size: 20px;
  font-weight: 600;
  color: var(--ink-faint);
}
.lab10-score-delta {
  display: inline-block;
  margin-top: 10px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--calm-green);
  background: var(--calm-green-wash);
  border-radius: 999px;
  padding: 4px 12px;
}

/* ---- home: resume ------------------------------------------------ */

.lab10-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  padding: 24px 28px;
  margin-bottom: 52px;
  transition: transform 320ms var(--ease-settle), box-shadow 320ms var(--ease-settle);
  animation: lab10-rise 700ms 160ms var(--ease-settle) both;
}
.lab10-resume:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 48px -24px rgba(43, 52, 80, 0.36);
}
.lab10-resume:focus-visible {
  outline: 3px solid var(--sun);
  outline-offset: 3px;
}
.lab10-resume-kicker {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin: 0 0 6px;
}
.lab10-resume-line {
  font-size: 19px;
  font-weight: 700;
  margin: 0 0 4px;
}
.lab10-resume-meta {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 0;
}
.lab10-resume-go {
  flex-shrink: 0;
  background: var(--ink);
  color: var(--cream);
  border-radius: 999px;
  padding: 14px 26px;
  font-size: 15px;
  font-weight: 700;
}

/* ---- home: plan -------------------------------------------------- */

.lab10-section {
  margin-bottom: 52px;
  animation: lab10-rise 700ms var(--ease-settle) both;
}
.lab10-section:nth-of-type(1) { animation-delay: 240ms; }
.lab10-section:nth-of-type(2) { animation-delay: 340ms; }
.lab10-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.lab10-section-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0;
}
.lab10-section-aside {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-soft);
}
.lab10-plan {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.lab10-plan-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 22px 20px;
  transition: transform 320ms var(--ease-settle), box-shadow 320ms var(--ease-settle);
}
.lab10-plan-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 48px -24px rgba(43, 52, 80, 0.36);
}
.lab10-plan-item:focus-visible {
  outline: 3px solid var(--sun);
  outline-offset: 3px;
}
.lab10-plan-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.lab10-plan-kind {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sun-deep);
}
.lab10-plan-min {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
  background: var(--sun-wash);
  border-radius: 999px;
  padding: 3px 11px;
}
.lab10-plan-headline {
  font-size: 16.5px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
}
.lab10-plan-why {
  font-size: 13.5px;
  color: var(--ink-soft);
  margin: 0;
}

/* ---- home: traps ------------------------------------------------- */

.lab10-traps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lab10-trap {
  display: flex;
  align-items: center;
  gap: 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 16px 22px;
}
.lab10-trap-badge {
  flex-shrink: 0;
  width: 52px;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--ink);
  background: var(--cream-deep);
  border-radius: 12px;
  padding: 8px 0;
}
.lab10-trap-text {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.lab10-trap-count {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--clay);
  background: var(--clay-wash);
  border-radius: 999px;
  padding: 4px 12px;
}

/* ---- drill ------------------------------------------------------- */

.lab10-drill-head {
  margin-bottom: 28px;
  animation: lab10-rise 700ms var(--ease-settle) both;
}
.lab10-drill-progress {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-soft);
}
.lab10-headword {
  font-size: 52px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 6px 0 0;
}

.lab10-tactic {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: var(--sun-wash);
  border: 1px solid rgba(201, 138, 27, 0.25);
  border-radius: 22px;
  padding: 18px 22px;
  margin-bottom: 30px;
  animation: lab10-rise 700ms 120ms var(--ease-settle) both;
}
.lab10-tactic-mark {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--sun);
  display: grid;
  place-items: center;
  color: var(--ink);
  font-size: 16px;
  font-weight: 800;
}
.lab10-tactic-handle {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sun-deep);
  margin: 0 0 3px;
}
.lab10-tactic-move {
  font-size: 15.5px;
  font-weight: 500;
  margin: 0;
}

.lab10-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 34px;
}
.lab10-option {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  background: var(--card);
  border: 1.5px solid var(--line);
  border-radius: 18px;
  padding: 15px 20px;
  font-size: 17px;
  font-weight: 600;
  transition:
    transform 300ms var(--ease-settle),
    border-color 300ms var(--ease-inhale),
    background-color 300ms var(--ease-inhale),
    box-shadow 300ms var(--ease-settle);
  animation: lab10-rise 600ms var(--ease-settle) both;
}
.lab10-option:nth-child(1) { animation-delay: 180ms; }
.lab10-option:nth-child(2) { animation-delay: 240ms; }
.lab10-option:nth-child(3) { animation-delay: 300ms; }
.lab10-option:nth-child(4) { animation-delay: 360ms; }
.lab10-option:nth-child(5) { animation-delay: 420ms; }
.lab10-option:hover:enabled {
  transform: translateY(-2px);
  border-color: var(--ink-soft);
  box-shadow: var(--shadow);
}
.lab10-option:focus-visible {
  outline: 3px solid var(--sun);
  outline-offset: 3px;
}
.lab10-option:disabled { cursor: default; }
.lab10-option-key {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--cream-deep);
  font-size: 14px;
  font-weight: 800;
  text-transform: lowercase;
  transition: background-color 300ms var(--ease-inhale), color 300ms var(--ease-inhale);
}
.lab10-option-correct {
  border-color: var(--calm-green);
  background: var(--calm-green-wash);
  animation: lab10-exhale 900ms var(--ease-settle) both;
}
.lab10-option-correct .lab10-option-key {
  background: var(--calm-green);
  color: #fff;
}
.lab10-option-wrongpick {
  border-color: var(--clay);
  background: var(--clay-wash);
}
.lab10-option-wrongpick .lab10-option-key {
  background: var(--clay);
  color: #fff;
}
.lab10-option-dim { opacity: 0.45; }

.lab10-verdict {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border-radius: 999px;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin-bottom: 26px;
  animation: lab10-verdict-settle 700ms var(--ease-settle) both;
}
.lab10-verdict-ratt { background: var(--calm-green); color: #fff; }
.lab10-verdict-fel { background: var(--clay); color: #fff; }
.lab10-verdict-sub {
  font-weight: 600;
  letter-spacing: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* ---- pedagogy ---------------------------------------------------- */

.lab10-pedagogy {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.lab10-solution {
  background: var(--ink);
  color: var(--cream);
  border-radius: 24px;
  padding: 24px 28px;
  animation: lab10-rise 700ms var(--ease-settle) both;
}
.lab10-solution .lab10-eyebrow { color: var(--sun); }
.lab10-solution-text {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
}

.lab10-steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.lab10-step {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 22px 24px;
  animation: lab10-rise 700ms var(--ease-settle) both;
}
.lab10-step:nth-child(2) { animation-delay: 120ms; }
.lab10-step:nth-child(3) { animation-delay: 240ms; }
.lab10-step:nth-child(4) { animation-delay: 360ms; }
.lab10-step-num {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--sun-wash);
  color: var(--sun-deep);
  display: grid;
  place-items: center;
  font-size: 17px;
  font-weight: 800;
}
.lab10-step-title {
  font-size: 17px;
  font-weight: 800;
  margin: 0 0 6px;
}
.lab10-step-text {
  font-size: 15px;
  color: var(--ink-soft);
  margin: 0;
}

.lab10-distractors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.lab10-distractor {
  padding: 20px 22px;
  animation: lab10-rise 700ms var(--ease-settle) both;
}
.lab10-distractor:nth-child(1) { animation-delay: 100ms; }
.lab10-distractor:nth-child(2) { animation-delay: 200ms; }
.lab10-distractor:nth-child(3) { animation-delay: 300ms; }
.lab10-distractor:nth-child(4) { animation-delay: 400ms; }
.lab10-distractor-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.lab10-distractor-letter {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--clay-wash);
  color: var(--clay);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 800;
}
.lab10-distractor-word {
  font-size: 16px;
  font-weight: 800;
  margin: 0;
}
.lab10-distractor-block + .lab10-distractor-block { margin-top: 10px; }
.lab10-distractor-tag {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0 0 3px;
}
.lab10-tag-tempt { color: var(--sun-deep); }
.lab10-tag-wrong { color: var(--clay); }
.lab10-distractor-text {
  font-size: 13.5px;
  color: var(--ink-soft);
  margin: 0;
}

.lab10-next {
  align-self: center;
  background: var(--ink);
  color: var(--cream);
  border-radius: 999px;
  padding: 16px 38px;
  font-size: 16px;
  font-weight: 800;
  transition: transform 300ms var(--ease-settle), box-shadow 300ms var(--ease-settle);
  animation: lab10-rise 700ms 480ms var(--ease-settle) both;
}
.lab10-next:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 48px -24px rgba(43, 52, 80, 0.5);
}
.lab10-next:focus-visible {
  outline: 3px solid var(--sun);
  outline-offset: 3px;
}
.lab10-next-hint {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-faint);
  text-align: center;
  margin: -16px 0 0;
  animation: lab10-rise 700ms 560ms var(--ease-settle) both;
}

/* ---- motion ------------------------------------------------------ */

@keyframes lab10-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes lab10-bloom {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes lab10-breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.06); opacity: 1; }
}
@keyframes lab10-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.35); }
}
@keyframes lab10-exhale {
  0% { transform: scale(1); }
  35% { transform: scale(1.025); }
  100% { transform: scale(1); }
}
@keyframes lab10-verdict-settle {
  0% { opacity: 0; transform: translateY(10px) scale(0.94); }
  60% { transform: translateY(-2px) scale(1.015); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .lab10-root *,
  .lab10-root *::before,
  .lab10-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (max-width: 760px) {
  .lab10-hero { flex-direction: column-reverse; align-items: flex-start; }
  .lab10-plan { grid-template-columns: 1fr; }
  .lab10-distractors { grid-template-columns: 1fr; }
  .lab10-resume { flex-direction: column; align-items: flex-start; }
  .lab10-headword { font-size: 40px; }
  .lab10-greeting { font-size: 34px; }
}
`

const KEY_TO_LETTER: Record<string, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
  e: 'E',
}

function HomeScreen(): JSX.Element {
  return (
    <div className="lab10-shell">
      <header className="lab10-topbar">
        <span className="lab10-date">{HOME.dateLabel}</span>
        <span className="lab10-streak">
          <span className="lab10-streak-dot" />
          {HOME.streakDays} dagar i följd
        </span>
      </header>

      <section className="lab10-hero">
        <div>
          <h1 className="lab10-greeting">{HOME.greeting}.</h1>
          <p className="lab10-hero-sub">
            Dagens pass tar cirka {HOME.estimatedMinutes} minuter. Ett steg i taget — resten kan
            vänta.
          </p>
        </div>
        <div className="lab10-scorewell">
          <div className="lab10-score-body">
            <p className="lab10-score-label">Prognos</p>
            <p className="lab10-score-num">
              {HOME.projectedScore}
              <span className="lab10-score-den"> / 2.0</span>
            </p>
            <span className="lab10-score-delta">{HOME.scoreDelta}</span>
          </div>
        </div>
      </section>

      <button type="button" className="lab10-reset lab10-card lab10-resume">
        <span>
          <p className="lab10-resume-kicker">Fortsätt där du var</p>
          <p className="lab10-resume-line">
            {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
            {HOME.resume.total}
          </p>
          <p className="lab10-resume-meta">
            Pausad på {HOME.resume.device} kl. {HOME.resume.when}
          </p>
        </span>
        <span className="lab10-resume-go">Återuppta</span>
      </button>

      <section className="lab10-section">
        <div className="lab10-section-head">
          <h2 className="lab10-section-title">Dagens fokus</h2>
          <span className="lab10-section-aside">{HOME.estimatedMinutes} min · tre steg</span>
        </div>
        <div className="lab10-plan">
          {HOME.plan.map((item) => (
            <button type="button" key={item.id} className="lab10-reset lab10-card lab10-plan-item">
              <span className="lab10-plan-top">
                <span className="lab10-plan-kind">{item.kind}</span>
                <span className="lab10-plan-min">{item.minutes} min</span>
              </span>
              <span className="lab10-plan-headline">{item.headline}</span>
              <span className="lab10-plan-why">{item.rationale}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="lab10-section">
        <div className="lab10-section-head">
          <h2 className="lab10-section-title">Dina vanligaste fällor</h2>
          <span className="lab10-section-aside">senaste veckan</span>
        </div>
        <div className="lab10-traps">
          {HOME.traps.map((trap) => (
            <div key={trap.id} className="lab10-trap">
              <span className="lab10-trap-badge">{trap.section}</span>
              <p className="lab10-trap-text">{trap.headline}</p>
              <span className="lab10-trap-count">{trap.count} ggr</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function DrillScreen(): JSX.Element {
  const [phase, setPhase] = useState<DrillPhase>('idle')
  const [picked, setPicked] = useState<string | null>(null)

  const pick = (letter: string): void => {
    if (phase !== 'idle') return
    setPicked(letter)
    setPhase('graded')
  }

  const reset = (): void => {
    setPicked(null)
    setPhase('idle')
  }

  useEffect(() => {
    if (phase !== 'graded') return
    const t = window.setTimeout(() => setPhase('pedagogy'), 1300)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent): void => {
      const letter = KEY_TO_LETTER[ev.key.toLowerCase()]
      if (phase === 'idle' && letter !== undefined) {
        ev.preventDefault()
        pick(letter)
        return
      }
      if (phase === 'pedagogy' && ev.key === 'Enter') {
        ev.preventDefault()
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const isCorrect = picked === QUESTION.answer
  const showVerdict = phase === 'graded' || phase === 'pedagogy'

  return (
    <div className="lab10-shell">
      <header className="lab10-drill-head">
        <p className="lab10-eyebrow">
          {QUESTION.sectionLabel} · {QUESTION.section}
        </p>
        <span className="lab10-drill-progress">
          Fråga {QUESTION.number} av {QUESTION.total}
        </span>
        <h1 className="lab10-headword">{QUESTION.prompt}</h1>
      </header>

      <aside className="lab10-tactic">
        <span className="lab10-tactic-mark" aria-hidden="true">
          T
        </span>
        <div>
          <p className="lab10-tactic-handle">{EXPLANATION.pregradeTactic.handle}</p>
          <p className="lab10-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
        </div>
      </aside>

      {showVerdict ? (
        <div
          className={`lab10-verdict ${isCorrect ? 'lab10-verdict-ratt' : 'lab10-verdict-fel'}`}
          role="status"
        >
          {isCorrect ? 'RÄTT' : 'FEL'}
          <span className="lab10-verdict-sub">
            {isCorrect ? 'Lugnt och säkert — det sitter.' : 'Andas. Vi tittar på varför.'}
          </span>
        </div>
      ) : null}

      <div className="lab10-options">
        {QUESTION.options.map((opt) => {
          let stateClass = ''
          if (showVerdict) {
            if (opt.letter === QUESTION.answer) stateClass = 'lab10-option-correct'
            else if (opt.letter === picked) stateClass = 'lab10-option-wrongpick'
            else stateClass = 'lab10-option-dim'
          }
          return (
            <button
              type="button"
              key={opt.letter}
              className={`lab10-reset lab10-option ${stateClass}`}
              onClick={() => pick(opt.letter)}
              disabled={phase !== 'idle'}
            >
              <span className="lab10-option-key">{opt.letter.toLowerCase()}</span>
              {opt.text}
            </button>
          )
        })}
      </div>

      {phase === 'pedagogy' ? (
        <div className="lab10-pedagogy">
          <section className="lab10-solution">
            <p className="lab10-eyebrow">Lösning</p>
            <p className="lab10-solution-text">{EXPLANATION.solution}</p>
          </section>

          <section>
            <p className="lab10-eyebrow">Så tänker du</p>
            <div className="lab10-steps">
              {EXPLANATION.steps.map((step) => (
                <div key={step.n} className="lab10-card lab10-step">
                  <span className="lab10-step-num">{step.n}</span>
                  <div>
                    <h3 className="lab10-step-title">{step.title}</h3>
                    <p className="lab10-step-text">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="lab10-eyebrow">Varför de andra lockar</p>
            <div className="lab10-distractors">
              {EXPLANATION.distractors.map((d) => (
                <div key={d.letter} className="lab10-card lab10-distractor">
                  <div className="lab10-distractor-head">
                    <span className="lab10-distractor-letter">{d.letter}</span>
                    <p className="lab10-distractor-word">{d.text}</p>
                  </div>
                  <div className="lab10-distractor-block">
                    <p className="lab10-distractor-tag lab10-tag-tempt">Därför lockar det</p>
                    <p className="lab10-distractor-text">{d.whyTempting}</p>
                  </div>
                  <div className="lab10-distractor-block">
                    <p className="lab10-distractor-tag lab10-tag-wrong">Därför är det fel</p>
                    <p className="lab10-distractor-text">{d.whyWrong}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button type="button" className="lab10-reset lab10-next" onClick={reset}>
            Nästa fråga
          </button>
          <p className="lab10-next-hint">eller tryck Enter</p>
        </div>
      ) : null}
    </div>
  )
}

export function Lab10({ screen }: { screen: RedesignScreen }): JSX.Element {
  return (
    <div className="lab10-root">
      <style>{CSS}</style>
      <div className="lab10-orb lab10-orb-sun" aria-hidden="true" />
      <div className="lab10-orb lab10-orb-ink" aria-hidden="true" />
      <div className="lab10-orb lab10-orb-half" aria-hidden="true" />
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}
