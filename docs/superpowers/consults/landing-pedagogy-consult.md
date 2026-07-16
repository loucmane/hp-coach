# Landing pedagogy consult — "the full experience as the pitch"

**Status:** consultation for discussion, pre-v3-bake-off. Not a build.
**Owner direction (verbatim):** "We should apply the full experience for the example. Like all the steps on how to get to the correct answers."
**Grounding read:** `app/src/components/drill/PedagogyPanel.tsx` (the real post-answer panel), `data/explanations/host-2020.json` (corpus voice, e.g. the *gourmand* explanation), `app/src/components/devbake/LandingBakeoffR2.tsx` (v2: demo questions graded with a one-line `why` — the owner correctly calls this inauthentic; the product never answers with one line).

**Visual board:** `docs/superpowers/consults/landing-pedagogy-board.html`, screenshotted in `screenshots-consult-pedagogy/`.

---

## The thesis

The v2 landing demos prove the *question* is real but fake the *product*: you answer, you get one sentence. The actual product answers with a graded ritual — verdict morph, solution lede, numbered steps with kärna/detalj tiers, and a per-distractor autopsy of the exact wrong thought you just had. That ritual **is** the moat. So the demo should not describe the pedagogy or excerpt it; it should *perform* it, once, at full structural fidelity — and the landing's only additions should be three quiet margin annotations that tell the stranger what they're looking at.

The one-sentence version of the recommendation: **run the real panel, whole, on one original ORD question; narrate it from the margin; and treat the visitor who answers wrong as the page's protagonist.**

---

## 1 · Fidelity: full structure, calibrated prose, no app chrome

**Keep every structural element of the real panel.** UTFALL (verdict word morph + verdict-sub + bold-serif solution lede), **all 3 steg** with titles and KÄRNA/DETALJ badges, and **all 4 fällor** with the struck option reprint and the varför-det-lockar / varför-det-är-fel pair. Rationale:

- **Cutting distractors breaks authenticity mechanically, not just tonally.** The visitor sees five options. If only two get autopsies, the first thing a skeptical reader does is look for *their* letter — and if their wrong pick has no analysis, the demo reads staged and the moat-claim collapses at the exact moment it should land. All-wrong-options coverage is the product's actual promise ("every drillable question, every distractor"); the demo must honor it.
- **Cutting steps breaks the owner's direction** ("all the steps"). Three steps is also the natural ORD shape in the corpus (define → discriminate → select); it is not long.
- **Where depth converts:** the FÄLLOR section — specifically the row matching the visitor's own wrong pick. Nobody else on the market explains why *b)* tempted you. That row is the conversion event.
- **Where depth exhausts:** step *bodies*. Corpus steps run 60–90 words (the gourmand step 1 is ~80 words with a farbror anecdote). Mid-scroll on a landing, a stranger will skim past a second 80-word paragraph. So: **write the landing question's prose at the tight end of the corpus register — 40–60 words per step, 30–45 words per distractor field** — but change *nothing* structural. This is still authentic: the corpus itself varies in density; we are choosing a real, tight specimen, not inventing a "lite" format.
- **Drop the live-only apparatus, keep the pedagogy.** QA bar (👍/👎), framework deep-link chip, flag-missing CTA are app chrome, not teaching — a logged-out landing showing them would be the *actually* fake move (the buttons would do nothing). Their slot at the panel's tail is where the final annotation + CTA lives instead.

**Minimum authentic demo** (if v3 needs a smaller variant for a second, shorter question): verdict + solution lede + steps collapsed behind their real "3 steg" rail label + *only the picked* distractor expanded, others as struck one-line rows that expand on tap. Every element still exists; nothing is missing, some is folded. But for the hero question, run it fully open.

## 2 · Reveal choreography: narrated-progressive, wrong-path first-class

**Recommendation: the panel unfolds exactly as it does in the product** (staggered rail-section entrances: UTFALL at 0ms, STEG at +140ms, FÄLLOR at +280ms, rows +80ms apart — the shipped timings), with sections below the fold entering as they scroll into view. The landing adds exactly **three margin annotations**, one per rail section, in a visibly non-product voice (mono, accent ink, set outside the page-paper edge — clearly a curator's pencil note on the specimen, never mixed into the pedagogy itself):

| Beat | Section | Annotation (Swedish, final copy) |
|---|---|---|
| 1 | UTFALL | »Det här är skillnaden mot att bara rätta.« |
| 2 | 3 STEG | »Varje fråga i kursen förklaras så här — från noll, inga förkunskaper.« |
| 3 | 4 FÄLLOR | »Kursen vet varför du gissade som du gjorde. Det är det som tränar bort fällorna.« + inline CTA *Skapa konto* |

Why not the alternatives:

- **All-at-once** dumps ~450 words of Swedish below a scroll-stopping verdict; the reader's eye has no order and the moat reads as a wall. The product itself doesn't do this — so it would also be *less* authentic.
- **Tap-to-advance per step** taxes a stranger with 6–7 taps they haven't agreed to invest, and — worse — most will stop after step 1 and never *see* the distractor autopsy, which is the thing we're selling.
- **Narrated-progressive** keeps the product's own motion grammar (authentic), costs zero taps, and spends the landing's one permitted intrusion — the annotation — on saying the strategically load-bearing sentence at each beat.

### The wrong answer: the hottest 20 seconds on the page

A visitor who commits to an answer and gets it wrong has just *felt* the trap. Their next 20 seconds, second by second:

- **0–2 s — the verdict morph, verbatim from the product.** Their picked word flies from its option row into the verdict slot, gets struck, »— fel.« dries in beside it in `--bad`. Verdict-sub immediately hands them the rope: *Rätt svar är b) tillförlitlig. Häng med i varför.* No shame beat, no red banner — the product's calm register is itself a selling point for the ADHD-PI audience and must not be replaced by landing-page drama.
- **2–4 s — the lede.** The bold-serif solution_path restates the answer in one sentence between its ink rule and hairline. Annotation 1 sits in the margin beside the verdict: this is where the stranger learns the page has switched from quiz to lesson.
- **4–12 s — their fälla, found.** The FÄLLOR list marks their letter with a small `din gissning` tag and gives that row a quiet `--bad-soft` wash. The *varför det lockar* line names the exact thought they had four seconds ago ("Syskonordet. Vedertagen och vederhäftig ser nästan likadana ut …"). This is the recognition moment — the product reading their mind is the demo's emotional peak.
- **12–20 s — the ask, earned.** Annotation 3 + inline *Skapa konto* sits at the tail of FÄLLOR (the slot where the app's QA bar lives). The CTA arrives at maximum feeling-seen, not before. The v2 sticky-bar CTA system stays as-is around this; this is the *earned* station.

**Right-answer path** (the colder lead): verdict *Rätt.* + »Snyggt — rätt tänkt hela vägen.«, then the same full panel — a correct guesser still discovers that three of the options were engineered traps they merely stepped over. Annotation 3 gets a right-variant: »Rätt — men visste du varför d) var fel? Kursen tränar det också.« Do not shorten the panel on a correct answer; "I got it right and it *still* taught me something" is its own pitch.

**One choreography question to put to the bake-off** (not decided here): whether the wrong path should additionally *promote* the picked distractor's autopsy to directly under the verdict, before the steps ("Din fälla först"). It optimizes the hot lead but reorders the product's canon (steg → fällor), so it trades authenticity for lead-heat. That's exactly the kind of call a bake-off settles — see § 4. (If it wins, it's also a candidate to backport into the product itself.)

## 3 · Demo content — publication-ready

Original ORD question written for HP-Coach in authentic HP style; **not from the © UHR corpus** (verified: no ORD entry for this headword in `data/explanations/`). Voice-matched to the corpus register (du-tilt, concrete micro-scenes, sparing CAPS emphasis, sibling-word discrimination), at the tight end of corpus density per § 1. Distinct from v2's *vedermöda* but deliberately in the same veder-family — the two demos quietly teach each other.

### Question

> **ORD · Vilket ord betyder ungefär detsamma?**
>
> ## vederhäftig
>
> a) häftig
> b) tillförlitlig ✓
> c) motsträvig
> d) vedertagen
> e) omständlig

### Verdict lines

Product-verbatim by design (the real panel's verdict copy is generic — inventing bespoke verdict lines would be the inauthentic move):

- **Rätt:** verdict word = picked word + »— rätt.« · sub: *Snyggt — rätt tänkt hela vägen.*
- **Fel:** verdict word = ~~picked word~~ + »— fel.« · sub: *Rätt svar är b) tillförlitlig. Häng med i varför.*

### Solution lede (`solution_path`)

> Vederhäftig betyder pålitlig och väl underbyggd — någon eller något som håller för granskning. Svaret är B.

### Så löser du den — 3 steg

1. **Vad betyder vederhäftig?** `KÄRNA`
   Vederhäftig beskriver någon eller något du kan lita på: en vederhäftig källa håller för granskning, en vederhäftig person står för sitt ord. Ordet kommer från äldre juridiskt språk — den som »häftade för« en skuld kunde svara för den. Kärnan är PÅLITLIGHET som tål att prövas.

2. **Veder-familjen** `DETALJ`
   Veder- är ett gammalt förled som betyder *mot* eller *åter*: vedergälla (ge tillbaka), vedermöda (motgång), vedertagen (antagen av alla). Familjelikheten är själva fällan — orden delar förled men inte betydelse. Det är efterledet som avgör vart ordet pekar.

3. **Välj synonymen** `KÄRNA`
   Tillförlitlig (b) fångar precis det vederhäftig står för: något som går att lita på och som håller när det prövas. De andra alternativen lånar bara en yta av ordet — en ordbit, ett förled eller en stilkänsla.

### Varför de andra lockar — 4 fällor

**a) ~~häftig~~**
*Varför det lockar:* Ögat fastnar på slutet — häftig står ju bokstavligen där inne i ordet, och hjärnan vill gärna tro att ett längre ord bara är en finare version av ett kortare.
*Varför det är fel:* Häftig i vederhäftig kommer från *häfta* — att sitta fast, att stå för något — inte från häftig som i intensiv. En vederhäftig utredning är sällan särskilt häftig: den är torr, noggrann och pålitlig.

**c) ~~motsträvig~~**
*Varför det lockar:* Veder- är släkt med *mot* (jämför vedersakare, vedergälla), så det ligger nära att läsa in något trotsigt — någon som strävar emot.
*Varför det är fel:* Förledet pekar åt rätt håll men ordet har vandrat vidare: vederhäftig kommer från juridikens »häfta för något« — att svara för sitt ord. Motsträvig är närmast en motsats: den motsträviga vägrar, den vederhäftiga levererar.

**d) ~~vedertagen~~**
*Varför det lockar:* Syskonordet. Vedertagen och vederhäftig ser nästan likadana ut, båda är formella, och båda beskriver saker man litar på — en vedertagen sanning, en vederhäftig källa.
*Varför det är fel:* Vedertagen betyder allmänt accepterad — något många enats om. Vederhäftig betyder pålitlig I SIG — något som håller för granskning. En uppgift kan vara vedertagen utan att vara vederhäftig: alla tror på den, men den stämmer inte.

**e) ~~omständlig~~**
*Varför det lockar:* Vederhäftiga texter är ofta långa, noggranna och fulla av förbehåll — så associationen glider lätt över i omständlig.
*Varför det är fel:* Det beskriver stilen, inte ordet. Omständlig betyder onödigt invecklad — en brist. Vederhäftig är ett beröm: väl underbyggd och att lita på. En vederhäftig rapport kan mycket väl vara kort.

### Pre-grade tactic (if v3 shows the M1 tactic aside)

> **Efterledet avgör** — När veder-orden ser likadana ut är det efterledet som bär betydelsen: *-häftig* här är »häfta« (stå för), inte »häftig« (intensiv).

### Landing annotations (margin voice, final copy)

1. UTFALL · »Det här är skillnaden mot att bara rätta.«
2. 3 STEG · »Varje fråga i kursen förklaras så här — från noll, inga förkunskaper.«
3. 4 FÄLLOR · »Kursen vet varför du gissade som du gjorde. Det är det som tränar bort fällorna.« → **Skapa konto**
   (right-answer variant: »Rätt — men visste du varför d) var fel? Kursen tränar det också.«)

## 4 · What the v3 bake-off should vary

One axis only — **wrong-path choreography** — with fidelity, content, annotations, and CTA system held constant (both treatments use everything above):

- **T1 »Boksidan rakt av«** — product-verbatim order (UTFALL → 3 STEG → 4 FÄLLOR). The picked distractor is highlighted in place: `din gissning` tag + `--bad-soft` wash, and the page performs a gentle single auto-scroll nudge to the verdict on grade (no scroll-jacking beyond that). Maximum authenticity; the moat is discovered in reading order.
- **T2 »Din fälla först«** — on a wrong answer only, the picked distractor's autopsy renders as a promoted block directly under the verdict-sub (labelled `DIN FÄLLA` in the rail voice), then 3 STEG, then the remaining fällor. Maximum lead-heat; the recognition moment happens inside the first two seconds of reading. On a right answer, T2 is identical to T1.

What the bake-off decides: whether the recognition moment is worth reordering the product's canon on the landing — and, if T2 wins decisively, whether to backport the promotion into the product itself (it's arguably a better post-grade experience there too, which would dissolve the authenticity objection).

Explicitly **not** varied: fidelity level (settled by the owner's direction + § 1), annotation presence (three, fixed), CTA stations (v2.1 system stands).

## Risks / notes

- **Copy QA:** the demo content above should get the same native-Swedish pass the corpus got (audit/corpus_lint conventions apply: CAPS-emphasis and »…« quoting mirror the corpus contract).
- **Weight:** the full panel adds ~450 words to the page. At the tight register drafted here it reads in ~90 seconds; the annotations give skimmers three landing-voice waypoints so skipping the prose still delivers the pitch.
- **Legal:** question, steps, and distractor analyses are original work in HP style; the page keeps v2's "exempel i högskoleprovets stil" labelling.
