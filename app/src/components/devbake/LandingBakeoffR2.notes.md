# LandingBakeoffR2 — round 2 (polish-and-seduce)

Bases: round 1's `LAND_P1` (Första frågan) and `LAND_P2` (Uppslaget) —
the product-demo lens the owner picked. Round 2 keeps each thesis and
raises execution to the shipped motion system's bar. Fixtures:
`LAND_P1V2`, `LAND_P2V2`; chips stitched after the round-1 four on
`/dev/landing-bakeoff`.

## What round 2 changed — both concepts

- **"Vad vi inte lovar" / Ärlighetsklausul: CUT ENTIRELY** per owner
  verdict. No standalone honesty section, no "who this isn't for" copy,
  no negative framing about the reader anywhere. Trust now lives in the
  plain factual tone + the villkor/pris block; the accountability line
  ("HP-Coach drivs av [namn] · org.nr [—]") moved to the colophon.
- **State-driven hero beat** (`useMountGo` + `useArketMotion`, per the
  RouteScene mount-suppression law): Arket-lawful — opacity inks +
  a letter-spacing settle, zero travel. Under reduced motion the flag
  starts true and everything renders final-state on frame one.
- **Claims rewritten positive and specific** (four, unchanged count):
  Börjar från noll / Siktet är 2.0 / En sak i taget / Felen är
  läroplanen. The ADHD framing stays capability-language ("en sak i
  taget", "appen väljer nästa uppgift åt dig") — no diagnostic language,
  no streak/miss talk.
- **Mid-page conversion**: a quiet mono accent link ("Skapa konto →")
  appears at each concept's emotional peak — P1v2 right after the first
  graded answer (inside the "Det där var appen" note), P2v2 when the
  session ledger completes. The end-of-page CTA block is unchanged
  ("Skapa konto" → /sign-up, zero-choice sub-line).
- Price block: bigger mono X kr (36px), folio tightened to "priset
  sätts före lansering", anchor recast positively.

## LAND_P1V2 — what was elevated

- The hero now performs ONE orchestrated beat: brand folio (0ms) →
  eyebrow (100ms) → headword *vedermöda* settles typographically
  (letter-spacing 0.02em → −0.01em over 520ms, the M3 settle made
  state-driven) → the five option rows ink as a block (340ms) → the
  "skriven för HP-Coach" tag (500ms). CSS mount animation on the
  headword is disabled (`animation: 'none'`) so framer owns it.
- Headword scale raised to `clamp(44px, 12vw, 64px)` — at 390px the
  word fills the measure and the whole answerable question sits above
  the fold.
- The post-answer reveal keeps `.reveal` and gains the quiet CTA.

## LAND_P2V2 — what was elevated

- Masthead beat: brand line inks → the 1px ink rule DRAWS left→right
  (340ms, reading ease — the page ruling itself) → thesis settles →
  intro inks. The thesis stays "Det här är inte en broschyr. Det är
  appen."
- **Ledger fixed and staged**: marks are now keyed to QUESTION order
  (round-1 residue closed) with muted `·` placeholder slots until each
  question is answered; each booked ✓/✗ seats with the veck-register
  spring (scale 1.4 → 1, opacity ink). Count line reads
  "N av M rätt · varje fel taggas mot en känd fälla".
- VILLKOR row folded into "PRIS · villkor i klartext" — one factual
  block (price, terms, 550 kr anchor), no honesty clause.

## Swedish quality pass — sentences rewritten (line-by-line native pass)

Compared against shipped voice (konto.tsx, DrillResult.tsx: terse,
plain verbs, lowercase mono annotations).

1. claimZero: "Kursen antar ingenting. Vi börjar vid noll — ordrötter
   före ordlistor, algebra före ekvationer." → "Kursen förutsätter inga
   förkunskaper. Ordrötter före ordlistor, mönster före formler — allt
   byggs från grunden." ("antar ingenting" är styltigt; "börjar *vid*
   noll" är oidiomatiskt — *från* noll; "algebra före ekvationer" var
   sakligt skevt eftersom ekvationer är algebra.)
2. claimTarget: "Byggd för 2.0. Systemet … tolererar inga svaga fläckar
   — det hittar dem åt dig." → "Appen mäter varje delprov för sig och
   visar exakt var nästa tiondel finns. Du övar alltid på det som lyfter
   poängen mest." (negativ inramning struken; "svaga fläckar" borta.)
3. claimAdhd: "…sessioner kan vara tio minuter, och missade dagar möts
   utan streak-skam." → "Appen väljer nästa uppgift åt dig. Ett pass tar
   tio minuter, och det är alltid tydligt var du ska börja." (missade
   dagar/streak-skam = negativ inramning om läsaren, struken;
   "sessioner kan vara" var vagt.)
4. claimLoop: "Varje fel klassificeras mot ett mönsterbibliotek av kända
   fällor. Du övar på dina misstag — inte på slumpen." → "Varje fel
   matchas mot en känd fälla och läggs i din repetitionskö. Du övar på
   rätt saker — inte på måfå." ("klassificeras mot" är byråkratiskt och
   inte riktig svenska i den konstruktionen; "inte på slumpen" →
   idiomatiska "inte på måfå".)
5. Q_ORD.why: "…möda med förstärkande förled. Rätt svar är a) prövning."
   → "En vedermöda är en svår prövning — ordet möda med det förstärkande
   förledet veder-. Rätt svar är a) prövning." (naket "förstärkande
   förled" utan artikel läste som telegram; ledet namnges nu.)
6. Q_MEK.why: "Kritiken kräver ett negativt laddat första led…" → "Den
   hårda kritiken kräver…" (bestämd form binder tillbaka till meningen
   ovanför; annars syftningsglapp.)
7. Q_KVA.why: "Räkna aldrig 'nästan lika' på känsla — bråkdelar av olika
   tal är en klassisk fälla." → "Lita aldrig på känslan när talen ligger
   nära — andelar av olika tal är en klassisk fälla." ("räkna … på
   känsla" är ingen svensk konstruktion; "bråkdelar av olika tal" →
   "andelar av olika tal".)
8. Specimen-distraktorn: "…ligger ett förled bort. Fällan är att läsa
   rotens grannord i stället för ordet självt." → "…skiljer sig bara i
   förledet. Fällan är att svara på ett ord som liknar uppslagsordet i
   stället för på ordet självt." ("rotens grannord" var privat metafor,
   obegriplig för målgruppen; prepositionen "på" upprepas nu korrekt i
   båda leden.)
9. P2-intro: "Nedan är en övningssession, uppslagen som en boksida.
   Uppgifterna går att svara på. Marginalen säljer; sidan bevisar." →
   "Uppslaget nedan är en riktig övningssession. Svara på uppgifterna,
   se hur appen rättar — och avgör själv." ("Nedan är …" är
   översättningssvenska; meta-aforismen struken för direkt uppmaning.)
10. Ledger tom: "— svara ovan så förs boken" → "svara på uppgifterna
    ovan — resultatet bokförs här" ("så förs boken" var krystat;
    "bokförs" bär bokföringsbilden idiomatiskt.)
11. Ledger ifylld: "2 av 2 · varje fel taggas…" → "2 av 2 rätt · varje
    fel taggas…" (utan "rätt" var siffran tvetydig.)
12. Prisfolio: "priset sätts före lansering — det blir ett tal, inte en
    trappa" → "priset sätts före lansering" (trapp-metaforen var
    kryptisk utan sin kontext.)
13. priceAnchor: "Själva provet kostar 550 kr per anmälan. Förberedelsen
    ska inte kosta en prenumeration." → "Anmälan till provet kostar
    550 kr. Förberedelsen ska vara ett köp — inte en prenumeration."
    ("kosta en prenumeration" är fel objekt för *kosta*; "550 kr per
    anmälan" var kanslisvenska.)
14. Reveal-noten: "Sidan du läser är byggd av samma delar som övningsvyn
    — det du kände nyss är det du köper." → "Frågan du just svarade på
    är byggd av samma delar som övningsvyn — det du nyss kände är det du
    köper." (syftningen skärpt till frågan; "kände nyss" → naturligare
    ledföljd "nyss kände".)

Verified unchanged as already-correct: kickers ("Vilket ord betyder
ungefär detsamma?", "Vilken kvantitet är störst?"), option texts,
exampleTag, ctaSub ("Konto → betalning → första passet. Inga val på
vägen."), "Rätt svar"/"Ditt svar", "Varför den lockar", specimen-ledet
"Ordet bär alltid tyngd: en vedermöda uthärdas, den uppskattas inte.",
kolofonen "byggd av en som själv skriver provet".

## CTA system (round 2.1 — owner verdict "there needs to be more CTAs")

One action — "Skapa konto" → `/sign-up` — repeated at four stations per
concept. Identical label and destination everywhere; no urgency theater
(no countdowns, no "endast idag"). Verified at 390px and 1440px
(frames in `screenshots-landing-cta/`).

### CTA placement map — P1v2 "Första frågan"

1. **Early inline** (`QuietCta`, hero): under the exampleTag, inside the
   hero's last ink beat (delay 0.5 with the tag). At 390px it lands ON
   THE FIRST VIEWPORT — a ready-to-buy visitor never has to answer the
   question to convert.
2. **Earned** (unchanged): the "Det där var appen" note after the first
   graded answer keeps its quiet CTA.
3. **Sticky bar**: appears once the hero `<section>` has fully scrolled
   out (IntersectionObserver), hides the moment the final price/CTA
   `<section>` intersects the viewport.
4. **Final** (unchanged): the price block carries the button — `Cta`
   with the zero-choice sub-line renders inside the same
   "Pris och konto" section as `PriceBlock`.

### CTA placement map — P2v2 "Uppslaget"

1. **Early inline** (`QuietCta`, masthead): directly under the intro
   paragraph ("… och avgör själv."), same ink beat (delay 0.36). First
   viewport at 390px.
2. **Earned** (unchanged): the completed ledger's CTA in the UTFALL row.
3. **Sticky bar**: hero = masthead + rule + thesis + intro (one wrapping
   `<section>`); same appear/hide contract as P1v2.
4. **Final** (unchanged): PriceBlock + Cta inside the "Pris" RailRow,
   wrapped as the observer's end target.

### The sticky bar itself

- One `<a>` — the whole bar is the tap target: "Skapa konto →" (mono,
  accent) left, "X kr · engångsköp" (mono, muted) right. Solid
  `var(--bg)`, 1px `var(--hairline)` top rule, safe-area inset padding.
- Motion: opacity + 14px y settle on `DUR.chrome` / `EASE.reading`
  (state-driven, so it survives RouteScene's mount suppression);
  reduced motion collapses to instant via `useArketMotion().rm`.
- Hidden state is inert: `pointer-events: none`, `aria-hidden`,
  `tabIndex={-1}` — it never traps keyboard focus off-screen.
- **Never two CTAs stacked**: the bar's hide condition is the final CTA
  section *touching* the viewport, so the bar has lifted off before the
  button can be seen (verified: `p1v2-390-05/06`, `p2v2-390-04/05`).
  The early inline CTA lives INSIDE the observed hero, so the bar only
  appears after that door has scrolled away too. The mid-page earned
  links can coexist with the bar — they are text-level moments, not
  blocks, and the spec keeps them.

### Desktop (≥900px) decision: bottom-right corner pill

The same element, restyled by media query (`left:auto; right:24px;
bottom:22px; border-radius:999px`) — not a top-right pill, and not
omitted:

- **Not omitted**: neither concept has persistent chrome; on 1440px the
  dead zone between hero and price block is ~0.7–1 viewport of scroll
  with no door — the pill has real work to do.
- **Not top-right**: it would collide with the bake-off's sticky chip
  header today and with P2v2's masthead brand line on a shipped page.
- **Bottom-right** keeps ONE object with ONE motion grammar across
  breakpoints (same edge, same slide), sits outside the 720px column,
  and points forward — toward the final CTA it hands off to.

## Known residue

- Dark mode inherits from tokens (all colors token-bound) but was not
  separately art-directed this round either.
- The two hero beats replay when switching chips (component remounts) —
  correct for a bake-off, and correct for production (one beat per
  visit).
- P1v2 duplicates the option-row markup (`OptionsOnly`) so the hero can
  own eyebrow + headword for the ink beat — acceptable fixture-level
  duplication; a shipped landing would refactor `DemoQuestion` to
  accept a `heading` slot.
- P2v2's end target is a `<section>` nested inside the Pris RailRow's
  own `<section>` — harmless, but a shipped page would give RailRow a
  ref pass-through instead.
- On a very tall desktop window (viewport ≳ the hero-to-price gap) the
  sticky pill may never appear — correct by construction: the final CTA
  is already reachable.
