// Studio 2 — design thesis: "OBSERVATORIEDÄCK" (the observatory deck).
// Training toward a perfect 2.0 is celestial navigation: fixed reference
// points, quiet darkness, exact instrument readings. The UI is a night-watch
// instrument panel — deep blue-black field, warm ivory ink, serif gravity
// (Fraunces) for the words being studied, monospaced phosphor-amber readouts
// (IBM Plex Mono) for every number the student steers by.

import { useEffect, useMemo, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

.lab2-root {
  --bg: #0a0f1a;
  --panel: #101726;
  --panel-2: #0d1320;
  --line: #1f2b44;
  --line-soft: #182236;
  --ink: #e9e4d6;
  --dim: #8b94a7;
  --faint: #5b6478;
  --amber: #e5a845;
  --amber-dim: rgba(229, 168, 69, 0.14);
  --green: #57c28b;
  --green-dim: rgba(87, 194, 139, 0.12);
  --red: #e0635c;
  --red-dim: rgba(224, 99, 92, 0.12);
  --serif: 'Fraunces', Georgia, serif;
  --mono: 'IBM Plex Mono', ui-monospace, monospace;
  --sans: 'IBM Plex Sans', system-ui, sans-serif;
  min-height: 100dvh;
  background: var(--bg);
  background-image: radial-gradient(1100px 520px at 78% -10%, rgba(229, 168, 69, 0.06), transparent 60%);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.lab2-reset {
  appearance: none;
  background: none;
  border: none;
  margin: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.lab2-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 48px 40px 96px;
}
.lab2-rise {
  opacity: 0;
  transform: translateY(14px);
  animation: lab2-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--d, 0s);
}
@keyframes lab2-rise {
  to { opacity: 1; transform: translateY(0); }
}

/* ---------- shared furniture ---------- */
.lab2-topline {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 14px;
  margin-bottom: 40px;
}
.lab2-wordmark {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--amber);
}
.lab2-topmeta {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--faint);
  text-transform: uppercase;
}
.lab2-tag {
  display: inline-block;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dim);
}
.lab2-panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
}

/* ---------- HOME ---------- */
.lab2-home-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 32px;
  margin-bottom: 44px;
}
.lab2-date {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--amber);
  margin-bottom: 10px;
}
.lab2-greeting {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 44px;
  line-height: 1.08;
  letter-spacing: -0.01em;
  margin: 0;
}
.lab2-gauges {
  display: flex;
  gap: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel-2);
  overflow: hidden;
  flex-shrink: 0;
}
.lab2-gauge {
  padding: 18px 26px 16px;
  min-width: 150px;
}
.lab2-gauge + .lab2-gauge { border-left: 1px solid var(--line); }
.lab2-gauge-val {
  font-family: var(--mono);
  font-size: 34px;
  font-weight: 600;
  line-height: 1;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.lab2-gauge-val em {
  font-style: normal;
  font-size: 16px;
  color: var(--faint);
  font-weight: 400;
}
.lab2-gauge-sub {
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--dim);
}
.lab2-gauge-sub strong { color: var(--green); font-weight: 500; }
.lab2-gauge--score .lab2-gauge-val { color: var(--amber); }

.lab2-home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}
.lab2-col { display: grid; gap: 28px; }

.lab2-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  padding: 22px 26px;
  border: 1px solid rgba(229, 168, 69, 0.35);
  border-radius: 10px;
  background: linear-gradient(135deg, var(--amber-dim), rgba(229, 168, 69, 0.03));
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.lab2-resume:hover { border-color: var(--amber); transform: translateY(-1px); }
.lab2-resume-kicker {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--amber);
  margin-bottom: 8px;
}
.lab2-resume-line {
  font-family: var(--serif);
  font-size: 21px;
  font-weight: 500;
}
.lab2-resume-meta {
  margin-top: 6px;
  font-size: 13px;
  color: var(--dim);
}
.lab2-resume-go {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #0a0f1a;
  background: var(--amber);
  border-radius: 7px;
  padding: 12px 20px;
  white-space: nowrap;
}

.lab2-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 18px 26px 0;
}
.lab2-section-title {
  font-family: var(--serif);
  font-size: 19px;
  font-weight: 500;
  margin: 0;
}
.lab2-plan-list { padding: 8px 0 10px; }
.lab2-plan-row {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: 18px;
  align-items: baseline;
  padding: 16px 26px;
}
.lab2-plan-row + .lab2-plan-row { border-top: 1px solid var(--line-soft); }
.lab2-plan-min {
  font-family: var(--mono);
  font-size: 20px;
  font-weight: 600;
  color: var(--amber);
  font-variant-numeric: tabular-nums;
}
.lab2-plan-min em { font-style: normal; font-size: 11px; color: var(--faint); font-weight: 400; }
.lab2-plan-headline { font-weight: 600; font-size: 15px; }
.lab2-plan-rationale { margin-top: 3px; font-size: 13px; color: var(--dim); }
.lab2-plan-start {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dim);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 7px 14px;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.lab2-plan-start:hover { color: var(--amber); border-color: var(--amber); }

.lab2-trap-list { padding: 8px 0 10px; }
.lab2-trap-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  padding: 16px 26px;
}
.lab2-trap-row + .lab2-trap-row { border-top: 1px solid var(--line-soft); }
.lab2-trap-badge {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--red);
  border: 1px solid rgba(224, 99, 92, 0.4);
  background: var(--red-dim);
  border-radius: 5px;
  padding: 4px 8px;
  margin-top: 1px;
  white-space: nowrap;
}
.lab2-trap-headline { font-size: 14px; line-height: 1.5; }
.lab2-trap-count {
  margin-top: 4px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--faint);
}

/* ---------- DRILL ---------- */
.lab2-drill-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 36px;
  align-items: start;
}
.lab2-drill-meta {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 26px;
}
.lab2-drill-pos {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--faint);
}
.lab2-headword {
  font-family: var(--serif);
  font-size: 64px;
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1;
  margin: 0 0 10px;
}
.lab2-drill-ask { color: var(--dim); font-size: 14px; margin-bottom: 30px; }

.lab2-options { display: grid; gap: 10px; }
.lab2-option {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 15px 18px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel);
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}
.lab2-option:hover:not(:disabled) { border-color: var(--amber); transform: translateX(3px); }
.lab2-option:disabled { cursor: default; }
.lab2-opt-letter {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--dim);
  border: 1px solid var(--line);
  border-radius: 6px;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
}
.lab2-opt-text { font-size: 16.5px; }
.lab2-opt-verdict {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.16em;
}
.lab2-option--correct {
  border-color: rgba(87, 194, 139, 0.55);
  background: linear-gradient(90deg, var(--green-dim), var(--panel) 70%);
}
.lab2-option--correct .lab2-opt-letter { color: var(--green); border-color: rgba(87, 194, 139, 0.55); }
.lab2-option--correct .lab2-opt-verdict { color: var(--green); }
.lab2-option--wrong {
  border-color: rgba(224, 99, 92, 0.55);
  background: linear-gradient(90deg, var(--red-dim), var(--panel) 70%);
  animation: lab2-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
.lab2-option--wrong .lab2-opt-letter { color: var(--red); border-color: rgba(224, 99, 92, 0.55); }
.lab2-option--wrong .lab2-opt-verdict { color: var(--red); }
.lab2-option--faded { opacity: 0.42; }
@keyframes lab2-shake {
  10%, 90% { transform: translateX(-2px); }
  30%, 70% { transform: translateX(3px); }
  50% { transform: translateX(-3px); }
}

.lab2-tactic {
  border-left: 2px solid var(--amber);
  background: var(--panel-2);
  border-radius: 0 10px 10px 0;
  padding: 20px 24px;
}
.lab2-tactic-kicker {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--amber);
  margin-bottom: 8px;
}
.lab2-tactic-handle {
  font-family: var(--serif);
  font-size: 21px;
  font-weight: 500;
  margin-bottom: 8px;
}
.lab2-tactic-move { font-size: 14px; color: var(--dim); line-height: 1.6; }
.lab2-keyhint {
  margin-top: 22px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--faint);
}

.lab2-verdict {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 28px 0 0;
  animation: lab2-stamp 0.45s cubic-bezier(0.22, 1.4, 0.36, 1) forwards;
}
@keyframes lab2-stamp {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.lab2-verdict-word {
  font-family: var(--mono);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.26em;
  padding: 9px 18px;
  border-radius: 7px;
}
.lab2-verdict--ratt .lab2-verdict-word { color: var(--green); border: 1px solid rgba(87, 194, 139, 0.55); background: var(--green-dim); }
.lab2-verdict--fel .lab2-verdict-word { color: var(--red); border: 1px solid rgba(224, 99, 92, 0.55); background: var(--red-dim); }
.lab2-verdict-rule { flex: 1; height: 1px; background: var(--line); }
.lab2-next {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #0a0f1a;
  background: var(--amber);
  border-radius: 7px;
  padding: 12px 22px;
  transition: filter 0.18s ease, transform 0.18s ease;
}
.lab2-next:hover { filter: brightness(1.08); transform: translateY(-1px); }

.lab2-pedagogy { margin-top: 30px; display: grid; gap: 26px; }
.lab2-reveal {
  opacity: 0;
  transform: translateY(12px);
  animation: lab2-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--d, 0s);
}
.lab2-solution {
  border-left: 2px solid var(--green);
  background: var(--panel-2);
  border-radius: 0 10px 10px 0;
  padding: 20px 24px;
}
.lab2-solution-kicker {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--green);
  margin-bottom: 8px;
}
.lab2-solution-text { font-family: var(--serif); font-size: 18px; line-height: 1.55; }

.lab2-block-title {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dim);
  margin: 0 0 14px;
}
.lab2-step { padding: 18px 22px; }
.lab2-step + .lab2-step { border-top: 1px solid var(--line-soft); }
.lab2-step-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 7px; }
.lab2-step-n {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--amber);
}
.lab2-step-title { font-family: var(--serif); font-size: 17px; font-weight: 500; }
.lab2-step-tier {
  margin-left: auto;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--faint);
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 3px 8px;
}
.lab2-step-text { font-size: 14px; color: #c4c0b3; line-height: 1.65; }

.lab2-distractor { padding: 18px 22px; }
.lab2-distractor + .lab2-distractor { border-top: 1px solid var(--line-soft); }
.lab2-dis-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; }
.lab2-dis-letter {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--red);
}
.lab2-dis-text { font-family: var(--serif); font-size: 16.5px; font-weight: 500; }
.lab2-dis-pair { display: grid; gap: 8px; }
.lab2-dis-line { font-size: 13.5px; line-height: 1.6; color: #c4c0b3; }
.lab2-dis-label {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-right: 8px;
}
.lab2-dis-label--lockar { color: var(--amber); }
.lab2-dis-label--fel { color: var(--red); }

@media (max-width: 1080px) {
  .lab2-home-grid, .lab2-drill-grid { grid-template-columns: 1fr; }
  .lab2-home-head { flex-direction: column; align-items: flex-start; gap: 24px; }
  .lab2-headword { font-size: 48px; }
}
@media (prefers-reduced-motion: reduce) {
  .lab2-rise, .lab2-reveal, .lab2-verdict { animation: none; opacity: 1; transform: none; }
  .lab2-option--wrong { animation: none; }
  .lab2-option, .lab2-resume, .lab2-next, .lab2-plan-start { transition: none; }
}
`

function Topline({ label }: { label: string }) {
  return (
    <div className="lab2-topline lab2-rise" style={{ ['--d' as never]: '0s' }}>
      <span className="lab2-wordmark">HP-COACH</span>
      <span className="lab2-topmeta">{label}</span>
    </div>
  )
}

function HomeScreen() {
  return (
    <div className="lab2-shell">
      <Topline label={`mål 2.0 · ${HOME.dateLabel}`} />

      <header className="lab2-home-head lab2-rise" style={{ ['--d' as never]: '0.06s' }}>
        <div>
          <p className="lab2-date">{HOME.dateLabel}</p>
          <h1 className="lab2-greeting">{HOME.greeting}.</h1>
        </div>
        <div className="lab2-gauges">
          <div className="lab2-gauge lab2-gauge--score">
            <div className="lab2-gauge-val">
              {HOME.projectedScore}
              <em> / 2.0</em>
            </div>
            <div className="lab2-gauge-sub">
              Prognos · <strong>{HOME.scoreDelta}</strong>
            </div>
          </div>
          <div className="lab2-gauge">
            <div className="lab2-gauge-val">{HOME.streakDays}</div>
            <div className="lab2-gauge-sub">dagar i rad</div>
          </div>
          <div className="lab2-gauge">
            <div className="lab2-gauge-val">
              ~{HOME.estimatedMinutes}
              <em> min</em>
            </div>
            <div className="lab2-gauge-sub">dagens pass</div>
          </div>
        </div>
      </header>

      <div className="lab2-home-grid">
        <div className="lab2-col">
          <button
            type="button"
            className="lab2-reset lab2-resume lab2-rise"
            style={{ ['--d' as never]: '0.12s' }}
          >
            <span>
              <span className="lab2-resume-kicker">Pausad session</span>
              <span className="lab2-resume-line" style={{ display: 'block' }}>
                {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
                {HOME.resume.total}
              </span>
              <span className="lab2-resume-meta" style={{ display: 'block' }}>
                Pausad på {HOME.resume.device} kl {HOME.resume.when}
              </span>
            </span>
            <span className="lab2-resume-go">Fortsätt</span>
          </button>

          <section className="lab2-panel lab2-rise" style={{ ['--d' as never]: '0.18s' }}>
            <div className="lab2-section-head">
              <h2 className="lab2-section-title">Dagens plan</h2>
              <span className="lab2-tag">~{HOME.estimatedMinutes} min totalt</span>
            </div>
            <div className="lab2-plan-list">
              {HOME.plan.map((item) => (
                <div key={item.id} className="lab2-plan-row">
                  <span className="lab2-plan-min">
                    {item.minutes}
                    <em> min</em>
                  </span>
                  <span>
                    <span className="lab2-plan-headline" style={{ display: 'block' }}>
                      {item.headline}
                    </span>
                    <span className="lab2-plan-rationale" style={{ display: 'block' }}>
                      {item.rationale}
                    </span>
                  </span>
                  <button type="button" className="lab2-reset lab2-plan-start">
                    Starta
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lab2-col">
          <section className="lab2-panel lab2-rise" style={{ ['--d' as never]: '0.24s' }}>
            <div className="lab2-section-head">
              <h2 className="lab2-section-title">Dina fällor</h2>
              <span className="lab2-tag">just nu</span>
            </div>
            <div className="lab2-trap-list">
              {HOME.traps.map((trap) => (
                <div key={trap.id} className="lab2-trap-row">
                  <span className="lab2-trap-badge">{trap.section}</span>
                  <span>
                    <span className="lab2-trap-headline" style={{ display: 'block' }}>
                      {trap.headline}
                    </span>
                    <span className="lab2-trap-count" style={{ display: 'block' }}>
                      {trap.count} förekomster
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function DrillScreen() {
  const [picked, setPicked] = useState<string | null>(null)
  const graded = picked !== null
  const correct = picked === QUESTION.answer

  const letters = useMemo(() => QUESTION.options.map((o) => o.letter), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!graded) {
        const idx = 'abcde'.indexOf(e.key.toLowerCase())
        if (idx >= 0 && idx < letters.length) setPicked(letters[idx])
      } else if (e.key === 'Enter') {
        setPicked(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graded, letters])

  return (
    <div className="lab2-shell">
      <Topline label={`${QUESTION.sectionLabel} · ${QUESTION.qid}`} />

      <div className="lab2-drill-grid">
        <div>
          <div className="lab2-drill-meta lab2-rise" style={{ ['--d' as never]: '0.04s' }}>
            <span className="lab2-tag" style={{ color: 'var(--amber)' }}>
              {QUESTION.section}
            </span>
            <span className="lab2-drill-pos">
              fråga {QUESTION.number} / {QUESTION.total}
            </span>
          </div>

          <h1 className="lab2-headword lab2-rise" style={{ ['--d' as never]: '0.1s' }}>
            {QUESTION.prompt}
          </h1>
          <p className="lab2-drill-ask lab2-rise" style={{ ['--d' as never]: '0.14s' }}>
            Vilket alternativ ligger närmast i betydelse?
          </p>

          <div className="lab2-options lab2-rise" style={{ ['--d' as never]: '0.18s' }}>
            {QUESTION.options.map((opt) => {
              const isAnswer = opt.letter === QUESTION.answer
              const isPicked = opt.letter === picked
              let cls = 'lab2-reset lab2-option'
              let verdict = ''
              if (graded) {
                if (isAnswer) {
                  cls += ' lab2-option--correct'
                  verdict = 'RÄTT SVAR'
                } else if (isPicked) {
                  cls += ' lab2-option--wrong'
                  verdict = 'DITT VAL'
                } else {
                  cls += ' lab2-option--faded'
                }
              }
              return (
                <button
                  key={opt.letter}
                  type="button"
                  className={cls}
                  disabled={graded}
                  onClick={() => setPicked(opt.letter)}
                >
                  <span className="lab2-opt-letter">{opt.letter}</span>
                  <span className="lab2-opt-text">{opt.text}</span>
                  <span className="lab2-opt-verdict">{verdict}</span>
                </button>
              )
            })}
          </div>

          {graded && (
            <div className={`lab2-verdict ${correct ? 'lab2-verdict--ratt' : 'lab2-verdict--fel'}`}>
              <span className="lab2-verdict-word">{correct ? 'RÄTT' : 'FEL'}</span>
              <span className="lab2-verdict-rule" />
              <button
                type="button"
                className="lab2-reset lab2-next"
                onClick={() => setPicked(null)}
              >
                Nästa fråga
              </button>
            </div>
          )}

          {graded && (
            <div className="lab2-pedagogy">
              <section className="lab2-solution lab2-reveal" style={{ ['--d' as never]: '0.15s' }}>
                <p className="lab2-solution-kicker">Lösning</p>
                <p className="lab2-solution-text">{EXPLANATION.solution}</p>
              </section>

              <section className="lab2-reveal" style={{ ['--d' as never]: '0.3s' }}>
                <h2 className="lab2-block-title">Så resonerar du</h2>
                <div className="lab2-panel">
                  {EXPLANATION.steps.map((step) => (
                    <div key={step.n} className="lab2-step">
                      <div className="lab2-step-head">
                        <span className="lab2-step-n">{step.n}</span>
                        <span className="lab2-step-title">{step.title}</span>
                        <span className="lab2-step-tier">
                          {step.tier === 'essential' ? 'kärna' : 'fördjupning'}
                        </span>
                      </div>
                      <p className="lab2-step-text">{step.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="lab2-reveal" style={{ ['--d' as never]: '0.45s' }}>
                <h2 className="lab2-block-title">Varför de andra lockar</h2>
                <div className="lab2-panel">
                  {EXPLANATION.distractors.map((dis) => (
                    <div key={dis.letter} className="lab2-distractor">
                      <div className="lab2-dis-head">
                        <span className="lab2-dis-letter">{dis.letter}</span>
                        <span className="lab2-dis-text">{dis.text}</span>
                      </div>
                      <div className="lab2-dis-pair">
                        <p className="lab2-dis-line">
                          <span className="lab2-dis-label lab2-dis-label--lockar">Lockar</span>
                          {dis.whyTempting}
                        </p>
                        <p className="lab2-dis-line">
                          <span className="lab2-dis-label lab2-dis-label--fel">Fel för att</span>
                          {dis.whyWrong}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        <aside>
          <div className="lab2-tactic lab2-rise" style={{ ['--d' as never]: '0.24s' }}>
            <p className="lab2-tactic-kicker">Taktik innan du svarar</p>
            <p className="lab2-tactic-handle">{EXPLANATION.pregradeTactic.handle}</p>
            <p className="lab2-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
          </div>
          <p className="lab2-keyhint lab2-rise" style={{ ['--d' as never]: '0.3s' }}>
            {graded ? 'Enter — nästa fråga' : 'Tangent a–e väljer alternativ'}
          </p>
        </aside>
      </div>
    </div>
  )
}

export function Lab2({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab2-root">
      <style>{STYLE}</style>
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}
