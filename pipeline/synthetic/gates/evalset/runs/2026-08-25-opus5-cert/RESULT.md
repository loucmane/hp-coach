# Eval run 2026-08-25 — claude-opus-5 judge certification: PASS

Trigger: gate-model change (run-protocol trigger 2). The Agent-tool "opus"
tier resolves to **claude-opus-5** (probed empirically); the prior
certification (2026-07-21) covered claude-opus-4-8. Also within sight of
trigger 5 (last run 2026-07-30).

- Gates dir git SHA: f75b2e4026490a7b195407d2f496b9e0c8e96e56 (worktree p5/batch14-15-pipeline @ origin/main f75b2e4)
- Judges: 11 × claude-opus-5 via Agent-tool subagents (G-KEY×2, G-STEM,
  G-DISTRACTOR, G-SPRÅK×3, G-ENG×3, G-REGISTER); mech via run_mech.py.
- Eval set: 31 items (15 authentic, 16 seeded incl. hard negative),
  manifest as shipped on origin/main.

## Score (score_eval.py, exit 0)

- Authentic false kills: **0** (max 0) — all 15 authentic SURVIVED
  (5 clean, 10 flagged: OCR-artifact records + G-STEM world-knowledge
  flags, the designed adjudication channel).
- Seeded kill-by-intended-gate: **15/15 = 100%**. Secondaries observed and
  harmless: G-DISTRACTOR co-killed the wrong-key pair (reverse-failure
  reading) and the double-key pair self-killed at G-KEY
  (MULTIPLE_DEFENSIBLE) — both documented patterns.
- Hard negative las-b0-013: SURVIVED_FLAGGED (world-knowledge flag only).
- Aggregate: 5 SURVIVED_CLEAN / 11 SURVIVED_FLAGGED / 15 DEAD /
  0 INCOMPLETE. G-KEY A/B convergence: identical self-kill sets; resolver
  produced 8 kills total across the wrong-key questions.

## Protocol findings (fix before or alongside the next eval revision)

1. **Blind-sheet independence on the seeded subset is weak**: seeds keep
   generator option order with the key overwhelmingly first (~16/18
   resolvable synthetic questions keyed A; the cloze keys all A). A
   blind-A guesser would score ~89% there. Shuffle seed options (and
   rebalance keys) in the next manifest version.
2. **manifest.json leaks intent**: its _changelog names a seed's purpose
   above exemplar_pool, which G-REGISTER must read. Split exemplar_pool
   into its own file.
3. **The b0/b00 id scheme leaks authenticity** to any judge; consider
   neutral ids in the materializer.
4. **Exemplar collision**: elf-b00-010 shares its passage with ELF
   exemplar host-2021-verb2-ELF-040 (disjoint by qid, not by passage).
5. **Schema vs prompt-doc field tensions** (verdict.schema.json
   additionalProperties:false): G-KEY justification, G-REGISTER
   exemplars_used/comparative_note, G-STEM blind_classification/blind_pick.
   Repo precedent is split; aggregate.py tolerated all shapes this run.
   Reconcile schema or prompts.
6. Judge-surfaced authentic-corpus debt (not eval failures): PDF
   extraction artifacts across six ELF passages incl. option text in
   elf-b00-011; page furniture in two passages; quote-typography tell
   (authentic ” vs generated straight quotes) as an M-TELL candidate.

Raw verdicts + per-gate files: session scratchpad evalrun-opus5/
(verdicts.jsonl sha256 e7653007c68b5faf…).
