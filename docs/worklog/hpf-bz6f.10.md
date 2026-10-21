# Worklog — hpf-bz6f.10

## Findings

- 2026-10-21: Claimed the direct implementation bead; no molecule governs it. Starting branch is clean at 6427606e8d0de0e64cfb343782f70be4bfe33527. Dependencies exist in app/node_modules.
- SessionPlayer supports answer callbacks and exact sections matching. Home uppercases the sections field when constructing a resume URL, so the word marker must survive that round trip. No SessionPlayer or Home source edits are in scope.

## Decisions

- Generate public IDs only; load prompts and answer options from the gated runtime bank. Group normalized headwords, merging duplicate question variants.
- Ten-word rounds take overdue words first, then unseen words, without bringing future reviews forward. Prefer unseen question variants within a word.
- Use per-Clerk-user localStorage with a five-step Leitner schedule: a miss returns after ten minutes; correct answers schedule 1, 3, 7, 14, then 30 days. No anonymous shared deck.
- Mark word sessions with the readable sections value `ORD · ORDBANK`; normalize its Home resume URL back to section ORD plus words mode. Ordinary and timed ORD sessions keep their existing marker.
- Leave source uncommitted for coordinator review and delivery, per the accepted brief. Do not close or change bead status.

## Progress

- [S:hpfetcher/codex-1|W:hpf-bz6f.10|H:inspect|E:contract-and-source] Inspected the accepted write set, existing timed drills, player adoption, bank loading, generator conventions, and Home resume construction.
- [S:hpfetcher/codex-1|W:hpf-bz6f.10|H:red|E:vitest-focused] Added the deck, generated-manifest, picker/loader, and real-SessionPlayer route regressions first. Initial focused run failed all three suites because ordDeck/ordWords did not yet exist (exit 1). After the library implementation, reran before editing drill/Öva to capture route behavior failures independently.
- [S:hpfetcher/codex-1|W:hpf-bz6f.10|H:red|E:route-before-integration] Before route/Öva implementation, 14 library tests passed and all 10 route cases failed: words search was dropped, sessions used ORD, ordinary sessions were adopted, completion dropped words, Home resume lost mode, qid became a one-question drill, and anonymous starts were allowed. One idle-copy case timed out under frozen notification timers; fixed the test harness to fake Date only.
- [S:hpfetcher/codex-1|W:hpf-bz6f.10|H:implement|E:manifest-and-deck] Generated 520 word groups covering all 540 ORD questions. Manifest tests verify exact corpus coverage, normalized grouping, lowest-qid IDs, IDs-only keys/values, root associations, and generator --check in a child process. Deck tests cover ladder/cap/reset, seen variants, per-user/no-anonymous isolation, corrupt entries, blocked storage, and quota failure.
- [S:hpfetcher/codex-1|W:hpf-bz6f.10|H:verify|E:focused-green] Focused command: NODE_OPTIONS=--max-old-space-size=3072 pnpm test src/lib/ordDeck.test.ts src/lib/ordWords.test.ts src/routes/-drill.words.test.tsx src/routes/-drill.timed.test.tsx --maxWorkers=1. Result: 4 files, 34 tests passed. Uses the real SessionPlayer for route lifecycle, adoption, grading, refresh/replay and Home-shaped resume URLs.
- [S:hpfetcher/codex-1|W:hpf-bz6f.10|H:verify|E:static-checks] pnpm typecheck passes after using Map for own-entry lookup (the repository targets pre-ES2022). pnpm lint passes across 558 files with four existing informational notices in unchanged devbake files. git diff --check passes. Full app suite running with one worker and 3072 MB Node heap; no worker/ files changed.
- [S:hpfetcher/codex-1|W:hpf-bz6f.10|H:verify|E:full-app-suite] NODE_OPTIONS=--max-old-space-size=3072 pnpm test --maxWorkers=1 finished in 242.35 seconds: 122 files passed, 1 failed; 4,169 tests passed, 1 failed. The only failure is the unchanged src/lib/trapIndex.test.ts child-process check (line 39), rejected by the sandbox with spawnSync /usr/bin/node EPERM. The new ORD generator child uses inherited stdio and passes. Coordinator must run the existing trap-index check outside the sandbox; no unrelated test or policy change was made.
- [S:hpfetcher/codex-1|W:hpf-bz6f.10|H:handoff|E:staging-boundary] Attempted git add with exactly the ten accepted paths. It failed with exit 128 because /home/loucmane/dev/hpfetcher/.git/worktrees/hpf-bz6f.10/index.lock is on a read-only filesystem. No retry, signing, commit or remote operation was attempted. All changes remain unstaged and uncommitted; the coordinator must stage them outside this sandbox.

## Playbook proposals

- 2026-10-21 — Playbook-proposal (astra-relay): In React Query route tests, faking all timers left a newly fetched index on its loading screen and caused findBy timeouts. React Query batches notifications through timers. When testing elapsed-time/scheduling behavior without timer callbacks, fake Date only and advance system time; leave notification timers live.
- 2026-10-21 — Playbook-proposal (astra-relay): Biome check --write rewrote Object.prototype.hasOwnProperty.call to Object.hasOwn, then hpfetcher's typecheck failed because its lib target predates ES2022. Use a Map for dictionary own-entry reads or a target-compatible alternative; recheck types after automatic fixes. Proposals are retained here because this managed session's declared writable roots exclude ~/scratch/skill-gotchas/.

## Handoff

- Implementation and verification pending. Only the ten accepted repository files and the bead's classified worklog may be written.
- 2026-10-21 update superseding the initial pending note: implementation is complete in the exact ten-file write set. No worker code, SessionPlayer, dependencies, frozen task systems, remote services or branches were changed. HEAD remains 6427606e8d0de0e64cfb343782f70be4bfe33527; the implementation is uncommitted. Independent Claude review and coordinator delivery remain outstanding. The accepted first slice schedules headwords and presents their original answer/distractor options; it does not create separate cards for distractors or a server-synced deck.
- Delivery limitation: source staging and the unchanged pipe-backed trap-index test require the host. The accepted brief reserves bead status/assignee changes and parking for the coordinator; this worker leaves the bead open for that handoff.
- Final focused rerun after the TypeScript compatibility correction: 4 files / 34 tests passed in 6.17 seconds. Final git diff --check passes; git status contains exactly the ten accepted paths. Worklogs contain the red-first results, final checks, two playbook proposals and both sandbox limitations.

WORDS DONE: hpf-bz6f.10
