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
