# hpf-qr0p.51.30 — Weekly prognosis intervals

## 2026-11-10 — Inspect and plan

- Base: 87d0df4bf93b870de70691bfae565087cf50fbce, clean assigned worktree.
- Approved source: scratch/hpf-design10/r6/A/framsteg.html and desktop/phone shots.
- Weekly snapshots contain only six first-try fields per section. Adapt them to the shared scorer; do not use the old all-attempt weekly fractions.
- Quiet weeks can carry evidence; only an empty snapshot is empty. A missing half gets the shared insufficient-evidence treatment. Current ISO week uses the headline aggregates to keep independent query refreshes consistent.
- Scope: admitted Framsteg files only. Coordinator owns visual captures, host-only checks and signed delivery.

## Verification

Pending red-first tests.

- Red-first run: `pnpm test src/folio/screens/framsteg/framstegView.test.ts src/folio/screens/framsteg/FolioFramsteg.test.tsx src/folio/screens/framsteg/framsteg.guard.test.ts --maxWorkers=2` — 19 failed, 112 passed. Failures exposed the absent weekly query/view, old heading and line chart, and old accent styling. Completed before production edits.

## 2026-11-10 — Implementation and verification

- Added the Folio-only authenticated twelve-week query, with the same five-minute refresh interval as stats. Failure retains the screen and displays the existing calm retry line; cached history remains visible.
- Replaced weekly all-attempt fractions with `computeHonestProjected` over each endpoint snapshot and the shared headline range formatter. Current ISO week uses the displayed headline aggregates to prevent cache refresh races. ISO week-year handling is covered at New Year.
- Replaced the line graph with neutral vertical soft intervals, empty slots, explicit insufficient-evidence copy, a 2,0 goal line and a keyboard-accessible table. The solid core is the exact clamped range; fades extend outside it and clip to the scale. The chart adds no motion, so it respects every reduced-motion setting.
- Comparison text uses the displayed one-decimal endpoints and only claims narrowing when the displayed width shrinks. It is absent until two weeks have bands.
- Focused view/hook/screen/guard tests: **132 passed**. Includes axe in seven screen states, old-deploy/offline errors, current-headline updates, sparse snapshots, rounding, scale clipping and token declarations.
- `pnpm typecheck`: **PASS** after correcting a test fixture type.
- `pnpm lint`: **PASS**, with four existing informational diagnostics in untouched devbake files.
- `pnpm test --maxWorkers=8`: **6,201 passed, 1 failed** across 205 files (204 passed). The only failure is `src/lib/trapIndex.test.ts` / “equals what scripts/build_trap_index.mjs derives from the explanations”: its generator child process is refused with `spawnSync /usr/bin/node EPERM`. This is the known sandbox limitation identified in the accepted contract; it was not retried or bypassed.
- `git diff --check`: **PASS**. No worker/backend, dependency, classic-route or shared-scoring edits.

## Handoff

- Source implementation is complete and uncommitted on the assigned branch from base `87d0df4bf93b870de70691bfae565087cf50fbce`.
- Coordinator: run the generator check outside the sandbox; capture `/progress` in desktop/phone light/dark against the approved shots, checking all palettes; perform signed commit and independent review before delivery.
- Full green acceptance is awaiting that host check. This worker will park the bead, not close or merge it.

- Staging attempt was refused: the shared worktree `index.lock` is on a read-only filesystem. Changes remain **unstaged and uncommitted**. No retry, alternate index or direct commit was attempted. Coordinator must stage the nine changed/admitted files, run host verification and deliver. Worker state: **BLOCKED** on host-only staging and verification.

## 2026-11-10 coordinator host verification

- Host: typecheck and lint clean, full app suite 205/205 files, 6202/6202 tests.
- Visual: /progress in 4 modes with seeded data (all from today, so one scored week). 11 empty dashed slots plus the current week (v46) as a soft band at 1,2–1,7, equal to the headline; goal line at 2,0; no forecast; no comparison sentence with a single week (correct). 0 side scroll, 0 wide, 0 red, 0 page errors.
- Coordinator polish in framsteg.css: on the phone, the twelve week labels collided, so every other label is hidden counting back from the current week (nth-last-child), and the current week is always shown. The accessible name still lists every week. Framsteg tests 148/148 after the change.
