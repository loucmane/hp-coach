# LÄS anti-plagiarism verification — proving "original", not asserting it

Structure is not copyrightable; **expression is**. This pipeline generates original passages from
structural blueprints (`blueprint-template.md`), but "original" must be **verified against the ©
UHR source corpus**, not taken on faith. Every generated passage passes the checks below before it
can enter the item bank. A failing passage is rejected and regenerated — never edited into
compliance by hand (hand-editing toward a threshold is how you smuggle expression across).

The source corpus for all checks = the 174 authentic passages in `data/parsed/*.json`
(`section == "LÄS"`, the `context` field), de-hyphenated via `common.clean_text`.

---

## Check 1 — verbatim / n-gram overlap (expression copying)

The primary plagiarism signal. Compare the candidate passage against **every** source passage.

- **Character-normalise** first: NFC, lowercase, collapse whitespace, strip punctuation, rejoin
  PDF hyphenation. (Otherwise trivial reformatting hides a lift.)
- **Word n-grams**, n = 5, 8, 10. Compute, against the whole source corpus:
  - `max_5gram_overlap` = share of the candidate's 5-grams that appear in ANY source passage.
  - `longest_common_ngram` = length of the longest contiguous shared word-sequence with any source
    passage.
  - `jaccard_5gram_topmatch` = Jaccard of 5-gram sets vs. the single closest source passage.

**Proposed thresholds (reject if exceeded):**
| metric | reject threshold | rationale |
|---|---|---|
| `longest_common_ngram` | **> 7 words** contiguous | 8+ shared words is almost never coincidental in Swedish |
| `max_5gram_overlap` | **> 2 %** of candidate 5-grams | common function-word 5-grams give a small baseline; 2 % is well above it |
| `jaccard_5gram_topmatch` | **> 0.05** vs. any one source | catches heavy paraphrase of one specific passage |

Calibrate the baseline empirically by running the metric **source-vs-source** (each authentic
passage against the other 173): the 99th percentile of that null distribution is the floor no
generated passage may exceed. Ship the calibration script alongside; do not hard-code 2 % without
confirming the null sits below it. (Function-word 5-grams like *"det är en av de"* will produce a
non-zero floor — measure it, don't guess it.)

## Check 2 — named-entity / topic distance (borrowing the subject, not the words)

A passage can dodge n-gram checks while still being "the kassava passage, reworded". Guard the
*subject*, not just the surface.

- **Named-entity extraction** (persons, orgs, works, places, study names) from candidate and from
  each source passage. Reject if the candidate shares **≥2 salient named entities** with any single
  source passage (a fictional-but-identical researcher + institution = a reworded source).
  - Bylines are exempt from cross-matching but must themselves be **fictional** — cross-check the
    generated author name against the set of ~174 real bylines and reject exact matches.
- **Topic distance.** Embed candidate and each source passage (any sentence-embedding model);
  require **cosine similarity < 0.80** to every source passage. A candidate that is the nearest
  neighbour of a specific source at 0.9 is that source's topic reworked — reject.
  - Also require topic **novelty**, not just distance: the candidate's dominant topic should not be
    a near-duplicate of a source's dominant topic (e.g. don't regenerate "almsjuka" as "askskottsjuka"
    with the same disease-spread arc). Flag for human review if nearest-source cosine ∈ [0.75, 0.80].

## Check 3 — internal validity (not plagiarism, but gates the same pipeline)

These belong in the same gate because a passage that fails them is unusable regardless of originality:

- **Length / LIX / sentence-rhythm bands** from `blueprint-template.md` Part A — reject if outside.
- **Answer-key uniqueness:** exactly one option is defensible per question; distractors are genuinely
  wrong given the passage (no accidental second-correct). Verify by an independent LLM solver that
  must pick the key *and* justify each distractor's wrongness with a passage citation.
- **Trap fidelity:** each distractor realises its assigned trap tag (an invert distractor must
  actually invert). Auto-check with the same solver's rationale.

---

## Recommended thresholds summary (starting point, calibrate before trusting)

```
longest_common_ngram_words        <= 7        (reject if > 7)
max_5gram_overlap_fraction        <= 0.02     (reject if > 0.02; confirm null floor first)
jaccard_5gram_vs_nearest_source   <= 0.05
shared_salient_named_entities     <= 1        (reject if >= 2 with any one source)
generated_byline_in_source_set    == False    (reject exact real-byline reuse)
max_cosine_vs_any_source          <  0.80     (reject >= 0.80; human-review 0.75-0.80)
```

## Process rules

1. **Calibrate on the null first.** Run every metric source-vs-source and set each reject threshold
   above the 99th percentile of the authentic-vs-authentic distribution. Commit the calibration
   output next to the thresholds. Thresholds above are *proposals*, not measured floors.
2. **Whole-corpus comparison, every time.** Check the candidate against all 174 source passages, not
   a sample — a lift from the one exam you didn't sample is the one that surfaces publicly.
3. **Reject-and-regenerate, never hand-trim.** If a passage trips a check, discard it. Editing a
   passage down to just under a threshold is precisely the behaviour the check exists to stop.
4. **Log every candidate's scores** (pass and fail) so the null distribution and false-positive rate
   stay auditable as the generator and corpus evolve.
5. **Human spot-review** the borderline band and a random sample of passes — automated distance is
   necessary, not sufficient, for a launch-critical originality claim.

## Honest residue / open items

- Thresholds here are **reasoned proposals**; none is yet calibrated against the source-vs-source null
  (that calibration is the first build task of the verification harness, not part of this analysis).
- Embedding-based topic distance needs a chosen model; a multilingual/Swedish sentence encoder is
  assumed but unspecified.
- Named-entity extraction quality in Swedish varies; the ≥2-shared-entity rule should be validated on
  the known case of the duplicated `host-ver1-2019` / `host-ver2-2019` passages (identical texts —
  they should score as maximal overlap and are a free positive-control for Check 1 and Check 2).
