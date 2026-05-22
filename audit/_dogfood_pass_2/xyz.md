# XYZ audit — pass 2

## Method
- Sampled 15 qids across 6 exams: host-2013, host-2017, host-2020, host-2024, var-2022-2, var-2025, var-2026
- Inspected question prompts/options (`app/public/data/{exam}.json`) and explanations (`app/public/explanations/{exam}.json`)
- Verified PUA wrapping (U+E000/U+E001) via raw byte dumps
- Corpus-wide grep for `\frac` in XYZ items as scale check

## Findings

### Severity: blocker

- `host-2024-kvant1-XYZ-002` — parser failure. `parsing_status: "answer_only"`, `prompt: null`, `options: null`, but `answer: "C"` is recorded. Item is unrenderable. No explanation entry exists either. This question is effectively missing from the corpus.

- `host-2020-kvant1-XYZ-010` — prompt is garbage from a parser collision: `"Vad är ^2^{4} +1h^2^{2} +1h^2^{2} -1h?"`. Floating carets and stray `+1h` / `-1h` tokens. The intended expression (per the explanation: `(2² + 1)(2² − 1)(2⁴ + 1)`) is unrecoverable from the prompt alone.

- `var-2022-2-kvant1-XYZ-006` — prompt is truncated to `"Vad är medelvärdet av 3 5"` (missing the fractions and any structure). The explanation reconstructs `1/3` and `1/5`, but the user reading the question can't tell what's being averaged.

- `var-2026-kvant1-XYZ-012` — prompt reduced to `"Vilket svarsalternativ motsvarar ? 3 2"` (literal "?" plus stray digits). No explanation entry exists for this qid. Unsolvable as displayed.

- `host-2017-kvant1-XYZ-012` — explanation quality is broken. The `solution_path` literally contains hand-wavy filler: *"Den vinkeln är (180° − B)/2 + ... — enklare: ... Men svaret är 90° − y/2, vilket kräver en annan kombinerad relation av yttervinklar. Givet figuren och svarsmatchningen är svaret C"*. This is "I don't know, but the key says C" dressed up — actively misleading pedagogy.

### Severity: cosmetic

- `host-2017-kvant1-XYZ-012` option D — trailing junk: `"\frac{180°-2y}{2} xyz"`. The `xyz` is parser noise from the section heading.

- `var-2022-2-kvant1-XYZ-006` option D — trailing junk: `"\frac{4}{15} Diuretika"`. "Diuretika" leaked in from a neighbouring ORD entry.

- `var-2025-kvant1-XYZ-007` option D — trailing junk: `"f(x) = -ax + a^{3} 2 1, ·10^{6}"`. The `2 1, ·10^{6}` is noise from an adjacent item.

- `var-2026-kvant1-XYZ-006` prompt has run-on parser artifacts: `"utan at tlägga"` and `"at tnumret"` (whitespace inserted into "att läg" and "att num"). Readable but jarring.

- `host-2013-kvant1-XYZ-001` and `host-2020-kvant1-XYZ-003` — explanations have `steps: []` (length 0) and only a one-line `solution_path`. Older recipe (no `_meta.recipe` set), inconsistent with the 10–13-step `variant-c-ultra-granular` items elsewhere.

- `host-2020-kvant1-XYZ-003` solution is content-free filler: *"Av parallellitetssatserna och figurens specifika konfiguration ger 1,5x+3y=90°."* — does not teach anything.

### Severity: clean

- 10 of 15 inspected have correct prompts/options, valid answer letter present in options, PUA-wrapped LaTeX in both options and step text, and coherent multi-step explanations: host-2013-XYZ-008, host-2017-XYZ-005, host-2024-XYZ-009, var-2022-2-XYZ-011, var-2025-XYZ-004, var-2025-XYZ-007 (prompt), var-2026-XYZ-001, var-2026-XYZ-006 (modulo whitespace cosmetic above), plus host-2020-XYZ-010 explanation (the prompt is the blocker, not the explanation).

## Patterns

- **PUA wrapping holds**. Every `\frac{}{}`, `^{}`, `\cdot` etc. I sampled in `options[].text` and `steps[].text` is wrapped in U+E000…U+E001. PR #64 claim ("0 raw `\frac{?}` placeholders") looks correct *as a rendering contract* — the LaTeX literals exist in the JSON but are inside PUA fences, so the renderer can find them. Corpus-wide count: 103 XYZ prompts and 176 XYZ options contain `\frac`, all (sampled) PUA-fenced.

- **Parser bleed at item boundaries is the dominant blocker class.** `xyz`, `Diuretika`, `2 1, ·10^{6}` all look like the next column / next item's first token getting glued to the last option. This is recurring across exams and sections (cf. earlier KVA/NOG audits).

- **Two-tier explanation quality.** Items written with `recipe: "variant-c-ultra-granular"` (10–13 steps, PUA math, real numbers from the prompt) are solid. Items with `recipe: null` are thin one-liners; some are evasive (host-2017-XYZ-012, host-2020-XYZ-003). Worth a sweep to either regenerate or flag the null-recipe XYZ entries.

- **`parsing_status: "answer_only"` items need an inventory.** host-2024-XYZ-002 is the one I hit; there are likely more across XYZ. They take up a slot in the exam sequence but render as nothing — bad dogfood experience.

- **No `FORTSÄTT PÅ NÄSTA SIDA` / `Provet är slut` contamination found** in the XYZ items sampled.
