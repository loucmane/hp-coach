# ELF regen QA — sample of 15

## Method
- Source: 38 ELF entries with `_meta.recipe == "variant-c-regen-wave"` across `app/public/explanations/*.json`.
- Sample: 15 qids drawn with `random.seed(42); random.sample(qids, 15)` (`random.sample` is seed-stable for the same input order — `sorted(glob.glob(...))` here is deterministic).
- Per-qid check: answer-letter alignment between corpus `.answer` and the explanation's `solution_path` + final `steps[].text`, plus manual read of `solution_path`, `steps`, `distractors` against the corpus `context` and `options`.
- Programmatic letter alignment confirmed all 15 of 15 match (corpus answer == letter in `solution_path` == letter in final step).
- Programmatic Swedish-leak scan returned only false positives: "under" (English preposition, e.g., "only under specific conditions") and "till" (inside "dusk-till-dawn"). No actual Swedish lexical leak in any of the 15 entries.

### Sample (15 qids)
- `host-ver2-2019-verb2-ELF-038`
- `host-2022-verb2-ELF-037`
- `var-2024-verb1-ELF-038`
- `var-2024-verb1-ELF-036`
- `var-2024-verb1-ELF-035`
- `host-ver2-2019-verb2-ELF-039`
- `host-ver2-2019-verb2-ELF-037`
- `var-2024-verb2-ELF-038`
- `var-2024-verb2-ELF-040`
- `var-2026-verb1-ELF-035`
- `var-2026-verb2-ELF-038`
- `host-2022-verb2-ELF-038`
- `var-2024-verb1-ELF-039`
- `var-2024-verb1-ELF-034`
- `var-2026-verb2-ELF-039`

Random seed: 42

## Issues found

### Severity: blocker (wrong answer reasoning OR Swedish leak)
- None.

### Severity: weak (passage not grounded, generic platitudes)
- None. Every explanation in the sample quotes specific phrases from the passage (e.g. "preached a love of humanity" / "fought incessantly with his wife" for the Tolstoy entry; "bedrock processes" / "well-oiled prefrontal cortex" for the marshmallow entry; "doomed surplus" / "a growing minority" for the cats entries; "roaring, ad hominem" for the Snow entry). Distractor `why_wrong` text consistently cites a specific passage fact rather than hand-waving.

### Severity: clean
- 15 / 15 sampled clean.

## Notes (not issues)
- `var-2024-verb2-ELF-038` — the corpus passage spells the literary critic "F. R. Lewis" (a known OCR/transcription error in the source PDF; the historical figure is "F. R. Leavis"). The explanation silently uses the correct "Leavis" spelling. This does not change the answer (D — squarely rejected by prominent intellectuals) and reasoning still grounds on the verbatim "roaring, ad hominem" and Trilling's "impaired the possibility of rational discourse" phrases. Flagging only because it is the one place the explanation diverges from the passage text — a benign correction, not a hallucination.

## Patterns
- Consistent structural recipe across all 15: solution_path lands the answer with a passage quote; steps move from "what the question asks" → "locate the relevant sentence" → "translate / paraphrase" → "match to options" → "conclusion". Final step always names the letter explicitly.
- Distractor entries reliably pair a `why_tempting` (the surface trap) with a `why_wrong` that cites a specific step or passage fact — no generic "this is wrong because the passage doesn't support it" patterns observed.
- `pregrade_tactic` / `technique` / `pitfall` fields are all populated and content-specific (not boilerplate). Each names a transferable move tied to the question type (e.g. "the hedge-match" for agreement questions, "the bedrock bridge" for unified-mechanism questions, "the umbrella category" for target-list questions).
- ELF language discipline holds throughout — all handles, moves, step text, and distractor copy are in English.
