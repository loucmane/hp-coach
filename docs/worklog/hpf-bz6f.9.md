# Worklog — hpf-bz6f.9

## Findings

- 2026-10-21: Claimed the routed first-run feature in its assigned worktree. Base HEAD is `aea6dbded9ddbedb7aeb3f480987c199191a6baf`; the worktree was clean. Both app and worker dependencies are present. The bead has no molecule controlling sequencing.
- 2026-10-21: The accepted contract requires adding `host-2027` (24 October 2027) to both calendars and passing the full worker tests. `worker/src/lib/sittings.test.ts:40–46` contains four parameterized cases asserting that `examFor(id, new Date(2027, 3, 11))` returns null. With the required future sitting, each must instead resolve to 24 October 2027. The calendar-end assertion must move to 25 October 2027, with a spring-to-autumn rollover case added.
- 2026-10-21: `worker/src/lib/sittings.test.ts` is absent from both the explicit write set and the admitted write-set metadata. Its mirror-calendar test does not remove the separate hard-coded calendar-end assertion.

## Decisions

- 2026-10-21: Follow the accepted contract: “If a fix truly needs another file, STOP and write a WAITING note naming it and why.” No source edits, dependency changes, commits, test execution, routing changes, or status changes performed.
- 2026-10-21: Do not change the admitted write set by hand. The coordinator must resolve authorization for the additional test file using the established lane procedure.

## Progress

- [S:managed-codex-worker|W:hpf-bz6f.9|H:inspect|E:base-aea6dbded9ddbedb7aeb3f480987c199191a6baf] Read the accepted design, scope, player, stats, scheduler, and calendar tests. Confirmed the missing test-file scope before implementation.
- Verification is static inspection only. No red/green test result is claimed; the source remains unchanged.

## Handoff

- WAITING: authorization for `worker/src/lib/sittings.test.ts`. Its four calendar-end cases contradict the mandatory addition of Höstprov 27, and the file is outside the admitted write set.
- Resume after the coordinator resolves the scope. Update the worker calendar-end boundary and add a rollover check, then implement the accepted first-run contract with red-first tests and both packages' required checks.
- No implementation head or review verdict exists. Base HEAD remains `aea6dbded9ddbedb7aeb3f480987c199191a6baf`. Delivery remains uncommitted; independent review and coordinator delivery are outstanding.
- Playbook proposal for `gas-city-coordinator` (2026-10-21): Calendar-extension briefs must search all calendar consumers and tests for hard-coded end-of-calendar dates before lane admission. A mirror test can coexist with fixed boundary cases; include both in the initial write set. The requested `~/scratch/skill-gotchas/` destination is outside this session's declared writable roots, so this proposal is preserved here for coordinator relay.

## Recheck — 2026-10-21 19:04 CEST

- The managed startup claim returned the existing assignment. Re-read the complete bead: no molecule is present; the design, `lanes.write_set`, and `lanes.admitted_write_set` still omit `worker/src/lib/sittings.test.ts`. The later coordinator note concerns test TMPDIR only and does not resolve the scope blocker.
- Re-inspected `worker/src/lib/sittings.test.ts` and `worker/src/lib/sittings.ts`: the four null assertions after 10 April 2027 remain unchanged, and the calendar still ends at the spring 2027 sitting. No in-scope change can both add the mandatory autumn sitting and preserve these assertions correctly.
- [S:managed-codex-worker|W:hpf-bz6f.9|H:scope-recheck|E:base-aea6dbded9ddbedb7aeb3f480987c199191a6baf] HEAD is unchanged; the only repository change is this untracked worklog. No source edits, test execution, staging, commits, status changes, or completion claim.
- WAITING: coordinator resolution of the missing test-file authorization through the lane procedure, or an accepted contract revision. Preserve the existing playbook proposal for coordinator relay. Stop under the bead's explicit additional-file rule; do not close or acknowledge a completed drain.

## Resumed implementation — 2026-10-21

- The revised accepted contract explicitly removes the autumn-2027 calendar extension and freezes all four calendar-related files. This supersedes the earlier scope blocker; no molecule controls this bead.
- Decisions: preserve the palette picker; use the existing ORD lexicon and three specified authentic questions with the single approved fallback; mount the existing SessionPlayer as `onboarding` without mistake callbacks. Keep effort and exposure, exclude assessment/mastery, and never promote a later retry of an onboarding example to an unseen first try.
- A completed first pass is a separate optional timestamp in the existing opt-in stats response. Completion requires an ended session and answers to all three distinct planned questions. The default stats response and assessment golden stay unchanged. Home uses the local date of this server timestamp, including when another device finished the pass.
- [S:managed-codex-worker|W:hpf-bz6f.9|H:red|E:2026-10-21] Before implementation: worker focused tests failed exactly for onboarding kind rejection (400 vs 201), mastery movement (0.65 vs no row), and accuracy movement (1 vs null); 48 existing tests passed. Scheduler test failed at version 11 vs 12 (91 existing tests passed). First-session helper test initially failed on the missing module; the eight welcome-flow tests failed against the old one-screen picker.
- Implementation is in progress. Work remains on integration checks, completion edge cases, E2E flow, and package-wide verification. No completion, independent-review, commit, or delivery claim.

## Implementation handoff — 2026-10-21

- Implemented the retained theme/palette step, upcoming-sitting selection with the next sitting selected, 10/20/30/45 minute preferences, the existing `ORD-ROOT-010` lexicon card, and the agreed three authentic ORD examples with the approved fallback. Every step offers a quiet skip. Existing accounts bypass the session; an active partial first pass remains resumable. Missing data and failed preference saves offer recovery and skipping.
- The player uses `onboarding`, `autoStart`, a validated stored-plan resolver, real Swedish origin labels, a custom truthful completion view, and no mistake callback. Three correct answers use the exact approved success sentence; mixed answers use the approved score-free sentence. Skipping never claims completed questions. Completion writes the existing welcome flag.
- Onboarding contributes lifetime/today/week effort, practice time, streak and exposure. It contributes nothing to accuracy, section score/pace/recency, weekly assessment, first-try prognosis, mastery or framework progress. The existing Elo allowlist excludes it. Later retries of these already-seen examples cannot become new first tries. Completed onboarding stays out of session history; the app history type reflects that exclusion.
- The opt-in stats response supplies `onboardingCompletedAt` only for a genuinely completed, ended, three-distinct-question plan. Partial retirement and duplicate answers do not qualify; the timestamp is user-scoped. Default stats and the assessment golden are unchanged.
- Scheduler schema is 12. A completed first pass with no assessment signal produces one complete, clickable `Första passet` item linking to `/lektion?section=ORD#ORD-ROOT-010`. Both stale server and local cold-start plans are replaced. Completion derivation, remount/reload, and next-day diagnostic restoration are exercised through the real hook and card.
- Updated `app/tests-e2e/dayzero.spec.ts` to walk preferences, the root, all three labelled authentic questions, the success view, Home and reload. No credentials, live browser setup, network access, or dependency changes were used.

### Verification

- [S:managed-codex-worker|W:hpf-bz6f.9|H:worker-checks|E:516-tests] Worker `pnpm typecheck`, `pnpm lint`, and `pnpm test --maxWorkers=2` pass: 25 files, 516 tests, including the unchanged assessment golden.
- [S:managed-codex-worker|W:hpf-bz6f.9|H:app-checks|E:4246-pass-one-sandbox-refusal] App `pnpm typecheck` and `pnpm lint` pass. Lint retains four pre-existing informational diagnostics outside scope. Full `pnpm test --maxWorkers=2`: 130 files pass, one fails; 4,246 tests pass and one fails solely because `src/lib/trapIndex.test.ts` cannot spawn `/usr/bin/node` (`EPERM`). This is the known sandbox generator check from the coordinator's instructions; no workaround was attempted.
- [S:managed-codex-worker|W:hpf-bz6f.9|H:home-integration|E:13-pass] After adding explicit cache/reload/card integration coverage, `pnpm test src/routes/-welcome.test.tsx --maxWorkers=2` passes all 13 tests. The added tests cover both server and local cached cold plans, completed-state derivation, the live link, reload, and tomorrow's diagnostic. The full app count above predates these two added tests.
- `git diff --check` passes. All source changes are in the admitted write set. The four calendar files frozen by the revised contract remain unchanged. The independent review has not occurred.

### Coordinator follow-through

- Base HEAD remains `aea6dbded9ddbedb7aeb3f480987c199191a6baf`. Changes are uncommitted and unstaged: the Git index lives at `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-bz6f.9`, outside this worker's writable roots. No signing, commit, push, PR, merge, deployment, status/assignee change or bead close was attempted.
- Run the trap-index generator check on the host and the updated Chromium day-zero E2E with the established test-account setup. The E2E was updated but not executed in this offline worker. Then stage/sign through the coordinator's authorized delivery path and obtain independent Claude review at the exact implementation head.
- The backend must accept `onboarding` before a frontend using that session kind is served; the optional completion timestamp is tolerant of older cached stats. No migration is required.
- Playbook-proposal (`gas-city-coordinator`, 2026-10-21): Adding a session kind can widen a history-row union even when the API explicitly excludes that kind, causing unrelated view-model type errors. During scope mapping, inspect filtered collection types as well as the session union; narrow a history-only type to match its API subset. This occurred here at `directionData.tsx`, and was resolved in the admitted `useSessions.ts` rather than broadening scope. Preserve this and the earlier calendar-boundary proposal for relay: `~/scratch/skill-gotchas/` is outside this session's writable roots.
