# LÄS corpus analysis — the empirical portrait of authentic HP reading passages

**Scope.** Every LÄS unit in the parsed bank: **540 questions across 174 passages, 27 exams**
(`data/parsed/*.json`, `section == "LÄS"`). 100 % of passages carry their `context`
(passage) text. All numbers below are computed, not estimated — see
`scripts/` and the machine-readable outputs in `outputs/`.

Reproduce:

```bash
cd pipeline/synthetic/las/scripts
python3 passage_stats.py      # -> outputs/passage_stats.json
python3 genre_classify.py     # -> outputs/genres.json
python3 question_taxonomy.py  # -> outputs/question_types.json, trap_tags.json
python3 build_families.py      # -> ../families.json
```

> **Legal frame.** Passages are © UHR. Fragments are quoted here only as measurement
> evidence. Nothing in this analysis licenses paraphrasing a specific source passage;
> the outputs describe *structure and distribution*, which is what generation is grounded on.

---

## 1. The unit of LÄS: passage + a fixed question quota

A LÄS "half" (provpass) contains **10 questions** built from **3–4 passages**. Each passage
carries a fixed quota of **2 or 4 questions** (never 1, never 3). The whole corpus:

| passage size | count | share |
|---|---|---|
| 4-question (long) | 96 | 55.2 % |
| 2-question (short) | 78 | 44.8 % |

The 10-question block is assembled in exactly two shapes (measured over 54 blocks):

| block composition | count | share |
|---|---|---|
| `4 + 4 + 2` (two long + one short) | 42 | 77.8 % |
| `4 + 2 + 2 + 2` (one long + three short) | 12 | 22.2 % |

**Blueprint consequence:** a generated LÄS block must emit passages that sum to 10 questions
in one of these two shapes. A long passage owes 4 items; a short one owes 2.

---

## 2. Length — the two size bands are genuinely different regimes

Measured in de-hyphenated words (PDF line-break artifacts like `undervisningsfor- men`
are rejoined; see `common.clean_text`).

### Long (4-question) passages — n=96

| metric | p10 | median | p90 | min–max |
|---|---|---|---|---|
| words | 747 | **994** | 1136 | 222–1191 |
| sentences | 35 | 49 | 66 | 11–138 |
| paragraphs | 4 | 6 | 17 | 2–33 |
| mean sentence length (words) | 15.4 | **20.1** | 24.4 | 8.5–29.1 |

### Short (2-question) passages — n=78

| metric | p10 | median | p90 | min–max |
|---|---|---|---|---|
| words | 288 | **398** | 498 | 194–546 |
| sentences | 15 | 22 | 29 | 10–42 |
| paragraphs | 3 | 8 | 13 | 2–19 |
| mean sentence length (words) | 13.0 | **18.5** | 24.5 | 10.5–34.7 |

**Hard length bands for generation** (central 80 %, p10–p90):
- **Long passage: 750–1135 words**, target ~995. Below ~700 or above ~1150 is out-of-distribution.
- **Short passage: 290–500 words**, target ~400.

The bands barely overlap: a 600-word passage is neither a canonical long nor a canonical short
passage and should be avoided. Sentence rhythm is similar across bands (~18–20 words mean), so
the size difference is achieved by *more sentences*, not longer ones.

---

## 3. Readability — LIX sits in a tight "educated adult non-fiction" window

LIX = words/sentence + 100 × (words > 6 chars)/words.

| band | LIX p10 | LIX median | LIX p90 |
|---|---|---|---|
| all passages | 39.4 | **51.0** | 57.5 |
| long | 42.8 | 52.2 | 58.4 |
| short | 37.9 | 48.2 | 55.4 |

Median LIX **51** is squarely in the range Swedish readability convention labels *svår —
sakprosa, facklitteratur* (40–50 is normal newspaper prose; 50–60 is officialese / academic
non-fiction). Long-word share (>6 chars) has median **30.8 %**. Type-token ratio ~0.5–0.6.

**The outliers are informative, not noise.** The lowest-LIX passages (LIX 21–32) are exactly
the literary/poetry excerpts (Stina Stoor LIX 21, Marianne Fredriksson 31, Tranströmer 28,
Barbro Lindgren 32). The highest (LIX 63–68) are dense scientific or legal passages
(placebo-forskning LIX 67, sediment-kemi LIX 60+). **LIX is therefore a genre proxy as much
as a difficulty proxy** — see §5.

**Hard band for a sakprosa generation target: LIX 44–58.** Literary targets may go as low as
LIX ~25; legal/scientific targets up to ~62.

---

## 4. How passages open and close — the strongest structural signature

- **92 % of passages carry a short title line** (≤12 words, no terminal punctuation),
  set off by a blank line before the body: `Medborgarkompetens`, `Papegojsjuka`,
  `Klok som en flöjtkråka`. (Long: 88.5 %, short: 96.2 %.)
- **They close with a byline, not a conclusion.** The final "sentence" has a median length of
  **2 words** — because it is an author attribution: `Lena Sahlin-Österlund`, `Torgny Nordin`,
  `Joakim Ekman, Pär Zetterberg, Mikael Persson & Klas Andersson`. **0 % of passages close on
  a question**; only ~6 % open on one. Authentic LÄS passages are *credited excerpts of
  published prose*, and the byline is a load-bearing structural element — the reader is meant
  to perceive "this is a real article/essay by a named author."
- Frequently a byline is followed by a **glossary tail**: `nutrition = näring`,
  `somatisk = kroppslig`, `kanon = ett urval av de litterära verk …`. These gloss the passage's
  hardest domain terms and appear on ~1/3 of dense passages. They are *part of the item design*:
  they let the passage use specialist vocabulary without making the item a vocabulary test.
- **First sentences are medium-length** (median 16 words) and typically *situate*: a claim,
  a study, a court, a scene. Openings cluster into a few moves (measured by hand over all 174
  incipits):
  - **Result-first research lede** — "Forskare vid Uppsala universitet har …" / "En ny
    avhandling visar att …" (dominant in populärvetenskap).
  - **Definitional** — "Papegojsjuka är det svenska namnet för …" (facktext).
  - **Institutional/case** — "Tre fastighetsägare yrkade att VA-nämnden …" (juridik).
  - **Framing claim / provocation** — "Litteraturen har fått dåligt självförtroende." /
    "Det är något märkligt med debatten om en kulturkanon." (debatt/essä).
  - **Scene / in-medias-res** — "I morgon fyller jag 40." / "Jag var ju inte precis van att
    ha slips." (literary).

---

## 5. Genre inventory — a reliable macro split, an advisory fine split

Genre was classified per passage by scored lexical signals (`genre_classify.py`).
**Honesty note:** distinguishing Swedish *sakprosa* sub-genres (populärvetenskap vs. debatt
vs. essä vs. recension) is not cleanly lexically separable — 44/174 passages (25 %) are
flagged low-confidence, and the literary genres are assigned by a **curated override table**
(12 passages, hand-verified from incipits) because the automated narrative/verse signals
produced too many false positives on expository prose that merely quotes speech. Treat the
**macro genre as reliable** and the **fine genre as guidance**.

### Macro genre (reliable)

| macro genre | passages | share |
|---|---|---|
| sakprosa (non-fiction prose) | 150 | 86.2 % |
| juridik / myndighet (legal/agency) | 13 | 7.5 % |
| litterär (fiction + poetry) | 11 | 6.3 % |

### Fine genre (advisory; within sakprosa the boundaries are soft)

| fine genre | passages | share | notes |
|---|---|---|---|
| populärvetenskap | 82 | 47.1 % | research journalism / forskningsreferat — the spine of LÄS |
| debatt / opinion | 46 | 26.4 % | op-ed, essä, argumentative review |
| juridik / myndighet | 13 | 7.5 % | court rulings, agency reports, remissvar |
| facktext / lärobok | 12 | 6.9 % | encyclopedic exposition |
| skönlitteratur | 7 | 4.0 % | prose fiction / literary memoir (curated) |
| recension | 6 | 3.4 % | explicit book/music/exhibition review |
| intervju / reportage | 4 | 2.3 % | dialogue-dash reportage |
| poesi | 4 | 2.3 % | poems / prose-poems (curated) |

**Takeaways for generation topic-sourcing:**
- The corpus is overwhelmingly **non-fiction about research, society, law, culture and nature**.
  A generator that defaults to popular-science-about-a-study will match the modal passage.
- **Literary passages are rare (~6 %) but structurally distinct** (low LIX, first-person scene,
  no research vocabulary) and appear increasingly in recent exams, usually in the *short* slot
  or as the recent "two poems / two texts" pairing. They must be generated from a different
  blueprint, not a de-tuned sakprosa one.
- **Juridik passages (~7.5 %)** are a genuine recurring genre with their own register (yrka,
  överklaga, HFD/AD, mål-numbers). They tend to sit in the short slot.

### Voice / stance patterns

- **First person is common and load-bearing.** 82 % of passages contain at least one first-person
  marker (`jag/vi/vår/oss`); median density 6.1 per 1000 words. It ranges from near-zero
  (impersonal research/legal prose) to very high (literary "jag", op-ed "vi måste"). First-person
  density is itself a genre signal: literary and debatt passages spike; agency reports flatline.
- **Quotation marks appear in 60 % of passages** (long 76 %, short 41 %) — quoted terms, cited
  book titles, reported speech. Direct interview dialogue (line-initial `–`) is rarer (the
  reportage genre, ~2 %).
- Passages take **an authorial stance far more often than a neutral encyclopedia would** —
  the debatt/recension/essä third of the corpus argues, evaluates, or ironizes. This is why
  "författarens hållning" and "huvudbudskap" question types exist at all (§ see families.md).

---

## 6. Register markers (measured per 1000 words)

From `passage_stats.py` (`nominalization_per_1k`, `passive_s_per_1k`, `long_word_pct`):
Swedish academic-prose markers are pervasive — heavy **nominalisation**
(`-ning/-ande/-else/-het/-tion`: e.g. *undervisningsmängden*, *stigmatisering*,
*resultatförbättring*) and **-s passives/deponents** (*formulerats*, *identifierats*,
*avgjordes*). A generated passage that reads as breezy blog prose (verby, short-worded,
low nominalisation) will fail to match register even if length and LIX are on target.
The register is: **nominal, subordinated, agent-light, specialist-lexicon-with-glossary.**

---

## 7. The three non-obvious things that make LÄS *feel* like LÄS

1. **It is a credited excerpt, not a self-contained essay.** The title-line + body +
   named-author byline (+ optional glossary tail) frame says "this is a slice of real
   published Swedish non-fiction." 92 % titled, ~100 % bylined, glossaries on dense passages.
   Generation that omits the byline/title frame will read as a synthetic blurb, not a LÄS text.
2. **LIX and genre are the same axis.** The passage isn't uniformly "hard"; its difficulty is
   inherited from its genre — dense science/law at LIX 60+, literary at LIX 25, journalism at
   LIX 48–52. A generator must pick a genre *first* and let register/LIX follow, not dial an
   abstract difficulty knob.
3. **The passage is engineered around its questions, and the questions are engineered around a
   few reusable traps** (overgeneralisation + reversed-causality dominate — see families.md).
   Authentic passages plant a nuanced, directional, scoped claim precisely so that an
   absolute / inverted / mis-scoped distractor is tempting. The passage and the trap are one
   design; a generator that writes passage and questions independently will not reproduce the
   LÄS "gotcha" feel.

---

## 8. Honest residue

- **No difficulty data.** The repo has no Elo / item_stats for LÄS items (only normering
  score-bands, which are exam-half aggregates, not per-item). Every family's difficulty is
  marked `unknown`. If worker `item_stats` gains per-qid ratings later, re-run `build_families.py`
  with a join.
- **Fine genre is a proxy.** 25 % low-confidence; the sakprosa sub-genre split should be read
  as ±, not exact. Macro genre and the literary/juridik identifications are trustworthy.
- **PDF artifacts.** A handful of passages have parser damage (mid-word joins, dropped title
  lines → `None` title, glossary text fused into the last sentence). These slightly inflate
  sentence counts and were not hand-repaired; they do not move the medians.
- **Question-type classifier** collapses ~75 % of items into two "detail retrieval" buckets.
  That is a real property of LÄS (it is detail-retrieval-dominant), not only a classifier limit —
  but the boundary between "detail" and "inference" is genuinely graded and some items could
  go either way.
