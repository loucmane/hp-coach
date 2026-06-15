// Redesign bake-off — Variant F: "AXIS · sleek with the brand spine".
// Modern hairline axis system in var(--font-ui); the serif soul survives in
// exactly two display-italic moments per screen (greeting / headword).
// Token-only color + fonts. Imports only react + ./fixtures.

import { type ReactNode, useEffect, useState } from 'react'
import { EXPLANATION, HOME, QUESTION, type RedesignScreen } from './fixtures'

const CSS = `
.rdf-root {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.rdf-frame {
  max-width: 880px;
  margin: 0 auto;
  padding: 56px 24px 96px;
}

/* ----- the spine: meta column | vertical hairline | content column ----- */
.rdf-row {
  display: grid;
  grid-template-columns: 128px 1px 1fr;
  column-gap: 28px;
}
.rdf-spine {
  background: var(--hairline);
  align-self: stretch;
}
.rdf-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: right;
  padding-top: 4px;
  font-variant-numeric: tabular-nums;
  animation: rdf-in-x var(--dur-3, 260ms) var(--ease-reading) both;
}
.rdf-meta strong {
  display: block;
  color: var(--ink-2);
  font-weight: 500;
}
.rdf-content {
  min-width: 0;
  animation: rdf-in-y var(--dur-3, 260ms) var(--ease-reading) both;
  animation-delay: 60ms;
}

/* ----- 64px section rhythm + drawn rules ----- */
.rdf-section { margin-top: 64px; }
.rdf-section:first-child { margin-top: 0; }
.rdf-rule {
  height: 1px;
  background: var(--hairline);
  border: 0;
  margin: 0 0 20px;
  transform-origin: left center;
  animation: rdf-draw 240ms var(--ease-reading) both;
}
.rdf-h {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-2);
  margin: 0 0 4px;
  display: inline-block;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--accent);
}

/* ----- type ----- */
.rdf-eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.rdf-display {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  color: var(--ink);
  font-size: clamp(44px, 6vw, 64px);
  line-height: 1.05;
  margin: 10px 0 0;
  letter-spacing: -0.01em;
  animation: rdf-settle 500ms var(--ease-reading) both;
}
.rdf-mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.rdf-muted { color: var(--muted); }

/* ----- home ----- */
.rdf-stats {
  display: flex;
  gap: 48px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--hairline);
}
.rdf-stat-n {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 30px;
  line-height: 1.1;
  color: var(--ink);
}
.rdf-stat-l { font-size: 12px; color: var(--muted); margin-top: 2px; }
.rdf-stat-d { font-size: 12px; color: var(--ok); margin-top: 2px; }

.rdf-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--accent-soft);
  padding: 16px 20px;
  margin-top: 4px;
}
.rdf-resume-t { font-size: 15px; font-weight: 500; color: var(--ink); }
.rdf-resume-s {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  margin-top: 3px;
  font-variant-numeric: tabular-nums;
}
.rdf-cta {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-ink);
  background: var(--accent);
  border: 0;
  padding: 10px 20px;
  cursor: pointer;
  transition: opacity var(--dur-2, 160ms) var(--ease-reading);
  white-space: nowrap;
}
.rdf-cta:hover { opacity: 0.88; }

.rdf-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  padding: 14px 0;
  border-bottom: 1px solid var(--hairline-2);
}
.rdf-item:last-child { border-bottom: 0; }
.rdf-item-t { font-size: 15px; font-weight: 500; color: var(--ink); }
.rdf-item-r { font-size: 13px; color: var(--muted); margin-top: 2px; max-width: 56ch; }
.rdf-item-n {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.rdf-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
  border: 1px solid var(--hairline);
  padding: 1px 6px;
  margin-right: 8px;
  vertical-align: 1px;
}

/* ----- drill options: hairline rows with 3px left indicator ----- */
.rdf-opts { margin-top: 8px; border-top: 1px solid var(--hairline); }
.rdf-opt {
  display: grid;
  grid-template-columns: 3px 36px 1fr auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--hairline-2);
  padding: 0;
  font: inherit;
  color: var(--ink);
  cursor: pointer;
  transition:
    background var(--dur-2, 160ms) var(--ease-reading),
    color var(--dur-2, 160ms) var(--ease-reading);
}
.rdf-opt:disabled { cursor: default; }
.rdf-ind {
  width: 3px;
  align-self: stretch;
  background: transparent;
  transform: scaleY(0);
  transition:
    transform var(--dur-2, 160ms) var(--ease-reading),
    background var(--dur-2, 160ms) var(--ease-reading);
}
.rdf-opt:hover:not(:disabled) .rdf-ind { background: var(--accent); transform: scaleY(1); }
.rdf-opt-k {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted-2);
  padding: 16px 0;
}
.rdf-opt-t { padding: 16px 0; font-size: 16px; }
.rdf-opt-v {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding-right: 14px;
}
.rdf-opt.is-picked .rdf-ind { background: var(--accent); transform: scaleY(1); }
.rdf-opt.is-ok { background: var(--ok-soft); }
.rdf-opt.is-ok .rdf-ind { background: var(--ok); transform: scaleY(1); }
.rdf-opt.is-ok .rdf-opt-t, .rdf-opt.is-ok .rdf-opt-v, .rdf-opt.is-ok .rdf-opt-k { color: var(--ok); }
.rdf-opt.is-bad { background: var(--bad-soft); }
.rdf-opt.is-bad .rdf-ind { background: var(--bad); transform: scaleY(1); }
.rdf-opt.is-bad .rdf-opt-t, .rdf-opt.is-bad .rdf-opt-v, .rdf-opt.is-bad .rdf-opt-k { color: var(--bad); }
.rdf-opt.is-dim .rdf-opt-t, .rdf-opt.is-dim .rdf-opt-k { color: var(--muted-2); }

.rdf-hint {
  margin-top: 24px;
  padding: 14px 18px;
  border-left: 1px solid var(--hairline);
}
.rdf-hint-h {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}
.rdf-hint-t { font-size: 14px; color: var(--ink-2); margin-top: 4px; }
.rdf-keys {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted-2);
  margin-top: 14px;
  letter-spacing: 0.06em;
}

/* ----- pedagogy: the content column extends downward ----- */
.rdf-ped { animation: rdf-in-y var(--dur-4, 320ms) var(--ease-reading) both; }
.rdf-verdict {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.rdf-verdict.is-ok { color: var(--ok); }
.rdf-verdict.is-bad { color: var(--bad); }
.rdf-solution { font-size: 17px; color: var(--ink); margin: 8px 0 0; max-width: 60ch; }

.rdf-step {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--hairline-2);
  animation: rdf-in-y var(--dur-3, 260ms) var(--ease-reading) both;
}
.rdf-step:last-child { border-bottom: 0; }
.rdf-step-n {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted-2);
  font-variant-numeric: tabular-nums;
  padding-top: 3px;
  animation: rdf-in-x var(--dur-3, 260ms) var(--ease-reading) both;
  animation-delay: inherit;
}
.rdf-step-h { font-size: 15px; font-weight: 600; color: var(--ink); margin: 0; }
.rdf-step-t { font-size: 14px; color: var(--ink-2); margin: 6px 0 0; max-width: 62ch; }

.rdf-dis { padding: 16px 0; border-bottom: 1px solid var(--hairline-2); }
.rdf-dis:last-child { border-bottom: 0; }
.rdf-dis-h { font-size: 14px; font-weight: 600; color: var(--ink); }
.rdf-dis-h .rdf-mono { color: var(--muted-2); font-size: 12px; margin-right: 8px; }
.rdf-dis-p { font-size: 13.5px; color: var(--ink-2); margin: 6px 0 0; max-width: 62ch; }
.rdf-dis-l { color: var(--muted); font-weight: 500; }

.rdf-next-row { margin-top: 36px; display: flex; align-items: center; gap: 16px; }

/* ----- motion: the drafting table ----- */
@keyframes rdf-in-y { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes rdf-in-x { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
@keyframes rdf-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes rdf-settle {
  from { opacity: 0; letter-spacing: 0.01em; }
  to { opacity: 1; letter-spacing: -0.01em; }
}

@media (prefers-reduced-motion: reduce) {
  .rdf-root *, .rdf-root *::before, .rdf-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}

@media (max-width: 900px) {
  .rdf-row { grid-template-columns: 96px 1px 1fr; column-gap: 20px; }
  .rdf-frame { padding: 40px 18px 72px; }
}
`

const KEY_TO_LETTER: Record<string, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
  e: 'E',
}

function Section({
  meta,
  title,
  delay,
  children,
}: {
  meta: ReactNode
  title?: string
  delay: number
  children: ReactNode
}) {
  const d = { animationDelay: `${delay}ms` }
  return (
    <section className="rdf-section">
      <hr className="rdf-rule" style={d} />
      <div className="rdf-row">
        <div className="rdf-meta" style={d}>
          {meta}
        </div>
        <div className="rdf-spine" />
        <div className="rdf-content" style={{ animationDelay: `${delay + 60}ms` }}>
          {title ? <h2 className="rdf-h">{title}</h2> : null}
          {children}
        </div>
      </div>
    </section>
  )
}

function HomeScreen() {
  return (
    <div className="rdf-frame">
      <section className="rdf-section">
        <div className="rdf-row">
          <div className="rdf-meta">
            <strong>{HOME.dateLabel}</strong>
          </div>
          <div className="rdf-spine" />
          <div className="rdf-content">
            <h1 className="rdf-display">{HOME.greeting}</h1>
            <div className="rdf-stats">
              <div>
                <div className="rdf-stat-n">{HOME.projectedScore}</div>
                <div className="rdf-stat-l">prognos</div>
                <div className="rdf-stat-d">{HOME.scoreDelta}</div>
              </div>
              <div>
                <div className="rdf-stat-n">{HOME.streakDays}</div>
                <div className="rdf-stat-l">dagar i rad</div>
              </div>
              <div>
                <div className="rdf-stat-n">{HOME.estimatedMinutes}</div>
                <div className="rdf-stat-l">min idag</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section meta={<>Påbörjad</>} delay={120}>
        <div className="rdf-resume">
          <div>
            <div className="rdf-resume-t">
              {HOME.resume.kind} · {HOME.resume.section}
            </div>
            <div className="rdf-resume-s">
              fråga {HOME.resume.position} av {HOME.resume.total} · {HOME.resume.device} ·{' '}
              {HOME.resume.when}
            </div>
          </div>
          <button type="button" className="rdf-cta">
            Fortsätt här
          </button>
        </div>
      </Section>

      <Section
        meta={
          <>
            <strong>{HOME.estimatedMinutes} min</strong>3 moment
          </>
        }
        title="Dagens plan"
        delay={220}
      >
        <div>
          {HOME.plan.map((p) => (
            <div className="rdf-item" key={p.id}>
              <div>
                <div className="rdf-item-t">
                  {p.section ? <span className="rdf-tag">{p.section}</span> : null}
                  {p.headline}
                </div>
                <div className="rdf-item-r">{p.rationale}</div>
              </div>
              <div className="rdf-item-n">{p.minutes} min</div>
            </div>
          ))}
        </div>
      </Section>

      <Section meta={<>Mönster</>} title="Dina fällor just nu" delay={320}>
        <div>
          {HOME.traps.map((t) => (
            <div className="rdf-item" key={t.id}>
              <div>
                <div className="rdf-item-t">
                  <span className="rdf-tag">{t.section}</span>
                  {t.headline}
                </div>
              </div>
              <div className="rdf-item-n">{t.count} ggr</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function DrillScreen() {
  const [picked, setPicked] = useState<string | null>(null)
  const graded = picked !== null
  const wasCorrect = picked === QUESTION.answer

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!graded) {
        const letter = KEY_TO_LETTER[e.key.toLowerCase()]
        if (letter) {
          e.preventDefault()
          setPicked(letter)
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        setPicked(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graded])

  return (
    <div className="rdf-frame">
      <section className="rdf-section">
        <div className="rdf-row">
          <div className="rdf-meta">
            <strong>{QUESTION.section}</strong>
            {QUESTION.number} / {QUESTION.total}
          </div>
          <div className="rdf-spine" />
          <div className="rdf-content">
            <div className="rdf-eyebrow">
              {QUESTION.sectionLabel.toUpperCase()} · FRÅGA {QUESTION.number} AV {QUESTION.total}
            </div>
            <h1 className="rdf-display" key={picked ?? 'idle'}>
              {QUESTION.prompt}
            </h1>
            {!graded ? (
              <div className="rdf-hint">
                <div className="rdf-hint-h">{EXPLANATION.pregradeTactic.handle}</div>
                <div className="rdf-hint-t">{EXPLANATION.pregradeTactic.move}</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <Section meta={<>Välj synonym</>} delay={100}>
        <div className="rdf-opts">
          {QUESTION.options.map((o) => {
            const isPick = picked === o.letter
            const isAnswer = o.letter === QUESTION.answer
            let cls = 'rdf-opt'
            if (graded) {
              if (isAnswer) cls += ' is-ok'
              else if (isPick) cls += ' is-bad'
              else cls += ' is-dim'
            } else if (isPick) {
              cls += ' is-picked'
            }
            return (
              <button
                key={o.letter}
                type="button"
                className={cls}
                disabled={graded}
                onClick={() => setPicked(o.letter)}
              >
                <span className="rdf-ind" />
                <span className="rdf-opt-k">{o.letter}</span>
                <span className="rdf-opt-t">{o.text}</span>
                <span className="rdf-opt-v">
                  {graded && isAnswer ? 'Rätt svar' : graded && isPick ? 'Ditt svar' : ''}
                </span>
              </button>
            )
          })}
        </div>
        {!graded ? <div className="rdf-keys">Tangenter a–e väljer</div> : null}
      </Section>

      {graded ? (
        <div className="rdf-ped">
          <Section meta={<>Utfall</>} delay={0}>
            <div className={`rdf-verdict ${wasCorrect ? 'is-ok' : 'is-bad'}`}>
              {wasCorrect ? 'Rätt' : 'Fel'} · ditt svar {picked} · rätt svar {QUESTION.answer}
            </div>
            <p className="rdf-solution">{EXPLANATION.solution}</p>
          </Section>

          <Section meta={<>3 steg</>} title="Så löser du den" delay={120}>
            <div>
              {EXPLANATION.steps.map((s, i) => (
                <div className="rdf-step" key={s.n} style={{ animationDelay: `${180 + i * 60}ms` }}>
                  <div className="rdf-step-n">
                    {String(s.n).padStart(2, '0')} · {s.tier === 'essential' ? 'kärna' : 'detalj'}
                  </div>
                  <div>
                    <h3 className="rdf-step-h">{s.title}</h3>
                    <p className="rdf-step-t">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section meta={<>4 fällor</>} title="Varför de andra lockar" delay={240}>
            <div>
              {EXPLANATION.distractors.map((d) => (
                <div className="rdf-dis" key={d.letter}>
                  <div className="rdf-dis-h">
                    <span className="rdf-mono">{d.letter}</span>
                    {d.text}
                  </div>
                  <p className="rdf-dis-p">
                    <span className="rdf-dis-l">Lockar: </span>
                    {d.whyTempting}
                  </p>
                  <p className="rdf-dis-p">
                    <span className="rdf-dis-l">Fel för att: </span>
                    {d.whyWrong}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <div className="rdf-next-row">
            <button type="button" className="rdf-cta" onClick={() => setPicked(null)}>
              Nästa fråga
            </button>
            <span className="rdf-keys">Enter går vidare</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function RedesignF({ screen }: { screen: RedesignScreen }) {
  return (
    <div className="rdf-root">
      <style>{CSS}</style>
      {screen === 'home' ? <HomeScreen /> : <DrillScreen />}
    </div>
  )
}
