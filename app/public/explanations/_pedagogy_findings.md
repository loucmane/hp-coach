# Pedagogy Pass — 2026-05-11

The user is a 0.0 student aiming for 2.0. They cannot dogfood
correctness themselves (don't know the answers), so this pass closed
the pedagogy gap that correctness audits don't catch: does each
explanation actually TEACH the technique well enough to apply on the
next exam?

## Approach

Two stages: mechanical scan (Phase 1) then targeted LLM regen (Phase 2),
with a small SPA addition (Phase 3) to make user-side dogfood
frictionless going forward.

### Phase 1 — `audit/pedagogy_scan.py`

10 rule-checks per entry, drawn from `pipeline/explanations/prompts.py`:

| Check | Weight | What it flags |
|---|---|---|
| `technique_too_operational` | 2 | Short technique with no rule/pattern signal |
| `distractor_opener_repeat` | 2 | Same empathy opener across 2+ distractors |
| `distractor_circular` | 2 | why_tempting ≈ why_wrong (≥70% overlap) |
| `xyz_no_work_shown` | 2 | XYZ solution: no markers AND no step-glue |
| `pitfall_paraphrases_technique` | 2 | pitfall ≈ technique (≥60% overlap) |
| `solution_too_long` | 2 | solution_path > 5 sentences |
| `kva_no_verdict` | 1 | KVA technique missing verdict vocab |
| `lasmek_no_failure_mode` | 1 | LÄS/MEK/ELF why_wrong lacks failure-mode language |
| `nog_no_letter_sufficiency` | 1 | NOG distractor lacks sufficiency vocab |
| `solution_not_insight_first` | 0.5 | Solution opens with mechanics verb |

**Regen queue threshold: ≥3 weighted points.** Pre-regen distribution:

| Section | In queue | On watch |
|---|---|---|
| KVA | 49 | 184 |
| XYZ | 28 | 159 |
| NOG | 17 | 127 |
| ORD | 7 | 181 |
| LÄS | 0 | 130 |
| MEK | 0 | 362 |
| ELF | 0 | 368 |
| **Total** | **101** | **1511** |

LÄS/MEK/ELF tripped only the 1-point `lasmek_no_failure_mode` check
and never crossed threshold — the weighting correctly kept them off
the queue (these sections were already Pass-2-clean).

### Phase 2 — 4 parallel LLM regen agents

One Opus agent per section with non-empty queue. Each agent: read
prompts.py addendum, read 3 reference (high-quality) entries from
same section to anchor voice, then for each flagged qid:
**confirm-and-leave** or **rewrite-the-weak-fields**. Validate after
every rewrite. Append-write findings every 10 entries for resume.

| Section | Confirms | Rewrites | Parser-blocked | Validate fails |
|---|---|---|---|---|
| ORD | 0 | 7 | 0 | 0 |
| NOG | 0 | 17 | 0 | 0 |
| KVA | 0 | 49 | 0 | 0 |
| XYZ | 0 | 25 | 3 (deleted) | 0 |
| **Total** | **0** | **98** | **3** | **0** |

98 entries rewritten in place + 3 parser-corrupted XYZ deleted
(prompts too garbled to ground any explanation):

- `host-ver2-2019-kvant2-XYZ-011` — prompt `"Vad är ? 4+ 1/5"`
- `var-2013-kvant1-XYZ-005` — prompt `"Vid beräkning av (5 - + (3 +"`
- `var-2023-kvant1-XYZ-003` — prompt with all numerators/denominators as `?`

One regen-introduced `pitfall_paraphrases_technique` (
`host-2025-kvant2-NOG-028`) fixed by setting pitfall to null.

### Post-regen rescan

Re-running the same Phase 1 scanner against the new corpus:

| Check | Pre-regen hits | Post-regen | Δ |
|---|---|---|---|
| `technique_too_operational` | 204 | 119 | −85 |
| `kva_no_verdict` | 222 | 173 | −49 |
| `xyz_no_work_shown` | 106 | 78 | −28 |
| `nog_no_letter_sufficiency` | 69 | 52 | −17 |
| `solution_too_long` | 16 | 6 | −10 |
| `distractor_circular` | 11 | 4 | −7 |
| `distractor_opener_repeat` | 185 | 178 | −7 |

**Regen queue (score ≥3): 101 → 0.**

The `distractor_opener_repeat` drop of only 7 reflects the watch-list
entries still tripping that single check at 2 points; they fell short
of threshold but are valid targets for future user-flagged regen.

## Phase 3 — Coach feedback export

Added `Exportera feedback till urklipp` button to the previously-stub
`/coach` route. Reuses the already-implemented `getAllFeedback()` from
`app/src/api/feedback.ts`. One-click copy of all 👎 marks as JSON,
ready to paste into Claude for targeted regen.

Reset button included for after a regen cycle (so stale 👎s on
newly-improved entries don't fight the next round).

This unblocks the user-side dogfood loop: practice → 👎 →
`/coach` → paste to me → I regen those qids.

## Final state

- **3150 explanations** (was 3153; 3 parser-corrupted deletes)
- **0 schema errors**
- **67/67 SPA tests pass**
- **0 entries above pedagogy threshold**
- **Watch list: 1512 entries with 1-2 point flags** — left untouched
  per the conservative-first approach. These are the next targets for
  user-flagged regen; expected to drop substantially as the user
  dogfoods.

| Section | Final count |
|---|---|
| ORD | 540 |
| XYZ | 539 |
| MEK | 535 |
| LÄS | 530 |
| ELF | 368 |
| KVA | 342 |
| NOG | 296 |

## Out of scope (for future passes)

- Watch-list entries (1-2 point flags) — addressed by user 👎 marks
- `lasmek_no_failure_mode` heuristic refinement — too noisy (860 hits)
  because LÄS/MEK/ELF agents communicate failure mode through context
  rather than vocab keywords. The check stays at 1 point so it doesn't
  pollute the queue; refined vocab list is a follow-up.
- Voice consistency across the corpus — agents working per-section
  ensure internal consistency; cross-section voice drift only
  measurable via dogfood.
- DTK section — figure-bearing, no Layer 2 yet.
