# gen-las-long — authoring notes

**Unit:** `gen-las-long.json` · `candidate_id: PLACEHOLDER` (orchestrator renumbers)
**Section:** LÄS · **Size:** long (879 words, 4 questions)
**Family tag:** `kulturvard-kyrkomaleri-popularvetenskap-lang`

## Genre / topic rationale

- **Macro-genre:** sakprosa · **fine-genre:** populärvetenskap · **opening move:** result-lede.
  This is the corpus-dominant LÄS regime (~86% sakprosa; long passages typically open
  result-first), and it lets me plant hedged/directional/scoped experimental claims that the
  trap machinery operates on (law 2).
- **Topic (deliberately DISTINCT from Batch 1):** a fictional conservation survey of medieval
  church wall-paintings that were *whitewashed over* in the 1700s and are today better preserved
  because of it. Batch 1 subjects were light-pollution/moths, culture-quarter metrics, two
  herbaria, late-life cognition, board-game cafés, bat-timing owls, lantern-keepers — all
  ecology/culture-metric/cognition. This unit moves to a **different domain entirely
  (kulturvård / heritage conservation science)** and a non-biological causal mechanism
  (lime carbonation + vapour permeability vs oil films). No overlap of subject, mechanism, or
  entities.
- **Why not intuitively guessable (law 1 / G-STEM):** the surprise finding ("the thing meant to
  erase the paintings saved them") is counter-intuitive, and every question hinges on
  *scoped particulars* a non-reader cannot supply: lime-vs-oil binder, north-wall/dry-region
  scope, the within-church control, the breathe-not-seal mechanism.
- **Entities all fictional:** konservator **Marit Sköldeberg**, konsthistoriker **Petrus
  Lönnbohm** (skeptic), byline **Harald Ström**; unnamed "verkstad" and an unnamed inland stift.
  No real toponym is used (only "det torra inlandet", "vid öppet hav"). Materials (kalk, olja,
  azurit) are common nouns — the reference unit likewise uses real species/materials
  (fältgentiana, honungsbin).
- **Anti-tidiness (law 9):** genuine residue that does not all point at an answer — winter
  visits to read wall moisture, azurite still weathering *under* the lime, the coastal churches
  where lime made no difference, and an unresolved practical dilemma in the close. The neat
  binary "covering = loss" is dismantled, not merely presented.
- **Frame (law 6):** title in `title` (not repeated in passage); byline (`Harald Ström,
  vetenskapsjournalist`) is the penultimate line inside `passage`; glossary (`puts`,
  `framknackning` — both words that actually occur) is the very tail. Ends signed, not on a
  question or flourish.

## Planted target architecture (passage and questions are one design)

Each question owns a planted claim that is **hedged, directional, scoped**, and each distractor
is a *named operation* on that target (law 2; families.md trap glossary).

### Q1 — `enligt_texten_detalj` (detail, text-anchored) · key **C**
- **Target:** P1+P4 finding — *original lime* whitewash → better preservation, **hedged**
  ("ofta", "tycktes"), **directional** (whitewashing → preservation, guarded explicitly against
  the reverse), **scoped** (lime not oil; north walls; dry churches).
- **C (key):** paraphrase of the target, keeps hedge + scope (kalkfärg, norrväggar). No verbatim
  lift.
- **A = overgeneralisation:** "allt måleri som täckts av ett färglager" absolutises and folds in
  oil, which the text says did *not* protect.
- **B = reversed_causality:** already-well-preserved churches got whitewashed — arrow flipped;
  text denies it outright ("inte tvärtom").
- **D = scope_shift / detail-as-main:** promotes the 5-point grading *method* to "viktigaste
  resultatet". (Made the longest option on purpose — see length-tell note.)

### Q2 — `detalj_ospecificerad` (detail, content/mechanism-anchored) · key **A**
- **Target:** P5 mechanism — lime *breathes* (vapour-permeable) and *binds* on carbonation,
  so moisture escapes; oil forms a tight film that traps moisture.
- **A (key):** paraphrase of that mechanism.
- **B = reversed_causality / property-swap:** "tät hinna som stängde ute all fukt" is precisely
  the *oil's* harmful behaviour reattributed to lime; contradicts "släppa igenom vattenånga".
  Tempting because "sealing out moisture" sounds protective.
- **C = plausible_worldknowledge:** darkness protects pigment from light-fading — real-world
  plausible, but the text never names light as the threat; protection is moisture handling.
- **D = true_but_irrelevant:** cheapness → frequent re-coating; text says earth pigments were
  cheap but never that protection came from re-coating.

### Q3 — `huvudbudskap_syfte` (main message) · key **D**
- **Target:** whole-text span — an accidental old practice preserved medieval art, but the
  benefit is **conditional** and the reading is **contested**.
- **D (key):** spans lede + finding + caveat + debate; no single paragraph carries it.
- **A = detail_as_main:** carbonation mechanism (one paragraph) promoted to the whole.
- **B = true_but_irrelevant:** the 1700s whitewashing background fact, not the message.
- **C = overgeneralisation:** "säkraste sättet … borde göras överallt" pushes past every caveat
  and adds a normative claim the text never makes.

### Q4 — `inference_slutsats` (inference) · key **B**
- **Target:** requires combining two stated facts — (i) within one building, whitewashed vs free
  fields differ; (ii) within a building, roof/walls/parish funds are shared — to conclude the
  within-church difference cannot be a parish-wealth artefact (rebutting Lönnbohm for that case).
- **B (key):** the valid two-fact inference in the passage's own direction.
- **A = plausible_worldknowledge (text-contradicted):** "different artists / different-durability
  paint" — text says fields were "målade samtidigt av samma hand".
- **C = overgeneralisation:** "alltid … oavsett klimat" contradicts the humidity caveat.
- **D = reversed_causality / over-extension:** stretches the within-church logic to claim
  *between-church* differences are "enbart kalken, inte rikedom" — but Sköldeberg concedes wealth
  may have coloured the between-church comparison.

## Self-blind-solve result (law 4)

Solved all four skeptically from the passage alone, arguing actively for each non-keyed option:

| Q | family | key | verdict |
|---|--------|-----|---------|
| 1 | enligt_texten_detalj | C | single defensible answer; A/B/D each contradicted by an explicit passage statement |
| 2 | detalj_ospecificerad | A | single; B swaps in the oil mechanism, C/D unsupported |
| 3 | huvudbudskap_syfte   | D | single; A partial, B background, C over-reaches past caveats |
| 4 | inference_slutsats   | B | single; A text-contradicted, C absolutised, D over-extends to between-church |

No item was two-way; none required rewriting after the blind solve. **Keys spread C / A / D / B**
(no positional or all-one-letter tell).

## Mechanical self-check (`run_mech.py`, PLACEHOLDER accepted)

- M-SCHEMA **pass** · M-BANDS **pass** · M-TELL **pass** · M-PLAGIARISM **pass** (vs `data/parsed/*`).
- passage_words **879** (band long 215–1260; blueprint target 750–1135) ·
  paragraphs **10** · sentences **43** · mean_sentence_words **20.4** (band 8.2–30.9; authoring
  target 14–25) · sentence length varies 4–49.
- Per-question option widths in-band (all ≤ 23) and ratios ≤ 1.6 (cap 5.25).
- **M-TELL note:** the key is the single longest option in only **1/4** questions (Q3), below the
  0.75 systematic-length-tell threshold — distractors D(Q1), D(Q2), D(Q4) were deliberately made
  the longest so "pick-the-longest" scores nothing.
- One spelling variety is a LÄS non-issue (Swedish); prose read aloud for calques / BIFF word
  order / en-ett & participle agreement / -s-passives — clean (fixed a participle-agreement
  wording in P4 and a dense double-object in P8 during the read-aloud pass).
