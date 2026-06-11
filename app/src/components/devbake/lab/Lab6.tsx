// Studio 6 — design thesis: "SJÖKORTET" (the nautical chart).
// Training toward 2.0 is rendered as navigation: a deep ink-green chart field with
// hairline graticules, brass plotting accents, mono coordinates and a serif logbook
// voice — a calm instrument for charting a course, never a dashboard or a toy.

import { useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Spline+Sans+Mono:wght@400;500;600&display=swap');

.lab6-root {
  --ink: #0c2123;
  --ink-2: #11292c;
  --ink-3: #163337;
  --line: rgba(216, 226, 213, 0.13);
  --line-soft: rgba(216, 226, 213, 0.07);
  --foam: #e9e4d3;
  --foam-dim: rgba(233, 228, 211, 0.62);
  --foam-faint: rgba(233, 228, 211, 0.38);
  --brass: #d9a441;
  --brass-deep: #b9852b;
  --green: #6fb285;
  --red: #d4604a;
  min-height: 100dvh;
  background:
    radial-gradient(1200px 600px at 78% -10%, rgba(217, 164, 65, 0.07), transparent 60%),
    linear-gradient(180deg, var(--ink) 0%, #0a1c1e 100%);
  background-color: var(--ink);
  color: var(--foam);
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 340;
  -webkit-font-smoothing: antialiased;
  position: relative;
  overflow-x: hidden;
}
.lab6-root::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--line-soft) 1px, transparent 1px),
    linear-gradient(90deg, var(--line-soft) 1px, transparent 1px);
  background-size: 88px 88px;
  mask-image: linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.25) 70%, transparent);
}
.lab6-reset {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.lab6-mono {
  font-family: 'Spline Sans Mono', 'SFMono-Regular', monospace;
}
.lab6-shell {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  padding: 44px 56px 96px;
}
.lab6-topbar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line);
}
.lab6-wordmark {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--brass);
}
.lab6-coords {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--foam-faint);
}

/* ---------- entrance choreography ---------- */
@keyframes lab6-surface {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.lab6-enter {
  animation: lab6-surface 0.62s cubic-bezier(0.22, 0.9, 0.3, 1) both;
}
@keyframes lab6-draw {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes lab6-fix {
  0%   { transform: scale(2.1); opacity: 0; }
  62%  { transform: scale(0.94); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* ---------- home ---------- */
.lab6-greeting-block { padding: 44px 0 36px; }
.lab6-greeting {
  font-size: 46px;
  font-weight: 360;
  font-variation-settings: 'opsz' 110;
  letter-spacing: -0.012em;
  line-height: 1.05;
  margin: 0;
}
.lab6-date {
  margin-top: 10px;
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--foam-faint);
}
.lab6-home-grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 22px;
  align-items: start;
}
.lab6-card {
  border: 1px solid var(--line);
  background: linear-gradient(180deg, var(--ink-2), rgba(17, 41, 44, 0.4));
  padding: 26px 28px;
}
.lab6-card-label {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--brass);
  margin: 0 0 18px;
}
.lab6-chartcard { grid-column: 1; }
.lab6-score-row {
  display: flex;
  align-items: baseline;
  gap: 18px;
  flex-wrap: wrap;
}
.lab6-score {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 84px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.03em;
}
.lab6-score-of {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 15px;
  color: var(--foam-faint);
  letter-spacing: 0.08em;
}
.lab6-delta {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  color: var(--green);
  letter-spacing: 0.04em;
}
.lab6-course {
  margin-top: 26px;
  position: relative;
  height: 56px;
}
.lab6-course-track {
  position: absolute;
  left: 0; right: 0; top: 26px;
  height: 1px;
  background: var(--line);
}
.lab6-course-run {
  position: absolute;
  left: 0; top: 26px;
  height: 1px;
  width: 70%;
  background: linear-gradient(90deg, rgba(217,164,65,0.25), var(--brass));
  transform-origin: left center;
  animation: lab6-draw 1.1s 0.35s cubic-bezier(0.3, 0.8, 0.2, 1) both;
}
.lab6-course-fix {
  position: absolute;
  top: 26px;
  width: 11px; height: 11px;
  border: 1.5px solid var(--brass);
  background: var(--ink);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: lab6-fix 0.5s 1.35s cubic-bezier(0.3, 1.4, 0.4, 1) both;
}
.lab6-course-fix::after {
  content: '';
  position: absolute;
  inset: 2.5px;
  border-radius: 50%;
  background: var(--brass);
}
.lab6-course-tick {
  position: absolute;
  top: 20px;
  width: 1px; height: 13px;
  background: var(--line);
}
.lab6-course-num {
  position: absolute;
  top: 40px;
  transform: translateX(-50%);
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  color: var(--foam-faint);
  letter-spacing: 0.08em;
}
.lab6-course-num-target { color: var(--brass); }
.lab6-streak-row {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--line-soft);
  display: flex;
  align-items: center;
  gap: 14px;
}
.lab6-streak-marks { display: flex; gap: 5px; }
.lab6-streak-mark {
  width: 4px; height: 16px;
  background: var(--brass);
  opacity: 0.85;
}
.lab6-streak-text {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.1em;
  color: var(--foam-dim);
}

.lab6-resume {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-left: 3px solid var(--brass);
}
.lab6-resume-line {
  font-size: 20px;
  font-weight: 380;
  line-height: 1.4;
  margin: 0;
}
.lab6-resume-meta {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--foam-faint);
}
.lab6-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  align-self: flex-start;
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink);
  background: var(--brass);
  padding: 13px 22px;
  transition: background 0.18s ease, transform 0.18s ease;
}
.lab6-btn:hover { background: #e6b659; transform: translateY(-1px); }
.lab6-btn:active { transform: translateY(0); }
.lab6-btn-arrow { font-weight: 400; }

.lab6-plan { grid-column: 1; }
.lab6-plan-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}
.lab6-plan-total {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--foam-dim);
}
.lab6-plan-item {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 20px;
  align-items: baseline;
  padding: 18px 0;
  border-top: 1px solid var(--line-soft);
}
.lab6-plan-item:first-of-type { border-top: 0; padding-top: 6px; }
.lab6-plan-min {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 22px;
  color: var(--brass);
}
.lab6-plan-min small {
  font-size: 11px;
  color: var(--foam-faint);
  margin-left: 3px;
}
.lab6-plan-headline {
  font-size: 18px;
  font-weight: 400;
  margin: 0 0 5px;
}
.lab6-plan-rationale {
  font-size: 14.5px;
  font-style: italic;
  color: var(--foam-dim);
  margin: 0;
  line-height: 1.5;
}
.lab6-kind {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--foam-faint);
  border: 1px solid var(--line);
  padding: 4px 9px;
}

.lab6-traps { grid-column: 2; }
.lab6-trap {
  display: flex;
  gap: 16px;
  align-items: baseline;
  padding: 15px 0;
  border-top: 1px solid var(--line-soft);
}
.lab6-trap:first-of-type { border-top: 0; padding-top: 4px; }
.lab6-trap-sec {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--ink);
  background: var(--foam-dim);
  padding: 3px 8px;
  flex-shrink: 0;
}
.lab6-trap-headline {
  flex: 1;
  font-size: 15.5px;
  line-height: 1.5;
  margin: 0;
}
.lab6-trap-count {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  color: var(--red);
  flex-shrink: 0;
}

/* ---------- drill ---------- */
.lab6-drill-head {
  padding: 38px 0 8px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
}
.lab6-drill-sec {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--foam-dim);
}
.lab6-drill-pos {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--foam-faint);
}
.lab6-tactic {
  margin: 22px 0 34px;
  padding: 20px 24px;
  border: 1px dashed rgba(217, 164, 65, 0.45);
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  align-items: baseline;
}
.lab6-tactic-handle {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--brass);
  white-space: nowrap;
}
.lab6-tactic-move {
  font-size: 16.5px;
  font-style: italic;
  line-height: 1.55;
  margin: 0;
  color: var(--foam);
}
.lab6-prompt {
  font-size: 64px;
  font-weight: 380;
  font-variation-settings: 'opsz' 144;
  letter-spacing: -0.01em;
  margin: 0 0 8px;
}
.lab6-prompt-sub {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--foam-faint);
  margin-bottom: 30px;
}
.lab6-options {
  display: grid;
  gap: 10px;
  max-width: 760px;
}
.lab6-opt {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid var(--line);
  background: var(--ink-2);
  font-size: 19px;
  transition: border-color 0.16s ease, background 0.16s ease, opacity 0.3s ease, transform 0.16s ease;
}
.lab6-opt:hover:enabled { border-color: var(--brass); transform: translateX(3px); }
.lab6-opt:disabled { cursor: default; }
.lab6-opt-letter {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  width: 30px; height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  color: var(--foam-dim);
}
.lab6-opt-correct {
  border-color: var(--green);
  background: rgba(111, 178, 133, 0.1);
}
.lab6-opt-correct .lab6-opt-letter {
  border-color: var(--green);
  background: var(--green);
  color: var(--ink);
}
.lab6-opt-wrong {
  border-color: var(--red);
  background: rgba(212, 96, 74, 0.1);
}
.lab6-opt-wrong .lab6-opt-letter {
  border-color: var(--red);
  background: var(--red);
  color: var(--ink);
}
.lab6-opt-dim { opacity: 0.42; }
.lab6-verdict {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.22em;
  animation: lab6-fix 0.42s cubic-bezier(0.3, 1.5, 0.4, 1) both;
}
.lab6-verdict-ratt { color: var(--green); }
.lab6-verdict-fel { color: var(--red); }
.lab6-stamp {
  display: inline-block;
  margin: 30px 0 4px;
  padding: 10px 20px;
  border: 2px solid currentColor;
  font-family: 'Spline Sans Mono', monospace;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.3em;
  transform: rotate(-1.6deg);
  animation: lab6-fix 0.5s 0.08s cubic-bezier(0.3, 1.4, 0.4, 1) both;
}
.lab6-stamp-ratt { color: var(--green); }
.lab6-stamp-fel { color: var(--red); }

.lab6-pedagogy { margin-top: 30px; max-width: 880px; }
.lab6-solution {
  border-left: 3px solid var(--brass);
  padding: 18px 24px;
  background: var(--ink-2);
  font-size: 19px;
  line-height: 1.6;
  margin: 0 0 36px;
}
.lab6-section-head {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--brass);
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.lab6-section-head::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}
.lab6-step {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 18px;
  padding: 18px 0;
  border-top: 1px solid var(--line-soft);
}
.lab6-step:first-of-type { border-top: 0; }
.lab6-step-n {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 24px;
  color: var(--brass);
  line-height: 1.15;
}
.lab6-step-title {
  font-size: 19px;
  font-weight: 480;
  margin: 0 0 7px;
}
.lab6-step-tier {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--foam-faint);
  margin-left: 10px;
}
.lab6-step-text {
  font-size: 16px;
  line-height: 1.68;
  color: var(--foam-dim);
  margin: 0;
}
.lab6-distractors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 4px;
}
.lab6-dis {
  border: 1px solid var(--line);
  background: var(--ink-2);
  padding: 18px 20px;
}
.lab6-dis-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}
.lab6-dis-letter {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--red);
}
.lab6-dis-text { font-size: 17px; font-weight: 440; }
.lab6-dis-label {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--foam-faint);
  margin: 0 0 4px;
}
.lab6-dis-body {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--foam-dim);
  margin: 0 0 12px;
}
.lab6-dis-body:last-child { margin-bottom: 0; }
.lab6-next-row {
  margin-top: 40px;
  display: flex;
  align-items: center;
  gap: 18px;
}
.lab6-key-hint {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11.5px;
  letter-spacing: 0.12em;
  color: var(--foam-faint);
}

@media (max-width: 1080px) {
  .lab6-shell { padding: 32px 32px 72px; }
  .lab6-home-grid { grid-template-columns: 1fr; }
  .lab6-chartcard, .lab6-resume, .lab6-plan, .lab6-traps { grid-column: 1; }
  .lab6-greeting { font-size: 38px; }
  .lab6-prompt { font-size: 48px; }
  .lab6-distractors { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .lab6-root *, .lab6-root *::before, .lab6-root *::after {
    animation-duration: 0.001s !important;
    animation-delay: 0s !important;
    transition-duration: 0.001s !important;
  }
}
`

function CourseChart() {
  const score = Number.parseFloat(HOME.projectedScore)
  const pct = (score / 2) * 100
  const ticks = [0, 0.5, 1.0, 1.5, 2.0]
  return (
    <div className="lab6-course" aria-hidden="true">
      <div className="lab6-course-track" />
      <div className="lab6-course-run" style={{ width: `${pct}%` }} />
      {ticks.map((t) => (
        <span key={t}>
          <span className="lab6-course-tick" style={{ left: `${(t / 2) * 100}%` }} />
          <span
            className={`lab6-course-num lab6-mono${t === 2 ? ' lab6-course-num-target' : ''}`}
            style={{ left: `${(t / 2) * 100}%` }}
          >
            {t.toFixed(1)}
          </span>
        </span>
      ))}
      <span className="lab6-course-fix" style={{ left: `${pct}%` }} />
    </div>
  )
}

function HomeScreen() {
  return (
    <>
      <header className="lab6-greeting-block lab6-enter">
        <h1 className="lab6-greeting">{HOME.greeting}.</h1>
        <div className="lab6-date">{HOME.dateLabel}</div>
      </header>
      <div className="lab6-home-grid">
        <section
          className="lab6-card lab6-chartcard lab6-enter"
          style={{ animationDelay: '0.08s' }}
        >
          <h2 className="lab6-card-label">Prognos</h2>
          <div className="lab6-score-row">
            <span className="lab6-score">{HOME.projectedScore}</span>
            <span className="lab6-score-of">/ 2.0</span>
            <span className="lab6-delta">{HOME.scoreDelta}</span>
          </div>
          <CourseChart />
          <div className="lab6-streak-row">
            <span className="lab6-streak-marks" aria-hidden="true">
              {Array.from({ length: HOME.streakDays }, (_, i) => `dag-${i + 1}`).map((id) => (
                <span key={id} className="lab6-streak-mark" />
              ))}
            </span>
            <span className="lab6-streak-text">{HOME.streakDays} dagar i följd</span>
          </div>
        </section>

        <section className="lab6-card lab6-resume lab6-enter" style={{ animationDelay: '0.16s' }}>
          <h2 className="lab6-card-label">Pausad session</h2>
          <p className="lab6-resume-line">
            {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
            {HOME.resume.total}
          </p>
          <span className="lab6-resume-meta">
            Pausad på {HOME.resume.device} kl {HOME.resume.when}
          </span>
          <button type="button" className="lab6-reset lab6-btn">
            Återuppta <span className="lab6-btn-arrow">&rarr;</span>
          </button>
        </section>

        <section className="lab6-card lab6-plan lab6-enter" style={{ animationDelay: '0.24s' }}>
          <div className="lab6-plan-head">
            <h2 className="lab6-card-label">Dagens kurs</h2>
            <span className="lab6-plan-total">~{HOME.estimatedMinutes} min totalt</span>
          </div>
          {HOME.plan.map((item) => (
            <div key={item.id} className="lab6-plan-item">
              <span className="lab6-plan-min">
                {item.minutes}
                <small>min</small>
              </span>
              <div>
                <h3 className="lab6-plan-headline">{item.headline}</h3>
                <p className="lab6-plan-rationale">{item.rationale}</p>
              </div>
              <span className="lab6-kind">{item.kind}</span>
            </div>
          ))}
        </section>

        <section className="lab6-card lab6-traps lab6-enter" style={{ animationDelay: '0.32s' }}>
          <h2 className="lab6-card-label">Dina fällor just nu</h2>
          {HOME.traps.map((trap) => (
            <div key={trap.id} className="lab6-trap">
              <span className="lab6-trap-sec">{trap.section}</span>
              <p className="lab6-trap-headline">{trap.headline}</p>
              <span className="lab6-trap-count">&times;{trap.count}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}

function DrillScreen() {
  const [picked, setPicked] = useState<string | null>(null)
  const graded = picked !== null
  const wasCorrect = picked === QUESTION.answer

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (picked === null) {
        const k = e.key.toLowerCase()
        const letter = k.toUpperCase()
        if (k.length === 1 && k >= 'a' && k <= 'e') {
          if (QUESTION.options.some((o) => o.letter === letter)) setPicked(letter)
        }
      } else if (e.key === 'Enter') {
        setPicked(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked])

  return (
    <>
      <div className="lab6-drill-head lab6-enter">
        <span className="lab6-drill-sec">
          {QUESTION.sectionLabel} · {QUESTION.section}
        </span>
        <span className="lab6-drill-pos">
          Fråga {QUESTION.number} / {QUESTION.total}
        </span>
      </div>

      <div className="lab6-tactic lab6-enter" style={{ animationDelay: '0.08s' }}>
        <span className="lab6-tactic-handle">{EXPLANATION.pregradeTactic.handle}</span>
        <p className="lab6-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
      </div>

      <div className="lab6-enter" style={{ animationDelay: '0.16s' }}>
        <h1 className="lab6-prompt">{QUESTION.prompt}</h1>
        <div className="lab6-prompt-sub">Välj det ord som ligger närmast i betydelse</div>
      </div>

      <div className="lab6-options lab6-enter" style={{ animationDelay: '0.24s' }}>
        {QUESTION.options.map((opt) => {
          const isCorrect = graded && opt.letter === QUESTION.answer
          const isWrongPick = graded && opt.letter === picked && opt.letter !== QUESTION.answer
          const isDim = graded && !isCorrect && !isWrongPick
          const cls = [
            'lab6-reset',
            'lab6-opt',
            isCorrect ? 'lab6-opt-correct' : '',
            isWrongPick ? 'lab6-opt-wrong' : '',
            isDim ? 'lab6-opt-dim' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={opt.letter}
              type="button"
              className={cls}
              disabled={graded}
              onClick={() => setPicked(opt.letter)}
            >
              <span className="lab6-opt-letter">{opt.letter}</span>
              <span>{opt.text}</span>
              {isCorrect && <span className="lab6-verdict lab6-verdict-ratt">RÄTT SVAR</span>}
              {isWrongPick && <span className="lab6-verdict lab6-verdict-fel">DITT VAL</span>}
            </button>
          )
        })}
      </div>

      {graded && (
        <div className="lab6-pedagogy">
          <div className={`lab6-stamp ${wasCorrect ? 'lab6-stamp-ratt' : 'lab6-stamp-fel'}`}>
            {wasCorrect ? 'RÄTT' : 'FEL'}
          </div>

          <div className="lab6-enter" style={{ animationDelay: '0.18s' }}>
            <p className="lab6-solution">{EXPLANATION.solution}</p>
          </div>

          <div className="lab6-enter" style={{ animationDelay: '0.3s' }}>
            <h2 className="lab6-section-head">Loggbok · tre steg</h2>
            {EXPLANATION.steps.map((step) => (
              <div key={step.n} className="lab6-step">
                <span className="lab6-step-n">{step.n}</span>
                <div>
                  <h3 className="lab6-step-title">
                    {step.title}
                    <span className="lab6-step-tier">
                      {step.tier === 'essential' ? 'kärna' : 'fördjupning'}
                    </span>
                  </h3>
                  <p className="lab6-step-text">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lab6-enter" style={{ animationDelay: '0.42s' }}>
            <h2 className="lab6-section-head">Varför de andra lockar</h2>
            <div className="lab6-distractors">
              {EXPLANATION.distractors.map((dis) => (
                <div key={dis.letter} className="lab6-dis">
                  <div className="lab6-dis-head">
                    <span className="lab6-dis-letter">{dis.letter}</span>
                    <span className="lab6-dis-text">{dis.text}</span>
                  </div>
                  <p className="lab6-dis-label">Därför lockar det</p>
                  <p className="lab6-dis-body">{dis.whyTempting}</p>
                  <p className="lab6-dis-label">Därför är det fel</p>
                  <p className="lab6-dis-body">{dis.whyWrong}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lab6-next-row lab6-enter" style={{ animationDelay: '0.54s' }}>
            <button type="button" className="lab6-reset lab6-btn" onClick={() => setPicked(null)}>
              Nästa fråga <span className="lab6-btn-arrow">&rarr;</span>
            </button>
            <span className="lab6-key-hint">eller tryck Enter</span>
          </div>
        </div>
      )}

      {!graded && (
        <div className="lab6-next-row lab6-enter" style={{ animationDelay: '0.32s' }}>
          <span className="lab6-key-hint">Tryck A–E för att svara</span>
        </div>
      )}
    </>
  )
}

export function Lab6({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab6-root">
      <style>{STYLE}</style>
      <div className="lab6-shell">
        <div className="lab6-topbar lab6-enter">
          <span className="lab6-wordmark">HP-Coach</span>
          <span className="lab6-coords">
            {screen === 'home' ? 'Kurs mot 2.0' : `${QUESTION.qid}`}
          </span>
        </div>
        {screen === 'home' ? <HomeScreen /> : <DrillScreen key="drill" />}
      </div>
    </div>
  )
}
