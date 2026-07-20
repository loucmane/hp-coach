# ELF corpus analysis — structural DNA of the English reading section

Empirical portrait of the ELF section across 27 scraped sittings (2013–2026),
built to specify ORIGINAL generated passages. All numbers come from
`scripts/corpus_stats.py` (machine output in `scripts/out/corpus_stats.json`,
raw tables in `scripts/out/corpus_stats.txt`). Data source: the parsed question
bank at `data/parsed/*.json` in the main checkout (untracked data, per repo
policy). ELF content is English by exam design and stays English.

## 1. Data completeness and analysis scope

Every sitting has all 20 ELF questions with options and answer keys parsed
(`parsing_status: complete` throughout). What varies is **passage text
survival** — PRD § 9.8's embargo caveat shows up concretely as missing
`context` fields:

| exam | ELF q | missing ctx | tiny ctx (≤50w) | verdict |
|---|---|---|---|---|
| host-2013 | 20 | 10 | 1 | degraded — both long passages + q40 short text lost |
| host-2014 | 20 | 10 | 1 | degraded (same shape) |
| host-2015 | 20 | 10 | 1 | degraded (same shape) |
| host-2016 | 20 | 10 | 0 | degraded (both long passages lost) |
| var-2013 | 20 | 11 | 0 | degraded |
| var-2014 | 20 | 10 | 1 | degraded |
| var-2015 | 20 | 10 | 1 | degraded |
| host-2020 | 20 | 0 | 2 | partial — q40 title-only + one 50w cloze remnant |
| var-2017 | 20 | 1 | 0 | partial (one q40 short text lost) |
| host-2017, host-2018, host-2021…host-2025, host-ver1-2019, var-2016, var-2018-1, var-2019, var-2022-1/2, var-2023…var-2026 | 20 | 0 | 0–1 | full (frequent q40 title-only remnant, see below) |
| host-ver2-2019 | 20 | 0 | 1 | full but **byte-identical ELF block to host-ver1-2019** — excluded from passage stats to avoid double counting |

Scope rules applied everywhere below:

- **Passage-level stats** use only contexts with **> 50 words** (140 real
  blocks after dedup). The 2013–2016 losses are specifically the two long
  passages per sitting (the embargoed halves); their questions and options
  survive and still count for stem/option statistics.
- **A recurring parser artifact**: the final single-question short text (q40 of
  the first verbal pass) frequently survives only as its title (1–3 words:
  "Jingoism", "Word Processing"). 14 of 27 sittings have this. Logged
  upstream in `data/explanations/_elf_skipped.txt` as "parser dropped
  micro-text". Only 3 fully-surviving single short texts exist, so
  single-short-text passage stats are indicative, not robust (n=3).
- **Excluded from all analysis**: nothing else. 540/540 items participate in
  format and family counts; 140/206 blocks participate in text metrics.

## 2. The canonical sitting architecture (invariant 2017–2026)

ELF is 20 questions per sitting, split 10+10 across the two verbal passes,
with a **fixed block layout** that has not changed in the trustworthy decade:

```
Verbal pass A (q31–40)                  Verbal pass B (q31–40)
├── q31–32  2 short texts, 1q each     ├── q31–35  ONE gapped text (cloze), 5 gaps
├── q33–37  LONG passage, 5q           └── q36–40  LONG passage, 5q
├── q38–39  2 short texts, 1q each
└── q40     1 short text, 1q
```

(Which physical provpass is "A" vs "B" swaps between sittings — var-2018-1 has
them mirrored — but the *content architecture* is constant: per sitting exactly
**2 long passages, 1 cloze text, 5 single-question short texts**.)

### Format inventory (block counts, 26 sittings after dedup)

| format | blocks | items | share of items | notes |
|---|---|---|---|---|
| long_passage (5q) | 38 real + 14 text-lost = 52 | 260 | 48.1% | one continuous article, titled, usually bylined |
| cloze gapped text (5 gaps) | 26 | 135 | 25.0% | instruction line + one text with numbered gaps; prompts are EMPTY |
| short texts, 1q each | 90 + bundles | 145 | 26.9% | ~100–160w mini-texts; scraper sometimes bundles 2–3 into one context block |

The "hybrid" impression some materials give is wrong at corpus level: there
are exactly three formats, in fixed positions, with fixed question budgets.

## 3. Passage statistics (real blocks, deduped)

From `scripts/out/corpus_stats.json → format_stats`:

| metric | long passage (n=38) | cloze text (n=25) | short text (n=52 bundles + 3 singles) |
|---|---|---|---|
| words | mean 698, median 731, range 353–824 | mean 356, median 362, range 219–408 | ~105–160 per mini-text (bundle mean 231 over 2 texts) |
| sentences | 31.2 | 18.0 | ~5 per mini-text |
| avg sentence length | 22.8 w (sd across blocks 3.2) | 20.3 w | 23.1 w |
| within-passage sentence-length sd | 10.6 | 9.2 | 8.6 |
| Flesch Reading Ease | 45.7 (range 29–58) | 50.9 | 43.4 |
| Flesch–Kincaid grade | 12.6 (range 9.4–15.4) | 11.2 | 12.9 |
| SMOG (approx) | 14.2 | 13.4 | 14.4 |
| % polysyllabic words (3+ syll) | 16.8 | 15.9 | 17.1 |
| % words ≥7 chars | 25.9 | 23.5 | 26.7 |
| % Latinate-suffix tokens | 4.3 | 4.1 | 4.9 |
| paragraphs | 2.0 as parsed (PDF newlines lost; true article has more) | 2.8 | 1 |

**Hard bands for generation** (long passage): 550–825 words; FK grade 9.5–15.5
with 11.5–13.5 as the center of mass; mean sentence length 16–30 with
**high variance** (within-passage sd ≈ 8–15 — ELF prose alternates long
subordinated sentences with short punchy ones; uniform sentence length is a
tell of generated text). Cloze text: 300–410 words, slightly EASIER prose than
the long passages (FK 11.2 vs 12.6) because difficulty lives in the gaps, not
the syntax.

### Sentence rhythm

The signature rhythm is *educated-magazine*, not academic-paper: sentences of
35+ words with appositives and quoted speech sit next to 8-word verdict
sentences ("He was formidable." "The verdict is conditional on craft."). The
within-passage sd/mean ratio ≈ 0.46 for long passages. Direct quotation from
named researchers/critics appears in a large majority of long passages and is
a load-bearing device (questions attach to who-said-what).

## 4. Genre and source-type inventory

Long passages carry real bylines. Attributed publications across all real
blocks (26 sittings):

| publication | n | genre bucket |
|---|---|---|
| The Economist | 12 | analytic commentary / business-society essay |
| New Scientist | 10 | popular-science journalism |
| History Today | 7 | narrative history essay |
| Scientific American (+Mind) | 10 | popular-science / psychology journalism |
| Time | 5 | general-interest feature |
| Psychology Today / Psychologies | 5 | psychology feature |
| American Scientist | 2 | science essay |
| National Geographic History | 2 | narrative history |
| New Statesman, New African, Literary Review, NYT (+Book Review), Guardian (+Weekly), Archaeology | 1–2 each | culture / review / reportage |

Genre mix of the 38 fully-parsed long passages: **science journalism ≈ 45%**
(cognition/psychology heavily over-represented), **history essay ≈ 25%**,
**society/culture commentary ≈ 20%**, **arts/literary review ≈ 10%**. Topics
recur around cognition, language, education, historical episodes, and
science-meets-society — never technical STEM, never fiction excerpts in the
modern decade (no novels/short stories in the trustworthy window; the
"literary" flavor arrives via book *reviews*).

### Register: measurably mid-Atlantic, source-faithful

Spelling census over all unique real contexts: ≈58 unambiguous AmE tokens
(behavior×25, center×5, recognize, skepticism…) vs ≈15 unambiguous BrE tokens
(recognise, programmes, behavioural…; the raw grep count of 59 is inflated by
false positives like "analysis"). Each passage is internally consistent with
its source: Scientific American passages are AmE, Economist/History Today
passages BrE. **Generation rule: pick one variety per passage, matched to the
fictional source genre, and hold it.** Register is educated-magazine: first
person plural allowed, contractions rare but present in quotes, rhetorical
questions used as paragraph pivots, hedged claims ("suggests", "may") that the
distractors then illegally strengthen.

## 5. How questions attach to structure

Stem-language census over the 405 non-cloze prompts (regex families in
`corpus_stats.py`; ELF stems are highly stereotyped):

| stem family | n | share | canonical wording |
|---|---|---|---|
| detail, explicitly signalled | 132 | 32.6% | "What are we told…", "…is said/stated", "According to the text…" |
| detail, wh-fronted | 105 | 25.9% | "What/How/Why/In what way…" about a named entity |
| inference | 66 | 16.3% | "What is implied/suggested…" |
| main idea / focus | 65 | 16.0% | "What is this text mainly about?", "…best be described" |
| conclusion / agreement | 15 | 3.7% | "What can be concluded…", "most in keeping with" |
| attitude / tone | 12 | 3.0% | "What is the writer's attitude…" |
| argument/claim, vocab-in-context, purpose | 10 | 2.5% | |

Attachment rules observed:

- **Long passage (5q)**: questions follow passage order for local items; the
  main-idea/whole-text item sits at the **edge** of the block — of 20
  main-idea items in long blocks, 9 are question #1 and 7 are question #5
  (bimodal; almost never mid-block). Typical budget: 3 local
  (detail/inference) + 1 whole-text + 1 stance/synthesis.
- **Short text (1q)**: one question per ~140-word text; mostly detail_stated
  (37/78 classified singles) or main-idea — the text is too short for
  multi-hop inference.
- **Cloze**: prompts are literally empty strings; the "question" is the
  numbered gap. Options are **single words** (mean 1.1, max 2 words),
  POS-uniform per gap, frequently suffix-rhymed (austerity / durability /
  prosperity / liability; Reluctantly / Historically / Occasionally /
  Consequently). Gaps test collocation, discourse polarity (a "but" upstream
  forces the negative-pole word), register fit, and connective choice.
- **Reading options** are full-sentence paraphrases: mean 11.5 words, median
  11, max 31 — four grammatically parallel statements. The correct option
  paraphrases; it never recycles a distinctive content word run from the
  passage (surface word-match is a distractor device, not a key device).

## 6. Question-type families

See `families.json` / `families.md` (built by `scripts/build_families.py`):
8 Layer-1 cognitive-op families (ELF-TYPE-001…008 from
`frameworks/elf_taxonomy.json`) + the cloze format family + a 22-item
untagged residual, with per-family trap anatomy mined from the 540 Layer-2
explanations.

## 7. Reproduction

```bash
cd pipeline/synthetic/elf/scripts
python3 corpus_stats.py > out/corpus_stats.txt   # emits out/corpus_stats.json
python3 build_families.py                         # emits ../families.json
```

Both scripts are stdlib-only. `HP_PARSED_DIR` overrides the question-bank
location.
