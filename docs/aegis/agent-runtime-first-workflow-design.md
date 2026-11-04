# Agent-Runtime-First Workflow Design (Aegis)

**Status:** authoritative design note · **Audience:** Aegis dev review
**Scope:** Aegis as a reusable *agent-runtime* workflow system (`~/codex`), not an
HP-Coach adoption note. The earlier human-framed draft is retained as
[`hpfetcher-workflow-system-design.md`](./hpfetcher-workflow-system-design.md)
("superseded framing") only as evidence of the wrong frame and the correction.

> **Optimization target (pinned):** Aegis keeps autonomous agents (Claude / Codex /
> native-MCP) honest **before they mutate a real project**. Human friendliness is
> secondary to agent **correctness, resumability, and drift prevention**. The
> "second contributor" is not another human — it is another agent, a cold-resumed
> session, or a `/tmp` clone with **zero shared chat memory**. The only durable
> state carried across sessions is on-disk (`.aegis/`, `sessions/`, `plans/`,
> `docs/ai/work-tracking/`) + git.

> Code line refs below are point-in-time orientation from a read of `~/codex` —
> verify against current source before implementing.

---

## 0. The core correction: Aegis owns the tool boundary, not CI

**Aegis ships no CI.** Therefore "put hard enforcement at CI/PR" is *not an
actionable Aegis design* until Aegis actually builds or installs those boundaries.
The only hard-enforcement surface Aegis owns **today** is the **agent tool-call
boundary** — the `PreToolUse` hook (`gate_lib.pretooluse_gate()`), which fires
before every `Edit/Write/MultiEdit/NotebookEdit/Bash/mcp__*`.

This single fact drives the whole corrected model:

- An agent does its damage **locally** — `git commit`, even `git merge`, in a clone
  that may never push. CI (if the host project has any) is reached *after* hours and
  hundreds of mutations, or never.
- So **pre-mutation enforcement at the tool boundary is load-bearing**, not a
  "soft nudge." CI/PR/merge should become *final truth* eventually (§7), but it is
  **not a substitute** for the tool gate until Aegis owns or installs those
  boundaries.

Everywhere this doc says "defer to CI," it means the *host project's* CI, treated
as an additive convergence backstop — never as the authority an agent's safety
depends on.

---

## 1. The five-layer model (corrected)

1. **Tool/editor layer — pre-mutation guardrails (the surface Aegis owns).**
   Block mutations that aren't task-bound and evidence-current; keep read-only
   inspection cheap and non-blocking.
2. **Task/session layer — minimal durable intent record.** Enough on-disk state for
   cold resume, temp clones, multi-agent handoff, and task binding. Reduced, not
   deleted (§4).
3. **Closeout layer — evidence completeness.** Ordered scope/implement/verify,
   pending-mutation drain, stub flagging, handoff quality. Runs at the task boundary.
4. **PR/CI layer — host repository boundary (not owned yet).** Code-touched ↔
   task-touched, derived counts, branch-carries-task-ID. Real, but the host's, and
   additive.
5. **Merge/reconciliation layer — final status truth.** `done` follows
   merge/git reality, not agent memory (§7). Reachable offline by any agent; host
   CI is only a convergence backstop.

---

## 2. Enforcement matrix (fail-open / fail-closed / warn / allow)

Decisions live in `gate_lib.py::pretooluse_gate()`, driven by `payload_is_mutation()`
and the protected/destructive classifiers. **"fail-open"** = the gate *process
crashing* must not block. **"fail-closed"** = block on any doubt, including gate
error. Only rows 1–2 are `allow`; everything persistent is fail-closed.

| # | Action category | Decision | Agent-runtime justification |
|---|---|---|---|
| 1 | Read-only inspection (`ls`,`cat`,`rg`,`git diff`,`task show/next`) | **allow** (short-circuit *before* readiness) | No mutation = nothing to attribute. Gating burns agent turns and pushes blind mutation. |
| 2 | Test commands (`npm test`,`pytest`,typecheck) | **allow** | Tests *produce* the evidence closeout demands. `--junitxml`/redirects correctly reclassify to row 4. |
| 3 | Normal source edits (`app/**`,`worker/**`) | **fail-closed on readiness; gate does not inspect content** | Core honesty surface. Requires READY (branch + in-progress current-work + session + plan + tracker all on the same task id). *What* the edit says is the host CI's job. |
| 4 | Generated-file writes (`data/*.json`, build output) | **fail-closed (same readiness); don't double-charge tracking** | Bulk regen must be inside a bound task, but per-file pending-tracking enqueue serializes the agent into log-thrash. Fix: a `generated_globs` allowlist → still gated, just not individually S:W:H:E-logged. |
| 5 | Workflow-owned surfaces (`.aegis/**`,`sessions/**`,`plans/**`,`work-tracking/**`) | **fail-closed to direct agent edits; allow Aegis-owned handlers with structured evidence** | A free-hand `Edit` to `current-work.json`/a session forges "in-progress" to pass readiness. **Only sanctioned mutators** — `aegis kickoff`/`log`/`handoff repair`/`closeout`/(future)`plan sync`, via CLI **or** Aegis's own MCP handlers — may write them, and only with structured evidence. (See Task 3 — this must NOT self-deadlock Aegis's own writes.) |
| 6 | Protected files/hooks/settings (`CLAUDE.md`,`.claude/**`, the gate itself) | **fail-closed, hard, no override even on gate error** | Highest-leverage attack surface — rewriting the gate disables all enforcement in one move. `config_change_guard()` re-validates exact matcher/command strings. |
| 7 | Taskmaster status mutations (`set-status`, MCP `set_task_status`) | **fail-closed pre-readiness; one narrow post-closeout allow** | Flipping `done` while local mutations are untracked is the canonical lie. Exception: after `closeout_passed_at` is set AND the pending queue is empty, marking *that same id* done is allowed. |
| 8 | git branch/add/commit/push | **fail-closed (readiness + pending-tracking drained)** | Commit is the first durable externally-visible boundary; it must be on the task branch with zero unlogged mutations or it silently bundles untracked work. |
| 9 | Destructive shell/git (`rm -rf`,`git reset --hard`,`git push -f`) | **fail-closed, also deny-listed in `settings.json permissions.deny`** | No agent "undo intuition"; an errant `rm -rf` on a temp clone destroys hours of unmerged work with no CI ever reached. The one place defense-in-depth (holds even if `gate_lib.py` is unreachable) is mandatory. |
| 10 | MCP tool mutations (unknown/remote) | **fail-closed by default** | Unknown `mcp__*` may mutate a remote the gate can't roll back. Keep "anything not matching a read-only pattern = mutation"; never invert to allow-by-default. |

There is deliberately **no `warn-only` tier for persistent actions.**

---

## 3. Minimal durable-intent record (`current-work.json`)

Re-judged against the real consumers (`readiness.sh`, `closeout`, `doctor`), not a
human dashboard. The prior "~90% deletable" was a human judgment (a human remembers
what they were doing); the real cut is **~55–60%** — the survivors are exactly what a
detached-HEAD / symlink-less / cross-machine clone or a handoff agent cannot
reconstruct.

**MUST-STORE**
- `task.id` — the bind (readiness derives id from branch *and cross-checks* this).
- `task.slug` — binds pending-tracking events; branch→slug is lossy.
- `status` (`in-progress`) — **fail-closed anchor.** Git cannot distinguish "clean
  branch because done" from "clean branch because 3h of edits aren't committed";
  this is the only signal that fires the gate on an in-flight task with zero commits.
- `branch` — detached-HEAD clones have no current branch; the stored value lets a
  clone bind and tells a handoff agent which branch was intended.
- `paths.{session,plan,work_tracking}` — symlinks die in `git archive`/tarball/
  Windows checkout; the `*-ACTIVE` glob fails closed on zero-or-many; stored relative
  paths are the symlink-independent resume index.
- `taskmaster_required` — un-derivable **policy** switch (whether readiness fails
  closed on a missing/stale Taskmaster task). Drop it → silent downgrade to fail-open.
- `closeout_passed_at` — durable proof the *local* closeout gate ran (a green PR does
  not prove this); a handoff receiver reads it to decide resume-vs-ship.
- `local_task` (only when no external task id) — sole durable binding for
  no-Taskmaster work; without it the pending-event matcher has nothing to match.

**CAN-DERIVE** — `task.status` (from `closeout_passed_at`); `integrations.*.detected`
(live `dir.exists()`); `paths.reports` (`work_tracking + "/reports/" + slug`);
`task.title` (session H1 / Taskmaster — *unless* `local_task` is the only record).

**SHOULD-DELETE** — `created_at`/`updated_at` (liveness = `git log -1 --format=%ct` +
pending-event timestamps); `branch.{before,action,created}` (git reflog has it);
`paths.{session_current,plan_current,workflow_templates}` (constants);
`integrations.serena.*` (hardcoded false, never read); per-node `schema_version`
(one stamp per file); `closeout_report` (constant path).

---

## 4. Hard-before-mutation vs deferred

**HARD, synchronously, on EVERY persistent mutation** (`pretooluse_gate`, block =
exit 2), local-files-only — **no network, no MCP** — because an agent reaches CI only
at push:
1. **Readiness == READY** — git worktree + branch matching `task-(\d+)`;
   `current-work.json` id == branch id AND `status == "in-progress"`; if
   `taskmaster_required`, that task `in-progress` in `tasks.json`; `sessions/current`
   + `state.json.current` agree; `plans/current` references the task; exactly one
   `*-ACTIVE` tracker folder; plan↔tracker step alignment.
2. **Pending-tracking queue empty** — forces *incremental* evidence; no "200
   mutations then reconstruct intent."
3. **Boundary/protected check** — `is_protected_path`, `protected_bash_violations`
   (redirect/`sed -i`/`tee`/`cp`/`mv`/python-write), MCP path extraction — refused
   *even when READY*.
4. **Infra-error → block** for mutations (reads return 0 *before* readiness, so a gate
   bug can't brick inspection).

**DEFERRED to closeout** (task boundary): strict evidence verification (no
`pending/searching` placeholders, no stub text), pending re-assert, plan/tracker
scope/implement/verify all complete; sets `closeout_passed_at`; plus *cosmetic*
hygiene (handoff prose, stub flagging). Only **resume-critical** hygiene stays at the
runtime gates — "defer to closeout" is safe *only* because closeout is reached; CI is
not.

**DEFERRED to host PR/CI + merge** (layers 4–5): repository-boundary checks, derived
counts, code-touched↔task-touched, and final status truth = merge reality (§6) —
all additive, none owned by Aegis today.

---

## 5. Break-glass / degraded model

**Fail-open is acceptable ONLY when the gate infrastructure itself fails**
(`gate_lib.py` raises, `python3` missing, hook can't spawn) **AND the action is
non-destructive and non-protected.** A broken gate must not brick inspection/ordinary
edits — but must **never** auto-permit a protected/destructive/unknown-MCP action.

**Live fail-open to fix now:** `pretooluse_gate` returns `0` when `load_payload()` →
`None` (malformed stdin) — a silent allow on a possibly-real mutation. **Fix:** if the
payload is unparseable but raw stdin is non-empty, **block** (can't classify → unsafe).

**Fail-closed, no break-glass:** protected files (row 6), destructive shell/git (row
9), unknown MCP (row 10), any persistent mutation while BLOCKED or with a non-empty
pending queue. No `--force`, no env escape — that flag is exactly what a misaligned
agent reaches for.

**The one allowed degraded path must leave a tamper-evident breadcrumb:**
- Append-only `.aegis/state/degraded-events.json`:
  `{ts, reason:"gate_infra_failure", tool, evidence, gate_exit_code, gate_stderr_sha1, task_id}`,
  written by `record_degraded_event()` from a `try/except` wrapping the gate body —
  which **still blocks** if the action is protected/destructive, allows otherwise.
- **`closeout.no_degraded_events` is AUTHORITATIVE:** a non-empty unacknowledged file
  **fails closeout** at the runtime boundary, regardless of whether any host CI
  exists. Cleared only by re-running `aegis verify --strict` over affected paths, then
  `aegis log --degraded-ack <id>` (CLI-only).
- `_classify_doctor_state` gains `degraded_unreconciled` (health `repairable`) so a
  cold-resuming agent sees the drift without memory.
- A host-CI grep of the merge diff for unacknowledged entries is an **additive second
  check only** — never the sole catch.

The TTL-boxed audited break-glass (`aegis break-glass --reason --ttl 30m`, signed
marker the gate reads and logs per bypass) is the *distinct* legitimate case "the gate
is buggy and blocking real work." Fail-closed by default; every bypass appended to the
audit surface closeout/reconcile read.

---

## 6. Reconciliation model (status ↔ merge/PR truth)

**Current reality (verified):** three status surfaces, **nothing reconciles them
against merge/git truth** — Taskmaster `tasks.json.status`, Aegis
`current-work.json.status` (flipped `completed` by closeout from *local gates only*),
and `local-tasks.json` stubs (minted `in-progress`, **never closed/pruned —
write-only**). **Zero `gh`/PR awareness** exists anywhere. So `completed` today means
"local evidence gates passed, pre-merge," never re-checked against the merge.

**New command:** `aegis reconcile --target-dir . [--apply] [--prune] [--base <branch>]
[--task <id>] [--offline]` — default **read-only** (like `doctor`); writes
`.aegis/reports/reconcile-report.json` in the shared `{schema_version,status,checks,
next_action}` shape. **Merge truth is git-first, gh-second:** offline
`git merge-base --is-ancestor <tip> origin/<base>` + `git branch --merged`; online
`gh pr list --head <branch> --state all --json state,mergedAt,mergeCommit`
(`state==MERGED` authoritative even when `--is-ancestor` is false for squash); last
resort `git log origin/<base> --grep 'task-<id>\b' --merges`. Working-tree guard:
never reconcile a task with `git status --porcelain` non-empty.

| Case | Authoritative signal | Verdict / action |
|---|---|---|
| **merged but not done** | `--is-ancestor` or `gh state=MERGED` | safe forward auto-flip → `done` (+ log `merge_evidence`) |
| **done but no merged PR** | merge truth (negative) | **report only → `done-unverified`**; never auto-downgrade (squash+delete erases the tip). Escalate to fail only if gh online AND PR `CLOSED`-unmerged |
| **in-progress, branch deleted/stale** | branch existence + merge-base | merged → flip done; gone & unmerged → **`orphaned` (blocking)**, recover via kickoff or `--prune`; stale-but-present → warn |
| **multi-PR epic** | per-child merge truth, aggregated | child flips on its own merge; **parent flips only when ALL children done+merged AND parent's own branch (if any) merged**, else `epic_partial`, no parent flip |
| **local/ad-hoc stub** | branch+merge truth for its `task-<id>` | merged → graduate→done; in-progress + branch-gone + unmerged + past retention → `prunable`, removed **only under `--prune`** (deletion never silent) |

**Offline degradation:** git-only covers fast-forward + true merge; a deleted-branch
squash with no `gh` → **fail-closed → `unverifiable-offline`, no flip** (never "assume
merged"). **`done` derivation is reachable offline by any agent** via `git merge-base`;
`gh` and host CI only *accelerate convergence* and are **never on the unblock path**.

**Plug-ins (agent-runtime-first, not CI-only):** closeout stamps a non-blocking
`pending_merge:true` (it legitimately precedes merge); `doctor` surfaces a
`reconcile_drift` state so cold-resume sees drift; a host
`pull_request.closed[merged]` workflow may run `aegis reconcile --apply` as a
**convergence backstop** — the same forward auto-flip any agent reaches locally, never
a boundary an agent is blocked waiting on.

---

## 7. Delete/shrink vs keep-for-agent-correctness

**Delete / collapse (genuinely mirrored — correctness, not surface-reduction):**
1. `task.status` vs `status` vs `closeout_passed_at` — three encodings of one
   lifecycle fact; collapse to `status` + `closeout_passed_at`, derive `task.status`.
2. `integrations.*.detected` — `dir.exists()` re-evaluated live by readiness; the
   snapshot only goes stale.
3. `updated_at` — strictly worse than `git log -1` + newest pending-event timestamp.
4. **Plan-sync hash log** (`.plan_state/sync.log` `plan_hash`/`tracker_hash`) —
   `readiness.sh::check_plan_tracker_alignment` already verifies plan↔tracker
   **semantically** by re-parsing; the hashes add one bit ("a `sync` ran") and a
   hand-edit defeats them while the semantic check survives. **Fold
   `validate_plan_sync` into the semantic check** (one fail-closed, hand-edit-proof
   enforcement). *Caveat:* if any CI job diffs `sync.log`, replace it with the
   semantic check — don't just drop it.
5. `branch.{before,action,created}` — provenance the git reflog already records.

**Keep despite looking like ceremony (an agent cannot reconstruct these):**
`status:"in-progress"` (the fail-closed anchor CI-only cannot cover);
`paths.{session,plan,work_tracking}` (symlink-/glob-independent resume index);
flat `branch` (detached-HEAD clones); `taskmaster_required` (un-derivable policy);
`closeout_passed_at` (local-contract proof); `local_task` + `local-tasks.json`
(only durable binding for no-Taskmaster work); `.plan_state/compaction-history.jsonl`
(the cold-resume entry point after context compaction); `pending-tracking.json` (the
only thing forcing evidence completeness across a kill/resume). Re-judged from the
prior "cut" list, these also **survive** because agents need them: a canonical
`join_key(task_id,slug)` producer+validator (today the join is ad-hoc string-matching;
slug drift silently breaks the next agent's readiness), the single-`*-ACTIVE` /
single-`sessions/current` validator (readiness hard-depends on exactly one), a minimal
3-state liveness classifier (needed by §6), and `archive-stubs` (explicit audited
counterpart to closeout's stub-flag). *Still cut:* a micro-task scaffolding profile
(convenience, not correctness) and generic duplicate-filename linting.

---

## 8. What flipped vs what survived (from the superseded framing)

**Flipped (were human-frame artifacts):** "enforce hard only at CI" → hard at the
**tool boundary** (Aegis owns no CI); "fail open universally" → **narrow + auditable**
(§5); "`current-work.json` ~90% deletable" → **~55–60% shrink** (§3); "defer hygiene to
CI" → resume-critical hygiene stays at runtime gates; "auto-prune stubs at closeout" →
**flag at closeout, delete only under explicit `--prune`**; "plans/sessions only pay
off with a 2nd *human*" → **the 2nd contributor IS another agent / cold-resume / temp
clone**, so durable on-disk intent is *more* valuable, not ceremony; "smaller is
better" → right for a lean consumer, wrong for Aegis-the-runtime.

**Survived:** status-follows-the-merge (still the biggest *missing* capability);
read-only short-circuit; CLI-first recovery (MCP never on the unblock path); audited
break-glass (re-justified on agent mechanics — a blocked agent loops/improvises with
no sanctioned exit — not on human frustration); closeout scope discipline.

---

## 9. First five Aegis Taskmaster tasks

Ordered per dev preference. **Aegis tasks (`~/codex`) — do NOT create these in
HP-Coach.** Nothing here auto-flips status; the read-only/honesty foundation lands
first.

### Task 1 — Block unclassifiable mutating payloads *(safety bug; land first)*
- **What/why:** `pretooluse_gate` returns `0` when `load_payload()` → `None` even
  though raw stdin may describe a real Edit/Write/Bash mutation — a silent fail-open.
- **Acceptance:** non-empty stdin + unparseable payload → exit 2; empty/whitespace
  stdin → exit 0; well-formed read-only and mutation payloads unchanged; block path
  emits a CLI-recoverable hint (no MCP).
- **Test:** fixtures — empty → allow; truncated/garbage JSON → block; valid read-only
  → allow; valid mutation (READY) → allow; a real-shaped-but-corrupted Edit payload →
  block (regression).
- **Deps:** none.

### Task 2 — Short-circuit read-only inspection before readiness *(reliability, safety-neutral)*
- **What/why:** readiness runs even for non-mutating calls; reads mutate nothing.
  Classify first, `return 0` for read-only-and-non-protected before spawning readiness.
- **Acceptance:** `run_readiness` NOT invoked for read-only fixtures, IS for
  mutation/protected; unknown `mcp__*` still defaults to mutation (fail-closed); a
  readiness crash no longer blocks pure inspection.
- **Test:** spy that `run_readiness` is skipped for `git diff`/`rg`; injected
  `run_readiness` that raises → reads still allow, mutations still block.
- **Deps:** land after Task 1 (same `pretooluse_gate` control flow).

### Task 3 — Protect workflow-owned surfaces from *direct* agent edits *(no self-deadlock)*
- **What/why:** add `sessions/`,`plans/`,`work-tracking/` to the protected set so an
  agent can't forge readiness by hand-editing them. **Crucial nuance:** block *direct*
  agent edits (`Edit`/`Write`/redirect/`tee`/`sed -i`…) **but explicitly allow
  Aegis-owned handlers** — `aegis kickoff`/`log`/`handoff repair`/`closeout`/(future)
  `plan sync`, via CLI **or** Aegis's own MCP handlers — to mutate them **with
  structured evidence.** Phrase the gate as *"block direct agent edits to
  workflow-owned surfaces; allow Aegis CLI/MCP handlers to mutate them with structured
  evidence,"* so Aegis does not deadlock its own writes.
- **Acceptance:** direct Edit/Write/redirect into those prefixes → exit 2 regardless
  of readiness; writes via a sanctioned `aegis`/`codex-task` handler (matching the
  mutating-Aegis pattern) → allowed; block emits a hint naming the correct `aegis`
  subcommand (no MCP path); **a real `aegis kickoff`/`log`/`closeout` run end-to-end
  must succeed** (explicit no-self-deadlock test).
- **Test:** `echo > sessions/state.json`, `tee plans/<active>.md`, direct
  `Edit current-work.json` → all exit 2; `aegis log`/`aegis kickoff`/`aegis closeout`
  writing those same paths → pass.
- **Deps:** none functionally; bundle with Tasks 1–2 (all `gate_lib.py` honesty fixes).

### Task 4 — Degraded-event breadcrumb + closeout/doctor enforcement *(narrow auditable fail-open)*
- **What/why:** the one sanctioned fail-open (gate-infra crash on a non-destructive
  action) currently leaves no record. Wrap the gate body in `try/except`;
  `record_degraded_event()` appends to append-only
  `.aegis/state/degraded-events.json`, then **still blocks** if protected/destructive,
  allows otherwise. Local `closeout.no_degraded_events` is **authoritative** (fails
  closeout on any unacknowledged entry, regardless of host CI); `doctor` surfaces
  `degraded_unreconciled`. CI grep is explicitly out of scope here.
- **Acceptance:** infra-failure on benign mutation → event written + allowed; on
  protected/destructive → event written + still exit 2; closeout fails on
  unacknowledged entries; only `aegis verify --strict` + `aegis log --degraded-ack`
  clears (no env/`--force`); file append-only; if the breadcrumb write itself fails, a
  protected/destructive action **still blocks**.
- **Test:** monkeypatch gate body to raise; benign Write → event+allow; protected/
  destructive → event+block; closeout fails then passes after ack; read-only
  `.aegis/state/` → unsafe action still refused. *(Depends on the host re-invoking the
  hook after a crash — note + verify on target.)*
- **Deps:** **Task 1** (degraded mode needs reliable classification first); land after
  Tasks 1–3.

### Task 5 — `aegis reconcile` (read-only, phase 1): merge-truth report
- **What/why:** nothing reconciles the three status surfaces against merge/git
  reality. Add read-only `aegis reconcile` computing merge truth git-first/gh-second,
  emitting `reconcile-report.json` with the five §6 verdicts as **report-only** (no
  status mutation). `done` derivation reachable offline via `git merge-base`; `gh`
  only accelerates; unprovable squash offline → `unverifiable-offline`, no flip.
- **Acceptance:** writes only the report file (no `set-status`, no `current-work`/
  `tasks.json` edits); offline classifies fast-forward + true-merge; deleted-branch
  squash with no gh → `unverifiable-offline`; all five cases produce deterministic
  verdicts in the shared schema; dirty working tree → never reconcilable-to-done;
  CLI-only.
- **Test:** git fixtures for each of the five cases + dirty-tree + gh-offline +
  detached-HEAD clone; assert only the report file changes (before/after dir snapshot).
- **Deps:** depends on Tasks 1–3 (stable, honest gate first); prerequisite for any
  future `--apply` auto-flip. **Swappable with Task 4** by immediate pain: status-drift
  pain → do Task 5 first; hook-brittleness pain → do Task 4 first.

**Landing order:** 1 → 2 → 3 (tool-boundary honesty) → 4 (auditable degraded mode) →
5 (read-only reconcile). Auto-flip and the host post-merge CI backstop are deliberately
deferred until this read-only/honesty foundation lands.

---

## Appendix — operating assumptions

1. Canonical Aegis source is `~/codex`; `/tmp/aegis-task*` are smoke clones;
   HP-Coach is an unrelated consumer.
2. **Aegis ships no CI** — every "CI boundary" is the host project's, not guaranteed
   to exist/run. This drives the §0 correction.
3. "Agent" = autonomous Claude/Codex/native-MCP runtime whose only cross-session
   memory is on-disk `.aegis/`,`sessions/`,`plans/`,`work-tracking/` + git.
4. The host re-invokes the `PreToolUse` hook on the next call even after a prior crash
   (required for the degraded breadcrumb; verify on target).
5. Generated paths are enumerable as globs (else they stay individually tracked).
6. Closed-task ids survive in branch name or PR/merge-commit subject; default base via
   `git symbolic-ref refs/remotes/origin/HEAD`, fallback `main`.
7. Line refs are point-in-time; verify against current source before implementing.
