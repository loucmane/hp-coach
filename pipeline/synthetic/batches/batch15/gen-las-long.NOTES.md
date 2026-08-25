# gen-las-long — authoring notes (batch15)

**Unit:** LÄS long, 4 questions. `family: garverihantverk-facktext-long`.
**Title:** *Hur en hud blev sulläder*. **Byline:** – Måns Kärrsell, kulturskribent.

---

## 1. Topic and lane

**Barkgarveriets hantverk och ekonomi** i en påhittad svensk köping, 1878–1924:
gropraden och dess ordning, provet som avgjorde när en hud var färdig, vad
garveriets böcker egentligen mäter, och änkans omläggning till sulläder 1898.

Lane check against the 93 excluded families in `BRIEF-ADDENDUM.md`: **none of
them touches hides, leather, tanning or shoemaking.** The two nearest
neighbours were checked explicitly:

- `skogsbruk-hantverkshistoria` (las-b14-001, kolning/tjärbränning) — forest
  crafts. Bark appears here only as a *purchased input* in two sentences
  (bought i famnar from the farms, carted in on the winter roads); there is no
  forestry, no kiln, no burning, and the whole passage sits on a pit yard in a
  köping.
- `isupptagning-ishandel` (las-b14-003) — a seasonal storage trade with a
  ledger. Different craft, different mechanism, and (see §4) a deliberately
  different architecture.

`grep -ril` over all 93 shipped units returns **0 hits** for *garveri*,
*garvar*, and for every name used here.

Genre: `sakprosa / facktext_larobok`, opening move **institutional-case** — a
dated administrative order, not a result-lede. Ten of the fifteen shipped LÄS
longs open on a result-lede; none opens on an institutional case.

---

## 2. Planted targets and trap engineering

Passage and questions were designed together. Each target is **hedged,
directional and scoped**, and each distractor is a named operation on it.

| q | family | target | key | traps |
|---|---|---|---|---|
| 1 | `detalj_ospecificerad` | §1 besvärsskriften 1878 | B | A `plausible_worldknowledge` (cost — explicitly excluded by the text), C `reversed_causality` as fact-inversion (the order was to move *to* a place below the intake, so the pits lay above it), D `surface_lexical_echo` (the smell is in the paragraph, but never attributed to other workshops) |
| 2 | `enligt_texten_detalj` | §3 snittprovet | C | A `overgeneralisation` of time (explicitly refuted: the time could not be computed in advance), B `surface_lexical_echo` of §2's spent-liquor sequence, D `true_but_irrelevant` — weight is named and rejected in the same paragraph |
| 3 | `inference_slutsats` | §4 + §6 (two facts) | D | A `overgeneralisation` of the caveat *with a false reason* (sloppy bookkeeping — never claimed), B `plausible_worldknowledge` (a national norm the text never speaks to), C `reversed_causality` (entry moved to *after* tanning, which would make the figure an under-estimate) |
| 4 | `detalj_ospecificerad` | §8 brevet 1898 | A | B `overgeneralisation` (refuted: soles still wore out and were repaired on site), C `half_right_conjunction` + lexical echo of §2, D `reversed_causality` — the hardest distractor: the same causal chain run backwards |

**The two corpus-dominant traps carry the unit:** `reversed_causality` appears
in three of four questions (q1 C, q3 C, q4 D) and `overgeneralisation` in three
(q2 A, q3 A, q4 B). Q4's D is the flagship: the passage's letter puts the
shoemakers' shift to factory-made uppers *first* and Hulda Kilbrand's decision
*second*; D swaps the order and reads perfectly well to anyone who skimmed.

Q3 is the only genuinely two-fact item: the fourteen months run from
registration-on-receipt to invoicing (§4), and finished sole leather lay on the
drying loft waiting for an order, sometimes half a year (§6). Neither sentence
states the conclusion; subtraction gives it. The passage deliberately does
**not** say "the figure is therefore an outer frame" — that would turn the item
into retrieval, and it would also make distractor A defensible.

**Family mix:** 3 detail + 1 higher-order, i.e. the blueprint's
corpus-frequency target (~75 % detail). Every shipped LÄS long runs 2 + 2; this
one follows the measured distribution instead. The higher-order item sits at
position 3, not 4 — nine of fifteen shipped longs close on a
`huvudbudskap_syfte` item, and this unit closes on a detail item instead.

---

## 3. Self-blind-solve record

Solved from the passage alone, arguing actively for each non-keyed option
before accepting the key. Result: **Q1=B, Q2=C, Q3=D, Q4=A — one defensible
answer each.**

- **Q1.** A is what one expects an appeal to say, and that is exactly why the
  passage says in so many words that the besvärsskrift contains *not one word*
  about cost. C survives only if you read "flytta … till en plats nedanför
  vattentäkten" as a description of where the pits already were. D borrows the
  paragraph's own smell, but the text attributes the complaints to the
  neighbours and notes the decision is silent on them.
- **Q2.** A and D are both raised and rejected within the same paragraph
  (duration cannot be computed in advance; weight is useless because a hide can
  be water-heavy and raw inside). B echoes §2's weak-to-strong sequence but is
  never a readiness sign.
- **Q3.** The item turns on which end of the fourteen months the buffer sits.
  C is the inversion and is refuted by one clause ("skrevs in när den togs
  emot"). A was rewritten during drafting: an earlier version read "siffran
  säger ingenting om hur länge hudarna garvades", which was *arguably*
  defensible and would have risked a MULTIPLE_DEFENSIBLE reading; the shipped A
  adds a reason the passage never gives (careless bookkeeping) and is cleanly
  refutable, since Tunemyr's objection is about *what* was recorded.
- **Q4.** D is the strongest wrong answer in the unit. The refutation is
  chronological and lives in one sentence of the letter: the shoemakers were
  *already* taking factory uppers and orders had thinned two years running,
  which is why the calf line went.

**No question is answerable without the passage.** Every key rests on invented
particulars — the 1878 order and appeal, the cut-corner test as this works
practised it, the two ledger entries, the 1898 letter. The one piece of real
craft knowledge in the passage (a thick hide put straight into strong liquor
case-hardens) is deliberately left **unquestioned**; it is context for Q2, not
a target, precisely so that a solver who happens to know tanning gains nothing.

---

## 4. Architecture — how this differs from the shipped moulds

- **No skeptic, no duel.** las-b13-001, las-b14-001 and las-b14-003 all stage a
  named challenger who disputes a named researcher mid-passage. Here there is
  exactly one modern voice, Ulrika Tunemyr, and she raises the objection
  *against her own source material*. Nobody contradicts her; nothing is
  withdrawn.
- **Thesis shape:** straight reconstruction with genuine residual uncertainty —
  not "the metric measures the wrong thing" (capped at ~1 unit/batch and
  already spent on las-b10-001), not conventional-view-confirmed, not
  rule-of-thumb-vindicated-by-a-modern-trial (that is las-b14-003's spine).
- **Opening:** institutional-case (a dated foreläggande and an appeal), unused
  in the shipped LÄS longs.
- **Coda:** the passage simply stops on a flat concrete line ("Bark sitter kvar
  i fogarna") after a modern-day parking lot. No aphorism, no two-sentence
  close, no "not A, but B" chiasmus.
- **Gender:** male founder, female successor who makes the one strategic
  decision in the passage, female modern historian, male byline. The
  careful-woman/overconfident-man pairing the whole-bank scan found 18/18 times
  cannot occur here, since there is no challenger.
- **Title shape:** a flat descriptive "Hur X blev Y" — not a negation headline,
  not a place-name title ("Ishuset vid Långudden"), not a colon title.
- **Numeric register mixed** deliberately: digits for years (1878, 1893, 1898,
  1924, 1974), spelled-out for craft quantities (sextiotvå gropar, elva
  månader, fjorton månader, trehundra hudar, arton år).

**Deliberate untidiness (law 9):** the 1878 case is never resolved — the smell
that the neighbours actually complained about is dropped and never returns; a
journeyman took part of his wages in leather for ten years; the estate
inventory lists a barometer and a pair of skates; the local history society
holds a bill for four pairs of clogs issued the same week as the order. None of
this serves the argument.

---

## 5. Convention and band compliance

Measured with `gates/scripts/mech.py` (the same tokenizer the gate uses):

| stat | value | band | source |
|---|---|---|---|
| passage words | **922** | 750–1135 (blueprint), 215–1260 (bands.json `long`) | blueprint Part A / bands.json |
| sentences | **61** | ~35–66 | blueprint |
| paragraphs | **10** | 4–17 (blueprint), 1–35 (bands.json) | blueprint |
| mean sentence words | **15.11** | 14–25 (blueprint), 8.2–30.9 (bands.json) | blueprint |
| sentence length range | **3–35** | varied by design | law 7 |
| prompt words | 6 / 9 / 14 / 11 | 3–31 | bands.json |
| option words | max **11** | ≤23 (bands.json), ≤21 (addendum) | bands.json / addendum |
| option length ratio | 1.57 / 1.33 / 1.43 / 1.22 | ≤5.25 | bands.json |
| key is longest option | **never** | must not dominate | law 10 / M-TELL |
| key letters | **B, C, D, A** | spread | law 10 / addendum 1 |

Addendum conventions: **no em dash anywhere** (byline uses a spaced en dash);
**no straight quotes** — in fact no quotation at all, so the ”…” convention is
not exercised; **no semicolons in options**; one **short-breath question**
(q2: 9-word stem, all options 6–8 words). No given name repeats inside the
unit; no name appears in the batch15 registry.

Glossary defines three terms that all occur in the passage in inflected form:
*barklag* (→ "lagen", "stark lag", "barklagen"), *narv* (→ "narven"), *famn*
(→ "famnar", which is why §4 reads "köptes i famnar" and not "famnvis").

**Mechanical self-check:** `run_mech.py` with `--p5-corpus-dir auto` (93 shipped
units indexed) and the authentic corpus at `data/parsed` —
**M-SCHEMA / M-BANDS / M-TELL / M-FORM / M-ECHO / M-PLAGIARISM: 6 × pass.**

---

## 6. Name verification (law 16) — search log, not a certificate

Run 2026-08-25 with **Exa web search**. The session's `WebSearch` budget was
already exhausted (200/200) and Firecrawl returned 401, so every query below
was issued through Exa; each is re-runnable.

| name | query | outcome |
|---|---|---|
| Kilbrand (surname) | `"Kilbrand" surname Sweden person or tannery` | ~10 living Swedish families (Linköping, Timmele, Ulricehamn, Kungsbacka): a PT-studio owner, youth handball rosters, LinkedIn profiles. **No bearer in tanning, craft history or writing.** |
| Valfrid / Hulda Kilbrand | `"Valfrid Kilbrand" eller "Hulda Kilbrand"` | **No hit on either full name**; results were the same living-person listings. |
| Tunemyr (surname) | `"Tunemyr" — real Swedish surname?` | Bearers: Karen Tunemyr (orthoptist, Kungsbacka), Tomas Tunemyr (Anbytarforum), Wilhelm Tunemyr (teacher, former student-paper editor). **None in craft history.** |
| Ulrika Tunemyr | `"Ulrika Tunemyr" hantverkshistoriker` | **No hit on the full name.** |
| Kärrsell | `"Kärrsell" namn` | **No exact hit**; the engine fell back on the different name Kårsell (Älvsjö/Uppsala) and the firm Kårell & Kärras. No journalist, no bearer found. |
| Ödsbol | `"Ödsbol" plats eller namn i Sverige` | **No Swedish locality**; hits were Danish personal names (Odsbøl). Elements are ordinary Swedish; the place is invented. |

**Rejected during the search and therefore NOT used** — recorded because the
rejections are part of the evidence: *Hedeklint* (several bearers, one an
active textile designer — adjacent field), *Törnrud* (a bearer documented on a
museum site), *Vamstad* (an active docent), *Rönnsäter* (several bearers,
incl. an actress), *Nævdal* (established Norwegian surname), *Hyllänge* and
*Skärvsbro* (too close to the real Hyllinge and the real parish Skärv),
*Vretstam* (bearer found; also echoes "Vretberg" in the registry).

Institutions in the passage are **generic types, not named bodies**:
hälsovårdsnämnden, länsstyrelsen, hembygdsföreningen. The only named business
is *Kilbrands garveri*, derived from the invented family name.

No claim above is asserted beyond what the queries returned. Rare Swedish
surnames essentially always have some living bearer; what the law forbids is a
bearer in a *related field*, and none was found for any name used.
