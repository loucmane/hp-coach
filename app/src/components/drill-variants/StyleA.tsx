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
import { QuestionFigure } from '@/components/drill/QuestionFigure'
import { EditionStrip } from '@/components/EditionStrip'
import { MathText } from '@/components/MathText'
import { PreGradeFill } from '@/components/pre-grade/PreGradeFill'
import type { VariantData } from './DrillVariantShell'
import { useExplanation } from './useExplanation'
import { useProgressiveReveal } from './useProgressiveReveal'

export function StyleA({
  question,
  explanation: explanationProp,
  picked,
  graded,
  correct,
  onPick,
  onReset,
  position,
  total,
}: VariantData) {
  // Self-load if the caller didn't preload (e.g., when used inside
  // SessionPlayer instead of via DrillVariantShell).
  const fetched = useExplanation(question.qid)
  const explanation = explanationProp ?? fetched
  const steps = explanation ? resolveSteps(explanation) : []
  const reveal = useProgressiveReveal(steps)
  // LÄS / ELF have multi-paragraph passages that need a book-width
  // reading column. Toggles the grid template + canvas max-width
  // below so the passage column expands and pedagogy compresses.
  const hasLongContext = !!question.context
  // ORD questions are dictionary specimens: a single headword (or short
  // phrase) + 5 candidate synonyms. The default prompt cap of ~24px
  // makes "hospitaliserad" look like a typo on a 1440px canvas; the
  // options at ~17px feel like checkbox bubbles, not dictionary
  // candidates. Specimen layout: hero-scale headword + roomier option
  // rhythm. (Friction inventory §5.)
  const isOrd = question.section === 'ORD'
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
        {/* Phase A.6V Edition Strip — replaces the static folio. The
         *  picker carries more value than 'pp. 1 / 1' here (which
         *  the variant doesn't even know the real value of), and
         *  reads in the same mono register the folio used. */}
        <EditionStrip />
      </header>

      {/* Content grid — wide gap = page margin of a printed book.
       *  No top padding here: the question column needs to land at
       *  exactly the header's bottom edge so sticky-top can match
       *  natural-top and pin without scroll-drift. Internal section
       *  padding provides the breath instead. */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          // LÄS / ELF carry 1500–4000 char passages. The default 0.65 :
          // 0.95fr ratio (with a 640px minmax on pedagogy) puts the
          // passage in a ~350px column = ~25ch, hostile to read. For
          // reading-comprehension sections we flip the ratio so the
          // passage gets a book-width column (~55–65ch) and widen the
          // overall canvas so pedagogy still has real estate on the
          // right. For math / vocab sections we keep the original
          // pedagogy-leaning layout — that's where step explanations
          // need the room.
          // Default ratio gives the prompt column a 56-62ch measure-cap
          // (enforced inside the section via maxWidth on the prompt
          // block). The pedagogy minmax was previously locked at 640px,
          // which crushed the prompt column to ~6-8ch at reader-width
          // viewports — the "haiku machine" bug (one word per line).
          // Now both columns share fr-flexibility; pedagogy compresses
          // gracefully at narrower canvases. At <1100px we drop to a
          // single column entirely (prompt → options → pedagogy stack).
          gridTemplateColumns: hasLongContext
            ? 'minmax(0, 1.1fr) minmax(0, 0.55fr)'
            : 'minmax(0, 1fr) minmax(0, 0.85fr)',
          gap: 'clamp(40px, 4vw, 80px)',
          maxWidth: hasLongContext ? 1500 : 1320,
          margin: '0 auto',
          width: '100%',
          padding: '0 clamp(48px, 6vw, 96px) clamp(160px, 18vh, 220px)',
        }}
      >
        {/* Question column — sticky, quiet.
         *  sticky-top = header height (clamp(46, 2vh+24, 60)) so the
         *  question pins immediately at scrollY=0 with zero drift.
         *  paddingTop inside the section gives the visual breath. */}
        <section
          style={{
            position: 'sticky',
            top: 'clamp(46px, 2vh + 24px, 60px)',
            alignSelf: 'start',
            maxHeight: 'calc(100dvh - 100px)',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            paddingTop: 'clamp(28px, 4vh, 48px)',
          }}
          className="hpc-scrollbar-ghost"
        >
          {/* LÄS / ELF passage — rendered as a quiet, indented lead-in
           *  block. Editorial register: no panel chrome, just a hairline
           *  rule on the left like marginalia quoting from a longer
           *  source. Whitespace preserved so paragraph breaks survive. */}
          {question.context && (
            <div
              data-testid="drill-context"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(15px, 0.875rem + 0.3vw, 17px)',
                lineHeight: 1.65,
                color: 'var(--ink-2)',
                marginBottom: 24,
                paddingLeft: 14,
                borderLeft: '1px solid var(--hairline)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {question.context}
            </div>
          )}
          {/* Prompt block — measure-capped at 60ch so MEK/XYZ/NOG/KVA
           *  prose stays in a comfortable Newsreader reading column
           *  even when the grid track is wider. Solves the "haiku
           *  machine" — at narrow viewports the prompt was wrapping
           *  one word per line because the grid track was crushed
           *  below 90px. Independent measure cap means the column
           *  width and the reading width are decoupled. */}
          <div
            data-testid="drill-prompt"
            style={
              isOrd
                ? {
                    // Hero-scale headword. ORD prompts are 1–3 words; the
                    // word IS the question, so it carries the visual weight
                    // of a specimen lemma. Tighter letter-spacing reads as
                    // editorial display type rather than running prose.
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(44px, 4vw + 1rem, 72px)',
                    lineHeight: 1.05,
                    letterSpacing: '-0.025em',
                    fontWeight: 500,
                    marginTop: 8,
                    marginBottom: 48,
                    color: 'var(--ink)',
                  }
                : {
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(20px, 1rem + 0.6vw, 24px)',
                    lineHeight: 1.35,
                    letterSpacing: '-0.012em',
                    fontWeight: 500,
                    marginBottom: 28,
                    color: 'var(--ink)',
                    maxWidth: '60ch',
                  }
            }
          >
            {question.section === 'KVA' && question.prompt ? (
              <KvaPrompt prompt={question.prompt} />
            ) : (
              <MathText>{question.prompt ?? ''}</MathText>
            )}
          </div>
          {/* Inline vector figure — XYZ/KVA/NOG questions that come with
           *  a parser-extracted SVG diagram. Sits between prompt and
           *  options, matching DrillQuestion's order. QuestionFigure
           *  handles its own width-fit and aspect-ratio reservation. */}
          {question.figure && <QuestionFigure figure={question.figure} />}
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
                // var(--ok) is the SEMANTIC green ("this is correct") — stable
                // across all palettes. var(--accent) is the DECORATIVE palette
                // identity (sand-tan, sage-green, ink-lemon, rose-pink) and
                // varies per theme. Use --ok for correctness; --bad for wrong.
                const railColor = isCorrect
                  ? 'var(--ok)'
                  : isWrong
                    ? 'var(--bad)'
                    : isPicked
                      ? 'var(--ink)'
                      : 'transparent'
                // Three explicit state labels (uppercase mono small-caps,
                // editorial metadata register):
                //   - picked-and-correct → "rätt"        (ok-green)
                //   - picked-but-wrong   → "ditt svar"   (bad-red)
                //   - correct, not picked → "rätt svar"  (ok-green)
                //   - untouched          → no label (and dimmed)
                let label: string | null = null
                let labelColor = 'var(--muted)'
                if (isPicked && isCorrect) {
                  label = 'rätt'
                  labelColor = 'var(--ok)'
                } else if (isWrong) {
                  label = 'ditt svar'
                  labelColor = 'var(--bad)'
                } else if (isCorrect) {
                  label = 'rätt svar'
                  labelColor = 'var(--ok)'
                }
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
                      data-testid={`option-${opt.letter}`}
                      onClick={() => onPick(opt.letter)}
                      disabled={graded}
                      style={{
                        all: 'unset',
                        cursor: graded ? 'default' : 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '24px 1fr auto',
                        gap: 14,
                        alignItems: 'baseline',
                        // ORD: candidate synonyms get dictionary breathing
                        // room — 2/3 more vertical space per row so the
                        // five candidates feel like a specimen list rather
                        // than answer-bubble checkboxes.
                        padding: isOrd ? '22px 0' : '14px 0',
                        width: '100%',
                        borderLeft: `2px solid ${railColor}`,
                        paddingLeft: 10,
                        marginLeft: -12,
                        transition: 'border-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                        opacity: graded && !isPicked && !isCorrect ? 0.45 : 1,
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
                          // ORD: candidate type at reading-display scale.
                          // Each synonym is a one-or-two-word candidate so
                          // it should read like a dictionary lemma, not a
                          // checkbox label.
                          fontSize: isOrd
                            ? 'clamp(18px, 1rem + 0.5vw, 22px)'
                            : 'clamp(15px, 0.85rem + 0.3vw, 17px)',
                          lineHeight: 1.45,
                          letterSpacing: '-0.005em',
                          fontWeight: isPicked ? 500 : 400,
                          color: isWrong ? 'var(--muted-2)' : 'var(--ink)',
                          // Strikethrough on wrong-picked text makes the
                          // "this was the wrong choice" reading instant —
                          // even before the eye gets to the bad-rail.
                          textDecoration: isWrong ? 'line-through' : 'none',
                          textDecorationColor: 'var(--bad)',
                          textDecorationThickness: 1.5,
                        }}
                      >
                        <MathText>{opt.text}</MathText>
                      </span>
                      {label && (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            color: labelColor,
                            whiteSpace: 'nowrap',
                            paddingLeft: 8,
                          }}
                        >
                          {label}
                        </span>
                      )}
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

        {/* Pedagogy column — the hero. Newsreader at reading size.
         *  paddingTop matches the question column's internal padding
         *  so the two columns align at the top. */}
        <section
          style={{
            maxWidth: '65ch',
            paddingTop: 'clamp(28px, 4vh, 48px)',
            // Opacity used to fade the column since it had no
            // pre-grade content — PreGradeFill now carries named-
            // tactic strategy coaching there, so both modes render
            // at full weight. The transition is kept for the
            // post-grade swap from coaching → explanation.
            transition: 'opacity 280ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {!graded ? (
            <PreGradeFill
              question={question}
              explanation={explanation}
              position={position}
              total={total}
            />
          ) : !explanation ? (
            // Graded but no Variant-C explanation on file (DTK, parser-
            // truncated tail, or a qid the regen waves missed). Without
            // this branch the post-grade body short-circuits and the
            // drill-next button never renders — Enter still advances
            // via SessionPlayer's global key binding, but there's no
            // visible affordance. Surface a minimal "advance" control
            // so click works regardless.
            <div
              style={{
                paddingTop: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                maxWidth: '52ch',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Förklaring saknas
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: 'var(--ink-2)',
                }}
              >
                Den här frågan har ingen utförlig förklaring i korpus ännu.
              </p>
              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <button
                  type="button"
                  data-testid="drill-next"
                  onClick={onReset}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    fontSize: 17,
                    lineHeight: 1.4,
                    color: 'var(--ink)',
                    fontWeight: 500,
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
            </div>
          ) : (
            // graded && explanation truthy — render the full pedagogy
            // walk-through with the canonical Nästa fråga button at the
            // end.
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
                  data-testid="drill-next"
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
