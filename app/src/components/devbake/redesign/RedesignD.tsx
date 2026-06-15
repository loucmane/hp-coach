// Redesign bake-off — variant D: "LUMEN · quiet precision".
// Linear/Things register on HP-Coach's own tokens: all-sans, one large
// moment per screen, token-only color, whisper-fast motion.

import { useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from './fixtures'

const LETTERS = 'abcde'

const CSS = `
.rdd-root {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.55;
}
.rdd-wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 72px 28px 120px;
}
.rdd-num { font-variant-numeric: tabular-nums; }

.rdd-eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.rdd-display {
  margin: 14px 0 0;
  font-size: 56px;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.05;
  color: var(--ink);
}
@media (max-width: 520px) {
  .rdd-display { font-size: 40px; }
}

.rdd-in { animation: rdd-up 200ms var(--ease-reading) both; }
@keyframes rdd-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
@keyframes rdd-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@keyframes rdd-sweep {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes rdd-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.rdd-reset {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  margin: 0;
  text-align: left;
  cursor: pointer;
}
.rdd-root :focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 6px;
}

/* ---- drill ---- */
.rdd-hint {
  margin-top: 28px;
  padding-left: 16px;
  border-left: 2px solid var(--hairline-2);
}
.rdd-hint-handle {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-2);
}
.rdd-hint-move {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--muted);
  max-width: 56ch;
}

.rdd-opts {
  margin: 44px 0 0;
  padding: 0;
  border: 0;
  border-top: 1px solid var(--hairline);
  min-width: 0;
}
.rdd-opt {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding: 15px 14px;
  border-bottom: 1px solid var(--hairline);
  border-radius: 0;
  font-size: 18px;
  transition: background-color 150ms var(--ease-reading);
}
.rdd-opt:hover:enabled { background: var(--panel); }
.rdd-opt:disabled { cursor: default; }
.rdd-opt > * { position: relative; z-index: 1; }
.rdd-opt-letter {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  width: 14px;
  flex: none;
}
.rdd-opt-fill {
  position: absolute;
  inset: 0;
  z-index: 0;
  transform-origin: left;
  animation: rdd-sweep 180ms var(--ease-reading) both;
}
.rdd-opt-fill--ok { background: var(--ok-soft); }
.rdd-opt-fill--bad { background: var(--bad-soft); }
.rdd-opt-glyph {
  margin-left: auto;
  font-size: 14px;
  line-height: 1;
  animation: rdd-fade 150ms var(--ease-reading) 140ms both;
}
.rdd-opt-glyph--ok { color: var(--ok); }
.rdd-opt-glyph--bad { color: var(--bad); }
.rdd-opt--key {
  box-shadow: inset 0 0 0 1.5px var(--ok);
  border-radius: 8px;
}

.rdd-verdict {
  margin-top: 28px;
  display: flex;
  align-items: baseline;
  gap: 14px;
  animation: rdd-fade 180ms var(--ease-reading) 100ms both;
}
.rdd-verdict-word {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.rdd-verdict-word--ok { color: var(--ok); }
.rdd-verdict-word--bad { color: var(--bad); }
.rdd-verdict-note { font-size: 14px; color: var(--muted); }

.rdd-ped {
  margin-top: 48px;
  background: var(--panel);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  padding: 36px 36px 32px;
  animation: rdd-rise 220ms var(--ease-reading) 120ms both;
}
@media (max-width: 520px) {
  .rdd-ped { padding: 24px 20px; }
}
.rdd-ped-solution {
  margin: 12px 0 0;
  font-size: 17px;
  font-weight: 550;
  letter-spacing: -0.01em;
  line-height: 1.5;
  max-width: 58ch;
}
.rdd-step {
  margin-top: 32px;
  display: flex;
  gap: 18px;
  animation: rdd-up 200ms var(--ease-reading) both;
}
.rdd-step-n {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted-2);
  padding-top: 3px;
  flex: none;
  width: 14px;
}
.rdd-step-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.005em;
}
.rdd-step-text {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--ink-2);
  max-width: 58ch;
}
.rdd-ped-sub {
  margin-top: 44px;
  padding-top: 24px;
  border-top: 1px solid var(--hairline);
}
.rdd-dis {
  margin-top: 24px;
  animation: rdd-up 200ms var(--ease-reading) both;
}
.rdd-dis-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
}
.rdd-dis-body {
  margin: 8px 0 0;
  font-size: 13.5px;
  color: var(--ink-2);
  max-width: 58ch;
}
.rdd-dis-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-2);
  margin-right: 6px;
}

.rdd-next-row {
  margin-top: 40px;
  display: flex;
  align-items: center;
  gap: 16px;
  animation: rdd-fade 180ms var(--ease-reading) 260ms both;
}
.rdd-primary {
  background: var(--accent);
  color: var(--accent-ink);
  border: 0;
  border-radius: 8px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 550;
  letter-spacing: -0.005em;
  transition: opacity 150ms var(--ease-reading), transform 150ms var(--ease-reading);
}
.rdd-primary:hover { opacity: 0.92; }
.rdd-primary:active { transform: translateY(1px); }
.rdd-kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted-2);
}

/* ---- home ---- */
.rdd-stats {
  margin-top: 56px;
  display: flex;
  gap: 64px;
  flex-wrap: wrap;
}
.rdd-stat-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
}
.rdd-stat-sub {
  margin-top: 8px;
  font-size: 13px;
  color: var(--ok);
}
.rdd-stat-sub--quiet { color: var(--muted); }

.rdd-resume {
  margin-top: 64px;
  background: var(--panel);
  border-radius: 10px;
  padding: 26px 28px;
  box-shadow:
    0 1px 2px color-mix(in oklch, var(--ink) 6%, transparent),
    0 6px 20px color-mix(in oklch, var(--ink) 6%, transparent);
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.rdd-resume-main { flex: 1 1 280px; min-width: 0; }
.rdd-resume-line {
  margin: 8px 0 0;
  font-size: 17px;
  font-weight: 550;
  letter-spacing: -0.01em;
}
.rdd-resume-meta {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.rdd-section { margin-top: 72px; }
.rdd-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--hairline);
}
.rdd-row {
  display: flex;
  align-items: baseline;
  gap: 20px;
  width: 100%;
  padding: 18px 4px;
  border-bottom: 1px solid var(--hairline);
  transition: background-color 150ms var(--ease-reading);
}
button.rdd-row:hover { background: var(--panel); }
.rdd-row-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-2);
  width: 96px;
  flex: none;
}
.rdd-row-main { flex: 1 1 auto; min-width: 0; }
.rdd-row-headline {
  margin: 0;
  font-size: 15px;
  font-weight: 550;
  letter-spacing: -0.005em;
}
.rdd-row-rationale {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--muted);
}
.rdd-row-end {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
  flex: none;
}

@media (prefers-reduced-motion: reduce) {
  .rdd-root *, .rdd-root *::before, .rdd-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
`

function delay(ms: number): { animationDelay: string } {
  return { animationDelay: `${ms}ms` }
}

function Drill() {
  const [picked, setPicked] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const graded = picked !== null
  const correct = picked === QUESTION.answer

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (picked === null) {
        const idx = LETTERS.indexOf(e.key.toLowerCase())
        const opt = QUESTION.options[idx]
        if (idx >= 0 && opt) setPicked(opt.letter)
      } else if (e.key === 'Enter') {
        setPicked(null)
        setRound((r) => r + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked])

  const next = () => {
    setPicked(null)
    setRound((r) => r + 1)
  }

  return (
    <div className="rdd-wrap" key={round}>
      <header>
        <p className="rdd-eyebrow rdd-num rdd-in" style={delay(0)}>
          {QUESTION.sectionLabel.toUpperCase()} · FRÅGA {QUESTION.number} AV {QUESTION.total}
        </p>
        <h1 className="rdd-display rdd-in" style={delay(50)}>
          {QUESTION.prompt}
        </h1>
      </header>

      {!graded && (
        <aside className="rdd-hint rdd-in" style={delay(100)}>
          <p className="rdd-hint-handle">{EXPLANATION.pregradeTactic.handle}</p>
          <p className="rdd-hint-move">{EXPLANATION.pregradeTactic.move}</p>
        </aside>
      )}

      <fieldset className="rdd-opts" aria-label="Svarsalternativ">
        {QUESTION.options.map((opt, i) => {
          const isPicked = picked === opt.letter
          const isKey = opt.letter === QUESTION.answer
          const showKeyRing = graded && !correct && isKey
          return (
            <button
              key={opt.letter}
              type="button"
              className={`rdd-opt rdd-reset rdd-in${showKeyRing ? ' rdd-opt--key' : ''}`}
              style={delay(140 + i * 40)}
              disabled={graded}
              onClick={() => setPicked(opt.letter)}
            >
              {isPicked && (
                <span
                  className={`rdd-opt-fill ${isKey ? 'rdd-opt-fill--ok' : 'rdd-opt-fill--bad'}`}
                  aria-hidden="true"
                />
              )}
              <span className="rdd-opt-letter">{opt.letter}</span>
              <span>{opt.text}</span>
              {isPicked && (
                <span
                  className={`rdd-opt-glyph ${isKey ? 'rdd-opt-glyph--ok' : 'rdd-opt-glyph--bad'}`}
                  aria-hidden="true"
                >
                  {isKey ? '✓' : '✕'}
                </span>
              )}
            </button>
          )
        })}
      </fieldset>

      {graded && (
        <>
          <p className="rdd-verdict" role="status">
            <span
              className={`rdd-verdict-word ${correct ? 'rdd-verdict-word--ok' : 'rdd-verdict-word--bad'}`}
            >
              {correct ? 'Rätt' : 'Fel'}
            </span>
            {!correct && (
              <span className="rdd-verdict-note">Rätt svar: {QUESTION.answer} · vilja ha</span>
            )}
          </p>

          <section className="rdd-ped" aria-label="Förklaring">
            <p className="rdd-eyebrow">Lösning</p>
            <p className="rdd-ped-solution">{EXPLANATION.solution}</p>

            {EXPLANATION.steps.map((step, i) => (
              <div key={step.n} className="rdd-step" style={delay(120 + i * 60)}>
                <span className="rdd-step-n rdd-num">{step.n}</span>
                <div>
                  <h2 className="rdd-step-title">{step.title}</h2>
                  <p className="rdd-step-text">{step.text}</p>
                </div>
              </div>
            ))}

            <div className="rdd-ped-sub">
              <p className="rdd-eyebrow">Varför de andra lockar</p>
              {EXPLANATION.distractors.map((d, i) => (
                <div key={d.letter} className="rdd-dis" style={delay(320 + i * 60)}>
                  <p className="rdd-dis-head">
                    <span className="rdd-row-tag">{d.letter}</span>
                    <span>{d.text}</span>
                  </p>
                  <p className="rdd-dis-body">
                    <span className="rdd-dis-label">Lockar</span>
                    {d.whyTempting}
                  </p>
                  <p className="rdd-dis-body">
                    <span className="rdd-dis-label">Men</span>
                    {d.whyWrong}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="rdd-next-row">
            <button type="button" className="rdd-primary rdd-reset" onClick={next}>
              Nästa fråga
            </button>
            <span className="rdd-kbd">Enter</span>
          </div>
        </>
      )}
    </div>
  )
}

function Home() {
  return (
    <div className="rdd-wrap">
      <header>
        <p className="rdd-eyebrow rdd-in" style={delay(0)}>
          {HOME.dateLabel}
        </p>
        <h1 className="rdd-display rdd-in" style={delay(50)}>
          {HOME.greeting}
        </h1>
      </header>

      <div className="rdd-stats">
        <div className="rdd-in" style={delay(100)}>
          <p className="rdd-eyebrow">Prognos</p>
          <p className="rdd-stat-value rdd-num">{HOME.projectedScore}</p>
          <p className="rdd-stat-sub rdd-num">{HOME.scoreDelta}</p>
        </div>
        <div className="rdd-in" style={delay(140)}>
          <p className="rdd-eyebrow">Svit</p>
          <p className="rdd-stat-value rdd-num">{HOME.streakDays} dagar</p>
          <p className="rdd-stat-sub rdd-stat-sub--quiet">utan avbrott</p>
        </div>
        <div className="rdd-in" style={delay(180)}>
          <p className="rdd-eyebrow">Idag</p>
          <p className="rdd-stat-value rdd-num">{HOME.estimatedMinutes} min</p>
          <p className="rdd-stat-sub rdd-stat-sub--quiet">{HOME.plan.length} moment</p>
        </div>
      </div>

      <section className="rdd-resume rdd-in" style={delay(220)} aria-label="Fortsätt här">
        <div className="rdd-resume-main">
          <p className="rdd-eyebrow">Fortsätt här</p>
          <p className="rdd-resume-line rdd-num">
            {HOME.resume.kind} · {HOME.resume.section} · fråga {HOME.resume.position} av{' '}
            {HOME.resume.total}
          </p>
          <p className="rdd-resume-meta rdd-num">
            Pausad på {HOME.resume.device} · {HOME.resume.when}
          </p>
        </div>
        <button type="button" className="rdd-primary rdd-reset">
          Fortsätt
        </button>
      </section>

      <section className="rdd-section rdd-in" style={delay(280)} aria-label="Dagens plan">
        <div className="rdd-section-head">
          <p className="rdd-eyebrow">Dagens plan</p>
          <p className="rdd-eyebrow rdd-num">{HOME.estimatedMinutes} min</p>
        </div>
        {HOME.plan.map((item) => (
          <button key={item.id} type="button" className="rdd-row rdd-reset">
            <span className="rdd-row-tag">{item.section ?? item.kind}</span>
            <span className="rdd-row-main">
              <span className="rdd-row-headline rdd-num">{item.headline}</span>
              <span className="rdd-row-rationale rdd-num" style={{ display: 'block' }}>
                {item.rationale}
              </span>
            </span>
            <span className="rdd-row-end rdd-num">{item.minutes} min</span>
          </button>
        ))}
      </section>

      <section className="rdd-section rdd-in" style={delay(340)} aria-label="Dina fällor just nu">
        <div className="rdd-section-head">
          <p className="rdd-eyebrow">Dina fällor just nu</p>
        </div>
        {HOME.traps.map((trap) => (
          <div key={trap.id} className="rdd-row">
            <span className="rdd-row-tag">{trap.section}</span>
            <span className="rdd-row-main">
              <span className="rdd-row-headline">{trap.headline}</span>
            </span>
            <span className="rdd-row-end rdd-num">×{trap.count}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

export function RedesignD({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="rdd-root">
      <style>{CSS}</style>
      {screen === 'drill' ? <Drill /> : <Home />}
    </div>
  )
}
