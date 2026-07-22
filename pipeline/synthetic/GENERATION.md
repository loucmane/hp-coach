# Generation contract — how to author a unit that survives the gates

This is the **generator's authoring contract**: the distilled, gate-tested laws
for writing one original LÄS or ELF unit that passes the full stack
(`gates/prompts/G-*.md`) and reaches the owner's adjudication queue.

It is deliberately separate from the per-section *blueprints*
(`las/blueprint-template.md`, `elf/blueprint-template.md`), which fix the
measured structural bands (length, genre, family mix). The blueprints say
**what shape** a unit has; this document says **how to write one that a
frontier-model adversary cannot kill**. A generator agent is given: this file,
its section blueprint, `las|elf/families.md`, `gates/bands.json`, and
`gates/schemas/candidate-item.schema.json`. Nothing else.

Every law below was learned the expensive way — from the eval proving rounds
(`gates/evalset/runs/`) and from Batch 1 (`batches/batch1/`). Violations are
not style opinions; each names the gate that kills it.

---

## The ten laws

1. **Particulars, never textbook theses.** Build the passage from
   passage-specific, invented-but-concrete material: fictional researchers,
   places, dated studies, numbers, named mechanisms. A passage anchored on a
   famous real thesis (Ostrom on the commons, Hobsbawm's invented traditions,
   caffeine-blocks-adenosine) produces questions a knowledgeable solver answers
   without reading — **G-STEM** flags/kills those. Corollary: every named
   entity, study, and publication is **fictional** and plausible (Swedish
   academic names for LÄS; publication-neutral for ELF). Real people or
   publications trip **M-PLAGIARISM**'s entity-distance check and the
   attribution rules in `{las,elf}/anti-plagiarism.md`.

2. **Passage and questions are ONE design.** Plant *hedged, directional,
   scoped* claims deliberately, so each distractor can be a named operation on
   a real target: **overgeneralisation** (absolutise a hedge — "ofta" → "alltid"),
   **reversed causality** (invert an arrow), **scope-shift**, **detail-as-main**,
   **half-right-conjunction**. These two — overgeneralisation and reversed
   causality — dominate the authentic corpus. Writing the passage first and the
   questions afterward loses the trap mechanism and yields limp distractors
   **G-DISTRACTOR** notes as trivially easy.

3. **Options PARAPHRASE — never copy.** No option may reproduce a passage
   sentence verbatim or near-verbatim. A copied sentence is a synthetic tell
   **G-REGISTER** kills, and it manufactures a double key **G-DISTRACTOR** and
   **G-KEY** catch (Batch 1's flagged "verbatim-truth trap"). Authentic options
   recast the passage's content in different words.

4. **Exactly one key; prove it by self-blind-solve.** After drafting, solve
   your own questions *skeptically from the passage alone*, actively arguing for
   each non-keyed option. If two options are defensible, the item is
   double-keyed — rewrite until you honestly cannot. **G-KEY** runs this exact
   test twice, independently; **G-DISTRACTOR** runs it a third way. (In the
   eval, seeds that the author could still blind-solve were rejected as too
   weak — the bar is genuine single-answerability.)

5. **Corpus-attested stems only.** Phrase question stems the way the corpus
   does (see `families.md` exemplars): content-anchored — *"Vad menar
   författaren med…"*, *"Vilken hållning ger texten uttryck för…"*, *"What does
   the writer say about X?"*. **Never** generic test-bank phrasing. Concretely:
   *"Which statement is supported by the passage?"* occurs **0 times in 405**
   authentic ELF stems — using it is a **G-REGISTER** tell.

6. **The credited-excerpt frame.** Real HP passages read as excerpts, not
   essays: a short **title** line; a **byline** close on a fictional author
   (~100% of LÄS passages end on one, not a conclusion); a **glossary** line
   (`ord = förklaring`) only if you use specialist terms — and it may **only**
   define words that actually appear in the passage (Batch 1 caught a glossary
   defining *besöksekonomi*, absent from the text). Omit the frame and the unit
   reads as a synthetic blurb. **Structural home:** the title is the `title`
   field (not repeated in `passage`); the **byline and glossary live inside the
   `passage` string** (the schema has no field for them) — byline last, glossary
   at the very tail. They count toward the M-BANDS word/sentence counts (mech's
   sentence splitter keys on `[.!?]` + space + uppercase, so a punctuation-light
   byline/glossary folds into the final sentence — expected; account for it when
   checking `mean_sentence_words`).

7. **Genre first, register follows.** Pick genre before difficulty; register
   and readability inherit from it (literary ~25, journalism ~50, science/law
   60+ on LIX). Do not dial an abstract "difficulty" knob. Sentence length must
   **vary** like real prose (short verdicts beside long subordinated sentences);
   uniform sentence length is an AI tell. *LIX and the register markers
   (nominalisation, -s-passives) are **authoring heuristics judged downstream by
   G-SPRÅK / G-REGISTER**, not mechanical constraints — there is no LIX check in
   `mech.py`. The blueprint's "rejected by the gate" wording refers to the
   band stats that M-BANDS actually enforces (word/sentence counts, option
   ratios); LIX is not among them.*

8. **Native-grade language, read aloud.** Meet the bar that killed the seeded
   defects. **Swedish (G-SPRÅK):** no calques (*spendera tid*, *ta plats framför*,
   *betjänar grödorna*), BIFF word order correct, en/ett and definiteness
   agreement correct, no non-words, no blog/chat register in sakprosa. **English
   (G-ENG):** no preposition calques (*on a conference*), no countability errors
   (*informations*), no false friends (*eventually*←*eventuellt*), hold **one**
   spelling variety (BrE or AmE) throughout a unit — a lone *sat a test* inside
   AmE prose is a flag. Read every sentence aloud as a native before committing.

9. **No manufactured tidiness.** Avoid the frictionless parable where every
   clause serves the thesis, paragraphs open symmetrically, and the argument
   resolves too neatly (Batch 1's `elf-b1-004` drew G-REGISTER's one MAJOR flag
   for exactly this). Authentic passages carry digression, genuine uncertainty,
   and concrete residue that does not all point at the answer. If a passage
   stages a neat binary, it should dismantle it, not just present it.

10. **Spread the keys; respect the bands; kill the length tell.** Vary the key
    letter across a unit's questions — no all-A column, no positional tell
    (**M-SCHEMA**-adjacent, an authenticity tell). **And do not let the key be
    the longest option** — the hedged/qualified correct answer naturally runs
    long, so pad the distractors or trim the key to match; a key that is the
    single longest option in most questions lets a test-wise student score
    without reading (**M-TELL** flags this per unit). **The same trap, hidden:**
    overgeneralisation/quantifier-upgrade distractors are *absolute* ("alltid",
    "samtliga", "every", "proves"), so the key ends up the only *hedged/qualified*
    option every time — "pick the qualified answer" then also scores blind. Break
    the correlation across the unit: on some questions make the key the confident,
    specific claim and let a distractor over-hedge or mis-scope, so "correct" and
    "qualified" do not line up. (This is judgment `pedagogy-review` audits; it is
    not mechanically gated.) Every stat must sit inside its per-section,
    per-format-class band in `gates/bands.json` (**M-BANDS**), and the candidate
    must share no long verbatim n-gram run with the corpus (**M-PLAGIARISM**
    scores the *whole* candidate — title + passage + stems + options — with
    `ngram_kill=17` tokens and an 8-gram containment flag; a corpus-attested stem
    from law 5 is only ~5–7 tokens, safely under the kill length, so reusing the
    stem *form* is fine — never reuse passage *content*). **`gates/bands.json` is
    the only mechanical
    authority** — where the blueprint quotes a tighter range, treat the
    blueprint number as the safer authoring target and `bands.json` as the hard
    pass/fail line.

---

## Per-section unit specs (from the corpus format inventory)

Bands are enforced by `gates/bands.json`; the blueprint carries the full field
list. Question-count is a hard format invariant (M-SCHEMA allows 1–5):

| unit type | words | questions | notes |
|---|---|---|---|
| **LÄS long** | 750–1135 (~995) | 4 | blocks 4+4+2 or 4+2+2+2; ~86% sakprosa |
| **LÄS short** | 290–500 (~400) | 2 | debatt / essä / populärvetenskap |
| **ELF long_passage** | 550–825 (~730) | 5 | main-idea at block **edge** (pos 1 or 5, never mid); 1 load-bearing hedged expert quote; high sentence-length variance |
| **ELF cloze** | 300–401 | 5 gaps | single-word, **POS-uniform** options per gap, often suffix-rhymed (austerity/durability/…); traps = **collocation-misfit** + **polarity-mirror** (upstream "but" demands the negative-pole word); exactly one word idiomatic in context, the rest real words that fail on collocation/polarity/sense |
| **ELF short_text** | 105–160 | 1 | denser concrete residue than its length suggests |

**Family mix** per unit is chosen from `families.md` (e.g. a LÄS long unit:
one detaljhämtning text-ankrad, one innehålls-ankrad, one huvudbudskap/syfte,
one inferens or författarens hållning). **ELF dominant traps:**
quantifier-upgrade of the passage's hedges; **attribution-swap** for tone
items (a quoted expert's stance offered as the writer's).

---

## Output format

One JSON file per unit, validating against
`gates/schemas/candidate-item.schema.json`. **All top-level fields below are
required except `generator_meta`** (optional but expected). Top-level
`additionalProperties` is false — no extra keys:

- `candidate_id`: `(las|elf)-b<BATCH>-<NNN>`. **You do not choose this.** Leave
  the literal placeholder `"PLACEHOLDER"` — an accepted mech sentinel, so a
  self-check with `run_mech.py` on your pre-renumber file passes clean. The
  orchestrator assigns the real id from a shared per-batch counter when it
  renumbers files into `batches/batch<N>/candidates/` (Batch 1's generators
  collided on `las-b1-001`/`elf-b1-001` by numbering independently — see
  BATCH-RUNBOOK Stage 2).
- `section`: `LÄS` or `ELF`.
- `family`: **one required whole-unit string** — a topic-recipe tag like
  `kustekologi-popularvetenskap-short` (convention: `<topic>-<fine_genre>-<size>`).
  Used for family-level kill statistics and adjudication grouping. This is
  **not** per-question.
- `title`: the excerpt's title line (see the frame note in law 6). **Do not
  repeat the title as the first line of `passage`.**
- `passage`: the full passage text, byline and glossary included **inside this
  string** (law 6). Everything here counts toward the M-BANDS word/sentence
  stats, so account for the byline and glossary lines when checking bands.
- `questions[]`: each with `q_index`, `prompt`, `options[]` (exactly A–D),
  `key`, and `rationale`. The question object forbids extra properties — nothing
  else goes here.
  - `rationale` **per question**: why the key is right AND why each distractor
    tempts (name the trap operation). This becomes Layer-2 explanation source
    material downstream — write it fully.
- `generator_meta`: free-form provenance object (`additionalProperties` true;
  the one optional top-level field). Put `origin`, `model`, `date`, and — since
  per-question family cannot live on the question object — the **per-question
  family map**, keyed by **1-based string index matching `q_index`** so
  downstream family-level stats join cleanly:
  `"question_families": {"1": "enligt_texten_detalj", "2": "huvudbudskap_syfte"}`.

Alongside the JSON, write **`gen-<slug>.NOTES.md`** in the same directory:
genre/topic rationale, the planted trap architecture per question, and your
self-blind-solve result.

---

## Self-check before you submit (do all of these)

- [ ] Blind-solved every question from the passage alone; each has exactly one
      defensible answer; key letters are spread.
- [ ] No option copies a passage sentence; stems are corpus-attested.
- [ ] All entities fictional; no famous-thesis anchoring.
- [ ] Credited-excerpt frame present; glossary (if any) defines only words that
      appear.
- [ ] Read aloud as a native — zero calques/agreement/spelling-variety defects.
- [ ] Word count, sentence-length variance, and option-length ratio inside the
      bands; one spelling variety (ELF).
- [ ] `rationale` written per question; NOTES.md written.

---

## Worked reference

`las/reference-unit.json` is one complete LÄS-short unit (passage + 2 fully
optioned questions + rationales + `generator_meta`) that passes all three
mechanical gates — a concrete model of the frame, paraphrase-not-copy options,
and the family/trap structure. Pattern-match against it, don't copy it (its
content would trip M-PLAGIARISM against itself once it's in a corpus). Its
`candidate_id` shows an assigned id for illustration; you emit `"PLACEHOLDER"`.
