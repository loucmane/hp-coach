# HP-Coach — Session Zero Capsule reference deployment

> Companion to the generic spec `docs/aegis/AEGIS_CAPSULE_SPEC.md` (codex repo). That spec is
> mechanism-only; this doc holds every HP-Coach-specific binding. Lives in THIS repo
> (suggested home: `docs/aegis-capsule-deployment.md`) because repo configuration belongs in
> the repo it configures. Authored 2026-06-10.

## Role

HP-Coach is the **reference deployment**: dogfood site, acceptance environment for §8 of the
spec, and origin of the program's evidence corpus (the 2-day enforcement measurement, the
6-agent state scan, the advisory-mode decision stream). It opts into each capsule PR
explicitly; a bad slice rolls back here without touching Aegis core.

## Current deployment state (as-of 2026-06-10)

- Aegis enforcement: **advisory** (set 2026-06-10T13:08Z, "product work; program Phase 0").
- Claude Code CLI: 2.1.170 (clears every min-version in the spec, incl. ≥2.1.163).
- Installed `gate_lib.py` drifts from the assets copy → the PR-1b rollout here REQUIRES the
  `aegis plan-install` → `aegis install --apply` upgrade run (spec §1.1), as do PR-2b and PR-4.
- Known noise source: the post-#73 `sessions/state.json` vs `current-work.json` split-brain
  still generates `would_block readiness_blocked` advisory records on every mutation. This is
  retained deliberately as false-positive evidence; PR-4's retirement removes its source.

## `.aegis/brief.json` bindings

```json
{
  "gates": {
    "app": {
      "typecheck": ["cd app && pnpm typecheck", "pnpm -C app typecheck", "pnpm --dir app typecheck"],
      "lint":      ["cd app && pnpm lint",      "pnpm -C app lint",      "pnpm --dir app lint"],
      "test":      ["cd app && pnpm test",      "pnpm -C app test",      "pnpm --dir app test"],
      "build":     ["cd app && pnpm build",     "pnpm -C app build",     "pnpm --dir app build"],
      "e2e":       ["cd app && pnpm test:e2e",  "pnpm -C app test:e2e"]
    },
    "worker": {
      "typecheck": ["cd worker && pnpm typecheck", "pnpm -C worker typecheck"],
      "lint":      ["cd worker && pnpm lint",      "pnpm -C worker lint"],
      "test":      ["cd worker && pnpm test",      "pnpm -C worker test"]
    }
  },
  "source_roots": ["app/", "worker/", "pipeline/", "parser/", "frameworks/", "data/"],
  "thresholds": { "branch_count": 30, "unignored_file_mb": 5 },
  "redact_extra": [],
  "archive_keep": 20,
  "inject": true
}
```

Notes: `branch_count: 30` will flag immediately — the repo currently has 94 local branches;
that is the threshold working, not misconfigured. `pnpm deploy:*` and `db:apply:*` are
deliberately NOT gates (deployment commands are delivery events, not verification).

## `.aegis/capsule/risk-seed.json` (consumed once at first compile)

Five standing hazards mined from the 2026-06-10 state scan (each with discovered_at
2026-06-10, evidence = scan artifact + file:line, and a supersede condition):

1. **sync-direction hazard** — `data/parsed/` is staler than `app/public/data/` on all 27
   exams (DTK prompt recovery lives only in public); running `app/scripts/sync-dataset.sh` as
   documented clobbers shipped content. Supersede: back-port commit or script re-point merged.
2. **Ungated dev routes in prod bundle** — `/drill-bake-off`, `/explanation-bake-off`,
   `/dev`, `/dtk-browser`, `/drill-style-a/b/c` reachable by any authed user. Supersede:
   dead-route cleanup PR merged (closes Taskmaster #74/#76 scope).
3. **devLogin staging exposure** — `POST /api/dev/login` unauthenticated, outside the rate
   limiter, mints real Clerk sign-in tokens when `DEV_LOGIN_EMAIL` is set. Supersede:
   throttle added or env var confined to local `.dev.vars`.
4. **1380 explanations with `framework_id: null`** (mostly verbal sections) awaiting the
   tagging-wave decision. Supersede: owner decision recorded.
5. **~/.claude memory staleness** — memory still claims "Phase B 3535/4320 parsed, 205
   figures" vs 4204/214 reality. Supersede: memory file corrected.

## `.gitignore` rider (PR-1b install run)

Add: `.aegis/`, `sessions/`, `plans/`, `.taskmaster/state.json`. Motivating incident: the
36 MB `.aegis/reports/observation-report.json` is currently one `git add -A` from the repo.

## Companion retirement PR (PR-4 stage — only after dogfood gate)

- Retire `sessions/` + `plans/` scaffolding (and the stale `plans/current` pointer).
- STATUS.md: strip computed-facts sections ("Now", shipped tables); keep or fold
  open-decisions/direction into `decisions_pending_owner` (owner's call at that point).
- CLAUDE.md: remove the task-count sentence and workflow liturgy the compiler now owns;
  remove the obsolete restart-after-init instruction; point to `.aegis/capsule/current.md`.
- Decide `docs/ai/work-tracking/` fate: commit as frozen history or delete (it is currently
  untracked either way).
- Resolve the #73 split-brain state pair as part of removing its surfaces.

## Acceptance bindings (spec §8)

- Negative-space case (item 3): **worker × lint** is the designated probe — it has a real
  history here (a Biome format error sat invisible in committed code precisely because no
  lint run was on record since commit `6a898ba`).
- Stranded-flip case (item 2): replays the #73 incident shape (tasks.json flip with no
  containing commit).
- Falsifier baselines (item 6): 30–50 reconnaissance tool calls on a normal cold start;
  378k tokens / 147 tool calls when document trust collapsed entirely (2026-06-10 scan);
  advisory-day echo: ~51 of ~133 decisions were split-brain would_block noise.
- A/B assignment: per-session `session-hash` per the spec §7 amendment (owner-approved
  2026-06-11; supersedes the original calendar-day alternation), with a fixed-n stopping
  rule: the Loop-3 keep/kill decision point is 15 genuine cold starts per arm
  (`source=startup` only; resumes don't count). Owner override allowed
  (`ab_assignment` in `.aegis/brief.json`). Roughly half of cold starts will have
  `capsule_injected: false` — that is the off-arm working, not a bug.

## Delivery witness bindings (PR 3.5)

- **Required-check wiring:** `aegis witness` runs as a GitHub Actions job named
  `aegis-witness` and MUST be added to branch protection's required checks. Critical local
  interaction: this repo's `auto-merge` label workflow squash-merges as soon as required
  checks pass — a witness that is wired but *not required* would be silently bypassed by
  auto-merge. Required-check status is the enforcement; the Action alone is not.
- **Scope inference source:** the branch convention already in use here is the primary signal
  — `feat/task-NN-*` (e.g. `feat/task-73-p0-poisoned-resume-fallback` → Taskmaster #73).
  Fallbacks per spec §2.1 (in-progress task, PR-body task line).
- **Scope path defaults by task type:** app tasks → `app/`; worker tasks → `worker/`;
  corpus/pipeline tasks → `pipeline/`, `parser/`, `data/`, `app/public/data/`,
  `app/public/explanations/`; docs tasks → `docs/`. A task touching outside its globs is
  exactly what check 2 exists to surface — widen the scope record deliberately, don't pre-widen
  the defaults.
- **Known seed case for acceptance item 8:** the #73 incident shape (tasks.json done-flip
  with no containing commit) is this repo's canonical witness-check-4 reproduction.

## Out of scope for this doc

Mechanism, schemas, hook wiring, budgets, kill criteria — all owned by the spec. If something
here contradicts the spec, the spec wins and this doc is the thing to fix.
