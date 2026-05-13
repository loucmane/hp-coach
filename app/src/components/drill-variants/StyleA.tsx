// Style A — Editorial Pure.
//
// Thesis: the current 2-column composition is correct, but every
// surface is dialed to 70% opacity. Strip the ornament. The pedagogy
// column becomes the hero with Newsreader 20px/1.7 reading typography;
// the question column quietly anchors at left; frosted glass dies
// everywhere; the CTA is a typographic inline link at the end of
// pedagogy, no floating pill.
//
// Stripe Press × Apple Books reading register.

import { KvaPrompt } from '@/components/drill/KvaPrompt'
import { resolveSteps } from '@/components/drill/PedagogyPanel'
import { MathText } from '@/components/MathText'
import type { VariantData } from './DrillVariantShell'
import { useProgressiveReveal } from './useProgressiveReveal'

export function StyleA({
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
      {/* Running head — solid bg, NO frost. Hairline does all the work. */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--hairline)',
          padding: 'clamp(20px, 2vh, 32px) clamp(48px, 6vw, 96px) 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
        }}
      >
        <span>HP · COACH · {question.section}</span>
        <span
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
            letterSpacing: '0.08em',
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
            textTransform: 'none',
          }}
        >
          <span>pp. 1 / 1</span>
          <span
            aria-hidden
            style={{ width: '2.4em', height: 1, background: 'var(--muted)', opacity: 0.5 }}
          />
        </span>
      </header>

      {/* Content grid — wide gap = page margin of a printed book. */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.65fr) minmax(640px, 0.95fr)',
          gap: 'clamp(56px, 5vw, 96px)',
          maxWidth: 1320,
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(48px, 6vh, 96px) clamp(48px, 6vw, 96px) clamp(160px, 18vh, 220px)',
        }}
      >
        {/* Question column — sticky, quiet. */}
        <section
          style={{
            position: 'sticky',
            top: 'clamp(80px, 9vh, 112px)',
            alignSelf: 'start',
            maxHeight: 'calc(100dvh - 160px)',
            overflowY: 'auto',
            scrollbarWidth: 'none',
          }}
          className="hpc-scrollbar-ghost"
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 1rem + 0.6vw, 24px)',
              lineHeight: 1.35,
              letterSpacing: '-0.012em',
              fontWeight: 500,
              marginBottom: 28,
              color: 'var(--ink)',
            }}
          >
            {question.section === 'KVA' && question.prompt ? (
              <KvaPrompt prompt={question.prompt} />
            ) : (
              <MathText>{question.prompt ?? ''}</MathText>
            )}
          </div>
          {question.options && (
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
                const isCorrect = graded && opt.letter === question.answer
                const isWrong = graded && isPicked && !correct
                const railColor = isCorrect
                  ? 'var(--accent)'
                  : isWrong
                    ? 'var(--bad)'
                    : isPicked
                      ? 'var(--ink)'
                      : 'transparent'
                return (
                  <li
                    key={opt.letter}
                    style={{
                      borderBottom:
                        '1px solid color-mix(in oklch, var(--hairline) 60%, transparent)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onPick(opt.letter)}
                      disabled={graded}
                      style={{
                        all: 'unset',
                        cursor: graded ? 'default' : 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '24px 1fr',
                        gap: 14,
                        alignItems: 'baseline',
                        padding: '14px 0',
                        width: '100%',
                        borderLeft: `2px solid ${railColor}`,
                        paddingLeft: 10,
                        marginLeft: -12,
                        transition: 'border-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                        opacity: graded && !isPicked && !isCorrect ? 0.5 : 1,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          letterSpacing: '0.04em',
                          fontWeight: isPicked ? 600 : 500,
                          color: isPicked || isCorrect ? 'var(--ink)' : 'var(--muted)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {opt.letter.toLowerCase()}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(15px, 0.85rem + 0.3vw, 17px)',
                          lineHeight: 1.45,
                          letterSpacing: '-0.005em',
                          fontWeight: isPicked ? 500 : 400,
                          color: isWrong ? 'var(--muted-2)' : 'var(--ink)',
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
            <button
              type="button"
              onClick={onReset}
              style={{
                all: 'unset',
                cursor: 'pointer',
                marginTop: 24,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              ← börja om
            </button>
          )}
        </section>

        {/* Pedagogy column — the hero. Newsreader at reading size. */}
        <section
          style={{
            maxWidth: '65ch',
            opacity: graded ? 1 : 0.3,
            transition: 'opacity 280ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {!graded ? (
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 19,
                lineHeight: 1.7,
                color: 'var(--muted)',
                fontStyle: 'italic',
              }}
            >
              Förklaringen visas när du svarat.
            </p>
          ) : (
            explanation && (
              <>
                {steps.map((step, i) => {
                  const isDetail = (step.tier ?? 'essential') === 'detail'
                  const isCollapsed = reveal.isCollapsedDetail(step)
                  // Collapsed detail = a single-line typographic preview
                  // row. Editorial register: hanging mono number stays,
                  // title in ink, "se mer →" italic muted at right.
                  if (isCollapsed) {
                    return (
                      <button
                        key={step.n}
                        type="button"
                        onClick={() => reveal.expandDetail(step.n)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: 16,
                          marginBottom: 20,
                          paddingBottom: 16,
                          borderBottom:
                            '1px dashed color-mix(in oklch, var(--hairline) 60%, transparent)',
                          width: '100%',
                          animation: 'hpc-reveal 280ms cubic-bezier(0.16, 1, 0.3, 1) both',
                          animationDelay: `${Math.min(i, 8) * 60}ms`,
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            left: -56,
                            top: 0,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            letterSpacing: '0.05em',
                            fontWeight: 500,
                            color: 'var(--muted)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {String(step.n).padStart(2, '0')}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(17px, 0.95rem + 0.3vw, 19px)',
                            lineHeight: 1.4,
                            letterSpacing: '-0.012em',
                            fontWeight: 500,
                            color: 'var(--ink-2)',
                            flex: 1,
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
                          se mer →
                        </span>
                      </button>
                    )
                  }
                  return (
                    <article
                      key={step.n}
                      style={{
                        position: 'relative',
                        marginBottom: 36,
                        animation: 'hpc-reveal 280ms cubic-bezier(0.16, 1, 0.3, 1) both',
                        animationDelay: `${Math.min(i, 8) * 60}ms`,
                      }}
                    >
                      {/* Hanging step number, mono, accent — signature element. */}
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          left: -56,
                          top: 6,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          letterSpacing: '0.05em',
                          fontWeight: 500,
                          color: 'var(--accent)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {String(step.n).padStart(2, '0')}
                      </span>
                      {/* Matching-width hairline beneath, mirroring the folio. */}
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          left: -56,
                          top: 24,
                          width: '1.5em',
                          height: 1,
                          background: 'var(--accent)',
                          opacity: 0.5,
                        }}
                      />
                      {/* Detail steps that are expanded get a quiet
                       *  collapse affordance at the top-right. */}
                      {isDetail && (
                        <button
                          type="button"
                          onClick={() => reveal.collapseDetail(step.n)}
                          style={{
                            all: 'unset',
                            cursor: 'pointer',
                            position: 'absolute',
                            top: 0,
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
                      {step.title && (
                        <h3
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(20px, 1.05rem + 0.4vw, 24px)',
                            lineHeight: 1.25,
                            letterSpacing: '-0.018em',
                            fontWeight: 500,
                            margin: 0,
                            marginBottom: 12,
                            paddingRight: isDetail ? 60 : 0,
                          }}
                        >
                          <MathText>{step.title}</MathText>
                        </h3>
                      )}
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(17px, 0.95rem + 0.35vw, 20px)',
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

                {/* Bottom Progressive Reveal CTA — typographic, no chrome. */}
                {reveal.totalDetailCount > 0 && (
                  <div
                    style={{
                      marginTop: 12,
                      marginBottom: 48,
                      paddingTop: 24,
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
                          fontSize: 17,
                          fontStyle: 'italic',
                          color: 'var(--ink)',
                          borderBottom: '1px solid var(--ink)',
                          paddingBottom: 2,
                        }}
                      >
                        Jag förstår fortfarande inte
                        <span
                          style={{
                            color: 'var(--muted)',
                            marginLeft: 8,
                            fontStyle: 'normal',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
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
                  <section style={{ marginTop: 64 }}>
                    <h2
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: 'var(--muted)',
                        margin: 0,
                        marginBottom: 24,
                      }}
                    >
                      Varför inte de andra
                    </h2>
                    {explanation.distractors.map((d) => (
                      <div key={d.letter} style={{ position: 'relative', marginBottom: 28 }}>
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            left: -56,
                            top: 4,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            letterSpacing: '0.04em',
                            fontWeight: 500,
                            color: 'var(--muted)',
                          }}
                        >
                          {d.letter.toLowerCase()}.
                        </span>
                        <p
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 16,
                            lineHeight: 1.55,
                            margin: 0,
                            marginBottom: 6,
                            color: 'var(--ink)',
                            fontStyle: 'italic',
                          }}
                        >
                          Lockar för att <MathText>{d.why_tempting}</MathText>
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 16,
                            lineHeight: 1.55,
                            margin: 0,
                            color: 'var(--ink)',
                          }}
                        >
                          Men fel för att <MathText>{d.why_wrong}</MathText>
                        </p>
                      </div>
                    ))}
                  </section>
                )}

                {/* Technique + Pitfall — rails, no chips. */}
                {explanation.technique && (
                  <section
                    style={{
                      marginTop: 64,
                      paddingLeft: 16,
                      borderLeft: '2px solid var(--accent)',
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        margin: 0,
                        marginBottom: 8,
                      }}
                    >
                      Teknik
                    </h3>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 16,
                        lineHeight: 1.55,
                        margin: 0,
                        color: 'var(--ink)',
                      }}
                    >
                      <MathText>{explanation.technique}</MathText>
                    </p>
                  </section>
                )}
                {explanation.pitfall && (
                  <section
                    style={{ marginTop: 32, paddingLeft: 16, borderLeft: '2px solid var(--bad)' }}
                  >
                    <h3
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: 'var(--bad)',
                        margin: 0,
                        marginBottom: 8,
                      }}
                    >
                      Fälla
                    </h3>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 16,
                        lineHeight: 1.55,
                        margin: 0,
                        color: 'var(--ink)',
                        fontStyle: 'italic',
                      }}
                    >
                      <MathText>{explanation.pitfall}</MathText>
                    </p>
                  </section>
                )}

                {/* Inline CTA — typographic, not a floating pill. */}
                <div style={{ marginTop: 80, textAlign: 'right' }}>
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
                  <button
                    type="button"
                    onClick={onReset}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontSize: 17,
                      lineHeight: 1.4,
                      color: 'var(--ink)',
                      fontWeight: 500,
                      borderBottom: '1px solid transparent',
                      transition: 'border-color 150ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderBottomColor = 'var(--ink)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderBottomColor = 'transparent'
                    }}
                  >
                    Nästa fråga →{' '}
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
              </>
            )
          )}
        </section>
      </main>

      {/* Status line — solid bg, no frost. */}
      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          background: 'var(--bg)',
          borderTop: '1px solid var(--hairline)',
          padding: '10px clamp(48px, 6vw, 96px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.14em',
          color: 'var(--muted)',
        }}
      >
        <span>-- ÖVNING -- · {question.section.toLowerCase()}</span>
        <span style={{ display: 'inline-flex', gap: 14 }}>
          <span>esc tillbaka</span>
          <span>⌘k palett</span>
          {graded && <span style={{ color: 'var(--ink)' }}>↵ nästa</span>}
        </span>
      </footer>
    </div>
  )
}
