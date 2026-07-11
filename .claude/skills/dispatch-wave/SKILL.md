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
8. **The anti-park rule (verbatim, in every prompt with long-running
   steps):** "Never launch a background job and then wait for its
   completion notification — notifications are not a reliable wake
   signal for you. Run long steps as foreground commands in ≤2-minute
   batches, or poll a background job's output artifact in a bounded
   foreground loop. If any single step blocks >2 minutes, record the
   blocker, descope it explicitly, and keep moving." (Two agents parked
   this way on 2026-07-10 — each burned ~15 idle minutes before
   detection.)

## Stall detection & recovery (orchestrator)

An agent whose transcript mtime is frozen for >5 minutes
(`stat -c '%y' ~/.claude/projects/<proj>/<session>/subagents/agent-<id>.jsonl`)
is parked, not thinking. Recovery that preserves context: TaskStop it,
then SendMessage the SAME agentId with a corrective ("you are the
implementer; nothing is running for you to wait on; continue from where
you are") — the resume keeps its accumulated reading AND salvages any
commits a nested worker landed. Re-dispatch fresh only if the resumed
agent parks again.

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
4. Run EVERY CI gate the agent reported skipping — especially
   `pnpm exec biome check src` (agents routinely can't run it in their
   worktree and note "lint skipped" in the residue; twice that residue
   became a red CI run, 2026-07-10 PR #233 the second time). Read the
   residue list as a checklist of what YOU must run before pushing, not
   as informational. `biome check --write` auto-fixes format/import-sort;
   re-run the suite after.
5. If it fails review: SendMessage to the SAME agent (context intact) with
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
5. **SERIALIZE the e2e jobs — never let two CI e2e runs overlap.** All
   e2e suites share ONE Clerk dev instance; concurrent runs kill each
   other's prefs/auth round-trips (2026-07-10: two PRs pushed+labeled
   together failed the same prefs-family tests twice; the identical
   commit passed on a solo rerun). So: push+label ONE PR, wait for its
   CI to complete, then push the next. Same for reruns — trigger one at
   a time (and remember a merge push can itself start a main run). The
   flake signature: failing set drifts between runs, all failures are
   worker-API round-trips (prefs/mistakes/api specs), logs show
   "[Clerk Testing] FAPI request failed after 4 attempts". When you see
   it: verify locally in the worktree (`pnpm exec playwright test
   <spec>:<line> --project=chromium` — needs app/.env.local copied from
   the main checkout), then rerun CI solo; don't debug the diff first.
6. After merges: `git checkout main && git pull`, `git worktree remove`
   each agent worktree, delete local branches, mark tasks completed with
   a residue ledger in the description (what was NOT fixed and where the
   investigation stopped — future sessions start from there).

## Orchestrator shell discipline (cwd persists between calls)

The orchestrator's Bash cwd survives across tool calls, and three
incidents on 2026-07-11 came from forgetting it: a feature branch
created inside an agent's worktree instead of the main checkout, the
main checkout's gitignored `app/.env.local` deleted by a cleanup that
thought it was in a worktree copy, and a `pkill -f <port>` that matched
and killed the orchestrator's own shell (exit 144).

- **Every mutating command starts with an explicit `cd <absolute
  path>`** — git branch/commit/checkout, rm, cp-into-place. Never rely
  on where the previous command left you; verification reads are the
  only commands allowed to inherit cwd.
- **`rm`/cleanup only with absolute paths**, and never delete a
  gitignored file by relative name — worktree copies and the real
  checkout's original look identical from inside `app/`.
- **Never `pkill -f <pattern>` where the pattern appears in your own
  command line** (ports, filenames). Kill dev servers by socket:
  `fuser -k <port>/tcp` — it matches the socket owner, not command
  strings.
- If a compound's early `cd` can fail, chain with `&&` so later
  mutations don't run somewhere unexpected — and remember `| tail -1`
  resets exit codes, letting a failed push fall through to the next
  step.

## Budget rules of thumb

- Expensive-model tokens go to prompts + verification, never bulk work.
- One shot per agent; targeted follow-up beats re-dispatch.
- Bound every corpus sweep (named qids, not open-ended heuristics) and
  state the cap in the prompt; the tail becomes the next wave.
- Workflow tool (pipeline/parallel + schemas + adversarial verify) only
  for large content fan-outs (hundreds of items), not task waves like this.
