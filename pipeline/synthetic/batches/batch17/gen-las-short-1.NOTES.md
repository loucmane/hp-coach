# gen-las-short-1 — authoring notes

**Unit:** LÄS short, debattartikel, 2 questions.
**Family:** `farthinder-villagator-debatt-short`
**Title:** Vad som händer mellan två farthinder
**Byline:** Berit Kvedberg, trafiklärare i Möcklinge

---

## 1. Domain lane and topic

**Topic: farthinder (speed humps) on municipal residential streets — specifically the
*spacing* between them.** The tekniska nämnd in the invented kommun Möcklinge proposes
removing every other hump on three villagator to save maintenance money and answer noise
complaints; a driving instructor argues the proposal will raise both speed and noise.

Lane check against the brief's taken list (skolbibliotek, hundrastgårdar, grannsamverkan,
toaletter, läxor, flaggsed, skolmat, nattåg, dialekt, medborgarforskning, hemberedskap,
cykelpendling, kontanter, gatunamn, halltider, skolskjuts): no overlap. Of the five
candidate lanes offered I rejected **övergivna cyklar vid stationer** (grazes
`cykelpendling-debatt-short`, which is on batch17's exclusion list and owns the whole
`cykel*` vocabulary) and **torghandelns avgifter** (`torg` is load-bearing in las-b9-003 via
*torgur*, and las-b9-002 already owns the municipal-signage/street-level-identity lane).
Verified by grep over `batches/`: `farthinder`, `gupp`, `villagat`, `hastighetsdisplay`,
`trafiklärare`, `farthinder`, `hastighetsdämp` — **zero occurrences** in the bank.

Genre chosen first (law 7): `sakprosa / debatt_opinion`, so register follows — normative
modality (*bör*), explicit first person, explicit stance, nominalisations
(*besparingen, inbromsningen, gaspådraget, trafikökningen, ledningsgrävning*) and
`-s`-passives (*togs, sattes, anges→är två, beräknas, syns, avslås, lyftes, anmäldes,
glesas*).

---

## 2. Structural skeleton and the anti-clone diff

| ¶ | role | content |
|---|---|---|
| 1 | definitional / mechanism-lede | what a driver actually does at a hump: brake ~30 m before, roll over at 20, back on the throttle before the rear wheels clear |
| 2 | institutional case | the February proposal, its two stated reasons, its 150 000 kr saving |
| 3 | finding | the accidental natural experiment on Tunbergsvägen (2022 utility dig removed 3 of 7 humps; spacing 65 m → ~140 m) and what the roadside displays logged |
| 4 | nuance / caveat | the named technician's three limitations and his own quoted hedge |
| 5 | counterpoint, turned | the noise complaint granted in full, then turned by the *same* mechanism |
| 6 | implication | a cheaper counter-proposal plus an explicit falsification condition |

**Diffed against all 17 shipped/in-flight LÄS debatt units** (b1-002, b2-002, b3-002,
b4-003, b5-003, b6-002, b7-002, b8-003, b9-002, b10-002, b10-003, b11-002, b12-002,
b12-003, b13-003, b15-002, b16-002). Deliberate departures:

- **Opening.** A mechanism description in the writer's professional eye. None of the 17
  opens on mechanism; the bank's openers are `Varje gång/Varje år…` (4), `Diskussionen om X
  förs som om…` (2), definitional negation (3), decision-already-taken (2), scene (1),
  institutional-case (2).
- **Thesis shape.** Mechanism-is-the-point (spacing governs speed, and the *same* spacing
  governs noise). Explicitly **not** "the metric measures the wrong thing" — law 12 caps
  that at ~1 unit/batch and the bank is saturated with it.
- **Evidence source.** The municipality's own roadside speed displays plus an accidental
  natural experiment. Not a fictional institute (11 of 17 use one), not an auditor
  (b15-002), not an internal coordinator (b16-002), not the writer's own inventory
  (b13-003).
- **Skeptic slot.** One named source who is *more cautious than the writer*; she concedes
  his confound (traffic growth) without abandoning the direction. She neither overrules him
  (b9-002) nor rewrites her proposal because of him (b15-002).
- **Objection handling.** No paragraph opening `Invändningen…` (law 14; 5 shipped units do
  it). The noise complaint is granted in full and then turned — the complainants turn out
  to live on precisely the street whose spacing already doubled.
- **Close.** A falsifiable offer: a cheap counter-proposal (the three lifted rubber humps
  are still in the council store) plus a stated condition under which she is wrong. No
  aphorism (8 units), no "not A, but B" chiasmus (law 12 retired), no concrete demand on
  the council (4 units), no flat administrative fact (b15-002 and b16-002 — mine would have
  been the third consecutive).
- **Surface (law 15).** Title is a flat nominal-clause descriptive — not a negation
  headline, not article-led. Numeric register mixed: *ett trettiotal*, *ett par tusen*,
  *sextiofem*, *drygt hundrafyrtio*, *hundrafemtiotusen*, *nittio*, and the digits
  *29 / 34 / 28 / 2022*. Credential is a **count of pupils**, not a `Jag har X i N år`
  tenure claim.

---

## 3. Planted targets and trap architecture

### Q1 — `detalj_ospecificerad` · "Vad visar loggarna om farten på Tunbergsvägen?" · **key B**

**Planted target** (¶3): *directional* (removing humps → speed rose, not speed → removal),
*scoped* (only the straight stretch north of the school; the curved southern stretch shows
nothing; Myrsjövägen is unchanged at 28), and quantified (29 → 34).

| opt | trap | operation |
|---|---|---|
| A | `reversed_causality` | inverts the order: speed explains *where* humps were removed. The passage says a 2022 utility dig removed them and never restored them. |
| **B** | **key** | paraphrase + one arithmetic step (34 − 29 = 5). Scope carried by the place name, not a hedge word. |
| C | `overgeneralisation` | stretches the finding to "hela gatan", refuted by the single sentence about the curved southern stretch. The strongest rival — this is the discriminating read. |
| D | `scope_shift` / half-true conjunction | 28 is true of Myrsjövägen, false of Tunbergsvägen's straight section (34), so the conjunction fails. |

### Q2 — `forfattarens_hallning` · "Vad anser textförfattaren om nämndens förslag?" · **key C**

**Planted target** (¶3 + ¶5 + ¶6): both halves of her objection are asserted outright — speed
rises when spacing grows, and the noise lives in the braking and the throttle, both of which
grow with the run-up distance.

| opt | trap | operation |
|---|---|---|
| A | `plausible_worldknowledge` (hedge-lure) | "postpone and measure more" is the responsible-sounding middle, and the text *does* mention an April reading — but two consecutive sentences refuse it, and the April reading evaluates her own counter-proposal. |
| B | `half_right_conjunction` | speed half correct, noise half inverted — exactly the conclusion she refutes. Half of it is lifted from the text, which is what makes it tempting. |
| **C** | **key** | flat, unhedged, spans both limbs of the argument. |
| D | `plausible_worldknowledge` | a common municipal-politics position with no textual anchor; also hard to square with her going against the four households that complained. |

**Law 11 check:** no distractor is verbatim-true. Every one carries a flaw a careful reader
can point at.

---

## 4. Hedge map (rule 10)

| q | key form | cautious-sounding option | does "pick the qualified answer" work? |
|---|---|---|---|
| 1 | flat numeric assertion ("stigit med fem kilometer i timmen"); scope sits in a place name, not a reservation word | none; the absolute C is wrong and so is the flat A | **no** |
| 2 | flat, unhedged | **A** ("skjutas upp för fler mätningar") — wrong, explicitly refused in ¶6 | **no** |

**Balance: 0 of 2.** Well inside rule 10's ≤ half ceiling, and rule 10's positive
requirement (at least one question where the key is flat and a cautious distractor is
wrong) is met by Q2. Q1 also avoids handing the test-wise student the usual
absolute-versus-hedged split.

**Key spread:** B, C — no A anywhere, no positional column.
**Short-breath question (rule 5):** Q2 — 6-word stem, options 7/8/7/7 words, all ≤ 8.
**Key-length check (law 10):** Q1 key 11 words against a longest of 13; Q2 key 7 against a
longest of 8. The key is never the longest option.

---

## 5. Self-blind-solve

Solved both from the passage alone, arguing actively **for** each non-keyed option before
accepting the key.

**Q1 = B.** A needs the passage to say humps were removed where speed was highest; it says
the opposite mechanism, so A has no anchor at all. C was the option I had to work hardest
to kill, and it dies on exactly one sentence — *"På den krokiga södra delen syns ingen
skillnad alls"* — which is the intended discriminating read rather than a lexical match. D
is true of one street and false of the other. The key requires a subtraction, so it cannot
be matched by surface overlap. Single defensible answer.

**Q2 = C.** A is the one I argued hardest for, because the passage genuinely does ask for an
April reading; it dies on *"Jag begär ingen ny utredning, och jag tycker inte att nämnden
ska vänta. Förslaget bör avslås i februari."* and on the fact that the April reading
evaluates her counter-proposal rather than deferring the council's decision. B is
half-anchored and half-inverted, refutable from the gaspådrag mechanism. D has no anchor.
Single defensible answer.

**Cross-question leak.** Q2's key entails that speed rises when humps are thinned — which is
compatible with **both** Q1's key (B) and Q1's strongest distractor (C). The stance question
therefore does not settle the scope question, and Q1's key says nothing about her stance on
noise. No leak in either direction. *(This is the failure mode that cost batch11 a
cross-question corroboration; it was checked deliberately.)*

---

## 6. Language pass

Read aloud as a native. **Every compound was checked individually for foge-s** — the sibling
batch15 debatt unit died on a missing one:

`farthinder` (no -s, cf. fartgräns) · `villagata/villagator` (no -s) · `gummihinder` (no -s)
· `plogbil` (no -s) · `bakhjul` (no -s) · `gaspådrag` (no -s) · `trafikökning` (no -s) ·
`personbil`, `lastbil` (no -s) · `mättekniker` (no -s) · `vägkant` (no -s) · `trafiklärare`
(no -s) · `medelfart` (no -s) · **`hastighetsdisplay` (-s, cf. hastighetsgräns)** ·
**`ledningsgrävning` (-s, cf. ledningsarbete)** · **`Tunbergsvägen` (-s, two-element first
member)** · `Myrsjövägen`, `Furuvägen` (vowel-final first member, no -s) ·
`gatukontor` (gata → gatu-).

BIFF checked on every subordinate clause (*eftersom försöket redan är gjort*; *där hindren
blivit färre*; *hur mycket vi än har pratat*). Two V1 conditionals with correct word order
(*Glesas raderna ut … får de boende…*; *Har farten då inte sjunkit har jag haft fel*).
Quotation uses Swedish curly quotes ”…” (rule 2). **Zero em dashes**; the byline uses a
spaced en dash (rule 3). Options carry no semicolons and none exceeds 21 words (rule 5).
Glossary defines exactly one term, `hastighetsdisplay`, which does appear in the passage
(law 6).

---

## 7. Mechanical self-check

`python3 gates/scripts/run_mech.py batches/batch17/gen-las-short-1.json --parsed-dir
/home/loucmane/dev/hpfetcher/data/parsed --p5-corpus-dir auto`
(the p5 worktree has no `data/parsed`; the authentic corpus was taken from the main repo)

| gate | verdict |
|---|---|
| M-SCHEMA | **pass** |
| M-BANDS | **pass** |
| M-TELL | **pass** |
| M-FORM | **pass** |
| M-ECHO (107 shipped units indexed) | **pass** |
| M-PLAGIARISM | **pass** |

| stat | value | blueprint (short) | bands.json (short) |
|---|---|---|---|
| passage_words | **470** | 290–500 | 188–588 |
| sentence_count | **29** | 15–29 | not gated |
| mean_sentence_words | **16.21** | 14–25 | 10.1–36.5 |
| paragraph_count | **7** | 3–13 | 1–20 |
| prompt_words | 7 / 6 | — | 3–31 |
| option_words | 10–13 / 7–8 | — | 0–23 |
| option_length_ratio | 1.30 / 1.14 | — | ≤ 5.25 |

Sentence-length distribution: 3, 5, 6, 7, 8, 9, 9, 10, 11, 12, 12, 12, 12, 13, 13, 13, 14,
16, 17, 18, 19, 19, 23, 24, 25, 27, 30, 40, 43 — genuine prose variance, no uniform-length
tell. (The 40 and 43 are the splitter artefact GENERATION.md law 6 describes: a
punctuation-light paragraph boundary folds two sentences together.) A first draft measured
30 sentences; since the shipped short units top out at 29, two clauses in ¶3 were merged to
sit inside both the blueprint band and the bank's observed maximum.

---

## 8. Name verification (law 16) — search log, not a certificate

**Tooling, stated honestly.** `WebSearch` was **unavailable** — both calls returned *"this
session has used its web search budget (200 of 200 WebSearch calls)"*. Per the batch17
addendum's fallback recipe I attempted Mojeek: **all four Mojeek queries returned HTTP 403**
to WebFetch, and `firecrawl_search` returned **HTTP 401** (unauthenticated). The two indices
actually used were **(i) the sv.wikipedia search API with `srsearch` as a quoted exact
phrase** and **(ii) Exa `web_search_exa`** (semantic, not exact-phrase). All kept names are
**flagged for V-FINAL re-verification**; nothing here is certified fictional.

**Rejected on evidence (none used):**

1. **Ferneborg** — `srsearch=%22Ferneborg%22` → `totalhits 9`, first title **"Roland
   Ferneborg"**. Real Swedish surname with a documented bearer.
2. **Klevsta** (candidate kommun) — sv.wikipedia → `totalhits 0`, **but** Exa surfaced
   Sörmlands museums samlingar documenting *Klevsta Norrgård*, *Klevsta Mellangård*
   (kronojägarboställe until 1921) and *Klevsta Södergård*. A real Sörmland hamlet. **This
   is a worked instance of the addendum's false-zero warning** — one index said 0 for a
   place with a museum archive.
3. **Hjortmar** — Exa surfaced Ann-Sofie and Peter Gerth Einar Hjortmar (Hjortmar Handel AB,
   org.nr 559212-4183, Skövde), Christian Hjortmar, and hjortmars.se. Real.
4. **Brinkhage** — Exa surfaced Nils Arne Jörgen Brinkhage (b. 1969) and Birgitta Theresia B
   Brinkhage of Brinkhage Träd & Trädgård AB (org.nr 556936-7922, Norrtälje), plus Catrine
   Brinkhage. Real.
5. **Hörnsala** — no bearer surfaced, rejected on style (the Hörn- element is live in the
   real Hörnsjö, Hörnefors, Hörnsjöfors).

**Kept, with the limits of the evidence stated:**

- **Kvedberg** (Berit Kvedberg) — sv.wikipedia `totalhits 0`; Exa returned only semantic
  near-neighbours (Kviberg, Kviding, Kvartsberg, Kvarnberg, Kugelberg). A second Exa query
  returned seven real Swedish *trafiklärare* profiles and an unrelated Berit — i.e. the
  index resolves this exact occupation and given name, and surfaced no Kvedberg.
- **Skedvall** (Stellan Skedvall) — sv.wikipedia `totalhits 0`; Exa returned only
  near-neighbours (Skandevall, Sedvall, Skedevi, Skedviken, Skedda). **Noted honestly: the
  real surname *Sedvall* exists and Skedvall differs from it by one letter** — a reviewer
  may want to weigh that.
- **Möcklinge** (kommun) — sv.wikipedia `totalhits 0`; Exa returned only generic ortnamn
  reference pages plus the unrelated Möckelsbodar.

**Positive controls** (both indices demonstrably resolve small/rare Swedish entities, so the
zeros are informative rather than artefacts): sv.wikipedia returned `totalhits 9` for
*Ferneborg* and `totalhits 10` for *Ulvsjö* (a kyrkby in Nyhems socken, Bräcke kommun); Exa
independently resolved Klevsta, Hjortmar and Brinkhage to real registered people and
companies.

**Street names — explicitly not claimed unique.** Tunbergsvägen, Myrsjövägen and Furuvägen
are ordinary Swedish street-name formations and near-certainly occur in real municipalities.
They were **not** verified and no uniqueness is asserted. They sit inside an invented kommun,
so no real place is given an invented history and no real address is described.

**Registry / rule 8 & 9 check** (grep over `batches/`, case-insensitive): `Tunberg`,
`Myrsjö`, `Furuväg`, `Kvedberg`, `Skedvall`, `Möcklinge`, `Stellan`, `farthinder`, `gupp`,
`trafiklärare`, `hastighetsdisplay` → **zero occurrences**. `Berit` appears only inside
las-b15-002's own `originality_note`, where *"Berit Kvarnås"* is logged as a **rejected**
candidate — it was never used in a shipped unit, consistent with Berit's absence from the
batch17 list of 231 used given names. `Stellan` is likewise absent from that list. Neither
full pair appears among the 274 excluded pairs, and the two given names are distinct from
each other (rule 8's within-unit clause). Genders are assigned against the saturated
careful-woman/overconfident-man pattern: the assertive arguer is the woman, the cautious
data-holder the man.

---

## 9. Residual risk for the adjudicator

- Names are **unverified by exact-phrase search** (WebSearch exhausted, Mojeek 403,
  firecrawl 401). Kvedberg / Skedvall / Möcklinge need V-FINAL re-verification;
  *Skedvall*'s one-letter distance from the real *Sedvall* is the sharpest of the three.
- Q1's key requires a 34 − 29 subtraction. I judge this within LÄS norms (the corpus asks
  for comparable small steps) and it is what stops the key being a lexical match, but it is
  the one place a reviewer might call the item arithmetic rather than reading.
- ¶5's `Glesas raderna ut …` is a V1-conditional s-passive: correct but stylistically
  elevated. It is deliberate register for debatt sakprosa, not an accident.
