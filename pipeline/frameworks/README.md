# Layer 1 framework authoring

Pipeline for synthesizing the 8 Layer 1 framework JSONs that the
curriculum scheduler (and the regen pipeline, and the SPA's adaptive
review screens) read to identify clusters within each section.

See PRD § 5.3 for the high-level spec and `.claude/plans/hashed-twirling-zephyr.md`
for the design rationale.

## What this produces

Eight files under `frameworks/`, one per section. Each file holds a
list of typed entries with stable `SECTION-KIND-NNN` IDs:

| File | Family | Entry type | Target count |
|---|---|---|---|
| `ord_roots.json` | `ord_roots` | `OrdRoot` | ~187 |
| `kva_traps.json` | `kva_traps` | `TrapPattern` | ~30-50 |
| `nog_traps.json` | `nog_traps` | `TrapPattern` | ~20-30 |
| `xyz_traps.json` | `xyz_traps` | `TrapPattern` | ~40-60 |
| `mek_protocol.json` | `mek_protocol` | `MekRule` | ~10-20 |
| `las_taxonomy.json` | `las_taxonomy` | `ReadingTaxonomy` | ~6-8 |
| `elf_taxonomy.json` | `elf_taxonomy` | `ReadingTaxonomy` | ~6-8 |
| `dtk_tactics.json` | `dtk_tactics` | `DtkTactic` | ~10 (v0) |

IDs are append-only: stamped on first authoring and **never
renumbered**. Adding a new entry appends to the list. Historical
mistakes in the DB are tagged with these IDs; renumbering breaks them.

## Three-step workflow per family

```bash
source venv/bin/activate

# 1. Scan the corpus for candidate clusters
python3 -m pipeline.frameworks.extract --family ord_roots
# → /tmp/frameworks/candidates_ord_roots.json

# 2. Dispatch a synthesis agent (Opus) with the candidates + prompt.
#    See "Synthesis agent dispatch" below for the canonical Agent call.
#    Agent reviews candidates, promotes the real patterns, drops
#    hallucinated ones, emits structured entries via the
#    submit_framework tool. Writes to frameworks/<family>.json.

# 3. Validate the written file against the schema
python3 -c "from pipeline.frameworks.schema import validate_framework_file as v; \
            print(v('frameworks/ord_roots.json', 'ord_roots'))"
```

## Synthesis agent dispatch

From within a Claude Code session, dispatch an Agent (general-purpose,
Opus, run_in_background) with this template:

```
You are synthesizing the <FAMILY> Layer 1 framework for HP-Coach.

Read in order:
1. /home/loucmane/dev/hpfetcher/pipeline/frameworks/prompts.py — the
   PROMPTS[<family>] string for your detailed instructions
2. /home/loucmane/dev/hpfetcher/pipeline/frameworks/schema.py — the
   typed entry shape you must produce
3. /tmp/frameworks/candidates_<family>.json — the candidate clusters
   to review

Your job: read every candidate, promote the ones that satisfy the
floor (≥3 real example_questions, teachable countermeasure, clear
pattern), drop the rest. Output the final framework JSON to
/home/loucmane/dev/hpfetcher/frameworks/<family>.json with the shape:

{
  "section": "<SECTION>",
  "family": "<family>",
  "version": 1,
  "authored_at": "2026-05-11",
  "notes": null,
  "entries": [
    { "id": "<SECTION>-<KIND>-001", ... full fields per schema ... },
    ...
  ]
}

Hard rules from the prompt apply. Especially: never invent qids.

After writing, run:
  python3 -c "from pipeline.frameworks.schema import validate_framework_file as v; \
              print(v('frameworks/<family>.json', '<family>'))"
to confirm it validates. If the validator raises, fix and retry.

When done, output a brief summary: entries authored, candidates
rejected (with reasons).
```

## Authoring order

Per the plan, this sequence:

1. **ORD** first (largest, most mechanical, partly already done via
   stem-matching in extract.py)
2. **KVA + NOG** in parallel (already prominent in the trajectory's
   high-leverage list — these IDs will tag many existing mistakes
   immediately)
3. **XYZ** next (biggest trap surface but well-understood techniques)
4. **MEK + LÄS + ELF** in parallel
5. **DTK** last (v0 — no Layer 2 to leverage; minimal entries)

## Verification

Per family, after the synthesis agent writes the JSON:

1. **Schema validates**: `validate_framework_file()` returns clean
2. **80% taggability**: pick 10 random mistakes (or 10 random
   questions) in that section, attempt to tag each with at least one
   framework ID. ≥ 80% taggable → framework is dense enough.
3. **Coverage of known-good signals**: the trajectory v3 + full runs
   surfaced ~19 + 8 specific high-leverage techniques in
   `audit/trajectory/_v3_findings.md` and `reports/full-seed50-2026-05-11.md`.
   Each should map to a framework ID. If a known-good technique
   isn't covered, the framework is missing a known-relevant entry.

## Why not just hand-author?

Two reasons:
1. **Surface area**: ~300 total entries × ~5 fields each ≈ 1500
   structured datapoints. LLM-assisted is faster than typing.
2. **Coverage**: the extractor scans 1000+ corpus questions per
   section to find recurring patterns. A human author would miss
   long-tail variants the LLM picks up.

The trade-off is the LLM hallucination risk, mitigated by the
"every entry needs ≥3 real qids" floor and the structural-review
gate (I review each agent's output before committing).

## What this DOESN'T do

- **Lesson content** — that's Layer 1.5 (per PRD § 3.4), a separate
  workstream. Frameworks only catalog IDs + patterns + countermeasures;
  full lesson cards are authored separately.
- **DTK Layer 2 explanations** — out of scope (no Layer 2 for DTK
  yet). DTK framework is v0, synthesized from question structure
  alone.
- **Tagging existing mistakes** — that's a separate pass after
  frameworks land: a script reads `data/explanations/*.json`, matches
  `technique` text against framework IDs, writes back the IDs.
