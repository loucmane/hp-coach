# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

HP-Coach: a coaching tool for the Swedish högskoleprov (HP). Differentiator: zero-knowledge curriculum + ADHD-PI-friendly UX, targeting 2.0 (perfect score).

## Source of truth

For product decisions, architecture, and scope, read **`.taskmaster/docs/prd.txt`** first. It owns:

- Vision and audience (§ 1)
- Design pillars (§ 2): zero prior knowledge, target 2.0, neurodivergent-friendly UX
- Three-layer pedagogical architecture (§ 3): Layer 1 frameworks → Layer 2 explanations → Layer 3 adaptive logic, plus Layer 4 synthetic generator (§ 5.15) and § 5.16 lesson content pipeline
- Screen-by-screen UX flows (§ 4)
- Functional + non-functional requirements (§§ 5–6) — Cmd+K palette is a hard requirement (§ 6.4)
- Technical stack (§ 7): Vite + React 19 + TS + Tailwind v4 + shadcn/ui + SQLocal/Drizzle, local-first, no backend in v0
- Phase plan (§ 8)
- Open questions and risks (§ 9)
- MVP acceptance criteria (§ 10)

For tracked work, see `.taskmaster/tasks/tasks.json` (53 parent tasks, 265 subtasks). Use the taskmaster MCP tools (`get_tasks`, `next_task`, `get_task`, `expand_task`, `set_task_status`) rather than editing the file by hand.

Persistent memory across Claude sessions lives in `~/.claude/projects/-home-loucmane-dev-hpfetcher/memory/` — see `MEMORY.md` for the index. Notable: user profile (ADHD-PI, dogfood user, target 2.0), design pillars, pedagogical architecture, language and batching conventions.

## Repo layout

```
hpfetcher/
├── bygg_hp_databas.py            # PDF scraper (existing, complete)
├── hp_databas.json               # scraped raw text from 27 exams (~2.7 MB; data, not artifact)
├── parser/                       # planned, Phase 0–2
├── frameworks/                   # Layer 1 JSON (planned, Phase 1)
├── pipeline/
│   ├── explanations.py           # Layer 2 (per-question explanations + QA queue)
│   ├── synthetic/                # Layer 4 (dual-model question generation)
│   └── lessons/                  # § 5.16 lesson generator + teach-back gate
├── data/                         # parser output: hp_question_bank.json, explanations/, images/
├── app/                          # frontend (Vite + React, planned, Phase 0)
└── docs/                         # design docs (e.g. curriculum-scheduler.md, written before Phase 3)
```

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

## Conventions

- **Dev artifacts** (PRDs, code, comments, READMEs, conversation, taskmaster tasks) → **English**.
- **Product strings** (UI, lesson copy, feedback shown to students) → **Swedish**.
- **ELF section content** stays **English** by exam design — never translate.
- Pre-existing Swedish in `bygg_hp_databas.py` (`print` strings, docstrings) — keep as-is, don't churn.

## Legal note

HP material is copyrighted by UHR (Universitets- och högskolerådet). allakando.se publishes with permission. Whether a third-party can build a commercial service on top of the material without separate permission is **unresolved** (PRD § 9.2) and must be addressed before public launch to other users. Does not affect the dogfood phase (single user, no distribution). The repo is private for this reason.
