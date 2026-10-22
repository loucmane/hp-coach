# Folio+ foundation — hpf-qr0p.49.1

## Findings

- 2026-10-22: Claimed at base bf4c6645f3818a5a293608e40901cfde021763c1. No molecule. Dependencies installed. Prototype read from origin/coord/hpf-qr0p.48-folio-plus; bake-off files remain read-only.
- Root Frame wraps the authentication gate, outside the signed-in shell context. Move the same Frame inside the authenticated/public branches so Folio context can make it full-bleed.

## Decisions

- Device-local preview off by default. Read-only shell queries; no daily-plan generation. Missing data uses neutral subtitles.
- One stable main/content tree across widths and focus changes. Session exit opens confirmation without adding history entries.
- Port shell-only styles under data-folio; neutral ink for navigation and focus indicators follows the owner’s colour rule.

## Progress

- Inspection complete; adding acceptance tests before implementation.

## Handoff

- Implementation underway. Leave source uncommitted. Coordinator delivery, independent review, real-stack screenshots (phone/desktop, light/dark), and owner visual approval remain required.

## Implementation evidence — 2026-10-22

- Added the persisted, device-local folioPreview setting (default false), production Design words in /mer, and the account-menu return to classic.
- Added lazy FolioHost with route-free loading/error recovery; public routes, welcome and dev bake-offs bypass it. DirectionContent retains priority.
- Ported the prototype rail, icon tabs, account disclosure/sheet, Literata/Inter loading, five palettes and light/dark tokens. Every stylesheet selector is scoped to data-folio. Rail uses sticky document positioning; phone tabs are fixed; main does not scroll independently. Navigation uses neutral ink.
- Moved Frame below the signed-in host, retaining Frame on public/signed-out/loading branches. Legacy RailShell and MobileFrame suppress their navigation and main landmarks under the context. RailShell also converts the direct main supplied by BoksidanDesk into a div, preserving depth and props without changing that out-of-scope file.
- Focus registration leaves the content tree mounted and uses the latest callback. SessionPlayer opens its existing leave sheet without changing the back trap. MockRunner opens the same sheet; confirmation calls its existing abandon/void operation. Its classic abandon button remains unchanged.
- Read-only adapters consume the server plan, due/pile queries, resumable work, mock cadence, lesson bookmark/title, and first-try prognosis. They derive current completion with the existing pure function, never invoke useDailyPlan or a plan write, and never label an absent/empty plan as finished.

## Verification — 2026-10-22

- Red first: the new mapper suite failed on its absent implementation and /mer failed on the missing Design setting. The shell suite then failed on its absent module. These were observed before their implementations.
- pnpm typecheck: passed. pnpm lint: passed, with four pre-existing informational diagnostics in unchanged devbake files.
- Full app pnpm test --maxWorkers=2: 140 files passed, one file failed; 4,424 tests passed, one failed. The sole failure was trapIndex.test.ts invoking the existing generator: spawnSync /usr/bin/node EPERM. This is the documented child-process sandbox limit; the coordinator must rerun it outside the sandbox.
- Final focused regression after the confirmation/landmark refinements: eight files, 91 tests passed (Folio, MockRunner, nav contract, Frame, root boundary). Coverage includes root auth/public/dev priority, flag persistence, stable child state across width/focus changes, synced theme setters, palette/theme attributes, phone-sheet focus and Escape, axe, all subtitle branches, live read-only mapping and completion, and desktop/phone Provpass confirmation.
- pnpm build: passed, including CSS parsing, lazy FolioShell JS/CSS chunks and PWA generation. Existing test-route and large-chunk warnings remain.
- git diff --check: passed. Only admitted source/worklog paths changed; no worker, dependency, or devbake changes. Base HEAD remains bf4c6645f3818a5a293608e40901cfde021763c1; implementation is an uncommitted working-tree diff.

## Delivery handoff — 2026-10-22

- Ready for coordinator review and delivery. Git metadata is outside the sandbox write roots; leave staging and signed commit to the coordinator. No commit, push, PR, merge or publication performed.
- Pending gates: host rerun of the generator check; real local-stack desktop/phone light/dark visual checks; independent review at the resulting commit; owner visual OK before merge. No auto-merge. The bead remains open for these gates, per its accepted delivery instructions.
- Playbook proposal (astra-relay): jsdom 29.1.1 returned grouped focusable selectors in a non-document order (buttons before earlier anchors). Traverse DOM order and filter matching controls; test forward/backward focus with plain values rather than DOM-object equality.
- The required proposal write to /home/loucmane/scratch/skill-gotchas/astra-relay.md was rejected as outside this sandbox’s writable project roots. The proposal above is preserved for the coordinator to forward; no permission workaround attempted.
- Final rebuild after the RailShell landmark adaptation passed. The accepted bead contract instructs the worker to leave status/assignee unchanged and stop after the DONE note; coordinator parking and lifecycle completion remain outside this handoff.

## Round 2 inspection and decisions — 2026-10-22

- Starting tree clean at 136ea9f60f79097084eaa3a1644786492e8e2974. Accepted seven review fixes; no molecule. All fixes fit the unchanged write set.
- Add regressions before production edits: Provpass-specific confirmation and keyboard isolation; Clerk identity and rejected preference saves; standalone route exclusions; shared public registry; classic direction-loading Frame; scoped typography/focus and import boundaries.
- Keep Provpass confirmation local to MockRunner and reuse the existing lightweight dismissal helper for focus containment and restoration. Share PUBLIC_ROUTES from the admitted navigation module. Leave implementation uncommitted and hand off to the coordinator for exact-head review and owner visual approval.

## Round 2 implementation and verification — 2026-10-22

- Red first: three changed test files produced 20 failures and 60 passes before production edits. Failures covered the missing Provpass dialog/copy, Clerk name/email, rejected-save handlers, 11 standalone route cases, root/public-registry sharing, direction-loading Frame, and inherited typography scope. Import-boundary checks also gained side-effect/CSS coverage and static-import assertions for all seven named entry modules.
- MockRunner now renders its own named confirmation with the explicit void warning and continue/abort actions. Its keyboard listener is detached while open; focus is contained and restored; Escape continues the pass. Existing classic abandon behavior and the underlying void operation remain intact.
- Folio typography and focus rings now apply only to shell sections. AccountMenu reads Clerk directly with name/email/loading fallbacks. Navigation excludes the requested bake-off/lab families and shares PUBLIC_ROUTES with the root gate. DirectionContent wraps the entire Suspense in Frame. ThemePicker catches rejected mode/palette saves.
- Focused regression: four files, 110 tests passed, including existing MockRunner tests and desktop/phone confirmation, A–E/arrows/M isolation, resumed shortcuts, focus containment/restoration, axe, identity and rejected-save tests.
- App typecheck passed. Final lint passed with the same four informational diagnostics in unchanged devbake files; formatting findings in changed files were corrected. Git diff whitespace check passed.
- Git metadata resolves to /home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.1, outside this session's writable roots. Staging/signing stays with the coordinator; no direct git mutation attempted.

## Round 2 delivery handoff — 2026-10-22

- Full app suite: 140 files passed, one failed; 4,463 tests passed, one failed (4,464 total). The sole failure remains the existing trap-index generator subprocess check: spawnSync /usr/bin/node EPERM. Coordinator must rerun it outside the sandbox; no test bypass or sandbox workaround was attempted.
- Production build passed: TypeScript, Vite, separate FolioShell JS/CSS chunks and PWA generation. Existing route-test-file and large-chunk warnings remain. No worker code was changed, so worker checks were not required.
- Final implementation remains an uncommitted diff on 136ea9f60f79097084eaa3a1644786492e8e2974. Eleven admitted files changed, including this worklog; no dependency, worker or bake-off changes. All seven review fixes are complete within scope.
- Round 1's independent review was PASS per the coordinator's accepted brief. Round 2 still needs coordinator staging/signing, host generator verification, review at the resulting exact head, local-stack desktop/phone light/dark visual verification and the owner's visual OK before merge. No auto-merge.
- Bead status and assignee remain unchanged. The accepted round-2 contract directs the worker to stop after its DONE note and leaves parking/closure to the coordinator.

FOLIO FOUNDATION R2 DONE: hpf-qr0p.49.1

## Round 3 inspection and decisions — 2026-10-22

- Accepted round-3 contract at clean head 66c0841eabddbc58d454d96f9c5111d30df151f1; no molecule. Work remains in the same admitted files. Round 2 has coordinator host verification and independent Claude PASS; this round requires fresh delivery checks.
- Frame currently removes the inner desktop canvas as well as its outer chrome under Folio. Restore the existing reader/studio width caps and auto margins, which provide the classic desktop horizontal gutters, while omitting duplicate backgrounds. Keep phone layout and the stable child tree intact.
- Add failing tests before fixes: desktop Frame and running Provpass canvas, verification-route exclusions, CSS URL/template-literal bake-off imports, static shell re-exports, and grouped root typography rules across all three Folio stylesheets.
- Leave changes uncommitted. Coordinator owns staging/signing, host-only checks, independent review, real-stack visual verification and owner visual OK. Preserve bead status and assignee and stop after the DONE note, per the accepted delivery contract.

## Round 3 implementation and focused verification — 2026-10-22

- Red first: the three changed test files produced 25 expected failures and 94 passes before fixes. Failures covered missing reader/studio content caps, the running desktop Provpass canvas, eight verification routes, five CSS URL/template-literal imports, four static re-export forms, and five grouped/conditional root-typography cases.
- Frame now retains its desktop canvas class, width cap, auto margins and flex composition under Folio while leaving duplicate backgrounds off. The original studio token supplies horizontal gutters through the viewport-minus-96px cap; reader retains its 960px cap. Phone rendering is unchanged. The Provpass integration test now includes the real Frame, and the reader/studio test compares its dimensions against the classic Frame.
- Root typography checks cover tokens.css, shell.css and palette.css, including grouped selectors, theme-qualified roots and media rules. Import checks recognize CSS url() and template-literal dynamic imports; static FolioShell checks inspect both import and export declarations, retaining type-only/lazy exceptions.
- Navigation excludes all top-level -verify route families and /dtk-browser, including descendants. Production destination coverage retains Idag, Öva, Provpass/results, Uppslag, Framsteg and drills.
- Focused command: pnpm test src/folio/FolioShell.test.tsx src/folio/nav.test.ts src/routes/-root-direction-shell.test.ts src/components/Frame.test.tsx src/components/mock/MockRunner.test.tsx --maxWorkers=2. Result: five files, 150 tests passed. Includes phone/desktop confirmation, stable children across widths, classic-off behavior and accessibility checks.
- App typecheck passed. Final lint passed with the same four informational diagnostics in unchanged devbake files. Diff whitespace check passed. Full app suite and production build follow.
- Source inspection confirms Idag, Öva and Framsteg still own their hpc-m3-frame content wrapper, Uppslag its content cap, and drills their existing padding. Actual desktop/phone light/dark visual comparison remains a coordinator host check; unit tests do not establish rendered pixel layout.
- Git metadata resolves outside writable roots to /home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.1. Staging/signing remains with the coordinator; no git mutation attempted.

## Round 3 delivery handoff — 2026-10-22

- Full app pnpm test --maxWorkers=2: 140 files passed, one failed; 4,502 tests passed, one failed (4,503 total). The sole failure is the existing trapIndex.test.ts generator subprocess check, blocked by spawnSync /usr/bin/node EPERM. Leave the host rerun to the coordinator; no bypass attempted.
- Production pnpm build passed: TypeScript, Vite, separate FolioShell JS/CSS chunks and PWA generation. Existing route-test-file and large-chunk warnings remain. Typecheck, lint and whitespace checks passed. No worker code changed, so worker checks are not required.
- All five fixes are complete within the admitted write set. Final implementation is an uncommitted diff on 66c0841eabddbc58d454d96f9c5111d30df151f1; six repository files changed, including this worklog. No dependency or bake-off edits. No new playbook gotcha: generator EPERM and external git-metadata limits are already documented.
- Coordinator next: stage/sign, rerun the generator on the host, obtain independent review at the resulting exact head, compare Idag/Öva/Uppslag/Framsteg/drills and a running Provpass on the real stack at desktop/phone in light/dark, then obtain owner visual OK. The desktop Provpass header, question grid and submit/uncertainty controls should now sit inside the classic centered canvas. Round 3 has not had independent review or a rendered visual check.
- Bead status and assignee remain unchanged. Per the accepted contract, stop after the DONE note; coordinator owns parking/closure and lifecycle completion. No commit, merge or publication performed.

FOLIO FOUNDATION R3 DONE: hpf-qr0p.49.1
