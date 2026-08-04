# gen-las-long-2 — LÄS long, sockenmagasinen (replacement for las-b8-001)

**Slot:** replaces `las-b8-001` (humleodling), retired as a clone of `las-b7-001`
(same mould, incl. a verbatim quote).
**Anti-model:** `batches/batch7/candidates-final/las-b7-001.json` ("Brevbäraren som
gick före järnvägen").
**Topic:** sockenmagasinen — the parish grain store as a credit institution, and the
unresolved question of why the stores were wound up. Reviewed *as a book* (recension).

---

## 1. Divergence check (law 12) — move sequence, side by side

| # | anti-model `las-b7-001` | this unit |
|---|---|---|
| genre | populärvetenskap / study report | **recension** (book review) — 0 of 37 shipped units |
| opening | result-lede: researcher opens an archive, expects a smooth curve, "Det hon fann var något annat" | **definitional**: what a sockenmagasin physically was, in one flat sentence — 0 of 37 shipped units (all are framing-claim / result-lede / scene) |
| p2 | institutional background (when lantbrevbäring was introduced) | **mechanism-is-the-point**: loan in grain, repaid in grain with a customary addition; ends on what the mechanism could *not* do (spread risk) |
| p3 | method paragraph: 34 parishes, 19 000 notations, "Metoden har sina luckor" | **origin/resistance**: who pushed the stores into being (landshövding, präst), and where the levy simply failed |
| evidence spine | aggregated archival counts across a corpus of parishes | **a reproduced statute** (Hökaryd 1798, read clause by clause) + **two named episodes**. No counting study anywhere in the unit |
| p4 | the finding + the author's mechanism ("Förklaringen … ligger i förtrogenheten") | a 1832 protocol showing the gap between rule and practice — the passage's evidence *undercuts* its own document, rather than confirming a thesis |
| objection | penultimate, external: "Andra forskare invänder", named male economic historian; the studied woman "medger … men håller fast vid" | **mid-passage (¶6 of 9), internal**: the reviewer herself objects, using the book's *own appendix* against its explanation. No third-party skeptic exists in the unit |
| resolution | pattern holds, author's thesis survives | **genuinely unresolved** — the reviewer grants three parishes where the author is right, names two rival processes, and states outright that the surviving material cannot settle it |
| digression | anecdote (Per Ersson's tar barrel) that *supports* the thesis | ¶8 is explicitly the part that "inte tjänar något argument alls" — reuse of the buildings, deliberately off-thesis residue (law 9) |
| coda | aphoristic two-sentence close + "inte bara räls och ånga … utan lika mycket en granne" chiasmus | **bibliographic housekeeping**: register, glossary of volume measures, three maps, one of them unreadably small; notes at the back. The passage simply stops |
| frame | byline **and** 2-line glossary tail | **byline only, no glossary** (law 15) — specialist terms (utsäde, Mikaeli, spruthus) glossed *inline* in the prose instead |
| gender | careful woman researcher vs. overconfident male objector (bank was 18/18) | **inverted**: male author (Rutger Grimlund), female challenger (Vendela Karnell) — **and the challenger is right**, on documentary grounds |
| thesis shape | "the pattern is real once you control for X" | mechanism-is-the-point + genuinely-unresolved. Explicitly **not** "the metric everyone quotes measures the wrong thing" |
| title | "Brevbäraren som gick före järnvägen" (Swedish declarative/negation family) | "Magasinet i Hökaryd: en handbok om socknens spannmål" — **colon title**, place-name lead; no shipped Swedish title uses a colon (law 15) |
| numbers | trettiofyra socknar, nittontusen noteringar, per hundra hushåll | low numeric register: 1798, 1832, 1863, en åttondel, elva år, tre kilometer, tjugo sidor |
| families | detalj, detalj, inferens, huvudbudskap | detalj_ospecificerad, enligt_texten_detalj, **forfattarens_hallning**, **struktur_funktion** — a different higher-order pair, and the two rarest families in the mix |

**Blocklist (law 14):** no burned phrase or close variant used. "Rättvist nog" was
cut in draft as a *to be fair* calque; "det hade varit klädsamt att skriva ut" was
completed to "…att säga det rakt ut". No "Metoden har sina luckor", no "Entydig är
bilden inte", no "medger … men håller fast vid", no "Vi ser ett mönster, inte en lag".

## 2. Registry check (law 13)

Grepped every invented entity against `batches/*/candidates-final/*.json` (87 shipped
units) — **zero hits** for: Grimlund, Rutger, Vendela, Karnell, Ulfsäter, Hökaryd,
Sävlinge, Bjärnhult, Hässle, Mikaeli. "Jonas" replaced a first draft "Isak" (two
shipped hits). None of the banned names/prefixes (Ingrid, Hal-, Öberg, Frisk,
Sundqvist, Lindqvist, Åkerlund, Brandt, Halloran, Sahlberg, Ahlgren, Sundelius) occur.
Topic check: `spannmålsmagasin` appears once in the bank (`las-b1-002`) as *converted
culture-quarter buildings* in an urban-renewal debate piece — a different subject; the
word "spannmålsmagasin" and the phrase "fått nytt liv" are avoided here, and the reuse
paragraph stays rural (spruthus, lada, hembygdsförening).

M-ECHO run against all 87 shipped units: **pass** (no 6-gram overlap, no name reuse).

## 3. Trap architecture

| q | family | target | key | traps |
|---|---|---|---|---|
| 1 | detalj_ospecificerad | ¶2 mechanism (grain out, grain back + customary eighth) | C | A half_right_conjunction (right timing, wrong medium — repayment in cash); B plausible_worldknowledge (a solidarity-sounding annually-set rate; text says a customary eighth); D reversed_causality (text says the store *could not* spread risk) |
| 2 | enligt_texten_detalj | ¶4 statute clause (default → barred the following spring) | A | B reversed_causality (both keys collapsed onto the churchwarden, killing the two-person rule); C scope_shift on time (same day → year's end); D plausible_worldknowledge (priest appoints the biggest landholder; text says the sockenstämma elected him) |
| 3 | forfattarens_hallning | ¶6 the reviewer's objection | D | A half_right_conjunction (the 1863 reform *is* mentioned by the author, in passing — the criticism is treatment, not omission); B surface_lexical_echo (the 1832 protocol carries a different argument); C overgeneralisation (reviewer grants three parishes where the link holds) |
| 4 | struktur_funktion | ¶8 the reuse examples | B | A reversed_causality (fire service as cause of, not successor to, the closure); C plausible_worldknowledge (upkeep cost — never in the text); D overgeneralisation from one exhibited door |

**Hedge-balance (law 10):** the "pick the qualified option" heuristic is broken — on Q1
and Q2 the key is a plain, confident, specific claim and no distractor is absolutist;
the absolutes sit on distractors only in Q3 (C, "ingen enda") and Q4 (D, "de flesta").
**Length tell:** the key is never the longest option in any of the four questions
(key words 17/13/16/11 against per-question maxima 19/16/18/16); M-TELL passes.
**Law 11:** no distractor is a verbatim-true passage detail; each carries a locatable
flaw. No option copies a passage sentence (law 3).

## 4. Self-blind-solve (whole sheet, passage-blind then passage-only)

*Passage-blind pass* (title + stems + options only): Q1 splits cleanly — A, B, C and D
are all real-world-plausible arrangements for a grain bank, and the discriminator
between B and C (customary fixed addition vs. an addition set annually by the parish
meeting) is not decidable from world knowledge; the title deliberately does **not**
mention rye, interest or keys. Q2 has four period-plausible statute clauses and no
absolutism tell. Q3: C falls to its own absolutism, leaving A, B, D genuinely open. Q4:
four plausible rhetorical functions. No question falls to form, to general knowledge,
or to a sibling.

*Cross-question corroboration:* the four keys assert four different propositions —
(1) the repayment mechanism, (2) one clause of the 1798 statute, (3) the reviewer's
evidential objection to the savings-bank explanation, (4) the function of the reuse
examples. Knowing any key licenses none of the others; the only near-adjacency (Q3's
savings banks vs. Q4's options) was removed in draft by rewriting Q4's C away from any
savings-bank echo.

*Passage-only pass:* Q1=C, Q2=A, Q3=D, Q4=B, each singly defensible; I argued each
non-keyed option aloud and every one contradicts a locatable sentence. Key spread
C-A-D-B (anti-model: B-D-A-C).

## 5. Band compliance

M-SCHEMA, M-BANDS, M-TELL, M-FORM, M-ECHO, M-PLAGIARISM: **all pass**
(`run_mech.py … --p5-corpus-dir batches/batch*/candidates-final`).

- passage words **869** (LÄS long blueprint 750–1135; band 215–1260)
- sentences **51** (blueprint ~35–66), mean sentence **17.0** words (band 8.2–30.9;
  blueprint 14–25) with deliberate variance — 5-word verdicts ("Ingen sedel behövde
  växlas.", "Det är det inte.") beside 40-word subordinated sentences
- paragraphs **9** (band 1–35)
- prompt words 8/7/11/10 (band 3–31); option words max 19 (band ≤23);
  option length ratio 1.27/1.23/1.64/1.60 (cap 5.25)
