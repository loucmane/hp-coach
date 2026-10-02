# gen-elf-short-2 — authoring notes

**Unit:** ELF short_text, one question, family **ELF-TYPE-002** (inference /
implication).
**Title:** Fifty-Three Guineas · **Key:** A · **Genre:** history essay ·
**Spelling variety:** BrE · **Setting:** inland (a market town twenty miles from
navigable water).
**Assigned subject:** a subscription library's borrowing ledger and what it shows
about who read what.

---

## 1. The inferential move, and how it differs from the last three TYPE-002 shorts

### What the unit asks the reader to do

The passage states a **rule** and a **count** and never joins them.

* **Rule.** A subscriber held one volume at a time for a fortnight. *The second
  fortnight needed no asking* — it was free and automatic, `cont.` was written
  against the entry, and no money fell due until the twenty-ninth day. The one
  thing that took the second fortnight away was the **slate by the door**: a
  title set down there had to come in on the fourteenth day. The slate was
  rubbed out weekly and never copied, so what stood on it is gone.
* **Count.** A book of travels went out 41 times; **39 of those loans came back
  on the fourteenth day**, and two were continued. A volume of sermons went out
  nine times and was continued seven.

The inch: under that rule a fourteenth-day return is not an expiry, it is a
**forfeited free fortnight**. Thirty-nine borrowers each gave one up. The only
mechanism the passage names that takes a second fortnight away is another
subscriber's claim. So the borrowers of the travels were giving the book up with
somebody waiting — and the ledger's date-in column silently preserves what the
destroyed slate recorded.

The step is **abductive, not deductive**: the rule says *claimed ⇒ in on the
fourteenth day*, and the key runs the arrow the other way. That is exactly the
one inch TYPE-002 wants, and it is why the stem is a *can-be-concluded* stem.

### Move-sequence diff against the lane's last three units

| | opening | organising evidence | inferential move | officer | coda |
|---|---|---|---|---|---|
| **elf-b18-004** *Sittings to Let* | institution ("The parish church at Stintbury let its seats…") | priced seating plan, 1848 vs 1851 | **anomalous subset**: six vacant pews, then boxes cut into single sittings | churchwardens | dated fact (1861 price rise) |
| **elf-b19-004** *Before the Pillar Boxes* | object/practice ("Before the pillar boxes came…") | **two institutions compared on a pair of numbers** (412 vs 390 letters) | which variable governs the count | keeper **paid threepence an hour** | surveyor's irrelevant note |
| **elf-b20-004** *Ward's Two Indentures* | person ("John Ward was bound twice.") | counted register | **anomalous subset**: five names occurring twice | town clerk **at twopence an enrolment** | the clerk's fee |
| **this unit** | **a rule**, in the society's own third person | one column of an ordinary register, read against the rule that produced it | **inference from renewals — specifically from the renewals that are absent** | **none at all** | concession about what the record cannot show |

Three things the brief barred, all avoided:

1. **No "small subset behaves anomalously".** The unit isolates no subset. Its
   two titles are ordinary members of the collection, and the claim is about how
   a whole column of the register should be read once its rule is known.
2. **No officer, and no per-item pay.** The unit contains **no functionary of
   any kind** — no clerk, keeper, pinder, warden or assistant. The continuation
   mark and the ledger entries are stated in the passive with no agent. The only
   money is the subscribers' guinea and the overdue penny. Three of the last four
   TYPE-002 shorts turned on an officer paid per item; this one has nobody to pay.
3. **Neither predecessor shape.** No pair of institutions compared on two
   numbers (b19); no subset re-bound / re-let for longer than expected (b18, b20).

Also deliberately absent, from the batch20 lane lessons: **no coastal or
maritime setting** (batch20 ran 4 of 7); **no money-arithmetic argument** (4 of
7); **no flat administrative coda** (4 of 7 — this one closes on a concession);
**no document-reading present tense** (declared saturated in batch18 — narration
is past throughout, including the sentences about the surviving ledger).

### Two further variants considered and rejected

* *The ledger names the payer, not the reader.* Rejected as the **key** — it is a
  "the metric measures the wrong thing" thesis, capped at ~1 per batch (law 12),
  and it is the option a test-wise reader reaches for on epistemic instinct
  alone. It survives instead as the closing **residue** ("A volume might be
  fetched by a servant or a child of the house, and the ledger named neither"),
  where it pulls a careful reader *away* from every option on the sheet.
* *Overlapping loan dates prove a second copy.* Rejected as too nearly a
  deductive restatement — retrieval wearing an inference's clothes.

---

## 2. Trap design

Stem: **"What can be concluded about the society's subscribers?"** — one neutral
referential population, four claims about it on four different variables.

| | variable | trap | the clause that kills it |
|---|---|---|---|
| **A (key)** | why a volume came back at the fortnight | — | the rule + the 41/39/2 count, joined |
| **B** | what an overdue volume cost | `surface_word_match` + threshold shift — reuses *a penny a day* and *the fortnight*, and moves the charge from the 29th day to the 14th | "nothing was charged before the twenty-ninth day"; and the sermons were continued in 7 of 9 loans with nothing falling due |
| **C** | who chose the purchases | `outside_knowledge` — real book societies of the period **did** commonly vote their year's books at a general meeting, so the claim is true of the institution type and false of this one | "three of them chose what was bought" |
| **D** | who stopped subscribing | `surface_word_match` + plausible narrative — borrows *carried nothing home* and attaches the obvious story of a lapsed member | the same sentence: "Eleven of the fifty-three paid their guinea in each of the nine years" |

Every distractor is **refuted by a nameable clause**, not merely unsupported —
the elf-b20-004 standard. None of them is verbatim-true (law 11). And both
real-world priors a reader might bring (libraries fine you; book clubs vote
their purchases) point at **distractors**, which is the intended direction.

---

## 3. The option-only sortability test, written out

Passage covered. Ranking the four texts on wording alone:

> A Subscribers gave up the travels at the fortnight with another reader waiting for it.
> B Subscribers who kept the sermons past the fortnight paid a penny a day for them.
> C Subscribers settled at a meeting each year which new books the society should buy.
> D Subscribers who took no volume home stopped paying before the ledger's last year.

**What they disclose:** a subscription book society, a fortnight loan, a penny a
day, an annual meeting, a ledger, two books called *the travels* and *the
sermons*.

**What they do not give — the batch20 G-STEM checklist, item by item:**

1. **Absolutizer / hedge triage.** Not one option carries a softener
   (may / might / probably / some / mainly / largely) and not one carries an
   absolutizer from `mech.py`'s `_ABSOLUTIZERS` or the efterhandstillägg
   additions (always / never / every / all / only / none / entirely / impossible
   / proves / guarantees / certainly / nothing / nobody / "no one"). The hedging
   axis is **degenerate, not merely balanced** — "pick the qualified one" and
   "strip the absolutes" both return the empty set. (`D` contains *no volume*;
   `no` is not in the absolutizer family, and the phrase is the passage's own
   grain, not an overstatement.)
2. **Contradictory dyad.** None. A is about why a book came back, B about what an
   overdue book cost, C about who chose the purchases, D about who stopped
   subscribing — four variables, no two jointly exhaustive, so "keep the pair,
   drop the rest" is unavailable. Nor does any option entail or exclude another:
   all four could be true together.
3. **Mirrored twin.** None. No option is the key with an arrow reversed; there is
   no reversed-causality pair at all, so nothing advertises the key by mirroring it.
4. **Main-idea scope triage.** Not a main-idea item, and all four options are the
   same shape and grain — flat past-simple factual claims — so there is no
   narrow / broad / off-topic / summary ladder to climb.
5. **Stem announces the answer's shape.** The stem names a population and
   predicates nothing. It supplies no comparative, no "likely", no inference
   marker that only one option could match; every option is an equally flat
   assertion, so a *concluded* stem selects none of them.
6. **Motive axis.** Not one option asserts an intention, motive or state of mind,
   and **not one carries a causal connective**. The key's causation sits in an
   unmarked `with`-adjunct, so "pick the option that explains" selects nothing.
7. **Scope singleton.** All four are claims about the same population — this
   society's subscribers. None generalises to the town, the trade or book
   societies at large.
8. **Grammatical shape: 2 + 2 on every axis found.** Two carry a restrictive
   relative clause (B, D) and two do not (A, C); two name a book (A, B) and two
   do not (C, D); all four are active, past simple, plural subject, same opening
   word.
9. **Length.** A 14, B 15, C 14, D 14. The key is **not** the longest; the single
   longest is a distractor.

**Residual asymmetries, stated honestly and not repaired:** A is the only option
with a participial adjunct (*with another reader waiting for it*), and B is the
only option one word longer than the rest. Neither is a documented key heuristic;
the length one points at a distractor. **Finding: the sheet sits at 1-in-4 on
wording alone.**

**An earlier draft failed this test and was rebuilt.** Its distractor set
contained *"Subscribers had to ask at the counter before a volume could be kept a
second fortnight"* — the flat negation of the key's own load-bearing premise,
which put two options on one variable — and its key carried the causal connective
*because* while no distractor did (a motive-axis singleton on the key). Both were
engineered out before the file was first written.

### RULE 12 — the stem entails no option

Read alone, *"What can be concluded about the society's subscribers?"* gives a
blind solver the population and nothing predicative: no cause, no agent, no
quantity, no money, no date, no title. It therefore neither entails nor excludes
A, B, C or D. This is the failure mode batch20 flagged even in the model unit,
where the stem's *"bound twice"* sat close to the key's content; here the stem
touches none of the key's material (the travels, the fortnight, the waiting
reader) at all.

**Attestation, counted this round** over `data/parsed/*.json` (405 non-blank
authentic ELF stems): `concluded` 27, `implied` 56, `suggested` 8. The
about-**X** referential frame is attested for all three (e.g. *"What can be
concluded about women and the Royal Society?"*). The last three TYPE-002 shorts
used **concluded** (b18-004), **implied** (b19-004) and **suggested** (b20-004);
`concluded` is the form furthest from the immediate predecessor, and this unit
drops the *here* that b18-004 carried.

### RULE 11 / RULE 15

Both vacuous at one question: there is no second option set to bridge to, and no
pair to measure a joint stems-only floor over. The floor is the single-question
floor, **1-in-4**.

### Hedge map (rules 10 and 13)

One question; the key is a **flat, unhedged assertion** with no quantifier, and
no distractor is hedged either. The "pick the qualified option" heuristic selects
the key **0 of 1** times. `M-FORM`'s key-is-the-sole-non-absolutized-option shape
is absent by construction — no option contains an absolutizer at all.

### Key letter — recomputed, not quoted forward (RULE 19)

All 139 shipped candidate files were scanned; the ELF one-question `short_text`
units number **38**, keying **A 6 / B 14 / C 11 / D 7, sum 38**. Inside the
TYPE-002 slice of that lane (13 units: b1-004, b2-004, b3-004, b4-004, b11-004,
b12-004, b13-003, b15-004, b16-004, b17-004, b18-004, b19-004, b20-004) the keys
are **A 1 / B 4 / C 4 / D 4, sum 13**.

**A** is the rarest letter bank-wide in the lane and, by a wide margin, the
rarest inside TYPE-002; keying A moves the slice to **A 2 / B 4 / C 4 / D 4**,
the flattest distribution any of the four letters can produce. **The cost is
disclosed rather than hidden:** elf-b20-004, the immediately preceding TYPE-002
short, also keys A, so this makes a two-unit repeat in the lane. There is no run
to extend — the last three key B, D, A, all different — and C was rejected
because batch21's sibling TYPE-001 short already keys C. The batch20 note's
D/A/D/A/D alternation is a TYPE-001 phenomenon and does not reach this lane.

---

## 4. Self-blind-solve

Solved from the passage alone after a break, arguing **for** each distractor
before killing it.

* **B** — *argued for:* the passage really does put *a penny a day* in front of
  the reader, the sermons really were kept past the fortnight, and a fine for
  keeping a book too long is what every reader expects of a lending library.
  *Killed on the date:* the charge began on the twenty-ninth day and a continued
  loan ran only to the twenty-eighth, so the seven continued sermon loans cost
  nothing.
* **C** — *argued for:* "three of them chose what was bought" is a thin clause
  easy to skim past, and an annual meeting voting the year's books is exactly
  what such a society would ordinarily do. *Killed by that same clause*, which
  names who chose and thereby excludes the subscribers at large; killed a second
  time because the passage never mentions a meeting of any kind.
* **D** — *argued for:* eleven names with no loans against them across nine years
  is what a lapsed membership looks like, and the passage volunteers no other
  explanation. *Killed inside the sentence that raises it:* those eleven paid
  their guinea in each of the nine years.
* **A** — *survives.* The rule makes the second fortnight free and automatic, so
  39 fourteenth-day returns are 39 forfeited fortnights, and the only thing the
  passage names that takes a second fortnight away is a title set down on the
  slate.

I could not construct a second defensible answer. I could not reach A from the
options alone, and I could not reach it from the stem.

**Residue that points at nothing on the sheet** (law 9): the room over the
saddler's shop, the twenty miles to navigable water, the three subscribers who
chose the purchases, the nine loans of the sermons, Ralph Jarrett standing
against more loans than any other name, and the closing fact that a volume might
be fetched by a servant or a child and the ledger named neither. That last is the
deliberate loose end — it plants the genuinely interesting thought that a name in
the register is a payer and not necessarily a reader, which **no option offers**.

---

## 5. Period detail verified

Audited item by item against ordinary English book-society and
subscription-library practice of the 1820s–30s:

* **A guinea a year** for a small-town society — in the normal range; the guinea
  survived as a money of account long after the coin ceased to be struck in 1816.
* **One volume out at a time** — the standard entitlement of a single share.
* **A fortnight's loan** — a standard term for a society of this size.
* **A penny a day overdue** — the low end of the usual penny-to-twopence range.
* **Purchases chosen by a small committee of members** — one of the two normal
  arrangements. The other, a general meeting that votes the year's books, is
  exactly what distractor **C** offers and what this society is said not to do.
* **A want-list kept on a slate and rubbed out** — ordinary counter equipment,
  and an ordinary reason for such a list not to survive.
* **Shelves in a hired room over a shop** — the usual housing.
* **A currier** among the subscribers — a plausible trade for a market town.

**What a ledger would and would not record** is the load-bearing period point and
is handled explicitly. A borrowing register of this kind records the date out,
the date in, a short title and the subscriber's name. It does **not** record why
a loan ended, who in the household actually read the book, or what stood on the
want list — the passage says the last of these in terms and the closing sentence
says the second.

**No book titles are printed.** The two books are named by kind — *a book of
travels*, *a volume of sermons* — which is how a historian writes when the
register's own titles run to two or three words. This borrows no real title and
invents none, so it **removes** a law-16 surface rather than adding one. (The
brief's "invent book titles" instruction is answered by not printing any: the
audit risk it guards against is borrowing a real one, and the alternative —
coining e.g. *Travels in the Morea* — collides immediately with Leake's real 1830
book of that name.) Both kinds are the right kinds: travels and sermons are among
the commonest categories in surviving book-society catalogues of the period.

---

## 6. Measured statistics (recomputed on the final bytes — RULE 19)

All figures from `mech.py`'s own `tokenize()` / `sentences()`, computed on the
strings written to the file; nothing carried forward from a draft.

| stat | value | band |
|---|---|---|
| `passage_words` | **237** | ELF short_text 101–368 ✅ |
| `paragraph_count` | 1 | 0–8 ✅ |
| `sentence_count` | 12 | — |
| sentence word lengths | 19, 6, 23, 30, 14, 39, 16, 26, 13, 12, 18, 21 | — |
| `mean_sentence_words` | **19.8** | 12.0–47.2 ✅ |
| sentence-length sd | **8.5** | blueprint ≥ 7 ✅ |
| `prompt_words` | 9 | 3–30 ✅ |
| `option_words` | A 14, B 15, C 14, D 14 | 0–31 ✅ |
| `option_length_ratio_max` | **1.07** | cap 2.36 ✅ |
| key is longest option | **no** (longest is distractor B) | M-TELL ✅ |
| em dashes, whole file | **0** | rule 3 ✅ |
| straight apostrophes, student-facing layer + rationale | **0** | ✅ |
| straight apostrophes, whole file | 105 — *all inside `generator_meta` prose, never rendered* | disclosed, not claimed clean |

**Length, disclosed:** the authoring aim was 160–200 and the measured figure is
237. The unit has to carry a two-clause rule, its exception, the counts for two
titles and the residue; mech's tokenizer also splits every hyphenated numeral
(*fifty-three*, *twenty-ninth*) and every possessive (*saddler's*) into two
tokens, which accounts for roughly eight of them. It is comfortably inside the
authentic band and far below the authentic maximum of 368 — but it is the longest
ELF short in **our** bank, whose previous maximum was elf-b20-004 at 201. Flagged
rather than trimmed further, because the rule is what the inference rests on.

**Mechanical gates, run on the final bytes:** `M-SCHEMA pass · M-BANDS pass ·
M-TELL pass · M-FORM pass · M-ECHO pass · M-PLAGIARISM pass` (exit 0). JSON
validates against `gates/schemas/candidate-item.schema.json` (with the
`PLACEHOLDER` sentinel substituted for a real id). Every non-ASCII character in
the file is a `\uXXXX` escape: five U+2019 and one U+2013 (the byline dash).

**Typography — one system in all rendered layers.** U+2019 apostrophes and one
spaced U+2013 en dash; zero em dashes; no double quotation marks anywhere,
because the unit carries no quoted speech. The rationale uses the same system as
the passage — the batch20 defect where three of four ELF units ran curly
punctuation in the passage and ASCII in the rationale.

**No internal vocabulary in student-visible text.** The rationale contains no
snake_case trap labels, no `KEY X:` metaword opener (it opens *"Option A is the
answer…"*), no rule references, no gate names. Trap labels live only in
`generator_meta.planted_traps`.

---

## 7. Law 16 / RULE 14 / RULE 21 — search log

**Positive control first, on the same endpoint in the same session, and again at
the end:** `en.wikipedia` CirrusSearch exact phrase `"Pellew"` → **totalhits =
701** at the start and **701** at the end. Every zero below is therefore a real
zero and not a dead endpoint. Transport: en.wikipedia CirrusSearch exact phrase
(`action=query&list=search&srsearch=%22NAME%22`) with a descriptive UA and ≥ 1 s
between calls, plus exact-quoted web search. All probes run **2026-09-02**.

### Names shipped

**Coinage — `Hobbermarsh`** (the byline; carries every claim the essay makes):

* en.wiki `"Hobbermarsh"` → 0 · `"Yvonne Hobbermarsh"` → 0
* enumerated variants, probed literally: `"Habbermarsh"` 0, `"Hobbermarch"` 0,
  `"Robbermarsh"` 0, `"Hobbersmarsh"` 0
* web `"Hobbermarsh"` → **no bearer of the string at all**; the index fuzzed only
  to the dictionary word *hobber* (a hobbing-machine operator) and to the real
  place names Littlemarsh Common and Westmarsh
* computed distance to the nearest real surnames (Titchmarsh, Westmarsh,
  Littlemarsh): **6**
* bank screen: **min distance 6** over 2 322 capitalised tokens from 145 files

**Ordinary figure — `Ralph Jarrett`** (RULE 17), the currier in the ledger:

* **(a) no notable bearer** — en.wiki `"Ralph Jarrett"` → **0**
* **(b) no bearer in the unit's own domain** — the domain is *subscription
  libraries, book societies, book history, archives*; the query
  `"Ralph Jarrett" library OR librarian OR "book society" OR archivist OR
  "subscription library" OR "book history"` returned **no Ralph Jarrett in any of
  them** (hits were generic library-history bibliographies and other people —
  Ralph R. Shaw, Marcus McCorison, David Pearson)
* bare web `"Ralph Jarrett"` → obituaries and genealogy only (Houston 2013,
  Cross Lanes 2024, Burlington NC 2022, Chattanooga, Ancestry search pages) —
  **diffuse private bearers, disclosed as the intended cost of RULE 17, not
  treated as clearance**
* **(c)** he is given **no quoted words and no attributed act**: he stands
  against loans in a register and nothing else, and the unit contains no quoted
  speech at all

**The RULE 21 split, stated so a gate sees it:** the ordinary name is the ledger
entry; the coinage carries the byline and therefore every contested claim. The
unit has exactly **one** coined surname, so there is no coinage cluster of the
kind a stage-11 reader pointed at in elf-b19-001.

### VOID legs

**None.** Every probe listed returned a result inside a control-passing session.
No probe was attempted and abandoned, and no claim here rests on a tool that
failed.

### Names withdrawn, with the reason — recorded so they are not re-invented

| withdrawn | encyclopaedia result | why withdrawn |
|---|---|---|
| **Jesserton** | `"Jesserton"` 0; variants Jesserson, Jefferton, Jesterton, Nesserton, Besserton, Esserton, Tesserton, Kesserton, Messerton, Jasserton, Jessarton, Jesserdon, Jesserten **all 0** | the exact-quoted **web** search surfaced **Jesselton** — the real colonial-era name of Kota Kinabalu — at **computed distance 1**, in a British-colonial-history domain. RULE 16 violation. |
| **Jandersley** | `"Jandersley"` 0 | the enumerated one-letter neighbours **`"Andersley"` (1 hit)** and **`"Sandersley"` (1 hit)** returned real bearers on the encyclopaedia index — two real surnames at distance 1. |
| **Ralph Hopwood** | 0; domain query clean | dropped for **style**, not collision: pairing it with *Hobbermarsh* gave the unit two `Ho-` surnames. |
| **Ralph Judd** | **12 hits, article titled exactly "Ralph Judd"** | RULE 21(a) — notable bearer. |
| **Ralph Jarvis** | **33 hits, article titled exactly "Ralph Jarvis"** | RULE 21(a) — notable bearer. |
| **Ralph Jessop** | 3 hits — a Carlyle and Nietzsche scholar | RULE 21(b) — a bearer in a books-and-scholarship domain. |
| **Yvette** (given) | — | withdrawn on the **computed** sweep, not on a search: distance **2** from the sibling unit's `Odette`. Replaced by *Yvonne* (distance 5 from Odette). |

Both **Jesserton** and **Jandersley** were cleared by the exact-phrase probe of
the coined string itself and killed **only** by the enumerated variant probe.
That is precisely the failure mode RULE 16 was written for, and precisely the one
batch21's TYPE-001 sibling hit ("a d1 collision that exact-phrase probes cleared
and only the computed sweep caught").

### Toponyms and titles

**None coined and none used.** The town is never named — it is "a market town
twenty miles from navigable water" — so no gazetteer probe was needed and none is
claimed. No book title is printed, so no title probe was needed and none is
claimed.

### Anti-plagiarism, tier 2

Exact-quoted web search for the passage's most distinctive string,
`"the slate was rubbed clean every week"` → **no hit on the phrase**; the index
returned only idiom pages for *wipe the slate clean*, which is the literal
practice the phrase describes. M-PLAGIARISM (17-token kill, 8-gram containment)
passes clean against the authentic corpus, and M-ECHO passes clean against all
139 shipped units.

### RULE 8 sibling sweep — run **twice**

At first listing, batch21 held only `gen-elf-short-1.json`. By the time this unit
was committed **all six siblings existed**, so the sweep was re-run against the
current set rather than the stale one — which is the batch20 lesson (two Alisons
and two Trevors shipped because the sweep ran on surnames and on the bank only).

Siblings' declared figures on 2026-09-02: `gen-elf-long` Elspeth Kelsingham,
Adrian Kitson · `gen-elf-short-1` Odette Fenniscarth, Oscar Goddard ·
`gen-las-debatt` Fredrika Sölvhamre, Gottfrid Runesson · `gen-elf-cloze`,
`gen-las-essa`, `gen-las-long` declare no named figures.

**Ralph, Yvonne, Jarrett and Hobbermarsh appear in none of them, on the
given-name axis as well as the surname axis.** Minimum computed distance from any
name in this unit to any sibling's declared name: **5** (Jarrett↔Adrian,
Jarrett↔Elspeth, Jarrett↔Odette). No sibling uses an R or Y given name or an H or
J surname, so the assigned partition held.

### RULE 18 registry correction acknowledged

The 2026-09-02 CORRECTION at the end of the brief was read and applied: **Kajsa,
Birger, Gordon, Fiona** as used given names; **Kajsa Pärlhage, Birger Nolvide,
Gordon Hoskadale, Fiona Hebden** as used pairs; the whole **`Skrömt-`** stem
barred; and the no-longer-shipping names (Sigbritt, Anton, Vråbäcken, Alison
Hebden, Trevor Hoskadale) barred anyway. None is used here. **Computed minimum
distance from any name in this unit to any of them: 4** (Ralph↔Kajsa,
Yvonne↔Fiona); next nearest 5. *An earlier draft of the metadata asserted 5 and
was corrected by recomputation before the file closed* — RULE 19 applied to my
own note.

---

## 8. Name-block compliance

Assigned: given names beginning **R or Y**, surnames beginning **H or J**.
Used: **Ralph** (R) + **Jarrett** (J), **Yvonne** (Y) + **Hobbermarsh** (H).
Both assigned given-name initials and both assigned surname initials are used
once each, so neither name alliterates and the two surnames do not share an
initial. No `-by`, `-ius` or `-vall` ending; no `Mar-*` given name. Gender is
mixed and independently assigned: the historian is a woman, the ledger
subscriber a man.
