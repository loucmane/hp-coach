// Style B — Reader Single-Column.
//
// Thesis: kill the sidebar. The 2-column split fights reading flow.
// The question becomes a compact pinned strip at the top (one tight
// band with prompt + option pills inline), the pedagogy is one wide,
// generous reading column below. Maximum measure, maximum line-height,
// maximum focus. No floating CTA — inline at end of pedagogy +
// keyboard hint in status line.
//
// Substack × Khan Academy × Notion reading register.

import { resolveSteps } from '@/components/drill/PedagogyPanel'
import { MathText } from '@/components/MathText'
import type { VariantData } from './DrillVariantShell'
import { useProgressiveReveal } from './useProgressiveReveal'

export function StyleB({
  question,
  explanation,
  picked,
  graded,
  correct,
  onPick,
  onReset,
}: VariantData) {
  const steps = explanation ? resolveSteps(explanation) : []
  const reveal = useProgressiveReveal(steps)
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Running head — solid bg, sticky. */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 11,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--hairline)',
          padding: 'clamp(16px, 1.8vh, 24px) clamp(24px, 4vw, 48px) 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 16,
          maxWidth: 880,
          margin: '0 auto',
          width: '100%',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
        }}
      >
        <span>HP · COACH · {question.section}</span>
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
            textTransform: 'none',
          }}
        >
          pp. 1 / 1
        </span>
      </header>

      {/* B v2 — generous "chapter opening" composition pre-grade,
       *  compresses to a single quiet summary line post-grade so the
       *  pedagogy below has room. The opener is sticky so the user
       *  can re-anchor on the prompt at any point during the read. */}
      <section
        style={{
          position: 'sticky',
          top: 'clamp(48px, 6vh, 70px)',
          zIndex: 9,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--hairline)',
          padding: graded
            ? '18px clamp(24px, 4vw, 48px) 16px'
            : 'clamp(28px, 4vh, 48px) clamp(24px, 4vw, 48px) clamp(20px, 3vh, 32px)',
          maxWidth: 760,
          margin: '0 auto',
          width: '100%',
          transition: 'padding 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Eyebrow — section ID. Always present. */}
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            margin: 0,
            marginBottom: graded ? 8 : 14,
            transition: 'margin-bottom 280ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {question.section} · fråga 1 / 1
        </p>

        {/* Prompt — generous when answering, compressed when graded.
         *  Display serif, real reading size — this is the question
         *  asked, not a navigation breadcrumb. */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: graded
              ? 'clamp(17px, 0.9rem + 0.35vw, 20px)'
              : 'clamp(22px, 1.1rem + 0.6vw, 30px)',
            lineHeight: graded ? 1.35 : 1.25,
            letterSpacing: '-0.018em',
            fontWeight: 500,
            margin: 0,
            marginBottom: graded ? 10 : 28,
            whiteSpace: 'pre-wrap',
            color: graded ? 'var(--ink-2)' : 'var(--ink)',
            transition:
              'font-size 280ms cubic-bezier(0.16, 1, 0.3, 1), margin-bottom 280ms, color 280ms',
          }}
        >
          <MathText>{question.prompt ?? ''}</MathText>
        </h1>

        {/* Options — flat hairline rows (matches Editorial register).
         *  Pre-grade: full list with letter + text. Post-grade: a
         *  single quiet summary row showing the picked answer + the
         *  correct one if different. */}
        {!graded && question.options && (
          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              borderTop: '1px solid color-mix(in oklch, var(--hairline) 60%, transparent)',
            }}
          >
            {question.options.map((opt) => {
              const isPicked = picked === opt.letter
              return (
                <li
                  key={opt.letter}
                  style={{
                    borderBottom: '1px solid color-mix(in oklch, var(--hairline) 60%, transparent)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onPick(opt.letter)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr',
                      gap: 16,
                      alignItems: 'baseline',
                      padding: '14px 0',
                      width: '100%',
                      borderLeft: `2px solid ${isPicked ? 'var(--ink)' : 'transparent'}`,
                      paddingLeft: 12,
                      marginLeft: -14,
                      transition: 'border-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        letterSpacing: '0.04em',
                        fontWeight: isPicked ? 600 : 500,
                        color: isPicked ? 'var(--ink)' : 'var(--muted)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {opt.letter.toLowerCase()}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(16px, 0.9rem + 0.3vw, 18px)',
                        lineHeight: 1.45,
                        letterSpacing: '-0.005em',
                        fontWeight: isPicked ? 500 : 400,
                        color: 'var(--ink)',
                      }}
                    >
                      <MathText>{opt.text}</MathText>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        )}
        {graded && (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.06em',
            }}
          >
            <span style={{ color: correct ? 'var(--accent)' : 'var(--bad)' }}>
              ditt svar: [{(picked ?? '').toLowerCase()}] {correct ? 'rätt' : 'fel'}
            </span>
            {!correct && (
              <span style={{ color: 'var(--accent)' }}>
                facit: [{question.answer.toLowerCase()}]
              </span>
            )}
            <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
              <button
                type="button"
                onClick={onReset}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  letterSpacing: 'inherit',
                  color: 'var(--muted)',
                }}
              >
                ← börja om
              </button>
            </span>
          </div>
        )}
      </section>

      {/* Pedagogy — one generous reading column. */}
      <main
        style={{
          flex: 1,
          maxWidth: 760,
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(40px, 6vh, 80px) clamp(24px, 4vw, 48px) clamp(120px, 14vh, 180px)',
        }}
      >
        {!graded ? (
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 19,
              lineHeight: 1.75,
              color: 'var(--muted)',
              fontStyle: 'italic',
              opacity: 0.7,
            }}
          >
            Förklaringen visas när du svarat.
          </p>
        ) : (
          explanation && (
            <div style={{ animation: 'hpc-reveal 220ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
              {steps.map((step) => {
                const isDetail = (step.tier ?? 'essential') === 'detail'
                const isCollapsed = reveal.isCollapsedDetail(step)
                // Collapsed detail = a single-row preview: "03 ── title  →  se mer"
                if (isCollapsed) {
                  return (
                    <button
                      key={step.n}
                      type="button"
                      onClick={() => reveal.expandDetail(step.n)}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 12,
                        marginBottom: 'clamp(20px, 3vh, 32px)',
                        paddingBottom: 14,
                        borderBottom:
                          '1px dashed color-mix(in oklch, var(--hairline) 60%, transparent)',
                        width: '100%',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          letterSpacing: '0.06em',
                          fontWeight: 600,
                          color: 'var(--muted)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {String(step.n).padStart(2, '0')}
                      </span>
                      <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        ──
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(17px, 0.95rem + 0.35vw, 20px)',
                          lineHeight: 1.4,
                          letterSpacing: '-0.012em',
                          fontWeight: 500,
                          color: 'var(--ink-2)',
                        }}
                      >
                        <MathText>{step.title ?? step.text.slice(0, 80)}</MathText>
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          fontStyle: 'italic',
                          color: 'var(--muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        se mer ↘
                      </span>
                    </button>
                  )
                }
                return (
                  <article
                    key={step.n}
                    style={{
                      position: 'relative',
                      marginBottom: 'clamp(36px, 5vh, 56px)',
                    }}
                  >
                    {isDetail && (
                      <button
                        type="button"
                        onClick={() => reveal.collapseDetail(step.n)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          position: 'absolute',
                          top: 4,
                          right: 0,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                        }}
                      >
                        dölj ↗
                      </button>
                    )}
                    {/* Hanging step number + em-dash separator — the signature. */}
                    {step.title && (
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(22px, 1.1rem + 0.5vw, 28px)',
                          lineHeight: 1.2,
                          letterSpacing: '-0.018em',
                          fontWeight: 500,
                          margin: 0,
                          marginBottom: 16,
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 10,
                          paddingRight: isDetail ? 56 : 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            letterSpacing: '0.06em',
                            fontWeight: 600,
                            color: 'var(--ink)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {String(step.n).padStart(2, '0')}
                        </span>
                        <span
                          style={{
                            color: 'var(--muted)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 400,
                          }}
                        >
                          ──
                        </span>
                        <span>
                          <MathText>{step.title}</MathText>
                        </span>
                      </h3>
                    )}
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(18px, 0.95rem + 0.45vw, 22px)',
                        lineHeight: 1.75,
                        letterSpacing: '-0.008em',
                        color: 'var(--ink-2)',
                      }}
                    >
                      <MathText>{step.text}</MathText>
                    </div>
                  </article>
                )
              })}

              {/* Bottom Progressive Reveal CTA */}
              {reveal.totalDetailCount > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    marginBottom: 56,
                    paddingTop: 28,
                    borderTop: '1px dashed color-mix(in oklch, var(--hairline) 60%, transparent)',
                    textAlign: 'center',
                  }}
                >
                  {reveal.collapsedDetailCount > 0 ? (
                    <button
                      type="button"
                      onClick={reveal.expandAll}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-display)',
                        fontSize: 18,
                        fontStyle: 'italic',
                        color: 'var(--ink)',
                        borderBottom: '1px solid var(--ink)',
                        paddingBottom: 3,
                      }}
                    >
                      Jag förstår fortfarande inte
                      <span
                        style={{
                          color: 'var(--muted)',
                          marginLeft: 10,
                          fontStyle: 'normal',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          letterSpacing: '0.06em',
                        }}
                      >
                        ({reveal.collapsedDetailCount} steg till)
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={reveal.collapseAll}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                      }}
                    >
                      ← Korta ner förklaringen
                    </button>
                  )}
                </div>
              )}

              {/* Distractors */}
              {explanation.distractors.length > 0 && (
                <section style={{ marginTop: 80 }}>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      lineHeight: 1.2,
                      letterSpacing: '-0.018em',
                      fontWeight: 500,
                      margin: 0,
                      marginBottom: 28,
                    }}
                  >
                    Varför inte de andra
                  </h2>
                  {explanation.distractors.map((d) => (
                    <div
                      key={d.letter}
                      style={{
                        marginBottom: 24,
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          letterSpacing: '0.04em',
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}
                      >
                        {d.letter.toLowerCase()}.
                      </span>
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 18,
                            lineHeight: 1.55,
                            margin: 0,
                            marginBottom: 4,
                            color: 'var(--ink)',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              color: 'var(--muted)',
                              marginRight: 8,
                            }}
                          >
                            LOCKAR
                          </span>
                          <MathText>{d.why_tempting}</MathText>
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 18,
                            lineHeight: 1.55,
                            margin: 0,
                            color: 'var(--ink)',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              color: 'var(--muted)',
                              marginRight: 8,
                            }}
                          >
                            FEL
                          </span>
                          <MathText>{d.why_wrong}</MathText>
                        </p>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Technique + Pitfall — underlines, not chips. */}
              {explanation.technique && (
                <section style={{ marginTop: 'clamp(48px, 6vh, 72px)' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      margin: 0,
                      marginBottom: 8,
                    }}
                  >
                    Teknik
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      lineHeight: 1.55,
                      margin: 0,
                      color: 'var(--ink)',
                      borderBottom: '1px solid var(--accent)',
                      paddingBottom: 4,
                      display: 'inline-block',
                      maxWidth: '90%',
                    }}
                  >
                    <MathText>{explanation.technique}</MathText>
                  </p>
                </section>
              )}
              {explanation.pitfall && (
                <section style={{ marginTop: 32 }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      margin: 0,
                      marginBottom: 8,
                    }}
                  >
                    Fälla
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      lineHeight: 1.55,
                      margin: 0,
                      color: 'var(--ink)',
                      fontStyle: 'italic',
                      borderBottom: '1px solid var(--bad)',
                      paddingBottom: 4,
                      display: 'inline-block',
                      maxWidth: '90%',
                    }}
                  >
                    <MathText>{explanation.pitfall}</MathText>
                  </p>
                </section>
              )}

              {/* End-mark + inline CTA */}
              <div style={{ marginTop: 56 }}>
                <span
                  aria-hidden
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 1,
                    background: 'var(--hairline)',
                    opacity: 0.6,
                    marginBottom: 28,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={onReset}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      fontWeight: 500,
                      color: 'var(--ink)',
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: 10,
                      borderBottom: '1px solid var(--ink)',
                      paddingBottom: 2,
                    }}
                  >
                    Nästa fråga →
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
                        color: 'var(--muted)',
                      }}
                    >
                      ↵
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Status line — two-row state machine borrowed from Cockpit. */}
      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          background: 'var(--panel-2)',
          borderTop: '1px solid var(--hairline)',
          padding: '8px clamp(24px, 4vw, 48px) 10px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.06em',
          color: 'var(--muted)',
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{ color: graded ? 'var(--accent)' : 'var(--muted)' }}>
            -- {graded ? 'GRADERAD' : 'ÖVNING'} -- · {question.section.toLowerCase()} · fråga 1/1
          </span>
          <span style={{ display: 'inline-flex', gap: 14 }}>
            {graded ? (
              <span style={{ color: 'var(--ink)' }}>
                [{(picked ?? '').toLowerCase()}] {correct ? 'rätt' : 'fel'} · ↵ nästa →
              </span>
            ) : (
              <>
                <span>a / b / c / d välj</span>
                <span>esc tillbaka</span>
                <span>⌘k palett</span>
              </>
            )}
          </span>
        </div>
      </footer>
    </div>
  )
}
