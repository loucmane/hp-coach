<!-- AEGIS:BEGIN agents-runtime -->
# Agents

This project is managed by Aegis Foundation.

- Primary agent: `claude`
- Enabled adapters: `claude`
- Shared contract: `.aegis/contract.md`
- Agents may read `.aegis/` directly.
- Agents must not write `.aegis/` directly; use Aegis MCP tools or the project-local Aegis CLI.
- Aegis MCP/CLI is the workflow control plane. Use native agent tools for normal source edits, test runs, and git inspection.

## Continuation

Continuation contract: a short intent (continue / go / proceed / next / resume) advances the Aegis workflow by exactly ONE safe step — resolved from `aegis next` (its `next_safe_action`), never from memory — then re-consult. It is not new authority. Surface and ask before repairs (`aegis repair --apply`), non-dry-run `closeout`, protected/owned paths, switching tasks, or push/PR. Never automatic: merge, force-push, history rewrite, `.aegis/` writes, BLOCKED-readiness bypass, skipping S:W:H:E. "Finish this" still stops at these boundaries. Full text in `.aegis/contract.md`.
<!-- AEGIS:END agents-runtime -->

---

## Existing Agent Instructions

# Agents

This project is managed by Aegis Foundation.

- Primary agent: `claude`
- Enabled adapters: `claude`
- Shared contract: `.aegis/contract.md`
- Agents may read `.aegis/` directly.
- Agents must not write `.aegis/` directly; use Aegis MCP tools or the project-local Aegis CLI.
- Aegis MCP/CLI is the workflow control plane. Use native agent tools for normal source edits, test runs, and git inspection.

---

## Active Project Coordination

This section supersedes every historical Aegis/Taskmaster task-selection and
continuation instruction above.

- Beads is the sole active task authority. `.taskmaster/` and `.aegis/` are
  frozen historical inputs: preserve them, but never update, repair,
  regenerate, or re-import them.
- The project-local agent owns intent, sequencing, task selection, scope, and
  acceptance. Gas City is the delegated execution layer.
- Consult `gc-city`, `gc-rigs`, `gc-agents`, `gc-work`, and `gc-dispatch`, then
  use the project-local `gas-city-coordinator` skill.
- The registered rig is `hpfetcher`. Use `/home/loucmane/gascity/bin/gc` with
  `GC_HOME=/home/loucmane/gascity/home`, the full inherited `BEADS_*` scrub,
  and explicit `--rig hpfetcher` routing for every Beads operation.
- Never use a cross-rig bare `bd`. Every native work bead receives a worklog at
  `GasCity/hpfetcher/Docs/worklogs/<bead-id>.md` in the classified vault.
- Merge, publishing/deployment, destructive cleanup, credential actions, and
  authority changes each retain their operator-confirmation boundary.
