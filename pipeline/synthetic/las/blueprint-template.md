# LÄS generation blueprint — the contract between analysis and generator

A **blueprint** is the complete spec handed to a generator so it produces an authentic-feeling
LÄS unit (passage + its 2 or 4 questions) grounded in the measured corpus, not in vibes. The
generator receives a blueprint instance; it never invents genre, length, or trap structure on its
own. Generation itself is a **later, gated phase** — this document defines *what the generator
must be told*, plus one fully worked example (specs only; no passage is generated here).

All numeric bands cite `corpus-analysis.md` (source: `outputs/passage_stats.json`). All family /
trap references cite `families.md` / `families.json`.

---

## Part A — Passage spec

The generator MUST be given every field below. Bracketed bands are **hard constraints**: output
outside them is rejected by the gate (see `anti-plagiarism.md` for the verification harness).

| field | what it fixes | allowed values / band |
|---|---|---|
| `size` | question quota & length regime | `long` (4 questions) or `short` (2 questions) |
| `macro_genre` | register + LIX regime (pick FIRST — §5, finding #2) | `sakprosa` \| `juridik_myndighet` \| `litterar` |
| `fine_genre` | opening move & voice | populärvetenskap \| debatt_opinion \| facktext_larobok \| recension \| intervju_reportage \| skonlitteratur \| poesi \| juridik |
| `word_count` | length | long: **750–1135** (target ~995); short: **290–500** (target ~400) |
| `sentence_count` | derived rhythm | long: ~35–66; short: ~15–29 |
| `mean_sentence_len` | rhythm | **14–25 words** (do not exceed; do vary — include some 8–12w and some 30–45w) |
| `paragraph_count` | structure | long: 4–17 (target ~6); short: 3–13 |
| `lix_band` | readability = genre | sakprosa **44–58**; juridik up to **62**; litterär **25–45** |
| `register_markers` | must-have prose features | nominalisation + `-s` passives present; specialist lexicon allowed IF glossed |
| `title` | required frame | 1 short line ≤12 words, no terminal punctuation, no article-lead |
| `byline` | required frame | fictional Swedish author name(s); `A. Efternamn` or `Förnamn Efternamn [& …]` |
| `glossary_tail` | optional | 0–4 `term = förklaring` entries for the passage's hardest domain words |
| `opening_move` | how sentence 1 works | one of: result-lede \| definitional \| institutional-case \| framing-claim \| scene (must match genre) |
| `topic` | subject matter | a novel topic in the corpus's domains (research/society/law/culture/nature); NOT any source topic |
| `structural_skeleton` | paragraph plan | ordered list of paragraph roles (see below) |
| `planted_targets` | the item hooks | ≥1 hedged+directional+scoped claim per question the passage owes (see Part B) |

**Structural skeleton roles** (compose per genre; e.g. populärvetenskap = lede→background→
method→finding→nuance→implication): `lede`, `background`, `definition`, `method_or_case`,
`finding_or_ruling`, `nuance_or_caveat`, `counterpoint`, `implication`, `scene`, `turn`, `close`.
The passage does **not** close on a rhetorical flourish or a question — it ends and is signed
(byline). 0 % of authentic passages close on a question.

**Genre → default parameter presets** (from the corpus medians):

- `sakprosa / populärvetenskap`: opening=result-lede; LIX 48–54; first-person low; nominal register;
  glossary likely on dense science.
- `sakprosa / debatt_opinion`: opening=framing-claim; LIX 46–56; first-person + normative modality
  (*bör/måste*) present; stance explicit.
- `juridik_myndighet`: opening=institutional-case; LIX 52–62; agent-light; lexis: *yrka, överklaga,
  mål-nr, HFD/AD*; usually `short`.
- `litterar / skonlitteratur`: opening=scene; LIX 25–45; first-person high; short-worded, verby,
  low nominalisation; NO research vocabulary.
- `litterar / poesi`: verse layout (short lines), ≤520 words, imagery over exposition.

---

## Part B — Question spec (per question the passage owes)

Each question is specified as a **family + planted target + distractor plan**. The passage in Part
A must be authored to *contain the targets* — passage and questions are one design (finding #3).

| field | what it fixes | values |
|---|---|---|
| `family` | question type | one of the 9 `family_id`s in `families.md` |
| `target_sentence(s)` | where the answer lives | pointer(s) into the skeleton; the claim must be **hedged, directional, scoped** |
| `stem_pattern` | phrasing | family-appropriate Swedish stem (see patterns below) |
| `key_derivation` | how the correct option is built | rule per family (below) |
| `distractor_plan` | 3 distractors, each a named trap | assign each of B/C/D a trap tag from the glossary |
| `n_options` | always 4 | fixed `A–D` |

**Corpus-frequency-matched family mix.** For a `long` (4-q) passage, draw families ~ the corpus
distribution: ~3 of 4 questions are detail-retrieval; ~1 is a higher-order family
(huvudbudskap / hållning / inferens / jämförelse / struktur). For a `short` (2-q) passage: ~1–2
detail, occasionally 1 higher-order. Never make all questions higher-order (off-distribution).

**Stem patterns (Swedish, by family):**
- detail: `Enligt texten, …?` / `Vad var/är … enligt texten?` / `Vilket påstående … stämmer med texten?`
- huvudbudskap: `Vilket påstående överensstämmer bäst med texten?` / `Vilken rubrik sammanfattar bäst …?`
- hållning: `Vilken kritik riktar [författaren/recensenten] mot …?` / `Vad anser textförfattaren om …?`
- inferens: `Vad kan man, utifrån texten, dra för slutsats om …?` / `Vad talar för att …?`
- jämförelse: `Vad skiljer text 1 från text 2?` / `Vad har de båda [inläggen/dikterna] gemensamt?`
- struktur: `Varför nämner textförfattaren …?` / `Vilken funktion har …?`
- ordbetydelse: `Vad menas i texten med uttrycket "…"?`

**Key-derivation rules:**
- detail → paraphrase the target sentence (no verbatim lift; synonym-shift the content words).
- huvudbudskap → the claim that spans all paragraphs, not any single one.
- hållning → the stance the author explicitly asserts (not a concession they grant).
- inferens → the conclusion requiring **two** passage facts combined in the **stated** direction.
- jämförelse → the correctly-attributed contrast/shared trait.

**Distractor-plan rules (assign traps, don't free-write):** every distractor is an *operation on the
target*, matching the corpus trap profile (overgeneralisation + reversed_causality dominate):
- `reversed_causality`: flip the arrow / swap subject↔object of the target claim.
- `overgeneralisation`: replace the target's hedge with an absolute (*alla/alltid/aldrig/bara*).
- `scope_shift`: answer a neighbouring paragraph, or widen/narrow the target's scope.
- `detail_as_main`: promote a sub-point/example to main point (esp. huvudbudskap).
- `plausible_worldknowledge`: real-world-true but text-unsupported (esp. hållning/inferens).
- `true_but_irrelevant` / `surface_lexical_echo` / `half_right_conjunction`: as garnish, matching
  family profile.

Prefer the top-2 traps for the two "hardest" distractors; the corpus almost always includes at
least one invert-or-absolutise distractor.

---

## Part C — Worked example blueprint instance (specs only — NO passage generated)

> This is what a single blueprint record looks like. It is a *plan*; the passage is authored in the
> gated generation phase and then checked by `anti-plagiarism.md`.

```yaml
blueprint_id: LAS-BP-0001
passage:
  size: short                     # owes 2 questions
  macro_genre: sakprosa
  fine_genre: populärvetenskap
  topic: "urban pollinator corridors and apple-orchard yield"   # novel; not a source topic
  word_count_band: [290, 500]
  target_words: 400
  sentence_count_band: [15, 29]
  mean_sentence_len_band: [14, 25]
  paragraph_count: 4
  lix_band: [48, 54]
  register_markers: [nominalisation, s_passive, one_glossed_term]
  opening_move: result-lede
  title: "<generated, <=12 words, no terminal punctuation>"
  byline: "<generated fictional Swedish author>"
  glossary_tail:
    - "pollinatör = djur som överför pollen mellan blommor"
  structural_skeleton:
    - p1: lede            # result-first: a study found X
    - p2: method_or_case  # how measured
    - p3: finding         # the directional, hedged result  <-- target for Q1
    - p4: nuance_or_caveat # a limitation/concession         <-- target for Q2
questions:
  - family: enligt_texten_detalj
    target_sentence: p3.finding
    target_property: "hedged ('tycks'), directional (corridors -> yield, not yield -> corridors), scoped (apple only)"
    stem_pattern: "Vad var, enligt texten, huvudresultatet av studien?"
    key_derivation: paraphrase(p3) with synonym-shift
    distractor_plan:
      B: reversed_causality      # yield increase -> more corridors
      C: overgeneralisation      # "alla grödor" instead of apple only
      D: scope_shift             # states the p2 method as if it were the result
    n_options: 4
  - family: huvudbudskap_syfte
    target_sentence: [p1.lede, p3.finding, p4.caveat]   # whole-text span
    stem_pattern: "Vilket påstående överensstämmer bäst med texten?"
    key_derivation: claim spanning lede+finding+caveat
    distractor_plan:
      B: detail_as_main          # the p2 method promoted to main point
      C: overgeneralisation      # thesis pushed past the caveat
      D: true_but_irrelevant     # a real fact from p2 that isn't the message
    n_options: 4
verification_required:      # gate — see anti-plagiarism.md
  - length_band
  - lix_band
  - ngram_overlap_vs_corpus
  - named_entity_topic_distance
  - answer_key_uniqueness
```

Note how the **family mix matches the corpus** (1 detail + 1 huvudbudskap for a short passage), how
the passage skeleton is authored *to hold the targets*, and how every distractor is a **named trap
operation on a planted target**, not free invention. That is the discipline the corpus demands.
