# gen-elf-short-1 — "Loose at the Foot" (ELF short_text_1q, TYPE-001)

Batch17 · ELF short unit 1 · `candidate_id: PLACEHOLDER` · 1 question · BrE

---

## 1. Topic and lane

**Canal lock gates: why the pin under the heel post is deliberately left
unanchored.** A pair of gates meets in a shallow V pointing upstream; the water
closes that joint instead of forcing it open; and because the foot of each leaf
is *not* fastened down, the leaf can shift the little it can and bed its heel
into the iron in the wall, so the push travels along the leaf into the masonry
rather than into the pivot.

The lane brief offered four candidates. The other three were rejected **before
drafting**:

- *tuning a bell by removing metal* — grazes the shipped
  `klockgjutning-craft-reportage-long` (bell founding), on the do-not-graze list.
  (Batch16 rejected it for the same reason; it has not become safer.)
- *road camber and surface drainage* — sits next to the shipped
  `road-marking-lifespan-science-journalism-short`, **and** would make this the
  second water-drainage mechanism in consecutive batches after batch16's
  cavity-wall short. Two drainage shorts in a row is the mould-repetition law 12
  exists to stop.
- *crack-arrest riveting in ship hulls* — the Liberty-ship brittle-fracture
  story is a famous explainer thesis; law 1 forbids anchoring on one and G-STEM
  kills general-knowledge items.

**Graze check against the 107 excluded families.** Nothing on the list concerns
canal locks, gates, or hydraulic structures. The four nearest were checked
individually and are disjoint: `flottningshistoria-facktext-long` (Swedish
timber floating — no lock, no gate, no shared mechanism),
`buoy-tending-mooring-scope-reportage-long` (mooring geometry in open water),
`submarine-cable-repair-science-journalism-long`,
`history-of-navigation-history-essay-long` (position-finding, not waterway
works).

**Authentic-corpus topic screen** (`data/parsed`, 28 sittings, 4320 rows):
`lock gate`, `mitre`, `miter`, `sluice`, `quoin`, `pintle`, `towpath`, `weir`,
`barge`, `lockkeeper` → **zero hits**. `canal` → two hits, both the same
sentence in `host-2023` about Asian carp reaching Lake Michigan "via the Chicago
Sanitary and Ship Canal" — an invasive-species passage with no overlap of topic,
mechanism or vocabulary.

**Shipped-bank screen**: grep for the same terms across every candidate JSON in
`batches/` returned only false positives inside metadata prose. No shipped P5
unit touches this topic. M-ECHO passes against all 107 indexed units.

## 2. Physics first — the directionality check batch15 failed

Batch15's rail short was refuted at V-FINAL for backwards thermal physics, so
the mechanism here was verified against nine sources **before a word was
written**. Tooling, stated plainly: **WebSearch was already exhausted (200/200)
at the first call**; Firecrawl search returned HTTP 401; Mojeek, lite.DuckDuckGo
and Brave result pages all returned HTTP 403 to WebFetch; an Exa `web_fetch_exa`
fetch of the Mojeek exact-phrase page errored (`CRAWL_UNKNOWN_ERROR`). Every
source below was therefore reached through the **Exa `web_search_exa` MCP tool**.

| claim in the passage | direction | source |
|---|---|---|
| the V points **upstream**, not downstream | up-canal | Britannica *mitre gate* ("an angle pointing upstream"); Wikipedia *Lock (water navigation)* ("18° angle to approximate an arch against the water pressure on the upstream side"); Timber Framers Guild/Lancaster C&O report ("they meet as a miter pointing upstream") |
| the water **closes** the joint rather than forcing it open | joint tightens under head | Lancaster: "the higher the water level, the tighter the gates get" |
| the two leaves together are longer than the lock is wide | ~10% longer | Britannica: "the combined lengths of which exceed the lock width by about 10 percent" |
| heel post rounded by hand; the post stands on a pin in a cup in the stone | — | canallockgates.co.uk (heel posts "rounded by hand"); Stratford-upon-Avon LHS *Lock Construction* (a Cup set into the cill, a Pin "sometimes known as a Pintle") |
| **the pin is NOT fastened down, and that is what lets the leaf bed its heel harder into the wall** | freedom at the foot → tighter seating | Lancaster, decisive: "The bearing pin … **is not anchored at all**, but simply rests on the stone … **which allows the gates, when closed, to press more tightly into the masonry quoin**" |
| a **fixed** foot would intercept the push | fault condition, not design | Fillmore & Smith, *Behavior of Flexible Pintles for Miter Gates* (ASCE): "in many gates the bottom hinge, a fixed pintle, **interrupts this thrusting action by taking a portion of the load itself** … not designed for such loading"; remedy = free / rocking / elastomeric pintles |
| the push runs along the leaf into the masonry | three-hinged arch, walls as abutments | Amster, *Hydraulic Model Investigation of Miter Gate Operation* (ASCE): "the gate acts as a three-hinged arch … the lock walls acting as abutments for the end thrust"; Eick/Smith/Fillmore (ERDC): load "transferred into the lock chamber wall through axial compression of the horizontal girders" |
| an iron plate lines the recess the heel beds into | cast-iron quoin facing | Stratford LHS: cast-iron "Coins" giving "an excellently flat surface, top to bottom, for the gate to bear against" |
| the collar at the head is shimmed | — | Lancaster: "The collar at the top can be tightened or loosened by adjusting metal shims as needed" |
| green oak; feet and inches | — | Canal & River Trust *Building lock gates*; Country Life *The lock-gate maker* (imperial measurement, no two locks alike) |

The item turns on rows 5–7 — the line of real engineering a domain-competent
solver is *unlikely* to hold (most people assume a hinge is bolted down), which
is what keeps the question passage-dependent rather than general knowledge.

**One clause is the writer's framing, not a sourced rule**, and is presented as
such: that the collar shimming is "a matter of hang, of the mitre posts meeting
true". Lancaster says only that the collar is adjusted with shims "as needed";
the Stratford source says the collar retains the gate in position. No figure or
tolerance is attached to the claim.

**Leonardo da Vinci is deliberately not mentioned**, though several sources
credit him with the mitre gate: naming him hands a knowledgeable solver a handle
and pulls the item toward general knowledge (law 1).

## 3. Trap architecture (q1, key **A**)

Stem: *"What are we told about the pin the leaf stands on?"* — the
`What are we told about X` form, **37 occurrences in the 405 authentic ELF
stems** (verified by regex over `data/parsed`, not from memory). Deliberately
**not** batch16's "What is said about …" (60 occurrences, but used one batch
ago), and not sentence-initial "According to the text, …", which occurs 0 times
sentence-initially in the corpus (23 times as a trailing or medial clause).

| opt | trap | build | how the passage defeats it |
|---|---|---|---|
| **A** | **key**, `paraphrase_one_sentence` | recasts "The pin is not fastened down. Nothing down there is fixed against a sideways push, so the water shifts the leaf what little it can and beds its heel into the iron plate that lines the recess." | — (corroborated by the next sentence: the push "runs along the leaf into the masonry, and next to none of it reaches the pin") |
| B | reversed mechanism (strongest) | "fixed hard into the stone so that the leaf cannot move" — the intuitive picture of a hinge, supported on the surface by "a cup set in the stone" | the six-word verdict sentence: "The pin is not fastened down"; and the leaf demonstrably does move ("shifts the leaf what little it can") |
| C | half-right conjunction | true first clause ("It carries the leaf's weight") welded to a wrong cause plus an unsupported "usually" | the passage assigns the collar shimming to a different reason — "a matter of hang, of the mitre posts meeting true" — and never says how often collars are shimmed |
| D | `quantifier_upgrade` | "the whole of the water's push" + "every leaf is hung to make certain of it" | "next to none of it reaches the pin"; the second absolute is nowhere in the text |

Longest shared token run between each option and the passage, computed with
`mech.tokenize()` rather than eyeballed: **A 2, B 2, C 2, D 2** (`its heel` /
`so the`, `is fixed`, `the leaf`, `of the`). No option reproduces a passage
clause and none reaches even a 3-token run; the key is a genuine recast (law 3,
and the blueprint's "no distinctive ≥4-word run" rule for keys).

## 4. Self-blind-solve (done cold, arguing for each distractor)

- **B** — *For:* the pin sits "in a cup set in the stone", which sounds fixed;
  and every hinge a reader has met is bolted down. *Against:* the passage's
  shortest sentence denies it outright, and the leaf is described moving.
  **Not defensible.**
- **C** — *For:* its first clause is stated almost in those words, which is what
  makes it the dangerous option. *Against:* the causal half is contradicted —
  the shimming is about hang — and "usually" is unsupported. **Not defensible
  as a whole statement.**
- **D** — *For:* the water pushes on the leaf and the leaf stands on the pin, so
  the load "must" arrive there. *Against:* "next to none of it reaches the pin".
  **Not defensible.**
- **A** — supported directly by the two sentences at the centre of the passage
  and corroborated from the other end by the sentence after them.

**Result: exactly one defensible answer.** No rewrite was needed on this axis.

## 5. Hedge map (rule 10)

With a single question the "pick the qualified option" heuristic must not select
the key at all.

| opt | form | correct? |
|---|---|---|
| **A** | **flat, unhedged assertion** | ✓ |
| B | flat | ✗ |
| C | hedged ("usually") | ✗ |
| D | hard absolutiser ("the whole … every") | ✗ |

Pick-the-hedged lands on C (wrong); strip-the-absolutes eliminates only D and
leaves three (undecided). M-FORM passes for the same reason — only one
distractor carries an absolutiser.

**Key letter A, chosen deliberately, not by default.** The six most recently
shipped ELF shorts key on B, C, B, C, D, B (`elf-b13-003` C, `elf-b13-004` B,
`elf-b15-003` B, `elf-b15-004` C, `elf-b16-003` D, `elf-b16-004` B) — A appears
in none of them, so A is the letter that improves the bank-wide spread. Rule 1
forbids *defaulting* to A, not using it.

**Length:** A 17, B 17, C 18, D 19 under `mech.tokenize()`. The key is tied for
**shortest**; the single longest option is a distractor. Ratio 1.12 against the
2.36 ELF cap.

## 6. Law 12 — divergence from the shipped moulds

Move sequence: *a flat denial of the reader's default picture → the geometry →
how the leaf is carried → a six-word verdict sentence → the mechanism the item
turns on → where the push actually ends up → what the pivot is left with → a
correction about a neighbouring adjustment → a material digression that simply
stops.*

Deliberately unlike the shipped ELF shorts: no received view quoted and
corrected (`elf-b10-003`, `elf-b8-004`), no negation-and-misdirection opener
carried through the piece, no second-person scene (`elf-b12-003`), no named
expert and no quotation, no log or tally of incidents (`elf-b15-003`'s 39
buckles), no aphoristic close and no "not A, but B" coda.

Nearest shipped relative is **`elf-b16-003`** (cavity-wall open joints) — the
immediately preceding TYPE-001 short, also practitioner-bylined. The
divergences are structural and deliberate: that piece opens flat and closes on
an ambiguity the trade cannot resolve; this one opens on a denial and closes on
a material aside. That piece turns on **when** something happens (during the
blow vs in the lull); this one on **where** a force goes (through the leaf into
masonry, not into the pivot). That one is a static wall in weather; this one a
moving structure in still water.

## 7. Names (law 16 / rule 4 / rules 8–9)

**One name in the whole unit** — the byline. No canal, lock, navigation,
workshop, trust, firm or standard is invented. That is deliberate here beyond
the usual economy: British canal infrastructure is densely and specifically
named, so *any* invented toponym would risk landing on a real one.

- **Duncan** — an ordinary British given name; checked against the batch17
  rule-8 list of 231 used given names, **not present**, and absent from the
  rule-9 full-pair list. Chosen over an ornate coinage so only one element of
  the byline carries collision risk.
- **Thurlmede** — `"Thurlmede"` returned **no result containing the string**
  (hits were for the unrelated Swiss healthcare group "thurmed"); a second,
  domain-paired query returned genuine lock-gate trade coverage with no
  occurrence of the name. Nearest real neighbours: Thurlow, Thurlby,
  Thurlestone — none is this string, none in this trade. **Kept as an unattested
  coinage and flagged for V-FINAL re-verification, not certified.**

**Rejected during this pass**, each on a live collision (full hits in
`originality_note`): **Marlbeck** (Marlbeck Ltd clothing brand in the Jersey
Heritage collection; Thomas Marshall (Marlbeck) Ltd, Leeds; Marlbeck Mine,
Northern Pennines), **Nethercleave** (real Devon places/farms), **Ollerbank**
(Ollerbank Farm, Edale), **Tarnwick** (two real companies; also a fictional
village in a published novel), **Gantlow** (Gantlow Ltd, Manchester; "Aston
Gantlow" in 15th-c. records), **Brackenwold** (Dolmenwood RPG setting),
**Draysett** (a real Cambridgeshire house name used as a Companies House
address), **Ashmoyle** (Ashmoyle Services Ltd, an electrical installation
company — a bearer *in the building trades*), **Standrick** (several real
people), **Ferrimond** (real Lancashire surname, 1881 census + living bearers),
**Ratchbourne** (no exact hit, but one letter from the documented
Rathbourne/Rathborne/Rathbone family), **Wardlebeck** (no exact hit, but killed
on a domain collision a string search alone would miss: **Wardle Lock and the
Wardle Canal at Middlewich are real, named canal infrastructure**).

## 8. Declared shortfalls

1. **The two-index name recipe could not be completed.** WebSearch was
   exhausted at 200/200 before the first query; Firecrawl returned 401;
   Mojeek/DuckDuckGo/Brave returned 403 to WebFetch; Exa's fetch of the Mojeek
   exact-phrase page errored. **Every name result comes from one index (Exa),
   which is a semantic index, not an exact-phrase one.** The kept surname is
   flagged for V-FINAL rather than certified. No gazetteer, Companies House,
   electoral-roll or census database was queried directly.
2. **Phrase probing is absent, not partial.** For the same tooling reason, no
   exact-phrase sweep of the passage's distinctive strings was run. This falls
   short of the eight-phrase Tier-2 sweep in `elf/anti-plagiarism.md` and should
   be re-run at V-FINAL. What *is* verified: M-PLAGIARISM passes against the
   authentic UHR corpus and M-ECHO against all 107 shipped units.
3. **Length above the blueprint target.** 179 mech tokens against the
   blueprint's 105–160. `bands.json` — the only mechanical authority (law 10) —
   allows 101–368 for ELF short_text, and the largest shipped P5 short is 166,
   so this is ~8% above its largest sibling, not a new regime. The length is
   spent on the three sentences that make the item defeasible without making it
   skimmable: what the unanchored foot is *for*, where the push goes *instead*,
   and what the collar shimming is *actually* about — the last being the only
   thing in the text that defeats distractor C.
4. **Readability below the blueprint band.** fk_grade **7.2** against the
   blueprint's 11.0–15.0 (FRE 78.9, polysyllabic 2.8%). The register is
   deliberately plain trade prose; three register edits ("pivots", "lines the
   recess", "throughout") lifted it from 6.9 without touching the mechanism. No
   mechanical gate checks readability (law 7); the shipped ELF shorts span
   ~7.0–16.2, with `elf-b15-004` shipping at 7.0 with zero gate flags and
   `elf-b16-003` at 8.7.
5. **BrE evidence is thin by count.** Exactly one token in the student-facing
   text distinguishes BrE from AmE orthography — `mitre`. The rest of the signal
   is lexical (`heel post`, `a matter of hang`, `green oak`, `feet and inches`,
   `lines the recess`). Stated as a count rather than a blanket "BrE held
   throughout". The canal-trade spelling `cill` was deliberately avoided (the
   passage says "a cup set in the stone") because a reviewer could not
   distinguish it from a misspelling of "sill".

## 9. Mechanical gates (final file, re-run after every edit)

`run_mech.py gen-elf-short-1.json --parsed-dir <main>/data/parsed
--p5-corpus-dir auto` (107 shipped units indexed):

```
M-SCHEMA pass · M-BANDS pass · M-TELL pass
M-FORM pass · M-ECHO pass · M-PLAGIARISM pass
```

Bands: passage 179 mech tokens (bands.json 101–368 ✓); 1 paragraph (0–8 ✓);
mean sentence 19.9 (12.0–47.2 ✓); sentence lengths [11, 34, 24, 6, 31, 18, 10,
24, 21], sd 9.0 (blueprint ≥7 ✓); prompt 11 tokens (3–30 ✓); options 17–19
tokens (0–31 ✓); option-length ratio 1.12 (cap 2.36 ✓).
