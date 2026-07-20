# Eval run 2026-07-20 — PASS

- Round 1 (same day): EVAL FAIL — G-STEM over-fire (killed 13/13 synthetic
  seeds, 2 authentic, the hard negative), aggregation shadowing hid
  language-majority kills from killed_by, and both double-key seeds proved
  too weak (three independent judges found single clear answers).
- Fixes: aggregate.py killed_by union (+ regression test); G-STEM contract
  rewritten (STRUCTURAL_LEAK/RECALL_ONLY kill, WORLD_KNOWLEDGE flag);
  double-key seeds re-authored until author + 2 blind solvers +
  G-DISTRACTOR all independently certified MULTIPLE_DEFENSIBLE;
  manifest 1.1.0.
- Round 2 result: authentic false kills 0/15 (max 0); seeded
  kill-by-right-gate 14/14 = 100% (min 100%); hard negative SURVIVED_FLAGGED.
- Verdict provenance: 312 verdict records; G-STEM + 2-seed batteries fresh,
  other gates reused from round 1 (items unchanged); G-KEY comparison
  orchestrator-side per run-protocol convention.
- Executors: claude-fable-5 agents, 11 independent judges (round 1) + 7
  (round 2, two-seed batteries serial-vote as recorded in executed_by).

Gate stack UNFROZEN for Batch 1 generation as of this run.
