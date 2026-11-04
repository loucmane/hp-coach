# LJ-05 — Ljusbord shell

## 2026-11-04 — inspection and decisions

- Base: `64071387beea9a235d4026629a176b01d6a975f7`; clean assigned worktree, dependencies present, no molecule.
- Follow `r6/A` chrome and copy with live-data substitutions. Keep collapse and ⌘B per owner override.
- Seven desktop entries with Repetera/Historik subentries; five phone families including Prov. Retain the account sheet/focus trap, add visible search and skip navigation, apply LJ-02 root attributes.
- The current CommandPalette's existing modifier-key listener is its only opening interface. Use that listener from the shell search controls; no shared/classic edits.
- Integration boundary: the existing `shell/ThemePicker.tsx` still reads/writes classic preferences, whereas LJ-02 root attributes read `folioPrefs`. This file is outside the write set (LJ-06 owns it). Verify and record any remaining migration dependency.
- Repetition estimates must come from the scheduler; no one-minute-per-question fallback. Today's pile is not proof every item becomes due today.

## Verification

Pending red-first tests, implementation, app typecheck/lint/full suite, and coordinator visual captures.

- Red run (before implementation): `pnpm test src/folio/nav.test.ts src/folio/data/mappers.test.ts src/folio/FolioShell.test.tsx --maxWorkers=2` — 27 failed, 85 passed, 3 files failed. Failures cover missing rail subentries/current mapping, live statuses, skip navigation, phone Prov/search, and root preferences. Existing behavior tests remained green.

## 2026-11-04 — implementation and verification

- Seven status-bearing rail links now include Repetera and Historik with independent active states. Phone families still have five tabs; Prov is the phone label. Collapse, modifier-B, route state across viewport changes, and the account focus trap remain.
- Added the approved mark/wordmark, 236 px rail, raised current entries and phone tabs, visible phone/rail search, first-focusable skip link with explicit focus transfer, and `main#innehall`.
- Applied `useFolioRootAttrs()`, including live OS theme/motion, palette, keyboard setting, and text-size attributes. Kept main and tabs inert during the phone account sheet.
- Mappers use real session position, repetition due counts, scheduler estimates where present, lesson titles, prognosis, and the lifetime drill-start count. The last is called `practicePasses` and displayed as “övningspass”; worker `routes/sessions.ts` increments it on start, so it must not be called a completion count.
- Focused run after implementation: **111 passed, 1 failed** (112 tests). Remaining failure is the pre-existing theme/palette integration test, retained to expose the migration dependency. A further live session-shape/staleness test passed in the full run.
- `pnpm lint`: **PASS**, 774 files, four existing informational findings in unrelated devbake files, zero errors.
- Initial `pnpm typecheck`: **PASS**. Final rerun after adding the live-session test is pending at this entry.
- `pnpm test --maxWorkers=8`: **6104 passed, 2 failed**, 201 files passed / 2 failed, 69.33 seconds. No browser/timing checks ran concurrently.
- Failure 1: `FolioShell.test.tsx`, “routes theme and palette through synced setters and reads the store”: classic-store dark/sage no longer changes the root, which correctly reads Folio preferences.
- Failure 2: `src/lib/trapIndex.test.ts`, generator consistency: `spawnSync /usr/bin/node EPERM`. This is the known sandbox child-process restriction; coordinator must run it on the host. No workaround or retry.
- `git diff --check`: **PASS**. Only the 16 admitted paths are changed/added. No classic source, worker source, dependency, frozen workflow, or generated projection changes.
- Visual captures are assigned to the coordinator: Idag and Konto in desktop/phone × light/dark, plus two palettes, using `app/scripts/ljusbord-capture.mjs` and the r6/A reference. No visual PASS is claimed here.

## Blocked handoff

- Required companion file: `app/src/folio/shell/ThemePicker.tsx` (outside this bead's admitted write set; owned by LJ-06). It still selects `useUiStore` and calls `useSyncedPrefs.setMode/setPalette`; the new root selects `useFolioPrefs`. Update its values/actions to the Folio store, including Som systemet, under the coordinator's admitted LJ-06 scope. Keep classic theme preferences independent; LJ-17 owns the later server synchronization.
- AccountMenu markup/copy is retained for that next shell bead, including the existing avatar's sheet entry to Konto. The new PhoneBar supplies the brand/search layout around it. Review that intentional retained behavior against the design's direct account-link sketch during LJ-06.
- Do not mask the failing integration by subscribing all classic preference writes into Folio: that would let delayed classic hydration override an explicit Folio system-theme preference. Do not weaken the existing test to claim completion.
- Delivery remains uncommitted. No independent review, owner visual approval, or merge performed. Park as **blocked**, not done/closed. Required next action: finish the ThemePicker migration in its authorized scope, adapt its regression to the final Folio preference contract, rerun checks on the host, then capture/review visuals.

## Playbook proposal — astra-relay

- 2026-11-04: Switching a shell to a new preference hook left its existing theme controls writing the old store; the integration regression stayed red. Cause: the brief admitted the new reader but not its control writer. Rule: inspect both preference readers and writers before routing a root-hook migration, and include or sequence the picker adapter in the admitted scope. This proposal is recorded here because `~/scratch/skill-gotchas/` is outside this session's writable roots; the coordinator should append it to `astra-relay.md` there.

## Final check update

- Final `pnpm typecheck`: **PASS**, including the live session-shape test. Supersedes the pending rerun above.
- Final `git diff --check`: **PASS**.
- Attempted the contract's explicit `git add` of all 16 admitted paths once. It failed because `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.51.13/index.lock` is on a read-only filesystem. Changes remain **unstaged and uncommitted**; coordinator must stage on the host. No commit/signing attempt or sandbox workaround.
