# LJ-29 — Prov hub

## Findings

- 2026-11-05: Claimed hpf-qr0p.51.18. Base: `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`; clean branch `codex/hpf-qr0p.51.18-ljusbord-lj-29-prov-hub`. No molecule controls this bead.
- Read the approved rebuild map (§0–2, Prov row, LJ-29), direction, markup and reference shots. The route supplies the cadence-prescribed half, exposure-ranked passes, real duration and start/confirmation callbacks.
- PassOption contains total counts but no per-section counts. The hub can share the memoized question-bank loader and resolve authentic counts without changing the route. The real corpus manifest has 27 sittings, including spring 2022 variants and autumn 2019 versions.
- Only ORD and LÄS timed drill routes currently exist. The short alternative will use the real ORD specification (10 questions, 3 minutes), not the sketch's unsupported 12-minute promise.

## Decisions

- Preserve the route, run, result builder and result-screen styling. Add hub-specific CSS selectors and retain shared exports used by the result screen.
- Keep the mandatory confirmation step; the active state has one Lit and one Go. The phone action uses Go's dock prop.
- Derive the year/term matrix and exposure from supplied passes; preserve variants and distinguish cancelled, unavailable and absent counterpart cells. Do not hard-code a displayed corpus count.
- No commit, publish or merge. Host visual verification and signed delivery belong to the coordinator.

## Progress

- Inspection complete; red-first regression tests are next.

- Red-first: `pnpm test src/folio/screens/prov/provView.test.ts src/folio/screens/prov/FolioProvpass.test.tsx --maxWorkers=2` failed as expected: 9 failed, 12 passed. Failures covered missing matrix/section counts, old copy, absent Lit/Go, absent phone matrix/dock, alternatives and unscoped Enter.
- Implemented the year/term matrix from real pass inventory, real section counts via the memoized bank, disabled full-half alternative, generated-pass disclosure, supported short drill, latest-result card, score/clock explainers and active confirmation sheet.
- Focused verification: `pnpm test src/folio/screens/prov src/routes/-prov.folio.test.tsx --maxWorkers=2` — 7 files, 111 tests passed, including unchanged run/result tests, route transitions, isolation guards and axe. `pnpm typecheck` passed. `pnpm lint` passed with four existing informational findings in unrelated devbake files. `git diff --check` passed.
- Full app suite started with `--maxWorkers=8`; no concurrent browser/timing run.
- Focus handling: swapping the active Lit sheet remounts the primary control, so the hub restores focus after dismissal. Phone Go lives outside Lit because the entrance transform would otherwise contain its fixed-position dock.

### Playbook proposal — gas-city-coordinator

- 2026-11-05: Symptom: a fixed phone action inside Lit can scroll with its sheet. Cause: the Lit entrance animation retains a transform, which establishes a containing block. Rule: render fixed hub docks as Lit siblings and assert that the dock action has no lit ancestor. The requested `~/scratch/skill-gotchas/` inbox is outside this session's writable roots; coordinator should forward this entry there.

## Handoff

- Implementation and verification in progress.

- 2026-11-05 final handoff: implementation is complete and uncommitted on base HEAD `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`. Only the ten admitted Prov files and this worklog changed. Result builder, shared result helpers and prior result CSS rules are preserved; no route, classic or run files changed.
- Full app verification: `pnpm test --maxWorkers=8` — 202 files passed, 1 failed; 6,110 tests passed, 1 failed. The sole failure is `src/lib/trapIndex.test.ts > committed trap index > equals what scripts/build_trap_index.mjs derives from the explanations`: `spawnSync /usr/bin/node EPERM`. This is the generator subprocess sandbox limit anticipated in the accepted contract. No retry or workaround attempted.
- Final `pnpm typecheck` passed. Lint passed (four pre-existing informational findings only). Focused 111 tests and axe passed. No worker files touched, so worker checks do not apply.
- Staging attempted once for the exact eleven files: refused because the shared worktree `index.lock` is on a read-only filesystem. Changes remain unstaged. No commit/signing attempt.
- BLOCKED pending coordinator host generator check, staging, the four-mode `/prov` screenshot comparison, independent exact-head review and signed delivery. Do not close this bead or mark all gates green. Follow the bead's final protocol: worker_state blocked, append evidence, defer with empty assignee, then drain.
- Reference review: all four approved Prov shots inspected. Actual browser screenshots are assigned to the coordinator and were not run here.

## 2026-11-05 coordinator host verification

- Host: typecheck clean, lint clean (4 pre-existing infos), full app suite 203/203 files, 6111/6111 tests at 8 workers (trap-index generator check passes on the host).
- Visual: /prov in 4 modes via ljusbord-capture, with six seeded local drill sessions. Compared with r6/A/shots/prov-dator.jpg: lit Föreslaget pass with section counts and the four conditions, one Go; Hel halva shown disabled ("Kommer"); Genererat says "Ingen poäng"; Kort på tid; the 27-sitting Vår/Höst × P1/P2 matrix with "30/40" only on the seen sitting and cancelled spring 2020/2021 labelled; phone dock carries the one action. 0 side scroll, 0 wide, 0 red, 0 page errors.
- Dock proposal relayed to the shared Ljusbord brief rules.
