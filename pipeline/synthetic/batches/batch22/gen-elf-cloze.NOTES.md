# gen-elf-cloze.NOTES.md — elf-b22-002 (ELF cloze, 5 gaps), batch22

**Title** "Hands Together" · **Family** `ELF-CLOZE-001 / how-a-room-starts-and-stops-clapping-society-commentary-cloze`
**Keys** C / A / B / D / B · **Variety** BrE · **Byline** Hilary Dempsey (bare) · **Passage** 372 words, 4 paragraphs
**Mech** M-SCHEMA / M-BANDS / M-TELL / M-FORM = 4 pass, 0 kill (5/5 with M-PLAGIARISM against `data/parsed`).

---

## 1. Genre and topic: why this piece

The lane bars the last two cloze subjects outright — selling, attendants, sales, end-of-season,
last hour — and bars the arc they shared: watch a session wind down and read the residue. So the
unit was built to have **no clock running out in it at all**. Nothing here closes, sells, empties or
finishes for the season. The one time-bounded thing in the piece is five seconds long.

The subject is applause: specifically, how a roomful of people manages to start a burst of clapping
in the same half-second and stop it in the same half-second, with no signal and nobody in charge.
It is society commentary in the ordinary sense — manners observed, described and thought about —
and it gives a cloze exactly what a cloze needs, which is dense idiomatic English at the phrase
level (join in, a big hand, put your hands together, comes down, the exposed position) rather than a
technical vocabulary a student would have to be taught first.

**Thesis shape: mechanism-is-the-point.** The piece describes how the coordination works and where
it breaks. It does not demote a received explanation, does not argue that the gesture means
something other than it appears to, and contains no study, no researcher, no metric and no sum.

This matters because the **first draft did** converge, and was scrapped for it. That draft ran
"applause used to be a verdict and is now a full stop": a residue that looks like a judgement and
turns out to be something else. That is elf-b21-002's thesis shape with the nouns changed
(leftovers that look like the village's verdict and turn out to be sorted by arrival time) — the
same shape twice running in the same lane. The rebuilt unit keeps the subject and throws the shape
away.

**Cross-lane check (RULE 24).** Run against all six sibling lane briefs, not just my own. The one
real adjacency is las-b22-003, whose subject may be "a sound"; the shapes still differ (a reflective
essay on what a sound means, versus a description of how a coordination works and where it fails),
and it is flagged in `generator_meta.thesis_cross_lane_check` so the coordinator's diff meets it
already disclosed rather than discovering it.

**Family grazing, disclosed and measured.** `ELF-CLOZE-001 / queueing-culture-unwritten-rules-…`
(elf-b9-002, "Holding the Line") is topically adjacent: people coordinating without instruction.
Measured rather than asserted — longest shared n-gram **4**, zero at n ≥ 5; zero shared option
strings; zero shared names; b9-002 runs a named behavioural researcher and a three-winter field
study in four cities, this unit has no researcher, no study, no data and no named figure inside the
passage at all; b9-002 opens on the absence of a warden, a charter and a penalty clause, which is
the written-instrument theme's near neighbour, and this unit contains no instrument of any kind.

## 2. Lane bars, one by one

| bar | how it is met |
|---|---|
| not selling / attendants / sales / end-of-season / last hour | nothing is sold, nothing closes, nothing winds down; the passage has no money in it at all |
| a different arc shape from "watch the last hour of X" | instance → unlike instances → the mechanism named → its failure cases → a closing image |
| bare byline (RULE 20(c)) | `– Hilary Dempsey`, a spaced en dash and a name; no credential clause, no role apposition, no publication named anywhere |
| not "a written instrument that fails to govern behaviour" | no rule, notice, rota, bylaw, charter, list, programme or document appears (screened mechanically); nor is the piece about an unwritten rule *governing* behaviour, which is the same theme with the sign flipped |
| no numeric title (RULE 24) | "Hands Together" |
| name blocks H/S given, D/W surname | Hilary (H) / Dempsey (D); one name only, so no alliteration and no sibling collision surface |
| no received-explanation opening (RULE 24) | opens on a scene |
| no record's-silence motif (RULE 24) | nothing in the piece is written down, looked up, or missing from a book |
| coda | concrete image **and** resolved: a boy still clapping after the hall has stopped, until his mother puts a hand on his arm. Not unresolved, so it does not spend one of the batch's two allowed unresolved codas |
| inland (batch20 lane finding) | school hall, concert, leaving do; no water, no coast, no transport |
| money arithmetic not the spine (batch20 lane finding) | no sum anywhere |

## 3. Gap architecture (planted traps, gap by gap)

Five gaps, five word classes, five different failure mechanisms. Every set is POS-uniform, which is
what the ELF cloze spec asks for; there is deliberately **no** grammar gap this round (the last cloze
unit's four-forms-of-one-verb set is both the one non-POS-uniform shape and the source of batch21's
lethal rationale, which mis-taught the very form it endorsed).

**Gap 1 — connective, key `Equally` (C).** Options *Hence / Rather / Equally / Elsewhere*: four
one-word sentence openers on four different discourse relations (consequence, correction, parallel
addition, spatial shift). The frame gives one unsignalled feat in the previous sentence and a second
at the other end of the burst, flagged as independent by *and again there has been no signal*.
`Hence` claims a causation the clause denies; `Rather` corrects an assertion nothing is withdrawing;
`Elsewhere` moves to a place the paragraph never goes.
*Ordinal note:* connective ordinals in the last six shipped cloze units are 4, 1, 4, 2, 3, 5; over
the last five, 1 is the least recently used (b17-002), so it is taken here. Every option string was
screened against all 30 shipped cloze units: an earlier draft ran *Indeed / Otherwise / Admittedly /
Consequently* and all four were rejected as already shipped.

**Gap 2 — collocation/sense on a phrasal verb, key `join` (A).** *join / cut / fall / break*, bare
verbs after `may not`, with the particle `in` left standing outside the gap so that all four build a
real phrasal verb and only the sense separates them: fall in = form ranks, break in = interrupt or
enter by force, cut in = push into a queue or a dance. The clause *you are alone with an opinion
nobody asked for* says which sense the sentence wants.

**Gap 3 — collocation/sense on a noun, key `negotiation` (B).** *transaction / negotiation /
bargain / settlement*, four singular abstract nouns from one commercial-social field. The noun is
hung on *about how long is decent* and described as *conducted at speed and without words*, so it
must name a process still under way. Transaction and bargain both name a completed dealing and
neither takes an about-phrase; settlement names the close of a dispute, the far end of the process.

**Gap 4 — polarity, key `wholehearted` (D).** *grudging / outspoken / muted / wholehearted*. The
upstream `Although` has to bite against *it is not permitted to run long*, which only a warm-pole
adjective does. Grudging and muted agree with shortness and leave the concession nothing to mark;
outspoken fails on a different axis, being predicated of people and their views rather than of a
noise. This is the RULE 23 **3+1** shape (three on the warmth scale, one off it), which the rule
names inert and says not to fix. An earlier draft paired *wholehearted* with *half-hearted* and was
rebuilt, because a morphological mirror is the 2+2 contradictory dyad the rule bars.

**Gap 5 — collocation/sense with one refuted polarity distractor, key `dutifully` (B).** *narrowly /
dutifully / instinctively / generously*, four -ly manner adverbs. The room was *asked for a big hand
for a stranger* and the sentence ends *it is not the same sound the recorder got*: generously is
refuted by that clause, instinctively by the room having been asked (and it is the tempting one,
because the rest of the piece is about clapping nobody organises), narrowly keeps fixed company (a
narrowly avoided accident, a narrowly won vote) and says nothing about manner.

**Cross-gap (RULE 11).** The five option sets share **no token at all**, not even a function word,
and no option string occurs anywhere in the title or passage, so nothing can be answered by surface
matching. Verified programmatically on the shipped bytes.

**Hedge balance (RULE 10 / RULE 23).** Gaps 1, 2, 3 and 5 have no hedging axis: no option is
qualified and none is absolute. Gap 4 is the deliberate law-10 break in the other direction — the
key is the emphatic unqualified word and the two cautious-sounding options are both wrong. Net
**0 of 5** gaps selected by the pick-the-moderate heuristic, against a ceiling of half. No option
carries an M-FORM absolutizer (checked term by term over all twenty strings).

## 4. Self-blind-solve

Stated honestly: the passage and the gaps were written together, so no author is blind to a frame he
wrote. Two tests were actually run.

**(a) Cover the passage.** The four option strings for each gap laid out with the passage hidden,
ranked on wording alone:

| gap | what a solver sees with the passage covered | floor |
|---|---|---|
| 1 | four sentence-initial markers, four different relations, no route | 1-in-4 |
| 2 | four bare monosyllabic verbs, each making a real phrasal verb with *in* | 1-in-4 |
| 3 | four singular abstract nouns from one field | 1-in-4 |
| 4 | a visible 3+1 (three on a warmth scale, one off it) but no way to know which pole the frame wants; strip-the-absolutes and pick-the-hedged both return nothing | 1-in-4 |
| 5 | four -ly manner adverbs, no route | 1-in-4 |

Joint floor across the sheet: 1-in-4 per gap, with no cross-gap corroboration available (§3, RULE 11).

**(b) Re-solve from the passage with the key list hidden.** Each frame read with all four candidates
inserted in turn, arguing FOR each wrong option before rejecting it. The three hardest rejections,
recorded because they are where a second defensible key would have shown up:

- gap 3 **bargain** — kept longest, because the ending really is struck between parties; it dies on
  stage (a bargain is the terms already agreed, not the agreeing) and on the preposition;
- gap 4 **muted** — a live collocation with *applause*, and it dies only on the concession;
- gap 5 **instinctively** — made tempting by the rest of the piece, and refuted by *asked for*.

Result: every gap single-answerable; no gap left two defensible options standing.

## 5. Names, and the RULE 17 / law 16 split

The unit **coins nothing**: no invented person, institution, firm, publication or toponym. Nobody in
the passage is named, nobody speaks, and no claim is attributed to anyone. The one proper name is the
byline, and it is the RULE 17 ordinary figure, which resolves the RULE 21 tension by removing one
side of it — a unit with one ordinary name and zero coinages cannot present coined surnames as an
unbroken cluster, and there is no invented person for a real bearer to collide with.

**Legs that ran** (all 2026-09-09, en.wikipedia CirrusSearch exact phrase, positive control
`"Pellew"` run FIRST in the same session on the same endpoint: **totalhits=701**, Edward Pellew 1st
Viscount Exmouth at the head):

- (a) no notable bearer: `"Hilary Dempsey"` **totalhits=0**;
- (b) no bearer in the unit's domain (society commentary, school music, applause):
  `"Hilary Dempsey" journalist OR columnist OR writer OR essayist` **0**;
  `"Hilary Dempsey" applause OR music OR concert OR school` **0**;
  bare-surname probe `"Dempsey" applause` **93**, all articles that merely contain both words
  (Fulham F.C. season, *Can't Buy Me Love*, *The Birth of Venus*, Abraham Ribicoff, Ted Whitten) and
  none a Dempsey associated with manners, commentary or music;
- (c) no quoted words and no attributed act: she appears once, after a spaced en dash, and the piece
  contains no quoted speech at all.

**Leg that did NOT run:** the general-web exact-quoted domain search. This harness has no working
general-web index for it, and the batch22 supplement says to record that rather than fake it. In its
place, a case-insensitive grep for both name tokens over `pipeline/synthetic/batches/` returned no
file.

**Distances, computed not quoted (RULE 16).** Every capitalised token in every shipped title,
passage, prompt and option across `batches/*/candidates*/` was extracted programmatically (2403
distinct tokens) and unioned with every capitalised word in this batch's BRIEF-ADDENDUM.md, then
Levenshtein distance computed from each name token to every member. **Hilary min 3** (nearest:
Clara, Halvard, Har, Heavy). **Dempsey min 3** (nearest: Empty, Ambrey, Deep-End, Delade). No exact
match either. Both clear the RULE 16 floor of 2 and the batch22 RULE 20(d) figure of 3, so no
distance-2 disclosure is owed.

**Names dropped, and why** — the screen did real work:

| dropped | leg that rejected it |
|---|---|
| Helen Dawson | rejected before querying: the name belongs to a British arts journalist, and the slot is a journalism byline |
| Helen Woodcock | encyclopaedia totalhits=1 (a named founder in the MERCi article) |
| Stephen Waller | totalhits=14 |
| Shirley Wilkins | totalhits=1 |
| Suzanne Dobson | totalhits=9 |
| Sophie Wharton | totalhits=1 (Sophie Wharton Myddleton) |
| Sheila Dawes | passed **every** index leg at 0 — dropped on the computed distance screen instead: Sheila is distance 2 from the barred given name *Sela*, Dawes distance 2 from the shipped surname *Yates* |
| Hilary Wickham | totalhits=0, dropped because *Wickham* carries a Pride and Prejudice echo |
| Heather / Stella / Sandra / Doyle | distance **1** from shipped tokens (Weather, Stellan, Andra, Coyle) — caught by computation, not by a search engine |

**Sibling sweep (RULE 8), run twice.** At first writing `batches/batch22/candidates` was empty and
no batch22 generator artefact existed, so there was nothing to screen — the failure mode batch20 was
convicted of. The sweep was **re-run on bytes** later the same day, once five sibling drafts had
appeared as `batches/batch22/gen-*.json`: every capitalised token in every name-bearing field of
those five (title, passage, every prompt, every option) extracted and compared against this unit's
two name tokens. **No exact collision, and nothing in any sibling within Levenshtein distance 3 of
either Hilary or Dempsey.** Sibling families read at that moment:
`riding-arena-waxed-surface-temperature-science-journalism-long`,
`ELF-TYPE-001 / pneumatic-tube-sample-haemolysis-hospital-laboratory-reportage-short`,
`ELF-TYPE-002 / boundary-hedge-dispute-letters-railway-survey-history-essay-short`,
`textning-lansteater-debatt-short`, `skare-vinterfore-essa-short`. That is a statement about bytes
that existed at that moment, not a certificate about what will ship: if a sibling later takes Hilary
or Dempsey out of a different block, this unit's name is the one to move. Structural backstop: the
lane table partitions initials, and this unit uses one name from its own H/S + D/W blocks.

## 6. Statistics, recomputed on final bytes (RULE 19 / RULE 22)

Every figure below was derived inside the step that wrote the file, from the exact strings it ships,
with `gates/scripts/mech.py`'s `tokenize()` and `sentences()`. Nothing is carried forward from a
draft.

- passage **372 words** (cloze band 228–401; GENERATION.md target 300–401)
- **4 paragraphs** (band 1–4), paragraph words `[66, 91, 95, 120]`
- **17 mech sentences**, mean **21.88** words (band 13.1–34.8), population sd **11.51**
- per-sentence words in order: `[20, 6, 40, 12, 35, 22, 22, 5, 39, 18, 23, 10, 7, 15, 29, 31, 38]`
- splitter artefacts, expected: the gap-1 marker opens its sentence with an underscore so the
  preceding sentence does not split away from it, and the byline line opens with an en dash so it
  folds into the last sentence of paragraph 4. Both are inside every count above.
- typography, **scoped to the five student-facing paths** (`$.title`, `$.passage`,
  `$.questions[*].prompt`, `$.questions[*].options[*].text`, `$.questions[*].rationale`) so that no
  later repair round can falsify a whole-file count: em dash U+2014 **0**; en dash U+2013 **5** (the
  byline dash plus the two spaced pairs setting off cited spans in the gap-2 and gap-5 rationales);
  straight apostrophe **0** and curly apostrophe **0** (the passage happens to contain no possessive
  or contraction, and the rationales none either, so the two layers cannot diverge on apostrophe
  style); double quotes appear only as the curly pair U+201C/U+201D, **6** of each, all in
  rationales citing the passage; straight double quote **0**. Distinct non-ASCII in that layer:
  exactly U+2013, U+201C, U+201D.
- **No `\uXXXX` escape claim is made** (RULE 22). The file is serialised with
  `json.dumps(obj, ensure_ascii=False, indent=2)` and no trailing newline, so those three characters
  are stored as literal UTF-8.
- every option is a single token, so the option-length ratio is 1.0 and M-TELL is structurally
  unreachable for this unit.

**Longest shared n-gram (RULE 24).** The five student-facing paths, tokenised together and screened
against `batches/batch*/candidates-final/*.json` plus `batches/batch18..21/candidates/*.json` — 142
files: **zero shared runs at n ≥ 5, longest shared run 4.** The passage alone also tops out at 4.
Four 5-gram collisions found in drafting were rewritten out, all of them in rationales and none in
the passage: a seven-token run shared with elf-b20-002; a five-token rationale opener shared with
elf-b21-002 (inherited from copying the previous cloze unit's house style); one shared with
elf-b17-002; one shared with elf-b10-001. Those four strings now survive only under
`$.generator_meta`, where the repair is being described — which is why the claim is scoped to paths
rather than written as a whole-file absence.

**Key string.** `CABDB`. The fourteen distinct shipped cloze key strings are BACDA, BCADB, BCDAB,
BDACD, CADBC, CBADC, CBDAB, CDABC, CDABD, DBACB, DBACD, DBCAB, DBCAD, DCBBA. CABDB was chosen by
computing Hamming distance over the whole 4^5 space rather than by reading a list: minimum distance
**3**, the maximum attainable by any string that uses all four letters. An earlier draft used BDACB,
distance **1** from the shipped BDACD, and was discarded for it.

## 7. Rationale layer (RULE 25)

All six quoted spans were tested for membership in the passage string mechanically, not by eye:
*and again there has been no signal* / *may not* / *you are alone with an opinion nobody asked for* /
*about how long is decent* / *Although* / *it is not the same sound the recorder got* — all six
return True for `span in passage` on the shipped bytes.

No internal vocabulary reaches the student layer: no snake_case trap label, no gate name, no rule
number, no ALL-CAPS coda, no `KEY X:` metaword opener. Each rationale opens by naming the word and
its letter in a plain sentence, then says in ordinary teaching language what the key means, what each
distractor normally goes with, and which clause in the passage refuses it. No grammar is taught in
any rationale beyond what the sentence itself demonstrates — the batch21 lethal (a rationale that
mis-taught *worth* + gerund) came from a grammar gap, and this unit has none.

## 8. Disclosures

1. **Thesis-shape adjacency with las-b22-003** was the one live risk in the lane table, that lane
   being permitted to take "a sound" as its essä subject. Re-checked against the sibling drafts on
   2026-09-09: it **did not materialise** — that lane took `skare-vinterfore-essa-short` (crusted
   winter snow), and no sibling subject touches applause, manners, coordination or a school. Kept in
   `generator_meta.thesis_cross_lane_check` anyway, because the sibling drafts may still change and
   the coordinator's diff should meet the risk named rather than discover it.
2. **Family grazing with elf-b9-002** (queueing culture, unwritten rules): measured disjoint
   (longest shared n-gram 4, zero shared options, zero shared names, different frame), disclosed
   above and in `generator_meta.family_grazing_note`.
3. **RULE 21 leg (b) general-web index did not run** — no working index in this harness. The
   encyclopaedia domain queries and a repository grep ran in its place, and no web leg is claimed.
4. **`fall` is a gap-2 option in a BrE unit.** It is the verb of the phrasal verb *fall in*, and its
   rationale says so in terms; it is not the AmE noun for autumn.
5. **Sibling sweep ran late, not early** — `batches/batch22/candidates` was empty when this unit's
   names were chosen, so the first pass had nothing to screen; the sweep was re-run on the five
   sibling drafts once they existed and came back clean (§5). The names were chosen against the
   shipped bank and the brief, not against siblings, and the sibling result is a confirmation rather
   than a constraint that shaped the choice.
6. **Model field** written as `opus` per the lane prompt; the carried-forward brief rule 7 writes the
   same field as `claude-opus-5`. Recorded in `generator_meta.model_note` rather than silently
   reconciled.
7. **Hilary Dempsey is flagged for V-FINAL re-verification**, as the brief requires of every name
   whatever its search log says.
