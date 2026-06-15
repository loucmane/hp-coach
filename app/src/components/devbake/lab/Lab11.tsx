// Lab11 — "Instrumentet"
// Thesis: HP-Coach as a precision instrument: near-black monochrome surfaces, one
// electric-blue current, every datum in mono, every action a visible keystroke.
// Calm light-from-above, hairline structure, 120 ms mechanical motion — speed as quality.

import { useCallback, useEffect, useRef, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

type Phase = 'idle' | 'graded' | 'pedagogy'

const KEY_TO_LETTER: Record<string, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
  e: 'E',
}

const TIER_LABEL: Record<string, string> = {
  essential: 'Kärna',
  detail: 'Fördjupning',
}

function Keycap({ label }: { label: string }) {
  return <kbd className="lab11-key">{label}</kbd>
}

function HomeScreen() {
  return (
    <main className="lab11-page">
      <header className="lab11-topbar lab11-enter" style={{ animationDelay: '0ms' }}>
        <span className="lab11-mono lab11-dim">{HOME.dateLabel}</span>
        <span className="lab11-topbar-hint">
          <Keycap label="⌘" />
          <Keycap label="K" />
          <span className="lab11-dim">Kommandopalett</span>
        </span>
      </header>

      <section className="lab11-hero lab11-enter" style={{ animationDelay: '40ms' }}>
        <h1 className="lab11-greeting">{HOME.greeting}.</h1>
        <div className="lab11-stats">
          <div className="lab11-stat">
            <span className="lab11-stat-label">Prognos</span>
            <span className="lab11-stat-value lab11-mono">
              {HOME.projectedScore}
              <span className="lab11-stat-denom">/2.0</span>
            </span>
            <span className="lab11-stat-delta lab11-mono">{HOME.scoreDelta}</span>
          </div>
          <div className="lab11-stat">
            <span className="lab11-stat-label">Svit</span>
            <span className="lab11-stat-value lab11-mono">
              {HOME.streakDays}
              <span className="lab11-stat-denom">dagar</span>
            </span>
            <span className="lab11-stat-delta lab11-dim">utan avbrott</span>
          </div>
          <div className="lab11-stat">
            <span className="lab11-stat-label">Dagens plan</span>
            <span className="lab11-stat-value lab11-mono">
              ~{HOME.estimatedMinutes}
              <span className="lab11-stat-denom">min</span>
            </span>
            <span className="lab11-stat-delta lab11-dim">{HOME.plan.length} moment</span>
          </div>
        </div>
      </section>

      <section className="lab11-enter" style={{ animationDelay: '80ms' }}>
        <button type="button" className="lab11-reset lab11-resume">
          <span className="lab11-resume-pulse" aria-hidden="true" />
          <span className="lab11-resume-body">
            <span className="lab11-resume-label">Återuppta {HOME.resume.kind.toLowerCase()}</span>
            <span className="lab11-resume-meta lab11-mono">
              {HOME.resume.section} · fråga {HOME.resume.position} av {HOME.resume.total} ·{' '}
              {HOME.resume.device} · {HOME.resume.when}
            </span>
          </span>
          <span className="lab11-resume-key">
            <Keycap label="↵" />
          </span>
        </button>
      </section>

      <section className="lab11-enter" style={{ animationDelay: '120ms' }}>
        <h2 className="lab11-section-title">Dagens plan</h2>
        <ol className="lab11-reset lab11-plan">
          {HOME.plan.map((item, i) => (
            <li key={item.id} className="lab11-plan-row">
              <span className="lab11-plan-key">
                <Keycap label={String(i + 1)} />
              </span>
              <span className="lab11-plan-body">
                <span className="lab11-plan-headline">{item.headline}</span>
                <span className="lab11-plan-rationale">{item.rationale}</span>
              </span>
              <span className="lab11-plan-min lab11-mono">{item.minutes} min</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="lab11-enter" style={{ animationDelay: '160ms' }}>
        <h2 className="lab11-section-title">Dina fällor just nu</h2>
        <ul className="lab11-reset lab11-traps">
          {HOME.traps.map((trap) => (
            <li key={trap.id} className="lab11-trap-row">
              <span className="lab11-trap-section lab11-mono">{trap.section}</span>
              <span className="lab11-trap-headline">{trap.headline}</span>
              <span className="lab11-trap-count lab11-mono">×{trap.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

function DrillScreen() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [picked, setPicked] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const timerRef = useRef<number | null>(null)

  const pick = useCallback(
    (letter: string) => {
      if (phase !== 'idle') return
      setPicked(letter)
      setPhase('graded')
      timerRef.current = window.setTimeout(() => setPhase('pedagogy'), 650)
    },
    [phase],
  )

  const next = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setPicked(null)
    setPhase('idle')
    setRound((r) => r + 1)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const letter = KEY_TO_LETTER[e.key.toLowerCase()]
      if (letter && phase === 'idle') {
        e.preventDefault()
        pick(letter)
        return
      }
      if (e.key === 'Enter' && phase === 'pedagogy') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, pick, next])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const correct = picked === QUESTION.answer
  const graded = phase !== 'idle'

  return (
    <main className="lab11-page" key={round}>
      <header className="lab11-topbar lab11-enter" style={{ animationDelay: '0ms' }}>
        <span className="lab11-mono lab11-dim">
          {QUESTION.sectionLabel} · {QUESTION.section}
        </span>
        <span className="lab11-mono lab11-dim">
          fråga {QUESTION.number}/{QUESTION.total}
        </span>
      </header>

      <div className="lab11-progress lab11-enter" style={{ animationDelay: '20ms' }}>
        <div
          className="lab11-progress-fill"
          style={{ width: `${(QUESTION.number / QUESTION.total) * 100}%` }}
        />
      </div>

      <section className="lab11-question lab11-enter" style={{ animationDelay: '50ms' }}>
        <span className="lab11-eyebrow">Vilket ord betyder ungefär detsamma?</span>
        <h1 className="lab11-headword">{QUESTION.prompt}</h1>
      </section>

      <aside className="lab11-tactic lab11-enter" style={{ animationDelay: '90ms' }}>
        <span className="lab11-tactic-handle lab11-mono">{EXPLANATION.pregradeTactic.handle}</span>
        <p className="lab11-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
      </aside>

      <section className="lab11-options lab11-enter" style={{ animationDelay: '130ms' }}>
        {QUESTION.options.map((opt) => {
          const isAnswer = opt.letter === QUESTION.answer
          const isPicked = opt.letter === picked
          const state = !graded ? 'idle' : isAnswer ? 'correct' : isPicked ? 'wrong' : 'muted'
          return (
            <button
              key={opt.letter}
              type="button"
              className={`lab11-reset lab11-option lab11-option-${state}`}
              onClick={() => pick(opt.letter)}
              disabled={graded}
            >
              <Keycap label={opt.letter.toLowerCase()} />
              <span className="lab11-option-text">{opt.text}</span>
              {graded && isAnswer && <span className="lab11-option-mark lab11-mono">✓</span>}
              {graded && isPicked && !isAnswer && (
                <span className="lab11-option-mark lab11-mono">✕</span>
              )}
            </button>
          )
        })}
      </section>

      {graded && (
        <div
          className={`lab11-verdict ${correct ? 'lab11-verdict-ratt' : 'lab11-verdict-fel'}`}
          role="status"
        >
          <span className="lab11-verdict-tick" aria-hidden="true" />
          <span className="lab11-verdict-word lab11-mono">{correct ? 'RÄTT' : 'FEL'}</span>
          <span className="lab11-verdict-detail">
            {correct ? 'Vilja ha — exakt.' : `Rätt svar: ${QUESTION.answer} · vilja ha`}
          </span>
        </div>
      )}

      {phase === 'pedagogy' && (
        <section className="lab11-pedagogy">
          <div className="lab11-card lab11-rise" style={{ animationDelay: '0ms' }}>
            <h2 className="lab11-card-label">Lösning</h2>
            <p className="lab11-solution">{EXPLANATION.solution}</p>
          </div>

          <div className="lab11-card lab11-rise" style={{ animationDelay: '60ms' }}>
            <h2 className="lab11-card-label">Tre steg</h2>
            <ol className="lab11-reset lab11-steps">
              {EXPLANATION.steps.map((step) => (
                <li key={step.n} className="lab11-step">
                  <span className="lab11-step-n lab11-mono">{step.n}</span>
                  <div className="lab11-step-body">
                    <div className="lab11-step-head">
                      <h3 className="lab11-step-title">{step.title}</h3>
                      <span className="lab11-step-tier lab11-mono">
                        {TIER_LABEL[step.tier] ?? step.tier}
                      </span>
                    </div>
                    <p className="lab11-step-text">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lab11-card lab11-rise" style={{ animationDelay: '120ms' }}>
            <h2 className="lab11-card-label">Varför de andra lockar</h2>
            <ul className="lab11-reset lab11-distractors">
              {EXPLANATION.distractors.map((d) => (
                <li key={d.letter} className="lab11-distractor">
                  <div className="lab11-distractor-head">
                    <span className="lab11-distractor-letter lab11-mono">{d.letter}</span>
                    <span className="lab11-distractor-text">{d.text}</span>
                  </div>
                  <p className="lab11-why">
                    <span className="lab11-why-tag lab11-mono">Lockar</span>
                    {d.whyTempting}
                  </p>
                  <p className="lab11-why">
                    <span className="lab11-why-tag lab11-why-tag-wrong lab11-mono">Fel för</span>
                    {d.whyWrong}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="lab11-reset lab11-next lab11-rise"
            style={{ animationDelay: '180ms' }}
            onClick={next}
          >
            Nästa fråga
            <Keycap label="↵" />
          </button>
        </section>
      )}
    </main>
  )
}

export function Lab11({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab11-root">
      <style>{STYLES}</style>
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

.lab11-reset {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  list-style: none;
  text-align: inherit;
  appearance: none;
}

.lab11-root {
  --bg: #0c0d10;
  --surface: #121317;
  --surface-2: #16181d;
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.14);
  --ink: #e8eaf0;
  --ink-dim: #8a8f9c;
  --ink-faint: #5b5f6b;
  --accent: #4d6fff;
  --accent-soft: rgba(77, 111, 255, 0.14);
  --green: #3ecf8e;
  --green-soft: rgba(62, 207, 142, 0.12);
  --red: #f0556d;
  --red-soft: rgba(240, 85, 109, 0.1);
  --ease: cubic-bezier(0.2, 0, 0, 1);
  min-height: 100dvh;
  background:
    radial-gradient(900px 420px at 50% -120px, rgba(120, 140, 220, 0.09), transparent 70%),
    var(--bg);
  color: var(--ink);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.55;
  letter-spacing: -0.011em;
  -webkit-font-smoothing: antialiased;
}

.lab11-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.92em;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

.lab11-dim { color: var(--ink-dim); }

.lab11-page {
  max-width: 820px;
  min-width: 0;
  margin: 0 auto;
  padding: 28px 32px 96px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

@media (max-width: 920px) {
  .lab11-page { padding: 20px 18px 72px; }
}

/* ---------- motion ---------- */

@keyframes lab11-fade-rise {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.lab11-enter {
  animation: lab11-fade-rise 140ms var(--ease) both;
}

.lab11-rise {
  animation: lab11-fade-rise 130ms var(--ease) both;
}

@keyframes lab11-verdict-in {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes lab11-tick-grow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

@media (prefers-reduced-motion: reduce) {
  .lab11-root *, .lab11-root *::before, .lab11-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ---------- shared chrome ---------- */

.lab11-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
  font-size: 12px;
}

.lab11-topbar-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.lab11-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border: 1px solid var(--line-strong);
  border-bottom-width: 2px;
  border-radius: 5px;
  background: var(--surface-2);
  color: var(--ink-dim);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1;
  transition: border-color 120ms var(--ease), color 120ms var(--ease);
}

.lab11-section-title {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}

.lab11-card {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  padding: 18px 20px;
}

.lab11-card-label {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}

/* ---------- home ---------- */

.lab11-greeting {
  margin: 0 0 20px;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.lab11-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
}

.lab11-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
}

.lab11-stat + .lab11-stat { border-left: 1px solid var(--line); }

.lab11-stat-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}

.lab11-stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--ink);
}

.lab11-stat-denom {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 400;
  color: var(--ink-faint);
}

.lab11-stat-delta { font-size: 12px; color: var(--accent); }
.lab11-stat-delta.lab11-dim { color: var(--ink-dim); }

.lab11-resume {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 18px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: linear-gradient(180deg, var(--surface-2), var(--surface));
  cursor: pointer;
  overflow: hidden;
  transition: border-color 120ms var(--ease), background 120ms var(--ease);
}

.lab11-resume:hover { border-color: var(--accent); }
.lab11-resume:focus-visible { outline: 1px solid var(--accent); outline-offset: 2px; }

.lab11-resume-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
  flex-shrink: 0;
}

.lab11-resume-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.lab11-resume-label { font-size: 15px; font-weight: 600; }
.lab11-resume-meta { font-size: 12px; color: var(--ink-dim); }
.lab11-resume-key { flex-shrink: 0; }

.lab11-plan {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
}

.lab11-plan-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  transition: background 120ms var(--ease);
}

.lab11-plan-row:hover { background: var(--surface-2); }
.lab11-plan-row + .lab11-plan-row { border-top: 1px solid var(--line); }

.lab11-plan-key { flex-shrink: 0; }

.lab11-plan-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.lab11-plan-headline { font-size: 14px; font-weight: 500; }
.lab11-plan-rationale { font-size: 12.5px; color: var(--ink-dim); }
.lab11-plan-min { flex-shrink: 0; font-size: 12px; color: var(--ink-dim); }

.lab11-traps {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
}

.lab11-trap-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 12px 18px;
}

.lab11-trap-row + .lab11-trap-row { border-top: 1px solid var(--line); }

.lab11-trap-section {
  flex-shrink: 0;
  width: 36px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
}

.lab11-trap-headline { flex: 1; min-width: 0; font-size: 13.5px; color: var(--ink); }
.lab11-trap-count { flex-shrink: 0; font-size: 12px; color: var(--ink-dim); }

/* ---------- drill ---------- */

.lab11-progress {
  height: 2px;
  border-radius: 1px;
  background: var(--line);
  overflow: hidden;
  margin-top: -16px;
}

.lab11-progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 140ms var(--ease);
}

.lab11-question { display: flex; flex-direction: column; gap: 6px; }

.lab11-eyebrow {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}

.lab11-headword {
  margin: 0;
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.lab11-tactic {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-left: 2px solid var(--accent);
  border-radius: 0 8px 8px 0;
  background: var(--accent-soft);
}

.lab11-tactic-handle {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent);
}

.lab11-tactic-move { margin: 0; font-size: 13.5px; color: var(--ink); }

.lab11-options { display: flex; flex-direction: column; gap: 8px; }

.lab11-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  font-size: 15px;
  cursor: pointer;
  transition:
    border-color 120ms var(--ease),
    background 120ms var(--ease),
    color 120ms var(--ease),
    opacity 120ms var(--ease);
}

.lab11-option-idle:hover { border-color: var(--line-strong); background: var(--surface-2); }
.lab11-option-idle:hover .lab11-key { border-color: var(--accent); color: var(--accent); }
.lab11-option:focus-visible { outline: 1px solid var(--accent); outline-offset: 2px; }
.lab11-option:disabled { cursor: default; }

.lab11-option-text { flex: 1; min-width: 0; }
.lab11-option-mark { flex-shrink: 0; font-size: 14px; }

.lab11-option-correct {
  border-color: var(--green);
  background: var(--green-soft);
}
.lab11-option-correct .lab11-option-mark { color: var(--green); }
.lab11-option-correct .lab11-key { border-color: var(--green); color: var(--green); }

.lab11-option-wrong {
  border-color: var(--red);
  background: var(--red-soft);
}
.lab11-option-wrong .lab11-option-mark { color: var(--red); }
.lab11-option-wrong .lab11-key { border-color: var(--red); color: var(--red); }

.lab11-option-muted { opacity: 0.45; }

.lab11-verdict {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 4px 0 4px 14px;
  position: relative;
  animation: lab11-verdict-in 130ms var(--ease) both;
}

.lab11-verdict-tick {
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 2px;
  border-radius: 1px;
  transform-origin: top;
  animation: lab11-tick-grow 130ms var(--ease) both;
}

.lab11-verdict-ratt .lab11-verdict-tick { background: var(--green); }
.lab11-verdict-fel .lab11-verdict-tick { background: var(--red); }

.lab11-verdict-word {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.lab11-verdict-ratt .lab11-verdict-word { color: var(--green); }
.lab11-verdict-fel .lab11-verdict-word { color: var(--red); }

.lab11-verdict-detail { font-size: 13px; color: var(--ink-dim); }

/* ---------- pedagogy ---------- */

.lab11-pedagogy { display: flex; flex-direction: column; gap: 14px; }

.lab11-solution {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
}

.lab11-steps { display: flex; flex-direction: column; gap: 16px; }

.lab11-step { display: flex; gap: 14px; }

.lab11-step-n {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  font-size: 11px;
  color: var(--accent);
}

.lab11-step-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }

.lab11-step-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.lab11-step-title { margin: 0; font-size: 14px; font-weight: 600; }

.lab11-step-tier {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1px 6px;
}

.lab11-step-text { margin: 0; font-size: 13.5px; color: var(--ink-dim); }

.lab11-distractors { display: flex; flex-direction: column; gap: 16px; }

.lab11-distractor {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.lab11-distractor:last-child { border-bottom: none; padding-bottom: 0; }

.lab11-distractor-head { display: flex; align-items: baseline; gap: 10px; }

.lab11-distractor-letter {
  font-size: 12px;
  font-weight: 600;
  color: var(--red);
}

.lab11-distractor-text { font-size: 14px; font-weight: 600; }

.lab11-why {
  margin: 0;
  font-size: 13px;
  color: var(--ink-dim);
}

.lab11-why-tag {
  display: inline-block;
  margin-right: 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent);
}

.lab11-why-tag-wrong { color: var(--red); }

.lab11-next {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  align-self: flex-start;
  padding: 11px 18px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 120ms var(--ease), transform 120ms var(--ease);
}

.lab11-next:hover { filter: brightness(1.12); }
.lab11-next:active { transform: translateY(1px); }
.lab11-next:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }
.lab11-next .lab11-key { background: rgba(255, 255, 255, 0.16); border-color: rgba(255, 255, 255, 0.3); color: #fff; }

@media (max-width: 560px) {
  .lab11-stats { grid-template-columns: 1fr; }
  .lab11-stat + .lab11-stat { border-left: none; border-top: 1px solid var(--line); }
  .lab11-headword { font-size: 30px; }
}
`
