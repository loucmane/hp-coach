# Hpfetcher Beads Store

This directory identifies the hpfetcher rig's native Beads database. Beads is
the sole active task authority. Historical `.taskmaster/` and `.aegis/` data
remain preserved but are not active task state.

Project agents coordinate through the project-local `gas-city-coordinator`
skill. The project-local agent owns intent, sequencing, task selection, and
acceptance; Gas City owns delegated execution.

## Required routing

Use the absolute native client, isolated city home, and explicit hpfetcher rig
for every Beads operation:

```bash
env -u BEADS_DIR -u BEADS_DB \
  -u BEADS_DOLT_SERVER_HOST -u BEADS_DOLT_SERVER_PORT \
  -u BEADS_DOLT_SERVER_USER -u BEADS_DOLT_SERVER_PASSWORD \
  GC_HOME=/home/loucmane/gascity/home \
  PATH=/home/loucmane/gascity/bin:/usr/bin:/bin \
  /home/loucmane/gascity/bin/gc --city /home/loucmane/gascity/city \
  bd list --rig hpfetcher
```

Never trust inherited `BEADS_*` values and never use a cross-rig bare `bd`.
Every native work bead receives an append-forward worklog. Merge,
publishing/deployment, destructive cleanup, credential actions, and authority
changes retain their operator-confirmation boundaries.
