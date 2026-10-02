# gen-elf-cloze — authoring record (batch20, ELF cloze / textkomplettering)

Unit: `batches/batch20/gen-elf-cloze.json` · `candidate_id` left as the literal
`PLACEHOLDER` sentinel · family
`ELF-CLOZE-001 / deckchair-attendants-end-of-season-society-commentary-cloze` ·
title **Asking Price** · byline **Desmond Gaddermoor** (bare) · BrE throughout.

Subject as briefed: deckchair attendants at a seaside town as the season ends.

---

## 1. The idea the unit turns on

The hire fee prices the chair. It does not price the thing the beach actually
gets, which is one stationary, already-paid person on a mile of sand whom a
stranger is entitled to interrupt. The piece tests that by the one
empirical route available to it: the town tried to supply the same function
directly, through a staffed and free information counter, and the counter was
barely used and shut. The proposed mechanism is that being *interruptible* is
a by-product of an existing transaction and cannot be provisioned on its own —
a counter has to be approached, and approaching it is a decision you have to
justify to yourself, whereas a chair you have paid for has done the
approaching for you.

The passage does not close on that. Gregson is given the last word on the
question and gives a flatter answer (people ask her things because she stands
still and they do not), and the two explanations are left standing beside each
other. The coda is two flat October facts and a stop.

**RULE 20(c), both binding exclusions, discharged:**

- *Byline frame.* The blocklisted `[Name] + writes + on/about + subject + for
  a + determiner + periodical` frame is not used. The byline is bare — an en
  dash and a name. No publication is named anywhere in the unit, and the
  appositional role tag used by elf-b13-002 and elf-b15-002 ("NAME,
  columnist") is also avoided.
- *Theme.* The excluded theme — a written instrument that fails to govern
  behaviour — is absent. There is no bylaw, tariff board, notice, clause,
  waiting list or council list anywhere in the passage; the council is never
  mentioned. The contrast is **priced transaction vs unpriced function**, and
  it is settled by an experiment (the counter), not by a document that nobody
  obeys.

---

## 2. gap_type_map — what each gap tests

| gap | type | POS / frame | key | why this is the only answer |
|---|---|---|---|---|
| 1 | **collocation** | attributive adjective, `does a ___ trade` | **brisk** (D) | `do a brisk trade` is a fixed English collocation; the three others are speed adjectives with no such combination |
| 2 | **grammar / morphology** | verb form after a perfect auxiliary, `chairs that had ___ there since breakfast` | **lain** (B) | plural subject, perfect auxiliary, no object ⇒ past participle of intransitive LIE |
| 3 | **connective** | sentence-initial two-word adverbial | **In practice** (C) | the preceding sentence gives the nominal description, the gapped sentence gives the observed reality |
| 4 | **register** | finite reporting verb, 3sg, `she ___ that …` | **concedes** (A) | "Pressed on whether she minds" demands a verb of yielding; the others misfit on stance or on register |
| 5 | **polarity** | `-ly` adverb modifying a past participle | **barely** (D) | explicit `but` upstream plus the closure downstream force the negative pole |

**This is deliberately not the lane's habitual budget.** Read out of the
shipped bank: 13 of the 15 shipped cloze units carry a `gap_type_map`, and
**all thirteen run the same budget** — three collocation-family gaps, one
polarity, one connective. Only the labels vary: elf-b10-002 calls its third
gap `sense/collocation` and elf-b9-002 calls its fifth
`collocation/polarity-mirror`; the other eleven (b3-002, b4-002, b8-002,
b11-002, b12-002, b13-002, b15-002, b16-002, b17-002, b18-002, b19-002) are
labelled `collocation` outright three times each. elf-b1-002 and elf-b2-002
carry no map. b19's distribution was flagged for exactly this. This unit
spends the two free slots on a **register** gap and a **grammar** gap instead.
The grammar gap is the first in the lane: no shipped cloze gap turns on verb
morphology.

**Connective ordinal (law 15).** Shipped connective ordinals are 5 (b15), 4
(b16), 1 (b17), 4 (b18), 2 (b19). **3** is the value absent from the last five
units and is the one taken here. Its class — nominal-versus-actual — is new
too, after concessive (Nonetheless), causal (Consequently), expectation
(Predictably), temporal (Eventually) and precision (Strictly). It is also the
lane's first two-word connective set, which the corpus permits (cloze options
run 1–2 words).

**POS spread across the five gaps:** attributive adjective → non-finite verb
form → connective adverbial → finite verb → `-ly` adverb.

**Key letters: D B C A D.** All four letters used, no column, key does not
default to A. The fifteen shipped cloze key strings are CBDAB, DBACB, BCDAB,
CADBC, CDABD, CADBC, DBCAB, BDACD, CDABC, CBADC, BACDA, CADBC, CADBC, BCADB,
DBACD — `DBCAD` is not among them.

---

## 3. Self-blind-solve

Run on the passage alone, arguing **for** each non-keyed option first and then
killing it. A gap survives only if the kill is something a careful reader can
point at in the text.

### Gap 1 — `the pitch does a ___ trade from eleven until the light goes`

- **A hasty.** *For:* right word class, right semantic field; a seaside pitch
  in July is busy, and busy work is done quickly. *Kill:* `a hasty trade`
  scopes to one transaction done in a hurry, and there is no single
  transaction in the frame — the adverbial `from eleven until the light goes`
  measures a whole working day. Collocation misfit.
- **B rapid.** *For:* neutral register, unobjectionable with "trade" in an
  economic sense. *Kill:* `rapid trade` belongs to markets moving quickly, not
  to a hire pitch taking money steadily; and it fights the leisurely time
  adverbial rather than fitting it.
- **C swift.** *For:* the strongest challenger. A solver who has resolved the
  gap to "fast" and stopped there will take it, and nothing about the sentence
  is ungrammatical with it. *Kill:* English does not put `swift` with `trade`
  in this frame. This is the pure collocation test and the reason the gap
  works.
- **D brisk — KEY.** `do a brisk trade` is the fixed collocation, and its
  sense (steadily busy over a stretch of time) is exactly what the adverbial
  supplies.

**Verdict: single.** All four are speed-field adjectives, so only the
collocation separates them.

### Gap 2 — `chairs that had ___ there since breakfast`

- **A lie.** *For:* the correct lexeme and the correct sense — the chairs were
  lying in the racks. *Kill:* it is the bare form and cannot follow `had`.
- **C laid.** *For:* the commonest and most defensible-feeling error in the
  pair; it *is* a past participle, it *does* follow `had`, and many speakers
  would produce it. *Kill:* `laid` is the participle of transitive LAY and
  requires something that was laid. The frame has no object, and the adverb
  `there` is locative, not a direct object. This distractor should collect
  most of the wrong answers.
- **D lay.** *For:* correct in `the chairs lay there since breakfast`, and the
  right lexeme. *Kill:* simple past, not a participle; ungrammatical after the
  auxiliary `had`.
- **B lain — KEY.** Past participle of intransitive LIE; plural subject,
  perfect auxiliary, no object.

**Verdict: single.** All four are forms of the LIE/LAY pair, so meaning alone
settles nothing and only the morphology of the perfect selects one.

*Agreement guard (the batch18 lesson).* The frame's subject is plural
(`chairs`) and the auxiliary carries the person and number, so no option needs
to agree in person; what is checked here, form by form, is that exactly one of
the four is a past participle of an intransitive verb. Checked: `lie` base,
`lay` simple past of LIE / base of LAY, `laid` past and participle of LAY,
`lain` participle of LIE. No claim of rhyme, shared suffix or shared part of
speech is made about this set beyond "all four are forms of the LIE/LAY pair",
which holds for all four.

### Gap 3 — `The hire is the whole of the transaction … ___, the pitch is the one staffed thing on the mile`

- **A In principle.** *For:* the polarity mirror, and the most tempting. The
  sentence pair is plainly a two-sided contrast, and `In principle` is a
  contrast marker. *Kill:* it points the contrast the wrong way. `In
  principle` would present the staffed-presence fact as the theoretical side,
  when the passage offers it as the real one and the *hire* as the nominal
  side. The paragraph then spends four sentences on what actually happens.
- **B In return.** *For:* money has changed hands, and reciprocity is in the
  air. *Kill:* the sentence describes what the pitch *is*, not what a customer
  gets back; there is no exchange for the clause to be the return leg of.
- **D In advance.** *For:* the hire is paid up front, so a temporal reading is
  imaginable. *Kill:* nothing in the gapped sentence is ordered in time
  relative to anything else.
- **C In practice — KEY.** Marks the move from nominal description to observed
  reality, which is exactly the relation the two sentences stand in.

**Verdict: single.** All four are `In + noun` adverbials taking a comma and a
full clause, so shape gives nothing away.

### Gap 4 — `Pressed on whether she minds the questions, she ___ that …`

- **B boasts.** *For:* the content ("most of the job") could be read as a
  claim about how central she is. *Kill:* the attitude mirror. What follows is
  unglamorous — the questions are an obstruction in August — and nobody boasts
  of an obstruction.
- **C volunteers.** *For:* she is talking about her own work, unprompted in
  tone. *Kill:* contradicted by the frame itself. Nothing can be *volunteered*
  that has just been *pressed for*.
- **D confesses.** *For:* the hardest of the three. It is grammatically
  perfect, takes the same complement, and points in roughly the right
  direction — an admission drawn out under pressure. *Kill:* register.
  `confesses` frames an ordinary working opinion as a guilty secret, which is
  a heavier register than the sentence or the surrounding prose supports;
  nothing in the passage treats her view as shameful, and two sentences later
  she gives the same view flatly and unprompted.
- **A concedes — KEY.** A verb of yielding a point, which is what `Pressed on
  whether she minds` sets up and what the two-sided content delivers.

**Verdict: single.** All four are third-person singular present-tense
reporting verbs agreeing with the subject `she`, and all four take a
`that`-clause — verified individually, not assumed — so grammar decides
nothing and the gap is settled by stance and register.

### Gap 5 — `It was well signed and it was free, but it was ___ used, and it shut after its second summer`

- **A widely.** *For:* the polarity mirror. The inventory just given (counter,
  leaflet rack, paid assistant, well signed, free) reads as success, and a
  skimmer takes it. *Kill:* the `but` inverts it, and the clause that follows
  says the point shut.
- **B routinely.** *For:* the mildest of the three positives and therefore the
  most tempting; `routinely used` would sit comfortably with a staffed
  municipal counter and does not overclaim. *Kill:* same `but`, same closure.
- **C heavily.** *For:* collocates well with `used`. *Kill:* same, and it is
  the strongest overclaim of the three.
- **D barely — KEY.** The negative pole the contrastive frame demands, and the
  only reading under which the closure in the same sentence follows.

**Verdict: single.** All four are `-ly` adverbs modifying `used`. *(The shared
ending is `-ly` and not `-ely`: `heavily` has `-ily`. No claim beyond `-ly` is
made anywhere.)*

---

## 4. RULE 11 — cross-question option-set audit

Run over the five option sets alone, with no passage and no stems in view.

| set | members | field |
|---|---|---|
| 1 | hasty, rapid, swift, brisk | speed adjectives |
| 2 | lie, lain, laid, lay | LIE/LAY verb forms |
| 3 | In principle, In return, In practice, In advance | `In + noun` adverbials |
| 4 | concedes, boasts, volunteers, confesses | reporting verbs |
| 5 | widely, routinely, heavily, barely | `-ly` extent adverbs |

**Content lemmas appearing in two or more sets: none.** The only repeated
token anywhere is the function word `in`, which occurs in all four gap-3
options and therefore discriminates nothing. The sets are conceptually
disjoint as well (how busy / what tense and transitivity / what relation two
sentences stand in / how a remark was made / how much a thing was used), so no
key can be corroborated from another question's options.

Checked programmatically against the tokenised title and passage: `hasty,
rapid, swift, brisk, lie, lain, laid, lay, principle, return, practice,
advance, concedes, boasts, volunteers, confesses, widely, routinely, heavily,
barely` are each **absent** from both, so no gap can be answered by
surface-matching against the text.

**RULE 12 — stem entailment.** Every prompt is the bare label `Gap (n)`, which
predicates nothing about the gap and cannot entail any option.

**Rule 10 — hedge balance.** Gaps 1, 2 and 3 have no hedging axis at all. The
pick-the-moderate-option heuristic selects the key on gap 4 (`concedes`) and
gap 5 (`barely`): **2 of 5**, under the half-unit ceiling. The break in the
other direction sits on gap 3, where the cautious, theoretical-sounding option
`In principle` is **wrong**, and on gap 1, where the key is a flat confident
collocation. No option anywhere carries an M-FORM absolutizer — checked term
by term over all twenty option strings against the completed family
(always/never/all/every/only/none/entirely/impossible/guaranteed/proves/
nothing/nobody/no one/nowhere/everyone/everybody/everything and the Swedish
counterparts). `M-FORM` run on the file: **pass**.

---

## 5. Move sequence, against the shipped bank (law 12)

**This unit:** seasons end without a date → the arithmetic of one late
Tuesday → what the hour actually consisted of → the transaction against the
staffed presence, with the worker declining the flattering reading → the
town's direct provision and its closure → a proposed mechanism, then the
worker's plainer account left beside it → a flat October fact, and stop.

**Openings deliberately avoided:**

| unit | opening move | avoided how |
|---|---|---|
| elf-b19-002 | published arithmetic — numbers in sentence 1 | this unit's first number arrives in sentence 3; sentence 1 is a short generalisation |
| elf-b18-002 | a scene at a stated hour | no stated hour anywhere |
| elf-b17-002 | rule plus disposal chain | no rule, no chain |
| elf-b16-002 | imperative | none |
| elf-b15-002 | a described object | none |

**Thesis shapes avoided:** *the obsolete thing came back* (b1-002 board-game
cafés, b3-002 sleeper trains, b4-002 resale, b13-002 the handshake); *the
metric measures the wrong thing*; b16's conventional-view-refused-then-
relocated; b17's inventory-with-a-locked-drawer; b18's notice-and-escalation;
b19's written-rule-against-grown-practice. The shape here is
**priced-transaction-versus-unpriced-function, tested by a failed attempt to
unbundle the two**, and it is left unsettled.

**Coda:** no aphorism, no *not A, but B* chiasmus, no dated summary of the
practice. Two flat facts — when the racks come in, and who stacks them — then
a stop.

**Title:** *Asking Price*. A light pun of the corpus's *Killer Cats* / *Bitter
Pills* type; two words, no article, so not the capped `The + modifier + noun`
shape. Shipped cloze titles for comparison: Analogue Comforts, Fewer Fridays,
Slow Trains Home, Worth Mending, Ringing Off, Holding the Line, Buttered
Margins, The Last Flourish, *Agreed, Unread*, The Offered Hand, Drawing Pins,
Past the Brewery, Ninety Days, Left to Soak, Somebody Else's Rhubarb.

**Saturated motifs avoided:** no ledger study, no weakest-link chain, no
institution-in-decline (the hire price has *risen*, the pitch still opens, and
no year-on-year decline figure appears), no wedge-gauge or measurement-book
coda, no washing-up politics, no document read in the present tense.

**Law 9 — against tidiness.** The stripe-pattern digression (a 2019
replacement batch in the wrong blue, now used to tell the two stacks apart)
points at nothing in the argument and is there because it is the kind of thing
that is true of a deckchair pitch. Gregson's own explanation contradicts the
essayistic one and is not adjudicated. The attendant is not presented as
enjoying the role the piece describes: in August the questions are an
obstruction, and it is only in late September that they become the job.

**RULE 17 — one ordinary name.** Carol Gregson, the attendant and the only
named figure inside the passage, carries a wholly ordinary British name —
common given name, common surname, neither coined. The single coined name,
Gaddermoor, appears once, on the byline line. There is no cluster of coined
surnames for a stage-11 reader to point at.

---

## 6. Measured band statistics — recomputed on the final bytes (RULE 19)

Measured with `mech.py` `tokenize()` / `sentences()` on the exact passage
string the shipped JSON contains. The same measurement is formatted into
`generator_meta.schema_note` programmatically at build time, so the two cannot
diverge.

| statistic | measured | band (ELF cloze) | verdict |
|---|---|---|---|
| passage words | **394** | 228–401 (`bands.json`); 300–410 (blueprint) | pass, 7 words of margin |
| paragraphs | **4** | 1–4 | pass |
| sentences (mech splitter) | **19** | — | — |
| mean sentence words | **20.74** | 13.1–34.8 | pass |
| sentence-length sd (population) | **11.7** | blueprint floor 7 | pass |
| sentence-length range | **6–49** words | must vary | pass |
| prompt words | **2** each | 1–15 | pass |
| option words | **1** (gaps 1,2,4,5), **2** (gap 3) | 0–4 | pass |
| option length ratio | **1.00** every question | ≤ 2.36 | pass |

Per-sentence word counts, in order: [9, 10, 38, 31, 14, 37, 19, 49, 7, 26, 24, 9, 20, 20, 6, 28, 7, 18, 22].
Per-paragraph word counts: [88, 70, 106, 130].

Two of the 19 mech "sentences" are splitter artefacts and are
expected: the gap-3 marker opens a sentence with an underscore rather than a
capital, so the first two sentences of paragraph 3 are counted as one long
unit; and the byline line begins with an en dash, so it folds into the final
sentence. The prose itself alternates long subordinated sentences with short
verdict sentences.

**Mechanical gates run on the shipped file** (`run_mech.py … --no-plagiarism`):
`M-SCHEMA` **pass**, `M-BANDS` **pass**, `M-TELL` **pass**, `M-FORM` **pass**.
`M-PLAGIARISM` could not be run in this worktree — there is no local
`data/parsed` corpus here — and is left for the orchestrator; it is the one
mechanical gate this record does not carry a result for.

**Other measured checks on the final bytes**

- Em dash (U+2014) anywhere in the file: **absent**. En dash (U+2013) in the
  passage: **1**, opening the byline line (addendum rule 3).
- Quotation marks in the passage: **none** — Gregson is reported, never
  quoted, so the curly-vs-straight question does not arise. The passage
  contains no apostrophes either.
- Spelling variety: **BrE**, one variety held. No `-ize`/`-yze` form occurs
  anywhere in title, passage, prompts, options or rationales, and none of
  color, honor, neighbor, favorite, realize, organize, recognize, gotten,
  sidewalk, apartment, elevator, trash, vacation, analyze, defense, offense,
  traveled or labor appears. BrE markers carried: *lavatory*, *a pound and ten
  pence a day*, *four pounds forty*, *the promenade*, *the seafront*, *the
  sailing club*, *beach huts*, *the leaflet rack*, *the tin*. The gap-3 key
  `In practice` is the noun spelling with `-c-`, correct in BrE.
- Capitalised tokens in the student-facing layer, enumerated
  programmatically: Asked, Asking, August, Carol, Desmond, Gaddermoor,
  Gregson, In, It, July, October, On, Pressed, Price, September, She, The,
  Tuesday, What. The only proper nouns are the five calendar terms, Carol
  Gregson and Desmond Gaddermoor; the rest are sentence-initial, title, or the
  option-initial preposition `In`. **No invented toponym and no named
  institution appear in the unit.**
- Arithmetic: 340 chairs run − 336 left in the racks = 4 hired; 4 × £1.10 =
  £4.40, which is what the tin took. The chain closes.

---

## 7. Law 16 / RULE 14 / RULE 16 — search log

Everything below was executed in this session on 2026-09-01, and every count
is the number the endpoint returned. **Nothing here is a certificate**; both
names are flagged for V-FINAL re-verification.

### Positive control first, same endpoint, same session

`en.wikipedia` CirrusSearch exact phrase,
`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=%22Pellew%22&format=json`
→ **totalhits = 701** (Edward Pellew 1st Viscount Exmouth; Viscount Exmouth;
Sir Edward Pellew Group of Islands). The endpoint is live and returns hits, so
a zero on it in the same session is informative.

### Kept coined name — **Gaddermoor**

| query (exact phrase) | endpoint | result |
|---|---|---|
| `"Gaddermoor"` | en.wikipedia CirrusSearch | **0** |
| `"Desmond Gaddermoor"` | en.wikipedia CirrusSearch | **0** |
| `"Desmond"` | en.wikipedia CirrusSearch | 25 711 — real, widely borne given name, which is what a plausible given name should be |
| `q=Gaddermoor&countrycodes=gb` | OSM Nominatim | **0 results** |

**RULE 16 one-letter probe — enumerated by hand, run one string at a time,
exact-phrase, on en.wikipedia:** Baddermoor 0, Laddermoor 0, Saddermoor 0,
Waddermoor 0, Caddermoor 0, Gaddermore 0, Gadermoor 0, Gaddemoor 0,
Gaddermoot 0, Gaddersmoor 0, Gladdermoor 0, Goddermoor 0, Gaddermoar 0,
Gaddermoors 0. **Fourteen variants, fourteen zeros.**

**Nominatim positive controls, same session, before the candidate query:**
`q=Flarken&countrycodes=se` → **10 results** (Flarken in Luleå, Härjedalen,
Boden); `q=Embleton&countrycodes=gb` → **3 results** (Embleton, Cumberland;
Embleton, Northumberland). Later Nominatim calls in the same run were refused
with HTTP 429, so only the results listed here were obtained and no further
Nominatim claim is made.

**Distances computed, not read off a result page.** Levenshtein, run in this
session over the real neighbours the second index surfaced:

```
Gaddermoor <-> Gadderer   = 3      Gaddermoor <-> Gaddesden  = 5
Gaddermoor <-> Gadmoor    = 3      Gaddermoor <-> Gathercole = 5
Gaddermoor <-> Fadmoor    = 4      Gaddermoor <-> Skidmore   = 7
```

Nearest real neighbour is at **distance 3**, comfortably above the RULE 16
floor of 2.

**Bank screen, run mechanically** over every capitalised token in every
shipped title, passage, prompt and option in `batches/batch*/candidates`
(132 files, 2 099 distinct capitalised tokens): nearest bank token to
`Gaddermoor` is **Vandermeer at distance 4**, then Aldermere 5, Larkmoor 5,
Vanterpool 5. Nearest bank token to `Desmond` is Drimmond 3 and Osmund 3; to
`Carol`, three tokens at distance 3; to `Gregson`, Ersson / Green / Regeln /
Season at distance 3. Every one is ≥ 2.

**Suffix-saturation check on the bank**, same scan, counting *capitalised
tokens* rather than surnames (some entries are Swedish toponyms or given
names, and are listed as found): `-beck` **5** (Fearnbeck, Halbeck,
Hallenbeck, Kilnbeck, Wahlbeck); `-by` **10** (Kvarnby, Ludderby, Ombleby,
Owlerby, Quillenby, Sörby, Thrusselby, Torneby, Torsby, Töreby — five of them
Swedish place names); `-ius` **4** (Brygdelius, Cornelius, Sundelius,
Torpenius — Cornelius is a given name); `-vall` **3**; `-holt` **3**; `-shaw`
**3**; but only **one** `-moor` (Larkmoor). `-by`, `-ius` and `-vall` are
barred outright by the standing dispositions and are not used; `-moor` is the
least saturated of the endings still available.

### Second index — honest note on tooling

`WebSearch` was **exhausted for this session** before any candidate query
could be put through it (the tool returned *"this session has used its web
search budget (200 of 200 WebSearch calls)"*), and the Mojeek fallback named
in the batch19 recipe returned a **JavaScript captcha challenge** rather than
result pages. Neither was usable and **neither is claimed**. The second index
used instead was **Exa**, the fallback named in batch16 rule 4.

Exa query: *"Gaddermoor" — any person, place, business or family with this
exact surname*, 8 results. **No exact bearer.** Exa is a semantic index, so it
returned near strings rather than the queried one, and those near strings are
what the distance table above is computed against: Alexander GADDERER (Elgin,
Moray, 1761–1817), Private John Frederick Gadderer (Gloucestershire Regiment,
d. 1917), the surname **Gadmoor** (forebears.io: ~7 bearers, most prevalent in
India), **FADMOOR LTD** (Companies House; Fadmoor is a real North Yorkshire
village), and *Gadd and Moore* of Manchester.

### Rejected candidates — each rejected for a recorded reason, not for a zero

| candidate | own hits | why rejected |
|---|---|---|
| Gantridge | 0 | hand-enumerated probe found **Bantridge** (2 hits — Bantridge Lane / Bantridge, West Sussex, real) and **Guntridge** (1 hit — a real character name in *List of Armchair Theatre episodes*), **both at distance 1** |
| Fanshard | 0 | **Manshard** returned 102 hits — a real surname — at **distance 1** |
| Garsthwaite | 0 | **Garthwaite** returned 493 hits — a real surname, incl. Anna Maria Garthwaite — at **distance 1** |
| Gaddlestone | 0 | **Saddlestone** returned 16 hits at **distance 1** |
| Fossmoor | 0 | **Rossmoor** returned 109 hits (real places in California and New Jersey) at **distance 1** |
| Fassbrook | 0 | **Massbrook** returned 8 hits — a real County Mayo townland — at **distance 1** |
| Frembleton | 0, and all nine hand-enumerated one-letter variants 0 | computed distance to real **Embleton** is 2 and to real **Brambleton** is 2 — at the RULE 16 floor, so set aside for a name at distance 3 |
| Fallowbeck | 0, and all sixteen distinct one-letter variants 0 | rejected on a different axis: the bank already carries **five** `-beck` surnames (Fearnbeck, Halbeck, Hallenbeck, Kilnbeck, Wahlbeck), so a sixth would be conspicuous in the way the standing `-ius` disposition describes |
| Fennimarsh | 0, and all eighteen variants 0 | set aside — Exa surfaced the string as an Early Modern English common-noun compound ("through a fennimarsh", 1615 travel text), and *fen* and *marsh* are the same thing, making it a tautological coinage |
| Frithgarth | 7 | non-zero |

### Ordinary name (RULE 17) — **Carol Gregson**

| query | endpoint | result |
|---|---|---|
| `"Carol Gregson"` | en.wikipedia CirrusSearch | **0** |
| `"Gregson"` | en.wikipedia CirrusSearch | 3 109 (Harry Gregson-Williams, Natasha Gregson Wagner, Clive Gregson) — a common real British surname, which is the point |

Alternatives screened in the same session and passed over: *Denise Gibbs* 3,
*Pauline Fletcher* 9 (Pauline Bray Fletcher is a real person), *Denise
Fletcher* 2, *Denise Gregson* 1, *Carol Fletcher* 7, *Janet Fletcher* 50,
*Denise Foster* 18, *Pauline Gregson* 0, *Brenda Fuller* 0.

**Honest limit on this one, and the law tension it resolves.** An ordinary
name is ordinary *because* many private people bear it, and no search can show
otherwise; what the zero shows is that no notable bearer of the exact pair is
indexed. Law 16 says reject any name with a real bearer in a related field;
RULE 17 says one wholly ordinary name per unit. Taken literally the two cannot
both be satisfied, because ordinary names have bearers by construction. The
tension is resolved **in RULE 17's favour, deliberately**, on the ground that
a name which identifies nobody in particular cannot put words in anybody's
mouth: the unit attaches to `Carol Gregson` only reported speech about a
fictional deckchair pitch in an unnamed town, makes no factual claim about any
identifiable person, and the domain (seafront concessions, local beach work)
has no notable bearer of the pair. This is the one place in the unit where a
law was traded off rather than simply satisfied, and it is recorded here so a
reviewer can overrule it.

### Null control for the person-name axis

`"Robert Brindlow"` → **0**, `"Hazel Frembleton"` → **0** — invented pairs
return zero on the same endpoint where `"Pellew"` returns 701, so the endpoint
discriminates and the zeros above are not artefacts of a dead query.

---

## 8. Residual risks for the gates

1. **Gap 2, `laid` vs `lain`.** Prescriptively unambiguous; descriptively many
   native speakers produce `have laid` in this frame. If a G-KEY reviewer
   argues from usage rather than from edited-prose standard, this gap is the
   one that will be challenged. The frame was written to leave `laid` no
   object to attach to, which is the strongest available defence.
2. **Gap 4, `confesses`.** The closest thing in the unit to a second
   defensible option. It is killed on register and on the absence of anything
   shameful in the content, not on grammar, so it is a judgement call rather
   than a mechanical one.
3. **Gap 3 as a "connective".** It is a two-word adverbial rather than the
   single-word sentence adverb the lane has used five times. The corpus
   permits two-word cloze options (max 2 observed), but a reviewer expecting
   `Consequently`-shaped options may read it as a departure. It is a
   deliberate one.
4. **`M-PLAGIARISM` not run** — no local `data/parsed` corpus in this
   worktree. The orchestrator must run it before this unit is promoted.

---

## Appendix A — fleet-repair-1 (2026-09-01): option-set craft on gaps 3, 4, 5

The repaired unit lives at `batches/batch20/candidates/elf-b20-002.json`, which
now carries a top-level `repair_log` (one entry, round `fleet-repair-1`, 22
path-level edits). This file, `gen-elf-cloze.json`, is the pre-repair
generator artifact and is left as written, per the batch18/batch19 convention.
Sections 2–4 and 6 above describe the round-0 options; where they disagree
with this appendix, this appendix is current.

### What changed

| # | Gate | Change |
|---|---|---|
| 1 | G-STEM **flag**, gap 3 (PAIR_STRUCTURE) | Options B **`In return` → `In addition`**, D **`In advance` → `In short`**. The two retired fillers could not occupy a contrastive discourse slot, so the `In principle / In practice` dyad advertised itself. Both replacements are live sentence-initial connectives a careless reader can pick (additive misreading; summing-up misreading) and both die on the discourse relation. `In fact`, `In effect`, `In contrast` / `By contrast` were considered and rejected as second-key risks in this frame. Key C `In practice` unchanged. |
| 2 | G-STEM **flag** + G-DISTRACTOR **flag**, gap 5 (3-1 polarity split; A/B/C interchangeable) | Options B **`routinely` → `scantily`**, C **`heavily` → `strongly`**. A uniformly negative set was tried and rejected: `hardly / scarcely / rarely / seldom / little / lightly / sparsely / sparingly / poorly used` are all live BrE, so four minimisers have no unique key. The set is now 2 × 2: two minimisers (`barely`, `scantily`) against two extent adverbs (`widely`, `strongly`), one live collocation with `used` in each pair. Key D `barely` unchanged; type stays **polarity**. |
| 3 | G-STEM **flag** + G-DISTRACTOR **flag**, gap 4 (`confesses` arguable) | Frame sharpened, not the options: *"…and by late September most of the job"* → *"…and by late September most of the job, a description rather than a complaint."* What she grants is now labelled an observation, so `confesses` (which needs a fault, a secret or a discreditable feeling to own up to) dies on sense, not merely on connotation and the coordination test. Key A `concedes` unchanged; the gap stays the unit's register gap. |
| 4 | G-ENG vote 2, minor | Passage ¶3 *"they are an obstruction"* → *"they are an interruption"*. Gap-5 rationale extraposed relative *"each is what a solver picks who reads…"* → *"the choice of a solver who reads…"*. |
| 5 | G-ENG vote 3 (pass, carried as a constraint) | No apostrophe, quotation mark or dash introduced into any student-facing string. The file is now written with `\uXXXX` escapes; its one non-ASCII character (the byline en dash) is `–`. |
| 6 | RULE 19 | Every `generator_meta` statistic recomputed on the final bytes; see the table below. The recount also corrected a round-0 omission: the capitalised-token list lacked the sentence-initial article `A` (3 occurrences). |

### Gap table, rows 3–5 as shipped

| gap | type | key | why this is the only answer |
|---|---|---|---|
| 3 | **connective** | **In practice** (C) | the preceding sentence gives the nominal description, the gapped sentence the observed reality; `In addition` flattens the contrast ¶2 set up, `In short` claims a summary where new facts arrive |
| 4 | **register** | **concedes** (A) | "Pressed on whether she minds" demands a verb of yielding a point; the appositive classes the content as a description, which is not confessable |
| 5 | **polarity (2 × 2)** | **barely** (D) | the `but` and the closure force the negative pole, and of the two minimisers only `barely` collocates with `used` |

### Self-blind-solve, repaired gaps

**Gap 3 — `The hire is the whole of the transaction … ___, the pitch is the one staffed thing on the mile`**

- **A In principle.** *For:* a contrast marker, and the sentence pair is a
  contrast. *Kill:* points the contrast the wrong way; the staffed presence is
  offered as the real side, not the theoretical one.
- **B In addition.** *For:* the two sentences are both facts about the pitch,
  and a list reading is available to a skimmer. *Kill:* ¶2 has already set what
  the pitch charges for against what it does; an additive connective erases
  the relation the paragraph exists to draw.
- **D In short.** *For:* "the one staffed thing on the mile" has a summing-up
  ring. *Kill:* the sentence condenses nothing; it introduces the mile, the
  staffing and Gregson, all new.
- **C In practice — KEY.**

*Verdict: single.* All four are two-word connective adverbials opening with
`In`, each attested sentence-initially before a comma and a full clause.
(Round 0 said `In + noun`; `short` is an adjective, so that claim is retired.)

**Gap 4 — `Pressed on whether she minds the questions, she ___ that in August they are an interruption and by late September most of the job, a description rather than a complaint.`**

- **B boasts** and **C volunteers** die as before (attitude mirror; contradicted
  by *Pressed on*).
- **D confesses.** *For:* an admission drawn out under pressure, and admitting
  the questions interrupt is mildly discreditable for someone paid to be
  approachable. *Kill:* the sentence itself says what she grants is a
  description rather than a complaint. One confesses a fault, a secret or a
  discreditable feeling; nobody confesses a description of what the job
  consists of. The kill is now a fact in the sentence, not a register
  judgement.
- **A concedes — KEY.** She grants the questioner's premise (they interrupt)
  while declining the conclusion (that she minds): the concessive move exactly.

*Verdict: single.* All four remain 3sg present-tense reporting verbs taking a
`that`-clause; the appositive follows the clause and touches no agreement.

**Gap 5 — `It was well signed and it was free, but it was ___ used, and it shut after its second summer`**

- **A widely.** *For:* `widely used` is a fixed phrase and the inventory reads
  as success. *Kill:* the `but` and the closure.
- **B scantily.** *For:* right polarity; the form trap for `scarcely`. *Kill:*
  `scantily` measures how thinly something is provided or covered (`scantily
  furnished`), not how seldom a counter is resorted to; dead before `used`.
- **C strongly.** *For:* the intensifier an L2 learner over-generalises.
  *Kill:* wrong polarity and dead collocation (`strongly advised / worded /
  opposed`, never `strongly used`).
- **D barely — KEY.**

*Verdict: single.* Polarity alone leaves {barely, scantily}; collocation alone
leaves {barely, widely}; no pair is interchangeable, so twin-cancellation has
nothing to cancel. Shared morphology re-verified for all four: `-ly` and
nothing narrower (`-ely`, `-ily`, `-gly`, `-ely`).

### RULE 11 / rule 10, re-run

Sets 3 and 5 are now `In principle, In addition, In practice, In short` and
`widely, scantily, strongly, barely`. Content lemmas in two or more sets:
**none**; the only repeated token is the function word `in`. All twenty option
words checked programmatically against the tokenised title and passage:
**absent**. Option-overlap against every other cloze candidate file under
`batches/batch*/candidates*` (45 files): none of the four new options has been
used before. Hedge balance: the pick-the-moderate heuristic now selects the
key outright on gap 4 only and narrows gap 5 to two — **1 of 5 plus a 1-in-2**,
moved by a byte change on the gap-5 set, not by relabelling. No absolutizer in
any option; `M-FORM` pass.

### Measured band statistics — recomputed on the final bytes (RULE 19)

| statistic | measured | band | verdict |
|---|---|---|---|
| passage words | **400** (was 394; +6 from the gap-4 appositive) | 228–401 | pass, **1 word of margin**, stated plainly |
| paragraphs | **4** | 1–4 | pass |
| sentences (mech splitter) | **19** | — | unchanged |
| mean sentence words | **21.05** | 13.1–34.8 | pass |
| sentence-length sd (population) | **11.9** | floor 7 | pass |
| sentence-length range | **6–49** | — | pass |
| option words | 1 (gaps 1, 2, 4, 5), 2 (gap 3) | 0–4 | pass; ratio 1.00 every question |

Per-sentence counts: [9, 10, 38, 31, 14, 37, 19, 49, 7, 26, 30, 9, 20, 20, 6, 28, 7, 18, 22]. Per-paragraph: [88, 70, 112, 130].

Typography on the student-facing layer: em dash 0, en dash 1 (byline),
apostrophes 0 (straight and curly), quotation marks 0. Rationale hyphens 13,
all compound or suffix hyphens. Whole file: em dash 0, en dash 1.

**Mechanical gates on the final bytes** (`run_mech.py … --no-plagiarism`):
`M-SCHEMA` **pass**, `M-BANDS` **pass**, `M-TELL` **pass**, `M-FORM` **pass**.
`make_sheets.py --check`: all sheets current.

### Residual risks after this round

1. **Gap 5, `scantily`.** A deliberately dead collocation chosen because every
   live minimiser would have been a second key. A reviewer may call it exotic;
   the defence is that it is exactly the `hasty trade` design of gap 1, and the
   form-confusion with `scarcely` is a real learner error.
2. **Gap 3, the dyad remains.** `In principle / In practice` is still a
   recognisable pair; what changed is that the other two options are now live
   for the slot. A test-wise solver who trusts the pair heuristic still gets a
   lean towards the dyad; honest blind floor perhaps 1-in-3, down from 55–60%.
3. **Word count at 400/401.** Any further passage addition must be paid for.
4. Round-0 residual risks 1 (`laid` vs `lain`) and 4 (`M-PLAGIARISM` not run
   here) stand unchanged; risk 2 (`confesses`) is reduced from a register
   judgement to a fact in the sentence.
