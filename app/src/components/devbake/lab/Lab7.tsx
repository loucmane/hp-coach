// Lab7 — "Träningsdagboken" (The Training Log)
//
// Thesis: every study session is a logged effort — minutes, streaks and scores
// are earned numbers set big and proud, like a sports diary, never decoration.
// One ember accent does all the work of celebration on a calm paper ground;
// the grading moment lands like a personal best flashing up after a hard rep.

import { useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

.lab7-root {
  --ground: #f3f1ec;
  --card: #ffffff;
  --ink: #191510;
  --muted: #6f6759;
  --line: #e3ddd2;
  --line-strong: #cfc7b8;
  --accent: #d8361b;
  --accent-deep: #a92510;
  --accent-soft: #fbe9e4;
  --num: 'Barlow Condensed', 'Arial Narrow', sans-serif;
  --body: 'Barlow', 'Helvetica Neue', sans-serif;
  min-height: 100dvh;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.lab7-reset {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.lab7-shell {
  max-width: 900px;
  margin: 0 auto;
  padding: 28px 24px 72px;
}

/* ---------- motion system ---------- */

@keyframes lab7Rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes lab7Slam {
  0% { opacity: 0; transform: scale(1.18); }
  55% { opacity: 1; transform: scale(0.97); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes lab7Wipe {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes lab7Pulse {
  0% { box-shadow: 0 0 0 0 rgba(216, 54, 27, 0.45); }
  100% { box-shadow: 0 0 0 14px rgba(216, 54, 27, 0); }
}

.lab7-in {
  animation: lab7Rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .lab7-root *,
  .lab7-root *::before,
  .lab7-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ---------- shared ---------- */

.lab7-eyebrow {
  font-family: var(--num);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.lab7-rule {
  height: 3px;
  background: var(--ink);
  margin: 10px 0 0;
  transform-origin: left;
  animation: lab7Wipe 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lab7-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.lab7-chip {
  display: inline-block;
  font-family: var(--num);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 8px;
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  color: var(--muted);
  background: var(--ground);
}

/* ---------- home ---------- */

.lab7-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.lab7-greeting {
  font-family: var(--num);
  font-weight: 700;
  font-size: 38px;
  line-height: 1.05;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
.lab7-date {
  font-size: 15px;
  color: var(--muted);
  font-weight: 500;
}

.lab7-stats {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  margin-top: 22px;
}
.lab7-stat {
  background: var(--card);
  padding: 18px 20px 16px;
}
.lab7-stat-label {
  font-family: var(--num);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--muted);
}
.lab7-stat-value {
  font-family: var(--num);
  font-weight: 700;
  font-size: 56px;
  line-height: 1;
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
}
.lab7-stat-value small {
  font-size: 24px;
  font-weight: 600;
  color: var(--muted);
  margin-left: 2px;
}
.lab7-stat-sub {
  margin-top: 6px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--accent-deep);
}
.lab7-stat-sub--plain { color: var(--muted); font-weight: 500; }

.lab7-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding: 18px 20px;
  border-left: 4px solid var(--accent);
}
.lab7-resume-kicker {
  font-family: var(--num);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--accent-deep);
}
.lab7-resume-line {
  font-family: var(--num);
  font-weight: 600;
  font-size: 22px;
  margin-top: 2px;
}
.lab7-resume-meta {
  font-size: 13.5px;
  color: var(--muted);
  margin-top: 2px;
}
.lab7-cta {
  font-family: var(--num);
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--accent);
  color: #fff;
  padding: 12px 26px;
  border-radius: 6px;
  transition: background 0.15s ease, transform 0.15s ease;
}
.lab7-cta:hover { background: var(--accent-deep); }
.lab7-cta:active { transform: scale(0.98); }
.lab7-cta:focus-visible { outline: 3px solid var(--accent-deep); outline-offset: 2px; }

.lab7-section { margin-top: 34px; }
.lab7-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.lab7-plan { margin-top: 14px; overflow: hidden; }
.lab7-plan-row {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 18px;
  padding: 16px 20px;
  align-items: center;
}
.lab7-plan-row + .lab7-plan-row { border-top: 1px solid var(--line); }
.lab7-plan-min {
  font-family: var(--num);
  font-weight: 700;
  font-size: 40px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.lab7-plan-min small {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 2px;
}
.lab7-plan-headline {
  font-weight: 700;
  font-size: 16.5px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.lab7-plan-rationale {
  font-size: 14px;
  color: var(--muted);
  margin-top: 3px;
}

.lab7-traps { margin-top: 14px; overflow: hidden; }
.lab7-trap-row {
  display: grid;
  grid-template-columns: 64px 70px 1fr;
  gap: 16px;
  align-items: center;
  padding: 14px 20px;
}
.lab7-trap-row + .lab7-trap-row { border-top: 1px solid var(--line); }
.lab7-trap-count {
  font-family: var(--num);
  font-weight: 700;
  font-size: 34px;
  line-height: 1;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.lab7-trap-count small {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
.lab7-trap-headline { font-size: 15px; font-weight: 500; }

/* ---------- drill ---------- */

.lab7-drill-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.lab7-progress {
  font-family: var(--num);
  font-weight: 700;
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}
.lab7-progress small { color: var(--muted); font-weight: 600; }

.lab7-headword {
  font-family: var(--num);
  font-weight: 700;
  font-size: 72px;
  line-height: 1;
  margin-top: 26px;
  letter-spacing: 0.005em;
}
.lab7-headword-sub {
  font-size: 14px;
  color: var(--muted);
  margin-top: 6px;
}

.lab7-tactic {
  margin-top: 20px;
  padding: 14px 18px;
  border-left: 4px solid var(--accent);
  display: flex;
  gap: 14px;
  align-items: baseline;
  flex-wrap: wrap;
}
.lab7-tactic-handle {
  font-family: var(--num);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-deep);
  white-space: nowrap;
}
.lab7-tactic-move { font-size: 15px; flex: 1; min-width: 240px; }

.lab7-options {
  margin-top: 22px;
  display: grid;
  gap: 8px;
}
.lab7-option {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 13px 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 17px;
  font-weight: 500;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}
.lab7-option:hover:enabled { border-color: var(--ink); transform: translateX(2px); }
.lab7-option:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.lab7-option:disabled { cursor: default; }
.lab7-key {
  font-family: var(--num);
  font-weight: 700;
  font-size: 17px;
  text-transform: uppercase;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1.5px solid var(--line-strong);
  border-radius: 6px;
  color: var(--muted);
}
.lab7-option--correct {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  animation: lab7Pulse 0.9s ease-out 1;
}
.lab7-option--correct .lab7-key { border-color: rgba(255,255,255,0.6); color: #fff; }
.lab7-option--missed {
  border-color: var(--ink);
  background: var(--ground);
  color: var(--muted);
}
.lab7-option--dim { opacity: 0.5; }
.lab7-flag {
  font-family: var(--num);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.lab7-verdict {
  margin-top: 24px;
  padding: 18px 22px;
  border-radius: 10px;
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
  animation: lab7Slam 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.lab7-verdict--ratt { background: var(--accent); color: #fff; }
.lab7-verdict--fel { background: var(--ink); color: #fff; }
.lab7-verdict-word {
  font-family: var(--num);
  font-weight: 700;
  font-size: 44px;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.lab7-verdict-note { font-size: 15px; opacity: 0.92; flex: 1; min-width: 220px; }

.lab7-ped { margin-top: 26px; }
.lab7-solution {
  padding: 16px 20px;
  font-size: 16.5px;
  font-weight: 600;
  border-left: 4px solid var(--ink);
}
.lab7-steps { margin-top: 18px; display: grid; gap: 10px; }
.lab7-step { padding: 16px 20px; display: grid; grid-template-columns: 40px 1fr; gap: 14px; }
.lab7-step-n {
  font-family: var(--num);
  font-weight: 700;
  font-size: 28px;
  line-height: 1.1;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.lab7-step-title { font-weight: 700; font-size: 16px; }
.lab7-step-text { font-size: 15px; color: #3c352b; margin-top: 4px; }

.lab7-distractors { margin-top: 18px; display: grid; gap: 10px; }
.lab7-distractor { padding: 14px 18px; }
.lab7-distractor-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-weight: 700;
  font-size: 15.5px;
}
.lab7-distractor-letter {
  font-family: var(--num);
  font-weight: 700;
  font-size: 16px;
  color: var(--accent-deep);
}
.lab7-why { font-size: 14.5px; margin-top: 6px; }
.lab7-why b {
  font-family: var(--num);
  font-weight: 600;
  font-size: 12.5px;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--muted);
  display: block;
  margin-bottom: 1px;
}

.lab7-next-row { margin-top: 26px; display: flex; align-items: center; gap: 14px; }
.lab7-kbd-hint { font-size: 13px; color: var(--muted); }

@media (max-width: 640px) {
  .lab7-stats { grid-template-columns: 1fr; }
  .lab7-headword { font-size: 52px; }
  .lab7-greeting { font-size: 30px; }
  .lab7-trap-row { grid-template-columns: 56px 64px 1fr; }
}
`

const KEY_TO_INDEX: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 }

function Home() {
  return (
    <div className="lab7-shell">
      <header className="lab7-in" style={{ animationDelay: '0ms' }}>
        <div className="lab7-masthead">
          <h1 className="lab7-greeting">{HOME.greeting}</h1>
          <span className="lab7-date">{HOME.dateLabel}</span>
        </div>
        <div className="lab7-rule" />
      </header>

      <section
        className="lab7-stats lab7-in"
        style={{ animationDelay: '70ms' }}
        aria-label="Dagens nyckeltal"
      >
        <div className="lab7-stat">
          <div className="lab7-stat-label">Beräknad poäng</div>
          <div className="lab7-stat-value">
            {HOME.projectedScore}
            <small>/2.0</small>
          </div>
          <div className="lab7-stat-sub">{HOME.scoreDelta}</div>
        </div>
        <div className="lab7-stat">
          <div className="lab7-stat-label">Svit</div>
          <div className="lab7-stat-value">{HOME.streakDays}</div>
          <div className="lab7-stat-sub lab7-stat-sub--plain">dagar i rad</div>
        </div>
        <div className="lab7-stat">
          <div className="lab7-stat-label">Dagens pass</div>
          <div className="lab7-stat-value">
            {HOME.estimatedMinutes}
            <small>min</small>
          </div>
          <div className="lab7-stat-sub lab7-stat-sub--plain">{HOME.plan.length} moment</div>
        </div>
      </section>

      <section
        className="lab7-card lab7-resume lab7-in"
        style={{ animationDelay: '140ms' }}
        aria-label="Pausat pass"
      >
        <div>
          <div className="lab7-resume-kicker">Pausat pass</div>
          <div className="lab7-resume-line">
            {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
            {HOME.resume.total}
          </div>
          <div className="lab7-resume-meta">
            Pausad på {HOME.resume.device} kl. {HOME.resume.when}
          </div>
        </div>
        <button type="button" className="lab7-reset lab7-cta">
          Fortsätt passet
        </button>
      </section>

      <section className="lab7-section lab7-in" style={{ animationDelay: '210ms' }}>
        <div className="lab7-section-head">
          <h2 className="lab7-eyebrow">Dagens träningspass</h2>
          <span className="lab7-date">~{HOME.estimatedMinutes} min totalt</span>
        </div>
        <div className="lab7-card lab7-plan">
          {HOME.plan.map((item) => (
            <div key={item.id} className="lab7-plan-row">
              <div className="lab7-plan-min">
                {item.minutes}
                <small>min</small>
              </div>
              <div>
                <div className="lab7-plan-headline">
                  {item.section !== null ? <span className="lab7-chip">{item.section}</span> : null}
                  <span className="lab7-chip">{item.kind}</span>
                  {item.headline}
                </div>
                <div className="lab7-plan-rationale">{item.rationale}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="lab7-section lab7-in" style={{ animationDelay: '280ms' }}>
        <div className="lab7-section-head">
          <h2 className="lab7-eyebrow">Dina vanligaste fällor</h2>
          <span className="lab7-date">senaste veckan</span>
        </div>
        <div className="lab7-card lab7-traps">
          {HOME.traps.map((trap) => (
            <div key={trap.id} className="lab7-trap-row">
              <div className="lab7-trap-count">
                {trap.count}
                <small>ggr</small>
              </div>
              <span className="lab7-chip">{trap.section}</span>
              <div className="lab7-trap-headline">{trap.headline}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Drill() {
  const [picked, setPicked] = useState<string | null>(null)
  const graded = picked !== null
  const isCorrect = picked === QUESTION.answer

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (!graded && k in KEY_TO_INDEX) {
        const opt = QUESTION.options[KEY_TO_INDEX[k]]
        if (opt !== undefined) setPicked(opt.letter)
      } else if (graded && e.key === 'Enter') {
        setPicked(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graded])

  return (
    <div className="lab7-shell">
      <header className="lab7-in" style={{ animationDelay: '0ms' }}>
        <div className="lab7-drill-top">
          <span className="lab7-eyebrow">
            {QUESTION.section} · {QUESTION.sectionLabel}
          </span>
          <span className="lab7-progress">
            {QUESTION.number}
            <small> / {QUESTION.total}</small>
          </span>
        </div>
        <div className="lab7-rule" />
      </header>

      <h1 className="lab7-headword lab7-in" style={{ animationDelay: '60ms' }}>
        {QUESTION.prompt}
      </h1>
      <p className="lab7-headword-sub lab7-in" style={{ animationDelay: '90ms' }}>
        Vilket alternativ ligger närmast i betydelse?
      </p>

      <aside
        className="lab7-card lab7-tactic lab7-in"
        style={{ animationDelay: '130ms' }}
        aria-label="Taktik"
      >
        <span className="lab7-tactic-handle">Taktik · {EXPLANATION.pregradeTactic.handle}</span>
        <span className="lab7-tactic-move">{EXPLANATION.pregradeTactic.move}</span>
      </aside>

      <div className="lab7-options lab7-in" style={{ animationDelay: '190ms' }}>
        {QUESTION.options.map((opt) => {
          const isAnswer = opt.letter === QUESTION.answer
          const isPick = opt.letter === picked
          let cls = 'lab7-reset lab7-option'
          if (graded) {
            if (isAnswer) cls += ' lab7-option--correct'
            else if (isPick) cls += ' lab7-option--missed'
            else cls += ' lab7-option--dim'
          }
          return (
            <button
              key={opt.letter}
              type="button"
              className={cls}
              disabled={graded}
              onClick={() => setPicked(opt.letter)}
            >
              <span className="lab7-key">{opt.letter}</span>
              <span>{opt.text}</span>
              {graded && isAnswer ? <span className="lab7-flag">Rätt svar</span> : null}
              {graded && isPick && !isAnswer ? <span className="lab7-flag">Ditt svar</span> : null}
            </button>
          )
        })}
      </div>

      {graded ? (
        <>
          <div
            className={`lab7-verdict ${isCorrect ? 'lab7-verdict--ratt' : 'lab7-verdict--fel'}`}
            role="status"
          >
            <span className="lab7-verdict-word">{isCorrect ? 'Rätt' : 'Fel'}</span>
            <span className="lab7-verdict-note">
              {isCorrect
                ? 'Stark insats — loggad. Gå igenom resonemanget så sitter det nästa gång också.'
                : `Du valde ${picked}. Rätt svar är ${QUESTION.answer} — gå igenom resonemanget nedan.`}
            </span>
          </div>

          <section className="lab7-ped" aria-label="Genomgång">
            <div className="lab7-card lab7-solution lab7-in" style={{ animationDelay: '180ms' }}>
              {EXPLANATION.solution}
            </div>

            <h2 className="lab7-eyebrow lab7-in" style={{ animationDelay: '260ms', marginTop: 26 }}>
              Resonemanget i tre steg
            </h2>
            <div className="lab7-steps">
              {EXPLANATION.steps.map((step, i) => (
                <div
                  key={step.n}
                  className="lab7-card lab7-step lab7-in"
                  style={{ animationDelay: `${320 + i * 90}ms` }}
                >
                  <div className="lab7-step-n">{step.n}</div>
                  <div>
                    <div className="lab7-step-title">{step.title}</div>
                    <div className="lab7-step-text">{step.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="lab7-eyebrow lab7-in" style={{ animationDelay: '620ms', marginTop: 26 }}>
              Därför lockar de andra alternativen
            </h2>
            <div className="lab7-distractors">
              {EXPLANATION.distractors.map((d, i) => (
                <div
                  key={d.letter}
                  className="lab7-card lab7-distractor lab7-in"
                  style={{ animationDelay: `${680 + i * 90}ms` }}
                >
                  <div className="lab7-distractor-head">
                    <span className="lab7-distractor-letter">{d.letter}</span>
                    <span>{d.text}</span>
                  </div>
                  <div className="lab7-why">
                    <b>Varför det lockar</b>
                    {d.whyTempting}
                  </div>
                  <div className="lab7-why">
                    <b>Varför det är fel</b>
                    {d.whyWrong}
                  </div>
                </div>
              ))}
            </div>

            <div className="lab7-next-row lab7-in" style={{ animationDelay: '1040ms' }}>
              <button type="button" className="lab7-reset lab7-cta" onClick={() => setPicked(null)}>
                Nästa fråga
              </button>
              <span className="lab7-kbd-hint">eller tryck Enter</span>
            </div>
          </section>
        </>
      ) : (
        <p className="lab7-kbd-hint lab7-in" style={{ animationDelay: '260ms', marginTop: 18 }}>
          Svara med tangenterna a–e eller klicka på ett alternativ.
        </p>
      )}
    </div>
  )
}

export function Lab7({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab7-root">
      <style>{STYLE}</style>
      {screen === 'home' ? <Home /> : <Drill key={screen} />}
    </div>
  )
}
