# gen-elf-short-2 — "Sixpence a Night" (batch 16)

**Block format:** `short_text_1q` · **Genre:** history_essay · **Spelling variety:** BrE
**Family:** ELF-TYPE-002 (inference / implication) · **Key:** B

## Topic and lane check

Assigned lane: a fresh economic/social-history micro-topic, TYPE-002 inference.
Chosen from the brief's candidate list: **the village pound and the fees for
redeeming a strayed beast.** One parish, one fee table, one week.

Graze check against the 100 shipped families in `batches/batch16/BRIEF-ADDENDUM.md`,
and against the lanes the brief excluded by name:

- **turnpike tolls / road-toll economics** (`elf-b15-004`, the immediate
  predecessor in this lane) — excluded by the brief, and avoided completely.
  There is no gate, no toll, no trust, no road and no traffic in this unit. The
  charge here is a penalty for trespass, not a price for passage, and the
  argument runs on a *notice* rule, which has no analogue in that unit. Full
  architectural divergence below.
- **archival silences** (`elf-b2-004`) — nothing here turns on a gap in a
  record; the passage's documents (the vestry's table) are present and quoted.
- **spa towns** (`elf-b3-004`), **harbour-lantern incentives** (`elf-b1-004`),
  **elevators** (`elf-b6-003`), **paper sizes**, **navigation** — all clear.
  Incentive appears in this unit only as a *defeated distractor* (D), never as
  the thesis; `elf-b1-004`'s subject is incentive alignment between two towns.
- Agrarian neighbours in the bank are `stenmurar-odlingslandskap` (stone walls
  as landscape/ecology) and `fabodbruk-agrarhistoria` (summer pasture) — both
  Swedish LÄS, neither about parish enforcement or fees. Nothing about
  boundaries, walling or grazing regimes is argued here; the pound's wall gets
  one clause and the common one mention.
- **Sourcing motif:** no ledger, no day-book, no account books, no "the records
  show" (GENERATION.md law 13 lists ledger-sourcing as saturated, and
  `elf-b2-004` / `elf-b6-003` both carry it). This passage narrates.

The other three candidates the brief offered were considered and dropped:
railway seaside hotels (grazes `spa-town-decline` — resort economics under a new
transport link is close to that unit's own move); circulating-library deposits
(grazes `folkbildningshistoria` and `skolbibliotek-bemanning-debatt`); truck-system
token wages (a famous enough institution that a well-read solver answers from
general knowledge — a G-STEM liability — and its natural thesis, "the shop was
the real profit centre", grazes `cinema-concessions-economics`).

## Passage architecture (law 12)

The shipped ELF-short mould is *received account says X → a historian or a
collection found a stranger story → hedged verdict* (`elf-b6-003`, `elf-b13-003`,
`elf-b12-003`). This unit has none of that skeleton: no received view, no
corrective pivot, **no interpreting voice at all**. The vestry sets a table, the
pinder is bound to a Sunday, two bills fall out of one week, nobody in the text
comments. The reader is the only one who can.

Divergence from `elf-b15-004` ("Quarnley Bar"), the nearest neighbour, is
deliberate and structural:

| | elf-b15-004 | this unit |
|---|---|---|
| evidence shape | natural experiment (one season unmanned) | a standing rule plus two paired micro-cases from one week |
| control | yes — the trust's other two gates | none; the two cases are their own comparison |
| thesis shape | what a low-revenue post is actually worth | no verdict on worth at all; incidence, not value |
| close | a silence in the surveyor's report | the fabric outliving the rule (1903) |
| opening | object + evaluative verdict ("It never paid for itself.") | object + its rule; the 4-word sentence is a pivot, not a verdict |

Thesis shape: **straight reconstruction, left unresolved** — not "the metric
measures the wrong thing", which law 12 caps. No aphoristic coda, no "not A,
but B" chiasmus; the passage simply stops.

Register: flat documentary local history, BrE. Rhythm alternates a 32-word
opening with a 4-word pivot ("Notice was another matter."), a 28-word
semicoloned pair of cases, and three 15–16-word sentences. Measured sd **7.61**
(blueprint floor 7).

## The inference

Three facts, stated separately, never joined:

1. the charge has a **running** part — "a shilling for taking up a beast and
   sixpence a night for its keep";
2. notice was **weekly and fixed** — cried "at the church door each Sunday after
   service, and nowhere else", and farmers on the far side of the common "heard
   of a beast no other way";
3. two bills from **one week** — Monday capture four shillings, Saturday capture
   one and sixpence — with the owners' conduct held constant: "Both were fetched
   on the Sunday they were cried".

One logical inch: the running charge accrues until the next crying, and the
crying comes once a week, so what an owner paid was fixed by how far his beast's
capture fell from Sunday. The passage never says it.

The stated numbers reconcile exactly at the stated rates — Monday: six nights,
12d + 36d = 48d = four shillings; Saturday: one night, 12d + 6d = 18d = one and
sixpence — but the item needs only the direction, not the arithmetic, so a
student who does not convert old money is not blocked (the shilling figure is
visible in both bills).

## Trap architecture

Stem: *What is implied here about the pound at Owlerby?* The form is the most
attested inference stem in the authentic ELF corpus — "What is implied here?"
appears **11 times in 405** stems, and the anchored variant ("What is implied
here about mole rats / about Newtok / about old-fashioned maps") several times
more. It is content-anchored (law 5) yet neutral: all four options are claims
about the pound, so no option can be eliminated as off-topic and there is no
50/50 split for a blind solver. It is also *not* the batch15 short's stem shape,
so the two units do not read as a pair.

| opt | role | mechanism |
|---|---|---|
| A | **scope-shift onto the wrong beneficiary** (and the set's only hedged option) | fees look like revenue and "probably" makes the claim modest; but one clause removes the parish from the money — "The pinder's office carried no wage: Jabez Skellorne had the fees instead" — and no parish receipts are given anywhere |
| **B** | **key** | one_inch_inference: joins the nightly element of the charge, the once-a-week crying, and the two bills |
| C | **half-right conjunction** | premise straight from the table (the charge *did* run by the night), which lends borrowed credibility to the verdict glued onto it. The verdict is unsupported twice over: the text never says when either owner missed his beast, notice ran through the Sunday crying and no other channel, and both beasts were in fact fetched on the same Sunday. A reader who stops at the comma takes it |
| D | **agency swap** | the fees were the pinder's, so a long stay *did* pay him better, and it is tempting to hand him the decision that produced it. Withheld precisely: he "was to cry what he held ... each Sunday after service, and nowhere else" — an obligation on a fixed day, so the calendar set the length, not his choice |

No distractor is verbatim-true as a whole: A misassigns the money, C is true only
in its first conjunct, D inverts who controls the clock.

## Self-blind-solve

Solved from the passage alone, arguing each non-key option in good faith.

- **C** is the strongest rival and the only one with real textual footing — the
  charge genuinely runs by the night, so a bigger bill genuinely means a longer
  stay. The case dies on what the passage does with *notice*: it spends two
  sentences establishing that the Sunday crying was the only channel, and then
  shows both beasts fetched on the same Sunday. Nothing in the text measures how
  quickly either owner missed his animal, so the second conjunct is imported.
- **D** is the next strongest, and it is beaten by a single clause rather than
  by argument: "and nowhere else" is a restriction on the pinder, not a licence.
- **A** is the trap for a cautious reader, and it is beaten by the colon in
  sentence two: the fees were his pay.
- **B** is the only option consistent with every number and rule in the passage.

**Result: single defensible answer (B). No rewrite needed.**

An earlier draft omitted the sentence "Farmers on the far side of the common
heard of a beast no other way." It was **added** because without it a skeptic can
argue that a diligent owner would simply have walked to the pound, which would
have made C defensible and the item two-way. With the channel stated, the
weekday is the only variable the text leaves standing.

Test-wise checks: no option carries an absolutizer (M-FORM clean) and the sole
hedged option is a distractor, so "pick the qualified answer" and "strip the
absolutes" both score nothing. Key letter **B**, not A (addendum rule 1).

### Hedge map (addendum rule 10)

| q | key shape | hedged option(s) | does "pick the qualified option" find the key? |
|---|---|---|---|
| 1 | flat, unhedged, specific assertion | A only ("probably", "a useful source") — **wrong** | **no** |

0 of 1 questions have a hedged key — inside the "not more than half" ceiling.

## Names (law 16 — search log, not a certificate)

**Tool used: Exa `web_search_exa` only.** The session's WebSearch budget was
already exhausted at the first call (200/200), so per addendum rule 4 every
query below went through Exa. All queries are re-runnable in any engine.
**Kept names are flagged for V-FINAL re-verification, not certified.**

| name | query | outcome |
|---|---|---|
| **Owlerby** (parish, pound) | `"Owlerby" village England`; `"Owlerby" farm hamlet parish` | first returned only unrelated real places (Owler Brook Primary School, Sheffield; Orby, Lincs; Scawby; Owmby); second returned **no results at all**. No settlement, farm, company or person. **Kept** |
| **Jabez Skellorne** (pinder) | `"Skellorne" name` | an attested rare surname: surnames.en-academic.com and meaningofthesurname.com record Skellorne as one spelling of locational *Skelhorn*, from a lost Lancashire village; WikiTree documents Hugh Skellorne, b. c.1583, Prestbury, Cheshire. **No notable bearer in any field; no bearer of the full name.** Kept on the same footing as batch15's *Bardsell* |
| **Aveline Hemblow** (byline) | `"Hemblow" surname person` | Exa returned **no matching result of any kind** (hits were unrelated OCR noise and song lyrics). No person, place, company or publication surfaced; no bearer of the full name. **Kept** |

**Rejected during this pass, each on a live collision:**

- *Crakemoor* — **real**: Crakemoor Farm and Crakemoor House, Airton, Skipton
  (BD23 4BB), with Airton census entries 1851/1861/1871/1911 and a 2019
  Yorkshire Dales planning notice.
- *Sallowby* — the village in Malcolm Saville's *The Luck of Sallowby* (1952);
  a live literary collision in the same period register.
- *Follick* — Mont Follick, British Labour MP for Loughborough 1945–55.
- *Bramskill* — *Holme v Bramskill* (1878) 3 QBD 495, a real English contract-law
  case; plus BRAMSKILL in Lancashire parish registers.
- *Vennaway* — the aristocratic family in Tracy Rees's *Amy Snow* (2015),
  Victorian setting.
- *Cawtherley* — living UK bearers (LinkedIn, Companies House) and Pte John
  Robert Cawtherley on the Burnley Roll of Honour, 1915.
- *Hessom* — Cmdr Robert Charles Hessom, US Navy, killed 1966 (DPAA register).
- *Quillick* — living bearers, and the stem echoes the shipped *Quillenby*
  (elf-b15-003).
- *Threpsdale* — dropped as too near real Threapland (Cumbria / N. Yorks).
- *Hobstow* — a named in-world artefact in Richard Powers's *Prisoner's Dilemma*.
- *Brindlow* — **no real-world collision**; rejected late, after a cross-check of
  the sibling batch16 drafts found `gen-elf-long` using it for its chemist,
  *Corin Brindlow*. Law 13 forbids reusing a surname across units, and M-ECHO
  would flag it once both are in the bank.
- *Marrowby* — recurrent in fiction: the warlock Cret Marrowby (Manly Wade
  Wellman's Thunstone stories; the *Monsters* episode "Rouse Him Not"), Wyndham
  Martyn's *The Marrowby Myth* (1938), and Marrowby Chase in an Elisabeth Grace
  Foley story.

**Not verified:** no direct check of the Ordnance Survey gazetteer, Companies
House, or the 1881/1911 census indexes — open web results via Exa only, exactly
as listed. No WebSearch call succeeded in this session.

Registry: *Jabez* and *Aveline* are both absent from the addendum's 214-name
USED GIVEN NAMES list (rule 8); *Jabez Skellorne* and *Aveline Hemblow* are
absent from the rule-9 full-name list; no given name repeats inside the unit; no
"Hal-" prefix. Gender: the historical officer is male (pinders were), the modern
byline female — inverting batch15's short-2 pairing.

**Sibling batch16 cross-check** (rule 8's "reuse one a sibling batch16 unit
declares"): the drafts present at the time of writing declare *Corin Brindlow*,
*Tamsin Quennerly* and *Rhodri Kettlestrand* (`gen-elf-long`). No given name or
surname here overlaps them. This check is what caught and removed *Brindlow*
from my byline.

Law 1: the passage anchors on no nameable famous thesis. The village pound and
the office of pinder are real historical institutions, but the 1846 table, the
Sunday-only crying and the two 1851 bills are all invented, and no general
knowledge of parish administration supplies any of them.

## Bands (measured with `mech.py`)

passage **169 tokens** (ELF short_text band 101–368; blueprint target 105–160 —
over the soft target by the same margin as the shipped `elf-b15-004`, which
measured 164) · **1 paragraph** (band 0–8; blueprint: 1) · 9 sentences, mean
**18.78 words** (band 12.0–47.2), sd **7.61** (blueprint floor 7) · prompt **9
tokens** (band 3–30) · options **15 / 16 / 18 / 17** (band max 31), ratio
**1.20** (cap 2.36), key B = 16, second shortest.

Typography: **1 spaced en dash** (byline), **0 em dashes** (addendum rule 3);
straight apostrophes, matching the shipped ELF bank (127 straight to 7 curly).
No byline "desk" tag — the plain-name form of `elf-b6-003` and `elf-b15-004`.

`run_mech.py --parsed-dir data/parsed --p5-corpus-dir auto` (100 shipped units
indexed):

```
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass · M-PLAGIARISM pass
```
