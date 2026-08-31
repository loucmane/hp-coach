# gen-elf-long — authoring notes (batch17)

**Unit:** ELF `long_passage_5q`, science journalism, AmE.
**Family:** `contrail-avoidance-ice-supersaturation-science-journalism-long`
**Title:** Two Thousand Feet · **Byline:** Lorcan Trawsfield · **candidate_id:** `PLACEHOLDER`

---

## 1. Lane and topic choice

The brief offered four candidates: contrail-avoidance trials, mycelium packaging,
street-tree roots vs pavement, concert-hall acoustics retrofits. I took
**contrail avoidance** and rejected the other three on graze grounds:

- **Concert-hall acoustics** grazes the shipped `kontorsakustik-popularvetenskap-short`
  (room acoustics, same mechanism family).
- **Mycelium packaging** grazes `glass-recycling-materials-science-journalism-long`
  (materials + circularity + a plant that has to make the numbers work) and
  `self-healing-concrete-materials-science-detail`.
- **Street-tree roots vs pavement** sits in the crowded urban-ecology /
  infrastructure lane the brief warned about, next to
  `beaver-reintroduction-catchment-hydrology`, `stadsekologi-igelkott`,
  `urban-bat-roost-retrofit` and `airport-bird-strike-grass-management`.

Contrail avoidance is empty ground. `grep -ril -E
"contrail|cirrus|supersatur|troposph|jet fuel|cruising altitude"
batches/*/candidates-final/*.json` returns **0 hits across all 107 shipped
units**. The one aviation-adjacent family in the bank, `elf-b7-004` "Long
Grass", is about grass length and bird flocks on an airfield — ground ecology,
not atmospheric physics.

## 2. Mechanism verification — done BEFORE a word was written

batch15's rail unit was refuted at V-FINAL for stating a physical mechanism
backwards, so every physical claim here was checked against primary literature
first. The full log with sources lives in
`generator_meta.mechanism_verification_note` (14 numbered claims). The four that
mattered most, because getting them backwards would kill the unit:

1. **Formation and persistence are two different conditions.** A contrail forms
   when the mixing plume transiently reaches saturation *with respect to liquid
   water* (Schmidt–Appleman); it *persists* only if the ambient air is
   supersaturated *with respect to ice*. Formation can happen where the air is
   ice-subsaturated. The passage's paragraph 1 states these in that order and
   keeps them apart. (ACP 24/9219; ACP 26/10695; acp-24-7911-2024.)
2. **The layer is invisible, and that is not a metaphor.** Nucleating a new
   crystal needs far higher humidity (~150 % RHi homogeneous; ~120–130 %
   heterogeneous) than sustaining an existing one (>100 %), so ice-supersaturated
   air routinely carries no cloud at all. This is the passage's central physical
   idea. (DeMott et al. PNAS; Haag et al. ACP 3/1791; Baumgardner 2000JD900526.)
3. **Geometry justifies the altitude lever.** ISSRs run tens to hundreds of km
   horizontally but only a few hundred metres vertically — which is exactly why
   a two-thousand-foot step is the operational tool. (NASA TM-20250007272.)
4. **The diurnal sign.** Daytime contrails warm *less* because the shortwave
   albedo effect partially cancels the longwave; they do **not** cool on average.
   The passage says "the two effects pull against one another", never that
   daylight contrails cool — which is precisely why Q3/C is a distractor and not
   a second key. (Stuber & Forster ACP 7/3153; Teoh et al. ACP 24/6071.)

Everything else — the control center, the sector, the two winters, 141/61,
406/96, the two percent, the third winter, the unfitted sensors, all three
people and every quotation — is invented on top of that verified frame.

## 3. Architecture, and what it deliberately is not

**Arc:** mechanism → the invisible layer and the forecast built on almost no
data → the trial and its rule → the operations audit → what a satellite cannot
see, and the writer's verdict.

**Thesis shape:** the asymmetry between a nearly free action and evidence that
is structurally expensive. Explicitly *not* "the metric measures the wrong
thing" (whole-bank scan says saturated) — the satellite count is a correct
metric being asked to certify an absence, which is a different complaint.

Clone screening against the nearest shipped neighbours:

| shipped unit | why this is not that |
|---|---|
| `elf-b6-002` **Clockwork Current** (tidal pilot) | Its shape is "the resource was never the hard part, the servicing was." Avoided: the maneuver's cheapness is never in doubt here and is *asserted by a source*, not discovered as a twist. |
| `elf-b6-004` **Cold Comfort** (frost warnings) | The **inverse**, not a clone. There the warning was reliable and the action expensive, so nobody acted. Here the action is nearly free and the warning is unreliable, and the piece is about evidence, not incentives. |
| `elf-b12-001` **Full Cutoff** (dark-sky policy) | Shares a night sky and nothing else. |
| `elf-b16-001` **Smoke in the Skins** (previous ELF long) | Opens on a failed communal remedy and a scene of people; this opens on a mechanism paradox in the writer's voice with no people for two paragraphs. There the two voices duel over what should decide; here they agree about the physics and the cost, and the second simply produces figures that embarrass the framing both started from. |

**Surface variety (law 15):** title is a bare spelled-out numeral phrase — not
"The + modifier + noun", not a pun, not a thesis, not the "X and Y" pair shape.
Numeric register is mixed on purpose (spelled-out *two thousand feet* / *two
percent* beside the digits 141, 61, 406, 96). **The glossary is dropped**
(batch16 had one) because every technical term is explained inline. Main-idea
item moved to **edge position 1** (batch16 used 5). Spelling variety is **AmE**
(batch16 was BrE) and is clean: an automated screen for 27 BrE spellings over
the passage returns zero hits.

**Coda:** two flat unresolved sentences of fact. No aphorism, no "not A but B"
chiasmus, no repetition triad, no residue-object. An earlier draft ended on an
aphoristic line about absence; it was cut.

## 4. Planted trap architecture, per question

| q | family | anchor | key | traps |
|---|---|---|---|---|
| 1 | TYPE-004 main idea (**edge pos. 1**) | whole text | **B** | A scope_error (humidity forecasting promoted to subject) · C surface_word_match (P1 vocabulary, one-clause topic) · D outside_knowledge (aviation-warming share, never argued) |
| 2 | TYPE-001 detail (**short-breath**) | ¶2 | **A** | B reversal of the stated mechanism · C outside_knowledge · D surface_word_match with the wrong subject (the *contrail* spreads, not the layer) |
| 3 | TYPE-001 detail | ¶3 | **D** | A invented operational reason, cautious-sounding · B invented night/day comparison · C **quantifier_upgrade turned reversal** ("pull against one another" → "cools") |
| 4 | TYPE-002 inference | ¶4 (+¶5 close) | **C** | A mangled quantity ("fewer than half" carried to the wrong noun) · B **false-negative for false-positive** reversal · D outside_knowledge + two-step leap |
| 5 | TYPE-005 stance | whole text | **A** | B **role_or_attribution_swap** (Vestrigg's hope handed to the writer) · C tone_misread, the judicious option · D polarity overshoot |

Both dominant ELF traps named in GENERATION.md are present and load-bearing:
**quantifier upgrade of a hedged, attributed claim** (Q3/C, Q4/B) and
**attribution swap** (Q5/B).

**No distractor anywhere in the unit is verbatim true of the passage** — see §6(iv).

**Short-breath item:** Q2, eight-word stem, options of eight or nine words.

## 5. Hedge map (rule 10) — PASS

The "pick the qualified/moderate option" heuristic selects the key in **at most
1 of 5**, and even that one is a tie:

- **Q1** — all four options are flat descriptive noun phrases. Heuristic: no signal.
- **Q2** — all four are flat 8–9 word assertions. Heuristic: no signal.
- **Q3** — **law-10 break #1.** The key is a flat, unhedged physical assertion;
  the cautious, sensible-sounding operational option (A, "Traffic after dark was
  light enough…") is wrong.
- **Q4** — the key ("Many of the descents…") is the moderate option, but A
  ("Fewer than half…") reads as more precisely qualified, so the heuristic is
  ambiguous here rather than rewarded.
- **Q5** — **law-10 break #2.** The key is a flat ranking judgement; the
  judicious option (C, "gives both kinds of evidence their due and prefers
  neither") is wrong, and so is the soft hopeful one (B).

Always-pick-most-qualified scores 0–1/5. Always-pick-flattest scores 2/5.
Neither heuristic beats guessing enough to be worth carrying.

## 6. Self-blind-solve — 5/5, with four rewrites

Solved from the passage alone, arguing **for** each non-keyed option first:
**Q1=B, Q2=A, Q3=D, Q4=C, Q5=A** — matches the keys.

Four items were rewritten because arguing for the distractor worked:

**(i) Q3, first pass.** The key first read "Contrails formed at night warm more
than those formed by day" — answerable without reading by anyone who follows
aviation-climate coverage, and it left C partly defensible. Rewritten to name
the mechanism the passage actually states: the missing counterweight.

**(ii) Q5, first pass.** The option set carried both "leaves the choice to the
reader" and "treats the imagery as the one clean result" — two options defeated
by the same sentence. The second was replaced by the polarity overshoot now at
D, so all three distractors fail on different grounds.

**(iii) Q1, second adversarial pass.** Option A originally read "The two winters
in which one control center moved its night flights lower." Argued honestly,
that was too strong: three of five paragraphs *are* the trial, so a blind solver
could reasonably call the piece a report of it — a MULTIPLE_DEFENSIBLE finding
waiting to happen. A was replaced with the humidity-forecast sub-point, which is
genuinely narrower and still tempting as the most technical-sounding difficulty
in the piece.

**(iv) Q4, second adversarial pass — the important one.** The key first read
"Many layers the forecast called for were not there to fly around", a paraphrase
of a sentence the passage states outright; and option A read "Fewer than half of
them left a contrail the reviewers could find", which is **verbatim true**. Two
true options in one item is the defect that has held or killed a unit in three
previous batches. The key was moved a genuine inch out — to the *wasted
descents*, which the passage never states — and A was rewritten into a
mangled-quantity trap that is false on the page (all 141 were flying where the
forecast had put a layer; the sentence says so).

Every distractor now dies on a specific sentence:

- Q1/A by proportion; Q1/C by the one clause growth actually gets; Q1/D by the
  total absence of any warming comparison.
- Q2/B and Q2/C by "make no cloud of its own" and "the first anyone knows of it
  is the mark an airplane leaves crossing it"; Q2/D by ¶5, where the *contrail*
  spreads.
- Q3/A by the absence of any claim about night traffic, and by ¶5's four or five
  tracks in one square, which points the other way; Q3/B by the depth being
  time-independent; Q3/C by "pull against one another", which says nothing about
  which side wins.
- Q4/A by "Of 141 flights that were left alone and flew straight through a
  forecast layer"; Q4/B by the design of the comparison; Q4/D by the 61 marks.
- Q5/B by "Perhaps it would. But"; Q5/C by "the smallest thing those two winters
  produced" plus "Colverdine is right"; Q5/D by the third winter being flown.

## 7. Names — search log summary

Full re-runnable log in `generator_meta.originality_note`. **Nothing is
certified; all three names are FLAGGED FOR V-FINAL RE-VERIFICATION.**

WebSearch refused on the first call ("this session has used its web search
budget, 200 of 200"), so per batch16 rule 4 and the batch17 addition,
verification used **Exa web search plus exact-phrase fetches of two independent
indexes, Mojeek and Brave**. Firecrawl search returned HTTP 401 and contributed
nothing.

**Kept:** *Sunniva Vestrigg* (Exa: no bearer; Mojeek "Vestrigg": 0 results;
Mojeek "Sunniva Vestrigg": 0 results; Brave: "too few matches", only the
unrelated word *vestige* and the Nordic *Vestri*). *Anselm Colverdine* (Exa: no
bearer; Mojeek: 0 results; Brave: "too few matches", only Colverde / Colverd /
Coloverin / Culverin — **disclosed near neighbour: Alice Colverd is a real
architect at Pratt Institute; different surname, different field, recorded here
rather than suppressed**). *Lorcan Trawsfield* (Mojeek: 0 results — **checked on
one index only, stated as a limitation; the weakest of the three checks**).

**Rejected on their results:** *Ardenlow* (a real "Mr. Ardenlow, Open Door
Legal" in San Francisco Board of Supervisors minutes, 23 June 2025; plus an
established fictional "Ardenlow Forest"). *Havershaw* (1,529 Mojeek hits: a real
UK company, a forum member, film and comics characters). *Brackwold*
("Brackwold-on-Sea", a published Tom Maguire story — the same ground batch16
rejected "Marrowby" on). *Tarnbeck* (no person, but two live UK companies).
*Quillistone* (clean at 0 results, but dropped internally: the bank already
carries Quilvey, Quillenby, Quennerly and Quennerby, and batch17 warns against
that cluster). *Nurrigan* (a Minecraft forum handle).

**Rules 8/9:** Sunniva, Anselm and Lorcan appear nowhere in the 231-name used
list; no full pair appears in the 274-pair list; no given name repeats inside
the unit. **"Idris" was drafted for the byline and rejected** as a one-letter
variant of the listed *Iris* (Iris Hallenbeck, Iris Halloran). Surname
near-duplicate screening was run by hand against Vestlund/Vessholm/Vellin/
Vretberg/Verholt, Corvenden/Cadell and Traer/Talvenny.

**No place, country, airspace, airline, institution, satellite, aircraft type or
publication is named anywhere in the passage** — the real-entity surface is
three personal names and nothing else.

## 8. Mechanical self-check

`run_mech.py --p5-corpus-dir auto --parsed-dir <repo>/data/parsed`:

```
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass · M-PLAGIARISM pass
```

| stat | value | band |
|---|---|---|
| passage_words | 758 | ELF long 332–873 (blueprint 550–825) |
| paragraphs | 5 | ELF long 1–5 |
| mean sentence words | 21.7 | 14.9–35.4 |
| sentence-length SD | 15.1 | blueprint ≥ 7 |
| option length ratio (max) | 1.27 | cap 2.36 |
| key strict-longest | **0 / 5** | M-TELL fires at ≥ 75 % |
| key letters | B, A, D, C, A | all four used, no adjacent repeat, no alternation |
| FK grade / Flesch RE / polysyllabic | 9.0 / 69.2 / 7.0 % | inside the shipped ELF-long distribution (batch16's approved unit: 8.7 / 68.8 / 7.6 %) |

Typography: English curly quotes and apostrophes; **two spaced en dashes, zero
em dashes anywhere in the file**; no straight quotes or apostrophes in the
passage.
