---
name: gas-city-coordinator
description: Coordinate hpfetcher's Beads-authoritative work through its native Gas City rig. Use when reconciling project work, choosing or inspecting beads, proposing or monitoring delegated work, reviewing delivery evidence, or responding to continue/go/next requests after the Taskmaster-to-Beads cutover. Never treat frozen Taskmaster or Aegis state as active task authority.
---

# Gas City Coordinator

Beads is the sole active task authority. Preserve `.taskmaster/` and `.aegis/`
as frozen historical evidence; never update, repair, regenerate, or re-import
them. The project-local agent owns intent, sequencing, scope, and acceptance.
Gas City supplies delegated execution.

## Native context

Consult `gc-city`, `gc-rigs`, `gc-agents`, `gc-work`, and `gc-dispatch` before
using their corresponding surfaces. The registered rig is `hpfetcher`.

Use the absolute native client with the isolated city home and explicit rig:

```bash
env -u BEADS_DIR -u BEADS_DB \
  -u BEADS_DOLT_SERVER_HOST -u BEADS_DOLT_SERVER_PORT \
  -u BEADS_DOLT_SERVER_USER -u BEADS_DOLT_SERVER_PASSWORD \
  GC_HOME=/home/loucmane/gascity/home \
  PATH=/home/loucmane/gascity/bin:/usr/bin:/bin \
  /home/loucmane/gascity/bin/gc --city /home/loucmane/gascity/city \
  bd list --rig hpfetcher
```

Never trust inherited `BEADS_*` values, use a cross-rig bare `bd`, or infer a
rig from the working directory or bead prefix.

## Boundaries

Require operator confirmation for merge, publishing/deployment, destructive
cleanup, credential actions, and authority changes. A formula, worker result,
review verdict, or green test cannot broaden those boundaries.

Use only exact public entrypoints returned by `gc formula catalog`. Formula
source files, similarly named roles, resolver suggestions, and cached pack
contents are diagnostics, not dispatch authority. If the catalog is absent or
the desired entrypoint is not public, stop before creating workflow beads.

Every native work bead gets an append-forward worklog at
`/home/loucmane/vaults/main/GasCity/hpfetcher/Docs/worklogs/<bead-id>.md`.
Bead free text is vault-bound project content: do not place credentials,
Tier-B evidence, raw provider output, or diagnostic transcripts in it.

## Lifecycle

1. Reconcile the repository, Beads graph, worktrees, sessions, and pull
   requests read-only. Preserve unrelated dirty or untracked work.
2. Select an existing ready hpfetcher bead when it expresses the requested
   work. Create a new rig-scoped bead only when no suitable bead exists.
3. Before dispatch, state the bead, role, formula, worktree/branch behavior,
   checks, worklog, and retained operator boundaries. Dry-run the exact route.
4. Resume the rig only when authorized, then verify actual supervisor/session
   processes rather than trusting the known suspension-status projection.
5. Route the existing hpfetcher bead to the appropriate managed role. Never
   create a cross-rig surrogate or redispatch an existing workflow to wake it.
6. Observe bead, session, branch, checks, mail, and worklog. A hard control
   failure or permission wait is an operator escalation, not a retry loop.
7. Review the exact implementation head independently. Close only with scope,
   test, review, branch, and worklog evidence; otherwise leave the bead open.

Do not dispatch project work while onboarding or authority reconciliation is
still in progress.
