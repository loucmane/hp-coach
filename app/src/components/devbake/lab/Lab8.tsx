// Lab8 — Studio 8, seeded redesign bake-off.
//
// THESIS: "STILLA MÅLET" (The Quiet Goal)
//   One true-black canvas, one closing arc, one number that matters today —
//   progress is what visibly closes, never what flashes or accumulates badges.
//   The coach speaks in short, kind imperatives; each semantic state owns
//   exactly one vibrant accent (mint = framsteg, sky = taktik, red = fälla)
//   on calm near-black ground, set in large rounded numerals.

import { useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from '../redesign/fixtures'

type Phase = 'idle' | 'graded' | 'pedagogy'

const SCORE = Number.parseFloat(HOME.projectedScore)
const GOAL = 2.0
const DIAL_LEN = 66.667 // 240° of a pathLength-100 circle
const FILL_LEN = Math.round(DIAL_LEN * (SCORE / GOAL) * 1000) / 1000

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@500;600;700;800&display=swap');

.lab8-reset {
  appearance: none;
  border: 0;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: inherit;
  cursor: pointer;
}

.lab8-root {
  min-height: 100dvh;
  background: #000000;
  color: #f5f5f7;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.lab8-shell {
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 24px 72px;
}
@media (max-width: 480px) {
  .lab8-shell { padding: 28px 16px 56px; }
}

.lab8-tight { font-family: 'Inter Tight', 'Inter', system-ui, sans-serif; }

/* ---------- motion system ---------- */
@keyframes lab8-rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes lab8-dial-close {
  to { stroke-dashoffset: 0; }
}
@keyframes lab8-pop {
  0%   { transform: scale(1); }
  38%  { transform: scale(1.035); }
  68%  { transform: scale(0.992); }
  100% { transform: scale(1); }
}
@keyframes lab8-shake {
  0%, 100% { transform: translateX(0); }
  22% { transform: translateX(-7px); }
  46% { transform: translateX(6px); }
  68% { transform: translateX(-4px); }
  86% { transform: translateX(2px); }
}
@keyframes lab8-stamp {
  0%   { opacity: 0; transform: scale(0.7); }
  62%  { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
}
.lab8-rise {
  animation: lab8-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  .lab8-root *, .lab8-root *::before, .lab8-root *::after {
    animation-duration: 0.001s !important;
    animation-delay: 0s !important;
    transition-duration: 0.001s !important;
  }
}

/* ---------- shared ---------- */
.lab8-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #98989f;
}
.lab8-card {
  background: #141416;
  border: 1px solid #232327;
  border-radius: 22px;
  padding: 20px;
}
.lab8-sectionTitle {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #98989f;
  margin: 36px 0 12px;
}
.lab8-chip {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  padding: 3px 9px;
  border-radius: 999px;
  background: #232327;
  color: #c7c7cc;
}

/* ---------- home ---------- */
.lab8-greeting {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 4px 0 0;
}
.lab8-hero {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-top: 28px;
}
.lab8-dial { flex: 0 0 auto; }
.lab8-dialTrack {
  fill: none;
  stroke: #232327;
  stroke-width: 10;
  stroke-linecap: round;
}
.lab8-dialFill {
  fill: none;
  stroke: #30d158;
  stroke-width: 10;
  stroke-linecap: round;
  stroke-dasharray: ${FILL_LEN} 100;
  stroke-dashoffset: ${FILL_LEN};
  animation: lab8-dial-close 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
}
.lab8-dialScore {
  font-family: 'Inter Tight', 'Inter', system-ui, sans-serif;
  font-size: 44px;
  font-weight: 800;
  letter-spacing: -0.02em;
  fill: #f5f5f7;
}
.lab8-dialGoal {
  font-size: 13px;
  font-weight: 600;
  fill: #98989f;
}
.lab8-heroFacts { display: grid; gap: 14px; }
.lab8-fact { display: grid; gap: 2px; }
.lab8-factValue {
  font-family: 'Inter Tight', 'Inter', system-ui, sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.lab8-factValue em {
  font-style: normal;
  color: #30d158;
}
.lab8-factLabel { font-size: 13px; color: #98989f; }

.lab8-resume {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #141416;
  border: 1px solid #232327;
  border-radius: 22px;
  padding: 18px 20px;
  transition: border-color 0.2s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.lab8-resume:hover { border-color: #30d158; transform: translateY(-1px); }
.lab8-resume:focus-visible { outline: 2px solid #30d158; outline-offset: 2px; }
.lab8-resumeMeta { font-size: 13px; color: #98989f; margin-top: 2px; }
.lab8-resumeTitle { font-size: 16px; font-weight: 600; }
.lab8-resumeGo {
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 600;
  color: #000;
  background: #30d158;
  border-radius: 999px;
  padding: 9px 18px;
}

.lab8-planList { display: grid; gap: 10px; }
.lab8-planItem {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.lab8-planMin {
  flex: 0 0 52px;
  text-align: center;
  font-family: 'Inter Tight', 'Inter', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #30d158;
  line-height: 1.1;
  padding-top: 2px;
}
.lab8-planMin small {
  display: block;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #98989f;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.lab8-planHead { font-size: 15px; font-weight: 600; }
.lab8-planWhy { font-size: 13px; color: #98989f; margin-top: 2px; }
.lab8-planTotal {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #232327;
  font-size: 13px;
  color: #98989f;
}
.lab8-planTotal strong { color: #f5f5f7; font-weight: 600; }

.lab8-trap {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #232327;
}
.lab8-trap:last-child { border-bottom: 0; padding-bottom: 4px; }
.lab8-trapCount {
  flex: 0 0 auto;
  font-family: 'Inter Tight', 'Inter', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #ff453a;
  min-width: 34px;
}
.lab8-trapText { font-size: 14px; }
.lab8-trapSection { margin-left: 8px; }

/* ---------- drill ---------- */
.lab8-headword {
  font-family: 'Inter Tight', 'Inter', system-ui, sans-serif;
  font-size: 52px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 10px 0 0;
}
.lab8-tactic {
  margin-top: 20px;
  background: rgba(100, 210, 255, 0.08);
  border: 1px solid rgba(100, 210, 255, 0.28);
  border-radius: 18px;
  padding: 14px 18px;
}
.lab8-tacticHandle {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64d2ff;
}
.lab8-tacticMove { font-size: 14px; color: #d8eefb; margin-top: 4px; }

.lab8-options { display: grid; gap: 10px; margin-top: 24px; }
.lab8-option {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  background: #141416;
  border: 1px solid #232327;
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 16px;
  transition: border-color 0.18s ease, background 0.18s ease,
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
.lab8-option:hover:not(:disabled) { border-color: #4a4a52; transform: translateY(-1px); }
.lab8-option:focus-visible { outline: 2px solid #64d2ff; outline-offset: 2px; }
.lab8-option:disabled { cursor: default; }
.lab8-optionKey {
  flex: 0 0 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: #232327;
  font-size: 13px;
  font-weight: 700;
  color: #98989f;
}
.lab8-option--correct {
  border-color: #30d158;
  background: rgba(48, 209, 88, 0.1);
  animation: lab8-pop 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.lab8-option--correct .lab8-optionKey { background: #30d158; color: #000; }
.lab8-option--wrong {
  border-color: #ff453a;
  background: rgba(255, 69, 58, 0.1);
  animation: lab8-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
.lab8-option--wrong .lab8-optionKey { background: #ff453a; color: #000; }
.lab8-option--dim { opacity: 0.45; }

.lab8-verdict {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 22px;
  font-family: 'Inter Tight', 'Inter', system-ui, sans-serif;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.1em;
  padding: 8px 18px;
  border-radius: 999px;
  animation: lab8-stamp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.lab8-verdict--ratt { background: #30d158; color: #000; }
.lab8-verdict--fel { background: #ff453a; color: #000; }

.lab8-pedagogy { margin-top: 8px; }
.lab8-solution {
  background: #141416;
  border: 1px solid #232327;
  border-left: 3px solid #30d158;
  border-radius: 18px;
  padding: 16px 18px;
  font-size: 15px;
}
.lab8-step { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid #232327; }
.lab8-step:last-child { border-bottom: 0; }
.lab8-stepN {
  flex: 0 0 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #232327;
  font-family: 'Inter Tight', 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #30d158;
}
.lab8-stepTitle { font-size: 15px; font-weight: 600; }
.lab8-stepTier { margin-left: 10px; vertical-align: 2px; }
.lab8-stepText { font-size: 14px; color: #c7c7cc; margin-top: 4px; }

.lab8-distractor { padding: 16px 0; border-bottom: 1px solid #232327; }
.lab8-distractor:last-child { border-bottom: 0; }
.lab8-distractorHead {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
}
.lab8-distractorLetter {
  flex: 0 0 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(255, 69, 58, 0.14);
  color: #ff453a;
  font-size: 13px;
  font-weight: 700;
}
.lab8-why { font-size: 14px; color: #c7c7cc; margin-top: 8px; }
.lab8-why strong {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #98989f;
  margin-bottom: 2px;
}

.lab8-next {
  display: block;
  width: 100%;
  margin-top: 28px;
  background: #30d158;
  color: #000;
  font-size: 16px;
  font-weight: 700;
  border-radius: 18px;
  padding: 16px;
  text-align: center;
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), filter 0.18s ease;
}
.lab8-next:hover { transform: translateY(-1px); filter: brightness(1.08); }
.lab8-next:focus-visible { outline: 2px solid #f5f5f7; outline-offset: 2px; }
.lab8-nextHint { font-size: 12px; color: #98989f; text-align: center; margin-top: 10px; }
`

function Dial() {
  return (
    <svg
      className="lab8-dial"
      width="172"
      height="172"
      viewBox="0 0 200 200"
      role="img"
      aria-label={`Prognos ${HOME.projectedScore} av ${GOAL.toFixed(1)}`}
    >
      <g transform="rotate(150 100 100)">
        <circle
          className="lab8-dialTrack"
          cx="100"
          cy="100"
          r="84"
          pathLength={100}
          strokeDasharray={`${DIAL_LEN} ${100 - DIAL_LEN}`}
        />
        <circle className="lab8-dialFill" cx="100" cy="100" r="84" pathLength={100} />
      </g>
      <text className="lab8-dialScore" x="100" y="104" textAnchor="middle">
        {HOME.projectedScore}
      </text>
      <text className="lab8-dialGoal" x="100" y="130" textAnchor="middle">
        av {GOAL.toFixed(1)}
      </text>
    </svg>
  )
}

function Home() {
  return (
    <div className="lab8-shell">
      <header className="lab8-rise">
        <div className="lab8-eyebrow">{HOME.dateLabel}</div>
        <h1 className="lab8-greeting lab8-tight">{HOME.greeting}</h1>
      </header>

      <div className="lab8-hero lab8-rise" style={{ animationDelay: '70ms' }}>
        <Dial />
        <div className="lab8-heroFacts">
          <div className="lab8-fact">
            <span className="lab8-factValue">
              <em>{HOME.scoreDelta.split(' ')[0]}</em>
            </span>
            <span className="lab8-factLabel">{HOME.scoreDelta.replace(/^\S+\s/, '')}</span>
          </div>
          <div className="lab8-fact">
            <span className="lab8-factValue">{HOME.streakDays} dagar</span>
            <span className="lab8-factLabel">i rad — håll lugnt tempo</span>
          </div>
        </div>
      </div>

      <h2 className="lab8-sectionTitle lab8-rise" style={{ animationDelay: '140ms' }}>
        Fortsätt där du var
      </h2>
      <button
        type="button"
        className="lab8-reset lab8-resume lab8-rise"
        style={{ animationDelay: '170ms' }}
      >
        <span>
          <span className="lab8-resumeTitle">
            {HOME.resume.kind} · {HOME.resume.section}
          </span>
          <div className="lab8-resumeMeta">
            Fråga {HOME.resume.position} av {HOME.resume.total} · {HOME.resume.device} ·{' '}
            {HOME.resume.when}
          </div>
        </span>
        <span className="lab8-resumeGo">Fortsätt</span>
      </button>

      <h2 className="lab8-sectionTitle lab8-rise" style={{ animationDelay: '220ms' }}>
        Dagens plan · ca {HOME.estimatedMinutes} min
      </h2>
      <div className="lab8-card lab8-rise" style={{ animationDelay: '250ms' }}>
        <div className="lab8-planList">
          {HOME.plan.map((item) => (
            <div key={item.id} className="lab8-planItem">
              <div className="lab8-planMin">
                {item.minutes}
                <small>min</small>
              </div>
              <div>
                <div className="lab8-planHead">{item.headline}</div>
                <div className="lab8-planWhy">{item.rationale}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="lab8-planTotal">
          Tre block, <strong>{HOME.estimatedMinutes} minuter</strong> — sedan är dagen klar. Inget
          mer krävs.
        </div>
      </div>

      <h2 className="lab8-sectionTitle lab8-rise" style={{ animationDelay: '320ms' }}>
        Dina vanligaste fällor
      </h2>
      <div className="lab8-card lab8-rise" style={{ animationDelay: '350ms' }}>
        {HOME.traps.map((trap) => (
          <div key={trap.id} className="lab8-trap">
            <span className="lab8-trapCount">×{trap.count}</span>
            <span className="lab8-trapText">
              {trap.headline}
              <span className="lab8-chip lab8-trapSection">{trap.section}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Drill() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [picked, setPicked] = useState<string | null>(null)
  const [round, setRound] = useState(0)

  const correct = picked === QUESTION.answer

  useEffect(() => {
    if (phase !== 'graded') return
    const t = window.setTimeout(() => setPhase('pedagogy'), 900)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    const letters = QUESTION.options.map((o) => o.letter)
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase()
      if (phase === 'idle' && letters.includes(k as (typeof letters)[number])) {
        setPicked(k)
        setPhase('graded')
      } else if (phase === 'pedagogy' && e.key === 'Enter') {
        setPicked(null)
        setPhase('idle')
        setRound((r) => r + 1)
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
    setRound((r) => r + 1)
  }

  const optionClass = (letter: string): string => {
    const base = 'lab8-reset lab8-option'
    if (phase === 'idle') return base
    if (letter === QUESTION.answer) return `${base} lab8-option--correct`
    if (letter === picked) return `${base} lab8-option--wrong`
    return `${base} lab8-option--dim`
  }

  return (
    <div className="lab8-shell" key={round}>
      <header className="lab8-rise">
        <div className="lab8-eyebrow">
          {QUESTION.section} · {QUESTION.sectionLabel} · Fråga {QUESTION.number} av {QUESTION.total}
        </div>
        <h1 className="lab8-headword">{QUESTION.prompt}</h1>
      </header>

      <div className="lab8-tactic lab8-rise" style={{ animationDelay: '80ms' }}>
        <div className="lab8-tacticHandle">Taktik · {EXPLANATION.pregradeTactic.handle}</div>
        <div className="lab8-tacticMove">{EXPLANATION.pregradeTactic.move}</div>
      </div>

      <div className="lab8-options">
        {QUESTION.options.map((opt, i) => (
          <button
            key={opt.letter}
            type="button"
            className={`${optionClass(opt.letter)} lab8-rise`}
            style={{ animationDelay: `${140 + i * 50}ms` }}
            onClick={() => pick(opt.letter)}
            disabled={phase !== 'idle'}
          >
            <span className="lab8-optionKey">{opt.letter.toLowerCase()}</span>
            <span>{opt.text}</span>
          </button>
        ))}
      </div>

      {phase !== 'idle' && (
        <div className={`lab8-verdict ${correct ? 'lab8-verdict--ratt' : 'lab8-verdict--fel'}`}>
          {correct ? 'RÄTT' : 'FEL'}
        </div>
      )}

      {phase === 'pedagogy' && (
        <div className="lab8-pedagogy">
          <h2 className="lab8-sectionTitle lab8-rise">Lösning</h2>
          <p className="lab8-solution lab8-rise" style={{ animationDelay: '60ms' }}>
            {EXPLANATION.solution}
          </p>

          <h2 className="lab8-sectionTitle lab8-rise" style={{ animationDelay: '120ms' }}>
            Så tänker du
          </h2>
          <div className="lab8-card lab8-rise" style={{ animationDelay: '150ms' }}>
            {EXPLANATION.steps.map((step) => (
              <div key={step.n} className="lab8-step">
                <span className="lab8-stepN">{step.n}</span>
                <div>
                  <div className="lab8-stepTitle">
                    {step.title}
                    <span className="lab8-chip lab8-stepTier">
                      {step.tier === 'essential' ? 'kärna' : 'fördjupning'}
                    </span>
                  </div>
                  <p className="lab8-stepText">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="lab8-sectionTitle lab8-rise" style={{ animationDelay: '220ms' }}>
            Varför de andra lockar
          </h2>
          <div className="lab8-card lab8-rise" style={{ animationDelay: '250ms' }}>
            {EXPLANATION.distractors.map((d) => (
              <div key={d.letter} className="lab8-distractor">
                <div className="lab8-distractorHead">
                  <span className="lab8-distractorLetter">{d.letter}</span>
                  <span>{d.text}</span>
                </div>
                <p className="lab8-why">
                  <strong>Därför lockar det</strong>
                  {d.whyTempting}
                </p>
                <p className="lab8-why">
                  <strong>Därför är det fel</strong>
                  {d.whyWrong}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="lab8-reset lab8-next lab8-rise"
            style={{ animationDelay: '320ms' }}
            onClick={reset}
          >
            Nästa fråga
          </button>
          <div className="lab8-nextHint">Tryck Enter för att gå vidare</div>
        </div>
      )}
    </div>
  )
}

export function Lab8({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="lab8-root">
      <style>{css}</style>
      {screen === 'home' ? <Home /> : <Drill />}
    </div>
  )
}
