// Lab9 — "Mätinstrumentet" (The Readiness Instrument)
// Thesis: the student is an athlete-body of data — every number on screen is a
// measurement, not a decoration. Deep-night ground, clinical-warm type, a slow
// 240° prognosis dial, the daily plan as prescribed load vs capacity, traps as
// biomarkers under observation. Signal teal for readiness, amber for caution.
import { useEffect, useMemo, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

type OptionLetter = (typeof QUESTION.options)[number]['letter']
type DrillPhase = 'idle' | 'graded' | 'pedagogy'

const DIAL_RADIUS = 84
const DIAL_ARC = 2 * Math.PI * DIAL_RADIUS * (240 / 360)
const SCORE_FRACTION = 1.4 / 2.0

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.lab9-reset {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: inherit;
  appearance: none;
}

.lab9-root {
  min-height: 100dvh;
  background:
    radial-gradient(1100px 520px at 50% -180px, rgba(45, 168, 160, 0.10), transparent 64%),
    linear-gradient(180deg, #07111a 0%, #060d13 52%, #050b10 100%);
  color: #dfecef;
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  padding: 40px 28px 72px;
}
.lab9-shell {
  max-width: 880px;
  margin: 0 auto;
}
.lab9-mono {
  font-family: 'IBM Plex Mono', monospace;
  font-variant-numeric: tabular-nums;
}

/* ---------- shared furniture ---------- */
.lab9-eyebrow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #6e8893;
}
.lab9-card {
  background: linear-gradient(180deg, rgba(17, 31, 41, 0.92), rgba(12, 23, 31, 0.92));
  border: 1px solid rgba(122, 160, 172, 0.14);
  border-radius: 18px;
  padding: 22px 24px;
}
.lab9-rise {
  opacity: 0;
  transform: translateY(14px);
  animation: lab9-rise 0.62s cubic-bezier(0.22, 0.9, 0.3, 1) forwards;
}
@keyframes lab9-rise {
  to { opacity: 1; transform: translateY(0); }
}
.lab9-d1 { animation-delay: 0.06s; }
.lab9-d2 { animation-delay: 0.14s; }
.lab9-d3 { animation-delay: 0.22s; }
.lab9-d4 { animation-delay: 0.30s; }
.lab9-d5 { animation-delay: 0.38s; }

/* ---------- home ---------- */
.lab9-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
}
.lab9-greeting {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #f1f8f9;
}
.lab9-date {
  display: block;
  margin-top: 3px;
}
.lab9-streak {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border: 1px solid rgba(72, 207, 173, 0.28);
  border-radius: 999px;
  padding: 7px 15px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8fe6cf;
  white-space: nowrap;
}
.lab9-streak-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3fe0b4;
  animation: lab9-breathe 3.6s ease-in-out infinite;
}
@keyframes lab9-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(63, 224, 180, 0.45); opacity: 0.85; }
  50% { box-shadow: 0 0 0 7px rgba(63, 224, 180, 0); opacity: 1; }
}

.lab9-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: stretch;
}
.lab9-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lab9-dial-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 26px 24px 22px;
}
.lab9-dial-wrap {
  position: relative;
  width: 220px;
  height: 168px;
  margin-top: 14px;
}
.lab9-dial-track {
  fill: none;
  stroke: rgba(110, 140, 152, 0.18);
  stroke-width: 9;
  stroke-linecap: round;
}
.lab9-dial-sweep {
  fill: none;
  stroke: url(#lab9-sweep-grad);
  stroke-width: 9;
  stroke-linecap: round;
  transition: stroke-dashoffset 1.7s cubic-bezier(0.3, 0.8, 0.25, 1);
  filter: drop-shadow(0 0 6px rgba(63, 224, 180, 0.35));
  animation: lab9-dial-breathe 4.4s ease-in-out 2s infinite;
}
@keyframes lab9-dial-breathe {
  0%, 100% { filter: drop-shadow(0 0 5px rgba(63, 224, 180, 0.28)); }
  50% { filter: drop-shadow(0 0 11px rgba(63, 224, 180, 0.5)); }
}
.lab9-dial-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 14px;
}
.lab9-dial-score {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 52px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1;
  color: #f3fbfa;
}
.lab9-dial-max {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  color: #6e8893;
  margin-top: 6px;
}
.lab9-delta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 16px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12.5px;
  font-weight: 500;
  color: #8fe6cf;
}
.lab9-delta::before {
  content: '';
  width: 0;
  height: 0;
  border-left: 4.5px solid transparent;
  border-right: 4.5px solid transparent;
  border-bottom: 6px solid #3fe0b4;
}

.lab9-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-color: rgba(72, 207, 173, 0.26);
}
.lab9-resume-meta {
  margin-top: 7px;
  font-size: 14px;
  color: #aec4cb;
}
.lab9-resume-meta .lab9-sep { color: #50676f; padding: 0 7px; }
.lab9-resume-btn {
  flex-shrink: 0;
  border-radius: 12px;
  padding: 12px 22px;
  background: #2fae93;
  color: #04201a;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}
.lab9-resume-btn:hover { background: #3fd0af; transform: translateY(-1px); }
.lab9-resume-btn:focus-visible { outline: 2px solid #3fe0b4; outline-offset: 3px; }

.lab9-plan-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.lab9-load-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  color: #8fe6cf;
}
.lab9-loadbar {
  display: flex;
  gap: 4px;
  height: 6px;
  margin: 14px 0 6px;
  border-radius: 3px;
  overflow: hidden;
}
.lab9-loadbar span {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #2fae93, #3fe0b4);
  opacity: 0.85;
  transform-origin: left center;
  animation: lab9-load 0.9s cubic-bezier(0.25, 0.9, 0.3, 1) 0.5s backwards;
}
@keyframes lab9-load {
  from { transform: scaleX(0); }
}
.lab9-plan-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 2px;
  border-bottom: 1px solid rgba(122, 160, 172, 0.1);
}
.lab9-plan-item:last-child { border-bottom: 0; padding-bottom: 4px; }
.lab9-plan-min {
  flex-shrink: 0;
  width: 58px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #8fe6cf;
  padding-top: 2px;
}
.lab9-plan-headline {
  font-weight: 700;
  font-size: 14.5px;
  color: #ecf5f6;
}
.lab9-plan-rationale {
  margin-top: 3px;
  font-size: 13.5px;
  color: #93aab3;
}

.lab9-trap {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 13px 2px;
  border-bottom: 1px solid rgba(122, 160, 172, 0.1);
}
.lab9-trap:last-child { border-bottom: 0; padding-bottom: 4px; }
.lab9-trap-marker {
  flex-shrink: 0;
  margin-top: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f0b04b;
  box-shadow: 0 0 9px rgba(240, 176, 75, 0.45);
}
.lab9-trap-tag {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11.5px;
  letter-spacing: 0.1em;
  color: #c79a55;
}
.lab9-trap-count { color: #f0b04b; font-weight: 600; }
.lab9-trap-headline {
  margin-top: 3px;
  font-size: 14px;
  color: #cbdade;
}

/* ---------- drill ---------- */
.lab9-drill-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 30px;
}
.lab9-headword {
  font-size: 46px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #f3fbfa;
  margin: 4px 0 22px;
}
.lab9-tactic {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  border-left: 3px solid #3fe0b4;
  border-radius: 12px;
  background: rgba(47, 174, 147, 0.08);
  padding: 15px 18px;
  margin-bottom: 26px;
}
.lab9-tactic-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #8fe6cf;
}
.lab9-tactic-handle {
  font-weight: 800;
  font-size: 15px;
  color: #d8f4ec;
  margin-top: 3px;
}
.lab9-tactic-move {
  margin-top: 5px;
  font-size: 14px;
  color: #aecbc6;
}

.lab9-options {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.lab9-option {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  border: 1px solid rgba(122, 160, 172, 0.16);
  border-radius: 13px;
  background: rgba(17, 31, 41, 0.6);
  padding: 14px 18px;
  font-size: 16px;
  color: #e3eef0;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease, opacity 0.3s ease;
}
.lab9-option:hover:enabled {
  border-color: rgba(63, 224, 180, 0.45);
  background: rgba(25, 44, 53, 0.8);
  transform: translateX(3px);
}
.lab9-option:focus-visible { outline: 2px solid #3fe0b4; outline-offset: 2px; }
.lab9-option:disabled { cursor: default; }
.lab9-key {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(122, 160, 172, 0.28);
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12.5px;
  font-weight: 600;
  color: #8aa3ad;
}
.lab9-option-correct {
  border-color: rgba(63, 224, 180, 0.7);
  background: rgba(47, 174, 147, 0.13);
  animation: lab9-settle 0.45s cubic-bezier(0.3, 1.3, 0.45, 1);
}
.lab9-option-correct .lab9-key {
  border-color: #3fe0b4;
  color: #04201a;
  background: #3fe0b4;
}
.lab9-option-wrongpick {
  border-color: rgba(240, 176, 75, 0.65);
  background: rgba(240, 176, 75, 0.09);
  animation: lab9-shiver 0.4s ease;
}
.lab9-option-wrongpick .lab9-key {
  border-color: #f0b04b;
  color: #2a1c05;
  background: #f0b04b;
}
.lab9-option-dim { opacity: 0.38; }
@keyframes lab9-settle {
  0% { transform: scale(0.985); }
  60% { transform: scale(1.012); }
  100% { transform: scale(1); }
}
@keyframes lab9-shiver {
  0%, 100% { transform: translateX(0); }
  30% { transform: translateX(-5px); }
  60% { transform: translateX(4px); }
}

.lab9-verdict {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 11px;
  margin-top: 24px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3em;
  animation: lab9-verdict-in 0.5s cubic-bezier(0.2, 1.4, 0.4, 1);
}
@keyframes lab9-verdict-in {
  from { opacity: 0; transform: scale(0.82); }
  to { opacity: 1; transform: scale(1); }
}
.lab9-verdict-ratt { color: #3fe0b4; }
.lab9-verdict-fel { color: #f0b04b; }
.lab9-verdict-ring {
  position: relative;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.lab9-verdict-ratt .lab9-verdict-ring { background: #3fe0b4; }
.lab9-verdict-fel .lab9-verdict-ring { background: #f0b04b; }
.lab9-verdict-ring::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 2px solid currentColor;
  animation: lab9-ring 0.9s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
}
@keyframes lab9-ring {
  from { transform: scale(0.6); opacity: 0.9; }
  to { transform: scale(3.2); opacity: 0; }
}

.lab9-pedagogy { margin-top: 26px; }
.lab9-solution {
  border-left: 3px solid #3fe0b4;
  font-size: 16px;
  font-weight: 600;
  color: #e8f5f1;
}
.lab9-section-label {
  margin: 26px 0 12px;
}
.lab9-step {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 15px 18px;
  margin-bottom: 9px;
}
.lab9-step-n {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(63, 224, 180, 0.4);
  border-radius: 50%;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12.5px;
  font-weight: 600;
  color: #8fe6cf;
}
.lab9-step-title {
  font-weight: 800;
  font-size: 14.5px;
  color: #ecf5f6;
}
.lab9-step-text {
  margin-top: 5px;
  font-size: 14px;
  color: #a9bfc7;
}
.lab9-distractor {
  border-left: 3px solid rgba(240, 176, 75, 0.55);
  padding: 15px 18px;
  margin-bottom: 9px;
}
.lab9-distractor-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-weight: 800;
  font-size: 14.5px;
  color: #ecf5f6;
}
.lab9-distractor-letter {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12.5px;
  color: #f0b04b;
}
.lab9-why {
  margin-top: 7px;
  font-size: 13.5px;
  color: #a9bfc7;
}
.lab9-why strong {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #768f99;
  display: block;
  margin-bottom: 2px;
}
.lab9-next {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  border-radius: 12px;
  padding: 13px 26px;
  background: #2fae93;
  color: #04201a;
  font-weight: 800;
  font-size: 14.5px;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}
.lab9-next:hover { background: #3fd0af; transform: translateY(-1px); }
.lab9-next:focus-visible { outline: 2px solid #3fe0b4; outline-offset: 3px; }
.lab9-next-kbd {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(4, 32, 26, 0.4);
  border-radius: 6px;
  padding: 2px 7px;
}

@media (max-width: 900px) {
  .lab9-grid { grid-template-columns: 1fr; }
  .lab9-resume { flex-direction: column; align-items: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  .lab9-root *,
  .lab9-root *::before,
  .lab9-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`

function ScoreDial() {
  const [swept, setSwept] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setSwept(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const offset = swept ? DIAL_ARC * (1 - SCORE_FRACTION) : DIAL_ARC
  return (
    <div className="lab9-dial-wrap">
      <svg
        viewBox="0 0 220 168"
        width="220"
        height="168"
        role="img"
        aria-label={`Prognos ${HOME.projectedScore} av 2.0`}
      >
        <defs>
          <linearGradient id="lab9-sweep-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2fae93" />
            <stop offset="100%" stopColor="#5cf0c8" />
          </linearGradient>
        </defs>
        <path className="lab9-dial-track" d="M 37.25 152 A 84 84 0 1 1 182.75 152" />
        <path
          className="lab9-dial-sweep"
          d="M 37.25 152 A 84 84 0 1 1 182.75 152"
          strokeDasharray={DIAL_ARC}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="lab9-dial-center">
        <div className="lab9-dial-score">{HOME.projectedScore}</div>
        <div className="lab9-dial-max">av 2.0</div>
      </div>
    </div>
  )
}

function HomeScreen() {
  return (
    <div className="lab9-shell">
      <header className="lab9-masthead lab9-rise">
        <div>
          <h1 className="lab9-reset lab9-greeting">{HOME.greeting}</h1>
          <span className="lab9-eyebrow lab9-date">{HOME.dateLabel}</span>
        </div>
        <span className="lab9-streak">
          <span className="lab9-streak-dot" aria-hidden="true" />
          {HOME.streakDays} dagar i följd
        </span>
      </header>

      <div className="lab9-grid">
        <div className="lab9-col">
          <section className="lab9-card lab9-dial-card lab9-rise lab9-d1">
            <span className="lab9-eyebrow">Prognos</span>
            <ScoreDial />
            <span className="lab9-delta">{HOME.scoreDelta}</span>
          </section>

          <section className="lab9-card lab9-rise lab9-d3">
            <span className="lab9-eyebrow">Markörer att bevaka</span>
            <div>
              {HOME.traps.map((trap) => (
                <div key={trap.id} className="lab9-trap">
                  <span className="lab9-trap-marker" aria-hidden="true" />
                  <div>
                    <div className="lab9-trap-tag">
                      <span>{trap.section}</span>
                      <span className="lab9-trap-count">×{trap.count}</span>
                    </div>
                    <p className="lab9-reset lab9-trap-headline">{trap.headline}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lab9-col">
          <section className="lab9-card lab9-resume lab9-rise lab9-d2">
            <div>
              <span className="lab9-eyebrow">Pausad session</span>
              <p className="lab9-reset lab9-resume-meta">
                {HOME.resume.kind} · {HOME.resume.section}
                <span className="lab9-sep">|</span>
                fråga {HOME.resume.position} av {HOME.resume.total}
                <span className="lab9-sep">|</span>
                {HOME.resume.device} · {HOME.resume.when}
              </p>
            </div>
            <button type="button" className="lab9-reset lab9-resume-btn">
              Återuppta
            </button>
          </section>

          <section className="lab9-card lab9-rise lab9-d4">
            <div className="lab9-plan-head">
              <span className="lab9-eyebrow">Dagens ordination</span>
              <span className="lab9-load-num">~{HOME.estimatedMinutes} min belastning</span>
            </div>
            <div className="lab9-loadbar" aria-hidden="true">
              {HOME.plan.map((item, i) => (
                <span
                  key={item.id}
                  style={{ flexGrow: item.minutes, animationDelay: `${0.5 + i * 0.12}s` }}
                />
              ))}
            </div>
            <div>
              {HOME.plan.map((item) => (
                <div key={item.id} className="lab9-plan-item">
                  <span className="lab9-plan-min">{item.minutes} min</span>
                  <div>
                    <div className="lab9-plan-headline">{item.headline}</div>
                    <p className="lab9-reset lab9-plan-rationale">{item.rationale}</p>
                  </div>
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
  const [phase, setPhase] = useState<DrillPhase>('idle')
  const [picked, setPicked] = useState<OptionLetter | null>(null)
  const correct = phase === 'idle' ? null : picked === QUESTION.answer

  const letterByKey = useMemo(() => {
    const map = new Map<string, OptionLetter>()
    for (const option of QUESTION.options) {
      map.set(option.letter.toLowerCase(), option.letter)
    }
    return map
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase === 'idle') {
        const letter = letterByKey.get(event.key.toLowerCase())
        if (letter !== undefined) {
          setPicked(letter)
          setPhase('graded')
        }
      } else if (event.key === 'Enter') {
        setPicked(null)
        setPhase('idle')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, letterByKey])

  useEffect(() => {
    if (phase !== 'graded') return
    const timer = window.setTimeout(() => setPhase('pedagogy'), 750)
    return () => window.clearTimeout(timer)
  }, [phase])

  const pick = (letter: OptionLetter) => {
    if (phase !== 'idle') return
    setPicked(letter)
    setPhase('graded')
  }

  const reset = () => {
    setPicked(null)
    setPhase('idle')
  }

  const optionClass = (letter: OptionLetter): string => {
    const base = 'lab9-reset lab9-option'
    if (phase === 'idle') return base
    if (letter === QUESTION.answer) return `${base} lab9-option-correct`
    if (letter === picked) return `${base} lab9-option-wrongpick`
    return `${base} lab9-option-dim`
  }

  return (
    <div className="lab9-shell">
      <header className="lab9-drill-head lab9-rise">
        <span className="lab9-eyebrow">
          {QUESTION.section} · {QUESTION.sectionLabel}
        </span>
        <span className="lab9-eyebrow lab9-mono">
          Fråga {QUESTION.number} av {QUESTION.total}
        </span>
      </header>

      <h1 className="lab9-reset lab9-headword lab9-rise lab9-d1">{QUESTION.prompt}</h1>

      <aside className="lab9-tactic lab9-rise lab9-d2">
        <div>
          <span className="lab9-tactic-label">Taktik</span>
          <div className="lab9-tactic-handle">{EXPLANATION.pregradeTactic.handle}</div>
          <p className="lab9-reset lab9-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
        </div>
      </aside>

      <div className="lab9-options lab9-rise lab9-d3">
        {QUESTION.options.map((option) => (
          <button
            key={option.letter}
            type="button"
            className={optionClass(option.letter)}
            onClick={() => pick(option.letter)}
            disabled={phase !== 'idle'}
          >
            <span className="lab9-key">{option.letter}</span>
            <span>{option.text}</span>
          </button>
        ))}
      </div>

      {phase !== 'idle' && (
        <div
          className={`lab9-verdict ${correct === true ? 'lab9-verdict-ratt' : 'lab9-verdict-fel'}`}
          role="status"
        >
          <span className="lab9-verdict-ring" aria-hidden="true" />
          {correct === true ? 'RÄTT' : 'FEL'}
        </div>
      )}

      {phase === 'pedagogy' && (
        <div className="lab9-pedagogy">
          <section className="lab9-card lab9-solution lab9-rise">{EXPLANATION.solution}</section>

          <h2 className="lab9-reset lab9-eyebrow lab9-section-label lab9-rise lab9-d1">
            Så löser du den
          </h2>
          {EXPLANATION.steps.map((step, i) => (
            <section key={step.n} className={`lab9-card lab9-step lab9-rise lab9-d${i + 1}`}>
              <span className="lab9-step-n">{step.n}</span>
              <div>
                <div className="lab9-step-title">{step.title}</div>
                <p className="lab9-reset lab9-step-text">{step.text}</p>
              </div>
            </section>
          ))}

          <h2 className="lab9-reset lab9-eyebrow lab9-section-label lab9-rise lab9-d3">
            Varför de andra lockar
          </h2>
          {EXPLANATION.distractors.map((distractor, i) => (
            <section
              key={distractor.letter}
              className={`lab9-card lab9-distractor lab9-rise lab9-d${Math.min(i + 3, 5)}`}
            >
              <div className="lab9-distractor-head">
                <span className="lab9-distractor-letter">{distractor.letter}</span>
                <span>{distractor.text}</span>
              </div>
              <p className="lab9-reset lab9-why">
                <strong>Varför den lockar</strong>
                {distractor.whyTempting}
              </p>
              <p className="lab9-reset lab9-why">
                <strong>Varför den är fel</strong>
                {distractor.whyWrong}
              </p>
            </section>
          ))}

          <button type="button" className="lab9-reset lab9-next lab9-rise lab9-d5" onClick={reset}>
            Nästa fråga
            <span className="lab9-next-kbd">Enter</span>
          </button>
        </div>
      )}
    </div>
  )
}

export function Lab9({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab9-root">
      <style>{STYLES}</style>
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}
