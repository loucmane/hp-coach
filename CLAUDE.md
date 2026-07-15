<!-- AEGIS:BEGIN claude-runtime -->
# Claude Runtime Entry

This project uses Aegis Foundation with Claude as an adapter.

Before persistent mutation, Claude must be in a READY state:

```bash
bash .claude/scripts/readiness.sh --quick
```

If this project is not initialized yet, run:

```bash
aegis init
```

If this `aegis init` created or changed `.claude/settings.json` or `.claude/scripts/*`, stop before source edits and restart Claude Code in this project. Claude loads hooks at session start; after restart, run `aegis next` and continue.

If readiness is BLOCKED because no current work exists and `.taskmaster/` is present, use Taskmaster as the task authority first:

```bash
task-master next
task-master show <id>
aegis kickoff --task <id> --slug <slug> --title "<title>"
```

Taskmaster done only after Aegis closeout and doctor pass.
After marking Taskmaster done, refresh generated task files with the project helper when present; otherwise run `task-master generate` deliberately and mention that broad refresh in the final report.

If no Taskmaster numeric task is available, infer a short task title from the user's request and start tracked local work with:

```bash
aegis start "<task title>"
```

If `aegis` is not on PATH, use the installed project-local shim: `./.aegis/bin/aegis ...`.

Project hooks route mutation tools through `.claude/scripts/pretooluse-gate.sh`.

Tool routing:

- Use Aegis MCP tools for Aegis workflow state when they are available: inspect, status, next, plan_install, install, start, kickoff for explicit external numeric task ids, log, verify, closeout_ready, closeout, and future reconciliation.
- If Taskmaster is installed and has available work, run `task-master next` and `task-master show <id>` or the Taskmaster MCP equivalent before `aegis kickoff`.
- Use `aegis init` for first-time project setup and `aegis start "<task title>"` for local task kickoff only when no external task id exists.
- Use `aegis ...` or `./.aegis/bin/aegis ...` for the same workflow operations when MCP is unavailable.
- Use native Claude tools for normal implementation work: reading files, editing source, running tests, and inspecting git status or diffs.
- Do not use MCP as a replacement for normal source editing. The installed hooks enforce the workflow around native tool use.
- If `aegis.init` or `aegis.install` reports `client_reload.required=true`, restart Claude before any source edits; then run `aegis next` after the reload.

Normal feature-work loop:

1. Confirm readiness. If Aegis is missing, run `aegis init`. If no current work exists, run `aegis next` or `./.aegis/bin/aegis next`; use Taskmaster next/show plus `aegis kickoff` when Taskmaster provides a numeric task, otherwise infer a task title and run `aegis start "<task title>"`.
2. Record scope with `aegis log --handler claude:scope --evidence <scope-doc-or-file> --note "Confirmed task scope" --plan-step auto --plan-status completed`.
3. Make the task-scoped source change requested by the user with native Edit/Write tools.
4. After the hook records pending tracking, run `aegis log --pending-id current --note "<past-tense note>" --plan-step auto --plan-status completed`.
5. Run task-specific verification and log it with `--plan-step auto --plan-status completed`.
6. Run `aegis verify --strict` or `./.aegis/bin/aegis verify --strict`, then log the strict verification pending event with `aegis log --pending-id current --note "Recorded strict verification evidence" --plan-step auto --plan-status completed`.
7. Run `aegis closeout --dry-run --update-handoff` or call MCP `aegis.closeout_ready` before final closeout.
8. If handoff semantic gates fail, run `aegis handoff repair` or call MCP `aegis.handoff_repair apply=true`, then re-run closeout readiness.
9. Run `aegis closeout --update-handoff` or `./.aegis/bin/aegis closeout --update-handoff`; do not report the task complete until closeout passes.
10. Run read-only `aegis doctor --target-dir .` or call MCP `aegis.doctor` once after closeout; include the health result in the final report.
11. If Taskmaster is in use, run `task-master set-status --id=<id> --status=done` only after closeout and doctor pass. Then refresh generated task files with `python3 scripts/codex-task taskmaster generate-one --id <id>` when that project helper exists; otherwise run `task-master generate` deliberately and report the broad refresh.

After any mutation, use `aegis log --pending-id <id> --note "<past-tense note>" --plan-step auto` before attempting the next mutation. Use explicit `--handler`, `--evidence`, and explicit plan step only when no pending event exists or auto inference reports ambiguity.
Read `.aegis/contract.md` for the shared contract and access policy.

## Continuation

Continuation contract: a short intent (continue / go / proceed / next / resume) advances the Aegis workflow by exactly ONE safe step — resolved from `aegis next` (its `next_safe_action`), never from memory — then re-consult. It is not new authority. Surface and ask before repairs (`aegis repair --apply`), non-dry-run `closeout`, protected/owned paths, switching tasks, or push/PR. Never automatic: merge, force-push, history rewrite, `.aegis/` writes, BLOCKED-readiness bypass, skipping S:W:H:E. "Finish this" still stops at these boundaries. Full text in `.aegis/contract.md`.
<!-- AEGIS:END claude-runtime -->

---

## Existing Project Instructions

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

HP-Coach: a coaching tool for the Swedish högskoleprov (HP). Differentiator: zero-knowledge curriculum + ADHD-PI-friendly UX, targeting 2.0 (perfect score).

## Source of truth

For product decisions, architecture, and scope, read **`.taskmaster/docs/prd.txt`** first. It owns:

- Vision and audience (§ 1)
- Design pillars (§ 2): zero prior knowledge, target 2.0, neurodivergent-friendly UX
- Three-layer pedagogical architecture (§ 3): Layer 1 frameworks → Layer 2 explanations → Layer 3 adaptive logic, plus Layer 4 synthetic generator (§ 5.15) and § 5.16 lesson content pipeline — **both § 5.15 and § 5.16 are DEFERRED (not built); see the dated status notes in those PRD sections and the repo-layout note below for what shipped instead**
- Screen-by-screen UX flows (§ 4)
- Functional + non-functional requirements (§§ 5–6) — Cmd+K palette is a hard requirement (§ 6.4)
- Technical stack (§ 7): Vite + React 19 + TS + Tailwind v4 + shadcn/ui frontend on **Cloudflare Pages**; **Hono on Cloudflare Workers** API; **Cloudflare D1** (SQLite-at-edge) via Drizzle ORM; **Clerk** for auth (MFA / passkeys / WebAuthn); R2 for object storage; KV for rate limits. *Architecture pivoted 2026-05-07 from local-first OPFS — multi-device sync is now a hard product requirement.*
- Phase plan (§ 8)
- Open questions and risks (§ 9)
- MVP acceptance criteria (§ 10)

For tracked work, see `.taskmaster/tasks/tasks.json` (79 parent tasks: 52 done, 1 cancelled, 9 deferred, 17 pending as of 2026-06-11). Use the taskmaster MCP tools (`get_tasks`, `next_task`, `get_task`, `expand_task`, `set_task_status`) rather than editing the file by hand. *(Description / dependency edits and adding new tasks still require hand-editing tasks.json — the MCP only exposes status changes and PRD re-parsing.)*

Persistent memory across Claude sessions lives in `~/.claude/projects/-home-loucmane-dev-hpfetcher/memory/` — see `MEMORY.md` for the index. Notable: user profile (ADHD-PI, dogfood user, target 2.0), design pillars, pedagogical architecture, language and batching conventions.

## Repo layout

```
hpfetcher/
├── bygg_hp_databas.py            # PDF scraper (existing, complete)
├── hp_databas.json               # scraped raw text from 27 exams (~2.7 MB; data, not artifact)
├── parser/                       # planned, Phase 0–2
├── frameworks/                   # Layer 1 JSON (planned, Phase 1)
├── pipeline/
│   ├── explanations/              # Layer 2 (per-question explanations; shipped, all drillable questions)
│   └── frameworks/                # Layer 1 extraction (shipped)
├── data/                         # parser output (uploaded to R2 in production)
├── app/                          # frontend → Cloudflare Pages (Vite + React)
├── worker/                       # API → Cloudflare Workers (Hono + Drizzle on D1)
└── docs/                         # design docs (e.g. curriculum-scheduler.md, written before Phase 3)
```

**PRD §§ 5.15–5.16 (Layer 4 synthetic generator, lesson content pipeline) are DEFERRED — not built.** `pipeline/synthetic/` and `pipeline/lessons/` do not exist; Taskmaster tasks 40, 46–50 carry status `deferred`. Two look-alikes shipped instead, neither of which implements these specs:
- **Lektion surface** (`app/src/routes/lektion.tsx`): renders Layer-1 framework JSON directly ("framework-as-lesson") — no LLM generation, no teach-back gate. The route's own header comment says so.
- **Provpass "Genererat pass"** (`app/src/lib/mock.ts`): composes a quota-matched pass from existing *authentic* questions, least-seen-first — not LLM-generated synthetic questions. "Synthetic" here names the pass-composition mode, not Layer 4.

See the dated status notes in PRD §§ 5.15–5.16 for detail. The sections remain valid future scope.

## Running the scraper

```bash
source venv/bin/activate
pip install requests pdfplumber  # if missing
python3 bygg_hp_databas.py        # resumable — already-fetched files are skipped
```

The scraper is data-driven from the `CATALOG` dict in `bygg_hp_databas.py`. Add new exams there; the rest of the script handles them.

## Non-obvious things to know

- **URL typos in `CATALOG`** (`Hogksoleprovet`, `Hogkoleprovet`, `Hogskolepovet`) are *intentional* — they match real allakando.se filenames. Don't "fix" them.
- **`hp_databas.json` is data, not a build artifact.** Don't delete unless you intend a full ~30-min re-scrape.
- **Failed scraper downloads** are stored as bracketed error strings (`"[HTTP 404: ...]"`); these are truthy and won't auto-retry on rerun. Delete the relevant entry from the JSON to force a retry.
- **Parser output goes to `data/hp_question_bank.json`** — never overwrite `hp_databas.json`.
- **Test parsers on `var-2026` first** before running across all 27 exams (Phase 0 milestone).
- **ELF data completeness varies** — older exams may have incomplete ELF section text due to the 1-week post-exam embargo at scrape time (PRD § 9.8).
- **`exam_id` format**: `var-2026`, `host-2025`, `var-2022-1`/`var-2022-2` (years with multiple sittings), `host-ver1-2019`/`host-ver2-2019` (years with multiple versions).

## Section codes (HP exam structure)

Two halves, ~160 min and 80 questions each.

**Verbal:** ORD (synonyms, 40q), LÄS (Swedish reading, 20q), MEK (sentence completion, 20q), ELF (English reading, 20q).

**Quant:** XYZ (algebra, 12q), KVA (quantitative comparisons, 12q), NOG (data sufficiency, 12q), DTK (data interpretation with diagrams/tables/maps, 12q).

Score: 0.0–2.0 per half; total = mean of halves; 2.0 is perfect, 1.8+ is top percentile; no penalty for wrong answers (always answer everything).

## Cloud / dev workflow (post-pivot)

```bash
# Frontend (Vite SPA, deploys to Cloudflare Pages)
cd app
pnpm dev          # vite dev server
pnpm test         # vitest
pnpm test:e2e     # playwright
pnpm build        # production build

# API (Hono on Cloudflare Workers; planned in worker/)
cd worker
pnpm dev          # wrangler dev — local Workers runtime
pnpm deploy       # wrangler deploy — push to staging or prod (env=staging|prod)
pnpm db:generate  # drizzle-kit generate — emit SQL migrations
pnpm db:apply     # wrangler d1 migrations apply hpc-staging (or hpc-prod)
```

**Secrets:** Clerk publishable key in `app/.env.local` (`VITE_CLERK_PUBLISHABLE_KEY`); Clerk secret + any third-party tokens via `wrangler secret put` so they never hit the repo. CI uses `CLOUDFLARE_API_TOKEN` + `CLERK_SECRET_KEY` from GitHub Actions secrets.

**Migration discipline:** every schema change → `db:generate` → review the SQL diff in PR → apply to staging first → smoke-test there → apply to prod. Never edit migration SQL by hand once it's been applied to a real database.

## Conventions

- **Dev artifacts** (PRDs, code, comments, READMEs, conversation, taskmaster tasks) → **English**.
- **Product strings** (UI, lesson copy, feedback shown to students) → **Swedish**.
- **ELF section content** stays **English** by exam design — never translate.
- Pre-existing Swedish in `bygg_hp_databas.py` (`print` strings, docstrings) — keep as-is, don't churn.
- **Commit messages** — describe *what changed and why*, no `Co-Authored-By: Claude …` trailer, no "🤖 Generated with Claude Code" footer. The git author already records who typed the commit; the trailer/footer are noise.

## Legal note

HP material is copyrighted by UHR (Universitets- och högskolerådet). allakando.se publishes with permission. **Owner decision 2026-07-11 (PRD § 9.2): this is not treated as a launch blocker** — public-facing work (landing page, SEO, signup) may proceed. The underlying copyright facts remain worth revisiting if the commercial model or distribution scope changes materially. The repo stays private as ordinary practice, not as a legal gate.
