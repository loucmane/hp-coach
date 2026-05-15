# Register polish — Variant-C prose-tone fix

Sister prompt to the Variant-C generation prompt
(`pipeline/explanations/prompts.py`). Used as the dispatch directive
for subagents called by the `audit/corpus_lint/register_polish.py`
flow, to retire dated/office-memo Swedish phrasings from existing
Variant-C explanations **without re-generating them**.

The agent receives:
- A list of qids to fix (from `register_batches.json`)
- The flagged phrases per qid (from `register_flags.json`)
- The original entry from `data/explanations/<exam>.json`

The agent produces a polished version of each entry and saves to
`audit/_regen_polish/<exam>-<section>.json`.

---

## What you are doing

You are NOT regenerating the explanation. You are surgically
rewriting **only** the prose that contains the flagged phrases,
preserving:

- `solution_path` length and structure (1-2 sentences)
- `steps[]` count, ordering, `n`/`title`/`text`/`tier` fields
- All `distractors[]` in the same order, each with the same
  `letter` / `why_tempting` / `why_wrong` triple
- `framework_id`, `_meta` block — copy verbatim
- All math markers (U+E000 / U+E001 around math expressions)
- Idiomatic phrases that happen to overlap the patterns
  (e.g. `sätt upp ekvationen` is canonical Swedish math; flagged
  occurrences of `notera att` inside a quoted text block are also
  fine — judge in context)

You ARE rewriting phrases like:

| Flagged | Fix direction |
|---|---|
| `Notera att aloe och oboe ljudar lika men…` | `Aloe och oboe ljudar lika men…` (drop the meta-prose) |
| `Kontrollera att problemet är specifikt` | `Kolla om problemet är specifikt` / `Se efter om…` |
| `Stäm av betydelsenyans` | `Jämför betydelserna` / `Se hur de skiljer sig` |
| `Det är värt att notera att` | drop entirely; state the thing |
| `Låt oss läsa…` | `Läs…` (imperative) |
| `Som vi ser…` | drop, state the observation |
| `Nyckel:` | `Knepet:` / `Tricket:` |
| `Korrekt svar är A` | `Då blir A rätt` / `A stämmer` |
| `Fokusera på X` | drop if filler; keep if truly directive |

## Voice anchor

Variant C: ultra-granular, second-person `du`, Khan-Academy depth,
calm coaching. Read 3-5 nearby Variant-C entries in the same exam
before fixing if the section's idiom is unclear.

**Do NOT introduce new register issues.** Common over-corrections to
avoid:
- Anglicism cascade (`Let's…` → `Låt oss…` is wrong; `Imperativ` is right)
- Over-casualisation (`Stäm av…` → `Yo, kolla…` is wrong; `Jämför…` is right)
- Adding hedges (`möjligen`, `kanske`, `troligen`) when the original was direct

## Output format

A single JSON file at `audit/_regen_polish/<exam>-<section>.json`:

```json
{
  "host-2014-verb1-ORD-004": {
    "solution_path": "…",
    "steps": [ … ],
    "framework_id": null,
    "distractors": [ … ],
    "technique": "…",
    "pitfall": null,
    "_meta": {
      "model": "claude-opus-4-7",
      "generated_at": "2026-05-15",
      "recipe": "variant-c-ultra-granular"
    }
  },
  …
}
```

One key per qid you polished. Skip qids where the flag was a false
positive (e.g. `sätt upp ekvationen` in a math step) — leave them out
of the output file entirely.

## Validation

Before saving, validate each entry against
`pipeline/explanations/schema.py::validate_explanation`. Any schema
error → fix it; do not save a half-broken entry. The merge step
(`register_polish.py --merge`) re-validates and will refuse a bad
entry, so a broken one wastes a round-trip.

## Save discipline

Save the output file every 3-5 entries. The rate-limit storm during
the original Wave 2 dispatch lost work that wasn't checkpointed.
Each save overwrites the file with the cumulative result so far.
