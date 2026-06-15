// Studio 3 — thesis: "LÄSESALEN" (The Reading Room)
// A Scandinavian university reading room rendered as software: warm archival paper,
// ink-and-vermilion typography, ledger hairlines and a literal grading stamp —
// the calm seriousness of an exam booklet, not a dashboard.

import { useCallback, useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

type Letter = (typeof QUESTION.options)[number]['letter']
type Phase = 'idle' | 'graded'

const KEY_TO_INDEX: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 }

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Instrument+Sans:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap');

.lab3-root {
  --paper: #f3eee2;
  --paper-deep: #eae2cf;
  --paper-card: #faf6ec;
  --ink: #221c12;
  --ink-soft: #6e6450;
  --ink-faint: #a89c82;
  --rule: #d8cdb4;
  --vermilion: #bc3a1a;
  --moss: #2e6647;
  --moss-wash: #e3ead9;
  --vermilion-wash: #f2ddd3;
  min-height: 100dvh;
  background:
    radial-gradient(1200px 600px at 75% -10%, rgba(188, 58, 26, 0.05), transparent 60%),
    repeating-linear-gradient(0deg, rgba(34, 28, 18, 0.018) 0 1px, transparent 1px 56px),
    var(--paper);
  color: var(--ink);
  font-family: 'Instrument Sans', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.lab3-reset {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: inherit;
  cursor: pointer;
  appearance: none;
}
.lab3-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 36px 48px 96px;
}

/* ---------- masthead ---------- */
.lab3-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ink);
}
.lab3-wordmark {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 19px;
  letter-spacing: 0.01em;
}
.lab3-wordmark em {
  font-style: italic;
  font-weight: 400;
  color: var(--vermilion);
}
.lab3-mast-meta {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

/* ---------- shared bits ---------- */
.lab3-kicker {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--vermilion);
  display: flex;
  align-items: center;
  gap: 10px;
}
.lab3-kicker::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--rule);
}
.lab3-rise {
  animation: lab3-rise 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes lab3-rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.lab3-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 22px;
  background: var(--ink);
  color: var(--paper-card);
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.04em;
  border-radius: 999px;
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), background 0.18s ease;
}
.lab3-btn:hover { background: var(--vermilion); transform: translateY(-1px); }
.lab3-btn:active { transform: translateY(0); }
.lab3-btn:focus-visible { outline: 2px solid var(--vermilion); outline-offset: 3px; }
.lab3-btn--quiet {
  background: transparent;
  color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
.lab3-btn--quiet:hover { background: var(--ink); color: var(--paper-card); }

/* ---------- HOME ---------- */
.lab3-home-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 56px;
  margin-top: 44px;
}
.lab3-home-rail { display: flex; flex-direction: column; gap: 36px; }
.lab3-greeting {
  font-family: 'Fraunces', serif;
  font-weight: 500;
  font-size: 40px;
  line-height: 1.08;
  letter-spacing: -0.01em;
}
.lab3-datestamp {
  margin-top: 10px;
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.lab3-scoreplate {
  border-top: 1px solid var(--ink);
  border-bottom: 1px solid var(--rule);
  padding: 22px 0 26px;
}
.lab3-score-row { display: flex; align-items: baseline; gap: 12px; }
.lab3-score-big {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 104px;
  line-height: 0.9;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.lab3-score-max {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 16px;
  color: var(--ink-faint);
}
.lab3-score-delta {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  color: var(--moss);
}
.lab3-score-delta::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--moss);
}
.lab3-streak {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding-top: 18px;
}
.lab3-streak-n {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 34px;
  font-variant-numeric: tabular-nums;
}
.lab3-streak-label { font-size: 14px; color: var(--ink-soft); }
.lab3-streak-ticks { display: flex; gap: 4px; margin-top: 12px; }
.lab3-tick {
  width: 18px;
  height: 4px;
  background: var(--ink);
  border-radius: 2px;
  transform-origin: left center;
  animation: lab3-tick 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes lab3-tick {
  from { transform: scaleX(0); opacity: 0; }
  to { transform: scaleX(1); opacity: 1; }
}
.lab3-resume {
  background: var(--paper-card);
  border: 1px solid var(--rule);
  border-left: 3px solid var(--vermilion);
  border-radius: 4px;
  padding: 20px 22px;
  box-shadow: 0 1px 0 rgba(34, 28, 18, 0.05);
}
.lab3-resume-kicker {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--vermilion);
}
.lab3-resume-line {
  margin-top: 8px;
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 500;
}
.lab3-resume-meta {
  margin-top: 4px;
  font-size: 13px;
  color: var(--ink-soft);
}
.lab3-resume .lab3-btn { margin-top: 16px; }

.lab3-home-main { display: flex; flex-direction: column; gap: 48px; min-width: 0; }
.lab3-plan-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 14px;
}
.lab3-plan-title {
  font-family: 'Fraunces', serif;
  font-weight: 500;
  font-size: 27px;
}
.lab3-plan-clock {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  color: var(--ink-soft);
}
.lab3-ledger { margin-top: 18px; border-top: 1px solid var(--ink); }
.lab3-ledger-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 20px;
  align-items: baseline;
  width: 100%;
  padding: 18px 4px;
  border-bottom: 1px solid var(--rule);
  transition: background 0.18s ease;
}
.lab3-ledger-row:hover { background: var(--paper-deep); }
.lab3-ledger-row:focus-visible { outline: 2px solid var(--vermilion); outline-offset: -2px; }
.lab3-ledger-n {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 21px;
  color: var(--ink-faint);
}
.lab3-ledger-headline { font-weight: 600; font-size: 16px; }
.lab3-ledger-headline .lab3-tag { margin-left: 10px; }
.lab3-ledger-why { margin-top: 3px; font-size: 14px; color: var(--ink-soft); }
.lab3-ledger-min {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 14px;
  color: var(--ink);
  white-space: nowrap;
}
.lab3-plan-foot { margin-top: 22px; display: flex; gap: 14px; }
.lab3-tag {
  display: inline-block;
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  padding: 2px 8px;
  border: 1px solid var(--ink-faint);
  border-radius: 3px;
  color: var(--ink-soft);
  vertical-align: 2px;
}
.lab3-traps { margin-top: 14px; display: flex; flex-direction: column; gap: 12px; }
.lab3-trap {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 18px;
  align-items: center;
  background: var(--paper-card);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 16px 20px;
}
.lab3-trap-section {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--vermilion);
  font-weight: 500;
}
.lab3-trap-headline { font-size: 15px; font-weight: 500; }
.lab3-trap-count {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 13px;
  color: var(--ink-soft);
  white-space: nowrap;
}

/* ---------- DRILL ---------- */
.lab3-drill-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 720px);
  gap: 64px;
  justify-content: center;
  margin-top: 44px;
}
.lab3-drill-rail { display: flex; flex-direction: column; gap: 28px; }
.lab3-drill-meta {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lab3-drill-meta strong { color: var(--ink); font-weight: 500; }
.lab3-progress { display: flex; gap: 5px; margin-top: 4px; }
.lab3-progress span {
  width: 22px;
  height: 3px;
  background: var(--rule);
  border-radius: 2px;
}
.lab3-progress .lab3-on { background: var(--ink); }
.lab3-tactic {
  background: var(--paper-card);
  border: 1px solid var(--rule);
  border-top: 3px solid var(--ink);
  border-radius: 4px;
  padding: 20px 22px;
}
.lab3-tactic-kicker {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.lab3-tactic-handle {
  margin-top: 8px;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 21px;
}
.lab3-tactic-move {
  margin-top: 10px;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink-soft);
}
.lab3-keyhint {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  color: var(--ink-faint);
}
.lab3-keyhint kbd {
  font: inherit;
  border: 1px solid var(--rule);
  border-bottom-width: 2px;
  border-radius: 4px;
  padding: 1px 6px;
  background: var(--paper-card);
}

.lab3-booklet { min-width: 0; }
.lab3-headword-wrap { position: relative; margin-top: 18px; }
.lab3-headword {
  font-family: 'Fraunces', serif;
  font-weight: 500;
  font-size: 72px;
  line-height: 1;
  letter-spacing: -0.015em;
}
.lab3-headword-sub { margin-top: 10px; font-size: 14px; color: var(--ink-soft); }
.lab3-stamp {
  position: absolute;
  top: -16px;
  right: 0;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 30px;
  letter-spacing: 0.1em;
  padding: 8px 20px;
  border: 3px double currentColor;
  border-radius: 6px;
  transform: rotate(-7deg);
  animation: lab3-stamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.lab3-stamp--ratt { color: var(--moss); background: var(--moss-wash); }
.lab3-stamp--fel { color: var(--vermilion); background: var(--vermilion-wash); }
@keyframes lab3-stamp {
  0% { opacity: 0; transform: rotate(-7deg) scale(1.9); }
  60% { opacity: 1; transform: rotate(-7deg) scale(0.94); }
  100% { opacity: 1; transform: rotate(-7deg) scale(1); }
}
.lab3-options { margin-top: 34px; display: flex; flex-direction: column; border-top: 1px solid var(--ink); }
.lab3-option {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 18px;
  align-items: center;
  width: 100%;
  padding: 17px 6px;
  border-bottom: 1px solid var(--rule);
  transition: background 0.16s ease, padding-left 0.16s ease;
}
.lab3-option:not(:disabled):hover { background: var(--paper-deep); padding-left: 14px; }
.lab3-option:focus-visible { outline: 2px solid var(--vermilion); outline-offset: -2px; }
.lab3-option:disabled { cursor: default; }
.lab3-option-letter {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 14px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ink-faint);
  border-radius: 50%;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.lab3-option-text { font-size: 18px; font-weight: 500; }
.lab3-option-verdict {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
}
.lab3-option--correct { background: var(--moss-wash); }
.lab3-option--correct .lab3-option-letter { background: var(--moss); border-color: var(--moss); color: var(--paper-card); }
.lab3-option--correct .lab3-option-verdict { color: var(--moss); }
.lab3-option--wrongpick { background: var(--vermilion-wash); animation: lab3-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
.lab3-option--wrongpick .lab3-option-letter { background: var(--vermilion); border-color: var(--vermilion); color: var(--paper-card); }
.lab3-option--wrongpick .lab3-option-verdict { color: var(--vermilion); }
.lab3-option--dim { opacity: 0.45; }
@keyframes lab3-shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60% { transform: translateX(3px); }
}

.lab3-pedagogy { margin-top: 48px; display: flex; flex-direction: column; gap: 40px; }
.lab3-solution {
  background: var(--paper-card);
  border: 1px solid var(--rule);
  border-left: 3px solid var(--moss);
  border-radius: 4px;
  padding: 22px 26px;
  font-family: 'Fraunces', serif;
  font-size: 19px;
  line-height: 1.55;
}
.lab3-steps { margin-top: 16px; display: flex; flex-direction: column; }
.lab3-step {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 20px;
  padding: 22px 4px;
  border-bottom: 1px solid var(--rule);
}
.lab3-step:first-of-type { border-top: 1px solid var(--ink); }
.lab3-step-n {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 26px;
  color: var(--ink-faint);
  line-height: 1.1;
}
.lab3-step-title {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 19px;
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.lab3-step-text { margin-top: 8px; font-size: 15px; line-height: 1.65; color: #43392a; }
.lab3-distractors { margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.lab3-distractor {
  background: var(--paper-card);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 20px 22px;
}
.lab3-distractor-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 17px;
}
.lab3-distractor-head .lab3-d-letter {
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px;
  color: var(--vermilion);
}
.lab3-d-block { margin-top: 12px; font-size: 14px; line-height: 1.6; color: #43392a; }
.lab3-d-label {
  display: block;
  font-family: 'Spline Sans Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 3px;
}
.lab3-d-label--tempt { color: var(--vermilion); }
.lab3-d-label--wrong { color: var(--moss); }
.lab3-next-row {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-top: 8px;
}

@media (max-width: 1020px) {
  .lab3-shell { padding: 28px 28px 80px; }
  .lab3-home-grid { grid-template-columns: 1fr; gap: 40px; }
  .lab3-drill-grid { grid-template-columns: 1fr; gap: 36px; }
  .lab3-headword { font-size: 54px; }
  .lab3-distractors { grid-template-columns: 1fr; }
  .lab3-score-big { font-size: 84px; }
}

@media (prefers-reduced-motion: reduce) {
  .lab3-root *, .lab3-root *::before, .lab3-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
`

function Masthead({ meta }: { meta: string }) {
  return (
    <header className="lab3-masthead lab3-rise">
      <div className="lab3-wordmark">
        HP-Coach <em>Läsesalen</em>
      </div>
      <div className="lab3-mast-meta">{meta}</div>
    </header>
  )
}

function HomeScreen() {
  return (
    <div className="lab3-shell">
      <Masthead meta={HOME.dateLabel} />
      <div className="lab3-home-grid">
        <aside className="lab3-home-rail">
          <div className="lab3-rise" style={{ animationDelay: '60ms' }}>
            <h1 className="lab3-greeting">{HOME.greeting}.</h1>
            <p className="lab3-datestamp">{HOME.dateLabel}</p>
          </div>

          <section className="lab3-scoreplate lab3-rise" style={{ animationDelay: '140ms' }}>
            <div className="lab3-kicker">Prognos</div>
            <div className="lab3-score-row" style={{ marginTop: 18 }}>
              <span className="lab3-score-big">{HOME.projectedScore}</span>
              <span className="lab3-score-max">/ 2.0</span>
            </div>
            <div className="lab3-score-delta">{HOME.scoreDelta}</div>
            <div className="lab3-streak">
              <span className="lab3-streak-n">{HOME.streakDays}</span>
              <span className="lab3-streak-label">dagar i rad</span>
            </div>
            <div className="lab3-streak-ticks" aria-hidden="true">
              {Array.from({ length: HOME.streakDays }, (_, i) => (
                <span
                  key={`tick-${String(i)}`}
                  className="lab3-tick"
                  style={{ animationDelay: `${String(200 + i * 45)}ms` }}
                />
              ))}
            </div>
          </section>

          <section className="lab3-resume lab3-rise" style={{ animationDelay: '220ms' }}>
            <div className="lab3-resume-kicker">Pausad session</div>
            <div className="lab3-resume-line">
              {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
              {HOME.resume.total}
            </div>
            <div className="lab3-resume-meta">
              Pausad på {HOME.resume.device} kl. {HOME.resume.when}
            </div>
            <button type="button" className="lab3-reset lab3-btn">
              Återuppta där du var
            </button>
          </section>
        </aside>

        <main className="lab3-home-main">
          <section className="lab3-rise" style={{ animationDelay: '160ms' }}>
            <div className="lab3-kicker">Dagens pass</div>
            <div className="lab3-plan-head">
              <h2 className="lab3-plan-title">Det här räcker idag.</h2>
              <span className="lab3-plan-clock">ca {HOME.estimatedMinutes} min totalt</span>
            </div>
            <div className="lab3-ledger">
              {HOME.plan.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className="lab3-reset lab3-ledger-row lab3-rise"
                  style={{ animationDelay: `${String(240 + i * 90)}ms` }}
                >
                  <span className="lab3-ledger-n">{i + 1}.</span>
                  <span>
                    <span className="lab3-ledger-headline">
                      {item.headline}
                      {item.section ? <span className="lab3-tag">{item.section}</span> : null}
                    </span>
                    <span className="lab3-ledger-why">{item.rationale}</span>
                  </span>
                  <span className="lab3-ledger-min">{item.minutes} min</span>
                </button>
              ))}
            </div>
            <div className="lab3-plan-foot lab3-rise" style={{ animationDelay: '520ms' }}>
              <button type="button" className="lab3-reset lab3-btn">
                Starta dagens pass
              </button>
            </div>
          </section>

          <section className="lab3-rise" style={{ animationDelay: '320ms' }}>
            <div className="lab3-kicker">Dina fällor just nu</div>
            <div className="lab3-traps">
              {HOME.traps.map((trap, i) => (
                <article
                  key={trap.id}
                  className="lab3-trap lab3-rise"
                  style={{ animationDelay: `${String(400 + i * 90)}ms` }}
                >
                  <span className="lab3-trap-section">{trap.section}</span>
                  <span className="lab3-trap-headline">{trap.headline}</span>
                  <span className="lab3-trap-count">×{trap.count}</span>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function DrillScreen() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [picked, setPicked] = useState<Letter | null>(null)
  const [round, setRound] = useState(0)

  const pick = useCallback(
    (letter: Letter) => {
      if (phase !== 'idle') return
      setPicked(letter)
      setPhase('graded')
    },
    [phase],
  )

  const reset = useCallback(() => {
    setPicked(null)
    setPhase('idle')
    setRound((r) => r + 1)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (phase === 'idle' && key in KEY_TO_INDEX) {
        const option = QUESTION.options[KEY_TO_INDEX[key]]
        if (option) pick(option.letter)
      } else if (phase === 'graded' && e.key === 'Enter') {
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, pick, reset])

  const isCorrect = picked === QUESTION.answer
  const graded = phase === 'graded'

  return (
    <div className="lab3-shell" key={round}>
      <Masthead meta={`${QUESTION.sectionLabel} · ${QUESTION.section}`} />
      <div className="lab3-drill-grid">
        <aside className="lab3-drill-rail">
          <div className="lab3-drill-meta lab3-rise" style={{ animationDelay: '60ms' }}>
            <span>
              <strong>{QUESTION.sectionLabel}</strong>
            </span>
            <span>
              Fråga {QUESTION.number} av {QUESTION.total}
            </span>
            <div className="lab3-progress" aria-hidden="true">
              {Array.from({ length: QUESTION.total }, (_, i) => (
                <span key={`p-${String(i)}`} className={i < QUESTION.number ? 'lab3-on' : ''} />
              ))}
            </div>
          </div>

          <section className="lab3-tactic lab3-rise" style={{ animationDelay: '140ms' }}>
            <div className="lab3-tactic-kicker">Taktik före svar</div>
            <div className="lab3-tactic-handle">{EXPLANATION.pregradeTactic.handle}</div>
            <p className="lab3-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
          </section>

          <p className="lab3-keyhint lab3-rise" style={{ animationDelay: '220ms' }}>
            Svara med <kbd>A</kbd>–<kbd>E</kbd>
            {graded ? (
              <>
                {' '}
                · <kbd>Enter</kbd> för nästa
              </>
            ) : null}
          </p>
        </aside>

        <main className="lab3-booklet">
          <div className="lab3-kicker lab3-rise">Vilket ord ligger närmast?</div>
          <div className="lab3-headword-wrap lab3-rise" style={{ animationDelay: '80ms' }}>
            <h1 className="lab3-headword">{QUESTION.prompt}</h1>
            <p className="lab3-headword-sub">Välj det alternativ som ligger närmast i betydelse.</p>
            {graded ? (
              <div className={`lab3-stamp ${isCorrect ? 'lab3-stamp--ratt' : 'lab3-stamp--fel'}`}>
                {isCorrect ? 'RÄTT' : 'FEL'}
              </div>
            ) : null}
          </div>

          <div className="lab3-options">
            {QUESTION.options.map((option, i) => {
              const isAnswer = option.letter === QUESTION.answer
              const isPicked = option.letter === picked
              let cls = 'lab3-reset lab3-option lab3-rise'
              if (graded) {
                if (isAnswer) cls += ' lab3-option--correct'
                else if (isPicked) cls += ' lab3-option--wrongpick'
                else cls += ' lab3-option--dim'
              }
              return (
                <button
                  key={option.letter}
                  type="button"
                  className={cls}
                  style={{ animationDelay: `${String(160 + i * 60)}ms` }}
                  disabled={graded}
                  onClick={() => pick(option.letter)}
                >
                  <span className="lab3-option-letter">{option.letter}</span>
                  <span className="lab3-option-text">{option.text}</span>
                  <span className="lab3-option-verdict">
                    {graded && isAnswer ? 'Rätt svar' : null}
                    {graded && isPicked && !isAnswer ? 'Ditt val' : null}
                  </span>
                </button>
              )
            })}
          </div>

          {graded ? (
            <div className="lab3-pedagogy">
              <section className="lab3-rise" style={{ animationDelay: '180ms' }}>
                <div className="lab3-kicker">Lösningen</div>
                <p className="lab3-solution" style={{ marginTop: 16 }}>
                  {EXPLANATION.solution}
                </p>
              </section>

              <section className="lab3-rise" style={{ animationDelay: '320ms' }}>
                <div className="lab3-kicker">Så tänker du</div>
                <div className="lab3-steps">
                  {EXPLANATION.steps.map((step, i) => (
                    <div
                      key={step.n}
                      className="lab3-step lab3-rise"
                      style={{ animationDelay: `${String(380 + i * 110)}ms` }}
                    >
                      <span className="lab3-step-n">{step.n}.</span>
                      <div>
                        <h3 className="lab3-step-title">
                          {step.title}
                          <span className="lab3-tag">
                            {step.tier === 'essential' ? 'Kärna' : 'Fördjupning'}
                          </span>
                        </h3>
                        <p className="lab3-step-text">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="lab3-rise" style={{ animationDelay: '640ms' }}>
                <div className="lab3-kicker">Varje fel alternativ lockar dig</div>
                <div className="lab3-distractors">
                  {EXPLANATION.distractors.map((d, i) => (
                    <article
                      key={d.letter}
                      className="lab3-distractor lab3-rise"
                      style={{ animationDelay: `${String(700 + i * 90)}ms` }}
                    >
                      <div className="lab3-distractor-head">
                        <span className="lab3-d-letter">{d.letter}</span>
                        {d.text}
                      </div>
                      <p className="lab3-d-block">
                        <span className="lab3-d-label lab3-d-label--tempt">Varför det lockar</span>
                        {d.whyTempting}
                      </p>
                      <p className="lab3-d-block">
                        <span className="lab3-d-label lab3-d-label--wrong">Varför det är fel</span>
                        {d.whyWrong}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <div className="lab3-next-row lab3-rise" style={{ animationDelay: '1060ms' }}>
                <button type="button" className="lab3-reset lab3-btn" onClick={reset}>
                  Nästa fråga
                </button>
                <span className="lab3-keyhint">
                  eller tryck <kbd>Enter</kbd>
                </span>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export function Lab3({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab3-root">
      <style>{STYLE}</style>
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}
