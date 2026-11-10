# Worklog — hpf-qr0p.51.15

## Findings

- 2026-11-04: Claimed LJ-06 on clean base `79fd5db1d8150b076d3437503164394f140ddbd9`; no molecule metadata. Dependencies are installed.
- The approved source is `/home/loucmane/scratch/hpf-design10/r6/A/`, with owner decisions in `rebuild-map.md` §0 overriding older palette removal text.
- `FolioShell.tsx` forwards only exit fields. It is outside the admitted write set, so integration requires a coordinator companion change. Scope finding recorded on the bead.

## Decisions

- Keep legacy FocusBar output when no optional chrome is supplied. Add typed strip cells, caller-supplied location, and one primary/optional secondary dock action.
- Preserve Folio preference writes before synced setters, including local system theme support. Use existing section, action, and theme tokens.
- Do not edit FolioShell or any classic files. Complete the admitted work and record the exact integration companion here.

## Progress

- 2026-11-04: Inspected the shell, focus hook, preferences, UI primitives, approved focus/account HTML, and responsive system.css.

## Handoff

- Implementation and verification in progress. Coordinator owns signed commit, integration companion, and four-mode visual capture.

## 2026-11-04 implementation and focused verification

- Added `FocusStripCell`, `FocusStrip`, `FocusAction`, and `FocusDock` types; `FocusRequest` and `useShellFocus` carry optional strip, where, and dock values. The hook retains latest exit callbacks and owner-aware cleanup.
- FocusBar keeps the old wordmark/exit structure when optional chrome is omitted. New chrome has operable strip cells, actual pass totals, return/right labels, and a current halo independent of answer outcome. The section token supplies the data colour.
- DockBar supplies one Go primary and an optional secondary, with caller-owned detail and safe-area padding. It belongs after main in the shell's DOM order; CSS reserves room only when a focus dock exists. Phone layout hides desktop detail/keycaps.
- Account dialog retains Konto and dismissal; its trigger now identifies the dialog. Theme and palette choices use raised selected segments; the Folio-first/synced-setter ordering is unchanged.
- Red before implementation: `pnpm test src/folio/shell/FocusBar.test.tsx --maxWorkers=2` → 8 failed, 6 passed. Failures: missing strip (2), missing dock (3), missing focus registration fields (1), missing account popup semantics (2).
- Green: `pnpm test src/folio/shell/FocusBar.test.tsx src/folio/FolioShell.test.tsx --maxWorkers=2` → 2 files / 51 tests passed, including axe and unchanged shell callers. The dock tests use the intended composition, not the unwired production shell. CSS geometry/contrast remain host visual checks.
- `pnpm typecheck` → exit 0. `pnpm lint` → exit 0, 776 files checked, four existing informational diagnostics in devbake files. Fixed the new footer's explicit landmark role and test formatting before the final lint run.
- Full `pnpm test --maxWorkers=8` is running. No worker files changed.

## Required coordinator companion (not applied)

`app/src/folio/FolioShell.tsx` is outside the admitted write set. Apply these additions before considering LJ-06 integrated:

```diff
 import { AccountMenu } from './shell/AccountMenu'
+import { DockBar } from './shell/DockBar'
 import { FocusBar } from './shell/FocusBar'
@@
               <FocusBar
+                strip={focus.strip}
+                where={focus.where}
                 exitLabel={focus.exitLabel}
@@
             </main>
+            {focus?.dock ? <DockBar {...focus.dock} /> : null}
             {phone && !focus ? (
```

Keep the existing onExit fallback untouched. Add a real FolioShell integration test that registers the fields via `useShellFocus`, updates them, checks the dock follows main, and releases them. Then capture the drill in light/dark × phone/desktop as assigned to the coordinator. Future screen beads supply actual strip state, location and action data; this bead does not alter their callers.

### Playbook-proposal — gas-city-coordinator

- 2026-11-04: An optional FocusRequest extension compiled and its components passed, but the real shell discarded the new fields. Cause: FolioShell explicitly forwards exit props and was omitted from the write set. Rule: trace registration through the actual render host and admit that file plus an integration test when briefing shell-owned chrome. Proposal retained here because `~/scratch/skill-gotchas/` is outside this managed worker's writable roots; coordinator can relay it.

## 2026-11-04 final verification and handoff

- Full app suite: `pnpm test --maxWorkers=8` → 203 files passed / 1 failed; 6,119 tests passed / 1 failed (6,120 total), 62.29 seconds. The sole failure is `src/lib/trapIndex.test.ts` → `committed trap index > equals what scripts/build_trap_index.mjs derives from the explanations`: `spawnSync /usr/bin/node EPERM`. This is the generator child-process sandbox restriction described in the accepted brief. Do not weaken the check; coordinator must rerun it on the host.
- The final full run includes the new focus tests and existing shell/guard tests. Typecheck and lint passed; `git diff --check` passed. There are no worker or classic-source changes.
- Status: BLOCKED. All permitted implementation is ready for review, but the production shell still needs the exact companion above. No signed commit or independent review exists; HEAD remains base `79fd5db1d8150b076d3437503164394f140ddbd9` with local changes. Four-mode screenshots and host generator validation remain coordinator work.
- Staging attempted once with the nine exact admitted paths. Git refused to create `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.51.15/index.lock` because the shared git metadata is read-only. Changes remain unstaged and uncommitted; coordinator must stage them on the host. No permission escalation or workaround attempted.

## 2026-11-04 coordinator integration and host verification

- Applied the requested FolioShell companion: DockBar import, `strip`/`where` forwarded to FocusBar, DockBar rendered after `</main>` when `focus.dock` is set.
- Added the FolioShell integration test (registers strip, where and dock via `useShellFocus`, updates them, checks the dock follows main, releases them on exit).
- Coordinator polish in `focus.css`: palette buttons padding 9px 6px, centred, so all five palettes fit one row in the desktop account menu.
- Host: typecheck clean, lint clean (4 pre-existing infos), full app suite 204/204 files, 6121/6121 tests at 8 workers (trap-index generator check passes on the host).
- Visual: drill (KVA) in 4 modes via ljusbord-capture, 0 side scroll, 0 wide, 0 red, 0 page errors; unchanged for existing callers. Account menu open in desktop light and phone dark: three themes plus five palettes.
