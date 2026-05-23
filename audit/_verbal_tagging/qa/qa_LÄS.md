# LÄS framework_id tagging QA — 12-question sample

**Headline: 10/12 correct** (1 wrong, 1 ambiguous).

Sample drawn from `audit/_verbal_tagging/qa/sample_LÄS.json`; taxonomy in
`app/public/frameworks/las_taxonomy.json`.

For each item I classified the LAS-TYPE independently from the question stem,
options, and `solution_path`, then compared to the proposed tag.

---

## Item-by-item

### 1. `var-2018-1-verb2-LÄS-017` — proposed **LAS-TYPE-001** — AMBIGUOUS

Stem: "Vilket av följande uttrycker bäst det som texten benämner 'kollektivt
minne'?"

My read: this is a *definition / sub-object characterization* question
("uttrycker bäst det som texten benämner X") — closer to LAS-TYPE-005's
sub-object branch ("delobjektsfrågor kräver det sammantagna porträttet av en
entitet"; classic 005 trigger is "vilket av följande beskriver / definierar
X"). The 001 tag is defensible because the answer is something the text states
about the concept — but the question isn't asking for a specific stated fact,
it's asking for the best abstract summary of the concept the text introduces,
which is a 005-shaped task. Borderline; would prefer LAS-TYPE-005.

### 2. `var-2015-verb1-LÄS-020` — proposed **LAS-TYPE-003** — WRONG

Stem: "Hur förhåller sig, enligt recensenten, Heberlein och Johansson till
skönlitteraturen i sina respektive böcker om ondska?"

My read: this is a textbook LAS-TYPE-006 (Skillnadsfråga / kontrast). The stem
explicitly contrasts two named entities ("X och Y", "respektive") and the
correct option (C) is structured as "Heberlein menar … medan Johansson
misstror …" — a paired contrast across the same dimension (their attitude to
literature on evil). Every distractor follows the "X gör A medan Y gör B"
template. The tag should be LAS-TYPE-006, not 003. (003 would be right if the
question asked about *one* party's stance; here the comparison is the whole
point.)

### 3. `var-2022-2-verb1-LÄS-020` — proposed **LAS-TYPE-003** — CORRECT

Stem: "Hur betraktar textförfattaren sammanfattningsvis ideologiska inslag i
skoldebatten?"

Single-author stance toward a target object (ideological elements). Options
are pure valence words (ofrånkomliga / efterfrågade / ignorerade /
överflödiga). Clean LAS-TYPE-003.

### 4. `var-2022-1-verb2-LÄS-014` — proposed **LAS-TYPE-004** — CORRECT

Stem: "Vad vill Elisabet Jagell säga med det resonemang som hon avslutar med
orden 'Direktiven får inte bli en boja'?"

Pure LAS-TYPE-004 trigger ("vad vill X säga med …" — naming the rhetorical
function of a quoted utterance). The answer is the underlying claim the quote
argues for, not the quote's literal content.

### 5. `host-2024-verb2-LÄS-019` — proposed **LAS-TYPE-004** — CORRECT

Stem: "Vad bidrar citatet av Carl Henrik Martling till att förklara?"

Function-of-a-citation question. The taxonomy lists "vilken funktion fyller
…" as an explicit 004 trigger; "vad bidrar citatet till att förklara" is a
near-paraphrase.

### 6. `host-ver2-2019-verb1-LÄS-016` — proposed **LAS-TYPE-005** — CORRECT

Stem: "Hur kan man bäst karakterisera Sarkozys utrikespolitik, utifrån hur den
framställs i texten?"

Verbatim 005 trigger ("hur kan man bäst karakterisera X"); sub-object is a
named entity's foreign policy. Options are paired-adjective summaries — the
standard 005 distractor structure.

### 7. `var-2015-verb2-LÄS-013` — proposed **LAS-TYPE-001** — CORRECT

Stem: "Hur bör man, enligt texten, i en statistisk undersökning hantera …"

"Enligt texten" + answer (kalibrering / söka kompletterande uppgifter) is
explicitly stated in the passage per the solution path. Direct detail lookup;
clean 001.

### 8. `host-2023-verb2-LÄS-011` — proposed **LAS-TYPE-002** — CORRECT

Stem: "Utifrån resonemanget om Gunnars tillvaro verkar det troligt att textens
jag vill undvika något av följande."

Both inference triggers from the 002 list ("utifrån resonemanget", "verkar det
troligt") in a single stem. The narrator never explicitly states "I want to
avoid a predictable life" — it's inferred from the framing of Gunnar's
existence as ömkligt / meningslöst. Textbook 002.

### 9. `host-2015-verb1-LÄS-019` — proposed **LAS-TYPE-001** — CORRECT

Stem: "Vad anger textförfattarna som stöd för …"

"Vad anger X som stöd" is a direct lookup of stated evidence. Solution shows
the support is literally written in the passage (patients later requesting
the drink). Clean 001.

### 10. `host-2024-verb1-LÄS-018` — proposed **LAS-TYPE-001** — CORRECT

Stem: "Utredningen anser att Lantmäteriverket bör upphöra … Vad anges som ett
skäl till detta?"

"Vad anges som ett skäl" — direct lookup of a stated reason. The matching is
a light paraphrase ("skadar förtroendet" → "skadar verkets anseende") but
that's the standard 001 close-paraphrase pattern, not inference. Clean 001.

### 11. `host-ver1-2019-verb2-LÄS-019` — proposed **LAS-TYPE-001** — CORRECT

Stem: "Vad noterar recensenten beträffande de 'naiva' argumenten till
läsningens försvar?"

"Vad noterar X" is a stated-observation lookup. The reviewer's observation
(critics first attack, then echo) is given explicitly in the passage per the
solution. Slight stance flavor in "beträffande", but the answered fact is the
reviewer's *stated* observation, not a valence read — so 001 fits better than
003.

### 12. `var-2014-verb2-LÄS-019` — proposed **LAS-TYPE-005** — CORRECT

Stem: "Hur kan man enligt Lönnroth bäst beskriva 1700-talsdiktningen?"

Verbatim 005 trigger ("hur kan man bäst beskriva X"). Sub-object
characterization of a historical literary period; options are single
adjectives — standard 005 shape.

---

## Patterns

- **Strong precision on the easy cases.** Every clean trigger phrase was
  tagged correctly: 5 × LAS-TYPE-001 ("enligt texten" / "vad anges" / "vad
  noterar"), 2 × LAS-TYPE-004 ("vad vill X säga med …" / "vad bidrar citatet
  …"), 2 × LAS-TYPE-005 ("hur kan man bäst karakterisera/beskriva"),
  1 × LAS-TYPE-002 ("utifrån resonemanget … verkar det troligt"),
  1 × LAS-TYPE-003 (single-author "hur betraktar textförfattaren X"). 9/12
  items are textbook-trigger matches and all hit.

- **LAS-TYPE-003 vs LAS-TYPE-006 confusion (1 wrong).** Item 2
  (`var-2015-verb1-LÄS-020`) was tagged 003 because the stem asks about how
  two named figures *förhåller sig* to literature — but the structural cue
  "X och Y … i sina respektive böcker" plus paired-clause distractors makes
  it a 006 contrast question. **Action item:** when the stem names two
  parties and the correct option is paired ("X menar … medan Y …"), prefer
  006 over 003. The 003 protocol's first bullet ("identifiera vems hållning
  frågan gäller") implicitly assumes one voice; the taxonomy may want to
  call out the X-vs-Y disambiguation rule explicitly.

- **LAS-TYPE-001 over-tagging — mild evidence (1 ambiguous).** Item 1
  (`var-2018-1-verb2-LÄS-017`, a "vilket uttrycker bäst det som texten
  benämner X" definition-of-concept question) was tagged 001 where 005's
  sub-object characterization is a closer fit. This matches the predicted
  failure mode: 001 is the natural default for any "vad säger texten om X"
  stem, and concept-definition questions get absorbed even when their task
  shape (best abstract summary) is really 005. Not enough signal in a single
  ambiguous case to call it a systemic issue, but worth a follow-up: scan
  the full LAS-TYPE-001 bucket for stems containing "uttrycker bäst",
  "benämner", or "bäst sammanfattar" — those are 005 leakage candidates.

- **No LAS-TYPE-007 / LAS-TYPE-008 in the sample.** Can't audit those
  buckets from this draw; if the global tag distribution shows < 5% on
  either, consider stratified sampling for the next QA round to verify the
  rarer types aren't being silently funneled into 001 or 002.

- **Overall verdict.** Precision is high (10/12 strict, 11/12 if we accept
  the ambiguous as defensible). The one clear error is a 003↔006
  boundary issue, not a wholesale tagging failure. The 94% tag rate the
  agent self-reported looks consistent with this precision.
