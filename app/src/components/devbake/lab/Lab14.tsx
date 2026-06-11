// Lab14 — "Reviderade siffror" (Audited Figures)
// Thesis: a coaching product earns trust the way financial infrastructure does —
// every number set like an audited figure, every explanation layered like
// reference documentation: white ground, hairline rules, a display/body/mono
// triplet in strict register, motion used only to certify state changes.

import { useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

type DrillPhase = 'idle' | 'graded' | 'pedagogy'

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.lab14-root {
  --ink: #1a1f36;
  --ink-soft: #4f566b;
  --ink-faint: #697386;
  --rule: #e3e8ee;
  --rule-strong: #c1c9d2;
  --ground: #ffffff;
  --ground-dim: #f7f9fb;
  --indigo: #4f5ae8;
  --indigo-deep: #3f47c4;
  --indigo-wash: #f0f2fe;
  --green: #0e7a4d;
  --green-wash: #e9f6ef;
  --red: #b3261e;
  --red-wash: #fbeeed;
  --display: 'Inter Tight', sans-serif;
  --body: 'Inter', sans-serif;
  --mono: 'IBM Plex Mono', monospace;
  min-height: 100dvh;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--body);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.lab14-root * { box-sizing: border-box; }
.lab14-reset {
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.lab14-reset:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 2px;
  border-radius: 6px;
}

.lab14-shell {
  max-width: 900px;
  min-width: min(900px, 100%);
  margin: 0 auto;
  padding: 0 32px 96px;
}

/* ---------- top bar ---------- */
.lab14-topbar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 20px 0 16px;
  border-bottom: 1px solid var(--rule);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
}
.lab14-topbar strong { color: var(--ink); font-weight: 600; }

/* ---------- mono labels ---------- */
.lab14-label {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-faint);
}
.lab14-num {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}

/* ---------- entrances ---------- */
@keyframes lab14-rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.lab14-rise {
  animation: lab14-rise 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

/* ---------- home ---------- */
.lab14-greeting {
  margin: 40px 0 4px;
  font-family: var(--display);
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.lab14-date { color: var(--ink-faint); font-size: 14px; margin-bottom: 36px; }

.lab14-figures {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--rule-strong);
  border-bottom: 1px solid var(--rule);
}
.lab14-figure {
  padding: 18px 20px 16px;
  border-right: 1px solid var(--rule);
}
.lab14-figure:first-child { padding-left: 0; }
.lab14-figure:last-child { border-right: none; }
.lab14-figure-value {
  font-family: var(--display);
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  margin-top: 6px;
  line-height: 1.1;
}
.lab14-figure-value small {
  font-size: 16px;
  font-weight: 500;
  color: var(--ink-faint);
  letter-spacing: 0;
}
.lab14-figure-note {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--ink-soft);
}
.lab14-figure-note.lab14-up { color: var(--green); font-weight: 500; }

.lab14-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 28px;
  padding: 18px 20px;
  border: 1px solid var(--rule);
  border-left: 3px solid var(--indigo);
  border-radius: 8px;
  background: var(--ground-dim);
}
.lab14-resume-meta {
  margin-top: 4px;
  font-family: var(--mono);
  font-size: 12.5px;
  color: var(--ink-soft);
}
.lab14-resume-btn {
  flex-shrink: 0;
  padding: 9px 18px;
  border-radius: 6px;
  background: var(--indigo);
  color: #ffffff;
  font-weight: 600;
  font-size: 13.5px;
  transition: background 0.15s ease;
}
.lab14-resume-btn:hover { background: var(--indigo-deep); }

.lab14-section { margin-top: 44px; }
.lab14-section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule-strong);
}
.lab14-section-title {
  font-family: var(--display);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.lab14-plan-row {
  display: grid;
  grid-template-columns: 44px 1fr 72px;
  gap: 16px;
  align-items: baseline;
  width: 100%;
  text-align: left;
  padding: 16px 0;
  border-bottom: 1px solid var(--rule);
  transition: background 0.15s ease;
}
.lab14-plan-row:hover { background: var(--ground-dim); }
.lab14-plan-idx {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}
.lab14-plan-headline { font-weight: 600; font-size: 14.5px; }
.lab14-plan-rationale { font-size: 13px; color: var(--ink-soft); margin-top: 2px; }
.lab14-plan-min {
  justify-self: end;
  font-family: var(--mono);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-soft);
}

.lab14-trap-row {
  display: grid;
  grid-template-columns: 64px 1fr 56px;
  gap: 16px;
  align-items: baseline;
  padding: 14px 0;
  border-bottom: 1px solid var(--rule);
}
.lab14-trap-section {
  font-family: var(--mono);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--indigo-deep);
}
.lab14-trap-headline { font-size: 14px; color: var(--ink); }
.lab14-trap-count {
  justify-self: end;
  font-family: var(--mono);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-soft);
}

/* ---------- drill ---------- */
.lab14-drill-eyebrow {
  display: flex;
  gap: 12px;
  align-items: baseline;
  margin-top: 40px;
}
.lab14-headword {
  margin: 18px 0 0;
  font-family: var(--display);
  font-size: 44px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;
}
.lab14-tactic {
  margin-top: 24px;
  padding: 14px 18px;
  border: 1px solid var(--rule);
  border-left: 3px solid var(--indigo);
  border-radius: 8px;
  background: var(--indigo-wash);
}
.lab14-tactic-handle {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--indigo-deep);
}
.lab14-tactic-move { margin-top: 4px; font-size: 14px; color: var(--ink); }

.lab14-options { margin-top: 28px; display: grid; gap: 8px; }
.lab14-option {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 13px 16px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--ground);
  text-align: left;
  font-size: 15px;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.lab14-option:hover:not(:disabled) { border-color: var(--rule-strong); background: var(--ground-dim); }
.lab14-option:disabled { cursor: default; }
.lab14-option-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid var(--rule-strong);
  border-radius: 5px;
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-soft);
}
.lab14-option-verdict {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  visibility: hidden;
}
.lab14-option.lab14-correct {
  border-color: var(--green);
  background: var(--green-wash);
}
.lab14-option.lab14-correct .lab14-option-key { border-color: var(--green); color: var(--green); }
.lab14-option.lab14-correct .lab14-option-verdict { visibility: visible; color: var(--green); }
.lab14-option.lab14-wrong {
  border-color: var(--red);
  background: var(--red-wash);
}
.lab14-option.lab14-wrong .lab14-option-key { border-color: var(--red); color: var(--red); }
.lab14-option.lab14-wrong .lab14-option-verdict { visibility: visible; color: var(--red); }
.lab14-option.lab14-dimmed { opacity: 0.45; }

/* grading beat: verdict line draws across, exact and brief */
.lab14-verdict {
  margin-top: 22px;
  overflow: hidden;
}
@keyframes lab14-verdict-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.lab14-verdict-word {
  font-family: var(--display);
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.01em;
  animation: lab14-verdict-in 0.28s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}
.lab14-verdict-word.lab14-ratt { color: var(--green); }
.lab14-verdict-word.lab14-fel { color: var(--red); }
@keyframes lab14-rule-draw {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
.lab14-verdict-rule {
  height: 2px;
  margin-top: 8px;
  transform-origin: left;
  animation: lab14-rule-draw 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) 0.1s both;
}
.lab14-verdict-rule.lab14-ratt { background: var(--green); }
.lab14-verdict-rule.lab14-fel { background: var(--red); }

/* ---------- pedagogy ---------- */
.lab14-pedagogy { margin-top: 36px; }
.lab14-solution {
  padding: 16px 18px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--ground-dim);
  font-size: 15px;
  font-weight: 500;
}
.lab14-step {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--rule);
}
.lab14-step-n {
  font-family: var(--mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-faint);
  padding-top: 3px;
}
.lab14-step-title {
  font-family: var(--display);
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.lab14-step-text { margin-top: 6px; font-size: 14px; color: var(--ink-soft); }

.lab14-distractor {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--rule);
}
.lab14-distractor-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid var(--rule-strong);
  border-radius: 5px;
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-soft);
}
.lab14-distractor-text { font-weight: 600; font-size: 14.5px; }
.lab14-distractor-pair { margin-top: 8px; display: grid; gap: 8px; }
.lab14-distractor-block { font-size: 13.5px; color: var(--ink-soft); }
.lab14-distractor-block .lab14-label { display: block; margin-bottom: 2px; }

.lab14-next {
  margin-top: 32px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.lab14-next-btn {
  padding: 10px 22px;
  border-radius: 6px;
  background: var(--indigo);
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.15s ease;
}
.lab14-next-btn:hover { background: var(--indigo-deep); }
.lab14-key-hint {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--ink-faint);
}

@media (prefers-reduced-motion: reduce) {
  .lab14-rise,
  .lab14-verdict-word,
  .lab14-verdict-rule {
    animation: none !important;
  }
  .lab14-root * { transition: none !important; }
}
`

function Home(): React.JSX.Element {
  return (
    <main className="lab14-shell">
      <header className="lab14-topbar lab14-rise">
        <span>
          <strong>HP-Coach</strong>&ensp;/&ensp;Hem
        </span>
        <span>{HOME.dateLabel}</span>
      </header>

      <h1 className="lab14-greeting lab14-rise" style={{ animationDelay: '0.05s' }}>
        {HOME.greeting}
      </h1>
      <p className="lab14-date lab14-rise" style={{ animationDelay: '0.05s' }}>
        Dagens pass är planerat — cirka {HOME.estimatedMinutes} minuter.
      </p>

      <section className="lab14-figures lab14-rise" style={{ animationDelay: '0.1s' }}>
        <div className="lab14-figure">
          <span className="lab14-label">Prognos</span>
          <div className="lab14-figure-value">
            {HOME.projectedScore}
            <small> / 2.0</small>
          </div>
          <div className="lab14-figure-note lab14-up">{HOME.scoreDelta}</div>
        </div>
        <div className="lab14-figure">
          <span className="lab14-label">Svit</span>
          <div className="lab14-figure-value">
            {HOME.streakDays}
            <small> dagar</small>
          </div>
          <div className="lab14-figure-note">i följd med genomfört pass</div>
        </div>
        <div className="lab14-figure">
          <span className="lab14-label">Dagens plan</span>
          <div className="lab14-figure-value">
            {HOME.estimatedMinutes}
            <small> min</small>
          </div>
          <div className="lab14-figure-note">{HOME.plan.length} moment, i ordning</div>
        </div>
      </section>

      <section className="lab14-resume lab14-rise" style={{ animationDelay: '0.15s' }}>
        <div>
          <span className="lab14-label">Pausad session</span>
          <div className="lab14-resume-meta">
            {HOME.resume.kind} · {HOME.resume.section} · fråga{' '}
            <span className="lab14-num">{HOME.resume.position}</span> av{' '}
            <span className="lab14-num">{HOME.resume.total}</span> · {HOME.resume.device} ·{' '}
            <span className="lab14-num">{HOME.resume.when}</span>
          </div>
        </div>
        <button type="button" className="lab14-reset lab14-resume-btn">
          Återuppta
        </button>
      </section>

      <section className="lab14-section lab14-rise" style={{ animationDelay: '0.2s' }}>
        <div className="lab14-section-head">
          <h2 className="lab14-section-title">Dagens plan</h2>
          <span className="lab14-label">
            totalt <span className="lab14-num">{HOME.estimatedMinutes}</span> min
          </span>
        </div>
        {HOME.plan.map((item, i) => (
          <button type="button" key={item.id} className="lab14-reset lab14-plan-row">
            <span className="lab14-plan-idx">{String(i + 1).padStart(2, '0')}</span>
            <span>
              <span className="lab14-plan-headline">{item.headline}</span>
              <span className="lab14-plan-rationale" style={{ display: 'block' }}>
                {item.rationale}
              </span>
            </span>
            <span className="lab14-plan-min">{item.minutes} min</span>
          </button>
        ))}
      </section>

      <section className="lab14-section lab14-rise" style={{ animationDelay: '0.25s' }}>
        <div className="lab14-section-head">
          <h2 className="lab14-section-title">Dina vanligaste fällor</h2>
          <span className="lab14-label">senaste veckan</span>
        </div>
        {HOME.traps.map((trap) => (
          <div key={trap.id} className="lab14-trap-row">
            <span className="lab14-trap-section">{trap.section}</span>
            <span className="lab14-trap-headline">{trap.headline}</span>
            <span className="lab14-trap-count">×{trap.count}</span>
          </div>
        ))}
      </section>
    </main>
  )
}

function Drill(): React.JSX.Element {
  const [phase, setPhase] = useState<DrillPhase>('idle')
  const [picked, setPicked] = useState<string | null>(null)

  const isCorrect = picked === QUESTION.answer

  const pick = (letter: string): void => {
    setPicked(letter)
    setPhase('graded')
  }

  const reset = (): void => {
    setPicked(null)
    setPhase('idle')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (phase === 'idle') {
        const idx = ['a', 'b', 'c', 'd', 'e'].indexOf(e.key.toLowerCase())
        if (idx >= 0) {
          setPicked(LETTERS[idx])
          setPhase('graded')
        }
      } else if (phase === 'pedagogy' && e.key === 'Enter') {
        setPicked(null)
        setPhase('idle')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  useEffect(() => {
    if (phase !== 'graded') return
    const t = window.setTimeout(() => setPhase('pedagogy'), 750)
    return () => window.clearTimeout(t)
  }, [phase])

  const optionClass = (letter: string): string => {
    const base = 'lab14-reset lab14-option'
    if (phase === 'idle') return base
    if (letter === QUESTION.answer) return `${base} lab14-correct`
    if (letter === picked) return `${base} lab14-wrong`
    return `${base} lab14-dimmed`
  }

  return (
    <main className="lab14-shell">
      <header className="lab14-topbar lab14-rise">
        <span>
          <strong>HP-Coach</strong>&ensp;/&ensp;Övning
        </span>
        <span>
          fråga <span className="lab14-num">{QUESTION.number}</span> av{' '}
          <span className="lab14-num">{QUESTION.total}</span>
        </span>
      </header>

      <div className="lab14-drill-eyebrow lab14-rise" style={{ animationDelay: '0.05s' }}>
        <span className="lab14-label">
          {QUESTION.section} · {QUESTION.sectionLabel}
        </span>
      </div>

      <h1 className="lab14-headword lab14-rise" style={{ animationDelay: '0.08s' }}>
        {QUESTION.prompt}
      </h1>

      <aside className="lab14-tactic lab14-rise" style={{ animationDelay: '0.12s' }}>
        <span className="lab14-tactic-handle">Taktik · {EXPLANATION.pregradeTactic.handle}</span>
        <p className="lab14-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
      </aside>

      <div className="lab14-options lab14-rise" style={{ animationDelay: '0.16s' }}>
        {QUESTION.options.map((opt) => (
          <button
            type="button"
            key={opt.letter}
            className={optionClass(opt.letter)}
            disabled={phase !== 'idle'}
            onClick={() => pick(opt.letter)}
          >
            <span className="lab14-option-key">{opt.letter.toLowerCase()}</span>
            <span>{opt.text}</span>
            <span className="lab14-option-verdict">
              {opt.letter === QUESTION.answer ? 'RÄTT SVAR' : 'DITT VAL'}
            </span>
          </button>
        ))}
      </div>

      {phase !== 'idle' && picked !== null && (
        <div className="lab14-verdict" aria-live="polite">
          <div className={`lab14-verdict-word ${isCorrect ? 'lab14-ratt' : 'lab14-fel'}`}>
            {isCorrect ? 'RÄTT' : 'FEL'}
          </div>
          <div className={`lab14-verdict-rule ${isCorrect ? 'lab14-ratt' : 'lab14-fel'}`} />
        </div>
      )}

      {phase === 'pedagogy' && (
        <section className="lab14-pedagogy">
          <div className="lab14-rise">
            <p className="lab14-solution">{EXPLANATION.solution}</p>
          </div>

          <div className="lab14-section lab14-rise" style={{ animationDelay: '0.08s' }}>
            <div className="lab14-section-head">
              <h2 className="lab14-section-title">Genomgång</h2>
              <span className="lab14-label">{EXPLANATION.steps.length} steg</span>
            </div>
            {EXPLANATION.steps.map((step) => (
              <div key={step.n} className="lab14-step">
                <span className="lab14-step-n">{String(step.n).padStart(2, '0')}</span>
                <div>
                  <h3 className="lab14-step-title">{step.title}</h3>
                  <p className="lab14-step-text">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lab14-section lab14-rise" style={{ animationDelay: '0.16s' }}>
            <div className="lab14-section-head">
              <h2 className="lab14-section-title">Varför de andra lockar</h2>
              <span className="lab14-label">{EXPLANATION.distractors.length} fällor</span>
            </div>
            {EXPLANATION.distractors.map((d) => (
              <div key={d.letter} className="lab14-distractor">
                <span className="lab14-distractor-letter">{d.letter.toLowerCase()}</span>
                <div>
                  <span className="lab14-distractor-text">{d.text}</span>
                  <div className="lab14-distractor-pair">
                    <p className="lab14-distractor-block">
                      <span className="lab14-label">Varför den lockar</span>
                      {d.whyTempting}
                    </p>
                    <p className="lab14-distractor-block">
                      <span className="lab14-label">Varför den är fel</span>
                      {d.whyWrong}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lab14-next lab14-rise" style={{ animationDelay: '0.24s' }}>
            <button type="button" className="lab14-reset lab14-next-btn" onClick={reset}>
              Nästa fråga
            </button>
            <span className="lab14-key-hint">eller tryck Enter</span>
          </div>
        </section>
      )}
    </main>
  )
}

export function Lab14({ screen }: { screen: RedesignScreen }): React.JSX.Element {
  return (
    <div className="lab14-root">
      <style>{STYLE}</style>
      {screen === 'home' ? <Home /> : <Drill />}
    </div>
  )
}
