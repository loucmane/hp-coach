# NOG audit — pass 2

## Method
- Sampled 15 qids across 9 exams: var-2026, host-2025, var-2024, host-2023, var-2022-1, host-2020, var-2018-1, host-2015, var-2013
- For each: read `prompt`, `options`, `answer` from `app/public/data/{exam}.json`; read full explanation from `app/public/explanations/{exam}.json`
- Also ran a corpus-wide sweep of NOG explanations for `\frac{?}` placeholders and for raw `\frac`/`\cdot` outside U+E000/U+E001 PUA wraps

## Findings

### Severity: blocker
- `host-2024-kvant1-NOG-023` — raw `\cdot` outside PUA in `solution_path`. The expression `1{,}25 \cdot E = 100` appears with no `…` wrap, so it will render as literal backslash-cdot in the UI. Snippet: `"(1): 1{,}25 \\cdot E = 100 ger E = 80…"`. (Found while sweeping all NOG explanations, not in the 15-sample.)
- `var-2024-kvant1-NOG-025` — content typo in question prompt: `"I vilken ask har Eva limstif?t"` — the `?` is misplaced inside the word `limstift` (should be `…har Eva limstift?`). Renders mid-word in the UI.

### Severity: cosmetic
- `var-2022-1-kvant1-NOG-026` — stray soft-hyphen U+00AD inside `totala`: prompt contains `"var den t­otala prisändringen"`. Invisible in most fonts but breaks word search and may show as a hyphen on narrow viewports.

### Severity: clean
- 13 of 15 inspected prompts had no defects: var-2026 NOG-023/027, host-2025 NOG-024/028, var-2024 NOG-026, host-2023 NOG-023/028, host-2020 NOG-024/027, var-2018-1 NOG-025, host-2015 NOG-023/026, var-2013 NOG-024.
- All 15 prompts contained both statement markers (newer exams use plain `(1)`/`(2)`; 2013–2018 exams use PUA-wrapped `(_{1} )` — both shapes are valid and parse cleanly).
- All 15 had the canonical 5-option set (`men ej i`, `tillsammans med`, `var för sig`, `ej genom de båda påståendena`) with no contamination.
- Math markup in explanations (e.g. `\text{sträcka}/\text{fart} = 100/1{,}91 \approx 52{,}4` in host-2025 NOG-024) is correctly enclosed in `…`.
- All 15 solution_paths evaluate (1) alone, then (2) alone, then together where relevant, and end with an answer letter that matches the corpus `.answer`.
- Zero `\frac{?}` placeholder hits across the entire NOG corpus — PR #64 fix held.
- Zero raw `\frac` hits across the entire NOG corpus.

## Patterns
- The 2013–2018 era uses PUA-wrapped `(_{1} )`/`(_{2} )` markers in BOTH prompt and option text; 2020+ uses plain `(1)`/`(2)` everywhere. Renderer needs to handle both shapes — verified that both are well-formed where they appear.
- Explanations have no `answer_letter` field; the answer letter lives only inline in `solution_path` ("svaret är X"). Not a bug per se, but means consumers can't programmatically cross-check answer-letter agreement without regex on free text. Consider adding an explicit `answer_letter` field if downstream code needs it.
- The one raw-`\cdot` slip (host-2024 NOG-023) suggests the math-wrap contract is not enforced by the explanation generator's QA pass for NOG — worth a one-line lint over the full corpus to catch similar misses.
