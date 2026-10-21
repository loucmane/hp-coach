# Worklog — hpf-bz6f.20

## Findings

- 2026-10-21: Claimed the plain bead; no molecule controls sequencing. Base: `a22db8887ff40474c3483892fff7dfb8e30d07ea`. Worktree was clean and app dependencies are present.
- Item 5 also needs `app/src/screens/HomeMobile.test.tsx:133`, which asserts the forbidden completion copy. That file is outside the admitted write set. Per contract, skip the copy item pending coordinator scope approval; a WAITING note is on the bead.

## Decisions

- Keep full repetition labels by default and opt Home into short labels. Decode detours before uppercasing their marker and preserve framework, section, and question in resume URLs.
- Limit plain-section timed adoption to valid pre-2026-10-22 UTC timestamps and full matching timed plans. Preserve the legacy section identity when passing an adopted session to SessionPlayer.
- Use a two-second absolute timing tolerance. Keep worked-example announcement regions mounted before their prompt/answer appears, and suppress summary transforms without removing keyboard focus styling.
- Leave changes uncommitted. Coordinator owns delivery and bead disposition under the accepted contract.

## Progress

- Inspection complete; regression tests next.

## Handoff

- In progress. Item 5 is waiting for scope approval; all other accepted items are being implemented.

## Verification — 2026-10-21

- Red first: the seven focused files initially reported 16 failures / 66 passes. Failures reproduced raw detour labels/URLs, the short Historik label, both legacy timed-session replacements, and all four ±1/±2-second pacing cases. One initial failure was test setup (Vite asset URL rewriting), corrected before testing the generator change.
- Worked-example red confirmation after correcting test setup: 3 failures / 12 passes, specifically the missing shebang flag, full-width summary transform, and prompt/answer outside mounted live regions.
- Green focused run: `pnpm test src/lib/sessionLabel.test.ts src/lib/timedDrill.test.ts src/components/home/RecentPassesCard.test.tsx src/components/home/useResumptionCandidate.test.tsx src/routes/-drill.timed.test.tsx src/components/drill/TempoLine.test.tsx src/components/lesson/WorkedExample.test.tsx src/data/workedExamples.test.ts --maxWorkers=2` — 8 files, 89 tests passed, no unhandled errors. The detour integration fixture supplies the framework loader, so it stays offline.
- Generator `--check` passed through the existing manifest test. `git diff` confirms the generated file changes only its command header; all manifest rows are unchanged.
- `pnpm typecheck`: exit 0. `pnpm lint`: exit 0, 581 files checked, four pre-existing informational suggestions in unrelated bake-off files. `git diff --check`: exit 0.
- Full `pnpm test --maxWorkers=2` is running. No worker files changed.

## Playbook-proposal — astra-relay

- 2026-10-21: A Vitest filesystem assertion using `readFileSync(new URL(relativePath, import.meta.url))` failed with “URL must be of scheme file”: Vite rewrote the static URL as an asset URL in jsdom. Resolve disk fixtures with `path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath)` instead. Proposal retained here for coordinator forwarding because `~/scratch/skill-gotchas/` is outside this managed session's writable roots.

## Final verification and handoff — 2026-10-21

- Full app suite: `pnpm test --maxWorkers=2` completed in 108.81 seconds: **4,344 passed, 1 failed; 136 files passed, 1 failed**. The sole failure is the existing `src/lib/trapIndex.test.ts` generator parity check: `spawnSync /usr/bin/node EPERM`. This is the known sandbox child-process restriction; no application assertion failed. Coordinator must rerun this check outside the sandbox. No workaround or policy widening attempted.
- Items 1–4 and 6 are implemented and self-reviewed. Historik gets `Repetition` through the default shared formatter; Home explicitly requests `Rep`. Detours keep section/framework/question identity through the real URL parser and reuse the paused session. Legacy timed adoption preserves cursor and elapsed time for both ORD and LÄS; missing/invalid/at-cutoff timestamps and invalid plan shapes do not qualify. Pacing uses the inclusive ±2,000 ms boundary. Worked-example prompt and answer appear inside an already mounted polite live region, and summaries retain focus styling without scaling.
- Generated manifest content is unchanged apart from its command header. No worker files or dependencies changed.
- Delivery is **uncommitted and unstaged**, based on HEAD `a22db8887ff40474c3483892fff7dfb8e30d07ea`. The Git index resolves to `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-bz6f.20`, outside the managed writable roots; staging/signing/delivery remain with the coordinator. No commit or signing attempted. Independent review remains pending after coordinator commit.
- **WAITING: item 5** requires `app/src/screens/HomeMobile.test.tsx:133` outside the admitted write set, because it asserts `Dagens klart.` in the real completion panel. Item 5 was skipped as the contract directs. The copy and existing assertion remain unchanged; authorize that file through the normal scope process or deliver the copy separately.
- Coordinator next: stage/commit the reviewed changes, run the blocked trap-index check on the host, obtain independent review, resolve the item-5 scope issue, and park/deliver the bead. No bead closure, assignee/status edit, or drain was performed, following the accepted contract's note-and-stop rule.
- Playbook proposal for `astra-relay` is above and needs forwarding to the permanent gotcha intake.

FOLLOWUPS DONE: hpf-bz6f.20
