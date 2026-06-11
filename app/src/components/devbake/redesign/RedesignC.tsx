import { useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from './fixtures'

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")"

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500&display=swap');

.rdc-root {
  --rdc-ground: #F4EEE4;
  --rdc-ink: #2A2118;
  --rdc-ink-soft: rgba(42, 33, 24, 0.62);
  --rdc-ink-faint: rgba(42, 33, 24, 0.42);
  --rdc-terra: #BE5A38;
  --rdc-terra-deep: #A84B2C;
  --rdc-pine: #2E4639;
  --rdc-cream: #FBF7EF;
  --rdc-line: rgba(42, 33, 24, 0.10);
  --rdc-shadow-raised: 0 1px 2px rgba(42,33,24,.08), 0 12px 32px rgba(42,33,24,.10);
  --rdc-shadow-sheet: 0 1px 2px rgba(42,33,24,.08), 0 24px 64px rgba(42,33,24,.16);
  --rdc-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  min-height: 100dvh;
  position: relative;
  background-color: var(--rdc-ground);
  background-image: radial-gradient(1100px 540px at 50% -120px, #FCF6EA 0%, #F8F1E5 38%, var(--rdc-ground) 72%);
  color: var(--rdc-ink);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.rdc-root::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: ${GRAIN};
  background-repeat: repeat;
  pointer-events: none;
  z-index: 0;
}
.rdc-page {
  position: relative;
  z-index: 1;
  max-width: 1160px;
  margin: 0 auto;
  padding: 28px 40px 88px;
}
.rdc-serif { font-family: 'Fraunces', serif; }
.rdc-display {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-variation-settings: 'opsz' 110, 'WONK' 1, 'SOFT' 40;
  letter-spacing: -0.01em;
}

/* ---- header ---- */
.rdc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 44px;
}
.rdc-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 19px;
}
.rdc-brand-dot {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: var(--rdc-pine);
  box-shadow: inset 0 -2px 4px rgba(0,0,0,.25), inset 0 1px 1px rgba(255,255,255,.22), 0 1px 2px rgba(42,33,24,.18);
}
.rdc-header-meta {
  font-size: 13px;
  font-weight: 500;
  color: var(--rdc-ink-soft);
  background: var(--rdc-cream);
  border: 1px solid var(--rdc-line);
  border-radius: 999px;
  padding: 7px 16px;
  box-shadow: 0 1px 2px rgba(42,33,24,.08);
}

/* ---- shared surfaces (3 elevations: ground / raised / sheet) ---- */
.rdc-card {
  background: var(--rdc-cream);
  border-radius: 22px;
  box-shadow: var(--rdc-shadow-raised);
  border: 1px solid rgba(255,255,255,.7);
}
.rdc-kicker {
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--rdc-ink-faint);
}

/* ---- buttons: physical press ---- */
.rdc-press {
  transition: transform 320ms var(--rdc-spring), box-shadow 320ms var(--rdc-spring);
}
.rdc-press:active {
  transform: scale(0.985);
  box-shadow: 0 1px 2px rgba(42,33,24,.10), 0 4px 10px rgba(42,33,24,.08);
  transition-duration: 90ms;
}
.rdc-cta {
  appearance: none;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: #FBF7EF;
  background: linear-gradient(180deg, #C9663F, var(--rdc-terra) 55%, var(--rdc-terra-deep));
  border-radius: 16px;
  padding: 15px 30px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 1px 2px rgba(42,33,24,.14), 0 10px 24px rgba(190,90,56,.32);
  transition: transform 320ms var(--rdc-spring), box-shadow 320ms var(--rdc-spring);
}
.rdc-cta:hover { transform: translateY(-1px); }
.rdc-cta:active {
  transform: scale(0.97) translateY(0);
  box-shadow: inset 0 2px 5px rgba(0,0,0,.22), 0 1px 2px rgba(42,33,24,.12);
  transition-duration: 90ms;
}
.rdc-ghost {
  appearance: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--rdc-pine);
  background: transparent;
  border: 1.5px solid rgba(46,70,57,.35);
  border-radius: 999px;
  padding: 8px 18px;
}

/* ================= HOME ================= */
.rdc-home-grid {
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: 28px;
  align-items: start;
}
.rdc-greeting {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-weight: 500;
  font-variation-settings: 'opsz' 90;
  font-size: 34px;
  line-height: 1.15;
  margin: 0 0 6px;
}
.rdc-date {
  color: var(--rdc-ink-soft);
  font-size: 14px;
  margin: 0 0 28px;
}
.rdc-hero {
  padding: 34px 36px 30px;
  display: flex;
  align-items: center;
  gap: 36px;
  margin-bottom: 24px;
}
.rdc-hero-score {
  font-size: 96px;
  line-height: 0.95;
}
.rdc-hero-label { margin-bottom: 10px; }
.rdc-delta-pill {
  display: inline-block;
  margin-top: 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--rdc-pine);
  background: rgba(46,70,57,.10);
  border: 1px solid rgba(46,70,57,.16);
  border-radius: 999px;
  padding: 6px 14px;
}
.rdc-coin-wrap {
  margin-left: auto;
  text-align: center;
}
.rdc-coin {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  margin: 0 auto 10px;
  background: linear-gradient(160deg, #F3E7D2, #E5D5BA);
  box-shadow:
    inset 0 2px 3px rgba(255,255,255,.85),
    inset 0 -3px 6px rgba(42,33,24,.18),
    0 1px 2px rgba(42,33,24,.10),
    0 8px 20px rgba(42,33,24,.14);
  display: grid;
  place-items: center;
}
.rdc-coin-inner {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(200deg, #EADCC2, #F4EAD6);
  box-shadow: inset 0 1px 3px rgba(42,33,24,.22), inset 0 -1px 1px rgba(255,255,255,.7);
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 30px;
  color: var(--rdc-terra-deep);
}
.rdc-coin-label {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--rdc-ink-soft);
}
.rdc-resume {
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  color: var(--rdc-ink);
  padding: 22px 26px;
  display: flex;
  align-items: center;
  gap: 18px;
}
.rdc-resume-arrow {
  margin-left: auto;
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--rdc-terra);
  color: #FBF7EF;
  font-size: 18px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 4px 12px rgba(190,90,56,.35);
}
.rdc-resume-title {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 18px;
  margin: 0 0 3px;
}
.rdc-resume-sub {
  font-size: 13.5px;
  color: var(--rdc-ink-soft);
  margin: 0;
}
.rdc-section-title {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 21px;
  margin: 0 0 16px;
}
.rdc-plan-item {
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  color: var(--rdc-ink);
  padding: 18px 22px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.rdc-plan-item + .rdc-plan-item { margin-top: 12px; }
.rdc-plan-min {
  flex: none;
  min-width: 56px;
  text-align: center;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 17px;
  color: var(--rdc-pine);
  background: rgba(46,70,57,.08);
  border-radius: 12px;
  padding: 9px 8px;
}
.rdc-plan-min small {
  display: block;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 10.5px;
  color: var(--rdc-ink-faint);
  letter-spacing: 0.06em;
}
.rdc-plan-head {
  font-weight: 500;
  font-size: 15px;
  margin: 0 0 3px;
}
.rdc-plan-why {
  font-size: 13px;
  color: var(--rdc-ink-soft);
  margin: 0;
}
.rdc-trap {
  padding: 16px 20px;
  display: flex;
  gap: 14px;
  align-items: baseline;
}
.rdc-trap + .rdc-trap { margin-top: 12px; }
.rdc-trap-badge {
  flex: none;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--rdc-terra-deep);
  background: rgba(190,90,56,.10);
  border: 1px solid rgba(190,90,56,.18);
  border-radius: 999px;
  padding: 4px 11px;
}
.rdc-trap-text {
  font-size: 13.5px;
  margin: 0;
}
.rdc-trap-count {
  margin-left: auto;
  flex: none;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 16px;
  color: var(--rdc-ink-soft);
}

/* ================= DRILL ================= */
.rdc-drill { max-width: 760px; margin: 0 auto; }
.rdc-drill-meta {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 26px;
}
.rdc-drill-progress {
  margin-left: auto;
  font-size: 13px;
  color: var(--rdc-ink-soft);
}
.rdc-prompt-card {
  padding: 34px 38px 30px;
  margin-bottom: 18px;
}
.rdc-prompt-word {
  font-size: 50px;
  line-height: 1.05;
  margin: 6px 0 0;
}
.rdc-tactic {
  margin-top: 22px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  background: rgba(46,70,57,.07);
  border: 1px solid rgba(46,70,57,.14);
  border-radius: 16px;
  padding: 14px 18px;
}
.rdc-tactic-handle {
  flex: none;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 14px;
  color: var(--rdc-pine);
  padding-top: 1px;
}
.rdc-tactic-move {
  font-size: 13.5px;
  color: var(--rdc-ink);
  margin: 0;
}
.rdc-opts { display: grid; gap: 12px; }
.rdc-opt {
  appearance: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  color: var(--rdc-ink);
  background: var(--rdc-cream);
  border: 1px solid rgba(255,255,255,.7);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 16px;
  box-shadow: var(--rdc-shadow-raised);
  transition: transform 320ms var(--rdc-spring), box-shadow 320ms var(--rdc-spring), background-color 240ms ease;
  position: relative;
  overflow: hidden;
}
.rdc-opt:hover:enabled {
  transform: translateY(-2px);
  box-shadow: 0 1px 2px rgba(42,33,24,.08), 0 16px 36px rgba(42,33,24,.13);
}
.rdc-opt:active:enabled {
  transform: scale(0.985);
  box-shadow: 0 1px 2px rgba(42,33,24,.10), 0 4px 10px rgba(42,33,24,.08);
  transition-duration: 90ms;
}
.rdc-opt:disabled { cursor: default; }
.rdc-opt-letter {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 15px;
  background: rgba(42,33,24,.06);
  box-shadow: inset 0 1px 2px rgba(42,33,24,.10), inset 0 -1px 0 rgba(255,255,255,.6);
}
.rdc-opt-dim { opacity: 0.45; }
.rdc-opt-picked { animation: rdcSquash 420ms var(--rdc-spring); }
.rdc-opt-correct {
  animation: rdcSquash 420ms var(--rdc-spring);
  background: #E7EEE7;
  border-color: rgba(46,70,57,.30);
}
.rdc-opt-correct::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(140% 160% at 12% 50%, rgba(46,70,57,.20), rgba(46,70,57,0) 70%);
  animation: rdcWash 600ms ease-out both;
  pointer-events: none;
}
.rdc-opt-correct .rdc-opt-letter { background: var(--rdc-pine); color: #FBF7EF; }
.rdc-opt-wrong {
  animation: rdcShake 360ms ease-in-out;
  background: #F4E2D8;
  border-color: rgba(190,90,56,.35);
}
.rdc-opt-wrong .rdc-opt-letter { background: var(--rdc-terra); color: #FBF7EF; }
.rdc-opt-reveal {
  animation: rdcReveal 480ms var(--rdc-spring) 260ms both;
  background: #E7EEE7;
  border-color: rgba(46,70,57,.30);
}
.rdc-check {
  margin-left: auto;
  flex: none;
  stroke: var(--rdc-pine);
  stroke-width: 3;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: rdcDraw 350ms ease-out 180ms forwards;
}
.rdc-cross {
  margin-left: auto;
  flex: none;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 18px;
  color: var(--rdc-terra-deep);
}
.rdc-verdict {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 26px 0 10px;
  animation: rdcRise 480ms var(--rdc-spring) both;
}
.rdc-verdict-word {
  font-size: 32px;
  letter-spacing: 0.02em;
}
.rdc-verdict-ratt { color: var(--rdc-pine); }
.rdc-verdict-fel { color: var(--rdc-terra-deep); }
.rdc-verdict-sub { font-size: 14px; color: var(--rdc-ink-soft); }

/* pedagogy: the rising sheet */
.rdc-sheet {
  margin-top: 16px;
  background: var(--rdc-cream);
  border: 1px solid rgba(255,255,255,.7);
  border-radius: 24px;
  box-shadow: var(--rdc-shadow-sheet);
  padding: 30px 32px 32px;
  animation: rdcRise 560ms var(--rdc-spring) 140ms both;
}
.rdc-solution {
  font-family: 'Fraunces', serif;
  font-weight: 500;
  font-size: 20px;
  line-height: 1.4;
  margin: 6px 0 24px;
}
.rdc-step {
  background: #F7F1E6;
  border: 1px solid var(--rdc-line);
  border-radius: 16px;
  padding: 18px 22px;
  animation: rdcRise 480ms var(--rdc-spring) both;
}
.rdc-step + .rdc-step { margin-top: 12px; }
.rdc-step-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 16.5px;
  margin: 0 0 6px;
}
.rdc-step-n {
  flex: none;
  font-size: 13px;
  color: var(--rdc-terra-deep);
}
.rdc-step-text { font-size: 14px; margin: 0; color: var(--rdc-ink); }
.rdc-distractors-title { margin: 28px 0 14px; }
.rdc-distractor {
  background: #F7F1E6;
  border: 1px solid var(--rdc-line);
  border-radius: 16px;
  padding: 16px 22px;
  animation: rdcRise 480ms var(--rdc-spring) both;
}
.rdc-distractor + .rdc-distractor { margin-top: 12px; }
.rdc-distractor-head {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 15.5px;
  margin: 0 0 8px;
}
.rdc-distractor p { font-size: 13.5px; margin: 0; }
.rdc-distractor p + p { margin-top: 7px; }
.rdc-distractor strong { font-weight: 500; color: var(--rdc-pine); }
.rdc-distractor strong.rdc-warm { color: var(--rdc-terra-deep); }
.rdc-next-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 28px;
}
.rdc-kbd-hint { font-size: 12.5px; color: var(--rdc-ink-faint); }
.rdc-kbd {
  font-size: 11.5px;
  font-weight: 500;
  border: 1px solid var(--rdc-line);
  border-bottom-width: 2px;
  border-radius: 6px;
  background: var(--rdc-cream);
  padding: 1px 6px;
}

/* ---- keyframes ---- */
@keyframes rdcSquash {
  0% { transform: scale(1); }
  35% { transform: scale(0.96, 0.93); }
  100% { transform: scale(1); }
}
@keyframes rdcShake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-3px); }
  35% { transform: translateX(3px); }
  55% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
@keyframes rdcWash {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes rdcDraw {
  to { stroke-dashoffset: 0; }
}
@keyframes rdcReveal {
  from { transform: translateY(0); box-shadow: var(--rdc-shadow-raised); }
  to { transform: translateY(-2px); box-shadow: 0 1px 2px rgba(42,33,24,.08), 0 16px 36px rgba(46,70,57,.18); }
}
@keyframes rdcRise {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 960px) {
  .rdc-page { padding: 24px 22px 64px; }
  .rdc-home-grid { grid-template-columns: 1fr; }
  .rdc-hero { flex-wrap: wrap; gap: 24px; }
  .rdc-hero-score { font-size: 72px; }
}

@media (prefers-reduced-motion: reduce) {
  .rdc-root *, .rdc-root *::before, .rdc-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
  .rdc-check { stroke-dashoffset: 0; }
}
`

type Phase = 'idle' | 'graded'

const KEY_LETTERS: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' }

function HomeScreen() {
  return (
    <div className="rdc-home-grid">
      <div>
        <h1 className="rdc-greeting">{HOME.greeting}</h1>
        <p className="rdc-date">{HOME.dateLabel}</p>

        <section className="rdc-card rdc-hero">
          <div>
            <div className="rdc-kicker rdc-hero-label">Beräknat resultat</div>
            <div className="rdc-display rdc-hero-score">{HOME.projectedScore}</div>
            <span className="rdc-delta-pill">{HOME.scoreDelta}</span>
          </div>
          <div className="rdc-coin-wrap">
            <div className="rdc-coin">
              <div className="rdc-coin-inner">{HOME.streakDays}</div>
            </div>
            <div className="rdc-coin-label">{HOME.streakDays} dagar i rad</div>
          </div>
        </section>

        <button type="button" className="rdc-card rdc-press rdc-resume">
          <div>
            <div className="rdc-kicker">Fortsätt här</div>
            <p className="rdc-resume-title">
              {HOME.resume.kind} {HOME.resume.section}
            </p>
            <p className="rdc-resume-sub">
              fråga {HOME.resume.position} av {HOME.resume.total} · {HOME.resume.device} ·{' '}
              {HOME.resume.when}
            </p>
          </div>
          <span className="rdc-resume-arrow" aria-hidden="true">
            →
          </span>
        </button>
      </div>

      <div>
        <h2 className="rdc-section-title">Dagens plan · {HOME.estimatedMinutes} min</h2>
        <div>
          {HOME.plan.map((item) => (
            <button key={item.id} type="button" className="rdc-card rdc-press rdc-plan-item">
              <span className="rdc-plan-min">
                {item.minutes}
                <small>MIN</small>
              </span>
              <span>
                <p className="rdc-plan-head">{item.headline}</p>
                <p className="rdc-plan-why">{item.rationale}</p>
              </span>
            </button>
          ))}
        </div>

        <h2 className="rdc-section-title" style={{ marginTop: 32 }}>
          Dina fällor just nu
        </h2>
        <div>
          {HOME.traps.map((trap) => (
            <div key={trap.id} className="rdc-card rdc-trap">
              <span className="rdc-trap-badge">{trap.section}</span>
              <p className="rdc-trap-text">{trap.headline}</p>
              <span className="rdc-trap-count">×{trap.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DrillScreen() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [picked, setPicked] = useState<string | null>(null)

  const correct = picked === QUESTION.answer

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (phase === 'graded') {
        if (e.key === 'Enter') {
          setPicked(null)
          setPhase('idle')
        }
        return
      }
      const letter = KEY_LETTERS[e.key.toLowerCase()]
      if (letter) {
        setPicked(letter)
        setPhase('graded')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  const optionClass = (letter: string): string => {
    const base = 'rdc-opt'
    if (phase === 'idle') return base
    if (letter === picked) {
      return correct ? `${base} rdc-opt-correct` : `${base} rdc-opt-wrong`
    }
    if (letter === QUESTION.answer) return `${base} rdc-opt-reveal`
    return `${base} rdc-opt-dim`
  }

  return (
    <div className="rdc-drill">
      <div className="rdc-drill-meta">
        <span className="rdc-kicker">
          {QUESTION.section} · {QUESTION.sectionLabel}
        </span>
        <span className="rdc-drill-progress">
          fråga {QUESTION.number} av {QUESTION.total}
        </span>
      </div>

      <section className="rdc-card rdc-prompt-card">
        <div className="rdc-kicker">Vilket svarsförslag ligger närmast?</div>
        <h1 className="rdc-display rdc-prompt-word">{QUESTION.prompt}</h1>
        <div className="rdc-tactic">
          <span className="rdc-tactic-handle">{EXPLANATION.pregradeTactic.handle}</span>
          <p className="rdc-tactic-move">{EXPLANATION.pregradeTactic.move}</p>
        </div>
      </section>

      <div className="rdc-opts">
        {QUESTION.options.map((opt) => (
          <button
            key={opt.letter}
            type="button"
            disabled={phase === 'graded'}
            className={optionClass(opt.letter)}
            onClick={() => {
              setPicked(opt.letter)
              setPhase('graded')
            }}
          >
            <span className="rdc-opt-letter">{opt.letter}</span>
            <span>{opt.text}</span>
            {phase === 'graded' && opt.letter === QUESTION.answer && (
              <svg
                className="rdc-check"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M4 12.5l5.2 5L20 6.5" />
              </svg>
            )}
            {phase === 'graded' && opt.letter === picked && !correct && (
              <span className="rdc-cross" aria-hidden="true">
                ✕
              </span>
            )}
          </button>
        ))}
      </div>

      {phase === 'graded' && (
        <>
          <div className="rdc-verdict">
            <span
              className={`rdc-display rdc-verdict-word ${
                correct ? 'rdc-verdict-ratt' : 'rdc-verdict-fel'
              }`}
            >
              {correct ? 'RÄTT' : 'FEL'}
            </span>
            <span className="rdc-verdict-sub">
              {correct
                ? 'Snyggt — du läste efter- som riktning, inte som bakom.'
                : `Rätt svar är ${QUESTION.answer}. Här är varför.`}
            </span>
          </div>

          <section className="rdc-sheet">
            <div className="rdc-kicker">Lösning</div>
            <p className="rdc-solution">{EXPLANATION.solution}</p>

            {EXPLANATION.steps.map((step, i) => (
              <div
                key={step.n}
                className="rdc-step"
                style={{ animationDelay: `${200 + i * 90}ms` }}
              >
                <h3 className="rdc-step-title">
                  <span className="rdc-step-n">Steg {step.n}</span>
                  {step.title}
                </h3>
                <p className="rdc-step-text">{step.text}</p>
              </div>
            ))}

            <h3 className="rdc-display rdc-distractors-title" style={{ fontSize: 19 }}>
              Varför inte de andra
            </h3>
            {EXPLANATION.distractors.map((d, i) => (
              <div
                key={d.letter}
                className="rdc-distractor"
                style={{ animationDelay: `${520 + i * 90}ms` }}
              >
                <h4 className="rdc-distractor-head">
                  {d.letter} · {d.text}
                </h4>
                <p>
                  <strong className="rdc-warm">Varför det lockar: </strong>
                  {d.whyTempting}
                </p>
                <p>
                  <strong>Varför det är fel: </strong>
                  {d.whyWrong}
                </p>
              </div>
            ))}

            <div className="rdc-next-row">
              <span className="rdc-kbd-hint">
                <span className="rdc-kbd">Enter</span> för nästa
              </span>
              <button
                type="button"
                className="rdc-cta"
                onClick={() => {
                  setPicked(null)
                  setPhase('idle')
                }}
              >
                Nästa fråga
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export function RedesignC({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="rdc-root">
      <style>{styles}</style>
      <div className="rdc-page">
        <header className="rdc-header">
          <div className="rdc-brand">
            <span className="rdc-brand-dot" aria-hidden="true" />
            HP-Coach
          </div>
          <span className="rdc-header-meta">
            {screen === 'home' ? 'Hem' : `${QUESTION.sectionLabel} · övning`}
          </span>
        </header>
        {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
      </div>
    </div>
  )
}
