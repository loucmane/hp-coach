# gen-las-long — generator notes (batch17)

**Unit:** LÄS long, 4 questions.
**Family:** `tandstickstillverkning-facktext-long`
**Title:** Fem millimeter paraffin
**Byline:** – Melker Slånstedt, industrihistoriker
**candidate_id:** literal `PLACEHOLDER` (orchestrator assigns).

---

## 1. Lane and graze check

Assigned lane: Swedish craft/industry history. Chosen topic: **tändsticksfabrikation**
(match manufacture) at a fictional works, c. 1876–1938.

Grep over `batches/` for `kvarn|färger|fargeri|mjölnar|tändstick|stenhugg|krukmak`
returned **zero** hits on any match-industry term; the `kvarn` hits are incidental
(`kvarndammen` as a water source in las-b15-001, a broken millstone in a cairn in
las-b13-001). The topic appears nowhere in the batch17 addendum's 107-family
exclusion list.

The other four candidates in the brief were rejected for graze, each against a
specific shipped unit:

| candidate | rejected because |
|---|---|
| krukmakeri | clay + kilns; grazes `tegelbrukshistoria-facktext-long` (las-b16-001) — the brief flagged this and it holds |
| textilfärgeri / garnfärgning | wet-vat chemical trade on a watercourse, guild, effluent; grazes `garverihantverk-facktext-long` (las-b15-001) |
| vattenkvarn / mjölnarhantverk | parish grain + payment in kind (tull) grazes `sockenmagasin-recension-long` (las-b14-002), whose whole mechanism is lending grain and taking an eighth back in rye; water-power siting also brushes `flottningshistoria` |
| stenhuggeri | "sten" lane already carries `stenmurar-odlingslandskap-popularvetenskap-long` (las-b13-001) |

**Anti-clone (law 12).** Diffed the move sequence against the two most recent craft
units. las-b16-001 (tegel) opens by *reading the process off a surviving artefact*
("tegel i tre färger… ingenting av detta är slumpartat"), carries a bottleneck
thesis (drying limits output, the kiln always keeps up), and ends on a physical
observation with a sting. las-b15-001 (garveri) opens on a *dated regulatory order*,
runs a named-historian corrective ("varnar för att läsa fjortonmånaderssiffran
som en arbetstid"), and closes on ruins-and-parking-lot. This unit uses **none** of
those: opening move is a **framing-claim** about substitutability; the epistemic frame
is *not* ledger-study sourcing (documents are cited only in passing — one printed
instruction, one summary, one note); the thesis is **adoption-by-fit**, not a
bottleneck; there is no corrective-expert slot at all; and it closes on **present-day
continuity** ("Badet finns kvar…"), which is neither a decline coda nor an aphorism.
Skeptic slot: none (the uncertainty is carried by an anonymous statistical caveat,
not by a named challenger). Saturated motifs avoided: ledger-study sourcing,
weakest-link chain, institution-in-decline.

## 2. Blueprint instance

- size `long` · macro_genre `sakprosa` · fine_genre `facktext_larobok`
- opening_move `framing-claim`
- word_count **991** (band 750–1135, target ~995) · sentences **64** ·
  mean sentence words **15.48** (band 14–25; comparable shipped longs sit at
  15.1–17.7) · paragraphs **10** (band 4–17)
- register markers: nominalisation (`sorteringen`, `ramfyllningen`, `impregneringen`,
  `vintervittring`-type compounds), `-s`-passives (`sköttes`, `svarvades`, `höggs`,
  `klistrades`, `byttes`, `uppgavs`), 4 glossed specialist terms
- sentence-length variance is deliberate: min 3 words (`Det ändrade ingenting.`),
  max 59 (the P6 colon sentence), with short verdict sentences set against long
  subordinated ones
- frame: title line, byline last, glossary at the very tail, both inside `passage`
  per law 6. Glossary defines only words that occur: **sats** (P2, P3), **kubb**
  (P2 `aspkubb`, P8, P9), **plån** (P8), **brandstodsbolag** (P4).

Skeleton: p1 framing-claim (the wood is the one thing that cannot be swapped) →
p2 method (kubb → band → sticka → ram → two baths) → p3 mechanism + case (what the
paraffin is *for*; the autumn-1897 batch) → p4 caveat (afterglow; the fire tables
cannot distinguish burning from glowing) → p5 counterpoint (the 1904 spruce/birch
trial) → p6 finding (two routes against the glow; the 1911–12 choice) → p7 residue
(the white bloom, complaints that never stop) → p8 background (boxes, home work,
the war) → p9 close (1938, and the bath still there).

**Anti-tidiness (law 9).** Deliberate residue that does not point at any answer:
the hoist installed in 1902; the spill burnt under the boiler; the frame returned
for crooked splints; forty gross of birch matches sold anyway to a buyer who never
got in touch; boxes that dried unevenly sold empty to a shopkeeper; the 1938
note that says the bath had to be mixed stronger but not how much stronger. The
central assumption of the whole twenty-year effort is left explicitly untested
("ett antagande som fabriken saknade medel att pröva").

## 3. Planted targets and trap architecture

Every distractor is a named operation on a planted, hedged/directional/scoped claim.

### Q1 — `enligt_texten_detalj` · key **B**
*Target (p3):* the paraffin is drawn into the top five millimetres and receives the
flame from the head; the autumn-1897 batch went out with paraffin that had *stayed
in the surface*; merchants wrote that the matches ”tände men slocknade”.
Note the item is anchored to a **passage-specific event**, not to general match
chemistry, so a knowledgeable solver cannot answer it without reading.

| opt | operation |
|---|---|
| A | `reversed_causality` — inverts both the direction and the failing layer (too *much* paraffin, head won't stick) |
| **B** | **key** — paraphrase of the transfer failure; no sentence is copied |
| C | `plausible_worldknowledge` — spontaneous ignition is a real historical fear about old matches, and is nowhere in this text |
| D | `scope_shift` — jumps to the box department in p8, where glue does occur but no fault is reported |

### Q2 — `detalj_ospecificerad` · key **D** · **short-breath question**
Stem 5 words; every option ≤ 7 words (rule 5's short-breath floor).
*Target (p5):* birch is given three matching properties in a row (cuts easily,
lights as readily, burns as evenly) and exactly one deviation (the glow lasts about
twice as long). Price is planted in the *opposite* direction on purpose.

| opt | operation |
|---|---|
| A | `reversed_causality` — text says birch lit **lika villigt** |
| B | contradicted quantity — text says birch was **billigare** that year, which is what `Det ändrade ingenting.` is for |
| C | **attribution swap** — it was the *spruce* splints that cracked in the cutting machine, one sentence earlier |
| **D** | **key** — the single deviation, paraphrased |

### Q3 — `detalj_ospecificerad` · key **A**
*Target (p6):* the two remedies were noted as **little different in effect**, and the
stated reason for the choice is "of another kind" — an existing room and existing
staff versus a new contract, a longer haul and about eighteen per cent more.

| opt | operation |
|---|---|
| **A** | **key** — restates both halves (effect roughly equal; no new contract or transport) |
| B | `reversed_causality` — makes efficacy the reason, which the text explicitly denies |
| C | `half_right_conjunction` — second clause true, first clause inverts the sentence the whole paragraph rests on |
| D | `overgeneralisation` — turns "≈18 % dearer delivered" into "unobtainable" |

### Q4 — `huvudbudskap_syfte` · key **C**
*Target:* whole-text span — p1 (properties, not price per cubic metre, decide a
purchase), p5 (a wood property kills the trial even though birch was cheaper), p6
(the fix that fits the existing plant wins), p8 (boxes and splints draw on the same
pile; aspen becomes a line in a calculation only during the war).

| opt | operation |
|---|---|
| A | `detail_as_main` + `overgeneralisation` — promotes one thread and inflates it to "hela tändsticksindustrin"; the text calls the danger an untested assumption |
| B | `overgeneralisation` — absolute "varje förändring", refuted by the 1902 hoist, the 1912 bath and above all the 1938 splint machine |
| **C** | **key** — spans four paragraphs; each distractor spans one |
| D | `half_right_conjunction` / `reversed_causality` — first clause has partial support (the 18 % figure), second clause is refuted by p1 and by p8's closing pair of sentences |

**Law 11 check (bäst-item):** no distractor in Q4 is fully, verbatim true. A
overreaches on scope, B is contradicted by a dated fact, D is contradicted by two
explicit sentences.

## 4. Hedge map (rule 10)

| q | key register | hedged distractor? | does "pick the qualified option" select the key? |
|---|---|---|---|
| 1 | flat assertion | no — all four flat | **no** (heuristic inert) |
| 2 | flat assertion | no — all four flat | **no** (heuristic inert) |
| 3 | carries the only hedge (`ungefär densamma`) | C asserts a *large* difference; D is absolute | **yes** |
| 4 | flat, confident (`avgjordes av…`) | **D is the cautious-sounding option (`tycks ha styrt`) and is WRONG**; A and B are absolute | **no** |

So the heuristic lands on the key in **1 of 4** questions — at or below the ≤ half
requirement — and Q4 is the engineered inversion the rule asks for (flat key,
hedged wrong answer).

## 5. Key spread and length tell (law 10 / M-TELL)

Keys: **B, D, A, C** — one per letter, no positional tell.
Key is the longest option in **0 of 4** questions:

| q | option words | key | key words | longest |
|---|---|---|---|---|
| 1 | 10 / 8 / 8 / 7 | B | 8 | A (10) |
| 2 | 5 / 7 / 4 / 6 | D | 6 | B (7) |
| 3 | 13 / 11 / 12 / 15 | A | 13 | D (15) |
| 4 | 9 / 11 / 12 / 14 | C | 12 | D (14) |

Max option-length ratio 1.75 (cap 5.25). Options ≤ 15 words (rule 5 cap: 21), no
semicolons, no row of four identically shaped long options.

## 6. Self-blind-solve

Solved from the passage alone, arguing actively **for** each non-keyed option.

- **Q1 → B.** A fails: the text says the paraffin *stayed in the surface*, not that
  it was laid on thick, and the complaint was extinction, not a detached head.
  C fails: self-ignition is nowhere in the text. D fails: the glue in p8 carries no
  fault. Only B is licensed.
- **Q2 → D.** A is directly contradicted (`tände lika villigt`), B is directly
  contradicted (`billigare än asp`), C is a real fact about the *spruce* splints.
  Only D survives. This was the item I pushed hardest on, because C is genuinely
  tempting one sentence away from the answer; it is refuted by a single named noun.
- **Q3 → A.** B and C both require the difference in effect to have been large;
  p6 says it was small. D requires the northern aspen to have been unobtainable;
  p6 prices it at ≈18 % more delivered. Only A restates what the paragraph says.
- **Q4 → C.** A overreaches to a whole industry the text never discusses and
  contradicts the "untested assumption" sentence. B is killed by the 1938 machine.
  D is killed by p1's "sällan priset per kubikmeter" and by p8's last two sentences.
  C is the only claim that holds across p1, p5, p6 and p8.

**Result: 4/4 single-answerable, no item two-way.** No item was left in a state where
I could construct a defensible second reading; Q3 was rewritten once for this
reason (its original C repeated Q2's spruce-attribution trap, which both created a
cross-question corroboration that made Q3 easier and wasted a distractor slot — it
is now a `half_right_conjunction` that stands on its own).

## 7. Language pass

Read aloud sentence by sentence as a native. Compounds checked individually
(batch15 died twice on single morphemes): *tändsticksfabrik, tändsats, aspkubb,
aspvirke, aspsticka, björksticka, granstickor, huggmaskin, stickmaskin, maskinsal,
torkrum, ramfyllning, huvudända, paraffinkar, impregneringsbad, efterglöd,
brandstodsbolag, brandorsaker, fabriksgården, körväg, kvistvarv, rakvuxen,
avbarkad, årsringar, ammoniumfosfat, strykyta.* En/ett and definiteness agreement
checked (*aspen … rakvuxen*, *aspen knapp*, *ett bad … badet*, *det norra virket*).
No calques, no blog register, BIFF order correct (`Att paraffinet kom först har ett
skäl…`, `…att karet ska röras om…`, `…när kriget gjorde aspen knapp`).
Typography: Swedish curly quotes ”…” on the one quotation (rule 2); spaced en dash
only, **zero** em dashes anywhere in the file (rule 3); decimal comma (2,1 / 1,9);
numeric register varied (digits, spelled-out `fyrtiofem`, `ettusen`, `arton procent`,
`elva av hundra`).

## 8. Names and law-16 verification

| entity | role | given name on batch17's 231-list? | full pair on the 274-list? |
|---|---|---|---|
| Kummelfors | toponym / works site | n/a | no |
| Kummelfors tändsticksfabrik | the works | n/a | no |
| Hjalmar Bråneskog (m) | fabriksmästare 1893–1919 | **Hjalmar** not listed | no |
| Edla Lomhed (f) | förestånderska, askavdelningen, from 1915 | **Edla** not listed | no |
| Melker Slånstedt (m) | byline, industrihistoriker | **Melker** not listed | no |

No given name repeats inside the unit. No surname is a one-letter variant of any
element in the excluded pairs (rule 8 addition). Gender is mixed and does not
reproduce the careful-woman/overconfident-man pattern: the works' technical lead is
a man, the department head a woman, the byline a man, and none of them is set up as
a challenger to another.

**Verification tooling.** The session's WebSearch budget was already exhausted
(200/200) before the first name query, so the addendum's fallback applies. Exact-phrase
general-web indexes were attempted and mostly refused — Mojeek served a JavaScript
captcha, html.duckduckgo.com 403, Brave 429, Startpage and Ecosia bot-challenge pages,
SearXNG instances 403/429/anti-bot. **Bing returned a page but produced a FALSE ZERO
on the positive control "Fengersfors" (a real village in Åmål) and was therefore
discarded rather than reported as evidence** — exactly the failure mode the addendum
warns about. Verification instead used three independent, re-runnable exact-string
indexes, each validated on that same positive control, plus an Exa people screen:

1. OpenStreetMap Nominatim — `https://nominatim.openstreetmap.org/search?q=<name>&format=json`
2. Libris xsearch (Swedish national bibliography) — `https://libris.kb.se/xsearch?query=<name>&format=json`
3. Wikipedia CirrusSearch — `https://{sv,en}.wikipedia.org/w/api.php?action=query&list=search&srsearch=insource:"<name>"&format=json`
4. Exa `web_search_exa`, `category:people`, Swedish surnames

Control (Fengersfors): 1 / 28 / 38 / 12. Candidates on 2026-08-26, as
nominatim / libris / wp-sv / wp-en: Kummelfors 0/0/0/0 · "Kummelfors
tändsticksfabrik" 0/0/0/0 · Bråneskog 0/0/0/0 · "Hjalmar Bråneskog" 0/0/0/0 ·
Lomhed 0/0/0/0 · "Edla Lomhed" 0/0/0/0 · Slånstedt 0/0/0/0 · "Melker Slånstedt"
0/0/0/0. Exa returned no bearer of any of the three surnames; nearest neighbours
were *Lars Brånedal* (different second element) and *Rikard Ryndal* — **that hit is
why an earlier byline candidate "Ryndahl" was dropped in favour of "Slånstedt"**,
since Ryndal is a one-letter variant borne by a living person working in Swedish
industry.

**This is a search log, not a certificate.** These indexes do not cover the open
web; there was no Google/Bing/DuckDuckGo coverage this run. All five invented
entities are **FLAGGED FOR V-FINAL** re-verification with a general-web exact-phrase
index. The full log is duplicated in `generator_meta.originality_note` so a reader
can re-run every query.

## 9. Mechanical self-check

`python3 gates/scripts/run_mech.py batches/batch17/gen-las-long.json
--p5-corpus-dir auto --parsed-dir <repo>/data/parsed`
(M-ECHO indexed 107 shipped units):

| gate | verdict |
|---|---|
| M-SCHEMA | pass |
| M-BANDS | pass |
| M-TELL | pass |
| M-FORM | pass |
| M-ECHO | pass |
| M-PLAGIARISM | pass |

Blocklist (law 14): no burned phrase or close variant is used. Stems are
corpus-attested and deliberately avoid the two forms both recent LÄS longs used
(`Vad avgjorde, enligt texten, …` and `Vad kan man, utifrån texten, dra för
slutsats om …`); the higher-order family here is `huvudbudskap_syfte` rather than
the `inference_slutsats` that both las-b15-001 and las-b16-001 used.

## 10. Known residues for the adjudicator

- The paraffin dip, the aspen choice and afterglow impregnation are real features
  of match manufacture. None of them is a *famous thesis* (law 1), and the keyed
  content is anchored to invented, dated particulars — the 1897 batch, the 1904
  trial, the 1911 comparison — so a knowledgeable solver still has to read.
  G-STEM should nonetheless be watched on Q1.
- The company that absorbs the works in 1918 is left unnamed on purpose; naming it
  would attach an invented history to a real trust.
- Q3's stem says *impregneringen* while its options say *badet*; the coreference is
  established in p6 (`ett bad av ammoniumfosfat` … `Valet föll ändå på badet` …
  `Impregneringen sattes in`). This is paraphrase, not ambiguity, but it is a
  deliberate choice worth a reviewer's eye.
