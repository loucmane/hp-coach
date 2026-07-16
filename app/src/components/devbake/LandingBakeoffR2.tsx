// LandingBakeoffR2 — landing-page bake-off ROUND 2 (polish-and-seduce).
//
// Owner verdict on round 1: build on the product-demo lens (P1 "Första
// frågan", P2 "Uppslaget"); the editorial lens lost. The "Vad vi inte
// lovar" honesty section is CUT — trust is carried by the page's plain
// factual tone and the villkor/price block. Round 2 keeps each thesis
// and raises the execution to the shipped motion system's bar:
//
//   LAND_P1V2 "Första frågan" — the ambush, perfected. The hero is an
//       answerable ORD question that SETS LIKE INK in one orchestrated
//       state-driven beat (useMountGo — mount animations are suppressed
//       under RouteScene, so the beat is driven off state, Arket-lawful:
//       opacity + a letter-spacing settle, zero travel). A quiet
//       conversion link appears the moment the first answer is graded.
//
//   LAND_P2V2 "Uppslaget" — the session facsimile, perfected. Masthead
//       rule draws, thesis settles, and the UTFALL ledger books ✓/✗
//       marks keyed to QUESTION order (placeholder slots until each is
//       answered), each mark seating with a veck-register spring. When
//       both are answered the ledger row earns its own CTA.
//
// LEGAL: every demo question is ORIGINAL, written for HP-Coach in
// authentic HP style. Nothing comes from data/ (© UHR); each question
// is labeled as an example on the page itself.
//
// CTA SYSTEM (round 2.1, owner verdict "there needs to be more CTAs"):
// one action — "Skapa konto" → /sign-up — repeated at four stations per
// concept, never competing actions, no urgency theater:
//   1. EARLY: a quiet inline CTA inside the hero (reachable in the
//      first ~1.2 viewports at 390px WITHOUT answering anything).
//   2. EARNED: the round-2 mid-page moments stay (P1v2 post-verdict
//      note, P2v2 completed ledger).
//   3. STICKY: a slim fixed bar (phone: full-width bottom; ≥900px:
//      bottom-right corner pill — see notes) that inks in once the
//      hero has scrolled away and lifts off when the final CTA block
//      enters the viewport — never two CTAs stacked on screen.
//   4. FINAL: the price block carries the button (unchanged).
//
// Self-contained: no auth, no router, no app stores. CTA is a plain
// <a href="/sign-up">. DESIGN artifact — consumed by /dev/landing-bakeoff.

import { motion } from 'motion/react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'

import { DUR, EASE, useArketMotion, useMountGo } from '@/lib/motion'

/* ── demo content — ORIGINAL questions in HP style (not from any exam) ── */

export type DemoQ = {
  id: string
  section: string
  kicker: string
  headword?: string
  prompt?: string
  options: { key: string; text: string }[]
  correct: string
  why: string
}

const Q_ORD: DemoQ = {
  id: 'ord-1',
  section: 'ORD',
  kicker: 'Vilket ord betyder ungefär detsamma?',
  headword: 'vedermöda',
  options: [
    { key: 'a', text: 'prövning' },
    { key: 'b', text: 'belöning' },
    { key: 'c', text: 'försummelse' },
    { key: 'd', text: 'eftergift' },
    { key: 'e', text: 'förmaning' },
  ],
  correct: 'a',
  why: 'En vedermöda är en svår prövning — ordet möda med det förstärkande förledet veder-. Rätt svar är a) prövning.',
}

const Q_MEK: DemoQ = {
  id: 'mek-1',
  section: 'MEK',
  kicker: 'Vilket alternativ passar bäst in i meningen?',
  prompt:
    'Utredningen fick hård kritik: slutsatserna vilade på ett ____ underlag och gick längre än vad materialet ____.',
  options: [
    { key: 'a', text: 'bristfälligt – medgav' },
    { key: 'b', text: 'uttömmande – antydde' },
    { key: 'c', text: 'gediget – krävde' },
    { key: 'd', text: 'opartiskt – förutsatte' },
  ],
  correct: 'a',
  why: 'Den hårda kritiken kräver ett negativt laddat första led — bristfälligt — och ett verb som anger gräns: vad materialet medgav.',
}

export const Q_KVA: DemoQ = {
  id: 'kva-1',
  section: 'KVA',
  kicker: 'Vilken kvantitet är störst?',
  prompt: 'Kvantitet I:  2/3 av 96\nKvantitet II:  3/4 av 88',
  options: [
    { key: 'a', text: 'I är större än II' },
    { key: 'b', text: 'II är större än I' },
    { key: 'c', text: 'I är lika med II' },
    { key: 'd', text: 'informationen är otillräcklig' },
  ],
  correct: 'b',
  why: 'I = 64 och II = 66. Lita aldrig på känslan när talen ligger nära — andelar av olika tal är en klassisk fälla.',
}

/* ── shared copy (Swedish product strings — see .notes.md for the
 *    native-quality pass log) ─────────────────────────────────────────── */

export const COPY = {
  brand: 'HP-Coach',
  domain: 'hp-coach.se',
  tagline: 'inför högskoleprovet',
  claims: {
    zero: {
      label: 'Börjar från noll',
      text: 'Kursen förutsätter inga förkunskaper. Ordrötter före ordlistor, mönster före formler — allt byggs från grunden.',
    },
    target: {
      label: 'Siktet är 2.0',
      text: 'Appen mäter varje delprov för sig och visar exakt var nästa tiondel finns. Du övar alltid på det som lyfter poängen mest.',
    },
    adhd: {
      label: 'En sak i taget',
      text: 'Appen väljer nästa uppgift åt dig. Ett pass tar tio minuter, och det är alltid tydligt var du ska börja.',
    },
    loop: {
      label: 'Felen är läroplanen',
      text: 'Varje fel matchas mot en känd fälla och läggs i din repetitionskö. Du övar på rätt saker — inte på måfå.',
    },
  },
  revealLabel: 'Det där var appen',
  reveal:
    'Ingen video, inga skärmdumpar. Frågan du just svarade på är byggd av samma delar som övningsvyn — det du nyss kände är det du köper.',
  human: 'HP-Coach drivs av [namn] · org.nr [—]',
  priceX: 'X kr',
  priceTerms: 'engångsköp · gäller till provdagen',
  priceFolio: 'priset sätts före lansering',
  priceAnchor:
    'Anmälan till provet kostar 550 kr. Förberedelsen ska vara ett köp — inte en prenumeration.',
  cta: 'Skapa konto',
  ctaSub: 'Konto → betalning → första passet. Inga val på vägen.',
  exampleTag: 'Exempeluppgift skriven för HP-Coach — inte hämtad från något prov.',
}

/* ── Ink — a state-driven opacity beat (Arket-lawful: zero travel).
 *    Driven off `go` (useMountGo), so it plays even under RouteScene's
 *    mount suppression, and collapses to the final state under reduced
 *    motion (go starts true). ─────────────────────────────────────────── */

export function Ink({
  go,
  delay = 0,
  children,
  style,
  className,
}: {
  go: boolean
  delay?: number
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  const m = useArketMotion()
  return (
    <motion.div
      className={className}
      style={style}
      initial={false}
      animate={{ opacity: go ? 1 : 0 }}
      transition={m.rm ? { duration: 0 } : { duration: 0.28, ease: [...EASE.reading], delay }}
    >
      {children}
    </motion.div>
  )
}

/* ── the live demo question — real .hpc-m3-* verdict treatment ────────── */

export function DemoQuestion({ q, onGraded }: { q: DemoQ; onGraded?: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null)
  const graded = picked !== null
  const correct = picked === q.correct

  const pick = (key: string) => {
    if (graded) return
    setPicked(key)
    onGraded?.(key === q.correct)
  }

  return (
    <div>
      {q.headword ? (
        <>
          <div className="hpc-m3-eyebrow">{q.kicker}</div>
          <h2 className="hpc-m3-display" style={{ fontSize: 'clamp(40px, 10vw, 56px)' }}>
            {q.headword}
          </h2>
        </>
      ) : (
        <>
          <div className="hpc-m3-eyebrow">{q.kicker}</div>
          <p className="hpc-m3-q" style={{ marginTop: 10, whiteSpace: 'pre-line' }}>
            {q.prompt}
          </p>
        </>
      )}

      <div className="hpc-m3-opts" style={{ marginTop: 18 }}>
        {q.options.map((opt) => {
          const isPick = picked === opt.key
          const isRight = graded && opt.key === q.correct
          const isWrongPick = graded && isPick && !isRight
          const dim = graded && !isRight && !isPick
          const cls = [
            'hpc-m3-opt',
            isRight && 'is-ok',
            isWrongPick && 'is-bad',
            dim && 'is-dim',
            isPick && 'is-picked',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={opt.key}
              type="button"
              className={cls}
              disabled={graded}
              onClick={() => pick(opt.key)}
            >
              <span className="hpc-m3-ind" />
              <span className="hpc-m3-opt-k">{opt.key})</span>
              <span className="hpc-m3-opt-t">{opt.text}</span>
              <span className="hpc-m3-opt-v">
                {isRight ? 'Rätt svar' : isWrongPick ? 'Ditt svar' : ''}
              </span>
            </button>
          )
        })}
      </div>

      <div aria-live="polite">
        {graded && (
          <div className="hpc-m3-verdict" style={{ marginTop: 18 }}>
            <span className={`hpc-m3-verdict-word ${correct ? 'is-ok' : 'is-bad'}`}>
              {correct ? 'Rätt.' : 'Fel.'}
            </span>
            <p className="hpc-m3-verdict-sub">{q.why}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── explanation specimen — the app's pedagogy, real shape ────────────── */

function ExplanationSpecimen() {
  return (
    <div>
      <p className="hpc-m3-solution">
        Vedermöda = veder- (förstärkande, jfr vedergällning) + möda. Ordet bär alltid tyngd: en
        vedermöda uthärdas, den uppskattas inte.
      </p>
      <div className="hpc-m3-dis">
        <div className="hpc-m3-dis-h">
          <span className="hpc-m3-dis-k">b)</span>
          <s>belöning</s>
        </div>
        <div className="hpc-m3-dis-l">Varför den lockar</div>
        <p className="hpc-m3-dis-p">
          Vedergällning kan betyda belöning — och skiljer sig bara i förledet. Fällan är att svara
          på ett ord som liknar uppslagsordet i stället för på ordet självt. Appen taggar felet som
          förledsförväxling och lägger det i din repetitionskö.
        </p>
      </div>
    </div>
  )
}

/* ── shared closing blocks — villkor/pris + CTA (trust lives here) ────── */

export function PriceBlock() {
  return (
    <div>
      <div className="lr2-price-row">
        <span className="lr2-price-x">
          <span className="lr2-price-slot">{COPY.priceX}</span>
        </span>
        <span className="lr2-price-terms">{COPY.priceTerms}</span>
      </div>
      <p className="lr2-folio" style={{ marginTop: 8 }}>
        {COPY.priceFolio}
      </p>
      <p className="lr2-body" style={{ marginTop: 12 }}>
        {COPY.priceAnchor}
      </p>
    </div>
  )
}

export function Cta({ sub }: { sub?: string }) {
  return (
    <div style={{ marginTop: 20 }}>
      <a className="hpc-m3-cta hpc-btn lr2-cta" href="/sign-up">
        {COPY.cta}
      </a>
      {sub && (
        <p className="lr2-folio" style={{ marginTop: 12 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

/** The quiet conversion link — appears mid-page once the reader has
 *  already felt the product. Text-level, never competes with the beat. */
export function QuietCta() {
  return (
    <a className="lr2-quiet-cta" href="/sign-up">
      {COPY.cta} <span aria-hidden>→</span>
    </a>
  )
}

/* ── sticky CTA — the always-reachable door ────────────────────────────
 *    Visible only in the dead zone between the hero (once it has fully
 *    scrolled away) and the final CTA block (hides the moment that block
 *    enters the viewport — never two CTAs on screen). Phone: a slim
 *    full-width bottom bar. ≥900px: the same object shrunk to a bottom-
 *    right corner pill (see .notes.md for the reasoning). Arket-lawful:
 *    opacity + a small y settle, tokens from lib/motion; reduced motion
 *    collapses to instant. ─────────────────────────────────────────── */

export function useStickyCta() {
  const heroRef = useRef<HTMLElement>(null)
  const endRef = useRef<HTMLElement>(null)
  const [heroGone, setHeroGone] = useState(false)
  const [endNear, setEndNear] = useState(false)

  useEffect(() => {
    const hero = heroRef.current
    const end = endRef.current
    if (!hero || !end || typeof IntersectionObserver === 'undefined') return
    const heroObs = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting))
    const endObs = new IntersectionObserver(([e]) => setEndNear(e.isIntersecting))
    heroObs.observe(hero)
    endObs.observe(end)
    return () => {
      heroObs.disconnect()
      endObs.disconnect()
    }
  }, [])

  return { heroRef, endRef, visible: heroGone && !endNear }
}

export function StickyCta({ visible }: { visible: boolean }) {
  const m = useArketMotion()
  return (
    <motion.div
      className="lr2-sticky"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 14 }}
      transition={m.rm ? { duration: 0 } : { duration: DUR.chrome, ease: [...EASE.reading] }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
      aria-hidden={!visible}
    >
      <a className="lr2-sticky-link" href="/sign-up" tabIndex={visible ? 0 : -1}>
        <span className="lr2-sticky-cta">
          {COPY.cta} <span aria-hidden>→</span>
        </span>
        <span className="lr2-sticky-price">{COPY.priceX} · engångsköp</span>
      </a>
    </motion.div>
  )
}

/* ── landing-local styles (layout only; color/type from live tokens) ──── */

export const LR2_CSS = `
.lr2-root {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  letter-spacing: var(--font-ui-track);
  font-size: 15px;
  line-height: 1.55;
  min-height: 100vh;
}
.lr2-col {
  max-width: 680px;
  margin: 0 auto;
  padding: 26px 20px 96px;
}
.lr2-body {
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink-2);
  margin: 6px 0 0;
  max-width: 58ch;
}
.lr2-folio {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.lr2-human {
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin: 0;
}
.lr2-note {
  border-left: 2px solid var(--accent);
  padding: 2px 0 2px 14px;
  margin: 0;
}
.lr2-note-l {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}
.lr2-note-t {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  line-height: 1.5;
  color: var(--ink-2);
  margin: 4px 0 0;
  max-width: 50ch;
}
.lr2-price-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}
.lr2-price-x {
  font-family: var(--font-mono);
  font-size: 36px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.lr2-price-slot {
  display: inline-block;
  border-bottom: 2px dashed var(--hairline);
  padding: 0 4px 2px;
}
.lr2-price-terms {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.lr2-cta {
  display: inline-block;
  font-size: 15px;
  padding: 14px 30px;
}
.lr2-quiet-cta {
  display: inline-block;
  margin-top: 14px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.06em;
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color var(--dur-chrome) var(--ease-reading);
}
.lr2-quiet-cta:hover { border-bottom-color: var(--accent); }
.lr2-quiet-cta:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
.lr2-sep {
  height: 1px;
  background: var(--hairline);
  border: 0;
  margin: 46px 0;
}
.lr2-brandline {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.lr2-brand {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.lr2-p1-hero { padding-top: 30px; }
.lr2-p2-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 20px;
  flex-wrap: wrap;
  padding-bottom: 12px;
}
.lr2-p2-rule {
  height: 1px;
  background: var(--ink);
}
.lr2-p2-thesis {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(31px, 8vw, 48px);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 28px 0 0;
  max-width: 17ch;
}
.lr2-ledger {
  font-family: var(--font-mono);
  font-size: 14px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  display: flex;
  gap: 12px;
  align-items: baseline;
  flex-wrap: wrap;
  font-variant-numeric: tabular-nums;
}
.lr2-ledger .ok, .lr2-ledger .bad, .lr2-ledger .slot {
  font-size: 19px;
  line-height: 1;
}
.lr2-ledger .ok { color: var(--ok); }
.lr2-ledger .bad { color: var(--bad); }
.lr2-ledger .slot { color: var(--muted); }
.lr2-sticky {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  background: var(--bg);
  border-top: 1px solid var(--hairline);
}
.lr2-sticky-link {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  max-width: 680px;
  margin: 0 auto;
  padding: 13px 20px calc(13px + env(safe-area-inset-bottom, 0px));
  text-decoration: none;
  white-space: nowrap;
}
.lr2-sticky-cta {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--accent);
}
.lr2-sticky-price {
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.lr2-sticky-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
@media (min-width: 900px) {
  .lr2-col { max-width: 720px; padding: 48px 24px 120px; }
  .lr2-p1-hero { padding-top: 52px; }
  .lr2-sticky {
    left: auto;
    right: 24px;
    bottom: 22px;
    border: 1px solid var(--hairline);
    border-radius: 999px;
  }
  .lr2-sticky-link { max-width: none; padding: 9px 18px; gap: 14px; }
}
`

/* ════════════════════════════════════════════════════════════════════════
 * LAND_P1V2 — "Första frågan" (the ambush, perfected)
 * ════════════════════════════════════════════════════════════════════════ */

export function LAND_P1V2() {
  const m = useArketMotion()
  const go = useMountGo(m.rm)
  const [q1Done, setQ1Done] = useState(false)
  const sticky = useStickyCta()

  return (
    <div className="lr2-root">
      <style>{LR2_CSS}</style>
      <div className="lr2-col">
        {/* whispered brand folio — the page's only chrome before the question */}
        <Ink go={go} delay={0}>
          <div className="lr2-brandline">
            <span className="lr2-folio">{COPY.domain}</span>
            <span className="lr2-folio">{COPY.tagline}</span>
          </div>
        </Ink>

        {/* HERO = an answerable question, setting like ink in one beat:
            eyebrow → headword (typographic settle) → options → tag. */}
        <section className="lr2-p1-hero" aria-label="Prova en uppgift" ref={sticky.heroRef}>
          <Ink go={go} delay={0.1}>
            <div className="hpc-m3-eyebrow">{Q_ORD.kicker}</div>
          </Ink>
          <motion.h1
            className="hpc-m3-display"
            style={{ fontSize: 'clamp(44px, 12vw, 64px)', animation: 'none', margin: '10px 0 0' }}
            initial={false}
            animate={{ opacity: go ? 1 : 0, letterSpacing: go ? '-0.01em' : '0.02em' }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.52, ease: [...EASE.reading], delay: 0.16 }
            }
          >
            {Q_ORD.headword}
          </motion.h1>
          <Ink go={go} delay={0.34}>
            <OptionsOnly q={Q_ORD} onGraded={() => setQ1Done(true)} />
          </Ink>
          <Ink go={go} delay={0.5}>
            <p className="lr2-folio" style={{ marginTop: 16 }}>
              {COPY.exampleTag}
            </p>
            {/* early door — conversion is not conditional on playing */}
            <QuietCta />
          </Ink>
        </section>

        {/* the reveal: only after ink is on the page does the product speak. */}
        {q1Done && (
          <div className="reveal">
            <hr className="lr2-sep" />
            <div className="lr2-note">
              <div className="lr2-note-l">{COPY.revealLabel}</div>
              <p className="lr2-note-t">{COPY.reveal}</p>
              <QuietCta />
            </div>
          </div>
        )}

        <hr className="lr2-sep" />

        <div className="lr2-note">
          <div className="lr2-note-l">{COPY.claims.zero.label}</div>
          <p className="lr2-note-t">{COPY.claims.zero.text}</p>
        </div>

        <section style={{ marginTop: 46 }} aria-label="Prova en uppgift till">
          <p className="lr2-folio" style={{ marginBottom: 16 }}>
            MEK · {COPY.exampleTag}
          </p>
          <DemoQuestion q={Q_MEK} />
        </section>

        <hr className="lr2-sep" />

        <div className="lr2-note">
          <div className="lr2-note-l">{COPY.claims.target.label}</div>
          <p className="lr2-note-t">{COPY.claims.target.text}</p>
        </div>

        <section style={{ marginTop: 46 }} aria-label="Så förklarar appen">
          <h3 className="hpc-m3-h">Så förklarar appen ett fel</h3>
          <p className="lr2-folio" style={{ margin: '4px 0 0' }}>
            ur förklaringen till ordfrågan ovan
          </p>
          <ExplanationSpecimen />
        </section>

        <hr className="lr2-sep" />

        <div className="lr2-note">
          <div className="lr2-note-l">{COPY.claims.adhd.label}</div>
          <p className="lr2-note-t">{COPY.claims.adhd.text}</p>
        </div>
        <div className="lr2-note" style={{ marginTop: 28 }}>
          <div className="lr2-note-l">{COPY.claims.loop.label}</div>
          <p className="lr2-note-t">{COPY.claims.loop.text}</p>
        </div>

        <hr className="lr2-sep" />

        <section ref={sticky.endRef} aria-label="Pris och konto">
          <PriceBlock />
          <Cta sub={COPY.ctaSub} />
        </section>

        <hr className="lr2-sep" style={{ marginBottom: 20 }} />
        <div className="lr2-brandline">
          <span className="lr2-brand">{COPY.brand}</span>
          <span className="lr2-folio">coachning · struktur · 2.0</span>
        </div>
        <p className="lr2-human" style={{ marginTop: 10 }}>
          {COPY.human}
        </p>
      </div>
      <StickyCta visible={sticky.visible} />
    </div>
  )
}

/** P1v2 hero helper: the ORD question minus its own heading (the hero
 *  owns eyebrow + headword so the ink beat can orchestrate them). */
function OptionsOnly({ q, onGraded }: { q: DemoQ; onGraded?: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null)
  const graded = picked !== null
  const correct = picked === q.correct

  const pick = (key: string) => {
    if (graded) return
    setPicked(key)
    onGraded?.(key === q.correct)
  }

  return (
    <div>
      <div className="hpc-m3-opts" style={{ marginTop: 18 }}>
        {q.options.map((opt) => {
          const isPick = picked === opt.key
          const isRight = graded && opt.key === q.correct
          const isWrongPick = graded && isPick && !isRight
          const dim = graded && !isRight && !isPick
          const cls = [
            'hpc-m3-opt',
            isRight && 'is-ok',
            isWrongPick && 'is-bad',
            dim && 'is-dim',
            isPick && 'is-picked',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={opt.key}
              type="button"
              className={cls}
              disabled={graded}
              onClick={() => pick(opt.key)}
            >
              <span className="hpc-m3-ind" />
              <span className="hpc-m3-opt-k">{opt.key})</span>
              <span className="hpc-m3-opt-t">{opt.text}</span>
              <span className="hpc-m3-opt-v">
                {isRight ? 'Rätt svar' : isWrongPick ? 'Ditt svar' : ''}
              </span>
            </button>
          )
        })}
      </div>
      <div aria-live="polite">
        {graded && (
          <div className="hpc-m3-verdict" style={{ marginTop: 18 }}>
            <span className={`hpc-m3-verdict-word ${correct ? 'is-ok' : 'is-bad'}`}>
              {correct ? 'Rätt.' : 'Fel.'}
            </span>
            <p className="hpc-m3-verdict-sub">{q.why}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
 * LAND_P2V2 — "Uppslaget" (the session facsimile, perfected)
 * ════════════════════════════════════════════════════════════════════════ */

export function RailRow({
  label,
  sub,
  children,
}: {
  label: string
  sub?: string
  children: ReactNode
}) {
  return (
    <section className="hpc-m3-row hpc-m3-section" style={{ marginTop: 54 }}>
      <div className="hpc-m3-meta" style={{ animation: 'none' }}>
        <strong>{label}</strong>
        {sub}
      </div>
      <div className="hpc-m3-spine" />
      <div className="hpc-m3-content" style={{ animation: 'none' }}>
        {children}
      </div>
    </section>
  )
}

/** The session ledger: one slot per question in QUESTION order, marks
 *  seating with a veck-register spring as answers are booked. */
function Ledger({ tally }: { tally: Record<string, boolean> }) {
  const m = useArketMotion()
  const order = [Q_ORD, Q_KVA]
  const answered = order.filter((q) => q.id in tally)
  const okCount = answered.filter((q) => tally[q.id]).length
  const done = answered.length === order.length

  return (
    <div>
      <div className="lr2-ledger" role="status" aria-label="Sessionens resultat">
        {order.map((q) => {
          const has = q.id in tally
          const ok = tally[q.id]
          return has ? (
            <motion.span
              key={q.id}
              className={ok ? 'ok' : 'bad'}
              initial={{ opacity: 0, scale: 1.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={m.veck}
              style={{ display: 'inline-block' }}
            >
              {ok ? '✓' : '✗'}
            </motion.span>
          ) : (
            <span key={q.id} className="slot" aria-hidden>
              ·
            </span>
          )
        })}
        {answered.length === 0 ? (
          <span style={{ color: 'var(--muted)' }}>
            svara på uppgifterna ovan — resultatet bokförs här
          </span>
        ) : (
          <span>
            {okCount} av {answered.length} rätt · varje fel taggas mot en känd fälla
          </span>
        )}
      </div>
      {done && (
        <div className="reveal">
          <QuietCta />
        </div>
      )}
    </div>
  )
}

export function LAND_P2V2() {
  const m = useArketMotion()
  const go = useMountGo(m.rm)
  const [tally, setTally] = useState<Record<string, boolean>>({})
  const book = (id: string, ok: boolean) => setTally((t) => (id in t ? t : { ...t, [id]: ok }))
  const sticky = useStickyCta()

  return (
    <div className="lr2-root">
      <style>{LR2_CSS}</style>
      <div className="hpc-m3-frame" style={{ paddingTop: 28 }}>
        <section ref={sticky.heroRef} aria-label="HP-Coach — vad sidan är">
          <Ink go={go} delay={0}>
            <header className="lr2-p2-masthead">
              <span className="lr2-brand">{COPY.brand}</span>
              <span className="lr2-folio">
                {COPY.tagline} · {COPY.domain}
              </span>
            </header>
          </Ink>
          {/* the masthead rule draws left→right, then the thesis settles */}
          <motion.div
            className="lr2-p2-rule"
            style={{ transformOrigin: 'left center' }}
            initial={false}
            animate={{ scaleX: go ? 1 : 0 }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.34, ease: [...EASE.reading], delay: 0.08 }
            }
          />
          <motion.h1
            className="lr2-p2-thesis"
            initial={false}
            animate={{ opacity: go ? 1 : 0, letterSpacing: go ? '-0.015em' : '0.015em' }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.52, ease: [...EASE.reading], delay: 0.18 }
            }
          >
            Det här är inte en broschyr. Det är appen.
          </motion.h1>
          <Ink go={go} delay={0.36}>
            <p className="lr2-body" style={{ marginTop: 14, maxWidth: '50ch' }}>
              Uppslaget nedan är en riktig övningssession. Svara på uppgifterna, se hur appen rättar
              — och avgör själv.
            </p>
            {/* early door — conversion is not conditional on playing */}
            <QuietCta />
          </Ink>
        </section>

        <RailRow label="Uppgift 1" sub="ORD · exempel">
          <p className="lr2-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <DemoQuestion q={Q_ORD} onGraded={(ok) => book(Q_ORD.id, ok)} />
        </RailRow>

        <RailRow label="Marginal" sub="varför noll">
          <div className="lr2-note">
            <div className="lr2-note-l">{COPY.claims.zero.label}</div>
            <p className="lr2-note-t">{COPY.claims.zero.text}</p>
          </div>
        </RailRow>

        <RailRow label="Uppgift 2" sub="KVA · exempel">
          <p className="lr2-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <DemoQuestion q={Q_KVA} onGraded={(ok) => book(Q_KVA.id, ok)} />
        </RailRow>

        <RailRow label="Förklaring" sub="ur appen">
          <h3 className="hpc-m3-h" style={{ margin: 0 }}>
            Varje fel får en förklaring med namn
          </h3>
          <ExplanationSpecimen />
          <div className="lr2-note" style={{ marginTop: 24 }}>
            <div className="lr2-note-l">{COPY.claims.loop.label}</div>
            <p className="lr2-note-t">{COPY.claims.loop.text}</p>
          </div>
        </RailRow>

        <RailRow label="Utfall" sub="din session">
          <Ledger tally={tally} />
          <div className="lr2-note" style={{ marginTop: 26 }}>
            <div className="lr2-note-l">{COPY.claims.adhd.label}</div>
            <p className="lr2-note-t">{COPY.claims.adhd.text}</p>
          </div>
          <div className="lr2-note" style={{ marginTop: 24 }}>
            <div className="lr2-note-l">{COPY.claims.target.label}</div>
            <p className="lr2-note-t">{COPY.claims.target.text}</p>
          </div>
        </RailRow>

        <RailRow label="Pris" sub="villkor i klartext">
          <section ref={sticky.endRef} aria-label="Pris och konto">
            <PriceBlock />
            <Cta sub={COPY.ctaSub} />
          </section>
        </RailRow>

        <hr className="lr2-sep" style={{ marginBottom: 20 }} />
        <div className="lr2-brandline">
          <span className="lr2-folio">{COPY.brand} · byggd av en som själv skriver provet</span>
          <span className="lr2-folio">2.0</span>
        </div>
        <p className="lr2-human" style={{ marginTop: 10 }}>
          {COPY.human}
        </p>
      </div>
      <StickyCta visible={sticky.visible} />
    </div>
  )
}
