# ELF generation blueprint — the contract

A *blueprint* is the complete spec for one generated ELF block (passage +
items). Generation (later, gated) consumes a blueprint and must satisfy every
field; verification checks the artifact against the same fields. All measured
bands come from `corpus-analysis.md` §3–5 and `families.json`; a generated
block that misses a hard band is rejected, not hand-fixed.

Blueprints exist per **block**, matching the invariant sitting architecture:
`long_passage_5q`, `cloze_5gap`, or `short_text_1q`.

## 1. Passage spec

| field | type | hard band (from corpus) |
|---|---|---|
| `block_format` | enum | long_passage_5q \| cloze_5gap \| short_text_1q |
| `genre` | enum | science_journalism \| history_essay \| society_commentary \| arts_review (draw ≈45/25/20/10) |
| `fictional_source` | struct | invented byline + invented publication *type* ("a popular-science monthly") — NEVER a real publication name or real journalist |
| `topic` | string | novel; must not overlap a source-corpus passage topic at the specific level (see anti-plagiarism.md §2) |
| `spelling_variety` | enum | BrE or AmE — one, held throughout, matched to genre (science→often AmE, history/commentary→often BrE) |
| `length_words` | int | long: 550–825 (target 690–740); cloze: 300–410; short: 105–160 |
| `fk_grade` | float | long: 11.0–14.0; cloze: 9.5–13.0; short: 11.0–15.0 |
| `flesch_reading_ease` | float | long: 30–58; cloze: 40–60 |
| `avg_sentence_len` | float | 16–30 words |
| `sentence_len_sd` | float | ≥ 7 (rhythm: alternate 35+w subordinated sentences with ≤10w verdict sentences; uniform length = reject) |
| `pct_polysyllabic` | float | 12–24% |
| `paragraphs` | int | long: 3–6 logical paragraphs; short: 1 |
| `title` | string | 2–5 words, noun-phrase or light pun ("Killer Cats", "Bitter Pills" style — not a thesis statement) |
| `devices` | list | long passages: ≥1 direct quotation from a named (invented) researcher/critic; hedged claims ("suggests", "may") that distractors can upgrade; one rhetorical pivot ("however"/"yet") whose downstream carries the argument |
| `arc` | enum | phenomenon→evidence→complication→verdict (science) \| episode→context→reinterpretation (history) \| claim→counterexample→qualified verdict (commentary) \| work→assessment→placement (review) |

## 2. Question spec (per item)

| field | type | constraint |
|---|---|---|
| `family_id` | enum | from families.json |
| `stem` | string | drawn from the stereotyped stem inventory for the family (corpus-analysis.md §5) — ELF stems are formulaic on purpose |
| `anchor` | pointer | which paragraph/sentence(s) of the passage the key derives from |
| `key_derivation` | enum | paraphrase_one_sentence (TYPE-001) \| one_inch_inference (TYPE-002) \| condition_clause (TYPE-004 argument) \| whole_text_gist (TYPE-004) \| stance_of_writer_not_quotee (TYPE-005) … |
| `options` | 4 structs | grammatically parallel; 8–20 words each (mean ≈11); key must NOT reuse a distinctive ≥4-word run from the passage |
| `position_in_block` | int | main-idea/whole-text item at position 1 or 5 only; local items follow passage order |

### Block budget (long_passage_5q)
2× TYPE-001, 1× TYPE-002 or 003, 1× TYPE-004 (edge position), 1× TYPE-005/006/007
— matching the observed family×format distribution.

### Cloze gap spec (cloze_5gap)
Per gap: `gap_frame` (the surrounding clause), `target_pos`, `key`,
plus 3 distractors per §3. Options are 1–2 words, POS-uniform; ≥2 options
shape-matched to the key (same suffix family or same connective class).
Gap types across the 5: ≥1 collocation gap, ≥1 polarity gap (contrastive
frame upstream), ≥1 connective/adverb gap; remaining free.

## 3. Per-distractor trap assignment

Every distractor carries an explicit `trap` from the family's mined anatomy
(families.md). No "filler" distractors: three options, three named traps.

| trap tag | mechanics (what the generator must build) |
|---|---|
| quantifier_upgrade | keep the passage's wording, strengthen a hedge to an absolute (some→all, may→will) |
| wrong_location | true statement from a different paragraph/mini-text than the stem targets |
| outside_knowledge | plausible real-world truth the passage never states |
| surface_word_match | recycles distinctive passage vocabulary in a claim the passage doesn't make |
| scope_error | vivid sub-point promoted to main idea, or over-broad theme (TYPE-004) |
| too_literal_or_too_far | literal restatement (for inference items) or a two-step leap |
| role_or_attribution_swap | assigns quoted critic's stance to the writer or vice versa (TYPE-005 signature) |
| polarity_mirror | the positive-pole word where the contrastive frame demands negative (cloze signature) |
| collocation_misfit | right POS + right suffix + vaguely thematic, but the collocation doesn't exist in English (cloze signature) |

## 4. Verification hooks (consumed by the later QA gate)

- Recompute all §1 metrics with `scripts/corpus_stats.py` functions; every
  hard band must pass.
- Anti-plagiarism screen per `anti-plagiarism.md` (corpus n-gram overlap +
  web check) must pass before an item is stored.
- Answer-key defensibility: a solver given only the passage must reach the
  key via the family's Layer-1 attack protocol (`frameworks/elf_taxonomy.json`);
  each distractor must be *defeatable* by that same protocol.

---

## 5. Worked example blueprint (SPEC ONLY — no passage generated)

```json
{
  "blueprint_id": "elf-bp-example-001",
  "block_format": "long_passage_5q",
  "passage": {
    "genre": "science_journalism",
    "fictional_source": {
      "byline": "invented name, journalist persona",
      "publication_type": "popular-science monthly (AmE house style)"
    },
    "spelling_variety": "AmE",
    "topic": "urban beekeeping's measured effects on wild pollinator populations",
    "arc": "phenomenon→evidence→complication→verdict",
    "length_words": [660, 760],
    "fk_grade": [11.5, 13.5],
    "flesch_reading_ease": [38, 52],
    "avg_sentence_len": [19, 26],
    "sentence_len_sd_min": 8,
    "paragraphs": 4,
    "title_style": "2-4 word noun phrase, light irony (cf. 'Killer Cats')",
    "devices": [
      "direct quotation from an invented ecologist, hedged ('our data suggest')",
      "a 'however' pivot in paragraph 3 that reverses the reader's expectation",
      "one statistic given with an explicit qualifier ('in some cities')"
    ]
  },
  "questions": [
    {
      "position": 1,
      "family_id": "ELF-TYPE-004",
      "stem": "What is this text mainly about?",
      "key_derivation": "whole_text_gist — the complication, not the opening phenomenon",
      "distractors": [
        {"trap": "scope_error", "build": "the vivid paragraph-1 anecdote promoted to main topic"},
        {"trap": "surface_word_match", "build": "recycles 'pollinator decline' in a claim the text never argues"},
        {"trap": "outside_knowledge", "build": "true-sounding bee-conservation truism absent from the text"}
      ]
    },
    {
      "position": 2,
      "family_id": "ELF-TYPE-001",
      "stem": "What are we told about the study conducted in <city>?",
      "anchor": "paragraph 2, sentences 2-3",
      "key_derivation": "paraphrase_one_sentence",
      "distractors": [
        {"trap": "quantifier_upgrade", "build": "'in some cities' → 'in every city studied'"},
        {"trap": "wrong_location", "build": "true fact about the paragraph-3 counter-study"},
        {"trap": "outside_knowledge", "build": "plausible methodological detail never stated"}
      ]
    },
    {
      "position": 3,
      "family_id": "ELF-TYPE-002",
      "stem": "What is implied about commercial hive permits?",
      "anchor": "paragraph 3 bridge between the two studies",
      "key_derivation": "one_inch_inference",
      "distractors": [
        {"trap": "too_literal_or_too_far", "build": "literal restatement of the anchor sentence"},
        {"trap": "too_literal_or_too_far", "build": "two-step leap requiring policy knowledge"},
        {"trap": "quantifier_upgrade", "build": "hedged implication stated as certainty"}
      ]
    },
    {
      "position": 4,
      "family_id": "ELF-TYPE-005",
      "stem": "What is the writer's attitude towards urban beekeeping campaigns?",
      "anchor": "verdict paragraph + the hedged quotation",
      "key_derivation": "stance_of_writer_not_quotee — mildly skeptical, not dismissive",
      "distractors": [
        {"trap": "role_or_attribution_swap", "build": "the quoted ecologist's enthusiasm assigned to the writer"},
        {"trap": "polarity_mirror", "build": "'dismissive' — overshoots the hedged skepticism"},
        {"trap": "tone_misread", "build": "'neutral reporter' — misses the evaluative pivot"}
      ]
    },
    {
      "position": 5,
      "family_id": "ELF-TYPE-007",
      "stem": "Which of the following statements is most in line with the text?",
      "anchor": "whole text",
      "key_derivation": "condition_clause — paraphrases the qualified verdict",
      "distractors": [
        {"trap": "quantifier_upgrade", "build": "verdict without its qualifier"},
        {"trap": "wrong_location", "build": "accurate detail contradicted later by the pivot"},
        {"trap": "outside_knowledge", "build": "sensible conservation claim the text never makes"}
      ]
    }
  ],
  "verification": {
    "metric_bands": "recompute via scripts/corpus_stats.py text_metrics()",
    "anti_plagiarism": "anti-plagiarism.md pipeline, all three tiers",
    "answer_defensibility": "solve blind via frameworks/elf_taxonomy.json protocols"
  }
}
```

Note the example deliberately specifies *mechanics*, not sentences: the
passage itself is generation-phase output, which is gated behind owner
approval and the anti-plagiarism pipeline.
