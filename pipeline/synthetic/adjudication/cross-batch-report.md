# P5 Cross-Batch Pattern Scan — LÄS + ELF passages, batches 1–11

**Scope:** 73 units (`candidates-final`) across batch1–batch11. batch12 and batch13 have no
`candidates-final/` yet (only `blind/` and `distractor/`), so they are out of scope.
**Read:** titles + passages only. No stems, no options, no keys, no rationales.
**Method:** built a single digest of `candidate_id + section + family + title + passage`
via jq, read it end to end, then ran phrase-family counts over the digest to quantify
every impression before writing it down.

The per-batch gates cannot see any of what follows. Each unit is individually fine.
The corpus is not.

**Headline:** this corpus is not "templated" in the soft sense. Three ELF long units and
seven LÄS long units are **paragraph-for-paragraph, transition-for-transition, and in
several places sentence-for-sentence the same text with the nouns swapped**. A student
who works twenty of these units will be able to answer the next twenty's main-idea and
scope questions before finishing paragraph one.

Findings are ranked by how much they matter to a real student.

---

## F1 — [SHIP-BLOCKER] The ELF long "Clean Story" mould is a verbatim clone, three times over

**Evidence:** `elf-b5-001` (The Cullet Ceiling), `elf-b6-001` (The Fullest Vault),
`elf-b7-001` (The Fastest Mend). Degraded but recognisable: `elf-b8-001` (Leave It Alone),
`elf-b9-001` (Slow Water), `elf-b4-001` (Wood That Waits).

These three are the same essay. Five paragraphs, same order, same job per paragraph,
and the connective tissue is near-identical text:

| move | b5-001 | b6-001 | b7-001 |
|---|---|---|---|
| P1 open | "For years the pitch to any glassmaker has run the same way" | "For years the case for a crop vault has been made by counting jars" | "For years the case for a resilient cable network has been made with a stopwatch" |
| P1 close | "It is a clean story, and it has shaped collection targets… What the story mostly skips is…" | "It is a tidy story, and it has set the collecting targets… What the story mostly skips is…" | "It is a clean story, and it has set the targets… What it mostly skips is…" |
| P2 open | "That question was finally put to a working furnace. At the Marholm container works, a team led by the glass chemist Ottilie Brandt… holding everything steady but the cullet" | "That fact was put to a working collection. At the Almvik seed store, a team led by the seed biologist Ingrid Sahlberg… holding the species and the cold-room conditions steady but varying one thing" | "That gap was put to a working network. At the Meridian cable-maintenance consortium, a team led by the reliability engineer Nadia Osei… holding the fault rate and the cable types steady but varying one thing" |
| P3 pivot | "Then Brandt's team looked past the fuel line…" | "Then Sahlberg's team stopped counting jars and started opening them." | "Then Osei's team stopped timing the ships and started weighing what the faults actually cost." |
| P3 close | "Read only the fuel line, and the greenest furnace is the fullest one. Read the reject bin too, and it is not." | "Count the jars, and the safest vault is the fullest. Open them, and it is not." | "Time the ships, and the fastest fleet looks the safest. Weigh what the faults cost, and it does not." |
| P4 open | "This is not how the case is usually made. Rasmus Feld, who runs the regional glass-collection program that feeds the works, makes it with no such hedging." | "This is not how the case is usually put. Tomas Renner, who runs the regional collecting network that feeds the store, puts it with no such hedging." | "This is not how the case is usually made. Bjorn Haugland, who runs the largest of the consortium's repair fleets, puts it with no such hedging." |
| P4 quote | "…— always, on every batch," he told me. "There is no such thing as too much recycled glass. If the melt comes out flawed, you clean the stream; you do not cut the cullet." | "…— always, whatever the shelf already holds," he told me. "There is no such thing as too many accessions. If seeds die in the cold room, you regenerate them; you do not stop collecting." | "…— always, whatever the map happens to look like," he told me. "There is no such thing as too many ships. A cable breaks, you mend it faster; you do not sit and redraw your routes." |
| P4 rebut | "Brandt is more guarded. The stream can indeed be cleaned, she agrees, but only so far and never for free… and no municipal system she knows of…" | "Sahlberg is more guarded. Regeneration capacity can indeed be enlarged, she agrees, but only so far and never cheaply… and no store she knows of…" | "Osei is more guarded. Route diversity can indeed be widened, she agrees, but only slowly and never cheaply… and no operator she knows…" |
| P5 | "The season's record, read whole, is more divided than Feld's rule allows… they run all the way up… The number that matters, in the end, is not how full the batch is. It is how clean… has a ceiling, and it sits lower than the collection targets like to admit." | "The decade's record, read whole, is more divided than Renner's rule allows… they run all the way up… The number that matters, in the end, is not how many accessions a vault holds. It is how many it can keep alive… has a ceiling, and it sits lower than the collecting targets like to admit." | "The eight-year record, read whole, is more divided than Haugland's rule allows… the gains run all the way up… The number that matters, in the end, is not how fast a fleet can mend a break. It is how little the network leans on any one cable… that floor sits well above what the repair-time targets like to admit." |

Phrase-family counts over the corpus: `"is more divided than …'s rule allows"` in 6 ELF units
(b4-001, b5-001, b6-001, b7-001, b8-001, b9-001); `"There is no such thing as too …"` in 3;
`"mostly skips"` in 3; `"run all the way up"` in 3; `"like to admit"` in 3;
`"he told me"` in 9 of 11 ELF longs.

**Why it matters to a student:** the question-to-paragraph mapping is fixed. Main idea =
"more X only up to a threshold, past which the hidden cost cancels the gain" (P3/P5).
"Which statement would the author most likely agree with" = whatever contradicts the named
industry man in P4. "The author mentions Feld/Renner/Haugland in order to…" = to set up a
foil. Three units taught this; the fourth is free marks without reading.

**Verdict:** SHIP-BLOCKER for `elf-b6-001` and `elf-b7-001` — they must not be served in a
set that also contains `elf-b5-001` (and they should be rewritten, not re-slotted; the
mould is too visible even at distance). `elf-b8-001` and `elf-b9-001` are borderline: they
carry the P4 foil and the "more divided than …'s rule allows" tag but have genuinely
different architecture elsewhere; strip the two tell-tale phrases and they stand.
Also a **generator law**.

---

## F2 — [SHIP-BLOCKER] The LÄS long "arkivforskaren" mould is a verbatim clone, seven times over

Two sub-moulds, both traceable to a single template.

**Mould A — "institution som överlevde":** `las-b5-001` (folkbadhus), `las-b6-001` (fäbodar).

- "När idéhistorikern Astrid Wennberg gick igenom kassaböcker och byggnadsritningar från **trettiofyra** svenska folkbadhus, letade hon efter en förklaring till varför somliga överlevde … medan andra revs … **Svaret blev inte det hon väntat sig.**"
- "När etnologen Ingrid Halvardsson gick igenom stödansökningar och gamla betesdagböcker från **fyrtioåtta** fäbodar …, letade hon efter en förklaring till varför somliga åter fylldes med kreatur … medan andra förblev tysta. **Svaret blev inte det hon hade väntat sig.**"

Then, in the same order in both: "**Wennbergs/Halvardssons material var spretigt. Hon lät sammanställa …**" →
"**För att inte dra förhastade slutsatser räknade hon bara de … där … täckte minst tjugo/femton sammanhängande år. Även då, medger hon, var siffrorna ojämna**" →
"**Sådana enskilda fall bevisar förstås inget i sig, men de gav Wennberg/Halvardsson en känsla för …**" →
"**Alla håller inte med. [Titel] [Manligt namn] invänder att [hon] förväxlar orsak och verkan. Enligt honom var det inte X …, utan tvärtom**" →
"**Han pekar också på att de bäst dokumenterade … råkar vara de som stod kvar längst, vilket i sig kan snedvrida bilden. [Hon] medger att urvalet inte var slumpmässigt, men håller fast vid att mönstret återkom även sedan hon räknat bort …**" →
"**Det vore lätt att låta [X] bada i nostalgins sken / i ett förgyllt skimmer, och [hon] varnar uttryckligen för frestelsen**" →
"**Att vare sig förhärliga … eller avfärda … vore att göra historien orätt**" →
"**Kanske är det, menar [hon], just i sådana … som ett samhälles … bäst kan avläsas — inte i …, utan i … Att minnas … kostar föga. Att förstå varför … kräver däremot att man läser [källan] lika noga som [den andra källan].**"

That is the entire text, twice, with the nouns swapped.

**Mould B — "räknandet gav ett annat svar":** `las-b7-001` (postväsende), `las-b8-001`
(humleodling), `las-b9-001` (folkbildning), `las-b10-001` (flottning), `las-b11-001` (apotek).

Shared, verbatim or near:
- opening `[Sak] skulle [stå i mitten / sitta i böckerna]. Det var vad [Namn] [räknade med / utgick från] när hon började arbeta sig igenom [källserien]` (b9-001, b10-001) or `När [titel] [Namn] gick igenom de [gulnade/flottiga] [källserien] [väntade hon sig / hade hon väntat sig] [X]` (b7-001, b8-001, b11-001);
- `Undersökningen vilar på ett tålmodigt/långsamt räknande` — 4 units (b7-001, b8-001, b9-001, b10-001);
- `sammanlagt drygt [tolv/nio/tjugotre/trettioett]tusen noteringar` — 5 units;
- `Materialet/Metoden har sina hål/luckor` — 4 units;
- `"Vi ser ett mönster, inte en lag", skriver hon` — **verbatim in two units** (`las-b7-001`, `las-b8-001`); `las-b3-001` carries the variant `"Vi ser ett samband, inte en garanti"`;
- `[Hon] medger invändningarna, men håller fast vid att mönstret återkommer i för många socknar/orter för att avfärdas/viftas bort` — 3 units (b7-001, b8-001, b9-001);
- `[Manlig ekonom-/agrar-/utbildningshistoriker] framhåller att … Han vänder sig dessutom mot själva räknandet: [år] ändrades bokföringssättet … Ökningen kan alltså delvis vara en förändring i skrivsättet. [Hon] medger att invändningen biter/träffar och räknar om materialet utan åren efter [år]; mönstret/utslaget försvagas men står kvar` — **the same confounder, the same rebuttal and the same recomputation, in `las-b10-001` (1938) and `las-b11-001` (1874)**;
- `Entydig blir/är bilden ändå inte. I [fem av de nitton / nio av de fyrtioen / fyra av de fjorton] … syns ingen skillnad alls, och i [ett par fall] …` — 3 units;
- closing `I dagens [skogsstatistik/redovisningar] räknas [kubikmeter/timmar och deltagare]. Vem som [gick längs stranden / förbereder vad] står det ingenting om.` — **verbatim formula in `las-b9-001` and `las-b10-001`**.

Every single mould-B unit is a Swedish historical-institution/agrarian *facktext* built on a
ledger series, six batches running (b6 through b11). There is no topical variation left to
find in the LÄS long slot.

**Verdict:** SHIP-BLOCKER for `las-b6-001` (clone of `las-b5-001`), `las-b8-001` (clone of
`las-b7-001`, including a verbatim researcher quote), `las-b11-001` (clone of `las-b10-001`,
including the identical bookkeeping-change confounder and recomputation). `las-b9-001` and
`las-b10-001` need the shared closing formula and the `"Vi ser ett mönster, inte en lag"`
family struck at minimum. Also a **generator law**.

---

## F3 — The whole corpus argues one thesis: "the number everyone quotes measures the wrong thing"

**Evidence (≈20 of 73):** `las-b1-002` (besökssiffra), `las-b2-002` (kronor per portion),
`las-b6-002` (konservburkar), `las-b7-002` (kilometer cykelbana), `las-b10-002` (böcker vs
bibliotekarie), `las-b10-003` (antal rastgårdar), `las-b11-002` (skyltar vs samordnare),
`las-b11-003` (timmar utomhus), `las-b10-001` (dagar, inte stockar — it is the *title*),
`las-b11-001`, `las-b9-003` (dyra ur vs behövda ur), `las-b5-003` (labbmått vs envishet),
`elf-b5-001` (fuel line vs reject bin), `elf-b6-001` (jars vs germination),
`elf-b7-001` (repair hours vs stranded traffic), `elf-b8-001` (nacre thickness vs roundness),
`elf-b9-001` (stored volume vs timing), `elf-b10-001` (commissioning figure vs year ten),
`elf-b11-001` (cumulative list vs residence time), `elf-b6-002` (predictability vs service cost).

Roughly one unit in three ends on "you are measuring the wrong quantity." A student who has
done twenty units will select the "the metric is the wrong metric" option on sight, for any
main-idea or author's-purpose stem, without reading the passage. The generator has one idea.

**Verdict:** not a per-unit blocker — every one of these is individually a good passage —
but the **single highest-value generator law**: cap the "wrong metric" thesis at ~15% of a
batch and mandate alternative theses (a genuine causal finding that holds; a
finding whose *mechanism* is the point; a straight historical reconstruction with no moral;
a case where the conventional measure turns out to be right and the challenger wrong).

---

## F4 — The scope-qualifier tail is a fixed answer-key leak

**Evidence:** the opening paragraph of a LÄS long/short ends on an em-dash tail that
narrows the finding: `— men bara där …` / `— men främst i …` / `— men framför allt …`.
Present in 12 units: `las-b2-002, b3-001, b3-002, b3-003, b4-002, b4-003, b5-001, b6-001,
b7-001, b8-001, b9-001, b11-001`. English equivalent: "…but only up to a point",
"…but only where", "That held in six of the seven islands".

Because the tail is *always* there and *always* in paragraph one, the answer to the
inevitable "vilket av följande sammanfattar bäst studiens resultat" is always the option
that carries the narrowest scope qualifier, and any option stating the finding unqualified
is always wrong. That is a test-wiseness rule a student will discover inside ten units.

**Verdict:** generator law — vary *where* the qualifier lands (bury it in the method
paragraph, or in the skeptic's objection, or make one unit per batch a finding that really
is general), and let at least one unit per batch have its unqualified headline claim be the
*correct* answer.

---

## F5 — Careful woman, overconfident man — 18 pairings, no exceptions

**Evidence.** LÄS longs, lead researcher (f) / named challenger (m), 9 for 9:
Vikbrandt/Korseberg (`las-b1-001`), Sahlberg/Lidström (`las-b3-001`),
Wennberg/Frimansson (`las-b5-001`), Halvardsson/Ohlander (`las-b6-001`),
Rahm/Lundqvist (`las-b7-001`), Hägglund/Rehn (`las-b8-001`),
Ödmark/Hasselgren (`las-b9-001`), Salomonsson/Löfroth (`las-b10-001`),
Törnkvist/Abrahamsson (`las-b11-001`).
ELF longs, careful researcher (f) / overclaiming advocate (m):
Marlow/Kessler (`elf-b2-001`), Brandt/Feld (`elf-b5-001`), Sahlberg/Renner (`elf-b6-001`),
Osei/Haugland (`elf-b7-001`), Vasco/Broek (`elf-b8-001`), Sorrel/Traer (`elf-b9-001`),
Rask/Marek (`elf-b10-001`), Draeven/Ruhe (`elf-b11-001`), Vey/Halloran (`elf-b7-002`).
The lone inversion is `elf-b4-001`, where the overclaimer Oldenburg is female — and there
the male voice (Renlund) is the careful one, so the *roles* still split by an axis, just a
different one.

Two costs. (1) Psychometric: the named man's position is always the distractor and the named
woman's hedge is always the key; a student can score the "author's attitude" and
"the author cites X in order to" questions off the gender of the name. (2) Editorial:
93 passages' worth of "women are cautious, men overclaim" is a stereotype the owner would
not choose on purpose.

**Verdict:** generator law — randomise the gender of both roles independently, and let the
challenger be right (or partly right, and the researcher wrong) in at least one unit per batch.

---

## F6 — [SHIP-BLOCKER] Proper-name collisions and a phonotactic monoculture

Hard collisions, found only by reading across:

| collision | units | note |
|---|---|---|
| **Ottilie Brandt** — glass chemist *and* historian | `elf-b5-001`, `elf-b5-002` | **same batch**, two different people, same full name |
| **Ingrid Sahlberg** — seed biologist (EN) *and* energiforskare (SV) | `elf-b6-001`, `las-b3-001` | cross-language reuse of a full name |
| **Salomonsson** — Ingeborg (flottningshistoriker) *and* Ingrid (läsforskare) | `las-b10-001`, `las-b10-002` | **same batch** |
| **Almvik** — seed store (EN) *and* centralkök (SV) | `elf-b6-001`, `las-b2-002` | invented place reused |
| **Kvarnby** — kommun *and* cykelpendlarort | `las-b2-002`, `las-b7-002` | invented place reused |
| Halloran / Halloway | `elf-b7-002`, `elf-b8-001`, `elf-b10-002` | three near-identical surnames |
| Öberg | `las-b4-003`, `las-b10-002`, `las-b11-001` | three bylines |
| Åkerlund / Åkerhielm | `las-b2-002`, `las-b6-002`, `las-b8-002`, `las-b11-003` | four |
| Lindqvist / Lindholm | `las-b3-003`, `las-b4-002`, `las-b5-001`, `elf-b6-001` | four bylines |
| Sundelius | `las-b9-003`, `las-b10-001` | two bylines |
| Brandt | `elf-b5-001/002`, `elf-b10-003`, `las-b9-001` | four |
| Elias | `elf-b3-002`, `elf-b4-001`, `las-b3-002`, `las-b10-003` | four; three of them bylines |
| Ingrid | 10 units | the default female first name |
| Hal- prefix | `elf-b2-001` (Halvard Inst.), `elf-b2-003` (Halvorsen Inst.), `elf-b3-002` (Halden Rail), `elf-b5-002` (Halden workshop), `elf-b7-002` (Halloran), `elf-b8-001` (Halloran), `elf-b8-003` (Halvard Sunde), `elf-b9-004` (Halvor Reim), `elf-b10-001` (the Halberd), `elf-b10-002` (Halvard Meng, Halloway), `elf-b10-004` (Hallvik), `elf-b11-002` (Halberg Bank), `las-b6-001` (Halvardsson) | 13 units share one invented-name syllable |

The invented Swedish place stock is likewise a closed set: `-vik / -berg / -by / -holm /
-fors / -stad / -näs` (Tärnvik, Kvarnby, Almvik, Rörsta, Björkedal, Töreby, Rönnberg,
Klippgruvan, Björkfors, Kvarnfors, Nyhamn, Ekesta, Rydstad, Vretstad, Skedvik, Härnavik,
Bjurhamn, Almnäs, Torneby, Vallsäter). The English stock is a matching invented-Anglo-Nordic
set (Corvane, Calder Vale, Nettleholt, Marish Wells, Marholm, Skerrow, Kettle Vane, Brayle,
Ardenshaw, Kelvain, Sarnhold, Vidmark, Alenga Bay). A student reads two batches and can
identify a synthetic passage by its place names alone.

**Verdict:** SHIP-BLOCKER for the four hard collisions (rename in `elf-b5-002`,
`elf-b6-001`, `las-b10-002`; and `Almvik`/`Kvarnby` reuse). Generator law: maintain a
persistent corpus-wide name/place registry and reject any surname, first name, invented
institute, or invented place already used; add a syllable-diversity check on invented names.

---

## F7 — [SHIP-BLOCKER] Topic and motif echoes across and within batches

- **Night trains, twice in one batch, one per language.** `elf-b3-002` "Slow Trains Home"
  (sleeper revival survives on subsidy; "take away the grants and the nostalgia") and
  `las-b3-002` "Nattåget hör hemma i infrastrukturbudgeten" (night train subsidy is
  infrastructure, not nostalgia). Same topic, same object, same nostalgia-vs-arithmetic
  argument, opposite sides — in the *same batch*. A student who does batch 3 gets the second
  passage's argument handed to them by the first.
- **Bathing institutions in decline:** `elf-b3-004` (spa town Marish Wells) and `las-b5-001`
  (folkbadhusens korta storhetstid). Same shape: an institution that sold water, undone by
  a change in the surrounding economics rather than in the water.
- **"A network is only as good as its weakest gap"** — four units, one thesis:
  `las-b4-002` (igelkottens glipor måste hänga ihop), `las-b7-002` (cykelnätet måste hänga
  ihop; *"Kedjan är aldrig starkare än sitt sämsta glapp"*), `elf-b7-001` (route diversity
  beats repair speed), `elf-b5-003` (*"The Weak Link"*, "the weak link is not the journey
  but the pause"). `las-b7-002` and `elf-b5-003` share the chain metaphor almost word for word.
- **Nocturnal wildlife vs human infrastructure:** `las-b1-001` (moths/streetlights),
  `las-b4-002` (hedgehogs/fences), `elf-b1-003` (owls/bats), `elf-b9-001` (beavers).
- **Ledger/archive as the source:** 13 units (`elf-b2-004, b5-002, b6-003, b7-002, b8-003`;
  `las-b5-001, b5-003, b6-001, b7-001, b8-001, b9-001, b10-001, b11-001`). Every LÄS long
  from b5 onward is a ledger study.
- **The "so-and-so's handwriting recurs in the book" vignette:** `las-b7-001` (Per Ersson),
  `las-b8-001` (Anders Bråth), `las-b9-001` (skomakaren Elis Brandt), `las-b10-001`
  (Karl-Otto Frisk), `las-b11-001` (Anders Follinger) — five consecutive batches, same
  colour-vignette slot, same disclaimer after it.

**Verdict:** SHIP-BLOCKER for `las-b3-002` (or `elf-b3-002`) — the two must not co-occur in
a set, and given both shipped in batch 3, one should be pulled or retopiced.
Everything else is a generator law: a corpus-wide topic ledger with a motif-level (not just
subject-level) collision check, plus a hard cap on ledger-study sourcing.

---

## F8 — The cloze slot map is fixed

**Evidence:** `elf-b1-002, b2-002, b3-002, b4-002, b8-002, b9-002, b10-002, b11-002`.

Recurring slot assignment: gap 1 = an abstract noun for skepticism/fad in the opening;
gap 2 = a verb of collapse or of bearing a cost; **gap 3 = a sentence-initial discourse
connective** (`___(3)___, the boom is easy to overstate` / `___(3)___, some of this is plain
convenience` / `___(3)___, the room itself does a good deal of the moral work` /
`___(2)___, the counter is where the margin lives`) — present in 6 of 8;
gap 4 = a hedging adjective attached to the expert; gap 5 = an abstract noun/adjective of
durability or transferability.

And the frame around gap 4 is nearly verbatim across units:
- b2-002: "She remains notably ___(4)___ about how far the numbers can be stretched"
- b3-002: "the revival is a good deal more ___(4)___ than the cheering headlines suggest"
- b4-002: "the revival is a good deal more ___(4)___ than the applause admits"
- b1-002: "far more ___(5)___ than the analysts assumed"

Every cloze is also the same genre object: an invented firm/platform with a Nordic-ish name,
an insider quote, an auditor/economist who cautions, and a closing "the ledger reads more
soberly than the headlines promise."

**Verdict:** generator law — randomise slot roles (never put the connective at the same
ordinal twice in a batch), forbid the "more ___ than the [headlines/applause/analysts]
[suggest/admit/assumed]" frame outright, and vary the cloze genre away from
business-commentary-with-a-cautious-auditor.

---

## F9 — Title morphology is a fingerprint

**ELF (41 units):** every title is ≤4 words, no colon, no subtitle. Two moulds only.
*The + modifier + noun*: The Self-Sealing Slab, The Vanished Fair, The Listening Ice, The
Water Cure, The Pilot's Tally, The Weak Link, The Cullet Ceiling, The Fullest Vault, The
Fastest Mend, The Forgiving Majority, The Expiring Key, The Fading Line, The Softest Ground,
The Weight Upstairs, The Plug Door, The Arrival Lists, The Last Flourish (17).
*Participle/gerund or clipped phrase*: Catching Clouds, Slow Trains Home, Slow Water, Slow
Learners, Long Grass, Going Up, Cold Comfort, Bought Quiet, Ringing Off, Holding the Line,
Reading the Grass, Working for It, Worth Mending, First Light, Rain on Cue, Deep-End Blue,
Buttered Margins, Borrowed Suppers, Analogue Comforts, Paid by the Ship, Leave It Alone,
Wood That Waits, Clockwork Current, Cut to Size (24). That is 41 of 41.

**LÄS (32 units):** the debatt/essä shorts are dominated by a negation headline —
`las-b1-002` (Räkna inte bara huvuden), `las-b2-002` (Vad centralköket **inte** kan väga),
`las-b4-003` (Dialekten **dör inte** av en skärm), `las-b5-003` (…är **också** ett arkiv),
`las-b6-002` (Beredskap byggs **inte** ensam), `las-b7-002` (Fler kilometer **räcker inte**),
`las-b8-002` (Slitaget **följer inte** fötterna), `las-b10-002` (Hyllorna **är inte**
skolbiblioteket), `las-b10-003` (Staket löser **sällan**…), `las-b11-003` (Timmar ute är
**inget** innehåll) — 10 of 32, plus 4 Vem/Vems/Vad interrogatives.

Real HP passages come from real publications with untidy, sometimes dull, sometimes long
headlines. This set reads as one magazine with one sub-editor.

**Verdict:** generator law — enforce title-form variety (allow long titles, colons,
subtitles, flat descriptive titles, quotations, place-name titles), cap "The + modifier +
noun" and cap negation headlines at ~2 per batch.

---

## F10 — Closing-cadence tics

- **ELF: two short sentences, the second an antithesis or a pronoun-turn.**
  "The instrument is optional. The effort is not." (`elf-b1-001`) ·
  "It may also be the only honest one." (`elf-b2-001`) ·
  "The dark keeps the wood. It keeps it from us, too." (`elf-b4-001`) ·
  "The dice, it seems, were never really the point." (`elf-b1-002`) ·
  "The spring had not changed; the map around it had." (`elf-b3-004`) ·
  "The pattern is not in the grass. It is in the angle you happen to be standing at." (`elf-b9-003`) ·
  "It is made of timing." (`elf-b9-001`) ·
  "The budget line is called enrichment; what it mostly buys is labor." (`elf-b11-004`).
- **ELF short: the researcher's hedge, then "Still, he/she suspects [not A but B]."**
  `elf-b4-003` ("the body cares less about the length of the night than about the moment the
  day begins"), `elf-b5-003` ("the weak link is not the journey but the pause"),
  `elf-b6-004` ("a question the growers were not really asking"). The hedge sentence itself
  ("X is careful about the limits / wary of drawing a rule from a single case / careful not
  to generalise") appears in 13 ELF units.
- **LÄS essä: "Kanske är det just därför…"** — `las-b5-001`, `las-b6-001`, `las-b6-003`,
  `las-b7-003`, `las-b8-002`.
- **LÄS pop-sci short: "Vinsten, om den kommer/infinner sig, …de flesta av oss…aldrig…"** —
  `las-b4-002` ("tillfaller ett djur som de flesta av oss bara hör men aldrig ser"),
  `las-b5-002` ("ligger i ett vatten de flesta av oss aldrig tittar ner i"). Near-verbatim.
- **LÄS: "Ändå pekar resultaten/materialet åt ett håll som sällan hörs i [rubrikerna /
  debatten / trädgårdsspalterna]"** — `las-b3-003`, `las-b4-002`, `las-b5-002`, `las-b7-001`,
  `las-b8-001`, `las-b9-001`, `las-b9-003`.

**Verdict:** generator law — ban the aphoristic two-sentence coda outright for a few batches;
require some passages simply to stop.

---

## F11 — The "not A, but B" chiasmus is the corpus's only rhetorical move

Beyond the closings: `las-b3-003` ("det är inte det högsta ljudet som stör mest, utan det
urskiljbara"), `las-b4-002` ("inte prydligheten som avgör, utan om marken bildar ett nät"),
`las-b7-002` ("det är sammanhanget som lockar, inte sträckan i sig"),
`las-b8-002` ("Det är väjandet, inte trycket, som sliter"),
`las-b9-003` ("Ett ur som någon dagligen rättar sig efter blir lagat… Ett ur som bara pryder
blir putsat men inte ställt"), `las-b9-001` ("Det avgörande var kanske inte vad som lästes,
utan att…"), `elf-b7-003` ("the scissors force a grip that cannot be reversed; the opener
and the ladle only invite one"), `elf-b8-001` ("not being left utterly in peace but being
unsettled, gently and on time"), `elf-b10-003` ("not because a circle is the strongest
shape… The reason was the seat"), `elf-b10-004`, `elf-b11-003` ("The hard part of rain is
not the water… The hard part is being seen").

This is the same device as F3 at sentence scale. It is what makes the corpus feel like one
author. It also means the "vad menar författaren med X" answer is always the B-term.

**Verdict:** generator law, folded into F3's cap.

---

## F12 — Debatt-short is a five-move skeleton with fixed connectives

**Evidence:** `las-b1-002, b2-002, b3-002, b4-003, b5-003, b6-002, b7-002, b8-003, b9-002,
b10-002, b10-003, b11-002`.

(1) provocative claim about a widespread practice → (2) first-person credential, almost
always "Jag har [X] i [N] år" (`las-b1-002` "bott… i tjugo år", `las-b2-002` "lagat mat…
i nitton år", `las-b11-002` "arbetat med frågan i elva år") → (3) pre-emptive concession
("Låt mig vara tydlig" `las-b2-002`/`las-b8-003`; "Missförstå mig rätt" `las-b1-002`;
"Jag förnekar inte" `las-b4-003`; "det ska erkännas" ×4) → (4) a named researcher's
scope-limited study → (5) the objection, always announced ("Invändningen kommer genast"
`las-b6-002`, `las-b7-002`; "Invändningen är känd" `las-b8-003`; "Invändningen är lätt att
förutse" `las-b5-003`; "Invändningarna kom snabbt" `las-b10-001`) → (6) closing imperative
aphorism.

Move (3) is also a pedagogic problem in itself: because the writer *always* concedes, the
"vilken invändning skulle författaren gå med på" answer is always "the obvious one, already
in the text," and the "författarens hållning" answer is always "kritisk men inte avvisande."

**Verdict:** generator law — vary the move order, drop the announced objection in half the
units, and let at least one debatt per batch be genuinely one-sided or genuinely uncertain.

---

## F13 — Numeric and byline register is uniform

- LÄS sample sizes are always two-digit spelled-out Swedish numerals in a narrow band:
  trettiofyra (b5-001, b7-001), fyrtioåtta (b6-001), tjugosju (b8-001), fyrtioen (b9-001),
  nitton (b10-001), fjorton (b11-001), nittiosex (b9-003), trettioen (b10-003),
  trettiofyra (b11-002), tjugoåtta (b10-002), nitton (b11-003).
- The total-observations line `sammanlagt drygt [N]tusen noteringar` appears in 5 units
  (nittontusen, tolvtusen, niotusen, tjugotretusen, trettioettusen); `las-b1-001` and
  `las-b4-002` use the same figure-with-"drygt" register (nittiotusen avläsningar,
  niotusen passager).
- English quantities are always spelled-out fractions with a hedge: "roughly a third",
  "barely a fifth", "two in three", "roughly seven in ten", "some four percent",
  "about sixty percent", "two-fifths".
- **Every** LÄS unit closes with `— Förnamn Efternamn, yrkesbeteckning` followed by 1–3
  `term = gloss` lines. **Every** ELF short closes with `— Name, [science|health|trade|
  sports|society|transport|engineering] desk/notebook` or `— Name, [X] columnist`.
  Nine distinct desk labels across 41 ELF units.
- The glossed terms are predictable: exactly the passage's one or two invented/technical
  nouns, always glossed, never a word a student might actually need.

**Verdict:** generator law — vary numeric register (digits, ranges, "ungefär 1 200",
percentages, no number at all), vary or drop the byline/glossary furniture, and sometimes
gloss nothing.

---

## F14 — Every long passage contains exactly one named skeptic, in the same slot

`las-b1-001` (Korseberg), `las-b3-001` (Lidström), `las-b5-001` (Frimansson),
`las-b6-001` (Ohlander), `las-b7-001` (Lundqvist), `las-b8-001` (Rehn),
`las-b9-001` (Hasselgren), `las-b10-001` (Löfroth), `las-b11-001` (Abrahamsson);
`elf-b2-001` (Kessler), `elf-b4-001` (Oldenburg), `elf-b5-001` (Feld), `elf-b6-001` (Renner),
`elf-b7-001` (Haugland), `elf-b7-002` (Halloran), `elf-b8-001` (Broek), `elf-b9-001` (Traer),
`elf-b10-001` (Marek), `elf-b11-001` (Ruhe).

19 of 20 long units. Always in the penultimate paragraph. Always introduced by a formula
(`Alla håller inte med` / `Andra forskare invänder` / `This is not how the case is usually
made` / `Not everyone reads the numbers so cautiously`). Always answered in the final
paragraph. The "author's attitude toward [skeptic]" question therefore always has the same
answer, and the skeptic's paragraph is always the *fourth* one.

**Verdict:** generator law — sometimes no skeptic; sometimes two who disagree with each
other; sometimes the skeptic wins; and move the slot.

---

## F15 — The generator was already drifting away from the mould by b10–b11

Worth recording because it tells the owner what "fixed" looks like. `elf-b10-001` (The
Weight Upstairs) and `elf-b11-001` (The Arrival Lists) break the F1 mould: no "clean story"
opener, no "This is not how the case is usually made", a genuinely different information
structure (a decaying benefit; a ratchet that cannot report losses), and in `elf-b11-001`
the skeptic is granted half his point on the merits. `las-b10-001` and `las-b11-001` show
the same partial escape on the Swedish side (the ledger "counts something else" opening,
the un-explainable outlier, the flat refusal to draw a moral). These two batches are the
proof that the mould is not necessary — and also the reason F2's mould-B verdict is
"repair," not "discard," for b10/b11.

---

## Ship-blocker summary

All eleven batches are already committed as shipped, so these are retro-pulls, not
pre-flight holds. Each is either a clone that must not co-exist with its twin in any
student-facing set, or a hard defect visible only across batches.

| unit | why |
|---|---|
| `elf-b6-001` | paragraph-for-paragraph clone of `elf-b5-001` (F1); also reuses the full name "Ingrid Sahlberg" from `las-b3-001` and the place "Almvik" from `las-b2-002` (F6) |
| `elf-b7-001` | third instance of the same `elf-b5-001` mould, including the "There is no such thing as too …" quote and the "…targets like to admit" coda (F1) |
| `las-b6-001` | sentence-for-sentence clone of `las-b5-001`, including the closing "Att minnas … kostar föga" formula (F2) |
| `las-b8-001` | clone of `las-b7-001`, including the **verbatim** researcher quote "Vi ser ett mönster, inte en lag" (F2) |
| `las-b11-001` | clone of `las-b10-001`, including the identical bookkeeping-change confounder, the identical rebuttal, and the identical "räknar om materialet utan åren efter [år]; mönstret försvagas men står kvar" (F2) |
| `elf-b5-002` | names its historian **Ottilie Brandt** — the same full name as the glass chemist in `elf-b5-001`, same batch (F6) |
| `las-b10-002` | names its läsforskare **Ingrid Salomonsson** against `las-b10-001`'s **Ingeborg Salomonsson**, same batch (F6) |
| `las-b3-002` | same batch as `elf-b3-002`: identical topic (night-train revival) and identical argument axis (nostalgia vs arithmetic / subsidy) in the two halves of one batch (F7) |

## Generator-law candidates (ranked)

1. **No two units may share a paragraph-level architecture.** Diff each new long passage's
   move sequence and connective phrases against every shipped long passage; reject on match.
2. **Cap the "the metric measures the wrong thing" thesis at ~15% of a batch**; mandate
   alternative thesis shapes (mechanism-is-the-point, conventional-view-confirmed,
   straight reconstruction, genuinely unresolved).
3. **Ban a phrase blocklist built from this scan** — "is more divided than …'s rule allows",
   "There is no such thing as too …", "It is a clean/tidy story", "What the story mostly
   skips", "The number that matters, in the end", "…like to admit", "he told me",
   "Still, he/she suspects", "Vi ser ett mönster, inte en lag", "Undersökningen vilar på ett
   tålmodigt räknande", "Materialet har sina hål", "Sådana enskilda fall bevisar …",
   "medger … men håller fast vid att mönstret återkommer", "Entydig är/blir bilden … inte",
   "Kanske är det, menar X, just i sådana …", "Ändå pekar materialet/resultaten åt ett håll
   som sällan hörs …", "Invändningen kommer genast", "Det vore lätt att …, och X varnar
   uttryckligen för frestelsen", "more ___ than the headlines/applause/analysts".
4. **Corpus-wide name and place registry** — reject any reused surname, first name, invented
   institute, invented firm, or invented toponym; add a syllable-diversity check ("Hal-"
   appears in 13 units); forbid cross-language reuse.
5. **Randomise the gender of researcher and challenger independently**; let the challenger
   be right sometimes.
6. **Move the scope qualifier** off the end of paragraph one; allow unqualified findings to
   be the correct answer.
7. **Vary the skeptic slot**: none / two mutually disagreeing / skeptic wins / not in the
   penultimate paragraph.
8. **Randomise cloze slot roles**; never put the sentence-initial connective gap at the same
   ordinal twice in a batch; retire the business-commentary-with-a-cautious-auditor genre.
9. **Title-form variety quota** — cap "The + modifier + noun" (currently 17/41 ELF) and
   negation headlines (currently 10/32 LÄS); permit long, colon-bearing and flat titles.
10. **Corpus-wide topic and motif ledger** — collision check at motif level (chain/weakest-
    link, ledger-study sourcing, nocturnal-wildlife-vs-infrastructure, institution-in-decline),
    not just subject level; hard cap on ledger-study sourcing (currently 13 units).
11. **Retire the aphoristic two-sentence coda** and the "not A, but B" chiasmus for several
    batches; require some passages simply to stop.
12. **Vary numeric register and passage furniture** — digits vs spelled-out, ranges,
    no-number; drop the byline and the glossary in some units; sometimes gloss nothing.
13. **Vary the debatt five-move skeleton** — reorder moves, drop the announced objection in
    half the units, allow a one-sided or genuinely uncertain opinion piece.
14. **Add a cross-batch scan to the pipeline itself** — this report's phrase-family counting
    is cheap and would have caught F1 and F2 at batch 6.
