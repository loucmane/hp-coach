# Worklog — hpf-qr0p.49.2

## Findings

- 2026-10-22: Claimed the accepted round-1 contract on clean base `a46fdf2bf542259535a5e409b549141842da44a6`. No molecule controls this bead. Dependencies are installed.
- HomeRoute owns the sole plan writer. The Folio view will receive that plan and the existing queries. Prototype code is read-only reference; no runtime devbake imports.

## Decisions

- Implement only the admitted Idag files and Home route. Preserve the classic render branch. Keep completed steps navigable, neutral repetition and delta copy, and mock navigation to the picker.
- Port calendar invitation behavior through the existing returnPrompt library, with the same identity/day gates. Keep no assumed return dates where the queue cannot establish them.
- Follow the bead-specific delivery contract: leave changes uncommitted, append evidence, and hand off without closing or changing assignment. Coordinator owns staging/signing, host-only checks, independent review, and desktop/phone light/dark visual approval.

## Progress

- Initial inspection complete; tests will be added before implementation.

## Handoff

- Implementation in progress.

### 2026-10-22 — implementation and verification complete

- Added the lazy Folio branch after HomeRoute's hooks. The classic HomeMobile render remains unchanged; the daily plan writer runs once. Folio navigation also preserves lesson query strings and entry anchors.
- Added a pure real-data adapter, resume/first-pass/cold-start/all-complete leads, clickable day steps (including completed steps), mock-picker navigation and quiet deferral, short practice recommendations, honest prognosis and band/caveat, trap headwords, recent result links, weekly effort, and the calendar invitation.
- Preserved the calendar invitation's identity/day/storage gates, explicit-choice-only export, focus handling and midnight expiry. Preserved both mock telemetry events with their existing dedupe keys.
- Ported only page CSS under `[data-folio] .fa-idag`; neutral controls and text, accent only on the prognosis range/mark, color-based shade, reduced motion, phone layout, narrow-desktop stacking, and a local 960 px cap. The prototype and foundation files are untouched.
- Tomorrow copy now appears only for known next-review dates. Missing review dates do not establish a tomorrow schedule. Week effort uses the worker's UTC daily buckets consistently.

Verification (default TMPDIR, at most two Vitest workers):

| Check | Result |
| --- | --- |
| Red first: `pnpm test src/folio/screens/idag --maxWorkers=2` | Four failing files: three unresolved implementation modules and three isolation assertions failing before implementation. |
| Initial new-screen tests | 59 passed. |
| Focused Idag + classic Home + foundation regressions | 12 files, 249 tests passed, including route single-writer/query/hash checks and telemetry tests. |
| `pnpm typecheck` | Passed. |
| `pnpm lint` | Passed; four informational diagnostics in untouched devbake files. |
| `pnpm test --maxWorkers=2` | 145 files: 144 passed, one failed. 4,584 tests passed; one existing trap-index generator test failed because `spawnSync /usr/bin/node` is denied with EPERM. Duration 99.83 s. |
| Final strengthened CSS/lazy-import/writer guard | 3 passed; covers the 960 px cap and absence of opacity shading. |
| `pnpm build` | Passed, including TypeScript and PWA generation. FolioIdag emitted as separate JS/CSS chunks. Existing route-file/chunk-size warnings remain. |
| `git --no-optional-locks diff --check` | Passed. |

[S:ci-wisp-asxd95k|W:hpf-qr0p.49.2|H:verify|E:249 focused pass; 4584 full pass and known generator EPERM; typecheck/lint/build pass] Final implementation remains uncommitted on base `a46fdf2bf542259535a5e409b549141842da44a6`.

Delivery evidence: route SHA-256 `0f68342d86765d79029accece48d7e19b5c92d47fea14e04bd535e22dc3ac3ae`; adapter `49b59972489a8d67c1bccd1549c683f36488daf4e0bc3aaafa8cf66667c70d05`; page CSS `bf2c2e2902f207a32a8c08b5e48c1226a10ac3290eb7775f02dc0f2ed95ddba7`. The final status inventory contains exactly the 14 admitted repository files, with no worker, dependency, devbake or foundation edits.

Remaining coordinator work:

- Stage and sign the implementation. Git metadata is at `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.2`, outside this worker's writable roots; no staging or signing attempt was made.
- Rerun the trap-index generator check outside the sandbox. Do not alter production code to accommodate EPERM.
- Run the required `home`, `dayzero`, `responsive`, and `sf1-loop` browser specs with the flag off, then visual checks of Folio Idag on a real local stack at desktop/phone, light/dark. These are not run in this offline worker: the checked-in Playwright setup requires authenticated services and server sockets.
- Obtain independent exact-head review and the owner's visual OK before merge. No merge, push, PR, status/assignee change, or bead closure performed.

Playbook-proposal — gas-city-coordinator — 2026-10-22: A screen-port brief described Frame as capped at 960 px, but Frame uses a wider studio token at 1280+ px. Cause: reader and studio limits differ. Rule: verify both viewport branches and token values when briefing a port; enforce an accepted page width locally without changing shared foundation files. This proposal is preserved here because `~/scratch/skill-gotchas/` is outside this managed worker's writable roots; coordinator should relay it to the playbook inbox.

FOLIO IDAG DONE: hpf-qr0p.49.2

### 2026-10-22 — round 2 inspection

- Accepted the round-2 polish contract at clean head `9642400ee7233ca2d074eaa041e4e68362e5d2c2`; no molecule controls sequencing. The same 14-file write set applies.
- Confirmed the reported label, loading, sentence, accessible-name and test-id issues. Count audit also found the day estimate's `1 minuter`, trap summary's `1 gånger`, one-step `klara`, and scheduler-provided trap rationale's `1 missar`. Corrections stay local to Idag.
- Decision: preserve section abbreviations in prose, use a generic short-exercise clause for trap/mixed drills, pass the stats query's pending flag through HomeRoute, and keep the existing neutral `Påbörjad` resume wording with natural Swedish dates.
- [S:ci-wisp-dij4akc|W:hpf-qr0p.49.2|H:inspect-r2|E:clean head and accepted design] Adding regression tests before production edits. Delivery remains uncommitted; coordinator owns staging/signing, host checks, independent exact-head review, visual approval and bead status.

### 2026-10-22 — round 2 red-first evidence

- Before production edits, `DEBUG_PRINT_LIMIT=500 pnpm test src/folio/screens/idag/idagView.test.ts src/folio/screens/idag/FolioIdag.test.tsx --maxWorkers=2` failed with 22 failures and 62 passes (two files, 1.59 s). Failures covered the required Swedish kind labels, singular counts, trap/mixed/title day prose, plan-card readiness, accessible names, margin label, resume age and route-level prognosis loading. An earlier run included one invalid timed-drill test fixture, corrected to the repository's `ORD · PÅ TID` marker before this recorded baseline.
- The modified-click test now observes that React leaves the event unprevented, then prevents navigation at `document` so jsdom does not emit its unsupported-navigation error.
- Follow-up accessible-name coverage exposed `Klar:ORD` on completed steps; the initial hidden separator also produced `Repetition·10`. Explicit whitespace text nodes separate the completed marker, title, gloss, step status and rationale. The singular-age fixture also covers both incoming `1 dagar sedan` and `1 dag sedan`.
- Playbook-proposal — astra-relay — 2026-10-22: An accessible-name fix with a space padded hidden span still yielded concatenated text in Idag's CSS-disabled jsdom tests. Cause: accessible-name computation trimmed whitespace inside the inline child. Rule: put explicit whitespace text nodes between inline elements and assert the complete accessible name, including completed-state prefixes and status/rationale. Proposal is preserved here and in the classified worklog for coordinator relay because `~/scratch/skill-gotchas/` is outside this worker's writable roots.

### 2026-10-22 — round 2 verification and handoff

- Completed all nine requested fixes within eight admitted app files plus this worklog. Recent kinds use local Swedish labels with the existing section/mode fallback; elapsed/estimated minutes, trap frequency, completed-step count and trap-rationale misses use singular forms correctly. Existing exam/day/question/miss wording has regression coverage; pass links retain their destinations.
- HomeRoute passes the stats query's pending flag to the prognosis margin. The missing-data explanation waits for stats; the aside is named `Översikt`. Resume age uses `idag`, `igår` and `för N dag/dagar sedan`, retaining the neutral `Påbörjad` copy and existing stale/device handling.
- Day prose uses `en kort övning` for trap/mixed drills and lower-case title initials while preserving section abbreviations. Step links have separated complete accessible names. `daily-plan-card` is absent without a resolved plan, including errors, and present for cached plans despite background errors. Modified-click coverage preserves native behavior without jsdom navigation errors.

Final verification from `app/` (default TMPDIR, at most two Vitest workers):

| Check | Result |
| --- | --- |
| `pnpm test src/folio/screens/idag --maxWorkers=2` | 4 files, 106 tests passed; 2.49 s. |
| `pnpm typecheck` | Passed. |
| `pnpm lint` | Passed; four pre-existing informational diagnostics in untouched devbake files. |
| `pnpm test --maxWorkers=2` | 144 files passed, one failed; 4,625 tests passed, one failed; 109.29 s. Sole failure: existing `src/lib/trapIndex.test.ts` generator check cannot `spawnSync /usr/bin/node` in the sandbox (`EPERM`). |
| `pnpm build` | Passed; TypeScript, Vite and PWA generation complete, with separate FolioIdag chunk. Existing route-test-file and chunk-size warnings remain. |
| `git --no-optional-locks diff --check` | Passed. |

- [S:ci-wisp-dij4akc|W:hpf-qr0p.49.2|H:verify-r2|E:106 focused pass; 4625 full pass and known generator EPERM; typecheck/lint/build pass] Changes remain uncommitted on `9642400ee7233ca2d074eaa041e4e68362e5d2c2`, branch `codex/hpf-qr0p.49.2-idag-home-in-folio`. No worker or dependency changes, so worker checks were not required.
- Delivery SHA-256: adapter `91ca0862e70a415eb8add15f1ae75f8a124613e7f1eebb1b77d00104897b0d38`; DayPath `0b9c46e60f66c8b9f29e01451b9a56f22ee9fb261450fafed0d2097ed5f0cd42`; HomeRoute `d6ff9ea20ec587eae361e96ec0d3455da09ea5ff8e739ed93bf09dfcf84db9ac`.
- Review disposition: round-2 independent review pending. Coordinator must stage/sign (git metadata is outside writable roots), rerun the generator check on the host, refresh real-stack desktop/phone light/dark checks and obtain the owner's visual OK before merge. The round-1 PASS does not cover these edits. No browser/authenticated-stack run was attempted in this offline worker.
- Bead contract re-read before handoff: unchanged. Status and assignee remain untouched; coordinator parks the bead after the final DONE note. No commit, push, PR, merge, closure or drain was performed under this bead-specific handoff contract.

FOLIO IDAG R2 DONE: hpf-qr0p.49.2
