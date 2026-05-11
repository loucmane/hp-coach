# Pedagogy regen queue — from trajectory pass

Real explanation-quality bugs surfaced (not parser, not curation —
the explanation itself has a problem). Small list because the corpus
is mostly clean; this is what 198 rounds of simulation pulled out.

## Open items

### `host-2018-kvant2-NOG-028` (v2 run round 31 / v3 retest passed cleanly)

The intersection-logic step in the solution is a non-sequitur for a
0.0 reader: "en av rosa/vit är tom betyder att den andra innehåller
ringen" — but the non-empty box could just contain häftstift, not
necessarily the ring. The reasoning short-circuits a step.

Action: rewrite solution_path to walk through the case explicitly:
the ring is in exactly one box; if rosa or vit is empty, then the
ring is in the other AND the häftstift is in one of the remaining
boxes. Re-state the deduction cleanly.

### `host-2020-kvant1-KVA-021` (v3 run round 87)

The distractor explanation for option C contains a visible
self-correction: "det skulle gälla för udda funktioner, men
f(x)=4x+15 har konstantterm 15 — bryter symmetrin... men dock tar vi
differensen, så 15 kancellerar". The "men dock" pivot reads like
LLM thinking-out-loud; a beginner sees a contradiction the writer
talks themselves out of.

Action: rewrite the distractor with a clean one-shot diagnosis. Why
C is tempting (visual symmetry around origin) + why it's wrong
(constant term breaks origin-symmetry, but cancels under
differencing — explain in one direction, not as a recovery).

## How to action

These are small, surgical regens. Use the existing pipeline
prompts (`pipeline/explanations/prompts.py`), feed it the parsed
question + the existing _meta + the diagnosis above, and write the
output back to the explanation JSON. Tag with
`_meta.regen_source: "trajectory_pedagogy_bug_2026_05_11"`.
