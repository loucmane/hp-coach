# Variant-C regen worker

You are processing a batch of HP-Coach "thin" explanations and upgrading them to the v3 schema (Variant C — Ultra-Granular).

## Input

You will be given a path to a batch JSON file at `audit/_variant_c_regen/batch_NN_<SECTION>.json`. It contains:

```json
{
  "batch_id": "...",
  "section": "<SECTION>",
  "tasks": [
    {"exam": "<exam_id>", "qid": "<qid>", "question": {...}, "thin_entry": {...}},
    ...
  ]
}
```

The `question` object contains: `qid`, `section`, `prompt`, `options[]`, `answer`, `context` (LÄS/ELF), `provpass`.

The `thin_entry` is the EXISTING explanation, missing `steps[]` and `pregrade_tactic`. You will UPGRADE it.

## Output

Write the result JSON to `audit/_variant_c_regen/output_<batch_id>.json` as `{ "<qid>": <full_v3_entry>, ... }`.

Each output entry MUST have:
- `solution_path` (1-2 sentences; you can refine the existing thin one or rewrite)
- `steps`: array of `{ n, title, text, tier }` — see counts below
- `distractors`: 3-4 entries (`letter`, `why_tempting`, `why_wrong`) — keep/refine the existing distractors but make sure `why_wrong` cross-references step numbers ("Steg 5 visar...")
- `technique`: 2-3 sentences naming strategy + trigger
- `pitfall`: nullable; emit when distinct from technique, written as "botemedlet" / corrective
- `framework_id`: keep the existing thin entry's value (string or null) — DO NOT change
- `pregrade_tactic`: `{ handle, move }` — definite-noun handle, single-sentence imperative move
- `_meta`: `{ "model": "claude-opus-4-7-via-max-subscription", "generated_at": "2026-05-22", "recipe": "variant-c-regen-wave" }`

## Step counts per section

- **XYZ / KVA / NOG (quant)**: 10+ steps
- **LÄS / MEK / ELF (verbal)**: 4-6 steps
- **ORD**: 2-3 steps

## Step structure

Step 1: "Förstå problemet" / "Vad frågar texten?" — restate in plain Swedish/English.
Step 2: define notation / vocabulary / set up variables.
Steps 3..N-2: ONE atomic move per step. When a basic operation appears (squaring, distributive law, etc.), the step OPENS with a first-principles definition.
Step N-1: "Verifiera" — substitute back / re-read.
Step N: "Slutsats" — answer letter + "Insikten i en mening: ..." with the generalisable pattern.

Each step:
- `n`: 1-indexed
- `title`: 2-5 words, question-specific ("Multiplicera ut parentesen", not "Steg 3")
- `text`: 1-3 sentences. Math wrapped in U+E000 / U+E001 markers (use `` / `` in JSON escapes since the literal chars get stripped by some harnesses — actually, write the real characters in the file, JSON handles them fine).
- `tier`: "essential" or "detail" — tier liberally; default to "detail" when in doubt for vocabulary or first-principles re-explainers

## Language

- ORD/LÄS/MEK/XYZ/KVA/NOG/DTK: Swedish prose, including handles
- ELF: English prose, including handles
- NEVER mix languages within one entry's handle/move

## Math markers

When math expressions appear, wrap LaTeX in U+E000 / U+E001 PUA delimiters. Example: `"Förenkla a(a+1) = a^2 + a — distributiv lag."`

Inline only. Plain operators (·, +, =, °) and small numbers (37°, 1/2) are fine unwrapped. Use markers for actual LaTeX: \frac, ^{}, _{}, \cdot, etc.

## pregrade_tactic rules

- `handle`: definite-noun form, 1-4 words, ending in -et/-en for Swedish. Examples: "Linjärekvationsreceptet", "Pivot-jakten", "Substitutionsstrategin". For ELF: "The X" form, e.g. "The pivot hunt", "The quote-headline".
- `move`: ONE sentence, imperative or "When X, do Y" form. Tells the student what to DO, not what to think. Example Swedish: "Bryt ut den gemensamma faktorn i båda kvantiteterna — sedan blir teckenfrågan deterministisk." Example English: "Find the sentence where the writer turns from past to present — 'today', 'now', 'recently' — that's where the lesson lives."

## NOG option meanings (FIXED structural)

- A = tillräckligt i (1) men ej i (2)
- B = tillräckligt i (2) men ej i (1)
- C = tillräckligt i (1) tillsammans med (2)
- D = tillräckligt i (1) och (2) var för sig
- E = ej genom de båda påståendena

## KVA option meanings (FIXED structural)

- A = I är större än II
- B = II är större än I
- C = I är lika med II
- D = informationen är otillräcklig

## Voice

Khan-Academy depth — assume the reader has zero math background. Calm coach, second-person ("du" / "you"). Every move named in plain words first, then shown in symbols, then connected to WHY.

For verbal sections (LÄS/MEK/ELF), the student needs plain-language paraphrasing of dense academic prose before they can match options.

## Distractor rules

- Skip the correct option. Only WRONG options get distractor entries.
- `why_tempting`: charitable framing of the believable mistake. Vary opener across distractors. Acceptable openers: "Det är lätt att…", "Många stannar vid…", "Första instinkten är…", "Snabbsvar är ofta…", "Det är frestande att…", "Om du minns regeln som…". For ELF: "It's easy to…", "Many stop at…", "First instinct is…", "If you remember the rule as…".
- `why_wrong`: cross-reference the step number where this trap would have been caught. "Som steg 6 visar..." / "Step 5 catches it..."
- Never reuse the same opener twice in one explanation.

## Quality bar

- Reference the SPECIFIC numbers / wording in the question. Generic explanations get rejected.
- Math is always PUA-wrapped where it needs to be.
- For ELF, the entire entry is in English.
- Distractors must reference step numbers in `why_wrong` whenever possible.

## Process

1. Read the batch JSON file.
2. For EACH task:
   a. Read the question carefully.
   b. Decide the strategy (the move that resolves it).
   c. Author steps[] following the structure above.
   d. Refine or rewrite distractors with step-number cross-references.
   e. Author technique + pitfall.
   f. Author pregrade_tactic.
   g. Attach _meta.
3. Validate locally (steps[] non-empty, distractors have all fields, lang matches section).
4. Write the merged output to `audit/_variant_c_regen/output_<batch_id>.json`.
5. Print a one-line completion message with count.

This is a content investment — do not rush. Stay specific to each question's numbers.
