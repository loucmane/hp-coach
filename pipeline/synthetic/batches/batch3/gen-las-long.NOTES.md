# gen-las-long — authoring notes

## Unit
- **Section:** LÄS long (4 questions), sakprosa / populärvetenskap.
- **Family tag (whole-unit):** `gruvvarmelager-popularvetenskap-long`.
- **Topic:** seasonal thermal storage in a flooded, disused iron mine — pumping a sawmill's
  waste heat into a deep water-filled shaft in summer and recovering part of it in winter.
  A **fresh domain**, not neighbouring any topic on the used-topic exclusion list.
- **Frame:** result-lede opening; fictional researcher (Ingrid Sahlberg, Bergslagens
  energilaboratorium), fictional mine (Klippgruvan), town (Rönnberg), skeptic (Per Lidström),
  byline (Karin Ahlgren, vetenskapsredaktör). Glossary tail defines `skiktning`, a word that
  actually appears in the passage.
- **Stats:** 759 words, 37 sentences, mean 20.5 w/sentence (varied 6–40w), 8 paragraphs. All
  inside the M-BANDS long-class bands.

## Genre / register rationale
Populärvetenskap sakprosa is ~86% of the LÄS corpus and the natural home of the higher-order
families (huvudbudskap, inferens). Register is nominal with `-s`-passives (*pumpades*,
*registrerades*, *mättes*), one glossed specialist term (*skiktning*), varied sentence length,
and deliberate non-tidiness (law 9): a failed 1980s attempt in a neighbouring county, a collapsed
borehole, the sawmill's fluctuating output, an unexplained winter-to-winter swing, and Lidström's
point that most Rönnberg houses already have district heating. Concrete residue that does not all
point at the answer.

## Planted trap architecture (passage and questions are one design)

The passage owes four planted targets, each **hedged, directional, scoped**:

- **T1 (finding, §4):** "Där det varma vattnet fick ligga orört längst ner tycktes
  återvinningen bli högre — men bara när uttaget skedde långsamt. I de översta hundra
  metrarna syntes ingen vinst alls." Hedged (*tycktes*), directional (depth + slow draw →
  higher recovery), scoped (deepest only, slow only, no surface gain).
- **T2 (mechanism, §5):** slow, even draw disturbs the thermal layers less; fast draw stirs
  cold water up into the warm layer and loses *part* of the heat. Directional.
- **T3 (thesis, whole text):** a disused flooded mine can play a **modest, conditional,
  site-specific** role as a heat store — value real but bounded.
- **T4 (for inference):** depth-fact + slow-draw-fact + the shallow-permeable-mine-is-worthless
  contrast, combinable into "deep + slow-drawn shafts suit best".

### Q1 — `enligt_texten_detalj` (key A)
Paraphrase of T1. **B = reversed_causality** (high recovery → chose to pump slower; arrow
flipped). **C = overgeneralisation** ("nästan all … oavsett djup och uttagstakt" absolutises;
directly contradicted by "ingen vinst alls" near the surface and "bara när … långsamt").
**D = detail_as_main/scope_shift** (sensors reaching the bottom is method §3, not the result).

### Q2 — `detalj_ospecificerad` (key C)
Paraphrase of T2. **A = reversed_causality** (fast draw keeps layers *apart* — the opposite of
the text). **B = overgeneralisation** ("all the heat disappears"; text says "en del"). **D =
plausible_worldknowledge** (pumps cooling — technically plausible, unsupported; the text's
mechanism is layer-mixing, not pump temperature). *Deliberate law-10 move: here the key is the
confident, specific claim and a distractor over-absolutises, so "pick the qualified option" does
not select the key.*

### Q3 — `huvudbudskap_syfte` (key B)
Whole-text span. **A = detail_as_main** (the stratification sub-explanation). **C =
overgeneralisation** ("den självklara lösningen på hela uppvärmningsbehovet" — pushed past every
caveat; contradicted by "värdelös som lager" for a shallow mine). **D = true_but_irrelevant**
(the hundreds-of-flooded-mines background fact).

### Q4 — `inference_slutsats` (key A)
Combines the depth fact and the slow-draw fact in the stated direction, backed by the
shallow-vs-deep contrast in §7. **B = reversed_causality** (shallow near-surface mines best —
the passage says the opposite). **C = overgeneralisation** ("vilken … som helst" contradicts
"varje schakt måste bedömas för sig"). **D = plausible_worldknowledge** (extends the corrosion
caveat into a hard suitability rule the text never states — depth and stillness, not water
purity, are what make a shaft suit as a *store*).

## Length-tell / hedge-tell discipline (law 10)
- **Key letters spread:** A, C, B, A.
- **Key strict-longest in only 1/4 questions** (Q2, an inherently long mechanism) — under the
  M-TELL 0.75 threshold. Q1 (B longest), Q3 (A longest), Q4 (A tied) keep the key off the top.
- **Hedge/absolute correlation broken:** in no question is the key the unique non-absolute
  option — Q1 has three non-absolute options, Q2's key is the *confident* claim while a
  distractor absolutises, Q3 and Q4 each carry a second non-absolute distractor. "Pick the
  qualified answer" scores at chance.

## Self-blind-solve (skeptical, passage only)
Solved all four arguing actively for each non-keyed option:
- **Q1 = A** uniquely. B fails (direction reversed vs "bara när uttaget skedde långsamt");
  C fails (contradicted by "ingen vinst alls" + "bara … långsamt"); D is method, not result.
- **Q2 = C** uniquely. A is the literal inverse of §5; B's "all" is denied by "en del av
  värmen"; D introduces a pump-cooling mechanism absent from the text.
- **Q3 = B** uniquely. A/D are true but partial (detail / background); C over-reaches past the
  explicit caveats.
- **Q4 = A** uniquely. B contradicts the surface/depth finding; C contradicts "bedömas för
  sig"; D over-states the corrosion caveat as a suitability rule.

**G-STEM check (Batch-2 negative example):** Q4's stem names the topic ("which mines suit as
heat stores") but does **not** entail the key. The passage could have reported shallow mines
working or draw-rate being irrelevant; that it found depth + stillness decisive is an **empirical
outcome**, not the only logically coherent answer. No stem is blind-answerable from world
knowledge — the recovery pattern, the mechanism, the thesis and the suitability inference all
require the invented passage facts.

**Entities all fictional; no famous-thesis anchoring.** Glossary defines only `skiktning`, which
appears in the passage.

## Mechanical self-check
`run_mech.py`: M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-PLAGIARISM pass (all clean).
