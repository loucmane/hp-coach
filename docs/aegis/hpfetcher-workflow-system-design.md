> ⚠️ **SUPERSEDED — kept as historical input.** This draft was written under a
> **wrong optimization frame** (a solo ADHD-PI *human* using HP-Coach). That frame
> imported a human cost function (flow, frustration-avoidance) that does not apply
> to an autonomous agent, and it assumed a CI boundary Aegis does not own — leading
> to several inverted conclusions ("enforce only at CI", "fail open universally",
> "`current-work.json` ~90% deletable", "plans/sessions only pay off with a 2nd
> *human* contributor"). It also contained factual misreads (e.g. `work_context` is
> computed inline, not a stored mirror).
>
> **The authoritative model is now [`agent-runtime-first-workflow-design.md`](./agent-runtime-first-workflow-design.md).**
> This file is retained only as evidence of the wrong frame and the correction.

---

# Workflow System Design — drift-resistant task tracking

**Status:** SUPERSEDED discussion draft · **Audience:** dev review
**Purpose:** decide what to build for our task/status-tracking workflow, using the
*aegis* framework (in `~/codex`) as a studied reference — what it gets right, where
it's soft, and the principles we'd build into our own system.

> TL;DR — The best version of this system is *smaller* than aegis, not bigger.
> Almost every worthwhile improvement is **deletion and derivation**, not
> addition. Enforce at the boundary that already exists (commit/PR/CI), make
> status a *derived fact* (the merge, not memory), keep one source of truth per
> fact, and **fail open** so the tooling can never lock you out of your own editor.

---

## 0. Why this document exists

We hit real task-tracking **drift** on this project:

- We use Taskmaster (`.taskmaster/tasks/tasks.json`). It currently reads **18 done /
  40 pending / 2 deferred / 1 cancelled** of 61 parent tasks (+265 subtasks, 5 done).
- But **most recent work shipped *outside* Taskmaster** — cross-device sync, scaling,
  auth hardening, an entire design-system pass, sign-in — none of it ever became a
  task. So Taskmaster severely *undercounts* what actually shipped.
- **Statuses go stale** (a task sat `in_progress` whose code had clearly merged).
- **Derived counts go stale** (a doc said "4 done" when reality was 18).
- We effectively run **two parallel task systems** (Taskmaster + the agent's
  in-session task list) that never reconcile.

A hand-maintained status file is a stopgap that will itself drift. So we studied a
real framework built specifically to make drift *mechanically impossible*, and asked:
what should we actually build?

---

## 1. The drift problem, precisely

Four failure modes — any system we build has to answer all four:

| # | Failure mode | Root cause |
|---|---|---|
| 1 | **Untracked work** — whole subsystems ship with no task | Nothing forces work to *start* from a task; branch + edits + commits happen with zero task binding |
| 2 | **Stale status** — task `in_progress` but code merged | Flipping to `done` relies on *remembering* to |
| 3 | **Stale derived counts** — "4 done" when it's 18 | A count is **hand-stored** in prose; any hand-stored number rots |
| 4 | **Two parallel systems** — never reconciled | Two write surfaces with no shared join key |

---

## 2. How aegis works (the reference design)

Aegis is a self-installing AI-agent workflow framework. Its thesis: **the mutation
surface is the chokepoint** — an agent can't edit/commit/run a write-command unless a
single task ID is threaded through branch, session, plan, tracker, and work-folder;
and after each mutation it can't proceed until it logs. Everything else (counts,
next-action, status) is **derived from files, never hand-stored**.

**Mechanisms:**
1. **PreToolUse gate** — refuses any mutating tool (`Edit|Write|Bash|mcp__.*`) unless
   a *readiness* state holds: branch + an `in-progress` Taskmaster task +
   `sessions/current` + `plans/current` + exactly one `-ACTIVE` work-folder, all on
   the same task ID.
2. **PostToolUse capture** — each mutation is recorded to `pending-tracking.json`; the
   *next* mutation is blocked until `aegis log` runs.
3. **`aegis log` fan-out** — one canonical `[S|W|H|E]` string is written to
   session + tracker + plan + CHANGELOG + IMPLEMENTATION + HANDOFF at once.
4. **Stop gate** — refuses session-end while pending tracking is non-empty.
5. **Derived counts** — recomputed from `tasks.json` on every CI run; never stored.
6. **`aegis closeout`** — terminal gate before a task flips to `done`.

**The join key:** one composite identity `task<ID>-<slug>` (Taskmaster numeric ID as
primary join) threaded redundantly through branch, filenames, frontmatter, and
evidence tags, so a guard can cross-check the surfaces against each other.

This is a genuinely good design. It makes failure mode #1 (untracked work) nearly
impossible and #3 (stale counts) structurally impossible.

---

## 3. Where aegis is soft (its conceded gaps)

A deep read of the implementation surfaced these — they're the seeds of every
improvement below. Line refs are from a point-in-time read of `~/codex`; treat as
orientation, verify before acting.

- **Status-truth gap (the big one).** The actual `done` flip is a *manual agent
  action* — not gated by the chokepoint. `closeout` only mutates aegis's own
  `current-work.json` (`_aegis_installer.py:~4660`); it never writes `tasks.json`. No
  code anywhere reads a PR or `merged_at`. So the system has **zero visibility into
  the one event that means "shipped"** — the merge. This is exactly failure mode #2.
- **Fragility / lockout.** The gate fails **closed** when readiness itself crashes
  (`gate_lib.py:~830`), and it gates *every* tool including read-only `Bash`
  (`ls`, `git diff`, `pnpm test`). A bug in the gate during an outage locks you out
  of your own editor, with the only escape being to strip the hook — which a config
  guard actively fights, so when you win, the gate is gone *permanently*.
- **Stub sprawl.** The readiness escape hatch ("quick-create a stub to keep working")
  becomes the default under flow pressure. `local-tasks.json` is the sink, and
  *nothing ever transitions a local stub to done or prunes it*. Untracked work
  becomes **garbage-tracked** work — honest in count, meaningless in substance.
- **Duplicated state ledgers.** `.plan_state` hash-pins plan vs tracker
  (`validate_plan_sync`, a 328 KB append-only log) — but readiness already does a
  *semantic* comparison of the same statuses. `current-work.json` is ~90% derivable
  from the branch + Taskmaster (readiness's own fallback proves it). Much bespoke
  state re-encodes what git/PR/CI already know authoritatively.
- **Join-key hygiene (aegis concedes this).** One ID appears in 4+ incompatible
  surface forms (`feat/task-{id}` vs `task{id}` vs `task_{id:03d}.txt`), held together
  by permissive regexes agreeing *by luck*. The first edge case where two disagree is
  silent cross-linking, not a clean error.
- **Ceremony.** A 6-file fan-out per task is coordination overhead built for a
  multi-agent fleet; heavy for a solo or small team.

---

## 4. Principles for the system we build (the heart of this doc)

Four principles, each with the *why* and the aegis evidence.

### I. Enforce at the boundary that already exists; only *nudge* at the editor

Aegis's deepest design choice — and, we think, its main error — is putting the teeth
in a `PreToolUse` hook that gates **every** tool. That makes the gate a per-keystroke
tax you're trained to resent, and the first time it blocks a hotfix you strip it — and
then enforcement is **zero**.

The **commit / PR / CI boundary already exists and can't be ripped out in a moment of
frustration.** Put the *hard* checks there:

- a PR that touches `app/`/`worker/` on a branch with no task ID, and no `tasks.json`
  transition, **fails CI**;
- counts are regenerated in CI and a stale committed copy **fails CI**.

Make any editor-level hook a *soft, fail-open reminder* ("no task in progress —
kickoff?"), never a blocker. This is architectural; you can't retrofit it cheaply, so
decide it up front.

### II. Status follows the PR, not memory

Failure mode #2 exists because `done` is a *remembered* action while the ground truth
— the merge — sits in git, unread. Make the merge the trigger: **branch carries the
task ID → PR merges → task auto-closes.** `done` becomes a *derived fact*, exactly how
aegis already treats counts.

Ship the read-only **reconciliation report first** (zero blast radius), then auto-flip:
- `SHIPPED-UNFLIPPED` — merged but `tasks.json ≠ done` (the target bug)
- `FLIPPED-UNSHIPPED` — `done` but no merged PR (premature flip)
- `ABANDONED-INPROGRESS` — `in_progress` whose branch was merged/deleted long ago

The discriminator that separates "legitimately still working" from "shipped, forgot to
flip" is **"is the branch still alive?"** — git answers that authoritatively.

### III. Derive from existing truth; don't mirror it

Every file that stores a branch name, a status, or *a hash of another file the system
itself created* is a shadow of an authority that already exists (git, Taskmaster, the
PR) — and buys only a new drift surface plus a validator to police it. Aegis hash-pins
two files it created itself to detect their drift; it stores `work_context` *and*
recomputes it identically in four places (stored + re-derived = guaranteed drift).

Delete the mirrors; derive from `branch + Taskmaster + git diff + merged PR`.

**The scalpel** (so this doesn't over-fire): keep a stored value only if it's a
*witness of a past reconciliation you diff against*; delete it if it's a *cache of
current state*. Genuine residue that can't be derived — declared policy, authored
*intent* (the "why" of a change), a pause stack — stays, and it's small.

### IV. Friction only where it protects something

Tax `ls`/`pnpm test` → you train yourself to strip the gate. Scaffold six files for a
one-line fix → you train yourself to bypass capture. Keep **capture frictionless**;
move **hygiene** (scope, title, reconciliation, closing orphan stubs) to **closeout /
CI**, where there's full context and no flow pressure.

---

## 5. Concrete improvements, ranked "better-not-bigger"

The set worth shipping — each one *removes* a failure mode or *deletes* code. Aegis
line refs are orientation only.

| # | Change | Why | Size |
|---|---|---|---|
| 1 | **Fail open on infra failure** — wrap the gate in try/except + a 5 s timeout; "gate couldn't run" → warn-and-allow + a CI-asserted `degraded` breadcrumb | Removes the *worst* lockout — punished for the tool's own bug, no recourse but deletion. The event that permanently strips the framework. ~50 lines. | S |
| 2 | **Short-circuit read-only commands** — run readiness only `if is_mutation`; never gate `ls`/`git diff`/`pnpm test` | Deletes hot-path work (3–4 forked subprocesses per read-only call); kills the latency resentment that motivates stripping | S |
| 3 | **Stop-gate degrades** — try/except, honor an explicit bypass, auto-allow stale events from a crashed prior session | "I can't end my session" is the one block with no workaround | S |
| 4 | **CLI-first unblock; MCP off the critical path** — remediation never depends on a long-running server; verify the CLI shim at install | A recovery path that depends on a separate process is a single point of failure for *getting unblocked* | S |
| 5 | **Delete the hash-pin log + stored `work_context`/`current-work.json` mirrors** | This is where the system gets *lighter* — removes a 328 KB log, a validator, and fields already derivable from branch+Taskmaster | M |
| 6 | **Read-only reconciliation report**, wired into CI | Surfaces status drift with zero blast radius; validates the join logic before anything auto-flips | S |
| 7 | **Sanctioned, audited, TTL-boxed break-glass** (`BYPASS --reason`, logged, surfaced in the PR) | Devs *will* bypass under pressure; the only choice is sanctioned-and-recorded vs. unsanctioned-and-permanent. Move the teeth to the visible CI signal | S |
| 8 | **Merge-triggered `done`** — capture PR number at create; reconcile resolves branch→merged-PR→`set-status done` for the task in the branch name; warn if `gh` offline | Makes the headline fact a *derived* one keyed on the only unforgeable "shipped" signal; deletes a ledger | M |
| 9 | **Closeout forces scope + prunes stubs** — reject placeholder-titled local stubs, require ≥1 scope event, write status back | Closes the orphan-stub leak at the one point with full context; keeps *capture* frictionless | M |

**Cut as gold-plating** (and *why* — this is the lesson): a canonical-`join_key()`
producer + two validators, a duplicate-filename validator, a four-state "liveness
classifier," a second `micro-task` scaffolding profile, an `archive-stubs` command.
**Every one of them adds a command or validator to police redundancy that a deletion
elsewhere should have removed** — answering "too many surfaces" with "one more surface
to check the surfaces." That's the signature of gold-plating in a system already
accused of being over-built. If you're adding a checker to keep two things in sync,
delete one of the two things instead.

---

## 6. If we build our own — recommended shape

A system with aegis's drift-resistance and none of its lockout fragility or ceremony:

1. **Single source of truth:** Taskmaster `tasks.json`. The agent's in-session list is
   a scratchpad with no durable authority.
2. **Join key:** the **branch name carries the task ID.** That one convention *is* the
   "one identity" idea — free, enforced by git, no producer/validator machinery.
3. **Hard enforcement at CI** (the boundary you already cross): code-touched ⇒
   task-touched; counts regenerated & diff-checked; reconciliation report run.
4. **Status from the merge:** PR merge → auto-close. Reconciliation report first.
5. **Soft nudge at the editor** (optional, *non-blocking*, fail-open) — only once 3–4
   prove insufficient.
6. **Counts/next-action always computed**, never stored. Delete every hand-typed
   number from docs.
7. **One-time backfill:** create tasks for the already-shipped arc so the count starts
   honest.

**Suggested sequence:** (a) computed counts + CI count-check → kills #3 today;
(b) branch-carries-task-ID + CI task-binding guard → kills #1 at the boundary;
(c) reconciliation report → exposes #2; (d) merge-triggered auto-close → kills #2;
(e) demote the second list → kills #4. Heavy aegis machinery (editor hooks, the MCP
server, plans/sessions/work-folders) only earns its weight when a **second
contributor** appears — that's the condition under which its coordination cost turns
positive.

---

## 7. Open questions for the dev

1. Do we adopt aegis-the-framework and *patch* its soft spots (§5), or build the lean
   §6 system that borrows its principles? (Our lean recommendation is §6; aegis is the
   reference, not necessarily the dependency.)
2. Is "status follows the merge" the right call for work that spans many PRs, or do we
   need a coarser "epic" task above the per-PR tasks?
3. Where's the line on editor-level nudges — never, or a soft fail-open reminder?
4. CI guard false-positives (dep bumps, formatting, generated files touch code with no
   "real" task) need an allowlist. How generous before it reopens failure mode #1?
5. What's *our* "second contributor" trigger for adopting the heavier machinery?

---

*Sources: two multi-agent analyses of `~/codex` (aegis) — its anti-drift model +
adoption design, and a code-grounded improvement review. Line refs are point-in-time;
verify against current source before implementing.*
