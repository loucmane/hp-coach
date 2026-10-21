# Worklog — hpf-bz6f.14

## Findings

- 2026-10-21: Claimed the assigned bead in its declared worktree. Starting HEAD: `447ce8639aacb6249b5321b549dd784a179f96c4`; working tree clean; app and worker dependencies present. No molecule controls this bead.
- The sticky header wraps a shared-layout `motion.span` with the same layout ID as the rail. The frozen layout dependency does not remove it from projection. The component records that the rail/header flight already reseats instantly, and the settle test compares destination geometry only.
- The existing throttled-refetch test samples numeral positions and presence but does not prove scrolling occurred or retain station/transform evidence.
- Browser execution requires Clerk authentication plus preview/worker servers. This offline sandbox cannot perform the live authenticated E2E flow; the coordinator must run the ten repeats and the settle-parity check on the host.

## Decisions

- Add a default-enabled `flight` prop; opt the sticky header out while leaving rail projection, away reserves, and DigitRoll behavior intact.
- Preserve every existing geometry threshold. Add scroll verification and frame diagnostics to the existing regression.
- Add unit coverage before the production change, using the repository's established Motion-prop test stub pattern.
- Follow the accepted bead's delivery instruction: uncommitted changes and a final evidence note; coordinator owns parking, review, and closure.

## Progress

- [S:codex-1|W:hpf-bz6f.14|H:inspect|E:source-and-contract] Scope and base verified; implementation restricted to the four admitted paths.

## Handoff

- Implementation and validation in progress. No commit, publication, or closure performed.

## Verification update — 2026-10-21

- Red: `pnpm test src/components/motion/DueNumeral.test.tsx --maxWorkers=1` against the original component: 1 failed, 4 passed. The full-motion header unexpectedly exposed `data-layout-id="a2-due"`.
- Green: the same command after the change: 5 passed. Coverage includes header projection in both motion modes and after count changes, default rail projection, the exact-width away reserve, and reduced-motion rail visibility.
- Installed Motion source corroborates the proposed mechanism: `motion-dom@12.38.0` `create-projection-node.mjs:655-669` adds root scroll offsets to viewport measurements; `HTMLProjectionNode.mjs:24` recognizes fixed elements as scroll roots, not sticky elements. This is source evidence, not a reproduction of the CI frame drift.
- The E2E recorder now retains numeral/station rectangles, scrollY, and computed numeral transform in a JSON attachment, including when interaction assertions fail. It polls for positive scroll after the wheel. Existing 1px movement thresholds and gap assertions remain intact.
- `pnpm lint`: PASS, 547 files checked, four pre-existing informational suggestions in unrelated devbake files. An initial formatter finding in the new test was corrected.
- `pnpm test:e2e tests-e2e/repetition-numeral.spec.ts --project=chromium --repeat-each=10 --list`: PASS, 31 cases discovered (30 repeated numeral cases and authentication setup). Discovery is not browser execution.
- `git --no-optional-locks diff --check`: PASS.
- [S:codex-1|W:hpf-bz6f.14|H:implement|E:red-green-and-recorder] Header projection disabled; rail reserve untouched; source tests and frame diagnostics added. Full-app validation pending.

## Playbook-proposal — astra-relay

- 2026-10-21: Sticky Motion numerals can drift during scroll/refetch despite a constant layoutDependency. Page-coordinate projection adds document scroll to a viewport-pinned box; freezing the dependency does not remove shared projection. Diagnose with both ancestor/numeral rects, scrollY and computed transform; keep strict pixel thresholds and require proof that the page scrolled. For a header whose flight is already inactive, opt out of layoutId while preserving rail reserves. Proposal retained here because `~/scratch/skill-gotchas/` is outside this managed worker's writable roots; coordinator should relay it to the playbook queue.

## Final validation and handoff — 2026-10-21

- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS (four unrelated informational suggestions, no errors).
- `pnpm test --maxWorkers=2`: 116 test files passed; 1 failed. 4,127 tests passed; 1 failed out of 4,128. The sole failure is the unchanged `src/lib/trapIndex.test.ts` generator check: sandbox refused `spawnSync /usr/bin/node EPERM`. No workaround or unrelated edits attempted. Host must rerun this check.
- `pnpm test:e2e tests-e2e/motion-settle.spec.ts --project=chromium --grep 'A2 flights settle' --list`: PASS; auth setup and the settle-parity test discovered. Neither browser test was executed. Original CI screenshots were not fetched in this offline worker; confirmation of the actual CI frame trajectory remains with the host.
- Host verification from `app/`: `pnpm test:e2e tests-e2e/repetition-numeral.spec.ts --project=chromium --repeat-each=10`, then `pnpm test:e2e tests-e2e/motion-settle.spec.ts --project=chromium --grep 'A2 flights settle'`. Inspect the `due-station-refetch-frames` attachment if any repeat fails.
- Worker code was untouched; worker-package checks are not applicable.
- Self-review: all source edits remain inside the declared write set; no geometry/style changes, no changes to DigitRoll or the rail's away handling, no relaxed thresholds. `git diff --check` passes.
- HEAD remains `447ce8639aacb6249b5321b549dd784a179f96c4`; delivery is uncommitted. Independent Claude review and host browser evidence remain required before coordinator delivery or closure. This is an implementation handoff, not a merge verdict.
- Source SHA-256 receipts:
  - `app/src/components/motion/DueNumeral.tsx`: `898287aa41df4df18c652b23cc49522d9f6f69896feb5382dbba7df3098d8aca`
  - `app/src/components/motion/DueNumeral.test.tsx`: `5547aae3f69e12841b900665652e7b2bbed6d9081740e5d62195c6e8bb459614`
  - `app/tests-e2e/repetition-numeral.spec.ts`: `373e05eef9095a83db4da59354c3b1d93f1a07375624860b99d1b785893bb56f`
- [S:codex-1|W:hpf-bz6f.14|H:verify|E:4127-pass-one-sandbox-refusal] Implementation complete; host-only validation and independent review handed to the coordinator. Bead stays open under its accepted delivery contract.

- Staging attempted once and refused: the shared Git worktree metadata is read-only (`/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-bz6f.14/index.lock`). All four deliverable files remain unstaged and uncommitted. Coordinator must stage them on the host; no alternate Git metadata or signing path was used.
- Lifecycle: final evidence note requests coordinator handoff; no close/status/assignee mutation or drain acknowledgement, per the accepted bead's instruction to stop after the DONE note while the coordinator parks it.

NUMERAL DONE: hpf-bz6f.14
