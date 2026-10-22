# Worklog — hpf-qr0p.49.17

## Findings

- 2026-10-23: Started from clean base `e67b3e2c1cc60fe12939fcdba466b215e7b91f57`. The shared `pickCandidate` formats a lesson bookmark as `vid <frameworkId>`. Both classic `ResumptionPanel` and Folio shell consume that progress directly, confirming the leak in both surfaces.
- Dependencies are installed. No molecule governs this item. The accepted contract requires uncommitted delivery and leaves bead status/closure to the coordinator.

## Decisions

- Resolve lesson progress through `entryHeadword` using the shared `['folio-lesson', section]` query. Keep a neutral fallback until content is available; preserve the existing lesson href and session selection/progress.
- Add regression coverage before changing production code, including real query transitions, classic panel text, and the Folio shell adapter. Stay within the admitted write set.
- Follow the bead's explicit test instruction to use the default TMPDIR. Run app typecheck, lint, focused tests, and the full suite without a worker override. Authenticated E2E and the real-stack visual approval remain coordinator gates because this worker must work offline.

## Progress

- 2026-10-23: Inspected the shared hook, classic panel, Folio shell adapter, framework loader, test configuration, and E2E prerequisites before editing.
- 2026-10-23: Red-first run: `pnpm test src/components/home/useResumptionCandidate.test.tsx src/folio/data/mappers.test.ts --maxWorkers=2` failed with 13 failed / 21 passed across two files. The original hook returned `vid NOG-TRAP-001`; classic panel rendered that ID, and the Folio adapter produced `Fortsätt NOG-lektion, NOG-TRAP-001`. The loading/unknown-entry tests also exposed raw IDs.
- 2026-10-23: Implemented the shared cached query and headword resolution in `useResumptionCandidate.ts`. The pure selector defaults to neutral lesson progress without a matching framework/entry. No production changes were needed in either display component, the shell adapter, or the mapper. Deep-link construction and session selection/progress remain unchanged.
- 2026-10-23: Focused verification: `pnpm test src/components/home/useResumptionCandidate.test.tsx src/folio/data/mappers.test.ts src/folio/screens/idag/FolioIdag.test.tsx src/folio/screens/idag/idagView.test.ts src/folio/FolioShell.test.tsx --maxWorkers=2` passed all 145 tests in five files. Added coverage verifies cache reuse, loading-to-headword resolution, unknown/missing anchors, request failure, section/family changes, unsupported sections, session precedence, classic panel text/link, and Folio Idag subtitle output.
- 2026-10-23: `pnpm typecheck` passed. After correcting formatting in the two changed tests, `pnpm lint` passed over 694 files with four existing informational diagnostics in untouched devbake files and no errors.
- 2026-10-23: Required full `pnpm test` run, using default TMPDIR and no `--maxWorkers`, completed in 37.50s: 171 test files passed / one failed; 5,097 tests passed / one failed. The sole failure was `src/lib/trapIndex.test.ts` → committed trap index → generator consistency, with `spawnSync /usr/bin/node EPERM`. This is the accepted contract's known child-process sandbox limitation; no generator or test changes were made to bypass it.
- 2026-10-23: `git diff --check` passed. No worker files or dependencies changed, so worker checks are not applicable.

## Handoff

- Implementation and red-first verification pending. No commit, push, merge, deployment, or authority changes are authorized for this worker.
- 2026-10-23: Supersedes the initial pending entry: implementation and offline verification are complete on base `e67b3e2c1cc60fe12939fcdba466b215e7b91f57`, with changes intentionally uncommitted. Production write: shared resume hook only; regression writes: its test and `mappers.test.ts`; evidence: this worklog and the classified vault note.
- Coordinator checks still required: rerun the trap-index generator consistency check outside the sandbox; run `pnpm test:e2e tests-e2e/dayzero.spec.ts tests-e2e/home.spec.ts` with the authorized local stack/auth setup; capture a real local-stack lesson-resume visual check and obtain the owner's visual OK before merge. E2E was not run here because its global setup calls Clerk's network APIs and the accepted worker contract requires offline work. No credentials were read or changed.
- Review disposition: self-inspected diff only; independent cross-vendor exact-head review remains pending after coordinator commit. Bead status/assignee/closure remain coordinator-owned. No new playbook gotcha was discovered; the observed child-process limitation is already documented in the accepted contract.
- 2026-10-23: Staging was attempted once and refused because the worktree index resides under the main repository's read-only Git metadata (`index.lock`: read-only filesystem). Changes remain unstaged and uncommitted; coordinator must stage them. This sandbox limitation is already covered by the astra-relay playbook. No workaround or signing attempt was made.
