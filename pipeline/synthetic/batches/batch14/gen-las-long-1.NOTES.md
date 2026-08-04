# gen-las-long-1 — NOTES

**Replaces:** `las-b6-001` (fäbodbruk), retired by the 2026-07-30 whole-bank audit as a
sentence-level clone of `las-b5-001`.

**Topic (exclusive slot):** kolning och tjärbränning i skogsbygden — two forest crafts, their
technique, the physical properties of their products, and a live disagreement about why the
charcoal delivery boundary sat where it did.

**Unit spec:** LÄS long · sakprosa / facktext_larobok · opening move `definitional` ·
941 words · 47 sentences · mean 20.0 w/sentence (range 3–42) · 8 paragraphs ·
4 questions · key spread B, D, A, C.

**Frame:** title = flat descriptive with a colon (no colon title exists in the shipped LÄS bank);
byline `— Hillevi Rådmark` with no job title; 3-entry glossary (`stig`, `hytta`, `kronoskog`) —
every glossed word occurs in the passage, and none of the three is already defined inline.

---

## 1. Divergence check vs the anti-model (`batch5/candidates-final/las-b5-001.json`)

Move sequence, side by side:

| # | las-b5-001 (folkbadhus) | this unit (kolning/tjärbränning) |
|---|---|---|
| 1 | **result-lede**: named researcher opens sentence 1; "Svaret blev inte det hon väntat sig" (expectation-defeat) | **definitional/procedural**: how a kolmila actually works. No researcher, no result, no number of studied sites. Researcher does not appear until paragraph 4 (~55 % in) |
| 2 | background: institutional/social history of the institution | **contrast**: the second craft (tjärdal) — different wood, different skill, different season. A comparison, not a backdrop |
| 3 | **method paragraph** confessing patchy sources, closing on a patience aphorism | **mechanism paragraph**: the two products' durability decides the geography. No method paragraph at all; the source caveats are folded into one clause of paragraph 4 |
| 4 | finding + two illustrative cases (one saved, one lost) | evidence: ledger mapping, a ~2-mil boundary, the day-trip sledge calculation, the one-third craft overlap |
| 5 | **counterpoint, penultimate-ish**: male objector alleges reverse causation; researcher concedes selection but **holds** | **counterpoint mid-passage**: female challenger alleges an ownership confound; the researcher **revises and gives her partly right**; her own objection is then partly wounded by the crown-forest case, which she in turn qualifies. Genuinely unresolved, and the passage continues for two more paragraphs |
| 6 | anti-nostalgia both-sides paragraph ("neither glorify nor dismiss") | **non-tidy residue**: the wage arithmetic, children carrying stybb, smoke, a parish complaint about stump grubbing, and a ledger entry from 1868 that **nobody can explain** |
| 7 | **aphoristic chiastic coda** ("inte i dess monument, utan i var det lät sina medborgare tvätta sig") | **the passage simply stops**: a flat physical description of what is still visible in the forest, an inventory number with an honest sampling caveat, and forestry machines ploughing a kolbotten away. No aphorism, no chiasmus, no "inte A, utan B" |

Other axes:

- **Thesis shape.** Anti-model = "the obvious explanation (size/grandeur) is wrong; an unexpected
  institutional factor explains survival" — a near neighbour of the saturated *the-metric-measures-
  the-wrong-thing* shape. Here = **mechanism-is-the-point** (a brittle product and a durable one
  dictate two different geographies), with a **genuinely unresolved** residue on the boundary
  question. No metric is debunked anywhere in this unit.
- **Gender / rightness.** Anti-model = careful woman researcher, overconfident man objector who is
  answered. Here = **male researcher (Assar Bostrand), female challenger (Vendela Nyfeldt)**, and
  the challenger is **partly right**: Bostrand goes back to the deeds and concedes that in two
  parishes the two explanations are inseparable.
- **Opening move.** Every shipped LÄS *long* unit in batches 1–13 opens `result-lede`
  (b1-001, b3-001, b5-001, b6-001, b7-001, b8-001, b9-001, b10-001, b11-001, b12-001, b13-001).
  This one opens `definitional` — the first LÄS long unit in the bank that does not.
- **Question mix.** Anti-model = 2 detail + hållning + huvudbudskap, with a
  "Vilket påstående överensstämmer bäst med texten?" item at q4. This unit = **3 detail + 1
  inference, and no huvudbudskap / no "bäst"-item at all** — which also removes law 11's
  verbatim-true-distractor exposure entirely.
- **Numeric register.** Mixed on purpose: ranges (`sex till nio dygn`, `fem till tolv meter`),
  digit years (`1863 till 1866`, `1868`), spelled-out counts (`fyrtiotvå`, `niohundra`,
  `sjuttiotvå`, `nittio öre`), approximations (`ett par hundra`, `ungefär en tredjedel`).
  Anti-model used one spelled-out sample size plus decade markers.

**Registry check (law 13).** All 12 invented proper nouns were grepped against every JSON in
`pipeline/synthetic/batches/*/candidates*/`: `Assar`, `Bostrand`, `Vendela`, `Nyfeldt`, `Hillevi`,
`Rådmark`, `Grubbfors`, `Hyttfallet(s)`, `Milbo`, `Bräntemåla`, `Kvarnåsen` — **zero hits**. None
of the banned surnames (Öberg, Frisk, Sundqvist, Lindqvist, Åkerlund, Brandt, Halloran, Sahlberg,
Ahlgren, Sundelius), no `Ingrid`, no `Hal-` prefix.

**Phrase blocklist (law 14).** Checked and clear — no "Invändningen kommer genast", no
"medger … men håller fast vid att mönstret återkommer", no "Entydig är bilden inte", no
"Kanske är det, menar X, just i sådana…", no "Det vore lätt att…", no
"Metoden/Materialet har sina hål", no "Vi ser ett mönster, inte en lag". The one place the
anti-model's rhetoric could have leaked — the source-quality clause — is written as a plain
colon list ("Materialet är ojämnt: …") with no aphoristic tail.

**M-ECHO pre-check.** Computed the 6-gram intersection between this whole unit
(title + passage + stems + options) and every shipped `candidates-final/*.json`. Total shared
6-grams: **4**, all of them inside the corpus-attested inference stem
*"Vad kan man, utifrån texten, dra för slutsats om …"* (shared with las-b1-001, b7-001, b8-001,
b10-001, b11-001). That is stem *form* reuse, which law 5 mandates and law 10 explicitly permits
(well under the 17-token kill length). **Zero** shared 6-grams in passage or option text.

---

## 2. Planted trap architecture

The passage was written to hold four targets, each hedged/directional/scoped.

**Q1 — `enligt_texten_detalj`, key B.** Target: p1, the consequence of an undetected leak
(direction: air in → open burning → load lost; scope: "ett par timmar räckte").
- A `reversed_causality` — the mila *cools* and the wood stays half-charred. Tempting to a reader
  who assumes a hole in a cover lets heat *out*.
- C `scope_shift` — brittleness and crumbling on transhipment is p3's property of charcoal, not
  the consequence of a leak.
- D `overgeneralisation` — "ofelbart … oavsett hur snabbt kolaren hinner ingripa" absolutises the
  hedge and contradicts the stated reason the collier sleeps beside the mila.

**Q2 — `enligt_texten_detalj`, key D.** Target: p3, the durability asymmetry (charcoal brittle →
short winter haul; tar stable → long water carriage).
- A `reversed_causality` — swaps the two products' properties outright.
- B `overgeneralisation` — "enbart i hyttans omedelbara närhet" / "var som helst i landet"
  absolutises a ~2-mil radius and ignores that tar too was bound to navigable water.
- C `plausible_worldknowledge` + lexical echo — the resinous pine is real in the text, but nothing
  says such pine only grew far from the ironworks; the text explains the spread by transport.

**Q3 — `detalj_ospecificerad` (anchored on a named person), key A.** Target: p5, Nyfeldt's
objection.
- B `reversed_causality` — has ownership follow the sledge radius, i.e. turns her objection into a
  *support* for Bostrand.
- C `overgeneralisation` — she questions what this map shows, not ledgers as a source class;
  "aldrig … något säkert" is a methodological nihilism the text never attributes to her.
- D `surface_lexical_echo` — the finkol deduction is in p4, but she says nothing about units of
  measure.

**Q4 — `inference_slutsats`, key C.** Requires combining p2 (the two crafts' peaks fall in
different halves of the year) with p4 (about a third of the charcoal suppliers also sold tar).
- A `reversed_causality` in the explanatory link — derives the combination from shared competence,
  which p2 explicitly denies ("annat virke och annat kunnande"; the two skills are located in
  different operations).
- B `overgeneralisation` — "så gott som varje torparhushåll" against the stated ~one third.
- D `plausible_worldknowledge` — the work barely paid and deductions existed, but the text never
  says the deductions *grew* or that they drove households into tar burning.

**Hedge balance (law 10).** Keys are hedged on 2 of 4 questions (Q3 "kan visa", Q4 "framför allt")
and flatly assertive on the other two (Q1, Q2). Distractors carry hedges in three of four
questions (Q1 C "ofta", Q2 C "nästan överallt", Q4 D's bounded causal chain), and absolutes sit on
distractors in all four. "Pick the qualified option" scores 2/4 — chance.

**Length tell (law 10 / M-TELL).** Option token counts: Q1 [15,15,15,13], Q2 [15,18,17,15],
Q3 [16,16,14,17], Q4 [20,15,15,16]. The key is never the single longest option (Q1 is a
three-way tie at 15); M-TELL passes.

---

## 3. Self-blind-solve

Solved the whole sheet twice: once passage-blind (form / world knowledge only), once from the
passage alone, arguing actively for each non-keyed option.

**Passage-blind pass.** Q1 is not solvable without the text — A, B and C are all physically
coherent stories about a covered charcoal pile, and eliminating D on its absolutism leaves three.
Q2 is not solvable: A and D are exact mirror images, so form gives no purchase, and C is a
perfectly reasonable forestry claim. Q3 requires knowing which of two named researchers said what.
Q4's A ("same skills") is arguably the *more* intuitive answer without the passage, so the item
punishes the blind solver rather than rewarding him. No key is the longest option; key letters are
spread B/D/A/C; no positional pattern.

**Passage pass.** Q1 = B, Q2 = D, Q3 = A, Q4 = C. Each has exactly one defensible answer; the
closest challengers were Q2 A (defeated by the direct statement that charcoal is brittle and tar
keeps) and Q4 D (defeated because the text never states growing deductions or a causal push into
tar burning).

**Cross-question corroboration.** The four keys assert four different propositions — (1) the fire
physics of an undetected leak; (2) product fragility versus haul distance; (3) Nyfeldt's ownership
counter-explanation; (4) seasonality as the enabler of a dual craft. No key can be inferred from
another. Q2 and Q3 sit closest, but Q2's key is a transport mechanism and Q3's key is a *rival*
explanation for a different fact (the delivery boundary), and neither option set reveals the
other's content: Q3's distractor B is the *reversed* transport story, so a solver who has Q2 right
gets no shortcut on Q3. Q4 draws on paragraphs (p2 seasons, p4 household overlap) that no other
question touches.

## 4. Mechanical self-check

`run_mech.py` on this file: **M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass ·
M-PLAGIARISM pass** (`candidate_id` left as the `PLACEHOLDER` sentinel for the orchestrator's
renumbering pass).

Band compliance: 941 words (LÄS long band 750–1135, blueprint target ~995; bands.json 215–1260);
mean sentence 20.0 (blueprint 14–25; bands.json 8.2–30.9) with a 3–42-word spread for rhythm;
8 paragraphs (4–17); prompt lengths 10–16 tokens (3–31); option lengths 13–20 tokens (0–23);
max option-length ratio 1.33 (cap 5.25).
