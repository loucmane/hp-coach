# Worklog — hpf-qr0p.49.14

## Findings
- 2026-10-29: Claimed Historik in Folio+ on clean branch `codex/hpf-qr0p.49.14-historik-in-folio`, base `bd59f8021556b37475af0801a67551c831caaf13`. No molecule governs this bead. Both package dependency directories are present.
- Practice history already reconstructs drill and repetition passes; MockResultRow exposes presented, answered and correct counts plus date values in number/string/null form.

## Decisions
- Keep the classic route markup and hooks; mount the new screen lazily after the route hooks. Fetch Provpass only inside that lazy screen.
- Follow the merged Folio typography, ink and rules. Weekly practice ledger plus separate Provpass ledger; use existing native-link navigation helper and local calendar dates. Include year in week labels to distinguish older history. Preserve undated rows explicitly.
- Follow the bead delivery contract: uncommitted changes, coordinator review and owner visual approval before merge; no worker close/status change.

## Progress
- Added initial red tests for week/year boundaries, scores, dates, Provpass, filtering and navigation.

## Handoff
- Implementation and checks in progress. Host desktop/phone light/dark visual check, owner visual OK, independent review and signed delivery remain with coordinator.

## Verification — 2026-10-29
- Red first: view/nav run failed because `historikView` did not exist and `/historik` plus `/historik/pass` returned null instead of Framsteg (47 passing existing cases). Screen/guard/route run then failed on the missing screen/CSS, missing lazy branch, and inability to find the Folio screen after toggling the host context (four failing assertions and one import failure).
- Implemented pure date/week grouping, year-distinct ISO week labels, explicit undated rows, shared `passLabel` practice labels, exact correct/total counts, and Provpass correct/presented counts with real result links. API arrays remain untouched. Numeric, numeric-string and ISO MockResultRow dates are accepted.
- Added lazy Folio branch after all existing route hooks, retaining the classic render. Mock results load only inside Folio. Separate retry controls retain cached rows. Empty practice history offers Öva, and an empty successful Provpass source omits its section.
- Scoped every CSS rule under `[data-folio] .fa-historik`, reused Folio tokens and native-link behavior, provided visible focus and full-width phone targets of at least 44px. Suspense fallback also uses ink-2.
- Focused suite: 5 files, 66 tests passed, including axe on ready/empty/error/loading states. Axe contrast was disabled in JSDOM; real light/dark contrast and geometry remain host visual checks.
- `pnpm typecheck`: passed. `pnpm lint`: passed across 727 files, with four existing informational notices in devbake files; none in the write set.
- Required full `pnpm test` run with no worker cap: 185 files, 184 passed / 1 failed; 5,299 tests, 5,298 passed / 1 failed, 75.65s. The sole failure was `src/lib/trapIndex.test.ts > committed trap index > equals what scripts/build_trap_index.mjs derives from the explanations`, reporting `spawnSync /usr/bin/node EPERM`. The brief identifies this child-process restriction; its test, implementation, generator and committed index are unchanged from the base. No workaround attempted. Coordinator must run that check outside the sandbox.
- After the final ink-2 Suspense adjustment, route + guard rerun: 2 files / 4 tests passed; route Biome check passed. `git diff --check`: passed.
- Worker package unchanged; worker checks not required by this contract.

## Delivery handoff — 2026-10-29
- Supersedes the earlier in-progress handoff: implementation is ready for coordinator review, uncommitted and unstaged. Git metadata lives outside the writable worktree and the session policy declares it read-only; no staging/commit/signing attempted.
- All changed repository files belong to the exact accepted write set. Implementation baseline remains `bd59f8021556b37475af0801a67551c831caaf13`; there is no new commit SHA. No independent review verdict yet.
- Before merge: host trap-index check; real local-stack desktop/phone × light/dark visual evidence; owner visual OK; independent exact-head review and remaining mechanical gates. No merge, publishing or credential action performed.
- Per the accepted delivery instructions, leave bead status and assignee untouched and send the DONE note for the coordinator to park. Do not drain while it remains assigned/in_progress, because drain releases it to the pool (existing playbook warning).
- No new playbook gotcha was discovered; the generator EPERM and read-only Git metadata limitations are already documented.
