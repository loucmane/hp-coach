# Archived plan — Corpus quality merge → apply → iterate

**Status when archived:** SHIPPED. Replaced in `~/.claude/plans/hashed-
twirling-zephyr.md` by the responsive-foundation plan on 2026-05-12.

**Caveat:** the full original plan body wasn't preserved at the
canonical archive moment (the plan-mode write happened before the
archive step). The substance of the work lives in shipped artifacts
rather than the planning document; this file documents where to find
each piece.

## Outcome summary

Eight commits on `main` between `8b9ceac` and `bc878f3` plus the
follow-on cleanup commits (`5158d12`, `045d7ec`, `4b9b179`,
`b50cbff`, `3b26ff7`, `af01dc0`, `0b9a99b`, `1c968ff`, `8cb53fa`,
`a6c71b2`, `46c4fa4`, `91edfc6`). The corpus is at the state the
plan targeted:

- 5-pass audit pipeline (Pass-1 systematic → Pass-2 fresh-eyes →
  Pass-3 adversarial → Pass-4 fix-verifier → Pass-5 cascade check)
  with agent-in-loop verification.
- 99.2% Pass-4 verifier-approval rate on the cycle-1 batch
  (1304 verdicts: 942 fix-OK, 352 propose-alternative, 10 fix-wrong).
- ~1782 corpus fixes applied across 3 iteration cycles.
- META decisions locked + documented (fel rektion kept, all-caps
  coda preserved, middle-dot multiplication preserved, hitta-själv
  canonical word order).
- Idempotency contract verified at every cycle (re-apply yields zero
  changes; math-corruption regex scan zero hits).
- Phase 8 trajectory regression check: 5/6 EXCELLENT validator,
  +52% facts learned, +225% high-leverage transfer chains vs.
  baseline.

## Where the artifacts live (not the planning doc)

**Pipeline code:**
- `audit/corpus_lint/merge_passes.py` — 3-pass merger with drift
  filter + cascade-risk flagging
- `audit/corpus_lint/build_pass4_batches.py` (+ `_cycle2` + `_cycle3`)
  — Pass-4 input builders
- `audit/corpus_lint/build_pass5_batches.py` — cascade-check input
- `audit/corpus_lint/build_apply_list.py` — Pass-4 outputs → apply
  list with policy filters
- `audit/corpus_lint/apply_pass4.py` — idempotent per-entry applier
  with word-boundary safe self-ref handling
- `audit/corpus_lint/sweep_middot_quotes.py` — final mechanical
  middle-dot normalizer with 5-rule discriminator
- `audit/corpus_lint/lint_entry.py` — single-entry Swedish-quality
  lint, callable inline from `pipeline/explanations/generate.py`

**Prompts:**
- `audit/corpus_lint/prompts/pass1_proofreader.md`
- `audit/corpus_lint/prompts/pass2_fresh_eyes.md`
- `audit/corpus_lint/prompts/pass3_adversarial.md`
- `audit/corpus_lint/prompts/pass4_fix_verifier.md`
- `audit/corpus_lint/prompts/pass5_cascade.md`

**Decisions + residuals:**
- `audit/corpus_lint/_known_residual.md` — 7 META decisions
  (fel rektion, all-caps coda, middle-dot disambiguation, hitta
  canonical, zero-freq tokens, the-in-citations, ELF exclusion).
  This is the single source of truth for "why didn't you fix X" in
  the corpus.
- `audit/corpus_lint/expert_fix_list.json` — merged 3-pass output
- `audit/corpus_lint/pass4_verified_fixes.json` — applied fix list
- `audit/corpus_lint/pass4_rejected_fixes.json` — vetoed fixes with
  reasons

**Trajectory verification:**
- `audit/trajectory/_post_audit_findings.md` — post-Phase-8
  regression analysis. Notes that the headline "level dropped 0.12"
  is calibration drift, not content regression; facts learned and
  transfer chains both improved.
- `audit/trajectory/_post_audit_run.json` + `_post_audit_summary
  .json` — raw run + validator output.

**Forward-looking:**
- `pipeline/explanations/generate.py` — wired `--lint
  {off,warn,strict}` flag; default `warn`. Future Layer-2 regens
  can't reintroduce archaic/anglicism patterns without seeing the
  warning.
- `audit/corpus_lint/test_lint_entry.py` — 7/7 smoke tests for the
  lint hook.

## Why this file exists

The repository memory pattern is to archive plan files before
overwriting (`~/.claude/projects/-home-loucmane-dev-hpfetcher/
memory/feedback_archive_plans.md`). The archive convention failed at
the canonical moment for this plan, so this stub stands in to keep
the trail traversable. Future sessions reading this file should
not look for plan-level prose here — they should follow the file
links above to the shipped artifacts.
