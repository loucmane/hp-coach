// Redesign bake-off · Variant E — "MIST · soft modern"
// Serene, breathable, softly elevated. All softness from token elevation
// (--panel / --panel-2), large radii, and ink-alpha shadows. Token-only color.

import { useCallback, useEffect, useState } from 'react'
import type { RedesignScreen } from './fixtures'
import { EXPLANATION, HOME, QUESTION } from './fixtures'

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const
type Letter = (typeof LETTERS)[number]

const STYLE = `
.rde-root {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.rde-shell {
  max-width: 880px;
  margin: 0 auto;
  padding: 56px 28px 96px;
}
.rde-mono {
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

/* ---- elevation: exactly two levels ---- */
.rde-card {
  background: var(--panel);
  border-radius: 20px;
  box-shadow:
    0 1px 2px color-mix(in oklch, var(--ink) 4%, transparent),
    0 12px 32px -12px color-mix(in oklch, var(--ink) 8%, transparent);
}
.rde-card--raised {
  background: var(--panel);
  border-radius: 20px;
  box-shadow:
    0 2px 4px color-mix(in oklch, var(--ink) 5%, transparent),
    0 24px 48px -16px color-mix(in oklch, var(--ink) 12%, transparent);
}

/* ---- soft float entrance ---- */
@keyframes rde-float-in {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.rde-in {
  animation: rde-float-in 360ms var(--ease-reading) both;
}
.rde-in--1 { animation-delay: 0ms; }
.rde-in--2 { animation-delay: 80ms; }
.rde-in--3 { animation-delay: 160ms; }
.rde-in--4 { animation-delay: 240ms; }
.rde-in--5 { animation-delay: 320ms; }

/* ================= HOME ================= */
.rde-greeting {
  font-size: 52px;
  font-weight: 450;
  letter-spacing: 0.005em;
  line-height: 1.12;
  margin: 0 0 6px;
}
.rde-date {
  margin-bottom: 10px;
}
.rde-hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;
  padding: 28px 32px;
  margin: 36px 0 20px;
}
.rde-hero-score {
  font-size: 56px;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1;
}
.rde-hero-label {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 8px;
}
.rde-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 500;
}
.rde-pill--accent {
  background: var(--accent-soft);
  color: var(--ink);
}
.rde-streak {
  text-align: right;
}
.rde-streak-n {
  font-size: 34px;
  font-weight: 500;
  line-height: 1.1;
}
.rde-streak-l {
  color: var(--muted);
  font-size: 13px;
}

.rde-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 32px;
  margin-bottom: 40px;
  transition: transform 240ms var(--ease-reading), box-shadow 240ms var(--ease-reading);
}
.rde-resume:hover {
  transform: translateY(-2px);
  box-shadow:
    0 3px 6px color-mix(in oklch, var(--ink) 6%, transparent),
    0 32px 56px -16px color-mix(in oklch, var(--ink) 16%, transparent);
}
.rde-resume-title {
  font-size: 17px;
  font-weight: 500;
  margin: 2px 0 4px;
}
.rde-cta {
  border: 0;
  cursor: pointer;
  border-radius: 999px;
  padding: 13px 26px;
  font-family: var(--font-ui);
  font-size: 14.5px;
  font-weight: 550;
  background: var(--accent);
  color: var(--accent-ink);
  white-space: nowrap;
  transition: transform 240ms var(--ease-reading), filter 240ms var(--ease-reading);
}
.rde-cta:hover { transform: translateY(-1px); filter: brightness(1.05); }

.rde-h2 {
  font-size: 13px;
  font-weight: 550;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 4px 14px;
}
.rde-plan {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 44px;
}
.rde-plan-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  align-items: center;
  padding: 20px 26px;
  text-align: left;
  border: 0;
  cursor: pointer;
  font-family: var(--font-ui);
  color: var(--ink);
  transition: transform 240ms var(--ease-reading), box-shadow 240ms var(--ease-reading);
}
.rde-plan-item:hover {
  transform: translateY(-2px);
  box-shadow:
    0 2px 4px color-mix(in oklch, var(--ink) 5%, transparent),
    0 20px 44px -14px color-mix(in oklch, var(--ink) 14%, transparent);
}
.rde-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--panel-2);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ink-2);
}
.rde-plan-head {
  font-size: 15.5px;
  font-weight: 500;
  margin-bottom: 2px;
}
.rde-plan-why {
  color: var(--muted);
  font-size: 13.5px;
  line-height: 1.5;
}
.rde-min {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted-2);
  white-space: nowrap;
}
.rde-traps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rde-trap {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  align-items: center;
  padding: 18px 26px;
}
.rde-trap-text {
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--ink-2);
}
.rde-trap-count {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted-2);
  white-space: nowrap;
}

/* ================= DRILL ================= */
.rde-eyebrow {
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.rde-headword {
  font-size: 58px;
  font-weight: 450;
  letter-spacing: 0.005em;
  line-height: 1.1;
  margin: 0 0 20px;
}
.rde-hint {
  padding: 18px 26px;
  margin-bottom: 36px;
  background: var(--panel-2);
  border-radius: 20px;
  color: var(--ink-2);
  font-size: 14.5px;
  line-height: 1.55;
}
.rde-hint b {
  font-weight: 550;
  color: var(--ink);
}
.rde-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rde-opt {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  width: 100%;
  padding: 18px 24px;
  border: 0;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-ui);
  font-size: 16px;
  color: var(--ink);
  border-radius: 999px;
  background: var(--panel);
  box-shadow:
    0 1px 2px color-mix(in oklch, var(--ink) 4%, transparent),
    0 12px 32px -12px color-mix(in oklch, var(--ink) 8%, transparent);
  transition:
    transform 240ms var(--ease-reading),
    box-shadow 240ms var(--ease-reading),
    background 240ms var(--ease-reading);
}
.rde-opt:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow:
    0 2px 4px color-mix(in oklch, var(--ink) 5%, transparent),
    0 20px 44px -14px color-mix(in oklch, var(--ink) 14%, transparent);
}
.rde-opt:disabled { cursor: default; }
.rde-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--panel-2);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
}
@keyframes rde-settle {
  from { transform: scale(0.985); }
  to   { transform: scale(1); }
}
.rde-opt--right {
  background: var(--ok-soft);
  animation: rde-settle 420ms var(--ease-spring) both;
}
.rde-opt--wrong {
  background: var(--bad-soft);
  animation: rde-settle 420ms var(--ease-spring) both;
}
.rde-opt--answer {
  transform: translateY(-2px);
  box-shadow:
    0 0 0 1.5px var(--ok),
    0 2px 4px color-mix(in oklch, var(--ink) 5%, transparent),
    0 20px 44px -14px color-mix(in oklch, var(--ink) 14%, transparent);
}
.rde-opt--dim { opacity: 0.55; }
.rde-opt--right .rde-key { background: color-mix(in oklch, var(--ok) 18%, transparent); color: var(--ink); }
.rde-opt--wrong .rde-key { background: color-mix(in oklch, var(--bad) 18%, transparent); color: var(--ink); }
@keyframes rde-badge-in {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1); }
}
.rde-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  animation: rde-badge-in 320ms var(--ease-spring) 120ms both;
}
.rde-badge--ok { background: var(--ok); color: var(--accent-ink); }
.rde-badge--bad { background: var(--bad); color: var(--accent-ink); }
.rde-verdict {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 32px 0 0;
}
.rde-verdict-word {
  font-size: 22px;
  font-weight: 550;
  letter-spacing: 0.02em;
}
.rde-verdict-word--ok { color: var(--ok); }
.rde-verdict-word--bad { color: var(--bad); }

/* pedagogy sheet */
.rde-sheet {
  margin-top: 28px;
  padding: 40px 36px 36px;
  background: var(--panel);
  border-radius: 24px 24px 20px 20px;
  box-shadow:
    0 2px 4px color-mix(in oklch, var(--ink) 5%, transparent),
    0 24px 48px -16px color-mix(in oklch, var(--ink) 12%, transparent);
}
.rde-solution {
  font-size: 19px;
  font-weight: 450;
  line-height: 1.55;
  margin: 0 0 32px;
}
.rde-steps {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-bottom: 36px;
}
.rde-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
}
.rde-step-n {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: var(--accent-soft);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
  margin-top: 2px;
}
.rde-step-title {
  font-size: 15.5px;
  font-weight: 550;
  margin: 0 0 4px;
}
.rde-step-text {
  color: var(--ink-2);
  font-size: 14.5px;
  line-height: 1.6;
  margin: 0;
}
.rde-distractors {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}
.rde-dis {
  padding: 18px 22px;
  border-radius: 20px;
  background: var(--panel-2);
}
.rde-dis-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 14.5px;
  font-weight: 550;
}
.rde-dis-letter {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted);
}
.rde-dis p {
  margin: 0 0 6px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--ink-2);
}
.rde-dis p:last-child { margin-bottom: 0; }
.rde-dis-tag {
  font-weight: 550;
  color: var(--ink);
}
.rde-next-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.rde-enter-hint { color: var(--muted-2); }

@media (prefers-reduced-motion: reduce) {
  .rde-root *, .rde-root *::before, .rde-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
`

function HomeView() {
  return (
    <div className="rde-shell">
      <header className="rde-in rde-in--1">
        <div className="rde-mono rde-date">{HOME.dateLabel.toUpperCase()}</div>
        <h1 className="rde-greeting">{HOME.greeting}</h1>
      </header>

      <section className="rde-card rde-hero rde-in rde-in--2">
        <div>
          <div className="rde-hero-label">Beräknad poäng just nu</div>
          <div className="rde-hero-score">{HOME.projectedScore}</div>
          <div style={{ marginTop: 14 }}>
            <span className="rde-pill rde-pill--accent">{HOME.scoreDelta}</span>
          </div>
        </div>
        <div className="rde-streak">
          <div className="rde-streak-n">{HOME.streakDays}</div>
          <div className="rde-streak-l">dagar i rad</div>
        </div>
      </section>

      <section className="rde-card--raised rde-resume rde-in rde-in--3">
        <div>
          <div className="rde-mono">
            {HOME.resume.section} · FRÅGA {HOME.resume.position} AV {HOME.resume.total}
          </div>
          <div className="rde-resume-title">{HOME.resume.kind} pågår</div>
          <div className="rde-plan-why">
            Senast på din {HOME.resume.device} kl {HOME.resume.when}
          </div>
        </div>
        <button type="button" className="rde-cta">
          Fortsätt här
        </button>
      </section>

      <section className="rde-in rde-in--4">
        <h2 className="rde-h2">Dagens plan · {HOME.estimatedMinutes} min</h2>
        <div className="rde-plan">
          {HOME.plan.map((item) => (
            <button key={item.id} type="button" className="rde-card rde-plan-item">
              <span className="rde-chip">{item.section ?? 'REP'}</span>
              <span>
                <span className="rde-plan-head" style={{ display: 'block' }}>
                  {item.headline}
                </span>
                <span className="rde-plan-why">{item.rationale}</span>
              </span>
              <span className="rde-min">{item.minutes} MIN</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rde-in rde-in--5">
        <h2 className="rde-h2">Dina fällor just nu</h2>
        <div className="rde-traps">
          {HOME.traps.map((trap) => (
            <div key={trap.id} className="rde-card rde-trap">
              <span className="rde-chip">{trap.section}</span>
              <span className="rde-trap-text">{trap.headline}</span>
              <span className="rde-trap-count">{trap.count} GGR</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function DrillView() {
  const [picked, setPicked] = useState<Letter | null>(null)
  const graded = picked !== null
  const isCorrect = picked === QUESTION.answer

  const pick = useCallback((letter: Letter) => {
    setPicked((prev) => (prev === null ? letter : prev))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (!graded && k >= 'a' && k <= 'e') {
        pick(k.toUpperCase() as Letter)
      } else if (graded && e.key === 'Enter') {
        setPicked(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graded, pick])

  return (
    <div className="rde-shell">
      <div className="rde-eyebrow rde-in rde-in--1">
        <span className="rde-mono">
          {QUESTION.sectionLabel.toUpperCase()} · FRÅGA {QUESTION.number} AV {QUESTION.total}
        </span>
      </div>

      <h1 className="rde-headword rde-in rde-in--2">{QUESTION.prompt}</h1>

      <div className="rde-hint rde-in rde-in--3">
        <b>{EXPLANATION.pregradeTactic.handle}.</b> {EXPLANATION.pregradeTactic.move}
      </div>

      <div className="rde-options rde-in rde-in--4">
        {QUESTION.options.map((opt) => {
          const isPicked = graded && picked === opt.letter
          const isAnswer = opt.letter === QUESTION.answer
          let cls = 'rde-opt'
          if (graded) {
            if (isPicked && isAnswer) cls += ' rde-opt--right'
            else if (isPicked) cls += ' rde-opt--wrong'
            else if (isAnswer) cls += ' rde-opt--answer'
            else cls += ' rde-opt--dim'
          }
          return (
            <button
              key={opt.letter}
              type="button"
              className={cls}
              disabled={graded}
              onClick={() => pick(opt.letter as Letter)}
            >
              <span className="rde-key">{opt.letter.toLowerCase()}</span>
              <span>{opt.text}</span>
              {isPicked && isAnswer && (
                <span className="rde-badge rde-badge--ok" aria-hidden="true">
                  ✓
                </span>
              )}
              {isPicked && !isAnswer && (
                <span className="rde-badge rde-badge--bad" aria-hidden="true">
                  ✕
                </span>
              )}
              {!isPicked && graded && isAnswer && (
                <span className="rde-badge rde-badge--ok" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      {graded && (
        <>
          <div className="rde-verdict rde-in rde-in--1">
            <span
              className={`rde-verdict-word ${isCorrect ? 'rde-verdict-word--ok' : 'rde-verdict-word--bad'}`}
            >
              {isCorrect ? 'Rätt' : 'Fel'}
            </span>
            <span className="rde-mono">RÄTT SVAR: {QUESTION.answer}</span>
          </div>

          <section className="rde-sheet rde-in rde-in--2">
            <p className="rde-solution rde-in rde-in--1">{EXPLANATION.solution}</p>

            <div className="rde-steps">
              {EXPLANATION.steps.map((step, i) => (
                <div key={step.n} className={`rde-step rde-in rde-in--${i + 2}`}>
                  <span className="rde-step-n">{step.n}</span>
                  <div>
                    <h3 className="rde-step-title">{step.title}</h3>
                    <p className="rde-step-text">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="rde-h2">Varför de andra lockar</h2>
            <div className="rde-distractors">
              {EXPLANATION.distractors.map((dis) => (
                <div key={dis.letter} className="rde-dis rde-in rde-in--5">
                  <div className="rde-dis-head">
                    <span className="rde-dis-letter">{dis.letter}</span>
                    <span>{dis.text}</span>
                  </div>
                  <p>
                    <span className="rde-dis-tag">Lockar: </span>
                    {dis.whyTempting}
                  </p>
                  <p>
                    <span className="rde-dis-tag">Fel för att: </span>
                    {dis.whyWrong}
                  </p>
                </div>
              ))}
            </div>

            <div className="rde-next-row">
              <button type="button" className="rde-cta" onClick={() => setPicked(null)}>
                Nästa fråga
              </button>
              <span className="rde-mono rde-enter-hint">ELLER TRYCK ENTER</span>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export function RedesignE({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="rde-root">
      <style>{STYLE}</style>
      {screen === 'home' ? <HomeView /> : <DrillView />}
    </div>
  )
}
