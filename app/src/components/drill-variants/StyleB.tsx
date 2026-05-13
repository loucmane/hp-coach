// Style B v3 — Manuscript on a Desk.
//
// The reimagining (B v1 / v2 are dead in spirit; this is a new
// take). The user rejected v1 ("compressed strip looks messy") and
// then v2 ("looks messy, what's the benefit of single column?").
// The diagnosis: single column on a 2560px display NEEDS intentional
// framing or it reads as wasted space, not designed margin.
//
// B v3 makes the canvas a panel-2 desk surface and the content lives
// on a centered bg page (760px) — like a manuscript page resting on
// a darker writing desk. The empty space outside the page is no
// longer "absent", it's the DESK, a deliberate object. Same trick
// MOMA, Stripe Press chapter spreads, Apple Books in landscape use.
//
// Inside the page:
//   - Question = chapter opening (eyebrow + serif prompt + flat
//     hairline-divided options). Sticky-top within the page.
//   - Hairline rule.
//   - Pedagogy = article body with mono section eyebrows
//     (FÖRKLARING / VARFÖR INTE DE ANDRA / TEKNIK / FÄLLA) doing
//     the wayfinding work. Same vertical-rhythm typography as a
//     real magazine article.
//   - Question compresses on grade (B v2 mechanic preserved) to a
//     mono summary line so the pedagogy gets back its real estate.
//
// Editorial register, but as a SINGLE-COLUMN reading experience.

import { resolveSteps } from '@/components/drill/PedagogyPanel'
import { MathText } from '@/components/MathText'
import type { VariantData } from './DrillVariantShell'
import { useProgressiveReveal } from './useProgressiveReveal'

const SECTION_LABEL: Record<string, string> = {
  ORD: 'ORD · synonymer',
  LÄS: 'LÄS · läsförståelse',
  MEK: 'MEK · meningskomplettering',
  ELF: 'ELF · english reading',
  XYZ: 'XYZ · algebra',
  KVA: 'KVA · jämförelse',
  NOG: 'NOG · sufficiens',
  DTK: 'DTK · diagram',
}

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
        background: 'var(--panel-2)',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Running head — on the desk surface, full canvas width. */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 11,
          background: 'var(--panel-2)',
          borderBottom: '1px solid var(--hairline)',
          padding: 'clamp(20px, 2vh, 32px) clamp(48px, 6vw, 96px) 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 16,
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

      {/* The page on the desk. Centered, narrower than the canvas,
       *  bg color contrasts gently against panel-2 desk. No hard
       *  border — color contrast + faint elevation do the framing. */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 760,
          margin: '0 auto',
          padding: 'clamp(28px, 4vh, 48px) clamp(20px, 3vw, 40px)',
          // Allow the page to extend past the bottom of viewport so
          // scroll happens on the body, not inside the page.
        }}
      >
        <article
          style={{
            background: 'var(--bg)',
            borderRadius: 'calc(var(--radius) * 0.5)',
            // Very subtle elevation — paper sitting on desk, not
            // floating. Almost imperceptible at rest, registers
            // peripherally as "this is a separate surface."
            boxShadow: '0 1px 0 var(--hairline-2), 0 24px 48px -32px rgba(0, 0, 0, 0.08)',
            border: '1px solid var(--hairline-2)',
            // Generous internal padding — the page has real margins
            // around its typographic content, like a real book.
            padding: 'clamp(36px, 5vh, 64px) clamp(32px, 5vw, 64px) clamp(56px, 8vh, 88px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(40px, 5vh, 64px)',
          }}
        >
          {/* ── Question opener — chapter opening composition ───────── */}
          <section
            style={{
              // Sticky within the article, so the user can scroll
              // past the question into pedagogy and the question
              // stays anchored to the top of the page.
              // (We sticky to the canvas viewport here, accounting
              //  for the running head's height.)
              position: 'sticky',
              top: 'clamp(56px, 7vh, 80px)',
              zIndex: 5,
              background: 'var(--bg)',
              // Negative margin trick: pull the sticky section to the
              // page edges so when it sticks it covers the article's
              // top padding without showing a visible seam.
              marginTop: 'clamp(-36px, -5vh, -64px)',
              marginLeft: 'clamp(-32px, -5vw, -64px)',
              marginRight: 'clamp(-32px, -5vw, -64px)',
              padding: graded
                ? 'clamp(20px, 3vh, 28px) clamp(32px, 5vw, 64px) clamp(16px, 2vh, 20px)'
                : 'clamp(36px, 5vh, 64px) clamp(32px, 5vw, 64px) clamp(24px, 3vh, 36px)',
              borderBottom: '1px solid var(--hairline)',
              transition: 'padding 280ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                margin: 0,
                marginBottom: graded ? 8 : 16,
                transition: 'margin-bottom 280ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {SECTION_LABEL[question.section] ?? question.section}
            </p>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: graded
                  ? 'clamp(17px, 0.9rem + 0.35vw, 20px)'
                  : 'clamp(24px, 1.2rem + 0.7vw, 34px)',
                lineHeight: graded ? 1.35 : 1.2,
                letterSpacing: '-0.018em',
                fontWeight: 500,
                margin: 0,
                marginBottom: graded ? 12 : 32,
                whiteSpace: 'pre-wrap',
                color: graded ? 'var(--ink-2)' : 'var(--ink)',
                transition:
                  'font-size 280ms cubic-bezier(0.16, 1, 0.3, 1), margin-bottom 280ms, color 280ms',
              }}
            >
              <MathText>{question.prompt ?? ''}</MathText>
            </h1>

            {!graded && question.options && (
              <ol
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  borderTop: '1px solid color-mix(in oklch, var(--hairline) 70%, transparent)',
                }}
              >
                {question.options.map((opt) => {
                  const isPicked = picked === opt.letter
                  return (
                    <li
                      key={opt.letter}
                      style={{
                        borderBottom:
                          '1px solid color-mix(in oklch, var(--hairline) 70%, transparent)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onPick(opt.letter)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'grid',
                          gridTemplateColumns: '36px 1fr',
                          gap: 18,
                          alignItems: 'baseline',
                          padding: '16px 0',
                          width: '100%',
                          borderLeft: `2px solid ${isPicked ? 'var(--ink)' : 'transparent'}`,
                          paddingLeft: 14,
                          marginLeft: -16,
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
                            fontSize: 'clamp(17px, 0.95rem + 0.3vw, 19px)',
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
                <button
                  type="button"
                  onClick={onReset}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                    color: 'var(--muted)',
                  }}
                >
                  ← börja om
                </button>
              </div>
            )}
          </section>

          {/* ── Pedagogy article body ──────────────────────────────── */}
          {!graded ? (
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                lineHeight: 1.75,
                color: 'var(--muted)',
                fontStyle: 'italic',
                margin: 0,
                textAlign: 'center',
                opacity: 0.6,
                paddingTop: 32,
                paddingBottom: 32,
              }}
            >
              Förklaringen visas när du svarat.
            </p>
          ) : (
            explanation && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'clamp(40px, 5vh, 64px)',
                  animation: 'hpc-reveal 280ms cubic-bezier(0.16, 1, 0.3, 1) both',
                }}
              >
                {/* Förklaring section */}
                <section>
                  <SectionEyebrow>Förklaring</SectionEyebrow>
                  {steps.map((step) => {
                    const isDetail = (step.tier ?? 'essential') === 'detail'
                    const isCollapsed = reveal.isCollapsedDetail(step)
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
                            gap: 14,
                            marginBottom: 24,
                            paddingBottom: 16,
                            borderBottom:
                              '1px dashed color-mix(in oklch, var(--hairline) 70%, transparent)',
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
                          <span
                            style={{
                              flex: 1,
                              fontFamily: 'var(--font-display)',
                              fontSize: 'clamp(17px, 0.95rem + 0.3vw, 19px)',
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
                          marginBottom: 'clamp(32px, 4vh, 48px)',
                          paddingLeft: 0,
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
                              fontSize: 10,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: 'var(--muted)',
                            }}
                          >
                            dölj ↗
                          </button>
                        )}
                        <h3
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(20px, 1.05rem + 0.4vw, 24px)',
                            lineHeight: 1.25,
                            letterSpacing: '-0.018em',
                            fontWeight: 500,
                            margin: 0,
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 12,
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
                          {step.title && (
                            <>
                              <span
                                style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                              >
                                ──
                              </span>
                              <span>
                                <MathText>{step.title}</MathText>
                              </span>
                            </>
                          )}
                        </h3>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(17px, 0.95rem + 0.4vw, 20px)',
                            lineHeight: 1.7,
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
                        paddingTop: 28,
                        borderTop:
                          '1px dashed color-mix(in oklch, var(--hairline) 70%, transparent)',
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
                </section>

                {/* Distractors */}
                {explanation.distractors.length > 0 && (
                  <section>
                    <SectionEyebrow>Varför inte de andra</SectionEyebrow>
                    {explanation.distractors.map((d) => (
                      <div
                        key={d.letter}
                        style={{
                          marginBottom: 24,
                          display: 'grid',
                          gridTemplateColumns: '40px 1fr',
                          gap: 14,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13,
                            letterSpacing: '0.04em',
                            fontWeight: 600,
                            color: 'var(--ink)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {d.letter.toLowerCase()}.
                        </span>
                        <div>
                          <p
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 17,
                              lineHeight: 1.55,
                              margin: 0,
                              marginBottom: 6,
                              color: 'var(--ink-2)',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                color: 'var(--muted)',
                                marginRight: 10,
                              }}
                            >
                              LOCKAR
                            </span>
                            <MathText>{d.why_tempting}</MathText>
                          </p>
                          <p
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 17,
                              lineHeight: 1.55,
                              margin: 0,
                              color: 'var(--ink-2)',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                color: 'var(--muted)',
                                marginRight: 10,
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

                {/* Technique */}
                {explanation.technique && (
                  <section>
                    <SectionEyebrow>Teknik</SectionEyebrow>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 17,
                        lineHeight: 1.6,
                        margin: 0,
                        color: 'var(--ink)',
                        paddingLeft: 14,
                        borderLeft: '2px solid var(--accent)',
                      }}
                    >
                      <MathText>{explanation.technique}</MathText>
                    </p>
                  </section>
                )}

                {/* Pitfall */}
                {explanation.pitfall && (
                  <section>
                    <SectionEyebrow>Fälla</SectionEyebrow>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 17,
                        lineHeight: 1.6,
                        margin: 0,
                        color: 'var(--ink)',
                        fontStyle: 'italic',
                        paddingLeft: 14,
                        borderLeft: '2px solid var(--bad)',
                      }}
                    >
                      <MathText>{explanation.pitfall}</MathText>
                    </p>
                  </section>
                )}

                {/* Endmark + inline CTA */}
                <div>
                  <span
                    aria-hidden
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 1,
                      background: 'var(--hairline)',
                      opacity: 0.6,
                      marginBottom: 24,
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
                        paddingBottom: 3,
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
        </article>
      </main>

      {/* Status line — on the desk surface, full canvas. */}
      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          background: 'var(--panel-2)',
          borderTop: '1px solid var(--hairline)',
          padding: '10px clamp(48px, 6vw, 96px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          color: 'var(--muted)',
        }}
      >
        <span style={{ color: graded ? 'var(--accent)' : 'var(--muted)' }}>
          -- {graded ? 'GRADERAD' : 'ÖVNING'} -- · {question.section.toLowerCase()} · fråga 1/1
        </span>
        <span style={{ display: 'inline-flex', gap: 14 }}>
          <span>esc tillbaka</span>
          <span>⌘k palett</span>
          {graded && <span style={{ color: 'var(--ink)' }}>↵ nästa</span>}
        </span>
      </footer>
    </div>
  )
}

// ── Section eyebrow — wayfinding type for the article body ──────────
//
// Uppercase mono small-caps with a leading double-hairline glyph
// (──) borrowed from the step-number signature. Acts as the
// section opener for FÖRKLARING / VARFÖR INTE DE ANDRA / TEKNIK /
// FÄLLA. This is the typographic equivalent of the 2-column
// spatial separation — it tells the eye "new section starts here"
// without needing a sidebar.

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        fontWeight: 600,
        color: 'var(--muted)',
        margin: 0,
        marginBottom: 28,
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
      }}
    >
      <span style={{ color: 'var(--accent)' }}>──</span>
      <span>{children}</span>
    </h2>
  )
}
