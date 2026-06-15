// Lab13 — Studio 13, seeded bake-off.
//
// Thesis: "VITT PAPPER" (White Paper)
// The interface is a sheet of perfect stationery: whitespace carries the layout,
// weight carries the hierarchy, and one quiet blue carries every intention —
// so the only thing that ever feels loud is the moment you get a question right.

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

type Phase = 'idle' | 'graded' | 'pedagogy'

const KEY_TO_INDEX: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 }

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,450;14..32,500;14..32,600;14..32,700&display=swap');

.lab13-root {
  min-height: 100dvh;
  background: #fbfbfa;
  color: #2c2c2e;
  font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  font-weight: 450;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'cv11', 'ss01';
}
.lab13-page {
  max-width: 620px;
  margin: 0 auto;
  padding: 72px 28px 96px;
}

/* class-only reset (never element-prefixed) */
.lab13-reset {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: inherit;
  appearance: none;
  cursor: pointer;
}

/* ---------- motion system ---------- */
@keyframes lab13-rise {
  from { opacity: 0; transform: translateY(7px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes lab13-pop {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.14); }
  100% { transform: scale(1); }
}
@keyframes lab13-draw {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}
@keyframes lab13-ring {
  from { opacity: 0.45; transform: scale(0.6); }
  to   { opacity: 0; transform: scale(1.9); }
}
@keyframes lab13-settle {
  0%   { transform: translateX(0); }
  30%  { transform: translateX(-3px); }
  60%  { transform: translateX(2px); }
  100% { transform: translateX(0); }
}
.lab13-enter {
  animation: lab13-rise 0.42s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  animation-delay: var(--d, 0s);
}
@media (prefers-reduced-motion: reduce) {
  .lab13-root *, .lab13-root *::before, .lab13-root *::after {
    animation-duration: 0.001s !important;
    animation-delay: 0s !important;
    transition-duration: 0.001s !important;
  }
}

/* ---------- shared type ---------- */
.lab13-eyebrow {
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #9b9b9e;
}
.lab13-h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.25;
  color: #1c1c1e;
  margin: 6px 0 0;
}
.lab13-divider {
  height: 1px;
  background: #ececea;
  border: 0;
  margin: 36px 0;
}

/* ---------- home ---------- */
.lab13-stat-row {
  display: flex;
  align-items: baseline;
  gap: 28px;
  margin-top: 26px;
  flex-wrap: wrap;
}
.lab13-score {
  font-size: 44px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1c1c1e;
  line-height: 1;
}
.lab13-score-max { font-size: 19px; font-weight: 500; color: #b3b3b6; }
.lab13-delta { font-size: 14.5px; font-weight: 600; color: #3478c9; }
.lab13-streak { font-size: 14.5px; font-weight: 500; color: #8a8a8e; }

.lab13-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  margin-top: 34px;
  padding: 16px 18px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e9e9e7;
  box-shadow: 0 1px 2px rgba(20, 20, 22, 0.04);
  transition: transform 0.16s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.16s ease;
}
.lab13-resume:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(20, 20, 22, 0.07);
}
.lab13-resume:active { transform: translateY(0) scale(0.995); }
.lab13-resume-kicker { font-size: 12.5px; font-weight: 600; color: #3478c9; letter-spacing: 0.05em; text-transform: uppercase; }
.lab13-resume-line { font-size: 15.5px; font-weight: 500; color: #2c2c2e; margin-top: 2px; }
.lab13-resume-meta { font-size: 13.5px; color: #9b9b9e; margin-top: 1px; }
.lab13-resume-arrow { font-size: 20px; color: #3478c9; font-weight: 500; flex: none; }

.lab13-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.lab13-section-title { font-size: 17px; font-weight: 650; color: #1c1c1e; }
.lab13-section-note { font-size: 13.5px; font-weight: 500; color: #9b9b9e; }

.lab13-plan { list-style: none; margin: 14px 0 0; padding: 0; }
.lab13-plan-item {
  display: flex;
  gap: 14px;
  padding: 14px 2px;
  border-bottom: 1px solid #f0f0ee;
  align-items: flex-start;
}
.lab13-plan-item:last-child { border-bottom: 0; }
.lab13-circle {
  flex: none;
  width: 19px;
  height: 19px;
  margin-top: 4px;
  border-radius: 50%;
  border: 1.6px solid #c9c9cc;
  transition: border-color 0.15s ease;
}
.lab13-plan-item:hover .lab13-circle { border-color: #3478c9; }
.lab13-plan-body { flex: 1; min-width: 0; }
.lab13-plan-headline { font-size: 15.5px; font-weight: 550; color: #1c1c1e; }
.lab13-plan-rationale { font-size: 14px; color: #8a8a8e; margin-top: 1px; line-height: 1.5; }
.lab13-plan-min { flex: none; font-size: 13.5px; font-weight: 550; color: #9b9b9e; margin-top: 3px; font-variant-numeric: tabular-nums; }

.lab13-traps { list-style: none; margin: 14px 0 0; padding: 0; }
.lab13-trap {
  display: flex;
  gap: 14px;
  align-items: baseline;
  padding: 11px 2px;
  border-bottom: 1px solid #f0f0ee;
}
.lab13-trap:last-child { border-bottom: 0; }
.lab13-trap-tag {
  flex: none;
  width: 42px;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.06em;
  color: #3478c9;
}
.lab13-trap-text { flex: 1; font-size: 14.5px; color: #4a4a4d; line-height: 1.5; }
.lab13-trap-count { flex: none; font-size: 13.5px; font-weight: 600; color: #9b9b9e; font-variant-numeric: tabular-nums; }

/* ---------- drill ---------- */
.lab13-headword {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #1c1c1e;
  margin: 8px 0 0;
}
.lab13-tactic {
  margin-top: 22px;
  padding: 14px 16px;
  border-left: 2.5px solid #3478c9;
  background: #f3f7fc;
  border-radius: 0 10px 10px 0;
}
.lab13-tactic-handle { font-size: 13px; font-weight: 650; color: #3478c9; letter-spacing: 0.04em; text-transform: uppercase; }
.lab13-tactic-move { font-size: 15px; color: #3d4854; margin-top: 3px; line-height: 1.55; }

.lab13-opts { display: flex; flex-direction: column; gap: 9px; margin-top: 28px; }
.lab13-opt {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 13px 16px;
  border-radius: 11px;
  background: #fff;
  border: 1px solid #e9e9e7;
  transition: transform 0.14s cubic-bezier(0.2, 0.7, 0.2, 1),
              border-color 0.14s ease, background-color 0.14s ease, opacity 0.25s ease;
}
.lab13-opt-live:hover { border-color: #aac6e6; transform: translateY(-1px); }
.lab13-opt-live:active { transform: scale(0.99); }
.lab13-opt[disabled] { cursor: default; }
.lab13-key {
  flex: none;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  border: 1px solid #e2e2e0;
  font-size: 12.5px;
  font-weight: 600;
  color: #9b9b9e;
  text-transform: lowercase;
}
.lab13-opt-text { flex: 1; font-size: 16px; font-weight: 500; color: #2c2c2e; }

/* grading beat */
.lab13-mark { position: relative; flex: none; width: 24px; height: 24px; }
.lab13-mark-svg { display: block; width: 24px; height: 24px; animation: lab13-pop 0.42s cubic-bezier(0.3, 1.4, 0.4, 1) both; }
.lab13-mark-path {
  fill: none;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: lab13-draw 0.38s cubic-bezier(0.4, 0, 0.2, 1) 0.08s forwards;
}
.lab13-mark-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid #3478c9;
  animation: lab13-ring 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) 0.05s both;
  pointer-events: none;
}
.lab13-opt-correct { border-color: #3478c9; background: #f3f7fc; }
.lab13-opt-correct .lab13-opt-text { color: #1f4e85; font-weight: 600; }
.lab13-opt-wrong { border-color: #d8b4ad; background: #fbf4f2; animation: lab13-settle 0.32s ease both; }
.lab13-opt-wrong .lab13-opt-text { color: #8c4a3e; }
.lab13-opt-dim { opacity: 0.42; }

.lab13-verdict {
  margin-top: 22px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.lab13-verdict-ratt { color: #3478c9; }
.lab13-verdict-fel { color: #b0593f; }
.lab13-verdict-tail { font-weight: 500; letter-spacing: 0; text-transform: none; color: #8a8a8e; margin-left: 10px; font-size: 14.5px; }

/* pedagogy */
.lab13-solution { font-size: 16.5px; font-weight: 550; color: #1c1c1e; line-height: 1.6; }
.lab13-step { display: flex; gap: 14px; padding: 16px 2px; border-bottom: 1px solid #f0f0ee; }
.lab13-step:last-child { border-bottom: 0; }
.lab13-step-n {
  flex: none;
  width: 22px;
  height: 22px;
  margin-top: 2px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #eef3fa;
  color: #3478c9;
  font-size: 12.5px;
  font-weight: 650;
}
.lab13-step-title { font-size: 15.5px; font-weight: 600; color: #1c1c1e; }
.lab13-step-text { font-size: 15px; color: #4a4a4d; margin-top: 4px; line-height: 1.65; }

.lab13-dis { padding: 16px 2px; border-bottom: 1px solid #f0f0ee; }
.lab13-dis:last-child { border-bottom: 0; }
.lab13-dis-head { font-size: 15px; font-weight: 600; color: #1c1c1e; }
.lab13-dis-letter { color: #9b9b9e; font-weight: 650; margin-right: 8px; }
.lab13-dis-label { font-size: 12.5px; font-weight: 650; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 8px; }
.lab13-dis-label-tempt { color: #b08a3f; }
.lab13-dis-label-wrong { color: #3478c9; }
.lab13-dis-text { font-size: 14.5px; color: #4a4a4d; margin-top: 2px; line-height: 1.6; }

.lab13-next {
  display: block;
  width: 100%;
  margin-top: 36px;
  padding: 14px;
  border-radius: 12px;
  background: #3478c9;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  transition: transform 0.14s cubic-bezier(0.2, 0.7, 0.2, 1), background-color 0.14s ease;
}
.lab13-next:hover { background: #2d6ab4; transform: translateY(-1px); }
.lab13-next:active { transform: scale(0.99); }
.lab13-next-hint { font-size: 13px; font-weight: 500; color: rgba(255, 255, 255, 0.75); margin-left: 10px; }
`

function GradeMark({ correct }: { correct: boolean }) {
  return (
    <span className="lab13-mark" aria-hidden="true">
      {correct ? <span className="lab13-mark-ring" /> : null}
      <svg className="lab13-mark-svg" viewBox="0 0 24 24" aria-hidden="true">
        {correct ? (
          <path
            className="lab13-mark-path"
            stroke="#3478c9"
            pathLength={1}
            d="M5 12.5l4.6 4.6L19 7.6"
          />
        ) : (
          <path
            className="lab13-mark-path"
            stroke="#b0593f"
            pathLength={1}
            d="M7 7l10 10M17 7L7 17"
          />
        )}
      </svg>
    </span>
  )
}

function Home() {
  return (
    <main className="lab13-page">
      <header className="lab13-enter" style={{ '--d': '0s' } as CSSProperties}>
        <p className="lab13-eyebrow">{HOME.dateLabel}</p>
        <h1 className="lab13-h1">{HOME.greeting}</h1>
        <div className="lab13-stat-row">
          <span className="lab13-score">
            {HOME.projectedScore} <span className="lab13-score-max">/ 2.0</span>
          </span>
          <span className="lab13-delta">{HOME.scoreDelta}</span>
          <span className="lab13-streak">{HOME.streakDays} dagar i rad</span>
        </div>
      </header>

      <button
        type="button"
        className="lab13-reset lab13-resume lab13-enter"
        style={{ '--d': '0.06s' } as CSSProperties}
      >
        <span>
          <span className="lab13-resume-kicker">Fortsätt där du slutade</span>
          <span style={{ display: 'block' }} className="lab13-resume-line">
            {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
            {HOME.resume.total}
          </span>
          <span style={{ display: 'block' }} className="lab13-resume-meta">
            Pausad på {HOME.resume.device} kl. {HOME.resume.when}
          </span>
        </span>
        <span className="lab13-resume-arrow">›</span>
      </button>

      <hr className="lab13-divider lab13-enter" style={{ '--d': '0.1s' } as CSSProperties} />

      <section className="lab13-enter" style={{ '--d': '0.12s' } as CSSProperties}>
        <div className="lab13-section-head">
          <h2 className="lab13-section-title">Dagens plan</h2>
          <span className="lab13-section-note">ca {HOME.estimatedMinutes} min</span>
        </div>
        <ul className="lab13-plan">
          {HOME.plan.map((item, i) => (
            <li
              key={item.id}
              className="lab13-plan-item lab13-enter"
              style={{ '--d': `${0.16 + i * 0.05}s` } as CSSProperties}
            >
              <span className="lab13-circle" aria-hidden="true" />
              <span className="lab13-plan-body">
                <span style={{ display: 'block' }} className="lab13-plan-headline">
                  {item.headline}
                </span>
                <span style={{ display: 'block' }} className="lab13-plan-rationale">
                  {item.rationale}
                </span>
              </span>
              <span className="lab13-plan-min">{item.minutes} min</span>
            </li>
          ))}
        </ul>
      </section>

      <hr className="lab13-divider lab13-enter" style={{ '--d': '0.3s' } as CSSProperties} />

      <section className="lab13-enter" style={{ '--d': '0.32s' } as CSSProperties}>
        <div className="lab13-section-head">
          <h2 className="lab13-section-title">Dina vanligaste fällor</h2>
          <span className="lab13-section-note">senaste 30 dagarna</span>
        </div>
        <ul className="lab13-traps">
          {HOME.traps.map((trap, i) => (
            <li
              key={trap.id}
              className="lab13-trap lab13-enter"
              style={{ '--d': `${0.36 + i * 0.05}s` } as CSSProperties}
            >
              <span className="lab13-trap-tag">{trap.section}</span>
              <span className="lab13-trap-text">{trap.headline}</span>
              <span className="lab13-trap-count">×{trap.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

function Drill() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [picked, setPicked] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const isCorrect = picked === QUESTION.answer

  const pick = useCallback(
    (letter: string) => {
      if (phase !== 'idle') return
      setPicked(letter)
      setPhase('graded')
    },
    [phase],
  )

  const reset = useCallback(() => {
    setPicked(null)
    setPhase('idle')
  }, [])

  useEffect(() => {
    if (phase !== 'graded') return
    timerRef.current = window.setTimeout(() => setPhase('pedagogy'), 1000)
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [phase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (phase === 'idle' && key in KEY_TO_INDEX) {
        const option = QUESTION.options[KEY_TO_INDEX[key]]
        if (option) pick(option.letter)
      } else if (phase === 'pedagogy' && e.key === 'Enter') {
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, pick, reset])

  return (
    <main className="lab13-page">
      <header className="lab13-enter" style={{ '--d': '0s' } as CSSProperties}>
        <p className="lab13-eyebrow">
          {QUESTION.sectionLabel} · fråga {QUESTION.number} av {QUESTION.total}
        </p>
        <h1 className="lab13-headword">{QUESTION.prompt}</h1>
      </header>

      <div className="lab13-tactic lab13-enter" style={{ '--d': '0.06s' } as CSSProperties}>
        <p className="lab13-tactic-handle">{EXPLANATION.pregradeTactic.handle}</p>
        <p className="lab13-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
      </div>

      <div className="lab13-opts">
        {QUESTION.options.map((option, i) => {
          const graded = phase !== 'idle'
          const isPick = picked === option.letter
          const isAnswer = option.letter === QUESTION.answer
          let stateClass = ''
          if (graded) {
            if (isAnswer) stateClass = 'lab13-opt-correct'
            else if (isPick) stateClass = 'lab13-opt-wrong'
            else stateClass = 'lab13-opt-dim'
          }
          return (
            <button
              key={option.letter}
              type="button"
              disabled={graded}
              onClick={() => pick(option.letter)}
              className={`lab13-reset lab13-opt lab13-enter ${graded ? '' : 'lab13-opt-live'} ${stateClass}`}
              style={{ '--d': `${0.1 + i * 0.04}s` } as CSSProperties}
            >
              {graded && (isAnswer || isPick) ? (
                <GradeMark correct={isAnswer} />
              ) : (
                <span className="lab13-key">{option.letter.toLowerCase()}</span>
              )}
              <span className="lab13-opt-text">{option.text}</span>
            </button>
          )
        })}
      </div>

      {phase !== 'idle' ? (
        <p className="lab13-verdict lab13-enter" style={{ '--d': '0.1s' } as CSSProperties}>
          {isCorrect ? (
            <span className="lab13-verdict-ratt">Rätt</span>
          ) : (
            <span className="lab13-verdict-fel">Fel</span>
          )}
          <span className="lab13-verdict-tail">
            {isCorrect ? 'Precis så.' : `Rätt svar är ${QUESTION.answer}.`}
          </span>
        </p>
      ) : null}

      {phase === 'pedagogy' ? (
        <>
          <hr className="lab13-divider lab13-enter" style={{ '--d': '0.05s' } as CSSProperties} />

          <section className="lab13-enter" style={{ '--d': '0.08s' } as CSSProperties}>
            <h2 className="lab13-section-title">Lösning</h2>
            <p className="lab13-solution">{EXPLANATION.solution}</p>
          </section>

          <hr className="lab13-divider lab13-enter" style={{ '--d': '0.12s' } as CSSProperties} />

          <section>
            <div
              className="lab13-section-head lab13-enter"
              style={{ '--d': '0.14s' } as CSSProperties}
            >
              <h2 className="lab13-section-title">Så tänker du</h2>
            </div>
            {EXPLANATION.steps.map((step, i) => (
              <div
                key={step.n}
                className="lab13-step lab13-enter"
                style={{ '--d': `${0.18 + i * 0.07}s` } as CSSProperties}
              >
                <span className="lab13-step-n">{step.n}</span>
                <div>
                  <p className="lab13-step-title">{step.title}</p>
                  <p className="lab13-step-text">{step.text}</p>
                </div>
              </div>
            ))}
          </section>

          <hr className="lab13-divider lab13-enter" style={{ '--d': '0.4s' } as CSSProperties} />

          <section>
            <div
              className="lab13-section-head lab13-enter"
              style={{ '--d': '0.42s' } as CSSProperties}
            >
              <h2 className="lab13-section-title">Varför de andra lockar</h2>
            </div>
            {EXPLANATION.distractors.map((d, i) => (
              <div
                key={d.letter}
                className="lab13-dis lab13-enter"
                style={{ '--d': `${0.46 + i * 0.07}s` } as CSSProperties}
              >
                <p className="lab13-dis-head">
                  <span className="lab13-dis-letter">{d.letter}</span>
                  {d.text}
                </p>
                <p className="lab13-dis-label lab13-dis-label-tempt">Därför lockar det</p>
                <p className="lab13-dis-text">{d.whyTempting}</p>
                <p className="lab13-dis-label lab13-dis-label-wrong">Därför är det fel</p>
                <p className="lab13-dis-text">{d.whyWrong}</p>
              </div>
            ))}
          </section>

          <button
            type="button"
            onClick={reset}
            className="lab13-reset lab13-next lab13-enter"
            style={{ '--d': '0.75s' } as CSSProperties}
          >
            Nästa fråga
            <span className="lab13-next-hint">Enter</span>
          </button>
        </>
      ) : null}
    </main>
  )
}

export function Lab13({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab13-root">
      <style>{css}</style>
      {screen === 'home' ? <Home /> : <Drill />}
    </div>
  )
}
