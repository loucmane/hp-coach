# gen-elf-long-2 — ELF long_passage_5q, "Inside the Bell at Kerrig"

**Slot:** replacement for retired `elf-b7-001` (submarine cables), which was retired as the third
instance of the `elf-b5-001` mould.
**Topic (exclusive):** the economics and craft of church bell founding and tuning.
**Family tag:** `klockgjutning-craft-reportage-long`. Genre: workshop-visit craft reportage,
society-commentary register, BrE throughout (`mould`, `neighbours`, `tonne`, `metres` not used but
no AmE forms present).

## 1. Divergence check against the anti-model (`batch5/candidates-final/elf-b5-001.json`)

Move-by-move diff. Left column is the anti-model's architecture as read off the passage; right
column is this unit's.

| move | elf-b5-001 "The Cullet Ceiling" | this unit |
|---|---|---|
| opening strategy | claim-frame: "the pitch to any glassmaker has run the same way…", then the announced blind spot "What the story mostly skips is…" | in medias res physical scene: a 240-kilo bell turning on the lathe, a curl of bronze coming off, the note dropping a few cents. No claim frame, no announced blind spot. |
| what paragraph 1 does | states a widely believed thesis in order to qualify it | teaches a mechanism (five partials; each answers to a band of metal; thinning lowers it; nothing raises it) and digresses on the strike pitch the ear assembles |
| evidence pattern | one designed experiment (matched melting campaigns) with a linear result and a threshold | no experiment in the argumentative slot at all; paragraph 2 derives cost consequences from the mechanism, and the only empirical episode (a 2019 blind hanging) arrives late and is explicitly thin |
| thesis shape | "the metric everyone quotes measures the wrong thing" (not how full the batch is, how clean) — the shape the brief bans as saturated | mechanism-is-the-point + genuinely unresolved: the one-way arrow explains the money, and the tolerance question is left open |
| skeptic slot | penultimate; one overconfident challenger with an absolute quote ("always, on every batch"), rebutted by the careful lead | mid-passage (¶3–4); the two founders disagree with each other and neither is rebutted; the challenger is the one the only evidence favours |
| gender pattern | careful woman scientist vs overconfident man (the bank's 18-for-18 default) | careful **man** (Emil Wachter, hedges: "One afternoon, one tower, bells of different weights") vs assertive **woman** (Vivienne Kunert), who is partly vindicated |
| closing cadence | verdict paragraph ("read whole, more divided than Feld's rule allows") + aphoristic two-sentence chiastic coda ("not how full the batch is. It is how clean.") | **no verdict paragraph at all**; the passage ends on contractual and physical residue — the order form's bland clause, a four-kilo difference at the pour, and a bin of turnings about a third full. It simply stops. |
| main-idea item position | Q1 (edge, front) | Q5 (edge, back) |
| furniture | byline **and** two-line glossary | byline kept, **glossary dropped**; the specialist terms (hum, prime, nominal, cents, allowance, turnings) are glossed inline in the prose |
| title form | "The Cullet Ceiling" — The + modifier + noun | "Inside the Bell at Kerrig" — prepositional place-name title |
| numeric register | percentages throughout (3%, 60%) | weights, cents, dates, ordinals, spelled-out and digit forms mixed; **no percentages** |

Phrase-family check (law 14): none of the burned families appear, and the two that the anti-model
uses verbatim ("What the story mostly skips", "There is no such thing as too…", "is more divided
than X's rule allows", "The number that matters, in the end", "…like to admit") are absent in any
variant.

Mechanical confirmation: `run_mech.py … --p5-corpus-dir auto` (87 shipped units indexed) returns
**M-ECHO pass** — zero 6-gram echo above threshold against any shipped unit and zero name reuse.

## 2. Registry-safe names (law 13)

Greped against `batches/*/candidates-final/*.json`: `Wachter`, `Kunert`, `Quennell`, `Kerrig`,
`Ambrey`, `Cawden`, `Coyle`, `Vivienne`, `Alastair`, `Emil` — **zero hits each**. None of the
banned given names/prefixes (Ingrid, Hal-) or banned surnames (Öberg, Frisk, Sundqvist, Lindqvist,
Åkerlund, Brandt, Halloran, Sahlberg, Ahlgren, Sundelius) is used. Motifs avoided: no ledger study,
no weakest-link chain, no institution-in-decline.

## 3. Planted trap architecture

| q | family | key | anchor | distractor traps |
|---|---|---|---|---|
| 1 | ELF-TYPE-001 | D | ¶2, the billing sentence and the thirty-kilo / one-tonne pair | A quantifier_upgrade ("always"), B outside_knowledge (single all-in price per kilo), C reversed scaling (lathe time assumed proportional to weight) |
| 2 | ELF-TYPE-001 | B | ¶3, "She tunes the hum, the prime and the nominal closely…" | A role_or_attribution_swap (Wachter's four-cent tolerance and his records given to Kunert), C outside_knowledge (mould-side thickness control), D swapped particulars (minor third and hum exchanged) |
| 3 | ELF-TYPE-002 | A | ¶1 one-way arrow + ¶2 allowance + ¶5 "four kilos apart at the pour" | B too_literal (restates the mechanism), C too_far (fittings and frame, two steps out), D quantifier_upgrade + attribution swap (Kunert's argument hardened into "any"/"always") |
| 4 | ELF-TYPE-005 | C | ¶4, "There is some evidence for her" and "He adds, reasonably enough…" | A direction lean, **measured in form** (hedge-balance partner for the key), B polarity error ("can never settle" contradicts the named settling experiment), D role_or_attribution_swap in the other direction |
| 5 | ELF-TYPE-004 | D | whole text | A scope_error (one half of the cost comparison promoted to the point, and wrong at the top of the range), B surface_word_match (turnings vocabulary into a claim about founders misjudging), C outside_knowledge (title-plausible craftsmanship piety) |

**Hedge balance (law 10 / M-FORM):** Q4 carries two measured options (A and C), so "pick the only
qualified answer" does not decide it. Elsewhere the keys are confident and specific (Q1 a two-ended
comparison, Q2 a count, Q3 a physical necessity), while absolutes sit on distractors at Q1/A, Q2/A
and Q3/D — so "correct" and "hedged" do not line up across the unit.

**Length tell (M-TELL):** the key is the strict-longest option in **0 of 5** questions; per-question
option ratios run 1.12–1.36, well under the ELF cap of 2.36.

## 4. Self-blind-solve

Solved the whole sheet as a passage-blind reader first, then from the passage alone, arguing
actively for each non-keyed option.

- **Passage-blind:** no question resolves. Q1 has three internally coherent cost stories; Q3's key
  is not derivable without knowing that tuning is subtractive *and* that the allowance is cast in;
  Q4 needs the writer's two evaluative markers; Q5's distractors are all topic-plausible. The
  form heuristics fail: "longest option" scores 0/5, "only hedged option" scores 0/5 on Q4, and
  "strip the absolutes" leaves 2–3 survivors in every set.
- **From the passage:** Q1=D, Q2=B, Q3=A, Q4=C, Q5=D — 5/5, and in each case exactly one option
  survived. The near-miss checked hardest was Q3/B, which is true but is retrieval, not
  implication, and Q4/A, which is as cautious in wording as the key but attributes a lean the
  passage never takes.
- **Cross-question corroboration:** the five keys assert five different propositions — the cost
  flip with bell size (Q1), Kunert's three-partial method (Q2), the casting allowance as a
  precondition (Q3), the writer's refusal to adjudicate (Q4), the whole-text focus (Q5). No key
  states or entails another; Q5's key deliberately names the strands without reporting the
  dispute's outcome, so it does not hand Q4.

## 5. Band compliance

`run_mech.py` with `--p5-corpus-dir auto`: **M-SCHEMA pass, M-BANDS pass, M-TELL pass, M-FORM pass,
M-ECHO pass, M-PLAGIARISM pass.**

Measured: 738 passage words (ELF long_passage band 332–873; blueprint target 690–740), 5
paragraphs, mean sentence length 27.3 words (band 14.9–35.4), sentence-length SD 18.2 with a 4-word
floor ("Nothing pulls it back up.", "The turnings are not lost.", "That correction is cheap.") and
long subordinated sentences above 50 words. Prompt lengths 6–14 tokens; option lengths 14–21
tokens. Note the two quotation-initial sentences fold into their predecessors under `mech.sentences`
(the splitter requires an uppercase letter after the period, and a `"` blocks it), as does the
byline — the same expected artefact law 6 describes.
