# Worklog — hpf-qr0p.8

## Findings

- 2026-10-19: Claimed as ci-wisp-64700va in the assigned worktree, clean at b777074def8517fb7a3053fb103524a6eb57ba90. No molecule controls this bead.
- Root and route modules are eager; the store and choice labels must have no runtime dependency on the bake-off registry. The registry already lazy-loads individual stages.

## Decisions

- Keep the selection device-local, validate stored values, and gate effective selection and writes with isDevSurface. Keep small choice labels in the store and test them against the registry.
- Cover only / and /drill. Portal the lazy shell to the viewport, with space reserved for its dev controls. Keep stage navigation local. Catch shell/stage errors in the eager root and render the original routed content.
- The accepted bead contract requests uncommitted delivery and no bead closure. Coordinator owns delivery and independent review.

## Progress

- [S:ci-wisp-64700va|W:hpf-qr0p.8|H:inspect|E:clean-base] Read the accepted contract and existing store, route, palette, frame, registry and test conventions.
- [S:ci-wisp-64700va|W:hpf-qr0p.8|H:red|E:missing-store] Before implementation, both new store/bundle suites failed because designStore did not exist.
- [S:ci-wisp-64700va|W:hpf-qr0p.8|H:verify-initial|E:full-suite] Initial implementation passed app typecheck, lint (four existing informational findings) and all 102 test files / 1315 tests.
- [S:ci-wisp-64700va|W:hpf-qr0p.8|H:red|E:pending-route-mount] Self-review found /drill?start=1 auto-starts a real session on mount. A new mount-effect assertion failed (one normal route mount) with routed content as the shell-loading fallback. Replaced it with a neutral loading view and an off button; normal content is now reserved for off, uncovered routes and errors.
- [S:ci-wisp-64700va|W:hpf-qr0p.8|H:red|E:overlay-stacking] The app stylesheet gives #root a stacking context at z-index 1. A body-portaled shell would cover an in-root command palette despite its z-index 60. Added a failing palette portal assertion, moved the palette to document.body, and contained stage stacking below the dev strip.
- [S:ci-wisp-64700va|W:hpf-qr0p.8|H:verify-final|E:green] Final app checks: pnpm typecheck PASS; pnpm lint PASS (468 files, four pre-existing informational findings under devbake); pnpm test --maxWorkers=2 PASS (102 files, 1315 tests, 63.73 seconds). git diff --check PASS.
- Acceptance coverage: all eight selections and off through Command Palette and /mer; reload persistence and unavailable/corrupt storage; non-dev and uncovered-route import gating; home/drill mapping; local screen transitions; theme and viewport updates; switcher active state; normal app restoration; rejected lazy chunk and rendering failure recovery; static bundle guards and label alignment. Red-first regressions prove no normal-route mount while the shell loads and body-level palette placement.

## Handoff

- Implementation and verification in progress.
- Playbook-proposal for astra-relay, 2026-10-19: jsdom interaction tests did not reveal a portaled takeover covering the command palette. Cause: the app root creates a stacking context; a higher child z-index cannot outrank a body-level sibling. Rule: inspect ancestor stacking contexts when adding portals, put global overlays in a shared layer, and contain stage stacking below persistent escape controls. Kept here for coordinator relay because ~/scratch/skill-gotchas is outside this managed session's writable roots.
- 2026-10-19 final handoff (supersedes the in-progress entry above): implementation is complete within all 14 admitted repository paths, plus the required classified worklog. No files under devbake were changed. Base HEAD remains b777074def8517fb7a3053fb103524a6eb57ba90; changes are unstaged and uncommitted, so there is no implementation commit to review yet. Bead remains open/in_progress by contract. Coordinator should commit the reviewed tree and arrange independent Claude review at that commit before delivery. No build, browser layout smoke test or remote operations were run; no required local check was sandbox-blocked. Directions remain fixture-backed with local navigation, as documented in docs/redesign/direction-switcher.md.
