# gen-las-essa — LÄS short, essä/kulturhistoria

**Family:** `kyrkbatslag-roddordning-essa-short`
**Title:** Sätena i kyrkbåten
**Size/genre:** short (2 questions) · sakprosa · essa_kulturhistoria · opening move = scene
**Mech self-check:** all six gates PASS first run (M-SCHEMA, M-BANDS, M-TELL, M-FORM, M-ECHO vs 114 shipped units, M-PLAGIARISM), 415 passage tokens.

---

## 1. Topic and lane

**Topic:** the rowing order of a church-boat crew (kyrkbåtslag) on an invented
lake, and what the seat assignment did or did not reveal. The essayist walks the
two available readings — seats as a floating map of parish rank (largest
hemman by the stern, per a fictional 1962 archival study), versus seats as pure
boat-trim and stroke mechanics — and honestly cannot decide, because the same
protocol lines support both.

**Why this topic (the brief offered three):**

- **(a) brevlådornas tömningstider** — *rejected.* Grazes two shipped families
  at once: `postvasende-landsbygdshistoria-facktext-long` (postal history) and
  `offentliga-ur-essa-short` (public time-signals structuring a town's day —
  the tömningstid essay's whole payload is exactly city-rhythm-by-clock).
- **(b) namnsdagslistans revisioner** — *rejected.* The exclusion list carries
  `namnsdagsseden-essa-short` outright; a revisions angle is the same lane.
- **(c) kyrkbåtslagens rodd-ordning** — *taken.* Nothing in the 121 excluded
  families touches boats, rowing, or church-going logistics. Closest shipped
  neighbours are `kyrkorgelhistoria-essa-short` (church music instrument — a
  different domain) and the fäbod/sockenmagasin rural-institution units, none
  of which the passage's material (trim, takt, mantal, bänk-ordning analogy)
  overlaps. Explicitly avoided the brief's shipped-topic fence: no
  skolplanscher, midsommar, sockenmagasin, ishus, fäbodar (no fäbod vocabulary
  anywhere; the boat is stored in a **båthus**, not a magasin).

## 2. Architecture (law 12 + brief's architecture directive)

Diff against the sibling essä `las-b17-003` (Tjugo sidor anvisningar), the
nearest shipped mould:

| axis | las-b17-003 | this unit |
|---|---|---|
| thesis shape | settles ("förändringen var avsiktlig") | **genuinely unresolved** — no settling turn; both suspicions stated as un-provable |
| skeptic slot | external collector (Bråtemo) doubts the essayist | **the essayist doubts themselves** ("min egen läsning byter håll"); no external challenger exists |
| concession phrasing | "Det är svårt att komma ifrån." (now burned) | "går inte att lägga undan" / "går inte heller att belägga" — different constructions |
| coda | object-close on the last item of the collection | **flat factual close on archive silence** (kommunalstämman 1911 minutes skip the last rodd; agenda = vägkassan). Not aphoristic, no chiasmus, no closing question |
| evidence pattern | one collector's corpus, one measured proportion | one archival study + the essayist's own counterexamples (drängar at the aktertoft) |

Blocklist (law 14) checked line by line: none of the burned phrase families or
close variants appear. Voice: byline male (self-doubting careful voice), cited
researcher female — inverts the careful-woman/overconfident-man default.

## 3. Question design

| q | family | trap plan | key |
|---|---|---|---|
| 1 | `enligt_texten_detalj` | A reversed_causality · B overgeneralisation (scope-widening, zero absolutizer tokens) · D plausible_worldknowledge | **C** |
| 2 | `forfattarens_hallning` | A detail_as_main (¶3 promoted to verdict) · C detail_as_main + overstatement (¶4 suspicion promoted to verdict) · D half_right_conjunction + plausible_worldknowledge | **B** |

Corpus-right mix for a short unit: one detail-retrieval + one higher-order.

**Q1 planted target** (¶2, one sentence): *"Men där källorna är fylliga nog att
pröva saken tycks årplatserna ofta ha fördelats efter gårdarnas mantal – de
största hemmanen närmast aktern…"* — hedged (tycks, ofta), directional
(mantal → seat), scoped (only where sources suffice). Key C paraphrases it
(mantal → "de största gårdarna"; scope kept as "där saken går att avgöra").
A flips the arrow (seat → standing); B deletes the scope restriction; D
attributes a rotation finding the text contradicts twice (styrmanstoften
krävde väderkännedom, inte anor; fördelningen återkom år efter år).

**Q2 planted target** (¶4 whole): oscillation + two mutually cancelling
suspicions + explicit closing admission. Key B is the only option spanning it.
A and C are symmetric single-paragraph promotions (each distractor takes one
paragraph's voice as the verdict — deliberately balanced so neither settle-
direction is privileged). D concedes the difficulty but invents a ground
(doctored recollections) the text never raises — its sources are protocols,
and their reliability is never questioned; underdetermination, not taint.

## 4. RULE 11 lemma audit (option sets only, no stems, no passage)

Content lemmas per option set:

- **Q1:** gård (A,B,C,D) · plats (A,B,C, D:styrmansplatsen) · båt (A, D:båtlaget) ·
  socken (A,B) · anseende (A) · granne (A) · mantal (B) · protokoll (B) ·
  knapphändig (B) · upplysning (B) · störst (C) · akter (C) · sak/avgöra (C) ·
  styrman (D) · omgång (D) · år (D)
- **Q2:** avfärda (A) · rangläsning (A) · förklaring (A) · rodd (A:roddens,
  D:rodde) · teknik (A) · social (B) · praktisk (B) · läsning (A,B,C-compounds) ·
  möjlig (B) · avstå/välja (B) · slå fast (C) · hierarki (C) ·
  efterhandskonstruktion (C) · överge (C) · antyda (D) · knappast (D) ·
  besvara (D) · minnesbild (D) · tillrättalägga/efterhand (C,D)

**Cross-question literal overlaps: zero.** gård/plats/båt/mantal/protokoll live
only in Q1's set; läsning/rodd/tolknings-vocabulary only in Q2's set.
Conceptual survivor to justify: the **rank axis** (Q1-A "anseende", Q2-A
"rangläsningen", Q2-B "sociala", Q2-C "hierarkiläsningen") — this is the
unit's unavoidable topic axis (the essay is literally about whether seats
showed rank). It is distributed across three distractors and one key on
different letters: a solver chasing rank-words picks the WRONG option in Q1
and faces three rank-flavoured options in Q2 — no key-corroborating chain
exists in either direction (the las-b17-001 glöd-chain defect shape is absent).
Source-vocabulary was deliberately scrubbed from Q2 (D uses "minnesbilderna",
not källor/protokoll/uppgifter) so Q1's key-scope clause ("där saken går att
avgöra") has no partner lemma in Q2.

## 5. RULE 12 stem check

- Q1 *"Vad framkom, enligt texten, vid Dagmar Tennlövs genomgång av
  protokollen?"* — presupposes only what the passage states flatly (a
  genomgång happened, of protocols); entails no option's claim; names no
  contested predicate.
- Q2 *"Vilken hållning intar textförfattaren i frågan om vad platserna i båten
  visade?"* — neutral referential; "frågan om vad platserna visade" is the
  essay's own stated question and predicates nothing about the answer.

## 6. RULE 13 / rule 10 hedge balance and tells

- Q1: hedged options = C (ofta, verkar) **and** D (vanligen) → 2 of 4; A and B
  assertive. Key is not the sole qualified option.
- Q2: qualified options = B (möjliga, avstår) **and** D (antyder, knappast,
  kan) → 2 of 4; A and C sweeping (avfärdar / slår fast, bör överges). The
  over-hedged option (D) is a distractor, per the rule's requirement that
  "qualified" and "correct" must not line up.
- **Stated adversarial blind floor: 1-in-2 per question** (style alone cannot
  do better than {C,D} / {B,D}) — within the batch16 stance-composition
  tolerance dom.
- Zero M-FORM absolutizer tokens in any option (B's overgeneralisation is
  built by deleting the scope clause, not by adding alltid/samtliga).
  Key lengths: Q1 C=16w vs longest B=18w; Q2 B=17w vs longest D=19w — the key
  is the longest option in neither question. Keys C/B, no positional pattern.

## 7. Self-blind-solve

Performed from the passage alone, arguing for every non-key:

- **Q1:** A — can the boat have *conferred* standing? The passage's map/spegel
  metaphor reflects an order that already exists (mantal, bänk); direction is
  explicit. Rejected. B — is the pattern general? The text twice restricts to
  where sources are fyllig; B asserts the opposite half. Rejected. D — is
  rotation anywhere? Contradicted by väderkännedom-inte-anor and år-efter-år
  stability. Rejected. **C stands alone.**
- **Q2:** A — does he end practical? ¶4 explicitly re-opens both readings after
  ¶3, and the close is "Jag vet ärligt talat inte". Rejected. C — does he
  assert projection? He calls it a misstanke he cannot discharge, then
  immediately balances it with the opposite un-provable misstanke; "bör
  överges" appears nowhere. Rejected. D — right difficulty, wrong ground:
  no source-tampering is ever suggested, and the sources are protocols, not
  memories. Rejected. **B stands alone.**

## 8. LAW 16 name-check log (rule 14 transport)

Endpoints: sv.wikipedia CirrusSearch exact-phrase + OSM Nominatim
(countrycodes=se, UA header, ≥1.3 s spacing). **Positive control run FIRST in
the same session on the same endpoints:** "Flarken" → sv.wiki **56 hits**,
Nominatim **5 SE places**. Control PASS (a later zero therefore means zero).

| name | sv.wiki exact | Nominatim SE | variant probes | 2nd index (WebSearch, quoted) | verdict |
|---|---|---|---|---|---|
| Snesnaren (lake, 1st candidate) | 3 hits (Stora/Lilla Snesnaren, Lindesberg) | 2 real lakes | – | – | **COLLISION → REJECTED**, renamed (Skarpbo lesson) |
| Ylmaren (lake, replacement) | 0 | 0 | Ulmaren 0 · Ylmären 0 | no exact bearer (nearest real: Hjälmaren, 3 edits) | kept, flag V-FINAL |
| Härkilsnäs (village) | 0 | 0 | Harkilsnäs 0 · Härkilsnas 0 | no hits | kept, flag V-FINAL |
| Brygdelius / Helmer Brygdelius | 0 / 0 | n/a | Brydelius 0 (one-letter probe) | no bearer (only Bryg-/brewery near-matches) | kept, flag V-FINAL |
| Tennlöv / Dagmar Tennlöv | 0 / 0 | n/a | Tennlöf 0 · Tennlov 0 | no person bearer; string exists as common noun (tennlöv = tin-leaf ornament) — not a bearer | kept, flag V-FINAL |

Second-index honesty note: Mojeek (batch17 recipe) returned a **captcha wall**
this session and could not be screened; WebSearch (exact-quoted) served as the
second index, with its own "Flarken" control passing (Västerbotten village
hits). All checks re-runnable from the queries above; all four kept names
remain flagged for V-FINAL per rule 14.

Registry check (rule 8/9/13): grep of `batches/**/*.{json,md}` for
Helmer / Brygdelius / Dagmar / Tennl* / Härkilsnäs / Ylmaren / kyrkbåt →
zero hits; "Helmer" and "Dagmar" absent from the 231+14 used given names;
neither surname is a near-duplicate of any listed pair (closest suffix-shares:
Sundelius, Åkerlund — different stems). Toponym suffix -näs / -aren shared
with listed items only at the level of ordinary Swedish toponym suffixes;
no listed stem (Brantmyr-, Näversved-, Vrantebo…) is reused.

## 9. Honest residue

- "tennlöv" existing as a Swedish common noun is logged above; it has no
  bearer and arguably makes the surname more natural, but V-FINAL should see
  it.
- The rank-concept spread across both questions' option sets (§4) is the one
  rule-11 survivor; it is direction-mixed and key-neutral, but a G-STEM
  reviewer should confirm it cannot be walked.
- Historical framing was kept institutionally consistent (sockenprotokoll
  1740s–1860s for the study; **kommunalstämma** for the 1911 close, post-1862
  reform) — worth an expert-review glance but deliberate.

---

## REPAIR ROUND `fleet-repair-3` — 2026-09-01 (round-3, Q1-B)

**Scope: one option.** The passage is untouched (415 words, 24 sentences,
mean 17.3, 6 paragraphs incl. the glossary block). Q2 is untouched. Key letters
and key meanings unchanged: **C, B**.

### What was wrong with Q1-B

Q1-B read:

> "Att platserna fördelades efter gårdarnas mantal **också i de socknar där de
> bevarade protokollen bara ger knapphändiga upplysningar**."

Under a stem that asks what Tennlöv's *review of the minutes* showed, that
option was **unkeyable by construction**. The passage restricts the mantal
finding to "där källorna är fylliga nog att pröva saken"; an option asserting
the finding precisely where the sources are too thin is not a wrong answer to
the question but a category error — the review could not have produced it under
any reading. A blind solver strips it on sight and finishes in a 1-in-3 field,
and pedagogically it teaches nothing, because no student actually holds that
belief.

### Edit (old → new)

| | text |
|---|---|
| **before** | Att platserna fördelades efter gårdarnas mantal också i de socknar där de bevarade protokollen bara ger knapphändiga upplysningar. |
| **after** | Att platserna i båten fördes in i protokollen med jämna mellanrum och därför kan följas år för år. |

The new B is **keyable in form** — a review of parish minutes could perfectly
well have found a regularly kept record — and **wrong in content**, which is
what a distractor is for. The passage closes it twice:

- ¶1: the distribution recurred year after year, "så självklar att den **sällan
  skrevs ned**";
- ¶2, Tennlöv's own result: the order "**mest kom på tal när den var i
  gungning**: vid tvister, arvskiften, nybyggen".

So the minutes carry scattered conflict-moment entries, not a series that can
be followed year by year. The misreading is a real one: the stem itself says "genomgång av
protokollen", which invites the assumption that the minutes tracked the seating.
Trap relabelled `overgeneralisation (scope-widening)` → **`reversed_inversion`**
(the source's own character inverted).

### Three constraints held deliberately

1. **Hedge balance.** B stays **flat**. Q1's hedged options remain C
   ("ofta … verkar ha") and D ("vanligen") — 2 of 4, exactly as at generation,
   so C does not become the sole hedged option and D's "vanligen" is untouched.
2. **Cross-stem surface family.** A first draft read "Att **sittordningen**
   skrevs in i protokollen …". It was re-cut because Q2's stem contains
   "**platserna i båten**": with the plats-family gone from B, a solver matching
   surface vocabulary across sibling stems would have been left with A-or-C, and
   intersecting that with the C/D hedge pair isolates key C. The shipped B
   carries "platserna i båten" so the family spans the set — A ("plats i båten"),
   B ("platserna i båten"), C ("platserna") and, compound-aware, D
   ("styrmans**platsen** … **båt**laget"). The mechanical 5-char-prefix sweep
   misses the two compounds in D and reports the family as A/B/C only; that
   under-count is recorded here rather than relied on.
3. **No look-alike pair inside the set.** A third draft ended "…och därför **går
   att följa** år för år", which echoed C's closing "där saken **går att
   avgöra**" and would have made B and C the two options that rhyme. The shipped
   B ends "…och därför **kan följas** år för år". "kan följas" is a capability
   predicate about the surviving record, not an epistemic qualifier on the
   claim, so the 2-of-4 hedge balance is untouched — B is still flat.

### RULE 11 re-sweep — cross-question option-set lemmas

`mech.tokenize`, function words stopped, exact lemmas and 5-character stems:

- Exact content lemmas present in **both** questions' option sets: **NONE**.
- Shared 5-character stems across the two option sets: **NONE**.
- `mech._ABSOLUTIZERS` tokens in any option: **NONE** (the new B introduces
  none; "jämna mellanrum" is a frequency phrase, not an absolutizer).
- The generation-time rule-11 survivor (the rank concept spread across both
  sets) is unaffected: B never carried it before and does not now.

### RULE 12 re-audit — stem-alone giveaway and cross-stem residue

| stem | gives away | entails an option? | leaks onto the sibling question? |
|---|---|---|---|
| Q1 "Vad framkom, enligt texten, vid Dagmar Tennlövs genomgång av protokollen?" | that a named researcher reviewed minutes and something came of it | **No** — all four options are candidate findings of that review, so the presupposition discriminates nothing. After the repair this is true of B as well, which is the whole point of the edit. | **No.** Zero lemma or stem overlap with any Q2 option. |
| Q2 "Vilken hållning intar textförfattaren i frågan om vad platserna i båten visade?" | that the seats are disputed and the author has a stance | **No** | **Surface only.** `båten` / `platserna` land on Q1-A, Q1-B and Q1-C (and on D through compounds). Because the family now spans the set, the sibling-stem echo cannot single out the key — which it would have done under the first draft. |

**Blind floors restated:** 1-in-2 per question, unchanged from generation —
Q1 on the C/D hedge pair, Q2 on the qualified B/D pair. The repair does not
lower a floor; it **raises Q1's from an effective 1-in-3** (B strippable on
construction) **back to the declared 1-in-2**.

### Lengths after the repair

Q1: A 15 / **B 18** / C 16 (key) / D 14 tokens, ratio 1.29 (LÄS cap 5.25).
Q2: A 13 / B 17 (key) / C 13 / D 19, ratio 1.46.
The key is **not** the longest option in either question — B is longest in Q1,
D in Q2 — so M-TELL cannot fire and the "pick the longest" heuristic scores 0/2.

### Mech re-run (post-repair)

`python3 gates/scripts/run_mech.py batches/batch18/candidates/las-b18-003.json
--parsed-dir /home/loucmane/dev/hpfetcher/data/parsed --p5-corpus-dir auto` →
**M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass ·
M-PLAGIARISM pass** — six of six, zero findings. `blind/`, `stems/` and
`distractor/` regenerated from the repaired candidate and machine-verified
against it: prompts, option texts and keys identical; no `key`, `rationale`,
`generator_meta` or `family` leaked into `blind/` or `stems/`; no `passage` or
`title` in `stems/`. `generator_meta.repair_log` created (this unit had none)
with the full old→new record.

## fleet-repair-4 — 2026-09-01 (round-4 consolidated repair)

**Metadata and one rationale verb.** The option sets stay **exactly as
adjudicated** — the pedagogy HOLD's proposed q1-D / q1-A / q2 rewrites are NOT
executed in this round — and no passage, stem, option or key byte moves, so no
re-gate is owed and the three sheets came back byte-identical.

**1. §4 CORRECTED (V-FINAL finding 2).** §4 asserts *"no key-corroborating chain
exists in either direction (the las-b17-001 glöd-chain defect shape is
absent)"*. **That claim is refuted.** `verdicts/verdicts-gstem-r3.jsonl` q:1
finding 2 states the chain explicitly — *"Three of q2's four options presuppose a
contested status/hierarchy reading of the seats … corroborating C while
stripping B … and A"* — and r1 and r2 reach the same picks by adjacent routes.
Read §4 as: a key-corroborating chain **does** exist, it runs from Q2's option
set to Q1's, it is CONTENT-based rather than lexical, and the plats-/båt- surface
sweep §4 performed could not have caught it.

**2. §9 ANSWERED (V-FINAL finding 2).** §9 "Honest residue" item 2 asked that
*"a G-STEM reviewer should confirm it [the rank-axis spread across both option
sets] cannot be walked"*. **Three G-STEM legs walked it** — r1 flag/flag, r2
flag/flag, r3 flag/flag, picks C and B in every leg, i.e. the actual key pair,
with no passage. The open question is therefore **answered against the unit**,
and the answer is recorded rather than left standing: the route exists, and it
is **held at note** under the batch16 ägardom carried into `BRIEF-ADDENDUM.md`.
Both provisos were re-verified on the shipping bytes this round: the floor is
stated, and rule 10/13 holds at 2-of-4 hedged per question with the key not the
sole hedged option in either. Every leg classed the route PARTIALLY, not
ANSWERABLE; the decisive step in each question is an assumption-laden import
that a passage could falsify; and `las-b17-003`'s V-FINAL held an identical
shape at note.

**3. `blind_floor_note` scope sentence appended (V-FINAL finding 1).** The
declared floor is explicitly *"style-only"* and is **not false** — pure style
heuristics really are bounded at 1-in-2 per question (moderation alone gives
{C, D} in Q1 and {B, D} in Q2; "pick the longest" scores 0 of 2). The defect was
completeness: nothing in the shipping record said that the demonstrated route is
**content-based and therefore unbounded by that floor**. A scope paragraph now
says so, names both legs of the route, and records the note-level disposition,
so `generator_meta` and this file no longer say different things.

**4. Q2 rationale, a same-round G-SPRÅK r3 minor that was neither fixed nor
named (V-FINAL finding 5).** *"texten misstänkliggör aldrig uppgifterna som
tillrättalagda"* → **"texten framställer aldrig uppgifterna som
tillrättalagda"**. `misstänkliggöra` is monotransitive and does not license a
som-predicative, which belongs to *framställa / utpeka / avfärda*; the gate's own
native alternative is taken. fleet-repair-3b listed exactly three corrections and
folded this fourth into *"Pre-existing minors carried"*, which understated what
was left behind — it was a same-round finding, not an inherited one.

### Mech re-run (fleet-repair-4)

`python3 gates/scripts/run_mech.py batches/batch18/candidates/las-b18-003.json
--parsed-dir /home/loucmane/dev/hpfetcher/data/parsed --p5-corpus-dir auto` →
**M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass ·
M-PLAGIARISM pass** — six of six, zero findings, exit 0. Option tokens
unchanged (Q1 A15 / B18 / C16 key / D14; Q2 A13 / B17 key / C13 / D19); the key
is not the longest option in either question.
