// LandingBakeoffP — landing-page bake-off, PRODUCT-DEMO lens (P2-2.1).
//
// The opposed thesis to the editorial lens: don't argue — demonstrate.
// The landing IS a taste of the app. Both concepts are phone-first
// (designed at 390px, then widened) and both reuse the LIVE .hpc-m3-*
// Boksidan classes from index.css, so the demo questions carry the
// real verdict treatment (indicator rail, strike, italic verdict word)
// — no fake screenshots dressier than reality.
//
//   LAND_P1 "Första frågan" — the AMBUSH. The page opens with an
//       answerable ORD question before any pitch; the brand is a
//       whispered folio line. Claims land as marginalia after ink is
//       on the page. One centered reading column.
//
//   LAND_P2 "Uppslaget"     — the SESSION FACSIMILE. The whole sales
//       page is typeset as one drill session on the M3 margin-rail
//       chassis (rail labels UPPGIFT / UTFALL / FÖRKLARING / VILLKOR /
//       PRIS), with a quant KVA beat and a session ledger. Brand-first
//       masthead.
//
// LEGAL: every demo question below is ORIGINAL, written for HP-Coach
// in authentic HP style. Nothing is copied from data/ (© UHR), and
// each question is labeled as an example on the page itself.
//
// Self-contained: no auth, no router, no app stores. CTA is a plain
// <a href="/sign-up">. DESIGN artifact — consumed by a /dev route the
// orchestrator stitches.

import { type ReactNode, useState } from 'react'

/* ── demo content — ORIGINAL questions in HP style (not from any exam) ── */

type DemoQ = {
  id: string
  section: string
  /** eyebrow line above the prompt */
  kicker: string
  /** big italic headword (ORD) — or undefined for sentence prompts */
  headword?: string
  prompt?: string
  options: { key: string; text: string }[]
  correct: string
  /** verdict-sub shown after grading */
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
  why: 'Vedermöda är en svår prövning eller vånda — möda med förstärkande förled. Rätt svar är a) prövning.',
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
  why: 'Kritiken kräver ett negativt laddat första led — bristfälligt — och ett verb som anger gräns: vad materialet medgav.',
}

const Q_KVA: DemoQ = {
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
  why: 'I = 64 och II = 66. Räkna aldrig “nästan lika” på känsla — bråkdelar av olika tal är en klassisk fälla.',
}

/* ── shared copy (Swedish product strings) ────────────────────────────── */

const COPY = {
  brand: 'HP-Coach',
  claimZero:
    'Kursen antar ingenting. Vi börjar vid noll — ordrötter före ordlistor, algebra före ekvationer.',
  claimTarget:
    'Byggd för 2.0. Systemet mäter varje moment för sig och tolererar inga svaga fläckar — det hittar dem åt dig.',
  claimAdhd:
    'En sak i taget. Appen väljer nästa uppgift, sessioner kan vara tio minuter, och missade dagar möts utan streak-skam.',
  claimLoop:
    'Varje fel klassificeras mot ett mönsterbibliotek av kända fällor. Du övar på dina misstag — inte på slumpen.',
  honestTitle: 'Ärlighetsklausul',
  honest:
    'HP-Coach lovar inga resultat och visar inga “garanterade poänglyft”. Det är ett träningsverktyg: strukturen är vår, poängen är din.',
  human: 'HP-Coach drivs av [namn] · org.nr [—]',
  priceX: 'X kr',
  priceTerms: 'engångsköp · gäller till provdagen',
  priceAnchor:
    'Själva provet kostar 550 kr per anmälan. Förberedelsen ska inte kosta en prenumeration.',
  cta: 'Skapa konto',
  exampleTag: 'Exempeluppgift skriven för HP-Coach — inte hämtad från något prov.',
}

/* ── the live demo question — real .hpc-m3-* verdict treatment ────────── */

function DemoQuestion({
  q,
  onGraded,
  railed,
}: {
  q: DemoQ
  onGraded?: (correct: boolean) => void
  /** true → rendered inside an M3 rail row (P2); affects nothing here,
   *  the chassis is owned by the caller. */
  railed?: boolean
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const graded = picked !== null
  const correct = picked === q.correct

  const pick = (key: string) => {
    if (graded) return
    setPicked(key)
    onGraded?.(key === q.correct)
  }

  return (
    <div data-railed={railed || undefined}>
      {q.headword ? (
        <>
          <div className="hpc-m3-eyebrow">{q.kicker}</div>
          <h2 className="hpc-m3-display" style={{ fontSize: 'clamp(40px, 9vw, 56px)' }}>
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

/* ── explanation specimen — the app's pedagogy, shown once, real shape ── */

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
          Vedergällning kan betyda belöning — och ligger ett förled bort. Fällan är att läsa rotens
          grannord i stället för ordet självt. Appen taggar felet mot mönstret “förledsförväxling”
          och lägger in det i din repetitionskö.
        </p>
      </div>
    </div>
  )
}

/* ── shared closing blocks — honesty, price, CTA ──────────────────────── */

function HonestBlock() {
  return (
    <div>
      <h3 className="hpc-m3-h">{COPY.honestTitle}</h3>
      <p className="lp-body">{COPY.honest}</p>
      <p className="lp-human">{COPY.human}</p>
    </div>
  )
}

function PriceBlock() {
  return (
    <div>
      <div className="lp-price-row">
        <span className="lp-price-x">
          <span className="lp-price-slot">{COPY.priceX}</span>
        </span>
        <span className="lp-price-terms">{COPY.priceTerms}</span>
      </div>
      <p className="lp-folio" style={{ marginTop: 8 }}>
        priset sätts före lansering — det blir ett tal, inte en trappa
      </p>
      <p className="lp-body" style={{ marginTop: 10 }}>
        {COPY.priceAnchor}
      </p>
    </div>
  )
}

function Cta({ sub }: { sub?: string }) {
  return (
    <div style={{ marginTop: 18 }}>
      <a className="hpc-m3-cta hpc-btn lp-cta" href="/sign-up">
        {COPY.cta}
      </a>
      {sub && (
        <p className="lp-folio" style={{ marginTop: 12 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

/* ── landing-local styles (layout only; all color/type from tokens) ───── */

const LP_CSS = `
.lp-root {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  letter-spacing: var(--font-ui-track);
  font-size: 15px;
  line-height: 1.55;
  min-height: 100vh;
}
.lp-col {
  max-width: 680px;
  margin: 0 auto;
  padding: 28px 20px 96px;
}
.lp-body {
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink-2);
  margin: 6px 0 0;
  max-width: 60ch;
}
.lp-folio {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.lp-human {
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin: 14px 0 0;
}
.lp-note {
  border-left: 2px solid var(--accent);
  padding: 2px 0 2px 14px;
  margin: 0;
}
.lp-note-l {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}
.lp-note-t {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 16.5px;
  line-height: 1.5;
  color: var(--ink-2);
  margin: 4px 0 0;
  max-width: 52ch;
}
.lp-price-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}
.lp-price-x {
  font-family: var(--font-mono);
  font-size: 34px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.lp-price-slot {
  display: inline-block;
  border-bottom: 2px dashed var(--hairline);
  padding: 0 4px 2px;
}
.lp-price-terms {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.lp-cta {
  display: inline-block;
  font-size: 15px;
  padding: 14px 28px;
}
.lp-sep {
  height: 1px;
  background: var(--hairline);
  border: 0;
  margin: 44px 0;
}
.lp-brandline {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.lp-brand {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -0.01em;
  color: var(--ink);
}
/* P1: reserve verdict room so grading doesn't shove the page (calm-between-interactions) */
.lp-p1-hero { padding-top: 26px; }
/* P2 rail chassis inherits .hpc-m3-row (128px | 1px | 1fr, linearizes <600px via index.css) */
.lp-p2-masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 20px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--ink);
  padding-bottom: 12px;
}
.lp-p2-thesis {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(30px, 7vw, 46px);
  line-height: 1.12;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 26px 0 0;
  max-width: 18ch;
}
.lp-ledger {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  display: flex;
  gap: 10px;
  align-items: baseline;
  flex-wrap: wrap;
  font-variant-numeric: tabular-nums;
}
.lp-ledger .ok { color: var(--ok); }
.lp-ledger .bad { color: var(--bad); }
@media (min-width: 900px) {
  .lp-col { max-width: 720px; padding: 48px 24px 120px; }
  .lp-p1-hero { padding-top: 48px; }
}
`

/* ════════════════════════════════════════════════════════════════════════
 * LAND_P1 — "Första frågan" (the ambush)
 * ════════════════════════════════════════════════════════════════════════ */

export function LAND_P1() {
  const [q1Done, setQ1Done] = useState(false)

  return (
    <div className="lp-root">
      <style>{LP_CSS}</style>
      <div className="lp-col">
        {/* whispered brand folio — the page's only chrome before the question */}
        <div className="lp-brandline">
          <span className="lp-folio">hp-coach.se</span>
          <span className="lp-folio">inför högskoleprovet</span>
        </div>

        {/* HERO = an answerable question. No pitch above the fold. */}
        <section className="lp-p1-hero" aria-label="Prova en uppgift">
          <p className="lp-folio" style={{ marginBottom: 18 }}>
            ORD · {COPY.exampleTag}
          </p>
          <DemoQuestion q={Q_ORD} onGraded={() => setQ1Done(true)} />
        </section>

        {/* the reveal: only after ink is on the page does the product speak.
            Rendered on grade (not opacity-hidden) — the verdict itself already
            grows the page, so reserving this space bought no stability, only
            a dead hole in the hero. */}
        {q1Done && (
          <div className="reveal">
            <hr className="lp-sep" />
            <div className="lp-note">
              <div className="lp-note-l">Det där var appen</div>
              <p className="lp-note-t">
                Ingen video, inga skärmdumpar. Sidan du läser är byggd av samma delar som övningsvyn
                — det du kände nyss är det du köper.
              </p>
            </div>
          </div>
        )}

        <hr className="lp-sep" />

        <div className="lp-note">
          <div className="lp-note-l">Antar ingenting</div>
          <p className="lp-note-t">{COPY.claimZero}</p>
        </div>

        <section style={{ marginTop: 44 }} aria-label="Prova en uppgift till">
          <p className="lp-folio" style={{ marginBottom: 18 }}>
            MEK · {COPY.exampleTag}
          </p>
          <DemoQuestion q={Q_MEK} />
        </section>

        <hr className="lp-sep" />

        <div className="lp-note">
          <div className="lp-note-l">Målet är 2.0</div>
          <p className="lp-note-t">{COPY.claimTarget}</p>
        </div>

        <section style={{ marginTop: 44 }} aria-label="Så förklarar appen">
          <h3 className="hpc-m3-h">Så förklarar appen ett fel</h3>
          <p className="lp-folio" style={{ margin: '4px 0 0' }}>
            ur förklaringen till uppgiften ovan
          </p>
          <ExplanationSpecimen />
        </section>

        <hr className="lp-sep" />

        <div className="lp-note">
          <div className="lp-note-l">Byggd för ADHD</div>
          <p className="lp-note-t">{COPY.claimAdhd}</p>
        </div>
        <div className="lp-note" style={{ marginTop: 28 }}>
          <div className="lp-note-l">Felen är läroplanen</div>
          <p className="lp-note-t">{COPY.claimLoop}</p>
        </div>

        <hr className="lp-sep" />

        <HonestBlock />

        <hr className="lp-sep" />

        <PriceBlock />
        <Cta sub="Konto → betalning → första passet. Inga val på vägen." />

        <hr className="lp-sep" style={{ marginBottom: 20 }} />
        <div className="lp-brandline">
          <span className="lp-brand">{COPY.brand}</span>
          <span className="lp-folio">coachning · struktur · 2.0</span>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
 * LAND_P2 — "Uppslaget" (the session facsimile on the margin rail)
 * ════════════════════════════════════════════════════════════════════════ */

function RailRow({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  return (
    <section className="hpc-m3-row hpc-m3-section" style={{ marginTop: 52 }}>
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

export function LAND_P2() {
  const [tally, setTally] = useState<{ id: string; ok: boolean }[]>([])
  const book = (id: string, ok: boolean) =>
    setTally((t) => (t.some((e) => e.id === id) ? t : [...t, { id, ok }]))

  return (
    <div className="lp-root">
      <style>{LP_CSS}</style>
      <div className="hpc-m3-frame" style={{ paddingTop: 28 }}>
        <header className="lp-p2-masthead">
          <span className="lp-brand">{COPY.brand}</span>
          <span className="lp-folio">inför högskoleprovet · hp-coach.se</span>
        </header>

        <h1 className="lp-p2-thesis">Det här är inte en broschyr. Det är appen.</h1>
        <p className="lp-body" style={{ marginTop: 14, maxWidth: '52ch' }}>
          Nedan är en övningssession, uppslagen som en boksida. Uppgifterna går att svara på.
          Marginalen säljer; sidan bevisar.
        </p>

        <RailRow label="Uppgift 1" sub="ORD · exempel">
          <p className="lp-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <DemoQuestion railed q={Q_ORD} onGraded={(ok) => book(Q_ORD.id, ok)} />
        </RailRow>

        <RailRow label="Marginal" sub="varför noll">
          <div className="lp-note">
            <div className="lp-note-l">Antar ingenting</div>
            <p className="lp-note-t">{COPY.claimZero}</p>
          </div>
        </RailRow>

        <RailRow label="Uppgift 2" sub="KVA · exempel">
          <p className="lp-folio" style={{ marginBottom: 14 }}>
            {COPY.exampleTag}
          </p>
          <DemoQuestion railed q={Q_KVA} onGraded={(ok) => book(Q_KVA.id, ok)} />
        </RailRow>

        <RailRow label="Förklaring" sub="ur appen">
          <h3 className="hpc-m3-h" style={{ margin: 0 }}>
            Varje fel får en förklaring med namn
          </h3>
          <ExplanationSpecimen />
          <div className="lp-note" style={{ marginTop: 24 }}>
            <div className="lp-note-l">Felen är läroplanen</div>
            <p className="lp-note-t">{COPY.claimLoop}</p>
          </div>
        </RailRow>

        <RailRow label="Utfall" sub="din session">
          <div className="lp-ledger" role="status" aria-label="Sessionens resultat">
            {tally.length === 0 ? (
              <span style={{ color: 'var(--muted)' }}>— svara ovan så förs boken</span>
            ) : (
              <>
                {tally.map((e) => (
                  <span key={e.id} className={e.ok ? 'ok' : 'bad'}>
                    {e.ok ? '✓' : '✗'}
                  </span>
                ))}
                <span>
                  {tally.filter((e) => e.ok).length} av {tally.length} · varje fel taggas mot en
                  känd fälla
                </span>
              </>
            )}
          </div>
          <div className="lp-note" style={{ marginTop: 24 }}>
            <div className="lp-note-l">Byggd för ADHD</div>
            <p className="lp-note-t">{COPY.claimAdhd}</p>
          </div>
          <div className="lp-note" style={{ marginTop: 24 }}>
            <div className="lp-note-l">Målet är 2.0</div>
            <p className="lp-note-t">{COPY.claimTarget}</p>
          </div>
        </RailRow>

        <RailRow label="Villkor" sub="läs detta">
          <HonestBlock />
        </RailRow>

        <RailRow label="Pris" sub="ett köp">
          <PriceBlock />
          <Cta sub="Konto → betalning → första passet. Inga val på vägen." />
        </RailRow>

        <hr className="lp-sep" style={{ marginBottom: 20 }} />
        <div className="lp-brandline">
          <span className="lp-folio">{COPY.brand} · byggd av en som själv skriver provet</span>
          <span className="lp-folio">2.0</span>
        </div>
      </div>
    </div>
  )
}
