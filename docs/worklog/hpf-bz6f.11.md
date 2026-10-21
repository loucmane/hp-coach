# Worklog — hpf-bz6f.11

## Findings

- 2026-10-21: Claimed the assigned bead in its declared worktree; no molecule. Clean starting HEAD: `91bc87f30327d2f23ff9abb2f862a82959c27520`. App and worker dependencies are present.
- The accepted round-1 contract limits this delivery to the read-only Provteknik chapter. Worked examples, lesson credit and the LÄS drill view remain outside this slice.
- `uhrPacing.ts` is the existing source for recommended section times. `app/public/data/host-ver1-2019.json`, question `host-ver1-2019-kvant1-NOG-023`, supplies the printed A–E wording.
- The existing LessonReader owns a document-level bookmark listener. A separate reader avoids mounting that listener for this chapter.

## Decisions

- Keep the chapter outside Section, FILENAMES and Framework. Derive the displayed timing information from UHR_DELPROV and uhrTimeMs; distinguish section averages from a personal skip-and-return limit.
- Add schema/loader and component/route tests before implementation. Keep route tests in the admitted ProvteknikReader test file.
- Follow the accepted bead delivery instruction: uncommitted changes and one final evidence note; the coordinator owns parking, review and closure.

## Progress

- [S:codex-1|W:hpf-bz6f.11|H:inspect|E:contract-and-source] Scope, starting state, dependencies and source wording verified offline.

## Handoff

- Implementation and verification in progress. No commit, publication or closure performed.

## Implementation update — 2026-10-21

- Red baseline: `pnpm test src/data/provteknik.test.ts src/components/lesson/ProvteknikReader.test.tsx --maxWorkers=1` failed before implementation: five data/loader tests failed and the component suite could not resolve the absent reader. Missing JSON and loader were reported explicitly.
- Added six plain Swedish entries, a canonical/public byte copy, a separate memoised loader, native expandable cards, a read-only reader and the chapter route/picker row. NOG wording matches the selected bank record exactly. The KVA advice restricts substitutions to permitted values and explains that matching examples do not prove a general result.
- The reader derives the ordinary pass duration and section timing table from `uhrPacing.ts`. It never mounts LessonReader or lesson progress hooks.
- First integration run: 24 passed, one test failed because a synthetic Escape event targeted Window while the existing handler expects an element. Corrected the test to dispatch from document.body, matching browser keyboard events; no production workaround. Formatter findings in new files corrected.
- [S:codex-1|W:hpf-bz6f.11|H:implement|E:red-first-and-integration] Source complete; final package checks in progress.

## Verification update — 2026-10-21

- `pnpm typecheck`: PASS, including a final run after the test fixture corrections.
- `pnpm lint`: PASS, 558 files checked; four pre-existing informational suggestions in unrelated devbake files, no errors.
- `git --no-optional-locks diff --check`: PASS. Working tree contains only the nine admitted repository paths. Worker code is untouched; worker-package checks are not applicable.
- Canonical and public JSON both have SHA-256 `1786cc93acc7d90bc132dedc74db46e0c7981a807088821dfd4a0616ef29b365`.
- Source SHA-256 receipts:
  - `app/src/data/frameworks.ts`: `e049d857156ee158429ae00a77e7f289a421772693e0765aaccc9a016ac37a96`
  - `app/src/routes/lektion.tsx`: `b18dfce07bb3024d1b042b6d1e805f9e08ad27147c440600037161ff81ecad97`
  - `app/src/components/lesson/ProvteknikCard.tsx`: `985cf6c7163dccc7066536ed2f7b4c1679e4a7041f2dd32519ca5a979b2a9758`
  - `app/src/components/lesson/ProvteknikReader.tsx`: `a2feaa36cde8846ec5d51dea6087c8c38b333759dc53e7eb366f56ffa8f2c093`
  - `app/src/components/lesson/ProvteknikReader.test.tsx`: `a23adf637fbc06dd50a1082716bd43bac15850a1bdbfc8a51177c00a19c2889e`
  - `app/src/data/provteknik.test.ts`: `8bd83bd37a711a18ed7a72753e729af2bf634ac7e7f24a8c2596693d4ee87f2e`
- Browser visual review was not run in this offline worker. The coordinator retains independent Claude review, expert Swedish copy review and delivery. Base HEAD remains `91bc87f30327d2f23ff9abb2f862a82959c27520`; no implementation commit exists.

## Playbook-proposal — astra-relay

- 2026-10-21: A route keyboard test threw `e.target.closest is not a function` when Escape was fired on Window. The existing handler expects an element, as normal browser keyboard events provide. Dispatch from the focused control or document.body so keyboard integration tests follow the browser event path. Proposal retained here because the managed writable roots exclude `~/scratch/skill-gotchas/`; coordinator should relay it to the playbook queue.

## Final validation and handoff — 2026-10-21

- `pnpm test --maxWorkers=2`: 122 test files passed, one failed; 4,164 tests passed, one failed out of 4,165. All 13 new tests passed, along with framework byte-copy and existing section-picker tests.
- The sole failure is the unchanged `src/lib/trapIndex.test.ts` generator check: `spawnSync /usr/bin/node EPERM`. No workaround or unrelated changes attempted. Coordinator must rerun the generator check on the host using `pnpm test src/lib/trapIndex.test.ts --maxWorkers=1` from app/.
- One staging attempt was refused: the shared worktree index lock under `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-bz6f.11/` is read-only. All nine deliverable files remain unstaged and uncommitted. Coordinator must stage them on the host; no alternate index, signing helper or direct commit was used.
- Implementation is ready for independent Claude review and the planned expert Swedish language review. This is an implementation handoff, not a merge verdict. No claim that the full suite is green or that browser visual checks ran.
- The bead remains open under its accepted round-1 delivery contract. Final evidence note hands parking, host checks, review and closure to the coordinator. Do not drain an unparked in-progress bead; the accepted contract instructs this worker to stop after the DONE note.
- [S:codex-1|W:hpf-bz6f.11|H:verify|E:4164-pass-one-sandbox-refusal] Scope complete; host-only generator verification and staging limitations recorded for delivery.

PROVTEKNIK DONE: hpf-bz6f.11
