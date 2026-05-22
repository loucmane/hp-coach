# ORD audit — pass 2

## Method
- Sampled 15 qids across 6 exams: `host-2013`, `host-2018`, `host-2024`, `var-2015`, `var-2022-1`, `var-2026` (qids ending in -003, -008 of verb1 and -006 of verb2 from each).
- Cross-checked: headword cleanliness, 5-option shape (A–E), all-Swedish synonyms, encoding (å/ä/ö), answer-letter integrity (in options, not in distractors, matches `solution_path` "Svaret är X."), explanation step structure, distractor coverage.
- Ran corpus-wide structural sweeps over all 540 ORD entries for: leaked digits/brackets/whitespace, prompt length outliers, option count ≠ 5, letter sets ≠ ABCDE, mojibake / NFD diacritics / U+FFFD.

## Findings

### Severity: blocker
- None.

### Severity: cosmetic
- None on the 15 sampled qids. All prompts are clean single words or canonical Swedish idioms (`hysa agg`, `på måfå`, `för egen maskin`, `händelsevis`, …); all 5 options are Swedish synonym candidates; no footer/page-number contamination; å/ä/ö render correctly throughout.

### Severity: clean
- 15/15 inspected qids pass every check.
- Corpus-wide structural sweep over 540 ORD entries: 0 anomalies on prompt cleanliness, option count, A–E letter set, or encoding.
- Answer-letter integrity 15/15: `.answer` present exactly once in `.options`; distractor block always covers the 4 non-answer letters; `solution_path` tail "Svaret är X." matches `.answer` in every case.

## Patterns
- ORD explanations are uniformly richer than the "1-step trivial" baseline implied by task #81: 519/540 ORD have 3 steps (`Vad betyder X?` → idiom/etymology → `Välj synonymen`), 21/540 have 2 steps (concrete nouns like `oboe` where the etymology step is intentionally skipped). The shape is consistent and the `solution_path` always carries the meaning + answer letter — good for the dogfood reveal.
- 33 ORD prompts across the corpus are multi-word (e.g. `de facto`, `gordisk knut`, `slå sina lovar kring`). All are legitimate idioms, not parser token-merges — verified by spot-checking the option sets, which read as idiom-level synonyms (`utan hjälp`, `på rutin`, etc.), not single-word ones.
- `host-ver1-2019` and `host-ver2-2019` share the idiom `slå sina lovar kring` at the same number — expected, since the two versions of that exam reuse vocabulary blocks.
- Explanation structure consistently includes `pregrade_tactic` (`handle` + `move`) and `technique` fields on the sampled entries — pre-grade scaffolding is in place uniformly for ORD.
- No `framework_id` or `pitfall` on ORD entries (both null on the 15 sampled). Consistent with ORD being vocab recall, not framework-driven.

Overall: ORD section is the cleanest of the audited sections so far. No fixes required.
