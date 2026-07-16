// LandingBakeoffE — the landing-page bake-off, EDITORIAL lens (P2-2.1).
// Two full scrolling landing concepts, phone-first (designed at 390px,
// then widened), both in the M3 Boksidan idiom: serif display, mono
// marginalia, hairline rules, ONE accent. Motion is Arket-lawful — ink
// dries in place (opacity only, zero entrance offsets), one signature
// beat per page, reduced motion collapses to the final frame.
//
//   E1 "Första lektionen" — demonstration-led. The landing IS the first
//        lesson: the hero states a thesis ("inte ett kunskapsprov — ett
//        mönsterprov"), then the page proves it by teaching a root
//        (REVIDERA) before asking for anything. Marginalia carry the
//        coach's voice. Signature: the hero sets like ink in three
//        beats and the accent rule draws under the load-bearing word.
//
//   E2 "Kursplanen" — transparency-led. The landing is the course's
//        front matter: a title page, a real table of contents (the
//        exam's own eight delprov, with dotted leaders and question
//        counts — the numbering IS the information), the reading arc,
//        terms as a plain ledger, price as the back cover. Signature:
//        the ToC prints line by line at counting cadence.
//
// LEGAL: the two practice questions below are ORIGINAL, written for
// this page in authentic HP style. They are NOT from any real exam and
// are labeled as such in the UI. Do not replace them with corpus data
// (© UHR).
//
// DESIGN artifact: fixtures only — no routes here; the orchestrator
// stitches /dev/landing-bakeoff.

import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useState } from 'react'
import { EASE, useMountGo } from '@/lib/motion'

/* ── shared fixtures: two original practice questions ─────────────── */

interface TasteOption {
  key: string
  text: string
}

interface TasteQuestion {
  id: string
  section: 'ORD' | 'NOG'
  kicker: string
  stem: ReactNode
  options: TasteOption[]
  correct: string
  explanation: string
}

const Q_ORD: TasteQuestion = {
  id: 'e-ord-premiss',
  section: 'ORD',
  kicker: 'Vilket ord motsvarar närmast?',
  stem: 'premiss',
  options: [
    { key: 'A', text: 'antagande' },
    { key: 'B', text: 'slutsats' },
    { key: 'C', text: 'invändning' },
    { key: 'D', text: 'bevis' },
    { key: 'E', text: 'undantag' },
  ],
  correct: 'A',
  explanation:
    'Premiss kommer av latinets prae- (före) + mittere (skicka): det som skickas före — antagandet som ett resonemang vilar på. Fällan är B, slutsats: den bor i samma rum, men i andra änden av resonemanget. Känner du igen prae- har du redan halva svaret.',
}

const Q_NOG: TasteQuestion = {
  id: 'e-nog-bio',
  section: 'NOG',
  kicker: 'Vad kostar en biobiljett?',
  stem: (
    <>
      (1) Två biljetter och en popcorn kostar tillsammans 310 kronor.
      <br />
      (2) En popcorn kostar 70 kronor.
    </>
  ),
  options: [
    { key: 'A', text: '(1) ensam är tillräcklig, men inte (2)' },
    { key: 'B', text: '(2) ensam är tillräcklig, men inte (1)' },
    { key: 'C', text: '(1) och (2) tillsammans, men ingen ensam' },
    { key: 'D', text: 'var och en är tillräcklig för sig' },
    { key: 'E', text: 'informationen är otillräcklig, även tillsammans' },
  ],
  correct: 'C',
  explanation:
    'Du behöver aldrig räkna ut priset — bara avgöra om det går att räkna ut. (1) ensam: två obekanta, en ekvation — otillräcklig. (2) ensam säger inget om biljetten. Tillsammans: 2x + 70 = 310 ger exakt ett svar. Alltså C. Det är hela NOG-tänket: bedöm lösbarhet, lös inte.',
}

const TASTE_DISCLAIMER =
  'Övningsexemplen är skrivna för den här sidan i provets stil — de kommer inte från något riktigt högskoleprov.'

/* ── shared style sheet (phone-first; class prefix lde-) ──────────── */

function LdeStyle() {
  return (
    <style>{`
      .lde-page {
        background: var(--bg);
        color: var(--ink);
        font-family: var(--font-ui);
        letter-spacing: var(--font-ui-track);
        min-height: 100vh;
      }
      .lde-col {
        max-width: 640px;
        margin: 0 auto;
        padding: 0 22px;
      }
      .lde-topbar {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        padding: 18px 0 14px;
        border-bottom: 1px solid var(--hairline);
      }
      .lde-wordmark {
        font-family: var(--font-mono);
        letter-spacing: var(--font-mono-track);
        font-size: 12px;
        font-weight: 600;
        color: var(--ink);
        text-transform: uppercase;
      }
      .lde-topbar a.lde-signin {
        font-size: 13px;
        color: var(--ink-2);
        text-decoration: underline;
        text-underline-offset: 3px;
      }
      .lde-eyebrow {
        font-family: var(--font-mono);
        letter-spacing: 0.14em;
        font-size: var(--type-eyebrow);
        text-transform: uppercase;
        color: var(--muted);
      }
      .lde-display {
        font-family: var(--font-display);
        font-weight: var(--font-display-w);
        letter-spacing: var(--font-display-track);
        line-height: 1.08;
        color: var(--ink);
      }
      .lde-body {
        font-size: var(--type-body-editorial);
        line-height: var(--type-body-editorial-leading);
        color: var(--ink-2);
        max-width: 34em;
      }
      .lde-rule { border: 0; border-top: 1px solid var(--hairline); margin: 0; }
      .lde-section { padding: 44px 0; border-bottom: 1px solid var(--hairline); }
      .lde-h2 {
        font-family: var(--font-display);
        font-weight: var(--font-display-w);
        letter-spacing: var(--font-display-track);
        font-size: clamp(26px, 2vw + 14px, 36px);
        line-height: 1.12;
        margin: 10px 0 14px;
      }
      .lde-note {
        font-family: var(--font-mono);
        letter-spacing: var(--font-mono-track);
        font-size: 12.5px;
        line-height: 1.55;
        color: var(--muted);
        border-left: 2px solid var(--accent);
        padding-left: 12px;
        margin: 18px 0 0;
        max-width: 30em;
      }
      .lde-cta {
        display: inline-block;
        background: var(--accent);
        color: var(--accent-ink);
        font-family: var(--font-ui);
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.01em;
        padding: 14px 26px;
        border-radius: 999px;
        text-decoration: none;
        transition: transform var(--dur-snap) var(--ease-spring), filter var(--dur-chrome) var(--ease-reading);
      }
      .lde-cta:hover { filter: brightness(1.06); }
      .lde-cta:active { transform: scale(0.98); }
      .lde-cta:focus-visible, .lde-opt:focus-visible, .lde-signin:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 3px;
      }
      .lde-cta-hint {
        font-family: var(--font-mono);
        letter-spacing: var(--font-mono-track);
        font-size: 12px;
        color: var(--muted);
        margin-top: 12px;
      }

      /* question block */
      .lde-q { border: 1px solid var(--hairline); border-radius: var(--radius); padding: 20px; background: var(--panel); }
      .lde-q + .lde-q { margin-top: 18px; }
      .lde-q-kicker { font-size: 14px; color: var(--ink-2); margin: 6px 0 4px; }
      .lde-q-stem-word {
        font-family: var(--font-display);
        font-weight: var(--font-display-w);
        font-size: clamp(30px, 3vw + 16px, 40px);
        letter-spacing: var(--font-display-track);
        margin: 2px 0 14px;
      }
      .lde-q-stem-text { font-size: 15.5px; line-height: 1.55; color: var(--ink); margin: 2px 0 14px; }
      .lde-opt {
        display: flex;
        align-items: baseline;
        gap: 12px;
        width: 100%;
        text-align: left;
        background: none;
        border: 0;
        border-top: 1px solid var(--hairline-2);
        padding: 10px 2px;
        font-family: var(--font-ui);
        font-size: 15.5px;
        color: var(--ink);
        cursor: pointer;
        transition: background var(--dur-chrome) var(--ease-reading);
      }
      .lde-opt:hover:enabled { background: var(--panel-2); }
      .lde-opt:disabled { cursor: default; }
      .lde-opt .k {
        font-family: var(--font-mono);
        font-size: 12px;
        letter-spacing: var(--font-mono-track);
        color: var(--muted);
        min-width: 16px;
      }
      .lde-opt[data-state="correct"] { color: var(--ok); font-weight: 600; }
      .lde-opt[data-state="wrong"] { color: var(--bad); text-decoration: line-through; }
      .lde-opt[data-state="dim"] { color: var(--muted); }
      .lde-verdict { font-family: var(--font-mono); letter-spacing: var(--font-mono-track); font-size: 13px; margin: 14px 0 8px; }
      .lde-verdict.ok { color: var(--ok); }
      .lde-verdict.bad { color: var(--bad); }
      .lde-expl { font-size: 15px; line-height: 1.6; color: var(--ink-2); margin: 0; }
      .lde-disclaim {
        font-family: var(--font-mono);
        letter-spacing: var(--font-mono-track);
        font-size: 11.5px;
        line-height: 1.6;
        color: var(--muted);
        margin-top: 16px;
      }

      /* honest / ledger rows */
      .lde-ledger { margin: 8px 0 0; }
      .lde-ledger-row {
        display: grid;
        grid-template-columns: 92px minmax(0, 1fr);
        gap: 14px;
        padding: 12px 0;
        border-top: 1px solid var(--hairline-2);
        font-size: 15px;
        line-height: 1.55;
      }
      .lde-ledger-row dt {
        font-family: var(--font-mono);
        letter-spacing: var(--font-mono-track);
        font-size: 11.5px;
        text-transform: uppercase;
        color: var(--muted);
        padding-top: 2px;
      }
      .lde-ledger-row dd { margin: 0; color: var(--ink-2); }

      /* price */
      .lde-price {
        font-family: var(--font-display);
        font-weight: var(--font-display-w);
        letter-spacing: var(--font-display-track);
        font-size: clamp(44px, 4vw + 22px, 64px);
        line-height: 1;
      }
      .lde-price .x { color: var(--accent); }

      .lde-foot {
        padding: 28px 0 56px;
        font-family: var(--font-mono);
        letter-spacing: var(--font-mono-track);
        font-size: 11.5px;
        line-height: 1.8;
        color: var(--muted);
      }

      /* E1 hero */
      .lde1-hero { padding: 56px 0 48px; border-bottom: 1px solid var(--hairline); }
      .lde1-hero-line {
        display: block;
        font-size: clamp(34px, 6vw + 12px, 62px);
      }
      .lde1-underline {
        display: block;
        height: 3px;
        background: var(--accent);
        transform-origin: left center;
        margin-top: 10px;
        max-width: 240px;
      }
      /* E1 worked example */
      .lde1-word {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 22px;
        margin: 20px 0 6px;
      }
      .lde1-morph { text-align: center; }
      .lde1-morph .part {
        font-family: var(--font-display);
        font-weight: var(--font-display-w);
        letter-spacing: 0.01em;
        font-size: clamp(34px, 5vw + 12px, 52px);
        line-height: 1;
        padding: 0 2px;
        border-bottom: 2px solid var(--hairline);
      }
      .lde1-morph.hit .part { border-bottom-color: var(--accent); }
      .lde1-morph .gloss {
        display: block;
        font-family: var(--font-mono);
        letter-spacing: var(--font-mono-track);
        font-size: 11px;
        color: var(--muted);
        margin-top: 8px;
      }
      /* E1 layers */
      .lde1-layer { border-top: 1px solid var(--hairline-2); padding: 16px 0; }
      .lde1-layer .tag {
        font-family: var(--font-mono);
        letter-spacing: 0.12em;
        font-size: 11px;
        text-transform: uppercase;
        color: var(--accent);
      }
      .lde1-layer h3 {
        font-family: var(--font-display);
        font-weight: var(--font-display-w);
        font-size: 21px;
        margin: 6px 0 6px;
      }
      .lde1-layer p { font-size: 15px; line-height: 1.55; color: var(--ink-2); margin: 0; max-width: 36em; }

      /* desktop: E1 marginalia move into a true margin column */
      @media (min-width: 900px) {
        .lde-col { max-width: 880px; }
        .lde-annotated {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 200px;
          column-gap: 40px;
          align-items: start;
        }
        .lde-annotated .lde-note { margin-top: 6px; }
        .lde1-hero-line { font-size: clamp(48px, 4.4vw + 12px, 76px); }
      }

      /* E2 title page */
      .lde2-title-page { padding: 64px 0 52px; border-bottom: 1px solid var(--hairline); }
      .lde2-title {
        font-size: clamp(36px, 6vw + 12px, 64px);
        margin: 14px 0 18px;
      }
      /* E2 ToC */
      .lde2-toc-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        padding: 11px 0;
        border: 0;
        font-size: 16px;
      }
      .lde2-toc-row .no {
        font-family: var(--font-mono);
        letter-spacing: var(--font-mono-track);
        font-size: 12px;
        color: var(--muted);
        min-width: 18px;
      }
      .lde2-toc-row .code {
        font-family: var(--font-display);
        font-weight: var(--font-display-w);
        font-size: 19px;
        letter-spacing: 0.01em;
      }
      .lde2-toc-row .what { color: var(--ink-2); font-size: 14.5px; }
      .lde2-toc-row .leader {
        flex: 1;
        border-bottom: 1px dotted var(--hairline);
        transform: translateY(-4px);
        min-width: 16px;
      }
      .lde2-toc-row .count {
        font-family: var(--font-mono);
        letter-spacing: var(--font-mono-track);
        font-size: 12px;
        color: var(--muted);
        white-space: nowrap;
      }
      .lde2-half-rule {
        font-family: var(--font-mono);
        letter-spacing: 0.12em;
        font-size: 11px;
        text-transform: uppercase;
        color: var(--accent);
        padding: 18px 0 6px;
      }
      /* E2 arc */
      .lde2-arc-step { display: flex; gap: 14px; padding: 13px 0; border-top: 1px solid var(--hairline-2); }
      .lde2-arc-step .no {
        font-family: var(--font-mono);
        letter-spacing: var(--font-mono-track);
        font-size: 12px;
        color: var(--accent);
        min-width: 18px;
        padding-top: 3px;
      }
      .lde2-arc-step .body { font-size: 15px; line-height: 1.55; color: var(--ink-2); max-width: 36em; }
      .lde2-arc-step .body b { color: var(--ink); font-weight: 600; }

      @media (prefers-reduced-motion: reduce) {
        .lde-page * { transition-duration: 0s !important; }
      }
    `}</style>
  )
}

/* ── shared interactive taste block ───────────────────────────────── */

function TasteQuestionCard({ q }: { q: TasteQuestion }) {
  const [picked, setPicked] = useState<string | null>(null)
  const rm = useReducedMotion() === true
  const answered = picked !== null
  const right = picked === q.correct

  return (
    <div className="lde-q">
      <span className="lde-eyebrow">{q.section} · övningsexempel</span>
      <p className="lde-q-kicker">{q.kicker}</p>
      {q.section === 'ORD' ? (
        <p className="lde-q-stem-word lde-display">{q.stem}</p>
      ) : (
        <p className="lde-q-stem-text">{q.stem}</p>
      )}
      <div>
        {q.options.map((opt) => {
          let state: string | undefined
          if (answered) {
            if (opt.key === q.correct) state = 'correct'
            else if (opt.key === picked) state = 'wrong'
            else state = 'dim'
          }
          return (
            <button
              key={opt.key}
              type="button"
              className="lde-opt"
              data-state={state}
              disabled={answered}
              onClick={() => setPicked(opt.key)}
            >
              <span className="k">{opt.key}</span>
              <span>{opt.text}</span>
            </button>
          )
        })}
      </div>
      {answered && (
        <motion.div
          initial={rm ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={rm ? { duration: 0 } : { duration: 0.24, ease: [...EASE.reading] }}
        >
          <p className={`lde-verdict ${right ? 'ok' : 'bad'}`} aria-live="polite">
            {right ? 'Rätt.' : `Fel — rätt svar är ${q.correct}.`}
          </p>
          <p className="lde-expl">{q.explanation}</p>
        </motion.div>
      )}
    </div>
  )
}

/* ── shared blocks ────────────────────────────────────────────────── */

function TopBar() {
  return (
    <div className="lde-topbar">
      <span className="lde-wordmark">HP-Coach</span>
      <a className="lde-signin" href="/sign-in">
        Logga in
      </a>
    </div>
  )
}

function FootColophon() {
  return (
    <footer className="lde-foot">
      HP-Coach drivs av [namn] · orgnr [—] · [e-post]
      <br />
      Högskoleprovet ges av UHR. HP-Coach är ett fristående träningsverktyg utan koppling till UHR.
      <br />
      {TASTE_DISCLAIMER}
    </footer>
  )
}

/* ══════════════════════════════════════════════════════════════════
   E1 · "Första lektionen" — the landing is the first lesson
   ══════════════════════════════════════════════════════════════════ */

export function LAND_E1() {
  const rm = useReducedMotion() === true
  const go = useMountGo(rm)
  // Signature beat: the thesis sets like ink in three reading-pace
  // steps, then the accent rule draws under the claim. Opacity only —
  // nothing travels. Under reduced motion `go` starts true.
  const ink = (delay: number) => ({
    initial: rm ? false : { opacity: 0 },
    animate: { opacity: go ? 1 : 0 },
    transition: rm
      ? { duration: 0 }
      : { duration: 0.6, delay, ease: [...EASE.reading] as [number, number, number, number] },
  })

  return (
    <div className="lde-page">
      <LdeStyle />
      <div className="lde-col">
        <TopBar />

        {/* hero — the thesis */}
        <header className="lde1-hero">
          <motion.p className="lde-eyebrow" {...ink(0)}>
            Inför högskoleprovet
          </motion.p>
          <h1 className="lde-display" style={{ margin: '14px 0 0' }}>
            <motion.span className="lde1-hero-line" {...ink(0.15)}>
              Högskoleprovet är inte ett kunskapsprov.
            </motion.span>
            <motion.span className="lde1-hero-line" {...ink(0.55)}>
              Det är ett mönsterprov.
            </motion.span>
          </h1>
          <motion.span
            className="lde1-underline"
            aria-hidden
            initial={rm ? false : { scaleX: 0 }}
            animate={{ scaleX: go ? 1 : 0 }}
            transition={
              rm
                ? { duration: 0 }
                : {
                    duration: 0.5,
                    delay: 1.0,
                    ease: [...EASE.reading] as [number, number, number, number],
                  }
            }
          />
          <motion.div {...ink(1.15)}>
            <p className="lde-body" style={{ margin: '22px 0 26px' }}>
              Samma ordrötter, samma frågetyper, samma fällor — år efter år. HP-Coach lär dig
              strukturen bakom alla åtta delproven, från noll förkunskaper, med siktet på 2,0.
            </p>
            <a className="lde-cta" href="/sign-up">
              Skapa konto
            </a>
            <p className="lde-cta-hint">X kr · engångsköp, gäller till provdagen</p>
          </motion.div>
        </header>

        {/* lesson one — the page teaches before it asks */}
        <section className="lde-section" aria-labelledby="e1-lektion">
          <span className="lde-eyebrow">Lektion ett · gratis, här och nu</span>
          <h2 id="e1-lektion" className="lde-h2">
            Läs ett ord som provet gör.
          </h2>
          <div className="lde-annotated">
            <div>
              <div
                className="lde1-word"
                role="img"
                aria-label="revidera, uppdelat i morfem: re, vid, era"
              >
                <span className="lde1-morph hit">
                  <span className="part">re</span>
                  <span className="gloss">åter</span>
                </span>
                <span className="lde1-morph">
                  <span className="part">vid</span>
                  <span className="gloss">se (videre)</span>
                </span>
                <span className="lde1-morph">
                  <span className="part">era</span>
                  <span className="gloss">ändelse</span>
                </span>
              </div>
              <p className="lde-body" style={{ margin: '18px 0 0' }}>
                <em>Revidera</em> — att se över igen. Roten <em>vid</em> bor också i vision, evident
                och provisorisk. En rot du kan är tio glosor du slipper.
              </p>
            </div>
            <p className="lde-note">
              ur ramverket: rötterna är hämtade ur samtliga offentliga prov — de vanligaste lärs
              först.
            </p>
          </div>
        </section>

        {/* the three layers */}
        <section className="lde-section" aria-labelledby="e1-lager">
          <span className="lde-eyebrow">Så funkar det</span>
          <h2 id="e1-lager" className="lde-h2">
            Tre lager, ett system.
          </h2>
          <div className="lde1-layer">
            <span className="tag">Lager 1 · Ramverk</span>
            <h3>Strukturen bakom varje delprov.</h3>
            <p>
              Ordrötter för ORD. Frågetyper för läsdelarna. Kataloger över räknefällorna. Det du
              behöver kunna — inte allt som finns.
            </p>
          </div>
          <div className="lde1-layer">
            <span className="tag">Lager 2 · Förklaringar</span>
            <h3>Varje fråga förklarad. Varje fel alternativ också.</h3>
            <p>
              Inte bara varför rätt svar är rätt — utan varför fällan lockade, och vilket mönster
              den hör till.
            </p>
          </div>
          <div className="lde1-layer">
            <span className="tag">Lager 3 · Nästa steg</span>
            <h3>Du väljer aldrig vad du ska öva på.</h3>
            <p>
              Systemet ser var du tappar poäng och lägger nästa uppgift där. Du öppnar appen och
              trycker på en knapp.
            </p>
          </div>
        </section>

        {/* ADHD section */}
        <section className="lde-section" aria-labelledby="e1-adhd">
          <span className="lde-eyebrow">Byggd annorlunda</span>
          <h2 id="e1-adhd" className="lde-h2">
            För hjärnor som tappar tråden.
          </h2>
          <div className="lde-annotated">
            <p className="lde-body">
              HP-Coach är ritad för ADHD från första skissen. En uppgift i taget, inget annat på
              skärmen. Ingen streak att skämmas över — en missad dag är bara en dag. Tio minuter
              räknas som ett pass. Och nästa steg är alltid valt åt dig, så att börja aldrig är det
              svåra.
            </p>
            <p className="lde-note">
              byggd av en person med ADHD-PI som själv pluggar mot 2,0 — appen används varje dag av
              den som bygger den.
            </p>
          </div>
        </section>

        {/* interactive taste */}
        <section className="lde-section" aria-labelledby="e1-prova">
          <span className="lde-eyebrow">Känn på det</span>
          <h2 id="e1-prova" className="lde-h2">
            Två uppgifter, som i appen.
          </h2>
          <TasteQuestionCard q={Q_ORD} />
          <TasteQuestionCard q={Q_NOG} />
          <p className="lde-disclaim">{TASTE_DISCLAIMER}</p>
        </section>

        {/* the honest machine */}
        <section className="lde-section" aria-labelledby="e1-arligt">
          <span className="lde-eyebrow">Det finstilta, i stor stil</span>
          <h2 id="e1-arligt" className="lde-h2">
            Vad vi inte lovar.
          </h2>
          <dl className="lde-ledger">
            <div className="lde-ledger-row">
              <dt>Resultat</dt>
              <dd>Inget resultatlöfte. HP-Coach är ett träningsverktyg — provet skriver du.</dd>
            </div>
            <div className="lde-ledger-row">
              <dt>Genvägar</dt>
              <dd>
                Inga knep eller tips-listor. Strukturen tar månader att lära sig. Det är poängen.
              </dd>
            </div>
            <div className="lde-ledger-row">
              <dt>För alla</dt>
              <dd>
                Ligger du redan på 1,5+ och vill finslipa? Då finns snabbare vägar än vår. Kursen
                börjar från noll.
              </dd>
            </div>
            <div className="lde-ledger-row">
              <dt>Ansvarig</dt>
              <dd>HP-Coach drivs av [namn], orgnr [—]. En person, inte ett callcenter.</dd>
            </div>
          </dl>
        </section>

        {/* price + CTA */}
        <section className="lde-section" aria-labelledby="e1-pris" style={{ borderBottom: 0 }}>
          <span className="lde-eyebrow">Pris</span>
          <p className="lde-price" style={{ margin: '14px 0 6px' }}>
            <span className="x">X</span> kr
          </p>
          <p className="lde-cta-hint" style={{ marginTop: 0 }}>
            engångsköp · gäller till din provdag · priset sätts före öppningen
          </p>
          <p className="lde-body" style={{ margin: '18px 0 26px' }}>
            Att skriva provet kostar 550 kr i anmälningsavgift. Förberedelsen är ett köp, en gång —
            ingen prenumeration som tickar medan du tvekar.
          </p>
          <a className="lde-cta" href="/sign-up">
            Skapa konto
          </a>
        </section>

        <hr className="lde-rule" />
        <FootColophon />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   E2 · "Kursplanen" — the landing is the course's front matter
   ══════════════════════════════════════════════════════════════════ */

const TOC_VERBAL: { code: string; what: string; count: string }[] = [
  { code: 'ORD', what: 'Ordkunskap', count: '40 frågor' },
  { code: 'LÄS', what: 'Svensk läsförståelse', count: '20 frågor' },
  { code: 'MEK', what: 'Meningskomplettering', count: '20 frågor' },
  { code: 'ELF', what: 'Engelsk läsförståelse', count: '20 frågor' },
]

const TOC_QUANT: { code: string; what: string; count: string }[] = [
  { code: 'XYZ', what: 'Matematisk problemlösning', count: '12 frågor' },
  { code: 'KVA', what: 'Kvantitativa jämförelser', count: '12 frågor' },
  { code: 'NOG', what: 'Kvantitativa resonemang', count: '12 frågor' },
  { code: 'DTK', what: 'Diagram, tabeller och kartor', count: '12 frågor' },
]

const ARC_STEPS: { name: string; body: string }[] = [
  { name: 'Koncept', body: 'Varje moment börjar från noll. Algebra innan XYZ, rötter innan ORD.' },
  {
    name: 'Exempel',
    body: 'Genomarbetade lösningar som visar hur ett proffs tänker, steg för steg.',
  },
  { name: 'Drill', body: 'Riktiga provfrågor, en i taget, med förklaring på varje alternativ.' },
  {
    name: 'Repetition',
    body: 'Det du höll på att glömma kommer tillbaka — lagom ofta, aldrig som straff.',
  },
  {
    name: 'Prov',
    body: 'Provpass på tid, under riktiga förhållanden. Där syns om strukturen sitter.',
  },
]

export function LAND_E2() {
  const rm = useReducedMotion() === true
  const go = useMountGo(rm)
  // Signature beat: the table of contents prints row by row at a
  // counting cadence after the title has set. Opacity only.
  const printRow = (i: number) => ({
    initial: rm ? false : { opacity: 0 },
    animate: { opacity: go ? 1 : 0 },
    transition: rm
      ? { duration: 0 }
      : {
          duration: 0.35,
          delay: 0.5 + i * 0.09,
          ease: [...EASE.reading] as [number, number, number, number],
        },
  })

  let rowIndex = 0

  return (
    <div className="lde-page">
      <LdeStyle />
      <div className="lde-col">
        <TopBar />

        {/* title page */}
        <header className="lde2-title-page">
          <motion.p
            className="lde-eyebrow"
            initial={rm ? false : { opacity: 0 }}
            animate={{ opacity: go ? 1 : 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.5, ease: [...EASE.reading] }}
          >
            Kursplan · Högskoleprovet
          </motion.p>
          <motion.h1
            className="lde-display lde2-title"
            initial={rm ? false : { opacity: 0 }}
            animate={{ opacity: go ? 1 : 0 }}
            transition={
              rm ? { duration: 0 } : { duration: 0.6, delay: 0.15, ease: [...EASE.reading] }
            }
          >
            Hela provet, från första roten till sista diagrammet.
          </motion.h1>
          <motion.div
            initial={rm ? false : { opacity: 0 }}
            animate={{ opacity: go ? 1 : 0 }}
            transition={
              rm ? { duration: 0 } : { duration: 0.6, delay: 0.35, ease: [...EASE.reading] }
            }
          >
            <p className="lde-body" style={{ margin: '0 0 26px' }}>
              En kurs som antar att du kan ingenting och siktar på 2,0. Ingen väntar sig att du
              redan hänger med — det är hela idén.
            </p>
            <a className="lde-cta" href="/sign-up">
              Skapa konto
            </a>
            <p className="lde-cta-hint">X kr · engångsköp, gäller till provdagen</p>
          </motion.div>
        </header>

        {/* table of contents = the exam's anatomy */}
        <section className="lde-section" aria-labelledby="e2-toc">
          <span className="lde-eyebrow">Innehåll</span>
          <h2 id="e2-toc" className="lde-h2">
            Åtta delprov. Åtta kapitel.
          </h2>
          <p className="lde-body" style={{ margin: '0 0 10px' }}>
            Kursens innehållsförteckning är provets anatomi. Varje kapitel har sitt ramverk, sina
            fällor och sin drill.
          </p>
          <div className="lde2-half-rule">Verbal del</div>
          {TOC_VERBAL.map((row, i) => (
            <motion.div className="lde2-toc-row" key={row.code} {...printRow(rowIndex++)}>
              <span className="no">{i + 1}</span>
              <span className="code">{row.code}</span>
              <span className="what">{row.what}</span>
              <span className="leader" aria-hidden />
              <span className="count">{row.count}</span>
            </motion.div>
          ))}
          <div className="lde2-half-rule">Kvantitativ del</div>
          {TOC_QUANT.map((row, i) => (
            <motion.div className="lde2-toc-row" key={row.code} {...printRow(rowIndex++)}>
              <span className="no">{i + 5}</span>
              <span className="code">{row.code}</span>
              <span className="what">{row.what}</span>
              <span className="leader" aria-hidden />
              <span className="count">{row.count}</span>
            </motion.div>
          ))}
          <p className="lde-note">
            per provtillfälle: 160 frågor på ca 4 timmar. inga minuspoäng — strukturen avgör, inte
            turen.
          </p>
        </section>

        {/* the reading arc */}
        <section className="lde-section" aria-labelledby="e2-arc">
          <span className="lde-eyebrow">Så läser du kursen</span>
          <h2 id="e2-arc" className="lde-h2">
            Samma båge i varje kapitel.
          </h2>
          {ARC_STEPS.map((step, i) => (
            <div className="lde2-arc-step" key={step.name}>
              <span className="no">{i + 1}</span>
              <p className="body">
                <b>{step.name}.</b> {step.body}
              </p>
            </div>
          ))}
          <p className="lde-note">
            och mellan kapitlen: systemet väljer nästa uppgift åt dig. en knapp, inget velande.
            byggd för ADHD — en sak i taget, ingen streak, ingen skam.
          </p>
        </section>

        {/* interactive taste */}
        <section className="lde-section" aria-labelledby="e2-prova">
          <span className="lde-eyebrow">Ur kursen</span>
          <h2 id="e2-prova" className="lde-h2">
            Prova två uppgifter.
          </h2>
          <TasteQuestionCard q={Q_ORD} />
          <TasteQuestionCard q={Q_NOG} />
          <p className="lde-disclaim">{TASTE_DISCLAIMER}</p>
        </section>

        {/* terms as a ledger — the back cover */}
        <section className="lde-section" aria-labelledby="e2-villkor" style={{ borderBottom: 0 }}>
          <span className="lde-eyebrow">Baksidan</span>
          <h2 id="e2-villkor" className="lde-h2">
            Villkor, i klartext.
          </h2>
          <dl className="lde-ledger">
            <div className="lde-ledger-row">
              <dt>Pris</dt>
              <dd>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
                  <span style={{ color: 'var(--accent)' }}>X</span> kr
                </span>{' '}
                — engångsköp, gäller till din provdag. Priset sätts före öppningen. Jämför: anmälan
                till provet kostar 550 kr.
              </dd>
            </div>
            <div className="lde-ledger-row">
              <dt>Löfte</dt>
              <dd>
                Inget resultatlöfte. Det här är ett träningsverktyg — övar du, mäter vi och
                anpassar. Provet skriver du.
              </dd>
            </div>
            <div className="lde-ledger-row">
              <dt>Passar inte</dt>
              <dd>
                Den som redan ligger på 1,5+ och bara vill repetera. Kursen börjar från noll och tar
                månader, inte veckor.
              </dd>
            </div>
            <div className="lde-ledger-row">
              <dt>Ansvarig</dt>
              <dd>HP-Coach drivs av [namn], orgnr [—].</dd>
            </div>
          </dl>
          <div style={{ marginTop: 30 }}>
            <a className="lde-cta" href="/sign-up">
              Skapa konto
            </a>
          </div>
        </section>

        <hr className="lde-rule" />
        <FootColophon />
      </div>
    </div>
  )
}
