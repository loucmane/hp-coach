# gen-elf-short-1 — ELF short_text_1q, "Ballast Weather"

Batch 15 generator notes. Unit: one ELF `short_text_1q` block, 1 question,
ELF-TYPE-001 (direct detail / mechanism retrieval). English by exam design;
spelling variety **BrE**, held throughout passage and options.

---

## 1. Domain lane and graze check

**Topic:** continuously welded rail. Welding out the fishplate joints does not
abolish thermal expansion — it converts what would have been movement into
axial force, and the only thing that resists that force is the ballast (crib
stone between the sleepers, shoulder stone heaped beyond their ends). A
tamping machine renews the stone and leaves it loose for some weeks; the
invented district's log finds two in three of its buckles in exactly that
window, and none in the hottest week on record.

**Why this lane:** the brief's excluded-shorts list and the addendum's 93
shipped families were checked one by one. Nothing in the bank is about track
engineering, thermal stress, ballast or permanent way. The nearest rail-shaped
neighbours are `sleeper-train-revival` (society commentary on night-train
services, a cloze) and the Swedish `nattagssubvention-debatt` (subsidy policy)
— both about *train services*, neither about track. `self-healing-concrete`
and `road-marking-lifespan` are the nearest materials/infrastructure lanes and
share no mechanism with this one.

Of the brief's candidate list I rejected:

- **escalator handrail speed mismatch** — grazes shipped
  `vertical-transport-history-history-essay-short` (lifts/escalators lane).
- **running-track lane-1 measurement** — grazes `stadium-mowing-stripes` and
  `sports-officiating-technology` (stadium/athletics lane).
- **drip loop in outdoor cabling** — shares the "cable" noun with shipped
  `submarine-cable-repair`; distinct engineering, but an audit could read it as
  the same lane.
- **piano keys never truly ivory-white** — grazes the keyboard-instrument
  craft lane of `kyrkorgelhistoria-essa`, and adjacent to `klockgjutning`
  craft reportage.

Authentic-corpus screen: `grep -Ei 'ballast|buckle|welded rail|permanent way'`
over `data/parsed/*.json` (28 sittings) returns **no matches**; the bare token
`rail` occurs 9 times. No source-corpus passage covers this topic.

## 2. Genre, frame and move sequence (law 12)

Genre: science journalism / engineering reportage. Fictional source: an
invented byline (Esme Quillenby) on an unnamed infrastructure page; the
credited-excerpt frame is the closing byline line inside `passage`, set with a
**spaced en dash** per addendum rule 3 (no em dashes anywhere in the unit). No
glossary line: the one term a Swedish reader will not know, *buckle*, is
glossed in-prose by the parenthetical "track shoved sideways out of line",
which also supplies concrete image rather than a lexicon entry.

Move sequence, deliberately unlike the shipped P5 ELF shorts:

| unit | opening move | middle | close |
|---|---|---|---|
| elf-b9-004 | negation ("is not engineered to feel soft") | lab tester + drop rig | "unless somebody rakes it back" |
| elf-b12-003 | second person ("Anyone who has stood…") | naming rule + worked example | residue list |
| elf-b13-003 | premise ("A cabin window has to be a hole") | collection's rig data + curator quote | "not A, but B" chiasmus |
| **this unit** | **historical contrast (jointed vs welded)** | **mechanism first, then a maintenance log's numbers** | **the source doubting his own tally** |

No direct quotation and no expert verdict (both shipped shorts have one); the
authority is a logbook, not a laboratory; and the passage ends on a
self-undercutting caveat instead of an aphorism — the retired coda shapes in
laws 12 and 15 are avoided.

**Law 9 (no manufactured tidiness):** the twenty-seven-degree stress-free
figure, the fishplate opening and the shoulder ballast are residue the item
never tests; the last sentence casts doubt on the very tally the question is
built from, so the passage does not read as a ramp toward its own item.

## 3. Trap architecture (the one question)

Stem: *"What are we told about the buckles in Vessholm's log?"* — the
corpus-attested `What are we told about X?` form, anchored to a
**passage-internal** object (this district's log). A solver who knows real
permanent-way engineering cannot answer it without reading: the answer is a
count, not a principle. G-STEM exposure is therefore near zero, and general
knowledge actively steers toward distractor D (heat buckles rails).

| opt | trap | build |
|---|---|---|
| A | **reversed order / causality** | puts the gang's ballast work *after* the buckle instead of before it; tempted by the closing sentence, where gangs are sent wherever something has been reported |
| B | **KEY** | paraphrase of "two in three came in the eight weeks after ballast work" |
| C | **quantifier_upgrade** | "two in three" → "they all", with the passage's own eight-week window and tamping machine kept intact |
| D | **outside_knowledge / reader intuition** | heat should concentrate the buckles in the hottest weeks — flatly contradicted by "The hottest week on record produced none" |

Options paraphrase, never copy: the key says "came soon after a gang had
worked the ballast" against the passage's "came in the eight weeks after
ballast work"; longest shared run with the passage is 2 tokens.

**Hedge balance (law 10).** With one question there is no across-unit spread to
rely on, so the correlation is broken inside the option set: the key is the
flat, specific, unhedged claim; the two *hedged* options ("usually" in A,
"most" in D) are both wrong; the single hard absolutiser ("all", in C) sits on
a distractor. Neither "pick the qualified answer" nor "strip the absolutes"
finds the key. Key letter is **B** (the addendum notes batch14 seeds keyed
~16/18 at A; A is avoided here).

**Length tell.** Options run A 15 / B 14 / C 14 / D 14 tokens: the key is
joint-shortest, never the longest; ratio 1.07 against the 2.36 ELF cap.

## 4. Self-blind-solve (law 4)

Solved from the passage alone, arguing actively *for* each non-keyed option:

- **A** — the strongest challenger, and the reason the closing sentence was
  worded the way it is. The case for A: the text does say gangs are sent
  wherever somebody has reported something, and a buckle is the sort of thing
  that gets reported. The case against, which holds: that sentence's own
  conclusion is about coverage ("so the quieter miles go uncounted"), it never
  says the responding gang works the ballast, and the tally sentence states the
  order explicitly the other way round — the buckles came *in the eight weeks
  after* ballast work. The earlier draft read "within eight weeks of ballast
  work", which left the direction technically open; it was rewritten to "in the
  eight weeks after" precisely to close that two-way reading. **Defeated.**
- **C** — defeated by arithmetic the passage supplies: two in three, so a third
  fell outside the window. "All" overstates the only number given.
- **D** — defeated by one flat sentence: the hottest week produced none. It
  also misreads the twenty-seven-degree figure, which the text says tells
  Vessholm how hard July will push and "nothing about what is resisting it".
- **B** — the only option that survives; it restates the log's finding and
  nothing further.

**Outcome: exactly one defensible answer (B).** The re-write in the A bullet is
the one change the self-solve forced.

## 5. Names, entities and law-16 verification

Invented: **Isak Vessholm** (permanent-way engineer) and **Esme Quillenby**
(byline). No given name or surname from the batch15 registry is reused, no name
repeats inside the unit, and the two given names are of different genders with
the careful-expert role given to the man — the audit found careful-woman /
overconfident-man 18 of 18, and the two most recent shipped ELF shorts both put
a woman in the expert slot. **The district is deliberately left unnamed**, so
the unit invents no toponym at all; no firm, network, standards body or
publication is named anywhere.

Search log (all queries run 2026-08-25 through the Exa search MCP; the
WebSearch tool's session budget was exhausted before name checking began, so no
WebSearch queries were run, and the DuckDuckGo HTML endpoints returned 403 to
WebFetch):

1. `"Isak Vessholm" OR "Esme Quillenby" person` — **no bearer of either full
   name.** Returns were unrelated individuals sharing only a given name (Isak
   Almgren, Uppsala; Isak Sebbas, Turku; Esme Tuttiett, London).
2. `"Vessholm" surname person` — **no entity of that name surfaced.** Nearest
   returns were the real Swedish places *Vaxholm* (Stockholm County) and
   *Vivesholm* (Gotland) — different strings, neither a person.
3. `"Quillenby" name` — **two hits, neither a real person, firm or place:** a
   suggested pet name on hedgehogcentral.com (2010) and OCR mangling of the
   mathematical term "Barratt–Priddy–Quillen" on mathoverflow.net.
4. Rejected during selection on the strength of the same checks: *Fennholt*
   (returns a variant spelling of a real 1980s singer), *Braithwood* (real
   surname with bearers including a systems engineer), *Vantorp* (real Swedish
   place Väntorp), *Drenmark* (an Australian registered company).

Phrase probes (Exa, same date), per `elf/anti-plagiarism.md` Tier 2 — **a
two-phrase probe, not the full eight-phrase sweep**:

- `"nowhere to put the extra millimetres"` — five results, none containing the
  phrase (renovation/tolerance essays about millimetre gaps).
- `"the shoulder heaped beyond"` — five results, none containing the phrase
  (road-shoulder and unrelated literary texts).

No claim is made here beyond what these queries returned; the remaining
sentences were not probed.

## 6. Factual grounding of the teaching payload

Every mechanism claim is real permanent-way engineering, so the Layer-2
explanation this rationale will seed is sound: jointed track expands into its
joint gaps; continuously welded rail cannot, so temperature change becomes
axial force; lateral resistance comes from crib and shoulder ballast; tamping
and ballast renewal reduce that resistance until traffic re-consolidates the
stone, which is why hot-weather precautions follow track work; a stress-free
temperature near 27 °C is a normal figure. The *numbers* (39 buckles, 19
summers, two in three) and the district are invented.

## 7. Band compliance (measured, not asserted)

`elf/scripts/corpus_stats.py text_metrics()` on the final passage:

| stat | value | band | verdict |
|---|---|---|---|
| words | 158 | short 105–160 | OK |
| fk_grade | 11.2 | short 11.0–15.0 | OK |
| flesch_reading_ease | 54.9 | (no short band) | — |
| avg_sentence_len | 22.6 | 16–30 | OK |
| sentence_len_sd | 10.1 | ≥ 7 | OK |
| sentence_len min/max | 7 / 41 | rhythm: short verdict beside 35+w sentence | OK |
| pct_polysyllabic | 13.3 % | 12–24 % | OK |
| paragraphs | 1 | short: 1 | OK |
| title | 2 words | 2–5, noun phrase | OK |

`gates/bands.json` (ELF short_text): passage_words 101–368 OK; mean sentence
words 12.0–47.2 OK; paragraph_count 0–8 OK; prompt_words 3–30 OK (11);
option_words 0–31 OK; option_length_ratio 1.07 ≤ 2.36 OK.

`python3 gates/scripts/run_mech.py … --p5-corpus-dir auto` against the 93
shipped units and `data/parsed`:

```
M-SCHEMA pass · M-BANDS pass · M-TELL pass · M-FORM pass · M-ECHO pass · M-PLAGIARISM pass
```

No findings at any severity.

## 8. Residual risks for the adjudicator

- **Distractor A is the item's live edge.** It is meant to be the tempting
  one, and the closing sentence is what makes it tempting. If a blind gate
  reports A as defensible, the cheapest repair is to move the caveat sentence
  ahead of the tally sentence, or to name what the responding gang actually
  does (inspect and slew, not re-ballast), rather than to weaken A.
- **A single spelling-variety axis is untested:** the unit contains no
  -ise/-ize verb and no date format, so BrE is carried entirely by
  *millimetres*, *sleepers*, *afterwards* and the railway lexicon.
