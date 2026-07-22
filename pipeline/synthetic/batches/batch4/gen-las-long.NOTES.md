# gen-las-long — authoring notes

## Unit at a glance
- **Section / size:** LÄS long (4 questions, 773 words — inside 750–1135).
- **Topic pool used:** Swedish craft & material culture → traditional wooden boat-building
  (allmogebåtar / clinker boats). Deliberately far from every batch 1–3 topic; nothing
  maritime, ecological-meadow, or heritage-conservation-of-buildings has been used.
- **Family:** `traditionellt-batbygge-popularvetenskap-long`.
- **Genre (picked first, per law 7):** sakprosa / populärvetenskap, result-lede opening,
  nominal register with `-s`-passives (*mättes, fotograferades, åldersbestämdes,
  dubbelkontrollerades, granskades*). Sentence length varies deliberately — short verdicts
  ("Ett skrov stack ut." "Den hade aldrig behövt bytas." "Alla är inte övertygade.") beside
  long subordinated sentences. Ends signed on a fictional byline; two-line glossary at the
  very tail defines only words that appear (*bordläggning*, *kärnved*).

## Fictional entities (law 1 — no famous-thesis anchoring)
Ingrid Hallström; Sjöhistoriska verkstaden i Härnösand; Torsten Byle (skeptic); Marielle
Sundqvist (byline); the Nordingrå ökstock case; the 2021/… survey of 63 hulls. All invented;
no real study or person is referenced. The core claim (dense-ringed slow-grown pine resists
rot) is a plausible craft observation, not a canonical published thesis, so it cannot be
answered from prior knowledge — the conditional/hedged shape is what the questions test.

## Planted trap architecture (passage and questions are one design)
The passage owes four hedged/directional/scoped targets:

- **Q1 `enligt_texten_detalj` (key A, hedged/scoped).** Target = the lede + stycke 5 finding:
  dense pine resisted rot *but mainly for boats kept in use and afloat*; the effect "försvann
  nästan helt" for dry-stored boats.
  - B = **reversed_causality** — flips wood→longevity into longevity→re-planking-with-dense-pine.
  - C = **overgeneralisation** — "oavsett hur båtarna brukades eller förvarades" absolutises and
    directly contradicts stycke 5.
  - D = **scope_shift** — the ring-count method presented as the result.
- **Q2 `detalj_ospecificerad` (key C, confident/specific — deliberately NOT the hedged option,
  to break the "pick the qualified answer" tell of law 10).** Target = Hallström's mechanism
  ("täta ringar rymmer mer kärnved och kåda, vilket bromsar hur snabbt vattnet tränger in").
  - A = **scope_shift** — attributes the effect to tarring (a different factor tied to the
    dry-stored boats).
  - B = **overgeneralisation** — "helt vattentät … någon fukt alls" overshoots "bromsar hur
    snabbt".
  - D = **reversed_causality** — genuine arrow flip (rot-resistance → slow growth).
- **Q3 `forfattarens_hallning` (key B, balanced stance).** Passage carries an explicit
  evaluative stance *with a concession* (stycke 6–7): don't idolise the old builders, but
  test their inherited knowledge rather than dismiss it.
  - A = **stance_inversion** (NOT reversed_causality — labelled per the batch STEM/label law:
    a stance flip names a stance flip). Lands on dismissal, the opposite pole.
  - C = **overgeneralisation** — inflates the concession into "genomgående tillförlitlig … till
    punkt och pricka".
  - D = **plausible_worldknowledge** — heritage-value-regardless-of-truth; real-world-reasonable
    but contradicts the text's empirical-testing emphasis.
- **Q4 `huvudbudskap_syfte` (key D, whole-text span).**
  - A = **detail_as_main** — the ring-dating method promoted to message.
  - B = **overgeneralisation** — "alltid … oavsett skötsel" past the caveats.
  - C = **true_but_irrelevant** — the oral-tradition background (stycke 2) is true but not the point.

## Law compliance checks
- **STEM law:** no stem entails its answer. Q1 ("Vad var huvudresultatet") and Q4 name the
  setup only; the answer is an empirical outcome the passage could have reported either way
  (dense wood could equally have shown *no* effect). Q3 frames the topic (hållning), not the
  verdict.
- **DISTRACTOR-FORM law:** every absolute distractor (Q1-C "oavsett", Q2-B "helt/någon…alls",
  Q4-B "alltid/oavsett") is *also* refuted by passage content — none is eliminable by form
  alone. All distractors are hedged/form-symmetric with their keys where relevant.
- **Hedge/key decorrelation (law 10):** the key is the qualified option on Q1/Q3/Q4 but the
  *confident, specific* option on Q2 (there the absolute over-claim is a distractor). So
  "pick the hedged answer" does not score the unit blind.
- **Length-tell (law 10 / M-TELL passed):** the longest option is a distractor on Q1 (B), Q2
  (B) and Q3 (A); the key is longest only on Q4 — one of four, not "most".
- **Key spread:** A, C, B, D — no positional or single-letter tell.
- **Paraphrase-not-copy (law 3):** no option reproduces a passage sentence; keys recast the
  content in different words.

## Self-blind-solve result
Solved all four from the passage alone, arguing actively for each non-keyed option:
- **Q1 → A.** B needs a longevity→re-planking direction the text never states; C is killed by
  "effekten försvann nästan helt"; D is method, never called a fynd. Single defensible: A.
- **Q2 → C.** A's tarring belongs to the dry-stored boats, not the wood mechanism; B's "helt
  vattentät" overshoots "bromsar"; D reverses the growth→resistance arrow. Single: C.
- **Q3 → B.** A dismisses (text says test *instead of* dismiss); C over-praises (text: "mycket
  … höll inte"); D makes truth irrelevant (text is all about testing truth). Single: B.
- **Q4 → D.** A is method; B absolutises past the caveat; C is background. Only D spans lede +
  conditional finding + caveat + stance. Single: D.
No question was two-way on honest re-read.

## Mechanical gate result
`run_mech.py` → M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-PLAGIARISM pass (773 words;
mean sentence 19.3; 8 paragraphs; option-length ratio ≤1.54).
