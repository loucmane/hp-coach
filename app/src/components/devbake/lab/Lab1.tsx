// Lab 1 — design thesis: "SÄTTARBORDET" (the typesetter's bench).
//
// Swedish print discipline applied to a training instrument: warm unbleached
// paper, near-black ink, hairline rules and marginalia numerals — the calm of
// a dictionary page, with grading that lands like a proofreader's stamp.

import { useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

type DrillPhase = 'idle' | 'graded'

const LETTERS = ['a', 'b', 'c', 'd', 'e'] as const

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=IBM+Plex+Mono:wght@400;500&display=swap');

.lab1-root {
  --paper: #f4eee1;
  --paper-deep: #ece4d2;
  --ink: #211d15;
  --ink-soft: #5e574a;
  --rule: #d3c8af;
  --rule-strong: #a99c7e;
  --ox: #8e2a17;
  --ox-deep: #6e2011;
  --moss: #2c5d3c;
  --moss-deep: #1f4a2e;
  min-height: 100dvh;
  background:
    radial-gradient(120% 80% at 50% 0%, #faf6ec 0%, var(--paper) 55%, var(--paper-deep) 100%);
  color: var(--ink);
  font-family: 'Newsreader', 'Times New Roman', serif;
  font-optical-sizing: auto;
  font-size: 17px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

.lab1-reset {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: inherit;
  appearance: none;
}

.lab1-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 40px 48px 96px;
}

.lab1-mono {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.lab1-display {
  font-family: 'Fraunces', serif;
  font-optical-sizing: auto;
  font-weight: 420;
  letter-spacing: -0.01em;
}

/* ---------- entrance choreography ---------- */

@keyframes lab1-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes lab1-rule-draw {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.lab1-rise {
  animation: lab1-rise 0.55s cubic-bezier(0.22, 0.8, 0.3, 1) both;
  animation-delay: var(--d, 0s);
}

.lab1-drawn-rule {
  height: 2px;
  background: var(--ink);
  transform-origin: left center;
  animation: lab1-rule-draw 0.7s cubic-bezier(0.6, 0, 0.2, 1) both;
  animation-delay: var(--d, 0s);
}

/* ---------- masthead ---------- */

.lab1-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 14px;
}

.lab1-wordmark {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 19px;
  letter-spacing: 0.02em;
}

.lab1-wordmark em {
  font-style: italic;
  font-weight: 420;
  color: var(--ox);
}

/* ---------- home ---------- */

.lab1-home-greeting {
  margin-top: 44px;
}

.lab1-home-greeting h1 {
  font-family: 'Fraunces', serif;
  font-size: 44px;
  font-weight: 380;
  line-height: 1.1;
  margin-top: 10px;
}

.lab1-broadsheet {
  display: grid;
  grid-template-columns: 320px 1fr 340px;
  gap: 0;
  margin-top: 40px;
  border-top: 1px solid var(--rule-strong);
}

.lab1-col {
  padding: 28px 32px 8px;
  border-left: 1px solid var(--rule);
}

.lab1-col:first-child {
  border-left: 0;
  padding-left: 0;
}

.lab1-col:last-child {
  padding-right: 0;
}

.lab1-kicker {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rule);
}

.lab1-score-figure {
  font-family: 'Fraunces', serif;
  font-size: 124px;
  font-weight: 340;
  line-height: 1;
  letter-spacing: -0.04em;
  margin-top: 26px;
  font-variant-numeric: lining-nums;
}

.lab1-score-of {
  font-size: 22px;
  color: var(--ink-soft);
  font-weight: 380;
  margin-left: 6px;
  letter-spacing: 0;
}

.lab1-score-delta {
  display: inline-block;
  margin-top: 14px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--moss-deep);
  border: 1px solid var(--moss);
  border-radius: 999px;
  padding: 5px 12px;
}

.lab1-streak {
  margin-top: 30px;
  padding-top: 18px;
  border-top: 1px solid var(--rule);
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.lab1-streak-n {
  font-family: 'Fraunces', serif;
  font-size: 34px;
  font-weight: 420;
  line-height: 1;
}

.lab1-streak-ticks {
  display: flex;
  gap: 4px;
  margin-top: 12px;
}

.lab1-tick {
  width: 14px;
  height: 5px;
  background: var(--ink);
  opacity: 0.85;
}

.lab1-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 22px;
  padding: 18px 20px;
  border: 1px solid var(--ink);
  background: #fbf7ec;
  box-shadow: 3px 3px 0 0 var(--rule-strong);
}

.lab1-resume-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 480;
}

.lab1-resume-meta {
  margin-top: 4px;
  font-size: 15px;
  color: var(--ink-soft);
}

.lab1-btn {
  cursor: pointer;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--paper);
  background: var(--ink);
  padding: 12px 20px;
  white-space: nowrap;
  transition: background 0.18s ease, transform 0.18s ease;
}

.lab1-btn:hover {
  background: var(--ox);
}

.lab1-btn:active {
  transform: translateY(1px);
}

.lab1-btn:focus-visible {
  outline: 2px solid var(--ox);
  outline-offset: 3px;
}

.lab1-plan-list {
  list-style: none;
  margin-top: 6px;
}

.lab1-plan-item {
  display: grid;
  grid-template-columns: 44px 1fr 64px;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--rule);
  align-items: baseline;
}

.lab1-plan-n {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 26px;
  font-weight: 380;
  color: var(--ox);
  line-height: 1;
}

.lab1-plan-headline {
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 480;
}

.lab1-plan-rationale {
  margin-top: 4px;
  font-size: 15px;
  color: var(--ink-soft);
}

.lab1-plan-min {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-align: right;
  color: var(--ink-soft);
}

.lab1-trap {
  padding: 16px 0;
  border-bottom: 1px solid var(--rule);
}

.lab1-trap-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.lab1-trap-count {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--ox-deep);
  border: 1px solid var(--ox);
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.lab1-trap-text {
  margin-top: 8px;
  font-size: 15.5px;
  line-height: 1.5;
}

/* ---------- drill ---------- */

.lab1-drill {
  max-width: 760px;
  margin: 0 auto;
}

.lab1-drill-kicker {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-top: 40px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--ink);
}

.lab1-tactic {
  margin-top: 26px;
  padding: 16px 20px 16px 22px;
  border-left: 3px solid var(--ox);
  background: #f0e8d6;
}

.lab1-tactic-handle {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-weight: 520;
  font-size: 17px;
  color: var(--ox-deep);
}

.lab1-tactic-move {
  margin-top: 5px;
  font-size: 16px;
}

.lab1-headword-row {
  position: relative;
  margin-top: 44px;
  display: flex;
  align-items: baseline;
  gap: 28px;
}

.lab1-headword {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 62px;
  font-weight: 420;
  line-height: 1;
  letter-spacing: -0.015em;
}

.lab1-headword-gloss {
  font-size: 15px;
  color: var(--ink-soft);
}

.lab1-options {
  list-style: none;
  margin-top: 34px;
  border-top: 1px solid var(--rule-strong);
}

.lab1-opt {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: baseline;
  gap: 16px;
  width: 100%;
  padding: 16px 10px 16px 4px;
  border-bottom: 1px solid var(--rule);
  cursor: pointer;
  transition: background 0.15s ease, color 0.2s ease, opacity 0.3s ease;
}

.lab1-opt:hover:enabled {
  background: #ede5d1;
}

.lab1-opt:focus-visible {
  outline: 2px solid var(--ox);
  outline-offset: -2px;
}

.lab1-opt:disabled {
  cursor: default;
}

.lab1-opt-letter {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-soft);
}

.lab1-opt-text {
  font-family: 'Fraunces', serif;
  font-size: 21px;
  font-weight: 420;
}

.lab1-opt-verdict {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
}

.lab1-opt-correct {
  background: #e7ecdd;
}

.lab1-opt-correct .lab1-opt-text {
  color: var(--moss-deep);
  font-weight: 560;
}

.lab1-opt-correct .lab1-opt-verdict {
  color: var(--moss-deep);
}

.lab1-opt-wrongpick .lab1-opt-text {
  color: var(--ox-deep);
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
}

.lab1-opt-wrongpick .lab1-opt-verdict {
  color: var(--ox-deep);
}

.lab1-opt-faded {
  opacity: 0.38;
}

/* ---------- the stamp: grading signature ---------- */

@keyframes lab1-stamp {
  0% { opacity: 0; transform: rotate(-8deg) scale(2.1); }
  62% { opacity: 1; transform: rotate(-6deg) scale(0.94); }
  80% { transform: rotate(-6deg) scale(1.04); }
  100% { opacity: 1; transform: rotate(-6deg) scale(1); }
}

.lab1-stamp {
  position: absolute;
  right: 0;
  top: -14px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.28em;
  padding: 8px 16px 8px 22px;
  border: 3px double currentColor;
  border-radius: 4px;
  animation: lab1-stamp 0.42s cubic-bezier(0.34, 1.4, 0.5, 1) both;
  mix-blend-mode: multiply;
}

.lab1-stamp-ratt {
  color: var(--moss-deep);
}

.lab1-stamp-fel {
  color: var(--ox-deep);
}

/* ---------- pedagogy ---------- */

.lab1-pedagogy {
  margin-top: 44px;
}

.lab1-solution {
  padding: 22px 24px;
  background: var(--ink);
  color: var(--paper);
}

.lab1-solution .lab1-mono {
  color: #b8ad94;
}

.lab1-solution-text {
  margin-top: 10px;
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 420;
  line-height: 1.45;
}

.lab1-section-head {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-top: 40px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule-strong);
}

.lab1-step {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 18px;
  padding: 22px 0;
  border-bottom: 1px solid var(--rule);
}

.lab1-step-n {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 34px;
  font-weight: 360;
  line-height: 1;
  color: var(--ox);
}

.lab1-step-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 540;
}

.lab1-step-tier {
  margin-left: 12px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
  border: 1px solid var(--rule-strong);
  padding: 2px 7px;
  border-radius: 999px;
  vertical-align: 3px;
}

.lab1-step-text {
  margin-top: 8px;
  font-size: 16.5px;
  max-width: 62ch;
}

.lab1-distractor {
  padding: 20px 0;
  border-bottom: 1px solid var(--rule);
}

.lab1-distractor-head {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.lab1-distractor-letter {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--ox-deep);
}

.lab1-distractor-word {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 20px;
  font-weight: 480;
}

.lab1-distractor-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 12px;
}

.lab1-distractor-cell .lab1-mono {
  display: block;
  margin-bottom: 6px;
}

.lab1-distractor-cell p {
  font-size: 15.5px;
  line-height: 1.55;
}

.lab1-tempt .lab1-mono {
  color: var(--ox-deep);
}

.lab1-next-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 36px;
}

.lab1-keyhint {
  align-self: center;
  margin-right: 18px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--ink-soft);
}

/* ---------- responsive ---------- */

@media (max-width: 1080px) {
  .lab1-page {
    padding: 32px 32px 80px;
  }
  .lab1-broadsheet {
    grid-template-columns: 1fr 1fr;
  }
  .lab1-col-score {
    grid-column: 1 / -1;
    border-left: 0;
    padding-left: 0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 48px;
    align-items: start;
  }
  .lab1-col-plan {
    border-left: 0;
    padding-left: 0;
    border-top: 1px solid var(--rule-strong);
  }
  .lab1-col-traps {
    border-top: 1px solid var(--rule-strong);
  }
}

/* ---------- reduced motion ---------- */

@media (prefers-reduced-motion: reduce) {
  .lab1-root *,
  .lab1-root *::before,
  .lab1-root *::after {
    animation-duration: 0.001s !important;
    animation-delay: 0s !important;
    transition-duration: 0.001s !important;
  }
}
`

function Masthead({ right }: { right: string }) {
  return (
    <header className="lab1-masthead lab1-rise" style={{ ['--d' as string]: '0s' }}>
      <div className="lab1-wordmark">
        HP·Coach <em>sättarbordet</em>
      </div>
      <div className="lab1-mono">{right}</div>
    </header>
  )
}

function HomeScreen() {
  return (
    <div className="lab1-page">
      <Masthead right={HOME.dateLabel} />
      <div className="lab1-drawn-rule" style={{ ['--d' as string]: '0.1s' }} />

      <section className="lab1-home-greeting lab1-rise" style={{ ['--d' as string]: '0.12s' }}>
        <div className="lab1-mono">Dagens utgåva · mot 2.0</div>
        <h1>{HOME.greeting}.</h1>
      </section>

      <div className="lab1-broadsheet">
        <div className="lab1-col lab1-col-score lab1-rise" style={{ ['--d' as string]: '0.22s' }}>
          <div>
            <div className="lab1-kicker">
              <span className="lab1-mono">Prognos</span>
              <span className="lab1-mono">skala 0.0–2.0</span>
            </div>
            <div className="lab1-score-figure lab1-display">
              {HOME.projectedScore}
              <span className="lab1-score-of">/ 2.0</span>
            </div>
            <span className="lab1-score-delta">{HOME.scoreDelta}</span>
          </div>
          <div className="lab1-streak-block">
            <div className="lab1-streak">
              <span className="lab1-streak-n">{HOME.streakDays}</span>
              <span className="lab1-mono">dagar i följd</span>
            </div>
            <div className="lab1-streak-ticks" aria-hidden="true">
              {Array.from({ length: HOME.streakDays }, (_, i) => (
                <span key={`tick-${String(i)}`} className="lab1-tick" />
              ))}
            </div>
          </div>
        </div>

        <div className="lab1-col lab1-col-plan lab1-rise" style={{ ['--d' as string]: '0.32s' }}>
          <div className="lab1-kicker">
            <span className="lab1-mono">Dagens pass</span>
            <span className="lab1-mono">ca {HOME.estimatedMinutes} min</span>
          </div>

          <div className="lab1-resume">
            <div>
              <div className="lab1-resume-title">
                Pausad {HOME.resume.kind.toLowerCase()} · {HOME.resume.section}
              </div>
              <div className="lab1-resume-meta">
                Fråga {HOME.resume.position} av {HOME.resume.total} · pausad på {HOME.resume.device}{' '}
                kl {HOME.resume.when}
              </div>
            </div>
            <button type="button" className="lab1-reset lab1-btn">
              Återuppta
            </button>
          </div>

          <ol className="lab1-plan-list">
            {HOME.plan.map((item, i) => (
              <li key={item.id} className="lab1-plan-item">
                <span className="lab1-plan-n">{i + 1}.</span>
                <div>
                  <div className="lab1-plan-headline">{item.headline}</div>
                  <p className="lab1-plan-rationale">{item.rationale}</p>
                </div>
                <span className="lab1-plan-min">{item.minutes} min</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="lab1-col lab1-col-traps lab1-rise" style={{ ['--d' as string]: '0.42s' }}>
          <div className="lab1-kicker">
            <span className="lab1-mono">Dina fällor</span>
            <span className="lab1-mono">senaste veckan</span>
          </div>
          {HOME.traps.map((trap) => (
            <article key={trap.id} className="lab1-trap">
              <div className="lab1-trap-head">
                <span className="lab1-mono">{trap.section}</span>
                <span className="lab1-trap-count">× {trap.count}</span>
              </div>
              <p className="lab1-trap-text">{trap.headline}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function DrillScreen() {
  const [phase, setPhase] = useState<DrillPhase>('idle')
  const [picked, setPicked] = useState<string | null>(null)

  const correct = picked === QUESTION.answer

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (phase === 'idle') {
        const idx = LETTERS.indexOf(key as (typeof LETTERS)[number])
        if (idx >= 0 && idx < QUESTION.options.length) {
          setPicked(QUESTION.options[idx].letter)
          setPhase('graded')
        }
      } else if (key === 'enter') {
        setPicked(null)
        setPhase('idle')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  const pick = (letter: string) => {
    if (phase !== 'idle') return
    setPicked(letter)
    setPhase('graded')
  }

  const reset = () => {
    setPicked(null)
    setPhase('idle')
  }

  return (
    <div className="lab1-page">
      <Masthead right={`${QUESTION.sectionLabel} · var-2026`} />
      <div className="lab1-drawn-rule" style={{ ['--d' as string]: '0.1s' }} />

      <div className="lab1-drill">
        <div className="lab1-drill-kicker lab1-rise" style={{ ['--d' as string]: '0.12s' }}>
          <span className="lab1-mono">
            {QUESTION.section} · {QUESTION.sectionLabel}
          </span>
          <span className="lab1-mono">
            Fråga {QUESTION.number} av {QUESTION.total}
          </span>
        </div>

        <aside className="lab1-tactic lab1-rise" style={{ ['--d' as string]: '0.2s' }}>
          <div className="lab1-mono">Taktik före svar</div>
          <div className="lab1-tactic-handle">{EXPLANATION.pregradeTactic.handle}</div>
          <p className="lab1-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
        </aside>

        <div className="lab1-headword-row lab1-rise" style={{ ['--d' as string]: '0.28s' }}>
          <h1 className="lab1-headword">{QUESTION.prompt}</h1>
          <span className="lab1-headword-gloss">Vilket alternativ ligger närmast i betydelse?</span>
          {phase === 'graded' && (
            <span
              className={`lab1-stamp ${correct ? 'lab1-stamp-ratt' : 'lab1-stamp-fel'}`}
              role="status"
            >
              {correct ? 'RÄTT' : 'FEL'}
            </span>
          )}
        </div>

        <ul className="lab1-options lab1-rise" style={{ ['--d' as string]: '0.36s' }}>
          {QUESTION.options.map((opt) => {
            const isAnswer = opt.letter === QUESTION.answer
            const isPicked = opt.letter === picked
            let stateClass = ''
            let verdict = ''
            if (phase === 'graded') {
              if (isAnswer) {
                stateClass = 'lab1-opt-correct'
                verdict = isPicked ? 'Ditt svar · rätt' : 'Rätt svar'
              } else if (isPicked) {
                stateClass = 'lab1-opt-wrongpick'
                verdict = 'Ditt svar'
              } else {
                stateClass = 'lab1-opt-faded'
              }
            }
            return (
              <li key={opt.letter}>
                <button
                  type="button"
                  className={`lab1-reset lab1-opt ${stateClass}`}
                  onClick={() => pick(opt.letter)}
                  disabled={phase !== 'idle'}
                >
                  <span className="lab1-opt-letter">{opt.letter}</span>
                  <span className="lab1-opt-text">{opt.text}</span>
                  <span className="lab1-opt-verdict">{verdict}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {phase === 'idle' && (
          <p className="lab1-keyhint lab1-rise" style={{ ['--d' as string]: '0.44s' }}>
            Tangenter A–E väljer svar
          </p>
        )}

        {phase === 'graded' && (
          <div className="lab1-pedagogy">
            <section className="lab1-solution lab1-rise" style={{ ['--d' as string]: '0.25s' }}>
              <span className="lab1-mono">Lösning</span>
              <p className="lab1-solution-text">{EXPLANATION.solution}</p>
            </section>

            <div className="lab1-section-head lab1-rise" style={{ ['--d' as string]: '0.4s' }}>
              <span className="lab1-mono">Genomgång i tre steg</span>
            </div>
            {EXPLANATION.steps.map((step, i) => (
              <article
                key={step.n}
                className="lab1-step lab1-rise"
                style={{ ['--d' as string]: `${0.5 + i * 0.12}s` }}
              >
                <span className="lab1-step-n">{step.n}</span>
                <div>
                  <h2 className="lab1-step-title">
                    {step.title}
                    <span className="lab1-step-tier">
                      {step.tier === 'essential' ? 'kärna' : 'fördjupning'}
                    </span>
                  </h2>
                  <p className="lab1-step-text">{step.text}</p>
                </div>
              </article>
            ))}

            <div className="lab1-section-head lab1-rise" style={{ ['--d' as string]: '0.9s' }}>
              <span className="lab1-mono">Varför de andra lockar</span>
            </div>
            {EXPLANATION.distractors.map((d, i) => (
              <article
                key={d.letter}
                className="lab1-distractor lab1-rise"
                style={{ ['--d' as string]: `${1.0 + i * 0.1}s` }}
              >
                <div className="lab1-distractor-head">
                  <span className="lab1-distractor-letter">{d.letter}</span>
                  <span className="lab1-distractor-word">{d.text}</span>
                </div>
                <div className="lab1-distractor-pair">
                  <div className="lab1-distractor-cell lab1-tempt">
                    <span className="lab1-mono">Därför lockar det</span>
                    <p>{d.whyTempting}</p>
                  </div>
                  <div className="lab1-distractor-cell">
                    <span className="lab1-mono">Därför är det fel</span>
                    <p>{d.whyWrong}</p>
                  </div>
                </div>
              </article>
            ))}

            <div className="lab1-next-row lab1-rise" style={{ ['--d' as string]: '1.4s' }}>
              <span className="lab1-keyhint">Enter går vidare</span>
              <button type="button" className="lab1-reset lab1-btn" onClick={reset}>
                Nästa fråga
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Lab1({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab1-root">
      <style>{CSS}</style>
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}
