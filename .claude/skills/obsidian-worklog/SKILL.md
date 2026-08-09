---
name: obsidian-worklog
description: Create and maintain append-forward Obsidian worklogs for native hpfetcher Beads work. Use when a Claude or Codex worker starts, updates, hands off, reviews, or closes an hpfetcher bead. Write only the bead's `GasCity/hpfetcher/Docs/worklogs/` note; never edit generated `Tasks/` projection files or treat vault content as task authority.
---

# Obsidian Worklog

Beads is task authority. The worklog is durable human evidence, not a status
input and never a reverse-sync surface.

Write only:

```text
/home/loucmane/vaults/main/GasCity/hpfetcher/Docs/worklogs/<bead-id>.md
```

Never edit `GasCity/hpfetcher/Tasks/`; `vault-sync` owns that entire generated
tree. Never read `Docs/` to infer bead state—query Beads through the explicit
`hpfetcher` rig.

## Format

Create the note with this current-snapshot frontmatter:

```yaml
---
bead: "<bead-id>"
project: "hpfetcher"
session: "<session-id>"
status: "in_progress"
---
```

Use `# Worklog — <bead-id>` and keep these sections:

- `## Findings` for discoveries and implications.
- `## Decisions` for choices recorded before implementation.
- `## Progress` for mutations and verification, including
  `[S:<session>|W:<bead>|H:<step>|E:<evidence>]` lines.
- `## Handoff` for current state, completed work, blockers, next action, and
  resume context.

The frontmatter may reflect current state. Body entries are append-only. To
correct an earlier entry, append a timestamped entry naming what it supersedes;
never rewrite or erase the prior record.

Do not include credentials, Tier-B evidence, raw provider output, diagnostic
transcripts, or private user data. Reference an owner-only artifact by path or
digest instead. Before closing a bead, ensure the worklog names the exact
implementation head, verification evidence, review disposition, and remaining
operator boundary.
