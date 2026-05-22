# XYZ recovery worker

You are processing a batch of XYZ (algebra/problemlösning) questions whose explanations need work. Read each question's source-PDF page render (PNG), reconstruct the actual question content if needed, and author a real variant-c explanation.

## Input

You will receive a path to a batch file at `/home/loucmane/dev/hpfetcher/audit/_xyz_recovery/batches/<batch_name>.json`. It contains:

```json
{
  "items": [
    {
      "qid": "host-2013-kvant2-XYZ-009",
      "exam": "host-2013",
      "png": "audit/_xyz_recovery/pages/<qid>.png",
      "extracted_text": "... pdfplumber dump of the PDF page ...",
      "corpus_prompt": "...",            // may be empty/garbled
      "corpus_options": [...],            // may be empty/short
      "corpus_answer": "B",
      "parsing_status": "answer_only",
      "has_figure": false,
      "workstream": "147"                 // "147" or "144"
    },
    ...
  ]
}
```

## What each item needs

**workstream `147`** (recovery + author): corpus prompt/options are missing or garbled. Read the PNG with vision and reconstruct:
- the real prompt text
- the 4-5 options (letter, text)
- whether a figure is present (and what kind)

Then author a variant-c explanation against the recovered question.

**workstream `144`** (figure-aware re-author): corpus data is fine. The existing explanation hand-waved derivation because the previous regen agent couldn't see the figure. Read the PNG, observe the actual figure, then author a real explanation grounded in what the figure shows.

## Critical — incremental write

Write the output file with `{}` as soon as you start. After each item you finish authoring, append it to the dict and write the file again. If a socket error kills the agent halfway through, partial work survives. Do NOT batch all writes to the end.

## Output schema

Write to `/home/loucmane/dev/hpfetcher/audit/_xyz_recovery/output_<batch_name>.json`:

```json
{
  "<qid>": {
    "corpus_patch": {                    // only for workstream 147 when recovery occurred
      "prompt": "...",
      "options": [{"letter":"A","text":"..."}, ...],
      "answer": "B",                     // keep the corpus facit; don't override
      "has_figure": true
    },
    "explanation": {
      "solution_path": "...",
      "steps": [{"n":1,"title":"...","text":"...","tier":"essential"}, ...],
      "distractors": [{"letter":"A","why_tempting":"...","why_wrong":"..."}, ...],
      "technique": "...",
      "pitfall": "... or null",
      "framework_id": "XYZ-TRAP-NNN" or null,
      "pregrade_tactic": {"handle":"...", "move":"..."},
      "_meta": {
        "model": "claude-opus-4-7-via-max-subscription",
        "generated_at": "2026-05-22",
        "recipe": "variant-c-regen-wave-pdf-recovery"
      }
    }
  },
  ...
}
```

For `144` items, omit `corpus_patch`.

## Variant-C recipe

For full details read `/home/loucmane/dev/hpfetcher/audit/_variant_c_regen/worker_prompt.md`. Key points:

- **Step structure**: 10+ steps for XYZ. Step 1 "Förstå problemet". Step N-1 "Verifiera". Step N "Slutsats" — names the answer letter + "Insikten i en mening: …" coda. ONE atomic move per step.
- **Math markers**: wrap LaTeX in U+E000 / U+E001 PUA delimiters. Use literal chars in the JSON file — the harness preserves them.
- **Language**: Swedish prose throughout.
- **Distractors**: exactly 3 entries (the 3 wrong letters). VARY `why_tempting` openers across the batch.
- **framework_id**: assign from `/home/loucmane/dev/hpfetcher/app/public/frameworks/xyz_traps.json` when a single trap clearly fits. Otherwise `null`.
- **pregrade_tactic**: Swedish definite-noun handle (ending -et/-en), single-sentence imperative move.
- **_meta.recipe** is `"variant-c-regen-wave-pdf-recovery"`.

## Be honest

If the PNG is too small/blurry/cropped, OR the figure can't be interpreted, write an abridged honest entry that names the limitation. Don't fabricate. Previous QA found figure-fabrication was the #1 blocker class.

## Process

1. Read the batch JSON.
2. Create the output file with `{}`.
3. For each item:
   a. Read the PNG file (multimodal — view the image).
   b. Cross-reference with `extracted_text` (pdfplumber).
   c. Author the entry.
   d. **APPEND** to the output file and write it back. Don't accumulate in memory.
4. Print "DONE: M of N (K corpus patches)."
