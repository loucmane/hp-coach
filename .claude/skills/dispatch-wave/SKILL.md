---
name: dispatch-wave
description: Orchestrate a wave of parallel subagents over backlog tasks — tiered models for budget, orchestrator verifies and ships. Use when the owner asks to run several tasks in parallel via subagents.
---

# Dispatch wave — tiered subagent orchestration

The main loop (Fable) is the orchestrator: it writes the prompts, verifies
the results, and ships. Subagents do the bulk work on cheaper models. This
playbook came out of the 2026-07-09 waves (PRs #193–#196 and onward) and
encodes what actually saved budget without losing quality.

## Model tiering — decide by task SHAPE, not size

- **Sonnet** — the task ledger already contains the spec (file paths,
  acceptance criteria, a proven recipe). The intelligence lives in the
  prompt; Sonnet executes at Opus level. This is most implementation work.
- **Opus** — genuinely ambiguous work: design judgment, unclear root cause,
  learner-facing Swedish pedagogy prose, novel content authoring.
- **Haiku** — trivial mechanical sweeps (renames, list transforms).
- **Fable (orchestrator)** — never delegated. Its tokens go into prompt
  quality and verification.

Make design decisions IN the prompt ("already made — implement, don't
relitigate") instead of letting an expensive model deliberate.

## The prompt template (per agent)

Every dispatch prompt must carry:
1. Task id + one-line goal; branch name to create off origin/main.
2. The FULL spec from the task ledger (paste it — don't make the agent
   re-derive), plus pointers to spec docs.
3. Explicit NON-goals ("do NOT touch X this pass").
4. House rules: TDD failing-test-first for code; `cd app && pnpm test`
   green (state the current count); UI strings Swedish, code English;
   commit `--no-gpg-sign --no-verify` (worktree hooks lack node_modules —
   run tsc/biome manually instead); commit message = what/why, NO
   Co-Authored-By trailer, NO Generated-with footer.
5. **Do NOT push, do NOT open a PR** — the orchestrator verifies and ships.
6. Required final report: files changed, test counts before/after, commit
   SHA, worktree path, honest residue ("what I did not fix and why").
7. Known gotchas relevant to the task (PUA / escape rule for
   math sentinels; canonical-vs-served data stores both need the patch;
   line numbers may have shifted — locate by content).

## Dispatch mechanics

- `Agent` tool, `isolation: "worktree"`, `run_in_background: true`, all
  launches in ONE message (they run concurrently).
- Worktrees only because the tasks mutate files in parallel; each agent
  will need its own `pnpm install` — accept it, or scope tasks to be
  disjoint and sequential if the wave is small.
- Mark the tracked tasks `in_progress` at dispatch.

## Verification (orchestrator does this DIRECTLY — no verifier fleets)

Verification is asymmetric: reviewing a diff + re-running a suite costs a
fraction of generation. Per completed agent:
1. `git diff origin/main..<branch> --stat` then read the source diff.
2. Re-run the suite FRESH yourself in the agent's worktree (never trust
   the agent's report — verification-before-completion).
3. Artifact-specific check: Read produced images for figure work; render/
   screenshot for UI-visible changes; shape-validate JSON against schema.
4. If it fails review: SendMessage to the SAME agent (context intact) with
   the specific defect — far cheaper than a fresh agent re-learning the
   repo. Verifier *fleets* (adversarial skeptics) only pay off for
   content/vision corpora at scale, not code PRs.

## Shipping (orchestrator, sequential, smallest first)

1. From the worktree: `git push --no-verify origin <branch>`.
2. `env -u GH_TOKEN -u GITHUB_TOKEN gh pr create --head <branch> ...`
   (stale GH_TOKEN in long-lived shells shadows gh's store).
3. Label by NUMBER: `gh api repos/<owner>/<repo>/issues/<N>/labels -f
   "labels[]=auto-merge"` (`gh pr edit` is broken by the projectCards
   deprecation; `gh pr view` inside a worktree resolves the wrong branch).
4. Auto-merge fires on CI green OR on label-added-after-CI (PR #196).
   If a PR stalls green+labeled, read the pull_request-event Auto-merge
   run log first.
5. After merges: `git checkout main && git pull`, `git worktree remove`
   each agent worktree, delete local branches, mark tasks completed with
   a residue ledger in the description (what was NOT fixed and where the
   investigation stopped — future sessions start from there).

## Budget rules of thumb

- Expensive-model tokens go to prompts + verification, never bulk work.
- One shot per agent; targeted follow-up beats re-dispatch.
- Bound every corpus sweep (named qids, not open-ended heuristics) and
  state the cap in the prompt; the tail becomes the next wave.
- Workflow tool (pipeline/parallel + schemas + adversarial verify) only
  for large content fan-outs (hundreds of items), not task waves like this.
